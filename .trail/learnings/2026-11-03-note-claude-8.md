---
title: "글꼴 목록 창은 편집기 위에서 아래 절반만 쓰고 배경을 어둡게 하지 않아서, 바뀌는 글꼴을 캔버스에서 바로 보게 한다"
author: Claude
date: 2026-11-03
branch: claude/serene-noether-wuh075
cost: { minutes: 2, tokens: 23247 }
id: l-951bee6f
scope: repo
status: active
src: agent
touches:
  - src/editor/editor.js
  - src/styles/app.css
  - sw.js
---

## Decided
- 글꼴 목록 창(전체 글꼴)은 화면 아래 54%만 쓰고, 뒤 배경을 어둡게 칠하지 않는다. 예전에는 78% 높이에 어두운 배경까지 있었기 때문에, 폰에서 글꼴을 눌러도 캔버스가 가려져서 바뀌는 게 안 보였다(사용자 제보).
- 창이 열려 있는 동안 편집기는 상단 버튼, 도구줄, 시트, 미니 툴바를 숨기고, 아래쪽에 창 높이만큼 여백(padding)을 준다. 그래서 캔버스가 위쪽 절반을 꽉 채운다(390×664 기준 168×299).
- 창 안의 라이선스 안내 문구는 숨긴다. 글꼴 목록이 한 줄 반밖에 안 보였기 때문이다. 같은 문구는 편집기 패널 안의 글꼴 목록에 그대로 있다.

In the code:
- src/styles/app.css: body.fs-open 규칙 (--fs-h:54dvh)
- src/editor/editor.js: openFontSheet/closeFontSheet가 끝날 때 paintOvl로 미니 툴바 위치를 다시 잡는다
