// 체감 피로 1~10을 고르는 슬라이더. 값은 1~10 정수에만 붙고, 처음에는 값이 없다(null).
//
// - 트랙은 10칸이고 칸마다 그 단계의 피로 색이다. 값이 없으면 흐리게(45%), 고르면 고른 칸까지 진하게, 나머지는 25%.
// - 트랙을 누르거나 끌면 그 자리의 값이 골라지고 손잡이가 생긴다. 누르는 영역은 전체 폭 × 44 이상이다.
// - 눈금 숫자와 양 끝 글자는 표시용이다.
// - 화면 낭독기에는 조절할 수 있는 요소 하나다(role slider). 올리기·내리기로 1씩 바뀌고, 값이 없을 때 올리면 1이 된다.
//   웹 번들에서도 slider 역할과 aria-value*로 나온다.
// 새 네이티브 의존성을 쓰지 않으려고 React Native의 터치 응답(responder)으로 만들었다.
import { useRef, useState } from 'react';
import { StyleSheet, Text, View, type AccessibilityActionEvent, type GestureResponderEvent, type LayoutChangeEvent } from 'react-native';

import { afterRunCopy as copy, EXERTION_MAX, EXERTION_MIN, exertionButtonLabel } from '../copy/after-run';
import { rpeColor, type ThemeColors } from '../theme/colors';
import { useColors, useThemedStyles } from '../theme/theme';
import { MIN_TOUCH, RADIUS, tabular } from '../theme/tokens';

const STEPS = Array.from({ length: EXERTION_MAX - EXERTION_MIN + 1 }, (_, i) => EXERTION_MIN + i);
const GAP = 2;
const TRACK_HEIGHT = 14;
const THUMB = 32;

/** 트랙 위의 가로 위치(0 ~ width) → 값. 칸 사이 틈은 가까운 칸으로 간다. */
export function valueAt(x: number, width: number): number {
  if (!(width > 0)) return EXERTION_MIN;
  const step = Math.floor((x / width) * STEPS.length) + EXERTION_MIN;
  return Math.min(EXERTION_MAX, Math.max(EXERTION_MIN, step));
}

interface Props {
  value: number | null;
  onChange: (value: number) => void;
}

export function ExertionSlider({ value, onChange }: Props) {
  const colors = useColors();
  const s = useThemedStyles(makeStyles);
  const [width, setWidth] = useState(0);
  // 끄는 중에는 같은 값을 여러 번 알리지 않는다.
  const last = useRef<number | null>(null);

  function pick(e: GestureResponderEvent) {
    const next = valueAt(e.nativeEvent.locationX, width);
    if (next !== last.current) {
      last.current = next;
      onChange(next);
    }
  }

  function onAction(e: AccessibilityActionEvent) {
    if (e.nativeEvent.actionName === 'increment') onChange(value === null ? EXERTION_MIN : Math.min(EXERTION_MAX, value + 1));
    if (e.nativeEvent.actionName === 'decrement' && value !== null) onChange(Math.max(EXERTION_MIN, value - 1));
  }

  const segment = width > 0 ? (width - GAP * (STEPS.length - 1)) / STEPS.length : 0;
  const thumbLeft = value === null ? 0 : (value - EXERTION_MIN) * (segment + GAP) + segment / 2 - THUMB / 2;

  return (
    <View style={s.wrap}>
      <View
        testID="exertion-slider"
        role="slider"
        accessible
        aria-label={copy.exertionGroupLabel}
        accessibilityHint={copy.exertionScale}
        aria-valuemin={EXERTION_MIN}
        aria-valuemax={EXERTION_MAX}
        aria-valuenow={value ?? undefined}
        aria-valuetext={value === null ? undefined : exertionButtonLabel(value)}
        accessibilityActions={[{ name: 'increment' }, { name: 'decrement' }]}
        onAccessibilityAction={onAction}
        onLayout={(e: LayoutChangeEvent) => setWidth(e.nativeEvent.layout.width)}
        onStartShouldSetResponder={() => true}
        onMoveShouldSetResponder={() => true}
        onResponderTerminationRequest={() => false}
        onResponderGrant={(e) => {
          last.current = null;
          pick(e);
        }}
        onResponderMove={pick}
        style={s.hit}
      >
        <View style={s.track} pointerEvents="none">
          {STEPS.map((n) => (
            <View
              key={n}
              style={[
                s.segment,
                {
                  backgroundColor: rpeColor(colors, n),
                  opacity: value === null ? 0.45 : n <= value ? 1 : 0.25,
                },
              ]}
            />
          ))}
        </View>
        {value !== null && width > 0 && <View pointerEvents="none" style={[s.thumb, { left: thumbLeft }]} />}
      </View>

      <View style={s.ticks} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {STEPS.map((n) => (
          <Text key={n} style={[s.tick, n === value && s.tickOn]}>
            {n}
          </Text>
        ))}
      </View>
      <View style={s.ends} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        <Text style={s.end}>{copy.exertionLowest}</Text>
        <Text style={s.end}>{copy.exertionHighest}</Text>
      </View>
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    wrap: { gap: 2 },
    hit: { minHeight: Math.max(44, MIN_TOUCH), justifyContent: 'center' },
    track: {
      flexDirection: 'row',
      gap: GAP,
      height: TRACK_HEIGHT,
      borderRadius: RADIUS.track,
      overflow: 'hidden',
    },
    segment: { flex: 1, height: TRACK_HEIGHT },
    thumb: {
      position: 'absolute',
      top: (Math.max(44, MIN_TOUCH) - THUMB) / 2,
      width: THUMB,
      height: THUMB,
      borderRadius: THUMB / 2,
      backgroundColor: c.textPrimary,
      borderWidth: 3,
      borderColor: c.bg,
    },
    ticks: { flexDirection: 'row', gap: GAP },
    tick: {
      flex: 1,
      textAlign: 'center',
      fontSize: 13,
      fontWeight: '500',
      color: c.textTertiary,
      ...tabular,
    },
    tickOn: { fontWeight: '700', color: c.textPrimary },
    ends: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      paddingTop: 8,
    },
    end: { fontSize: 13, color: c.textSecondary },
  });
