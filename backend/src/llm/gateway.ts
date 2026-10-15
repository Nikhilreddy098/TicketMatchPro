import { CacheStore, MemoryCacheStore, cacheKey } from './cache';
import { costOf } from './catalog';
import { LLMError, toLLMError } from './errors';
import { BudgetOptions, BudgetTracker, MetricsCollector } from './metrics';
import { CircuitBreakerOptions, ProviderRegistry, modelKey } from './registry';
import { Candidate, ModelSelector } from './selector';
import type { AttemptRecord, ChatResponse, GatewayRequest, LLMProvider, SelectionStrategy } from './types';

export interface RetryOptions {
  /** Extra attempts on the same model for transient errors before moving on. */
  maxRetriesPerModel?: number;
  baseDelayMs?: number;
  maxDelayMs?: number;
}

export interface GatewayOptions {
  providers?: LLMProvider[];
  defaultStrategy?: SelectionStrategy;
  /** Maximum number of distinct models tried per request (primary + fallbacks). */
  maxModelsPerRequest?: number;
  /** Per-attempt timeout. */
  timeoutMs?: number;
  retry?: RetryOptions;
  /** Treat a refusal as a failure and try the next model. Default: true. */
  fallbackOnRefusal?: boolean;
  circuitBreaker?: CircuitBreakerOptions;
  budget?: BudgetOptions;
  cache?: {
    /** Cache responses unless the request opts out. Default: false (opt-in per request). */
    enabledByDefault?: boolean;
    ttlMs?: number;
    store?: CacheStore;
    maxEntries?: number;
  };
  /** Injection points for tests. */
  now?: () => number;
  sleep?: (ms: number) => Promise<void>;
}

export interface PlanResult {
  strategy: SelectionStrategy;
  candidates: { provider: string; model: string; estimatedCostUsd: number; expectedLatencyMs: number; reason: string }[];
  rejected: { provider: string; model: string; reason: string }[];
}

/**
 * The single entry point applications use. It picks a model, calls it, retries
 * transient failures, falls back across models/providers, enforces budgets,
 * caches responses, and records metrics for every attempt.
 */
export class LLMGateway {
  readonly registry: ProviderRegistry;
  readonly metrics: MetricsCollector;
  readonly budget: BudgetTracker;
  private readonly selector: ModelSelector;
  private readonly cacheStore: CacheStore;
  private readonly inflight = new Map<string, Promise<ChatResponse>>();
  private readonly opts: GatewayOptions;
  private readonly now: () => number;
  private readonly sleep: (ms: number) => Promise<void>;

  constructor(opts: GatewayOptions = {}) {
    this.opts = opts;
    this.now = opts.now ?? Date.now;
    this.sleep = opts.sleep ?? ((ms) => new Promise((r) => setTimeout(r, ms)));
    this.registry = new ProviderRegistry(opts.circuitBreaker, this.now);
    this.metrics = new MetricsCollector(this.now);
    this.budget = new BudgetTracker(opts.budget, this.now);
    this.selector = new ModelSelector(this.registry, this.metrics);
    this.cacheStore = opts.cache?.store ?? new MemoryCacheStore(opts.cache?.maxEntries, this.now);
    for (const p of opts.providers ?? []) this.registry.register(p);
  }

  registerProvider(provider: LLMProvider): this {
    this.registry.register(provider);
    return this;
  }

  /** Dry run: which models would serve this request, in what order, and why. */
  plan(req: GatewayRequest): PlanResult {
    const strategy = this.strategyFor(req);
    const { candidates, rejected } = this.selector.rank(req, strategy);
    return {
      strategy,
      candidates: candidates.map((c) => ({
        provider: c.model.provider,
        model: c.model.id,
        estimatedCostUsd: c.estimatedCostUsd,
        expectedLatencyMs: c.expectedLatencyMs,
        reason: c.reason,
      })),
      rejected,
    };
  }

  async chat(req: GatewayRequest): Promise<ChatResponse> {
    if (!req.messages?.length) throw new LLMError('invalid_request', 'messages must not be empty');

    const ttlMs = this.cacheTtl(req);
    if (ttlMs === undefined) return this.execute(req);

    const key = cacheKey(req);
    const hit = await this.cacheStore.get(key);
    if (hit) {
      this.metrics.recordCacheHit(hit.costUsd);
      return { ...hit, cached: true, costUsd: 0, latencyMs: 0, attempts: [] };
    }
    this.metrics.recordCacheMiss();

    // Coalesce identical concurrent requests into one provider call.
    const pending = this.inflight.get(key);
    if (pending) return pending.then((r) => ({ ...r, cached: true, costUsd: 0 }));

    const p = this.execute(req)
      .then(async (res) => {
        if (res.finishReason === 'stop') await this.cacheStore.set(key, res, ttlMs);
        return res;
      })
      .finally(() => this.inflight.delete(key));
    this.inflight.set(key, p);
    return p;
  }

  stats() {
    return {
      metrics: this.metrics.snapshot(),
      budget: this.budget.snapshot(),
      circuits: this.registry.breaker.snapshot(),
    };
  }

  private strategyFor(req: GatewayRequest): SelectionStrategy {
    // Near a budget limit, automatic selection drops to the cheapest viable model.
    // An explicit strategy or pinned model from the caller is still respected.
    if (!req.strategy && !req.model && this.budget.shouldEconomize()) return 'cost';
    return req.strategy ?? this.opts.defaultStrategy ?? 'balanced';
  }

  private cacheTtl(req: GatewayRequest): number | undefined {
    const ttl = this.opts.cache?.ttlMs ?? 10 * 60_000;
    if (typeof req.cache === 'object') return req.cache.ttlMs;
    if (req.cache === true) return ttl;
    if (req.cache === false) return undefined;
    return this.opts.cache?.enabledByDefault ? ttl : undefined;
  }

  private async execute(req: GatewayRequest): Promise<ChatResponse> {
    const strategy = this.strategyFor(req);
    const { candidates, rejected } = this.selector.rank(req, strategy);
    if (!candidates.length) {
      const why = rejected.map((r) => `${r.provider}/${r.model}: ${r.reason}`).join('; ');
      throw new LLMError('no_candidates', `No model can serve this request${why ? ` (${why})` : ''}`);
    }

    const allowFallback = req.allowFallback ?? true;
    const chain = allowFallback ? candidates.slice(0, this.opts.maxModelsPerRequest ?? 4) : candidates.slice(0, 1);
    const attempts: AttemptRecord[] = [];
    let lastError: LLMError | undefined;

    for (const candidate of chain) {
      const result = await this.tryCandidate(candidate, req, attempts);
      if (result.ok) return result.response;
      lastError = result.error;
      if (!lastError.fallbackEligible) break;
    }

    const err =
      lastError ?? new LLMError('no_candidates', 'Every candidate model was skipped (circuits opened during the request)');
    err.attempts = attempts;
    throw err;
  }

  private async tryCandidate(
    candidate: Candidate,
    req: GatewayRequest,
    attempts: AttemptRecord[]
  ): Promise<{ ok: true; response: ChatResponse } | { ok: false; error: LLMError }> {
    const { model, provider } = candidate;
    const key = modelKey(model);
    const maxRetries = this.opts.retry?.maxRetriesPerModel ?? 1;

    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      // Another request may have opened the circuit while this one was waiting.
      if (!this.registry.isAvailable(model)) {
        return { ok: false, error: new LLMError('server', `${key} circuit open`, { provider: provider.name, model: model.id }) };
      }
      this.budget.assertCanSpend(candidate.estimatedCostUsd);
      this.registry.breaker.beginProbe(provider.name);
      this.registry.breaker.beginProbe(key);

      const started = this.now();
      const timeout = AbortSignal.timeout(this.opts.timeoutMs ?? 120_000);
      const signal = req.signal ? AbortSignal.any([req.signal, timeout]) : timeout;

      try {
        const res = await provider.chat(model, { ...req, signal });
        const latencyMs = this.now() - started;
        // Bill at the rates of the model that actually answered (it can differ under server-side fallback).
        const servedModel = res.model !== model.id ? this.registry.find(res.model, provider.name)?.model : undefined;
        const costUsd = costOf(servedModel ?? model, res.usage);
        this.budget.add(costUsd);

        if (res.finishReason === 'refusal' && (this.opts.fallbackOnRefusal ?? true)) {
          this.metrics.record({ ...this.event(req, candidate, latencyMs, costUsd), ok: false, usage: res.usage, errorKind: 'refusal' });
          attempts.push({ provider: provider.name, model: model.id, ok: false, latencyMs, errorKind: 'refusal' });
          return { ok: false, error: new LLMError('refusal', `${key} declined the request`, { provider: provider.name, model: model.id }) };
        }

        this.registry.breaker.success(provider.name);
        this.registry.breaker.success(key);
        this.metrics.record({ ...this.event(req, candidate, latencyMs, costUsd), ok: true, usage: res.usage });
        attempts.push({ provider: provider.name, model: model.id, ok: true, latencyMs });
        return { ok: true, response: { ...res, provider: provider.name, costUsd, latencyMs, cached: false, attempts } };
      } catch (raw) {
        const latencyMs = this.now() - started;
        // The caller cancelled: stop everything rather than falling back.
        if (req.signal?.aborted) throw new LLMError('cancelled', 'Request cancelled by caller', { cause: raw });
        const err = toLLMError(raw, provider.name, model.id);

        this.registry.breaker.failure(err.kind === 'auth' ? provider.name : key, err.kind, err.retryAfterMs);
        this.metrics.record({ ...this.event(req, candidate, latencyMs, 0), ok: false, errorKind: err.kind });
        attempts.push({ provider: provider.name, model: model.id, ok: false, latencyMs, errorKind: err.kind, error: err.message });

        if (!err.retryable || attempt === maxRetries) return { ok: false, error: err };
        await this.sleep(this.backoff(attempt, err.retryAfterMs));
      }
    }
    // Unreachable: the loop always returns.
    return { ok: false, error: new LLMError('unknown', 'retry loop exited unexpectedly') };
  }

  private event(req: GatewayRequest, c: Candidate, latencyMs: number, costUsd: number) {
    return { provider: c.provider.name, model: c.model.id, latencyMs, costUsd, tag: req.tag, timestamp: this.now() };
  }

  /** Exponential backoff with full jitter, honouring Retry-After when the provider sends one. */
  private backoff(attempt: number, retryAfterMs?: number): number {
    const base = this.opts.retry?.baseDelayMs ?? 250;
    const max = this.opts.retry?.maxDelayMs ?? 4000;
    if (retryAfterMs !== undefined) return Math.min(retryAfterMs, max);
    return Math.random() * Math.min(max, base * 2 ** attempt);
  }
}
