// 원본을 경로 → 값으로 펼친 뒤, 기록에 이름이 있는 항목만 꺼내고 남은 것은 전부 extra로 넘긴다.
// 꺼내지 않은 항목은 자동으로 남으므로, 변환 함수가 새 항목을 몰라도 버려지지 않는다.
import type { RawValue } from './types';

/** 객체·배열을 "a.b.0.c" 같은 경로로 펼친다. undefined는 원본에 없는 항목이라 넣지 않는다. */
export function flatten(value: unknown, prefix = '', out = new Map<string, RawValue>()): Map<string, RawValue> {
  if (value === undefined) return out;
  if (value === null || typeof value !== 'object') {
    if (typeof value === 'string' || typeof value === 'number' || typeof value === 'boolean' || value === null) {
      out.set(prefix, value);
    } else {
      out.set(prefix, String(value));
    }
    return out;
  }
  const entries: [string, unknown][] = Array.isArray(value)
    ? value.map((v, i) => [String(i), v])
    : Object.entries(value as Record<string, unknown>);
  for (const [k, v] of entries) flatten(v, prefix ? `${prefix}.${k}` : k, out);
  return out;
}

const SECONDS_PER: Record<string, number> = { s: 1, ms: 0.001, min: 60, hr: 3600 };
const METERS_PER: Record<string, number> = { m: 1, meters: 1, cm: 0.01, km: 1000, mi: 1609.344 };
const KCAL_PER: Record<string, number> = { kcal: 1, Cal: 1, cal: 0.001, kJ: 1 / 4.184 };

export class FieldTaker {
  private readonly fields: Map<string, RawValue>;

  constructor(raw: unknown) {
    this.fields = flatten(raw);
  }

  /** 꺼내지 않고 값만 본다. */
  peek(path: string): RawValue | undefined {
    return this.fields.get(path);
  }

  /** 경로의 값을 꺼낸다. 없으면 undefined. */
  take(path: string): RawValue | undefined {
    const v = this.fields.get(path);
    this.fields.delete(path);
    return v;
  }

  string(path: string): string | null {
    if (typeof this.fields.get(path) !== 'string') return null;
    return this.take(path) as string;
  }

  number(path: string): number | null {
    if (typeof this.fields.get(path) !== 'number') return null;
    return this.take(path) as number;
  }

  /**
   * { unit, quantity } 꼴의 값을 원하는 단위로 바꿔 꺼낸다. 단위를 모르면 꺼내지 않고 null을 돌려준다
   * (두 항목은 extra에 그대로 남는다).
   */
  private quantity(path: string, table: Record<string, number>): number | null {
    const unit = this.fields.get(`${path}.unit`);
    const q = this.fields.get(`${path}.quantity`);
    if (typeof unit !== 'string' || typeof q !== 'number' || !(unit in table)) return null;
    this.take(`${path}.unit`);
    this.take(`${path}.quantity`);
    return q * table[unit];
  }

  seconds(path: string): number | null {
    return this.quantity(path, SECONDS_PER);
  }

  meters(path: string): number | null {
    return this.quantity(path, METERS_PER);
  }

  kcal(path: string): number | null {
    return this.quantity(path, KCAL_PER);
  }

  /**
   * 헬스 커넥트 라이브러리의 길이 값 { inMeters, inKilometers, inMiles, inInches, inFeet }.
   * 같은 길이를 다른 단위로 다시 적은 것이라 미터 값 하나만 남기고 나머지 단위는 지운다.
   */
  lengthResult(path: string): number | null {
    const m = this.fields.get(`${path}.inMeters`);
    if (typeof m !== 'number') return null;
    for (const unit of ['inMeters', 'inKilometers', 'inMiles', 'inInches', 'inFeet']) this.take(`${path}.${unit}`);
    return m;
  }

  /** 꺼내지 않고 남은 항목 전부. */
  rest(): Record<string, RawValue> {
    return Object.fromEntries(this.fields);
  }
}
