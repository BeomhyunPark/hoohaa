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

  /** 기록을 가져온 곳. 기록 카드 오른쪽 위에 붙는다. 직접 입력한 기록에는 붙이지 않는다. */
  sources: {
    apple_health: '애플 건강',
    health_connect: '헬스 커넥트',
  },

  exertionTitle: '체감 피로',
  exertionQuestion: '이번 달리기는 얼마나 힘들었어요?',
  /** 체감 피로를 고르기 전에 제목 오른쪽에 보인다. */
  exertionPickHint: '밀거나 눌러서 골라요',
  /** 화면에는 보이지 않고, 슬라이더의 낭독기 힌트로 읽는다. */
  exertionScale: '1은 아주 편했을 때, 10은 온 힘을 다했을 때예요.',
  /** 화면 낭독기가 읽는 슬라이더의 이름. */
  exertionGroupLabel: '체감 피로, 1부터 10까지',
  /** 슬라이더 양 끝에 보이고, 낭독기는 값 1과 10 뒤에 붙여 읽는다. */
  exertionLowest: '아주 편했어요',
  exertionHighest: '온 힘을 다했어요',
  /** 저장한 체감 피로 값. {숫자}에 1~10이 들어간다. */
  exertionOutOf: '{숫자} / 10',

  memoLabel: '메모 (선택)',
  /** 화면에는 "메모"를 굵게, 이것을 흐리게 나눠 보여 준다. 화면 낭독기는 memoLabel을 읽는다. */
  memoOptional: '(선택)',
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

/** 저장한 체감 피로 값을 "{숫자} / 10" 모양으로 나눈다. 숫자는 크게, 나머지는 작게 보여 준다. */
export function exertionOutOfParts(value: number): {
  before: string;
  number: string;
  after: string;
} {
  const [before, after] = afterRunCopy.exertionOutOf.split('{숫자}');
  return { before, number: String(value), after };
}

/** 화면 낭독기가 읽는 체감 피로 값 하나. 양 끝 값에는 뜻을 붙인다. */
export function exertionButtonLabel(value: number): string {
  const base = `${afterRunCopy.exertionTitle} ${value}`;
  if (value === EXERTION_MIN) return `${base}, ${afterRunCopy.exertionLowest}`;
  if (value === EXERTION_MAX) return `${base}, ${afterRunCopy.exertionHighest}`;
  return base;
}
