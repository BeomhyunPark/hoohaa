# v4 색인

작업을 시작하기 전에 이 목록을 본다. 이 파일과, 지금 손대는 기능 문서 하나만 연다. 공통 규칙이 필요하면 [center.md](center.md)를 더 연다. Jev를 호출할 때만 [engine.md](engine.md)를, 판단 보류를 다룰 때만 [withhold.md](withhold.md)를 연다.

그 문서에서 정해야 할 내용이 남아 있으면 그 기능은 만들지 않는다. 결정, 말한 것, 제안의 뜻은 [center.md](center.md)에 있다.

## 중심

| 파일 | 내용 |
|---|---|
| [center.md](center.md) | 모든 기능이 지키는 결정 |
| [engine.md](engine.md) | Jev 호출, 모델, 질문 타입 |
| [withhold.md](withhold.md) | 판단 보류 |
| [parked.md](parked.md) | 기능 문서로 올리지 않은 제안 |
| [platforms.md](platforms.md) | 웹, 스토어, 워치를 어떻게 나눌지 |
| [az.md](az.md) | 처음부터 끝까지 해야 할 일 |
| [next.md](next.md) | 다음에 볼 범위. 서버 없이 건강 기록을 읽고 체감 피로를 묻는 곳까지 |

## 기능

말한 순서다. 한 번에 기능 하나만 만든다.

| 순서 | 파일 | 누가 | 내용 |
|---|---|---|---|
| 1 | [features/health-import.md](features/health-import.md) | 우리 | 건강 앱 공유, 경로, 기록, 로그인 |
| 2 | [features/condition.md](features/condition.md) | Jev | 오늘의 컨디션 |
| 3 | [features/goal.md](features/goal.md) | Jev | 목표 달성 |
| 4 | [features/tomorrow.md](features/tomorrow.md) | Jev | 내일 훈련 |
| 5 | [features/runner-type.md](features/runner-type.md) | 우리 | 러너 유형 |
| 6 | [features/photo.md](features/photo.md) | 우리 | 사진 편집, 경로를 카드에 그리기 |
| 7 | [features/tier-vdot.md](features/tier-vdot.md) | 우리 | 티어, VDOT, 훈련 페이스 숫자 |
| 8 | [features/copy.md](features/copy.md) | 우리 | 화면에 나오는 문장 |
| 후순위 | [features/live-pace.md](features/live-pace.md) | Jev | 달리는 중 페이스 |

운동이 끝난 뒤의 컨디션, 목표, 내일 훈련은 Jev 호출 한 번으로 묻는다. 정한 내용은 [engine.md](engine.md)에 있다. 러너 유형, 달리는 중 페이스, 사진은 그 호출에 넣지 않는다.
