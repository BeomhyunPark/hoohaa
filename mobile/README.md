# hoohaa 폰 앱

iPhone과 Android를 한 코드로 만드는 Expo(SDK 58) · React Native · TypeScript(strict) 앱이다. 지금은 운동이 끝난 뒤 첫 화면 하나가 있다. 가짜 건강 앱이 샘플 기록 하나를 넣어 주고, 체감 피로와 메모를 받아 메모리에만 저장한다(아래 "운동이 끝난 뒤 첫 화면"). 웹(hoohaa.run)과는 따로 돌지만, 티어·VDOT 계산은 웹의 `src/engine/tier.js`와 `data.js`를 복사하지 않고 그대로 불러온다(아래 "웹 계산 엔진 불러오기").

건강 앱 권한 때문에 Expo Go가 아니라 개발 빌드(`expo-dev-client`, prebuild)로 돌린다. `ios/`와 `android/`는 prebuild가 만드는 폴더라 커밋하지 않는다.

## 설치

Node 22를 쓴다. 이 폴더에서 설치한다(레포 루트에는 package.json이 없다).

```bash
cd mobile
npm ci
```

## 실행

처음 한 번, 또는 네이티브 설정을 바꾼 뒤에 개발 빌드를 만들어 기기나 에뮬레이터에 깐다. Android는 Android SDK, iPhone은 Xcode가 깔린 Mac이 필요하다.

```bash
npm run android
```

```bash
npm run ios
```

그 뒤에는 개발 서버만 띄우고, 깔아 둔 개발 빌드 앱에서 연다.

```bash
npm start
```

아직 `ios.bundleIdentifier`와 `android.package`를 정하지 않았다(스토어 단계에서 정한다). 처음 빌드할 때 Expo가 물어보면 임시 값을 넣되, `app.json`에 커밋하지 않는다.

## 웹 계산 엔진 불러오기

앱 코드에서는 이렇게 쓴다.

```ts
import { calculate, vdot } from '@hoohaa/engine/tier.js';
import { D } from '@hoohaa/engine/data.js';
```

`@hoohaa/engine/`은 npm 패키지가 아니라 레포의 `../src/engine/` 폴더를 가리키는 이름이다. 파일을 복사하거나 공통 패키지로 옮기지 않고, 웹 파일과 웹의 import 경로는 그대로 둔다([../docs/v4/az.md](../docs/v4/az.md) G절). mobile/ 밖의 파일이라 세 곳에서 따로 이어 준다.

| 어디 | 설정 | 빼면 |
|---|---|---|
| Metro (앱 번들) | `metro.config.js`: `watchFolders`에 `../src/engine`, `resolver.extraNodeModules`에 `@hoohaa/engine` | `Unable to resolve "@hoohaa/engine/tier.js"` |
| Jest | `package.json`의 `jest.moduleNameMapper`(`../src/engine/$1`)와 `jest.modulePaths`(`<rootDir>/node_modules`) | 아래 참고 |
| TypeScript | `tsconfig.json`의 `paths`가 `types/engine/*.d.ts`를 가리킨다 | `Cannot find module '@hoohaa/engine/tier.js'` |

- 타입은 `types/engine/tier.d.ts`, `data.d.ts`에만 있다. 웹 엔진의 내보내기나 결과 모양이 바뀌면 이 두 파일을 같이 고친다.
- jest-expo는 `tsconfig.json`의 `paths`를 읽어 Jest 매퍼를 스스로 만든다. 그대로 두면 `.d.ts` 폴더를 가리켜 `Could not locate module` 오류가 난다. `package.json`의 매퍼는 같은 키(`^@hoohaa/engine/(.*)$`)로 그것을 덮어쓴다. `paths`의 이름을 바꾸면 매퍼의 키도 같이 바꾼다.
- `modulePaths`가 없으면, Babel이 엔진 파일에 넣은 `@babel/runtime` 헬퍼를 레포 루트 쪽에서 찾다가 `Cannot find module '@babel/runtime/helpers/interopRequireDefault'`로 실패한다(레포 루트에는 node_modules가 없다).
- `__tests__/engine.test.ts`는 10K 50:00 같은 기록의 티어·VDOT가 웹의 `src/engine/tier.test.mjs`와 같은지, 그리고 같은 파일을 plain node로 돌린 결과와 한 글자도 다르지 않은지 본다.

## 운동 기록

`src/record/`에 운동 기록 모양과 건강 앱 원본 → 기록 변환이 있다. 기기 저장과 서버 호출은 없다.

- `types.ts`: 기록 하나(`WorkoutRecord`). 가져온 곳(`origin`), 측정된 데이터(`measured`), 사용자가 넣은 데이터(`userInput`, 체감 피로·메모), 경로(`route`), 이름이 없는 원본 항목 전부(`extra`, 원본 경로 → 값).
- `apple-health.ts`, `health-connect.ts`: 원본 → 기록 순수 함수. 원본을 경로마다 펼친 뒤 이름 있는 항목만 꺼내고 나머지는 모두 `extra`로 넘기므로, 모르는 항목이 있어도 버려지지 않는다(`fields.ts`).
- `fixtures/`: `@kingstinct/react-native-healthkit` 16.2.0과 `react-native-health-connect` 4.1.3이 돌려주는 모양의 샘플 러닝. 기준은 각 파일 위 주석에 있다. 값은 지어낸 것이라 실제 기기에서 한 번 비교해 봐야 한다.
- `health-reader.ts`: 건강 앱을 읽는 자리(`HealthReader`). 지금은 샘플을 돌려주는 가짜 구현만 있다. 두 라이브러리는 아직 설치하지 않았다(개발 빌드가 있는 폰이 생기면 붙인다).
- `summary.ts`: 기록을 화면에 보여 줄 짧은 항목(날짜, 거리, 시간, 평균 페이스, 평균 심박)으로 바꾼다. 값이 없는 항목은 목록에서 빠진다. 날짜는 기기 시간대로 적는다.
- `user-input.ts`: 체감 피로(1~10의 정수)와 메모를 붙인 새 기록을 만든다. 메모는 앞뒤 빈칸을 떼고, 비어 있으면 null이다.
- `store.ts`: 기록을 두는 자리(`RecordStore`). 지금은 메모리 구현만 있다. 앱을 닫으면 사라진다.

## 운동이 끝난 뒤 첫 화면

`src/screens/AfterRunScreen.tsx`. `App.tsx`가 가짜 건강 앱과 메모리 저장소를 넣어 준다(아이폰은 애플 건강 샘플, 그 밖은 헬스 커넥트 샘플).

1. 건강 앱에서 읽은 기록을 짧게 보여 준다. 값이 없는 항목은 칸째로 숨긴다.
2. 체감 피로 1~10을 묻는다. 고르기 전에는 저장 버튼이 눌리지 않는다.
3. 메모는 선택이다.
4. 저장을 누르면 기록에 체감 피로와 메모가 붙고 "저장했어요"가 보인다.
5. 저장한 뒤 "수정"을 누르면 저장한 값이 채워진 채로 다시 열린다. 고쳐서 저장하면 같은 기록의 값이 바뀌고, "취소"는 저장된 값으로 돌아간다. 앱이 다시 묻지는 않는다.

- 컨디션, 목표, 내일 훈련, 통증 판단은 서버가 생긴 다음이라 이 화면에 없다. 기기 저장과, 앱을 다시 열었을 때 같은 기록을 다시 묻지 않는 일도 아직 없다.
- 화면 문장은 `src/copy/after-run.ts` 한 곳에 있다. 기준은 [../docs/v4/features/copy.md](../docs/v4/features/copy.md)의 "기록과 체감 피로" 표다. `__tests__/copy-doc.test.ts`가 코드의 문장이 그 표에 그대로 있는지 보므로, 문장을 고칠 때는 두 곳을 같이 고친다.
- 기록의 시간은 멈춘 구간을 뺀 값이다. 헬스 커넥트는 시간 항목이 없어 끝 − 시작에서 PAUSE 구간을 뺀다(`src/record/health-connect.ts`). 그래서 같은 달리기는 두 건강 앱에서 같은 시간과 평균 페이스로 보인다.
- 피로 버튼은 한 줄에 5개씩 두 줄이다. 10개를 한 줄에 두면 좁은 폰에서 누르는 영역이 44pt보다 작아진다. 버튼마다 화면 낭독기가 읽을 이름("체감 피로 7")이 있다.
- 상태 표시줄과 노치는 `react-native-safe-area-context`로 피한다. 네이티브 모듈이라 Jest에서는 라이브러리의 가짜로 바꾼다(`test-utils/setup.js`).

## 테스트

```bash
npm test
```

```bash
npx tsc --noEmit
```

CI(`.github/workflows/test.yml`의 `mobile` job)도 `npm ci`, `tsc`, `jest`를 같은 순서로 돌린다.

Jest는 서울 시간대로 돈다(`test-utils/timezone.js`). 화면이 날짜를 기기 시간대로 적기 때문에, 어디서 돌려도 같은 값이 나오게 고정했다.

## 화면 확인 (폰이 없을 때)

폰이나 시뮬레이터가 없는 곳(클라우드 세션 등)에서는 앱을 웹 번들로 만들어 폰 크기 스크린샷을 찍는다.

```bash
npm run screenshot
```

`tools/screenshot.mjs`가 `expo export --platform web`으로 임시 폴더에 웹 번들을 만들고, 127.0.0.1에서만 잠깐 띄운 뒤, Playwright(Chromium)로 iPhone(390×844)과 Android(412×915) 크기 화면을 찍어 `../docs/screenshots/v4/`에 저장한다. 끝나면 임시 폴더를 지운다.

찍는 화면은 스크립트의 `FLOWS`에 있다. 한 흐름은 화면을 순서대로 눌러 가며 여러 장을 찍고, 파일 이름은 `<흐름>-<단계>-<기기>.png`다. 지금은 `after-run`(입력 전 `1-before`, 체감 피로 선택 후 `2-picked`, 저장 후 `3-saved`, 수정을 누른 뒤 `4-edit`) 하나다. 이 흐름은 피로, 저장, 수정, 취소 버튼의 누르는 영역이 44 이상인지도 잰다. 흐름과 저장 폴더는 `--flow`, `--out`으로 바꾼다.

```bash
npm run screenshot -- --flow after-run --out /tmp/shots
```

- iPhone 크기에는 애플 건강 샘플, Android 크기에는 헬스 커넥트 샘플을 넣는다. 웹 번들에서만 주소의 `?health=apple_health`로 고른다(`App.tsx`).
- 날짜가 같게 찍히도록 브라우저를 한국어, 서울 시간대로 맞춘다.

- **이 웹 빌드는 확인용일 뿐이다. 어디에도 배포하지 않는다.** hoohaa.run과도 관계없다. 앱은 웹으로 내지 않는다.
- react-native-web으로 그린 근사치라 글꼴, 상태 표시줄, 안전 영역은 실제 폰과 다르다. 실제 화면은 개발 빌드로 기기나 시뮬레이터에서 본다.
- 웹 번들에 필요한 `react-dom`, `react-native-web`, `@expo/metro-runtime`은 이 확인용이라 devDependencies에 있다.
- Playwright와 Chromium은 의존성에 넣지 않았다. 없으면 따로 깐다(`npm i -g playwright && npx playwright install chromium`).
