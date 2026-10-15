import type { ErrorKind } from './errors';
import type { LLMProvider, ModelInfo } from './types';

export interface CircuitBreakerOptions {
  /** Consecutive failures before a model is taken out of rotation. */
  failureThreshold?: number;
  /** How long an open circuit stays open before one probe request is let through. */
  cooldownMs?: number;
  /** Cooldown applied to the whole provider after an auth failure. */
  authCooldownMs?: number;
}

type BreakerState = { failures: number; openUntil: number; probing: boolean };

/**
 * Tracks failures per provider and per model. A circuit opens after
 * `failureThreshold` consecutive failures, and half-opens after the cooldown
 * to let a single probe through. Rate limits with a Retry-After open the
 * circuit for exactly that long.
 */
export class CircuitBreaker {
  private readonly states = new Map<string, BreakerState>();
  private readonly threshold: number;
  private readonly cooldownMs: number;
  private readonly authCooldownMs: number;

  constructor(opts: CircuitBreakerOptions = {}, private readonly now: () => number = Date.now) {
    this.threshold = opts.failureThreshold ?? 3;
    this.cooldownMs = opts.cooldownMs ?? 30_000;
    this.authCooldownMs = opts.authCooldownMs ?? 5 * 60_000;
  }

  isOpen(key: string): boolean {
    const s = this.states.get(key);
    if (!s || s.openUntil === 0) return false;
    if (this.now() < s.openUntil) return true;
    // Cooldown elapsed: half-open. Allow one probe at a time.
    return s.probing;
  }

  /** Marks that a request is going through a half-open circuit. */
  beginProbe(key: string): void {
    const s = this.states.get(key);
    if (s && s.openUntil !== 0 && this.now() >= s.openUntil) s.probing = true;
  }

  success(key: string): void {
    this.states.delete(key);
  }

  failure(key: string, kind: ErrorKind, retryAfterMs?: number): void {
    const s = this.states.get(key) ?? { failures: 0, openUntil: 0, probing: false };
    s.failures += 1;
    s.probing = false;
    if (kind === 'auth') s.openUntil = this.now() + this.authCooldownMs;
    else if (kind === 'rate_limit' && retryAfterMs) s.openUntil = this.now() + retryAfterMs;
    else if (s.failures >= this.threshold) s.openUntil = this.now() + this.cooldownMs;
    this.states.set(key, s);
  }

  snapshot(): Record<string, { failures: number; open: boolean; openUntil?: string }> {
    const out: Record<string, { failures: number; open: boolean; openUntil?: string }> = {};
    for (const [key, s] of this.states) {
      out[key] = {
        failures: s.failures,
        open: this.isOpen(key),
        ...(s.openUntil ? { openUntil: new Date(s.openUntil).toISOString() } : {}),
      };
    }
    return out;
  }
}

export interface RegisteredModel {
  model: ModelInfo;
  provider: LLMProvider;
  available: boolean;
}

/** Holds providers, their model catalogs, overrides, and health state. */
export class ProviderRegistry {
  private readonly providers = new Map<string, LLMProvider>();
  private readonly disabledProviders = new Set<string>();
  readonly breaker: CircuitBreaker;

  constructor(breakerOptions?: CircuitBreakerOptions, now?: () => number) {
    this.breaker = new CircuitBreaker(breakerOptions, now);
  }

  register(provider: LLMProvider): this {
    if (this.providers.has(provider.name)) throw new Error(`Provider "${provider.name}" is already registered`);
    this.providers.set(provider.name, provider);
    return this;
  }

  unregister(name: string): boolean {
    this.disabledProviders.delete(name);
    return this.providers.delete(name);
  }

  setEnabled(name: string, enabled: boolean): void {
    if (enabled) this.disabledProviders.delete(name);
    else this.disabledProviders.add(name);
  }

  get(name: string): LLMProvider | undefined {
    return this.providers.get(name);
  }

  providerNames(): string[] {
    return [...this.providers.keys()];
  }

  /** Every model from every provider, with current availability. */
  models(): RegisteredModel[] {
    const out: RegisteredModel[] = [];
    for (const provider of this.providers.values()) {
      for (const model of provider.models()) {
        out.push({ model, provider, available: this.isAvailable(model) });
      }
    }
    return out;
  }

  /** Finds a model by id (optionally scoped to a provider), or by "provider/model". */
  find(id: string, providerName?: string): RegisteredModel | undefined {
    let pName = providerName;
    let mId = id;
    if (!pName && id.includes('/') && this.providers.has(id.split('/')[0])) {
      [pName, mId] = [id.slice(0, id.indexOf('/')), id.slice(id.indexOf('/') + 1)];
    }
    return this.models().find((r) => r.model.id === mId && (!pName || r.provider.name === pName));
  }

  isAvailable(model: ModelInfo): boolean {
    if (this.disabledProviders.has(model.provider)) return false;
    return !this.breaker.isOpen(model.provider) && !this.breaker.isOpen(modelKey(model));
  }
}

export function modelKey(model: Pick<ModelInfo, 'provider' | 'id'>): string {
  return `${model.provider}/${model.id}`;
}
