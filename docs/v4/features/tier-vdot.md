# 티어와 VDOT

목록은 [../index.md](../index.md)다. Jev를 호출하지 않는다.

## 하는 일

**결정.** hoohaa.run의 VDOT·티어 계산은 그대로 둔다. 결과를 공유 카드와 Jev의 상태에 넣는다.

목표가 있으면 목표 기록의 VDOT도 코드가 계산한다. [goal.md](goal.md)의 상태는 그 숫자를 받는다. 훈련 페이스 E·M·T·I·R도 여기서 나온다. [tomorrow.md](tomorrow.md)가 문장에 끼운다.

## 하지 않는 일

티어 구간, 상위 %, 페이스 공식을 Jev에게 묻지 않는다. 웹앱의 계산을 이 작업에서 바꾸지 않는다.

## 지금 hoohaa

계산은 `src/engine/tier.js`와 `src/engine/data.js`에 있다. 표의 상한은 VDOT 85다. 훈련 페이스 설명은 `src/editor/workout.js`에 있다.

## 결정

계산 코드는 하나만 둔다. 웹용과 앱용으로 복사하지 않는다.

## 제안

공통 패키지에 두거나, 앱이 `src/engine/tier.js`와 `data.js`를 직접 가져다 쓴다. 어느 쪽인지는 아직 정하지 않았다. [../platforms.md](../platforms.md)를 본다.

## 아직 정할 내용

그 코드를 어느 경로에 두고, 웹과 앱이 어떻게 가져다 쓸지.
