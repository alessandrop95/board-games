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
    h += '<section class="pa-sec">' + secHead('chart', 'Le tue partite');
    h += gs.length ? '<div class="pa-list">' + gs.map(function (x) { return '<div class="pa-row"><b>' + esc(gameName(x.game)) + '</b><span class="pa-num">' + x.won + ' vinte su ' + x.played + '</span><span class="pa-pct">' + Math.round(100 * x.won / Math.max(1, x.played)) + '%</span></div>'; }).join('') +
      '<div class="pa-row pa-tot"><b>Totale</b><span class="pa-num">' + tw + ' vinte su ' + tp + '</span><span class="pa-pct">' + Math.round(100 * tw / Math.max(1, tp)) + '%</span></div></div>'
      : '<p class="pa-note">Ancora nessuna partita registrata: si contano quelle finite da quando hai l’account (non le partite di prova).</p>';
    h += '</section>';
    h += '<section class="pa-sec">' + secHead('friends', 'Classifica tra amici') + '<div class="pa-bar pa-filter"><button type="button" class="pa-btn s' + (boardGame ? ' g' : '') + '" data-pa="board" data-g="">Tutti i giochi</button>' +
      (A.GAMES || []).map(function (g) { var id = g.path.replace(/\/$/, ''); return '<button type="button" class="pa-btn s' + (boardGame === id ? '' : ' g') + '" data-pa="board" data-g="' + id + '">' + esc(g.n) + '</button>'; }).join('') + '</div>';
    h += boardData && boardData.length ? '<div class="pa-list">' + boardData.map(function (r, i) { return '<div class="pa-row' + (r.me ? ' pa-me' : '') + '"><span class="pa-pos">' + (i + 1) + '</span><b>' + esc(r.username) + (r.me ? ' (tu)' : '') + '</b><span class="pa-num">' + r.won + ' vinte · ' + r.played + ' giocate</span></div>'; }).join('') + '</div>' : '<p class="pa-note">Nessun risultato.</p>';
    h += '</section>';
    if (statsData.recent.length) h += '<section class="pa-sec"><h3>Ultime partite</h3><div class="pa-list">' + statsData.recent.map(function (x) {
      var d = new Date(x.at), when = d.toLocaleDateString('it-IT', { day: 'numeric', month: 'short' }) + ' ' + d.toLocaleTimeString('it-IT', { hour: '2-digit', minute: '2-digit' });
      return '<div class="pa-row"><span class="pa-res">' + (x.won ? '🏆' : '·') + '</span><span style="flex:1;min-width:0"><b>' + esc(gameName(x.game)) + '</b> · ' + (x.won ? 'vinta' : x.place ? x.place + 'º posto' : 'persa') + (x.score != null ? ' · ' + x.score + ' punti' : '') +
        '<br><span class="pa-note">' + when + (x.rivals && x.rivals.length ? ' · con ' + x.rivals.map(esc).join(', ') : '') + '</span></span></div>';
    }).join('') + '</div></section>';
    return h + '<button class="pa-btn g" data-pa="go" data-v="account">‹ Torna al profilo</button>';
  }
  function incoming() { return friendsData && friendsData.incoming ? friendsData.incoming.length : 0; }
  function addFriend(name) {
    return notify({ kind: 'friend', to: name }).then(function (r) {
      var t = r.state === 'accepted' ? 'Tu e ' + r.to + ' ora siete amici.' : r.state === 'already' ? 'Tu e ' + r.to + ' siete già amici.' : r.state === 'pending' ? 'Hai già chiesto l’amicizia a ' + r.to + ': aspetta che accetti.' : 'Richiesta inviata a ' + r.to + '.';
      msg = { ok: true, t: t }; return refreshFriends();
    });
  }

  /* ---------- grafica ---------- */
  var CSS = '.pa-back{position:fixed;inset:0;z-index:95;background:rgba(8,5,3,.66);-webkit-backdrop-filter:blur(3px);backdrop-filter:blur(3px);display:flex;align-items:flex-end;justify-content:center;animation:pafade .2s}' +
    '@keyframes pafade{from{opacity:0}}@keyframes paup{from{transform:translateY(28px);opacity:0}}' +
    '.pa-sheet{position:relative;width:100%;max-width:540px;max-height:calc(94vh - env(safe-area-inset-top,0px));overflow-y:auto;overscroll-behavior:contain;background:linear-gradient(180deg,#241b14,#19130e 160px);color:#f6ecdc;border:1px solid rgba(255,228,186,.13);border-bottom:0;border-radius:22px 22px 0 0;padding:22px max(18px,env(safe-area-inset-right,0px)) calc(20px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));display:grid;gap:14px;font:16px/1.5 system-ui,-apple-system,"Segoe UI",Roboto,sans-serif;-webkit-font-smoothing:antialiased;box-shadow:0 -14px 40px rgba(0,0,0,.55);animation:paup .28s cubic-bezier(.2,.8,.2,1)}' +
    '.pa-sheet::before{content:"";position:absolute;top:8px;left:50%;width:40px;height:4px;margin-left:-20px;border-radius:4px;background:rgba(255,228,186,.2)}' +
    '@media(min-width:640px){.pa-back{align-items:center;padding:24px}.pa-sheet{border-radius:22px;border-bottom:1px solid rgba(255,228,186,.13);padding:26px 24px 22px}.pa-sheet::before{display:none}}' +
    '.pa-x{position:absolute;top:12px;right:12px;width:36px;height:36px;display:grid;place-items:center;appearance:none;border:0;border-radius:50%;background:rgba(255,240,215,.08);color:#cbbca3;font:400 22px/1 system-ui,sans-serif;cursor:pointer;z-index:1}.pa-x:hover{background:rgba(255,240,215,.16);color:#fff}' +
    '.pa-sheet h2{margin:0;padding-right:44px;font:600 23px/1.2 Fraunces,Georgia,serif;letter-spacing:-.01em}.pa-sheet p{margin:0}.pa-note{font-size:13.5px;color:#ab9b83}' +
    '.pa-sheet h3{margin:0;font:700 12px/1.2 system-ui,sans-serif;letter-spacing:.1em;text-transform:uppercase;color:#e8ab4c}' +
    '.pa-tabs{display:flex;gap:4px;background:rgba(0,0,0,.28);padding:4px;border-radius:14px;border:1px solid rgba(255,228,186,.08)}.pa-tabs button{flex:1;appearance:none;border:0;background:none;color:#cbbca3;font:600 15px system-ui,sans-serif;padding:10px;border-radius:10px;cursor:pointer}.pa-tabs button.on{background:#e8ab4c;color:#1b1209;box-shadow:0 2px 8px rgba(0,0,0,.3)}' +
    '.pa-sheet form{display:grid;gap:12px}.pa-sheet form.pa-bar{display:flex;flex-wrap:nowrap}.pa-sheet form.pa-bar input{min-width:0!important}.pa-sheet label{display:grid;gap:6px;font-size:13.5px;font-weight:600;color:#cbbca3}' +
    '.pa-sheet input[type=text],.pa-sheet input[type=password]{font:16px system-ui,sans-serif;padding:12px 14px;border-radius:12px;border:1px solid rgba(255,228,186,.16);background:rgba(0,0,0,.3);color:#f6ecdc;min-height:48px;transition:border-color .15s,box-shadow .15s}' +
    '.pa-sheet input::placeholder{color:#7d705d}.pa-sheet input[type=text]:focus,.pa-sheet input[type=password]:focus{outline:none;border-color:#e8ab4c;box-shadow:0 0 0 3px rgba(232,171,76,.18)}' +
    '.pa-btn{appearance:none;border:0;border-radius:12px;min-height:48px;padding:11px 18px;font:700 15.5px system-ui,sans-serif;background:#e8ab4c;color:#1b1209;cursor:pointer;transition:background .15s,transform .1s;box-shadow:0 4px 14px rgba(232,171,76,.18)}.pa-btn:hover{background:#f6cd7d}.pa-btn:active{transform:scale(.98)}.pa-btn:disabled{opacity:.5}' +
    '.pa-btn.g{background:rgba(255,240,215,.06);color:inherit;box-shadow:inset 0 0 0 1px rgba(255,228,186,.16)}.pa-btn.g:hover{background:rgba(255,240,215,.12)}.pa-btn.s{min-height:36px;padding:7px 13px;font-size:14px;border-radius:10px;box-shadow:none}.pa-btn.s.g{box-shadow:inset 0 0 0 1px rgba(255,228,186,.16)}.pa-btn.r{background:#c2412d;color:#fff}' +
    '.pa-err{color:#ff9b86;font-size:14.5px;padding:10px 12px;border-radius:12px;background:rgba(255,110,90,.09)}.pa-ok{color:#9fe0a0;font-size:14.5px;padding:10px 12px;border-radius:12px;background:rgba(80,200,120,.09)}' +
    '.pa-list{display:grid;gap:6px}.pa-row{display:flex;gap:10px;align-items:center;padding:10px 12px;border-radius:13px;background:rgba(0,0,0,.22);border:1px solid rgba(255,228,186,.07)}.pa-row b{flex:1;min-width:0;overflow:hidden;text-overflow:ellipsis}' +
    '.pa-dot{width:9px;height:9px;border-radius:50%;background:#6f675c;flex:none}.pa-dot.on{background:#43d17c;box-shadow:0 0 0 3px rgba(67,209,124,.18)}' +
    '.pa-row a.pa-btn{text-decoration:none;display:inline-flex;align-items:center}.pa-num{font-size:13.5px;color:#cbbca3;white-space:nowrap}.pa-pct{min-width:44px;text-align:right;font-weight:800;color:#e8ab4c}' +
    '.pa-tot{background:rgba(232,171,76,.1);border-color:rgba(232,171,76,.25)}.pa-me{box-shadow:inset 0 0 0 1px rgba(232,171,76,.6)}.pa-pos{width:24px;text-align:center;font-weight:800;color:#e8ab4c}.pa-res{width:24px;text-align:center}' +
    '.pa-filter{gap:6px;flex-wrap:nowrap!important;overflow-x:auto;padding-bottom:4px;scrollbar-width:thin}.pa-filter .pa-btn{flex:none;white-space:nowrap}' +
    '.pa-chip{appearance:none;display:inline-flex;align-items:center;gap:8px;border:1px solid rgba(255,228,186,.18);background:rgba(255,240,215,.07);color:inherit;border-radius:999px;padding:4px 13px 4px 4px;min-height:38px;font:600 14.5px system-ui,-apple-system,sans-serif;cursor:pointer;position:relative;white-space:nowrap;transition:border-color .15s,background .15s}.pa-chip:hover{border-color:#e8ab4c;background:rgba(255,240,215,.11)}' +
    '.pa-chip.in{background:#e8ab4c;border-color:#e8ab4c;color:#1b1209;padding:4px 15px 4px 6px}.pa-chip.in:hover{background:#f6cd7d}.pa-chip.in svg{width:26px;height:26px;padding:4px;border-radius:50%;background:rgba(0,0,0,.12)}' +
    '.pa-chip .n{background:#d8402a;color:#fff;border-radius:999px;font-size:11px;line-height:18px;min-width:18px;text-align:center;padding:0 5px;font-weight:800}.pa-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.pa-av{display:inline-grid;place-items:center;flex:none;width:30px;height:30px;border-radius:50%;color:#fff;font:700 14px/1 system-ui,sans-serif;text-transform:uppercase;box-shadow:inset 0 0 0 1px rgba(255,255,255,.18)}.pa-av.l{width:58px;height:58px;font-size:25px;box-shadow:inset 0 0 0 2px rgba(255,255,255,.2),0 6px 18px rgba(0,0,0,.35)}' +
    '.pa-prof{display:flex;align-items:center;gap:14px;padding-right:40px}.pa-prof h2{padding:0}.pa-prof>div{display:grid;gap:2px;min-width:0}' +
    '.pa-sec{display:grid;gap:10px;padding:16px;border-radius:18px;background:rgba(255,240,215,.035);border:1px solid rgba(255,228,186,.09)}' +
    '.pa-sh{display:flex;align-items:center;gap:10px}.pa-sh h3{flex:1}.pa-si{width:30px;height:30px;border-radius:9px;display:grid;place-items:center;flex:none;color:#e8ab4c;background:rgba(232,171,76,.12)}.pa-cnt{font-size:12.5px;font-weight:700;color:#cbbca3;background:rgba(255,240,215,.07);padding:2px 9px;border-radius:999px}' +
    '.pa-nav{appearance:none;width:100%;display:flex;align-items:center;gap:12px;text-align:left;padding:12px;border-radius:14px;border:1px solid rgba(255,228,186,.08);background:rgba(0,0,0,.22);color:inherit;font:inherit;cursor:pointer}.pa-nav:hover{border-color:rgba(232,171,76,.5)}.pa-nav span{flex:1;min-width:0;display:grid}.pa-nav small{font-size:13px;color:#ab9b83}.pa-nav i{font-style:normal;font-size:22px;color:#ab9b83}' +
    '.pa-acts{display:grid;grid-template-columns:1fr 1fr;gap:8px}.pa-acts .pa-btn{width:100%}.pa-btn.dz{color:#ff9b86}' +
    '.pa-check{display:flex!important;flex-direction:row!important;gap:12px!important;align-items:center;font-size:15px!important;font-weight:400!important;color:inherit!important;padding:4px 0;cursor:pointer}' +
    '.pa-check input{-webkit-appearance:none;appearance:none;margin:0;flex:none;position:relative;cursor:pointer;width:44px;height:26px;border-radius:999px;background:rgba(255,240,215,.16);transition:background .2s}' +
    '.pa-check input::after{content:"";position:absolute;top:3px;left:3px;width:20px;height:20px;border-radius:50%;background:#fff;box-shadow:0 1px 3px rgba(0,0,0,.4);transition:transform .2s cubic-bezier(.2,.8,.2,1)}.pa-check input:checked{background:#e8ab4c}.pa-check input:checked::after{transform:translateX(18px)}' +
    '.pa-check input:focus-visible{outline:2px solid #f6cd7d;outline-offset:2px}' +
    '.pa-sec>.pa-check{flex-direction:row-reverse!important;justify-content:space-between;padding:8px 0;border-bottom:1px solid rgba(255,228,186,.07)}.pa-sec>.pa-check:last-of-type{border-bottom:0}' +
    '.pa-games{display:flex;flex-wrap:wrap;gap:6px}.pa-games .pa-check{gap:7px!important;font-size:13.5px!important;padding:6px 11px 6px 7px;border-radius:999px;border:1px solid rgba(255,228,186,.13);background:rgba(0,0,0,.18)}' +
    '.pa-games .pa-check:has(input:checked){border-color:rgba(232,171,76,.55);background:rgba(232,171,76,.12)}' +
    '.pa-games .pa-check input{width:18px;height:18px;border-radius:6px}.pa-games .pa-check input::after{top:3px;left:6px;width:5px;height:9px;border-radius:0;background:none;box-shadow:none;border:solid #1b1209;border-width:0 2px 2px 0;transform:rotate(45deg) scale(0)}.pa-games .pa-check input:checked::after{transform:rotate(45deg) scale(1)}' +
    '.pa-sep{border:0;border-top:1px solid rgba(255,228,186,.09);margin:2px 0}' +
    '.pa-pw{position:relative;display:block}.pa-pw input{width:100%;box-sizing:border-box;padding-right:84px!important}.pa-eye{position:absolute;right:4px;top:50%;transform:translateY(-50%);appearance:none;border:0;background:rgba(255,240,215,.07);color:#cbbca3;font:600 13px system-ui,sans-serif;min-width:72px;min-height:38px;cursor:pointer;border-radius:9px}' +
    '.pa-code{font:700 24px/1.2 ui-monospace,SFMono-Regular,Menlo,monospace;letter-spacing:.06em;text-align:center;padding:16px 10px;border-radius:14px;background:rgba(0,0,0,.35);border:1px dashed rgba(232,171,76,.7);color:#f6cd7d;user-select:all;-webkit-user-select:all;overflow-wrap:anywhere}' +
    '.pa-warn{padding:12px 14px;border-radius:14px;background:rgba(232,140,60,.12);border:1px solid rgba(232,140,60,.45);font-size:14.5px;display:grid;gap:10px}.pa-warn .pa-btn{justify-self:start}' +
    '.pa-link{appearance:none;border:0;background:none;color:#e8ab4c;font:600 14.5px system-ui,sans-serif;text-decoration:underline;text-underline-offset:3px;padding:6px 0;cursor:pointer;justify-self:start}' +
    '.pa-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:99;background:#241b14;color:#f6ecdc;border:1px solid rgba(232,171,76,.5);padding:11px 16px;border-radius:14px;font:15px system-ui,sans-serif;box-shadow:0 12px 30px rgba(0,0,0,.5);max-width:min(92vw,460px)}';
  var ICO = {
    friends: '<circle cx="9" cy="8" r="3.2"/><path d="M3 20c0-3.4 2.7-6 6-6s6 2.6 6 6"/><path d="M16 4.6a3.2 3.2 0 0 1 0 6.3M18 14.3c1.9.7 3 2.6 3 5.7"/>',
    chart: '<path d="M4 20V10M10 20V4M16 20v-7M22 20H2"/>',
    bell: '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',
    shield: '<path d="M12 3 4.5 6v5.5c0 4.6 3.2 8.4 7.5 9.5 4.3-1.1 7.5-4.9 7.5-9.5V6z"/><path d="m9 12 2 2 4-4"/>',
    user: '<circle cx="12" cy="8" r="4"/><path d="M4 21c0-4.4 3.6-7 8-7s8 2.6 8 7"/>'
  };
  function ico(k, w) { return '<svg viewBox="0 0 24 24" width="' + (w || 18) + '" height="' + (w || 18) + '" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + ICO[k] + '</svg>'; }
  function avatar(name, cls) { var h = 0; String(name).split('').forEach(function (c) { h = (h * 31 + c.charCodeAt(0)) % 360; }); return '<span class="pa-av' + (cls ? ' ' + cls : '') + '" style="background:linear-gradient(135deg,hsl(' + h + ',62%,52%),hsl(' + ((h + 40) % 360) + ',58%,38%))" aria-hidden="true">' + esc(String(name).charAt(0)) + '</span>'; }
  function secHead(k, title, n) { return '<div class="pa-sh"><span class="pa-si">' + ico(k) + '</span><h3>' + title + '</h3>' + (n != null ? '<span class="pa-cnt">' + n + '</span>' : '') + '</div>'; }
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
    back.innerHTML = '<div class="pa-sheet" role="dialog" aria-modal="true"><button type="button" class="pa-x" data-pa="close" aria-label="Chiudi">×</button>' + html + '</div>';
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
    var on = fr2.filter(function (f) { return f.online; }).length;
    var h = '<div class="pa-prof">' + avatar(u.username, 'l') + '<div><h2>Ciao, ' + esc(u.username) + '</h2><p class="pa-note">' + (d ? fr2.length + (fr2.length === 1 ? ' amico' : ' amici') + (on ? ' · ' + on + ' collegat' + (on === 1 ? 'o' : 'i') + ' ora' : '') : 'Il tuo profilo') + '</p></div></div>' + msgHTML();
    if (hasRecovery === false && !view.x.rec) h += '<div class="pa-warn"><span><b>Non hai ancora un codice di recupero.</b> Senza, se dimentichi la password l’account è perso (amici e statistiche compresi).</span><button class="pa-btn s" type="button" data-pa="rec">Crea il codice di recupero</button></div>';
    // amici
    h += '<section class="pa-sec">' + secHead('friends', 'Amici', d ? fr2.length : null);
    if (inc.length) h += '<div class="pa-list">' + inc.map(function (n) { return '<div class="pa-row pa-tot">' + avatar(n) + '<b>' + esc(n) + ' vuole essere tuo amico</b><button class="pa-btn s" data-pa="accept" data-u="' + esc(n) + '">Accetta</button><button class="pa-btn s g" data-pa="decline" data-u="' + esc(n) + '">No</button></div>'; }).join('') + '</div>';
    h += d == null ? '<p class="pa-note">Carico…</p>' : fr2.length ? '<div class="pa-list">' + fr2.map(function (f) { var j = joinHref(f); return '<div class="pa-row">' + avatar(f.username) + '<span style="flex:1;min-width:0"><b style="display:flex;align-items:center;gap:7px">' + esc(f.username) + '<span class="pa-dot' + (f.online ? ' on' : '') + '" title="' + (f.online ? 'Collegato' : 'Non in linea') + '"></span></b><span class="pa-note">' + esc(friendLine(f)) + '</span></span>' + (j ? '<a class="pa-btn s" href="' + esc(j) + '">' + (f.phase === 'lobby' ? 'Raggiungi' : 'Guarda') + '</a>' : '') + '<button class="pa-btn s g" data-pa="unfriend" data-u="' + esc(f.username) + '" aria-label="Togli ' + esc(f.username) + ' dagli amici">×</button></div>'; }).join('') + '</div>' : '<p class="pa-note">Nessun amico per ora. Aggiungili con il loro nome utente: potrete invitarvi ai tavoli con una notifica.</p>';
    if (out.length) h += '<p class="pa-note">In attesa di risposta: ' + out.map(esc).join(', ') + '</p>';
    h += '<form data-pa-form="friend" class="pa-bar"><input type="text" name="f" maxlength="18" placeholder="Nome utente dell’amico" autocapitalize="none" spellcheck="false" style="flex:1;min-width:170px" required><button class="pa-btn s" type="submit" style="min-height:48px">Aggiungi</button></form></section>';
    // partite
    h += '<section class="pa-sec">' + secHead('chart', 'Partite') + '<button type="button" class="pa-nav" data-pa="go" data-v="stats"><span><b>Statistiche e classifica tra amici</b><small>Vittorie per gioco, ultime partite e chi è il più forte</small></span><i aria-hidden="true">›</i></button></section>';
    // notifiche
    h += '<section class="pa-sec">' + secHead('bell', 'Notifiche') + (window.Alerts && Alerts.settingsHTML ? Alerts.settingsHTML() : '') + '</section>';
    // account e sicurezza
    h += '<section class="pa-sec">' + secHead('shield', 'Account e sicurezza');
    if (devices && devices.length) {
      h += '<div class="pa-list">' + devices.map(function (dv) { return '<div class="pa-row"><span class="pa-dot' + (dv.here ? ' on' : '') + '"></span><span style="flex:1;min-width:0"><b>' + esc(dv.device) + '</b><br><span class="pa-note">' + (dv.here ? 'questo dispositivo' : 'ultimo uso ' + ago(dv.used)) + '</span></span></div>'; }).join('') + '</div>';
      h += devices.length > 1 ? '<div class="pa-bar"><button class="pa-btn s g" data-pa="others">Esci dagli altri dispositivi</button></div>' : '<p class="pa-note">Sei collegato solo da qui. L’accesso resta attivo finché non esci tu (o per 6 mesi senza usarlo).</p>';
    }
    if (view.x.pw) h += '<form data-pa-form="password">' + pwField('Password attuale', 'o', 'current-password') + pwField('Nuova password', 'n', 'new-password') + '<button class="pa-btn s" type="submit">Cambia password</button></form>';
    if (view.x.rec) h += '<form data-pa-form="recovery"><p>Per creare un nuovo codice di recupero scrivi la tua password. Il codice di prima, se c’era, non varrà più.</p>' + pwField('Password', 'r', 'current-password') + '<button class="pa-btn s" type="submit">Crea il codice</button></form>';
    if (view.x.del) h += '<form data-pa-form="delete"><p>Cancelli account, amici e notifiche. Non si può annullare.</p>' + pwField('Password', 'd', 'current-password') + '<button class="pa-btn s r" type="submit">Cancella per sempre</button></form>';
    h += '<div class="pa-acts">' + (view.x.pw ? '' : '<button class="pa-btn s g" data-pa="pw">Cambia password</button>') + (view.x.rec ? '' : '<button class="pa-btn s g" data-pa="rec">Codice di recupero</button>') + '<button class="pa-btn s g" data-pa="logout">Esci</button>' + (view.x.del ? '' : '<button class="pa-btn s g dz" data-pa="del">Cancella account</button>') + '</div></section>';
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
    if (!u) return '<span data-pa-chip class="pa-bar"><button type="button" class="pa-chip in" data-pa="open" data-v="login">' + ico('user', 26) + 'Accedi o registrati</button></span>';
    var n = incoming();
    return '<span data-pa-chip class="pa-bar"><button type="button" class="pa-chip" data-pa="open" data-v="account" aria-label="Profilo e impostazioni di ' + esc(u.username) + '">' + avatar(u.username) + esc(u.username) + (n ? ' <span class="n" title="Richieste di amicizia">' + n + '</span>' : '') + '</button></span>';
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
