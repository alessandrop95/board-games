/* ===== Account (nome utente e password), amici e inviti — server Supabase =====
   L'indirizzo del server sta in server.json (scritto dall'azione «Server» su GitHub). Finché il server
   non è configurato, i giochi funzionano come prima, senza account. */
var Account = (function () {
  var A = window.Alerts || {}, ROOT = A.ROOT || './';
  function get(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
  function set(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
  function jget(k) { try { return JSON.parse(get(k) || 'null'); } catch (e) { return null; } }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  var cfg = jget('pp-server'), session = jget('pp-session'), friendsData = null, view = null, busy = false, msg = null, inviteSent = {};
  var readyRes; var ready = new Promise(function (r) { readyRes = r; });

  /* ---------- server ---------- */
  function load() {
    fetch(ROOT + 'server.json', { cache: 'no-cache' }).then(function (r) { return r.ok ? r.json() : (r.status === 404 ? false : null); }).then(function (j) {
      if (j && j.url && j.anon) { cfg = j; set('pp-server', JSON.stringify(j)); }
      else if (j === false) { cfg = null; set('pp-server', null); }
      readyRes(); repaint(); check();
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
  function check() { if (session && configured()) rpc('me', { p_token: session.token }).then(function (m) { if (m && m.username !== session.username) { session.username = m.username; set('pp-session', JSON.stringify(session)); repaint(); } refreshFriends(true); }, function () {}); }
  function user() { return configured() && session ? session : null; }
  function reloadSoon() { setTimeout(function () { location.reload(); }, 350); }

  function login(u, p, isNew) {
    return rpc(isNew ? 'register' : 'login', { p_username: u, p_password: p, p_device: device() }).then(function (s) {
      setSession(s); set('pp-nick', s.username);
      return (window.Alerts && Alerts.resync ? Alerts.resync() : Promise.resolve()).catch(function () {}).then(function () { close(); toastMsg(isNew ? 'Benvenuto, ' + s.username + '! Account creato.' : 'Bentornato, ' + s.username + '!'); reloadSoon(); });
    });
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
    '.pa-chip{appearance:none;display:inline-flex;align-items:center;gap:7px;border:1px solid rgba(230,197,111,.45);background:rgba(230,197,111,.1);color:inherit;border-radius:999px;padding:6px 12px;font:600 14px system-ui,sans-serif;cursor:pointer;position:relative}' +
    '.pa-chip .n{background:#c4301f;color:#fff;border-radius:999px;font-size:11px;padding:0 6px;font-weight:800}.pa-bar{display:flex;flex-wrap:wrap;gap:8px;align-items:center}' +
    '.pa-check{display:flex!important;flex-direction:row!important;gap:10px!important;align-items:center;font-size:15px!important;color:inherit!important;padding:4px 0}.pa-check input{width:20px;height:20px;accent-color:#e6c56f;flex:none}' +
    '.pa-games{display:grid;grid-template-columns:repeat(auto-fill,minmax(150px,1fr));gap:2px 10px}.pa-sep{border:0;border-top:1px solid rgba(255,255,255,.1);margin:4px 0}' +
    '.pa-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:99;background:#1b2128;color:#f1ece2;border:1px solid rgba(230,197,111,.5);padding:10px 14px;border-radius:12px;font:15px system-ui,sans-serif;box-shadow:0 10px 26px rgba(0,0,0,.5);max-width:min(92vw,460px)}';
  function css() { if (!document.getElementById('pa-css')) { var s = document.createElement('style'); s.id = 'pa-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function toastMsg(t) { css(); var d = document.createElement('div'); d.className = 'pa-toast'; d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3200); }
  function close() { var m = document.querySelector('.pa-back'); if (m) m.remove(); view = null; msg = null; }
  function open(v, extra) {
    css(); view = { v: v || (user() ? 'account' : 'login'), x: extra || {} }; msg = null;
    if (view.v !== 'login' && view.v !== 'register' && !user()) view = { v: 'login', x: { why: extra && extra.why } };
    render();
    if (user() && (view.v === 'account' || view.v === 'invite')) refreshFriends().catch(function () {});
  }
  function render() {
    if (!view) return;
    var html = body(), back = document.querySelector('.pa-back');
    if (!back) { back = document.createElement('div'); back.className = 'pa-back'; back.addEventListener('click', function (e) { if (e.target === back) close(); }); document.body.appendChild(back); }
    var focused = document.activeElement && document.activeElement.name, vals = {};
    back.querySelectorAll('input[type=text],input[type=password]').forEach(function (i) { vals[i.name] = i.value; });
    back.innerHTML = '<div class="pa-sheet" role="dialog" aria-modal="true">' + html + '</div>';
    back.querySelectorAll('input[type=text],input[type=password]').forEach(function (i) { if (vals[i.name] != null) i.value = vals[i.name]; });
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
        '<form data-pa-form="' + v + '" autocomplete="on"><label>Nome utente<input type="text" name="u" maxlength="18" autocomplete="username" autocapitalize="none" spellcheck="false" required></label>' +
        '<label>Password<input type="password" name="p" maxlength="72" autocomplete="' + (reg ? 'new-password' : 'current-password') + '" required></label>' +
        (reg ? '<label>Ripeti la password<input type="password" name="p2" maxlength="72" autocomplete="new-password" required></label>' : '') + msgHTML() +
        '<button class="pa-btn" type="submit"' + (busy ? ' disabled' : '') + '>' + (busy ? 'Un attimo…' : reg ? 'Crea account' : 'Accedi') + '</button></form>' +
        '<p class="pa-note">' + (reg ? 'Da 3 a 18 caratteri tra lettere, numeri, punto e trattini. Niente email: la password non si può recuperare, quindi scrivila in un posto sicuro (il browser può ricordarla per te).' : 'Con l’account ritrovi amici, inviti e notifiche su tutti i tuoi dispositivi.') + '</p>' +
        '<button class="pa-btn g" data-pa="close" type="button">' + (view.x.why ? 'Non ora' : 'Chiudi') + '</button>';
    }
    if (!u) return '';
    if (v === 'invite') {
      var x = view.x, fr = friendsData ? friendsData.friends : null;
      return '<h2>Invita un amico</h2><p class="pa-note">Gli arriva una notifica: toccandola si siede al tavolo <b>' + esc(x.code) + '</b>.</p>' + msgHTML() +
        (fr == null ? '<p class="pa-note">Carico i tuoi amici…</p>' : fr.length ? '<div class="pa-list">' + fr.map(function (f) {
          var k = x.code + ':' + f.username, sent = inviteSent[k];
          return '<div class="pa-row"><span class="pa-dot' + (f.online ? ' on' : '') + '" title="' + (f.online ? 'In linea di recente' : 'Non in linea') + '"></span><b>' + esc(f.username) + '</b><button class="pa-btn s' + (sent ? ' g' : '') + '" data-pa="invite" data-u="' + esc(f.username) + '"' + (sent ? ' disabled' : '') + '>' + (sent ? 'Invitato ✓' : 'Invita') + '</button></div>';
        }).join('') + '</div>' : '<p>Non hai ancora amici nella lista.</p>') +
        '<button class="pa-btn g" data-pa="go" data-v="account">Aggiungi amici</button><button class="pa-btn g" data-pa="close">Chiudi</button>';
    }
    // account
    var d = friendsData, fr2 = d ? d.friends : [], inc = d ? d.incoming : [], out = d ? d.outgoing : [];
    var h = '<h2>Ciao, ' + esc(u.username) + '</h2>' + msgHTML();
    h += '<h3>Notifiche</h3>' + (window.Alerts && Alerts.settingsHTML ? Alerts.settingsHTML() : '');
    h += '<hr class="pa-sep"><h3>Amici</h3>';
    if (inc.length) h += '<div class="pa-list">' + inc.map(function (n) { return '<div class="pa-row"><b>' + esc(n) + ' vuole essere tuo amico</b><button class="pa-btn s" data-pa="accept" data-u="' + esc(n) + '">Accetta</button><button class="pa-btn s g" data-pa="decline" data-u="' + esc(n) + '">No</button></div>'; }).join('') + '</div>';
    h += d == null ? '<p class="pa-note">Carico…</p>' : fr2.length ? '<div class="pa-list">' + fr2.map(function (f) { return '<div class="pa-row"><span class="pa-dot' + (f.online ? ' on' : '') + '"></span><b>' + esc(f.username) + '</b><button class="pa-btn s g" data-pa="unfriend" data-u="' + esc(f.username) + '" aria-label="Togli ' + esc(f.username) + ' dagli amici">Togli</button></div>'; }).join('') + '</div>' : '<p class="pa-note">Nessun amico per ora. Aggiungili con il loro nome utente: potrete invitarvi ai tavoli con una notifica.</p>';
    if (out.length) h += '<p class="pa-note">In attesa di risposta: ' + out.map(esc).join(', ') + '</p>';
    h += '<form data-pa-form="friend" class="pa-bar"><input type="text" name="f" maxlength="18" placeholder="Nome utente dell’amico" autocapitalize="none" spellcheck="false" style="flex:1;min-width:170px" required><button class="pa-btn s" type="submit">Aggiungi</button></form>';
    h += '<hr class="pa-sep"><h3>Account</h3>';
    if (view.x.pw) h += '<form data-pa-form="password"><label>Password attuale<input type="password" name="o" autocomplete="current-password" required></label><label>Nuova password<input type="password" name="n" autocomplete="new-password" required></label><button class="pa-btn s" type="submit">Cambia password</button></form>';
    if (view.x.del) h += '<form data-pa-form="delete"><p>Cancelli account, amici e notifiche. Non si può annullare.</p><label>Password<input type="password" name="d" autocomplete="current-password" required></label><button class="pa-btn s r" type="submit">Cancella per sempre</button></form>';
    h += '<div class="pa-bar">' + (view.x.pw ? '' : '<button class="pa-btn s g" data-pa="pw">Cambia password</button>') + '<button class="pa-btn s g" data-pa="logout">Esci</button>' + (view.x.del ? '' : '<button class="pa-btn s g" data-pa="del">Cancella account</button>') + '</div>';
    return h + '<button class="pa-btn g" data-pa="close">Chiudi</button>';
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
    open('login', { why: 'Per giocare serve un account: è gratis, basta un nome utente e una password.' });
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
    else if (k === 'tab' || k === 'go') { view = { v: b.getAttribute('data-v'), x: {} }; msg = null; render(); if (view.v === 'account') refreshFriends().catch(function () {}); }
    else if (k === 'openinvite') { var code = window.Net && Net.tableCode; if (!code) return; open('invite', { code: code, game: gameId() }); }
    else if (k === 'invite') {
      b.disabled = true;
      notify({ kind: 'invite', to: uname, game: view.x.game, code: view.x.code }).then(function (r) { inviteSent[view.x.code + ':' + uname] = 1; msg = { ok: true, t: r.sent ? 'Invito mandato a ' + uname + '.' : uname + ' non ha le notifiche attive: mandagli il codice ' + view.x.code + '.' }; render(); },
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

  load();
  return { ready: ready, configured: configured, user: user, open: open, close: close, allow: allow, allowQuiet: allowQuiet, chipHTML: chipHTML, inviteHTML: inviteHTML,
    rpc: rpc, notify: notify, refreshFriends: refreshFriends, toast: toastMsg, get config() { return cfg; }, get token() { return session && session.token; }, render: render };
})();
