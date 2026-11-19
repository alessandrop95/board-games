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
    { p: 'binari-italia/v1/', path: 'binari-italia/', n: 'Ticket to Ride Italy' },
    { p: 'catan/v1/', path: 'catan/', n: 'Catan' },
    { p: 'machiavelli/v1/', path: 'machiavelli/', n: 'Machiavelli' },
    { p: 'unlock/v1/', path: 'unlock/', n: 'Unlock!' },
    { p: 'skyjo/v1/', path: 'skyjo/', n: 'Skyjo' },
    { p: 'cabo/v1/', path: 'cabo/', n: 'Cabo' },
    { p: 'nograzie/v1/', path: 'nograzie/', n: 'No Grazie!' },
    { p: 'sushigo/v1/', path: 'sushigo/', n: 'Sushi Go!' },
    { p: 'prendi6/v1/', path: 'prendi6/', n: 'Prendi 6!' },
    { p: 'bugiardo/v1/', path: 'bugiardo/', n: 'Dadi del bugiardo' },
    { p: 'miniera/v1/', path: 'miniera/', n: 'La Miniera' },
    { p: 'forziere/v1/', path: 'forziere/', n: 'Il Forziere Maledetto' },
    { p: 'conquista/v1/', path: 'conquista/', n: 'Conquista l’Italia' },
    { p: 'fune/v1/', path: 'fune/', n: 'Tiro alla fune' },
    { p: 'sintonia/v1/', path: 'sintonia/', n: 'Sintonia' },
    { p: 'burraco/v1/', path: 'burraco/', n: 'Burraco' },
    { p: 'scopa/v1/', path: 'scopa/', n: 'Scopa' },
    { p: 'briscola/v1/', path: 'briscola/', n: 'Briscola' },
    { p: 'disegna/v1/', path: 'disegna/', n: 'Disegna e indovina' },
    { p: 'nomicose/v1/', path: 'nomicose/', n: 'Nomi, cose, città' },
    { p: 'flip7/v1/', path: 'flip7/', n: 'Flip 7' },
    { p: 'citadels/v1/', path: 'citadels/', n: 'Citadels' }
  ];
  var KEY = 'pp-alerts', PREFS = 'pp-push-prefs', SUBK = 'pp-push', SEEN = 'pp-alerted', MINE = 'pp-mytables', SYNC = 'pp-push-sync', TTL = 150000;
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
  var FILT = '+/v1/lobby/+', att = [], sweepT = null;
  function start() {
    if (started || typeof Net === 'undefined' || !Net._client) return;
    started = true;
    for (var i = 0; i < Net.brokers; i++) (function (i) { Net._client(i).then(function (c) { attach(i, c); }, function () {}); })(i);
    setInterval(refresh, 5000);
    document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') setTimeout(refresh, 400); });
    window.addEventListener('focus', function () { setTimeout(refresh, 400); });
  }
  // ogni 5 secondi (e al ritorno in primo piano) la lista si richiede ai server: tavoli nuovi subito, quelli chiusi spariscono
  function refresh() {
    var t0 = Date.now(), all = true;
    for (var i = 0; i < Net.brokers; i++) (function (i) {
      if (!att[i]) { all = false; Net._client(i).then(function (c) { attach(i, c); paintHome(); }, function () {}); return; }
      if (!att[i].resub(FILT)) all = false;
    })(i);
    paintHome();
    clearTimeout(sweepT);
    if (all) sweepT = setTimeout(function () {
      if (att.length < Net.brokers || !att.every(function (c) { return c && c.connected; })) return;
      var gone = false; Object.keys(tables).forEach(function (k) { if ((tables[k].seen || 0) < t0) { delete tables[k]; gone = true; } });
      if (gone) paintHome();
    }, 3000);
  }
  function attach(i, c) {
    if (att[i]) return; att[i] = c;
    c.onMessage(function (topic, p, retained) {
      var g = gameOf(topic); if (!g) return;
      var id = topic.slice((g.p + 'lobby/').length), k = g.p + id;
      if (!p) { delete tables[k]; paintHome(); return; }
      var e; try { e = JSON.parse(p); } catch (x) { return; }
      if (!e || e.id !== id || typeof e.t !== 'number') return;
      var old = tables[k];
      if (old && old.e.t > e.t) { old.seen = Date.now(); return; }
      tables[k] = { e: e, g: g, rx: retained ? (old ? old.rx : 0) : Date.now(), t: retained ? Math.min(e.t, Date.now()) : e.t, seen: Date.now() };
      paintHome();
      if (!retained) maybeAlert(k, tables[k]);
    });
    c.subscribe(FILT);
  }
  function list() {
    return Object.keys(tables).map(function (k) { return tables[k]; }).filter(function (t) { return alive(t) && (t.e.phase === 'lobby' || t.e.phase === 'play'); })
      .sort(function (a, b) { return (a.e.phase === 'lobby' ? 0 : 1) - (b.e.phase === 'lobby' ? 0 : 1) || b.e.t - a.e.t; });
  }

  /* --- avviso per un tavolo appena aperto --- */
  // Chi è già seduto a un tavolo (in attesa o in partita) non riceve avvisi: lo distrarrebbero e basta.
  function busy() { return typeof App !== 'undefined' && App && App.screen === 'table' && App.doc && Net.tableCode; }
  function isMine(g, code) { var m = obj(MINE); return !!m[g.p + code]; }
  // Tavolo «solo amici»: il codice non è nella lista pubblica, lo sa il server (dove si trova l'amico adesso).
  function friendCode(e, g) {
    if (e.vis !== 'friends' || !window.Account || !Account.friend) return null;
    var f = Account.friend(e.u); if (!f) return null;
    if (f.table && f.game === g.path.replace(/\/$/, '')) return f.table;
    if (Account.refreshFriendsSoon) Account.refreshFriendsSoon();
    return null;
  }
  function visible(t) { return t.e.vis !== 'friends' || !!(window.Account && Account.friend && Account.friend(t.e.u)); }
  function codeOf(t) { return t.e.vis === 'friends' ? friendCode(t.e, t.g) : t.e.vis === 'public' ? t.e.code : null; }
  function maybeAlert(k, t) {
    var e = t.e, g = t.g, fc = e.vis === 'friends' ? friendCode(e, g) : null;
    if (fc) e = Object.assign({}, e, { code: fc });
    if (!enabled() || e.phase !== 'lobby' || (e.vis !== 'public' && !fc) || !/^[A-Z]{4}$/.test(e.code || '')) return;
    if (prefs().games.indexOf(g.path.replace(/\/$/, '')) < 0) return;            // gioco escluso nelle preferenze
    if (!e.c || e.t - e.c > 90000 || e.t < e.c - 5000) return;       // solo tavoli aperti adesso (orari dello stesso telefono)
    if (isMine(g, e.code) || (here && here.p === g.p && Net.tableCode === e.code) || busy()) return;
    var seen = obj(SEEN), now = Date.now();
    if (seen[k]) return;                                               // già avvisato (anche da un'altra scheda)
    Object.keys(seen).forEach(function (x) { if (now - seen[x] > 3600e3) delete seen[x]; });
    seen[k] = now; set(SEEN, JSON.stringify(seen));
    var title = (fc ? 'Tavolo tra amici: ' : 'Nuovo tavolo: ') + nameOf(t), body = (e.host || 'Qualcuno') + (fc ? ' ha aperto un tavolo per i suoi amici.' : ' ha aperto un tavolo ed è in attesa di giocatori.'), url = urlFor(g, e.code);
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
  function prefs() { var p = obj(PREFS); return { games: Array.isArray(p.games) ? p.games : allGames(), invites: p.invites !== false, turns: p.turns !== false }; }
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
    var args = { p_token: Account.token, p_endpoint: j.endpoint, p_p256dh: j.keys.p256dh, p_auth: j.keys.auth, p_games: p.games, p_invites: p.invites, p_ua: ua.slice(0, 200), p_turns: p.turns };
    return Account.rpc('save_push', args)
      .catch(function (e) {   // server non ancora aggiornato (non conosce «tocca a te»): si salva come prima
        if (!/save_push|schema cache|function/i.test(String(e))) throw e;
        delete args.p_turns; return Account.rpc('save_push', args);
      })
      .then(function () { set(SUBK, j.endpoint); set(SYNC, String(Date.now())); });
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
  // A ogni apertura: se il browser ha rinnovato l'iscrizione (o il server l'ha scartata), la si salva di nuovo.
  // Una volta al giorno la si ripete comunque, così il server la ritrova anche se nel frattempo l'aveva cancellata.
  function heal() {
    if (!window.Account || !Account.user() || !pushSupported() || Notification.permission !== 'granted' || !get(SUBK)) return Promise.resolve();
    return registration().then(function (r) {
      return r.pushManager.getSubscription().then(function (sub) {
        var key = Account.config && Account.config.vapid;
        if (!sub && key) return r.pushManager.subscribe({ userVisibleOnly: true, applicationServerKey: keyBytes(key) });
        return sub;
      });
    }).then(function (sub) {
      if (!sub) return;
      var old = get(SUBK), stale = Date.now() - (+get(SYNC) || 0) > 864e5;
      if (sub.endpoint === old && !stale) return;
      return save(sub).then(function () {
        set(SYNC, String(Date.now()));
        if (old && old !== sub.endpoint) return Account.rpc('delete_push', { p_token: Account.token, p_endpoint: old }).catch(function () {});
      });
    }).catch(function () {});
  }
  setTimeout(function () { if (window.Account && Account.ready) Account.ready.then(heal); }, 1500);
  function setPrefs(p) { set(PREFS, JSON.stringify(p)); if (pushOn()) registration().then(function (r) { return r.pushManager.getSubscription(); }).then(function (sub) { if (sub) return save(sub); }).catch(function (e) { pushMsg = String(e); repaintAll(); }); }
  /* --- impostazioni delle notifiche (pannello Impostazioni) --- */
  function gameIds(p) { var ids = allGames(); return p.games.filter(function (x) { return ids.indexOf(x) >= 0; }); }
  function gamesSummary() { var n = gameIds(prefs()).length; return n >= GAMES.length ? 'Tutti i giochi' : n ? n + (n === 1 ? ' gioco' : ' giochi') : 'Nessuno'; }
  function srvMode() { return !!(window.Account && Account.configured()); }
  function notifyHTML() {
    Kit.css();
    var p = prefs(), rows = [], note = '', perm = canSys() ? Notification.permission : 'none';
    if (srvMode()) {
      var on = pushOn(), u = Account.user(), sup = pushSupported();
      rows.push(Kit.row({ ic: 'bell', icCls: on ? 'a' : '', title: 'Notifiche su questo dispositivo',
        sub: !sup ? (isIOS && !standalone() ? 'Su iPhone e iPad: aggiungi Board Games alla schermata Home e aprilo da lì' : 'Questo browser non le supporta') : perm === 'denied' ? 'Bloccate nelle impostazioni del browser' : on ? 'Attive: arrivano anche ad app chiusa' : u ? 'Spente' : 'Accedi per attivarle',
        right: Kit.sw('data-pp="master" aria-label="Notifiche su questo dispositivo"', on, !sup || perm === 'denied'), tag: 'label' }));
      rows.push(Kit.row({ ic: 'grid', title: 'Nuovi tavoli', sub: 'Quando qualcuno apre un tavolo', right: '<span class="k-rv">' + gamesSummary() + '</span>', attrs: 'data-pa="go" data-v="games"', chev: true }));
      rows.push(Kit.row({ ic: 'mail', title: 'Inviti e amicizie', sub: 'Quando un amico ti invita o ti aggiunge', right: Kit.sw('data-pp="inv" aria-label="Inviti e amicizie"', p.invites), tag: 'label' }));
      rows.push(Kit.row({ ic: 'clock', title: 'Tocca a te', sub: 'Quando arriva il tuo turno e non hai il gioco davanti', right: Kit.sw('data-pp="turns" aria-label="Tocca a te"', p.turns), tag: 'label' }));
      if (perm === 'denied') note = 'Per riattivarle: tocca il lucchetto accanto all’indirizzo (o le impostazioni dell’app) → Notifiche → Consenti, poi torna qui.';
    } else {
      rows.push(Kit.row({ ic: 'bell', icCls: enabled() ? 'a' : '', title: 'Avvisi dei nuovi tavoli', sub: enabled() ? 'Accesi' : 'Spenti', right: Kit.sw('data-pp="inapp" aria-label="Avvisi dei nuovi tavoli"', enabled()), tag: 'label' }));
      rows.push(Kit.row({ ic: 'phone', title: 'Anche come notifica del telefono', sub: perm === 'granted' ? 'Consentite: arrivano anche con l’app in sottofondo' : perm === 'denied' ? 'Bloccate nelle impostazioni del browser' : perm === 'none' ? 'Non disponibili in questo browser' : 'Serve il tuo permesso',
        right: perm === 'default' ? '<button type="button" class="k-btn sm" data-alerts="perm">Consenti</button>' : perm === 'granted' ? '<span class="k-pill ok">' + Kit.icon('check', 14) + 'Attive</span>' : '' }));
      rows.push(Kit.row({ ic: 'grid', title: 'Per quali giochi', right: '<span class="k-rv">' + gamesSummary() + '</span>', attrs: 'data-pa="go" data-v="games"', chev: true }));
    }
    if (srvMode()) rows.push(Kit.row({ ic: 'phone', title: 'Avvisi dentro l’app', sub: 'Un banner in alto mentre usi l’app', right: Kit.sw('data-pp="inapp" aria-label="Avvisi dentro l’app"', enabled()), tag: 'label' }));
    rows.push(Kit.row({ ic: 'play', title: 'Prova una notifica', sub: 'Controlla che questo dispositivo la mostri', attrs: 'data-alerts="test"' }));
    return (pushMsg ? '<p class="k-msg err" role="status">' + esc(pushMsg) + '</p>' : '') + Kit.group('Notifiche', rows, note);
  }
  function gamesHTML() {
    var p = prefs(), ids = gameIds(p);
    return '<p class="k-note">Scegli per quali giochi ricevere un avviso quando qualcuno apre un tavolo. Inviti e richieste degli amici arrivano sempre, se sono attivi.</p>' +
      '<div class="k-inline"><button type="button" class="k-btn sm sec" data-alerts="all">Tutti</button><button type="button" class="k-btn sm sec" data-alerts="none">Nessuno</button></div>' +
      '<div class="k-list">' + GAMES.map(function (g) {
        var id = g.path.replace(/\/$/, '');
        return '<label class="k-row"><img src="' + esc(ROOT + g.path + 'icon-192.png') + '" alt="" width="32" height="32" style="border-radius:9px;flex:none"><span class="k-rt"><b>' + esc(g.n) + '</b></span>' + Kit.sw('data-pp="game" value="' + id + '" aria-label="' + esc(g.n) + '"', ids.indexOf(id) >= 0) + '</label>';
      }).join('') + '</div>';
  }
  function testNotify() {
    var title = 'Board Games', body = 'Le notifiche funzionano su questo dispositivo.';
    if (canSys() && Notification.permission === 'granted') { sysNotify(title, body, new URL(ROOT, location.href).href, 'pp-test'); Kit.toast('Notifica di prova inviata.'); }
    else banner(title, body + ' Per riceverle anche ad app chiusa, attiva le notifiche.', ROOT, 'OK');
  }
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.getAttribute || !t.getAttribute('data-pp')) return;
    var k = t.getAttribute('data-pp'), p = prefs();
    if (k === 'master') { (t.checked ? enablePush() : disablePush()); return; }
    if (k === 'game') { p.games = Array.prototype.map.call(document.querySelectorAll('[data-pp="game"]:checked'), function (x) { return x.value; }); setPrefs(p); repaintAll(); }
    if (k === 'inv') { p.invites = t.checked; setPrefs(p); }
    if (k === 'turns') { p.turns = t.checked; setPrefs(p); }
    if (k === 'inapp') { set(KEY, t.checked ? 'on' : 'off'); if (t.checked) start(); repaintAll(); }
  });
  function repaintAll() { repaint(); if (window.Account && Account.render) Account.render(); }
  // notifica arrivata mentre l'app è aperta: il service worker la passa alla pagina
  if (navigator.serviceWorker) navigator.serviceWorker.addEventListener('message', function (e) {
    var d = e.data; if (!d || d.type !== 'push' || !d.data) return;
    if (d.data.kind === 'table' && (!enabled() || busy())) return;   // chi sta giocando (o ha spento gli avvisi) non viene disturbato
    // «tocca a te»: se ho già quel tavolo davanti non serve dirmelo
    if (d.data.kind === 'turn' && busy() && String(d.data.url || '').indexOf('?t=' + Net.tableCode) >= 0 && here && String(d.data.url).indexOf('/' + here.path) >= 0) return;
    banner(d.data.title || 'Board Games', d.data.body || '', d.data.url || ROOT, d.data.kind === 'friend' || d.data.kind === 'turn' ? 'Apri' : 'Siediti');
  });

  /* --- grafica: avviso in alto nella pagina e riga di stato --- */
  function css() {
    Kit.css();
    if (document.getElementById('ppa-css')) return;
    var s = document.createElement('style'); s.id = 'ppa-css';
    s.textContent =
      '.ppa-banner{position:fixed;left:50%;top:calc(10px + env(safe-area-inset-top,0px));transform:translate(-50%,-150%);z-index:9998;width:min(440px,calc(100vw - 20px));display:flex;gap:12px;align-items:center;padding:10px 10px 10px 12px;border-radius:16px;background:var(--k-toast-bg);color:var(--k-text);box-shadow:0 16px 40px var(--k-shadow),inset 0 0 0 1px var(--k-line-2);font:14.5px/1.35 var(--k-font);transition:transform .35s cubic-bezier(.2,.9,.3,1.2)}' +
      '.ppa-banner.in{transform:translate(-50%,0)}.ppa-banner .ppa-tx{flex:1;min-width:0}.ppa-banner .ppa-tx b{display:block;font-weight:650}.ppa-banner .ppa-tx span{color:var(--k-muted);font-size:13.5px}' +
      '.ppa-banner .ppa-bi{width:36px;height:36px;border-radius:11px;display:grid;place-items:center;background:var(--k-accent);color:var(--k-on-accent);flex:none}' +
      '.ppa-x{flex:none;appearance:none;border:0;background:none;color:var(--k-muted);padding:6px;cursor:pointer;border-radius:8px}.ppa-x:hover{color:var(--k-text)}';
    document.head.appendChild(s);
  }
  function banner(title, body, url, go) {
    css();
    var old = document.querySelector('.ppa-banner'); if (old) old.remove();
    var b = document.createElement('div'); b.className = 'ppa-banner'; b.setAttribute('role', 'status');
    b.innerHTML = '<span class="ppa-bi">' + Kit.icon('bell', 19) + '</span><div class="ppa-tx"><b>' + esc(title) + '</b><span>' + esc(body) + '</span></div><a class="k-btn sm" href="' + esc(url) + '">' + esc(go || 'Siediti') + '</a><button class="ppa-x" type="button" aria-label="Chiudi l’avviso">' + Kit.icon('x', 18) + '</button>';
    b.querySelector('.ppa-x').onclick = function () { b.remove(); };
    document.body.appendChild(b);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('in'); }); });
    setTimeout(function () { b.classList.remove('in'); setTimeout(function () { b.remove(); }, 400); }, 14000);
  }
  // Riga di stato delle notifiche (home e lobby dei giochi): dice com'è adesso e porta alle impostazioni.
  function controlHTML() {
    css();
    var on, title, sub, btn, manage = '<button type="button" class="k-btn sm sec" data-pa="open" data-v="settings">Gestisci</button>';
    if (srvMode()) {
      on = pushOn(); title = on ? 'Notifiche attive' : 'Notifiche spente';
      sub = on ? 'Nuovi tavoli e inviti arrivano anche ad app chiusa' : 'Ricevi un avviso quando qualcuno apre un tavolo o ti invita';
      btn = on ? manage : '<button type="button" class="k-btn sm" data-alerts="push">Attiva</button>';
    } else {
      on = enabled(); var perm = canSys() ? Notification.permission : 'none';
      title = on ? 'Avvisi accesi' : 'Avvisi spenti';
      sub = on ? 'Nuovi tavoli: ' + (perm === 'granted' ? 'anche con l’app in sottofondo' : 'mentre l’app è aperta') : 'Ti avviso quando qualcuno apre un tavolo';
      btn = on ? manage : '<button type="button" class="k-btn sm" data-alerts="on">Accendi</button>';
    }
    return '<div class="k-status' + (on ? ' on' : '') + '" data-k-alerts><span class="k-st"><span class="k-sti">' + Kit.icon('bell', 18) + '</span><span><b>' + title + '</b><small>' + sub + '</small></span></span>' + btn + '</div>';
  }
  function repaint() { Array.prototype.forEach.call(document.querySelectorAll('[data-k-alerts]'), function (el) { el.outerHTML = controlHTML(); }); }
  function askPerm() {
    if (!canSys() || Notification.permission !== 'default') { repaintAll(); return; }
    try { var r = Notification.requestPermission(function () { repaintAll(); }); if (r && r.then) r.then(repaintAll, repaintAll); } catch (e) { repaintAll(); }
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-alerts]'); if (!b) return;
    var k = b.getAttribute('data-alerts');
    if (k === 'on') { set(KEY, 'on'); start(); askPerm(); repaintAll(); }
    else if (k === 'off') { set(KEY, 'off'); repaintAll(); }
    else if (k === 'perm') askPerm();
    else if (k === 'push') enablePush();
    else if (k === 'test') testNotify();
    else if (k === 'all' || k === 'none') { var p = prefs(); p.games = k === 'all' ? allGames() : []; setPrefs(p); repaintAll(); }
  });

  /* --- home: tutti i tavoli aperti adesso, di tutti i giochi --- */
  function icon(g) { return '<img src="' + esc(ROOT + g.path + 'icon-192.png') + '" alt="" width="44" height="44" loading="lazy">'; }
  function mountHome(el) { homeEl = el; css(); start(); paintHome(); setTimeout(function () { if (homeEl && !list().length) paintHome(true); }, 6000); }
  function paintHome(waited) {
    if (!homeEl) return;
    var l = list().filter(visible);
    if (homeEl.parentNode && homeEl.parentNode.setAttribute) homeEl.parentNode.setAttribute('data-count', l.length);
    if (!l.length) {
      homeEl.innerHTML = '<div class="k-empty">' + (waited || started && Object.keys(tables).length ? Kit.icon('users', 26) + '<b style="color:var(--k-text)">Nessun tavolo aperto in questo momento</b>Aprine uno tu da un gioco qui sotto: comparirà qui per tutti.' : 'Cerco i tavoli aperti…') + '</div>';
      return;
    }
    homeEl.innerHTML = '<div class="h-rows">' + l.slice(0, 8).map(function (t) {
      var code = codeOf(t), e = Object.assign({}, t.e, { code: code }), full = e.max && e.n >= e.max, pub = /^[A-Z]{4}$/.test(code || '');
      var state = e.phase === 'play' ? '<span class="k-pill">In partita</span>' : full ? '<span class="k-pill">Completo</span>' : '<span class="k-pill ok">In attesa</span>';
      var cta = !pub ? 'Ho il codice' : e.phase === 'play' || full ? 'Guarda' : 'Siediti';
      return '<a class="h-row" href="' + esc(urlFor(t.g, pub ? e.code : null)) + '">' + icon(t.g) + '<span class="h-rt"><b>' + esc(nameOf(t)) + '</b><small>Tavolo di ' + esc(String(e.host || '…').slice(0, 18)) + ' · ' + (+e.n || 0) + (e.max ? '/' + e.max : '') + ' giocatori' + (t.e.vis === 'friends' ? ' · solo amici' : pub ? '' : ' · su invito') + '</small></span>' + state + '<span class="k-btn sm' + (cta === 'Siediti' ? '' : ' sec') + '">' + cta + '</span></a>';
    }).join('') + '</div>';
  }

  /* --- home: «Continua la partita», i tavoli dove sei seduto in qualsiasi gioco --- */
  var SEAT = { 'polvere-e-piombo/': 'pp-table', 'presagio/': 'pr-table', 'gattomina/': 'gm-table', 'campi-acciaio/': 'ca-table', 'binari-italia/': 'bi-table', 'catan/': 'ct-table', 'machiavelli/': 'mc-table', 'unlock/': 'ul-table', 'skyjo/': 'sk-table', 'flip7/': 'f7-table', 'citadels/': 'cd-table', 'cabo/': 'cb-table', 'nograzie/': 'ng-table', 'sushigo/': 'sg-table', 'prendi6/': 'p6-table', 'nomicose/': 'nc-table', 'disegna/': 'dg-table', 'sintonia/': 'st-table', 'fune/': 'fn-table', 'conquista/': 'cq-table', 'briscola/': 'br-table', 'scopa/': 'sc-table', 'burraco/': 'bu-table', 'forziere/': 'fz-table' };
  function mountContinue(el) {
    if (!el || typeof Net === 'undefined' || !Net.peekAt) return;
    var box = el.closest('section') || el, cards = {};
    function paint() {
      var l = GAMES.map(function (g) { return cards[g.path]; }).filter(Boolean);
      box.hidden = !l.length;
      el.innerHTML = '<div class="h-rows">' + l.map(function (c) {
        return '<a class="h-row" href="' + esc(urlFor(c.g, c.d.code)) + '">' + icon(c.g) + '<span class="h-rt"><b>' + esc(c.g.n) + (c.d.practice ? ' · prova' : '') + '</b><small>Tavolo ' + esc(c.d.code) + ' · ' + esc(c.st) + (c.others.length ? ' · con ' + esc(c.others.join(', ')) : '') + '</small></span><span class="k-btn sm">Continua</span></a>';
      }).join('') + '</div>';
    }
    css(); paint();
    GAMES.forEach(function (g) {
      var code = get(SEAT[g.path]); if (!/^[A-Z]{4}$/.test(code || '')) return;
      Net.peekAt(g.p, code).then(function (f) {
        if (f && f.closed) { set(SEAT[g.path], null); return; }
        var d = f && f.doc; if (!d || !d.seats || !d.seats.some(function (x) { return x.uid === Net.uid; })) return;
        var st = d.phase === 'play' ? 'partita in corso' : d.phase === 'over' ? 'partita finita' : 'in attesa di giocatori';
        cards[g.path] = { g: g, d: d, st: st, others: d.seats.filter(function (x) { return x.uid !== Net.uid; }).map(function (x) { return x.nick; }).slice(0, 4) };
        paint();
      });
    });
  }


  /* --- chi apre un tavolo pubblico lo fa annunciare dal server a chi ha le notifiche attive --- */
  function created(prefix, code, nick, vis) {
    var m = obj(MINE), now = Date.now();
    Object.keys(m).forEach(function (x) { if (now - m[x] > 24 * 3600e3) delete m[x]; });
    m[prefix + code] = now; set(MINE, JSON.stringify(m));
    if (vis === 'invite' || vis === 'direct' || (/[?&]broker=/.test(location.search) && !/[?&]annunci=1/.test(location.search))) return; // niente annunci dai tavoli su invito né dalle prove locali
    if (window.Account && Account.presence) Account.presence();   // gli amici devono sapere subito dove si trova il tavolo
    var g = GAMES.filter(function (x) { return x.p === prefix; })[0]; if (!g) return;
    if (window.Account && Account.user()) Account.notify({ kind: 'table', game: g.path.replace(/\/$/, ''), code: code, vis: vis === 'friends' ? 'friends' : 'public' }).catch(function (e) { console.warn('annuncio', e); });
  }

  if (enabled()) setTimeout(start, 1200);
  return { start: start, controlHTML: controlHTML, mountHome: mountHome, created: created, list: list, enabled: enabled, _tables: tables,
    GAMES: GAMES, ROOT: ROOT, here: here, settingsHTML: notifyHTML, notifyHTML: notifyHTML, gamesHTML: gamesHTML, enablePush: enablePush, disablePush: disablePush, resync: resync, forget: forget, pushOn: pushOn, turnsOn: function () { return prefs().turns; }, endpoint: function () { return get(SUBK); }, banner: banner, paintHome: function () { paintHome(); }, mountContinue: mountContinue };
})();
