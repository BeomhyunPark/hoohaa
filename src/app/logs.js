// 공유 카드 만들기: run / race / diet records on this device (IndexedDB) → 3:4 thumbnail cards.
import * as db from '../storage/logdb.js';
import { bindValues, defaultTemplate, sortLogs, parseDur, fmtPace, paceSec, num, posKm, isoToday, startDateOf, dayN, TPL_IDS, normTplId } from '../engine/logcalc.js';

const TYPES = [['run', '러닝'], ['race', '대회'], ['diet', '식단']];
const TCOL = { run: '#B5C96A', race: '#E08A62', diet: '#6FB894' }, TICON = { run: '🏃', race: '🏅', diet: '🥗' };
const TNAME = Object.fromEntries(TYPES);
// 신발(gear) is parked until login: old gear logs/stores stay in IndexedDB and backups, but are hidden here
const SHOWN = l => l && Object.prototype.hasOwnProperty.call(TNAME, l.type);
const ACCENTS = [['#B5C96A', '러닝'], ['#E08A62', '대회'], ['#6FB894', '식단']];
const MEALS = ['아침', '점심', '저녁', '간식', '러닝 전', '러닝 후'];
const TPL_KO = { 'run-photo': '가로 · 사진', 'run-solid': '가로 · 단색', 'va-run-photo': '스택 · 사진', 'va-run-solid': '스택 · 단색', 'vc-run-photo': '페이드 · 사진', 'vc-run-solid': '페이드 · 단색', 'vd-run-solid': '레일 · 단색' };

export function mountLogs(env) {
  const { $, esc, show, openEditor } = env;
  const navBack = env.navBack || (() => show('scrInput'));
  const root = $('logRoot');
  let S = { profile: db.PROFILE0, logs: [], races: [] }, type = 'run', msg = '', editor = null, cur = null, busy = false;
  // per-tab drafts: typed values survive tab switches, re-paints and a reload (sessionStorage, this browser tab only).
  // A picked photo (File) can't go into sessionStorage: it survives tab switches, and after a reload we say it needs picking again.
  // d.edit = id of the record being edited, d.dropPhoto = the edit removes that record's photo.
  const drafts = { run: {}, race: {}, diet: {} }, draft = () => (drafts[type] || (drafts[type] = {}));
  const DKEY = 'hoohaa-log-draft';
  try {
    const sv = JSON.parse(sessionStorage.getItem(DKEY) || 'null');
    if (sv && typeof sv === 'object') {
      for (const k of Object.keys(drafts)) { const d = sv.drafts && sv.drafts[k]; if (d && typeof d === 'object') drafts[k] = { v: d.v && typeof d.v === 'object' ? d.v : undefined, edit: d.edit || null, dropPhoto: !!d.dropPhoto, lostPhoto: d.photo || '' }; }
      if (TNAME[sv.type]) type = sv.type;
    }
  } catch { /* storage blocked or bad JSON: start fresh */ }
  function persist() {
    const out = {}; for (const [k, d] of Object.entries(drafts)) out[k] = { v: d.v, edit: d.edit || null, dropPhoto: !!d.dropPhoto, photo: d.file ? (d.file.name || '사진') : (d.lostPhoto || '') };
    try { sessionStorage.setItem(DKEY, JSON.stringify({ type, drafts: out })); } catch { /* storage blocked: memory drafts still work */ }
  }
  let prevURL = '', photoTok = 0;
  const editLog = () => { const d = draft(); const l = d.edit && S.logs.find(x => x.id === d.edit); return l && l.type === type ? l : null; };
  function capture() {
    const form = $('lgForm'); if (!form || form.dataset.t !== type) return; const d = draft(); d.v = {};
    // untouched date/time defaults are not kept, so a form left open past midnight still opens on today
    form.querySelectorAll('input[id]:not([type=file]), select[id]').forEach(e => { if (!d.edit && /^(date|time)$/.test(e.type) && e.value === e.defaultValue) return; d.v[e.id] = { value: e.value, digits: e.dataset.digits || '' }; });
  }
  function restore() {
    const d = draft();
    if (d.v) for (const [id, o] of Object.entries(d.v)) { const e = $(id); if (!e) continue; e.value = o.value; if (o.digits) e.dataset.digits = o.digits; }
    paintPhoto();
  }
  function paintPhoto() {
    const box = $('lgPhotoPrev'), inp = $('lgPhoto'), d = draft(), f = d.file, tok = ++photoTok; if (!box) return;
    if (prevURL) { URL.revokeObjectURL(prevURL); prevURL = ''; }
    const old = editLog(), oldPid = old && !d.dropPhoto && old.photoIds && old.photoIds[0];
    if (!f && oldPid) {
      box.hidden = false; box.innerHTML = '<span>지금 사진을 그대로 써요</span><button type="button" class="chip-btn quiet" id="lgPhotoClr">사진 빼기</button>';
      $('lgPhotoClr').addEventListener('click', () => { d.dropPhoto = true; paintPhoto(); persist(); });
      db.get('photos', oldPid).then(r => { if (tok !== photoTok || !r || !r.blob) return; prevURL = URL.createObjectURL(r.blob); box.insertAdjacentHTML('afterbegin', `<img src="${prevURL}" alt="지금 사진">`); }).catch(() => {});
      return;
    }
    if (!f && d.lostPhoto) { box.hidden = false; box.innerHTML = `<span>새로고침하면서 고른 사진(${esc(d.lostPhoto)})이 빠졌어요 · 다시 골라 주세요</span>`; return; }
    if (!f) { box.hidden = true; box.innerHTML = ''; return; }
    if (inp && !(inp.files && inp.files[0])) { try { const dt = new DataTransfer(); dt.items.add(f); inp.files = dt.files; } catch { /* preview + draft still hold it */ } }
    prevURL = URL.createObjectURL(f);
    box.hidden = false; box.innerHTML = `<img src="${prevURL}" alt="고른 사진 미리보기"><span>${esc(f.name || '사진')}</span><button type="button" class="chip-btn quiet" id="lgPhotoClr">사진 빼기</button>`;
    $('lgPhotoClr').addEventListener('click', () => { d.file = null; if (old) d.dropPhoto = true; if (inp) inp.value = ''; paintPhoto(); persist(); });
  }
  const ctx = () => ({ profile: S.profile, logs: S.logs, races: S.races });
  const say = t => { msg = t; const m = $('lgMsg'); if (m) m.textContent = t; };
  async function reload() { try { const a = await db.loadAll(); S = { profile: a.profile, logs: (a.logs || []).filter(SHOWN), races: a.races || [] }; } catch (e) { console.error(e); say('이 브라우저에서는 기기 저장소(IndexedDB)를 쓸 수 없어요'); } }

  const field = (id, label, input, hint = '') => `<div class="field"><label class="lbl sm" for="${id}">${label}</label>${input}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  // 입력 묶음의 한 줄: 왼쪽 라벨 · 가운데 값 · 오른쪽 단위/보조 정보 (+ 아래 작은 안내)
  const row = (id, label, input, aux = '', hint = '') => `<div class="lg-r"><label class="lr-l" for="${id}">${label}</label>${input}${aux ? `<span class="lr-a">${aux}</span>` : ''}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const photoField = () => '<div class="lg-photo"><input id="lgPhoto" type="file" accept="image/*" class="vh"><label class="lg-drop" for="lgPhoto"><span class="ld-ic" aria-hidden="true">＋</span><span class="ld-tx"><b>사진 추가 (선택)</b><small>사진은 이 기기에만 저장돼요</small></span></label><div id="lgPhotoPrev" class="lg-prev" hidden></div></div>';
  const durInput = (id, ph) => `<input id="${id}" inputmode="numeric" autocomplete="off" placeholder="${ph}">`;
  function formHTML() {
    const today = isoToday(), dateF = row('lgDate', '날짜', `<input id="lgDate" type="date" value="${today}">`, '<span id="lgToday">오늘</span>');
    const card = (rows, after = '') => `<div class="lg-card">${rows}</div>${after}${photoField()}`;
    if (type === 'run') {
      return card(dateF + row('lgDist', '거리', '<input id="lgDist" inputmode="decimal" autocomplete="off" placeholder="5.20">', 'km')
        + row('lgTime', '시간', durInput('lgTime', '23:00'), '<b id="lgPace"></b>', '숫자만 입력하면 2300이 23:00이 돼요')
        + row('lgWx', '날씨', '<input id="lgWx" autocomplete="off" placeholder="12°C 맑음">', '<button type="button" class="lr-btn" id="lgWxGo">📍 불러오기</button>', '위치는 날씨 조회에 한 번만 쓰이고 저장되지 않아요 (Open-Meteo)')
        + row('lgNote', '메모', '<input id="lgNote" autocomplete="off" maxlength="40" placeholder="오늘 러닝 한 줄 남기기">'));
    }
    if (type === 'race') return card(dateF + row('lgName', '대회명', '<input id="lgName" autocomplete="off" placeholder="○○ 마라톤 10K">')
      + row('lgRDate', '대회 날짜', `<input id="lgRDate" type="date" value="${today}">`)
      + row('lgDist', '거리', '<input id="lgDist" inputmode="decimal" autocomplete="off" placeholder="10">', 'km')
      + row('lgGoal', '목표 기록', durInput('lgGoal', '50:00'), '', '숫자만 입력하면 5000이 50:00이 돼요')
      + row('lgRes', '결과 기록', durInput('lgRes', '대회 후 입력 (선택)')),
      '<p class="hint lg-note">결과 기록을 비우면 D-day 카드, 넣으면 결과 카드가 만들어져요</p>');
    const now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return card(dateF + row('lgMeal', '식사', `<input id="lgMeal" list="lgMeals" autocomplete="off" placeholder="러닝 전"><datalist id="lgMeals">${MEALS.map(m => `<option value="${m}">`).join('')}</datalist>`)
      + row('lgMenu', '메뉴', '<input id="lgMenu" autocomplete="off" maxlength="30" placeholder="오트밀과 커피">')
      + row('lgClock', '시간', `<input id="lgClock" type="time" value="${hm}">`)
      + row('lgDist', '이후 러닝', '<input id="lgDist" inputmode="decimal" autocomplete="off" placeholder="같은 날 러닝">', 'km')
      + row('lgNote', '메모', '<input id="lgNote" autocomplete="off" maxlength="20" placeholder="가볍게 (선택)">'));
  }
  function summary(l) {
    const v = bindValues(l, ctx());
    if (l.type === 'run') return [v.dayN, v.distance && v.distance + 'km', v.time, v.pace && v.pace + '/km'].filter(Boolean).join(' · ');
    if (l.type === 'race') return [v.raceName, v.result ? '결과 ' + v.result : v.dday].filter(Boolean).join(' · ');
    return [v.meal, v.menu].filter(Boolean).join(' · ');
  }
  // 최근 기록 미리보기 카드의 큰 글자 · 작은 글자
  function face(l) {
    const v = bindValues(l, ctx()), md = (l.date || '').slice(5).replace('-', '.');
    if (l.type === 'run') return [v.dayN || (v.distance ? v.distance + 'km' : md), v.dayN ? [v.distance && v.distance + 'km', v.time].filter(Boolean).join(' · ') : v.time || ''];
    if (l.type === 'race') return [v.result || v.dday || md, v.raceName];
    return [v.meal || '식단', v.menu];
  }
  function listHTML() {
    const L = sortLogs(S.logs);
    if (!L.length) return '<p class="hint">아직 기록이 없어요. 위에서 첫 기록을 남겨 보세요.</p>';
    return `<ol class="lg-cards">${L.map(l => { const [big, sub] = face(l), dt = esc((l.date || '').replaceAll('-', '.'));
      return `<li style="--c:${TCOL[l.type]}"><button type="button" class="lc-card" data-card="${esc(l.id)}" aria-label="${dt} ${TNAME[l.type]} 카드 열기 · ${esc(summary(l))}"><span class="lc-d">${esc((l.date || '').slice(5).replace('-', '.'))} · ${TNAME[l.type]}</span><b>${esc(big)}</b><small>${esc(sub)}</small></button>`
        + `<span class="lc-acts"><button type="button" class="chip-btn quiet" data-edit="${esc(l.id)}" aria-label="${dt} 기록 수정">수정</button><button type="button" class="chip-btn quiet" data-del="${esc(l.id)}" aria-label="${dt} 기록 삭제">삭제</button></span></li>`; }).join('')}</ol>`;
  }
  function settingsHTML() {
    const p = S.profile, sd = startDateOf(p, S.logs), n = sd ? dayN(isoToday(), sd) : null;
    const dayHint = n ? `오늘은 Day ${n}` : sd ? '아직 시작일 전이에요 · 시작일이 Day 1이에요' : '시작일을 정하면 러닝 카드에 Day N이 자동으로 들어가요';
    return `<details class="card lg-set" id="lgSet"><summary>설정 · 백업</summary>
      ${field('lgStartDate', '시작일 (Day 1)', `<input id="lgStartDate" type="date" value="${esc(p.startDate || '')}">`, dayHint)}
      <div class="field"><span class="lbl sm" id="lgModeL">Day 계산 기준</span><div class="seg n2" id="lgMode" role="radiogroup" aria-labelledby="lgModeL"><button type="button" role="radio" data-v="custom" aria-checked="${p.dayCountMode !== 'first-log'}">직접 정한 시작일</button><button type="button" role="radio" data-v="first-log" aria-checked="${p.dayCountMode === 'first-log'}">첫 러닝 기록일</button></div></div>
      ${field('lgHandle', '핸들', `<input id="lgHandle" autocomplete="off" maxlength="30" placeholder="@my_runs" value="${esc(p.handle || '')}">`)}
      ${field('lgDefTpl', '러닝 기본 템플릿', `<select id="lgDefTpl"><option value="">사진 있으면 사진, 없으면 단색</option>${Object.keys(TPL_KO).map(t => `<option value="${t}"${normTplId(p.defaultTemplateId) === t ? ' selected' : ''}>${TPL_KO[t]}</option>`).join('')}</select>`)}
      <div class="field"><span class="lbl sm">백업</span><div class="ed-btns"><button type="button" class="chip-btn" id="lgExport">백업 내보내기 (zip)</button><button type="button" class="chip-btn" id="lgImportB">백업 가져오기</button></div><input id="lgImport" type="file" accept=".zip,application/zip" class="vh" tabindex="-1" aria-hidden="true"><p class="hint">기록과 사진이 zip 파일 하나에 담겨요. 서버에는 아무것도 올라가지 않아요.</p></div>
    </details>`;
  }
  function paint() {
    capture();
    root.innerHTML = `<header class="top lg-top"><button type="button" class="icon-btn" id="lgBack" aria-label="뒤로"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 id="hLog">공유 카드 만들기</h1></header>
      <div class="lg-types" id="lgType" role="radiogroup" aria-label="기록 종류">${TYPES.map(([k, n]) => `<button type="button" role="radio" data-v="${k}" aria-checked="${k === type}" style="--c:${TCOL[k]}"><span class="lt-c" aria-hidden="true">${TICON[k]}</span><span class="lt-n">${n}</span></button>`).join('')}</div>
      <form id="lgForm" data-t="${type}" class="lg-form" autocomplete="off">${editBanner()}${formHTML()}<p class="err" id="lgMsg" role="status" aria-live="polite">${esc(msg)}</p><div class="actions"><button type="submit" class="btn primary" id="lgSave">${editLog() ? '고치고 카드 만들기' : '저장하고 카드 만들기'}</button></div></form>
      <section class="lg-recent" aria-labelledby="hLgList"><div class="lgr-head"><h2 id="hLgList">최근 기록</h2><button type="button" class="lgr-set" id="lgSetGo" aria-controls="lgSet">설정 · 백업</button></div>${listHTML()}</section>
      ${settingsHTML()}`;
    bind(); restore(); livePace(); paintToday(); persist();
  }
  function editBanner() { const l = editLog(); return l ? `<p class="hint lg-editing">${esc((l.date || '').replaceAll('-', '.'))} ${TNAME[l.type]} 기록을 고치는 중이에요 <button type="button" class="chip-btn quiet" id="lgEditX">새 기록으로</button></p>` : ''; }
  // load a stored record into its tab's form; saving then updates the same record (id, createdAt, photo kept)
  function startEdit(l) {
    capture(); type = l.type; const d = l.data || {}, V = {};
    const set = (id, v, dur) => { V[id] = { value: v == null ? '' : String(v), digits: dur ? String(v || '').replace(/\D/g, '') : '' }; };
    set('lgDate', l.date);
    if (l.type === 'run') { set('lgDist', d.distance); set('lgTime', d.time, 1); set('lgWx', d.weather); set('lgNote', d.note); }
    else if (l.type === 'race') { const r = (d.raceId && S.races.find(x => x.id === d.raceId)) || d; set('lgName', r.name ?? d.name); set('lgRDate', r.date ?? d.date); set('lgDist', r.distance ?? d.distance); set('lgGoal', r.goal ?? d.goal, 1); set('lgRes', r.result ?? d.result, 1); }
    else { set('lgMeal', d.meal); set('lgMenu', d.menu); set('lgClock', d.time); set('lgDist', d.distance); set('lgNote', d.note); }
    drafts[type] = { v: V, edit: l.id }; msg = '';
    const form = $('lgForm'); if (form) form.remove(); paint();
    const f = $('lgForm'); if (f && f.scrollIntoView) f.scrollIntoView({ block: 'start', behavior: 'smooth' });
  }
  const val = id => { const e = $(id); return e ? e.value.trim() : ''; };
  function livePace() { const o = $('lgPace'); if (!o) return; const p = fmtPace(paceSec(num(val('lgDist')), parseDur(val('lgTime')))); o.textContent = p ? p + ' /km' : ''; }
  function paintToday() { const t = $('lgToday'); if (t) t.hidden = val('lgDate') !== isoToday(); }
  // same digit entry as the home record field: 2300 → 23:00, 10203 → 1:02:03
  function digitsToDisplay(d) { d = d.replace(/^0+(?=\d)/, ''); if (d.length <= 2) return d; if (d.length <= 4) return `${d.slice(0, -2)}:${d.slice(-2)}`; return `${d.slice(0, -4)}:${d.slice(-4, -2)}:${d.slice(-2)}`; }
  function bindDur(id) { const el = $(id); if (!el) return; el.addEventListener('input', e => { let d = e.target.value.replace(/\D/g, ''); const prev = e.target.dataset.digits || ''; if (e.inputType === 'deleteContentBackward' && d === prev) d = d.slice(0, -1); d = d.slice(0, 6); e.target.dataset.digits = d; e.target.value = digitsToDisplay(d); if (id === 'lgTime') livePace(); }); }
  function bind() {
    const on = (id, ev, f) => { const e = $(id); if (e) e.addEventListener(ev, f); };
    on('lgBack', 'click', () => navBack());
    on('lgType', 'click', e => { const b = e.target.closest('[data-v]'); if (!b) return; capture(); type = b.dataset.v; msg = ''; paint(); });
    on('lgForm', 'input', () => { capture(); persist(); }); on('lgForm', 'change', () => { capture(); persist(); });
    on('lgEditX', 'click', () => { drafts[type] = {}; msg = ''; $('lgForm').remove(); paint(); });
    on('lgDist', 'input', livePace); on('lgDate', 'input', paintToday); on('lgDate', 'change', paintToday);
    on('lgSetGo', 'click', () => { const d = $('lgSet'); if (!d) return; d.open = true; d.scrollIntoView({ block: 'start', behavior: 'smooth' }); });
    on('lgType', 'keydown', e => { const bs = [...root.querySelectorAll('#lgType [data-v]')], i = bs.indexOf(document.activeElement), n = { ArrowRight: i + 1, ArrowLeft: i - 1 }[e.key]; if (i < 0 || n == null) return; e.preventDefault(); bs[(n + bs.length) % bs.length].click(); const f = root.querySelector(`#lgType [data-v="${type}"]`); if (f) f.focus(); });
    on('lgPhoto', 'change', e => { const f = e.target.files && e.target.files[0], d = draft(); d.file = f || null; d.lostPhoto = ''; paintPhoto(); persist(); }); bindDur('lgTime'); bindDur('lgGoal'); bindDur('lgRes');
    on('lgWxGo', 'click', async () => {
      say('날씨를 불러오는 중…');
      try { const { wxHere, fetchWeather } = await import('../net/weather.js'); const p = await wxHere(); const r = await fetchWeather(p.lat, p.lon, val('lgDate') || isoToday(), new Date().getHours()); $('lgWx').value = `${r.temp} ${r.label}`; say(''); }
      catch (e) { say(e && e.code === 1 ? '위치 권한이 없어요 · 날씨를 직접 입력해 주세요' : '날씨를 불러오지 못했어요 · 직접 입력해 주세요'); }
    });
    // one save at a time: a double tap must not store the record twice
    on('lgForm', 'submit', async e => {
      e.preventDefault(); if (busy) return; busy = true; const btn = $('lgSave'); if (btn) btn.disabled = true;
      try { const log = await saveForm(); if (log) await openCard(log); }
      catch (err) { console.error(err); say('카드를 열지 못했어요. 기록은 저장됐으니 목록에서 다시 열어 주세요'); }
      finally { busy = false; const b = $('lgSave'); if (b) b.disabled = false; }
    });
    root.querySelectorAll('[data-edit]').forEach(b => b.addEventListener('click', () => { const l = S.logs.find(x => x.id === b.dataset.edit); if (l) startEdit(l); }));
    root.querySelectorAll('[data-card]').forEach(b => b.addEventListener('click', () => { const l = S.logs.find(x => x.id === b.dataset.card); if (l) openCard(l); }));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { const l = S.logs.find(x => x.id === b.dataset.del); if (!l || !confirm('이 기록을 지울까요? 사진도 함께 지워져요.')) return;
      try { await db.deleteLog(l); } catch (e) { console.error(e); alert('기록을 지우지 못했어요. 다시 시도해 주세요'); return; }
      for (const d of Object.values(drafts)) if (d.edit === l.id) { d.edit = null; d.dropPhoto = false; }
      capture(); await reload(); paint(); }));
    const prof = async patch => { S.profile = { ...S.profile, ...patch }; await db.saveProfile(S.profile); await reload(); paint(); };
    on('lgStartDate', 'change', e => prof({ startDate: e.target.value }));
    on('lgMode', 'click', e => { const b = e.target.closest('[data-v]'); if (b) prof({ dayCountMode: b.dataset.v }); });
    on('lgHandle', 'change', e => prof({ handle: e.target.value.trim() }));
    on('lgDefTpl', 'change', e => prof({ defaultTemplateId: e.target.value }));
    on('lgExport', 'click', async () => { try { const blob = await db.exportZip(), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hoohaa-records-${isoToday().replaceAll('-', '')}.zip`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); } catch (e) { console.error(e); alert('백업을 만들지 못했어요'); } });
    on('lgImportB', 'click', () => $('lgImport').click());
    on('lgImport', 'change', async e => {
      const f = e.target.files && e.target.files[0]; e.target.value = ''; if (!f) return; // same file can be picked again
      try { const n = await db.importZip(f); await reload(); paint(); const shown = Object.keys(TNAME).reduce((a, k) => a + (n.types[k] || 0), 0); alert(`가져왔어요 · 기록 ${shown}개, 사진 ${n.photos}장` + (n.missingPhotos ? ` · 사진 ${n.missingPhotos}장은 zip에 없어서 건너뛰었어요` : '')); }
      catch (err) { console.error(err); alert(err && err.name === 'BackupError' ? err.message : '가져오지 못했어요. 다시 시도해 주세요'); }
    });
  }
  async function saveForm() {
    const d0 = draft(), old = editLog(), date = val('lgDate') || isoToday(), f = ($('lgPhoto') && $('lgPhoto').files[0]) || d0.file;
    const km = posKm(val('lgDist'));
    if (val('lgDist') && km == null) { say('거리는 5.2처럼 0보다 큰 숫자로 입력해 주세요'); return null; }
    let data, race = null;
    if (type === 'run') {
      const sec = parseDur(val('lgTime'));
      if (km == null && !val('lgTime')) { say('거리나 시간을 입력해 주세요'); return null; }
      if (val('lgTime') && !sec) { say('시간은 29:38 또는 1:02:03처럼 입력해 주세요'); return null; }
      data = { distance: km != null ? String(km) : '', time: val('lgTime'), pace: fmtPace(paceSec(km, sec)), weather: val('lgWx'), note: val('lgNote') };
    } else if (type === 'race') {
      if (!val('lgName')) { say('대회명을 입력해 주세요'); return null; }
      for (const id of ['lgGoal', 'lgRes']) if (val(id) && !parseDur(val(id))) { say('기록은 50:00 또는 1:52:14처럼 입력해 주세요'); return null; }
      const rid = (old && old.data && old.data.raceId) || db.uid('race');
      race = { id: rid, name: val('lgName'), date: val('lgRDate') || date, distance: km != null ? String(km) : '', goal: val('lgGoal'), result: val('lgRes') };
      data = { raceId: race.id, name: race.name, date: race.date, distance: race.distance, goal: race.goal, result: race.result };
    } else {
      if (!val('lgMeal') && !val('lgMenu')) { say('식사나 메뉴를 입력해 주세요'); return null; }
      data = { meal: val('lgMeal'), menu: val('lgMenu'), time: val('lgClock'), note: val('lgNote') }; if (km != null) data.distance = String(km);
    }
    // photo: a new pick replaces the old one, "사진 빼기" on an edit removes it, otherwise the edit keeps it
    let photo = null, photoIds = old ? [...(old.photoIds || [])] : [], drop = [];
    if (f) { photo = { id: db.uid('ph'), blob: f }; drop = photoIds; photoIds = [photo.id]; }
    else if (old && d0.dropPhoto) { drop = photoIds; photoIds = []; }
    const log = old ? { ...old, date, data, photoIds } : { id: db.uid('log'), type, date, dayN: null, data, photoIds, templateId: '', createdAt: Date.now() };
    await reload(); const sd = startDateOf(S.profile, [...S.logs.filter(l => l.id !== log.id), log]); log.dayN = sd ? dayN(date, sd) : null;
    // a template the user never changed follows the photo; one they picked stays
    if (!old || !old.templateId || old.templateId === defaultTemplate(old, S.profile)) log.templateId = defaultTemplate(log, S.profile);
    try { await db.saveLog({ log, race, photo, dropPhotoIds: drop }); }
    catch (e) { console.error(e); say(e && e.name === 'QuotaExceededError' ? '기기 저장 공간이 부족해서 저장하지 못했어요' : '저장하지 못했어요. 다시 시도해 주세요'); return null; }
    await reload(); msg = ''; drafts[type] = {}; $('lgForm').remove(); paint(); return log;
  }
  // reopening a record always regenerates its card from the stored data
  async function openCard(log) {
    await reload();
    const vals = bindValues(log, ctx()), tpl = TPL_IDS.includes(normTplId(log.templateId)) ? normTplId(log.templateId) : defaultTemplate(log, S.profile);
    const pidRec = log.photoIds && log.photoIds[0] ? await db.get('photos', log.photoIds[0]) : null;
    editor = await openEditor(); cur = log;
    const d = await editor.openLog({ log, vals, tpl, photo: pidRec ? { id: pidRec.id, blob: pidRec.blob } : null });
    paintBar(!!pidRec, d && d.bg.type === 'photo'); show('scrResult');
  }
  function paintBar(hasPhoto, photoOn) {
    const bar = $('logBar'); bar.hidden = false; const L = sortLogs(S.logs);
    bar.innerHTML = `<div class="field"><label class="lbl sm" for="lbPick">기록 고르기</label><select id="lbPick">${L.map(l => `<option value="${esc(l.id)}"${cur && l.id === cur.id ? ' selected' : ''}>${esc((l.date || '').replaceAll('-', '.'))} · ${TNAME[l.type]} · ${esc(summary(l))}</option>`).join('')}</select><p class="hint">연결된 칸만 바뀌어요. 직접 고친 글자는 그대로 둬요.</p></div>
      <div class="field"><span class="lbl sm" id="lbAccL">포인트 색</span><div class="lb-acc" role="radiogroup" aria-labelledby="lbAccL">${ACCENTS.map(([c, n]) => `<button type="button" role="radio" data-acc="${c}" style="--c:${c}" aria-label="${n} ${c}"></button>`).join('')}<input type="color" id="lbAccC" aria-label="직접 고르기" value="#B5C96A"></div></div>
      ${hasPhoto ? `<div class="field"><span class="lbl sm" id="lbBgL">배경</span><div class="seg n2" id="lbBg" role="radiogroup" aria-labelledby="lbBgL"><button type="button" role="radio" data-v="photo" aria-checked="${!!photoOn}">사진</button><button type="button" role="radio" data-v="solid" aria-checked="${!photoOn}">단색</button></div></div>` : ''}`;
    $('lbPick').addEventListener('change', e => { const l = S.logs.find(x => x.id === e.target.value); if (!l) return; cur = l; editor.applyLogVals(bindValues(l, ctx()), l); });
    bar.querySelector('.lb-acc').addEventListener('click', e => { const b = e.target.closest('[data-acc]'); if (b) editor.setAccent(b.dataset.acc); });
    $('lbAccC').addEventListener('input', e => editor.setAccent(e.target.value));
    const bg = $('lbBg'); if (bg) bg.addEventListener('click', e => { const b = e.target.closest('[data-v]'); if (!b) return; for (const x of bg.querySelectorAll('[data-v]')) x.setAttribute('aria-checked', String(x === b)); editor.setLogBackground(b.dataset.v === 'photo'); });
  }
  return { async open() { await reload(); paint(); show('scrLog'); }, openCard, reload, get state() { return S; } };
}
