import { type ReactNode } from 'react';

import { cn } from '../../utils/cn.js';
import { Checkbox } from '../../primitives/selection/index.js';

/**
 * Visual spec: design-system/projects/taxlens/preview/20-tables.html
 * Tokens:     design-system/projects/taxlens/preview/_foundation.css (.tbl / .ribbon · :13-27 of 20)
 *
 * The one real table — credits pulled from a bank statement. Multi-select for
 * bulk re-classification, a running total in the foot (the sum IS the income
 * figure that gets taxed). Presentational; selection is controlled.
 */
export type InflowClass = 'salary' | 'business' | 'transfer' | 'unclassified';

export interface InflowRow {
  readonly id: string;
  readonly date: string;
  readonly narration: string;
  readonly amount: string;
  readonly klass: InflowClass;
}

export interface InflowsTableProps {
  readonly rows: readonly InflowRow[];
  readonly selectedIds: readonly string[];
  readonly onToggle: (id: string) => void;
  /** Pre-formatted income total, e.g. "₦6,480,000". */
  readonly total: string;
  readonly totalUnit?: string;
  readonly footnote?: ReactNode;
  readonly className?: string;
}

const RIBBON: Record<InflowClass, { label: string; cls: string }> = {
  salary: { label: 'SALARY', cls: 'bg-clay-100 text-clay-800' },
  business: { label: 'BUSINESS', cls: 'bg-info-bg text-info' },
  transfer: { label: 'TRANSFER', cls: 'bg-paper-deep text-ink-muted' },
  unclassified: { label: 'UNCLASSIFIED', cls: 'bg-warn-bg text-warn' },
};

export function InflowsTable({
  rows,
  selectedIds,
  onToggle,
  total,
  totalUnit = '/yr',
  footnote,
  className,
}: InflowsTableProps) {
  return (
    <div className={cn('overflow-hidden rounded-card border border-edge bg-paper-sheet', className)}>
      <table className="w-full border-collapse">
        <thead>
          <tr>
            <th className="w-9 border-b border-edge px-5 py-2.5" />
            <th className="border-b border-edge px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-label text-ink-muted">
              Date
            </th>
            <th className="border-b border-edge px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-label text-ink-muted">
              Narration
            </th>
            <th className="border-b border-edge px-5 py-2.5 text-left text-[10px] font-semibold uppercase tracking-label text-ink-muted">
              Class
            </th>
            <th className="border-b border-edge px-5 py-2.5 text-right text-[10px] font-semibold uppercase tracking-label text-ink-muted">
              Amount
            </th>
          </tr>
        </thead>
        <tbody>
          {rows.map((row) => {
            const selected = selectedIds.includes(row.id);
            const ribbon = RIBBON[row.klass];
            return (
              <tr
                key={row.id}
                className={cn('border-b border-edge-hair last:border-b-0', selected ? 'bg-clay-50' : '')}
              >
                <td className="px-5 py-[13px] align-middle">
                  <Checkbox checked={selected} onChange={() => onToggle(row.id)} />
                </td>
                <td className="px-5 py-[13px] align-middle font-mono text-[13.5px] text-ink">
                  {row.date}
                </td>
                <td className="px-5 py-[13px] align-middle text-[13.5px] text-ink">{row.narration}</td>
                <td className="px-5 py-[13px] align-middle">
                  <span
                    className={cn(
                      'inline-block rounded font-mono text-[10px] px-1.5 py-px',
                      ribbon.cls,
                    )}
                  >
                    {ribbon.label}
                  </span>
                </td>
                <td
                  className={cn(
                    'px-5 py-[13px] text-right align-middle font-mono text-[13.5px] tabular-nums',
                    row.klass === 'transfer' ? 'text-ink-faint' : 'text-ink',
                  )}
                >
                  {row.amount}
                </td>
              </tr>
            );
          })}
        </tbody>
      </table>
      <div className="flex items-center justify-between border-t border-edge px-5 py-3">
        <span className="text-xs text-ink-muted">
          {footnote ?? 'Counted as income: salary + business. Transfers & ignored excluded.'}
        </span>
        <span className="text-ink">
          Income total{' '}
          <span className="font-mono text-[15px] font-medium tabular-nums">{total}</span>{' '}
          <span className="font-sans text-[11px] font-semibold uppercase tracking-[0.08em] text-ink-muted">
            {totalUnit}
          </span>
        </span>
      </div>
    </div>
  );
}
