import {
  BandLadder,
  BandSplitBar,
  StatTile,
  CitationBlock,
  Disclaimer,
  type BandRung,
  type BandSegment,
} from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

const SEGMENTS: readonly BandSegment[] = [
  { pct: 14.2, color: 'bg-clay-300', rateLabel: '0%', amountLabel: '₦800k free', dark: true },
  { pct: 39, color: 'bg-clay-500', rateLabel: '15%', amountLabel: '₦2.2m' },
  { pct: 46.8, color: 'bg-clay-700', rateLabel: '18%', amountLabel: '₦2.64m' },
];

const RUNGS: readonly BandRung[] = [
  { name: 'First slice — exempt', range: '₦0 – ₦800,000', rate: '0%', tax: '₦0', fill: 100, exempt: true },
  { name: 'Second slice', range: '₦800,001 – ₦3,000,000', rate: '15%', tax: '₦330,000', fill: 100 },
  { name: 'Third slice', range: '₦3,000,001 – ₦5,640,000', rate: '18%', tax: '₦475,200', fill: 74 },
  { name: 'Fourth slice — you don’t reach this', range: '₦12,000,001 – ₦25,000,000', rate: '21%', tax: '—', fill: 0, untouched: true },
  { name: 'Top slice — you don’t reach this', range: 'above ₦50,000,000', rate: '25%', tax: '—', fill: 0, untouched: true },
];

export function BandsPart() {
  return (
    <div>
      <PartHeader index="20 / Data" title="Band breakdown" tagline="The signature display — how the number was built" />

      <Scene label="Scene · at a glance — taxable income split by band">
        <BandSplitBar segments={SEGMENTS} />
      </Scene>

      <Scene label="Scene · band by band — the full ladder">
        <BandLadder rungs={RUNGS} />
        <div className="mt-4 grid grid-cols-3 gap-0 overflow-hidden rounded-[14px] border border-edge">
          <StatTile label="Total tax" value="805,200" size="lg" className="rounded-none border-0 border-r border-edge" />
          <StatTile label="Effective rate" value="12.4" symbol="" unit="%" size="lg" className="rounded-none border-0 border-r border-edge" />
          <StatTile label="Top band you touch" value="18" symbol="" unit="%" size="lg" className="rounded-none border-0" />
        </div>
        <CitationBlock statuteRef="NTA 2025 · Fourth Schedule">
          “Each rate applies only to the portion of taxable income that falls within its band.”
        </CitationBlock>
        <Disclaimer />
      </Scene>
    </div>
  );
}
