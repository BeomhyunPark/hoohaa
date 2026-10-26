// 오늘 기록 → 3:4 썸네일 템플릿 8종 (Figma 5WrYjnAWMYdtlhPXvRRYal · page 31-2, v3 vertical).
// Converted by hand from the design into the editor's layer JSON: every element is a normal, editable layer
// (text / shape / sticker), nothing is flattened. Positions are ratios on the 1080x1440 frame
// (rx = ink-left x / 1080, ry = baseline y / 1440 for text, top-left for shapes/icons).

export const LOG_W = 1080, LOG_H = 1440;
export const TOKENS = { bg: '#17181B', text: '#ECEBE6', 'accent-run': '#B5C96A', 'accent-race': '#E08A62', 'accent-gear': '#7FA8C9', 'accent-diet': '#6FB894' };
export const LOG_TPLS = [['va-run-photo', '스택 · 사진'], ['va-run-solid', '스택 · 단색'], ['va-race-result', '스택 · 대회'], ['vc-run-photo', '페이드 · 사진'], ['vc-run-solid', '페이드 · 단색'], ['vc-race-result', '페이드 · 대회'], ['vc-diet', '페이드 · 식단'], ['vd-run-solid', '레일 · 단색']];
export const BIND_KEYS = ['dayN', 'date', 'distance', 'time', 'pace', 'weather', 'note', 'raceName', 'dday', 'result', 'meal', 'menu'];

// Phosphor Icons (MIT) · duotone · timer, medal, sneaker-move, bowl-food. Colour is applied at render time.
const PH = {
  timer: '<path d="M216,136a88,88,0,1,1-88-88A88,88,0,0,1,216,136Z" opacity="0.2"/><path d="M128,40a96,96,0,1,0,96,96A96.11,96.11,0,0,0,128,40Zm0,176a80,80,0,1,1,80-80A80.09,80.09,0,0,1,128,216ZM173.66,90.34a8,8,0,0,1,0,11.32l-40,40a8,8,0,0,1-11.32-11.32l40-40A8,8,0,0,1,173.66,90.34ZM96,16a8,8,0,0,1,8-8h48a8,8,0,0,1,0,16H104A8,8,0,0,1,96,16Z"/>',
  medal: '<path d="M176,96a48,48,0,1,1-48-48A48,48,0,0,1,176,96Z" opacity="0.2"/><path d="M216,96A88,88,0,1,0,72,163.83V240a8,8,0,0,0,11.58,7.16L128,225l44.43,22.21A8.07,8.07,0,0,0,176,248a8,8,0,0,0,8-8V163.83A87.85,87.85,0,0,0,216,96ZM56,96a72,72,0,1,1,72,72A72.08,72.08,0,0,1,56,96ZM168,227.06l-36.43-18.21a8,8,0,0,0-7.16,0L88,227.06V174.37a87.89,87.89,0,0,0,80,0ZM128,152A56,56,0,1,0,72,96,56.06,56.06,0,0,0,128,152Zm0-96A40,40,0,1,1,88,96,40,40,0,0,1,128,56Z"/>',
  'sneaker-move': '<path d="M232,180.94V200a8,8,0,0,1-8,8H148.06L34.34,94.28A8,8,0,0,1,35,82.41L112,24a56,56,0,0,0,56,56v29.39a56,56,0,0,0,31,50.09l28.62,14.31A8,8,0,0,1,232,180.94Z" opacity="0.2"/><path d="M231.16,166.63l-28.63-14.31A47.74,47.74,0,0,1,176,109.39V80a8,8,0,0,0-8-8,48.05,48.05,0,0,1-48-48,8,8,0,0,0-12.83-6.37L30.13,76l-.2.16a16,16,0,0,0-1.24,23.75L142.4,213.66a8,8,0,0,0,5.66,2.34H224a16,16,0,0,0,16-16V180.94A15.92,15.92,0,0,0,231.16,166.63ZM224,200H151.37L40,88.63l12.87-9.76,38.79,38.79A8,8,0,0,0,103,106.34L65.74,69.11l40-30.31A64.15,64.15,0,0,0,160,87.5v21.89a63.65,63.65,0,0,0,35.38,57.24L224,180.94ZM70.8,184H32a8,8,0,0,1,0-16H70.8a8,8,0,1,1,0,16Zm40,24a8,8,0,0,1-8,8H48a8,8,0,0,1,0-16h54.8A8,8,0,0,1,110.8,208Z"/>',
  'bowl-food': '<path d="M224,112a96,96,0,0,1-56,87.3V208a8,8,0,0,1-8,8H96a8,8,0,0,1-8-8v-8.7A96,96,0,0,1,32,112Z" opacity="0.2"/><path d="M224,104h-8.37a88,88,0,0,0-175.26,0H32a8,8,0,0,0-8,8,104.35,104.35,0,0,0,56,92.28V208a16,16,0,0,0,16,16h64a16,16,0,0,0,16-16v-3.72A104.35,104.35,0,0,0,232,112,8,8,0,0,0,224,104ZM173.48,56.23q2.75,2.25,5.27,4.75a87.92,87.92,0,0,0-49.15,43H100.1A72.26,72.26,0,0,1,168,56C169.83,56,171.66,56.09,173.48,56.23Zm15.91,18.2A71.45,71.45,0,0,1,199.54,104H148.12A71.84,71.84,0,0,1,189.39,74.43ZM128,40a71.87,71.87,0,0,1,19,2.57A88.36,88.36,0,0,0,83.33,104H56.46A72.08,72.08,0,0,1,128,40Zm36.66,152A8,8,0,0,0,160,199.3V208H96v-8.7A8,8,0,0,0,91.34,192a88.29,88.29,0,0,1-51-72H215.63A88.29,88.29,0,0,1,164.66,192Z"/>',
};
export const ICON_NAMES = { 'ph:timer': '타이머', 'ph:medal': '메달', 'ph:sneaker-move': '러닝화', 'ph:bowl-food': '식사' };
export function iconSVG(k, col = TOKENS.text) { const b = PH[String(k).replace(/^ph:/, '')]; return b ? `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256" width="512" height="512" fill="${col}">${b}</svg>` : null; }

// ---- design metrics (px on 1080x1440). Baselines follow Figma's fixed line boxes:
// baseline = top + (lineHeight − (asc+desc)·size)/2 + asc·size  (Archivo 878/210, Noto Sans KR 1160/288, upm 1000)
// Figma 5WrYjnAWMYdtlhPXvRRYal · page 31-2 "Post Templates v3 — vertical": V-A stack · V-C soft-fade panel · V-D editorial rail.
const M = 72, BOTTOM = 1350;
const blA = (top, size, lh) => top + (lh - 1.088 * size) / 2 + .878 * size;
const blK = (top, size, lh) => top + (lh - 1.448 * size) / 2 + 1.16 * size;
const ACC = { run: 'accent-run', race: 'accent-race', diet: 'accent-diet' };
// legacy ids (saved cards / profiles) → current recipes; race-dday was removed from the design
export const TPL_ALIAS = { 'run-photo': 'va-run-photo', 'run-solid': 'va-run-solid', 'race-result': 'va-race-result', 'race-dday': 'va-race-result', diet: 'vc-diet' };
export const normTpl = id => TPL_ALIAS[id] || id;
export const kindOf = t => { t = normTpl(String(t || '')); return /race/.test(t) ? 'race' : /diet/.test(t) ? 'diet' : 'run'; };

let seq = 0;
const lid = () => 'G' + Date.now().toString(36) + (seq++);
const base = p => ({ id: lid(), x: 540, y: 720, s: 1, r: 0, o: 1, af: false, lt: 1, ...p });
const T = (sid, t, o) => base({ type: 'text', sid, t, col: TOKENS.text, al: 'left', ...o, rx: o.x / LOG_W, ry: o.bl / LOG_H, x: undefined, bl: undefined });
const box = (sid, x, y, w, h, fill) => base({ type: 'shape', k: 'box', sid, rx: x / LOG_W, ry: y / LOG_H, w, h, fill });
const ug = u => u && u[0] === '/' ? 2 : 8;
// text atoms (top = Figma box top)
const dateT = (top, bind = 'date') => T('date', '', { bind, font: 'archivo', w: 500, size: 40, ga: .68, x: M, bl: blA(top, 40, 48) });
const heroT = (bind, top, size, unit, x = M) => T('hero', '', { bind, font: 'archivo', w: 700, size, ls: -4, x, bl: blA(top, size, Math.round(size * 1.087)), unit, ug: ug(unit) });
const titleT = (bind, top, kr, sid = 'title') => T(sid, '', { bind, font: kr ? 'notokr' : 'archivo', w: kr ? 700 : 600, size: 56, x: M, bl: kr ? blK(top, 56, 64) : blA(top, 56, 64) });
const subT = (bind, top) => T('title2', '', { bind, font: 'notokr', w: 400, size: 44, ga: .68, x: M, bl: blK(top, 44, 56) });
const lbl = (sid, t, x, top) => T(sid, t, { k: 'label', font: 'notokr', w: 400, size: 40, ga: .68, x, bl: blK(top, 40, 56) });
const val = (sid, bind, x, top, size, unit, kr) => kr ? T(sid, '', { bind, font: 'notokr', w: 500, size: size * .8, x, bl: blK(top, size * .8, size * 1.18) })
  : T(sid, '', { bind, font: 'archivo', w: 600, size, x, bl: blA(top, size, Math.round(size * 1.18)), unit, ug: ug(unit) });
// stat = [label, bind, unit?, kr?]
const STAT_H = 56 + 6 + 104, STAT_GAP = 32;
const vstats = (stats, top, x = M) => stats.flatMap(([l, b, u, kr], i) => { const y = top + i * (STAT_H + STAT_GAP); return [lbl('l' + (i + 1), l, x, y), val('v' + (i + 1), b, x, y + 62, 88, u, kr)]; });
const ROW_H = 96;
const rows = (stats, top) => stats.flatMap(([l, b, u, kr], i) => { const y = top + i * ROW_H; return [lbl('l' + (i + 1), l, M, y + 16), val('v' + (i + 1), b, 360, y, 64, u, kr)]; });
const RUN3 = [['거리', 'distance', 'km'], ['페이스', 'pace', '/km'], ['시간', 'time']];
const RACE2 = [['거리', 'distance', 'km'], ['페이스', 'pace', '/km']];

// V-A: bottom-weighted stack — date · hero · title · accent · vertical stats, laid out upward from BOTTOM
function stackA({ hero, size, unit, title, kr, stats }) {
  const sTop = BOTTOM - (stats.length * STAT_H + (stats.length - 1) * STAT_GAP), aTop = sTop - 32, tTop = aTop - 34 - 64, lh = Math.round(size * 1.087), hTop = tTop - 28 - lh, dTop = hTop - 28 - 48;
  return { line: [M, aTop, 96, 4], els: [dateT(dTop), heroT(hero, hTop, size, unit), titleT(title, tTop, kr), ...vstats(stats, sTop)] };
}
// V-C: soft-fade panel from y≈620; content stack from y900 (optional hero in the upper area)
function panelC({ hero, size = 240, unit, head, headKr, sub, stats }) {
  let y = 900; const els = [];
  if (hero) els.push(heroT(hero, 503, size, unit));
  if (head === 'date') { els.push(dateT(y)); y += 48 + 16; }
  if (sub && head !== 'date') { els.push(titleT(head, y, headKr)); y += 64 + 12; els.push(subT(sub, y)); y += 56; }
  else { els.push(titleT(sub || head, y, headKr)); y += 64; }
  const aTop = y + 24; return { line: [M, aTop, 96, 4], scrim: [620, 820, .94], els: [...els, ...rows(stats, aTop + 28)] };
}
// V-D: editorial rail — left rail, divider, right key metric, bottom giant hero
function railD() {
  const els = [dateT(168), titleT('dayN', 232, false), ...vstats(RACE2, 352),
    box('divider', 632, 72, 2, 680, 'rgba(236,235,230,.24)'),
    lbl('kl', '시간', 672, 72), T('key', '', { bind: 'time', font: 'archivo', w: 600, size: 120, x: 672, bl: blA(136, 120, 131) }),
    heroT('distance', 1100, 240, 'km')];
  return { line: [M, 320, 96, 4], els };
}

const SPEC = {
  'va-run-photo': { icon: 'timer', photo: 1, scrim: [1440 * .55, 1440 * .45, .8], ...stackA({ hero: 'distance', size: 168, unit: 'km', title: 'dayN', stats: RUN3 }) },
  'va-run-solid': { icon: 'timer', ...stackA({ hero: 'distance', size: 220, unit: 'km', title: 'dayN', stats: RUN3 }) },
  'va-race-result': { icon: 'medal', ...stackA({ hero: 'result', size: 200, title: 'raceName', kr: 1, stats: RACE2 }) },
  'vc-run-photo': { icon: 'timer', photo: 1, ...panelC({ head: 'date', sub: 'dayN', stats: RUN3 }) },
  'vc-run-solid': { icon: 'timer', ...panelC({ hero: 'distance', unit: 'km', head: 'date', sub: 'dayN', stats: RUN3 }) },
  'vc-race-result': { icon: 'medal', ...panelC({ hero: 'result', size: 200, head: 'date', sub: 'raceName', headKr: 1, stats: RACE2 }) },
  'vc-diet': { icon: 'bowl-food', photo: 1, ...panelC({ head: 'meal', headKr: 1, sub: 'menu', stats: [['시간', 'time'], ['메모', 'note', null, 1]] }) },
  'vd-run-solid': { icon: 'timer', ...railD() },
};
const specOf = id => SPEC[normTpl(id)];
export const tplHasPhotoSlot = id => !!(specOf(id) && specOf(id).photo);
export const bindKeysOf = id => specOf(id) ? specOf(id).els.filter(l => l.bind).map(l => l.bind) : [];

// value for one bound layer ('–' keeps an empty field visible and editable)
export const bindText = (L, V) => { const v = L.bf === 'md' && L.bind === 'date' ? V.dateMD : V[L.bind]; return v == null || v === '' ? '–' : String(v); };
// fill every keyed element; hand-edited (unbound) elements are left alone
export function fillBindings(doc, V) { for (const L of doc.layers) if (L.bind) L.t = bindText(L, V); doc.vals = V; return doc; }

// doc: same shape as the editor's other docs (bg + ordered layers), plus log/tok metadata
export function buildLogDoc(id, V, o = {}) {
  id = normTpl(id); const S = SPEC[id] || SPEC['va-run-solid'], kind = kindOf(id), photo = !!o.pid && (!!S.photo || !!o.forcePhoto); // solid designs start solid; the 배경 switch can still turn the photo on
  const tok = { bg: TOKENS.bg, text: TOKENS.text, acc: o.acc || TOKENS[ACC[kind]] };
  const layers = [], src = S.els, [sy, sh, sa] = S.scrim || [1440 * .55, 1440 * .45, .75], soft = sy === 620;
  // scrim (V-C: the soft-fade panel) exists on every template so the background switch (사진 ↔ 단색) can flip it; hidden on solid
  layers.push(base({ type: 'shape', k: 'box', sid: 'scrim', nh: 1, rx: 0, ry: sy / LOG_H, rw: 1, rh: sh / LOG_H, w: LOG_W, h: Math.round(sh), fill: { t: 'lin', a: 180, st: soft ? [[0, 'rgba(23,24,27,0)'], [.34, `rgba(23,24,27,${sa * .8})`], [1, `rgba(23,24,27,${sa})`]] : [[0, 'rgba(23,24,27,0)'], [1, `rgba(23,24,27,${sa})`]] }, hidden: !photo }));
  layers.push(base({ type: 'sticker', k: 'ph:' + S.icon, sid: 'icon', col: '@acc', s: 64 / 512, rx: M / LOG_W, ry: M / LOG_H }));
  const [lx, ly, lw, lh] = S.line; layers.push(box('accent', lx, ly, lw, lh, '@acc'));
  for (const L of src) layers.push({ ...L, id: lid() });
  const doc = { tpl: 'log:' + id, log: { id: o.logId || null, tpl: id, type: o.type || kind }, tok, fmt: o.fmt || 'thumb', race: '',
    bg: photo ? { type: 'photo', pid: o.pid, pz: 1, filter: 'none' } : { type: 'solid', c1: tok.bg }, layers };
  return fillBindings(doc, V || {});
}
// background switch: photo ↔ solid (the scrim follows)
export function setLogBg(doc, pid) {
  doc.bg = pid ? { type: 'photo', pid, pz: 1, filter: 'none' } : { type: 'solid', c1: (doc.tok && doc.tok.bg) || TOKENS.bg };
  for (const L of doc.layers) if (L.sid === 'scrim') L.hidden = !pid; return doc;
}
