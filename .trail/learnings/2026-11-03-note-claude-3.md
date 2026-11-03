---
title: "공유 카드 기록은 저장 스키마를 그대로 두고, 입력 중인 값은 세션 저장소에, 저장·삭제·복원은 한 트랜잭션으로 한다"
author: Claude
date: 2026-11-03
branch: claude/epic-pasteur-vnm8y8
cost: { minutes: 3, tokens: 13577 }
id: l-9938e599
scope: repo
status: active
src: agent
touches:
  - 10k/index.html
  - bmr/index.html
  - pace-calculator/index.html
  - src/app/logs.js
  - src/engine/logcalc.js
  - src/engine/logcalc.test.mjs
  - src/storage/device.js
  - src/storage/logdb.js
  - src/storage/zip.js
  - src/storage/zip.test.mjs
---

## Decided
- 기록 DB(hoohaa-log)는 버전 1 그대로 둔다. 새로고침해도 입력 중인 값을 지키려고 새 저장소를 만들면 스키마 버전을 올려야 해서, 글자 값은 sessionStorage(이 탭에서만, 새로고침은 버팀)에 둔다. 고른 사진(File)은 거기 못 넣으니 새로고침 뒤에는 "다시 골라 주세요"라고만 알린다.
- 손대지 않은 날짜·시간 기본값은 초안에 넣지 않는다. 자정을 넘겨 열어 둔 폼이 어제 날짜로 저장되지 않게 하려는 것.
- 기록 저장(사진·대회 포함), 수정, 삭제, 백업 복원은 여러 저장소를 한 readwrite 트랜잭션으로 묶는다. 중간에 실패하면 아무것도 바뀌지 않는다. 복원은 zip과 backup.json을 전부 검사한 다음에 쓴다.
- 시작일 전 날짜는 Day가 없다(null). 예전처럼 Day 0, Day -2가 나오지 않는다. 0 이하 거리는 거리로 치지 않는다.

## Tried and ruled out
- 신발(gear) 누적 거리 점검: #34에서 기능을 내렸고, docs/tasks의 A3 프롬프트에만 남아 있다. gear 저장소와 type=gear 기록은 백업에 그대로 실려 다시 살릴 수 있게 둔다.

## Watch out
- readZip은 이제 async다(deflate는 DecompressionStream으로 풀고, CRC도 확인한다). 사용자에게 보여 줄 오류는 ZipError/BackupError의 message(해요체)만 쓰고, 그 밖의 오류는 일반 문구로 바꿔 보여 준다.
- tx() 콜백 안에서는 IndexedDB 요청만 쌓아야 한다. 다른 promise를 await하면 트랜잭션이 저절로 끝나 버린다.

In the code:
- src/storage/logdb.js: tx(), saveLog(), deleteLog()(남는 대회 기록도 지움), importZip()(BackupError), BACKUP_VERSION
- src/storage/zip.js: ZipError, ZIP_MSG
- src/app/logs.js: sessionStorage 키 'hoohaa-log-draft'(device.js wipeDevice에서도 지움), startEdit(), 저장 버튼 busy 가드
