import { Repeat } from 'meemaw';

import { AppText, type AppTextVariant } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

const VARIANTS: readonly AppTextVariant[] = [
  'display-1',
  'display-2',
  'heading-1',
  'heading-2',
  'heading-3',
  'body',
  'body-sm',
  'caption',
];

export function TypePart() {
  return (
    <div>
      <PartHeader index="02 / Foundation" title="Typography" tagline="AppText variants" />
      <Scene label="Scene · every variant">
        <Repeat each={[...VARIANTS]}>
          {(variant) => (
            <RefRow key={variant} label={variant}>
              <AppText variant={variant}>The quick brown fox — ₦1,234,567</AppText>
            </RefRow>
          )}
        </Repeat>
      </Scene>
    </div>
  );
}
