import { Repeat, Show } from 'meemaw';

import type { PeriodConfidence, TaxComputation } from '@taxlens/core';
import {
  AppText,
  Banner,
  BandLadder,
  Chip,
  CitationBlock,
  ReliefCard,
  ResultCard,
  StatTile,
} from '@taxlens/ui';

import { bandsToRungs } from '../../helpers/bands-to-rungs.ts';
import { naira, nairaValue, ratePct } from '../../helpers/format.ts';

interface TaxPositionProps {
  readonly nta: TaxComputation;
  /** True when this result came from a statement upload (annualised estimate). */
  readonly fromStatement?: boolean;
  readonly monthsCovered?: number;
  readonly periodConfidence?: PeriodConfidence;
}

// The confidence note text (B2) keyed to how many months we annualised from.
function confidenceNote(months: number | undefined, confidence: PeriodConfidence): string {
  if (confidence === 'high') return 'Based on a full year of statements — most reliable.';
  if (confidence === 'low') {
    return months === undefined || months === 0
      ? 'We couldn’t determine the period this statement covers, so treat this as a rough guide.'
      : 'Estimated from a single month. Income varies month to month — upload 3–12 months for a more reliable estimate.';
  }
  return `Estimated by scaling ${months ?? 'a few'} months to a full year — most accurate when your income is steady.`;
}

// Module 2 — the single result page: hero figure, the key stats, the band-by-
// band breakdown (the signature display), and the reliefs that were applied.
// For statement uploads the headline is an annualised ESTIMATE scoped to the
// months uploaded (B1/B2/B3); manual input is taken as declared.
export function TaxPosition({
  nta,
  fromStatement,
  monthsCovered,
  periodConfidence,
}: TaxPositionProps) {
  const months = monthsCovered;
  // B3 — tax attributable to the uploaded N months (annual × N/12), only when we
  // have a usable partial period.
  const periodTaxKobo =
    months !== undefined && months > 0 && months < 12
      ? Math.round((nta.annualTaxKobo * months) / 12)
      : null;

  // A2 guard — never present a serene "exempt" for a statement that resolved to
  // zero income (that's a needs-review outcome, routed before here; guard the
  // render too). Manual/sample exemptions are genuine.
  const showExempt = nta.isExempt && !(fromStatement && nta.grossAnnualKobo === 0);

  return (
    <section className="grid min-w-0 gap-6">
      <div className="flex flex-wrap items-center gap-2">
        <AppText variant="caption">your tax position</AppText>
        {showExempt ? (
          <Chip variant="save" dot>
            Exempt — you owe nothing
          </Chip>
        ) : null}
      </div>

      {/* B1 — name the source so the annual figure reads as an estimate. */}
      <Show when={Boolean(fromStatement)}>
        <AppText variant="body-sm" className="-mt-2 text-ink-muted">
          Based on{' '}
          {months !== undefined && months > 0
            ? `${months} ${months === 1 ? 'month' : 'months'} of statements`
            : 'your statement'}{' '}
          ({naira(nta.grossAnnualKobo)} estimated annual income), here’s your estimated{' '}
          <strong className="text-ink">annual</strong> position under NTA 2025.
        </AppText>
      </Show>

      <ResultCard
        amount={nairaValue(nta.annualTaxKobo)}
        eyebrow="Estimated annual tax"
        subline={`That’s ${ratePct(nta.effectiveRate)}% of your gross income.`}
        rows={[
          { label: 'Monthly tax', value: `₦${nairaValue(nta.monthlyTaxKobo)}` },
          { label: 'Take-home (year)', value: `₦${nairaValue(nta.takeHomeAnnualKobo)}` },
          { label: 'Take-home (month)', value: `₦${nairaValue(nta.takeHomeMonthlyKobo)}` },
        ]}
      />

      {/* B2 — confidence note scoped to monthsCovered (statement uploads only). */}
      <Show when={Boolean(fromStatement) && periodConfidence !== undefined}>
        <Banner tone={periodConfidence === 'low' ? 'warn' : 'info'}>
          {confidenceNote(months, periodConfidence ?? 'low')}
          {/* B3 — the honest period-scoped figure alongside the annual estimate. */}
          {periodTaxKobo !== null
            ? ` Tax attributable to the ${months} months you uploaded: about ${naira(periodTaxKobo)}.`
            : ''}
        </Banner>
      </Show>

      <div className="grid grid-cols-2 gap-3 sm:grid-cols-3">
        <StatTile
          label="Effective rate"
          value={ratePct(nta.effectiveRate)}
          symbol=""
          unit="%"
          size="lg"
          className="min-w-0 overflow-hidden"
        />
        <StatTile
          label="Taxable income"
          value={nairaValue(nta.taxableIncomeKobo)}
          size="lg"
          className="min-w-0 overflow-hidden"
        />
        <StatTile
          label="Total reliefs"
          value={nairaValue(nta.totalReliefsKobo)}
          tone="save"
          size="lg"
          className="col-span-2 min-w-0 overflow-hidden sm:col-span-1"
        />
      </div>

      <div className="grid gap-3">
        <AppText variant="heading-2">How the number was built</AppText>
        <AppText variant="body-sm" className="-mt-1 max-w-xl text-ink-muted">
          Each rate applies only to the slice of income inside its band — so the first ₦800,000 is
          always tax-free.
        </AppText>
        <BandLadder rungs={bandsToRungs(nta.bands)} />
        <CitationBlock statuteRef="NTA 2025 · Fourth Schedule">
          “Each rate applies only to the portion of taxable income that falls within its band.”
        </CitationBlock>
      </div>

      <div className="grid gap-3">
        <AppText variant="heading-2">Reliefs applied</AppText>
        <Repeat each={nta.appliedReliefs}>
          {(relief) => (
            <ReliefCard
              key={relief.key}
              name={relief.label}
              amount={nairaValue(relief.amountKobo)}
              source="Deducted before tax"
              statute="NTA 2025 · Fourth Schedule"
            />
          )}
        </Repeat>
      </div>
    </section>
  );
}
