import { test } from 'node:test';
import assert from 'node:assert/strict';
import Anthropic from '@anthropic-ai/sdk';
import express from 'express';
import type { AddressInfo } from 'net';
import {
  AnthropicProvider,
  GeminiProvider,
  LLMError,
  LLMGateway,
  MockProvider,
  OpenAICompatibleProvider,
  configSchema,
  createGatewayFromConfig,
  type ModelInfo,
} from '../src/llm';

type MockModel = Omit<ModelInfo, 'provider'>;

const cheap: MockModel = {
  id: 'cheap',
  contextWindow: 8_000,
  maxOutputTokens: 4_000,
  pricing: { inputPerMTok: 0.1, outputPerMTok: 0.4 },
  capabilities: ['chat'],
  qualityScore: 50,
  tier: 'economy',
};
const mid: MockModel = {
  id: 'mid',
  contextWindow: 200_000,
  maxOutputTokens: 16_000,
  pricing: { inputPerMTok: 1, outputPerMTok: 5 },
  capabilities: ['chat', 'tools', 'vision'],
  qualityScore: 75,
  tier: 'standard',
};
const best: MockModel = {
  id: 'best',
  contextWindow: 1_000_000,
  maxOutputTokens: 64_000,
  pricing: { inputPerMTok: 4, outputPerMTok: 20 },
  capabilities: ['chat', 'tools', 'vision', 'reasoning'],
  qualityScore: 95,
  tier: 'premium',
};

const hi = [{ role: 'user' as const, content: 'hello' }];

function setup(opts: ConstructorParameters<typeof LLMGateway>[0] = {}) {
  const a = new MockProvider('alpha', [cheap, best]);
  const b = new MockProvider('beta', [mid]);
  let clock = Date.parse('2026-10-14T12:00:00Z');
  const gw = new LLMGateway({
    providers: [a, b],
    sleep: async () => {},
    now: () => clock,
    ...opts,
  });
  return { gw, a, b, advance: (ms: number) => (clock += ms) };
}

test('strategy drives model selection', () => {
  const { gw } = setup();
  assert.equal(gw.plan({ messages: hi, strategy: 'cost' }).candidates[0].model, 'cheap');
  assert.equal(gw.plan({ messages: hi, strategy: 'quality' }).candidates[0].model, 'best');
  assert.equal(gw.plan({ messages: hi, strategy: 'latency' }).candidates[0].model, 'cheap');
  const balanced = gw.plan({ messages: hi, strategy: 'balanced' }).candidates.map((c) => c.model);
  assert.equal(balanced.length, 3);
});

test('capability, context-window, quality and cost constraints filter candidates', () => {
  const { gw } = setup();
  const plan = gw.plan({ messages: hi, requiredCapabilities: ['reasoning'] });
  assert.deepEqual(plan.candidates.map((c) => c.model), ['best']);
  assert.ok(plan.rejected.some((r) => r.model === 'cheap' && r.reason.includes('reasoning')));

  const long = [{ role: 'user' as const, content: 'x'.repeat(100_000) }];
  assert.ok(!gw.plan({ messages: long, strategy: 'cost' }).candidates.some((c) => c.model === 'cheap'));

  assert.ok(gw.plan({ messages: hi, minQuality: 80 }).candidates.every((c) => c.model === 'best'));
  assert.ok(gw.plan({ messages: hi, maxCostUsd: 0.005 }).candidates.every((c) => c.model !== 'best'));
});

test('throws no_candidates with reasons when nothing qualifies', async () => {
  const { gw } = setup();
  await assert.rejects(gw.chat({ messages: hi, minQuality: 99 }), (e: LLMError) => e.kind === 'no_candidates');
});

test('pinned model goes first; other models remain as fallbacks', async () => {
  const { gw, a } = setup();
  a.script('cheap', { type: 'error', kind: 'server' });
  const res = await gw.chat({ messages: hi, model: 'cheap', strategy: 'quality' });
  assert.equal(res.attempts[0].model, 'cheap');
  assert.notEqual(res.model, 'cheap');
});

test('"provider/model" ids and allowFallback=false', async () => {
  const { gw, b } = setup();
  b.script('mid', { type: 'error', kind: 'server' });
  await assert.rejects(gw.chat({ messages: hi, model: 'beta/mid', allowFallback: false }), (e: LLMError) => {
    assert.equal(e.attempts?.length, 2); // first try + one retry, no other models
    return e.kind === 'server';
  });
});

test('retries a transient error on the same model, then succeeds', async () => {
  const { gw, a } = setup();
  a.script('best', { type: 'error', kind: 'rate_limit' }, { type: 'ok', text: 'second time lucky' });
  const res = await gw.chat({ messages: hi, strategy: 'quality' });
  assert.equal(res.text, 'second time lucky');
  assert.deepEqual(
    res.attempts.map((x) => [x.model, x.ok]),
    [
      ['best', false],
      ['best', true],
    ]
  );
});

test('falls back across providers when a model keeps failing', async () => {
  const { gw, a } = setup();
  a.script('best', { type: 'error', kind: 'server' });
  const res = await gw.chat({ messages: hi, strategy: 'quality' });
  assert.equal(res.provider, 'beta');
  assert.equal(res.model, 'mid');
  assert.equal(res.attempts.filter((x) => !x.ok).length, 2);
});

test('does not fall back on invalid requests', async () => {
  const { gw, a, b } = setup();
  a.script('best', { type: 'error', kind: 'invalid_request' });
  await assert.rejects(gw.chat({ messages: hi, strategy: 'quality' }), (e: LLMError) => e.kind === 'invalid_request');
  assert.equal(a.calls.length, 1);
  assert.equal(b.calls.length, 0);
});

test('a refusal moves to the next model when fallbackOnRefusal is on', async () => {
  const { gw, a } = setup();
  a.script('best', { type: 'refusal' });
  const res = await gw.chat({ messages: hi, strategy: 'quality' });
  assert.equal(res.model, 'mid');
  assert.equal(res.attempts[0].errorKind, 'refusal');

  const { gw: strict, a: a2 } = setup({ fallbackOnRefusal: false });
  a2.script('best', { type: 'refusal' });
  assert.equal((await strict.chat({ messages: hi, strategy: 'quality' })).finishReason, 'refusal');
});

test('circuit breaker takes a failing model out of rotation and probes after cooldown', async () => {
  const { gw, a, advance } = setup({ retry: { maxRetriesPerModel: 0 }, circuitBreaker: { failureThreshold: 2, cooldownMs: 1000 } });
  a.script('best', { type: 'error', kind: 'server' }, { type: 'error', kind: 'server' }, { type: 'ok', text: 'recovered' });
  await gw.chat({ messages: hi, model: 'best' });
  await gw.chat({ messages: hi, model: 'best' });
  assert.ok(gw.plan({ messages: hi }).rejected.some((r) => r.model === 'best'));

  advance(1001);
  const res = await gw.chat({ messages: hi, model: 'best' });
  assert.equal(res.text, 'recovered');
  assert.deepEqual(gw.stats().circuits, {});
});

test('auth failure disables the whole provider', async () => {
  const { gw, a } = setup();
  a.script('best', { type: 'error', kind: 'auth' });
  await gw.chat({ messages: hi, strategy: 'quality' });
  const rejected = gw.plan({ messages: hi }).rejected.map((r) => r.model).sort();
  assert.deepEqual(rejected, ['best', 'cheap']);
});

test('rate limit with Retry-After opens the circuit for that long and falls back immediately', async () => {
  const { gw, a, advance } = setup();
  a.script('best', { type: 'error', kind: 'rate_limit', retryAfterMs: 5000 }, { type: 'ok' });
  const res = await gw.chat({ messages: hi, strategy: 'quality' });
  assert.equal(res.model, 'mid');
  advance(5001);
  assert.equal(gw.plan({ messages: hi, strategy: 'quality' }).candidates[0].model, 'best');
});

test('tracks cost, tokens and per-tag spend', async () => {
  const { gw, b } = setup();
  b.script('mid', { type: 'ok', text: 'x', outputTokens: 1_000_000 });
  const res = await gw.chat({ messages: hi, model: 'mid', tag: 'search' });
  // 2 input tokens at $1/M + 1M output tokens at $5/M
  assert.ok(Math.abs(res.costUsd - (5 + 2 / 1_000_000)) < 1e-9);
  const m = gw.stats().metrics;
  assert.equal(m.byTag.search.requests, 1);
  assert.equal(m.byModel[0].outputTokens, 1_000_000);
  assert.ok(m.totals.costUsd > 5);
});

test('budget: economizes near the limit and refuses past it', async () => {
  const { gw, a, b } = setup({ budget: { dailyUsd: 10, economizeAt: 0.5 } });
  b.script('mid', { type: 'ok', outputTokens: 1_000_000 }); // $5
  await gw.chat({ messages: hi, model: 'mid' });
  assert.equal(gw.plan({ messages: hi }).strategy, 'cost');
  assert.equal(gw.stats().budget.economizing, true);

  a.script('cheap', { type: 'ok', outputTokens: 20_000_000 }); // $8 -> over the limit afterwards
  await gw.chat({ messages: hi });
  await assert.rejects(gw.chat({ messages: hi }), (e: LLMError) => e.kind === 'budget');
});

test('budget resets on a new UTC day', async () => {
  const { gw, b, advance } = setup({ budget: { dailyUsd: 5 } });
  b.script('mid', { type: 'ok', outputTokens: 1_000_000 });
  await gw.chat({ messages: hi, model: 'mid' });
  await assert.rejects(gw.chat({ messages: hi, model: 'mid' }), (e: LLMError) => e.kind === 'budget');
  advance(24 * 3600_000);
  assert.equal(gw.stats().budget.daySpendUsd, 0);
});

test('response cache serves repeats and coalesces concurrent identical requests', async () => {
  const { gw, a } = setup();
  const req = { messages: hi, strategy: 'quality' as const, cache: true };
  const [r1, r2] = await Promise.all([gw.chat(req), gw.chat(req)]);
  const r3 = await gw.chat(req);
  assert.equal(a.calls.length, 1);
  assert.equal(r1.cached, false);
  assert.equal(r2.cached, true);
  assert.equal(r3.cached, true);
  assert.equal(r3.costUsd, 0);
  assert.equal(gw.stats().metrics.cache.hits, 1);

  // Different routing hints must not share a cache entry.
  await gw.chat({ ...req, strategy: 'cost' });
  assert.equal(a.calls.length, 2);
});

test('cache entries expire', async () => {
  const { gw, a, b, advance } = setup();
  const req = { messages: hi, cache: { ttlMs: 1000 } };
  await gw.chat(req);
  advance(1001);
  await gw.chat(req);
  assert.equal(a.calls.length + b.calls.length, 2);
  assert.equal(gw.stats().metrics.cache.hits, 0);
});

test('caller cancellation stops the request without falling back', async () => {
  const { gw, a, b } = setup();
  a.script('best', { type: 'ok', latencyMs: 200 });
  const ctrl = new AbortController();
  const p = gw.chat({ messages: hi, strategy: 'quality', signal: ctrl.signal });
  setTimeout(() => ctrl.abort(), 10);
  await assert.rejects(p, (e: LLMError) => e.kind === 'cancelled');
  assert.equal(b.calls.length, 0);
});

test('per-attempt timeout is treated as retryable and falls back', async () => {
  const gw = new LLMGateway({ timeoutMs: 20, retry: { maxRetriesPerModel: 0 }, sleep: async () => {} });
  const slow = new MockProvider('slow', [best]).script('best', { type: 'ok', latencyMs: 500 });
  const fast = new MockProvider('fast', [mid]);
  gw.registerProvider(slow).registerProvider(fast);
  const res = await gw.chat({ messages: hi, strategy: 'quality' });
  assert.equal(res.provider, 'fast');
  assert.equal(res.attempts[0].errorKind, 'timeout');
});

test('error-rate demotion needs enough samples and decays with time', async () => {
  const { gw, a, advance } = setup({ retry: { maxRetriesPerModel: 0 }, circuitBreaker: { failureThreshold: 100 } });
  a.script('best', { type: 'error', kind: 'server' });
  await gw.chat({ messages: hi, model: 'best' });
  // One failure: penalized but still ranked first on quality.
  assert.equal(gw.plan({ messages: hi, strategy: 'quality' }).candidates[0].model, 'best');
  await gw.chat({ messages: hi, model: 'best' });
  await gw.chat({ messages: hi, model: 'best' });
  assert.notEqual(gw.plan({ messages: hi, strategy: 'quality' }).candidates[0].model, 'best');
  advance(5 * 60_000 + 1);
  assert.equal(gw.plan({ messages: hi, strategy: 'quality' }).candidates[0].model, 'best');
});

test('metrics events reach subscribers', async () => {
  const { gw } = setup();
  const seen: string[] = [];
  gw.metrics.onEvent((e) => seen.push(`${e.provider}/${e.model}:${e.ok}`));
  await gw.chat({ messages: hi, strategy: 'cost' });
  assert.deepEqual(seen, ['alpha/cheap:true']);
});

// ---- Provider adapters ----

test('AnthropicProvider builds the request and maps the response', async () => {
  let sent: any;
  const fakeClient = {
    beta: {
      messages: {
        create: async (params: any) => {
          sent = params;
          return {
            model: params.model,
            stop_reason: 'end_turn',
            content: [
              { type: 'thinking', thinking: '' },
              { type: 'text', text: 'Hello ' },
              { type: 'text', text: 'there' },
            ],
            usage: { input_tokens: 10, output_tokens: 5, cache_read_input_tokens: 100, cache_creation_input_tokens: 0 },
          };
        },
      },
    },
  } as unknown as Anthropic;
  const p = new AnthropicProvider({ client: fakeClient });
  const opus = p.models().find((m) => m.id === 'claude-opus-5-5')!;

  const res = await p.chat(opus, {
    system: 'Be brief.',
    messages: [{ role: 'system', content: 'Use English.' }, ...hi],
    temperature: 0.2,
    effort: 'low',
    maxTokens: 500,
  });
  assert.equal(res.text, 'Hello there');
  assert.equal(res.finishReason, 'stop');
  assert.deepEqual(res.usage, { inputTokens: 10, outputTokens: 5, cachedInputTokens: 100, cacheWriteTokens: 0 });
  assert.equal(sent.system, 'Be brief.\n\nUse English.');
  assert.deepEqual(sent.messages, [{ role: 'user', content: 'hello' }]);
  assert.equal(sent.temperature, undefined, 'Opus 5.5 rejects temperature, so it must not be sent');
  assert.deepEqual(sent.output_config, { effort: 'low' });
  assert.equal(sent.fallbacks, 'default');
  assert.deepEqual(sent.betas, ['server-side-fallback-2026-07-01']);

  const haiku = p.models().find((m) => m.id === 'claude-haiku-4-5')!;
  await p.chat(haiku, { messages: hi, temperature: 0.2, effort: 'low' });
  assert.equal(sent.temperature, 0.2);
  assert.equal(sent.output_config, undefined);
  assert.equal(sent.fallbacks, undefined);
});

test('AnthropicProvider maps SDK errors to error kinds', async () => {
  const headers = new Headers({ 'retry-after': '3' });
  const fakeClient = {
    beta: {
      messages: {
        create: async () => {
          throw new Anthropic.RateLimitError(429, { type: 'error' }, 'slow down', headers);
        },
      },
    },
  } as unknown as Anthropic;
  const p = new AnthropicProvider({ client: fakeClient });
  await assert.rejects(p.chat(p.models()[0], { messages: hi }), (e: LLMError) => {
    assert.equal(e.kind, 'rate_limit');
    assert.equal(e.retryAfterMs, 3000);
    return true;
  });
});

function fakeFetch(status: number, body: unknown, capture: { url?: string; init?: RequestInit } = {}): typeof fetch {
  return (async (url: string, init: RequestInit) => {
    capture.url = url;
    capture.init = init;
    return new Response(JSON.stringify(body), { status, headers: { 'retry-after': '2' } });
  }) as unknown as typeof fetch;
}

test('OpenAICompatibleProvider maps request, usage and errors', async () => {
  const cap: { url?: string; init?: RequestInit } = {};
  const p = new OpenAICompatibleProvider({
    name: 'openai',
    baseUrl: 'https://api.example.com/v1/',
    apiKey: 'test-key',
    models: [{ ...mid, provider: 'openai', supportsEffort: true }],
    fetchImpl: fakeFetch(
      200,
      {
        model: 'mid-2026',
        choices: [{ message: { content: 'hey' }, finish_reason: 'length' }],
        usage: { prompt_tokens: 50, completion_tokens: 7, prompt_tokens_details: { cached_tokens: 20 } },
      },
      cap
    ),
  });
  const res = await p.chat(p.models()[0], { system: 'sys', messages: hi, effort: 'max', maxTokens: 99 });
  assert.equal(cap.url, 'https://api.example.com/v1/chat/completions');
  const body = JSON.parse(String(cap.init!.body));
  assert.equal(body.max_completion_tokens, 99);
  assert.equal(body.reasoning_effort, 'high');
  assert.equal(body.messages[0].role, 'system');
  assert.equal((cap.init!.headers as Record<string, string>).authorization, 'Bearer test-key');
  assert.equal(res.finishReason, 'length');
  assert.deepEqual(res.usage, { inputTokens: 30, cachedInputTokens: 20, outputTokens: 7 });

  const failing = new OpenAICompatibleProvider({
    name: 'openai',
    baseUrl: 'https://api.example.com/v1',
    models: [{ ...mid, provider: 'openai' }],
    fetchImpl: fakeFetch(503, { error: 'overloaded' }),
  });
  await assert.rejects(failing.chat(failing.models()[0], { messages: hi }), (e: LLMError) => {
    return e.kind === 'server' && e.retryAfterMs === 2000 && e.status === 503;
  });
});

test('GeminiProvider maps request, thinking tokens and safety blocks', async () => {
  const cap: { url?: string; init?: RequestInit } = {};
  const p = new GeminiProvider({
    apiKey: 'test-key',
    models: [{ ...mid, provider: 'gemini' }],
    fetchImpl: fakeFetch(
      200,
      {
        candidates: [{ content: { parts: [{ text: 'thinking...', thought: true }, { text: 'answer' }] }, finishReason: 'STOP' }],
        usageMetadata: { promptTokenCount: 40, candidatesTokenCount: 5, thoughtsTokenCount: 30, cachedContentTokenCount: 10 },
      },
      cap
    ),
  });
  const res = await p.chat(p.models()[0], {
    system: 'sys',
    messages: [...hi, { role: 'assistant', content: 'hi' }, { role: 'user', content: 'again' }],
  });
  assert.equal(cap.url, 'https://generativelanguage.googleapis.com/v1beta/models/mid:generateContent');
  const body = JSON.parse(String(cap.init!.body));
  assert.deepEqual(body.systemInstruction, { parts: [{ text: 'sys' }] });
  assert.deepEqual(body.contents.map((c: any) => c.role), ['user', 'model', 'user']);
  assert.equal(res.text, 'answer');
  assert.deepEqual(res.usage, { inputTokens: 30, cachedInputTokens: 10, outputTokens: 35 });

  const blocked = new GeminiProvider({
    apiKey: 'k',
    models: [{ ...mid, provider: 'gemini' }],
    fetchImpl: fakeFetch(200, { promptFeedback: { blockReason: 'SAFETY' } }),
  });
  assert.equal((await blocked.chat(blocked.models()[0], { messages: hi })).finishReason, 'refusal');
});

test('config: builds providers, skipping ones without keys', () => {
  const config = configSchema.parse({
    defaultStrategy: 'cost',
    budget: { dailyUsd: 20 },
    providers: [
      { type: 'anthropic' },
      { type: 'openai-compatible', name: 'ollama', baseUrl: 'http://localhost:11434/v1', maxTokensField: 'max_tokens', models: [cheap] },
      { type: 'gemini', models: [mid] },
    ],
  });
  const gw = createGatewayFromConfig(config, { ANTHROPIC_API_KEY: 'test-key' });
  assert.deepEqual(gw.registry.providerNames(), ['anthropic', 'ollama']);
  assert.equal(gw.plan({ messages: hi }).strategy, 'cost');
  assert.ok(gw.registry.find('claude-opus-5-5'));
  assert.equal(gw.stats().budget.dailyLimitUsd, 20);
});

// ---- HTTP routes ----

test('HTTP: /api/llm requires the token and serves chat, plan, models, stats', async () => {
  const { setGateway } = await import('../src/controllers/llmController');
  const { default: llmRoutes } = await import('../src/routes/llmRoutes');
  const { gw } = setup();
  setGateway(gw);

  const app = express();
  app.use(express.json());
  app.use('/api/llm', llmRoutes);
  const server = app.listen(0);
  const base = `http://127.0.0.1:${(server.address() as AddressInfo).port}/api/llm`;
  const prev = process.env.LLM_API_TOKEN;
  try {
    delete process.env.LLM_API_TOKEN;
    assert.equal((await fetch(`${base}/models`)).status, 503);

    process.env.LLM_API_TOKEN = 'test-token';
    assert.equal((await fetch(`${base}/models`, { headers: { authorization: 'Bearer nope' } })).status, 401);

    const auth = { authorization: 'Bearer test-token', 'content-type': 'application/json' };
    const chat = await fetch(`${base}/chat`, { method: 'POST', headers: auth, body: JSON.stringify({ messages: hi, strategy: 'cost' }) });
    const json = (await chat.json()) as any;
    assert.equal(chat.status, 200);
    assert.equal(json.data.model, 'cheap');

    const bad = await fetch(`${base}/chat`, { method: 'POST', headers: auth, body: JSON.stringify({ messages: [] }) });
    assert.equal(bad.status, 400);

    const none = await fetch(`${base}/chat`, { method: 'POST', headers: auth, body: JSON.stringify({ messages: hi, minQuality: 99 }) });
    assert.equal(none.status, 422);

    const plan = (await (await fetch(`${base}/plan`, { method: 'POST', headers: auth, body: JSON.stringify({ messages: hi }) })).json()) as any;
    assert.equal(plan.data.candidates.length, 3);

    const models = (await (await fetch(`${base}/models`, { headers: auth })).json()) as any;
    assert.equal(models.data.length, 3);

    const stats = (await (await fetch(`${base}/stats`, { headers: auth })).json()) as any;
    assert.equal(stats.data.metrics.totals.requests, 1);
  } finally {
    if (prev === undefined) delete process.env.LLM_API_TOKEN;
    else process.env.LLM_API_TOKEN = prev;
    server.close();
  }
});
