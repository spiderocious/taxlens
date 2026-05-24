import { useMutation } from '@tanstack/react-query';
import type { StatementProcessView } from '@taxlens/core';

import { apiClient } from '../client.js';
import { EP } from '../endpoints.js';
import type { ApiResponse } from '../types/envelope.js';

export interface RecomputePayload {
  code: string;
  /** The inflow ids the user marked as income; gross becomes their sum. */
  inflowIds: string[];
}

// A3 — after the user reclassifies which credits are income, recompute the tax
// position from their selection. The backend persists it (so the AI panel stays
// grounded on the corrected numbers) and returns the updated process view.
export const useRecomputeStatement = () =>
  useMutation({
    mutationFn: async ({ code, inflowIds }: RecomputePayload) => {
      const res = await apiClient
        .post(EP.STATEMENT_RECOMPUTE(code), { json: { inflowIds } })
        .json<ApiResponse<StatementProcessView>>();
      return res.data;
    },
  });
