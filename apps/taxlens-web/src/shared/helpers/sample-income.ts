import type { IncomeInput, ProfileType } from '@taxlens/core';

/**
 * "Try with sample data" (Module 1) — fixed, realistic income declarations so
 * the tool can be demoed with zero data entry. Pure data; the caller runs
 * compareRegimes from @taxlens/core to turn these into a result. All kobo.
 */
export type SampleKey = 'salary_earner' | 'freelancer';

const NAIRA = 100;

export const SAMPLE_INCOME: Record<SampleKey, IncomeInput> = {
  salary_earner: {
    profileType: 'salary_earner',
    grossAnnualKobo: 8_400_000 * NAIRA, // ₦8.4m / yr (₦700k / mo)
    reliefs: {
      annualRentKobo: 2_400_000 * NAIRA, // ₦2.4m rent → ₦480k relief (under cap)
      pensionKobo: 672_000 * NAIRA, // 8% pension
      nhisKobo: 0,
      nhfKobo: 210_000 * NAIRA,
      lifeInsuranceKobo: 0,
    },
  },
  freelancer: {
    profileType: 'freelancer',
    grossAnnualKobo: 5_000_000 * NAIRA, // ₦5m / yr
    reliefs: {
      annualRentKobo: 1_800_000 * NAIRA, // ₦1.8m rent → ₦360k relief
      pensionKobo: 0,
      nhisKobo: 120_000 * NAIRA,
      nhfKobo: 0,
      lifeInsuranceKobo: 250_000 * NAIRA,
    },
  },
};

export const SAMPLE_LABELS: Record<SampleKey, string> = {
  salary_earner: 'Sample salary earner',
  freelancer: 'Sample freelancer',
};

export function sampleProfileType(key: SampleKey): ProfileType {
  return key;
}
