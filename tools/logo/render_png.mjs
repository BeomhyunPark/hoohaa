// PNG 아이콘, favicon.ico, og.png를 SVG 원본에서 다시 렌더한다. tools/build_logo.mjs --png가 부른다.
// Playwright(Chromium)가 필요하다: 프로젝트 의존성에 넣지 않았다(레포 루트에 package.json이 없다). 전역 설치를 찾는다.
// 아이콘 규칙(예전 learning 그대로): icon-32/192/512는 둥근 모서리 밖이 투명, apple-touch-icon(180)과
// icon-maskable-512는 꽉 찬 사각 배경. maskable은 안드로이드 안전 영역 때문에 심볼을 0.8배로 줄인다.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { readFileSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

function loadPlaywright() {
  for (const base of [process.cwd(), spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout.trim()]) {
    try { return createRequire(join(base, 'noop.js'))('playwright'); } catch { /* 다음 */ }
  }
  throw new Error('playwright를 찾지 못했다. `npm i -g playwright && npx playwright install chromium`');
}

/** PNG 여러 개를 담은 ICO. 요즘 브라우저는 ICO 안의 PNG를 그대로 읽는다. */
function ico(pngs) {
  const head = Buffer.alloc(6 + 16 * pngs.length); head.writeUInt16LE(0, 0); head.writeUInt16LE(1, 2); head.writeUInt16LE(pngs.length, 4);
  let off = head.length;
  pngs.forEach(({ size, buf }, i) => {
    const e = 6 + 16 * i; head.writeUInt8(size % 256, e); head.writeUInt8(size % 256, e + 1); head.writeUInt16LE(1, e + 4); head.writeUInt16LE(32, e + 6);
    head.writeUInt32LE(buf.length, e + 8); head.writeUInt32LE(off, e + 12); off += buf.length;
  });
  return Buffer.concat([head, ...pngs.map((p) => p.buf)]);
}

export async function renderPngs(root, { tile, svgFile, VOLT }) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const shot = async (svg, size, opaque) => {
    await page.setViewportSize({ width: size, height: size });
    await page.setContent(`<html><body style="margin:0;background:transparent">${svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${size}" height="${size}"`)}</body></html>`);
    return page.screenshot({ omitBackground: !opaque, clip: { x: 0, y: 0, width: size, height: size } });
  };
  for (const s of [32, 192, 512]) writeFileSync(join(root, `icons/icon-${s}.png`), await shot(tile(s), s, false));
  writeFileSync(join(root, 'icons/apple-touch-icon.png'), await shot(tile(180, { radius: 0 }), 180, true));
  writeFileSync(join(root, 'icons/icon-maskable-512.png'), await shot(tile(512, { radius: 0, k: 0.74 * 0.8 }), 512, true));
  const fav = readFileSync(join(root, 'favicon.svg'), 'utf8');
  writeFileSync(join(root, 'favicon.ico'), ico([{ size: 16, buf: await shot(fav, 16, false) }, { size: 32, buf: await shot(fav, 32, false) }]));

  // og.png: 1200×630, 볼트 바탕에 워드마크와 한 줄 소개.
  await page.setViewportSize({ width: 1200, height: 630 });
  await page.setContent(`<html><head><style>
    body{margin:0;width:1200px;height:630px;display:flex;flex-direction:column;align-items:center;justify-content:center;gap:56px;
      background:radial-gradient(ellipse 70% 60% at 50% 45%,#1A1A16 0%,${VOLT.bg} 70%);font-family:"Pretendard","Noto Sans KR",sans-serif}
    p{margin:0;font-size:54px;font-weight:700;letter-spacing:-.01em;color:#E2F7A6}
  </style></head><body>${svgFile({ text: 'hoohaa' }).replace(/width="[\d.]+" height="[\d.]+"/, 'width="600" height="140"')}<p>후하후하, 내 PB는 무슨 티어?</p></body></html>`);
  await page.evaluate(() => document.fonts.ready);
  writeFileSync(join(root, 'og.png'), await page.screenshot({ clip: { x: 0, y: 0, width: 1200, height: 630 } }));
  await browser.close();
  console.log('PNG: icon-32/192/512, apple-touch-icon, icon-maskable-512, favicon.ico, og.png');
}
