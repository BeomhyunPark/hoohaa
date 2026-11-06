import { flatten } from '../src/record/fields';
import type { RawValue, WorkoutRecord } from '../src/record/types';

/** 원본 경로 패턴 → 그 값이 기록의 어디에 어떤 단위로 들어갔는지 확인하는 함수. */
export type FieldRule = [RegExp, (value: RawValue, match: RegExpMatchArray) => void];

/**
 * 원본의 모든 항목(펼친 경로 하나하나)이 기록 어딘가에 남았는지 본다.
 * extra에 원본 경로 그대로 있거나, rules의 한 줄이 이름 붙은 자리를 확인해야 한다. 둘 다 아니면 버려진 항목이다.
 */
export function expectEveryFieldKept(raw: unknown, record: WorkoutRecord, rules: FieldRule[]): void {
  const missing: string[] = [];
  for (const [path, value] of flatten(raw)) {
    if (path in record.extra) {
      expect(record.extra[path]).toEqual(value);
      continue;
    }
    const rule = rules.map(([re, check]) => [path.match(re), check] as const).find(([m]) => m);
    if (!rule) {
      missing.push(path);
      continue;
    }
    rule[1](value, rule[0]!);
  }
  expect(missing).toEqual([]);
}

export function rec<T>(value: T | null | undefined): T {
  if (value === null || value === undefined) throw new Error('값이 없다');
  return value;
}
