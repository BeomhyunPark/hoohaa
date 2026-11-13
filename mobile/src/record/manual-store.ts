// 직접 입력한 기록의 측정값을 두는 자리.
//
// 건강 앱 기록의 측정값은 건강 앱이 갖고 있어 기기에 복사하지 않는다(device-store.ts). 직접 입력한 기록은
// 이 앱 말고는 어디에도 없으므로 여기에 둔다. 날짜, 거리, 시간과 선택 항목뿐이라 작다.
// 체감 피로와 메모는 여기 두지 않는다. 건강 앱 기록과 같이 RecordStore가 가져온 곳(manual) + 기록 번호로 둔다.
//
// 기록 하나 = 키 하나. 한 칸이 깨져도 다른 기록은 그대로다.
//   키: hoohaa/manual-record/<기록 번호>
//   값: {"version":1,"id":"m-…","createdAt":"…","startTime":"…","startTimeEntered":false,
//        "durationSeconds":1712,"distanceMeters":5010,"averageBpm":156,"averageCadenceSpm":176}  (선택 항목이 없으면 null)
import AsyncStorage from '@react-native-async-storage/async-storage';

import { manualRecord, START_TIME_ENTERED, type ManualFields } from './manual';
import type { WorkoutRecord } from './types';

export interface ManualRecordStore {
  /** 직접 입력한 기록을 저장한다. 번호가 같은 기록이 있으면 그 자리를 바꾼다. 저장하지 못하면 reject한다. */
  save(record: WorkoutRecord): Promise<void>;
  /** 저장한 기록 전부(순서는 정해져 있지 않다). 쓸 수 없는 값(깨졌거나 형식이 다르다)은 건너뛴다. 저장소를 읽지 못하면 reject한다. */
  all(): Promise<WorkoutRecord[]>;
  /** 가장 늦게 끝난 기록 하나. 없으면 null. */
  latest(): Promise<WorkoutRecord | null>;
  /** 이 번호의 기록을 지운다. 없는 번호여도 된다. 지우지 못하면 reject한다. 체감 피로와 메모는 RecordStore에서 따로 지운다. */
  remove(id: string): Promise<void>;
}

/** 저장 형식의 번호. 값의 모양을 바꾸면 올린다. 번호가 다른 값은 읽지 않는다. */
export const MANUAL_SAVED_VERSION = 1;

const KEY_PREFIX = 'hoohaa/manual-record/';

export function manualStorageKey(id: string): string {
  return `${KEY_PREFIX}${id}`;
}

const positive = (v: unknown): v is number => typeof v === 'number' && Number.isFinite(v) && v > 0;
const positiveOrNull = (v: unknown): v is number | null => v === null || positive(v);
const isoTime = (v: unknown): v is string => typeof v === 'string' && !Number.isNaN(new Date(v).getTime());

/** 저장된 글자를 기록으로 읽는다. 쓸 수 없는 값이면 null이다. 던지지 않는다. */
export function parseManualSaved(text: string, id: string): WorkoutRecord | null {
  let value: unknown;
  try {
    value = JSON.parse(text);
  } catch {
    return null;
  }
  if (typeof value !== 'object' || value === null) return null;
  const v = value as Record<string, unknown>;
  if (v.version !== MANUAL_SAVED_VERSION || v.id !== id) return null;
  if (!isoTime(v.createdAt) || !isoTime(v.startTime) || typeof v.startTimeEntered !== 'boolean') return null;
  if (!positive(v.durationSeconds) || !positive(v.distanceMeters)) return null;
  if (!positiveOrNull(v.averageBpm) || !positiveOrNull(v.averageCadenceSpm)) return null;
  return manualRecord(id, v.createdAt, {
    startTime: v.startTime,
    startTimeEntered: v.startTimeEntered,
    durationSeconds: v.durationSeconds,
    distanceMeters: v.distanceMeters,
    averageBpm: v.averageBpm,
    averageCadenceSpm: v.averageCadenceSpm,
  });
}

/** 기록 → 저장할 값. 직접 입력한 기록이 아니거나 거리·시간이 없으면 던진다. */
function toSaved(record: WorkoutRecord): { version: number; id: string; createdAt: string } & ManualFields {
  const { origin, measured, extra } = record;
  if (origin.source !== 'manual') throw new Error(`직접 입력한 기록이 아니다: ${origin.source}`);
  if (!positive(measured.durationSeconds) || !positive(measured.distanceMeters)) {
    throw new RangeError('직접 입력한 기록에는 거리와 시간이 있어야 한다');
  }
  return {
    version: MANUAL_SAVED_VERSION,
    id: origin.sourceRecordId,
    createdAt: origin.importedAt,
    startTime: measured.startTime,
    startTimeEntered: extra[START_TIME_ENTERED] === true,
    durationSeconds: measured.durationSeconds,
    distanceMeters: measured.distanceMeters,
    averageBpm: measured.heartRate?.averageBpm ?? null,
    averageCadenceSpm: measured.averageCadenceSpm,
  };
}

/** 더 늦게 끝난 쪽. 끝난 시각이 같으면 나중에 만든 쪽. */
function later(a: WorkoutRecord | null, b: WorkoutRecord): WorkoutRecord {
  if (!a) return b;
  const [ea, eb] = [Date.parse(a.measured.endTime), Date.parse(b.measured.endTime)];
  if (ea !== eb) return eb > ea ? b : a;
  return b.origin.importedAt > a.origin.importedAt ? b : a;
}

/** 기기 안에 두는 저장소(AsyncStorage). 앱을 닫았다 열어도 남는다. */
export function createDeviceManualRecordStore(): ManualRecordStore {
  async function all(): Promise<WorkoutRecord[]> {
    const keys = (await AsyncStorage.getAllKeys()).filter((k) => k.startsWith(KEY_PREFIX));
    if (keys.length === 0) return [];
    const records: WorkoutRecord[] = [];
    for (const [key, text] of await AsyncStorage.multiGet(keys)) {
      const record = text === null ? null : parseManualSaved(text, key.slice(KEY_PREFIX.length));
      if (record) records.push(record);
    }
    return records;
  }
  return {
    async save(record) {
      const saved = toSaved(record);
      await AsyncStorage.setItem(manualStorageKey(saved.id), JSON.stringify(saved));
    },
    all,
    async latest() {
      return (await all()).reduce<WorkoutRecord | null>(later, null);
    },
    async remove(id) {
      await AsyncStorage.removeItem(manualStorageKey(id));
    },
  };
}

/** 메모리에만 두는 저장소(테스트용). 닫으면 사라진다. */
export function createMemoryManualRecordStore(): ManualRecordStore {
  const records: WorkoutRecord[] = [];
  return {
    async save(record) {
      toSaved(record);
      const at = records.findIndex((r) => r.origin.sourceRecordId === record.origin.sourceRecordId);
      if (at >= 0) records[at] = record;
      else records.push(record);
    },
    async all() {
      return [...records];
    },
    async latest() {
      return records.reduce<WorkoutRecord | null>(later, null);
    },
    async remove(id) {
      const at = records.findIndex((r) => r.origin.sourceRecordId === id);
      if (at >= 0) records.splice(at, 1);
    },
  };
}
