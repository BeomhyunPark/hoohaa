---
title: "결과 공유 이미지에는 티어표를 넣지 않고 예상 기록과 훈련 페이스만 넣는다"
author: Claude
date: 2026-11-23
branch: claude/wonderful-allen-kha5cd
cost: { minutes: 2, tokens: 67055 }
id: l-b472760d
scope: repo
status: active
src: agent
touches:
  - src/editor/result.js
  - tools/rescmp.mjs
---

## Decided
사용자 결정(2026-11-23): 결과 화면의 공유 이미지에서 티어표 패널을 통째로 뺀다. 티어는 위 티어 카드와 다음 티어 진행 바가 이미 보여 주므로 겹치고, 빼면 이미지가 약 20% 짧아진다. 결과 화면의 티어표 탭은 그대로 둔다.

## Tried and ruled out
캡처 복제본에서 `.res-panel:has(.lad)` 선택자로 지우기: `:has()`를 모르는 옛 브라우저에서는 querySelectorAll이 예외를 던져 공유 전체가 깨진다. `.lad`를 찾아 closest('.res-panel')로 지운다.

## Watch out
공유 이미지의 「상위」 칸 아래에 나이대·성별(예: 30대 남성)이 아직 나간다. 코드 주석은 공유 이미지에 나이·성별을 넣지 않는다고 되어 있어 어긋난다(이번 변경 전부터).

In the code: src/editor/result.js resCaptureNode. 확인은 node tools/rescmp.mjs --against <main 워크트리> (share-image 줄만 달라야 정상).
