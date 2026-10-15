import { NextFunction, Request, Response } from 'express';
import { timingSafeEqual } from 'crypto';
import { z } from 'zod';
import { LLMError, LLMGateway, createGatewayFromEnv } from '../llm';

let gateway: LLMGateway | undefined;
function getGateway(): LLMGateway {
  return (gateway ??= createGatewayFromEnv());
}

/** For tests: swap in a gateway built from mock providers. */
export function setGateway(g: LLMGateway): void {
  gateway = g;
}

/**
 * The LLM endpoints spend real money, so they are off unless LLM_API_TOKEN is
 * set, and every call must present it as a bearer token.
 */
export const requireLlmToken = (req: Request, res: Response, next: NextFunction) => {
  const expected = process.env.LLM_API_TOKEN;
  if (!expected) return res.status(503).json({ success: false, error: 'LLM gateway is disabled (LLM_API_TOKEN not set)' });
  const given = (req.headers.authorization ?? '').replace(/^Bearer\s+/i, '');
  const a = Buffer.from(given);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) {
    return res.status(401).json({ success: false, error: 'Invalid LLM API token' });
  }
  next();
};

const message = z.object({ role: z.enum(['system', 'user', 'assistant']), content: z.string().min(1) });

const chatSchema = z.object({
  messages: z.array(message).min(1),
  system: z.string().optional(),
  model: z.string().optional(),
  provider: z.string().optional(),
  strategy: z.enum(['cost', 'quality', 'latency', 'balanced']).optional(),
  requiredCapabilities: z.array(z.enum(['chat', 'vision', 'tools', 'json', 'reasoning', 'long_context'])).optional(),
  maxTokens: z.number().int().positive().max(128_000).optional(),
  temperature: z.number().min(0).max(2).optional(),
  effort: z.enum(['low', 'medium', 'high', 'xhigh', 'max']).optional(),
  stop: z.array(z.string()).max(8).optional(),
  maxCostUsd: z.number().positive().optional(),
  minQuality: z.number().min(1).max(100).optional(),
  cache: z.union([z.boolean(), z.object({ ttlMs: z.number().int().positive() })]).optional(),
  allowFallback: z.boolean().optional(),
  tag: z.string().max(64).optional(),
});

const STATUS: Partial<Record<LLMError['kind'], number>> = {
  invalid_request: 400,
  context_length: 400,
  no_candidates: 422,
  refusal: 422,
  budget: 429,
  rate_limit: 503,
  auth: 502,
  server: 502,
  network: 502,
  timeout: 504,
};

function sendError(res: Response, err: unknown, next: NextFunction) {
  if (err instanceof z.ZodError) return res.status(400).json({ success: false, error: 'Invalid request', issues: err.issues });
  if (err instanceof LLMError) {
    return res.status(STATUS[err.kind] ?? 500).json({ success: false, error: err.message, kind: err.kind, attempts: err.attempts });
  }
  next(err);
}

export const chat = async (req: Request, res: Response, next: NextFunction) => {
  try {
    const body = chatSchema.parse(req.body);
    const controller = new AbortController();
    // Stop paying for a response nobody is waiting for.
    res.on('close', () => {
      if (!res.writableFinished) controller.abort();
    });
    const result = await getGateway().chat({ ...body, signal: controller.signal });
    const { raw: _raw, ...rest } = result;
    res.json({ success: true, data: rest });
  } catch (err) {
    sendError(res, err, next);
  }
};

export const plan = (req: Request, res: Response, next: NextFunction) => {
  try {
    res.json({ success: true, data: getGateway().plan(chatSchema.parse(req.body)) });
  } catch (err) {
    sendError(res, err, next);
  }
};

export const listModels = (_req: Request, res: Response) => {
  const models = getGateway()
    .registry.models()
    .map(({ model, available }) => ({ ...model, available }));
  res.json({ success: true, data: models });
};

export const stats = (_req: Request, res: Response) => {
  res.json({ success: true, data: getGateway().stats() });
};
