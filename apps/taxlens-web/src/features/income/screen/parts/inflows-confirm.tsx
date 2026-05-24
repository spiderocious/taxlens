import { useMemo, useState } from 'react';
import { Show } from 'meemaw';

import { formatNaira, type StatementProcessView } from '@taxlens/core';
import { useRecomputeStatement } from '@taxlens/api';
import { AppButton, AppText, Banner, InflowsTable } from '@taxlens/ui';

import { incomeInflowIds, inflowRows } from '../../helpers/inflow-rows.ts';

interface InflowsConfirmProps {
  readonly view: StatementProcessView;
  /** Called with the recomputed view (server-persisted) once the user confirms. */
  readonly onConfirm: (updated: StatementProcessView) => void;
}

// Module 1 — confirm/correct the extracted inflows before seeing the result.
// The checkbox per row means "count this as income": selecting recomputes gross
// from the selection on confirm (server-side, so the AI panel stays grounded).
//
// Two entry modes:
//  - ready:        normal confirmation; salary+business pre-selected.
//  - needs_review: the model counted NOTHING as income while credits exist
//    (every credit read as a transfer). We must NOT show a serene result — this
//    screen is the way out: pick the credits that are actually income.
export function InflowsConfirm({ view, onConfirm }: InflowsConfirmProps) {
  const inflows = view.inflows ?? [];
  const needsReview = view.status === 'needs_review';
  const rows = useMemo(() => inflowRows(inflows), [inflows]);
  const recompute = useRecomputeStatement();

  // In review mode nothing is income yet — start empty so the user makes a
  // deliberate choice. Otherwise pre-select what the server counted.
  const [selectedIds, setSelectedIds] = useState<string[]>(() =>
    needsReview ? [] : incomeInflowIds(inflows),
  );
  const [error, setError] = useState<string | null>(null);

  function toggle(id: string) {
    setSelectedIds((prev) => (prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]));
  }

  const selectedSumKobo = useMemo(
    () => inflows.filter((f) => selectedIds.includes(f.id)).reduce((s, f) => s + f.amountKobo, 0),
    [inflows, selectedIds],
  );

  const serverGross = view.grossAnnualKobo ?? 0;
  // Selection differs from what the server computed → confirming will recompute.
  const changed = selectedSumKobo !== serverGross;

  function handleConfirm() {
    setError(null);
    // If the user's selection matches the server's gross and we're not in review,
    // skip the round-trip — the current view is already correct.
    if (!changed && !needsReview) {
      onConfirm(view);
      return;
    }
    recompute.mutate(
      { code: view.code, inflowIds: selectedIds },
      {
        onSuccess: (updated) => onConfirm(updated),
        onError: () => setError('We couldn’t recompute that selection. Please try again.'),
      },
    );
  }

  return (
    <section className="grid gap-4">
      <header className="grid gap-1">
        <AppText variant="heading-2">
          {needsReview ? 'Which of these are income?' : 'Confirm what counts as income'}
        </AppText>
        <AppText variant="body-sm" className="text-ink-muted">
          We read {inflows.length} credits from your {view.bankName ?? 'statement'}
          {view.monthsCovered !== undefined ? ` (${view.monthsCovered} months)` : ''}.
          {needsReview
            ? ' Tick every credit that’s actually income (salary, business, or freelance pay).'
            : ' Salary and business are counted; transfers are excluded. Tick or untick to adjust.'}
        </AppText>
      </header>

      <Show when={needsReview}>
        <Banner tone="warn">
          We couldn’t identify any taxable income — every credit was read as a transfer. That’s
          {view.inflowsSumKobo !== undefined ? ` ${formatNaira(view.inflowsSumKobo)} of credits ` : ' '}
          we didn’t count. Review the list and mark the ones that are really income.
        </Banner>
      </Show>

      <InflowsTable
        rows={rows}
        selectedIds={selectedIds}
        onToggle={toggle}
        total={formatNaira(selectedSumKobo)}
      />

      <Show when={error !== null}>
        <Banner tone="warn">{error}</Banner>
      </Show>

      <div className="flex justify-end">
        <AppButton
          size="lg"
          onClick={handleConfirm}
          loading={recompute.isPending}
          disabled={needsReview && selectedIds.length === 0}
        >
          {needsReview ? 'Count these as income' : 'See my tax position'}
        </AppButton>
      </div>
    </section>
  );
}
