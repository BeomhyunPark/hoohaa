---
title: "렌더 전역(캔버스 높이·글자 효과·글꼴 경로)은 편집기마다 하나인 컨텍스트와 렌더마다 새로 만드는 복사본으로 나눴고, 스냅샷은 옮기기 전에 내 템플릿과 공유 카드까지 넓혔다"
author: Claude
date: 2026-11-04
branch: claude/fervent-bell-qw9lue
cost: { minutes: 13, tokens: 243130 }
id: l-86e1a415
scope: repo
status: active
src: agent
touches:
  - src/editor/editor.js
  - src/editor/render.js
  - sw.js
  - tools/snap.mjs
  - tools/snap/README.md
  - tools/snap/baseline/log-diet-feed.png
  - tools/snap/baseline/log-diet-square.png
  - tools/snap/baseline/log-diet-story.png
  - tools/snap/baseline/log-diet-thumb.png
  - tools/snap/baseline/log-race-dday-feed.png
---

## Decided
- 렌더 컨텍스트를 두 겹으로 했다. createRenderCtx()는 편집기가 뜰 때 한 번 만들고 글꼴 경로와 글꼴 캐시(loaded, pv)를 갖는다. renderDoc(ctx, ...)은 모든 await가 끝난 바로 그 자리(예전 setH_ 자리)에서 rc = { ...ctx, H, fx: null }를 새로 만든다. 렌더마다 자기 rc를 가지니, 미리보기·썸네일·renderMini가 겹쳐도 상태를 나눠 쓰지 않는다. 그리는 함수(drawTextBlock, fxText, logText, specText, layerGeom, bgDraw, ltPos)는 rc를 첫 인자로 받는다.
- 예전 전역은 render 바깥에서 읽는 곳이 없었다(grep으로 확인). 그래서 그림은 그대로이고, 스냅샷 91장이 바이트까지 같았다.
- setFontBase(부르는 곳 없음)는 없앴다. 경로는 createRenderCtx({ fontBase })로만 정한다.
- 옮기기 전에 스냅샷을 넓혔다: 내 템플릿 3개(v3 캔버스 스티커 + 티어 카드, 글자 효과 + 기록 블록 전부, 도형 + 빈 사진 칸 + 데이터 스티커) × 4형식, 공유 카드 13종 × 4형식. 기준은 main 코드로 만들었다.
- 일부러 망가뜨려 확인했다: ltPos가 높이를 무시하면 log-*-story/feed/square가, fx를 항상 null로 하면 mine-text-*가 실패한다.

## Watch out
- 내 템플릿과 공유 카드는 relayout 뒤 clampIn이 레이어를 옮길 수 있다. 내보내기 전에 window.__doc()이 두 프레임 동안 그대로일 때까지 기다리지 않으면 결과가 흔들린다.
- 내 템플릿 목록은 편집기가 뜰 때 만들어지므로 localStorage에 미리 넣어야 한다. 기존 24장의 조건을 바꾸지 않으려고 따로 브라우저 컨텍스트를 연다.
- editor.js에는 아직 결과 화면(renderResult 구역, 약 180줄)이 남아 있다. 렌더가 아니라서 B7에서 옮기지 않았다.

In the code:
- src/editor/render.js createRenderCtx, renderDoc(ctx, d, doc, photos, cv); editor.js의 rctx
- tools/snap.mjs MINE, LOG_CASES, newCtx({ mytpl }); 기준 91장 약 47MB
- import 정리는 eslint(/opt/node-tools/node_modules/.bin/eslint, no-undef)로 확인했다
