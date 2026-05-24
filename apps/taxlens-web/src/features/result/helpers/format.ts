import { formatNaira } from '@taxlens/core';

/** Kobo → a naira figure string WITHOUT the ₦ symbol (Amount/StatTile add it). */
export function nairaValue(kobo: number, decimals = 0): string {
  return formatNaira(kobo, { withSymbol: false, decimals });
}

/** Kobo → a full "₦1,234,567" string for inline prose. */
export function naira(kobo: number, decimals = 0): string {
  return formatNaira(kobo, { withSymbol: true, decimals });
}

/** A 0–1 rate → a one-decimal percent string, e.g. 0.1684 → "16.8". */
export function ratePct(rate: number): string {
  return (rate * 100).toFixed(1);
}

/** A 0–1 band rate → a whole-number percent string, e.g. 0.15 → "15". */
export function bandRatePct(rate: number): string {
  return `${Math.round(rate * 100)}%`;
}
