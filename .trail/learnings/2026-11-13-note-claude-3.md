---
title: "체감 피로와 메모는 기기에 그 둘만, 기록마다 키 하나로 저장하고, 다시 들어온 기록에는 값과 수정만 보여 준다"
author: Claude
date: 2026-11-13
branch: claude/compassionate-brahmagupta-6bhj3z
cost: { minutes: 4, tokens: 36748 }
id: l-e7bbefa7
scope: repo
status: active
replaces: l-886a0956
src: agent
touches:
  - mobile/src/record/store.ts
  - mobile/src/record/device-store.ts
  - mobile/src/screens/AfterRunScreen.tsx
  - docs/v4/features/copy.md
  - mobile/tools/screenshot.mjs
  - docs/screenshots/v4/after-run-5-reopened-iphone.png
  - docs/screenshots/v4/after-run-5-reopened-android.png
---

## Decided
- 기기에는 체감 피로와 메모만 둔다. 기록 전체(경로, 심박 표본, extra)는 넣지 않는다. 측정값은 건강 앱이 갖고 있어 앱을 열 때마다 다시 읽고, 경로까지 넣으면 AsyncStorage 한 칸에 담기에 너무 크다.
- 기록 하나에 키 하나다. 한 칸이 깨져도 다른 기록은 그대로다. 기록은 가져온 곳 + 그곳의 기록 번호로만 찾는다(사용자 지시).
- 저장된 값이 깨졌거나 형식이 다르면 저장한 적이 없는 것으로 보고 처음처럼 다시 묻는다(사용자 지시). 기기 저장소 자체를 읽지 못하면 묻지 않고 "다시 읽기"를 보여 준다. 값이 있는지 모르는 채로 물으면 "한 번만 묻는다"에 어긋나고 멀쩡한 예전 값을 덮어쓸 수 있어서다.
- 이미 저장한 기록이 다시 들어오면 "저장했어요"를 보여 주지 않고 저장된 값과 "수정"만 둔다(사용자 결정, 2026-11-13). "저장했어요"는 저장을 누른 직후에만 하는 말이다.

## Tried and ruled out
- 다시 들어온 기록에 저장 직후 화면을 그대로 쓰고 aria-live만 끄기: 처음에 이렇게 했다. 앱을 열 때마다 아무것도 안 했는데 "저장했어요"가 굵게 떠서 앱이 방금 뭔가를 한 것처럼 읽혔다.

## Watch out
- 저장 형식의 source, sourceRecordId는 아직 제안인 이름이다. 이름이 바뀌면 SAVED_VERSION을 올려야 하고, 옮기는 코드가 없으면 예전에 저장한 기록은 다시 묻게 된다.
- 확인용 웹 번들에서 AsyncStorage는 브라우저의 localStorage다. 스크린샷 흐름의 5-reopened는 page.reload()로 앱을 다시 연 것을 확인한다.
- AsyncStorage의 Jest 가짜는 한 테스트 파일 안에서 남는다. beforeEach에서 AsyncStorage.clear()로 비운다.
- 이 클라우드 환경에서 `npx expo install`은 프록시에 막힌다. `EXPO_OFFLINE=1 npx expo install <패키지>`로 받는다.

In the code: mobile/src/record/store.ts (RecordStore), mobile/src/record/device-store.ts (storageKey, parseSaved, SAVED_VERSION), mobile/src/screens/AfterRunScreen.tsx (readWithSavedInput, savedNow), docs/v4/features/copy.md, mobile/tools/screenshot.mjs (5-reopened)
