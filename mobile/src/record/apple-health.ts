// 애플 건강(HealthKit) 원본 → 운동 기록.
//
// 원본 모양은 @kingstinct/react-native-healthkit 16.2.0의 반환값을 따른다
// (src/types/Workouts.ts, @react-native-healthkit/core src/types/Shared.ts, ios/WorkoutProxy.swift).
// 운동 하나를 읽으면 네 가지가 나온다.
//   workout            queryWorkoutSamples()의 WorkoutProxy.toJSON()  (HKWorkout)
//   routes             workout.getWorkoutRoutes()                       (HKWorkoutRoute의 CLLocation들)
//   statistics         workout.getAllStatistics()                       (그 운동 시간대의 HKStatistics, 타입 식별자별)
//   heartRateSamples   queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', { filter: { workout } })
// 라이브러리는 날짜를 JS Date로 준다. 읽는 쪽에서 toISOString()으로 바꿔 넘긴다(그래서 여기 타입은 string).
import { FieldTaker } from './fields';
import type { HeartRate, RoutePoint, WorkoutRecord } from './types';

export interface HKQuantity {
  unit: string;
  quantity: number;
}

export interface HKSampleType {
  identifier: string;
  allowsRecalibrationForEstimates: boolean;
  isMinimumDurationRestricted: boolean;
  isMaximumDurationRestricted: boolean;
}

export interface HKSourceRevision {
  source: { name: string; bundleIdentifier: string };
  version?: string;
  operatingSystemVersion: string;
  productType?: string;
}

export interface HKDevice {
  name?: string;
  firmwareVersion?: string;
  hardwareVersion?: string;
  localIdentifier?: string;
  manufacturer?: string;
  model?: string;
  softwareVersion?: string;
  udiDeviceIdentifier?: string;
}

/** 메타데이터 값. 수량은 { unit, quantity }로 온다. */
export type HKMetadata = Record<string, string | number | boolean | HKQuantity>;

export interface HKBaseSample {
  uuid: string;
  sourceRevision: HKSourceRevision;
  device?: HKDevice;
  metadata: HKMetadata;
  sampleType: HKSampleType;
  startDate: string;
  endDate: string;
  hasUndeterminedDuration: boolean;
}

export interface HKWorkoutEvent {
  /** WorkoutEventType: 1 pause, 2 resume, 3 lap, 4 marker, 7 segment … */
  type: number;
  startDate: string;
  endDate: string;
  metadata?: HKMetadata;
}

export interface HKWorkoutActivity {
  startDate: string;
  endDate: string;
  uuid: string;
  /** 초 */
  duration: number;
  activityType: number;
}

export interface HKWorkout extends HKBaseSample {
  /** WorkoutActivityType. running = 37 */
  workoutActivityType: number;
  /** unit "s" */
  duration: HKQuantity;
  /** unit "kcal" */
  totalEnergyBurned?: HKQuantity;
  /** unit "meters"(라이브러리가 이 글자로 준다) */
  totalDistance?: HKQuantity;
  totalSwimmingStrokeCount?: HKQuantity;
  totalFlightsClimbed?: HKQuantity;
  events?: HKWorkoutEvent[];
  activities?: HKWorkoutActivity[];
}

export interface HKWorkoutRouteLocation {
  /** 미터 */
  altitude: number;
  /** 도(0~360), 모르면 -1 */
  course: number;
  date: string;
  /** 앞 점에서 온 거리, 미터(라이브러리가 계산) */
  distance?: number;
  /** 미터 */
  horizontalAccuracy: number;
  latitude: number;
  longitude: number;
  /** m/s, 모르면 -1 */
  speed: number;
  speedAccuracy: number;
  /** 미터 */
  verticalAccuracy: number;
}

export interface HKWorkoutRoute {
  locations: HKWorkoutRouteLocation[];
  HKMetadataKeySyncIdentifier?: string;
  HKMetadataKeySyncVersion?: number;
}

export interface HKStatistics {
  averageQuantity?: HKQuantity;
  maximumQuantity?: HKQuantity;
  minimumQuantity?: HKQuantity;
  sumQuantity?: HKQuantity;
  mostRecentQuantity?: HKQuantity;
  mostRecentQuantityDateInterval?: { from: string; to: string };
  duration?: HKQuantity;
  startDate?: string;
  endDate?: string;
  sources: { name: string; bundleIdentifier: string }[];
}

export interface HKQuantitySample extends HKBaseSample {
  quantityType: string;
  quantity: number;
  unit: string;
}

export interface AppleHealthWorkoutRaw {
  workout: HKWorkout;
  routes: HKWorkoutRoute[];
  statistics: Record<string, HKStatistics>;
  heartRateSamples: HKQuantitySample[];
}

const HR = 'HKQuantityTypeIdentifierHeartRate';

function bpm(t: FieldTaker, path: string): number | null {
  // 심박은 "count/min"으로 온다. 다른 단위면 꺼내지 않는다(extra에 남는다).
  if (t.peek(`${path}.unit`) !== 'count/min') return null;
  const v = t.number(`${path}.quantity`);
  if (v !== null) t.take(`${path}.unit`);
  return v;
}

/** 애플 건강 원본 하나를 기록으로 바꾼다. importedAt은 읽은 시각(ISO 8601). */
export function appleHealthToRecord(raw: AppleHealthWorkoutRaw, importedAt: string): WorkoutRecord {
  const t = new FieldTaker(raw);

  const sourceRecordId = t.string('workout.uuid');
  const startTime = t.string('workout.startDate') ?? raw.workout.startDate;
  const endTime = t.string('workout.endDate') ?? raw.workout.endDate;

  let heartRate: HeartRate | null = null;
  const hrSamples = raw.heartRateSamples
    .map((s, i) => ({ s, i }))
    .filter(({ s }) => s.quantityType === HR && s.unit === 'count/min')
    .map(({ s, i }) => {
      const p = `heartRateSamples.${i}`;
      t.take(`${p}.quantityType`);
      t.take(`${p}.unit`);
      t.take(`${p}.quantity`);
      // 심박 표본은 순간 값이라 startDate와 endDate가 같다. 시각은 startDate로 둔다.
      t.take(`${p}.startDate`);
      if (s.endDate === s.startDate) t.take(`${p}.endDate`);
      return { time: s.startDate, bpm: s.quantity };
    });
  const hrStats = `statistics.${HR}`;
  if (hrSamples.length > 0 || raw.statistics[HR]) {
    const avg = bpm(t, `${hrStats}.averageQuantity`);
    heartRate = {
      averageBpm: avg ?? (hrSamples.length ? hrSamples.reduce((a, s) => a + s.bpm, 0) / hrSamples.length : null),
      maxBpm: bpm(t, `${hrStats}.maximumQuantity`),
      minBpm: bpm(t, `${hrStats}.minimumQuantity`),
      samples: hrSamples,
    };
  }

  let route: RoutePoint[] | null = null;
  if (raw.routes.length > 0) {
    route = [];
    raw.routes.forEach((r, ri) => {
      r.locations.forEach((_, li) => {
        const p = `routes.${ri}.locations.${li}`;
        route!.push({
          time: t.string(`${p}.date`) ?? '',
          latitude: t.number(`${p}.latitude`) ?? NaN,
          longitude: t.number(`${p}.longitude`) ?? NaN,
          altitudeMeters: t.number(`${p}.altitude`),
          horizontalAccuracyMeters: t.number(`${p}.horizontalAccuracy`),
          verticalAccuracyMeters: t.number(`${p}.verticalAccuracy`),
          // CoreLocation은 모르는 값을 -1로 준다. 원본 그대로 둔다(해석하지 않는다).
          speedMetersPerSecond: t.number(`${p}.speed`),
          speedAccuracyMetersPerSecond: t.number(`${p}.speedAccuracy`),
          courseDegrees: t.number(`${p}.course`),
          distanceFromPreviousMeters: t.number(`${p}.distance`),
        });
      });
    });
  }

  return {
    origin: { source: 'apple_health', sourceRecordId, importedAt },
    measured: {
      activityTypeCode: t.number('workout.workoutActivityType'),
      startTime,
      endTime,
      durationSeconds: t.seconds('workout.duration'),
      distanceMeters: t.meters('workout.totalDistance'),
      energyKcal: t.kcal('workout.totalEnergyBurned'),
      heartRate,
    },
    userInput: { perceivedExertion: null, memo: null },
    route,
    extra: t.rest(),
  };
}
