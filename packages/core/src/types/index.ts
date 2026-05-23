// TaxLens domain types. Personal income tax under the Nigeria Tax Act 2025
// (effective 1 Jan 2026). All money is in kobo (1 NGN = 100 kobo) end-to-end —
// see formatNaira / parseNairaToKobo in money/format-naira.ts.

// ── Input ────────────────────────────────────────────────────────────────

export type ProfileType = 'salary_earner' | 'freelancer' | 'mixed';

export type InputPath = 'sample' | 'manual' | 'upload';

export type IncomeFrequency = 'annual' | 'monthly';

/** Reliefs/deductions a visitor can declare, all in kobo. */
export interface ReliefInputs {
  annualRentKobo: number;
  pensionKobo: number;
  nhisKobo: number;
  nhfKobo: number;
  lifeInsuranceKobo: number;
}

/** Raw income declaration captured from the user (manual or extracted). */
export interface IncomeInput {
  profileType: ProfileType;
  grossAnnualKobo: number;
  reliefs: ReliefInputs;
}

// ── Bank statement extraction (Module 1, upload path) ──────────────────────

export type InflowClass = 'salary' | 'business' | 'transfer' | 'other';

export interface StatementInflow {
  id: string;
  date: string; // ISO 8601
  description: string;
  amountKobo: number;
  classification: InflowClass;
}

// ── Computation (Module 2) ─────────────────────────────────────────────────

/** A single taxed tranche of income — the band-by-band breakdown. */
export interface TaxBand {
  lowerKobo: number;
  upperKobo: number | null; // null = no upper bound (top band)
  rate: number; // e.g. 0.15 for 15%
  amountInBandKobo: number; // portion of taxable income falling in this band
  taxKobo: number; // tax charged on this band
}

/** A relief actually applied to reach taxable income. */
export interface AppliedRelief {
  key: keyof ReliefInputs | 'rent_relief';
  label: string;
  amountKobo: number;
}

export type TaxRegime = 'nta_2025' | 'pita_old';

export interface TaxComputation {
  regime: TaxRegime;
  grossAnnualKobo: number;
  totalReliefsKobo: number;
  appliedReliefs: AppliedRelief[];
  taxableIncomeKobo: number;
  annualTaxKobo: number;
  monthlyTaxKobo: number;
  takeHomeAnnualKobo: number;
  takeHomeMonthlyKobo: number;
  effectiveRate: number; // annualTax / grossAnnual
  isExempt: boolean;
  bands: TaxBand[];
}

// ── Comparison (Module 3) ───────────────────────────────────────────────────

export type ChangeDirection = 'saves' | 'pays_more' | 'no_change';

export interface RegimeComparison {
  newRegime: TaxComputation; // nta_2025
  oldRegime: TaxComputation; // pita_old
  netChangeKobo: number; // oldTax - newTax (positive = saving under new regime)
  direction: ChangeDirection;
  /** Reform points relevant to this profile, one-line each. */
  relevantReforms: ReformPoint[];
}

export interface ReformPoint {
  id: string;
  title: string;
  explanation: string;
}
