// 기록·페이스 문자열 → 초. 계산기 페이지(/pace-calculator/, /predictor/, /splits/, /vdot/, /vo2max/)와
// 홈 기록 칸(src/app/boot.js)이 같은 규칙으로 읽도록 한곳에 둔다. DOM 없음: `node src/engine/parse.test.mjs`.
//
// 입력칸 규칙(숫자만 받는다): 페이지는 입력값에서 숫자가 아닌 글자를 지우고 숫자만 이 함수에 넘긴다.
// 숫자는 뒤에서부터 2자리씩 끊어 초·분·시간으로 읽는다 (5000 → 50:00, 10530 → 1:05:30).
//
// 이 함수는 페이지 밖에서 들어오는 글자도 받는다:
//   '50:00', '1:05:30'   콜론 형식. 첫 칸을 뺀 나머지 칸은 1~2자리이고, 2자리로 채워 숫자 형식으로 바꾼다 ('1:5:30' → 10530)
//   '5000', '10530'      콜론 없음
//   ' 50 00 ', '1 : 05'  공백은 어디에 있든 지운다
//   '50：00'             전각 콜론·전각 숫자는 NFKC로 반각으로 바꾼다
//   '-5:00'              음수는 오류
//   '', '   ', null      빈칸은 null (아직 입력 안 함)
// 결과: null | { error } | { sec, h, m, s }  (페이스는 { sec, m, s })

export const p2 = (n) => String(n).padStart(2, '0');

const MSG = {
  time: { bad: '기록을 다시 확인해 주세요.', range: '분·초는 59까지, 시간은 29까지 입력할 수 있어요.', zero: '0초는 계산할 수 없어요. 기록을 입력해 주세요.' },
  pace: { bad: '페이스를 다시 확인해 주세요.', range: '초는 59까지 입력할 수 있어요.', zero: '페이스를 다시 확인해 주세요.' },
};
// parts: 칸 수 (기록 h:mm:ss = 3, 페이스 m:ss = 2), maxH: 기록 시간 상한
const KIND = { time: { parts: 3, maxH: 29 }, pace: { parts: 2 } };

// 어떤 형식이든 숫자 문자열로 바꾼다. 읽을 수 없으면 null, 빈칸이면 ''.
function toDigits(v, parts) {
  let s = String(v ?? '').normalize('NFKC').replace(/\s+/g, '');
  if (!s) return '';
  if (s.startsWith('-')) return null;
  if (/^\d+$/.test(s)) return s;
  const a = s.split(':');
  if (a.length > parts || !a.every((x, i) => i === 0 ? /^\d+$/.test(x) : /^\d{1,2}$/.test(x))) return null;
  return a[0] + a.slice(1).map((x) => x.padStart(2, '0')).join('');
}

// kind: 'time' | 'pace'. zero: 'empty'(0은 빈칸처럼 null, 계산기 페이지) | 'error'(0은 오류, 홈)
export function parseClock(v, { kind = 'time', zero = 'empty' } = {}) {
  const K = KIND[kind], M = MSG[kind];
  let d = toDigits(v, K.parts);
  if (d == null) return { error: M.bad };
  d = d.replace(/^0+(?=\d)/, '');
  if (!d) return null;
  if (+d === 0) return zero === 'error' ? { error: M.zero } : null;
  if (d.length > K.parts * 2) return { error: M.bad };
  const s = +d.slice(-2);
  if (K.parts === 2) {
    const m = +(d.slice(0, -2) || 0);
    if (s > 59) return { error: M.range };
    return { sec: m * 60 + s, m, s };
  }
  const m = +(d.slice(-4, -2) || 0), h = +(d.slice(0, -4) || 0);
  if (s > 59 || m > 59 || h > K.maxH) return { error: M.range };
  return { sec: h * 3600 + m * 60 + s, h, m, s };
}

export const readTime = (v, opts) => parseClock(v, { ...opts, kind: 'time' });
export const readPace = (v) => parseClock(v, { kind: 'pace' });

// 입력 중인 숫자에 콜론을 붙여 보여 준다 (5000 → '50:00', 10530 → '1:05:30'). 앞자리 0은 지운다.
export function showTime(d) {
  d = String(d).replace(/^0+(?=\d)/, '');
  if (d.length <= 2) return d;
  if (d.length <= 4) return d.slice(0, -2) + ':' + d.slice(-2);
  return d.slice(0, -4) + ':' + d.slice(-4, -2) + ':' + d.slice(-2);
}
export function showPace(d) {
  d = String(d).replace(/^0+(?=\d)/, '');
  return d.length <= 2 ? d : d.slice(0, -2) + ':' + d.slice(-2);
}
