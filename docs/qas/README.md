# QA Handoffs

When a feature is complete, the engineer who built it leaves a QA handoff here — the QA engineer should be able to test the full surface from this document alone (it replaces a verbal walk-through).

```
docs/qas/
  backend/    one file per backend feature/phase (API surface, edge cases, money fields)
  frontend/   one file per screen/phase (routes, copy, states, toasts)
```

Use the templates:

- Backend → [`backend/_template.md`](backend/_template.md)
- Frontend → [`frontend/_template.md`](frontend/_template.md)

## Before declaring a feature done — seam checklist

```
[ ] Backend zod field names match frontend TypeScript type field names exactly
[ ] Nullable fields match: backend optional ↔ frontend `field?: Type`
[ ] Money: backend sends/accepts integer kobo, frontend treats it as integer (no parseFloat)
[ ] Date: backend sends ISO 8601 string, frontend never assumes a number
[ ] Array responses: backend sends `[]` for empty (not null), frontend handles empty without crash
[ ] Error codes: frontend checks `error.code`, not `error.message` (message can change)
```
