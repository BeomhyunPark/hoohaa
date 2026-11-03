// 최대 심박과 존: docs/v4/rules.md "최대 심박과 존" 그대로.
// No DOM, no storage — test with `node src/engine/hrzones.test.mjs`.
//
// - HRmax를 모르면 208 − 0.7 × 나이 (Tanaka 2001).
// - 존은 HRmax 대비 비율: Z1 70% 미만, Z2 70~80%, Z3 80~87%, Z4 87~93%, Z5 93% 초과.
//   경계는 아래 존에 포함하지 않고 위 존의 시작으로 본다(70% → Z2, 80% → Z3, 87% → Z4).
//   단 93%는 "초과"가 기준이라 Z4에 남는다.

export const AGE_MIN = 10, AGE_MAX = 100;
export const HR_MIN = 100, HR_MAX = 230;

// [존, 시작 비율(포함), 끝 비율] — 끝은 다음 존의 시작.
export const ZONES = [
  { z: 1, from: 0, to: 0.70 },
  { z: 2, from: 0.70, to: 0.80 },
  { z: 3, from: 0.80, to: 0.87 },
  { z: 4, from: 0.87, to: 0.93 },
  { z: 5, from: 0.93, to: 1 },
];

// 나이 → 추정 HRmax (정수 bpm). 범위 밖이거나 숫자가 아니면 null.
export function hrmaxFromAge(age) {
  const a = Number(age);
  if (!Number.isFinite(a) || a < AGE_MIN || a > AGE_MAX) return null;
  return Math.round(208 - 0.7 * a);
}

// 입력 HRmax가 있으면 그것, 없으면 나이로. { hrmax, source: 'input' | 'age' } 또는 { error }.
export function resolveHrmax({ hrmax, age } = {}) {
  const has = v => v !== undefined && v !== null && String(v).trim() !== '';
  if (has(hrmax)) {
    const h = Number(hrmax);
    if (!Number.isFinite(h) || h < HR_MIN || h > HR_MAX) return { error: `최대 심박은 ${HR_MIN}~${HR_MAX} 사이로 넣어 주세요.` };
    return { hrmax: Math.round(h), source: 'input' };
  }
  if (has(age)) {
    const h = hrmaxFromAge(age);
    if (h === null) return { error: `나이는 ${AGE_MIN}~${AGE_MAX}세 사이로 넣어 주세요.` };
    return { hrmax: h, source: 'age' };
  }
  return { error: null };
}

// 심박 하나가 몇 존인지. 비율 경계는 위 규칙대로.
export function zoneOf(hr, hrmax) {
  if (!(hr > 0) || !(hrmax > 0)) return null;
  const p = hr / hrmax;
  if (p < 0.70) return 1;
  if (p < 0.80) return 2;
  if (p < 0.87) return 3;
  if (p <= 0.93) return 4;
  return 5;
}

// HRmax → 존별 정수 bpm 범위. lo·hi 모두 그 존에 들어가는 심박(포함).
// Z1의 lo는 null(하한 없음), Z5의 hi는 HRmax.
export function zones(hrmax) {
  const h = Math.round(Number(hrmax));
  if (!(h > 0)) return [];
  // 각 존에 실제로 들어가는 가장 작은 정수 심박을 zoneOf로 찾는다. 반올림으로 생기는 경계 어긋남을 막으려는 것.
  const first = z => { for (let b = 1; b <= h; b++) if (zoneOf(b, h) === z) return b; return null; };
  const starts = ZONES.map(Z => (Z.z === 1 ? null : first(Z.z)));
  return ZONES.map((Z, i) => ({
    z: Z.z,
    from: Z.from,
    to: Z.to,
    lo: starts[i],
    hi: i < ZONES.length - 1 ? starts[i + 1] - 1 : h,
  }));
}
