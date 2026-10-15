import Anthropic from '@anthropic-ai/sdk';
import { ANTHROPIC_MODELS, DEFAULT_MAX_TOKENS } from '../catalog';
import { LLMError, classifyHttpStatus, parseRetryAfter } from '../errors';
import type { ChatRequest, FinishReason, LLMProvider, ModelInfo, ProviderResponse } from '../types';
import { splitSystem } from './shared';

export interface AnthropicProviderOptions {
  /** Inject a preconfigured client (tests, Bedrock/Vertex clients, custom base URL). */
  client?: Anthropic;
  apiKey?: string;
  models?: ModelInfo[];
  /**
   * Opt into Anthropic's server-side refusal fallback (`fallbacks: "default"`), which
   * re-runs a policy-declined request on a server-chosen model inside the same call.
   * The gateway's own cross-provider fallback still applies on top. Default: true.
   */
  serverSideFallback?: boolean;
  name?: string;
}

/** Models that accept the `fallbacks: "default"` server-side refusal fallback. */
const SERVER_FALLBACK_MODELS = new Set(['claude-opus-5-5', 'claude-sonnet-5-5', 'claude-opus-5', 'claude-fable-5-1']);

export class AnthropicProvider implements LLMProvider {
  readonly name: string;
  private readonly client: Anthropic;
  private readonly modelList: ModelInfo[];
  private readonly serverSideFallback: boolean;

  constructor(opts: AnthropicProviderOptions = {}) {
    this.name = opts.name ?? 'anthropic';
    // The gateway owns retries and backoff, so the SDK's own retries are disabled.
    this.client = opts.client ?? new Anthropic({ apiKey: opts.apiKey, maxRetries: 0 });
    this.modelList = (opts.models ?? ANTHROPIC_MODELS).map((m) => ({ ...m, provider: this.name }));
    this.serverSideFallback = opts.serverSideFallback ?? true;
  }

  models(): ModelInfo[] {
    return this.modelList;
  }

  async chat(model: ModelInfo, request: ChatRequest): Promise<ProviderResponse> {
    const { system, turns } = splitSystem(request);
    const useServerFallback = this.serverSideFallback && SERVER_FALLBACK_MODELS.has(model.id);

    const params: Anthropic.Beta.MessageCreateParamsNonStreaming = {
      model: model.id,
      max_tokens: Math.min(request.maxTokens ?? DEFAULT_MAX_TOKENS, model.maxOutputTokens),
      messages: turns.map((m) => ({ role: m.role as 'user' | 'assistant', content: m.content })),
      ...(system ? { system } : {}),
      ...(request.stop?.length ? { stop_sequences: request.stop } : {}),
      ...(request.effort && model.supportsEffort ? { output_config: { effort: request.effort } } : {}),
      ...(request.temperature !== undefined && model.supportsTemperature ? { temperature: request.temperature } : {}),
      ...(useServerFallback ? { betas: ['server-side-fallback-2026-07-01'], fallbacks: 'default' as const } : {}),
    };

    let res: Anthropic.Beta.BetaMessage;
    try {
      res = await this.client.beta.messages.create(params, { signal: request.signal });
    } catch (err) {
      throw this.toError(err, model.id);
    }

    const text = res.content
      .filter((b): b is Anthropic.Beta.BetaTextBlock => b.type === 'text')
      .map((b) => b.text)
      .join('');

    return {
      text,
      finishReason: mapStopReason(res.stop_reason),
      model: res.model,
      usage: {
        inputTokens: res.usage.input_tokens,
        outputTokens: res.usage.output_tokens,
        cachedInputTokens: res.usage.cache_read_input_tokens ?? 0,
        cacheWriteTokens: res.usage.cache_creation_input_tokens ?? 0,
      },
      raw: res,
    };
  }

  private toError(err: unknown, model: string): LLMError {
    const base = { provider: this.name, model, cause: err };
    if (err instanceof Anthropic.APIConnectionTimeoutError) return new LLMError('timeout', err.message, base);
    if (err instanceof Anthropic.APIUserAbortError) return new LLMError('timeout', err.message, base);
    if (err instanceof Anthropic.APIConnectionError) return new LLMError('network', err.message, base);
    if (err instanceof Anthropic.APIError && typeof err.status === 'number') {
      return new LLMError(classifyHttpStatus(err.status, err.message), err.message, {
        ...base,
        status: err.status,
        retryAfterMs: parseRetryAfter(err.headers?.get('retry-after')),
      });
    }
    return new LLMError('unknown', err instanceof Error ? err.message : String(err), base);
  }
}

function mapStopReason(reason: Anthropic.Beta.BetaStopReason | null): FinishReason {
  switch (reason) {
    case 'end_turn':
    case 'stop_sequence':
      return 'stop';
    case 'max_tokens':
    case 'model_context_window_exceeded':
      return 'length';
    case 'refusal':
      return 'refusal';
    case 'tool_use':
      return 'tool_use';
    default:
      return 'other';
  }
}
