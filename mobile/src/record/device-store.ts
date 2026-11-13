// 기기 안에 두는 저장소(AsyncStorage). 앱을 닫았다 열어도 남는다. 계정과 서버는 없다.
//
// 기기에는 체감 피로와 메모만 둔다. 거리, 심박, 경로 같은 측정값은 건강 앱이 갖고 있고 앱을 열 때마다 다시 읽으므로
// 여기에 복사하지 않는다(경로와 심박 표본까지 넣으면 기록 하나가 AsyncStorage의 한 칸에 담기에 너무 커진다).
//
// 기록 하나 = 키 하나. 한 칸이 깨져도 다른 기록은 그대로다.
//   키: hoohaa/user-input/<가져온 곳>/<그곳의 기록 번호>
//   값: {"version":1,"source":"apple_health","sourceRecordId":"…","perceivedExertion":7,"memo":"…"}  (메모가 없으면 null)
//
// source, sourceRecordId라는 이름은 아직 제안이다(docs/v4/features/health-import.md). 이름이 정해져 바뀌면
// SAVED_VERSION을 올린다. 예전 값을 옮기는 코드를 같이 넣지 않으면 그 기록들은 처음처럼 다시 묻게 된다.
import AsyncStorage from '@react-native-async-storage/async-storage';

import type { RecordKey, RecordStore, SavedUserInput } from './store';
import { isPerceivedExertion } from './user-input';

/** 저장 형식의 번호. 값의 모양을 바꾸면 올린다. 번호가 다른 값은 읽지 않는다(그 기록은 처음처럼 다시 묻는다). */
export const SAVED_VERSION = 1;

const KEY_PREFIX = 'hoohaa/user-input/';

/** 기록 하나의 저장 키. 기록 번호가 없는 기록(직접 입력)은 키가 없다. */
export function storageKey(key: RecordKey): string | null {
  // 가져온 곳은 빗금이 없는 정해진 값이라, 기록 번호에 어떤 글자가 있어도 키가 겹치지 않는다.
  return key.sourceRecordId === null ? null : `${KEY_PREFIX}${key.source}/${key.sourceRecordId}`;
}

/**
 * 저장된 글자를 체감 피로와 메모로 읽는다. 쓸 수 없는 값이면 null이다. 던지지 않는다.
 * 쓸 수 없는 값: JSON이 아니다, 형식 번호가 다르다, 다른 기록의 값이다, 체감 피로가 1~10의 정수가 아니다,
 * 메모가 글자도 null도 아니다(빈 메모는 null로 저장하므로 빈 글자도 쓸 수 없는 값이다).
 */
export function parseSaved(text: string, key: RecordKey): SavedUserInput | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.version !== SAVED_VERSION) return null;
  if (v.source !== key.source || v.sourceRecordId !== key.sourceRecordId) return null;
  if (!isPerceivedExertion(v.perceivedExertion)) return null;
  if (v.memo !== null && (typeof v.memo !== 'string' || v.memo.trim() === '')) return null;
  return { perceivedExertion: v.perceivedExertion, memo: v.memo };
}

export function createDeviceRecordStore(): RecordStore {
  return {
    async findUserInput(key) {
      const at = storageKey(key);
      if (at === null) return null;
      // getItem이 실패하면(기기 저장소를 읽지 못함) 그대로 reject한다. 화면이 "다시 읽기"를 보여 준다.
      const text = await AsyncStorage.getItem(at);
      return text === null ? null : parseSaved(text, key);
    },

    async save(record) {
      const at = storageKey(record.origin);
      if (at === null) {
        // 직접 입력 기록은 다시 찾을 기준이 아직 없다. 저장한 척하지 않는다.
        throw new Error('기록 번호가 없는 기록은 기기에 저장할 수 없다');
      }
      const { perceivedExertion, memo } = record.userInput;
      if (!isPerceivedExertion(perceivedExertion)) {
        throw new RangeError(`체감 피로는 1~10의 정수여야 한다: ${perceivedExertion}`);
      }
      const saved = {
        version: SAVED_VERSION,
        source: record.origin.source,
        sourceRecordId: record.origin.sourceRecordId,
        perceivedExertion,
        memo,
      };
      await AsyncStorage.setItem(at, JSON.stringify(saved));
    },
  };
}
