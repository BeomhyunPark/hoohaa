// 애플 건강 샘플: 애플 워치로 잰 5km 야외 러닝 하나(2026-11-06 06:30 서울).
//
// 기준: @kingstinct/react-native-healthkit 16.2.0이 돌려주는 모양.
//   - workout: WorkoutProxy.toJSON() (src/types/Workouts.ts WorkoutSample, ios/WorkoutProxy.swift).
//     duration은 unit "s", totalDistance는 unit "meters", totalEnergyBurned는 unit "kcal"로 온다.
//     workoutActivityType 37 = running, events type 1 = pause, 2 = resume.
//     metadata 키는 HealthKit HKMetadataKey 이름(HKIndoorWorkout, HKElevationAscended …)이고, 수량은 { unit, quantity }.
//   - routes: workout.getWorkoutRoutes(). locations는 CLLocation(위도·경도 도, altitude·accuracy 미터, speed m/s,
//     course 도)과 라이브러리가 앞 점에서 계산한 distance(미터).
//   - statistics: workout.getAllStatistics(). 키는 HKQuantityTypeIdentifier, 심박 단위는 "count/min".
//   - heartRateSamples: queryQuantitySamples('HKQuantityTypeIdentifierHeartRate', { filter: { workout } }).
//   HealthKit 문서: HKWorkout, HKWorkoutRoute, HKQuantitySample, HKMetadataKey (developer.apple.com/documentation/healthkit).
// 라이브러리는 날짜를 JS Date로 준다. 여기서는 toISOString()한 글자로 적었다.
// 값은 지어낸 것이다. 실제 기기에서 읽은 값과 한 번 비교해 봐야 한다(개발 빌드가 있는 폰이 생기면).
import type { AppleHealthWorkoutRaw, HKSourceRevision, HKDevice } from '../apple-health';

const watchSource: HKSourceRevision = {
  source: { name: 'Apple Watch', bundleIdentifier: 'com.apple.health.5C7E1A2B-3D4F-4A6B-8C9D-0E1F2A3B4C5D' },
  version: '11.1',
  operatingSystemVersion: '11.1.0',
  productType: 'Watch7,3',
};

const watch: HKDevice = {
  name: 'Apple Watch',
  manufacturer: 'Apple Inc.',
  model: 'Watch',
  hardwareVersion: 'Watch7,3',
  softwareVersion: '11.1',
};

const heartRateSampleType = {
  identifier: 'HKQuantityTypeIdentifierHeartRate',
  allowsRecalibrationForEstimates: false,
  isMinimumDurationRestricted: false,
  isMaximumDurationRestricted: false,
};

function hr(uuid: string, date: string, quantity: number): AppleHealthWorkoutRaw['heartRateSamples'][number] {
  return {
    uuid,
    sourceRevision: watchSource,
    device: watch,
    metadata: { HKMetadataKeyHeartRateMotionContext: 2 },
    sampleType: heartRateSampleType,
    startDate: date,
    endDate: date,
    hasUndeterminedDuration: false,
    quantityType: 'HKQuantityTypeIdentifierHeartRate',
    quantity,
    unit: 'count/min',
  };
}

export const appleHealthRun: AppleHealthWorkoutRaw = {
  workout: {
    uuid: '6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B',
    sourceRevision: watchSource,
    device: watch,
    metadata: {
      HKIndoorWorkout: false,
      HKTimeZone: 'Asia/Seoul',
      HKAverageMETs: { unit: 'kcal/hr·kg', quantity: 10.2 },
      HKElevationAscended: { unit: 'm', quantity: 21.4 },
      HKWeatherTemperature: { unit: 'degC', quantity: 9.5 },
      HKWeatherHumidity: { unit: '%', quantity: 0.68 },
    },
    sampleType: {
      identifier: 'HKWorkoutTypeIdentifier',
      allowsRecalibrationForEstimates: false,
      isMinimumDurationRestricted: false,
      isMaximumDurationRestricted: false,
    },
    startDate: '2026-11-05T21:30:00.000Z',
    endDate: '2026-11-05T21:59:32.400Z',
    hasUndeterminedDuration: false,
    workoutActivityType: 37,
    duration: { unit: 's', quantity: 1712.4 },
    totalEnergyBurned: { unit: 'kcal', quantity: 352.8 },
    totalDistance: { unit: 'meters', quantity: 5012.37 },
    events: [
      { type: 1, startDate: '2026-11-05T21:44:10.000Z', endDate: '2026-11-05T21:44:10.000Z' },
      { type: 2, startDate: '2026-11-05T21:45:10.000Z', endDate: '2026-11-05T21:45:10.000Z' },
    ],
    activities: [
      {
        uuid: 'A1B2C3D4-E5F6-4A7B-8C9D-0E1F2A3B4C5D',
        startDate: '2026-11-05T21:30:00.000Z',
        endDate: '2026-11-05T21:59:32.400Z',
        duration: 1712.4,
        activityType: 37,
      },
    ],
  },
  routes: [
    {
      HKMetadataKeySyncIdentifier: '9D8C7B6A-5F4E-4D3C-2B1A-0F9E8D7C6B5A',
      HKMetadataKeySyncVersion: 1,
      locations: [
        {
          date: '2026-11-05T21:30:00.000Z',
          latitude: 37.52834,
          longitude: 126.93412,
          altitude: 12.3,
          horizontalAccuracy: 4.7,
          verticalAccuracy: 3.2,
          speed: -1,
          speedAccuracy: -1,
          course: -1,
          distance: 0,
        },
        {
          date: '2026-11-05T21:30:01.000Z',
          latitude: 37.52837,
          longitude: 126.93415,
          altitude: 12.4,
          horizontalAccuracy: 4.1,
          verticalAccuracy: 3.0,
          speed: 2.91,
          speedAccuracy: 0.42,
          course: 38.5,
          distance: 4.27,
        },
        {
          date: '2026-11-05T21:30:02.000Z',
          latitude: 37.5284,
          longitude: 126.93418,
          altitude: 12.6,
          horizontalAccuracy: 3.9,
          verticalAccuracy: 2.9,
          speed: 2.95,
          speedAccuracy: 0.38,
          course: 39.1,
          distance: 4.27,
        },
      ],
    },
  ],
  statistics: {
    HKQuantityTypeIdentifierHeartRate: {
      averageQuantity: { unit: 'count/min', quantity: 156 },
      maximumQuantity: { unit: 'count/min', quantity: 174 },
      minimumQuantity: { unit: 'count/min', quantity: 98 },
      mostRecentQuantity: { unit: 'count/min', quantity: 168 },
      mostRecentQuantityDateInterval: { from: '2026-11-05T21:59:30.000Z', to: '2026-11-05T21:59:30.000Z' },
      startDate: '2026-11-05T21:30:00.000Z',
      endDate: '2026-11-05T21:59:32.400Z',
      sources: [watchSource.source],
    },
    HKQuantityTypeIdentifierDistanceWalkingRunning: {
      sumQuantity: { unit: 'm', quantity: 5012.37 },
      startDate: '2026-11-05T21:30:00.000Z',
      endDate: '2026-11-05T21:59:32.400Z',
      sources: [watchSource.source],
    },
    HKQuantityTypeIdentifierActiveEnergyBurned: {
      sumQuantity: { unit: 'kcal', quantity: 352.8 },
      startDate: '2026-11-05T21:30:00.000Z',
      endDate: '2026-11-05T21:59:32.400Z',
      sources: [watchSource.source],
    },
    HKQuantityTypeIdentifierRunningPower: {
      averageQuantity: { unit: 'W', quantity: 238 },
      maximumQuantity: { unit: 'W', quantity: 311 },
      minimumQuantity: { unit: 'W', quantity: 142 },
      startDate: '2026-11-05T21:30:00.000Z',
      endDate: '2026-11-05T21:59:32.400Z',
      sources: [watchSource.source],
    },
  },
  heartRateSamples: [
    hr('0A1B2C3D-0001-4000-8000-000000000001', '2026-11-05T21:30:05.000Z', 98),
    hr('0A1B2C3D-0002-4000-8000-000000000002', '2026-11-05T21:40:05.000Z', 154),
    hr('0A1B2C3D-0003-4000-8000-000000000003', '2026-11-05T21:50:05.000Z', 162),
    hr('0A1B2C3D-0004-4000-8000-000000000004', '2026-11-05T21:59:30.000Z', 168),
  ],
};
