import { TopBar, StepRail, AppButton } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

const LINKS = [
  { label: 'Calculator', active: true },
  { label: 'How it works' },
  { label: 'About this build' },
];

const RAIL = [
  { index: 'Step 1', title: 'Your income' },
  { index: 'Step 2', title: 'Your result' },
  { index: 'Step 3', title: 'What changed' },
];

export function NavPart() {
  return (
    <div>
      <PartHeader index="40 / Navigation" title="Top bar & step rail" tagline="The flow IS the navigation" />

      <Scene label="Scene · top bar — brand + the few destinations">
        <TopBar
          links={LINKS}
          action={
            <AppButton size="sm">Start over</AppButton>
          }
        />
      </Scene>

      <Scene label="Scene · step rail — where you are in the flow">
        <StepRail steps={RAIL} active={0} />
      </Scene>
    </div>
  );
}
