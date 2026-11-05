// 러닝 칼로리 소모 계산. /calories/ 페이지가 쓴다. DOM 없음: `node src/engine/calories.test.mjs`.
//
// 산소 섭취량: ACSM 러닝 공식 (평지, 경사 0)
//   American College of Sports Medicine. ACSM's Guidelines for Exercise Testing and Prescription,
//   "Metabolic Calculations" (러닝 공식).
//   VO2 (mL/kg/min) = 0.2 × 속도(m/min) + 0.9 × 속도 × 경사 + 3.5
//   이 사이트는 평지만 계산하므로 경사 항은 0이다. 3.5는 안정 시 산소 섭취량(1 MET)이다.
//   ACSM은 이 공식을 134 m/min(약 8 km/h, 7:28/km) 이상에서 쓰라고 하고, 80~134 m/min은 실제로 뛰고 있을 때만
//   쓰라고 한다. 그래서 페이스는 12:30/km(80 m/min)까지 받고, 7:28/km보다 느리면 slow로 알린다.
//
// 칼로리: 산소 1 L ≈ 5 kcal (ACSM 같은 장의 환산값)
//   kcal/min = VO2 × 몸무게(kg) ÷ 1000 × 5
//
// 결과는 안정 시 소비(3.5 항)까지 넣은 총량(gross)이다. 운동으로 늘어난 몫(net)만 보면 평지에서는
// 0.2 mL/kg/m × 1000 m × 5 kcal/L = 1 kcal/kg/km로, 페이스와 상관없이 거리와 몸무게로 정해진다.
//
// 밥 한 공기 ≈ 300 kcal: 비교용 어림값이다(공기밥 1개 약 210 g 기준). 계산식에는 쓰지 않는다.

export const REST_VO2 = 3.5; // mL/kg/min
export const KCAL_PER_L = 5;
export const RUN_MIN_SPEED = 134; // m/min. 이보다 느리면 slow
export const RICE_KCAL = 300;

// 입력 범위 (페이지 입력칸과 같다). 페이스는 초/km: 2:00 ~ 12:30
export const LIMITS = { weight: [25, 250], distance: [0.1, 100], time: [60, 24 * 3600], pace: [120, 750] };
const inRange = (v, [lo, hi]) => Number.isFinite(v) && v >= lo && v <= hi;

export const speedOf = (paceSec) => 60000 / paceSec; // 초/km → m/min
export const vo2Run = (speed, grade = 0) => 0.2 * speed + 0.9 * speed * grade + REST_VO2;
export const kcalPerMin = (vo2, weight) => (vo2 * weight / 1000) * KCAL_PER_L;

// weight(kg), pace(초/km), 그리고 distance(km)나 time(초) 중 하나. 둘 다 오면 distance를 쓴다.
// 범위 밖이면 { error }, 아직 덜 넣었으면 null. 반올림하지 않은 값을 돌려준다.
export function runCalories({ weight, pace, distance, time }) {
  const has = (v) => v != null && v !== '' && !Number.isNaN(v);
  if (!has(weight) || !has(pace) || (!has(distance) && !has(time))) return null;
  if (!inRange(weight, LIMITS.weight)) return { error: '몸무게는 25~250kg 사이로 넣어 주세요.' };
  if (!inRange(pace, LIMITS.pace)) return { error: '페이스는 2:00~12:30/km 사이로 넣어 주세요.' };
  if (has(distance)) {
    if (!inRange(distance, LIMITS.distance)) return { error: '거리는 0.1~100km 사이로 넣어 주세요.' };
    time = distance * pace;
  } else {
    if (!inRange(time, LIMITS.time)) return { error: '시간은 1분~24시간 사이로 넣어 주세요.' };
    distance = time / pace;
  }
  const speed = speedOf(pace), vo2 = vo2Run(speed), min = time / 60;
  const kcal = kcalPerMin(vo2, weight) * min;
  const rest = kcalPerMin(REST_VO2, weight) * min;
  return { kcal, rest, net: kcal - rest, distance, time, speed, vo2, slow: speed < RUN_MIN_SPEED };
}

// 밥 몇 공기인지 (0.1 단위)
export const riceBowls = (kcal) => Math.round((kcal / RICE_KCAL) * 10) / 10;
