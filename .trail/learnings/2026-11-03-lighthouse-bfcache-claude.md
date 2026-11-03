---
title: "Lighthouse를 로컬에서 잴 때 압축·bfcache 경고는 무시하고, 계산기 결과칸은 기본값으로 미리 채워 레이아웃 밀림을 막는다"
author: Claude
date: 2026-11-03
branch: claude/sweet-ramanujan-a0t9y1
cost: { minutes: 6, tokens: 76237 }
id: l-cb50a8f4
scope: repo
status: active
src: agent
touches:
  - pace-calculator/index.html
---

## Decided
- 계산기 페이지에서 결과칸(output)이 비어 있다가 JS가 채우면 아래 내용이 밀려 CLS가 크게 나온다(페이스 계산기 0.21 → 성능 90). 기본 입력값으로 계산한 결과를 HTML에 미리 넣어 두면 디자인 변화 없이 CLS 0이 된다. JS가 같은 값으로 다시 그리니 동작도 같다.
- /app/의 SEO 66점은 `noindex` 때문이다. 앱 화면이라 일부러 막아 둔 것으로 보고 건드리지 않았다(검색 유입은 / 와 안내 페이지가 맡는다). 바꾸려면 제품 결정이 필요하다.

## Tried and ruled out
- / 와 /app/의 app.css render-blocking(약 50~120ms)과 unused CSS는 빌드 없이 고치려면 핵심 CSS를 손으로 인라인해야 해서 두었다. 성능은 이미 99점이다.

## Watch out
- http-server로 로컬에서 재면 uses-text-compression, bf-cache(no-store), unminified 경고가 뜬다. GitHub Pages는 gzip을 해 주므로 실제 문제가 아니다.
- Lighthouse 접근성 100점이어도 axe-core를 직접 돌리면 더 잡힌다(가로 스크롤 표의 키보드 포커스, main 랜드마크 누락).

In the code:
- 측정: lighthouse@12를 임시 폴더에 설치, CHROME_PATH=/opt/pw-browsers/chromium, --chrome-flags="--headless --no-sandbox" --form-factor=mobile, 서버는 `http-server -p 8080 -c-1`
- pace-calculator/index.html: #pO, #pO2 미리 채움 (거리 10 · 50:00, 페이스 5:30 기준). 기본값을 바꾸면 미리 채운 값도 같이 바꿔야 한다
- 가로로 넘치는 .tw 표에는 tabindex="0" role="region" aria-label을 단다
