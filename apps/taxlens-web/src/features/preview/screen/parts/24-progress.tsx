import { Stepper, ProgressBar, Ring } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

const STEPS = [{ label: 'Income' }, { label: 'Result' }, { label: 'What changed' }];

export function ProgressPart() {
  return (
    <div>
      <PartHeader index="24 / Data" title="Progress" tagline="Steps · bars · the compute moment" />

      <Scene label="Scene · the three-step flow">
        <Stepper steps={STEPS} current={1} />
      </Scene>

      <Scene label="Scene · indeterminate — reading your statement">
        <div className="mb-2 flex justify-between">
          <span className="text-sm text-ink">Reading GTBank-statement.pdf…</span>
          <span className="font-mono text-xs text-ink-muted">142 credits</span>
        </div>
        <ProgressBar indeterminate />
      </Scene>

      <Scene label="Scene · determinate — reliefs applied">
        <div className="grid gap-4">
          <div>
            <div className="mb-[7px] flex justify-between">
              <span className="text-sm text-ink">Rent relief used</span>
              <span className="font-mono text-xs text-ink-muted">₦360,000 of ₦500,000 cap</span>
            </div>
            <ProgressBar value={72} />
          </div>
          <div>
            <div className="mb-[7px] flex justify-between">
              <span className="text-sm text-ink">Tax-free band used</span>
              <span className="font-mono text-xs text-ink-muted">₦800,000 of ₦800,000</span>
            </div>
            <ProgressBar value={100} />
          </div>
        </div>
      </Scene>

      <Scene label="Scene · take-home ring">
        <div className="flex items-center gap-6">
          <Ring value={88} label="88%" />
          <div>
            <div className="text-sm font-semibold text-ink">You keep ₦5,674,800</div>
            <p className="mt-1 text-xs text-ink-muted">88% of gross stays with you after tax.</p>
          </div>
        </div>
      </Scene>
    </div>
  );
}
