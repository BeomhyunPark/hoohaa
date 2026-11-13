---
title: "폰 화면의 선택·비활성 상태는 aria 속성으로 적어야 확인용 웹 번들과 스크린샷 도구에서도 보인다"
author: Claude
date: 2026-11-13
branch: claude/ecstatic-knuth-awdkkf
cost: { minutes: 8, tokens: 158862 }
id: l-b0e5526f
scope: repo
status: active
src: agent
touches:
  - mobile/src/copy/after-run.ts
  - mobile/src/record/summary.ts
  - mobile/src/record/user-input.ts
  - mobile/src/record/store.ts
  - mobile/src/screens/AfterRunScreen.tsx
  - mobile/App.tsx
  - mobile/__tests__/after-run-screen.test.tsx
  - mobile/__tests__/record-summary.test.ts
  - mobile/__tests__/App.test.tsx
  - mobile/tools/screenshot.mjs
---

## Decided
- 체감 피로 버튼은 한 줄에 5개씩 두 줄로 둔다. 10개를 한 줄에 두면 390pt 폰에서 버튼 폭이 35pt쯤이라 누르는 영역 44pt를 못 채운다.
- 화면이 날짜를 기기 시간대로 적으므로, Jest는 서울 시간대로 고정하고 스크린샷 브라우저도 한국어·서울 시간대로 맞춘다.
- 스크린샷 도구는 "흐름"(화면을 순서대로 눌러 가며 여러 장) 단위로 찍고, 흐름 안에서 누르는 영역 크기도 같이 잰다.

## Tried and ruled out
- `accessibilityState={{ checked }}`: 폰과 Jest에서는 되지만 react-native-web 0.21은 이 값을 DOM에 내보내지 않는다. 웹 번들에서 Playwright가 선택된 버튼(`checked: true`)을 찾지 못해 30초 뒤 시간 초과로 끝났다. `aria-checked`, `aria-busy`, `aria-live`로 바꾸니 폰(accessibilityState로 바뀜), Jest(toBeChecked), 웹 번들 모두에서 된다.
- 테스트 파일 안에서 process.env.TZ를 정하기: 워커가 뜬 뒤라 믿을 수 없다. globalSetup에서 정한다.

## Watch out
- jest-expo의 Platform.OS는 ios다. App을 그대로 그리면 애플 건강 샘플이 들어온다.
- 안전 영역 라이브러리는 네이티브 모듈이라 Jest에서는 라이브러리가 주는 가짜로 바꿔야 한다.
- 헬스 커넥트 기록의 시간은 끝 − 시작이라 멈춘 구간이 들어간다. 같은 달리기라도 평균 페이스가 애플 건강 샘플(5:42)보다 느리게(5:54) 나온다.

In the code: mobile/src/screens/AfterRunScreen.tsx (aria-checked, PER_ROW, MIN_TOUCH), mobile/tools/screenshot.mjs (FLOWS, expectTouchSize, locale·timezoneId), mobile/test-utils/timezone.js (globalSetup), mobile/test-utils/setup.js (react-native-safe-area-context/jest/mock), mobile/App.tsx (?health=apple_health는 웹 번들에서만).
