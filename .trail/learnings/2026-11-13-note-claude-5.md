---
title: "지난 기록 목록은 직접 입력 전부 + 건강 앱 마지막 운동 하나이고, 고치기·지우기는 직접 입력한 기록에만 둔다"
author: Claude
date: 2026-11-13
branch: claude/dreamy-keller-my2vby
cost: { minutes: 1, tokens: 2347 }
id: l-82967842
scope: repo
status: active
src: agent
touches:
  - mobile/App.tsx
  - mobile/src/screens/RecordListScreen.tsx
  - mobile/src/screens/AfterRunScreen.tsx
  - mobile/src/screens/ManualEntryScreen.tsx
  - mobile/src/record/health-reader.ts
  - mobile/src/record/manual.ts
---

## Decided
- 고치기와 지우기는 직접 입력한 기록에만 있다, because 건강 앱 기록의 측정값은 건강 앱의 것이라 이 앱에서 바꾸면 다음에 읽을 때 원래 값으로 돌아온다(내 판단).
- 고쳐도 기록 번호와 만든 시각은 그대로 둔다, because 번호가 바뀌면 체감 피로와 메모를 찾지 못해 다시 묻게 된다.
- 지울 때는 측정값을 먼저, 체감 피로와 메모를 그다음에 지운다, otherwise 뒤쪽이 실패했을 때 체감 피로만 사라진 기록이 남아 다시 묻게 된다. 이 순서면 다시 찾을 길 없는 값만 남아 해가 없다.
- 목록의 건강 앱 기록은 마지막 운동 하나뿐이다, because 읽는 자리(HealthReader)가 하나만 읽는다. 실제 건강 앱 읽기를 붙일 때 넓힌다.
- 화면 전환은 App.tsx의 상태 하나로 한다, because 화면이 셋뿐이라 내비게이션 라이브러리가 아직 필요 없다(내 판단).

## Tried and ruled out
- 지울지 묻는 데 Alert.alert 쓰기: react-native-web에서는 아무 일도 하지 않아 확인용 웹 번들과 스크린샷 도구에서 지우기를 볼 수 없다. 화면 안에 묻는 말과 버튼을 그렸다.

## Watch out
- 안드로이드의 뒤로 가기 버튼은 화면을 되돌리지 않고 앱을 나간다.
- 목록은 기록마다 체감 피로를 하나씩 찾는다. 기록이 수백 개가 되면 한 번에 읽는 방법이 필요하다.

In the code: mobile/App.tsx (View, onDeleteRecord), mobile/src/screens/RecordListScreen.tsx, mobile/src/screens/AfterRunScreen.tsx (deleting), mobile/src/screens/ManualEntryScreen.tsx (editing), mobile/src/record/health-reader.ts (createRecordLister), mobile/src/record/manual.ts (manualFormOf)
