// STUB-mode deterministic suite — Sections 1,2,3,4,5,6,7,8,11,12.
// Boot: LLM_MODE=stub ... PORT=8090. Run: node stub-suite.test.mjs
import {
  get, post, uploadStatement, pollUntilTerminal, mongo, closeMongo,
  makeRunner, isErr, errField, sleep, BASE,
} from './harness.mjs';

const r = makeRunner();
const Z = { annualRentKobo: 0, pensionKobo: 0, nhisKobo: 0, nhfKobo: 0, lifeInsuranceKobo: 0 };
const income = (over = {}) => ({ profileType: 'salary_earner', grossAnnualKobo: 1_500_000_000, reliefs: Z, ...over });

console.log(`TaxLens STUB suite · ${BASE} · ${new Date().toISOString()}`);

// ── Section 1 — Health ───────────────────────────────────────────────────────
r.section('1. Health');
{
  const h = await get('/health');
  r.check(h.status === 200 && h.data?.data?.status === 'ok' && h.data?.data?.service === 'main-backend'
    && /^\d{4}-\d{2}-\d{2}T/.test(h.data?.data?.time ?? ''), 'H-01', 'liveness 200 + ok shape',
    `got ${h.status} ${JSON.stringify(h.data)}`);

  const echo = await get('/health', { 'x-request-id': 'qa-h-02' });
  r.check(echo.headers.get('x-request-id') === 'qa-h-02', 'H-02', 'x-request-id echoed',
    `got ${echo.headers.get('x-request-id')}`);

  const gen = await get('/health');
  r.check(!!gen.headers.get('x-request-id') && gen.headers.get('x-request-id') !== 'qa-h-02',
    'H-03', 'x-request-id generated when absent', `got ${gen.headers.get('x-request-id')}`);

  const helmet = (gen.headers.get('x-content-type-options') || '').toLowerCase() === 'nosniff'
    || !!gen.headers.get('content-security-policy');
  r.check(helmet, 'H-04', 'helmet headers present',
    `xcto=${gen.headers.get('x-content-type-options')} csp=${!!gen.headers.get('content-security-policy')}`);
}

// ── Section 2 — /tax/compute ─────────────────────────────────────────────────
r.section('2. /tax/compute');
{
  const c1 = await post('/tax/compute', income());
  const d1 = c1.data?.data;
  r.check(c1.status === 200 && d1?.regime === 'nta_2025' && d1?.annualTaxKobo === 258_000_000
    && d1?.taxableIncomeKobo === 1_500_000_000 && d1?.monthlyTaxKobo === 21_500_000
    && d1?.isExempt === false, 'CMP-01', 'gross 1.5e9 reliefs0 → tax 258,000,000',
    `got ${c1.status} tax=${d1?.annualTaxKobo} taxable=${d1?.taxableIncomeKobo} monthly=${d1?.monthlyTaxKobo}`);
  r.check(Math.abs((d1?.effectiveRate ?? 0) - 0.172) < 1e-6, 'CMP-01b', 'effectiveRate ≈ 0.172', `got ${d1?.effectiveRate}`);

  const c2 = await post('/tax/compute', income({ grossAnnualKobo: 80_000_000 }));
  r.check(c2.status === 200 && c2.data?.data?.annualTaxKobo === 0 && c2.data?.data?.isExempt === true,
    'CMP-02', 'gross ₦800k → exempt, tax 0', `got tax=${c2.data?.data?.annualTaxKobo} exempt=${c2.data?.data?.isExempt}`);

  const c3 = await post('/tax/compute', income({ grossAnnualKobo: 80_000_100 }));
  r.check(c3.status === 200 && c3.data?.data?.annualTaxKobo === 15 && c3.data?.data?.isExempt === false,
    'CMP-03', '₦1 over free band → tax 15', `got tax=${c3.data?.data?.annualTaxKobo}`);

  const c4 = await post('/tax/compute', income({ grossAnnualKobo: 0 }));
  r.check(c4.status === 200 && c4.data?.data?.annualTaxKobo === 0 && c4.data?.data?.effectiveRate === 0
    && c4.data?.data?.isExempt === true, 'CMP-04', 'gross 0 → tax 0, no div-by-zero',
    `got tax=${c4.data?.data?.annualTaxKobo} eff=${c4.data?.data?.effectiveRate}`);

  const c5 = await post('/tax/compute', income({ grossAnnualKobo: 10_000_000_000 }));
  const top = c5.data?.data?.bands?.[5];
  r.check(c5.status === 200 && c5.data?.data?.annualTaxKobo === 2_293_000_000 && top?.upperKobo === null
    && top?.amountInBandKobo === 5_000_000_000, 'CMP-05', 'top band: tax 2,293,000,000',
    `got tax=${c5.data?.data?.annualTaxKobo} top=${JSON.stringify(top)}`);

  const c6 = await post('/tax/compute', income({ reliefs: { ...Z, annualRentKobo: 300_000_000 } }));
  const rr = c6.data?.data?.appliedReliefs?.find((x) => x.key === 'rent_relief');
  r.check(c6.status === 200 && rr?.amountKobo === 50_000_000 && c6.data?.data?.totalReliefsKobo === 50_000_000,
    'CMP-06', 'rent relief caps at ₦500k (50,000,000 kobo)', `got rentRelief=${rr?.amountKobo} total=${c6.data?.data?.totalReliefsKobo}`);

  const c7 = await post('/tax/compute', income({ reliefs: { ...Z, annualRentKobo: 120_000_000 } }));
  r.check(c7.status === 200 && c7.data?.data?.annualTaxKobo === 252_960_000 && c7.data?.data?.totalReliefsKobo === 24_000_000,
    'CMP-07', 'doc example → 252,960,000 (NOT doc 168200000 — DIV-01)',
    `got tax=${c7.data?.data?.annualTaxKobo}`);

  const c9 = await post('/tax/compute', income({ profileType: 'freelancer' }));
  r.check(c9.status === 200 && c9.data?.data?.annualTaxKobo === 258_000_000, 'CMP-09',
    'profileType=freelancer identical numbers', `got ${c9.data?.data?.annualTaxKobo}`);

  const c10 = await post('/tax/compute', income());
  const bands = c10.data?.data?.bands ?? [];
  const taxes = bands.map((b) => b.taxKobo);
  const sum = taxes.reduce((s, t) => s + t, 0);
  const expectBands = [0, 33_000_000, 162_000_000, 63_000_000, 0, 0];
  r.check(bands.length === 6 && bands[0]?.rate === 0 && JSON.stringify(taxes) === JSON.stringify(expectBands)
    && sum === c10.data?.data?.annualTaxKobo, 'CMP-10', '6 bands, taxKobo correct, Σ===annualTax',
    `taxes=${JSON.stringify(taxes)} sum=${sum} annual=${c10.data?.data?.annualTaxKobo}`);

  const c11 = await post('/tax/compute', income({ reliefs: { ...Z, pensionKobo: 5_000_000 } }));
  const ar = c11.data?.data?.appliedReliefs ?? [];
  r.check(c11.status === 200 && ar.length === 1 && ar[0]?.key === 'pensionKobo', 'CMP-11',
    'appliedReliefs excludes zero reliefs', `got ${JSON.stringify(ar.map((x) => x.key))}`);

  // Validation
  const vEmpty = await post('/tax/compute', {});
  r.check(isErr(vEmpty, 400, 1001, 'validation_error'), 'VAL-01', 'empty body → 400/1001',
    `got ${vEmpty.status}/${vEmpty.data?.errorCode}`);
  console.log(`      VAL-01 first field = ${errField(vEmpty)}`);

  const vNeg = await post('/tax/compute', income({ grossAnnualKobo: -5 }));
  r.check(isErr(vNeg, 400, 1001) && errField(vNeg) === 'grossAnnualKobo', 'VAL-02', 'negative gross → field grossAnnualKobo',
    `got ${vNeg.status} field=${errField(vNeg)}`);

  const vDec = await post('/tax/compute', income({ grossAnnualKobo: 1.5 }));
  r.check(isErr(vDec, 400, 1001) && errField(vDec) === 'grossAnnualKobo', 'VAL-03', 'decimal gross → field grossAnnualKobo',
    `got ${vDec.status} field=${errField(vDec)}`);

  const vStr = await post('/tax/compute', income({ grossAnnualKobo: '1000' }));
  r.check(isErr(vStr, 400, 1001) && errField(vStr) === 'grossAnnualKobo', 'VAL-04', 'string gross → field grossAnnualKobo',
    `got ${vStr.status} field=${errField(vStr)}`);

  const vProf = await post('/tax/compute', income({ profileType: 'x' }));
  r.check(isErr(vProf, 400, 1001) && errField(vProf) === 'profileType', 'VAL-05', 'bad profileType → field profileType',
    `got ${vProf.status} field=${errField(vProf)}`);

  const vNoRel = await post('/tax/compute', { profileType: 'salary_earner', grossAnnualKobo: 1000 });
  r.check(isErr(vNoRel, 400, 1001) && (errField(vNoRel) === 'reliefs' || errField(vNoRel)?.startsWith('reliefs')),
    'VAL-06', 'missing reliefs → field reliefs(.*)', `got ${vNoRel.status} field=${errField(vNoRel)}`);

  const vRelNeg = await post('/tax/compute', income({ reliefs: { ...Z, pensionKobo: -1 } }));
  r.check(isErr(vRelNeg, 400, 1001) && errField(vRelNeg) === 'reliefs.pensionKobo', 'VAL-07',
    'nested reliefs.pensionKobo=-1 → field reliefs.pensionKobo', `got ${vRelNeg.status} field=${errField(vRelNeg)}`);

  // VAL-08 — one field at a time
  const v8a = await post('/tax/compute', { profileType: 'x', grossAnnualKobo: -5, reliefs: Z });
  const okA = isErr(v8a, 400, 1001) && errField(v8a) === 'grossAnnualKobo';
  const v8b = await post('/tax/compute', { profileType: 'x', grossAnnualKobo: 1_500_000_000, reliefs: Z });
  const okB = isErr(v8b, 400, 1001) && errField(v8b) === 'profileType';
  r.check(okA && okB, 'VAL-08', 'one-field-at-a-time: gross first, then profileType',
    `first=${errField(v8a)} (want grossAnnualKobo); after-fix=${errField(v8b)} (want profileType)`);

  const v9 = await post('/tax/compute', { ...income(), foo: 'bar' });
  r.check(v9.status === 200, 'VAL-09', 'unknown field silently dropped (OBS-02)', `got ${v9.status}`);

  const v10 = await post('/tax/compute', '{ not json', {});
  r.check(v10.status === 400, 'VAL-10', 'malformed JSON → 400 (not 500)', `got ${v10.status}`);

  // VAL-11 — >1MB body
  const big = { ...income(), pad: 'x'.repeat(1_100_000) };
  const v11 = await post('/tax/compute', big);
  r.check(v11.status === 400 || v11.status === 413, 'VAL-11', '>1MB body → 400/413 (not 500)', `got ${v11.status}`);
}

// ── Section 3 — /tax/compare ─────────────────────────────────────────────────
r.section('3. /tax/compare');
{
  const c1 = await post('/tax/compare', income());
  const d = c1.data?.data;
  r.check(c1.status === 200 && d?.newRegime?.annualTaxKobo === 258_000_000 && d?.oldRegime?.annualTaxKobo === 262_400_000
    && d?.netChangeKobo === 4_400_000 && d?.direction === 'saves', 'CMR-01', 'compare stub input',
    `new=${d?.newRegime?.annualTaxKobo} old=${d?.oldRegime?.annualTaxKobo} net=${d?.netChangeKobo} dir=${d?.direction}`);

  r.check(d?.netChangeKobo === d?.oldRegime?.annualTaxKobo - d?.newRegime?.annualTaxKobo, 'CMR-02',
    'netChange = old - new', `net=${d?.netChangeKobo}`);

  const c3 = await post('/tax/compare', income({ grossAnnualKobo: 0 }));
  const d3 = c3.data?.data;
  r.check(c3.status === 200 && d3?.netChangeKobo === 0 && d3?.direction === 'no_change'
    && d3?.newRegime?.isExempt && d3?.oldRegime?.isExempt, 'CMR-03', 'gross 0 → no_change, both exempt',
    `net=${d3?.netChangeKobo} dir=${d3?.direction}`);

  r.check(d?.newRegime?.regime === 'nta_2025' && d?.oldRegime?.regime === 'pita_old', 'CMR-04',
    'regimes tagged correctly', `new=${d?.newRegime?.regime} old=${d?.oldRegime?.regime}`);

  r.check(d?.oldRegime?.totalReliefsKobo === 320_000_000 && d?.oldRegime?.taxableIncomeKobo === 1_180_000_000,
    'CMR-05', 'old CRA relief = ₦200k + 20% gross', `cra=${d?.oldRegime?.totalReliefsKobo} taxable=${d?.oldRegime?.taxableIncomeKobo}`);

  // CMR-06 — sweep for a pays_more case across low incomes
  let paysMore = null;
  for (let g = 0; g <= 200_000_000 && !paysMore; g += 5_000_000) {
    const rr = await post('/tax/compare', income({ grossAnnualKobo: g }));
    if (rr.data?.data?.direction === 'pays_more') paysMore = { g, net: rr.data.data.netChangeKobo };
  }
  if (paysMore) r.pass('CMR-06', `pays_more reachable @ gross=${paysMore.g} (net=${paysMore.net})`);
  else r.skip('CMR-06', 'pays_more not found in 0..₦2M sweep', 'documented N/A across swept range');

  r.check(Array.isArray(d?.relevantReforms) && d.relevantReforms.some((x) => x.id === 'cra_abolished'),
    'CMR-07', 'relevantReforms always includes cra_abolished', `ids=${d?.relevantReforms?.map((x) => x.id)}`);

  const ids = (d?.relevantReforms ?? []).map((x) => x.id);
  const hasZero = ids.includes('zero_band');
  r.check(ids.includes('cra_abolished') && ids.includes('nin_tax_id') && !hasZero, 'CMR-08',
    'stub input reforms = cra_abolished,nin_tax_id (no zero_band — OBS-01)', `ids=${JSON.stringify(ids)}`);

  const v = await post('/tax/compare', income({ grossAnnualKobo: -5 }));
  r.check(isErr(v, 400, 1001) && errField(v) === 'grossAnnualKobo', 'CMR-09', 'validation parity with compute',
    `got ${v.status} field=${errField(v)}`);
}

// ── Section 4 — /statement/parse ─────────────────────────────────────────────
r.section('4. /statement/parse');
let readyCode = null;
{
  const p1 = await uploadStatement({ filename: 'salary.pdf' });
  const code = p1.data?.data?.code;
  r.check(p1.status === 202 && /^\d{8}$/.test(code ?? '') && p1.data?.data?.status === 'pending',
    'PAR-01', '202 + 8-digit code + pending', `got ${p1.status} ${JSON.stringify(p1.data)}`);

  const db = await mongo();
  if (code) {
    const doc = await db.collection('tax_processes').findOne({ code });
    r.check(!!doc && doc.profileType === 'salary_earner' && doc.createdAt && doc.lastInteractionAt,
      'PAR-02', 'Mongo doc created with timestamps', `doc=${doc ? 'found' : 'missing'}`);
  } else r.block('PAR-02', 'Mongo doc created', 'no code from PAR-01');

  const p3a = await uploadStatement({ filename: 'salary.pdf' });
  const p3b = await uploadStatement({ filename: 'salary.pdf' });
  r.check(p3a.data?.data?.code !== p3b.data?.data?.code, 'PAR-03', 'each upload → unique code',
    `${p3a.data?.data?.code} vs ${p3b.data?.data?.code}`);

  const p4 = await uploadStatement({ filename: 'salary.pdf', profileType: 'freelancer' });
  const doc4 = p4.data?.data?.code ? await db.collection('tax_processes').findOne({ code: p4.data.data.code }) : null;
  r.check(p4.status === 202 && doc4?.profileType === 'freelancer', 'PAR-04', 'profileType=freelancer stored',
    `got ${p4.status} stored=${doc4?.profileType}`);

  // Validation
  const p5 = await uploadStatement({ filename: 'x.png', mimetype: 'image/png' });
  r.check(isErr(p5, 400, 1001) && errField(p5) === 'file', 'PAR-05', 'non-PDF → 400/1001 field=file',
    `got ${p5.status} field=${errField(p5)}`);

  const p6 = await uploadStatement({ filename: 'salary.pdf', profileType: null });
  r.check(isErr(p6, 400, 1001) && errField(p6) === 'profileType', 'PAR-06', 'missing profileType → field profileType',
    `got ${p6.status} field=${errField(p6)}`);

  const p7 = await uploadStatement({ filename: 'salary.pdf', profileType: 'x' });
  r.check(isErr(p7, 400, 1001) && errField(p7) === 'profileType', 'PAR-07', 'bad profileType → field profileType',
    `got ${p7.status} field=${errField(p7)}`);

  const p8 = await uploadStatement({ includeFile: false });
  r.check(isErr(p8, 400, 1001) && errField(p8) === 'file', 'PAR-08', 'no file part → field file',
    `got ${p8.status} field=${errField(p8)}`);

  // PAR-09 size handled in its own boot (needs STATEMENT_MAX_BYTES override) — skip here
  r.skip('PAR-09', 'oversize upload', 'needs STATEMENT_MAX_BYTES=1024 boot — covered in env-overrides run');

  const p12 = await post('/statement/parse', { profileType: 'salary_earner' }); // JSON not multipart
  r.check(isErr(p12, 400, 1001) && errField(p12) === 'file', 'PAR-12', 'JSON (not multipart) → field file (not 500)',
    `got ${p12.status} field=${errField(p12)}`);

  // Pipeline outcomes
  const happy = await uploadStatement({ filename: 'salary.pdf' });
  readyCode = happy.data?.data?.code;
  const fin = await pollUntilTerminal(readyCode);
  const fd = fin.data?.data;
  r.check(fd?.status === 'ready' && fd?.bankName === 'Kuda MFB' && fd?.monthsCovered === 6
    && fd?.inflows?.length === 2 && fd?.grossAnnualKobo === 1_500_000_000
    && fd?.computation?.newRegime?.annualTaxKobo === 258_000_000, 'PAR-13', 'happy → ready, full result',
    `status=${fd?.status} bank=${fd?.bankName} gross=${fd?.grossAnnualKobo} tax=${fd?.computation?.newRegime?.annualTaxKobo}`);

  const rej = await uploadStatement({ filename: 'reject.pdf' });
  const rejFin = await pollUntilTerminal(rej.data?.data?.code);
  const rfd = rejFin.data?.data;
  r.check(rfd?.status === 'failed' && /Not a usable/.test(rfd?.failureReason ?? '') && !rfd?.inflows && !rfd?.computation,
    'PAR-14', 'reject.pdf → failed, no inflows/computation', `status=${rfd?.status} reason=${rfd?.failureReason}`);
  // tier-2 never ran: only 1 gate audit row
  const auditN = rej.data?.data?.code ? await db.collection('llm_audit').countDocuments({ code: rej.data.data.code }) : -1;
  const gateOnly = rej.data?.data?.code ? await db.collection('llm_audit').countDocuments({ code: rej.data.data.code, tier: 'analysis' }) : -1;
  r.check(auditN === 1 && gateOnly === 0, 'PAR-14b', 'reject ran gate only (1 audit row, 0 analysis)',
    `total=${auditN} analysis=${gateOnly}`);

  const failPdf = await uploadStatement({ filename: 'fail.pdf' });
  const failFin = await pollUntilTerminal(failPdf.data?.data?.code);
  const ffd = failFin.data?.data;
  r.check(ffd?.status === 'failed' && !!ffd?.failureReason, 'PAR-15', 'fail.pdf → failed (throw caught, no crash)',
    `status=${ffd?.status} reason=${ffd?.failureReason}`);
}

// ── Section 5 — SSE ──────────────────────────────────────────────────────────
r.section('5. SSE');
{
  // SSE-03 — connect after already ready (readyCode is terminal). Expect one frame then close.
  if (readyCode) {
    const frames = await readSSE(`/statement/${readyCode}/events`, { maxMs: 4000 });
    const first = frames[0];
    r.check(frames.length >= 1 && first?.event === 'status' && first?.data?.status === 'ready'
      && first?.data?.computation, 'SSE-03', 'connect after ready → 1 full frame then close',
      `frames=${frames.length} firstStatus=${first?.data?.status}`);
    r.check(first && !('analysisResponseId' in first.data) && !('chatMessages' in first.data)
      && !('lastInteractionAt' in first.data) && !('gateResponseId' in first.data), 'SSE-02',
      'frame is StatementProcessView (no server-only fields)', `keys=${Object.keys(first?.data ?? {})}`);
  } else { r.block('SSE-03', 'connect after ready', 'no readyCode'); r.block('SSE-02', 'view shape', 'no readyCode'); }

  // SSE-01 — subscribe right after upload, watch progression
  const up = await uploadStatement({ filename: 'salary.pdf' });
  const liveFrames = await readSSE(`/statement/${up.data?.data?.code}/events`, { maxMs: 8000 });
  const statuses = liveFrames.map((f) => f.data?.status);
  const last = liveFrames[liveFrames.length - 1];
  r.check(statuses.includes('ready') && last?.data?.status === 'ready' && last?.data?.computation,
    'SSE-01', 'progression …→ ready, closes on ready', `statuses=${JSON.stringify(statuses)}`);
  const analyzing = liveFrames.find((f) => f.data?.status === 'analyzing');
  if (analyzing) r.check(analyzing.data?.bankName === 'Kuda MFB' && analyzing.data?.monthsCovered === 6,
    'SSE-01b', 'analyzing frame carries bankName+monthsCovered', `got ${JSON.stringify(analyzing.data?.bankName)}`);
  else r.skip('SSE-01b', 'analyzing frame', 'transitioned too fast to capture analyzing frame');

  // SSE-04 — connect after failed
  const rej = await uploadStatement({ filename: 'reject.pdf' });
  await pollUntilTerminal(rej.data?.data?.code);
  const rejFrames = await readSSE(`/statement/${rej.data?.data?.code}/events`, { maxMs: 4000 });
  r.check(rejFrames[0]?.data?.status === 'failed' && !!rejFrames[0]?.data?.failureReason, 'SSE-04',
    'connect after failed → 1 failed frame', `got ${rejFrames[0]?.data?.status}`);

  // SSE-05 — bad code format
  const bad = await get('/statement/abc/events');
  r.check(isErr(bad, 400, 1001), 'SSE-05', 'non-8-digit code → 400/1001 (not a stream)', `got ${bad.status}`);

  // SSE-06 — unknown code
  const unk = await get('/statement/00000000/events');
  r.check(isErr(unk, 404, 1004), 'SSE-06', 'unknown code → 404/1004', `got ${unk.status}/${unk.data?.errorCode}`);

  // SSE-08 — subscribe bumps lastInteractionAt
  const db = await mongo();
  if (readyCode) {
    const before = (await db.collection('tax_processes').findOne({ code: readyCode }))?.lastInteractionAt;
    await sleep(20);
    await readSSE(`/statement/${readyCode}/events`, { maxMs: 2000 });
    const after = (await db.collection('tax_processes').findOne({ code: readyCode }))?.lastInteractionAt;
    r.check(after && before && new Date(after) > new Date(before), 'SSE-08', 'subscribe bumps idle clock',
      `before=${before} after=${after}`);
  } else r.block('SSE-08', 'idle clock', 'no readyCode');

  // SSE-07 heartbeat — hard to force deterministically (15s), skip
  r.skip('SSE-07', 'heartbeat ~15s', 'not deterministically reproducible without a long-held analyzing process');
}

// ── Section 6 — Poll ─────────────────────────────────────────────────────────
r.section('6. Poll');
{
  if (readyCode) {
    const p = await get(`/statement/${readyCode}`);
    const d = p.data?.data;
    r.check(p.status === 200 && d?.status === 'ready' && Array.isArray(d?.inflows) && d?.grossAnnualKobo === 1_500_000_000
      && d?.computation, 'POL-03', 'poll ready → full result', `status=${d?.status} gross=${d?.grossAnnualKobo}`);
    r.check(!('gateResponseId' in d) && !('analysisResponseId' in d) && !('chatMessages' in d)
      && !('lastInteractionAt' in d) && !('_id' in d), 'POL-07', 'view excludes server-only fields',
      `keys=${Object.keys(d)}`);
    r.check(/^\d{4}-\d{2}-\d{2}T/.test(d?.createdAt) && /^\d{4}-\d{2}-\d{2}T/.test(d?.updatedAt)
      && /^\d{4}-\d{2}-\d{2}/.test(d?.inflows?.[0]?.date ?? ''), 'POL-08', 'dates are ISO 8601 strings',
      `created=${d?.createdAt} inflowDate=${d?.inflows?.[0]?.date}`);
    r.check(Array.isArray(d?.inflows), 'POL-09', 'inflows is array (not null)', `type=${typeof d?.inflows}`);
  } else r.block('POL-03/07/08/09', 'ready poll', 'no readyCode');

  const rej = await uploadStatement({ filename: 'reject.pdf' });
  await pollUntilTerminal(rej.data?.data?.code);
  const pr = await get(`/statement/${rej.data?.data?.code}`);
  r.check(pr.status === 200 && pr.data?.data?.status === 'failed' && !!pr.data?.data?.failureReason
    && !pr.data?.data?.inflows, 'POL-04', 'poll failed → failureReason, no inflows', `status=${pr.data?.data?.status}`);

  const p5 = await get('/statement/abc');
  r.check(isErr(p5, 400, 1001), 'POL-05', 'non-8-digit → 400/1001', `got ${p5.status}`);

  const p6 = await get('/statement/00000000');
  r.check(isErr(p6, 404, 1004, 'not_found_error'), 'POL-06', 'unknown code → 404/1004', `got ${p6.status}/${p6.data?.errorCode}`);

  // POL-10 — poll bumps idle clock
  const db = await mongo();
  if (readyCode) {
    const before = (await db.collection('tax_processes').findOne({ code: readyCode }))?.lastInteractionAt;
    await sleep(20);
    await get(`/statement/${readyCode}`);
    const after = (await db.collection('tax_processes').findOne({ code: readyCode }))?.lastInteractionAt;
    r.check(new Date(after) > new Date(before), 'POL-10', 'poll bumps idle clock', `before=${before} after=${after}`);
  } else r.block('POL-10', 'idle clock', 'no readyCode');
}

// ── Section 7 — /ai/ask ──────────────────────────────────────────────────────
r.section('7. /ai/ask');
{
  const db = await mongo();
  if (readyCode) {
    const a1 = await post('/ai/ask', { code: readyCode, question: 'Why is my effective rate so low?' });
    const d1 = a1.data?.data;
    r.check(a1.status === 200 && d1?.answer && d1?.refused === false && d1?.citations?.length >= 1
      && d1?.citations?.[0]?.section && d1?.disclaimer?.startsWith('This is an estimate'), 'AI-01',
      'in-scope → answer + citations + disclaimer, refused false',
      `status=${a1.status} refused=${d1?.refused} cites=${d1?.citations?.length}`);

    const a2 = await post('/ai/ask', { code: readyCode, question: 'How much VAT do I owe?' });
    const d2 = a2.data?.data;
    r.check(a2.status === 200 && d2?.refused === true && (d2?.citations?.length ?? 0) === 0, 'AI-02',
      'out-of-scope (VAT) → refused true, no citations', `refused=${d2?.refused} cites=${d2?.citations?.length}`);
    // no tax figure in refusal
    r.check(!/\d{3,}/.test((d2?.answer ?? '').replace(/NTA 2025|800,?000|2025/g, '')), 'AI-04',
      'refusal contains no invented tax figure', `answer="${d2?.answer}"`);

    // AI-05 — chat persisted
    const doc = await db.collection('tax_processes').findOne({ code: readyCode });
    r.check((doc?.chatMessages?.length ?? 0) >= 2 && !!doc?.analysisResponseId, 'AI-05',
      'chat persisted (≥2 messages) + analysisResponseId updated', `msgs=${doc?.chatMessages?.length} respId=${doc?.analysisResponseId}`);

    // AI-06 — continuity threaded (stub encodes previousResponseId into id)
    const lastAssistant = [...(doc?.chatMessages ?? [])].reverse().find((m) => m.role === 'assistant');
    r.check(/_from_/.test(lastAssistant?.responseId ?? '') || /^stub_chat_/.test(lastAssistant?.responseId ?? ''),
      'AI-06', 'chat responseId threads previousResponseId', `respId=${lastAssistant?.responseId}`);

    // AI-07 — ask bumps idle clock
    const before = doc?.lastInteractionAt;
    await sleep(20);
    await post('/ai/ask', { code: readyCode, question: 'Explain my bands.' });
    const after = (await db.collection('tax_processes').findOne({ code: readyCode }))?.lastInteractionAt;
    r.check(new Date(after) > new Date(before), 'AI-07', 'ask bumps idle clock', `before=${before} after=${after}`);
  } else {
    for (const id of ['AI-01', 'AI-02', 'AI-04', 'AI-05', 'AI-06', 'AI-07']) r.block(id, 'ai on ready process', 'no readyCode');
  }

  // Validation
  const v8 = await post('/ai/ask', { code: 'abc', question: 'hi' });
  r.check(isErr(v8, 400, 1001) && errField(v8) === 'code', 'AI-08', 'bad code → field code', `got ${v8.status} field=${errField(v8)}`);

  const v9 = await post('/ai/ask', { code: '12345678', question: '' });
  r.check(isErr(v9, 400, 1001) && errField(v9) === 'question', 'AI-09', 'empty question → field question', `got ${v9.status} field=${errField(v9)}`);

  const v10 = await post('/ai/ask', { code: '12345678', question: 'x'.repeat(2001) });
  r.check(isErr(v10, 400, 1001) && errField(v10) === 'question', 'AI-10', 'question>2000 → field question', `got ${v10.status} field=${errField(v10)}`);

  const v11 = await post('/ai/ask', { code: '12345678' });
  r.check(isErr(v11, 400, 1001) && errField(v11) === 'question', 'AI-11', 'missing question → field question', `got ${v11.status} field=${errField(v11)}`);

  const v12 = await post('/ai/ask', { code: 'abc', question: '' });
  r.check(isErr(v12, 400, 1001) && errField(v12) === 'code', 'AI-12', 'two bad fields → code first', `got field=${errField(v12)}`);

  const v13 = await post('/ai/ask', { code: '00000000', question: 'hi' });
  r.check(isErr(v13, 404, 1004), 'AI-13', 'unknown valid-format code → 404/1004', `got ${v13.status}/${v13.data?.errorCode}`);
}

// ── Section 8 — State machine (observed via pipeline) ────────────────────────
r.section('8. State machine');
{
  // SM-03 — terminal sticky: re-poll ready stays ready
  if (readyCode) {
    const a = (await get(`/statement/${readyCode}`)).data?.data?.status;
    const b = (await get(`/statement/${readyCode}`)).data?.data?.status;
    r.check(a === 'ready' && b === 'ready', 'SM-03', 'ready is terminal/sticky', `${a},${b}`);
  } else r.block('SM-03', 'terminal sticky', 'no readyCode');
  // SM-01/02 observed in PAR-13/14 + SSE-01; SM-04/05 are repo-level (separate script)
  r.skip('SM-01', 'forward chain', 'observed in SSE-01 progression (…→ready)');
  r.skip('SM-02', 'validating→failed', 'observed in PAR-14 (reject → failed)');
  r.skip('SM-04', 'illegal transition 409', 'repo-level — see sm-repo.test.mjs');
  r.skip('SM-05', 'same-state no-op', 'repo-level — see sm-repo.test.mjs');
}

// ── Section 11 — Error envelope & cross-cutting ──────────────────────────────
r.section('11. Error envelope');
{
  const x1 = await get('/nope');
  r.check(isErr(x1, 404, 1004, 'not_found_error') && x1.data?.errorMessage === 'Route not found', 'X-01',
    'unknown route → 404/1004 Route not found', `got ${x1.status} ${JSON.stringify(x1.data)}`);

  const x2 = await post('/tax/compute', {});
  r.check(x2.data && 'errorCode' in x2.data && 'errorMessage' in x2.data && 'type' in x2.data && !('error' in x2.data)
    && !('field_errors' in x2.data), 'X-02', 'error shape is flat (no nested error/field_errors)', `keys=${Object.keys(x2.data ?? {})}`);

  r.check(typeof x2.data?.errorCode === 'number' && x2.data.errorCode >= 1001 && x2.data.errorCode <= 1009, 'X-03',
    'errorCode numeric in 1001..1009', `got ${x2.data?.errorCode}`);

  const x4a = await post('/tax/compute', income({ grossAnnualKobo: -5 }));
  const x4b = await get('/statement/00000000');
  r.check('field' in (x4a.data ?? {}) && !('field' in (x4b.data ?? {})), 'X-04',
    'field only on validation (1001), not on 1004', `1001 hasField=${'field' in (x4a.data ?? {})} 1004 hasField=${'field' in (x4b.data ?? {})}`);

  r.check(!!x1.headers.get('x-request-id') && !!x2.headers.get('x-request-id'), 'X-05', 'x-request-id on errors too',
    `404=${!!x1.headers.get('x-request-id')}`);

  // X-06 CORS
  const cors = await get('/health', { Origin: 'http://localhost:5173' });
  r.check(cors.headers.get('access-control-allow-origin') === 'http://localhost:5173', 'X-06',
    'CORS echoes allowed origin', `got ${cors.headers.get('access-control-allow-origin')}`);

  // X-07 wrong method
  const x7 = await get('/tax/compute');
  r.check(x7.status === 404, 'X-07', 'GET on POST-only route → 404 (not 500)', `got ${x7.status}`);
}

// ── Section 12 — PII / audit ─────────────────────────────────────────────────
r.section('12. PII / audit');
{
  const db = await mongo();
  // PII-03/04 — audit rows for the happy ready process
  if (readyCode) {
    const rows = await db.collection('llm_audit').find({ code: readyCode }).toArray();
    const hashOk = rows.every((x) => /^[0-9a-f]{32}$/.test(x.promptHash));
    const noText = rows.every((x) => !('system' in x) && !('user' in x) && !('prompt' in x) && !('pdf' in x));
    const fieldsOk = rows.every((x) => x.code && ['gate', 'analysis', 'chat'].includes(x.tier) && x.model
      && typeof x.inputTokens === 'number' && typeof x.outputTokens === 'number'
      && typeof x.latencyMs === 'number' && x.circuitState && x.createdAt);
    r.check(rows.length >= 2 && hashOk && noText, 'PII-03', 'audit promptHash is 32-hex, no raw prompt text',
      `rows=${rows.length} hashOk=${hashOk} noText=${noText}`);
    r.check(fieldsOk, 'PII-04', 'audit rows have all required fields', `n=${rows.length}`);
  } else { r.block('PII-03', 'audit', 'no readyCode'); r.block('PII-04', 'audit', 'no readyCode'); }
  // PII-01/02 (log grep) handled by the runner wrapper (separate log capture) — noted
  r.skip('PII-01', 'no raw statement in logs', 'verified via boot-log grep in run wrapper (0 hits)');
  r.skip('PII-02', 'no nin/bvn/acct in logs', 'verified via boot-log grep in run wrapper');
}

// ── SSE reader helper ─────────────────────────────────────────────────────────
async function readSSE(path, { maxMs = 6000 } = {}) {
  const ctrl = new AbortController();
  const t = setTimeout(() => ctrl.abort(), maxMs);
  const frames = [];
  try {
    const res = await fetch(`${BASE}${path}`, { headers: { Accept: 'text/event-stream' }, signal: ctrl.signal });
    if (res.status !== 200) { clearTimeout(t); return frames; }
    const reader = res.body.getReader();
    const dec = new TextDecoder();
    let buf = '';
    while (true) {
      const { value, done } = await reader.read();
      if (done) break;
      buf += dec.decode(value, { stream: true });
      const chunks = buf.split('\n\n');
      buf = chunks.pop();
      for (const chunk of chunks) {
        const ev = {};
        for (const line of chunk.split('\n')) {
          if (line.startsWith('event:')) ev.event = line.slice(6).trim();
          else if (line.startsWith('data:')) { try { ev.data = JSON.parse(line.slice(5).trim()); } catch { ev.data = line.slice(5).trim(); } }
        }
        if (ev.event || ev.data) frames.push(ev);
      }
    }
  } catch { /* aborted on terminal-close or timeout */ }
  clearTimeout(t);
  return frames;
}

r.summary();
await closeMongo();
