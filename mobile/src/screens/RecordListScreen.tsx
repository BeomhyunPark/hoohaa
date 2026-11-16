// 지난 기록 목록. 앱이 아는 기록(직접 입력한 기록 전부와 건강 앱의 마지막 운동)을 늦게 끝난 순서로 보여 준다.
//
// 한 줄을 누르면 그 기록이 운동이 끝난 뒤 첫 화면(AfterRunScreen)으로 열린다. 고치기와 지우기는 거기에 있다.
// 기록을 해석하지 않는다(티어, 컨디션은 여기 없다).
import { useEffect, useState } from 'react';
import { Pressable, ScrollView, StyleSheet, Text, View } from 'react-native';

import { Header } from '../components/Header';
import { Button } from '../components/ui';

import { recordListCopy as copy } from '../copy/record-list';
import type { RecordLister } from '../record/health-reader';
import type { RecordStore } from '../record/store';
import { summarize, type SummaryKey } from '../record/summary';
import type { WorkoutRecord } from '../record/types';
import type { ThemeColors } from '../theme/colors';
import { useThemedStyles } from '../theme/theme';
import { MIN_TOUCH, RADIUS, SCREEN_PADDING, SECTION_GAP, tabular, font } from '../theme/tokens';

interface Row {
  record: WorkoutRecord;
  /** 저장해 둔 체감 피로. 아직 답하지 않았으면 null. */
  exertion: number | null;
}

type Loaded = { status: 'loading' } | { status: 'failed' } | { status: 'ready'; rows: Row[] };

interface Props {
  /** 화면 색(테마)을 고르는 화면을 연다. 없으면 버튼을 그리지 않는다. */
  onOpenTheme?: () => void;
  lister: RecordLister;
  store: RecordStore;
  onOpen: (record: WorkoutRecord) => void;
  onAddManual: () => void;
  onBack: () => void;
}

export function RecordListScreen({ onOpenTheme, lister, store, onOpen, onAddManual, onBack }: Props) {
  const [loaded, setLoaded] = useState<Loaded>({ status: 'loading' });
  const [attempt, setAttempt] = useState(0);
  const styles = useThemedStyles(makeStyles);

  useEffect(() => {
    let current = true;
    setLoaded({ status: 'loading' });
    readRows(lister, store).then(
      (rows) => {
        if (current) setLoaded({ status: 'ready', rows });
      },
      () => {
        if (current) setLoaded({ status: 'failed' });
      },
    );
    return () => {
      current = false;
    };
  }, [lister, store, attempt]);

  return (
    <ScrollView contentContainerStyle={styles.content}>
      <Header onOpenTheme={onOpenTheme} />

      <View style={styles.section}>
        <Text style={styles.heading} accessibilityRole="header">
          {copy.title}
        </Text>

        {loaded.status === 'loading' && <Text style={styles.note}>{copy.loading}</Text>}
        {loaded.status === 'failed' && (
          <>
            <Text style={styles.note} accessibilityRole="alert">
              {copy.readFailed}
            </Text>
            <Button kind="outline" label={copy.retryRead} onPress={() => setAttempt((n) => n + 1)} />
          </>
        )}
        {loaded.status === 'ready' && loaded.rows.length === 0 && <Text style={styles.note}>{copy.empty}</Text>}
        {loaded.status === 'ready' &&
          loaded.rows.map((row) => (
            <RecordRow
              key={`${row.record.origin.source}/${row.record.origin.sourceRecordId}`}
              row={row}
              onPress={() => onOpen(row.record)}
            />
          ))}
      </View>

      <View style={styles.links}>
        <View style={styles.linkItem}>
          <Button kind="outline" label={copy.back} onPress={onBack} />
        </View>
        <View style={styles.linkItem}>
          <Button kind="outline" label={copy.addManual} onPress={onAddManual} />
        </View>
      </View>
    </ScrollView>
  );
}

/** 기록 목록과, 기록마다 저장해 둔 체감 피로. 어느 한쪽이라도 읽지 못하면 reject한다. */
async function readRows(lister: RecordLister, store: RecordStore): Promise<Row[]> {
  const records = await lister.list();
  return Promise.all(
    records.map(async (record) => ({
      record,
      exertion: (await store.findUserInput(record.origin))?.perceivedExertion ?? null,
    })),
  );
}

/** 한 줄: 날짜, 그 아래 거리 · 시간 · 평균 페이스, 그 아래 직접 입력 표시와 체감 피로. 값이 없는 항목은 빠진다. */
function RecordRow({ row, onPress }: { row: Row; onPress: () => void }) {
  const styles = useThemedStyles(makeStyles);
  const values = new Map(summarize(row.record).map((item) => [item.key, item.value]));
  const pick = (keys: SummaryKey[]) => keys.map((k) => values.get(k)).filter((v): v is string => v !== undefined);
  const date = values.get('date');
  const numbers = pick(['distance', 'duration', 'pace']);
  const tags = [
    ...(row.record.origin.source === 'manual' ? [copy.manualTag] : []),
    ...(row.exertion !== null ? [`${copy.exertion} ${row.exertion}`] : []),
  ];
  return (
    <Pressable
      accessibilityRole="button"
      accessibilityLabel={[date, ...numbers, ...tags].filter(Boolean).join(', ')}
      onPress={onPress}
      style={({ pressed }) => [styles.row, pressed && styles.pressed]}
    >
      {date !== undefined && <Text style={styles.rowDate}>{date}</Text>}
      {numbers.length > 0 && <Text style={styles.rowNumbers}>{numbers.join(' · ')}</Text>}
      {tags.length > 0 && <Text style={styles.rowTags}>{tags.join(' · ')}</Text>}
    </Pressable>
  );
}

const makeStyles = (c: ThemeColors) =>
  StyleSheet.create({
    content: {
      flexGrow: 1,
      paddingHorizontal: SCREEN_PADDING,
      paddingTop: 10,
      paddingBottom: 40,
      gap: SECTION_GAP,
      backgroundColor: c.bg,
    },
    section: { gap: 10 },
    heading: {
      fontSize: 24,
      lineHeight: 32,
      ...font(700),
      color: c.textPrimary,
    },
    note: { fontSize: 16, lineHeight: 24, color: c.textSecondary, ...font(400) },

    row: {
      minHeight: MIN_TOUCH,
      backgroundColor: c.surface,
      borderWidth: 1,
      borderColor: c.border,
      borderRadius: RADIUS.card,
      paddingVertical: 16,
      paddingHorizontal: 20,
      gap: 4,
    },
    rowDate: {
      fontSize: 14,
      ...font(500),
      color: c.textSecondary,
      ...tabular,
    },
    rowNumbers: {
      fontSize: 18,
      ...font(700),
      color: c.textPrimary,
      ...tabular,
    },
    rowTags: { fontSize: 13, color: c.textSecondary, ...font(400) },

    links: { flexDirection: 'row', gap: 8 },
    linkItem: { flex: 1 },
    pressed: { opacity: 0.6 },
  });
