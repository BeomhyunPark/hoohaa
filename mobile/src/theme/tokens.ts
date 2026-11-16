// 색이 아닌 공통 값: 누르는 영역, 여백, 모서리, 숫자 글꼴. 기준은 docs/screenshots/v4/design/notes.png다.
import type { TextStyle } from 'react-native';

/** 누르는 영역의 가장 작은 크기(pt). 접근성 기준 44pt보다 조금 크게 둔다. */
export const MIN_TOUCH = 48;

/** 화면 좌우 여백과 구역 사이. */
export const SCREEN_PADDING = 20;
export const SECTION_GAP = 22;

export const RADIUS = { card: 20, button: 16, input: 14, track: 7 } as const;

/** 숫자는 폭이 같은 숫자로 쓴다. 기록이 바뀌어도 자리가 흔들리지 않는다. */
export const tabular: TextStyle = { fontVariant: ['tabular-nums'] };
