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

// ── Statement parse process (Module 1, upload path — v1.5 stateful) ─────────
// A process is created on upload, advances through the pipeline, and is keyed
// by an 8-digit `code` the client polls or subscribes to (SSE). See
// docs/product/statement-pipeline.md.

// 'needs_review' — analysis ran but produced no taxable income (gross 0) while
// raw inflows summed > 0: every credit was read as a transfer. The data is ready
// to show, but the UI must NOT present a serene "exempt" — it routes the user to
// reclassify inflows (see docs/qas/extraction-fix-spec.md, Fix A2).
export type ProcessStatus =
  | 'pending'
  | 'validating'
  | 'analyzing'
  | 'ready'
  | 'needs_review'
  | 'failed';

// How much to trust the annualised estimate, derived from monthsCovered:
// low = 1 month (or unknown), medium = 2–11, high = 12. The annual figure is
// always an estimate scoped to the months uploaded, never a declared fact.
export type PeriodConfidence = 'low' | 'medium' | 'high';

export type ChatRole = 'user' | 'assistant';

export interface ChatMessage {
  role: ChatRole;
  content: string;
  /** OpenAI response id for an assistant turn — lets the next turn continue. */
  responseId?: string;
  createdAt: string; // ISO 8601
}

/** Public view of a parse process — what the poll + SSE endpoints return.
 *  Excludes server-only internals (OpenAI response ids, raw chat). */
export interface StatementProcessView {
  code: string;
  status: ProcessStatus;
  profileType: ProfileType;
  failureReason?: string;
  bankName?: string;
  monthsCovered?: number;
  /** Trust level of the annualised estimate, derived from monthsCovered. */
  periodConfidence?: PeriodConfidence;
  inflows?: StatementInflow[];
  /** Sum of ALL extracted inflows (income or not) — lets the UI show how much
   *  was read even when grossAnnualKobo is 0 (the needs_review case). */
  inflowsSumKobo?: number;
  grossAnnualKobo?: number;
  computation?: RegimeComparison;
  createdAt: string; // ISO 8601
  updatedAt: string; // ISO 8601
}
