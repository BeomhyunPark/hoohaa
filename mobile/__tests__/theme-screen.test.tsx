import AsyncStorage from '@react-native-async-storage/async-storage';
import { render, screen, userEvent } from '@testing-library/react-native';
import { StyleSheet } from 'react-native';

import App from '../App';
import { ThemeScreen } from '../src/screens/ThemeScreen';
import { ThemeProvider } from '../src/theme/theme';
import { loadThemeName, saveThemeName, THEME_KEY } from '../src/theme/theme-store';
import { exertionValue, pickExertion } from '../test-utils/exertion';

beforeEach(async () => {
  await AsyncStorage.clear();
  jest.clearAllMocks();
});

describe('고른 테마 저장', () => {
  test('저장한 적이 없으면 볼트다', async () => {
    expect(await loadThemeName()).toBe('volt');
  });

  test('저장한 테마가 돌아온다', async () => {
    await saveThemeName('sunset');
    expect(await loadThemeName()).toBe('sunset');
  });

  test.each(['', 'red', '{"name":"sunset"}'])('모르는 값(%j)이면 볼트다', async (stored) => {
    await AsyncStorage.setItem(THEME_KEY, stored);
    expect(await loadThemeName()).toBe('volt');
  });

  test('기기 저장소를 읽지 못해도 볼트로 뜬다', async () => {
    jest.mocked(AsyncStorage.getItem).mockRejectedValueOnce(new Error('디스크 오류'));
    expect(await loadThemeName()).toBe('volt');
  });
});

describe('화면 색 고르기', () => {
  test('테마 셋을 라디오로 보여 주고, 지금 테마가 골라져 있다', async () => {
    await render(
      <ThemeProvider name="nightSky">
        <ThemeScreen onChange={jest.fn()} onBack={jest.fn()} />
      </ThemeProvider>,
    );
    expect(screen.getByText('앱 화면의 색을 골라요. 고른 색은 이 기기에만 저장돼요.')).toBeTruthy();
    expect(screen.getAllByRole('radio')).toHaveLength(3);
    expect(screen.getByRole('radio', { name: '밤하늘' })).toBeChecked();
    expect(screen.getByRole('radio', { name: '볼트' })).not.toBeChecked();
    expect(screen.getByRole('radio', { name: '노을' })).not.toBeChecked();
  });

  test('누르면 그 테마를 넘기고, 돌아가기를 누르면 닫는다', async () => {
    const onChange = jest.fn(), onBack = jest.fn(), user = userEvent.setup();
    await render(<ThemeScreen onChange={onChange} onBack={onBack} />);
    await user.press(screen.getByRole('radio', { name: '노을' }));
    expect(onChange).toHaveBeenCalledWith('sunset');
    await user.press(screen.getByRole('button', { name: '돌아가기' }));
    expect(onBack).toHaveBeenCalled();
  });

  test('누르는 영역은 44pt 이상이다', async () => {
    await render(<ThemeScreen onChange={jest.fn()} onBack={jest.fn()} />);
    for (const el of [...screen.getAllByRole('radio'), screen.getByRole('button', { name: '돌아가기' })]) {
      expect(StyleSheet.flatten(el.props.style).minHeight).toBeGreaterThanOrEqual(44);
    }
  });

  test('저장하지 못했으면 알린다', async () => {
    await render(<ThemeScreen onChange={jest.fn()} onBack={jest.fn()} saveFailed />);
    expect(screen.getByText('이 기기에 저장하지 못했어요. 앱을 다시 열면 전에 고른 색으로 보여요.')).toBeTruthy();
  });
});

describe('앱에서', () => {
  test('맨 위 "화면 색"으로 열어 고르면 바로 바뀌고, 앱을 다시 열어도 그 색이다', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await screen.findByText('운동 기록');
    await user.press(screen.getByRole('button', { name: '화면 색' }));
    expect(screen.getByRole('radio', { name: '볼트' })).toBeChecked();
    await user.press(screen.getByRole('radio', { name: '밤하늘' }));
    expect(screen.getByRole('radio', { name: '밤하늘' })).toBeChecked();
    expect(await AsyncStorage.getItem(THEME_KEY)).toBe('nightSky');
    await user.press(screen.getByRole('button', { name: '돌아가기' }));
    expect(await screen.findByText('운동 기록')).toBeTruthy();
    await screen.unmount();

    await render(<App />);
    await screen.findByText('운동 기록');
    await user.press(screen.getByRole('button', { name: '화면 색' }));
    expect(screen.getByRole('radio', { name: '밤하늘' })).toBeChecked();
  });

  test('화면 색을 고르고 돌아와도 고르던 체감 피로와 적던 메모가 그대로다', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await screen.findByText('운동 기록');
    await pickExertion(6);
    await user.type(screen.getByLabelText('메모 (선택)'), '바람이 셌어요');
    await user.press(screen.getByRole('button', { name: '화면 색' }));
    // 보던 화면은 숨겨져 있다.
    expect(screen.queryByText('운동 기록')).toBeNull();
    await user.press(screen.getByRole('radio', { name: '노을' }));
    await user.press(screen.getByRole('button', { name: '돌아가기' }));

    expect(exertionValue()).toBe(6);
    expect(screen.getByLabelText('메모 (선택)')).toHaveDisplayValue('바람이 셌어요');
  });

  test('기기에 저장하지 못해도 이번에는 바뀌고, 그렇다고 알린다', async () => {
    const user = userEvent.setup();
    await render(<App />);
    await screen.findByText('운동 기록');
    jest.mocked(AsyncStorage.setItem).mockRejectedValueOnce(new Error('디스크 오류'));
    await user.press(screen.getByRole('button', { name: '화면 색' }));
    await user.press(screen.getByRole('radio', { name: '노을' }));
    expect(screen.getByRole('radio', { name: '노을' })).toBeChecked();
    expect(await screen.findByText('이 기기에 저장하지 못했어요. 앱을 다시 열면 전에 고른 색으로 보여요.')).toBeTruthy();
  });
});
