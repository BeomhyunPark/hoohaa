---
title: "편집기에서 글자를 입력하는 동안에는 시트와 도구를 숨기고 캔버스와 입력칸 한 줄만 남긴다"
author: Claude
date: 2026-11-03
branch: claude/serene-noether-wuh075
cost: { minutes: 1, tokens: 2377 }
id: l-236caf5c
scope: repo
status: active
src: agent
touches:
  - src/editor/editor.js
  - src/styles/app.css
---

## Decided
- 글자를 입력하는 동안에는 '입력 모드'로 바꿔서 [입력칸][입력 완료] 한 줄과 캔버스만 남긴다. 바텀시트 높이는 visualViewport 높이에 맞추기 때문에, 키보드가 올라오면 남은 반쪽 화면을 상단 버튼, 도구줄, 시트 손잡이, 시트가 나눠 쓴다. 그러면 캔버스 높이가 80px 안팎으로 줄어든다(사용자 실기기 제보). 입력 모드에서는 키보드 336px 기준으로 캔버스가 144×256으로 보인다.
- '입력 완료'는 키보드만 닫고 선택은 유지한다. 글자를 쓴 다음에는 보통 글꼴이나 색을 바꾸기 때문이다.

## Watch out
- 버튼을 누르면 입력칸의 blur가 click보다 먼저 온다. 그래서 입력 모드 해제를 120ms 늦추고, blur 시각(data-typedAt)을 남겨서 500ms 안에 온 '완료' 클릭을 '입력 완료'로 처리한다. 그렇지 않으면 '입력 완료'를 눌러도 선택이 해제되고 시트가 닫혀 버린다.
- 입력 모드는 #tText에만 건다. 글꼴 검색이나 날씨 장소 검색은 결과 목록이 보여야 하기 때문이다.
- Playwright에는 가상 키보드가 없기 때문에 setViewportSize로 높이를 336px 줄여서 흉내 냈다. 실기기 확인이 따로 필요하다.

In the code:
- src/editor/editor.js: 시트 블록 안의 typing mode (panel focusin, focusout, capture click)
- src/styles/app.css: #tplCard.sheet-on.typing 규칙 (파일 맨 끝)
