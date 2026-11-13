// 타입만 붙인다. 읽는 규칙은 웹의 src/engine/parse.js에 있다(복사하지 않는다).
// mobile/tsconfig.json의 paths가 @hoohaa/engine/parse.js를 이 파일로 연결한다.
// 폰 앱이 쓰는 것만 적었다.

export interface ClockError {
  error: string;
}

export interface ClockTime {
  sec: number;
  h: number;
  m: number;
  s: number;
}

/**
 * '28:32', '1:02:03', '2832' → 초. 빈칸은 null, 읽을 수 없으면 { error }.
 * zero: 'empty'(기본값)면 0은 빈칸처럼 null, 'error'면 오류.
 */
export function readTime(v: unknown, opts?: { zero?: 'empty' | 'error' }): ClockTime | ClockError | null;

/** 입력 중인 숫자에 콜론을 붙인다 (2832 → '28:32', 10203 → '1:02:03'). */
export function showTime(digits: string | number): string;
