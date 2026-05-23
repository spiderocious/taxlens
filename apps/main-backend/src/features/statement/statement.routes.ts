import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

import { ParseStatementSchema } from './statement.schema.js';

const router: IRouter = Router();

// Module 1 (upload path) — stub. Real implementation: parse the PDF, extract
// inflows, classify each (salary / business / transfer / other), return them
// for the user to confirm before compute. Contract is fixed; logic is TODO.
router.post(
  '/parse',
  asyncHandler(async (req, res) => {
    ParseStatementSchema.parse(req.body);
    return ResponseUtil.accepted(res, {
      inflows: [],
      note: 'statement parsing not yet implemented — confirm/correct flow TBD',
    });
  }),
);

export default router;
