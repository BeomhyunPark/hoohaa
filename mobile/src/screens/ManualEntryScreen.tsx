// 기록을 직접 입력하는 화면. 날짜, 거리, 시간은 꼭 받고, 시작 시각·평균 심박·평균 케이던스는 선택이다.
//
// 저장을 누르면 칸을 검사하고, 틀린 칸 아래에 이유를 적는다. 다 맞으면 기록 번호를 만들어 붙이고
// 기기에 저장한 뒤 onSaved로 넘긴다. 체감 피로와 메모는 여기서 묻지 않는다. 건강 앱 기록과 같은 화면
// (AfterRunScreen)이 묻는다.
import { showTime } from '@hoohaa/engine/parse.js';
import { useState } from 'react';
import { KeyboardAvoidingView, Pressable, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { manualEntryCopy as copy, manualErrorText } from '../copy/manual-entry';
import {
  formatDateInput,
  manualRecord,
  newManualRecordId,
  readManualForm,
  showClock,
  showDate,
  type ManualError,
  type ManualField,
  type ManualForm,
} from '../record/manual';
import type { ManualRecordStore } from '../record/manual-store';
import type { WorkoutRecord } from '../record/types';

/** 누르는 영역의 가장 작은 크기(pt). AfterRunScreen과 같다. */
const MIN_TOUCH = 48;

const digits = (text: string, max: number) => text.replace(/\D/g, '').slice(0, max);

/** 입력 중인 글자를 칸의 모양으로 다듬는다. 날짜·시간·시각은 숫자만 받아 구분 글자를 붙여 보여 준다(웹의 기록 칸과 같다). */
const SHAPE: Record<ManualField, (text: string) => string> = {
  date: showDate,
  distance: (text) => text.replace(/[^\d.]/g, '').slice(0, 7),
  duration: (text) => showTime(digits(text, 6)),
  startTime: showClock,
  heartRate: (text) => digits(text, 3),
  cadence: (text) => digits(text, 3),
};

const REQUIRED: ManualField[] = ['date', 'distance', 'duration'];
const DETAILS: ManualField[] = ['startTime', 'heartRate', 'cadence'];

interface Props {
  store: ManualRecordStore;
  /** 저장한 기록을 넘긴다. */
  onSaved: (record: WorkoutRecord) => void;
  onCancel: () => void;
  /** 지금 시각(테스트용). 날짜 칸의 처음 값과 "오늘보다 뒤" 검사, 기록 번호에 쓴다. */
  now?: () => Date;
}

export function ManualEntryScreen({ store, onSaved, onCancel, now = () => new Date() }: Props) {
  // 날짜는 오늘로 채워 둔다. 방금 달린 기록을 적는 일이 가장 많다.
  const [form, setForm] = useState<ManualForm>(() => ({
    date: formatDateInput(now()),
    distance: '',
    duration: '',
    startTime: '',
    heartRate: '',
    cadence: '',
  }));
  const [errors, setErrors] = useState<Partial<Record<ManualField, ManualError>>>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);

  function change(field: ManualField, text: string) {
    setForm((f) => ({ ...f, [field]: SHAPE[field](text) }));
    // 고치기 시작한 칸의 오류는 지운다. 다시 검사하는 것은 저장을 누를 때다.
    setErrors(({ [field]: _gone, ...rest }) => rest);
  }

  async function save() {
    if (saving) return;
    const at = now();
    const result = readManualForm(form, at);
    if (!result.ok) {
      setErrors(result.errors);
      return;
    }
    setErrors({});
    setSaving(true);
    setSaveFailed(false);
    try {
      const record = manualRecord(newManualRecordId(at), at.toISOString(), result.fields);
      await store.save(record);
      onSaved(record);
    } catch {
      setSaveFailed(true);
      setSaving(false);
    }
  }

  const field = (name: ManualField) => (
    <View key={name} style={styles.field}>
      <Text style={styles.label}>{copy.labels[name]}</Text>
      <TextInput
        accessibilityLabel={copy.labels[name]}
        aria-invalid={errors[name] !== undefined}
        inputMode={name === 'distance' ? 'decimal' : 'numeric'}
        onChangeText={(text) => change(name, text)}
        placeholder={copy.placeholders[name]}
        placeholderTextColor={colors.sub}
        style={[styles.input, errors[name] !== undefined && styles.inputError]}
        value={form[name]}
      />
      {errors[name] !== undefined && (
        <Text style={styles.error} accessibilityRole="alert">
          {manualErrorText(name, errors[name])}
        </Text>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Text style={styles.brand}>hoohaa</Text>

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            {copy.title}
          </Text>
          <Text style={styles.hint}>{copy.intro}</Text>
          {REQUIRED.map(field)}
        </View>

        <View style={styles.section}>
          <Text style={styles.heading} accessibilityRole="header">
            {copy.detailsTitle}
          </Text>
          <Text style={styles.hint}>{copy.detailsHint}</Text>
          {DETAILS.map(field)}
        </View>

        <View style={styles.section}>
          <Pressable
            accessibilityRole="button"
            aria-busy={saving}
            disabled={saving}
            onPress={save}
            style={({ pressed }) => [styles.button, styles.buttonFilled, pressed && styles.pressed]}
          >
            <Text style={styles.buttonFilledText}>{copy.save}</Text>
          </Pressable>
          {saveFailed && (
            <Text style={styles.error} accessibilityRole="alert">
              {copy.saveFailed}
            </Text>
          )}
          <Pressable
            accessibilityRole="button"
            disabled={saving}
            onPress={onCancel}
            style={({ pressed }) => [styles.button, styles.buttonOutline, pressed && styles.pressed]}
          >
            <Text style={styles.buttonOutlineText}>{copy.cancel}</Text>
          </Pressable>
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const colors = {
  bg: '#ffffff',
  ink: '#111111',
  sub: '#666666',
  line: '#d4d4d4',
  error: '#b42318',
};

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: colors.bg },
  content: { padding: 20, paddingBottom: 40, gap: 28 },
  brand: { fontSize: 22, fontWeight: '700', color: colors.ink },
  section: { gap: 10 },
  heading: { fontSize: 18, fontWeight: '700', color: colors.ink },
  hint: { fontSize: 14, lineHeight: 20, color: colors.sub },

  field: { gap: 6 },
  label: { fontSize: 15, fontWeight: '600', color: colors.ink },
  input: {
    minHeight: MIN_TOUCH,
    borderWidth: 1,
    borderColor: colors.line,
    borderRadius: 10,
    paddingHorizontal: 12,
    fontSize: 17,
    color: colors.ink,
  },
  inputError: { borderColor: colors.error },
  error: { fontSize: 14, lineHeight: 20, color: colors.error },

  button: { minHeight: MIN_TOUCH + 4, alignItems: 'center', justifyContent: 'center', borderRadius: 12, paddingHorizontal: 16 },
  buttonFilled: { backgroundColor: colors.ink },
  buttonFilledText: { fontSize: 17, fontWeight: '700', color: colors.bg },
  buttonOutline: { borderWidth: 1, borderColor: colors.ink },
  buttonOutlineText: { fontSize: 17, fontWeight: '700', color: colors.ink },
  pressed: { opacity: 0.6 },
});
