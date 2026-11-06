# V. v4 첫 단계: 건강 앱 모양의 기록과 체감 피로 화면

프롬프트 하나 = 세션 하나 = PR 하나. `---` 사이를 통째로 복사해서 붙여 넣는다.

범위는 [../v4/next.md](../v4/next.md)다. 건강 앱이 넣어 준 것과 같은 모양의 기록 하나를 넣고, 체감 피로 1~10과 선택 메모를 받는 화면까지. 실제 건강 앱 읽기, 로그인, 서버, 판단 규칙은 없다.

V1 → V2 → V3 → V4 → V5 차례대로 한다. 모두 `mobile/`을 고치므로 동시에 돌리지 않는다. 세션마다 막히기 쉬운 곳을 하나씩만 두려고 잘게 나눴다.

| 세션 | 막히기 쉬운 곳 |
|---|---|
| V1 | Expo 설치와 CI |
| V2 | `mobile/` 밖의 웹 계산 코드 불러오기 |
| V3 | 건강 앱 원본 모양을 맞추기 |
| V4 | 화면과 입력 검사 |
| V5 | 기기 저장과 다시 묻지 않기 |

---

## V1. 폰 앱 뼈대 만들기

```
hoohaa(레포 BeomhyunPark/hoohaa)는 지금 빌드 없는 정적 웹앱(hoohaa.run)이야. 이제 v4로 폰 앱을 시작해. 먼저 docs/v4/index.md, docs/v4/next.md, docs/v4/platforms.md, docs/v4/az.md의 F절을 읽어.

할 일: 레포 안 mobile/ 폴더에 폰 앱 뼈대만 만들어 줘. 화면은 "hoohaa" 글자 하나 있는 빈 화면이면 돼.
1. Expo(지금 나온 SDK)와 React Native, TypeScript(strict)로 만들어. iPhone과 Android는 코드 하나야.
   - 건강 앱 권한 때문에 나중에 개발 빌드(prebuild)를 써야 해. expo-dev-client를 넣고, Expo Go에서만 되는 방식에 기대지 마.
   - ios/, android/ 폴더는 커밋하지 마(prebuild로 만드는 것). .gitignore에 넣어.
2. 테스트는 Jest(jest-expo)로. 빈 화면이 그려지는지 보는 테스트 하나만 둬. mobile/에서 npm test와 npx tsc --noEmit가 통과해야 해.
3. .github/workflows/test.yml에 mobile 테스트 job을 따로 추가해(npm ci, tsc, jest). 웹 job은 그대로 둬. 푸시한 뒤 두 job이 모두 초록인지 확인해.
4. mobile/README.md에 설치, 실행, 테스트 방법을 짧게 적어.

하지 말 것:
- 웹의 src/engine/을 불러오는 일(V2에서 해). 웹 스크린샷 준비(V2에서 해).
- 기록, 화면 흐름, 저장, 로그인, 서버 호출.

규칙:
- 웹(hoohaa.run)은 고치지 마. sw.js, 루트의 html, src/는 건드리지 않아. 그래서 sw.js CACHE 번호도 올리지 않아.
- 레포 루트에 package.json을 만들지 마. node_modules는 mobile/ 안에만 두고 커밋하지 않아.
- 웹 쪽 테스트(node tools/test.mjs, node tools/check-sw.mjs)도 그대로 통과해야 해.
- 커밋 전에 trail check를 돌려.
```

---

## V2. 웹 계산 코드를 폰 앱에서 그대로 불러오기, 화면 확인 방법 준비

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱(Expo, React Native, TypeScript) 뼈대야. mobile/README.md, docs/v4/platforms.md, docs/v4/az.md의 G절, docs/v4/features/tier-vdot.md를 먼저 읽어.

할 일 1: 웹의 src/engine/tier.js와 src/engine/data.js를 폰 앱에서 그대로 불러와.
- 복사하거나 공통 패키지로 옮기지 마. 웹의 import 경로도 바꾸지 마. 웹 파일은 한 글자도 고치지 않아.
- mobile/ 밖의 파일이라 Metro(metro.config.js의 watchFolders 등), Jest, TypeScript 세 곳 모두 설정이 필요할 거야. 셋 다 되는지 따로 확인해. 타입은 mobile/ 안의 .d.ts로만 붙여.
- 테스트: 10K 50:00 같은 기록 몇 개의 티어·VDOT가 웹의 src/engine/tier.test.mjs와 같은 값인지.
- 빈 화면에 그 계산 결과 하나를 임시로 보여서 Metro 번들에서도 되는지 확인해. 확인이 끝나면 화면에서는 빼도 돼.

할 일 2: 화면 확인 방법을 준비해.
- 이 클라우드 환경에는 폰과 시뮬레이터가 없어. npx expo start --web(또는 expo export --platform web)으로 띄우고 Playwright로 iPhone(390×844), Android(412×915) 크기 스크린샷을 찍는 스크립트를 mobile/tools/에 둬.
- 웹 빌드는 확인용일 뿐이고 어디에도 배포하지 않아. README에 그렇게 적어.
- 빈 화면 스크린샷 두 장을 docs/screenshots/v4/에 넣고 PR 본문에 붙여.

규칙:
- 막힌 설정이 있으면 무엇을 시도했고 왜 안 됐는지 PR 본문에 적어. 우회하려고 엔진 파일을 복사하지 마.
- mobile/에서 tsc와 npm test, 웹 쪽 node tools/test.mjs와 node tools/check-sw.mjs가 통과해야 해. trail check를 돌려.
```

---

## V3. 운동 기록 모양과 건강 앱 모양의 샘플 기록

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱(Expo, React Native, TypeScript)이야. mobile/README.md와 docs/v4/next.md, docs/v4/features/health-import.md, docs/v4/az.md의 B·H절을 먼저 읽어.

할 일: 운동 기록의 타입과, 건강 앱이 넣어 준 것과 같은 모양의 샘플 기록을 만들어 줘. 화면은 만들지 않아(V4에서 해).
1. mobile/src/record/에 운동 기록 타입을 둬. az.md H절대로 한 기록에는 이게 들어가:
   - 어디서 가져왔는지(애플 건강, 헬스 커넥트, 직접 입력), 그곳의 기록 번호, 가져온 시각
   - 측정된 운동 데이터, 사용자가 직접 넣은 데이터(체감 피로 1~10, 메모), 운동 경로
2. 애플 건강(HealthKit 운동)과 헬스 커넥트(ExerciseSessionRecord와 그 시간대의 거리·심박·경로 기록) 원본과 같은 모양의 샘플을 하나씩 mobile/src/record/fixtures/에 둬. 필드 이름과 단위는 각 플랫폼 문서와 실제로 많이 쓰는 RN 라이브러리의 반환값을 따라. 무엇을 기준으로 했는지 파일 위에 주석으로 적어.
3. 원본 → 기록으로 바꾸는 순수 함수를 플랫폼마다 하나씩 만들어.
   - "그 운동에 들어 있는 항목은 빠짐없이 가져온다"가 결정이야. 거리, 시간, 심박, 경로만 골라 내지 마. 기록 타입에 이름이 없는 항목도 버리지 말고 담아 둬.
   - 테스트로 확인해: 샘플의 모든 항목이 기록 어딘가에 남는다, 단위가 바뀐 값(초, 미터 등)이 맞다, 체감 피로와 메모는 비어 있다.
4. 건강 앱을 읽는 자리를 인터페이스로 만들고, 지금은 샘플을 돌려주는 가짜 구현만 둬. 실제 HealthKit, 헬스 커넥트 연결은 비워 둬(개발 빌드가 있는 폰이 생길 때까지).
5. 항목 이름(가져온 곳, 기록 번호, 가져온 시각)은 health-import.md에서 아직 정하지 않은 내용이야. 코드에 이름을 정했으면, 그 문서의 "아직 정할 내용"은 지우지 말고 아래에 **제안**으로 코드 위치와 함께 적어. 결정으로 올리는 건 사용자가 확인한 뒤야.

하지 말 것:
- 두 기록이 같은 운동인지 보는 기준은 정하지 마(아직 정할 내용이야). 이번에는 기록이 하나뿐이야.
- 기록을 해석하지 마. 티어, 컨디션, 통증 키워드는 이 작업이 아니야.
- 저장, 로그인, 서버 호출은 넣지 마.

규칙: mobile/에서 npx tsc --noEmit와 npm test가 통과해야 해. 웹 파일은 건드리지 마. trail check를 돌려.
```

---

## V4. 기록을 보여 주고 체감 피로와 메모를 받는 화면

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱이야. mobile/README.md, mobile/src/record/(기록 타입, 샘플, 가짜 건강 앱), mobile/tools/(웹 스크린샷 스크립트), docs/v4/next.md, docs/v4/features/health-import.md, docs/v4/features/copy.md를 먼저 읽어.

할 일: 운동이 끝난 뒤 첫 화면을 만들어 줘. 가짜 건강 앱이 샘플 기록 하나를 넣어 주고, 사용자는 체감 피로와 메모를 적어. 이번에는 저장을 메모리에만 해(기기 저장은 V5).
1. 화면 흐름:
   - 들어온 기록을 짧게 보여 줘. 날짜, 거리, 시간, 평균 페이스, 평균 심박 정도. 값이 없는 항목은 칸을 숨겨.
   - 체감 피로 1~10을 물어. 필수야. 1과 10이 무슨 뜻인지 옆에 짧게 적어.
   - 메모는 선택이야. 자리 표시 예시는 어디가 아픈지 정도로(예: "왼쪽 무릎이 조금 아파요"). 진단처럼 보이는 말은 쓰지 마.
   - 저장을 누르면 그 기록에 체감 피로와 메모가 붙고 "저장했어요" 정도만 보여 줘.
2. 컨디션, 목표, 내일 훈련, 통증 판단은 서버가 생긴 다음이라 보여 주지 마.
3. 테스트(@testing-library/react-native): 피로를 고르지 않으면 저장이 안 된다, 메모 없이도 저장된다, 저장한 값이 기록에 붙는다, 값이 없는 항목은 화면에 안 나온다.
4. mobile/tools/의 스크립트로 iPhone, Android 크기에서 입력 전, 피로 선택 후, 저장 후 스크린샷을 찍어 docs/screenshots/v4/에 넣고 PR 본문에 붙여.

하지 말 것: 기기 저장, 앱을 다시 열었을 때의 처리(V5에서 해). 로그인, 서버 호출.

규칙:
- 화면 문장은 한국어 해요체. 새로 쓴 문장은 PR 본문에 표로 모아. copy.md에 없는 문장이니, copy.md에 넣을지는 사용자에게 물어볼 거리로 남겨.
- 접근성: 피로 버튼마다 읽어 줄 이름을 붙이고, 누르는 영역은 44pt 이상.
- 웹 파일은 건드리지 마. mobile/에서 tsc와 npm test가 통과해야 해. trail check를 돌려.
```

---

## V5. 기기에 저장하고 같은 기록은 다시 묻지 않기

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱이야. mobile/README.md, mobile/src/record/, V4에서 만든 체감 피로·메모 화면, docs/v4/next.md, docs/v4/features/health-import.md를 먼저 읽어.

할 일: 체감 피로와 메모를 기기 안에 저장하고, 같은 기록에 대해 다시 묻지 않게 해 줘.
1. 저장은 기기 안에만 해(AsyncStorage 같은 것). 계정과 서버는 아직 없어.
   - 저장소는 작은 인터페이스 뒤에 둬서, 나중에 서버(<개발용 API 주소>)로 바꿀 때 화면 코드를 고치지 않게 해. 메모리 구현(V4)과 기기 구현 둘 다 그 인터페이스를 따르게 해.
   - 기록은 가져온 곳과 그곳의 기록 번호로 찾아. 두 기록이 같은 운동인지 보는 기준은 아직 정하지 않았으니 그 이상은 하지 마.
2. 체감 피로는 한 번만 묻는다는 게 결정이야. 이미 피로가 저장된 기록이 다시 들어오면 묻지 말고 저장된 값을 보여 줘.
3. 저장된 값이 깨졌거나 형식이 다르면 앱이 죽지 않고, 그 기록을 처음처럼 다시 물어. 이 경우를 테스트에 넣어.
4. 테스트: 앱을 다시 열어도 다시 묻지 않는다, 저장한 피로와 메모가 그대로 돌아온다, 메모 없이 저장한 기록도 다시 묻지 않는다, 깨진 저장값.
5. mobile/tools/의 스크립트로 "이미 저장한 기록이 다시 들어온 화면"을 iPhone, Android 크기로 찍어 docs/screenshots/v4/에 넣고 PR 본문에 붙여.
6. 끝나면 docs/v4/next.md에 이 범위에서 끝난 부분을 한 줄로 적어. 남은 것(실제 건강 앱 읽기)은 그대로 둬.

하지 말 것: 로그인, 서버 호출, 판단 규칙, 같은 운동 판별 기준.

규칙: 저장 형식은 PR 본문에 예시 JSON으로 적어. 웹 파일은 건드리지 마. mobile/에서 tsc와 npm test가 통과해야 해. trail check를 돌려.
```
