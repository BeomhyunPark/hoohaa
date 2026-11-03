---
title: "공유 카드 만들기 폼은 한 묶음 목록으로 보이고, 줄 아래 안내는 그 줄을 누를 때만 보인다"
author: Claude
date: 2026-11-03
branch: claude/zealous-cray-v8e4gb
cost: { minutes: 3, tokens: 72514 }
id: l-57a34cab
scope: repo
status: active
src: agent
touches:
  - src/app/logs.js
  - src/styles/app.css
---

## Decided
- 리디자인 3단계(/log/): 입력칸은 라벨 · 값 · 단위/보조 정보 한 줄씩 묶은 목록이다. 숫자 입력 안내와 날씨 위치 안내는 지우지 않고, 그 줄에 포커스가 있을 때만 보여 준다. 늘 보이면 시안보다 목록이 훨씬 길어진다.
- 최근 기록은 종류 색 미리보기 카드 가로 목록이다. 카드를 누르면 예전 "카드" 버튼처럼 공유 카드가 열리고, 수정·삭제는 카드 아래 작은 버튼으로 남겼다(시안엔 없지만 기능이라 유지).
- "설정 · 백업" 링크는 맨 아래 details(#lgSet)를 열고 그리로 스크롤한다. 설정 기능은 그대로 거기 있다.
- 마크업은 전부 src/app/logs.js가 #logRoot에 그려서, 이번 단계는 HTML 4곳을 고칠 필요가 없었다.

## Watch out
- `.lg-form input` 규칙(선택자 점수 0,1,1)이 `.vh`(0,1,0)보다 세서, 숨긴 파일 입력칸에도 width:100%·min-height가 붙는다. 사진 입력칸은 `.lg-form .lg-photo input.vh`로 다시 1px로 줄였다.

In the code:
- src/app/logs.js row(), photoField(), face(), paintToday(), #lgSetGo
- src/styles/app.css "공유 카드 만들기(/log/) 리디자인" 블록
