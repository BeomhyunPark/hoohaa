---
title: "앱 아이콘은 SVG 원본을 고친 뒤 PNG를 모두 다시 렌더한다: 그림자까지 포함해 위아래 가운데, 마스커블은 80% 크기"
author: Claude
date: 2026-11-03
branch: claude/quirky-hypatia-cy3r0y
cost: { minutes: 2, tokens: 55168 }
id: l-3aa18b62
scope: repo
status: active
src: agent
touches:
  - favicon.ico
  - favicon.svg
  - icons/apple-touch-icon.png
  - icons/icon-192.png
  - icons/icon-32.png
  - icons/icon-512.png
  - icons/icon-maskable-512.png
  - icons/symbol.svg
  - sw.js
---

## Decided
- 로고는 하늘색 그림자까지 포함한 전체 높이로 위아래 가운데를 맞춘다. 예전에는 그림자가 타일 바닥에 거의 닿아 아이콘이 아래로 처져 보였다. 좌우는 원래 거의 가운데라 건드리지 않았다.
- PNG 아이콘은 저장소에 만드는 스크립트가 없다. SVG 원본을 고친 뒤 Playwright(Chromium)로 크기별로 다시 렌더했다. 종류별 규칙은 이렇다:
  - icon-32/192/512: 둥근 모서리 그대로, 모서리 밖은 투명
  - apple-touch-icon(180): 모서리 없이 꽉 찬 사각 배경(#0F1620), 로고 크기 1배, RGB
  - icon-maskable-512: 꽉 찬 사각 배경, 로고를 가운데 기준 0.8배(안드로이드 안전 영역), RGB
  - favicon.ico: favicon.svg에서 16·32px

## Watch out
- 렌더할 때 svg 태그의 width/height만 바꾸고, 안쪽 rect의 width="64"는 건드리면 안 된다. 정규식으로 처음 나오는 width/height를 지우면 배경 rect가 사라진다.
- 둥근 모서리 PNG의 위아래 여백을 픽셀로 잴 때 모서리의 반투명 픽셀이 전경으로 잡혀 값이 틀리게 나온다. 눈으로 미리보기를 확인한다.
- 아이콘은 서비스 워커 캐시 목록에 있으므로 바꾸면 캐시 번호도 올린다.

In the code:
- icons/symbol.svg 바깥 transform translate(10,-3.58) (그림 범위 y 7.66~63.5 → 가운데 32)
- favicon.svg translate(5,-1.53) (y 2.06~33)
- sw.js CACHE hoohaa-shell-42
