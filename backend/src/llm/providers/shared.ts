import { LLMError, classifyHttpStatus, parseRetryAfter } from '../errors';
import type { ChatMessage, ChatRequest } from '../types';

/** Collects `system` messages (and request.system) into one prompt, leaving user/assistant turns. */
export function splitSystem(request: ChatRequest): { system?: string; turns: ChatMessage[] } {
  const systemParts: string[] = [];
  if (request.system) systemParts.push(request.system);
  const turns: ChatMessage[] = [];
  for (const m of request.messages) {
    if (m.role === 'system') systemParts.push(m.content);
    else turns.push(m);
  }
  return { system: systemParts.length ? systemParts.join('\n\n') : undefined, turns };
}

/**
 * POSTs JSON and maps every failure mode onto an LLMError so the gateway can
 * decide between retrying, falling back, or giving up.
 */
export async function postJson<T>(
  url: string,
  body: unknown,
  opts: { headers: Record<string, string>; signal?: AbortSignal; provider: string; model: string; fetchImpl?: typeof fetch }
): Promise<T> {
  const { provider, model } = opts;
  let res: Response;
  try {
    res = await (opts.fetchImpl ?? fetch)(url, {
      method: 'POST',
      headers: { 'content-type': 'application/json', ...opts.headers },
      body: JSON.stringify(body),
      signal: opts.signal,
    });
  } catch (err) {
    const aborted = err instanceof Error && (err.name === 'AbortError' || err.name === 'TimeoutError');
    throw new LLMError(aborted ? 'timeout' : 'network', `${provider}: ${(err as Error).message}`, {
      provider,
      model,
      cause: err,
    });
  }

  const text = await res.text();
  if (!res.ok) {
    throw new LLMError(classifyHttpStatus(res.status, text), `${provider} HTTP ${res.status}: ${text.slice(0, 500)}`, {
      provider,
      model,
      status: res.status,
      retryAfterMs: parseRetryAfter(res.headers.get('retry-after')),
    });
  }
  try {
    return JSON.parse(text) as T;
  } catch (err) {
    throw new LLMError('server', `${provider}: invalid JSON response`, { provider, model, cause: err });
  }
}
