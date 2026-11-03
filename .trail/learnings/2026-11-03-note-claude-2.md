---
title: "기록 입력칸은 숫자만 받는다: 콜론을 넣은 입력을 따로 해석하지 않는다"
author: Claude
date: 2026-11-03
branch: claude/loving-planck-sju852
cost: { minutes: 4, tokens: 132406 }
id: l-0588cadc
scope: repo
status: active
src: agent
touches:
  - src/app/boot.js
---

## Decided
- 계산기와 홈의 기록 입력칸은 숫자만 받고, 뒤에서부터 2자리씩 끊어 초·분·시간으로 읽는다. 1시간 5분 30초는 10530으로 입력한다. 사용자가 콜론을 쳐도 지워지고 자동으로 다시 붙는다.
- "1:5:30"이나 "50:0"처럼 콜론을 넣어 붙여넣은 값을 콜론 기준으로 해석하는 보정은 넣지 않기로 했다(사용자 판단). 붙여넣으면 숫자만 남아서 15:30, 5:00으로 읽히는데, 이건 설계대로다.

## Tried and ruled out
- 붙여넣기(insertFromPaste)일 때만 콜론 구간을 2자리로 채워 읽는 보정을 검토했다. 사용자가 "10530으로 입력해야 한다"고 정리해서 넣지 않았다.

## Watch out
- 입력 규칙을 바꾸려면 7개 계산기 페이지와 홈(src/app/boot.js)을 같이 바꿔야 한다. 한쪽만 바꾸면 같은 입력이 페이지마다 다르게 읽힌다.

In the code:
- 각 계산기 index.html의 show()/read() (페이스는 showP()/readP()), 홈은 src/app/boot.js의 digitsToDisplay()/parseTimeDigits()
- 시간 상한 29, 분·초 상한 59, 7자리 이상은 "기록을 다시 확인해 주세요."
