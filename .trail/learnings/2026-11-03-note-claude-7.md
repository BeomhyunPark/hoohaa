---
title: "편집기에서 키보드가 올라와 글자를 입력하는 동안에는 시트와 도구를 숨기고 캔버스와 입력칸 한 줄만 남긴다"
author: Claude
date: 2026-11-03
branch: claude/serene-noether-wuh075
cost: { minutes: 2, tokens: 10797 }
id: l-57a34cab
scope: repo
status: active
replaces: l-236caf5c
src: agent
touches:
  - src/editor/editor.js
  - src/styles/app.css
  - docs/qa/a2-editor/README.md
  - docs/qa/a2-editor/f1-thumb-polaroid-android.jpg
  - docs/qa/a2-editor/f1-thumb-polaroid-iphone.jpg
  - docs/qa/a2-editor/f2-feed-mono-android.jpg
  - docs/qa/a2-editor/f2-feed-mono-iphone.jpg
  - docs/qa/a2-editor/f3-mine-thumb-android.jpg
  - docs/qa/a2-editor/f3-mine-thumb-iphone.jpg
  - docs/qa/a2-editor/f4-undo-start-android.jpg
---

## Decided
- 텍스트 입력칸에 포커스가 있고 화면 키보드도 올라와 있을 때만 '입력 모드'로 바꾼다. 입력 모드에서는 [입력칸][입력 완료] 한 줄과 캔버스만 남긴다. 바텀시트 높이는 visualViewport 높이에 맞추기 때문에, 키보드가 올라오면 남은 반쪽 화면을 상단 버튼, 도구줄, 시트가 나눠 쓴다. 그러면 캔버스 높이가 80px 안팎으로 줄어든다(사용자 실기기 제보). 입력 모드에서는 키보드 336px 기준으로 캔버스가 144×256으로 보인다.
- '입력 완료'는 키보드만 닫고 선택은 유지한다. 글자를 쓴 다음에는 보통 글꼴이나 색을 바꾸기 때문이다.

## Tried and ruled out
- 포커스만으로 입력 모드를 켜는 방법: 텍스트 도구는 setTimeout 안에서 입력칸에 focus를 주는데, iOS는 이 경우 키보드를 띄우지 않을 수 있다. 데스크톱에는 키보드가 아예 없다. 두 경우 모두 키보드가 없는데도 도구줄이 숨어서 다른 도구를 누를 수 없었기 때문에 버렸다.

## Watch out
- 키보드 판정 기준: visualViewport 높이가 지금까지 본 가장 큰 높이의 75%보다 작으면 키보드가 올라왔다고 본다. 화면 폭이 바뀌면(회전) 기준을 다시 잡는다. Android는 레이아웃 뷰포트 자체가 줄어들기 때문에 innerHeight와 비교하면 키보드를 못 잡는다.
- 버튼을 누르면 입력칸의 blur가 click보다 먼저 온다. 그래서 입력 모드 해제를 120ms 늦추고 blur 시각(data-typedAt)을 남긴다. 500ms 안에 온 '완료' 클릭은 '입력 완료'로 처리한다. 그렇지 않으면 '입력 완료'를 눌러도 시트가 닫힌다.
- Playwright에는 가상 키보드가 없기 때문에 setViewportSize로 높이를 336px 줄여서 흉내 냈다. 실기기 확인이 따로 필요하다.

In the code:
- src/editor/editor.js: 시트 블록 안의 typing mode (kbUp, updTyping, panel focusin/focusout/capture click)
- src/styles/app.css: #tplCard.sheet-on.typing 규칙
