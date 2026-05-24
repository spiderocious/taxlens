import type { RequestHandler } from 'express';
import multer from 'multer';

import { env } from '../../env.js';

// Memory storage — the PDF buffer lives only in RAM during the parse and is
// never written to disk (PII). multer enforces the size cap; the fileFilter
// rejects non-PDFs before the buffer is even read into memory fully.
export const statementUpload: RequestHandler = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: env.STATEMENT_MAX_BYTES, files: 1 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype === 'application/pdf') {
      cb(null, true);
      return;
    }
    // Reject with a multer-style error so the central handler maps it to a
    // validation error on the `file` field.
    cb(new multer.MulterError('LIMIT_UNEXPECTED_FILE', 'file'));
  },
}).single('file');
