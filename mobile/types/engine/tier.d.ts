// 타입만 붙인다. 계산은 웹의 src/engine/tier.js에 있다(복사하지 않는다).
// mobile/tsconfig.json의 paths가 @hoohaa/engine/tier.js를 이 파일로 연결한다.
import type { AgeGroup, Sex, StdEvent } from './data.js';

export interface CalculateInput {
  birthYear?: number | string;
  birthdate?: string;
  sex: Sex | string;
  /** '5K' | '10K' | 'half' | 'full' 또는 '15km' 같은 거리 */
  event?: StdEvent | string;
  distanceKm?: number | string;
  /** '50:00', '1:45:30' 또는 초 */
  time: string | number;
  today?: Date;
}

export type CalculateErrorCode =
  | 'birthdate'
  | 'age_range'
  | 'sex'
  | 'distance_nonpositive'
  | 'distance_range'
  | 'time_nonpositive'
  | 'faster_than_wr';

export interface CalculateError {
  ok: false;
  errors: { code: CalculateErrorCode; message: string }[];
}

export interface NextTier {
  tier: string;
  targetTime: string;
  targetSec: number;
  gapSec: number;
  gap: string;
  gapText: string;
}

export interface CalculateResult {
  ok: true;
  input: {
    birthYear?: number;
    birthdate?: string;
    age: number;
    ageMode: 'year_minus_birthyear' | 'full_age';
    ageGroup: AgeGroup;
    ageGroupLabel: string;
    sex: Sex;
    distanceKm: number;
    time: string;
  };
  tier: string;
  tierIndex: number;
  vdot: number;
  vo2maxEstimate: number;
  pace: string;
  topPercent: number;
  topPercent1: number | null;
  topPercentLabel: string;
  currentTierBoundSec: number | null;
  tierBandPct: { from: number; to: number };
  populationTopPercent: number;
  ageTimeMultiplier: number;
  nextTier: NextTier | null;
  tierLadder: { tier: string; index: number; minSec: number | null; minTime: string | null; topPct: number }[];
  predicted: Record<StdEvent, string>;
  predictedPace: Record<StdEvent, string>;
  trainingPaces: { E: string; M: string; T: string; I: string; R: string };
  notes: string[];
}

export function calculate(input: CalculateInput): CalculateResult | CalculateError;
/** Daniels/Gilbert VDOT. d는 미터, tMin은 분 */
export function vdot(dMeters: number, tMin: number): number;
/** 해당 VDOT로 그 거리를 뛰는 시간(초) */
export function timeForVdot(dMeters: number, V: number): number;
export function fmtTime(sec: number): string;
export function fmtPace(secPerKm: number): string;
export function parseTime(str: string | number): number;
