---
title: "편집기 분리 PR을 같은 작업 브랜치로 이어 갈 때는 squash 머지 뒤 강제 푸시가 필요하니 사용자 허락을 먼저 받는다"
author: Claude
date: 2026-11-03
branch: claude/vibrant-ritchie-aazs5a
cost: { minutes: 1, tokens: 2548 }
id: l-1b8370a6
scope: repo
status: active
src: agent
---

## Decided
- 이 레포는 PR을 squash로 머지하는데, 그러면 원격 작업 브랜치에는 머지 전 커밋이 그대로 남는다. 같은 브랜치 이름으로 다음 분리를 이어 가려면 main에서 브랜치를 다시 만들어야 한다. 그러지 않으면 이미 머지된 커밋 위에 새 커밋이 쌓이기 때문이다. 다시 만든 브랜치는 원격과 기록이 갈라져서, 보통 푸시는 non-fast-forward로 거부된다.
- 강제 푸시는 자동 권한 검사에서 "Git Destructive"로 막힌다. 그래서 사용자에게 먼저 물어 허락을 받은 뒤 `--force-with-lease=<브랜치>:<머지된 커밋>`으로 덮어썼다. 이렇게 하면 원격 브랜치가 머지된 그 커밋일 때만 덮어써지므로, 그 사이 누가 브랜치에 푸시했다면 그 작업을 지우지 않고 실패한다.
- tokens.js로 옮길 때 지도 목록에 없던 glyphPts, glyphSVG도 같이 옮겼다. TK만 읽는 코드라, editor.js에 남기면 그것 때문에 tokens를 다시 import해야 하기 때문이다. 부르는 곳이 없는 코드지만 지우는 건 "옮기기만" 원칙 때문에 별도 정리 PR 몫으로 남겼다.

## Watch out
- trail check가 칩 SVG(Kode Mono)를 "티어 카드 단순화 금지" learning에 걸린다고 표시한다. 하지만 코드를 위치만 옮긴 경우에는 잘못 잡은 것이다. 카드 코드를 한 글자도 바꾸지 않았으므로, 그 learning을 따르는 변경이라고 PR 본문에 적으면 된다.

In the code:
- 머지 전 확인: `git fetch origin main`, `git show origin/main:sw.js | head -1`로 캐시 번호 확인 (#75 기준 main 43, PR 44)
- 푸시: `git push --force-with-lease=claude/vibrant-ritchie-aazs5a:<머지된 sha> -u origin claude/vibrant-ritchie-aazs5a`
