---
title: "직접 입력은 날짜·거리·시간만 꼭 받고, 측정값은 기기에 따로 저장하며, 번호는 저장을 누를 때 만든다"
author: Claude
date: 2026-11-13
branch: claude/dreamy-keller-my2vby
cost: { minutes: 8, tokens: 151968 }
id: l-b80cbf14
scope: repo
status: active
replaces: l-e359ffe7
src: agent
touches:
  - mobile/src/record/health-reader.ts
  - mobile/App.tsx
  - docs/v4/features/copy.md
  - mobile/tools/screenshot.mjs
---

## Decided
- 직접 입력에서 꼭 받는 것은 날짜, 거리, 시간이다. 심박, 케이던스 같은 자세한 항목은 선택이다(사용자 결정, 2026-11-13). 지금 받는 선택 항목은 시작 시각, 평균 심박, 평균 케이던스다(어느 항목까지인지는 내 판단). 수면 시간은 넣지 않았다(내 판단: 달리기 하나의 값이 아니다).
- 직접 입력한 기록은 앱이 번호를 만들어 붙인다(사용자 결정, 2026-11-13). 번호는 저장을 누를 때 만들고 모양은 m-<만든 시각>-<무작위 8자>다(내 판단). 한 기기 안에서 겹치지 않으면 된다.
- 직접 입력한 기록의 측정값은 기기에 저장한다. 건강 앱 기록은 측정값을 건강 앱에서 다시 읽지만, 직접 입력은 이 앱 말고는 어디에도 없어서다. 체감 피로와 메모는 건강 앱 기록과 같은 저장소에 가져온 곳(manual) + 번호로 둔다.
- 체감 피로와 메모는 입력 화면에서 묻지 않는다. 저장하면 운동이 끝난 뒤 첫 화면이 그 기록으로 열려 거기서 묻는다. "한 번만 묻는다"와 수정 흐름을 한 곳에만 두려고.
- 시작 시각을 적지 않으면 그 날짜의 0시로 두고 extra에 적지 않았다는 표시를 남긴다. 화면은 날짜만 보여 준다. 지어낸 시각을 측정값처럼 보여 주지 않으려고.
- 기록 번호 타입에서 null을 뺐다. 건강 앱 원본에 번호가 없으면 변환이 던진다(다시 찾을 수 없는 기록은 받지 않는다).

## Tried and ruled out
- 날짜 고르는 네이티브 창(datetimepicker): 네이티브 모듈이라 확인용 웹 번들에서 그려지지 않아 스크린샷 도구로 볼 수 없다. 숫자만 받아 구분 글자를 붙이는 칸으로 했다(웹의 기록 칸과 같은 방식).

## Watch out
- 앱을 다시 열면 건강 앱의 마지막 운동과 직접 입력 중 더 늦게 끝난 것 하나만 보인다. 지난 날짜로 적은 기록은 저장은 되지만 다시 열면 안 보인다. 목록, 고치기, 지우기가 아직 없다.
- 케이던스는 직접 입력에만 값이 있다. 건강 앱 변환은 null로 두고 원본 걸음 항목은 extra에 남아 있다.
- 스크린샷 도구는 브라우저 시계를 2026-11-13에 세운다. 날짜 칸이 오늘로 채워져서다.

In the code: mobile/src/record/manual.ts (readManualForm, newManualRecordId, manualRecord, START_TIME_ENTERED, MANUAL_LIMITS), mobile/src/record/manual-store.ts (parseManualSaved, MANUAL_SAVED_VERSION), mobile/src/record/health-reader.ts (createLatestWorkoutReader), mobile/src/screens/ManualEntryScreen.tsx, mobile/App.tsx, mobile/src/copy/manual-entry.ts, docs/v4/features/copy.md, mobile/tools/screenshot.mjs (manual 흐름, FIXED_NOW)
