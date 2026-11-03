// Build the v5 share templates (TPL_NAMES / TPL_SPEC in src/editor/assets.js).
// Design source: Figma "인스타 디자인" → page "Share v5 — redesign" (T01–T06).
// Usage: node tools/build_templates.mjs
//
// Element kinds (read by templateDoc in src/editor/editor.js):
//   img  — photo; w/h 'full' = background photo slot, otherwise a photo frame
//   box  — fill (colour | {t:'lin'|'rad'}), rad, bs [w, colour], poly (n-gon), pat ('zig'|'bar'|'dash'), sh shadow
//   text — tx with result tokens {rec} {pace} {pct} {tier} {roman} {tierko} {vdot} {date} {mmdd} {ev} {race}
//          nr: 1 keeps the text out of the shared stat-row layout (normLayout)
// Colours '@m0' '@m1' '@m2' (+ '/alpha') are the result's tier metal (light → dark); '@tier' is the tier accent.
import { readFileSync, writeFileSync } from 'node:fs';

const ASSETS = new URL('../src/editor/assets.js', import.meta.url);
const H_OF = { story: 1920, feed: 1350, square: 1080 };
const PAPER = 'rgba(236,235,230,1)', INK = '#17181B', CREAM = '#F4F2EC', RACE = '#E08A62';
const pa = a => `rgba(236,235,230,${a})`, ink = a => `rgba(23,24,27,${a})`;
const SH = [0, 2, 14, 'rgba(0,0,0,.35)'];
const METAL = { t: 'lin', a: 135, st: [[0, '@m0'], [0.55, '@m1'], [1, '@m2']] };

let n = 0;
const id = p => `${p}${n++}`;
const T = (tx, o) => ({ k: 'text', id: o.id || id('t'), x: o.x ?? 0, ...(o.y != null ? { y: o.y } : { yb: o.yb }), tx, f: o.f || 'pretendard', sz: o.sz, wt: o.wt || 700, ls: o.ls || 0,
  col: o.col || PAPER, al: o.al || (o.right != null ? 'right' : 'left'), sh: o.sh ?? null, lh: o.lh ?? null, r: 0,
  ...(o.right != null ? { right: o.right, x: 1080 - o.right } : {}), ...(o.c ? { w: 'full', al: 'center', x: 0 } : {}), ...(o.nr ? { nr: 1 } : {}) });
const B = (x, yo, w, h, fill, o = {}) => ({ k: 'box', id: o.id || id('b'), x, ...yo, w, h, fill, r: 0,
  ...(o.rad ? { rad: o.rad } : {}), ...(o.bs ? { bs: o.bs } : {}), ...(o.poly ? { poly: o.poly } : {}), ...(o.pat ? { pat: o.pat } : {}), ...(o.sh ? { sh: o.sh } : {}) });
const PHOTO = (pos = [0.5, 0.5], adj) => ({ k: 'img', id: 'photo', x: 0, y: 0, w: 'full', h: 'full', pos, ...(adj ? { adj } : {}), r: 0 });
const FULL = (fill, i = 'scrim') => ({ k: 'box', id: i, x: 0, y: 0, w: 'full', h: 'full', fill, r: 0 });
const lin = st => ({ t: 'lin', a: 180, st });
const dim = c => lin([[0, c], [1, c]]); // full-frame tint as a layer (a plain-colour full box would become the solid background)

// scale a centred composition (designed at 1080×1920) into a shorter format
function fitTo(els, H) { const s = H / 1920; if (s === 1) return els;
  const sx = v => Math.round(540 + (v - 540) * s), sv = v => Math.round(v * s);
  return els.map(e => { if (e.w === 'full' && e.h === 'full') return e; const o = { ...e };
    if (o.k === 'text') { o.sz = Math.max(16, sv(o.sz)); o.ls = +(o.ls * s).toFixed(1); if (o.w === 'full') { /* centred */ } else if (o.right != null) { o.right = 1080 - sx(1080 - o.right); o.x = 1080 - o.right; } else o.x = sx(o.x); }
    else { o.x = sx(o.x); o.w = sv(o.w); o.h = sv(o.h); if (o.rad) o.rad = sv(o.rad); if (o.sh) o.sh = [o.sh[0], sv(o.sh[1]), sv(o.sh[2]), o.sh[3]]; }
    if (o.y != null) o.y = sv(o.y); if (o.yb != null) o.yb = sv(o.yb); return o; }); }

// ---------- 01 Finish: photo + editorial bottom stack ----------
function finish(H, fmt) { const k = { story: 1, feed: .87, square: .74 }[fmt];
  const big = Math.round(300 * k), vb = 96, lb = vb + 64 + 18, rule = lb + 26 + 36, bigB = rule + 40, labB = bigB + big + 14;
  return [PHOTO([0.5, 0.45], { sa: -8, ct: 4 }),
    FULL(lin([[0, 'rgba(11,12,14,.3)'], [0.14, 'rgba(11,12,14,0)'], [0.42, 'rgba(11,12,14,0)'], [0.72, 'rgba(11,12,14,.55)'], [1, 'rgba(11,12,14,.92)']])),
    T('hoohaa', { id: 'mark', f: 'mono', sz: 26, ls: 1, x: 72, y: 80, nr: 1, sh: SH }),
    T('{ev}  ·  {date}', { id: 'meta', f: 'mono', sz: 26, ls: 2, right: 72, y: 80, col: pa(.8), nr: 1, sh: SH }),
    T('FINISH TIME', { id: 'big_lbl', f: 'mono', sz: 26, ls: 4, x: 72, yb: labB, col: pa(.7) }),
    T('{rec}', { id: 'big', f: 'inter', sz: big, wt: 800, ls: -Math.round(12 * k), x: 64, yb: bigB, lh: 1 }),
    B(72, { yb: rule }, 936, 2, pa(.25), { id: 'rule' }),
    T('PACE', { id: 'pace_lbl', f: 'mono', sz: 24, ls: 2, x: 72, yb: lb, col: pa(.6) }),
    T('TOP', { id: 'top_lbl', f: 'mono', sz: 24, ls: 2, x: 420, yb: lb, col: pa(.6) }),
    T('TIER', { id: 'tier_lbl', f: 'mono', sz: 24, ls: 2, x: 760, yb: lb, col: pa(.6) }),
    T('{pace}', { id: 'pace', f: 'inter', sz: 64, wt: 700, ls: -2, x: 72, yb: vb }),
    T('{pct}%', { id: 'top', f: 'inter', sz: 64, wt: 700, ls: -2, x: 420, yb: vb }),
    T('{tier}', { id: 'tier', f: 'inter', sz: 64, wt: 700, ls: -1, x: 760, yb: vb, col: '@tier' })]; }

// ---------- 02 Tier Pass: tier certification card ----------
function pass(H) { const C = 88, CW = 904, CY = 260, L = C + 64, R = 1080 - C - 64;
  const els = [FULL('#0F1012', 'bg'),
    B(-10, { y: 260 }, 1100, 1100, { t: 'rad', sh: 'circle', cx: 0.5, cy: 0.5, st: [[0, '@m1/.34'], [0.7, '@m1/0']] }, { id: 'glow' }),
    T('hoohaa', { id: 'mark', f: 'mono', sz: 26, ls: 1, x: 72, y: 84, nr: 1 }),
    T('RUNNING TIER CERTIFICATE', { id: 'head', f: 'mono', sz: 22, ls: 3, right: 72, y: 90, col: pa(.6), nr: 1 }),
    B(C, { y: CY }, CW, 1400, '#18191C', { id: 'card', rad: 44, bs: [2, METAL], sh: [0, 40, 120, 'rgba(0,0,0,.5)'] }),
    B(C, { y: CY }, CW, 600, lin([[0, '@m1/.16'], [1, '@m1/0']]), { id: 'sheen', rad: 44 }),
    T('TIER', { id: 'c_lbl', f: 'mono', sz: 24, ls: 4, x: L, y: CY + 64, col: pa(.55), nr: 1 }),
    T('{ev}', { id: 'c_ev', f: 'mono', sz: 24, ls: 2, right: 1080 - R, y: CY + 64, col: '@tier', nr: 1 }),
    B(390, { y: CY + 170 }, 300, 300, METAL, { id: 'emblem', poly: 6 }),
    B(422, { y: CY + 202 }, 236, 236, 'rgba(0,0,0,0)', { id: 'emblem_in', poly: 6, bs: [3, 'rgba(40,32,14,.4)'] }),
    T('{roman}', { id: 'roman', f: 'anton', sz: 120, wt: 400, c: 1, y: CY + 248, col: 'rgba(40,32,14,.75)' }),
    T('{tier}', { id: 'tier', f: 'anton', sz: 168, wt: 400, ls: 4, c: 1, y: CY + 500, col: '@tier' }),
    T('{tierko}  ·  {ev} 기준', { id: 'tier_ko', sz: 32, wt: 600, c: 1, y: CY + 730, col: pa(.65) }),
    B(L, { y: CY + 830 }, R - L, 2, pa(.14), { id: 'rule1' }),
    T('기록', { id: 'rec_lbl', sz: 26, wt: 600, x: L, y: CY + 880, col: pa(.55), nr: 1 }),
    T('페이스', { id: 'pace_lbl', sz: 26, wt: 600, x: L + 258, y: CY + 880, col: pa(.55), nr: 1 }),
    T('VDOT', { id: 'vdot_lbl', f: 'mono', sz: 24, ls: 2, x: L + 516, y: CY + 882, col: pa(.55), nr: 1 }),
    T('{rec}', { id: 'rec', f: 'inter', sz: 60, wt: 700, ls: -2, x: L, y: CY + 924, nr: 1 }),
    T('{pace}', { id: 'pace', f: 'inter', sz: 60, wt: 700, ls: -2, x: L + 258, y: CY + 924, nr: 1 }),
    T('{vdot}', { id: 'vdot', f: 'inter', sz: 60, wt: 700, ls: -2, x: L + 516, y: CY + 924, nr: 1 }),
    B(L, { y: CY + 1090 }, R - L, 2, pa(.14), { id: 'rule2' }),
    B(L, { y: CY + 1220 }, 360, 96, pa(.8), { id: 'barcode', pat: 'bar' }),
    T('No. {mmdd}-{vdot}', { id: 'serial', f: 'mono', sz: 22, ls: 2, right: 1080 - R, y: CY + 1232, col: pa(.6), nr: 1 }),
    T('hoohaa.run', { id: 'url', f: 'mono', sz: 22, ls: 2, right: 1080 - R, y: CY + 1286, col: '@tier', nr: 1 }),
    T('같은 성별·나이대 러너 중', { id: 'foot', sz: 30, wt: 600, c: 1, y: 1698, col: pa(.6) }),
    T('상위 {pct}%', { id: 'top', sz: 64, wt: 700, c: 1, y: 1744, nr: 1 })];
  const out = fitTo(els, H), s = H / 1920; // 상위 % stays ≥64px, so it keeps its own room under the card
  if (s < 1) { const t = out.find(e => e.id === 'top'), f = out.find(e => e.id === 'foot'); t.sz = 64; t.y = Math.min(Math.round(1744 * s), H - 92); f.y = t.y - Math.round(f.sz * 1.5); }
  return out; }

// ---------- 03 Bib: race bib card on the photo ----------
function bib(H) { const X = 100, W = 880, Y = 690, L = X + 56, R = 1080 - X - 56;
  const els = [PHOTO([0.5, 0.5]), FULL(dim('rgba(0,0,0,.28)'), 'dim'),
    T('hoohaa', { id: 'mark', f: 'mono', sz: 26, ls: 1, x: 72, y: 84, nr: 1, sh: SH }),
    B(X, { y: Y }, W, 660, CREAM, { id: 'bib', rad: 18, sh: [0, 24, 60, 'rgba(0,0,0,.35)'] }),
    B(X, { y: Y }, W, 120, RACE, { id: 'band', rad: 18 }), B(X, { y: Y + 70 }, W, 50, RACE, { id: 'band2' }),
    T('HOOHAA RUN  {race}', { id: 'race', f: 'archivo', sz: 40, wt: 900, ls: 1, x: L, y: Y + 38, col: CREAM, nr: 1 }),
    T('{date}', { id: 'date', f: 'mono', sz: 28, right: 1080 - R, y: Y + 44, col: CREAM, nr: 1 }),
    ...[[X + 22, Y + 150], [X + W - 46, Y + 150], [X + 22, Y + 606], [X + W - 46, Y + 606]].map(([x, y], i) => B(x, { y }, 24, 24, '#D9D5CA', { id: 'pin' + i, rad: 12 })),
    T('{rec}', { id: 'big', f: 'anton', sz: 290, wt: 400, c: 1, y: Y + 140, col: INK, lh: 1.1 }),
    B(L, { y: Y + 512 }, R - L, 2, ink(.12), { id: 'rule' }),
    T('{tier}', { id: 'tier', f: 'mono', sz: 30, ls: 3, x: L, y: Y + 568, col: '@m2', nr: 1 }),
    T('상위 {pct}%', { id: 'top', sz: 64, wt: 700, right: 1080 - R, y: Y + 546, col: INK, nr: 1 }),
    T('{ev}  ·  {pace}/km', { id: 'cap', f: 'mono', sz: 30, ls: 2, c: 1, y: 1660, col: pa(.85), sh: SH, nr: 1 })];
  return fitTo(els, H); }

// ---------- 04 Receipt ----------
function receipt(H) { const PW = 780, PH = 1240, PX = 150, PY = Math.round((1920 - PH) / 2), L = PX + 64, R = 1080 - PX - 64;
  const els = [PHOTO([0.5, 0.5], { sa: -30 }), FULL(dim('rgba(16,17,19,.62)'), 'dim'),
    B(PX, { y: PY }, PW, PH, CREAM, { id: 'paper', pat: 'zig', sh: [0, 30, 80, 'rgba(0,0,0,.45)'] })];
  let y = PY + 90; const M = 'mono';
  els.push(T('HOOHAA', { id: 'head', f: M, sz: 56, ls: 10, c: 1, y, col: INK, nr: 1 })); y += 84;
  els.push(T('RUN RECEIPT  ·  NO.{mmdd}', { id: 'no', f: M, sz: 24, ls: 2, c: 1, y, col: ink(.6), nr: 1 })); y += 44;
  els.push(T('{date}', { id: 'date', f: M, sz: 24, ls: 2, c: 1, y, col: ink(.6), nr: 1 })); y += 70;
  const dash = () => { els.push(B(L, { y }, R - L, 2, ink(.45), { pat: 'dash' })); y += 40; };
  const row = (a, b, o = {}) => { const sz = o.sz || 30; els.push(T(a, { f: M, sz, x: L, y, col: ink(o.la ?? .85), nr: 1 }), T(b, { id: o.id, f: M, sz, right: 1080 - R, y, col: o.col || INK, nr: 1 })); y += Math.round(sz * 1.75); };
  dash(); row('EVENT', '{ev}'); row('TIME', '{rec}', { id: 'rec' }); row('AVG PACE', '{pace}/KM', { id: 'pace' }); row('VDOT', '{vdot}', { id: 'vdot' }); y += 10;
  dash(); row('TIER', '{tier}', { sz: 40, col: '@m2', id: 'tier' }); row('TOP', '{pct}%', { sz: 64, la: 1, id: 'top' }); y += 10;
  dash(); y += 6; row('TOTAL', '{rec}', { sz: 72, la: 1, id: 'total' }); y += 10;
  els.push(B(L, { y }, R - L, 110, INK, { id: 'barcode', pat: 'bar' })); y += 140;
  els.push(T('THANK YOU FOR RUNNING', { id: 'thx', f: M, sz: 26, ls: 4, c: 1, y, col: INK, nr: 1 })); y += 46;
  els.push(T('hoohaa.run', { id: 'url', f: M, sz: 24, ls: 2, c: 1, y, col: ink(.55), nr: 1 }));
  return fitTo(els, H); }

// ---------- 05 Film: light frame, photo on top, record below ----------
function film(H, fmt) { const k = { story: 1, feed: .86, square: .74 }[fmt], ph = H - Math.round(620 * k);
  return [FULL('#F2F0EA', 'bg'),
    { k: 'img', id: 'photo', x: 64, y: 64, w: 952, h: ph - 64, pos: [0.5, 0.5], r: 0 },
    T('HOOHAA 400', { id: 'film', f: 'mono', sz: 22, ls: 3, x: 64, y: ph + 26, col: RACE, nr: 1 }),
    T('{date}', { id: 'date', f: 'mono', sz: 22, ls: 2, right: 64, y: ph + 26, col: RACE, nr: 1 }),
    T('{rec}', { id: 'big', f: 'inter', sz: Math.round(200 * k), wt: 800, ls: -Math.round(8 * k), x: 56, yb: Math.round(250 * k), col: INK, lh: 1 }),
    T('{ev}  ·  {pace}/km', { id: 'ev', f: 'mono', sz: Math.round(28 * k), ls: 1, right: 64, yb: Math.round(410 * k), col: ink(.75), nr: 1 }),
    T('상위 {pct}%', { id: 'top', sz: 64, wt: 700, right: 64, yb: Math.round(320 * k), col: INK, nr: 1 }),
    T('{tier}', { id: 'tier', f: 'mono', sz: Math.round(30 * k), ls: 3, right: 64, yb: Math.round(266 * k), col: '@m2', nr: 1 }),
    B(64, { yb: Math.round(178 * k) }, 952, 2, ink(.15), { id: 'rule' }),
    T('hoohaa', { id: 'mark', f: 'mono', sz: 24, ls: 1, x: 64, yb: Math.round(116 * k), col: ink(.7), nr: 1 }),
    T('RUN DIARY', { id: 'diary', f: 'mono', sz: 24, ls: 3, right: 64, yb: Math.round(116 * k), col: ink(.5), nr: 1 })]; }

// ---------- 06 Minimal: the photo is the hero, one quiet line ----------
function minimal(H, fmt) { const k = { story: 1, feed: .88, square: .76 }[fmt];
  return [PHOTO([0.5, 0.5]),
    FULL(lin([[0, 'rgba(0,0,0,.35)'], [0.18, 'rgba(0,0,0,0)'], [0.55, 'rgba(0,0,0,0)'], [1, 'rgba(0,0,0,.7)']])),
    T('hoohaa', { id: 'mark', f: 'mono', sz: 28, ls: 1, c: 1, y: 90, col: pa(.9), nr: 1, sh: SH }),
    T('{rec}', { id: 'big', f: 'inter', sz: Math.round(190 * k), wt: 700, ls: -Math.round(6 * k), c: 1, yb: Math.round(330 * k), lh: 1, sh: SH }),
    T('상위 {pct}%', { id: 'top', sz: 64, wt: 700, c: 1, yb: Math.round(236 * k), col: pa(.95), nr: 1, sh: SH }),
    T('{ev}   ·   {tier}', { id: 'line', f: 'mono', sz: 26, ls: 3, c: 1, yb: Math.round(176 * k), col: pa(.8), nr: 1, sh: SH }),
    B(516, { yb: Math.round(140 * k) }, 48, 3, METAL, { id: 'tick' })]; }

const TPLS = { finish: ['피니시', finish], pass: ['티어 패스', pass], bib: ['배번', bib], receipt: ['러닝 영수증', receipt], film: ['필름', film], minimal: ['미니멀', minimal] };
const names = {}, spec = {};
for (const [k, [nm, fn]] of Object.entries(TPLS)) { names[k] = nm; spec[k] = {}; for (const [fmt, H] of Object.entries(H_OF)) { n = 0; spec[k][fmt] = fn(H, fmt); } }

const src = readFileSync(ASSETS, 'utf8').split('\n');
for (let i = 0; i < src.length; i++) {
  if (src[i].startsWith('// generated by build_v4_templates.py from the designer handoff')) src[i] = '// generated by tools/build_templates.mjs — v5 share templates (Figma "Share v5 — redesign")';
  else if (src[i].startsWith('export const TPL_NAMES')) src[i] = 'export const TPL_NAMES = ' + JSON.stringify(names) + ';';
  else if (src[i].startsWith('export const TPL_SPEC')) src[i] = 'export const TPL_SPEC = ' + JSON.stringify(spec) + ';';
}
writeFileSync(ASSETS, src.join('\n'));
console.log(Object.keys(spec).length, 'templates ×', Object.keys(H_OF).length, 'formats');
