import { Repeat } from 'meemaw';
import { Link } from 'react-router-dom';

import { NTA_2025_BANDS, ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

// Module 5 — methodology & statute references. Renders the live band table from
// @taxlens/core so the doc can never drift from the engine.
export function HowItWorksScreen() {
  return (
    <main className="mx-auto max-w-3xl px-6 py-16">
      <AppText variant="caption">module 5 — how this works</AppText>
      <AppText variant="heading-1" className="mt-2">
        Methodology
      </AppText>
      <AppText variant="body" className="mt-4">
        Every band, rate and relief is sourced from the Fourth Schedule of the Nigeria Tax Act 2025.
        No invented numbers.
      </AppText>

      <table className="mt-8 w-full border-collapse text-sm">
        <thead>
          <tr className="border-b border-edge-strong text-left">
            <th className="py-2">Annual taxable income</th>
            <th className="py-2">Rate</th>
          </tr>
        </thead>
        <tbody>
          <Repeat each={[...NTA_2025_BANDS]}>
            {(band) => (
              <tr key={band.lowerKobo} className="border-b border-edge-hair">
                <td className="py-2">
                  {band.upperKobo === null
                    ? `Above ₦${(band.lowerKobo / 100).toLocaleString('en-NG')}`
                    : `Up to ₦${(band.upperKobo / 100).toLocaleString('en-NG')}`}
                </td>
                <td className="py-2">{(band.rate * 100).toFixed(0)}%</td>
              </tr>
            )}
          </Repeat>
        </tbody>
      </table>

      <p className="mt-8 text-sm">
        <Link to={ROUTES.HOME} className="text-clay-700 underline">
          ← back home
        </Link>
      </p>
    </main>
  );
}
