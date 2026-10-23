const CACHE = 'hoohaa-shell-7';
const SHELL = [
  '/app/',
  '/app/index.html',
  '/manifest.webmanifest',
  '/favicon.ico',
  '/favicon.svg',
  '/icons/apple-touch-icon.png',
  '/icons/icon-32.png',
  '/icons/icon-192.png',
  '/icons/icon-512.png',
  '/icons/icon-maskable-512.png',
  '/icons/wordmark.svg',
  '/src/app/boot.js',
  '/src/engine/tier.js',
  '/src/engine/data.js',
  '/src/storage/device.js',
  '/src/styles/app.css',
  '/privacy/',
  '/support/',
];
// Fetched when the result editor opens. Cached after that use, not on install.
const ON_USE = [
  '/src/editor/editor.js',
  '/src/editor/workout.js',
  '/src/editor/assets.js',
  '/src/net/weather.js',
  '/src/styles/card.css',
  '/src/app/logs.js',
  '/src/engine/logcalc.js',
  '/src/storage/logdb.js',
  '/src/storage/zip.js',
  '/src/editor/logtpl.js',
];

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(CACHE).then((cache) => cache.addAll(SHELL)).then(() => self.skipWaiting()));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)));
    await self.clients.claim();
  })());
});

function shellPath(pathname) {
  if (pathname === '/app' || pathname === '/privacy' || pathname === '/support') return pathname + '/';
  return pathname;
}

function shouldHandle(req) {
  if (req.method !== 'GET') return false;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return false;
  if (req.headers.has('range')) return false;
  if (url.pathname === '/sw.js') return false;
  const path = shellPath(url.pathname);
  if (req.mode === 'navigate') {
    return path === '/app/' || path.startsWith('/app/') || path === '/privacy/' || path === '/support/';
  }
  return SHELL.includes(path) || ON_USE.includes(path);
}

async function networkFirst(req) {
  const cache = await caches.open(CACHE);
  try {
    const fresh = await fetch(req);
    if (fresh.ok) cache.put(req, fresh.clone());
    return fresh;
  } catch (err) {
    const hit = (await cache.match(req)) || (await cache.match(shellPath(new URL(req.url).pathname)));
    if (hit) return hit;
    if (req.mode === 'navigate') {
      return new Response('오프라인이에요. 연결을 확인한 뒤 다시 열어 주세요.', {
        status: 503,
        headers: { 'Content-Type': 'text/plain; charset=utf-8' },
      });
    }
    throw err;
  }
}

self.addEventListener('fetch', (event) => {
  if (!shouldHandle(event.request)) return;
  event.respondWith(networkFirst(event.request));
});
