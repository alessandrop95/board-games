/* ===== Lista dei tavoli aperti (condivisa tra i giochi) ===== */
var Lobby = (function () {
  var stop = null, starting = false, list = null, failed = false;
  var css = '.vis-b{display:inline-block;font-size:11.5px;line-height:1;padding:3px 7px;border-radius:999px;border:1px solid currentColor;margin-left:6px;vertical-align:2px;white-space:nowrap;opacity:.85}' +
    '.vis-pick{display:flex;gap:8px;flex-wrap:wrap}.vis-pick label{flex:1;min-width:140px;display:flex;gap:8px;align-items:center;padding:10px 12px;border:1px solid rgba(255,255,255,.16);border-radius:10px;cursor:pointer}' +
    '.vis-pick input{width:18px;height:18px;margin:0;flex:none;accent-color:#d9a441}.vis-pick label:has(input:checked){border-color:currentColor}.olist{display:grid;gap:8px}';
  function ensureCss() { if (!document.getElementById('lobby-css')) { var s = document.createElement('style'); s.id = 'lobby-css'; s.textContent = css; document.head.appendChild(s); } }
  function e(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  function start() {
    ensureCss();
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
    return list.map(function (t) {
      var full = t.max && t.n >= t.max, pub = t.vis === 'public';
      var state = t.phase === 'play' ? 'in partita' : full ? 'completo' : 'in attesa';
      var btn;
      if (!pub) btn = '<button class="btn small ghost" data-act="lobbycode" data-host="' + e(t.host) + '">Ho il codice</button>';
      else if (t.phase === 'play') btn = '<button class="btn small ghost" data-act="lobbyjoin" data-code="' + e(t.code) + '">Guarda</button>';
      else if (full) btn = '<button class="btn small ghost" disabled>Completo</button>';
      else btn = '<button class="btn small" data-act="lobbyjoin" data-code="' + e(t.code) + '">Siediti</button>';
      return '<div class="trow"><div class="grow" style="min-width:0"><div style="overflow-wrap:anywhere"><b>Tavolo di ' + e(t.host || '…') + '</b><span class="vis-b">' + (pub ? 'Aperto a tutti' : 'Solo su invito') + '</span></div>' +
        '<div class="muted" style="font-size:13px">' + t.n + (t.max ? '/' + t.max : '') + ' giocatori · ' + state + (t.note ? ' · ' + e(t.note) : '') + '</div></div>' + btn + '</div>';
    }).join('');
  }
  function panelHTML() { ensureCss(); return '<div id="olist" class="olist">' + rows() + '</div>'; }
  function pickHTML() {
    var v = (function () { try { return localStorage.getItem('pp-vis'); } catch (x) { return null; } })() === 'invite' ? 'invite' : 'public';
    return '<div class="vis-pick" role="radiogroup" aria-label="Chi può sedersi">' +
      '<label><input type="radio" name="vis" value="public"' + (v === 'public' ? ' checked' : '') + '><span><b>Aperto a tutti</b><br><span class="muted" style="font-size:13px">compare nella lista, ci si siede con un tocco</span></span></label>' +
      '<label><input type="radio" name="vis" value="invite"' + (v === 'invite' ? ' checked' : '') + '><span><b>Solo su invito</b><br><span class="muted" style="font-size:13px">compare nella lista, ma serve il codice</span></span></label></div>';
  }
  function pickedVis() {
    var el = document.querySelector('input[name="vis"]:checked'), v = el && el.value === 'invite' ? 'invite' : 'public';
    try { localStorage.setItem('pp-vis', v); } catch (x) {}
    return v;
  }
  function roomHTML(doc, isHost) {
    ensureCss();
    var v = doc.vis === 'invite' ? 'invite' : 'public';
    return '<label style="display:grid;gap:6px"><span><b>Chi può sedersi</b><br><span class="muted" style="font-size:15px">' +
      (v === 'public' ? 'Il tavolo compare nella lista di tutti e chiunque può sedersi.' : 'Il tavolo compare nella lista, ma per sedersi serve il codice o il link d’invito.') + '</span></span>' +
      '<select id="opt-vis" class="field"' + (isHost ? '' : ' disabled') + ' style="font-size:16px;min-height:44px"><option value="public"' + (v === 'public' ? ' selected' : '') + '>Aperto a tutti</option><option value="invite"' + (v === 'invite' ? ' selected' : '') + '>Solo su invito (con codice)</option></select></label>';
  }
  return { start: start, end: end, paint: paint, panelHTML: panelHTML, pickHTML: pickHTML, pickedVis: pickedVis, roomHTML: roomHTML };
})();
