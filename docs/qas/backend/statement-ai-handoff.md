# Backend QA Handoff — Statement parsing + grounded AI (Module 1 & 4)

**Date:** 2026-05-24
**Build:** Typecheck ✅ · Lint ✅ · Tests ⚠️ (none yet — see Out of Scope)
**Base URL:** `http://localhost:8090/api/v1`

> **Scope change:** this phase promotes the backend from stateless v1 to a **stateful
> v1.5** backed by MongoDB (see `docs/product/statement-pipeline.md`). No accounts, no
> auth — processes are keyed by an opaque 8-digit `code`. Full API in `docs/api-docs.md`.

## LLM transport mode (deterministic testing)

Set `LLM_MODE=stub` for deterministic QA/CI runs — the statement + AI paths then return
fixed, assertable values through the **same** breaker + audit + schema-validation path as
the real client (so breaker/audit/PII tests stay meaningful). `LLM_MODE=stub` is **rejected
at boot in production**. Use `LLM_MODE=openai` + the real key + a real Kuda PDF for one live
structural smoke pass. Full steering table in `docs/api-docs.md` → "LLM transport mode".

Quick reference for steering the stub:

| Lever | Effect |
|---|---|
| `salary.pdf` (or other) | happy → `ready` (Kuda MFB, 6 mo, gross ₦15,000,000.00, 2 inflows) |
| `reject.pdf` | gate invalid → `failed` |
| `fail.pdf` | upstream throw (breaker failure) |
| question has "VAT" / `LLM_STUB_CHAT=refuse` | `refused: true` |
| `LLM_STUB_FAIL_TIMES=N` | next N calls throw → trip the circuit |
| `LLM_STUB_UNCONFIGURED=true` | missing-key 503/1007 without touching the real key |

> All six steered paths above were verified live in stub mode (happy → `ready` with the
> engine computing the tax, gate-reject, refusal, forced-failure, breaker open at 5
> consecutive failures with `Retry-After: 30`, and the unconfigured 503). No PDF/base64
> leaked to logs.

## Prerequisites to test

- **MongoDB** running and reachable at `MONGODB_URI` (default `mongodb://localhost:27017`, db `taxlens`).
- **`OPENAI_API_KEY`** set in `apps/main-backend/.env` to exercise the AI path. **Without
  it**, the pipeline marks every process `failed` and `/ai/ask` returns `503 / 1007` — that
  degradation is itself a valid test case.
- A sample **Nigerian bank-statement PDF** (valid case) and a **non-statement PDF** + a
  non-PDF file (invalid cases).

Run: `pnpm -F @taxlens/main-backend dev` (port 8090).

---

## Endpoints Implemented

| Method | Path | Body / transport | Notes |
|--------|------|------------------|-------|
| GET | `/health` | — | liveness |
| POST | `/tax/compute` | `IncomeInput` (JSON, kobo) | NTA 2025 only (unchanged) |
| POST | `/tax/compare` | `IncomeInput` (JSON, kobo) | both regimes + comparison (unchanged) |
| POST | `/statement/parse` | **multipart**: `file` (PDF) + `profileType` | returns `{ code, status }` (202) |
| GET | `/statement/:code/events` | — | **SSE** status stream |
| GET | `/statement/:code` | — | poll fallback |
| POST | `/ai/ask` | `{ code, question }` (JSON) | grounded follow-up |

**Route order** (verify nothing is shadowed): `/statement/parse`, then
`/statement/:code/events`, then `/statement/:code`.

---

## Flow to validate end-to-end

1. **Upload** a valid statement PDF → `202 { code, status: "pending" }`. `code` is 8 digits.
2. **Subscribe** `GET /statement/:code/events` → observe `status` events advance
   `validating → analyzing → ready`. Stream closes on `ready`. `analyzing` carries
   `bankName` + `monthsCovered`; `ready` carries `inflows`, `grossAnnualKobo`, `computation`.
3. **Or poll** `GET /statement/:code` every ~2s → same progression; stops at terminal.
4. **Ask** `POST /ai/ask { code, question }` → grounded answer + `citations` + `disclaimer`.
   An out-of-scope question (e.g. "how much VAT do I owe?") returns `200` with
   `refused: true`. Verify the answer never states a tax figure absent from `computation`.
5. **Idle expiry:** leave a process untouched > `PROCESS_TTL_MS` (default 1h; lower it via
   env to test quickly, e.g. `PROCESS_TTL_MS=60000 REAPER_INTERVAL_MS=10000`). After a
   reaper sweep, `:code` endpoints return `404 / 1004`.

---

## Status state machine

| State | Transitions | Trigger |
|-------|-------------|---------|
| `pending` | → `validating`, `failed` | pipeline start |
| `validating` | → `analyzing`, `failed` | gate verdict (tier 1) |
| `analyzing` | → `ready`, `failed` | analysis + engine (tier 2) |
| `ready` | — (terminal) | success |
| `failed` | — (terminal) | gate rejected / analysis error / circuit open |

Client-sent status is never accepted. An invalid transition (only reachable internally)
raises `409 / 1005`.

---

## Money Fields

| Field | Unit | Notes |
|-------|------|-------|
| `grossAnnualKobo` | kobo | integer only — decimal → `400 / 1001` |
| `reliefs.*Kobo` | kobo | integer only |
| `inflows[].amountKobo` | kobo | from the analysis model; integer |
| `computation.*Kobo` | kobo | from `@taxlens/core` — the single authority |

The tax engine produces every number. The LLM only extracts inputs (inflows, gross) and
explains outputs — verify it **never** emits a computed tax figure.

---

## Error Response Shape (flat)

```json
{ "errorCode": 1001, "errorMessage": "grossAnnualKobo: …", "type": "validation_error", "field": "grossAnnualKobo" }
```

| HTTP | `errorCode` | `type` | When |
|------|-------------|--------|------|
| 400 | 1001 | validation_error | invalid body / params / upload |
| 404 | 1004 | not_found_error | unknown route or unknown/expired `code` |
| 409 | 1005 | conflict_error | invalid status transition / code collision |
| 422 | 1008 | processing_error | domain processing failure |
| 503 | 1007 | upstream_error | OpenAI down / circuit open / key missing (may carry `Retry-After`) |
| 500 | 1009 | internal_error | unexpected |

### ⭐ One-field-at-a-time validation (must test)

Submit a body with **two** invalid fields and confirm **only one** `field` comes back.
Fix it, resubmit, confirm the **next** field's error appears.

| Input | First error returned |
|-------|----------------------|
| `profileType: "x"` AND `grossAnnualKobo: -5` | `grossAnnualKobo` (shallowest path, then alphabetical: "g" < "p") |
| then fix `grossAnnualKobo`, keep `profileType: "x"` | `profileType` |

---

## Critical Edge Cases

| Scenario | Expected |
|----------|----------|
| Upload non-PDF (e.g. .png) | `400 / 1001`, `field: "file"` |
| Upload > 10 MB | `400 / 1001`, `field: "file"` ("exceeds the maximum allowed size") |
| multipart with no `file` part | `400 / 1001`, `field: "file"` |
| Bad `profileType` in form | `400 / 1001`, `field: "profileType"` |
| `:code` not 8 digits (e.g. `/statement/abc`) | `400 / 1001` |
| Unknown `code` (poll, SSE, or ask) | `404 / 1004` |
| Valid PDF but not a bank statement | process ends `status: "failed"` with a `failureReason` (gate rejects; tier-2 never runs) |
| `OPENAI_API_KEY` absent → upload | process ends `failed`; `/ai/ask` → `503 / 1007` |
| 5 consecutive OpenAI failures | circuit opens; subsequent AI calls → `503 / 1007` + `Retry-After`; recovers after cooldown via half-open probe |
| Out-of-scope AI question (VAT/company tax) | `200`, `refused: true`, no tax figure |
| SSE: connect after process already `ready` | receives one `status` event with the full result, then stream closes |
| Idle process past TTL | reaped; `:code` → `404 / 1004` |

---

## What to inspect in Mongo

- `tax_processes` — one doc per upload. After `ready`: has `inflows`, `grossAnnualKobo`,
  `computation`, `analysisResponseId`, `lastInteractionAt`. After an AI ask: `chatMessages`
  grows and `lastInteractionAt` bumps.
- `llm_audit` — one doc per OpenAI call (`tier: gate | analysis | chat`), with `model`,
  `inputTokens`, `outputTokens`, `latencyMs`, `circuitState`, `promptHash`. **No raw
  statement text** must appear anywhere (audit, logs).

---

## PII / logging checks

- Server logs must **never** contain the raw PDF, base64, `file_data`, `nin`, `bvn`, or
  account numbers (redacted by pino). Grep the logs during a parse to confirm.
- `llm_audit.promptHash` is a hash, not the prompt text.

---

## Seam checklist (backend ↔ frontend)

```
[x] Flat error: backend { errorCode, errorMessage, type, field? } ↔ @taxlens/api parseApiError
[x] errorCode is numeric (1001–1009); client switches on it, not the message
[x] Money: backend integer kobo ↔ frontend treats as integer (no parseFloat)
[x] Dates: backend ISO 8601 strings (createdAt/updatedAt/inflow.date)
[x] Arrays: inflows/citations are [] not null when empty
[x] StatementProcessView shape shared via @taxlens/core (no drift)
[x] EP: STATEMENT_PARSE / STATEMENT_BY_CODE(code) / STATEMENT_EVENTS(code) / AI_ASK
[x] /ai/ask body is { code, question } (was { question, computationContext })
```

---

## Out of Scope (this phase)

- [ ] **Automated tests** — no vitest suite yet. The tax engine (`@taxlens/core`) still has
      zero coverage and is now load-bearing for the pipeline; recommend engine unit tests +
      handler contract tests next.
- [ ] **Rate limiting** on `/statement/parse` (triggers paid LLM calls) — `1006` is reserved but unused.
- [ ] **Durable job queue** — pipeline is in-process; a restart mid-parse loses the job (user re-uploads).
- [ ] **Horizontal scale** — circuit breaker + SSE event bus are per-instance (in-memory).
- [ ] Frontend wiring of the upload/SSE/result screens (API hooks are provided in `@taxlens/api`).
