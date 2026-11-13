import AsyncStorage from '@react-native-async-storage/async-storage';

import { createFakeHealthReader, createLatestWorkoutReader } from '../src/record/health-reader';
import {
  formatDateInput,
  manualRecord,
  newManualRecordId,
  readManualForm,
  showClock,
  showDate,
  type ManualFields,
  type ManualForm,
} from '../src/record/manual';
import {
  createDeviceManualRecordStore,
  createMemoryManualRecordStore,
  manualStorageKey,
  type ManualRecordStore,
} from '../src/record/manual-store';
import { summarize } from '../src/record/summary';
import { rec } from '../test-utils/record';

// jest는 서울 시간대로 돈다(test-utils/timezone.js). 2026-11-13 (금) 오전 7:10.
const now = new Date('2026-11-12T22:10:00.000Z');

const form = (over: Partial<ManualForm> = {}): ManualForm => ({
  date: '2026-11-13',
  distance: '5.01',
  duration: '28:32',
  startTime: '',
  heartRate: '',
  cadence: '',
  ...over,
});

function fields(over: Partial<ManualForm> = {}): ManualFields {
  const r = readManualForm(form(over), now);
  if (!r.ok) throw new Error(`틀린 칸: ${JSON.stringify(r.errors)}`);
  return r.fields;
}

const errors = (over: Partial<ManualForm>) => {
  const r = readManualForm(form(over), now);
  return r.ok ? {} : r.errors;
};

beforeEach(async () => {
  await AsyncStorage.clear();
});

describe('입력칸 읽기', () => {
  test('날짜, 거리, 시간만 적어도 된다', () => {
    expect(fields()).toEqual({
      startTime: '2026-11-12T15:00:00.000Z', // 11월 13일 0시(서울)
      startTimeEntered: false,
      durationSeconds: 1712,
      distanceMeters: 5010,
      averageBpm: null,
      averageCadenceSpm: null,
    });
  });

  test('시작 시각, 평균 심박, 평균 케이던스는 적으면 들어간다', () => {
    expect(fields({ startTime: '06:30', heartRate: '156', cadence: '176' })).toEqual({
      startTime: '2026-11-12T21:30:00.000Z',
      startTimeEntered: true,
      durationSeconds: 1712,
      distanceMeters: 5010,
      averageBpm: 156,
      averageCadenceSpm: 176,
    });
  });

  test('꼭 받는 칸이 비면 그 칸마다 알린다', () => {
    expect(errors({ date: '', distance: ' ', duration: '' })).toEqual({ date: 'required', distance: 'required', duration: 'required' });
  });

  test.each([
    ['2026.11.13', '2026-11-12T15:00:00.000Z'],
    ['20261113', '2026-11-12T15:00:00.000Z'],
    ['2026-1-5', '2026-01-04T15:00:00.000Z'],
  ])('날짜 %s를 읽는다', (date, startTime) => {
    expect(fields({ date }).startTime).toBe(startTime);
  });

  test.each(['2026-02-30', '2026-13-01', '11월 13일', '26-11-13'])('없는 날짜나 다른 모양(%s)은 받지 않는다', (date) => {
    expect(errors({ date })).toEqual({ date: 'invalid' });
  });

  test('오늘은 받고, 오늘보다 뒤의 날짜는 받지 않는다', () => {
    expect(errors({ date: '2026-11-13' })).toEqual({});
    expect(errors({ date: '2026-11-14' })).toEqual({ date: 'future' });
  });

  test.each([
    ['1:02:03', 3723],
    ['2832', 1712],
    ['45', 45],
  ])('시간 %s는 웹의 기록 칸과 같은 규칙으로 읽는다', (duration, seconds) => {
    expect(fields({ duration }).durationSeconds).toBe(seconds);
  });

  test.each(['0', '28:75', '28분', '-5:00'])('읽을 수 없는 시간(%s)은 받지 않는다', (duration) => {
    expect(errors({ duration })).toEqual({ duration: 'invalid' });
  });

  test.each([
    ['0', 'invalid'],
    ['5,01', 'invalid'],
    ['5km', 'invalid'],
    ['500.1', 'range'],
  ])('거리 %s는 받지 않는다(%s)', (distance, why) => {
    expect(errors({ distance })).toEqual({ distance: why });
  });

  test('거리는 미터로 둔다', () => {
    expect(fields({ distance: '42.195' }).distanceMeters).toBe(42195);
    expect(fields({ distance: '10' }).distanceMeters).toBe(10000);
  });

  test.each(['24:00', '6시', '06:60'])('읽을 수 없는 시작 시각(%s)은 받지 않는다', (startTime) => {
    expect(errors({ startTime })).toEqual({ startTime: 'invalid' });
  });

  test('선택 칸도 적었으면 검사한다', () => {
    expect(errors({ heartRate: '20', cadence: '400' })).toEqual({ heartRate: 'range', cadence: 'range' });
    expect(errors({ heartRate: '156.5', cadence: '빠름' })).toEqual({ heartRate: 'invalid', cadence: 'invalid' });
  });

  test('입력 중에 숫자를 칸의 모양으로 끊는다', () => {
    expect(showDate('20261113')).toBe('2026-11-13');
    expect(showDate('202611')).toBe('2026-11');
    expect(showDate('2026-11-1')).toBe('2026-11-1');
    expect(showClock('0630')).toBe('06:30');
    expect(showClock('06')).toBe('06');
    expect(formatDateInput(now)).toBe('2026-11-13');
  });
});

describe('기록 만들기', () => {
  test('앱이 기록 번호를 만들어 붙인다. 만들 때마다 다르다', () => {
    const a = newManualRecordId(now);
    const b = newManualRecordId(now);
    expect(a).toMatch(/^m-[0-9a-z]+-[0-9a-z]{8}$/);
    expect(a).not.toBe(b);
  });

  test('직접 입력한 기록의 모양', () => {
    const record = manualRecord('m-1', now.toISOString(), fields({ startTime: '06:30', heartRate: '156', cadence: '176' }));
    expect(record).toEqual({
      origin: { source: 'manual', sourceRecordId: 'm-1', importedAt: '2026-11-12T22:10:00.000Z' },
      measured: {
        activityTypeCode: null,
        startTime: '2026-11-12T21:30:00.000Z',
        endTime: '2026-11-12T21:58:32.000Z',
        durationSeconds: 1712,
        distanceMeters: 5010,
        energyKcal: null,
        heartRate: { averageBpm: 156, maxBpm: null, minBpm: null, samples: [] },
        averageCadenceSpm: 176,
      },
      userInput: { perceivedExertion: null, memo: null },
      route: null,
      extra: { 'manual.startTimeEntered': true },
    });
  });

  test('화면에는 건강 앱 기록과 같은 항목으로 보이고, 케이던스가 붙는다', () => {
    const record = manualRecord('m-1', now.toISOString(), fields({ startTime: '06:30', heartRate: '156', cadence: '176' }));
    expect(summarize(record)).toEqual([
      { key: 'date', value: '11월 13일 (금) 오전 6:30' },
      { key: 'distance', value: '5.01 km' },
      { key: 'duration', value: '28:32' },
      { key: 'pace', value: '5:42/km' },
      { key: 'heartRate', value: '156 bpm' },
      { key: 'cadence', value: '176 spm' },
    ]);
  });

  test('시작 시각을 적지 않았으면 날짜만 보이고, 적지 않은 선택 항목은 빠진다', () => {
    expect(summarize(manualRecord('m-1', now.toISOString(), fields()))).toEqual([
      { key: 'date', value: '11월 13일 (금)' },
      { key: 'distance', value: '5.01 km' },
      { key: 'duration', value: '28:32' },
      { key: 'pace', value: '5:42/km' },
    ]);
  });
});

describe.each<[string, () => ManualRecordStore]>([
  ['메모리 저장소', createMemoryManualRecordStore],
  ['기기 저장소', createDeviceManualRecordStore],
])('직접 입력한 기록의 %s', (_name, create) => {
  test('저장한 기록이 그대로 돌아온다', async () => {
    const store = create();
    const record = manualRecord('m-1', now.toISOString(), fields({ startTime: '06:30', heartRate: '156', cadence: '176' }));
    await store.save(record);
    expect(await store.latest()).toEqual(record);
  });

  test('아무것도 없으면 null이다', async () => {
    expect(await create().latest()).toBeNull();
  });

  test('가장 늦게 끝난 기록을 돌려준다(적은 순서가 아니다)', async () => {
    const store = create();
    await store.save(manualRecord('m-new', now.toISOString(), fields({ date: '2026-11-12', startTime: '19:00' })));
    await store.save(manualRecord('m-old', now.toISOString(), fields({ date: '2026-11-01' })));
    expect(rec(await store.latest()).origin.sourceRecordId).toBe('m-new');
  });

  test('번호가 같은 기록은 그 자리를 바꾼다', async () => {
    const store = create();
    await store.save(manualRecord('m-1', now.toISOString(), fields()));
    await store.save(manualRecord('m-1', now.toISOString(), fields({ distance: '10' })));
    expect(rec(await store.latest()).measured.distanceMeters).toBe(10000);
  });

  test('건강 앱 기록은 받지 않는다', async () => {
    const health = rec(await createFakeHealthReader('apple_health', () => now).readLatestWorkout());
    await expect(create().save(health)).rejects.toThrow();
  });
});

describe('직접 입력한 기록의 기기 저장소', () => {
  test('기록 하나에 키 하나 (저장 형식)', async () => {
    await createDeviceManualRecordStore().save(manualRecord('m-1', now.toISOString(), fields({ heartRate: '156' })));
    expect(await AsyncStorage.getAllKeys()).toEqual(['hoohaa/manual-record/m-1']);
    expect(JSON.parse(rec(await AsyncStorage.getItem(manualStorageKey('m-1'))))).toEqual({
      version: 1,
      id: 'm-1',
      createdAt: '2026-11-12T22:10:00.000Z',
      startTime: '2026-11-12T15:00:00.000Z',
      startTimeEntered: false,
      durationSeconds: 1712,
      distanceMeters: 5010,
      averageBpm: 156,
      averageCadenceSpm: null,
    });
  });

  test('앱을 다시 열어도(저장소를 새로 만들어도) 남아 있다', async () => {
    const record = manualRecord('m-1', now.toISOString(), fields());
    await createDeviceManualRecordStore().save(record);
    expect(await createDeviceManualRecordStore().latest()).toEqual(record);
  });

  test.each([
    ['JSON이 아닌 글자', '{깨짐'],
    ['다른 형식 번호', JSON.stringify({ version: 2, id: 'm-bad' })],
    ['다른 기록의 값', JSON.stringify({ version: 1, id: 'm-other', createdAt: now.toISOString(), startTime: now.toISOString(), startTimeEntered: false, durationSeconds: 60, distanceMeters: 100, averageBpm: null, averageCadenceSpm: null })],
    ['거리가 없는 값', JSON.stringify({ version: 1, id: 'm-bad', createdAt: now.toISOString(), startTime: now.toISOString(), startTimeEntered: false, durationSeconds: 60, distanceMeters: null, averageBpm: null, averageCadenceSpm: null })],
  ])('쓸 수 없는 값(%s)은 건너뛰고 다른 기록은 그대로 읽는다', async (_what, text) => {
    const good = manualRecord('m-good', now.toISOString(), fields({ date: '2026-11-01' }));
    const store = createDeviceManualRecordStore();
    await store.save(good);
    await AsyncStorage.setItem(manualStorageKey('m-bad'), text);
    expect(await store.latest()).toEqual(good);
  });

  test('체감 피로와 메모의 키는 건드리지 않는다', async () => {
    await AsyncStorage.setItem('hoohaa/user-input/manual/m-1', '{}');
    expect(await createDeviceManualRecordStore().latest()).toBeNull();
  });

  test('기기 저장소를 읽지 못하면 reject한다', async () => {
    jest.mocked(AsyncStorage.getAllKeys).mockRejectedValueOnce(new Error('읽기 실패'));
    await expect(createDeviceManualRecordStore().latest()).rejects.toThrow('읽기 실패');
  });
});

describe('가장 최근 기록', () => {
  // 샘플 달리기는 11월 6일 오전 6:30~7:00쯤(서울)이다.
  const health = createFakeHealthReader('apple_health', () => now);

  test('직접 입력한 기록이 없으면 건강 앱 기록이다', async () => {
    const latest = rec(await createLatestWorkoutReader(health, createMemoryManualRecordStore()).readLatestWorkout());
    expect(latest.origin.source).toBe('apple_health');
  });

  test('직접 입력한 기록이 더 늦게 끝났으면 그 기록이다', async () => {
    const manual = createMemoryManualRecordStore();
    await manual.save(manualRecord('m-1', now.toISOString(), fields({ date: '2026-11-12' })));
    expect(rec(await createLatestWorkoutReader(health, manual).readLatestWorkout()).origin.sourceRecordId).toBe('m-1');
  });

  test('직접 입력한 기록이 더 먼저 끝났으면 건강 앱 기록이다', async () => {
    const manual = createMemoryManualRecordStore();
    await manual.save(manualRecord('m-1', now.toISOString(), fields({ date: '2026-11-01' })));
    expect(rec(await createLatestWorkoutReader(health, manual).readLatestWorkout()).origin.source).toBe('apple_health');
  });

  test('건강 앱에 운동이 없으면 직접 입력한 기록이다', async () => {
    const manual = createMemoryManualRecordStore();
    await manual.save(manualRecord('m-1', now.toISOString(), fields()));
    const reader = createLatestWorkoutReader({ readLatestWorkout: async () => null }, manual);
    expect(rec(await reader.readLatestWorkout()).origin.sourceRecordId).toBe('m-1');
  });

  test('둘 다 없으면 null이다', async () => {
    const reader = createLatestWorkoutReader({ readLatestWorkout: async () => null }, createMemoryManualRecordStore());
    expect(await reader.readLatestWorkout()).toBeNull();
  });
});
