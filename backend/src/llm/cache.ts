import { createHash } from 'crypto';
import type { ChatResponse, GatewayRequest } from './types';

/** Pluggable storage so a shared store (Redis, etc.) can replace the in-memory default. */
export interface CacheStore {
  get(key: string): Promise<ChatResponse | undefined> | ChatResponse | undefined;
  set(key: string, value: ChatResponse, ttlMs: number): Promise<void> | void;
}

/** Bounded in-memory LRU with per-entry TTL. */
export class MemoryCacheStore implements CacheStore {
  private readonly entries = new Map<string, { value: ChatResponse; expiresAt: number }>();

  constructor(private readonly maxEntries = 500, private readonly now: () => number = Date.now) {}

  get(key: string): ChatResponse | undefined {
    const e = this.entries.get(key);
    if (!e) return undefined;
    if (this.now() >= e.expiresAt) {
      this.entries.delete(key);
      return undefined;
    }
    // Refresh recency.
    this.entries.delete(key);
    this.entries.set(key, e);
    return e.value;
  }

  set(key: string, value: ChatResponse, ttlMs: number): void {
    this.entries.delete(key);
    this.entries.set(key, { value, expiresAt: this.now() + ttlMs });
    while (this.entries.size > this.maxEntries) {
      this.entries.delete(this.entries.keys().next().value as string);
    }
  }

  get size(): number {
    return this.entries.size;
  }
}

/**
 * Cache key over everything that affects the output. Routing hints that only
 * pick *which* model answers (strategy, maxCostUsd, ...) are included too, so a
 * "cheapest" answer is never served to a "best quality" request.
 */
export function cacheKey(req: GatewayRequest): string {
  const material = {
    m: req.messages,
    s: req.system ?? null,
    mt: req.maxTokens ?? null,
    t: req.temperature ?? null,
    e: req.effort ?? null,
    st: req.stop ?? null,
    model: req.model ?? null,
    p: req.provider ?? null,
    strat: req.strategy ?? null,
    caps: req.requiredCapabilities ? [...req.requiredCapabilities].sort() : null,
    q: req.minQuality ?? null,
  };
  return createHash('sha256').update(JSON.stringify(material)).digest('hex');
}
