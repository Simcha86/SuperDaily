const CACHE = 'superdaily-v9';
const SHELL = ['./', 'index.html', 'app.js', 'app.css', 'theme.css', 'nocturne.css', 'firebase-config.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png', 'icons/icon-maskable.png'];

self.addEventListener('install', e => {
  e.waitUntil(caches.open(CACHE).then(c => c.addAll(SHELL)).then(() => self.skipWaiting()));
});
self.addEventListener('activate', e => {
  e.waitUntil(caches.keys().then(keys => Promise.all(keys.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim()));
});
// Eigene Dateien: erst Netz, dann Cache (so kommen Updates sofort an). Fremde Domains (Firebase, Fonts) nicht anfassen.
// Gespeichert werden nur gute Antworten. Antwortet der Server mit einem Fehler (z. B. bei einer GitHub-Störung),
// zeigt die App ihre gespeicherte Kopie statt der Fehlerseite.
const fromCache = req => caches.match(req).then(r => r || (req.mode === 'navigate' ? caches.match('index.html') : undefined));
self.addEventListener('fetch', e => {
  const url = new URL(e.request.url);
  if (e.request.method !== 'GET' || url.origin !== location.origin) return;
  e.respondWith(
    fetch(e.request).then(res => {
      if (!res.ok) return fromCache(e.request).then(r => r || res);
      const copy = res.clone();
      caches.open(CACHE).then(c => c.put(e.request, copy));
      return res;
    }, () => fromCache(e.request).then(r => r || Response.error()))
  );
});
