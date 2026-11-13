// Jest setupFiles. 안전 영역 라이브러리는 네이티브 모듈이라 테스트에서는 라이브러리가 주는 가짜로 바꾼다.
jest.mock('react-native-safe-area-context', () => require('react-native-safe-area-context/jest/mock').default);
