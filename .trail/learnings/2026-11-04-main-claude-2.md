---
title: "스냅샷 테스트는 스티커를 찍지 않으니, 스티커 코드를 옮길 때는 스티커 비교 도구로 main과 브랜치의 이미지를 비교한다"
author: Claude
date: 2026-11-04
branch: claude/vibrant-ritchie-aazs5a
cost: { minutes: 1, tokens: 3029 }
id: l-780c7cf3
scope: repo
status: active
replaces: l-22aec64c
src: agent
touches:
  - tools/stkcmp.mjs
  - tools/snap/README.md
---

## Decided
- 렌더 스냅샷(템플릿 6종 × 형식 4종)에는 스티커가 하나도 없어서, 스티커 코드를 옮기면 스냅샷이 통과해도 그림이 바뀌었는지 알 수 없다. 그래서 스티커 비교 도구를 tools/에 두었다. 이 도구는 기준 이미지 없이 다른 체크아웃(보통 main의 git worktree)과 해시를 줄마다 비교한다. 스티커 기준 PNG 30장을 레포에 또 커밋하지 않기 위해서다.
- 화면 버튼을 눌러 스티커를 넣는다. 테스트 훅 `window.__doc()`가 문서의 복사본만 돌려줘서 레이어를 직접 넣을 수 없기 때문이다.

## Watch out
- 스티커를 넣으면 선택된 스티커의 편집 패널로 바뀌어 스티커 탭이 사라진다. 도구 버튼이 눌린 상태에서 또 누르면 닫히기 때문에, aria-pressed를 보고 다시 연다. 처음 만든 버전은 이걸 놓쳐서 main과 브랜치가 같은 곳에서 똑같이 죽었다. 그런데 출력이 같아서 "같음"으로 보였다. 그래서 도구는 페이지 에러가 나거나, 버튼이 사라지거나, 스티커가 0개이면 exit 1로 끝난다.
- v3 캔버스 스티커(wordmark, emblem 등 STICKERS 목록)는 스티커 탭에 없어서 그리지 않는다.

In the code:
- tools/stkcmp.mjs: `node tools/stkcmp.mjs --against <다른 체크아웃>`. 설명은 tools/snap/README.md 끝에 있다
- B5 기준으로 30종 × (미리보기 + 저장) = 60줄. 스티커 색 하나를 바꾸면 32줄이 달라지고 exit 1인 것을 확인했다
