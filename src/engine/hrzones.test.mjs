import assert from 'node:assert/strict';
import { hrmaxFromAge, resolveHrmax, zoneOf, zones } from './hrzones.js';

// 208 − 0.7 × 나이, 반올림
assert.equal(hrmaxFromAge(30), 187);
assert.equal(hrmaxFromAge(40), 180);
assert.equal(hrmaxFromAge(10), 201); // 나이 하한
assert.equal(hrmaxFromAge(100), 138); // 나이 상한
assert.equal(hrmaxFromAge(9), null);
assert.equal(hrmaxFromAge(101), null);
assert.equal(hrmaxFromAge(''), null);
assert.equal(hrmaxFromAge('abc'), null);

// 입력 HRmax가 나이보다 먼저
assert.deepEqual(resolveHrmax({ hrmax: '190', age: 30 }), { hrmax: 190, source: 'input' });
assert.deepEqual(resolveHrmax({ hrmax: '', age: '30' }), { hrmax: 187, source: 'age' });
assert.deepEqual(resolveHrmax({}), { error: null });
assert.ok(resolveHrmax({ hrmax: 99 }).error);
assert.ok(resolveHrmax({ hrmax: 231 }).error);
assert.equal(resolveHrmax({ hrmax: 100 }).hrmax, 100);
assert.equal(resolveHrmax({ hrmax: 230 }).hrmax, 230);
assert.ok(resolveHrmax({ age: 5 }).error);

// 비율 경계 (HRmax 200이면 정수로 딱 떨어진다)
assert.equal(zoneOf(139, 200), 1); // 69.5%
assert.equal(zoneOf(140, 200), 2); // 70%
assert.equal(zoneOf(159, 200), 2);
assert.equal(zoneOf(160, 200), 3); // 80%
assert.equal(zoneOf(173, 200), 3);
assert.equal(zoneOf(174, 200), 4); // 87%
assert.equal(zoneOf(186, 200), 4); // 93%는 "초과"가 아니라 Z4
assert.equal(zoneOf(187, 200), 5); // 93.5%
assert.equal(zoneOf(200, 200), 5);
assert.equal(zoneOf(0, 200), null);

const z200 = zones(200);
assert.deepEqual(z200.map(z => [z.z, z.lo, z.hi]), [[1, null, 139], [2, 140, 159], [3, 160, 173], [4, 174, 186], [5, 187, 200]]);

// 딱 떨어지지 않는 HRmax: 범위가 끊기거나 겹치지 않고, 각 bpm이 zoneOf와 같은 존에 들어간다
for (let h = 100; h <= 230; h++) {
  const zs = zones(h);
  assert.equal(zs.length, 5);
  assert.equal(zs[4].hi, h);
  for (let i = 1; i < 5; i++) assert.equal(zs[i].lo, zs[i - 1].hi + 1, `HRmax ${h} Z${i + 1}`);
  for (const z of zs) for (let b = z.lo ?? 1; b <= z.hi; b++) assert.equal(zoneOf(b, h), z.z, `HRmax ${h} ${b}bpm`);
}
// 30세(HRmax 187): 0.7×187 = 130.9 → Z2는 131부터
assert.deepEqual(zones(187).map(z => [z.lo, z.hi]), [[null, 130], [131, 149], [150, 162], [163, 173], [174, 187]]);

console.log('hrzones ok');
