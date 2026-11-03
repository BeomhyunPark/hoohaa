// Pure helpers and constants for the share-image editor, moved out of editor.js unchanged.
// No editor state, no DOM at import time. FONTS needs LAZY_FONTS, so this imports assets.js.
import { LAZY_FONTS } from './assets.js';

// 9:16 story PNG (1080x1920) rendered on canvas. Embedded fonts: "TC Archivo", "TC Pretendard" (subset).
export const W = 1080, H = 1920;
export const SYS_KO = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",sans-serif';
export const PRE = `"TC Pretendard","LZ pretendardk",${SYS_KO}`;
// Hangul covered by the embedded subsets; anything else lazy-loads the full (KS X 1001) font so labels/user text never fall back
export const SUB_PRE = new Set('간고골그기까나남내넘다단달대동드랄래랜록론린마말메몬버분브상성스시실아언에여예완요위음이저적정주즈지챌초최축터티페표풀프플하해'), SUB_BH = new Set('골그내넘다드랄래랜론린마메몬버브상스실아언에위이저즈챌터티플');
export function needFull(t, bh) { for (const ch of t) if (ch >= "\uac00" && ch <= "\ud7a3" && !(bh ? SUB_BH : SUB_PRE).has(ch)) return true; return false; }
export const ARC = '"TC Archivo",sans-serif';

export function alpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }

export const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
export function font(c, size, weight, fam, stretch = 'normal') { c.font = `${weight} ${size}px ${fam}`; try { c.fontStretch = stretch; } catch { } }
export function fitText(c, txt, max) { while (c.measureText(txt).width > max && txt.length > 1) txt = txt.slice(0, -2) + '…'; return txt; }

// ---------- font registry: 6 embedded + Pretendard, rest lazy-loaded on pick ----------
export const rng = s => { const [a, b] = String(s).split(' ').map(Number); if (!b) return [a]; const o = []; for (let w = a; w <= b; w += 100) o.push(w); return o; };
export const FONTS = {
  archivo: { n: 'Archivo', cat: 'sporty', fam: ARC, ws: [300, 400, 500, 600, 700, 800, 900], emb: 1, lic: 'OFL-1.1' },
  bebas: { n: 'Bebas Neue', cat: 'sporty', fam: `"OV Bebas",${PRE}`, ws: [400], sz: 1.2, emb: 1, lic: 'OFL-1.1' },
  anton: { n: 'Anton', cat: 'sporty', fam: `"OV Anton",${PRE}`, ws: [400], emb: 1, lic: 'OFL-1.1' },
  playfair: { n: 'Playfair Display', cat: 'classic', fam: `"OV Playfair",serif`, ws: [800], emb: 1, lic: 'OFL-1.1' },
  mono: { n: 'JetBrains Mono', cat: 'mono', fam: `"OV Mono",monospace`, ws: [700], sz: .88, emb: 1, lic: 'OFL-1.1' },
  blackhan: { n: '검은고딕 (Black Han Sans)', cat: 'ko', fam: `"OV BlackHan","LZ blackhank",${PRE}`, ws: [400], emb: 1, ko: 1, lic: 'OFL-1.1' },
  pretendard: { n: 'Pretendard', cat: 'ko', fam: PRE, ws: [500, 600, 700], emb: 1, ko: 1, lic: 'OFL-1.1' },
  notokr: { n: 'Noto Sans KR', cat: 'ko', fam: `"LZ notokr",${PRE}`, ws: [400, 500, 700], files: [['notokr-400.woff2', '400'], ['notokr-500.woff2', '500'], ['notokr-700.woff2', '700']], ko: 1, lic: 'OFL-1.1' },
};
for (const f of LAZY_FONTS) FONTS[f.k] = { n: f.n, cat: f.cat, fam: `"LZ ${f.k}",${f.ko ? '' : PRE + ','}${SYS_KO}`.replace(',,', ','), ws: [...new Set(f.files.flatMap(x => rng(x[1])))], files: f.files, ko: f.ko, lic: f.lic, pw: f.pw };
export const PICKABLE = k => FONTS[k] && FONTS[k].cat !== 'hidden';
export const FONT_CATS = [['sporty', '스포티'], ['classic', '클래식'], ['mono', '모노'], ['ko', '한글'], ['hand', '손글씨']];
for (const k of ['marker', 'gaegu', 'gamja', 'himelody', 'poorstory', 'nanumpen', 'dokdo', 'eastsea', 'kirang']) if (FONTS[k]) FONTS[k].cat = 'hand';

export const previewFam = k => FONTS[k].emb ? FONTS[k].fam : `"PV ${k}","LZ ${k}",${PRE}`;
export const nearW = (k, w) => { const ws = FONTS[k].ws; return ws.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a, ws[0]); };

export const W_ = W, ARC_ = ARC, PRE_ = PRE, SYS_KO_ = SYS_KO;

export function lum(hex) { const n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return 1; const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(n >> 16) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255); }

export const ymd = (now = new Date()) => `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;

// ---- stat ("기록 블록") values come only from the calculation result: never editable ----
export const STATS = { rec: ['기록', 'RECORD'], pace: ['페이스', 'PACE'], tier: ['티어', 'TIER'], top: ['상위 %', 'RANK'], vdot: ['VDOT', 'VDOT'], next: ['다음 티어까지', 'NEXT'], date: ['날짜', 'DATE'], race: ['대회명', 'RACE'], event: ['종목', 'EVENT'], combo: ['기록 문구', 'TEXT'] };
export const statLabel = (d, k) => k === 'rec' ? d.recLine.split(' ')[0] + ' 기록' : STATS[k][0];
export const statValue = (d, doc, k, L) => L && L.tx ? fillTok(L.tx, d, doc) : ({ rec: d.time, pace: d.pace, tier: d.word + (d.roman ? ' ' + d.roman : ''), top: d.topLabel, vdot: d.vdot, next: d.nextLine, date: ymd(), race: (doc.race || '').trim() || '대회명을 입력해 주세요', event: d.recLine.split(' ')[0] })[k];
// result tokens used by the v4 templates (values always come from the calculation; race is the only user-typed one)
export const paceQ = p => { const m = /^(\d+):(\d\d)/.exec(p || ''); return m ? `${m[1]}'${m[2]}"` : (p || '').replace('/km', ''); };
export const pctOf = d => { const m = /([\d.]+)%/.exec(d.topLabel || ''); return m ? m[1] : ''; };
export function fillTok(tx, d, doc) { const ev = d.recLine.split(' ')[0], race = (doc.race || '').trim(), dt = ymd();
  const V = { rec: d.time, pace: paceQ(d.pace), tier: d.word + (d.roman ? ' ' + d.roman : ''), roman: d.roman || '', tierko: d.tierKo || '', vdot: d.vdot, date: dt, mmdd: dt.slice(5), ev, race: race || ev, pct: pctOf(d) };
  let t = tx.replace(/\{(\w+)\}/g, (_, k) => V[k] ?? ''); if (/이내/.test(d.topLabel) && /\{pct\}%/.test(tx)) t = t.replace(V.pct + '%', V.pct + '% 이내');
  if (!race && /\{race\}/.test(tx) && /\{ev\}/.test(tx)) t = t.replace(ev + ' · ', '').replace(ev + ' ' + ev, ev); return t; }
export const STAT_SIZE0 = { combo: 48, rec: 120, pace: 96, tier: 92, top: 104, vdot: 72, next: 40, date: 40, race: 56, event: 64 };
export const STAT_SIZE = STAT_SIZE0;
export const TOP_MIN_PX = 64; // 상위 % is always shown big
export const STICKERS = [['wordmark', 'hoohaa 워드마크'], ['emblem', '티어 엠블럼'], ['runner', '러너'], ['shoe', '러닝화'], ['dist', '거리 배지'], ['sun', '맑음'], ['date', '날짜 도장'], ['flag', '피니시'], ['sparkle', '반짝'], ['heart', '하트'], ['bolt', '번개'], ['star', '별'], ['rect', '사각형'], ['circle', '원'], ['line', '선']];
export const FILTERS = [['none', '원본'], ['vivid', '선명하게'], ['golden', '골든아워'], ['warm', '따뜻하게'], ['morning', '새벽공기'], ['cool', '차갑게'], ['teal', '틸 & 오렌지'], ['film', '필름'], ['fade', '빈티지'], ['bw', '흑백'], ['noir', '누아르']];
// export formats: 9:16 story (default), 4:5 feed, 1:1, 3:4 thumbnail (default for 오늘 기록 cards)
export const FORMATS = [['story', '스토리 9:16', 1920], ['feed', '피드 4:5', 1350], ['square', '정사각 1:1', 1080], ['thumb', '썸네일 3:4', 1440]];
export const fmtH = f => (FORMATS.find(x => x[0] === f) || FORMATS[0])[2];
export const MASKS = [['rect', '사각'], ['round', '둥근'], ['circle', '원형'], ['polaroid', '폴라로이드']];

export const famOf = (k, ko) => k && FONTS[k] ? FONTS[k].fam : ko ? PRE_ : ARC_;
export const wOf = (k, w) => { if (!k || !FONTS[k]) return w; const ws = FONTS[k].ws; return ws.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a, ws[0]); };
export const HAN = /[\uac00-\ud7a3]/;
export const contrast = c => lum(c) > .45 ? '#111111' : '#ffffff';

export const clone = o => JSON.parse(JSON.stringify(o));

export const hex2hsv = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: h * 60, s: mx ? d / mx : 0, v: mx }; };
export const hsv2hex = ({ h, s, v }) => { const f = k => { const x = (k + h / 60) % 6; return v - v * s * Math.max(0, Math.min(x, 4 - x, 1)); };
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
