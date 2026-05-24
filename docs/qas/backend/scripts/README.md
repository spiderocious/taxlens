# QA harness — how to run

Plain Node `fetch` + `mongodb`. No test framework. The scripts import `mongodb`, which lives
in the backend's `node_modules`, so make it resolvable first:

```bash
# one-time: symlink the backend's node_modules so bare imports resolve from here
ln -sfn ../../../../apps/main-backend/node_modules \
  docs/qas/backend/scripts/node_modules
```

(The symlink is gitignored noise — recreate it whenever you clone/clean.)

## Boot the backend per phase, then run the matching script

All on **port 8090** (matches `QA_BASE` default in `harness.mjs`). Boot from `apps/main-backend`.

```bash
cd apps/main-backend

# 1. Deterministic bulk (Sections 1,2,3,4,5,6,7,8,11,12)
LLM_MODE=stub PORT=8090 pnpm dev          # in one shell
node ../../docs/qas/backend/scripts/stub-suite.test.mjs   # in another

# 2. Oversize upload (PAR-09)
LLM_MODE=stub PORT=8090 STATEMENT_MAX_BYTES=1024 pnpm dev
QA_PHASE=oversize node .../breaker-reaper.test.mjs

# 3. Circuit breaker (Section 9)
LLM_MODE=stub PORT=8090 LLM_STUB_FAIL_TIMES=5 CIRCUIT_COOLDOWN_MS=3000 pnpm dev
QA_PHASE=breaker node .../breaker-reaper.test.mjs

# 4. Reaper (Section 10)
LLM_MODE=stub PORT=8090 PROCESS_TTL_MS=5000 REAPER_INTERVAL_MS=2000 pnpm dev
QA_PHASE=reaper node .../breaker-reaper.test.mjs

# 5. LIVE smoke (real key + real PDF) — Section [LIVE]
LLM_MODE=openai PORT=8090 pnpm dev        # .env supplies OPENAI_API_KEY
node .../live-smoke.test.mjs
```

Boot-guard cases (Section 13) and repo-level state machine (SM-04/05) don't use port 8090 —
see the commands in `../reports/statement-ai-report.md` §13 and §8.

Env knobs: `QA_BASE` (default `http://localhost:8090/api/v1`), `QA_MONGO`, `QA_DB`, `QA_PDF`.
