// 폰 화면 확인용 스크린샷. 폰이나 시뮬레이터가 없는 곳(클라우드 세션, CI)에서 쓴다.
//
// 1. `expo export --platform web`으로 앱을 웹 번들로 만든다(임시 폴더, 배포하지 않는다).
// 2. 그 폴더를 127.0.0.1에서만 잠깐 띄운다.
// 3. Playwright(Chromium)로 iPhone(390×844)과 Android(412×915) 크기 스크린샷을 찍는다.
//
// 웹 번들은 react-native-web으로 그린 근사치다. 글꼴, 상태 표시줄, 안전 영역은 실제 폰과 다르다.
// 실제 화면은 개발 빌드를 기기나 시뮬레이터에서 확인한다.
//
// 찍는 화면은 아래 FLOWS에 있다. 한 흐름은 화면을 순서대로 눌러 가며 여러 장을 찍는다.
// 파일 이름은 <흐름>-<단계>-<기기>.png다. 흐름 중간에 누르는 영역 크기(44pt 이상)도 같이 잰다.
//
// 쓰는 법 (mobile/ 에서):
//   npm run screenshot                       # ../docs/screenshots/v4/after-run-1-before-iphone.png 등 10장
//   npm run screenshot -- --flow after-run   # 흐름 고르기(기본값 after-run)
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

// health는 가짜 건강 앱이 어느 샘플을 넣을지다(App.tsx의 ?health=). 폰 크기에 맞는 건강 앱 샘플을 쓴다.
const DEVICES = [
  { key: 'iphone', viewport: { width: 390, height: 844 }, health: 'apple_health' },
  { key: 'android', viewport: { width: 412, height: 915 }, health: 'health_connect' },
];

const MIN_TOUCH = 44;

/** 누르는 영역이 가로세로 44 이상인지 잰다. 웹 번들의 CSS px는 폰의 pt와 같은 크기다. */
async function expectTouchSize(locator, what) {
  const n = await locator.count();
  if (n === 0) throw new Error(`${what}: 화면에 없다`);
  for (let i = 0; i < n; i++) {
    const box = await locator.nth(i).boundingBox();
    if (!box || box.width < MIN_TOUCH || box.height < MIN_TOUCH) {
      throw new Error(`${what} ${i + 1}번째: 누르는 영역이 ${box?.width}×${box?.height}로 ${MIN_TOUCH}보다 작다`);
    }
  }
}

// 흐름 하나 = 화면을 순서대로 눌러 가며 찍는 단계들. run은 그 단계의 화면을 만들고, 끝나면 한 장을 찍는다.
const FLOWS = {
  // 운동이 끝난 뒤 첫 화면: 입력 전 → 체감 피로 선택 → 저장 → 수정 → 앱을 다시 열었을 때.
  'after-run': [
    {
      step: '1-before',
      async run(page) {
        await page.getByText('운동 기록', { exact: true }).waitFor();
        await expectTouchSize(page.getByRole('radio'), '피로 버튼');
        await expectTouchSize(page.getByRole('button', { name: '저장', exact: true }), '저장 버튼');
      },
    },
    {
      step: '2-picked',
      async run(page) {
        await page.getByRole('radio', { name: '체감 피로 7', exact: true }).click();
        await page.getByRole('radio', { name: '체감 피로 7', exact: true, checked: true }).waitFor();
        await page.getByPlaceholder('예: 왼쪽 무릎이 조금 아파요').fill('왼쪽 무릎이 조금 아파요');
        await page.getByRole('button', { name: '저장', exact: true }).focus(); // 입력칸의 커서를 치운다
      },
    },
    {
      step: '3-saved',
      async run(page) {
        await page.getByRole('button', { name: '저장', exact: true }).click();
        await page.getByText('저장했어요', { exact: true }).waitFor();
        await expectTouchSize(page.getByRole('button', { name: '수정', exact: true }), '수정 버튼');
      },
    },
    {
      step: '4-edit',
      async run(page) {
        await page.getByRole('button', { name: '수정', exact: true }).click();
        // 저장한 값이 채워진 채로 다시 열린다.
        await page.getByRole('radio', { name: '체감 피로 7', exact: true, checked: true }).waitFor();
        await expectTouchSize(page.getByRole('button', { name: '취소', exact: true }), '취소 버튼');
      },
    },
    {
      // 이미 저장한 기록이 다시 들어온 화면. 페이지를 새로 읽으면 앱이 처음부터 다시 뜬다(앱을 닫았다 연 것과 같다).
      // 남는 것은 기기 저장소뿐이다. 웹 번들에서는 AsyncStorage가 브라우저의 localStorage에 쓴다.
      step: '5-reopened',
      async run(page) {
        await page.getByRole('button', { name: '취소', exact: true }).click();
        await page.reload({ waitUntil: 'networkidle' });
        await page.getByText('운동 기록', { exact: true }).waitFor();
        // 다시 묻지 않고(피로 버튼, 메모 칸, 저장 버튼이 없다) 저장한 값을 보여 준다.
        await page.getByLabel('체감 피로, 7', { exact: true }).waitFor();
        await page.getByLabel('메모, 왼쪽 무릎이 조금 아파요', { exact: true }).waitFor();
        for (const [what, locator] of [
          ['피로 버튼', page.getByRole('radio')],
          ['메모 칸', page.getByPlaceholder('예: 왼쪽 무릎이 조금 아파요')],
          ['저장 버튼', page.getByRole('button', { name: '저장', exact: true })],
        ]) {
          if ((await locator.count()) !== 0) throw new Error(`다시 연 화면에 ${what}이 있다. 이미 저장한 기록은 다시 묻지 않아야 한다`);
        }
        await expectTouchSize(page.getByRole('button', { name: '수정', exact: true }), '수정 버튼');
      },
    },
  ],
};

function args(argv) {
  const o = { flow: 'after-run', out: resolve(mobileDir, '../docs/screenshots/v4'), dist: null };
  for (let i = 0; i < argv.length; i++) {
    const k = argv[i], v = argv[i + 1];
    if (k === '--flow') { o.flow = v; i++; }
    else if (k === '--out') { o.out = resolve(v); i++; }
    else if (k === '--dist') { o.dist = resolve(v); i++; }
    else throw new Error(`모르는 옵션: ${k}`);
  }
  if (!Object.hasOwn(FLOWS, o.flow)) throw new Error(`모르는 흐름: ${o.flow} (있는 흐름: ${Object.keys(FLOWS).join(', ')})`);
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
    // 날짜는 기기 시간대로 적힌다. 어디서 찍어도 같은 그림이 나오게 한국 폰으로 맞춘다.
    const page = await browser.newPage({
      viewport: d.viewport, deviceScaleFactor: 2, isMobile: true, hasTouch: true,
      locale: 'ko-KR', timezoneId: 'Asia/Seoul',
    });
    const errors = [];
    page.on('pageerror', (e) => errors.push(e.message));
    await page.goto(`${base}?health=${d.health}`, { waitUntil: 'networkidle' });
    await page.getByText('hoohaa', { exact: true }).waitFor();
    for (const { step, run } of FLOWS[opt.flow]) {
      await run(page);
      if (errors.length) throw new Error(`${d.key} ${step}: 페이지 오류\n${errors.join('\n')}`);
      const file = join(opt.out, `${opt.flow}-${step}-${d.key}.png`);
      await page.screenshot({ path: file });
      console.log(`${d.key} ${d.viewport.width}×${d.viewport.height} ${step} → ${file}`);
    }
    await page.close();
  }
} finally {
  await browser.close();
  server.close();
  if (!opt.dist) rmSync(dist, { recursive: true, force: true });
}
