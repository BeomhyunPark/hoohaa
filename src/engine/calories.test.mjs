import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { REST_VO2, KCAL_PER_L, RUN_MIN_SPEED, RICE_KCAL, LIMITS, speedOf, vo2Run, kcalPerMin, runCalories, riceBowls } from './calories.js';

const near = (a, b, eps = 1e-9) => assert.ok(Math.abs(a - b) < eps, `${a} ≉ ${b}`);

// 상수: ACSM 러닝 공식과 산소 1 L ≈ 5 kcal
assert.equal(REST_VO2, 3.5);
assert.equal(KCAL_PER_L, 5);
assert.equal(RUN_MIN_SPEED, 134);
assert.equal(RICE_KCAL, 300);

// 페이스 → 속도: 6:00/km = 166.67 m/min, 5:00/km = 200 m/min
near(speedOf(300), 200);
near(speedOf(360), 1000 / 6);
// VO2 = 0.2 × S + 0.9 × S × G + 3.5
near(vo2Run(200), 43.5);
near(vo2Run(200, 0.05), 43.5 + 9);
near(vo2Run(134), 30.3);
// kcal/min = VO2 × kg ÷ 1000 × 5
near(kcalPerMin(43.5, 70), 15.225);
near(kcalPerMin(3.5, 60), 1.05);

// 70kg, 10km, 5:00/km → 50분 × 15.225 = 761.25 kcal
let r = runCalories({ weight: 70, pace: 300, distance: 10 });
near(r.kcal, 761.25);
near(r.time, 3000);
near(r.rest, 1.225 * 50);
assert.equal(r.slow, false);
// 같은 달리기를 시간으로 넣어도 같다
const t = runCalories({ weight: 70, pace: 300, time: 3000 });
near(t.kcal, r.kcal);
near(t.distance, 10);
// 거리와 시간이 둘 다 오면 거리를 쓴다
near(runCalories({ weight: 70, pace: 300, distance: 5, time: 9999 }).kcal, r.kcal / 2);

// 운동으로 늘어난 몫(net)은 평지에서 1 kcal/kg/km: 페이스와 상관없다
for (const pace of [150, 240, 300, 360, 447, 600, 750])
  for (const [w, d] of [[50, 5], [70, 10], [90, 21.0975]])
    near(runCalories({ weight: w, pace, distance: d }).net, w * d, 1e-6);
// 총량은 느릴수록 (시간이 길어서) 커진다
assert.ok(runCalories({ weight: 70, pace: 400, distance: 10 }).kcal > runCalories({ weight: 70, pace: 300, distance: 10 }).kcal);

// 134 m/min(7:28/km)보다 느리면 slow
assert.equal(runCalories({ weight: 70, pace: 447, distance: 5 }).slow, false); // 134.2 m/min
assert.equal(runCalories({ weight: 70, pace: 448, distance: 5 }).slow, true); // 133.9 m/min
assert.equal(runCalories({ weight: 70, pace: 750, distance: 5 }).slow, true);

// 덜 넣었으면 null, 범위 밖이면 오류
assert.equal(runCalories({ weight: 70, pace: 300 }), null);
assert.equal(runCalories({ weight: NaN, pace: 300, distance: 5 }), null);
assert.equal(runCalories({ weight: 70, pace: null, distance: 5 }), null);
assert.equal(runCalories({ pace: 300, distance: 5 }), null);
assert.deepEqual(LIMITS, { weight: [25, 250], distance: [0.1, 100], time: [60, 86400], pace: [120, 750] });
for (const bad of [{ weight: 24.9 }, { weight: 251 }, { pace: 119 }, { pace: 751 }, { distance: 0 }, { distance: 100.1 }, { distance: -1 }])
  assert.ok(runCalories({ weight: 70, pace: 300, distance: 5, ...bad }).error, JSON.stringify(bad));
for (const bad of [{ time: 59 }, { time: 86401 }])
  assert.ok(runCalories({ weight: 70, pace: 300, ...bad }).error, JSON.stringify(bad));
// 경계는 들어간다
for (const ok of [{ weight: 25 }, { weight: 250 }, { pace: 120 }, { pace: 750 }, { distance: 0.1 }, { distance: 100 }])
  assert.ok(!runCalories({ weight: 70, pace: 300, distance: 5, ...ok }).error, JSON.stringify(ok));

// 밥 공기 (0.1 단위)
assert.equal(riceBowls(300), 1);
assert.equal(riceBowls(761.25), 2.5);
assert.equal(riceBowls(359), 1.2);
assert.equal(riceBowls(0), 0);

// 페이지 기본값(65kg, 5km, 6:00)으로 미리 채운 결과가 엔진과 같아야 한다
const html = readFileSync(new URL('../../calories/index.html', import.meta.url), 'utf8');
const val = (id) => html.match(new RegExp(`id="${id}"[^>]*value="([^"]+)"`))[1];
const txt = (id) => html.match(new RegExp(`id="${id}"[^>]*>([^<]*)<`))[1];
const [m, s] = val('cP').split(':').map(Number);
const d = runCalories({ weight: +val('cW'), pace: m * 60 + s, distance: +val('cD') });
assert.equal(txt('oKcal'), Math.round(d.kcal).toLocaleString('ko-KR') + ' kcal');
assert.equal(txt('oRice'), '약 ' + riceBowls(d.kcal) + '공기');
assert.equal(txt('oRest'), Math.round(d.rest) + ' kcal');

console.log('calories ok');
