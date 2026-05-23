/**
 * Visual spec: design-system/projects/taxlens/preview/23-charts.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (clay scale + paper-deep)
 *
 * Charts stay quiet: thin axes, clay fills, no gridline clutter, no 3-D. Each
 * restates the number it visualises. Presentational SVG primitives.
 */
export interface DonutSegment {
  /** 0–100 share. */
  readonly pct: number;
  /** stroke colour (CSS value or hex). */
  readonly color: string;
}

export interface DonutProps {
  readonly segments: readonly DonutSegment[];
  readonly centerLabel?: string;
  readonly centerSub?: string;
  readonly size?: number;
  readonly className?: string;
}

export function Donut({ segments, centerLabel, centerSub, size = 132, className }: DonutProps) {
  let offset = 0;
  return (
    <svg width={size} height={size} viewBox="0 0 42 42" className={className} role="img">
      <circle cx="21" cy="21" r="15.9" fill="none" stroke="#EEEBE3" strokeWidth="6" />
      {segments.map((seg, i) => {
        const dash = `${seg.pct} ${100 - seg.pct}`;
        const el = (
          <circle
            key={i}
            cx="21"
            cy="21"
            r="15.9"
            fill="none"
            stroke={seg.color}
            strokeWidth="6"
            strokeDasharray={dash}
            strokeDashoffset={-offset}
            transform="rotate(-90 21 21)"
          />
        );
        offset += seg.pct;
        return el;
      })}
      {centerLabel !== undefined ? (
        <text x="21" y="20" textAnchor="middle" style={{ fontSize: 6, fill: '#1C1B18', fontWeight: 600 }}>
          {centerLabel}
        </text>
      ) : null}
      {centerSub !== undefined ? (
        <text x="21" y="26" textAnchor="middle" style={{ fontSize: 3, fill: '#76726A' }}>
          {centerSub}
        </text>
      ) : null}
    </svg>
  );
}

export interface BarCompareProps {
  readonly oldPct: number; // 0–100 height share
  readonly newPct: number;
  readonly oldLabel: string;
  readonly newLabel: string;
  readonly oldValue: string;
  readonly newValue: string;
  readonly className?: string;
}

export function BarCompare({
  oldPct,
  newPct,
  oldLabel,
  newLabel,
  oldValue,
  newValue,
  className,
}: BarCompareProps) {
  const oh = (oldPct / 100) * 86;
  const nh = (newPct / 100) * 86;
  return (
    <svg width="100%" height="150" viewBox="0 0 320 150" className={className} role="img">
      <line x1="20" y1="120" x2="320" y2="120" stroke="#E4E0D6" />
      <rect x="70" y={120 - oh} width="70" height={oh} rx="4" fill="#EEEBE3" />
      <rect x="190" y={120 - nh} width="70" height={nh} rx="4" fill="#C2613A" />
      <text x="105" y="138" textAnchor="middle" style={{ fontSize: 10, fill: '#76726A', fontFamily: 'JetBrains Mono' }}>
        {oldLabel}
      </text>
      <text x="225" y="138" textAnchor="middle" style={{ fontSize: 10, fill: '#76726A', fontFamily: 'JetBrains Mono' }}>
        {newLabel}
      </text>
      <text x="105" y={120 - oh - 6} textAnchor="middle" style={{ fontSize: 10, fill: '#3A3833', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
        {oldValue}
      </text>
      <text x="225" y={120 - nh - 6} textAnchor="middle" style={{ fontSize: 10, fill: '#8E4022', fontWeight: 600, fontFamily: 'JetBrains Mono' }}>
        {newValue}
      </text>
    </svg>
  );
}

export interface EffectiveRateGaugeProps {
  /** 0–100 of the scale max. */
  readonly effectivePct: number;
  /** 0–100 marker for the top band touched. */
  readonly topBandPct: number;
  readonly leftLabel?: string;
  readonly midLabel?: string;
  readonly rightLabel?: string;
  readonly className?: string;
}

export function EffectiveRateGauge({
  effectivePct,
  topBandPct,
  leftLabel = '0%',
  midLabel = 'top band ↑',
  rightLabel = '25%',
  className,
}: EffectiveRateGaugeProps) {
  return (
    <div className={className}>
      <div className="relative h-2.5 overflow-visible rounded-full bg-paper-deep">
        <span
          className="block h-full rounded-full bg-clay-500"
          style={{ width: `${Math.max(0, Math.min(100, effectivePct))}%` }}
        />
        <span
          className="absolute -top-[3px] h-4 w-0.5 bg-ink-muted"
          style={{ left: `${Math.max(0, Math.min(100, topBandPct))}%` }}
        />
      </div>
      <div className="mt-2 flex justify-between font-mono text-xs text-ink-muted">
        <span>{leftLabel}</span>
        <span>{midLabel}</span>
        <span>{rightLabel}</span>
      </div>
    </div>
  );
}
