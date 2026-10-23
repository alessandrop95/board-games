/* Service worker di Board Games: le pagine si caricano dalla rete (così gli aggiornamenti arrivano subito)
   e, se la rete manca, dalla copia salvata. La partita vera passa da WebSocket e non tocca questo file. */
var CACHE = 'board-games-v4';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png',
  './polvere-e-piombo/', './polvere-e-piombo/manifest.webmanifest', './polvere-e-piombo/icon-192.png',
  './presagio/', './presagio/manifest.webmanifest', './presagio/icon-192.png'];

self.addEventListener('install', function (e) {
  e.waitUntil(caches.open(CACHE).then(function (c) { return c.addAll(CORE); }).catch(function () {}).then(function () { return self.skipWaiting(); }));
});
self.addEventListener('activate', function (e) {
  e.waitUntil(caches.keys().then(function (keys) {
    return Promise.all(keys.filter(function (k) { return k !== CACHE; }).map(function (k) { return caches.delete(k); }));
  }).then(function () { return self.clients.claim(); }));
});
self.addEventListener('fetch', function (e) {
  var req = e.request;
  if (req.method !== 'GET') return;
  var url = new URL(req.url);
  var fonts = url.host === 'fonts.googleapis.com' || url.host === 'fonts.gstatic.com';
  if (url.origin !== location.origin && !fonts) return;
  if (req.mode === 'navigate') {
    // pagina: rete prima, copia salvata se offline (ignorando ?t=CODICE)
    e.respondWith(fetch(req).then(function (res) {
      var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(url.origin + url.pathname, copy); });
      return res;
    }).catch(function () {
      return caches.match(url.origin + url.pathname).then(function (r) { return r || caches.match(url.origin + url.pathname + 'index.html'); });
    }));
    return;
  }
  // icone, manifest, font: copia salvata subito, aggiornata in background
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});
