// 테스트에서 체감 피로 슬라이더를 다루는 도우미.
import { fireEvent, screen } from '@testing-library/react-native';

/** 테스트에서 쓰는 슬라이더 폭. 실제 폭과 상관없이 값 n은 n번째 칸의 가운데를 누른 것으로 친다. */
const WIDTH = 350;

export const exertionSlider = () => screen.getByTestId('exertion-slider');
export const queryExertionSlider = () => screen.queryByTestId('exertion-slider');

/** 트랙에서 값 n(1~10)의 칸을 누른다. */
export async function pickExertion(value: number) {
  const slider = exertionSlider();
  await fireEvent(slider, 'layout', { nativeEvent: { layout: { x: 0, y: 0, width: WIDTH, height: 48 } } });
  const x = ((value - 0.5) / 10) * WIDTH;
  await fireEvent(slider, 'responderGrant', { nativeEvent: { locationX: x, locationY: 24 } });
  await fireEvent(slider, 'responderRelease', { nativeEvent: { locationX: x, locationY: 24 } });
}

/** 화면 낭독기의 올리기·내리기 동작. */
export async function adjustExertion(action: 'increment' | 'decrement') {
  await fireEvent(exertionSlider(), 'accessibilityAction', { nativeEvent: { actionName: action } });
}

/** 슬라이더가 가진 값. 고르지 않았으면 undefined다. */
export const exertionValue = (): number | undefined => exertionSlider().props['aria-valuenow'] ?? exertionSlider().props.accessibilityValue?.now;
