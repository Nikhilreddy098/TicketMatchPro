import type { ChatRequest, ModelInfo, TokenUsage } from './types';

/**
 * Built-in Anthropic catalog. Prices are Anthropic first-party API list prices
 * (USD per 1M tokens) as of 2026-09. Override or extend via llm.config.json.
 *
 * Other providers ship no built-in catalog: their models and prices are declared
 * in config so nothing here silently goes stale for a provider we can't verify.
 */
export const ANTHROPIC_MODELS: ModelInfo[] = [
  {
    id: 'claude-opus-5-5',
    provider: 'anthropic',
    displayName: 'Claude Opus 5.5',
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: { inputPerMTok: 4, outputPerMTok: 20, cachedInputPerMTok: 0.2, cacheWritePerMTok: 5 },
    capabilities: ['chat', 'vision', 'tools', 'json', 'reasoning', 'long_context'],
    qualityScore: 95,
    tier: 'premium',
    supportsTemperature: false,
    supportsEffort: true,
  },
  {
    id: 'claude-sonnet-5-5',
    provider: 'anthropic',
    displayName: 'Claude Sonnet 5.5',
    contextWindow: 1_000_000,
    maxOutputTokens: 128_000,
    pricing: { inputPerMTok: 2, outputPerMTok: 10, cachedInputPerMTok: 0.2, cacheWritePerMTok: 2.5 },
    capabilities: ['chat', 'vision', 'tools', 'json', 'reasoning', 'long_context'],
    qualityScore: 88,
    tier: 'standard',
    supportsTemperature: false,
    supportsEffort: true,
  },
  {
    id: 'claude-haiku-4-5',
    provider: 'anthropic',
    displayName: 'Claude Haiku 4.5',
    contextWindow: 200_000,
    maxOutputTokens: 64_000,
    pricing: { inputPerMTok: 1, outputPerMTok: 5, cachedInputPerMTok: 0.1, cacheWritePerMTok: 1.25 },
    capabilities: ['chat', 'vision', 'tools', 'json'],
    qualityScore: 72,
    tier: 'economy',
    supportsTemperature: true,
    supportsEffort: false,
  },
];

export const DEFAULT_MAX_TOKENS = 4096;

export function costOf(model: ModelInfo, usage: TokenUsage): number {
  const p = model.pricing;
  const usd =
    usage.inputTokens * p.inputPerMTok +
    usage.outputTokens * p.outputPerMTok +
    (usage.cachedInputTokens ?? 0) * (p.cachedInputPerMTok ?? p.inputPerMTok) +
    (usage.cacheWriteTokens ?? 0) * (p.cacheWritePerMTok ?? p.inputPerMTok);
  return usd / 1_000_000;
}

/**
 * Rough input-token estimate (~4 chars/token). Good enough for ranking and budget
 * guards; actual billing always uses the provider-reported usage.
 */
export function estimateInputTokens(request: ChatRequest): number {
  let chars = request.system?.length ?? 0;
  for (const m of request.messages) chars += m.content.length + 8;
  return Math.ceil(chars / 4);
}

/** Worst-case cost estimate: assumes the full maxTokens budget is used for output. */
export function estimateCost(model: ModelInfo, request: ChatRequest): number {
  const maxTokens = Math.min(request.maxTokens ?? DEFAULT_MAX_TOKENS, model.maxOutputTokens);
  return costOf(model, { inputTokens: estimateInputTokens(request), outputTokens: maxTokens });
}
