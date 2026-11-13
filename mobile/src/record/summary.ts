// 기록 하나를 화면에 짧게 보여 줄 항목으로 바꾼다. 값이 없는 항목은 목록에 넣지 않는다.
// 숫자를 글자로 바꾸기만 한다. 기록을 해석하지 않는다(티어, 컨디션, 통증은 여기 없다).
import type { WorkoutRecord } from './types';

export type SummaryKey = 'date' | 'distance' | 'duration' | 'pace' | 'heartRate';

export interface SummaryItem {
  key: SummaryKey;
  value: string;
}

const WEEKDAYS = ['일', '월', '화', '수', '목', '금', '토'];

const p2 = (n: number) => String(n).padStart(2, '0');

const positive = (n: number | null | undefined): n is number => typeof n === 'number' && Number.isFinite(n) && n > 0;

/** ISO 8601 → "11월 6일 (금) 오전 6:30". 기기의 시간대로 적는다. 읽을 수 없는 값이면 null. */
export function formatStart(iso: string): string | null {
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return null;
  const h = d.getHours();
  const half = h < 12 ? '오전' : '오후';
  return `${d.getMonth() + 1}월 ${d.getDate()}일 (${WEEKDAYS[d.getDay()]}) ${half} ${h % 12 || 12}:${p2(d.getMinutes())}`;
}

/** 초 → "29:32" 또는 "1:02:03". 웹의 fmtDur(src/engine/logcalc.js)와 같은 모양. */
export function formatDuration(seconds: number): string {
  const s = Math.round(seconds);
  const h = Math.floor(s / 3600);
  const m = Math.floor((s % 3600) / 60);
  return h ? `${h}:${p2(m)}:${p2(s % 60)}` : `${m}:${p2(s % 60)}`;
}

/** km당 초 → "5:42". 웹의 fmtPace와 같은 모양. */
export function formatPace(secondsPerKm: number): string {
  const total = Math.round(secondsPerKm);
  return `${Math.floor(total / 60)}:${p2(total % 60)}`;
}

/**
 * 날짜, 거리, 시간, 평균 페이스, 평균 심박 순서. 값이 없거나 0 이하인 항목은 빠진다.
 * 평균 페이스는 기록의 시간 ÷ 거리다. 시간이 멈춘 구간을 빼는지는 가져온 곳마다 다르다(types.ts durationSeconds).
 */
export function summarize(record: WorkoutRecord): SummaryItem[] {
  const { startTime, distanceMeters, durationSeconds, heartRate } = record.measured;
  const items: SummaryItem[] = [];

  const date = formatStart(startTime);
  if (date) items.push({ key: 'date', value: date });

  if (positive(distanceMeters)) items.push({ key: 'distance', value: `${(distanceMeters / 1000).toFixed(2)} km` });

  if (positive(durationSeconds)) items.push({ key: 'duration', value: formatDuration(durationSeconds) });

  if (positive(distanceMeters) && positive(durationSeconds)) {
    items.push({ key: 'pace', value: `${formatPace(durationSeconds / (distanceMeters / 1000))}/km` });
  }

  const bpm = heartRate?.averageBpm;
  if (positive(bpm)) items.push({ key: 'heartRate', value: `${Math.round(bpm)} bpm` });

  return items;
}
