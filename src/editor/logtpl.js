// 오늘 기록 → 3:4 썸네일 템플릿 6종 (Figma 5WrYjnAWMYdtlhPXvRRYal · page 12-2).
// Converted by hand from the design into the editor's layer JSON: every element is a normal, editable layer
// (text / shape / sticker), nothing is flattened. Positions are ratios on the 1080x1440 frame
// (rx = ink-left x / 1080, ry = baseline y / 1440 for text, top-left for shapes/icons).

export const LOG_W = 1080, LOG_H = 1440;
export const TOKENS = { bg: '#17181B', text: '#ECEBE6', 'accent-run': '#B5C96A', 'accent-race': '#E08A62', 'accent-gear': '#7FA8C9', 'accent-diet': '#6FB894' };
export const LOG_TPLS = [['run-photo', '러닝 · 사진'], ['run-solid', '러닝 · 단색'], ['race-dday', '대회 D-day'], ['race-result', '대회 결과'], ['diet', '식단']];
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
const M = 72, COLS = [72, 392, 712];
const BL = { hero: 1054.8 /* box y888–1088, lh 200 */, title: 1159.5 /* y1112, lh 56 */, label: 1243.3 /* y1216, lh 32 */, value: 1306.7 /* y1256, lh 64 */ };
const LINE = { x: 72, y: 1192, w: 80, h: 4 };
const SCRIM = { 'run-photo': [.45, .75], 'race-dday': [.6, .85], diet: [.45, .75] };
const ACC = { run: 'accent-run', race: 'accent-race', diet: 'accent-diet' };
const kindOf = t => t.split('-')[0];

let seq = 0;
const lid = () => 'G' + Date.now().toString(36) + (seq++);
const base = p => ({ id: lid(), x: 540, y: 720, s: 1, r: 0, o: 1, af: false, lt: 1, ...p });
const T = (sid, t, o) => base({ type: 'text', sid, t, col: TOKENS.text, al: 'left', ...o, rx: o.x / LOG_W, ry: o.bl / LOG_H, x: undefined, bl: undefined });
const num = (sid, bind, x, unit) => T(sid, '', { bind, font: 'archivo', w: 600, size: 56, x, bl: BL.value, unit, ug: unit && unit[0] === '/' ? 2 : 8 });
const krVal = (sid, bind, x) => T(sid, '', { bind, font: 'notokr', w: 500, size: 56, x, bl: BL.value });
const label = (sid, t, x) => T(sid, t, { k: 'label', font: 'notokr', w: 400, size: 26, ga: .6, x, bl: BL.label });
const hero = (bind) => T('hero', '', { bind, font: 'archivo', w: 700, size: 200, ls: -4, x: M, bl: BL.hero });
const titleKr = (bind) => T('title', '', { bind, font: 'notokr', w: 700, size: 44, x: M, bl: BL.title });
const titleNum = (bind) => T('title', '', { bind, font: 'archivo', w: 600, size: 44, x: M, bl: BL.title });
const title2 = (bind, font) => T('title2', '', { bind, font, w: font === 'archivo' ? 500 : 400, size: 44, ga: .6, x: M, bl: BL.title, flow: 'title', gap: 16 });

const SPEC = {
  'run-photo': { icon: 'timer', photo: 1, els: () => [titleNum('dayN'), title2('date', 'archivo'), label('l1', '거리', COLS[0]), num('v1', 'distance', COLS[0], 'km'), label('l2', '페이스', COLS[1]), num('v2', 'pace', COLS[1], '/km'), label('l3', '시간', COLS[2]), num('v3', 'time', COLS[2])] },
  'run-solid': { icon: 'timer', els: () => [hero('dayN'), titleNum('date'), label('l1', '거리', COLS[0]), num('v1', 'distance', COLS[0], 'km'), label('l2', '페이스', COLS[1]), num('v2', 'pace', COLS[1], '/km'), label('l3', '시간', COLS[2]), num('v3', 'time', COLS[2])] },
  'race-dday': { icon: 'medal', photo: 1, els: () => [hero('dday'), titleKr('raceName'), label('l1', '날짜', COLS[0]), { ...num('v1', 'date', COLS[0]), bf: 'md' }, label('l2', '거리', COLS[1]), num('v2', 'distance', COLS[1], 'km'), label('l3', '목표 기록', COLS[2]), num('v3', 'time', COLS[2])] },
  'race-result': { icon: 'medal', els: () => [hero('result'), titleKr('raceName'), label('l1', '날짜', COLS[0]), { ...num('v1', 'date', COLS[0]), bf: 'md' }, label('l2', '거리', COLS[1]), num('v2', 'distance', COLS[1], 'km'), label('l3', '페이스', COLS[2]), num('v3', 'pace', COLS[2], '/km')] },
  diet: { icon: 'bowl-food', photo: 1, els: () => [titleKr('meal'), title2('menu', 'notokr'), label('l1', '시간', COLS[0]), num('v1', 'time', COLS[0]), label('l2', '이후 러닝', COLS[1]), num('v2', 'distance', COLS[1], 'km'), label('l3', '메모', COLS[2]), krVal('v3', 'note', COLS[2])] },
};
export const tplHasPhotoSlot = id => !!(SPEC[id] && SPEC[id].photo);
export const bindKeysOf = id => SPEC[id] ? SPEC[id].els().filter(l => l.bind).map(l => l.bind) : [];

// value for one bound layer ('–' keeps an empty field visible and editable)
export const bindText = (L, V) => { const v = L.bf === 'md' && L.bind === 'date' ? V.dateMD : V[L.bind]; return v == null || v === '' ? '–' : String(v); };
// fill every keyed element; hand-edited (unbound) elements are left alone
export function fillBindings(doc, V) { for (const L of doc.layers) if (L.bind) L.t = bindText(L, V); doc.vals = V; return doc; }

// doc: same shape as the editor's other docs (bg + ordered layers), plus log/tok metadata
export function buildLogDoc(id, V, o = {}) {
  const S = SPEC[id] || SPEC['run-solid'], kind = kindOf(id), photo = !!o.pid && (!!S.photo || !!o.forcePhoto); // solid designs start solid; the 배경 switch can still turn the photo on
  const tok = { bg: TOKENS.bg, text: TOKENS.text, acc: o.acc || TOKENS[ACC[kind]] };
  const layers = [];
  const [sh, sa] = SCRIM[id] || [.45, .75];
  // scrim exists on every template so the background switch (사진 ↔ 단색) can flip it; hidden on solid
  layers.push(base({ type: 'shape', k: 'box', sid: 'scrim', nh: 1, rx: 0, ry: 1 - sh, rw: 1, rh: sh, w: LOG_W, h: Math.round(LOG_H * sh), fill: { t: 'lin', a: 180, st: [[0, 'rgba(23,24,27,0)'], [1, `rgba(23,24,27,${sa})`]] }, hidden: !photo }));
  layers.push(base({ type: 'sticker', k: 'ph:' + S.icon, sid: 'icon', col: TOKENS.text, s: 56 / 512, rx: M / LOG_W, ry: M / LOG_H }));
  layers.push(base({ type: 'shape', k: 'box', sid: 'accent', rx: LINE.x / LOG_W, ry: LINE.y / LOG_H, w: LINE.w, h: LINE.h, fill: '@acc' }));
  for (const L of S.els()) layers.push(L);
  const doc = { tpl: 'log:' + id, log: { id: o.logId || null, tpl: id, type: o.type || kind }, tok, fmt: o.fmt || 'thumb', race: '',
    bg: photo ? { type: 'photo', pid: o.pid, pz: 1, filter: 'none' } : { type: 'solid', c1: tok.bg }, layers };
  return fillBindings(doc, V || {});
}
// background switch: photo ↔ solid (the scrim follows)
export function setLogBg(doc, pid) {
  doc.bg = pid ? { type: 'photo', pid, pz: 1, filter: 'none' } : { type: 'solid', c1: (doc.tok && doc.tok.bg) || TOKENS.bg };
  for (const L of doc.layers) if (L.sid === 'scrim') L.hidden = !pid; return doc;
}
