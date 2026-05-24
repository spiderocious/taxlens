import { parseNairaToKobo, type IncomeInput, type ProfileType } from '@taxlens/core';

import type { ManualDraft } from '../providers/income-provider.tsx';

/**
 * Turn the raw manual-entry draft (naira strings, monthly-or-annual gross) into
 * the kobo IncomeInput the backend/engine expects. Monthly gross is ×12. Pure.
 */
export function draftToIncome(draft: ManualDraft, profileType: ProfileType): IncomeInput {
  const grossKobo = parseNairaToKobo(draft.grossInput);
  const grossAnnualKobo = draft.grossFrequency === 'monthly' ? grossKobo * 12 : grossKobo;

  return {
    profileType,
    grossAnnualKobo,
    reliefs: {
      annualRentKobo: parseNairaToKobo(draft.rentInput),
      pensionKobo: parseNairaToKobo(draft.pensionInput),
      nhisKobo: parseNairaToKobo(draft.nhisInput),
      nhfKobo: parseNairaToKobo(draft.nhfInput),
      lifeInsuranceKobo: parseNairaToKobo(draft.lifeInsuranceInput),
    },
  };
}

/** True when the user has entered a positive gross — gates the Compute button. */
export function hasGross(draft: ManualDraft): boolean {
  return parseNairaToKobo(draft.grossInput) > 0;
}
