// 고른 화면 색(테마)을 기기에 남긴다. 계정과 서버는 없어서 이 기기에만 있다.
// 저장된 값이 없거나 모르는 이름이면 기본(볼트)이다. 읽지 못해도 앱은 기본 색으로 뜬다.
import AsyncStorage from '@react-native-async-storage/async-storage';

import { DEFAULT_THEME, THEMES, type ThemeName } from './colors';

export const THEME_KEY = 'hoohaa/theme';

const known = (v: unknown): v is ThemeName => typeof v === 'string' && Object.hasOwn(THEMES, v);

export async function loadThemeName(): Promise<ThemeName> {
  try {
    const v = await AsyncStorage.getItem(THEME_KEY);
    return known(v) ? v : DEFAULT_THEME;
  } catch {
    return DEFAULT_THEME;
  }
}

/** 저장하지 못하면 reject한다. 화면 색은 그래도 이번에는 바뀐다(부르는 쪽이 알린다). */
export async function saveThemeName(name: ThemeName): Promise<void> {
  await AsyncStorage.setItem(THEME_KEY, name);
}
