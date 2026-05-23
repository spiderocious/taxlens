# TaxLens NG — MVP Feature Spec

A personal income tax tool for Nigerians under the Nigeria Tax Act 2025 (effective 1 January 2026).

**Core flow:** user inputs income (manually or via bank statement) → app computes their tax position under NTA 2025 → app shows what changed vs the old regime → user can ask grounded follow-up questions.

## User roles

- **Visitor** — anyone using the tool, no account required for v1.

## Module 1 — Income Input

- Choose an input path on the landing page: **Try with sample data**, **Enter income manually**, or **Upload bank statement**.
- Select a profile type: **Salary earner**, **Freelancer / self-employed**, or **Mixed**.
- Manual entry: gross annual income (or monthly with auto-conversion), employment type, annual rent paid, pension, NHIS, NHF, life insurance premium.
- Upload a Nigerian bank statement (PDF, 3–12 months); the app extracts inflows, classifies them (salary / business / transfer / other), and presents them for confirmation before computing.
- Switch input paths at any time without losing entered data.

## Module 2 — Tax Position Result

- A single result page: exemption status, estimated annual tax, effective rate, monthly tax, take-home (annual + monthly), and a band-by-band breakdown.
- All reliefs and deductions applied, with each amount.
- "NIN is now your Tax ID" reminder where relevant.
- Download as PDF.

## Module 3 — "What Changed For You"

- Side-by-side old regime (pre-2026 PITA) vs new regime (NTA 2025).
- Net change in plain language ("You save ₦X per year" / "You pay ₦X more").
- Only the reform points relevant to the user's profile, one line each.

## Module 4 — Grounded AI Follow-up Panel

- Ask follow-up questions in natural language about the computed result.
- Answers personal income tax under NTA 2025 only; refuses out-of-scope queries politely.
- Cites the relevant NTA 2025 section in every substantive answer.
- Never produces a number the calculator hasn't already produced — it only explains existing numbers.
- Every response ends with a "consult a tax professional" disclaimer.

## Module 5 — Writeup & About

- "How this works" page: calculation methodology and statute references.
- Build rationale: pain identified, scope chosen, what was cut, known limitations, v2 vision.

## Cross-cutting requirements

- Mobile-first responsive design.
- All computation runs client-side or on a stateless backend — no user data stored in v1.
- Every computed number carries an "Estimate under NTA 2025" badge and a "Not tax advice" footer.
- Every band, rate and relief is sourced from the Fourth Schedule of the NTA 2025 — no invented numbers.

## Deferred to v2

User accounts & saved history · bank account connection (Mono/Okra) · capital gains / digital assets / rental deep dives · business VAT & e-invoicing · multi-year projection · filing assistance / NRS integration · mobile app.

## Reference — NTA 2025 PIT bands (effective 1 Jan 2026)

| Annual taxable income (₦) | Rate |
|---|---|
| Up to 800,000 | 0% |
| 800,001 – 3,000,000 | 15% |
| 3,000,001 – 12,000,000 | 18% |
| 12,000,001 – 25,000,000 | 21% |
| 25,000,001 – 50,000,000 | 23% |
| Above 50,000,000 | 25% |

**Key reliefs (deducted before bands):** rent relief (20% of rent, capped ₦500,000), pension, NHIS, NHF, life insurance/annuity. The old Consolidated Relief Allowance is abolished.

**Old PITA bands (comparison):** 7% / 11% / 15% / 19% / 21% / 24% across the legacy tranches, plus old CRA (₦200,000 + 20% of gross).

> The canonical source for these numbers in code is `packages/core/src/tax/bands.ts`.
