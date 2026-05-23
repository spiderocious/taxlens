import { Repeat } from 'meemaw';

import { Amount, Chip, EstimateBadge, type ChipVariant } from '@taxlens/ui';

import { PartHeader, RefRow, Scene } from './preview-canvas.tsx';

const VARIANTS: readonly ChipVariant[] = ['clay', 'save', 'warn', 'crit', 'info', 'sand', 'paper'];

const TAXONOMY: readonly { label: string; variant: ChipVariant; text: string }[] = [
  { label: 'Exempt', variant: 'clay', text: 'Exempt — under ₦800k' },
  { label: 'Good news', variant: 'save', text: 'You save ₦128,400' },
  { label: 'Needs input', variant: 'warn', text: '3 credits unclassified' },
  { label: 'Statute note', variant: 'info', text: 'NIN is now your Tax ID' },
  { label: 'Profile', variant: 'paper', text: 'Salary earner' },
  { label: 'Will be lost', variant: 'crit', text: 'Cleared on reset' },
];

export function ChipsPart() {
  return (
    <div>
      <PartHeader index="13 / Primitives" title="Chips & badge" tagline="The tax-position taxonomy — each colour means one thing" />

      <Scene label="Scene · variants (with dot)">
        <Repeat each={[...VARIANTS]}>
          {(variant) => (
            <RefRow key={variant} label={variant}>
              <Chip variant={variant} dot>
                {variant}
              </Chip>
              <Chip variant={variant}>{variant} (no dot)</Chip>
            </RefRow>
          )}
        </Repeat>
      </Scene>

      <Scene label="Scene · the taxonomy in words">
        <div className="flex flex-wrap gap-2.5">
          <Repeat each={[...TAXONOMY]}>
            {(t) => (
              <Chip key={t.text} variant={t.variant} dot>
                {t.text}
              </Chip>
            )}
          </Repeat>
        </div>
      </Scene>

      <Scene label="Scene · estimate badge (required beside every figure)">
        <RefRow label="badge + figure">
          <EstimateBadge />
          <Amount value="805,200" size="lg" />
        </RefRow>
        <RefRow label="custom label">
          <EstimateBadge label="NTA 2025" />
        </RefRow>
      </Scene>
    </div>
  );
}
