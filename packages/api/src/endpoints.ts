// Single source of truth for backend URL paths. A rename touches one line here.
// TaxLens v1.5 is stateful — statement processes are keyed by an 8-digit code.
export const EP = {
  HEALTH: 'api/v1/health',

  // Module 2 + 3 — tax computation & regime comparison (stateless compute)
  TAX_COMPUTE: 'api/v1/tax/compute',
  TAX_COMPARE: 'api/v1/tax/compare',

  // Module 1 — bank-statement upload + parse (multipart). Returns a code.
  STATEMENT_PARSE: 'api/v1/statement/parse',
  // Poll / SSE by code. Call as functions: STATEMENT_BY_CODE('12345678').
  STATEMENT_BY_CODE: (code: string) => `api/v1/statement/${code}`,
  STATEMENT_EVENTS: (code: string) => `api/v1/statement/${code}/events`,
  // Recompute from the user's reclassified inflow selection (keeps AI grounded).
  STATEMENT_RECOMPUTE: (code: string) => `api/v1/statement/${code}/recompute`,

  // Module 4 — grounded AI follow-up
  AI_ASK: 'api/v1/ai/ask',
} as const;
