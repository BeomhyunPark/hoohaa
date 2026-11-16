---
title: "웹은 기능을 고치지 않지만 로고와 화면 색은 앱에 맞춘다: 테마는 공통 CSS 한 장이 페이지마다 다른 변수 이름을 함께 덮어쓴다"
author: Claude
date: 2026-11-16
branch: claude/friendly-cannon-mpcg94
cost: { minutes: 5, tokens: 41218 }
id: l-0e8de6bc
scope: repo
status: active
src: agent
touches:
  - src/editor/render.js
  - src/editor/result.js
  - sw.js
---

## Decided
- 사용자 결정(2026-11-16): hoohaa.run은 기능을 고치지 않는다는 원칙은 그대로이고, 예외로 로고와 화면 색만 앱과 같게 맞춘다. 화면 색은 테마 3개(볼트 기본, 밤하늘, 노을)를 사용자가 꼬리말의 "화면 색"에서 고른다. 고른 값은 기기에만(localStorage 'hoohaa-theme') 남는다.
- 티어 카드 디자인과 티어 색은 그대로다. 바뀐 것은 카드 오른쪽 위 워터마크(DOM 카드와 캔버스 카드 둘 다)와 공유 이미지 템플릿의 hoohaa.run 로고뿐이다. 그래서 스냅샷은 패스·영수증 템플릿과 티어 카드가 든 내 템플릿 12장만 바뀌었고 기준 그림을 새로 저장했다.
- 공유 이미지 자체의 색(템플릿 바탕 등)은 테마를 따르지 않는다. 결과 화면을 html-to-image로 저장할 때의 바탕과 편집기 선택 테두리만 지금 테마를 따른다.

## Watch out
- 안내 페이지 43개는 각자 인라인 <style>의 :root에 다른 이름(--s, --b, --a, --a2)으로 색을 둔다. theme.css가 html:root 선택자(우선순위가 :root보다 높다)로 앱 화면 이름(--surface, --accent …)과 안내 페이지 이름을 함께 덮어쓰므로, 어느 순서로 불러도 테마가 이긴다. 새 페이지를 만들면 머리에 테마 스크립트 세 줄(번쩍임 방지 인라인, theme.css, theme.js)과 꼬리말의 [data-theme-pick]을 넣는다.
- 머리 로고는 인라인 SVG이고 색은 class(.wm-i/.wm-f/.wm-h)로 theme.css가 준다. 로고를 고치면 `node tools/build_logo.mjs --web`이 모든 html의 <svg class="wm">을 바꾼다.
- 공유 이미지·워터마크의 로고는 src/editor/logo-geom.js(생성 파일)의 평평한 경로 목록이다. 조각마다 따로 짝홀 규칙으로 채워야 한다(합치면 꼭지와 고리가 겹친 곳이 뚫린다).
- og 이미지를 바꾸면 html의 og.png?v= 번호를 올린다(SNS 미리보기 캐시).

In the code:
- src/styles/theme.css, src/app/theme.js(테마 고르기, 방향키, theme-color 갱신), 모든 html 머리의 인라인 스크립트
- src/editor/render.js logoCanvas(LOGO_ASPECT), 티어 카드 캔버스 워터마크; src/editor/result.js WM_G(마스크로 바늘을 뚫음)
- sw.js CACHE 53, SHELL에 theme.css·theme.js, ON_USE에 logo-geom.js. 머지 직전 main의 번호를 다시 본다.
