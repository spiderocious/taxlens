import type { Request, Response, NextFunction } from 'express';
import { MulterError } from 'multer';
import { ZodError, type ZodIssue } from 'zod';

import { AppError } from '@lib/errors.js';
import { requestContext } from '@lib/http/requestContext.js';
import { logger } from '@lib/logger.js';
import { ResponseUtil } from '@lib/response.js';
import { ERROR_CODE, ERROR_TYPE } from '@shared/constants/error-codes.js';
import { HTTP_STATUS } from '@shared/constants/http-status.js';

// One field at a time. Even when several fields are invalid, surface exactly
// one — the user resolves it, retries, and the next error appears. We pick the
// first issue by a stable order (shallowest path, then alphabetical) so the
// sequence is deterministic across requests.
const pickSingleIssue = (err: ZodError): ZodIssue | undefined => {
  const issues = [...err.issues];
  if (issues.length === 0) return undefined;
  issues.sort((a, b) => {
    if (a.path.length !== b.path.length) return a.path.length - b.path.length;
    return a.path.join('.').localeCompare(b.path.join('.'));
  });
  return issues[0];
};

const fieldOf = (issue: ZodIssue): string => issue.path.join('.') || '_root';

// Compose a focused, human message for the single field. Zod's default message
// is decent; we prefix the field so the UI can show it standalone.
const messageFor = (issue: ZodIssue): string => {
  const field = fieldOf(issue);
  if (field === '_root') return issue.message;
  return `${field}: ${issue.message}`;
};

export const errorHandler = (
  err: unknown,
  _req: Request,
  res: Response,
  _next: NextFunction,
): void => {
  const requestId = requestContext.getRequestId();

  if (err instanceof AppError) {
    if (err.status >= 500) logger.error({ err, requestId }, err.message);
    if (err.retryAfter !== undefined) res.setHeader('Retry-After', err.retryAfter);
    ResponseUtil.error(res, err.status, {
      errorCode: err.errorCode,
      errorMessage: err.message,
      type: err.type,
      ...(err.field !== undefined ? { field: err.field } : {}),
    });
    return;
  }

  if (err instanceof ZodError) {
    const issue = pickSingleIssue(err);
    ResponseUtil.error(res, HTTP_STATUS.BAD_REQUEST, {
      errorCode: ERROR_CODE.VALIDATION,
      errorMessage: issue ? messageFor(issue) : 'Validation failed',
      type: ERROR_TYPE.VALIDATION,
      ...(issue ? { field: fieldOf(issue) } : {}),
    });
    return;
  }

  // multer rejects oversized / malformed uploads before our handler runs.
  if (err instanceof MulterError) {
    const isSize = err.code === 'LIMIT_FILE_SIZE';
    ResponseUtil.error(res, HTTP_STATUS.BAD_REQUEST, {
      errorCode: ERROR_CODE.VALIDATION,
      errorMessage: isSize ? 'file: exceeds the maximum allowed size' : `file: ${err.message}`,
      type: ERROR_TYPE.VALIDATION,
      field: 'file',
    });
    return;
  }

  logger.error({ err, requestId }, 'Unhandled error');
  ResponseUtil.error(res, HTTP_STATUS.INTERNAL_SERVER_ERROR, {
    errorCode: ERROR_CODE.INTERNAL,
    errorMessage: 'An unexpected error occurred',
    type: ERROR_TYPE.INTERNAL,
  });
};
