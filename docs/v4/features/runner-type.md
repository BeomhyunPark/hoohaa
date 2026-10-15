# 러너 유형

색인 [../index.md](../index.md). Jev choice. 보류는 [../withhold.md](../withhold.md).

## 하는 일

**말한 것.** 기록 패턴으로 유형을 붙이고 티어 공유 카드에 같이 보여 준다. 예: 후반 뒷심형, 초반 폭주형, 꾸준형.

## 제안

공유 카드에 남으므로 확신도가 낮거나 기록이 적으면 칭호를 붙이지 않는다. 카드 합성은 [photo.md](photo.md)가 한다.

## 도식

```mermaid
flowchart TD
  pattern["기록 패턴"] --> jev["Jev choice"]
  jev --> title["유형별 확률"]
  title --> gate{"확신도가 낮은가"}
  gate -->|낮다| hold["칭호 없음"]
  gate -->|아니다| card["티어 공유 카드에 칭호"]
```

## 빈 칸

유형의 전체 목록. 기록 패턴이 스플릿인지, 구간 페이스인지, 여러 날의 기록인지. 칭호를 붙이기 전에 필요한 기록 수. 보류 기준 숫자.
