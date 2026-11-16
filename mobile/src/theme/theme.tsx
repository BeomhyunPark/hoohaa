// 화면이 테마를 받는 한 곳. App.tsx가 고른 테마 이름을 ThemeProvider에 넘긴다(기본은 볼트).
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DEFAULT_THEME, THEMES, type ThemeColors, type ThemeName } from './colors';

const ThemeContext = createContext<{ name: ThemeName; colors: ThemeColors }>({ name: DEFAULT_THEME, colors: THEMES[DEFAULT_THEME] });

export function ThemeProvider({ name = DEFAULT_THEME, children }: { name?: ThemeName; children: ReactNode }) {
  const value = useMemo(() => ({ name, colors: THEMES[name] }), [name]);
  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
}

export const useColors = () => useContext(ThemeContext).colors;
export const useThemeName = () => useContext(ThemeContext).name;

/** 색에 따라 달라지는 스타일을 테마가 바뀔 때만 다시 만든다. */
export function useThemedStyles<T>(make: (colors: ThemeColors) => T): T {
  const colors = useColors();
  return useMemo(() => make(colors), [colors, make]);
}
