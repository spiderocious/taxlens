// Centralised route table. Apps import from here so route strings have
// exactly one source of truth. TaxLens v1 is a single visitor-facing tool —
// no auth, no accounts (see docs/product/mvp.md).
export const ROUTES = {
  // Entry — choose an input path (sample / manual / upload)
  HOME: '/',

  // Module 1 — Income input
  INCOME: '/income',

  // Module 2 + 3 — Tax position result + "what changed for you".
  // The result is addressable so a refresh restores it (see resultPath):
  //   /result/mock          — sample data, computed locally (no API)
  //   /result/manual?d=…     — manual input, base64-encoded, recomputed locally
  //   /result/<8-digit code> — statement upload, refetched from the backend
  RESULT: '/result',
  /** Route pattern for the router (react-router :param form). */
  RESULT_PATTERN: '/result/:code',

  // Module 5 — Writeup & about
  HOW_IT_WORKS: '/how-it-works',
  ABOUT: '/about',

  // Internal — design-system preview (storybook-lite)
  PREVIEW: '/preview',
} as const;
