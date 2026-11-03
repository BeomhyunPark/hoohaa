import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  TK, STORY_FX, STORY_MAT, TIER_COMMENTS, tierComment, glyphPts, glyphSVG, HEX_SVG, TOPO_D, topoSVG, svgURL,
  RC_METAL, RC_FLIP, RC_BAND, RC_MOTIF, runChipSVG, CARD_INK, EMB, tierTint, accentOf, metalTok,
} from './tokens.js';

const KEYS = ['iron', 'bronze', 'silver', 'gold', 'platinum', 'emerald', 'diamond', 'master', 'grandmaster', 'challenger'];

test('every tier has tokens, material, metal and band', () => {
  assert.deepEqual(Object.keys(TK.tier), KEYS);
  assert.deepEqual(Object.keys(STORY_FX), KEYS);
  for (const k of KEYS) {
    const t = TK.tier[k], m = STORY_MAT[k];
    assert.equal(m.s, t.card.stops, k);
    assert.equal(m.ink, t.card.ink, k);
    assert.equal(m.text, t.text, k);
    assert.equal(m.sheen, STORY_FX[k].sheen, k);
    assert.equal(RC_METAL[k].length, 3, k);
    assert.ok(RC_MOTIF[RC_BAND[k]], k);
  }
  assert.equal(RC_FLIP.gold, 1);
  assert.equal(RC_FLIP.iron, undefined);
});

test('tierComment picks by key and roman numeral', () => {
  assert.equal(tierComment('iron', 'III'), TIER_COMMENTS.iron3);
  assert.equal(tierComment('iron', 'I'), TIER_COMMENTS.iron1);
  assert.equal(tierComment('master', ''), TIER_COMMENTS.master);
  assert.equal(tierComment('nope', 'I'), '');
});

test('accent, tint and card ink', () => {
  const d = { key: 'gold' };
  assert.equal(accentOf(d), TK.tier.gold.text);
  assert.equal(tierTint(d), (TK.tier.gold.tint_text || {}).light || TK.tier.gold.text);
  assert.match(CARD_INK.platinum, /^#[0-9A-F]{6}$/i);
  assert.deepEqual(EMB('master'), EMB('grandmaster'));
  for (const k of KEYS) assert.equal(EMB(k).length, 3, k);
});

test('metalTok swaps @m tokens for tier metal', () => {
  const [m0, , m2] = RC_METAL.gold;
  assert.equal(metalTok('#fff', { key: 'gold' }), '#fff');
  assert.equal(metalTok(null, { key: 'gold' }), null);
  assert.equal(metalTok('@m2', { key: 'gold' }), m2);
  const n = parseInt(m0.slice(1), 16);
  assert.equal(metalTok('@m0/0.5', { key: 'gold' }), `rgba(${n >> 16},${n >> 8 & 255},${n & 255},0.5)`);
  assert.deepEqual(metalTok({ a: '@m2', b: 1 }, { key: 'nope' }), { a: RC_METAL.gold[2], b: 1 });
  const o = { a: 1 };
  assert.equal(metalTok(o, { key: 'gold' }), o);
});

test('glyphs and svg art are strings', () => {
  assert.equal(glyphPts('iron'), null);
  assert.equal(glyphPts('gold').length, TK.tier.gold.card.glyph[1]);
  assert.match(glyphSVG('iron'), /<circle /);
  assert.match(glyphSVG('gold'), /<polygon points=/);
  assert.match(HEX_SVG, /^<svg /);
  assert.match(TOPO_D, /^M[\d.]+,[\d.]+L/);
  assert.match(topoSVG('#123456'), /stroke="#123456"/);
  assert.equal(svgURL('<a>'), 'url("data:image/svg+xml,%3Ca%3E")');
  for (const k of KEYS) assert.match(runChipSVG(k), new RegExp(`^<svg class="rc-svg"[\\s\\S]*id="rc-${k}-m"[\\s\\S]*</svg>$`), k);
  assert.equal(runChipSVG('nope').includes(RC_METAL.iron[0]), true);
});
