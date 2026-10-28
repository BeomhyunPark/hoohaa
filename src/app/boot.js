import { calculate } from '../engine/tier.js';
import { LS, wipeDevice } from '../storage/device.js';

function enableCardCss() {
  let l = document.getElementById('cardCss');
  if (l && l.media === 'all') return Promise.resolve();
  return new Promise((res) => {
    let settled = false;
    const done = () => { if (!settled) { settled = true; res(); } };
    if (!l) {
      l = document.createElement('link');
      l.id = 'cardCss';
      l.rel = 'stylesheet';
      l.href = '/src/styles/card.css';
      l.media = 'all';
      l.addEventListener('load', done, { once: true });
      l.addEventListener('error', done, { once: true });
      document.head.appendChild(l);
    } else {
      l.addEventListener('load', done, { once: true });
      l.addEventListener('error', done, { once: true });
      l.media = 'all';
      if (l.sheet) done();
    }
    setTimeout(done, 4000);
  });
}

const $ = id => document.getElementById(id);
const esc = s => String(s).replace(/[&<>"]/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' })[c]);
const p2 = n => String(n).padStart(2, '0');
const HMAX = 29;
const PH = { '5K': '25:00', '10K': '55:00', half: '2:00:00', full: '4:30:00', custom: '1:15:00' };
const EVN = { '5K': '5K', '10K': '10K', half: '하프', full: '풀' };
const state = { ev: '5K', sex: '', last: null, tpl: 'card', tplPicked: false };

// ---------- time field: one numeric input, live auto-format ----------
function digitsToDisplay(d) {
  d = d.replace(/^0+(?=\d)/, '');
  if (d.length <= 2) return d;
  if (d.length <= 4) return `${d.slice(0, -2)}:${d.slice(-2)}`;
  return `${d.slice(0, -4)}:${d.slice(-4, -2)}:${d.slice(-2)}`;
}
function parseTimeDigits(d) { // -> {sec} | {error} | null
  d = d.replace(/^0+(?=\d)/, '');
  if (!d || +d === 0) return null;
  if (d.length > 6) return { error: '기록을 다시 확인해 주세요.' };
  const s = +d.slice(-2), m = +(d.slice(-4, -2) || 0), h = +(d.slice(0, -4) || 0);
  if (s > 59 || m > 59 || h > HMAX) return { error: `분·초는 59까지, 시간은 ${HMAX}까지 입력할 수 있어요.` };
  return { sec: h * 3600 + m * 60 + s, h, m, s };
}
let prevDigits = '';
$('tq').addEventListener('input', e => {
  let d = e.target.value.replace(/\D/g, '');
  if (e.inputType === 'deleteContentBackward' && d === prevDigits) d = d.slice(0, -1); // backspace over ':'
  d = d.slice(0, 7); prevDigits = d;
  e.target.value = digitsToDisplay(d);
  validate();
});
$('tq').addEventListener('blur', () => { const t = parseTimeDigits(prevDigits); if (t && !t.error) $('tq').value = `${t.h}:${p2(t.m)}:${p2(t.s)}`; });
$('by').addEventListener('input', e => { e.target.value = e.target.value.replace(/\D/g, '').slice(0, 4); validate(); });
$('km').addEventListener('input', e => { e.target.value = e.target.value.replace(/[^\d.]/g, ''); validate(); });

// ---------- chips ----------
function setChip(groupId, v) {
  for (const b of $(groupId).querySelectorAll('button')) b.setAttribute('aria-checked', String(b.dataset.v === v));
}
$('evChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.ev = b.dataset.v; applyEv(); validate(); });
$('sexChips').addEventListener('click', e => { const b = e.target.closest('button'); if (!b) return; state.sex = b.dataset.v; setChip('sexChips', state.sex); validate(); });
function applyEv() { setChip('evChips', state.ev); $('kmWrap').hidden = state.ev !== 'custom'; $('tq').placeholder = PH[state.ev]; }
// radiogroup arrow keys
for (const g of ['evChips', 'sexChips']) $(g).addEventListener('keydown', e => {
  if (!['ArrowLeft', 'ArrowRight'].includes(e.key)) return;
  const bs = [...$(g).querySelectorAll('button')], i = bs.indexOf(document.activeElement);
  const n = bs[(i + (e.key === 'ArrowRight' ? 1 : bs.length - 1)) % bs.length]; n.focus(); n.click();
});

// ---------- validation / persistence ----------
function readInput() {
  const t = parseTimeDigits(prevDigits), by = $('by').value, km = $('km').value;
  return { t, by, km };
}
function validate() {
  const { t, by, km } = readInput();
  $('tqHint').textContent = t && t.error ? t.error : '숫자만 입력하면 자동으로 변환돼요 · 2327 → 0:23:27';
  $('tqHint').classList.toggle('bad', !!(t && t.error));
  $('tq').setAttribute('aria-invalid', String(!!(t && t.error)));
  const kmOk = state.ev !== 'custom' || (+km > 0);
  const ok = !!(t && !t.error) && state.sex && /^\d{4}$/.test(by) && kmOk;
  $('go').disabled = !ok; $('err').textContent = '';
  if (!prevDigits && !state.sex && !by && !km) LS('runtier:last', null);
  else LS('runtier:last', { ev: state.ev, km, digits: prevDigits, sex: state.sex, by });
  return ok;
}
function restore() {
  const s = LS('runtier:last');
  if (s) {
    state.ev = PH[s.ev] ? s.ev : '5K'; state.sex = s.sex || ''; $('km').value = s.km || ''; $('by').value = s.by || '';
    prevDigits = s.digits || ''; $('tq').value = digitsToDisplay(prevDigits);
    const t = parseTimeDigits(prevDigits); if (t && !t.error) $('tq').value = `${t.h}:${p2(t.m)}:${p2(t.s)}`;
  }
  applyEv(); setChip('sexChips', state.sex); validate();
}

// ---------- screens ----------
// Home stays the base history entry. The log form pushes one entry, and the card editor
// opened from that form pushes another, so Safari back returns to the form. Other moves
// replace the current entry. /log/ keeps a refresh on the log form; /result/ recomputes from saved inputs.
const SITE = /^\/((log|result)\/?)?$/;
function applyScreen(name) {
  for (const [scr, bar] of [['scrInput', 'barInput'], ['scrResult', 'barResult'], ['scrLog', null]]) { if ($(scr)) $(scr).hidden = scr !== name; if (bar && $(bar)) $(bar).hidden = scr !== name; }
  if (name === 'scrInput') document.body.classList.remove('log-mode');
  window.scrollTo(0, 0);
}
function screenUrl(name) {
  const u = new URL(location.href);
  const onLog = name === 'scrLog' || (name === 'scrResult' && document.body.classList.contains('log-mode'));
  // readable paths on the site: / (home), /result/ (티어 결과), /log/ (오늘 기록). /app/ (PWA) keeps its own path.
  u.searchParams.delete('log');
  if (SITE.test(u.pathname)) u.pathname = onLog ? '/log/' : name === 'scrResult' ? '/result/' : '/';
  return u.pathname + u.search;
}
function show(name) {
  applyScreen(name);
  const url = screenUrl(name);
  try {
    const cur = history.state && history.state.scr;
    if (name === 'scrInput') { if (cur || location.pathname + location.search !== url) history.replaceState(null, '', url); }
    else if (cur === 'scrLog' && name === 'scrResult') history.pushState({ scr: name }, '', url);
    else if (cur) history.replaceState({ scr: name }, '', url);
    else history.pushState({ scr: name }, '', url);
  } catch (e) {}
}
// home: input screen at the top; saved inputs (localStorage) stay filled in. No focus (avoids opening the phone keyboard).
function goHome() { show('scrInput'); }
// in-app back (다시하기, ←) behaves like hardware/browser back
function navBack() { if (history.state && history.state.scr) history.back(); else goHome(); }
window.addEventListener('popstate', (e) => { const scr = e.state && e.state.scr; applyScreen(scr === 'scrLog' || scr === 'scrResult' ? scr : 'scrInput'); });
const MSG = { birthdate: '출생연도를 4자리로 입력해 주세요.', age_range: '10~100세까지 계산할 수 있어요. 출생연도를 확인해 주세요.', sex: '성별을 선택해 주세요.',
  distance_nonpositive: '거리(km)를 입력해 주세요.', distance_range: '거리는 1.5~100km 사이로 입력해 주세요.', time_nonpositive: '기록을 입력해 주세요.',
  faster_than_wr: '세계기록보다 빠른 기록이에요. 기록과 종목을 확인해 주세요.' };

let editorP = null;
function ensureEditor() {
  editorP ||= import('../editor/editor.js').then((m) => m.mountEditor({ $, esc, state, EVN }));
  return editorP;
}

$('go').addEventListener('click', async () => {
  if (!validate()) return;
  const { t, by, km } = readInput();
  const r = calculate({ birthYear: by, sex: state.sex, event: state.ev, distanceKm: state.ev === 'custom' ? km : null, time: t.sec });
  if (!r.ok) { $('err').textContent = r.errors.map(x => MSG[x.code] || x.message).join(' '); return; }
  const go = $('go');
  go.disabled = true;
  go.textContent = '계산 중…';
  let failed = false;
  try {
    await Promise.all([enableCardCss(), ensureEditor()]);
    const { renderResult } = await ensureEditor();
    if ($('logBar')) $('logBar').hidden = true; // optional: every page that loads boot.js must keep working without it
    state.last = r;
    renderResult(r);
    show('scrResult');
  } catch (e) {
    failed = true;
    console.error(e);
    $('err').textContent = '결과를 불러오지 못했어요. 다시 시도해 주세요.';
  } finally {
    go.textContent = '내 티어 보기';
    if (failed) go.disabled = false;
    else validate();
  }
});
$('again').addEventListener('click', () => { if (document.body.classList.contains('log-mode') && history.state && history.state.scr === 'scrResult') { history.back(); return; } if (document.body.classList.contains('log-mode')) { openLogs(); return; } navBack(); });

// ---------- 오늘 훈련일지 (second entry path into the same editor: log data instead of tier data) ----------
let logsP = null;
const logs = () => logsP ||= import('./logs.js').then(m => m.mountLogs({ $, esc, show, navBack, openEditor: async () => { await Promise.all([enableCardCss(), ensureEditor()]); return ensureEditor(); } }));
async function openLogs() { try { (await logs()).open(); } catch (e) { console.error(e); $('err').textContent = '기록 화면을 열지 못했어요. 다시 시도해 주세요.'; } }
if ($('logGo')) $('logGo').addEventListener('click', (e) => { e.preventDefault(); openLogs(); });
const wantLog = new URLSearchParams(location.search).has('log') || /^\/log\/?$/.test(location.pathname);
const wantResult = /^\/result\/?$/.test(location.pathname);
// /log/, /result/ and old ?log=1 links: keep home (/) as the base entry (old ?log=1 is dropped silently), then open the screen
if ((wantLog || wantResult) && SITE.test(location.pathname)) { try { const u = new URL(location.href); u.searchParams.delete('log'); history.replaceState(null, '', '/' + u.search); } catch (e) {} }
else if (wantLog) { try { const u = new URL(location.href); u.searchParams.delete('log'); history.replaceState(null, '', u.pathname + u.search); } catch (e) {} }
// stale history entry after reload / deep link: state.last is gone, so stay home.
if (history.state && history.state.scr && !state.last && !wantLog && !wantResult) { try { history.replaceState(null, '', location.pathname + location.search); } catch (e) {} }
if (wantLog) openLogs();
restore();
// /result/ opened directly: recompute from the inputs saved on this device; nothing saved → stay on home input
if (wantResult && !wantLog && validate()) $('go').click();
// landing-page deep link: ?ev=5k|10k|half|full preselects the event
{ const q = { '5k': '5K', '10k': '10K', half: 'half', full: 'full' }[(new URLSearchParams(location.search).get('ev') || '').toLowerCase()]; if (q) { state.ev = q; applyEv(); validate(); } }

const wipeBtn = document.getElementById('wipe');
if (wipeBtn) wipeBtn.addEventListener('click', () => wipeDevice());

if ('serviceWorker' in navigator && location.protocol.startsWith('http') && (location.pathname === '/app' || location.pathname.startsWith('/app/'))) {
  navigator.serviceWorker.register('/sw.js').catch(() => {});
}
