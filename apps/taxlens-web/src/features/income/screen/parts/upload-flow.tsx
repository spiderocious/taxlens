import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Show } from 'meemaw';

import type { ProcessStatus, ProfileType, StatementProcessView } from '@taxlens/core';
import { ROUTES } from '@taxlens/core';
import {
  parseApiError,
  subscribeStatementEvents,
  useParseStatement,
  useStatementStatus,
} from '@taxlens/api';
import { AppButton, AppText, ErrorState, Stepper } from '@taxlens/ui';

import { useIncomeContext } from '../../providers/income-provider.tsx';
import { StatementDropzone } from './statement-dropzone.tsx';
import { InflowsConfirm } from './inflows-confirm.tsx';

interface UploadFlowProps {
  readonly profileType: ProfileType;
}

const PIPELINE_STEPS = [
  { label: 'Uploaded' },
  { label: 'Checking statement' },
  { label: 'Reading inflows' },
  { label: 'Ready' },
];

const STATUS_STEP: Record<ProcessStatus, number> = {
  pending: 0,
  validating: 1,
  analyzing: 2,
  ready: 3,
  needs_review: 3, // analysis done — sits on the confirm step like ready
  failed: 0,
};

// Module 1 (upload path). Upload → 8-digit code → live pipeline (SSE, with the
// poll hook as the durable fallback) → confirm the extracted inflows → result.
// The backend computes the numbers during the pipeline; the inflows table is a
// transparency/confirmation view of what it used (see InflowsConfirm).
export function UploadFlow({ profileType }: UploadFlowProps) {
  const navigate = useNavigate();
  const { setResult } = useIncomeContext();
  const parse = useParseStatement();
  const [code, setCode] = useState<string | null>(null);
  const [sseView, setSseView] = useState<StatementProcessView | null>(null);
  const [uploadError, setUploadError] = useState<string | null>(null);

  // Poll is the durable fallback; SSE provides the live push.
  const poll = useStatementStatus(code, code !== null);

  useEffect(() => {
    if (code === null) return undefined;
    return subscribeStatementEvents(code, { onStatus: setSseView });
  }, [code]);

  // SSE wins when present (it's the live source); poll backfills.
  const view = sseView ?? poll.data ?? null;

  function handleFile(file: File) {
    setUploadError(null);
    setSseView(null);
    parse.mutate(
      { file, profileType },
      {
        onSuccess: (res) => setCode(res.code),
        onError: async (err) => {
          const body =
            err instanceof Error && 'response' in err
              ? await (err as unknown as { response: Response }).response.json().catch(() => null)
              : null;
          setUploadError(parseApiError(body).errorMessage);
        },
      },
    );
  }

  function proceedToResult(v: StatementProcessView) {
    if (!v.computation) return;
    setResult({
      comparison: v.computation,
      source: 'statement',
      statementCode: v.code,
      // Carry the period framing so the result can show a confidence note (B2)
      // and the period-scoped line (B3) — these only apply to statement uploads.
      ...(v.monthsCovered !== undefined ? { monthsCovered: v.monthsCovered } : {}),
      ...(v.periodConfidence !== undefined ? { periodConfidence: v.periodConfidence } : {}),
    });
    navigate(ROUTES.RESULT);
  }

  // ── Idle: dropzone ──────────────────────────────────────────────────────
  if (code === null) {
    return <StatementDropzone uploading={parse.isPending} error={uploadError} onFile={handleFile} />;
  }

  // ── Failed ────────────────────────────────────────────────────────────────
  if (view?.status === 'failed') {
    return (
      <ErrorState
        title="We couldn’t read that statement"
        description={view.failureReason ?? 'It doesn’t look like a usable Nigerian bank statement.'}
        action={
          <AppButton
            variant="secondary"
            onClick={() => {
              setCode(null);
              setSseView(null);
            }}
          >
            Try another file
          </AppButton>
        }
      />
    );
  }

  // ── Ready / needs review: confirm (or correct) inflows ─────────────────────
  // needs_review = the model counted no income while credits exist; InflowsConfirm
  // surfaces the warning + empty selection so the user picks the real income.
  // Both paths recompute server-side on confirm and proceed with the result.
  if (view?.status === 'ready' || view?.status === 'needs_review') {
    return <InflowsConfirm view={view} onConfirm={proceedToResult} />;
  }

  // ── In progress ───────────────────────────────────────────────────────────
  const step = view ? STATUS_STEP[view.status] : 0;
  return (
    <section className="grid gap-5">
      <Stepper steps={PIPELINE_STEPS} current={step} />
      <div className="rounded-card border border-edge bg-paper-sheet p-6">
        <AppText variant="lede">Reading your statement…</AppText>
        <AppText variant="body-sm" className="mt-2 text-ink-muted">
          This usually takes a few seconds. We never store the file — it’s discarded once your
          inflows are read.
        </AppText>
        <Show when={view?.bankName !== undefined}>
          <div className="mt-4 flex gap-6 text-sm">
            <span className="text-ink-muted">
              Bank: <span className="text-ink">{view?.bankName}</span>
            </span>
            <Show when={view?.monthsCovered !== undefined}>
              <span className="text-ink-muted">
                Months: <span className="text-ink">{view?.monthsCovered}</span>
              </span>
            </Show>
          </div>
        </Show>
      </div>
    </section>
  );
}
