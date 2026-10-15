import { DEFAULT_MAX_TOKENS } from '../catalog';
import type { ChatRequest, FinishReason, LLMProvider, ModelInfo, ProviderResponse } from '../types';
import { postJson, splitSystem } from './shared';

export interface GeminiProviderOptions {
  apiKey: string;
  models: ModelInfo[];
  baseUrl?: string;
  name?: string;
  fetchImpl?: typeof fetch;
}

interface GenerateContentResponse {
  modelVersion?: string;
  candidates?: { content?: { parts?: { text?: string; thought?: boolean }[] }; finishReason?: string }[];
  promptFeedback?: { blockReason?: string };
  usageMetadata?: {
    promptTokenCount?: number;
    candidatesTokenCount?: number;
    cachedContentTokenCount?: number;
    thoughtsTokenCount?: number;
  };
}

/** Adapter for the Gemini API's generateContent REST endpoint. */
export class GeminiProvider implements LLMProvider {
  readonly name: string;
  private readonly opts: GeminiProviderOptions;
  private readonly modelList: ModelInfo[];

  constructor(opts: GeminiProviderOptions) {
    this.name = opts.name ?? 'gemini';
    this.opts = opts;
    this.modelList = opts.models.map((m) => ({ ...m, provider: this.name }));
  }

  models(): ModelInfo[] {
    return this.modelList;
  }

  async chat(model: ModelInfo, request: ChatRequest): Promise<ProviderResponse> {
    const { system, turns } = splitSystem(request);
    const body = {
      contents: turns.map((m) => ({ role: m.role === 'assistant' ? 'model' : 'user', parts: [{ text: m.content }] })),
      ...(system ? { systemInstruction: { parts: [{ text: system }] } } : {}),
      generationConfig: {
        maxOutputTokens: Math.min(request.maxTokens ?? DEFAULT_MAX_TOKENS, model.maxOutputTokens),
        ...(request.temperature !== undefined && model.supportsTemperature !== false
          ? { temperature: request.temperature }
          : {}),
        ...(request.stop?.length ? { stopSequences: request.stop } : {}),
      },
    };

    const base = (this.opts.baseUrl ?? 'https://generativelanguage.googleapis.com').replace(/\/$/, '');
    const res = await postJson<GenerateContentResponse>(
      `${base}/v1beta/models/${encodeURIComponent(model.id)}:generateContent`,
      body,
      {
        headers: { 'x-goog-api-key': this.opts.apiKey },
        signal: request.signal,
        provider: this.name,
        model: model.id,
        fetchImpl: this.opts.fetchImpl,
      }
    );

    const candidate = res.candidates?.[0];
    const text = (candidate?.content?.parts ?? [])
      .filter((p) => !p.thought && p.text)
      .map((p) => p.text)
      .join('');
    const usage = res.usageMetadata ?? {};
    const cached = usage.cachedContentTokenCount ?? 0;

    return {
      text,
      finishReason: res.promptFeedback?.blockReason ? 'refusal' : mapFinish(candidate?.finishReason),
      model: res.modelVersion ?? model.id,
      usage: {
        inputTokens: Math.max(0, (usage.promptTokenCount ?? 0) - cached),
        cachedInputTokens: cached,
        // Thinking tokens are billed at the output rate.
        outputTokens: (usage.candidatesTokenCount ?? 0) + (usage.thoughtsTokenCount ?? 0),
      },
      raw: res,
    };
  }
}

function mapFinish(reason: string | undefined): FinishReason {
  switch (reason) {
    case 'STOP':
      return 'stop';
    case 'MAX_TOKENS':
      return 'length';
    case 'SAFETY':
    case 'RECITATION':
    case 'BLOCKLIST':
    case 'PROHIBITED_CONTENT':
    case 'SPII':
      return 'refusal';
    default:
      return 'other';
  }
}
