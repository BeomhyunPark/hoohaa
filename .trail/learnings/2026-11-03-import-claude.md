---
title: "캐시 목록 검사는 import로 불러오는 모듈만 잡고, 태그로 불러오는 파일이나 합쳐 만든 경로는 놓친다"
author: Claude
date: 2026-11-03
branch: claude/busy-euler-v9298z
cost: { minutes: 1, tokens: 48896 }
id: l-5d5a7dfa
scope: repo
status: active
src: agent
touches:
  - ".github/workflows/test.yml"
  - README.md
  - tools/check-sw.mjs
  - tools/test.mjs
---

## Decided
- 테스트 파일은 `node --test`가 아니라 plain node로 하나씩 돌린다. 테스트 중 일부는 node:test 없이 assert만 쓰고 "ok"를 찍는 방식이다. 이 방식도 실패하면 assert가 throw해서 exit 코드가 0이 아니게 되므로 그대로 둔다.
- 캐시 목록 검사는 편집기와 앱 진입점에서 출발해, import를 꼬리를 물고 따라간다. 편집기를 쪼개면 새 파일이 한 단계 아래에서 import될 수 있어서, 진입점이 바로 import하는 파일만 보면 부족하다.

## Watch out
- `<script src>`나 `<link href>`를 코드로 만들어 붙여서 불러오는 파일(html-to-image, card.css)과, 문자열을 이어 붙여 만드는 동적 import 경로(seg의 vision_bundle)는 검사가 보지 못한다. 이런 식으로 새 파일을 불러오게 되면 서비스 워커 캐시 목록에 직접 넣어야 한다.

In the code:
- tools/test.mjs: src/ 아래 *.test.mjs를 하나씩 spawn, 하나라도 실패하면 exit 1
- tools/check-sw.mjs: sw.js에서 SHELL/ON_USE를 정규식으로 읽음. 진입점은 src/editor/editor.js와 src/app/*.js. 템플릿 문자열(`${`)이 들어간 specifier는 건너뜀
- CI: .github/workflows/test.yml (Node 22)
