export { apiClient, configureApiClient, createApiClient, _currentApiBaseUrl } from './client.js';
export { EP } from './endpoints.js';
export { ERROR_CODE, parseApiError } from './types/envelope.js';
export type { ApiError, ApiResponse, ErrorCode, ErrorType } from './types/envelope.js';

export { useHealth } from './hooks/use-health.js';
export type { HealthStatus } from './hooks/use-health.js';

export { useComputeTax } from './hooks/use-compute-tax.js';

export { useAskAi } from './hooks/use-ask-ai.js';
export type { AskAiPayload, AskAiResult, AiCitation } from './hooks/use-ask-ai.js';

export { useParseStatement } from './hooks/use-parse-statement.js';
export type { ParseStatementPayload, ParseStatementResult } from './hooks/use-parse-statement.js';

export { useStatementStatus } from './hooks/use-statement-status.js';

export { useRecomputeStatement } from './hooks/use-recompute-statement.js';
export type { RecomputePayload } from './hooks/use-recompute-statement.js';

export { subscribeStatementEvents } from './hooks/subscribe-statement-events.js';
export type { SubscribeHandlers } from './hooks/subscribe-statement-events.js';
