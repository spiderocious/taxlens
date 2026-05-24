// Numeric error codes (1001–1009) returned in the flat error envelope as
// `errorCode`. 1001 is request/payload validation; 1009 is the catch-all for
// extreme, unreconcilable failures. Clients switch on the numeric code — it is
// stable, the message text is not.
export const ERROR_CODE = {
  VALIDATION: 1001, // payload / request validation failed
  UNAUTHORIZED: 1002, // missing or invalid auth (unused in v1.5, reserved)
  FORBIDDEN: 1003, // authenticated but not permitted (reserved)
  NOT_FOUND: 1004, // resource does not exist
  CONFLICT: 1005, // state conflict (duplicate, already exists)
  RATE_LIMITED: 1006, // too many requests
  UPSTREAM_UNAVAILABLE: 1007, // a dependency (OpenAI, Mongo) is down / circuit open
  PROCESSING_FAILED: 1008, // a job/pipeline ran but failed for a domain reason
  INTERNAL: 1009, // extreme, unreconcilable error — never leak internals
} as const;

export type ErrorCode = (typeof ERROR_CODE)[keyof typeof ERROR_CODE];

// `type` classifies the error for the client. Kept as a small closed union.
export const ERROR_TYPE = {
  VALIDATION: 'validation_error',
  AUTH: 'auth_error',
  NOT_FOUND: 'not_found_error',
  CONFLICT: 'conflict_error',
  RATE_LIMIT: 'rate_limit_error',
  UPSTREAM: 'upstream_error',
  PROCESSING: 'processing_error',
  SERVER: 'server_error',
  INTERNAL: 'internal_error',
} as const;

export type ErrorType = (typeof ERROR_TYPE)[keyof typeof ERROR_TYPE];
