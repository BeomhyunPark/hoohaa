// 운동이 끝난 뒤 첫 화면. 건강 앱에서 읽은 기록을 짧게 보여 주고, 체감 피로(필수)와 메모(선택)를 받아 기록에 붙인다.
//
// 체감 피로는 기록마다 한 번만 묻는다. 읽은 기록에 이미 저장해 둔 체감 피로가 있으면(앱을 닫았다 열었을 때 등)
// 묻지 않고 저장된 값을 보여 준다. 이때 "저장했어요"는 보여 주지 않는다(방금 저장했을 때만 하는 말이다). 저장해 둔 값은 저장소(RecordStore)가 가져온 곳과 그곳의 기록 번호로 찾는다.
// 저장한 뒤에도 사용자가 "수정"을 눌러 체감 피로와 메모를 고칠 수 있다. 앱이 다시 묻지는 않는다.
//
// 맨 아래의 "지난 기록"은 목록 화면(RecordListScreen)을, "기록 직접 입력"은 직접 입력 화면(ManualEntryScreen)을 연다.
// 고치는 중에는 숨긴다(적던 값이 사라지지 않게).
// 직접 입력한 기록에는 "기록 고치기"(날짜, 거리, 시간 등)와 "기록 지우기"가 붙는다. 지우기 전에 한 번 묻는다.
//
// 모양은 피그마 "03 폰 앱 시안"의 확정안이다(docs/screenshots/v4/design/). 기록 카드 → 체감 피로 슬라이더 → 메모,
// 저장·수정·취소는 화면 아래에 붙는다. 색은 테마의 역할 이름만 쓴다(src/theme/).
//
// 컨디션, 목표, 내일 훈련, 통증 판단은 서버가 생긴 다음이라 여기서 보여 주지 않는다.
import { useEffect, useState } from 'react';
import { AccessibilityInfo, KeyboardAvoidingView, Platform, ScrollView, StyleSheet, Text, TextInput, View } from 'react-native';

import { ExertionSlider } from '../components/ExertionSlider';
import { Header } from '../components/Header';
import { Button, StatusLine } from '../components/ui';
import { afterRunCopy as copy, exertionOutOfParts } from '../copy/after-run';
import type { HealthReader } from '../record/health-reader';
import type { RecordStore } from '../record/store';
import { summarize } from '../record/summary';
import type { WorkoutRecord } from '../record/types';
import { withUserInput } from '../record/user-input';
import { rpeColor, type ThemeColors } from '../theme/colors';
import { useColors, useThemedStyles } from '../theme/theme';
import { RADIUS, SCREEN_PADDING, SECTION_GAP, tabular, font } from '../theme/tokens';

export { MIN_TOUCH } from '../theme/tokens';

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
  /** 화면 색(테마)을 고르는 화면을 연다. 없으면 버튼을 그리지 않는다. */
  onOpenTheme?: () => void;
  reader: HealthReader;
  store: RecordStore;
  /** 기록을 직접 입력하는 화면을 연다. 없으면 버튼을 그리지 않는다. */
  onAddManual?: () => void;
  /** 지난 기록 목록을 연다. 없으면 버튼을 그리지 않는다. */
  onOpenList?: () => void;
  /** 직접 입력한 기록의 적은 값(날짜, 거리, 시간 등)을 고치는 화면을 연다. 없으면 버튼을 그리지 않는다. */
  onEditRecord?: (record: WorkoutRecord) => void;
  /** 직접 입력한 기록을 지운다. 지우지 못하면 reject한다. 지운 뒤 어디로 갈지는 부르는 쪽이 정한다. 없으면 버튼을 그리지 않는다. */
  onDeleteRecord?: (record: WorkoutRecord) => Promise<void>;
}

export function AfterRunScreen({ onOpenTheme, reader, store, onAddManual, onOpenList, onEditRecord, onDeleteRecord }: Props) {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const [exertion, setExertion] = useState<number | null>(null);
  const [memo, setMemo] = useState('');
  const [saving, setSaving] = useState(false);
  const [saveFailed, setSaveFailed] = useState(false);
  /** 이 화면에서 저장한 적이 있는지. "저장했어요"는 저장을 누른 데 대한 대답이라, 이미 저장돼 다시 들어온 기록에는 보여 주지 않는다. */
  const [savedNow, setSavedNow] = useState(false);
  /** 기록 지우기. confirm은 지울지 묻는 중, busy는 지우는 중. */
  const [deleting, setDeleting] = useState<'idle' | 'confirm' | 'busy'>('idle');
  const [deleteFailed, setDeleteFailed] = useState(false);
  const colors = useColors();
  const s = useThemedStyles(makeStyles);

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
  /** 직접 입력한 기록이면 그 기록. 적은 값을 고치거나 지울 수 있는 것은 직접 입력한 기록뿐이다(건강 앱 기록의 측정값은 건강 앱의 것이다). */
  const manual = loaded.status === 'ready' && loaded.record.origin.source === 'manual' ? loaded.record : null;

  async function save() {
    if (loaded.status !== 'ready' || !asking || exertion === null || saving) return;
    setSaving(true);
    setSaveFailed(false);
    try {
      const record = withUserInput(loaded.record, {
        perceivedExertion: exertion,
        memo,
      });
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

  /** 지울지 물은 뒤에만 지운다. 지운 뒤에는 부르는 쪽이 다른 화면으로 넘긴다. */
  async function deleteRecord() {
    if (loaded.status !== 'ready' || !onDeleteRecord || deleting !== 'confirm') return;
    setDeleting('busy');
    setDeleteFailed(false);
    try {
      await onDeleteRecord(loaded.record);
    } catch {
      setDeleteFailed(true);
      setDeleting('confirm');
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

  const showLinks = (onOpenList || onAddManual) && loaded.status !== 'loading' && step !== 'edit' && deleting === 'idle';
  const showBottom = loaded.status === 'ready';

  return (
    <KeyboardAvoidingView style={s.fill} behavior="padding">
      <ScrollView contentContainerStyle={s.content} keyboardShouldPersistTaps="handled">
        <Header onOpenTheme={onOpenTheme} />

        {loaded.status === 'loading' && <Text style={s.note}>{copy.loading}</Text>}
        {loaded.status === 'none' && <Text style={s.note}>{copy.noRecord}</Text>}
        {loaded.status === 'failed' && (
          <View style={s.section}>
            <Text style={s.note} accessibilityRole="alert">
              {copy.readFailed}
            </Text>
            <Button kind="outline" label={copy.retryRead} onPress={() => setAttempt((n) => n + 1)} />
          </View>
        )}

        {loaded.status === 'ready' && <RecordCard record={loaded.record} />}

        {asking && (
          <>
            <View style={s.sectionTight}>
              <View style={s.titleRow}>
                <Text style={s.heading} accessibilityRole="header">
                  {copy.exertionTitle}
                </Text>
                {exertion === null ? (
                  <Text style={s.pickHint}>{copy.exertionPickHint}</Text>
                ) : (
                  <View
                    style={[s.pill, { backgroundColor: rpeColor(colors, exertion) }]}
                    aria-hidden
                    accessibilityElementsHidden
                    importantForAccessibility="no-hide-descendants"
                  >
                    <Text style={s.pillText}>{exertion}</Text>
                  </View>
                )}
              </View>
              <Text style={s.question}>{copy.exertionQuestion}</Text>
              <ExertionSlider value={exertion} onChange={setExertion} />
            </View>

            <View style={s.sectionTight}>
              <View style={s.memoTitle}>
                <Text style={s.memoHeading}>{copy.savedMemoLabel}</Text>
                <Text style={s.memoOptional}>{copy.memoOptional}</Text>
              </View>
              <TextInput
                accessibilityLabel={copy.memoLabel}
                multiline
                onChangeText={setMemo}
                placeholder={copy.memoPlaceholder}
                placeholderTextColor={colors.textTertiary}
                style={s.memo}
                textAlignVertical="top"
                value={memo}
              />
            </View>
          </>
        )}

        {step === 'saved' && loaded.status === 'ready' && <SavedCard record={loaded.record} />}

        {manual && step !== 'edit' && !saving && (onEditRecord || onDeleteRecord) && (
          <View style={s.sectionTight}>
            {deleting === 'idle' ? (
              <View style={s.pair}>
                {onEditRecord && <Button kind="text" label={copy.editRecord} onPress={() => onEditRecord(manual)} />}
                {onDeleteRecord && <Button kind="textDanger" label={copy.deleteRecord} onPress={() => setDeleting('confirm')} />}
              </View>
            ) : (
              <View style={s.confirm}>
                <Text style={s.body} accessibilityRole="alert">
                  {copy.deleteQuestion}
                </Text>
                <View style={s.pairFill}>
                  <View style={s.pairItem}>
                    <Button
                      kind="outline"
                      label={copy.deleteConfirm}
                      aria-busy={deleting === 'busy'}
                      disabled={deleting === 'busy'}
                      onPress={deleteRecord}
                    />
                  </View>
                  <View style={s.pairItem}>
                    <Button
                      kind="outline"
                      label={copy.deleteCancel}
                      disabled={deleting === 'busy'}
                      onPress={() => {
                        setDeleting('idle');
                        setDeleteFailed(false);
                      }}
                    />
                  </View>
                </View>
                {deleteFailed && (
                  <StatusLine kind="danger">
                    <Text style={s.error} accessibilityRole="alert">
                      {copy.deleteFailed}
                    </Text>
                  </StatusLine>
                )}
              </View>
            )}
          </View>
        )}

        {showLinks && (
          <View style={s.links}>
            {onOpenList && (
              <View style={s.pairItem}>
                <Button kind="outline" label={copy.openList} disabled={saving} onPress={onOpenList} />
              </View>
            )}
            {onAddManual && (
              <View style={s.pairItem}>
                <Button kind="outline" label={copy.addManual} disabled={saving} onPress={onAddManual} />
              </View>
            )}
          </View>
        )}
      </ScrollView>

      {showBottom && (asking || step === 'saved') && (
        <View style={s.bottom}>
          {asking && (
            <>
              {exertion === null && <Text style={s.hint}>{copy.needExertion}</Text>}
              {saveFailed && (
                <StatusLine kind="danger">
                  <Text style={s.error} accessibilityRole="alert">
                    {copy.saveFailed}
                  </Text>
                </StatusLine>
              )}
              <Button kind="primary" label={copy.save} aria-busy={saving} disabled={!canSave} onPress={save} />
              {step === 'edit' && <Button kind="outline" label={copy.cancelEdit} disabled={saving} onPress={cancelEdit} />}
            </>
          )}
          {step === 'saved' && (
            <>
              {savedNow && (
                <StatusLine kind="success">
                  <Text style={s.saved} aria-live="polite">
                    {copy.saved}
                  </Text>
                </StatusLine>
              )}
              <Button kind="outline" label={copy.edit} onPress={startEdit} />
            </>
          )}
        </View>
      )}
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
  return {
    status: 'ready',
    record: { ...record, userInput: saved },
    step: 'saved',
  };
}

/** "5.01 km" → 숫자 "5.01", 단위 "km". "5:42/km" → "5:42", "/km". 숫자는 크게, 단위는 작게 보여 준다. */
export function splitUnit(value: string): { number: string; unit: string } {
  const m = /^(.*?)(?:\s(km|bpm|spm)|(\/km))$/.exec(value);
  if (!m) return { number: value, unit: '' };
  return { number: m[1], unit: m[2] ?? m[3] };
}

/**
 * 기록 카드. 맨 위에 날짜와 제목, 카드 안에 거리를 크게, 그 아래 시간·평균 페이스·평균 심박·평균 케이던스를 같은 폭 칸으로.
 * 값이 없는 항목은 칸째로 빠진다. 칸이 넷이면 둘씩 두 줄이다.
 * 화면 낭독기는 칸마다 "이름, 값"으로 읽는다(날짜는 화면에 이름이 없지만 읽을 때는 붙인다).
 */
function RecordCard({ record }: { record: WorkoutRecord }) {
  const s = useThemedStyles(makeStyles);
  const items = summarize(record);
  const date = items.find((i) => i.key === 'date');
  const distance = items.find((i) => i.key === 'distance');
  const cells = items.filter((i) => i.key !== 'date' && i.key !== 'distance');
  const perRow = cells.length === 4 ? 2 : 3;
  const rows: (typeof cells)[] = [];
  for (let i = 0; i < cells.length; i += perRow) rows.push(cells.slice(i, i + perRow));
  const source = record.origin.source === 'manual' ? null : copy.sources[record.origin.source];

  return (
    <>
      <View style={s.head}>
        {date && (
          <Text accessibilityLabel={`${copy.labels.date}, ${date.value}`} style={s.date}>
            {date.value}
          </Text>
        )}
        <Text style={s.title} accessibilityRole="header">
          {copy.recordTitle}
        </Text>
      </View>
      <View style={s.card}>
        {(distance || source) && (
          <View style={s.cardTop}>
            {distance ? <Text style={s.cardLabel}>{copy.labels.distance}</Text> : <View />}
            {source && (
              <View style={s.chip}>
                <Text style={s.chipText}>{source}</Text>
              </View>
            )}
          </View>
        )}
        {distance && (
          <>
            <View accessible accessibilityLabel={`${copy.labels.distance}, ${distance.value}`} style={s.hero}>
              <Text style={s.heroNumber}>{splitUnit(distance.value).number}</Text>
              <Text style={s.heroUnit}>{splitUnit(distance.value).unit}</Text>
            </View>
            {cells.length > 0 && <View style={s.rule} />}
          </>
        )}
        {rows.map((row) => (
          <View key={row[0].key} style={s.cellRow}>
            {row.map((item) => {
              const { number, unit } = splitUnit(item.value);
              return (
                <View key={item.key} accessible accessibilityLabel={`${copy.labels[item.key]}, ${item.value}`} style={s.cell}>
                  <Text style={s.cellLabel}>{copy.labels[item.key]}</Text>
                  <View style={s.cellValueRow}>
                    <Text style={s.cellValue}>{number}</Text>
                    {unit !== '' && <Text style={s.cellUnit}>{unit}</Text>}
                  </View>
                </View>
              );
            })}
            {Array.from({ length: perRow - row.length }, (_, i) => (
              <View key={`empty-${i}`} style={s.cell} />
            ))}
          </View>
        ))}
      </View>
    </>
  );
}

/** 저장한 뒤와 다시 들어온 기록: 체감 피로 값, 손잡이 없는 색 막대, 메모(있을 때만). 고칠 수는 없고 "수정"으로 다시 연다. */
function SavedCard({ record }: { record: WorkoutRecord }) {
  const s = useThemedStyles(makeStyles);
  const colors = useColors();
  const { perceivedExertion, memo } = record.userInput;
  if (perceivedExertion === null) return null;
  const parts = exertionOutOfParts(perceivedExertion);
  return (
    <View style={s.card}>
      <View accessible accessibilityLabel={`${copy.exertionTitle}, ${perceivedExertion}`} style={s.savedTop}>
        <Text style={s.cardLabel}>{copy.exertionTitle}</Text>
        <View style={s.savedValue}>
          {parts.before !== '' && <Text style={s.savedOf}>{parts.before}</Text>}
          <Text style={[s.savedNumber, { color: rpeColor(colors, perceivedExertion) }]}>{parts.number}</Text>
          <Text style={s.savedOf}>{parts.after}</Text>
        </View>
      </View>
      <View style={s.bar} aria-hidden accessibilityElementsHidden importantForAccessibility="no-hide-descendants">
        {colors.rpe.map((c, i) => (
          <View key={c} style={[s.barStep, { backgroundColor: c, opacity: i < perceivedExertion ? 1 : 0.25 }]} />
        ))}
      </View>
      {memo !== null && (
        <>
          <View style={s.rule} />
          <View accessible accessibilityLabel={`${copy.savedMemoLabel}, ${memo}`} style={s.savedMemo}>
            <Text style={s.cardLabel}>{copy.savedMemoLabel}</Text>
            <Text style={s.memoText}>{memo}</Text>
          </View>
        </>
      )}
    </View>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    fill: { flex: 1, backgroundColor: c.bg },
    content: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 10,
      paddingBottom: 24,
      gap: SECTION_GAP,
    },
    section: { gap: 10 },
    sectionTight: { gap: 8 },
    note: { fontSize: 16, lineHeight: 24, color: c.textSecondary, ...font(400) },
    body: { fontSize: 16, lineHeight: 24, color: c.textPrimary, ...font(400) },
    hint: {
      fontSize: 13,
      lineHeight: 18,
      color: c.textTertiary,
      textAlign: 'center',
      ...font(400),
    },
    error: { flexShrink: 1, fontSize: 13, lineHeight: 18, color: c.danger, ...font(400) },

    head: { gap: 4, marginBottom: -8 },
    date: {
      fontSize: 14,
      ...font(500),
      color: c.textSecondary,
      ...tabular,
    },
    title: {
      fontSize: 24,
      lineHeight: 32,
      ...font(700),
      color: c.textPrimary,
    },

    card: {
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: RADIUS.card,
      paddingTop: 18,
      paddingHorizontal: 20,
      paddingBottom: 20,
      gap: 14,
    },
    cardTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    cardLabel: { fontSize: 14, ...font(500), color: c.textSecondary },
    chip: {
      backgroundColor: c.raised,
      borderRadius: 999,
      paddingVertical: 5,
      paddingHorizontal: 10,
    },
    chipText: { fontSize: 12, ...font(500), color: c.textSecondary },
    hero: { flexDirection: 'row', alignItems: 'baseline', gap: 6 },
    heroNumber: {
      fontSize: 56,
      lineHeight: 60,
      ...font(700),
      letterSpacing: -1.1,
      color: c.textPrimary,
      ...tabular,
    },
    heroUnit: { fontSize: 20, ...font(600), color: c.textSecondary },
    rule: { height: 1, backgroundColor: c.border },
    cellRow: { flexDirection: 'row' },
    cell: { flex: 1, gap: 2 },
    cellLabel: { fontSize: 13, ...font(500), color: c.textTertiary },
    cellValueRow: { flexDirection: 'row', alignItems: 'baseline', gap: 3 },
    cellValue: {
      fontSize: 20,
      ...font(700),
      color: c.textPrimary,
      ...tabular,
    },
    cellUnit: { fontSize: 13, ...font(500), color: c.textSecondary },

    titleRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      minHeight: 32,
    },
    heading: {
      fontSize: 20,
      lineHeight: 28,
      ...font(700),
      color: c.textPrimary,
    },
    pickHint: { fontSize: 13, color: c.textTertiary, ...font(400) },
    pill: { borderRadius: 999, paddingVertical: 3, paddingHorizontal: 14 },
    pillText: {
      fontSize: 18,
      lineHeight: 26,
      ...font(700),
      color: c.onRpe,
      ...tabular,
    },
    question: {
      fontSize: 15,
      lineHeight: 22,
      color: c.textSecondary,
      marginTop: -2,
      ...font(400),
    },

    memoTitle: { flexDirection: 'row', alignItems: 'center', gap: 5 },
    memoHeading: { fontSize: 15, ...font(700), color: c.textPrimary },
    memoOptional: { fontSize: 13, color: c.textTertiary, ...font(400) },
    memo: {
      minHeight: 64,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.borderStrong,
      borderRadius: RADIUS.input,
      paddingHorizontal: 16,
      paddingVertical: 14,
      fontSize: 16,
      lineHeight: 22,
      color: c.textPrimary,
      ...font(400),
    },

    savedTop: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    savedValue: { flexDirection: 'row', alignItems: 'baseline', gap: 4 },
    savedNumber: {
      fontSize: 28,
      lineHeight: 32,
      ...font(700),
      ...tabular,
    },
    savedOf: {
      fontSize: 14,
      ...font(500),
      color: c.textTertiary,
      ...tabular,
    },
    bar: {
      flexDirection: 'row',
      gap: 2,
      height: 10,
      borderRadius: 5,
      overflow: 'hidden',
    },
    barStep: { flex: 1, height: 10 },
    savedMemo: { gap: 4 },
    memoText: { fontSize: 16, lineHeight: 24, color: c.textPrimary, ...font(400) },

    pair: { flexDirection: 'row', gap: 8 },
    pairFill: { flexDirection: 'row', gap: 8 },
    pairItem: { flex: 1 },
    confirm: { gap: 10 },
    links: { flexDirection: 'row', gap: 8 },

    bottom: {
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 12,
      paddingBottom: 12,
      gap: 8,
      backgroundColor: c.bg,
    },
    saved: { fontSize: 17, ...font(700), color: c.success },
  });
