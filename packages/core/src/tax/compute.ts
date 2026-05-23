// Pure tax-computation engine. No I/O, no framework — consumed by the backend
// (stateless compute endpoint) and the frontend (client-side estimate) alike.
// All amounts are kobo.

import type {
  AppliedRelief,
  IncomeInput,
  RegimeComparison,
  ReformPoint,
  TaxBand,
  TaxComputation,
} from '../types/index.js';
import {
  CRA_FIXED_KOBO,
  CRA_RATE,
  NTA_2025_BANDS,
  PITA_OLD_BANDS,
  RENT_RELIEF_CAP_KOBO,
  RENT_RELIEF_RATE,
  type BandDefinition,
} from './bands.js';

const round = (n: number): number => Math.round(n);

/** Charge a taxable income across a progressive band table. */
function applyBands(taxableKobo: number, bands: readonly BandDefinition[]): TaxBand[] {
  return bands.map((band) => {
    const upper = band.upperKobo ?? Number.POSITIVE_INFINITY;
    const amountInBandKobo = Math.max(0, Math.min(taxableKobo, upper) - band.lowerKobo);
    return {
      lowerKobo: band.lowerKobo,
      upperKobo: band.upperKobo,
      rate: band.rate,
      amountInBandKobo: round(amountInBandKobo),
      taxKobo: round(amountInBandKobo * band.rate),
    };
  });
}

function finalize(
  regime: TaxComputation['regime'],
  grossAnnualKobo: number,
  totalReliefsKobo: number,
  appliedReliefs: AppliedRelief[],
  bands: TaxBand[],
): TaxComputation {
  const taxableIncomeKobo = Math.max(0, grossAnnualKobo - totalReliefsKobo);
  const annualTaxKobo = bands.reduce((sum, b) => sum + b.taxKobo, 0);
  const takeHomeAnnualKobo = grossAnnualKobo - annualTaxKobo;
  return {
    regime,
    grossAnnualKobo,
    totalReliefsKobo,
    appliedReliefs,
    taxableIncomeKobo,
    annualTaxKobo,
    monthlyTaxKobo: round(annualTaxKobo / 12),
    takeHomeAnnualKobo,
    takeHomeMonthlyKobo: round(takeHomeAnnualKobo / 12),
    effectiveRate: grossAnnualKobo > 0 ? annualTaxKobo / grossAnnualKobo : 0,
    isExempt: annualTaxKobo === 0,
    bands,
  };
}

/** NTA 2025: CRA abolished, replaced by rent relief + statutory deductions. */
export function computeNta2025(input: IncomeInput): TaxComputation {
  const { reliefs, grossAnnualKobo } = input;
  const rentReliefKobo = Math.min(
    round(reliefs.annualRentKobo * RENT_RELIEF_RATE),
    RENT_RELIEF_CAP_KOBO,
  );

  const candidateReliefs: AppliedRelief[] = [
    { key: 'rent_relief', label: 'Rent relief (20% of rent, capped ₦500k)', amountKobo: rentReliefKobo },
    { key: 'pensionKobo', label: 'Pension contribution', amountKobo: reliefs.pensionKobo },
    { key: 'nhisKobo', label: 'NHIS contribution', amountKobo: reliefs.nhisKobo },
    { key: 'nhfKobo', label: 'NHF contribution', amountKobo: reliefs.nhfKobo },
    { key: 'lifeInsuranceKobo', label: 'Life insurance / annuity premium', amountKobo: reliefs.lifeInsuranceKobo },
  ];
  const appliedReliefs = candidateReliefs.filter((r) => r.amountKobo > 0);

  const totalReliefsKobo = appliedReliefs.reduce((sum, r) => sum + r.amountKobo, 0);
  const taxableIncomeKobo = Math.max(0, grossAnnualKobo - totalReliefsKobo);
  const bands = applyBands(taxableIncomeKobo, NTA_2025_BANDS);
  return finalize('nta_2025', grossAnnualKobo, totalReliefsKobo, appliedReliefs, bands);
}

/** Pre-2026 PITA: Consolidated Relief Allowance + statutory deductions. */
export function computePitaOld(input: IncomeInput): TaxComputation {
  const { reliefs, grossAnnualKobo } = input;
  const craKobo = CRA_FIXED_KOBO + round(grossAnnualKobo * CRA_RATE);

  const candidateReliefs: AppliedRelief[] = [
    { key: 'rent_relief', label: 'Consolidated Relief Allowance (₦200k + 20% gross)', amountKobo: craKobo },
    { key: 'pensionKobo', label: 'Pension contribution', amountKobo: reliefs.pensionKobo },
    { key: 'nhisKobo', label: 'NHIS contribution', amountKobo: reliefs.nhisKobo },
    { key: 'nhfKobo', label: 'NHF contribution', amountKobo: reliefs.nhfKobo },
    { key: 'lifeInsuranceKobo', label: 'Life insurance / annuity premium', amountKobo: reliefs.lifeInsuranceKobo },
  ];
  const appliedReliefs = candidateReliefs.filter((r) => r.amountKobo > 0);

  const totalReliefsKobo = appliedReliefs.reduce((sum, r) => sum + r.amountKobo, 0);
  const taxableIncomeKobo = Math.max(0, grossAnnualKobo - totalReliefsKobo);
  const bands = applyBands(taxableIncomeKobo, PITA_OLD_BANDS);
  return finalize('pita_old', grossAnnualKobo, totalReliefsKobo, appliedReliefs, bands);
}

const REFORM_LIBRARY: ReformPoint[] = [
  {
    id: 'cra_abolished',
    title: 'CRA replaced by rent relief',
    explanation: 'The Consolidated Relief Allowance is gone; rent relief (20% of rent, capped at ₦500k) takes its place.',
  },
  {
    id: 'zero_band',
    title: 'First ₦800,000 is tax-free',
    explanation: 'Taxable income up to ₦800,000 is taxed at 0% under NTA 2025.',
  },
  {
    id: 'nin_tax_id',
    title: 'Your NIN is now your Tax ID',
    explanation: 'Tax identification is unified under your National Identification Number.',
  },
];

export function compareRegimes(input: IncomeInput): RegimeComparison {
  const newRegime = computeNta2025(input);
  const oldRegime = computePitaOld(input);
  const netChangeKobo = oldRegime.annualTaxKobo - newRegime.annualTaxKobo;

  const direction: RegimeComparison['direction'] =
    netChangeKobo > 0 ? 'saves' : netChangeKobo < 0 ? 'pays_more' : 'no_change';

  // Surface only reforms relevant to this profile.
  const relevantReforms = REFORM_LIBRARY.filter((r) => {
    if (r.id === 'cra_abolished') return true;
    if (r.id === 'zero_band') return newRegime.taxableIncomeKobo <= 800_000 * 100 || newRegime.isExempt;
    return true;
  });

  return { newRegime, oldRegime, netChangeKobo, direction, relevantReforms };
}
