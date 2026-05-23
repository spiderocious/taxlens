# Solon — Workspace & code rules

Conventions distilled from how this codebase is organised. Follow them by default; deviations need a comment explaining why.

---

## Tooling & dependencies

1. **pnpm only.** The root `preinstall` hook (`npx only-allow pnpm`) refuses any other installer. `packageManager` and `engines` in root `package.json` pin pnpm ≥ 9.15.
2. **Workspace deps use `workspace:*`** in every app's `package.json` — never a fixed version. Cross-package versions stay aligned through one source of truth.
3. **`minimum-release-age=10080`** (7 days) is set in `.npmrc`. pnpm refuses to install any version published less than a week ago. This is the cheapest defence against fresh supply-chain attacks; don't disable it without an explicit reason and a follow-up to re-enable.
4. **Lockfile is committed** (`pnpm-lock.yaml`). Never edit it by hand.
5. **Node ≥ 20** everywhere. Each app's `package.json` declares `engines.node`.

## Workspace shape

```
apps/           # Deployable units. One process per directory.
  main-backend/        Express, public HTTP API
  data-layer/          Express, internal-only data service
  solon-web/           Vite/React, end-user campaign app
  solon-admin-web/     Vite/React, platform operations console
  solon-website/       Next.js, marketing site
packages/       # Shared, never directly deployed.
  core/                Pure TS — types, routes, helpers, no React, no Node-only APIs
  api/                 Network client (ky), endpoints, react-query hooks
  ui/                  React + Tailwind primitives, design system
docs/           # Markdown only. No code.
```

- New deployable thing → `apps/<name>/`. New shared code → `packages/<name>/`.
- Apps **never** import from another app. Cross-app sharing goes through `packages/`.
- `packages/core` depends on nothing. `packages/api` depends only on `core`. `packages/ui` depends on `core`. Don't introduce a `ui → api` edge — UI primitives are presentational; data fetching lives in features inside apps.

## Naming

- Package name: `@solon/<dir-name>`. Project name (used by Nx): `<dir-name>` (no scope).
- TS path aliases per app: `@app/*`, `@features/*`, `@shared/*`. Backend apps also have `@lib/*` and `@middlewares/*`. The shared package aliases are `@solon/core`, `@solon/api`, `@solon/ui`, `@icons`.
- React components: `PascalCase.tsx` filename and named export. One component per file unless they're trivially small siblings.
- Backend feature files: `feature.routes.ts`, `feature.service.ts`, `feature.repo.ts`, `feature.schema.ts`, `feature.types.ts` — every feature has its own folder + `index.ts` that exposes a single `register(app)` function.

## TypeScript

1. **Strict everywhere.** `tsconfig.base.json` turns on `strict`, `noUncheckedIndexedAccess`, `exactOptionalPropertyTypes`, `noImplicitOverride`, `noFallthroughCasesInSwitch`, `noImplicitReturns`. Don't relax these per-project unless you're forced to (e.g. `exactOptionalPropertyTypes: false` is set only on React apps where library types fight it).
2. **NodeNext module resolution** in backends → import specifiers spell out `.js` even when the source file is `.ts`. Frontends use `Bundler` resolution. The Next.js webpack config has `extensionAlias` to bridge the two.
3. **`any` is banned.** ESLint enforces `@typescript-eslint/no-explicit-any: error`. Reach for `unknown` plus a narrowing check.
4. **`type` imports** must use `import type` (`consistent-type-imports: error`). Mixed default/value+type imports become two lines.
5. **No barrels in feature code.** Each top-level package (`@solon/core`, `@solon/api`, `@solon/ui`) does export a single `src/index.ts` — but inside apps, import the leaf module directly. Barrels everywhere inflate bundle size and breed circular imports.
6. **Path aliases beat relative paths past two `..`** segments. `import { x } from '@lib/foo.js'` is correct; `import { x } from '../../../lib/foo.js'` is not.

## Backend conventions (main-backend, data-layer)

1. **One `buildApp()` factory.** `src/app.ts` returns a configured Express instance; `src/server.ts` boots it. Tests mount `buildApp()` directly — never the listening server.
2. **Feature module shape.** Each `src/features/<name>/` has an `index.ts` that exports `register(app)` and mounts a single `Router`. `app.ts` calls every `register` in a defined order; **the order matters** (router-level middleware on `/api/v1/me` will shadow later mounts — see ohlify's `app.ts` for the canonical incident). When adding a router under a path another router already covers, register it earlier.
3. **Validation lives in `feature.schema.ts`** as zod schemas. `feature.routes.ts` calls `Schema.parse(req.body)` and lets the global error handler convert `ZodError` → `400 validation_error`.
4. **Response envelope.** Success: `{ data, meta? }`. Error: `{ error: { code, message, field_errors? } }`. Use `ResponseUtil.ok / created / accepted / noContent / error` — never `res.json` directly. Status codes come from `@shared/constants/http-status.ts`.
5. **Error classes** in `lib/errors.ts` carry `code`, `status`, and optional `fieldErrors`. Throw an `AppError` subclass from services; the central middleware translates it to the envelope. Never `res.status(500).json(...)` in a handler — let errors bubble.
6. **Async route handlers** are wrapped with `asyncHandler(...)` so rejections flow to the error middleware. Bare async handlers leak unhandled promise rejections.
7. **AsyncLocalStorage holds the request envelope.** `requestId.middleware.ts` seeds it; `logger.ts` reads it. Don't thread `requestId` manually through services.
8. **Env parsing once, at boot.** Each backend has `src/env.ts` with a zod schema; the module exports `env`, validated. Production-only requirements (e.g. webhook secrets) belong in `server.ts` runtime checks, not the schema, so dev can still boot.
9. **PII redaction** is on the logger (`redact.paths`). When adding a new sensitive field, add the path here too — don't trust callers to remember.
10. **Secrets live in `.env`.** `.env.example` is committed and lists every variable with stub values. `.env` is gitignored.
11. **Data-layer is internal.** `INTERNAL_SHARED_SECRET` gates every route except `/health`. Public clients never talk to it. main-backend is the only legitimate consumer.

## Frontend conventions (solon-web, solon-admin-web)

1. **One `configureApiClient(baseUrl)` call** at app boot in `main.tsx`. The `@solon/api` client is a Proxy that throws if used before configure — preserves test setup and prevents accidental fallback to `window.location.origin` in production.
2. **Data fetching is `@tanstack/react-query` only.** No bare `useEffect(() => fetch(...))`. Network shape: `apiClient.get(EP.X).json<ApiResponse<T>>()` → unwrap `.data` inside the queryFn.
3. **`EP` endpoint constants** in `@solon/api/endpoints.ts` are the single source of truth for backend paths. Don't hand-write URLs in components.
4. **Routes** live in `@solon/core/constants/routes.ts`. Never inline `"/dashboard"` in a `<Link>`; use `ROUTES.DASHBOARD`. Parametric routes are functions: `ROUTES.SIMULATOR_RACE(id)`.
5. **UI primitives come from `@solon/ui`** (`AppButton`, `AppText`, …). Don't reinvent a button. If you need a missing primitive, add it to `packages/ui/src/primitives/<name>/` and export it from `packages/ui/src/index.ts`.
6. **Tailwind classes** flow through `cn(...)` (clsx + tailwind-merge) so conflicting classes resolve predictably — last `px-*` wins.
7. **Icons** come from `@icons`, which proxies a swappable icon set (currently lucide-react). Don't `import { X } from 'lucide-react'` in feature code.

## Next.js (solon-website)

1. **App Router only.** `src/app/<route>/page.tsx`. No `pages/` directory.
2. **`transpilePackages`** is set in `next.config.mjs` for every workspace package the website imports. Add new ones there.
3. **Webpack `extensionAlias`** converts `.js` source-import specifiers to `.ts`/`.tsx` (matches the workspace convention). Don't remove it.
4. **Server vs client components.** Default to server. Add `'use client'` only when you need browser APIs, state, or event handlers. The data-fetching client (`@solon/api`) is browser-only — keep it out of server components.

## Shared packages

1. **`@solon/core` is pure TypeScript.** No React, no Node-only APIs, no DOM-only APIs without a `typeof window` guard. It's consumed by backends, SSR, and browser code alike.
2. **`@solon/api` is browser-targeting.** Uses ky + react-query. Don't import it from a backend.
3. **`@solon/ui` is React + Tailwind.** Don't put networking calls in here — UI primitives are pure presentational. Domain widgets that compose data + presentation live inside an app, not in `ui`.
4. **Type-only exports** are normal exports; runtime exports are normal exports too — but consumers should use `import type` for the former so dead-code elimination works.

## ESLint / Prettier

- One root flat config (`eslint.config.mjs`). Each package's `lint` script points at it.
- `no-console: error` (with `warn`/`error` allowed) — use the `logger` in backends, and avoid logging in browser code except for genuine errors.
- `unused-imports/no-unused-imports: error` — keep imports clean. Unused locals must be prefixed `_`.
- Prettier rules: single quotes, semicolons, trailing commas, 100-col print width, 2-space indent.

## Git hygiene

- `.env` is gitignored. `.env.example` is committed.
- `dist/`, `.next/`, `node_modules/`, `.nx/cache`, `*.tsbuildinfo` are gitignored. Commit none of them.
- Commit messages: one short imperative line. Detail in the body. No emojis.

## When in doubt

Read `ohlify` (the sibling project at `../ohlify/backend`) — it's the proven older codebase the conventions here came from. When the two diverge, prefer the most recent rule documented here.
