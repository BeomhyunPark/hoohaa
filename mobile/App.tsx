import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createDeviceRecordStore } from './src/record/device-store';
import {
  createFakeHealthReader,
  createLatestWorkoutReader,
  createRecordLister,
  type HealthPlatform,
  type HealthReader,
} from './src/record/health-reader';
import { createDeviceManualRecordStore } from './src/record/manual-store';
import type { WorkoutRecord } from './src/record/types';
import { AfterRunScreen } from './src/screens/AfterRunScreen';
import { ManualEntryScreen } from './src/screens/ManualEntryScreen';
import { RecordListScreen } from './src/screens/RecordListScreen';

/**
 * 어느 건강 앱 샘플을 쓸지. 아이폰은 애플 건강, 그 밖은 헬스 커넥트다.
 * 확인용 웹 빌드(tools/screenshot.mjs)에서만 주소의 ?health=apple_health로 애플 건강 샘플을 고를 수 있다.
 */
function healthPlatform(): HealthPlatform {
  if (Platform.OS === 'ios') return 'apple_health';
  if (Platform.OS === 'web' && typeof location !== 'undefined') {
    if (new URLSearchParams(location.search).get('health') === 'apple_health') return 'apple_health';
  }
  return 'health_connect';
}

/**
 * 지금 보는 화면.
 * - after-run: reader가 보여 줄 기록을 정한다. 처음에는 가장 최근 기록(건강 앱과 직접 입력 중 늦게 끝난 것),
 *   직접 입력을 저장한 직후나 목록에서 고른 뒤에는 그 기록 하나.
 * - manual: 기록 직접 입력. editing이 있으면 그 기록을 고친다. back은 취소했을 때 돌아갈 화면이다.
 * - list: 지난 기록 목록.
 */
type View =
  | { name: 'after-run'; reader: HealthReader }
  | { name: 'manual'; editing?: WorkoutRecord; back: View }
  | { name: 'list' };

/** 기록 하나만 돌려주는 reader. 그 기록을 운동이 끝난 뒤 첫 화면으로 연다. */
const only = (record: WorkoutRecord): View => ({ name: 'after-run', reader: { readLatestWorkout: async () => record } });

export default function App() {
  // 건강 앱은 아직 가짜다(샘플 기록 하나). 체감 피로와 메모, 직접 입력한 기록은 기기 안에 저장한다(계정과 서버는 없다).
  // 서버가 생기면 여기서 저장소만 바꿔 넣는다.
  const [store] = useState(() => createDeviceRecordStore());
  const [manualStore] = useState(() => createDeviceManualRecordStore());
  const [health] = useState(() => createFakeHealthReader(healthPlatform()));
  const [lister] = useState(() => createRecordLister(health, manualStore));
  // 부를 때마다 새 reader를 만든다. 화면이 기록을 다시 읽게 하려고.
  const latest = (): View => ({ name: 'after-run', reader: createLatestWorkoutReader(health, manualStore) });
  const [view, setView] = useState<View>(latest);

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {view.name === 'after-run' && (
          <AfterRunScreen
            reader={view.reader}
            store={store}
            onAddManual={() => setView({ name: 'manual', back: view })}
            onOpenList={() => setView({ name: 'list' })}
            onEditRecord={(record) => setView({ name: 'manual', editing: record, back: view })}
            onDeleteRecord={async (record) => {
              // 측정값을 먼저 지운다. 여기서 실패하면 아무것도 지워지지 않은 것이다.
              // 체감 피로와 메모만 남으면 다시 찾을 길이 없는 값이라 해가 없다(번호는 다시 쓰이지 않는다).
              await manualStore.remove(record.origin.sourceRecordId);
              await store.remove(record.origin);
              setView({ name: 'list' });
            }}
          />
        )}
        {view.name === 'manual' && (
          <ManualEntryScreen
            store={manualStore}
            editing={view.editing}
            // 방금 적은 기록의 체감 피로를 바로 묻는다. 더 늦게 끝난 다른 기록이 있어도 이 기록을 보여 준다.
            onSaved={(record) => setView(only(record))}
            onCancel={() => setView(view.back)}
          />
        )}
        {view.name === 'list' && (
          <RecordListScreen
            lister={lister}
            store={store}
            onOpen={(record) => setView(only(record))}
            onAddManual={() => setView({ name: 'manual', back: view })}
            onBack={() => setView(latest())}
          />
        )}
        <StatusBar style="dark" />
      </SafeAreaView>
    </SafeAreaProvider>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#fff',
  },
});
