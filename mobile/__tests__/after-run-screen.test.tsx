import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

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
    const { user } = await open(await sample(), { save });

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
