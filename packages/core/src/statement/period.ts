import type { PeriodConfidence } from '../types/index.js';

// Single source of truth for how months-of-statement maps to a confidence level.
// The annualised gross is an estimate scoped to the months uploaded; this drives
// the UI's confidence note (Fix B2). 0 / unknown months → low (can't trust ×N).
export const periodConfidenceFor = (monthsCovered: number | undefined): PeriodConfidence => {
  if (monthsCovered === undefined || monthsCovered <= 1) return 'low';
  if (monthsCovered >= 12) return 'high';
  return 'medium';
};
