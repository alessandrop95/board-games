/* Service worker di Board Games: le pagine si caricano dalla rete (così gli aggiornamenti arrivano subito)
   e, se la rete manca, dalla copia salvata. La partita vera passa da WebSocket e non tocca questo file. */
var CACHE = 'board-games-v19';
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './src/shared/install.js', './src/shared/net.js', './src/shared/alerts.js', './src/shared/account.js',
  './polvere-e-piombo/', './polvere-e-piombo/manifest.webmanifest', './polvere-e-piombo/icon-192.png',
  './presagio/', './presagio/manifest.webmanifest', './presagio/icon-192.png',
  './gattomina/', './gattomina/manifest.webmanifest', './gattomina/icon-192.png',
  './campi-acciaio/', './campi-acciaio/manifest.webmanifest', './campi-acciaio/icon-192.png',
  './binari-italia/', './binari-italia/manifest.webmanifest', './binari-italia/icon-192.png',
  './catan/', './catan/manifest.webmanifest', './catan/icon-192.png',
  './machiavelli/', './machiavelli/manifest.webmanifest', './machiavelli/icon-192.png',
  './unlock/', './unlock/manifest.webmanifest', './unlock/icon-192.png'];

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
  if (/\.(mp3|ogg|oga|wav)$/.test(url.pathname)) return; // audio: lo gestisce il browser (richieste a pezzi)
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

// Tocco su una notifica «nuovo tavolo»: porta alla pagina del gioco con il codice, riusando una finestra già aperta se c'è.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url.split('?')[0] === url.split('?')[0] && 'focus' in c) return c.focus().then(function (w) { return w && w.navigate ? w.navigate(url) : null; }).catch(function () { return self.clients.openWindow(url); });
    }
    return self.clients.openWindow(url);
  }));
});

// Notifica dal server (nuovo tavolo, invito, amicizia). Se l'app è aperta e in primo piano la mostra la pagina stessa.
self.addEventListener('push', function (e) {
  var d = {};
  try { d = e.data ? e.data.json() : {}; } catch (x) { d = { title: 'Board Games', body: e.data ? e.data.text() : '' }; }
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    var front = list.filter(function (c) { return c.visibilityState === 'visible' && c.focused; });
    if (front.length) { front.forEach(function (c) { c.postMessage({ type: 'push', data: d }); }); return; }
    var scope = self.registration.scope;
    return self.registration.showNotification(d.title || 'Board Games', {
      body: d.body || '', tag: d.tag || undefined, renotify: !!d.tag, data: { url: d.url || scope },
      icon: scope + 'icon-192.png', badge: scope + 'badge-96.png', lang: 'it', vibrate: [80, 40, 80]
    });
  }));
});
// Il browser ha rinnovato (o perso) l'iscrizione: ne chiede subito una nuova con la stessa chiave del server;
// alla prossima apertura la pagina si accorge che è cambiata e la salva sul server (Alerts, funzione heal).
self.addEventListener('pushsubscriptionchange', function (e) {
  var o = e.oldSubscription && e.oldSubscription.options;
  if (!o || !o.applicationServerKey) return;
  e.waitUntil(self.registration.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: o.applicationServerKey }).catch(function () {}));
});
