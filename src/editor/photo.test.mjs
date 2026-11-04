import { test } from 'node:test';
import assert from 'node:assert/strict';

// photo.js builds the MediaPipe path from location at import time (as editor.js did), so give node one.
globalThis.location = new URL('https://hoohaa.example/result/');
const { peKey, hasPE, imContent, bgRect, SEG, segP, segErr, segBusy, fcache, pcache, segFailMsg, filtered, photoSrc, subjectLayer } = await import('./photo.js');

test('MediaPipe is not loaded at import', () => {
  assert.equal(SEG, 'https://hoohaa.example/seg/');
  assert.equal(segP, null);
  assert.equal(segErr, '');
  assert.ok(segBusy instanceof Map && fcache instanceof Map && pcache instanceof Map);
  assert.equal(segFailMsg('그대로 둘게요'), '인물 인식에 실패했어요 · 그대로 둘게요');
});

test('hasPE and peKey', () => {
  assert.equal(hasPE({}), false);
  assert.equal(hasPE({ filter: 'none' }), false);
  for (const P of [{ rot: 1 }, { flip: true }, { crop: { x: 0, y: 0, w: .5, h: .5 } }, { adj: { br: 1 } }, { cut: true }, { filter: 'bw' }]) assert.equal(hasPE(P), true, JSON.stringify(P));
  assert.equal(peKey({}), '[0,false,0,"none",0,false,0]');
  // the outline only matters for a cut-out
  assert.equal(peKey({ ol: { on: true, w: 5 } }), peKey({}));
  assert.notEqual(peKey({ cut: true, ol: { on: true, w: 5 } }), peKey({ cut: true }));
});

test('no edits: the photo itself is used', () => {
  const im = { width: 10, height: 20 };
  assert.equal(filtered(im, 'none'), im);
  assert.equal(photoSrc({ a: im }, 'a', {}), im);
  assert.equal(photoSrc({}, 'a', { rot: 1 }), null);
  assert.equal(subjectLayer({ bg: { type: 'photo', pid: 'a' } }, { a: im }, 1920), null); // no mask yet
});

test('imContent strips the outline padding', () => {
  assert.deepEqual(imContent(null), { pad: 0, w: 1, h: 1 });
  assert.deepEqual(imContent({ width: 100, height: 50 }), { pad: 0, w: 100, h: 50 });
  assert.deepEqual(imContent({ width: 120, height: 70, _olPad: 10 }), { pad: 10, w: 100, h: 50 });
});

test('bgRect covers the canvas of the given height', () => {
  const im = { width: 1000, height: 1000 };
  // story 1080x1920: scale to cover height, centred horizontally
  assert.deepEqual(bgRect({}, im, 1920), [-420, 0, 1920, 1920]);
  // square 1080x1080
  assert.deepEqual(bgRect({}, im, 1080).map(v => v + 0), [0, 0, 1080, 1080]);
  // px pans within the overflow, clamped to -1..1
  assert.deepEqual(bgRect({ px: 1 }, im, 1920), [0, 0, 1920, 1920]);
  assert.deepEqual(bgRect({ px: 5 }, im, 1920), bgRect({ px: 1 }, im, 1920));
  // zoom
  assert.deepEqual(bgRect({ pz: 2 }, im, 1080), [-540, -540, 2160, 2160]);
  // outline padding shifts the drawn image out by the pad
  const [x, y, w, h] = bgRect({}, { width: 1020, height: 1020, _olPad: 10 }, 1080);
  [-10.8, -10.8, 1101.6, 1101.6].forEach((v, i) => assert.ok(Math.abs([x, y, w, h][i] - v) < 1e-9, `${i}: ${[x, y, w, h][i]}`));
});
