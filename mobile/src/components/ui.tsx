// 화면들이 같이 쓰는 작은 조각: 버튼 세 가지와 상태 아이콘.
import type { ReactNode } from 'react';
import { Pressable, StyleSheet, Text, View, type PressableProps } from 'react-native';

import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/theme';
import { MIN_TOUCH, RADIUS } from '../theme/tokens';

type ButtonKind = 'primary' | 'outline' | 'text' | 'textDanger';

interface ButtonProps extends Omit<PressableProps, 'style' | 'children'> {
  label: string;
  kind: ButtonKind;
}

/**
 * primary: 화면마다 하나뿐인 주요 버튼(accent 바탕). 누를 수 없으면 올린 면 바탕에 흐린 글자다.
 * outline: 그 밖의 버튼(테두리). text, textDanger: 글자만 있는 버튼.
 * 누르는 영역은 모두 높이 MIN_TOUCH 이상이다.
 */
export function Button({ label, kind, disabled, ...rest }: ButtonProps) {
  const s = useThemedStyles(makeButtonStyles);
  const off = kind === 'primary' && !!disabled;
  return (
    <Pressable
      accessibilityRole="button"
      disabled={disabled}
      {...rest}
      style={({ pressed }) => [s.base, s[kind], off && s.off, pressed && s.pressed]}
    >
      <Text style={[s.label, s[`${kind}Text`], off && s.offText]}>{label}</Text>
    </Pressable>
  );
}

const makeButtonStyles = (c: ThemeColors) =>
  StyleSheet.create({
    base: {
      minHeight: MIN_TOUCH + 4,
      alignItems: 'center',
      justifyContent: 'center',
      borderRadius: RADIUS.button,
      paddingHorizontal: 16,
    },
    primary: { minHeight: 56, backgroundColor: c.accent },
    outline: { borderWidth: 1, borderColor: c.borderStrong },
    text: { minHeight: MIN_TOUCH, paddingHorizontal: 8 },
    textDanger: { minHeight: MIN_TOUCH, paddingHorizontal: 8 },
    off: { backgroundColor: c.raised },
    pressed: { opacity: 0.6 },
    label: { fontSize: 16, fontWeight: '700' },
    primaryText: { fontSize: 17, color: c.onAccent },
    outlineText: { color: c.textPrimary },
    textText: { fontSize: 15, color: c.textPrimary },
    textDangerText: { fontSize: 15, color: c.danger },
    offText: { color: c.textTertiary },
  });

/** 동그라미 안의 기호. 체크(성공)와 느낌표(오류). 뜻은 옆 문장이 전하므로 화면 낭독기는 읽지 않는다. */
export function StatusIcon({ kind, size = 20 }: { kind: 'success' | 'danger'; size?: number }) {
  const s = useThemedStyles(makeIconStyles);
  return (
    <View
      accessibilityElementsHidden
      importantForAccessibility="no-hide-descendants"
      aria-hidden
      style={[s.circle, { width: size, height: size, borderRadius: size / 2 }, kind === 'success' ? s.success : s.danger]}
    >
      <Text style={[s.mark, { fontSize: size * 0.62, lineHeight: size }]}>{kind === 'success' ? '✓' : '!'}</Text>
    </View>
  );
}

const makeIconStyles = (c: ThemeColors) =>
  StyleSheet.create({
    circle: { alignItems: 'center', justifyContent: 'center' },
    success: { backgroundColor: c.success },
    danger: { backgroundColor: c.danger },
    mark: { fontWeight: '800', color: c.bg, textAlign: 'center' },
  });

/** 아이콘과 문장 한 줄. 오류 안내와 "저장했어요"에 쓴다. */
export function StatusLine({ kind, children }: { kind: 'success' | 'danger'; children: ReactNode }) {
  return (
    // "저장했어요"는 버튼 위 가운데에, 오류 안내는 왼쪽부터 놓는다.
    <View style={{ flexDirection: 'row', alignItems: 'center', gap: 8, alignSelf: kind === 'success' ? 'center' : 'auto' }}>
      <StatusIcon kind={kind} size={kind === 'success' ? 22 : 16} />
      {children}
    </View>
  );
}
