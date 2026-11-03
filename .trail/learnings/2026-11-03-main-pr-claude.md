---
title: "캐시 번호는 머지 직전에 main 번호를 보고 올린다: 두 PR이 같은 번호로 올리면 충돌 없이 조용히 묻힌다"
author: Claude
date: 2026-11-03
branch: claude/hoohaa-flow-testing-fixes-3wgiku
cost: { minutes: 6, tokens: 35448 }
id: l-891a0862
scope: repo
status: active
src: agent
touches:
  - sw.js
  - docs/qa/a1-flow/f1-ev-refresh-android.jpg
  - docs/qa/a1-flow/f1-ev-refresh-iphone.jpg
  - docs/qa/a1-flow/f2-birthyear-android.jpg
  - docs/qa/a1-flow/f2-birthyear-iphone.jpg
  - docs/qa/a1-flow/f3-time-zero-android.jpg
  - docs/qa/a1-flow/f3-time-zero-iphone.jpg
  - docs/qa/a1-flow/f4-km-dots-android.jpg
  - docs/qa/a1-flow/f4-km-dots-iphone.jpg
  - docs/qa/a1-flow/f5-enter-android.jpg
---

## Decided
- 서비스 워커 캐시 번호는 PR을 머지하기 직전에 main의 현재 번호를 다시 보고, 그보다 1 크게 맞춘다. 같은 번호에서 출발한 두 PR이 둘 다 N → N+1로 올리면 고친 줄이 똑같아서 git은 충돌로 잡지 않는다. 나중에 머지된 PR은 번호를 올리지 못한 채 들어간다.
- 이미 그렇게 머지됐으면 번호만 1 올리는 PR을 따로 만든다(이번에는 30 → 31).

## Watch out
- "여러 PR이 동시에 올리면 충돌한다"는 예전 learning과 달리, 실제로는 충돌이 나지 않고 조용히 묻힌다. 그러면 먼저 머지된 PR의 번호를 이미 받은 설치형 앱(/app/)은 나중 PR의 파일을 받지 못한다.
- CI와 캐시 목록 검사는 파일이 목록에 있는지만 본다. 번호가 올라갔는지는 보지 않는다.

In the code:
- sw.js 첫 줄 `const CACHE = 'hoohaa-shell-N'`
- 머지 전 확인: `git fetch origin main && git show origin/main:sw.js | head -1`
- 사례: #57과 #56이 둘 다 29 → 30, #58에서 31
