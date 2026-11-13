// 기록을 두는 자리. 화면은 이 인터페이스만 본다.
//
// 지금은 메모리 구현만 있다. 앱을 닫으면 사라진다. 기기 저장과 "이미 저장한 기록은 다시 묻지 않기"는
// 다음 작업(docs/tasks/v4-health.md V5)이다. 서버 호출은 없다.
import type { WorkoutRecord } from './types';

export interface RecordStore {
  /**
   * 기록 하나를 저장한다. 가져온 곳과 그곳의 기록 번호가 같은 기록이 이미 있으면 그 자리를 바꾼다
   * (같은 운동을 두 번 저장하지 않는다). 기록 번호가 없는 기록(직접 입력)은 늘 새로 넣는다.
   */
  save(record: WorkoutRecord): Promise<void>;
}

export interface MemoryRecordStore extends RecordStore {
  /** 지금까지 저장한 기록 전부(저장한 순서). */
  all(): WorkoutRecord[];
}

export function createMemoryRecordStore(): MemoryRecordStore {
  const records: WorkoutRecord[] = [];
  return {
    async save(record) {
      const { source, sourceRecordId } = record.origin;
      const at =
        sourceRecordId === null
          ? -1
          : records.findIndex((r) => r.origin.source === source && r.origin.sourceRecordId === sourceRecordId);
      if (at >= 0) records[at] = record;
      else records.push(record);
    },
    all() {
      return [...records];
    },
  };
}
