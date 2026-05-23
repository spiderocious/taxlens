import { z } from 'zod';

// Module 4 — grounded follow-up. The question is free text; the computation
// context is whatever the calculator already produced (the AI may only explain
// these numbers, never produce new ones — PRD).
export const AskAiSchema = z.object({
  question: z.string().min(1).max(2000),
  computationContext: z.unknown(),
});

export type AskAiDto = z.infer<typeof AskAiSchema>;
