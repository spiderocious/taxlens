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
            'grid grid-cols-[200px_1fr_110px_120px] items-center gap-[18px] border-b border-edge-hair px-[18px] py-[15px] last:border-b-0',
            rung.exempt === true ? 'bg-clay-50' : '',
            rung.untouched === true ? 'opacity-50' : '',
          )}
        >
          <div className="text-[13.5px] text-ink">
            {rung.name}
            <span className="mt-0.5 block font-mono text-[11px] text-ink-muted">{rung.range}</span>
          </div>
          <div className="h-2.5 overflow-hidden rounded-full bg-paper-deep">
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
              'text-right font-mono text-sm font-medium',
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
