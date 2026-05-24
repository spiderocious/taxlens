import { z } from 'zod';

// z.coerce.boolean() coerces ANY non-empty string to true (so "false" → true).
// Parse the literal strings instead.
const boolFromEnv = z
  .enum(['true', 'false'])
  .default('false')
  .transform((v) => v === 'true');

const EnvSchema = z.object({
  NODE_ENV: z.enum(['development', 'test', 'production']).default('development'),
  PORT: z.coerce.number().default(8081),
  LOG_LEVEL: z.enum(['trace', 'debug', 'info', 'warn', 'error']).default('info'),

  APP_BASE_URL: z.string().url(),
  WEB_BASE_URL: z.string().url(),

  // Persistence (v1.5 — stateful). The statement pipeline + chat continuation
  // need a lifecycle; see docs/product/statement-pipeline.md.
  MONGODB_URI: z.string().min(1),
  MONGODB_DB_NAME: z.string().default('taxlens'),

  // OpenAI — Module 1 (two-tier parse) + Module 4 (grounded follow-up).
  // Optional so dev/test can boot without it; the LLM client degrades to a
  // clearly-failed pipeline when absent rather than crashing the process.
  OPENAI_API_KEY: z.string().optional(),
  OPENAI_GATE_MODEL: z.string().default('gpt-4o-mini'),
  OPENAI_ANALYSIS_MODEL: z.string().default('gpt-4o'),
  OPENAI_CHAT_MODEL: z.string().default('gpt-4o'),

  // Circuit breaker around the OpenAI client.
  CIRCUIT_FAILURE_THRESHOLD: z.coerce.number().int().positive().default(5),
  CIRCUIT_COOLDOWN_MS: z.coerce.number().int().positive().default(30_000),

  // Reaper — deletes idle tax processes (and their audit) past the TTL.
  REAPER_INTERVAL_MS: z.coerce.number().int().positive().default(300_000),
  PROCESS_TTL_MS: z.coerce.number().int().positive().default(3_600_000),

  // Upload bounds for the statement parse endpoint.
  STATEMENT_MAX_BYTES: z.coerce.number().int().positive().default(10_485_760), // 10MB

  // LLM transport. 'openai' = real API (default). 'stub' = deterministic
  // in-process fake for tests/CI — never enable in production (guarded below).
  // The seam lives entirely inside lib/llm/openai-client.ts; call sites are
  // unchanged. See docs/qas/backend/plans/llm-stub-seam-spec.md.
  LLM_MODE: z.enum(['openai', 'stub']).default('openai'),
  // Stub steering (only consulted when LLM_MODE=stub):
  //  - LLM_STUB_UNCONFIGURED: simulate a missing key → 503/1007 without unsetting the real key.
  //  - LLM_STUB_FAIL_TIMES: make the next N calls throw (to trip the circuit), then succeed.
  //  - LLM_STUB_CHAT: 'refuse' forces refused:true on chat (also triggered by "VAT" in the question).
  LLM_STUB_UNCONFIGURED: boolFromEnv,
  LLM_STUB_FAIL_TIMES: z.coerce.number().int().nonnegative().default(0),
  LLM_STUB_CHAT: z.enum(['answer', 'refuse']).default('answer'),
});

export type Env = z.infer<typeof EnvSchema>;

const parsed = EnvSchema.safeParse(process.env);
if (!parsed.success) {
  const issues = parsed.error.issues.map((i) => `  ${i.path.join('.')}: ${i.message}`).join('\n');
  throw new Error(`Invalid environment variables:\n${issues}`);
}

// Stub transport must never be reachable in production.
if (parsed.data.NODE_ENV === 'production' && parsed.data.LLM_MODE === 'stub') {
  throw new Error('LLM_MODE=stub is not allowed in production');
}

export const env: Env = parsed.data;
