---
title: "폰 앱은 Expo SDK 58 개발 빌드로 시작하고, 테스트 도구는 jest-expo 58 · RNTL 14 · test-renderer로 맞춘다"
author: Claude
date: 2026-11-06
branch: claude/sharp-allen-83uvb9
cost: { minutes: 3, tokens: 51838 }
id: l-48d824b7
scope: repo
status: active
src: agent
touches:
  - mobile/package.json
  - mobile/tsconfig.json
---

## Decided
- 폰 앱은 레포 안 mobile/ 하나에 둔다. 레포 루트에는 package.json을 두지 않는다. node_modules와 ios/, android/(prebuild 결과)는 커밋하지 않는다.
- Expo Go가 아니라 expo-dev-client 개발 빌드로 돌린다(건강 앱 권한 때문). scheme은 hoohaa.
- ios.bundleIdentifier와 android.package는 아직 정하지 않는다(스토어 단계). app.json에 임시 값을 커밋하지 않는다.

## Tried and ruled out
- react-test-renderer: React 19.3.1 이상을 peer로 요구해 react 19.3.0(SDK 58)과 충돌한다. RNTL 14는 react-test-renderer 대신 test-renderer(1.x)를 peer로 쓴다.

## Watch out
- 이 클라우드 환경에서는 `npx expo install`이 api.expo.dev에 막혀 실패한다. `EXPO_OFFLINE=1`을 붙이면 expo 패키지 안 bundledNativeModules.json으로 버전을 고른다.
- TypeScript 6은 @types/*를 자동으로 넣지 않는다. tsconfig에 "types": ["jest"]가 없으면 테스트 파일에서 test/expect를 못 찾는다.
- RNTL 14의 render는 async다. await render(...)로 쓴다.

In the code: mobile/package.json (jest preset jest-expo, devDeps jest 30, @testing-library/react-native 14, test-renderer 1.3.0, @react-native/jest-preset 0.88.1), mobile/tsconfig.json, .github/workflows/test.yml의 mobile job.
