// 테마마다 글자와 그 글자가 놓이는 면의 대비가 4.5:1 이상인지 본다(WCAG AA 본문 기준).
import { contrastRatio, DEFAULT_THEME, THEMES, type ThemeName } from '../src/theme/colors';

const names = Object.keys(THEMES) as ThemeName[];

test('기본 테마는 볼트다', () => {
  expect(DEFAULT_THEME).toBe('volt');
});

test('대비 계산: 검정과 흰색은 21, 같은 색은 1', () => {
  expect(contrastRatio('#000000', '#FFFFFF')).toBeCloseTo(21, 5);
  expect(contrastRatio('#3DC8F5', '#3DC8F5')).toBeCloseTo(1, 5);
});

describe.each(names)('테마 %s', (name) => {
  const c = THEMES[name];
  const pairs: [string, string, string][] = [
    ['본문 / 바탕', c.textPrimary, c.bg],
    ['본문 / 카드', c.textPrimary, c.surface],
    ['보조 / 바탕', c.textSecondary, c.bg],
    ['보조 / 카드', c.textSecondary, c.surface],
    ['흐린 글자 / 바탕', c.textTertiary, c.bg],
    ['흐린 글자 / 카드', c.textTertiary, c.surface],
    ['흐린 글자 / 올린 면 (못 누르는 저장 버튼)', c.textTertiary, c.raised],
    ['버튼 글자 / 강조', c.onAccent, c.accent],
    ['성공 / 바탕', c.success, c.bg],
    ['오류 / 바탕', c.danger, c.bg],
    ...c.rpe.map((r, i): [string, string, string] => [`알약 글자 / 피로 ${i + 1}`, c.onRpe, r]),
    ...c.rpe.map((r, i): [string, string, string] => [`저장한 피로 ${i + 1} / 카드`, r, c.surface]),
  ];

  test.each(pairs)('%s: 4.5 이상', (_what, fg, bg) => {
    expect(contrastRatio(fg, bg)).toBeGreaterThanOrEqual(4.5);
  });

  test('피로 색은 10단계이고 모두 다르다', () => {
    expect(c.rpe).toHaveLength(10);
    expect(new Set(c.rpe).size).toBe(10);
  });
});
