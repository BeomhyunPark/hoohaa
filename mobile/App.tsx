import { StatusBar } from 'expo-status-bar';
import { useState } from 'react';
import { Platform, StyleSheet } from 'react-native';
import { SafeAreaProvider, SafeAreaView } from 'react-native-safe-area-context';

import { createFakeHealthReader, type HealthPlatform } from './src/record/health-reader';
import { createMemoryRecordStore } from './src/record/store';
import { AfterRunScreen } from './src/screens/AfterRunScreen';

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

export default function App() {
  // 건강 앱은 아직 가짜다(샘플 기록 하나). 저장은 메모리에만 한다. 앱을 닫으면 사라진다.
  const [reader] = useState(() => createFakeHealthReader(healthPlatform()));
  const [store] = useState(() => createMemoryRecordStore());

  return (
    <SafeAreaProvider>
      <SafeAreaView style={styles.container}>
        <AfterRunScreen reader={reader} store={store} />
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
