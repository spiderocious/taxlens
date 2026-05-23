import { AssistCard, MethodologyList, ExportRow, AppButton, type MethodologyEntry } from '@taxlens/ui';

import { PartHeader, Scene } from './preview-canvas.tsx';

const METHOD: readonly MethodologyEntry[] = [
  { what: 'Tax bands (0 / 15 / 18 / 21 / 23 / 25%)', ref: 'NTA 2025 · Fourth Schedule' },
  { what: 'Rent relief — 20%, capped ₦500,000', ref: 'NTA 2025 · reliefs' },
  { what: 'Pension / NHIS / NHF / insurance deductible', ref: 'NTA 2025 · reliefs' },
  { what: 'Exempt threshold — ₦800,000', ref: 'NTA 2025 · Fourth Schedule' },
  { what: 'Old-regime comparison bands + CRA', ref: 'PITA (pre-2026)' },
];

export function CrossPart() {
  return (
    <div>
      <PartHeader index="33 / Overlay" title="Cross-record" tagline="AI assist · methodology · export" />

      <Scene label="Scene · AI assist — suggests, never acts">
        <AssistCard
          heading="A relief you might be missing"
          actions={
            <>
              <AppButton variant="secondary" size="sm">
                Add a relief
              </AppButton>
              <AppButton variant="ghost" size="sm">
                Not applicable
              </AppButton>
            </>
          }
        >
          You entered rent and pension, but no NHIS or life-insurance premium. If you contribute to
          either, they’re deductible.{' '}
          <span className="font-serif italic">I can’t add them for you — you’d enter the amounts yourself.</span>
        </AssistCard>
      </Scene>

      <Scene label="Scene · methodology — every number traces to the statute">
        <MethodologyList entries={METHOD} />
      </Scene>

      <Scene label="Scene · export — the single artifact a visitor takes away">
        <ExportRow
          filename="TaxLens-2026-estimate.pdf"
          meta="Result + band breakdown + reliefs + methodology · stamped “Estimate, not advice”"
          action={<AppButton size="sm">Download</AppButton>}
        />
      </Scene>
    </div>
  );
}
