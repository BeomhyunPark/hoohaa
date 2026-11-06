---
title: "폰 앱은 웹 계산 엔진을 @hoohaa/engine 이름으로 불러오고, 타입은 paths로 mobile/types의 .d.ts에 잇는다"
author: Claude
date: 2026-11-06
branch: claude/sweet-galileo-jz58dz
cost: { minutes: 6, tokens: 102776 }
id: l-da118a23
scope: repo
status: active
src: agent
touches:
  - src/engine/tier.js
---

## Decided
- 폰 앱은 웹의 src/engine/tier.js, data.js를 복사하지 않고 `@hoohaa/engine/tier.js` 같은 이름으로 불러온다. 이 이름을 Metro, Jest, TypeScript 세 곳에서 따로 잇는다. 타입은 mobile/types/engine/*.d.ts에만 둔다.
- 화면 확인은 expo export --platform web 번들을 Playwright로 iPhone 390×844, Android 412×915 크기로 찍는다. 확인용일 뿐 배포하지 않는다.

## Tried and ruled out
- 상대 경로(`../src/engine/tier.js`) + tsconfig `rootDirs`로 .d.ts를 붙이기: moduleResolution bundler는 allowJs를 꺼도 실제 .js를 먼저 찾아 멈추고 TS7016(implicit any)을 낸다. 상대 경로에는 paths도 안 걸려서 이름(alias)으로 바꿨다.

## Watch out
- jest-expo는 tsconfig의 paths를 읽어 Jest moduleNameMapper를 스스로 만든다. 그대로면 .d.ts 폴더를 가리켜 "Could not locate module"이 난다. package.json에 같은 키(`^@hoohaa/engine/(.*)$`)로 진짜 폴더를 가리키는 매퍼를 둬서 덮어쓴다. paths 이름을 바꾸면 매퍼 키도 같이 바꾼다.
- Jest에서 Babel이 엔진 파일에 @babel/runtime 헬퍼 require를 넣는데, 레포 루트에는 node_modules가 없어 못 찾는다. jest.modulePaths에 `<rootDir>/node_modules`가 필요하다. Metro는 이 설정 없이 됐다.
- Metro는 watchFolders에 ../src/engine이 없으면 "Unable to resolve"로 실패한다.
- 지금 App.tsx는 엔진을 import하지 않는다. 그래서 Metro 설정이 깨져도 tsc/jest/CI는 모른다. 화면이 엔진을 처음 쓸 때 expo export로 번들을 한 번 확인한다.

In the code: mobile/metro.config.js, mobile/package.json(jest.moduleNameMapper, jest.modulePaths, scripts.screenshot), mobile/tsconfig.json(paths), mobile/types/engine/, mobile/__tests__/engine.test.ts, mobile/tools/screenshot.mjs
