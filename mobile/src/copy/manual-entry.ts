// 기록을 직접 입력하는 화면의 화면 문장. 한국어 해요체.
//
// 문장의 기준은 docs/v4/features/copy.md "운동이 끝난 뒤 > 기록 직접 입력"이다. 여기를 고치면 그 표도 같이 고친다.
import type { ManualError, ManualField } from '../record/manual';

export const manualEntryCopy = {
  title: '기록 직접 입력',
  intro: '날짜, 거리, 시간만 적으면 돼요.',

  labels: {
    date: '날짜',
    distance: '거리 (km)',
    duration: '시간',
    startTime: '시작 시각',
    heartRate: '평균 심박 (bpm)',
    cadence: '평균 케이던스 (spm)',
  },
  placeholders: {
    date: '예: 2026-11-13',
    distance: '예: 5.01',
    duration: '예: 28:32',
    startTime: '예: 06:30',
    heartRate: '예: 156',
    cadence: '예: 176',
  },

  detailsTitle: '자세히 (선택)',
  detailsHint: '아는 것만 적어요. 비워 둬도 돼요.',

  save: '저장',
  cancel: '취소',
  saveFailed: '저장하지 못했어요. 다시 눌러 주세요.',

  errors: {
    date: {
      required: '날짜를 적어 주세요.',
      invalid: '날짜를 2026-11-13처럼 적어 주세요.',
      future: '오늘보다 뒤의 날짜는 넣을 수 없어요.',
    },
    distance: {
      required: '거리를 적어 주세요.',
      invalid: '거리를 5.01처럼 숫자로 적어 주세요.',
      range: '거리는 500km까지 넣을 수 있어요.',
    },
    duration: {
      required: '시간을 적어 주세요.',
      invalid: '시간을 28:32나 1:02:03처럼 적어 주세요.',
    },
    startTime: {
      invalid: '시작 시각을 06:30처럼 적어 주세요.',
    },
    heartRate: {
      invalid: '평균 심박은 숫자로 적어 주세요.',
      range: '평균 심박은 30에서 250 사이로 적어 주세요.',
    },
    cadence: {
      invalid: '평균 케이던스는 숫자로 적어 주세요.',
      range: '평균 케이던스는 50에서 300 사이로 적어 주세요.',
    },
  },
} as const;

/** 칸과 이유에 맞는 문장. 그 칸에 없는 이유면 그 칸의 "다시 적어 주세요" 문장을 쓴다. */
export function manualErrorText(field: ManualField, error: ManualError): string {
  const texts: Partial<Record<ManualError, string>> & { invalid: string } = manualEntryCopy.errors[field];
  return texts[error] ?? texts.invalid;
}
