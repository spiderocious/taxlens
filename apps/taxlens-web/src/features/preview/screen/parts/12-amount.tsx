import { Repeat } from 'meemaw';

import { Amount, type AmountSize } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

const SIZES: readonly AmountSize[] = ['hero', 'xl', 'lg', 'md', 'sm'];

export function AmountPart() {
  return (
    <div>
      <PartHeader index="12 / Primitives" title="Amount" tagline="The ₦ hero idiom — mono, tabular" />

      <Scene label="Scene · sizes">
        <Repeat each={[...SIZES]}>
          {(size) => (
            <RefRow key={size} label={size}>
              <Amount value="805,200" size={size} />
            </RefRow>
          )}
        </Repeat>
      </Scene>

      <Scene label="Scene · with units & alternate marks">
        <RefRow label="effective rate">
          <Amount value="12.4" size="xl" symbol="" unit="% effective" />
        </RefRow>
        <RefRow label="per year">
          <Amount value="6,480,000" size="lg" unit="/yr" />
        </RefRow>
        <RefRow label="no symbol">
          <Amount value="18" size="lg" symbol="" unit="%" />
        </RefRow>
      </Scene>
    </div>
  );
}
