// 지난 기록 목록 화면의 화면 문장. 한국어 해요체.
//
// 문장의 기준은 docs/v4/features/copy.md "운동이 끝난 뒤 > 지난 기록"이다. 여기를 고치면 그 표도 같이 고친다.
export const recordListCopy = {
  title: '지난 기록',
  loading: '기록을 읽고 있어요.',
  empty: '아직 기록이 없어요.',
  readFailed: '기록을 읽지 못했어요.',
  retryRead: '다시 읽기',

  /** 직접 입력한 기록에 붙는 표시. */
  manualTag: '직접 입력',
  /** 저장해 둔 체감 피로 앞에 붙는 말. "체감 피로 4"로 적는다. */
  exertion: '체감 피로',

  addManual: '기록 직접 입력',
  back: '돌아가기',
} as const;
