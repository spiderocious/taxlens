# QA Handoff — TaxLens web screens (Frontend)

**Date:** 2026-05-24
**Build:** Typecheck ✅ · Lint ✅ · Build ✅ (`pnpm nx run-many -t typecheck lint build`)
**Frontend URL:** http://localhost:5173
**Backend:** http://localhost:8090 (`pnpm -F @taxlens/main-backend dev`; needs MongoDB on 27017; `OPENAI_API_KEY` for the upload + AI paths)
**Seed account:** none — TaxLens has no accounts.

> Money everywhere is rendered from integer **kobo** (1 NGN = 100 kobo). Every computed number carries an "Estimate · NTA 2025" framing and a "Not tax advice" disclaimer.

---

## Flow at a glance

```
Landing (/)  ──sample──────────────▶ Result (/result)        [stateless, instant]
            ──manual──▶ Income (/income?path=manual) ──compute──▶ Result
            ──upload──▶ Income (/income?path=upload) ──pipeline──▶ Result
```

State (profile, manual draft, computed result, statement code) lives in one **IncomeProvider** (React Context), so switching paths never loses entries and `/result` reads the computed data without refetching. "Start over" (top bar, appears once a session exists) clears it via a hold-to-confirm critical modal.

---

## 1. Landing — `/`

**File:** `src/features/landing/screen/landing-screen.tsx`
**Gate:** always visible.

The user must be able to:
- see the headline "See what you actually pay under the new tax law." and the "Nothing is stored." lede.
- see three path cards: **Try with sample data**, **Enter income manually**, **Upload bank statement**.
- **View sample** → seeds a salary-earner sample (computed client-side) and lands on `/result` immediately, no backend call.
- **Enter income** → `/income?path=manual`.
- **Upload statement** → `/income?path=upload`.
- see a "Not tax advice" disclaimer at the foot.

| Action | Expected |
|---|---|
| Click "View sample" | navigates to `/result`, full result rendered (sample salary earner) |
| Click "Enter income" | `/income?path=manual`, profile step shown |
| Click "Upload statement" | `/income?path=upload`, profile step shown |

---

## 2. Income — `/income?path=manual|upload`

**File:** `src/features/income/screen/income-screen.tsx` (parts under `screen/parts/`)
**Gate:** always visible. `?path` defaults to `manual` when absent/unknown.

### Shared — profile step
- Three options (`ProfilePicker`): **Salary earner**, **Freelancer / self-employed**, **Mixed**.
- The income form (manual or upload) is **hidden until a profile is selected**.
- Profile selection persists when switching `path` (provider state).

### 2a. Manual (`?path=manual`)
On this screen the user must be able to:
- enter **Gross income** (`MoneyField`, ₦ prefix, mono figures) with a **Per year / Per month** segmented toggle (the suffix shows `/yr` or `/mo`; monthly is ×12 on compute).
- enter five reliefs (all optional): **Annual rent paid, Pension, NHIS, NHF, Life insurance/annuity**.
- see the "Nothing is stored" callout.
- click **See my tax position** — disabled until gross > 0; shows a loading state during the call.

| Trigger | Expected |
|---|---|
| Compute success | navigates to `/result` with the computed comparison |
| Compute validation error (400/1001) | inline `ErrorState` shows the backend `errorMessage` (one field at a time); **not** a toast |
| Compute other error | inline `ErrorState`: "We couldn't compute that. Please check your figures…" |
| Switch to `?path=upload` then back | gross + reliefs still populated |

**Edge cases to verify:**
- Gross "0" or empty → button disabled.
- Enter a decimal like `840000.50` → backend rejects (`1001`), inline error names the field. (Frontend sends kobo via `parseNairaToKobo`, which rounds; verify the error path by forcing an invalid value.)
- Commas in input (e.g. `8,400,000`) are accepted (parser strips non-digits).

### 2b. Upload (`?path=upload`)

**Stages:** dropzone → uploading → live pipeline → (ready → confirm) | failed.

- **Dropzone** (`statement-dropzone.tsx`): drag-and-drop or click to choose. Accepts **PDF only, ≤10 MB**.
  - Non-PDF → inline "That isn't a PDF…" (client guard, no upload).
  - >10 MB → inline "That file is over 10 MB…" (client guard).
  - "Your statement is never stored" callout shown.
- **Uploading / pipeline** (`upload-flow.tsx`): a 4-step `Stepper` (Uploaded → Checking statement → Reading inflows → Ready) driven by **SSE** (`subscribeStatementEvents`) with the **poll** hook as durable fallback. Shows `bankName` / `monthsCovered` as they arrive.
- **Failed**: `ErrorState` with the server `failureReason` + "Try another file" (resets to dropzone).
- **Ready** (`inflows-confirm.tsx`): `InflowsTable` of extracted credits.
  - Salary + business are **pre-selected** (matches the server's income total).
  - Toggling rows updates the live total; if it diverges from the server's `grossAnnualKobo`, an info `Banner` explains the result uses the server figures.
  - **See my tax position** → `/result` with the process's computation + `code` (enables the AI panel).

| Trigger | Expected |
|---|---|
| Upload non-PDF / too-large | inline error, no request sent |
| Upload accepted | 202 → stepper begins, status advances live |
| Status `failed` | error state + retry |
| Status `ready` | inflows table + confirm |
| Process code expired (404/1004 after 1h idle) | poll surfaces it; treat as start-over |

> **LLM stub for QA:** run backend with `LLM_MODE=stub`. Upload a file named `salary.pdf` → happy path to `ready` (Kuda MFB, 6 months, ₦15,000,000 gross). `reject.pdf` → `failed`. `fail.pdf` → upstream error. See `docs/api-docs.md` → "LLM transport mode".

---

## 3. Result — `/result`

**File:** `src/features/result/screen/result-screen.tsx` (parts under `screen/parts/`)
**Gate:** needs a computed comparison in the provider; otherwise an `EmptyState` ("No result yet") with a "Start here" button → `/`.

### Module 2 — Tax position (`tax-position.tsx`)
- "Exempt — you owe nothing" save-chip **only when** `isExempt`.
- Hero `ResultCard`: estimated **annual tax**, effective-rate subline, rows for monthly tax + take-home (year/month).
- Three `StatTile`s: effective rate (%), taxable income, total reliefs (save tone).
- **Band breakdown** (`BandLadder`): one rung per band; first slice labelled tax-free; bands with no income dimmed as untouched. Statute citation below.
- **Reliefs applied**: one `ReliefCard` per applied relief (only reliefs > 0 appear).

### Module 3 — What changed (`what-changed.tsx`)
- `OldVsNew`: old PITA tax vs new NTA 2025 tax side by side.
- `DeltaCallout`: plain-language net change — "You save ₦X a year" (good/sage) or "You pay ₦X more a year" (bad/amber) or "unchanged".
- One `Callout` per relevant reform point.

### Module 4 — AI follow-up (`ai-panel.tsx`)
**Only rendered when a `statementCode` exists** (sample/upload). Manual compute is stateless → no panel (by design; the backend can't ground an answer without a process code).
- Question `Textarea` (≤2000 chars) + suggestion chips + **Ask** button (disabled when empty/pending).
- On success: serif answer, `CitationBlock`(s), italic disclaimer. Refusals show an "Out of scope" info chip and a calm message.

| Trigger | Expected |
|---|---|
| Ask success | answer + citations + disclaimer |
| Refusal (`refused: true`) | "Out of scope" chip + polite message |
| `422 / 1008` | warn banner: "couldn't ground that cleanly — try rephrasing" |
| `503 / 1007` | warn banner: "assistant is briefly unavailable…" |
| `404 / 1004` (expired) | warn banner: "result has expired. Start over…" |

> The AI panel is testable today via the **sample** and **upload** flows (both carry a `code`). With `LLM_MODE=stub`, a question containing "VAT" → refusal; `LLM_STUB_CHAT=nonconforming` → `422`.

---

## 4. How this works — `/how-it-works`  ·  5. About — `/about`

**Files:** `src/features/about/screen/how-it-works-screen.tsx`, `about-screen.tsx`
**Gate:** always visible (top-bar links).

- **How this works:** the live NTA 2025 band table (read from `@taxlens/core`, can't drift), a `MethodologyList` of how the number is reached, and a "why the first ₦800k is free" callout.
- **About:** build rationale — pain, what was built, what was cut, known limitations + disclaimer.

---

## Cross-cutting behaviour

| Check | Expected |
|---|---|
| Top bar | brand + Start / How it works / About links (SPA nav, no reload); active link highlighted |
| Step rail | shown on Income (step 1) and Result (step 2); hidden on explainer pages |
| "Start over" | appears only once a session exists; opens a **critical hold-to-confirm** modal; on confirm wipes state + returns to `/` |
| Errors | inline (`ErrorState`/`Banner`), keyed off numeric `errorCode` (never `errorMessage` text) |
| Empty/loading | loading via Suspense fallback on route load + per-action loading states; `/result` with no data → empty state |
| Mobile | layouts are single-column on small screens (grids collapse) — verify at 375px |
| Money | mono tabular figures; ₦ mark de-emphasised; no floating-point artifacts |

## Route registration

| Route | Screen | Notes |
|---|---|---|
| `/` | LandingScreen | lazy; fallback for unknown paths |
| `/income` | IncomeScreen | reads `?path=manual\|upload` |
| `/result` | ResultScreen | reads computed comparison from provider |
| `/how-it-works` | HowItWorksScreen | |
| `/about` | AboutScreen | |
| `/preview` | PreviewScreen | internal design-system gallery (not user-facing) |

All registered in `src/app.routes.tsx`; all lazy-loaded. `IncomeProvider` wraps the router in `src/app.provider.tsx`.

---

## Out of scope (this build)

- [ ] **Download result as PDF** (Module 2) — the `ExportRow` primitive exists but no PDF generation is wired.
- [ ] **Client-side reclassification recompute** — the inflows table is a confirmation/transparency view; toggling does not re-run the tax engine (the result uses the server's grounded computation so the AI panel stays consistent).
- [ ] **AI panel on the manual path** — manual compute is stateless (no `code`); only sample/upload results expose the panel.
- [ ] **"Mixed" profile field differences** — all profiles currently show the same manual fields.
- [ ] Automated tests (Vitest/RTL) for these screens — not added this pass.
