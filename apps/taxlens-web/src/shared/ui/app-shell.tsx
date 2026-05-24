import { type ReactNode } from 'react';
import { useNavigate } from 'react-router-dom';

import { ROUTES } from '@taxlens/core';
import { DrawerService, StepRail, type RailStep } from '@taxlens/ui';

import { useIncomeContext } from '@features/income/providers/income-provider.tsx';
import { AppHeader } from './app-header.tsx';

/** The flow is two steps: Income → Result. "What changed" and the AI panel are
 *  sections of the result page, not separate destinations — so they aren't steps. */
export const FLOW_STEPS: readonly RailStep[] = [
  { index: '1', title: 'Your income' },
  { index: '2', title: 'Your result' },
];

interface AppShellProps {
  /** 0-based active step; omit to hide the StepRail (e.g. on explainer pages). */
  readonly activeStep?: number;
  /** Highlight a top-bar link by route. */
  readonly activeLink?: string;
  readonly children: ReactNode;
}

export function AppShell({ activeStep, activeLink, children }: AppShellProps) {
  const navigate = useNavigate();
  const { comparison, statementCode, reset } = useIncomeContext();

  // "Start over" only matters once there's something to clear.
  const hasSession = comparison !== null || statementCode !== null;

  function handleStartOver() {
    DrawerService.critical({
      title: 'Clear everything and start over?',
      criticalHeaderLabel: 'Start over — clears this session',
      body: (
        <div className="grid gap-3">
          <p className="m-0">
            TaxLens stores nothing on a server, so this permanently removes what you entered and your
            computed result. There is no recovery.
          </p>
          <ul className="m-0 grid list-disc gap-1 pl-5 text-ink-muted">
            <li>Your entered income and reliefs</li>
            <li>Your computed result and the old-vs-new comparison</li>
          </ul>
        </div>
      ),
      confirmLabel: 'Hold to clear everything',
      onConfirm: () => {
        reset();
        navigate(ROUTES.HOME);
      },
    });
  }

  return (
    <div className="flex min-h-screen flex-col overflow-x-clip bg-paper">
      <header className="sticky top-0 z-30 border-b border-edge bg-paper-sheet/90 backdrop-blur">
        <div className="mx-auto w-full max-w-5xl">
          <AppHeader activeLink={activeLink} onStartOver={hasSession ? handleStartOver : undefined} />
        </div>
      </header>

      {activeStep !== undefined ? (
        <div className="border-b border-edge bg-paper-sheet">
          <div className="mx-auto w-full max-w-3xl px-5 py-3 sm:px-6">
            {/* Mobile: a compact "Step N of 3 · label" row — three equal boxes
                are too cramped at 390px and wrap the labels. Full rail on sm+. */}
            <div className="flex items-center gap-2.5 sm:hidden">
              <span className="flex items-center gap-1">
                {FLOW_STEPS.map((step, i) => (
                  <span
                    key={step.index}
                    className={
                      i === activeStep
                        ? 'h-1.5 w-5 rounded-full bg-clay-500'
                        : i < activeStep
                          ? 'h-1.5 w-1.5 rounded-full bg-clay-300'
                          : 'h-1.5 w-1.5 rounded-full bg-edge-strong'
                    }
                  />
                ))}
              </span>
              <span className="font-mono text-[11px] text-ink-muted">
                Step {activeStep + 1} of {FLOW_STEPS.length}
              </span>
              <span className="text-[13px] font-semibold text-ink">
                {FLOW_STEPS[activeStep]?.title}
              </span>
            </div>
            <StepRail steps={FLOW_STEPS} active={activeStep} className="hidden p-0 sm:flex" />
          </div>
        </div>
      ) : null}

      <div className="mx-auto w-full min-w-0 max-w-3xl flex-1">{children}</div>
    </div>
  );
}
