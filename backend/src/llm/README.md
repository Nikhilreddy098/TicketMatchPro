# LLM Gateway

This is a provider-neutral layer for calling LLMs from the backend. Application code sends one `GatewayRequest`. The gateway then:

1. **Selects** the best model for the request. It filters on capabilities, context window, quality floor and cost ceiling, then ranks what's left by strategy.
2. **Calls** that model through a provider adapter: Anthropic, any OpenAI-compatible host, or Gemini.
3. **Retries** transient errors (rate limits, timeouts, 5xx, network) with exponential backoff and jitter. It honours `Retry-After`.
4. **Falls back** to the next-ranked model or provider when a model keeps failing or refuses.
5. **Takes unhealthy models out of rotation** with circuit breakers. It sends a probe after a cooldown, and an auth failure disables the whole provider.
6. **Tracks cost and spend** against daily and monthly budgets. Near a limit, automatic selection switches to the cheapest viable model. At the limit, requests are refused.
7. **Caches** responses (opt-in per request or by default) and merges identical requests that are in flight at the same time into one provider call.
8. **Records metrics** per model, provider and tag: p50/p95 latency, error rates, tokens, cost and cache hit rate. Live latency and error data feed back into selection.

```
            ┌──────────────┐   rank    ┌──────────────┐
request ──▶ │ LLMGateway   │ ────────▶ │ModelSelector │ ◀── metrics (latency, errors)
            │  cache/dedup │           └──────────────┘
            │  budget      │   chain: [primary, fallback1, fallback2, ...]
            │  retry loop  │ ──▶ ProviderRegistry (+ CircuitBreaker)
            └──────────────┘          │
                                      ├── AnthropicProvider        (@anthropic-ai/sdk)
                                      ├── OpenAICompatibleProvider (OpenAI, Groq, OpenRouter, vLLM, Ollama…)
                                      └── GeminiProvider           (generateContent REST)
```

## Files

| File | Responsibility |
|---|---|
| `types.ts` | Universal interface: `LLMProvider`, `ModelInfo`, `GatewayRequest`, `ChatResponse` |
| `errors.ts` | `LLMError` with a normalized `kind`, plus retryable and fallback classification |
| `catalog.ts` | Built-in Anthropic catalog, cost calculation and token estimation |
| `registry.ts` | `ProviderRegistry` and `CircuitBreaker` |
| `selector.ts` | `ModelSelector`: filtering and the `cost` / `quality` / `latency` / `balanced` strategies |
| `gateway.ts` | `LLMGateway`: orchestration, retries, fallback, budget, cache |
| `metrics.ts` | `MetricsCollector` and `BudgetTracker` |
| `cache.ts` | `CacheStore` interface, in-memory LRU+TTL store and the cache key |
| `config.ts` | JSON config schema (zod) and `createGatewayFromEnv()` |
| `providers/*` | Adapters, plus `MockProvider` for tests and demos |

## Quick start

```bash
# Anthropic only: no config file needed
export ANTHROPIC_API_KEY=...
export LLM_API_TOKEN=$(openssl rand -hex 24)   # enables /api/llm/*
npm run dev
```

To use several providers, copy `llm.config.example.json` to `llm.config.json`, edit it, and set `LLM_CONFIG_FILE=./llm.config.json`. If a provider's API key env var is unset, startup skips that provider with a warning instead of failing.

## Using it in code

```ts
import { createGatewayFromEnv } from './llm';

const llm = createGatewayFromEnv();

// Automatic selection: cheapest model that can do it
const summary = await llm.chat({
  strategy: 'cost',
  system: 'Summarize event listings in one sentence.',
  messages: [{ role: 'user', content: listing.description }],
  maxTokens: 200,
  cache: true,            // identical listings reuse the answer
  tag: 'listing-summary', // spend is grouped under this tag in /stats
});

// Pin a model and let the gateway fall back if it's down
const answer = await llm.chat({
  model: 'claude-opus-5-5',
  effort: 'high',
  messages,
});

// Constraints instead of a model name
await llm.chat({
  requiredCapabilities: ['vision'],
  minQuality: 80,
  maxCostUsd: 0.05,
  messages,
});

// Why would this request go where it goes?
console.log(llm.plan({ strategy: 'balanced', messages }));
```

`ChatResponse` contains `text`, `finishReason`, `usage`, `model` (the model that actually answered), `provider`, `costUsd`, `latencyMs`, `cached`, and `attempts`, which lists every provider call made, including failed ones.

On failure, the gateway throws `LLMError` with a `kind` (`rate_limit`, `timeout`, `server`, `auth`, `invalid_request`, `context_length`, `refusal`, `budget`, `no_candidates`, `cancelled`, …) and the full `attempts` list.

### Adding a provider

Implement `LLMProvider` and register it:

```ts
class MyProvider implements LLMProvider {
  readonly name = 'my-provider';
  models() { return [/* ModelInfo[] */]; }
  async chat(model, request) {
    // Call the API. Throw LLMError with the right `kind` on failure
    // (postJson in providers/shared.ts already does this for HTTP).
    return { text, finishReason, usage, model: model.id };
  }
}
llm.registerProvider(new MyProvider());
```

For any host that speaks the OpenAI Chat Completions format, don't write code. Add an `openai-compatible` entry to the config instead.

## Selection strategies

| Strategy | Ranks by |
|---|---|
| `cost` | Lowest estimated cost (input estimate plus `maxTokens` of output, as a worst case) |
| `quality` | Highest `qualityScore`, with cost as the tie-breaker |
| `latency` | Lowest observed p50 latency, or a per-tier prior before the model has traffic |
| `balanced` (default) | 50% quality, 30% cost, 20% latency, each normalized across the candidates |

Every strategy also applies a small penalty for a model's recent error rate (last 5 minutes), weighted by sample count. If a model fails on more than half of at least 3 recent requests, it drops below every healthy model. Old failures decay, so a model recovers without needing traffic.

`qualityScore` is a relative 1–100 ranking you control. Tune it to your own evals rather than treating the defaults as ground truth.

## Fallback rules

- **Same model, after backoff:** `rate_limit`, `timeout`, `network`, `server` (up to `retry.maxRetriesPerModel`).
- **Next model:** any of the above once retries run out, plus `auth`, `context_length`, `refusal` (when `fallbackOnRefusal` is on) and `unknown`.
- **Stop immediately:** `invalid_request` (it would fail everywhere), `budget`, `cancelled`.
- A `429` with `Retry-After` opens that model's circuit for the stated duration and moves straight to the next model instead of waiting.
- On Claude Opus 5.5 and Sonnet 5.5, the Anthropic adapter also turns on Anthropic's server-side refusal fallback (`fallbacks: "default"`). A policy decline is then retried on Anthropic's side within the same call. Cost is computed at the rates of the model that actually answered. Set `serverSideFallback: false` on the provider to turn it off.

## Cost controls

- Per-request `maxCostUsd` removes candidates that are too expensive.
- `budget.dailyUsd` / `budget.monthlyUsd` (UTC). Env vars `LLM_DAILY_BUDGET_USD` and `LLM_MONTHLY_BUDGET_USD` override the file values.
- `budget.economizeAt` (default 0.8): past this fraction of a limit, unpinned requests with no explicit strategy use `cost`.
- Response cache: `cache: true` or `{ ttlMs }` per request, or `cache.enabledByDefault`. Only responses that finished normally are stored. The cache key includes routing hints, so a `cost` answer is never served to a `quality` request.
- Provider prompt caching is billed correctly: cached-read and cache-write tokens are priced separately.

## HTTP API

All routes need `Authorization: Bearer $LLM_API_TOKEN`. They return 503 when the token isn't configured, because these endpoints spend money.

| Method | Path | Description |
|---|---|---|
| POST | `/api/llm/chat` | Body is a `GatewayRequest` (JSON). Returns `ChatResponse`. |
| POST | `/api/llm/plan` | Same body. Returns the ranked candidates and rejected models with reasons, without calling a model. |
| GET | `/api/llm/models` | Every registered model with availability. |
| GET | `/api/llm/stats` | Metrics, budget state and open circuits. |

```bash
curl -s localhost:4000/api/llm/chat \
  -H "authorization: Bearer $LLM_API_TOKEN" -H 'content-type: application/json' \
  -d '{"strategy":"cost","messages":[{"role":"user","content":"Suggest 3 tags for a jazz concert"}]}'
```

The error statuses are: 400 for an invalid request, 422 for no viable model or a refusal, 429 when the budget is exhausted, 502 or 503 for upstream failures, and 504 for a timeout.

## Limits

- Metrics, budget and cache are **in-memory per process**. If you run several instances, use `gateway.metrics.onEvent()` to forward events to your metrics or billing store, and pass a shared `CacheStore` (Redis, for example).
- Pre-request cost estimates use about 4 characters per token. Billing always uses the token counts the provider reports.
- The universal interface covers text chat. Streaming, tool calls and image inputs are not normalized yet. To use those, call the provider SDK directly.
- Model prices change. The built-in Anthropic prices are as of 2026-09. Prices for other providers live in your config, so you need to keep them current yourself.

## Tests

```bash
npm test
```

The suite has 27 tests (`test/llm.test.ts`). It covers selection, constraints, retry and fallback, circuit breakers, health decay, budgets, caching, dedup, cancellation, timeouts, all three adapters (against fake clients and fake `fetch`), config loading, and the HTTP routes. No network or API keys are needed.
