/**
 * Deliberately minimal. This app is a live multiplayer game — caching
 * anything dynamic (pages, API responses, Supabase calls) would be a
 * correctness bug, not a performance win, so this service worker does
 * exactly one thing: cache-first for a small fixed list of static icon
 * assets, and pass every other request straight to the network untouched.
 *
 * Its main purpose is satisfying the browser's PWA installability
 * criteria (a registered service worker with a fetch handler) for the
 * "Install Bagdoonis" button — see components/pwa/.
 */

const CACHE_NAME = "bagdoonis-static-v1";
const STATIC_ASSETS = [
  "/icon-192.png",
  "/icon-512.png",
  "/icon-maskable.png",
  "/apple-touch-icon.png",
  "/favicon.ico",
];

self.addEventListener("install", (event) => {
  event.waitUntil(
    caches
      .open(CACHE_NAME)
      .then((cache) => cache.addAll(STATIC_ASSETS))
      .catch(() => {
        // A single failed asset shouldn't block installation.
      })
  );
  self.skipWaiting();
});

self.addEventListener("activate", (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((keys) => Promise.all(keys.filter((k) => k !== CACHE_NAME).map((k) => caches.delete(k))))
      .then(() => self.clients.claim())
  );
});

self.addEventListener("fetch", (event) => {
  const { request } = event;

  // Never touch non-GET requests (Supabase writes, form posts, etc.) —
  // let the browser handle them exactly as if no service worker existed.
  if (request.method !== "GET") return;

  const url = new URL(request.url);
  const isKnownStaticAsset = url.origin === self.location.origin && STATIC_ASSETS.includes(url.pathname);
  if (!isKnownStaticAsset) return; // pages, API calls, Supabase — straight to network, untouched

  event.respondWith(
    caches.match(request).then((cached) => cached || fetch(request))
  );
});
