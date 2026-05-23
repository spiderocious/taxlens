# QA Handoff — [Feature / Phase] (Frontend)

**Date:** YYYY-MM-DD
**Build:** Typecheck ✅ · Lint ✅ · Build ✅
**Frontend URL:** http://localhost:5173

> TaxLens v1 has no accounts — no seed account needed.

---

## [Screen Name]

**Route:** `ROUTES.[NAME]` (`/path`)
**File:** `src/features/[feature]/screen/[name]-screen.tsx`
**Gate:** [always visible / requires prior step]

On this screen, the user must be able to:
- see [heading / subtitle — copy the exact string]
- [every interactive element: what it looks like, what it does]
- see a loading spinner while data loads
- see an error message (inline, from `error.code`) if a request fails
- see an empty state with [icon + exact message] when there's nothing to show

### Toast / inline behaviour

Prefer inline errors over toasts (see docs/rules.md). Toasts are only for transient confirmations.

| Trigger | Expected |
|---------|----------|
| [Action] success | "[exact text]" |
| [Action] error | backend `error.message` mapped by `error.code` — not a hardcoded string |

---

## Cross-cutting (every computed screen)

- Every number carries an "Estimate under NTA 2025" badge.
- A "Not tax advice" footer is present.

---

## Route Registration

| Route | Screen | Notes |
|-------|--------|-------|
| `/path` | `ScreenName` | lazy-loaded; registered in `[feature].routes.tsx` and `app.routes.tsx` |

---

## Out of Scope

- [ ] [what was explicitly not built this phase]
