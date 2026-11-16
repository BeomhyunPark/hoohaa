---
title: "앱 로고는 테마별 PNG로, 글꼴은 Pretendard 세 굵기를 expo-font로 넣고 굵기는 글꼴 이름으로 준다"
author: Claude
date: 2026-11-16
branch: claude/friendly-cannon-mpcg94
cost: { minutes: 18, tokens: 191203 }
id: l-e70e5103
scope: repo
status: active
src: agent
touches:
  - mobile/src/theme/tokens.ts
  - mobile/App.tsx
  - mobile/package.json
---

## Decided
- 투표 1등 로고(2번, 평면 2색)를 다듬어 폰 앱에만 넣었다. 웹(hoohaa.run)과 티어 카드·공유 이미지는 사용자가 "나중에"라고 해서 이번에 고치지 않았다.
- 앱 로고는 SVG 라이브러리(새 네이티브 의존성) 대신 테마별 PNG(@1x·2x·3x, 높이 20pt)로 넣었다. 스톱워치 얼굴이 테마의 강조색이라 테마마다 따로 만든다. 앱 아이콘 색은 기본 테마(볼트)다.
- 로고 원본은 tools/logo/kit.json(Jost ExtraBold Italic 외곽선, OFL) 하나이고, tools/build_logo.mjs가 앱 자산을 만든다. --web 모드(웹 아이콘·머리 로고·og·공유 이미지 도형)도 들어 있지만 아직 돌리지 않았다.
- 다듬은 것: 꼭지 머리를 두껍게 하고 목을 고리 안까지 이어 'ō'처럼 떨어져 보이지 않게, 옆 버튼과 바늘을 조금 키웠다. 얼굴을 고리 밑에 조금 넓게(테두리 1) 깔아 얼굴과 고리 구멍 사이의 머리카락 같은 틈을 없앴다.
- 글꼴은 Pretendard Regular·Medium·Bold(각 약 1.5MB)만 넣었다. 600·800은 Bold로 간다.

## Tried and ruled out
- 심볼만 그릴 때 위쪽 여백을 글자 'h' 높이까지 잡기: 심볼이 아이콘 안에서 아래로 처졌다(투표 이미지 때와 같은 원인). 심볼은 꼭지 끝을 위 끝으로 잡는다.
- 굵기를 fontWeight로 주기: 안드로이드는 따로 불러온 글꼴 사이를 fontWeight로 고르지 못한다. font(500)처럼 글꼴 이름으로 준다.

## Watch out
- 스타일 배열에서 뒤 스타일에 font(400)이 있으면 앞의 굵은 글꼴을 덮어쓴다. 버튼 글자(label → primaryText 등)에서 실제로 그랬다. 변형 스타일에는 글꼴을 넣지 않는다.
- expo-font와 expo-asset은 expo 안에 중첩 설치돼 있어서, 앱 코드에서 불러오려면 package.json에 SDK 버전 그대로 올려야 한다(Jest가 expo-asset을 못 찾았다). 둘 다 expo SDK에 이미 들어 있는 네이티브 모듈이라 개발 빌드를 새로 만들 일은 아닐 것으로 보지만, 실제 기기 빌드로 확인하지 못했다.
- 웹·카드 작업은 한 번 해 봤다가 되돌렸다. 다시 할 때: 안내 페이지 43개는 각자 인라인 :root 변수(--s, --b, --a)를 쓰므로 공통 theme.css에서 html:root 선택자로 두 이름 체계를 함께 덮어쓰는 방식이 통했다.

In the code:
- mobile/src/components/Wordmark.tsx(WORDMARK_ASPECT 348.8/81), mobile/assets/logo/, mobile/assets/fonts/(OFL-Pretendard.txt), mobile/src/theme/tokens.ts(FONT_FILES, font())
- tools/build_logo.mjs(build, flatten, monoSvg, --web), tools/logo/render_app.mjs, tools/logo/render_png.mjs
