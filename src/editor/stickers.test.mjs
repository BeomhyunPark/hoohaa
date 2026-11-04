import { test } from 'node:test';
import assert from 'node:assert/strict';
import {
  simg, INK, PAPER, CREAM, GLASS, GEARC, SV, glassBox, line, CLOUD, SUN, WICON, WEATHER, DATA_STK, COURSE, dataArt, dataFields,
} from './stickers.js';

const isSvg = s => typeof s === 'string' && s.startsWith('<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"') && s.endsWith('</svg>');

test('palette and svg helpers', () => {
  for (const c of [INK, PAPER, CREAM, GLASS, GEARC]) assert.match(c, /^#[0-9A-F]{6}$/);
  assert.ok(isSvg(SV('<g/>')));
  assert.ok(SV('<g id="x"/>').includes('<g id="x"/>'));
  assert.equal(line('M0 0'), `<path d="M0 0" fill="none" stroke="${PAPER}" stroke-width="6" stroke-linecap="round" stroke-linejoin="round"/>`);
  assert.ok(line('M0 0', '#123456', '#abcdef').includes('fill="#abcdef" stroke="#123456"'));
  assert.ok(glassBox(1, 2, 3, 4, 5).startsWith(`<rect x="1" y="2" width="3" height="4" rx="5" fill="${GLASS}"`));
  assert.ok(SUN(0, 0, 10).startsWith('M10 0a10 10 0 1 1-20 0a10 10 0 1 1 20 0'));
  assert.ok(CLOUD(0, 0).startsWith('M-50 28a24 24 0 0 1 6-46'));
  assert.equal(CLOUD(0, 0, 2).startsWith('M-100 56'), true);
  assert.match(COURSE, /^M100 380 C/);
  assert.ok(simg instanceof Map);
});

test('every weather choice has an icon', () => {
  assert.deepEqual(WEATHER.map(w => w[0]), Object.keys(WICON));
  for (const k of Object.keys(WICON)) assert.match(WICON[k], /^<path /, k);
});

test('dataArt draws each data sticker and nothing else', () => {
  for (const k of Object.keys(DATA_STK)) assert.ok(isSvg(dataArt(k, {})), k);
  assert.ok(isSvg(dataArt('data_weather_rain', {})));
  assert.equal(dataArt('nope', {}), null);
  assert.equal(dataArt('data_weather', { icon: 'nope' }), dataArt('data_weather', { icon: 'sun' }));
  assert.notEqual(dataArt('data_weather', { icon: 'rain' }), dataArt('data_weather', { icon: 'sun' }));
  assert.ok(dataArt('data_bib', { color: '#ff0000' }).includes('#ff0000'));
  assert.ok(dataArt('data_bib', {}).includes(GEARC));
});

test('dataFields merges defaults, icon from key, then user fields', () => {
  assert.deepEqual(dataFields({ k: 'data_course' }), DATA_STK.data_course.f);
  assert.deepEqual(dataFields({ k: 'data_course', f: { name: 'X' } }), { ...DATA_STK.data_course.f, name: 'X' });
  assert.equal(dataFields({ k: 'data_weather_rain' }).icon, 'rain');
  assert.equal(dataFields({ k: 'data_weather_rain', f: { icon: 'snow' } }).icon, 'snow');
  assert.equal(dataFields({ k: 'data_weather' }).icon, 'sun');
  assert.equal(dataFields({ k: 'data_weather_rain' }).temp, DATA_STK.data_weather.f.temp);
  assert.deepEqual(dataFields({ k: 'nope' }), {});
});
