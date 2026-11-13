import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createDeviceRecordStore } from './src/record/device-store';
import {
  createFakeHealthReader,
  createLatestWorkoutReader,
  type HealthPlatform,
  type HealthReader,
} from './src/record/health-reader';
import { createDeviceManualRecordStore } from './src/record/manual-store';
import { AfterRunScreen } from './src/screens/AfterRunScreen';
import { ManualEntryScreen } from './src/screens/ManualEntryScreen';

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
 * 지금 보는 화면. after-run의 reader가 그 화면이 보여 줄 기록을 정한다:
 * 처음에는 가장 최근 기록(건강 앱과 직접 입력 중 늦게 끝난 것), 직접 입력을 저장한 직후에는 방금 그 기록.
 */
type View = { name: 'after-run'; reader: HealthReader } | { name: 'manual'; back: HealthReader };

export default function App() {
  // 건강 앱은 아직 가짜다(샘플 기록 하나). 체감 피로와 메모, 직접 입력한 기록은 기기 안에 저장한다(계정과 서버는 없다).
  // 서버가 생기면 여기서 저장소만 바꿔 넣는다.
  const [store] = useState(() => createDeviceRecordStore());
  const [manualStore] = useState(() => createDeviceManualRecordStore());
  const [view, setView] = useState<View>(() => ({
    name: 'after-run',
    reader: createLatestWorkoutReader(createFakeHealthReader(healthPlatform()), manualStore),
  }));

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        {view.name === 'after-run' ? (
          <AfterRunScreen
            reader={view.reader}
            store={store}
            onAddManual={() => setView({ name: 'manual', back: view.reader })}
          />
        ) : (
          <ManualEntryScreen
            store={manualStore}
            // 방금 적은 기록의 체감 피로를 바로 묻는다. 더 늦게 끝난 다른 기록이 있어도 이 기록을 보여 준다.
            onSaved={(record) => setView({ name: 'after-run', reader: { readLatestWorkout: async () => record } })}
            onCancel={() => setView({ name: 'after-run', reader: view.back })}
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
