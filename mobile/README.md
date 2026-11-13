# hoohaa 폰 앱

iPhone과 Android를 한 코드로 만드는 Expo(SDK 58) · React Native · TypeScript(strict) 앱이다. 지금은 운동이 끝난 뒤 첫 화면, 기록 직접 입력 화면, 지난 기록 목록이 있다. 가짜 건강 앱이 샘플 기록 하나를 넣어 주고, 체감 피로와 메모를 받아 기기 안에 저장한다. 같은 기록이 다시 들어오면 다시 묻지 않는다(아래 "운동이 끝난 뒤 첫 화면"). 건강 앱 기록이 없으면 날짜, 거리, 시간을 직접 적어 넣을 수 있다(아래 "기록 직접 입력"). 계정과 서버는 아직 없다. 웹(hoohaa.run)과는 따로 돌지만, 티어·VDOT 계산은 웹의 `src/engine/tier.js`와 `data.js`를 복사하지 않고 그대로 불러온다(아래 "웹 계산 엔진 불러오기").

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

`src/record/`에 운동 기록 모양, 건강 앱 원본 → 기록 변환, 저장소가 있다. 서버 호출은 없다.

- `types.ts`: 기록 하나(`WorkoutRecord`). 가져온 곳(`origin`), 측정된 데이터(`measured`), 사용자가 넣은 데이터(`userInput`, 체감 피로·메모), 경로(`route`), 이름이 없는 원본 항목 전부(`extra`, 원본 경로 → 값).
- `apple-health.ts`, `health-connect.ts`: 원본 → 기록 순수 함수. 원본을 경로마다 펼친 뒤 이름 있는 항목만 꺼내고 나머지는 모두 `extra`로 넘기므로, 모르는 항목이 있어도 버려지지 않는다(`fields.ts`).
- `fixtures/`: `@kingstinct/react-native-healthkit` 16.2.0과 `react-native-health-connect` 4.1.3이 돌려주는 모양의 샘플 러닝. 기준은 각 파일 위 주석에 있다. 값은 지어낸 것이라 실제 기기에서 한 번 비교해 봐야 한다.
- `health-reader.ts`: 건강 앱을 읽는 자리(`HealthReader`). 지금은 샘플을 돌려주는 가짜 구현만 있다. 두 라이브러리는 아직 설치하지 않았다(개발 빌드가 있는 폰이 생기면 붙인다). `createLatestWorkoutReader`는 건강 앱의 마지막 운동과 직접 입력한 기록 중 더 늦게 끝난 것을 돌려준다. `createRecordLister`는 목록 화면에 직접 입력한 기록 전부와 건강 앱의 마지막 운동을 늦게 끝난 순서로 돌려준다.
- `summary.ts`: 기록을 화면에 보여 줄 짧은 항목(날짜, 거리, 시간, 평균 페이스, 평균 심박, 평균 케이던스)으로 바꾼다. 값이 없는 항목은 목록에서 빠진다. 날짜는 기기 시간대로 적는다.
- `user-input.ts`: 체감 피로(1~10의 정수)와 메모를 붙인 새 기록을 만든다. 메모는 앞뒤 빈칸을 떼고, 비어 있으면 null이다.
- `store.ts`: 기록을 두는 자리(`RecordStore`). 화면은 이 인터페이스만 본다. `remove`는 기록에 저장해 둔 체감 피로와 메모를 지운다. `findUserInput`은 기록에 저장해 둔 체감 피로와 메모를 찾고, `save`는 체감 피로와 메모가 붙은 기록을 저장한다. 메모리 구현이 같이 있다(테스트용, 닫으면 사라진다).
- `device-store.ts`: 기기 구현(AsyncStorage). 앱이 쓴다. 아래 "기기 저장"을 본다.
- `manual.ts`: 직접 입력한 기록. 입력칸의 글자를 읽어 검사하고(`readManualForm`), 기록 번호를 만들고(`newManualRecordId`), 기록으로 만든다(`manualRecord`).
- `manual-store.ts`: 직접 입력한 기록의 측정값을 두는 자리(`ManualRecordStore`). 메모리 구현과 기기 구현이 있다. 아래 "기록 직접 입력"을 본다.

### 기기 저장

체감 피로와 메모만 기기에 둔다. 거리, 심박, 경로 같은 측정값은 건강 앱이 갖고 있고 앱을 열 때마다 다시 읽으므로 복사해 두지 않는다. 계정과 서버는 없다.

기록 하나에 키 하나다. 기록은 가져온 곳과 그곳의 기록 번호로만 찾는다. 두 기록이 같은 운동인지 보는 기준은 아직 정하지 않아서, 다른 곳에서 온 같은 달리기는 다른 기록이다.

```
키  hoohaa/user-input/apple_health/6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B
```

```json
{
  "version": 1,
  "source": "apple_health",
  "sourceRecordId": "6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B",
  "perceivedExertion": 7,
  "memo": "왼쪽 무릎이 조금 아파요"
}
```

- 메모가 없으면 `"memo": null`이다. `version`은 값의 모양을 바꿀 때 올린다(`SAVED_VERSION`).
- `source`, `sourceRecordId`라는 이름은 아직 제안이다([../docs/v4/features/health-import.md](../docs/v4/features/health-import.md)). 이름이 바뀌면 `version`을 올린다. 예전 값을 옮기는 코드를 같이 넣지 않으면 그 기록들은 처음처럼 다시 묻게 된다.
- 저장된 값을 쓸 수 없으면 저장한 적이 없는 것으로 본다(`parseSaved`가 null). 앱은 죽지 않고 그 기록을 처음처럼 다시 묻는다. 쓸 수 없는 값은 JSON이 아닌 글자, 다른 `version`, 다른 기록의 `source`·`sourceRecordId`, 1~10의 정수가 아닌 체감 피로, 글자도 null도 아닌 메모다. 다시 답해 저장하면 그 자리를 덮어쓴다.
- 기기 저장소 자체를 읽지 못하면(AsyncStorage 오류) 다시 묻지 않는다. 값이 있는지 모르는 채로 물으면 한 번만 묻는다는 결정에 어긋나기 때문이다. 화면은 "기록을 읽지 못했어요."와 "다시 읽기"를 보여 준다.
- 직접 입력한 기록의 체감 피로와 메모도 같은 방법으로 둔다. 가져온 곳은 `manual`, 기록 번호는 앱이 만들어 붙인 번호다.
- 나중에 서버(`<개발용 API 주소>`)에 둘 때는 `RecordStore`를 따르는 구현을 하나 더 만들고 `App.tsx`에서 바꿔 넣는다. 화면 코드는 고치지 않는다.

## 운동이 끝난 뒤 첫 화면

`src/screens/AfterRunScreen.tsx`. `App.tsx`가 가짜 건강 앱과 기기 저장소를 넣어 준다(아이폰은 애플 건강 샘플, 그 밖은 헬스 커넥트 샘플).

1. 건강 앱에서 읽은 기록을 짧게 보여 준다. 값이 없는 항목은 칸째로 숨긴다.
2. 체감 피로 1~10을 묻는다. 고르기 전에는 저장 버튼이 눌리지 않는다.
3. 메모는 선택이다.
4. 저장을 누르면 기록에 체감 피로와 메모가 붙고 "저장했어요"가 보인다.
5. 저장한 뒤 "수정"을 누르면 저장한 값이 채워진 채로 다시 열린다. 고쳐서 저장하면 같은 기록의 값이 바뀌고, "취소"는 저장된 값으로 돌아간다. 앱이 다시 묻지는 않는다.
6. 체감 피로는 기록마다 한 번만 묻는다. 앱을 닫았다 열어 같은 기록이 다시 들어오면 묻지 않고 저장된 값과 "수정"만 보여 준다. "저장했어요"는 방금 저장했을 때만 하는 말이라 이때는 없다. 측정값은 방금 건강 앱에서 읽은 것이고, 체감 피로와 메모만 저장소에서 온다.

- 컨디션, 목표, 내일 훈련, 통증 판단은 서버가 생긴 다음이라 이 화면에 없다.
- 화면 문장은 `src/copy/after-run.ts` 한 곳에 있다. 기준은 [../docs/v4/features/copy.md](../docs/v4/features/copy.md)의 "기록과 체감 피로" 표다. `__tests__/copy-doc.test.ts`가 코드의 문장이 그 표에 그대로 있는지 보므로, 문장을 고칠 때는 두 곳을 같이 고친다.
- 기록의 시간은 멈춘 구간을 뺀 값이다. 헬스 커넥트는 시간 항목이 없어 끝 − 시작에서 PAUSE 구간을 뺀다(`src/record/health-connect.ts`). 그래서 같은 달리기는 두 건강 앱에서 같은 시간과 평균 페이스로 보인다.
- 피로 버튼은 한 줄에 5개씩 두 줄이다. 10개를 한 줄에 두면 좁은 폰에서 누르는 영역이 44pt보다 작아진다. 버튼마다 화면 낭독기가 읽을 이름("체감 피로 7")이 있다.
- 상태 표시줄과 노치는 `react-native-safe-area-context`로 피한다. 네이티브 모듈이라 Jest에서는 라이브러리의 가짜로 바꾼다(`test-utils/setup.js`). 기기 저장소(`@react-native-async-storage/async-storage`)도 같다. 그 가짜는 메모리에 두고 테스트 파일마다 새로 생긴다.

## 기록 직접 입력

`src/screens/ManualEntryScreen.tsx`. 운동이 끝난 뒤 첫 화면 맨 아래의 "기록 직접 입력"으로 연다.

1. 날짜, 거리(km), 시간은 꼭 받는다. 날짜는 오늘로 채워 둔다.
2. 시작 시각, 평균 심박, 평균 케이던스는 선택이다. 비워 두면 기록에 없는 값(null)으로 남는다.
3. 저장을 누르면 칸을 검사한다. 틀린 칸 아래에 이유를 적고 저장하지 않는다. 그 칸을 고치기 시작하면 알림을 지운다.
4. 다 맞으면 앱이 기록 번호를 만들어 붙이고 기기에 저장한 뒤, 운동이 끝난 뒤 첫 화면이 방금 그 기록으로 열려 체감 피로와 메모를 묻는다.
5. 앱을 다시 열면 건강 앱의 마지막 운동과 직접 입력한 기록 중 더 늦게 끝난 것이 보인다.

- 날짜, 시간, 시작 시각 칸은 숫자만 받아 구분 글자를 붙여 보여 준다(20261113 → 2026-11-13, 2832 → 28:32, 0630 → 06:30). 시간은 웹의 기록 칸과 같은 규칙(`src/engine/parse.js`의 `readTime`, `showTime`)으로 읽는다.
- 받는 범위는 오타 거르개다. 거리 0 초과 500km 이하, 평균 심박 30~250, 평균 케이던스 50~300, 날짜는 오늘까지(`MANUAL_LIMITS`). 기록을 판단하지 않는다.
- 기록 번호는 저장을 누를 때 만든다. 모양은 `m-<만든 시각>-<무작위 8자>`다(예: `m-mhx2k9a0-4f7q0zb1`). 한 기기 안에서 겹치지 않으면 되고, 번호에서 뜻을 읽지 않는다.
- 시작 시각을 적지 않으면 `startTime`은 그 날짜의 0시(기기 시간대)이고, `extra`의 `manual.startTimeEntered`가 false다. 화면은 지어낸 시각을 보여 주지 않고 날짜만 적는다("11월 13일 (금)").
- 끝난 시각은 시작 + 시간이다. 멈춘 시간은 모른다.
- 건강 앱 기록과 달리 측정값을 기기에 저장한다. 이 앱 말고는 어디에도 없기 때문이다. 기록 하나에 키 하나다.

```json
{
  "version": 1,
  "id": "m-mhx2k9a0-4f7q0zb1",
  "createdAt": "2026-11-12T22:10:00.000Z",
  "startTime": "2026-11-12T21:10:00.000Z",
  "startTimeEntered": true,
  "durationSeconds": 3300,
  "distanceMeters": 10000,
  "averageBpm": 152,
  "averageCadenceSpm": 176
}
```

- 키는 `hoohaa/manual-record/<기록 번호>`다. 체감 피로와 메모는 여기 넣지 않고 "기기 저장"의 키(`hoohaa/user-input/manual/<기록 번호>`)에 둔다.
- 쓸 수 없는 값(JSON이 아닌 글자, 다른 `version`, 다른 번호, 거리나 시간이 없는 값)은 건너뛴다. 다른 기록은 그대로 읽는다.
- 적어 둔 기록은 고치고 지울 수 있다. 그 기록을 열면(방금 저장했거나 지난 기록에서 골랐을 때) "기록 고치기"와 "기록 지우기"가 있다. 건강 앱 기록에는 없다(측정값이 건강 앱의 것이다).
  - 고치기: 같은 입력 화면이 그 기록의 값으로 채워져 열린다(`editing`). 저장하면 번호와 만든 시각은 그대로 두고 같은 자리를 바꾼다. 그래서 체감 피로와 메모가 그대로 붙어 있고 다시 묻지 않는다.
  - 지우기: 한 번 묻고 지운다. 측정값(`hoohaa/manual-record/…`)을 먼저, 체감 피로와 메모(`hoohaa/user-input/manual/…`)를 그다음에 지운다. 지운 뒤에는 지난 기록으로 간다. 되돌리기는 없다.
- 건강 앱 기록과 같은 운동인지는 보지 않는다(기준을 아직 정하지 않았다).
- 화면 문장은 `src/copy/manual-entry.ts`에 있고, 기준은 [../docs/v4/features/copy.md](../docs/v4/features/copy.md)의 "기록 직접 입력" 표다.

## 지난 기록

`src/screens/RecordListScreen.tsx`. 운동이 끝난 뒤 첫 화면 맨 아래의 "지난 기록"으로 연다.

- 직접 입력한 기록 전부와 건강 앱의 마지막 운동을 늦게 끝난 순서로 보여 준다. 건강 앱의 지난 운동들은 아직 없다(`HealthReader`가 마지막 운동 하나만 읽는다). 실제 건강 앱 읽기를 붙일 때 넓힌다.
- 한 줄에는 날짜, 거리 · 시간 · 평균 페이스가 있고, 직접 입력한 기록에는 "직접 입력", 체감 피로를 저장해 둔 기록에는 "체감 피로 4"가 붙는다.
- 한 줄을 누르면 그 기록이 운동이 끝난 뒤 첫 화면으로 열린다. 체감 피로를 아직 답하지 않은 기록이면 거기서 묻는다.
- "돌아가기"는 가장 최근 기록으로 간다.
- 화면은 `App.tsx`의 상태 하나(`View`)로 바꾼다. 내비게이션 라이브러리는 아직 없어서 안드로이드의 뒤로 가기 버튼은 화면을 되돌리지 않고 앱을 나간다.
- 화면 문장은 `src/copy/record-list.ts`에 있고, 기준은 [../docs/v4/features/copy.md](../docs/v4/features/copy.md)의 "지난 기록" 표다.

## 테스트

```bash
npm test
```

```bash
npx tsc --noEmit
```

CI(`.github/workflows/test.yml`의 `mobile` job)도 `npm ci`, `tsc`, `jest`를 같은 순서로 돌린다.

Jest는 서울 시간대로 돈다(`test-utils/timezone.js`). 화면이 날짜를 기기 시간대로 적기 때문에, 어디서 돌려도 같은 값이 나오게 고정했다.

화면 테스트(`.tsx`)는 시작하기 전에 React Native 화면 부품을 미리 불러 둔다(`test-utils/warm-up.ts`). `react-native`는 부품을 처음 쓰일 때에야 불러와서, 미리 불러 두지 않으면 그 시간(Jest 캐시가 없는 CI에서 4~5초)이 파일의 첫 테스트에 얹혀 5초 제한을 넘긴다. 화면이 `react-native`에서 새 부품을 가져다 쓰면 그 파일의 `WARMED` 목록에 더한다. 빠뜨리면 `__tests__/warm-up.test.ts`가 실패한다.

## 화면 확인 (폰이 없을 때)

폰이나 시뮬레이터가 없는 곳(클라우드 세션 등)에서는 앱을 웹 번들로 만들어 폰 크기 스크린샷을 찍는다.

```bash
npm run screenshot
```

`tools/screenshot.mjs`가 `expo export --platform web`으로 임시 폴더에 웹 번들을 만들고, 127.0.0.1에서만 잠깐 띄운 뒤, Playwright(Chromium)로 iPhone(390×844)과 Android(412×915) 크기 화면을 찍어 `../docs/screenshots/v4/`에 저장한다. 끝나면 임시 폴더를 지운다.

찍는 화면은 스크립트의 `FLOWS`에 있다. 한 흐름은 화면을 순서대로 눌러 가며 여러 장을 찍고, 파일 이름은 `<흐름>-<단계>-<기기>.png`다. `after-run`(입력 전 `1-before`, 체감 피로 선택 후 `2-picked`, 저장 후 `3-saved`, 수정을 누른 뒤 `4-edit`, 앱을 다시 열었을 때 `5-reopened`)과 `manual`(기록 직접 입력: 빈 화면 `1-empty`, 저장을 눌러 틀린 칸을 알릴 때 `2-errors`, 다 적은 뒤 `3-filled`, 저장한 뒤 그 기록의 체감 피로를 묻는 화면 `4-ask`), `list`(지난 기록: 목록 `1-list`, 지난 날짜로 적은 기록을 연 화면 `2-record`, 고치는 화면 `3-edit`, 지울지 묻는 화면 `4-delete`, 지운 뒤 목록 `5-deleted`)가 있다. 직접 입력 화면은 날짜 칸을 오늘로 채우므로, 언제 찍어도 같은 그림이 나오게 브라우저의 시계를 2026-11-13 오전 7:10(서울)에 세운다. 이 흐름은 피로, 저장, 수정, 취소 버튼의 누르는 영역이 44 이상인지도 잰다. `5-reopened`는 페이지를 새로 읽어 앱을 처음부터 다시 띄우고, 이미 저장한 기록을 다시 묻지 않는지 본다(웹 번들에서는 기기 저장소가 브라우저의 localStorage다). 흐름과 저장 폴더는 `--flow`, `--out`으로 바꾼다.

```bash
npm run screenshot -- --flow after-run --out /tmp/shots
```

- iPhone 크기에는 애플 건강 샘플, Android 크기에는 헬스 커넥트 샘플을 넣는다. 웹 번들에서만 주소의 `?health=apple_health`로 고른다(`App.tsx`).
- 날짜가 같게 찍히도록 브라우저를 한국어, 서울 시간대로 맞춘다.

- **이 웹 빌드는 확인용일 뿐이다. 어디에도 배포하지 않는다.** hoohaa.run과도 관계없다. 앱은 웹으로 내지 않는다.
- react-native-web으로 그린 근사치라 글꼴, 상태 표시줄, 안전 영역은 실제 폰과 다르다. 실제 화면은 개발 빌드로 기기나 시뮬레이터에서 본다.
- 웹 번들에 필요한 `react-dom`, `react-native-web`, `@expo/metro-runtime`은 이 확인용이라 devDependencies에 있다.
- Playwright와 Chromium은 의존성에 넣지 않았다. 없으면 따로 깐다(`npm i -g playwright && npx playwright install chromium`).
