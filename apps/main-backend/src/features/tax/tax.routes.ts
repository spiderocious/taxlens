import { compareRegimes, computeNta2025 } from '@taxlens/core';
import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

import { IncomeInputSchema } from './tax.schema.js';

const router: IRouter = Router();

// Module 2 — compute the NTA 2025 position only.
router.post(
  '/compute',
  asyncHandler(async (req, res) => {
    const input = IncomeInputSchema.parse(req.body);
    return ResponseUtil.ok(res, computeNta2025(input));
  }),
);

// Module 3 — compute both regimes + the comparison. The backend is the single
// authority for every number; the AI panel may only explain these (PRD).
router.post(
  '/compare',
  asyncHandler(async (req, res) => {
    const input = IncomeInputSchema.parse(req.body);
    return ResponseUtil.ok(res, compareRegimes(input));
  }),
);

export default router;
