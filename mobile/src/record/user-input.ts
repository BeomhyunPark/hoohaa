// 사용자가 넣은 체감 피로와 메모를 기록에 붙인다. 원래 기록은 바꾸지 않고 새 기록을 돌려준다.
// 메모를 해석하지 않는다(통증 키워드는 서버의 판단 규칙이 본다).
import type { WorkoutRecord } from './types';

export function isPerceivedExertion(value: unknown): value is number {
  return typeof value === 'number' && Number.isInteger(value) && value >= 1 && value <= 10;
}

/** 체감 피로는 1~10의 정수여야 한다. 메모는 앞뒤 빈칸을 떼고, 비어 있으면 null로 둔다. */
export function withUserInput(record: WorkoutRecord, input: { perceivedExertion: number; memo: string }): WorkoutRecord {
  if (!isPerceivedExertion(input.perceivedExertion)) {
    throw new RangeError(`체감 피로는 1~10의 정수여야 한다: ${input.perceivedExertion}`);
  }
  const memo = input.memo.trim();
  return { ...record, userInput: { perceivedExertion: input.perceivedExertion, memo: memo === '' ? null : memo } };
}
