---
title: "종목 미리 선택 쿼리는 홈에서만 쓰고 주소에서 바로 지운다"
author: Claude
date: 2026-11-03
branch: claude/hoohaa-flow-testing-fixes-3wgiku
cost: { minutes: 16, tokens: 133687 }
id: l-ad9e4ae8
scope: repo
status: active
src: agent
touches:
  - docs/qa/a1-flow/f1-ev-refresh-android.jpg
  - docs/qa/a1-flow/f1-ev-refresh-iphone.jpg
  - docs/qa/a1-flow/f2-birthyear-android.jpg
  - docs/qa/a1-flow/f2-birthyear-iphone.jpg
  - docs/qa/a1-flow/f3-time-zero-android.jpg
  - docs/qa/a1-flow/f3-time-zero-iphone.jpg
  - docs/qa/a1-flow/f4-km-dots-android.jpg
  - docs/qa/a1-flow/f4-km-dots-iphone.jpg
  - docs/qa/a1-flow/f5-enter-android.jpg
  - docs/qa/a1-flow/f5-enter-iphone.jpg
---

## Decided
- 안내 페이지에서 들어오는 `?ev=` 쿼리는 홈에서만 종목을 미리 고르는 데 쓰고, 적용한 뒤 주소에서 지운다. 화면을 바꿀 때 쿼리가 그대로 남아서 결과 주소까지 따라갔고, 결과 화면에서 새로고침하면 저장된 입력으로 계산한 다음에 쿼리가 종목을 바꿔 버렸다. 그래서 5K 기록에 10K 라벨이 붙었다.
- 결과 주소를 직접 열면 쿼리는 무시하고, 저장된 입력 그대로 다시 계산한다.

## Watch out
- 결과 화면은 계산 결과와 현재 선택 종목을 함께 써서 그린다. 결과를 계산한 뒤에 선택 종목을 바꾸면 라벨과 페이스가 서로 맞지 않게 된다.

In the code:
- src/app/boot.js: `?ev` 처리 블록은 `restore()` 바로 뒤, `/result/` 재계산(`$('go').click()`)보다 앞에 둔다. `wantResult`/`wantLog`일 때는 적용하지 않는다.
- 재현: /?ev=10k → 5K 선택 → 결과 → 새로고침
