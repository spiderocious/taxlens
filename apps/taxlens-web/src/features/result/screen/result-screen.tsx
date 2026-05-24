import { useMemo } from 'react';
import { useNavigate, useParams, useSearchParams } from 'react-router-dom';
import { Show } from 'meemaw';

import {
  compareRegimes,
  decodeManualInput,
  isStatementCode,
  MANUAL_CODE,
  MOCK_CODE,
  periodConfidenceFor,
  ROUTES,
  type PeriodConfidence,
  type RegimeComparison,
} from '@taxlens/core';
import { useStatementStatus } from '@taxlens/api';
import { AppButton, Disclaimer, EmptyState, ErrorState, Skeleton } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';
import { SAMPLE_INCOME } from '@shared/helpers/sample-income.ts';
import { useIncomeContext } from '@features/income/providers/income-provider.tsx';

import { TaxPosition } from './parts/tax-position.tsx';
import { WhatChanged } from './parts/what-changed.tsx';
import { AiPanel } from './parts/ai-panel.tsx';

// What a resolved result needs to render. `code` is set only for a real
// statement process (drives the AI panel); mock/manual have none.
interface Resolved {
  comparison: RegimeComparison;
  fromStatement: boolean;
  statementCode?: string;
  monthsCovered?: number;
  periodConfidence?: PeriodConfidence;
}

// Modules 2 + 3 + 4 — the payoff page, addressable so a refresh restores it:
//   /result/mock          → sample data, computed locally (no API)
//   /result/manual?d=…     → manual input, decoded + recomputed locally
//   /result/<8-digit code> → statement upload, refetched from the backend
export function ResultScreen() {
  const navigate = useNavigate();
  const { code } = useParams<{ code?: string }>();
  const [search] = useSearchParams();
  const ctx = useIncomeContext();

  // Only fetch when the param is a real statement code AND context doesn't
  // already hold it (in-app navigation passes through context — no refetch flash).
  const hasContextForCode =
    ctx.comparison !== null && code !== undefined && ctx.statementCode === code;
  const needsFetch = code !== undefined && isStatementCode(code) && !hasContextForCode;
  const statement = useStatementStatus(needsFetch ? code : null, needsFetch);

  const resolved = useMemo<Resolved | null>(() => {
    if (code === undefined) {
      // bare /result — fall back to whatever's in context (legacy/in-app).
      return ctx.comparison ? { comparison: ctx.comparison, fromStatement: false } : null;
    }

    if (code === MOCK_CODE) {
      return { comparison: compareRegimes(SAMPLE_INCOME.salary_earner), fromStatement: false };
    }

    if (code === MANUAL_CODE) {
      const input = decodeManualInput(search.get('d'));
      return input ? { comparison: compareRegimes(input), fromStatement: false } : null;
    }

    // Statement code. Prefer context (fresh from the upload/recompute flow), else
    // the refetched view restored on refresh.
    if (hasContextForCode && ctx.comparison) {
      return {
        comparison: ctx.comparison,
        fromStatement: true,
        statementCode: code,
        ...(ctx.monthsCovered !== null ? { monthsCovered: ctx.monthsCovered } : {}),
        ...(ctx.periodConfidence !== null ? { periodConfidence: ctx.periodConfidence } : {}),
      };
    }
    const view = statement.data;
    if (view?.computation) {
      return {
        comparison: view.computation,
        fromStatement: true,
        statementCode: code,
        ...(view.monthsCovered !== undefined ? { monthsCovered: view.monthsCovered } : {}),
        ...(view.periodConfidence !== undefined
          ? { periodConfidence: view.periodConfidence }
          : { periodConfidence: periodConfidenceFor(view.monthsCovered) }),
      };
    }
    return null;
  }, [code, search, ctx, hasContextForCode, statement.data]);

  return (
    <AppShell activeStep={1} activeLink={ROUTES.HOME}>
      <main className="grid gap-10 px-5 py-8 sm:px-6 sm:py-10">
        {/* Refetching a statement result on refresh. */}
        <Show when={needsFetch && statement.isPending}>
          <div className="grid gap-6">
            <Skeleton className="h-8 w-48" />
            <Skeleton className="h-40 w-full" />
            <Skeleton className="h-24 w-full" />
          </div>
        </Show>

        {/* Refetch failed (network/down). */}
        <Show when={needsFetch && statement.isError}>
          <ErrorState
            title="We couldn’t load that result"
            description="The link may have expired — results are kept for a short time only."
            action={<AppButton onClick={() => navigate(ROUTES.HOME)}>Start over</AppButton>}
          />
        </Show>

        {/* Resolved — render it. */}
        <Show when={resolved !== null}>
          {resolved !== null ? (
            <>
              <TaxPosition
                nta={resolved.comparison.newRegime}
                fromStatement={resolved.fromStatement}
                {...(resolved.monthsCovered !== undefined
                  ? { monthsCovered: resolved.monthsCovered }
                  : {})}
                {...(resolved.periodConfidence !== undefined
                  ? { periodConfidence: resolved.periodConfidence }
                  : {})}
              />
              <WhatChanged comparison={resolved.comparison} />
              <Show when={resolved.statementCode !== undefined}>
                <AiPanel code={resolved.statementCode ?? ''} />
              </Show>
              <Disclaimer />
            </>
          ) : null}
        </Show>

        {/* Nothing to show and nothing loading/erroring — the empty state. */}
        <Show when={resolved === null && !(needsFetch && (statement.isPending || statement.isError))}>
          <EmptyState
            title="No result yet"
            description="Enter your income or try the sample to see your tax position."
            action={<AppButton onClick={() => navigate(ROUTES.HOME)}>Start here</AppButton>}
          />
        </Show>
      </main>
    </AppShell>
  );
}
