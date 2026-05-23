# Running Solon

The workspace is a pnpm + Nx monorepo. Every app lives under `apps/`; every shared library lives under `packages/`. Use `pnpm` for everything — `npm` and `yarn` are blocked by the root `preinstall` hook.

## Prerequisites

- Node.js **>= 20**
- pnpm **>= 9.15** (`brew install pnpm` or `corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- Ports free locally: **8081** (main-backend), **8082** (data-layer), **5173** (solon-web), **5174** (solon-admin-web), **3000** (solon-website), **4173/4174** (vite preview)

## First-time setup

```bash
pnpm install                                  # workspace install (root)
cp apps/main-backend/.env.example  apps/main-backend/.env
cp apps/data-layer/.env.example    apps/data-layer/.env
cp apps/solon-web/.env.example     apps/solon-web/.env
cp apps/solon-admin-web/.env.example apps/solon-admin-web/.env
cp apps/solon-website/.env.example apps/solon-website/.env
```

Set real secrets in every `.env` before running in any non-local environment. JWT secrets and `INTERNAL_SHARED_SECRET` must be ≥ 32 chars.

## Apps overview

| App                 | Stack    | Dev port | Prod cmd                  | Notes                                           |
| ------------------- | -------- | -------- | ------------------------- | ----------------------------------------------- |
| `main-backend`      | Express  | 8081     | `pnpm start`              | Public HTTP API (`/api/v1/*`)                   |
| `data-layer`        | Express  | 8082     | `pnpm start`              | Internal-only service. Auth via shared secret.  |
| `solon-web`         | Vite/React | 5173   | `pnpm start` (preview)    | End-user campaign + simulator app               |
| `solon-admin-web`   | Vite/React | 5174   | `pnpm start` (preview)    | Platform operations console                     |
| `solon-website`     | Next.js  | 3000     | `pnpm start`              | Marketing / public website                      |

## Running one app

Either use the per-app filter or `cd` into the app:

```bash
# Filter form (run from anywhere)
pnpm -F @solon/main-backend dev
pnpm -F @solon/data-layer dev
pnpm -F @solon/solon-web dev
pnpm -F @solon/solon-admin-web dev
pnpm -F @solon/solon-website dev

# Or via Nx target name (project name = unscoped, e.g. `solon-web`)
pnpm exec nx run main-backend:dev
pnpm exec nx run solon-web:dev
```

### Typical local stack

In separate terminals:

```bash
pnpm -F @solon/data-layer dev          # 8082
pnpm -F @solon/main-backend dev        # 8081 → calls data-layer
pnpm -F @solon/solon-web dev           # 5173 → calls main-backend
pnpm -F @solon/solon-website dev       # 3000 → links to solon-web
```

## Building

Each app has a `build` target that produces a `dist/` (or `.next/` for solon-website). pnpm dependency graph + Nx caching mean shared packages build automatically when an app needs them.

```bash
# One app
pnpm -F @solon/main-backend build
pnpm -F @solon/solon-web build

# Everything (Nx orchestrates the dependency order: core → api/ui → apps)
pnpm exec nx run-many -t build
# or
pnpm build
```

Output locations:

- `apps/main-backend/dist/` — compiled JS (run with `node dist/server.js`)
- `apps/data-layer/dist/` — same shape as main-backend
- `apps/solon-web/dist/` — static assets (serve any way you like; `pnpm start` runs `vite preview`)
- `apps/solon-admin-web/dist/` — same as solon-web
- `apps/solon-website/.next/` — Next.js production build (run with `pnpm start`)

## Running production builds locally

```bash
# Express services
pnpm -F @solon/main-backend build && pnpm -F @solon/main-backend start
pnpm -F @solon/data-layer build && pnpm -F @solon/data-layer start

# Vite preview (production bundle on a preview server, port 4173/4174)
pnpm -F @solon/solon-web build && pnpm -F @solon/solon-web start
pnpm -F @solon/solon-admin-web build && pnpm -F @solon/solon-admin-web start

# Next.js production
pnpm -F @solon/solon-website build && pnpm -F @solon/solon-website start
```

## Typecheck & lint

```bash
# Single project
pnpm -F @solon/main-backend typecheck
pnpm -F @solon/solon-web lint

# All projects
pnpm typecheck       # nx run-many -t typecheck
pnpm lint            # nx run-many -t lint
pnpm build           # nx run-many -t build
```

Nx caches results — subsequent runs without source changes finish in seconds.

## Health checks

```bash
curl http://localhost:8081/api/v1/health           # main-backend
curl http://localhost:8082/internal/v1/health      # data-layer
```

`data-layer`'s other routes require the `x-internal-secret` header that matches `INTERNAL_SHARED_SECRET` in its `.env`. They will 401 without it — that's correct.

## Troubleshooting

- `Invalid environment variables` on boot — copy the matching `.env.example` and set every required value (zod parse error lists the missing keys).
- `EADDRINUSE` — a previous dev process is still running on the port. `lsof -ti:<port> | xargs kill -9`.
- `Module not found: '@solon/ui'` after a rename — restart the dev server; tsconfig path edits aren't watched.
- `npm install` errors out — the `preinstall` hook blocks anything other than pnpm. Install pnpm or use corepack.
