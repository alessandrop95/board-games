/* ===== Account (nome utente e password), amici e inviti — server Supabase =====
   Niente email: chi dimentica la password la cambia con il «codice di recupero» ricevuto alla registrazione
   (o creato dopo, dalla scheda dell'account). Dalla stessa scheda si vedono i dispositivi collegati.
   L'indirizzo del server sta in server.json (scritto dall'azione «Server» su GitHub). Finché il server
   non è configurato, i giochi funzionano come prima, senza account. */
var Account = (function () {
  var A = window.Alerts || {}, ROOT = A.ROOT || './';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function jget(k) { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var sig = null, cfg = jget('pp-server'), session = jget('pp-session'), friendsData = null, view = null, busy = false, msg = null, inviteSent = {};
  var showPw = false, hasRecovery = null, devices = null, reloadOnClose = false;
  var NEED_USER = { friends: 1, stats: 1, security: 1, invite: 1, settings: 0 };
  var readyRes; var ready = new Promise(function (r) { readyRes = r; });

  /* ---------- server ---------- */
  function load() {
    sig = configured() + ':' + !!user();
    fetch(ROOT + 'server.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : (r.status === 404 ? false : null); }).then(function (j) {
      if (j && j.url && j.anon) { cfg = j; set('pp-server', JSON.stringify(j)); }
      else if (j === false) { cfg = null; set('pp-server', null); }
      var was = sig; sig = configured() + ':' + !!user();
      readyRes(); repaint(); check();
      // La scelta «chi può sedersi» era stata disegnata prima di sapere se c'è l'account: la si aggiorna (opzione «Solo amici»).
      if (was !== sig && window.Lobby && Lobby.pickHTML) document.querySelectorAll('.vis-pick').forEach(function (el) { el.outerHTML = Lobby.pickHTML(); });
    }, function () { readyRes(); });
  }
  function configured() { return !!(cfg && cfg.url); }
  function rpc(fn, args) {
    if (!configured()) return Promise.reject('Il server non è ancora attivo.');
    return fetch(cfg.url + '/rest/v1/rpc/' + fn, { method: 'POST', headers: { apikey: cfg.anon, Authorization: 'Bearer ' + cfg.anon, 'Content-Type': 'application/json' }, body: JSON.stringify(args || {}) })
      .then(function (r) { return r.text().then(function (t) { var d = null; try { d = t ? JSON.parse(t) : null; } catch (e) { d = t; } if (!r.ok) throw (d && d.message) || 'Errore del server.'; if (d && d.error) throw d.error; return d; }); },
        function () { throw 'Nessuna connessione con il server: riprova tra poco.'; })
      .catch(function (e) { if (/Sessione scaduta/.test(String(e))) dropSession(); throw e; });
  }
  function notify(body) {
    if (!configured() || !session) return Promise.reject('Accedi per mandare avvisi.');
    body.token = session.token;
    return fetch(cfg.fn, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) })
      .then(function (r) { return r.json().then(function (d) { if (!r.ok || d.error) throw d.error || 'Errore del server.'; return d; }); }, function () { throw 'Nessuna connessione con il server.'; })
      .catch(function (e) { if (/Sessione scaduta/.test(String(e))) dropSession(); throw e; });
  }

  /* ---------- sessione ---------- */
  function device() { var u = navigator.userAgent || ''; return (/Android/.test(u) ? 'Android' : /iPhone|iPad/.test(u) ? 'iPhone/iPad' : /Mac/.test(u) ? 'Mac' : /Windows/.test(u) ? 'Windows' : 'Browser') + (/Chrome/.test(u) ? ' Chrome' : /Safari/.test(u) ? ' Safari' : /Firefox/.test(u) ? ' Firefox' : ''); }
  // L'identità al tavolo resta quella di questo dispositivo (pp-uid), anche con l'account: lo stesso account aperto
  // su due telefoni allo stesso tavolo non deve diventare «lo stesso giocatore due volte» (mosse doppie, partita sdoppiata),
  // e accedere o uscire non deve far perdere il posto a un tavolo. Una versione precedente la cambiava: qui si ripristina.
  (function () { var dev = get('pp-uid-dev'); if (dev && /^u[a-z0-9]+$/.test(dev)) set('pp-uid', dev); if (dev != null) set('pp-uid-dev', null); })();
  function setSession(s) { session = s; set('pp-session', s ? JSON.stringify(s) : null); if (s && !get('pp-nick')) set('pp-nick', s.username); }
  function dropSession() { setSession(null); friendsData = null; repaint(); }
  function check() {
    if (session && configured()) rpc('me', { p_token: session.token }).then(function (m) {
      if (m && m.username !== session.username) { session.username = m.username; set('pp-session', JSON.stringify(session)); repaint(); }
      if (m && typeof m.recovery === 'boolean') { hasRecovery = m.recovery; if (view && (view.v === 'settings' || view.v === 'security')) render(); }
      refreshFriends(true);
    }, function () {});
  }
  // Accesso o uscita fatti in un'altra scheda (o in un altro gioco aperto): questa pagina si adegua da sola.
  window.addEventListener('storage', function (e) {
    if (e.key !== 'pp-session') return;
    var was = session && session.token; session = jget('pp-session');
    if ((session && session.token) === was) return;
    friendsData = null; hasRecovery = null; devices = null; presSig = null;
    repaint(); paintLists(); if (view) { if (!session && NEED_USER[view.v]) close(); else render(); }
    if (session) check();
  });
  function user() { return configured() && session ? session : null; }
  function reloadSoon() { setTimeout(function () { location.reload(); }, 350); }

  /* Dopo l'accesso la pagina si ricarica (così tutto riparte con l'account). Quello che l'utente stava facendo quando
     gli è stato chiesto di accedere (aprire un tavolo, sedersi a uno) riprende da solo dopo la ricarica. */
  var AFTER = 'pp-after-login', lastAct = null;
  function sget(k) { try { return JSON.parse(sessionStorage.getItem(k) || 'null'); } catch (e) { return null; } }
  function sset(k, v) { try { if (v == null) sessionStorage.removeItem(k); else sessionStorage.setItem(k, JSON.stringify(v)); } catch (e) {} }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-act],[data-coach]'); if (!b) return;
    var a = b.getAttribute('data-act'), jc = document.getElementById('joincode');
    if (b.getAttribute('data-coach') === 'start') lastAct = { act: 'coach', at: Date.now() };
    else if (a === 'create') lastAct = { act: 'create', at: Date.now() };
    else if (a === 'join') lastAct = { act: 'join', code: (jc && jc.value) || '', at: Date.now() };
    else if (a === 'jointable' || a === 'lobbyjoin') lastAct = { act: 'join', code: b.getAttribute('data-code') || '', at: Date.now() };
  }, true);
  function intent() {
    var jc = document.getElementById('joincode'), i = lastAct && Date.now() - lastAct.at < 1500 ? lastAct : document.activeElement === jc && jc ? { act: 'join', code: jc.value } : null;
    if (!i) return null;
    if (i.act === 'join' && !/^[A-Za-z]{4}$/.test(String(i.code || '').trim())) return null;
    if (i.act === 'create' && window.Lobby && Lobby.pickedVis && document.querySelector('input[name="vis"]')) Lobby.pickedVis();   // la scelta «chi può sedersi» resta quella
    return { act: i.act, code: String(i.code || '').trim().toUpperCase() };
  }
  function resume() {
    var a = sget(AFTER); sset(AFTER, null);
    if (!a || Date.now() - a.at > 120000 || !user()) return;
    if (a.toast) toastMsg(a.toast);
    setTimeout(function () {
      try {
        if (a.act === 'create' && typeof createTable === 'function' && !(window.App && App.code)) createTable();
        else if (a.act === 'join' && typeof joinTable === 'function') joinTable(a.code);
        else if (a.act === 'coach' && window.Coach && Coach.start && !(window.App && App.code)) Coach.start();
      } catch (e) { console.warn('ripresa', e); }
    }, 400);
  }
  // s = risposta di login / register / recover. Con un codice di recupero nuovo lo si mostra prima di ricaricare.
  function entered(s, hello) {
    var code = s.recovery || null, pend = view && view.x && view.x.intent; delete s.recovery;
    setSession(s); set('pp-nick', s.username);
    sset(AFTER, { toast: hello, act: pend && pend.act, code: pend && pend.code, at: Date.now() });
    return (window.Alerts && Alerts.resync ? Alerts.resync() : Promise.resolve()).catch(function () {}).then(function () {
      if (code) { hasRecovery = true; reloadOnClose = true; view = { v: 'code', x: { code: code, fresh: true } }; msg = null; render(); return; }
      close(); toastMsg(hello); reloadSoon();
    });
  }
  function login(u, p, isNew) {
    return rpc(isNew ? 'register' : 'login', { p_username: u, p_password: p, p_device: device() }).then(function (s) {
      return entered(s, isNew ? 'Benvenuto, ' + s.username + '! Account creato.' : 'Bentornato, ' + s.username + '!');
    });
  }
  function recover(u, code, p) {
    return rpc('recover', { p_username: u, p_code: code, p_password: p, p_device: device() }).then(function (s) { return entered(s, 'Password cambiata. Bentornato, ' + s.username + '!'); });
  }
  function loadDevices() {
    if (!user()) return;
    rpc('my_sessions', { p_token: session.token }).then(function (l) { devices = Array.isArray(l) ? l : []; if (view && view.v === 'security') render(); }, function () { devices = []; });
  }
  function ago(ts) {
    var m = Math.max(0, Math.round((Date.now() - new Date(ts).getTime()) / 60000));
    return m < 2 ? 'adesso' : m < 60 ? m + ' minuti fa' : m < 48 * 60 ? Math.round(m / 60) + ' ore fa' : Math.round(m / 1440) + ' giorni fa';
  }
  function logout() {
    var s = session; if (!s) return;
    var p = window.Alerts && Alerts.forget ? Alerts.forget() : Promise.resolve();
    p.catch(function () {}).then(function () { return rpc('logout', { p_token: s.token }).catch(function () {}); }).then(function () { setSession(null); close(); reloadSoon(); });
  }

  /* ---------- amici ---------- */
  function refreshFriends(quiet) {
    if (!user()) return Promise.resolve(null);
    return rpc('friends', { p_token: session.token }).then(function (d) { friendsData = d; repaint(); if (!quiet) render(); return d; });
  }
  function friend(name) {
    if (!name || !friendsData || !friendsData.friends) return null;
    var n = String(name).toLowerCase();
    return friendsData.friends.filter(function (f) { return f.username.toLowerCase() === n; })[0] || null;
  }
  var soonAt = 0;
  function refreshFriendsSoon() { if (Date.now() - soonAt < 10000 || !user()) return; soonAt = Date.now(); refreshFriends(true).then(paintLists, function () {}); }
  function paintLists() { if (window.Lobby && Lobby.paint) Lobby.paint(); if (window.Alerts && Alerts.paintHome) Alerts.paintHome(); }

  /* ---------- presenza: gli amici vedono se sei collegato e a quale tavolo ---------- */
  // Ogni minuto con l'app aperta (e subito quando entri o esci da un tavolo). Il server risponde con gli amici aggiornati.
  var presSig = null, presAt = 0, presBusy = false;
  function where() {
    var g = A.here ? A.here.path.replace(/\/$/, '') : null, d = window.App && App.doc, code = window.Net && Net.tableCode;
    var seated = d && d.seats && window.Net && d.seats.some(function (x) { return x.uid === Net.uid; });
    if (!d || !code || d.practice || d.vis === 'direct' || !(seated || App.screen === 'table')) return { g: g, t: null, v: null, ph: null };   // tavolo privato: agli amici non si dice dove
    return { g: g, t: code, v: d.vis || 'public', ph: d.phase };
  }
  function presenceTick(force) {
    if (!user() || presBusy || document.visibilityState === 'hidden') return;
    var w = where(), sig = JSON.stringify(w);
    if (!force && sig === presSig && Date.now() - presAt < 60000) return;
    presBusy = true; presSig = sig; presAt = Date.now();
    rpc('presence', { p_token: session.token, p_game: w.g, p_table: w.t, p_vis: w.v, p_phase: w.ph })
      .then(function (d) { friendsData = d; repaint(); paintLists(); if (view && (view.v === 'settings' || view.v === 'friends' || view.v === 'invite')) render(); }, function () { presSig = null; })
      .then(function () { presBusy = false; });
  }
  setInterval(function () { presenceTick(false); }, 4000);
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible') presenceTick(true); });
  function gameName(id) { var g = (A.GAMES || []).filter(function (x) { return x.path === id + '/'; })[0]; return g ? g.n : id; }
  function friendLine(f) {
    if (!f.online) return 'non in linea';
    if (!f.game) return 'collegato';
    if (!f.table) return 'sta guardando ' + gameName(f.game);
    return (f.phase === 'play' ? 'sta giocando a ' : f.phase === 'over' ? 'ha appena finito a ' : 'è al tavolo di ') + gameName(f.game) + (f.phase === 'lobby' ? ', in attesa' : '');
  }
  function joinHref(f) { return f.online && f.game && f.table ? ROOT + f.game + '/?t=' + f.table : null; }

  /* ---------- statistiche ---------- */
  var statsData = null, boardData = null, boardGame = '';
  function loadStats() {
    return Promise.all([rpc('my_stats', { p_token: session.token }), rpc('friends_board', { p_token: session.token, p_game: boardGame || null })])
      .then(function (r) { statsData = r[0]; boardData = r[1]; render(); }, function (er) { msg = { t: String(er) }; render(); });
  }
  function statsHTML() {
    if (!statsData) return msgHTML() + '<div class="kit-empty">Carico le tue partite…</div>';
    var gs = statsData.games, tp = 0, tw = 0; gs.forEach(function (x) { tp += x.played; tw += x.won; });
    var h = msgHTML() + '<div class="kit-stat"><div><b>' + tp + '</b><small>partite</small></div><div><b>' + tw + '</b><small>vinte</small></div><div><b>' + Math.round(100 * tw / Math.max(1, tp)) + '%</b><small>vittorie</small></div></div>';
    h += gs.length ? Kit.group('Per gioco', gs.map(function (x) {
      return Kit.row({ title: esc(gameName(x.game)), sub: x.won + ' vinte su ' + x.played, right: '<span class="kit-pill' + (x.won ? ' a' : '') + '">' + Math.round(100 * x.won / Math.max(1, x.played)) + '%</span>' });
    })) : '<p class="kit-note">Ancora nessuna partita registrata: si contano quelle finite da quando hai l’account (non le partite di prova).</p>';
    h += '<section class="kit-group"><h3 class="kit-gtitle">Classifica tra amici</h3><div class="kit-scroll-x"><button type="button" class="kit-chipbtn' + (boardGame ? '' : ' on') + '" data-pa="board" data-g="">Tutti i giochi</button>' +
      (A.GAMES || []).map(function (g) { var id = g.path.replace(/\/$/, ''); return '<button type="button" class="kit-chipbtn' + (boardGame === id ? ' on' : '') + '" data-pa="board" data-g="' + id + '">' + esc(g.n) + '</button>'; }).join('') + '</div>' +
      (boardData && boardData.length ? '<div class="kit-list">' + boardData.map(function (r, i) {
        return Kit.row({ title: esc(r.username) + (r.me ? ' <span class="kit-pill a">tu</span>' : ''), sub: r.won + ' vinte · ' + r.played + ' giocate', right: '<span class="kit-rv">' + (i + 1) + 'º</span>' });
      }).join('') + '</div>' : '<p class="kit-note">Nessun risultato.</p>') + '</section>';
    if (statsData.recent.length) h += Kit.group('Ultime partite', statsData.recent.map(function (x) {
      var d = new Date(x.at), when = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ', ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return Kit.row({ title: esc(gameName(x.game)), sub: when + (x.rivals && x.rivals.length ? ' · con ' + x.rivals.map(esc).join(', ') : ''),
        right: '<span class="kit-pill' + (x.won ? ' ok' : '') + '">' + (x.won ? 'Vinta' : x.place ? x.place + 'º posto' : 'Persa') + (x.score != null ? ' · ' + x.score : '') + '</span>' });
    }));
    return h;
  }
  function incoming() { return friendsData && friendsData.incoming ? friendsData.incoming.length : 0; }
  function addFriend(name) {
    return notify({ kind: 'friend', to: name }).then(function (r) {
      var t = r.state === 'accepted' ? 'Tu e ' + r.to + ' ora siete amici.' : r.state === 'already' ? 'Tu e ' + r.to + ' siete già amici.' : r.state === 'pending' ? 'Hai già chiesto l’amicizia a ' + r.to + ': aspetta che accetti.' : 'Richiesta inviata a ' + r.to + '.';
      msg = { ok: true, t: t }; return refreshFriends();
    });
  }

  /* ---------- grafica: pannello «Impostazioni» (profilo, amici, statistiche, notifiche, audio, app, account) ---------- */
  var TITLES = { settings: 'Impostazioni', friends: 'Amici', stats: 'Statistiche', security: 'Password e account', games: 'Nuovi tavoli', login: 'Accedi', register: 'Crea account', recover: 'Password dimenticata', code: 'Codice di recupero', invite: 'Invita un amico' };
  // stili propri del pannello (il resto viene dal kit): password con «Mostra», codice di recupero, avvisi
  var CSS = '.pa-pw{position:relative;display:block}.pa-pw .kit-input{padding-right:92px}' +
    '.pa-eye{position:absolute;right:6px;top:50%;transform:translateY(-50%);appearance:none;border:0;background:var(--k-surface-3);color:var(--k-text);border-radius:9px;padding:7px 11px;font:600 13px var(--k-font);cursor:pointer}' +
    '.pa-code{font:700 24px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-align:center;padding:18px 10px;border-radius:16px;background:var(--k-surface);border:1.5px dashed var(--k-accent-ink);color:var(--k-text);user-select:all;-webkit-user-select:all}' +
    '.kit-warn{display:grid;gap:10px;padding:13px 14px;border-radius:16px;background:color-mix(in srgb,#e8a33c 13%,transparent);box-shadow:inset 0 0 0 1px color-mix(in srgb,#e8a33c 45%,transparent);font-size:14px;line-height:1.45}.kit-warn .kit-btn{justify-self:start}' +
    '.kit-link{appearance:none;border:0;background:none;color:var(--k-accent-ink);font:600 14.5px var(--k-font);text-decoration:underline;text-underline-offset:3px;padding:4px 0;cursor:pointer;justify-self:start}';
  function css() { Kit.css(); if (!document.getElementById('pa-css')) { var s = document.createElement('style'); s.id = 'pa-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function toastMsg(t) { Kit.toast(t); }
  function close() {
    var m = document.querySelector('.kit-back[data-pa-sheet]'); if (m) m.remove(); view = null; msg = null; showPw = false;
    if (reloadOnClose) { reloadOnClose = false; reloadSoon(); }   // appena entrati: ora che il codice di recupero è stato visto, si riparte con l'account
  }
  function open(v, extra) {
    css(); v = v === 'account' || !v ? 'settings' : v;
    view = { v: v, x: extra || {} }; msg = null;
    if ((NEED_USER[v] || v === 'login' || v === 'register' || v === 'recover') && !configured()) view = { v: 'settings', x: {} };
    else if (NEED_USER[v] && !user()) view = { v: 'login', x: { why: extra && extra.why, intent: extra && extra.intent } };
    render();
    if (user() && (view.v === 'settings' || view.v === 'friends' || view.v === 'invite')) refreshFriends(true).then(render, function () {});
    if (user() && view.v === 'security') { devices = null; loadDevices(); }
    if (user() && view.v === 'stats') { statsData = null; loadStats(); }
  }
  function go(v) {
    // passando tra accesso, registrazione e recupero si tiene il motivo e quello che si stava facendo
    var keep = view && view.x && (view.x.why || view.x.intent) && /^(login|register|recover)$/.test(v) ? { why: view.x.why, intent: view.x.intent } : {};
    view = { v: v, x: keep }; msg = null; render(); var s = document.querySelector('.kit-back[data-pa-sheet] .kit-sheet'); if (s) s.scrollTop = 0;
    if (view.v === 'friends') refreshFriends(true).then(render, function () {});
    if (view.v === 'security') { devices = null; loadDevices(); }
    if (view.v === 'stats') { statsData = null; loadStats(); }
  }
  function render() {
    if (!view) return;
    var back = document.querySelector('.kit-back[data-pa-sheet]');
    if (!back) {
      back = document.createElement('div'); back.className = 'kit-back'; back.setAttribute('data-pa-sheet', '');
      back.addEventListener('click', function (e) { if (e.target === back) close(); });
      document.body.appendChild(back);
    }
    var focused = document.activeElement && back.contains(document.activeElement) ? document.activeElement.name : null, vals = {};
    back.querySelectorAll('input[type=text],input[type=password]').forEach(function (i) { if (i.name) vals[i.name] = i.value; });
    var sheet = back.querySelector('.kit-sheet'), top = sheet ? sheet.scrollTop : 0, sub = view.v !== 'settings' && !((view.v === 'login' || view.v === 'register') && view.x.why) && view.v !== 'invite' && view.v !== 'code';
    var auth = view.v === 'login' || view.v === 'register';
    var backTo = view.v === 'recover' ? 'login' : 'settings';
    back.innerHTML = '<div class="kit-sheet" role="dialog" aria-modal="true" aria-labelledby="pa-title"><div class="kit-head">' +
      (sub ? '<button type="button" class="kit-icbtn" data-pa="go" data-v="' + backTo + '" aria-label="Indietro">' + Kit.icon('back') + '</button>' : '<span class="kit-icbtn ghost"></span>') +
      '<h2 id="pa-title">' + (auth ? (view.v === 'register' ? 'Crea il tuo account' : 'Entra in Board Games') : TITLES[view.v] || '') + '</h2>' +
      '<button type="button" class="kit-icbtn" data-pa="close" aria-label="Chiudi">' + Kit.icon('x') + '</button></div><div class="kit-body">' + body() + '</div></div>';
    sheet = back.querySelector('.kit-sheet'); sheet.scrollTop = top;
    back.querySelectorAll('input[type=text],input[type=password]').forEach(function (i) { if (vals[i.name] != null) i.value = vals[i.name]; });
    var f = focused && back.querySelector('[name="' + focused + '"]'); if (f) f.focus();
  }
  function msgHTML() { return msg ? '<p class="kit-msg ' + (msg.ok ? 'ok' : 'err') + '" role="status">' + esc(msg.t) + '</p>' : ''; }
  function myNick() { return (get('pp-nick') || '').trim().slice(0, 18); }

  function body() {
    var v = view.v, u = user();
    if (v === 'login' || v === 'register') return authHTML(v === 'register');
    if (v === 'recover') return recoverHTML();
    if (v === 'code') return codeHTML();
    if (v === 'stats') return statsHTML();
    if (v === 'friends') return friendsHTML();
    if (v === 'invite') return inviteListHTML();
    if (v === 'security') return securityHTML();
    if (v === 'games') return window.Alerts && Alerts.gamesHTML ? Alerts.gamesHTML() : '';
    return settingsHTML(u);
  }
  function settingsHTML(u) {
    var h = msgHTML(), nick = myNick(), d = friendsData, n = incoming();
    var online = d && d.friends ? d.friends.filter(function (f) { return f.online; }).length : 0;
    // profilo
    var who = u ? u.username : nick || 'Ospite';
    var sub = u ? 'Account Board Games' + (d && d.friends ? ' · ' + d.friends.length + (d.friends.length === 1 ? ' amico' : ' amici') + (online ? ', ' + online + ' in linea' : '') : '')
      : configured() ? 'Accedi per ritrovare amici, inviti e notifiche su tutti i tuoi dispositivi.' : 'Giochi senza account: il nome resta su questo dispositivo.';
    h += '<div class="kit-list"><div class="kit-row" style="min-height:76px">' + Kit.avatar(who === 'Ospite' ? '' : who, 'lg') + '<span class="kit-rt"><b style="font-size:17px">' + esc(who) + '</b><small>' + esc(sub) + '</small></span>' +
      (configured() && !u ? '<button type="button" class="kit-btn sm" data-pa="go" data-v="login">Accedi</button>' : '') + '</div></div>';
    if (u && hasRecovery === false) h += '<div class="kit-warn"><span><b>Non hai ancora un codice di recupero.</b> Senza, se dimentichi la password l’account è perso (amici e statistiche compresi).</span><button class="kit-btn sm" type="button" data-pa="rec">Crea il codice di recupero</button></div>';
    // al tavolo
    h += Kit.group('Al tavolo', [Kit.row({ ic: 'user', title: 'Il tuo nome', sub: 'Lo vedono gli altri al tavolo', right: '<input class="kit-input" type="text" name="nick" data-pa-nick maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(nick) + '" aria-label="Il tuo nome al tavolo">', tag: 'label' })]);
    if (u) h += Kit.group('Amici e partite', [
      Kit.row({ ic: 'users', title: 'Amici', sub: n ? n + (n === 1 ? ' richiesta di amicizia' : ' richieste di amicizia') : 'Invitali ai tavoli con una notifica', right: n ? '<span class="kit-badge">' + n + '</span>' : '', attrs: 'data-pa="go" data-v="friends"', chev: true }),
      Kit.row({ ic: 'chart', title: 'Statistiche', sub: 'Le tue partite e la classifica tra amici', attrs: 'data-pa="go" data-v="stats"', chev: true })
    ]);
    if (window.Alerts && Alerts.notifyHTML) h += Alerts.notifyHTML();
    if (window.Sound && Sound.setMusic) h += Kit.group('Audio', [
      Kit.row({ ic: 'music', title: 'Musica di sottofondo', right: Kit.sw('data-pa-snd="m" aria-label="Musica di sottofondo"', Sound.musicOn), tag: 'label' }),
      Kit.row({ ic: 'sound', title: 'Effetti sonori', right: Kit.sw('data-pa-snd="s" aria-label="Effetti sonori"', Sound.sfxOn), tag: 'label' })
    ]);
    var app = [];
    app.push('<div class="kit-row" style="flex-wrap:wrap;row-gap:10px"><span class="kit-ri">' + Kit.icon('sun', 18) + '</span><span class="kit-rt"><b>Aspetto</b><small>Automatico segue il tema del telefono</small></span>' +
      '<div style="flex:1 1 100%">' + Kit.seg('kit-theme-pick', [['auto', 'Automatico'], ['dark', 'Scuro'], ['light', 'Chiaro']], Kit.themePref()) + '</div></div>');
    if (window.PWA && PWA.available && PWA.available()) app.push(Kit.row({ ic: 'download', title: PWA.apk && PWA.apk() ? 'Scarica l’app' : 'Installa l’app', sub: 'Si apre a tutto schermo, come un’app vera', attrs: 'data-pa="install"', chev: true }));
    if (A.here) app.push(Kit.row({ ic: 'grid', title: 'Tutti i giochi', sub: 'Torna alla home di Board Games', href: ROOT, chev: true }));
    if (app.length) h += Kit.group('App', app);
    if (u) h += Kit.group('Account', [
      Kit.row({ ic: 'key', title: 'Password e account', sub: 'Dispositivi collegati, codice di recupero, password', attrs: 'data-pa="go" data-v="security"', chev: true }),
      Kit.row({ ic: 'out', icCls: 'r', title: 'Esci', sub: 'Su questo dispositivo', attrs: 'data-pa="logout"', cls: 'danger' })
    ]);
    return h;
  }
  function authHTML(reg) {
    return (view.x.why ? '<p class="kit-note" style="font-size:15px;color:var(--k-text)">' + esc(view.x.why) + '</p>' : '') +
      '<div class="kit-tabs" role="tablist"><button type="button" role="tab" class="' + (!reg ? 'on' : '') + '" data-pa="tab" data-v="login">Accedi</button><button type="button" role="tab" class="' + (reg ? 'on' : '') + '" data-pa="tab" data-v="register">Registrati</button></div>' +
      '<form class="kit-form" data-pa-form="' + (reg ? 'register' : 'login') + '" autocomplete="on"><label class="kit-field">Nome utente<input class="kit-input" type="text" name="u" maxlength="18" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" required></label>' +
      pwField('Password', 'p', reg ? 'new-password' : 'current-password', reg ? 'next' : 'go') +
      (reg ? pwField('Ripeti la password', 'p2', 'new-password', 'go') : '') + msgHTML() +
      '<button class="kit-btn block" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Un attimo…' : reg ? 'Crea account' : 'Accedi') + '</button></form>' +
      (reg ? '' : '<button type="button" class="kit-link" data-pa="go" data-v="recover">Password dimenticata?</button>') +
      '<p class="kit-note">' + (reg ? 'Nome da 3 a 18 caratteri tra lettere, numeri, punto e trattini; password di almeno 6. Niente email: subito dopo ricevi un <b>codice di recupero</b>, che serve se dimentichi la password.' : 'Con l’account ritrovi amici, inviti, statistiche e notifiche su tutti i tuoi dispositivi, e resti collegato finché non esci tu.') + '</p>' +
      (view.x.why ? '<button class="kit-btn sec block" data-pa="close" type="button">Non ora</button>' : '');
  }
  function recoverHTML() {
    return '<p class="kit-note">Scrivi il tuo nome utente, il <b>codice di recupero</b> che hai ricevuto quando hai creato l’account (12 caratteri, tipo ABCD-EFGH-JKLM) e la nuova password.</p>' +
      '<form class="kit-form" data-pa-form="recover" autocomplete="off"><label class="kit-field">Nome utente<input class="kit-input" type="text" name="u" maxlength="18" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>' +
      '<label class="kit-field">Codice di recupero<input class="kit-input" type="text" name="c" maxlength="20" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="ABCD-EFGH-JKLM" required></label>' +
      pwField('Nuova password', 'p', 'new-password', 'go') + msgHTML() +
      '<button class="kit-btn block" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Un attimo…' : 'Cambia password ed entra') + '</button></form>' +
      '<p class="kit-note">Non hai il codice? Se sei ancora collegato su un altro dispositivo, da lì puoi crearne uno nuovo (Impostazioni → Password e account) o cambiare la password. Altrimenti l’account non si può recuperare: creane uno nuovo.</p>';
  }
  function codeHTML() {
    return '<p>Se un giorno dimentichi la password, con questo codice ne scegli una nuova. <b>Lo vedi solo adesso</b>: scrivilo, copialo nelle note o fai uno screenshot.</p>' +
      '<div class="pa-code" data-code>' + esc(view.x.code) + '</div>' + msgHTML() +
      '<button class="kit-btn sec block" type="button" data-pa="copycode">Copia il codice</button>' +
      '<p class="kit-note">Vale una volta sola: quando lo usi ne ricevi uno nuovo.' + (view.x.fresh ? '' : ' Il codice di prima non vale più.') + '</p>' +
      '<button class="kit-btn block" type="button" data-pa="close">L’ho salvato</button>';
  }
  // Campo password con «Mostra»: sul telefono si sbaglia facilmente a scrivere alla cieca.
  function pwField(lab, name, auto, hint) {
    return '<label class="kit-field">' + lab + '<span class="pa-pw"><input class="kit-input" type="' + (showPw ? 'text' : 'password') + '" name="' + name + '" maxlength="72" autocomplete="' + auto + '" autocapitalize="none" autocorrect="off" spellcheck="false"' + (hint ? ' enterkeyhint="' + hint + '"' : '') + ' required>' +
      '<button type="button" class="pa-eye" data-pa="eye" aria-pressed="' + showPw + '" aria-label="' + (showPw ? 'Nascondi la password' : 'Mostra la password') + '">' + (showPw ? 'Nascondi' : 'Mostra') + '</button></span></label>';
  }
  function friendsHTML() {
    var d = friendsData, fr = d ? d.friends : null, inc = d ? d.incoming : [], out = d ? d.outgoing : [];
    var h = msgHTML() + '<form class="kit-inline" data-pa-form="friend"><input class="kit-input" type="text" name="f" maxlength="18" placeholder="Nome utente dell’amico" autocapitalize="none" spellcheck="false" aria-label="Nome utente dell’amico" required><button class="kit-btn" type="submit">Aggiungi</button></form>';
    if (inc.length) h += Kit.group('Richieste di amicizia', inc.map(function (n) {
      return Kit.row({ title: esc(n), sub: 'vuole essere tuo amico', right: '<button type="button" class="kit-btn sm" data-pa="accept" data-u="' + esc(n) + '">Accetta</button><button type="button" class="kit-btn sm sec" data-pa="decline" data-u="' + esc(n) + '">Rifiuta</button>' });
    }));
    if (fr == null) h += '<div class="kit-empty">Carico i tuoi amici…</div>';
    else if (!fr.length) h += '<div class="kit-empty">' + Kit.icon('users', 28) + '<b style="color:var(--k-text)">Nessun amico per ora</b>Aggiungili con il loro nome utente: potrete invitarvi ai tavoli con una notifica e confrontare le statistiche.</div>';
    else h += Kit.group('I tuoi amici', fr.map(function (f) {
      var j = joinHref(f);
      return '<div class="kit-row">' + Kit.avatar(f.username, 'sm') + '<span class="kit-rt"><b>' + esc(f.username) + '</b><small><span class="kit-dot' + (f.online ? ' on' : '') + '" style="display:inline-block;margin-right:6px;vertical-align:1px"></span>' + esc(friendLine(f)) + '</small></span>' +
        (j ? '<a class="kit-btn sm" href="' + esc(j) + '">' + (f.phase === 'lobby' ? 'Raggiungi' : 'Guarda') + '</a>' : '') +
        (view.x.unf === f.username ? '<button type="button" class="kit-btn sm danger" data-pa="unfriend" data-u="' + esc(f.username) + '">Togli</button>'
          : '<button type="button" class="kit-icbtn" data-pa="unfriend" data-u="' + esc(f.username) + '" aria-label="Togli ' + esc(f.username) + ' dagli amici" title="Togli dagli amici">' + Kit.icon('x', 16) + '</button>') + '</div>';
    }));
    if (out.length) h += '<p class="kit-note">In attesa di risposta: ' + out.map(esc).join(', ') + '</p>';
    return h;
  }
  function inviteListHTML() {
    var x = view.x, fr = friendsData ? friendsData.friends : null;
    var h = '<p class="kit-note">Gli arriva una notifica: toccandola si siede al tavolo <b style="color:var(--k-text)">' + esc(x.code) + '</b>.</p>' + msgHTML();
    if (fr == null) return h + '<div class="kit-empty">Carico i tuoi amici…</div>';
    if (!fr.length) return h + '<div class="kit-empty">' + Kit.icon('users', 28) + 'Non hai ancora amici nella lista.</div><button type="button" class="kit-btn sec block" data-pa="go" data-v="friends">Aggiungi amici</button>';
    return h + Kit.group('', fr.map(function (f) {
      var sent = inviteSent[x.code + ':' + f.username];
      return '<div class="kit-row">' + Kit.avatar(f.username, 'sm') + '<span class="kit-rt"><b>' + esc(f.username) + '</b><small><span class="kit-dot' + (f.online ? ' on' : '') + '" style="display:inline-block;margin-right:6px;vertical-align:1px"></span>' + esc(friendLine(f)) + '</small></span>' +
        '<button type="button" class="kit-btn sm' + (sent ? ' sec' : '') + '" data-pa="invite" data-u="' + esc(f.username) + '"' + (sent ? ' disabled' : '') + '>' + (sent ? 'Invitato' : 'Invita') + '</button></div>';
    })) + '<button type="button" class="kit-btn sec block" data-pa="go" data-v="friends">Aggiungi amici</button>';
  }
  function securityHTML() {
    var h = msgHTML();
    h += '<section class="kit-group"><h3 class="kit-gtitle">Dispositivi collegati</h3>';
    if (devices == null) h += '<div class="kit-empty">Carico…</div>';
    else if (devices.length) {
      h += '<div class="kit-list">' + devices.map(function (dv) { return Kit.row({ ic: 'phone', title: esc(dv.device), sub: dv.here ? 'Questo dispositivo' : 'Ultimo uso ' + ago(dv.used), right: dv.here ? '<span class="kit-pill ok">Qui</span>' : '' }); }).join('') + '</div>';
      h += devices.length > 1 ? '<button type="button" class="kit-btn sec" data-pa="others">Esci dagli altri dispositivi</button>' : '<p class="kit-note" style="padding:0 4px">Sei collegato solo da qui. L’accesso resta attivo finché non esci tu (o per 6 mesi senza usarlo).</p>';
    }
    h += '</section>';
    h += '<section class="kit-group" id="pa-rec"><h3 class="kit-gtitle">Codice di recupero</h3><form class="kit-form" data-pa-form="recovery"><p class="kit-note">' +
      (hasRecovery === false ? '<b style="color:var(--k-text)">Non hai ancora un codice di recupero.</b> Senza, se dimentichi la password l’account è perso. ' : 'Serve se dimentichi la password. ') +
      'Per crearne uno nuovo scrivi la tua password: il codice di prima, se c’era, non varrà più.</p>' + pwField('Password', 'r', 'current-password') + '<button class="kit-btn" type="submit">Crea il codice</button></form></section>';
    h += '<section class="kit-group"><h3 class="kit-gtitle">Cambia password</h3><form class="kit-form" data-pa-form="password">' + pwField('Password attuale', 'o', 'current-password') + pwField('Nuova password', 'n', 'new-password') +
      '<button class="kit-btn" type="submit">Cambia password</button><p class="kit-note">Gli altri dispositivi dovranno accedere di nuovo.</p></form></section>';
    h += '<section class="kit-group"><h3 class="kit-gtitle" style="color:var(--k-danger)">Cancella account</h3><form class="kit-form" data-pa-form="delete"><p class="kit-note">Cancelli account, amici, statistiche e notifiche. Non si può annullare.</p>' +
      pwField('Password', 'd', 'current-password') + '<button class="kit-btn danger" type="submit">Cancella per sempre</button></form></section>';
    return h;
  }
  function repaint() {
    document.querySelectorAll('[data-pa-chip]').forEach(function (e) { e.outerHTML = chipHTML(); });
    if (window.Alerts && Alerts.controlHTML) document.querySelectorAll('[data-k-alerts]').forEach(function (e) { e.outerHTML = Alerts.controlHTML(); });
  }
  // Pulsante con il profilo: apre le Impostazioni (compare nella home e nella lobby di ogni gioco).
  function chipHTML() {
    css();
    var u = user(), n = incoming(), name = u ? u.username : myNick();
    var label = u ? esc(u.username) : configured() ? 'Accedi' : name ? esc(name) : 'Impostazioni';
    return '<span data-pa-chip style="display:inline-flex;max-width:100%"><button type="button" class="kit-me" data-pa="open" data-v="' + (u || !configured() ? 'settings' : 'login') + '" aria-label="Profilo e impostazioni">' +
      Kit.avatar(u ? u.username : name, 'sm') + '<span>' + label + '</span>' + (n ? '<span class="kit-badge" title="Richieste di amicizia">' + n + '</span>' : '') + Kit.icon('gear', 17) + '</button></span>';
  }
  function inviteHTML() {
    if (!user()) return '';
    return '<button type="button" class="kit-me" style="padding-left:12px" data-pa="openinvite">' + Kit.icon('mail', 17) + '<span>Invita un amico</span></button>';
  }
  // Prima di sedersi a un tavolo: con il server attivo serve l'account.
  function allow() {
    if (!configured() || user()) return true;
    open('login', { why: 'Per giocare serve un account: è gratis, basta un nome utente e una password.', intent: intent() });
    return false;
  }
  function allowQuiet() { return !configured() || !!user(); }
  function gameId() { var h = A.here; return h ? h.path.replace(/\/$/, '') : null; }

  /* ---------- eventi ---------- */
  document.addEventListener('click', function (e) {
    var b = e.target.closest('[data-pa]'); if (!b || b.disabled) return;
    var k = b.getAttribute('data-pa'), uname = b.getAttribute('data-u');
    if (k === 'open') { e.preventDefault(); open(b.getAttribute('data-v')); }
    else if (k === 'close') close();
    else if (k === 'tab' || k === 'go') go(b.getAttribute('data-v'));
    else if (k === 'install') { close(); if (window.PWA && PWA.install) PWA.install(); }
    else if (k === 'eye') { e.preventDefault(); showPw = !showPw; render(); }
    else if (k === 'copycode') { var cc = view && view.x.code; try { navigator.clipboard.writeText(cc).then(function () { msg = { ok: true, t: 'Codice copiato: incollalo in un posto sicuro (le note del telefono vanno bene).' }; render(); }, function () { msg = { t: 'Tieni premuto sul codice per copiarlo.' }; render(); }); } catch (er) { msg = { t: 'Tieni premuto sul codice per copiarlo.' }; render(); } }
    else if (k === 'rec') { go('security'); setTimeout(function () { var r = document.getElementById('pa-rec'); if (r) r.scrollIntoView({ block: 'start' }); }, 50); }
    else if (k === 'others') {
      b.disabled = true;
      rpc('logout_others', { p_token: session.token, p_keep_endpoint: (window.Alerts && Alerts.endpoint && Alerts.endpoint()) || null }).then(function (n) { msg = { ok: true, t: n ? 'Fatto: gli altri dispositivi dovranno accedere di nuovo.' : 'Non c’erano altri dispositivi collegati.' }; loadDevices(); render(); }, function (er) { msg = { t: String(er) }; render(); });
    }
    else if (k === 'board') { boardGame = b.getAttribute('data-g') || ''; rpc('friends_board', { p_token: session.token, p_game: boardGame || null }).then(function (r) { boardData = r; render(); }, function (er) { msg = { t: String(er) }; render(); }); render(); }
    else if (k === 'openinvite') { var code = window.Net && Net.tableCode; if (!code) return; open('invite', { code: code, game: gameId() }); }
    else if (k === 'invite') {
      b.disabled = true;
      // tavolo privato («Invita amico»): ogni amico invitato riceve il suo invito personale
      var priv = window.App && App.doc && App.doc.vis === 'direct' && window.Net && Net.newInvite;
      (priv ? Net.newInvite() : Promise.resolve(null)).then(function (inv) {
        return notify({ kind: 'invite', to: uname, game: view.x.game, code: view.x.code, k: inv ? inv.key : undefined }).then(function (r) { return { r: r, inv: inv }; });
      }).then(function (x) { inviteSent[view.x.code + ':' + uname] = 1; msg = { ok: true, t: x.r.sent ? 'Invito mandato a ' + uname + '.' : uname + ' non ha le notifiche attive: ' + (x.inv ? 'mandagli questo link personale: ' + x.inv.link : 'mandagli il codice ' + view.x.code + '.') }; render(); },
        function (er) { msg = { t: String(er) }; render(); });
    }
    else if (k === 'accept') addFriend(uname).catch(function (er) { msg = { t: String(er) }; render(); });
    else if (k === 'decline') rpc('friend_respond', { p_token: session.token, p_username: uname, p_accept: false }).then(function () { return refreshFriends(); }).catch(function (er) { msg = { t: String(er) }; render(); });
    else if (k === 'unfriend') {   // doppio tocco: il primo chiede conferma nella riga stessa
      if (view.x.unf !== uname) { view.x.unf = uname; render(); return; }
      view.x.unf = null; rpc('friend_remove', { p_token: session.token, p_username: uname }).then(function () { msg = { ok: true, t: uname + ' non è più nei tuoi amici.' }; return refreshFriends(); }).catch(function (er) { msg = { t: String(er) }; render(); }); }
    else if (k === 'logout') logout();
  });
  document.addEventListener('change', function (e) {
    var t = e.target; if (!t.getAttribute) return;
    if (t.hasAttribute('data-pa-nick')) {   // nome al tavolo: vale per tutti i giochi
      var n = t.value.trim().slice(0, 18); if (!n) { t.value = myNick(); return; }
      set('pp-nick', n); document.querySelectorAll('input#nick').forEach(function (i) { i.value = n; }); repaint(); toastMsg('Nome salvato: ' + n);
    }
    if (t.id === 'kit-theme-pick') { Kit.setTheme(t.value); return; }
    var s = t.getAttribute('data-pa-snd');
    if (s && window.Sound) { if (s === 'm') Sound.setMusic(t.checked); else Sound.setSfx(t.checked); }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Enter' && e.target.hasAttribute && e.target.hasAttribute('data-pa-nick')) e.target.blur(); });
  document.addEventListener('submit', function (e) {
    var f = e.target.closest('[data-pa-form]'); if (!f) return;
    e.preventDefault(); var k = f.getAttribute('data-pa-form'), v = function (n) { var i = f.querySelector('[name="' + n + '"]'); return i ? i.value : ''; };
    if (k === 'login' || k === 'register') {
      if (k === 'register' && v('p') !== v('p2')) { msg = { t: 'Le due password non coincidono.' }; render(); return; }
      busy = true; msg = null; render();
      login(v('u').trim(), v('p'), k === 'register').catch(function (er) { msg = { t: String(er) }; }).then(function () { busy = false; render(); });
    } else if (k === 'recover') {
      busy = true; msg = null; render();
      recover(v('u').trim(), v('c').trim(), v('p')).catch(function (er) { msg = { t: String(er) }; }).then(function () { busy = false; render(); });
    } else if (k === 'recovery') {
      rpc('new_recovery', { p_token: session.token, p_password: v('r') }).then(function (r) { hasRecovery = true; view = { v: 'code', x: { code: r.recovery } }; msg = null; render(); }, function (er) { msg = { t: String(er) }; render(); });
    } else if (k === 'friend') {
      addFriend(v('f').trim()).then(function () { var i = document.querySelector('[data-pa-form="friend"] [name="f"]'); if (i) i.value = ''; }, function (er) { msg = { t: String(er) }; render(); });
    } else if (k === 'password') {
      rpc('change_password', { p_token: session.token, p_old: v('o'), p_new: v('n') }).then(function () { f.reset(); msg = { ok: true, t: 'Password cambiata. Gli altri dispositivi dovranno accedere di nuovo.' }; render(); }, function (er) { msg = { t: String(er) }; render(); });
    } else if (k === 'delete') {
      var s = session;
      (window.Alerts && Alerts.forget ? Alerts.forget() : Promise.resolve()).catch(function () {}).then(function () { return rpc('delete_account', { p_token: s.token, p_password: v('d') }); })
        .then(function () { setSession(null); close(); toastMsg('Account cancellato.'); reloadSoon(); }, function (er) { msg = { t: String(er) }; render(); });
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && view) close(); });
  // link dalle notifiche: ?amici=1 apre la lista degli amici
  if (/[?&]amici=1/.test(location.search)) ready.then(function () { if (user()) open('friends'); });
  ready.then(resume);

  load();
  return { ready: ready, configured: configured, user: user, open: open, close: close, allow: allow, allowQuiet: allowQuiet, chipHTML: chipHTML, inviteHTML: inviteHTML,
    rpc: rpc, notify: notify, refreshFriends: refreshFriends, refreshFriendsSoon: refreshFriendsSoon, friend: friend, presence: function () { presenceTick(true); }, gameName: gameName, toast: toastMsg, get config() { return cfg; }, get token() { return session && session.token; }, render: render };
})();
