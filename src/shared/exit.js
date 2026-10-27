/* ===== Uscita dal tavolo (condivisa da tutti i giochi) =====
   L'host sceglie se chiudere il tavolo per tutti oppure uscire lasciando il comando a un altro giocatore
   (scelto da solo: il primo collegato). Se al tavolo restano solo giocatori automatici, il tavolo può solo chiudersi.
   Chi non è host, a partita iniziata, sceglie se lasciare la partita (gioca l'automatico al suo posto) o uscire per ora.
   Ogni gioco chiama Exit.ask() dal suo pulsante «Esci»: se risponde false, l'uscita è quella semplice di sempre
   (sala d'attesa da non host, oppure chi guarda soltanto). Usa le funzioni globali dei giochi: App, leaveTable. */
var Exit = (function () {
  var CSS = '.px-back{position:fixed;inset:0;z-index:96;background:rgba(5,8,12,.62);display:flex;align-items:flex-end;justify-content:center;animation:pxfade .2s}' +
    '@keyframes pxfade{from{opacity:0}}' +
    '.px-sheet{width:100%;max-width:520px;background:#1b2128;color:#f1ece2;border:1px solid rgba(255,255,255,.12);border-bottom:0;border-radius:18px 18px 0 0;padding:18px max(18px,env(safe-area-inset-right,0px)) calc(18px + env(safe-area-inset-bottom,0px)) max(18px,env(safe-area-inset-left,0px));display:grid;gap:10px;font:16px/1.45 system-ui,-apple-system,sans-serif;box-shadow:0 -12px 34px rgba(0,0,0,.5)}' +
    '@media(min-width:640px){.px-back{align-items:center}.px-sheet{border-radius:18px;border-bottom:1px solid rgba(255,255,255,.12)}}' +
    '.px-sheet h2{margin:0 0 2px;font-size:21px}.px-sheet p{margin:0;color:#cfc8ba;font-size:15px}' +
    '.px-opt{appearance:none;display:grid;gap:2px;text-align:left;width:100%;border:1px solid rgba(255,255,255,.16);background:rgba(255,255,255,.06);color:inherit;border-radius:12px;padding:12px 14px;font:inherit;cursor:pointer;min-height:52px}' +
    '.px-opt b{font-size:16px}.px-opt span{font-size:13.5px;color:#b9b3a6}.px-opt.main{background:linear-gradient(180deg,#f0d58f,#d9b45a);color:#231a06;border-color:transparent}.px-opt.main span{color:#4a3a14}' +
    '.px-opt.red{background:#7a2a1f;border-color:#b6402e}.px-opt.red span{color:#f2c5bb}.px-opt:disabled{opacity:.55}' +
    '.px-cancel{appearance:none;border:0;background:none;color:inherit;font:600 15px system-ui,sans-serif;padding:10px;cursor:pointer;opacity:.85}' +
    '.px-toast{position:fixed;left:50%;top:calc(14px + env(safe-area-inset-top,0px));transform:translateX(-50%);z-index:9999;background:#2a2118;color:#f6ead2;border:1px solid rgba(242,193,78,.5);border-radius:12px;padding:10px 14px;font:15px system-ui,sans-serif;max-width:calc(100vw - 24px);box-shadow:0 10px 26px rgba(0,0,0,.45)}';
  var busy = false;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function css() { if (!document.getElementById('px-css')) { var s = document.createElement('style'); s.id = 'px-css'; s.textContent = CSS; document.head.appendChild(s); } }
  function toast(t) { css(); var d = document.createElement('div'); d.className = 'px-toast'; d.setAttribute('role', 'status'); d.textContent = t; document.body.appendChild(d); setTimeout(function () { d.remove(); }, 3600); }
  function close() { var b = document.querySelector('.px-back'); if (b) b.remove(); busy = false; }
  function open(html) {
    css(); close();
    var b = document.createElement('div'); b.className = 'px-back';
    b.innerHTML = '<div class="px-sheet" role="dialog" aria-modal="true">' + html + '<button type="button" class="px-cancel" data-px="cancel">Resta al tavolo</button></div>';
    b.addEventListener('click', function (e) { if (e.target === b) close(); });
    document.body.appendChild(b);
  }

  // Chi prende il comando se esco: un giocatore umano seduto, collegato se possibile.
  function humans(d) { return d.seats.filter(function (s) { return !s.bot && s.uid !== Net.uid; }); }
  function nextHost(d) {
    var h = humans(d), on = h.filter(function (s) { return Net.presence(s.uid) === 'on'; });
    return on[0] || h[0] || null;
  }
  function inGame(d) { return d.phase !== 'lobby'; }

  // Risponde true se ha aperto la scelta (il gioco non deve fare altro), false se basta l'uscita normale.
  function ask() {
    var d = typeof App !== 'undefined' && App.doc;
    if (!d || !d.seats) return false;
    var seated = d.seats.some(function (s) { return s.uid === Net.uid; }), host = d.host === Net.uid;
    if (!seated && !host) return false;
    var game = inGame(d);
    if (host) {
      var nx = nextHost(d);
      if (!nx) {
        open('<h2>Uscire dal tavolo ' + esc(d.code) + '?</h2>' +
          '<p>' + (d.seats.length > 1 ? 'Al tavolo ci sono solo giocatori automatici' : 'Sei l’unico al tavolo') + ': uscendo il tavolo si chiude' + (game ? ' e la partita finisce' : '') + '.</p>' +
          '<button type="button" class="px-opt red" data-px="close"><b>Chiudi il tavolo ed esci</b><span>Sparisce dalla lista dei tavoli.</span></button>');
        return true;
      }
      open('<h2>Uscire dal tavolo ' + esc(d.code) + '?</h2>' +
        '<p>Sei l’host: scegli cosa succede quando esci.</p>' +
        '<button type="button" class="px-opt main" data-px="pass" data-u="' + esc(nx.uid) + '"><b>Esci e lascia il comando a ' + esc(nx.nick) + '</b><span>' +
          (game ? 'La partita continua: al tuo posto gioca l’automatico.' : 'Il tavolo resta aperto; il tuo posto si libera.') + '</span></button>' +
        '<button type="button" class="px-opt red" data-px="close"><b>Chiudi il tavolo per tutti</b><span>' + (game ? 'La partita finisce e tutti' : 'Tutti') + ' tornano alla schermata iniziale.</span></button>');
      return true;
    }
    if (!game) return false;   // sala d'attesa: chi non è host esce e basta, come sempre
    open('<h2>Uscire dalla partita?</h2>' +
      '<button type="button" class="px-opt main" data-px="quit"><b>Lascia la partita</b><span>Al tuo posto gioca l’automatico fino alla fine; il tuo posto non è più tuo.</span></button>' +
      '<button type="button" class="px-opt" data-px="later"><b>Esci per ora</b><span>Puoi rientrare quando vuoi; mentre sei via, al tuo turno gioca l’automatico.</span></button>');
    return true;
  }

  function done() { close(); if (typeof leaveTable === 'function') leaveTable(true); }
  document.addEventListener('click', function (e) {
    var b = e.target.closest && e.target.closest('[data-px]'); if (!b) return;
    var k = b.getAttribute('data-px');
    if (k === 'cancel') { close(); return; }
    if (busy) return;
    if (k === 'close') {
      close(); App.closing = true;
      if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); }
      return;
    }
    if (k === 'later') { close(); if (typeof leaveTable === 'function') leaveTable(); return; }
    if (k === 'pass' || k === 'quit') {
      if (!Net.connected) { toast('Sei offline: riprova quando torna la connessione.'); return; }
      busy = true; Array.prototype.forEach.call(document.querySelectorAll('.px-opt'), function (x) { x.disabled = true; });
      var who = k === 'pass' ? (App.doc.seats.filter(function (s) { return s.uid === b.getAttribute('data-u'); })[0] || {}).nick : null;
      Net.send({ t: 'quit', next: k === 'pass' ? b.getAttribute('data-u') : null }).then(function () {
        done(); toast(who ? 'Sei uscito: ora il tavolo lo guida ' + who + '.' : 'Hai lasciato la partita: al tuo posto gioca l’automatico.');
      }, function (err) {
        busy = false; Array.prototype.forEach.call(document.querySelectorAll('.px-opt'), function (x) { x.disabled = false; });
        toast(String(err || 'Non sono riuscito a uscire: riprova.'));
      });
    }
  });
  return { ask: ask, close: close };
})();
