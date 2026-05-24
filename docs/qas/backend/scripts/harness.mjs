// Shared harness for TaxLens backend QA. Plain Node fetch + mongodb. No framework.
// Usage: import { api, runner, mongo, ... } from './harness.mjs'
import { MongoClient } from 'mongodb';
import { readFileSync } from 'node:fs';

export const BASE = process.env.QA_BASE ?? 'http://localhost:8090/api/v1';
export const MONGO_URI = process.env.QA_MONGO ?? 'mongodb://localhost:27017';
export const DB_NAME = process.env.QA_DB ?? 'taxlens';
export const PDF_PATH =
  process.env.QA_PDF ?? '/Users/feranmi/codebases/2026/dockito/personal/bank-statement.pdf';

// ── HTTP ───────────────────────────────────────────────────────────────────
export async function request(path, { method = 'GET', body, headers = {} } = {}) {
  const h = { ...headers };
  let payload;
  if (body !== undefined) {
    if (body instanceof FormData) {
      payload = body; // fetch sets multipart boundary
    } else {
      h['Content-Type'] = 'application/json';
      payload = typeof body === 'string' ? body : JSON.stringify(body);
    }
  }
  const res = await fetch(`${BASE}${path}`, { method, headers: h, body: payload });
  let data = null;
  const text = await res.text();
  try {
    data = text ? JSON.parse(text) : null;
  } catch {
    data = { __raw: text };
  }
  return { status: res.status, data, headers: res.headers, raw: text };
}

export const get = (path, headers) => request(path, { headers });
export const post = (path, body, headers) => request(path, { method: 'POST', body, headers });

// Upload a PDF as multipart, with a steerable part-filename + mimetype.
export async function uploadStatement({
  profileType = 'salary_earner',
  filename = 'salary.pdf',
  mimetype = 'application/pdf',
  pdfPath = PDF_PATH,
  includeFile = true,
  bytes, // override file content (e.g. for size / empty tests)
} = {}) {
  const fd = new FormData();
  if (includeFile) {
    const buf = bytes !== undefined ? bytes : readFileSync(pdfPath);
    fd.append('file', new Blob([buf], { type: mimetype }), filename);
  }
  if (profileType !== null) fd.append('profileType', profileType);
  return request('/statement/parse', { method: 'POST', body: fd });
}

// Poll a code until terminal (ready|failed) or timeout. Returns the final view.
export async function pollUntilTerminal(code, { timeoutMs = 15000, intervalMs = 500 } = {}) {
  const deadline = Date.now() + timeoutMs;
  let last;
  while (Date.now() < deadline) {
    const r = await get(`/statement/${code}`);
    last = r;
    const status = r.data?.data?.status;
    if (status === 'ready' || status === 'failed') return r;
    await sleep(intervalMs);
  }
  return last;
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms));

// ── Mongo ────────────────────────────────────────────────────────────────────
let _client;
export async function mongo() {
  if (!_client) {
    _client = new MongoClient(MONGO_URI);
    await _client.connect();
  }
  return _client.db(DB_NAME);
}
export async function closeMongo() {
  if (_client) await _client.close();
  _client = null;
}

// ── Test runner ────────────────────────────────────────────────────────────
export function makeRunner() {
  const results = [];
  let cur = 'general';
  const section = (name) => {
    cur = name;
    console.log(`\n── ${name} ${'─'.repeat(Math.max(0, 50 - name.length))}`);
  };
  const rec = (kind, id, label, note = '') => {
    results.push({ kind, id, label, note, section: cur });
    const mark = { PASS: '✓', FAIL: '✗', BLOCK: '⊘', SKIP: '-' }[kind];
    console.log(`  ${mark} ${id}: ${label}${note ? `  → ${note}` : ''}`);
  };
  const pass = (id, label, note) => rec('PASS', id, label, note);
  const fail = (id, label, note) => rec('FAIL', id, label, note);
  const block = (id, label, note) => rec('BLOCK', id, label, note);
  const skip = (id, label, note) => rec('SKIP', id, label, note);

  // assert(cond, id, label, failNote) — pass when cond truthy.
  const check = (cond, id, label, failNote = '') =>
    cond ? pass(id, label) : fail(id, label, failNote);

  const summary = () => {
    const c = (k) => results.filter((r) => r.kind === k).length;
    console.log(`\n${'═'.repeat(54)}`);
    console.log(`  ${c('PASS')} PASS / ${c('FAIL')} FAIL / ${c('BLOCK')} BLOCK / ${c('SKIP')} SKIP  (${results.length} total)`);
    const fails = results.filter((r) => r.kind === 'FAIL');
    if (fails.length) {
      console.log('\n  FAILURES:');
      for (const f of fails) console.log(`    ${f.id}: ${f.label}\n      ${f.note}`);
    }
    console.log('═'.repeat(54));
    return results;
  };

  return { section, pass, fail, block, skip, check, summary, results };
}

// Helpers for asserting the flat error envelope.
export const isErr = (r, status, code, type) =>
  r.status === status &&
  r.data?.errorCode === code &&
  (type === undefined || r.data?.type === type);
export const errField = (r) => r.data?.field;
