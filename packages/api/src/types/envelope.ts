// Mirrors the backend response envelope (lib/response.ts on main-backend).
// Success → { data, meta? }. Error → FLAT { errorCode, errorMessage, type, field? }.
// Clients switch on the numeric `errorCode`, never on `errorMessage`.

// Numeric error codes (1001–1009). Keep in sync with the backend's ERROR_CODE.
export const ERROR_CODE = {
  VALIDATION: 1001,
  UNAUTHORIZED: 1002,
  FORBIDDEN: 1003,
  NOT_FOUND: 1004,
  CONFLICT: 1005,
  RATE_LIMITED: 1006,
  UPSTREAM_UNAVAILABLE: 1007,
  PROCESSING_FAILED: 1008,
  INTERNAL: 1009,
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

export type ErrorType =
  | 'validation_error'
  | 'auth_error'
  | 'not_found_error'
  | 'conflict_error'
  | 'rate_limit_error'
  | 'upstream_error'
  | 'processing_error'
  | 'server_error'
  | 'internal_error';

export interface ApiError {
  errorCode: ErrorCode;
  errorMessage: string;
  type: ErrorType;
  /** Validation only: the single field currently in error (one at a time). */
  field?: string;
}

export interface ApiResponse<T> {
  data: T;
  meta?: Record<string, unknown>;
}

// The flat error IS the body — no `error` wrapper.
export const parseApiError = (raw: unknown): ApiError => {
  if (raw && typeof raw === 'object' && 'errorCode' in raw && 'errorMessage' in raw) {
    const e = raw as Record<string, unknown>;
    if (typeof e['errorCode'] === 'number' && typeof e['errorMessage'] === 'string') {
      return {
        errorCode: e['errorCode'] as ErrorCode,
        errorMessage: e['errorMessage'] as string,
        type: (e['type'] as ErrorType) ?? 'internal_error',
        ...(typeof e['field'] === 'string' ? { field: e['field'] } : {}),
      };
    }
  }
  return { errorCode: ERROR_CODE.INTERNAL, errorMessage: 'Something went wrong', type: 'internal_error' };
};
