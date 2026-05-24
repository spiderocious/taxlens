import { useQuery } from '@tanstack/react-query';
import type { StatementProcessView } from '@taxlens/core';

import { apiClient } from '../client.js';
import { EP } from '../endpoints.js';
import type { ApiResponse } from '../types/envelope.js';

const TERMINAL = new Set<StatementProcessView['status']>(['ready', 'failed']);

// Poll fallback for the parse process. Stops refetching once terminal. Prefer
// the SSE subscription (subscribeStatementEvents) for live updates; this is the
// durable fallback (and fine on its own if SSE is unavailable).
export const useStatementStatus = (code: string | null, enabled = true) =>
  useQuery({
    queryKey: ['statement', code],
    enabled: enabled && Boolean(code),
    queryFn: async () => {
      const res = await apiClient
        .get(EP.STATEMENT_BY_CODE(code as string))
        .json<ApiResponse<StatementProcessView>>();
      return res.data;
    },
    refetchInterval: (query) => {
      const data = query.state.data;
      return data && TERMINAL.has(data.status) ? false : 2_000;
    },
  });
