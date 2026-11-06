// 타입만 붙인다. 값은 웹의 src/engine/data.js에 있다(이 파일은 그 자리에 대응하는 선언).
// mobile/tsconfig.json의 paths가 @hoohaa/engine/data.js를 이 파일로 연결한다.

export type Sex = 'M' | 'F';
export type StdEvent = '5K' | '10K' | 'half' | 'full';
export type AgeGroup = '20s_and_under' | '30s' | '40s' | '50s' | '60plus';

export interface EngineData {
  source: string;
  distances: Record<StdEvent, number>;
  tierNames: string[];
  targetTopPct: number[];
  thresholds30s: Record<Sex, Record<StdEvent, number[]>>;
  popPct: number[];
  population: Record<Sex, Record<AgeGroup, Record<StdEvent, number[]>>>;
  ageMult: Record<Sex, Record<AgeGroup, Record<StdEvent, number>>>;
  wrCheck: Record<Sex, Record<string, number>>;
  wrFactor: number;
  nearWrFactor: number;
  vdotMax: number;
}

export const D: EngineData;
