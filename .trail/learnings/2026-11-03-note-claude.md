---
title: "편집기 코드를 쪼개기 전에 그림 비교 테스트와 캐시 목록 검사부터 만든다"
author: Claude
date: 2026-11-03
branch: claude/blissful-hawking-iqc095
cost: { minutes: 6, tokens: 91555 }
id: l-815ffa50
scope: repo
status: active
src: agent
touches:
  - docs/tasks/README.md
  - docs/tasks/debt.md
  - docs/tasks/polish.md
  - ".grok/skills/trail/SKILL.md"
  - src/editor/editor.js
  - sw.js
  - README.md
---

## Decided
- 공유 이미지 편집기 코드는 함수 하나의 클로저 안에 전부 들어 있어서, 함수를 밖으로 빼면 숨은 상태 때문에 그림이 조용히 달라질 수 있다. 그래서 순서를 정했다: 테스트 일괄 실행과 CI → 구조 지도 → 그림 비교(스냅샷) 테스트 → 그 다음에 분리(공통 함수 → 스티커 → 사진 → 렌더). 분리 PR 하나는 "옮기기만" 한다. 이름 변경과 로직 수정은 섞지 않는다.

## Watch out
- 편집기 쪽에 새 모듈 파일을 만들면 서비스 워커 캐시 목록에도 넣어야 한다. 빠뜨리면 오프라인이나 설치형 앱에서 편집기가 안 열린다. 캐시되는 파일을 고칠 때마다 캐시 번호도 올려야 하고, 여러 PR이 동시에 올리면 서로 충돌한다.
- 편집기 QA 작업과 분리 작업을 동시에 돌리면 같은 큰 파일에서 충돌한다.

In the code:
- src/editor/editor.js: 약 200KB, `export async function mountEditor(env)` 하나. 클로저 상태는 doc, photos, sel, H_, FX, FONT_BASE
- sw.js: SHELL(설치 때 캐시), ON_USE(편집기를 열 때 캐시) 목록과 `CACHE = 'hoohaa-shell-N'`
- 세션별 작업 프롬프트: docs/tasks/ (README.md, polish.md, debt.md)
