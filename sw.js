const prefix = 'sslj-checklist:' + self.registration.scope;
const cacheName = prefix + ':draft-2';
const files = [
  './', './index.html', './style.css', './checklist.js', './app.js',
  './manifest.webmanifest', './icon-180.png', './icon-192.png', './icon-512.png',
];
const assets = new Set(files.map((path) => new URL(path, self.registration.scope).href));

self.addEventListener('install', (event) => {
  event.waitUntil(caches.open(cacheName).then((cache) => cache.addAll(
    [...assets].map((url) => new Request(url, { cache: 'reload' }))
  )));
});

self.addEventListener('activate', (event) => {
  event.waitUntil((async () => {
    const keys = await caches.keys();
    await Promise.all(keys.filter((key) => key.startsWith(prefix + ':') && key !== cacheName)
      .map((key) => caches.delete(key)));
    await self.clients.claim();
  })());
});

self.addEventListener('fetch', (event) => {
  if (event.request.method !== 'GET') return;
  const url = new URL(event.request.url);
  url.search = '';
  if (!assets.has(url.href)) return;
  event.respondWith((async () => {
    const cache = await caches.open(cacheName);
    return await cache.match(url.href) || fetch(event.request);
  })());
});
