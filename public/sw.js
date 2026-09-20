/**
 * E22-07 — the service worker.
 *
 * WHAT THIS DELIBERATELY DOES NOT DO
 *
 * The backlog asked for "an offline shell with a cached last-known dashboard".
 * The shell is here; the cached dashboard is not, and that is a decision
 * rather than an omission.
 *
 * A cached dashboard means somebody's balances, written to the Cache API,
 * surviving in the browser profile. It would outlive signing out, it would be
 * readable by the next person to open the laptop, and it would defeat the
 * "hide balances" preference in the one situation that preference exists for.
 * The app's whole security model is that the ledger lives on the user's
 * Firefly instance and this client holds as little of it as possible — a cache
 * of last Tuesday's net worth contradicts that for the benefit of showing
 * stale figures to someone with no connection, who cannot act on them anyway.
 *
 * So: static assets are cached (they are public, content-hashed and identical
 * for every user), navigations go to the network and fall back to a static
 * offline page, and NOTHING that required a session is ever stored.
 *
 * Plain JavaScript, served from /public, no build step and no dependency —
 * a service worker is ~80 lines and the libraries that generate it are a
 * bundler plugin, a config format, and a version to keep current.
 */

// Bump to invalidate everything a previous version cached.
const CACHE = 'firefly-studio-v1';

// The shell: enough to render the offline page with no network at all.
const PRECACHE = ['/offline.html', '/icon.svg', '/apple-icon.png'];

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches
      .open(CACHE)
      // Individually, so one 404 does not abort the whole install and leave
      // the worker permanently uninstalled.
      .then((cache) => Promise.allSettled(PRECACHE.map((url) => cache.add(url))))
      .then(() => self.skipWaiting()),
  );
});

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches
      .keys()
      .then((names) =>
        Promise.all(names.filter((name) => name !== CACHE).map((n) => caches.delete(n))),
      )
      .then(() => self.clients.claim()),
  );
});

/** Content-hashed build output and the icons: immutable, public, safe to keep. */
function isStaticAsset(url) {
  return (
    url.pathname.startsWith('/_next/static/') ||
    url.pathname === '/icon.svg' ||
    url.pathname === '/icon.png' ||
    url.pathname === '/apple-icon.png' ||
    url.pathname === '/favicon.ico' ||
    url.pathname === '/manifest.webmanifest'
  );
}

self.addEventListener('fetch', (event) => {
  const { request } = event;

  // Only GET. A POST is a Server Action or a write through the proxy, and
  // replaying one from a cache would be a way to charge something twice.
  if (request.method !== 'GET') return;

  const url = new URL(request.url);

  // Someone else's origin is not ours to cache or to serve.
  if (url.origin !== self.location.origin) return;

  // Never touch the API. /api/ff carries ledger data, /api/attachments carries
  // receipts, /api/health is a liveness probe that must never be answered from
  // a cache. All of it goes to the network or fails honestly.
  if (url.pathname.startsWith('/api/')) return;

  // The RSC payload for a page is page data, which means it is user data.
  if (url.searchParams.has('_rsc') || request.headers.get('RSC') === '1') return;

  if (isStaticAsset(url)) {
    // Cache-first: these filenames contain a content hash, so a stale hit is
    // impossible — a changed file is a changed URL.
    event.respondWith(
      caches.match(request).then(
        (hit) =>
          hit ??
          fetch(request).then((response) => {
            if (response.ok) {
              const copy = response.clone();
              caches.open(CACHE).then((cache) => cache.put(request, copy));
            }
            return response;
          }),
      ),
    );
    return;
  }

  if (request.mode === 'navigate') {
    // Network-first, and the response is NOT cached — an authenticated page is
    // somebody's finances. The fallback is the static offline page.
    event.respondWith(
      fetch(request).catch(() =>
        caches.match('/offline.html').then((hit) => hit ?? Response.error()),
      ),
    );
  }
});

/**
 * Signing out clears the cache. Nothing user-specific is in it by design, but
 * the guarantee people expect from "sign out" on a shared machine is that
 * nothing of theirs is left, and that should not rest on the reader trusting
 * the fetch handler above.
 */
self.addEventListener('message', (event) => {
  if (event.data === 'clear-cache') {
    event.waitUntil(caches.keys().then((names) => Promise.all(names.map((n) => caches.delete(n)))));
  }
});
