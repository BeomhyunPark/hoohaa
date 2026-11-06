// 폰 화면 확인용 스크린샷. 폰이나 시뮬레이터가 없는 곳(클라우드 세션, CI)에서 쓴다.
//
// 1. `expo export --platform web`으로 앱을 웹 번들로 만든다(임시 폴더, 배포하지 않는다).
// 2. 그 폴더를 127.0.0.1에서만 잠깐 띄운다.
// 3. Playwright(Chromium)로 iPhone(390×844)과 Android(412×915) 크기 스크린샷을 찍는다.
//
// 웹 번들은 react-native-web으로 그린 근사치다. 글꼴, 상태 표시줄, 안전 영역은 실제 폰과 다르다.
// 실제 화면은 개발 빌드를 기기나 시뮬레이터에서 확인한다.
//
// 쓰는 법 (mobile/ 에서):
//   npm run screenshot                       # ../docs/screenshots/v4/empty-iphone.png, empty-android.png
//   npm run screenshot -- --name home        # home-iphone.png, home-android.png
//   npm run screenshot -- --out /tmp/shots   # 저장 폴더 바꾸기
//   npm run screenshot -- --dist ./dist-web  # 이미 export한 폴더를 그대로 쓰기
//
// Playwright와 Chromium은 이 앱의 의존성에 넣지 않았다. 없으면 따로 깐다:
//   npm i -g playwright && npx playwright install chromium

import { spawnSync } from 'node:child_process';
import { createReadStream, existsSync, mkdirSync, mkdtempSync, rmSync, statSync } from 'node:fs';
import { createServer } from 'node:http';
import { createRequire } from 'node:module';
import { tmpdir } from 'node:os';
import { dirname, extname, join, normalize, resolve, sep } from 'node:path';
import { fileURLToPath } from 'node:url';

const mobileDir = resolve(dirname(fileURLToPath(import.meta.url)), '..');

const DEVICES = [
  { key: 'iphone', viewport: { width: 390, height: 844 } },
  { key: 'android', viewport: { width: 412, height: 915 } },
];

function args(argv) {
  const o = { name: 'empty', out: resolve(mobileDir, '../docs/screenshots/v4'), dist: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--name') { o.name = v; i++; }
    else if (k === '--out') { o.out = resolve(v); i++; }
    else if (k === '--dist') { o.dist = resolve(v); i++; }
    else throw new Error(`모르는 옵션: ${k}`);
  }
  return o;
}

function loadPlaywright() {
  // 프로젝트 의존성 → 전역(NODE_PATH) 순서로 찾는다.
  const req = createRequire(join(mobileDir, 'package.json'));
  try { return req('playwright'); } catch {}
  for (const p of (process.env.NODE_PATH || '').split(':').filter(Boolean)) {
    try { return createRequire(join(p, 'noop.js'))('playwright'); } catch {}
  }
  const npmRoot = spawnSync('npm', ['root', '-g'], { encoding: 'utf8' }).stdout.trim();
  try { return createRequire(join(npmRoot, 'noop.js'))('playwright'); } catch {}
  throw new Error('playwright를 찾지 못했다. `npm i -g playwright && npx playwright install chromium`으로 깐다.');
}

function exportWeb() {
  const dir = mkdtempSync(join(tmpdir(), 'hoohaa-web-'));
  console.log(`expo export --platform web → ${dir}`);
  const r = spawnSync('npx', ['expo', 'export', '--platform', 'web', '--output-dir', dir], {
    cwd: mobileDir,
    stdio: 'inherit',
    env: { ...process.env, CI: '1', EXPO_OFFLINE: process.env.EXPO_OFFLINE ?? '1' },
  });
  if (r.status !== 0) throw new Error('expo export 실패');
  return dir;
}

const TYPES = { '.html': 'text/html', '.js': 'text/javascript', '.json': 'application/json', '.css': 'text/css', '.png': 'image/png', '.ttf': 'font/ttf', '.ico': 'image/x-icon' };

function serve(root) {
  const server = createServer((req, res) => {
    const url = decodeURIComponent(new URL(req.url, 'http://x').pathname);
    let file = normalize(join(root, url));
    if (!file.startsWith(root + sep) && file !== root) { res.writeHead(403).end(); return; }
    if (!existsSync(file) || statSync(file).isDirectory()) file = join(root, 'index.html');
    res.writeHead(200, { 'content-type': TYPES[extname(file)] ?? 'application/octet-stream' });
    createReadStream(file).pipe(res);
  });
  return new Promise((ok) => server.listen(0, '127.0.0.1', () => ok(server)));
}

const opt = args(process.argv.slice(2));
const { chromium } = loadPlaywright();
const dist = opt.dist ?? exportWeb();
const server = await serve(dist);
const base = `http://127.0.0.1:${server.address().port}/`;
mkdirSync(opt.out, { recursive: true });

const browser = await chromium.launch();
try {
  for (const d of DEVICES) {
    const page = await browser.newPage({ viewport: d.viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(base, { waitUntil: 'networkidle' });
    await page.getByText('hoohaa', { exact: true }).waitFor();
    if (errors.length) throw new Error(`${d.key}: 페이지 오류\n${errors.join('\n')}`);
    const file = join(opt.out, `${opt.name}-${d.key}.png`);
    await page.screenshot({ path: file });
    console.log(`${d.key} ${d.viewport.width}×${d.viewport.height} → ${file}`);
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
  if (!opt.dist) rmSync(dist, { recursive: true, force: true });
}
