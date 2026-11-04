// Result-screen check (#resBody: tier card, metrics, tabs, ladder, predictions, training paces, share image).
// tools/snap.mjs only exports the share-image editor's canvas, so this one compares the result screen itself.
//
// For a few fixed inputs (different tiers, both sexes, the top tier with no next tier) it opens /result/ and records:
// the #resBody markup, state.story (window.__story()), a full-page screenshot, the markup after using the screen
// (tabs, 전체 단계 보기, ⓘ, a pace row, 주간 km), and the shared result image (window.__resultImage()).
// Then it opens a 공유 카드 from /log/ and goes to a result from there (renderResult has to leave the card mode).
// Same fixed clock and blocked network as tools/snap.mjs. CSS animations are switched off (the top-tier cards shimmer).
//
//   node tools/rescmp.mjs                      print one line per step for this checkout
//   node tools/rescmp.mjs --root <dir>         ...for another checkout of the repo
//   node tools/rescmp.mjs --against <dir>      run this checkout and <dir>, exit 1 if any line differs
//
// Compare a branch with main:
//   git worktree add /tmp/hoohaa-main origin/main
//   node tools/rescmp.mjs --against /tmp/hoohaa-main
//   git worktree remove /tmp/hoohaa-main
//
// Exits 1 on a page error or a step that could not run, so two runs that break the same way never pass as "same".
// Needs the preinstalled Playwright + Chromium (do not run `playwright install`).
import http from 'node:http';
import { createRequire } from 'node:module';
import { createHash } from 'node:crypto';
import { readFileSync, existsSync, statSync } from 'node:fs';
import { join, extname, normalize, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';

const here = fileURLToPath(new URL('..', import.meta.url));
const args = process.argv.slice(2);
const opt = (n) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] != null ? resolve(args[i + 1]) : null; };
const ROOT = opt('--root') || here, AGAINST = opt('--against');

const NOW = Date.parse('2026-05-15T12:00:00+09:00');
// digits: read from the right two at a time (5000 = 50:00, 10530 = 1:05:30)
const INPUTS = [
  ['10k-m-gold', { ev: '10K', km: '', digits: '5000', sex: 'M', by: '1991' }],
  ['5k-f-fast', { ev: '5K', km: '', digits: '1730', sex: 'F', by: '1998' }],
  ['half-m-slow', { ev: 'half', km: '', digits: '25500', sex: 'M', by: '1962' }],
  ['full-m-top', { ev: 'full', km: '', digits: '20200', sex: 'M', by: '1990' }],
  ['5k-f-iron', { ev: '5K', km: '', digits: '5500', sex: 'F', by: '1975' }],
];
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.txt': 'text/plain' };

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

// Runs in the page before any app script: fixed clock + saved input (same as tools/snap.mjs).
function initScript({ now, input }) {
  const Real = Date, t0 = performance.now();
  const cur = () => now + Math.floor(performance.now() - t0);
  class FixedDate extends Real {
    constructor(...a) { if (a.length) super(...a); else super(cur()); }
    static now() { return cur(); }
  }
  FixedDate.UTC = Real.UTC; FixedDate.parse = Real.parse;
  globalThis.Date = FixedDate;
  try { localStorage.clear(); localStorage.setItem('runtier:last', JSON.stringify(input)); } catch (e) {}
}

const hash = (s) => createHash('sha1').update(s).digest('hex').slice(0, 12);
const ready = () => typeof window.__exportSig === 'function' && document.querySelector('#resBody .tier-card') && document.querySelectorAll('#tplList .tpl-btn[data-t]').length > 0;
// The top tiers' card shimmers (CSS animation), which would make screenshots and the share image differ run to run.
const settle = async (page) => {
  await page.addStyleTag({ content: '*,*::before,*::after{animation:none!important;transition:none!important}' });
  await page.evaluate(async () => { await document.fonts.ready; await new Promise((r) => setTimeout(r, 300)); });
};

async function run(browser, root) {
  const srv = await serve(root);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const lines = [], errors = [], broken = [];
  const newCtx = async (input) => {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block', reducedMotion: 'reduce' });
    await ctx.route('**/*', (route) => { const u = new URL(route.request().url()); return u.origin === base || u.protocol === 'data:' || u.protocol === 'blob:' ? route.continue() : route.abort(); });
    await ctx.addInitScript(initScript, { now: NOW, input });
    const page = await ctx.newPage(); page.on('pageerror', (e) => errors.push(String(e)));
    return [ctx, page];
  };
  const step = async (name, fn) => { try { lines.push(`${name} ${await fn()}`); } catch (e) { broken.push(`${name}: ${String(e).split('\n')[0]}`); lines.push(`${name} BROKEN`); } };
  try {
    for (const [name, input] of INPUTS) {
      const [ctx, page] = await newCtx(input);
      try {
        await page.goto(base + '/result/');
        await page.waitForFunction(ready, null, { timeout: 30000 });
        await settle(page);
        await step(`${name} markup`, async () => hash(await page.$eval('#resBody', (e) => e.innerHTML)));
        await step(`${name} story`, async () => { const s = await page.evaluate(() => JSON.stringify(window.__story())); return `${hash(s)} ${JSON.parse(s).key}`; });
        await step(`${name} screen`, async () => hash(await page.screenshot({ fullPage: true })));
        await step(`${name} share-image`, async () => {
          const b64 = await page.evaluate(async () => { const b = await window.__resultImage(); const u = new Uint8Array(await b.arrayBuffer()); let s = ''; for (let i = 0; i < u.length; i += 0x8000) s += String.fromCharCode.apply(null, u.subarray(i, i + 0x8000)); return btoa(s); });
          return hash(Buffer.from(b64, 'base64'));
        });
        await step(`${name} used`, async () => {
          const s = await page.evaluate(async () => {
            const $ = (id) => document.getElementById(id), out = [];
            for (const t of ['rtPred', 'rtPace', 'rtLad']) { $(t).click(); out.push(t + ':' + [...document.querySelectorAll('#resBody [role=tabpanel]')].map((p) => p.hidden ? 0 : 1).join('')); }
            $('ladMore').click(); out.push('lad:' + $('ladder').className + ':' + $('ladMore').textContent);
            const info = document.querySelector('#resBody .info'); info.click(); out.push('info:' + info.getAttribute('aria-expanded'));
            $('rtPace').click(); const row = document.querySelector('#resBody .prow'); row.click(); out.push('prow:' + row.getAttribute('aria-expanded') + row.querySelector('.chev').textContent);
            const wk = $('wkKm'); wk.value = '42'; wk.dispatchEvent(new Event('input', { bubbles: true }));
            return out.join(' | ') + ' || ' + $('resBody').innerHTML;
          });
          return hash(s);
        });
      } finally { await ctx.close(); }
    }

    // 공유 카드 → result: renderResult has to drop the card doc and the log-mode class, then refill the template list
    const [ctx, page] = await newCtx(INPUTS[0][1]);
    try {
      await page.goto(base + '/log/');
      await page.waitForSelector('#lgForm #lgDist', { timeout: 30000 });
      await page.fill('#lgDist', '10'); await page.fill('#lgTime', '50:00');
      await page.click('#lgSave');
      await page.waitForFunction(() => typeof window.__logDoc === 'function' && window.__logDoc() && document.body.classList.contains('log-mode'), null, { timeout: 30000 });
      await step('log→result before', async () => (await page.evaluate(() => [document.body.classList.contains('log-mode'), !!window.__logDoc(), document.querySelectorAll('#tplList [data-lt]').length].join(','))));
      await page.waitForTimeout(3000); // let the card thumbnails (logThumbs) finish first
      await page.evaluate(() => document.getElementById('go').click());
      await page.waitForFunction(ready, null, { timeout: 30000 });
      await settle(page);
      await step('log→result after', async () => (await page.evaluate(() => [document.body.classList.contains('log-mode'), !!window.__logDoc(), window.__doc() && window.__doc().tpl, document.querySelectorAll('#tplList [data-t]').length, document.querySelectorAll('#tplList [data-lt]').length].join(','))));
      await step('log→result markup', async () => hash(await page.$eval('#resBody', (e) => e.innerHTML)));
      await step('log→result export', async () => hash(await page.evaluate(async () => { await window.__exportSig(); await document.fonts.ready; await window.__exportSig(); return window.__lastStory.toDataURL('image/png'); })));
    } finally { await ctx.close(); }
    return { lines, errors, broken };
  } finally {
    srv.close();
  }
}

function problems(name, r) {
  const p = [];
  for (const b of r.broken) p.push(`${name}: step failed: ${b}`);
  for (const e of r.errors) p.push(`${name}: page error: ${e}`);
  return p;
}

async function main() {
  const require = createRequire(import.meta.url);
  let pw;
  try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
  const browser = await pw.chromium.launch();
  try {
    const a = await run(browser, ROOT);
    if (!AGAINST) {
      console.log(a.lines.join('\n'));
      console.log(`rescmp: ${a.lines.length} steps · ${a.errors.length} page error(s)`);
      const p = problems(ROOT, a);
      if (p.length) { console.error(p.map((x) => '✗ ' + x).join('\n')); process.exitCode = 1; }
      return;
    }
    const b = await run(browser, AGAINST);
    const p = [...problems(ROOT, a), ...problems(AGAINST, b)];
    const n = Math.max(a.lines.length, b.lines.length);
    for (let i = 0; i < n; i++) if (a.lines[i] !== b.lines[i]) p.push(`differs:\n    ${ROOT}: ${a.lines[i] ?? '(none)'}\n    ${AGAINST}: ${b.lines[i] ?? '(none)'}`);
    if (p.length) { console.error(p.map((x) => '✗ ' + x).join('\n')); console.error(`\nrescmp: ${p.length} problem(s)`); process.exitCode = 1; return; }
    console.log(`rescmp ok · ${a.lines.length} steps match (${INPUTS.length} inputs + 공유 카드 → 결과) · no page errors`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
