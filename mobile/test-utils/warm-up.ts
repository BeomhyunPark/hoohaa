// Jest setupFilesAfterEnv. 화면 테스트(.tsx)를 시작하기 전에 React Native 화면 부품을 미리 불러 둔다.
//
// 'react-native'는 View, ScrollView 같은 부품을 처음 쓰일 때에야 불러온다. 그래서 테스트 파일에서 화면을 처음 그리는
// 테스트 하나가 그 부품들을 불러와 변환하는 시간을 떠안는다. Jest 캐시가 없는 CI에서는 그것만 4~5초라, 그 파일의
// 첫 테스트가 5초 제한을 넘겨 실패했다(화면이 늘어난 뒤부터 매번). 여기서 미리 불러 두면 그 시간은 테스트 준비로
// 빠지고 테스트 제한 시간에 들어가지 않는다. 제한 시간을 늘리지 않은 이유: 정말로 멈춘 테스트를 늦게 알게 된다.
//
// 화면을 그리지 않는 테스트(.ts)에는 하지 않는다. 쓰지도 않을 부품을 불러오느라 느려지기만 한다.

/**
 * src/의 화면과 App.tsx가 'react-native'에서 가져다 쓰는 것.
 * 화면이 새 부품을 쓰면 여기에 더한다. 빠뜨리면 __tests__/warm-up.test.ts가 알려 준다.
 */
export const WARMED = [
  'AccessibilityInfo',
  'KeyboardAvoidingView',
  'Platform',
  'Pressable',
  'ScrollView',
  'StyleSheet',
  'Text',
  'TextInput',
  'View',
] as const;

if (/\.tsx$/.test(expect.getState().testPath ?? '')) {
  // import * 대신 require를 쓴다. 통째로 가져오면 Babel이 모든 속성을 건드려 쓰지 않는 것까지 불러올 수 있다.
  const rn = require('react-native') as Record<string, unknown>;
  for (const name of WARMED) void rn[name];
}
