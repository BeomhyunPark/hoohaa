# editor.js 지도

`src/editor/editor.js`를 여러 모듈로 쪼개기 전에 만든 구역 지도다. 기준은 `015563f`(main, sw `hoohaa-shell-41`)이고, 그때 파일은 1,484줄, 226,014바이트다. 줄 번호는 이 커밋 기준이라 분리 PR이 머지될 때마다 어긋난다. 분리할 때는 함수 이름으로 찾는다.

## 먼저 알아둘 것

- 1~5줄의 import 다섯 줄을 빼면, 7줄 `export async function mountEditor(env) {`부터 1,484줄 `}`까지 전부 함수 하나다. 들여쓰기가 0칸이라 모듈 최상위처럼 보이지만 모두 클로저 안이다. 1,448줄부터만 2칸 들여쓰기가 있다.
- `mountEditor`는 페이지마다 한 번만 불린다. `src/app/boot.js`의 `ensureEditor()`가 `import('../editor/editor.js')`의 결과를 `editorP`에 담아 다시 쓰기 때문이다. 그래서 클로저 안의 캐시(`fcache`, `pcache`, `simg`, `chipImg`, `loaded`, `pv`, `LOGO_C`, `LOGO_TINT`)를 모듈 최상위로 옮겨도 동작은 같다.
- 렌더 쪽(15~628줄)은 이미 대부분 인자로 일한다. `layerGeom(c, L, d, doc, photos)`, `renderDoc(d, doc, photos, cv)`처럼 `doc`과 `photos`를 인자로 받는다. 편집기 UI 상태(`sel`, `mode`, `boxes` 등)는 쓰지 않는다. 예외는 아래 세 개의 모듈 전역 `let`과 `window.__photoSrc`(294줄) 하나다.
  - `H_`(87줄): 지금 형식의 캔버스 높이. `renderDoc`이 `setH_(fmtH(doc.fmt))`로 바꾸고, `ltPos`, `bgDraw`, `bgRect`, `renderDoc`이 읽는다.
  - `FX`(310줄): 지금 그리는 레이어의 글자 효과. `renderDoc`이 `g.draw()` 앞뒤로 넣었다 비운다. `drawTextBlock`, `fxText`가 읽는다.
  - `FONT_BASE`(69줄): 늦게 불러오는 글꼴 경로. `setFontBase`는 정의만 있고 부르는 곳이 없다.
- `d`는 계산 결과(`state.story`), `doc`은 편집 문서(배경 + 레이어 목록), `L`은 레이어 하나다.

## 구역별 정리

"클로저 상태"는 `mountEditor` 안에서 `let`으로 선언되어 값이 바뀌는 변수, 또는 `env`에서 받은 값이다. 값이 고정된 상수(`TK`, `FONTS` 등)는 "의존"에 적었다.

### 1. 머리와 토큰 (1~29줄)

| 항목 | 내용 |
|---|---|
| 대표 | import 5줄, `const { $, esc, state, EVN } = env`, `await import('./assets.js')`, `TK`(15줄, 9,161자 한 줄), `W`·`H`, `SYS_KO`, `PRE`, `ARC`, `SUB_PRE`·`SUB_BH`, `needFull`, `alpha`, `STORY_FX`, `STORY_MAT` |
| 클로저 상태 | 없음. `env`를 풀고 `assets`를 받는 곳 |
| 의존 | `assets.js`(`LAZY_FONTS`, `TPL_NAMES`, `TPL_SPEC`, `STK_NAMES`, `STK_SVG`) |
| DOM | 없음 |

`TK`는 디자인 토큰 JSON 리터럴이다. 티어 카드, 렌더, 결과 화면이 모두 읽는다.

### 2. 티어 카드 아트와 CSS 주입 (30~47줄, 91~206줄)

| 항목 | 내용 |
|---|---|
| 대표 | `TIER_COMMENTS`, `tierComment`, `glyphPts`, `glyphSVG`, `HEX_SVG`, `TOPO_D`, `topoSVG`, `svgURL`, `<style id="tier-tk">` 주입(43~47줄), `RC_METAL`, `RC_FLIP`, `RC_BAND`, `RC_MOTIF`, `runChipSVG`, `CARD_INK`, `EMB`, `chipImg`·`chipLoad`, `cardFontsReady`, `drawCard`, `lum`, `tierBg`, `ymd`, `tierTint`, `accentOf` |
| 클로저 상태 | `chipImg`(캐시) |
| 의존 | `TK`, `STORY_MAT`, `rr`, `font`, `alpha`, `PRE`, `W`·`H` |
| DOM | 43~47줄이 마운트할 때 `document.head`에 `<style>`을 넣는다. `chipLoad`는 `Image`, `cardFontsReady`는 `document.fonts` |

`drawCard`는 캔버스용 티어 카드다. `runChipSVG`는 DOM 카드(결과 화면)와 캔버스 카드가 같이 쓴다.

### 3. 캔버스 기본 유틸 (48~50줄)

| 항목 | 내용 |
|---|---|
| 대표 | `rr`, `font`, `fitText` |
| 클로저 상태 | 없음 |
| 의존 | 없음 |
| DOM | 없음. 캔버스 컨텍스트를 인자로 받는다 |

### 4. 글꼴 레지스트리 (52~84줄, 295~296줄)

| 항목 | 내용 |
|---|---|
| 대표 | `rng`, `FONTS`, `PICKABLE`, `FONT_CATS`, `loaded`, `FONT_BASE`, `setFontBase`, `loadFont`, `pv`, `loadPreviewFont`, `isFontReady`, `previewFam`, `nearW`, `famOf`, `wOf` |
| 클로저 상태 | `FONT_BASE`(`let`), `loaded`·`pv`(캐시) |
| 의존 | `assets.LAZY_FONTS`(64줄에서 `FONTS`에 합친다), `PRE`, `ARC`, `SYS_KO` |
| DOM | `loadFont`, `loadPreviewFont`가 `FontFace`, `document.fonts.add` |

`FONTS`는 리터럴 8개에 `LAZY_FONTS`를 합치고, 67줄에서 손글씨 글꼴의 `cat`을 바꿔서 완성된다. `nearW`와 `wOf`는 같은 계산을 한다(`wOf`는 `k`가 없을 때 `w`를 그대로 돌려준다).

### 5. 렌더 전역과 별칭 (87~90줄)

| 항목 | 내용 |
|---|---|
| 대표 | `H_`, `setH_`, `W_`, `ARC_`, `PRE_`, `SYS_KO_`, `{ rr, font, alpha };` |
| 클로저 상태 | `H_`(`let`) |
| 의존 | `W`, `H`, `ARC`, `PRE`, `SYS_KO` |
| DOM | 없음 |

`W_`, `ARC_`, `PRE_`는 `W`, `ARC`, `PRE`의 별칭일 뿐이다. 90줄 `{ rr, font, alpha };`는 아무 일도 하지 않는 블록 문이다. 예전에 모듈 경계였던 흔적으로 보인다.

### 6. 저장 도우미 (207~216줄)

| 항목 | 내용 |
|---|---|
| 대표 | `saveStory` |
| 클로저 상태 | 없음 |
| 의존 | 없음 |
| DOM | `matchMedia`, `navigator.share`, `<a download>` |

`$('save')` 버튼만 쓴다. `$('share')`(1256줄)는 비슷한 코드를 따로 갖고 있다.

### 7. 기록 블록 값, 형식, 레이어 생성 (218~242줄)

| 항목 | 내용 |
|---|---|
| 대표 | `STATS`, `statLabel`, `statValue`, `paceQ`, `pctOf`, `fillTok`, `STAT_SIZE0`·`STAT_SIZE`, `TOP_MIN_PX`, `STICKERS`, `FILTERS`, `FORMATS`, `fmtH`, `MASKS`, `LK`, `lseq`, `lid`, `mk` |
| 클로저 상태 | `lseq`(`let`, 레이어 id 카운터) |
| 의존 | `ymd` |
| DOM | 없음 |

`statValue`와 `fillTok`은 `ymd()`로 오늘 날짜를 넣는다. 결과가 실행하는 날에 따라 달라진다.

### 8. 사진 처리 (243~294줄, 532~536줄, 639~685줄)

| 항목 | 내용 |
|---|---|
| 대표 | `fcache`·`filtered`, `pcache`·`peKey`·`hasPE`, `orient`, `adjust`, `applyOutline`, `photoSrc`, `window.__photoSrc`, `imContent`, `bgRect`, `subjectLayer`, `blobToImg`, `addPhotoFile`, `SEG`·`segP`·`segBusy`·`getSeg`, `segErr`, `segRun`, `ensureMask`, `segFailMsg`, `personPid`, `canBehind`, `toggleBehind`, `restorePhotos` |
| 클로저 상태 | 243~294줄과 532~536줄은 캐시만 쓴다. `photos`는 인자로 받는다(`window.__photoSrc`만 클로저 `photos`를 읽는다). `bgRect`는 `H_`. 639~685줄은 `photos`, `doc`, `segP`, `segBusy`, `segErr`를 직접 읽고 쓴다 |
| 의존 | `idb`(`addPhotoFile`, `restorePhotos`), `status`, `changed`, `paintPanel`(`toggleBehind`) |
| DOM | 캔버스를 만든다(`document.createElement('canvas')`). `getSeg`는 `/seg/vision_bundle.mjs`를 동적 import, `toggleBehind`는 `#miniBar`를 직접 고친다 |

순서: 회전·뒤집기 → 자르기 → 필터 → 밝기·대비·채도·따뜻함 → 배경 지우기 마스크 → 외곽선. 마스크는 `photos['mask:' + pid]`에 같이 들어 있다.

### 9. 글자 그리기 (297~344줄)

| 항목 | 내용 |
|---|---|
| 대표 | `HAN`, `contrast`, `textBlock`, `FX`, `drawTextBlock`, `fxText`, `boxBehind`, `tokCol`, `ltPos`, `ltFam`, `logText` |
| 클로저 상태 | `FX`(`let`), `H_`(`ltPos`) |
| 의존 | `font`, `rr`, `lum`, `famOf`, `LOG_H`(logtpl.js), `W_`, `ARC_`, `PRE_` |
| DOM | 없음. 캔버스만 |

### 10. 레이어 배치 `layerGeom` (345~422줄)

| 항목 | 내용 |
|---|---|
| 대표 | `layerGeom(c, L, d, doc, photos)`: 레이어 종류(text, stat, card, photo, sticker, shape)마다 `{ w, h, draw }`를 돌려준다 |
| 클로저 상태 | 없음(간접적으로 `FX`, `H_`) |
| 의존 | 9번 전부, `specText`, `sticker`, `drawCard`, `photoSrc`, `imContent`, `metalTok`, `cssFill`, `boxPath`, `boxPat`, `statValue`, `statLabel`, `STATS`, `STAT_SIZE`, `STORY_MAT`, `accentOf`, `tierTint`, `wOf`, `famOf` |
| DOM | 없음 |

### 11. v4·v5 템플릿 글자와 박스 (423~463줄)

| 항목 | 내용 |
|---|---|
| 대표 | `LOGO_C`·`LOGO_TINT`·`logoCanvas`·`logoTint`, `LOGO_TXT`, `specText`, `boxPath`, `BARS`, `boxPat`, `metalTok`, `cssFill` |
| 클로저 상태 | `LOGO_C`(`let`, 캐시), `LOGO_TINT`(캐시) |
| 의존 | `FONTS`, `wOf`, `font`, `fxText`, `boxBehind`, `contrast`, `statValue`, `RC_METAL`, `rr` |
| DOM | `logoCanvas`, `logoTint`가 캔버스를 만든다 |

### 12. 스티커와 날씨 SVG (464~518줄)

| 항목 | 내용 |
|---|---|
| 대표 | `simg`·`stkLoad`·`imgOf`·`imgNow`, `INK`·`PAPER`·`CREAM`·`GLASS`·`RUNC`·`RACEC`·`GEARC`, `SV`, `glassBox`, `line`, `CLOUD`, `SUN`, `WICON`, `WEATHER`, `DATA_STK`, `COURSE`, `dataArt`, `dataFields`, `dtext`, `v4Sticker`, `sticker` |
| 클로저 상태 | `simg`(캐시) |
| 의존 | `STK_SVG`(assets), `iconSVG`·`TOKENS`(logtpl.js), `celsius`(logcalc.js), `FONTS`, `font`, `rr`, `ymd`, `STORY_MAT`, `accentOf`, `ARC_` |
| DOM | `imgOf`가 `Image`로 SVG를 래스터화한다 |

`SV`, `glassBox`, `line`, `CLOUD`, `SUN`, `dataArt`는 문자열만 만드는 순수 함수다. `sticker`의 v3 스티커(워드마크, 러너 등)는 캔버스 경로로 직접 그린다.

### 13. 배경과 렌더 (519~580줄)

| 항목 | 내용 |
|---|---|
| 대표 | `bgDraw`, `PRE_FONTS`, `isTopL`, `eff`, `renderDoc` |
| 클로저 상태 | `H_`(씀), `FX`(씀) |
| 의존 | 사진 처리(8번), `tierBg`, `loadFont`, `chipLoad`, `cardFontsReady`, `imgOf`, `stkLoad`, `dataArt`, `needFull`, `layerGeom`, `ltPos`, `MARGIN`, `COL_GAP`, `TOP_MIN_PX`, `fmtH`, `LOG_H` |
| DOM | `document.fonts.ready`, `document.fonts.load`, 캔버스 생성 |

`renderDoc`은 미리보기, 템플릿 썸네일, 스티커 미리보기(`renderMini`), 최종 저장이 모두 같이 쓴다. 결과 캔버스에 `cv.__boxes`(레이어 위치)와 `cv.__subject`를 붙여 돌려준다.

### 14. 템플릿 (581~628줄)

| 항목 | 내용 |
|---|---|
| 대표 | `TEMPLATES`, `TPL_ALIAS`, `tplKey`, `templateDoc`, `MARGIN`, `COL_GAP`, `FMT_K`, `typeScale`, `normLayout` |
| 클로저 상태 | 없음 |
| 의존 | `TPL_SPEC`·`TPL_NAMES`(assets), `mk`, `fmtH` |
| DOM | 없음 |

`templateDoc`과 `normLayout`은 DOM도 캔버스도 쓰지 않는다. node 테스트를 붙이기 가장 쉬운 곳이다(단 `assets.js`가 필요하다).

### 15. 편집기 상태와 테스트 훅 (629~638줄)

| 항목 | 내용 |
|---|---|
| 대표 | `clone`, `MAX_PHOTOS`, `PCV`, `bgImg`, `FH`, `safeOn`, `cropSt`, `moreFx`, `moreAdj`, `multi`, `multiSnap`, `fineP`, `doc`, `photos`, `sel`, `boxes`, `mode`, `libOpen`, `fontCat`, `pickMode`, `guides`, `trashHot`, `dragging`, `favs`, `recents`, `window.__doc` 등 |
| 클로저 상태 | 여기서 선언한다 |
| 의존 | `LS` |
| DOM | `matchMedia`, `window.__*` |

### 16. 실행취소와 자동 저장 (686~716줄)

| 항목 | 내용 |
|---|---|
| 대표 | `hist`, `hi`, `comT`, `commit`, `later`, `undoRedo`, `docKey`, `paintTop`, `getL`, `pinXY`, `freezeRow`, `pinS`, `WM_G`, `WM_SVG`, `isTop` |
| 클로저 상태 | `hist`, `hi`, `comT`, `doc`, `sel`, `boxes` |
| 의존 | `LS`, `$` |
| DOM | `#undo`, `#redo`, `#tplList` |

### 17. 미리보기 루프, 형식 바꾸기, 템플릿 목록 (717~791줄)

| 항목 | 내용 |
|---|---|
| 대표 | `rafQ`, `lastCv`, `syncTier`, `MSYNC`, `syncMulti`, `changed`, `needClamp`, `clampN`, `fitStage`, `CARRY`, `relayout`, `specRelayout`, `propRelayout`, `clampIn`, `placePhoto`, `newDoc`, `refreshTpl`, `thumbs`, `userLayers`, `#tplList`·`#tplReset`·`#saveMyTpl`·`#fmtSeg`·`#safeBtn` 리스너 |
| 클로저 상태 | `doc`, `photos`, `sel`, `boxes`, `mode`, `multi`, `multiSnap`, `rafQ`, `needClamp`, `clampN`, `hist`, `hi`, `safeOn`, `state.story` |
| 의존 | `renderDoc`, `templateDoc`, `tplKey`, `fmtH`, `accentOf`, `ensureMask`, `LS` |
| DOM | 많음 |

`changed()`가 미리보기를 다시 그리는 유일한 입구다. `requestAnimationFrame`으로 한 프레임에 한 번만 `renderDoc`을 부른다.

### 18. 오버레이와 제스처 (792~914줄)

| 항목 | 내용 |
|---|---|
| 대표 | `corners`, `HANDLE`, `paintOvl`, `placeMini`, `tapButtons`, `toLocal`, `hitAt`, `onHandle`, 제스처 블록(836~892줄), `snapR`, `showMenu`, `hideMenu`, `BG_PHOTO_KEYS`, `parkBgPhoto`, `dropBgKeep`, `photoToBg`, `bgToLayer`, `delLayer`, `act` |
| 클로저 상태 | `sel`, `boxes`, `multi`, `guides`, `dragging`, `trashHot`, `pickMode`, `safeOn`, `fineP`, `doc`, `photos` |
| 의존 | `pinXY`, `pinS`, `freezeRow`, `changed`, `paintPanel`, `status`, `toggleBehind` |
| DOM | 많음 |

`corners`, `toLocal`, `snapR`는 순수 함수다.

### 19. 도구, 사진 넣기, 상태 문구 (915~930줄)

| 항목 | 내용 |
|---|---|
| 대표 | `addLayer`, `#tools` 리스너, `photoTarget`, `pickPhoto`, `#photo` 리스너, `stT`, `status` |
| 클로저 상태 | `doc`, `sel`, `mode`, `multi`, `libOpen`, `photoTarget` |
| 의존 | `mk`, `addPhotoFile`, `ensureMask` |
| DOM | 많음 |

### 20. 색 고르기 (931~956줄)

| 항목 | 내용 |
|---|---|
| 대표 | `hex2hsv`, `hsv2hex`, `hsv`, `hsvCol`, `adoptHex`, `hasBg`, `colTarget`, `setCol`, `paintPicker`, `dragArea`, `QC`, `ICO_DROP`, `chipsHTML` |
| 클로저 상태 | `hsv`, `hsvCol`, `mode`, `colMode`, `doc`, `sel`, `state.story` |
| 의존 | `accentOf`, `parkBgPhoto` |
| DOM | `#cpick`, `#cpSV`, `#cpHue`, `#cpHex` |

`hex2hsv`, `hsv2hex`는 순수 함수다.

### 21. 패널 UI (957~1245줄)

| 항목 | 내용 |
|---|---|
| 대표 | 글꼴 UI(`fontBtn`, `fontRow`, `libHTML`, `pickFont`, 글꼴 시트), HTML 조각(`NAMES`, `lname`, `seg`, `segT`, `range`, `colRow`, `fchips`, `photoEdHTML`, `cropHTML`, `fxHTML`), 바인딩(`bindCrop`, `bindPhotoEd`, `bindFx`), 스티커 탭(`WX`, `INSTK`, `STK_TABS`, `STK_CAT`, `stkBtn`), 바텀시트와 확대(`focusZoom`, `sheetOn`, `fitSheet`, `sheet`, `closeSheet`), 입력 모드 블록(1092줄), 아이콘 교체 블록(1103줄), `paintPanel`, `renderMini`, `paintSelInfo`, 날씨 자동 채우기(`wxHTML`, `bindWx`), `bindPanel` |
| 클로저 상태 | 거의 전부. 이 구역에서 추가로 `moreCol`, `moreTxt`, `colMode`, `stkCat`, `wxDate`, `wxHour`, `wxPlaces`, `wxMsg`, `wxBusy` |
| 의존 | `esc`, `FONTS`, `loadFont`, `loadPreviewFont`, `renderDoc`, `orient`, `fetchWeather`·`searchPlace`·`wxHere`(weather.js), `paceGuide` 등 |
| DOM | 전부 |

### 22. 저장과 공유 (1246~1265줄)

| 항목 | 내용 |
|---|---|
| 대표 | `pxSig`, `window.__exportSig`, `window.__previewSig`, `finalCanvas`, `#save`·`#share` 리스너, `status(''); paintTop();` |
| 클로저 상태 | `doc`, `photos`, `state.story` |
| 의존 | `commit`, `renderDoc`, `saveStory` |
| DOM | 있음 |

`finalCanvas`가 `mountEditor`의 반환값 `exportCanvas`다.

### 23. 결과 화면 (1266~1447줄)

| 항목 | 내용 |
|---|---|
| 대표 | `KEY`, `LONG`, `ICON`, `hex`, `mix`, `rgba`, `tierStyle`, `short`, `PACE_ROWS`, `weeklyKm`, `METHOD`, `resToast`, `h2iP`·`loadH2I`, `resImg`·`resImgP`, `resCaptureNode`, `buildResultImage`, `prepResultImage`, `downloadBlob`, `shareResult`, `ABBR`, `clock`, `resIO`·`resOffIO`, `bindResultUi`, `renderResult` |
| 클로저 상태 | `weeklyKm`, `h2iP`, `resImg`, `resImgP`, `resIO`, `resOffIO`, `state`. `renderResult`는 오늘 기록 모드에서 나올 때 `doc`, `sel`, `logCtx`를 비운다 |
| 의존 | `TK`, `runChipSVG`, `tierComment`, `accentOf`, `paceGuide`·`parseWeekly`(workout.js), `refreshTpl`, `esc`, `EVN` |
| DOM | 전부. `html-to-image`를 `<script>` 태그로 늦게 불러온다 |

공유 이미지 편집기가 아니라 결과 페이지(`#resBody`)를 그리는 코드다. debt.md의 B4~B7 계획에는 없다.

### 24. 오늘 기록 진입 (1448~1484줄)

| 항목 | 내용 |
|---|---|
| 대표 | `logCtx`, `LOG_STORY`, `logPhoto`, `openLog`, `applyLogVals`, `setAccent`, `setLogBackground`, `logThumbs`, `pickLogTpl`, `window.__logDoc`, `return { renderResult, openLog, applyLogVals, setAccent, setLogBackground, exportCanvas: finalCanvas }` |
| 클로저 상태 | `logCtx`, `doc`, `photos`, `sel`, `mode`, `hist`, `hi`, `needClamp`, `state.story` |
| 의존 | `buildLogDoc`·`fillBindings`·`setLogBg`·`LOG_TPLS`·`kindOf`(logtpl.js), `renderDoc`, `relayout`, `userLayers`, `changed`, `paintPanel`, `thumbs` |
| DOM | `#resBody`, `#tplList`, `#lbBg`, `body.log-mode` |

## 클로저 상태 없이 바로 뺄 수 있는 것

"순수"는 클로저의 `let` 변수, `env`, `doc`·`photos`·`sel` 같은 편집기 상태를 쓰지 않는다는 뜻이다. 오른쪽 칸의 조건만 맞추면 위치만 옮길 수 있다.

### 바로 옮길 수 있음 (DOM 없음, node 테스트 가능)

| 이름 | 줄 | 조건 |
|---|---|---|
| `alpha` | 26 | 없음 |
| `lum`, `contrast`, `HAN` | 195, 298, 297 | 없음 |
| `rng`, `needFull`, `SUB_PRE`, `SUB_BH` | 53, 22~23 | 없음 |
| `ymd` | 204 | 기본값이 `new Date()`. 테스트에는 날짜를 넘긴다 |
| `paceQ`, `pctOf` | 224~225 | 없음 |
| `STATS`, `statLabel`, `statValue`, `fillTok` | 220~229 | `ymd`와 같이 옮긴다 |
| `STAT_SIZE0`, `STAT_SIZE`, `TOP_MIN_PX` | 230~232 | 없음 |
| `FILTERS`, `FORMATS`, `fmtH`, `MASKS`, `STICKERS` | 233~238 | 없음 |
| `FMT_K`, `typeScale`, `MARGIN`, `COL_GAP` | 610~612 | 없음 |
| `clone` | 630 | 없음 |
| `corners`, `toLocal`, `snapR` | 793, 828, 893 | 없음 |
| `hex2hsv`, `hsv2hex` | 932~935 | 없음 |
| `hex`, `mix`, `rgba`, `short`, `clock` | 1270~1272, 1284, 1333 | 결과 화면 쪽. 이름이 짧아서 다른 구역과 겹치지 않는지 본다 |
| `tokCol` | 327 | 없음 |
| `metalTok` | 456 | `RC_METAL`과 같이 옮긴다 |
| `TK`, `STORY_FX`, `STORY_MAT`, `TIER_COMMENTS`, `tierComment`, `CARD_INK`, `EMB`, `accentOf`, `tierTint` | 15~32, 145~146, 205~206 | 데이터다. `TK`를 먼저 옮기면 나머지는 그 뒤에 옮길 수 있다 |
| `RC_METAL`, `RC_FLIP`, `RC_BAND`, `RC_MOTIF`, `runChipSVG` | 91~142 | 문자열만 만든다 |
| `svgURL`, `topoSVG`, `HEX_SVG`, `TOPO_D` | 38~42 | 문자열만 만든다 |
| `INK` 등 팔레트, `SV`, `glassBox`, `line`, `CLOUD`, `SUN`, `WICON`, `WEATHER`, `DATA_STK`, `COURSE`, `dataArt`, `dataFields` | 470~488 | 문자열만 만든다 |
| `TEMPLATES`, `TPL_ALIAS`, `tplKey`, `templateDoc`, `normLayout` | 582~628 | `assets.js`의 `TPL_SPEC`, `TPL_NAMES`와 `mk`가 필요하다 |

### 캔버스 컨텍스트만 받는 것 (가짜 컨텍스트나 브라우저로 테스트)

`rr`, `font`, `fitText`, `boxPath`, `BARS`, `boxPat`, `cssFill`, `textBlock`, `boxBehind`, `dtext`, `tierBg`, `drawCard`. `tierBg`는 상수 `W`, `H`(1920)를 쓰고 `H_`를 쓰지 않는다.

### 모듈 수준 상태로 같이 옮겨야 하는 것

| 묶음 | 함께 가는 상태 |
|---|---|
| `FONTS`, `PICKABLE`, `FONT_CATS`, `nearW`, `famOf`, `wOf`, `isFontReady`, `previewFam`, `loadFont`, `loadPreviewFont` | `LAZY_FONTS`(assets), `loaded`, `pv`, `FONT_BASE`, `setFontBase`. `FONTS`는 `LAZY_FONTS`가 있어야 완성된다 |
| `lid`, `mk`, `LK` | `lseq` 카운터. 모듈로 옮겨도 페이지마다 하나라 같다 |
| `filtered`, `orient`, `adjust`, `applyOutline`, `peKey`, `hasPE`, `photoSrc`, `imContent` | `fcache`, `pcache` |
| `chipLoad`, `cardFontsReady` | `chipImg` |
| `stkLoad`, `imgOf`, `imgNow` | `simg`, `STK_SVG` |
| `logoCanvas`, `logoTint` | `LOGO_C`, `LOGO_TINT` |

### 안 쓰는 코드 (분리할 때 지우지 말고 따로 정리)

- `glyphSVG`, `glyphPts`(33~36줄): 부르는 곳이 없다.
- `fitText`(50줄): 부르는 곳이 없다.
- `setFontBase`(70줄): 부르는 곳이 없다.
- `SYS_KO_`(89줄), `PCV`(631줄), `ICON`(1269줄): 읽는 곳이 없다.
- 90줄 `{ rr, font, alpha };`: 아무 일도 하지 않는 블록 문.
- `drawCard`의 `cd.band === 'mid' && false` 분기(161~163줄): 항상 건너뛴다.

분리 PR은 "옮기기만" 하기로 했으므로, 이것들은 그대로 옮기거나 별도 PR에서 지운다.

## 분리 순서 제안

기본 순서(B4 순수 유틸 → B5 스티커/SVG → B6 사진 처리 → B7 렌더)를 유지한다. 근거와 조정할 점은 아래와 같다.

1. **B4: `util.js` + `tokens.js`**
   - `tokens.js`: `TK`, `STORY_FX`, `STORY_MAT`, `TIER_COMMENTS`, `tierComment`, `CARD_INK`, `EMB`, `accentOf`, `tierTint`, `RC_*`, `runChipSVG`, `svgURL`, `topoSVG`, `HEX_SVG`, `TOPO_D`, `metalTok`. 디자인 데이터와 그것만 읽는 함수다. `TK` 한 줄이 9KB라 util과 섞으면 리뷰가 어렵다.
   - `util.js`: 위 "바로 옮길 수 있음" 표의 나머지(`alpha`, `lum`, `contrast`, `rr`, `font`, `fitText`, `ymd`, `STATS`, `statLabel`, `statValue`, `fillTok`, `FILTERS`, `FORMATS`, `fmtH`, `MASKS`, `clone`, `hex2hsv`, `hsv2hex` 등)와 글꼴 레지스트리.
   - 글꼴 레지스트리는 `LAZY_FONTS`가 있어야 완성된다. `util.js`가 `./assets.js`를 정적으로 import해도 된다. editor.js 자체가 결과 화면을 열 때만 불리기 때문에, 지금의 `await import('./assets.js')`와 받는 시점이 사실상 같다. 다만 assets.js는 약 160KB이니, 홈이나 계산기 페이지가 util.js를 import하지 않게 한다.
   - `templateDoc`, `normLayout`은 B7(렌더)에서 옮긴다. `mk`, `fmtH`만 B4에서 옮기면 B7이 쉬워진다.
2. **B5: `stickers.js`**. 12번 구역 전체. `STK_SVG`는 assets.js에서 바로 import하고, `iconSVG`·`TOKENS`는 logtpl.js에서 import한다. `simg` 캐시는 stickers.js 안에 둔다(`imgOf`만 쓰는 캐시이고, 페이지마다 하나라 클로저와 같다). `sticker`(v3)는 `STORY_MAT`, `accentOf`를 tokens.js에서 가져온다.
3. **B6: `photo.js`**. 8번 구역. 243~294줄과 532~536줄은 `photos`를 이미 인자로 받아 거의 그대로 옮겨진다. `bgRect`는 `H_`를 읽으므로 높이를 인자로 받게 하거나 B7까지 editor.js에 남긴다. 639~685줄(`addPhotoFile`, `ensureMask`, `toggleBehind`)은 `photos`, `doc`, `status`, `changed`를 직접 쓰므로 `photos`만 인자로 받고, UI를 건드리는 `toggleBehind`, `restorePhotos`는 editor.js에 남기는 게 안전하다.
4. **B7: `render.js`**. 9·10·11·13·14번 구역. `H_`와 `FX`를 렌더 컨텍스트로 묶는다. `drawCard`, `tierBg`도 여기로 간다.
5. **B7 다음 후보: `result.js`**. 23번 구역(결과 화면, 약 180줄)은 편집기와 거의 독립이다(`refreshTpl`을 부르고 `doc`, `sel`, `logCtx`를 비우는 정도). debt.md에는 없지만, B7을 마친 뒤 editor.js를 더 줄인다면 이 구역이 가장 쉽다.

이 순서의 근거: 앞 단계일수록 클로저 상태를 덜 쓰고, 뒤 단계가 앞 단계의 모듈을 import한다(render → stickers, photo → util·tokens). 거꾸로 하면 렌더를 옮길 때 아직 editor.js에 있는 함수를 인자로 넘겨야 한다.

## 위험 요소

- **`window.__logDoc`와 다른 `window.__*` 훅**: `__doc`, `__boxes`, `__sel`, `__inkBounds`, `__story`, `__acc`, `__photos`, `__photoMap`, `__mask`, `__statTexts`, `__multi`, `__fmt`, `__hitAt`, `__photoToBg`, `__bgToLayer`, `__exportSig`, `__previewSig`, `__lastStory`, `__segMs`, `__resultImage`, `__photoSrc`, `__logDoc`. 레포 안의 다른 파일은 이것들을 쓰지 않지만, 세션에서 Playwright로 편집기를 확인할 때 쓰고 B3 스냅샷 테스트도 쓰게 된다. 분리할 때 이름과 반환값을 그대로 둔다. `window.__photoSrc`(294줄)는 클로저 `photos`를 읽으므로 사진 처리를 옮길 때도 editor.js에 남긴다.
- **늦게 불러오는 `assets.js`**: 지금은 `mountEditor` 안에서 `await import('./assets.js')`로 받는다. 새 모듈이 assets.js를 정적으로 import하면 editor.js를 받을 때 같이 받는다. 결과 화면을 열 때만 불린다는 점은 같지만, 홈·계산기 페이지에서 새 모듈을 import하면 160KB를 미리 받게 된다.
- **sw.js `ON_USE` 갱신**: 새 파일은 `ON_USE`에 넣고 `CACHE` 번호를 올린다. `node tools/check-sw.mjs`가 import로 연결된 모듈만 검사한다. `<script>` 태그로 붙이는 `html-to-image.js`나 문자열을 이어 만든 경로(`SEG + 'vision_bundle.mjs'`, `FONT_BASE + file`)는 잡지 못한다. 캐시 번호는 머지 직전에 main의 번호를 다시 보고 올린다.
- **글꼴 로드 순서**: 내장 글꼴(`TC Archivo`, `TC Pretendard`, `OV *`, `CC Kode`)은 `src/styles/card.css`의 `@font-face`에 있다. boot.js가 `enableCardCss()`와 `ensureEditor()`를 같이 기다린 뒤 `renderResult`를 부른다. `renderDoc`은 그리기 전에 `document.fonts.ready`, `PRE_FONTS`, 레이어가 쓰는 `loadFont`, 카드가 있으면 `cardFontsReady`, 한글이 서브셋 밖이면 `pretendardk`를 기다린다. 이 대기 순서를 바꾸면 첫 렌더가 대체 글꼴로 그려질 수 있다. 렌더를 옮길 때 `await` 순서를 그대로 둔다.
- **`H_`와 `FX`의 타이밍**: 둘 다 `renderDoc` 안의 동기 구간(모든 `await`가 끝난 뒤)에서만 바뀌고 읽힌다. 미리보기, 썸네일, `renderMini`가 동시에 `renderDoc`을 불러도 지금은 안전하다. 렌더 컨텍스트로 바꿀 때 `await` 뒤에서 값을 읽는 코드가 생기지 않게 한다. 템플릿을 바꾸면 미리보기와 썸네일 렌더가 겹친다.
- **마운트할 때 생기는 부수 효과**: 43~47줄의 `<style id="tier-tk">` 주입, 693줄 등의 `addEventListener`, 758줄의 `localStorage.removeItem('runtier:mystyle')`, 1102~1112줄의 아이콘 교체, 1265줄 `status(''); paintTop();`. 모듈 최상위로 옮기면 import만 해도 실행된다. 이런 코드는 `mountEditor` 안이나 `init()` 함수에 둔다.
- **이름 충돌**: 클로저 안에서 같은 이름을 지역 변수로 다시 쓰는 곳이 있다. 예: `templateDoc`과 `specText`가 지역 `W`, `H`를 선언하고, 여러 함수가 `rr`, `font`를 쓰면서 `const rg`, `const g` 같은 짧은 이름을 쓴다. 옮길 때 import 이름이 지역 변수에 가려지지 않는지 본다.
- **결과가 날짜에 따라 다름**: `ymd()`가 기록 블록의 날짜와 날짜 스티커에 들어간다. 스냅샷 비교 테스트는 `Date`를 고정해야 한다.
