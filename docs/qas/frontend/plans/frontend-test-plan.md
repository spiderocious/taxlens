# Frontend QA Test Plan — TaxLens web (Landing → Income → Result + explainers)

> **QA:** Claude
> **Date:** 2026-05-24
> **Scope:** Every user-facing screen — Landing (`/`), Income (`/income?path=manual|upload`),
> Result (`/result`), How-it-works (`/how-it-works`), About (`/about`) — plus cross-cutting
> behaviour (top bar, step rail, Start-over critical modal, error/empty/loading states,
> mobile, money rendering). The `/preview` design gallery is **not user-facing → out of scope**.
> **Handoff:** `docs/qas/frontend/qa-frontend-handoff.md`
> **Tool:** `agent-browser` 0.27.0 (real browser; no Playwright, no sub-agents).
> **Frontend:** http://localhost:5173 · **Backend:** http://localhost:8090 (`LLM_MODE=stub` for QA)
> **Source reviewed (FE):** `app.routes`, `app.provider`, `income-provider`, `app-shell`,
> `features/{landing,income,result,about}/**`, `@taxlens/api` (`client`, `endpoints`,
> `types/envelope`, all hooks + `subscribe-statement-events`), `@taxlens/core`
> (`compute`, `money/format-naira`).

---

## Run modes & pre-flight

The browser exercises the **real** stack. Drive the LLM-dependent paths deterministically by
booting the backend with `LLM_MODE=stub` (same seam used in the backend pass). Filename
steering: `salary.pdf` → happy `ready`, `reject.pdf` → `failed`, `fail.pdf` → upstream error;
question containing "VAT" → refusal; `LLM_STUB_CHAT=nonconforming` → `422`.

### Pre-flight (every session)
1. Backend up (stub): `LLM_MODE=stub PORT=8090 pnpm -F @taxlens/main-backend dev` → `curl http://localhost:8090/api/v1/health` = `200`.
2. Mongo up: `mongosh --quiet --eval 'db.runCommand({ping:1}).ok'` → `1`.
3. Frontend up: `pnpm -F @taxlens/taxlens-web dev` → `curl http://localhost:5173` returns `<title>TaxLens NG</title>`.
4. Confirm FE points at the backend: `apps/taxlens-web/.env` → `VITE_API_BASE_URL=http://localhost:8090` (default in `main.tsx`).
5. `agent-browser close --all && agent-browser open http://localhost:5173`.
6. Test PDFs: copy the real statement to steerable names (the *part filename* steers the stub):
   `salary.pdf`, `reject.pdf`, `fail.pdf` (content can be the real `dockito/personal/bank-statement.pdf`).
   For the dropzone client guards also have a `notpdf.png` and a `>10MB.pdf`.

### Verified engine ground-truth (assert these exact figures — built `@taxlens/core`)
- **Sample salary-earner** (the "View sample" seed): new annual tax **₦1,056,840.00**,
  effective rate **12.58%**, taxable **₦7,038,000.00**, total reliefs **₦1,362,000.00**,
  monthly **₦88,070.00**, take-home/yr **₦7,343,160.00**; 3 applied reliefs (rent **₦480,000.00**,
  pension **₦672,000.00**, NHF **₦210,000.00**); old PITA **₦1,145,120.00**; **saves ₦88,280.00/yr**.
- **Stub upload (salary.pdf)** → ready: Kuda MFB, 6 months, gross **₦15,000,000.00**, 2 inflows;
  new annual tax **₦2,580,000.00**, old **₦2,624,000.00**, saves **₦44,000.00/yr**.
- `parseNairaToKobo` strips non-digits and **rounds** (`Math.round(naira*100)`) — see EDGE notes.

---

## Source audit (code-flow) — done before browser. Result: clean ✅

| Area | Finding |
|------|---------|
| Meemaw JSX | No raw `{x && …}` or `.map()` in render — `<Show>`/`<Repeat>` used throughout. ✅ |
| Color tokens | No raw `bg-[#…]`/`text-[#…]`. ✅ |
| Icons | No direct `lucide-react` imports — all via `@icons`. ✅ |
| TS hygiene | No `console.log`, `: any`, `as any`, or non-null `!` assertions in features. ✅ |
| Routing | No inline route strings — `ROUTES` constants used. ✅ |
| Errors | Every handler keys off numeric `errorCode` (`parseApiError`), never `errorMessage` text. ✅ |
| Mutations | `useComputeTax`/`useParseStatement`/`useAskAi` define `mutationFn`; `onError` supplied at each call site (manual-form, upload-flow, ai-panel). ✅ no silent-failure mutations. |

### Findings to verify in-browser

- **FE-DIV-01 (handoff contradiction) — AI panel on the sample path.** `input-path-cards.tsx`
  `startSample()` calls `setResult({ comparison, source: 'sample' })` with **no `statementCode`**.
  `result-screen.tsx` renders `<AiPanel>` only `when={statementCode !== null}`. So the sample
  path produces **no `code` → no AI panel**. But the handoff (§3, and the AI-panel note) says
  the panel "is testable today via the **sample** and upload flows (both carry a `code`)." The
  sample does **not** carry a code. **Verify in-browser (R-AI-06): expect NO panel on sample.**
  Either the handoff is wrong or the sample should seed a code — flag for product.
- **FE-OBS-01 — decimal-rejection edge can't be reproduced from the UI.** Handoff §2a says
  entering `840000.50` makes "the backend reject (1001)". But `parseNairaToKobo` does
  `Math.round(naira*100)` before sending, so `840000.50` → `84000050` kobo (a clean integer) →
  backend **accepts** it (`200`). The inline-validation-error path is therefore **not reachable
  via normal manual input**; the only way the FE shows a `1001` inline error is if the backend
  rejects something the parser passed through (e.g. an enormous value, or a profile/field the
  client didn't sanitize). **Verify M-ERR-01 reflects real behaviour; document the gap.**
- **FE-OBS-02 — `parseNairaToKobo` accepts a lone `-`/`.` as 0, and negatives.** `replace(/[^\d.-]/g,'')`
  keeps `-` and `.`. Input `-5` → `parseFloat('-5')` → `-500` kobo. `hasGross` requires `> 0`, so
  a negative gross keeps the button **disabled** (good) — but a negative *relief* would be sent
  as a negative kobo → backend `1001`. **Verify M-EDGE-04.**

---

## Section L — Landing (`/`)

**File:** `features/landing/screen/landing-screen.tsx` · `parts/input-path-cards.tsx`

| ID | Test | Expected | How |
|----|------|----------|-----|
| L-01 | Headline + lede render | "See what you actually pay under the new tax law." + "Nothing is stored." visible | `eval "document.body.innerText"` |
| L-02 | Three path cards present | "Try with sample data", "Enter income manually", "Upload bank statement" all visible | body text |
| L-03 | Disclaimer at foot | a "Not tax advice"-style disclaimer present | body text |
| L-04 | "View sample" → result | click → URL `/result`, full result rendered (no `/income` step) | `find role button --name "View sample"` click; `wait --url "**/result"`; `get url` |
| L-05 | "Enter income" → manual | click → URL `/income?path=manual`, profile step shown | click; `get url` contains `path=manual` |
| L-06 | "Upload statement" → upload | click → URL `/income?path=upload`, profile step shown | click; `get url` contains `path=upload` |
| L-07 | No backend call for sample | sample computes client-side; with backend **down**, "View sample" still renders a full result | (optional) stop backend, retry L-04 |
| L-08 | Top bar present | brand + Start / How it works / About; "Start over" **absent** (no session yet) | snapshot/body text |

---

## Section M — Income, manual (`/income?path=manual`)

**File:** `income-screen.tsx` · `parts/{profile-step,manual-form}.tsx` · `helpers/draft-to-income.ts`

### Profile gate
| ID | Test | Expected |
|----|------|----------|
| M-01 | Form hidden until profile chosen | on load, gross field **not** present; the 3 profile options are | snapshot before/after |
| M-02 | Pick a profile reveals form | select "Salary earner" → MoneyField "Gross income" + 5 relief fields appear |
| M-03 | Profile persists across path switch | pick profile, switch to `?path=upload`, back to `?path=manual` → profile still selected (provider state) |

### Compute
| ID | Test | Expected |
|----|------|----------|
| M-04 | Button disabled at gross 0/empty | "See my tax position" disabled until gross > 0 | `eval` `.disabled` |
| M-05 | Enter gross → enabled | type `8400000` → button enabled |
| M-06 | Compute success → result | click → loading state, then URL `/result` with computed comparison | `wait --url "**/result"` |
| M-07 | Monthly toggle ×12 | set "Per month", gross `700000` → result equals annual `8,400,000` case (suffix shows `/mo`) | compare result figure |
| M-08 | Commas accepted | enter `8,400,000` → parser strips → computes same as `8400000` |
| M-09 | Reliefs flow through | enter rent `2,400,000`, pension `672,000`, NHF `210,000` → result reliefs match (₦480k/₦672k/₦210k applied) |
| M-10 | Switch path keeps entries | fill gross+reliefs, go `?path=upload`, return → values still populated |

### Errors / edges (manual)
| ID | Test | Expected |
|----|------|----------|
| M-ERR-01 | Validation error inline (not toast) | force a backend `1001` (see FE-OBS-01 — may need an out-of-range value) → inline `ErrorState` with backend `errorMessage`; **no toast** |
| M-ERR-02 | Other error inline | point FE at a dead backend / `500` → inline "We couldn’t compute that. Please check your figures…" |
| M-EDGE-01 | Decimal `840000.50` | **document actual:** parser rounds → sent as integer kobo → backend `200` (NOT a 1001 — FE-OBS-01) |
| M-EDGE-02 | Huge gross (e.g. `99999999999`) | computes or backend-validates; assert no crash, no NaN, money formatting intact |
| M-EDGE-03 | Whitespace / non-numeric gross | button stays disabled (`hasGross` = 0) |
| M-EDGE-04 | Negative relief `-5` typed | parser keeps `-` → `-500` kobo sent → backend `1001` inline error (FE-OBS-02) |
| M-EDGE-05 | Manual result → no AI panel | `/result` after manual compute shows **no** AI panel (stateless, by design) |

---

## Section U — Income, upload (`/income?path=upload`)

**File:** `parts/{upload-flow,statement-dropzone,inflows-confirm}.tsx` · `@taxlens/api` parse/SSE/poll hooks

### Dropzone (client guards — no request sent)
| ID | Test | Expected |
|----|------|----------|
| U-01 | Dropzone renders after profile | "Drop your statement PDF here", "PDF, 3–12 months, up to 10 MB", "never stored" callout |
| U-02 | Non-PDF rejected client-side | choose `notpdf.png` → inline "That isn’t a PDF…"; **no network request** (HAR shows no POST /statement/parse) |
| U-03 | >10 MB rejected client-side | choose a >10 MB file → inline "That file is over 10 MB…"; no request |
| U-04 | Valid PDF accepted | choose `salary.pdf` → "Uploading…" then stepper begins; POST /statement/parse fired (HAR) |

### Pipeline (stub-steered)
| ID | Test | Expected |
|----|------|----------|
| U-05 | Happy → stepper advances | `salary.pdf`: 4-step Stepper progresses Uploaded→Checking→Reading→Ready; bank "Kuda MFB" + "6 months" appear mid-flight | screenshots at states |
| U-06 | Ready → inflows table | reaches `ready` → `InflowsConfirm`: 2 credits, salary pre-selected, total ₦15,000,000.00 |
| U-07 | Confirm → result | "See my tax position" → `/result`, computation rendered, **AI panel present** (has code) |
| U-08 | Reject → failed + retry | `reject.pdf` → `ErrorState` with failureReason + "Try another file" → resets to dropzone |
| U-09 | Upstream fail → failed | `fail.pdf` → failed state (server failureReason) + retry |
| U-10 | SSE drives live updates | with backend up, statuses update without manual reload (SSE); kill SSE → poll fallback still advances (both reach ready) |
| U-11 | Inflows toggle + divergence banner | toggle a row so selected sum ≠ server gross → info Banner "Your selection differs… uses the figures we extracted (₦15,000,000.00/yr)"; result still uses server figure |
| U-12 | Expired code (404/1004) | (hard to force live) poll a reaped/unknown code → treated as start-over; **document** behaviour |

---

## Section R — Result (`/result`)

**File:** `result-screen.tsx` · `parts/{tax-position,what-changed,ai-panel}.tsx` · helpers `format`, `bands-to-rungs`

### Gate / empty
| ID | Test | Expected |
|----|------|----------|
| R-01 | Direct nav with no result | open `/result` cold (no session) → `EmptyState` "No result yet" + "Start here" → `/` |

### Module 2 — tax position (assert sample figures from L-04)
| ID | Test | Expected |
|----|------|----------|
| R-02 | Hero annual tax | "View sample" result shows annual tax **₦1,056,840.00**, subline "12.58% of your gross" (or rounded form) |
| R-03 | Rows | Monthly **₦88,070.00**, take-home year **₦7,343,160.00**, take-home month present |
| R-04 | Stat tiles | Effective rate `12.58`%, Taxable `7,038,000.00`, Total reliefs `1,362,000.00` (save tone) |
| R-05 | Band ladder | one rung per band (6); first slice labelled tax-free; untouched bands dimmed; statute citation below |
| R-06 | Reliefs applied | exactly 3 ReliefCards (rent ₦480,000.00, pension ₦672,000.00, NHF ₦210,000.00); zero reliefs (NHIS, life) **absent** |
| R-07 | Exempt chip only when exempt | sample is NOT exempt → no "Exempt" chip. (Separate: manual gross ₦800k → chip appears, tax ₦0) |

### Module 3 — what changed
| ID | Test | Expected |
|----|------|----------|
| R-08 | Old vs new | OldVsNew shows old **₦1,145,120.00** vs new **₦1,056,840.00** |
| R-09 | Delta callout | "You save ₦88,280.00 a year under NTA 2025." (good/sage tone) |
| R-10 | pays_more tone | (if reachable) a `pays_more` case → "You pay ₦X more…" amber tone. Else document N/A |
| R-11 | Reform callouts | one Callout per relevant reform; sample shows `cra_abolished`, `zero_band`, `nin_tax_id` |

### Module 4 — AI panel
| ID | Test | Expected |
|----|------|----------|
| R-AI-01 | Panel present (upload/code) | from a `salary.pdf` upload result → AI panel renders (Textarea + suggestion chips + Ask) |
| R-AI-02 | Ask in-scope → answer | type a question → answer (serif), ≥1 CitationBlock, italic disclaimer |
| R-AI-03 | Suggestion chip asks | click a suggestion chip → same as typing + Ask |
| R-AI-04 | Out-of-scope refusal | ask "How much VAT do I owe?" → "Out of scope" info chip + calm message (stub: refused) |
| R-AI-05 | Ask disabled when empty | empty textarea → Ask disabled; pending → disabled |
| R-AI-06 ⭐ | **Sample path AI panel** | **FE-DIV-01:** from "View sample" → **NO AI panel** (sample carries no code). Contradicts handoff — record as bug/doc gap |
| R-AI-07 | 422 → rephrase banner | backend `LLM_STUB_CHAT=nonconforming` → warn Banner "couldn’t ground that cleanly — try rephrasing" |
| R-AI-08 | 503 → unavailable banner | force circuit open (backend `LLM_STUB_FAIL_TIMES`) → warn Banner "assistant is briefly unavailable…" |
| R-AI-09 | maxLength 2000 | textarea caps at 2000 chars |

---

## Section E — Explainers

| ID | Test | Expected |
|----|------|----------|
| E-01 | How-it-works renders | `/how-it-works` shows the live NTA 2025 band table (from `@taxlens/core`), methodology list, "first ₦800k free" callout |
| E-02 | Band table matches engine | the 6 bands + rates (0/15/18/21/23/25%) match `NTA_2025_BANDS` |
| E-03 | About renders | `/about` shows pain / built / cut / limitations + disclaimer |
| E-04 | No step rail on explainers | StepRail hidden on `/how-it-works` and `/about` |

---

## Section X — Cross-cutting

| ID | Test | Expected |
|----|------|----------|
| X-01 | Top-bar SPA nav | Start / How it works / About navigate without full reload; active link highlighted | `get url` + no network doc reload |
| X-02 | Step rail on Income+Result | rail shown on `/income` (step 1) and `/result` (step 2); hidden on explainers |
| X-03 | Start-over appears with session | after any result, "Start over" button appears in top bar |
| X-04 | Start-over is hold-to-confirm critical | click → critical modal "Clear everything…"; requires hold; on confirm → state wiped + `/` |
| X-05 | Start-over wipes state | after confirm, `/result` shows EmptyState again (provider reset) |
| X-06 | Unknown route → landing | `/nonsense` → renders LandingScreen (catch-all `*`) |
| X-07 | Loading fallback | route lazy-load shows "Loading…" `role=status` fallback (may be fast) |
| X-08 | Money formatting | all figures mono/tabular, ₦ present, 2 decimals, thousands separators; no floating-point artifacts (e.g. never `₦1,056,839.9999`) |
| X-09 | Mobile 375px | layouts single-column; grids collapse; no overflow | resize viewport, screenshot |
| X-10 | Error envelope keying | (cross-ref) UI reacts to numeric `errorCode`, proven by 422 vs 503 vs 404 showing different banners (R-AI-07/08) |

---

## Execution order
1. Pre-flight (both servers, stub mode, test PDFs).
2. Landing (L) → sample result figures (feeds R-02..R-11 assertions).
3. Manual income (M) incl. error/edge.
4. Upload (U) — happy, reject, fail, inflows, SSE/poll.
5. Result (R) — Modules 2/3/4 incl. the FE-DIV-01 sample-AI check.
6. Explainers (E), Cross-cutting (X), mobile last (don't disturb earlier state).
7. Re-confirm source-audit findings against observed behaviour.

## Screenshots → `docs/qas/frontend/screenshots/` (`landing.png`, `manual-result.png`,
`upload-stepper.png`, `inflows-confirm.png`, `ai-answer.png`, `ai-refusal.png`,
`start-over-modal.png`, `result-empty.png`, `mobile-result.png`, …).

## Test count
| Section | Cases |
|---------|------:|
| L Landing | 8 |
| M Manual | 18 |
| U Upload | 12 |
| R Result | 20 |
| E Explainers | 4 |
| X Cross-cutting | 10 |
| **Total** | **72** |

## Out of scope (per handoff + confirmed in source)
- `/preview` design-system gallery (internal, not user-facing).
- Download-result-as-PDF (`ExportRow` exists, no generation wired).
- Client-side reclassification recompute (inflows toggle is transparency only).
- "Mixed" profile field differences (all profiles show the same manual fields — confirmed in `profile-step.tsx`/`manual-form.tsx`).
- Automated Vitest/RTL component tests (not in this pass).

## Risks
- **FE-DIV-01:** if the sample path is *supposed* to expose the AI panel, it currently can't
  (no code) — a feature gap the handoff masks. Confirm intent.
- **FE-OBS-01:** the "decimal → inline validation error" UX described in the handoff isn't
  reachable through normal input (parser rounds). The inline-error path is real but only
  triggers on values the parser can't sanitize — coverage of that path is thin.
- **SSE behind proxies / reconnection** and **expired-code (404 after 1h idle)** are hard to
  force deterministically in a short session — may end SKIP/documented.
