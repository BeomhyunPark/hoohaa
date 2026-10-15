import { test } from 'node:test';
import assert from 'node:assert/strict';
import { calculate, vdot, fmtPace } from './tier.js';
import { D } from './data.js';

const today = new Date('2026-06-15T12:00:00');

function run(extra) {
  return calculate({ birthYear: 1995, sex: 'M', event: '10K', time: '50:00', today, ...extra });
}

test('10K 50:00, male born 1995 is Gold 1 near the top 37.9%', () => {
  const r = run();
  assert.equal(r.ok, true);
  assert.equal(r.tier, '골드 1');
  assert.equal(r.tierIndex, 11);
  assert.equal(r.topPercentLabel, '상위 37.9%');
  assert.equal(r.topPercent1, 37.9);
  assert.equal(r.input.age, 31);
  assert.equal(r.input.ageGroup, '30s');
  assert.equal(r.input.ageGroupLabel, '30대');
  assert.equal(r.pace, '5:00/km');
});

test('age is accepted only from 10 through 100', () => {
  assert.equal(run({ birthYear: 2016 }).ok, true);
  assert.equal(run({ birthYear: 2016 }).input.age, 10);
  assert.equal(run({ birthYear: 1926, sex: 'F', event: '5K', time: '40:00' }).input.age, 100);
  assert.deepEqual(run({ birthYear: 2017 }).errors.map(e => e.code), ['age_range']);
  assert.deepEqual(run({ birthYear: 1925 }).errors.map(e => e.code), ['age_range']);
});

test('distance is accepted only from 1.5km through 100km', () => {
  const at = km => calculate({ birthYear: 1995, sex: 'M', distanceKm: km, time: km < 50 ? '1:00:00' : '10:00:00', today });
  assert.deepEqual(at(1).errors.map(e => e.code), ['distance_range']);
  assert.equal(at(1.5).ok, true);
  assert.equal(at(100).ok, true);
  assert.deepEqual(at(101).errors.map(e => e.code), ['distance_range']);
});

test('a time faster than 0.98× the world record is rejected', () => {
  const r = run({ time: 1500 });
  assert.equal(r.ok, false);
  assert.deepEqual(r.errors.map(e => e.code), ['faster_than_wr']);
  assert.equal(D.wrFactor, 0.98);
  assert.equal(D.vdotMax, 85);
});

test('standard-distance boundaries keep the published tier', () => {
  const bounds = D.thresholds30s.M['10K'];
  assert.equal(bounds.length, 23);
  assert.equal(bounds[22], 2011);
  assert.equal(bounds[8], 3178);
  const challenger = run({ time: 2011 });
  assert.equal(challenger.tier, '챌린저');
  assert.equal(challenger.tierIndex, 23);
  const below = run({ time: 2012 });
  assert.equal(below.tier, '그랜드마스터');
  assert.equal(below.tierIndex, 22);
  const gold = run({ time: 3178 });
  assert.equal(gold.tier, '골드 3');
  assert.equal(gold.tierIndex, 9);
});

test('vdot and pace format stay available to the tool pages', () => {
  const v = vdot(10000, 50);
  assert.equal(typeof v, 'number');
  assert.ok(v > 30 && v < 50);
  assert.equal(fmtPace(300), '5:00/km');
});
