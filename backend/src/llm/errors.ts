export type ErrorKind =
  | 'rate_limit'
  | 'timeout'
  | 'network'
  | 'server'
  | 'auth'
  | 'invalid_request'
  | 'context_length'
  | 'refusal'
  | 'budget'
  | 'no_candidates'
  | 'cancelled'
  | 'unknown';

/** Errors worth retrying against the same model after a backoff. */
const RETRYABLE: ReadonlySet<ErrorKind> = new Set(['rate_limit', 'timeout', 'network', 'server']);

/**
 * Errors where trying a *different* model/provider can help. A malformed request
 * (invalid_request) or an exhausted budget will fail everywhere, so those stop the chain.
 */
const FALLBACK_ELIGIBLE: ReadonlySet<ErrorKind> = new Set([
  'rate_limit',
  'timeout',
  'network',
  'server',
  'auth',
  'context_length',
  'refusal',
  'unknown',
]);

export class LLMError extends Error {
  readonly kind: ErrorKind;
  readonly provider?: string;
  readonly model?: string;
  readonly status?: number;
  readonly retryAfterMs?: number;
  /** Populated on the final error thrown by the gateway. */
  attempts?: import('./types').AttemptRecord[];

  constructor(
    kind: ErrorKind,
    message: string,
    details: { provider?: string; model?: string; status?: number; retryAfterMs?: number; cause?: unknown } = {}
  ) {
    super(message, details.cause !== undefined ? { cause: details.cause } : undefined);
    this.name = 'LLMError';
    this.kind = kind;
    this.provider = details.provider;
    this.model = details.model;
    this.status = details.status;
    this.retryAfterMs = details.retryAfterMs;
  }

  get retryable(): boolean {
    return RETRYABLE.has(this.kind);
  }

  get fallbackEligible(): boolean {
    return FALLBACK_ELIGIBLE.has(this.kind);
  }
}

export function classifyHttpStatus(status: number, body = ''): ErrorKind {
  if (status === 401 || status === 403) return 'auth';
  if (status === 408) return 'timeout';
  if (status === 429) return 'rate_limit';
  if (status >= 500) return 'server';
  if (status === 413 || /context|too long|too many tokens|maximum.*tokens/i.test(body)) return 'context_length';
  if (status >= 400) return 'invalid_request';
  return 'unknown';
}

/** Parses a Retry-After header (seconds or HTTP date) into milliseconds. */
export function parseRetryAfter(value: string | null | undefined, now = Date.now()): number | undefined {
  if (!value) return undefined;
  const seconds = Number(value);
  if (Number.isFinite(seconds)) return Math.max(0, seconds * 1000);
  const date = Date.parse(value);
  return Number.isNaN(date) ? undefined : Math.max(0, date - now);
}

export function toLLMError(err: unknown, provider?: string, model?: string): LLMError {
  if (err instanceof LLMError) return err;
  if (err instanceof Error && err.name === 'AbortError') {
    return new LLMError('timeout', err.message || 'Request aborted', { provider, model, cause: err });
  }
  const message = err instanceof Error ? err.message : String(err);
  return new LLMError('unknown', message, { provider, model, cause: err });
}
