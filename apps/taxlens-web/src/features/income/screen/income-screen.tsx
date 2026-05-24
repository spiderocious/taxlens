import { useSearchParams } from 'react-router-dom';
import { Show } from 'meemaw';

import { ROUTES } from '@taxlens/core';
import { AppText } from '@taxlens/ui';

import { AppShell } from '@shared/ui/app-shell.tsx';

import { useIncomeContext } from '../providers/income-provider.tsx';
import { ProfileStep } from './parts/profile-step.tsx';
import { ManualForm } from './parts/manual-form.tsx';
import { UploadFlow } from './parts/upload-flow.tsx';

// Module 1 — income input. One route, two paths (?path=manual|upload) behind a
// shared profile step. State lives in IncomeProvider so switching paths never
// loses entries (PRD).
export function IncomeScreen() {
  const [params] = useSearchParams();
  const path = params.get('path') === 'upload' ? 'upload' : 'manual';
  const { profileType, setProfileType } = useIncomeContext();

  return (
    <AppShell activeStep={0} activeLink={ROUTES.HOME}>
      <main className="grid gap-8 px-5 py-8 sm:px-6 sm:py-10">
        <header>
          <AppText variant="caption">step 1 — your income</AppText>
          <AppText variant="heading-2" className="mt-1 sm:text-[28px]">
            {path === 'upload' ? 'Upload your bank statement' : 'Tell us about your income'}
          </AppText>
        </header>

        <ProfileStep value={profileType} onChange={setProfileType} />

        <Show when={profileType !== null}>
          <Show when={path === 'upload'} fallback={<ManualForm profileType={profileType ?? 'salary_earner'} />}>
            <UploadFlow profileType={profileType ?? 'salary_earner'} />
          </Show>
        </Show>
      </main>
    </AppShell>
  );
}
