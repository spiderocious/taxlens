import { formatNaira, type StatementInflow } from '@taxlens/core';
import type { InflowClass, InflowRow } from '@taxlens/ui';

// The API classifies inflows as salary | business | transfer | other; the table
// renders salary | business | transfer | unclassified. Map "other" → that.
function toTableClass(c: StatementInflow['classification']): InflowClass {
  return c === 'other' ? 'unclassified' : c;
}

/** A statement inflow date is ISO 8601; show a short, readable form. */
function shortDate(iso: string): string {
  const d = new Date(iso);
  return Number.isNaN(d.getTime())
    ? iso
    : d.toLocaleDateString('en-NG', { day: '2-digit', month: 'short' });
}

export function inflowRows(inflows: readonly StatementInflow[]): InflowRow[] {
  return inflows.map((f) => ({
    id: f.id,
    date: shortDate(f.date),
    narration: f.description,
    amount: formatNaira(f.amountKobo),
    klass: toTableClass(f.classification),
  }));
}

/** Inflows the backend counts as income (salary + business) — the default
 *  selection, matching the server's grossAnnualKobo. */
export function incomeInflowIds(inflows: readonly StatementInflow[]): string[] {
  return inflows.filter((f) => f.classification === 'salary' || f.classification === 'business').map((f) => f.id);
}
