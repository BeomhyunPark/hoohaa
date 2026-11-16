// hoohaa 워드마크(투표 1등 로고, 평면 2색). 테마마다 스톱워치 얼굴이 그 테마의 강조색이다.
// 새 네이티브 의존성(SVG)을 쓰지 않으려고 PNG(@2x, @3x)로 넣었다. 원본과 만드는 법은 tools/build_logo.mjs다.
import { Image, StyleSheet } from 'react-native';

import type { ThemeName } from '../theme/colors';
import { useThemeName } from '../theme/theme';

/** 워드마크의 가로세로 비(원본 viewBox). tools/build_logo.mjs가 만든 PNG와 같다. */
export const WORDMARK_ASPECT = 348.8 / 81;
export const WORDMARK_HEIGHT = 20;

const FILES: Record<ThemeName, number> = {
  volt: require('../../assets/logo/wordmark-volt.png'),
  nightSky: require('../../assets/logo/wordmark-nightSky.png'),
  sunset: require('../../assets/logo/wordmark-sunset.png'),
};

export function Wordmark({ height = WORDMARK_HEIGHT }: { height?: number }) {
  const name = useThemeName();
  return (
    <Image
      source={FILES[name]}
      accessible
      accessibilityRole="image"
      accessibilityLabel="hoohaa"
      resizeMode="contain"
      style={[styles.mark, { height, width: height * WORDMARK_ASPECT }]}
    />
  );
}

const styles = StyleSheet.create({ mark: { alignSelf: 'flex-start' } });
