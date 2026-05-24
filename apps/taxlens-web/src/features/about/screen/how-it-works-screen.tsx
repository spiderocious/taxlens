import { Repeat } from 'meemaw';

import { NTA_2025_BANDS, ROUTES } from '@taxlens/core';
import { AppText, Callout, MethodologyList, type MethodologyEntry } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';

// Module 5 — methodology & statute references. Renders the live band table from
// @taxlens/core so the doc can never drift from the engine.
const METHODOLOGY: readonly MethodologyEntry[] = [
  { what: 'Gross annual income', ref: 'your input / statement' },
  { what: 'Rent relief — 20% of rent, capped ₦500k', ref: 'NTA 2025 · Fourth Schedule' },
  { what: 'Pension, NHIS, NHF, life insurance — deducted in full', ref: 'NTA 2025 · Fourth Schedule' },
  { what: 'Progressive bands on taxable income', ref: 'NTA 2025 · Fourth Schedule' },
];

export function HowItWorksScreen() {
  return (
    <AppShell activeLink={ROUTES.HOW_IT_WORKS}>
      <main className="grid gap-8 px-5 py-10 sm:px-6 sm:py-12">
        <header>
          <AppText variant="caption">how this works</AppText>
          <AppText variant="heading-1" className="mt-1">
            Methodology
          </AppText>
          <AppText variant="lede" className="mt-3 max-w-2xl">
            Every band, rate and relief is sourced from the Fourth Schedule of the Nigeria Tax Act
            2025. No invented numbers — the calculator is the single source of truth, and the
            assistant only explains figures it produced.
          </AppText>
        </header>

        <section className="grid gap-3">
          <AppText variant="heading-2">The 2026 bands</AppText>
          <table className="w-full border-collapse text-sm">
            <thead>
              <tr className="border-b border-edge-strong text-left">
                <th className="py-2 font-semibold text-ink-muted">Annual taxable income</th>
                <th className="py-2 font-semibold text-ink-muted">Rate</th>
              </tr>
            </thead>
            <tbody>
              <Repeat each={[...NTA_2025_BANDS]}>
                {(band) => (
                  <tr key={band.lowerKobo} className="border-b border-edge-hair">
                    <td className="py-2 font-mono text-[13px]">
                      {band.upperKobo === null
                        ? `Above ₦${(band.lowerKobo / 100).toLocaleString('en-NG')}`
                        : `Up to ₦${(band.upperKobo / 100).toLocaleString('en-NG')}`}
                    </td>
                    <td className="py-2 font-mono text-[13px]">{(band.rate * 100).toFixed(0)}%</td>
                  </tr>
                )}
              </Repeat>
            </tbody>
          </table>
        </section>

        <section className="grid gap-3">
          <AppText variant="heading-2">How we reach your number</AppText>
          <MethodologyList entries={METHODOLOGY} />
        </section>

        <Callout heading="Why the first ₦800,000 is free">
          Under NTA 2025 the first ₦800,000 of taxable income is taxed at 0%. Each higher rate
          applies only to the slice of income inside its band — never to the whole amount.
        </Callout>
      </main>
    </AppShell>
  );
}
