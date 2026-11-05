import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { ACTIVITY, DEFAULT_ACTIVITY, LIMITS, validInput, bmrMifflin, tdee, goals, energy } from './bmr.js';

// Mifflin–St Jeor: 10w + 6.25h − 5a + 5 (남) / − 161 (여)
assert.equal(bmrMifflin({ sex: 'm', weight: 70, height: 175, age: 30 }), 1648.75);
assert.equal(bmrMifflin({ sex: 'f', weight: 70, height: 175, age: 30 }), 1482.75);
assert.equal(bmrMifflin({ sex: 'm', weight: 70, height: 175, age: 30 }) - bmrMifflin({ sex: 'f', weight: 70, height: 175, age: 30 }), 166);
assert.equal(bmrMifflin({ sex: 'f', weight: 55, height: 165, age: 30 }), 1270.25);
assert.equal(bmrMifflin({ sex: 'm', weight: 80, height: 180, age: 40 }), 1730);
// 계수 하나씩: 몸무게 +1kg = +10, 키 +1cm = +6.25, 나이 +1 = −5
const base = { sex: 'm', weight: 70, height: 175, age: 30 };
assert.equal(bmrMifflin({ ...base, weight: 71 }) - bmrMifflin(base), 10);
assert.equal(bmrMifflin({ ...base, height: 176 }) - bmrMifflin(base), 6.25);
assert.equal(bmrMifflin({ ...base, age: 31 }) - bmrMifflin(base), -5);

// TDEE = BMR × 계수
assert.equal(tdee(1648.75, 1.55), 1648.75 * 1.55);
assert.equal(tdee(1000, 1.2), 1200);

// 감량 −500 (BMR 아래로는 안 내림), 유지, 증량 +300
assert.deepEqual(goals(1600, 2480), { cut: 1980, keep: 2480, bulk: 2780 });
assert.deepEqual(goals(1600, 1920), { cut: 1600, keep: 1920, bulk: 2220 }); // 1920 − 500 < BMR

// 입력 범위 (경계 포함)
assert.ok(validInput({ age: 10, height: 100, weight: 25 }));
assert.ok(validInput({ age: 100, height: 230, weight: 250 }));
for (const bad of [{ age: 9 }, { age: 101 }, { height: 99 }, { height: 231 }, { weight: 24.9 }, { weight: 251 }, { age: NaN }, { age: 0 }])
  assert.ok(!validInput({ age: 30, height: 175, weight: 70, ...bad }), JSON.stringify(bad));
assert.deepEqual(LIMITS, { age: [10, 100], height: [100, 230], weight: [25, 250] });

// 한 번에
const e = energy({ sex: 'm', age: 30, height: 175, weight: 70, factor: 1.55 });
assert.equal(e.bmr, 1648.75);
assert.equal(Math.round(e.tdee), 2556);
assert.equal(Math.round(e.cut), 2056);
assert.equal(Math.round(e.bulk), 2856);
assert.equal(energy({ sex: 'm', age: 9, height: 175, weight: 70, factor: 1.55 }), null);
// 'm'이 아니면 여자 공식 (페이지는 'm' | 'f'만 넘긴다)
assert.equal(energy({ sex: 'f', age: 30, height: 175, weight: 70, factor: 1.2 }).bmr, 1482.75);

// 활동량 계수: 값과 순서가 페이지 <select>와 같아야 한다 (링크의 k=도 이 값으로 확인한다)
assert.deepEqual(ACTIVITY.map((x) => x.k), [1.2, 1.375, 1.55, 1.725, 1.9]);
const html = readFileSync(new URL('../../bmr/index.html', import.meta.url), 'utf8');
const sel = html.match(/<select id="bAct">([\s\S]*?)<\/select>/)[1];
const opts = [...sel.matchAll(/<option value="([^"]+)"( selected)?>([^<]+)<\/option>/g)];
assert.deepEqual(opts.map((o) => +o[1]), ACTIVITY.map((x) => x.k));
assert.deepEqual(opts.map((o) => o[3]), ACTIVITY.map((x) => x.label));
assert.equal(+opts.find((o) => o[2])[1], DEFAULT_ACTIVITY);

console.log('bmr ok');
