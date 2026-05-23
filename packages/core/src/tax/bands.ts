// NTA 2025 personal income tax bands + reliefs, and the legacy PITA bands for
// the comparison view. Every number here is sourced from the Fourth Schedule
// of the Nigeria Tax Act 2025 (effective 1 Jan 2026) and the pre-2026 PITA —
// no invented numbers (see docs/product/mvp.md). All amounts are kobo.

const NAIRA = 100; // kobo per naira

export interface BandDefinition {
  /** Inclusive lower bound in kobo. */
  lowerKobo: number;
  /** Exclusive upper bound in kobo, or null for the top (open-ended) band. */
  upperKobo: number | null;
  rate: number;
}

// ── NTA 2025 (new regime) ───────────────────────────────────────────────────
// | Up to 800,000        | 0%
// | 800,001 – 3,000,000  | 15%
// | 3,000,001 – 12,000,000  | 18%
// | 12,000,001 – 25,000,000 | 21%
// | 25,000,001 – 50,000,000 | 23%
// | Above 50,000,000     | 25%
export const NTA_2025_BANDS: readonly BandDefinition[] = [
  { lowerKobo: 0, upperKobo: 800_000 * NAIRA, rate: 0 },
  { lowerKobo: 800_000 * NAIRA, upperKobo: 3_000_000 * NAIRA, rate: 0.15 },
  { lowerKobo: 3_000_000 * NAIRA, upperKobo: 12_000_000 * NAIRA, rate: 0.18 },
  { lowerKobo: 12_000_000 * NAIRA, upperKobo: 25_000_000 * NAIRA, rate: 0.21 },
  { lowerKobo: 25_000_000 * NAIRA, upperKobo: 50_000_000 * NAIRA, rate: 0.23 },
  { lowerKobo: 50_000_000 * NAIRA, upperKobo: null, rate: 0.25 },
] as const;

/** Rent relief: 20% of annual rent paid, capped at ₦500,000. */
export const RENT_RELIEF_RATE = 0.2;
export const RENT_RELIEF_CAP_KOBO = 500_000 * NAIRA;

// ── Old PITA (for comparison) ───────────────────────────────────────────────
// Bands are cumulative tranches (First 300,000, Next 300,000, …).
export const PITA_OLD_BANDS: readonly BandDefinition[] = [
  { lowerKobo: 0, upperKobo: 300_000 * NAIRA, rate: 0.07 },
  { lowerKobo: 300_000 * NAIRA, upperKobo: 600_000 * NAIRA, rate: 0.11 },
  { lowerKobo: 600_000 * NAIRA, upperKobo: 1_100_000 * NAIRA, rate: 0.15 },
  { lowerKobo: 1_100_000 * NAIRA, upperKobo: 1_600_000 * NAIRA, rate: 0.19 },
  { lowerKobo: 1_600_000 * NAIRA, upperKobo: 3_200_000 * NAIRA, rate: 0.21 },
  { lowerKobo: 3_200_000 * NAIRA, upperKobo: null, rate: 0.24 },
] as const;

/** Old Consolidated Relief Allowance: ₦200,000 + 20% of gross income. */
export const CRA_FIXED_KOBO = 200_000 * NAIRA;
export const CRA_RATE = 0.2;
