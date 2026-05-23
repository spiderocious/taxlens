import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

import { AskAiSchema } from './ai.schema.js';

const router: IRouter = Router();

const DISCLAIMER =
  'This is an estimate, not tax advice. For complex situations, consult a tax professional.';

// Module 4 — stub. Real implementation: a guarded LLM call that (1) refuses
// out-of-scope queries, (2) cites the relevant NTA 2025 section, (3) never
// invents a number the calculator did not produce. Contract fixed here.
router.post(
  '/ask',
  asyncHandler(async (req, res) => {
    AskAiSchema.parse(req.body);
    return ResponseUtil.ok(res, {
      answer: 'The grounded AI panel is not yet wired up.',
      citations: [],
      refused: false,
      disclaimer: DISCLAIMER,
    });
  }),
);

export default router;
