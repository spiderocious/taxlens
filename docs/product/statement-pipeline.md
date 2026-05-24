# Statement parsing + grounded AI — backend design (v1.5)

**Status:** Design — not yet implemented. Review before building.
**Date:** 2026-05-24
**Scope:** Module 1 (upload path), Module 4 (grounded AI follow-up).
**Author:** backend

---

## 0. The constraint change this introduces

The PRD and `docs/rules.md` state v1 is **stateless — no DB, no stored user data**.
This design **deliberately overrides that** to deliver the upload + AI features as
specified, promoting the service to a **stateful v1.5** backed by MongoDB.

Decision log (this is the conscious trade, recorded so the next engineer has context):

| Decision | Choice | Why |
|---|---|---|
| Persistence | **MongoDB** | Need a lifecycle for the parse job, the result, and chat continuation. |
| LLM provider | **OpenAI** | `gpt-4o-mini` cheap gate → `gpt-4o` analysis. Replaces the `ANTHROPIC_API_KEY` wiring. |
| Upload transport | **multipart/form-data** | Binary PDF; base64-in-JSON fought the 1mb JSON limit. |
| Idle cleanup | **Explicit reaper job** | Deletes idle processes + audit past 1h, emits metrics (vs. silent TTL index). |
| Async execution | **In-process** (non-awaited) | No queue infra in v1.5. Work lost on mid-parse restart → user re-uploads. |
| Chat state | **Server-side** | Persist `chatMessages`, continue from saved OpenAI response id. |

What we **keep** from the existing conventions: integer-kobo money, `ResponseUtil`
envelope (except SSE — see §6), `asyncHandler`, zod at the boundary → central
`validation_error`, `AppError` subclasses, `AsyncLocalStorage` request context,
pino with redaction, `EP`/`ROUTES` constants, **the `@taxlens/core` tax engine as
the single authority for every computed number**, no `any`.

---

## 1. Data model (MongoDB)

Money is **integer kobo** in every field (suffix `Kobo`). IDs/timestamps are app-managed.

### `tax_processes` — one document per upload (the thing a code points at)

```
{
  _id:                 ObjectId,
  code:                string,            // 8-digit, UNIQUE index — what the FE holds
  status:              ProcessStatus,     // see §3 state machine
  failureReason?:      string,            // set only when status = "failed"
  profileType:         ProfileType,       // from upload form ('salary_earner'|'freelancer'|'mixed')

  // tier-1 gate output
  bankName?:           string,
  monthsCovered?:      number,

  // tier-2 analysis output
  inflows?:            StatementInflow[], // core type: { id, date, description, amountKobo, classification }
  grossAnnualKobo?:    number,            // derived input handed to the engine

  // tax engine output (the engine, not the LLM, computes these — PRD)
  computation?:        RegimeComparison,  // @taxlens/core compareRegimes() result

  // OpenAI continuity (so chat resumes without re-sending everything)
  gateResponseId?:     string,
  analysisResponseId?: string,            // chat (Module 4) continues from here
  chatMessages?:       ChatMessage[],     // [{ role, content, responseId?, createdAt }]

  createdAt:           Date,
  updatedAt:           Date,
  lastInteractionAt:   Date               // reaper anchor — bumped on every interaction (§7)
}
```

Indexes: `{ code: 1 }` unique; `{ lastInteractionAt: 1 }` (reaper scan); `{ status: 1 }`.

### `llm_audit` — append-only, one row per model call

Never updated or deleted by application code (append-only by convention — mirrors the
ledger-immutability principle from `database-patterns.md`, enforced in the repo layer).

```
{
  _id:          ObjectId,
  code:         string,                   // links to the tax_process
  tier:         "gate" | "analysis" | "chat",
  model:        string,                   // e.g. "gpt-4o-mini"
  requestId:    string,                   // from AsyncLocalStorage request context
  promptHash:   string,                   // sha256 of the prompt (no raw PII stored)
  inputTokens:  number,
  outputTokens: number,
  latencyMs:    number,
  verdict?:     string,                   // gate tier: "valid" | reason
  circuitState: "closed" | "open" | "half_open",
  error?:       string,
  createdAt:    Date
}
```

Index: `{ code: 1, createdAt: -1 }`.

> PII note: `llm_audit` stores a **prompt hash**, never the raw statement text. The raw
> PDF buffer lives only in memory during the parse and is never written to disk or DB.

---

## 2. Endpoints

| Method | Path | Body / params | Returns |
|---|---|---|---|
| `POST` | `/api/v1/statement/parse` | multipart: `file` (PDF) + `profileType` | `202 { code, status: "pending" }` |
| `GET`  | `/api/v1/statement/:code/events` | — | **SSE** stream of status (§6) |
| `GET`  | `/api/v1/statement/:code` | — | poll fallback: full process by status |
| `POST` | `/api/v1/ai/ask` | `{ code, question }` | grounded answer + citations + disclaimer |

**Route registration order** (Express is order-dependent — `hard-lessons.md`):
`/statement/parse` → `/statement/:code/events` → `/statement/:code`. Specific before
parameterized; `/events` before the bare `:code`.

`EP` constants in `@taxlens/api` get `STATEMENT_EVENTS` and the `:code` forms; `/ai/ask`
body shape changes from `{ question, computationContext }` to `{ code, question }`
(server now owns the context). **This is a seam change — update the `use-ask-ai` hook
and `AskAiSchema` together.**

---

## 3. Status state machine

App owns the transition map (`database-patterns.md` idiom). Client-sent status is never trusted.

```
pending ──▶ validating ──▶ analyzing ──▶ ready        (terminal)
   │            │              │
   └────────────┴──────────────┴────────▶ failed       (terminal, carries failureReason)
```

```
VALID_TRANSITIONS = {
  pending:    [validating, failed],
  validating: [analyzing, failed],
  analyzing:  [ready, failed],
  ready:      [],
  failed:     [],
}
```

---

## 4. The pipeline (after upload)

```
POST /parse
  multer: validate mime = application/pdf, enforce size cap
  zod: validate profileType
  create tax_process { code, status: pending, profileType, lastInteractionAt: now }
  return 202 { code }                         ← FE polls or opens SSE
  fire pipeline async (NOT awaited):

  ── tier 1: gate (gpt-4o-mini) ──  status → validating
     prompt: "Is this a genuine Nigerian bank statement? bank name? legible? months covered?"
     OpenAI structured output → { valid, bankName, monthsCovered, reason }
     write llm_audit(tier=gate); save gateResponseId
     if !valid → status → failed (failureReason = reason). STOP.   ← cost firewall

  ── tier 2: analysis (gpt-4o) ──   status → analyzing
     prompt: extract inflows, classify each (salary|business|transfer|other),
             derive gross annual income
     OpenAI structured output → inflows[] + grossAnnualKobo
     write llm_audit(tier=analysis); save analysisResponseId

  ── tax engine (@taxlens/core) ──
     compareRegimes({ profileType, grossAnnualKobo, reliefs })
     → status → ready, save inflows + computation
```

**Invariants (PRD):** the LLM only *extracts inputs* (tier 2) and later *explains
outputs* (Module 4). It **never computes a tax number** — `@taxlens/core` does, and
remains the single authority. The gate tier is a real cost firewall: the expensive
model never runs on invalid input.

---

## 5. Circuit breaker (OpenAI client, `lib/llm/`)

Wraps the OpenAI client. Per-process singleton (in-memory) — adequate for a single
backend instance; horizontal scaling would move breaker state to Mongo/Redis (v2).

| State | Behaviour |
|---|---|
| **closed** | calls pass; count consecutive failures |
| **open** | after N consecutive failures (default 5): fast-fail without calling OpenAI → `503 service_unavailable` + `Retry-After`. In-flight parse → `failed` (reason: "AI service temporarily unavailable"). |
| **half_open** | after cooldown (default 30s): allow one probe. Success → closed; failure → open. |

State transitions written to `llm_audit.circuitState`. Uses the existing `AppError`
`retryAfter` support + `HTTP_STATUS.SERVICE_UNAVAILABLE`.

---

## 6. SSE specifics (`GET /statement/:code/events`)

- Headers: `Content-Type: text/event-stream`, `Cache-Control: no-cache`,
  `Connection: keep-alive`; flush immediately.
- Emit a `status` event on each transition. On `ready`/`failed`, emit a final event then close.
- Heartbeat comment (`: ping\n\n`) every ~15s so proxies don't drop idle connections.
- Subscribing bumps `lastInteractionAt`.
- Breaker/error path still emits a clean terminal event — the stream never hangs.
- **Documented exception:** SSE writes raw to the response stream and does **not** use
  `ResponseUtil` (the JSON envelope doesn't apply to event streams). This is the one
  sanctioned deviation from "always `ResponseUtil`".

---

## 7. Interaction tracking + reaper job

"Interaction" (inferred from the MVP) = any touch of the process: upload, status poll,
SSE subscribe, result fetch, AI follow-up. Each bumps `lastInteractionAt = now`.

**Explicit reaper job** (chosen over a TTL index for metrics + audit purge):
- Runs on an interval (default every 5 min).
- Deletes `tax_processes` where `lastInteractionAt < now - 1h`, and their `llm_audit` rows.
- Emits a structured log + metric (`purged_count`) each sweep.

---

## 8. Logging & audit

- Add to pino redact paths **before shipping**: `nin`, `bvn`, account numbers,
  `*.pdfBase64`, raw file buffers. The statement is full of PII.
- `llm_audit` is the queryable trail: token spend per tier, failure/refusal rates,
  circuit trips, latency p95.

---

## 9. Module 4 — grounded AI follow-up (`POST /ai/ask`)

- Body `{ code, question }`. Load the `tax_process` by code; continue the OpenAI
  conversation from `analysisResponseId`, appending the question.
- System prompt enforces: personal income tax under NTA 2025 only; refuse out-of-scope
  (VAT, corporate, business tax) politely → `refused: true`; cite the relevant NTA 2025
  section inline; **never produce a number the calculator didn't** (post-check against
  `computation`); always end with the disclaimer.
- Append the exchange to `chatMessages`, bump `lastInteractionAt`, write `llm_audit(tier=chat)`.
- Response shape unchanged: `{ answer, citations[], refused, disclaimer }` (matches the
  existing `AskAiResult` frontend type).

---

## 10. Env additions (`apps/main-backend/src/env.ts`)

```
OPENAI_API_KEY            required (the AI features need it; degrade gracefully if absent in dev)
OPENAI_GATE_MODEL         default "gpt-4o-mini"
OPENAI_ANALYSIS_MODEL     default "gpt-4o"
MONGODB_URI               required
CIRCUIT_FAILURE_THRESHOLD default 5
CIRCUIT_COOLDOWN_MS       default 30000
REAPER_INTERVAL_MS        default 300000
PROCESS_TTL_MS            default 3600000
STATEMENT_MAX_BYTES       default 10485760 (10MB)
```

Remove `ANTHROPIC_API_KEY`.

---

## 11. Open items / risks

- **Restart loses in-flight parses** (in-process async, no queue) — acceptable for v1.5;
  user re-uploads. Revisit with BullMQ if this hurts.
- **Breaker is per-instance** — fine for one process; revisit for horizontal scale.
- **OpenAI structured outputs** must be validated with zod on receipt — the model can
  drift from the schema; treat its output as untrusted until parsed.
- **Cost ceiling** — gate tier caps spend on junk, but consider a per-IP rate limit on
  `/parse` (currently no rate limiting anywhere). Flagged, not yet designed.
- **`@taxlens/core` has zero tests today** — before this rides on the engine's output,
  the engine needs unit coverage. Recommend tackling that first.
