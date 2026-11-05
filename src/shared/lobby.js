/* ===== Lista dei tavoli aperti (condivisa tra i giochi) ===== */
var Lobby = (function () {
  var stop = null, starting = false, list = null, failed = false, wanted = false, retryT = null;
  var css = '.vis-b{display:inline-block;font-size:11.5px;line-height:1;padding:3px 7px;border-radius:999px;border:1px solid currentColor;margin-left:6px;vertical-align:2px;white-space:nowrap;opacity:.85}' +
    '.vis-pick{display:flex;gap:8px;flex-wrap:wrap}.vis-pick label{flex:1;min-width:140px;display:flex;gap:8px;align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;cursor:pointer}' +
    '.vis-pick input{width:18px;height:18px;margin:0;flex:none;accent-color:#d9a441}.vis-pick label:has(input:checked){border-color:currentColor}.olist{display:grid;gap:8px}' +
    '.pinv{display:grid;gap:8px;padding:12px;border-radius:12px;border:1px dashed rgba(255,255,255,.28);background:rgba(255,255,255,.04)}.pinv p{margin:0;font-size:14px;opacity:.85}' +
    '.pi-back{position:fixed;inset:0;z-index:97;background:rgba(5,8,12,.62);display:flex;align-items:flex-end;justify-content:center}' +
    '.pi-sheet{width:100%;max-width:520px;background:#1b2128;color:#f1ece2;border:1px solid rgba(255,255,255,.12);border-bottom:0;border-radius:18px 18px 0 0;padding:18px 18px calc(18px + env(safe-area-inset-bottom,0px));display:grid;gap:12px;font:15px/1.4 system-ui,sans-serif}' +
    '@media(min-width:640px){.pi-back{align-items:center}.pi-sheet{border-radius:18px;border-bottom:1px solid rgba(255,255,255,.12)}}.pi-sheet h2{margin:0;font-size:20px}.pi-sheet p{margin:0;color:#cfc8ba}' +
    '.pi-link{font:14px ui-monospace,monospace;padding:10px 12px;border-radius:10px;background:#0e1216;border:1px solid rgba(255,255,255,.14);overflow-wrap:anywhere;user-select:all;-webkit-user-select:all}' +
    '.pi-row{display:flex;gap:8px;flex-wrap:wrap}.pi-row button{flex:1;min-height:46px;border-radius:12px;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;font:700 15px system-ui,sans-serif;cursor:pointer}' +
    '.pi-row button.main{background:linear-gradient(180deg,#f0d58f,#d9b45a);color:#231a06;border-color:transparent}' +
    '.pi-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;background:#2a2118;color:#f6ead2;border:1px solid rgba(242,193,78,.5);border-radius:12px;padding:10px 14px;font:15px system-ui,sans-serif;max-width:calc(100vw - 24px)}';
  function ensureCss() { if (!document.getElementById('lobby-css')) { var s = document.createElement('style'); s.id = 'lobby-css'; s.textContent = css; document.head.appendChild(s); } }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* --- I tuoi tavoli recenti: promemoria locale, verificato sul server --- */
  var RKEY = 'pp-recent', rstate = {}, checking = false;
  function rget() { try { var l = JSON.parse(localStorage.getItem(RKEY) || '[]'); return l.filter(function (t) { return t && /^[A-Z]{4}$/.test(t.code) && Date.now() - t.t < 24 * 3600e3; }); } catch (x) { return []; } }
  function rset(l) { try { localStorage.setItem(RKEY, JSON.stringify(l)); } catch (x) {} }
  function forget(code) { rset(rget().filter(function (t) { return t.code !== code; })); delete rstate[code]; paintRecent(); }
  function recentRows() {
    var l = rget();
    if (!l.length) return '<p class="lead">Apri un tavolo e manda il link ai tuoi amici: si siedono dal loro telefono, senza registrarsi.</p>';
    return l.map(function (t) {
      var s = rstate[t.code], m = Math.round((Date.now() - t.t) / 60000), when = m < 60 ? m + ' min fa' : Math.round(m / 60) + ' ore fa';
      var info = !s ? 'controllo…' : s.err ? when : s.missing ? 'non lo trovo ora · ' + when : (s.doc.phase === 'play' ? 'in partita' : s.doc.phase === 'over' ? 'partita finita' : 'in attesa') + ' · ' + s.doc.seats.length + ' giocatori' + (s.doc.host === Net.uid ? ' · tuo' : '');
      return '<div class="trow"><span class="code">' + e(t.code) + '</span><span class="grow muted" style="font-size:13px">' + info + '</span>' +
        '<button class="btn small ghost" data-act="jointable" data-code="' + e(t.code) + '">Rientra</button>' +
        '<button type="button" data-lobby="forget" data-code="' + e(t.code) + '" aria-label="Togli ' + e(t.code) + ' dalla lista" style="appearance:none;background:none;border:0;color:inherit;opacity:.6;font-size:22px;line-height:1;padding:4px 6px;cursor:pointer">×</button></div>';
    }).join('');
  }
  function paintRecent() { var el = document.getElementById('tlist'); if (el) el.innerHTML = recentRows(); }
  // Verifica i recenti: quelli che non esistono più (chiusi o scaduti) vengono tolti da soli.
  async function checkRecent() {
    if (checking) return; checking = true;
    try {
      await Promise.all(rget().map(function (t) {
        var s = rstate[t.code]; if (s && !s.err && !s.missing && Date.now() - s.at < 20000) return null;
        return Net.peek(t.code).then(function (f) {
          if (f && f.closed) { forget(t.code); return; }           // chiuso davvero: via dalla lista
          if (!f || !f.doc) { rstate[t.code] = { missing: true, at: Date.now() }; paintRecent(); return; } // non trovato ora: resta, si può riprovare o togliere con ×
          rstate[t.code] = { doc: f.doc, at: Date.now() }; paintRecent();
        }, function () { rstate[t.code] = { err: true, at: Date.now() }; paintRecent(); });
      }));
    } finally { checking = false; }
  }
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest('[data-lobby="forget"]'); if (b) forget(b.getAttribute('data-code'));
  });

  function start() {
    ensureCss();
    wanted = true;
    checkRecent();
    if (stop || starting) return;
    starting = true;
    clearTimeout(retryT); retryT = null;
    Net.watchLobby(function (l) { list = l; failed = false; paint(); }).then(function (s) {
      starting = false;
      if (!wanted) { s(); return; }   // nel frattempo si è lasciata la home del gioco
      stop = s; failed = false; paint();
    }).catch(function () {
      starting = false; failed = true; paint();
      // senza rete: si riprova da soli ogni pochi secondi finché si resta sulla lista
      if (wanted) retryT = setTimeout(function () { retryT = null; if (wanted) start(); }, 5000);
    });
  }
  function end() { wanted = false; clearTimeout(retryT); retryT = null; if (stop) { stop(); stop = null; } list = null; }
  // ritorno in primo piano: si ricontrollano subito anche i tavoli recenti
  document.addEventListener('visibilitychange', function () { if (document.visibilityState === 'visible' && wanted) { checkRecent(); if (failed && !starting) start(); } });
  function paint() { var el = document.getElementById('olist'); if (el) el.innerHTML = rows(); }
  function rows() {
    if (failed) return '<p class="lead">Non riesco a caricare la lista dei tavoli. Controlla la connessione; puoi sempre entrare con il codice.</p>';
    if (!list) return '<p class="lead">Cerco i tavoli aperti…</p>';
    if (!list.length) return '<p class="lead">Nessun tavolo aperto in questo momento. Aprine uno tu: comparirà qui per tutti.</p>';
    var A = window.Account, shown = list.filter(function (t) { return t.vis !== 'direct' && (t.vis !== 'friends' || (A && A.friend && A.friend(t.u))); });
    if (!shown.length) return '<p class="lead">Nessun tavolo aperto in questo momento. Aprine uno tu: comparirà qui per tutti.</p>';
    return shown.map(function (t) {
      var full = t.max && t.n >= t.max, pub = t.vis === 'public';
      if (t.vis === 'friends') {   // tavolo di un amico: il codice arriva dal server (dove si trova l'amico adesso)
        var f = A.friend(t.u), here = window.Alerts && Alerts.here, code = f && f.table && here && f.game === here.path.replace(/\/$/, '') ? f.table : null;
        if (!code && A.refreshFriendsSoon) A.refreshFriendsSoon();
        t = Object.assign({}, t, { code: code }); pub = !!code;
      }
      var state = t.phase === 'play' ? 'in partita' : full ? 'completo' : 'in attesa';
      var btn;
      if (!pub && t.vis === 'friends') btn = '<button class="btn small ghost" disabled>Un attimo…</button>';
      else if (!pub) btn = '<button class="btn small ghost" data-act="lobbycode" data-host="' + e(t.host) + '">Ho il codice</button>';
      else if (t.phase === 'play') btn = '<button class="btn small ghost" data-act="lobbyjoin" data-code="' + e(t.code) + '">Guarda</button>';
      else if (full) btn = '<button class="btn small ghost" disabled>Completo</button>';
      else btn = '<button class="btn small" data-act="lobbyjoin" data-code="' + e(t.code) + '">Siediti</button>';
      return '<div class="trow"><div class="grow" style="min-width:0"><div style="overflow-wrap:anywhere"><b>Tavolo di ' + e(t.host || '…') + '</b><span class="vis-b">' + (t.vis === 'friends' ? 'Solo amici' : pub ? 'Aperto a tutti' : 'Solo su invito') + '</span></div>' +
        '<div class="muted" style="font-size:13px">' + t.n + (t.max ? '/' + t.max : '') + ' giocatori · ' + state + (t.note ? ' · ' + e(t.note) : '') + '</div></div>' + btn + '</div>';
    }).join('');
  }
  function panelHTML() { ensureCss(); return (window.Account ? Account.chipHTML() : '') + (window.Alerts ? Alerts.controlHTML() : '') + (window.Coach ? Coach.buttonHTML() : '') + '<div id="olist" class="olist">' + rows() + '</div>'; }
  function pickHTML() {
    var fr = window.Account && Account.user(), v0 = (function () { try { return localStorage.getItem('pp-vis'); } catch (x) { return null; } })();
    var v = v0 === 'invite' || v0 === 'direct' ? v0 : v0 === 'friends' && fr ? 'friends' : 'public';
    return '<div class="vis-pick" role="radiogroup" aria-label="Chi può sedersi">' +
      '<label><input type="radio" name="vis" value="public"' + (v === 'public' ? ' checked' : '') + '><span><b>Aperto a tutti</b><br><span class="muted" style="font-size:13px">compare nella lista e chi ha gli avvisi accesi riceve una notifica</span></span></label>' +
      '<label><input type="radio" name="vis" value="invite"' + (v === 'invite' ? ' checked' : '') + '><span><b>Solo su invito</b><br><span class="muted" style="font-size:13px">compare nella lista, ma serve il codice</span></span></label>' +
      (fr ? '<label><input type="radio" name="vis" value="friends"' + (v === 'friends' ? ' checked' : '') + '><span><b>Solo amici</b><br><span class="muted" style="font-size:13px">lo vedono e ricevono la notifica solo i tuoi amici</span></span></label>' : '') +
      '<label><input type="radio" name="vis" value="direct"' + (v === 'direct' ? ' checked' : '') + '><span><b>Invita amico</b><br><span class="muted" style="font-size:13px">non lo vede nessuno: entra solo chi inviti tu, con un invito personale</span></span></label></div>';
  }
  function pickedVis() {
    var el = document.querySelector('input[name="vis"]:checked'), v = el && (el.value === 'invite' || el.value === 'friends' || el.value === 'direct') ? el.value : 'public';
    try { localStorage.setItem('pp-vis', v); } catch (x) {}
    return v;
  }
  function roomHTML(doc, isHost) {
    ensureCss();
    var v = doc.vis === 'invite' || doc.vis === 'friends' || doc.vis === 'direct' ? doc.vis : 'public', fr = v === 'friends' || (window.Account && Account.user());
    if (doc.practice) return (window.Score ? Score.roomHTML(doc, isHost) : '') + '<p class="muted" style="margin:0;font-size:15px">Partita di prova: il tavolo non compare nella lista.</p>';
    return '<label style="display:grid;gap:6px"><span><b>Chi può sedersi</b><br><span class="muted" style="font-size:15px">' +
      (v === 'public' ? 'Il tavolo compare nella lista di tutti e chiunque può sedersi.' : v === 'direct' ? 'Il tavolo non compare in nessuna lista e nessuno riceve avvisi: entra solo chi riceve da te un invito personale.' : v === 'friends' ? 'Il tavolo lo vedono solo gli amici dell’host, che possono sedersi con un tocco.' : 'Il tavolo compare nella lista, ma per sedersi serve il codice o il link d’invito.') + '</span></span>' +
      '<select id="opt-vis" class="field"' + (isHost ? '' : ' disabled') + ' style="font-size:16px;min-height:44px"><option value="public"' + (v === 'public' ? ' selected' : '') + '>Aperto a tutti</option><option value="invite"' + (v === 'invite' ? ' selected' : '') + '>Solo su invito (con codice)</option>' + (fr ? '<option value="friends"' + (v === 'friends' ? ' selected' : '') + '>Solo amici</option>' : '') + '<option value="direct"' + (v === 'direct' ? ' selected' : '') + '>Invita amico (solo chi inviti tu)</option></select></label>' + (v === 'direct' ? privateHTML(doc, isHost) : '') + (window.Score ? Score.roomHTML(doc, isHost) : '') + (window.Account && Account.user() ? '<div>' + Account.inviteHTML() + '</div>' : '');
  }
  /* --- «Invita amico»: inviti personali (un link per persona) --- */
  function privateHTML(doc, isHost) {
    var ks = doc.keys || [], used = ks.filter(function (k) { return k.u; }).length;
    return '<div class="pinv"><b>✉ Inviti personali</b><p>' + (isHost ? 'Ogni invito è un link che vale per una sola persona: chi lo apre per primo si siede, poi per gli altri non funziona più.' : 'Al tavolo entra solo chi viene invitato da chi l’ha aperto.') +
      (ks.length ? ' Inviti creati: ' + ks.length + ', già usati: ' + used + '.' : '') + '</p>' +
      (isHost ? '<button type="button" class="btn" data-lobby="pinvite">Crea un invito personale</button>' : '') + '</div>';
  }
  function toast(t) { ensureCss(); var d = document.createElement('div'); d.className = 'pi-toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3600); }
  var api = null;
  function personalInvite() {
    if (!window.Net || !Net.newInvite) return;
    Net.newInvite().then(function (inv) {
      api.lastInvite = inv.link; ensureCss();
      var old = document.querySelector('.pi-back'); if (old) old.remove();
      var b = document.createElement('div'); b.className = 'pi-back';
      b.innerHTML = '<div class="pi-sheet" role="dialog" aria-modal="true"><h2>Invito personale</h2><p>Manda questo link a <b>una sola persona</b>: chi lo apre per primo si siede al tavolo e il link non vale più per nessun altro. Per invitare qualcun altro creane uno nuovo.</p>' +
        '<div class="pi-link">' + e(inv.link) + '</div><div class="pi-row">' + (navigator.share ? '<button type="button" class="main" data-pi="share">Condividi</button>' : '') +
        '<button type="button"' + (navigator.share ? '' : ' class="main"') + ' data-pi="copy">Copia il link</button></div><div class="pi-row"><button type="button" data-pi="close">Chiudi</button></div></div>';
      b.addEventListener('click', function (ev) {
        var x = ev.target.closest('[data-pi]'); if (ev.target === b || (x && x.getAttribute('data-pi') === 'close')) { b.remove(); return; }
        if (!x) return;
        if (x.getAttribute('data-pi') === 'share') navigator.share({ title: document.title, text: 'Ti invito al mio tavolo di ' + document.title + ' (invito personale, vale solo per te)', url: inv.link }).catch(function () {});
        else { try { navigator.clipboard.writeText(inv.link).then(function () { toast('Link personale copiato.'); }, function () { toast('Tieni premuto sul link per copiarlo.'); }); } catch (er) { toast('Tieni premuto sul link per copiarlo.'); } }
      });
      document.body.appendChild(b);
    }, function (er) { toast(String(er || 'Non sono riuscito a creare l’invito: riprova.')); });
  }
  // Nel tavolo privato i pulsanti «Invita amici» e «Copia link» dei giochi creano un invito personale.
  document.addEventListener('click', function (ev) {
    var b = ev.target.closest && ev.target.closest('[data-lobby="pinvite"],[data-act="invite"],[data-act="copylink"]'); if (!b) return;
    var d = window.App && App.doc;
    if (b.getAttribute('data-lobby') !== 'pinvite' && !(d && d.vis === 'direct' && window.Net && Net.tableCode === d.code)) return;
    ev.preventDefault(); ev.stopPropagation();
    if (window.App && App.sheet) { App.sheet = null; if (typeof renderSheet === 'function') renderSheet(); }
    if (!d || d.host !== Net.uid) { toast('Tavolo privato: solo chi l’ha aperto può invitare.'); return; }
    personalInvite();
  }, true);

  api = { start: start, end: end, paint: paint, panelHTML: panelHTML, pickHTML: pickHTML, pickedVis: pickedVis, roomHTML: roomHTML,
    setRecentKey: function (k) { RKEY = k; }, recentRows: recentRows, forget: forget, personalInvite: personalInvite, lastInvite: null };
  return api;
})();
