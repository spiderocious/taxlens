import { Router, type IRouter } from 'express';

import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';

import { aiService } from './ai.service.js';
import { AskAiSchema } from './ai.schema.js';

const router: IRouter = Router();

// Module 4 — grounded follow-up. Body { code, question }. The server holds the
// computed context (keyed by code) and continues the OpenAI conversation from
// the analysis turn. Scope-guard, citations, and the no-invented-numbers rule
// are enforced in the system prompt; missing-key / circuit-open surface as 503.
router.post(
  '/ask',
  asyncHandler(async (req, res) => {
    const { code, question } = AskAiSchema.parse(req.body);
    const result = await aiService.ask(code, question);
    return ResponseUtil.ok(res, result);
  }),
);

export default router;
