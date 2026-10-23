/* ===== Presagio: interfaccia ===== */
var D = PRData, E = PREngine, BOT = PRBot, CARDS = PRData.CARDS;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, sel: null, busy: false, botKey: null, botTimer: null, lastFlash: 0, flashInit: false, sheetKey: null };
var BOTNAMES = ['Selene', 'Orfeo', 'Vega', 'Altair', 'Lyra', 'Castore', 'Mira', 'Sirio'];
var KEY_TABLE = 'pr-table', KEY_RECENT = 'pr-recent';

function toast(msg) { var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function myIdx() { var g = App.doc && App.doc.game; if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function suitName(s) { return D.SUITS[s].n; }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Veggente';
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= 6) return { err: 'Il tavolo è pieno (6 giocatori).' };
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
      if (doc.seats.length >= 6) return { err: 'Il tavolo è pieno.' };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Astro';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true }); return {};
    }
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      doc.opts = doc.opts || {};
      if (op.noEven != null) doc.opts.noEven = !!op.noEven;
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
      if (doc.seats.length < 3) return { err: 'Servono almeno 3 giocatori: aggiungi dei giocatori automatici.' };
      var seats = doc.seats.slice();
      for (var i = seats.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = seats[i]; seats[i] = seats[j]; seats[j] = t; }
      doc.game = E.newGame(seats, doc.opts); doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': if (!isHost) return hostOnly; if (!doc.game || !doc.game.players[op.p]) return { changed: false }; doc.game.players[op.p].bot = !!op.on; return {};
    case 'act': {
      var g = doc.game; if (!g) return { err: 'La partita non è più disponibile.' };
      var p = -1; g.players.forEach(function (P, k) { if (P.uid === from) p = k; });
      if (op.a && op.a.a === 'next' && g.phase === 'roundEnd' && (isHost || p === g.turn)) p = g.turn;
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
  onTimeout: function (cur, d) {
    var g = cur.game;
    // a fine mano non si penalizza nessuno: si passa semplicemente alla mano successiva
    if (g.phase === 'roundEnd') { if (E.act(g, d, { a: 'next' })) return false; return true; }
    g.players[d].bot = true; g.players[d].away = true; Turns.awayLog(g, d); return true;
  }
});
Net.setLobbyInfo(function (d) { var o = d.opts || {}, notes = []; if (o.noEven) notes.push('somma diversa'); if (o.timer === 0) notes.push('senza timer'); return { max: 6, note: notes.join(', ') }; });
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
  App.code = code; App.doc = null; App.flashInit = false; App.sheet = null; App.sel = null; App.botKey = null; App.sheetKey = null;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { Lobby.forget(code); if (App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; onDoc();
  }, function () { var sig = Net.connected + ':' + Net.hostAlive() + ':' + Net.isHost; if (sig !== App.netSig) { App.netSig = sig; render(); } });
  if (ok !== true) {
    App.screen = 'lobby'; App.code = null; lsSet('pr-table', null); if (ok === 'closed') Lobby.forget(code); render();
    throw ok === 'closed' ? 'Il tavolo ' + code + ' è stato chiuso. L’ho tolto dai tuoi tavoli recenti.' : 'Non riesco a raggiungere il tavolo ' + code + '. Se la connessione è lenta, riprova tra poco da «I tuoi tavoli recenti».';
  }
  lsSet(KEY_TABLE, code); remember(code);
  if (nick) { var out = await Net.send({ t: 'join', nick: nick }); if (out === 'spect' && myIdx() < 0) toast('La partita è già iniziata: la guardi da spettatore.'); }
  Nav.guard(code);
  Chat.reset();
}
function send(op) { return run(function () { return Net.send(op); }); }
function act(a) { App.sel = null; return send({ t: 'act', a: a }); }

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
    if (App.sheet || App.sel != null) { App.sheet = null; App.sel = null; render(); Nav.guard(App.code); return; }
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
  var url = inviteLink(), text = 'Siediti al mio tavolo di Presagio: codice ' + App.code;
  if (navigator.share) { navigator.share({ title: 'Presagio', text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}

/* ---------- giocatori automatici (li muove l'host) ---------- */
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game, d = E.decider(g);
  if (d == null || !g.players[d].bot) return;
  var key = App.code + ':' + g.seq;
  if (App.botKey === key) return;
  App.botKey = key; clearTimeout(App.botTimer);
  var wait = g.phase === 'roundEnd' ? 4200 : g.phase === 'bid' ? 800 : g.phase === 'trump' ? 1000 : (!g.trick.length && g.lastTrick ? 2300 : 1000);
  App.botTimer = setTimeout(function () {
    Net.hostApply(function (cur) {
      if (!cur || !cur.game || cur.phase !== 'play') return false;
      var gg = cur.game, dd = E.decider(gg);
      if (gg.seq !== g.seq || dd !== d || !gg.players[dd].bot) return false;
      var a = BOT.decide(gg, dd); if (!a || E.act(gg, dd, a)) return false;
      if (gg.phase === 'over') cur.phase = 'over';
      return true;
    });
  }, wait + Math.random() * 300);
}

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = App.doc.game;
  if (g && !App.flashInit) { App.lastFlash = g.flash ? g.flash.n : 0; App.flashInit = true; }
  if (!g) App.flashInit = false;
  if (App.screen !== 'table') { if (g && g.flash) App.lastFlash = Math.max(App.lastFlash, g.flash.n); driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    // fogli automatici: riepilogo di fine mano e fine partita
    var key = g.phase === 'roundEnd' ? 'r' + g.round : g.phase === 'over' ? 'over' : null;
    if (key && key !== App.sheetKey) { App.sheetKey = key; App.sheet = { kind: g.phase === 'over' ? 'over' : 'round' }; }
    if (!key && App.sheet && (App.sheet.kind === 'round' || App.sheet.kind === 'over')) App.sheet = null;
    if (App.sel != null && myIdx() >= 0 && g.players[myIdx()].hand.indexOf(App.sel) < 0) App.sel = null;
  } else if (App.sheet && (App.sheet.kind === 'round' || App.sheet.kind === 'over')) App.sheet = null;
  render(); driveBots(); Turns.watch(App.doc);
}
function playFlash() {
  var g = App.doc && App.doc.game; if (!g || !g.flash || g.flash.n <= App.lastFlash) return;
  App.lastFlash = g.flash.n;
  if (g.flash.kind === 'trick') {
    var el = document.querySelector('[data-pl="' + g.flash.p + '"]'); if (el) el.classList.add('flash');
    if (g.flash.p === myIdx()) { var s = document.createElement('div'); s.className = 'stamp'; s.textContent = 'Presa!'; document.body.appendChild(s); setTimeout(function () { s.remove(); }, 1400); }
  }
}

/* ---------- render ---------- */
function cardHTML(id, cls, attrs) { return PRCards.html(id, cls, attrs); }
function backHTML(style) { return PRCards.back('', style); }
function connInfo(txt) { return Net.connected ? txt : '<span style="color:var(--bad)">Riconnessione…</span> ' + txt; }
function hostBanner() {
  var d = App.doc; if (!d || Net.isHost || Net.hostAlive()) return '';
  var h = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  return '<div class="notice red">' + esc(h ? h.nick : 'L’host') + ' non risponde: forse ha chiuso il gioco o ha il telefono in standby. Tra pochi secondi il comando passa da solo a un altro giocatore, oppure prendilo tu adesso.<div class="row" style="margin-top:8px"><button class="btn small" data-act="takehost">Prendi il comando</button></div></div>';
}
function render() {
  var root = $('#app');
  if (App.screen === 'table' && App.doc && App.doc.game && App.doc.phase !== 'lobby') { Lobby.end(); TV.update(App.doc); renderSheet(); return; }
  TV.unmount();
  if (App.screen === 'lobby') root.innerHTML = lobbyHTML();
  else if (!App.doc) root.innerHTML = '<div class="wrap lobby"><p class="muted">' + esc(App.status || 'Mi siedo al tavolo…') + '</p></div>';
  else if (App.doc.phase === 'lobby' || !App.doc.game) root.innerHTML = roomHTML();
  if (App.screen === 'lobby') Lobby.start(); else Lobby.end();
  renderSheet();
}
window.addEventListener('resize', function () { if (TV.mounted()) TV.update(App.doc); });

function lobbyHTML() {
  var fan = [cardHTML(52), cardHTML(12), cardHTML(56)].map(function (h, i) { return h.replace('class="card', 'style="transform:translateX(-50%) rotate(' + ((i - 1) * 12) + 'deg) translateX(' + ((i - 1) * 20) + 'px)" class="card'); }).join('');
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><a class="back-link" href="../">← Tutti i giochi</a>' + curTableHTML() +
    '<section class="hero"><div style="display:grid;gap:10px"><h1>Presagio</h1><p class="tag">Prevedi quante prese farai, poi fanne esattamente quelle. Da 3 a 6 giocatori, ognuno dal proprio telefono.</p><p class="credit">Illustrazioni: incisioni di Gustave Doré e di antichi atlanti celesti, di pubblico dominio</p></div><div class="fan" aria-hidden="true">' + fan + '</div></section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:15px;font-family:var(--f-body);margin-top:6px">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + recentHTML() + '</div><div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div></div>';
}
function recentHTML() { return Lobby.recentRows(); }
Lobby.setRecentKey(KEY_RECENT);
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, seats = '';
  for (var i = 0; i < 6; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div><div class="nm">' + esc(s.nick) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else seats += '<div class="seat"><div class="ava">·</div><div class="sub">Posto libero</div></div>';
  }
  var noEven = !!(d.opts && d.opts.noEven);
  var rounds = n >= 3 ? 60 / Math.max(3, Math.min(6, n)) : 20;
  return '<div class="topbar"><div class="wrap"><span class="brand">Presagio</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi. Servono da 3 a 6 giocatori; i posti mancanti si riempiono con giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/6)</h2><div class="seats">' + seats + '</div>' +
    '<label class="switch' + (isHost ? '' : ' ro') + '"><input type="checkbox" id="opt-noeven"' + (noEven ? ' checked' : '') + (isHost ? '' : ' disabled') + '><span><b>Somma delle previsioni diversa dalle prese</b><br><span class="muted" style="font-size:15px">Il mazziere, che dichiara per ultimo, non può dire il numero che renderebbe la somma uguale alle prese della mano.</span></span></label>' +
    Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= 6 ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (n < 3 ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < 3 ? '<p class="lead">Mancano ' + (3 - n) + ' giocatori per iniziare.</p>' : '<p class="lead">In ' + n + ' si giocano ' + rounds + ' mani.</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') +
    '</section></div>';
}

function statusLine(g, me, sum, allBid, short) {
  var who = function (i) { return i === me ? 'tu' : esc(g.players[i].nick); };
  var pr = 'Previsioni: <b>' + sum + '</b> su ' + g.round + (g.round === 1 ? ' presa' : ' prese') + (allBid ? (sum > g.round ? ' · ne mancano per tutti' : sum < g.round ? ' · ne avanzano' : ' · somma pari') : '');
  if (short && g.phase !== 'roundEnd') pr = '';
  if (g.phase === 'over') return 'Partita finita.';
  if (g.phase === 'roundEnd') return 'Fine della mano ' + g.round + '. ' + pr;
  if (g.phase === 'trump') return 'Il mazziere (' + who(g.dealer) + ') sceglie la briscola.';
  if (g.phase === 'bid') return (g.turn === me ? '<b>Tocca a te prevedere.</b> ' : 'Prevede <b>' + who(g.turn) + '</b>. ') + pr + (g.opts.noEven ? ' · regola somma diversa' : '');
  return (g.turn === me ? '<b>Tocca a te.</b>' : 'Gioca <b>' + who(g.turn) + '</b>.') + ' ' + followNote(g, me) + ' ' + pr;
}
// Spiega quale colore va seguito nella presa in corso (o perché la carta è libera).
function followNote(g, me) {
  if (!g.trick.length) return g.turn === me ? 'Apri tu: gioca la carta che vuoi.' : '';
  var ls = E.leadSuit(g), opener = g.trick[0].p, by = opener === me ? 'hai aperto' : esc(g.players[opener].nick) + ' ha aperto';
  if (ls != null) return 'Si risponde a <b>' + suitName(ls) + '</b> (se non ne hai, carta libera; Arcimago e Giullare sempre).';
  var firstNonJ = g.trick.filter(function (t) { return CARDS[t.c].k !== 'j'; })[0];
  if (firstNonJ && CARDS[firstNonJ.c].k === 'w') return (firstNonJ === g.trick[0] ? by + ' con un Arcimago' : 'È uscito un Arcimago prima di qualsiasi colore') + ': <b>carta libera</b>, nessun colore da seguire.';
  return 'Finora solo Giullari: il colore lo decide la prima carta numerata.';
}
/* ---------- fogli ---------- */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  root.innerHTML = '<div class="sheet-back" data-act="sheetback"><div class="sheet" role="dialog" aria-modal="true">' + h + '</div></div>';
}
function scoreTable(g, onlyRound) {
  var head = '<tr><th>' + (onlyRound ? 'Giocatore' : 'Mano') + '</th>' + (onlyRound ? '<th>Previste</th><th>Prese</th><th>Mano</th><th>Tot.</th>' : g.players.map(function (P) { return '<th>' + esc(P.nick) + '</th>'; }).join('')) + '</tr>';
  var body = '';
  if (onlyRound) {
    var r = g.round - 1;
    body = g.players.map(function (P) { var h = P.hist[r]; return '<tr><td>' + esc(P.nick) + '</td><td>' + h.bid + '</td><td>' + h.tricks + '</td><td class="' + (h.delta >= 0 ? 'pos' : 'neg') + '">' + (h.delta > 0 ? '+' : '') + h.delta + '</td><td>' + h.score + '</td></tr>'; }).join('');
  } else {
    var n = g.players[0].hist.length;
    for (var i = 0; i < n; i++) body += '<tr><td>' + (i + 1) + '</td>' + g.players.map(function (P) { var h = P.hist[i]; return '<td><span class="' + (h.delta >= 0 ? 'pos' : 'neg') + '">' + (h.delta > 0 ? '+' : '') + h.delta + '</span><span class="small">' + h.tricks + '/' + h.bid + ' · ' + h.score + '</span></td>'; }).join('') + '</tr>';
    if (!n) body = '<tr><td colspan="' + (g.players.length + 1) + '" class="muted" style="text-align:left">Ancora nessuna mano conclusa.</td></tr>';
    body += '<tr class="tot"><td>Totale</td>' + g.players.map(function (P) { return '<td>' + P.score + '</td>'; }).join('') + '</tr>';
  }
  return '<div class="tbl-wrap"><table class="sc">' + head + body + '</table></div>';
}
function sheetBody(s) {
  var g = App.doc && App.doc.game, me = myIdx();
  if (s.kind === 'rules') return '<h2>Regole</h2><div class="rules">' + RULES + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'scores' && g) return '<h2>Punteggi</h2><p class="lead">In ogni casella: punti della mano, poi prese/previsione e totale.</p>' + scoreTable(g) + '<button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'round' && g && g.phase === 'roundEnd') {
    var can = g.turn === me || App.doc.host === Net.uid;
    return '<h2>Fine della mano ' + g.round + ' di ' + g.rounds + '</h2>' + scoreTable(g, true) +
      (can ? '<button class="btn block" data-act="next">Prossima mano</button>' : '<p class="lead">Attendi che ' + esc(g.players[g.turn].nick) + ' avvii la prossima mano.</p>') + '<button class="btn block ghost" data-act="close">Guarda il tavolo</button>';
  }
  if (s.kind === 'over' && g && g.phase === 'over') {
    var rank = g.players.map(function (P, i) { return { P: P, i: i }; }).sort(function (a, b) { return b.P.score - a.P.score; });
    return '<div class="winner">' + (g.winner.length > 1 ? 'Pari merito' : 'Vince ' + esc(g.players[g.winner[0]].nick)) + '</div>' +
      '<div class="tbl-wrap"><table class="sc"><tr><th>#</th><th class="l">Giocatore</th><th>Indovinate</th><th>Punti</th></tr>' + rank.map(function (r, k) { var ok = r.P.hist.filter(function (h) { return h.bid === h.tricks; }).length; return '<tr><td>' + (k + 1) + '</td><td class="l">' + esc(r.P.nick) + (r.i === me ? ' (tu)' : '') + '</td><td>' + ok + '/' + r.P.hist.length + '</td><td>' + r.P.score + '</td></tr>'; }).join('') + '</table></div>' +
      (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') +
      '<button class="btn block ghost" data-act="scores">Tutti i punteggi</button><button class="btn block ghost" data-act="close">Guarda il tavolo</button>';
  }
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
    '<button class="btn block" style="background:linear-gradient(180deg,#e0705e,#a63a2a);color:#fff" data-act="closeyes">Chiudi per tutti</button><button class="btn block ghost" data-act="close">Annulla</button>';
  if (s.kind === 'player' && g) {
    var P = g.players[s.p];
    return '<h2>' + esc(P.nick) + '</h2><p class="lead">' + P.score + ' punti · ' + (P.bid == null ? 'non ha ancora previsto' : 'ha previsto ' + P.bid + ', ne ha fatte ' + P.tricks) + ' · ' + P.hand.length + ' carte in mano</p>' +
      (App.doc.host === Net.uid && s.p !== me && g.phase !== 'over' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') +
      '<button class="btn block" data-act="close">Chiudi</button>';
  }
  return '';
}

var RULES = '<p>Si gioca con 60 carte: quattro casate (Fiamme, Maree, Foreste, Sabbie) con valori da 1 a 13, più 4 <b>Arcimaghi</b> e 4 <b>Giullari</b>.</p>' +
  '<h3>Le mani</h3><p>Nella prima mano ognuno riceve 1 carta, nella seconda 2 e così via, finché il mazzo basta: 20 mani in 3, 15 in 4, 12 in 5, 10 in 6. Il mazziere cambia ogni mano.</p>' +
  '<h3>La briscola</h3><ul><li>Dopo la distribuzione si scopre la prima carta del mazzo: il suo colore è la briscola.</li><li>Se è un Giullare non c’è briscola.</li><li>Se è un Arcimago, il mazziere sceglie il colore.</li><li>Nell’ultima mano non resta niente da scoprire: si gioca senza briscola.</li></ul>' +
  '<h3>La previsione</h3><p>A turno, partendo da chi siede dopo il mazziere, ognuno dichiara quante prese farà. Con la regola <b>somma diversa</b>, il mazziere non può dichiarare il numero che renderebbe la somma uguale alle prese della mano.</p>' +
  '<h3>Le prese</h3><ul><li>Apre chi siede dopo il mazziere; poi apre chi ha vinto l’ultima presa.</li><li>Bisogna rispondere al colore di chi apre, se lo si ha. Arcimaghi e Giullari si possono giocare sempre.</li><li>Se si apre con un Arcimago, gli altri giocano quello che vogliono. Se si apre con un Giullare, il colore lo decide la prima carta numerata.</li><li>Vince il primo Arcimago; altrimenti la briscola più alta; altrimenti la carta più alta del colore di uscita. Se tutti giocano Giullari, vince il primo.</li></ul>' +
  '<h3>Punti</h3><ul><li>Previsione esatta: 20 punti più 10 per ogni presa.</li><li>Previsione sbagliata: −10 per ogni presa di differenza.</li></ul>' +
  '<h3>Illustrazioni</h3><p>Incisioni di Gustave Doré (Inferno, La ballata del vecchio marinaio, la Bibbia, gli Idilli del re), il giullare Will Sommers, l’atlante celeste di Andreas Cellarius (1660) e l’incisione di Flammarion (1888): tutte di pubblico dominio, da Wikimedia Commons, rielaborate a luce.</p>' +
  '<h3>Giocare online</h3><p>Chi apre il tavolo è l’host: il suo telefono tiene la partita e muove i giocatori automatici. Se si disconnette, gli altri possono prendere il comando dopo qualche secondo. Le partite passano da un server pubblico gratuito: usa un soprannome.</p>';

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act],[data-pl],.tv-hand .card');
  if (!el) return;
  var a = el.getAttribute('data-act'), g = App.doc && App.doc.game, me = myIdx();
  if (a === 'sheetback') { if (ev.target === el) { App.sheet = null; renderSheet(); } return; }
  if (!a && el.hasAttribute('data-pl')) { App.sheet = { kind: 'player', p: +el.getAttribute('data-pl') }; renderSheet(); return; }
  if (!a && el.classList.contains('card')) {
    var c = +el.getAttribute('data-c');
    if (!g || g.phase !== 'play' || g.turn !== me) { return; }
    if (el.classList.contains('no')) { var ls = E.leadSuit(g); toast('Devi rispondere a ' + suitName(ls) + ': puoi giocare solo quel colore, un Arcimago o un Giullare.'); return; }
    if (App.sel === c) { act({ a: 'play', c: c }); return; }
    App.sel = c; render(); return;
  }
  switch (a) {
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'scores': App.sheet = { kind: 'scores' }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'close': App.sheet = null; renderSheet(); break;
    case 'leave': App.sheet = null; leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + (el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i giocatori automatici.'); break;
    case 'auto': App.sheet = null; send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'bid': act({ a: 'bid', b: +el.getAttribute('data-b') }); break;
    case 'trump': act({ a: 'trump', s: +el.getAttribute('data-s') }); break;
    case 'playsel': if (App.sel != null) act({ a: 'play', c: App.sel }); break;
    case 'next': App.sheet = null; act({ a: 'next' }); break;
    case 'resume': send({ t: 'back' }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-noeven') send({ t: 'opt', noEven: ev.target.checked });
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet) { App.sheet = null; renderSheet(); }
});

/* ---------- avvio ---------- */
(function boot() {
  PRCards.preload();
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if (t === last || myNick()) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
