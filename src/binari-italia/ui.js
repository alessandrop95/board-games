/* ===== Binari d'Italia: interfaccia (tavolo, sala d'attesa, giocatori automatici) ===== */
var D = BIData, E = BIEngine, BOT = BIBot, ART = BIArt, RU = BIRules;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, botKeys: {}, sheetKey: null, sel: null, focus: null, lastTurnKey: null, introShown: false, handOpen: true };
var BOTNAMES = ['Littorina', 'Vaporiera', 'Frecciarossa', 'Direttissimo', 'Settebello', 'Caimano', 'Pendolino', 'Centoporte'];
var KEY_TABLE = 'bi-table', KEY_RECENT = 'bi-recent';
var IC = ART.icon;

function toast(msg, cls) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3400); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pname(g, p) { var P = g.players[p]; return '<b class="pn-c" style="--pc:' + D.PCOL[P.col].c + '">' + esc(P.nick) + '</b>'; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function cn(id) { return D.cities[id].n; }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Viaggiatore';
      doc.opts = doc.opts || {}; if (doc.opts.timer == null) doc.opts.timer = 90;
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
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Automotrice';
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
      doc.game = E.newGame(doc.seats.slice(), doc.opts || {}); doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': if (!isHost) return hostOnly; if (!doc.game || !doc.game.players[op.p]) return { changed: false }; doc.game.players[op.p].bot = !!op.on; if (!op.on) doc.game.players[op.p].away = false; return {};
    case 'act': {
      var g = doc.game; if (!g) return { err: 'La partita non è più disponibile.' };
      var p = -1; g.players.forEach(function (P, k) { if (P.uid === from) p = k; });
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
Coach.setup({ bots: 2,
  myTurn: function (g, me) { return g.stage === 'setup' ? !g.players[me].ready : E.decider(g) === me; },
  tip: function (g, me, mine) {
    var P = g.players[me]; if (!P) return null;
    if (g.stage === 'setup' && !P.ready) return 'Scegli quali <b>biglietti</b> tenere (almeno 2). Ogni biglietto collega due città: se le colleghi con i tuoi binari guadagni i punti, altrimenti li perdi a fine partita.';
    if (!mine) return null;
    if (g.stage === 'draw2') return 'Prendi la <b>seconda carta</b> vagone (dal mazzo o scoperta, ma non una locomotiva scoperta).';
    if (g.stage === 'tickets') return 'Scegli quali dei <b>nuovi biglietti</b> tenere (almeno 1).';
    return 'Nel tuo turno fai <b>una sola cosa</b>: pesca 2 carte vagone, oppure conquista una <b>tratta</b> pagando carte del suo colore (le locomotive valgono come jolly), oppure prendi nuovi biglietti. Ti restano <b>' + P.trains + '</b> vagoni.';
  } });
Score.setup({ game: 'binari-italia', result: function (g) {
  var o = g.final ? g.final.order : [], rows = g.final ? g.final.rows : [];
  return g.players.map(function (P, i) { var k = o.indexOf(i), r = rows.filter(function (x) { return x.p === i; })[0]; return { won: k === 0, place: k >= 0 ? k + 1 : null, score: r ? r.total : null }; });
} });
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var g = cur.game; g.players[d].bot = true; g.players[d].away = true; Turns.awayLog(g, d); return true; }
});
Net.setLobbyInfo(function (d) { var o = d.opts || {}, notes = []; if (o.timer === 0) notes.push('senza timer'); return { max: 5, note: notes.join(', ') }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo e muovi i giocatori automatici.'); render(); });

/* ---------- connessione al tavolo ---------- */
async function run(p) { if (App.busy) return; App.busy = true; paintBusy(); try { await p(); } catch (e) { toast(esc(typeof e === 'string' ? e : (e && e.message) || 'Qualcosa è andato storto. Riprova.'), 'bad'); Sound.play('error'); } finally { App.busy = false; paintBusy(); if (App.screen !== 'table' || !G()) render(); } }
function paintBusy() { document.body.classList.toggle('busy', !!App.busy); }
function requireNick() {
  if (window.Account && !Account.allow()) return null; // con il server attivo serve l'account
  var n = ($('#nick') && $('#nick').value.trim()) || myNick();
  if (!n) { toast('Scrivi il tuo nome.'); if ($('#nick')) { $('#nick').focus(); $('#nick').scrollIntoView({ block: 'center' }); } return null; }
  lsSet('pp-nick', n.slice(0, 18)); return n.slice(0, 18);
}
function remember(code) { var list = []; try { list = JSON.parse(lsGet(KEY_RECENT) || '[]'); } catch (e) {} list = list.filter(function (x) { return x.code !== code; }); list.unshift({ code: code, t: Date.now() }); lsSet(KEY_RECENT, JSON.stringify(list.slice(0, 5))); }
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
  App.code = code; App.doc = null; App.sheet = null; App.sel = null; App.focus = null; App.botKeys = {}; App.sheetKey = null; App.introShown = false; App.lastFxN = null;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { Lobby.forget(code); if (App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; onDoc();
  }, function () { var sig = Net.connected + ':' + Net.hostAlive() + ':' + Net.isHost + ':' + Net.presenceSig(); if (sig !== App.netSig) { App.netSig = sig; render(); } });
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
function act(a) { return send({ t: 'act', a: a }); }

function curTableHTML() {
  if (!App.code || !App.doc) return '<div id="curtable"></div>';
  var d = App.doc, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), host = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  var st = d.phase === 'play' ? 'partita in corso' : d.phase === 'over' ? 'partita finita' : 'in attesa · ' + d.seats.length + ' giocatori';
  return '<div id="curtable" class="notice row"><span style="flex:1;min-width:180px">' + (seated ? 'Sei seduto al tavolo' : 'Stai guardando il tavolo') + ' <b>' + esc(d.code) + '</b>' + (host ? ' di ' + esc(host.nick) : '') + ' · ' + st + '</span><button class="btn small" data-act="totable">Torna al tavolo</button></div>';
}
function paintCur() { var el = document.getElementById('curtable'); if (el) el.outerHTML = curTableHTML(); }
function toTable() { if (!App.code) return; App.screen = 'table'; Nav.guard(App.code); if (App.doc) onDoc(); else render(); window.scrollTo(0, 0); }
function toHome() { if (history.state && history.state.ppTable) history.back(); else { App.screen = 'lobby'; render(); window.scrollTo(0, 0); } }
Nav.setup(function (state) {
  if (App.screen === 'table' && App.code) {
    if (App.sheet || App.sel != null || App.focus) { App.sheet = null; App.sel = null; App.focus = null; render(); Nav.guard(App.code); return; }
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
  App.screen = 'lobby'; App.sheet = null; App.sel = null; App.focus = null; render();
}
function inviteLink() { return location.origin + location.pathname + '?t=' + App.code; }
function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(esc(t)); }); } catch (e) { toast(esc(t)); } }
function invite() {
  var url = inviteLink(), text = 'Siediti al mio tavolo di ' + document.title + ': codice ' + App.code;
  if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}

/* ---------- l'host muove i giocatori automatici ---------- */
function hostDo(check, a, who) {
  Net.hostApply(function (cur) {
    if (!cur || !cur.game || cur.phase !== 'play') return false;
    var gg = cur.game; if (!check(gg)) return false;
    var aa = a(gg); if (!aa) return false;
    var err = E.act(gg, who, aa);
    if (err) { console.warn('automatico', err, aa); var alt = E.canDrawAny(gg, gg.stage === 'draw2') ? { a: 'draw', i: 'deck' } : gg.tdeck.length && gg.stage === 'act' ? { a: 'tickets' } : { a: 'pass' }; if (E.act(gg, who, alt)) return false; }
    if (gg.phase === 'over') cur.phase = 'over';
    return true;
  });
}
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game, list = [];
  if (g.stage === 'setup') g.players.forEach(function (P, i) { if (P.bot && !P.ready) list.push(i); });
  else { var d = E.decider(g); if (d != null && g.players[d].bot) list.push(d); }
  list.forEach(function (p, k) {
    var key = App.code + ':' + g.seq + ':' + p;
    if (App.botKeys[p] === key) return;
    App.botKeys[p] = key;
    var wait = g.stage === 'setup' ? 900 + k * 500 : g.stage === 'draw2' ? 800 : 1300;
    setTimeout(function () {
      hostDo(function (gg) { return gg.phase === 'play' && gg.players[p].bot && (gg.stage === 'setup' ? !gg.players[p].ready : E.decider(gg) === p); }, function (gg) { return BOT.decide(gg, p); }, p);
    }, wait + Math.random() * 500);
  });
}

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    var P = me >= 0 ? g.players[me] : null, key = null, kind = null;
    if (g.phase === 'over') { key = 'over' + App.code; kind = 'over'; }
    else if (P && g.stage === 'setup' && !P.ready) { key = 'keep-setup' + App.code; kind = 'keep'; }
    else if (P && g.stage === 'tickets' && g.turn === me) { key = 'keep' + g.seq; kind = 'keep'; }
    if (key && key !== App.sheetKey && !(App.sheet && App.sheet.kind === 'intro')) { App.sheetKey = key; App.sheet = { kind: kind, sel: P && P.offer ? P.offer.slice() : [] }; App.sel = null; }
    if (App.sheet && App.sheet.kind === 'keep' && kind !== 'keep') App.sheet = null;
    if (App.sheet && App.sheet.kind === 'route' && (g.claims[App.sheet.r] != null && App.sheet.seq !== g.seq)) { /* resta aperta: mostra il nuovo proprietario */ }
    // presentazione delle regole la prima volta
    if (me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet('bi-intro-done')) { App.sheet = { kind: 'intro', page: 0, after: App.sheet }; } }
    // turno nuovo
    var tk = g.stage === 'act' ? g.turn + ':' + g.seq : null;
    if (g.phase === 'play' && g.stage === 'act' && g.turn === me && App.lastTurnKey !== 'me' + g.round + ':' + g.turn && App.seenFirstDoc) { Sound.play('turn'); banner('Tocca a te!'); }
    if (g.stage === 'act' && g.turn === me) App.lastTurnKey = 'me' + g.round + ':' + g.turn;
    sounds(g, me);
    App.seenFirstDoc = true;
  }
  render(); driveBots(); Turns.watch(App.doc);
}
function sounds(g, me) {
  if (App.lastFxN === g.fxN) return; var first = App.lastFxN == null; App.lastFxN = g.fxN; if (first) return;
  (g.fx || []).forEach(function (e) {
    if (e.k === 'claim') { var r = D.byId[e.r]; Sound.play(r.ferry ? 'ferry' : 'claim', { n: r.len }); if (r.len >= 5) setTimeout(function () { Sound.play('whistle'); }, 500); }
    else if (e.k === 'draw') Sound.play('draw');
    else if (e.k === 'tdraw') Sound.play('tickets');
    else if (e.k === 'keep') Sound.play('keep');
    else if (e.k === 'wipe') { Sound.play('wipe'); toast('Tre locomotive scoperte: le carte visibili vengono cambiate.'); }
    else if (e.k === 'reshuffle') toast('Mazzo finito: gli scarti sono stati rimescolati.');
    else if (e.k === 'last') { Sound.play('last'); banner('Ultimo giro!'); }
    else if (e.k === 'start') { Sound.play('whistle'); }
    else if (e.k === 'over') Sound.play('win');
  });
}
function banner(t) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2300); }

/* ---------- render principale ---------- */
function connInfo(txt) { return Net.connected ? txt : '<span class="bad">Riconnessione…</span> ' + txt; }
function hostBanner() {
  var d = App.doc; if (!d || Net.isHost || Net.hostAlive()) return '';
  var h = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  return '<div class="notice red">' + esc(h ? h.nick : 'L’host') + ' non risponde: forse ha chiuso il gioco o ha il telefono in standby. Tra pochi secondi il comando passa da solo a un altro giocatore, oppure prendilo tu adesso. <button class="btn small" data-act="takehost">Prendi il comando</button></div>';
}
function render() {
  var root = $('#app');
  if (App.screen === 'table' && App.doc && App.doc.game && App.doc.phase !== 'lobby') { Lobby.end(); Game.render(); renderSheet(); return; }
  Game.unmount();
  if (App.screen === 'lobby') root.innerHTML = lobbyHTML();
  else if (!App.doc) root.innerHTML = '<div class="wrap lobby"><p class="muted">' + esc(App.status || 'Mi siedo al tavolo…') + '</p></div>';
  else root.innerHTML = roomHTML();
  if (App.screen === 'lobby') Lobby.start(); else Lobby.end();
  renderSheet();
}
function heroArt() {
  return '<div class="hero-cards" aria-hidden="true"><div class="hc1">' + ART.card('R') + '</div><div class="hc2">' + ART.card('L') + '</div><div class="hc3">' + ART.card('B') + '</div>' +
    '<div class="hc4">' + ART.ticket(D.tickets.filter(function (t) { return t.a === 'milano' && t.b === 'roma'; })[0] || D.tickets[0]) + '</div></div>';
}
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ART.DEFS + '</svg><div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">Carta delle strade ferrate</div><h1>Binari d’Italia</h1><p class="tag">Collega le città d’Italia con le tue linee ferroviarie, da Aosta a Palermo. Raccogli i vagoni del colore giusto, conquista le tratte prima degli altri e completa i biglietti segreti. Da 2 a 5 giocatori, ognuno dal proprio telefono.</p></div>' + heroArt() + '</section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Come si gioca, in 30 secondi</h2>' + RU.section('goal') + RU.section('turn') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, seats = '';
  for (var i = 0; i < 5; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava">' + ART.pieceIcon(i, 40) + '</div><div><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + ' · vagoni ' + D.PCOL[i].n.toLowerCase() + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else seats += '<div class="seat"><div class="ava empty">·</div><div class="sub">Posto libero</div></div>';
  }
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ART.DEFS + '</svg><div class="topbar"><div class="wrap"><span class="brand">Binari d’Italia</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi. Servono da 2 a 5 giocatori; i posti mancanti si possono riempire con giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/5)</h2><div class="seats">' + seats + '</div>' + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= 5 ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (n < 2 ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < 2 ? '<p class="lead">Manca almeno un altro giocatore.</p>' : '<p class="lead">Una partita dura circa ' + (n * 8 + 15) + '–' + (n * 12 + 25) + ' minuti.</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + RU.section('goal') + RU.section('turn') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
