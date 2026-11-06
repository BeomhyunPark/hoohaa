# hoohaa 폰 앱

iPhone과 Android를 한 코드로 만드는 Expo(SDK 58) · React Native · TypeScript(strict) 앱이다. 지금은 "hoohaa" 글자 하나만 있는 빈 화면이다. 웹(hoohaa.run)과는 따로 돌고, 웹 파일을 불러오지 않는다.

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

## 테스트

```bash
npm test
```

```bash
npx tsc --noEmit
```

CI(`.github/workflows/test.yml`의 `mobile` job)도 `npm ci`, `tsc`, `jest`를 같은 순서로 돌린다.
