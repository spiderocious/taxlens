---
name: taxlens-workspace
description: TaxLens monorepo shape, scope naming, and stateless v1 constraints
metadata:
  type: project
---

TaxLens NG = personal income tax tool under the Nigeria Tax Act 2025 (effective 1 Jan 2026). pnpm + Nx monorepo. Was scaffolded from a "solon" (campaign-software) copy and renamed/cleaned on 2026-05-23.

- Scope: `@taxlens/*`. Apps: `apps/taxlens-web` (Vite/React) + `apps/main-backend` (Express). Packages: `core` (NTA-2025 tax engine in `packages/core/src/tax/`, domain types, routes, money helpers), `api` (ky client + react-query hooks), `ui` (Tailwind primitives).
- v1 is **stateless**: no accounts, no auth, no DB, no user data stored. Backend env has no JWT/DB — just PORT, base URLs, optional `ANTHROPIC_API_KEY`.
- Money is **integer kobo** end-to-end. The tax engine is the single authority for every number; bands/reliefs trace to the Fourth Schedule (no invented numbers).
- Backend features: `tax` (compute/compare — real), `statement` (PDF parse — stub), `ai` (grounded Q&A — stub). No data-layer app.
- Dev ports: backend 8090, web 5173 (often falls back to 5174 — port 5173 is sometimes taken by an unrelated "Dipstick" project).
- Conventions in `docs/rules.md`; run guide `docs/run.md`; QA handoff templates in `docs/qas/`. See [[taxlens-preview-page]].
