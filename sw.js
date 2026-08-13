/* Service Worker —— 离线缓存核心
 * 版本号：每次改核心文件就 +1，旧缓存自动作废更新
 */
const CACHE_NAME = 'toolbox-v3';
const APP_SHELL = [
  './',
  './index.html',
  './manifest.json',
  './css/style.css',
  './js/app.js',
  './js/tools.js',
  './js/hardware.js',
  './js/projects.js',
  './js/lib/jsQR.js',
  './js/lib/qrcode.js',
  './icons/icon-192.png',
  './icons/icon-512.png'
];

/* install：装 App 时先把核心文件全缓存下来，一次性成功才激活 */
self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(CACHE_NAME).then((cache) => cache.addAll(APP_SHELL))
  );
  self.skipWaiting();
});

/* activate：清理旧版本缓存，避免磁盘堆垃圾 */
self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys().then((keys) =>
      Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k)))
    )
  );
  self.clients.claim();
});

/* fetch：核心策略 = 缓存优先。
 * 命中缓存直接返回（离线也能开）；没命中才请求网络并顺手缓存。
 * 跨域、非 GET 请求一律放行，交给网络。 */
self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  if (!req.url.startsWith(self.location.origin)) return;

  event.respondWith(
    caches.match(req).then((cached) => {
      return (
        cached ||
        fetch(req).then((resp) => {
          const clone = resp.clone();
          caches.open(CACHE_NAME).then((cache) => cache.put(req, clone));
          return resp;
        })
      );
    })
  );
});
