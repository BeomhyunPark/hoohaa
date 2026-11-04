---
title: "사진 스냅샷 케이스는 합성 러너 그림으로 편집기 버튼을 눌러 만들고, 케이스마다 페이지를 다시 연다"
author: Claude
date: 2026-11-04
branch: claude/wonderful-archimedes-iywpfh
cost: { minutes: 9, tokens: 156237 }
id: l-29488181
scope: repo
status: active
src: agent
touches:
  - tools/snap.mjs
  - tools/snap/README.md
  - tools/snap/baseline/photo-bg-story.png
  - tools/snap/baseline/photo-cut-story.png
  - tools/snap/baseline/photo-layer-story.png
  - tools/snap/fixtures/make_runner.py
  - tools/snap/fixtures/runner.jpg
---

## Decided
- 테스트 사진은 Pillow로 그린 합성 러너 그림(2000×2500)을 쓴다. 클라우드 세션 네트워크가 Wikimedia 같은 외부 이미지 호스트를 막고(403), 실제 인물 사진은 저작권·초상권 문제도 있다. 단순한 도형 그림인데도 MediaPipe selfie segmenter가 인물로 잡았고, 같은 환경에서 두 번 돌려 PNG가 바이트까지 같았다(CPU delegate라 결정적이다).
- 1600px보다 크게 만들어 addPhotoFile의 축소 경로도 스냅샷에 들어가게 했다.
- 사진 상태는 window.__doc()가 복사본만 돌려줘서 직접 못 넣는다. 그래서 편집기 버튼을 누르고, 파일은 숨은 #photo input에 setInputFiles로 넣는다(헤드리스에서는 파일 선택 창이 안 뜬다).

## Watch out
- 템플릿 버튼을 눌러도 배경 사진과 사용자가 추가한 레이어는 남는다(userLayers, keepBg). 케이스 사이에 템플릿만 다시 고르면 앞 케이스의 사진 레이어가 남아서 엉뚱한 레이어를 검사하게 된다. 케이스마다 페이지를 다시 연다(init 스크립트가 localStorage를 비워 새 문서로 시작).
- MediaPipe 지연 로드는 snap이 /seg/ 요청 순서로 검사한다. photo-cut-story 앞에서 /seg/ 요청이 생기면 실패한다.

In the code:
- tools/snap.mjs PHOTO_CASES, tools/snap/fixtures/runner.jpg, make_runner.py
- 버튼: #tools [data-tool="photo"], #phBg, #phAdd, #peFilter [data-v], #peRot, #peFlip, #peCrop → #crRatio [data-v="1:1"] → #crApply, #peCut, #peOl, #olW, #pa_br/#pa_ct(#peMore로 펼침), #miniBar [data-mb="behind"]
