<!-- nx configuration start-->
<!-- Leave the start & end comments to automatically receive updates. -->

# General Guidelines for working with Nx

- For navigating/exploring the workspace, invoke the `nx-workspace` skill first - it has patterns for querying projects, targets, and dependencies
- When running tasks (for example build, lint, test, e2e, etc.), always prefer running the task through `nx` (i.e. `nx run`, `nx run-many`, `nx affected`) instead of using the underlying tooling directly
- Prefix nx commands with the workspace's package manager (e.g., `pnpm nx build`, `npm exec nx test`) - avoids using globally installed CLI
- You have access to the Nx MCP server and its tools, use them to help the user
- For Nx plugin best practices, check `node_modules/@nx/<plugin>/PLUGIN.md`. Not all plugins have this file - proceed without it if unavailable.
- NEVER guess CLI flags - always check nx_docs or `--help` first when unsure

## Scaffolding & Generators

- For scaffolding tasks (creating apps, libs, project structure, setup), ALWAYS invoke the `nx-generate` skill FIRST before exploring or calling MCP tools

## When to use nx_docs

- USE for: advanced config options, unfamiliar flags, migration guides, plugin configuration, edge cases
- DON'T USE for: basic generator syntax (`nx g @nx/react:app`), standard commands, things you already know
- The `nx-generate` skill handles generator discovery internally - don't call nx_docs just to look up generator syntax

<!-- nx configuration end-->

# TaxLens

A personal income tax tool for Nigerians under the Nigeria Tax Act 2025. pnpm + Nx monorepo, two apps + three packages. v1 is a single visitor-facing tool — **no accounts, no stored user data** (stateless backend / client-side compute).

- Feature spec: `docs/product/mvp.md`
- Workspace & code rules (read before writing code): `docs/rules.md`
- How to run: `docs/run.md`
- QA handoffs go in `docs/qas/` (templates provided)

## Shape

```
apps/taxlens-web    Vite/React tool · apps/main-backend  Express stateless API
packages/core (tax engine, types, routes) · api (client, hooks) · ui (design system)
```

## Non-negotiables

- **Money is integer kobo** end-to-end. The tax engine in `packages/core/src/tax/` is the single authority for every computed number — no invented numbers; bands/reliefs trace to the NTA 2025 Fourth Schedule.
- **`any` is banned.** Backend: `ResponseUtil` + `asyncHandler` + zod schemas, never `res.json` directly. Frontend: react-query only, `<Show>`/`<Repeat>` from meemaw (not `&&`/`.map`), `ROUTES`/`EP` constants, icons via `@icons`, `cn()` for classes.
- New `@taxlens/ui` primitive → also add a part to the `/preview` page in `taxlens-web`.
