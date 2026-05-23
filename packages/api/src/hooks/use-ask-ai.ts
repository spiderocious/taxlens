import { useMutation } from '@tanstack/react-query';

import { apiClient } from '../client.js';
import { EP } from '../endpoints.js';
import type { ApiResponse } from '../types/envelope.js';

export interface AskAiPayload {
  question: string;
  /** The computed result the AI is allowed to explain (and nothing beyond it). */
  computationContext: unknown;
}

export interface AiCitation {
  section: string; // e.g. "NTA 2025, Fourth Schedule"
  snippet: string;
}

export interface AskAiResult {
  answer: string;
  citations: AiCitation[];
  refused: boolean; // true when the question is out of scope
  disclaimer: string;
}

// Module 4 — grounded follow-up. The backend enforces scope (personal income
// tax only) and citation; the frontend just renders the result + disclaimer.
export const useAskAi = () =>
  useMutation({
    mutationFn: async (payload: AskAiPayload) => {
      const res = await apiClient.post(EP.AI_ASK, { json: payload }).json<ApiResponse<AskAiResult>>();
      return res.data;
    },
  });
