// Jest setupFiles. 안전 영역 라이브러리는 네이티브 모듈이라 테스트에서는 라이브러리가 주는 가짜로 바꾼다.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
// 기기 저장소(AsyncStorage)도 네이티브 모듈이다. 라이브러리가 주는 메모리 가짜로 바꾼다.
// 가짜는 테스트 파일마다 새로 생기고, 한 파일 안에서는 남는다. 필요한 테스트가 AsyncStorage.clear()로 비운다.
jest.mock('@react-native-async-storage/async-storage', () =>
  require('@react-native-async-storage/async-storage/jest/async-storage-mock'),
);
