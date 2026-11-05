import assert from 'node:assert/strict';
import { parseClock, readTime, readPace, showTime, showPace } from './parse.js';

const RANGE = '분·초는 59까지, 시간은 29까지 입력할 수 있어요.', BAD = '기록을 다시 확인해 주세요.';
const t = (sec, h, m, s) => ({ sec, h, m, s });

// mm:ss
assert.deepEqual(readTime('50:00'), t(3000, 0, 50, 0));
assert.deepEqual(readTime('5:07'), t(307, 0, 5, 7));
assert.deepEqual(readTime('5:7'), t(307, 0, 5, 7)); // 한 자리 칸은 2자리로 채운다
assert.deepEqual(readTime('59:59'), t(3599, 0, 59, 59));
assert.deepEqual(readTime('60:00'), { error: RANGE }); // 분은 59까지 (숫자 6000과 같다)
assert.deepEqual(readTime('50:60'), { error: RANGE });
assert.deepEqual(readTime('50:000'), { error: BAD }); // 뒤 칸은 1~2자리

// h:mm:ss
assert.deepEqual(readTime('1:05:30'), t(3930, 1, 5, 30));
assert.deepEqual(readTime('1:5:30'), t(3930, 1, 5, 30));
assert.deepEqual(readTime('4:00:00'), t(14400, 4, 0, 0));
assert.deepEqual(readTime('29:59:59'), t(107999, 29, 59, 59));
assert.deepEqual(readTime('30:00:00'), { error: RANGE });
assert.deepEqual(readTime('1:2:3:4'), { error: BAD }); // 칸이 너무 많다
assert.deepEqual(readTime('1::30'), { error: BAD });
assert.deepEqual(readTime('1:30:'), { error: BAD });
assert.deepEqual(readTime('100:00:00'), { error: BAD }); // 7자리

// 콜론 없음: 뒤에서부터 2자리씩
assert.deepEqual(readTime('5000'), t(3000, 0, 50, 0));
assert.deepEqual(readTime('10530'), t(3930, 1, 5, 30));
assert.deepEqual(readTime('5'), t(5, 0, 0, 5));
assert.deepEqual(readTime('00530'), t(330, 0, 5, 30)); // 앞자리 0
assert.deepEqual(readTime('7500'), { error: RANGE });
assert.deepEqual(readTime('295959'), t(107999, 29, 59, 59));
assert.deepEqual(readTime('305959'), { error: RANGE });
assert.deepEqual(readTime('1234567'), { error: BAD });
assert.deepEqual(readTime(5000), t(3000, 0, 50, 0)); // 숫자도 받는다

// 공백
assert.deepEqual(readTime(' 50:00 '), t(3000, 0, 50, 0));
assert.deepEqual(readTime('1 : 05 : 30'), t(3930, 1, 5, 30));
assert.deepEqual(readTime(' 50 00 '), t(3000, 0, 50, 0)); // 숫자 사이 공백도 지운다
assert.deepEqual(readTime('\t1:05:30\n'), t(3930, 1, 5, 30));

// 전각 콜론·전각 숫자
assert.deepEqual(readTime('50：00'), t(3000, 0, 50, 0));
assert.deepEqual(readTime('1：05：30'), t(3930, 1, 5, 30));
assert.deepEqual(readTime('５０：００'), t(3000, 0, 50, 0));

// 음수
assert.deepEqual(readTime('-50:00'), { error: BAD });
assert.deepEqual(readTime('-5000'), { error: BAD });
assert.deepEqual(readTime(' -1:00'), { error: BAD });
assert.deepEqual(readTime(-300), { error: BAD });

// 빈칸·0·이상한 글자
for (const v of ['', '   ', null, undefined]) assert.equal(readTime(v), null);
assert.equal(readTime('0'), null); // 계산기 페이지: 0은 빈칸처럼
assert.equal(readTime('0:00'), null);
assert.equal(readTime('000'), null);
assert.deepEqual(readTime('0', { zero: 'error' }), { error: '0초는 계산할 수 없어요. 기록을 입력해 주세요.' }); // 홈
assert.deepEqual(readTime('0:00:00', { zero: 'error' }), { error: '0초는 계산할 수 없어요. 기록을 입력해 주세요.' });
assert.equal(readTime('', { zero: 'error' }), null);
for (const v of ['abc', '50:00.5', '50.00', '5분', '+5000', ':']) assert.deepEqual(readTime(v), { error: BAD }, v);

// 페이스 m:ss
const PBAD = '페이스를 다시 확인해 주세요.', PRANGE = '초는 59까지 입력할 수 있어요.';
assert.deepEqual(readPace('5:30'), { sec: 330, m: 5, s: 30 });
assert.deepEqual(readPace('530'), { sec: 330, m: 5, s: 30 });
assert.deepEqual(readPace(' 5 : 30 '), { sec: 330, m: 5, s: 30 });
assert.deepEqual(readPace('5：30'), { sec: 330, m: 5, s: 30 });
assert.deepEqual(readPace('99:59'), { sec: 5999, m: 99, s: 59 }); // 페이스는 분 상한이 없다 (4자리까지)
assert.deepEqual(readPace('5:60'), { error: PRANGE });
assert.deepEqual(readPace('10000'), { error: PBAD });
assert.deepEqual(readPace('1:05:30'), { error: PBAD }); // 페이스는 2칸까지
assert.deepEqual(readPace('-5:30'), { error: PBAD });
assert.equal(readPace(''), null);
assert.equal(readPace('0'), null);
assert.equal(parseClock('5:30', { kind: 'pace' }).sec, 330);

// 숫자만 넣으면 예전 페이지 함수와 결과가 같다 (0~7자리 전부와 맞춰 본다)
function oldRead(d) { d = d.replace(/^0+(?=\d)/, ''); if (!d || +d === 0) return null; if (d.length > 6) return { error: BAD }; const s = +d.slice(-2), m = +(d.slice(-4, -2) || 0), h = +(d.slice(0, -4) || 0); if (s > 59 || m > 59 || h > 29) return { error: RANGE }; return { sec: h * 3600 + m * 60 + s, h, m, s }; }
function oldReadP(d) { d = d.replace(/^0+(?=\d)/, ''); if (!d || +d === 0) return null; if (d.length > 4) return { error: PBAD }; const s = +d.slice(-2), m = +(d.slice(0, -2) || 0); if (s > 59) return { error: PRANGE }; return { sec: m * 60 + s, m, s }; }
function oldBoot(d) { d = d.replace(/^0+(?=\d)/, ''); if (!d) return null; if (+d === 0) return { error: '0초는 계산할 수 없어요. 기록을 입력해 주세요.' }; return oldRead(d); }
const oldShow = (d) => { d = d.replace(/^0+(?=\d)/, ''); if (d.length <= 2) return d; if (d.length <= 4) return d.slice(0, -2) + ':' + d.slice(-2); return d.slice(0, -4) + ':' + d.slice(-4, -2) + ':' + d.slice(-2); };
const oldShowP = (d) => { d = d.replace(/^0+(?=\d)/, ''); if (d.length <= 2) return d; return d.slice(0, -2) + ':' + d.slice(-2); };
const samples = [''];
for (let len = 1; len <= 4; len++) for (let n = 0; n < 10 ** len; n++) samples.push(String(n).padStart(len, '0'));
for (let n = 0; n < 1e6; n += 7) samples.push(String(n), '0' + n);
for (let n = 1e6; n < 1e7; n += 9973) samples.push(String(n));
for (const d of samples) {
  assert.deepEqual(readTime(d), oldRead(d), d);
  assert.deepEqual(readTime(d, { zero: 'error' }), oldBoot(d), d);
  assert.deepEqual(readPace(d), oldReadP(d), d);
  assert.equal(showTime(d), oldShow(d), d);
  assert.equal(showPace(d), oldShowP(d), d);
}

console.log(`parse ok (${samples.length} digit strings match the old page functions)`);
