// Routing
export { ROUTES } from './constants/routes.js';

// Domain types
export * from './types/index.js';

// Tax engine — NTA 2025 bands/reliefs + pure computation
export {
  NTA_2025_BANDS,
  PITA_OLD_BANDS,
  RENT_RELIEF_RATE,
  RENT_RELIEF_CAP_KOBO,
  CRA_FIXED_KOBO,
  CRA_RATE,
} from './tax/bands.js';
export type { BandDefinition } from './tax/bands.js';
export { computeNta2025, computePitaOld, compareRegimes } from './tax/compute.js';

// Statement domain helpers
export { periodConfidenceFor } from './statement/period.js';

// Result addressing — makes /result restorable on refresh
export {
  resultPath,
  encodeManualInput,
  decodeManualInput,
  isStatementCode,
  MOCK_CODE,
  MANUAL_CODE,
} from './result/result-link.js';

// Helpers
export { formatNaira, parseNairaToKobo } from './money/format-naira.js';
export type { FormatNairaOptions } from './money/format-naira.js';
export { formatRelative } from './time/format-relative.js';
export { idempotencyKey } from './ids/idempotency-key.js';
