import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  W, H, PRE, ARC, needFull, alpha, rng, FONTS, PICKABLE, FONT_CATS, previewFam, nearW, W_, ARC_, PRE_,
  lum, ymd, STATS, statLabel, statValue, paceQ, pctOf, fillTok, STAT_SIZE, STAT_SIZE0, FILTERS, FORMATS, fmtH, MASKS,
  famOf, wOf, HAN, contrast, clone, hex2hsv, hsv2hex,
} from './util.js';

const d = { time: '50:00', pace: '5:00/km', word: 'GOLD', roman: 'I', tierKo: '골드 1', topLabel: '상위 37.9%', vdot: '41.2', nextLine: '플래티넘까지 1:23', recLine: '10K 50:00', key: 'gold' };
const today = ymd();

test('story size and font stacks', () => {
  assert.equal(W, 1080); assert.equal(H, 1920);
  assert.equal(W_, W); assert.equal(ARC_, ARC); assert.equal(PRE_, PRE);
  assert.match(PRE, /^"TC Pretendard","LZ pretendardk",-apple-system/);
});

test('alpha and lum', () => {
  assert.equal(alpha('#ff8000', 0.5), 'rgba(255,128,0,0.5)');
  assert.equal(lum('#000000'), 0);
  assert.equal(lum('#ffffff'), 1);
  assert.equal(lum('nope'), 1);
  assert.equal(contrast('#ffffff'), '#111111');
  assert.equal(contrast('#000000'), '#ffffff');
});

test('needFull only for Hangul outside the subset', () => {
  assert.equal(needFull('ABC 123'), false);
  assert.equal(needFull('기록'), false);
  assert.equal(needFull('뷁'), true);
  assert.equal(needFull('기', true), true);
  assert.equal(HAN.test('a가'), true);
});

test('ymd pads month and day', () => {
  assert.equal(ymd(new Date(2026, 4, 5, 12)), '2026.05.05');
  assert.match(today, /^\d{4}\.\d\d\.\d\d$/);
});

test('stat labels and values', () => {
  assert.equal(statLabel(d, 'rec'), '10K 기록');
  assert.equal(statLabel(d, 'pace'), STATS.pace[0]);
  assert.equal(statValue(d, {}, 'tier'), 'GOLD I');
  assert.equal(statValue(d, {}, 'date'), today);
  assert.equal(statValue(d, {}, 'race'), '대회명을 입력해 주세요');
  assert.equal(statValue(d, { race: ' 춘천 ' }, 'race'), '춘천');
  assert.equal(statValue(d, {}, 'event'), '10K');
  assert.equal(statValue(d, {}, 'rec', { tx: '{rec} · {pace}' }), `50:00 · 5'00"`);
  assert.equal(STAT_SIZE, STAT_SIZE0);
});

test('fillTok tokens', () => {
  assert.equal(paceQ('5:07/km'), `5'07"`);
  assert.equal(paceQ(''), '');
  assert.equal(pctOf(d), '37.9');
  assert.equal(fillTok('{tier} {pct}% {mmdd}', d, {}), `GOLD I 37.9% ${today.slice(5)}`);
  assert.equal(fillTok('{race} · {ev}', d, {}), '10K');
  assert.equal(fillTok('{race} · {ev}', d, { race: '춘천' }), '춘천 · 10K');
  assert.equal(fillTok('{pct}%', { ...d, topLabel: '상위 1% 이내' }, {}), '1% 이내');
  assert.equal(fillTok('{nope}', d, {}), '');
});

test('format, filter and mask tables', () => {
  assert.deepEqual(FORMATS.map(f => f[0]), ['story', 'feed', 'square', 'thumb']);
  assert.equal(fmtH('feed'), 1350);
  assert.equal(fmtH('thumb'), 1440);
  assert.equal(fmtH('unknown'), 1920);
  assert.equal(FILTERS[0][0], 'none');
  assert.deepEqual(MASKS.map(m => m[0]), ['rect', 'round', 'circle', 'polaroid']);
});

test('font registry', () => {
  assert.deepEqual(rng('400'), [400]);
  assert.deepEqual(rng('200 500'), [200, 300, 400, 500]);
  assert.equal(FONTS.archivo.fam, ARC);
  assert.ok(Object.keys(FONTS).length > 8, 'lazy fonts merged');
  for (const k of Object.keys(FONTS)) assert.ok(FONTS[k].ws.length, k);
  assert.ok(FONT_CATS.some(c => c[0] === 'hand'));
  assert.ok(PICKABLE('archivo'));
  assert.ok(!PICKABLE('nope'));
  assert.equal(previewFam('archivo'), ARC);
  assert.equal(previewFam('notokr'), `"PV notokr","LZ notokr",${PRE}`);
});

test('nearW, wOf, famOf', () => {
  assert.equal(nearW('archivo', 640), 600);
  assert.equal(nearW('bebas', 900), 400);
  assert.equal(wOf('archivo', 640), 600);
  assert.equal(wOf(null, 640), 640);
  assert.equal(wOf('nope', 640), 640);
  assert.equal(famOf('pretendard'), PRE);
  assert.equal(famOf(null, true), PRE);
  assert.equal(famOf(null, false), ARC);
});

test('clone and hsv round trip', () => {
  const o = { a: [1, { b: 2 }] }, c = clone(o);
  assert.deepEqual(c, o); assert.notEqual(c.a, o.a);
  assert.deepEqual(hex2hsv('#ff0000'), { h: 0, s: 1, v: 1 });
  for (const hex of ['#ff0000', '#12ab9f', '#000000', '#ffffff', '#7f3c99']) assert.equal(hsv2hex(hex2hsv(hex)), hex);
});
