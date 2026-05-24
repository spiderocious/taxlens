# Running TaxLens

A pnpm + Nx monorepo. Every app lives under `apps/`; every shared library under `packages/`. Use `pnpm` for everything — `npm` and `yarn` are blocked by the root `preinstall` hook.

## Prerequisites

- Node.js **>= 20**
- pnpm **>= 9.15** (`brew install pnpm` or `corepack enable && corepack prepare pnpm@9.15.9 --activate`)
- **MongoDB** reachable at `MONGODB_URI` (default `mongodb://localhost:27017`). v1.5 is
  stateful — the backend won't boot without it. (`brew services start mongodb-community`, or run via Docker.)
- Ports free locally: **8090** (main-backend), **5173** (taxlens-web), **4173** (vite preview)

## First-time setup

```bash
pnpm install
cp apps/main-backend/.env.example apps/main-backend/.env
cp apps/taxlens-web/.env.example  apps/taxlens-web/.env
```

Backend `.env` keys that matter:

- `MONGODB_URI` — required; the statement pipeline + AI chat persist here.
- `OPENAI_API_KEY` — Module 1 (statement parse) + Module 4 (grounded AI). Without it the
  parse pipeline marks processes `failed` and `/ai/ask` returns `503/1007`.
- `LLM_MODE` — `openai` (default, real API) or `stub` (deterministic in-process fake for
  tests/CI; **rejected at boot in production**). See `docs/api-docs.md` → "LLM transport mode".

## Apps overview

| App            | Stack        | Dev port | Prod cmd               | Notes                                                     |
| -------------- | ------------ | -------- | ---------------------- | --------------------------------------------------------- |
| `main-backend` | Express + Mongo | 8090 | `pnpm start`           | Stateful HTTP API (`/api/v1/*`) — MongoDB-backed, no auth |
| `taxlens-web`  | Vite/React   | 5173     | `pnpm start` (preview) | The tool: input → result → comparison → AI panel          |

## Running

```bash
# Filter form (run from anywhere)
pnpm -F @taxlens/main-backend dev      # 8090
pnpm -F @taxlens/taxlens-web dev       # 5173 → calls main-backend

# Or via Nx (project name = unscoped)
pnpm exec nx run main-backend:dev
pnpm exec nx run taxlens-web:dev
```

## Building

```bash
pnpm -F @taxlens/main-backend build    # → apps/main-backend/dist (node dist/server.js)
pnpm -F @taxlens/taxlens-web build     # → apps/taxlens-web/dist (static; pnpm start = vite preview)

# Everything (Nx orders the graph: core → api/ui → apps)
pnpm build
```

## Typecheck & lint

```bash
pnpm typecheck       # nx run-many -t typecheck
pnpm lint            # nx run-many -t lint
```

Nx caches results — subsequent runs without source changes finish in seconds.

## Health check

```bash
curl http://localhost:8090/api/v1/health
```

## Troubleshooting

- `Invalid environment variables` on boot — copy `apps/main-backend/.env.example` and set the required values (the zod parse error lists missing keys).
- `failed to start` / Mongo timeout on boot — MongoDB isn't reachable at `MONGODB_URI`. Start it (`brew services start mongodb-community`) or fix the URI.
- `EADDRINUSE` — a previous dev process is still on the port. `lsof -ti:<port> | xargs kill -9`.
- `Module not found: '@taxlens/ui'` after a rename — restart the dev server; tsconfig path edits aren't watched.
- `npm install` errors out — the `preinstall` hook blocks anything other than pnpm.
