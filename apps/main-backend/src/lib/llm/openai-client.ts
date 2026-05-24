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

// Single entry point for every model call. Wraps the breaker, records audit,
// validates the model's JSON against a zod schema (the model is untrusted until
// parsed), and supports conversation continuation via previousResponseId.
export const llmClient = {
  isConfigured(): boolean {
    return Boolean(env.OPENAI_API_KEY);
  },

  async structured<T>(params: StructuredCallParams<T>): Promise<StructuredCallResult<T>> {
    const { tier, code, model, system, user, schema, schemaName, pdf, previousResponseId } = params;
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
      const userContent: OpenAI.Responses.ResponseInputContent[] = [
        { type: 'input_text', text: user },
      ];
      if (pdf) {
        userContent.push({
          type: 'input_file',
          filename: pdf.filename,
          file_data: `data:application/pdf;base64,${pdf.base64}`,
        });
      }

      const { result, stateAtCall } = await breaker.run(async () => {
        const client = getClient();
        return client.responses.parse({
          model,
          ...(previousResponseId !== undefined ? { previous_response_id: previousResponseId } : {}),
          input: [
            { role: 'system', content: system },
            { role: 'user', content: userContent },
          ],
          text: { format: zodTextFormat(schema, schemaName) },
        });
      });

      const parsed = result.output_parsed;
      if (parsed === null || parsed === undefined) {
        audit(stateAtCall, { error: 'model returned no parseable output' });
        throw new UpstreamUnavailableError('AI returned an unexpected response');
      }

      audit(stateAtCall, {
        inputTokens: result.usage?.input_tokens ?? 0,
        outputTokens: result.usage?.output_tokens ?? 0,
      });
      return { data: parsed, responseId: result.id };
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
      logger.error({ err, code, tier }, 'openai call failed');
      throw new UpstreamUnavailableError('AI service call failed');
    }
  },
};
