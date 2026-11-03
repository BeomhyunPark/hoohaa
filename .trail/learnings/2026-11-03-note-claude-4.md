---
title: "결과 화면의 '다른 기록 넣기'는 결과 요약과 공유 이미지 편집기 사이에 두고, 편집기 패널이나 결과 요약 안에 넣지 않는다"
author: Claude
date: 2026-11-03
branch: claude/amazing-knuth-o4zyk4
cost: { minutes: 5, tokens: 99373 }
id: l-21986ed2
scope: repo
status: active
src: agent
touches:
  - app/index.html
  - docs/screenshots/result-again/after-android-log-result.png
  - docs/screenshots/result-again/after-android-result-again.png
  - docs/screenshots/result-again/after-iphone-log-result.png
  - docs/screenshots/result-again/after-iphone-result-again.png
  - docs/screenshots/result-again/before-android-result-again.png
  - docs/screenshots/result-again/before-iphone-result-again.png
  - index.html
  - log/index.html
  - result/index.html
---

## Decided
- 버튼은 결과 요약 바로 아래, 공유 이미지 편집기 카드 위에 둔다. 편집기 카드는 화면 한 장 높이(100dvh)라서 맨 아래에 두면 캔버스를 지나야 하고, 캔버스 위 터치는 편집 조작이 먼저 가져가서 스크롤하기도 불편하다.
- 보조 버튼(밑줄 텍스트)으로 두어서 위쪽 공유하기 버튼보다 눈에 덜 띄게 한다.

## Tried and ruled out
- 편집기 템플릿 패널 안: 예전에 이 자리에 있었다. 패널은 ▦템플릿 도구를 열 때만 보여서, 결과 화면에서 입력 화면으로 돌아가는 길이 브라우저 뒤로 가기밖에 없었다.
- 결과 요약 안: 편집기가 요약의 innerHTML을 통째로 바꾸고, 결과 공유 PNG도 요약을 그대로 렌더해서 버튼이 지워지거나 이미지에 찍힌다.

## Watch out
- 이 마크업은 진입점 3곳만이 아니라 /log/까지 4곳에 똑같이 있다. 하나를 고치면 4곳을 다 고친다.
- /log/ 카드 흐름(log-mode)에서는 결과 요약이 비어 있어서 버튼이 편집기 바로 위에 오고, 누르면 기록 입력 화면으로 돌아간다.

In the code:
- index.html, result/index.html, app/index.html, log/index.html: `#barResult.actions.res-again`가 `#resBody`와 `#tplCard` 사이에 있음
- src/styles/app.css: `.res-again{max-width:660px;margin:8px auto 16px}`
- src/app/boot.js: `applyScreen()`이 barResult 표시/숨김, `#again` 클릭은 log-mode면 기록 화면, 아니면 `navBack()`
