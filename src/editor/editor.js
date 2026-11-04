import { LS, idb } from '../storage/device.js';
import { fetchWeather, searchPlace, wxHere, isoDay } from '../net/weather.js';
import { LOG_TPLS, ICON_NAMES, buildLogDoc, fillBindings, setLogBg, kindOf } from './logtpl.js';
import { alpha, rr, font, FONTS, PICKABLE, FONT_CATS, previewFam, nearW, STATS, statValue, STICKERS, FILTERS, fmtH, MASKS, clone, hex2hsv, hsv2hex } from './util.js';
import { TK, HEX_SVG, topoSVG, svgURL, accentOf } from './tokens.js';
import { orient, photoSrc, imContent, blobToImg, addPhotoFile, segP, ensureMask, segFailMsg } from './photo.js';
import { WEATHER, DATA_STK, dataFields } from './stickers.js';
import { mountResult } from './result.js';
import { createRenderCtx, lid, mk, renderDoc, TEMPLATES, tplKey, templateDoc } from './render.js';

export async function mountEditor(env) {
  const { $, esc, state, EVN } = env;
  const assets = await import('./assets.js');
  const LAZY_FONTS = assets.LAZY_FONTS;
  const TPL_NAMES = assets.TPL_NAMES;
  const TPL_SPEC = assets.TPL_SPEC;
  const STK_NAMES = assets.STK_NAMES;
  const STK_SVG = assets.STK_SVG;

document.head.insertAdjacentHTML('beforeend', '<style id="tier-tk">' + `.tier-card{--hex:${svgURL(HEX_SVG)} 0 0/78px auto repeat}` + Object.entries(TK.tier).map(([k, t]) => { const cd = t.card;
  const bg = cd.background.replace('var(--topo)', svgURL(topoSVG(cd.topo_tint)) + ' center/cover no-repeat');
  return `.t-${k}{--ink:${cd.ink};--ink2:${cd.ink};--card-bg:${bg};--card-bd:${cd.border.replace(/^1px solid /, '1px solid ')};--card-sh:${cd.shadow};${cd.outline ? `--card-ol:${cd.outline};` : ''}}`; }).join('') + '</style>');
// --hex is a shorthand-ish layer; expand into background layers
document.querySelectorAll('#tier-tk').forEach(s => { s.textContent = s.textContent.replace(/var\(--hex\)/g, svgURL(HEX_SVG) + ' 0 0/78px auto repeat'); });

// render context (render.js): lazy-font base path + font caches. renderDoc(rctx, ...) adds the canvas height and text effects per render.
const rctx = createRenderCtx();
const { loadFont, loadPreviewFont } = rctx;


{ rr, font, alpha };

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

window.__photoSrc = (pid, P) => photoSrc(photos, pid, P);
// ================= share-image editor v3 (story-style free layers) =================
const MAX_PHOTOS = 12, PCV = { W: 1080, H: 1920 };
const bgImg = () => photoSrc(photos, doc.bg.pid, doc.bg) || photos[doc.bg.pid];
const FH = () => fmtH(doc && doc.fmt); let safeOn = false, cropSt = null, moreFx = false, moreAdj = false;
let multi = new Set(), multiSnap = null, fineP = matchMedia('(hover: hover) and (pointer: fine)').matches;
let doc = null, photos = {}, sel = null, boxes = [], mode = null, libOpen = false, fontCat = 'all', pickMode = false, guides = null, trashHot = false, dragging = false;
const favs = () => LS('runtier:fontfav') || [], recents = () => LS('runtier:fontrecent') || [];
window.__doc = () => clone(doc); window.__boxes = () => clone(boxes); window.__sel = () => sel; window.__inkBounds = async id => { const L = getL(id); const cv = await renderDoc(rctx, state.story, { ...doc, bg: { type: 'solid', c1: '#000000' }, layers: [L] }, photos); const d = cv.getContext('2d').getImageData(0, 0, 1080, FH()).data; let x0 = 1e9, y0 = 1e9, x1 = -1, y1 = -1; for (let y = 0; y < FH(); y += 2) for (let x = 0; x < 1080; x += 2) { const i = (y * 1080 + x) * 4; if (d[i] + d[i + 1] + d[i + 2] > 60) { if (x < x0) x0 = x; if (x > x1) x1 = x; if (y < y0) y0 = y; if (y > y1) y1 = y; } } return { x0, y0, x1, y1 }; };
window.__story = () => clone(state.story); window.__acc = () => accentOf(state.story); window.__photos = () => Object.keys(photos).filter(k => !k.startsWith('mask:')).length; window.__statTexts = () => doc.layers.filter(l => l.type === 'stat').map(l => statValue(state.story, doc, l.stat, l));
window.__photos = () => Object.keys(photos).filter(k => !k.startsWith('mask:')).length; window.__statTexts = () => doc.layers.filter(l => l.type === 'stat').map(l => statValue(state.story, doc, l.stat, l));
window.__photoMap = () => photos; window.__mask = () => Object.keys(photos).filter(k => k.startsWith('mask:')).length;
function personPid() { if (doc.bg.type === 'photo' && photos[doc.bg.pid]) return { bg: true, pid: doc.bg.pid };
  const ph = doc.layers.filter(l => l.type === 'photo' && l.pid && photos[l.pid] && !l.hidden).sort((a, b) => (b.w || 1) * (b.h || 1) * b.s * b.s - (a.w || 1) * (a.h || 1) * a.s * a.s)[0]; return ph ? { bg: false, pid: ph.pid, L: ph } : null; }
const canBehind = L => !!L && L.type !== 'photo' && !!personPid();
async function toggleBehind(L) {
  if (L.behind) { L.behind = false; changed(true); paintPanel(); return; }
  const src = personPid(); if (!src) { status('먼저 인물 사진을 넣어 주세요', 3000); return; }
  if (!src.bg) { doc.bg = { type: 'photo', pid: src.pid, pz: 1, px: 0, py: 0, filter: src.L.filter || 'none' }; doc.layers = doc.layers.filter(l => l !== src.L); status('배경 사진으로 깔고 인물을 찾을게요', 3000); changed(true); }
  const b = document.querySelector('#miniBar [data-mb=behind]'); if (b) { b.classList.add('loading'); b.querySelector('small').textContent = '찾는 중…'; } status('인물을 찾는 중이에요… (사진은 기기 밖으로 나가지 않아요)', 8000);
  const ok = await ensureMask(photos, doc.bg.pid);
  if (ok) { L.behind = true; status('인물 뒤로 보냈어요'); } else status(segFailMsg('글자는 앞에 그대로 둘게요'), 5000);
  document.querySelector('#miniBar [data-mb=behind]')?.classList.remove('loading'); changed(true); paintPanel(); }
async function restorePhotos() { const ids = new Set([doc.bg.pid, ...doc.layers.map(l => l.pid)].filter(Boolean)); let n = 0;
  for (const id of ids) if (!photos[id]) { const b = await idb.get(id); if (b) { photos[id] = await blobToImg(b); n++; } } if (n) changed(true);
  if (doc.bg.type === 'photo' && photos[doc.bg.pid] && doc.layers.some(l => l.behind)) { if (await ensureMask(photos, doc.bg.pid)) changed(true); else { doc.layers.forEach(l => l.behind = false); changed(true); } } }
// ---- history + autosave ----
let hist = [], hi = -1, comT = 0;
function commit() { clearTimeout(comT); if (!doc) return; const s = JSON.stringify(doc); if (s !== hist[hi]) { hist = hist.slice(0, hi + 1); hist.push(s); if (hist.length > 100) hist.shift(); hi = hist.length - 1; } LS(docKey(), doc); paintTop(); }
const later = () => { clearTimeout(comT); comT = setTimeout(commit, 300); };
function undoRedo(dd) { commit(); const n = hi + dd; if (n < 0 || n >= hist.length) return; hi = n; doc = JSON.parse(hist[hi]); if (sel && !getL(sel)) sel = null; LS(docKey(), doc); changed(true); paintPanel();
  for (const b of $('tplList').querySelectorAll('.tpl-btn')) { if (b.dataset.m != null) { if (!doc.log && doc.tpl !== 'mine') b.setAttribute('aria-checked', 'false'); continue; } b.setAttribute('aria-checked', String(doc.log ? b.dataset.lt === doc.log.tpl : b.dataset.t === doc.tpl)); } }
const docKey = () => doc && doc.log ? 'runtier:logdoc' : 'runtier:v3doc';
$('undo').addEventListener('click', () => undoRedo(-1)); $('redo').addEventListener('click', () => undoRedo(1));
function paintTop() { $('undo').disabled = hi <= 0; $('redo').disabled = hi >= hist.length - 1; }
const getL = id => doc.layers.find(l => l.id === id);
// the user resized it: freeze the auto-fitted size as the element's own size
// 오늘 기록 layers are placed by ratio (rx/ry) at render time and carry no usable x/y until moved.
// Edge-anchored (ax/ay) layers store an edge, not the centre. Before any gesture reads L.x/L.y, copy the drawn centre
// from the last render so the layer (and every Shift-selected one) stays put and moves by the pointer delta.
function pinXY(L) { if (!L) return; const anc = !!(L.ax || L.ay); if (!anc && Number.isFinite(L.x) && Number.isFinite(L.y) && !(L.lt && !L.mv && L.rx != null)) return; const b = boxes.find(q => q.id === L.id); if (b && Number.isFinite(b.x) && Number.isFinite(b.y)) { L.x = b.x; L.y = b.y; if (anc) { delete L.ax; delete L.ay; } } }
// moving one member of a shared stat row takes it out of the row layout; freeze the rest of the row (and rows sharing its
// size) exactly where they are drawn so they don't re-centre or re-size under the user's finger
function freezeRow(L) { if (!L || !L.row || L.mv) return; const key = L.row.k + L.row.n;
  for (const m of doc.layers) { if (m === L || !m.row || m.mv || m.af === false || m.row.k + m.row.n !== key) continue; const b = boxes.find(q => q.id === m.id); if (!b) continue; m.x = b.x; m.y = b.y; m.s = b.s; m.af = false; delete m.ax; delete m.ay; } }
function pinS(L) { if (!L || !L.af) return; const b = boxes.find(q => q.id === L.id); if (b) L.s = b.s; L.af = false; }
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
function changed(now) { syncTier(); syncMulti(); if (!rafQ) rafQ = requestAnimationFrame(async () => { rafQ = 0; const cv = await renderDoc(rctx, state.story, doc, photos); lastCv = cv; boxes = cv.__boxes; fitStage(); $('tplPreview').getContext('2d').drawImage(cv, 0, 0); if (needClamp) { needClamp = false; const fold = hi >= 0 && JSON.stringify(doc) === hist[hi]; if (clampN++ < 5 && clampIn()) { if (fold) hist[hi] = JSON.stringify(doc); changed(true); return; } clampN = 0; } paintOvl(); if (sel) paintSelInfo(); }); if (now === true) commit(); else later(); }
// ---- format: 9:16 story · 4:5 feed · 1:1 (preview canvas follows the export aspect) ----
let needClamp = false, clampN = 0;
function fitStage() { const h = FH(), pv = $('tplPreview'), o = $('ovl'); if (pv.height !== h) { pv.height = h; o.height = h; } $('stage').style.setProperty('--ar', `1080/${h}`); $('stage').style.setProperty('--arn', String(1080 / h));
  for (const b of document.querySelectorAll('#fmtSeg [data-v]')) b.setAttribute('aria-checked', String(b.dataset.v === (doc.fmt || 'story'))); $('safeBtn').hidden = (doc.fmt || 'story') !== 'story'; }
// re-lay out proportionally: positions + sizes follow the height ratio, edge anchors stay at the margins; template blocks re-fit (auto-fit), everything kept inside the safe margins
const CARRY = ['font', 'col', 'bcol', 'bo', 'box', 'fsh', 'fol', 'fgl', 'o', 'lab', 't', 'hidden', 'behind', 'pid', 'crop', 'cr', 'rot', 'flip', 'filter', 'adj', 'cut', 'ol', 'f', 'k', 'ls', 'lh', 'lk'];
function relayout(d, to) { if (d.log) { const h0 = fmtH(d.fmt), k = fmtH(to) / h0; d.fmt = to === 'story' ? undefined : to; for (const L of d.layers) if (L.mv || L.rx == null) { L.y *= k; } needClamp = true; clampN = 0; return d; }
  if (d.tpl && TEMPLATES.some(t => t[0] === d.tpl) && d.layers.some(l => l.sid)) return specRelayout(d, to); return propRelayout(d, to); }
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
function placePhoto(pid, keepBg) { if (!pid || !photos[pid]) return; if (doc.bgT) { dropBgKeep(); doc.bg = { type: 'photo', pid, pz: 1, filter: 'none', ...(keepBg && keepBg.pid === pid ? { filter: keepBg.filter, crop: keepBg.crop, rot: keepBg.rot, flip: keepBg.flip } : {}), ...clone(doc.bgT), px: doc.bgT.px || 0, py: doc.bgT.py || 0 }; }
  else { const s0 = doc.layers.find(l => l.type === 'photo' && !l.pid); if (s0) s0.pid = pid; else if (keepBg && keepBg.pid === pid) { dropBgKeep(); doc.bg = clone(keepBg); } }
  if (doc.layers.some(l => l.behind) && doc.bg.type === 'photo') ensureMask(photos, doc.bg.pid).then(ok => { if (!ok) doc.layers.forEach(l => l.behind = false); changed(true); }); }
try { localStorage.removeItem('runtier:mystyle'); } catch { /* old 내 스타일 data: feature removed */ }
function newDoc(t, f = 'story') { const d = templateDoc(tplKey(t), state.story, f);
  needClamp = true; clampN = 0; return d; }
async function refreshTpl() { // called from renderResult
  if (!state.story) return;
  if (!doc) { const s = LS('runtier:v3doc'); doc = s && Array.isArray(s.layers) && s.bg ? s : newDoc(); syncTier(); hist = [JSON.stringify(doc)]; hi = 0; restorePhotos(); }
  changed(true); paintPanel(); thumbs();
}
async function thumbs() {
  if (doc && doc.log) return logThumbs();
  const mine = (LS('runtier:mytpl') || []).map((m, i) => ({ ...m, _i: i })).filter(m => !m.log);
  $('tplList').innerHTML = TEMPLATES.map(([k, n]) => `<button type="button" role="radio" class="tpl-btn" data-t="${k}" aria-checked="${doc.tpl === k}"><canvas width="108" height="${Math.round(108 * FH() / 1080)}"></canvas><span class="tn">${n}</span></button>`).join('') +
    mine.map(m => `<span class="tpl-mine"><button type="button" role="radio" class="tpl-btn" data-m="${m._i}" aria-checked="false"><canvas width="108" height="${Math.round(108 * FH() / 1080)}"></canvas><span class="tn">${esc(m.n)}</span></button><button type="button" class="tpl-del" data-mdel="${m._i}" aria-label="${esc(m.n)} 삭제">✕</button></span>`).join('');
  const all = LS('runtier:mytpl') || [];
  for (const b of $('tplList').querySelectorAll('.tpl-btn')) { const d2 = relayout(b.dataset.t ? templateDoc(b.dataset.t, state.story) : clone(all[+b.dataset.m]), doc.fmt || 'story'); const cv = await renderDoc(rctx, state.story, d2, photos); const t0 = b.querySelector('canvas'), t = t0.getContext('2d'); t.imageSmoothingQuality = 'high'; t.drawImage(cv, 0, 0, t0.width, t0.height); }
}
const userLayers = d => (d.layers || []).filter(l => l && !l.sid).map(clone);
$('tplList').addEventListener('click', e => { const del = e.target.closest('[data-mdel]'); if (del) { const m = LS('runtier:mytpl') || []; m.splice(+del.dataset.mdel, 1); LS('runtier:mytpl', m); thumbs(); return; }
  const b = e.target.closest('.tpl-btn'); if (!b) return; if (doc.log) { pickLogTpl(b); return; }
  const race = doc.race, keepBg = doc.bg.type === 'photo' && photos[doc.bg.pid] ? clone(doc.bg) : null, f0 = doc.fmt || 'story';
  const kept = b.dataset.t ? userLayers(doc) : [];
  const slot = doc.layers.find(l => l.sid && l.type === 'photo' && l.pid && photos[l.pid]);
  const keepPid = keepBg ? keepBg.pid : (slot || {}).pid;
  doc = b.dataset.t ? newDoc(b.dataset.t, doc.fmt || 'story') : { ...clone((LS('runtier:mytpl') || [])[+b.dataset.m]), n: undefined };
  if (!b.dataset.t) relayout(doc, f0); else if ((doc.fmt || 'story') !== f0) relayout(doc, f0);
  if (kept.length) doc.layers.push(...kept);
  doc.race = race; placePhoto(keepPid, keepBg); sel = null; mode = 'tpl';
  for (const x of $('tplList').querySelectorAll('.tpl-btn')) x.setAttribute('aria-checked', String(x === b)); changed(true); paintPanel(); });
$('tplReset').addEventListener('click', () => { if (doc.log) { const pid = doc.bg.type === 'photo' ? doc.bg.pid : null; const f0 = doc.fmt; doc = setLogBg(buildLogDoc(doc.log.tpl, logCtx.vals, { pid: logCtx.pid, logId: doc.log.id, type: doc.log.type, acc: doc.tok.acc }), pid); if (f0 !== 'thumb') relayout(doc, f0 || 'story'); sel = null; changed(true); paintPanel(); status('템플릿 상태로 되돌렸어요'); return; }
  const race = doc.race, keepBg = doc.bg.type === 'photo' && photos[doc.bg.pid] ? doc.bg : null; const f0 = doc.fmt || 'story'; doc = relayout(newDoc(tplKey(doc.tpl)), f0); doc.race = race; placePhoto(keepBg && keepBg.pid, keepBg); sel = null; changed(true); paintPanel(); status('템플릿 상태로 되돌렸어요'); });
$('saveMyTpl').addEventListener('click', () => { const m = LS('runtier:mytpl') || []; const n = `내 템플릿 ${m.length + 1}`; m.push({ ...clone(doc), n, tpl: doc.log ? doc.tpl : 'mine' }); if (!LS('runtier:mytpl', m.slice(-6))) { status('저장 공간이 부족해요'); return; } thumbs(); status(`'${n}' 저장했어요`); });
$('fmtSeg').addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b || !doc) return; const f = b.dataset.v; if ((doc.fmt || 'story') === f) return; relayout(doc, f); sel = null; changed(true); paintPanel(); thumbs(); status(`${b.getAttribute('aria-label') || b.textContent} 형식으로 바꿨어요`); });
$('safeBtn').addEventListener('click', e => { safeOn = !safeOn; e.currentTarget.setAttribute('aria-pressed', String(safeOn)); paintOvl(); status(safeOn ? '점선 영역은 인스타 스토리 UI에 가려질 수 있어요 (저장 이미지엔 안 나와요)' : '안전영역 가이드를 껐어요', 2600); });
{ const b = $('stMore'); if (b) b.addEventListener('click', () => { const ex = $('stExtra'); if (!ex) return; const open = ex.hidden; ex.hidden = !open; b.setAttribute('aria-expanded', String(open)); }); }
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
    if (getL(sel) && getL(sel).lk) { const [hx, hy] = p[2]; g.fillStyle = 'rgba(15,22,32,.82)'; g.beginPath(); g.arc(hx, hy, 30, 0, 7); g.fill(); g.strokeStyle = '#F4F6F8'; g.lineWidth = 4; g.beginPath(); g.arc(hx, hy - 6, 9, Math.PI, 0); g.stroke(); g.fillStyle = '#F4F6F8'; g.fillRect(hx - 13, hy - 6, 26, 20); }
    else if (!fineP) { const [hx, hy] = p[2]; g.fillStyle = '#3DC8F5'; g.beginPath(); g.arc(hx, hy, HANDLE, 0, 7); g.fill(); g.fillStyle = '#0F1620'; g.font = '700 52px sans-serif'; g.textAlign = 'center'; g.textBaseline = 'middle'; g.fillText('⤡', hx, hy + 2); } }
  placeMini(b);
  if (dragging) { g.fillStyle = trashHot ? 'rgba(255,90,95,.95)' : 'rgba(15,22,32,.75)'; g.beginPath(); const ty = H - 130; g.arc(540, ty, trashHot ? 96 : 80, 0, 7); g.fill(); g.strokeStyle = '#fff'; g.lineWidth = 6; g.beginPath(); g.rect(510, ty - 25, 60, 70); g.moveTo(495, ty - 25); g.lineTo(585, ty - 25); g.moveTo(525, ty - 40); g.lineTo(555, ty - 40); g.stroke(); }
}
// floating contextual mini toolbar, positioned inside the canvas next to the selection (DOM over the overlay → never exported)
function placeMini(b) { const m = $('miniBar'); if (!m) return; const L = b && getL(b.id);
  if (!L || dragging || pickMode) { m.hidden = true; return; }
  m.querySelector('[data-mb=behind]').hidden = !canBehind(L); const bh = m.querySelector('[data-mb=behind]'); bh.setAttribute('aria-pressed', !!L.behind); bh.title = L.behind ? '인물 앞으로' : '인물 뒤로'; bh.setAttribute('aria-label', bh.title); bh.querySelector('small').textContent = bh.title;
  const lk = m.querySelector('[data-mb=lock]'); if (lk) { lk.setAttribute('aria-pressed', !!L.lk); lk.title = L.lk ? '잠금 해제' : '잠금'; lk.setAttribute('aria-label', lk.title); lk.querySelector('small').textContent = L.lk ? '잠김' : '잠금'; lk.querySelector('.lk-open').style.display = L.lk ? 'none' : ''; lk.querySelector('.lk-shut').style.display = L.lk ? '' : 'none'; }
  m.querySelectorAll('[data-mb=dup],[data-mb=del]').forEach(e => e.hidden = isTop(L)); m.querySelector('[data-mb=asbg]').hidden = !(L.type === 'photo' && L.pid && photos[L.pid]) || multi.size > 0; m.hidden = false;
  const r = $('ovl').getBoundingClientRect(), kx = r.width / 1080, ky = r.height / FH(), c = corners(b), xs = c.map(q => q[0] * kx), ys = c.map(q => q[1] * ky);
  m.classList.toggle('compact', false); if (m.offsetWidth > r.width - 8) m.classList.add('compact');
  const bw = m.offsetWidth, bhh = m.offsetHeight, top = Math.min(...ys), bot = Math.max(...ys), cx = (Math.min(...xs) + Math.max(...xs)) / 2;
  let y = top - bhh - 10; if (y < 4) { y = bot + 10; if (y + bhh > r.height - 4) y = top > r.height - bot ? Math.max(4, top - bhh - 4) : Math.min(r.height - bhh - 4, bot + 4); }
  let lo = 4, hi = r.width - bw - 4; if (hi < lo) { const f = $('tplEd').getBoundingClientRect(); lo = Math.min(4, f.left - r.left + 4); hi = Math.max(r.width - bw - 4, f.right - r.left - bw - 4); }
  m.style.left = Math.max(lo, Math.min(hi, cx - bw / 2)) + 'px'; m.style.top = y + 'px'; }
// iOS Safari: the stage blocks touch defaults for gestures, so act on pointerup directly (click is only a keyboard fallback)
function tapButtons(el, sel_, run) { let down = null, last = 0;
  const stop = e => e.stopPropagation();
  el.addEventListener('pointerdown', e => { stop(e); down = e.target.closest(sel_); });
  el.addEventListener('touchstart', stop, { passive: true }); el.addEventListener('touchend', stop, { passive: true }); el.addEventListener('mousedown', stop);
  el.addEventListener('pointerup', e => { stop(e); const b = e.target.closest(sel_); if (b && b === down && !b.hidden) { last = Date.now(); e.preventDefault(); run(b); } down = null; });
  el.addEventListener('pointercancel', () => { down = null; });
  el.addEventListener('click', e => { stop(e); const b = e.target.closest(sel_); if (b && Date.now() - last > 700) run(b); }); }
tapButtons($('miniBar'), '[data-mb]', b => { const a = b.dataset.mb, L = getL(sel); if (!L) return; if (a === 'lock') { if (L.lk) delete L.lk; else L.lk = 1; changed(true); paintOvl(); status(L.lk ? '잠갔어요 · 옮기기·크기·삭제·복제를 막아요' : '잠금을 풀었어요'); } else if (a === 'behind') toggleBehind(L); else if (a === 'asbg') photoToBg(L); else act(a); });
const toLocal = (b, x, y) => { const c = Math.cos(-(b.r || 0)), s = Math.sin(-(b.r || 0)), dx = x - b.x, dy = y - b.y; return [(dx * c - dy * s) / b.s, (dx * s + dy * c) / b.s]; };
function hitAt(x, y) { for (let i = boxes.length - 1; i >= 0; i--) { const b = boxes[i]; if (b.hidden || b.nh) continue; const [lx, ly] = toLocal(b, x, y), pad = Math.max(0, 30 / b.s - 0); if (Math.abs(lx) <= b.w / 2 + pad && Math.abs(ly) <= b.h / 2 + pad) return b; } return null; }
window.__hitAt = (x, y) => (hitAt(x, y) || {}).id;
const onHandle = (x, y) => { if (fineP) return false; const b = sel && boxes.find(q => q.id === sel); if (!b || (getL(sel) || {}).lk) return false; const [hx, hy] = corners(b)[2]; if (Math.hypot(x - hx, y - hy) >= HANDLE * 1.3) return false;
  const [lx, ly] = toLocal(b, x, y); if (Math.abs(lx) < b.w * .3 && Math.abs(ly) < b.h * .3) return false; // small text: a finger on its middle moves it, never resizes
  // a finger on another element's body grabs that element, not the selected one's resize handle
  return !boxes.some(q => q.id !== b.id && !q.hidden && !q.nh && (q.type === 'text' || q.type === 'stat') && (([qx, qy]) => Math.abs(qx) <= q.w / 2 && Math.abs(qy) <= q.h / 2)(toLocal(q, x, y))); };
// ---- gestures: tap select · drag move (snap) · pinch scale+rotate · corner handle · long-press menu · drag to trash ----
{
  const st = $('stage'), ov = $('ovl'), pts = new Map(); let g0 = null, lp = 0, moved = false;
  // iOS Safari: a two-finger pinch on the canvas should scale the element (pointer events above), not zoom the page
  for (const ev of ['gesturestart', 'gesturechange']) st.addEventListener(ev, e => e.preventDefault(), { passive: false });
  const cv = e => { const r = ov.getBoundingClientRect(); return [(e.clientX - r.left) * 1080 / r.width, (e.clientY - r.top) * FH() / r.height]; };
  const ang = (a, b) => Math.atan2(b[1] - a[1], b[0] - a[0]);
  const start = () => { const P = [...pts.values()], L = sel && getL(sel); pinXY(L); for (const id of multi) pinXY(getL(id)); if (L && P.length > 1) pinS(L); g0 = { P: P.map(p => [...p]), L: L ? clone(L) : null, bg: clone(doc.bg), M: [...multi].map(id => { const m = getL(id); return m && [id, m.x, m.y]; }).filter(Boolean) }; };
  ov.addEventListener('pointerdown', e => {
    fineP = e.pointerType === 'mouse' && matchMedia('(hover: hover) and (pointer: fine)').matches; hideMenu(); const p = cv(e); pts.set(e.pointerId, p); ov.setPointerCapture(e.pointerId); e.preventDefault();
    if (pickMode) { pickMode = false; const px = $('tplPreview').getContext('2d').getImageData(Math.round(p[0]), Math.round(p[1]), 1, 1).data; setCol('#' + [px[0], px[1], px[2]].map(v => v.toString(16).padStart(2, '0')).join('')); status('색을 가져왔어요'); pts.delete(e.pointerId); return; }
    ov.dataset.down = '1';
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
    if (L && L.lk && (g0.scale || g0.handle || g0.hit || P.length > 1)) return; // locked: no move / resize / rotate
    if (g0.scale && L) { const b0 = g0.L, d0 = Math.hypot(g0.P[0][0] - b0.x, g0.P[0][1] - b0.y), d1 = Math.hypot(P[0][0] - b0.x, P[0][1] - b0.y); pinS(L); L.s = Math.max(.08, Math.min(8, b0.s * d1 / Math.max(20, d0))); }
    else if (g0.handle && L) { const b0 = g0.L, a0 = ang([b0.x, b0.y], g0.P[0]), a1 = ang([b0.x, b0.y], P[0]), d0 = Math.hypot(g0.P[0][0] - b0.x, g0.P[0][1] - b0.y), d1 = Math.hypot(P[0][0] - b0.x, P[0][1] - b0.y);
      pinS(L); L.s = Math.max(.08, Math.min(8, b0.s * d1 / Math.max(1, d0))); L.r = snapR(b0.r + a1 - a0); }
    else if (P.length > 1 && L) { const f = Math.hypot(P[0][0] - P[1][0], P[0][1] - P[1][1]) / Math.max(1, Math.hypot(g0.P[0][0] - g0.P[1][0], g0.P[0][1] - g0.P[1][1]));
      L.s = Math.max(.08, Math.min(8, g0.L.s * f)); L.r = snapR(g0.L.r + ang(P[0], P[1]) - ang(g0.P[0], g0.P[1])); L.x = g0.L.x + dx; L.y = g0.L.y + dy; }
    else if (L && g0.hit) { dragging = true; if (!g0.frz) { g0.frz = 1; freezeRow(L); for (const id of multi) freezeRow(getL(id)); } let nx = g0.L.x + dx, ny = g0.L.y + dy; const b = boxes.find(q => q.id === L.id) || { x: L.x, y: L.y, w: 0, h: 0, s: 1, r: 0 }, cs = corners(b), hw = Math.max(...cs.map(q => Math.abs(q[0] - b.x))), hh = Math.max(...cs.map(q => Math.abs(q[1] - b.y))); const gx = [], gy = [];
      const HH = FH(), sz = HH === 1920 ? [250, 1670] : [60, HH - 60], T = 18, skip = new Set([L.id, ...multi]);
      const tx = [[540, 0]], ty = [[HH / 2, 0]]; // [target line, own offset]
      for (const q of boxes) { if (skip.has(q.id) || q.hidden || q.nh || q.w * q.s > 1070) continue; const qc = corners(q), xs = qc.map(v => v[0]), ys = qc.map(v => v[1]), l = Math.min(...xs), r = Math.max(...xs), t = Math.min(...ys), bt = Math.max(...ys); for (const x of [l, (l + r) / 2, r]) tx.push([x, null]); for (const y of [t, (t + bt) / 2, bt]) ty.push([y, null]); }
      const best = (n, tg, h, mg) => { let m = null; if (Math.abs(n - tg[0][0]) < T) return { n: tg[0][0], line: tg[0][0] }; for (const [t, o] of tg) for (const off of o === null ? [-h, 0, h] : [o]) { const d = Math.abs(n + off - t); if (d < T && (!m || d < m.d)) m = { d, n: t - off, line: t }; } if (!m) for (const [t, line] of mg) if (Math.abs(n - t) < T) { m = { n: t, line }; break; } return m; };
      const mx_ = best(nx, tx, hw, [[60 + hw, 60], [1020 - hw, 1020]]); if (mx_) { nx = mx_.n; gx.push(mx_.line); }
      const my_ = best(ny, ty, hh, [[sz[0] + hh, sz[0]], [sz[1] - hh, sz[1]]]); if (my_) { ny = my_.n; gy.push(my_.line); }
      L.x = nx; L.y = ny; L.mv = 1; for (const [id, x0, y0] of g0.M || []) { const m = getL(id); if (m && !m.lk) { m.x = x0 + nx - g0.L.x; m.y = y0 + ny - g0.L.y; m.mv = 1; delete m.ax; delete m.ay; } }
      guides = { x: gx, y: gy }; trashHot = !multi.size && Math.hypot(P[0][0] - 540, P[0][1] - (HH - 130)) < 110; }
    else if (!g0.hit && doc.bg.type === 'photo' && photos[doc.bg.pid]) { if (P.length > 1) { const f = Math.hypot(P[0][0] - P[1][0], P[0][1] - P[1][1]) / Math.max(1, Math.hypot(g0.P[0][0] - g0.P[1][0], g0.P[0][1] - g0.P[1][1])); doc.bg.pz = Math.max(1, Math.min(4, (g0.bg.pz || 1) * f)); }
      const im = bgImg(), HB = FH(), box = imContent(im), sc = Math.max(1080 / box.w, HB / box.h) * (doc.bg.pz || 1), mx = Math.max(1, (box.w * sc - 1080) / 2), my = Math.max(1, (box.h * sc - HB) / 2);
      doc.bg.moved = 1; doc.bg.px = Math.max(-1, Math.min(1, (g0.bg.px || 0) + dx / mx)); doc.bg.py = Math.max(-1, Math.min(1, (g0.bg.py || 0) + dy / my)); }
    changed();
  });
  const up = e => { if (!pts.has(e.pointerId)) return; pts.delete(e.pointerId); clearTimeout(lp);
    if (!pts.size) { delete ov.dataset.down; const want = $('tplCard') && $('tplCard').dataset.sheetWant != null; if (want) delete $('tplCard').dataset.sheetWant;
      if (dragging && trashHot && sel) delLayer(sel); dragging = false; trashHot = false; guides = null; g0 = null; paintOvl(); if (moved) commit(); if (sel || want) paintPanel(); } else start(); };
  ov.addEventListener('pointerup', up); ov.addEventListener('pointercancel', up);
  ov.addEventListener('wheel', e => { const L = sel && getL(sel); if (!L) return; e.preventDefault(); if (L.lk) return; pinS(L); L.s = Math.max(.08, Math.min(8, L.s * Math.exp(-e.deltaY / 500))); changed(); }, { passive: false });
  // no page scroll / zoom while touching the canvas (iOS needs non-passive handlers)
  for (const el of [st, $('cpSV'), $('cpHue')]) { const block = e => { if (e.target.closest && e.target.closest('.mini, .bg-btn, .ctx')) return; e.preventDefault(); }; el.addEventListener('touchstart', block, { passive: false }); el.addEventListener('touchmove', block, { passive: false }); }
}
const snapR = r => { const t = Math.PI / 2, n = Math.round(r / t); return Math.abs(r - n * t) < .06 ? n * t : r; };
function showMenu(p) { const bh = $('ctxBehind'), L0 = getL(sel); if (bh) { bh.hidden = !canBehind(L0); bh.textContent = L0 && L0.behind ? '인물 앞으로' : '인물 뒤로'; } const m = $('ctxMenu'), r = $('ovl').getBoundingClientRect(), k = r.width / 1080, ky = r.height / FH(); m.hidden = false; m.style.left = Math.min(r.width - 200, Math.max(0, p[0] * k - 100)) + 'px'; m.style.top = Math.max(0, p[1] * ky - 60) + 'px'; }
function hideMenu() { $('ctxMenu').hidden = true; }
tapButtons($('ctxMenu'), '[data-act]', b => { hideMenu(); if (b.dataset.act === 'behind') { const L0 = getL(sel); if (L0) toggleBehind(L0); } else act(b.dataset.act); });
const BG_PHOTO_KEYS = ['pid', 'filter', 'adj', 'crop', 'cr', 'rot', 'flip', 'pz', 'px', 'py', 'cut', 'ol', 'moved'];
function parkBgPhoto() { const b = doc && doc.bg; if (!b || b.type !== 'photo' || !b.pid) return; const k = { type: 'photo' }; for (const f of BG_PHOTO_KEYS) if (b[f] !== undefined) k[f] = clone(b[f]); doc.bgKeep = k; }
function dropBgKeep() { if (doc && doc.bgKeep) delete doc.bgKeep; }
function photoToBg(L) { if (!L || !L.pid || !photos[L.pid]) return; if (L.lk) { status('잠긴 사진은 배경으로 바꿀 수 없어요 · 잠금을 먼저 풀어 주세요', 3000); return; } const old = doc.bg.type === 'photo' && photos[doc.bg.pid] ? clone(doc.bg) : null;
  dropBgKeep(); doc.bg = { type: 'photo', pid: L.pid, pz: 1, px: 0, py: 0, filter: L.filter || 'none', ...(L.adj ? { adj: clone(L.adj) } : {}), ...(L.crop ? { crop: clone(L.crop) } : {}), ...(L.rot ? { rot: L.rot } : {}), ...(L.flip ? { flip: L.flip } : {}) };
  doc.layers = doc.layers.filter(l => l !== L); sel = null; multi.clear(); if (old) bgToLayer(old, true); else { changed(true); paintPanel(); } status(old ? '배경 사진과 맞바꿨어요' : '배경 사진으로 깔았어요'); }
function bgToLayer(bg = doc.bg, keepBg = false) { if (bg.type !== 'photo' || !photos[bg.pid]) return; if (doc.layers.filter(l => l.type === 'photo').length >= MAX_PHOTOS) { status(`사진은 ${MAX_PHOTOS}장까지 넣을 수 있어요`); return; }
  const L = mk('photo', { pid: bg.pid, mask: 'rect', filter: bg.filter || 'none', x: 540, y: FH() / 2, s: .7, ...(bg.adj ? { adj: clone(bg.adj) } : {}), ...(bg.crop ? { crop: clone(bg.crop) } : {}), ...(bg.rot ? { rot: bg.rot } : {}), ...(bg.flip ? { flip: bg.flip } : {}) });
  if (!keepBg) { dropBgKeep(); doc.bg = { type: 'tier' }; doc.layers.forEach(l => l.behind = false); } doc.layers.push(L); sel = L.id; mode = null; changed(true); paintPanel(); if (!keepBg) status('배경 사진을 꺼냈어요 · 끌어서 옮겨 보세요'); }
window.__photoToBg = () => photoToBg(getL(sel)); window.__bgToLayer = () => bgToLayer();
function delLayer(id) { const L = getL(id); if (!L) return; if (L.lk) { status('잠긴 요소는 지울 수 없어요 · 잠금을 먼저 풀어 주세요', 3000); return; } if (isTop(L)) { status('상위 %는 항상 크게 보여요 — 위치·스타일만 바꿀 수 있어요', 3000); return; } doc.layers = doc.layers.filter(l => l.id !== id); if (sel === id) sel = null; changed(true); paintPanel(); }
function act(a) { const i = doc.layers.findIndex(l => l.id === sel); if (i < 0) return; const L = doc.layers[i];
  if (a === 'del') { const ids = [...multi]; multi.clear(); ids.forEach(id => delLayer(id)); return delLayer(sel); }
  if (a === 'dup') { if (L.lk) { status('잠긴 요소는 복제할 수 없어요 · 잠금을 먼저 풀어 주세요', 3000); return; } if (isTop(L)) { status('상위 %는 하나만 있어요'); return; } if (L.type === 'photo' && doc.layers.filter(l => l.type === 'photo').length >= MAX_PHOTOS) { status(`사진은 ${MAX_PHOTOS}장까지 넣을 수 있어요`); return; } const n = { ...clone(L), id: lid(), x: L.x + 40, y: L.y + 40 }; doc.layers.splice(i + 1, 0, n); sel = n.id; }
  if (a === 'up' && i < doc.layers.length - 1) [doc.layers[i], doc.layers[i + 1]] = [doc.layers[i + 1], doc.layers[i]];
  if (a === 'down' && i > 0) [doc.layers[i], doc.layers[i - 1]] = [doc.layers[i - 1], doc.layers[i]];
  if (a === 'front') { doc.layers.splice(i, 1); doc.layers.push(L); } if (a === 'back') { doc.layers.splice(i, 1); doc.layers.unshift(L); }
  changed(true); paintPanel(); }
// ---- right toolbar ----
const addLayer = L => { doc.layers.push(L); sel = L.id; mode = null; changed(true); paintPanel(); };
$('tools').addEventListener('click', async e => { const b = e.target.closest('[data-tool]'); if (!b) return; const t = b.dataset.tool; hideMenu();
  if (t === 'text') { addLayer(mk('text', { t: '텍스트', size: 96, font: null, col: '#ffffff', x: 540, y: 960 })); setTimeout(() => { const ta = $('tText'); if (ta) { ta.focus({ preventScroll: true }); ta.select(); } }, 50); return; }
  sel = null; multi.clear(); libOpen = false; mode = mode === t ? null : t; paintPanel(); paintOvl(); });
let photoTarget = 'layer';
const pickPhoto = () => { status('사진은 이 기기 안에서만 쓰여요', 2200); $('photo').click(); };
$('photo').addEventListener('change', async e => {
  const fs = [...e.target.files]; e.target.value = ''; if (!fs.length) return;
  if (photoTarget === 'bg') { const pid = await addPhotoFile(photos, fs[0]); dropBgKeep(); doc.bg = { type: 'photo', pid, pz: 1, px: 0, py: 0, filter: 'none', ...clone(doc.bgT || {}) }; if (doc.layers.some(l => l.behind)) { status('인물을 찾는 중이에요…', 8000); if (!(await ensureMask(photos, pid))) { doc.layers.forEach(l => l.behind = false); status('이 사진에서는 인물을 찾지 못했어요 · 글자는 앞에 그대로 둘게요', 4000); } else status(''); } changed(true); paintPanel(); return; }
  if (photoTarget === 'fill') { const L = getL(sel); if (L) { L.pid = await addPhotoFile(photos, fs[0]); L.cz = 1; L.cx = 0; L.cy = 0; changed(true); paintPanel(); } return; }
  let n = doc.layers.filter(l => l.type === 'photo').length;
  for (const f of fs) { if (n >= MAX_PHOTOS) { status(`사진은 ${MAX_PHOTOS}장까지 넣을 수 있어요`); break; } const pid = await addPhotoFile(photos, f); n++; const L = mk('photo', { pid, mask: 'round', filter: 'none', x: 540 + (n % 3 - 1) * 60, y: 900 + (n % 3) * 40, s: .9 }); doc.layers.push(L); sel = L.id; }
  mode = null; changed(true); paintPanel();
});
let stT = 0; function status(t, ms = 2600) { $('pvHint').textContent = t || (sheetOn() ? '' : fineP ? '클릭해 선택 · 끌어서 이동 · Ctrl+드래그로 크기 · Shift+클릭으로 여러 개 선택' : '탭해 선택 · 끌어서 이동 · 두 손가락으로 크기·회전'); clearTimeout(stT); if (t) stT = setTimeout(() => status(''), ms); }
// ---- colour picker (HSV, persistent H/S/V: never re-derive hue when s or v = 0) ----
let hsv = { h: 0, s: 0, v: 1 }, hsvCol = '';
const adoptHex = hex => { const n = hex2hsv(hex); if (n.v === 0) n.s = hsv.s; if (n.s === 0 || n.v === 0) n.h = hsv.h; hsv = n; hsvCol = hex.toLowerCase(); };
const hasBg = L => L.v === 2 || (L.box && L.box !== 'none');
const colTarget = () => mode === 'bg' ? { get: () => doc.bg.c1 || '#0f1620', set: c => { parkBgPhoto(); doc.bg = c === '@tier' ? { type: 'tier' } : { type: 'solid', c1: c }; } } : (colMode === 'bg' && getL(sel) && ['text', 'stat'].includes(getL(sel).type)) ? { get: () => { const L = getL(sel); return L.bcol || (L.box === 'semi' ? '#000000' : L.col || '#ffffff'); }, set: c => { const L = getL(sel); if (!L) return; const first = !L.bcol; L.bcol = c; if (L.v !== 2 && (!L.box || L.box === 'none')) { L.box = 'full'; if (L.col == null) L.col = '#ffffff'; } if (first || !document.querySelector('#pBo')) setTimeout(paintPanel, 0); } }
  : { get: () => (getL(sel) || {}).col || '#ffffff', set: c => { const L = getL(sel); if (L) L.col = c; } };
function setCol(hex, fromHsv) { if (hex === '@tier') { colTarget().set('@tier'); adoptHex(accentOf(state.story).toLowerCase()); paintPicker(); changed(); return; } hex = hex.toLowerCase(); if (fromHsv) hsvCol = hex; else adoptHex(hex); colTarget().set(hex);  paintPicker(); changed(); }
function paintPicker() { if (!$('cpick').isConnected || $('cpick').closest('[hidden]')) return; let c = colTarget().get(); if (c === '@tier') c = accentOf(state.story); if (c.toLowerCase() !== hsvCol) adoptHex(c);
  $('cpChip').style.background = c; if (document.activeElement !== $('cpHex')) $('cpHex').value = c.toUpperCase();
  $('cpSV').style.setProperty('--hue', `hsl(${hsv.h} 100% 50%)`); $('cpSVk').style.left = `${hsv.s * 100}%`; $('cpSVk').style.top = `${(1 - hsv.v) * 100}%`; $('cpSVk').style.background = c;
  $('cpHuek').style.left = `${hsv.h / 360 * 100}%`; $('cpHue').setAttribute('aria-valuenow', Math.round(hsv.h)); $('cpSV').setAttribute('aria-valuetext', `채도 ${Math.round(hsv.s * 100)}%, 밝기 ${Math.round(hsv.v * 100)}%`);
  for (const q of document.querySelectorAll('#panel .qc[data-c]')) q.setAttribute('aria-pressed', String(q.dataset.c === c.toLowerCase())); }
function dragArea(el, fn) { const go = e => { const r = el.getBoundingClientRect(); fn(Math.min(1, Math.max(0, (e.clientX - r.left) / r.width)), Math.min(1, Math.max(0, (e.clientY - r.top) / r.height))); };
  el.addEventListener('pointerdown', e => { el.setPointerCapture(e.pointerId); go(e); e.preventDefault(); }); el.addEventListener('pointermove', e => { if (el.hasPointerCapture(e.pointerId)) go(e); }); el.addEventListener('pointerup', () => { commit(); if (mode === 'bg' && doc.bgKeep && !$('bgBack')) paintPanel(); }); }
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
  if (k) LS('runtier:fontrecent', [k, ...recents().filter(x => x !== k)].slice(0, 8)); L.font = k || null; changed(true); paintPanel(); }
// ---- font bottom sheet: tap applies live, sheet stays open until 완료 ----
function fontSheetHTML(L) { return `<div class="fs-card" role="dialog" aria-modal="true" aria-labelledby="fsT"><div class="sh-head"><h3 id="fsT">글꼴 ${Object.keys(FONTS).filter(PICKABLE).length}</h3><button type="button" class="chip-btn primary-chip" id="fsDone">완료</button></div>
  <input id="fSearch" type="search" autocomplete="off" placeholder="글꼴 검색 (예: 손글씨, 모노, Bebas)" aria-label="글꼴 검색"><div class="fcats" id="fCats" role="radiogroup" aria-label="글꼴 분류">${[['all', '전체'], ['recent', '최근'], ['fav', '★'], ...FONT_CATS].map(([k, n]) => `<button type="button" role="radio" data-c="${k}" aria-checked="${k === fontCat}">${n}</button>`).join('')}</div>
  <div class="flist" id="fList">${libHTML(L)}</div><p class="hint">모든 글꼴은 상업적 사용이 허용된 OFL·Apache 라이선스예요</p></div>`; }
function openFontSheet() { const L = getL(sel); if (!L) return; let sh = $('fSheet'); if (!sh) { sh = document.createElement('div'); sh.id = 'fSheet'; sh.className = 'fsheet'; document.body.appendChild(sh);
    sh.addEventListener('click', e => { const L2 = getL(sel); if (e.target === sh || e.target.closest('#fsDone')) return closeFontSheet(); const b = e.target.closest('button'); if (!b || !L2) return; const d = b.dataset;
      if (d.c && b.closest('#fCats')) { fontCat = d.c; for (const x of $('fCats').children) x.setAttribute('aria-checked', String(x === b)); $('fList').innerHTML = libHTML(L2); }
      else if (d.star) { const f = favs(); LS('runtier:fontfav', f.includes(d.star) ? f.filter(x => x !== d.star) : [d.star, ...f]); $('fList').innerHTML = libHTML(L2); }
      else if (d.fk !== undefined) pickFont(d.fk || null).then(() => { setTimeout(focusZoom, 60); if (!$('fSheet').hidden) $('fList').innerHTML = libHTML(getL(sel)); }); });
    sh.addEventListener('input', e => { if (e.target.id === 'fSearch') $('fList').innerHTML = libHTML(getL(sel)); });
    sh.addEventListener('keydown', e => { if (e.key === 'Escape') closeFontSheet(); }); }
  sh.innerHTML = fontSheetHTML(L); sh.hidden = false; document.body.classList.add('fs-open'); $('fsDone').focus({ preventScroll: true }); requestAnimationFrame(() => { paintOvl(); focusZoom(); }); }
function closeFontSheet() { const sh = $('fSheet'); if (sh) sh.hidden = true; document.body.classList.remove('fs-open'); paintPanel(); requestAnimationFrame(() => { focusZoom(); paintOvl(); }); }
// ---- bottom panel (one level deep, in page flow) ----
const NAMES = { text: '텍스트', card: '티어 카드', photo: '사진', sticker: '스티커', shape: '도형' };
const lname = L => L.type === 'stat' ? STATS[L.stat][0] + (L.v === 4 ? ' 라벨' : '') : L.type === 'sticker' ? (DATA_STK[L.k] ? DATA_STK[L.k].n + ' 스티커' : ICON_NAMES[L.k] ? ICON_NAMES[L.k] + ' 아이콘' : STK_NAMES[L.k] || (STICKERS.find(s => s[0] === L.k) || [])[1] || '스티커') : L.type === 'text' ? `텍스트 '${(L.t || '').slice(0, 10)}'` : NAMES[L.type];
const seg = (id, opts, cur) => `<div class="seg n${opts.length}" id="${id}" role="radiogroup">${opts.map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}">${n}</button>`).join('')}</div>`;
const STYLE_THUMB = ['<i class="th-l">PACE</i><b>4:54</b>', '<b class="th-big">4:54</b>', '<b class="th-pill">4:54</b>', '<b class="th-run">4:54</b><i class="th-l">PACE</i>'];
const segT = (id, opts, cur) => `<div class="seg segt n${opts.length}" id="${id}" role="radiogroup" aria-label="표시 스타일">${opts.map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}"><span class="thumb" aria-hidden="true">${STYLE_THUMB[v]}</span>${n}</button>`).join('')}</div>`;
// slider row: −/+ fine steps, tap value to type a number
const range = (id, lab, min, max, val, unit = '') => `<div class="adj-row rgx"><label for="${id}" class="lbl sm">${lab}</label><div class="trk"><button type="button" class="stp" data-stp="${id}" data-d="-1" aria-label="${lab} 줄이기">−</button><input type="range" id="${id}" min="${min}" max="${max}" value="${val}"><button type="button" class="stp" data-stp="${id}" data-d="1" aria-label="${lab} 늘리기">+</button></div><button type="button" class="rv" data-rv="${id}" data-u="${unit}" aria-label="${lab} 값 직접 입력"><output id="${id}V">${val}${unit}</output></button></div>`;
let moreCol = false, moreTxt = false, colMode = 'fg';
// ---- v4 photo tools (shared by photo layers and the background photo) ----
const OLC = ['#ffffff', '#111111', '#3dc8f5', '#b9ecff', '#ffd166', '#ff8fd8', '#ff5a5f'];
const colRow = (id, cur, tier = false) => `<div class="olc" id="${id}">${tier ? `<button type="button" class="qc" data-olc="@tier" aria-label="티어 색" aria-pressed="${cur === '@tier'}" style="--c:${accentOf(state.story)}"></button>` : ''}${OLC.map(c => `<button type="button" class="qc" data-olc="${c}" aria-label="${c}" aria-pressed="${(cur || '').toLowerCase() === c}" style="--c:${c}"></button>`).join('')}<input type="color" id="${id}Pick" value="${/^#[0-9a-f]{6}$/i.test(cur || '') ? cur : '#ffffff'}" aria-label="색 직접 고르기"></div>`;
const fchips = (id, opts, cur, cls = '') => `<div class="fchips${cls ? ' ' + cls : ''}" id="${id}" role="radiogroup">${opts.map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${String(v) === String(cur)}">${n}</button>`).join('')}</div>`;
const ADJ = [['br', '밝기'], ['ct', '대비'], ['sa', '채도'], ['wa', '따뜻함']];
function photoEdHTML(P) { const a = P.adj || {}, ol = P.ol || {};
  return `<span class="lbl sm">필터</span><p class="hint">필터는 여기서 바꿔요.</p>${fchips('peFilter', FILTERS, P.filter || 'none', 'hbar')}`
    + `<div class="pe-row"><button type="button" class="chip-btn" id="peCrop" aria-pressed="${!!P.crop}">✂ 자르기</button><button type="button" class="chip-btn" id="peRot" aria-label="90도 회전">↻ 90°</button><button type="button" class="chip-btn" id="peFlip" aria-pressed="${!!P.flip}">⇋ 좌우 반전</button><button type="button" class="chip-btn" id="peCut" aria-pressed="${!!P.cut}">${P.cut ? '↺ 원본 사진' : '인물만 남기기'}</button></div>`
    + (P.cut ? `<div class="pe-row"><button type="button" class="chip-btn" id="peOl" aria-pressed="${!!ol.on}">누끼 테두리 ${ol.on ? '켜짐' : '꺼짐'}</button></div>` + (ol.on ? `<span class="lbl sm">테두리 색</span>${colRow('olCol', ol.col || '#ffffff')}` + range('olW', '테두리 두께', 2, 40, ol.w || 12, 'px') : '') : '')
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
    const b = e.currentTarget; b.classList.add('loading'); b.disabled = true; b.setAttribute('aria-busy', 'true'); b.textContent = segP ? '인물 찾는 중…' : '인식 모델 준비 중…'; status((segP ? '인물을 남기는 중이에요…' : '인물 인식 모델을 준비하고 있어요 (처음 한 번만)…') + ' 사진은 기기 밖으로 나가지 않아요', 15000);
    const ok = await ensureMask(photos, P.pid); if (ok) { P.cut = true; if (!P.ol) P.ol = { on: false, col: '#ffffff', w: 12}; status('인물만 남겼어요 · 원본 사진으로 언제든 돌릴 수 있어요'); } else status(segFailMsg('사진은 그대로 둘게요'), 5000);
    changed(true); paintPanel(); });
  on('peOl', () => { P.ol = { col: '#ffffff', w: 12, ...(P.ol || {}), on: !(P.ol && P.ol.on) }; changed(true); paintPanel(); });
  const olc = $('olCol'); if (olc) { olc.addEventListener('click', e => { const b = e.target.closest('[data-olc]'); if (!b) return; P.ol.col = b.dataset.olc; changed(true); paintPanel(); }); $('olColPick').addEventListener('input', e => { P.ol.col = e.target.value; changed(); }); $('olColPick').addEventListener('change', () => { commit(); }); }
  const w = $('olW'); if (w) w.addEventListener('input', e => { P.ol.w = +e.target.value; $('olWV').textContent = e.target.value + 'px'; changed(); });
  const f = $('peFilter'); if (f) f.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; P.filter = b.dataset.v; for (const x of f.querySelectorAll('[data-v]')) x.setAttribute('aria-checked', String(x === b)); changed(true); });
  on('peMore', e => { moreAdj = !moreAdj; const b = e.currentTarget; b.setAttribute('aria-expanded', moreAdj); b.querySelector('i').textContent = moreAdj ? '▴' : '▾'; $('peAdj').hidden = !moreAdj; });
  for (const [k] of ADJ) { const r = $('pa_' + k); if (r) r.addEventListener('input', e => { P.adj = { ...(P.adj || {}), [k]: +e.target.value }; if (!Object.values(P.adj).some(Boolean)) delete P.adj; $('pa_' + k + 'V').textContent = e.target.value; changed(); }); }
  on('peAdjReset', () => { delete P.adj; changed(true); paintPanel(); }); }
// ---- text effects (all off by default): 그림자 · 외곽선 · 글로우 ----
function fxHTML(L) { return `<button type="button" class="acc" id="pMoreFx" aria-expanded="${moreFx}" aria-controls="pFxAcc"><span>효과 (그림자·외곽선·글로우)</span><i aria-hidden="true">${moreFx ? '▴' : '▾'}</i></button><div id="pFxAcc" class="acc-body"${moreFx ? '' : ' hidden'}><div class="pe-row"><button type="button" class="chip-btn" id="fxSh" aria-pressed="${!!L.fsh}">그림자</button><button type="button" class="chip-btn" id="fxOl" aria-pressed="${!!L.fol}">외곽선</button><button type="button" class="chip-btn" id="fxGl" aria-pressed="${!!L.fgl}">글로우</button></div>`
  + (L.fol ? `<span class="lbl sm">외곽선 색</span>${colRow('folCol', L.fol.col, true)}${range('folW', '외곽선 두께', 1, 30, L.fol.w || 6, 'px')}` : '')
  + (L.fgl ? `<span class="lbl sm">글로우 색</span>${colRow('fglCol', L.fgl.col || '#3dc8f5', true)}${range('fglR', '글로우 세기', 5, 100, L.fgl.r ?? 30, '%')}` : '') + `</div>`; }
function bindFx(L) { const on = (id, f) => { const e = $(id); if (e) e.addEventListener('click', f); };
  on('pMoreFx', e => { moreFx = !moreFx; const b = e.currentTarget; b.setAttribute('aria-expanded', moreFx); b.querySelector('i').textContent = moreFx ? '▴' : '▾'; $('pFxAcc').hidden = !moreFx; });
  on('fxSh', () => { if (L.fsh) delete L.fsh; else L.fsh = 1; changed(true); paintPanel(); });
  on('fxOl', () => { if (L.fol) delete L.fol; else L.fol = { col: '#111111', w: 6 }; changed(true); paintPanel(); });
  on('fxGl', () => { if (L.fgl) delete L.fgl; else L.fgl = { col: '#3dc8f5', r: 30 }; changed(true); paintPanel(); });
  for (const [id, key] of [['folCol', 'fol'], ['fglCol', 'fgl']]) { const e = $(id); if (!e) continue; e.addEventListener('click', ev => { const b = ev.target.closest('[data-olc]'); if (!b) return; L[key].col = b.dataset.olc; changed(true); paintPanel(); }); $(id + 'Pick').addEventListener('input', ev => { L[key].col = ev.target.value; changed(); }); $(id + 'Pick').addEventListener('change', () => { commit(); }); }
  for (const [id, key, f, u] of [['folW', 'fol', 'w', 'px'], ['fglR', 'fgl', 'r', '%']]) { const e = $(id); if (e) e.addEventListener('input', ev => { L[key][f] = +ev.target.value; $(id + 'V').textContent = ev.target.value + u; changed(); }); } }
// ---- user-input stickers: plain text layers (editable, styleable like any text) ----
const WX = ['☀️', '⛅', '☁️', '🌧️', '❄️', '🌬️', '🌙'];
const INSTK = { weather: ['날씨', { t: '☀️ 18°C', size: 72, font: null, w: 700 }], place: ['코스·장소', { t: '📍 한강 반포', size: 60, font: null, w: 600 }], bib: ['배번', { t: '1234', size: 150, font: 'anton', col: '#111111', box: 'full', bcol: '#ffffff', bo: 1, ls: 4 }], memo: ['메모 (손글씨)', { t: '오늘도 완주!', size: 96, font: 'nanumpen', w: 400 }] };
let stkCat = 'rec';
const STK_TABS = [['rec', '기록'], ['mark', '배지'], ['run', '러닝'], ['say', '문구']];
const STK_CAT = { pb: 'mark', medal: 'mark', stamp: 'mark', bib: 'mark', chip5k: 'mark', chip10k: 'mark', chiphalf: 'mark', marathon: 'mark', splits: 'mark', streak: 'mark', crew: 'mark', wordmark: 'mark', dawnrun: 'run', rainrun: 'run', hangang: 'run', shoe: 'run', fuel: 'run', pacer: 'run', heart: 'run', ohunwan: 'say', runlini: 'say', tiredhappy: 'say', handwritten: 'say', runnershigh: 'say', proud: 'say', together: 'say' };
const stkBtn = (k, n, kind) => `<button type="button" class="pre stk" data-${kind}="${k}"><canvas width="120" height="120" data-stk="${k}"></canvas><small>${esc(n)}</small></button>`;
// ---- bottom sheet: while a tool or a selection is open the editor fills the screen (fixed), the canvas takes the top and the
// options sit in a capped, self-scrolling sheet under the tools — no page scrolling back and forth between canvas and options.
// DOM-only state (no module-level let) so status()/paintPanel() can run before this point is reached.
// focus zoom: while the font sheet or typing mode squeezes the canvas, magnify the view (not the image) around the selected
// element so the font/text change is readable. CSS transform only — pointer maths use getBoundingClientRect, so it stays correct.
function focusZoom() { const st = document.getElementById('stage'), fit = document.getElementById('tplEd'), c = document.getElementById('tplCard'); if (!st || !fit || !c) return;
  const want = c.classList.contains('typing') || (document.body.classList.contains('fs-open') && c.classList.contains('sheet-on'));
  const b = want && sel && boxes.find(q => q.id === sel);
  if (!b) { st.style.transform = ''; st.style.transformOrigin = ''; c.classList.remove('zoomed'); delete st._zb; return; }
  // measure the unzoomed stage once per zoom session: resetting the transform on every font pick made the view jump 1x→3x each time
  if (!st._zb || !c.classList.contains('zoomed')) { st.style.transform = ''; st.style.transformOrigin = ''; const r = st.getBoundingClientRect(); st._zb = { left: r.left, top: r.top, width: r.width, height: r.height }; }
  const sr = st._zb, fr = fit.getBoundingClientRect(); if (!sr.width || !fr.width) return;
  const kx = sr.width / 1080, ky = sr.height / FH(), cs = corners(b), xs = cs.map(q => q[0] * kx), ys = cs.map(q => q[1] * ky);
  const bw = Math.max(8, Math.max(...xs) - Math.min(...xs)), bh = Math.max(8, Math.max(...ys) - Math.min(...ys)), cx = (Math.max(...xs) + Math.min(...xs)) / 2, cy = (Math.max(...ys) + Math.min(...ys)) / 2;
  const z = Math.min(3, fr.width * .8 / bw, fr.height * .45 / bh); if (z < 1.2) { st.style.transform = ''; st.style.transformOrigin = ''; c.classList.remove('zoomed'); delete st._zb; return; }
  const tx = fr.left + fr.width / 2 - sr.left - z * cx, ty = fr.top + fr.height / 2 - sr.top - z * cy;
  st.style.transformOrigin = '0 0'; st.style.transform = `translate(${tx}px,${ty}px) scale(${z})`; c.classList.add('zoomed'); }
function sheetOn() { const c = document.getElementById('tplCard'); return !!(c && c.classList.contains('sheet-on')); }
function fitSheet() { const c = document.getElementById('tplCard'); if (!c || !c.classList.contains('sheet-on')) return; const v = window.visualViewport;
  c.style.setProperty('--vvh', (v ? v.height : innerHeight) + 'px'); c.style.setProperty('--vvt', (v ? v.offsetTop : 0) + 'px');
  if (c.classList.contains('zoomed')) { const st = document.getElementById('stage'); if (st) delete st._zb; requestAnimationFrame(() => focusZoom()); } } // keyboard still sliding: re-measure
function sheet(on) { const c = document.getElementById('tplCard'); if (!c) return; delete c.dataset.sheetWant; if (on === sheetOn()) return;
  const o = document.getElementById('ovl'); if (o && o.dataset.down) { c.dataset.sheetWant = on ? '1' : '0'; return; } // finger still on the canvas: resize after it lifts, not under it
  if (on) { const ph = document.createElement('div'); ph.className = 'sheet-ph'; ph.setAttribute('aria-hidden', 'true'); ph.style.height = c.offsetHeight + 'px'; c.before(ph); c.classList.add('sheet-on'); fitSheet(); }
  else { c.classList.remove('sheet-on', 'sheet-xl'); const ph = c.previousElementSibling; if (ph && ph.classList.contains('sheet-ph')) ph.remove(); }
  status(''); requestAnimationFrame(() => paintOvl()); }
function closeSheet() { if (cropSt) return; sel = null; multi.clear(); multiSnap = null; libOpen = false; mode = null; paintPanel(); paintOvl(); }
if (window.visualViewport) { visualViewport.addEventListener('resize', fitSheet); visualViewport.addEventListener('scroll', fitSheet); }
if (!$('sheetGrab')) { const g = document.createElement('button'); g.type = 'button'; g.id = 'sheetGrab'; g.className = 'sheet-grab'; g.setAttribute('aria-label', '편집 메뉴 닫기 (위로 밀면 넓게 보기)');
  g.innerHTML = '<i aria-hidden="true"></i><span aria-hidden="true">닫기</span>'; $('tools').after(g);
  let y0 = null; g.addEventListener('pointerdown', e => { y0 = e.clientY; g.setPointerCapture(e.pointerId); });
  g.addEventListener('pointerup', e => { if (y0 == null) return; const dy = e.clientY - y0; y0 = null; const c = $('tplCard');
    if (dy < -24) { c.classList.add('sheet-xl'); requestAnimationFrame(() => paintOvl()); } else if (dy > 24 && c.classList.contains('sheet-xl')) { c.classList.remove('sheet-xl'); requestAnimationFrame(() => paintOvl()); } else closeSheet(); });
  g.addEventListener('pointercancel', () => { y0 = null; });
  g.addEventListener('keydown', e => { if (e.key === 'Enter' || e.key === ' ') { e.preventDefault(); closeSheet(); } }); }
// typing mode: while the text field has focus AND the on-screen keyboard is up (visual viewport < 75% of its tallest seen height),
// the sheet, tools and top bar step aside and only [text field][입력 완료] stays under the canvas — otherwise sheet + keyboard leave a
// stamp-sized canvas. Keyboard check matters: iOS may not raise the keyboard for the text tool's programmatic focus, and desktop has none.
{ const P = $('panel'), V = window.visualViewport; let tOut = 0, vMax = 0, vW = 0;
  const kbUp = () => { if (!V) return false; if (V.width !== vW) { vW = V.width; vMax = 0; } vMax = Math.max(vMax, V.height); return V.height < vMax * .75; };
  const updTyping = () => { const c = $('tplCard'); if (!c) return; const on = !!(document.activeElement && document.activeElement.id === 'tText') && kbUp() && sheetOn();
    if (on === c.classList.contains('typing')) return; c.classList.toggle('typing', on); const b = $('pDone'); if (b) b.textContent = on ? '입력 완료' : '완료'; requestAnimationFrame(() => { focusZoom(); paintOvl(); }); };
  if (V) V.addEventListener('resize', updTyping); kbUp();
  P.addEventListener('focusin', e => { if (e.target.id !== 'tText') return; clearTimeout(tOut); updTyping(); });
  P.addEventListener('focusout', e => { if (e.target.id !== 'tText') return; const c = $('tplCard'); if (c.classList.contains('typing')) c.dataset.typedAt = Date.now(); clearTimeout(tOut); tOut = setTimeout(updTyping, 120); });
  // 입력 완료 while typing = close the keyboard and stay on this text (font/colour come next); tapping it blurs first, hence the timestamp
  P.addEventListener('click', e => { if (!e.target.closest('#pDone')) return; const c = $('tplCard'); if (c.classList.contains('typing') || Date.now() - (+c.dataset.typedAt || 0) < 500) { e.stopImmediatePropagation(); c.dataset.typedAt = 0; document.activeElement && document.activeElement.blur(); } }, true); }
document.addEventListener('keydown', e => { if (e.key !== 'Escape' || !sheetOn() || e.defaultPrevented) return; const t = e.target; if (t && (t.closest('.fsheet,.fs-card') || /^(INPUT|TEXTAREA|SELECT)$/.test(t.tagName))) return; closeSheet(); });
// tool icons: one stroke style instead of mixed text glyphs and a colour emoji (markup is duplicated in 4 pages, so swap here)
{ const sv = d => `<svg viewBox="0 0 24 24" width="22" height="22" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true" focusable="false">${d}</svg>`;
  const IC = { tpl: '<rect x="4" y="4" width="7" height="7" rx="1.5"/><rect x="13" y="4" width="7" height="7" rx="1.5"/><rect x="4" y="13" width="7" height="7" rx="1.5"/><rect x="13" y="13" width="7" height="7" rx="1.5"/>',
    photo: '<path d="M4 8.5A1.5 1.5 0 0 1 5.5 7h2l1.5-2h6l1.5 2h2A1.5 1.5 0 0 1 20 8.5v9a1.5 1.5 0 0 1-1.5 1.5h-13A1.5 1.5 0 0 1 4 17.5z"/><circle cx="12" cy="12.5" r="3.5"/>',
    sticker: '<path d="M12 3.8l2.5 5.1 5.6.8-4 3.9.9 5.6-5-2.6-5 2.6.9-5.6-4-3.9 5.6-.8z"/>',
    stat: '<circle cx="12" cy="13.5" r="7"/><path d="M12 13.5V10M10 3.5h4M18 7l1.5-1.5"/>',
    bg: '<circle cx="12" cy="12" r="8"/><path d="M12 4a8 8 0 0 1 0 16z" fill="currentColor"/>',
    layers: '<path d="M12 4l8 4-8 4-8-4z"/><path d="M4 12l8 4 8-4M4 16l8 4 8-4"/>' };
  for (const b of $('tools').querySelectorAll('[data-tool]')) { const d = IC[b.dataset.tool], i = b.querySelector('b'); if (d && i) i.innerHTML = sv(d); }
  const UR = { undo: '<path d="M9 14L4 9l5-5"/><path d="M4 9h10.5a5.5 5.5 0 0 1 0 11H11"/>', redo: '<path d="M15 14l5-5-5-5"/><path d="M20 9H9.5a5.5 5.5 0 0 0 0 11H13"/>' };
  for (const [id, d] of Object.entries(UR)) { const b = $(id); if (b) b.innerHTML = sv(d); } }
function paintPanel() {
  { const L0 = sel && getL(sel), b = L0 && (L0.ax || L0.ay) && boxes.find(q => q.id === sel); if (b) { L0.x = b.x; L0.y = b.y; delete L0.ax; delete L0.ay; } }
  const P = $('panel'); $('cpick').hidden = true; document.body.appendChild($('cpick')); const L = sel && getL(sel);
  sheet(!!(L || mode || (cropSt && photos[cropSt.pid])));
  for (const b of $('tools').querySelectorAll('[data-tool]')) b.setAttribute('aria-pressed', String(b.dataset.tool === mode && !L));
  { const tp = $('stTpls'); if (tp) tp.hidden = !(mode === 'tpl' && !L); } // template tool: big thumbnails + ratio live in this static panel
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
    if (L.type !== 'card' && L.type !== 'photo') h += `<span class="lbl sm">색</span>` + (tb ? `<div class="seg n2 ctsw" id="pCT" role="radiogroup" aria-label="색 대상">${[['fg', '글자 색'], ['bg', '상자 색']].map(([v, n]) => `<button type="button" role="radio" data-v="${v}" aria-checked="${colMode === v}">${n}</button>`).join('')}</div>` : '')
      + (tb && colMode === 'bg' ? (L.v === 2 ? `<div class="ed-btns"><button type="button" class="chip-btn" id="pBgNone" aria-pressed="${!L.bcol}">기본 배지 색</button></div>` : `<span class="lbl sm">상자</span>${seg('pBox', [['none', '없음'], ['semi', '반투명'], ['full', '채움']], L.box || 'none')}`) : '') + chipsHTML()
      + (tb && colMode === 'bg' && hasBg(L) ? range('pBo', '상자 불투명도', 0, 100, Math.round((L.bo ?? (L.v !== 2 && L.box === 'semi' ? .45 : 1)) * 100), '%') : '');
    if (!tb && L.type === 'text') h += `<span class="lbl sm">상자</span>${seg('pBox', [['none', '없음'], ['semi', '반투명'], ['full', '채움']], L.box || 'none')}`;
    if (L.type === 'text') h += `<span class="lbl sm">정렬</span>${seg('pAl', [['left', '왼쪽'], ['center', '가운데'], ['right', '오른쪽']], L.al || 'center')}`;
    if (L.type === 'text') h += range('pTs', '글자 크기', 20, 300, Math.round(L.size || 96));
    if (L.type === 'photo') h += (L.pid && photos[L.pid] ? '' : `<button type="button" class="chip-btn primary-chip" id="pFill">사진 넣기</button>`) + `<span class="lbl sm">모양</span>${seg('pMask', MASKS, L.mask || 'rect')}` + (L.pid && photos[L.pid] ? photoEdHTML(L) : '') + range('pCz', '자르기 확대', 100, 400, Math.round((L.cz || 1) * 100), '%') + range('pCx', '좌우', -100, 100, Math.round((L.cx || 0) * 100)) + range('pCy', '상하', -100, 100, Math.round((L.cy || 0) * 100)) + `<div class="ed-btns"><button type="button" class="chip-btn" id="pAsBg">배경 사진으로</button><button type="button" class="chip-btn" id="pRefill">사진 바꾸기</button></div>`;
    if (L.type === 'sticker' && L.k.startsWith('data_')) { const F = dataFields(L), inp = (k, lab, max, ph = '') => `<label class="lbl sm" for="df_${k}">${lab}</label><input id="df_${k}" data-df="${k}" maxlength="${max}" autocomplete="off" value="${esc(F[k] ?? '')}" placeholder="${esc(ph)}">`;
      h += `<p class="hint">직접 적는 스티커예요 · 값은 자동으로 채워지지 않아요</p>`;
      if (L.k.startsWith('data_weather')) h += `<span class="lbl sm">날씨</span>${fchips('dfIcon', WEATHER, F.icon)}` + inp('temp', '기온', 6, '12°C') + inp('label', '한 줄 메모', 16, '맑음 · 바람 약함') + wxHTML();
      if (L.k === 'data_course') h += inp('dist', '거리', 10, '10.0 km') + inp('name', '코스 이름', 18, '반포 → 잠수교');
      if (L.k === 'data_bib') h += inp('num', '배번', 5, '1031') + inp('race', '대회 (영문)', 18, 'SEOUL 10K') + `<span class="lbl sm">머리 색</span>${colRow('dfCol', F.color)}`;
      if (L.k === 'data_memo') h += inp('text1', '첫 줄', 14) + inp('text2', '둘째 줄', 16) + inp('date', '날짜 (MM.DD)', 5, '10.14'); }
    h += range('pS', '크기', 8, 400, Math.round(((boxes.find(q => q.id === L.id) || {}).s ?? L.s) * 100), '%') + (L.type === 'text' || L.type === 'stat' ? `<button type="button" class="acc" id="pMoreT" aria-expanded="${moreTxt}" aria-controls="pTxtAcc"><span>자간</span><i aria-hidden="true">${moreTxt ? '▴' : '▾'}</i></button><div id="pTxtAcc" class="acc-body"${moreTxt ? '' : ' hidden'}>${range('pLs', '자간', -10, 60, L.ls || 0, 'px')}</div>` + fxHTML(L) : '') + range('pR', '회전', -180, 180, Math.round((L.r || 0) * 180 / Math.PI), '°') + (isTop(L) ? '' : range('pO', '불투명도', 5, 100, Math.round((L.o ?? 1) * 100), '%'));
    // block actions (앞으로/뒤로/인물 뒤로/복제/삭제) live in the on-canvas mini toolbar (#miniBar) for every block type
  } else if (mode === 'photo') {
    h += `<div class="sh-head"><h3>사진</h3></div><div class="ed-btns"><button type="button" class="chip-btn primary-chip" id="phAdd">사진 추가</button><button type="button" class="chip-btn" id="phBg">배경 사진</button></div><p class="hint">사진은 이 기기 안에서만 쓰여요. 템플릿의 빈 칸은 그 칸을 고른 뒤 사진 넣기로 채워요.</p>`;
    if (doc.bg.type === 'photo' && photos[doc.bg.pid]) h += `<div class="bg-now"><span>배경 사진 사용 중</span><button type="button" class="chip-btn" id="bgOut" title="배경에서 빼서 움직이는 사진으로 만들어요">빼기</button></div>` + photoEdHTML(doc.bg) + range('bgZ', '확대', 100, 400, Math.round((doc.bg.pz || 1) * 100), '%') + '<p class="hint">빈 곳을 끌면 배경 사진이 움직여요</p>';
  } else if (mode === 'stat') {
    h += `<div class="sh-head"><h3>기록 블록 추가</h3></div><p class="hint lock">🔒 값은 계산 결과 그대로예요</p><div class="grid2">${Object.entries(STATS).filter(([k]) => k !== 'combo').map(([k, [n]]) => `<button type="button" class="pre" data-addstat="${k}"><b>${n}</b><small>${esc(statValue(state.story, doc, k))}</small></button>`).join('')}<button type="button" class="pre" data-addcard="0"><b>티어 카드</b><small>카드</small></button><button type="button" class="pre" data-addcard="1"><b>티어 배지</b><small>${esc(state.story.word)}</small></button></div>`;
  } else if (mode === 'sticker') {
    const tabs = `<div class="fcats" id="stkCats" role="radiogroup" aria-label="스티커 분류">${STK_TABS.map(([k, n]) => `<button type="button" role="radio" data-stkcat="${k}" aria-checked="${stkCat === k}">${n}</button>`).join('')}</div>`;
    const grid = stkCat === 'rec'
      ? Object.keys(DATA_STK).map(k => stkBtn(k, DATA_STK[k].n, 'addin')).join('')
      : Object.entries(STK_NAMES).filter(([k]) => !k.startsWith('data_') && (STK_CAT[k] || 'say') === stkCat).map(([k, n]) => stkBtn(k, n, 'addstk')).join('');
    h += `<div class="sh-head"><h3>스티커</h3></div>${tabs}<div class="grid3">${grid}</div>` + (stkCat === 'rec' ? '<p class="hint">기록 스티커는 내용을 직접 적어요</p>' : '');
  } else if (mode === 'bg') {
    const GR = [['#0F1620', '#14324a'], ['#3DC8F5', '#9b8cff'], ['#ff8a5b', '#ffd166'], ['#ffd6e8', '#fff4c2'], ['#0b3d2e', '#3fd68a'], ['#1b1f26', '#5a24a8']];
    h += `<div class="sh-head"><h3>바탕</h3></div>`;
    { const live = doc.bg.type === 'photo' ? doc.bg : null, remembered = !live && doc.bgKeep && doc.bgKeep.type === 'photo' ? doc.bgKeep : null, bgPhoto = live || remembered;
      if (live) h += `<div class="bg-now"><span>배경 사진 사용 중</span><button type="button" class="chip-btn" id="bgOut" title="배경에서 빼서 움직이는 사진으로 만들어요">빼기</button></div>`;
      if (remembered) h += `<div class="ed-btns"><button type="button" class="chip-btn primary-chip" id="bgBack">배경 사진으로 되돌리기</button></div>`;
      if (bgPhoto) h += `<span class="lbl sm">배경 사진 필터</span><p class="hint">필터는 여기서 바꿔요.</p>${fchips('bgFilter', FILTERS, bgPhoto.filter || 'none', 'hbar')}` + (live ? `<div class="ed-btns"><button type="button" class="chip-btn" id="bgReplace">배경 사진 바꾸기</button></div>` : ''); }
    h += `<div class="ed-btns"><button type="button" class="chip-btn" data-bg="tier" aria-pressed="${doc.bg.type === 'tier'}">티어 색</button><button type="button" class="chip-btn" data-bg="dark" aria-pressed="${doc.bg.type === 'dark'}">다크</button></div>
      <span class="lbl sm">그라데이션</span><div class="qcs">${GR.map((g, i) => `<button type="button" class="qc grad" data-grad="${i}" aria-label="그라데이션 ${i + 1}" style="background:linear-gradient(135deg,${g[0]},${g[1]})"></button>`).join('')}</div><span class="lbl sm">단색</span>${chipsHTML()}`;
    P.dataset.grads = JSON.stringify(GR);
  } else if (mode === 'layers') {
    h += `<div class="sh-head"><h3>레이어 (${doc.layers.length})</h3></div><ol class="layers">${[...doc.layers].reverse().map(l => `<li><button type="button" class="fopt" data-pick="${l.id}"><b>${esc(lname(l))}</b><small>${l.hidden ? '숨김' : ''}</small></button>${isTop(l) ? '' : `<button type="button" class="star" data-vis="${l.id}" aria-label="${esc(lname(l))} ${l.hidden ? '보이기' : '숨기기'}">${l.hidden ? '🙈' : '👁'}</button>`}</li>`).join('')}</ol>`;
  } else if (mode === 'tpl') { /* #stTpls shown above */ } // nothing selected and no tool → empty panel, the bottom sheet closes
  const sx = {}; for (const e of P.querySelectorAll('.hbar[id]')) sx[e.id] = e.scrollLeft; const sy = P.scrollTop;
  P.innerHTML = h; bindPanel(L); for (const [id, x] of Object.entries(sx)) { const e = $(id); if (e) e.scrollLeft = x; } P.scrollTop = sy;
  for (const c of P.querySelectorAll('canvas[data-stk]')) { const g = c.getContext('2d'); g.clearRect(0, 0, 120, 120); const L2 = mk('sticker', { k: c.dataset.stk, col: '#ffffff' }); renderMini(g, L2); }
  paintSelInfo();
}
async function renderMini(g, L) { const cv = await renderDoc(rctx, state.story, { bg: { type: 'solid', c1: '#1F2B3B' }, layers: [{ ...L, x: 540, y: 960, s: 1 }] }, photos); const b = cv.__boxes[0], sz = Math.max(b.w, b.h) * 1.15; g.drawImage(cv, 540 - sz / 2, 960 - sz / 2, sz, sz, 0, 0, 120, 120); }
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
  on('tText', 'input', e => { L.t = e.target.value; if (L.bind) delete L.bind; changed(); $('pName').textContent = lname(L); if ($('tplCard').classList.contains('typing')) setTimeout(focusZoom, 60); });
  on('raceIn', 'input', e => { doc.race = e.target.value; changed(); });
  const segOn = (id, f) => { const s = $(id); if (s) s.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (b) { f(b.dataset.v); changed(true); paintPanel(); } }); };
  segOn('pV', v => { if (L.type === 'stat' && L.look == null) L.look = L.v === 3 ? 'run' : 'std'; L.v = +v; }); segOn('pBox', v => L.box = v); segOn('pCT', v => { colMode = v; }); on('pBgNone', 'click', () => { if (L.v === 2) { delete L.bcol; delete L.bo; } else { L.box = 'none'; } changed(true); paintPanel(); }); segOn('pAl', v => L.al = v); segOn('pMask', v => L.mask = v); segOn('pFilter', v => L.filter = v); on('bgFilter', 'click', e => { const b = e.target.closest('[data-v]'); if (!b) return; const target = doc.bg.type === 'photo' ? doc.bg : doc.bgKeep; if (target && target.type === 'photo') target.filter = b.dataset.v; for (const x of e.currentTarget.querySelectorAll('[data-v]')) x.setAttribute('aria-checked', String(x === b)); changed(true); });
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
  on('phAdd', 'click', () => { photoTarget = 'layer'; pickPhoto(); }); on('phBg', 'click', () => { photoTarget = 'bg'; pickPhoto(); });
  on('pAsBg', 'click', () => photoToBg(L)); on('bgOut', 'click', () => bgToLayer());
  on('bgBack', 'click', () => { if (!doc.bgKeep || doc.bgKeep.type !== 'photo') return; doc.bg = clone(doc.bgKeep); dropBgKeep(); changed(true); paintPanel(); status('배경 사진으로 되돌렸어요'); });
  on('bgReplace', 'click', () => { photoTarget = 'bg'; pickPhoto(); });
  if (L && L.type === 'photo') bindPhotoEd(L); else if (!L && mode === 'photo' && doc.bg.type === 'photo') bindPhotoEd(doc.bg);
  if (L && (L.type === 'text' || L.type === 'stat')) bindFx(L);
  if (L && L.type === 'sticker') { for (const e of P.querySelectorAll('[data-df]')) { e.addEventListener('input', () => { L.f = { ...(L.f || {}), [e.dataset.df]: e.value }; changed(); }); e.addEventListener('change', () => commit()); }
    bindWx(L);
    on('dfIcon', 'click', e => { const b = e.target.closest('[data-v]'); if (!b) return; L.f = { ...(L.f || {}), icon: b.dataset.v }; changed(true); paintPanel(); });
    on('dfCol', 'click', e => { const b = e.target.closest('[data-olc]'); if (!b) return; L.f = { ...(L.f || {}), color: b.dataset.olc }; changed(true); paintPanel(); }); const cp = $('dfColPick'); if (cp) cp.addEventListener('input', e => { L.f = { ...(L.f || {}), color: e.target.value }; changed(); }); }
  on('wxIcons', 'click', e => { const b = e.target.closest('[data-wx]'); if (!b) return; L.t = b.dataset.wx + ' ' + String(L.t || '').replace(/^\S*\p{Extended_Pictographic}\S*\s*/u, ''); changed(true); paintPanel(); });
  on('fClose', 'click', () => { libOpen = false; paintPanel(); });
  on('fSearch', 'input', () => { $('fList').innerHTML = libHTML(L); });
  on('fCats', 'click', e => { const b = e.target.closest('[data-c]'); if (!b) return; fontCat = b.dataset.c; for (const x of $('fCats').children) x.setAttribute('aria-checked', String(x === b)); $('fList').innerHTML = libHTML(L); });
  on('eyedrop', 'click', () => { pickMode = true; status('캔버스에서 가져올 색을 탭해 주세요', 4000); });
  P.onclick = e => { const t = e.target.closest('button'); if (!t) return; const d = t.dataset;
    if (d.c && t.classList.contains('qc')) { setCol(d.c); if (mode === 'bg' && doc.bgKeep) paintPanel(); }
    if (d.tierc) { setCol('@tier'); if (mode === 'bg' && doc.bgKeep) paintPanel(); }
    if (d.moreCol) { const host = $('cpHost'); host.hidden = !host.hidden; t.setAttribute('aria-expanded', String(!host.hidden)); if (!host.hidden) { host.appendChild($('cpick')); $('cpick').hidden = false; hsvCol = ''; paintPicker(); } }
    if (d.flib) openFontSheet();
    if (d.fk !== undefined && t.closest('#panel')) pickFont(d.fk || null);
    if (d.star) { const f = favs(); LS('runtier:fontfav', f.includes(d.star) ? f.filter(x => x !== d.star) : [d.star, ...f]); $('fList').innerHTML = libHTML(L); }
    if (d.act) act(d.act);
    if (d.addstat) { if (d.addstat === 'top' && doc.layers.some(isTop)) { sel = doc.layers.find(isTop).id; mode = null; paintPanel(); paintOvl(); status('상위 %는 이미 있어요'); return; } addLayer(mk('stat', { stat: d.addstat, v: 0 })); }
    if (d.addcard) addLayer(mk('card', { v: +d.addcard, s: d.addcard === '0' ? .8 : 1 }));
    if (d.stkcat) { stkCat = d.stkcat; paintPanel(); return; }
    if (d.addstk) addLayer(mk('sticker', { k: d.addstk, col: '#ffffff' }));
    if (d.addin) { addLayer(mk('sticker', { k: d.addin, s: .6, f: { ...DATA_STK[d.addin].f }, x: 540, y: FH() * ({ data_weather: .3, data_course: .5, data_bib: .45, data_memo: .7 }[d.addin] || .5) })); setTimeout(() => { const ta = document.querySelector('#panel [data-df]'); if (ta) { ta.focus({ preventScroll: true }); ta.select(); } }, 50); }
    if (d.bg) { parkBgPhoto(); doc.bg = { type: d.bg }; changed(true); paintPanel(); }
    if (d.grad) { parkBgPhoto(); const g = JSON.parse(P.dataset.grads)[+d.grad]; doc.bg = { type: 'grad', c1: g[0], c2: g[1] }; changed(true); paintPanel(); }
    if (d.pick) { sel = d.pick; mode = null; paintPanel(); paintOvl(); }
    if (d.vis) { const l = getL(d.vis); l.hidden = !l.hidden; changed(true); paintPanel(); }
  };
  for (const r of P.querySelectorAll('input[type=range]')) r.addEventListener('change', () => commit());
  paintPicker();
}
// ---- save / share ----
const pxSig = cv => { const t = document.createElement('canvas'); t.width = 54; t.height = Math.round(54 * cv.height / cv.width); const g = t.getContext('2d'); g.drawImage(cv, 0, 0, t.width, t.height); const d = g.getImageData(0, 0, t.width, t.height).data; let a = []; for (let i = 0; i < d.length; i += 4) a.push((d[i] + d[i + 1] + d[i + 2]) / 3 | 0); return { w: cv.width, h: cv.height, a }; };
window.__exportSig = async () => pxSig(await finalCanvas()); window.__previewSig = () => pxSig($('tplPreview'));
async function finalCanvas() { commit(); const cv = await renderDoc(rctx, state.story, doc, photos); window.__lastStory = cv; return cv; }
$('save').addEventListener('click', async () => {
  const b = $('save'); if (b.disabled || !state.story) return; b.disabled = true; const lbl = b.textContent; b.textContent = '저장 중…';
  try { const cv = await finalCanvas(); const how = await saveStory(cv, doc.log ? `hoohaa-${doc.log.tpl}.png` : `hoohaa-${state.story.key}.png`); b.textContent = how === 'cancelled' ? lbl : '저장했어요'; }
  catch (e) { console.error(e); b.textContent = '다시 시도해 주세요'; }
  setTimeout(() => { b.textContent = lbl; b.disabled = false; }, 1400);
});
$('share').addEventListener('click', async () => {
  const b = $('share'); if (b.disabled || !state.story) return; b.disabled = true;
  try { const cv = await finalCanvas(); const blob = await new Promise(r => cv.toBlob(r, 'image/png')), file = new File([blob], doc.log ? `hoohaa-${doc.log.tpl}.png` : `hoohaa-${state.story.key}.png`, { type: 'image/png' });
    if (navigator.canShare && navigator.canShare({ files: [file] })) { try { await navigator.share({ files: [file] }); } catch (e) { if (e.name !== 'AbortError') throw e; } }
    else { const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = file.name; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); status('이 브라우저는 바로 공유를 지원하지 않아 이미지로 저장했어요', 3500); }
  } catch (e) { console.error(e); status('다시 시도해 주세요'); }
  b.disabled = false;
});
status(''); paintTop();

// ---- result screen (result.js): renderResult leaves the 공유 카드 mode through leaveLog and refills the template list ----
const { renderResult } = mountResult(env, { leaveLog: () => { if (doc && doc.log) { doc = null; sel = null; logCtx = null; document.body.classList.remove('log-mode'); } }, refreshTpl });
  // ================= entry path 2: 오늘 기록 → card (log data instead of tier data) =================
  let logCtx = null;
  const LOG_STORY = { key: 'iron', tierKo: '', word: '', roman: '', long: false, title: '', recLine: ' ', who: '', topLabel: '', headline: '', time: '', pace: '', vdot: '', nextLine: '' };
  async function logPhoto(id, blob) { const pid = 'log:' + id; if (!photos[pid] && blob) { const im = await blobToImg(blob), k = Math.min(1, 1600 / Math.max(im.width, im.height)), cv = document.createElement('canvas'); cv.width = Math.round(im.width * k); cv.height = Math.round(im.height * k); cv.getContext('2d').drawImage(im, 0, 0, cv.width, cv.height); photos[pid] = cv; } return photos[pid] ? pid : null; }
  // opts: { log, vals (bindValues), tpl, photo: {id, blob} | null, acc? }
  async function openLog(o) {
    $('resBody').innerHTML = ''; document.body.classList.add('log-mode');
    state.story = { ...LOG_STORY, time: o.vals.time || '', pace: o.vals.pace || '' };
    const pid = o.photo ? await logPhoto(o.photo.id, o.photo.blob) : null;
    logCtx = { log: o.log, vals: o.vals, pid };
    doc = buildLogDoc(o.tpl, o.vals, { pid: pid && LOG_TPLS.length ? pid : null, logId: o.log && o.log.id, type: o.log && o.log.type, acc: o.acc, fmt: 'thumb' });
    if (!pid) setLogBg(doc, null);
    sel = null; mode = null; syncTier(); hist = [JSON.stringify(doc)]; hi = 0; needClamp = false;
    changed(true); paintPanel(); thumbs(); return doc;
  }
  // picking another log refills only the still-bound elements of the current card
  function applyLogVals(vals, log) { if (!doc || !doc.log) return; logCtx = { ...(logCtx || {}), vals, log }; if (log) doc.log.id = log.id; fillBindings(doc, vals); changed(true); paintPanel(); }
  function setAccent(hex) { if (!doc || !doc.tok) return; doc.tok.acc = hex; changed(true); thumbs(); }
  function setLogBackground(photoOn) { if (!doc || !doc.log) return; setLogBg(doc, photoOn ? logCtx && logCtx.pid : null); changed(true); }
  async function logThumbs() {
    const mine = (LS('runtier:mytpl') || []).map((m, i) => ({ ...m, _i: i })).filter(m => m.log);
    $('tplList').innerHTML = LOG_TPLS.map(([k, n]) => `<button type="button" role="radio" class="tpl-btn" data-lt="${k}" aria-checked="${doc.log.tpl === k}"><canvas width="108" height="${Math.round(108 * FH() / 1080)}"></canvas><span class="tn">${n}</span></button>`).join('') +
      mine.map(m => `<span class="tpl-mine"><button type="button" role="radio" class="tpl-btn" data-m="${m._i}" aria-checked="false"><canvas width="108" height="${Math.round(108 * fmtH(m.fmt) / 1080)}"></canvas><span class="tn">${esc(m.n)}</span></button><button type="button" class="tpl-del" data-mdel="${m._i}" aria-label="${esc(m.n)} 삭제">✕</button></span>`).join('');
    const all = LS('runtier:mytpl') || [], f0 = doc.fmt || 'story';
    for (const b of $('tplList').querySelectorAll('.tpl-btn')) { let d2; if (b.dataset.lt) { d2 = buildLogDoc(b.dataset.lt, logCtx.vals, { pid: logCtx.pid, acc: doc.tok.acc }); if (f0 !== 'thumb') relayout(d2, f0); } else d2 = fillBindings(clone(all[+b.dataset.m]), logCtx.vals);
      const cv = await renderDoc(rctx, state.story, d2, photos); const t0 = b.querySelector('canvas'), t = t0.getContext('2d'); t.imageSmoothingQuality = 'high'; t.drawImage(cv, 0, 0, t0.width, t0.height); }
  }
  function pickLogTpl(b) { const f0 = doc.fmt || 'story', acc = b.dataset.lt && doc.tok && kindOf(doc.log.tpl) === kindOf(b.dataset.lt) ? doc.tok.acc : undefined;
    const kept = b.dataset.lt ? userLayers(doc) : [], keepBg = doc.bg.type === 'photo' && photos[doc.bg.pid] ? clone(doc.bg) : null;
    if (b.dataset.lt) { doc = buildLogDoc(b.dataset.lt, logCtx.vals, { pid: logCtx.pid, logId: doc.log.id, type: doc.log.type, acc }); if (f0 !== 'thumb') relayout(doc, f0); if (kept.length) doc.layers.push(...kept); }
    else { const m = clone((LS('runtier:mytpl') || [])[+b.dataset.m]); delete m.n; doc = fillBindings(m, logCtx.vals); doc.log = { ...doc.log, id: logCtx.log && logCtx.log.id }; }
    if (keepBg && !(doc.bg.type === 'photo' && photos[doc.bg.pid])) { setLogBg(doc, keepBg.pid); doc.bg = { ...doc.bg, ...keepBg }; }
    const bgSeg = document.getElementById('lbBg'); if (bgSeg) for (const x of bgSeg.querySelectorAll('[data-v]')) x.setAttribute('aria-checked', String((x.dataset.v === 'photo') === (doc.bg.type === 'photo')));
    sel = null; mode = 'tpl'; for (const x of $('tplList').querySelectorAll('.tpl-btn')) x.setAttribute('aria-checked', String(x === b)); changed(true); paintPanel(); }
  window.__logDoc = () => doc && doc.log ? clone(doc) : null;
  return { renderResult, openLog, applyLogVals, setAccent, setLogBackground, exportCanvas: finalCanvas };
}
