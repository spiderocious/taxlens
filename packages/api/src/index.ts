export { apiClient, configureApiClient, createApiClient } from './client.js';
export { EP } from './endpoints.js';
export type { ApiError, ApiErrorResponse, ApiResponse } from './types/envelope.js';
export { parseApiError } from './types/envelope.js';

export { useHealth } from './hooks/use-health.js';
export type { HealthStatus } from './hooks/use-health.js';
export { useComputeTax } from './hooks/use-compute-tax.js';
export { useAskAi } from './hooks/use-ask-ai.js';
export type { AskAiPayload, AskAiResult, AiCitation } from './hooks/use-ask-ai.js';
