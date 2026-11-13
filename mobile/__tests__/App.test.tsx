import { render, screen } from '@testing-library/react-native';

import App from '../App';

test('앱을 열면 가짜 건강 앱의 샘플 기록과 체감 피로 질문이 보인다', async () => {
  await render(<App />);
  expect(screen.getByText('hoohaa')).toBeTruthy();
  expect(await screen.findByText('운동 기록')).toBeTruthy();
  // 테스트 환경의 Platform.OS는 ios라 애플 건강 샘플이 들어온다.
  expect(screen.getByText('5:42/km')).toBeTruthy();
  expect(screen.getByText('이번 달리기는 얼마나 힘들었어요?')).toBeTruthy();
  expect(screen.getByRole('button', { name: '저장' })).toBeDisabled();
});
