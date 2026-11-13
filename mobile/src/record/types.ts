// 운동 기록 하나의 모양. docs/v4/az.md H절: 어디서 가져왔는지, 측정된 운동 데이터,
// 사용자가 직접 넣은 데이터, 운동 경로. 기록을 해석하지 않는다(티어, 컨디션, 통증은 여기 없다).
//
// 가져온 곳·기록 번호·가져온 시각의 이름(source, sourceRecordId, importedAt)은
// docs/v4/features/health-import.md "아직 정할 내용"에 대한 제안이다. 사용자가 확인하기 전까지 결정이 아니다.

/** 원본의 값 하나. 객체와 배열은 펼쳐서 경로마다 하나씩 둔다(extra 참고). */
export type RawValue = string | number | boolean | null;

/** 어디서 가져왔는지. */
export type RecordSource = 'apple_health' | 'health_connect' | 'manual';

export interface RecordOrigin {
  source: RecordSource;
  /**
   * 그곳의 기록 번호. 애플 건강은 HKWorkout uuid, 헬스 커넥트는 ExerciseSessionRecord metadata.id.
   * 직접 입력은 바깥 번호가 없다. 앱이 번호를 만들어 붙이기로 했다(docs/v4/features/health-import.md의 결정).
   * 직접 입력을 만들 때 번호를 붙이고 이 타입에서 null을 뺀다. 그때까지는 null이 남아 있다.
   */
  sourceRecordId: string | null;
  /** 이 앱이 읽어 온 시각(ISO 8601, UTC). 원본의 시각이 아니다. */
  importedAt: string;
}

export interface HeartRateSample {
  /** ISO 8601 */
  time: string;
  bpm: number;
}

export interface HeartRate {
  /** 건강 앱이 준 값이 있으면 그 값, 없으면 samples의 단순 평균(시간 가중 아님). */
  averageBpm: number | null;
  maxBpm: number | null;
  minBpm: number | null;
  samples: HeartRateSample[];
}

/** 측정된 운동 데이터 중 이름을 붙인 것. 단위는 이름에 있다. 나머지 항목은 WorkoutRecord.extra에 있다. */
export interface MeasuredData {
  /** 플랫폼의 운동 종류 번호 그대로(애플 HKWorkoutActivityType, 헬스 커넥트 ExerciseType). 바꾸지 않는다. */
  activityTypeCode: number | null;
  /** ISO 8601 */
  startTime: string;
  /** ISO 8601 */
  endTime: string;
  /**
   * 움직인 시간. 멈춘 시간은 들어가지 않는다. 애플은 HKWorkout duration 그대로,
   * 헬스 커넥트는 시간 항목이 없어 (끝 − 시작)에서 PAUSE 구간(segments)을 뺀 값이다.
   * 기록을 쓴 앱이 PAUSE 구간을 남기지 않았으면 헬스 커넥트 쪽은 멈춘 시간을 알 수 없어 끝 − 시작 그대로다.
   */
  durationSeconds: number | null;
  distanceMeters: number | null;
  energyKcal: number | null;
  heartRate: HeartRate | null;
}

/** 사용자가 직접 넣은 데이터. 건강 앱에서 가져온 직후에는 둘 다 비어 있다. */
export interface UserInput {
  /** 체감 피로 1~10. 아직 묻지 않았으면 null. */
  perceivedExertion: number | null;
  /** 선택 메모. 없으면 null. */
  memo: string | null;
}

export interface RoutePoint {
  /** ISO 8601 */
  time: string;
  latitude: number;
  longitude: number;
  altitudeMeters: number | null;
  horizontalAccuracyMeters: number | null;
  verticalAccuracyMeters: number | null;
  /** 아래 셋은 애플 건강에만 있다. 헬스 커넥트는 null. */
  speedMetersPerSecond: number | null;
  speedAccuracyMetersPerSecond: number | null;
  courseDegrees: number | null;
  /** 바로 앞 점에서 온 거리. 애플 건강(라이브러리가 계산)에만 있다. */
  distanceFromPreviousMeters: number | null;
}

export interface WorkoutRecord {
  origin: RecordOrigin;
  measured: MeasuredData;
  userInput: UserInput;
  /** 운동 경로. 원본에 경로가 없으면 null. */
  route: RoutePoint[] | null;
  /**
   * 원본에 있었지만 위에 이름이 없는 항목 전부. 키는 원본의 경로(예: "workout.metadata.HKIndoorWorkout"),
   * 값은 원본 그대로다. "그 운동에 들어 있는 항목은 빠짐없이 가져온다"는 결정 때문에 버리지 않고 여기에 둔다.
   */
  extra: Record<string, RawValue>;
}
