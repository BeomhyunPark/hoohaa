import { render, screen } from '@testing-library/react-native';

import App from '../App';

test('빈 화면에 hoohaa 글자가 그려진다', async () => {
  await render(<App />);
  expect(screen.getByText('hoohaa')).toBeTruthy();
});
