import { AppText } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function TextPart() {
  return (
    <div>
      <PartHeader index="11 / Primitives" title="Text" tagline="AppText in composition" />
      <Scene label="Scene · a result heading block">
        <AppText variant="caption">estimate under NTA 2025</AppText>
        <AppText variant="heading-1" className="mt-1 text-teal-900">
          You take home ₦4,210,000
        </AppText>
        <AppText variant="body-sm" className="mt-2 text-ink-700">
          Effective rate 12.3% · monthly tax ₦49,167
        </AppText>
      </Scene>
    </div>
  );
}
