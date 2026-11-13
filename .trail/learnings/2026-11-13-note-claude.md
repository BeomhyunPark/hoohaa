---
title: "체감 피로와 메모는 기기에 그 둘만, 기록마다 키 하나로 저장하고, 깨진 값은 다시 묻되 저장소를 못 읽으면 묻지 않는다"
author: Claude
date: 2026-11-13
branch: claude/compassionate-brahmagupta-6bhj3z
cost: { minutes: 9, tokens: 168926 }
id: l-886a0956
scope: repo
status: active
src: agent
touches:
  - mobile/src/record/store.ts
  - mobile/src/record/device-store.ts
  - mobile/src/screens/AfterRunScreen.tsx
  - mobile/App.tsx
  - mobile/test-utils/setup.js
  - mobile/tools/screenshot.mjs
---

## Decided
- 기기에는 체감 피로와 메모만 둔다. 기록 전체(경로, 심박 표본, extra)는 넣지 않는다. 측정값은 건강 앱이 갖고 있고 앱을 열 때마다 다시 읽는다. 경로까지 넣으면 한 시간 달리기 하나가 1MB 가까이 되어 AsyncStorage(안드로이드는 한 칸 약 2MB, 전체 기본 6MB)에 맞지 않는다.
- 기록 하나에 키 하나다. 한 칸이 깨져도 다른 기록은 그대로이고, 저장할 때 전체를 읽어 고쳐 쓰지 않아도 된다.
- 기록은 가져온 곳 + 그곳의 기록 번호로만 찾는다(사용자 지시). 같은 운동 판별 기준은 정해지지 않았으니 넣지 않는다.
- 저장된 값이 깨졌거나 형식이 다르면 저장한 적이 없는 것으로 보고(null) 처음처럼 다시 묻는다(사용자 지시). 기기 저장소 자체를 읽지 못한 경우(AsyncStorage 오류)는 다르게 다룬다: reject하고 화면은 "기록을 읽지 못했어요." + "다시 읽기"를 보여 준다. 값이 있는지 모르는 채로 물으면 "체감 피로는 한 번만 묻는다"는 결정에 어긋나고, 다시 답한 값이 멀쩡한 예전 값을 덮어쓸 수 있어서다.
- 이미 저장한 기록이 다시 들어온 화면은 저장 직후 화면과 같다("저장했어요" + 수정). 새 문장을 만들지 않았다(문장의 기준은 copy.md이고 사용자가 정한다). 대신 다시 들어온 경우에는 aria-live를 꺼서 화면 낭독기가 "저장했어요"를 새 소식처럼 읽지 않게 했다.
- 화면은 저장소가 돌려준 체감 피로와 메모를 방금 읽은 기록에 붙여서 쓴다. 저장소 인터페이스는 findUserInput(가져온 곳, 기록 번호)과 save(기록) 둘뿐이라, 서버 구현으로 바꿔도 화면은 그대로다.

## Watch out
- 저장 형식의 항목 이름 source, sourceRecordId는 아직 제안인 이름을 그대로 쓴 것이다. 이름이 바뀌면 SAVED_VERSION을 올려야 하고, 옮기는 코드가 없으면 예전에 저장한 기록은 다시 묻게 된다.
- 기록 번호가 없는 기록(직접 입력)은 기기 저장소가 저장을 거절한다(다시 찾을 기준이 없어서 저장한 척하지 않는다). 직접 입력을 만들 때 기준을 먼저 정해야 한다.
- 확인용 웹 번들에서 AsyncStorage는 브라우저의 localStorage다. 그래서 스크린샷 흐름의 5-reopened는 page.reload()로 "앱을 다시 연 것"을 실제로 확인한다.
- AsyncStorage의 Jest 가짜는 테스트 파일마다 새로 생기지만 한 파일 안에서는 남는다. 기기 저장소를 쓰는 테스트는 beforeEach에서 AsyncStorage.clear()로 비운다.
- 이 클라우드 환경에서 `npx expo install`은 프록시에 막혀 403으로 끝난다. `EXPO_OFFLINE=1 npx expo install <패키지>`로 Expo SDK에 묶인 버전을 받는다.

In the code: mobile/src/record/store.ts (RecordStore, RecordKey, sameRecord), mobile/src/record/device-store.ts (storageKey, parseSaved, SAVED_VERSION), mobile/src/screens/AfterRunScreen.tsx (readWithSavedInput, savedNow), mobile/App.tsx, mobile/test-utils/setup.js, mobile/tools/screenshot.mjs (5-reopened), mobile/__tests__/record-store.test.ts
