import { createHash } from 'node:crypto';

import OpenAI from 'openai';
import { zodTextFormat } from 'openai/helpers/zod';
import type { z } from 'zod';

import { UpstreamUnavailableError } from '@lib/errors.js';
import { requestContext } from '@lib/http/requestContext.js';
import { logger } from '@lib/logger.js';
import {
  llmAuditRepository,
  type CircuitState,
  type LlmTier,
} from '@lib/mongo/llm-audit.repository.js';

import { env } from '../../env.js';

import { CircuitBreaker, CircuitOpenError } from './circuit-breaker.js';
import { stubInvoke } from './stub-transport.js';

const breaker = new CircuitBreaker(env.CIRCUIT_FAILURE_THRESHOLD, env.CIRCUIT_COOLDOWN_MS);

let _client: OpenAI | null = null;
const getClient = (): OpenAI => {
  if (!env.OPENAI_API_KEY) {
    // No key → behave exactly like an unavailable upstream so callers have one
    // failure path to handle (pipeline marks the process failed, /ai/ask 503s).
    throw new UpstreamUnavailableError('AI is not configured (missing OPENAI_API_KEY)');
  }
  if (!_client) _client = new OpenAI({ apiKey: env.OPENAI_API_KEY });
  return _client;
};

const promptHash = (input: string): string =>
  createHash('sha256').update(input).digest('hex').slice(0, 32);

export interface PdfAttachment {
  filename: string;
  base64: string; // raw base64 (no data: prefix)
}

export interface StructuredCallParams<T> {
  tier: LlmTier;
  code: string;
  model: string;
  system: string;
  user: string;
  schema: z.ZodType<T>;
  schemaName: string;
  /** Attach a PDF to the user turn — the model reads it natively (input_file). */
  pdf?: PdfAttachment;
  /** Continue a prior conversation (chat tier). */
  previousResponseId?: string;
}

export interface StructuredCallResult<T> {
  data: T;
  responseId: string;
}

// What a transport (real OpenAI or the stub) must return for a single call.
// `parsed` is the raw object; the shell below validates it against the
// caller-supplied zod schema, so a transport that drifts fails loudly.
export interface TransportResult {
  parsed: unknown;
  responseId: string;
  inputTokens: number;
  outputTokens: number;
}

export type Transport = <T>(params: StructuredCallParams<T>) => Promise<TransportResult>;

// ── Real OpenAI transport ────────────────────────────────────────────────────
const openaiInvoke: Transport = async (params) => {
  const { model, system, user, schema, schemaName, pdf, previousResponseId } = params;

  const userContent: OpenAI.Responses.ResponseInputContent[] = [{ type: 'input_text', text: user }];
  if (pdf) {
    userContent.push({
      type: 'input_file',
      filename: pdf.filename,
      file_data: `data:application/pdf;base64,${pdf.base64}`,
    });
  }

  const client = getClient();
  const result = await client.responses.parse({
    model,
    ...(previousResponseId !== undefined ? { previous_response_id: previousResponseId } : {}),
    input: [
      { role: 'system', content: system },
      { role: 'user', content: userContent },
    ],
    text: { format: zodTextFormat(schema, schemaName) },
  });

  return {
    parsed: result.output_parsed,
    responseId: result.id,
    inputTokens: result.usage?.input_tokens ?? 0,
    outputTokens: result.usage?.output_tokens ?? 0,
  };
};

const transport: Transport = env.LLM_MODE === 'stub' ? stubInvoke : openaiInvoke;

// ── Shared shell: breaker + audit + schema validation ────────────────────────
// Both transports run through this identical path, so the circuit breaker,
// llm_audit writes, and PII guarantees stay meaningful in stub mode (this is
// what the breaker/audit/PII tests assert against).
async function runStructured<T>(params: StructuredCallParams<T>): Promise<StructuredCallResult<T>> {
  const { tier, code, model, system, user, schema } = params;
  const requestId = requestContext.getRequestId();
  const startedAt = Date.now();
  const hash = promptHash(`${system}\n${user}`);

  const audit = (
    circuitState: CircuitState,
    extra: { inputTokens?: number; outputTokens?: number; verdict?: string; error?: string },
  ): void => {
    void llmAuditRepository
      .record({
        code,
        tier,
        model,
        requestId,
        promptHash: hash,
        inputTokens: extra.inputTokens ?? 0,
        outputTokens: extra.outputTokens ?? 0,
        latencyMs: Date.now() - startedAt,
        circuitState,
        ...(extra.verdict !== undefined ? { verdict: extra.verdict } : {}),
        ...(extra.error !== undefined ? { error: extra.error } : {}),
      })
      .catch((e: unknown) => logger.error({ err: e, code }, 'failed to write llm_audit'));
  };

  try {
    const { result, stateAtCall } = await breaker.run(() => transport(params));

    if (result.parsed === null || result.parsed === undefined) {
      audit(stateAtCall, { error: 'model returned no parseable output' });
      throw new UpstreamUnavailableError('AI returned an unexpected response');
    }

    // Validate against the caller's schema — same gate the real output_parsed
    // gets, so a stub that drifts from the contract fails exactly like the API.
    const validated = schema.safeParse(result.parsed);
    if (!validated.success) {
      audit(stateAtCall, { error: 'output failed schema validation' });
      throw new UpstreamUnavailableError('AI returned an unexpected response');
    }

    audit(stateAtCall, { inputTokens: result.inputTokens, outputTokens: result.outputTokens });
    return { data: validated.data, responseId: result.responseId };
  } catch (err) {
    if (err instanceof CircuitOpenError) {
      audit('open', { error: 'circuit open' });
      throw new UpstreamUnavailableError(
        'AI service is temporarily unavailable',
        Math.ceil(err.retryAfterMs / 1000),
      );
    }
    if (err instanceof UpstreamUnavailableError) {
      audit(breaker.getState(), { error: err.message });
      throw err;
    }
    const message = err instanceof Error ? err.message : String(err);
    audit(breaker.getState(), { error: message });
    logger.error({ err, code, tier }, 'llm call failed');
    throw new UpstreamUnavailableError('AI service call failed');
  }
}

// Single entry point for every model call. Wraps the breaker, records audit,
// validates the model's JSON against a zod schema (the model is untrusted until
// parsed), and supports conversation continuation via previousResponseId.
export const llmClient = {
  isConfigured(): boolean {
    // In stub mode we are "configured" without a key, unless explicitly told to
    // simulate the unconfigured path (so the no-key 503 stays testable).
    if (env.LLM_MODE === 'stub') return !env.LLM_STUB_UNCONFIGURED;
    return Boolean(env.OPENAI_API_KEY);
  },

  structured<T>(params: StructuredCallParams<T>): Promise<StructuredCallResult<T>> {
    return runStructured(params);
  },
};
