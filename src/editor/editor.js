import { LS, idb } from '../storage/device.js';
import { fetchWeather, searchPlace, wxHere, isoDay } from '../net/weather.js';

export async function mountEditor(env) {
  const { $, esc, state, EVN } = env;
  const assets = await import('./assets.js');
  const LAZY_FONTS = assets.LAZY_FONTS;
  const TPL_NAMES = assets.TPL_NAMES;
  const TPL_SPEC = assets.TPL_SPEC;
  const STK_NAMES = assets.STK_NAMES;
  const STK_SVG = assets.STK_SVG;
  const TK = {"app": {"bg": "#0F1620", "surface": "#172130", "surface_raised": "#1F2B3B", "text_primary": "#F4F6F8", "text_secondary": "#B8C2CF", "text_tertiary": "#8A97A8", "border": "#2A3748", "border_strong": "#56657A", "accent": "#3DC8F5", "accent_hover": "#6ED6F8", "on_accent": "#0F1620", "success": "#3DD68C", "warning": "#FFB547", "danger": "#FF6B6B", "info": "#5AB8FF", "focus_ring": "#7CC4FF", "share_card_bg": ["#0F1620", "#172338"], "share_card_frame": "#2A3748"}, "tier": {"iron": {"base": "#988C83", "gradient": ["#A49A92", "#8A7F77"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#E9ECEF", "dark": "#242C38"}, "tint_text": {"light": "#5C6C84", "dark": "#9B8F87"}, "divisions": {"III": "#8C8179", "II": "#988C83", "I": "#A2988F"}, "glow": {"color": "#988C83", "blur_px": 0, "alpha": 0}, "text": "#9B8F87", "card": {"band": "plain", "ink": "#0F0F10", "ink_min_ratio": 4.51, "stops": ["#A2988F", "#988C83", "#837972"], "background": "linear-gradient(118deg, #A2988F 0%, #988C83 55%, #837972 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px)", "border": "1px solid rgba(255,255,255,.16)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#988C83", "glyph": ["circle"]}}, "bronze": {"base": "#B98660", "gradient": ["#C29675", "#A87A57"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#F7EDE6", "dark": "#272B35"}, "tint_text": {"light": "#905C38", "dark": "#B98660"}, "divisions": {"III": "#AA7B58", "II": "#B98660", "I": "#C09270"}, "glow": {"color": "#B98660", "blur_px": 0, "alpha": 0}, "text": "#B98660", "card": {"band": "plain", "ink": "#161110", "ink_min_ratio": 4.56, "stops": ["#C09270", "#B98660", "#A07454"], "background": "linear-gradient(118deg, #C09270 0%, #B98660 55%, #A07454 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px)", "border": "1px solid rgba(255,255,255,.16)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#B98660", "glyph": ["p", 3, -90, [1]]}}, "silver": {"base": "#AEB6C1", "gradient": ["#BDC4CD", "#A0A7B2"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#F4F6F9", "dark": "#26303E"}, "tint_text": {"light": "#656D76", "dark": "#AEB6C1"}, "divisions": {"III": "#A4ABB5", "II": "#AEB6C1", "I": "#BAC1CA"}, "glow": {"color": "#AEB6C1", "blur_px": 0, "alpha": 0}, "text": "#AEB6C1", "card": {"band": "plain", "ink": "#1D2024", "ink_min_ratio": 6.04, "stops": ["#B6BDC7", "#AEB6C1", "#969EA8"], "background": "linear-gradient(118deg, #B6BDC7 0%, #AEB6C1 55%, #969EA8 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px)", "border": "1px solid rgba(255,255,255,.16)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#AEB6C1", "glyph": ["p", 4, -45, [0.85]]}}, "gold": {"base": "#D2B56E", "gradient": ["#DBC48B", "#C1A765"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#FDF5E2", "dark": "#2A3036"}, "tint_text": {"light": "#85661A", "dark": "#D2B56E"}, "divisions": {"III": "#C5AA67", "II": "#D2B56E", "I": "#D9C185"}, "glow": {"color": "#D2B56E", "blur_px": 0, "alpha": 0}, "text": "#D2B56E", "card": {"band": "plain", "ink": "#221F19", "ink_min_ratio": 6.23, "stops": ["#D6BC7D", "#D2B56E", "#B59D60"], "background": "linear-gradient(118deg, #D6BC7D 0%, #D2B56E 55%, #B59D60 100%), repeating-linear-gradient(0deg, rgba(255,255,255,.035) 0 1px, transparent 1px 3px)", "border": "1px solid rgba(255,255,255,.16)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#D2B56E", "glyph": ["p", 4, -90, [1]]}}, "platinum": {"base": "#A3C4B1", "gradient": ["#BFD6C8", "#A3C4B1", "#94B2A1"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#E2F7F5", "dark": "#25313D"}, "tint_text": {"light": "#1C786F", "dark": "#A3C4B1"}, "divisions": {"III": "#99B8A6", "II": "#A3C4B1", "I": "#B3CEBE"}, "glow": {"color": "#A3C4B1", "blur_px": 0, "alpha": 0}, "text": "#A3C4B1", "card": {"band": "mid", "ink": "#1B2122", "ink_min_ratio": 5.37, "stops": ["#B7D1C2", "#A3C4B1", "#809A8C"], "background": "linear-gradient(118deg, transparent 30%, rgba(255,255,255,.16) 48%, transparent 62%), var(--hex), linear-gradient(118deg, #B7D1C2 0%, #A3C4B1 55%, #809A8C 100%)", "border": "1px solid rgba(255,255,255,.37)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#A3C4B1", "glyph": ["p", 6, -90, [1]]}}, "emerald": {"base": "#529E82", "gradient": ["#71AF98", "#529E82", "#498D74"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#E0F2E8", "dark": "#1D2E38"}, "tint_text": {"light": "#197643", "dark": "#57A186"}, "divisions": {"III": "#4B9178", "II": "#529E82", "I": "#63A88E"}, "glow": {"color": "#529E82", "blur_px": 0, "alpha": 0}, "text": "#57A186", "card": {"band": "mid", "ink": "#101C1C", "ink_min_ratio": 4.72, "stops": ["#78B39E", "#529E82", "#4C9278"], "background": "linear-gradient(118deg, transparent 30%, rgba(255,255,255,.16) 48%, transparent 62%), var(--hex), linear-gradient(118deg, #78B39E 0%, #529E82 55%, #4C9278 100%)", "border": "1px solid rgba(255,255,255,.37)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#529E82", "glyph": ["p", 8, -67.5, [1]]}}, "diamond": {"base": "#9DA8E6", "gradient": ["#B4BCEC", "#9DA8E6", "#8D97CF"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#E8F3FF", "dark": "#242F42"}, "tint_text": {"light": "#3B6FA8", "dark": "#9DA8E6"}, "divisions": {"III": "#929CD6", "II": "#9DA8E6", "I": "#ABB4EA"}, "glow": {"color": "#9DA8E6", "blur_px": 0, "alpha": 0}, "text": "#9DA8E6", "card": {"band": "mid", "ink": "#1A1E2A", "ink_min_ratio": 4.66, "stops": ["#B3BBEC", "#9DA8E6", "#7C85B6"], "background": "linear-gradient(118deg, transparent 30%, rgba(255,255,255,.16) 48%, transparent 62%), var(--hex), linear-gradient(118deg, #B3BBEC 0%, #9DA8E6 55%, #7C85B6 100%)", "border": "1px solid rgba(255,255,255,.37)", "outline": null, "shadow": "0 12px 28px rgba(0,0,0,.55)", "glow": null, "topo_tint": "#9DA8E6", "glyph": ["pts", [[0, -1], [0.8, -0.2], [0, 1], [-0.8, -0.2]]]}}, "master": {"base": "#A587D4", "gradient": ["#BCA6DF", "#AC91D7", "#A587D4", "#8E74B6"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#EFE6FD", "dark": "#252B40"}, "tint_text": {"light": "#7F47DD", "dark": "#A587D4"}, "divisions": null, "glow": {"color": "#A587D4", "blur_px": 18, "alpha": 0.2}, "text": "#A587D4", "card": {"band": "top", "ink": "#F4F1FA", "ink_min_ratio": 4.89, "stops": ["#625180", "#453A5B", "#2F283F"], "background": "linear-gradient(122deg, transparent 32%, rgba(159,240,224,.18) 42%, rgba(179,156,250,.22) 50%, rgba(243,163,196,.18) 58%, transparent 68%), var(--topo), linear-gradient(118deg, #625180 0%, #453A5B 55%, #2F283F 100%)", "border": "1px solid rgba(255,255,255,.47)", "outline": "1px solid #A587D470", "shadow": "0 12px 28px rgba(0,0,0,.55), 0 0 40px rgba(165,135,212,.32)", "glow": "rgba(165,135,212,.32)", "topo_tint": "#A587D4", "glyph": ["p", 8, -90, [1, 0.4]]}}, "grandmaster": {"base": "#CC8094", "gradient": ["#DAA2B1", "#D18B9E", "#CC8094", "#AF6E7F"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#F9E3EC", "dark": "#292B3A"}, "tint_text": {"light": "#B53167", "dark": "#CC8094"}, "divisions": null, "glow": {"color": "#CC8094", "blur_px": 26, "alpha": 0.26}, "text": "#CC8094", "card": {"band": "top", "ink": "#F9F0F2", "ink_min_ratio": 4.86, "stops": ["#784D5A", "#553742", "#39262F"], "background": "linear-gradient(122deg, transparent 32%, rgba(159,240,224,.18) 42%, rgba(179,156,250,.22) 50%, rgba(243,163,196,.18) 58%, transparent 68%), var(--topo), linear-gradient(118deg, #784D5A 0%, #553742 55%, #39262F 100%)", "border": "1px solid rgba(255,255,255,.47)", "outline": "1px solid #CC809470", "shadow": "0 12px 28px rgba(0,0,0,.55), 0 0 44px rgba(204,128,148,.37)", "glow": "rgba(204,128,148,.37)", "topo_tint": "#CC8094", "glyph": ["p", 12, -90, [1, 0.5]]}}, "challenger": {"base": "#E6DEFA", "gradient": ["#FFFDF8", "#EEE8FA", "#CFC3F2"], "gradient_angle_deg": 135, "on": "#0F1620", "tint": {"light": "#FEF9EB", "dark": "#272D44"}, "tint_text": {"light": "#7D6F39", "dark": "#E6DEFA"}, "divisions": null, "glow": {"color": "#E6DEFA", "blur_px": 38, "alpha": 0.34}, "text": "#E6DEFA", "card": {"band": "top", "ink": "#2B2350", "ink_min_ratio": 9.45, "stops": ["#FBF7EE", "#EEE7FA", "#D8CBF5"], "background": "linear-gradient(122deg, transparent 32%, rgba(159,240,224,.18) 42%, rgba(179,156,250,.22) 50%, rgba(243,163,196,.18) 58%, transparent 68%), var(--topo), linear-gradient(118deg, #FBF7EE 0%, #EEE7FA 55%, #D8CBF5 100%)", "border": "1px solid rgba(255,255,255,.47)", "outline": "1px solid #B39CFA70", "shadow": "0 12px 28px rgba(0,0,0,.55), 0 0 52px rgba(179,156,250,.47)", "glow": "rgba(179,156,250,.47)", "topo_tint": "#8F72F2", "glyph": ["p", 16, -90, [1, 0.55]]}}}, "subdivision": {"method": "Roman numeral + 3 pips (filled = division strength, I=3 pips) + badge brightness step; III=base mixed 12% black, II=base, I=base mixed 14% white", "tiers": "iron..diamond only"}};

// 9:16 story PNG (1080x1920) rendered on canvas. Embedded fonts: "TC Archivo", "TC Pretendard" (subset).
const W = 1080, H = 1920;
const SYS_KO = '-apple-system,"Apple SD Gothic Neo","Noto Sans KR","Noto Sans CJK KR","Malgun Gothic",sans-serif';
const PRE = `"TC Pretendard","LZ pretendardk",${SYS_KO}`;
// Hangul covered by the embedded subsets; anything else lazy-loads the full (KS X 1001) font so labels/user text never fall back
const SUB_PRE = new Set('간고골그기까나남내넘다단달대동드랄래랜록론린마말메몬버분브상성스시실아언에여예완요위음이저적정주즈지챌초최축터티페표풀프플하해'), SUB_BH = new Set('골그내넘다드랄래랜론린마메몬버브상스실아언에위이저즈챌터티플');
function needFull(t, bh) { for (const ch of t) if (ch >= "\uac00" && ch <= "\ud7a3" && !(bh ? SUB_BH : SUB_PRE).has(ch)) return true; return false; }
const ARC = '"TC Archivo",sans-serif';
// Tier colours come from TK.tier (single source of truth); only material effects live here.
function alpha(hex, a) { const n = parseInt(hex.slice(1), 16); return `rgba(${n >> 16},${n >> 8 & 255},${n & 255},${a})`; }
const STORY_FX = {"iron": {"sheen": 0, "holo": 0}, "bronze": {"sheen": 0.25, "holo": 0}, "silver": {"sheen": 0.45, "holo": 0}, "gold": {"sheen": 0.55, "holo": 0}, "platinum": {"sheen": 0.6, "holo": 0}, "emerald": {"sheen": 0.65, "holo": 0.08}, "diamond": {"sheen": 0.75, "holo": 0.18}, "master": {"sheen": 0.8, "holo": 0.25}, "grandmaster": {"sheen": 0.85, "holo": 0.3}, "challenger": {"sheen": 0.9, "holo": 0.5}};
const STORY_MAT = Object.fromEntries(Object.entries(STORY_FX).map(([k, fx]) => { const t = TK.tier[k], cd = t.card;
  return [k, { s: cd.stops, ink: cd.ink, text: t.text, band: cd.band, ...fx, glow: cd.glow }]; }));
// chip glyphs (unit coords) shared by DOM SVG + canvas
const TIER_COMMENTS = {"iron3": "만사가 귀찮다. 도대체 왜 뛰는 거지? 러닝화는 왜 사는 거야?", "iron2": "1km는 차로 이동해야 하는 거 아니야?", "iron1": "야야 좀 걷자. 숨찬다. 오늘 많이 뛰었잖아?", "bronze3": "그래도 오늘 나왔으니까 2km는 채우고 가자. 뛰는 게 어디냐.", "bronze2": "어? 생각보다 뛸 만한데? 욕심부렸다가 금방 후회한다.", "bronze1": "니가 5km를 뛰었다고? 나도 할 수 있을 것 같은데? 일단 내일 해본다.", "silver3": "5km는 이제 어떻게든 걷지 않고 뛴다. 대신 끝나고 한동안 아무것도 못 한다.", "silver2": "잠깐만. 나 어제보다 빨라졌는데?", "silver1": "슬슬 그냥 뛰는 건 재미없다. 기록을 좀 줄여볼까?", "gold3": "남들은 몇 분 페이스로 뛰나 보기 시작한다. 그리고 내 기록을 다시 본다.", "gold2": "남들 5분대가 느려 보인다. 근데 왜 나는 아직도 힘들지?", "gold1": "러닝 끝나고 기록부터 확인한다. 거리보다 페이스가 신경 쓰인다. 슬슬 사람들이 페이스를 물어본다.", "platinum3": "오늘 기록이 왜 이렇지? 날씨 때문인가? 바람 때문인가? 컨디션 때문인가?", "platinum2": "러닝화를 사면서 용도를 구분하기 시작한다. 이건 데일리, 이건 장거리, 이건 대회용.", "platinum1": "이지런 하려고 나왔는데 욕심부리다가 후반에 퍼져버린다.", "emerald3": "10km 뛰고 들어왔는데 생각보다 멀쩡하다. 이지런 속도를 올려볼까?", "emerald2": "남의 기록을 보면 부럽지가 않다. 저 기록을 위한 훈련법이 궁금하다.", "emerald1": "훈련에도 목적이 있다는 걸 알게 된다. 오늘은 왜 천천히 뛰는지도 설명할 수 있다.", "diamond3": "기록 하나 찍고 끝나는 게 아니다. 심박, 페이스, 케이던스까지 디테일에 신경 쓴다.", "diamond2": "남들이 빠르다고 하는 기록이 슬슬 내 PB가 된다.", "diamond1": "나도 이제 러닝 인플루언서가 될 수 있는 건가? 생각한다.", "master": "너의 질주는 나의 이지런이다.", "grandmaster": "웬만한 대회는 입상 또는 PB 갱신이 목표다. 작은 대회에 나갔더니 아는 사람이 이런 데 왜 나왔냐고 원망한다.", "challenger": "대한민국의 체육계를 들썩이게 할 괴물."};
const tierComment = (key, roman) => TIER_COMMENTS[key + ({ III: 3, II: 2, I: 1 }[roman] || '')] || '';
function glyphPts(k) { const g = TK.tier[k].card.glyph; if (g[0] === 'pts') return g[1]; if (g[0] === 'circle') return null;
  const [, n, rot, rr] = g; return Array.from({ length: n }, (_, i) => { const r = rr[i % rr.length], a = (rot + 360 * i / n) * Math.PI / 180; return [r * Math.cos(a), r * Math.sin(a)]; }); }
function glyphSVG(k) { const p = glyphPts(k), st = 'fill="none" stroke="currentColor" stroke-width=".14" stroke-linejoin="round"';
  return `<svg viewBox="-1.1 -1.1 2.2 2.2" aria-hidden="true">${p ? `<polygon points="${p.map(q => q.map(v => v.toFixed(3)).join(',')).join(' ')}" ${st}/>` : `<circle r=".8" ${st}/>`}</svg>`; }
// inline pattern art (tokens referenced crystal-hex.svg / topo-contours.svg)
const HEX_SVG = (() => { const s = 26, h = s * Math.sqrt(3), P = (cx, cy) => Array.from({ length: 6 }, (_, i) => { const a = (60 * i + 30) * Math.PI / 180; return `${(cx + s * .55 * Math.cos(a)).toFixed(1)},${(cy + s * .55 * Math.sin(a)).toFixed(1)}`; }).join(' ');
  return `<svg xmlns="http://www.w3.org/2000/svg" width="${s * 1.5 * 2}" height="${h.toFixed(1)}"><g fill="none" stroke="#fff" stroke-opacity=".10" stroke-width="1">${[[0, 0], [s * 1.5, h / 2], [s * 3, 0], [0, h], [s * 3, h], [s * 1.5, -h / 2]].map(([x, y]) => `<polygon points="${P(x, y)}"/>`).join('')}</g></svg>`; })();
const TOPO_D = Array.from({ length: 24 }, (_, k) => { k++; let d = ''; for (let a = 0; a <= 360; a += 6) { const t = a * Math.PI / 180, r = k * 9.5 * (1 + .10 * Math.sin(3 * t + k * .3) + .06 * Math.sin(5 * t - k * .5)); d += (a ? 'L' : 'M') + (245 + r * Math.cos(t) * 1.25).toFixed(1) + ',' + (130 + r * Math.sin(t)).toFixed(1); } return d + 'Z'; }).join('');
const topoSVG = col => `<svg xmlns="http://www.w3.org/2000/svg" width="340" height="214" viewBox="0 0 340 214" preserveAspectRatio="xMidYMid slice"><path d="${TOPO_D}" fill="none" stroke="${col}" stroke-opacity=".42" stroke-width=".7"/></svg>`;
const svgURL = s => `url("data:image/svg+xml,${encodeURIComponent(s)}")`;
document.head.insertAdjacentHTML('beforeend', '<style id="tier-tk">' + `.tier-card{--hex:${svgURL(HEX_SVG)} 0 0/78px auto repeat}` + Object.entries(TK.tier).map(([k, t]) => { const cd = t.card;
  const bg = cd.background.replace('var(--topo)', svgURL(topoSVG(cd.topo_tint)) + ' center/cover no-repeat');
  return `.t-${k}{--ink:${cd.ink};--ink2:${cd.ink};--card-bg:${bg};--card-bd:${cd.border.replace(/^1px solid /, '1px solid ')};--card-sh:${cd.shadow};${cd.outline ? `--card-ol:${cd.outline};` : ''}}`; }).join('') + '</style>');
// --hex is a shorthand-ish layer; expand into background layers
document.querySelectorAll('#tier-tk').forEach(s => { s.textContent = s.textContent.replace(/var\(--hex\)/g, svgURL(HEX_SVG) + ' 0 0/78px auto repeat'); });
const rr = (c, x, y, w, h, r) => { c.beginPath(); c.roundRect(x, y, w, h, r); };
function font(c, size, weight, fam, stretch = 'normal') { c.font = `${weight} ${size}px ${fam}`; try { c.fontStretch = stretch; } catch { } }
function fitText(c, txt, max) { while (c.measureText(txt).width > max && txt.length > 1) txt = txt.slice(0, -2) + '…'; return txt; }

// ---------- font registry: 6 embedded + Pretendard, rest lazy-loaded on pick ----------
const rng = s => { const [a, b] = String(s).split(' ').map(Number); if (!b) return [a]; const o = []; for (let w = a; w <= b; w += 100) o.push(w); return o; };
const FONTS = {
  archivo: { n: 'Archivo', cat: 'sporty', fam: ARC, ws: [300, 400, 500, 600, 700, 800, 900], emb: 1, lic: 'OFL-1.1' },
  bebas: { n: 'Bebas Neue', cat: 'sporty', fam: `"OV Bebas",${PRE}`, ws: [400], sz: 1.2, emb: 1, lic: 'OFL-1.1' },
  anton: { n: 'Anton', cat: 'sporty', fam: `"OV Anton",${PRE}`, ws: [400], emb: 1, lic: 'OFL-1.1' },
  playfair: { n: 'Playfair Display', cat: 'classic', fam: `"OV Playfair",serif`, ws: [800], emb: 1, lic: 'OFL-1.1' },
  mono: { n: 'JetBrains Mono', cat: 'mono', fam: `"OV Mono",monospace`, ws: [700], sz: .88, emb: 1, lic: 'OFL-1.1' },
  blackhan: { n: '검은고딕 (Black Han Sans)', cat: 'ko', fam: `"OV BlackHan","LZ blackhank",${PRE}`, ws: [400], emb: 1, ko: 1, lic: 'OFL-1.1' },
  pretendard: { n: 'Pretendard', cat: 'ko', fam: PRE, ws: [500, 600, 700], emb: 1, ko: 1, lic: 'OFL-1.1' },
};
for (const f of LAZY_FONTS) FONTS[f.k] = { n: f.n, cat: f.cat, fam: `"LZ ${f.k}",${f.ko ? '' : PRE + ','}${SYS_KO}`.replace(',,', ','), ws: [...new Set(f.files.flatMap(x => rng(x[1])))], files: f.files, ko: f.ko, lic: f.lic, pw: f.pw };
const PICKABLE = k => FONTS[k] && FONTS[k].cat !== 'hidden';
const FONT_CATS = [['sporty', '스포티'], ['classic', '클래식'], ['mono', '모노'], ['ko', '한글'], ['hand', '손글씨']];
for (const k of ['marker', 'gaegu', 'gamja', 'himelody', 'poorstory', 'nanumpen', 'dokdo', 'eastsea', 'kirang']) if (FONTS[k]) FONTS[k].cat = 'hand';
const loaded = new Map();
let FONT_BASE = '/fonts/lazy/';
function setFontBase(b) { FONT_BASE = b; }
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
const previewFam = k => FONTS[k].emb ? FONTS[k].fam : `"PV ${k}","LZ ${k}",${PRE}`;
const nearW = (k, w) => { const ws = FONTS[k].ws; return ws.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a, ws[0]); };


let H_ = H;
function setH_(h) { H_ = h; }
const W_ = W, ARC_ = ARC, PRE_ = PRE, SYS_KO_ = SYS_KO;
{ rr, font, alpha };
const RC_METAL = {
  iron: ['#BEC1C5', '#8E9196', '#5C5F64'], bronze: ['#DDA680', '#B27B53', '#784C30'], silver: ['#EEF0F3', '#C3C8CE', '#8A9097'],
  gold: ['#E2CC92', '#BFA262', '#86703A'], platinum: ['#D6E5DA', '#A8C3B2', '#738F7D'], emerald: ['#7DC9B1', '#3F907A', '#22594A'],
  diamond: ['#B5CCF0', '#7098D2', '#3F6399'], master: ['#BFAAEA', '#8C73C8', '#563F8C'], grandmaster: ['#DDAAB4', '#B07784', '#744351'],
  challenger: ['#FBF9FF', '#DED6F7', '#B7ABE4']
};
const RC_FLIP = { bronze: 1, gold: 1, emerald: 1, grandmaster: 1 };
const RC_BAND = { iron: 'ore', bronze: 'ore', silver: 'ore', gold: 'ore', platinum: 'pol', emerald: 'pol', diamond: 'pol', master: 'cel', grandmaster: 'cel', challenger: 'cel' };
// motifs: lanes (track-lane parallel traces), route (GPS polyline), pulse (HR waveform), flow (pace contour lines), vias (nodes)
const RC_MOTIF = {
  ore: {
    fine: ['M23 50H38C46 50 48 30 57 30H77', 'M23 55H39C48 55 50 35 59 35H77', 'M23 60H40C50 60 52 40 61 40H77', 'M23 20H34L38 24H52'],
    bold: ['M23 52H38C47 52 49 32 58 32H77', 'M23 61H40C50 61 52 41 61 41H77'],
    vias: [[57, 30, 1.6], [52, 24, 1.2]], ticks: [26, 66, [3, 5, 2.5, 6, 4]]
  },
  pol: {
    fine: ['M23 24H36L38.5 19L41.5 30L44.5 15L47.5 27L49.5 24H77', 'M23 46C33 46 36 36 46 38S60 52 70 44L77 40', 'M23 56C33 56 38 48 48 50S62 60 77 54', 'M23 64H77'],
    bold: ['M23 24H36L39 18L42 31L45 15L48 24H77', 'M23 50C33 50 37 40 47 42S61 56 77 47'],
    vias: [[70, 44, 1.6], [46, 38, 1.1]], ticks: [60, 66, [2.5, 4, 2.5]]
  },
  cel: {
    fine: ['M23 22C35 16 45 30 57 24S70 18 77 22', 'M23 32C36 26 46 40 58 34S71 28 77 32', 'M23 44C35 38 47 52 60 46S72 40 77 44', 'M23 56C36 50 48 64 61 58S72 52 77 56', 'M30 66L42 50L55 52L62 38'],
    bold: ['M23 30C36 24 46 38 58 32S71 26 77 30', 'M23 50C35 44 47 58 60 52S72 46 77 50', 'M32 66L44 50L56 52L62 38'],
    vias: [[62, 38, 1.7]], rings: [62, 38, [3.6, 6]], ticks: null
  }
};
function runChipSVG(key) {
  const [c1, c2, c3] = RC_METAL[key] || RC_METAL.iron, m = RC_MOTIF[RC_BAND[key] || 'ore'], id = 'rc-' + key;
  const eng = (d, w, cls) => `<path class="${cls}" d="${d}" stroke="rgba(255,255,255,.5)" stroke-width="${w}" transform="translate(.55 .7)"/><path class="${cls}" d="${d}" stroke="rgba(0,0,0,.55)" stroke-width="${w}"/>`;
  const via = ([x, y, r], cls) => `<g class="${cls}"><circle cx="${x + .5}" cy="${y + .6}" r="${r}" fill="none" stroke="rgba(255,255,255,.5)" stroke-width=".8"/><circle cx="${x}" cy="${y}" r="${r}" fill="rgba(0,0,0,.25)" stroke="rgba(0,0,0,.6)" stroke-width=".8"/></g>`;
  const pads = ['M0 22H18', 'M0 40H18', 'M0 58H18', 'M82 22H100', 'M82 40H100', 'M82 58H100', 'M18 0V80', 'M82 0V80'].join('');
  const ticks = m.ticks ? m.ticks[2].map((h, i) => `M${m.ticks[0] + i * 2.6} ${m.ticks[1] + 4}v${-h}`).join('') : '';
  const rings = m.rings ? m.rings[2].map(r => `M${m.rings[0] - r} ${m.rings[1]}a${r} ${r} 0 1 0 ${2 * r} 0a${r} ${r} 0 1 0 ${-2 * r} 0`).join('') : '';
  const holo = key === 'challenger' ? `<rect width="100" height="80" fill="url(#${id}-h)" opacity=".55" style="mix-blend-mode:soft-light"/>` : '';
  return `<svg class="rc-svg" viewBox="0 0 100 80" preserveAspectRatio="none" focusable="false" aria-hidden="true"><defs>
<linearGradient id="${id}-m" x1="0" y1="0" x2=".35" y2="1"><stop offset="0" stop-color="${c1}"/><stop offset=".45" stop-color="${c2}"/><stop offset="1" stop-color="${c3}"/></linearGradient>
<linearGradient id="${id}-s" x1="0" y1="0" x2="1" y2="1"><stop offset=".25" stop-color="#fff" stop-opacity="0"/><stop offset=".42" stop-color="#fff" stop-opacity=".38"/><stop offset=".5" stop-color="#fff" stop-opacity=".05"/><stop offset=".7" stop-color="#fff" stop-opacity="0"/></linearGradient>
${key === 'challenger' ? `<linearGradient id="${id}-h" x1="0" y1="0" x2="1" y2=".6"><stop offset="0" stop-color="#9ff0e0"/><stop offset=".35" stop-color="#ffd1f0"/><stop offset=".65" stop-color="#b8a6ff"/><stop offset="1" stop-color="#9fe3ff"/></linearGradient>` : ''}
<filter id="rc-brush" x="0" y="0" width="100%" height="100%"><feTurbulence type="fractalNoise" baseFrequency=".012 1.1" numOctaves="2" seed="4"/><feColorMatrix values="0 0 0 0 1 0 0 0 0 1 0 0 0 0 1 0 0 0 .8 -.38"/></filter>
<clipPath id="rc-clip"><rect width="100" height="80" rx="18" ry="17.6"/></clipPath></defs>
<g clip-path="url(#rc-clip)"><rect width="100" height="80" fill="url(#${id}-m)"/>${holo}
<rect width="100" height="80" filter="url(#rc-brush)" opacity=".35" style="mix-blend-mode:overlay"/>
<rect width="100" height="80" fill="url(#${id}-s)"/>
<path d="M0 0H18V80H0ZM82 0H100V80H82Z" fill="rgba(255,255,255,.10)"/>
<path d="M6 12l9 -1M88 67l7 1M30 9l14 -1.5M60 73l12 -.8" stroke="rgba(255,255,255,.22)" stroke-width=".35" fill="none"/>
<g fill="none" stroke-linecap="round" stroke-linejoin="round">${eng(pads, 1.1, 'rc-p')}<g${RC_FLIP[key] ? ' transform="matrix(-1 0 0 1 100 0)"' : ''}>
<rect x="22.5" y="8.5" width="55" height="63" rx="3" stroke="rgba(0,0,0,.28)" stroke-width=".6"/>
${m.fine.map(d => eng(d, .9, 'rc-fine')).join('')}${m.bold.map(d => eng(d, 2, 'rc-bold')).join('')}
${ticks ? eng(ticks, .9, 'rc-fine') : ''}${rings ? eng(rings, .7, 'rc-fine') : ''}</g></g>
<g${RC_FLIP[key] ? ' transform="matrix(-1 0 0 1 100 0)"' : ''}>${m.vias.map(v => via(v, 'rc-fine')).join('')}${via([m.vias[0][0], m.vias[0][1], 2.4], 'rc-bold')}</g>
</g><rect x=".4" y=".4" width="99.2" height="79.2" rx="17.6" ry="17.2" fill="none" stroke="rgba(255,255,255,.45)" stroke-width=".8"/></svg>`;
}

// canvas card = DOM card (final): Kode Mono Latin, monochrome emboss (hi -1u, lo +1u, lo2 +2u), running-data chip, division bar gauge
const CARD_INK = { platinum: '#0F2219', emerald: '#04140F', diamond: '#0E1336', master: '#F3F0F8', grandmaster: '#F3F0F8', challenger: '#2B2350' };
const EMB = k => k === 'master' || k === 'grandmaster' ? ['rgba(255,255,255,.22)', 'rgba(0,0,0,.72)', 'rgba(0,0,0,.36)'] : k === 'challenger' ? ['rgba(255,255,255,.95)', 'rgba(0,0,0,.30)', 'rgba(0,0,0,.13)'] : TK.tier[k].card.band === 'mid' ? ['rgba(255,255,255,.9)', 'rgba(0,0,0,.30)', 'rgba(0,0,0,.12)'] : ['rgba(255,255,255,.70)', 'rgba(0,0,0,.40)', 'rgba(0,0,0,.18)'];
const chipImg = new Map();
function chipLoad(k) { if (chipImg.has(k)) { const v = chipImg.get(k); return v instanceof Promise ? v : Promise.resolve(v); }
  const p = new Promise(res => { const im = new Image(); im.onload = () => { chipImg.set(k, im); res(im); }; im.onerror = () => { chipImg.set(k, null); res(null); }; im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(runChipSVG(k).replace('<svg ', '<svg xmlns="http://www.w3.org/2000/svg" width="200" height="160" ')); }); chipImg.set(k, p); return p; }
const cardFontsReady = () => document.fonts ? Promise.all(['600 40px "CC Kode"', '400 40px "CC Kode"'].map(f => document.fonts.load(f).catch(() => 0))) : Promise.resolve();
function drawCard(c, d, x, y, w, h) {
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

function lum(hex) { const n = parseInt(String(hex).slice(1), 16); if (isNaN(n)) return 1; const f = v => { v /= 255; return v <= .04045 ? v / 12.92 : ((v + .055) / 1.055) ** 2.4; }; return .2126 * f(n >> 16) + .7152 * f(n >> 8 & 255) + .0722 * f(n & 255); }
function tierBg(c, d) {
  const m = STORY_MAT[d.key], g = c.createLinearGradient(0, 0, W * .4, H);
  g.addColorStop(0, m.s[0]); g.addColorStop(.55, m.s[Math.floor(m.s.length / 2)]); g.addColorStop(1, m.s[m.s.length - 1]);
  c.fillStyle = g; c.fillRect(0, 0, W, H);
  c.fillStyle = d.key === 'challenger' ? 'rgba(20,18,40,.55)' : 'rgba(12,14,18,.42)'; c.fillRect(0, 0, W, H);
  const rg = c.createRadialGradient(W * .2, H * .1, 0, W * .2, H * .1, H * .7); rg.addColorStop(0, 'rgba(255,255,255,.18)'); rg.addColorStop(1, 'rgba(255,255,255,0)');
  c.fillStyle = rg; c.fillRect(0, 0, W, H);
}
const ymd = (now = new Date()) => `${now.getFullYear()}.${String(now.getMonth() + 1).padStart(2, '0')}.${String(now.getDate()).padStart(2, '0')}`;
const tierTint = d => (TK.tier[d.key].tint_text || {}).light || TK.tier[d.key].text;
function accentOf(d) { return TK.tier[d.key].text; }
async function saveStory(cv, name = 'running-tier.png') {
  const blob = await new Promise(r => cv.toBlob(r, 'image/png'));
  const file = new File([blob], name, { type: 'image/png' });
  const mobile = matchMedia('(pointer:coarse)').matches;
  if (mobile && navigator.canShare && navigator.canShare({ files: [file] })) {
    try { await navigator.share({ files: [file], title: '러닝 티어' }); return 'shared'; } catch (e) { if (e.name === 'AbortError') return 'cancelled'; }
  }
  const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = name; document.body.appendChild(a); a.click(); a.remove();
  setTimeout(() => URL.revokeObjectURL(a.href), 30000); return 'downloaded';
}

// v3 story editor: document = background + ordered layers, rendered 1:1 to a 1080x1920 canvas (preview == export).
// ---- stat ("기록 블록") values come only from the calculation result: never editable ----
const STATS = { rec: ['기록', 'RECORD'], pace: ['페이스', 'PACE'], tier: ['티어', 'TIER'], top: ['상위 %', 'RANK'], vdot: ['VDOT', 'VDOT'], next: ['다음 티어까지', 'NEXT'], date: ['날짜', 'DATE'], race: ['대회명', 'RACE'], event: ['종목', 'EVENT'], combo: ['기록 문구', 'TEXT'] };
const statLabel = (d, k) => k === 'rec' ? d.recLine.split(' ')[0] + ' 기록' : STATS[k][0];
const statValue = (d, doc, k, L) => L && L.tx ? fillTok(L.tx, d, doc) : ({ rec: d.time, pace: d.pace, tier: d.word + (d.roman ? ' ' + d.roman : ''), top: d.topLabel, vdot: d.vdot, next: d.nextLine, date: ymd(), race: (doc.race || '').trim() || '대회명을 입력하세요', event: d.recLine.split(' ')[0] })[k];
// result tokens used by the v4 templates (values always come from the calculation; race is the only user-typed one)
const paceQ = p => { const m = /^(\d+):(\d\d)/.exec(p || ''); return m ? `${m[1]}'${m[2]}"` : (p || '').replace('/km', ''); };
const pctOf = d => { const m = /([\d.]+)%/.exec(d.topLabel || ''); return m ? m[1] : ''; };
function fillTok(tx, d, doc) { const ev = d.recLine.split(' ')[0], race = (doc.race || '').trim(), dt = ymd();
  const V = { rec: d.time, pace: paceQ(d.pace), tier: d.word + (d.roman ? ' ' + d.roman : ''), vdot: d.vdot, date: dt, mmdd: dt.slice(5), ev, race: race || ev, pct: pctOf(d) };
  let t = tx.replace(/\{(\w+)\}/g, (_, k) => V[k] ?? ''); if (/이내/.test(d.topLabel) && /\{pct\}%/.test(tx)) t = t.replace(V.pct + '%', V.pct + '% 이내');
  if (!race && /\{race\}/.test(tx) && /\{ev\}/.test(tx)) t = t.replace(ev + ' · ', '').replace(ev + ' ' + ev, ev); return t; }
const STAT_SIZE0 = { combo: 48, rec: 120, pace: 96, tier: 92, top: 104, vdot: 72, next: 40, date: 40, race: 56, event: 64 };
const STAT_SIZE = STAT_SIZE0;
const TOP_MIN_PX = 64; // 상위 % is always shown big
const STICKERS = [['wordmark', 'hoohaa 워드마크'], ['emblem', '티어 엠블럼'], ['runner', '러너'], ['shoe', '러닝화'], ['dist', '거리 배지'], ['sun', '맑음'], ['date', '날짜 도장'], ['flag', '피니시'], ['sparkle', '반짝'], ['heart', '하트'], ['bolt', '번개'], ['star', '별'], ['rect', '사각형'], ['circle', '원'], ['line', '선']];
const FILTERS = [['none', '원본'], ['vivid', '선명하게'], ['golden', '골든아워'], ['warm', '따뜻하게'], ['morning', '새벽공기'], ['cool', '차갑게'], ['teal', '틸 & 오렌지'], ['film', '필름'], ['fade', '빈티지'], ['bw', '흑백'], ['noir', '누아르']];
// export formats: 9:16 story (default), 4:5 feed, 1:1
const FORMATS = [['story', '스토리 9:16', 1920], ['feed', '피드 4:5', 1350], ['square', '정사각 1:1', 1080]];
const fmtH = f => (FORMATS.find(x => x[0] === f) || FORMATS[0])[2];
const MASKS = [['rect', '사각'], ['round', '둥근'], ['circle', '원형'], ['polaroid', '폴라로이드']];
const LK = { x: 540, y: 960, s: 1, r: 0, o: 1 };
let lseq = 0;
const lid = () => 'L' + Date.now().toString(36) + (lseq++);
const mk = (type, p) => ({ id: lid(), type, ...LK, ...p });
// ---- photo filters (pixel ops: same result in every browser, incl. Safari without ctx.filter) ----
const fcache = new Map();
function filtered(im, f, key) {
  if (!f || f === 'none') return im; const ck = key && key + ':' + f; if (ck && fcache.has(ck)) return fcache.get(ck);
  const c = document.createElement('canvas'); c.width = im.width; c.height = im.height; const g = c.getContext('2d'); g.drawImage(im, 0, 0);
  const id = g.getImageData(0, 0, c.width, c.height), p = id.data;
  for (let i = 0; i < p.length; i += 4) { let r = p[i], gg = p[i + 1], b = p[i + 2]; const l = .299 * r + .587 * gg + .114 * b;
    if (f === 'bw') r = gg = b = l;
    else if (f === 'warm') { r = r * 1.08 + 12; gg = gg * 1.02 + 4; b = b * .88; }
    else if (f === 'cool') { r = r * .9; gg = gg * 1.0 + 2; b = b * 1.1 + 14; }
    else if (f === 'fade') { r = l + (r - l) * .6; gg = l + (gg - l) * .6; b = l + (b - l) * .6; r = r * .85 + 30; gg = gg * .85 + 28; b = b * .85 + 22; }
    else if (f === 'golden') { r = r * 1.1 + 14; gg = gg * 1.03 + 6; b = b * .82; r = l + (r - l) * 1.12; }
    else if (f === 'morning') { r = r * .92 + 22; gg = gg * .95 + 24; b = b * .98 + 30; const m = (r + gg + b) / 3; r = m + (r - m) * .8; gg = m + (gg - m) * .8; b = m + (b - m) * .8; }
    else if (f === 'teal') { const t = l / 255; r = r + (t - .5) * 40 + 6; gg = gg + 2; b = b - (t - .5) * 46 + 8; }
    else if (f === 'film') { r = (r - 128) * .92 + 128 + 10; gg = (gg - 128) * .92 + 128 + 4; b = (b - 128) * .88 + 128 - 6; r = Math.max(r, 22); gg = Math.max(gg, 20); b = Math.max(b, 26); }
    else if (f === 'noir') { r = gg = b = Math.min(255, Math.max(0, (l - 128) * 1.45 + 120)); }
    else if (f === 'vivid') { r = l + (r - l) * 1.45; gg = l + (gg - l) * 1.45; b = l + (b - l) * 1.45; r = (r - 128) * 1.08 + 128; gg = (gg - 128) * 1.08 + 128; b = (b - 128) * 1.08 + 128; }
    p[i] = r; p[i + 1] = gg; p[i + 2] = b; }
  g.putImageData(id, 0, 0); if (ck) { if (fcache.size > 24) fcache.clear(); fcache.set(ck, c); } return c;
}
// ---- non-destructive photo pipeline: rotate/flip -> crop -> filter + 밝기/대비/채도/따뜻함 -> 배경 지우기 (mask) -> 누끼 테두리 ----
// P (photo layer or doc.bg): rot 0..3 (×90°), flip, crop {x,y,w,h} (0..1 of the rotated image), filter, adj {br,ct,sa,wa} (-100..100), cut, ol {on,col,w}
const pcache = new Map();
const peKey = P => JSON.stringify([P.rot || 0, !!P.flip, P.crop || 0, P.filter || 'none', P.adj || 0, !!P.cut, P.cut && P.ol && P.ol.on ? P.ol : 0]);
const hasPE = P => !!(P.rot || P.flip || P.crop || P.adj || P.cut || (P.filter && P.filter !== 'none'));
function orient(src, P, crop = true) { // same geometry for photo + mask so they always line up
  const rot = (P.rot || 0) & 3, sw = rot & 1 ? src.height : src.width, sh = rot & 1 ? src.width : src.height, cr = crop && P.crop || { x: 0, y: 0, w: 1, h: 1 };
  const c = document.createElement('canvas'); c.width = Math.max(1, Math.round(sw * cr.w)); c.height = Math.max(1, Math.round(sh * cr.h)); const g = c.getContext('2d');
  g.translate(-cr.x * sw, -cr.y * sh); g.translate(sw / 2, sh / 2); g.rotate(rot * Math.PI / 2); if (P.flip) g.scale(-1, 1); g.drawImage(src, -src.width / 2, -src.height / 2, src.width, src.height); g.setTransform(1, 0, 0, 1, 0, 0); return c; } // reset: later passes (mask destination-in, outline) draw on this context in pixel space
function adjust(c, a) { if (!a || !(a.br || a.ct || a.sa || a.wa)) return c; const g = c.getContext('2d'), id = g.getImageData(0, 0, c.width, c.height), p = id.data;
  const br = (a.br || 0) * 1.1, ct = 1 + (a.ct || 0) / 110, sa = 1 + (a.sa || 0) / 100, wa = (a.wa || 0) * .32;
  for (let i = 0; i < p.length; i += 4) { let r = p[i] + br, gg = p[i + 1] + br, b = p[i + 2] + br; r = (r - 128) * ct + 128; gg = (gg - 128) * ct + 128; b = (b - 128) * ct + 128;
    const l = .299 * r + .587 * gg + .114 * b; r = l + (r - l) * sa + wa; gg = l + (gg - l) * sa + wa * .25; b = l + (b - l) * sa - wa; p[i] = r; p[i + 1] = gg; p[i + 2] = b; }
  g.putImageData(id, 0, 0); return c; }
function photoSrc(photos, pid, P) { const im = photos[pid]; if (!im) return null; if (!hasPE(P)) return im;
  const mask = P.cut ? photos['mask:' + pid] : null, k = pid + peKey(P) + (mask ? 'm' : ''); if (pcache.has(k)) return pcache.get(k);
  let c = orient(im, P); c = adjust(filtered(c, P.filter, null), P.adj); if (c === im) { const t = document.createElement('canvas'); t.width = c.width; t.height = c.height; t.getContext('2d').drawImage(c, 0, 0); c = t; }
  if (mask) { const ms = document.createElement('canvas'); ms.width = im.width; ms.height = im.height; ms.getContext('2d').drawImage(mask, 0, 0, im.width, im.height);
    const mo = orient(ms, P), g = c.getContext('2d'); g.globalCompositeOperation = 'destination-in'; g.drawImage(mo, 0, 0); g.globalCompositeOperation = 'source-over';
    if (P.ol && P.ol.on) { const w = Math.max(1, (P.ol.w || 12) * Math.max(c.width, c.height) / 1080), o = document.createElement('canvas'); o.width = c.width; o.height = c.height; const og = o.getContext('2d');
      for (let i = 0; i < 24; i++) { const a = i / 24 * Math.PI * 2; og.drawImage(c, Math.cos(a) * w, Math.sin(a) * w); }
      og.globalCompositeOperation = 'source-in'; og.fillStyle = P.ol.col || '#ffffff'; og.fillRect(0, 0, o.width, o.height); og.globalCompositeOperation = 'source-over'; og.drawImage(c, 0, 0); c = o; } }
  if (pcache.size > 16) pcache.clear(); pcache.set(k, c); return c; }
const famOf = (k, ko) => k && FONTS[k] ? FONTS[k].fam : ko ? PRE_ : ARC_;
const wOf = (k, w) => { if (!k || !FONTS[k]) return w; const ws = FONTS[k].ws; return ws.reduce((a, b) => Math.abs(b - w) < Math.abs(a - w) ? b : a, ws[0]); };
const HAN = /[\uac00-\ud7a3]/;
const contrast = c => lum(c) > .45 ? '#111111' : '#ffffff';
// text block: lines measured, local box centred on (0,0)
function textBlock(c, lines, o) { // o: size, fam, w, ls, lh, al, st
  const L = lines.map(l => { font(c, l.size || o.size, l.w || o.w, l.fam || o.fam, l.st || o.st || 'normal'); c.letterSpacing = (l.ls ?? o.ls ?? 0) + 'px'; const wd = c.measureText(l.t).width - (l.ls ?? o.ls ?? 0); c.letterSpacing = '0px'; return { ...l, size: l.size || o.size, wd }; });
  let y = 0; const lh = o.lh ?? 1.15; L.forEach((l, i) => { if (i) y += (L[i - 1].size * .25 + l.size * .8) * lh + (l.gap || 0); else y = l.size * (HAN.test(l.t) ? .9 : .8); l.base = y; });
  const w = Math.max(1, ...L.map(l => l.wd)), h = Math.max(1, y + L[L.length - 1].size * .22);
  // centre the real glyphs (actualBoundingBox) vertically in the box, so a background box has equal space above and below
  let gt = Infinity, gb = -Infinity; for (const l of L) { font(c, l.size, l.w || o.w, l.fam || o.fam, l.st || o.st || 'normal'); const m = c.measureText(l.t.trim() ? l.t : 'H'), a = m.actualBoundingBoxAscent ?? l.size * .72, d = m.actualBoundingBoxDescent ?? 0; gt = Math.min(gt, l.base - a); gb = Math.max(gb, l.base + d); }
  if (isFinite(gt) && isFinite(gb)) { const sh = h / 2 - (gt + gb) / 2; L.forEach(l => l.base += sh); }
  return { L, w, h };
}
// text effects of the layer being drawn (all OFF by default): 그림자 fsh, 외곽선 fol {col,w}, 글로우 fgl {col,r}
let FX = null;
function drawTextBlock(c, B, o, col) {
  c.textBaseline = 'alphabetic'; c.textAlign = 'left'; const fx = FX || {};
  for (const l of B.L) { const x = -B.w / 2 + (o.al === 'left' ? 0 : o.al === 'right' ? B.w - l.wd : (B.w - l.wd) / 2);
    font(c, l.size, l.w || o.w, l.fam || o.fam, l.st || o.st || 'normal'); c.letterSpacing = (l.ls ?? o.ls ?? 0) + 'px'; c.fillStyle = l.col || col; c.globalAlpha = (l.alpha ?? 1) * (o.ga ?? 1);
    const ty = l.base - B.h / 2, sz = l.size || o.size; fxText(c, l.t, x, ty, sz, l.col || col); c.letterSpacing = '0px'; c.globalAlpha = o.ga ?? 1; }
}
function fxText(c, t, x, ty, sz, col) { const fx = FX || {}; const l = { t };
    if (fx.fgl) { c.save(); c.shadowColor = fx.fgl.col === '@text' || !fx.fgl.col ? col : fx.fgl.col; c.shadowBlur = sz * (fx.fgl.r ?? 30) / 100; for (let k = 0; k < 2; k++) c.fillText(l.t, x, ty); c.restore(); }
    if (fx.fsh) { c.save(); const q = Array.isArray(fx.fsh) ? fx.fsh : [0, sz * .05, sz * .14, 'rgba(0,0,0,.45)']; c.shadowOffsetX = q[0]; c.shadowOffsetY = q[1]; c.shadowBlur = q[2]; c.shadowColor = q[3]; c.fillText(l.t, x, ty); c.restore(); }
    if (fx.fol && fx.fol.w) { c.save(); c.strokeStyle = fx.fol.col || '#000000'; c.lineWidth = fx.fol.w * 2; c.lineJoin = 'round'; c.miterLimit = 2; c.strokeText(l.t, x, ty); c.restore(); }
    c.fillText(l.t, x, ty); }
// text background box: own colour (L.bcol) + opacity (L.bo); without bcol it behaves as before (semi = black 45%, full = text colour)
function boxBehind(c, w, h, style, col, pad, rad, L = {}) { if (!style || style === 'none') return; rr(c, -w / 2 - pad, -h / 2 - pad * .7, w + pad * 2, h + pad * 1.4, rad);
  c.save(); if (L.bcol) { c.fillStyle = L.bcol; c.globalAlpha *= L.bo ?? (style === 'semi' ? .45 : 1); } else { c.fillStyle = style === 'semi' ? '#000000' : col; c.globalAlpha *= L.bo ?? (style === 'semi' ? .45 : 1); } c.fill(); c.restore(); }
// ---- each layer type: measure() -> {w,h} local, draw(c) centred at 0,0 ----
function layerGeom(c, L, d, doc, photos) {
  if (L.col === '@tier') L = { ...L, col: accentOf(d) }; else if (L.col === '@tierL') L = { ...L, col: tierTint(d) };
  if (L.bcol === '@tier') L = { ...L, bcol: accentOf(d) };
  if (L.sp && (L.type === 'text' || L.type === 'stat')) return specText(c, L, d, doc);
  if (L.type === 'text') {
    const ko = HAN.test(L.t || ''), fam = famOf(L.font, ko || !L.font), size = L.size || 72;
    const B = textBlock(c, String(L.t || ' ').split('\n').map(t => ({ t: t || ' ' })), { size, fam, w: wOf(L.font, L.w || 700), ls: L.ls || 0, lh: L.lh ?? 1.15 });
    const pad = L.box && L.box !== 'none' ? size * .35 : 0;
    return { w: B.w + pad * 2, h: B.h + pad * 1.4, draw: () => { const col = L.col || '#ffffff'; boxBehind(c, B.w, B.h, L.box, col, pad, size * .28, L); drawTextBlock(c, B, { al: L.al || 'center', w: wOf(L.font, L.w || 700), fam, ls: L.ls || 0 }, L.box === 'full' && !L.bcol ? contrast(col) : col); } };
  }
  if (L.type === 'stat') {
    const v = statValue(d, doc, L.stat), lab = STATS[L.stat][1], base = STAT_SIZE[L.stat], ko = HAN.test(v);
    const fam = L.font ? famOf(L.font) : ko ? PRE_ : ARC_, w = wOf(L.font, L.w || 700), col = L.col || '#ffffff', acc = accentOf(d), m = STORY_MAT[d.key];
    if (L.v === 4) { // label-only element (e.g. '5K 기록', '페이스'): derived from the result, styled/moved on its own
      const lb = L.lab != null && L.lab !== '' ? L.lab : statLabel(d, L.stat), lfam = L.font ? fam : PRE_, lw = L.font ? w : 600;
      const B = textBlock(c, [{ t: lb, size: base * (L.labK ?? .2) }], { size: base * (L.labK ?? .2), fam: lfam, w: lw, ls: L.ls || 0, lh: L.lh ?? 1 });
      const sz = base * (L.labK ?? .2), pd = L.box && L.box !== 'none' ? sz * .4 : 0;
      return { w: B.w + pd * 2, h: B.h + pd * 1.4, draw: () => { boxBehind(c, B.w, B.h, L.box, col, pd, sz * .3, L); drawTextBlock(c, B, { al: L.al || 'left', w: lw, fam: lfam, ls: L.ls || 0 }, L.box === 'full' && !L.bcol ? contrast(col) : col); } }; }
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
      return { w: B.w + extra + pd * 2, h: B.h + pd * 1.4, draw: () => { boxBehind(c, B.w + extra, B.h, L.box, col, pd, base * .2, L); c.transform(1, 0, sk, 1, 0, 0); drawTextBlock(c, B, { al: L.al || 'left', w: vw, fam: vfam, ls: L.ls ?? (ko ? 0 : -2) }, L.box === 'full' && !L.bcol ? contrast(col) : col); } };
    }
    const lines = vt === 0 ? [{ t: L.stat === 'event' ? v : lab, size: Math.max(22, base * .26), fam: ARC_, w: 600, st: 'expanded', ls: 6, alpha: .8 }, { t: v, size: base, gap: base * .05, w: VW, st: VST }] : [{ t: v, size: base, w: VW, st: VST }];
    if (vt === 0 && L.stat === 'event') lines.shift();
    const B = textBlock(c, lines, { size: base, fam, w, ls: L.ls || 0, lh: L.lh ?? 1.1, st: !L.font && !ko && L.stat !== 'next' ? 'semi-expanded' : 'normal' });
    const pad = vt === 2 ? base * .32 : L.box && L.box !== 'none' ? base * .3 : 0;
    return { w: B.w + pad * 2 + Math.abs(SK) * B.h, h: B.h + pad * 1.4, draw: () => {
      if (vt === 2) { rr(c, -B.w / 2 - pad, -B.h / 2 - pad * .7, B.w + pad * 2, B.h + pad * 1.4, (B.h + pad * 1.4) / 2); const g = c.createLinearGradient(-B.w / 2, 0, B.w / 2, 0); m.s.forEach((s, i) => g.addColorStop(i / (m.s.length - 1), s)); c.save(); c.fillStyle = L.bcol || (L.col ? col : g); c.globalAlpha *= L.bo ?? 1; c.fill(); c.restore(); drawTextBlock(c, B, { al: 'center', w, fam, ls: L.ls || 0, st: 'normal' }, L.bcol ? (L.col ? col : contrast(L.bcol)) : L.col ? contrast(col) : m.ink); return; }
      boxBehind(c, B.w, B.h, L.box, L.col || acc, pad, base * .25, L);
      if (SK) c.transform(1, 0, SK, 1, 0, 0); drawTextBlock(c, B, { al: L.al || 'center', w, fam, ls: L.ls || 0 }, L.box === 'full' && !L.bcol ? contrast(L.col || acc) : col); } };
  }
  if (L.type === 'card') {
    if (L.v === 1) { const lab = d.word + (d.roman ? ' ' + d.roman : ''); font(c, 44, 800, ARC_, 'expanded'); const tw = c.measureText(lab).width, w = tw + 120, h = 96, m = STORY_MAT[d.key];
      return { w, h, draw: () => { rr(c, -w / 2, -h / 2, w, h, h / 2); const g = c.createLinearGradient(-w / 2, 0, w / 2, 0); m.s.forEach((s, i) => g.addColorStop(i / (m.s.length - 1), s)); c.fillStyle = g; c.fill(); c.fillStyle = m.ink; font(c, 44, 800, ARC_, 'expanded'); c.textBaseline = 'middle'; c.textAlign = 'center'; c.fillText(lab, 0, 3); c.textBaseline = 'alphabetic'; c.textAlign = 'left'; } }; }
    const w = 900, h = Math.round(900 / 1.586); return { w, h, draw: () => drawCard(c, { ...d, who: '' }, -w / 2, -h / 2, w, h) };
  }
  if (L.type === 'photo') {
    const im = photoSrc(photos, L.pid, L); const ar = im ? im.width / im.height : 1, bw = L.bw || (ar >= 1 ? 640 : 640 * ar), bh = L.bh || (ar >= 1 ? 640 / ar : 640);
    const pol = L.mask === 'polaroid', w = pol ? bw + 48 : bw, h = pol ? bh + 150 : bh;
    return { w, h, draw: () => {
      if (pol) { c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 30; c.shadowOffsetY = 12; c.fillStyle = '#fbfaf6'; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }
      const ox = -bw / 2, oy = pol ? -h / 2 + 24 : -bh / 2;
      const shp = () => { c.beginPath(); if (L.mask === 'circle') c.ellipse(0, oy + bh / 2, bw / 2, bh / 2, 0, 0, 7); else c.roundRect(ox, oy, bw, bh, L.mask === 'round' ? 48 : 0); };
      if (L.psh && !L.cut) { c.save(); c.shadowOffsetX = L.psh[0]; c.shadowOffsetY = L.psh[1]; c.shadowBlur = L.psh[2]; c.shadowColor = L.psh[3]; shp(); c.fillStyle = '#000'; c.fill(); c.restore(); }
      c.save(); c.beginPath(); if (L.cut) c.rect(ox - bw, oy - bh, bw * 3, bh * 3); else if (L.mask === 'circle') c.ellipse(0, oy + bh / 2, bw / 2, bh / 2, 0, 0, 7); else c.roundRect(ox, oy, bw, bh, L.mask === 'round' ? 48 : 0); c.clip();
      if (im) { const src = im, cz = Math.max(1, L.cz || 1), sc = Math.max(bw / im.width, bh / im.height) * cz, iw = im.width * sc, ih = im.height * sc;
        const mx = (iw - bw) / 2, my = (ih - bh) / 2; if (L.cut) { const dw = bw * cz, dh = bh * cz; c.drawImage(src, ox + (bw - dw) / 2 + (L.cx || 0) * (dw - bw) / 2, oy + (bh - dh) / 2 + (L.cy || 0) * (dh - bh) / 2, dw, dh); } else c.drawImage(src, ox - mx + (L.cx || 0) * mx, oy - my + (L.cy || 0) * my, iw, ih); }
      else { const g = c.createLinearGradient(ox, oy, ox + bw * .4, oy + bh); g.addColorStop(0, '#6f7a86'); g.addColorStop(1, '#2a323c'); c.fillStyle = pol ? '#dcd8cf' : g; c.fillRect(ox, oy, bw, bh); c.fillStyle = pol ? '#6b6a66' : 'rgba(255,255,255,.75)'; c.textAlign = 'center'; font(c, Math.max(28, Math.min(44, bw / 14)), 600, PRE_); c.fillText('📷 사진 넣기', 0, oy + bh / 2 + 14); c.textAlign = 'left'; }
      c.restore(); if (L.bd && !L.cut) { c.save(); shp(); c.lineWidth = L.bd[0] * 2; c.strokeStyle = L.bd[1]; c.clip(); c.stroke(); c.restore(); } } };
  }
  if (L.type === 'sticker') return sticker(c, L, d);
  if (L.type === 'shape' && L.k === 'box') { const w = L.w, h = L.h;
    return { w, h, draw: () => { if (L.sh) { c.save(); c.shadowOffsetX = L.sh[0]; c.shadowOffsetY = L.sh[1]; c.shadowBlur = L.sh[2]; c.shadowColor = L.sh[3]; c.fillStyle = '#000'; c.fillRect(-w / 2, -h / 2, w, h); c.restore(); }
      const g = cssFill(c, L.fill, w, h); if (g && g.__ry && g.__ry !== 1) { c.save(); c.beginPath(); c.rect(-w / 2, -h / 2, w, h); c.clip(); c.translate(g.__c[0], g.__c[1]); c.scale(1, g.__ry); c.translate(-g.__c[0], -g.__c[1]); c.fillStyle = g; c.fillRect(-w * 2, -h * 2 / g.__ry, w * 4, h * 4 / g.__ry); c.restore(); } else { c.fillStyle = g; c.fillRect(-w / 2, -h / 2, w, h); } } }; }
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
let LOGO_C = null;
const LOGO_TINT = new Map();
function logoCanvas() { if (LOGO_C) return LOGO_C; const K = 4, cv = document.createElement('canvas'); cv.width = 470 * K; cv.height = 122 * K; const g = cv.getContext('2d'); g.scale(K, K); g.translate(40, 4); g.transform(1, 0, Math.tan(-14 * Math.PI / 180), 1, 0, 0);
  g.strokeStyle = g.fillStyle = '#ffffff'; g.lineWidth = 16; const st = d => g.stroke(new Path2D(d)), ring = (x) => { g.beginPath(); g.arc(x, 70, 22, 0, Math.PI * 2); g.stroke(); };
  st('M8 6V100M8 70Q8 40 30 40Q52 40 52 70V100'); st('M224 6V100M224 70Q224 40 246 40Q268 40 268 70V100'); st('M340 40V100'); st('M412 40V100'); [102, 174, 318, 390].forEach(ring);
  g.beginPath(); g.roundRect ? g.roundRect(95.18, 28.56, 13.64, 9.24, 1.848) : g.rect(95.18, 28.56, 13.64, 9.24); g.fill(); g.fillRect(98.9992, 37.36, 6.0016, 4.4);
  g.beginPath(); g.arc(102, 70, 22, 0, Math.PI * 2); g.fill(); // stopwatch face filled, hand cut out
  g.globalCompositeOperation = 'destination-out'; g.lineWidth = 7; g.lineCap = 'round'; g.beginPath(); g.moveTo(102, 70); g.lineTo(113.81, 63.18); g.stroke(); g.beginPath(); g.arc(102, 70, 5.95, 0, Math.PI * 2); g.fill();
  return (LOGO_C = cv); }
function logoTint(col) { const key = col || '#ffffff'; const hit = LOGO_TINT.get(key); if (hit) return hit; const src = logoCanvas(), cv = document.createElement('canvas'); cv.width = src.width; cv.height = src.height; const g = cv.getContext('2d'); g.drawImage(src, 0, 0); g.globalCompositeOperation = 'source-in'; g.fillStyle = key; g.fillRect(0, 0, cv.width, cv.height); LOGO_TINT.set(key, cv); return cv; }
const LOGO_TXT = 'hoohaa.run';
function specText(c, L, d, doc) {
  const sp = L.sp, str = L.type === 'stat' ? statValue(d, doc, L.stat, L) : String(L.t || ' '), lines = str.split('\n'), sz = L.size || sp.sz, fk = L.font && FONTS[L.font] ? L.font : 'pretendard';
  const fam = FONTS[fk].fam, w = wOf(fk, sp.wt), ls = L.ls ?? sp.ls ?? 0; font(c, sz, w, fam); c.letterSpacing = ls + 'px';
  const m = c.measureText('Hg가'), asc = m.fontBoundingBoxAscent || sz * .95, desc = m.fontBoundingBoxDescent || sz * .25, lh = (L.lh ?? sp.lh) ? (L.lh ?? sp.lh) * sz : asc + desc;
  const LG = lines.length === 1 && lines[0].endsWith(LOGO_TXT); if (LG) lines[0] = lines[0].slice(0, -LOGO_TXT.length); const lgH = LG ? sz * 1.5 : 0, lgW = lgH * 470 / 122;
  const ink = lines.map(t => { const m3 = c.measureText(t); return LG || !t.trim() ? [0, m3.width] : [m3.actualBoundingBoxLeft, m3.actualBoundingBoxLeft + m3.actualBoundingBoxRight]; }); // ink box: margins measured to the glyphs, not the advance
  const lw = lines.map((t, i) => ink[i][1] + (LG ? lgW : 0)); c.letterSpacing = '0px'; const W = Math.max(1, ...lw), H = Math.max(lh * lines.length, lgH), bx = L.box && L.box !== 'none', pad = bx ? sz * .3 : 0, col0 = L.col || '#ffffff', col = L.box === 'full' && !L.bcol ? contrast(col0) : col0, al = sp.al || 'left';
  return { w: W + pad * 2, h: H + pad * 1.4, draw: () => { if (bx) boxBehind(c, W, H, L.box, col0, pad, sz * .28, L); font(c, sz, w, fam); c.letterSpacing = ls + 'px'; c.textBaseline = 'alphabetic'; c.textAlign = 'left'; c.fillStyle = col;
    lines.forEach((t, i) => { const x = -W / 2 + ink[i][0] + (al === 'center' ? (W - lw[i]) / 2 : al === 'right' ? W - lw[i] : 0), y = (() => { const m2 = c.measureText(t.trim() ? t : 'H'), a = m2.actualBoundingBoxAscent ?? asc * .75, d = m2.actualBoundingBoxDescent ?? 0; return -H / 2 + i * lh + lh / 2 + (a - d) / 2; })();
      if (sp.ul) { c.save(); c.fillStyle = sp.ul[0]; c.fillRect(x, y + sp.ul[2], lw[i] - ls, sp.ul[1]); c.restore(); }
      if (t) fxText(c, t, x, y, sz, col);
      if (LG) { c.save(); c.globalAlpha *= .92; const sh = L.fsh; if (Array.isArray(sh)) { c.shadowOffsetX = sh[0]; c.shadowOffsetY = sh[1]; c.shadowBlur = sh[2]; c.shadowColor = sh[3]; } c.drawImage(logoTint(col), x + lw[i] - lgW, -lgH / 2, lgW, lgH); c.restore(); } }); c.letterSpacing = '0px'; } }; }
// css-like fills for template boxes: colour, linear-gradient(angle), radial-gradient(ellipse|circle at x% y%) (farthest-corner)
function cssFill(c, f, w, h) { if (!f || typeof f === 'string') return f || '#000';
  let g; if (f.t === 'lin') { const a = f.a * Math.PI / 180, dx = Math.sin(a), dy = -Math.cos(a), len = Math.abs(w * dx) + Math.abs(h * dy); g = c.createLinearGradient(-dx * len / 2, -dy * len / 2, dx * len / 2, dy * len / 2); }
  else { const cx = -w / 2 + f.cx * w, cy = -h / 2 + f.cy * h, fx = Math.max(f.cx, 1 - f.cx) * w, fy = Math.max(f.cy, 1 - f.cy) * h; const r = f.sh === 'circle' ? Math.hypot(fx, fy) : fx * Math.SQRT2; g = c.createRadialGradient(cx, cy, 0, cx, cy, r); g.__ry = f.sh === 'circle' ? 1 : (fy * Math.SQRT2) / Math.max(1, r); g.__c = [cx, cy]; }
  for (const [p, col] of f.st) g.addColorStop(Math.max(0, Math.min(1, p)), col); return g; }
// ---- stickers: 26 static (designer SVG, rasterised once) + data stickers drawn live (user-typed fields) ----
const simg = new Map();
function stkLoad(k) { const svg = STK_SVG[k] || (k.startsWith('data_') ? dataArt(k, {}) : null); if (!svg) return Promise.resolve(null); return imgOf(svg); }
function imgOf(svg) { if (!simg.has(svg)) simg.set(svg, new Promise(res => { const im = new Image(); im.onload = () => { simg.set(svg, im); res(im); }; im.onerror = () => res(null); im.src = 'data:image/svg+xml;charset=utf-8,' + encodeURIComponent(svg); })); const v = simg.get(svg); return v instanceof Promise ? v : Promise.resolve(v); }
const imgNow = svg => { const v = simg.get(svg); return v && !(v instanceof Promise) ? v : null; };
const INK = '#1B1B1F', LIME = '#D7FF3A', ORG = '#FF7A3D', SKY = '#7FC8FF', YEL = '#FFD84A', PINK = '#FF8FB8';
const SV = b => `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512" width="512" height="512">${b}</svg>`;
const cloud = (cx, cy, sc = 1, fill = '#fff') => `<path transform="translate(${cx} ${cy}) scale(${sc})" d="M-80 40 a42 42 0 0 1 8 -82 a58 58 0 0 1 108 -6 a40 40 0 0 1 44 88z" fill="${fill}" stroke="${INK}" stroke-width="${(10 / sc).toFixed(1)}" stroke-linejoin="round"/>`;
const sun = (cx, cy, r = 70) => `<circle cx="${cx}" cy="${cy}" r="${r}" fill="${YEL}" stroke="${INK}" stroke-width="10"/>` + [...Array(8)].map((_, i) => { const a = i * Math.PI / 4; return `<path d="M${(cx + (r + 20) * Math.cos(a)).toFixed(0)} ${(cy + (r + 20) * Math.sin(a)).toFixed(0)} L${(cx + (r + 38) * Math.cos(a)).toFixed(0)} ${(cy + (r + 38) * Math.sin(a)).toFixed(0)}" stroke="${INK}" stroke-width="10" stroke-linecap="round"/>`; }).join('');
const WICON = { sun: sun(160, 200, 58), cloud: cloud(175, 215, 1, '#EEF2F7'), partly: sun(140, 175, 42) + cloud(185, 240, .85), rain: cloud(175, 190, 1, '#E3EAF3') + [135, 180, 225].map(x => `<path d="M${x} 262 l-12 30" stroke="${SKY}" stroke-width="12" stroke-linecap="round"/>`).join(''), snow: cloud(175, 190, 1, '#fff') + [[135, 275], [180, 292], [225, 275]].map(([x, y]) => `<g transform="translate(${x} ${y})" stroke="${SKY}" stroke-width="7" stroke-linecap="round"><path d="M-12 0h24M-6 -10l12 20M6 -10l-12 20"/></g>`).join(''), night: `<path d="M175 110 a90 90 0 1 0 60 150 a75 75 0 1 1 -60 -150z" fill="${YEL}" stroke="${INK}" stroke-width="10" stroke-linejoin="round"/><path d="M90 130 l6 14 14 6 -14 6 -6 14 -6-14 -14-6 14-6z" fill="#fff" stroke="${INK}" stroke-width="4"/>` };
const WBG = { sun: '#fff', cloud: '#fff', partly: '#fff', rain: '#F1F6FC', snow: '#F5F8FF', night: '#262B5E' };
const WEATHER = [['sun', '맑음'], ['partly', '구름 조금'], ['cloud', '흐림'], ['rain', '비'], ['snow', '눈'], ['night', '밤']];
const DATA_STK = { data_weather: { n: '날씨', f: { icon: 'sun', temp: '12°', label: '맑음 · 바람 약함' } }, data_course: { n: '코스', f: { dist: '10.0 km', name: '반포 → 잠수교' } }, data_bib: { n: '배번', f: { num: '1031', race: 'SEOUL 10K', color: PINK } }, data_memo: { n: '메모', f: { text1: '오늘은 그냥', text2: '기분 좋게 뛰었다 :)', date: '' } } };
const COURSE = 'M100 380 C 120 260, 220 300, 230 200 S 360 120, 410 150 S 420 300, 340 330';
function dataArt(k, f) { const F = { ...DATA_STK[k === 'data_weather' || k.startsWith('data_weather') ? 'data_weather' : k]?.f, ...f };
  if (k.startsWith('data_weather')) { const ic = F.icon || 'sun'; return SV(`<rect x="30" y="80" width="452" height="300" rx="60" fill="${WBG[ic]}" stroke="${INK}" stroke-width="12"/>${WICON[ic]}`); }
  if (k === 'data_course') return SV(`<rect x="30" y="40" width="452" height="432" rx="48" fill="${INK}" fill-opacity=".72"/><path d="${COURSE}" fill="none" stroke="${LIME}" stroke-width="16" stroke-linecap="round" stroke-linejoin="round"/><circle cx="100" cy="380" r="16" fill="#fff" stroke="${INK}" stroke-width="6"/><circle cx="340" cy="330" r="16" fill="${ORG}" stroke="#fff" stroke-width="6"/>`);
  if (k === 'data_bib') { const col = F.color || PINK; return SV(`<g transform="rotate(-4 256 256)"><rect x="50" y="100" width="412" height="312" rx="22" fill="#fff" stroke="${INK}" stroke-width="12"/><rect x="50" y="100" width="412" height="74" rx="22" fill="${col}"/><rect x="50" y="150" width="412" height="24" fill="${col}"/>${[[86, 126], [426, 126], [86, 386], [426, 386]].map(([x, y]) => `<circle cx="${x}" cy="${y}" r="10" fill="#ddd" stroke="${INK}" stroke-width="5"/>`).join('')}</g>`); }
  if (k === 'data_memo') return SV(`<g transform="rotate(-3 256 256)"><rect x="70" y="90" width="372" height="340" fill="#FFF3A8" stroke="${INK}" stroke-width="8"/><rect x="200" y="70" width="112" height="44" fill="#fff" fill-opacity=".7" stroke="${INK}" stroke-width="4" transform="rotate(4 256 92)"/>${[220, 290, 360].map(y => `<path d="M100 ${y} h312" stroke="#E2CF6A" stroke-width="3"/>`).join('')}</g>`);
  return null; }
const dataFields = L => ({ ...DATA_STK[L.k.startsWith('data_weather') ? 'data_weather' : L.k]?.f, ...(L.k.startsWith('data_weather_') && !(L.f && L.f.icon) ? { icon: L.k.slice(13) } : {}), ...(L.f || {}) });
const dtext = (c, t, x, y, sz, fam, w, col, anchor = 'center', ls = 0) => { font(c, sz, w, fam); c.letterSpacing = ls + 'px'; c.fillStyle = col; c.textAlign = anchor === 'start' ? 'left' : anchor === 'end' ? 'right' : 'center'; c.textBaseline = 'alphabetic'; c.fillText(t, x, y); c.letterSpacing = '0px'; c.textAlign = 'left'; };
function v4Sticker(c, L) { const k = L.k, data = k.startsWith('data_'), F = data ? dataFields(L) : null, svg = data ? dataArt(k, F) : STK_SVG[k]; if (!svg) return null;
  return { w: 512, h: 512, draw: () => { const im = imgNow(svg); if (im) c.drawImage(im, -256, -256, 512, 512); if (!data) return; c.save(); c.translate(-256, -256);
    const A = FONTS.anton.fam, K = FONTS.kodemono ? FONTS.kodemono.fam : FONTS.mono.fam, Pf = FONTS.pretendard.fam, G = FONTS.gaegu ? FONTS.gaegu.fam : Pf;
    if (k.startsWith('data_weather')) { const ink = F.icon === 'night' ? '#fff' : INK; dtext(c, String(F.temp || '').slice(0, 5), 370, 250, 120, A, 400, ink); dtext(c, String(F.label || '').slice(0, 16), 256, 345, 40, Pf, 700, ink); }
    else if (k === 'data_course') { dtext(c, F.dist || '', 60, 110, 44, K, 700, '#fff', 'start'); dtext(c, String(F.name || '').slice(0, 18), 60, 440, 32, Pf, 700, '#fff', 'start'); }
    else if (k === 'data_bib') { c.translate(256, 256); c.rotate(-4 * Math.PI / 180); c.translate(-256, -256); dtext(c, String(F.race || '').slice(0, 18), 256, 150, 40, A, 400, '#fff', 'center', 4); dtext(c, String(F.num || '').slice(0, 5), 256, 320, 140, A, 400, INK); dtext(c, 'hoohaa · RUNNER', 256, 382, 30, K, 400, INK, 'center', 3); }
    else if (k === 'data_memo') { c.translate(256, 256); c.rotate(-3 * Math.PI / 180); c.translate(-256, -256); dtext(c, String(F.text1 || '').slice(0, 14), 105, 205, 46, G, 700, INK, 'start'); dtext(c, String(F.text2 || '').slice(0, 16), 105, 275, 40, G, 700, INK, 'start'); dtext(c, F.date || ymd().slice(5), 400, 400, 36, G, 700, ORG, 'end'); }
    c.restore(); } }; }
function sticker(c, L, d) {
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
function bgDraw(c, doc, d, photos) {
  const b = doc.bg || { type: 'tier' };
  if (b.type === 'solid') { c.fillStyle = b.c1 || '#0F1620'; c.fillRect(0, 0, W_, H_); }
  else if (b.type === 'grad') { const g = c.createLinearGradient(0, 0, W_ * .35, H_); g.addColorStop(0, b.c1); g.addColorStop(1, b.c2); c.fillStyle = g; c.fillRect(0, 0, W_, H_); }
  else if (b.type === 'dark') { c.fillStyle = '#0F1620'; c.fillRect(0, 0, W_, H_); const m = STORY_MAT[d.key], tint = m.glow || 'rgba(255,255,255,.06)', rg = c.createRadialGradient(W_ / 2, 700, 0, W_ / 2, 700, 900); rg.addColorStop(0, tint.replace(/[\d.]+\)$/, '0.22)')); rg.addColorStop(1, 'rgba(15,22,32,0)'); c.fillStyle = rg; c.fillRect(0, 0, W_, H_); }
  else if (b.type === 'photo' && photos[b.pid] && !b.cut) { const im = b.filter && !hasPE({ ...b, filter: 0 }) ? filtered(photos[b.pid], b.filter, b.pid) : photoSrc(photos, b.pid, b);
    c.fillStyle = '#0F1620'; c.fillRect(0, 0, W_, H_); c.drawImage(im, ...bgRect(b, im)); }
  else if (b.type === 'tone' || b.type === 'photo') { const m = STORY_MAT[d.key], g = c.createLinearGradient(0, 0, W_ * .3, H_); g.addColorStop(0, '#6f7a86'); g.addColorStop(.5, '#3c4652'); g.addColorStop(1, '#1d232b'); c.fillStyle = g; c.fillRect(0, 0, W_, H_);
    const rg = c.createRadialGradient(W_ * .75, H_ * .28, 0, W_ * .75, H_ * .28, H_ * .6); rg.addColorStop(0, alpha(m.s[0], .28)); rg.addColorStop(1, alpha(m.s[0], 0)); c.fillStyle = rg; c.fillRect(0, 0, W_, H_);
    const lg = c.createRadialGradient(W_ * .2, H_ * .85, 0, W_ * .2, H_ * .85, H_ * .5); lg.addColorStop(0, 'rgba(255,255,255,.10)'); lg.addColorStop(1, 'rgba(255,255,255,0)'); c.fillStyle = lg; c.fillRect(0, 0, W_, H_); }
  else tierBg(c, d);
  if (b.type === 'photo' && photos[b.pid] && b.cut) { const im = photoSrc(photos, b.pid, b); c.drawImage(im, ...bgRect(b, im)); } // 배경 지우기: only the person, over a plain tone
}
// bg photo geometry (shared by background + subject cut-out so they line up exactly)
function bgRect(b, im) { const sc = Math.max(W_ / im.width, H_ / im.height) * (b.pz || 1), iw = im.width * sc, ih = im.height * sc, mx = (iw - W_) / 2, my = (ih - H_) / 2; return [-mx + Math.max(-1, Math.min(1, b.px || 0)) * mx, -my + Math.max(-1, Math.min(1, b.py || 0)) * my, iw, ih]; }
function subjectLayer(doc, photos) { const b = doc.bg, im = b.type === 'photo' && photos[b.pid], mk2 = im && photos['mask:' + b.pid]; if (!mk2) return null;
  const cut = photoSrc(photos, b.pid, { ...b, cut: true }); return [cut, bgRect(b, cut)]; }
const PRE_FONTS = ['400 40px "OV Bebas"', '400 40px "OV Anton"', '800 40px "OV Playfair"', '700 40px "OV Mono"', '400 40px "OV BlackHan"', '800 40px "TC Archivo"', '300 40px "TC Archivo"', '600 40px "TC Archivo"', '700 40px "TC Pretendard"', '500 40px "TC Pretendard"', '600 40px "TC Pretendard"'];
// effective transform: 상위 % is clamped so it can never become small or invisible
const isTopL = L => L.type === 'stat' && L.stat === 'top' && L.v !== 4;
function eff(L, g) { if (L.type === 'stat' && L.stat === 'top' && L.v !== 4) { const minS = TOP_MIN_PX / Math.max(1, g.h); return { ...L, s: Math.max(L.s, minS), o: Math.max(L.o ?? 1, .9), hidden: false }; } return L; }
async function renderDoc(d, doc, photos = {}, cv) {
  await document.fonts.ready; await Promise.all(PRE_FONTS.map(f => document.fonts.load(f, 'A가').catch(() => { })));
  await Promise.all([...new Set(doc.layers.map(l => l.font).filter(Boolean))].map(loadFont));
  if (doc.layers.some(l => l.type === 'card')) await Promise.all([chipLoad(d.key), cardFontsReady()]);
  await Promise.all(doc.layers.filter(l => l.type === 'sticker').map(l => stkLoad(l.k, l))); await Promise.all(doc.layers.filter(l => l.type === 'sticker' && l.k.startsWith('data_')).map(l => imgOf(dataArt(l.k, dataFields(l)))));
  { const txt = doc.layers.map(l => l.type === 'text' ? (l.t || '') : l.type === 'stat' ? statValue(d, doc, l.stat, l) + (l.lab || statLabel(d, l.stat)) : l.f ? Object.values(l.f).join('') : '').join('') + (doc.race || '');
    const fk = []; if (needFull(txt)) fk.push('pretendardk'); if (doc.layers.some(l => l.font === 'blackhan' || (l.sp && l.sp.f === 'blackhan')) && needFull(txt, true)) fk.push('blackhank'); await Promise.all(fk.map(loadFont)); }
  setH_(fmtH(doc.fmt)); cv = cv || document.createElement('canvas'); cv.width = W_; cv.height = H_; const c = cv.getContext('2d');
  c.setTransform(1, 0, 0, 1, 0, 0); c.globalAlpha = 1; bgDraw(c, doc, d, photos);
  const boxes = [], subj = doc.layers.some(l => l.behind && !l.hidden) ? subjectLayer(doc, photos) : null;
  const order = subj ? [...doc.layers.filter(l => l.behind), null, ...doc.layers.filter(l => !l.behind)] : doc.layers;
  cv.__subject = !!subj;
  // shared layout: every stat row is one size — the row shrinks together until its widest value fits its equal-width column
  const rowS = {}, rowX = {}, RW = {}; { const G = {}; for (const l of doc.layers) if (l.row && !l.mv && l.af !== false && !l.hidden) (G[l.row.g] = G[l.row.g] || []).push(l);
    for (const [g, ms] of Object.entries(G)) { const n = ms[0].row.n, col = (W_ - 2 * MARGIN - (n - 1) * COL_GAP) / n; let f = 1; for (const l of ms) { c.save(); const gg = layerGeom(c, l, d, doc, photos); c.restore(); RW[l.id] = gg; f = Math.min(f, col / Math.max(1, gg.w)); } rowS[g] = f; }
    const kf = {}; for (const [g, ms] of Object.entries(G)) { const k = ms[0].row.k + ms[0].row.n; kf[k] = Math.min(kf[k] ?? 1, rowS[g]); } for (const [g, ms] of Object.entries(G)) rowS[g] = kf[ms[0].row.k + ms[0].row.n];
    // 상위 % never drops below TOP_MIN_PX: the whole row grows with it; if that overflows the equal columns, the row spreads (space-between) instead
    for (const [g, ms] of Object.entries(G)) { const t = ms.find(isTopL); if (t) rowS[g] = Math.max(rowS[g], TOP_MIN_PX / Math.max(1, RW[t.id].h));
      const n = ms[0].row.n, f = rowS[g], col = (W_ - 2 * MARGIN - (n - 1) * COL_GAP) / n, srt = [...ms].sort((a, b) => a.row.i - b.row.i);
      if (n > 2 && srt.length === n && srt.some(l => RW[l.id].w * f > col + .5)) { const tot = srt.reduce((a, l) => a + RW[l.id].w * f, 0), gap = (W_ - 2 * MARGIN - tot) / (n - 1); let x = MARGIN; for (const l of srt) { const w = RW[l.id].w * f; if (l.row.i > 0 && l.row.i < n - 1) rowX[l.id] = x + w / 2; x += w + gap; } } } }
  for (const L0 of order) {
    if (L0 === null) { c.drawImage(subj[0], ...subj[1]); continue; }
    c.save(); const g = layerGeom(c, L0, d, doc, photos), L = { ...eff(L0, g) }; c.restore();
    if (L.row && !L0.mv && L0.af !== false && rowS[L.row.g] != null) { L.s = rowS[L.row.g]; if (rowX[L.id] != null) L.x = rowX[L.id]; }
    else if (L.af && !(L.r)) { // template auto-fit: keep drawn bounds (incl. slant) inside ~6% safe margins until the user resizes it
      const M = L.sp ? MARGIN : 65, MY = L.sp ? 24 : 40, vw = L.vert ? g.h : g.w, vh = L.vert ? g.w : g.h, aw = L.ax === 'left' ? W_ - M - L.x : L.ax === 'right' ? L.x - M : 2 * Math.min(L.x - M, W_ - M - L.x), ah = L.ay === 'top' ? H_ - MY - L.y : L.ay === 'bottom' ? L.y - MY : 2 * Math.min(L.y - MY, H_ - MY - L.y);
      const fs = Math.min(aw / Math.max(1, vw), ah / Math.max(1, vh)); if (fs > 0 && fs < L.s) L.s = isTopL(L) ? Math.max(fs, TOP_MIN_PX / Math.max(1, g.h)) : fs; }
    { const vw = L.vert ? g.h : g.w, vh = L.vert ? g.w : g.h; if (L.ax === 'left') L.x += vw * L.s / 2; else if (L.ax === 'right') L.x -= vw * L.s / 2; if (L.ay === 'top') L.y += vh * L.s / 2; else if (L.ay === 'bottom') L.y -= vh * L.s / 2; }
    boxes.push({ id: L.id, x: L.x, y: L.y, s: L.s, r: L.r, w: g.w, h: g.h, type: L.type, stat: L.stat, v: L.v, hidden: !!L.hidden, nh: !!L.nh, k: L.k, sid: L.sid });
    if (L.hidden) continue;
    c.save(); c.translate(L.x, L.y); c.rotate(L.r || 0); c.scale(L.s, L.s); c.globalAlpha = L.o ?? 1; FX = L.type === 'text' || L.type === 'stat' ? L : null; g.draw(); FX = null; c.restore();
  }
  cv.__boxes = boxes; return cv;
}
// ---- templates (10+): pre-arranged layer bundles ----
const TEMPLATES = Object.entries(TPL_NAMES);
// designer handoff → layers: every value/label is its own element; values are result tokens (never typed); positions are per format (spec px)
function templateDoc(t, d, fmt = 'story') {
  if (!TPL_SPEC[t]) t = 'nrc'; const els = TPL_SPEC[t][fmt || 'story'] || TPL_SPEC[t].story, W = 1080, H = fmtH(fmt === 'story' ? undefined : fmt);
  const doc = { tpl: t, bg: { type: 'tone' }, race: '', layers: [], fmt: fmt === 'story' ? undefined : fmt }; let cutAt = els.findIndex(e => e.k === 'cut');
  const Y = (e, h) => e.y != null ? e.y + h / 2 : H - e.yb - h / 2;
  els.forEach((e, i) => { const rad = (e.r || 0) * Math.PI / 180;
    if (e.k === 'img' && e.w === 'full' && e.h === 'full') { doc.bgT = { px: 1 - 2 * e.pos[0], py: 1 - 2 * e.pos[1], ...(e.adj ? { adj: e.adj } : {}) }; return; }
    if (e.k === 'box' && e.w === 'full' && e.h === 'full' && typeof e.fill === 'string' && e.y === 0) { doc.bg = { type: 'solid', c1: e.fill }; return; }
    if (e.k === 'cut') { if (e.ol) doc.bgT = { ...(doc.bgT || {}), ol: { on: true, col: e.ol, w: 5 } }; return; }
    let L;
    if (e.k === 'box') { const w = e.w === 'full' ? W : e.w, h = e.h === 'full' ? H : e.h; L = mk('shape', { k: 'box', w, h, fill: e.fill, sh: e.sh || undefined, x: e.x + w / 2, y: Y(e, h), r: rad, nh: e.w === 'full' && e.h === 'full' ? 1 : undefined }); }
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
const MARGIN = 72, COL_GAP = 32;
const FMT_K = { story: 1, feed: .8, square: .66 };
const typeScale = fmt => { const k = FMT_K[fmt] || 1; return { val: Math.round(64 * k), sub: Math.round(40 * k), lab: Math.round(26 * k), meta: Math.round(26 * k) }; };
function normLayout(doc, els, fmt, W) {
  const TS = typeScale(fmt), byId = id => doc.layers.find(l => l.sid === id), side = e => e.y != null ? 't' : 'b', yv = e => e.y != null ? e.y : e.yb, xv = e => e.right != null ? W - e.right : e.x;
  const cand = els.filter(e => e.k === 'text' && !e.vert && e.w !== 'full' && !e.r && e.sz <= 130), cl = [];
  for (const e of cand) { const g = cl.find(q => q.s === side(e) && Math.abs(q.y - yv(e)) <= 24); if (g) g.m.push(e); else cl.push({ s: side(e), y: yv(e), m: [e] }); }
  const rows = cl.filter(q => { const xs = q.m.map(xv).sort((a, b) => a - b); return xs.length >= 2 && xs.every((x, i) => !i || x - xs[i - 1] > 150); });
  const inRow = new Set(); rows.forEach((q, gi) => { const m = q.m.sort((a, b) => xv(a) - xv(b)), n = m.length, mx = Math.max(...m.map(e => e.sz)) / (FMT_K[fmt] || 1), sz = mx <= 35 ? TS.lab : mx < 56 ? TS.sub : TS.val, y0 = q.s === 't' ? Math.min(...m.map(yv)) : Math.min(...m.map(yv));
    m.forEach((e, i) => { const L = byId(e.id); if (!L) return; inRow.add(L); const al = n > 1 && i === 0 ? 'left' : i === n - 1 ? 'right' : 'center';
      L.sp = { ...L.sp, sz, al }; if (L.type === 'text') L.size = sz; L.row = { g: fmt + gi, i, n, k: sz === TS.lab ? 'lab' : sz === TS.sub ? 'sub' : 'val' };
      if (al === 'left') { L.ax = 'left'; L.x = MARGIN; } else if (al === 'right') { L.ax = 'right'; L.x = W - MARGIN; } else { delete L.ax; L.x = MARGIN + (W - 2 * MARGIN) * (i + .5) / n; }
      L.y = q.s === 't' ? y0 : fmtH(fmt === 'story' ? undefined : fmt) - y0; }); q.lab = m.every(e => byId(e.id) && byId(e.id).row.k === 'lab'); q.y0 = y0; });
  // top-anchored value rows sit on their label row (fixed gap), so shrinking a row never opens a hole above the labels
  for (const q of rows) { if (q.lab || q.s !== 't') continue; const lr = rows.find(r => r.lab && r.s === 't' && r.m.length === q.m.length && r.y0 > q.y0 && r.y0 - q.y0 < 220); if (!lr) continue;
    for (const e of q.m) { const L = byId(e.id); if (L) { L.ay = 'bottom'; L.y = lr.y0 - Math.round(8 * (FMT_K[fmt] || 1)); } } }
  for (const L of doc.layers) { if (inRow.has(L) || !L.sp || L.vert) continue; if (L.sp.sz <= 34 * (FMT_K[fmt] || 1) + 2 && L.sp.sz < 36) { L.sp = { ...L.sp, sz: TS.meta }; if (L.type === 'text') L.size = TS.meta; }
    if (L.sp.sz < 150) { if (L.ax === 'left' && L.x >= 30 && L.x <= 110) L.x = MARGIN; if (L.ax === 'right' && W - L.x >= 30 && W - L.x <= 110) L.x = W - MARGIN; } }
}
// ================= share-image editor v3 (story-style free layers) =================
const clone = o => JSON.parse(JSON.stringify(o));
const MAX_PHOTOS = 12, PCV = { W: 1080, H: 1920 };
const bgImg = () => photoSrc(photos, doc.bg.pid, doc.bg) || photos[doc.bg.pid];
const FH = () => fmtH(doc && doc.fmt); let safeOn = false, cropSt = null, moreFx = false, moreAdj = false;
let multi = new Set(), multiSnap = null, fineP = matchMedia('(hover: hover) and (pointer: fine)').matches;
let doc = null, photos = {}, sel = null, boxes = [], mode = null, libOpen = false, fontCat = 'all', pickMode = false, guides = null, trashHot = false, dragging = false;
const favs = () => LS('runtier:fontfav') || [], recents = () => LS('runtier:fontrecent') || [];
window.__doc = () => clone(doc); window.__boxes = () => clone(boxes); window.__sel = () => sel; window.__inkBounds = async id => { const L = getL(id); const cv = await renderDoc(state.story, { ...doc, bg: { type: 'solid', c1: '#000000' }, layers: [L] }, photos); const d = cv.getContext('2d').getImageData(0, 0, 1080, FH()).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < FH(); y += 2) for (let x = 0; x < 1080; x += 2) { const i = (y * 1080 + x) * 4; if (d[i] + d[i + 1] + d[i + 2] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return { x0, y0, x1, y1 }; };
window.__story = () => clone(state.story); window.__acc = () => accentOf(state.story); window.__photos = () => Object.keys(photos).filter(k => !k.startsWith('mask:')).length; window.__statTexts = () => doc.layers.filter(l => l.type === 'stat').map(l => statValue(state.story, doc, l.stat, l));
// ---- photos stay on the device: IndexedDB only ----
const blobToImg = b => new Promise((res, rej) => { const u = URL.createObjectURL(b), im = new Image(); im.onload = () => res(im); im.onerror = rej; im.src = u; });
async function addPhotoFile(f) { // downscale to ≤1600px, keep on device
  const im = await blobToImg(f), k = Math.min(1, 1600 / Math.max(im.width, im.height)), c = document.createElement('canvas'); c.width = Math.round(im.width * k); c.height = Math.round(im.height * k); c.getContext('2d').drawImage(im, 0, 0, c.width, c.height);
  const pid = 'P' + Date.now().toString(36) + Math.random().toString(36).slice(2, 6); photos[pid] = c;
  c.toBlob(b => b && idb.put(pid, b), 'image/jpeg', .88); return pid; }
// ---- '인물 뒤로': on-device subject segmentation (MediaPipe, Apache-2.0), lazy-loaded only when used ----
const SEG = new URL('/seg/', location.origin).href; let segP = null; const segBusy = new Map();
const getSeg = () => segP || (segP = (async () => { const m = await import(SEG + 'vision_bundle.mjs'); const fs = await m.FilesetResolver.forVisionTasks(SEG.replace(/\/$/, ''));
  return m.ImageSegmenter.createFromOptions(fs, { baseOptions: { modelAssetPath: SEG + 'selfie_segmenter.tflite', delegate: 'CPU' }, runningMode: 'IMAGE', outputConfidenceMasks: true, outputCategoryMask: false }); })().catch(e => { segP = null; throw e; }));
let segErr = ''; // 'load' when the on-device model could not be loaded (offline / blocked), 'none' when no person was found
async function segRun(seg, cv) { const r = seg.segment(cv), m = r.confidenceMasks[0], a = Float32Array.from(m.getAsFloat32Array()), w = m.width, h = m.height; r.close && r.close(); return { a, w, h }; }
function ensureMask(pid) { if (photos['mask:' + pid]) return Promise.resolve(true); if (segBusy.has(pid)) return segBusy.get(pid);
  const pr = (async () => { segErr = ''; const im = photos[pid], t0 = performance.now(); let seg; try { seg = await getSeg(); } catch (e) { segErr = 'load'; throw e; }
    const W = im.width, H = im.height, src = document.createElement('canvas'); src.width = W; src.height = H; src.getContext('2d').drawImage(im, 0, 0);
    let { a, w, h } = await segRun(seg, src); const sx = W / w, sy = H / h;
    // pass 2: re-segment a crop around the person (more model pixels on the subject → cleaner limbs/edges in full-body shots)
    let x0 = w, y0 = h, x1 = -1, y1 = -1, on = 0; for (let y = 0; y < h; y++) for (let x = 0; x < w; x++) if (a[y * w + x] > .5) { on++; if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; }
    if (on < a.length * .01) { segErr = 'none'; throw new Error('no subject'); }
    const bw = x1 - x0 + 1, bh = y1 - y0 + 1;
    if (bw * bh < w * h * .55) { const mx = bw * .18, my = bh * .12, cx0 = Math.max(0, Math.floor((x0 - mx) * sx)), cy0 = Math.max(0, Math.floor((y0 - my) * sy)), cx1 = Math.min(W, Math.ceil((x1 + 1 + mx) * sx)), cy1 = Math.min(H, Math.ceil((y1 + 1 + my) * sy)), cw = cx1 - cx0, ch = cy1 - cy0;
      const cc = document.createElement('canvas'); cc.width = cw; cc.height = ch; cc.getContext('2d').drawImage(src, cx0, cy0, cw, ch, 0, 0, cw, ch); const r2 = await segRun(seg, cc);
      for (let y = Math.floor(cy0 / sy); y < Math.min(h, Math.ceil(cy1 / sy)); y++) for (let x = Math.floor(cx0 / sx); x < Math.min(w, Math.ceil(cx1 / sx)); x++) { const u = Math.min(r2.w - 1, Math.floor((x * sx - cx0) * r2.w / cw)), v = Math.min(r2.h - 1, Math.floor((y * sy - cy0) * r2.h / ch)); if (u >= 0 && v >= 0) a[y * w + x] = Math.max(a[y * w + x] * .35, r2.a[v * r2.w + u]); } }
    const c = document.createElement('canvas'); c.width = w; c.height = h; const g = c.getContext('2d'), id = g.createImageData(w, h); on = 0;
    for (let i = 0; i < a.length; i++) { const v = Math.max(0, Math.min(1, (a[i] - .3) / .4)); id.data[i * 4 + 3] = v * 255; id.data[i * 4] = id.data[i * 4 + 1] = id.data[i * 4 + 2] = 255; if (v > .5) on++; }
    g.putImageData(id, 0, 0); if (on < a.length * .01) { segErr = 'none'; throw new Error('no subject'); }
    // feathered edge at photo resolution (never an empty/near-empty mask: checked above)
    const f = document.createElement('canvas'); f.width = W; f.height = H; const fg = f.getContext('2d'); fg.filter = `blur(${Math.max(1, Math.round(Math.max(W, H) / 900))}px)`; fg.drawImage(c, 0, 0, W, H); fg.filter = 'none';
    photos['mask:' + pid] = f; window.__segMs = Math.round(performance.now() - t0); return true; })().catch(e => { console.warn('segmentation', e); if (!segErr) segErr = 'fail'; return false; }).finally(() => segBusy.delete(pid));
  segBusy.set(pid, pr); return pr; }
const segFailMsg = keep => segErr === 'load' ? '인물 인식 모델을 불러오지 못했어요 · 인터넷 연결을 확인하고 다시 눌러 주세요' : segErr === 'none' ? `인물을 찾지 못했어요 · ${keep}` : `인물 인식에 실패했어요 · ${keep}`;
window.__photos = () => Object.keys(photos).filter(k => !k.startsWith('mask:')).length; window.__statTexts = () => doc.layers.filter(l => l.type === 'stat').map(l => statValue(state.story, doc, l.stat, l));
window.__photoMap = () => photos; window.__mask = () => Object.keys(photos).filter(k => k.startsWith('mask:')).length;
function personPid() { if (doc.bg.type === 'photo' && photos[doc.bg.pid]) return { bg: true, pid: doc.bg.pid };
  const ph = doc.layers.filter(l => l.type === 'photo' && l.pid && photos[l.pid] && !l.hidden).sort((a, b) => (b.w || 1) * (b.h || 1) * b.s * b.s - (a.w || 1) * (a.h || 1) * a.s * a.s)[0]; return ph ? { bg: false, pid: ph.pid, L: ph } : null; }
const canBehind = L => !!L && L.type !== 'photo' && !!personPid();
async function toggleBehind(L) {
  if (L.behind) { L.behind = false; changed(true); paintPanel(); return; }
  const src = personPid(); if (!src) { status('먼저 인물 사진을 넣어 주세요', 3000); return; }
  if (!src.bg) { doc.bg = { type: 'photo', pid: src.pid, pz: 1, px: 0, py: 0, filter: src.L.filter || 'none' }; doc.layers = doc.layers.filter(l => l !== src.L); status('사진을 배경으로 깔고 인물을 찾을게요', 3000); changed(true); }
  const b = document.querySelector('#miniBar [data-mb=behind]'); if (b) { b.classList.add('loading'); b.querySelector('small').textContent = '찾는 중…'; } status('인물을 찾는 중이에요… (사진은 기기 밖으로 나가지 않아요)', 8000);
  const ok = await ensureMask(doc.bg.pid);
  if (ok) { L.behind = true; status('인물 뒤로 보냈어요'); } else status(segFailMsg('글자는 앞에 그대로 둘게요'), 5000);
  document.querySelector('#miniBar [data-mb=behind]')?.classList.remove('loading'); changed(true); paintPanel(); }
async function restorePhotos() { const ids = new Set([doc.bg.pid, ...doc.layers.map(l => l.pid)].filter(Boolean)); let n = 0;
  for (const id of ids) if (!photos[id]) { const b = await idb.get(id); if (b) { photos[id] = await blobToImg(b); n++; } } if (n) changed(true);
  if (doc.bg.type === 'photo' && photos[doc.bg.pid] && doc.layers.some(l => l.behind)) { if (await ensureMask(doc.bg.pid)) changed(true); else { doc.layers.forEach(l => l.behind = false); changed(true); } } }
// ---- history + autosave ----
let hist = [], hi = -1, comT = 0;
function commit() { clearTimeout(comT); if (!doc) return; const s = JSON.stringify(doc); if (s !== hist[hi]) { hist = hist.slice(0, hi + 1); hist.push(s); if (hist.length > 100) hist.shift(); hi = hist.length - 1; } LS('runtier:v3doc', doc); paintTop(); }
const later = () => { clearTimeout(comT); comT = setTimeout(commit, 300); };
function undoRedo(dd) { commit(); const n = hi + dd; if (n < 0 || n >= hist.length) return; hi = n; doc = JSON.parse(hist[hi]); if (sel && !getL(sel)) sel = null; LS('runtier:v3doc', doc); changed(true); paintPanel(); }
$('undo').addEventListener('click', () => undoRedo(-1)); $('redo').addEventListener('click', () => undoRedo(1));
function paintTop() { $('undo').disabled = hi <= 0; $('redo').disabled = hi >= hist.length - 1; }
const getL = id => doc.layers.find(l => l.id === id);
// the user resized it: freeze the auto-fitted size as the element's own size
function pinS(L) { if (!L || !L.af) return; const b = boxes.find(q => q.id === L.id); if (b) L.s = b.s; L.af = false; }
// hoohaa v4 wordmark (stopwatch 'o') as a debossed mark: dark upper edge, light lower edge, faint recessed fill
const WM_G = `<g transform="translate(40,4) skewX(-14) translate(0,0)" fill="none" stroke="currentColor" stroke-width="16"><path d="M8 6V100M8 70Q8 40 30 40Q52 40 52 70V100"/><circle cx="102" cy="70" r="22"/><path d="M102 70L113.8 63.2" stroke-width="7" stroke-linecap="round"/><circle cx="102" cy="70" r="5" fill="currentColor" stroke="none"/><rect x="95.2" y="28.6" width="13.6" height="9.2" rx="1.8" fill="currentColor" stroke="none"/><rect x="99" y="37.4" width="6" height="4.4" fill="currentColor" stroke="none"/><circle cx="174" cy="70" r="22"/><path d="M224 6V100M224 70Q224 40 246 40Q268 40 268 70V100"/><circle cx="318" cy="70" r="22"/><path d="M340 40V100"/><circle cx="390" cy="70" r="22"/><path d="M412 40V100"/></g>`;
const WM_SVG = `<svg viewBox="0 0 470 122" focusable="false"><defs><filter id="wmDeboss" x="-5%" y="-10%" width="110%" height="125%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation=".6" result="a"/>
<feOffset in="a" dy="3" result="dn"/><feOffset in="a" dy="-1.4" result="up"/>
<feComposite in="a" in2="dn" operator="out" result="topIn"/><feFlood class="wf-lo" result="cLo"/><feComposite in="cLo" in2="topIn" operator="in" result="shade"/>
<feComposite in="dn" in2="a" operator="out" result="botOut"/><feFlood class="wf-hi" result="cHi"/><feComposite in="cHi" in2="botOut" operator="in" result="light"/>
<feComposite in="a" in2="up" operator="out" result="botIn"/><feFlood class="wf-hi2" result="cHi2"/><feComposite in="cHi2" in2="botIn" operator="in" result="rim"/>
<feFlood class="wf-base" result="cB"/><feComposite in="cB" in2="SourceAlpha" operator="in" result="base"/>
<feMerge><feMergeNode in="base"/><feMergeNode in="shade"/><feMergeNode in="rim"/><feMergeNode in="light"/></feMerge></filter></defs><g filter="url(#wmDeboss)" color="#000">${WM_G}</g></svg>`;
const isTop = L => L && L.type === 'stat' && L.stat === 'top' && L.v !== 4;
// ---- rendering ----
let rafQ = 0, lastCv = null;
// re-derive tier styling for a new result: old docs stored the tier accent as a hex; treat that as '@tier'
function syncTier() { if (!doc || !state.story) return; const a = accentOf(state.story);
  if (doc.acc && doc.acc !== a) for (const l of doc.layers) if (l.col && l.col.toLowerCase() === doc.acc.toLowerCase()) l.col = '@tier';
  doc.acc = a; }
const MSYNC = ['font', 'col', 'size', 'w', 'box', 'bcol', 'bo', 'al', 'ls', 's', 'o', 'r', 'fsh', 'fol', 'fgl', 'af'];
function syncMulti() { for (const id of [...multi]) { const m = getL(id); if (!m || m.type !== 'text' || id === sel) multi.delete(id); } const L = sel && getL(sel); if (!multi.size || !L || L.type !== 'text') { multi.clear(); multiSnap = null; return; }
  if (multiSnap && multiSnap.id === L.id) for (const k of MSYNC) if (JSON.stringify(L[k]) !== JSON.stringify(multiSnap[k])) for (const id of multi) { const m = getL(id); if (L[k] === undefined) delete m[k]; else m[k] = clone(L[k]); }
  multiSnap = clone(L); }
window.__multi = () => [...multi];
function changed(now) { syncTier(); syncMulti(); const bb = $('bgBtn'); if (bb && doc) bb.hidden = doc.bg.type === 'photo' && !!photos[doc.bg.pid]; if (!rafQ) rafQ = requestAnimationFrame(async () => { rafQ = 0; const cv = await renderDoc(state.story, doc, photos); lastCv = cv; boxes = cv.__boxes; fitStage(); $('tplPreview').getContext('2d').drawImage(cv, 0, 0); if (needClamp) { needClamp = false; if (clampN++ < 5 && clampIn()) { changed(true); return; } clampN = 0; } paintOvl(); if (sel) paintSelInfo(); }); if (now === true) commit(); else later(); }
// ---- format: 9:16 story · 4:5 feed · 1:1 (preview canvas follows the export aspect) ----
let needClamp = false, clampN = 0;
function fitStage() { const h = FH(), pv = $('tplPreview'), o = $('ovl'); if (pv.height !== h) { pv.height = h; o.height = h; } $('stage').style.setProperty('--ar', `1080/${h}`); $('stage').style.setProperty('--arn', String(1080 / h));
  for (const b of document.querySelectorAll('#fmtSeg [data-v]')) b.setAttribute('aria-checked', String(b.dataset.v === (doc.fmt || 'story'))); $('safeBtn').hidden = (doc.fmt || 'story') !== 'story'; }
// re-lay out proportionally: positions + sizes follow the height ratio, edge anchors stay at the margins; template blocks re-fit (auto-fit), everything kept inside the safe margins
const CARRY = ['font', 'col', 'bcol', 'bo', 'box', 'fsh', 'fol', 'fgl', 'o', 'lab', 't', 'hidden', 'behind', 'pid', 'crop', 'cr', 'rot', 'flip', 'filter', 'adj', 'cut', 'ol', 'f', 'k', 'ls', 'lh'];
function relayout(d, to) { if (d.tpl && TEMPLATES.some(t => t[0] === d.tpl) && d.layers.some(l => l.sid)) return specRelayout(d, to); return propRelayout(d, to); }
function specRelayout(d, to) { const h0 = fmtH(d.fmt), h1 = fmtH(to), nd = templateDoc(d.tpl, state.story, to), k = h1 / h0, used = new Set(), out = [];
  for (const L of d.layers) { const N = L.sid && nd.layers.find(n => n.sid === L.sid);
    if (N) { used.add(N); const keep = { id: L.id }; for (const c of CARRY) if (L[c] !== undefined && !(c === 'hidden' && L.hf)) keep[c] = L[c]; if (L.hf) keep.hidden = false;
      if (L.mv || (L.s !== 1 && L.af === false)) { Object.assign(N, { x: L.x, y: L.y * k, s: L.s * k, r: L.r, mv: 1 }); delete N.ax; delete N.ay; } Object.assign(N, keep); delete N.hf; out.push(N); }
    else if (L.sid) out.push({ ...L, hidden: true, hf: 1 }); else { const q = { ...L, y: L.y * k, s: L.s * k }; out.push(q); } }
  for (const N of nd.layers) if (!used.has(N)) out.push(N);
  // keep the user's stacking order for carried layers; new-format-only layers keep template order
  d.layers = out; d.fmt = nd.fmt; d.bgT = nd.bgT; if (d.bg.type === 'photo' && nd.bgT && !d.bg.moved) Object.assign(d.bg, { px: nd.bgT.px, py: nd.bgT.py }); needClamp = true; clampN = 0; return d; }
function propRelayout(d, to) { const h0 = fmtH(d.fmt), h1 = fmtH(to); d.fmt = to === 'story' ? undefined : to; if (h0 === h1) return d; const k = h1 / h0;
  for (const L of d.layers) { L.y = L.y * k; L.s = L.s * k; if (!L.ax) L.x = 540 + (L.x - 540) * Math.max(k, .8); }
  needClamp = true; clampN = 0; return d; }
function clampIn() { let mv = false; const H = FH();
  for (const b of boxes) { const L = getL(b.id); if (!L || b.hidden || (L.sid && (L.type === 'shape' || L.type === 'photo'))) continue; const M = L.sid && !L.mv ? 0 : 40; const hw = b.w * b.s / 2, hh = b.h * b.s / 2; let dx = 0, dy = 0;
    if (hw * 2 > 1080 - M * 2 || hh * 2 > H - M * 2) { const f = Math.min((1080 - M * 2) / (hw * 2), (H - M * 2) / (hh * 2)); if (f < 1) { L.s = b.s * f; L.af = false; mv = true; continue; } }
    if (b.x - hw < M) dx = M - (b.x - hw); else if (b.x + hw > 1080 - M) dx = 1080 - M - (b.x + hw); if (b.y - hh < M) dy = M - (b.y - hh); else if (b.y + hh > H - M) dy = H - M - (b.y + hh);
    if (dx || dy) { L.x = b.x; delete L.ax; delete L.ay; L.y = b.y + dy; L.x += dx; mv = true; } }
  if (mv) needClamp = true; return mv; }
window.__fmt = () => ({ fmt: doc.fmt || 'story', h: FH(), cw: $('tplPreview').width, ch: $('tplPreview').height });
function placePhoto(pid, keepBg) { if (!pid || !photos[pid]) return; if (doc.bgT) { doc.bg = { type: 'photo', pid, pz: 1, filter: 'none', ...(keepBg && keepBg.pid === pid ? { filter: keepBg.filter, crop: keepBg.crop, rot: keepBg.rot, flip: keepBg.flip } : {}), ...clone(doc.bgT), px: doc.bgT.px || 0, py: doc.bgT.py || 0 }; }
  else { const s0 = doc.layers.find(l => l.type === 'photo' && !l.pid); if (s0) s0.pid = pid; }
  if (doc.layers.some(l => l.behind) && doc.bg.type === 'photo') ensureMask(doc.bg.pid).then(ok => { if (!ok) doc.layers.forEach(l => l.behind = false); changed(true); }); }
// ---- 내 스타일 기억: last template / format / fonts / colours / outline & text effects, applied to the next record and new sessions ----
const MY = () => LS('runtier:mystyle') || {}; const myPut = o => { if (MY().off) return; LS('runtier:mystyle', { ...MY(), ...o }); };
function newDoc(t) { const m = MY(), f = m.off ? 'story' : m.fmt || 'story', d = templateDoc(TEMPLATES.some(x => x[0] === (t || m.tpl)) ? (t || m.tpl) : 'nrc', state.story, f);
  if (!m.off) for (const L of d.layers) { if (L.type === 'stat' && L.v !== 4) { if (m.font !== undefined) L.font = m.font; if (m.col && (!L.col || /^#fff(fff)?$/i.test(L.col))) L.col = m.col; if (m.fx) Object.assign(L, clone(m.fx)); } }
  if (!m.off && m.ol) d.olPref = m.ol; needClamp = true; clampN = 0; return d; }
async function refreshTpl() { // called from renderResult
  if (!state.story) return;
  if (!doc) { const s = LS('runtier:v3doc'); doc = s && Array.isArray(s.layers) && s.bg ? s : newDoc(); hist = [JSON.stringify(doc)]; hi = 0; restorePhotos(); }
  changed(true); paintPanel(); thumbs();
}
async function thumbs() {
  const mine = LS('runtier:mytpl') || [];
  $('tplList').innerHTML = TEMPLATES.map(([k, n]) => `<button type="button" role="radio" class="tpl-btn" data-t="${k}" aria-checked="${doc.tpl === k}"><canvas width="108" height="${Math.round(108 * FH() / 1080)}"></canvas><span class="tn">${n}</span></button>`).join('') +
    mine.map((m, i) => `<span class="tpl-mine"><button type="button" role="radio" class="tpl-btn" data-m="${i}" aria-checked="false"><canvas width="108" height="192"></canvas><span class="tn">${esc(m.n)}</span></button><button type="button" class="tpl-del" data-mdel="${i}" aria-label="${esc(m.n)} 삭제">✕</button></span>`).join('');
  for (const b of $('tplList').querySelectorAll('.tpl-btn')) { const d2 = b.dataset.t ? relayout(templateDoc(b.dataset.t, state.story), doc.fmt || 'story') : mine[+b.dataset.m]; const cv = await renderDoc(state.story, d2, photos); const t0 = b.querySelector('canvas'), t = t0.getContext('2d'); t.imageSmoothingQuality = 'high'; t.drawImage(cv, 0, 0, t0.width, t0.height); }
}
$('tplList').addEventListener('click', e => { const del = e.target.closest('[data-mdel]'); if (del) { const m = LS('runtier:mytpl') || []; m.splice(+del.dataset.mdel, 1); LS('runtier:mytpl', m); thumbs(); return; }
  const b = e.target.closest('.tpl-btn'); if (!b) return; const race = doc.race, keepBg = doc.bg.type === 'photo' && photos[doc.bg.pid] ? doc.bg : null;
  const f0 = doc.fmt || 'story', keepPid = keepBg ? keepBg.pid : (doc.layers.find(l => l.type === 'photo' && l.pid && photos[l.pid]) || {}).pid; doc = b.dataset.t ? (myPut({ tpl: b.dataset.t }), newDoc(b.dataset.t)) : { ...clone((LS('runtier:mytpl') || [])[+b.dataset.m]), n: undefined }; if (!b.dataset.t) relayout(doc, f0); else if ((doc.fmt || 'story') !== f0) relayout(doc, f0); doc.race = race; placePhoto(keepPid, keepBg); sel = null; mode = null;
  for (const x of $('tplList').querySelectorAll('.tpl-btn')) x.setAttribute('aria-checked', String(x === b)); changed(true); paintPanel(); });
$('tplReset').addEventListener('click', () => { const race = doc.race, keepBg = doc.bg.type === 'photo' && photos[doc.bg.pid] ? doc.bg : null; const f0 = doc.fmt || 'story'; doc = relayout(newDoc(TEMPLATES.some(t => t[0] === doc.tpl) ? doc.tpl : 'nrc'), f0); doc.race = race; placePhoto(keepBg && keepBg.pid, keepBg); sel = null; changed(true); paintPanel(); status('템플릿 상태로 되돌렸어요'); });
$('saveMyTpl').addEventListener('click', () => { const m = LS('runtier:mytpl') || []; const n = `내 템플릿 ${m.length + 1}`; m.push({ ...clone(doc), n, tpl: 'mine' }); if (!LS('runtier:mytpl', m.slice(-6))) { status('저장 공간이 부족해요'); return; } thumbs(); status(`'${n}' 저장했어요`); });
$('fmtSeg').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b || !doc) return; const f = b.dataset.v; if ((doc.fmt || 'story') === f) return; relayout(doc, f); myPut({ fmt: f }); sel = null; changed(true); paintPanel(); thumbs(); status(`${b.textContent} 형식으로 바꿨어요`); });
$('safeBtn').addEventListener('click', e => { safeOn = !safeOn; e.currentTarget.setAttribute('aria-pressed', String(safeOn)); paintOvl(); status(safeOn ? '점선 영역은 인스타 스토리 UI에 가려질 수 있어요 (저장 이미지엔 안 나와요)' : '안전영역 가이드를 껐어요', 2600); });
// ---- overlay: selection, handles, guides, trash (never part of the exported image) ----
const corners = b => { const c = Math.cos(b.r || 0), s = Math.sin(b.r || 0), hw = b.w * b.s / 2, hh = b.h * b.s / 2; return [[-hw, -hh], [hw, -hh], [hw, hh], [-hw, hh]].map(([x, y]) => [b.x + x * c - y * s, b.y + x * s + y * c]); };
const HANDLE = 46;
function paintOvl() {
  const o = $('ovl'), g = o.getContext('2d'), H = FH(); g.clearRect(0, 0, 1080, H);
  if (safeOn && H === 1920) { g.save(); g.fillStyle = 'rgba(255,255,255,.10)'; g.strokeStyle = 'rgba(255,255,255,.85)'; g.lineWidth = 4; g.setLineDash([14, 12]); for (const [y0, y1, t] of [[0, 250, 'IG 상단 UI (프로필·닫기)'], [1920 - 340, 1920, 'IG 하단 UI (답장·공유)']]) { g.fillRect(0, y0, 1080, y1 - y0); g.beginPath(); g.moveTo(0, y0 ? y0 : y1); g.lineTo(1080, y0 ? y0 : y1); g.stroke(); g.fillStyle = 'rgba(255,255,255,.9)'; g.font = '600 34px sans-serif'; g.textAlign = 'center'; g.fillText(t, 540, y0 ? y0 + 64 : y1 - 36); g.fillStyle = 'rgba(255,255,255,.10)'; } g.restore(); }
  if (guides) { g.strokeStyle = '#FF3DA5'; g.lineWidth = 4; g.setLineDash([18, 12]); for (const x of guides.x) { g.beginPath(); g.moveTo(x, 0); g.lineTo(x, H); g.stroke(); } for (const y of guides.y) { g.beginPath(); g.moveTo(0, y); g.lineTo(1080, y); g.stroke(); } g.setLineDash([]); }
  for (const id of multi) { const mb = boxes.find(x => x.id === id); if (!mb) continue; const p = corners(mb); g.strokeStyle = '#3DC8F5'; g.lineWidth = 5; g.setLineDash([16, 10]); g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); g.setLineDash([]); }
  const b = sel && boxes.find(x => x.id === sel);
  if (b) { const p = corners(b); g.strokeStyle = '#3DC8F5'; g.lineWidth = 5; g.setLineDash([16, 10]); g.beginPath(); p.forEach(([x, y], i) => i ? g.lineTo(x, y) : g.moveTo(x, y)); g.closePath(); g.stroke(); g.setLineDash([]);
    if (!fineP) { const [hx, hy] = p[2]; g.fillStyle = '#3DC8F5'; g.beginPath(); g.arc(hx, hy, HANDLE, 0, 7); g.fill(); g.fillStyle = '#0F1620'; g.font = '700 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⤡', hx, hy + 2); } }
  placeMini(b);
  if (dragging) { g.fillStyle = trashHot ? 'rgba(255,90,95,.95)' : 'rgba(15,22,32,.75)'; g.beginPath(); const ty = H - 130; g.arc(540, ty, trashHot ? 96 : 80, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.rect(510, ty - 25, 60, 70); g.moveTo(495, ty - 25); g.lineTo(585, ty - 25); g.moveTo(525, ty - 40); g.lineTo(555, ty - 40); g.stroke(); }
}
// floating contextual mini toolbar, positioned inside the canvas next to the selection (DOM over the overlay → never exported)
function placeMini(b) { const m = $('miniBar'); if (!m) return; const L = b && getL(b.id);
  if (!L || dragging || pickMode) { m.hidden = true; return; }
  m.querySelector('[data-mb=behind]').hidden = !canBehind(L); const bh = m.querySelector('[data-mb=behind]'); bh.setAttribute('aria-pressed', !!L.behind); bh.title = L.behind ? '인물 앞으로' : '인물 뒤로'; bh.setAttribute('aria-label', bh.title); bh.querySelector('small').textContent = bh.title;
  m.querySelectorAll('[data-mb=dup],[data-mb=del]').forEach(e => e.hidden = isTop(L)); m.querySelector('[data-mb=asbg]').hidden = !(L.type === 'photo' && L.pid && photos[L.pid]) || multi.size > 0; m.hidden = false;
  const r = $('ovl').getBoundingClientRect(), kx = r.width / 1080, ky = r.height / FH(), c = corners(b), xs = c.map(q => q[0] * kx), ys = c.map(q => q[1] * ky);
  const bw = m.offsetWidth, bhh = m.offsetHeight, top = Math.min(...ys), bot = Math.max(...ys), cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  let y = top - bhh - 10; if (y < 4) { y = bot + 10; if (y + bhh > r.height - 4) y = top > r.height - bot ? Math.max(4, top - bhh - 4) : Math.min(r.height - bhh - 4, bot + 4); }
  m.style.left = Math.max(4, Math.min(r.width - bw - 4, cx - bw / 2)) + 'px'; m.style.top = y + 'px'; }
// iOS Safari: the stage blocks touch defaults for gestures, so act on pointerup directly (click is only a keyboard fallback)
function tapButtons(el, sel_, run) { let down = null, last = 0;
  const stop = e => e.stopPropagation();
  el.addEventListener('pointerdown', e => { stop(e); down = e.target.closest(sel_); });
  el.addEventListener('touchstart', stop, { passive: true }); el.addEventListener('touchend', stop, { passive: true }); el.addEventListener('mousedown', stop);
  el.addEventListener('pointerup', e => { stop(e); const b = e.target.closest(sel_); if (b && b === down && !b.hidden) { last = Date.now(); e.preventDefault(); run(b); } down = null; });
  el.addEventListener('pointercancel', () => { down = null; });
  el.addEventListener('click', e => { stop(e); const b = e.target.closest(sel_); if (b && Date.now() - last > 700) run(b); }); }
tapButtons($('miniBar'), '[data-mb]', b => { const a = b.dataset.mb, L = getL(sel); if (!L) return; if (a === 'behind') toggleBehind(L); else if (a === 'asbg') photoToBg(L); else act(a); });
const toLocal = (b, x, y) => { const c = Math.cos(-(b.r || 0)), s = Math.sin(-(b.r || 0)), dx = x - b.x, dy = y - b.y; return [(dx * c - dy * s) / b.s, (dx * s + dy * c) / b.s]; };
function hitAt(x, y) { for (let i = boxes.length - 1; i >= 0; i--) { const b = boxes[i]; if (b.hidden || b.nh) continue; const [lx, ly] = toLocal(b, x, y), pad = Math.max(0, 30 / b.s - 0); if (Math.abs(lx) <= b.w / 2 + pad && Math.abs(ly) <= b.h / 2 + pad) return b; } return null; }
window.__hitAt = (x, y) => (hitAt(x, y) || {}).id;
const onHandle = (x, y) => { if (fineP) return false; const b = sel && boxes.find(q => q.id === sel); if (!b) return false; const [hx, hy] = corners(b)[2]; return Math.hypot(x - hx, y - hy) < HANDLE * 1.3; };
// ---- gestures: tap select · drag move (snap) · pinch scale+rotate · corner handle · long-press menu · drag to trash ----
{
  const st = $('stage'), ov = $('ovl'), pts = new Map(); let g0 = null, lp = 0, moved = false;
  const cv = e => { const r = ov.getBoundingClientRect(); return [(e.clientX - r.left) * 1080 / r.width, (e.clientY - r.top) * FH() / r.height]; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const start = () => { const P = [...pts.values()], L = sel && getL(sel); if (L && P.length > 1) pinS(L); g0 = { P: P.map(p => [...p]), L: L ? clone(L) : null, bg: clone(doc.bg), M: [...multi].map(id => { const m = getL(id); return m && [id, m.x, m.y]; }).filter(Boolean) }; };
  ov.addEventListener('pointerdown', e => {
    fineP = e.pointerType === 'mouse' && matchMedia('(hover: hover) and (pointer: fine)').matches; hideMenu(); const p = cv(e); pts.set(e.pointerId, p); ov.setPointerCapture(e.pointerId); e.preventDefault();
    if (pickMode) { pickMode = false; const px = $('tplPreview').getContext('2d').getImageData(Math.round(p[0]), Math.round(p[1]), 1, 1).data; setCol('#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('')); status('색을 가져왔어요'); pts.delete(e.pointerId); return; }
    if (pts.size === 1) { moved = false; g0 = null;
      const hS = hitAt(p[0], p[1]), SL = sel && getL(sel);
      if (e.shiftKey && hS && SL && SL.type === 'text' && getL(hS.id) && getL(hS.id).type === 'text') { // shift+click: add/remove text to multi-selection
        if (hS.id === sel) { if (multi.size) { const n = [...multi][0]; multi.delete(n); sel = n; } } else if (multi.has(hS.id)) multi.delete(hS.id); else multi.add(hS.id);
        multiSnap = null; syncMulti(); paintPanel(); start(); g0.hit = true; paintOvl(); return; }
      if ((e.ctrlKey || e.metaKey) && SL && (!hS || hS.id === sel || multi.has(hS.id))) { start(); g0.scale = true; paintOvl(); return; } // desktop: Ctrl+drag resizes
      if (onHandle(p[0], p[1])) { start(); g0.handle = true; }
      else { const h = hitAt(p[0], p[1]); if (h) { const HL = getL(h.id); if (HL && (HL.ax || HL.ay)) { HL.x = h.x; HL.y = h.y; delete HL.ax; delete HL.ay; } if (sel !== h.id && !multi.has(h.id)) { multi.clear(); multiSnap = null; sel = h.id; mode = null; paintPanel(); } } else if (!(doc.bg.type === 'photo' && photos[doc.bg.pid])) { if (sel) { sel = null; multi.clear(); multiSnap = null; paintPanel(); } } start(); g0.hit = !!h; }
      clearTimeout(lp); lp = setTimeout(() => { if (!moved && sel && g0 && g0.hit) showMenu(p); }, 550);
      paintOvl(); }
    else start();
  });
  ov.addEventListener('pointermove', e => {
    if (!pts.has(e.pointerId) || !g0) return; pts.set(e.pointerId, cv(e)); const P = [...pts.values()];
    if (P.length !== g0.P.length) { start(); return; }
    const c0 = g0.P.reduce((a, q) => [a[0] + q[0] / g0.P.length, a[1] + q[1] / g0.P.length], [0, 0]), c1 = P.reduce((a, q) => [a[0] + q[0] / P.length, a[1] + q[1] / P.length], [0, 0]);
    const dx = c1[0] - c0[0], dy = c1[1] - c0[1]; if (!moved && Math.hypot(dx, dy) < 14 && P.length === 1) return; moved = true; clearTimeout(lp);
    const L = g0.L && getL(g0.L.id);
    if (g0.scale && L) { const b0 = g0.L, d0 = Math.hypot(g0.P[0][0] - b0.x, g0.P[0][1] - b0.y), d1 = Math.hypot(P[0][0] - b0.x, P[0][1] - b0.y); pinS(L); L.s = Math.max(.08, Math.min(8, b0.s * d1 / Math.max(20, d0))); }
    else if (g0.handle && L) { const b0 = g0.L, a0 = ang([b0.x, b0.y], g0.P[0]), a1 = ang([b0.x, b0.y], P[0]), d0 = Math.hypot(g0.P[0][0] - b0.x, g0.P[0][1] - b0.y), d1 = Math.hypot(P[0][0] - b0.x, P[0][1] - b0.y);
      pinS(L); L.s = Math.max(.08, Math.min(8, b0.s * d1 / Math.max(1, d0))); L.r = snapR(b0.r + a1 - a0); }
    else if (P.length > 1 && L) { const f = Math.hypot(P[0][0] - P[1][0], P[0][1] - P[1][1]) / Math.max(1, Math.hypot(g0.P[0][0] - g0.P[1][0], g0.P[0][1] - g0.P[1][1]));
      L.s = Math.max(.08, Math.min(8, g0.L.s * f)); L.r = snapR(g0.L.r + ang(P[0], P[1]) - ang(g0.P[0], g0.P[1])); L.x = g0.L.x + dx; L.y = g0.L.y + dy; }
    else if (L && g0.hit) { dragging = true; let nx = g0.L.x + dx, ny = g0.L.y + dy; const b = boxes.find(q => q.id === L.id) || { x: L.x, y: L.y, w: 0, h: 0, s: 1, r: 0 }, cs = corners(b), hw = Math.max(...cs.map(q => Math.abs(q[0] - b.x))), hh = Math.max(...cs.map(q => Math.abs(q[1] - b.y))); const gx = [], gy = [];
      const HH = FH(), sz = HH === 1920 ? [250, 1670] : [60, HH - 60], T = 18, skip = new Set([L.id, ...multi]);
      const tx = [[540, 0]], ty = [[HH / 2, 0]]; // [target line, own offset]
      for (const q of boxes) { if (skip.has(q.id) || q.hidden || q.nh || q.w * q.s > 1070) continue; const qc = corners(q), xs = qc.map(v => v[0]), ys = qc.map(v => v[1]), l = Math.min(...xs), r = Math.max(...xs), t = Math.min(...ys), bt = Math.max(...ys); for (const x of [l, (l + r) / 2, r]) tx.push([x, null]); for (const y of [t, (t + bt) / 2, bt]) ty.push([y, null]); }
      const best = (n, tg, h, mg) => { let m = null; if (Math.abs(n - tg[0][0]) < T) return { n: tg[0][0], line: tg[0][0] }; for (const [t, o] of tg) for (const off of o === null ? [-h, 0, h] : [o]) { const d = Math.abs(n + off - t); if (d < T && (!m || d < m.d)) m = { d, n: t - off, line: t }; } if (!m) for (const [t, line] of mg) if (Math.abs(n - t) < T) { m = { n: t, line }; break; } return m; };
      const mx_ = best(nx, tx, hw, [[60 + hw, 60], [1020 - hw, 1020]]); if (mx_) { nx = mx_.n; gx.push(mx_.line); }
      const my_ = best(ny, ty, hh, [[sz[0] + hh, sz[0]], [sz[1] - hh, sz[1]]]); if (my_) { ny = my_.n; gy.push(my_.line); }
      L.x = nx; L.y = ny; L.mv = 1; for (const [id, x0, y0] of g0.M || []) { const m = getL(id); if (m) { m.x = x0 + nx - g0.L.x; m.y = y0 + ny - g0.L.y; m.mv = 1; delete m.ax; delete m.ay; } }
      guides = { x: gx, y: gy }; trashHot = !multi.size && Math.hypot(P[0][0] - 540, P[0][1] - (HH - 130)) < 110; }
    else if (!g0.hit && doc.bg.type === 'photo' && photos[doc.bg.pid]) { if (P.length > 1) { const f = Math.hypot(P[0][0] - P[1][0], P[0][1] - P[1][1]) / Math.max(1, Math.hypot(g0.P[0][0] - g0.P[1][0], g0.P[0][1] - g0.P[1][1])); doc.bg.pz = Math.max(1, Math.min(4, (g0.bg.pz || 1) * f)); }
      const im = bgImg(), HB = FH(), sc = Math.max(1080 / im.width, HB / im.height) * (doc.bg.pz || 1), mx = Math.max(1, (im.width * sc - 1080) / 2), my = Math.max(1, (im.height * sc - HB) / 2);
      doc.bg.moved = 1; doc.bg.px = Math.max(-1, Math.min(1, (g0.bg.px || 0) + dx / mx)); doc.bg.py = Math.max(-1, Math.min(1, (g0.bg.py || 0) + dy / my)); }
    changed();
  });
  const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); clearTimeout(lp);
    if (!pts.size) { if (dragging && trashHot && sel) delLayer(sel); dragging = false; trashHot = false; guides = null; g0 = null; paintOvl(); if (moved) commit(); if (sel) paintPanel(); } else start(); };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  ov.addEventListener('wheel', e => { const L = sel && getL(sel); if (!L) return; e.preventDefault(); pinS(L); L.s = Math.max(.08, Math.min(8, L.s * Math.exp(-e.deltaY / 500))); changed(); }, { passive: false });
  // no page scroll / zoom while touching the canvas (iOS needs non-passive handlers)
  for (const el of [st, $('cpSV'), $('cpHue')]) { const block = e => { if (e.target.closest && e.target.closest('.mini, .bg-btn, .ctx')) return; e.preventDefault(); }; el.addEventListener('touchstart', block, { passive: false }); el.addEventListener('touchmove', block, { passive: false }); }
}
const snapR = r => { const t = Math.PI / 2, n = Math.round(r / t); return Math.abs(r - n * t) < .06 ? n * t : r; };
function showMenu(p) { const bh = $('ctxBehind'), L0 = getL(sel); if (bh) { bh.hidden = !canBehind(L0); bh.textContent = L0 && L0.behind ? '인물 앞으로' : '인물 뒤로'; } const m = $('ctxMenu'), r = $('ovl').getBoundingClientRect(), k = r.width / 1080, ky = r.height / FH(); m.hidden = false; m.style.left = Math.min(r.width - 200, Math.max(0, p[0] * k - 100)) + 'px'; m.style.top = Math.max(0, p[1] * ky - 60) + 'px'; }
function hideMenu() { $('ctxMenu').hidden = true; }
tapButtons($('ctxMenu'), '[data-act]', b => { hideMenu(); if (b.dataset.act === 'behind') { const L0 = getL(sel); if (L0) toggleBehind(L0); } else act(b.dataset.act); });
function photoToBg(L) { if (!L || !L.pid || !photos[L.pid]) return; const old = doc.bg.type === 'photo' && photos[doc.bg.pid] ? clone(doc.bg) : null;
  doc.bg = { type: 'photo', pid: L.pid, pz: 1, px: 0, py: 0, filter: L.filter || 'none', ...(L.adj ? { adj: clone(L.adj) } : {}), ...(L.crop ? { crop: clone(L.crop) } : {}), ...(L.rot ? { rot: L.rot } : {}), ...(L.flip ? { flip: L.flip } : {}) };
  doc.layers = doc.layers.filter(l => l !== L); sel = null; multi.clear(); if (old) bgToLayer(old, true); else { changed(true); paintPanel(); } status(old ? '배경과 사진을 맞바꿨어요' : '사진을 배경으로 깔았어요'); }
function bgToLayer(bg = doc.bg, keepBg = false) { if (bg.type !== 'photo' || !photos[bg.pid]) return; if (doc.layers.filter(l => l.type === 'photo').length >= MAX_PHOTOS) { status(`사진은 ${MAX_PHOTOS}장까지 넣을 수 있어요`); return; }
  const L = mk('photo', { pid: bg.pid, mask: 'rect', filter: bg.filter || 'none', x: 540, y: FH() / 2, s: .7, ...(bg.adj ? { adj: clone(bg.adj) } : {}), ...(bg.crop ? { crop: clone(bg.crop) } : {}), ...(bg.rot ? { rot: bg.rot } : {}), ...(bg.flip ? { flip: bg.flip } : {}) });
  if (!keepBg) { doc.bg = { type: 'tier' }; doc.layers.forEach(l => l.behind = false); } doc.layers.push(L); sel = L.id; mode = null; changed(true); paintPanel(); if (!keepBg) status('배경 사진을 꺼냈어요 · 끌어서 옮겨 보세요'); }
window.__photoToBg = () => photoToBg(getL(sel)); window.__bgToLayer = () => bgToLayer();
function delLayer(id) { const L = getL(id); if (!L) return; if (isTop(L)) { status('상위 %는 항상 크게 보여요 — 위치·스타일만 바꿀 수 있어요', 3000); return; } doc.layers = doc.layers.filter(l => l.id !== id); if (sel === id) sel = null; changed(true); paintPanel(); }
function act(a) { const i = doc.layers.findIndex(l => l.id === sel); if (i < 0) return; const L = doc.layers[i];
  if (a === 'del') { const ids = [...multi]; multi.clear(); ids.forEach(id => delLayer(id)); return delLayer(sel); }
  if (a === 'dup') { if (isTop(L)) { status('상위 %는 하나만 있어요'); return; } if (L.type === 'photo' && doc.layers.filter(l => l.type === 'photo').length >= MAX_PHOTOS) { status(`사진은 ${MAX_PHOTOS}장까지 넣을 수 있어요`); return; } const n = { ...clone(L), id: lid(), x: L.x + 40, y: L.y + 40 }; doc.layers.splice(i + 1, 0, n); sel = n.id; }
  if (a === 'up' && i < doc.layers.length - 1) [doc.layers[i], doc.layers[i + 1]] = [doc.layers[i + 1], doc.layers[i]];
  if (a === 'down' && i > 0) [doc.layers[i], doc.layers[i - 1]] = [doc.layers[i - 1], doc.layers[i]];
  if (a === 'front') { doc.layers.splice(i, 1); doc.layers.push(L); } if (a === 'back') { doc.layers.splice(i, 1); doc.layers.unshift(L); }
  changed(true); paintPanel(); }
// ---- right toolbar ----
const addLayer = L => { doc.layers.push(L); sel = L.id; mode = null; changed(true); paintPanel(); };
$('tools').addEventListener('click', async e => { const b = e.target.closest('[data-tool]'); if (!b) return; const t = b.dataset.tool; hideMenu();
  if (t === 'text') { addLayer(mk('text', { t: '텍스트', size: 96, font: null, col: '#ffffff', x: 540, y: 960 })); setTimeout(() => { const ta = $('tText'); if (ta) { ta.focus(); ta.select(); } }, 50); return; }
  if (t === 'photo') { photoTarget = 'layer'; pickPhoto(); return; }
  sel = null; mode = mode === t ? null : t; paintPanel(); });
let photoTarget = 'layer';
$('bgBtn').addEventListener('click', () => { photoTarget = 'bg'; pickPhoto(); });
const pickPhoto = () => { status('사진은 이 기기 안에서만 쓰여요', 2200); $('photo').click(); };
$('photo').addEventListener('change', async e => {
  const fs = [...e.target.files]; e.target.value = ''; if (!fs.length) return;
  if (photoTarget === 'bg') { const pid = await addPhotoFile(fs[0]); doc.bg = { type: 'photo', pid, pz: 1, px: 0, py: 0, filter: 'none', ...clone(doc.bgT || {}) }; if (doc.layers.some(l => l.behind)) { status('인물을 찾는 중이에요…', 8000); if (!(await ensureMask(pid))) { doc.layers.forEach(l => l.behind = false); status('이 사진에서는 인물을 찾지 못했어요 · 글자는 앞에 그대로 둘게요', 4000); } else status(''); } changed(true); paintPanel(); return; }
  if (photoTarget === 'fill') { const L = getL(sel); if (L) { L.pid = await addPhotoFile(fs[0]); L.cz = 1; L.cx = 0; L.cy = 0; changed(true); paintPanel(); } return; }
  let n = doc.layers.filter(l => l.type === 'photo').length;
  for (const f of fs) { if (n >= MAX_PHOTOS) { status(`사진은 ${MAX_PHOTOS}장까지 넣을 수 있어요`); break; } const pid = await addPhotoFile(f); n++; const L = mk('photo', { pid, mask: 'round', filter: 'none', x: 540 + (n % 3 - 1) * 60, y: 900 + (n % 3) * 40, s: .9 }); doc.layers.push(L); sel = L.id; }
  mode = null; changed(true); paintPanel();
});
let stT = 0; function status(t, ms = 2600) { $('pvHint').textContent = t || (fineP ? '클릭해 선택 · 끌어서 이동 · Ctrl+드래그로 크기 · Shift+클릭으로 여러 텍스트 선택' : '요소를 탭해 선택 · 끌어서 이동 · 두 손가락으로 크기·회전 · 길게 눌러 메뉴'); clearTimeout(stT); if (t) stT = setTimeout(() => status(''), ms); }
// ---- colour picker (HSV, persistent H/S/V: never re-derive hue when s or v = 0) ----
const hex2hsv = hex => { const n = parseInt(hex.slice(1), 16), r = (n >> 16) / 255, g = (n >> 8 & 255) / 255, b = (n & 255) / 255, mx = Math.max(r, g, b), mn = Math.min(r, g, b), d = mx - mn;
  let h = 0; if (d) h = mx === r ? ((g - b) / d + 6) % 6 : mx === g ? (b - r) / d + 2 : (r - g) / d + 4; return { h: h * 60, s: mx ? d / mx : 0, v: mx }; };
const hsv2hex = ({ h, s, v }) => { const f = k => { const x = (k + h / 60) % 6; return v - v * s * Math.max(0, Math.min(x, 4 - x, 1)); };
  return '#' + [f(5), f(3), f(1)].map(x => Math.round(x * 255).toString(16).padStart(2, '0')).join(''); };
let hsv = { h: 0, s: 0, v: 1 }, hsvCol = '';
const adoptHex = hex => { const n = hex2hsv(hex); if (n.v === 0) n.s = hsv.s; if (n.s === 0 || n.v === 0) n.h = hsv.h; hsv = n; hsvCol = hex.toLowerCase(); };
const hasBg = L => L.v === 2 || (L.box && L.box !== 'none');
const colTarget = () => mode === 'bg' ? { get: () => doc.bg.c1 || '#0f1620', set: c => { doc.bg = c === '@tier' ? { type: 'tier' } : { type: 'solid', c1: c }; } } : (colMode === 'bg' && getL(sel) && ['text', 'stat'].includes(getL(sel).type)) ? { get: () => { const L = getL(sel); return L.bcol || (L.box === 'semi' ? '#000000' : L.col || '#ffffff'); }, set: c => { const L = getL(sel); if (!L) return; const first = !L.bcol; L.bcol = c; if (L.v !== 2 && (!L.box || L.box === 'none')) { L.box = 'full'; if (L.col == null) L.col = '#ffffff'; } if (first || !document.querySelector('#pBo')) setTimeout(paintPanel, 0); } }
  : { get: () => (getL(sel) || {}).col || '#ffffff', set: c => { const L = getL(sel); if (L) L.col = c; } };
function setCol(hex, fromHsv) { if (hex === '@tier') { colTarget().set('@tier'); adoptHex(accentOf(state.story).toLowerCase()); paintPicker(); changed(); return; } hex = hex.toLowerCase(); if (fromHsv) hsvCol = hex; else adoptHex(hex); colTarget().set(hex); { const L = getL(sel); if (L && L.type === 'stat' && L.v !== 4 && colMode !== 'bg' && mode !== 'bg') myPut({ col: hex }); } paintPicker(); changed(); }
function paintPicker() { if (!$('cpick').isConnected || $('cpick').closest('[hidden]')) return; let c = colTarget().get(); if (c === '@tier') c = accentOf(state.story); if (c.toLowerCase() !== hsvCol) adoptHex(c);
  $('cpChip').style.background = c; if (document.activeElement !== $('cpHex')) $('cpHex').value = c.toUpperCase();
  $('cpSV').style.setProperty('--hue', `hsl(${hsv.h} 100% 50%)`); $('cpSVk').style.left = `${hsv.s * 100}%`; $('cpSVk').style.top = `${(1 - hsv.v) * 100}%`; $('cpSVk').style.background = c;
  $('cpHuek').style.left = `${hsv.h / 360 * 100}%`; $('cpHue').setAttribute('aria-valuenow', Math.round(hsv.h)); $('cpSV').setAttribute('aria-valuetext', `채도 ${Math.round(hsv.s * 100)}%, 밝기 ${Math.round(hsv.v * 100)}%`);
  for (const q of document.querySelectorAll('#panel .qc[data-c]')) q.setAttribute('aria-pressed', String(q.dataset.c === c.toLowerCase())); }
function dragArea(el, fn) { const go = e => { const r = el.getBoundingClientRect(); fn(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))); };
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); go(e); e.preventDefault(); }); el.addEventListener('pointermove', e => { if (el.hasPointerCapture(e.pointerId)) go(e); }); el.addEventListener('pointerup', () => commit()); }
dragArea($('cpSV'), (x, y) => { hsv = { ...hsv, s: x, v: 1 - y }; setCol(hsv2hex(hsv), true); });
dragArea($('cpHue'), x => { hsv = { ...hsv, h: x * 360 }; if (hsv.s < .05) hsv.s = 1; if (hsv.v < .05) hsv.v = 1; setCol(hsv2hex(hsv), true); });
$('cpSV').addEventListener('keydown', e => { const d = { ArrowLeft: [-.05, 0], ArrowRight: [.05, 0], ArrowUp: [0, .05], ArrowDown: [0, -.05] }[e.key]; if (!d) return; e.preventDefault(); hsv = { ...hsv, s: Math.min(1, Math.max(0, hsv.s + d[0])), v: Math.min(1, Math.max(0, hsv.v + d[1])) }; setCol(hsv2hex(hsv), true); });
$('cpHue').addEventListener('keydown', e => { const d = { ArrowLeft: -10, ArrowRight: 10 }[e.key]; if (!d) return; e.preventDefault(); hsv = { ...hsv, h: (hsv.h + d + 360) % 360 }; setCol(hsv2hex(hsv), true); });
$('cpHex').addEventListener('input', e => { let v = e.target.value.trim(); if (!v.startsWith('#')) v = '#' + v; if (/^#[0-9a-f]{6}$/i.test(v)) setCol(v); });
const QC = ['#ffffff', '#111111', '#3dc8f5', '#ff5a5f', '#ffd166', '#b9ecff', '#ff8fd8', '#9b8cff', '#f2994a'];
const ICO_DROP = '<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true"><path d="m14.5 4.5 5 5"/><path d="M17 2.5a2.1 2.1 0 0 1 3 3L17.5 8 16 6.5 17 2.5z"/><path d="M15.5 6.5 5 17l-1 4 4-1L18.5 9.5"/></svg>';
const chipsHTML = () => `<div class="qcs one"><button type="button" class="qc" data-tierc="1" aria-label="티어 색 (${esc((state.story || {}).tierKo || '')})" aria-pressed="false" style="--c:${state.story ? accentOf(state.story) : '#3dc8f5'}"></button>${QC.map(c => `<button type="button" class="qc" data-c="${c}" aria-label="색 ${c}" aria-pressed="false" style="--c:${c}"></button>`).join('')}<button type="button" class="qc qi" id="eyedrop" aria-label="스포이드: 캔버스에서 색 가져오기">${ICO_DROP}</button><button type="button" class="qc qi wheel" data-more-col="1" aria-expanded="false" aria-label="직접 색 고르기"></button></div><div id="cpHost" hidden></div>`;
// ---- fonts ----
const fontBtn = (k, cls = 'fq', on = false) => `<button type="button" class="${cls}${on ? ' on' : ''}" aria-label="글꼴 ${k ? esc(FONTS[k].n) : '기본'}${on ? ' (선택됨)' : ''}" data-fk="${k || ''}" aria-pressed="${on}" style="font-family:${(k ? previewFam(k) : 'inherit').replace(/"/g, "'")};${k ? `font-weight:${nearW(k, 700)}` : ''}">${on ? '<i class="ck" aria-hidden="true">✓</i>' : ''}${k ? esc(FONTS[k].n.replace(/ \(.+\)$/, '')) : '기본'}</button>`;
const sampleOf = L => L.type === 'text' ? (L.t || '').split('\n')[0].slice(0, 16) || 'Aa' : statValue(state.story, doc, L.stat);
function fontRow(L) { const cur = L.font && FONTS[L.font] ? L.font : null; let ks = [...new Set([...recents(), ...favs(), 'bebas', 'anton', 'playfair', 'mono', 'blackhan', 'jua'])].filter(PICKABLE).slice(0, 8);
  if (cur && !ks.includes(cur)) ks = [cur, ...ks.slice(0, 7)]; else if (cur) ks = [cur, ...ks.filter(k => k !== cur)]; ks.forEach(loadPreviewFont);
  return `<p class="fcur" id="fCur">현재 글꼴: <b>${cur ? esc(FONTS[cur].n) : '기본'}</b></p><div class="fquick">${cur ? '' : fontBtn(null, 'fq', true)}${ks.map(k => fontBtn(k, 'fq', k === cur)).join('')}${cur ? fontBtn(null) : ''}<button type="button" class="fq more" data-flib="1" aria-haspopup="dialog">전체 ${Object.keys(FONTS).filter(PICKABLE).length} ›</button></div>`; }
function libHTML(L) { const q = ($('fSearch') || {}).value || '', fv = favs(), rc = recents(), smp = esc(sampleOf(L));
  let ks = Object.keys(FONTS).filter(PICKABLE); if (fontCat === 'fav') ks = fv.filter(k => FONTS[k]); else if (fontCat === 'recent') ks = rc.filter(k => FONTS[k]); else if (fontCat !== 'all') ks = ks.filter(k => FONTS[k].cat === fontCat);
  ks.sort((a, b) => (FONTS[b].ko ? 1 : 0) - (FONTS[a].ko ? 1 : 0)); const ql = q.trim().toLowerCase(); if (ql) ks = ks.filter(k => (FONTS[k].n + ' ' + k + ' ' + ((FONT_CATS.find(c => c[0] === FONTS[k].cat) || [])[1] || '')).toLowerCase().includes(ql)); ks.forEach(loadPreviewFont);
  return ks.length ? ks.map(k => `<div class="frow"><button type="button" class="fopt${L.font === k ? ' on' : ''}" data-fk="${k}" aria-pressed="${L.font === k}" style="font-family:${previewFam(k).replace(/"/g, "'")};font-weight:${nearW(k, 700)}"><b>${L.font === k ? '<i class="ck" aria-hidden="true">✓</i>' : ''}${smp}</b><small>${FONTS[k].ko ? '<em class="kob">한글</em>' : ''}${esc(FONTS[k].n)}</small></button><button type="button" class="star" data-star="${k}" aria-pressed="${fv.includes(k)}" aria-label="${esc(FONTS[k].n)} 즐겨찾기">${fv.includes(k) ? '★' : '☆'}</button></div>`).join('') : `<p class="hint">${fontCat === 'fav' ? '☆를 눌러 즐겨찾기에 추가해 보세요' : '맞는 글꼴이 없어요'}</p>`; }
async function pickFont(k) { const L = getL(sel); if (!L) return; const bs = document.querySelectorAll(`[data-fk="${k || ''}"]`); bs.forEach(b => b.classList.add('loading'));
  const ok = k ? await loadFont(k) : true; bs.forEach(b => b.classList.remove('loading')); if (!ok) { status('글꼴을 불러오지 못했어요. 잠시 후 다시 시도해 주세요.'); return; }
  if (k) LS('runtier:fontrecent', [k, ...recents().filter(x => x !== k)].slice(0, 8)); L.font = k || null; if (L.type === 'stat' && L.v !== 4) myPut({ font: L.font }); changed(true); paintPanel(); }
// ---- font bottom sheet: tap applies live, sheet stays open until 완료 ----
function fontSheetHTML(L) { return `<div class="fs-card" role="dialog" aria-modal="true" aria-labelledby="fsT"><div class="sh-head"><h3 id="fsT">글꼴 ${Object.keys(FONTS).filter(PICKABLE).length}</h3><button type="button" class="chip-btn primary-chip" id="fsDone">완료</button></div>
  <input id="fSearch" type="search" autocomplete="off" placeholder="글꼴 검색 (예: 손글씨, 모노, Bebas)" aria-label="글꼴 검색"><div class="fcats" id="fCats" role="radiogroup" aria-label="글꼴 분류">${[['all', '전체'], ['recent', '최근'], ['fav', '★'], ...FONT_CATS].map(([k, n]) => `<button type="button" role="radio" data-c="${k}" aria-checked="${k === fontCat}">${n}</button>`).join('')}</div>
  <div class="flist" id="fList">${libHTML(L)}</div><p class="hint">모든 글꼴은 상업적 사용이 허용된 OFL·Apache 라이선스예요</p></div>`; }
function openFontSheet() { const L = getL(sel); if (!L) return; let sh = $('fSheet'); if (!sh) { sh = document.createElement('div'); sh.id = 'fSheet'; sh.className = 'fsheet'; document.body.appendChild(sh);
    sh.addEventListener('click', e => { const L2 = getL(sel); if (e.target === sh || e.target.closest('#fsDone')) return closeFontSheet(); const b = e.target.closest('button'); if (!b || !L2) return; const d = b.dataset;
      if (d.c && b.closest('#fCats')) { fontCat = d.c; for (const x of $('fCats').children) x.setAttribute('aria-checked', String(x === b)); $('fList').innerHTML = libHTML(L2); }
      else if (d.star) { const f = favs(); LS('runtier:fontfav', f.includes(d.star) ? f.filter(x => x !== d.star) : [d.star, ...f]); $('fList').innerHTML = libHTML(L2); }
      else if (d.fk !== undefined) pickFont(d.fk || null).then(() => { if (!$('fSheet').hidden) $('fList').innerHTML = libHTML(getL(sel)); }); });
    sh.addEventListener('input', e => { if (e.target.id === 'fSearch') $('fList').innerHTML = libHTML(getL(sel)); });
    sh.addEventListener('keydown', e => { if (e.key === 'Escape') closeFontSheet(); }); }
  sh.innerHTML = fontSheetHTML(L); sh.hidden = false; document.body.classList.add('fs-open'); $('fsDone').focus(); }
function closeFontSheet() { const sh = $('fSheet'); if (sh) sh.hidden = true; document.body.classList.remove('fs-open'); paintPanel(); }
// ---- bottom panel (one level deep, in page flow) ----
const NAMES = { text: '텍스트', card: '티어 카드', photo: '사진', sticker: '스티커', shape: '도형' };
const lname = L => L.type === 'stat' ? STATS[L.stat][0] + (L.v === 4 ? ' 라벨' : '') : L.type === 'sticker' ? (DATA_STK[L.k] ? DATA_STK[L.k].n + ' 스티커' : STK_NAMES[L.k] || (STICKERS.find(s => s[0] === L.k) || [])[1] || '스티커') : L.type === 'text' ? `텍스트 '${(L.t || '').slice(0, 10)}'` : NAMES[L.type];
const seg = (id, opts, cur) => `<div class="seg n${opts.length}" id="${id}" role="radiogroup">${opts.map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}">${n}</button>`).join('')}</div>`;
const STYLE_THUMB = ['<i class="th-l">PACE</i><b>4:54</b>', '<b class="th-big">4:54</b>', '<b class="th-pill">4:54</b>', '<b class="th-run">4:54</b><i class="th-l">PACE</i>'];
const segT = (id, opts, cur) => `<div class="seg segt n${opts.length}" id="${id}" role="radiogroup" aria-label="표시 스타일">${opts.map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}"><span class="thumb" aria-hidden="true">${STYLE_THUMB[v]}</span>${n}</button>`).join('')}</div>`;
// slider row: −/+ fine steps, tap value to type a number
const range = (id, lab, min, max, val, unit = '') => `<div class="adj-row rgx"><label for="${id}" class="lbl sm">${lab}</label><div class="trk"><button type="button" class="stp" data-stp="${id}" data-d="-1" aria-label="${lab} 줄이기">−</button><input type="range" id="${id}" min="${min}" max="${max}" value="${val}"><button type="button" class="stp" data-stp="${id}" data-d="1" aria-label="${lab} 늘리기">+</button></div><button type="button" class="rv" data-rv="${id}" data-u="${unit}" aria-label="${lab} 값 직접 입력"><output id="${id}V">${val}${unit}</output></button></div>`;
let moreCol = false, moreTxt = false, colMode = 'fg';
// ---- v4 photo tools (shared by photo layers and the background photo) ----
const OLC = ['#ffffff', '#111111', '#3dc8f5', '#b9ecff', '#ffd166', '#ff8fd8', '#ff5a5f'];
const colRow = (id, cur, tier = false) => `<div class="olc" id="${id}">${tier ? `<button type="button" class="qc" data-olc="@tier" aria-label="티어 색" aria-pressed="${cur === '@tier'}" style="--c:${accentOf(state.story)}"></button>` : ''}${OLC.map(c => `<button type="button" class="qc" data-olc="${c}" aria-label="${c}" aria-pressed="${(cur || '').toLowerCase() === c}" style="--c:${c}"></button>`).join('')}<input type="color" id="${id}Pick" value="${/^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#ffffff'}" aria-label="색 직접 고르기"></div>`;
const fchips = (id, opts, cur) => `<div class="fchips" id="${id}" role="radiogroup">${opts.map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}">${n}</button>`).join('')}</div>`;
const ADJ = [['br', '밝기'], ['ct', '대비'], ['sa', '채도'], ['wa', '따뜻함']];
function photoEdHTML(P) { const a = P.adj || {}, ol = P.ol || {};
  return `<div class="pe-row"><button type="button" class="chip-btn" id="peCrop" aria-pressed="${!!P.crop}">✂ 자르기</button><button type="button" class="chip-btn" id="peRot" aria-label="90도 회전">↻ 90°</button><button type="button" class="chip-btn" id="peFlip" aria-pressed="${!!P.flip}">⇋ 좌우 반전</button><button type="button" class="chip-btn" id="peCut" aria-pressed="${!!P.cut}">${P.cut ? '↺ 원본 사진' : '✦ 배경 지우기'}</button></div>`
    + (P.cut ? `<div class="pe-row"><button type="button" class="chip-btn" id="peOl" aria-pressed="${!!ol.on}">누끼 테두리 ${ol.on ? '켜짐' : '꺼짐'}</button></div>` + (ol.on ? `<span class="lbl sm">테두리 색</span>${colRow('olCol', ol.col || '#ffffff')}` + range('olW', '테두리 두께', 2, 40, ol.w || 12, 'px') : '') : '')
    + `<span class="lbl sm">필터</span>${fchips('peFilter', FILTERS, P.filter || 'none')}`
    + `<button type="button" class="acc" id="peMore" aria-expanded="${moreAdj}" aria-controls="peAdj"><span>밝기·대비·채도·따뜻함</span><i aria-hidden="true">${moreAdj ? '▴' : '▾'}</i></button><div id="peAdj" class="acc-body"${moreAdj ? '' : ' hidden'}>${ADJ.map(([k, n]) => range('pa_' + k, n, -100, 100, a[k] || 0)).join('')}<button type="button" class="chip-btn" id="peAdjReset">조정 초기화</button></div>`; }
const CROPS = [['free', '자유'], ['9:16', '9:16'], ['4:5', '4:5'], ['1:1', '1:1'], ['3:4', '3:4']];
function cropHTML() { return `<div class="sh-head"><h3>사진 자르기</h3></div>${fchips('crRatio', CROPS, cropSt.r)}<div class="crop"><div class="crop-box" id="crBox"><div class="crop-wrap"><canvas id="crCv"></canvas></div><div class="crop-r" id="crR"><i data-h="nw"></i><i data-h="ne"></i><i data-h="sw"></i><i data-h="se"></i></div></div></div><p class="hint">모서리를 끌어 크기를, 안쪽을 끌어 위치를 바꿔요 · 원본은 그대로 남아 언제든 다시 자를 수 있어요</p><div class="ed-btns"><button type="button" class="chip-btn" id="crReset">전체</button><button type="button" class="chip-btn" id="crCancel">취소</button><button type="button" class="chip-btn primary-chip" id="crApply">적용</button></div>`; }
function bindCrop() { const P = cropSt.P, im = photos[cropSt.pid], src = orient(im, P, false), cv = $('crCv'), k = Math.min(1, 900 / Math.max(src.width, src.height)); cv.width = Math.round(src.width * k); cv.height = Math.round(src.height * k); cv.getContext('2d').drawImage(src, 0, 0, cv.width, cv.height);
  const box = $('crBox'); box.style.maxWidth = `min(100%, calc(46vh * ${src.width / src.height}))`; const ar = () => { const r = cropSt.r; if (r === 'free') return 0; const [a, b] = r.split(':').map(Number); return (a / b) * src.height / src.width; }; // ratio in normalized units (w/h)
  const paint = () => { const c = cropSt.c, R = $('crR'); Object.assign(R.style, { left: c.x * 100 + '%', top: c.y * 100 + '%', width: c.w * 100 + '%', height: c.h * 100 + '%' }); };
  const fit = () => { const q = ar(); if (!q) return; let { x, y, w, h } = cropSt.c, cx = x + w / 2, cy = y + h / 2; if (w / h > q) w = h * q; else h = w / q; if (w > 1) { w = 1; h = w / q; } if (h > 1) { h = 1; w = h * q; } x = Math.max(0, Math.min(1 - w, cx - w / 2)); y = Math.max(0, Math.min(1 - h, cy - h / 2)); cropSt.c = { x, y, w, h }; };
  fit(); paint(); let g = null;
  box.addEventListener('pointerdown', e => { const r = box.getBoundingClientRect(), hh = e.target.dataset.h || (e.target.id === 'crR' ? 'move' : null); if (!hh) return; e.preventDefault(); try { box.setPointerCapture(e.pointerId); } catch { } g = { hh, x: e.clientX, y: e.clientY, c: { ...cropSt.c }, W: r.width, H: r.height }; });
  box.addEventListener('pointermove', e => { if (!g) return; const dx = (e.clientX - g.x) / g.W, dy = (e.clientY - g.y) / g.H, c0 = g.c, MIN = .08; let { x, y, w, h } = c0;
    if (g.hh === 'move') { x = Math.max(0, Math.min(1 - w, x + dx)); y = Math.max(0, Math.min(1 - h, y + dy)); }
    else { let x1 = x + w, y1 = y + h; if (g.hh.includes('w')) x = Math.min(x1 - MIN, Math.max(0, x + dx)); else x1 = Math.max(x + MIN, Math.min(1, x1 + dx)); if (g.hh.includes('n')) y = Math.min(y1 - MIN, Math.max(0, y + dy)); else y1 = Math.max(y + MIN, Math.min(1, y1 + dy)); w = x1 - x; h = y1 - y;
      const q = ar(); if (q) { if (w / h > q) w = h * q; else h = w / q; if (g.hh.includes('w')) x = x1 - w; if (g.hh.includes('n')) y = y1 - h; } }
    cropSt.c = { x, y, w, h }; paint(); });
  const end = () => { g = null; }; box.addEventListener('pointerup', end); box.addEventListener('pointercancel', end);
  box.addEventListener('touchstart', e => e.preventDefault(), { passive: false }); box.addEventListener('touchmove', e => e.preventDefault(), { passive: false });
  $('crRatio').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; cropSt.r = b.dataset.v; for (const x of $('crRatio').children) x.setAttribute('aria-checked', String(x === b)); if (cropSt.r !== 'free') { cropSt.c = { x: 0, y: 0, w: 1, h: 1 }; fit(); } paint(); });
  $('crReset').addEventListener('click', () => { cropSt.c = { x: 0, y: 0, w: 1, h: 1 }; cropSt.r = 'free'; paintPanel(); });
  $('crCancel').addEventListener('click', () => { cropSt = null; paintPanel(); });
  $('crApply').addEventListener('click', () => { const c = cropSt.c, full = c.x < .002 && c.y < .002 && c.w > .996 && c.h > .996; if (full) delete P.crop; else P.crop = { x: +c.x.toFixed(4), y: +c.y.toFixed(4), w: +c.w.toFixed(4), h: +c.h.toFixed(4) }; P.cr = cropSt.r; delete P.bw; delete P.bh; cropSt = null; changed(true); paintPanel(); status(full ? '자르기를 풀었어요' : '잘랐어요 · 다시 자르기로 언제든 바꿀 수 있어요'); }); }
function bindPhotoEd(P) { const on = (id, f) => { const e = $(id); if (e) e.addEventListener('click', f); };
  on('peCrop', () => { if (!photos[P.pid]) return; cropSt = { P, pid: P.pid, r: P.cr || 'free', c: P.crop ? { ...P.crop } : { x: 0, y: 0, w: 1, h: 1 } }; paintPanel(); });
  on('peRot', () => { P.rot = ((P.rot || 0) + 1) & 3; delete P.crop; delete P.bw; delete P.bh; changed(true); paintPanel(); });
  on('peFlip', () => { P.flip = !P.flip; if (P.crop) P.crop = { ...P.crop, x: +(1 - P.crop.x - P.crop.w).toFixed(4) }; changed(true); paintPanel(); });
  on('peCut', async e => { if (P.cut) { P.cut = false; changed(true); paintPanel(); status('원본 사진으로 돌렸어요'); return; }
    const b = e.currentTarget; b.classList.add('loading'); b.disabled = true; b.setAttribute('aria-busy', 'true'); b.textContent = segP ? '인물 찾는 중…' : '인식 모델 준비 중…'; status((segP ? '배경을 지우는 중이에요…' : '인물 인식 모델을 준비하고 있어요 (처음 한 번만)…') + ' 사진은 기기 밖으로 나가지 않아요', 15000);
    const ok = await ensureMask(P.pid); if (ok) { P.cut = true; if (!P.ol) P.ol = { on: false, col: '#ffffff', w: 12, ...(MY().ol || {}), on: false }; status('인물만 남겼어요 · 원본 사진으로 언제든 돌릴 수 있어요'); } else status(segFailMsg('사진은 그대로 둘게요'), 5000);
    changed(true); paintPanel(); });
  on('peOl', () => { P.ol = { col: '#ffffff', w: 12, ...(P.ol || {}), on: !(P.ol && P.ol.on) }; myPut({ ol: { col: P.ol.col, w: P.ol.w } }); changed(true); paintPanel(); });
  const olc = $('olCol'); if (olc) { olc.addEventListener('click', e => { const b = e.target.closest('[data-olc]'); if (!b) return; P.ol.col = b.dataset.olc; myPut({ ol: { col: P.ol.col, w: P.ol.w } }); changed(true); paintPanel(); }); $('olColPick').addEventListener('input', e => { P.ol.col = e.target.value; changed(); }); $('olColPick').addEventListener('change', () => { myPut({ ol: { col: P.ol.col, w: P.ol.w } }); commit(); }); }
  const w = $('olW'); if (w) w.addEventListener('input', e => { P.ol.w = +e.target.value; $('olWV').textContent = e.target.value + 'px'; myPut({ ol: { col: P.ol.col, w: P.ol.w } }); changed(); });
  const f = $('peFilter'); if (f) f.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; P.filter = b.dataset.v; changed(true); paintPanel(); });
  on('peMore', e => { moreAdj = !moreAdj; const b = e.currentTarget; b.setAttribute('aria-expanded', moreAdj); b.querySelector('i').textContent = moreAdj ? '▴' : '▾'; $('peAdj').hidden = !moreAdj; });
  for (const [k] of ADJ) { const r = $('pa_' + k); if (r) r.addEventListener('input', e => { P.adj = { ...(P.adj || {}), [k]: +e.target.value }; if (!Object.values(P.adj).some(Boolean)) delete P.adj; $('pa_' + k + 'V').textContent = e.target.value; changed(); }); }
  on('peAdjReset', () => { delete P.adj; changed(true); paintPanel(); }); }
// ---- text effects (all off by default): 그림자 · 외곽선 · 글로우 ----
function fxHTML(L) { return `<button type="button" class="acc" id="pMoreFx" aria-expanded="${moreFx}" aria-controls="pFxAcc"><span>효과 (그림자·외곽선·글로우)</span><i aria-hidden="true">${moreFx ? '▴' : '▾'}</i></button><div id="pFxAcc" class="acc-body"${moreFx ? '' : ' hidden'}><div class="pe-row"><button type="button" class="chip-btn" id="fxSh" aria-pressed="${!!L.fsh}">그림자</button><button type="button" class="chip-btn" id="fxOl" aria-pressed="${!!L.fol}">외곽선</button><button type="button" class="chip-btn" id="fxGl" aria-pressed="${!!L.fgl}">글로우</button></div>`
  + (L.fol ? `<span class="lbl sm">외곽선 색</span>${colRow('folCol', L.fol.col, true)}${range('folW', '외곽선 두께', 1, 30, L.fol.w || 6, 'px')}` : '')
  + (L.fgl ? `<span class="lbl sm">글로우 색</span>${colRow('fglCol', L.fgl.col || '#3dc8f5', true)}${range('fglR', '글로우 세기', 5, 100, L.fgl.r ?? 30, '%')}` : '') + `</div>`; }
const fxSave = L => { if (L.type === 'stat' && L.v !== 4) myPut({ fx: { fsh: L.fsh || undefined, fol: L.fol || undefined, fgl: L.fgl || undefined } }); };
function bindFx(L) { const on = (id, f) => { const e = $(id); if (e) e.addEventListener('click', f); };
  on('pMoreFx', e => { moreFx = !moreFx; const b = e.currentTarget; b.setAttribute('aria-expanded', moreFx); b.querySelector('i').textContent = moreFx ? '▴' : '▾'; $('pFxAcc').hidden = !moreFx; });
  on('fxSh', () => { if (L.fsh) delete L.fsh; else L.fsh = 1; fxSave(L); changed(true); paintPanel(); });
  on('fxOl', () => { if (L.fol) delete L.fol; else L.fol = { col: '#111111', w: 6 }; fxSave(L); changed(true); paintPanel(); });
  on('fxGl', () => { if (L.fgl) delete L.fgl; else L.fgl = { col: '#3dc8f5', r: 30 }; fxSave(L); changed(true); paintPanel(); });
  for (const [id, key] of [['folCol', 'fol'], ['fglCol', 'fgl']]) { const e = $(id); if (!e) continue; e.addEventListener('click', ev => { const b = ev.target.closest('[data-olc]'); if (!b) return; L[key].col = b.dataset.olc; fxSave(L); changed(true); paintPanel(); }); $(id + 'Pick').addEventListener('input', ev => { L[key].col = ev.target.value; changed(); }); $(id + 'Pick').addEventListener('change', () => { fxSave(L); commit(); }); }
  for (const [id, key, f, u] of [['folW', 'fol', 'w', 'px'], ['fglR', 'fgl', 'r', '%']]) { const e = $(id); if (e) e.addEventListener('input', ev => { L[key][f] = +ev.target.value; $(id + 'V').textContent = ev.target.value + u; fxSave(L); changed(); }); } }
// ---- user-input stickers: plain text layers (editable, styleable like any text) ----
const WX = ['☀️', '⛅', '☁️', '🌧️', '❄️', '🌬️', '🌙'];
const INSTK = { weather: ['날씨', { t: '☀️ 18°C', size: 72, font: null, w: 700 }], place: ['코스·장소', { t: '📍 한강 반포', size: 60, font: null, w: 600 }], bib: ['배번', { t: '1234', size: 150, font: 'anton', col: '#111111', box: 'full', bcol: '#ffffff', bo: 1, ls: 4 }], memo: ['메모 (손글씨)', { t: '오늘도 완주!', size: 96, font: 'nanumpen', w: 400 }] };
function paintPanel() {
  { const L0 = sel && getL(sel), b = L0 && (L0.ax || L0.ay) && boxes.find(q => q.id === sel); if (b) { L0.x = b.x; L0.y = b.y; delete L0.ax; delete L0.ay; } }
  const P = $('panel'); $('cpick').hidden = true; document.body.appendChild($('cpick')); const L = sel && getL(sel);
  for (const b of $('tools').querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', String(b.dataset.tool === mode && !L));
  let h = '';
  if (cropSt && photos[cropSt.pid]) { P.innerHTML = cropHTML(); bindCrop(); return; } cropSt = null;
  if (L) {
    h += `<div class="sh-head"><h3 id="pName">${esc(lname(L))}</h3>${multi.size ? `<small class="mcount" id="pMulti">+${multi.size}개 함께 편집 중</small>` : ''}<button type="button" class="chip-btn primary-chip" id="pDone">완료</button></div>`;
    if (libOpen && (L.type === 'text' || L.type === 'stat')) {
      h += `<input id="fSearch" type="search" autocomplete="off" placeholder="글꼴 검색 (예: 손글씨, 모노, Bebas)" aria-label="글꼴 검색"><div class="fcats" id="fCats">${[['all', '전체'], ['fav', '★ 즐겨찾기'], ['recent', '최근'], ...FONT_CATS].map(([k, n]) => `<button type="button" role="radio" data-c="${k}" aria-checked="${k === fontCat}">${n}</button>`).join('')}</div><div class="flist" id="fList">${libHTML(L)}</div><p class="hint">모든 글꼴은 상업적 사용·웹 임베딩이 허용된 OFL·Apache 라이선스예요</p><button type="button" class="chip-btn" id="fClose">글꼴 목록 닫기</button>`;
      P.innerHTML = h; bindPanel(L); return; }
    if (L.type === 'text') h += `<label class="lbl sm" for="tText">${L.k === 'weather' ? '날씨 · 기온' : L.k === 'bib' ? '배번' : L.k === 'place' ? '코스·장소' : '내용'}</label><textarea id="tText" rows="2" maxlength="80"${L.k === 'bib' ? ' inputmode="numeric"' : ''}>${esc(L.t || '')}</textarea>` + (L.k === 'weather' ? `<div class="fchips" id="wxIcons" aria-label="날씨 아이콘">${WX.map(i => `<button type="button" data-wx="${i}" aria-label="${i}">${i}</button>`).join('')}</div>` : '');
    if (L.type === 'stat') h += `<p class="hint lock">🔒 기록 값은 고정돼요</p>` + (L.stat === 'race' || /\{race\}/.test(L.tx || '') ? `<label class="lbl sm" for="raceIn">대회명</label><input id="raceIn" maxlength="30" autocomplete="off" placeholder="예: 춘천마라톤" value="${esc(doc.race || '')}">` : '') + `${L.v === 4 || L.sp ? '' : `<span class="lbl sm">표시 스타일</span>${segT('pV', [[0, '기본'], [1, '숫자만'], [2, '배지'], [3, '러닝앱']], L.v || 0)}`}`;
    if (L.type === 'card') h += `<span class="lbl sm">디자인</span>${seg('pV', [[0, '카드'], [1, '배지']], L.v || 0)}`;
    if (L.type === 'text' || L.type === 'stat') h += `<span class="lbl sm">글꼴</span>${fontRow(L)}`;
    const tb = L.type === 'text' || L.type === 'stat'; if (!tb) colMode = 'fg';
    if (L.type !== 'card' && L.type !== 'photo') h += `<span class="lbl sm">색</span>` + (tb ? `<div class="seg n2 ctsw" id="pCT" role="radiogroup" aria-label="색 대상">${[['fg', '글자 색'], ['bg', '배경 색']].map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${colMode === v}">${n}</button>`).join('')}</div>` : '')
      + (tb && colMode === 'bg' ? (L.v === 2 ? `<div class="ed-btns"><button type="button" class="chip-btn" id="pBgNone" aria-pressed="${!L.bcol}">기본 배지 색</button></div>` : `<span class="lbl sm">배경 박스</span>${seg('pBox', [['none', '없음'], ['semi', '반투명'], ['full', '채움']], L.box || 'none')}`) : '') + chipsHTML()
      + (tb && colMode === 'bg' && hasBg(L) ? range('pBo', '배경 불투명도', 0, 100, Math.round((L.bo ?? (L.v !== 2 && L.box === 'semi' ? .45 : 1)) * 100), '%') : '');
    if (!tb && L.type === 'text') h += `<span class="lbl sm">배경 박스</span>${seg('pBox', [['none', '없음'], ['semi', '반투명'], ['full', '채움']], L.box || 'none')}`;
    if (L.type === 'text') h += `<span class="lbl sm">정렬</span>${seg('pAl', [['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']], L.al || 'center')}`;
    if (L.type === 'text') h += range('pTs', '글자 크기', 20, 300, Math.round(L.size || 96));
    if (L.type === 'photo') h += (L.pid && photos[L.pid] ? '' : `<button type="button" class="chip-btn primary-chip" id="pFill">사진 넣기</button>`) + `<span class="lbl sm">모양</span>${seg('pMask', MASKS, L.mask || 'rect')}` + (L.pid && photos[L.pid] ? photoEdHTML(L) : '') + range('pCz', '자르기 확대', 100, 400, Math.round((L.cz || 1) * 100), '%') + range('pCx', '좌우', -100, 100, Math.round((L.cx || 0) * 100)) + range('pCy', '상하', -100, 100, Math.round((L.cy || 0) * 100)) + `<div class="ed-btns"><button type="button" class="chip-btn" id="pAsBg">배경으로 쓰기</button><button type="button" class="chip-btn" id="pRefill">사진 바꾸기</button></div>`;
    if (L.type === 'sticker' && L.k.startsWith('data_')) { const F = dataFields(L), inp = (k, lab, max, ph = '') => `<label class="lbl sm" for="df_${k}">${lab}</label><input id="df_${k}" data-df="${k}" maxlength="${max}" autocomplete="off" value="${esc(F[k] ?? '')}" placeholder="${esc(ph)}">`;
      h += `<p class="hint">직접 적는 스티커예요 · 값은 자동으로 채워지지 않아요</p>`;
      if (L.k.startsWith('data_weather')) h += `<span class="lbl sm">날씨</span>${fchips('dfIcon', WEATHER, F.icon)}` + inp('temp', '기온', 5, '12°') + inp('label', '한 줄 메모', 16, '맑음 · 바람 약함') + wxHTML();
      if (L.k === 'data_course') h += inp('dist', '거리', 10, '10.0 km') + inp('name', '코스 이름', 18, '반포 → 잠수교');
      if (L.k === 'data_bib') h += inp('num', '배번', 5, '1031') + inp('race', '대회 (영문)', 18, 'SEOUL 10K') + `<span class="lbl sm">머리 색</span>${colRow('dfCol', F.color)}`;
      if (L.k === 'data_memo') h += inp('text1', '첫 줄', 14) + inp('text2', '둘째 줄', 16) + inp('date', '날짜 (MM.DD)', 5, '10.14'); }
    h += range('pS', '크기', 8, 400, Math.round(((boxes.find(q => q.id === L.id) || {}).s ?? L.s) * 100), '%') + (L.type === 'text' || L.type === 'stat' ? `<button type="button" class="acc" id="pMoreT" aria-expanded="${moreTxt}" aria-controls="pTxtAcc"><span>자간</span><i aria-hidden="true">${moreTxt ? '▴' : '▾'}</i></button><div id="pTxtAcc" class="acc-body"${moreTxt ? '' : ' hidden'}>${range('pLs', '자간', -10, 60, L.ls || 0, 'px')}</div>` + fxHTML(L) : '') + range('pR', '회전', -180, 180, Math.round((L.r || 0) * 180 / Math.PI), '°') + (isTop(L) ? '' : range('pO', '불투명도', 5, 100, Math.round((L.o ?? 1) * 100), '%'));
    // block actions (앞으로/뒤로/인물 뒤로/복제/삭제) live in the on-canvas mini toolbar (#miniBar) for every block type
  } else if (mode === 'stat') {
    h += `<div class="sh-head"><h3>기록 블록 추가</h3></div><p class="hint lock">🔒 값은 계산 결과 그대로예요</p><div class="grid2">${Object.entries(STATS).filter(([k]) => k !== 'combo').map(([k, [n]]) => `<button type="button" class="pre" data-addstat="${k}"><b>${n}</b><small>${esc(statValue(state.story, doc, k))}</small></button>`).join('')}<button type="button" class="pre" data-addcard="0"><b>티어 카드</b><small>카드</small></button><button type="button" class="pre" data-addcard="1"><b>티어 배지</b><small>${esc(state.story.word)}</small></button></div>`;
  } else if (mode === 'sticker') {
    h += `<div class="sh-head"><h3>스티커</h3></div><div class="grid3">${Object.entries(STK_NAMES).filter(([k]) => !k.startsWith('data_')).map(([k, n]) => `<button type="button" class="pre stk" data-addstk="${k}"><canvas width="120" height="120" data-stk="${k}"></canvas><small>${n}</small></button>`).join('')}</div><span class="lbl sm">직접 입력 스티커 (내용을 직접 적어요)</span><div class="grid3">${Object.keys(DATA_STK).map(k => `<button type="button" class="pre stk" data-addin="${k}"><canvas width="120" height="120" data-stk="${k}"></canvas><small>${DATA_STK[k].n}</small></button>`).join('')}</div>`;
  } else if (mode === 'bg') {
    const GR = [['#0F1620', '#14324a'], ['#3DC8F5', '#9b8cff'], ['#ff8a5b', '#ffd166'], ['#ffd6e8', '#fff4c2'], ['#0b3d2e', '#3fd68a'], ['#1b1f26', '#5a24a8']];
    h += `<div class="sh-head"><h3>배경</h3></div><div class="ed-btns"><button type="button" class="chip-btn" data-bg="tier" aria-pressed="${doc.bg.type === 'tier'}">티어 색</button><button type="button" class="chip-btn" data-bg="dark" aria-pressed="${doc.bg.type === 'dark'}">다크</button><button type="button" class="chip-btn primary-chip" id="bgPhoto">📷 사진 배경</button></div>
      <span class="lbl sm">그라데이션</span><div class="qcs">${GR.map((g, i) => `<button type="button" class="qc grad" data-grad="${i}" aria-label="그라데이션 ${i + 1}" style="background:linear-gradient(135deg,${g[0]},${g[1]})"></button>`).join('')}</div><span class="lbl sm">단색</span>${chipsHTML()}`;
    if (doc.bg.type === 'photo') h += (photos[doc.bg.pid] ? `<span class="lbl sm">배경 사진</span>` + photoEdHTML(doc.bg) : '') + range('bgZ', '확대', 100, 400, Math.round((doc.bg.pz || 1) * 100), '%') + '<p class="hint">빈 곳을 끌면 배경 사진이 움직여요</p>' + (photos[doc.bg.pid] ? '<div class="ed-btns"><button type="button" class="chip-btn" id="bgOut">꺼내기 · 움직이는 사진으로</button></div>' : '');
    P.dataset.grads = JSON.stringify(GR);
  } else if (mode === 'layers') {
    h += `<div class="sh-head"><h3>레이어 (${doc.layers.length})</h3></div><ol class="layers">${[...doc.layers].reverse().map(l => `<li><button type="button" class="fopt" data-pick="${l.id}"><b>${esc(lname(l))}</b><small>${l.hidden ? '숨김' : ''}</small></button>${isTop(l) ? '' : `<button type="button" class="star" data-vis="${l.id}" aria-label="${esc(lname(l))} ${l.hidden ? '보이기' : '숨기기'}">${l.hidden ? '🙈' : '👁'}</button>`}</li>`).join('')}</ol>`;
  } else h += `<p class="hint">오른쪽 도구로 텍스트·사진·스티커·기록 블록·배경을 더하고, 캔버스에서 바로 끌고 돌려 보세요. 아무것도 안 바꿔도 바로 저장돼요.</p><div class="ed-btns"><button type="button" class="chip-btn" id="myOff" aria-pressed="${!MY().off}">내 스타일 기억 ${MY().off ? '꺼짐' : '켜짐'}</button><button type="button" class="chip-btn" id="myReset">내 스타일 초기화</button></div><p class="hint">마지막에 쓴 템플릿·형식·글꼴·색·테두리를 다음 기록에도 자동으로 써요</p>`;
  P.innerHTML = h; bindPanel(L);
  for (const c of P.querySelectorAll('canvas[data-stk]')) { const g = c.getContext('2d'); g.clearRect(0, 0, 120, 120); const L2 = mk('sticker', { k: c.dataset.stk, col: '#ffffff' }); renderMini(g, L2); }
  paintSelInfo();
}
async function renderMini(g, L) { const cv = await renderDoc(state.story, { bg: { type: 'solid', c1: '#1F2B3B' }, layers: [{ ...L, x: 540, y: 960, s: 1 }] }, photos); const b = cv.__boxes[0], sz = Math.max(b.w, b.h) * 1.15; g.drawImage(cv, 540 - sz / 2, 960 - sz / 2, sz, sz, 0, 0, 120, 120); }
function paintSelInfo() { const L = sel && getL(sel); if (!L) return; for (const [id, v, u] of [['pS', Math.round(L.s * 100), '%'], ['pR', Math.round((L.r || 0) * 180 / Math.PI), '°']]) { const e = $(id); if (e && document.activeElement !== e) { e.value = v; $(id + 'V').textContent = v + u; } } }
// ---- weather sticker auto-fill (Open-Meteo): record date + hour + place; location is used once and never stored ----
let wxDate = isoDay(), wxHour = new Date().getHours(), wxPlaces = [], wxMsg = '', wxBusy = false;
const wxHTML = () => `<div class="wxfill" id="wxFill"><span class="lbl sm">날씨 불러오기</span><div class="wxrow"><input type="date" id="wxDate" value="${wxDate}" max="${isoDay()}" aria-label="기록 날짜"><select id="wxHour" aria-label="시간">${Array.from({ length: 24 }, (_, h) => `<option value="${h}"${h === wxHour ? ' selected' : ''}>${h}시</option>`).join('')}</select></div>
  <button type="button" class="chip-btn primary-chip" id="wxGeo"${wxBusy ? ' disabled' : ''}>📍 날씨 불러오기 (현재 위치)</button>
  <div class="wxrow"><input id="wxQ" type="search" autocomplete="off" placeholder="장소 검색 (예: 반포한강공원)" aria-label="장소 검색"><button type="button" class="chip-btn" id="wxFind">검색</button></div>
  ${wxPlaces.length ? `<div class="wxres" id="wxRes">${wxPlaces.map((q, i) => `<button type="button" class="chip-btn" data-wxp="${i}">${esc(q.name)}</button>`).join('')}</div>` : ''}<p class="hint" id="wxMsg" role="status" aria-live="polite">${esc(wxMsg) || '위치는 날씨 조회에만 한 번 쓰이고 저장되지 않아요'}</p></div>`;
function bindWx(L) { const on = (id, ev, f) => { const e = $(id); if (e) e.addEventListener(ev, f); }, msg = t => { wxMsg = t; const m = $('wxMsg'); if (m) m.textContent = t; };
  on('wxDate', 'change', e => { wxDate = e.target.value || isoDay(); }); on('wxHour', 'change', e => { wxHour = +e.target.value; });
  const fill = async (lat, lon) => { wxBusy = true; msg('날씨를 불러오는 중…'); try { const r = await fetchWeather(lat, lon, wxDate, wxHour); L.f = { ...(L.f || {}), ...r }; wxPlaces = []; wxMsg = ''; wxBusy = false; changed(true); paintPanel(); status('날씨를 채웠어요 · 직접 고쳐도 돼요'); }
    catch { wxBusy = false; msg(navigator.onLine === false ? '오프라인이에요 · 날씨를 직접 입력해 주세요' : '날씨를 불러오지 못했어요 · 직접 입력해 주세요'); } };
  on('wxGeo', 'click', async () => { msg('위치 확인 중…'); let p; try { p = await wxHere(); } catch (e) { msg(e && e.code === 1 ? '위치 권한이 없어요 · 장소를 검색하거나 직접 입력해 주세요' : '위치를 알 수 없어요 · 장소를 검색하거나 직접 입력해 주세요'); return; } fill(p.lat, p.lon); });
  const find = async () => { const q = ($('wxQ').value || '').trim(); if (!q) return; msg('장소 찾는 중…'); try { wxPlaces = await searchPlace(q); wxMsg = wxPlaces.length ? '장소를 골라 주세요' : '찾는 장소가 없어요 · 다른 이름으로 검색해 보세요'; paintPanel(); } catch { msg(navigator.onLine === false ? '오프라인이에요 · 날씨를 직접 입력해 주세요' : '장소 검색에 실패했어요 · 직접 입력해 주세요'); } };
  on('wxFind', 'click', find); on('wxQ', 'keydown', e => { if (e.key === 'Enter') { e.preventDefault(); find(); } });
  on('wxRes', 'click', e => { const b = e.target.closest('[data-wxp]'); if (!b) return; const q = wxPlaces[+b.dataset.wxp]; if (q) fill(q.lat, q.lon); }); }
function bindPanel(L) {
  const P = $('panel'), on = (id, ev, f) => { const e = $(id); if (e) e.addEventListener(ev, f); };
  on('pDone', 'click', () => { sel = null; multi.clear(); multiSnap = null; libOpen = false; paintPanel(); paintOvl(); });
  on('tText', 'input', e => { L.t = e.target.value; changed(); $('pName').textContent = lname(L); });
  on('raceIn', 'input', e => { doc.race = e.target.value; changed(); });
  const segOn = (id, f) => { const s = $(id); if (s) s.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { f(b.dataset.v); changed(true); paintPanel(); } }); };
  segOn('pV', v => { if (L.type === 'stat' && L.look == null) L.look = L.v === 3 ? 'run' : 'std'; L.v = +v; }); segOn('pBox', v => L.box = v); segOn('pCT', v => { colMode = v; }); on('pBgNone', 'click', () => { if (L.v === 2) { delete L.bcol; delete L.bo; } else { L.box = 'none'; } changed(true); paintPanel(); }); segOn('pAl', v => L.al = v); segOn('pMask', v => L.mask = v); segOn('pFilter', v => L.filter = v); segOn('bgFilter', v => doc.bg.filter = v);
  const rg = (id, f, u = '') => on(id, 'input', e => { f(+e.target.value); $(id + 'V').textContent = e.target.value + u; changed(); });
  rg('pS', v => { pinS(L); L.s = v / 100; }, '%'); rg('pR', v => L.r = v * Math.PI / 180, '°'); rg('pO', v => L.o = v / 100, '%'); rg('pBo', v => L.bo = v / 100, '%'); rg('pTs', v => L.size = v); rg('pLs', v => L.ls = v, 'px');
  rg('pCz', v => L.cz = v / 100, '%'); rg('pCx', v => L.cx = v / 100); rg('pCy', v => L.cy = v / 100); rg('bgZ', v => doc.bg.pz = v / 100, '%');
  on('pMoreT', 'click', e => { moreTxt = !moreTxt; const b = e.currentTarget; b.setAttribute('aria-expanded', moreTxt); b.querySelector('i').textContent = moreTxt ? '▴' : '▾'; $('pTxtAcc').hidden = !moreTxt; });
  const setR = (id, v) => { const r = $(id); if (!r) return; v = Math.min(+r.max, Math.max(+r.min, Math.round(v))); if (id === 'pR' && Math.abs(v) <= 3) v = 0; r.value = v; r.dispatchEvent(new Event('input')); commit(); };
  on('pR', 'input', e => { const v = +e.target.value; if (v !== 0 && Math.abs(v) <= 3) { e.target.value = 0; e.target.dispatchEvent(new Event('input')); } });
  for (const b of P.querySelectorAll('[data-stp]')) b.addEventListener('click', () => { const r = $(b.dataset.stp); setR(b.dataset.stp, +r.value + +b.dataset.d); });
  for (const b of P.querySelectorAll('[data-rv]')) b.addEventListener('click', () => { const id = b.dataset.rv, r = $(id), inp = document.createElement('input');
    Object.assign(inp, { type: 'number', inputMode: 'numeric', min: r.min, max: r.max, value: r.value, className: 'rv-in' }); inp.setAttribute('aria-label', b.getAttribute('aria-label'));
    b.replaceWith(inp); inp.focus(); inp.select(); let done = false; const fin = ok => { if (done) return; done = true; inp.replaceWith(b); if (ok && inp.value !== '' && !isNaN(+inp.value)) setR(id, +inp.value); b.querySelector('output').textContent = r.value + b.dataset.u; };
    inp.addEventListener('keydown', e => { if (e.key === 'Enter') fin(true); if (e.key === 'Escape') fin(false); }); inp.addEventListener('blur', () => fin(true)); });
  on('pFill', 'click', () => { photoTarget = 'fill'; pickPhoto(); }); on('pRefill', 'click', () => { photoTarget = 'fill'; pickPhoto(); });
  on('pAsBg', 'click', () => photoToBg(L)); on('bgOut', 'click', () => bgToLayer());
  on('bgPhoto', 'click', () => { photoTarget = 'bg'; pickPhoto(); });
  if (L && L.type === 'photo') bindPhotoEd(L); else if (!L && mode === 'bg' && doc.bg.type === 'photo') bindPhotoEd(doc.bg);
  if (L && (L.type === 'text' || L.type === 'stat')) bindFx(L);
  if (L && L.type === 'sticker') { for (const e of P.querySelectorAll('[data-df]')) { e.addEventListener('input', () => { L.f = { ...(L.f || {}), [e.dataset.df]: e.value }; changed(); }); e.addEventListener('change', () => commit()); }
    bindWx(L);
    on('dfIcon', 'click', e => { const b = e.target.closest('[data-v]'); if (!b) return; L.f = { ...(L.f || {}), icon: b.dataset.v }; changed(true); paintPanel(); });
    on('dfCol', 'click', e => { const b = e.target.closest('[data-olc]'); if (!b) return; L.f = { ...(L.f || {}), color: b.dataset.olc }; changed(true); paintPanel(); }); const cp = $('dfColPick'); if (cp) cp.addEventListener('input', e => { L.f = { ...(L.f || {}), color: e.target.value }; changed(); }); }
  on('wxIcons', 'click', e => { const b = e.target.closest('[data-wx]'); if (!b) return; L.t = b.dataset.wx + ' ' + String(L.t || '').replace(/^\S*\p{Extended_Pictographic}\S*\s*/u, ''); changed(true); paintPanel(); });
  on('myReset', 'click', () => { localStorage.removeItem('runtier:mystyle'); status('내 스타일을 지웠어요 · 다음 기록은 기본 설정으로 시작해요', 3000); paintPanel(); });
  on('myOff', 'click', () => { const m = MY(); if (m.off) LS('runtier:mystyle', {}); else LS('runtier:mystyle', { off: true }); paintPanel(); });
  on('fClose', 'click', () => { libOpen = false; paintPanel(); });
  on('fSearch', 'input', () => { $('fList').innerHTML = libHTML(L); });
  on('fCats', 'click', e => { const b = e.target.closest('[data-c]'); if (!b) return; fontCat = b.dataset.c; for (const x of $('fCats').children) x.setAttribute('aria-checked', String(x === b)); $('fList').innerHTML = libHTML(L); });
  on('eyedrop', 'click', () => { pickMode = true; status('캔버스에서 가져올 색을 탭하세요', 4000); });
  P.onclick = e => { const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (d.c && t.classList.contains('qc')) setCol(d.c);
    if (d.tierc) setCol('@tier');
    if (d.moreCol) { const host = $('cpHost'); host.hidden = !host.hidden; t.setAttribute('aria-expanded', String(!host.hidden)); if (!host.hidden) { host.appendChild($('cpick')); $('cpick').hidden = false; hsvCol = ''; paintPicker(); } }
    if (d.flib) openFontSheet();
    if (d.fk !== undefined && t.closest('#panel')) pickFont(d.fk || null);
    if (d.star) { const f = favs(); LS('runtier:fontfav', f.includes(d.star) ? f.filter(x => x !== d.star) : [d.star, ...f]); $('fList').innerHTML = libHTML(L); }
    if (d.act) act(d.act);
    if (d.addstat) { if (d.addstat === 'top' && doc.layers.some(isTop)) { sel = doc.layers.find(isTop).id; mode = null; paintPanel(); paintOvl(); status('상위 %는 이미 있어요'); return; } addLayer(mk('stat', { stat: d.addstat, v: 0 })); }
    if (d.addcard) addLayer(mk('card', { v: +d.addcard, s: d.addcard === '0' ? .8 : 1 }));
    if (d.addstk) addLayer(mk('sticker', { k: d.addstk, col: '#ffffff' }));
    if (d.addin) { addLayer(mk('sticker', { k: d.addin, s: .6, f: { ...DATA_STK[d.addin].f }, x: 540, y: FH() * ({ data_weather: .3, data_course: .5, data_bib: .45, data_memo: .7 }[d.addin] || .5) })); setTimeout(() => { const ta = document.querySelector('#panel [data-df]'); if (ta) { ta.focus(); ta.select(); } }, 50); }
    if (d.bg) { doc.bg = { type: d.bg }; changed(true); paintPanel(); }
    if (d.grad) { const g = JSON.parse(P.dataset.grads)[+d.grad]; doc.bg = { type: 'grad', c1: g[0], c2: g[1] }; changed(true); paintPanel(); }
    if (d.pick) { sel = d.pick; mode = null; paintPanel(); paintOvl(); }
    if (d.vis) { const l = getL(d.vis); l.hidden = !l.hidden; changed(true); paintPanel(); }
  };
  for (const r of P.querySelectorAll('input[type=range]')) r.addEventListener('change', () => commit());
  paintPicker();
}
// ---- save / share ----
const pxSig = cv => { const t = document.createElement('canvas'); t.width = 54; t.height = Math.round(54 * cv.height / cv.width); const g = t.getContext('2d'); g.drawImage(cv, 0, 0, t.width, t.height); const d = g.getImageData(0, 0, t.width, t.height).data; let a = []; for (let i = 0; i < d.length; i += 4) a.push((d[i] + d[i + 1] + d[i + 2]) / 3 | 0); return { w: cv.width, h: cv.height, a }; };
window.__exportSig = async () => pxSig(await finalCanvas()); window.__previewSig = () => pxSig($('tplPreview'));
async function finalCanvas() { commit(); const cv = await renderDoc(state.story, doc, photos); window.__lastStory = cv; return cv; }
$('save').addEventListener('click', async () => {
  const b = $('save'); if (b.disabled || !state.story) return; b.disabled = true; const lbl = b.textContent; b.textContent = '저장 중…';
  try { const cv = await finalCanvas(); const how = await saveStory(cv, `hoohaa-${state.story.key}.png`); b.textContent = how === 'cancelled' ? lbl : '저장했어요'; }
  catch (e) { console.error(e); b.textContent = '다시 시도해 주세요'; }
  setTimeout(() => { b.textContent = lbl; b.disabled = false; }, 1400);
});
$('share').addEventListener('click', async () => {
  const b = $('share'); if (b.disabled || !state.story) return; b.disabled = true;
  try { const cv = await finalCanvas(); const blob = await new Promise(r => cv.toBlob(r, 'image/png')), file = new File([blob], `hoohaa-${state.story.key}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch (e) { if (e.name !== 'AbortError') throw e; } }
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); status('이 브라우저는 바로 공유를 지원하지 않아 이미지로 저장했어요', 3500); }
  } catch (e) { console.error(e); status('다시 시도해 주세요'); }
  b.disabled = false;
});
status(''); paintTop();

// ---------- tier visuals ----------
const KEY = { 아이언: 'iron', 브론즈: 'bronze', 실버: 'silver', 골드: 'gold', 플래티넘: 'platinum', 에메랄드: 'emerald', 다이아몬드: 'diamond', 마스터: 'master', 그랜드마스터: 'grandmaster', 챌린저: 'challenger' };
const LONG = new Set(['grandmaster', 'challenger']);
const ICON = { iron: '■', bronze: '●', silver: '▲', gold: '★', platinum: '✦', emerald: '❖', diamond: '◆', master: '♛', grandmaster: '♚', challenger: '✪' };
const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
const mix = (h, w, a) => '#' + hex(h).map((c, i) => Math.round(c * (1 - a) + hex(w)[i] * a).toString(16).padStart(2, '0')).join('');
const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
function tierStyle(name) {
  const [major, div] = name.split(' '), key = KEY[major], tk = TK.tier[key];
  const roman = { 3: 'III', 2: 'II', 1: 'I' }[div] || '';
  let stops = tk.gradient;
  if (roman === 'III') stops = stops.map(c => mix(c, '#000000', 0.12));
  if (roman === 'I') stops = stops.map(c => mix(c, '#FFFFFF', 0.14));
  const grad = tk.gradient_angle_deg === 'conic' ? `conic-gradient(from 200deg, ${stops.join(',')}, ${stops[0]})` : `linear-gradient(${tk.gradient_angle_deg}deg, ${stops.join(',')})`;
  const base = roman && tk.divisions ? tk.divisions[roman] : tk.base;
  return { key, roman, pips: roman ? { III: 1, II: 2, I: 3 }[roman] : 0,
    css: `--grad:${grad};--on:${tk.on};--tier:${base};--tier-text:${tk.tint_text.dark};--tint:${tk.tint.dark};--glow:${rgba(tk.glow.color, tk.glow.alpha)};--glow-blur:${Math.max(tk.glow.blur_px, 2)}px` };
}
const short = t => t.replace(/^0:/, ''); // 0:23:27 -> 23:27

const PACES = [['E', '편하게', '대화 가능한 편한 속도, 주간 대부분. 그날 컨디션에 맞춰 이 범위 안에서 편하게 달리면 돼요.'],
  ['M', '마라톤', '풀코스 목표 속도, 장거리 훈련에 섞어서.'], ['T', '템포', '조금 힘들지만 버틸 만한 속도, 20분 정도 꾸준히.'],
  ['I', '인터벌', '숨이 꽤 차는 속도, 3~5분 달리고 쉬기 반복.'], ['R', '리피티션', '가장 빠른 속도, 200~400m 짧게 달리고 충분히 휴식.']];
const METHOD = '입력한 기록으로 달리기 능력 점수(VDOT)를 구하고, 같은 점수를 다른 거리에 적용한 것(잭 다니엘스 공식). 그 거리에 맞는 훈련을 했을 때 기준이라, 특히 풀코스는 장거리 훈련이 부족하면 실제로는 더 걸릴 수 있어요.';

function renderResult(r) {
  const ts = tierStyle(r.tier), nx = r.nextTier;
  const evName = EVN[state.ev] || `${r.input.distanceKm}km`;
  const who = `${r.input.ageGroupLabel} ${r.input.sex === 'M' ? '남성' : '여성'}`, pubWho = ''; // pubWho: card + share images never reveal age/sex
  let prog;
  if (nx) {
    const lnT = Math.log(r.input.time.split(':').reduce((a, b) => a * 60 + +b, 0));
    const f = r.currentTierBoundSec ? (Math.log(r.currentTierBoundSec) - lnT) / (Math.log(r.currentTierBoundSec) - Math.log(nx.targetSec)) : 0;
    const pct = Math.round(100 * Math.min(0.97, Math.max(0.04, f)));
    prog = `<section class="card prog" aria-label="다음 티어까지">
      <div class="row"><span class="gap" id="nextGap">${esc(nx.tier)}까지 ${esc(evName)} ${nx.gapText} 단축</span><span class="tgt">목표 ${short(nx.targetTime)}</span></div>
      <div class="track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(nx.tier)}까지 진행도"><div style="width:${pct}%"></div></div>
      <div class="ends"><span>${esc(r.tier)}</span><span>${esc(nx.tier)}</span></div></section>`;
  } else prog = `<section class="card prog"><p class="congrats" id="nextGap">최고 티어 챌린저 달성! 정말 대단해요 🎉</p></section>`;
  const cells = [['5K', '5K'], ['10K', '10K'], ['half', '하프'], ['full', '풀']].map(([k, n]) => {
    const me = k === state.ev;
    return `<div class="cell${me ? ' me' : ''}"><div class="ev"><span>${n}</span>${me ? '<em>내 기록</em>' : ''}</div><div class="time">${short(r.predicted[k])}</div><div class="pace">${r.predictedPace[k]}</div></div>`;
  }).join('');
  const rows = PACES.map(([L, n, d], i) => `<button type="button" class="prow" aria-expanded="false" aria-controls="pe${i}">
      <span class="line"><span class="ltr">${L}</span><span class="nm">${n}</span><span class="pv">${r.trainingPaces[L].replace(/\/km/g, '').replace(' ~ ', '~')}<small>/km</small></span><span class="chev" aria-hidden="true">▾</span></span>
      <span class="exp" id="pe${i}" hidden>${d}</span></button>`).join('');
  $('resBody').innerHTML = `
    <section class="tier-card fluid t-${ts.key} b-${TK.tier[ts.key].card.band}" aria-label="내 티어: ${esc(r.tier)}">
      <span class="tc-wm" aria-hidden="true">${WM_SVG}</span>
      <div class="tc-top"><span class="tc-brand" aria-hidden="true">HOOHAA</span><span class="tc-label" aria-hidden="true">RUNNING TIER</span></div>
      <span class="tc-chip" aria-hidden="true"><i class="tc-ic rc">${runChipSVG(ts.key)}</i></span>
      <div class="tc-name${LONG.has(ts.key) ? ' long' : ''}" aria-hidden="true"><span class="w">${ts.key.toUpperCase()}</span>${ts.roman ? `<span class="n" data-d="${ts.roman}"><i></i>${ts.roman}</span>` : ''}</div>
      <div class="tc-meta"><span class="rec">${esc(evName)} ${short(r.input.time)} · ${r.pace}</span><span class="rank"><span class="tc-ko" id="tierName">${esc(r.tier.replace(/\s*[123]$/, ''))}${ts.roman ? ` <span class="dv">${ts.roman}</span>` : ''}</span> · <b>${esc(r.topPercentLabel)}</b></span></div>
    </section>
    <figure class="tc-quote" style="--qc:${TK.tier[ts.key].text}"><span class="ql">이 티어 러너는</span><p id="tierCmt">${esc(tierComment(ts.key, ts.roman))}</p></figure>
    <p class="who-line" id="topPct">${who} <b>${esc(r.topPercentLabel)}</b></p>
    ${prog}
    <section class="card ladder" aria-labelledby="hLad"><h2 id="hLad">전체 티어 <span class="lad-sub">${esc(evName)} · ${esc(who)} 기준</span></h2>
      <div class="lad-head" aria-hidden="true"><span>티어</span><span>기록</span><span>상위</span></div>
      <ol class="lad" id="ladder">${[...r.tierLadder].reverse().map(x => { const k = KEY[x.tier.split(' ')[0]], me = x.index === r.tierIndex, m = STORY_MAT[k];
        return `<li class="lr${me ? ' me' : ''}" style="--tc:${TK.tier[k].text};--tc2:${TK.tier[k].base};--ta:${accentOf({ key: k })}"${me ? ' id="ladMe" aria-current="true"' : ''}><span class="ln"><i class="dot"></i>${esc(x.tier)}${me ? '<em class="tag">내 티어</em>' : ''}</span><span class="lt">${x.minTime ? short(x.minTime) + ' 이내' : '기록 무관'}${me ? `<small>내 기록 ${short(r.input.time)}</small>` : ''}</span><span class="lp">${x.topPct === 100 ? '전체' : (+x.topPct).toFixed(1) + '%'}</span>${me ? `<span class="lcm">${esc(tierComment(k, ({ 3: 'III', 2: 'II', 1: 'I' })[x.tier.split(' ')[1]] || ''))}</span>` : ''}</li>`; }).join('')}</ol>
    </section>
    <section class="card vdot"><h2>VDOT <button type="button" class="info" aria-expanded="false" aria-controls="vdInfo" aria-label="VDOT 설명">ⓘ</button></h2>
      <div class="val num">${r.vdot.toFixed(1)}</div>
      <p class="more" id="vdInfo" hidden>VDOT는 기록으로 계산한 달리기 능력 점수예요. 이 값이 곧 VO2max 추정치예요 (실측값이 아닌 추정).</p></section>
    <section class="card"><h2>예상 기록 <button type="button" class="info" aria-expanded="false" aria-controls="prInfo" aria-label="예상 기록 설명">ⓘ</button></h2>
      <p class="more" id="prInfo" hidden>${METHOD}</p>
      <div class="grid">${cells}</div>
      </section>
    <section class="card"><h2>훈련 페이스</h2>${rows}</section>`;
  state.story = { key: ts.key, tierKo: r.tier, word: ts.key.toUpperCase(), roman: ts.roman, long: LONG.has(ts.key),
    title: `${evName} 성적표`, recLine: `${evName} ${short(r.input.time)} · ${r.pace}`, who: pubWho, topLabel: r.topPercentLabel, headline: r.topPercentLabel, time: short(r.input.time), pace: r.pace, vdot: r.vdot.toFixed(1),
    nextLine: nx ? `${nx.tier}까지 ${evName} ${nx.gapText} 단축` : '최고 티어 챌린저 달성!' };
  requestAnimationFrame(() => { const l = $('ladder'), me = $('ladMe'); if (l && me) l.scrollTop = me.offsetTop - l.clientHeight / 2 + me.offsetHeight / 2; });
  refreshTpl();
  for (const b of $('resBody').querySelectorAll('.info, .prow')) b.addEventListener('click', () => {
    const el = $(b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open)); el.hidden = !open; const c = b.querySelector('.chev'); if (c) c.textContent = open ? '▴' : '▾';
  });
}
  return { renderResult };
}
