// 운동이 끝난 뒤 첫 화면(기록 확인, 체감 피로, 메모)의 화면 문장. 한국어 해요체.
//
// 문장의 기준은 docs/v4/features/copy.md "운동이 끝난 뒤 > 기록과 체감 피로"다. 여기를 고치면 그 표도 같이 고친다.
// 컨디션, 목표, 내일 훈련, 통증 판단 문장은 서버가 생긴 다음이라 여기 없다.

/** 체감 피로의 가장 낮은 값과 가장 높은 값. */
export const EXERTION_MIN = 1;
export const EXERTION_MAX = 10;

export const afterRunCopy = {
  loading: '기록을 읽고 있어요.',
  noRecord: '가져온 운동 기록이 없어요.',
  readFailed: '기록을 읽지 못했어요.',
  retryRead: '다시 읽기',

  recordTitle: '운동 기록',
  labels: {
    date: '날짜',
    distance: '거리',
    duration: '시간',
    pace: '평균 페이스',
    heartRate: '평균 심박',
    cadence: '평균 케이던스',
  },

  exertionTitle: '체감 피로',
  exertionQuestion: '이번 달리기는 얼마나 힘들었어요?',
  exertionScale: '1은 아주 편했을 때, 10은 온 힘을 다했을 때예요.',
  /** 화면 낭독기가 읽는 척도 묶음의 이름. */
  exertionGroupLabel: '체감 피로, 1부터 10까지',
  exertionLowest: '아주 편했어요',
  exertionHighest: '온 힘을 다했어요',

  memoLabel: '메모 (선택)',
  memoPlaceholder: '예: 왼쪽 무릎이 조금 아파요',

  save: '저장',
  needExertion: '체감 피로를 골라야 저장할 수 있어요.',
  saveFailed: '저장하지 못했어요. 다시 눌러 주세요.',

  saved: '저장했어요',
  savedMemoLabel: '메모',
  edit: '수정',
  cancelEdit: '취소',

  /** 기록을 직접 입력하는 화면으로 가는 버튼. */
  addManual: '기록 직접 입력',
  /** 지난 기록 목록으로 가는 버튼. */
  openList: '지난 기록',

  /** 직접 입력한 기록에만 있는 버튼. 날짜, 거리, 시간 같은 적은 값을 고치거나 기록을 지운다. */
  editRecord: '기록 고치기',
  deleteRecord: '기록 지우기',
  deleteQuestion: '이 기록을 지울까요? 체감 피로와 메모도 같이 지워져요.',
  deleteConfirm: '지우기',
  deleteCancel: '취소',
  deleteFailed: '지우지 못했어요. 다시 눌러 주세요.',
} as const;

/** 화면 낭독기가 읽는 피로 버튼 하나의 이름. 양 끝 값에는 뜻을 붙인다. */
export function exertionButtonLabel(value: number): string {
  const base = `${afterRunCopy.exertionTitle} ${value}`;
  if (value === EXERTION_MIN) return `${base}, ${afterRunCopy.exertionLowest}`;
  if (value === EXERTION_MAX) return `${base}, ${afterRunCopy.exertionHighest}`;
  return base;
}
