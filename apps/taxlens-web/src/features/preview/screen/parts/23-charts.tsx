import { Donut, BarCompare, EffectiveRateGauge, Amount, Chip } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function ChartsPart() {
  return (
    <div>
      <PartHeader index="23 / Data" title="Charts" tagline="Hairline-only · clay fills · no spectacle" />

      <Scene label="Scene · where your gross goes (donut)">
        <div className="flex items-center gap-6">
          <Donut
            segments={[
              { pct: 12.4, color: '#8E4022' },
              { pct: 13, color: '#CE7A50' },
            ]}
            centerLabel="88%"
            centerSub="take-home"
          />
          <div className="grid gap-2.5 text-[12.5px]">
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-clay-700" />
              Tax<span className="ml-auto font-mono tabular-nums">₦805,200</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-clay-400" />
              Reliefs<span className="ml-auto font-mono tabular-nums">₦840,000</span>
            </div>
            <div className="flex items-center gap-2">
              <span className="h-2.5 w-2.5 rounded-[3px] bg-paper-deep" />
              Take-home<span className="ml-auto font-mono tabular-nums">₦5,674,800</span>
            </div>
          </div>
        </div>
      </Scene>

      <Scene label="Scene · old vs new (bars)">
        <div className="mb-3 flex items-center justify-between">
          <span className="text-[13px] font-semibold">Old vs new</span>
          <Chip variant="save">−₦128,400</Chip>
        </div>
        <BarCompare
          oldPct={100}
          newPct={86}
          oldLabel="Old PITA"
          newLabel="NTA 2025"
          oldValue="₦933.6k"
          newValue="₦805.2k"
        />
      </Scene>

      <Scene label="Scene · effective rate vs top band (gauge)">
        <div className="mb-3.5 flex items-baseline gap-1.5">
          <Amount value="12.4" size="xl" symbol="" unit="% effective" />
        </div>
        <EffectiveRateGauge effectivePct={49.6} topBandPct={72} midLabel="top band 18% ↑" />
      </Scene>
    </div>
  );
}
