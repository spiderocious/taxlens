import { useState } from 'react';
import { Repeat, Show } from 'meemaw';

import { ERROR_CODE, parseApiError, useAskAi, type AskAiResult } from '@taxlens/api';
import {
  AppButton,
  AppText,
  Avatar,
  Banner,
  Chip,
  CitationBlock,
  Field,
  Textarea,
} from '@taxlens/ui';

interface AiPanelProps {
  /** The 8-digit process code the AI is allowed to explain. */
  readonly code: string;
}

const SUGGESTIONS = [
  'Why is my effective rate so low?',
  'What is rent relief?',
  'How did the old regime compare?',
];

// Module 4 — grounded follow-up. The model only explains numbers the calculator
// produced, cites NTA 2025, refuses out-of-scope, and always ends with a
// disclaimer. We render exactly what the server returns; errors key off the
// numeric errorCode (422 = rephrase, 503 = upstream down).
export function AiPanel({ code }: AiPanelProps) {
  const [question, setQuestion] = useState('');
  const [answer, setAnswer] = useState<AskAiResult | null>(null);
  const [errorNote, setErrorNote] = useState<string | null>(null);
  const ask = useAskAi();

  function submit(q: string) {
    const trimmed = q.trim();
    if (trimmed.length === 0) return;
    setErrorNote(null);
    ask.mutate(
      { code, question: trimmed },
      {
        onSuccess: (result) => {
          setAnswer(result);
          setQuestion('');
        },
        onError: async (err) => {
          setAnswer(null);
          const body =
            err instanceof Error && 'response' in err
              ? await (err as unknown as { response: Response }).response.json().catch(() => null)
              : null;
          const parsed = parseApiError(body);
          if (parsed.errorCode === ERROR_CODE.PROCESSING_FAILED) {
            setErrorNote('I couldn’t ground that cleanly — try rephrasing your question.');
          } else if (parsed.errorCode === ERROR_CODE.UPSTREAM_UNAVAILABLE) {
            setErrorNote('The assistant is briefly unavailable. Please try again in a moment.');
          } else if (parsed.errorCode === ERROR_CODE.NOT_FOUND) {
            setErrorNote('This result has expired. Start over to ask about a fresh computation.');
          } else {
            setErrorNote('Something went wrong asking that. Please try again.');
          }
        },
      },
    );
  }

  return (
    <section className="grid gap-4 rounded-card border border-edge bg-paper-sheet p-5">
      <div className="flex items-center gap-3">
        <Avatar size="sm" />
        <div>
          <AppText variant="heading-3">Ask about your result</AppText>
          <AppText variant="body-sm" className="text-ink-muted">
            Personal income tax under NTA 2025 only. I explain your numbers — I never invent new ones.
          </AppText>
        </div>
      </div>

      <Field htmlFor="ai-question">
        <Textarea
          id="ai-question"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="e.g. Why is my effective rate so low?"
          rows={2}
          maxLength={2000}
        />
      </Field>

      <div className="flex flex-wrap items-center gap-2">
        <Repeat each={SUGGESTIONS}>
          {(s) => (
            <button
              key={s}
              type="button"
              onClick={() => submit(s)}
              disabled={ask.isPending}
              className="rounded-full border border-edge bg-paper px-3 py-1 text-[12px] text-ink-body hover:border-ink-muted disabled:opacity-50"
            >
              {s}
            </button>
          )}
        </Repeat>
        <span className="flex-1" />
        <AppButton
          loading={ask.isPending}
          disabled={question.trim().length === 0 || ask.isPending}
          onClick={() => submit(question)}
        >
          Ask
        </AppButton>
      </div>

      <Show when={errorNote !== null}>
        <Banner tone="warn">{errorNote}</Banner>
      </Show>

      <Show when={answer !== null}>
        {answer !== null ? (
          <div className="grid gap-3 border-t border-edge-hair pt-4">
            <div className="flex items-center gap-2">
              <Show when={answer.refused}>
                <Chip variant="info" dot>
                  Out of scope
                </Chip>
              </Show>
            </div>
            <AppText variant="lede">{answer.answer}</AppText>
            <Repeat each={answer.citations}>
              {(c, i) => (
                <CitationBlock key={`${c.section}-${i}`} statuteRef={c.section}>
                  {c.snippet}
                </CitationBlock>
              )}
            </Repeat>
            <p className="text-xs italic text-ink-muted">{answer.disclaimer}</p>
          </div>
        ) : null}
      </Show>
    </section>
  );
}
