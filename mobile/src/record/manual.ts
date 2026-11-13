// 직접 입력한 기록. 입력칸의 글자를 읽어 검사하고, 기록(WorkoutRecord)으로 만든다.
//
// 꼭 받는 것은 날짜, 거리, 시간이다. 시작 시각, 평균 심박, 평균 케이던스는 선택이다(사용자 결정, 2026-11-13).
// 바깥에서 받은 기록 번호가 없어서 앱이 번호를 만들어 붙인다(docs/v4/features/health-import.md의 결정).
// 번호는 저장을 누를 때 만든다. 기록을 해석하지 않는다(티어, 컨디션은 여기 없다).
import { readTime } from '@hoohaa/engine/parse.js';

import type { WorkoutRecord } from './types';

/** 입력칸 이름. */
export type ManualField = 'date' | 'distance' | 'duration' | 'startTime' | 'heartRate' | 'cadence';

/** 입력칸에 적힌 글자 그대로. */
export type ManualForm = Record<ManualField, string>;

/** 검사를 지난 값. 기기에 저장하는 것도 이 모양이다(manual-store.ts). */
export interface ManualFields {
  /** ISO 8601. 시작 시각을 적지 않았으면 그 날짜의 0시(기기 시간대)다. */
  startTime: string;
  /** 시작 시각을 적었는지. 적지 않았으면 화면은 날짜만 보여 준다. */
  startTimeEntered: boolean;
  durationSeconds: number;
  distanceMeters: number;
  averageBpm: number | null;
  averageCadenceSpm: number | null;
}

/** 어느 칸이 왜 틀렸는지. 문장은 화면이 고른다(src/copy/manual-entry.ts). */
export type ManualError = 'required' | 'invalid' | 'future' | 'range';

export type ManualResult =
  | { ok: true; fields: ManualFields }
  | { ok: false; errors: Partial<Record<ManualField, ManualError>> };

/** 받는 범위. 넓게 잡은 오타 거르개다. 기록을 판단하지 않는다. */
export const MANUAL_LIMITS = {
  distanceKm: { max: 500 },
  heartRateBpm: { min: 30, max: 250 },
  cadenceSpm: { min: 50, max: 300 },
} as const;

/** 가져온 곳이 직접 입력일 때 extra에 두는 키. 시작 시각을 적었는지(boolean). */
export const START_TIME_ENTERED = 'manual.startTimeEntered';

const p2 = (n: number) => String(n).padStart(2, '0');

/** 기기 시간대의 날짜를 날짜 칸 모양("2026-11-13")으로. */
export function formatDateInput(d: Date): string {
  return `${d.getFullYear()}-${p2(d.getMonth() + 1)}-${p2(d.getDate())}`;
}

/** 숫자만 남기고 날짜 모양으로 끊는다 (20261113 → "2026-11-13"). 입력 중에 쓴다. */
export function showDate(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 8);
  if (d.length <= 4) return d;
  if (d.length <= 6) return `${d.slice(0, 4)}-${d.slice(4)}`;
  return `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}`;
}

/** 숫자만 남기고 시각 모양으로 끊는다 (0630 → "06:30"). 입력 중에 쓴다. */
export function showClock(text: string): string {
  const d = text.replace(/\D/g, '').slice(0, 4);
  return d.length <= 2 ? d : `${d.slice(0, 2)}:${d.slice(2)}`;
}

/** "2026-11-13", "2026.11.13", "20261113" → 연, 월, 일. 없는 날짜(2월 30일)는 null. */
function readDate(text: string): { y: number; mo: number; d: number } | null {
  const m = text.trim().match(/^(\d{4})[-./]?(\d{1,2})[-./]?(\d{1,2})$/);
  if (!m) return null;
  const [y, mo, d] = [Number(m[1]), Number(m[2]), Number(m[3])];
  const date = new Date(y, mo - 1, d);
  if (date.getFullYear() !== y || date.getMonth() !== mo - 1 || date.getDate() !== d) return null;
  return { y, mo, d };
}

/** "06:30", "6:30", "0630" → 시, 분. */
function readClock(text: string): { h: number; mi: number } | null {
  const m = text.trim().match(/^(\d{1,2}):?(\d{2})$/);
  if (!m) return null;
  const [h, mi] = [Number(m[1]), Number(m[2])];
  return h <= 23 && mi <= 59 ? { h, mi } : null;
}

function readInteger(text: string, range: { min: number; max: number }): number | ManualError {
  if (!/^\d+$/.test(text)) return 'invalid';
  const n = Number(text);
  return n >= range.min && n <= range.max ? n : 'range';
}

/**
 * 입력칸의 글자를 검사한다. 틀린 칸이 하나라도 있으면 칸마다 이유를 돌려준다.
 * now는 "오늘"을 정한다. 오늘보다 뒤의 날짜는 받지 않는다(기기 시간대 기준).
 */
export function readManualForm(form: ManualForm, now: Date = new Date()): ManualResult {
  const errors: Partial<Record<ManualField, ManualError>> = {};
  const text = (k: ManualField) => form[k].trim();

  let date: { y: number; mo: number; d: number } | null = null;
  if (text('date') === '') errors.date = 'required';
  else {
    date = readDate(text('date'));
    if (!date) errors.date = 'invalid';
    else if (new Date(date.y, date.mo - 1, date.d) > now) errors.date = 'future';
  }

  let distanceMeters = 0;
  if (text('distance') === '') errors.distance = 'required';
  else if (!/^\d+(\.\d+)?$/.test(text('distance'))) errors.distance = 'invalid';
  else {
    const km = Number(text('distance'));
    if (km <= 0) errors.distance = 'invalid';
    else if (km > MANUAL_LIMITS.distanceKm.max) errors.distance = 'range';
    else distanceMeters = Math.round(km * 1000);
  }

  let durationSeconds = 0;
  if (text('duration') === '') errors.duration = 'required';
  else {
    // 웹의 기록 칸과 같은 규칙으로 읽는다(28:32, 1:02:03, 숫자만 2832).
    const t = readTime(text('duration'), { zero: 'error' });
    if (!t || 'error' in t) errors.duration = 'invalid';
    else durationSeconds = t.sec;
  }

  let clock: { h: number; mi: number } | null = null;
  if (text('startTime') !== '') {
    clock = readClock(text('startTime'));
    if (!clock) errors.startTime = 'invalid';
  }

  let averageBpm: number | null = null;
  if (text('heartRate') !== '') {
    const v = readInteger(text('heartRate'), MANUAL_LIMITS.heartRateBpm);
    if (typeof v === 'number') averageBpm = v;
    else errors.heartRate = v;
  }

  let averageCadenceSpm: number | null = null;
  if (text('cadence') !== '') {
    const v = readInteger(text('cadence'), MANUAL_LIMITS.cadenceSpm);
    if (typeof v === 'number') averageCadenceSpm = v;
    else errors.cadence = v;
  }

  if (Object.keys(errors).length > 0 || !date) return { ok: false, errors };

  const start = new Date(date.y, date.mo - 1, date.d, clock?.h ?? 0, clock?.mi ?? 0);
  return {
    ok: true,
    fields: {
      startTime: start.toISOString(),
      startTimeEntered: clock !== null,
      durationSeconds,
      distanceMeters,
      averageBpm,
      averageCadenceSpm,
    },
  };
}

/**
 * 직접 입력한 기록의 번호. 만든 시각과 무작위 글자를 붙인 것이다("m-" + 시각 + "-" + 무작위 8자).
 * 한 기기 안에서 겹치지 않으면 된다. 뜻을 담지 않으므로 번호에서 시각을 다시 읽지 않는다.
 */
export function newManualRecordId(now: Date = new Date(), random: () => number = Math.random): string {
  let tail = '';
  while (tail.length < 8) tail += Math.floor(random() * 36).toString(36);
  return `m-${now.getTime().toString(36)}-${tail}`;
}

/** 검사를 지난 값 → 기록. createdAt은 이 기록을 만든(저장을 누른) 시각이다(ISO 8601, UTC). */
export function manualRecord(id: string, createdAt: string, fields: ManualFields): WorkoutRecord {
  const start = new Date(fields.startTime);
  return {
    origin: { source: 'manual', sourceRecordId: id, importedAt: createdAt },
    measured: {
      activityTypeCode: null,
      startTime: fields.startTime,
      // 멈춘 시간은 모른다. 끝은 시작 + 움직인 시간으로 둔다.
      endTime: new Date(start.getTime() + fields.durationSeconds * 1000).toISOString(),
      durationSeconds: fields.durationSeconds,
      distanceMeters: fields.distanceMeters,
      energyKcal: null,
      heartRate:
        fields.averageBpm === null ? null : { averageBpm: fields.averageBpm, maxBpm: null, minBpm: null, samples: [] },
      averageCadenceSpm: fields.averageCadenceSpm,
    },
    userInput: { perceivedExertion: null, memo: null },
    route: null,
    extra: { [START_TIME_ENTERED]: fields.startTimeEntered },
  };
}

/** 직접 입력한 기록 → 입력칸의 글자. 적어 둔 기록을 고칠 때 칸을 채운다. 기기 시간대로 적는다. */
export function manualFormOf(record: WorkoutRecord): ManualForm {
  const { startTime, durationSeconds, distanceMeters, heartRate, averageCadenceSpm } = record.measured;
  const start = new Date(startTime);
  const s = Math.round(durationSeconds ?? 0);
  const [h, m] = [Math.floor(s / 3600), Math.floor((s % 3600) / 60)];
  const text = (n: number | null | undefined) => (typeof n === 'number' ? String(n) : '');
  return {
    date: formatDateInput(start),
    distance: typeof distanceMeters === 'number' ? String(distanceMeters / 1000) : '',
    duration: s > 0 ? (h ? `${h}:${p2(m)}:${p2(s % 60)}` : `${m}:${p2(s % 60)}`) : '',
    startTime: record.extra[START_TIME_ENTERED] === true ? `${p2(start.getHours())}:${p2(start.getMinutes())}` : '',
    heartRate: text(heartRate?.averageBpm),
    cadence: text(averageCadenceSpm),
  };
}
