// Result screen (#resBody): tier card, metrics, next-tier progress, tabs (tier ladder, predicted times, training paces)
// and the shared result image (html-to-image). Moved out of editor.js; it is not part of the share-image editor.
// Module level: tier data and pure helpers. mountResult(env, hooks) holds what the closure held (weeklyKm, the
// html-to-image loader, the cached share image, the IntersectionObservers) and returns renderResult. mountEditor
// calls it once, at the same point as before, and passes the two editor hooks renderResult needs.
import { TK, tierComment, runChipSVG, accentOf } from './tokens.js';
import { paceGuide } from './workout.js';

// hoohaa v4 wordmark (stopwatch 'o') as a debossed mark: dark upper edge, light lower edge, faint recessed fill
export const WM_G = `<g transform="translate(40,4) skewX(-14) translate(0,0)" fill="none" stroke="currentColor" stroke-width="16"><path d="M8 6V100M8 70Q8 40 30 40Q52 40 52 70V100"/><circle cx="102" cy="70" r="22"/><path d="M102 70L113.8 63.2" stroke-width="7" stroke-linecap="round"/><circle cx="102" cy="70" r="5" fill="currentColor" stroke="none"/><rect x="95.2" y="28.6" width="13.6" height="9.2" rx="1.8" fill="currentColor" stroke="none"/><rect x="99" y="37.4" width="6" height="4.4" fill="currentColor" stroke="none"/><circle cx="174" cy="70" r="22"/><path d="M224 6V100M224 70Q224 40 246 40Q268 40 268 70V100"/><circle cx="318" cy="70" r="22"/><path d="M340 40V100"/><circle cx="390" cy="70" r="22"/><path d="M412 40V100"/></g>`;
export const WM_SVG = `<svg viewBox="0 0 470 122" focusable="false"><defs><filter id="wmDeboss" x="-5%" y="-10%" width="110%" height="125%" color-interpolation-filters="sRGB">
<feGaussianBlur in="SourceAlpha" stdDeviation=".6" result="a"/>
<feOffset in="a" dy="3" result="dn"/><feOffset in="a" dy="-1.4" result="up"/>
<feComposite in="a" in2="dn" operator="out" result="topIn"/><feFlood class="wf-lo" result="cLo"/><feComposite in="cLo" in2="topIn" operator="in" result="shade"/>
<feComposite in="dn" in2="a" operator="out" result="botOut"/><feFlood class="wf-hi" result="cHi"/><feComposite in="cHi" in2="botOut" operator="in" result="light"/>
<feComposite in="a" in2="up" operator="out" result="botIn"/><feFlood class="wf-hi2" result="cHi2"/><feComposite in="cHi2" in2="botIn" operator="in" result="rim"/>
<feFlood class="wf-base" result="cB"/><feComposite in="cB" in2="SourceAlpha" operator="in" result="base"/>
<feMerge><feMergeNode in="base"/><feMergeNode in="shade"/><feMergeNode in="rim"/><feMergeNode in="light"/></feMerge></filter></defs><g filter="url(#wmDeboss)" color="#000">${WM_G}</g></svg>`;

// ---------- tier visuals ----------
export const KEY = { 아이언: 'iron', 브론즈: 'bronze', 실버: 'silver', 골드: 'gold', 플래티넘: 'platinum', 에메랄드: 'emerald', 다이아몬드: 'diamond', 마스터: 'master', 그랜드마스터: 'grandmaster', 챌린저: 'challenger' };
export const LONG = new Set(['grandmaster', 'challenger']);
export const ICON = { iron: '■', bronze: '●', silver: '▲', gold: '★', platinum: '✦', emerald: '❖', diamond: '◆', master: '♛', grandmaster: '♚', challenger: '✪' };
export const hex = h => [1, 3, 5].map(i => parseInt(h.slice(i, i + 2), 16));
export const mix = (h, w, a) => '#' + hex(h).map((c, i) => Math.round(c * (1 - a) + hex(w)[i] * a).toString(16).padStart(2, '0')).join('');
export const rgba = (h, a) => `rgba(${hex(h).join(',')},${a})`;
export function tierStyle(name) {
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
export const short = t => t.replace(/^0:/, ''); // 0:23:27 -> 23:27

export const PACE_ROWS = [['E', '이지'], ['M', '마라톤'], ['T', '역치'], ['I', '인터벌'], ['R', '리피티션']];
export const METHOD = '입력한 기록으로 달리기 능력 점수(VDOT)를 구하고, 같은 점수를 다른 거리에 적용한 것(잭 다니엘스 공식). 그 거리에 맞는 훈련을 했을 때 기준이라, 특히 풀코스는 장거리 훈련이 부족하면 실제로는 더 걸릴 수 있어요.';
export const ABBR = { iron: 'I', bronze: 'B', silver: 'S', gold: 'G', platinum: 'P', emerald: 'E', diamond: 'D', master: 'M', grandmaster: 'GM', challenger: 'C' };
export const clock = sec => { const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), x = String(sec % 60).padStart(2, '0'); return h ? `${h}:${String(m).padStart(2, '0')}:${x}` : `${m}:${x}`; };

export function mountResult(env, { leaveLog, refreshTpl }) {
  const { $, esc, state, EVN } = env;
  // The body below keeps its editor.js indentation, so renderResult's HTML template literals stay byte-for-byte the same.

let weeklyKm = '';

function resToast(msg) { let t = $('resToast'); if (!t) { t = document.createElement('div'); t.id = 'resToast'; t.className = 'res-toast'; t.setAttribute('role', 'status'); t.setAttribute('aria-live', 'polite'); document.body.appendChild(t); } t.textContent = msg; t.style.top = (window.scrollY + window.innerHeight - 120) + 'px'; t.classList.add('on'); clearTimeout(t._h); t._h = setTimeout(() => t.classList.remove('on'), 1800); }
// 결과 공유: #resBody(티어 카드~훈련 페이스)를 PNG로 렌더해 기기 공유 시트로 보냄. 공유하기 버튼·편집기는 제외.
let h2iP = null;
function loadH2I() { return h2iP || (h2iP = new Promise((ok, no) => { if (window.htmlToImage) return ok(window.htmlToImage); const s = document.createElement('script'); s.src = '/src/vendor/html-to-image.js'; s.onload = () => ok(window.htmlToImage); s.onerror = () => { h2iP = null; no(new Error('h2i load')); }; document.head.appendChild(s); })); }
let resImg = null, resImgP = null; // cached {blob,file} for the current result
function resCaptureNode() {
  const src = $('resBody'), w = Math.min(430, Math.max(340, src.clientWidth || 390));
  const box = document.createElement('div'); box.className = 'res-cap'; box.setAttribute('aria-hidden', 'true'); box.inert = true;
  box.style.cssText = `position:fixed;left:-10000px;top:0;width:${w}px;padding:20px 16px 18px;background:var(--bg);color:var(--t1);box-sizing:border-box`;
  const c = src.cloneNode(true); c.removeAttribute('id');
  for (const el of c.querySelectorAll('[id]')) el.removeAttribute('id');
  for (const el of c.querySelectorAll('.res-share, .info, .more, .wk, .chev, .exp, .pace-foot, .res-top, .res-sticky, .res-tabs, .lad-more')) el.remove();
  for (const el of c.querySelectorAll('[role=tabpanel]')) { el.hidden = false; el.removeAttribute('role'); const h = el.querySelector('h2.sr'); if (h) h.className = 'cap-h'; }
  const lad = c.querySelector('.lad'); if (lad) { lad.style.maxHeight = 'none'; lad.style.overflow = 'visible';
    const li = [...lad.children], i = li.findIndex(x => x.classList.contains('me')); li.forEach((x, j) => { if (i >= 0 && Math.abs(j - i) > 2) x.remove(); }); }
  const ft = document.createElement('div'); ft.textContent = 'hoohaa.run'; ft.style.cssText = 'text-align:center;color:var(--t3);font-size:13px;margin-top:14px;letter-spacing:.04em';
  box.append(c, ft); document.body.appendChild(box); return box;
}
async function buildResultImage() {
  const h = await loadH2I(); const node = resCaptureNode();
  try {
    if (document.fonts && document.fonts.ready) await document.fonts.ready;
    const o = { pixelRatio: 2, backgroundColor: '#0F1620', cacheBust: false, style: { position: 'static', left: '0', top: '0', margin: '0' } };
    await h.toBlob(node, o).catch(() => {}); // Safari: 첫 렌더는 폰트/이미지가 빠질 때가 있어 한 번 예열
    const blob = await h.toBlob(node, o); if (!blob) throw new Error('blob');
    return { blob, file: new File([blob], 'hoohaa-result.png', { type: 'image/png' }) };
  } finally { node.remove(); }
}
function prepResultImage() { resImg = null; const p = resImgP = new Promise(r => setTimeout(r, 400)).then(buildResultImage).then(x => { if (p === resImgP) resImg = x; return x; }).catch(() => null); return p; }
function downloadBlob(blob) { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = 'hoohaa-result.png'; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000); }
async function shareResult() {
  // iOS는 사용자 탭 직후 share를 불러야 해서, 미리 만들어 둔 이미지를 바로 씀
  let img = resImg; if (!img) { resToast('이미지를 만드는 중이에요…'); img = await (resImgP || prepResultImage()); if (!img) img = await buildResultImage().catch(() => null); }
  if (!img) { resToast('이미지를 만들지 못했어요. 다시 시도해 주세요'); return 'failed'; }
  const d = { files: [img.file], title: 'hoohaa 러닝 티어' };
  if (navigator.share && (!navigator.canShare || navigator.canShare({ files: [img.file] }))) {
    try { await navigator.share(d); return 'shared'; } catch (e) { if (e && e.name === 'AbortError') return 'cancelled'; }
  }
  try { downloadBlob(img.blob); resToast('결과 이미지를 저장했어요'); return 'downloaded'; }
  catch (e) { resToast('공유하지 못했어요. 다시 시도해 주세요'); return 'failed'; }
}
window.__resultImage = () => buildResultImage().then(x => x.blob);
// 결과 화면 UI: 탭, 티어표 펼치기, 다시 입력, 하단 고정 바, 카드가 지나가면 위에 작은 요약.
let resIO = null, resOffIO = null;
function bindResultUi() {
  const tabs = [...document.querySelectorAll('#resBody [role=tab]')];
  const pick = (t, focus) => { for (const x of tabs) { const on = x === t; x.setAttribute('aria-selected', String(on)); x.tabIndex = on ? 0 : -1; $(x.getAttribute('aria-controls')).hidden = !on; } if (focus) t.focus(); };
  for (const t of tabs) {
    t.addEventListener('click', () => pick(t));
    t.addEventListener('keydown', e => { const i = tabs.indexOf(t), n = { ArrowRight: i + 1, ArrowLeft: i - 1, Home: 0, End: tabs.length - 1 }[e.key]; if (n == null) return; e.preventDefault(); pick(tabs[(n + tabs.length) % tabs.length], true); });
  }
  const more = $('ladMore'), n = more.textContent;
  more.addEventListener('click', () => { const open = more.getAttribute('aria-expanded') !== 'true'; more.setAttribute('aria-expanded', String(open)); $('ladder').classList.toggle('all', open); more.textContent = open ? '접기' : n; });
  $('resBack').addEventListener('click', () => $('again').click());
  $('resMake').addEventListener('click', () => { const c = $('tplCard'); if (c) c.scrollIntoView({ behavior: 'smooth', block: 'start' }); });
  if (!('IntersectionObserver' in window)) return;
  if (resIO) resIO.disconnect();
  resIO = new IntersectionObserver(([e]) => { const s = $('resSticky'); if (s) s.classList.toggle('on', !e.isIntersecting && e.boundingClientRect.top < 0); });
  resIO.observe(document.querySelector('#resBody .tier-card'));
  if (!resOffIO) { // '다른 기록 넣기'나 편집기가 보이면 하단 바를, 편집기가 보이면 위 요약도 숨김
    const seen = new Set();
    resOffIO = new IntersectionObserver(es => { for (const e of es) e.isIntersecting ? seen.add(e.target) : seen.delete(e.target);
      document.body.classList.toggle('res-ui-off', seen.size > 0); });
    for (const id of ['barResult', 'tplCard']) if ($(id)) resOffIO.observe($(id));
    // 편집기가 화면 위쪽 40%까지 올라오면 위 요약을 숨김
    if ($('tplCard')) new IntersectionObserver(([e]) => document.body.classList.toggle('res-ed-on', e.isIntersecting), { rootMargin: '0px 0px -60% 0px' }).observe($('tplCard'));
  }
}
function renderResult(r) {
  leaveLog(); // editor: drop the 공유 카드 doc (doc, sel, logCtx) and body.log-mode
  const ts = tierStyle(r.tier), nx = r.nextTier;
  const evName = EVN[state.ev] || `${r.input.distanceKm}km`;
  const who = `${r.input.ageGroupLabel} ${r.input.sex === 'M' ? '남성' : '여성'}`, pubWho = ''; // pubWho: card + share images never reveal age/sex
  const mySec = r.input.time.split(':').reduce((a, b) => a * 60 + +b, 0), tc = TK.tier[ts.key].text;
  const dg = r.tier.split(' ')[1] || '', badge = (ABBR[ts.key] || '') + dg;
  let prog, nxTile;
  if (nx) {
    const nk = KEY[nx.tier.split(' ')[0]], lnT = Math.log(mySec);
    const f = r.currentTierBoundSec ? (Math.log(r.currentTierBoundSec) - lnT) / (Math.log(r.currentTierBoundSec) - Math.log(nx.targetSec)) : 0;
    const pct = Math.round(100 * Math.min(0.97, Math.max(0.04, f)));
    prog = `<section class="res-next" aria-label="다음 티어까지" style="--c1:${tc};--c2:${TK.tier[nk].text}">
      <div class="rn-row"><span class="rn-gap" id="nextGap">${esc(nx.tier)}까지 ${nx.gapText}</span><span class="rn-tgt">목표 ${short(nx.targetTime)}</span></div>
      <div class="rn-track" role="progressbar" aria-valuemin="0" aria-valuemax="100" aria-valuenow="${pct}" aria-label="${esc(nx.tier)}까지 진행도"><div style="width:${pct}%"></div></div>
      <div class="rn-ends"><span class="c1"><i></i>${esc(r.tier)} ${short(r.input.time)}</span><span class="c2">${esc(nx.tier)} ${short(nx.targetTime)}<i></i></span></div></section>`;
    nxTile = [`−${clock(nx.gapSec)}`, esc(nx.tier)];
  } else {
    prog = `<section class="res-next"><p class="congrats" id="nextGap">최고 티어 챌린저 달성! 정말 대단해요 🎉</p></section>`;
    nxTile = ['MAX', '최고 티어'];
  }
  const cells = [['5K', '5K'], ['10K', '10K'], ['half', '하프'], ['full', '풀']].map(([k, n]) => {
    const me = k === state.ev;
    return `<div class="cell${me ? ' me' : ''}"><div class="ev"><span>${n}</span>${me ? '<em>내 기록</em>' : ''}</div><div class="time">${short(r.predicted[k])}</div><div class="pace">${r.predictedPace[k].replace('/km', ' /km')}</div></div>`;
  }).join('');
  const guide = paceGuide(r.trainingPaces, weeklyKm);
  const rows = PACE_ROWS.map(([L, n], i) => `<button type="button" class="prow" aria-expanded="false" aria-controls="pe${i}">
      <span class="line"><span class="ltr">${L}</span><span class="nm">${n}</span><span class="pv">${r.trainingPaces[L].replace(/\/km/g, '').replace(' ~ ', '~')}<small>/km</small></span><span class="chev" aria-hidden="true">▾</span></span>
      <span class="exp" id="pe${i}" hidden>${esc(guide[L]).replaceAll('\n', '<br>')}</span></button>`).join('');
  const lad = [...r.tierLadder].reverse(), meAt = lad.findIndex(x => x.index === r.tierIndex);
  const topV = r.topPercent1 == null ? '0.1%' : `${r.topPercent1.toFixed(1)}%`;
  $('resBody').innerHTML = `
    <div class="res-top"><button type="button" class="res-back" id="resBack"><svg viewBox="0 0 20 20" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12.5 4.5 7 10l5.5 5.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg>다시 입력</button><span class="res-ctx">${esc(evName)} · ${esc(who)}</span></div>
    <section class="tier-card fluid t-${ts.key} b-${TK.tier[ts.key].card.band}" aria-label="내 티어: ${esc(r.tier)}">
      <span class="tc-wm" aria-hidden="true">${WM_SVG}</span>
      <div class="tc-top"><span class="tc-brand" aria-hidden="true">HOOHAA</span><span class="tc-label" aria-hidden="true">RUNNING TIER</span></div>
      <span class="tc-chip" aria-hidden="true"><i class="tc-ic rc">${runChipSVG(ts.key)}</i></span>
      <div class="tc-name${LONG.has(ts.key) ? ' long' : ''}" aria-hidden="true"><span class="w">${ts.key.toUpperCase()}</span>${ts.roman ? `<span class="n" data-d="${ts.roman}"><i></i>${ts.roman}</span>` : ''}</div>
      <div class="tc-meta"><span class="rec">${esc(evName)} ${short(r.input.time)} · ${r.pace}</span><span class="rank"><span class="tc-ko" id="tierName">${esc(r.tier.replace(/\s*[123]$/, ''))}${ts.roman ? ` <span class="dv">${ts.roman}</span>` : ''}</span> · <b>${esc(r.topPercentLabel)}</b></span></div>
    </section>
    <div class="res-sticky" id="resSticky" aria-hidden="true" style="--tc:${tc};--tb:${TK.tier[ts.key].base};--ton:${TK.tier[ts.key].on}"><span class="rs-b">${badge}</span><span class="rs-t"><b>${esc(r.tier)} · ${esc(r.topPercentLabel)}</b><span>${esc(evName)} ${short(r.input.time)} · VDOT ${r.vdot.toFixed(1)}</span></span></div>
    <figure class="res-persona" style="--qc:${tc}"><figcaption class="sr">이 티어 러너는</figcaption><p id="tierCmt">“${esc(tierComment(ts.key, ts.roman))}”</p></figure>
    <div class="res-metrics">
      <div class="mt"><span class="mt-l">상위</span><b class="mt-v" id="topPct">${topV}</b><span class="mt-s">${r.topPercent1 == null ? '이내 · ' : ''}${esc(who)}</span></div>
      <div class="mt"><span class="mt-l">VDOT</span><button type="button" class="info mt-i" aria-expanded="false" aria-controls="vdInfo" aria-label="VDOT 설명">ⓘ</button><b class="mt-v">${r.vdot.toFixed(1)}</b><span class="mt-s">러닝 지수</span></div>
      <div class="mt"><span class="mt-l">다음 티어</span><b class="mt-v${nxTile[0].length > 6 ? ' sm' : ''}">${nxTile[0]}</b><span class="mt-s">${nxTile[1]}</span></div>
    </div>
    <p class="more" id="vdInfo" hidden>VDOT는 기록으로 계산한 달리기 능력 점수예요. 이 값이 곧 VO2max 추정치예요 (실측값이 아닌 추정).</p>
    ${prog}
    <div class="res-tabs" role="tablist" aria-label="자세히 보기">
      <button type="button" role="tab" id="rtLad" aria-controls="rpLad" aria-selected="true">티어표</button><button type="button" role="tab" id="rtPred" aria-controls="rpPred" aria-selected="false" tabindex="-1">예상 기록</button><button type="button" role="tab" id="rtPace" aria-controls="rpPace" aria-selected="false" tabindex="-1">훈련 페이스</button>
    </div>
    <section class="res-panel" role="tabpanel" id="rpLad" aria-labelledby="rtLad">
      <h2 id="hLad" class="sr">전체 티어 · ${esc(evName)} · ${esc(who)} 기준</h2>
      <ol class="lad res-lad" id="ladder">${lad.map((x, j) => { const k = KEY[x.tier.split(' ')[0]], me = j === meAt, far = j < meAt - 3 || j > meAt + 2;
        return `<li class="lr${me ? ' me' : ''}${far ? ' far' : ''}" style="--tc:${TK.tier[k].text};--tc2:${TK.tier[k].base};--ta:${accentOf({ key: k })}"${me ? ' id="ladMe" aria-current="true"' : ''}><span class="ln"><i class="dot"></i>${esc(x.tier)}${me ? '<span class="sr"> (내 티어)</span>' : ''}</span><span class="lt">${x.minTime ? short(x.minTime) : '기록 무관'}</span><span class="lp">${x.topPct === 100 ? '전체' : (+x.topPct).toFixed(1) + '%'}</span></li>`; }).join('')}</ol>
      <button type="button" class="lad-more" id="ladMore" aria-expanded="false" aria-controls="ladder">전체 ${lad.length}단계 보기</button>
    </section>
    <section class="res-panel" role="tabpanel" id="rpPred" aria-labelledby="rtPred" hidden>
      <h2 class="sr">예상 기록</h2>
      <div class="res-grid">${cells}</div>
      <p class="res-note">같은 VDOT(${r.vdot.toFixed(1)})으로 계산한 예상 기록이에요. 거리가 길수록 오차가 커져요. <button type="button" class="info" aria-expanded="false" aria-controls="prInfo" aria-label="예상 기록 설명">ⓘ</button></p>
      <p class="more" id="prInfo" hidden>${METHOD}</p>
    </section>
    <section class="res-panel" role="tabpanel" id="rpPace" aria-labelledby="rtPace" hidden>
      <div class="rp-head"><h2>훈련 페이스</h2><label class="wk wk-pill" for="wkKm"><span>주간</span><input id="wkKm" inputmode="decimal" autocomplete="off" enterkeyhint="done" placeholder="40" value="${esc(weeklyKm)}"><span>km</span></label></div>
      <div class="intensity" aria-hidden="true"><i></i><i></i><i></i><i></i><i></i></div>
      <div class="pace-list">${rows}</div>
      <p class="pace-foot">${esc(guide.foot)}</p>
    </section>
    <div class="actions res-share res-bar" id="resBar"><button type="button" id="resMake" class="btn primary">공유 이미지 만들기</button><button type="button" id="resShare" class="res-ic" aria-label="결과 이미지 공유"><svg viewBox="0 0 24 24" width="20" height="20" aria-hidden="true" focusable="false"><path d="M12 15V3.5M7.5 8 12 3.5 16.5 8M5 12.5V19a2 2 0 0 0 2 2h10a2 2 0 0 0 2-2v-6.5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/></svg></button></div>`;
  state.story = { key: ts.key, tierKo: r.tier, word: ts.key.toUpperCase(), roman: ts.roman, long: LONG.has(ts.key),
    title: `${evName} 성적표`, recLine: `${evName} ${short(r.input.time)} · ${r.pace}`, who: pubWho, topLabel: r.topPercentLabel, headline: r.topPercentLabel, time: short(r.input.time), pace: r.pace, vdot: r.vdot.toFixed(1),
    nextLine: nx ? `${nx.tier}까지 ${evName} ${nx.gapText} 단축` : '최고 티어 챌린저 달성!' };
  $('resShare').addEventListener('click', () => shareResult()); prepResultImage();
  bindResultUi();
  refreshTpl();
  for (const b of $('resBody').querySelectorAll('.info, .prow')) b.addEventListener('click', () => {
    const el = $(b.getAttribute('aria-controls')), open = b.getAttribute('aria-expanded') !== 'true';
    b.setAttribute('aria-expanded', String(open)); el.hidden = !open; const c = b.querySelector('.chev'); if (c) c.textContent = open ? '▴' : '▾';
  });
  const wk = $('wkKm');
  if (wk) wk.addEventListener('input', () => {
    weeklyKm = wk.value;
    const next = paceGuide(r.trainingPaces, weeklyKm);
    PACE_ROWS.forEach(([L], i) => { const el = $(`pe${i}`); if (el) el.innerHTML = esc(next[L]).replaceAll('\n', '<br>'); });
  });
}
  return { renderResult };
}
