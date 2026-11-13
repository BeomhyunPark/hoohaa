import { createFakeHealthReader } from '../src/record/health-reader';
import { createMemoryRecordStore } from '../src/record/store';
import { formatDuration, formatPace, formatStart, summarize } from '../src/record/summary';
import { isPerceivedExertion, withUserInput } from '../src/record/user-input';
import { rec } from '../test-utils/record';

const now = () => new Date('2026-11-05T22:05:00.000Z');
const sample = async (platform: 'apple_health' | 'health_connect') =>
  rec(await createFakeHealthReader(platform, now).readLatestWorkout());

describe('summarize', () => {
  // jest는 서울 시간대로 돈다(test-utils/timezone.js).
  test('애플 건강 샘플', async () => {
    expect(summarize(await sample('apple_health'))).toEqual([
      { key: 'date', value: '11월 6일 (금) 오전 6:30' },
      { key: 'distance', value: '5.01 km' },
      { key: 'duration', value: '28:32' },
      { key: 'pace', value: '5:42/km' },
      { key: 'heartRate', value: '156 bpm' },
    ]);
  });

  test('헬스 커넥트 샘플: 멈춘 1분을 빼서 시간과 평균 페이스가 애플 건강 샘플과 같다', async () => {
    expect(summarize(await sample('health_connect'))).toEqual([
      { key: 'date', value: '11월 6일 (금) 오전 6:30' },
      { key: 'distance', value: '5.01 km' },
      { key: 'duration', value: '28:32' },
      { key: 'pace', value: '5:42/km' },
      { key: 'heartRate', value: '146 bpm' },
    ]);
  });

  test('값이 없거나 0인 항목은 빠진다', async () => {
    const record = await sample('apple_health');
    record.measured.startTime = '';
    record.measured.distanceMeters = 0;
    record.measured.durationSeconds = null;
    record.measured.heartRate = null;
    expect(summarize(record)).toEqual([]);

    record.measured.distanceMeters = 5000;
    expect(summarize(record)).toEqual([{ key: 'distance', value: '5.00 km' }]);
  });
});

test('formatStart: 오전·오후와 12시', () => {
  expect(formatStart('2026-11-05T15:00:00Z')).toBe('11월 6일 (금) 오전 12:00');
  expect(formatStart('2026-11-06T03:05:00Z')).toBe('11월 6일 (금) 오후 12:05');
  expect(formatStart('2026-11-06T10:30:00Z')).toBe('11월 6일 (금) 오후 7:30');
  expect(formatStart('모름')).toBeNull();
});

test('formatDuration, formatPace', () => {
  expect(formatDuration(59.6)).toBe('1:00');
  expect(formatDuration(1772.4)).toBe('29:32');
  expect(formatDuration(3723)).toBe('1:02:03');
  expect(formatPace(359.7)).toBe('6:00');
  expect(formatPace(341.6)).toBe('5:42');
});

describe('withUserInput', () => {
  test('체감 피로와 메모를 붙인 새 기록을 돌려준다', async () => {
    const record = await sample('apple_health');
    const saved = withUserInput(record, { perceivedExertion: 10, memo: ' 발목이 찌릿해요\n' });
    expect(saved).toEqual({ ...record, userInput: { perceivedExertion: 10, memo: '발목이 찌릿해요' } });
    expect(record.userInput).toEqual({ perceivedExertion: null, memo: null });
  });

  test.each([0, 11, 5.5, NaN, -1])('1~10의 정수가 아니면(%p) 붙이지 않는다', async (value) => {
    expect(isPerceivedExertion(value)).toBe(false);
    const record = await sample('apple_health');
    expect(() => withUserInput(record, { perceivedExertion: value, memo: '' })).toThrow(RangeError);
  });
});

describe('메모리 저장소', () => {
  test('같은 곳의 같은 기록 번호는 두 번 저장하지 않고 바꾼다', async () => {
    const store = createMemoryRecordStore();
    const apple = await sample('apple_health');
    const hc = await sample('health_connect');
    await store.save(withUserInput(apple, { perceivedExertion: 3, memo: '' }));
    await store.save(hc);
    await store.save(withUserInput(apple, { perceivedExertion: 6, memo: '' }));

    expect(store.all().map((r) => [r.origin.source, r.userInput.perceivedExertion])).toEqual([
      ['apple_health', 6],
      ['health_connect', null],
    ]);
  });

  test('기록 번호가 없는 기록(직접 입력)은 따로 저장한다', async () => {
    const store = createMemoryRecordStore();
    const manual = await sample('apple_health');
    manual.origin = { source: 'manual', sourceRecordId: null, importedAt: now().toISOString() };
    await store.save(manual);
    await store.save(manual);
    expect(store.all()).toHaveLength(2);
  });
});
