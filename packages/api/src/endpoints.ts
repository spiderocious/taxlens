// Single source of truth for backend URL paths. Apps reach the server through
// the named constants here so a rename touches one line, not dozens.
// TaxLens v1 is stateless — no auth, no persisted user data.
export const EP = {
  HEALTH: 'api/v1/health',

  // Module 2 + 3 — tax computation & regime comparison (stateless)
  TAX_COMPUTE: 'api/v1/tax/compute',
  TAX_COMPARE: 'api/v1/tax/compare',

  // Module 1 — bank-statement extraction (upload path)
  STATEMENT_PARSE: 'api/v1/statement/parse',

  // Module 4 — grounded AI follow-up
  AI_ASK: 'api/v1/ai/ask',
} as const;
