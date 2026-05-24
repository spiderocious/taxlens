import type { StatementProcessView } from '@taxlens/core';
import { Router, type IRouter } from 'express';

import { NotFoundError, ValidationError } from '@lib/errors.js';
import { asyncHandler } from '@lib/http/asyncHandler.js';
import { ResponseUtil } from '@lib/response.js';
import { taxProcessRepository } from '@lib/mongo/tax-process.repository.js';

import { CodeParamSchema, ParseStatementSchema } from './statement.schema.js';
import { statementEvents } from './statement.events.js';
import { statementService } from './statement.service.js';
import { statementUpload } from './statement.upload.js';

const router: IRouter = Router();

const TERMINAL: ReadonlySet<StatementProcessView['status']> = new Set(['ready', 'failed']);

// POST /api/v1/statement/parse — multipart: file (PDF) + profileType.
// Returns the 8-digit code immediately (202); the pipeline runs in-process.
router.post(
  '/parse',
  statementUpload,
  asyncHandler(async (req, res) => {
    const { profileType } = ParseStatementSchema.parse(req.body);
    const file = req.file;
    if (!file) {
      // multipart present but no file field — surface as a single-field error.
      throw new ValidationError('file: a PDF file is required', 'file');
    }

    const process = await statementService.createProcess(profileType);

    // Fire-and-forget. Convert the buffer to base64 once, here, so the request
    // buffer can be GC'd. Not awaited — the handler returns the code now.
    const pdfBase64 = file.buffer.toString('base64');
    void statementService.runPipeline(process.code, pdfBase64, file.originalname || 'statement.pdf');

    return ResponseUtil.accepted(res, { code: process.code, status: process.status });
  }),
);

// GET /api/v1/statement/:code/events — SSE stream of status changes.
// Registered BEFORE the bare :code route so it isn't swallowed.
router.get(
  '/:code/events',
  asyncHandler(async (req, res) => {
    const { code } = CodeParamSchema.parse(req.params);
    const current = await taxProcessRepository.findByCode(code);
    if (!current) throw new NotFoundError('Process');

    await taxProcessRepository.touch(code);

    // SSE handshake. This endpoint deliberately bypasses ResponseUtil — the
    // JSON envelope does not apply to an event stream (documented exception).
    res.writeHead(200, {
      'Content-Type': 'text/event-stream',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      'X-Accel-Buffering': 'no', // disable proxy buffering (nginx)
    });
    res.flushHeaders();

    const send = (view: StatementProcessView): void => {
      res.write(`event: status\ndata: ${JSON.stringify(view)}\n\n`);
    };

    // Emit the current state immediately so a late subscriber is in sync.
    send(taxProcessRepository.toView(current));
    if (TERMINAL.has(current.status)) {
      res.end();
      return;
    }

    const unsubscribe = statementEvents.onUpdate(code, (view) => {
      send(view);
      if (TERMINAL.has(view.status)) {
        cleanup();
        res.end();
      }
    });

    // Heartbeat so proxies don't drop the idle connection.
    const heartbeat = setInterval(() => res.write(': ping\n\n'), 15_000);

    const cleanup = (): void => {
      clearInterval(heartbeat);
      unsubscribe();
    };

    req.on('close', cleanup);
  }),
);

// GET /api/v1/statement/:code — poll fallback. Durable source of truth.
router.get(
  '/:code',
  asyncHandler(async (req, res) => {
    const { code } = CodeParamSchema.parse(req.params);
    const doc = await taxProcessRepository.findByCode(code);
    if (!doc) throw new NotFoundError('Process');
    await taxProcessRepository.touch(code);
    return ResponseUtil.ok(res, taxProcessRepository.toView(doc));
  }),
);

export default router;
