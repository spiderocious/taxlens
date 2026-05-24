import { compareRegimes, type ProfileType, type StatementInflow } from '@taxlens/core';
import { z } from 'zod';

import { UpstreamUnavailableError } from '@lib/errors.js';
import { llmClient } from '@lib/llm/openai-client.js';
import { logger } from '@lib/logger.js';
import { taxProcessRepository, type TaxProcessDoc } from '@lib/mongo/tax-process.repository.js';

import { env } from '../../env.js';

import { statementEvents } from './statement.events.js';

// ── Tier-1 gate (cheap model) — is this a real, usable Nigerian bank statement?
const GateVerdictSchema = z.object({
  valid: z.boolean(),
  bankName: z.string(),
  monthsCovered: z.number().int().nonnegative(),
  reason: z.string(), // why invalid, when valid=false; "" otherwise
});

// ── Tier-2 analysis (better model) — extract + classify inflows, derive gross.
const InflowSchema = z.object({
  date: z.string(),
  description: z.string(),
  amountKobo: z.number().int().nonnegative(),
  classification: z.enum(['salary', 'business', 'transfer', 'other']),
});
const AnalysisSchema = z.object({
  inflows: z.array(InflowSchema),
  grossAnnualKobo: z.number().int().nonnegative(),
});

const GATE_SYSTEM = `You are a document validator for a Nigerian personal-income-tax tool.
Decide whether the attached PDF is a genuine, legible Nigerian bank statement that could
be used to estimate annual income. Identify the bank and how many months it covers.
If it is NOT a usable Nigerian bank statement (wrong document type, illegible, foreign
bank, blank), set valid=false and give a short reason. Be strict — this gate exists to
avoid wasting an expensive analysis call on unusable input.`;

const ANALYSIS_SYSTEM = `You are a financial-statement analyst for a Nigerian personal-income-tax tool.
From the attached bank statement, extract every credit/inflow. For each, give the date
(ISO 8601), a short description, the amount in KOBO (naira × 100, integer), and a
classification: "salary" (regular employment income), "business" (self-employed/trade
income), "transfer" (peer transfers, refunds, reversals), or "other".
Then estimate grossAnnualKobo: annualise the income-bearing inflows (salary + business)
to a full-year figure in kobo. Exclude transfers and other. Amounts are integer kobo.
Do not compute any tax — only extract and annualise income.`;

// Builds the public view from a doc (re-exported repo helper, kept local for
// the event payload).
const viewOf = (doc: TaxProcessDoc) => taxProcessRepository.toView(doc);

const emit = (doc: TaxProcessDoc | null): void => {
  if (doc) statementEvents.emitUpdate(doc.code, viewOf(doc));
};

export const statementService = {
  // Creates the process and returns its code immediately. The caller starts the
  // pipeline (fire-and-forget) and returns 202 to the client.
  async createProcess(profileType: ProfileType): Promise<TaxProcessDoc> {
    return taxProcessRepository.create(profileType);
  },

  // The pipeline. Runs in-process, NOT awaited by the route handler. Every
  // transition is persisted (durable for pollers) and emitted (live for SSE).
  async runPipeline(code: string, pdfBase64: string, filename: string): Promise<void> {
    try {
      // ── tier 1: gate ──────────────────────────────────────────────────────
      emit(await taxProcessRepository.advance(code, 'validating'));

      const gate = await llmClient.structured({
        tier: 'gate',
        code,
        model: env.OPENAI_GATE_MODEL,
        system: GATE_SYSTEM,
        user: 'Validate this bank statement.',
        pdf: { filename, base64: pdfBase64 },
        schema: GateVerdictSchema,
        schemaName: 'gate_verdict',
      });

      if (!gate.data.valid) {
        emit(
          await taxProcessRepository.advance(code, 'failed', {
            failureReason: gate.data.reason || 'Not a usable Nigerian bank statement',
            gateResponseId: gate.responseId,
          }),
        );
        return;
      }

      // ── tier 2: analysis ──────────────────────────────────────────────────
      emit(
        await taxProcessRepository.advance(code, 'analyzing', {
          bankName: gate.data.bankName,
          monthsCovered: gate.data.monthsCovered,
          gateResponseId: gate.responseId,
        }),
      );

      const analysis = await llmClient.structured({
        tier: 'analysis',
        code,
        model: env.OPENAI_ANALYSIS_MODEL,
        system: ANALYSIS_SYSTEM,
        user: 'Extract and classify the inflows, then annualise income.',
        pdf: { filename, base64: pdfBase64 },
        schema: AnalysisSchema,
        previousResponseId: gate.responseId,
        schemaName: 'statement_analysis',
      });

      const inflows: StatementInflow[] = analysis.data.inflows.map((f, i) => ({
        id: `inflow_${i}`,
        date: f.date,
        description: f.description,
        amountKobo: f.amountKobo,
        classification: f.classification,
      }));

      // ── tax engine — the single authority for every number (PRD) ──────────
      const process = await taxProcessRepository.findByCode(code);
      const profileType = process?.profileType ?? 'salary_earner';
      const computation = compareRegimes({
        profileType,
        grossAnnualKobo: analysis.data.grossAnnualKobo,
        // Reliefs aren't in the statement; the user adds them on the result
        // screen, which re-computes via /tax/compare. Start at zero.
        reliefs: {
          annualRentKobo: 0,
          pensionKobo: 0,
          nhisKobo: 0,
          nhfKobo: 0,
          lifeInsuranceKobo: 0,
        },
      });

      emit(
        await taxProcessRepository.advance(code, 'ready', {
          inflows,
          grossAnnualKobo: analysis.data.grossAnnualKobo,
          computation,
          analysisResponseId: analysis.responseId,
        }),
      );
    } catch (err) {
      const reason =
        err instanceof UpstreamUnavailableError
          ? 'AI service temporarily unavailable — please try again'
          : 'We could not process this statement';
      logger.error({ err, code }, 'statement pipeline failed');
      try {
        emit(await taxProcessRepository.advance(code, 'failed', { failureReason: reason }));
      } catch (advanceErr) {
        // Process may already be terminal (e.g. raced to failed). Log and move on.
        logger.warn({ err: advanceErr, code }, 'could not mark process failed');
      }
    }
  },
};
