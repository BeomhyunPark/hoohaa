---
title: "가끔 흔들리던 스티커 비교는 테스트 문제가 아니라, 데이터 스티커가 그리기 전에 필요한 글꼴을 기다리지 않아서 생긴 경쟁 상태였다"
author: Claude
date: 2026-11-04
branch: claude/fervent-bell-qw9lue
cost: { minutes: 46, tokens: 110925 }
id: l-0c9a2449
scope: repo
status: active
src: agent
touches:
  - src/editor/editor.js
  - sw.js
  - tools/rescmp.mjs
  - tools/snap/README.md
  - src/editor/result.js
  - src/editor/render.js
  - tools/stkcmp.mjs
---

## Decided
- 원인: 렌더가 전체 한글 글꼴(pretendardk)이 필요한지 판단할 때 데이터 스티커는 레이어의 f(입력값)만 봤다. 스티커 탭 미리보기는 f 없이 그려서 기본 문구("맑음 · 바람 약함", "반포 → 잠수교")가 검사에서 빠졌다. 그래서 그 순간 다른 렌더가 pretendardk를 먼저 불러 두었는지에 따라 글자가 서브셋+대체 글꼴로 섞이거나 전체 글꼴로 그려졌다. 이제 데이터 스티커는 dataFields(기본값+입력값)로 검사한다.
- 같은 종류로, 메모 스티커는 Gaegu로 그리게 되어 있었지만 렌더가 그 글꼴을 기다리지 않아서 보통은 시스템 고딕으로 저장됐다. 이제 메모 스티커가 있으면 gaegu를 기다린다. 저장 이미지의 메모 글씨가 손글씨로 바뀐다(설계대로).
- 재현은 CPU를 느리게 하는 것(Chrome DevTools Emulation.setCPUThrottlingRate 6)으로 했다. 같은 체크아웃을 보통 속도와 느린 속도로 돌려 비교하는 stkcmp --race를 만들었다. main에서는 정확히 그 2줄이 달라지고, 고친 뒤에는 60줄이 같다.

## Tried and ruled out
- 그냥 여러 번 돌리기: 12번 중 몇 번을 돌려도, stkcmp 3개를 동시에 돌려도 재현되지 않았다.
- "테스트가 미리보기를 너무 일찍 읽는다" 가설: 느린 상태에서 6초를 기다려도 결과가 같게 달랐다. 대기를 늘리는 건 답이 아니었다.

## Watch out
- 렌더가 그리는 글자에 쓰는 글꼴은 renderDoc의 await 구간에서 모두 기다려야 한다. 새 스티커나 레이어가 lazy 글꼴(FONTS의 LZ ...)을 쓰면 거기에 추가한다. 빠뜨리면 평소엔 대체 글꼴로, 가끔은 제 글꼴로 그려진다.
- 글꼴·렌더를 고치는 PR에서는 stkcmp --against main에 더해 --race도 돌린다.

In the code:
- src/editor/render.js renderDoc: txt 수집(data_ 스티커는 dataFields), data_memo면 ctx.loadFont('gaegu')
- tools/stkcmp.mjs --race (RACE_RATE 6), tools/snap/README.md
