import { test } from 'node:test';
import assert from 'node:assert/strict';
import { fmtSplit, paceGuide, parsePaceSec, parseWeekly } from './workout.js';

const fast = { E: '5:51/km ~ 6:59/km', M: '5:26/km', T: '5:06/km', I: '4:41/km', R: '4:20/km' };
const slow = { E: '7:20/km ~ 8:43/km', M: '6:52/km', T: '6:24/km', I: '5:54/km', R: '5:39/km' };

test('4:20/km is 52s for 200m and 1:44 for 400m', () => {
  assert.equal(parsePaceSec('4:20/km'), 260);
  assert.equal(fmtSplit(260 * 0.2), '52초');
  assert.equal(fmtSplit(260 * 0.4), '1분 44초');
});

test('empty weekly distance leaves the default ranges', () => {
  const g = paceGuide(fast, '');
  assert.match(g.T, /1km × 4~6회, 또는 20분 템포/);
  assert.match(g.T, /주간거리의 10%까지/);
  assert.match(g.I, /1km × 3~5회/);
  assert.match(g.I, /8%와 10km/);
  assert.match(g.R, /200m 52초 · 400m 1분 44초/);
  assert.match(g.R, /200m × 6~8회/);
  assert.match(g.R, /주간거리의 5%까지/);
  assert.equal(g.E.includes('5:51~6:59/km'), true);
  assert.equal(g.M.includes('앞과 뒤는 E (5:51~6:59/km)'), true);
  assert.equal(g.foot, '계산된 페이스를 그대로 따라가세요. 더 빠르게 달릴 필요는 없어요.');
  assert.equal(paceGuide(fast, null).T, g.T);
  assert.equal(parseWeekly('  '), null);
  assert.equal(parseWeekly('0'), null);
});

test('I slower than 5:00/km uses 800m, 5:00 stays 1km', () => {
  assert.match(paceGuide(slow, null).I, /800m × 3~5회/);
  assert.match(paceGuide({ ...fast, I: '5:00/km' }, null).I, /1km × 3~5회/);
  assert.equal(paceGuide({ ...fast, I: '5:01/km' }, null).I.includes('800m'), true);
});

test('weekly distance clips the top of each range', () => {
  const g = paceGuide(fast, 30);
  assert.match(g.T, /1km × 3회/);
  assert.equal(g.T.includes('20분 템포'), false);
  assert.match(g.I, /1km × 2회/);
  assert.match(g.R, /200m × 6~7회/);
});

test('a 20 minute tempo stays when it fits inside 10%', () => {
  const g = paceGuide({ ...fast, T: '3:00/km' }, 80);
  assert.match(g.T, /1km × 4~6회, 또는 20분 템포/);
});

test('R under four 200m reps becomes strides', () => {
  const g = paceGuide(fast, 10);
  assert.equal(g.R.includes('200m ×'), false);
  assert.match(g.R, /20초 스트라이드 × 4~6회/);
  assert.match(g.R, /200m 52초/);
});

test('caps do not raise the default range', () => {
  const g = paceGuide(fast, 200);
  assert.match(g.T, /4~6회/);
  assert.match(g.I, /3~5회/);
  assert.match(g.R, /6~8회/);
});
