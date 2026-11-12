/* AQVILA — service worker: todo el juego queda en caché para jugar sin conexión */
const CACHE = 'aqvila-v43';
const FILES = ['./', 'index.html', 'css/style.css', 'assets/fuentes/cinzel-400.woff2', 'assets/fuentes/cinzel-700.woff2', 'js/data.js', 'js/codice.js', 'js/registro.js', 'js/battle.js', 'js/game.js', 'js/ui.js', 'js/gfx/models.js', 'js/gfx/battle3d.js', 'js/gfx/map3d.js', 'assets/mapa/costa.js', 'assets/mapa/alturas.js', 'js/gfx/units.js', 'js/gfx/statics.js', 'js/gfx/city3d.js', 'js/gfx/ground.js', 'js/gfx/mundo.js', 'js/gfx/fluidez.js', 'assets/static/static.json', 'assets/units/units.json', 'js/vendor/three.module.min.js', 'manifest.webmanifest', 'icons/icon.svg', 'icons/icon-192.png', 'icons/icon-512.png'];
self.addEventListener('install', e => { e.waitUntil(caches.open(CACHE).then(c => c.addAll(FILES)).then(() => self.skipWaiting())); });
self.addEventListener('activate', e => { e.waitUntil(caches.keys().then(ks => Promise.all(ks.filter(k => k !== CACHE).map(k => caches.delete(k)))).then(() => self.clients.claim())); });
self.addEventListener('fetch', e => {
  if (e.request.method !== 'GET') return;
  e.respondWith(caches.match(e.request, { ignoreSearch: true }).then(hit => hit || fetch(e.request).then(res => {
    if (res.ok && new URL(e.request.url).origin === location.origin) { const copy = res.clone(); caches.open(CACHE).then(c => c.put(e.request, copy)); }
    return res;
  })));
});
