---
title: "같은 날 두 세션이 저장한 learning은 파일 이름과 번호가 겹칠 수 있다: main을 합칠 때 남의 것은 두고 내 것을 다시 저장한다"
author: Claude
date: 2026-11-13
branch: claude/friendly-cannon-mpcg94
cost: { minutes: 2, tokens: 24598 }
id: l-33163489
scope: repo
status: active
src: agent
touches:
  - docs/tasks/v4-health.md
---

## Decided
- 제목이 한글뿐인 learning은 파일 이름이 날짜-note-claude(-2, -3…)로 붙고, 번호(id)도 그 이름에서 나온다. 그래서 같은 날 서로 다른 브랜치에서 저장하면 내용이 다른데도 파일 이름과 번호가 똑같아진다. main을 합칠 때 add/add 충돌이 난다.
- 충돌이 나면 main 쪽 파일을 그 이름에 그대로 두고, 내 learning은 본문을 그대로 꺼내 `trail note`로 다시 저장한다. 그러면 새 파일 이름과 새 번호가 붙는다. 손으로 파일 이름만 바꾸면 번호가 여전히 겹친다.
- 시안을 코드로 옮길 세션은 피그마를 못 볼 수 있다. 그래서 확정한 시안 그림(상태 전부, 디자인 노트)을 저장소에 넣고, 프롬프트에 색 값과 크기를 글로도 적었다. 프롬프트는 작업 문서에 V6으로 넣는다(사용자 요청).

## Tried and ruled out
- 충돌한 내 파일을 새 이름으로 옮기기만 하기: 번호가 main 것과 같아서 한 번호에 learning 두 개가 됐다.

## Watch out
- 오래 열어 둔 브랜치에서 문서를 고치기 전에 main을 먼저 합친다. 이 브랜치는 V3 시점이었고 그 사이 V4·V5가 머지돼 있었다.
- 저장소에는 이 일과 무관하게 번호가 겹친 learning이 이미 두 쌍 있다(l-236caf5c, l-57a34cab). 건드리지 않았다.

In the code:
- 충돌 났던 이름: .trail/learnings/2026-11-13-note-claude.md, 2026-11-13-note-claude-2.md (번호 l-886a0956, l-e359ffe7). 내 것은 2026-11-13-note-claude-4.md, -5.md로 다시 저장했다.
- 꺼내는 법: `git show :2:<파일>`이 내 쪽, `:3:`이 main 쪽이다. `git checkout --theirs <파일>`로 main 것을 남긴다.
- 시안 그림: docs/screenshots/v4/design/states-volt.png, notes.png. 프롬프트: docs/tasks/v4-health.md의 V6.
