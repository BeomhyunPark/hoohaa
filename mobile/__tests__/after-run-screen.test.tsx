import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import { createDeviceRecordStore, storageKey } from '../src/record/device-store';
import { createFakeHealthReader, type HealthReader } from '../src/record/health-reader';
import { createMemoryRecordStore, type RecordStore } from '../src/record/store';
import type { WorkoutRecord } from '../src/record/types';
import { AfterRunScreen } from '../src/screens/AfterRunScreen';
import { rec } from '../test-utils/record';

const now = () => new Date('2026-11-05T22:05:00.000Z');

async function sample(platform: 'apple_health' | 'health_connect' = 'apple_health'): Promise<WorkoutRecord> {
  return rec(await createFakeHealthReader(platform, now).readLatestWorkout());
}

const readerOf = (record: WorkoutRecord | null): HealthReader => ({ readLatestWorkout: async () => record });

/** 화면을 그리고 기록이 보일 때까지 기다린다. */
async function open(record: WorkoutRecord, store: RecordStore = createMemoryRecordStore()) {
  await render(<AfterRunScreen reader={readerOf(record)} store={store} />);
  await screen.findByText('운동 기록');
  return { store, user: userEvent.setup() };
}

describe('들어온 기록', () => {
  test('날짜, 거리, 시간, 평균 페이스, 평균 심박을 보여 준다', async () => {
    await open(await sample('apple_health'));
    // jest는 서울 시간대로 돈다(test-utils/timezone.js).
    expect(screen.getByLabelText('날짜, 11월 6일 (금) 오전 6:30')).toBeTruthy();
    expect(screen.getByLabelText('거리, 5.01 km')).toBeTruthy();
    expect(screen.getByLabelText('시간, 28:32')).toBeTruthy();
    expect(screen.getByLabelText('평균 페이스, 5:42/km')).toBeTruthy();
    expect(screen.getByLabelText('평균 심박, 156 bpm')).toBeTruthy();
  });

  test('값이 없는 항목은 화면에 안 나온다', async () => {
    const record = await sample();
    record.measured.distanceMeters = null;
    record.measured.heartRate = null;
    await open(record);

    expect(screen.getByText('시간')).toBeTruthy();
    expect(screen.getByText('28:32')).toBeTruthy();
    // 거리가 없으면 거리 칸도, 거리로 계산하는 평균 페이스 칸도 없다.
    expect(screen.queryByText('거리')).toBeNull();
    expect(screen.queryByText('평균 페이스')).toBeNull();
    expect(screen.queryByText('평균 심박')).toBeNull();
    expect(screen.queryByText(/km|bpm/)).toBeNull();
  });

  test('심박 표본은 있는데 평균이 없으면 평균 심박 칸이 없다', async () => {
    const record = await sample();
    record.measured.heartRate = { averageBpm: null, maxBpm: 174, minBpm: 98, samples: [] };
    await open(record);
    expect(screen.queryByText('평균 심박')).toBeNull();
  });

  test('건강 앱에 운동이 없으면 그렇다고 알리고, 묻지 않는다', async () => {
    await render(<AfterRunScreen reader={readerOf(null)} store={createMemoryRecordStore()} />);
    expect(await screen.findByText('가져온 운동 기록이 없어요.')).toBeTruthy();
    expect(screen.queryByText('체감 피로')).toBeNull();
    expect(screen.queryByText('저장')).toBeNull();
  });

  test('읽다가 실패하면 알리고, 다시 읽을 수 있다', async () => {
    const record = await sample();
    const readLatestWorkout = jest.fn<Promise<WorkoutRecord | null>, []>();
    readLatestWorkout.mockRejectedValueOnce(new Error('건강 앱 오류')).mockResolvedValueOnce(record);
    await render(<AfterRunScreen reader={{ readLatestWorkout }} store={createMemoryRecordStore()} />);

    expect(await screen.findByText('기록을 읽지 못했어요.')).toBeTruthy();
    await userEvent.setup().press(screen.getByRole('button', { name: '다시 읽기' }));
    expect(await screen.findByText('운동 기록')).toBeTruthy();
    expect(screen.queryByText('기록을 읽지 못했어요.')).toBeNull();
  });
});

describe('체감 피로', () => {
  test('1~10 버튼마다 읽어 줄 이름이 있고, 양 끝에는 뜻이 붙는다', async () => {
    await open(await sample());
    expect(screen.getByText('1은 아주 편했을 때, 10은 온 힘을 다했을 때예요.')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(10);
    expect(screen.getByRole('radio', { name: '체감 피로 1, 아주 편했어요' })).toBeTruthy();
    for (let v = 2; v <= 9; v++) expect(screen.getByRole('radio', { name: `체감 피로 ${v}` })).toBeTruthy();
    expect(screen.getByRole('radio', { name: '체감 피로 10, 온 힘을 다했어요' })).toBeTruthy();
  });

  test('누르는 영역은 44pt 이상이다', async () => {
    await open(await sample());
    for (const el of [...screen.getAllByRole('radio'), screen.getByRole('button', { name: '저장' })]) {
      const style = StyleSheet.flatten(el.props.style);
      expect(style.minHeight).toBeGreaterThanOrEqual(44);
    }
    for (const el of screen.getAllByRole('radio')) {
      expect(StyleSheet.flatten(el.props.style).minWidth).toBeGreaterThanOrEqual(44);
    }
  });

  test('고른 값 하나만 선택된 상태가 되고, 다시 고르면 바뀐다', async () => {
    const { user } = await open(await sample());
    await user.press(screen.getByRole('radio', { name: '체감 피로 7' }));
    expect(screen.getByRole('radio', { name: '체감 피로 7' })).toBeChecked();
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);

    await user.press(screen.getByRole('radio', { name: '체감 피로 4' }));
    expect(screen.getByRole('radio', { name: '체감 피로 4' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '체감 피로 7' })).not.toBeChecked();
  });
});

describe('저장', () => {
  test('피로를 고르지 않으면 저장이 안 된다', async () => {
    const store = createMemoryRecordStore();
    const { user } = await open(await sample(), store);

    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    expect(screen.getByText('체감 피로를 골라야 저장할 수 있어요.')).toBeTruthy();

    // 메모만 적고 눌러도 저장되지 않는다.
    await user.type(screen.getByLabelText('메모 (선택)'), '왼쪽 무릎이 조금 아파요');
    await user.press(screen.getByRole('button', { name: '저장' }));

    expect(store.all()).toEqual([]);
    expect(screen.queryByText('저장했어요')).toBeNull();
  });

  test('메모 없이도 저장된다', async () => {
    const store = createMemoryRecordStore();
    const { user } = await open(await sample(), store);

    await user.press(screen.getByRole('radio', { name: '체감 피로 3' }));
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
    expect(screen.queryByText('체감 피로를 골라야 저장할 수 있어요.')).toBeNull();
    await user.press(screen.getByRole('button', { name: '저장' }));

    expect(await screen.findByText('저장했어요')).toBeTruthy();
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0].userInput).toEqual({ perceivedExertion: 3, memo: null });
    expect(screen.queryByText('메모')).toBeNull();
  });

  test('빈칸뿐인 메모는 없는 메모로 저장된다', async () => {
    const store = createMemoryRecordStore();
    const { user } = await open(await sample(), store);

    await user.press(screen.getByRole('radio', { name: '체감 피로 5' }));
    await user.type(screen.getByLabelText('메모 (선택)'), '   ');
    await user.press(screen.getByRole('button', { name: '저장' }));

    await screen.findByText('저장했어요');
    expect(store.all()[0].userInput).toEqual({ perceivedExertion: 5, memo: null });
  });

  test.each(['apple_health', 'health_connect'] as const)('저장한 값이 기록에 붙는다 (%s)', async (platform) => {
    const record = await sample(platform);
    const store = createMemoryRecordStore();
    const { user } = await open(record, store);

    await user.press(screen.getByRole('radio', { name: '체감 피로 7' }));
    await user.type(screen.getByLabelText('메모 (선택)'), '  왼쪽 무릎이 조금 아파요 ');
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');

    // 체감 피로와 메모만 바뀌고, 건강 앱에서 온 나머지는 그대로다.
    expect(store.all()).toEqual([{ ...record, userInput: { perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' } }]);
    // 건강 앱에서 읽은 기록 자체는 고치지 않는다.
    expect(record.userInput).toEqual({ perceivedExertion: null, memo: null });

    // 저장한 뒤에는 묻는 칸이 사라지고, 기록에 붙은 값이 보인다.
    expect(screen.getByLabelText('체감 피로, 7')).toBeTruthy();
    expect(screen.getByLabelText('메모, 왼쪽 무릎이 조금 아파요')).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  });

  test('저장에 실패하면 알리고, 다시 누르면 저장된다', async () => {
    const memory = createMemoryRecordStore();
    const save = jest.fn(memory.save);
    save.mockRejectedValueOnce(new Error('저장 오류'));
    const { user } = await open(await sample(), { ...memory, save });

    await user.press(screen.getByRole('radio', { name: '체감 피로 8' }));
    await user.press(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('저장하지 못했어요. 다시 눌러 주세요.')).toBeTruthy();
    expect(screen.queryByText('저장했어요')).toBeNull();
    expect(memory.all()).toEqual([]);

    await user.press(screen.getByRole('button', { name: '저장' }));
    expect(await screen.findByText('저장했어요')).toBeTruthy();
    expect(memory.all()[0].userInput.perceivedExertion).toBe(8);
  });
});

describe('저장한 뒤 수정', () => {
  /** 체감 피로 7과 메모를 저장한 화면. */
  async function openSaved(platform: 'apple_health' | 'health_connect' = 'apple_health') {
    const record = await sample(platform);
    const store = createMemoryRecordStore();
    const { user } = await open(record, store);
    await user.press(screen.getByRole('radio', { name: '체감 피로 7' }));
    await user.type(screen.getByLabelText('메모 (선택)'), '왼쪽 무릎이 조금 아파요');
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');
    return { record, store, user };
  }

  test('수정을 누르면 저장한 값이 채워진 채로 다시 열린다', async () => {
    const { user } = await openSaved();
    await user.press(screen.getByRole('button', { name: '수정' }));

    expect(screen.getByRole('radio', { name: '체감 피로 7' })).toBeChecked();
    expect(screen.getAllByRole('radio', { checked: true })).toHaveLength(1);
    expect(screen.getByLabelText('메모 (선택)')).toHaveDisplayValue('왼쪽 무릎이 조금 아파요');
    expect(screen.getByRole('button', { name: '저장' })).toBeEnabled();
    // 고치는 중에는 "저장했어요"와 카드에 붙은 예전 값을 치운다.
    expect(screen.queryByText('저장했어요')).toBeNull();
    expect(screen.queryByLabelText('체감 피로, 7')).toBeNull();
  });

  test.each(['apple_health', 'health_connect'] as const)('고쳐서 저장하면 같은 기록의 값이 바뀐다 (%s)', async (platform) => {
    const { record, store, user } = await openSaved(platform);
    await user.press(screen.getByRole('button', { name: '수정' }));
    await user.press(screen.getByRole('radio', { name: '체감 피로 4' }));
    await user.clear(screen.getByLabelText('메모 (선택)'));
    await user.type(screen.getByLabelText('메모 (선택)'), '괜찮아졌어요');
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');

    // 기록이 하나 더 생기지 않고, 같은 기록의 체감 피로와 메모만 바뀐다.
    expect(store.all()).toEqual([{ ...record, userInput: { perceivedExertion: 4, memo: '괜찮아졌어요' } }]);
    expect(screen.getByLabelText('체감 피로, 4')).toBeTruthy();
    expect(screen.getByLabelText('메모, 괜찮아졌어요')).toBeTruthy();
    expect(screen.queryByText('왼쪽 무릎이 조금 아파요')).toBeNull();
  });

  test('메모를 지우고 저장하면 메모가 없는 기록이 된다', async () => {
    const { store, user } = await openSaved();
    await user.press(screen.getByRole('button', { name: '수정' }));
    await user.clear(screen.getByLabelText('메모 (선택)'));
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');

    expect(store.all()[0].userInput).toEqual({ perceivedExertion: 7, memo: null });
    expect(screen.queryByText('메모')).toBeNull();
  });

  test('취소하면 저장된 값 그대로이고, 다시 수정을 열어도 버린 값이 남아 있지 않다', async () => {
    const { store, user } = await openSaved();
    await user.press(screen.getByRole('button', { name: '수정' }));
    await user.press(screen.getByRole('radio', { name: '체감 피로 2' }));
    await user.type(screen.getByLabelText('메모 (선택)'), ' 그리고 발목도');
    await user.press(screen.getByRole('button', { name: '취소' }));

    expect(screen.getByText('저장했어요')).toBeTruthy();
    expect(screen.getByLabelText('체감 피로, 7')).toBeTruthy();
    expect(screen.getByLabelText('메모, 왼쪽 무릎이 조금 아파요')).toBeTruthy();
    expect(store.all()).toHaveLength(1);
    expect(store.all()[0].userInput).toEqual({ perceivedExertion: 7, memo: '왼쪽 무릎이 조금 아파요' });

    await user.press(screen.getByRole('button', { name: '수정' }));
    expect(screen.getByRole('radio', { name: '체감 피로 7' })).toBeChecked();
    expect(screen.getByLabelText('메모 (선택)')).toHaveDisplayValue('왼쪽 무릎이 조금 아파요');
  });

  test('처음 묻는 화면에는 취소가 없다', async () => {
    await open(await sample());
    expect(screen.queryByRole('button', { name: '취소' })).toBeNull();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
  });

  test('수정과 취소 버튼도 누르는 영역이 44pt 이상이다', async () => {
    const { user } = await openSaved();
    expect(StyleSheet.flatten(screen.getByRole('button', { name: '수정' }).props.style).minHeight).toBeGreaterThanOrEqual(44);
    await user.press(screen.getByRole('button', { name: '수정' }));
    expect(StyleSheet.flatten(screen.getByRole('button', { name: '취소' }).props.style).minHeight).toBeGreaterThanOrEqual(44);
  });
});

describe('이미 저장한 기록이 다시 들어올 때 (기기 저장소)', () => {
  beforeEach(async () => {
    await AsyncStorage.clear();
    jest.clearAllMocks();
  });

  type Platform = 'apple_health' | 'health_connect';

  /** 앱을 처음 열어 체감 피로(와 메모)를 저장하고 닫는다. */
  async function saveAndClose(platform: Platform, exertion: number, memo: string) {
    const { user } = await open(await sample(platform), createDeviceRecordStore());
    await user.press(screen.getByRole('radio', { name: new RegExp(`^체감 피로 ${exertion}(,|$)`) }));
    if (memo !== '') await user.type(screen.getByLabelText('메모 (선택)'), memo);
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');
    await screen.unmount();
  }

  /**
   * 앱을 다시 연다. 화면, 건강 앱, 저장소를 모두 새로 만든다. 남는 것은 기기 저장소(AsyncStorage)의 값뿐이다.
   * 건강 앱은 같은 운동을 다시 돌려준다(가져온 시각만 다르다).
   */
  async function reopen(platform: Platform) {
    const later = () => new Date('2026-11-06T09:00:00.000Z');
    const record = rec(await createFakeHealthReader(platform, later).readLatestWorkout());
    return open(record, createDeviceRecordStore());
  }

  function expectAskedLikeFirstTime() {
    expect(screen.getByText('이번 달리기는 얼마나 힘들었어요?')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(10);
    expect(screen.queryAllByRole('radio', { checked: true })).toHaveLength(0);
    expect(screen.getByLabelText('메모 (선택)')).toHaveDisplayValue('');
    expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
    expect(screen.queryByText('저장했어요')).toBeNull();
    expect(screen.queryByRole('button', { name: '수정' })).toBeNull();
  }

  function expectNotAsked() {
    expect(screen.queryByText('이번 달리기는 얼마나 힘들었어요?')).toBeNull();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);
    expect(screen.queryByLabelText('메모 (선택)')).toBeNull();
    expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  }

  test.each(['apple_health', 'health_connect'] as const)(
    '앱을 다시 열어도 다시 묻지 않고, 저장한 피로와 메모가 그대로 돌아온다 (%s)',
    async (platform) => {
      await saveAndClose(platform, 7, '왼쪽 무릎이 조금 아파요');
      await reopen(platform);

      expectNotAsked();
      expect(screen.getByLabelText('체감 피로, 7')).toBeTruthy();
      expect(screen.getByLabelText('메모, 왼쪽 무릎이 조금 아파요')).toBeTruthy();
      // 건강 앱에서 읽은 기록도 그대로 보인다.
      expect(screen.getByLabelText('거리, 5.01 km')).toBeTruthy();
      expect(screen.getByLabelText('평균 페이스, 5:42/km')).toBeTruthy();
      expect(screen.getByRole('button', { name: '수정' })).toBeTruthy();
    },
  );

  test('메모 없이 저장한 기록도 다시 묻지 않는다', async () => {
    await saveAndClose('apple_health', 3, '');
    await reopen('apple_health');

    expectNotAsked();
    expect(screen.getByLabelText('체감 피로, 3')).toBeTruthy();
    expect(screen.queryByText('메모')).toBeNull();
  });

  test('여러 번 다시 열어도 묻지 않는다', async () => {
    await saveAndClose('apple_health', 10, '');
    for (let i = 0; i < 3; i++) {
      await reopen('apple_health');
      expectNotAsked();
      expect(screen.getByLabelText('체감 피로, 10')).toBeTruthy();
      await screen.unmount();
    }
  });

  test('저장한 적이 없는 다른 기록이 들어오면 묻는다', async () => {
    await saveAndClose('apple_health', 7, '왼쪽 무릎이 조금 아파요');
    // 기록 번호가 다른 운동(헬스 커넥트 샘플).
    await reopen('health_connect');
    expectAskedLikeFirstTime();
  });

  test('다시 들어온 기록도 수정할 수 있고, 고친 값이 다음에 열 때 돌아온다', async () => {
    await saveAndClose('apple_health', 7, '왼쪽 무릎이 조금 아파요');
    const { user } = await reopen('apple_health');

    await user.press(screen.getByRole('button', { name: '수정' }));
    expect(screen.getByRole('radio', { name: '체감 피로 7' })).toBeChecked();
    expect(screen.getByLabelText('메모 (선택)')).toHaveDisplayValue('왼쪽 무릎이 조금 아파요');
    await user.press(screen.getByRole('radio', { name: '체감 피로 4' }));
    await user.clear(screen.getByLabelText('메모 (선택)'));
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');
    await screen.unmount();

    await reopen('apple_health');
    expectNotAsked();
    expect(screen.getByLabelText('체감 피로, 4')).toBeTruthy();
    expect(screen.queryByText('메모')).toBeNull();
    expect(await AsyncStorage.getAllKeys()).toHaveLength(1);
  });

  test('"저장했어요"는 방금 저장했을 때만 화면 낭독기가 새 소식으로 읽는다', async () => {
    const { user } = await open(await sample(), createDeviceRecordStore());
    await user.press(screen.getByRole('radio', { name: '체감 피로 7' }));
    await user.press(screen.getByRole('button', { name: '저장' }));
    expect((await screen.findByText('저장했어요')).props['aria-live']).toBe('polite');
    await screen.unmount();

    await reopen('apple_health');
    expect(screen.getByText('저장했어요').props['aria-live']).toBe('off');
  });

  test.each<[string, string]>([
    ['잘린 JSON', '{"version":1,"source":"apple_health","perceivedEx'],
    ['JSON이 아닌 글자', '체감 피로 7'],
    ['빈 글자', ''],
    ['형식 번호가 다르다', '{"version":2,"source":"apple_health","sourceRecordId":"6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B","perceivedExertion":7,"memo":null}'],
    ['체감 피로가 범위 밖이다', '{"version":1,"source":"apple_health","sourceRecordId":"6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B","perceivedExertion":70,"memo":null}'],
    ['메모가 글자가 아니다', '{"version":1,"source":"apple_health","sourceRecordId":"6F1C2A8E-3B4D-4E5F-9A0B-1C2D3E4F5A6B","perceivedExertion":7,"memo":{"text":"무릎"}}'],
  ])('저장된 값이 깨졌으면 죽지 않고 처음처럼 다시 묻는다: %s', async (_name, stored) => {
    await saveAndClose('apple_health', 7, '왼쪽 무릎이 조금 아파요');
    const key = rec(storageKey((await sample()).origin));
    expect(await AsyncStorage.getItem(key)).not.toBeNull();
    await AsyncStorage.setItem(key, stored);

    const { user } = await reopen('apple_health');
    // 기록은 그대로 보이고, 깨진 값의 흔적은 화면에 없다.
    expect(screen.getByLabelText('거리, 5.01 km')).toBeTruthy();
    expect(screen.queryByText('기록을 읽지 못했어요.')).toBeNull();
    expect(screen.queryByText(/무릎/)).toBeNull();
    expectAskedLikeFirstTime();

    // 다시 답하면 저장되고, 그다음부터는 묻지 않는다.
    await user.press(screen.getByRole('radio', { name: '체감 피로 5' }));
    await user.press(screen.getByRole('button', { name: '저장' }));
    await screen.findByText('저장했어요');
    await screen.unmount();

    await reopen('apple_health');
    expectNotAsked();
    expect(screen.getByLabelText('체감 피로, 5')).toBeTruthy();
  });

  test('기기 저장소를 읽지 못하면 묻지 않고 알린다. 다시 읽으면 저장된 값이 보인다', async () => {
    await saveAndClose('apple_health', 7, '');
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('디스크 오류'));
    await render(<AfterRunScreen reader={readerOf(await sample())} store={createDeviceRecordStore()} />);

    expect(await screen.findByText('기록을 읽지 못했어요.')).toBeTruthy();
    expect(screen.queryAllByRole('radio')).toHaveLength(0);

    await userEvent.setup().press(screen.getByRole('button', { name: '다시 읽기' }));
    expect(await screen.findByLabelText('체감 피로, 7')).toBeTruthy();
    expectNotAsked();
  });
});

test('메모리 저장소도 같은 화면에서 다시 묻지 않는다 (저장소를 바꿔도 화면은 그대로다)', async () => {
  const store = createMemoryRecordStore();
  const { user } = await open(await sample(), store);
  await user.press(screen.getByRole('radio', { name: '체감 피로 6' }));
  await user.type(screen.getByLabelText('메모 (선택)'), '가벼웠어요');
  await user.press(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('저장했어요');
  await screen.unmount();

  await open(await sample(), store);
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(screen.getByLabelText('체감 피로, 6')).toBeTruthy();
  expect(screen.getByLabelText('메모, 가벼웠어요')).toBeTruthy();
});

test('컨디션, 목표, 내일 훈련, 통증 판단은 보여 주지 않는다', async () => {
  const { user } = await open(await sample());
  const judged = /컨디션|목표|내일|훈련|진단|진료|통증|쉬어요|강도/;
  expect(screen.queryByText(judged)).toBeNull();

  await user.press(screen.getByRole('radio', { name: '체감 피로 9' }));
  await user.type(screen.getByLabelText('메모 (선택)'), '종아리 통증');
  await user.press(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('저장했어요');

  // 사용자가 적은 메모는 그대로 보이지만, 그 밖에 판단하는 말은 없다.
  expect(screen.getAllByText(judged).map((el) => el.props.children)).toEqual(['종아리 통증']);
});
