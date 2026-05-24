import { useNavigate } from 'react-router-dom';
import { Show } from 'meemaw';

import { ROUTES } from '@taxlens/core';
import { AppButton, Disclaimer, EmptyState } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';
import { useIncomeContext } from '@features/income/providers/income-provider.tsx';

import { TaxPosition } from './parts/tax-position.tsx';
import { WhatChanged } from './parts/what-changed.tsx';
import { AiPanel } from './parts/ai-panel.tsx';

// Modules 2 + 3 + 4 — the payoff page. Reads the computed RegimeComparison from
// the flow provider. The AI panel only appears when there's a process `code`
// (sample/upload); manual compute is stateless and has no code to ground on.
export function ResultScreen() {
  const navigate = useNavigate();
  const { comparison, statementCode, source, monthsCovered, periodConfidence } = useIncomeContext();

  return (
    <AppShell activeStep={1} activeLink={ROUTES.HOME}>
      <main className="grid gap-10 px-5 py-8 sm:px-6 sm:py-10">
        <Show
          when={comparison !== null}
          fallback={
            <EmptyState
              title="No result yet"
              description="Enter your income or try the sample to see your tax position."
              action={<AppButton onClick={() => navigate(ROUTES.HOME)}>Start here</AppButton>}
            />
          }
        >
          {comparison !== null ? (
            <>
              <TaxPosition
                nta={comparison.newRegime}
                fromStatement={source === 'statement'}
                {...(monthsCovered !== null ? { monthsCovered } : {})}
                {...(periodConfidence !== null ? { periodConfidence } : {})}
              />
              <WhatChanged comparison={comparison} />
              <Show when={statementCode !== null}>
                <AiPanel code={statementCode ?? ''} />
              </Show>
              <Disclaimer />
            </>
          ) : null}
        </Show>
      </main>
    </AppShell>
  );
}
