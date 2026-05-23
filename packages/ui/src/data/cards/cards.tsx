import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';
import { Amount, type AmountSize } from '../../primitives/amount/index.js';
import { Chip } from '../../primitives/chip/index.js';
import { EstimateBadge } from '../../primitives/estimate-badge/index.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/27-cards.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.sheet / .result · :162-167, 357-366)
 *
 * Three card jobs: the stat tile (a number with context), the relief card (what
 * was deducted + the statute), and the result card (the hero). Hairlines, no
 * resting shadows.
 */
export interface StatTileProps {
  readonly label: string;
  /** Pre-formatted value without symbol, e.g. "805,200" or "12.4". */
  readonly value: string;
  readonly symbol?: string;
  readonly unit?: string;
  readonly detail?: ReactNode;
  /** Sage treatment for the "you save" tile. */
  readonly tone?: 'default' | 'save';
  readonly size?: AmountSize;
  readonly className?: string;
}

export function StatTile({
  label,
  value,
  symbol = '₦',
  unit,
  detail,
  tone = 'default',
  size = 'xl',
  className,
}: StatTileProps) {
  const save = tone === 'save';
  return (
    <div
      className={cn(
        'rounded-card border px-[22px] py-5',
        save ? 'border-save-edge bg-save-bg' : 'border-edge bg-paper-sheet',
        className,
      )}
    >
      <div
        className={cn(
          'text-[11px] font-semibold uppercase tracking-[0.1em]',
          save ? 'text-save' : 'text-ink-muted',
        )}
      >
        {label}
      </div>
      <Amount
        value={value}
        size={size}
        symbol={symbol}
        unit={unit}
        className={cn('my-2.5', save ? 'text-save' : '')}
      />
      {detail !== undefined ? <div className="text-xs text-ink-muted">{detail}</div> : null}
    </div>
  );
}

export interface ReliefCardProps {
  readonly name: string;
  /** Pre-formatted amount without symbol, e.g. "360,000". */
  readonly amount: string;
  readonly source: ReactNode;
  /** Statute reference shown in mono, e.g. "NTA 2025 · Fourth Schedule". */
  readonly statute?: string;
  /** Dashed, dimmed — a relief not claimed. */
  readonly unclaimed?: boolean;
  readonly className?: string;
}

export function ReliefCard({
  name,
  amount,
  source,
  statute,
  unclaimed = false,
  className,
}: ReliefCardProps) {
  return (
    <div
      className={cn(
        'rounded-card border bg-paper-sheet px-5 py-[18px]',
        unclaimed ? 'border-dashed border-edge opacity-70' : 'border-edge',
        className,
      )}
    >
      <div className="flex items-baseline justify-between">
        <span className={cn('text-sm font-semibold', unclaimed ? 'text-ink-muted' : 'text-ink')}>
          {name}
        </span>
        <span
          className={cn(
            'font-mono text-[15px] tabular-nums',
            unclaimed ? 'text-ink-faint' : 'text-clay-700',
          )}
        >
          ₦{amount}
        </span>
      </div>
      <div className="mt-2 text-[11.5px] leading-[1.45] text-ink-muted">
        {source} {statute !== undefined ? <span className="font-mono">{statute}</span> : null}
      </div>
    </div>
  );
}

export interface ResultRow {
  readonly label: string;
  /** Pre-formatted value, e.g. "₦5,640,000". */
  readonly value: string;
}

export interface ResultCardProps {
  /** Pre-formatted hero value without symbol, e.g. "805,200". */
  readonly amount: string;
  readonly eyebrow?: string;
  readonly subline?: ReactNode;
  readonly rows?: readonly ResultRow[];
  readonly saveLabel?: string;
  readonly className?: string;
}

export function ResultCard({
  amount,
  eyebrow = 'Estimated annual tax',
  subline,
  rows = [],
  saveLabel,
  className,
}: ResultCardProps) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-edge bg-paper-sheet', className)}>
      <div className="border-b border-edge-hair bg-clay-50 px-6 pb-5 pt-[22px]">
        <div className="mb-3 flex items-center gap-2.5 text-[10px] font-semibold uppercase tracking-[0.16em] text-clay-800">
          {eyebrow} <EstimateBadge label="NTA 2025" />
        </div>
        <Amount value={amount} size="hero" />
        {subline !== undefined ? <div className="mt-2.5 text-[13px] text-ink-body">{subline}</div> : null}
      </div>
      <div className="grid gap-3 px-6 pb-[22px] pt-[18px]">
        {rows.map((row) => (
          <div key={row.label} className="flex items-baseline justify-between gap-4">
            <span className="text-[13px] text-ink-muted">{row.label}</span>
            <span className="font-mono text-[13.5px] tabular-nums text-ink">{row.value}</span>
          </div>
        ))}
        {saveLabel !== undefined ? (
          <Chip variant="save" dot className="mt-1 w-fit">
            {saveLabel}
          </Chip>
        ) : null}
      </div>
    </div>
  );
}
