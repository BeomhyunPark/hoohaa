// 폰 앱 로고 자산을 렌더한다. tools/build_logo.mjs(기본 모드)가 부른다.
//
//   mobile/assets/logo/wordmark-<테마>.png, @2x, @3x   화면 위 워드마크. 높이 20pt(1배 20px). 테마마다 강조색이 달라 따로 만든다.
//   mobile/assets/icon.png                            앱 아이콘 1024(꽉 찬 볼트 바탕, iOS가 모서리를 깎는다)
//   mobile/assets/android-icon-foreground.png         적응형 아이콘 앞면 512(투명, 안전 영역 안)
//   mobile/assets/android-icon-background.png         적응형 아이콘 뒷면 512(볼트 바탕)
//   mobile/assets/android-icon-monochrome.png         단색 아이콘 432(흰 실루엣, 바늘은 뚫림)
//   mobile/assets/splash-icon.png                     시작 화면 가운데 심볼 1024(투명)
// 아이콘의 대표 색은 기본 테마(볼트)다. 아이콘은 테마를 따라 바뀌지 않는다.
import { spawnSync } from 'node:child_process';
import { createRequire } from 'node:module';
import { mkdirSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

export const WORDMARK_HEIGHT = 20;

function loadPlaywright() {
  for (const base of [process.cwd(), spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout.trim()]) {
    try { return createRequire(join(base, 'noop.js'))('playwright'); } catch { /* 다음 */ }
  }
  throw new Error('playwright를 찾지 못했다. `npm i -g playwright && npx playwright install chromium`');
}

/** svg를 w×h 픽셀로(비율은 svg의 viewBox를 가운데에 맞춘다). */
const sized = (svg, w, h) => svg.replace(/width="[\d.]+" height="[\d.]+"/, `width="${w}" height="${h}"`);

export async function renderApp(root, { svgFile, tile, monoSvg, VOLT, THEME_LOGO }) {
  const { chromium } = loadPlaywright();
  const browser = await chromium.launch();
  const page = await browser.newPage({ deviceScaleFactor: 1 });
  const shot = async (html, w, h, opaque = false) => {
    await page.setViewportSize({ width: w, height: h });
    await page.setContent(`<html><body style="margin:0;background:transparent;width:${w}px;height:${h}px;display:flex;align-items:center;justify-content:center">${html}</body></html>`);
    return page.screenshot({ omitBackground: !opaque, clip: { x: 0, y: 0, width: w, height: h } });
  };
  const out = join(root, 'mobile/assets'), logoDir = join(out, 'logo');
  mkdirSync(logoDir, { recursive: true });

  // 워드마크: 테마 3개 × 1·2·3배
  for (const [name, colors] of Object.entries(THEME_LOGO)) {
    const svg = svgFile({ text: 'hoohaa' }, colors), [, , vw, vh] = /viewBox="([^"]+)"/.exec(svg)[1].split(' ').map(Number);
    for (const k of [1, 2, 3]) {
      const h = WORDMARK_HEIGHT * k, w = Math.round((h * vw) / vh);
      writeFileSync(join(logoDir, `wordmark-${name}${k === 1 ? '' : `@${k}x`}.png`), await shot(sized(svg, w, h), w, h));
    }
  }

  // 앱 아이콘
  writeFileSync(join(out, 'icon.png'), await shot(tile(1024, { radius: 0, k: 0.6 }), 1024, 1024, true));
  writeFileSync(join(out, 'android-icon-background.png'), await shot(`<div style="width:512px;height:512px;background:${VOLT.bg}"></div>`, 512, 512, true));
  // 적응형 아이콘은 가운데 66%만 늘 보인다. 심볼을 그 안(높이 약 46%)에 둔다.
  writeFileSync(join(out, 'android-icon-foreground.png'), await shot(tile(512, { radius: -1, k: 0.46 }), 512, 512));
  writeFileSync(join(out, 'android-icon-monochrome.png'), await shot(sized(monoSvg({ text: 'o', color: '#FFFFFF' }), 200, 200), 432, 432));
  writeFileSync(join(out, 'splash-icon.png'), await shot(tile(1024, { radius: -1, k: 0.5 }), 1024, 1024));
  await browser.close();
  console.log('mobile/assets/logo/wordmark-{volt,nightSky,sunset}{,@2x,@3x}.png, icon.png, android-icon-*.png, splash-icon.png');
}
