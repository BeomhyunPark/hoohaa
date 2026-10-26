// 오늘 기록 남기기: run / race / diet records on this device (IndexedDB) → 3:4 thumbnail cards.
import * as db from '../storage/logdb.js';
import { bindValues, defaultTemplate, sortLogs, parseDur, fmtPace, paceSec, num, isoToday, startDateOf, dayN, TPL_IDS, normTplId } from '../engine/logcalc.js';

const TYPES = [['run', '러닝'], ['race', '대회'], ['diet', '식단']];
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
  let S = { profile: db.PROFILE0, logs: [], races: [] }, type = 'run', msg = '', editor = null, cur = null;
  const ctx = () => ({ profile: S.profile, logs: S.logs, races: S.races });
  const say = t => { msg = t; const m = $('lgMsg'); if (m) m.textContent = t; };
  async function reload() { try { const a = await db.loadAll(); S = { profile: a.profile, logs: (a.logs || []).filter(SHOWN), races: a.races || [] }; } catch (e) { console.error(e); say('이 브라우저에서는 기기 저장소(IndexedDB)를 쓸 수 없어요'); } }

  const field = (id, label, input, hint = '') => `<div class="field"><label class="lbl sm" for="${id}">${label}</label>${input}${hint ? `<p class="hint">${hint}</p>` : ''}</div>`;
  const photoField = () => field('lgPhoto', '사진 (선택)', '<input id="lgPhoto" type="file" accept="image/*">', '사진은 이 기기에만 저장되고 서버로 보내지 않아요');
  const durInput = (id, ph) => `<input id="${id}" inputmode="numeric" autocomplete="off" placeholder="${ph}">`;
  function formHTML() {
    const today = isoToday(), dateF = field('lgDate', '날짜', `<input id="lgDate" type="date" value="${today}">`);
    if (type === 'run') {
      return dateF + `<div class="lg-row">${field('lgDist', '거리', '<div class="suffix"><input id="lgDist" inputmode="decimal" autocomplete="off" placeholder="5.20"><span>km</span></div>')}${field('lgTime', '시간', durInput('lgTime', '23:00'), '숫자만 입력하면 2300이 23:00이 돼요')}</div>`
        + `<p class="hint lg-pace">페이스 <b id="lgPace">–</b> <span>(거리와 시간으로 자동 계산)</span></p>`
        + field('lgWx', '날씨', '<div class="wxrow"><input id="lgWx" autocomplete="off" placeholder="예: 12°C 맑음"><button type="button" class="chip-btn" id="lgWxGo">📍 불러오기</button></div>', '위치는 날씨 조회에 한 번만 쓰이고 저장되지 않아요 (Open-Meteo)')
        + field('lgNote', '메모 (선택)', '<input id="lgNote" autocomplete="off" maxlength="40">') + photoField();
    }
    if (type === 'race') return dateF + field('lgName', '대회명', '<input id="lgName" autocomplete="off" placeholder="○○ 마라톤 10K">')
      + `<div class="lg-row">${field('lgRDate', '대회 날짜', `<input id="lgRDate" type="date" value="${today}">`)}${field('lgDist', '거리', '<div class="suffix"><input id="lgDist" inputmode="decimal" autocomplete="off" placeholder="10"><span>km</span></div>')}</div>`
      + `<div class="lg-row">${field('lgGoal', '목표 기록', durInput('lgGoal', '50:00'), '숫자만 입력하면 5000이 50:00이 돼요')}${field('lgRes', '결과 기록 (선택)', durInput('lgRes', '대회 후 입력'))}</div>`
      + '<p class="hint">결과 기록을 비우면 D-day 카드, 넣으면 결과 카드가 만들어져요</p>' + photoField();
    const now = new Date(), hm = `${String(now.getHours()).padStart(2, '0')}:${String(now.getMinutes()).padStart(2, '0')}`;
    return dateF + field('lgMeal', '식사', `<input id="lgMeal" list="lgMeals" autocomplete="off" placeholder="러닝 전"><datalist id="lgMeals">${MEALS.map(m => `<option value="${m}">`).join('')}</datalist>`)
      + field('lgMenu', '메뉴 메모', '<input id="lgMenu" autocomplete="off" maxlength="30" placeholder="오트밀과 커피">')
      + `<div class="lg-row">${field('lgClock', '시간', `<input id="lgClock" type="time" value="${hm}">`)}${field('lgDist', '이후 러닝', '<div class="suffix"><input id="lgDist" inputmode="decimal" autocomplete="off" placeholder="같은 날 러닝"><span>km</span></div>')}</div>`
      + field('lgNote', '메모 (선택)', '<input id="lgNote" autocomplete="off" maxlength="20" placeholder="가볍게">') + photoField();
  }
  function summary(l) {
    const v = bindValues(l, ctx());
    if (l.type === 'run') return [v.dayN, v.distance && v.distance + 'km', v.time, v.pace && v.pace + '/km'].filter(Boolean).join(' · ');
    if (l.type === 'race') return [v.raceName, v.result ? '결과 ' + v.result : v.dday].filter(Boolean).join(' · ');
    return [v.meal, v.menu].filter(Boolean).join(' · ');
  }
  function listHTML() {
    const L = sortLogs(S.logs);
    if (!L.length) return '<p class="hint">아직 기록이 없어요. 위에서 첫 기록을 남겨 보세요.</p>';
    return `<ol class="lg-list">${L.map(l => `<li><span class="lg-t t-${l.type}">${TNAME[l.type]}</span><span class="lg-s"><b>${esc((l.date || '').replaceAll('-', '.'))}</b><small>${esc(summary(l))}</small></span><button type="button" class="chip-btn" data-card="${esc(l.id)}">카드</button><button type="button" class="chip-btn quiet" data-del="${esc(l.id)}" aria-label="기록 삭제">삭제</button></li>`).join('')}</ol>`;
  }
  function settingsHTML() {
    const p = S.profile, sd = startDateOf(p, S.logs), n = sd ? dayN(isoToday(), sd) : null;
    return `<details class="card lg-set"><summary>설정 · 백업</summary>
      ${field('lgStartDate', '시작일 (Day 1)', `<input id="lgStartDate" type="date" value="${esc(p.startDate || '')}">`, sd ? `오늘은 Day ${n}` : '시작일을 정하면 러닝 카드에 Day N이 자동으로 들어가요')}
      <div class="field"><span class="lbl sm" id="lgModeL">Day 계산 기준</span><div class="seg n2" id="lgMode" role="radiogroup" aria-labelledby="lgModeL"><button type="button" role="radio" data-v="custom" aria-checked="${p.dayCountMode !== 'first-log'}">직접 정한 시작일</button><button type="button" role="radio" data-v="first-log" aria-checked="${p.dayCountMode === 'first-log'}">첫 러닝 기록일</button></div></div>
      ${field('lgHandle', '핸들', `<input id="lgHandle" autocomplete="off" maxlength="30" placeholder="@my_runs" value="${esc(p.handle || '')}">`)}
      ${field('lgDefTpl', '러닝 기본 템플릿', `<select id="lgDefTpl"><option value="">사진 있으면 사진, 없으면 단색</option>${Object.keys(TPL_KO).map(t => `<option value="${t}"${normTplId(p.defaultTemplateId) === t ? ' selected' : ''}>${TPL_KO[t]}</option>`).join('')}</select>`)}
      <div class="field"><span class="lbl sm">백업</span><div class="ed-btns"><button type="button" class="chip-btn" id="lgExport">백업 내보내기 (zip)</button><button type="button" class="chip-btn" id="lgImportB">백업 가져오기</button></div><input id="lgImport" type="file" accept=".zip,application/zip" class="vh" tabindex="-1" aria-hidden="true"><p class="hint">기록과 사진이 zip 파일 하나에 담겨요. 서버에는 아무것도 올라가지 않아요.</p></div>
    </details>`;
  }
  function paint() {
    root.innerHTML = `<header class="top lg-top"><button type="button" class="icon-btn" id="lgBack" aria-label="뒤로"><svg viewBox="0 0 24 24" width="22" height="22" aria-hidden="true" focusable="false"><path d="M15 5l-7 7 7 7" fill="none" stroke="currentColor" stroke-width="2.25" stroke-linecap="round" stroke-linejoin="round"/></svg></button><h1 id="hLog">오늘 기록 남기기</h1></header>
      <section class="card"><div class="seg n3" id="lgType" role="radiogroup" aria-label="기록 종류">${TYPES.map(([k, n]) => `<button type="button" role="radio" data-v="${k}" aria-checked="${k === type}">${n}</button>`).join('')}</div>
      <form id="lgForm" class="lg-form" autocomplete="off">${formHTML()}<p class="err" id="lgMsg" role="status" aria-live="polite">${esc(msg)}</p><div class="actions"><button type="submit" class="btn primary" id="lgSave">저장하고 카드 만들기</button></div></form></section>
      <section class="card" aria-labelledby="hLgList"><h2 id="hLgList">기록</h2>${listHTML()}</section>
      ${settingsHTML()}`;
    bind();
  }
  const val = id => { const e = $(id); return e ? e.value.trim() : ''; };
  function livePace() { const o = $('lgPace'); if (!o) return; const p = fmtPace(paceSec(num(val('lgDist')), parseDur(val('lgTime')))); o.textContent = p ? p + '/km' : '–'; }
  // same digit entry as the home record field: 2300 → 23:00, 10203 → 1:02:03
  function digitsToDisplay(d) { d = d.replace(/^0+(?=\d)/, ''); if (d.length <= 2) return d; if (d.length <= 4) return `${d.slice(0, -2)}:${d.slice(-2)}`; return `${d.slice(0, -4)}:${d.slice(-4, -2)}:${d.slice(-2)}`; }
  function bindDur(id) { const el = $(id); if (!el) return; el.addEventListener('input', e => { let d = e.target.value.replace(/\D/g, ''); const prev = e.target.dataset.digits || ''; if (e.inputType === 'deleteContentBackward' && d === prev) d = d.slice(0, -1); d = d.slice(0, 6); e.target.dataset.digits = d; e.target.value = digitsToDisplay(d); if (id === 'lgTime') livePace(); }); }
  function bind() {
    const on = (id, ev, f) => { const e = $(id); if (e) e.addEventListener(ev, f); };
    on('lgBack', 'click', () => navBack());
    on('lgType', 'click', e => { const b = e.target.closest('[data-v]'); if (!b) return; type = b.dataset.v; msg = ''; paint(); });
    on('lgDist', 'input', livePace); bindDur('lgTime'); bindDur('lgGoal'); bindDur('lgRes');
    on('lgWxGo', 'click', async () => {
      say('날씨를 불러오는 중…');
      try { const { wxHere, fetchWeather } = await import('../net/weather.js'); const p = await wxHere(); const r = await fetchWeather(p.lat, p.lon, val('lgDate') || isoToday(), new Date().getHours()); $('lgWx').value = `${r.temp} ${r.label}`; say(''); }
      catch (e) { say(e && e.code === 1 ? '위치 권한이 없어요 · 날씨를 직접 입력해 주세요' : '날씨를 불러오지 못했어요 · 직접 입력해 주세요'); }
    });
    on('lgForm', 'submit', async e => { e.preventDefault(); const log = await saveForm(); if (log) await openCard(log); });
    root.querySelectorAll('[data-card]').forEach(b => b.addEventListener('click', () => { const l = S.logs.find(x => x.id === b.dataset.card); if (l) openCard(l); }));
    root.querySelectorAll('[data-del]').forEach(b => b.addEventListener('click', async () => { const l = S.logs.find(x => x.id === b.dataset.del); if (!l || !confirm('이 기록을 지울까요? 사진도 함께 지워져요.')) return; await db.deleteLog(l); await reload(); paint(); }));
    const prof = async patch => { S.profile = { ...S.profile, ...patch }; await db.saveProfile(S.profile); await reload(); paint(); };
    on('lgStartDate', 'change', e => prof({ startDate: e.target.value }));
    on('lgMode', 'click', e => { const b = e.target.closest('[data-v]'); if (b) prof({ dayCountMode: b.dataset.v }); });
    on('lgHandle', 'change', e => prof({ handle: e.target.value.trim() }));
    on('lgDefTpl', 'change', e => prof({ defaultTemplateId: e.target.value }));
    on('lgExport', 'click', async () => { try { const blob = await db.exportZip(), a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `hoohaa-records-${isoToday().replaceAll('-', '')}.zip`; document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 30000); } catch (e) { console.error(e); alert('백업을 만들지 못했어요'); } });
    on('lgImportB', 'click', () => $('lgImport').click());
    on('lgImport', 'change', async e => { const f = e.target.files && e.target.files[0]; if (!f) return; try { const n = await db.importZip(f); await reload(); paint(); alert(`가져왔어요 · 기록 ${n.logs}개, 사진 ${n.photos}장`); } catch (err) { console.error(err); alert('가져오지 못했어요: ' + (err.message || err)); } });
  }
  async function saveForm() {
    const date = val('lgDate') || isoToday(), f = $('lgPhoto') && $('lgPhoto').files[0], photoIds = [];
    let data;
    if (type === 'run') {
      const km = num(val('lgDist')), sec = parseDur(val('lgTime'));
      if (km == null && !sec) { say('거리나 시간을 입력해 주세요'); return null; }
      if (val('lgTime') && !sec) { say('시간은 29:38 또는 1:02:03처럼 입력해 주세요'); return null; }
      data = { distance: km != null ? String(km) : '', time: val('lgTime'), pace: fmtPace(paceSec(km, sec)), weather: val('lgWx'), note: val('lgNote') };
    } else if (type === 'race') {
      if (!val('lgName')) { say('대회명을 입력해 주세요'); return null; }
      for (const id of ['lgGoal', 'lgRes']) if (val(id) && !parseDur(val(id))) { say('기록은 50:00 또는 1:52:14처럼 입력해 주세요'); return null; }
      const race = { id: db.uid('race'), name: val('lgName'), date: val('lgRDate') || date, distance: val('lgDist'), goal: val('lgGoal'), result: val('lgRes') };
      await db.put('races', race); data = { raceId: race.id, name: race.name, date: race.date, distance: race.distance, goal: race.goal, result: race.result };
    } else {
      if (!val('lgMeal') && !val('lgMenu')) { say('식사나 메뉴를 입력해 주세요'); return null; }
      data = { meal: val('lgMeal'), menu: val('lgMenu'), time: val('lgClock'), note: val('lgNote') }; if (num(val('lgDist')) != null) data.distance = String(num(val('lgDist')));
    }
    if (f) photoIds.push(await db.addPhoto(f));
    const log = { id: db.uid('log'), type, date, dayN: null, data, photoIds, templateId: '', createdAt: Date.now() };
    await reload(); const sd = startDateOf(S.profile, [...S.logs, log]); log.dayN = sd ? dayN(date, sd) : null;
    log.templateId = defaultTemplate(log, S.profile);
    await db.put('logs', log); await reload(); msg = ''; paint(); return log;
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
