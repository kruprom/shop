/**
 * Service Worker — ครูพร้อมสอน (ร้าน + Admin ในแอปเดียว) v12.12
 * - หน้าร้าน: Network-first (ได้ของใหม่เสมอ; ออฟไลน์ค่อยใช้แคช)
 * - /admin/: เปิดจากแคชทันที แล้วอัปเดตเบื้องหลัง (เปิดเร็วบนมือถือ)
 * - ไอคอน/ฟอนต์/CSS/JS ในโดเมนเดียวกัน: Cache-first
 * - Worker / Apps Script / ข้อมูลสินค้า-ออเดอร์: ไม่แตะแคชเลย (ข้อมูลสดเสมอ)
 */
const CACHE_VERSION = 'kps-app-v12.14';
const SHELL = CACHE_VERSION + '-shell';
const RUNTIME = CACHE_VERSION + '-runtime';
const PRECACHE = ['./', './admin/', './manifest.json', './pwa.js', './logo-kps.png', './icon-192.png', './icon-512.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(SHELL).then(function (c) {
    return Promise.all(PRECACHE.map(function (u) { return c.add(u).catch(function () {}); }));
  }).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (ks) {
    return Promise.all(ks.filter(function (k) { return k !== SHELL && k !== RUNTIME; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});

self.addEventListener('fetch', function (e) {
  const req = e.request;
  if (req.method !== 'GET') return;
  const url = new URL(req.url);
  if (url.origin !== self.location.origin) return;            // ข้ามโดเมน (Worker, GAS, ฟอนต์) = ไม่แตะ
  const isDoc = req.mode === 'navigate' || req.destination === 'document' || url.pathname.endsWith('.html');
  if (isDoc) {
    if (url.pathname.indexOf('/admin') === 0) { e.respondWith(swr(e, req)); }
    else { e.respondWith(networkFirst(req)); }
    return;
  }
  if (/\.(png|ico|jpg|jpeg|webp|svg|woff2?)$/.test(url.pathname)) { e.respondWith(cacheFirst(req)); return; }
  e.respondWith(networkFirst(req));                           // manifest.json ฯลฯ
});

async function swr(e, req) {
  const cache = await caches.open(RUNTIME);
  const cached = await cache.match(req, { ignoreSearch: true });
  const upd = fetch(req).then(function (r) { if (r && r.ok) cache.put(req, r.clone()); return r; }).catch(function () { return null; });
  if (cached) { e.waitUntil(upd); return cached; }
  const fresh = await upd;
  return fresh || offline();
}
async function networkFirst(req) {
  try {
    const r = await fetch(req);
    if (r && r.ok) { const c = await caches.open(RUNTIME); c.put(req, r.clone()); }
    return r;
  } catch (err) {
    const hit = await caches.match(req, { ignoreSearch: true });
    return hit || offline();
  }
}
async function cacheFirst(req) {
  const hit = await caches.match(req);
  if (hit) return hit;
  try {
    const r = await fetch(req);
    if (r && r.ok) { const c = await caches.open(RUNTIME); c.put(req, r.clone()); }
    return r;
  } catch (err) { return offline(); }
}
function offline() {
  return new Response('ออฟไลน์อยู่ ลองใหม่เมื่อมีสัญญาณนะคะ', { status: 503, headers: { 'Content-Type': 'text/plain; charset=utf-8' } });
}
self.addEventListener('message', function (e) {
  if (e.data && e.data.type === 'SKIP_WAITING') self.skipWaiting();
  if (e.data && e.data.type === 'CLEAR_CACHE') {
    e.waitUntil(caches.keys().then(function (ks) { return Promise.all(ks.map(function (k) { return caches.delete(k); })); })
      .then(function () { if (e.ports[0]) e.ports[0].postMessage({ success: true }); }));
  }
});
