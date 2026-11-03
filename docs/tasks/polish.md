# A. 기존 기능 다듬기

프롬프트 하나 = 세션 하나 = PR 하나. `---` 사이를 통째로 복사해서 붙여 넣는다.

---

## A1. 홈 → 입력 → 결과 흐름 QA와 버그 수정

```
hoohaa(https://hoohaa.run, 레포 BeomhyunPark/hoohaa)는 러닝 기록으로 티어를 알려 주는 정적 웹앱이야. 빌드 없이 ES 모듈 그대로 GitHub Pages에 올라가. 계산은 src/engine/, 입력 화면은 src/app/boot.js, 홈은 /index.html, 결과는 /result/야.

할 일: 홈 → 종목 선택 → 기록 입력 → 결과 화면까지 실제로 띄워서 버그와 어색한 UX를 찾아 고쳐 줘.
1. python3 -m http.server로 띄우고, Playwright(설치돼 있음)로 iPhone(390×844)과 Android(412×915) 크기에서 확인해.
2. 아래 경우를 모두 확인해:
   - 5K, 10K, 하프, 풀, 직접 입력(1.5km, 100km 경계)
   - 잘못된 기록(0초, 세계기록보다 빠른 기록, 빈칸), 나이 경계(10세, 100세)
   - ?ev=10k 같은 쿼리, 뒤로 가기, 새로고침 뒤 입력값 유지
3. 찾은 문제를 "재현 방법 / 기대 / 실제" 표로 PR 본문에 적어. 작고 확실한 것만 고치고, 크게 고쳐야 하는 건 표에만 남겨.
4. 고친 것마다 전후 스크린샷을 찍어 PR 본문에 넣어.

규칙:
- 화면 문장은 한국어 해요체로 써.
- 캐시되는 파일(sw.js의 SHELL, ON_USE 목록)을 고쳤으면 sw.js의 CACHE 번호를 1 올려.
- src/editor/는 건드리지 마(다른 작업 범위야).
- 커밋 전에 node src/engine/tier.test.mjs 같은 *.test.mjs를 전부 돌리고, trail check를 돌려.
```

---

## A2. 공유 이미지 편집기 QA와 버그 수정

```
hoohaa(레포 BeomhyunPark/hoohaa)는 러닝 티어 정적 웹앱이야. 결과 화면 아래 공유 이미지 편집기는 src/editor/editor.js(약 200KB, mountEditor 하나 안에 전부 들어 있음)와 assets.js, logtpl.js로 되어 있어.

할 일: 편집기를 실제로 써 보면서 버그를 찾아 고쳐 줘. 리팩터링은 하지 마. 이 파일은 나중에 따로 쪼갤 거라서, diff는 버그를 고치는 데 필요한 만큼만 작게 해.
1. 로컬 서버와 Playwright로 iPhone, Android 크기에서 결과 → 편집기를 열어.
2. 아래를 각각 해 보고 오류, 깨진 렌더, 사라지는 상태가 있는지 확인해:
   - 템플릿을 모두 하나씩 바꾸기, 이미지 형식 4종 바꾸기
   - 텍스트 추가와 글꼴 변경, 사진 추가와 필터·마스크, 스티커와 날씨 스티커
   - 잠금, 실행취소와 다시실행, 내 템플릿 저장과 불러오기
   - PNG 저장
3. 콘솔 에러는 전부 모아. 찾은 문제를 "재현 / 기대 / 실제" 표로 정리해.
4. 확실한 버그만 고치고, 전후 스크린샷을 남겨. 날씨(Open-Meteo)처럼 네트워크가 필요한 기능은 막혀 있으면 막혔다고 적고 넘어가.

규칙:
- 해요체로 써.
- 고친 파일이 sw.js 목록에 있으면 CACHE 번호를 1 올려.
- *.test.mjs를 전부 돌리고 trail check를 돌려.
```

---

## A3. 오늘 기록(/log/)과 백업·복원 점검

```
hoohaa(레포 BeomhyunPark/hoohaa)는 러닝 티어 정적 웹앱이야. /log/는 러닝, 대회, 신발, 식단 기록을 IndexedDB(hoohaa-log)에 저장하고 카드로 만드는 화면이야. 관련 코드는 src/app/logs.js, src/storage/logdb.js, src/storage/zip.js, src/engine/logcalc.js, src/editor/logtpl.js야.

할 일: 기록 흐름의 데이터 안전성을 점검하고 고쳐 줘.
1. 종류마다 저장 → 목록 → 수정 → 삭제를 해 봐.
   - Day N, 페이스, D-day, 신발 누적 거리가 맞게 계산되는지 확인해.
   - 날짜 경계(자정, 월말, 윤년)에서도 맞는지 확인해.
2. zip 백업 → 저장소 비우기 → 복원했을 때 사진 Blob까지 그대로 돌아오는지 확인해.
3. 이런 zip도 복원해 봐: 깨진 zip, 다른 앱의 zip, 빈 zip. 앱이 죽지 않고 해요체로 알려 주는지 확인해.
4. 탭을 옮기거나 새로고침해도 입력 중인 값이 유지되는지 확인해.
5. 고친 계산 로직은 logcalc.test.mjs와 zip.test.mjs에 테스트를 추가해.

규칙:
- 저장 스키마를 바꿔야 하면, 바꾸기 전에 PR 본문에 이유와 이전 데이터 이전 방법을 먼저 적어.
- sw.js CACHE 번호를 올려. *.test.mjs를 전부 돌리고 trail check를 돌려.
- src/editor/editor.js는 건드리지 마.
```

---

## A4. 계산기 페이지 7개 일관성 맞추기

```
hoohaa(레포 BeomhyunPark/hoohaa)는 러닝 티어 정적 웹앱이야. 계산기 페이지는 /pace/, /pace-calculator/, /predictor/, /splits/, /vdot/, /vo2max/, /bmr/이고, 각자 index.html 안에 인라인 스크립트가 있어. 대부분은 src/engine/tier.js를 import하고, /pace/와 /bmr/은 import하지 않아.

할 일: 7개 페이지를 비교해서 사용자가 보기에 어긋나는 점을 맞춰 줘.
1. 비교표를 만들어:
   - 기록 입력 형식(mm:ss, h:mm:ss, 콜론 없이 입력)과 잘못 입력했을 때 메시지
   - 결과 공유 버튼, 홈과 다른 계산기로 가는 링크
   - title, description, canonical, OG 태그
   - 모바일 레이아웃(390px)
2. 어긋나는 점 중에서 작고 확실한 것을 고쳐. 같은 기록 형식은 같은 방식으로 읽혀야 해.
3. 페이지마다 실제로 계산해 보고, 같은 입력에 같은 VDOT과 페이스가 나오는지 교차로 확인해.
4. 공통 모듈로 빼는 리팩터링은 하지 마(B8 범위야). 비교표는 PR 본문에 넣어.

규칙: 해요체로 써. sitemap.xml은 그대로 둬. trail check를 돌려.
```

---

## A5. 성능, 접근성, SEO 점검(Lighthouse)

```
hoohaa(레포 BeomhyunPark/hoohaa)는 러닝 티어 정적 웹앱이야. 빌드 없이 GitHub Pages로 배포해. 서비스 워커는 sw.js야.

할 일:
1. 로컬 서버를 띄우고, Lighthouse(Chromium 경로 /opt/pw-browsers/chromium, --headless --no-sandbox)로 모바일 기준 점수를 재.
   - 대상: /, /app/, /10k/, /bmr/, /pace-calculator/
2. 점수와 상위 문제를 표로 정리해.
3. 안전한 것만 고쳐:
   - 이미지 크기와 지연 로딩, 폰트 preload와 font-display
   - 버튼과 입력의 접근성 이름, 색 대비, 탭 순서
   - meta와 구조화 데이터 누락
4. 고친 뒤 다시 재서 전후 점수를 비교해.

하지 말 것: 프레임워크나 빌드 도구 도입, 디자인 변경, src/editor/ 수정.
규칙: 캐시되는 파일을 고쳤으면 sw.js CACHE 번호를 올려. trail check를 돌려.
```

---

## A6. 새 계산기: 심박 존 계산기 /hr-zones/

```
hoohaa(레포 BeomhyunPark/hoohaa)는 러닝 티어 정적 웹앱이야. 계산 로직은 DOM이 없는 src/engine/에 두고 node 테스트(*.test.mjs)를 붙이는 게 규칙이야. 계산기 페이지 예시는 /bmr/, /vdot/야.

할 일: 심박 존 계산기 페이지 /hr-zones/를 만들어 줘.
1. 계산 규칙은 docs/v4/rules.md의 "최대 심박과 존"을 그대로 따라.
   - 최대 심박(HRmax)을 입력받거나, 없으면 208 − 0.7 × 나이로 계산해.
   - Z1 70% 미만, Z2 70~80%, Z3 80~87%, Z4 87~93%, Z5 93% 초과.
   - 선택 입력으로 안정 심박을 받아서 카보넨 방식도 같이 보여 줄지는 PR 본문에 제안만 하고, 기본은 위 규칙만 써.
2. src/engine/hrzones.js에 순수 함수를 두고, src/engine/hrzones.test.mjs에 경계값 테스트를 붙여.
3. 페이지 구성:
   - 기존 계산기 페이지와 같은 헤더, 푸터, 스타일, 메타 구성
   - 존별로 bpm 범위와 쉬운 설명(해요체)
   - "의학적 조언이 아니에요" 안내 문구
4. sitemap.xml, 홈 계산기 카드, 관련 페이지(/pace/, /vo2max/)에 링크를 추가해.
5. 홈을 고쳤으면 sw.js CACHE 번호를 올려.

규칙: 해요체로 써. *.test.mjs를 전부 돌리고 trail check를 돌려. 로컬 서버와 Playwright로 390px 화면 스크린샷을 PR에 넣어.
```

---

## A7. 새 계산기: 러닝 칼로리 소모 계산기 /calories/

```
hoohaa(레포 BeomhyunPark/hoohaa)는 러닝 티어 정적 웹앱이야. /bmr/ 페이지가 기초대사량(BMR)과 하루 총 소비 칼로리(TDEE)를 보여 줘. 계산 로직은 src/engine/에 순수 함수로 두고 node 테스트를 붙이는 게 규칙이야.

할 일: 러닝 칼로리 소모 계산기 /calories/를 만들어 줘.
1. 입력은 체중, 거리 또는 시간, 페이스야. 계산식은 ACSM 러닝 공식이나 MET 표 중 하나를 골라 출처와 함께 PR 본문에 적어.
   - 근거가 확실하지 않은 계수는 쓰지 마.
2. src/engine/calories.js와 calories.test.mjs를 만들어.
3. 페이지 구성:
   - 결과 kcal과 "밥 한 공기 ≈ 300kcal" 같은 쉬운 비교
   - /bmr/로 이어지는 링크("하루 총 소비 칼로리도 확인해 보세요")
   - /bmr/에도 /calories/로 가는 링크를 추가해.
4. 기존 계산기와 같은 레이아웃과 메타를 쓰고, sitemap.xml과 홈 계산기 카드를 갱신해. 홈을 고쳤으면 sw.js CACHE 번호를 올려.

규칙: 해요체로 써. *.test.mjs를 전부 돌리고 trail check를 돌려. 390px 스크린샷을 PR에 넣어.
```
