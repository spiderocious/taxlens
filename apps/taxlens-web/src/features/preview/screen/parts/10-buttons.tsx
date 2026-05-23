import { Repeat } from 'meemaw';

import { AppButton, type AppButtonVariant } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

const VARIANTS: readonly AppButtonVariant[] = ['primary', 'secondary', 'ghost', 'danger'];

export function ButtonsPart() {
  return (
    <div>
      <PartHeader index="10 / Primitives" title="Buttons" tagline="AppButton variants & states" />

      <Scene label="Scene · variants">
        <Repeat each={[...VARIANTS]}>
          {(variant) => (
            <RefRow key={variant} label={variant}>
              <AppButton variant={variant}>Compute tax</AppButton>
            </RefRow>
          )}
        </Repeat>
      </Scene>

      <Scene label="Scene · states">
        <RefRow label="loading">
          <AppButton loading>Compute tax</AppButton>
        </RefRow>
        <RefRow label="disabled">
          <AppButton disabled>Compute tax</AppButton>
        </RefRow>
      </Scene>
    </div>
  );
}
