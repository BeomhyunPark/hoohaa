---
title: "운동 후 화면: 상태는 aria 속성으로 적고, 시간은 멈춘 구간을 빼고, 화면 문장의 기준은 copy.md다"
author: Claude
date: 2026-11-13
branch: claude/ecstatic-knuth-awdkkf
cost: { minutes: 6, tokens: 92789 }
id: l-dbf99a8f
scope: repo
status: active
replaces: l-b0e5526f
src: agent
touches:
  - docs/screenshots/v4/after-run-1-before-android.png
  - docs/screenshots/v4/after-run-1-before-iphone.png
  - docs/screenshots/v4/after-run-2-picked-android.png
  - docs/screenshots/v4/after-run-2-picked-iphone.png
  - docs/screenshots/v4/after-run-3-saved-android.png
  - docs/screenshots/v4/after-run-3-saved-iphone.png
  - mobile/App.tsx
  - mobile/README.md
  - mobile/__tests__/App.test.tsx
  - mobile/__tests__/after-run-screen.test.tsx
---

## Decided
- 기록의 시간은 멈춘 구간을 뺀 값이다(사용자 결정, 2026-11-13). 같은 달리기는 애플 건강에서 오든 헬스 커넥트에서 오든 같은 시간과 평균 페이스로 보여야 한다. 헬스 커넥트는 시간 항목이 없어 끝 − 시작에서 PAUSE 구간(segmentType 39)을 뺀다. 구간은 세션 안쪽으로 자르고 겹치면 한 번만 센다. 구간 자체는 extra에 그대로 둔다.
- 저장한 뒤에도 사용자가 "수정"으로 체감 피로와 메모를 고칠 수 있다(사용자 결정). 앱이 다시 묻지는 않는다. 고친 값은 같은 기록에 덮어쓴다.
- 화면 문장의 기준은 docs/v4/features/copy.md의 "기록과 체감 피로" 표다(사용자가 넣기로 함). 코드의 문장이 그 표에 그대로 있는지 테스트가 본다. 문장을 고칠 때는 두 곳을 같이 고친다.
- 메모 글자 수는 제한하지 않는다. 날짜와 시각은 폰의 시간대로 적는다(둘 다 사용자 확인).
- 체감 피로 버튼은 한 줄에 5개씩 두 줄로 둔다. 10개를 한 줄에 두면 390pt 폰에서 버튼 폭이 35pt쯤이라 누르는 영역 44pt를 못 채운다.
- 화면이 날짜를 기기 시간대로 적으므로, Jest는 서울 시간대로 고정하고 스크린샷 브라우저도 한국어·서울 시간대로 맞춘다.

## Tried and ruled out
- `accessibilityState={{ checked }}`: 폰과 Jest에서는 되지만 react-native-web 0.21은 이 값을 DOM에 내보내지 않는다. 웹 번들에서 Playwright가 선택된 버튼(`checked: true`)을 찾지 못해 30초 뒤 시간 초과로 끝났다. `aria-checked`, `aria-busy`, `aria-live`로 바꾸니 폰, Jest(toBeChecked), 웹 번들 모두에서 된다.
- 테스트 파일 안에서 process.env.TZ를 정하기: 워커가 뜬 뒤라 믿을 수 없다. globalSetup에서 정한다.
- 헬스 커넥트 시간을 끝 − 시작 그대로 두기: 같은 5.01km가 애플 건강 샘플은 5:42/km, 헬스 커넥트 샘플은 5:54/km로 보여서 사용자가 맞추라고 했다.

## Watch out
- 기록을 쓴 앱이 헬스 커넥트에 PAUSE 구간을 남기지 않으면 멈춘 시간을 뺄 수 없다. 실제 기기에서 삼성 헬스 등이 구간을 남기는지 확인해야 한다.
- 메모리 저장소는 기록 번호가 없는 기록(직접 입력)을 늘 새로 넣는다. 직접 입력 기록을 수정하게 되면 덮어쓸 기준이 따로 필요하다.
- jest-expo의 Platform.OS는 ios다. App을 그대로 그리면 애플 건강 샘플이 들어온다.
- 안전 영역 라이브러리는 네이티브 모듈이라 Jest에서는 라이브러리가 주는 가짜로 바꿔야 한다.

In the code: mobile/src/record/health-connect.ts (pausedMs, SEGMENT_TYPE_PAUSE), mobile/src/record/types.ts (durationSeconds), mobile/src/screens/AfterRunScreen.tsx (step ask/saved/edit, aria-checked, PER_ROW, MIN_TOUCH), mobile/src/copy/after-run.ts, mobile/__tests__/copy-doc.test.ts, docs/v4/features/copy.md, docs/v4/features/health-import.md, mobile/tools/screenshot.mjs (FLOWS, expectTouchSize), mobile/test-utils/timezone.js, mobile/test-utils/setup.js.
