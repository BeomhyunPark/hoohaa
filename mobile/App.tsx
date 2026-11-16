import { useFonts } from 'expo-font';
import { StatusBar } from 'expo-status-bar';
import { useEffect, useState } from 'react';
import { Platform, StyleSheet, View } from 'react-native';
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
import { ThemeScreen } from './src/screens/ThemeScreen';
import { DEFAULT_THEME, THEMES, type ThemeName } from './src/theme/colors';
import { ThemeProvider } from './src/theme/theme';
import { loadThemeName, saveThemeName } from './src/theme/theme-store';
import { FONT_FILES } from './src/theme/tokens';

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
 *
 * 화면 색 고르기(themeOpen)는 이 목록에 없다. 보던 화면을 숨겨 둔 채(그리지 않고 상태는 남긴 채) 위에 띄운다.
 * 그래서 고르던 체감 피로나 적던 메모가 돌아왔을 때 그대로 있다.
 */
type Screen =
  | { name: 'after-run'; reader: HealthReader }
  | { name: 'manual'; editing?: WorkoutRecord; back: Screen }
  | { name: 'list' };

/** 기록 하나만 돌려주는 reader. 그 기록을 운동이 끝난 뒤 첫 화면으로 연다. */
const only = (record: WorkoutRecord): Screen => ({ name: 'after-run', reader: { readLatestWorkout: async () => record } });

export default function App() {
  // 건강 앱은 아직 가짜다(샘플 기록 하나). 체감 피로와 메모, 직접 입력한 기록은 기기 안에 저장한다(계정과 서버는 없다).
  // 서버가 생기면 여기서 저장소만 바꿔 넣는다.
  const [store] = useState(() => createDeviceRecordStore());
  const [manualStore] = useState(() => createDeviceManualRecordStore());
  const [health] = useState(() => createFakeHealthReader(healthPlatform()));
  const [lister] = useState(() => createRecordLister(health, manualStore));
  // 부를 때마다 새 reader를 만든다. 화면이 기록을 다시 읽게 하려고.
  const latest = (): Screen => ({ name: 'after-run', reader: createLatestWorkoutReader(health, manualStore) });
  const [view, setView] = useState<Screen>(latest);
  // 글자는 Pretendard다. 다 불러오기 전에는 바탕색만 그린다(글꼴이 바뀌며 글자가 튀지 않게). 못 불러오면 시스템 글꼴로 그린다.
  const [fontsLoaded, fontError] = useFonts(FONT_FILES);
  // 화면 색: 기기에 저장해 둔 테마. 읽기 전(null)에는 바탕색만 그린다. 저장에 실패하면 고르는 화면에서 알린다.
  const [themeName, setThemeName] = useState<ThemeName | null>(null);
  const [themeSaveFailed, setThemeSaveFailed] = useState(false);
  useEffect(() => {
    let current = true;
    loadThemeName().then((name) => current && setThemeName(name));
    return () => {
      current = false;
    };
  }, []);
  function chooseTheme(name: ThemeName) {
    setThemeName(name);
    setThemeSaveFailed(false);
    saveThemeName(name).catch(() => setThemeSaveFailed(true));
  }
  const [themeOpen, setThemeOpen] = useState(false);
  const openTheme = () => setThemeOpen(true);
  const bg = { backgroundColor: THEMES[themeName ?? DEFAULT_THEME].bg };
  if ((!fontsLoaded && !fontError) || themeName === null)
    return (
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, bg]} />
      </SafeAreaProvider>
    );

  return (
    <ThemeProvider name={themeName}>
      <SafeAreaProvider>
        <SafeAreaView style={[styles.container, bg]}>
          <View style={[styles.container, themeOpen && styles.hidden]}>
            {view.name === 'after-run' && (
              <AfterRunScreen
                reader={view.reader}
                store={store}
                onAddManual={() => setView({ name: 'manual', back: view })}
                onOpenList={() => setView({ name: 'list' })}
                onOpenTheme={openTheme}
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
                onOpenTheme={openTheme}
              />
            )}
          </View>
          {themeOpen && <ThemeScreen onChange={chooseTheme} onBack={() => setThemeOpen(false)} saveFailed={themeSaveFailed} />}
          <StatusBar style="light" />
        </SafeAreaView>
      </SafeAreaProvider>
    </ThemeProvider>
  );
}

const styles = StyleSheet.create({
  hidden: { display: 'none' },
  container: {
    flex: 1,
    // 상태 표시줄과 홈 인디케이터 자리도 화면 바탕색으로 칠한다(색은 고른 테마를 따라 위에서 덧붙인다).
  },
});
