// 화면 색(테마)을 고르는 화면의 문장. 한국어 해요체.
//
// 문장의 기준은 docs/v4/features/copy.md "화면 색"이다. 여기를 고치면 그 표도 같이 고친다.
import type { ThemeName } from '../theme/colors';

export const themeCopy = {
  /** 화면 맨 위 로고 오른쪽의 버튼. 고르는 화면을 연다. */
  open: '화면 색',
  title: '화면 색',
  intro: '앱 화면의 색을 골라요. 고른 색은 이 기기에만 저장돼요.',
  names: {
    volt: '볼트',
    nightSky: '밤하늘',
    sunset: '노을',
  } satisfies Record<ThemeName, string>,
  saveFailed: '이 기기에 저장하지 못했어요. 앱을 다시 열면 전에 고른 색으로 보여요.',
  back: '돌아가기',
} as const;
