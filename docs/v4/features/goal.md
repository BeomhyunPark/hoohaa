# 목표 달성

색인 [../index.md](../index.md). Jev choice. 보류는 [../withhold.md](../withhold.md).

## 하는 일

**말한 것.** 목표 대회와 목표 기록을 넣으면, 현재 VDOT와 최근 훈련량으로 {달성 유력, 가능, 어려움}의 확률을 보여 준다. 확률을 올리는 훈련 제안 1~2개를 붙인다.

VDOT와 훈련량은 코드가 계산해 상태에 넣는다. [tier-vdot.md](tier-vdot.md)를 본다. 제안 문장은 [copy.md](copy.md)와 [tomorrow.md](tomorrow.md)의 메뉴를 쓴다.

## 하지 않는 일

목표 기록에 필요한 VDOT를 Jev가 계산하지 않는다. score로 바꿀지는 결정이 아니다.

## 도식

```mermaid
flowchart TD
  goal["목표 대회와 목표 기록"] --> math["코드가 VDOT와 최근 훈련량을 계산"]
  runs["최근 기록"] --> math
  math --> jev["Jev choice"]
  jev --> p["달성 유력 / 가능 / 어려움 의 확률"]
  p --> gate{"확신도가 낮은가"}
  gate -->|낮다| hold["판단 보류"]
  gate -->|아니다| show["확률과, 메뉴에서 고른 제안 1~2개"]
```

## 제안

세 갈래를 순서로 보고 score를 쓸 수 있다. 쓰기 전에는 이 파일에서 choice를 score로 바꾼다.

## 빈 칸

목표 대회를 어떤 항목으로 받는지. 최근 훈련량의 기간. 보류 기준 숫자.
