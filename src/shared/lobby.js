/* ===== Lista dei tavoli aperti (condivisa tra i giochi) ===== */
var Lobby = (function () {
  var stop = null, starting = false, list = null, failed = false;
  var css = '.vis-b{display:inline-block;font-size:11.5px;line-height:1;padding:3px 7px;border-radius:999px;border:1px solid currentColor;margin-left:6px;vertical-align:2px;white-space:nowrap;opacity:.85}' +
    '.vis-pick{display:flex;gap:8px;flex-wrap:wrap}.vis-pick label{flex:1;min-width:140px;display:flex;gap:8px;align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;cursor:pointer}' +
    '.vis-pick input{width:18px;height:18px;margin:0;flex:none;accent-color:#d9a441}.vis-pick label:has(input:checked){border-color:currentColor}.olist{display:grid;gap:8px}';
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
    checkRecent();
    if (stop || starting) return;
    starting = true; failed = false;
    Net.watchLobby(function (l) { list = l; paint(); }).then(function (s) { starting = false; stop = s; }).catch(function () { starting = false; failed = true; paint(); });
  }
  function end() { if (stop) { stop(); stop = null; } list = null; }
  function paint() { var el = document.getElementById('olist'); if (el) el.innerHTML = rows(); }
  function rows() {
    if (failed) return '<p class="lead">Non riesco a caricare la lista dei tavoli. Controlla la connessione; puoi sempre entrare con il codice.</p>';
    if (!list) return '<p class="lead">Cerco i tavoli aperti…</p>';
    if (!list.length) return '<p class="lead">Nessun tavolo aperto in questo momento. Aprine uno tu: comparirà qui per tutti.</p>';
    var A = window.Account, shown = list.filter(function (t) { return t.vis !== 'friends' || (A && A.friend && A.friend(t.u)); });
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
    var v = v0 === 'invite' ? 'invite' : v0 === 'friends' && fr ? 'friends' : 'public';
    return '<div class="vis-pick" role="radiogroup" aria-label="Chi può sedersi">' +
      '<label><input type="radio" name="vis" value="public"' + (v === 'public' ? ' checked' : '') + '><span><b>Aperto a tutti</b><br><span class="muted" style="font-size:13px">compare nella lista e chi ha gli avvisi accesi riceve una notifica</span></span></label>' +
      '<label><input type="radio" name="vis" value="invite"' + (v === 'invite' ? ' checked' : '') + '><span><b>Solo su invito</b><br><span class="muted" style="font-size:13px">compare nella lista, ma serve il codice</span></span></label>' +
      (fr ? '<label><input type="radio" name="vis" value="friends"' + (v === 'friends' ? ' checked' : '') + '><span><b>Solo amici</b><br><span class="muted" style="font-size:13px">lo vedono e ricevono la notifica solo i tuoi amici</span></span></label>' : '') + '</div>';
  }
  function pickedVis() {
    var el = document.querySelector('input[name="vis"]:checked'), v = el && (el.value === 'invite' || el.value === 'friends') ? el.value : 'public';
    try { localStorage.setItem('pp-vis', v); } catch (x) {}
    return v;
  }
  function roomHTML(doc, isHost) {
    ensureCss();
    var v = doc.vis === 'invite' || doc.vis === 'friends' ? doc.vis : 'public', fr = v === 'friends' || (window.Account && Account.user());
    if (doc.practice) return (window.Score ? Score.roomHTML(doc, isHost) : '') + '<p class="muted" style="margin:0;font-size:15px">Partita di prova: il tavolo non compare nella lista.</p>';
    return '<label style="display:grid;gap:6px"><span><b>Chi può sedersi</b><br><span class="muted" style="font-size:15px">' +
      (v === 'public' ? 'Il tavolo compare nella lista di tutti e chiunque può sedersi.' : v === 'friends' ? 'Il tavolo lo vedono solo gli amici dell’host, che possono sedersi con un tocco.' : 'Il tavolo compare nella lista, ma per sedersi serve il codice o il link d’invito.') + '</span></span>' +
      '<select id="opt-vis" class="field"' + (isHost ? '' : ' disabled') + ' style="font-size:16px;min-height:44px"><option value="public"' + (v === 'public' ? ' selected' : '') + '>Aperto a tutti</option><option value="invite"' + (v === 'invite' ? ' selected' : '') + '>Solo su invito (con codice)</option>' + (fr ? '<option value="friends"' + (v === 'friends' ? ' selected' : '') + '>Solo amici</option>' : '') + '</select></label>' + (window.Score ? Score.roomHTML(doc, isHost) : '') + (window.Account && Account.user() ? '<div>' + Account.inviteHTML() + '</div>' : '');
  }
  return { start: start, end: end, paint: paint, panelHTML: panelHTML, pickHTML: pickHTML, pickedVis: pickedVis, roomHTML: roomHTML,
    setRecentKey: function (k) { RKEY = k; }, recentRows: recentRows, forget: forget };
})();
