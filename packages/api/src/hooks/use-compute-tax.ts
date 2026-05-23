import { useMutation } from '@tanstack/react-query';
import type { IncomeInput, RegimeComparison } from '@taxlens/core';

import { apiClient } from '../client.js';
import { EP } from '../endpoints.js';
import type { ApiResponse } from '../types/envelope.js';

// Module 2 + 3 — posts an income declaration to the stateless backend and
// receives both regimes plus the comparison. The backend is the authority for
// the numbers (PRD: the AI may only explain numbers the calculator produced).
export const useComputeTax = () =>
  useMutation({
    mutationFn: async (input: IncomeInput) => {
      const res = await apiClient
        .post(EP.TAX_COMPARE, { json: input })
        .json<ApiResponse<RegimeComparison>>();
      return res.data;
    },
  });
