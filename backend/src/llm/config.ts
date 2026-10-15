import { readFileSync } from 'fs';
import { z } from 'zod';
import { LLMGateway } from './gateway';
import { AnthropicProvider } from './providers/anthropic';
import { GeminiProvider } from './providers/gemini';
import { OpenAICompatibleProvider } from './providers/openaiCompatible';
import type { LLMProvider, ModelInfo } from './types';

const capability = z.enum(['chat', 'vision', 'tools', 'json', 'reasoning', 'long_context']);

const modelSchema = z.object({
  id: z.string(),
  displayName: z.string().optional(),
  contextWindow: z.number().int().positive(),
  maxOutputTokens: z.number().int().positive(),
  pricing: z.object({
    inputPerMTok: z.number().nonnegative(),
    outputPerMTok: z.number().nonnegative(),
    cachedInputPerMTok: z.number().nonnegative().optional(),
    cacheWritePerMTok: z.number().nonnegative().optional(),
  }),
  capabilities: z.array(capability).default(['chat']),
  qualityScore: z.number().min(1).max(100),
  tier: z.enum(['economy', 'standard', 'premium']),
  supportsTemperature: z.boolean().optional(),
  supportsEffort: z.boolean().optional(),
  disabled: z.boolean().optional(),
});

const providerSchema = z.discriminatedUnion('type', [
  z.object({
    type: z.literal('anthropic'),
    name: z.string().default('anthropic'),
    apiKeyEnv: z.string().default('ANTHROPIC_API_KEY'),
    /** Replaces the built-in Anthropic catalog when given. */
    models: z.array(modelSchema).optional(),
    serverSideFallback: z.boolean().optional(),
  }),
  z.object({
    type: z.literal('openai-compatible'),
    name: z.string(),
    baseUrl: z.string().url(),
    /** Omit for keyless local servers such as Ollama. */
    apiKeyEnv: z.string().optional(),
    maxTokensField: z.enum(['max_tokens', 'max_completion_tokens']).optional(),
    models: z.array(modelSchema).min(1),
  }),
  z.object({
    type: z.literal('gemini'),
    name: z.string().default('gemini'),
    apiKeyEnv: z.string().default('GEMINI_API_KEY'),
    baseUrl: z.string().url().optional(),
    models: z.array(modelSchema).min(1),
  }),
]);

export const configSchema = z.object({
  defaultStrategy: z.enum(['cost', 'quality', 'latency', 'balanced']).default('balanced'),
  maxModelsPerRequest: z.number().int().positive().optional(),
  timeoutMs: z.number().int().positive().optional(),
  fallbackOnRefusal: z.boolean().optional(),
  retry: z
    .object({
      maxRetriesPerModel: z.number().int().nonnegative().optional(),
      baseDelayMs: z.number().nonnegative().optional(),
      maxDelayMs: z.number().nonnegative().optional(),
    })
    .optional(),
  circuitBreaker: z
    .object({
      failureThreshold: z.number().int().positive().optional(),
      cooldownMs: z.number().int().positive().optional(),
      authCooldownMs: z.number().int().positive().optional(),
    })
    .optional(),
  budget: z
    .object({
      dailyUsd: z.number().positive().optional(),
      monthlyUsd: z.number().positive().optional(),
      economizeAt: z.number().min(0).max(1).optional(),
    })
    .optional(),
  cache: z
    .object({
      enabledByDefault: z.boolean().optional(),
      ttlMs: z.number().int().positive().optional(),
      maxEntries: z.number().int().positive().optional(),
    })
    .optional(),
  providers: z.array(providerSchema).default([]),
});

export type LLMConfig = z.infer<typeof configSchema>;

/**
 * Builds providers from config. A provider whose API key env var is unset is
 * skipped (with a warning) rather than failing startup.
 */
export function buildProviders(config: LLMConfig, env: NodeJS.ProcessEnv = process.env): LLMProvider[] {
  const out: LLMProvider[] = [];
  for (const p of config.providers) {
    const apiKey = p.apiKeyEnv ? env[p.apiKeyEnv] : undefined;
    if (p.apiKeyEnv && !apiKey) {
      console.warn(`[llm] Skipping provider "${p.name}": ${p.apiKeyEnv} is not set`);
      continue;
    }
    const models = p.models?.map((m) => ({ ...m, provider: p.name }) as ModelInfo);
    switch (p.type) {
      case 'anthropic':
        out.push(new AnthropicProvider({ name: p.name, apiKey, models, serverSideFallback: p.serverSideFallback }));
        break;
      case 'openai-compatible':
        out.push(
          new OpenAICompatibleProvider({ name: p.name, baseUrl: p.baseUrl, apiKey, maxTokensField: p.maxTokensField, models: models! })
        );
        break;
      case 'gemini':
        out.push(new GeminiProvider({ name: p.name, apiKey: apiKey!, baseUrl: p.baseUrl, models: models! }));
        break;
    }
  }
  return out;
}

/**
 * Loads `LLM_CONFIG_FILE` (JSON) if set. Without a config file, an Anthropic
 * provider with the built-in catalog is enabled whenever ANTHROPIC_API_KEY is set.
 * LLM_DAILY_BUDGET_USD / LLM_MONTHLY_BUDGET_USD override the file's budget.
 */
export function loadConfig(env: NodeJS.ProcessEnv = process.env): LLMConfig {
  const raw = env.LLM_CONFIG_FILE ? JSON.parse(readFileSync(env.LLM_CONFIG_FILE, 'utf8')) : {};
  const config = configSchema.parse(raw);
  if (!env.LLM_CONFIG_FILE && env.ANTHROPIC_API_KEY) {
    config.providers.push(providerSchema.parse({ type: 'anthropic' }) as LLMConfig['providers'][number]);
  }
  const daily = Number(env.LLM_DAILY_BUDGET_USD);
  const monthly = Number(env.LLM_MONTHLY_BUDGET_USD);
  if (daily > 0 || monthly > 0) {
    config.budget = { ...config.budget, ...(daily > 0 ? { dailyUsd: daily } : {}), ...(monthly > 0 ? { monthlyUsd: monthly } : {}) };
  }
  return config;
}

export function createGatewayFromConfig(config: LLMConfig, env: NodeJS.ProcessEnv = process.env): LLMGateway {
  const { providers, ...options } = config;
  return new LLMGateway({ ...options, providers: buildProviders({ ...config, providers }, env) });
}

export function createGatewayFromEnv(env: NodeJS.ProcessEnv = process.env): LLMGateway {
  return createGatewayFromConfig(loadConfig(env), env);
}
