import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { type ReactNode, useState } from 'react';
import { BrowserRouter } from 'react-router-dom';

import { DrawerHost } from '@taxlens/ui';

import { IncomeProvider } from '@features/income/providers/income-provider.tsx';

export function AppProviders({ children }: { children: ReactNode }) {
  const [queryClient] = useState(
    () =>
      new QueryClient({
        defaultOptions: {
          queries: { staleTime: 30_000, retry: 1 },
        },
      }),
  );
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        {/* Flow state (profile/manual draft/computed result) shared by Income + Result. */}
        <IncomeProvider>{children}</IncomeProvider>
      </BrowserRouter>
      {/* Imperative modal stack + toast host — call DrawerService from anywhere. */}
      <DrawerHost />
    </QueryClientProvider>
  );
}
