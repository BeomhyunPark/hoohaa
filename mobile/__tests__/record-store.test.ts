import AsyncStorage from '@react-native-async-storage/async-storage';

import { createDeviceRecordStore, parseSaved, SAVED_VERSION, storageKey } from '../src/record/device-store';
import { createFakeHealthReader } from '../src/record/health-reader';
import { createMemoryRecordStore, type RecordStore } from '../src/record/store';
import type { WorkoutRecord } from '../src/record/types';
import { withUserInput } from '../src/record/user-input';
import { rec } from '../test-utils/record';

const now = () => new Date('2026-11-05T22:05:00.000Z');

async function sample(platform: 'apple_health' | 'health_connect' = 'apple_health'): Promise<WorkoutRecord> {
  return rec(await createFakeHealthReader(platform, now).readLatestWorkout());
}

const APPLE_ID = '6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B';
const APPLE_KEY = `hoohaa/user-input/apple_health/${APPLE_ID}`;

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

// 두 구현이 같은 인터페이스를 같은 뜻으로 따르는지 본다. 화면은 어느 쪽이 들어와도 똑같이 움직여야 한다.
describe.each<[string, () => RecordStore]>([
  ['메모리 저장소', createMemoryRecordStore],
  ['기기 저장소', createDeviceRecordStore],
])('%s', (_name, create) => {
  test('저장한 적이 없는 기록은 null이다', async () => {
    expect(await create().findUserInput((await sample()).origin)).toBeNull();
  });

  test('저장한 체감 피로와 메모가 그대로 돌아온다', async () => {
    const store = create();
    const record = await sample();
    await store.save(withUserInput(record, { perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' }));
    expect(await store.findUserInput(record.origin)).toEqual({ perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' });
  });

  test('메모 없이 저장한 기록도 찾는다', async () => {
    const store = create();
    const record = await sample();
    await store.save(withUserInput(record, { perceivedExertion: 3, memo: '' }));
    expect(await store.findUserInput(record.origin)).toEqual({ perceivedExertion: 3, memo: null });
  });

  test('같은 기록을 다시 저장하면 값이 바뀐다', async () => {
    const store = create();
    const record = await sample();
    await store.save(withUserInput(record, { perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' }));
    await store.save(withUserInput(record, { perceivedExertion: 4, memo: '' }));
    expect(await store.findUserInput(record.origin)).toEqual({ perceivedExertion: 4, memo: null });
  });

  test('가져온 곳과 기록 번호로만 찾는다: 가져온 시각이 달라도 같은 기록이다', async () => {
    const store = create();
    const record = await sample();
    await store.save(withUserInput(record, { perceivedExertion: 7, memo: '' }));
    const again = { source: record.origin.source, sourceRecordId: record.origin.sourceRecordId, importedAt: '2026-11-07T00:00:00.000Z' };
    expect(await store.findUserInput(again)).toEqual({ perceivedExertion: 7, memo: null });
  });

  test('기록 번호가 같아도 가져온 곳이 다르면 다른 기록이다', async () => {
    const store = create();
    const record = await sample('apple_health');
    await store.save(withUserInput(record, { perceivedExertion: 7, memo: '' }));
    expect(await store.findUserInput({ source: 'health_connect', sourceRecordId: record.origin.sourceRecordId })).toBeNull();
  });

  test('기록 번호가 다르면 다른 기록이다', async () => {
    const store = create();
    const record = await sample();
    await store.save(withUserInput(record, { perceivedExertion: 7, memo: '' }));
    expect(await store.findUserInput({ source: record.origin.source, sourceRecordId: 'another-id' })).toBeNull();
  });

  test('두 건강 앱의 기록을 따로 둔다', async () => {
    const store = create();
    const apple = await sample('apple_health');
    const hc = await sample('health_connect');
    await store.save(withUserInput(apple, { perceivedExertion: 3, memo: '애플' }));
    await store.save(withUserInput(hc, { perceivedExertion: 8, memo: '헬스 커넥트' }));
    expect(await store.findUserInput(apple.origin)).toEqual({ perceivedExertion: 3, memo: '애플' });
    expect(await store.findUserInput(hc.origin)).toEqual({ perceivedExertion: 8, memo: '헬스 커넥트' });
  });

  test('직접 입력한 기록도 가져온 곳(manual)과 앱이 붙인 번호로 찾는다', async () => {
    const store = create();
    const manual = withUserInput(await sample(), { perceivedExertion: 4, memo: '가볍게' });
    manual.origin = { source: 'manual', sourceRecordId: 'm-abc-12345678', importedAt: now().toISOString() };
    await store.save(manual);
    expect(await store.findUserInput({ source: 'manual', sourceRecordId: 'm-abc-12345678' })).toEqual({ perceivedExertion: 4, memo: '가볍게' });
    expect(await store.findUserInput({ source: 'manual', sourceRecordId: 'm-abc-00000000' })).toBeNull();
  });
});

describe('기기 저장소', () => {
  test('앱을 다시 열어도(저장소를 새로 만들어도) 저장한 값이 돌아온다', async () => {
    const record = await sample();
    await createDeviceRecordStore().save(withUserInput(record, { perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' }));

    const reopened = createDeviceRecordStore();
    expect(await reopened.findUserInput(record.origin)).toEqual({ perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' });
  });

  test('기록 하나에 키 하나, 체감 피로와 메모만 저장한다 (저장 형식)', async () => {
    const apple = await sample('apple_health');
    const hc = await sample('health_connect');
    const store = createDeviceRecordStore();
    await store.save(withUserInput(apple, { perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' }));
    await store.save(withUserInput(hc, { perceivedExertion: 3, memo: '' }));

    expect([...(await AsyncStorage.getAllKeys())].sort()).toEqual([
      APPLE_KEY,
      `hoohaa/user-input/health_connect/${hc.origin.sourceRecordId}`,
    ]);
    expect(JSON.parse(rec(await AsyncStorage.getItem(APPLE_KEY)))).toEqual({
      version: 1,
      source: 'apple_health',
      sourceRecordId: APPLE_ID,
      perceivedExertion: 7,
      memo: '왼쪽 무릎이 조금 아파요',
    });
    expect(JSON.parse(rec(await AsyncStorage.getItem(rec(storageKey(hc.origin)))))).toEqual({
      version: 1,
      source: 'health_connect',
      sourceRecordId: hc.origin.sourceRecordId,
      perceivedExertion: 3,
      memo: null,
    });
  });

  test('같은 기록을 고쳐 저장해도 키는 하나다', async () => {
    const record = await sample();
    const store = createDeviceRecordStore();
    await store.save(withUserInput(record, { perceivedExertion: 7, memo: '' }));
    await store.save(withUserInput(record, { perceivedExertion: 2, memo: '' }));
    expect(await AsyncStorage.getAllKeys()).toEqual([APPLE_KEY]);
  });

  const good = { version: SAVED_VERSION, source: 'apple_health', sourceRecordId: APPLE_ID, perceivedExertion: 7, memo: null };

  test.each<[string, string]>([
    ['잘린 JSON', '{"version":1,"source":"apple_health","perceivedEx'],
    ['JSON이 아닌 글자', '체감 피로 7'],
    ['빈 글자', ''],
    ['null', 'null'],
    ['숫자 하나', '7'],
    ['배열', '[7, null]'],
    ['형식 번호가 없다', JSON.stringify({ ...good, version: undefined })],
    ['형식 번호가 다르다', JSON.stringify({ ...good, version: 2 })],
    ['체감 피로가 없다', JSON.stringify({ ...good, perceivedExertion: undefined })],
    ['체감 피로가 null이다', JSON.stringify({ ...good, perceivedExertion: null })],
    ['체감 피로가 0이다', JSON.stringify({ ...good, perceivedExertion: 0 })],
    ['체감 피로가 11이다', JSON.stringify({ ...good, perceivedExertion: 11 })],
    ['체감 피로가 정수가 아니다', JSON.stringify({ ...good, perceivedExertion: 5.5 })],
    ['체감 피로가 글자다', JSON.stringify({ ...good, perceivedExertion: '7' })],
    ['메모가 없다', JSON.stringify({ ...good, memo: undefined })],
    ['메모가 숫자다', JSON.stringify({ ...good, memo: 3 })],
    ['메모가 빈칸뿐이다', JSON.stringify({ ...good, memo: '  ' })],
    ['다른 기록 번호의 값이다', JSON.stringify({ ...good, sourceRecordId: 'another-id' })],
    ['다른 곳의 값이다', JSON.stringify({ ...good, source: 'health_connect' })],
    ['기록을 통째로 넣은 다른 모양', JSON.stringify({ origin: { source: 'apple_health', sourceRecordId: APPLE_ID }, userInput: { perceivedExertion: 7, memo: null } })],
  ])('깨졌거나 형식이 다른 값은 던지지 않고 null이다: %s', async (_name, stored) => {
    const record = await sample();
    await AsyncStorage.setItem(APPLE_KEY, stored);
    expect(parseSaved(stored, record.origin)).toBeNull();

    const store = createDeviceRecordStore();
    expect(await store.findUserInput(record.origin)).toBeNull();

    // 그 자리에 다시 저장하면 쓸 수 있는 값으로 바뀐다.
    await store.save(withUserInput(record, { perceivedExertion: 5, memo: '다시 적었어요' }));
    expect(await store.findUserInput(record.origin)).toEqual({ perceivedExertion: 5, memo: '다시 적었어요' });
  });

  test('한 기록의 값이 깨져도 다른 기록은 그대로다', async () => {
    const apple = await sample('apple_health');
    const hc = await sample('health_connect');
    const store = createDeviceRecordStore();
    await store.save(withUserInput(apple, { perceivedExertion: 7, memo: '' }));
    await store.save(withUserInput(hc, { perceivedExertion: 3, memo: '' }));
    await AsyncStorage.setItem(APPLE_KEY, '{');

    expect(await store.findUserInput(apple.origin)).toBeNull();
    expect(await store.findUserInput(hc.origin)).toEqual({ perceivedExertion: 3, memo: null });
  });

  test('모르는 항목이 더 있어도 아는 항목이 맞으면 읽는다', async () => {
    await AsyncStorage.setItem(APPLE_KEY, JSON.stringify({ ...good, later: 'x' }));
    expect(await createDeviceRecordStore().findUserInput((await sample()).origin)).toEqual({ perceivedExertion: 7, memo: null });
  });

  test('기기 저장소를 읽지 못하면 null이 아니라 실패로 알린다', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('디스크 오류'));
    await expect(createDeviceRecordStore().findUserInput((await sample()).origin)).rejects.toThrow('디스크 오류');
  });

  test('기기 저장소에 쓰지 못하면 실패로 알린다', async () => {
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('공간 없음'));
    const record = withUserInput(await sample(), { perceivedExertion: 7, memo: '' });
    await expect(createDeviceRecordStore().save(record)).rejects.toThrow('공간 없음');
  });

  test('체감 피로가 없는 기록은 저장하지 않는다', async () => {
    await expect(createDeviceRecordStore().save(await sample())).rejects.toThrow(RangeError);
    expect(await AsyncStorage.getAllKeys()).toEqual([]);
  });
});
