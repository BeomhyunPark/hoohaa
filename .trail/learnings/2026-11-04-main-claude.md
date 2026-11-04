---
title: "스냅샷 테스트는 스티커를 찍지 않으니, 스티커 코드를 옮길 때는 편집기 화면에서 스티커를 하나씩 넣어 main과 브랜치의 이미지를 비교한다"
author: Claude
date: 2026-11-04
branch: claude/vibrant-ritchie-aazs5a
cost: { minutes: 1, tokens: 3258 }
id: l-22aec64c
scope: repo
status: active
src: agent
---

## Decided
- 렌더 스냅샷(템플릿 6종 × 형식 4종)에는 스티커가 하나도 들어가지 않는다. 그래서 스티커 코드를 옮기면 스냅샷이 통과해도 스티커 그림이 바뀌었는지 알 수 없다. 대신 main을 git worktree로 따로 꺼내 두고, 같은 스크립트로 양쪽을 돌려 결과 줄을 diff로 비교했다.
- 스크립트는 결과 화면에서 minimal 템플릿을 고른 뒤 스티커 탭(기록·배지·러닝·문구)을 돈다. 버튼마다 미리보기 캔버스의 해시를 남기고, 그 스티커를 넣은 뒤 `window.__exportSig()`를 두 번 불러 저장 이미지 해시를 남긴다. 30종 × 2 = 60줄이 같고 페이지 에러가 없으면 통과로 봤다. 테스트 훅이 `window.__doc()`로 문서의 복사본만 돌려주기 때문에, 레이어를 직접 넣지 않고 화면 버튼을 누르는 방식으로 했다.

## Watch out
- 스티커를 하나 넣으면 선택된 스티커의 편집 패널로 바뀌어서 스티커 탭이 사라진다. 이때 스티커 도구 버튼을 한 번만 누르면 도구가 닫힐 수 있다. 그래서 `#stkCats`가 보일 때까지 도구 버튼의 aria-pressed를 보고 다시 연다. 이걸 놓치면 main과 브랜치가 같은 곳에서 똑같이 죽는데, 출력이 같아서 "SAME"으로 통과한 것처럼 보인다. 결과 줄 수(steps 60)와 errors []를 꼭 확인한다.
- v3 캔버스 스티커(wordmark, emblem 등 STICKERS 목록)는 지금 스티커 탭에 없어서 이 방법으로도 그려지지 않는다.

In the code:
- 비교 스크립트는 커밋하지 않았다(세션 scratchpad의 stkcmp.mjs). tools/snap.mjs의 서버·고정 시계·외부 요청 차단을 그대로 따라 했다
- 테스트 훅: window.__exportSig, window.__lastStory, window.__doc; 버튼: #tools [data-tool="sticker"], #stkCats [data-stkcat], [data-addstk], [data-addin]
