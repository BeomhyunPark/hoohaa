import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';

import App from '../App';

beforeEach(async () => {
  await AsyncStorage.clear();
});

test('앱을 열면 가짜 건강 앱의 샘플 기록과 체감 피로 질문이 보인다', async () => {
  await render(<App />);
  expect(screen.getByText('hoohaa')).toBeTruthy();
  expect(await screen.findByText('운동 기록')).toBeTruthy();
  // 테스트 환경의 Platform.OS는 ios라 애플 건강 샘플이 들어온다.
  expect(screen.getByText('5:42/km')).toBeTruthy();
  expect(screen.getByText('이번 달리기는 얼마나 힘들었어요?')).toBeTruthy();
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
});

test('체감 피로와 메모를 저장하고 앱을 닫았다 열면, 다시 묻지 않고 저장한 값을 보여 준다', async () => {
  const user = userEvent.setup();
  await render(<App />);
  await screen.findByText('운동 기록');
  await user.press(screen.getByRole('radio', { name: '체감 피로 7' }));
  await user.type(screen.getByLabelText('메모 (선택)'), '왼쪽 무릎이 조금 아파요');
  await user.press(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('저장했어요');
  await screen.unmount();

  // 앱 전체를 새로 그린다. 남는 것은 기기 저장소뿐이다.
  await render(<App />);
  expect(await screen.findByLabelText('체감 피로, 7')).toBeTruthy();
  expect(screen.getByLabelText('메모, 왼쪽 무릎이 조금 아파요')).toBeTruthy();
  expect(screen.queryByText('이번 달리기는 얼마나 힘들었어요?')).toBeNull();
  expect(screen.queryAllByRole('radio')).toHaveLength(0);
  expect(screen.queryByRole('button', { name: '저장' })).toBeNull();
  expect(screen.queryByText('저장했어요')).toBeNull();
  expect(screen.getByRole('button', { name: '수정' })).toBeTruthy();
});

test('기록을 직접 입력하면 바로 그 기록의 체감 피로를 묻고, 앱을 닫았다 열어도 그 기록이 저장된 값과 함께 보인다', async () => {
  const user = userEvent.setup();
  await render(<App />);
  await screen.findByText('운동 기록');
  await user.press(screen.getByRole('button', { name: '기록 직접 입력' }));

  // 날짜는 오늘로 채워져 있다. 샘플 달리기(11월 6일)보다 뒤라서 다시 열었을 때 이 기록이 가장 최근이다.
  await user.type(screen.getByLabelText('거리 (km)'), '10');
  await user.type(screen.getByLabelText('시간'), '5500');
  await user.type(screen.getByLabelText('평균 케이던스 (spm)'), '176');
  await user.press(screen.getByRole('button', { name: '저장' }));

  expect(await screen.findByLabelText('거리, 10.00 km')).toBeTruthy();
  expect(screen.getByLabelText('시간, 55:00')).toBeTruthy();
  expect(screen.getByLabelText('평균 케이던스, 176 spm')).toBeTruthy();
  expect(screen.getByText('이번 달리기는 얼마나 힘들었어요?')).toBeTruthy();
  await user.press(screen.getByRole('radio', { name: '체감 피로 4' }));
  await user.press(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('저장했어요');
  await screen.unmount();

  await render(<App />);
  expect(await screen.findByLabelText('거리, 10.00 km')).toBeTruthy();
  expect(screen.getByLabelText('체감 피로, 4')).toBeTruthy();
  expect(screen.queryByText('이번 달리기는 얼마나 힘들었어요?')).toBeNull();
});

test('직접 입력을 취소하면 보던 기록으로 돌아간다', async () => {
  const user = userEvent.setup();
  await render(<App />);
  await screen.findByText('운동 기록');
  await user.press(screen.getByRole('button', { name: '기록 직접 입력' }));
  await user.press(screen.getByRole('button', { name: '취소' }));
  expect(await screen.findByText('5:42/km')).toBeTruthy();
});

test('지난 날짜로 적은 기록도 목록에서 찾아 고치고 지울 수 있다', async () => {
  const user = userEvent.setup();
  await render(<App />);
  await screen.findByText('운동 기록');

  // 샘플 달리기(11월 6일)보다 앞선 날짜로 적는다.
  await user.press(screen.getByRole('button', { name: '기록 직접 입력' }));
  await user.clear(screen.getByLabelText('날짜'));
  await user.type(screen.getByLabelText('날짜'), '20261101');
  await user.type(screen.getByLabelText('거리 (km)'), '10');
  await user.type(screen.getByLabelText('시간'), '5500');
  await user.press(screen.getByRole('button', { name: '저장' }));
  await screen.findByLabelText('거리, 10.00 km');
  await user.press(screen.getByRole('radio', { name: '체감 피로 4' }));
  await user.press(screen.getByRole('button', { name: '저장' }));
  await screen.findByText('저장했어요');

  // 목록: 샘플이 앞, 지난 날짜로 적은 기록이 뒤.
  await user.press(screen.getByRole('button', { name: '지난 기록' }));
  const typed = await screen.findByRole('button', { name: '11월 1일 (일), 10.00 km, 55:00, 5:30/km, 직접 입력, 체감 피로 4' });
  expect(screen.getByRole('button', { name: /^11월 6일/ })).toBeTruthy();

  // 열어서 거리를 고친다. 체감 피로는 그대로 붙어 있다.
  await user.press(typed);
  await screen.findByLabelText('체감 피로, 4');
  await user.press(screen.getByRole('button', { name: '기록 고치기' }));
  await user.clear(screen.getByLabelText('거리 (km)'));
  await user.type(screen.getByLabelText('거리 (km)'), '11');
  await user.press(screen.getByRole('button', { name: '저장' }));
  expect(await screen.findByLabelText('거리, 11.00 km')).toBeTruthy();
  expect(screen.getByLabelText('체감 피로, 4')).toBeTruthy();
  expect(screen.queryByText('이번 달리기는 얼마나 힘들었어요?')).toBeNull();

  // 지우면 목록으로 가고, 기기에 그 기록의 것은 아무것도 남지 않는다.
  await user.press(screen.getByRole('button', { name: '기록 지우기' }));
  await user.press(screen.getByRole('button', { name: '지우기' }));
  expect(await screen.findByRole('button', { name: /^11월 6일/ })).toBeTruthy();
  expect(screen.queryByRole('button', { name: /, 직접 입력/ })).toBeNull();
  expect(await AsyncStorage.getAllKeys()).toEqual([]);

  // 돌아가면 가장 최근 기록(샘플)이다.
  await user.press(screen.getByRole('button', { name: '돌아가기' }));
  expect(await screen.findByText('5:42/km')).toBeTruthy();
});
