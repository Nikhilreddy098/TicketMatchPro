import { DEFAULT_MAX_TOKENS } from '../catalog';
import type { ChatRequest, FinishReason, LLMProvider, ModelInfo, ProviderResponse } from '../types';
import { postJson } from './shared';

export interface OpenAICompatibleOptions {
  /** Provider name used in metrics and model ids, e.g. "openai", "groq", "ollama". */
  name: string;
  baseUrl: string;
  apiKey?: string;
  models: ModelInfo[];
  /** Newer OpenAI models want max_completion_tokens; many compatible servers still want max_tokens. */
  maxTokensField?: 'max_tokens' | 'max_completion_tokens';
  extraHeaders?: Record<string, string>;
  fetchImpl?: typeof fetch;
}

interface ChatCompletion {
  model: string;
  choices: { message?: { content?: string | null }; finish_reason?: string | null }[];
  usage?: {
    prompt_tokens?: number;
    completion_tokens?: number;
    prompt_tokens_details?: { cached_tokens?: number };
  };
}

/**
 * Adapter for the OpenAI Chat Completions wire format, which OpenAI and many
 * other hosts (Groq, Together, OpenRouter, vLLM, Ollama, ...) implement.
 */
export class OpenAICompatibleProvider implements LLMProvider {
  readonly name: string;
  private readonly opts: OpenAICompatibleOptions;
  private readonly modelList: ModelInfo[];

  constructor(opts: OpenAICompatibleOptions) {
    this.name = opts.name;
    this.opts = opts;
    this.modelList = opts.models.map((m) => ({ ...m, provider: opts.name }));
  }

  models(): ModelInfo[] {
    return this.modelList;
  }

  async chat(model: ModelInfo, request: ChatRequest): Promise<ProviderResponse> {
    const messages = [
      ...(request.system ? [{ role: 'system', content: request.system }] : []),
      ...request.messages.map((m) => ({ role: m.role, content: m.content })),
    ];
    const body: Record<string, unknown> = {
      model: model.id,
      messages,
      [this.opts.maxTokensField ?? 'max_completion_tokens']: Math.min(
        request.maxTokens ?? DEFAULT_MAX_TOKENS,
        model.maxOutputTokens
      ),
    };
    if (request.stop?.length) body.stop = request.stop;
    if (request.temperature !== undefined && model.supportsTemperature !== false) body.temperature = request.temperature;
    if (request.effort && model.supportsEffort) body.reasoning_effort = toReasoningEffort(request.effort);

    const res = await postJson<ChatCompletion>(`${this.opts.baseUrl.replace(/\/$/, '')}/chat/completions`, body, {
      headers: {
        ...(this.opts.apiKey ? { authorization: `Bearer ${this.opts.apiKey}` } : {}),
        ...this.opts.extraHeaders,
      },
      signal: request.signal,
      provider: this.name,
      model: model.id,
      fetchImpl: this.opts.fetchImpl,
    });

    const choice = res.choices[0];
    const prompt = res.usage?.prompt_tokens ?? 0;
    const cached = res.usage?.prompt_tokens_details?.cached_tokens ?? 0;
    return {
      text: choice?.message?.content ?? '',
      finishReason: mapFinish(choice?.finish_reason),
      model: res.model ?? model.id,
      usage: {
        // prompt_tokens includes cached tokens; split them so they're priced separately.
        inputTokens: Math.max(0, prompt - cached),
        cachedInputTokens: cached,
        outputTokens: res.usage?.completion_tokens ?? 0,
      },
      raw: res,
    };
  }
}

function toReasoningEffort(effort: NonNullable<ChatRequest['effort']>): string {
  return effort === 'xhigh' || effort === 'max' ? 'high' : effort;
}

function mapFinish(reason: string | null | undefined): FinishReason {
  switch (reason) {
    case 'stop':
      return 'stop';
    case 'length':
      return 'length';
    case 'content_filter':
      return 'refusal';
    case 'tool_calls':
    case 'function_call':
      return 'tool_use';
    default:
      return 'other';
  }
}
