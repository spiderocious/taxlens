// Sections 9 (circuit breaker) + 10 (reaper) + PAR-09 (oversize).
// These need dedicated env on the SERVER, so this script assumes the server is
// booted with the matching env for the phase being run. It is split into phases
// selected by QA_PHASE: "breaker" | "reaper" | "oversize".
import { get, post, uploadStatement, pollUntilTerminal, mongo, closeMongo, makeRunner, isErr, errField, sleep } from './harness.mjs';

const phase = process.env.QA_PHASE ?? 'breaker';
const r = makeRunner();

if (phase === 'oversize') {
  // PAR-09 — server booted with STATEMENT_MAX_BYTES=1024
  r.section('4. /statement/parse — oversize (STATEMENT_MAX_BYTES=1024)');
  const p = await uploadStatement({ filename: 'salary.pdf' }); // real 293KB PDF >> 1024
  r.check(isErr(p, 400, 1001) && errField(p) === 'file' && /exceeds the maximum/.test(p.data?.errorMessage ?? ''),
    'PAR-09', 'oversize upload → 400/1001 field=file "exceeds the maximum"',
    `got ${p.status}/${p.data?.errorCode} field=${errField(p)} msg="${p.data?.errorMessage}"`);
}

if (phase === 'breaker') {
  // Server booted with: LLM_MODE=stub LLM_STUB_FAIL_TIMES=5 CIRCUIT_COOLDOWN_MS=3000
  r.section('9. Circuit breaker (threshold 5, cooldown 3s, FAIL_TIMES=5)');
  const db = await mongo();

  // Drive 5 forced failures via 5 fail uploads (gate calls throw). Each upload's
  // gate call is one LLM failure. The 6th LLM call should fast-fail open.
  const codes = [];
  for (let i = 0; i < 5; i++) {
    const up = await uploadStatement({ filename: 'salary.pdf' }); // gate throws (FAIL_TIMES), but stub fail is via LLM_STUB_FAIL_TIMES
    codes.push(up.data?.data?.code);
    await pollUntilTerminal(up.data?.data?.code, { timeoutMs: 6000 });
  }
  // After 5 failures the breaker is open. A 6th LLM call (via /ai/ask on any process, or a new parse) should 503.
  // Use /ai/ask on a code (need a process). Create one — but its gate parse will also hit the open breaker → failed.
  // Simpler: /ai/ask on an existing code; ask reaches llmClient → CircuitOpenError → 503/1007.
  // We need a process that exists. Reuse codes[0] if it exists in mongo (it does — failed processes persist).
  const probeCode = codes.find(Boolean);
  let openResp = null;
  if (probeCode) openResp = await post('/ai/ask', { code: probeCode, question: 'Explain bands.' });
  r.check(openResp && isErr(openResp, 503, 1007, 'upstream_error'), 'CB-01',
    'after 5 failures, next AI call fast-fails 503/1007', `got ${openResp?.status}/${openResp?.data?.errorCode}`);
  r.check(!!openResp?.headers?.get('retry-after'), 'CB-02', '503 carries Retry-After',
    `retry-after=${openResp?.headers?.get('retry-after')}`);

  // CB-03 — audit recorded circuitState open
  await sleep(200);
  const openRows = await db.collection('llm_audit').find({ circuitState: 'open' }).limit(5).toArray();
  r.check(openRows.length >= 1 && openRows.some((x) => /circuit open/.test(x.error ?? '')), 'CB-03',
    'audit row circuitState=open with error "circuit open"', `openRows=${openRows.length}`);

  // CB-04 — after cooldown (3s) a probe is allowed; with FAIL_TIMES exhausted (5), the probe SUCCEEDS → closes.
  await sleep(3500);
  const recover = await post('/ai/ask', { code: probeCode, question: 'Explain bands now.' });
  r.check(recover.status === 200 && recover.data?.data?.answer, 'CB-04',
    'after cooldown, half-open probe succeeds → closed (200)', `got ${recover.status}/${recover.data?.errorCode}`);
}

if (phase === 'reaper') {
  // Server booted with: PROCESS_TTL_MS=5000 REAPER_INTERVAL_MS=2000 LLM_MODE=stub
  r.section('10. Reaper (TTL 5s, interval 2s)');
  const db = await mongo();

  // RP-04 — fresh process not reaped immediately
  const fresh = await uploadStatement({ filename: 'salary.pdf' });
  const freshCode = fresh.data?.data?.code;
  await pollUntilTerminal(freshCode, { timeoutMs: 6000 });
  await sleep(2500); // one sweep, but within TTL
  const stillThere = await get(`/statement/${freshCode}`);
  r.check(stillThere.status === 200, 'RP-04', 'fresh process survives a sweep within TTL', `got ${stillThere.status}`);

  // RP-03 — interaction resets clock: keep polling for ~10s, survives
  const keep = await uploadStatement({ filename: 'salary.pdf' });
  const keepCode = keep.data?.data?.code;
  await pollUntilTerminal(keepCode, { timeoutMs: 6000 });
  for (let i = 0; i < 6; i++) { await sleep(1800); await get(`/statement/${keepCode}`); }
  const survived = await get(`/statement/${keepCode}`);
  r.check(survived.status === 200, 'RP-03', 'interaction every ~1.8s keeps process alive past TTL', `got ${survived.status}`);

  // RP-01 — idle process reaped: stop touching, wait > TTL + interval
  const idle = await uploadStatement({ filename: 'salary.pdf' });
  const idleCode = idle.data?.data?.code;
  await pollUntilTerminal(idleCode, { timeoutMs: 6000 });
  const auditBefore = await db.collection('llm_audit').countDocuments({ code: idleCode });
  await sleep(9000); // > TTL(5s) + interval(2s), no interaction
  const gone = await get(`/statement/${idleCode}`);
  r.check(isErr(gone, 404, 1004), 'RP-01', 'idle process reaped → 404/1004', `got ${gone.status}/${gone.data?.errorCode}`);
  const docGone = await db.collection('tax_processes').findOne({ code: idleCode });
  r.check(!docGone, 'RP-01b', 'Mongo doc deleted', `doc=${docGone ? 'present' : 'gone'}`);
  const auditAfter = await db.collection('llm_audit').countDocuments({ code: idleCode });
  r.check(auditBefore > 0 && auditAfter === 0, 'RP-02', 'audit purged alongside process',
    `before=${auditBefore} after=${auditAfter}`);
}

r.summary();
await closeMongo();
