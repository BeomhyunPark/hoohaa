import { healthConnectRun } from '../src/record/fixtures/health-connect-run';
import { healthConnectToRecord } from '../src/record/health-connect';
import { expectEveryFieldKept, rec } from '../test-utils/record';
import type { FieldRule } from '../test-utils/record';

const importedAt = '2026-11-05T22:05:00.000Z';
const record = healthConnectToRecord(healthConnectRun, importedAt);
const hr = rec(record.measured.heartRate);

/** 같은 길이를 다른 단위로 적은 값이 미터 값과 맞는지. */
const METERS_PER: Record<string, number> = { inMeters: 1, inKilometers: 1000, inMiles: 1609.344, inInches: 0.0254, inFeet: 0.3048 };
function expectMeters(v: unknown, unit: string, meters: number | null | undefined): void {
  expect(typeof v).toBe('number');
  expect((v as number) * rec(METERS_PER[unit])).toBeCloseTo(rec(meters), 6);
}

const routeLength: Record<string, string> = {
  altitude: 'altitudeMeters',
  horizontalAccuracy: 'horizontalAccuracyMeters',
  verticalAccuracy: 'verticalAccuracyMeters',
};

const rules: FieldRule[] = [
  [/^session\.metadata\.id$/, (v) => expect(record.origin.sourceRecordId).toBe(v)],
  [/^session\.startTime$/, (v) => expect(record.measured.startTime).toBe(v)],
  [/^session\.endTime$/, (v) => expect(record.measured.endTime).toBe(v)],
  [/^session\.exerciseType$/, (v) => expect(record.measured.activityTypeCode).toBe(v)],
  [
    // 거리 기록 하나하나는 합으로 들어간다. 단위만 다른 값은 그 기록의 미터 값과 같아야 한다.
    /^distance\.(\d+)\.distance\.(in\w+)$/,
    (v, m) => expectMeters(v, m[2]!, healthConnectRun.distance[Number(m[1])]!.distance.inMeters),
  ],
  [
    /^heartRate\.(\d+)\.samples\.(\d+)\.(time|beatsPerMinute)$/,
    (v, m) => {
      const before = healthConnectRun.heartRate.slice(0, Number(m[1])).reduce((n, r) => n + r.samples.length, 0);
      const s = rec(hr.samples[before + Number(m[2])]);
      expect(m[3] === 'time' ? s.time : s.bpm).toBe(v);
    },
  ],
  [
    /^session\.exerciseRoute\.route\.(\d+)\.(time|latitude|longitude)$/,
    (v, m) => expect((rec(record.route)[Number(m[1])] as unknown as Record<string, unknown>)[m[2]!]).toBe(v),
  ],
  [
    /^session\.exerciseRoute\.route\.(\d+)\.(altitude|horizontalAccuracy|verticalAccuracy)\.(in\w+)$/,
    (v, m) => {
      const point = rec(record.route)[Number(m[1])] as unknown as Record<string, number | null>;
      expectMeters(v, m[3]!, point[rec(routeLength[m[2]!])]);
    },
  ],
];

test('헬스 커넥트 샘플의 모든 항목이 기록 어딘가에 남는다', () => {
  expectEveryFieldKept(healthConnectRun, record, rules);
});

test('기록 타입에 이름이 없는 항목은 원본 경로 그대로 extra에 있다', () => {
  expect(record.extra['session.title']).toBe('러닝');
  expect(record.extra['session.notes']).toBeNull();
  expect(record.extra['session.exerciseRoute.type']).toBe('DATA');
  expect(record.extra['session.segments.1.segmentType']).toBe(39);
  expect(record.extra['session.laps.0.length.inMeters']).toBe(1000);
  expect(record.extra['session.startZoneOffset.totalSeconds']).toBe(32400);
  expect(record.extra['session.metadata.dataOrigin']).toBe('com.sec.android.app.shealth');
  expect(record.extra['distance.1.metadata.id']).toBe('b1c2d3e4-0002-4a5b-8c9d-0e1f2a3b4c5d');
  expect(record.extra['heartRate.0.startTime']).toBe('2026-11-05T21:30:05Z');
});

test('가져온 곳, 기록 번호, 가져온 시각', () => {
  expect(record.origin).toEqual({
    source: 'health_connect',
    sourceRecordId: '3f2a9c1e-7b4d-4e8a-9f10-2c3d4e5f6a7b',
    importedAt,
  });
});

test('단위: 시간은 끝 − 시작의 초, 거리는 기록들을 더한 미터, 경로 고도는 미터', () => {
  expect(record.measured.durationSeconds).toBe(1772.4);
  expect(record.measured.distanceMeters).toBeCloseTo(5012.37, 6);
  expect(record.measured.energyKcal).toBeNull();
  expect(hr.samples.map((s) => s.bpm)).toEqual([98, 154, 162, 168]);
  expect(hr.averageBpm).toBe(145.5);
  expect(hr.maxBpm).toBe(168);
  expect(hr.minBpm).toBe(98);
  expect(rec(record.route)[2]).toMatchObject({
    time: '2026-11-05T21:30:02Z',
    altitudeMeters: 12.6,
    horizontalAccuracyMeters: 3.9,
    speedMetersPerSecond: null,
  });
});

test('체감 피로와 메모는 비어 있다(원본 앱의 notes를 메모로 옮기지 않는다)', () => {
  const r = healthConnectToRecord({ ...healthConnectRun, session: { ...healthConnectRun.session, notes: '원본 앱 메모' } }, importedAt);
  expect(record.userInput).toEqual({ perceivedExertion: null, memo: null });
  expect(r.userInput).toEqual({ perceivedExertion: null, memo: null });
  expect(r.extra['session.notes']).toBe('원본 앱 메모');
});

test('경로가 없으면 route는 null이고 type은 extra에 남는다', () => {
  const r = healthConnectToRecord(
    { ...healthConnectRun, session: { ...healthConnectRun.session, exerciseRoute: { type: 'CONSENT_REQUIRED', route: [] } } },
    importedAt,
  );
  expect(r.route).toBeNull();
  expect(r.extra['session.exerciseRoute.type']).toBe('CONSENT_REQUIRED');
});
