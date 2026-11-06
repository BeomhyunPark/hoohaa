import { appleHealthToRecord } from '../src/record/apple-health';
import type { AppleHealthWorkoutRaw } from '../src/record/apple-health';
import { appleHealthRun } from '../src/record/fixtures/apple-health-run';
import { expectEveryFieldKept, rec } from '../test-utils/record';
import type { FieldRule } from '../test-utils/record';

const importedAt = '2026-11-05T22:05:00.000Z';
const record = appleHealthToRecord(appleHealthRun, importedAt);

const routeKeys: Record<string, string> = {
  date: 'time',
  latitude: 'latitude',
  longitude: 'longitude',
  altitude: 'altitudeMeters',
  horizontalAccuracy: 'horizontalAccuracyMeters',
  verticalAccuracy: 'verticalAccuracyMeters',
  speed: 'speedMetersPerSecond',
  speedAccuracy: 'speedAccuracyMetersPerSecond',
  course: 'courseDegrees',
  distance: 'distanceFromPreviousMeters',
};

const hr = rec(record.measured.heartRate);

const rules: FieldRule[] = [
  [/^workout\.uuid$/, (v) => expect(record.origin.sourceRecordId).toBe(v)],
  [/^workout\.startDate$/, (v) => expect(record.measured.startTime).toBe(v)],
  [/^workout\.endDate$/, (v) => expect(record.measured.endTime).toBe(v)],
  [/^workout\.workoutActivityType$/, (v) => expect(record.measured.activityTypeCode).toBe(v)],
  [/^workout\.duration\.unit$/, (v) => expect(v).toBe('s')],
  [/^workout\.duration\.quantity$/, (v) => expect(record.measured.durationSeconds).toBe(v)],
  [/^workout\.totalDistance\.unit$/, (v) => expect(v).toBe('meters')],
  [/^workout\.totalDistance\.quantity$/, (v) => expect(record.measured.distanceMeters).toBe(v)],
  [/^workout\.totalEnergyBurned\.unit$/, (v) => expect(v).toBe('kcal')],
  [/^workout\.totalEnergyBurned\.quantity$/, (v) => expect(record.measured.energyKcal).toBe(v)],
  [/^statistics\.HKQuantityTypeIdentifierHeartRate\.(average|maximum|minimum)Quantity\.unit$/, (v) => expect(v).toBe('count/min')],
  [
    /^statistics\.HKQuantityTypeIdentifierHeartRate\.(average|maximum|minimum)Quantity\.quantity$/,
    (v, m) => expect({ average: hr.averageBpm, maximum: hr.maxBpm, minimum: hr.minBpm }[m[1]!]).toBe(v),
  ],
  [/^heartRateSamples\.(\d+)\.quantity$/, (v, m) => expect(hr.samples[Number(m[1])]!.bpm).toBe(v)],
  [/^heartRateSamples\.(\d+)\.(startDate|endDate)$/, (v, m) => expect(hr.samples[Number(m[1])]!.time).toBe(v)],
  [/^heartRateSamples\.\d+\.unit$/, (v) => expect(v).toBe('count/min')],
  [/^heartRateSamples\.\d+\.quantityType$/, (v) => expect(v).toBe('HKQuantityTypeIdentifierHeartRate')],
  [
    /^routes\.0\.locations\.(\d+)\.(\w+)$/,
    (v, m) => {
      const point = rec(record.route)[Number(m[1])] as unknown as Record<string, unknown>;
      expect(point[rec(routeKeys[m[2]!])]).toBe(v);
    },
  ],
];

test('애플 건강 샘플의 모든 항목이 기록 어딘가에 남는다', () => {
  expectEveryFieldKept(appleHealthRun, record, rules);
});

test('기록 타입에 이름이 없는 항목은 원본 경로 그대로 extra에 있다', () => {
  expect(record.extra['workout.metadata.HKIndoorWorkout']).toBe(false);
  expect(record.extra['workout.metadata.HKElevationAscended.quantity']).toBe(21.4);
  expect(record.extra['workout.metadata.HKElevationAscended.unit']).toBe('m');
  expect(record.extra['workout.events.0.type']).toBe(1);
  expect(record.extra['statistics.HKQuantityTypeIdentifierRunningPower.averageQuantity.quantity']).toBe(238);
  expect(record.extra['workout.device.hardwareVersion']).toBe('Watch7,3');
  expect(record.extra['routes.0.HKMetadataKeySyncIdentifier']).toBe('9D8C7B6A-5F4E-4D3C-2B1A-0F9E8D7C6B5A');
});

test('가져온 곳, 기록 번호, 가져온 시각', () => {
  expect(record.origin).toEqual({
    source: 'apple_health',
    sourceRecordId: '6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B',
    importedAt,
  });
});

test('단위: 시간은 초, 거리는 미터, 에너지는 kcal, 심박은 bpm', () => {
  expect(record.measured.durationSeconds).toBe(1712.4);
  expect(record.measured.distanceMeters).toBe(5012.37);
  expect(record.measured.energyKcal).toBe(352.8);
  expect(hr.averageBpm).toBe(156);
  expect(hr.maxBpm).toBe(174);
  expect(hr.minBpm).toBe(98);
  expect(hr.samples).toHaveLength(4);
  expect(rec(record.route)[1]).toMatchObject({ altitudeMeters: 12.4, speedMetersPerSecond: 2.91, distanceFromPreviousMeters: 4.27 });
});

test('다른 단위로 오면 초와 미터로 바꾸고, 모르는 단위는 바꾸지 않고 extra에 둔다', () => {
  const raw: AppleHealthWorkoutRaw = {
    ...appleHealthRun,
    workout: {
      ...appleHealthRun.workout,
      duration: { unit: 'min', quantity: 28.54 },
      totalDistance: { unit: 'km', quantity: 5.01237 },
      totalEnergyBurned: { unit: 'parsec', quantity: 1 },
    },
  };
  const r = appleHealthToRecord(raw, importedAt);
  expect(r.measured.durationSeconds).toBeCloseTo(1712.4, 6);
  expect(r.measured.distanceMeters).toBeCloseTo(5012.37, 6);
  expect(r.measured.energyKcal).toBeNull();
  expect(r.extra['workout.totalEnergyBurned.unit']).toBe('parsec');
  expect(r.extra['workout.totalEnergyBurned.quantity']).toBe(1);
});

test('체감 피로와 메모는 비어 있다', () => {
  expect(record.userInput).toEqual({ perceivedExertion: null, memo: null });
});

test('원본을 바꾸지 않는다', () => {
  const before = JSON.stringify(appleHealthRun);
  appleHealthToRecord(appleHealthRun, importedAt);
  expect(JSON.stringify(appleHealthRun)).toBe(before);
});
