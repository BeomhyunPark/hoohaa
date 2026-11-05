// Calculator-page check: the same typed input on every calculator page must give the same screen.
// Pages: /pace-calculator/ (기록·페이스), /predictor/, /splits/, /vdot/, /vo2max/, /bmr/, and the home record field (/app/).
// (/pace/ has only a static pace table and tabs, no input.)
//
// For each case it types into the page the way a person does (keyboard, backspace, paste-like fill), then records
// one line: the input's value, the hint text and its bad state, aria-invalid and the output markup. Then it blurs the
// field and records again (the time fields reformat on blur). /bmr/ also loads from ?s=&a=&h=&w=&k= links.
//
//   node tools/calccmp.mjs                      print one line per step for this checkout
//   node tools/calccmp.mjs --root <dir>         ...for another checkout of the repo
//   node tools/calccmp.mjs --against <dir>      run this checkout and <dir>, exit 1 if any line differs
//
// Compare a branch with main:
//   git worktree add /tmp/hoohaa-main origin/main
//   node tools/calccmp.mjs --against /tmp/hoohaa-main
//   git worktree remove /tmp/hoohaa-main
//
// Exits 1 on a page error, so two runs that break the same way never pass as "same".
// Needs the preinstalled Playwright + Chromium (do not run `playwright install`).
import http from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] != null ? resolve(args[i + 1]) : null; };
const ROOT = opt('--root') || here, AGAINST = opt('--against');
const NOW = Date.parse('2026-05-15T12:00:00+09:00');
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.txt': 'text/plain' };

function serve(root) {
  const srv = http.createServer((req, res) => {
    let f = normalize(join(root, decodeURIComponent(new URL(req.url, 'http://x').pathname)));
    if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

function initScript(now) {
  const Real = Date, t0 = performance.now();
  const cur = () => now + Math.floor(performance.now() - t0);
  class FixedDate extends Real {
    constructor(...a) { if (a.length) super(...a); else super(cur()); }
    static now() { return cur(); }
  }
  FixedDate.UTC = Real.UTC; FixedDate.parse = Real.parse;
  globalThis.Date = FixedDate;
  try { if (!sessionStorage.getItem('keepLS')) localStorage.clear(); } catch (e) {}
}

// Typed input. 'k:' = keyboard typing, 'f:' = fill (one input event, like a paste), 'bs<n>' = n backspaces.
const TIME_INPUTS = ['k:5000', 'k:10530', 'k:0', 'k:000', 'k:7500', 'k:6000', 'k:1234567', 'k:295959', 'k:305959', 'k:5', 'k:59', 'k:100',
  'k:00012', 'k:5000|bs2', 'k:10530|bs3', 'f:1:05:30', 'f: 50 00 ', 'f:50：00', 'f:-500', 'f:4:00:00', 'f:abc', 'f:', 'k:3:2:1'];
const PACE_INPUTS = ['k:530', 'k:0', 'k:5', 'k:59', 'k:560', 'k:9959', 'k:10000', 'k:1234', 'k:00530', 'k:530|bs2', 'f:5:30', 'f:5：30', 'f:-530', 'f: 4 30', 'f:'];

const PAGES = [
  { path: '/predictor/', field: 'vT', hint: 'vHint', out: 'vOut', select: ['vEv', ['5K', 'half', 'full']] },
  { path: '/vdot/', field: 'vT', hint: 'vHint', out: 'vOut', select: ['vEv', ['5K', 'half', 'full']] },
  { path: '/vo2max/', field: 'vT', hint: 'vHint', out: 'vOut', select: ['vEv', ['5K', 'half', 'full']] },
  { path: '/splits/', field: 'sT', hint: 'sHint', out: 'sO', select: ['sEv', ['5K', '10K', 'half']] },
  { path: '/pace-calculator/', field: 'pT', hint: 'pHint', out: 'pO', dist: ['pD', ['21.0975', '0', '-5', '', '5']] },
  { path: '/pace-calculator/', field: 'pP', hint: 'pHint2', out: 'pO2', pace: true },
  { path: '/app/', field: 'tq', hint: 'tqHint', out: ['tqMirror', 'tqPace', 'go'], home: true },
];

async function typeInto(page, id, spec) {
  const el = page.locator('#' + id);
  await el.click();
  await page.keyboard.press('Control+A'); await page.keyboard.press('Backspace');
  for (const step of spec.split('|')) {
    if (step.startsWith('k:')) await page.keyboard.type(step.slice(2));
    else if (step.startsWith('f:')) await el.fill(step.slice(2));
    else if (step.startsWith('bs')) for (let i = 0; i < +step.slice(2); i++) await page.keyboard.press('Backspace');
  }
}

const snapState = (page, p) => page.evaluate(({ field, hint, out }) => {
  const $ = (id) => document.getElementById(id), f = $(field), h = $(hint);
  const outs = (Array.isArray(out) ? out : [out]).map((id) => id === 'go' ? 'go.disabled=' + $(id).disabled : $(id).innerHTML);
  return JSON.stringify([f.value, f.getAttribute('aria-invalid'), h.textContent, h.classList.contains('bad'), ...outs]);
}, p);

async function runTimePages(browser, base, lines, errors) {
  for (const p of PAGES) {
    const ctx = await browser.newContext(); const page = await ctx.newPage();
    await page.addInitScript(initScript, NOW);
    page.on('pageerror', (e) => errors.push(`${p.path}: ${e.message}`));
    await page.goto(base + p.path); await page.waitForLoadState('load'); await page.waitForTimeout(150);
    if (p.home) { await page.locator('#sexChips button').first().click(); await page.fill('#by', '1990'); }
    lines.push(`${p.path}#${p.field} load ${await snapState(page, p)}`);
    for (const spec of p.pace ? PACE_INPUTS : TIME_INPUTS) {
      await typeInto(page, p.field, spec);
      lines.push(`${p.path}#${p.field} ${JSON.stringify(spec)} ${await snapState(page, p)}`);
      await page.locator('#' + p.field).blur();
      lines.push(`${p.path}#${p.field} ${JSON.stringify(spec)} blur ${await snapState(page, p)}`);
    }
    if (p.select || p.dist) {
      const [id, vals] = p.select || p.dist;
      for (const t of ['k:5000', 'k:21500', 'k:40000']) {
        await typeInto(page, p.field, t);
        for (const v of vals) {
          if (p.select) await page.selectOption('#' + id, v); else await page.fill('#' + id, v);
          lines.push(`${p.path}#${p.field} ${t} ${id}=${v} ${await snapState(page, p)}`);
        }
      }
    }
    if (p.home) { // restore from saved input after reload
      for (const digits of ['5000', '10530', '0', '7500', '']) {
        await page.evaluate((d) => { sessionStorage.setItem('keepLS', '1'); localStorage.setItem('runtier:last', JSON.stringify({ ev: '10K', km: '', digits: d, sex: 'M', by: '1990' })); }, digits);
        await page.reload(); await page.waitForLoadState('load'); await page.waitForTimeout(150);
        lines.push(`/app/ restore ${digits} ${await snapState(page, p)}`);
      }
    }
    await ctx.close();
  }
}

const BMR_CASES = [];
for (const s of ['m', 'f']) for (const [a, h, w] of [['30', '175', '70'], ['10', '100', '25'], ['100', '230', '250'], ['45', '162.5', '58.4'], ['80', '150', '40']])
  for (const k of ['1.2', '1.375', '1.55', '1.725', '1.9']) BMR_CASES.push({ s, a, h, w, k });
for (const [a, h, w] of [['9', '175', '70'], ['101', '175', '70'], ['30', '99', '70'], ['30', '231', '70'], ['30', '175', '24'], ['30', '175', '251'], ['', '175', '70'], ['30', '', '70'], ['30', '175', ''], ['30.5', '175', '70'], ['-30', '175', '70']])
  BMR_CASES.push({ s: 'm', a, h, w, k: '1.55' });

async function runBmr(browser, base, lines, errors) {
  const ctx = await browser.newContext(); const page = await ctx.newPage();
  await page.addInitScript(initScript, NOW);
  page.on('pageerror', (e) => errors.push(`/bmr/: ${e.message}`));
  const state = () => page.evaluate(() => JSON.stringify([...['oBmr', 'oTdee', 'oMul', 'oCut', 'oKeep', 'oBulk', 'bMsg'].map((i) => document.getElementById(i).textContent),
    document.getElementById('sM').getAttribute('aria-pressed'), document.getElementById('bAct').value, location.search]));
  await page.goto(base + '/bmr/'); await page.waitForLoadState('load'); await page.waitForTimeout(100);
  lines.push(`/bmr/ load ${await state()}`);
  for (const c of BMR_CASES) {
    await page.click(c.s === 'm' ? '#sM' : '#sF');
    await page.fill('#bAge', c.a); await page.fill('#bH', c.h); await page.fill('#bW', c.w); await page.selectOption('#bAct', c.k);
    lines.push(`/bmr/ ${JSON.stringify(c)} ${await state()}`);
  }
  for (const q of ['?s=f&a=30&h=165&w=55&k=1.375', '?s=m&a=40&h=180&w=80&k=1.9', '?a=30&h=175&w=70&k=9', '?s=x&a=200&h=175&w=70', '?a=25&h=170']) {
    await page.goto(base + '/bmr/' + q); await page.waitForLoadState('load'); await page.waitForTimeout(100);
    lines.push(`/bmr/ load ${q} ${await state()}`);
  }
  await ctx.close();
}

async function run(browser, root) {
  const srv = await serve(root), base = `http://127.0.0.1:${srv.address().port}`;
  const lines = [], errors = [];
  try {
    await runTimePages(browser, base, lines, errors);
    await runBmr(browser, base, lines, errors);
  } finally { srv.close(); }
  return { lines, errors };
}

async function main() {
  const pw = createRequire(import.meta.url)('playwright');
  const browser = await pw.chromium.launch();
  try {
    const a = await run(browser, ROOT);
    const problems = (root, r) => r.errors.map((e) => `${root}: page error: ${e}`);
    if (!AGAINST) {
      console.log(a.lines.join('\n'));
      console.log(`calccmp: ${a.lines.length} steps · ${a.errors.length} page error(s)`);
      const p = problems(ROOT, a);
      if (p.length) { console.error(p.map((x) => '✗ ' + x).join('\n')); process.exitCode = 1; }
      return;
    }
    const b = await run(browser, AGAINST);
    const p = [...problems(ROOT, a), ...problems(AGAINST, b)];
    const n = Math.max(a.lines.length, b.lines.length);
    for (let i = 0; i < n; i++) if (a.lines[i] !== b.lines[i]) p.push(`differs:\n    ${ROOT}: ${a.lines[i] ?? '(none)'}\n    ${AGAINST}: ${b.lines[i] ?? '(none)'}`);
    if (p.length) { console.error(p.map((x) => '✗ ' + x).join('\n')); console.error(`\ncalccmp: ${p.length} problem(s)`); process.exitCode = 1; return; }
    console.log(`calccmp ok · ${a.lines.length} steps match · no page errors`);
  } finally { await browser.close(); }
}
main().catch((e) => { console.error(e); process.exit(1); });
