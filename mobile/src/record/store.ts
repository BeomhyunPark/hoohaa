// 기록을 두는 자리. 화면은 이 인터페이스만 본다.
//
// 구현은 둘이다. 메모리(아래, 테스트용. 닫으면 사라진다)와 기기(device-store.ts, 앱이 쓴다).
// 나중에 서버(<개발용 API 주소>)에 둘 때도 이 인터페이스를 따르는 구현을 하나 더 만들고 App.tsx에서 바꿔 넣는다.
// 화면 코드는 고치지 않는다.
import type { RecordOrigin, WorkoutRecord } from './types';
import { isPerceivedExertion } from './user-input';

/**
 * 기록을 찾는 기준. 가져온 곳과 그곳의 기록 번호, 이 둘뿐이다.
 * 두 기록이 같은 운동인지 보는 기준(다른 곳에서 온 같은 달리기)은 아직 정하지 않았다. 여기서 하지 않는다.
 */
export type RecordKey = Pick<RecordOrigin, 'source' | 'sourceRecordId'>;

/** 저장해 둔 체감 피로와 메모. 체감 피로(1~10)가 있어야 저장한 것이다. 메모는 없으면 null. */
export interface SavedUserInput {
  perceivedExertion: number;
  memo: string | null;
}

export interface RecordStore {
  /**
   * 이 기록에 저장해 둔 체감 피로와 메모. 화면은 이 값이 있으면 다시 묻지 않는다.
   * null은 "처음처럼 물어도 된다"는 뜻이다: 저장한 적이 없거나, 저장된 값을 쓸 수 없을 때(깨졌거나 형식이 다르다).
   * 저장소 자체를 읽지 못하면 null이 아니라 reject한다. 값이 있는지 모르는 채로 다시 묻지 않기 위해서다.
   */
  findUserInput(key: RecordKey): Promise<SavedUserInput | null>;

  /**
   * 체감 피로와 메모가 붙은 기록을 저장한다. 가져온 곳과 그곳의 기록 번호가 같은 기록이 이미 있으면 그 자리를 바꾼다
   * (같은 기록을 두 번 저장하지 않는다). 저장하지 못하면 reject한다.
   */
  save(record: WorkoutRecord): Promise<void>;
}

export function sameRecord(a: RecordKey, b: RecordKey): boolean {
  return a.source === b.source && a.sourceRecordId === b.sourceRecordId;
}

export interface MemoryRecordStore extends RecordStore {
  /** 지금까지 저장한 기록 전부(저장한 순서). */
  all(): WorkoutRecord[];
}

/** 메모리에만 두는 저장소. */
export function createMemoryRecordStore(): MemoryRecordStore {
  const records: WorkoutRecord[] = [];
  return {
    async findUserInput(key) {
      const found = records.find((r) => sameRecord(r.origin, key));
      if (!found || !isPerceivedExertion(found.userInput.perceivedExertion)) return null;
      return { perceivedExertion: found.userInput.perceivedExertion, memo: found.userInput.memo };
    },
    async save(record) {
      const at = records.findIndex((r) => sameRecord(r.origin, record.origin));
      if (at >= 0) records[at] = record;
      else records.push(record);
    },
    all() {
      return [...records];
    },
  };
}
