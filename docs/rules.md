# TaxLens — Workspace & code rules

Conventions distilled from how this codebase is organised. Follow them by default; deviations need a comment explaining why.

---

## Tooling & dependencies

1. **pnpm only.** The root `preinstall` hook (`npx only-allow pnpm`) refuses any other installer. `packageManager` and `engines` in root `package.json` pin pnpm ≥ 9.15.
2. **Workspace deps use `workspace:*`** in every app's `package.json` — never a fixed version.
3. **`minimum-release-age=10080`** (7 days) is set in `.npmrc`. pnpm refuses to install any version published less than a week ago. Don't disable without an explicit reason and a follow-up to re-enable.
4. **Lockfile is committed** (`pnpm-lock.yaml`). Never edit it by hand.
5. **Node ≥ 20** everywhere.

## Workspace shape

```
apps/           # Deployable units. One process per directory.
  main-backend/        Express, stateless public HTTP API (no DB, no auth in v1)
  taxlens-web/         Vite/React, the end-user tool
packages/       # Shared, never directly deployed.
  core/                Pure TS — NTA 2025 tax engine, domain types, routes, money helpers. No React, no Node-only APIs.
  api/                 Network client (ky), endpoints, react-query hooks. Browser-targeting.
  ui/                  React + Tailwind primitives, design system.
docs/           # Markdown only. No code.
```

- New deployable thing → `apps/<name>/`. New shared code → `packages/<name>/`.
- Apps **never** import from another app. Cross-app sharing goes through `packages/`.
- `packages/core` depends on nothing. `packages/api` depends only on `core`. `packages/ui` depends on `core`. Don't introduce a `ui → api` edge — UI primitives are presentational; data fetching lives in features inside apps.

## Naming

- Package name: `@taxlens/<dir-name>`. Nx project name: `<dir-name>` (no scope).
- TS path aliases per app: `@app/*`, `@features/*`, `@shared/*`. Backend also has `@lib/*` and `@middlewares/*`. Shared package aliases: `@taxlens/core`, `@taxlens/api`, `@taxlens/ui`, `@icons`.
- React components: `PascalCase.tsx` filename + named export. Screens/helpers: hyphenated (`landing-screen.tsx`, `format-naira.ts`).
- Backend feature files: `feature.routes.ts`, `feature.service.ts`, `feature.schema.ts`, etc. — each feature folder has an `index.ts` exposing a single `register(app)`.

## TypeScript

1. **Strict everywhere** (`tsconfig.base.json`): `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noImplicitReturns`. (`exactOptionalPropertyTypes: false` only on React apps where library types fight it.)
2. **NodeNext** in the backend → import specifiers spell out `.js` even for `.ts` source. The frontend uses `Bundler` resolution.
3. **`any` is banned** (`@typescript-eslint/no-explicit-any: error`). Use `unknown` + narrow.
4. **`type` imports** use `import type`.
5. **No barrels in app feature code.** Each top-level package exports one `src/index.ts`; inside apps, import the leaf module directly.

## Backend conventions (main-backend)

1. **One `buildApp()` factory** in `src/app.ts`; `src/server.ts` boots it. Tests mount `buildApp()` directly.
2. **Feature module shape.** Each `src/features/<name>/` has an `index.ts` exporting `register(app)` that mounts one `Router`. `app.ts` calls every `register` in order — register more specific paths before parameterized ones.
3. **Validation in `feature.schema.ts`** as zod. `feature.routes.ts` calls `Schema.parse(req.body)`; the global error handler converts `ZodError` → `400 validation_error`.
4. **Response envelope.** Success `{ data, meta? }`; error `{ error: { code, message, field_errors? } }`. Use `ResponseUtil` — never `res.json` directly.
5. **Throw `AppError` subclasses** from logic; the central middleware translates them. Never `res.status(500).json(...)` in a handler.
6. **`asyncHandler(...)`** wraps every async route handler.
7. **Money is integer kobo** (1 NGN = 100 kobo) end-to-end. The tax engine in `@taxlens/core` is the single authority for every computed number. Never store/compute money as float.
8. **Env parsed once at boot** in `src/env.ts` (zod). v1 is stateless — no JWT secrets, no DB URL.

## Frontend conventions (taxlens-web)

1. **One `configureApiClient(baseUrl)` call** at app boot in `main.tsx`. The `@taxlens/api` client is a Proxy that throws if used before configure.
2. **Data fetching is `@tanstack/react-query` only.** No bare `useEffect(() => fetch(...))`.
3. **`EP` endpoint constants** in `@taxlens/api/endpoints.ts` are the single source of truth for backend paths.
4. **Routes** live in `@taxlens/core/constants/routes.ts`. Never inline path strings in `<Link>`; use `ROUTES`.
5. **UI primitives come from `@taxlens/ui`** (`AppButton`, `AppText`, …). Add missing ones to `packages/ui/src/primitives/<name>/` and export from `packages/ui/src/index.ts` — then add a `/preview` part for them.
6. **Tailwind classes** flow through `cn(...)` so conflicts resolve predictably.
7. **Icons** come from `@icons` (proxies lucide-react). Don't import lucide directly in feature code.
8. **Conditional rendering uses `<Show>` from meemaw**, not `&&`. **Lists use `<Repeat>` from meemaw**, not `.map()`.
9. **FSD layout.** `features/<name>/{screen,parts,api,providers,guards,helpers,widgets}/` + `<name>.routes.tsx`. Screens compose parts; logic lives in hooks/helpers.

## Design-system preview

`taxlens-web` has a `/preview` route (Storybook-lite). Each `@taxlens/ui` primitive gets a part under `src/features/preview/screen/parts/`, registered in the `PARTS` map in `preview-screen.tsx` and listed in `shared/nav-items.ts`. Parts import the **real** primitives so the preview can't drift from production.

## ESLint / Prettier

- One root flat config (`eslint.config.mjs`). `no-console: error` (warn/error allowed). `unused-imports/no-unused-imports: error`. Single quotes, semicolons, trailing commas, 100-col, 2-space.

## Git hygiene

- `.env` is gitignored; `.env.example` is committed.
- `dist/`, `.next/`, `node_modules/`, `.nx/cache`, `*.tsbuildinfo` are gitignored. Commit none of them.
