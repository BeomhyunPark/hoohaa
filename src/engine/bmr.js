// 기초대사량(BMR)·TDEE 계산. /bmr/ 페이지가 쓴다. DOM 없음: `node src/engine/bmr.test.mjs`.
//
// BMR: Mifflin–St Jeor 공식
//   Mifflin MD, St Jeor ST, Hill LA, Scott BJ, Daugherty SA, Koh YO.
//   "A new predictive equation for resting energy expenditure in healthy individuals."
//   Am J Clin Nutr. 1990;51(2):241–247.
//   남자 = 10 × 몸무게(kg) + 6.25 × 키(cm) − 5 × 나이(세) + 5
//   여자 = 10 × 몸무게(kg) + 6.25 × 키(cm) − 5 × 나이(세) − 161
//
// TDEE = BMR × 활동량 계수.
//   계수 1.2 / 1.375 / 1.55 / 1.725 / 1.9는 영양·운동 분야에서 널리 쓰는 값이다(원래 Harris–Benedict 공식과 함께
//   퍼졌고, McArdle·Katch·Katch 『Exercise Physiology』 등이 출처로 자주 인용된다). 한 논문에서 정한 값은 아니다.
//
// 감량·유지·증량: TDEE −500 / TDEE / TDEE +300 kcal. 이 사이트가 정한 대략적인 출발점이고, 감량은 BMR 밑으로 내리지 않는다.

// 활동량 계수. 순서와 값은 bmr/index.html의 <select id="bAct"> 옵션과 같다 (bmr.test.mjs가 확인한다).
export const ACTIVITY = [
  { k: 1.2, label: '거의 운동 안 함 / 앉아서 생활' },
  { k: 1.375, label: '가벼운 활동 (주 1–3일)' },
  { k: 1.55, label: '보통 활동 (주 3–5일)' },
  { k: 1.725, label: '활발한 활동 (주 6–7일)' },
  { k: 1.9, label: '매우 활발 (하루 2회·육체노동)' },
];
export const DEFAULT_ACTIVITY = 1.55;

// 입력 범위 (페이지 입력칸의 min/max와 같다)
export const LIMITS = { age: [10, 100], height: [100, 230], weight: [25, 250] };
const inRange = (v, [lo, hi]) => v >= lo && v <= hi;
export const validInput = ({ age, height, weight }) =>
  inRange(age, LIMITS.age) && inRange(height, LIMITS.height) && inRange(weight, LIMITS.weight);

// sex: 'm' | 'f'. 반올림하지 않은 kcal
export const bmrMifflin = ({ sex, weight, height, age }) => 10 * weight + 6.25 * height - 5 * age + (sex === 'm' ? 5 : -161);
export const tdee = (bmr, factor) => bmr * factor;
export const goals = (bmr, t) => ({ cut: Math.max(t - 500, bmr), keep: t, bulk: t + 300 });

// 한 번에: 범위 밖이면 null
export function energy({ sex, age, height, weight, factor }) {
  if (!validInput({ age, height, weight })) return null;
  const bmr = bmrMifflin({ sex, weight, height, age }), t = tdee(bmr, factor);
  return { bmr, tdee: t, ...goals(bmr, t) };
}
