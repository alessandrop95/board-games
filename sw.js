/* Service worker di Board Games: pagine e script si caricano dalla rete (così gli aggiornamenti arrivano subito,
   saltando anche la cache del browser) e, se la rete manca o è troppo lenta, dalla copia salvata. Le immagini e i
   font si prendono dalla copia salvata e si aggiornano dietro le quinte. version.json (la versione pubblicata di
   ogni gioco, vedi build.py) va sempre e solo in rete. La partita vera passa da WebSocket e non tocca questo file. */
var CACHE = 'board-games-v40';
var NET_WAIT = 3500;   // rete lenta: oltre questa attesa si usa la copia salvata (quella nuova si salva per la volta dopo)
var CORE = ['./', './index.html', './manifest.webmanifest', './icon-192.png', './src/shared/install.js', './src/shared/net.js', './src/shared/alerts.js', './src/shared/account.js',
  './polvere-e-piombo/', './polvere-e-piombo/manifest.webmanifest', './polvere-e-piombo/icon-192.png',
  './presagio/', './presagio/manifest.webmanifest', './presagio/icon-192.png',
  './gattomina/', './gattomina/manifest.webmanifest', './gattomina/icon-192.png',
  './campi-acciaio/', './campi-acciaio/manifest.webmanifest', './campi-acciaio/icon-192.png',
  './binari-italia/', './binari-italia/manifest.webmanifest', './binari-italia/icon-192.png',
  './catan/', './catan/manifest.webmanifest', './catan/icon-192.png',
  './machiavelli/', './machiavelli/manifest.webmanifest', './machiavelli/icon-192.png',
  './unlock/', './unlock/manifest.webmanifest', './unlock/icon-192.png',
  './skyjo/', './skyjo/manifest.webmanifest', './skyjo/icon-192.png',
  './flip7/', './flip7/manifest.webmanifest', './flip7/icon-192.png',
  './citadels/', './citadels/manifest.webmanifest', './citadels/icon-192.png',
  './cabo/', './cabo/manifest.webmanifest', './cabo/icon-192.png',
  './nograzie/', './nograzie/manifest.webmanifest', './nograzie/icon-192.png',
  './sushigo/', './sushigo/manifest.webmanifest', './sushigo/icon-192.png',
  './prendi6/', './prendi6/manifest.webmanifest', './prendi6/icon-192.png',
  './bugiardo/', './bugiardo/manifest.webmanifest', './bugiardo/icon-192.png',
  './miniera/', './miniera/manifest.webmanifest', './miniera/icon-192.png',
  './forziere/', './forziere/manifest.webmanifest', './forziere/icon-192.png',
  './conquista/', './conquista/manifest.webmanifest', './conquista/icon-192.png',
  './fune/', './fune/manifest.webmanifest', './fune/icon-192.png',
  './sintonia/', './sintonia/manifest.webmanifest', './sintonia/icon-192.png',
  './burraco/', './burraco/manifest.webmanifest', './burraco/icon-192.png',
  './scopa/', './scopa/manifest.webmanifest', './scopa/icon-192.png',
  './briscola/', './briscola/manifest.webmanifest', './briscola/icon-192.png',
  './disegna/', './disegna/manifest.webmanifest', './disegna/icon-192.png',
  './nomicose/', './nomicose/manifest.webmanifest', './nomicose/icon-192.png'];

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
  if (/\/version\.json$/.test(url.pathname)) return;     // controllo della versione: sempre dalla rete, mai una copia
  if (req.mode === 'navigate' && /(\/|\.html)$/.test(url.pathname)) { netFirst(e, url.origin + url.pathname, url, true); return; }   // pagina (ignorando ?t=CODICE)
  if (req.mode === 'navigate') {   // indirizzo senza «/» finale: il server risponde con un rinvio, lo segue il browser
    e.respondWith(fetch(req).catch(function () { return caches.match(url.origin + url.pathname + '/').then(function (r) { return r || Response.error(); }); }));
    return;
  }
  if (url.origin === location.origin && /\.(js|css|json|webmanifest)$/.test(url.pathname)) { netFirst(e, req, url, false); return; }
  // icone, immagini, font: copia salvata subito, aggiornata in background
  e.respondWith(caches.match(req).then(function (hit) {
    var net = fetch(req).then(function (res) {
      if (res && (res.ok || res.type === 'opaque')) { var copy = res.clone(); caches.open(CACHE).then(function (c) { c.put(req, copy); }); }
      return res;
    }).catch(function () { return hit; });
    return hit || net;
  }));
});

// Rete prima (senza la cache HTTP del browser, che GitHub Pages tiene 10 minuti: dopo un aggiornamento la versione
// nuova arriva subito); se la rete manca, o tarda più di NET_WAIT, la copia salvata. La risposta della rete, anche
// se arriva tardi, aggiorna la copia salvata.
function netFirst(e, key, url, page) {
  var req = e.request;
  var net = fetch(url.href, { cache: 'no-cache', credentials: 'same-origin' }).then(function (res) {
    if (res.redirected) return page ? fetch(req) : res;   // una pagina rinviata altrove la apre il browser
    if (res.ok) { var copy = res.clone(); caches.open(CACHE).then(function (c) { return c.put(key, copy); }).catch(function () {}); }
    return res;
  });
  function saved() { return caches.match(key).then(function (r) { return r || (page ? caches.match(url.origin + url.pathname + 'index.html') : null); }); }
  e.respondWith(new Promise(function (resolve) {
    var done = false;
    function give(r) { if (!done && r) { done = true; resolve(r); } }
    var slow = setTimeout(function () { saved().then(give); }, NET_WAIT);
    net.then(function (r) { clearTimeout(slow); give(r); }, function () {
      clearTimeout(slow);
      saved().then(function (r) { if (r) give(r); else if (!done) { done = true; resolve(Response.error()); } });
    });
  }));
  e.waitUntil(net.catch(function () {}));
}

// Tocco su una notifica «nuovo tavolo»: porta alla pagina del gioco con il codice, riusando una finestra già aperta se c'è.
self.addEventListener('notificationclick', function (e) {
  e.notification.close();
  var url = (e.notification.data && e.notification.data.url) || self.registration.scope;
  e.waitUntil(self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then(function (list) {
    for (var i = 0; i < list.length; i++) {
      var c = list[i];
      if (c.url === url && 'focus' in c) return c.focus();   // è già lì (per esempio «tocca a te»): basta riportarla davanti, senza ricaricare
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
