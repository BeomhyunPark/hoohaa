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
});
