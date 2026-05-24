import { useMutation } from '@tanstack/react-query';

import { apiClient } from '../client.js';
import { EP } from '../endpoints.js';
import type { ApiResponse } from '../types/envelope.js';

export interface AskAiPayload {
  /** The 8-digit code of the computed process the AI may explain. */
  code: string;
  question: string;
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

// Module 4 — grounded follow-up. The server holds the computed context (keyed
// by code) and continues the conversation; the FE sends only code + question.
export const useAskAi = () =>
  useMutation({
    mutationFn: async (payload: AskAiPayload) => {
      const res = await apiClient.post(EP.AI_ASK, { json: payload }).json<ApiResponse<AskAiResult>>();
      return res.data;
    },
  });
