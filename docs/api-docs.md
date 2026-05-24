# TaxLens API — main-backend

**Base URL:** `http://localhost:8090`
**Prefix:** all endpoints live under `/api/v1`
**Content type:** `application/json` (except `POST /statement/parse` → `multipart/form-data`, and `GET /statement/:code/events` → `text/event-stream`)
**Auth:** none. TaxLens has no accounts. State is keyed by an opaque 8-digit `code`.
**Money:** every money field is **integer kobo** (1 NGN = 100 kobo). Decimals are rejected.

---

## Response envelopes

### Success

```json
{ "data": { /* payload */ } }
```

Optionally with `meta`:

```json
{ "data": { /* payload */ }, "meta": { /* ... */ } }
```

`204 No Content` has **no body** — do not parse it.

### Error (flat)

```json
{
  "errorCode": 1001,
  "errorMessage": "grossAnnualKobo: Number must be greater than or equal to 0",
  "type": "validation_error",
  "field": "grossAnnualKobo"
}
```

| Field | Type | Notes |
|---|---|---|
| `errorCode` | number | **Switch on this.** 1001–1009 (table below). Stable. |
| `errorMessage` | string | Human-readable. **Not stable** — never switch on it. |
| `type` | string | Class of error (table below). |
| `field` | string? | Validation errors only — the single field in error. |

> **Clients must key off `errorCode`** (numeric), never `errorMessage` (text can change).

### Error codes

| `errorCode` | `type` | HTTP | Meaning |
|---|---|---|---|
| `1001` | `validation_error` | 400 | Payload / request validation failed. `field` is set. |
| `1002` | `auth_error` | 401 | Unauthorized. *(reserved — unused in v1.5)* |
| `1003` | `auth_error` | 403 | Forbidden. *(reserved)* |
| `1004` | `not_found_error` | 404 | Resource / route does not exist. |
| `1005` | `conflict_error` | 409 | State conflict (e.g. invalid status transition, code collision). |
| `1006` | `rate_limit_error` | 429 | Too many requests. Includes `Retry-After` header. *(reserved)* |
| `1007` | `upstream_error` | 503 | A dependency is down (OpenAI unreachable, circuit open, key missing). May include `Retry-After`. |
| `1008` | `processing_error` | 422 | A job/pipeline ran but failed for a domain reason. |
| `1009` | `internal_error` | 500 | Extreme, unreconcilable error. No internals leaked. |

### One-field-at-a-time validation

When several fields are invalid, the API returns **exactly one** field error at a time
(the shallowest path, then alphabetical). The client fixes it, resubmits, and the next
field's error surfaces. Example: a body with both `profileType` and `grossAnnualKobo`
invalid returns `grossAnnualKobo` first ("g" < "p" at the same depth).

---

## Conventions

- **Request ID:** every response carries `x-request-id` (echoed from the request or generated). Send your own `x-request-id` to correlate logs.
- **CORS:** allowed origin is `WEB_BASE_URL` (default `http://localhost:5173`).
- **Body limit:** JSON bodies are capped at 1 MB — over that → `413 / 1001`. A malformed JSON body → `400 / 1001` (not a 500). PDF uploads are capped at `STATEMENT_MAX_BYTES` (default 10 MB) via multipart.
- **Unknown fields:** request bodies are strict — an unexpected/misspelled field → `400 / 1001`.

---

# Endpoints

## 1. `GET /api/v1/health`

Liveness probe.

**Request:** none.

**`200 OK`**
```json
{
  "data": {
    "status": "ok",
    "service": "main-backend",
    "env": "development",
    "time": "2026-05-24T10:48:25.211Z"
  }
}
```

| Code | When |
|---|---|
| 200 | always (process is up) |

---

## 2. `POST /api/v1/tax/compute` — NTA 2025 position only (Module 2)

Stateless. Computes the new-regime position for an income declaration.

**Request body** (`application/json`)

```json
{
  "profileType": "salary_earner",
  "grossAnnualKobo": 1500000000,
  "reliefs": {
    "annualRentKobo": 120000000,
    "pensionKobo": 0,
    "nhisKobo": 0,
    "nhfKobo": 0,
    "lifeInsuranceKobo": 0
  }
}
```

| Field | Type | Rules |
|---|---|---|
| `profileType` | enum | `salary_earner` \| `freelancer` \| `mixed` |
| `grossAnnualKobo` | int | ≥ 0, integer kobo |
| `reliefs.annualRentKobo` | int | ≥ 0 |
| `reliefs.pensionKobo` | int | ≥ 0 |
| `reliefs.nhisKobo` | int | ≥ 0 |
| `reliefs.nhfKobo` | int | ≥ 0 |
| `reliefs.lifeInsuranceKobo` | int | ≥ 0 |

**`200 OK`** — `data` is a `TaxComputation`:

```json
{
  "data": {
    "regime": "nta_2025",
    "grossAnnualKobo": 1500000000,
    "totalReliefsKobo": 24000000,
    "appliedReliefs": [
      { "key": "rent_relief", "label": "Rent relief (20% of rent, capped ₦500k)", "amountKobo": 24000000 }
    ],
    "taxableIncomeKobo": 1476000000,
    "annualTaxKobo": 252960000,
    "monthlyTaxKobo": 21080000,
    "takeHomeAnnualKobo": 1247040000,
    "takeHomeMonthlyKobo": 103920000,
    "effectiveRate": 0.16864,
    "isExempt": false,
    "bands": [
      { "lowerKobo": 0, "upperKobo": 80000000, "rate": 0, "amountInBandKobo": 80000000, "taxKobo": 0 }
      /* ...one entry per band... */
    ]
  }
}
```

| Code | `errorCode` | When |
|---|---|---|
| 200 | — | success |
| 400 | 1001 | invalid body (one field at a time) |
| 500 | 1009 | unexpected error |

---

## 3. `POST /api/v1/tax/compare` — both regimes + comparison (Module 3)

Same request body as `/tax/compute`.

**`200 OK`** — `data` is a `RegimeComparison`:

```json
{
  "data": {
    "newRegime":  { /* TaxComputation, regime: "nta_2025" */ },
    "oldRegime":  { /* TaxComputation, regime: "pita_old" */ },
    "netChangeKobo": 45000000,
    "direction": "saves",
    "relevantReforms": [
      { "id": "cra_abolished", "title": "CRA replaced by rent relief", "explanation": "…" }
    ]
  }
}
```

`direction` ∈ `saves` | `pays_more` | `no_change`. `netChangeKobo` = oldTax − newTax (positive ⇒ saving under NTA 2025).

| Code | `errorCode` | When |
|---|---|---|
| 200 | — | success |
| 400 | 1001 | invalid body |
| 500 | 1009 | unexpected error |

---

## 4. `POST /api/v1/statement/parse` — upload + start parse (Module 1)

**`multipart/form-data`.** Uploads a Nigerian bank-statement PDF and starts the two-tier
AI parse pipeline. Returns an 8-digit `code` **immediately** (202) — the pipeline runs
in the background. Track it via SSE (§5) or polling (§6).

**Request** (`multipart/form-data`)

| Part | Type | Rules |
|---|---|---|
| `file` | file | **required.** `application/pdf` only. ≤ `STATEMENT_MAX_BYTES` (10 MB default). |
| `profileType` | text | `salary_earner` \| `freelancer` \| `mixed` |

```bash
curl -X POST http://localhost:8090/api/v1/statement/parse \
  -F 'file=@statement.pdf;type=application/pdf' \
  -F 'profileType=salary_earner'
```

**`202 Accepted`**
```json
{ "data": { "code": "84729103", "status": "pending" } }
```

| Code | `errorCode` | When |
|---|---|---|
| 202 | — | accepted; pipeline started |
| 400 | 1001 | no file (`field: "file"`), non-PDF (`field: "file"`), file too large (`field: "file"`), bad `profileType` |
| 500 | 1009 | unexpected error |

> The pipeline itself never fails this request — a bad statement surfaces later as
> `status: "failed"` on the process (§6), **not** as an HTTP error here.

---

## 5. `GET /api/v1/statement/:code/events` — live status (SSE)

**`text/event-stream`.** Pushes a `status` event on every pipeline transition, then closes
on a terminal status (`ready` / `failed`). The current state is emitted immediately on
connect, so a late subscriber is in sync. A heartbeat comment (`: ping`) is sent every
~15 s. Subscribing counts as an interaction (resets the 1-hour idle clock).

**Path param:** `code` — exactly 8 digits.

**Stream frames**

```
event: status
data: {"code":"84729103","status":"validating","profileType":"salary_earner","createdAt":"…","updatedAt":"…"}

event: status
data: {"code":"84729103","status":"analyzing","profileType":"salary_earner","bankName":"GTBank","monthsCovered":6,"createdAt":"…","updatedAt":"…"}

event: status
data: {"code":"84729103","status":"ready", … "inflows":[…],"grossAnnualKobo":1500000000,"computation":{…}}

: ping
```

Each `data` payload is a **`StatementProcessView`** (§ schema below).

| Code | `errorCode` | When |
|---|---|---|
| 200 | — | stream opened (SSE) |
| 400 | 1001 | `code` not 8 digits |
| 404 | 1004 | no process for that code (e.g. expired/reaped) |

> EventSource auto-reconnects on network drops. Pair SSE with the poll endpoint (§6) as the durable fallback.

---

## 6. `GET /api/v1/statement/:code` — poll status (durable fallback)

Returns the current process by code. Counts as an interaction (resets idle clock).

**Path param:** `code` — exactly 8 digits.

**`200 OK`** — `data` is a `StatementProcessView`. Shape depends on `status`:

`pending` / `validating`:
```json
{ "data": { "code": "84729103", "status": "validating", "profileType": "salary_earner", "createdAt": "…", "updatedAt": "…" } }
```

`analyzing` (gate passed, bank identified):
```json
{ "data": { "code": "84729103", "status": "analyzing", "profileType": "salary_earner", "bankName": "GTBank", "monthsCovered": 6, "createdAt": "…", "updatedAt": "…" } }
```

`failed`:
```json
{ "data": { "code": "84729103", "status": "failed", "profileType": "salary_earner", "failureReason": "Not a usable Nigerian bank statement", "createdAt": "…", "updatedAt": "…" } }
```

`ready`:
```json
{
  "data": {
    "code": "84729103",
    "status": "ready",
    "profileType": "salary_earner",
    "bankName": "GTBank",
    "monthsCovered": 6,
    "inflows": [
      { "id": "inflow_0", "date": "2026-01-31", "description": "SALARY JAN", "amountKobo": 125000000, "classification": "salary" }
    ],
    "grossAnnualKobo": 1500000000,
    "computation": { /* RegimeComparison */ },
    "createdAt": "…",
    "updatedAt": "…"
  }
}
```

| Code | `errorCode` | When |
|---|---|---|
| 200 | — | success |
| 400 | 1001 | `code` not 8 digits |
| 404 | 1004 | no process for that code |

---

## 6b. `POST /api/v1/statement/:code/recompute` — reclassify income (Module 1)

The user reviewed the extracted credits and chose which ones count as income.
Recomputes `grossAnnualKobo` as the **sum of the selected inflows**, re-runs the tax engine,
**persists** the new gross + computation to the process (so a later `/ai/ask` stays grounded
on the corrected numbers), and returns the updated view. Resolves a `needs_review` process to
`ready`. Counts as an interaction.

**Path param:** `code` — exactly 8 digits.
**Request body** (`application/json`)

```json
{ "inflowIds": ["inflow_0", "inflow_2"] }
```

| Field | Type | Rules |
|---|---|---|
| `inflowIds` | string[] | ids of the inflows to count as income. `[]` is valid (= none). Each must exist on the process. Unknown fields rejected (`.strict()`). |

**`200 OK`** — `data` is the updated `StatementProcessView` (`status: "ready"`, recomputed
`grossAnnualKobo` + `computation`).

| Code | `errorCode` | When |
|---|---|---|
| 200 | — | success |
| 400 | 1001 | `code` not 8 digits, body not `{ inflowIds: string[] }`, or an unknown inflow id (`field: "inflowIds"`) |
| 404 | 1004 | no process for that code |

---

## 7. `POST /api/v1/ai/ask` — grounded follow-up (Module 4)

Asks a question about a computed process. The server holds the context (keyed by `code`)
and continues the OpenAI conversation from the analysis turn. The model is constrained to:
personal income tax under NTA 2025 only; refuse out-of-scope (VAT, corporate, business);
cite the relevant NTA 2025 section; **never invent a number** the calculator didn't
produce; always end with a disclaimer. Counts as an interaction.

**Request body** (`application/json`)

```json
{ "code": "84729103", "question": "Why is my effective rate so low?" }
```

| Field | Type | Rules |
|---|---|---|
| `code` | string | exactly 8 digits |
| `question` | string | 1–2000 chars |

**`200 OK`** — `data` is an `AskAiResult`:

```json
{
  "data": {
    "answer": "Your effective rate is low because the first ₦800,000 of taxable income is taxed at 0% …",
    "citations": [
      { "section": "NTA 2025, Fourth Schedule", "snippet": "Income up to ₦800,000 — 0%" }
    ],
    "refused": false,
    "disclaimer": "This is an estimate, not tax advice. For complex situations, consult a tax professional."
  }
}
```

Out-of-scope question:
```json
{
  "data": {
    "answer": "I can only help with personal income tax under the NTA 2025. For VAT or company tax, please consult a tax professional.",
    "citations": [],
    "refused": true,
    "disclaimer": "…"
  }
}
```

| Code | `errorCode` | When |
|---|---|---|
| 200 | — | success (including a polite refusal — `refused: true`) |
| 400 | 1001 | invalid body (bad `code`, empty/too-long `question`, or unknown field) |
| 404 | 1004 | no process for that code |
| 422 | 1008 | the model answered but couldn't produce a grounded, schema-conforming response (after one repair retry) — rephrase and retry. **Not** an outage; does not trip the breaker. |
| 503 | 1007 | OpenAI genuinely unavailable, circuit open, or `OPENAI_API_KEY` missing. May carry `Retry-After`. |
| 500 | 1009 | unexpected error |

> **Contract vs. outage:** a model turn that fails the response schema (or comes back
> empty) is retried once, then surfaced as `422/1008` — distinct from a real upstream
> outage (`503/1007`). This keeps non-conforming output from being mistaken for downtime
> and from spuriously opening the circuit breaker.

---

# Schemas

### `TaxComputation`
| Field | Type | Notes |
|---|---|---|
| `regime` | `"nta_2025" \| "pita_old"` | |
| `grossAnnualKobo` | int | kobo |
| `totalReliefsKobo` | int | kobo |
| `appliedReliefs` | `AppliedRelief[]` | reliefs with amount > 0 |
| `taxableIncomeKobo` | int | kobo |
| `annualTaxKobo` | int | kobo |
| `monthlyTaxKobo` | int | kobo |
| `takeHomeAnnualKobo` | int | kobo |
| `takeHomeMonthlyKobo` | int | kobo |
| `effectiveRate` | number | annualTax / gross (0–1) |
| `isExempt` | boolean | `annualTaxKobo === 0` |
| `bands` | `TaxBand[]` | band-by-band breakdown |

### `TaxBand`
`{ lowerKobo: int, upperKobo: int | null, rate: number, amountInBandKobo: int, taxKobo: int }` — `upperKobo: null` = top open-ended band.

### `AppliedRelief`
`{ key: string, label: string, amountKobo: int }`

### `RegimeComparison`
`{ newRegime: TaxComputation, oldRegime: TaxComputation, netChangeKobo: int, direction: "saves" | "pays_more" | "no_change", relevantReforms: ReformPoint[] }`

### `ReformPoint`
`{ id: string, title: string, explanation: string }`

### `StatementInflow`
`{ id: string, date: string (ISO 8601), description: string, amountKobo: int, classification: "salary" | "business" | "transfer" | "other" }`

### `StatementProcessView`
| Field | Type | Present when |
|---|---|---|
| `code` | string | always |
| `status` | `pending \| validating \| analyzing \| ready \| needs_review \| failed` | always |
| `profileType` | enum | always |
| `failureReason` | string | `status: failed` |
| `bankName` | string | after gate passes |
| `monthsCovered` | int | after gate passes |
| `periodConfidence` | `low \| medium \| high` | with `monthsCovered` — `1`/unknown→low, `2–11`→medium, `12`→high |
| `inflows` | `StatementInflow[]` | `ready` / `needs_review` |
| `inflowsSumKobo` | int | with `inflows` — sum of ALL credits (income or not) |
| `grossAnnualKobo` | int | `ready` / `needs_review` (**annualised estimate** scoped to `monthsCovered`, not a declared figure) |
| `computation` | `RegimeComparison` | `ready` / `needs_review` |
| `createdAt` | string (ISO 8601) | always |
| `updatedAt` | string (ISO 8601) | always |

> **`needs_review`** — analysis ran but counted **no** income (`grossAnnualKobo: 0`) while
> `inflowsSumKobo > 0`: every credit was read as a transfer. The data is ready to show, but
> a `0` gross with non-zero inflows means **"needs review", not "exempt"** — the client must
> route the user to reclassify (see `POST /statement/:code/recompute`), never present an
> exemption.

### `AskAiResult`
`{ answer: string, citations: { section: string, snippet: string }[], refused: boolean, disclaimer: string }`

---

# Pipeline & lifecycle (for integrators)

```
POST /parse ──▶ 202 { code }
                  │ (in-process, async)
   status: pending → validating → analyzing → ready          (inflows + computation set)
                          │            │   └──▶ needs_review  (income zeroed; user reclassifies)
                          │            │            │
                          │            │            └─ POST /:code/recompute ─▶ ready
                          └────────────┴──────▶ failed (failureReason set)
```

- **Status state machine** (server-owned; client-sent status is never trusted):
  `pending → validating | failed`; `validating → analyzing | failed`;
  `analyzing → ready | failed`; `ready` and `failed` are terminal.
- **Tier 1 (gate, gpt-4o-mini):** validates the PDF is a usable Nigerian bank statement
  (cost firewall). Invalid ⇒ `failed` without running the expensive model.
- **Tier 2 (analysis, gpt-4o):** extracts + classifies inflows, annualises income.
- **Tax engine (`@taxlens/core`):** computes every number. The LLM never produces a tax figure.
- **Idle expiry:** a process (and its audit) is deleted **1 hour** after its last
  interaction (upload, poll, SSE subscribe, AI ask). A reaper job sweeps every 5 min.
  After expiry, `:code` endpoints return `404 / 1004`.
- **Circuit breaker:** opens after 5 consecutive OpenAI failures; while open, AI calls
  fast-fail with `503 / 1007` + `Retry-After`; a half-open probe runs after a 30 s cooldown.
- **Audit:** every OpenAI call is logged (model, tokens, latency, prompt hash, circuit
  state). No raw statement text or PDF bytes are ever stored or logged.

---

# LLM transport mode (QA / CI)

`LLM_MODE` selects the transport behind `llmClient.structured()`. The seam lives entirely
inside `lib/llm/openai-client.ts`; no route or service changes between modes.

| `LLM_MODE` | Behaviour |
|---|---|
| `openai` (default) | Real OpenAI API. Non-deterministic output. Use for the one live smoke pass. |
| `stub` | Deterministic in-process fake. **Rejected at boot in production.** Same breaker + `llm_audit` + schema validation path as real, so those tests stay meaningful. |

**Stub steering** (only read when `LLM_MODE=stub`):

| Lever | Effect |
|---|---|
| upload `salary.pdf` (or any other name) | happy path → `ready` with fixed `bankName: "Kuda MFB"`, `monthsCovered: 6`, 2 known inflows, `grossAnnualKobo: 1500000000` |
| upload `reject.pdf` | gate returns invalid → `status: failed` (`"Not a usable Nigerian bank statement"`) |
| upload `fail.pdf` | throws upstream error → counts as a breaker failure |
| `/ai/ask` question containing "VAT", or `LLM_STUB_CHAT=refuse` | `refused: true` |
| `LLM_STUB_CHAT=nonconforming` | chat returns output that fails the schema → repair-retry → `422/1008` (does NOT trip the breaker) |
| `LLM_STUB_ANALYSIS=all_transfer` | analysis tags every credit as transfer, gross 0 → `status: needs_review` (exercises the A2 path) |
| `LLM_STUB_FAIL_TIMES=N` | next N LLM calls throw — drives the circuit breaker open |
| `LLM_STUB_UNCONFIGURED=true` | simulates a missing key → `503 / 1007` without unsetting the real key |

Stub `responseId` is stable (`stub_<tier>_<code>`) and threads `previousResponseId` for chat
continuity. Token counts are `0` in stub mode (cost accounting is not simulated).
```
