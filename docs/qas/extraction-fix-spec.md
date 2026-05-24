# Fix spec — statement extraction: misclassified income (A) + partial-period estimates (B)

**Audience:** full-stack dev
**Author:** QA
**Date:** 2026-05-24
**Found via:** real Kuda upload, process code `56830836` (UI showed "Exempt — you owe nothing"
on a statement with ₦1.6M of credits).
**Touches:** backend pipeline (`apps/main-backend`), `@taxlens/core` view/types,
`docs/api-docs.md`, and the upload + result UI (`apps/taxlens-web`).

> **STATUS: ✅ IMPLEMENTED (2026-05-24).** Product decisions taken: **A2** → dedicated
> `needs_review` status (not a flag); **A3** → new persisted `POST /statement/:code/recompute`
> (keeps the AI grounded); **B3** → show both the annual estimate and the period-scoped line.
> All of A1/A2/A3 and B1/B2/B3/B4 landed.
> - **A1** — `ANALYSIS_SYSTEM` rewritten to bias ambiguous/recurring credits toward income; `transfer` reserved for clearly non-income.
> - **A2** — pipeline lands on `needs_review` when `grossAnnualKobo === 0 && Σ inflows > 0`; UI shows a "which of these are income?" review (warn banner) instead of the exempt chip; result also guards the exempt chip for zeroed statements.
> - **A3** — `inflows-confirm` checkboxes drive a real recompute via `useRecomputeStatement`; gross = Σ selected, persisted server-side.
> - **B1/B2** — result headline framed as an estimate naming the source + a confidence note keyed to `periodConfidence` (low/medium/high from `monthsCovered`).
> - **B3** — secondary "tax attributable to the N uploaded months" line.
> - **B4** — `monthsCovered: 0`/unknown → `periodConfidence: low` → "couldn't determine the period" note; no false precision.
> - Shared: `ProcessStatus += needs_review`, `StatementProcessView += periodConfidence, inflowsSumKobo`, `periodConfidenceFor()` in `@taxlens/core`. Engine math unchanged (no regression).
> Retest checklist at the bottom of this doc still applies.

---

## TL;DR

A real ₦1.6M statement produced **₦0 income → "exempt, you owe nothing."** Two independent
defects upstream of the (correct) tax engine:

- **A — misclassification:** both real inflows were tagged `transfer` and silently dropped
  from gross, so income computed as ₦0. A tool that tells an earner they owe nothing is worse
  than a crash.
- **B — partial-period extrapolation with no guard:** the statement covered **1 month**; the
  pipeline annualises (×12) from it with no sanity check and presents the result as hard fact.
  B didn't visibly fire here only because A had already zeroed the income.

The tax engine (`@taxlens/core`) is **correct** — it did the right math on a wrong input.
Both fixes are in the **extract → annualise → present** path.

---

## Evidence (from Mongo + llm_audit, code `56830836`)

```
status: ready · bankName: "Kuda MF Bank" · monthsCovered: 1 · grossAnnualKobo: 0
inflows:
  2026-04-24 | transfer | ₦1,000,000 | "Stac Intercontinental Ltd transfer"
  2026-05-04 | transfer | ₦600,000   | "Abolarinwa Babafemi transfer"
computation.newRegime: taxableIncomeKobo 0 · annualTaxKobo 0 · isExempt true
llm_audit: gate ✅ + analysis ✅, both circuit=closed, NO errors, NO retries
```

The model ran cleanly and *deliberately* returned gross 0: per the analysis prompt it
excludes `transfer`/`other` from income, and it classified both credits as `transfer`.

---

## Fix A — don't silently drop income; make classification recoverable + guard the ₦0 case

The current prompt (`statement.service.ts`) says: *"…annualise the income-bearing inflows
(salary + business)… Exclude transfers and other."* Large, regular credits from
companies/individuals are routinely real income in NG, but get read literally as `transfer`.

**A1 — Tighten the analysis prompt.** Tell the model to treat substantial/recurring credits as
likely income even when the narration says "transfer", and to reserve `transfer` for clearly
non-income movements (refunds, reversals, self-transfers, obvious peer paybacks). Bias toward
*including* ambiguous credits as income rather than dropping them.

**A2 — Never present a serene "exempt" when income was effectively dropped.** Add a guard:
if `grossAnnualKobo === 0` **but** the sum of all extracted inflows is meaningfully > 0,
do **not** render the calm "Exempt — you owe nothing" result. Instead surface a clear state:
> "We couldn't identify any taxable income — every credit was read as a transfer. Review the
> inflows below and mark any that are actually income."

**A3 — Make the inflows table actually recompute (currently transparency-only).** On the
ready/confirm screen the user already sees each credit with its classification. Let them
**re-mark** a `transfer` as `salary`/`business`; recompute gross from the user's selection and
re-run the tax computation on confirm. (Today toggling does nothing to the result — see
`inflows-confirm.tsx`; this is the single most user-empowering fix.)

> A1 reduces how often it happens; A2 stops the dangerous silent-exempt outcome; A3 gives the
> user a way out when the model still gets it wrong. Do all three; A2 is the minimum to ship.

---

## Fix B — keep the annual computation, but present it as an estimate scoped to the data

**Why we can't just "tax the uploaded months literally."** Nigerian PIT is an *annual* tax with
*annual* bands (first ₦800k/yr at 0%, then 15%, …). So:

- Running a 3-month *total* through the annual bands (option "literal") makes a real earner
  look exempt — the same harmful under-reporting as bug A, via a different route. **Don't do this.**
- The band/rate that applies *depends on the annual figure*, so finding the right rate requires
  annualising. We can't escape that.

**So: keep annualising to get the rate right, but never present it as a hard fact — frame it by
the data behind it.** Concretely:

- **B1 — Headline stays the annual estimate** (legally meaningful), but the framing names the
  source: e.g. *"Based on **2 months** of statements (₦1.6M of income), your estimated **annual**
  income is ~₦9.6M and annual tax ~₦X."*
- **B2 — Confidence note keyed to `monthsCovered`:**
  - `1` month → ⚠️ *"Estimated from a single month. Income varies month to month — upload 3–12 months for a more reliable estimate."*
  - `2–11` months → *"Estimated by scaling N months to a full year. Most accurate when your income is steady."*
  - `12` months → *"Based on a full year — most reliable."*
- **B3 (optional)** — also show a secondary, clearly-labeled line: *"Estimated tax attributable
  to the uploaded N months: ~₦(annualTax × N/12)."* So the user sees both the honest period
  figure and the annual projection.
- **B4 — Sanity floor:** at `monthsCovered: 0` (or if the model can't determine it), don't
  annualise — show "we couldn't determine the period this statement covers."

> Principle: the engine still computes an annual position (the bands demand it); the **UI never
> states it as fact** — it's an estimate explicitly scoped to `monthsCovered`, with a matching
> confidence note. This makes B explicit and testable instead of a silent ×12.

---

## Where each change lands

### Backend (`apps/main-backend`)
- `features/statement/statement.service.ts`
  - **A1:** revise `ANALYSIS_SYSTEM` prompt (transfer-vs-income guidance).
  - **A2:** after analysis, if `grossAnnualKobo === 0` and `Σ inflows.amountKobo > 0`, set a
    flag the view can expose (e.g. `status: 'ready'` + a `needsReview: true`, or a distinct
    `failureReason`-style note) so the UI can branch. Decide the exact shape with the FE.
- Consider carrying **`monthsCovered`** through to the view (already present) and a derived
  `periodConfidence` (`low | medium | high`) so the FE doesn't re-derive thresholds.

### Shared types (`@taxlens/core`)
- Extend `StatementProcessView` for whatever A2/B expose (e.g. `needsReview?: boolean`,
  `periodConfidence?: 'low'|'medium'|'high'`). Keep it in `@taxlens/core` so FE/BE don't drift
  (this is the shared-view contract the seam checklist guards).

### UI (`apps/taxlens-web`)
- `features/income/screen/parts/inflows-confirm.tsx` — **A3:** allow re-classifying a row;
  recompute on confirm (call `/tax/compare` with the user-adjusted gross, or a new endpoint).
- `features/result/screen/parts/tax-position.tsx` (+ `what-changed.tsx`) — **B1/B2:** add the
  source framing + a confidence note driven by `monthsCovered`/`periodConfidence`; **A2:** the
  "no income identified" state instead of the exempt chip when `needsReview`.
- `features/result/screen/parts/` — **B3 (optional):** the secondary "tax for uploaded period" line.

### Docs (`docs/api-docs.md`)
- Document any new `StatementProcessView` fields (`needsReview`, `periodConfidence`).
- Note that `grossAnnualKobo` is an **annualised estimate scoped to `monthsCovered`**, not a
  declared figure — and that a 0 gross with non-zero inflows means "needs review", not "exempt".

---

## Decisions needed from you (product)

1. **A2 shape:** reuse `ready` + a `needsReview` flag, or a dedicated status? (FE branches on it.)
2. **B3:** show the secondary "tax for the uploaded N months" line, or annual-estimate-only?
3. **A3 recompute:** reuse `/tax/compare` with adjusted gross, or add a statement-scoped
   recompute endpoint that keeps the process `code` (so the AI panel stays grounded)?

---

## Severity & QA status

- **A → P1.** A real earner shown "exempt, you owe nothing" is a confidently-wrong, harmful
  result. (Was previously logged as out-of-scope "extraction accuracy"; this real case
  escalates it — the *product* has no guardrail.)
- **B → P2.** Latent until A is fixed; then a 1-month upload silently extrapolates ×12 with no
  warning.
- The tax engine and the pipeline plumbing are **not** at fault — verified correct.

**Retest after fix:**
- Re-upload the same Kuda statement → must NOT show a calm "exempt"; either income is counted
  (A1) or the review state appears (A2), and the user can reclassify (A3).
- 1-month statement with real salary → annual headline carries the low-confidence note (B2);
  numbers still match `@taxlens/core`.
- Confirm the engine math is unchanged for a normal 12-month / manual input (no regression).
