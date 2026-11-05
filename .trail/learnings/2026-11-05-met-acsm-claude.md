---
title: "러닝 칼로리는 MET 표가 아니라 ACSM 러닝 공식으로 계산하고, 안정 시 소비까지 넣은 총량을 보여 준다"
author: Claude
date: 2026-11-05
branch: claude/running-calories-calculator-5l6ozj
cost: { minutes: 4, tokens: 97969 }
id: l-c4622205
scope: repo
status: active
src: agent
touches:
  - src/engine/calories.js
  - src/engine/calories.test.mjs
  - sw.js
  - calories/index.html
  - docs/screenshots/calories/iphone-time.png
  - docs/screenshots/calories/iphone-home-cards.png
---

## Decided
- ACSM 러닝 공식(VO2 = 0.2 × 속도(m/min) + 3.5, 평지)과 산소 1L ≈ 5kcal를 쓴다. MET 표(Compendium)는 페이스 구간마다 값이 계단식이고 정확한 수치를 확인할 원본이 없어서 쓰지 않았다. 사용자 규칙: 근거가 확실하지 않은 계수는 쓰지 않는다.
- 결과는 3.5(안정 시) 항까지 넣은 총량(gross)이고, 그중 안정 시 몫을 따로 보여 준다. 운동으로 늘어난 몫(net)은 평지에서 1 kcal/kg/km로 페이스와 상관없다. 테스트가 이 성질을 확인한다.
- 페이스는 2:00~12:30/km만 받는다. ACSM은 134 m/min(7:28/km) 이상에서 쓰고 80~134 m/min은 실제로 뛸 때만 쓰라고 해서, 7:28보다 느리면 계산은 하되 안내 문구를 바꾼다.
- 쉬운 비교는 사용자가 준 "밥 한 공기 ≈ 300kcal" 하나만 쓴다. 다른 음식 칼로리는 출처를 확인하지 못해 넣지 않았다.

## Watch out
- 경사(오르막) 항은 공식에 있지만 입력이 없어 0으로 둔다. 넣으려면 runCalories에 grade를 추가한다.
- /calories/는 sw.js SHELL에 없다(/bmr/과 같다). 홈 카드를 고쳐서 CACHE만 올렸다.

In the code:
- src/engine/calories.js: runCalories({weight, pace(초/km), distance|time}), riceBowls, LIMITS
- calories/index.html: 기본값 65kg·5km·6:00 결과(359 kcal)를 HTML에 미리 채움. calories.test.mjs가 엔진 값과 같은지 확인하므로 기본값을 바꾸면 같이 바꾼다
- 페이스·시간 입력칸은 parse.js의 readPace/readTime/showPace/showTime을 import해서 쓰고, 숫자만 넘긴다
