// Sticker render check for the share-image editor. tools/snap.mjs draws no stickers,
// so this one adds every sticker through the editor UI and hashes what it draws.
//
// For each sticker tab (#stkCats) it opens the minimal template, records the hash of the
// sticker's preview canvas, adds the sticker (one more layer each time) and records the
// hash of the exported PNG (window.__exportSig(), then window.__lastStory).
// Same fixed clock, input and blocked network as tools/snap.mjs.
//
//   node tools/stkcmp.mjs                      print one line per step for this checkout
//   node tools/stkcmp.mjs --root <dir>         ...for another checkout of the repo
//   node tools/stkcmp.mjs --against <dir>      run this checkout and <dir>, exit 1 if any line differs
//
// Compare a branch with main:
//   git worktree add /tmp/hoohaa-main origin/main
//   node tools/stkcmp.mjs --against /tmp/hoohaa-main
//   git worktree remove /tmp/hoohaa-main
//
// Exits 1 on a page error, a sticker button that disappears, or no stickers at all, so two
// runs that break the same way never pass as "same".
// Not covered: the v3 canvas stickers (STICKERS: wordmark, emblem, ...), which have no tab.
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
const INPUT = { ev: '10K', km: '', digits: '5000', sex: 'M', by: '1991' };
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

async function run(browser, root) {
  const srv = await serve(root);
  const base = `http://127.0.0.1:${srv.address().port}`;
  const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
  try {
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      return u.origin === base || u.protocol === 'data:' || u.protocol === 'blob:' ? route.continue() : route.abort();
    });
    await ctx.addInitScript(initScript, { now: NOW, input: INPUT });
    const page = await ctx.newPage();
    const errors = [];
    page.on('pageerror', (e) => errors.push(String(e)));
    await page.goto(base + '/result/');
    await page.waitForFunction(() => typeof window.__exportSig === 'function' && document.querySelectorAll('#tplList .tpl-btn[data-t]').length > 0, null, { timeout: 30000 });
    await page.evaluate(() => document.querySelector('#tplList .tpl-btn[data-t="minimal"]').click());

    // Adding a sticker selects it and swaps the panel, so reopen the sticker tool (and tab) every time.
    // Clicking the tool while it is pressed closes it, hence the aria-pressed check.
    const open = (cat) => page.evaluate(async (cat) => {
      const wait = (ms) => new Promise((r) => setTimeout(r, ms));
      for (let i = 0; i < 3 && !document.querySelector('#stkCats'); i++) {
        const tb = document.querySelector('#tools [data-tool="sticker"]');
        if (tb.getAttribute('aria-pressed') === 'true') { tb.click(); await wait(50); }
        tb.click(); await wait(100);
      }
      const t = cat && document.querySelector(`#stkCats [data-stkcat="${cat}"]`);
      if (t && t.getAttribute('aria-checked') !== 'true') t.click();
      await wait(400); await document.fonts.ready; await wait(200); // preview canvases render after the tab paints
      return [...document.querySelectorAll('#stkCats [data-stkcat]')].map((b) => b.dataset.stkcat);
    }, cat);

    const cats = await open(null);
    const lines = [];
    let missing = 0;
    for (const cat of cats) {
      await open(cat);
      const btns = await page.evaluate(() => [...document.querySelectorAll('[data-addstk],[data-addin]')]
        .map((b) => [b.dataset.addstk ? 'addstk' : 'addin', b.dataset.addstk || b.dataset.addin, b.querySelector('canvas').toDataURL()]));
      for (const [kind, k, prev] of btns) {
        lines.push(`preview ${cat}/${k} ${hash(prev)}`);
        await open(cat);
        const [n, png] = await page.evaluate(async ({ kind, k }) => {
          const b = document.querySelector(`[data-${kind}="${k}"]`); if (!b) return [-1, ''];
          b.click(); await new Promise((r) => setTimeout(r, 100)); await document.fonts.ready;
          await window.__exportSig(); await document.fonts.ready;
          await window.__exportSig(); // second export after every font the doc needs is in
          return [window.__doc().layers.length, window.__lastStory.toDataURL('image/png')];
        }, { kind, k });
        if (n < 0) missing++;
        lines.push(`export ${cat}/${k} layers=${n} ${n < 0 ? 'MISSING' : hash(png)}`);
      }
    }
    return { lines, cats, errors, missing };
  } finally {
    await ctx.close();
    srv.close();
  }
}

function problems(name, r) {
  const p = [];
  if (!r.lines.length) p.push(`${name}: no stickers found`);
  if (r.missing) p.push(`${name}: ${r.missing} sticker button(s) disappeared`);
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
      console.log(`stkcmp: ${a.lines.length} steps · tabs ${a.cats.join(',')} · ${a.errors.length} page error(s)`);
      const p = problems(ROOT, a);
      if (p.length) { console.error(p.map((x) => '✗ ' + x).join('\n')); process.exitCode = 1; }
      return;
    }
    const b = await run(browser, AGAINST);
    const p = [...problems(ROOT, a), ...problems(AGAINST, b)];
    const n = Math.max(a.lines.length, b.lines.length);
    for (let i = 0; i < n; i++) if (a.lines[i] !== b.lines[i]) p.push(`differs:\n    ${ROOT}: ${a.lines[i] ?? '(none)'}\n    ${AGAINST}: ${b.lines[i] ?? '(none)'}`);
    if (p.length) { console.error(p.map((x) => '✗ ' + x).join('\n')); console.error(`\nstkcmp: ${p.length} problem(s)`); process.exitCode = 1; return; }
    console.log(`stkcmp ok · ${a.lines.length} steps match (${a.lines.length / 2} stickers, tabs ${a.cats.join(',')}) · no page errors`);
  } finally {
    await browser.close();
  }
}

main().catch((e) => { console.error(e); process.exit(1); });
