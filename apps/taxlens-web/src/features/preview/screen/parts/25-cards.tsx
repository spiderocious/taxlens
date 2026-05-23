import { StatTile, ReliefCard, ResultCard } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function CardsPart() {
  return (
    <div>
      <PartHeader index="25 / Data" title="Cards" tagline="Stat tile · relief card · result card (the hero)" />

      <Scene label="Scene · stat tiles">
        <div className="grid gap-4 sm:grid-cols-3">
          <StatTile label="Annual tax" value="805,200" detail="₦67,100 / month" />
          <StatTile label="Effective rate" value="12.4" symbol="" unit="%" detail="Top band touched: 18%" />
          <StatTile label="You save" value="128,400" tone="save" detail="vs the old regime, per year" />
        </div>
      </Scene>

      <Scene label="Scene · relief cards — what was deducted, and the statute">
        <div className="grid gap-4 sm:grid-cols-3">
          <ReliefCard name="Rent relief" amount="360,000" source="20% of ₦1,800,000 rent, capped at ₦500,000." statute="NTA 2025 · Fourth Schedule" />
          <ReliefCard name="Pension (PFA)" amount="480,000" source="Fully deductible — approved PFA." statute="Pension Reform Act" />
          <ReliefCard name="NHIS / NHF" amount="0" source="Not claimed — add a contribution to deduct it." unclaimed />
        </div>
      </Scene>

      <Scene label="Scene · result card (the hero)">
        <div className="max-w-[380px]">
          <ResultCard
            amount="805,200"
            subline={
              <>
                Effective rate <b>12.4%</b> · ₦67,100/month · take-home <b>₦5,674,800</b>
              </>
            }
            rows={[
              { label: 'Taxable income', value: '₦5,640,000' },
              { label: 'Reliefs applied', value: '₦840,000' },
              { label: 'Tax-free band', value: '₦800,000' },
            ]}
            saveLabel="You save ₦128,400 vs old regime"
          />
        </div>
      </Scene>
    </div>
  );
}
