/// <reference types="node" />  // 이 테스트만 child_process로 plain node를 부른다.
// 웹의 계산 엔진(../src/engine/tier.js, data.js)을 폰 앱 쪽 Jest에서 그대로 불러와,
// 웹의 src/engine/tier.test.mjs와 같은 값이 나오는지 본다.
import { execFileSync } from 'child_process';
import path from 'path';

import { D } from '@hoohaa/engine/data.js';
import { calculate, fmtPace, vdot } from '@hoohaa/engine/tier.js';
import type { CalculateInput, CalculateResult } from '@hoohaa/engine/tier.js';

const today = new Date('2026-06-15T12:00:00');

function ok(input: Partial<CalculateInput>): CalculateResult {
  const r = calculate({ birthYear: 1995, sex: 'M', event: '10K', time: '50:00', today, ...input });
  if (!r.ok) throw new Error(`계산 실패: ${JSON.stringify(r.errors)}`);
  return r;
}

test('10K 50:00, 1995년생 남자는 골드 1 · 상위 37.9% · VDOT 40 (tier.test.mjs와 같은 값)', () => {
  const r = ok({});
  expect(r.tier).toBe('골드 1');
  expect(r.tierIndex).toBe(11);
  expect(r.topPercentLabel).toBe('상위 37.9%');
  expect(r.topPercent1).toBe(37.9);
  expect(r.input.age).toBe(31);
  expect(r.input.ageGroup).toBe('30s');
  expect(r.pace).toBe('5:00/km');
  expect(r.vdot).toBe(40);
});

test('10K 경계 기록은 tier.test.mjs와 같은 티어를 낸다', () => {
  expect(D.thresholds30s.M['10K'][22]).toBe(2011);
  expect(ok({ time: 2011 })).toMatchObject({ tier: '챌린저', tierIndex: 23, vdot: 63.9 });
  expect(ok({ time: 2012 })).toMatchObject({ tier: '그랜드마스터', tierIndex: 22, vdot: 63.9 });
  expect(ok({ time: 3178 })).toMatchObject({ tier: '골드 3', tierIndex: 9, vdot: 37.4 });
});

test('세계기록 0.98배보다 빠른 기록은 tier.test.mjs처럼 거절한다', () => {
  const r = calculate({ birthYear: 1995, sex: 'M', event: '10K', time: 1500, today });
  expect(r.ok).toBe(false);
  if (!r.ok) expect(r.errors.map((e) => e.code)).toEqual(['faster_than_wr']);
  expect(D.wrFactor).toBe(0.98);
  expect(D.vdotMax).toBe(85);
});

test('vdot과 fmtPace도 그대로 쓸 수 있다', () => {
  expect(vdot(10000, 50)).toBeCloseTo(40.012, 3);
  expect(fmtPace(300)).toBe('5:00/km');
});

// 같은 파일을 웹처럼 plain node(ES 모듈)로 돌린 결과와, Jest(Babel 변환)로 돌린 결과가 한 글자도 다르지 않은지 본다.
const cases: Partial<CalculateInput>[] = [
  {},
  { time: 2011 },
  { time: 3178 },
  { sex: 'F', event: 'half', time: '1:45:00' },
  { event: 'full', time: '3:30:00' },
  { sex: 'F', event: '5K', time: '25:00', birthYear: 1975 },
  { distanceKm: 15, time: '1:20:00' },
];

test('plain node로 돌린 웹 엔진과 결과가 똑같다', () => {
  const engine = path.resolve(__dirname, '../../src/engine/tier.js');
  const script = `
    const { calculate } = await import(${JSON.stringify('file://' + engine)});
    const today = new Date(${JSON.stringify(today.toISOString())});
    const cases = ${JSON.stringify(cases)};
    console.log(JSON.stringify(cases.map(c => calculate({ birthYear: 1995, sex: 'M', event: '10K', time: '50:00', today, ...c }))));
  `;
  const fromNode = JSON.parse(execFileSync('node', ['--input-type=module', '-e', script], { encoding: 'utf8' }));
  const fromJest = cases.map((c) => calculate({ birthYear: 1995, sex: 'M', event: '10K', time: '50:00', today, ...c }));
  expect(fromJest).toEqual(fromNode);
  expect(fromJest.map((r) => (r.ok ? `${r.tier} ${r.vdot}` : 'error'))).toEqual([
    '골드 1 40',
    '챌린저 63.9',
    '골드 3 37.4',
    '다이아몬드 3 42.6',
    '플래티넘 1 44.6',
    expect.any(String),
    expect.any(String),
  ]);
});
