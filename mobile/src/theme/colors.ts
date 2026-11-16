// 앱의 색. 화면은 색 값을 직접 쓰지 않고 여기의 역할 이름만 쓴다.
//
// 테마는 볼트, 밤하늘, 노을 세 개이고 모두 어두운 화면이다. 기본은 볼트다(사용자 결정, 2026-11-13).
// 테마를 고르는 화면과 고른 값을 저장하는 일은 아직 없다. 화면은 테마를 ThemeProvider 한 곳에서 받는다(theme.tsx).
//
// 기준은 피그마 "03 폰 앱 시안"의 변수 모음 "hoohaa app/color"와 docs/screenshots/v4/design/notes.png다.
// 역할:
// - accent는 주요 버튼(저장)에만 쓴다.
// - rpe(체감 피로 1~10 단계 색)는 피로 슬라이더, 고른 값 알약, 저장한 피로 값에만 쓴다.
// - success와 danger는 늘 아이콘이나 문장과 함께 쓴다. 색만으로 뜻을 전하지 않는다.
// 티어 색(웹의 .t-*)과는 섞지 않는다. 티어 색은 티어 카드에만, 피로 색은 피로 칸에만 쓴다.

export type ThemeName = 'volt' | 'nightSky' | 'sunset';

export interface ThemeColors {
  /** 화면 바탕 */
  bg: string;
  /** 카드 면, 입력칸 면 */
  surface: string;
  /** 카드 위에 올린 면(칩), 아직 못 누르는 저장 버튼 */
  raised: string;
  /** 카드 테두리, 구분선 */
  border: string;
  /** 입력칸과 테두리 버튼의 테두리 */
  borderStrong: string;
  /** 본문, 제목, 값 */
  textPrimary: string;
  /** 날짜, 라벨, 단위, 질문 */
  textSecondary: string;
  /** 흐린 글자: 항목 라벨, 눈금, 자리 표시, 안내 */
  textTertiary: string;
  /** 저장 버튼에만 */
  accent: string;
  /** accent 위 글자 */
  onAccent: string;
  /** "저장했어요"와 체크 */
  success: string;
  /** 오류 안내 */
  danger: string;
  /** 키보드 초점 고리 */
  focus: string;
  /** rpe 색 위 글자 */
  onRpe: string;
  /** 체감 피로 1~10 단계 색. rpe[0]이 1이다. */
  rpe: readonly string[];
}

export const THEMES: Record<ThemeName, ThemeColors> = {
  volt: {
    bg: '#0D0D0B',
    surface: '#23231F',
    raised: '#383831',
    border: '#48483F',
    borderStrong: '#77776C',
    textPrimary: '#F6F6F1',
    textSecondary: '#C5C5BB',
    textTertiary: '#A3A397',
    accent: '#C8F03C',
    onAccent: '#0D0D0B',
    success: '#3CCB7F',
    danger: '#FF7B72',
    focus: '#FFFFFF',
    onRpe: '#0D0D0B',
    rpe: ['#CFEC88', '#D9DF6C', '#E3D14F', '#EDC130', '#F5B004', '#FC9F00', '#FF8D00', '#FF7A0F', '#FF6730', '#FF5448'],
  },
  nightSky: {
    bg: '#0A0F16',
    surface: '#1A2635',
    raised: '#2B3B50',
    border: '#3A4B62',
    borderStrong: '#64768E',
    textPrimary: '#F4F6F8',
    textSecondary: '#B8C2CF',
    // 시안 값 #97A4B5는 올린 면 위에서 4.497:1이라 4.5에 못 미쳐 아주 조금 밝혔다.
    textTertiary: '#99A6B7',
    accent: '#3DC8F5',
    onAccent: '#0A0F16',
    success: '#3CCB7F',
    danger: '#FF7B72',
    focus: '#FFFFFF',
    onRpe: '#0A0F16',
    rpe: ['#8EDEFE', '#8FD3FF', '#9BC6FF', '#AEB7FF', '#C2A7FF', '#D697F5', '#E787DB', '#F578B9', '#FD6C90', '#FF645F'],
  },
  sunset: {
    bg: '#120E13',
    surface: '#291F2B',
    raised: '#3E3141',
    border: '#4F4153',
    borderStrong: '#847589',
    textPrimary: '#F8F3F5',
    textSecondary: '#CFC3CC',
    textTertiary: '#AFA0AB',
    accent: '#FF5C8A',
    onAccent: '#120E13',
    success: '#3CCB7F',
    danger: '#FF8A4C',
    focus: '#FFFFFF',
    onRpe: '#120E13',
    rpe: ['#FAD8AB', '#FDCA98', '#FFBC89', '#FFAC7E', '#FF9B77', '#FF8A76', '#FF797A', '#FF6781', '#FA568C', '#F14499'],
  },
};

export const DEFAULT_THEME: ThemeName = 'volt';

/** 체감 피로 값(1~10)의 색. */
export const rpeColor = (colors: ThemeColors, value: number) => colors.rpe[value - 1];

/** WCAG 2 상대 밝기. '#RRGGBB'만 받는다. */
function luminance(hex: string): number {
  const channel = (i: number) => {
    const c = parseInt(hex.slice(i, i + 2), 16) / 255;
    return c <= 0.04045 ? c / 12.92 : ((c + 0.055) / 1.055) ** 2.4;
  };
  return 0.2126 * channel(1) + 0.7152 * channel(3) + 0.0722 * channel(5);
}

/** 두 색의 대비(1~21). 본문 글자는 4.5 이상이어야 한다. */
export function contrastRatio(a: string, b: string): number {
  const [hi, lo] = [luminance(a), luminance(b)].sort((x, y) => y - x);
  return (hi + 0.05) / (lo + 0.05);
}
