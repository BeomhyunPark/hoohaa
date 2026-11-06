---
title: "건강 앱 원본은 라이브러리 타입 정의보다 실제로 값을 만드는 네이티브 코드를 따르고, 이름 없는 항목은 원본 경로로 extra에 남긴다"
author: Claude
date: 2026-11-06
branch: claude/youthful-ritchie-2irwoi
cost: { minutes: 9, tokens: 167632 }
id: l-ff63e50d
scope: repo
status: active
src: agent
touches:
  - mobile/src/record/types.ts
  - mobile/src/record/fields.ts
  - mobile/src/record/apple-health.ts
  - mobile/src/record/health-connect.ts
  - mobile/src/record/fixtures/apple-health-run.ts
  - mobile/src/record/fixtures/health-connect-run.ts
  - mobile/src/record/health-reader.ts
  - mobile/__tests__/record-helpers.ts
  - mobile/__tests__/record-apple-health.test.ts
  - mobile/__tests__/record-health-connect.test.ts
---

## Decided
- 샘플 원본 모양은 @kingstinct/react-native-healthkit 16.2.0과 react-native-health-connect 4.1.3을 기준으로 했다. 두 라이브러리는 설치하지 않고 npm pack으로 받아 타입과 네이티브 코드를 읽었다.
- 변환은 원본을 경로마다 펼친 뒤 이름 있는 항목만 꺼내고 나머지를 전부 extra(원본 경로 → 값)로 넘긴다. 변환 함수가 모르는 항목이 생겨도 버려지지 않게 하려고 이렇게 했다.
- 가져온 곳·기록 번호·가져온 시각 이름(origin.source, sourceRecordId, importedAt)은 제안일 뿐이고 사용자 확인 전이다.

## Watch out
- react-native-health-connect의 .d.ts와 실제 값(Kotlin)이 다르다: 길이는 {value, unit}가 아니라 {inMeters, inKilometers, inMiles, inInches, inFeet}, exerciseRoute.type은 숫자가 아니라 "DATA" 같은 글자, metadata에 manufacturer·model이 한 번 더 있다. 값이 없는 길이는 0으로 채워진다.
- healthkit 라이브러리는 totalDistance 단위를 "m"이 아니라 "meters"로 준다.
- Jest는 __tests__ 안의 파일을 모두 테스트로 돌린다. 테스트 도우미는 mobile/test-utils/에 둔다.

In the code: mobile/src/record/fields.ts (FieldTaker), apple-health.ts, health-connect.ts, fixtures/*.ts 위 주석, mobile/test-utils/record.ts (expectEveryFieldKept)
