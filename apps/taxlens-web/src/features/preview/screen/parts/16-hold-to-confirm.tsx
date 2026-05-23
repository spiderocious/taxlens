import { useState } from 'react';

import { AppButton, HoldToConfirmButton, Chip } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function HoldToConfirmPart() {
  const [cleared, setCleared] = useState(false);

  return (
    <div>
      <PartHeader
        index="16 / Primitives"
        title="Hold to confirm"
        tagline="The one irreversible action — press and hold ~1.5s"
      />

      <Scene label="Scene · the irreversible confirm">
        <p className="mb-1 max-w-[54ch] font-sans text-sm text-ink-body">
          This wipes everything from this session — your income, the uploaded statement, and your
          computed result. Nothing is stored, so it cannot be recovered.
        </p>
        <p className="mb-4 font-mono text-xs text-ink-muted">Press and hold for a moment to confirm.</p>
        <div className="flex flex-wrap items-center gap-2.5">
          <AppButton variant="secondary">Keep my data</AppButton>
          <HoldToConfirmButton onConfirm={() => setCleared(true)}>
            Hold to clear everything
          </HoldToConfirmButton>
          {cleared ? (
            <Chip variant="crit" dot>
              Cleared — starting over
            </Chip>
          ) : null}
        </div>
      </Scene>

      <Scene label="Scene · faster hold (500ms) & disabled">
        <div className="flex flex-wrap items-center gap-2.5">
          <HoldToConfirmButton holdMs={500} onConfirm={() => undefined}>
            Quick hold (500ms)
          </HoldToConfirmButton>
          <HoldToConfirmButton disabled onConfirm={() => undefined}>
            Disabled
          </HoldToConfirmButton>
        </div>
      </Scene>
    </div>
  );
}
