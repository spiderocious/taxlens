# Spec — Env-driven LLM stub/mock seam (for QA determinism)

**Audience:** backend dev
**Author:** QA
**Date:** 2026-05-24
**Status:** Proposed — blocks the statement + AI test plan

---

## Why we need this

The statement-parse pipeline (Module 1) and grounded AI (Module 4) both go through
`llmClient.structured()` → real OpenAI (`gpt-4o-mini` gate, `gpt-4o` analysis/chat).
Today there is **no way to exercise the success paths without spending real tokens on a
live key**, and even with a key the outputs are **non-deterministic** — so a QA suite
can't assert exact values, can't reliably reproduce a failure, and can't run in CI.

Concretely, without a seam these cases are **untestable or only loosely testable**:

- `status: ready` with a known `inflows` / `grossAnnualKobo` / `computation`
- `analyzing` carrying a known `bankName` + `monthsCovered`
- gate-rejection → `status: failed` with a specific `failureReason`
- `/ai/ask` grounded answer shape, `refused: true` on out-of-scope, citations present
- **circuit breaker**: 5 consecutive failures → open → `503/1007` + `Retry-After` → half-open recovery
- the "AI never invents a tax number" guarantee (needs a deterministic answer to assert against)

We still want **one** live end-to-end run against the real key + a real Kuda PDF to prove
the real integration works. But everything else should run deterministically against a stub.

**Goal:** a single env flag that swaps the real OpenAI client for a deterministic in-process
fake, with **zero changes to call sites** and **no stub code reachable in production**.

---

## The one rule

The seam lives **only** inside `apps/main-backend/src/lib/llm/openai-client.ts` (the single
entry point every tier already goes through). `statement.service.ts`, `ai.service.ts`, the
circuit breaker, the audit repo, and all routes stay **untouched**. They keep calling
`llmClient.structured(params)` and keep getting back `{ data, responseId }`.

---

## Proposed shape

### 1. Env switch

Add to `env.ts` (`EnvSchema`):

```ts
// LLM transport. 'openai' = real API (default). 'stub' = deterministic in-process
// fake for tests/CI — never enable in production.
LLM_MODE: z.enum(['openai', 'stub']).default('openai'),
```

### 2. Pick the transport once, behind the existing facade

`llmClient.structured()` becomes a thin dispatch. Keep the real implementation exactly as
it is today; add a stub sibling and choose between them by `env.LLM_MODE`:

```ts
export const llmClient = {
  isConfigured(): boolean {
    // In stub mode we are "configured" without a key, so the no-key 503 path
    // can still be tested explicitly via the dedicated unconfigured stub fixture.
    return env.LLM_MODE === 'stub' ? true : Boolean(env.OPENAI_API_KEY);
  },
  structured<T>(params: StructuredCallParams<T>): Promise<StructuredCallResult<T>> {
    return env.LLM_MODE === 'stub' ? stubStructured(params) : openaiStructured(params);
  },
};
```

> Note the existing real path still **runs through the circuit breaker and writes
> `llm_audit`**. The stub should do the **same** (see §4) so audit/PII and breaker tests
> stay meaningful in stub mode.

### 3. Make the stub deterministic *and* steerable

The stub must return a valid object for each tier's schema, and let a test **force a
specific verdict/outcome** without real I/O. Two ways to steer it (support both):

**(a) By tier defaults** — sensible happy-path output per tier so the plain flow reaches
`ready`:

| tier | returns |
|------|---------|
| `gate` | `{ valid: true, bankName: "Kuda MFB", monthsCovered: 6, reason: "" }` |
| `analysis` | a fixed `{ inflows: [...known...], grossAnnualKobo: 1500000000 }` |
| `chat` | `{ answer: "...", citations: [{section,snippet}], refused: false }` |

**(b) By a control channel** so a single test can force gate-reject, force an upstream
failure (to drive the breaker), force a refusal, etc. Pick whichever is cleaner:

- **Filename convention** (nice for the multipart path — QA controls the upload):
  - `reject.pdf` → gate returns `valid: false, reason: "Not a usable Nigerian bank statement"`
  - `fail.pdf` → throws `UpstreamUnavailableError` (counts as a breaker failure)
  - `salary.pdf` / anything else → happy path
- **and/or** an env-seeded scenario for the no-file paths (chat): e.g.
  `LLM_STUB_CHAT=refuse` forces `refused: true`; `LLM_STUB_FAIL_TIMES=5` makes the next 5
  calls throw (to trip the circuit), then succeed.

The question text itself can also steer chat (e.g. a question containing "VAT" →
`refused: true`) so the out-of-scope case is reproducible.

### 4. Stub must preserve the real contract

So tests written against the stub stay valid against the real client:

- **Validate against the same zod schema** the caller passed (`params.schema.parse(...)`),
  so a stub that drifts from the schema fails loudly — same as the real `output_parsed`.
- **Return a stable `responseId`** (e.g. `stub_<tier>_<code>`), and **honour
  `previousResponseId`** enough that chat continuity can be asserted (the analysis turn's
  id flows into the first chat turn — see `ai.service.ts`).
- **Go through the circuit breaker** (`breaker.run`) so the open/half-open/closed
  transitions are real, and **write `llm_audit`** with `tier`, `model`, token counts
  (can be `0` or fixed), `latencyMs`, `circuitState`, and a `promptHash` — **never raw
  statement text** (this is exactly what the PII test checks).
- **Respect the "unconfigured" path**: provide a way to simulate missing key →
  `503/1007` (e.g. `LLM_MODE=stub` + `LLM_STUB_UNCONFIGURED=true`, or a dedicated
  fixture) so we don't have to actually unset the key on a shared box to test it.

---

## What QA will do with each mode

| Mode | What it unlocks for the test plan |
|------|-----------------------------------|
| `LLM_MODE=stub` (default for QA/CI) | Deterministic: full pipeline to `ready`, gate-reject → `failed`, grounded answer shape, refusal, **circuit breaker open/recover**, audit + PII checks, no-key 503. Assert **exact** values. |
| `LLM_MODE=openai` + real key + real Kuda PDF | One **live smoke pass**: real upload → real `ready`, one real `/ai/ask`. Assertions stay **structural** (status, shape, `refused`, no-invented-number), not exact-value, because real output varies. |

---

## Acceptance criteria for the seam

- [ ] `LLM_MODE` env added; defaults to `openai`; **rejected in production when `stub`**.
- [ ] No call site outside `openai-client.ts` changed.
- [ ] Stub output **parses against each tier's caller-supplied zod schema**.
- [ ] Stub is **steerable** to: happy gate, rejected gate, analysis output, chat answer,
      chat refusal, and forced upstream failure (for the breaker).
- [ ] Stub calls run through the **circuit breaker** and write **`llm_audit`** (hash only,
      no raw statement text).
- [ ] A documented way to simulate the **missing-key 503** without unsetting the real key.
- [ ] Stub `responseId` is stable and `previousResponseId` is threaded for chat continuity.
- [ ] One short note in `docs/api-docs.md` or the handoff documenting `LLM_MODE` for QA.

---

## Out of scope for this seam

- Replaying *real* recorded OpenAI responses (VCR/fixtures from the wire) — the synthetic
  stub above is enough for the contract + state-machine + breaker coverage we need.
- Token-cost accounting accuracy in stub mode (fixed/zero counts are fine).

---

## Handoff back to QA

Once this lands **and** the real `OPENAI_API_KEY` + Kuda PDF are in place, I'll write the
full backend test plan (whole backend: `/tax/*` with engine-verified numbers, statement
parse/SSE/poll, `/ai/ask`, state machine, reaper, circuit breaker, PII/audit, error
envelope), then execute it — stub mode for the deterministic bulk, one live pass for the
real integration.

> Heads-up for the dev (found during code review, not blocking this seam): the
> `/tax/compute` **worked example in `docs/api-docs.md` is stale** — it shows
> `annualTaxKobo: 168200000` for gross ₦15M / rent ₦1.2M, but the actual engine
> (`computeNta2025`) returns `252960000` (monthly `21080000`, effRate `0.16864`). The
> engine is internally consistent; the doc example needs updating. I'll log this formally
> in the test report.
