/* ===== Avvisi: qualcuno ha aperto un tavolo in uno qualsiasi dei giochi =====
   Funziona su tutte le pagine (home e giochi): ascolta le liste dei tavoli di tutti i giochi e,
   quando compare un tavolo pubblico appena aperto, mostra un avviso nella pagina o, se l'app è in
   sottofondo e il telefono lo permette, una notifica di sistema. Per ricevere gli avvisi anche ad app
   chiusa serve un servizio di notifiche esterno: si usa ntfy (gratuito), a cui il telefono di chi apre
   un tavolo pubblico manda un messaggio sul canale qui sotto. */
var Alerts = (function () {
  var GAMES = [
    { p: 'polvere-piombo/v1/', path: 'polvere-e-piombo/', n: 'Bang!' },
    { p: 'presagio/v1/', path: 'presagio/', n: 'Wizard' },
    { p: 'gattomina/v1/', path: 'gattomina/', n: 'Exploding Kittens' },
    { p: 'campi-acciaio/v1/', path: 'campi-acciaio/', n: 'Scythe' },
    { p: 'binari-italia/v1/', path: 'binari-italia/', n: 'Binari d’Italia' }
  ];
  var NTFY = 'board-games-alessandrop95-tavoli';
  var KEY = 'pp-alerts', SEEN = 'pp-alerted', MINE = 'pp-mytables', TTL = 150000;
  var here = GAMES.filter(function (g) { return location.pathname.indexOf('/' + g.path) >= 0; })[0] || null;
  var ROOT = here ? '../' : './';
  var started = false, tables = {}, homeEl = null;

  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { localStorage.setItem(k, v); } catch (e) {} }
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
    if (!e.c || e.t - e.c > 90000 || e.t < e.c - 5000) return;       // solo tavoli aperti adesso (orari dello stesso telefono)
    if (isMine(g, e.code) || (here && here.p === g.p && Net.tableCode === e.code) || busy()) return;
    var seen = obj(SEEN), now = Date.now();
    if (seen[k]) return;                                               // già avvisato (anche da un'altra scheda)
    Object.keys(seen).forEach(function (x) { if (now - seen[x] > 3600e3) delete seen[x]; });
    seen[k] = now; set(SEEN, JSON.stringify(seen));
    var title = 'Nuovo tavolo: ' + nameOf(t), body = (e.host || 'Qualcuno') + ' ha aperto un tavolo ed è in attesa di giocatori.', url = urlFor(g, e.code);
    if (document.visibilityState === 'visible') banner(title, body, url);
    else if (sysOn()) sysNotify(title, body + ' Tocca per sederti.', url, k);
  }
  function sysNotify(title, body, url, tag) {
    var o = { body: body, tag: tag, data: { url: url }, icon: new URL(ROOT + 'icon-192.png', location.href).href };
    function plain() { try { var n = new Notification(title, o); n.onclick = function () { window.focus(); location.href = url; n.close(); }; } catch (e) {} }
    if (navigator.serviceWorker && navigator.serviceWorker.getRegistration) {
      navigator.serviceWorker.getRegistration().then(function (r) { if (r && r.showNotification) return r.showNotification(title, o); plain(); }).catch(plain);
    } else plain();
  }

  /* --- grafica: avviso nella pagina, interruttore, finestra ntfy, lista in home --- */
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
  function banner(title, body, url) {
    css();
    var old = document.querySelector('.ppa-banner'); if (old) old.remove();
    var b = document.createElement('div'); b.className = 'ppa-banner'; b.setAttribute('role', 'status');
    b.innerHTML = DIE + '<div class="ppa-tx"><b>' + esc(title) + '</b><br><span>' + esc(body) + '</span></div><a class="ppa-go" href="' + esc(url) + '">Siediti</a><button class="ppa-x" type="button" aria-label="Chiudi l’avviso">×</button>';
    b.querySelector('.ppa-x').onclick = function () { b.remove(); };
    document.body.appendChild(b);
    requestAnimationFrame(function () { requestAnimationFrame(function () { b.classList.add('in'); }); });
    setTimeout(function () { b.classList.remove('in'); setTimeout(function () { b.remove(); }, 400); }, 14000);
  }
  function controlHTML() {
    css();
    var on = enabled(), perm = canSys() ? Notification.permission : 'none', st, btns;
    if (!on) { st = 'Avvisi dei nuovi tavoli <b>spenti</b>'; btns = '<button type="button" data-alerts="on">Accendi</button>'; }
    else if (perm === 'granted') { st = 'Ti avviso quando qualcuno apre un tavolo, anche con l’app in sottofondo'; btns = '<button type="button" class="on" data-alerts="off" aria-pressed="true">Avvisi accesi</button>'; }
    else {
      st = 'Ti avviso quando qualcuno apre un tavolo, mentre l’app è aperta';
      btns = (perm === 'default' ? '<button type="button" data-alerts="perm">Anche come notifica</button>' : '') + '<button type="button" class="on" data-alerts="off" aria-pressed="true">Avvisi accesi</button>';
    }
    return '<div class="ppa-ctl"><span class="ppa-st">' + BELL + '<span>' + st + '</span></span>' + btns + '<button type="button" class="ppa-lnk" data-alerts="ntfy">Ad app chiusa?</button></div>';
  }
  function repaint() { Array.prototype.forEach.call(document.querySelectorAll('.ppa-ctl'), function (el) { el.outerHTML = controlHTML(); }); }
  function askPerm() {
    if (!canSys() || Notification.permission !== 'default') { repaint(); return; }
    try { var r = Notification.requestPermission(function () { repaint(); }); if (r && r.then) r.then(repaint, repaint); } catch (e) { repaint(); }
  }
  function ntfySheet() {
    css();
    var web = 'https://ntfy.sh/' + NTFY;
    var o = document.createElement('div'); o.className = 'ppa-sheet';
    o.innerHTML = '<div class="ppa-card" role="dialog" aria-modal="true" aria-label="Avvisi ad app chiusa"><h3>Avvisi anche ad app chiusa</h3>' +
      '<p style="margin:0">Il telefono non può svegliare questa app quando è chiusa, quindi gli avvisi passano da <b>ntfy</b>, un’app di notifiche gratuita e senza registrazione. Ogni volta che qualcuno apre un tavolo <b>aperto a tutti</b>, ti arriva una notifica: toccala e ti siedi.</p>' +
      '<ol><li>Installa ntfy: <a href="https://play.google.com/store/apps/details?id=io.heckel.ntfy" target="_blank" rel="noopener">Android</a> · <a href="https://apps.apple.com/app/ntfy/id1625396347" target="_blank" rel="noopener">iPhone</a></li>' +
      '<li>Nell’app tocca <b>+</b> e iscriviti al canale <code>' + NTFY + '</code></li>' +
      '<li>Su computer o Android puoi anche usare il browser: apri <a href="' + web + '" target="_blank" rel="noopener">ntfy.sh/' + NTFY + '</a> e attiva le notifiche.</li></ol>' +
      '<p style="margin:0;font-size:13.5px;opacity:.75">Il canale è pubblico: contiene solo il nome di chi apre il tavolo, il gioco e il link per sedersi. I tavoli «solo su invito» non vengono mai annunciati.</p>' +
      '<div class="row"><button type="button" class="main" data-ppa="copy">Copia il nome del canale</button><button type="button" data-ppa="close">Chiudi</button></div></div>';
    o.addEventListener('click', function (ev) {
      var a = ev.target.closest('[data-ppa]');
      if (ev.target === o || (a && a.getAttribute('data-ppa') === 'close')) { o.remove(); return; }
      if (a && a.getAttribute('data-ppa') === 'copy') { try { navigator.clipboard.writeText(NTFY).then(function () { a.textContent = 'Copiato'; }, function () {}); } catch (e) {} }
    });
    document.body.appendChild(o);
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-alerts]'); if (!b) return;
    var k = b.getAttribute('data-alerts');
    if (k === 'on') { set(KEY, 'on'); start(); askPerm(); repaint(); }
    else if (k === 'off') { set(KEY, 'off'); repaint(); }
    else if (k === 'perm') askPerm();
    else if (k === 'ntfy') ntfySheet();
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

  /* --- chi apre un tavolo pubblico lo annuncia anche su ntfy (per chi vuole gli avvisi ad app chiusa) --- */
  function created(prefix, code, nick, vis) {
    var m = obj(MINE), now = Date.now();
    Object.keys(m).forEach(function (x) { if (now - m[x] > 24 * 3600e3) delete m[x]; });
    m[prefix + code] = now; set(MINE, JSON.stringify(m));
    if (vis === 'invite' || /[?&]broker=/.test(location.search)) return; // niente annunci dai tavoli su invito né dalle prove locali
    var g = GAMES.filter(function (x) { return x.p === prefix; })[0]; if (!g) return;
    var name = document.title && document.title !== 'Board Games' ? document.title : g.n;
    var msg = { topic: NTFY, title: 'Nuovo tavolo: ' + name, message: (nick || 'Qualcuno') + ' ha aperto un tavolo ed è in attesa di giocatori. Tocca per sederti.', click: urlFor(g, code), tags: ['game_die'] };
    try { fetch('https://ntfy.sh/', { method: 'POST', mode: 'no-cors', keepalive: true, body: JSON.stringify(msg) }).catch(function () {}); } catch (e) {}
  }

  if (enabled()) setTimeout(start, 1200);
  return { start: start, controlHTML: controlHTML, mountHome: mountHome, created: created, list: list, enabled: enabled, _tables: tables };
})();
