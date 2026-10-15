import { DEFAULT_MAX_TOKENS, estimateCost, estimateInputTokens } from './catalog';
import type { MetricsCollector } from './metrics';
import type { ProviderRegistry, RegisteredModel } from './registry';
import type { GatewayRequest, SelectionStrategy, Tier } from './types';

export interface Candidate extends RegisteredModel {
  estimatedCostUsd: number;
  expectedLatencyMs: number;
  score: number;
  /** Why this model was ranked where it was (surfaced by the /plan endpoint). */
  reason: string;
}

export interface Rejection {
  model: string;
  provider: string;
  reason: string;
}

/** Latency assumed for models with no observed traffic yet. */
const PRIOR_LATENCY_MS: Record<Tier, number> = { economy: 1500, standard: 3500, premium: 7000 };

/** Weights for the balanced strategy. */
const BALANCED = { quality: 0.5, cost: 0.3, latency: 0.2 };

/** A model whose recent error rate is above this (over enough samples) is ranked after every healthy model. */
const UNHEALTHY_ERROR_RATE = 0.5;
const MIN_HEALTH_SAMPLES = 3;

/**
 * Filters registered models down to the ones that can serve a request, then
 * ranks them by strategy. The first candidate is the primary choice; the rest
 * form the fallback chain.
 */
export class ModelSelector {
  constructor(private readonly registry: ProviderRegistry, private readonly metrics: MetricsCollector) {}

  rank(req: GatewayRequest, strategy: SelectionStrategy): { candidates: Candidate[]; rejected: Rejection[] } {
    const rejected: Rejection[] = [];
    const inputTokens = estimateInputTokens(req);
    const maxTokens = req.maxTokens ?? DEFAULT_MAX_TOKENS;
    const pinned = req.model ? this.registry.find(req.model, req.provider) : undefined;

    const viable: Omit<Candidate, 'score' | 'reason'>[] = [];
    for (const r of this.registry.models()) {
      const { model } = r;
      const isPinned = pinned !== undefined && pinned.model === model;
      const reject = (reason: string) => rejected.push({ model: model.id, provider: model.provider, reason });

      if (req.provider && model.provider !== req.provider) continue;
      if (model.disabled && !isPinned) continue;
      if (!r.available) {
        reject('circuit open or provider disabled');
        continue;
      }
      const missing = (req.requiredCapabilities ?? []).filter((c) => !model.capabilities.includes(c));
      if (missing.length) {
        reject(`missing capabilities: ${missing.join(', ')}`);
        continue;
      }
      if (inputTokens + Math.min(maxTokens, model.maxOutputTokens) > model.contextWindow) {
        reject(`context window ${model.contextWindow} too small for ~${inputTokens} input tokens`);
        continue;
      }
      if (!isPinned && req.minQuality !== undefined && model.qualityScore < req.minQuality) {
        reject(`quality ${model.qualityScore} < required ${req.minQuality}`);
        continue;
      }
      const estimatedCostUsd = estimateCost(model, req);
      if (req.maxCostUsd !== undefined && estimatedCostUsd > req.maxCostUsd) {
        reject(`estimated cost $${estimatedCostUsd.toFixed(5)} > max $${req.maxCostUsd}`);
        continue;
      }
      const observed = this.metrics.modelStats(model.provider, model.id)?.latencyP50Ms;
      viable.push({ ...r, estimatedCostUsd, expectedLatencyMs: observed ?? PRIOR_LATENCY_MS[model.tier] });
    }

    const candidates = this.score(viable, strategy);

    // A pinned model always goes first; the rest of the ranking becomes its fallback chain.
    if (pinned) {
      const i = candidates.findIndex((c) => c.model === pinned.model);
      if (i > 0) candidates.unshift(...candidates.splice(i, 1));
      if (i >= 0) candidates[0].reason = `pinned by request; ${candidates[0].reason}`;
    }
    return { candidates, rejected };
  }

  private score(viable: Omit<Candidate, 'score' | 'reason'>[], strategy: SelectionStrategy): Candidate[] {
    if (!viable.length) return [];
    const norm = (vals: number[]) => {
      const lo = Math.min(...vals);
      const hi = Math.max(...vals);
      return (v: number) => (hi === lo ? 0 : (v - lo) / (hi - lo));
    };
    const costN = norm(viable.map((c) => c.estimatedCostUsd));
    const latN = norm(viable.map((c) => c.expectedLatencyMs));
    const qualN = norm(viable.map((c) => c.model.qualityScore));

    const scored = viable.map((c) => {
      const stats = this.metrics.modelStats(c.model.provider, c.model.id);
      const errorRate = stats?.recentErrorRate ?? 0;
      let score: number;
      let reason: string;
      switch (strategy) {
        case 'cost':
          score = 1 - costN(c.estimatedCostUsd);
          reason = `est. $${c.estimatedCostUsd.toFixed(5)}`;
          break;
        case 'quality':
          // Tiny cost term breaks ties between equally-rated models.
          score = qualN(c.model.qualityScore) + 0.001 * (1 - costN(c.estimatedCostUsd));
          reason = `quality ${c.model.qualityScore}`;
          break;
        case 'latency':
          score = 1 - latN(c.expectedLatencyMs);
          reason = `expected ${Math.round(c.expectedLatencyMs)}ms`;
          break;
        case 'balanced':
          score =
            BALANCED.quality * qualN(c.model.qualityScore) +
            BALANCED.cost * (1 - costN(c.estimatedCostUsd)) +
            BALANCED.latency * (1 - latN(c.expectedLatencyMs));
          reason = `quality ${c.model.qualityScore}, est. $${c.estimatedCostUsd.toFixed(5)}, ~${Math.round(c.expectedLatencyMs)}ms`;
          break;
      }
      // Smoothly penalize flaky models (weighted by how much evidence there is),
      // and drop clearly unhealthy ones below everything healthy.
      const confidence = Math.min(1, (stats?.recentSamples ?? 0) / 10);
      score -= errorRate * 0.3 * confidence;
      if (errorRate > UNHEALTHY_ERROR_RATE && (stats?.recentSamples ?? 0) >= MIN_HEALTH_SAMPLES) {
        score -= 10;
        reason += `, recent error rate ${(errorRate * 100).toFixed(0)}%`;
      }
      return { ...c, score, reason };
    });

    return scored.sort((a, b) => b.score - a.score);
  }
}
