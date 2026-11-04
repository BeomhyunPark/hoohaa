---
title: "결과 화면을 편집기에서 뺄 때는 HTML 템플릿 문자열의 들여쓰기를 건드리지 않고, 결과 화면은 애니메이션을 끈 채 main과 비교한다"
author: Claude
date: 2026-11-04
branch: claude/fervent-bell-qw9lue
cost: { minutes: 1, tokens: 3183 }
id: l-44d9c453
scope: repo
status: active
src: agent
touches:
  - src/editor/result.js
  - tools/rescmp.mjs
  - tools/snap/README.md
---

## Decided
- 결과 화면은 상태 없는 티어 데이터와 함수를 모듈 최상위에 두고, 클로저 상태(주간 km, html-to-image 로더, 공유 이미지 캐시, IntersectionObserver)는 mountResult(env, hooks) 안에 뒀다. B7에서 모듈 전역 let을 없앤 방향을 지키려고 했다.
- 편집기 상태를 건드리던 곳은 두 가지뿐이었다: 공유 카드 모드 빠져나오기(doc, sel, logCtx 비우기)와 refreshTpl. 이 둘을 훅(leaveLog, refreshTpl)으로 넘긴다.
- 결과 화면은 스냅샷이 찍지 않아서 비교 도구(rescmp)를 만들었다. 입력 5가지 × (마크업, 캡처, 사용 후 상태, 공유 이미지) + 공유 카드에서 결과로 가는 경로를 main과 줄마다 비교한다.

## Tried and ruled out
- 함수 안으로 넣으면서 본문을 2칸 더 들여쓰기: 화면과 공유 이미지는 같았지만, renderResult의 HTML 템플릿 문자열 안 공백이 바뀌어서 마크업이 달라졌다. 그래서 본문은 원래 들여쓰기 그대로 둔다.

## Watch out
- 상위 티어(챌린저 등) 카드는 CSS 애니메이션이 있어서, 캡처와 html-to-image 결과가 실행할 때마다 달라진다. 비교할 때는 애니메이션을 끈다.
- 공유 카드 썸네일(logThumbs)을 다 그리기 전에 결과 화면으로 넘어가면, main에서도 logCtx가 null이라는 페이지 에러가 난다. 기존 버그라 rescmp는 3초를 기다린다. 고치면 이 대기를 빼서 확인한다.
- stkcmp가 한 번 2건 실패했는데, 그 뒤 6번 연속 통과했다. 원인은 남기지 못했다. 다시 실패하면 출력을 저장해서 본다.

In the code:
- src/editor/result.js mountResult; editor.js의 mountResult 호출(결과 화면 구역이 있던 자리)
- tools/rescmp.mjs, tools/snap/README.md 끝
