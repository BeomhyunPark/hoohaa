# V. v4 첫 단계: 건강 앱 모양의 기록과 체감 피로 화면

프롬프트 하나 = 세션 하나 = PR 하나. `---` 사이를 통째로 복사해서 붙여 넣는다.

범위는 [../v4/next.md](../v4/next.md)다. 건강 앱이 넣어 준 것과 같은 모양의 기록 하나를 넣고, 체감 피로 1~10과 선택 메모를 받는 화면까지. 실제 건강 앱 읽기, 로그인, 서버, 판단 규칙은 없다.

V1 → V2 → V3 → V4 → V5 → V6 차례대로 한다. 모두 `mobile/`을 고치므로 동시에 돌리지 않는다. 세션마다 막히기 쉬운 곳을 하나씩만 두려고 잘게 나눴다.

| 세션 | 막히기 쉬운 곳 |
|---|---|
| V1 | Expo 설치와 CI |
| V2 | `mobile/` 밖의 웹 계산 코드 불러오기 |
| V3 | 건강 앱 원본 모양을 맞추기 |
| V4 | 화면과 입력 검사 |
| V5 | 기기 저장과 다시 묻지 않기 |
| V6 | 슬라이더와 화면 낭독기, 테마 색 |

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

---

## V6. 첫 화면을 확정한 시안대로 바꾸기

시안은 피그마 [03 폰 앱 시안](https://www.figma.com/design/bkGtGykbgz2q5pDsIQc8Ff?node-id=54-122)에 있다. 피그마를 못 보는 세션을 위해 그림 두 장을 저장소에 넣어 두었다.

- [상태 전부, 테마 볼트](../screenshots/v4/design/states-volt.png): iPhone 390×844와 Android 412×915로 입력 전, 피로 선택 후, 저장 후, 다시 들어온 기록, 수정 중, 심박이 없는 기록
- [디자인 노트](../screenshots/v4/design/notes.png): 색 변수와 역할, 대비 값, 글자 크기, 간격, 누르는 영역, 슬라이더 동작, 로고 규칙, 문장

이 프롬프트를 돌리면 4번의 새 문장과 자리 바꿈을 승인하는 것이 된다. 빼고 싶은 줄은 돌리기 전에 지운다.

시안은 기록 직접 입력과 지난 기록 목록이 들어오기 전에 그렸다. 그래서 그림에는 평균 케이던스 칸, "지난 기록"·"기록 직접 입력"·"기록 고치기"·"기록 지우기" 버튼, 직접 입력 화면, 목록 화면이 없다. 이것들은 프롬프트에 글로 정한 규칙대로 같은 색과 모양을 입힌다.

```
hoohaa(레포 BeomhyunPark/hoohaa)의 mobile/은 v4 폰 앱(Expo, React Native, TypeScript)이야. 운동이 끝난 뒤 첫 화면(V4)과 기기 저장(V5), 기록 직접 입력과 지난 기록 목록이 main에 있어. 이번에는 첫 화면의 모양을 확정한 피그마 시안대로 바꾸고, 나머지 두 화면에는 같은 색과 모양을 입혀 줘. 동작과 저장 형식은 그대로야.

먼저 읽을 것:
- mobile/README.md, mobile/App.tsx, mobile/src/screens/(AfterRunScreen, ManualEntryScreen, RecordListScreen), mobile/src/copy/(after-run, manual-entry, record-list), mobile/src/record/summary.ts
- mobile/__tests__/의 화면 테스트 셋(after-run-screen, manual-entry-screen, record-list-screen)과 App.test.tsx, copy-doc.test.ts, mobile/tools/screenshot.mjs
- docs/v4/features/copy.md의 "기록과 체감 피로", "기록 직접 입력", "지난 기록", docs/v4/center.md
- 시안 그림 docs/screenshots/v4/design/states-volt.png, docs/screenshots/v4/design/notes.png (시안은 직접 입력과 목록이 생기기 전에 그렸어. 그림에 없는 것은 아래 글대로 해)
- trail ask "폰 앱 첫 화면 시안" 으로 시안을 정할 때의 결정
- 피그마를 볼 수 있으면 https://www.figma.com/design/bkGtGykbgz2q5pDsIQc8Ff 의 "03 폰 앱 시안" 페이지에서 "3. 상태 전부 · 테마 볼트 (기본)"과 "4. 디자인 노트". 못 보면 위 그림과 아래 값으로 해.

할 일:
1. 색을 테마로 옮겨. mobile/src/theme/에 역할 이름으로 된 색 묶음을 두고, 화면은 색 값을 직접 쓰지 않아.
   - 테마는 볼트, 밤하늘, 노을 세 개야. 기본은 볼트. 어두운 화면만 있어.
   - 이번에는 기본 테마 하나로만 그려. 테마를 고르는 화면과 고른 값을 저장하는 일은 만들지 마. 나중에 테마를 바꿔 끼울 수 있게 화면이 테마를 한 곳에서 받도록만 해 둬.
   - 값(볼트 / 밤하늘 / 노을):
     bg #0D0D0B / #0A0F16 / #120E13
     surface #23231F / #1A2635 / #291F2B
     raised #383831 / #2B3B50 / #3E3141
     border #48483F / #3A4B62 / #4F4153
     borderStrong #77776C / #64768E / #847589
     textPrimary #F6F6F1 / #F4F6F8 / #F8F3F5
     textSecondary #C5C5BB / #B8C2CF / #CFC3CC
     textTertiary #A3A397 / #97A4B5 / #AFA0AB
     accent #C8F03C / #3DC8F5 / #FF5C8A
     onAccent #0D0D0B / #0A0F16 / #120E13
     success #3CCB7F (셋 다)
     danger #FF7B72 / #FF7B72 / #FF8A4C
     focus #FFFFFF (셋 다)
     onRpe #0D0D0B / #0A0F16 / #120E13
     rpe 1~10 볼트: #CFEC88 #D9DF6C #E3D14F #EDC130 #F5B004 #FC9F00 #FF8D00 #FF7A0F #FF6730 #FF5448
     rpe 1~10 밤하늘: #8EDEFE #8FD3FF #9BC6FF #AEB7FF #C2A7FF #D697F5 #E787DB #F578B9 #FD6C90 #FF645F
     rpe 1~10 노을: #FAD8AB #FDCA98 #FFBC89 #FFAC7E #FF9B77 #FF8A76 #FF797A #FF6781 #FA568C #F14499
   - 역할: accent는 저장 버튼에만. 피로 색(rpe)은 슬라이더, 고른 값 알약, 저장한 피로 값에만. 성공과 오류는 항상 아이콘이나 문장과 함께.
   - 테스트: 테마마다 글자색과 그 글자가 놓이는 면의 대비가 4.5:1 이상인지 계산해서 봐(textPrimary·textSecondary·textTertiary와 bg·surface, textTertiary와 raised, onAccent와 accent, onRpe와 rpe 각 단계, success와 bg).
2. 화면 구조를 시안대로 바꿔. 위에서부터:
   - "hoohaa" 글자(지금 그대로 두되 17 Bold, textPrimary). 로고는 아직 정하지 않았으니 이미지를 넣지 마.
   - 날짜 값(14 Medium, textSecondary, 라벨 없이)과 제목 "운동 기록"(24/32 Bold).
   - 기록 카드(surface, 테두리 border, 모서리 20, 안쪽 위 18·좌우 20·아래 20, 줄 사이 14): 윗줄에 "거리" 라벨(14 Medium, textSecondary)과 오른쪽에 가져온 곳 칩(raised, 12 Medium, textSecondary). 그 아래 거리 숫자를 크게(56/60 Bold, 자간 -2%) 쓰고 단위 km는 작게(20, textSecondary). 구분선(border). 그 아래 시간·평균 페이스·평균 심박을 같은 폭 칸으로(라벨 13 textTertiary, 값 20 Bold, 단위 13 textSecondary).
   - 값이 없는 항목은 지금처럼 칸째로 숨겨. 거리가 없으면 큰 숫자 줄과 구분선을 숨기고 남은 칸만 보여 줘.
   - 평균 케이던스는 시안에 없어. 시간·평균 페이스·평균 심박과 같은 모양의 칸으로 넣어. 칸이 넷이면 한 줄에 둘씩 두 줄로 놓아(줄 사이 14).
   - 가져온 곳 칩은 origin.source가 apple_health면 "애플 건강", health_connect면 "헬스 커넥트", manual이면 칩을 숨겨.
   - 체감 피로: 제목 "체감 피로"(20/28 Bold)와 그 오른쪽에 고르기 전에는 "밀거나 눌러서 골라요"(13, textTertiary), 고른 뒤에는 고른 숫자 알약(그 단계의 rpe 색 바탕, onRpe 글자 18 Bold). 그 아래 질문 "이번 달리기는 얼마나 힘들었어요?"(15/22, textSecondary). 그 아래 슬라이더(3번).
   - 메모: "메모"(15 Bold)와 "(선택)"(13, textTertiary), 입력칸(surface, 테두리 borderStrong, 모서리 14, 높이 64 이상, 글 16).
   - 화면 아래에 붙는 묶음(위 12, 사이 8, 안전 영역 위): 저장 버튼(높이 56, 모서리 16, 17 Bold. 누를 수 있으면 accent 바탕에 onAccent 글자, 아니면 raised 바탕에 textTertiary 글자). 피로를 고르기 전에는 버튼 위에 "체감 피로를 골라야 저장할 수 있어요."(13, textTertiary). 수정 중에는 저장 아래에 "취소"(테두리 버튼, 높이 52, 16 Bold).
   - 저장한 뒤와 다시 들어온 기록: 슬라이더와 입력칸 대신 저장한 값 카드(surface, 모서리 20). "체감 피로" 라벨과 오른쪽에 값(28 Bold, 그 단계의 rpe 색)과 "/ 10"(14, textTertiary). 그 아래 손잡이 없는 색 막대(높이 10). 메모가 있으면 구분선, "메모" 라벨, 메모 글(16/24). 아래 묶음에는 방금 저장했을 때만 체크 아이콘과 "저장했어요"(17 Bold, success), 그리고 "수정"(테두리 버튼, 높이 52).
   - "지난 기록"과 "기록 직접 입력"은 시안에 없어. 스크롤되는 내용의 맨 아래에 테두리 버튼 둘(높이 52, 16 Bold, 사이 8)로 두고, 지금처럼 고치는 중에는 숨겨. 아래에 붙는 묶음(저장, 수정)에 넣지 마.
   - 직접 입력한 기록의 "기록 고치기"와 "기록 지우기"도 시안에 없어. 저장한 값 카드 아래에 글자 버튼 둘(높이 44 이상, 15 Bold)로 두고, "기록 지우기"는 danger 색이야. 지우기 전에 묻는 말과 버튼, 실패 안내는 동작과 문장을 그대로 두고 색만 테마로 바꿔.
   - 화면 좌우 여백 20, 구역 사이 22. 상태 표시줄과 아래 안전 영역은 react-native-safe-area-context 값으로 비워. 상태 표시줄 글자는 밝게.
   - 읽는 중, 기록 없음, 읽기 실패, 저장 실패 화면은 동작과 문장을 그대로 두고 색만 테마로 바꿔(안내 글 16 textSecondary, "다시 읽기"는 테두리 버튼, 저장 실패는 danger 색 13과 아이콘).
3. 피로 버튼 10개를 슬라이더로 바꿔.
   - 1~10 정수에만 붙어. 처음에는 값이 없어: 손잡이가 없고 트랙이 흐리게(불투명도 45%) 보여. 트랙을 누르거나 끌면 그 자리의 값이 골라지고 손잡이(지름 32, textPrimary, 바깥에 bg 색 3 테두리)가 생겨.
   - 트랙은 10칸(칸 사이 2, 높이 14, 양 끝 둥글게)이고 칸마다 그 단계의 rpe 색이야. 고른 칸까지는 100%, 나머지는 25%.
   - 트랙 아래에 눈금 숫자 1~10(13, textTertiary, 고른 숫자만 textPrimary Bold)과 양 끝 글자 "아주 편했어요", "온 힘을 다했어요"(13, textSecondary). 눈금과 양 끝 글자는 표시용이야.
   - 누르는 영역은 전체 폭에 높이 44 이상(MIN_TOUCH를 그대로 써도 돼).
   - 화면 낭독기에는 조절할 수 있는 요소 하나로 보여 줘. 이름은 "체감 피로, 1부터 10까지", 값은 지금의 exertionButtonLabel과 같은 말("체감 피로 7", 양 끝은 뜻을 붙임), 힌트는 "1은 아주 편했을 때, 10은 온 힘을 다했을 때예요.". 올리기·내리기 동작으로 1씩 바뀌고, 값이 없을 때 올리면 1이 돼. 확인용 웹 번들에서도 슬라이더 역할로 나오게 해.
   - 새 네이티브 의존성은 넣지 마(개발 빌드를 다시 만들어야 해). React Native에 있는 것으로 만들어. 꼭 넣어야 하면 이유를 PR 본문에 적어.
4. 문장: copy.md "기록과 체감 피로" 표에 결정된 문장은 바꾸지 마. 아래만 after-run.ts와 그 표에 같이 더하거나 고쳐(사용자가 승인한 것).
   - 새 문장 "밀거나 눌러서 골라요" (자리: 체감 피로를 고르기 전 안내)
   - 새 문장 "애플 건강", "헬스 커넥트" (자리: 기록을 가져온 곳)
   - 새 표기 "{숫자} / 10" (자리: 저장한 체감 피로 값)
   - "아주 편했어요", "온 힘을 다했어요"는 슬라이더 양 끝에 보이는 글자로도 쓴다고 표의 설명을 고쳐.
   - "1은 아주 편했을 때, 10은 온 힘을 다했을 때예요."는 화면에 보이지 않고 슬라이더의 낭독기 힌트로 쓴다고 표의 설명을 고쳐.
   - "기록 항목 | 날짜"는 화면에 라벨로 보이지 않고 낭독기 이름에만 쓴다고 적어.
   - 표의 "버튼 묶음", "버튼 이름" 설명은 슬라이더에 맞게 고쳐. 문장 자체는 그대로야.
5. 직접 입력 화면과 지난 기록 목록 화면은 시안이 없어. 구조, 동작, 문장, 검사 규칙을 그대로 두고 색과 모양만 맞춰.
   - 바탕 bg, 제목 24/32 Bold, 구역 제목 20/28 Bold, 라벨 14 Medium textSecondary, 안내 13 textTertiary.
   - 입력칸은 메모 입력칸과 같은 모양(surface, 테두리 borderStrong, 모서리 14, 글 16, 높이 52 이상). 틀린 칸은 테두리와 이유 글자를 danger로 하고 이유 글자 앞에 아이콘을 붙여.
   - 목록의 한 줄은 기록 카드와 같은 면(surface, 테두리 border, 모서리 20)이고 누르는 영역은 44 이상이야. 값은 textPrimary, 라벨과 날짜는 textSecondary.
   - 주요 버튼(저장)은 accent, 그 밖의 버튼은 테두리 버튼이야. 화면마다 accent 버튼은 하나만 둬.
6. 테스트를 화면에 맞게 고쳐. 지켜야 하는 동작은 그대로야: 피로를 고르지 않으면 저장이 안 된다, 메모 없이도 저장된다, 저장한 값이 기록에 붙는다, 값이 없는 항목은 화면에 안 나온다, 수정과 취소, 다시 들어온 기록은 다시 묻지 않는다, "저장했어요"는 방금 저장했을 때만 보인다, 깨진 저장값, 컨디션·목표·내일 훈련·통증 판단은 보여 주지 않는다. 버튼 10개를 보던 테스트는 슬라이더로 바꿔: 값이 없다가 고르면 그 값 하나가 된다, 올리기·내리기로 1씩 바뀌고 1과 10을 넘지 않는다, 낭독기 이름·값·힌트, 누르는 영역 44 이상.
   직접 입력 화면과 목록 화면의 테스트는 동작을 보는 것이라 그대로 통과해야 해.
7. mobile/tools/의 스크립트로 iPhone(390×844)과 Android(412×915) 크기에서 입력 전, 피로 선택 후, 저장 후, 다시 들어온 기록, 수정 중, 심박이 없는 기록을 찍어 docs/screenshots/v4/에 넣고 PR 본문에 붙여. 직접 입력 화면과 목록 화면의 스크린샷도 다시 찍어. 예전 흰 바탕 스크린샷은 새것으로 바꿔. docs/screenshots/v4/design/의 시안 그림은 그대로 둬.
8. mobile/README.md의 "운동이 끝난 뒤 첫 화면"에 테마(역할 이름, 기본 볼트, 고르기는 아직 없음)와 슬라이더를 짧게 적어.

하지 말 것:
- 테마 고르는 화면, 밝은 화면, 로고 이미지, 앱 아이콘 바꾸기.
- 글꼴 파일 추가. 이번에는 시스템 글꼴 그대로 쓰고 숫자만 폭이 같은 숫자로 해. Pretendard를 넣을지는 PR 본문에 물어볼 거리로 남겨.
- 저장 형식과 저장소 인터페이스, 기록 타입, 가짜 건강 앱, 직접 입력의 검사 규칙, 화면 사이를 오가는 흐름 바꾸기. 실제 건강 앱 읽기, 로그인, 서버 호출.
- 컨디션, 목표, 내일 훈련, 통증 판단, 티어 넣기.
- 웹(루트의 html, src/, sw.js, icons/) 고치기.

규칙:
- 화면 문장은 한국어 해요체. 진단처럼 보이는 말은 쓰지 마.
- 시안과 다르게 만든 곳이 있으면 무엇을 왜 다르게 했는지 PR 본문에 적어.
- mobile/에서 npx tsc --noEmit와 npm test, 웹 쪽 node tools/test.mjs와 node tools/check-sw.mjs가 통과해야 해. 커밋 전에 trail check를 돌려.
```
