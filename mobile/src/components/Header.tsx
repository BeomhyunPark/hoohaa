// 화면 맨 위 줄: 왼쪽에 로고, 오른쪽에 "화면 색" 버튼(onOpenTheme가 있을 때만).
import { Pressable, StyleSheet, Text, View } from 'react-native';

import { themeCopy } from '../copy/theme';
import type { ThemeColors } from '../theme/colors';
import { useColors, useThemedStyles } from '../theme/theme';
import { font, MIN_TOUCH } from '../theme/tokens';
import { Wordmark } from './Wordmark';

export function Header({ onOpenTheme }: { onOpenTheme?: () => void }) {
  const s = useThemedStyles(makeStyles);
  const c = useColors();
  return (
    <View style={s.row}>
      <Wordmark />
      {onOpenTheme && (
        <Pressable accessibilityRole="button" onPress={onOpenTheme} hitSlop={4} style={({ pressed }) => [s.btn, pressed && s.pressed]}>
          <View style={s.dot} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
            <View style={[s.half, { backgroundColor: c.accent }]} />
          </View>
          <Text style={s.label}>{themeCopy.open}</Text>
        </Pressable>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    row: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between', minHeight: MIN_TOUCH - 4 },
    btn: {
      minHeight: MIN_TOUCH - 4,
      minWidth: 44,
      flexDirection: 'row',
      alignItems: 'center',
      gap: 6,
      paddingHorizontal: 12,
      borderRadius: 999,
      borderWidth: 1,
      borderColor: c.border,
    },
    pressed: { opacity: 0.6 },
    dot: { width: 14, height: 14, borderRadius: 7, overflow: 'hidden', backgroundColor: c.surface, borderWidth: 1, borderColor: c.borderStrong, flexDirection: 'row' },
    half: { width: 7, height: 14 },
    label: { fontSize: 13, color: c.textSecondary, ...font(500) },
  });
