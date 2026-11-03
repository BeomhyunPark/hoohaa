// Render snapshot test for the share-image editor (src/editor/editor.js).
// Opens the result screen for a fixed input (10K 50:00, 30대 남성), then for every
// template × image format exports the final PNG through the editor's exportCanvas
// (window.__exportSig() calls finalCanvas, which is mountEditor's exportCanvas, and
// keeps the canvas in window.__lastStory).
//
//   node tools/snap.mjs            write PNGs to tools/snap/out/
//   node tools/snap.mjs --update   write PNGs to tools/snap/baseline/ (new baseline)
//   node tools/snap.mjs --check    compare with tools/snap/baseline/, exit 1 on a difference;
//                                  diff images go to tools/snap/diff/
//   options: --only <substring>    only cases whose name contains it (e.g. --only story)
//            --tol <0-255>         per-channel tolerance before a pixel counts as different (default 0)
//            --max <ratio>         allowed share of different pixels per image (default 0)
//
// Needs the preinstalled Playwright + Chromium (do not run `playwright install`).
import http from 'node:http';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync, mkdirSync, rmSync, existsSync, statSync, readdirSync } from 'node:fs';
import { join, extname, normalize } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = fileURLToPath(new URL('..', import.meta.url));
const SNAP = join(root, 'tools', 'snap');
const args = process.argv.slice(2);
const flag = (n) => args.includes(n);
const opt = (n, d) => { const i = args.indexOf(n); return i >= 0 && args[i + 1] != null ? args[i + 1] : d; };
const CHECK = flag('--check'), UPDATE = flag('--update');
const ONLY = opt('--only', '');
const TOL = +opt('--tol', 0), MAX = +opt('--max', 0);

// Fixed input and clock. Noon in Seoul so the date never rolls over during a run.
const NOW = Date.parse('2026-05-15T12:00:00+09:00');
const INPUT = { ev: '10K', km: '', digits: '5000', sex: 'M', by: '1991' }; // 2026 - 1991 = 35 → 30대

// ---- static server (repo root, dir → index.html) ----
const MIME = { '.html': 'text/html; charset=utf-8', '.js': 'text/javascript', '.mjs': 'text/javascript', '.css': 'text/css', '.json': 'application/json',
  '.svg': 'image/svg+xml', '.png': 'image/png', '.jpg': 'image/jpeg', '.webp': 'image/webp', '.ico': 'image/x-icon', '.woff2': 'font/woff2', '.woff': 'font/woff',
  '.ttf': 'font/ttf', '.otf': 'font/otf', '.webmanifest': 'application/manifest+json', '.wasm': 'application/wasm', '.tflite': 'application/octet-stream', '.txt': 'text/plain' };
function serve() {
  const srv = http.createServer((req, res) => {
    let p = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let f = normalize(join(root, p));
    if (!f.startsWith(root)) { res.writeHead(403).end(); return; }
    if (existsSync(f) && statSync(f).isDirectory()) f = join(f, 'index.html');
    if (!existsSync(f)) { res.writeHead(404).end('not found'); return; }
    res.writeHead(200, { 'content-type': MIME[extname(f)] || 'application/octet-stream', 'cache-control': 'no-store' });
    res.end(readFileSync(f));
  });
  return new Promise((r) => srv.listen(0, '127.0.0.1', () => r(srv)));
}

// Runs in the page before any app script: fixed clock + no outside network.
function initScript({ now, input }) {
  const Real = Date, t0 = performance.now();
  const cur = () => now + Math.floor(performance.now() - t0); // stays on the fixed day; timers still see time move
  class FixedDate extends Real {
    constructor(...a) { if (a.length) super(...a); else super(cur()); }
    static now() { return cur(); }
  }
  FixedDate.UTC = Real.UTC; FixedDate.parse = Real.parse;
  globalThis.Date = FixedDate;
  try { localStorage.clear(); localStorage.setItem('runtier:last', JSON.stringify(input)); } catch (e) {}
}

async function main() {
  const require = createRequire(import.meta.url);
  let pw;
  try { pw = require('playwright'); } catch { pw = require('/opt/node-tools/node_modules/playwright'); }
  const srv = await serve();
  const base = `http://127.0.0.1:${srv.address().port}`;
  const browser = await pw.chromium.launch();
  const blocked = new Set();
  let failed = false;
  try {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
    await ctx.route('**/*', (route) => {
      const u = new URL(route.request().url());
      if (u.origin === base || u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
      blocked.add(u.origin + u.pathname); return route.abort(); // weather, analytics, anything off this machine
    });
    await ctx.addInitScript(initScript, { now: NOW, input: INPUT });
    const page = await ctx.newPage();
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    await page.goto(base + '/result/');
    await page.waitForFunction(() => typeof window.__exportSig === 'function' && document.querySelectorAll('#tplList .tpl-btn[data-t]').length > 0, null, { timeout: 30000 });
    await page.evaluate(() => document.fonts.ready);
    const story = await page.evaluate(() => { const s = window.__story && window.__story(); return s ? { key: s.key, pct: s.pct } : null; }).catch(() => null);
    const tpls = await page.$$eval('#tplList .tpl-btn[data-t]', (bs) => bs.map((b) => b.dataset.t));
    const fmts = await page.$$eval('#fmtSeg [data-v]', (bs) => bs.map((b) => b.dataset.v));
    if (!tpls.length || !fmts.length) throw new Error('no templates/formats found');

    const outDir = UPDATE ? join(SNAP, 'baseline') : join(SNAP, 'out');
    const diffDir = join(SNAP, 'diff');
    if (UPDATE) rmSync(outDir, { recursive: true, force: true });
    mkdirSync(outDir, { recursive: true });
    if (CHECK) rmSync(diffDir, { recursive: true, force: true });

    const cases = [];
    for (const f of fmts) for (const t of tpls) if (!ONLY || `${t}-${f}`.includes(ONLY)) cases.push([t, f]);
    console.log(`snap: ${cases.length} cases (${tpls.length} templates × ${fmts.length} formats)${story ? ` · story ${JSON.stringify(story)}` : ''}`);

    const results = [];
    for (const [t, f] of cases) {
      const name = `${t}-${f}`;
      // format first (relayouts the current doc), then the template (newDoc in that format)
      const b64 = await page.evaluate(async ({ t, f }) => {
        const fb = document.querySelector(`#fmtSeg [data-v="${f}"]`); fb.click();
        const tb = document.querySelector(`#tplList .tpl-btn[data-t="${t}"]`); tb.click();
        await document.fonts.ready;
        const d = window.__doc();
        if (d.tpl !== t || (d.fmt || 'story') !== f) throw new Error(`doc is ${d.tpl}/${d.fmt}, wanted ${t}/${f}`);
        await window.__exportSig(); // = exportCanvas()
        await document.fonts.ready;
        await window.__exportSig(); // second export after every font the doc needs is in
        return window.__lastStory.toDataURL('image/png').split(',')[1];
      }, { t, f });
      const png = Buffer.from(b64, 'base64');
      writeFileSync(join(outDir, name + '.png'), png);
      results.push({ name, png });
    }

    if (CHECK) {
      const bdir = join(SNAP, 'baseline');
      const have = new Set(existsSync(bdir) ? readdirSync(bdir).filter((n) => n.endsWith('.png')).map((n) => n.slice(0, -4)) : []);
      const cmp = await ctx.newPage();
      await cmp.goto(base + '/robots.txt');
      for (const { name, png } of results) {
        const bf = join(bdir, name + '.png');
        have.delete(name);
        if (!existsSync(bf)) { console.log(`  MISSING  ${name} (no baseline)`); failed = true; continue; }
        const r = await cmp.evaluate(diffInPage, { a: readFileSync(bf).toString('base64'), b: png.toString('base64'), tol: TOL });
        const ratio = r.total ? r.diff / r.total : 1;
        const bad = r.sizeMismatch || ratio > MAX;
        if (bad) {
          failed = true;
          mkdirSync(diffDir, { recursive: true });
          if (r.png) writeFileSync(join(diffDir, name + '.png'), Buffer.from(r.png, 'base64'));
          writeFileSync(join(diffDir, name + '.actual.png'), png);
        }
        console.log(`  ${bad ? 'FAIL' : 'ok  '}  ${name}  ${r.sizeMismatch ? `size ${r.sizeMismatch}` : `${r.diff} px differ (${(ratio * 100).toFixed(4)}%)`}`);
      }
      if (!ONLY) for (const n of have) { console.log(`  STALE    ${n} (baseline without a case)`); failed = true; }
      if (failed) console.log(`\nsnap --check FAILED. diff images: tools/snap/diff/ (red = changed pixel; *.actual.png = this run)`);
      else console.log(`\nsnap --check passed (${results.length} images)`);
    } else {
      console.log(`wrote ${results.length} PNGs to ${outDir.slice(root.length)}`);
    }
    if (blocked.size) console.log(`blocked off-machine requests: ${[...blocked].join(', ')}`);
    if (errs.length) { console.log('page errors:\n  ' + errs.join('\n  ')); failed = true; }
  } finally {
    await browser.close();
    srv.close();
  }
  process.exit(failed ? 1 : 0);
}

// Runs in a browser page: decodes two PNGs, counts pixels whose RGBA differs by more than tol,
// and returns a diff PNG (baseline dimmed to grey, changed pixels red).
async function diffInPage({ a, b, tol }) {
  const load = async (s) => createImageBitmap(await (await fetch('data:image/png;base64,' + s)).blob(), { premultiplyAlpha: 'none', colorSpaceConversion: 'none' });
  const [ia, ib] = await Promise.all([load(a), load(b)]);
  if (ia.width !== ib.width || ia.height !== ib.height) return { sizeMismatch: `${ia.width}x${ia.height} → ${ib.width}x${ib.height}`, diff: 0, total: 0 };
  const w = ia.width, h = ia.height;
  const px = (im) => { const c = new OffscreenCanvas(w, h), g = c.getContext('2d', { willReadFrequently: true }); g.drawImage(im, 0, 0); return g.getImageData(0, 0, w, h); };
  const da = px(ia).data, db = px(ib).data;
  const out = new ImageData(w, h), o = out.data;
  let diff = 0;
  for (let i = 0; i < da.length; i += 4) {
    const d = Math.max(Math.abs(da[i] - db[i]), Math.abs(da[i + 1] - db[i + 1]), Math.abs(da[i + 2] - db[i + 2]), Math.abs(da[i + 3] - db[i + 3]));
    if (d > tol) { diff++; o[i] = 255; o[i + 1] = 0; o[i + 2] = 0; o[i + 3] = 255; }
    else { const y = (da[i] + da[i + 1] + da[i + 2]) / 3 * .3 + 178; o[i] = o[i + 1] = o[i + 2] = y; o[i + 3] = 255; }
  }
  let png = null;
  if (diff) {
    const c = new OffscreenCanvas(w, h); c.getContext('2d').putImageData(out, 0, 0);
    const buf = new Uint8Array(await (await c.convertToBlob({ type: 'image/png' })).arrayBuffer());
    let s = ''; for (let i = 0; i < buf.length; i += 0x8000) s += String.fromCharCode.apply(null, buf.subarray(i, i + 0x8000));
    png = btoa(s);
  }
  return { diff, total: w * h, png };
}

main().catch((e) => { console.error(e); process.exit(1); });
