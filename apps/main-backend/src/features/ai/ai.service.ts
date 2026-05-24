import type { ChatMessage } from '@taxlens/core';
import { z } from 'zod';

import { NotFoundError } from '@lib/errors.js';
import { llmClient } from '@lib/llm/openai-client.js';
import { taxProcessRepository } from '@lib/mongo/tax-process.repository.js';

import { env } from '../../env.js';

export const DISCLAIMER =
  'This is an estimate, not tax advice. For complex situations, consult a tax professional.';

const CitationSchema = z.object({
  section: z.string(),
  snippet: z.string(),
});

const AnswerSchema = z.object({
  // Non-empty: a partial/empty model turn must be treated as a contract failure
  // (→ repair retry → 422), never returned to the user as a blank 200 answer.
  answer: z.string().min(1),
  citations: z.array(CitationSchema),
  refused: z.boolean(),
});

export interface AskAiResult {
  answer: string;
  citations: { section: string; snippet: string }[];
  refused: boolean;
  disclaimer: string;
}

const SYSTEM = `You are TaxLens, a grounded assistant for Nigerian PERSONAL income tax under the
Nigeria Tax Act 2025 (NTA 2025), effective 1 January 2026.

HARD RULES:
- Answer ONLY personal income tax questions under the NTA 2025. Politely REFUSE anything
  out of scope — business tax, VAT, corporate matters, company tax, customs — by setting
  refused=true and giving a one-line redirect. Do not answer out-of-scope questions.
- You may ONLY explain the computed numbers provided to you in the CONTEXT below. NEVER
  produce, estimate, or invent a tax figure that is not already in that context. If asked
  for a number not present, explain that you can only discuss the figures already computed.
- Every substantive answer MUST cite the relevant NTA 2025 section (e.g. the Fourth
  Schedule for bands/reliefs) in the citations array, with a short snippet.
- Keep answers concise and plain. The app appends a disclaimer; do not repeat it.`;

const buildContext = (computation: unknown): string =>
  `CONTEXT — the only numbers you may discuss (all amounts in kobo, 1 NGN = 100 kobo):\n${JSON.stringify(
    computation,
  )}`;

export const aiService = {
  isConfigured(): boolean {
    return llmClient.isConfigured();
  },

  async ask(code: string, question: string): Promise<AskAiResult> {
    const process = await taxProcessRepository.findByCode(code);
    if (!process) throw new NotFoundError('Process');

    // Touch first — asking is an interaction (resets the reaper clock).
    await taxProcessRepository.touch(code);

    const context = buildContext(process.computation ?? null);
    const result = await llmClient.structured({
      tier: 'chat',
      code,
      model: env.OPENAI_CHAT_MODEL,
      system: SYSTEM,
      user: `${context}\n\nQUESTION: ${question}`,
      schema: AnswerSchema,
      schemaName: 'grounded_answer',
      ...(process.analysisResponseId !== undefined
        ? { previousResponseId: process.analysisResponseId }
        : {}),
    });

    const now = new Date().toISOString();
    const turn: ChatMessage[] = [
      { role: 'user', content: question, createdAt: now },
      { role: 'assistant', content: result.data.answer, responseId: result.responseId, createdAt: now },
    ];
    // Continue the conversation from this assistant turn next time.
    await taxProcessRepository.appendChat(code, turn, result.responseId);

    return {
      answer: result.data.answer,
      citations: result.data.citations,
      refused: result.data.refused,
      disclaimer: DISCLAIMER,
    };
  },
};
