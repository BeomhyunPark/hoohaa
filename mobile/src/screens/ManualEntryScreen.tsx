// 기록을 직접 입력하는 화면. 날짜, 거리, 시간은 꼭 받고, 시작 시각·평균 심박·평균 케이던스는 선택이다.
//
// 적어 둔 기록을 고칠 때도 이 화면을 쓴다(editing). 칸이 그 기록의 값으로 채워지고, 저장하면 같은 번호의 기록을 바꾼다.
//
// 저장을 누르면 칸을 검사하고, 틀린 칸 아래에 이유를 적는다. 다 맞으면 기록 번호를 만들어 붙이고
// 기기에 저장한 뒤 onSaved로 넘긴다. 체감 피로와 메모는 여기서 묻지 않는다. 건강 앱 기록과 같은 화면
// (AfterRunScreen)이 묻는다.
import { showTime } from '@hoohaa/engine/parse.js';
import { useState } from 'react';
import { KeyboardAvoidingView, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { Wordmark } from '../components/Wordmark';
import { Button, StatusLine } from '../components/ui';

import { manualEntryCopy as copy, manualErrorText } from '../copy/manual-entry';
import {
  formatDateInput,
  manualFormOf,
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
import type { ThemeColors } from '../theme/colors';
import { useColors, useThemedStyles } from '../theme/theme';
import { MIN_TOUCH, RADIUS, SCREEN_PADDING, SECTION_GAP, tabular, font } from '../theme/tokens';

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
  /** 고칠 기록(직접 입력한 것). 있으면 칸을 그 값으로 채우고, 저장하면 같은 번호의 기록을 바꾼다. 없으면 새 기록이다. */
  editing?: WorkoutRecord;
  /** 지금 시각(테스트용). 날짜 칸의 처음 값과 "오늘보다 뒤" 검사, 기록 번호에 쓴다. */
  now?: () => Date;
}

export function ManualEntryScreen({ store, onSaved, onCancel, editing, now = () => new Date() }: Props) {
  // 새 기록이면 날짜는 오늘로 채워 둔다. 방금 달린 기록을 적는 일이 가장 많다.
  const [form, setForm] = useState<ManualForm>(() =>
    editing
      ? manualFormOf(editing)
      : {
          date: formatDateInput(now()),
          distance: '',
          duration: '',
          startTime: '',
          heartRate: '',
          cadence: '',
        },
  );
  const [errors, setErrors] = useState<Partial<Record<ManualField, ManualError>>>({});
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  const colors = useColors();
  const styles = useThemedStyles(makeStyles);

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
      // 고치는 중이면 번호와 만든 시각을 그대로 둔다. 그래야 같은 자리를 바꾸고, 체감 피로와 메모가 그대로 붙어 있다.
      const record = editing
        ? manualRecord(editing.origin.sourceRecordId, editing.origin.importedAt, result.fields)
        : manualRecord(newManualRecordId(at), at.toISOString(), result.fields);
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
        placeholderTextColor={colors.textTertiary}
        style={[styles.input, errors[name] !== undefined && styles.inputError]}
        value={form[name]}
      />
      {errors[name] !== undefined && (
        <StatusLine kind="danger">
          <Text style={styles.error} accessibilityRole="alert">
            {manualErrorText(name, errors[name])}
          </Text>
        </StatusLine>
      )}
    </View>
  );

  return (
    <KeyboardAvoidingView style={styles.fill} behavior="padding">
      <ScrollView contentContainerStyle={styles.content} keyboardShouldPersistTaps="handled">
        <Wordmark />

        <View style={styles.section}>
          <Text style={styles.title} accessibilityRole="header">
            {editing ? copy.editTitle : copy.title}
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
          {saveFailed && (
            <StatusLine kind="danger">
              <Text style={styles.error} accessibilityRole="alert">
                {copy.saveFailed}
              </Text>
            </StatusLine>
          )}
          <Button kind="primary" label={copy.save} aria-busy={saving} disabled={saving} onPress={save} />
          <Button kind="outline" label={copy.cancel} disabled={saving} onPress={onCancel} />
        </View>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: c.bg },
    content: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 10,
      paddingBottom: 40,
      gap: SECTION_GAP,
    },
    section: { gap: 12 },
    title: {
      fontSize: 24,
      lineHeight: 32,
      ...font(700),
      color: c.textPrimary,
    },
    heading: {
      fontSize: 20,
      lineHeight: 28,
      ...font(700),
      color: c.textPrimary,
    },
    hint: { fontSize: 13, lineHeight: 18, color: c.textTertiary, ...font(400) },

    field: { gap: 6 },
    label: { fontSize: 14, ...font(500), color: c.textSecondary },
    input: {
      minHeight: Math.max(52, MIN_TOUCH),
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: RADIUS.input,
      paddingHorizontal: 16,
      fontSize: 16,
      color: c.textPrimary,
      ...tabular,
      ...font(400),
    },
    inputError: { borderColor: c.danger },
    error: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: c.danger, ...font(400) },
  });
