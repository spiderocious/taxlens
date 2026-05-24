import { cn } from '../../utils/cn.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/21-band-breakdown.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.band / ladder · :341-355)
 *
 * THE signature display: a single scary number shown as the tranches that built
 * it, so the "first ₦800,000 is free" is visible first. Presentational — pass
 * pre-formatted figures. `fill` is 0–100 (how full the slice is).
 */
export interface BandRung {
  readonly name: string;
  readonly range: string;
  /** Pre-formatted rate, e.g. "0%", "15%". */
  readonly rate: string;
  /** Pre-formatted tax for this slice, e.g. "₦330,000" or "—". */
  readonly tax: string;
  /** 0–100 — how full this slice's track is. */
  readonly fill: number;
  /** The exempt (first, tax-free) slice. */
  readonly exempt?: boolean;
  /** A band the income never reaches. */
  readonly untouched?: boolean;
}

export interface BandLadderProps {
  readonly rungs: readonly BandRung[];
  readonly className?: string;
}

export function BandLadder({ rungs, className }: BandLadderProps) {
  return (
    <div className={cn('grid overflow-hidden rounded-[14px] border border-edge', className)}>
      {rungs.map((rung, i) => (
        <div
          key={`${rung.name}-${i}`}
          className={cn(
            // Mobile: a 2-col grid — name spans the top row, rate (left) + tax
            // (right) sit on the next row, and the bar spans full width below.
            // sm+: the original single-row fixed grid. A fixed-width grid on a
            // ~360px screen crushed the 1fr bar to a sliver, so it's sm-only.
            'grid grid-cols-2 gap-x-[18px] gap-y-2 border-b border-edge-hair px-4 py-3.5 last:border-b-0',
            'sm:grid-cols-[minmax(140px,200px)_1fr_84px_minmax(96px,120px)] sm:items-center sm:px-[18px] sm:py-[15px]',
            rung.exempt === true ? 'bg-clay-50' : '',
            rung.untouched === true ? 'opacity-50' : '',
          )}
        >
          <div className="col-span-2 text-[13.5px] text-ink sm:col-span-1">
            {rung.name}
            <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">{rung.range}</span>
          </div>
          {/* Bar: full-width last row on mobile, its own column on sm+. */}
          <div className="order-last col-span-2 h-2.5 overflow-hidden rounded-full bg-paper-deep sm:order-none sm:col-span-1">
            <span
              className={cn(
                'block h-full rounded-full',
                rung.exempt === true ? 'bg-clay-300' : 'bg-clay-500',
              )}
              style={{ width: `${Math.max(0, Math.min(100, rung.fill))}%` }}
            />
          </div>
          <div
            className={cn(
              'font-mono text-sm font-medium sm:text-right',
              rung.untouched === true
                ? 'text-ink-faint'
                : rung.exempt === true
                  ? 'text-clay-800'
                  : 'text-clay-700',
            )}
          >
            {rung.rate}
          </div>
          <div className="text-right font-mono text-sm tabular-nums text-ink">{rung.tax}</div>
        </div>
      ))}
    </div>
  );
}

export interface BandSegment {
  /** 0–100 share of the bar. */
  readonly pct: number;
  /** Tailwind bg class, e.g. "bg-clay-300". */
  readonly color: string;
  readonly rateLabel: string;
  readonly amountLabel: string;
  /** Use dark text (for the light exempt slice). */
  readonly dark?: boolean;
}

export interface BandSplitBarProps {
  readonly segments: readonly BandSegment[];
  readonly className?: string;
}

export function BandSplitBar({ segments, className }: BandSplitBarProps) {
  return (
    <div className={cn('flex h-[46px] overflow-hidden rounded-ctrl border border-edge', className)}>
      {segments.map((seg, i) => (
        <div
          key={i}
          className={cn(
            'flex min-w-0 flex-col justify-center px-3',
            seg.color,
            seg.dark === true ? 'text-clay-900' : 'text-white',
          )}
          style={{ flex: `0 0 ${seg.pct}%` }}
        >
          <span className="font-mono text-xs font-semibold">{seg.rateLabel}</span>
          <span className="whitespace-nowrap text-[10.5px] opacity-85">{seg.amountLabel}</span>
        </div>
      ))}
    </div>
  );
}
