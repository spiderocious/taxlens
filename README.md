# TaxLens NG

A personal income tax tool for Nigerians under the **Nigeria Tax Act 2025** (effective 1 January 2026).

**Core flow:** enter income (sample / manual / bank statement) → compute your tax position under NTA 2025 → see what changed versus the old regime → ask grounded follow-up questions.

TaxLens v1 is a single visitor-facing tool. No accounts, and **no user data is stored** — every computation runs on a stateless backend or client-side.

## Workspace

pnpm + Nx monorepo. Deployable units live under `apps/`; shared libraries under `packages/`.

```
apps/
  taxlens-web/    Vite + React — the tool (input → result → comparison → AI panel)
  main-backend/   Express — stateless compute, statement extraction, grounded AI proxy
packages/
  core/           Pure TS — NTA 2025 tax engine, domain types, routes, money helpers
  api/            Browser network client (ky), endpoints, react-query hooks
  ui/             React + Tailwind primitives (the design system)
docs/             Markdown only
```

- `packages/core` depends on nothing. `packages/api` depends on `core`. `packages/ui` depends on `core`.
- Apps never import from another app — shared code goes through `packages/`.

## Quick start

```bash
pnpm install
cp apps/main-backend/.env.example apps/main-backend/.env
cp apps/taxlens-web/.env.example  apps/taxlens-web/.env

# Two terminals:
pnpm -F @taxlens/main-backend dev    # http://localhost:8081
pnpm -F @taxlens/taxlens-web dev     # http://localhost:5173
```

See [docs/run.md](docs/run.md) for the full guide, and [docs/product/mvp.md](docs/product/mvp.md) for the feature spec.

## Design-system preview

`taxlens-web` ships a Storybook-lite preview at **`/preview`** that renders every `@taxlens/ui` primitive against the real components. Add a primitive → add a part under `src/features/preview/screen/parts/`, register it in `preview-screen.tsx`, and add a nav entry in `shared/nav-items.ts`.

## Common commands

```bash
pnpm typecheck    # nx run-many -t typecheck
pnpm lint         # nx run-many -t lint
pnpm build        # nx run-many -t build
```
