// RuralDoc offline support. Caches the app itself so it opens without internet after the first visit.
// API calls (symptom check, chat) always go to your server and are never cached.
const CACHE = 'ruraldoc-shell-v2';

self.addEventListener('install', (e) => { self.skipWaiting(); e.waitUntil(caches.open(CACHE).then((c) => c.addAll(['/', '/index.html']).catch(() => {}))); });
self.addEventListener('activate', (e) => {
  e.waitUntil(caches.keys().then((keys) => Promise.all(keys.filter((k) => k !== CACHE).map((k) => caches.delete(k)))).then(() => self.clients.claim()));
});

self.addEventListener('fetch', (e) => {
  const req = e.request;
  const url = new URL(req.url);
  if (url.pathname.startsWith('/api/')) return;
  if (req.method !== 'GET' || url.origin !== self.location.origin) return;       // never touch API / other sites
  if (req.headers.has('range')) return;                                           // let video seeking go straight to the network

  if (req.mode === 'navigate') {
    // page loads: try the network, fall back to the saved app
    e.respondWith(fetch(req).then((r) => { caches.open(CACHE).then((c) => c.put('/index.html', r.clone())); return r; })
      .catch(() => caches.match('/index.html')));
    return;
  }
  // scripts, styles, images, first-aid videos: saved the first time, then served instantly
  e.respondWith(caches.match(req).then((hit) => hit || fetch(req).then((r) => {
    if (r.ok && r.status === 200) { const copy = r.clone(); caches.open(CACHE).then((c) => c.put(req, copy)); }
    return r;
  }).catch(() => hit)));
});
