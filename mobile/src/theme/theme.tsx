// 화면이 테마를 받는 한 곳. 지금은 기본 테마(볼트) 하나로만 그린다.
// 테마를 고르는 화면이 생기면 App.tsx에서 ThemeProvider의 name만 바꿔 넣는다.
import { createContext, useContext, useMemo, type ReactNode } from 'react';

import { DEFAULT_THEME, THEMES, type ThemeColors, type ThemeName } from './colors';

const ThemeContext = createContext<ThemeColors>(THEMES[DEFAULT_THEME]);

export function ThemeProvider({ name = DEFAULT_THEME, children }: { name?: ThemeName; children: ReactNode }) {
  return <ThemeContext.Provider value={THEMES[name]}>{children}</ThemeContext.Provider>;
}

export const useColors = () => useContext(ThemeContext);

/** 색에 따라 달라지는 스타일을 테마가 바뀔 때만 다시 만든다. */
export function useThemedStyles<T>(make: (colors: ThemeColors) => T): T {
  const colors = useColors();
  return useMemo(() => make(colors), [colors, make]);
}
