// LIVE smoke — Section [LIVE] cases (PAR-17, AI-15, PII-06). Boot: LLM_MODE=openai
// with real OPENAI_API_KEY + real PDF. Structural assertions only (output varies).
import { uploadStatement, pollUntilTerminal, post, mongo, closeMongo, makeRunner, get } from './harness.mjs';

const r = makeRunner();
r.section('[LIVE] real OpenAI integration');

const db = await mongo();

// PAR-17 — real upload → ready (give it generous time; two model calls)
const up = await uploadStatement({ filename: 'bank-statement.pdf' });
console.log(`  upload → ${up.status} code=${up.data?.data?.code}`);
r.check(up.status === 202 && /^\d{8}$/.test(up.data?.data?.code ?? ''), 'PAR-17a', 'real upload accepted (202, 8-digit code)',
  `got ${up.status} ${JSON.stringify(up.data)}`);

const code = up.data?.data?.code;
const fin = await pollUntilTerminal(code, { timeoutMs: 90000, intervalMs: 2000 });
const d = fin.data?.data;
console.log(`  terminal status=${d?.status} bank=${d?.bankName} months=${d?.monthsCovered} gross=${d?.grossAnnualKobo} inflows=${d?.inflows?.length} failure=${d?.failureReason ?? ''}`);

if (d?.status === 'ready') {
  r.check(typeof d?.bankName === 'string' && d.bankName.length > 0, 'PAR-17b', 'ready: bankName non-empty', `bank=${d?.bankName}`);
  r.check(Number.isInteger(d?.monthsCovered) && d.monthsCovered >= 1, 'PAR-17c', 'ready: monthsCovered ≥ 1', `months=${d?.monthsCovered}`);
  r.check(Array.isArray(d?.inflows), 'PAR-17d', 'ready: inflows is array', `type=${typeof d?.inflows}`);
  r.check(Number.isInteger(d?.grossAnnualKobo) && d.grossAnnualKobo >= 0, 'PAR-17e', 'ready: grossAnnualKobo integer ≥ 0', `gross=${d?.grossAnnualKobo}`);
  // engine internal consistency on the real computation
  const nr = d?.computation?.newRegime, or = d?.computation?.oldRegime;
  const sumOk = (c) => c && c.bands?.reduce((s, b) => s + b.taxKobo, 0) === c.annualTaxKobo;
  r.check(sumOk(nr) && sumOk(or), 'PAR-17f', 'ready: Σbands === annualTax (both regimes)',
    `new=${nr?.annualTaxKobo} old=${or?.annualTaxKobo}`);

  // AI-15 — real grounded ask
  const a = await post('/ai/ask', { code, question: 'Why is my effective tax rate what it is?' });
  const ad = a.data?.data;
  console.log(`  ai/ask → ${a.status} refused=${ad?.refused} cites=${ad?.citations?.length}\n  answer="${(ad?.answer ?? '').slice(0, 200)}…"`);
  r.check(a.status === 200 && ad?.answer && ad?.refused === false && (ad?.citations?.length ?? 0) >= 1
    && ad?.disclaimer, 'AI-15', 'real ask: answer + ≥1 citation + disclaimer, refused false',
    `status=${a.status} refused=${ad?.refused} cites=${ad?.citations?.length}`);

  // AI-15b — no invented number: every NGN/kobo-looking figure in the answer should
  // appear in the computation context (structural — flag for manual review).
  const nums = (ad?.answer ?? '').match(/[\d,]{4,}/g) ?? [];
  console.log(`  AI-15 numbers in answer (manual no-invented-number review): ${JSON.stringify(nums)}`);
  r.skip('AI-15b', 'no-invented-number (manual review)', `numbers surfaced: ${JSON.stringify(nums)}`);

  // AI-15c — out-of-scope refusal with real model
  const v = await post('/ai/ask', { code, question: 'How much VAT does my company owe on sales?' });
  console.log(`  ai/ask VAT → refused=${v.data?.data?.refused}`);
  r.check(v.status === 200 && v.data?.data?.refused === true, 'AI-15c', 'real out-of-scope (VAT) → refused true',
    `refused=${v.data?.data?.refused} answer="${(v.data?.data?.answer ?? '').slice(0,120)}"`);
} else {
  r.fail('PAR-17b', 'real upload reached ready', `terminal status was "${d?.status}" reason="${d?.failureReason}" — gate may have rejected the real PDF`);
  r.block('AI-15', 'real ask', 'process not ready');
  r.block('AI-15c', 'real refusal', 'process not ready');
}

// PII-06 — re-confirm no raw statement in audit for the real run
if (code) {
  const rows = await db.collection('llm_audit').find({ code }).toArray();
  const hashOk = rows.every((x) => /^[0-9a-f]{32}$/.test(x.promptHash));
  const noText = rows.every((x) => !('system' in x) && !('user' in x) && !('pdf' in x) && !('file_data' in x));
  r.check(rows.length >= 1 && hashOk && noText, 'PII-06a', 'real-run audit: hash only, no raw text',
    `rows=${rows.length} hashOk=${hashOk} noText=${noText}`);
  console.log(`  (log-grep PII-06 done separately on the boot log)`);
}

r.summary();
await closeMongo();
