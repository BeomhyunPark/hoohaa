import { render, screen, userEvent } from '@testing-library/react-native';

import { createMemoryManualRecordStore, type ManualRecordStore } from '../src/record/manual-store';
import type { WorkoutRecord } from '../src/record/types';
import { ManualEntryScreen } from '../src/screens/ManualEntryScreen';

// jest는 서울 시간대로 돈다. 2026-11-13 (금) 오전 7:10.
const now = () => new Date('2026-11-12T22:10:00.000Z');

async function open(store: ManualRecordStore & { all(): WorkoutRecord[] } = createMemoryManualRecordStore()) {
  const onSaved = jest.fn<void, [WorkoutRecord]>();
  const onCancel = jest.fn();
  await render(<ManualEntryScreen store={store} onSaved={onSaved} onCancel={onCancel} now={now} />);
  return { store, onSaved, onCancel, user: userEvent.setup() };
}

test('날짜는 오늘로 채워져 있고 나머지 칸은 비어 있다', async () => {
  await open();
  expect(screen.getByText('기록 직접 입력')).toBeTruthy();
  expect(screen.getByLabelText('날짜')).toHaveDisplayValue('2026-11-13');
  expect(screen.getByLabelText('거리 (km)')).toHaveDisplayValue('');
  expect(screen.getByLabelText('시간')).toHaveDisplayValue('');
  expect(screen.getByText('자세히 (선택)')).toBeTruthy();
});

test('날짜, 거리, 시간만 적고 저장하면 번호가 붙은 기록이 저장되고 넘어간다', async () => {
  const { store, onSaved, user } = await open();
  await user.type(screen.getByLabelText('거리 (km)'), '5.01');
  await user.type(screen.getByLabelText('시간'), '2832');
  // 숫자만 눌러도 콜론이 붙는다.
  expect(screen.getByLabelText('시간')).toHaveDisplayValue('28:32');
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(onSaved).toHaveBeenCalledTimes(1);
  const record = onSaved.mock.calls[0][0];
  expect(record.origin.source).toBe('manual');
  expect(record.origin.sourceRecordId).toMatch(/^m-[0-9a-z]+-[0-9a-z]{8}$/);
  expect(record.origin.importedAt).toBe('2026-11-12T22:10:00.000Z');
  expect(record.measured).toMatchObject({ durationSeconds: 1712, distanceMeters: 5010, heartRate: null, averageCadenceSpm: null });
  expect(store.all()).toEqual([record]);
});

test('선택 항목을 적으면 기록에 들어간다', async () => {
  const { onSaved, user } = await open();
  await user.type(screen.getByLabelText('거리 (km)'), '5.01');
  await user.type(screen.getByLabelText('시간'), '2832');
  await user.type(screen.getByLabelText('시작 시각'), '0630');
  expect(screen.getByLabelText('시작 시각')).toHaveDisplayValue('06:30');
  await user.type(screen.getByLabelText('평균 심박 (bpm)'), '156');
  await user.type(screen.getByLabelText('평균 케이던스 (spm)'), '176');
  await user.press(screen.getByRole('button', { name: '저장' }));

  const record = onSaved.mock.calls[0][0];
  expect(record.measured.startTime).toBe('2026-11-12T21:30:00.000Z');
  expect(record.measured.heartRate?.averageBpm).toBe(156);
  expect(record.measured.averageCadenceSpm).toBe(176);
});

test('꼭 받는 칸이 비었으면 저장하지 않고 칸마다 알린다. 고치기 시작하면 그 칸의 알림은 사라진다', async () => {
  const { store, onSaved, user } = await open();
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(screen.getByText('거리를 적어 주세요.')).toBeTruthy();
  expect(screen.getByText('시간을 적어 주세요.')).toBeTruthy();
  expect(onSaved).not.toHaveBeenCalled();
  expect(store.all()).toEqual([]);

  await user.type(screen.getByLabelText('거리 (km)'), '5');
  expect(screen.queryByText('거리를 적어 주세요.')).toBeNull();
  expect(screen.getByText('시간을 적어 주세요.')).toBeTruthy();
});

test('틀리게 적은 선택 칸이 있으면 저장하지 않는다', async () => {
  const { onSaved, user } = await open();
  await user.type(screen.getByLabelText('거리 (km)'), '5.01');
  await user.type(screen.getByLabelText('시간'), '2832');
  await user.type(screen.getByLabelText('평균 심박 (bpm)'), '20');
  await user.press(screen.getByRole('button', { name: '저장' }));
  expect(screen.getByText('평균 심박은 30에서 250 사이로 적어 주세요.')).toBeTruthy();
  expect(onSaved).not.toHaveBeenCalled();
});

test('오늘보다 뒤의 날짜는 받지 않는다', async () => {
  const { onSaved, user } = await open();
  await user.clear(screen.getByLabelText('날짜'));
  await user.type(screen.getByLabelText('날짜'), '20261114');
  await user.type(screen.getByLabelText('거리 (km)'), '5.01');
  await user.type(screen.getByLabelText('시간'), '2832');
  await user.press(screen.getByRole('button', { name: '저장' }));
  expect(screen.getByText('오늘보다 뒤의 날짜는 넣을 수 없어요.')).toBeTruthy();
  expect(onSaved).not.toHaveBeenCalled();
});

test('저장하지 못하면 알리고, 적은 값은 그대로 두며, 다시 누를 수 있다', async () => {
  const store = createMemoryManualRecordStore();
  const save = jest.spyOn(store, 'save').mockRejectedValueOnce(new Error('공간 없음'));
  const { onSaved, user } = await open(store);
  await user.type(screen.getByLabelText('거리 (km)'), '5.01');
  await user.type(screen.getByLabelText('시간'), '2832');
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByText('저장하지 못했어요. 다시 눌러 주세요.')).toBeTruthy();
  expect(onSaved).not.toHaveBeenCalled();
  expect(screen.getByLabelText('거리 (km)')).toHaveDisplayValue('5.01');

  await user.press(screen.getByRole('button', { name: '저장' }));
  expect(save).toHaveBeenCalledTimes(2);
  expect(onSaved).toHaveBeenCalledTimes(1);
});

test('취소하면 저장하지 않고 돌아간다', async () => {
  const { store, onSaved, onCancel, user } = await open();
  await user.type(screen.getByLabelText('거리 (km)'), '5.01');
  await user.press(screen.getByRole('button', { name: '취소' }));
  expect(onCancel).toHaveBeenCalledTimes(1);
  expect(onSaved).not.toHaveBeenCalled();
  expect(store.all()).toEqual([]);
});
