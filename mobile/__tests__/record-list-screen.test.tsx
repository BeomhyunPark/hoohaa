import { render, screen, userEvent } from '@testing-library/react-native';

import { createFakeHealthReader, type RecordLister } from '../src/record/health-reader';
import { manualRecord } from '../src/record/manual';
import { createMemoryRecordStore, type RecordStore } from '../src/record/store';
import type { WorkoutRecord } from '../src/record/types';
import { withUserInput } from '../src/record/user-input';
import { RecordListScreen } from '../src/screens/RecordListScreen';
import { rec } from '../test-utils/record';

const now = () => new Date('2026-11-12T22:10:00.000Z');

const typed = () =>
  manualRecord('m-1', now().toISOString(), {
    startTime: '2026-11-12T21:10:00.000Z', // 11월 13일 오전 6:10(서울)
    startTimeEntered: true,
    durationSeconds: 3300,
    distanceMeters: 10000,
    averageBpm: null,
    averageCadenceSpm: null,
  });

const health = async () => rec(await createFakeHealthReader('apple_health', now).readLatestWorkout());

async function open(records: WorkoutRecord[], store: RecordStore = createMemoryRecordStore(), lister?: RecordLister) {
  const on = { open: jest.fn<void, [WorkoutRecord]>(), add: jest.fn(), back: jest.fn() };
  await render(
    <RecordListScreen
      lister={lister ?? { list: async () => records }}
      store={store}
      onOpen={on.open}
      onAddManual={on.add}
      onBack={on.back}
    />,
  );
  return { on, user: userEvent.setup() };
}

test('기록마다 날짜, 거리, 시간, 평균 페이스를 한 줄로 보여 준다. 직접 입력한 기록에는 표시가 붙는다', async () => {
  await open([typed(), await health()]);
  expect(await screen.findByRole('button', { name: '11월 13일 (금) 오전 6:10, 10.00 km, 55:00, 5:30/km, 직접 입력' })).toBeTruthy();
  expect(screen.getByRole('button', { name: '11월 6일 (금) 오전 6:30, 5.01 km, 28:32, 5:42/km' })).toBeTruthy();
  expect(screen.getByText('10.00 km · 55:00 · 5:30/km')).toBeTruthy();
});

test('체감 피로를 저장해 둔 기록에는 그 값이 붙는다', async () => {
  const store = createMemoryRecordStore();
  await store.save(withUserInput(typed(), { perceivedExertion: 4, memo: '' }));
  await open([typed(), await health()], store);
  expect(await screen.findByText('직접 입력 · 체감 피로 4')).toBeTruthy();
  expect(screen.queryAllByText(/체감 피로/)).toHaveLength(1);
});

test('한 줄을 누르면 그 기록을 연다', async () => {
  const { on, user } = await open([typed(), await health()]);
  await user.press(await screen.findByRole('button', { name: /, 직접 입력$/ }));
  expect(on.open).toHaveBeenCalledWith(typed());
});

test('기록이 없으면 그렇다고 알린다', async () => {
  await open([]);
  expect(await screen.findByText('아직 기록이 없어요.')).toBeTruthy();
});

test('읽지 못하면 알리고, 다시 읽기를 누르면 다시 읽는다', async () => {
  const list = jest.fn<Promise<WorkoutRecord[]>, []>().mockRejectedValueOnce(new Error('읽기 실패')).mockResolvedValue([typed()]);
  const { user } = await open([], createMemoryRecordStore(), { list });
  expect(await screen.findByText('기록을 읽지 못했어요.')).toBeTruthy();
  await user.press(screen.getByRole('button', { name: '다시 읽기' }));
  expect(await screen.findByRole('button', { name: /, 직접 입력$/ })).toBeTruthy();
});

test('돌아가기와 기록 직접 입력 버튼이 있다', async () => {
  const { on, user } = await open([]);
  await screen.findByText('아직 기록이 없어요.');
  await user.press(screen.getByRole('button', { name: '돌아가기' }));
  await user.press(screen.getByRole('button', { name: '기록 직접 입력' }));
  expect(on.back).toHaveBeenCalledTimes(1);
  expect(on.add).toHaveBeenCalledTimes(1);
});
