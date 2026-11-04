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
// After the template cases come three photo cases (story format, minimal template) that add
// tools/snap/fixtures/runner.jpg through the editor's own photo buttons: photo-bg-story
// (background photo: filter, 90° turn, brightness), photo-layer-story (photo layer: flip, 1:1 crop,
// filter, contrast) and photo-cut-story (MediaPipe: text behind the person + a cut-out layer with
// an outline). The run also checks that /seg/ (MediaPipe) is requested only once photo-cut-story
// starts, i.e. the model is still lazy-loaded on first use.
//
// Then 내 템플릿 (MINE: three saved v3 docs × every format: v3 canvas stickers + tier card, text effects
// + every stat style, shapes + empty photo slots + data stickers) and the 공유 카드 (오늘 기록) templates
// × every format, opened by saving a run on /log/ (LOG_CASES).
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
// Synthetic 2000×2500 photo of a runner (made with Pillow, no real person). Bigger than 1600px so addPhotoFile downscales it.
const PHOTO = join(SNAP, 'fixtures', 'runner.jpg');

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
function initScript({ now, input, mytpl }) {
  const Real = Date, t0 = performance.now();
  const cur = () => now + Math.floor(performance.now() - t0); // stays on the fixed day; timers still see time move
  class FixedDate extends Real {
    constructor(...a) { if (a.length) super(...a); else super(cur()); }
    static now() { return cur(); }
  }
  FixedDate.UTC = Real.UTC; FixedDate.parse = Real.parse;
  globalThis.Date = FixedDate;
  try { localStorage.clear(); localStorage.setItem('runtier:last', JSON.stringify(input)); if (mytpl) localStorage.setItem('runtier:mytpl', JSON.stringify(mytpl)); } catch (e) {}
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
    const newCtx = async (extra) => {
      const cx = await browser.newContext({ viewport: { width: 390, height: 844 }, deviceScaleFactor: 1, locale: 'ko-KR', timezoneId: 'Asia/Seoul', serviceWorkers: 'block' });
      await cx.route('**/*', (route) => {
        const u = new URL(route.request().url());
        if (u.origin === base || u.protocol === 'data:' || u.protocol === 'blob:') return route.continue();
        blocked.add(u.origin + u.pathname); return route.abort(); // weather, analytics, anything off this machine
      });
      await cx.addInitScript(initScript, { now: NOW, input: INPUT, ...extra });
      return cx;
    };
    const openResult = async (pg) => {
      await pg.goto(base + '/result/');
      await pg.waitForFunction(() => typeof window.__exportSig === 'function' && document.querySelectorAll('#tplList .tpl-btn[data-t]').length > 0, null, { timeout: 30000 });
      await pg.evaluate(() => document.fonts.ready);
    };
    const ctx = await newCtx({});
    const page = await ctx.newPage();
    const segReqs = []; // MediaPipe files, in request order, with the case that was running
    let curCase = '(load)';
    page.on('request', (r) => { const u = new URL(r.url()); if (u.pathname.startsWith('/seg/')) segReqs.push({ path: u.pathname, during: curCase }); });
    const errs = [];
    page.on('pageerror', (e) => errs.push(String(e)));

    const open = () => openResult(page);
    await open();
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
      curCase = name;
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

    const photoCases = PHOTO_CASES.filter((c) => !ONLY || c.name.includes(ONLY));
    if (photoCases.length) console.log(`snap: ${photoCases.length} photo cases (fixtures/runner.jpg)`);
    for (const c of photoCases) {
      curCase = c.name;
      // Reopen the page for a fresh editor: switching templates keeps the background photo and added layers.
      // The init script clears localStorage on every load, so the editor starts from a new doc.
      await open();
      await page.evaluate(() => {
        document.querySelector('#fmtSeg [data-v="story"]').click();
        document.querySelector('#tplList .tpl-btn[data-t="minimal"]').click();
      });
      if (c.seg && segReqs.length) { console.log(`  FAIL  /seg/ was requested before ${c.name}: ${segReqs.map((r) => `${r.path} (${r.during})`).join(', ')}`); failed = true; }
      await c.run(page);
      const png = Buffer.from(await page.evaluate(async () => {
        await document.fonts.ready; await window.__exportSig(); await document.fonts.ready; await window.__exportSig();
        return window.__lastStory.toDataURL('image/png').split(',')[1];
      }), 'base64');
      if (c.seg && !segReqs.some((r) => r.path === '/seg/vision_bundle.mjs')) { console.log(`  FAIL  ${c.name} did not load /seg/vision_bundle.mjs`); failed = true; }
      writeFileSync(join(outDir, c.name + '.png'), png);
      results.push({ name: c.name, png });
    }
    if (photoCases.some((c) => c.seg)) console.log(`snap: MediaPipe requests: ${[...new Set(segReqs.map((r) => `${r.path} (${r.during})`))].join(', ')}`);

    // ---- 내 템플릿 (v3 docs saved by the user): v3 canvas stickers, text effects, every stat style, the tier card, shapes ----
    // Own context: the my-template list has to be in localStorage before the editor mounts (it builds #tplList then).
    const mineCases = [];
    for (const f of fmts) MINE.forEach((m, i) => { const name = `mine-${m.key}-${f}`; if (!ONLY || name.includes(ONLY)) mineCases.push({ name, i, f, key: m.key }); });
    if (mineCases.length) {
      console.log(`snap: ${mineCases.length} my-template cases (${MINE.length} docs × ${fmts.length} formats)`);
      const mctx = await newCtx({ mytpl: MINE.map((m) => m.doc) });
      const mp = await mctx.newPage(); mp.on('pageerror', (e) => errs.push(String(e)));
      await openResult(mp);
      for (const c of mineCases) {
        curCase = c.name;
        const b64 = await mp.evaluate(async ({ i, f, key }) => {
          document.querySelector(`#fmtSeg [data-v="${f}"]`).click();
          document.querySelector(`#tplList .tpl-btn[data-m="${i}"]`).click();
          const d = window.__doc();
          if (d.mineKey !== key || (d.fmt || 'story') !== f) throw new Error(`doc is ${d.mineKey}/${d.fmt}, wanted ${key}/${f}`);
          for (let k = 0, s0 = ''; k < 60; k++) { const s1 = JSON.stringify(window.__doc()); if (s1 === s0) break; s0 = s1; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); } // let clampIn() settle
          await document.fonts.ready; await window.__exportSig(); await document.fonts.ready; await window.__exportSig();
          return window.__lastStory.toDataURL('image/png').split(',')[1];
        }, c);
        const png = Buffer.from(b64, 'base64');
        writeFileSync(join(outDir, c.name + '.png'), png); results.push({ name: c.name, png });
      }
      await mctx.close();
    }

    // ---- 공유 카드 만들기 (오늘 기록): save a run on /log/ (10 km, 50:00, a note), then every card template × format.
    // Cards are laid out on LOG_H = 1440 (3:4) and moved for 9:16 / 4:5 / 1:1 (ltPos, the hardest user of the canvas height) ----
    const logCases = [];
    for (const [lt, f] of LOG_CASES) { const name = `log-${lt}-${f}`; if (!ONLY || name.includes(ONLY)) logCases.push({ name, lt, f }); }
    if (logCases.length) {
      console.log(`snap: ${logCases.length} log-card cases`);
      const lctx = await newCtx({});
      const lp = await lctx.newPage(); lp.on('pageerror', (e) => errs.push(String(e)));
      await lp.goto(base + '/log/');
      await lp.waitForSelector('#lgForm #lgDist', { timeout: 30000 });
      await lp.fill('#lgDist', '10'); await lp.fill('#lgTime', '50:00'); await lp.fill('#lgNote', '오늘도 가볍게 한 바퀴');
      await lp.click('#lgSave');
      await lp.waitForFunction(() => typeof window.__logDoc === 'function' && window.__logDoc() && document.querySelectorAll('#tplList .tpl-btn[data-lt]').length > 0, null, { timeout: 30000 });
      const lts = await lp.$$eval('#tplList .tpl-btn[data-lt]', (bs) => bs.map((b) => b.dataset.lt));
      for (const c of logCases) {
        curCase = c.name;
        if (!lts.includes(c.lt)) throw new Error(`no log template ${c.lt} (have ${lts.join(', ')})`);
        const b64 = await lp.evaluate(async ({ lt, f }) => {
          const fb = document.querySelector(`#fmtSeg [data-v="${f}"]`); if (fb.getAttribute('aria-checked') !== 'true') fb.click();
          document.querySelector(`#tplList .tpl-btn[data-lt="${lt}"]`).click();
          const d = window.__logDoc();
          if (d.log.tpl !== lt || (d.fmt || 'story') !== f) throw new Error(`log doc is ${d.log.tpl}/${d.fmt}, wanted ${lt}/${f}`);
          for (let k = 0, s0 = ''; k < 60; k++) { const s1 = JSON.stringify(window.__doc()); if (s1 === s0) break; s0 = s1; await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r))); } // let clampIn() settle
          await document.fonts.ready; await window.__exportSig(); await document.fonts.ready; await window.__exportSig();
          return window.__lastStory.toDataURL('image/png').split(',')[1];
        }, c);
        const png = Buffer.from(b64, 'base64');
        writeFileSync(join(outDir, c.name + '.png'), png); results.push({ name: c.name, png });
      }
      await lctx.close();
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

// ---- 내 템플릿 docs (saved v3 docs, as '내 템플릿 저장' would store them). Each doc carries mineKey so the case can check it was picked.
// v3: every v3 canvas sticker (STICKERS in util.js, not in the sticker tab) + both tier card layers on the tier background.
// text: text effects (그림자·외곽선·글로우 = the render context's fx), text boxes, every stat display style, on a gradient.
// misc: shapes, empty photo slots with every mask, data/icon stickers, on the dark background.
const lay = (id, type, p) => ({ id, type, x: 540, y: 960, s: 1, r: 0, o: 1, ...p });
const V3_STK = ['wordmark', 'emblem', 'runner', 'shoe', 'dist', 'sun', 'date', 'flag', 'sparkle', 'heart', 'bolt', 'star', 'rect', 'circle', 'line'];
const MINE = [
  { key: 'v3', doc: { n: 'snap v3', tpl: 'mine', mineKey: 'v3', race: '', bg: { type: 'tier' }, layers: [
    ...V3_STK.map((k, i) => lay('S' + i, 'sticker', { k, x: 180 + (i % 4) * 240, y: 260 + Math.floor(i / 4) * 300, s: k === 'wordmark' ? .5 : .7, r: i % 3 === 1 ? -.12 : 0, col: i % 2 ? '#FFD36B' : undefined })),
    lay('C0', 'card', { y: 1520, s: .9 }),
    lay('C1', 'card', { v: 1, y: 1780, s: .9 }),
  ] } },
  { key: 'text', doc: { n: 'snap text', tpl: 'mine', mineKey: 'text', race: '한강 나이트런', bg: { type: 'grad', c1: '#1B2A4A', c2: '#7A2E3A' }, layers: [
    lay('T0', 'text', { t: '그림자 SHADOW', y: 180, size: 72, fsh: true }),
    lay('T1', 'text', { t: '외곽선 OUTLINE', y: 300, size: 72, font: 'anton', fol: { col: '#000000', w: 5 } }),
    lay('T2', 'text', { t: '글로우 GLOW', y: 420, size: 72, font: 'bebas', col: '#BFF5FF', fgl: { col: '@text', r: 40 } }),
    lay('T3', 'text', { t: '반투명 상자\nsecond line', y: 580, size: 56, box: 'semi', al: 'left', fsh: [4, 6, 10, 'rgba(0,0,0,.6)'] }),
    lay('T4', 'text', { t: 'FULL BOX', y: 730, size: 60, font: 'playfair', box: 'full', col: '#F4F2EC' }),
    lay('T5', 'text', { t: '색 상자 mono', y: 840, size: 52, font: 'mono', box: 'full', bcol: '#2F6F5E', bo: .8, fol: { col: '#102030', w: 2 } }),
    lay('T6', 'text', { t: '검은고딕 한 줄', y: 950, size: 64, font: 'blackhan', col: '@tier', fgl: { col: '#FF6A3D', r: 25 } }),
    lay('A0', 'stat', { stat: 'rec', x: 300, y: 1110, s: .8, fsh: true }),
    lay('A1', 'stat', { stat: 'pace', v: 1, x: 780, y: 1110, s: .8, fol: { col: '#000000', w: 3 } }),
    lay('A2', 'stat', { stat: 'top', v: 2, x: 300, y: 1290, s: .8 }),
    lay('A3', 'stat', { stat: 'tier', v: 3, x: 760, y: 1290, s: .7, fgl: { col: '@text', r: 30 } }),
    lay('A4', 'stat', { stat: 'vdot', v: 4, x: 300, y: 1430, s: 1 }),
    lay('A5', 'stat', { stat: 'race', x: 760, y: 1440, s: .7, box: 'semi' }),
    lay('A6', 'stat', { stat: 'date', x: 540, y: 1560, s: 1, col: '@tierL' }),
    lay('A7', 'stat', { stat: 'next', x: 540, y: 1660, s: 1, look: 'run' }),
    lay('A8', 'stat', { stat: 'event', v: 3, x: 540, y: 1790, s: .8, col: '@m1' }),
  ] } },
  { key: 'misc', doc: { n: 'snap misc', tpl: 'mine', mineKey: 'misc', race: '', bg: { type: 'dark' }, layers: [
    lay('P0', 'shape', { k: 'paper', w: 900, h: 420, y: 300, col: '#F4F2EC' }),
    lay('P1', 'shape', { k: 'circle', w: 220, h: 220, x: 220, y: 680, col: '#E08A62' }),
    lay('P2', 'shape', { k: 'dash', w: 600, h: 8, y: 840, col: '#B5C96A' }),
    lay('P3', 'shape', { k: 'rect', w: 260, h: 160, x: 820, y: 680, rad: 32, col: '#7FA8C9', o: .8 }),
    lay('F0', 'photo', { pid: null, mask: 'polaroid', x: 270, y: 1100, s: .5 }),
    lay('F1', 'photo', { pid: null, mask: 'circle', x: 810, y: 1060, s: .5 }),
    lay('F2', 'photo', { pid: null, mask: 'round', x: 810, y: 1380, s: .45, r: .08 }),
    lay('D0', 'sticker', { k: 'data_course', x: 240, y: 1520, s: .5 }),
    lay('D1', 'sticker', { k: 'data_bib', x: 560, y: 1640, s: .45, f: { num: '777', race: 'SNAP 10K' } }),
    lay('D2', 'sticker', { k: 'data_weather', x: 860, y: 1700, s: .4, f: { icon: 'cloud', temp: '18°C', label: '흐림' } }),
    lay('I0', 'sticker', { k: 'ph:timer', x: 160, y: 1800, s: .25, col: '#B5C96A' }),
    lay('X0', 'text', { t: '사진 없는 칸 · 도형 · 데이터 스티커', y: 300, size: 44, col: '#17181B' }),
  ] } },
];
// 공유 카드 templates × every format (3:4 is their own; the others move the lower half off LOG_H = 1440)
const LOG_TPL_IDS = ['run-photo', 'run-solid', 'race-dday', 'race-result', 'diet', 'va-run-photo', 'va-run-solid', 'va-race-result', 'vc-run-photo', 'vc-run-solid', 'vc-race-result', 'vc-diet', 'vd-run-solid'];
const LOG_CASES = ['thumb', 'story', 'feed', 'square'].flatMap((f) => LOG_TPL_IDS.map((t) => [t, f]));

// ---- photo cases: driven through the editor's buttons, like a person would ----
// Opens the photo tool and picks the fixture for the background (phBg) or as a new photo layer (phAdd).
async function addPhoto(page, btn) {
  const before = await page.evaluate(() => window.__photos());
  await page.evaluate((btn) => {
    const t = document.querySelector('#tools [data-tool="photo"]');
    if (t.getAttribute('aria-pressed') !== 'true') t.click();
    document.getElementById(btn).click(); // sets photoTarget, then clicks #photo (no file chooser in headless)
  }, btn);
  await page.setInputFiles('#photo', PHOTO);
  await page.waitForFunction((n) => window.__photos() > n, before, { timeout: 30000 });
  await page.waitForTimeout(50); // let changed()/paintPanel() after the await in the change handler run
}
const click = (page, sel) => page.evaluate((sel) => { const e = document.querySelector(sel); if (!e) throw new Error('no ' + sel); e.click(); }, sel);
const slide = (page, id, v) => page.evaluate(({ id, v }) => { const e = document.getElementById(id); if (!e) throw new Error('no #' + id); e.value = String(v); e.dispatchEvent(new Event('input', { bubbles: true })); }, { id, v });
const openAdj = (page) => page.evaluate(() => { const b = document.getElementById('peMore'); if (b && b.getAttribute('aria-expanded') !== 'true') b.click(); });
const until = (page, fn, arg) => page.waitForFunction(fn, arg, { timeout: 90000 });

const PHOTO_CASES = [
  { name: 'photo-bg-story', run: async (page) => {
    await addPhoto(page, 'phBg');
    await until(page, () => window.__doc().bg.type === 'photo');
    await click(page, '#peFilter [data-v="warm"]');
    await click(page, '#peRot');
    await openAdj(page); await slide(page, 'pa_br', 30);
    await until(page, () => { const b = window.__doc().bg; return b.filter === 'warm' && b.rot === 1 && b.adj && b.adj.br === 30; });
  } },
  { name: 'photo-layer-story', run: async (page) => {
    await addPhoto(page, 'phAdd');
    await until(page, () => window.__doc().layers.some((l) => l.type === 'photo' && l.pid));
    await click(page, '#peFlip');
    await click(page, '#peCrop'); await click(page, '#crRatio [data-v="1:1"]'); await click(page, '#crApply');
    await click(page, '#peFilter [data-v="bw"]');
    await openAdj(page); await slide(page, 'pa_ct', 40);
    await until(page, () => { const L = window.__doc().layers.find((l) => l.type === 'photo'); return L && L.flip && L.crop && L.filter === 'bw' && L.adj && L.adj.ct === 40; });
  } },
  { name: 'photo-cut-story', seg: true, run: async (page) => {
    await addPhoto(page, 'phBg');
    await until(page, () => window.__doc().bg.type === 'photo');
    await click(page, '#peFilter [data-v="golden"]');
    await click(page, '#tools [data-tool="text"]');
    await until(page, () => window.__doc().layers.some((l) => l.type === 'text' && l.t === '텍스트'));
    await click(page, '#miniBar [data-mb="behind"]'); // 인물 뒤로: first use loads MediaPipe
    await until(page, () => window.__doc().layers.some((l) => l.behind) && window.__mask() >= 1);
    await addPhoto(page, 'phAdd');
    await until(page, () => window.__doc().layers.some((l) => l.type === 'photo' && l.pid));
    await click(page, '#peCut'); // 인물만 남기기
    await until(page, () => window.__doc().layers.some((l) => l.type === 'photo' && l.cut) && window.__mask() >= 2);
    await click(page, '#peOl');
    await slide(page, 'olW', 20);
    await until(page, () => { const L = window.__doc().layers.find((l) => l.type === 'photo'); return L && L.ol && L.ol.on && L.ol.w === 20; });
  } },
];

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
