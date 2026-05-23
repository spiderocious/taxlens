import { Toast, Banner, Callout, Disclaimer } from '@taxlens/ui';
import { IconDone, IconInfo, IconWarn } from '@icons';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function FeedbackPart() {
  return (
    <div>
      <PartHeader index="32 / Overlay" title="Feedback" tagline="Toasts · banners · callouts — calm, factual" />

      <Scene label="Scene · toasts (transient)">
        <div className="grid gap-3.5">
          <Toast tone="save" icon={<IconDone size={16} />} onDismiss={() => undefined}>
            Result downloaded — TaxLens-2026-estimate.pdf
          </Toast>
          <Toast onUndo={() => undefined}>3 credits reclassified as business income</Toast>
          <Toast icon={<IconInfo size={16} />} onDismiss={() => undefined}>
            Switched to yearly — figures converted
          </Toast>
        </div>
      </Scene>

      <Scene label="Scene · banners (standing notes)">
        <div className="grid gap-3.5">
          <Banner tone="info" icon={<IconInfo size={16} />}>
            <b className="font-semibold">NIN is now your Tax ID.</b> Under the NTA Administration Act
            2025, your National Identity Number is your TIN — no separate registration needed.
          </Banner>
          <Banner tone="warn" icon={<IconWarn size={16} />}>
            <b className="font-semibold">3 credits are still unclassified.</b> Your result excludes
            them for now. Classify them to include them in your taxable income.
          </Banner>
        </div>
      </Scene>

      <Scene label="Scene · callout (the teaching note)">
        <Callout>
          Compensation for loss of employment is exempt up to{' '}
          <span className="font-mono">₦50,000,000</span> under the NTA 2025 — raised from ₦10m.
        </Callout>
        <Disclaimer />
      </Scene>
    </div>
  );
}
