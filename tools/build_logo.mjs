// hoohaa 로고(투표 1등 2번 "평면 2색")를 원본 데이터에서 만든다. 원본은 tools/logo/kit.json 하나다.
//
// kit.json: 글자 h·o·a의 외곽선(Jost ExtraBold Italic, SIL OFL 1.1에서 꺼내 다듬은 것, 크기 100)과
// 스톱워치 o의 조각(바깥 고리, 얼굴, 꼭지, 바늘. 작은 크기용 꼭지·바늘은 crownS·handS). 글꼴 파일 없이 이것만으로 그린다.
//
// 쓰는 법(레포 루트에서):
//   node tools/build_logo.mjs          폰 앱 자산: mobile/assets/logo/(테마별 워드마크 PNG @1x·2x·3x), 앱 아이콘들
//   node tools/build_logo.mjs --web    웹 자산(아직 쓰지 않는다. 웹과 티어 카드는 나중에 바꾸기로 했다):
//       icons/wordmark.svg, icons/symbol.svg, favicon.svg, src/editor/logo-geom.js, 모든 html의 머리 로고,
//       PNG 아이콘·favicon.ico·og.png(tools/logo/render_png.mjs)
// PNG는 Playwright(Chromium)로 렌더한다. 레포 루트에 package.json이 없어 전역 설치를 찾는다.
import { readFileSync, writeFileSync, readdirSync, statSync } from 'node:fs';
import { join, dirname, relative } from 'node:path';
import { fileURLToPath } from 'node:url';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const K = JSON.parse(readFileSync(join(root, 'tools/logo/kit.json'), 'utf8'));
const r1 = (n) => Math.round(n * 10) / 10;
export const VOLT = { bg: '#0D0D0B', ink: '#F6F6F1', face: '#C8F03C', hand: '#0D0D0B' };
/** 폰 앱 테마별 로고 색(mobile/src/theme/colors.ts의 textPrimary, accent, onAccent와 같다). */
export const THEME_LOGO = {
  volt: VOLT,
  nightSky: { bg: '#0A0F16', ink: '#F4F6F8', face: '#3DC8F5', hand: '#0A0F16' },
  sunset: { bg: '#120E13', ink: '#F8F3F5', face: '#FF5C8A', hand: '#120E13' },
};

/**
 * 로고 몸통(<g>들)과 viewBox. paint는 역할별 속성 문자열을 돌려준다(색이나 class).
 * o: 'hoohaa' 워드마크, 'o' 심볼. small: 16~27px용(꼭지는 1시 방향 돌기 하나, 옆 버튼 없음, 바늘 굵게).
 */
export function build({ text = 'hoohaa', small = false, tracking = text === 'hoohaa' ? (small ? 1 : -1) : 0, paint }) {
  let x = 0, x2 = 0, body = '';
  [...text].forEach((ch, i) => {
    const g = K.g[ch], watch = (text === 'o' && i === 0) || (text !== 'o' && i === 1);
    body += `<g transform="translate(${r1(x)},0)">`;
    if (watch) {
      // 얼굴을 먼저, 고리 밑으로 조금 넓게(테두리 1) 깐다. 얼굴과 고리 구멍의 가장자리가 겹치는 자리에 생기는 머리카락 같은 틈을 막는다.
      body += `<path ${paint('face')} stroke-width="1" stroke-linejoin="round" d="${K.w.face}"/>`;
      body += `<path ${paint('ink')} fill-rule="evenodd" d="${K.w.outer}${K.w.face}"/>`;
      body += `<g ${paint('ink')}>${small ? K.w.crownS : K.w.crown}</g>`;
      body += `<g ${paint('hand')}>${small ? K.w.handS : K.w.hand}</g>`;
    } else body += `<path ${paint('ink')} fill-rule="evenodd" d="${g.d}"/>`;
    body += '</g>';
    x2 = x + g.x2; x += g.adv + tracking;
  });
  // 심볼만 그릴 때는 꼭지 끝이 위 끝이다(글자 'h'의 높이까지 잡으면 심볼이 아래로 처진다).
  const crownTop = small ? K.w.topS : K.w.top, top = text === 'o' ? crownTop : Math.min(K.y1, crownTop), pad = 1;
  let x1 = K.g[text[0]].x1 - pad, y1 = top - pad, w = x2 + pad - x1, h = K.y2 + pad - y1;
  if (text === 'o') { const s = Math.max(w, h) + K.size * 0.04; x1 -= (s - w) / 2; y1 -= (s - h) / 2; w = h = s; }
  return { body, vb: [r1(x1), r1(y1), r1(w), r1(h)] };
}


// ---- 평평한 경로로 펴기: 캔버스(Path2D)와 단색 워터마크가 변환 없이 바로 쓸 수 있게 ----
const mul = (a, b) => [a[0] * b[0] + a[2] * b[1], a[1] * b[0] + a[3] * b[1], a[0] * b[2] + a[2] * b[3], a[1] * b[2] + a[3] * b[3], a[0] * b[4] + a[2] * b[5] + a[4], a[1] * b[4] + a[3] * b[5] + a[5]];
const ID = [1, 0, 0, 1, 0, 0];
function parseTransform(t) {
  let m = ID;
  for (const [, fn, args] of (t || '').matchAll(/(\w+)\(([^)]*)\)/g)) {
    const v = args.split(/[\s,]+/).filter(Boolean).map(Number);
    if (fn === 'translate') m = mul(m, [1, 0, 0, 1, v[0], v[1] || 0]);
    else if (fn === 'scale') m = mul(m, [v[0], 0, 0, v[1] ?? v[0], 0, 0]);
    else if (fn === 'matrix') m = mul(m, v);
    else if (fn === 'rotate') { const a = (v[0] * Math.PI) / 180, c = Math.cos(a), s = Math.sin(a), cx = v[1] || 0, cy = v[2] || 0; m = mul(m, [1, 0, 0, 1, cx, cy]); m = mul(m, [c, s, -s, c, 0, 0]); m = mul(m, [1, 0, 0, 1, -cx, -cy]); }
  }
  return m;
}
const ap = (m, x, y) => [m[0] * x + m[2] * y + m[4], m[1] * x + m[3] * y + m[5]];
const P = (m, x, y) => ap(m, x, y).map(r1).join(' ');
function pathD(d, m) { // M L Q C Z, 절대 좌표만(kit의 경로가 그렇다)
  let out = '';
  for (const [, c, nums] of d.matchAll(/([MLQCZ])([^MLQCZ]*)/g)) {
    const v = (nums.match(/-?\d*\.?\d+(?:e-?\d+)?/g) || []).map(Number);
    if (c === 'Z') { out += 'Z'; continue; }
    out += c; for (let i = 0; i < v.length; i += 2) out += (i ? ' ' : '') + P(m, v[i], v[i + 1]);
  }
  return out;
}
const K4 = 0.5523;
function rectD(x, y, w, h, rx, m) {
  const r = Math.min(rx || 0, w / 2, h / 2);
  if (!r) return `M${P(m, x, y)}L${P(m, x + w, y)}L${P(m, x + w, y + h)}L${P(m, x, y + h)}Z`;
  const k = r * K4;
  return `M${P(m, x + r, y)}L${P(m, x + w - r, y)}C${P(m, x + w - r + k, y)} ${P(m, x + w, y + r - k)} ${P(m, x + w, y + r)}` +
    `L${P(m, x + w, y + h - r)}C${P(m, x + w, y + h - r + k)} ${P(m, x + w - r + k, y + h)} ${P(m, x + w - r, y + h)}` +
    `L${P(m, x + r, y + h)}C${P(m, x + r - k, y + h)} ${P(m, x, y + h - r + k)} ${P(m, x, y + h - r)}` +
    `L${P(m, x, y + r)}C${P(m, x, y + r - k)} ${P(m, x + r - k, y)} ${P(m, x + r, y)}Z`;
}
const circleD = (cx, cy, r, m) => rectD(cx - r, cy - r, 2 * r, 2 * r, r, m);
function capsuleD(x1, y1, x2, y2, w, m) { // 둥근 끝 선 = 회전한 둥근 사각
  const len = Math.hypot(x2 - x1, y2 - y1), a = (Math.atan2(y2 - y1, x2 - x1) * 180) / Math.PI;
  return rectD(-w / 2, -w / 2, len + w, w, w / 2, mul(m, parseTransform(`translate(${x1} ${y1}) rotate(${a})`)));
}
const attr = (s, n) => { const r = new RegExp(`\\b${n}="([^"]*)"`).exec(s); return r ? r[1] : null; };
/** build()가 만든 마크업을 역할별 경로 목록으로 편다. 조각마다 따로 채운다(겹친 조각을 한 경로로 합치면 짝홀 규칙에 뚫린다). */
export function flatten(body) {
  const roles = { ink: [], face: [], hand: [] }, stack = [{ m: ID, role: null }];
  for (const [tag] of body.matchAll(/<\/?[a-z]+[^>]*>/g)) {
    if (tag.startsWith('</')) { if (tag === '</g>') stack.pop(); continue; }
    const top = stack[stack.length - 1], m = mul(top.m, parseTransform(attr(tag, 'transform'))), role = attr(tag, 'data-r') || top.role;
    if (tag.startsWith('<g')) { stack.push({ m, role }); continue; }
    if (tag.startsWith('<path')) {
      const d = attr(tag, 'd');
      if (attr(tag, 'fill') === 'none') { const [, a, b, c, e] = /M([-\d.]+) ([-\d.]+)L([-\d.]+) ([-\d.]+)/.exec(d); roles[role].push(capsuleD(+a, +b, +c, +e, +attr(tag, 'stroke-width'), m)); }
      else roles[role].push(pathD(d, m));
    } else if (tag.startsWith('<rect')) roles[role].push(rectD(+attr(tag, 'x'), +attr(tag, 'y'), +attr(tag, 'width'), +attr(tag, 'height'), +attr(tag, 'rx') || 0, m));
    else if (tag.startsWith('<circle')) roles[role].push(circleD(+attr(tag, 'cx'), +attr(tag, 'cy'), +attr(tag, 'r'), m));
  }
  return roles;
}

const colorPaint = (c) => (role) => (role === 'hand' ? `fill="${c.hand}" stroke="${c.hand}"` : role === 'face' ? `fill="${c.face}" stroke="${c.face}"` : `fill="${c.ink}"`);
const classPaint = (role) => `class="wm-${role === 'ink' ? 'i' : role === 'face' ? 'f' : 'h'}"`; // .wm-f에도 stroke를 준다(theme.css)

/** 색을 넣은 독립 SVG. */
export function svgFile(opts, colors = VOLT) {
  const { body, vb } = build({ ...opts, paint: colorPaint(colors) });
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${vb[2]}" height="${vb[3]}">${body}</svg>`;
}

/** 둥근 사각 타일 위의 심볼(앱 아이콘, 파비콘). size는 타일 크기, k는 심볼이 차지하는 비율. */
export function tile(size, { small = false, radius = size * 0.22, k = 0.74, bg = VOLT.bg, colors = VOLT } = {}) {
  const { body, vb } = build({ text: 'o', small, paint: colorPaint(colors) });
  const s = size * k, sc = s / vb[3], tx = (size - s) / 2 - vb[0] * sc, ty = (size - s) / 2 - vb[1] * sc;
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 ${size} ${size}" width="${size}" height="${size}">` +
    (radius >= 0 ? `<rect width="${size}" height="${size}" rx="${r1(radius)}" fill="${bg}"/>` : '') +
    `<g transform="translate(${r1(tx)},${r1(ty)}) scale(${(Math.round(sc * 10000) / 10000)})">${body}</g></svg>`;
}

/** 머리 로고(인라인). 색은 CSS가 정한다. */
export function headerSvg() {
  const { body, vb } = build({ paint: classPaint });
  return `<svg class="wm" aria-hidden="true" focusable="false" xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${vb[2]}" height="${vb[3]}">${body}</svg>`;
}

/** 단색 실루엣(바늘은 뚫림). 안드로이드 단색 아이콘 등에 쓴다. */
export function monoSvg({ text = 'o', small = false, color = '#FFFFFF' } = {}) {
  const { body, vb } = build({ text, small, paint: (role) => `data-r="${role}"` }), f = flatten(body);
  const ps = (list, fill) => list.map((d) => `<path fill-rule="evenodd" fill="${fill}" d="${d}"/>`).join('');
  return `<svg xmlns="http://www.w3.org/2000/svg" viewBox="${vb.join(' ')}" width="${vb[2]}" height="${vb[3]}"><defs><mask id="m" maskUnits="userSpaceOnUse" x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}">` +
    `<rect x="${vb[0]}" y="${vb[1]}" width="${vb[2]}" height="${vb[3]}" fill="#fff"/>${ps(f.hand, '#000')}</mask></defs><g mask="url(#m)">${ps(f.ink, color)}${ps(f.face, color)}</g></svg>`;
}

function htmlFiles(dir, out = []) {
  for (const n of readdirSync(dir)) {
    if (['node_modules', '.git', 'mobile', 'docs', 'seg', '.trail'].includes(n)) continue;
    const p = join(dir, n);
    if (statSync(p).isDirectory()) htmlFiles(p, out); else if (n.endsWith('.html')) out.push(p);
  }
  return out;
}

async function buildWeb() {
  writeFileSync(join(root, 'icons/wordmark.svg'), svgFile({ text: 'hoohaa' }));
  writeFileSync(join(root, 'icons/symbol.svg'), tile(64));
  writeFileSync(join(root, 'favicon.svg'), tile(32, { small: true, radius: 7, k: 0.8 }));

  // 공유 이미지(캔버스)와 티어 카드 워터마크(DOM SVG)가 같이 쓰는 단색 도형. 역할별로 변환을 적용해 편 경로다.
  const wm = build({ paint: (role) => `data-r="${role}"` }), flat = flatten(wm.body);
  writeFileSync(join(root, 'src/editor/logo-geom.js'),
    `// tools/build_logo.mjs가 만든다. 손으로 고치지 않는다(tools/logo/kit.json을 고치고 다시 돌린다).\n` +
    `// hoohaa 워드마크(평면 2색 로고)의 도형. INK는 글자와 스톱워치 고리·꼭지, FACE는 스톱워치 얼굴, HAND는 바늘이다. 모두 경로 목록이고, 조각마다 따로 짝홀 규칙으로 채운다.\n` +
    `// 단색으로 쓸 때는 INK와 FACE를 채우고 HAND를 뚫는다.\n` +
    `export const LOGO_VB = ${JSON.stringify(wm.vb)};\n` +
    `export const LOGO_INK = ${JSON.stringify(flat.ink)};\n` +
    `export const LOGO_FACE = ${JSON.stringify(flat.face)};\n` +
    `export const LOGO_HAND = ${JSON.stringify(flat.hand)};\n`);

  let n = 0;
  const OLD = /<svg aria-hidden="true" focusable="false" xmlns="http:\/\/www\.w3\.org\/2000\/svg" viewBox="0 0 470 122" width="470" height="122">[\s\S]*?<\/g><\/g><\/svg>/;
  const NEW = /<svg class="wm"[\s\S]*?<\/svg>/;
  for (const f of htmlFiles(root)) {
    const s = readFileSync(f, 'utf8');
    const t = s.replace(OLD, headerSvg).replace(NEW, headerSvg);
    if (t !== s) { writeFileSync(f, t); n++; }
  }
  console.log(`svg 3개, logo-geom.js, html 머리 로고 ${n}개`);
  await (await import('./logo/render_png.mjs')).renderPngs(root, { tile, svgFile, VOLT });
}

if (process.argv[1] && fileURLToPath(import.meta.url) === process.argv[1]) {
  if (process.argv.includes('--web')) await buildWeb();
  else await (await import('./logo/render_app.mjs')).renderApp(root, { build, svgFile, tile, monoSvg, VOLT, THEME_LOGO });
}
