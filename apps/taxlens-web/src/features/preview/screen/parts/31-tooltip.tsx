import { Tooltip, Popover } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function TooltipPart() {
  return (
    <div>
      <PartHeader index="31 / Overlay" title="Tooltip & popover" tagline="Defining a term · the “why” popover" />

      <Scene label="Scene · tooltip — define a term, plainly">
        <p className="text-base leading-[2.2] text-ink">
          Your{' '}
          <Tooltip content="The share of your total income that goes to tax — lower than your top band because earlier slices are taxed less.">
            effective rate
          </Tooltip>{' '}
          is 12.4%, even though you touch the{' '}
          <Tooltip content="The highest band any part of your income reaches. Only the slice inside it is taxed at 18%.">
            18% band
          </Tooltip>
          .
        </p>
      </Scene>

      <Scene label="Scene · popover — the statute behind a number">
        <Popover
          statuteRef="NTA 2025 · Fourth Schedule"
          quote="“Rent relief: 20% of annual rent paid, capped at ₦500,000.”"
        >
          20% × ₦1,800,000 = ₦360,000 <span className="text-ink-muted">(below the ₦500k cap)</span>
        </Popover>
      </Scene>
    </div>
  );
}
