import { Skeleton, EmptyState, ErrorState, AppButton } from '@taxlens/ui';
import { IconStatement } from '@icons';

import { PartHeader, Scene } from './preview-canvas.tsx';

export function StatesPart() {
  return (
    <div>
      <PartHeader index="26 / Data" title="Skeleton & empty" tagline="Loading · empty · error — calm, never scolding" />

      <Scene label="Scene · loading (mirrors the result layout)">
        <div className="grid gap-3">
          <Skeleton height="14px" width="50%" />
          <Skeleton height="40px" width="70%" />
          <Skeleton height="34px" />
          <Skeleton height="34px" width="80%" />
        </div>
      </Scene>

      <Scene label="Scene · empty — nothing entered yet">
        <EmptyState
          icon={<IconStatement size={28} strokeWidth={1.4} />}
          title="Nothing to show yet"
          description="Enter your income or upload a statement, and your tax position will appear here."
          action={<AppButton>Try with sample data</AppButton>}
        />
      </Scene>

      <Scene label="Scene · empty — AI out of scope (serif voice)">
        <EmptyState
          quote
          title="“That’s outside what I can help with.”"
          description="TaxLens only explains personal income tax under the NTA 2025. For VAT or company tax, a tax consultant or the NRS can help."
        />
      </Scene>

      <Scene label="Scene · error — couldn’t read the file">
        <ErrorState
          title="We couldn’t read that PDF"
          description="It may be password-protected or a scanned image. Try a downloaded PDF from your bank’s app, or enter your income manually."
          action={
            <>
              <AppButton variant="secondary" size="sm">
                Enter manually
              </AppButton>
              <AppButton variant="ghost" size="sm">
                Try another file
              </AppButton>
            </>
          }
        />
      </Scene>
    </div>
  );
}
