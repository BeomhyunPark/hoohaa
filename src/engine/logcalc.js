// 오늘 기록 (run / race / gear / diet): pure helpers shared by the log screen and the card templates.
// No DOM, no storage — easy to test with `node src/engine/logcalc.test.mjs`.

const p2 = n => String(n).padStart(2, '0');

// 'YYYY-MM-DD' → day number (UTC, so DST / time zones never shift a calendar date)
const dayNum = iso => { const m = /^(\d{4})-(\d\d)-(\d\d)$/.exec(iso || ''); return m ? Date.UTC(+m[1], +m[2] - 1, +m[3]) / 864e5 : NaN; };
export const isoToday = (d = new Date()) => `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;

// '29:38' | '1:02:03' | '2938' → seconds (null when empty/invalid)
export function parseDur(s) {
  s = String(s ?? '').trim(); if (!s) return null;
  let parts;
  if (/^\d+$/.test(s)) { const d = s.replace(/^0+(?=\d)/, ''); parts = d.length <= 2 ? [d] : d.length <= 4 ? [d.slice(0, -2), d.slice(-2)] : [d.slice(0, -4), d.slice(-4, -2), d.slice(-2)]; }
  else parts = s.split(':');
  if (!parts.every(x => /^\d+$/.test(x)) || parts.length > 3) return null;
  const n = parts.map(Number); if (n.slice(1).some(x => x > 59)) return null;
  const sec = n.reduce((a, b) => a * 60 + b, 0); return sec > 0 ? sec : null;
}
// seconds → 'm:ss' or 'h:mm:ss'
export function fmtDur(sec) {
  if (sec == null || !isFinite(sec)) return '';
  sec = Math.round(sec); const h = Math.floor(sec / 3600), m = Math.floor(sec % 3600 / 60), s = sec % 60;
  return h ? `${h}:${p2(m)}:${p2(s)}` : `${m}:${p2(s)}`;
}
// pace (sec per km) → '5:42' (the '/km' unit is drawn separately, see fmtPaceFull)
export const paceSec = (km, sec) => km > 0 && sec > 0 ? sec / km : null;
export function fmtPace(spk) { if (spk == null || !isFinite(spk)) return ''; let m = Math.floor(spk / 60), s = Math.round(spk - m * 60); if (s === 60) { m++; s = 0; } return `${m}:${p2(s)}`; }
export const fmtPaceFull = spk => spk == null ? '' : fmtPace(spk) + '/km';
export const num = v => { const n = parseFloat(String(v ?? '').replace(',', '.')); return isFinite(n) ? n : null; };
export const fmtKm = (km, fixed = 2) => km == null ? '' : Number.isInteger(km) && fixed !== 2 ? String(km) : km.toFixed(fixed);

// dayN = (log date − startDate) + 1, by calendar date
export function dayN(date, startDate) { const a = dayNum(date), b = dayNum(startDate); return isFinite(a) && isFinite(b) ? a - b + 1 : null; }
export function startDateOf(profile, logs) {
  if (profile && profile.dayCountMode === 'first-log') { const d = (logs || []).filter(l => l.type === 'run' && l.date).map(l => l.date).sort()[0]; return d || (profile && profile.startDate) || null; }
  return (profile && profile.startDate) || null;
}
// D-17 · D-DAY · D+3
export function ddayLabel(raceDate, from) { const a = dayNum(raceDate), b = dayNum(from); if (!isFinite(a) || !isFinite(b)) return ''; const n = a - b; return n > 0 ? `D-${n}` : n === 0 ? 'D-DAY' : `D+${-n}`; }
// cumulative km is never stored: startKm + every run log that used this gear
export function gearKm(gear, logs) {
  const runs = (logs || []).filter(l => l.type === 'run' && l.data && l.data.gearId === gear.id);
  return (num(gear.startKm) || 0) + runs.reduce((a, l) => a + (num(l.data.distance) || 0), 0);
}
export const fmtDate = iso => (iso || '').replaceAll('-', '.');           // 2026.10.23
export const fmtMD = iso => (iso || '').slice(5).replace('-', '.');        // 10.23

export const TPL_IDS = ['run-photo', 'run-solid', 'race-dday', 'race-result', 'gear', 'diet'];
export function defaultTemplate(log, profile) {
  if (log.type === 'run') { const d = profile && profile.defaultTemplateId; if (d === 'run-photo' || d === 'run-solid') return d; return (log.photoIds || []).length ? 'run-photo' : 'run-solid'; }
  if (log.type === 'race') return log.data && log.data.result ? 'race-result' : 'race-dday';
  return log.type === 'gear' ? 'gear' : 'diet';
}

// every binding key → display string (units are drawn by the template, never part of the value)
// ctx: { profile, logs, races, gear }
export function bindValues(log, ctx = {}) {
  const d = log.data || {}, logs = ctx.logs || [], V = { date: fmtDate(log.date), dateMD: fmtMD(log.date) };
  const sd = startDateOf(ctx.profile, logs), n = sd ? dayN(log.date, sd) : null; V.dayN = n != null ? `Day ${n}` : '';
  if (log.type === 'run') {
    const km = num(d.distance), sec = parseDur(d.time); V.distance = km != null ? fmtKm(km) : ''; V.time = sec ? fmtDur(sec) : ''; V.pace = fmtPace(paceSec(km, sec)); V.weather = d.weather || ''; V.note = d.note || '';
    const g = d.gearId && (ctx.gear || []).find(x => x.id === d.gearId); if (g) { V.gearName = g.name || ''; V.gearKm = fmtKm(gearKm(g, logs), 0).replace(/\.0+$/, ''); }
  } else if (log.type === 'race') {
    const r = (d.raceId && (ctx.races || []).find(x => x.id === d.raceId)) || d, km = num(r.distance ?? d.distance), res = parseDur(d.result || r.result), goal = parseDur(d.goal || r.goal);
    V.raceName = r.name || d.name || ''; V.dateMD = fmtMD(r.date || log.date); V.date = fmtDate(r.date || log.date);
    V.dday = ddayLabel(r.date || log.date, log.date); V.distance = km != null ? fmtKm(km, 0) : ''; V.time = goal ? fmtDur(goal) : ''; V.result = res ? fmtDur(res) : '';
    V.pace = fmtPace(paceSec(km, res || goal)); V.note = d.note || '';
  } else if (log.type === 'gear') {
    const g = (ctx.gear || []).find(x => x.id === d.gearId) || { id: d.gearId, name: d.name, startKm: d.startKm };
    V.gearName = g.name || ''; const total = gearKm(g, logs); V.gearKm = String(Math.round(total));
    const runs = logs.filter(l => l.type === 'run' && l.data && l.data.gearId === g.id && l.date <= log.date).sort((a, b) => (b.date + b.createdAt).localeCompare(a.date + a.createdAt));
    const last = runs[0]; V.distance = last && num(last.data.distance) != null ? fmtKm(num(last.data.distance)) : '';
    const tk = runs.reduce((a, l) => a + (parseDur(l.data.time) ? num(l.data.distance) || 0 : 0), 0), ts = runs.reduce((a, l) => a + (num(l.data.distance) ? parseDur(l.data.time) || 0 : 0), 0);
    V.pace = fmtPace(paceSec(tk, ts)); V.note = d.note || '';
  } else if (log.type === 'diet') {
    V.meal = d.meal || ''; V.menu = d.menu || ''; V.time = d.time || ''; V.note = d.note || '';
    let km = num(d.distance); if (km == null) { const run = logs.find(l => l.type === 'run' && l.date === log.date && num(l.data && l.data.distance) != null); if (run) km = num(run.data.distance); }
    V.distance = km != null ? fmtKm(km) : '';
  }
  return V;
}
// newest first: by record date, then creation time
export const sortLogs = logs => [...logs].sort((a, b) => (b.date || '').localeCompare(a.date || '') || (b.createdAt || 0) - (a.createdAt || 0));
