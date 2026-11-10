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
      if (m && typeof m.recovery === 'boolean') { hasRecovery = m.recovery; if (view && view.v === 'account') render(); }
      refreshFriends(true);
    }, function () {});
  }
  // Accesso o uscita fatti in un'altra scheda (o in un altro gioco aperto): questa pagina si adegua da sola.
  window.addEventListener('storage', function (e) {
    if (e.key !== 'pp-session') return;
    var was = session && session.token; session = jget('pp-session');
    if ((session && session.token) === was) return;
    friendsData = null; hasRecovery = null; devices = null; presSig = null;
    repaint(); paintLists(); if (view) { if (!session && view.v !== 'login' && view.v !== 'register' && view.v !== 'recover') close(); else render(); }
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
    rpc('my_sessions', { p_token: session.token }).then(function (l) { devices = Array.isArray(l) ? l : []; if (view && view.v === 'account') render(); }, function () { devices = []; });
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
      .then(function (d) { friendsData = d; repaint(); paintLists(); if (view && (view.v === 'account' || view.v === 'invite')) render(); }, function () { presSig = null; })
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
    var h = '<h2>Statistiche</h2>' + msgHTML();
    if (!statsData) return h + '<p class="pa-note">Carico…</p><button class="pa-btn g" data-pa="go" data-v="account">Indietro</button>';
    var gs = statsData.games, tp = 0, tw = 0; gs.forEach(function (x) { tp += x.played; tw += x.won; });
    h += '<h3>Le tue partite</h3>';
    h += gs.length ? '<div class="pa-list">' + gs.map(function (x) { return '<div class="pa-row"><b>' + esc(gameName(x.game)) + '</b><span class="pa-num">' + x.won + ' vinte su ' + x.played + '</span><span class="pa-pct">' + Math.round(100 * x.won / Math.max(1, x.played)) + '%</span></div>'; }).join('') +
      '<div class="pa-row pa-tot"><b>Totale</b><span class="pa-num">' + tw + ' vinte su ' + tp + '</span><span class="pa-pct">' + Math.round(100 * tw / Math.max(1, tp)) + '%</span></div></div>'
      : '<p class="pa-note">Ancora nessuna partita registrata: si contano quelle finite da quando hai l’account (non le partite di prova).</p>';
    h += '<h3>Classifica tra amici</h3><div class="pa-bar pa-filter"><button type="button" class="pa-btn s' + (boardGame ? ' g' : '') + '" data-pa="board" data-g="">Tutti i giochi</button>' +
      (A.GAMES || []).map(function (g) { var id = g.path.replace(/\/$/, ''); return '<button type="button" class="pa-btn s' + (boardGame === id ? '' : ' g') + '" data-pa="board" data-g="' + id + '">' + esc(g.n) + '</button>'; }).join('') + '</div>';
    h += boardData && boardData.length ? '<div class="pa-list">' + boardData.map(function (r, i) { return '<div class="pa-row' + (r.me ? ' pa-me' : '') + '"><span class="pa-pos">' + (i + 1) + '</span><b>' + esc(r.username) + (r.me ? ' (tu)' : '') + '</b><span class="pa-num">' + r.won + ' vinte · ' + r.played + ' giocate</span></div>'; }).join('') + '</div>' : '<p class="pa-note">Nessun risultato.</p>';
    if (statsData.recent.length) h += '<h3>Ultime partite</h3><div class="pa-list">' + statsData.recent.map(function (x) {
      var d = new Date(x.at), when = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return '<div class="pa-row"><span class="pa-res">' + (x.won ? '🏆' : '·') + '</span><span style="flex:1;min-width:0"><b>' + esc(gameName(x.game)) + '</b> · ' + (x.won ? 'vinta' : x.place ? x.place + 'º posto' : 'persa') + (x.score != null ? ' · ' + x.score + ' punti' : '') +
        '<br><span class="pa-note">' + when + (x.rivals && x.rivals.length ? ' · con ' + x.rivals.map(esc).join(', ') : '') + '</span></span></div>';
    }).join('') + '</div>';
    return h + '<button class="pa-btn g" data-pa="go" data-v="account">Indietro</button>';
  }
  function incoming() { return friendsData && friendsData.incoming ? friendsData.incoming.length : 0; }
  function addFriend(name) {
    return notify({ kind: 'friend', to: name }).then(function (r) {
      var t = r.state === 'accepted' ? 'Tu e ' + r.to + ' ora siete amici.' : r.state === 'already' ? 'Tu e ' + r.to + ' siete già amici.' : r.state === 'pending' ? 'Hai già chiesto l’amicizia a ' + r.to + ': aspetta che accetti.' : 'Richiesta inviata a ' + r.to + '.';
      msg = { ok: true, t: t }; return refreshFriends();
    });
  }

  /* ---------- grafica ---------- */
  var CSS = '.pa-back{position:fixed;inset:0;z-index:95;background:rgba(5,8,12,.62);display:flex;align-items:flex-end;justify-content:center;animation:pafade .2s}' +
    '@keyframes pafade{from{opacity:0}}@keyframes paup{from{transform:translateY(24px);opacity:0}}' +
    '.pa-sheet{width:100%;max-width:520px;max-height:calc(92vh - env(safe-area-inset-top,0px));overflow-y:auto;background:#1b2128;color:#f1ece2;border:1px solid rgba(255,255,255,.12);border-bottom:0;border-radius:18px 18px 0 0;padding:18px max(18px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));display:grid;gap:12px;font:16px/1.45 system-ui,-apple-system,"Segoe UI",sans-serif;box-shadow:0 -10px 30px rgba(0,0,0,.5);animation:paup .25s cubic-bezier(.2,.8,.2,1)}' +
    '@media(min-width:640px){.pa-back{align-items:center}.pa-sheet{border-radius:18px;border-bottom:1px solid rgba(255,255,255,.12)}}' +
    '.pa-sheet h2{margin:0;font-size:22px}.pa-sheet h3{margin:6px 0 0;font-size:13px;letter-spacing:.12em;text-transform:uppercase;color:#e6c56f}.pa-sheet p{margin:0}.pa-note{font-size:13.5px;color:#b9b3a6}' +
    '.pa-tabs{display:flex;gap:6px;background:rgba(255,255,255,.06);padding:4px;border-radius:12px}.pa-tabs button{flex:1;appearance:none;border:0;background:none;color:inherit;font:600 15px inherit;padding:9px;border-radius:9px;cursor:pointer}.pa-tabs button.on{background:#e6c56f;color:#231a06}' +
    '.pa-sheet form{display:grid;gap:10px}.pa-sheet label{display:grid;gap:4px;font-size:14px;color:#cfc8ba}.pa-sheet input[type=text],.pa-sheet input[type=password]{font:16px system-ui,sans-serif;padding:11px 13px;border-radius:10px;border:1px solid rgba(255,255,255,.18);background:#f3ecdc;color:#1c1813;min-height:44px}' +
    '.pa-btn{appearance:none;border:0;border-radius:10px;min-height:44px;padding:10px 16px;font:700 15.5px system-ui,sans-serif;background:linear-gradient(180deg,#f0d58f,#d9b45a);color:#231a06;cursor:pointer}.pa-btn:disabled{opacity:.5}' +
    '.pa-btn.g{background:rgba(255,255,255,.08);color:inherit;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.pa-btn.s{min-height:34px;padding:6px 11px;font-size:14px}.pa-btn.r{background:#b6402e;color:#fff}' +
    '.pa-err{color:#ff9b86;font-size:14.5px}.pa-ok{color:#9fdc95;font-size:14.5px}' +
    '.pa-list{display:grid;gap:6px}.pa-row{display:flex;gap:8px;align-items:center;padding:8px 10px;border-radius:10px;background:rgba(255,255,255,.05)}.pa-row b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}' +
    '.pa-dot{width:9px;height:9px;border-radius:50%;background:#8a9097;flex:none}.pa-dot.on{background:#43d17c}' +
    '.pa-row a.pa-btn{text-decoration:none;display:inline-flex;align-items:center}.pa-num{font-size:13.5px;color:#cfc8ba;white-space:nowrap}.pa-pct{min-width:42px;text-align:right;font-weight:700;color:#e6c56f}' +
    '.pa-tot{background:rgba(230,197,111,.1)}.pa-me{box-shadow:inset 0 0 0 1px rgba(230,197,111,.6)}.pa-pos{width:22px;text-align:center;font-weight:800;color:#e6c56f}.pa-res{width:22px;text-align:center}.pa-filter{gap:6px}' +
    '.pa-chip{appearance:none;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(230,197,111,.45);background:rgba(230,197,111,.1);color:inherit;border-radius:999px;padding:6px 12px;font:600 14px system-ui,sans-serif;cursor:pointer;position:relative}' +
    '.pa-chip .n{background:#c4301f;color:#fff;border-radius:999px;font-size:11px;padding:0 6px;font-weight:800}.pa-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.pa-check{display:flex!important;flex-direction:row!important;gap:10px!important;align-items:center;font-size:15px!important;color:inherit!important;padding:4px 0}.pa-check input{width:20px;height:20px;accent-color:#e6c56f;flex:none}' +
    '.pa-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:2px 10px}.pa-sep{border:0;border-top:1px solid rgba(255,255,255,.1);margin:4px 0}' +
    '.pa-pw{position:relative;display:block}.pa-pw input{width:100%;box-sizing:border-box;padding-right:52px!important}.pa-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);appearance:none;border:0;background:none;color:#4a4136;font:600 13px system-ui,sans-serif;min-width:44px;min-height:40px;cursor:pointer;border-radius:8px}' +
    '.pa-code{font:700 24px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-align:center;padding:14px 10px;border-radius:12px;background:#0e1216;border:1px dashed rgba(230,197,111,.7);color:#f6e3a8;user-select:all;-webkit-user-select:all;overflow-wrap:anywhere}' +
    '.pa-warn{padding:10px 12px;border-radius:10px;background:rgba(230,150,60,.14);border:1px solid rgba(230,150,60,.5);font-size:14.5px;display:grid;gap:8px}.pa-link{appearance:none;border:0;background:none;color:#e6c56f;font:600 14.5px system-ui,sans-serif;text-decoration:underline;padding:6px 0;cursor:pointer;justify-self:start}' +
    '.pa-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:99;background:#1b2128;color:#f1ece2;border:1px solid rgba(230,197,111,.5);padding:10px 14px;border-radius:12px;font:15px system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.5);max-width:min(92vw,460px)}';
  function css() { if (!document.getElementById('pa-css')) { var s = document.createElement('style'); s.id = 'pa-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function toastMsg(t) { css(); var d = document.createElement('div'); d.className = 'pa-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3200); }
  function close() {
    var m = document.querySelector('.pa-back'); if (m) m.remove(); view = null; msg = null; showPw = false;
    if (reloadOnClose) { reloadOnClose = false; reloadSoon(); }   // appena entrati: ora che il codice di recupero è stato visto, si riparte con l'account
  }
  function open(v, extra) {
    css(); view = { v: v || (user() ? 'account' : 'login'), x: extra || {} }; msg = null;
    if (view.v !== 'login' && view.v !== 'register' && view.v !== 'recover' && !user()) view = { v: 'login', x: { why: extra && extra.why } };
    render();
    if (user() && (view.v === 'account' || view.v === 'invite')) refreshFriends().catch(function () {});
    if (user() && view.v === 'account') { devices = null; loadDevices(); }
    if (user() && view.v === 'stats') { statsData = null; loadStats(); }
  }
  function render() {
    if (!view) return;
    var html = body(), back = document.querySelector('.pa-back');
    if (!back) { back = document.createElement('div'); back.className = 'pa-back'; back.addEventListener('click', function (e) { if (e.target === back) close(); }); document.body.appendChild(back); }
    var focused = document.activeElement && document.activeElement.name, vals = {};
    back.querySelectorAll('input[type=text],input[type=password]').forEach(function (i) { if (i.name) vals[i.name] = i.value; });
    back.innerHTML = '<div class="pa-sheet" role="dialog" aria-modal="true">' + html + '</div>';
    back.querySelectorAll('input[type=text],input[type=password]').forEach(function (i) { if (i.name && vals[i.name] != null) i.value = vals[i.name]; });
    var f = focused && back.querySelector('[name="' + focused + '"]'); if (f) f.focus();
  }
  function msgHTML() { return msg ? '<p class="' + (msg.ok ? 'pa-ok' : 'pa-err') + '" role="status">' + esc(msg.t) + '</p>' : ''; }
  function body() {
    var v = view.v, u = user();
    if (!configured()) return '<h2>Account</h2><p>Il server dei giocatori non è ancora attivo: puoi continuare a giocare come sempre.</p><button class="pa-btn g" data-pa="close">Chiudi</button>';
    if (v === 'login' || v === 'register') {
      var reg = v === 'register';
      return '<h2>' + (reg ? 'Crea il tuo account' : 'Entra in Board Games') + '</h2>' + (view.x.why ? '<p>' + esc(view.x.why) + '</p>' : '') +
        '<div class="pa-tabs" role="tablist"><button type="button" class="' + (!reg ? 'on' : '') + '" data-pa="tab" data-v="login">Accedi</button><button type="button" class="' + (reg ? 'on' : '') + '" data-pa="tab" data-v="register">Registrati</button></div>' +
        '<form data-pa-form="' + v + '" autocomplete="on"><label>Nome utente<input type="text" name="u" maxlength="18" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" enterkeyhint="next" required></label>' +
        pwField('Password', 'p', reg ? 'new-password' : 'current-password', reg ? 'next' : 'go') +
        (reg ? pwField('Ripeti la password', 'p2', 'new-password', 'go') : '') + msgHTML() +
        '<button class="pa-btn" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Un attimo…' : reg ? 'Crea account' : 'Accedi') + '</button></form>' +
        (reg ? '' : '<button type="button" class="pa-link" data-pa="go" data-v="recover">Password dimenticata?</button>') +
        '<p class="pa-note">' + (reg ? 'Nome da 3 a 18 caratteri tra lettere, numeri, punto e trattini; password di almeno 6. Niente email: subito dopo ricevi un <b>codice di recupero</b>, che serve se dimentichi la password.' : 'Con l’account ritrovi amici, inviti e notifiche su tutti i tuoi dispositivi, e resti collegato finché non esci tu.') + '</p>' +
        '<button class="pa-btn g" data-pa="close" type="button">' + (view.x.why ? 'Non ora' : 'Chiudi') + '</button>';
    }
    if (v === 'recover') {
      return '<h2>Password dimenticata</h2><p class="pa-note">Scrivi il tuo nome utente, il <b>codice di recupero</b> che hai ricevuto quando hai creato l’account (12 caratteri, tipo ABCD-EFGH-JKLM) e la nuova password.</p>' +
        '<form data-pa-form="recover" autocomplete="off"><label>Nome utente<input type="text" name="u" maxlength="18" autocomplete="username" autocapitalize="none" autocorrect="off" spellcheck="false" required></label>' +
        '<label>Codice di recupero<input type="text" name="c" maxlength="20" autocomplete="off" autocapitalize="characters" autocorrect="off" spellcheck="false" placeholder="ABCD-EFGH-JKLM" required></label>' +
        pwField('Nuova password', 'p', 'new-password', 'go') + msgHTML() +
        '<button class="pa-btn" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Un attimo…' : 'Cambia password ed entra') + '</button></form>' +
        '<p class="pa-note">Non hai il codice? Se sei ancora collegato su un altro dispositivo, da lì puoi crearne uno nuovo (👤 → Codice di recupero) o cambiare la password. Altrimenti l’account non si può recuperare: creane uno nuovo.</p>' +
        '<button class="pa-btn g" data-pa="go" data-v="login" type="button">Torna all’accesso</button>';
    }
    if (v === 'code') {
      return '<h2>Il tuo codice di recupero</h2><p>Se un giorno dimentichi la password, con questo codice ne scegli una nuova. <b>Lo vedi solo adesso</b>: scrivilo, copialo nelle note o fai uno screenshot.</p>' +
        '<div class="pa-code" data-code>' + esc(view.x.code) + '</div>' + msgHTML() +
        '<button class="pa-btn g" type="button" data-pa="copycode">Copia il codice</button>' +
        '<p class="pa-note">Vale una volta sola: quando lo usi ne ricevi uno nuovo.' + (view.x.fresh ? '' : ' Il codice di prima non vale più.') + '</p>' +
        '<button class="pa-btn" type="button" data-pa="close">L’ho salvato</button>';
    }
    if (!u) return '';
    if (v === 'stats') return statsHTML();
    if (v === 'invite') {
      var x = view.x, fr = friendsData ? friendsData.friends : null;
      return '<h2>Invita un amico</h2><p class="pa-note">Gli arriva una notifica: toccandola si siede al tavolo <b>' + esc(x.code) + '</b>.</p>' + msgHTML() +
        (fr == null ? '<p class="pa-note">Carico i tuoi amici…</p>' : fr.length ? '<div class="pa-list">' + fr.map(function (f) {
          var k = x.code + ':' + f.username, sent = inviteSent[k];
          return '<div class="pa-row"><span class="pa-dot' + (f.online ? ' on' : '') + '" title="' + (f.online ? 'Collegato' : 'Non in linea') + '"></span><span style="flex:1;min-width:0"><b>' + esc(f.username) + '</b><br><span class="pa-note">' + esc(friendLine(f)) + '</span></span><button class="pa-btn s' + (sent ? ' g' : '') + '" data-pa="invite" data-u="' + esc(f.username) + '"' + (sent ? ' disabled' : '') + '>' + (sent ? 'Invitato ✓' : 'Invita') + '</button></div>';
        }).join('') + '</div>' : '<p>Non hai ancora amici nella lista.</p>') +
        '<button class="pa-btn g" data-pa="go" data-v="account">Aggiungi amici</button><button class="pa-btn g" data-pa="close">Chiudi</button>';
    }
    // account
    var d = friendsData, fr2 = d ? d.friends : [], inc = d ? d.incoming : [], out = d ? d.outgoing : [];
    var h = '<h2>Ciao, ' + esc(u.username) + '</h2>' + msgHTML();
    if (hasRecovery === false && !view.x.rec) h += '<div class="pa-warn"><span><b>Non hai ancora un codice di recupero.</b> Senza, se dimentichi la password l’account è perso (amici e statistiche compresi).</span><button class="pa-btn s" type="button" data-pa="rec">Crea il codice di recupero</button></div>';
    h += '<h3>Notifiche</h3>' + (window.Alerts && Alerts.settingsHTML ? Alerts.settingsHTML() : '');
    h += '<hr class="pa-sep"><h3>Amici</h3>';
    if (inc.length) h += '<div class="pa-list">' + inc.map(function (n) { return '<div class="pa-row"><b>' + esc(n) + ' vuole essere tuo amico</b><button class="pa-btn s" data-pa="accept" data-u="' + esc(n) + '">Accetta</button><button class="pa-btn s g" data-pa="decline" data-u="' + esc(n) + '">No</button></div>'; }).join('') + '</div>';
    h += d == null ? '<p class="pa-note">Carico…</p>' : fr2.length ? '<div class="pa-list">' + fr2.map(function (f) { var j = joinHref(f); return '<div class="pa-row"><span class="pa-dot' + (f.online ? ' on' : '') + '"></span><span style="flex:1;min-width:0"><b>' + esc(f.username) + '</b><br><span class="pa-note">' + esc(friendLine(f)) + '</span></span>' + (j ? '<a class="pa-btn s" href="' + esc(j) + '">' + (f.phase === 'lobby' ? 'Raggiungi' : 'Guarda') + '</a>' : '') + '<button class="pa-btn s g" data-pa="unfriend" data-u="' + esc(f.username) + '" aria-label="Togli ' + esc(f.username) + ' dagli amici">×</button></div>'; }).join('') + '</div>' : '<p class="pa-note">Nessun amico per ora. Aggiungili con il loro nome utente: potrete invitarvi ai tavoli con una notifica.</p>';
    if (out.length) h += '<p class="pa-note">In attesa di risposta: ' + out.map(esc).join(', ') + '</p>';
    h += '<form data-pa-form="friend" class="pa-bar"><input type="text" name="f" maxlength="18" placeholder="Nome utente dell’amico" autocapitalize="none" spellcheck="false" style="flex:1;min-width:170px" required><button class="pa-btn s" type="submit">Aggiungi</button></form>';
    h += '<hr class="pa-sep"><h3>Partite</h3><div class="pa-bar"><button class="pa-btn s" data-pa="go" data-v="stats">📊 Statistiche e classifica tra amici</button></div>';
    h += '<hr class="pa-sep"><h3>Account</h3>';
    if (devices && devices.length) {
      h += '<div class="pa-list">' + devices.map(function (dv) { return '<div class="pa-row"><span class="pa-dot' + (dv.here ? ' on' : '') + '"></span><span style="flex:1;min-width:0"><b>' + esc(dv.device) + '</b><br><span class="pa-note">' + (dv.here ? 'questo dispositivo' : 'ultimo uso ' + ago(dv.used)) + '</span></span></div>'; }).join('') + '</div>';
      h += devices.length > 1 ? '<div class="pa-bar"><button class="pa-btn s g" data-pa="others">Esci dagli altri dispositivi</button></div>' : '<p class="pa-note">Sei collegato solo da qui. L’accesso resta attivo finché non esci tu (o per 6 mesi senza usarlo).</p>';
    }
    if (view.x.pw) h += '<form data-pa-form="password">' + pwField('Password attuale', 'o', 'current-password') + pwField('Nuova password', 'n', 'new-password') + '<button class="pa-btn s" type="submit">Cambia password</button></form>';
    if (view.x.rec) h += '<form data-pa-form="recovery"><p>Per creare un nuovo codice di recupero scrivi la tua password. Il codice di prima, se c’era, non varrà più.</p>' + pwField('Password', 'r', 'current-password') + '<button class="pa-btn s" type="submit">Crea il codice</button></form>';
    if (view.x.del) h += '<form data-pa-form="delete"><p>Cancelli account, amici e notifiche. Non si può annullare.</p>' + pwField('Password', 'd', 'current-password') + '<button class="pa-btn s r" type="submit">Cancella per sempre</button></form>';
    h += '<div class="pa-bar">' + (view.x.pw ? '' : '<button class="pa-btn s g" data-pa="pw">Cambia password</button>') + (view.x.rec ? '' : '<button class="pa-btn s g" data-pa="rec">Codice di recupero</button>') + '<button class="pa-btn s g" data-pa="logout">Esci</button>' + (view.x.del ? '' : '<button class="pa-btn s g" data-pa="del">Cancella account</button>') + '</div>';
    return h + '<button class="pa-btn g" data-pa="close">Chiudi</button>';
  }
  // Campo password con «Mostra»: sul telefono si sbaglia facilmente a scrivere alla cieca.
  function pwField(lab, name, auto, hint) {
    return '<label>' + lab + '<span class="pa-pw"><input type="' + (showPw ? 'text' : 'password') + '" name="' + name + '" maxlength="72" autocomplete="' + auto + '" autocapitalize="none" autocorrect="off" spellcheck="false"' + (hint ? ' enterkeyhint="' + hint + '"' : '') + ' required>' +
      '<button type="button" class="pa-eye" data-pa="eye" aria-pressed="' + showPw + '" aria-label="' + (showPw ? 'Nascondi la password' : 'Mostra la password') + '">' + (showPw ? 'Nascondi' : 'Mostra') + '</button></span></label>';
  }
  function repaint() {
    document.querySelectorAll('[data-pa-chip]').forEach(function (e) { e.outerHTML = chipHTML(); });
    if (window.Alerts && Alerts.controlHTML) document.querySelectorAll('.ppa-ctl').forEach(function (e) { e.outerHTML = Alerts.controlHTML(); });
  }
  function chipHTML() {
    css(); if (!configured()) return '<span data-pa-chip hidden></span>';
    var u = user();
    if (!u) return '<span data-pa-chip class="pa-bar"><button type="button" class="pa-chip" data-pa="open" data-v="login">👤 Accedi o registrati</button></span>';
    var n = incoming();
    return '<span data-pa-chip class="pa-bar"><button type="button" class="pa-chip" data-pa="open" data-v="account">👤 ' + esc(u.username) + (n ? ' <span class="n" title="Richieste di amicizia">' + n + '</span>' : '') + '</button></span>';
  }
  function inviteHTML() {
    if (!user()) return '';
    return '<button type="button" class="pa-chip" data-pa="openinvite">✉ Invita un amico</button>';
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
    else if (k === 'eye') { e.preventDefault(); showPw = !showPw; render(); }
    else if (k === 'copycode') { var cc = view && view.x.code; try { navigator.clipboard.writeText(cc).then(function () { msg = { ok: true, t: 'Codice copiato: incollalo in un posto sicuro (le note del telefono vanno bene).' }; render(); }, function () { msg = { t: 'Tieni premuto sul codice per copiarlo.' }; render(); }); } catch (er) { msg = { t: 'Tieni premuto sul codice per copiarlo.' }; render(); } }
    else if (k === 'rec') { view.x.rec = true; render(); }
    else if (k === 'others') {
      b.disabled = true;
      rpc('logout_others', { p_token: session.token, p_keep_endpoint: (window.Alerts && Alerts.endpoint && Alerts.endpoint()) || null }).then(function (n) { msg = { ok: true, t: n ? 'Fatto: gli altri dispositivi dovranno accedere di nuovo.' : 'Non c’erano altri dispositivi collegati.' }; loadDevices(); render(); }, function (er) { msg = { t: String(er) }; render(); });
    }
    else if (k === 'tab' || k === 'go') { var keepX = view && view.x && (view.x.why || view.x.intent) && /^(login|register|recover)$/.test(b.getAttribute('data-v')) ? { why: view.x.why, intent: view.x.intent } : {}; view = { v: b.getAttribute('data-v'), x: keepX }; msg = null; render(); if (view.v === 'account') refreshFriends().catch(function () {}); if (view.v === 'stats') { statsData = null; loadStats(); } }
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
    else if (k === 'unfriend') rpc('friend_remove', { p_token: session.token, p_username: uname }).then(function () { msg = { ok: true, t: uname + ' non è più nei tuoi amici.' }; return refreshFriends(); }).catch(function (er) { msg = { t: String(er) }; render(); });
    else if (k === 'pw') { view.x.pw = true; render(); }
    else if (k === 'del') { view.x.del = true; render(); }
    else if (k === 'logout') logout();
  });
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
      addFriend(v('f').trim()).then(function () { var i = document.querySelector('[name="f"]'); if (i) i.value = ''; }, function (er) { msg = { t: String(er) }; render(); });
    } else if (k === 'password') {
      rpc('change_password', { p_token: session.token, p_old: v('o'), p_new: v('n') }).then(function () { view.x.pw = false; msg = { ok: true, t: 'Password cambiata. Gli altri dispositivi dovranno accedere di nuovo.' }; render(); }, function (er) { msg = { t: String(er) }; render(); });
    } else if (k === 'delete') {
      var s = session;
      (window.Alerts && Alerts.forget ? Alerts.forget() : Promise.resolve()).catch(function () {}).then(function () { return rpc('delete_account', { p_token: s.token, p_password: v('d') }); })
        .then(function () { setSession(null); close(); toastMsg('Account cancellato.'); reloadSoon(); }, function (er) { msg = { t: String(er) }; render(); });
    }
  });
  document.addEventListener('keydown', function (e) { if (e.key === 'Escape' && view) close(); });
  // link dalle notifiche: ?amici=1 apre la lista degli amici
  if (/[?&]amici=1/.test(location.search)) ready.then(function () { if (user()) open('account'); });
  ready.then(resume);

  load();
  return { ready: ready, configured: configured, user: user, open: open, close: close, allow: allow, allowQuiet: allowQuiet, chipHTML: chipHTML, inviteHTML: inviteHTML,
    rpc: rpc, notify: notify, refreshFriends: refreshFriends, refreshFriendsSoon: refreshFriendsSoon, friend: friend, presence: function () { presenceTick(true); }, gameName: gameName, toast: toastMsg, get config() { return cfg; }, get token() { return session && session.token; }, render: render };
})();
