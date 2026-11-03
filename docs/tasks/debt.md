# B. 기술 부채 정리

프롬프트 하나 = 세션 하나 = PR 하나. **B1~B7은 차례대로 한다.** 앞 PR이 머지된 뒤 다음 프롬프트를 보낸다.

배경: `src/editor/editor.js`는 1,350줄, 약 200KB이고, 전부 `export async function mountEditor(env) { ... }` 하나 안에 들어 있다. 한 줄이 9,000자가 넘는 곳도 있다. 상태(`doc`, `photos`, `sel`, `H_`, `FX` 등)가 클로저 변수라서 함수를 밖으로 빼려면 그 상태를 인자로 넘겨야 한다. 테스트는 `node src/**/*.test.mjs`로 하나씩 돌리고, CI는 없다.

---

## B1. 테스트 실행 한 번에 하기 + CI

```
hoohaa(레포 BeomhyunPark/hoohaa)는 빌드 없는 정적 웹앱이야. package.json이 없고, 테스트는 src/ 아래 *.test.mjs 4개를 node로 하나씩 돌려. 어떤 건 node:test를 쓰고, 어떤 건 "ok"만 출력해.

할 일:
1. 루트에 tools/test.sh(또는 tools/test.mjs)를 만들어. *.test.mjs를 모두 찾아 돌리고, 하나라도 실패하면 exit 1로 끝나게 해.
   - "ok"만 출력하는 테스트는 실패할 때 throw하는지 확인하고, 아니면 assert를 쓰게 고쳐.
2. tools/check-sw.mjs를 만들어서 아래를 검사해:
   - sw.js의 SHELL과 ON_USE 목록에 있는 파일이 실제로 있는지
   - src/editor/editor.js와 src/app/*.js가 import하는 로컬 모듈이 모두 ON_USE나 SHELL에 있는지
   (나중에 editor.js를 쪼개면 새 파일이 캐시 목록에서 빠지기 쉬워서 필요해)
3. .github/workflows/test.yml을 만들어. push와 PR 때 Node 22로 위 두 스크립트를 돌리게 해.
4. README의 "로컬에서 실행하기" 아래에 테스트 실행 방법을 두 줄로 추가해.

하지 말 것: npm 의존성, 번들러, 린터 도입.
완료 조건: 로컬에서 두 스크립트가 통과해. 일부러 실패하게 만들었을 때 exit 1이 나는 것도 확인해. trail check를 돌려.
```

---

## B2. editor.js 지도 그리기(분석만, 코드 변경 없음)

```
hoohaa(레포 BeomhyunPark/hoohaa)의 src/editor/editor.js는 약 200KB이고, mountEditor(env) 클로저 하나 안에 전부 들어 있어. 이걸 여러 모듈로 쪼개기 전에 지도를 만들어 줘. 이번 PR에서는 코드를 고치지 마.

할 일: docs/editor-map.md를 써 줘.
1. 줄 범위별로 구역을 나눠. 예: 상수와 토큰, 글꼴, 티어 카드 그리기, 스티커와 날씨 SVG, 사진 처리(필터, 방향, 보정, 외곽선, MediaPipe 분리), 레이어 배치(layerGeom), 렌더(renderDoc), 템플릿(templateDoc, normLayout), 패널 UI와 이벤트, 실행취소, 저장과 공유.
2. 구역마다 이렇게 표로 정리해:
   - 대표 함수
   - 읽거나 쓰는 클로저 상태(doc, photos, sel, H_, FX, TK, assets 등)
   - 다른 구역에 대한 의존
   - DOM을 쓰는지
3. "클로저 상태 없이 바로 뺄 수 있는 순수 함수" 목록을 만들어.
4. 분리 순서를 제안해. 기본 순서는 B4 순수 유틸 → B5 스티커/SVG → B6 사진 처리 → B7 렌더야. 근거가 있으면 바꿔도 돼.
5. 위험 요소도 적어: 전역 window.__logDoc, 지연 로드되는 assets.js, sw.js ON_USE 갱신, 글꼴 로드 순서.

완료 조건: 문서만 바뀌어 있어야 해. trail check를 돌리고, 알게 된 결정은 trail note로 남겨.
```

---

## B3. 렌더 회귀 스냅샷 테스트

```
hoohaa(레포 BeomhyunPark/hoohaa)의 공유 이미지 편집기(src/editor/editor.js)를 곧 여러 모듈로 쪼갤 거야. 쪼갠 뒤에도 그림이 그대로인지 확인하는 장치가 먼저 필요해.

할 일:
1. tools/snap.mjs를 만들어. 로컬 서버를 띄우고, Playwright(설치돼 있음, playwright install 하지 마)로 결과 화면과 편집기를 연 뒤, 템플릿 × 이미지 형식 조합마다 최종 PNG를 뽑아.
   - 고정 입력: 10K 50:00, 30대 남성
   - 날짜는 Date를 고정해. 날씨 같은 네트워크 요청은 막아.
   - 편집기의 exportCanvas를 쓰면 돼(mountEditor가 반환하는 객체 안에 있어).
2. 기준 이미지를 tools/snap/baseline/에 커밋해. 비교 모드(--check)에서는 픽셀 차이가 기준보다 크면 실패하고 diff 이미지를 남기게 해.
3. 두 번 연속 돌려서 같은 결과가 나오는지(흔들리지 않는지) 확인해. 글꼴 로딩 때문에 흔들리면 document.fonts.ready를 기다리게 해.
4. 실행 방법을 tools/snap/README.md에 적어. CI에는 넣지 않아(무거워서). editor.js를 쪼개는 PR에서는 반드시 돌린다고 적어 둬.

완료 조건: --check가 지금 main에서 통과해. editor.js는 고치지 마. trail check를 돌려.
```

---

## B4. editor.js 분리 1단계: 순수 유틸 빼기

```
hoohaa(레포 BeomhyunPark/hoohaa)의 src/editor/editor.js를 쪼개는 중이야. docs/editor-map.md(구역 지도)와 tools/snap/(렌더 스냅샷 테스트)를 먼저 읽어.

할 일: 클로저 상태를 쓰지 않는 순수 함수와 상수를 src/editor/util.js(이름은 지도 문서 제안을 따라)로 옮겨 줘.
- 대상 예시: alpha, lum, font, fitText, rr, ymd, statLabel/statValue/fillTok, STATS, FILTERS, FORMATS, MASKS, 글꼴 표(FONTS)와 nearW/wOf/famOf.
1. 동작을 바꾸지 마. 함수 이름과 시그니처를 그대로 두고, 위치만 옮겨.
2. DOM이 필요 없는 함수는 src/editor/util.test.mjs에 node 테스트를 붙여.
3. 새 파일을 sw.js ON_USE에 추가하고 CACHE 번호를 올려. tools/check-sw.mjs로 확인해.
4. tools/snap.mjs --check, 전체 테스트, trail check가 모두 통과해야 해.
5. editor.js에서 줄어든 크기와 옮긴 목록을 PR 본문에 적어.

하지 말 것: 포매팅만 바꾸는 대량 변경, 이름 변경, 로직 수정. 리뷰가 "옮긴 것"만 보이게 해.
```

---

## B5. editor.js 분리 2단계: 스티커와 SVG 아트 빼기

```
hoohaa(레포 BeomhyunPark/hoohaa)의 src/editor/editor.js를 쪼개는 중이야. docs/editor-map.md와 tools/snap/을 먼저 읽고, 지난 단계(util.js 분리)에서 한 방식을 따라.

할 일: 스티커와 날씨 SVG 생성 코드를 src/editor/stickers.js로 옮겨 줘.
- 대상 예시: INK/LIME 같은 팔레트, SV, cloud, sun, drop, flake, WICON, WBG, WEATHER, DATA_STK, COURSE, dataArt, runChipSVG, glyphSVG, HEX_SVG, TOPO_D.
1. 클로저 값(TK, STK_SVG 등)이 필요하면 인자나 init 함수로 넘겨.
2. 이미지 캐시(simg, chipImg)를 어디에 둘지 정하고, 그 이유를 PR 본문에 적어.
3. SVG 문자열 생성 함수는 node 테스트로 "올바른 svg 시작과 끝, NaN 없음"을 확인해.
4. sw.js ON_USE에 추가하고 CACHE 번호를 올려. check-sw, snap --check, 전체 테스트, trail check가 모두 통과해야 해.

하지 말 것: 그림 모양 변경, 로직 수정.
```

---

## B6. editor.js 분리 3단계: 사진 처리 빼기

```
hoohaa(레포 BeomhyunPark/hoohaa)의 src/editor/editor.js를 쪼개는 중이야. docs/editor-map.md, tools/snap/, 지난 분리 PR들을 먼저 봐.

할 일: 사진 처리를 src/editor/photo.js로 옮겨 줘.
- 대상: filtered, orient, adjust, applyOutline, photoSrc, imContent, bgRect, subjectLayer, addPhotoFile(1600px 축소), MediaPipe 인물 분리(SEG 경로, segP, segBusy).
1. photos 같은 공유 상태는 인자로 받게 바꿔. 이번 단계에서는 "상태를 넘기는 방식"만 바꾸고 동작은 바꾸지 마.
2. MediaPipe는 지금처럼 '인물 뒤로'를 처음 쓸 때만 로드되는지 네트워크 로그로 확인해.
3. 사진이 들어간 스냅샷 케이스(테스트용 사진 하나를 tools/snap/fixtures/에 추가)를 snap에 넣고, 분리 전후가 같은지 확인해.
4. sw.js ON_USE와 CACHE를 갱신해. check-sw, snap --check, 전체 테스트, trail check가 모두 통과해야 해.
```

---

## B7. editor.js 분리 4단계: 렌더 파이프라인 빼기

```
hoohaa(레포 BeomhyunPark/hoohaa)의 src/editor/editor.js를 쪼개는 중이야. docs/editor-map.md, tools/snap/, 지난 분리 PR들(util, stickers, photo)을 먼저 봐.

할 일: 캔버스 렌더링을 src/editor/render.js로 옮겨 줘.
- 대상: drawCard, tierBg, textBlock, drawTextBlock, fxText, boxBehind, logText, specText, layerGeom, sticker, v4Sticker, bgDraw, eff, renderDoc, templateDoc, normLayout.
1. 모듈 전역으로 바꿔 쓰는 상태(H_, FX, FONT_BASE)를 render 컨텍스트 객체로 묶어서 넘겨.
   - 숨은 전역이 남지 않게 해.
   - 전역을 없애면서 동작이 달라질 수 있는 곳은 PR 본문에 하나하나 적어.
2. 이 단계를 마치면 editor.js에는 패널 UI, 이벤트, 상태, 실행취소만 남아야 해. 남은 줄 수를 PR에 적어.
3. 스냅샷의 모든 템플릿 × 이미지 형식 조합이 같아야 해. 필요하면 diff 이미지를 PR에 붙여.
4. sw.js ON_USE와 CACHE를 갱신해. check-sw, snap --check, 전체 테스트, trail check가 모두 통과해야 해.
5. 패널 UI 분리를 더 할 가치가 있는지 판단해서 PR 본문에 제안만 남겨.
```

---

## B8. 계산기 페이지 로직을 엔진으로 모으고 테스트 붙이기

```
hoohaa(레포 BeomhyunPark/hoohaa)의 계산기 페이지(/pace/, /pace-calculator/, /predictor/, /splits/, /vdot/, /vo2max/, /bmr/)는 각 index.html에 인라인 스크립트가 있어. 기록 읽기(read, readP 같은 함수)가 페이지마다 따로 있고, /bmr/의 BMR·TDEE 계산은 테스트가 없어. 엔진은 src/engine/tier.js이고 테스트는 tier.test.mjs야.

할 일:
1. 페이지마다 겹치는 "기록·페이스 문자열 → 초" 파싱 함수를 비교해. 차이점을 표로 만들어 PR 본문에 넣어.
2. 하나로 합친 함수를 src/engine/parse.js에 두고, parse.test.mjs에 형식별 테스트를 붙여.
   - 형식: mm:ss, h:mm:ss, 콜론 없음, 공백, 전각 콜론, 음수, 빈칸.
   - 페이지들이 이 함수를 import하게 바꿔.
3. /bmr/의 BMR, TDEE, 활동량 계수를 src/engine/bmr.js로 옮기고 bmr.test.mjs를 붙여. 공식 이름과 출처를 주석에 적어.
4. 각 페이지에 같은 입력을 넣고, 바꾸기 전과 결과가 똑같은지 Playwright로 확인해.
   - 일부러 동작을 바꾼 곳이 있으면 PR 본문에 적어.
5. 새 엔진 파일을 홈이나 앱이 쓴다면 sw.js 목록과 CACHE를 갱신해.

규칙: 빌드 도구는 쓰지 마. 전체 테스트와 trail check를 돌려.
```
