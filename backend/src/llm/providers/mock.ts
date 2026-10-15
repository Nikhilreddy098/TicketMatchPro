import { LLMError, type ErrorKind } from '../errors';
import type { ChatRequest, LLMProvider, ModelInfo, ProviderResponse } from '../types';

export type MockBehavior =
  | { type: 'ok'; text?: string; latencyMs?: number; outputTokens?: number }
  | { type: 'error'; kind: ErrorKind; retryAfterMs?: number; latencyMs?: number }
  | { type: 'refusal' };

/**
 * Deterministic in-process provider for tests, local development and demos.
 * Behaviors are consumed per model in order; the last one repeats.
 */
export class MockProvider implements LLMProvider {
  readonly name: string;
  readonly calls: { model: string; request: ChatRequest }[] = [];
  private readonly modelList: ModelInfo[];
  private readonly scripts = new Map<string, MockBehavior[]>();

  constructor(name: string, models: Omit<ModelInfo, 'provider'>[]) {
    this.name = name;
    this.modelList = models.map((m) => ({ ...m, provider: name }));
  }

  models(): ModelInfo[] {
    return this.modelList;
  }

  script(modelId: string, ...behaviors: MockBehavior[]): this {
    this.scripts.set(modelId, behaviors);
    return this;
  }

  async chat(model: ModelInfo, request: ChatRequest): Promise<ProviderResponse> {
    this.calls.push({ model: model.id, request });
    const queue = this.scripts.get(model.id) ?? [];
    const behavior: MockBehavior = (queue.length > 1 ? queue.shift() : queue[0]) ?? { type: 'ok' };

    if ('latencyMs' in behavior && behavior.latencyMs) await delay(behavior.latencyMs, request.signal);

    if (behavior.type === 'error') {
      throw new LLMError(behavior.kind, `mock ${behavior.kind}`, {
        provider: this.name,
        model: model.id,
        retryAfterMs: behavior.retryAfterMs,
      });
    }

    const inputTokens = Math.ceil(request.messages.reduce((n, m) => n + m.content.length, 0) / 4);
    if (behavior.type === 'refusal') {
      return { text: '', finishReason: 'refusal', model: model.id, usage: { inputTokens, outputTokens: 0 } };
    }
    const text = behavior.text ?? `[${this.name}/${model.id}] ok`;
    return {
      text,
      finishReason: 'stop',
      model: model.id,
      usage: { inputTokens, outputTokens: behavior.outputTokens ?? Math.ceil(text.length / 4) },
    };
  }
}

function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    const t = setTimeout(resolve, ms);
    signal?.addEventListener(
      'abort',
      () => {
        clearTimeout(t);
        const err = new Error('aborted');
        err.name = 'AbortError';
        reject(err);
      },
      { once: true }
    );
  });
}
