---
title: "폰 앱 첫 화면을 시안대로 옮길 때: 피로는 role slider 하나, 색은 테마 역할 이름만, 숨긴 글자는 테스트에서 따로 찾는다"
author: Claude
date: 2026-11-16
branch: claude/friendly-cannon-mpcg94
cost: { minutes: 14, tokens: 641961 }
id: l-cc51cd0b
scope: repo
status: active
src: agent
touches:
  - mobile/tools/screenshot.mjs
  - mobile/src/screens/AfterRunScreen.tsx
---

## Decided
- 체감 피로 버튼 10개(라디오 묶음)를 슬라이더 하나로 바꿨다(사용자 확정 시안). 새 네이티브 의존성 없이 View의 터치 응답(onResponderGrant/Move의 locationX)으로 만들었다. 화면 낭독기에는 `role="slider"`와 aria-valuemin/max/now/text, 올리기·내리기 동작 하나다. 값이 없을 때 올리면 1, 내리면 그대로다.
- 색은 src/theme/colors.ts의 역할 이름만 쓴다. 테마 셋(볼트 기본, 밤하늘, 노을)을 두되 지금은 ThemeProvider 기본값 하나로만 그린다.
- 밤하늘 테마의 흐린 글자(#97A4B5)는 올린 면 위 대비가 4.497이라 #99A6B7로 아주 조금 밝혔다. 시안 노트의 "4.5"는 반올림 값이었다. 피그마 변수는 그대로다.

## Tried and ruled out
- 테스트에서 `getByRole('adjustable')`: React Native의 `role="slider"`는 호스트 요소에 role prop으로 남아서 adjustable로 찾으면 못 찾는다. `getByRole('slider')`로 찾는다.
- 포매터를 설정 없이 돌리기(`npx prettier --write src`): 저장소에 설정 파일이 없어 큰따옴표·80자로 src 전체를 다시 썼다. 원래 모양은 `--single-quote --print-width 140 --trailing-comma all`과 거의 같지만 그것도 기존 줄을 다시 접으니, 새 파일에만 쓰고 기존 파일은 손으로 고친다.

## Watch out
- 슬라이더 눈금, 양 끝 글자, 고른 값 알약은 낭독기에서 숨겼다(값은 슬라이더가 읽는다). RNTL v14는 숨긴 요소를 기본으로 찾지 않으니 테스트에서 `{ includeHiddenElements: true }`를 준다.
- 테스트에서 값을 고를 때는 test-utils/exertion.ts의 pickExertion을 쓴다(layout으로 폭을 준 뒤 responderGrant). 웹 스크린샷은 슬라이더의 칸 가운데를 클릭하고 `[role="slider"][aria-valuenow="n"]`을 기다린다.
- 기록 카드는 숫자와 단위를 나눠 그린다("5:42"와 "/km"). 화면 글자로 "5:42/km"를 찾던 테스트는 낭독기 이름("평균 페이스, 5:42/km")으로 찾는다.

In the code:
- mobile/src/components/ExertionSlider.tsx(valueAt), mobile/src/components/ui.tsx(Button, StatusLine), mobile/src/theme/(colors.ts, theme.tsx, tokens.ts)
- mobile/__tests__/theme.test.ts(테마별 대비), mobile/test-utils/exertion.ts
- mobile/tools/screenshot.mjs: pickExertion, 새 흐름 no-hr(심박이 없는 기록)
