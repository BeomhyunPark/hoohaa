// 운동이 끝난 뒤 첫 화면. 건강 앱에서 읽은 기록을 짧게 보여 주고, 체감 피로(필수)와 메모(선택)를 받아 기록에 붙인다.
//
// 체감 피로는 기록마다 한 번만 묻는다. 읽은 기록에 이미 저장해 둔 체감 피로가 있으면(앱을 닫았다 열었을 때 등)
// 묻지 않고 저장된 값을 보여 준다. 저장해 둔 값은 저장소(RecordStore)가 가져온 곳과 그곳의 기록 번호로 찾는다.
// 저장한 뒤에도 사용자가 "수정"을 눌러 체감 피로와 메모를 고칠 수 있다. 앱이 다시 묻지는 않는다.
//
// 컨디션, 목표, 내일 훈련, 통증 판단은 서버가 생긴 다음이라 여기서 보여 주지 않는다.
import { useEffect, useState } from 'react';
import {
  AccessibilityInfo,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';

import { afterRunCopy as copy, EXERTION_MAX, EXERTION_MIN, exertionButtonLabel } from '../copy/after-run';
import type { HealthReader } from '../record/health-reader';
import type { RecordStore } from '../record/store';
import { summarize } from '../record/summary';
import type { WorkoutRecord } from '../record/types';
import { withUserInput } from '../record/user-input';

/** 누르는 영역의 가장 작은 크기(pt). 접근성 기준 44pt보다 조금 크게 둔다. */
export const MIN_TOUCH = 48;

/** 피로 버튼을 한 줄에 몇 개 둘지. 10개를 한 줄에 두면 좁은 폰에서 44pt가 안 된다. */
const PER_ROW = 5;

const EXERTION_ROWS: number[][] = [];
for (let v = EXERTION_MIN; v <= EXERTION_MAX; v += PER_ROW) {
  EXERTION_ROWS.push(Array.from({ length: Math.min(PER_ROW, EXERTION_MAX - v + 1) }, (_, i) => v + i));
}

/**
 * record는 지금까지의 기록이다(읽은 그대로이거나, 저장했으면 체감 피로와 메모가 붙은 것).
 * step: ask는 처음 묻는 중, saved는 저장한 뒤, edit는 저장한 값을 고치는 중.
 */
type Loaded =
  | { status: 'loading' }
  | { status: 'none' }
  | { status: 'failed' }
  | { status: 'ready'; record: WorkoutRecord; step: 'ask' | 'saved' | 'edit' };

interface Props {
  reader: HealthReader;
  store: RecordStore;
}

export function AfterRunScreen({ reader, store }: Props) {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [exertion, setExertion] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /** 이 화면에서 방금 저장했는지. 다시 들어온 기록의 "저장했어요"는 화면 낭독기가 새 소식처럼 읽지 않게 한다. */
  const [savedNow, setSavedNow] = useState(false);

  useEffect(() => {
    let current = true;
    setLoaded({ status: 'loading' });
    readWithSavedInput(reader, store).then(
      (next) => {
        if (current) setLoaded(next);
      },
      () => {
        if (current) setLoaded({ status: 'failed' });
      },
    );
    return () => {
      current = false;
    };
  }, [reader, store, attempt]);

  const step = loaded.status === 'ready' ? loaded.step : null;
  const asking = step === 'ask' || step === 'edit';
  const canSave = asking && exertion !== null && !saving;

  async function save() {
    if (loaded.status !== 'ready' || !asking || exertion === null || saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const record = withUserInput(loaded.record, { perceivedExertion: exertion, memo });
      await store.save(record);
      setLoaded({ status: 'ready', record, step: 'saved' });
      setSavedNow(true);
      // 안드로이드와 웹은 아래 aria-live가 읽어 준다. 아이폰에는 그 속성이 없다.
      if (Platform.OS === 'ios') AccessibilityInfo.announceForAccessibility(copy.saved);
    } catch {
      setSaveFailed(true);
    } finally {
      setSaving(false);
    }
  }

  /** 저장한 값을 채운 채로 묻는 칸을 다시 연다. */
  function startEdit() {
    if (loaded.status !== 'ready' || loaded.step !== 'saved') return;
    setExertion(loaded.record.userInput.perceivedExertion);
    setMemo(loaded.record.userInput.memo ?? '');
    setSaveFailed(false);
    setLoaded({ ...loaded, step: 'edit' });
  }

  /** 고치던 것을 버리고 저장된 값으로 돌아간다. */
  function cancelEdit() {
    if (loaded.status !== 'ready' || loaded.step !== 'edit' || saving) return;
    setSaveFailed(false);
    setLoaded({ ...loaded, step: 'saved' });
  }

  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>hoohaa</Text>

        {loaded.status === 'loading' && <Text style={styles.note}>{copy.loading}</Text>}
        {loaded.status === 'none' && <Text style={styles.note}>{copy.noRecord}</Text>}
        {loaded.status === 'failed' && (
          <View style={styles.section}>
            <Text style={styles.note} accessibilityRole="alert">
              {copy.readFailed}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={() => setAttempt((n) => n + 1)}
              style={({ pressed }) => [styles.button, styles.buttonOutline, pressed && styles.pressed]}
            >
              <Text style={styles.buttonOutlineText}>{copy.retryRead}</Text>
            </Pressable>
          </View>
        )}

        {loaded.status === 'ready' && <RecordCard record={loaded.record} showUserInput={step === 'saved'} />}

        {asking && (
          <>
            <View style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {copy.exertionTitle}
              </Text>
              <Text style={styles.body}>{copy.exertionQuestion}</Text>
              <Text style={styles.hint}>{copy.exertionScale}</Text>
              <View accessibilityRole="radiogroup" accessibilityLabel={copy.exertionGroupLabel} style={styles.scale}>
                {EXERTION_ROWS.map((row) => (
                  <View key={row[0]} style={styles.scaleRow}>
                    {row.map((value) => {
                      const selected = exertion === value;
                      return (
                        <Pressable
                          key={value}
                          accessibilityRole="radio"
                          accessibilityLabel={exertionButtonLabel(value)}
                          // aria-checked는 폰에서는 accessibilityState.checked가 되고, 확인용 웹 번들에서도 그대로 나온다.
                          aria-checked={selected}
                          onPress={() => setExertion(value)}
                          style={({ pressed }) => [
                            styles.scaleButton,
                            selected && styles.scaleButtonSelected,
                            pressed && styles.pressed,
                          ]}
                        >
                          <Text style={[styles.scaleText, selected && styles.scaleTextSelected]}>{value}</Text>
                        </Pressable>
                      );
                    })}
                  </View>
                ))}
              </View>
            </View>

            <View style={styles.section}>
              <Text style={styles.heading} accessibilityRole="header">
                {copy.memoLabel}
              </Text>
              <TextInput
                accessibilityLabel={copy.memoLabel}
                multiline
                onChangeText={setMemo}
                placeholder={copy.memoPlaceholder}
                placeholderTextColor={colors.sub}
                style={styles.memo}
                textAlignVertical="top"
                value={memo}
              />
            </View>

            <View style={styles.section}>
              <Pressable
                accessibilityRole="button"
                aria-busy={saving}
                disabled={!canSave}
                onPress={save}
                style={({ pressed }) => [styles.button, canSave ? styles.buttonFilled : styles.buttonDisabled, pressed && styles.pressed]}
              >
                <Text style={canSave ? styles.buttonFilledText : styles.buttonDisabledText}>{copy.save}</Text>
              </Pressable>
              {exertion === null && <Text style={styles.hint}>{copy.needExertion}</Text>}
              {saveFailed && (
                <Text style={styles.hint} accessibilityRole="alert">
                  {copy.saveFailed}
                </Text>
              )}
              {step === 'edit' && (
                <Pressable
                  accessibilityRole="button"
                  disabled={saving}
                  onPress={cancelEdit}
                  style={({ pressed }) => [styles.button, styles.buttonOutline, pressed && styles.pressed]}
                >
                  <Text style={styles.buttonOutlineText}>{copy.cancelEdit}</Text>
                </Pressable>
              )}
            </View>
          </>
        )}

        {step === 'saved' && (
          <View style={styles.section}>
            <Text style={styles.saved} aria-live={savedNow ? 'polite' : 'off'}>
              {copy.saved}
            </Text>
            <Pressable
              accessibilityRole="button"
              onPress={startEdit}
              style={({ pressed }) => [styles.button, styles.buttonOutline, pressed && styles.pressed]}
            >
              <Text style={styles.buttonOutlineText}>{copy.edit}</Text>
            </Pressable>
          </View>
        )}
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

/**
 * 건강 앱에서 기록을 읽고, 그 기록에 저장해 둔 체감 피로와 메모가 있는지 찾는다.
 * 있으면 그 값을 붙여 저장한 뒤 화면(saved)으로, 없으면 처음 묻는 화면(ask)으로 간다.
 * 측정값은 늘 방금 읽은 것을 쓴다. 저장소가 "쓸 수 없는 값"이라고 하면(null) 처음처럼 묻는다.
 * 건강 앱이나 저장소를 읽지 못하면 reject한다(화면은 "다시 읽기"를 보여 준다).
 */
async function readWithSavedInput(reader: HealthReader, store: RecordStore): Promise<Loaded> {
  const record = await reader.readLatestWorkout();
  if (!record) return { status: 'none' };
  const saved = await store.findUserInput(record.origin);
  if (!saved) return { status: 'ready', record, step: 'ask' };
  return { status: 'ready', record: { ...record, userInput: saved }, step: 'saved' };
}

/**
 * 기록을 짧게 보여 주는 카드. 값이 없는 항목은 칸째로 빠진다.
 * 저장한 뒤(showUserInput)에는 체감 피로와 메모가 붙는다. 묻거나 고치는 중에는 아래 입력칸이 그 값을 보여 준다.
 */
function RecordCard({ record, showUserInput }: { record: WorkoutRecord; showUserInput: boolean }) {
  const items = summarize(record);
  const { perceivedExertion, memo } = showUserInput ? record.userInput : { perceivedExertion: null, memo: null };
  return (
    <View style={styles.section}>
      <Text style={styles.heading} accessibilityRole="header">
        {copy.recordTitle}
      </Text>
      <View style={styles.card}>
        {items.map((item) => (
          <Cell key={item.key} label={copy.labels[item.key]} value={item.value} wide={item.key === 'date'} />
        ))}
        {perceivedExertion !== null && <Cell label={copy.exertionTitle} value={String(perceivedExertion)} />}
        {memo !== null && <Cell label={copy.savedMemoLabel} value={memo} wide plain />}
      </View>
    </View>
  );
}

function Cell({ label, value, wide, plain }: { label: string; value: string; wide?: boolean; plain?: boolean }) {
  return (
    <View accessible accessibilityLabel={`${label}, ${value}`} style={[styles.cell, wide && styles.cellWide]}>
      <Text style={styles.cellLabel}>{label}</Text>
      <Text style={plain ? styles.cellText : styles.cellValue}>{value}</Text>
    </View>
  );
}

const colors = {
  bg: '#ffffff',
  ink: '#111111',
  sub: '#666666',
  line: '#d4d4d4',
  card: '#f5f5f5',
  off: '#e5e5e5',
};

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40, gap: 28 },
  brand: { fontSize: 22, fontWeight: '700', color: colors.ink },
  section: { gap: 10 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink },
  body: { fontSize: 16, color: colors.ink },
  hint: { fontSize: 14, lineHeight: 20, color: colors.sub },
  note: { fontSize: 16, color: colors.sub },

  card: { flexDirection: 'row', flexWrap: 'wrap', backgroundColor: colors.card, borderRadius: 14, padding: 16, rowGap: 16 },
  cell: { width: '50%', gap: 4 },
  cellWide: { width: '100%' },
  cellLabel: { fontSize: 13, color: colors.sub },
  cellValue: { fontSize: 20, fontWeight: '600', color: colors.ink },
  cellText: { fontSize: 16, lineHeight: 22, color: colors.ink },

  scale: { gap: 8 },
  scaleRow: { flexDirection: 'row', gap: 8 },
  scaleButton: {
    flex: 1,
    minWidth: 44,
    minHeight: MIN_TOUCH,
    alignItems: 'center',
    justifyContent: 'center',
    borderRadius: 10,
    borderWidth: 1,
    borderColor: colors.line,
    backgroundColor: colors.bg,
  },
  scaleButtonSelected: { backgroundColor: colors.ink, borderColor: colors.ink },
  scaleText: { fontSize: 18, fontWeight: '600', color: colors.ink },
  scaleTextSelected: { color: colors.bg },

  memo: {
    minHeight: 96,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    padding: 12,
    fontSize: 16,
    lineHeight: 22,
    color: colors.ink,
  },

  button: { minHeight: MIN_TOUCH + 4, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 16 },
  buttonFilled: { backgroundColor: colors.ink },
  buttonFilledText: { fontSize: 17, fontWeight: '700', color: colors.bg },
  buttonDisabled: { backgroundColor: colors.off },
  buttonDisabledText: { fontSize: 17, fontWeight: '700', color: colors.sub },
  buttonOutline: { borderWidth: 1, borderColor: colors.ink },
  buttonOutlineText: { fontSize: 17, fontWeight: '700', color: colors.ink },
  pressed: { opacity: 0.6 },

  saved: { fontSize: 20, fontWeight: '700', color: colors.ink },
});
