// 헬스 커넥트 원본 → 운동 기록.
//
// 원본 모양은 react-native-health-connect 4.1.3의 readRecords() 반환값을 따른다
// (lib/typescript/types/records.types.d.ts, base.types.d.ts, metadata.types.d.ts, 그리고 실제로 값을 만드는
// android/.../records/ReactExerciseSessionRecord.kt, ReactDistanceRecord.kt, ReactHeartRateRecord.kt,
// utils/HealthConnectUtils.kt). 타입 정의와 실제 값이 다른 곳은 실제 값(Kotlin)을 따랐다:
//   - 길이는 { value, unit }가 아니라 { inMeters, inKilometers, inMiles, inInches, inFeet }로 온다(lengthToJsMap).
//   - exerciseRoute.type은 숫자가 아니라 "DATA" | "NO_DATA" | "CONSENT_REQUIRED" 글자로 온다.
//   - metadata에는 device 말고도 manufacturer, model이 한 번 더 들어 있다.
//   - 경로 점의 정확도·고도가 없으면 라이브러리가 0으로 채운다(lengthToJsMap(null)). 원본 그대로 둔다.
// 운동 하나를 읽으면 세 가지가 나온다.
//   session     readRecords('ExerciseSession', …).records의 하나(경로는 exerciseRoute에 들어 있다)
//   distance    그 세션 시간대의 readRecords('Distance', …).records
//   heartRate   그 세션 시간대의 readRecords('HeartRate', …).records
import { FieldTaker } from './fields';
import type { HeartRate, HeartRateSample, RoutePoint, WorkoutRecord } from './types';

export interface HCLengthResult {
  inMeters: number;
  inKilometers: number;
  inMiles: number;
  inInches: number;
  inFeet: number;
}

export interface HCZoneOffset {
  id: string;
  totalSeconds: number;
}

export interface HCMetadata {
  id?: string;
  clientRecordId?: string | null;
  clientRecordVersion?: number;
  /** 기록을 쓴 앱의 패키지 이름 */
  dataOrigin?: string;
  lastModifiedTime?: string;
  /** type: 0 unknown, 1 watch, 2 phone … */
  device?: { type?: number; manufacturer?: string | null; model?: string | null } | null;
  /** 0 unknown, 1 actively recorded, 2 automatically recorded, 3 manual entry */
  recordingMethod?: number;
  manufacturer?: string | null;
  model?: string | null;
}

export interface HCIntervalRecord {
  startTime: string;
  endTime: string;
  startZoneOffset?: HCZoneOffset | null;
  endZoneOffset?: HCZoneOffset | null;
  metadata?: HCMetadata;
}

export interface HCRouteLocation {
  time: string;
  latitude: number;
  longitude: number;
  horizontalAccuracy?: HCLengthResult;
  verticalAccuracy?: HCLengthResult;
  altitude?: HCLengthResult;
}

export interface HCExerciseSessionRecord extends HCIntervalRecord {
  /** ExerciseType. RUNNING = 56 */
  exerciseType: number;
  /** 원본 앱에서 붙인 제목·메모. 이 앱 사용자의 메모(userInput.memo)가 아니다. */
  title?: string | null;
  notes?: string | null;
  laps?: { startTime: string; endTime: string; length: HCLengthResult }[];
  segments?: { startTime: string; endTime: string; segmentType: number; repetitions: number }[];
  exerciseRoute?: { type?: 'DATA' | 'NO_DATA' | 'CONSENT_REQUIRED'; route: HCRouteLocation[] };
}

export interface HCDistanceRecord extends HCIntervalRecord {
  distance: HCLengthResult;
}

export interface HCHeartRateRecord extends HCIntervalRecord {
  samples: { time: string; beatsPerMinute: number }[];
}

export interface HealthConnectWorkoutRaw {
  session: HCExerciseSessionRecord;
  distance: HCDistanceRecord[];
  heartRate: HCHeartRateRecord[];
}

/** 헬스 커넥트 원본 하나를 기록으로 바꾼다. importedAt은 읽은 시각(ISO 8601). */
export function healthConnectToRecord(raw: HealthConnectWorkoutRaw, importedAt: string): WorkoutRecord {
  const t = new FieldTaker(raw);
  const s = raw.session;

  const sourceRecordId = t.string('session.metadata.id');
  const startTime = t.string('session.startTime') ?? s.startTime;
  const endTime = t.string('session.endTime') ?? s.endTime;
  const ms = Date.parse(endTime) - Date.parse(startTime);
  const durationSeconds = Number.isFinite(ms) ? ms / 1000 : null;

  // 거리: 세션 시간대의 Distance 기록을 더한다. 각 기록의 시각·출처는 extra에 남는다.
  let distanceMeters: number | null = null;
  for (let i = 0; i < raw.distance.length; i++) {
    const m = t.lengthResult(`distance.${i}.distance`);
    if (m !== null) distanceMeters = (distanceMeters ?? 0) + m;
  }

  const samples: HeartRateSample[] = [];
  raw.heartRate.forEach((r, ri) => {
    r.samples.forEach((_, si) => {
      const p = `heartRate.${ri}.samples.${si}`;
      const time = t.string(`${p}.time`);
      const v = t.number(`${p}.beatsPerMinute`);
      if (time !== null && v !== null) samples.push({ time, bpm: v });
    });
  });
  let heartRate: HeartRate | null = null;
  if (samples.length > 0) {
    const bpms = samples.map((x) => x.bpm);
    heartRate = {
      // 헬스 커넥트 기록에는 평균·최대·최소가 없어 표본에서 셈한다(단순 평균).
      averageBpm: bpms.reduce((a, b) => a + b, 0) / bpms.length,
      maxBpm: Math.max(...bpms),
      minBpm: Math.min(...bpms),
      samples,
    };
  }

  let route: RoutePoint[] | null = null;
  if (s.exerciseRoute && s.exerciseRoute.route.length > 0) {
    route = s.exerciseRoute.route.map((_, i) => {
      const p = `session.exerciseRoute.route.${i}`;
      return {
        time: t.string(`${p}.time`) ?? '',
        latitude: t.number(`${p}.latitude`) ?? NaN,
        longitude: t.number(`${p}.longitude`) ?? NaN,
        altitudeMeters: t.lengthResult(`${p}.altitude`),
        horizontalAccuracyMeters: t.lengthResult(`${p}.horizontalAccuracy`),
        verticalAccuracyMeters: t.lengthResult(`${p}.verticalAccuracy`),
        speedMetersPerSecond: null,
        speedAccuracyMetersPerSecond: null,
        courseDegrees: null,
        distanceFromPreviousMeters: null,
      };
    });
  }

  return {
    origin: { source: 'health_connect', sourceRecordId, importedAt },
    measured: {
      activityTypeCode: t.number('session.exerciseType'),
      startTime,
      endTime,
      durationSeconds,
      distanceMeters,
      energyKcal: null,
      heartRate,
    },
    userInput: { perceivedExertion: null, memo: null },
    route,
    extra: t.rest(),
  };
}
