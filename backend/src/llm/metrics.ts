import type { ErrorKind } from './errors';
import { LLMError } from './errors';
import type { TokenUsage } from './types';

export interface RequestEvent {
  provider: string;
  model: string;
  ok: boolean;
  latencyMs: number;
  costUsd: number;
  usage?: TokenUsage;
  errorKind?: ErrorKind;
  tag?: string;
  timestamp: number;
}

export interface ModelStats {
  provider: string;
  model: string;
  requests: number;
  successes: number;
  failures: number;
  /** Failure rate over recent outcomes (last OUTCOME_WINDOW requests within HEALTH_WINDOW_MS). */
  recentErrorRate: number;
  /** Number of outcomes recentErrorRate is based on. */
  recentSamples: number;
  latencyP50Ms?: number;
  latencyP95Ms?: number;
  inputTokens: number;
  outputTokens: number;
  cachedInputTokens: number;
  costUsd: number;
  errorsByKind: Partial<Record<ErrorKind, number>>;
}

const LATENCY_WINDOW = 200;
const OUTCOME_WINDOW = 50;
/** Outcomes older than this stop affecting health, so a model that failed once recovers without traffic. */
const HEALTH_WINDOW_MS = 5 * 60_000;

class Ring<T> {
  private items: T[] = [];
  constructor(private readonly size: number) {}
  push(v: T) {
    this.items.push(v);
    if (this.items.length > this.size) this.items.shift();
  }
  values(): readonly T[] {
    return this.items;
  }
}

interface Bucket extends Omit<ModelStats, 'recentErrorRate' | 'recentSamples' | 'latencyP50Ms' | 'latencyP95Ms'> {
  latencies: Ring<number>;
  outcomes: Ring<{ ok: boolean; t: number }>;
}

/** In-memory request metrics: per model, per provider, per tag, plus cache effectiveness. */
export class MetricsCollector {
  private readonly buckets = new Map<string, Bucket>();
  private readonly tagSpend = new Map<string, { requests: number; costUsd: number }>();
  private readonly listeners = new Set<(e: RequestEvent) => void>();
  private cacheHits = 0;
  private cacheMisses = 0;
  private savedUsd = 0;
  private readonly startedAt: number;

  constructor(private readonly now: () => number = Date.now) {
    this.startedAt = now();
  }

  /** Subscribe to every request event (e.g. to forward to Datadog/Prometheus/logs). */
  onEvent(listener: (e: RequestEvent) => void): () => void {
    this.listeners.add(listener);
    return () => this.listeners.delete(listener);
  }

  record(e: RequestEvent): void {
    const key = `${e.provider}/${e.model}`;
    let b = this.buckets.get(key);
    if (!b) {
      b = {
        provider: e.provider,
        model: e.model,
        requests: 0,
        successes: 0,
        failures: 0,
        inputTokens: 0,
        outputTokens: 0,
        cachedInputTokens: 0,
        costUsd: 0,
        errorsByKind: {},
        latencies: new Ring(LATENCY_WINDOW),
        outcomes: new Ring(OUTCOME_WINDOW),
      };
      this.buckets.set(key, b);
    }
    b.requests += 1;
    b.outcomes.push({ ok: e.ok, t: e.timestamp });
    b.costUsd += e.costUsd;
    if (e.ok) {
      b.successes += 1;
      b.latencies.push(e.latencyMs);
    } else {
      b.failures += 1;
      if (e.errorKind) b.errorsByKind[e.errorKind] = (b.errorsByKind[e.errorKind] ?? 0) + 1;
    }
    if (e.usage) {
      b.inputTokens += e.usage.inputTokens;
      b.outputTokens += e.usage.outputTokens;
      b.cachedInputTokens += e.usage.cachedInputTokens ?? 0;
    }
    if (e.tag) {
      const t = this.tagSpend.get(e.tag) ?? { requests: 0, costUsd: 0 };
      t.requests += 1;
      t.costUsd += e.costUsd;
      this.tagSpend.set(e.tag, t);
    }
    for (const l of this.listeners) {
      try {
        l(e);
      } catch {
        // A broken listener must never break a request.
      }
    }
  }

  recordCacheHit(savedUsd: number): void {
    this.cacheHits += 1;
    this.savedUsd += savedUsd;
  }

  recordCacheMiss(): void {
    this.cacheMisses += 1;
  }

  modelStats(provider: string, model: string): ModelStats | undefined {
    const b = this.buckets.get(`${provider}/${model}`);
    return b ? toStats(b, this.now()) : undefined;
  }

  snapshot() {
    const now = this.now();
    const byModel = [...this.buckets.values()].map((b) => toStats(b, now));
    const byProvider: Record<string, { requests: number; failures: number; costUsd: number }> = {};
    for (const s of byModel) {
      const p = (byProvider[s.provider] ??= { requests: 0, failures: 0, costUsd: 0 });
      p.requests += s.requests;
      p.failures += s.failures;
      p.costUsd += s.costUsd;
    }
    const totals = byModel.reduce(
      (t, s) => ({
        requests: t.requests + s.requests,
        failures: t.failures + s.failures,
        inputTokens: t.inputTokens + s.inputTokens,
        outputTokens: t.outputTokens + s.outputTokens,
        costUsd: t.costUsd + s.costUsd,
      }),
      { requests: 0, failures: 0, inputTokens: 0, outputTokens: 0, costUsd: 0 }
    );
    const lookups = this.cacheHits + this.cacheMisses;
    return {
      since: new Date(this.startedAt).toISOString(),
      totals,
      byProvider,
      byModel,
      byTag: Object.fromEntries(this.tagSpend),
      cache: {
        hits: this.cacheHits,
        misses: this.cacheMisses,
        hitRate: lookups ? this.cacheHits / lookups : 0,
        savedUsd: this.savedUsd,
      },
    };
  }
}

function toStats(b: Bucket, now: number): ModelStats {
  const { latencies, outcomes, ...rest } = b;
  const lat = [...latencies.values()].sort((x, y) => x - y);
  const out = outcomes.values().filter((o) => now - o.t <= HEALTH_WINDOW_MS);
  return {
    ...rest,
    recentErrorRate: out.length ? out.filter((o) => !o.ok).length / out.length : 0,
    recentSamples: out.length,
    latencyP50Ms: percentile(lat, 0.5),
    latencyP95Ms: percentile(lat, 0.95),
  };
}

function percentile(sorted: number[], p: number): number | undefined {
  if (!sorted.length) return undefined;
  return sorted[Math.min(sorted.length - 1, Math.floor(p * sorted.length))];
}

export interface BudgetOptions {
  dailyUsd?: number;
  monthlyUsd?: number;
  /** Once spend crosses this fraction of a limit, selection switches to the cheapest viable model. */
  economizeAt?: number;
}

/**
 * Tracks spend against daily/monthly limits (UTC). Requests are refused once a
 * limit is reached, and the gateway economizes once spend crosses `economizeAt`.
 * In-memory: for multi-instance deployments, persist via onEvent.
 */
export class BudgetTracker {
  private day = '';
  private month = '';
  private daySpend = 0;
  private monthSpend = 0;

  constructor(private readonly opts: BudgetOptions = {}, private readonly now: () => number = Date.now) {}

  private roll(): void {
    const iso = new Date(this.now()).toISOString();
    const day = iso.slice(0, 10);
    const month = iso.slice(0, 7);
    if (day !== this.day) [this.day, this.daySpend] = [day, 0];
    if (month !== this.month) [this.month, this.monthSpend] = [month, 0];
  }

  add(usd: number): void {
    this.roll();
    this.daySpend += usd;
    this.monthSpend += usd;
  }

  /** Throws if `estimatedUsd` would push spend over a limit. */
  assertCanSpend(estimatedUsd: number): void {
    this.roll();
    const { dailyUsd, monthlyUsd } = this.opts;
    if (dailyUsd !== undefined && this.daySpend + estimatedUsd > dailyUsd) {
      throw new LLMError('budget', `Daily LLM budget of $${dailyUsd} exhausted ($${this.daySpend.toFixed(4)} spent)`);
    }
    if (monthlyUsd !== undefined && this.monthSpend + estimatedUsd > monthlyUsd) {
      throw new LLMError('budget', `Monthly LLM budget of $${monthlyUsd} exhausted ($${this.monthSpend.toFixed(4)} spent)`);
    }
  }

  shouldEconomize(): boolean {
    this.roll();
    const at = this.opts.economizeAt ?? 0.8;
    const { dailyUsd, monthlyUsd } = this.opts;
    return (
      (dailyUsd !== undefined && this.daySpend >= dailyUsd * at) ||
      (monthlyUsd !== undefined && this.monthSpend >= monthlyUsd * at)
    );
  }

  snapshot() {
    this.roll();
    return {
      day: this.day,
      daySpendUsd: this.daySpend,
      dailyLimitUsd: this.opts.dailyUsd ?? null,
      month: this.month,
      monthSpendUsd: this.monthSpend,
      monthlyLimitUsd: this.opts.monthlyUsd ?? null,
      economizing: this.shouldEconomize(),
    };
  }
}
