---
title: "기록·페이스 파싱은 한 함수로 모았지만 입력칸은 여전히 숫자만 넘기고, 기록 화면과 티어 엔진의 파서는 합치지 않았다"
author: Claude
date: 2026-11-05
branch: claude/kind-volta-pjff7t
cost: { minutes: 6, tokens: 139994 }
id: l-22f93985
scope: repo
status: active
src: agent
touches:
  - tools/calccmp.mjs
  - src/engine/parse.js
  - src/engine/parse.test.mjs
  - src/engine/bmr.js
  - src/engine/bmr.test.mjs
  - sw.js
---

## Decided
- 계산기 5개 페이지(/pace-calculator/의 기록·페이스, /predictor/, /splits/, /vdot/, /vo2max/)와 홈 기록 칸이 같은 함수로 읽는다. 함수는 콜론 형식·공백·전각 콜론·음수도 받지만, 페이지는 예전처럼 입력값에서 숫자가 아닌 글자를 지운 뒤 넘긴다. "기록 입력칸은 숫자만 받는다"는 결정을 지키려고, 붙여넣은 '1:5:30'은 지금도 15:30으로 읽힌다. 콜론을 콜론대로 읽게 하려면 페이지의 replace(/\D/g,'')를 바꿔야 하고, 이건 제품 결정이다.
- 0의 처리는 옵션으로 남겼다. 계산기 페이지는 0을 빈칸처럼 다루고(null, "기록을 넣어 주세요"), 홈은 "0초는 계산할 수 없어요" 오류를 보여 준다. 예전부터 이렇게 달랐다.
- 페이스(m:ss)는 분 상한이 없다(4자리까지, 99:59). 기록은 시간 29, 분·초 59까지다.

## Tried and ruled out
- 기록 화면(src/engine/logcalc.js의 parseDur)과 티어 엔진(tier.js의 parseTime)까지 합치기: 둘은 계약이 다르다. parseDur는 시간 상한·자릿수 상한이 없고 잘못된 값은 null, parseTime은 소수 초와 숫자를 받고 NaN을 돌려준다. 기존 테스트와 저장된 기록에 영향이 있어 이번에는 그대로 뒀다.

## Watch out
- /pace/에는 입력칸이 없다(정적 표와 탭뿐). 계산기 페이지 수를 셀 때 착각하기 쉽다.
- /bmr/의 스크립트는 이제 type="module"이다. 활동량 옵션은 HTML에 그대로 있고, bmr.test.mjs가 bmr.js의 ACTIVITY와 값·글자·기본값이 같은지 확인한다.

In the code:
- src/engine/parse.js: parseClock(v, {kind:'time'|'pace', zero:'empty'|'error'}), readTime, readPace, showTime, showPace. 테스트는 숫자 문자열 약 30만 개를 예전 페이지 함수와 맞춰 본다
- src/engine/bmr.js: bmrMifflin, tdee, goals, energy, ACTIVITY, LIMITS
- 페이지는 window.RT에 readTime/readPace/showTime/showPace를 실어 classic 스크립트에서 쓴다
- tools/calccmp.mjs --against <dir>: 페이지에 같은 입력을 넣고 두 체크아웃을 비교(436단계)
- sw.js SHELL에 /src/engine/parse.js (boot.js가 import), CACHE hoohaa-shell-51
