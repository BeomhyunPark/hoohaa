---
title: "공유 이미지 편집기는 도구를 열 때만 전체 화면 바텀시트로 띄우고, 캔버스를 누르고 있는 동안에는 레이아웃을 바꾸지 않는다"
author: Claude
date: 2026-11-03
branch: claude/serene-noether-wuh075
cost: { minutes: 13, tokens: 236602 }
id: l-a072137e
scope: repo
status: active
src: agent
touches:
  - src/editor/editor.js
  - src/styles/app.css
---

## Decided
- 편집기 메뉴(패널, 템플릿 목록)는 도구를 열거나 요소를 선택했을 때만 보인다. 이때 편집기 카드가 화면 전체에 고정되고, 메뉴는 아래쪽 바텀시트(화면 높이의 약 34%, 위로 밀면 60%)가 되어 시트 안에서만 스크롤된다. 예전에는 패널이 페이지 흐름 안에 있어서 캔버스와 옵션을 보려고 페이지를 위아래로 오가야 했다.
- 아무것도 열지 않았을 때는 패널을 숨겨서 캔버스를 가장 크게 보여 준다. 예전의 안내 문단은 뺐다.
- 시트를 고정할 때 카드 자리에 같은 높이의 자리 표시(.sheet-ph)를 넣는다. 그래야 페이지 스크롤이 튀지 않는다.

## Watch out
- 캔버스를 누르는 순간 선택이 바뀌어 패널 높이가 달라지면, 손가락 아래에서 캔버스 크기가 바뀐다. 그러면 끌던 요소가 엉뚱한 곳(아래로 수백 px)으로 튄다. 기존 코드에도 있던 버그다. 그래서 손가락이 캔버스에 닿아 있는 동안(#ovl data-down)에는 시트 열기·닫기를 미루고, 손을 뗀 뒤에 적용한다.
- 시트가 닫혀 있으면 .panel과 .st-tpls를 display:none으로 둔다. 패널 내용이 바뀌어도 레이아웃이 바뀌지 않게 하려는 것이다.
- 도구 버튼 아이콘과 실행취소 아이콘은 4개 페이지(/, /app/, /result/, /log/) HTML을 고치지 않고 editor.js가 마운트될 때 SVG로 바꿔 넣는다.

In the code:
- src/editor/editor.js: sheet(on), sheetOn(), closeSheet(), fitSheet()(visualViewport로 --vvh, --vvt 설정), #sheetGrab 버튼, placeMini의 compact 처리
- src/styles/app.css: #tplCard.sheet-on 규칙들 (파일 맨 끝)
