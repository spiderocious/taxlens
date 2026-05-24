import { Repeat } from 'meemaw';

import type { RegimeComparison } from '@taxlens/core';
import { AppText, Callout, DeltaCallout, OldVsNew } from '@taxlens/ui';

import { naira, nairaValue } from '../../helpers/format.ts';

interface WhatChangedProps {
 comparison: RegimeComparison;
}

// Module 3 — old regime (pre-2026 PITA) vs new (NTA 2025), the net change in
// plain language, and only the reform points relevant to this profile.
export function WhatChanged({ comparison }: WhatChangedProps) {
  const { oldRegime, newRegime, netChangeKobo, direction, relevantReforms } = comparison;

  const deltaTone = direction === 'pays_more' ? 'bad' : 'good';
  const deltaHeadline =
    direction === 'saves'
      ? `You save ${naira(netChangeKobo)} a year under NTA 2025.`
      : direction === 'pays_more'
        ? `You pay ${naira(Math.abs(netChangeKobo))} more a year under NTA 2025.`
        : 'Your tax is unchanged under NTA 2025.';

  return (
    <section className="grid min-w-0 gap-6">
      <AppText variant="heading-2">What changed for you</AppText>

      <OldVsNew
        old={{
          tag: 'Old regime · PITA',
          amount: nairaValue(oldRegime.annualTaxKobo),
          sub: 'With the old Consolidated Relief Allowance',
        }}
        current={{
          tag: 'New regime · NTA 2025',
          amount: nairaValue(newRegime.annualTaxKobo),
          sub: 'With rent relief + statutory deductions',
        }}
      />

      <DeltaCallout tone={deltaTone} why="Compared to the pre-2026 PITA rules.">
        {deltaHeadline}
      </DeltaCallout>

      <div className="grid gap-3">
        <AppText variant="heading-3">Why it changed</AppText>
        <Repeat each={relevantReforms}>
          {(reform) => (
            <Callout key={reform.id} heading={reform.title}>
              {reform.explanation}
            </Callout>
          )}
        </Repeat>
      </div>
    </section>
  );
}
