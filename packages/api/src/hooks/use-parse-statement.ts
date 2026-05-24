import { useMutation } from '@tanstack/react-query';
import type { ProfileType, ProcessStatus } from '@taxlens/core';

import { apiClient } from '../client.js';
import { EP } from '../endpoints.js';
import type { ApiResponse } from '../types/envelope.js';

export interface ParseStatementPayload {
  file: File;
  profileType: ProfileType;
}

export interface ParseStatementResult {
  code: string;
  status: ProcessStatus; // "pending"
}

// Module 1 — upload a bank statement PDF (multipart). Returns the 8-digit code
// the caller then polls (useStatementStatus) or subscribes to (SSE). We send
// FormData and DO NOT set Content-Type — the browser adds the multipart
// boundary. ky's `body` (not `json`) is used for FormData.
export const useParseStatement = () =>
  useMutation({
    mutationFn: async ({ file, profileType }: ParseStatementPayload) => {
      const form = new FormData();
      form.append('file', file);
      form.append('profileType', profileType);
      const res = await apiClient
        .post(EP.STATEMENT_PARSE, { body: form })
        .json<ApiResponse<ParseStatementResult>>();
      return res.data;
    },
  });
