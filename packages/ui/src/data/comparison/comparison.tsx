import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';
import { Amount } from '../../primitives/amount/index.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/22-comparison.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.vs / .delta · :13-34 of 22)
 *
 * "What changed for you" — old regime vs new, side by side, then the net change
 * in one calm sentence (good news as good news, never alarm).
 */
export interface RegimeColumn {
  readonly tag: string;
  /** Pre-formatted figure without symbol, e.g. "933,600". */
  readonly amount: string;
  readonly sub: ReactNode;
}

export interface OldVsNewProps {
  readonly old: RegimeColumn;
  readonly current: RegimeColumn;
  readonly className?: string;
}

export function OldVsNew({ old, current, className }: OldVsNewProps) {
  return (
    // Mobile: stack the two regimes with the arrow between (a 3-row grid). Two
    // 32px mono figures don't fit side-by-side under ~420px. sm+: side by side.
    <div
      className={cn(
        'grid grid-cols-1 grid-rows-[auto_auto_auto] items-stretch',
        'sm:grid-cols-[1fr_64px_1fr] sm:grid-rows-1',
        className,
      )}
    >
      <div className="min-w-0 rounded-t-[14px] bg-paper-deep px-5 py-5 sm:rounded-l-[14px] sm:rounded-tr-none sm:px-6 sm:py-[22px]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-ink-muted">
          {old.tag}
        </div>
        <Amount value={old.amount} size="xl" className="my-2 text-ink-body sm:my-3" />
        <div className="text-[12.5px] text-ink-muted">{old.sub}</div>
      </div>
      <div className="grid place-items-center py-1 sm:py-0">
        <span className="grid h-9 w-9 place-items-center rounded-full border border-edge bg-paper-sheet text-clay-600 sm:h-10 sm:w-10">
          <span className="sm:hidden">↓</span>
          <span className="hidden sm:inline">→</span>
        </span>
      </div>
      <div className="min-w-0 rounded-b-[14px] border border-clay-200 bg-clay-50 px-5 py-5 sm:rounded-r-[14px] sm:rounded-bl-none sm:px-6 sm:py-[22px]">
        <div className="text-[11px] font-semibold uppercase tracking-[0.1em] text-clay-800">
          {current.tag}
        </div>
        <Amount value={current.amount} size="xl" className="my-2 sm:my-3" />
        <div className="text-[12.5px] text-ink-muted">{current.sub}</div>
      </div>
    </div>
  );
}

export interface DeltaCalloutProps {
  /** The plain-language headline, e.g. "You pay ₦128,400 less a year under the new law." */
  readonly children: ReactNode;
  /** A quieter supporting line. */
  readonly why?: ReactNode;
  /** good = sage (you save), bad = warm warn (you pay more). Never red. */
  readonly tone?: 'good' | 'bad';
  readonly className?: string;
}

export function DeltaCallout({ children, why, tone = 'good', className }: DeltaCalloutProps) {
  return (
    <div
      className={cn(
        'rounded-[14px] border px-5 py-5 text-center',
        tone === 'good' ? 'border-save-edge bg-save-bg' : 'border-warn-edge bg-warn-bg',
        className,
      )}
    >
      <div className="font-serif text-2xl text-ink">{children}</div>
      {why !== undefined ? <div className="mt-1.5 text-[13px] text-ink-muted">{why}</div> : null}
    </div>
  );
}
