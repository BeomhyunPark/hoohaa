import assert from 'node:assert/strict';
import { parseDur, fmtDur, fmtPace, paceSec, dayN, ddayLabel, bindValues, startDateOf, defaultTemplate, sortLogs } from './logcalc.js';

assert.equal(parseDur('29:38'), 1778); assert.equal(parseDur('2938'), 1778); assert.equal(parseDur('2300'), 1380); assert.equal(parseDur('23:00'), 1380); assert.equal(parseDur('1:02:03'), 3723); assert.equal(parseDur('5:70'), null); assert.equal(parseDur(''), null);
assert.equal(fmtDur(1778), '29:38'); assert.equal(fmtDur(3723), '1:02:03');
assert.equal(fmtPace(paceSec(5.2, 1778)), '5:42'); assert.equal(fmtPace(359.6), '6:00');
assert.equal(dayN('2026-09-05', '2026-09-05'), 1); assert.equal(dayN('2026-10-23', '2026-09-05'), 49); assert.equal(dayN('2026-03-30', '2026-03-28'), 3);
assert.equal(ddayLabel('2026-11-09', '2026-10-23'), 'D-17'); assert.equal(ddayLabel('2026-11-09', '2026-11-09'), 'D-DAY'); assert.equal(ddayLabel('2026-11-09', '2026-11-12'), 'D+3');
const gear = [{ id: 'g1', name: '러닝화', startKm: 470 }];
const logs = [
  { id: 'a', type: 'run', date: '2026-10-20', createdAt: 1, data: { distance: '6.8', time: '40:00', gearId: 'g1' } },
  { id: 'b', type: 'run', date: '2026-10-23', createdAt: 2, data: { distance: '5.2', time: '29:38', gearId: 'g1' } },
  { id: 'c', type: 'run', date: '2026-10-21', createdAt: 3, data: { distance: '3', time: '18:00' } },
];
const profile = { startDate: '2026-09-05', dayCountMode: 'custom' };
const v = bindValues(logs[1], { profile, logs, gear });
assert.equal(v.dayN, 'Day 49'); assert.equal(v.date, '2026.10.23'); assert.equal(v.distance, '5.20'); assert.equal(v.pace, '5:42'); assert.equal(v.time, '29:38');
assert.equal(v.gearKm, undefined); assert.equal(v.gearName, undefined); // old gearId on run logs is ignored
assert.equal(startDateOf({ dayCountMode: 'first-log' }, logs), '2026-10-20');
const g = bindValues({ type: 'gear', date: '2026-10-23', data: { gearId: 'g1' } }, { logs, gear }); // old gear log: no throw, no gear values
assert.equal(g.gearKm, undefined); assert.equal(g.date, '2026.10.23');
const r = bindValues({ type: 'race', date: '2026-10-23', data: { name: '○○ 마라톤 10K', date: '2026-11-09', distance: '10', goal: '50:00' } }, {});
assert.equal(r.dday, 'D-17'); assert.equal(r.dateMD, '11.09'); assert.equal(r.distance, '10'); assert.equal(r.time, '50:00');
const rr = bindValues({ type: 'race', date: '2026-11-09', data: { name: 'x', distance: '10', result: '52:14' } }, {});
assert.equal(rr.result, '52:14'); assert.equal(rr.pace, '5:13'); assert.equal(rr.dateMD, '11.09'); assert.equal(rr.dday, 'D-DAY');
const dt = bindValues({ type: 'diet', date: '2026-10-23', data: { meal: '러닝 전', menu: '오트밀과 커피', time: '06:40' } }, { logs });
assert.equal(dt.distance, '5.20'); assert.equal(dt.meal, '러닝 전');
assert.equal(defaultTemplate({ type: 'run', photoIds: [] }), 'va-run-solid'); assert.equal(defaultTemplate({ type: 'race', data: { result: '52:14' } }), 'va-race-result');
assert.equal(defaultTemplate({ type: 'race', data: {} }), 'va-race-result'); assert.equal(defaultTemplate({ type: 'diet' }), 'vc-diet');
assert.equal(defaultTemplate({ type: 'run', photoIds: ['p'] }), 'va-run-photo'); assert.equal(defaultTemplate({ type: 'run', photoIds: [] }, { defaultTemplateId: 'run-photo' }), 'run-photo'); assert.equal(defaultTemplate({ type: 'run' }, { defaultTemplateId: 'vd-run-solid' }), 'vd-run-solid');
assert.deepEqual(sortLogs(logs).map(l => l.id), ['b', 'c', 'a']);
console.log('logcalc ok');
// 가로 + 세로 템플릿 모두 실제 템플릿 (옛 id 는 세로로 바뀌지 않음)
import { TPL_IDS, normTplId } from './logcalc.js';
import { LOG_TPLS, buildLogDoc, kindOf, normTpl } from '../editor/logtpl.js';
assert.deepEqual(LOG_TPLS.map(t => t[0]), TPL_IDS);
for (const id of ['run-photo', 'run-solid', 'race-dday', 'race-result', 'diet']) { assert.equal(normTplId(id), id); assert.equal(normTpl(id), id); }
for (const id of TPL_IDS) { const d = buildLogDoc(id, { distance: '5.20', pace: '5:42', time: '29:38', dayN: 'Day 1', date: '2026.10.23' }, { pid: 'p' }); assert.equal(d.log.tpl, id); assert.ok(d.layers.length > 5); }
const h = buildLogDoc('run-solid', {}); assert.deepEqual(h.layers.filter(l => /^v\d$/.test(l.sid)).map(l => Math.round(l.rx * 1080)), [72, 392, 712]);
assert.equal(kindOf('race-dday'), 'race'); assert.equal(kindOf('diet'), 'diet'); assert.equal(kindOf('vc-diet'), 'diet'); assert.equal(kindOf('va-race-result'), 'race'); assert.equal(kindOf('run-photo'), 'run');
assert.equal(defaultTemplate({ type: 'run' }, { defaultTemplateId: 'run-solid' }), 'run-solid');
console.log('logtpl ok');

// ---- 날짜 경계: 자정, 월말, 연말, 윤년 / 없는 날짜 / 시작일 전 ----
import { isISODate, posKm, isoToday } from './logcalc.js';
assert.equal(dayN('2026-11-01', '2026-10-31'), 2); assert.equal(dayN('2027-01-01', '2026-12-31'), 2); // 월말 · 연말
assert.equal(dayN('2028-03-01', '2028-02-28'), 3); assert.equal(dayN('2026-03-01', '2026-02-28'), 2); // 윤년 2028 · 평년 2026
assert.equal(dayN('2028-02-29', '2028-02-29'), 1); assert.equal(dayN('2029-02-28', '2028-02-29'), 366);
assert.equal(dayN('2026-03-29', '2026-03-28'), 2); assert.equal(dayN('2026-11-02', '2026-11-01'), 2); // 유럽·미국 서머타임 전환일도 하루
assert.equal(dayN('2026-11-03', '2026-11-05'), null); // 시작일 전에는 Day 0 / Day -2가 아니라 없음
assert.equal(isISODate('2028-02-29'), true); assert.equal(isISODate('2026-02-29'), false); assert.equal(isISODate('2026-04-31'), false); assert.equal(isISODate('2026-13-01'), false); assert.equal(isISODate(''), false);
assert.equal(dayN('2026-02-29', '2026-02-01'), null); assert.equal(dayN('2026-03-01', '2026-02-30'), null); // 없는 날짜가 다음 달로 넘어가지 않음
assert.equal(ddayLabel('2026-03-01', '2026-02-28'), 'D-1'); assert.equal(ddayLabel('2028-03-01', '2028-02-28'), 'D-2'); assert.equal(ddayLabel('2027-01-01', '2026-12-31'), 'D-1');
assert.equal(ddayLabel('2026-02-30', '2026-02-01'), '');
assert.equal(isoToday(new Date(2028, 1, 29, 23, 59, 59)), '2028-02-29'); assert.equal(isoToday(new Date(2028, 2, 1, 0, 0, 0)), '2028-03-01'); // 자정 전후 (로컬 날짜)
assert.equal(isoToday(new Date(2026, 11, 31, 23, 59, 59, 999)), '2026-12-31'); assert.equal(isoToday(new Date(2027, 0, 1)), '2027-01-01');
// startDateOf: 잘못 저장된 시작일은 무시
assert.equal(startDateOf({ startDate: '2026-02-30', dayCountMode: 'custom' }, logs), null);
assert.equal(startDateOf({ startDate: '2026-09-05', dayCountMode: 'first-log' }, [{ type: 'run', date: 'bad' }]), '2026-09-05');
// Day N in cards: before the start date → empty, never 'Day 0'
assert.equal(bindValues({ type: 'run', date: '2026-09-04', data: { distance: '5' } }, { profile, logs }).dayN, '');
assert.equal(bindValues({ type: 'run', date: '2026-09-05', data: { distance: '5' } }, { profile, logs }).dayN, 'Day 1');
assert.equal(bindValues({ type: 'diet', date: '2026-10-19', data: { meal: '아침' } }, { profile: { dayCountMode: 'first-log' }, logs }).dayN, ''); // 첫 러닝(10-20) 전날 식단
// 거리: 0이나 음수는 거리가 아님 (예전에 저장된 -3도 카드에 '-3.00'으로 나오지 않음)
assert.equal(posKm('5.2'), 5.2); assert.equal(posKm('5,2'), 5.2); assert.equal(posKm('-3'), null); assert.equal(posKm('0'), null); assert.equal(posKm('abc'), null); assert.equal(posKm(''), null);
const neg = bindValues({ type: 'run', date: '2026-10-23', data: { distance: '-3', time: '23:00' } }, {});
assert.equal(neg.distance, ''); assert.equal(neg.pace, ''); assert.equal(neg.time, '23:00');
// 페이스 경계: 반올림으로 60초가 되면 다음 분, 1시간 넘는 기록
assert.equal(fmtPace(paceSec(10, 3599.9)), '6:00'); assert.equal(fmtPace(paceSec(42.195, parseDur('3:29:59'))), '4:59'); assert.equal(fmtPace(paceSec(1, 0)), '');
// 대회: 결과가 있으면 결과로, 없으면 목표로 페이스
assert.equal(bindValues({ type: 'race', date: '2026-11-09', data: { name: 'x', distance: '10', goal: '50:00' } }, {}).pace, '5:00');
// 식단: 같은 날 러닝 거리, 거리가 없는 러닝은 건너뜀
assert.equal(bindValues({ type: 'diet', date: '2026-10-23', data: { meal: '저녁' } }, { logs: [{ type: 'run', date: '2026-10-23', data: { time: '30:00' } }, logs[1]] }).distance, '5.20');
console.log('logcalc boundaries ok');
