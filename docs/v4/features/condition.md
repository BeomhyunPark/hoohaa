# 오늘의 컨디션

목록은 [../index.md](../index.md)다. Jev의 choice를 쓴다. 보류는 [../withhold.md](../withhold.md)다.

## 하는 일

**말한 것.** 최근 7~14일 기록과 오늘의 입력으로 {그대로 훈련, 강도 낮추기, 휴식} 중 하나와 각각의 확률을 보여 준다. 판단 신뢰도가 기준보다 낮으면 판단 보류로 처리한다.

## 하지 않는 일

코칭 문장은 Jev가 쓰지 않는다. 문장은 [copy.md](copy.md)에 있다. 이 판단의 결과를 내일 훈련의 입력으로 쓰지 않는다. [tomorrow.md](tomorrow.md)를 본다.

## 도식

```mermaid
flowchart TD
  rec["최근 7~14일 기록"] --> state["상태"]
  today["오늘 입력"] --> state
  state --> jev["Jev choice"]
  jev --> p["그대로 훈련 / 강도 낮추기 / 휴식 의 확률"]
  p --> gate{"확신도가 낮은가"}
  gate -->|낮다| hold["판단 보류"]
  gate -->|아니다| show["우리가 쓴 문장과 세 확률"]
```

## 제안

의료 조언이 아니라는 한 줄을 문장 옆에 둔다. 진단이 아니다.

## 아직 정할 내용

오늘의 입력이 무엇인지. 최근 7일과 14일 중 어느 기간을 쓸지. 판단 보류의 기준 숫자.

## 같이 볼 문서

기록 항목은 [health-import.md](health-import.md)다. 호출 방법은 [../engine.md](../engine.md)다.
