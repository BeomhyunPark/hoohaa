// 화면 색(테마)을 고르는 화면. 테마 셋을 각자 자기 색으로 그린 작은 미리보기로 보여 주고, 누르면 바로 바뀐다.
// 고른 값은 onChange로 넘긴다(App.tsx가 기기에 저장한다). 저장에 실패하면 saveFailed로 알린다.
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header } from '../components/Header';
import { Button, StatusLine } from '../components/ui';
import { themeCopy as copy } from '../copy/theme';
import { THEMES, type ThemeColors, type ThemeName } from '../theme/colors';
import { useThemeName, useThemedStyles } from '../theme/theme';
import { font, MIN_TOUCH, RADIUS, SCREEN_PADDING, SECTION_GAP } from '../theme/tokens';

const ORDER: ThemeName[] = ['volt', 'nightSky', 'sunset'];

interface Props {
  onChange: (name: ThemeName) => void;
  onBack: () => void;
  /** 고른 색을 기기에 저장하지 못했을 때 true. */
  saveFailed?: boolean;
}

export function ThemeScreen({ onChange, onBack, saveFailed }: Props) {
  const s = useThemedStyles(makeStyles);
  const current = useThemeName();
  return (
    <ScrollView contentContainerStyle={s.content}>
      <Header />
      <View style={s.head}>
        <Text style={s.title} accessibilityRole="header">
          {copy.title}
        </Text>
        <Text style={s.intro}>{copy.intro}</Text>
      </View>

      <View accessibilityRole="radiogroup" accessibilityLabel={copy.title} style={s.list}>
        {ORDER.map((name) => {
          const selected = name === current;
          return (
            <Pressable
              key={name}
              accessibilityRole="radio"
              accessibilityLabel={copy.names[name]}
              aria-checked={selected}
              onPress={() => onChange(name)}
              style={({ pressed }) => [s.option, selected && s.optionOn, pressed && s.pressed]}
            >
              <Preview c={THEMES[name]} />
              <View style={s.optionRow}>
                <Text style={s.optionName}>{copy.names[name]}</Text>
                <View style={[s.radio, selected && s.radioOn]} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
                  {selected && <View style={s.radioDot} />}
                </View>
              </View>
            </Pressable>
          );
        })}
      </View>

      {saveFailed && (
        <StatusLine kind="danger">
          <Text style={s.error} accessibilityRole="alert">
            {copy.saveFailed}
          </Text>
        </StatusLine>
      )}
      <Button kind="outline" label={copy.back} onPress={onBack} />
    </ScrollView>
  );
}

/** 그 테마의 색으로 그린 작은 화면: 바탕, 카드, 피로 색 막대, 저장 버튼. 그림일 뿐이라 화면 낭독기는 읽지 않는다. */
function Preview({ c }: { c: ThemeColors }) {
  return (
    <View style={[p.screen, { backgroundColor: c.bg, borderColor: c.border }]} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
      <View style={[p.card, { backgroundColor: c.surface, borderColor: c.border }]}>
        <View style={[p.line, { width: '28%', backgroundColor: c.textSecondary }]} />
        <View style={[p.big, { backgroundColor: c.textPrimary }]} />
        <View style={p.bar}>
          {c.rpe.map((r, i) => (
            <View key={r} style={[p.step, { backgroundColor: r, opacity: i < 7 ? 1 : 0.25 }]} />
          ))}
        </View>
      </View>
      <View style={[p.button, { backgroundColor: c.accent }]}>
        <View style={[p.line, { width: 28, backgroundColor: c.onAccent }]} />
      </View>
    </View>
  );
}

const p = StyleSheet.create({
  screen: { borderRadius: 14, borderWidth: 1, padding: 12, gap: 10 },
  card: { borderRadius: 10, borderWidth: 1, padding: 10, gap: 8 },
  line: { height: 5, borderRadius: 3 },
  big: { width: '46%', height: 14, borderRadius: 4 },
  bar: { flexDirection: 'row', gap: 2, height: 6, borderRadius: 3, overflow: 'hidden' },
  step: { flex: 1 },
  button: { height: 22, borderRadius: 8, alignItems: 'center', justifyContent: 'center' },
});

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: { flexGrow: 1, paddingHorizontal: SCREEN_PADDING, paddingTop: 10, paddingBottom: 40, gap: SECTION_GAP, backgroundColor: c.bg },
    head: { gap: 4 },
    title: { fontSize: 24, lineHeight: 32, color: c.textPrimary, ...font(700) },
    intro: { fontSize: 14, lineHeight: 20, color: c.textSecondary, ...font(400) },
    list: { gap: 12 },
    option: { minHeight: MIN_TOUCH, borderRadius: RADIUS.card, borderWidth: 1, borderColor: c.border, backgroundColor: c.surface, padding: 14, gap: 12 },
    optionOn: { borderColor: c.textPrimary, borderWidth: 2, padding: 13 },
    pressed: { opacity: 0.7 },
    optionRow: { flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
    optionName: { fontSize: 17, color: c.textPrimary, ...font(700) },
    radio: { width: 22, height: 22, borderRadius: 11, borderWidth: 2, borderColor: c.borderStrong, alignItems: 'center', justifyContent: 'center' },
    radioOn: { borderColor: c.textPrimary },
    radioDot: { width: 10, height: 10, borderRadius: 5, backgroundColor: c.textPrimary },
    error: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: c.danger, ...font(400) },
  });
