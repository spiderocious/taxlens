import type { IncomeInput } from '../types/index.js';

// The result page is addressable so a refresh can restore it. Three forms:
//   mock           → sample data, computed locally
//   manual?d=<b64> → manual input, base64url-encoded, recomputed locally
//   <8-digit code> → statement upload, refetched from the backend
//
// MANUAL_CODE / MOCK_CODE are the reserved non-numeric path segments; an 8-digit
// numeric segment is a real statement process code.

export const MOCK_CODE = 'mock';
export const MANUAL_CODE = 'manual';

/** True for a real statement process code (exactly 8 digits). */
export const isStatementCode = (code: string): boolean => /^\d{8}$/.test(code);

// ── base64url (URL-safe, no padding) — works in browser and Node ──────────────
const toBase64Url = (s: string): string => {
  const b64 =
    typeof btoa === 'function'
      ? btoa(unescape(encodeURIComponent(s)))
      : Buffer.from(s, 'utf-8').toString('base64');
  return b64.replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '');
};

const fromBase64Url = (s: string): string => {
  const b64 = s.replace(/-/g, '+').replace(/_/g, '/');
  const decoded =
    typeof atob === 'function'
      ? decodeURIComponent(escape(atob(b64)))
      : Buffer.from(b64, 'base64').toString('utf-8');
  return decoded;
};

/** Encode a manual IncomeInput for the `?d=` query (kobo integers, lossless). */
export const encodeManualInput = (input: IncomeInput): string => toBase64Url(JSON.stringify(input));

/** Decode `?d=` back to an IncomeInput. Returns null if absent/corrupt — the
 *  caller shows the empty state rather than crashing on a hand-edited URL. */
export const decodeManualInput = (raw: string | null | undefined): IncomeInput | null => {
  if (!raw) return null;
  try {
    const parsed: unknown = JSON.parse(fromBase64Url(raw));
    if (
      parsed !== null &&
      typeof parsed === 'object' &&
      'grossAnnualKobo' in parsed &&
      'reliefs' in parsed &&
      'profileType' in parsed
    ) {
      return parsed as IncomeInput;
    }
    return null;
  } catch {
    return null;
  }
};

// ── path builders ─────────────────────────────────────────────────────────────
export const resultPath = {
  mock: (): string => `/result/${MOCK_CODE}`,
  manual: (input: IncomeInput): string => `/result/${MANUAL_CODE}?d=${encodeManualInput(input)}`,
  statement: (code: string): string => `/result/${code}`,
};
