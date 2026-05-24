import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

import type { ProfileType } from '@taxlens/core';
import { ROUTES } from '@taxlens/core';
import { useComputeTax, parseApiError, ERROR_CODE } from '@taxlens/api';
import {
  AppButton,
  AppText,
  Callout,
  ErrorState,
  Field,
  MoneyField,
  SegmentedControl,
} from '@taxlens/ui';

import { useIncomeContext, type ManualDraft } from '../../providers/income-provider.tsx';
import { draftToIncome, hasGross } from '../../helpers/draft-to-income.ts';

const FREQUENCY_OPTIONS = [
  { label: 'Per year', value: 'annual' as const },
  { label: 'Per month', value: 'monthly' as const },
];

interface ManualFormProps {
  readonly profileType: ProfileType;
}

export function ManualForm({ profileType }: ManualFormProps) {
  const navigate = useNavigate();
  const { manualDraft, setManualDraft, setResult } = useIncomeContext();
  const compute = useComputeTax();
  const [submitError, setSubmitError] = useState<string | null>(null);

  function set<K extends keyof ManualDraft>(key: K, value: ManualDraft[K]) {
    setManualDraft({ ...manualDraft, [key]: value });
  }

  function handleCompute() {
    setSubmitError(null);
    const input = draftToIncome(manualDraft, profileType);
    compute.mutate(input, {
      onSuccess: (comparison) => {
        setResult({ comparison, source: 'manual' });
        navigate(ROUTES.RESULT);
      },
      onError: async (err) => {
        // ky throws HTTPError; pull the flat error body and key off errorCode.
        const body =
          err instanceof Error && 'response' in err
            ? await (err as unknown as { response: Response }).response.json().catch(() => null)
            : null;
        const parsed = parseApiError(body);
        setSubmitError(
          parsed.errorCode === ERROR_CODE.VALIDATION
            ? parsed.errorMessage
            : 'We couldn’t compute that. Please check your figures and try again.',
        );
      },
    });
  }

  const canCompute = hasGross(manualDraft) && !compute.isPending;

  return (
    <section className="grid gap-6">
      <Field label="Gross income" help="Before any tax or deductions.">
        <div className="flex items-center gap-2.5">
          <MoneyField
            value={manualDraft.grossInput}
            onChange={(e) => set('grossInput', e.target.value)}
            per={manualDraft.grossFrequency === 'monthly' ? '/mo' : '/yr'}
            placeholder="0"
            aria-label="Gross income amount"
            className="flex-1"
          />
          <SegmentedControl
            options={FREQUENCY_OPTIONS}
            value={manualDraft.grossFrequency}
            onChange={(v) => set('grossFrequency', v)}
            ariaLabel="Income frequency"
          />
        </div>
      </Field>

      <div className="grid gap-1.5">
        <AppText variant="heading-3">Reliefs &amp; deductions</AppText>
        <AppText variant="body-sm" className="text-ink-muted">
          Leave blank what doesn’t apply. We only deduct what you enter.
        </AppText>
      </div>

      <div className="grid gap-4 sm:grid-cols-2">
        <Field label="Annual rent paid" help="We apply 20%, capped at ₦500,000.">
          <MoneyField
            value={manualDraft.rentInput}
            onChange={(e) => set('rentInput', e.target.value)}
            placeholder="0"
            aria-label="Annual rent paid"
          />
        </Field>
        <Field label="Pension contribution" help="Annual, to an approved PFA.">
          <MoneyField
            value={manualDraft.pensionInput}
            onChange={(e) => set('pensionInput', e.target.value)}
            placeholder="0"
            aria-label="Pension contribution"
          />
        </Field>
        <Field label="NHIS contribution">
          <MoneyField
            value={manualDraft.nhisInput}
            onChange={(e) => set('nhisInput', e.target.value)}
            placeholder="0"
            aria-label="NHIS contribution"
          />
        </Field>
        <Field label="NHF contribution">
          <MoneyField
            value={manualDraft.nhfInput}
            onChange={(e) => set('nhfInput', e.target.value)}
            placeholder="0"
            aria-label="NHF contribution"
          />
        </Field>
        <Field label="Life insurance / annuity premium">
          <MoneyField
            value={manualDraft.lifeInsuranceInput}
            onChange={(e) => set('lifeInsuranceInput', e.target.value)}
            placeholder="0"
            aria-label="Life insurance or annuity premium"
          />
        </Field>
      </div>

      <Callout heading="Nothing is stored">
        Your figures are sent once to compute your estimate, then forgotten. TaxLens keeps no account
        and saves nothing.
      </Callout>

      {submitError !== null ? (
        <ErrorState title="Couldn’t compute" description={submitError} />
      ) : null}

      <div className="flex justify-end">
        <AppButton size="lg" loading={compute.isPending} disabled={!canCompute} onClick={handleCompute}>
          See my tax position
        </AppButton>
      </div>
    </section>
  );
}
