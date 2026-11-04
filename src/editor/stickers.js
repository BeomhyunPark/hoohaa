// Stickers for the share-image editor: designer SVGs, data stickers (weather, course, bib, memo) and v3 canvas stickers.
// Moved out of editor.js unchanged. simg caches rasterised SVGs; mountEditor runs once per page, so a module-level cache behaves the same.
import { STK_SVG } from './assets.js';
import { TOKENS, iconSVG } from './logtpl.js';
import { celsius } from '../engine/logcalc.js';
import { ARC_, PRE_, FONTS, HAN, font, rr, ymd } from './util.js';
import { STORY_MAT, accentOf } from './tokens.js';

// ---- stickers: 26 static (designer SVG, rasterised once) + data stickers drawn live (user-typed fields) ----
export const simg = new Map();
export function stkLoad(k) { const svg = STK_SVG[k] || (k.startsWith('data_') ? dataArt(k, {}) : null); if (!svg) return Promise.resolve(null); return imgOf(svg); }
export function imgOf(svg) { if (!simg.has(svg)) simg.set(svg, new Promise(res => { const im = new Image(); im.onload = () => { simg.set(svg, im); res(im); }; im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); })); const v = simg.get(svg); return v instanceof Promise ? v : Promise.resolve(v); }
export const imgNow = svg => { const v = simg.get(svg); return v && !(v instanceof Promise) ? v : null; };
// v5 palette (same tokens as the 오늘 기록 cards): ink / paper / translucent glass + muted accents, thin line icons
export const INK = '#17181B', PAPER = '#ECEBE6', CREAM = '#F4F2EC', GLASS = '#111214', RUNC = '#B5C96A', RACEC = '#E08A62', GEARC = '#7FA8C9';
export const SV = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512"><defs><filter id="s" x="-30%" y="-30%" width="160%" height="170%"><feDropShadow dx="0" dy="10" stdDeviation="14" flood-color="#000" flood-opacity=".28"/></filter></defs>${b}</svg>`;
export const glassBox = (x, y, w, h, r) => `<rect x="${x}" y="${y}" width="${w}" height="${h}" rx="${r}" fill="${GLASS}" fill-opacity=".66" filter="url(#s)"/><rect x="${x + 1}" y="${y + 1}" width="${w - 2}" height="${h - 2}" rx="${r - 1}" fill="none" stroke="${PAPER}" stroke-opacity=".22" stroke-width="2"/>`;
export const line = (d, col = PAPER, fill = 'none') => `<path d="${d}" fill="${fill}" stroke="${col}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`;
export const CLOUD = (x, y, s = 1) => `M${x - 50 * s} ${y + 28 * s}a${24 * s} ${24 * s} 0 0 1 ${6 * s}-${46 * s}a${34 * s} ${34 * s} 0 0 1 ${64 * s}-${6 * s}a${24 * s} ${24 * s} 0 0 1 ${10 * s} ${52 * s}z`;
export const SUN = (cx, cy, r) => `M${cx + r} ${cy}a${r} ${r} 0 1 1-${2 * r} 0a${r} ${r} 0 1 1 ${2 * r} 0` + [...Array(8)].map((_, i) => { const a = i * Math.PI / 4, i0 = r + 12, i1 = r + 24; return `M${(cx + i0 * Math.cos(a)).toFixed(1)} ${(cy + i0 * Math.sin(a)).toFixed(1)}L${(cx + i1 * Math.cos(a)).toFixed(1)} ${(cy + i1 * Math.sin(a)).toFixed(1)}`; }).join('');
export const WICON = { sun: line(SUN(132, 226, 30), '#F2D38A'), partly: line(SUN(112, 200, 20), '#F2D38A') + line(CLOUD(146, 236, .9), PAPER, '#232427'), cloud: line(CLOUD(136, 232)),
  rain: line(CLOUD(136, 212, .9)) + line('M106 266l-8 18M136 266l-8 18M166 266l-8 18', GEARC), snow: line(CLOUD(136, 212, .9)) + line('M104 272v.1M134 284v.1M164 272v.1M119 300v.1M149 300v.1'),
  night: line('M152 194a42 42 0 1 0 22 62a34 34 0 0 1-22-62z', '#F2D38A') };
export const WEATHER = [['sun', '맑음'], ['partly', '구름 조금'], ['cloud', '흐림'], ['rain', '비'], ['snow', '눈'], ['night', '밤']];
export const DATA_STK = { data_weather: { n: '날씨', f: { icon: 'sun', temp: '12°C', label: '맑음 · 바람 약함' } }, data_course: { n: '코스', f: { dist: '10.0 km', name: '반포 → 잠수교' } }, data_bib: { n: '배번', f: { num: '1031', race: 'SEOUL 10K', color: GEARC } }, data_memo: { n: '메모', f: { text1: '오늘은 그냥', text2: '기분 좋게 뛰었다 :)', date: '' } } };
export const COURSE = 'M100 380 C 120 260, 220 300, 230 200 S 360 120, 410 150 S 420 300, 340 330';
export function dataArt(k, f) { const F = { ...DATA_STK[k === 'data_weather' || k.startsWith('data_weather') ? 'data_weather' : k]?.f, ...f };
  if (k.startsWith('data_weather')) { const ic = WICON[F.icon] ? F.icon : 'sun'; return SV(glassBox(30, 110, 452, 292, 56) + `<g transform="translate(136 236) scale(1.4) translate(-136 -236)">${WICON[ic]}</g>`); }
  if (k === 'data_course') return SV(`<rect x="30" y="40" width="452" height="432" rx="48" fill="${INK}" fill-opacity=".86" filter="url(#s)"/><path d="${COURSE}" fill="none" stroke="${RUNC}" stroke-width="12" stroke-linecap="round" stroke-linejoin="round"/><circle cx="100" cy="380" r="13" fill="${PAPER}"/><circle cx="340" cy="330" r="13" fill="${RACEC}" stroke="${INK}" stroke-width="5"/>`);
  if (k === 'data_bib') { const col = F.color || GEARC; return SV(`<g transform="rotate(-4 256 256)"><rect x="50" y="110" width="412" height="292" rx="16" fill="${CREAM}" filter="url(#s)"/><path d="M50 180V126a16 16 0 0 1 16-16h380a16 16 0 0 1 16 16v54z" fill="${col}"/>${[[78, 206], [434, 206], [78, 378], [434, 378]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="8" fill="#D9D5CA"/>`).join('')}</g>`); }
  if (k === 'data_memo') return SV(`<g transform="rotate(-3 256 256)"><rect x="70" y="96" width="372" height="330" rx="10" fill="${CREAM}" filter="url(#s)"/>${[230, 296, 362].map(y => `<path d="M104 ${y} h304" stroke="${INK}" stroke-opacity=".1" stroke-width="2"/>`).join('')}<rect x="206" y="78" width="100" height="36" fill="${RUNC}" fill-opacity=".85" transform="rotate(4 256 96)"/></g>`);
  return null; }
export const dataFields = L => ({ ...DATA_STK[L.k.startsWith('data_weather') ? 'data_weather' : L.k]?.f, ...(L.k.startsWith('data_weather_') && !(L.f && L.f.icon) ? { icon: L.k.slice(13) } : {}), ...(L.f || {}) });
export const dtext = (c, t, x, y, sz, fam, w, col, anchor = 'center', ls = 0) => { font(c, sz, w, fam); c.letterSpacing = ls + 'px'; c.fillStyle = col; c.textAlign = anchor === 'start' ? 'left' : anchor === 'end' ? 'right' : 'center'; c.textBaseline = 'alphabetic'; c.fillText(t, x, y); c.letterSpacing = '0px'; c.textAlign = 'left'; };
export function v4Sticker(c, L) { const k = L.k, data = k.startsWith('data_'), F = data ? dataFields(L) : null, svg = data ? dataArt(k, F) : k.startsWith('ph:') ? iconSVG(k, L.col || TOKENS.text) : STK_SVG[k]; if (!svg) return null;
  return { w: 512, h: 512, draw: () => { const im = imgNow(svg); if (im) c.drawImage(im, -256, -256, 512, 512); if (!data) return; c.save(); c.translate(-256, -256);
    const A = FONTS.anton.fam, M = FONTS.mono.fam, Pf = FONTS.pretendard.fam, G = FONTS.gaegu ? FONTS.gaegu.fam : Pf;
    if (k.startsWith('data_weather')) { const tt = celsius(F.temp).replace(/-?\d+\.\d+(?=°C)/, m => String(Math.round(+m))).slice(0, 5); font(c, 120, 400, A); dtext(c, tt, 342, 276, Math.min(120, Math.floor(120 * 190 / Math.max(1, c.measureText(tt).width))), A, 400, PAPER); dtext(c, String(F.label || '').slice(0, 16), 256, 366, 36, Pf, 700, 'rgba(236,235,230,.85)'); }
    else if (k === 'data_course') { dtext(c, F.dist || '', 66, 112, 40, M, 700, PAPER, 'start', 2); dtext(c, String(F.name || '').slice(0, 18), 66, 440, 32, Pf, 700, 'rgba(236,235,230,.9)', 'start'); }
    else if (k === 'data_bib') { c.translate(256, 256); c.rotate(-4 * Math.PI / 180); c.translate(-256, -256); dtext(c, String(F.race || '').slice(0, 18), 78, 156, 28, M, 700, CREAM, 'start', 4); dtext(c, String(F.num || '').slice(0, 5), 256, 340, 150, A, 400, INK); dtext(c, 'hoohaa · RUNNER', 256, 384, 20, M, 700, 'rgba(23,24,27,.45)', 'center', 4); }
    else if (k === 'data_memo') { c.translate(256, 256); c.rotate(-3 * Math.PI / 180); c.translate(-256, -256); dtext(c, String(F.text1 || '').slice(0, 14), 104, 218, 46, G, 700, INK, 'start'); dtext(c, String(F.text2 || '').slice(0, 16), 104, 284, 40, G, 700, INK, 'start'); dtext(c, F.date || ymd().slice(5), 408, 396, 34, G, 700, RACEC, 'end'); }
    c.restore(); } }; }
export function sticker(c, L, d) {
  { const v = v4Sticker(c, L); if (v) return v; }
  const col = L.col || '#ffffff', m = STORY_MAT[d.key], acc = accentOf(d), k = L.k;
  const S = (w, h, fn) => ({ w, h, draw: () => { c.save(); c.fillStyle = col; c.strokeStyle = col; c.lineCap = 'round'; c.lineJoin = 'round'; fn(); c.restore(); } });
  if (k === 'wordmark') return S(440, 120, () => { c.textAlign = 'center'; font(c, 92, 800, ARC_, 'expanded'); c.fillText('hoohaa', 0, 22); font(c, 22, 700, ARC_, 'expanded'); c.letterSpacing = '8px'; c.globalAlpha = .75; c.fillText('RUNNING TIER', 4, 56); c.letterSpacing = '0px'; });
  if (k === 'emblem') return S(260, 260, () => { const g = c.createLinearGradient(-130, -130, 130, 130); m.s.forEach((s, i) => g.addColorStop(i / (m.s.length - 1), s)); c.beginPath(); for (let i = 0; i < 6; i++) { const a = Math.PI / 3 * i - Math.PI / 2; c.lineTo(Math.cos(a) * 128, Math.sin(a) * 128); } c.closePath(); c.fillStyle = g; c.fill(); c.lineWidth = 6; c.strokeStyle = 'rgba(255,255,255,.55)'; c.stroke(); c.fillStyle = m.ink; c.textAlign = 'center'; font(c, 110, 800, ARC_, 'expanded'); c.fillText(d.word[0], 0, 30); if (d.roman) { font(c, 34, 700, ARC_); c.fillText(d.roman, 0, 82); } });
  if (k === 'runner') return S(220, 260, () => { c.lineWidth = 22; c.beginPath(); c.arc(30, -95, 24, 0, 7); c.fill(); c.beginPath(); c.moveTo(10, -60); c.lineTo(-15, 20); c.lineTo(35, 70); c.lineTo(20, 120); c.moveTo(-15, 20); c.lineTo(-60, 60); c.lineTo(-95, 55); c.moveTo(5, -45); c.lineTo(-50, -25); c.lineTo(-75, 10); c.moveTo(5, -45); c.lineTo(45, -10); c.lineTo(90, -25); c.stroke(); });
  if (k === 'shoe') return S(300, 160, () => { c.beginPath(); c.moveTo(-140, 50); c.lineTo(-140, -10); c.quadraticCurveTo(-120, -60, -70, -55); c.lineTo(-20, -20); c.quadraticCurveTo(60, -10, 120, 10); c.quadraticCurveTo(150, 30, 140, 50); c.closePath(); c.fill(); c.fillStyle = acc; c.fillRect(-140, 50, 280, 22); c.strokeStyle = '#0F1620'; c.lineWidth = 6; for (let i = 0; i < 3; i++) { c.beginPath(); c.moveTo(-70 + i * 28, -40 + i * 10); c.lineTo(-50 + i * 28, -50 + i * 10); c.stroke(); } });
  if (k === 'dist') { const ev = d.recLine.split(' ')[0]; return S(240, 240, () => { c.beginPath(); c.arc(0, 0, 116, 0, 7); c.lineWidth = 10; c.stroke(); c.textAlign = 'center'; font(c, ev.length > 3 ? 64 : 84, 800, HAN.test(ev) ? PRE_ : ARC_, 'expanded'); c.fillText(ev, 0, 26); font(c, 22, 700, ARC_, 'expanded'); c.letterSpacing = '5px'; c.fillText('FINISHER', 3, 74); c.letterSpacing = '0px'; }); }
  if (k === 'sun') return S(240, 240, () => { c.beginPath(); c.arc(0, 0, 58, 0, 7); c.fill(); c.lineWidth = 16; for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i; c.beginPath(); c.moveTo(Math.cos(a) * 84, Math.sin(a) * 84); c.lineTo(Math.cos(a) * 112, Math.sin(a) * 112); c.stroke(); } });
  if (k === 'date') { const t = ymd(); return S(360, 110, () => { rr(c, -176, -51, 352, 102, 18); c.lineWidth = 6; c.stroke(); c.textAlign = 'center'; font(c, 50, 700, ARC_, 'semi-expanded'); c.fillText(t, 0, 18); }); }
  if (k === 'flag') return S(360, 120, () => { for (let r = 0; r < 4; r++) for (let i = 0; i < 12; i++) if ((r + i) % 2 === 0) c.fillRect(-180 + i * 30, -60 + r * 30, 30, 30); });
  if (k === 'sparkle') return S(220, 220, () => { c.beginPath(); for (let i = 0; i < 8; i++) { const a = Math.PI / 4 * i - Math.PI / 2, r = i % 2 ? 26 : 108; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); if (L.fill === false) { c.lineWidth = 10; c.stroke(); } else c.fill(); });
  if (k === 'heart') return S(220, 200, () => { c.beginPath(); c.moveTo(0, 80); c.bezierCurveTo(-140, -10, -80, -110, 0, -45); c.bezierCurveTo(80, -110, 140, -10, 0, 80); c.fill(); });
  if (k === 'bolt') return S(160, 260, () => { c.beginPath(); c.moveTo(30, -130); c.lineTo(-70, 20); c.lineTo(-5, 20); c.lineTo(-30, 130); c.lineTo(70, -25); c.lineTo(5, -25); c.closePath(); c.fill(); });
  if (k === 'star') return S(240, 240, () => { c.beginPath(); for (let i = 0; i < 10; i++) { const a = Math.PI / 5 * i - Math.PI / 2, r = i % 2 ? 50 : 118; c.lineTo(Math.cos(a) * r, Math.sin(a) * r); } c.closePath(); c.fill(); });
  if (k === 'rect') return S(400, 260, () => { rr(c, -200, -130, 400, 260, 28); c.fill(); });
  if (k === 'circle') return S(280, 280, () => { c.beginPath(); c.arc(0, 0, 140, 0, 7); c.fill(); });
  if (k === 'line') return S(500, 12, () => { c.fillRect(-250, -6, 500, 12); });
  return S(10, 10, () => { });
}
