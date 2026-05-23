import { Repeat } from 'meemaw';

import { AppButton, type AppButtonVariant, type AppButtonSize } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

const VARIANTS: readonly AppButtonVariant[] = [
  'primary',
  'secondary',
  'ghost',
  'link',
  'danger',
  'dangerSolid',
];
const SIZES: readonly AppButtonSize[] = ['sm', 'md', 'lg'];

export function ButtonsPart() {
  return (
    <div>
      <PartHeader index="10 / Primitives" title="Buttons" tagline="AppButton — clay primary, ghost destructive" />

      <Scene label="Scene · variants">
        <Repeat each={[...VARIANTS]}>
          {(variant) => (
            <RefRow key={variant} label={variant}>
              <AppButton variant={variant}>Calculate my tax</AppButton>
            </RefRow>
          )}
        </Repeat>
      </Scene>

      <Scene label="Scene · sizes (primary)">
        <Repeat each={[...SIZES]}>
          {(size) => (
            <RefRow key={size} label={size}>
              <AppButton size={size}>Calculate my tax</AppButton>
            </RefRow>
          )}
        </Repeat>
      </Scene>

      <Scene label="Scene · states">
        <RefRow label="loading">
          <AppButton loading>Calculate my tax</AppButton>
        </RefRow>
        <RefRow label="disabled">
          <AppButton disabled>Calculate my tax</AppButton>
        </RefRow>
        <RefRow label="block">
          <AppButton block>Calculate my tax</AppButton>
        </RefRow>
        <RefRow label="with icons">
          <AppButton leadingIcon={<span aria-hidden>↑</span>}>Upload statement</AppButton>
          <AppButton variant="link" trailingIcon={<span aria-hidden>→</span>}>
            Try with sample data
          </AppButton>
        </RefRow>
      </Scene>
    </div>
  );
}
