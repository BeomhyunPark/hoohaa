---
title: "직접 입력한 기록은 앱이 기록 번호를 만들어 붙인다"
author: Claude
date: 2026-11-13
branch: claude/compassionate-brahmagupta-6bhj3z
cost: { minutes: 5, tokens: 30719 }
id: l-e359ffe7
scope: repo
status: active
src: agent
touches:
  - docs/screenshots/v4/after-run-5-reopened-android.png
  - docs/screenshots/v4/after-run-5-reopened-iphone.png
  - docs/v4/next.md
  - mobile/App.tsx
  - mobile/README.md
  - mobile/__tests__/App.test.tsx
  - mobile/__tests__/after-run-screen.test.tsx
  - mobile/__tests__/record-store.test.ts
  - mobile/package-lock.json
  - mobile/package.json
---

## Decided
- 직접 입력한 기록은 바깥에서 받은 기록 번호가 없으므로 앱이 번호를 만들어 붙인다(사용자 결정, 2026-11-13). 그래야 건강 앱 기록과 같은 방법(가져온 곳 + 기록 번호)으로 다시 찾고 덮어쓸 수 있다.
- 번호의 모양과 만드는 때는 정하지 않았다. 직접 입력을 만들 때 정한다. 지금은 직접 입력이 없어 번호를 만드는 코드도 없다(내 판단: 쓰는 곳이 없는 코드는 넣지 않았다).

## Watch out
- 직접 입력을 만들 때 번호를 붙이고 origin.sourceRecordId 타입에서 null을 뺀다. 그러면 기기 저장소의 "번호가 없으면 저장 거절"과 메모리 저장소의 "번호가 없으면 늘 새로 넣기"는 닿지 않는 코드가 되니 같이 지운다.

In the code: docs/v4/features/health-import.md (결정), mobile/src/record/types.ts (RecordOrigin.sourceRecordId), mobile/src/record/device-store.ts (save), mobile/src/record/store.ts (sameRecord)
