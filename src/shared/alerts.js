/* ===== Avvisi: nuovi tavoli e inviti, in tutti i giochi =====
   Con l'app aperta: ascolta le liste dei tavoli di tutti i giochi e mostra un avviso nella pagina.
   Ad app chiusa: notifiche push vere (Web Push) mandate dal server Supabase (funzione «notify»);
   ci si iscrive da qui, scegliendo per quali giochi ricevere gli avvisi dei nuovi tavoli. */
var Alerts = (function () {
  var GAMES = [
    { p: 'polvere-piombo/v1/', path: 'polvere-e-piombo/', n: 'Bang!' },
    { p: 'presagio/v1/', path: 'presagio/', n: 'Wizard' },
    { p: 'gattomina/v1/', path: 'gattomina/', n: 'Exploding Kittens' },
    { p: 'campi-acciaio/v1/', path: 'campi-acciaio/', n: 'Scythe' },
    { p: 'binari-italia/v1/', path: 'binari-italia/', n: 'Binari d’Italia' }
  ];
  var KEY = 'pp-alerts', PREFS = 'pp-push-prefs', SUBK = 'pp-push', SEEN = 'pp-alerted', MINE = 'pp-mytables', TTL = 150000;
  var here = GAMES.filter(function (g) { return location.pathname.indexOf('/' + g.path) >= 0; })[0] || null;
  var ROOT = here ? '../' : './';
  var started = false, tables = {}, homeEl = null;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function obj(k) { try { return JSON.parse(get(k) || '{}') || {}; } catch (e) { return {}; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function enabled() { return get(KEY) !== 'off'; }
  function canSys() { return 'Notification' in window; }
  function sysOn() { return enabled() && canSys() && Notification.permission === 'granted'; }
  function gameOf(t) { for (var i = 0; i < GAMES.length; i++) if (t.indexOf(GAMES[i].p + 'lobby/') === 0) return GAMES[i]; return null; }
  function urlFor(g, code) { return new URL(ROOT + g.path + (code ? '?t=' + code : ''), location.href).href; }
  function nameOf(t) { var g = t.e.g; return g && g !== 'Board Games' ? g : t.g.n; }
  function alive(t) { var now = Date.now(); return (t.rx && now - t.rx < TTL) || now - t.t < TTL; }

  /* --- ascolto delle liste dei tavoli di tutti i giochi --- */
  function start() {
    if (started || typeof Net === 'undefined' || !Net._client) return;
    started = true;
    for (var i = 0; i < Net.brokers; i++) Net._client(i).then(attach, function () {});
    setInterval(paintHome, 10000);
  }
  function attach(c) {
    c.onMessage(function (topic, p, retained) {
      var g = gameOf(topic); if (!g) return;
      var id = topic.slice((g.p + 'lobby/').length), k = g.p + id;
      if (!p) { delete tables[k]; paintHome(); return; }
      var e; try { e = JSON.parse(p); } catch (x) { return; }
      if (!e || e.id !== id || typeof e.t !== 'number') return;
      var old = tables[k];
      if (old && old.e.t > e.t) return;
      tables[k] = { e: e, g: g, rx: retained ? (old ? old.rx : 0) : Date.now(), t: retained ? Math.min(e.t, Date.now()) : e.t };
      paintHome();
      if (!retained) maybeAlert(k, tables[k]);
    });
    c.subscribe('+/v1/lobby/+');
  }
  function list() {
    return Object.keys(tables).map(function (k) { return tables[k]; }).filter(function (t) { return alive(t) && (t.e.phase === 'lobby' || t.e.phase === 'play'); })
      .sort(function (a, b) { return (a.e.phase === 'lobby' ? 0 : 1) - (b.e.phase === 'lobby' ? 0 : 1) || b.e.t - a.e.t; });
  }

  /* --- avviso per un tavolo appena aperto --- */
  // Chi è già seduto a un tavolo (in attesa o in partita) non riceve avvisi: lo distrarrebbero e basta.
  function busy() { return typeof App !== 'undefined' && App && App.screen === 'table' && App.doc && Net.tableCode; }
  function isMine(g, code) { var m = obj(MINE); return !!m[g.p + code]; }
  function maybeAlert(k, t) {
    var e = t.e, g = t.g;
    if (!enabled() || e.phase !== 'lobby' || e.vis !== 'public' || !/^[A-Z]{4}$/.test(e.code || '')) return;
    if (prefs().games.indexOf(g.path.replace(/\/$/, '')) < 0) return;            // gioco escluso nelle preferenze
    if (!e.c || e.t - e.c > 90000 || e.t < e.c - 5000) return;       // solo tavoli aperti adesso (orari dello stesso telefono)
    if (isMine(g, e.code) || (here && here.p === g.p && Net.tableCode === e.code) || busy()) return;
    var seen = obj(SEEN), now = Date.now();
    if (seen[k]) return;                                               // già avvisato (anche da un'altra scheda)
    Object.keys(seen).forEach(function (x) { if (now - seen[x] > 3600e3) delete seen[x]; });
    seen[k] = now; set(SEEN, JSON.stringify(seen));
    var title = 'Nuovo tavolo: ' + nameOf(t), body = (e.host || 'Qualcuno') + ' ha aperto un tavolo ed è in attesa di giocatori.', url = urlFor(g, e.code);
    if (document.visibilityState === 'visible') banner(title, body, url);
    else if (sysOn() && !pushOn()) sysNotify(title, body + ' Tocca per sederti.', url, k); // con le notifiche push ci pensa il server
  }
  function sysNotify(title, body, url, tag) {
    var o = { body: body, tag: tag, data: { url: url }, icon: new URL(ROOT + 'icon-192.png', location.href).href };
    function plain() { try { var n = new Notification(title, o); n.onclick = function () { window.focus(); location.href = url; n.close(); }; } catch (e) {} }
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r && r.showNotification) return r.showNotification(title, o); plain(); }).catch(plain);
    } else plain();
  }

  /* --- notifiche push (ad app chiusa) --- */
  var ua = navigator.userAgent || '';
  var isIOS = /iPad|iPhone|iPod/.test(ua) || (navigator.platform === 'MacIntel' && navigator.maxTouchPoints > 1);
  function standalone() { return (window.matchMedia && window.matchMedia('(display-mode: standalone)').matches) || window.navigator.standalone === true; }
  function pushSupported() { return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window; }
  function allGames() { return GAMES.map(function (g) { return g.path.replace(/\/$/, ''); }); }
  function prefs() { var p = obj(PREFS); return { games: Array.isArray(p.games) ? p.games : allGames(), invites: p.invites !== false }; }
  function pushOn() { return !!get(SUBK) && pushSupported() && Notification.permission === 'granted'; }
  function keyBytes(b) { b = b.replace(/-/g, '+').replace(/_/g, '/'); while (b.length % 4) b += '='; var s = atob(b), o = new Uint8Array(s.length); for (var i = 0; i < s.length; i++) o[i] = s.charCodeAt(i); return o; }
  function registration() {
    return new Promise(function (res, rej) {
      if (!('serviceWorker' in navigator)) { rej('Notifiche non disponibili qui.'); return; }
      var t = setTimeout(function () { rej('Il gioco non è ancora pronto per le notifiche: ricarica la pagina e riprova.'); }, 8000);
      navigator.serviceWorker.ready.then(function (r) { clearTimeout(t); res(r); });
    });
  }
  function save(sub) {
    var j = sub.toJSON(), p = prefs();
    return Account.rpc('save_push', { p_token: Account.token, p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_games: p.games, p_invites: p.invites, p_ua: ua.slice(0, 200) })
      .then(function () { set(SUBK, j.endpoint); });
  }
  var pushMsg = null;
  function enablePush() {
    if (!window.Account || !Account.configured()) return Promise.resolve();
    if (!Account.user()) { Account.open('login', { why: 'Accedi per ricevere le notifiche: arrivano su tutti i dispositivi dove entri con il tuo account.' }); return Promise.resolve(); }
    if (!pushSupported()) { pushMsg = isIOS && !standalone() ? 'Su iPhone e iPad prima aggiungi Board Games alla schermata Home e aprilo da lì.' : 'Questo browser non supporta le notifiche.'; repaintAll(); return Promise.resolve(); }
    pushMsg = null;
    return Promise.resolve(Notification.requestPermission()).then(function (perm) {
      if (perm !== 'granted') { pushMsg = perm === 'denied' ? 'Le notifiche sono bloccate: riattivale nelle impostazioni del browser (o dell’app) per questo sito.' : 'Permesso non concesso.'; return; }
      return registration().then(function (r) {
        return r.pushManager.getSubscription().then(function (sub) {
          var key = Account.config && Account.config.vapid;
          if (!key) throw 'Notifiche non ancora configurate sul server.';
          var same = sub && sub.options && sub.options.applicationServerKey && btoa(String.fromCharCode.apply(null, new Uint8Array(sub.options.applicationServerKey))).replace(/\+/g, '-').replace(/\//g, '_').replace(/=+$/, '') === key;
          if (sub && !same) return sub.unsubscribe().then(function () { return null; });
          return sub;
        }).then(function (sub) { return sub || r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(Account.config.vapid) }); });
      }).then(save).then(function () { pushMsg = null; Account.toast('Notifiche attive su questo dispositivo.'); });
    }).catch(function (e) { pushMsg = String(e && e.message || e); }).then(repaintAll);
  }
  function disablePush() {
    return registration().then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) {
      if (!sub) return;
      return Account.rpc('delete_push', { p_token: Account.token, p_endpoint: sub.endpoint }).catch(function () {}).then(function () { return sub.unsubscribe(); });
    }).catch(function () {}).then(function () { set(SUBK, null); repaintAll(); });
  }
  // dopo l'accesso: l'iscrizione già presente su questo dispositivo passa al nuovo account
  function resync() {
    if (!pushSupported() || Notification.permission !== 'granted' || !get(SUBK)) return Promise.resolve();
    return registration().then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { if (sub) return save(sub); });
  }
  // prima di uscire dall'account: questo dispositivo non riceve più le notifiche di quell'account
  function forget() {
    var ep = get(SUBK); set(SUBK, null);
    if (!ep || !window.Account || !Account.token) return Promise.resolve();
    return Account.rpc('delete_push', { p_token: Account.token, p_endpoint: ep }).catch(function () {});
  }
  function setPrefs(p) { set(PREFS, JSON.stringify(p)); if (pushOn()) registration().then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { if (sub) return save(sub); }).catch(function (e) { pushMsg = String(e); repaintAll(); }); }
  function settingsHTML() {
    var p = prefs(), on = pushOn(), h = '';
    if (!pushSupported()) {
      h += '<p class="pa-note">' + (isIOS && !standalone() ? 'Su iPhone e iPad le notifiche arrivano quando il gioco è sulla schermata Home (iOS 16.4 o successivo): tocca Condividi → «Aggiungi alla schermata Home», poi apri Board Games da lì e torna qui.' : 'Questo browser non supporta le notifiche.') + '</p>';
    } else if (Notification.permission === 'denied') {
      h += '<p class="pa-err">Le notifiche per questo sito sono bloccate. Riattivale dalle impostazioni del browser (lucchetto accanto all’indirizzo → Notifiche) e poi torna qui.</p>';
    } else {
      h += '<label class="pa-check"><input type="checkbox" data-pp="master"' + (on ? ' checked' : '') + '> <b>Notifiche su questo dispositivo</b></label>';
    }
    h += '<p class="pa-note">Avvisami quando qualcuno apre un tavolo di:</p><div class="pa-games">' + GAMES.map(function (g) { var id = g.path.replace(/\/$/, ''); return '<label class="pa-check"><input type="checkbox" data-pp="game" value="' + id + '"' + (p.games.indexOf(id) >= 0 ? ' checked' : '') + '> ' + esc(g.n) + '</label>'; }).join('') + '</div>' +
      '<label class="pa-check"><input type="checkbox" data-pp="inv"' + (p.invites ? ' checked' : '') + '> Inviti e richieste di amicizia</label>' +
      (pushMsg ? '<p class="pa-err">' + esc(pushMsg) + '</p>' : '') +
      '<p class="pa-note">Con l’app aperta gli avvisi compaiono in alto nella pagina; ad app chiusa arrivano come notifiche del telefono.</p>';
    return h;
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.getAttribute || !t.getAttribute('data-pp')) return;
    var k = t.getAttribute('data-pp'), p = prefs();
    if (k === 'master') { (t.checked ? enablePush() : disablePush()); return; }
    if (k === 'game') { p.games = Array.prototype.map.call(document.querySelectorAll('[data-pp="game"]:checked'), function (x) { return x.value; }); setPrefs(p); }
    if (k === 'inv') { p.invites = t.checked; setPrefs(p); }
  });
  function repaintAll() { repaint(); if (window.Account && Account.render) Account.render(); }
  // notifica arrivata mentre l'app è aperta: il service worker la passa alla pagina
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.type !== 'push' || !d.data) return;
    banner(d.data.title || 'Board Games', d.data.body || '', d.data.url || ROOT, d.data.kind === 'friend' ? 'Apri' : 'Siediti');
  });

  /* --- grafica: avviso nella pagina, interruttore, lista in home --- */
  var DIE = '<svg viewBox="0 0 24 24" width="26" height="26" aria-hidden="true"><rect x="3" y="3" width="18" height="18" rx="4" fill="#f2c14e"/><g fill="#2a1d10"><circle cx="8" cy="8" r="1.7"/><circle cx="16" cy="8" r="1.7"/><circle cx="12" cy="12" r="1.7"/><circle cx="8" cy="16" r="1.7"/><circle cx="16" cy="16" r="1.7"/></g></svg>';
  var BELL = '<svg viewBox="0 0 24 24" width="18" height="18" aria-hidden="true" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/></svg>';
  function css() {
    if (document.getElementById('ppa-css')) return;
    var s = document.createElement('style'); s.id = 'ppa-css';
    s.textContent =
      '.ppa-banner{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translate(-50%,-140%);z-index:9998;width:min(440px,calc(100vw - 20px));display:flex;gap:10px;align-items:center;padding:10px 10px 10px 12px;border-radius:14px;background:#221a12;color:#f6ead2;border:1px solid rgba(242,193,78,.55);box-shadow:0 12px 34px rgba(0,0,0,.5);font:15px/1.35 system-ui,-apple-system,sans-serif;transition:transform .35s cubic-bezier(.2,.9,.3,1.2)}' +
      '.ppa-banner.in{transform:translate(-50%,0)}.ppa-banner .ppa-tx{flex:1;min-width:0}.ppa-banner .ppa-tx span{opacity:.8;font-size:13.5px}' +
      '.ppa-go{flex:none;text-decoration:none;font-weight:700;background:#f2c14e;color:#1b130b;border-radius:10px;padding:9px 13px}.ppa-x{flex:none;appearance:none;border:0;background:none;color:inherit;opacity:.65;font-size:22px;line-height:1;padding:4px 6px;cursor:pointer}' +
      '.ppa-ctl{display:flex;flex-wrap:wrap;gap:8px 12px;align-items:center;padding:10px 12px;border:1px dashed rgba(255,255,255,.2);border-radius:12px;font-size:14.5px;line-height:1.35}' +
      '.ppa-ctl .ppa-st{flex:1;min-width:190px;display:flex;gap:8px;align-items:center}.ppa-ctl button{appearance:none;font:inherit;font-size:14px;cursor:pointer;border-radius:999px;padding:7px 13px;border:1px solid currentColor;background:transparent;color:inherit}' +
      '.ppa-ctl button.on{background:#f2c14e;border-color:#f2c14e;color:#1b130b;font-weight:700}.ppa-ctl .ppa-lnk{border:0;padding:7px 2px;text-decoration:underline;opacity:.85}' +
      '.ppa-sheet{position:fixed;inset:0;z-index:9999;display:grid;place-items:center;padding:16px;background:rgba(6,6,10,.78)}.ppa-card{max-width:420px;width:100%;max-height:calc(100vh - 32px);overflow:auto;background:#1f1912;color:#f3e8d2;border:1px solid rgba(242,193,78,.4);border-radius:16px;padding:20px;font:15.5px/1.5 system-ui,-apple-system,sans-serif;display:grid;gap:12px}' +
      '.ppa-card h3{margin:0;font-size:19px}.ppa-card ol{margin:0;padding-left:20px;display:grid;gap:8px}.ppa-card code{background:rgba(255,255,255,.1);padding:2px 6px;border-radius:6px;word-break:break-all}.ppa-card a{color:#f2c14e}' +
      '.ppa-card .row{display:flex;gap:8px;flex-wrap:wrap}.ppa-card button{appearance:none;font:inherit;font-weight:700;cursor:pointer;border-radius:10px;padding:10px 14px;border:1px solid #f2c14e;background:transparent;color:inherit}.ppa-card button.main{background:#f2c14e;color:#1b130b}' +
      '.ppa-home{display:grid;gap:8px}.ppa-row{display:flex;gap:12px;align-items:center;padding:10px 12px;border:1px solid rgba(241,228,198,.14);border-radius:12px}.ppa-row .g{flex:1;min-width:0}.ppa-row small{display:block;opacity:.75}' +
      '.ppa-row a{flex:none;text-decoration:none;border-radius:999px;padding:8px 14px;border:1px solid #d9a441;color:inherit}.ppa-row a.sit{background:#d9a441;color:#1d140e;font-weight:700}';
    document.head.appendChild(s);
  }
  function banner(title, body, url, go) {
    css();
    var old = document.querySelector('.ppa-banner'); if (old) old.remove();
    var b = document.createElement('div'); b.className = 'ppa-banner'; b.setAttribute('role', 'status');
    b.innerHTML = DIE + '<div class="ppa-tx"><b>' + esc(title) + '</b><br><span>' + esc(body) + '</span></div><a class="ppa-go" href="' + esc(url) + '">' + esc(go || 'Siediti') + '</a><button class="ppa-x" type="button" aria-label="Chiudi l’avviso">×</button>';
    b.querySelector('.ppa-x').onclick = function () { b.remove(); };
    document.body.appendChild(b);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('in'); }); });
    setTimeout(function () { b.classList.remove('in'); setTimeout(function () { b.remove(); }, 400); }, 14000);
  }
  function controlHTML() {
    css();
    if (window.Account && Account.configured()) {
      var on = pushOn(), st = on ? 'Notifiche attive: nuovi tavoli e inviti arrivano anche ad app chiusa' : 'Ricevi una notifica quando qualcuno apre un tavolo o ti invita, anche ad app chiusa';
      var btn = on ? '<button type="button" class="on" data-pa="open" data-v="account">Impostazioni</button>' : '<button type="button" data-alerts="push">Attiva le notifiche</button>';
      return '<div class="ppa-ctl"><span class="ppa-st">' + BELL + '<span>' + st + '</span></span>' + btn + '</div>';
    }
    var en = enabled(), perm = canSys() ? Notification.permission : 'none', st2, btns;
    if (!en) { st2 = 'Avvisi dei nuovi tavoli <b>spenti</b>'; btns = '<button type="button" data-alerts="on">Accendi</button>'; }
    else if (perm === 'granted') { st2 = 'Ti avviso quando qualcuno apre un tavolo, anche con l’app in sottofondo'; btns = '<button type="button" class="on" data-alerts="off" aria-pressed="true">Avvisi accesi</button>'; }
    else {
      st2 = 'Ti avviso quando qualcuno apre un tavolo, mentre l’app è aperta';
      btns = (perm === 'default' ? '<button type="button" data-alerts="perm">Anche come notifica</button>' : '') + '<button type="button" class="on" data-alerts="off" aria-pressed="true">Avvisi accesi</button>';
    }
    return '<div class="ppa-ctl"><span class="ppa-st">' + BELL + '<span>' + st2 + '</span></span>' + btns + '</div>';
  }
  function repaint() { Array.prototype.forEach.call(document.querySelectorAll('.ppa-ctl'), function (el) { el.outerHTML = controlHTML(); }); }
  function askPerm() {
    if (!canSys() || Notification.permission !== 'default') { repaint(); return; }
    try { var r = Notification.requestPermission(function () { repaint(); }); if (r && r.then) r.then(repaint, repaint); } catch (e) { repaint(); }
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-alerts]'); if (!b) return;
    var k = b.getAttribute('data-alerts');
    if (k === 'on') { set(KEY, 'on'); start(); askPerm(); repaint(); }
    else if (k === 'off') { set(KEY, 'off'); repaint(); }
    else if (k === 'perm') askPerm();
    else if (k === 'push') enablePush();
  });

  /* --- home: tutti i tavoli aperti adesso, di tutti i giochi --- */
  function mountHome(el) { homeEl = el; css(); start(); paintHome(); setTimeout(function () { if (homeEl && !list().length) paintHome(true); }, 6000); }
  function paintHome(waited) {
    if (!homeEl) return;
    var l = list();
    if (!l.length) { homeEl.innerHTML = '<p>' + (waited || started && Object.keys(tables).length ? 'Nessun tavolo aperto in questo momento: aprine uno tu da un gioco qui sotto, comparirà qui per tutti.' : 'Cerco i tavoli aperti…') + '</p>'; return; }
    homeEl.innerHTML = '<div class="ppa-home">' + l.slice(0, 8).map(function (t) {
      var e = t.e, full = e.max && e.n >= e.max, pub = e.vis === 'public' && /^[A-Z]{4}$/.test(e.code || '');
      var state = e.phase === 'play' ? 'in partita' : full ? 'completo' : 'in attesa di giocatori';
      var btn = !pub ? '<a href="' + esc(urlFor(t.g)) + '">Ho il codice</a>' : e.phase === 'play' || full ? '<a href="' + esc(urlFor(t.g, e.code)) + '">Guarda</a>' : '<a class="sit" href="' + esc(urlFor(t.g, e.code)) + '">Siediti</a>';
      return '<div class="ppa-row"><div class="g"><b>' + esc(nameOf(t)) + '</b> · tavolo di ' + esc(String(e.host || '…').slice(0, 18)) + '<small>' + (+e.n || 0) + (e.max ? '/' + e.max : '') + ' giocatori · ' + state + (pub ? '' : ' · solo su invito') + '</small></div>' + btn + '</div>';
    }).join('') + '</div>';
  }

  /* --- chi apre un tavolo pubblico lo fa annunciare dal server a chi ha le notifiche attive --- */
  function created(prefix, code, nick, vis) {
    var m = obj(MINE), now = Date.now();
    Object.keys(m).forEach(function (x) { if (now - m[x] > 24 * 3600e3) delete m[x]; });
    m[prefix + code] = now; set(MINE, JSON.stringify(m));
    if (vis === 'invite' || (/[?&]broker=/.test(location.search) && !/[?&]annunci=1/.test(location.search))) return; // niente annunci dai tavoli su invito né dalle prove locali
    var g = GAMES.filter(function (x) { return x.p === prefix; })[0]; if (!g) return;
    if (window.Account && Account.user()) Account.notify({ kind: 'table', game: g.path.replace(/\/$/, ''), code: code }).catch(function (e) { console.warn('annuncio', e); });
  }

  if (enabled()) setTimeout(start, 1200);
  return { start: start, controlHTML: controlHTML, mountHome: mountHome, created: created, list: list, enabled: enabled, _tables: tables,
    GAMES: GAMES, ROOT: ROOT, here: here, settingsHTML: settingsHTML, enablePush: enablePush, disablePush: disablePush, resync: resync, forget: forget, pushOn: pushOn, banner: banner };
})();
