/* WildLens service worker.
 * - Precaches the app shell (the list below is filled in at build time).
 * - Cache-first for same-origin assets, so the app opens with no connection.
 * - Navigations fall back to the cached index.html (single-page app).
 * Model files are cached separately by Transformers.js (Cache Storage "transformers-cache");
 * this worker never touches other origins, so photos and model downloads are not intercepted.
 */
const VERSION = '__BUILD_ID__';
const SHELL = `wildlens-shell-${VERSION}`;
const PRECACHE = self.__PRECACHE__ || [];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(SHELL).then((c) => c.addAll(['/', ...PRECACHE])).then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k.startsWith('wildlens-shell-') && k !== SHELL).map((k) => caches.delete(k))))
      .then(() => self.clients.claim()),
  );
});

self.addEventListener('fetch', (event) => {
  const req = event.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;

  if (req.mode === 'navigate') {
    event.respondWith(
      fetch(req)
        .then((res) => {
          const copy = res.clone();
          caches.open(SHELL).then((c) => c.put('/', copy));
          return res;
        })
        .catch(() => caches.match('/')),
    );
    return;
  }

  event.respondWith(
    caches.match(req).then(
      (hit) =>
        hit ||
        fetch(req).then((res) => {
          if (res.ok) {
            const copy = res.clone();
            // The big ONNX Runtime files live in a cache that survives app updates.
            const name = url.pathname.startsWith('/ort/') ? 'wildlens-runtime' : SHELL;
            caches.open(name).then((c) => c.put(req, copy));
          }
          return res;
        }),
    ),
  );
});
