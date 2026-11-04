// Canvas rendering for the share-image editor: tier card, text, layer geometry, v4/v5 template text and boxes, backgrounds,
// renderDoc (preview, thumbnails, renderMini and the saved PNG all use it) and the templates (templateDoc, normLayout, mk).
// Moved out of editor.js. The closure state it used is now a render context (see createRenderCtx); the rest is unchanged.
// chipImg and LOGO_C/LOGO_TINT are module-level caches and lseq the layer-id counter; mountEditor runs once per page, so this
// behaves like the closure did.
import { TPL_NAMES, TPL_SPEC } from './assets.js';
import { TOKENS, iconSVG, LOG_H } from './logtpl.js';
import { W, H, PRE, needFull, alpha, rr, font, FONTS, W_, ARC_, PRE_, STATS, statLabel, statValue, STAT_SIZE, TOP_MIN_PX, fmtH, famOf, wOf, HAN, contrast } from './util.js';
import { TK, STORY_MAT, TOPO_D, runChipSVG, CARD_INK, EMB, tierTint, accentOf, metalTok } from './tokens.js';
import { filtered, hasPE, photoSrc, imContent, bgRect, subjectLayer } from './photo.js';
import { stkLoad, imgOf, dataArt, dataFields, sticker } from './stickers.js';

// ---- render context ----
// createRenderCtx() is made once per editor: the lazy-font base path (was the closure let FONT_BASE + setFontBase) and its font caches.
// renderDoc(ctx, ...) copies it after every await and adds what one render needs: rc.H = canvas height of doc.fmt (was the
// module-wide H_) and rc.fx = text effects of the layer being drawn (was FX). Each render has its own rc, so preview, thumbnails
// and renderMini can overlap without sharing state; drawing functions that need them take rc first.
export function createRenderCtx({ fontBase = '/fonts/lazy/' } = {}) {
  const loaded = new Map();
  const FONT_BASE = fontBase;
  function loadFont(k) { // full font, only when picked
    const f = FONTS[k]; if (!f || f.emb) return Promise.resolve(true);
    if (!loaded.has(k)) loaded.set(k, Promise.all(f.files.map(([file, w]) => { const ff = new FontFace(`LZ ${k}`, `url("${FONT_BASE}${file}")`, { weight: w, display: 'block' }); return ff.load().then(x => (document.fonts.add(x), true)); })).then(() => true).catch(() => { loaded.delete(k); return false; }));
    return loaded.get(k);
  }
  const pv = new Map();
  function loadPreviewFont(k) { // tiny subset (font name + digits/latin + tier words) for the picker buttons
    const f = FONTS[k]; if (!f || f.emb) return Promise.resolve(true);
    if (!pv.has(k)) { const ff = new FontFace(`PV ${k}`, `url("${FONT_BASE}p-${k}.woff2")`, { weight: f.pw || '400' }); pv.set(k, ff.load().then(x => (document.fonts.add(x), true)).catch(() => false)); }
    return pv.get(k);
  }
  const isFontReady = k => !FONTS[k] || FONTS[k].emb || loaded.has(k);
  return { fontBase, loadFont, loadPreviewFont, isFontReady };
}

export const chipImg = new Map();
export function chipLoad(k) { if (chipImg.has(k)) { const v = chipImg.get(k); return v instanceof Promise ? v : Promise.resolve(v); }
  const p = new Promise(res => { const im = new Image(); im.onload = () => { chipImg.set(k, im); res(im); }; im.onerror = () => { chipImg.set(k, null); res(null); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(runChipSVG(k).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160" ')); }); chipImg.set(k, p); return p; }
export const cardFontsReady = () => document.fonts ? Promise.all(['600 40px "CC Kode"', '400 40px "CC Kode"'].map(f => document.fonts.load(f).catch(() => 0))) : Promise.resolve();
export function drawCard(c, d, x, y, w, h) {
  const t = TK.tier[d.key], cd = t.card, m = STORY_MAT[d.key], r = w * 0.05, u = w / 340, ink = cd.ink;
  c.save(); // shadow + glow
  c.shadowColor = cd.glow || 'rgba(0,0,0,.55)'; c.shadowBlur = cd.glow ? 40 * u * 1.6 : 28 * u; c.shadowOffsetY = cd.glow ? 0 : 12 * u;
  rr(c, x, y, w, h, r); c.fillStyle = cd.stops[1]; c.fill(); c.restore();
  c.save(); rr(c, x, y, w, h, r); c.clip();
  const ang = 118 * Math.PI / 180, dx = Math.sin(ang), dy = -Math.cos(ang), L = Math.abs(w * dx) + Math.abs(h * dy), cx = x + w / 2, cy = y + h / 2;
  const lg = (stops) => { const g = c.createLinearGradient(cx - dx * L / 2, cy - dy * L / 2, cx + dx * L / 2, cy + dy * L / 2); stops.forEach(([o, s]) => g.addColorStop(o, s)); return g; };
  c.fillStyle = lg([[0, cd.stops[0]], [.55, cd.stops[1]], [1, cd.stops[2]]]); c.fillRect(x, y, w, h);
  if (cd.band === 'plain') { c.fillStyle = 'rgba(255,255,255,.035)'; for (let yy = y; yy < y + h; yy += 3 * u) c.fillRect(x, yy, w, u); }
  if (cd.band === 'mid' && false) { c.strokeStyle = 'rgba(255,255,255,.10)'; c.lineWidth = u; const s = 13 * u, hh = s * Math.sqrt(3);
    for (let gx = x - s; gx < x + w + s * 3; gx += s * 3) for (let gy = y - hh; gy < y + h + hh; gy += hh) for (const [ox, oy] of [[0, 0], [s * 1.5, hh / 2]]) {
      c.beginPath(); for (let i = 0; i < 6; i++) { const a = (60 * i + 30) * Math.PI / 180; c.lineTo(gx + ox + s * .55 * Math.cos(a), gy + oy + s * .55 * Math.sin(a)); } c.closePath(); c.stroke(); } }
  if (cd.band === 'top') { c.strokeStyle = alpha(cd.topo_tint, .42); c.lineWidth = .7 * u; const k2 = Math.max(w / 340, h / 214);
    c.save(); c.translate(x + w / 2 - 170 * k2, y + h / 2 - 107 * k2); c.scale(k2, k2); c.lineWidth = .7 * u / k2; c.stroke(new Path2D(TOPO_D)); c.restore();
    c.fillStyle = lg([[.32, 'rgba(159,240,224,0)'], [.42, 'rgba(159,240,224,.18)'], [.5, 'rgba(179,156,250,.22)'], [.58, 'rgba(243,163,196,.18)'], [.68, 'rgba(243,163,196,0)']]); c.fillRect(x, y, w, h); }
  if (cd.band !== 'plain') { c.fillStyle = lg([[.3, 'rgba(255,255,255,0)'], [.48, 'rgba(255,255,255,.16)'], [.62, 'rgba(255,255,255,0)']]); c.fillRect(x, y, w, h); }
  c.restore();
  c.save(); const bw = Math.max(1, u); rr(c, x + bw / 2, y + bw / 2, w - bw, h - bw, r); c.lineWidth = bw;
  c.strokeStyle = { plain: 'rgba(255,255,255,.16)', mid: 'rgba(255,255,255,.37)', top: 'rgba(255,255,255,.47)' }[cd.band]; c.stroke();
  if (cd.outline) { const col = cd.outline.match(/#[0-9A-Fa-f]{6}/)[0]; rr(c, x + 4 * u, y + 4 * u, w - 8 * u, h - 8 * u, r - 4 * u); c.strokeStyle = alpha(col, .44); c.stroke(); }
  c.restore();
  // text (Kode Mono on Latin + numerals, Korean keeps Pretendard), embossed
  const pad = w * .06, IN = '"CC Kode","Inter",' + PRE, ink2 = CARD_INK[d.key] || ink, [eh, el, el2] = EMB(d.key);
  const emb = (t, tx, ty) => { const f = c.fillStyle; c.fillStyle = el2; c.fillText(t, tx + 2 * u / 1.94, ty + 2 * u / 1.94); c.fillStyle = el; c.fillText(t, tx + u / 1.94, ty + u / 1.94); c.fillStyle = eh; c.fillText(t, tx - u / 1.94, ty - u / 1.94); c.fillStyle = f; c.fillText(t, tx, ty); };
  c.save(); c.textBaseline = 'alphabetic'; c.fillStyle = ink2;
  font(c, 11 * u, 700, IN); c.letterSpacing = 3 * u + 'px'; emb('HOOHAA', x + pad, y + pad + 9 * u);
  font(c, 8.5 * u, 600, IN); c.letterSpacing = 2 * u + 'px'; c.textAlign = 'right'; emb('RUNNING TIER', x + w - pad + 2 * u, y + pad + 9 * u);
  c.save(); font(c, 40 * u, 300, '"Inter",' + PRE); c.letterSpacing = 3 * u + 'px'; c.fillStyle = 'rgba(255,255,255,.14)'; c.fillText('hoohaa', x + w - pad, y + h * .40 + u);
  c.fillStyle = 'rgba(0,0,0,.07)'; c.fillText('hoohaa', x + w - pad, y + h * .40); c.restore(); c.textAlign = 'left';
  // running-data chip (same SVG as the DOM card): left 10.5%, centre 43%, recessed
  { const chW = w * .1, chH = chW / 1.25, chX = x + w * .105, chY = y + h * .43 - chH / 2, im = chipImg.get(d.key);
    c.save(); rr(c, chX - u * .6, chY - u * .6, chW + u * 1.2, chH + u * 1.2, chW * .18); c.fillStyle = 'rgba(0,0,0,.22)'; c.fill(); c.restore();
    if (im && !(im instanceof Promise)) c.drawImage(im, chX, chY, chW, chH); else { rr(c, chX, chY, chW, chH, chW * .18); c.fillStyle = alpha(ink, .25); c.fill(); } }
  // name + division gauge (III = 1 segment, II = 2, I = 3)
  c.fillStyle = ink2; const nb = y + h - pad - 30 * u, ns = w * .076; font(c, ns, 600, IN); c.letterSpacing = ns * .08 + 'px'; emb(d.word, x + pad, nb);
  if (d.roman) { const n = { III: 1, II: 2, I: 3 }[d.roman] || 0, sw = w * .044, sh = Math.max(3.5 * u / 1.94, w * .0085), gap = w * .0055, gx = x + w - pad - (sw * 3 + gap * 2), gy = nb - ns * .36 - sh / 2;
    for (let i = 0; i < 3; i++) { const sx = gx + i * (sw + gap); c.fillStyle = eh; c.fillRect(sx - u * .26, gy - u * .26, sw, sh); c.fillStyle = el; c.fillRect(sx + u * .4, gy + u * .4, sw, sh); c.fillStyle = i < n ? ink2 : alpha(ink2, .2); c.fillRect(sx, gy, sw, sh); } }
  c.letterSpacing = '0px'; c.fillStyle = alpha(ink2, .22); c.fillRect(x + pad, nb + 9 * u, w - 2 * pad, Math.max(1, u * .8)); c.fillStyle = ink2;
  font(c, 10.5 * u, 600, IN); emb(d.recLine, x + pad, y + h - pad); c.textAlign = 'right'; font(c, 10.5 * u, 600, IN);
  emb((d.tierKo || '').replace(/\s*[123]$/, '') + (d.roman ? ' ' + d.roman : '') + ' · ' + d.topLabel, x + w - pad, y + h - pad);
  c.restore();
}

export function tierBg(c, d) {
  const m = STORY_MAT[d.key], g = c.createLinearGradient(0, 0, W * .4, H);
  g.addColorStop(0, m.s[0]); g.addColorStop(.55, m.s[Math.floor(m.s.length / 2)]); g.addColorStop(1, m.s[m.s.length - 1]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = d.key === 'challenger' ? 'rgba(20,18,40,.55)' : 'rgba(12,14,18,.42)'; c.fillRect(0, 0, W, H);
  const rg = c.createRadialGradient(W * .2, H * .1, 0, W * .2, H * .1, H * .7); rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = rg; c.fillRect(0, 0, W, H);
}

// v3 story editor: document = background + ordered layers, rendered 1:1 to a 1080x1920 canvas (preview == export).
export const LK = { x: 540, y: 960, s: 1, r: 0, o: 1 };
export let lseq = 0;
export const lid = () => 'L' + Date.now().toString(36) + (lseq++);
export const mk = (type, p) => ({ id: lid(), type, ...LK, ...p });
// text block: lines measured, local box centred on (0,0)
export function textBlock(c, lines, o) { // o: size, fam, w, ls, lh, al, st
  const L = lines.map(l => { font(c, l.size || o.size, l.w || o.w, l.fam || o.fam, l.st || o.st || 'normal'); c.letterSpacing = (l.ls ?? o.ls ?? 0) + 'px'; const wd = c.measureText(l.t).width - (l.ls ?? o.ls ?? 0); c.letterSpacing = '0px'; return { ...l, size: l.size || o.size, wd }; });
  let y = 0; const lh = o.lh ?? 1.15; L.forEach((l, i) => { if (i) y += (L[i - 1].size * .25 + l.size * .8) * lh + (l.gap || 0); else y = l.size * (HAN.test(l.t) ? .9 : .8); l.base = y; });
  const w = Math.max(1, ...L.map(l => l.wd)), h = Math.max(1, y + L[L.length - 1].size * .22);
  // centre the real glyphs (actualBoundingBox) vertically in the box, so a background box has equal space above and below
  let gt = Infinity, gb = -Infinity; for (const l of L) { font(c, l.size, l.w || o.w, l.fam || o.fam, l.st || o.st || 'normal'); const m = c.measureText(l.t.trim() ? l.t : 'H'), a = m.actualBoundingBoxAscent ?? l.size * .72, d = m.actualBoundingBoxDescent ?? 0; gt = Math.min(gt, l.base - a); gb = Math.max(gb, l.base + d); }
  if (isFinite(gt) && isFinite(gb)) { const sh = h / 2 - (gt + gb) / 2; L.forEach(l => l.base += sh); }
  return { L, w, h };
}
// text effects of the layer being drawn (all OFF by default): 그림자 fsh, 외곽선 fol {col,w}, 글로우 fgl {col,r}
export function drawTextBlock(rc, c, B, o, col) {
  c.textBaseline = 'alphabetic'; c.textAlign = 'left'; const fx = rc.fx || {};
  for (const l of B.L) { const x = -B.w / 2 + (o.al === 'left' ? 0 : o.al === 'right' ? B.w - l.wd : (B.w - l.wd) / 2);
    font(c, l.size, l.w || o.w, l.fam || o.fam, l.st || o.st || 'normal'); c.letterSpacing = (l.ls ?? o.ls ?? 0) + 'px'; c.fillStyle = l.col || col; c.globalAlpha = (l.alpha ?? 1) * (o.ga ?? 1);
    const ty = l.base - B.h / 2, sz = l.size || o.size; fxText(rc, c, l.t, x, ty, sz, l.col || col); c.letterSpacing = '0px'; c.globalAlpha = o.ga ?? 1; }
}
export function fxText(rc, c, t, x, ty, sz, col) { const fx = rc.fx || {}; const l = { t };
    if (fx.fgl) { c.save(); c.shadowColor = fx.fgl.col === '@text' || !fx.fgl.col ? col : fx.fgl.col; c.shadowBlur = sz * (fx.fgl.r ?? 30) / 100; for (let k = 0; k < 2; k++) c.fillText(l.t, x, ty); c.restore(); }
    if (fx.fsh) { c.save(); const q = Array.isArray(fx.fsh) ? fx.fsh : [0, sz * .05, sz * .14, 'rgba(0,0,0,.45)']; c.shadowOffsetX = q[0]; c.shadowOffsetY = q[1]; c.shadowBlur = q[2]; c.shadowColor = q[3]; c.fillText(l.t, x, ty); c.restore(); }
    if (fx.fol && fx.fol.w) { c.save(); c.strokeStyle = fx.fol.col || '#000000'; c.lineWidth = fx.fol.w * 2; c.lineJoin = 'round'; c.miterLimit = 2; c.strokeText(l.t, x, ty); c.restore(); }
    c.fillText(l.t, x, ty); }
// text background box: own colour (L.bcol) + opacity (L.bo); without bcol it behaves as before (semi = black 45%, full = text colour)
export function boxBehind(c, w, h, style, col, pad, rad, L = {}) { if (!style || style === 'none') return; rr(c, -w / 2 - pad, -h / 2 - pad * .7, w + pad * 2, h + pad * 1.4, rad);
  c.save(); if (L.bcol) { c.fillStyle = L.bcol; c.globalAlpha *= L.bo ?? (style === 'semi' ? .45 : 1); } else { c.fillStyle = style === 'semi' ? '#000000' : col; c.globalAlpha *= L.bo ?? (style === 'semi' ? .45 : 1); } c.fill(); c.restore(); }
// ---- each layer type: measure() -> {w,h} local, draw(c) centred at 0,0 ----
// ---- 오늘 기록 templates: colour tokens ('@text' / '@acc' / '@bg') and baseline-anchored, optically aligned text ----
export const tokCol = (doc, v) => typeof v === 'string' && v[0] === '@' && doc && doc.tok ? (v === '@acc' ? doc.tok.acc : v === '@bg' ? doc.tok.bg : v === '@text' ? doc.tok.text : v) : v;
// ratio coords on 1080x1440 → px in the current format (lower half stays bottom-anchored so 9:16 / 4:5 / 1:1 keep the spacing)
export const ltPos = (rc, L) => { const y0 = L.ry * LOG_H; return { x: L.rx * W_, y: rc.H === LOG_H || L.ry <= .5 ? y0 : rc.H - (LOG_H - y0) }; };
export const ltFam = L => L.font === 'archivo' ? `${ARC_.replace(',sans-serif', '')},"LZ notokr",${PRE_}` : famOf(L.font, true);
// Optical alignment: the template x is where the INK of the first glyph starts. measureText().actualBoundingBoxLeft is the
// first glyph's side bearing measured on the real outline (same as LSB/unitsPerEm×size from hmtx, ≲0.3px apart), so x = target − sb.
export function logText(rc, c, L) {
  const sz = L.size || 56, fam = ltFam(L), ls = L.ls || 0, t = String(L.t ?? '') || ' ';
  font(c, sz, L.w || 600, fam); c.letterSpacing = ls + 'px'; const m = c.measureText(t);
  let um = null, usz = Math.round(sz * .6), ug = L.ug ?? 8; if (L.unit) { font(c, usz, 400, ltFam({ font: 'archivo' })); c.letterSpacing = '0px'; um = c.measureText(L.unit); }
  c.letterSpacing = '0px';
  const inkL = -(m.actualBoundingBoxLeft || 0), adv = m.width - ls, right = um ? adv + ug + um.actualBoundingBoxRight : m.actualBoundingBoxRight;
  const asc = Math.max(m.actualBoundingBoxAscent || sz * .72, um ? um.actualBoundingBoxAscent : 0), desc = Math.max(m.actualBoundingBoxDescent || 0, um ? um.actualBoundingBoxDescent : 0, 1);
  const w = Math.max(1, right - inkL), h = asc + desc, col = L.col || '#ffffff';
  return { w, h, asc, draw: () => { const ox = -w / 2 - inkL, oy = -h / 2 + asc; c.save(); c.globalAlpha *= (L.ga ?? 1); c.fillStyle = col; c.textAlign = 'left'; c.textBaseline = 'alphabetic';
    font(c, sz, L.w || 600, fam); c.letterSpacing = ls + 'px'; fxText(rc, c, t, ox, oy, sz, col); c.letterSpacing = '0px';
    if (um) { font(c, usz, 400, ltFam({ font: 'archivo' })); c.fillText(L.unit, ox + adv + ug, oy); } c.restore(); } };
}
export function layerGeom(rc, c, L, d, doc, photos) {
  if (doc && doc.tok) { if (L.col && L.col[0] === '@') L = { ...L, col: tokCol(doc, L.col) }; if (typeof L.fill === 'string' && L.fill[0] === '@') L = { ...L, fill: tokCol(doc, L.fill) }; }
  if (L.lt && L.type === 'text') return logText(rc, c, L);
  if (L.col === '@tier') L = { ...L, col: accentOf(d) }; else if (L.col === '@tierL') L = { ...L, col: tierTint(d) }; else if (typeof L.col === 'string' && L.col.startsWith('@m')) L = { ...L, col: metalTok(L.col, d) };
  if (L.bcol === '@tier') L = { ...L, bcol: accentOf(d) };
  if (L.sp && (L.type === 'text' || L.type === 'stat')) return specText(rc, c, L, d, doc);
  if (L.type === 'text') {
    const ko = HAN.test(L.t || ''), fam = famOf(L.font, ko || !L.font), size = L.size || 72;
    const B = textBlock(c, String(L.t || ' ').split('\n').map(t => ({ t: t || ' ' })), { size, fam, w: wOf(L.font, L.w || 700), ls: L.ls || 0, lh: L.lh ?? 1.15 });
    const pad = L.box && L.box !== 'none' ? size * .35 : 0;
    return { w: B.w + pad * 2, h: B.h + pad * 1.4, draw: () => { const col = L.col || '#ffffff'; boxBehind(c, B.w, B.h, L.box, col, pad, size * .28, L); drawTextBlock(rc, c, B, { al: L.al || 'center', w: wOf(L.font, L.w || 700), fam, ls: L.ls || 0 }, L.box === 'full' && !L.bcol ? contrast(col) : col); } };
  }
  if (L.type === 'stat') {
    const v = statValue(d, doc, L.stat), lab = STATS[L.stat][1], base = STAT_SIZE[L.stat], ko = HAN.test(v);
    const fam = L.font ? famOf(L.font) : ko ? PRE_ : ARC_, w = wOf(L.font, L.w || 700), col = L.col || '#ffffff', acc = accentOf(d), m = STORY_MAT[d.key];
    if (L.v === 4) { // label-only element (e.g. '5K 기록', '페이스'): derived from the result, styled/moved on its own
      const lb = L.lab != null && L.lab !== '' ? L.lab : statLabel(d, L.stat), lfam = L.font ? fam : PRE_, lw = L.font ? w : 600;
      const B = textBlock(c, [{ t: lb, size: base * (L.labK ?? .2) }], { size: base * (L.labK ?? .2), fam: lfam, w: lw, ls: L.ls || 0, lh: L.lh ?? 1 });
      const sz = base * (L.labK ?? .2), pd = L.box && L.box !== 'none' ? sz * .4 : 0;
      return { w: B.w + pd * 2, h: B.h + pd * 1.4, draw: () => { boxBehind(c, B.w, B.h, L.box, col, pd, sz * .3, L); drawTextBlock(rc, c, B, { al: L.al || 'left', w: lw, fam: lfam, ls: L.ls || 0 }, L.box === 'full' && !L.bcol ? contrast(col) : col); } }; }
    const vt = [1, 2, 3].includes(L.v) ? L.v : 0;
    // typeface "look" is independent of the display style (layout): switching 기본/숫자만/배지/러닝앱 never changes the font
    const run = !L.font && !ko && (L.look ?? (vt === 3 ? 'run' : 'std')) === 'run';
    const VW = L.font ? w : run ? 900 : 700, VST = L.font || ko ? 'normal' : run ? 'condensed' : L.stat !== 'next' ? 'semi-expanded' : 'normal', SK = run ? (L.sk ?? -.1) : (L.sk ?? 0);
    if (vt === 3) { // run-app style: huge value, tiny label underneath
      const lb = L.lab != null ? L.lab : L.stat === 'rec' ? d.recLine.split(' ')[0] + ' 기록' : STATS[L.stat][0];
      const vfam = fam, vw = ko && !L.font ? 700 : VW;
      const B = textBlock(c, [{ t: v, size: base, fam: vfam, w: vw, st: VST }, ...(lb ? [{ t: lb, size: base * (L.labK ?? .2), fam: PRE_, w: 600, alpha: .92, ls: 0, gap: base * .03 }] : [])], { size: base, fam: vfam, w: vw, ls: L.ls ?? (ko ? 0 : -2), lh: L.lh ?? .95 });
      const sk = ko ? 0 : SK, extra = Math.abs(sk) * B.h;
      const pd = L.box && L.box !== 'none' ? base * .22 : 0;
      return { w: B.w + extra + pd * 2, h: B.h + pd * 1.4, draw: () => { boxBehind(c, B.w + extra, B.h, L.box, col, pd, base * .2, L); c.transform(1, 0, sk, 1, 0, 0); drawTextBlock(rc, c, B, { al: L.al || 'left', w: vw, fam: vfam, ls: L.ls ?? (ko ? 0 : -2) }, L.box === 'full' && !L.bcol ? contrast(col) : col); } };
    }
    const lines = vt === 0 ? [{ t: L.stat === 'event' ? v : lab, size: Math.max(22, base * .26), fam: ARC_, w: 600, st: 'expanded', ls: 6, alpha: .8 }, { t: v, size: base, gap: base * .05, w: VW, st: VST }] : [{ t: v, size: base, w: VW, st: VST }];
    if (vt === 0 && L.stat === 'event') lines.shift();
    const B = textBlock(c, lines, { size: base, fam, w, ls: L.ls || 0, lh: L.lh ?? 1.1, st: !L.font && !ko && L.stat !== 'next' ? 'semi-expanded' : 'normal' });
    const pad = vt === 2 ? base * .32 : L.box && L.box !== 'none' ? base * .3 : 0;
    return { w: B.w + pad * 2 + Math.abs(SK) * B.h, h: B.h + pad * 1.4, draw: () => {
      if (vt === 2) { rr(c, -B.w / 2 - pad, -B.h / 2 - pad * .7, B.w + pad * 2, B.h + pad * 1.4, (B.h + pad * 1.4) / 2); const g = c.createLinearGradient(-B.w / 2, 0, B.w / 2, 0); m.s.forEach((s, i) => g.addColorStop(i / (m.s.length - 1), s)); c.save(); c.fillStyle = L.bcol || (L.col ? col : g); c.globalAlpha *= L.bo ?? 1; c.fill(); c.restore(); drawTextBlock(rc, c, B, { al: 'center', w, fam, ls: L.ls || 0, st: 'normal' }, L.bcol ? (L.col ? col : contrast(L.bcol)) : L.col ? contrast(col) : m.ink); return; }
      boxBehind(c, B.w, B.h, L.box, L.col || acc, pad, base * .25, L);
      if (SK) c.transform(1, 0, SK, 1, 0, 0); drawTextBlock(rc, c, B, { al: L.al || 'center', w, fam, ls: L.ls || 0 }, L.box === 'full' && !L.bcol ? contrast(L.col || acc) : col); } };
  }
  if (L.type === 'card') {
    if (L.v === 1) { const lab = d.word + (d.roman ? ' ' + d.roman : ''); font(c, 44, 800, ARC_, 'expanded'); const tw = c.measureText(lab).width, w = tw + 120, h = 96, m = STORY_MAT[d.key];
      return { w, h, draw: () => { rr(c, -w / 2, -h / 2, w, h, h / 2); const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); m.s.forEach((s, i) => g.addColorStop(i / (m.s.length - 1), s)); c.fillStyle = g; c.fill(); c.fillStyle = m.ink; font(c, 44, 800, ARC_, 'expanded'); c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(lab, 0, 3); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; } }; }
    const w = 900, h = Math.round(900 / 1.586); return { w, h, draw: () => drawCard(c, { ...d, who: '' }, -w / 2, -h / 2, w, h) };
  }
  if (L.type === 'photo') {
    const im = photoSrc(photos, L.pid, L); const box = imContent(im), ar = im ? box.w / box.h : 1, bw = L.bw || (ar >= 1 ? 640 : 640 * ar), bh = L.bh || (ar >= 1 ? 640 / ar : 640);
    const pol = L.mask === 'polaroid', w = pol ? bw + 48 : bw, h = pol ? bh + 150 : bh;
    return { w, h, draw: () => {
      if (pol) { c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = '#fbfaf6'; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }
      const ox = -bw / 2, oy = pol ? -h / 2 + 24 : -bh / 2;
      const shp = () => { c.beginPath(); if (L.mask === 'circle') c.ellipse(0, oy + bh / 2, bw / 2, bh / 2, 0, 0, 7); else c.roundRect(ox, oy, bw, bh, L.mask === 'round' ? 48 : 0); };
      if (L.psh && !L.cut) { c.save(); c.shadowOffsetX = L.psh[0]; c.shadowOffsetY = L.psh[1]; c.shadowBlur = L.psh[2]; c.shadowColor = L.psh[3]; shp(); c.fillStyle = '#000'; c.fill(); c.restore(); }
      c.save(); c.beginPath(); if (L.cut) c.rect(ox - bw, oy - bh, bw * 3, bh * 3); else if (L.mask === 'circle') c.ellipse(0, oy + bh / 2, bw / 2, bh / 2, 0, 0, 7); else c.roundRect(ox, oy, bw, bh, L.mask === 'round' ? 48 : 0); c.clip();
      if (im) { const src = im, cz = Math.max(1, L.cz || 1), sc = Math.max(bw / im.width, bh / im.height) * cz, iw = im.width * sc, ih = im.height * sc;
        const mx = (iw - bw) / 2, my = (ih - bh) / 2; if (L.cut) { const pad = src._olPad || 0, cw = Math.max(1, src.width - pad * 2), ch = Math.max(1, src.height - pad * 2), dw = bw * cz * (src.width / cw), dh = bh * cz * (src.height / ch); c.drawImage(src, ox + (bw - dw) / 2 + (L.cx || 0) * (bw * cz - bw) / 2, oy + (bh - dh) / 2 + (L.cy || 0) * (bh * cz - bh) / 2, dw, dh); } else c.drawImage(src, ox - mx + (L.cx || 0) * mx, oy - my + (L.cy || 0) * my, iw, ih); }
      else { const g = c.createLinearGradient(ox, oy, ox + bw * .4, oy + bh); g.addColorStop(0, '#6f7a86'); g.addColorStop(1, '#2a323c'); c.fillStyle = pol ? '#dcd8cf' : g; c.fillRect(ox, oy, bw, bh); c.fillStyle = pol ? '#6b6a66' : 'rgba(255,255,255,.75)'; c.textAlign = 'center'; font(c, Math.max(28, Math.min(44, bw / 14)), 600, PRE_); c.fillText('사진 넣기', 0, oy + bh / 2 + 14); c.textAlign = 'left'; }
      c.restore(); if (L.bd && !L.cut) { c.save(); shp(); c.lineWidth = L.bd[0] * 2; c.strokeStyle = L.bd[1]; c.clip(); c.stroke(); c.restore(); } } };
  }
  if (L.type === 'sticker') return sticker(c, L, d);
  if (L.type === 'shape' && L.k === 'box') { const w = L.w, h = L.h, fill = metalTok(L.fill, d), path = () => boxPath(c, L, w, h);
    return { w, h, draw: () => {
      if (L.pat === 'bar' || L.pat === 'dash') { c.fillStyle = typeof fill === 'string' ? fill : '#000'; boxPat(c, L.pat, w, h); return; }
      const g = cssFill(c, fill, w, h);
      if (g && g.__ry && g.__ry !== 1) { c.save(); path(); c.clip(); c.translate(g.__c[0], g.__c[1]); c.scale(1, g.__ry); c.translate(-g.__c[0], -g.__c[1]); c.fillStyle = g; c.fillRect(-w * 2, -h * 2 / g.__ry, w * 4, h * 4 / g.__ry); c.restore(); }
      else { c.save(); if (L.sh) { c.shadowOffsetX = L.sh[0]; c.shadowOffsetY = L.sh[1]; c.shadowBlur = L.sh[2]; c.shadowColor = L.sh[3]; } c.fillStyle = g; path(); c.fill(); c.restore(); }
      if (L.bs) { c.save(); path(); c.clip(); path(); c.lineWidth = L.bs[0] * 2; c.strokeStyle = cssFill(c, metalTok(L.bs[1], d), w, h); c.stroke(); c.restore(); } } }; }
  if (L.type === 'shape') {
    const w = L.w || 400, h = L.h || 400, col = L.col || '#ffffff';
    return { w, h, draw: () => { c.fillStyle = col;
      if (L.k === 'paper') { c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 50; c.shadowOffsetY = 20; c.beginPath(); c.moveTo(-w / 2, -h / 2); c.lineTo(w / 2, -h / 2); c.lineTo(w / 2, h / 2); for (let x = w / 2; x > -w / 2; x -= 30) { c.lineTo(x - 15, h / 2 - 16); c.lineTo(x - 30, h / 2); } c.closePath(); c.fill(); c.restore(); }
      else if (L.k === 'circle') { c.beginPath(); c.ellipse(0, 0, w / 2, h / 2, 0, 0, 7); c.fill(); }
      else if (L.k === 'dash') { for (let x = -w / 2; x < w / 2; x += 18) c.fillRect(x, -h / 2, 10, h); }
      else rr(c, -w / 2, -h / 2, w, h, L.rad || 0), c.fill(); } };
  }
  return { w: 10, h: 10, draw: () => { } };
}
// ---- v4 template text: CSS-like box (font px, weight, letter-spacing, line-height, align, underline), anchored by the template ----
// official hoohaa wordmark (same geometry as the app header logo). Master is white; each layer tints it to its text colour.
export let LOGO_C = null;
export const LOGO_TINT = new Map();
export function logoCanvas() { if (LOGO_C) return LOGO_C; const K = 4, cv = document.createElement('canvas'); cv.width = 470 * K; cv.height = 122 * K; const g = cv.getContext('2d'); g.scale(K, K); g.translate(40, 4); g.transform(1, 0, Math.tan(-14 * Math.PI / 180), 1, 0, 0);
  g.strokeStyle = g.fillStyle = '#ffffff'; g.lineWidth = 16; const st = d => g.stroke(new Path2D(d)), ring = (x) => { g.beginPath(); g.arc(x, 70, 22, 0, Math.PI * 2); g.stroke(); };
  st('M8 6V100M8 70Q8 40 30 40Q52 40 52 70V100'); st('M224 6V100M224 70Q224 40 246 40Q268 40 268 70V100'); st('M340 40V100'); st('M412 40V100'); [102, 174, 318, 390].forEach(ring);
  g.beginPath(); g.roundRect ? g.roundRect(95.18, 28.56, 13.64, 9.24, 1.848) : g.rect(95.18, 28.56, 13.64, 9.24); g.fill(); g.fillRect(98.9992, 37.36, 6.0016, 4.4);
  g.beginPath(); g.arc(102, 70, 22, 0, Math.PI * 2); g.fill(); // stopwatch face filled, hand cut out
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(102, 70); g.lineTo(113.81, 63.18); g.stroke(); g.beginPath(); g.arc(102, 70, 5.95, 0, Math.PI * 2); g.fill();
  return (LOGO_C = cv); }
export function logoTint(col) { const key = col || '#ffffff'; const hit = LOGO_TINT.get(key); if (hit) return hit; const src = logoCanvas(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const g = cv.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = key; g.fillRect(0, 0, cv.width, cv.height); LOGO_TINT.set(key, cv); return cv; }
export const LOGO_TXT = 'hoohaa.run';
export function specText(rc, c, L, d, doc) {
  const sp = L.sp, str = L.type === 'stat' ? statValue(d, doc, L.stat, L) : String(L.t || ' '), lines = str.split('\n'), sz = L.size || sp.sz, fk = L.font && FONTS[L.font] ? L.font : 'pretendard';
  const fam = FONTS[fk].fam, w = wOf(fk, sp.wt), ls = L.ls ?? sp.ls ?? 0; font(c, sz, w, fam); c.letterSpacing = ls + 'px';
  const m = c.measureText('Hg가'), asc = m.fontBoundingBoxAscent || sz * .95, desc = m.fontBoundingBoxDescent || sz * .25, lh = (L.lh ?? sp.lh) ? (L.lh ?? sp.lh) * sz : asc + desc;
  const LG = lines.length === 1 && lines[0].endsWith(LOGO_TXT); if (LG) lines[0] = lines[0].slice(0, -LOGO_TXT.length); const lgH = LG ? sz * 1.5 : 0, lgW = lgH * 470 / 122;
  const ink = lines.map(t => { const m3 = c.measureText(t); return LG || !t.trim() ? [0, m3.width] : [m3.actualBoundingBoxLeft, m3.actualBoundingBoxLeft + m3.actualBoundingBoxRight]; }); // ink box: margins measured to the glyphs, not the advance
  const lw = lines.map((t, i) => ink[i][1] + (LG ? lgW : 0)); c.letterSpacing = '0px'; const W = Math.max(1, ...lw), H = Math.max(lh * lines.length, lgH), bx = L.box && L.box !== 'none', pad = bx ? sz * .3 : 0, col0 = L.col || '#ffffff', col = L.box === 'full' && !L.bcol ? contrast(col0) : col0, al = sp.al || 'left';
  return { w: W + pad * 2, h: H + pad * 1.4, draw: () => { if (bx) boxBehind(c, W, H, L.box, col0, pad, sz * .28, L); font(c, sz, w, fam); c.letterSpacing = ls + 'px'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = col;
    lines.forEach((t, i) => { const x = -W / 2 + ink[i][0] + (al === 'center' ? (W - lw[i]) / 2 : al === 'right' ? W - lw[i] : 0), y = (() => { const m2 = c.measureText(t.trim() ? t : 'H'), a = m2.actualBoundingBoxAscent ?? asc * .75, d = m2.actualBoundingBoxDescent ?? 0; return -H / 2 + i * lh + lh / 2 + (a - d) / 2; })();
      if (sp.ul) { c.save(); c.fillStyle = sp.ul[0]; c.fillRect(x, y + sp.ul[2], lw[i] - ls, sp.ul[1]); c.restore(); }
      if (t) fxText(rc, c, t, x, y, sz, col);
      if (LG) { c.save(); c.globalAlpha *= .92; const sh = L.fsh; if (Array.isArray(sh)) { c.shadowOffsetX = sh[0]; c.shadowOffsetY = sh[1]; c.shadowBlur = sh[2]; c.shadowColor = sh[3]; } c.drawImage(logoTint(col), x + lw[i] - lgW, -lgH / 2, lgW, lgH); c.restore(); } }); c.letterSpacing = '0px'; } }; }
// template box extras: rad (corner radius), poly (regular n-gon, point up), pat 'zig' (receipt edges) / 'bar' (barcode) / 'dash' (dashed rule), bs [width, colour] inside stroke
export function boxPath(c, L, w, h) { if (L.poly) { const n = L.poly, r = Math.min(w, h) / 2; c.beginPath(); for (let i = 0; i < n; i++) { const a = -Math.PI / 2 + i * 2 * Math.PI / n; c[i ? 'lineTo' : 'moveTo'](r * Math.cos(a), r * Math.sin(a)); } c.closePath(); return; }
  if (L.pat === 'zig') { const z = 18, n = Math.max(1, Math.round(w / (z * 2))), s = w / n, x0 = -w / 2, y0 = -h / 2; c.beginPath(); c.moveTo(x0, y0 + z); for (let i = 0; i < n; i++) { c.lineTo(x0 + i * s + s / 2, y0); c.lineTo(x0 + (i + 1) * s, y0 + z); } c.lineTo(w / 2, h / 2 - z); for (let i = n; i > 0; i--) { c.lineTo(x0 + i * s - s / 2, h / 2); c.lineTo(x0 + (i - 1) * s, h / 2 - z); } c.closePath(); return; }
  rr(c, -w / 2, -h / 2, w, h, Math.min(L.rad || 0, w / 2, h / 2)); }
export const BARS = [3, 1, 2, 1, 4, 1, 1, 3, 2, 1, 1, 2, 4, 1, 2, 1, 3, 1, 1, 2, 3, 1, 2, 4, 1, 1, 2, 1, 3, 2, 1, 1, 4, 2, 1, 3, 1, 2, 1, 1, 3, 2, 1, 4];
export function boxPat(c, pat, w, h) { if (pat === 'dash') { for (let x = -w / 2; x < w / 2; x += 18) c.fillRect(x, -h / 2, Math.min(10, w / 2 - x), h); return; }
  const tot = BARS.reduce((a, b) => a + b, 0) + BARS.length, k = w / tot; let x = -w / 2; BARS.forEach((b, i) => { if (i % 2 === 0) c.fillRect(x, -h / 2, b * k, h); x += (b + 1) * k; }); }
// css-like fills for template boxes: colour, linear-gradient(angle), radial-gradient(ellipse|circle at x% y%) (farthest-corner)
export function cssFill(c, f, w, h) { if (!f || typeof f === 'string') return f || '#000';
  let g; if (f.t === 'lin') { const a = f.a * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(w * dx) + Math.abs(h * dy); g = c.createLinearGradient(-dx * len / 2, -dy * len / 2, dx * len / 2, dy * len / 2); }
  else { const cx = -w / 2 + f.cx * w, cy = -h / 2 + f.cy * h, fx = Math.max(f.cx, 1 - f.cx) * w, fy = Math.max(f.cy, 1 - f.cy) * h; const r = f.sh === 'circle' ? Math.hypot(fx, fy) : fx * Math.SQRT2; g = c.createRadialGradient(cx, cy, 0, cx, cy, r); g.__ry = f.sh === 'circle' ? 1 : (fy * Math.SQRT2) / Math.max(1, r); g.__c = [cx, cy]; }
  for (const [p, col] of f.st) g.addColorStop(Math.max(0, Math.min(1, p)), col); return g; }
export function bgDraw(rc, c, doc, d, photos) {
  const b = doc.bg || { type: 'tier' };
  if (b.type === 'solid') { c.fillStyle = b.c1 || '#0F1620'; c.fillRect(0, 0, W_, rc.H); }
  else if (b.type === 'grad') { const g = c.createLinearGradient(0, 0, W_ * .35, rc.H); g.addColorStop(0, b.c1); g.addColorStop(1, b.c2); c.fillStyle = g; c.fillRect(0, 0, W_, rc.H); }
  else if (b.type === 'dark') { c.fillStyle = '#0F1620'; c.fillRect(0, 0, W_, rc.H); const m = STORY_MAT[d.key], tint = m.glow || 'rgba(255,255,255,.06)', rg = c.createRadialGradient(W_ / 2, 700, 0, W_ / 2, 700, 900); rg.addColorStop(0, tint.replace(/[\d.]+\)$/, '0.22)')); rg.addColorStop(1, 'rgba(15,22,32,0)'); c.fillStyle = rg; c.fillRect(0, 0, W_, rc.H); }
  else if (b.type === 'photo' && photos[b.pid] && !b.cut) { const im = b.filter && !hasPE({ ...b, filter: 0 }) ? filtered(photos[b.pid], b.filter, b.pid) : photoSrc(photos, b.pid, b);
    c.fillStyle = '#0F1620'; c.fillRect(0, 0, W_, rc.H); c.drawImage(im, ...bgRect(b, im, rc.H)); }
  else if (b.type === 'tone' || b.type === 'photo') { const m = STORY_MAT[d.key], g = c.createLinearGradient(0, 0, W_ * .3, rc.H); g.addColorStop(0, '#6f7a86'); g.addColorStop(.5, '#3c4652'); g.addColorStop(1, '#1d232b'); c.fillStyle = g; c.fillRect(0, 0, W_, rc.H);
    const rg = c.createRadialGradient(W_ * .75, rc.H * .28, 0, W_ * .75, rc.H * .28, rc.H * .6); rg.addColorStop(0, alpha(m.s[0], .28)); rg.addColorStop(1, alpha(m.s[0], 0)); c.fillStyle = rg; c.fillRect(0, 0, W_, rc.H);
    const lg = c.createRadialGradient(W_ * .2, rc.H * .85, 0, W_ * .2, rc.H * .85, rc.H * .5); lg.addColorStop(0, 'rgba(255,255,255,.10)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, W_, rc.H); }
  else tierBg(c, d);
  if (b.type === 'photo' && photos[b.pid] && b.cut) { const im = photoSrc(photos, b.pid, b); c.drawImage(im, ...bgRect(b, im, rc.H)); } // 배경 지우기: only the person, over a plain tone
}
export const PRE_FONTS = ['400 40px "OV Bebas"', '400 40px "OV Anton"', '800 40px "OV Playfair"', '700 40px "OV Mono"', '400 40px "OV BlackHan"', '800 40px "TC Archivo"', '300 40px "TC Archivo"', '600 40px "TC Archivo"', '700 40px "TC Pretendard"', '500 40px "TC Pretendard"', '600 40px "TC Pretendard"'];
// effective transform: 상위 % is clamped so it can never become small or invisible
export const isTopL = L => L.type === 'stat' && L.stat === 'top' && L.v !== 4;
export function eff(L, g) { if (L.type === 'stat' && L.stat === 'top' && L.v !== 4) { const minS = TOP_MIN_PX / Math.max(1, g.h); return { ...L, s: Math.max(L.s, minS), o: Math.max(L.o ?? 1, .9), hidden: false }; } return L; }
export async function renderDoc(ctx, d, doc, photos = {}, cv) {
  await document.fonts.ready; await Promise.all(PRE_FONTS.map(f => document.fonts.load(f, 'A가').catch(() => { })));
  await Promise.all([...new Set(doc.layers.map(l => l.font).filter(Boolean))].map(ctx.loadFont));
  if (doc.layers.some(l => l.type === 'card')) await Promise.all([chipLoad(d.key), cardFontsReady()]);
  await Promise.all(doc.layers.filter(l => l.type === 'sticker').map(l => l.k.startsWith('ph:') ? imgOf(iconSVG(l.k, tokCol(doc, l.col) || TOKENS.text)) : stkLoad(l.k, l)));
  if (doc.log) await ctx.loadFont('notokr'); if (doc.layers.some(l => l.type === 'sticker' && l.k === 'data_memo')) await ctx.loadFont('gaegu'); // memo sticker is drawn in Gaegu (v4Sticker)
  await Promise.all(doc.layers.filter(l => l.type === 'sticker' && l.k.startsWith('data_')).map(l => imgOf(dataArt(l.k, dataFields(l)))));
  { const txt = doc.layers.map(l => l.type === 'text' ? (l.t || '') : l.type === 'stat' ? statValue(d, doc, l.stat, l) + (l.lab || statLabel(d, l.stat)) : l.type === 'sticker' && l.k.startsWith('data_') ? Object.values(dataFields(l)).join('') : l.f ? Object.values(l.f).join('') : '').join('') + (doc.race || ''); // data stickers: their default text too (sticker-tab previews carry no l.f)
    const fk = []; if (needFull(txt)) fk.push('pretendardk'); if (doc.layers.some(l => l.font === 'blackhan' || (l.sp && l.sp.f === 'blackhan')) && needFull(txt, true)) fk.push('blackhank'); await Promise.all(fk.map(ctx.loadFont)); }
  const rc = { ...ctx, H: fmtH(doc.fmt), fx: null }; cv = cv || document.createElement('canvas'); cv.width = W_; cv.height = rc.H; const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; bgDraw(rc, c, doc, d, photos);
  const boxes = [], subj = doc.layers.some(l => l.behind && !l.hidden) ? subjectLayer(doc, photos, rc.H) : null;
  const order = subj ? [...doc.layers.filter(l => l.behind), null, ...doc.layers.filter(l => !l.behind)] : doc.layers;
  cv.__subject = !!subj;
  // shared layout: every stat row is one size — the row shrinks together until its widest value fits its equal-width column
  const rowS = {}, rowX = {}, RW = {}; { const G = {}; for (const l of doc.layers) if (l.row && !l.mv && l.af !== false && !l.hidden) (G[l.row.g] = G[l.row.g] || []).push(l);
    for (const [g, ms] of Object.entries(G)) { const n = ms[0].row.n, col = (W_ - 2 * MARGIN - (n - 1) * COL_GAP) / n; let f = 1; for (const l of ms) { c.save(); const gg = layerGeom(rc, c, l, d, doc, photos); c.restore(); RW[l.id] = gg; f = Math.min(f, col / Math.max(1, gg.w)); } rowS[g] = f; }
    const kf = {}; for (const [g, ms] of Object.entries(G)) { const k = ms[0].row.k + ms[0].row.n; kf[k] = Math.min(kf[k] ?? 1, rowS[g]); } for (const [g, ms] of Object.entries(G)) rowS[g] = kf[ms[0].row.k + ms[0].row.n];
    // 상위 % never drops below TOP_MIN_PX: the whole row grows with it; if that overflows the equal columns, the row spreads (space-between) instead
    for (const [g, ms] of Object.entries(G)) { const t = ms.find(isTopL); if (t) rowS[g] = Math.max(rowS[g], TOP_MIN_PX / Math.max(1, RW[t.id].h));
      const n = ms[0].row.n, f = rowS[g], col = (W_ - 2 * MARGIN - (n - 1) * COL_GAP) / n, srt = [...ms].sort((a, b) => a.row.i - b.row.i);
      if (n > 2 && srt.length === n && srt.some(l => RW[l.id].w * f > col + .5)) { const tot = srt.reduce((a, l) => a + RW[l.id].w * f, 0), gap = (W_ - 2 * MARGIN - tot) / (n - 1); let x = MARGIN; for (const l of srt) { const w = RW[l.id].w * f; if (l.row.i > 0 && l.row.i < n - 1) rowX[l.id] = x + w / 2; x += w + gap; } } } }
  for (const L0 of order) {
    if (L0 === null) { c.drawImage(subj[0], ...subj[1]); continue; }
    if (L0.lt && L0.type === 'shape' && L0.rh && !L0.mv) { L0.h = Math.round(L0.rh * Math.min(rc.H, LOG_H)); L0.w = Math.round(L0.rw * W_); }
    c.save(); const g = layerGeom(rc, c, L0, d, doc, photos), L = { ...eff(L0, g) }; c.restore();
    if (L0.lt && !L0.mv && L0.rx != null) { // 오늘 기록 templates: ratio anchor → centre (text: ink-left + baseline, others: top-left)
      const P = ltPos(rc, L0), s = L.s, fl = L0.flow && boxes.find(b => b.sid === L0.flow && !b.hidden);
      if (fl) P.x = fl.x + fl.w * fl.s / 2 + (L0.gap ?? 16);
      L.x = P.x + g.w * s / 2; L.y = g.asc != null ? P.y - g.asc * s + g.h * s / 2 : P.y + g.h * s / 2; }
    if (L.row && !L0.mv && L0.af !== false && rowS[L.row.g] != null) { L.s = rowS[L.row.g]; if (rowX[L.id] != null) L.x = rowX[L.id]; }
    else if (L.af && !(L.r)) { // template auto-fit: keep drawn bounds (incl. slant) inside ~6% safe margins until the user resizes it
      const M = L.sp ? MARGIN : 65, MY = L.sp ? 24 : 40, vw = L.vert ? g.h : g.w, vh = L.vert ? g.w : g.h, aw = L.ax === 'left' ? W_ - M - L.x : L.ax === 'right' ? L.x - M : 2 * Math.min(L.x - M, W_ - M - L.x), ah = L.ay === 'top' ? rc.H - MY - L.y : L.ay === 'bottom' ? L.y - MY : 2 * Math.min(L.y - MY, rc.H - MY - L.y);
      const fs = Math.min(aw / Math.max(1, vw), ah / Math.max(1, vh)); if (fs > 0 && fs < L.s) L.s = isTopL(L) ? Math.max(fs, TOP_MIN_PX / Math.max(1, g.h)) : fs; }
    { const vw = L.vert ? g.h : g.w, vh = L.vert ? g.w : g.h; if (L.ax === 'left') L.x += vw * L.s / 2; else if (L.ax === 'right') L.x -= vw * L.s / 2; if (L.ay === 'top') L.y += vh * L.s / 2; else if (L.ay === 'bottom') L.y -= vh * L.s / 2; }
    boxes.push({ id: L.id, x: L.x, y: L.y, s: L.s, r: L.r, w: g.w, h: g.h, type: L.type, stat: L.stat, v: L.v, hidden: !!L.hidden, nh: !!L.nh, k: L.k, sid: L.sid });
    if (L.hidden) continue;
    c.save(); c.translate(L.x, L.y); c.rotate(L.r || 0); c.scale(L.s, L.s); c.globalAlpha = L.o ?? 1; rc.fx = L.type === 'text' || L.type === 'stat' ? L : null; g.draw(); rc.fx = null; c.restore();
  }
  cv.__boxes = boxes; return cv;
}
// ---- templates (10+): pre-arranged layer bundles ----
export const TEMPLATES = Object.entries(TPL_NAMES);
// v4 template ids (saved docs, '템플릿 상태로') → the v5 template that replaced them
export const TPL_ALIAS = { nrc: 'finish', mono: 'minimal', behind: 'finish', hero: 'pass', polaroid: 'film', mag: 'minimal', split: 'film', collage: 'film', medal: 'pass', crew: 'bib' };
export const tplKey = t => TPL_SPEC[t] ? t : TPL_ALIAS[t] || 'finish';
// designer handoff → layers: every value/label is its own element; values are result tokens (never typed); positions are per format (spec px)
export function templateDoc(t, d, fmt = 'story') {
  t = tplKey(t); const els = TPL_SPEC[t][fmt || 'story'] || (fmt === 'thumb' && TPL_SPEC[t].feed) || TPL_SPEC[t].story, W = 1080, H = fmtH(fmt === 'story' ? undefined : fmt);
  const doc = { tpl: t, bg: { type: 'tone' }, race: '', layers: [], fmt: fmt === 'story' ? undefined : fmt }; let cutAt = els.findIndex(e => e.k === 'cut');
  const Y = (e, h) => e.y != null ? e.y + h / 2 : H - e.yb - h / 2;
  els.forEach((e, i) => { const rad = (e.r || 0) * Math.PI / 180;
    if (e.k === 'img' && e.w === 'full' && e.h === 'full') { doc.bgT = { px: 1 - 2 * e.pos[0], py: 1 - 2 * e.pos[1], ...(e.adj ? { adj: e.adj } : {}) }; return; }
    if (e.k === 'box' && e.w === 'full' && e.h === 'full' && typeof e.fill === 'string' && e.y === 0) { doc.bg = { type: 'solid', c1: e.fill }; return; }
    if (e.k === 'cut') { if (e.ol) doc.bgT = { ...(doc.bgT || {}), ol: { on: true, col: e.ol, w: 5 } }; return; }
    let L;
    if (e.k === 'box') { const w = e.w === 'full' ? W : e.w, h = e.h === 'full' ? H : e.h; L = mk('shape', { k: 'box', w, h, fill: e.fill, sh: e.sh || undefined, rad: e.rad, bs: e.bs, poly: e.poly, pat: e.pat, x: e.x + w / 2, y: Y(e, h), r: rad, nh: e.w === 'full' && e.h === 'full' ? 1 : undefined }); }
    else if (e.k === 'img') { const w = e.w === 'full' ? W : e.w, h = e.h === 'full' ? H : e.h, x = typeof e.w === 'number' && e.x + w > W ? W - w - 24 : e.x; L = mk('photo', { pid: null, bw: w, bh: h, mask: e.round ? 'circle' : 'rect', filter: 'none', cx: 1 - 2 * e.pos[0], cy: 1 - 2 * e.pos[1], adj: e.adj, bd: e.bd, psh: e.sh || undefined, x: x + w / 2, y: Y(e, h), r: rad }); }
    else if (e.k === 'stk') { const w = e.w, x = Math.min(e.x, W - w); L = mk('sticker', { k: e.n, s: w / 512, x: x + w / 2, y: Y(e, w), r: rad }); }
    else if (e.k === 'text') { const tok = /\{\w+\}/.test(e.tx), base = { font: e.f, col: e.col, sp: { sz: e.sz, wt: e.wt, ls: e.ls, lh: e.lh, al: e.al, ul: e.ul }, fsh: e.sh || undefined, s: 1, r: e.vert ? Math.PI / 2 : rad, vert: e.vert || undefined, af: !e.vert };
      const st = e.tx === '{rec}' ? 'rec' : /\{pct\}/.test(e.tx) ? 'top' : e.tx === '{tier}' ? 'tier' : e.tx === '{pace}' ? 'pace' : e.tx === '{vdot}' ? 'vdot' : 'combo';
      L = tok ? mk('stat', { stat: st, tx: e.tx, v: 1, ...base }) : mk('text', { t: e.tx, k: 'label', size: e.sz, ...base });
      if (e.al === 'center' && (e.w === 'full')) L.x = 540; else if (e.al === 'right' || e.right != null) { L.ax = 'right'; L.x = e.right != null ? W - e.right : e.x; } else { L.ax = 'left'; L.x = e.x; }
      if (e.y != null) { L.ay = 'top'; L.y = e.y; } else { L.ay = 'bottom'; L.y = H - e.yb; } }
    if (!L) return; L.sid = e.id; if (cutAt >= 0 && i < cutAt && L.type !== 'photo' && L.type !== 'shape') L.behind = true; doc.layers.push(L); });
  if (doc.bgT && !doc.bg.c1) doc.bg = { type: 'tone' };
  normLayout(doc, els, fmt || 'story', W);
  return doc;
}
// ---- shared template layout system: one side margin, equal stat columns, one type scale (canvas + export + every format) ----
export const MARGIN = 72, COL_GAP = 32;
export const FMT_K = { story: 1, feed: .8, square: .66, thumb: .75 };
export const typeScale = fmt => { const k = FMT_K[fmt] || 1; return { val: Math.round(64 * k), sub: Math.round(40 * k), lab: Math.round(26 * k), meta: Math.round(26 * k) }; };
export function normLayout(doc, els, fmt, W) {
  const TS = typeScale(fmt), byId = id => doc.layers.find(l => l.sid === id), side = e => e.y != null ? 't' : 'b', yv = e => e.y != null ? e.y : e.yb, xv = e => e.right != null ? W - e.right : e.x;
  const cand = els.filter(e => e.k === 'text' && !e.vert && !e.nr && e.w !== 'full' && !e.r && e.sz <= 130), cl = [];
  for (const e of cand) { const g = cl.find(q => q.s === side(e) && Math.abs(q.y - yv(e)) <= 24); if (g) g.m.push(e); else cl.push({ s: side(e), y: yv(e), m: [e] }); }
  const rows = cl.filter(q => { const xs = q.m.map(xv).sort((a, b) => a - b); return xs.length >= 2 && xs.every((x, i) => !i || x - xs[i - 1] > 150); });
  const inRow = new Set(); rows.forEach((q, gi) => { const m = q.m.sort((a, b) => xv(a) - xv(b)), n = m.length, mx = Math.max(...m.map(e => e.sz)) / (FMT_K[fmt] || 1), sz = mx <= 35 ? TS.lab : mx < 56 ? TS.sub : TS.val, y0 = q.s === 't' ? Math.min(...m.map(yv)) : Math.min(...m.map(yv));
    m.forEach((e, i) => { const L = byId(e.id); if (!L) return; inRow.add(L); const al = n > 1 && i === 0 ? 'left' : i === n - 1 ? 'right' : 'center';
      L.sp = { ...L.sp, sz, al }; if (L.type === 'text') L.size = sz; L.row = { g: fmt + gi, i, n, k: sz === TS.lab ? 'lab' : sz === TS.sub ? 'sub' : 'val' };
      if (al === 'left') { L.ax = 'left'; L.x = MARGIN; } else if (al === 'right') { L.ax = 'right'; L.x = W - MARGIN; } else { delete L.ax; L.x = MARGIN + (W - 2 * MARGIN) * (i + .5) / n; }
      L.y = q.s === 't' ? y0 : fmtH(fmt === 'story' ? undefined : fmt) - y0; }); q.lab = m.every(e => byId(e.id) && byId(e.id).row.k === 'lab'); q.y0 = y0; });
  // top-anchored value rows sit on their label row (fixed gap), so shrinking a row never opens a hole above the labels
  for (const q of rows) { if (q.lab || q.s !== 't') continue; const lr = rows.filter(r => r.s === 't' && r.y0 > q.y0).sort((r1, r2) => r1.y0 - r2.y0)[0]; if (!lr || !lr.lab || lr.m.length !== q.m.length || lr.y0 - q.y0 >= 220) continue;
    for (const e of q.m) { const L = byId(e.id); if (L) { L.ay = 'bottom'; L.y = lr.y0 - Math.round(8 * (FMT_K[fmt] || 1)); } } }
  for (const L of doc.layers) { if (inRow.has(L) || !L.sp || L.vert) continue; if (L.sp.sz <= 34 * (FMT_K[fmt] || 1) + 2 && L.sp.sz < 36) { L.sp = { ...L.sp, sz: TS.meta }; if (L.type === 'text') L.size = TS.meta; }
    if (L.sp.sz < 150) { if (L.ax === 'left' && L.x >= 30 && L.x <= 110) L.x = MARGIN; if (L.ax === 'right' && W - L.x >= 30 && W - L.x <= 110) L.x = W - MARGIN; } }
}
