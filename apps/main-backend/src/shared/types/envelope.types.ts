import type { ErrorCode, ErrorType } from '../constants/error-codes.js';

// Flat error envelope. No nesting, no field_errors map — validation surfaces
// ONE field at a time (see errorHandler). Clients switch on `errorCode`.
export interface ApiError {
  errorCode: ErrorCode;
  errorMessage: string;
  type: ErrorType;
  // For validation errors only: the single field currently in error, so the
  // client can highlight it. One field at a time even if several are invalid.
  field?: string;
}

// Success envelope is unchanged: { data, meta? }.
export interface ApiSuccess<T> {
  data: T;
  meta?: Record<string, unknown>;
}
