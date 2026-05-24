# Backend QA Handoff — [Feature Name]

**Date:** YYYY-MM-DD
**Build:** Typecheck ✅ · Lint ✅ · Tests ✅
**Base URL:** `http://localhost:8081/api/v1`

> TaxLens v1 is stateless — no accounts, no DB, no auth header. Drop the seed-users / RBAC sections unless the feature introduces them.

---

## Endpoints Implemented

| Method | Path | Body shape | Notes |
|--------|------|-----------|-------|
| POST | `/tax/compare` | `IncomeInput` (kobo) | returns both regimes + comparison |

---

## Money Fields

| Field | Unit | Notes |
|-------|------|-------|
| `grossAnnualKobo` | kobo | integer only — decimal → `400 validation_error` |
| `reliefs.*Kobo` | kobo | integer only |

The tax engine in `@taxlens/core` is the single authority for every computed number — verify the response matches `computeNta2025` / `compareRegimes`.

---

## Edge Cases to Verify

| Scenario | Expected |
|----------|----------|
| Money field with decimal | 400 `validation_error` with `field_errors` |
| Negative income | 400 `validation_error` |
| Income below ₦800,000 taxable | `isExempt: true`, `annualTaxKobo: 0` |
| Missing required field | 400 `validation_error` with `field_errors` |
| Unknown route | 404 `not_found` |

## Out of Scope

- [ ] [explicitly deferred endpoints]
