# 렌더 스냅샷 테스트 (tools/snap)

공유 이미지 편집기(`src/editor/editor.js`)가 그리는 최종 PNG를 기준 이미지와 픽셀 단위로 비교한다. editor.js를 여러 모듈로 쪼갤 때 그림이 조용히 바뀌지 않았는지 확인하는 용도다.

> **editor.js를 쪼개거나 렌더 코드를 옮기는 PR에서는 반드시 `node tools/snap.mjs --check`를 돌리고, 통과한 결과를 PR 설명에 적는다.** CI에는 넣지 않았다(브라우저를 띄워서 무겁다).

## 실행

레포 루트에서 실행한다. 미리 설치된 Playwright와 Chromium을 쓴다. `playwright install`은 하지 않는다. npm 패키지 설치도 필요 없다.

```bash
node tools/snap.mjs --check
```

| 명령 | 하는 일 |
|---|---|
| `node tools/snap.mjs --check` | 기준 이미지(`baseline/`)와 비교한다. 다르면 exit 1, 차이 이미지를 `diff/`에 남긴다 |
| `node tools/snap.mjs` | 비교 없이 `out/`에 PNG만 뽑는다 |
| `node tools/snap.mjs --update` | `baseline/`을 새로 만든다. 그림이 바뀌는 게 의도된 PR에서만 쓴다 |

옵션:

- `--only <글자>`: 이름에 그 글자가 들어간 경우만 돌린다. 예: `--only story`, `--only bib-`
- `--tol <0~255>`: 채널(R·G·B·A) 차이가 이 값 이하면 같은 픽셀로 본다. 기본 0
- `--max <비율>`: 이미지마다 다른 픽셀이 이 비율 이하면 통과. 기본 0 (한 픽셀이라도 다르면 실패)

`out/`, `diff/`는 커밋하지 않는다(`.gitignore`).

## 무엇을 찍나

- 입력은 고정이다: 10K 50:00, 남성, 1991년생(고정 날짜 기준 35세, 30대) → 골드 1, 상위 37.9%.
- 날짜는 `2026-05-15 12:00 (Asia/Seoul)`로 고정한다. `new Date()`와 `Date.now()`를 페이지 스크립트보다 먼저 바꾼다. 기록 블록과 날짜 글자에 들어가는 `ymd()` 때문이다.
- 로컬 서버(`127.0.0.1`, 임의 포트) 밖으로 나가는 요청은 전부 막는다(날씨 API 등). 막힌 요청이 있으면 끝에 목록을 찍는다. 서비스 워커도 끈다.
- 화면은 390×844, 배율 1, `ko-KR`. 저장 이미지는 화면 크기와 관계없이 1080 폭이다.
- `/result/`를 열면 저장된 입력으로 결과 화면과 편집기가 뜬다. 거기서 **이미지 형식 4종(story 9:16, feed 4:5, square 1:1, thumb 3:4) × 템플릿 6종**을 하나씩 고르고 최종 PNG를 뽑는다. 파일 이름은 `<템플릿>-<형식>.png`다. 템플릿과 형식 목록은 편집기 화면(`#tplList`, `#fmtSeg`)에서 읽으니, 템플릿이 늘면 `--update`로 기준을 다시 만든다(없는 기준은 MISSING, 남는 기준은 STALE로 실패한다).
- 고르는 순서는 형식 버튼 → 템플릿 버튼이다. 템플릿 버튼이 그 형식으로 새 문서를 만든다(`newDoc(t, fmt)`).
- PNG는 편집기의 `exportCanvas`(= `finalCanvas`)로 뽑는다. 테스트 훅 `window.__exportSig()`가 `finalCanvas()`를 부르고 결과 캔버스를 `window.__lastStory`에 남기므로, 그 캔버스를 `toDataURL`로 받는다. 분리할 때 `window.__exportSig`, `window.__lastStory`, `window.__doc` 이름을 그대로 둬야 이 테스트가 돈다.
- 템플릿 케이스 다음에 **사진 케이스 3개**를 찍는다(story 형식, minimal 템플릿). 테스트 사진은 `fixtures/runner.jpg`다. Pillow로 그린 합성 그림(2000×2500, 실제 사람 아님)이라 `addPhotoFile`이 1600px로 줄이는 경로도 지난다. 다시 만들 때는 `python3 tools/snap/fixtures/make_runner.py <출력>`.
  - `photo-bg-story`: 배경 사진 + 필터(warm) + 90° 회전 + 밝기 30
  - `photo-layer-story`: 사진 레이어 + 좌우 반전 + 1:1 자르기 + 필터(bw) + 대비 40
  - `photo-cut-story`: 배경 사진(golden) 위 글자를 '인물 뒤로' + 사진 레이어 '인물만 남기기' + 누끼 테두리 20px. MediaPipe 인물 분리를 실제로 돌린다
  - 사진 케이스는 편집기 버튼(`#tools [data-tool="photo"]`, `#phBg`, `#phAdd`, `#peFilter`, `#peRot`, `#peFlip`, `#peCrop`, `#peCut`, `#peOl`, `#miniBar [data-mb="behind"]`)을 눌러서 만들고, 파일은 `#photo`에 `setInputFiles`로 넣는다. 케이스마다 페이지를 다시 연다(템플릿을 바꿔도 배경 사진과 추가한 레이어는 남기 때문).
  - MediaPipe 지연 로드도 확인한다. `photo-cut-story` 전에 `/seg/` 요청이 하나라도 있으면, 또는 그 케이스에서 `/seg/vision_bundle.mjs`를 받지 않으면 실패한다. 받은 파일 목록은 끝에 찍는다.
- 사진 케이스 다음에 **내 템플릿 케이스 12개**(`mine-<v3|text|misc>-<형식>`)를 찍는다. snap.mjs의 `MINE`에 적은 v3 문서 3개를 init 스크립트가 `runtier:mytpl`에 넣고(편집기가 뜰 때 템플릿 목록을 만들기 때문에 따로 컨텍스트를 연다), 형식 버튼 → `[data-m]` 버튼을 누른다.
  - `v3`: 티어 배경 + v3 캔버스 스티커 15종(`STICKERS`. 스티커 탭에 없는 것들. `shoe`, `dist` 등 v5 SVG와 이름이 같은 것은 SVG로 그려진다) + 티어 카드 레이어 2종(`drawCard`, 알약)
  - `text`: 그라데이션 배경 + 글자 효과(그림자 `fsh`, 외곽선 `fol`, 글로우 `fgl`), 글자 상자(semi, full, `bcol`), 기록 블록 표시 방식 전부(v0~v4, `look: 'run'`, `@tier`·`@tierL`·`@m1` 색)
  - `misc`: 어두운 배경 + 도형(paper, circle, dash, 사각), 사진 없는 사진 칸(polaroid, circle, round), 데이터 스티커(코스, 배번, 날씨), 아이콘 스티커
  - 내 템플릿은 지금 형식으로 `relayout`되고 `clampIn`이 레이어를 안쪽으로 당길 수 있어서, 내보내기 전에 `window.__doc()`이 두 프레임 동안 그대로일 때까지 기다린다.
- 마지막으로 **공유 카드(오늘 기록) 케이스 52개**(`log-<템플릿>-<형식>`, 13종 × 4형식)를 찍는다. 새 컨텍스트에서 `/log/`를 열고 러닝 기록(10km, 50:00, 메모 한 줄)을 저장 버튼으로 저장하면 편집기가 공유 카드 모드로 열린다. 그 뒤 형식 버튼 → `#tplList [data-lt]` 버튼을 누른다. 카드는 `LOG_H`(1440, 3:4) 기준 좌표로 짜여 있어서 다른 형식에서는 `ltPos`가 아래쪽 절반을 캔버스 높이에 맞춰 옮긴다. 렌더에서 캔버스 높이를 가장 까다롭게 쓰는 곳이다.
- 글꼴 때문에 흔들리지 않게 `document.fonts.ready`를 기다린 뒤 두 번 내보내고, 두 번째 결과를 쓴다.
- 비교는 브라우저 안에서 PNG를 디코드해서 한다(추가 npm 패키지 없음). 차이 이미지는 기준을 회색으로 흐리게 깔고 바뀐 픽셀을 빨갛게 칠한다. 같은 폴더에 이번 실행 결과 `<이름>.actual.png`도 남긴다.

## 기준 이미지에 대해

- 기준은 이 레포의 클라우드 세션 환경(Playwright 기본 Chromium, Linux)에서 만들었다. 같은 환경에서는 두 번 연속 실행해도 바이트까지 같았다.
- 다른 OS나 다른 Chromium 버전에서는 글자 안티에일리어싱이 달라서 기준과 어긋날 수 있다. 그럴 때는 기준을 바꾸지 말고, **먼저 main에서 `--update`로 그 환경의 기준을 만든 뒤(커밋하지 않음) 작업 브랜치에서 `--check`**를 돌린다.
- 기준 이미지는 91장(템플릿 24 + 사진 3 + 내 템플릿 12 + 공유 카드 52), 약 47MB다. 그림이 의도적으로 바뀌는 PR에서만 `--update`해서 커밋한다. 분리 PR("옮기기만")에서는 기준을 바꾸지 않는다.

## 아직 안 찍는 것

- 스티커 탭의 스티커(→ 아래 `tools/stkcmp.mjs`). 사진은 story 형식 3케이스만 찍는다. 공유 카드는 사진 없는 러닝 기록 하나로만 찍는다.

## 스티커는 `tools/stkcmp.mjs`로 비교한다

스냅샷에는 스티커가 없다. 그래서 스티커 코드를 건드리는 PR에서는 `node tools/stkcmp.mjs`로 비교한다.

- 하는 일: 결과 화면에서 minimal 템플릿을 고른 뒤 스티커 탭마다 스티커를 하나씩 넣는다. 그때마다 미리보기 캔버스와 저장 이미지의 해시를 한 줄씩 남긴다. 날짜, 입력, 외부 요청 차단은 snap.mjs와 같다.
- 기준 이미지가 없어서 다른 체크아웃과 비교한다. main과 비교하려면 이렇게 한다:

```bash
git worktree add /tmp/hoohaa-main origin/main
node tools/stkcmp.mjs --against /tmp/hoohaa-main
git worktree remove /tmp/hoohaa-main
```

- 한 줄이라도 다르거나, 페이지 에러가 나거나, 스티커 버튼이 사라지면 exit 1로 끝난다. 양쪽이 같은 곳에서 똑같이 깨졌는데 "같음"으로 통과하는 일을 막기 위해서다.
- 지금 스티커 탭에 없는 v3 캔버스 스티커(`wordmark`, `emblem` 등)는 그리지 않는다. 그것들은 스냅샷의 `mine-v3-*`가 찍는다.
