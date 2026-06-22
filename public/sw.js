/**
 * Kompilot Service Worker — v5
 *
 * Stratégies de cache :
 *   INSTALL    → pré-cache du shell minimal (index.html + favicon)
 *   Shell      (JS/CSS/fonts/manifest) → Cache First  (30 j)
 *   Images     (png/jpg/svg/webp/...)  → Cache First  (7 j)
 *   Data pages (academy/invoices/...)  → Stale-While-Revalidate
 *   API calls  (blink.new / /api/)     → Network First (fallback 30 min)
 *   Navigation → Network First → cache shell → offline page HTML inline
 *
 * Offline fallback :
 *   Toutes les navigations hors-ligne renvoient une page HTML légère
 *   qui indique à l'utilisateur de revenir quand le réseau est disponible.
 */

const CACHE_VERSION = 'v5';
const CACHE_SHELL   = `nc-shell-${CACHE_VERSION}`;
const CACHE_DATA    = `nc-data-${CACHE_VERSION}`;
const CACHE_IMAGES  = `nc-img-${CACHE_VERSION}`;

const KNOWN_CACHES  = [CACHE_SHELL, CACHE_DATA, CACHE_IMAGES];

/* Assets pré-cachés dès l'installation */
const PRECACHE_URLS = [
  '/',
  '/index.html',
  '/favicon.svg',
  '/manifest.webmanifest',
];

/* Patterns de routing */
const SHELL_PATTERNS  = [/\.js$/, /\.css$/, /\.woff2?$/, /manifest\.webmanifest$/];
const DATA_PATTERNS   = [/\/academy/, /\/invoices/, /\/profile/, /\/dashboard/];
const IMAGE_PATTERNS  = [/\.(png|jpg|jpeg|svg|gif|webp|avif|ico)(\?.*)?$/i];
const API_PATTERNS    = [/blink\.new\/api/, /core\.blink\.new/, /gbrhsehk\.backend\.blink\.new/, /\/api\//];

const MAX_SHELL_AGE   = 30 * 24 * 3600 * 1000; // 30 jours
const MAX_DATA_AGE    =  5 *       60 * 1000;  // 5 minutes
const MAX_API_AGE     = 30 *       60 * 1000;  // 30 minutes (fallback hors-ligne)
const MAX_IMAGE_AGE   =  7 * 24 * 3600 * 1000; // 7 jours

/* ── Page HTML de fallback hors-ligne ───────────────────────── */
const OFFLINE_HTML = `<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="utf-8"/>
  <meta name="viewport" content="width=device-width,initial-scale=1"/>
  <title>Kompilot — Hors-ligne</title>
  <style>
    *{margin:0;padding:0;box-sizing:border-box}
    body{font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;
      background:#F8FAFC;color:#0F172A;min-height:100vh;
      display:flex;align-items:center;justify-content:center;padding:24px}
    .card{background:#fff;border-radius:16px;padding:40px 32px;
      text-align:center;max-width:420px;box-shadow:0 4px 24px rgba(0,0,0,.08)}
    .icon{font-size:48px;margin-bottom:16px}
    h1{font-size:22px;font-weight:700;margin-bottom:8px;color:#0F172A}
    p{font-size:14px;color:#64748B;line-height:1.6;margin-bottom:24px}
    .btn{display:inline-block;padding:12px 24px;background:#0D9488;
      color:#fff;border-radius:10px;font-weight:600;font-size:14px;
      text-decoration:none;cursor:pointer;border:none}
    .tip{font-size:12px;color:#94A3B8;margin-top:16px}
  </style>
</head>
<body>
  <div class="card">
    <div class="icon">📡</div>
    <h1>Vous êtes hors-ligne</h1>
    <p>Kompilot n'a pas pu charger cette page.<br>
    Vérifiez votre connexion internet, puis réessayez.</p>
    <button class="btn" onclick="window.location.reload()">Réessayer</button>
    <p class="tip">⚡ Vos actions hors-ligne seront synchronisées automatiquement dès la reconnexion.</p>
  </div>
</body>
</html>`;

/* ── Install : pré-cache du shell ───────────────────────────── */
self.addEventListener('install', evt => {
  self.skipWaiting();
  evt.waitUntil(
    caches.open(CACHE_SHELL).then(cache =>
      cache.addAll(PRECACHE_URLS).catch(err =>
        console.warn('[SW] Pre-cache partiel :', err)
      )
    )
  );
});

/* ── Activate : purge des anciens caches ────────────────────── */
self.addEventListener('activate', evt => {
  evt.waitUntil(
    caches.keys()
      .then(keys => Promise.all(
        keys
          .filter(k => !KNOWN_CACHES.includes(k))
          .map(k  => caches.delete(k))
      ))
      .then(() => self.clients.claim())
  );
});

/* ── Fetch : routing ────────────────────────────────────────── */
self.addEventListener('fetch', evt => {
  const { request } = evt;
  const url = request.url;

  // Ignorer : non-GET, extensions, Vite HMR
  if (request.method !== 'GET') return;
  if (url.startsWith('chrome-extension://')) return;
  if (url.includes('/__vite') || url.includes('hot-update')) return;

  const isAPI   = API_PATTERNS.some(p => p.test(url));
  const isShell = SHELL_PATTERNS.some(p => p.test(url));
  const isImage = IMAGE_PATTERNS.some(p => p.test(url));
  const isData  = DATA_PATTERNS.some(p => p.test(url));
  const isNav   = request.mode === 'navigate';

  if (isAPI) {
    evt.respondWith(networkFirstWithCache(request, CACHE_DATA, MAX_API_AGE));
    return;
  }

  if (isShell) {
    evt.respondWith(cacheFirst(request, CACHE_SHELL, MAX_SHELL_AGE));
    return;
  }

  if (isImage) {
    evt.respondWith(cacheFirst(request, CACHE_IMAGES, MAX_IMAGE_AGE));
    return;
  }

  if (isData) {
    evt.respondWith(staleWhileRevalidate(request, CACHE_DATA));
    return;
  }

  // Navigation : Network First avec fallback offline page
  if (isNav) {
    evt.respondWith(navigationHandler(request));
    return;
  }

  evt.respondWith(networkFirstWithCache(request, CACHE_DATA, MAX_DATA_AGE));
});

/* ── Stratégies ─────────────────────────────────────────────── */

async function navigationHandler(request) {
  try {
    const fresh = await fetch(request);
    // Met en cache la réponse navigable pour un fallback futur
    if (fresh.ok) {
      const cache  = await caches.open(CACHE_SHELL);
      const clone  = fresh.clone();
      const hdrs   = new Headers(clone.headers);
      hdrs.set('sw-cached-at', String(Date.now()));
      cache.put(request, new Response(await clone.arrayBuffer(), {
        status: clone.status, statusText: clone.statusText, headers: hdrs,
      }));
    }
    return fresh;
  } catch {
    // Essaye le cache shell (index.html), sinon la page hors-ligne embarquée
    const cached = await caches.match(request) || await caches.match('/') || await caches.match('/index.html');
    if (cached) return cached;
    return new Response(OFFLINE_HTML, {
      headers: { 'Content-Type': 'text/html; charset=utf-8' },
      status: 200,
    });
  }
}

async function cacheFirst(request, cacheName, maxAge) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  if (cached) {
    const ts = cached.headers.get('sw-cached-at');
    if (ts && Date.now() - parseInt(ts) < maxAge) return cached;
  }
  try {
    const fresh = await fetch(request);
    if (fresh.ok) await stampAndPut(cache, request, fresh.clone());
    return fresh;
  } catch {
    return cached || new Response('Offline', { status: 503 });
  }
}

async function networkFirstWithCache(request, cacheName, maxAge) {
  const cache = await caches.open(cacheName);
  try {
    const fresh = await fetch(request);
    if (fresh.ok) await stampAndPut(cache, request, fresh.clone());
    return fresh;
  } catch {
    const cached = await cache.match(request);
    if (cached) {
      const ts = cached.headers.get('sw-cached-at');
      if (!ts || Date.now() - parseInt(ts) < maxAge * 6) return cached;
    }
    return new Response('Offline', { status: 503 });
  }
}

async function staleWhileRevalidate(request, cacheName) {
  const cache  = await caches.open(cacheName);
  const cached = await cache.match(request);
  const fetchP = fetch(request)
    .then(fresh => { if (fresh.ok) stampAndPut(cache, request, fresh.clone()); return fresh; })
    .catch(() => null);
  return cached || await fetchP || new Response('Offline', { status: 503 });
}

async function stampAndPut(cache, request, response) {
  const hdrs = new Headers(response.headers);
  hdrs.set('sw-cached-at', String(Date.now()));
  cache.put(request, new Response(await response.arrayBuffer(), {
    status: response.status, statusText: response.statusText, headers: hdrs,
  }));
}
