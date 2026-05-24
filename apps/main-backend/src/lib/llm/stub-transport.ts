import { UpstreamUnavailableError } from '@lib/errors.js';

import { env } from '../../env.js';

import type { StructuredCallParams, Transport, TransportResult } from './openai-client.js';

// Deterministic, steerable in-process fake for tests/CI. Same TransportResult
// shape as the real OpenAI transport, so it runs through the identical breaker +
// audit + schema-validation shell in openai-client.ts. NEVER reachable in prod
// (env.ts rejects LLM_MODE=stub there). See llm-stub-seam-spec.md.
//
// Steering (in priority order):
//  1. LLM_STUB_UNCONFIGURED         → every call throws (simulates missing key → 503/1007)
//  2. LLM_STUB_FAIL_TIMES = N       → the next N calls throw (trip the breaker), then succeed
//  3. PDF filename convention       → reject.pdf (gate invalid) | fail.pdf (throws)
//  4. chat: "VAT" in question, or LLM_STUB_CHAT=refuse → refused:true
//  5. otherwise                     → happy-path defaults per tier

// Module-level countdown so LLM_STUB_FAIL_TIMES forces a *sequence* of failures
// across calls (needed to drive consecutive-failure → open transitions).
let forcedFailuresRemaining = env.LLM_STUB_FAIL_TIMES;

// Test-only reset so a suite can re-seed the countdown between cases without a
// process restart.
export const __resetStub = (failTimes = env.LLM_STUB_FAIL_TIMES): void => {
  forcedFailuresRemaining = failTimes;
};

const GATE_HAPPY = { valid: true, bankName: 'Kuda MFB', monthsCovered: 6, reason: '' };
const GATE_REJECT = {
  valid: false,
  bankName: '',
  monthsCovered: 0,
  reason: 'Not a usable Nigerian bank statement',
};

// A fixed, known analysis result so tests can assert exact inflows + gross.
const ANALYSIS_HAPPY = {
  inflows: [
    { date: '2026-01-31', description: 'SALARY JAN', amountKobo: 125_000_000, classification: 'salary' },
    { date: '2026-02-28', description: 'SALARY FEB', amountKobo: 125_000_000, classification: 'salary' },
  ],
  grossAnnualKobo: 1_500_000_000,
};

const CHAT_ANSWER = {
  answer:
    'Your first ₦800,000 of taxable income is taxed at 0% under the NTA 2025 Fourth Schedule, ' +
    'which lowers your effective rate. This explanation uses only the figures already computed.',
  citations: [{ section: 'NTA 2025, Fourth Schedule', snippet: 'Income up to ₦800,000 — 0%' }],
  refused: false,
};

const CHAT_REFUSE = {
  answer:
    'I can only help with personal income tax under the NTA 2025. For VAT or company tax, ' +
    'please consult a tax professional.',
  citations: [],
  refused: true,
};

const result = (parsed: unknown, tier: string, code: string): TransportResult => ({
  parsed,
  responseId: `stub_${tier}_${code}`,
  inputTokens: 0,
  outputTokens: 0,
});

export const stubInvoke: Transport = <T>(
  params: StructuredCallParams<T>,
): Promise<TransportResult> => {
  const { tier, code, pdf, user, previousResponseId } = params;

  // 1. Unconfigured — behave like a missing key on every call.
  if (env.LLM_STUB_UNCONFIGURED) {
    return Promise.reject(new UpstreamUnavailableError('AI is not configured (stub: unconfigured)'));
  }

  // 2. Forced failure sequence — drives the circuit breaker.
  if (forcedFailuresRemaining > 0) {
    forcedFailuresRemaining -= 1;
    return Promise.reject(new UpstreamUnavailableError('stub: forced upstream failure'));
  }

  // 3. Filename convention (gate/analysis run with the uploaded PDF attached).
  const filename = pdf?.filename ?? '';
  if (filename === 'fail.pdf') {
    return Promise.reject(new UpstreamUnavailableError('stub: forced upstream failure (fail.pdf)'));
  }

  if (tier === 'gate') {
    const verdict = filename === 'reject.pdf' ? GATE_REJECT : GATE_HAPPY;
    return Promise.resolve(result(verdict, tier, code));
  }

  if (tier === 'analysis') {
    return Promise.resolve(result(ANALYSIS_HAPPY, tier, code));
  }

  // 4. Chat — refuse on "VAT"/out-of-scope marker or via env.
  const wantsRefuse = env.LLM_STUB_CHAT === 'refuse' || /\bvat\b/i.test(user);
  const answer = wantsRefuse ? CHAT_REFUSE : CHAT_ANSWER;
  // Thread continuity: a real chat turn continues from the analysis turn. We
  // echo that the previousResponseId arrived by encoding it in the new id so a
  // test can assert the chain (ai.service passes analysisResponseId here).
  const chained = previousResponseId ? `stub_chat_${code}_from_${previousResponseId}` : `stub_chat_${code}`;
  return Promise.resolve({ parsed: answer, responseId: chained, inputTokens: 0, outputTokens: 0 });
};
