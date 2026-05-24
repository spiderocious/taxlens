# Backend QA Test Plan — Whole Backend (Tax + Statement parse + Grounded AI)

> **QA:** Claude
> **Date:** 2026-05-24
> **Scope:** Entire main-backend HTTP surface — `/health`, `/tax/compute`, `/tax/compare`
> (Modules 2 & 3, engine-verified), `/statement/parse` + SSE + poll (Module 1),
> `/ai/ask` (Module 4), the status state machine, circuit breaker, idle reaper, error
> envelope, and PII/audit guarantees.
> **Handoff:** `docs/qas/backend/statement-ai-handoff.md`
> **API doc:** `docs/api-docs.md`
> **LLM seam:** `docs/qas/backend/plans/llm-stub-seam-spec.md`
> **Source reviewed:** `app.ts`, `env.ts`, `lib/errors.ts`, `middlewares/errorHandler`,
> `lib/response.ts`, `features/{tax,statement,ai,health}/*`, `lib/llm/{openai-client,
> stub-transport,circuit-breaker}.ts`, `lib/mongo/{client,tax-process.repository,
> llm-audit.repository}.ts`, `jobs/reaper.job.ts`, `@taxlens/core` (`tax/{bands,compute}`,
> `types`).

---

## Environment & Setup

| Item | Value |
|------|-------|
| Base URL | `http://localhost:8090/api/v1` |
| Auth | none (v1.5 — keyed by opaque 8-digit `code`) |
| Success envelope | `{ "data": … , "meta"? }` |
| Error envelope (flat) | `{ "errorCode", "errorMessage", "type", "field"? }` |
| Mongo | `mongodb://localhost:27017`, db `taxlens` (collections `tax_processes`, `llm_audit`) |
| Sample PDF | `/Users/feranmi/codebases/2026/dockito/personal/bank-statement.pdf` (real, 293 KB) |

### Two run modes (both required)

The LLM seam (`lib/llm/openai-client.ts`) selects transport by `LLM_MODE`. Run the suite
**twice**:

| Mode | Boot | Use for | Assertion style |
|------|------|---------|-----------------|
| **STUB** (primary, deterministic) | `LLM_MODE=stub pnpm -F @taxlens/main-backend dev` | The bulk: all values are fixed and assertable. Steered by PDF filename + env. | **Exact** values |
| **LIVE** (one smoke pass) | `LLM_MODE=openai pnpm -F @taxlens/main-backend dev` (real key + real PDF, both in place) | Prove the real OpenAI integration: real upload → `ready`, one real `/ai/ask`. | **Structural** only (status, shape, `refused`, no-invented-number) — real output varies |

> Stub and live run through the **same** breaker + audit + schema-validation shell, so the
> breaker / audit / PII / state-machine cases are identical in both. Only the *values*
> differ. Cases tagged **[LIVE]** also run once against `LLM_MODE=openai`; everything else
> is STUB unless noted.

### Stub steering levers (verified in source — `stub-transport.ts`)

| Lever | Effect |
|-------|--------|
| upload `filename=salary.pdf` (or anything not below) | gate happy → analysis happy → `ready` |
| upload `filename=reject.pdf` | gate `valid:false` → `failed`, reason "Not a usable Nigerian bank statement" |
| upload `filename=fail.pdf` | transport throws → pipeline `failed` (breaker failure) |
| `/ai/ask` question contains "VAT" **or** `LLM_STUB_CHAT=refuse` | `refused: true` |
| `LLM_STUB_FAIL_TIMES=N` | next N LLM calls throw (trip breaker), then succeed |
| `LLM_STUB_UNCONFIGURED=true` | every LLM call throws → simulates missing key (503/1007) |

> **Note (multer):** the uploaded *part* filename is set with `;filename=salary.pdf` in the
> multipart form — multer puts it on `file.originalname`, which the route passes to the
> pipeline. The on-disk source file is always the real `bank-statement.pdf`; only the
> declared part-filename steers the stub.

### Stub deterministic fixtures (from `stub-transport.ts`)

- Gate happy: `bankName: "Kuda MFB"`, `monthsCovered: 6`.
- Analysis happy: 2 inflows (`SALARY JAN` / `SALARY FEB`, `125_000_000` kobo each, `salary`),
  `grossAnnualKobo: 1_500_000_000`.
- Chat answer: cites `NTA 2025, Fourth Schedule`, `refused:false`.
- Chat refuse: empty citations, `refused:true`.

### Pre-flight (run before every session)

1. Mongo up: `mongosh --quiet --eval 'db.runCommand({ping:1}).ok'` → `1`.
2. Boot backend in the target mode; confirm `GET /health` → `200 { data.status:"ok" }`.
3. (STUB) Confirm the happy path reaches `ready` end-to-end (smoke):
   upload `salary.pdf` → poll `:code` → `status:"ready"`, `grossAnnualKobo:1500000000`.
   *(verified working 2026-05-24)*
4. Note the git SHA under test.

---

## Verified Ground Truth (engine — `@taxlens/core`, built dist, 2026-05-24)

Every computed number below was produced by the **actual engine**, not hand-math. The
plan asserts these exactly. **The stub `ready` path uses gross `1_500_000_000`, reliefs all
zero** (the pipeline starts reliefs at 0 — the user adds them later via `/tax/compare`).

| Input (kobo) | new annualTax | old annualTax | netChange | direction | new taxable | new isExempt |
|---|---|---|---|---|---|---|
| gross `1_500_000_000`, reliefs 0 **(stub ready)** | `258_000_000` | `262_400_000` | `4_400_000` | `saves` | `1_500_000_000` | false |
| gross `1_500_000_000`, rent `120_000_000` **(doc example)** | `252_960_000` | — | — | — | `1_476_000_000` | false |
| gross `80_000_000` (₦800k), reliefs 0 | `0` | — | — | — | `80_000_000` | **true** |
| gross `80_000_100` (₦800,001), reliefs 0 | `15` | — | — | — | `80_000_100` | false |
| gross `0`, reliefs 0 | `0` | `0` | `0` | `no_change` | `0` | true |
| gross `10_000_000_000`, reliefs 0 (top band) | `2_293_000_000` | — | — | — | `10_000_000_000` | false |

- NTA new-regime bands taxKobo for the stub input: `0, 33_000_000, 162_000_000, 63_000_000, 0, 0`.
- Rent relief caps at `50_000_000` kobo (rent `300_000_000` → 20% = `60_000_000`, capped).
- `profileType` does **not** change any number (engine ignores it for bands/reliefs) —
  `salary_earner`, `freelancer`, `mixed` all yield identical tax for the same gross/reliefs.
- `monthlyTaxKobo = round(annualTaxKobo/12)`; `effectiveRate = annualTax/gross` (0 when gross 0).

---

## Static Findings (pre-execution code review)

### DIV-01 — `/tax/compute` worked example in `api-docs.md` is stale 🟢 P3
**File:** `docs/api-docs.md` §2 example. **Doc claims** `annualTaxKobo: 168200000`,
`monthlyTaxKobo: 14016667`, `effectiveRate: 0.11213` for gross `1_500_000_000` + rent
`120_000_000`. **Engine actually returns** `252_960_000` / `21_080_000` / `0.16864`
(verified against built `@taxlens/core`). The engine is internally consistent (bands sum
correctly); the **doc example is wrong**. No code change — doc fix. Confirmed at runtime in
TC-CMP-07.

### OBS-01 — `compareRegimes` `zero_band` reform relevance looks inverted ℹ️ verify
**File:** `packages/core/src/tax/compute.ts:138`. The `zero_band` reform ("First ₦800,000 is
tax-free") is included only when `newRegime.taxableIncomeKobo <= 800_000*100 || isExempt`.
So a high earner (taxable ≫ ₦800k) — for whom the tax-free band is *still relevant* and
most reassuring — does **not** see it, while exactly the people whose entire income is
tax-free do. For the stub `ready` input, `relevantReforms` = `cra_abolished, nin_tax_id`
(no `zero_band`). This may be intended (only surface it to low earners) or inverted logic.
**Flag for product confirmation** — verified behaviorally in TC-CMP-08, not auto-failed.

### OBS-02 — No `.strict()` on any request schema ℹ️ low
**Files:** `tax.schema.ts`, `statement.schema.ts`, `ai.schema.ts`. Unknown body fields are
**silently dropped**, not rejected. Consistent across all endpoints (so not a divergence),
but worth noting: a client typo (`grosssAnnualKobo`) won't 400 — it'll be treated as a
missing field instead. Verified in TC-VAL-08.

### OBS-03 — `run.md` is stale ℹ️ doc
`docs/run.md` still describes v1 ("stateless, no DB") and references `ANTHROPIC_API_KEY`.
The v1.5 reality (Mongo + `OPENAI_API_KEY` + `LLM_MODE`) is correct in the handoff and
`api-docs.md`. Doc drift only.

### Source audit — clean ✅
- Every async route handler is wrapped in `asyncHandler` (incl. SSE). No unhandled-rejection risk.
- No direct `res.json()` / `res.send()` outside `ResponseUtil` (except the documented SSE
  raw-write and the 404 fallthrough). Envelope is centralised.
- `pickSingleIssue` sort (shallowest path → alphabetical) confirmed to produce
  `grossAnnualKobo` before `profileType` (matches handoff). Nested order:
  `gross → profile → reliefs.annualRentKobo → reliefs.pensionKobo`.
- Status transitions guarded centrally in `taxProcessRepository.advance` via
  `VALID_TRANSITIONS`; same-state advance is an idempotent no-op (not a 409).
- Reaper is an explicit job (not a Mongo TTL index); purges `llm_audit` alongside.

---

## Section 1 — Health (`GET /health`)

| ID | Test | Expected |
|----|------|----------|
| H-01 | Liveness | `200`, `data.status="ok"`, `data.service="main-backend"`, `data.time` is ISO 8601 |
| H-02 | `x-request-id` echoed | Send `x-request-id: qa-h-02` → response header `x-request-id: qa-h-02` |
| H-03 | `x-request-id` generated | Omit header → response still carries a generated `x-request-id` |
| H-04 | Helmet headers present | `x-content-type-options`, `x-frame-options` (or CSP) present on the response |

---

## Section 2 — `POST /tax/compute` (Module 2, NTA 2025 only)

### Happy / computation correctness (assert against engine ground-truth)

| ID | Input (kobo) | Expected |
|----|--------------|----------|
| CMP-01 | gross `1_500_000_000`, reliefs 0 | `200`; `regime="nta_2025"`; `annualTaxKobo=258_000_000`; `taxableIncomeKobo=1_500_000_000`; `monthlyTaxKobo=21_500_000`; `effectiveRate≈0.172`; `isExempt=false` |
| CMP-02 | gross `80_000_000`, reliefs 0 | `200`; `annualTaxKobo=0`; `isExempt=true` (exempt boundary — taxable exactly ₦800k) |
| CMP-03 | gross `80_000_100`, reliefs 0 | `200`; `annualTaxKobo=15`; `isExempt=false` (₦1 over the free band, taxed 15%) |
| CMP-04 | gross `0`, reliefs 0 | `200`; `annualTaxKobo=0`; `effectiveRate=0`; `isExempt=true` (no divide-by-zero) |
| CMP-05 | gross `10_000_000_000`, reliefs 0 | `200`; `annualTaxKobo=2_293_000_000`; top band `upperKobo=null`, `amountInBandKobo=5_000_000_000` |
| CMP-06 | gross `1_500_000_000`, rent `300_000_000` | `200`; `appliedReliefs[rent_relief].amountKobo=50_000_000` (20% capped at ₦500k); `totalReliefsKobo=50_000_000` |
| CMP-07 | gross `1_500_000_000`, rent `120_000_000` | `200`; `annualTaxKobo=252_960_000` (**not** the doc's 168200000 — confirms **DIV-01**); `totalReliefsKobo=24_000_000` |
| CMP-09 | `profileType="freelancer"`, gross `1_500_000_000`, reliefs 0 | `200`; `annualTaxKobo=258_000_000` (identical to CMP-01 — profileType doesn't change numbers) |
| CMP-10 | `bands` array shape | `200`; exactly 6 bands; `bands[0].rate=0`; band `taxKobo` values `[0,33_000_000,162_000_000,63_000_000,0,0]`; `Σ bands.taxKobo === annualTaxKobo` |
| CMP-11 | `appliedReliefs` excludes zeros | gross `1.5e9`, only `pensionKobo=5_000_000` set → `appliedReliefs` length 1, contains `pensionKobo` only (zero reliefs filtered out) |

### Validation (one-field-at-a-time — assert `errorCode:1001`, `type:"validation_error"`, exact `field`)

| ID | Body | Expected `field` |
|----|------|------------------|
| VAL-01 | `{}` (empty) | `200`? No → `400`; first error on `profileType` (shallowest, "p" before reliefs/gross? — **see note**) |
| VAL-02 | gross `-5` (negative), valid rest | `400`, `field="grossAnnualKobo"` |
| VAL-03 | gross `1.5` (decimal) | `400`, `field="grossAnnualKobo"` (Zod int) |
| VAL-04 | gross `"1000"` (string) | `400`, `field="grossAnnualKobo"` |
| VAL-05 | `profileType="x"` | `400`, `field="profileType"` |
| VAL-06 | missing `reliefs` entirely | `400`, `field="reliefs"` (or first nested required) |
| VAL-07 | `reliefs.pensionKobo=-1`, rest valid | `400`, `field="reliefs.pensionKobo"` |
| VAL-08 ⭐ | **two bad fields:** `profileType="x"` AND `grossAnnualKobo:-5` | `400`, `field="grossAnnualKobo"` only (g<p). Then fix gross, resubmit with `profileType="x"` → `400`, `field="profileType"` |
| VAL-09 | extra unknown field `{…valid, foo:"bar"}` | `200` — extra silently dropped (confirms **OBS-02**, no `.strict()`) |
| VAL-10 | body is not JSON / malformed | `400` (express json parse → error envelope) |
| VAL-11 | JSON body > 1 MB | `400`/`413` — confirm it does not 500 |

> **VAL-01 note:** with an empty body, `profileType`, `grossAnnualKobo`, and `reliefs` are
> all "required" at depth 1. The sort is alphabetical at equal depth → `grossAnnualKobo`
> surfaces first. Assert the actual first field and record it; the contract is "exactly one
> field", not a specific one for the empty case.

---

## Section 3 — `POST /tax/compare` (Module 3, both regimes)

| ID | Input (kobo) | Expected |
|----|--------------|----------|
| CMR-01 | gross `1_500_000_000`, reliefs 0 | `200`; `newRegime.annualTaxKobo=258_000_000`; `oldRegime.annualTaxKobo=262_400_000`; `netChangeKobo=4_400_000`; `direction="saves"` |
| CMR-02 | `netChange` formula | `netChangeKobo === oldRegime.annualTaxKobo - newRegime.annualTaxKobo` |
| CMR-03 | gross `0` | `200`; `netChangeKobo=0`; `direction="no_change"`; both regimes `isExempt=true` |
| CMR-04 | regimes tagged | `newRegime.regime="nta_2025"`, `oldRegime.regime="pita_old"` |
| CMR-05 | old-regime CRA relief | gross `1.5e9` → `oldRegime.totalReliefsKobo=320_000_000` (₦200k + 20% gross), `oldRegime.taxableIncomeKobo=1_180_000_000` |
| CMR-06 | a `pays_more` case (if reachable) | find a gross where new > old (low incomes where CRA beats the ₦800k band); assert `direction="pays_more"`, `netChangeKobo<0`. If none exists across the range, mark **N/A** with the swept range. |
| CMR-07 | `relevantReforms` always includes `cra_abolished` | array contains `{id:"cra_abolished"}` |
| CMR-08 | `relevantReforms` for stub input | gross `1.5e9` → ids = `cra_abolished, nin_tax_id` (**no `zero_band`** — records **OBS-01** behaviorally) |
| CMR-09 | validation parity with compute | reuses `IncomeInputSchema` → VAL-02..VAL-09 behave identically (spot-check 2) |

---

## Section 4 — `POST /statement/parse` (Module 1, upload)

### Accept / 202

| ID | Test | Expected |
|----|------|----------|
| PAR-01 | Valid PDF + `profileType` (filename `salary.pdf`) | `202`; `data.code` matches `^\d{8}$`; `data.status="pending"` |
| PAR-02 | Mongo doc created | After PAR-01, `tax_processes` has one doc with that `code`, `status` in {pending,validating,…}, `profileType` set, `createdAt/updatedAt/lastInteractionAt` present |
| PAR-03 | Each upload → unique code | Two uploads → two distinct codes, two docs |
| PAR-04 | `profileType=freelancer` / `mixed` | `202`; stored `profileType` matches |

### Upload validation (assert `400 / 1001`, exact `field`)

| ID | Test | Expected |
|----|------|----------|
| PAR-05 | non-PDF (e.g. `.png`, `type=image/png`) | `400 / 1001`, `field="file"` (multer fileFilter → MulterError) |
| PAR-06 | PDF part but `profileType` missing | `400 / 1001`, `field="profileType"` |
| PAR-07 | PDF part but `profileType="x"` | `400 / 1001`, `field="profileType"` |
| PAR-08 | multipart with **no `file` part** (profileType only) | `400 / 1001`, `field="file"` ("a PDF file is required") |
| PAR-09 | file > `STATEMENT_MAX_BYTES` (set `STATEMENT_MAX_BYTES=1024`, upload the 293 KB PDF) | `400 / 1001`, `field="file"`, message "exceeds the maximum allowed size" |
| PAR-10 | two files in the form (`files:1` limit) | `400 / 1001`, `field="file"` (multer LIMIT_FILE_COUNT) |
| PAR-11 | empty/0-byte PDF (`type=application/pdf`) | passes multer (mimetype ok) → `202`; pipeline later fails at gate or analysis. Document actual terminal status |
| PAR-12 | `Content-Type: application/json` (not multipart) | `400 / 1001`, `field="file"` (no file parsed) — confirm not a 500 |

### Pipeline outcomes (STUB — steer by filename)

| ID | Test | Expected (poll until terminal) |
|----|------|--------------------------------|
| PAR-13 | happy `salary.pdf` | terminal `status="ready"`; `bankName="Kuda MFB"`; `monthsCovered=6`; `inflows.length=2`; `grossAnnualKobo=1_500_000_000`; `computation.newRegime.annualTaxKobo=258_000_000` |
| PAR-14 | gate reject `reject.pdf` | terminal `status="failed"`; `failureReason="Not a usable Nigerian bank statement"`; **no** `inflows`/`computation`; tier-2 never ran (only 1 gate audit row) |
| PAR-15 | upstream throw `fail.pdf` | terminal `status="failed"`; `failureReason` = "We could not process this statement" or the AI-unavailable variant; pipeline caught the throw (no crash) |
| PAR-16 | unconfigured (`LLM_STUB_UNCONFIGURED=true`) `salary.pdf` | terminal `status="failed"` (gate throws as missing-key) |
| PAR-17 [LIVE] | real PDF, `LLM_MODE=openai` | terminal `status="ready"`; `bankName` non-empty; `monthsCovered≥1`; `inflows` is an array; `grossAnnualKobo` integer ≥ 0; `computation` present and `Σbands===annualTax` for both regimes. **Structural only.** |

---

## Section 5 — `GET /statement/:code/events` (SSE)

| ID | Test | Expected |
|----|------|----------|
| SSE-01 | Subscribe right after upload (`salary.pdf`) | receives `event: status` frames advancing `…→ analyzing → ready`; `analyzing` frame carries `bankName`+`monthsCovered`; `ready` frame carries `inflows`+`grossAnnualKobo`+`computation`; stream **closes** after `ready` |
| SSE-02 | Each `data:` is a `StatementProcessView` | every frame parses as JSON with `code`,`status`,`profileType`,`createdAt`,`updatedAt`; no server-only fields (`gateResponseId`,`analysisResponseId`,`chatMessages`,`lastInteractionAt`) |
| SSE-03 | Connect **after** already `ready` | one `status` frame with the full ready result, then immediate close (TERMINAL short-circuit) |
| SSE-04 | Connect after already `failed` (`reject.pdf`) | one `status` frame `status:"failed"` with `failureReason`, then close |
| SSE-05 | `:code` not 8 digits (`/statement/abc/events`) | `400 / 1001` (CodeParamSchema) — JSON error, not a stream |
| SSE-06 | Unknown 8-digit code | `404 / 1004` |
| SSE-07 | Heartbeat | for a long-running (non-terminal) process, a `: ping` comment arrives ~15 s after connect (use `LLM_STUB_FAIL_TIMES` won't help — instead inspect against a process held in `analyzing`; if not reproducible deterministically, **SKIP** with note) |
| SSE-08 | Subscribe bumps idle clock | after subscribing, `tax_processes.lastInteractionAt` for that code is newer than before |
| SSE-09 | Content-Type | response header `Content-Type: text/event-stream`, `Cache-Control: no-cache` |

---

## Section 6 — `GET /statement/:code` (poll)

| ID | Test | Expected |
|----|------|----------|
| POL-01 | Poll a `pending`/`validating` process | `200`; `data` has `code`,`status`,`profileType`,`createdAt`,`updatedAt`; **no** `inflows`/`computation` yet |
| POL-02 | Poll an `analyzing` process | `200`; `data` adds `bankName`+`monthsCovered`; still no `inflows`/`computation` |
| POL-03 | Poll a `ready` process | `200`; `data` has `inflows`, `grossAnnualKobo`, `computation` (full); values match PAR-13 |
| POL-04 | Poll a `failed` process | `200`; `data.status="failed"`, `failureReason` set; no `inflows`/`computation` |
| POL-05 | `:code` not 8 digits | `400 / 1001` |
| POL-06 | Unknown 8-digit code | `404 / 1004`, `type="not_found_error"` |
| POL-07 | View excludes server-only fields | response never contains `gateResponseId`,`analysisResponseId`,`chatMessages`,`lastInteractionAt`,`_id` |
| POL-08 | Dates are ISO 8601 strings | `createdAt`,`updatedAt`,`inflows[].date` are ISO strings (not epoch/Date objects) |
| POL-09 | Empty arrays not null | a `ready` process with an analysis yielding 0 inflows returns `inflows: []` not `null` (covered structurally; stub always has 2 — confirm shape via type) |
| POL-10 | Poll bumps idle clock | `lastInteractionAt` advances after a poll |

---

## Section 7 — `POST /ai/ask` (Module 4, grounded follow-up)

> Pre-req: a `ready` process `code` from PAR-13 (stub) or PAR-17 (live).

| ID | Test | Expected |
|----|------|----------|
| AI-01 | Valid in-scope question (stub) | `200`; `data.answer` non-empty; `data.refused=false`; `data.citations` has ≥1 `{section,snippet}`; `data.disclaimer` = the fixed disclaimer string |
| AI-02 | Out-of-scope question contains "VAT" (stub) | `200`; `data.refused=true`; `data.citations=[]`; answer is the redirect line; **no tax figure** in the answer |
| AI-03 | `LLM_STUB_CHAT=refuse` forces refusal | `200`; `refused=true` regardless of question |
| AI-04 | No-invented-number guarantee | answer text contains no NGN/kobo figure absent from the process `computation`. Stub answer is fixed & compliant; **for LIVE (AI-15)** assert structurally |
| AI-05 | Chat persisted | after AI-01, `tax_processes.chatMessages` for that code has 2 new entries (user + assistant); `analysisResponseId` updated to the chat responseId |
| AI-06 | Continuity threaded | stub assistant `responseId` encodes the prior id (`stub_chat_<code>_from_…`) — confirms `previousResponseId` flowed from the analysis turn (inspect via a 2nd ask or audit) |
| AI-07 | Ask bumps idle clock | `lastInteractionAt` advances after an ask |
| AI-08 | `code` not 8 digits | `400 / 1001`, `field="code"` |
| AI-09 | `question` empty (`""`) | `400 / 1001`, `field="question"` (min 1) |
| AI-10 | `question` > 2000 chars | `400 / 1001`, `field="question"` (max 2000); 2000 exactly → ok |
| AI-11 | missing `question` | `400 / 1001`, `field="question"` |
| AI-12 | two bad fields (`code:"abc"`, `question:""`) | `400 / 1001`, single `field` — `code` first (depth equal, "c"<"q") |
| AI-13 | unknown but valid-format `code` | `404 / 1004` |
| AI-14 | ask before `ready` (process still `analyzing`) | `200` — server allows it; `computation` context is whatever exists (may be null). Document actual behavior; the answer must still not invent numbers |
| AI-15 [LIVE] | real `/ai/ask` on a real ready process | `200`; `refused=false`; `citations` non-empty with an NTA 2025 section; `disclaimer` present; **answer contains no number not in `computation`** (manual structural check) |
| AI-16 | unconfigured (`LLM_STUB_UNCONFIGURED=true`) | `503 / 1007`, `type="upstream_error"` |

---

## Section 8 — Status state machine (`taxProcessRepository.advance`)

> Client-sent status is never accepted (no endpoint takes a status). These verify the
> **internal** guard. Drive via pipeline outcomes + (where needed) a direct repo script.

| ID | Test | Expected |
|----|------|----------|
| SM-01 | Forward chain | `pending→validating→analyzing→ready` observed across a happy parse (via SSE/poll snapshots) |
| SM-02 | `validating→failed` | gate reject (`reject.pdf`) lands `failed` directly from validating (analyzing never seen) |
| SM-03 | Terminal is sticky | a `ready` process never transitions again; re-emitting `ready` is an idempotent no-op (not 409) |
| SM-04 | Illegal transition → 409/1005 | via a repo-level harness: force `advance(code,'ready')` on a `pending` doc → `ConflictError` (409/1005). (Not reachable via HTTP — script-level) |
| SM-05 | Same-state advance no-op | `advance(code, currentStatus)` returns the doc unchanged, no throw |

---

## Section 9 — Circuit breaker (`CIRCUIT_FAILURE_THRESHOLD=5`, cooldown 30 s)

> Boot with a low cooldown for speed where noted (`CIRCUIT_COOLDOWN_MS=3000`). Use
> `LLM_STUB_FAIL_TIMES` and/or `fail.pdf` to force failures. `__resetStub` exists for suites.

| ID | Test | Expected |
|----|------|----------|
| CB-01 | Opens at threshold | with `LLM_STUB_FAIL_TIMES=5`, drive 5 LLM failures (e.g. 5 `/ai/ask` on a ready process, or 5 `fail.pdf` parses) → the 6th AI call fast-fails `503 / 1007` |
| CB-02 | `Retry-After` on open | the `503` from an open circuit carries `Retry-After` (seconds; ≈ remaining cooldown, e.g. 30) |
| CB-03 | Audit records `circuitState:"open"` | `llm_audit` has a row with `circuitState:"open"` and `error:"circuit open"` for the fast-failed call |
| CB-04 | Half-open probe after cooldown | after cooldown elapses, the next call is allowed through (half-open); on success the breaker closes and a subsequent call succeeds normally |
| CB-05 | Half-open re-opens on failure | if the half-open probe fails, breaker re-opens immediately (set `LLM_STUB_FAIL_TIMES` high enough to fail the probe too) |
| CB-06 | Pipeline failure path | 5 consecutive `fail.pdf` parses → all `failed`; AI calls then `503`. (breaker is shared across gate/analysis/chat — confirm cross-tier) |

> **Note:** the breaker is a per-process in-memory singleton — count failures within one
> server lifetime. Restart resets it. Tests must not assume a clean breaker across reboots;
> use `__resetStub` or a fresh boot per CB case.

---

## Section 10 — Idle reaper (TTL)

> Boot with short TTL/interval: `PROCESS_TTL_MS=5000 REAPER_INTERVAL_MS=2000`.

| ID | Test | Expected |
|----|------|----------|
| RP-01 | Idle process reaped | upload, then leave untouched > 5 s; after a sweep, `GET /statement/:code` → `404 / 1004`; Mongo doc gone |
| RP-02 | Audit purged alongside | after RP-01, `llm_audit` rows for that code are also deleted |
| RP-03 | Interaction resets clock | upload, then poll/SSE/ask every ~2 s for ~10 s → process **survives** (each interaction bumps `lastInteractionAt`); stop interacting → reaped on next sweep |
| RP-04 | Reaper doesn't touch fresh | a just-created process (within TTL) is not deleted by a sweep |

---

## Section 11 — Error envelope & cross-cutting

| ID | Test | Expected |
|----|------|----------|
| X-01 | Unknown route | `GET /api/v1/nope` → `404 / 1004`, `type="not_found_error"`, `errorMessage="Route not found"` |
| X-02 | Error shape is flat | every error response is `{errorCode, errorMessage, type, field?}` — **never** nested `{error:{…}}` or `{field_errors}` (the old shape) |
| X-03 | `errorCode` numeric & in range | every error `errorCode` ∈ 1001–1009 and matches its HTTP status per the table |
| X-04 | `field` only on validation errors | `1001` carries `field`; `1004`/`1007` do **not** |
| X-05 | `x-request-id` on every response | success and error alike carry `x-request-id` |
| X-06 | CORS | request with `Origin: http://localhost:5173` → `Access-Control-Allow-Origin` echoes it; a disallowed origin is not reflected |
| X-07 | Wrong method on a route | `GET /tax/compute` (it's POST) / `DELETE /ai/ask` → `404` (no route) — confirm consistent, not 500 |
| X-08 | 500 leaks nothing | force an internal error if reachable (e.g. Mongo down mid-request) → `500 / 1009`, `errorMessage="An unexpected error occurred"`, no stack/internal in body |

---

## Section 12 — PII / audit (the privacy guarantee)

| ID | Test | Expected |
|----|------|----------|
| PII-01 | No raw statement in logs | capture server stdout during a parse; grep for `base64`, `file_data`, `JVBER` (PDF magic), `data:application/pdf` → **0 hits**. (Smoke confirmed 0 on 2026-05-24) |
| PII-02 | No PII tokens in logs | grep logs for `nin`, `bvn`, and any account-number-like 10-digit runs from the statement → none |
| PII-03 | `llm_audit.promptHash` is a hash | every `llm_audit` row has `promptHash` = 32-hex chars, **not** prompt text; no `system`/`user`/PDF content stored |
| PII-04 | Audit fields complete | each row has `code, tier∈{gate,analysis,chat}, model, inputTokens, outputTokens, latencyMs, circuitState, createdAt` |
| PII-05 | `toView` never leaks internals | (cross-ref POL-07) response views exclude all server-only fields |
| PII-06 [LIVE] | Re-confirm PII-01/02 with the **real** PDF + real OpenAI call | 0 hits — the real path attaches the PDF base64 to OpenAI but must not log it |

---

## Section 13 — Boot / config guards

| ID | Test | Expected |
|----|------|----------|
| BOOT-01 | `LLM_MODE=stub` rejected in prod | boot with `NODE_ENV=production LLM_MODE=stub` → process exits with "LLM_MODE=stub is not allowed in production" |
| BOOT-02 | Missing required env | boot without `MONGODB_URI` (or `APP_BASE_URL`) → exits with "Invalid environment variables" listing the missing key |
| BOOT-03 | Mongo unreachable at boot | point `MONGODB_URI` at a dead host → boot fails fast (≤ ~5 s, serverSelectionTimeout), does not hang |
| BOOT-04 | `boolFromEnv` parsing | `LLM_STUB_UNCONFIGURED=false` → treated as false (not coerced true); `=true` → true |

---

## Test Execution Order

1. **STUB boot** (default TTL/cooldown): Sections 1, 2, 3, 11, 12, 13 (no LLM timing needed).
2. Statement happy/reject/fail + SSE + poll + AI (Sections 4, 5, 6, 7, 8) — STUB.
3. **Short-cooldown boot** (`CIRCUIT_COOLDOWN_MS=3000`): Section 9 (breaker).
4. **Short-TTL boot** (`PROCESS_TTL_MS=5000 REAPER_INTERVAL_MS=2000`): Section 10 (reaper).
5. **LIVE boot** (`LLM_MODE=openai`, real key + real PDF): PAR-17, AI-15, PII-06 only.

> Run reaper and breaker sections on **dedicated boots** so their env overrides don't bleed
> into other sections, and so the in-memory breaker starts clean.

---

## Test Count

| Section | Cases |
|---------|------:|
| 1 Health | 4 |
| 2 /tax/compute | 21 |
| 3 /tax/compare | 9 |
| 4 /statement/parse | 17 |
| 5 SSE | 9 |
| 6 Poll | 10 |
| 7 /ai/ask | 16 |
| 8 State machine | 5 |
| 9 Circuit breaker | 6 |
| 10 Reaper | 4 |
| 11 Error envelope | 8 |
| 12 PII / audit | 6 |
| 13 Boot guards | 4 |
| **Total** | **119** |

---

## Out of Scope (this engagement)

- **Automated vitest suite** — this plan is executed via a Node `fetch`/`mongosh` harness
  (`docs/qas/backend/scripts/`), not a committed test suite. The handoff already lists the
  vitest suite as deferred; recommend it next (engine unit tests + handler contract tests).
- **Rate limiting** on `/statement/parse` — not implemented (`1006` reserved/unused). Cannot
  test what doesn't exist; flagged as a risk below.
- **Durable job queue / restart-mid-parse** — pipeline is in-process; a restart loses
  in-flight jobs. Tested only as a documented limitation (not a pass/fail case).
- **Horizontal scale** — breaker + SSE bus are per-instance; multi-instance behavior is out
  of scope (single instance only).
- **Real LLM output quality** — for LIVE cases we assert structure and the no-invented-number
  guarantee, **not** extraction accuracy (whether the model read every inflow correctly).
- **Frontend / `@taxlens/api` wiring** — backend only.

## Risks (what could break that this plan does not fully cover)

- **No rate limit on a paid endpoint:** `/statement/parse` triggers OpenAI calls with no
  throttle — an abuse/cost risk in production. Out of scope to *fix*, but called out.
- **`zero_band` reform relevance (OBS-01):** if the inverted-looking logic is a bug, the
  comparison view shows the wrong reform set to most users. Behavioral test CMR-08 records
  current behavior; product must confirm intent.
- **In-process breaker/SSE state:** under real multi-instance deploy, breaker counts and SSE
  delivery diverge per instance — not reproducible in a single-instance test.
- **`PAR-11`/`PAR-12` (empty/edge uploads):** terminal status depends on how the real model
  reacts to a degenerate PDF; documented, not asserted exactly, in LIVE mode.
