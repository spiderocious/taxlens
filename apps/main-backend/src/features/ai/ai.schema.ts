import { z } from 'zod';

// Module 4 — grounded follow-up. The question is free text; the context now
// lives server-side keyed by `code` (the process the AI is allowed to explain),
// so the client only sends the code + question. The AI may only explain numbers
// the calculator already produced — never invent new ones (PRD).
export const AskAiSchema = z
  .object({
    code: z.string().regex(/^\d{8}$/, 'must be an 8-digit code'),
    question: z.string().min(1).max(2000),
  })
  .strict();

export type AskAiDto = z.infer<typeof AskAiSchema>;
