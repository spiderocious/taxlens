import { ERROR_CODE, ERROR_TYPE, type ErrorCode, type ErrorType } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http-status.js';

// Domain errors carry the numeric `errorCode`, the classifying `type`, an HTTP
// status, and (for validation) the single field in error. The central handler
// translates these into the flat envelope.
export class AppError extends Error {
  public readonly retryAfter?: number;
  public readonly field?: string;

  constructor(
    public readonly errorCode: ErrorCode,
    public readonly type: ErrorType,
    message: string,
    public readonly status: number = HTTP_STATUS.BAD_REQUEST,
    options: { field?: string; retryAfter?: number } = {},
  ) {
    super(message);
    this.name = 'AppError';
    if (options.field !== undefined) this.field = options.field;
    if (options.retryAfter !== undefined) this.retryAfter = options.retryAfter;
    Error.captureStackTrace(this, this.constructor);
  }
}

// One field at a time: a ValidationError names exactly one offending field,
// even when several are wrong. The client resolves it, retries, and the next
// field's error surfaces. See errorHandler for how ZodError is reduced to one.
export class ValidationError extends AppError {
  constructor(message: string, field?: string) {
    super(ERROR_CODE.VALIDATION, ERROR_TYPE.VALIDATION, message, HTTP_STATUS.BAD_REQUEST, {
      ...(field !== undefined ? { field } : {}),
    });
    this.name = 'ValidationError';
  }
}

export class NotFoundError extends AppError {
  constructor(resource = 'Resource') {
    super(ERROR_CODE.NOT_FOUND, ERROR_TYPE.NOT_FOUND, `${resource} not found`, HTTP_STATUS.NOT_FOUND);
    this.name = 'NotFoundError';
  }
}

export class ConflictError extends AppError {
  constructor(message: string) {
    super(ERROR_CODE.CONFLICT, ERROR_TYPE.CONFLICT, message, HTTP_STATUS.CONFLICT);
    this.name = 'ConflictError';
  }
}

export class RateLimitedError extends AppError {
  constructor(message = 'Too many requests', retryAfter?: number) {
    super(ERROR_CODE.RATE_LIMITED, ERROR_TYPE.RATE_LIMIT, message, HTTP_STATUS.TOO_MANY_REQUESTS, {
      ...(retryAfter !== undefined ? { retryAfter } : {}),
    });
    this.name = 'RateLimitedError';
  }
}

// A dependency is unavailable (OpenAI down, circuit open, Mongo unreachable).
export class UpstreamUnavailableError extends AppError {
  constructor(message = 'A required service is temporarily unavailable', retryAfter?: number) {
    super(
      ERROR_CODE.UPSTREAM_UNAVAILABLE,
      ERROR_TYPE.UPSTREAM,
      message,
      HTTP_STATUS.SERVICE_UNAVAILABLE,
      { ...(retryAfter !== undefined ? { retryAfter } : {}) },
    );
    this.name = 'UpstreamUnavailableError';
  }
}

// A pipeline/job ran but failed for a domain reason (e.g. not a valid statement).
export class ProcessingError extends AppError {
  constructor(message: string, status: number = HTTP_STATUS.UNPROCESSABLE_ENTITY) {
    super(ERROR_CODE.PROCESSING_FAILED, ERROR_TYPE.PROCESSING, message, status);
    this.name = 'ProcessingError';
  }
}
