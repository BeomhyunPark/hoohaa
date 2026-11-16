---
title: "앱의 화면 색 고르기는 보던 화면을 숨겨 둔 채 위에 띄워서, 돌아왔을 때 입력하던 값이 남게 한다"
author: Claude
date: 2026-11-16
branch: claude/friendly-cannon-mpcg94
cost: { minutes: 4, tokens: 41870 }
id: l-9e3d2d0d
scope: repo
status: active
src: agent
touches:
  - mobile/App.tsx
---

## Decided
- 사용자 요청으로 앱에도 화면 색(테마) 고르기를 만들었다. 입구는 화면 맨 위 로고 오른쪽 "화면 색" 버튼(첫 화면, 지난 기록)이다. 직접 입력 화면에는 두지 않았다(적던 값이 있다). 웹 꼬리말의 "화면 색"과 같은 이름이다.
- 고른 값은 기기 저장소 키 hoohaa/theme에 두고, 앱을 열 때 글꼴과 함께 다 읽은 뒤에 그린다. 모르는 값이나 읽기 실패는 볼트다. 저장에 실패해도 이번에는 바뀌고, 고르는 화면에 알린다.

## Tried and ruled out
- 테마 화면을 다른 화면처럼 view 상태로 바꾸고 back으로 돌아오기: 돌아오면 첫 화면이 새로 마운트돼서 고르던 체감 피로와 적던 메모가 사라졌다. 보던 화면은 display:none으로 그리지 않되 마운트는 남기고, 테마 화면을 따로 띄운다.

## Watch out
- 숨긴 화면도 마운트돼 있으므로 테스트에서 queryByText는 숨긴 요소를 기본으로 찾지 않는다(RNTL v14). 그래서 "보던 화면이 숨었다"를 queryByText(...)==null로 볼 수 있다.
- ThemeContext는 이제 이름과 색을 같이 준다(useThemeName, useColors). Wordmark는 이름으로 테마별 PNG를 고른다.

In the code:
- mobile/App.tsx(themeName, themeOpen, chooseTheme, styles.hidden), mobile/src/screens/ThemeScreen.tsx(Preview), mobile/src/components/Header.tsx, mobile/src/theme/theme-store.ts, mobile/src/copy/theme.ts, docs/v4/features/copy.md "화면 색"
- 스크린샷 흐름 theme(mobile/tools/screenshot.mjs)
