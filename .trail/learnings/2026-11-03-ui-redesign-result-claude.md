---
title: "결과 화면은 탭으로 하나씩 보여주되, 결과 공유 이미지에는 세 탭 내용을 모두 펼쳐 담는다"
author: Claude
date: 2026-11-03
branch: claude/zealous-cray-v8e4gb
cost: { minutes: 11, tokens: 155983 }
id: l-236caf5c
scope: repo
status: active
src: agent
touches:
  - app/index.html
  - index.html
  - log/index.html
  - result/index.html
  - src/app/boot.js
  - src/styles/app.css
  - sw.js
  - src/editor/editor.js
---

## Decided
- 리디자인 2단계(결과 화면): 티어표·예상 기록·훈련 페이스를 탭으로 묶어 한 번에 하나만 보인다. 그런데 결과 공유 PNG(#resShare)는 #resBody를 복제해 그리므로, 복제본에서는 탭 패널을 모두 펼치고 탭·상단 바·위 요약·펼치기 버튼을 지운다. 그래야 공유 이미지 내용이 예전처럼 티어표+예상 기록+훈련 페이스 전부다.
- 하단 고정 바는 사용자가 골랐다: 큰 버튼 "공유 이미지 만들기"는 아래 공유 이미지 편집기(#tplCard)로 스크롤, 공유 아이콘 버튼이 기존 #resShare(결과 PNG 공유).
- "다른 기록 넣기"(#barResult)는 HTML 위치 그대로(결과 요약과 편집기 사이). 상단 "‹ 다시 입력"은 #again을 대신 눌러서 같은 뒤로 가기 규칙을 탄다.

## Watch out
- 하단 바는 "다른 기록 넣기"나 편집기가 조금이라도 보이면 숨긴다. 위쪽 작은 티어 요약은 편집기가 화면 위쪽 40%까지 올라와야 숨긴다. 같은 조건으로 묶으면 탭 내용이 짧을 때(예상 기록 탭) 편집기 윗부분이 화면 아래에 걸려서 요약이 영영 안 나온다.
- 이름 충돌: 홈 사다리를 `.ladder`로 지었다가 결과 화면의 `section.card.ladder`와 `.ladder i`(행의 점)에 걸렸다. 홈 쪽을 `.tier-ladder`로 바꿨다. 결과 공유 캡처 상자가 `.res-cap` 클래스를 쓰니 그 이름도 피한다.
- `font:700 15px/1.2 inherit`처럼 단축 속성에 inherit를 섞으면 선언 전체가 무효다(굵기·크기가 안 먹음). 예전 `.seg button`에도 같은 줄이 있다.

In the code:
- src/editor/editor.js renderResult(), bindResultUi(), resCaptureNode()의 탭 패널 펼치기
- src/styles/app.css "결과 리디자인 · 피그마 시안 B·C" 블록
