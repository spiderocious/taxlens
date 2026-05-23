import { OldVsNew, DeltaCallout, Disclaimer } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function ComparisonPart() {
  return (
    <div>
      <PartHeader index="21 / Data" title="Old vs new" tagline="“What changed for you” — calm, never alarm" />

      <Scene label="Scene · same income, two regimes">
        <OldVsNew
          old={{
            tag: 'Old regime · pre-2026 PITA',
            amount: '933,600',
            sub: 'Effective 14.4% · after old CRA (₦200k + 20%)',
          }}
          current={{
            tag: 'New regime · NTA 2025',
            amount: '805,200',
            sub: 'Effective 12.4% · after rent relief (₦360k) + pension',
          }}
        />
        <div className="mt-5">
          <DeltaCallout why="That’s about ₦10,700 a month back in your pocket.">
            You pay <b className="text-save">₦128,400 less</b> a year under the new law.
          </DeltaCallout>
        </div>
      </Scene>

      <Scene label="Scene · the other direction (you pay more)">
        <DeltaCallout tone="bad" why="The new top band reaches you at this income level.">
          You pay <b className="text-warn">₦64,000 more</b> a year under the new law.
        </DeltaCallout>
        <Disclaimer>
          Comparison uses the old PITA bands for illustration only — those rates no longer apply to
          2026 income. <b className="font-semibold text-ink-body">Estimate — not tax advice.</b>
        </Disclaimer>
      </Scene>
    </div>
  );
}
