---
title: "글꼴을 고르거나 글자를 입력하는 동안에는 편집기가 선택한 요소 쪽으로 캔버스 화면만 확대한다"
author: Claude
date: 2026-11-03
branch: claude/serene-noether-wuh075
cost: { minutes: 3, tokens: 27265 }
id: l-c7127977
scope: repo
status: active
src: agent
touches:
  - README.md
  - src/editor/assets.js
  - src/editor/editor.js
  - sw.js
  - tools/build_stickers.py
  - tools/build_templates.mjs
  - src/styles/app.css
---

## Decided
- 글꼴 창이 열려 있거나 입력 모드일 때는 캔버스가 화면 절반 이하로 줄어든다. 그래서 선택한 작은 글자(예: '평균 페이스' 라벨)는 실기기에서 글꼴이 바뀌는 게 안 보였다. 사용자가 손가락으로 확대하면 브라우저 전체가 확대되고, 편집기는 그대로 작게 남았다(사용자 실기기 제보). 그래서 이 두 상태에서는 #stage에 CSS transform(translate + scale)을 걸어, 선택한 요소를 편집 영역 가운데에 크게 보여 준다.
- 배율은 요소가 편집 영역 폭의 80%, 높이의 45% 안에 들어오는 값으로 정하고, 최대 3배다. 4배는 1080px 원본이 늘어나서 글자가 흐려졌기 때문이다. 1.2배보다 작게 나오면 확대하지 않는다.
- 확대 중에는 선택 표시와 크기 조절 핸들(#ovl)을 opacity 0으로 숨긴다. 핸들도 함께 커져서 글자를 가렸기 때문이다. visibility:hidden을 쓰면 캔버스 탭이 먹히지 않아서 opacity를 쓴다.

## Watch out
- 저장되는 이미지는 바뀌지 않는다. 화면 표시만 확대된다. 포인터 좌표는 getBoundingClientRect로 계산하기 때문에 확대 중에도 맞는다.
- 확대 위치는 글꼴을 고른 직후와 글자를 입력할 때마다 다시 계산한다(setTimeout 60ms). 렌더가 끝나야 박스 크기가 바뀌기 때문이다.

In the code:
- src/editor/editor.js: focusZoom() (sheet 블록 위), openFontSheet/closeFontSheet/pickFont 이후, updTyping, tText input에서 호출
- src/styles/app.css: #tplCard.zoomed 규칙
