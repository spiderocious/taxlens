# Backend QA Bug Report — Statement + AI + whole backend

> **QA:** Claude · **Date:** 2026-05-24 · **Build:** commit `503f4e5`
> **Report:** `statement-ai-report.md` · **Plan:** `../plans/statement-ai-test-plan.md`

Priority: **P0** core broken · **P1** wrong output to clients · **P2** degraded/wrong-status ·
**P3** cosmetic/doc.

---

## BUG-01 — Malformed JSON and oversized bodies return `500/1009` instead of `400/1001` 🟡 P2

**Found by:** dynamic tests VAL-10, VAL-11.
**Status:** ✅ FIXED (2026-05-24) — verified live: malformed JSON → `400/1001` ("Malformed JSON
in request body"); >1 MB body → `413/1001` ("Request body too large"). Added a `bodyParserErrorType`
narrowing guard in `errorHandler` mapping `entity.parse.failed` → 400 and `entity.too.large` → 413
(new `HTTP_STATUS.PAYLOAD_TOO_LARGE`), both before the generic 500.
**File:** `apps/main-backend/src/middlewares/errorHandler.middleware.ts`

### What happens
The error handler maps `AppError`, `ZodError`, and `MulterError`, then falls through to a
generic `500 / 1009` for everything else. Express's `body-parser` throws two error types that
are **client** errors but hit that catch-all:

- a malformed JSON body → `SyntaxError` (body-parser sets `.status = 400`, `.type = "entity.parse.failed"`)
- a body over the 1 MB JSON limit → `PayloadTooLargeError` (`.status = 413`, `.type = "entity.too.large"`)

Both currently surface to the client as `{"errorCode":1009,"errorMessage":"An unexpected
error occurred","type":"internal_error"}` with HTTP `500`.

### Steps to reproduce
```bash
# Malformed JSON → 500 (should be 400/1001)
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8090/api/v1/tax/compute \
  -H "Content-Type: application/json" -d '{ not json'        # → 500

# >1MB body → 500 (should be 400/413)
node -e "process.stdout.write(JSON.stringify({profileType:'salary_earner',grossAnnualKobo:1,reliefs:{annualRentKobo:0,pensionKobo:0,nhisKobo:0,nhfKobo:0,lifeInsuranceKobo:0},pad:'x'.repeat(1100000)}))" > /tmp/big.json
curl -s -o /dev/null -w "%{http_code}\n" -X POST http://localhost:8090/api/v1/tax/compute \
  -H "Content-Type: application/json" --data-binary @/tmp/big.json   # → 500
```

### Evidence (server log)
```
ERROR: Unhandled error  err.type: "SyntaxError"  "Expected property name or '}' in JSON at position 2"
ERROR: Unhandled error  err.type: "PayloadTooLargeError"  "request entity too large"
```
Both reach the `logger.error(…, 'Unhandled error')` branch → `500/1009`.

### Impact
- A client sending a slightly malformed body (very common) gets a **`500`**, which (a) is the
  wrong contract — `api-docs.md` says invalid body → `400/1001`, and (b) inflates real
  `internal_error` alerting, hiding genuine server faults.
- `@taxlens/api parseApiError` keys off `errorCode`; clients will treat a fixable bad-request
  as an unrecoverable server error.

### Fix
Add a body-parser branch to `errorHandler` **before** the generic 500. These errors carry a
`type`/`status`; map them to the validation envelope (field `_root` or omit `field`):

```ts
// after the MulterError block, before the final logger.error/500:
if (
  err instanceof SyntaxError && 'status' in (err as any) && 'body' in (err as any)
) {
  ResponseUtil.error(res, HTTP_STATUS.BAD_REQUEST, {
    errorCode: ERROR_CODE.VALIDATION,
    errorMessage: 'Malformed JSON in request body',
    type: ERROR_TYPE.VALIDATION,
  });
  return;
}
if (typeof err === 'object' && err && (err as any).type === 'entity.too.large') {
  ResponseUtil.error(res, HTTP_STATUS.BAD_REQUEST, {   // or 413 if a PAYLOAD_TOO_LARGE code is added
    errorCode: ERROR_CODE.VALIDATION,
    errorMessage: 'Request body too large',
    type: ERROR_TYPE.VALIDATION,
  });
  return;
}
```
(If `413` is preferred over `400` for size, add an `HTTP_STATUS.PAYLOAD_TOO_LARGE` and reuse
`1001`, or introduce a dedicated code — the table currently has no `413` mapping.)

---

## BUG-02 — Grounded `/ai/ask` returns `503/1007` on a large fraction of real OpenAI calls 🟡 P2

**Found by:** LIVE tests AI-15c + stability re-runs.
**Status:** ✅ FIXED (2026-05-24) — schema/empty-output failures now throw an internal
`LlmContractError` (NOT counted against the breaker), trigger **one repair retry**, then
surface as `422/1008 processing_error` ("could not produce a grounded answer, please
rephrase") — never `503`. Partial output is rejected too: `AnswerSchema.answer` is now
`.min(1)`, so an empty answer is a contract failure rather than a blank `200`. A new stub
lever **`LLM_STUB_CHAT=nonconforming`** reproduces this deterministically. Verified: 8/8
nonconforming asks → `422/1008`, breaker never opened; happy + VAT-refuse paths still `200`.
**Retest in LIVE:** AI-15/AI-15c ×10 should show 0 spurious `503`s (clean `422` on any
drift), never a `200` with empty `answer`.
**Files:** `apps/main-backend/src/lib/llm/openai-client.ts` (`runStructured` / `LlmContractError`),
`apps/main-backend/src/features/ai/ai.service.ts` (`AnswerSchema`),
`apps/main-backend/src/lib/llm/stub-transport.ts` (nonconforming lever).

### What happens
Against the real model (`gpt-4o`, `LLM_MODE=openai`), repeated `/ai/ask` calls on a `ready`
process intermittently return `503 / 1007` `{"errorMessage":"AI service call failed"}` instead
of a `200` answer/refusal. Measured on one real process (code `53405318`, ~30k-token threaded
context):

- AI-15c (VAT refusal): 1st attempt `503`; re-runs 2 of 3 succeeded.
- Stability probe (in-scope "Explain my tax bands"): **4 of 6 returned `503/1007`.**

### Root cause (most likely)
`runStructured` validates the model's `output_parsed` against the caller's zod schema and, on
**any** failure (null output *or* schema mismatch), throws `UpstreamUnavailableError` →
`503/1007`. With the chat context threaded via `previous_response_id` the input is large
(~30k tokens observed), and `gpt-4o` periodically returns structured output that doesn't
satisfy `AnswerSchema` (`{answer, citations[], refused}`) — or returns an empty/partial parse.
That valid-but-nonconforming turn is being treated as an upstream outage.

> An earlier observed symptom (`refused:undefined, answer:""` with HTTP `200`) suggests the
> model sometimes returns a *partial* object that slips through as a degenerate success — so
> there may be **two** sub-issues: (a) nonconforming output → 503, (b) partial output →
> 200-with-empty-fields. Both trace to trusting the model's structured output without a repair
> path.

### Why the stub masks it
The stub always returns a schema-perfect object, so the shell's validation never fails — the
deterministic suite (AI-01/02/etc.) is 12/12. This is exactly the gap a single live pass is
meant to catch.

### Impact
The headline feature (grounded follow-up) fails for the user a significant share of the time,
presenting as a generic "AI service unavailable". On a large/long conversation it appears to
get **worse** (bigger context → more nonconforming outputs).

### Suggested fix (any/combination)
- **Distinguish "schema mismatch" from "upstream down."** A parse/validation failure is not a
  `503`; either retry once with a stricter/again prompt, or return a `422/1008 processing_error`
  ("couldn't produce a grounded answer, try rephrasing") so it isn't conflated with an outage
  and doesn't trip the circuit breaker spuriously.
- **Add a one-shot repair retry** on schema-validation failure before giving up.
- **Reject partial success:** treat `answer === ''` (or missing `refused`) as a failure rather
  than returning `200` with empty fields.
- **Investigate context size:** consider summarising/trimming the threaded context for chat so
  inputs stay smaller and outputs more reliable.

### Note for retest
Re-run AI-15/AI-15c ×10 in LIVE mode after the fix; expect 0 spurious `503`s (or a clean
`422` with a retry hint), and never a `200` with empty `answer`.

---

## DIV-01 — `/tax/compute` worked example in `api-docs.md` is stale 🟢 P3

**Found by:** static review; confirmed at runtime (CMP-07).
**Status:** ✅ FIXED (2026-05-24) — `api-docs.md` §2 now shows the engine's real numbers
(`annualTaxKobo: 252960000`, `monthlyTaxKobo: 21080000`, `effectiveRate: 0.16864`).
**File:** `docs/api-docs.md` §2 (`POST /api/v1/tax/compute` example).

**Doc shows** for gross `1_500_000_000` + rent `120_000_000`:
`annualTaxKobo: 168200000`, `monthlyTaxKobo: 14016667`, `effectiveRate: 0.11213`.
**Engine returns** (verified against built `@taxlens/core` and live API):
`annualTaxKobo: 252_960_000`, `monthlyTaxKobo: 21_080_000`, `effectiveRate: 0.16864`
(`taxableIncomeKobo: 1_476_000_000`, `totalReliefsKobo: 24_000_000`).

The engine is internally consistent (bands sum to the total). The **example numbers are
wrong** — update them. No code change.

---

## OBS-01 — `compareRegimes` `zero_band` reform relevance looks inverted ℹ️ needs product decision

**Found by:** static review; confirmed (CMR-08).
**Status:** ✅ RESOLVED (2026-05-24) — product decision: the tax-free first ₦800k applies to
everyone, so `zero_band` is now surfaced **unconditionally** (the gate was removed).
`relevantReforms` for the stub `ready` input (gross ₦15M) is now
`cra_abolished, zero_band, nin_tax_id`. **Update CMR-08's expected reform set to include
`zero_band` for all profiles.**
**File:** `packages/core/src/tax/compute.ts`.

```ts
if (r.id === 'zero_band')
  return newRegime.taxableIncomeKobo <= 800_000 * 100 || newRegime.isExempt;
```
The "First ₦800,000 is tax-free" reform is shown **only** when taxable income ≤ ₦800k (or
exempt). So a high earner — for whom the tax-free first band is still a real, reassuring
benefit — never sees it, while people whose whole income is already tax-free do. For the
stub `ready` input (gross ₦15M), `relevantReforms` = `cra_abolished, nin_tax_id` (no
`zero_band`). May be intentional (only surface to low earners) or an inverted condition.
**Product to confirm**; if the logic flips, update CMR-08's expected reform set.

---

## OBS-02 — No `.strict()` on request schemas ℹ️ low

**Status:** ✅ RESOLVED (2026-05-24) — `.strict()` added to all three request schemas.
Verified: an unknown/misspelled field (`grosssAnnualKobo`) now → `400/1001` ("Unrecognized
key(s) in object", `field: "_root"`). **Update VAL-09: extra fields are now rejected, not
dropped.**
**Files:** `tax.schema.ts`, `statement.schema.ts`, `ai.schema.ts`.

---

## OBS-03 — `docs/run.md` is stale ℹ️ doc

**Status:** ✅ FIXED (2026-05-24) — `run.md` now documents the v1.5 stateful reality: MongoDB
prerequisite + boot dependency, `MONGODB_URI`/`OPENAI_API_KEY`/`LLM_MODE` env keys, the
"Express + Mongo" stack, and a Mongo-unreachable troubleshooting entry. `ANTHROPIC_API_KEY`
removed.
