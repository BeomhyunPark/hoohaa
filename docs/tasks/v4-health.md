# V. v4 첫 단계: 건강 앱 모양의 기록과 체감 피로 화면

프롬프트 하나 = 세션 하나 = PR 하나. `---` 사이를 통째로 복사해서 붙여 넣는다.

범위는 [../v4/next.md](../v4/next.md)다. 건강 앱이 넣어 준 것과 같은 모양의 기록 하나를 넣고, 체감 피로 1~10과 선택 메모를 받는 화면까지. 실제 건강 앱 읽기, 로그인, 서버, 판단 규칙은 없다.

V1 → V2 → V3 차례대로 한다. 셋 다 `mobile/`을 고치므로 동시에 돌리지 않는다.

---

## V1. 폰 앱 뼈대 만들기

```
hoohaa(레포 BeomhyunPark/hoohaa)는 지금 빌드 없는 정적 웹앱(hoohaa.run)이야. 이제 v4로 폰 앱을 시작해. 먼저 docs/v4/index.md, docs/v4/next.md, docs/v4/platforms.md, docs/v4/az.md의 F·G절을 읽어.

할 일: 레포 안 mobile/ 폴더에 폰 앱 뼈대를 만들어 줘. 화면은 빈 화면 하나면 돼.
1. Expo(지금 나온 SDK)와 React Native, TypeScript(strict)로 만들어. iPhone과 Android는 코드 하나야.
   - 건강 앱 권한 때문에 나중에 개발 빌드(prebuild)를 써야 해. expo-dev-client를 넣고, Expo Go에서만 되는 방식에 기대지 마.
   - ios/, android/ 폴더는 커밋하지 마(prebuild로 만드는 것). .gitignore에 넣어.
2. 계산은 웹의 src/engine/tier.js와 src/engine/data.js를 그대로 가져다 써. 복사하거나 공통 패키지로 옮기지 마. 웹의 import 경로도 바꾸지 마.
   - mobile/ 밖의 파일이라 Metro(metro.config.js의 watchFolders 등)와 Jest, TypeScript 설정이 필요할 거야. 필요하면 .d.ts로 타입만 붙여.
   - 이게 되는지 보여 주는 테스트를 하나 넣어. 예: 10K 50:00의 티어·VDOT가 웹의 tier.test.mjs와 같은 값인지.
3. 테스트는 Jest(jest-expo)로. npm test, npx tsc --noEmit, (넣었다면) lint가 mobile/에서 통과해야 해.
4. mobile/README.md에 설치, 실행, 테스트 방법을 짧게 적어. 이 클라우드 환경에는 폰과 시뮬레이터가 없으니, 화면 확인은 npx expo start --web으로 띄워 Playwright로 iPhone(390×844), Android(412×915) 크기 스크린샷을 찍는 방식이라고 적어. 웹 빌드는 확인용일 뿐이고 어디에도 배포하지 않아.
5. 빈 화면 스크린샷 두 장을 docs/screenshots/v4/에 넣고 PR 본문에 붙여.

규칙:
- 웹(hoohaa.run)은 고치지 마. sw.js, 루트의 html, src/는 건드리지 않아. 그래서 sw.js CACHE 번호도 올리지 않아.
- 레포 루트에 package.json을 만들지 마. node_modules는 mobile/ 안에만 두고 커밋하지 않아.
- 웹 쪽 테스트(node tools/test.mjs, node tools/check-sw.mjs)도 그대로 통과해야 해.
- .github/workflows/test.yml에 mobile 테스트 job을 따로 추가해(npm ci, tsc, jest). 웹 job은 그대로 둬.
- 화면 문장은 한국어 해요체. 로그인, 서버 호출, 판단 규칙은 넣지 마.
- 커밋 전에 trail check를 돌려.
```

---

## V2. 운동 기록 모양과 건강 앱 모양의 샘플 기록

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱(Expo, React Native, TypeScript)이야. mobile/README.md와 docs/v4/next.md, docs/v4/features/health-import.md, docs/v4/az.md의 B·H절을 먼저 읽어.

할 일: 운동 기록의 타입과, 건강 앱이 넣어 준 것과 같은 모양의 샘플 기록을 만들어 줘. 화면은 만들지 않아(V3에서 해).
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

## V3. 기록 하나를 넣고 체감 피로와 메모를 받는 화면

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱이야. mobile/README.md, mobile/src/record/(V2에서 만든 기록 타입과 샘플), docs/v4/next.md, docs/v4/features/health-import.md, docs/v4/features/copy.md를 먼저 읽어.

할 일: 운동이 끝난 뒤 첫 화면을 만들어 줘. 건강 앱 대신 가짜 구현이 샘플 기록 하나를 넣어 주고, 사용자는 체감 피로와 메모를 적어.
1. 화면 흐름:
   - 들어온 기록을 짧게 보여 줘. 날짜, 거리, 시간, 평균 페이스, 평균 심박 정도. 값이 없는 항목은 칸을 숨겨.
   - 체감 피로 1~10을 한 번 물어. 필수야. 1과 10이 무슨 뜻인지 옆에 짧게 적어.
   - 메모는 선택이야. 자리 표시 예시는 어디가 아픈지 정도로(예: "왼쪽 무릎이 조금 아파요"). 진단처럼 보이는 말은 쓰지 마.
   - 저장하면 그 기록에 체감 피로와 메모가 붙어. 같은 기록에 대해 다시 묻지 않아.
2. 저장은 기기 안에만 해(AsyncStorage 같은 것). 계정과 서버는 아직 없어. 저장 위치는 나중에 서버로 바꾸기 쉽게 작은 인터페이스 뒤에 둬.
3. 저장한 뒤에는 "저장했어요" 정도만 보여 줘. 컨디션, 목표, 내일 훈련, 통증 판단은 서버가 생긴 다음이라 보여 주지 마.
4. 테스트(@testing-library/react-native): 피로를 고르지 않으면 저장이 안 된다, 메모 없이도 저장된다, 저장한 값이 기록에 붙는다, 앱을 다시 열어도 다시 묻지 않는다.
5. npx expo start --web으로 띄워 Playwright로 iPhone(390×844), Android(412×915) 크기에서 입력 전, 피로 선택 후, 저장 후 스크린샷을 찍어 docs/screenshots/v4/에 넣고 PR 본문에 붙여. 웹 빌드는 확인용이야.

규칙:
- 화면 문장은 한국어 해요체. 새로 쓴 문장은 PR 본문에 표로 모아. copy.md에 없는 문장이니, copy.md에 넣을지는 사용자에게 물어볼 거리로 남겨.
- 접근성: 피로 버튼마다 읽어 줄 이름을 붙이고, 누르는 영역은 44pt 이상.
- 웹 파일은 건드리지 마. mobile/에서 tsc와 npm test가 통과해야 해. trail check를 돌려.
- 화면을 다 만든 뒤 docs/v4/next.md에서 끝난 부분이 무엇인지 한 줄로 적어. 남은 것(실제 건강 앱 읽기)은 그대로 둬.
```
