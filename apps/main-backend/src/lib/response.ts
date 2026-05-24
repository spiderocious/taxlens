import type { Response } from 'express';

import type { ApiError, ApiSuccess } from '@shared/types/envelope.types.js';

// Success → { data, meta? }. Error → flat { errorCode, errorMessage, type, field? }.
export class ResponseUtil {
  static ok<T>(res: Response, data: T, meta?: Record<string, unknown>): Response {
    const body: ApiSuccess<T> = meta ? { data, meta } : { data };
    return res.status(200).json(body);
  }

  static created<T>(res: Response, data: T): Response {
    return res.status(201).json({ data } satisfies ApiSuccess<T>);
  }

  static accepted<T>(res: Response, data: T): Response {
    return res.status(202).json({ data } satisfies ApiSuccess<T>);
  }

  static noContent(res: Response): Response {
    return res.status(204).end();
  }

  static error(res: Response, status: number, err: ApiError): Response {
    return res.status(status).json(err);
  }
}
