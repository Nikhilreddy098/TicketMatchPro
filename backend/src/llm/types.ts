/**
 * Provider-neutral types shared by every part of the LLM gateway.
 *
 * Providers translate these into their own wire formats; the rest of the
 * gateway (selection, fallback, metrics, cache) only ever sees these shapes.
 */

export type Role = 'system' | 'user' | 'assistant';

export interface ChatMessage {
  role: Role;
  content: string;
}

export type Capability = 'chat' | 'vision' | 'tools' | 'json' | 'reasoning' | 'long_context';

export type Tier = 'economy' | 'standard' | 'premium';

/** Normalized reasoning-depth knob. Providers map it to their own parameter (or ignore it). */
export type Effort = 'low' | 'medium' | 'high' | 'xhigh' | 'max';

export type SelectionStrategy = 'cost' | 'quality' | 'latency' | 'balanced';

export interface ModelPricing {
  /** USD per 1M uncached input tokens. */
  inputPerMTok: number;
  /** USD per 1M output tokens (including any reasoning tokens the provider bills as output). */
  outputPerMTok: number;
  /** USD per 1M input tokens served from the provider's prompt cache. Defaults to inputPerMTok. */
  cachedInputPerMTok?: number;
  /** USD per 1M tokens written to the provider's prompt cache. Defaults to inputPerMTok. */
  cacheWritePerMTok?: number;
}

export interface ModelInfo {
  /** The exact model id sent to the provider's API. */
  id: string;
  /** Name of the provider that serves this model (matches LLMProvider.name). */
  provider: string;
  displayName?: string;
  contextWindow: number;
  maxOutputTokens: number;
  pricing: ModelPricing;
  capabilities: Capability[];
  /** Relative quality score, 1-100. Used only to rank models against each other. */
  qualityScore: number;
  tier: Tier;
  /** Whether the model accepts temperature. Many current reasoning models reject it. */
  supportsTemperature?: boolean;
  /** Whether the model accepts the normalized `effort` knob. */
  supportsEffort?: boolean;
  /** Excluded from automatic selection, but still callable by explicit id. */
  disabled?: boolean;
}

export interface ChatRequest {
  messages: ChatMessage[];
  /** Convenience for a leading system prompt; merged with any `system` messages. */
  system?: string;
  maxTokens?: number;
  temperature?: number;
  effort?: Effort;
  stop?: string[];
  signal?: AbortSignal;
}

export interface GatewayRequest extends ChatRequest {
  /** Pin a specific model id. Fallback may still move to other models unless allowFallback is false. */
  model?: string;
  /** Restrict selection to one provider. */
  provider?: string;
  strategy?: SelectionStrategy;
  requiredCapabilities?: Capability[];
  /** Reject candidates whose estimated cost for this request exceeds this (USD). */
  maxCostUsd?: number;
  minQuality?: number;
  /** true / false to override the gateway default, or a per-request TTL. */
  cache?: boolean | { ttlMs: number };
  allowFallback?: boolean;
  /** Free-form label (feature name, tenant, ...) used to group metrics and spend. */
  tag?: string;
}

export type FinishReason = 'stop' | 'length' | 'refusal' | 'tool_use' | 'other';

export interface TokenUsage {
  /** Uncached input tokens. */
  inputTokens: number;
  outputTokens: number;
  /** Input tokens read from the provider's prompt cache. */
  cachedInputTokens?: number;
  /** Input tokens written to the provider's prompt cache. */
  cacheWriteTokens?: number;
}

/** What a provider adapter returns. */
export interface ProviderResponse {
  text: string;
  finishReason: FinishReason;
  usage: TokenUsage;
  /** The model that actually produced the output (can differ from the requested one, e.g. server-side fallback). */
  model: string;
  raw?: unknown;
}

export interface AttemptRecord {
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  errorKind?: string;
  error?: string;
}

/** What the gateway returns to callers. */
export interface ChatResponse extends ProviderResponse {
  provider: string;
  costUsd: number;
  latencyMs: number;
  cached: boolean;
  /** Every provider call made for this request, in order (useful for debugging fallback). */
  attempts: AttemptRecord[];
}

/** The contract every provider adapter implements. */
export interface LLMProvider {
  readonly name: string;
  /** Models this provider can serve. */
  models(): ModelInfo[];
  chat(model: ModelInfo, request: ChatRequest): Promise<ProviderResponse>;
}
