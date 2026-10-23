/* ===== Gattomina: interfaccia ===== */
var D = GMData, E = GMEngine, BOT = GMBot, CARDS = GMData.CARDS;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, sel: [], busy: false, botKey: null, botTimer: null, nopeTimers: {}, resolveKey: null, resolveTimer: null, sheetKey: null };
var BOTNAMES = ['Briciola', 'Fuffi', 'Zampa', 'Baffo', 'Micia', 'Tigro', 'Pallina', 'Fusetto'];
var KEY_TABLE = 'gm-table', KEY_RECENT = 'gm-recent';

function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function myIdx() { var g = App.doc && App.doc.game; if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function tn(t) { return D.TYPES[t].n; }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Micio';
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= 5) return { err: 'Il tavolo è pieno (5 giocatori).' };
      doc.seats.push({ uid: from, nick: uniqueNick(doc.seats, nick) }); return {};
    }
    case 'leave': case 'kick': {
      var who = op.t === 'leave' ? from : op.uid;
      if (op.t === 'kick' && who !== from && !isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      doc.seats = doc.seats.filter(function (s) { return s.uid !== who; });
      if (doc.host === who) { var h = doc.seats.filter(function (s) { return !s.bot; })[0]; doc.host = h ? h.uid : null; }
      return {};
    }
    case 'addbot': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      if (doc.seats.length >= 5) return { err: 'Il tavolo è pieno.' };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Gattino';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true }); return {};
    }
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      doc.opts = doc.opts || {};
      if (op.timer != null) doc.opts.timer = Math.max(0, Math.min(600, +op.timer || 0));
      return {};
    }
    case 'back': {
      var gb = doc.game; if (!gb) return { changed: false };
      var pb = -1; gb.players.forEach(function (P, k) { if (P.uid === from) pb = k; });
      if (pb < 0 || !gb.players[pb].bot) return { changed: false };
      gb.players[pb].bot = false; gb.players[pb].away = false;
      gb.log.push({ n: ++gb.logN, t: gb.players[pb].nick + ' è tornato al tavolo.', k: 'sys' });
      return {};
    }
    case 'start': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      if (doc.seats.length < 2) return { err: 'Servono almeno 2 giocatori: aggiungi dei giocatori automatici.' };
      var seats = doc.seats.slice();
      for (var i = seats.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = seats[i]; seats[i] = seats[j]; seats[j] = t; }
      doc.game = E.newGame(seats); doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': if (!isHost) return hostOnly; if (!doc.game || !doc.game.players[op.p]) return { changed: false }; doc.game.players[op.p].bot = !!op.on; return {};
    case 'act': {
      var g = doc.game; if (!g) return { err: 'La partita non è più disponibile.' };
      var p = -1; g.players.forEach(function (P, k) { if (P.uid === from) p = k; });
      if (op.a && op.a.a === 'resolve') { if (!isHost) return hostOnly; p = 0; }
      if (p < 0) return { err: 'Stai solo guardando questa partita.' };
      if (g.players[p].bot && g.players[p].uid === from) { g.players[p].bot = false; g.players[p].away = false; }
      var err = E.act(g, p, op.a); if (err) return { err: err };
      if (g.phase === 'over') doc.phase = 'over';
      return {};
    }
  }
  return { err: 'Azione sconosciuta.' };
}
Net.setReducer(tableReducer);
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var g = cur.game; g.players[d].bot = true; g.players[d].away = true; Turns.awayLog(g, d); return true; }
});
Net.setLobbyInfo(function (d) { var o = d.opts || {}; return { max: 5, note: o.timer === 0 ? 'senza timer' : '' }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo e muovi i giocatori automatici.'); render(); });

/* ---------- azioni ---------- */
async function run(p) { if (App.busy) return; App.busy = true; render(); try { await p(); } catch (e) { toast(typeof e === 'string' ? e : (e && e.message) || 'Qualcosa è andato storto. Riprova.'); } finally { App.busy = false; render(); } }
function requireNick() {
  var n = ($('#nick') && $('#nick').value.trim()) || myNick();
  if (!n) { toast('Scrivi il tuo nome.'); if ($('#nick')) { $('#nick').focus(); $('#nick').scrollIntoView({ block: 'center' }); } return null; }
  lsSet('pp-nick', n.slice(0, 18)); return n.slice(0, 18);
}
function remember(code) {
  var list = []; try { list = JSON.parse(lsGet(KEY_RECENT) || '[]'); } catch (e) {}
  list = list.filter(function (x) { return x.code !== code; }); list.unshift({ code: code, t: Date.now() });
  lsSet(KEY_RECENT, JSON.stringify(list.slice(0, 5)));
}
function createTable() { var nick = requireNick(); if (!nick) return; var vis = Lobby.pickedVis(); App.status = 'Apro un tavolo…'; run(async function () { var code = await Net.create(nick, { vis: vis }); await enterTable(code, nick); }); }
function joinTable(code) {
  code = (code || '').trim().toUpperCase();
  if (App.code === code && App.doc) { toTable(); return; }
  if (!/^[A-Z]{4}$/.test(code)) { toast('Il codice del tavolo ha 4 lettere.'); return; }
  var nick = requireNick(); if (!nick) return;
  App.status = 'Cerco il tavolo ' + code + '…'; run(function () { return enterTable(code, nick); });
}
async function enterTable(code, nick) {
  if (App.code && App.code !== code && App.doc) {
    var d0 = App.doc;
    if (d0.phase === 'lobby' && d0.seats.some(function (s) { return s.uid === Net.uid; })) {
      if (Net.isHost && !d0.seats.some(function (s) { return !s.bot && s.uid !== Net.uid; })) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
    }
  }
  App.code = code; App.doc = null; App.sheet = null; App.sel = []; App.botKey = null; App.sheetKey = null;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { Lobby.forget(code); if (App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; onDoc();
  }, function () { var sig = Net.connected + ':' + Net.hostAlive() + ':' + Net.isHost; if (sig !== App.netSig) { App.netSig = sig; render(); } });
  if (ok !== true) {
    App.screen = 'lobby'; App.code = null; lsSet(KEY_TABLE, null); if (ok === 'closed') Lobby.forget(code); render();
    throw ok === 'closed' ? 'Il tavolo ' + code + ' è stato chiuso. L’ho tolto dai tuoi tavoli recenti.' : 'Non riesco a raggiungere il tavolo ' + code + '. Se la connessione è lenta, riprova tra poco da «I tuoi tavoli recenti».';
  }
  lsSet(KEY_TABLE, code); remember(code);
  if (nick) { var out = await Net.send({ t: 'join', nick: nick }); if (out === 'spect' && myIdx() < 0) toast('La partita è già iniziata: la guardi da spettatore.'); }
  Nav.guard(code);
  Chat.reset();
}
function send(op) { return run(function () { return Net.send(op); }); }
function act(a) { App.sel = []; return send({ t: 'act', a: a }); }

/* ---------- tavolo in corso e gesto indietro ---------- */
function curTableHTML() {
  if (!App.code || !App.doc) return '<div id="curtable"></div>';
  var d = App.doc, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), host = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  var st = d.phase === 'play' ? 'partita in corso' : d.phase === 'over' ? 'partita finita' : 'in attesa · ' + d.seats.length + ' giocatori';
  return '<div id="curtable" class="notice" style="display:flex;gap:10px;align-items:center;flex-wrap:wrap"><span style="flex:1;min-width:180px">' + (seated ? 'Sei seduto al tavolo' : 'Stai guardando il tavolo') + ' <b>' + esc(d.code) + '</b>' + (host ? ' di ' + esc(host.nick) : '') + ' · ' + st + '</span><button class="btn small" data-act="totable">Torna al tavolo</button></div>';
}
function paintCur() { var el = document.getElementById('curtable'); if (el) el.outerHTML = curTableHTML(); }
function toTable() { if (!App.code) return; App.screen = 'table'; Nav.guard(App.code); if (App.doc) onDoc(); else render(); window.scrollTo(0, 0); }
function toHome() { if (history.state && history.state.ppTable) history.back(); else { App.screen = 'lobby'; render(); window.scrollTo(0, 0); } }
Nav.setup(function (state) {
  if (App.screen === 'table' && App.code) {
    if (App.sheet || (App.sel && App.sel.length)) { App.sheet = null; App.sel = []; render(); Nav.guard(App.code); return; }
    App.screen = 'lobby'; render(); window.scrollTo(0, 0); return;
  }
  if (state && state.ppTable && state.ppTable === App.code && App.doc) { App.screen = 'table'; onDoc(); }
});
function leaveTable(silent) {
  Chat.reset();
  var d = App.doc;
  if (!silent && d && d.phase === 'lobby' && d.seats.some(function (s) { return s.uid === Net.uid; })) {
    var humans = d.seats.filter(function (s) { return !s.bot && s.uid !== Net.uid; });
    if (Net.isHost && !humans.length) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
  }
  setTimeout(function () { Net.close(); }, 400);
  App.code = null; App.doc = null; lsSet(KEY_TABLE, null); history.replaceState(null, '', location.pathname);
  App.screen = 'lobby'; App.sheet = null; render();
}
function inviteLink() { return location.origin + location.pathname + '?t=' + App.code; }
function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(t); }); } catch (e) { toast(t); } }
function invite() {
  var url = inviteLink(), text = 'Siediti al mio tavolo di Gattomina: codice ' + App.code;
  if (navigator.share) { navigator.share({ title: 'Gattomina', text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}

/* ---------- l'host muove i giocatori automatici e chiude le finestre dei Soffio! ---------- */
function hostDo(check, a, who) {
  Net.hostApply(function (cur) {
    if (!cur || !cur.game || cur.phase !== 'play') return false;
    var gg = cur.game; if (!check(gg)) return false;
    var err = E.act(gg, who(gg), a(gg)); if (err) return false;
    if (gg.phase === 'over') cur.phase = 'over';
    return true;
  });
}
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game;
  if (g.pend) {
    var pk = App.code + ':' + g.pend.id + ':' + g.pend.chain.length;
    if (App.resolveKey !== pk) {
      App.resolveKey = pk; clearTimeout(App.resolveTimer);
      App.resolveTimer = setTimeout(function () {
        hostDo(function (gg) { return gg.pend && gg.pend.id + ':' + gg.pend.chain.length === pk.split(':').slice(1).join(':'); }, function () { return { a: 'resolve' }; }, function () { return 0; });
      }, Math.max(0, g.pend.until - Date.now()) + 120);
      // ogni giocatore automatico decide se soffiare, con un po' di "riflessi"
      g.players.forEach(function (P, i) {
        if (!P.bot || !E.canNope(g, i)) return;
        var a = BOT.decide(g, i); if (!a) return;
        setTimeout(function () { hostDo(function (gg) { return gg.pend && gg.pend.id + ':' + gg.pend.chain.length === pk.split(':').slice(1).join(':') && gg.players[i].bot && E.canNope(gg, i); }, function () { return { a: 'nope' }; }, function () { return i; }); }, 700 + Math.random() * 1900);
      });
    }
    return;
  }
  var d = E.decider(g);
  if (d == null || !g.players[d].bot) return;
  var key = App.code + ':' + g.seq;
  if (App.botKey === key) return;
  App.botKey = key; clearTimeout(App.botTimer);
  var wait = g.flash && (g.flash.kind === 'boom' || g.flash.kind === 'defuse') && g.flash.n === g.fx ? 2600 : 1100;
  App.botTimer = setTimeout(function () {
    hostDo(function (gg) { return gg.seq === g.seq && E.decider(gg) === d && gg.players[d].bot; }, function (gg) { return BOT.decide(gg, d) || { a: 'draw' }; }, function () { return d; });
  }, wait + Math.random() * 500);
}

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = App.doc.game, me = myIdx();
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g && me >= 0) {
    var P = g.players[me];
    App.sel = (App.sel || []).filter(function (c) { return P.hand.indexOf(c) >= 0; });
    if (g.turn !== me || g.pend || g.wait) App.sel = [];
    // fogli automatici quando devo scegliere qualcosa
    var w = g.wait, key = w && w.who === me ? 'w' + g.seq + w.type : g.peek && g.peek.p === me ? 'f' + g.peek.n : g.phase === 'over' ? 'over' : null;
    if (key && key !== App.sheetKey) {
      App.sheetKey = key;
      var kind = key.charAt(0) === 'w' ? w.type : key === 'over' ? 'over' : 'future';
      var delay = kind === 'insert' ? 3000 : kind === 'over' ? 2800 : kind === 'future' ? 700 : 300;
      setTimeout(function () { if (App.screen === 'table' && App.sheetKey === key && (!App.sheet || App.sheet.kind === 'rules')) { App.sheet = { kind: kind }; renderSheet(); } }, delay);
    }
    if (App.sheet && ['favor', 'insert', 'five'].indexOf(App.sheet.kind) >= 0 && !(w && w.who === me && w.type === App.sheet.kind)) App.sheet = null;
    if (App.sheet && (App.sheet.kind === 'target' || App.sheet.kind === 'name') && (g.turn !== me || g.pend || g.wait)) App.sheet = null;
  }
  render(); driveBots(); Turns.watch(App.doc);
}

/* ---------- render ---------- */
function connInfo(txt) { return Net.connected ? txt : '<span style="color:var(--bad)">Riconnessione…</span> ' + txt; }
function hostBanner() {
  var d = App.doc; if (!d || Net.isHost || Net.hostAlive()) return '';
  var h = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  return '<div class="notice red" style="margin:0 12px 6px">' + esc(h ? h.nick : 'L’host') + ' non risponde: forse ha chiuso il gioco o ha il telefono in standby. Tra pochi secondi il comando passa da solo a un altro giocatore, oppure prendilo tu adesso.<div class="row" style="margin-top:8px"><button class="btn small" data-act="takehost">Prendi il comando</button></div></div>';
}
function render() {
  var root = $('#app');
  if (App.screen === 'table' && App.doc && App.doc.game && App.doc.phase !== 'lobby') { Lobby.end(); TV.update(App.doc); renderSheet(); return; }
  TV.unmount();
  if (App.screen === 'gallery') { Lobby.end(); root.innerHTML = galleryHTML(); renderSheet(); return; }
  if (App.screen === 'lobby') root.innerHTML = lobbyHTML();
  else if (!App.doc) root.innerHTML = '<div class="wrap lobby"><p class="muted">' + esc(App.status || 'Mi siedo al tavolo…') + '</p></div>';
  else root.innerHTML = roomHTML();
  if (App.screen === 'lobby') Lobby.start(); else Lobby.end();
  renderSheet();
}
window.addEventListener('resize', function () { if (TV.mounted() && App.doc && App.doc.game) TV.update(App.doc); });

function lobbyHTML() {
  var ids = [CARDS.filter(function (c) { return c.t === 'scatoletta'; })[0].id, CARDS[0].id, CARDS.filter(function (c) { return c.t === 'soffio'; })[0].id];
  var fan = ids.map(function (id, i) { return GMCards.html(id).replace('class="card', 'style="transform:translateX(-50%) rotate(' + ((i - 1) * 13) + 'deg) translateX(' + ((i - 1) * 24) + 'px)" class="card'); }).join('');
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><a class="back-link" href="../">← Tutti i giochi</a>' + curTableHTML() +
    '<section class="hero"><div style="display:grid;gap:10px"><h1>Gattomina</h1><p class="tag">Pesca una carta alla volta e spera che non sia una Gattomina. L’ultimo che resta intero vince! Da 2 a 5 giocatori, ognuno dal proprio telefono.</p><p class="credit">Grafica: emoji 3D Noto di Google (licenza Apache 2.0)</p></div><div class="fan" aria-hidden="true">' + fan + '</div></section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin-top:6px">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div><div class="row"><button class="btn ghost small" data-act="gallery">Le carte</button><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, seats = '';
  for (var i = 0; i < 5; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava">' + GMCards.avatar(i) + '</div><div><div class="nm">' + esc(s.nick) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else seats += '<div class="seat"><div class="ava">·</div><div class="sub">Posto libero</div></div>';
  }
  return '<div class="topbar"><div class="wrap"><span class="brand">Gattomina</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi. Servono da 2 a 5 giocatori; i posti mancanti si riempiono con giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/5)</h2><div class="seats">' + seats + '</div>' + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= 5 ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (n < 2 ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < 2 ? '<p class="lead">Manca almeno un altro giocatore.</p>' : '<p class="lead">Nel mazzo ci saranno ' + (n - 1) + (n - 1 === 1 ? ' Gattomina' : ' Gattomine') + '.</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section></div>';
}
function galleryHTML() {
  return '<div class="topbar"><div class="wrap"><span class="brand">Gattomina</span><span class="info">Le 56 carte</span><button class="iconbtn" data-act="tolobby">Indietro</button></div></div><div class="wrap gallery"><div class="ggrid">' +
    D.ORDER.map(function (t) { return '<div class="gitem">' + GMCards.typeHTML(t) + '<span class="cnt">× ' + D.TYPES[t].count + '</span></div>'; }).join('') +
    '<div class="gitem">' + GMCards.back() + '<span class="cnt">dorso</span></div></div><p class="muted">Grafica: emoji 3D di Noto Emoji (Google), licenza Apache 2.0, composte in carte originali.</p></div>';
}

function statusLine(g, me) {
  var who = function (i) { return i === me ? 'tu' : '<b>' + esc(g.players[i].nick) + '</b>'; };
  if (g.phase === 'over') return g.winner === me ? '<b>Hai vinto!</b> Sei l’ultimo rimasto intero.' : 'Vince ' + who(g.winner) + ', l’ultimo rimasto intero.';
  var sel = App.sel || [];
  if (sel.length === 1 && g.turn === me) { var T0 = D.TYPES[E.ty(sel[0])]; return '<b>' + T0.n + '</b>: ' + T0.txt; }
  if (g.pend) {
    var f = g.pend, off = f.chain.length % 2 === 1;
    var what = f.kind === 'pair' ? 'una coppia' : f.kind === 'trio' ? 'un tris' : f.kind === 'five' ? 'cinque carte diverse' : tn(f.kind);
    return (f.by === me ? 'Hai giocato ' : who(f.by) + ' gioca ') + '<b>' + what + '</b>' + (f.target != null ? ' contro ' + who(f.target) : '') + (off ? ' — <b class="bad">annullata da un Soffio!</b>' : '') + '. ' + (E.canNope(g, me) ? 'Puoi rispondere con un Soffio!' : 'Qualcuno soffia?');
  }
  if (g.wait) {
    var w = g.wait;
    if (w.type === 'favor') return w.who === me ? '<b>Fusa!</b> Scegli una carta da regalare a ' + who(w.to) + '.' : who(w.who) + ' sceglie una carta da regalare a ' + who(w.to) + '.';
    if (w.type === 'insert') return w.who === me ? 'Rimetti la Gattomina nel mazzo dove vuoi: gli altri non vedranno dove.' : who(w.who) + ' sta nascondendo la Gattomina nel mazzo…';
    return w.who === me ? 'Scegli una carta dagli scarti.' : who(w.who) + ' fruga tra gli scarti.';
  }
  if (me >= 0 && !g.players[me].alive) return '👻 Sei esploso. Tocca a ' + who(g.turn) + '.';
  if (g.turn === me) return '<b>Tocca a te' + (g.turns > 1 ? ' (ancora ' + g.turns + ' turni)' : '') + '.</b> Gioca le carte che vuoi, poi pesca per finire il turno.';
  return 'Tocca a ' + who(g.turn) + (g.turns > 1 ? ' (' + g.turns + ' turni)' : '') + '.';
}

/* ---------- fogli ---------- */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  root.innerHTML = '<div class="sheet-back" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>';
}
function cardsGrid(ids, act, extra) { return '<div class="cards">' + ids.map(function (c, i) { return GMCards.html(c, '', 'data-act="' + act + '" data-cid="' + c + '"' + (extra ? ' ' + extra(c, i) : '')); }).join('') + '</div>'; }
function sheetBody(s) {
  var g = App.doc && App.doc.game, me = myIdx(), P = g && me >= 0 ? g.players[me] : null;
  if (s.kind === 'rules') return '<h2>Come si gioca</h2><div class="rules">' + RULES + '</div><button class="btn block" data-act="close">Ho capito</button>';
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button>' +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button>' +
      '<button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div><button class="btn block" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button><button class="btn block ghost" data-act="close">Annulla</button>';
  if (!g) return '';
  if (s.kind === 'target') {
    var kind = E.comboKind(App.sel || []);
    return '<h2>' + (kind === 'fusa' ? 'A chi chiedi le fusa?' : kind === 'trio' ? 'A chi chiedi la carta?' : 'A chi rubi una carta?') + '</h2><div class="plist">' +
      E.targets(g, me).map(function (i) { var Q = g.players[i]; return '<button class="pbtn" data-act="target" data-p="' + i + '"><span class="av">' + GMCards.avatar(i) + '</span><b>' + esc(Q.nick) + '</b><span>' + Q.hand.length + (Q.hand.length === 1 ? ' carta' : ' carte') + '</span></button>'; }).join('') +
      '</div><button class="btn block ghost" data-act="close">Annulla</button>';
  }
  if (s.kind === 'name') return '<h2>Quale carta chiedi a ' + esc(g.players[s.target].nick) + '?</h2><p class="lead">Se ce l’ha, deve dartela.</p><div class="cards small">' + D.ORDER.filter(function (t) { return t !== 'bomba'; }).map(function (t) { return GMCards.typeHTML(t, '').replace('class="card', 'data-act="name" data-t="' + t + '" class="card'); }).join('') + '</div><button class="btn block ghost" data-act="close">Annulla</button>';
  if (s.kind === 'favor' && P) return '<h2>Fusa! Regala una carta a ' + esc(g.players[g.wait.to].nick) + '</h2><p class="lead">Scegli tu quale: tocca la carta da dare.</p>' + cardsGrid(P.hand, 'give');
  if (s.kind === 'five') { var pool = g.disc.slice().reverse(), seen = {}; pool = pool.filter(function (c) { var t = E.ty(c); if (seen[t]) return false; seen[t] = 1; return true; }); return '<h2>Prendi una carta dagli scarti</h2>' + cardsGrid(pool, 'take'); }
  if (s.kind === 'insert') {
    var n = g.deck.length, v = s.pos == null ? 0 : s.pos;
    var label = v === 0 ? 'in cima (la pesca il prossimo!)' : v >= n ? 'in fondo al mazzo' : 'come ' + (v + 1) + 'ª carta dall’alto';
    return '<h2>Dove nascondi la Gattomina?</h2><p class="lead">' + (n === 1 ? 'Nel mazzo è rimasta 1 carta.' : 'Il mazzo ha ' + n + ' carte.') + ' Nessuno vedrà dove la metti.</p>' +
      '<div class="insert"><img src="' + GMCards.src('1f4a3') + '" alt=""><input type="range" id="inspos" min="0" max="' + n + '" value="' + v + '" aria-label="Posizione nel mazzo"><b id="inslbl">' + label + '</b></div>' +
      '<div class="row qpos"><button class="btn ghost small" data-act="inspick" data-pos="0">In cima</button><button class="btn ghost small" data-act="inspick" data-pos="1">2ª carta</button><button class="btn ghost small" data-act="inspick" data-pos="' + n + '">In fondo</button></div>' +
      '<button class="btn block" data-act="insertok">Nascondi qui</button><button class="btn block ghost" data-act="insertrand">Mettila a caso</button>';
  }
  if (s.kind === 'future' && g.peek && g.peek.p === me) return '<h2>La Sfera ti mostra…</h2><p class="lead">Le prime carte del mazzo, dalla prima in cima. Solo tu le vedi.</p><div class="cards future">' + g.peek.cards.map(function (c, i) { return '<div class="fut">' + GMCards.html(c) + '<span>' + (i + 1) + 'ª</span></div>'; }).join('') + '</div><button class="btn block" data-act="close">Ricevuto</button>';
  if (s.kind === 'player') {
    var Q = g.players[s.p];
    return '<h2>' + esc(Q.nick) + '</h2><p class="lead">' + (Q.alive ? Q.hand.length + (Q.hand.length === 1 ? ' carta in mano' : ' carte in mano') : 'È esploso.') + '</p>' +
      (App.doc.host === Net.uid && s.p !== me && Q.alive && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (Q.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') +
      '<button class="btn block" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'over' && g.phase === 'over') {
    var W = g.players[g.winner];
    return '<div class="over"><img class="crown" src="' + GMCards.src('1f3c6') + '" alt=""><h2>' + (g.winner === me ? 'Hai vinto!' : 'Vince ' + esc(W.nick)) + '</h2><p class="lead">L’ultimo rimasto intero al tavolo. Gli altri sono esplosi in ordine sparso.</p>' +
      (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + '<button class="btn block ghost" data-act="close">Guarda il tavolo</button></div>';
  }
  return '';
}

var RULES = '<p>Nel mazzo si nascondono le <b>Gattomine</b>: chi ne pesca una esplode ed esce dalla partita. Vince l’ultimo che resta intero.</p>' +
  '<h3>Il tuo turno</h3><ul><li>Gioca quante carte vuoi (anche nessuna).</li><li>Poi <b>pesca una carta</b>: è così che finisce il turno.</li><li>Se peschi una Gattomina e hai una <b>Scatoletta</b>, la calmi e la rimetti nel mazzo dove vuoi, di nascosto. Senza Scatoletta esplodi.</li></ul>' +
  '<h3>Le carte</h3><ul><li><b>Agguato</b>: finisci senza pescare; il prossimo fa 2 turni (se era già sotto Agguato, i turni si sommano: 4, 6…).</li><li><b>Pisolino</b>: finisci un turno senza pescare.</li><li><b>Fusa</b>: un giocatore ti regala una carta a sua scelta.</li><li><b>Gomitolo</b>: mescola il mazzo.</li><li><b>Sfera</b>: guardi le prime 3 carte del mazzo.</li><li><b>Soffio!</b>: annulla una carta appena giocata da chiunque, anche fuori turno. Dopo ogni carta giocata hai qualche secondo per soffiare; si può soffiare anche su un Soffio!. Non ferma Gattomina e Scatoletta.</li></ul>' +
  '<h3>I mici</h3><ul><li>Da soli non fanno nulla.</li><li><b>Due uguali</b>: rubi una carta a caso a un giocatore.</li><li><b>Tre uguali</b>: chiedi una carta precisa; se ce l’ha, te la deve dare.</li><li><b>Cinque carte diverse</b>: prendi la carta che vuoi dagli scarti.</li></ul>' +
  '<h3>All’inizio</h3><p>Ognuno riceve 7 carte e 1 Scatoletta. Nel mazzo ci sono tante Gattomine quanti i giocatori meno uno, più le Scatolette avanzate (solo 2 se siete in 2 o 3).</p>' +
  '<h3>Giocare online</h3><p>Chi apre il tavolo è l’host: il suo telefono tiene la partita e muove i giocatori automatici. Se si disconnette, gli altri possono prendere il comando dopo qualche secondo.</p>' +
  '<h3>Grafica</h3><p>Le illustrazioni sono emoji 3D di Noto Emoji di Google (licenza Apache 2.0), combinate in carte originali.</p>';

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act],[data-pl],.tv-hand .card');
  if (!el) return;
  var a = el.getAttribute('data-act'), g = App.doc && App.doc.game, me = myIdx();
  if (a === 'sheetback') { if (ev.target === el && App.sheet && ['favor', 'insert', 'five'].indexOf(App.sheet.kind) < 0) { App.sheet = null; renderSheet(); } return; }
  if (!a && el.hasAttribute('data-pl')) { App.sheet = { kind: 'player', p: +el.getAttribute('data-pl') }; renderSheet(); return; }
  if (!a && el.classList.contains('card')) {
    if (!g || me < 0) return;
    var c = +el.getAttribute('data-c');
    if (g.pend && E.canNope(g, me) && E.ty(c) === 'soffio') { act({ a: 'nope', card: c }); return; }
    if (g.turn !== me || g.pend || g.wait) { var T0 = D.TYPES[E.ty(c)]; toast(T0.n + ': ' + T0.s + '.'); return; }
    var i = App.sel.indexOf(c); if (i >= 0) App.sel.splice(i, 1); else App.sel.push(c);
    render(); return;
  }
  switch (a) {
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'gallery': App.screen = 'gallery'; render(); window.scrollTo(0, 0); break;
    case 'tolobby': App.screen = 'lobby'; render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'close': App.sheet = null; renderSheet(); break;
    case 'leave': App.sheet = null; leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + (el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i giocatori automatici.'); break;
    case 'auto': App.sheet = null; send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'resume': send({ t: 'back' }); break;
    case 'draw': case 'drawtap': if (g && g.turn === me && !g.pend && !g.wait && g.phase === 'play') act({ a: 'draw' }); break;
    case 'nope': act({ a: 'nope' }); break;
    case 'peek': App.sheet = { kind: 'future' }; renderSheet(); break;
    case 'decide': if (g && g.wait) { App.sheet = { kind: g.wait.type }; renderSheet(); } break;
    case 'playsel': {
      var sel = App.sel.slice(), kind = E.comboKind(sel);
      if (!kind) { toast('Si giocano una carta azione, due o tre carte uguali, o cinque carte diverse.'); break; }
      if (E.needsTarget(kind)) { if (!E.targets(g, me).length) { toast('Nessun avversario ha carte in mano.'); break; } App.sheet = { kind: 'target' }; renderSheet(); break; }
      act({ a: 'play', cards: sel }); break;
    }
    case 'target': {
      var tp = +el.getAttribute('data-p'), k2 = E.comboKind(App.sel);
      if (k2 === 'trio') { App.sheet = { kind: 'name', target: tp }; renderSheet(); break; }
      App.sheet = null; renderSheet(); act({ a: 'play', cards: App.sel.slice(), target: tp }); break;
    }
    case 'name': { var tgt = App.sheet.target; App.sheet = null; renderSheet(); act({ a: 'play', cards: App.sel.slice(), target: tgt, name: el.getAttribute('data-t') }); break; }
    case 'give': App.sheet = null; renderSheet(); act({ a: 'give', card: +el.getAttribute('data-cid') }); break;
    case 'take': App.sheet = null; renderSheet(); act({ a: 'take', card: +el.getAttribute('data-cid') }); break;
    case 'inspick': App.sheet.pos = +el.getAttribute('data-pos'); renderSheet(); break;
    case 'insertok': { var pos = App.sheet.pos || 0; App.sheet = null; renderSheet(); act({ a: 'insert', pos: pos }); break; }
    case 'insertrand': App.sheet = null; renderSheet(); act({ a: 'insert', pos: 'rand' }); break;
  }
});
document.addEventListener('input', function (ev) {
  if (ev.target.id === 'inspos' && App.sheet && App.sheet.kind === 'insert') {
    var v = +ev.target.value, n = +ev.target.max; App.sheet.pos = v;
    $('#inslbl').textContent = v === 0 ? 'in cima (la pesca il prossimo!)' : v >= n ? 'in fondo al mazzo' : 'come ' + (v + 1) + 'ª carta dall’alto';
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet && ['favor', 'insert', 'five'].indexOf(App.sheet.kind) < 0) { App.sheet = null; renderSheet(); }
});

/* ---------- avvio ---------- */
(function boot() {
  GMCards.preload();
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if (t === last || myNick()) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
