/* ===== Briscola: interfaccia (sala d'attesa con le coppie, regole del tavolo, giocatori automatici) =====
   Le parti che cambiano da un gioco di carte all'altro (Briscola, Scopa) sono in CFG. */
var CFG = {
  game: 'briscola', key: 'br', title: 'Briscola', E: BREngine, BOT: BRBot, RU: BRRules,
  botNames: ['Briscolone', 'Settebello', 'Asso', 'Cavallo', 'Fante', 'Carico', 'Liscio', 'Tressette'],
  defaults: { match: 2, signs: true },
  opt: function (doc, op) { if (op.match != null && [1, 2, 3].indexOf(+op.match) >= 0) doc.opts.match = +op.match; if (op.signs != null) doc.opts.signs = !!op.signs; },
  lobbyNote: function (o) { return [o.match === 1 ? 'una mano' : 'chi vince ' + (o.match || 2) + ' mani', o.signs === false ? 'senza segni' : ''].filter(Boolean).join(', '); },
  kicker: 'Il gioco di carte italiano, anche in coppia', heroCards: [0, 12, 27, 39, 10],
  tagline: 'Asso, tre, re, cavallo, fante: prendi più di 60 punti con il tuo compagno, ognuno dal proprio telefono e anche a distanza. Si può giocare uno contro uno o due contro due, con i segni al compagno.',
  quick: ['goal', 'trick'],
  optionsHTML: function (d, isHost) {
    var o = d.opts || {}, m = o.match || 2;
    if (!isHost) return '<p class="lead">Si gioca: <b>' + (m === 1 ? 'una mano' : 'vince chi fa prima ' + m + ' mani') + '</b>' + (o.signs === false ? ', <b>senza segni</b>' : ', con i segni al compagno') + '.</p>';
    return optRow('opt-match', 'Partita', 'Quante mani bisogna vincere.', m, [[1, 'Una mano'], [2, 'Chi vince 2 mani'], [3, 'Chi vince 3 mani']]) +
      optRow('opt-signs', 'Segni al compagno', 'In 4: messaggi veloci che vede solo il compagno.', o.signs === false ? 0 : 1, [[1, 'Ammessi'], [0, 'Vietati']]);
  },
  tip: function (g, me) {
    if (g.phase === 'scores') return 'Mano finita: guarda i punti e tocca <b>Prossima mano</b>.';
    if (g.turn !== me) return null;
    var bs = E.SN[E.suit(g.bris)];
    if (!g.trick.length) return 'Tocca a te cominciare: gioca una carta che vale poco (un liscio), e tieni le briscole (' + bs + ') per prendere i punti.';
    return 'Briscola: <b>' + bs + '</b>. Se la mano è del tuo compagno puoi dargli punti; se è degli avversari prendila solo se ne vale la pena.';
  }
};
var E = CFG.E, BOT = CFG.BOT, ART = ITArt, RU = CFG.RU;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, botKeys: {}, sheetKey: null, introShown: false, lastFxN: null, hide: {}, sel: null, linger: null };
var PCOL = ['#ff6b5a', '#3d8bfd', '#2fb36d', '#f2b705'], TCOL = ['#ff5a4e', '#3d8bfd'], PAIRS = ['Coppia rossa', 'Coppia blu'];
var MAXP = 4, MINP = 2, KEY_TABLE = CFG.key + '-table', KEY_RECENT = CFG.key + '-recent';
var IC = function (k) { return ICONS[k] ? '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + ICONS[k] + '</svg>' : ''; };
var ICONS = {
  help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
  check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
  hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4 16l-1.2-3a1.4 1.4 0 0 1 2.5-1.3L8 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>',
  eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'
};

function toast(msg, cls, ms) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 3200); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pcol(g, p) { return PCOL[g.players[p].col % PCOL.length]; }
function pname(g, p) { return '<b class="pn-c" style="--pc:' + pcol(g, p) + '">' + esc(g.players[p].nick) + '</b>'; }
function sideName(g, t) { return esc(E.tname(g, t)); }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function lightPair(seats) { var c = [0, 0]; seats.forEach(function (s) { if (s.team === 0 || s.team === 1) c[s.team]++; }); return c[0] <= c[1] ? 0 : 1; }
// in 4 si siede alternando le coppie: A1 B1 A2 B2 (i compagni di fronte)
function seatOrder(seats) {
  if (seats.length !== 4) return seats.slice();
  var a = seats.filter(function (s) { return s.team === 0; }), b = seats.filter(function (s) { return s.team === 1; });
  return [a[0], b[0], a[1], b[1]];
}
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  doc.opts = doc.opts || {}; Object.keys(CFG.defaults).forEach(function (k) { if (doc.opts[k] == null) doc.opts[k] = CFG.defaults[k]; }); if (doc.opts.timer == null) doc.opts.timer = 60;
  doc.seats.forEach(function (s) { if (s.team == null) s.team = lightPair(doc.seats.filter(function (x) { return x.team != null; })); });
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Giocatore';
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= MAXP) return { err: 'Il tavolo è pieno (' + MAXP + ' giocatori).' };
      doc.seats.push({ uid: from, nick: uniqueNick(doc.seats, nick), team: lightPair(doc.seats) }); return {};
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
      if (doc.seats.length >= MAXP) return { err: 'Il tavolo è pieno.' };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = CFG.botNames.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Mazziere';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true, team: lightPair(doc.seats) }); return {};
    }
    case 'team': {
      if (doc.phase !== 'lobby') return { changed: false };
      var s = doc.seats.filter(function (x) { return x.uid === (op.uid || from); })[0]; if (!s) return { changed: false };
      if (s.uid !== from && !isHost) return hostOnly;
      s.team = s.team ? 0 : 1; return {};
    }
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      if (op.timer != null) doc.opts.timer = Math.max(0, Math.min(600, +op.timer || 0));
      CFG.opt(doc, op); return {};
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
      if (doc.seats.length !== 2 && doc.seats.length !== 4) return { err: 'Si gioca in 2 o in 4: aggiungi o togli un giocatore (anche automatico).' };
      if (doc.seats.length === 4 && doc.seats.filter(function (s) { return s.team === 0; }).length !== 2) return { err: 'In 4 si gioca a coppie: servono due giocatori per coppia.' };
      doc.game = E.newGame(seatOrder(doc.seats), doc.opts); doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': if (!isHost) return hostOnly; if (!doc.game || !doc.game.players[op.p]) return { changed: false }; doc.game.players[op.p].bot = !!op.on; if (!op.on) doc.game.players[op.p].away = false; else if (doc.game.phase === 'scores') doc.game.players[op.p].ready = true; return {};
    case 'nextround': if (!isHost) return hostOnly; if (!doc.game || !E.forceNext(doc.game)) return { changed: false }; return {};
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
function needsMe(g, me) {
  if (me < 0 || !g) return false;
  if (g.phase === 'scores') return !g.players[me].ready;
  return E.decider(g) === me;
}
Coach.setup({ bots: 3, myTurn: function (g, me) { return needsMe(g, me); }, tip: function (g, me) { return CFG.tip ? CFG.tip(g, me) : null; } });
Score.setup({ game: CFG.game, result: function (g) {
  var place = g.final ? g.final.place : [1, 1];
  return g.players.map(function (P, i) { var t = E.team(g, i); return { won: (g.winners || []).indexOf(t) >= 0, place: place[t] || 2, score: CFG.score ? CFG.score(g, t) : (g.wins ? g.wins[t] : 0) }; });
} });
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var g = cur.game; g.players[d].bot = true; g.players[d].away = true; Turns.awayLog(g, d); return true; }
});
Net.setLobbyInfo(function (d) { return { max: MAXP, note: CFG.lobbyNote(d.opts || {}) }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo e muovi i giocatori automatici.'); render(); });

/* ---------- connessione al tavolo ---------- */
async function run(p) { if (App.busy) return; App.busy = true; paintBusy(); try { await p(); } catch (e) { toast(esc(typeof e === 'string' ? e : (e && e.message) || 'Qualcosa è andato storto. Riprova.'), 'bad'); Sound.play('no'); } finally { App.busy = false; paintBusy(); if (App.screen !== 'table' || !G()) render(); } }
function paintBusy() { document.body.classList.toggle('busy', !!App.busy); }
function requireNick() {
  if (window.Account && !Account.allow()) return null;
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
function resetLocal() { App.sheetKey = null; App.sheet = null; App.lastFxN = null; App.hide = {}; App.sel = null; App.linger = null; }
async function enterTable(code, nick) {
  if (App.code && App.code !== code && App.doc) {
    var d0 = App.doc;
    if (d0.phase === 'lobby' && d0.seats.some(function (s) { return s.uid === Net.uid; })) {
      if (Net.isHost && !d0.seats.some(function (s) { return !s.bot && s.uid !== Net.uid; })) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
    }
  }
  App.code = code; App.doc = null; App.gidSeen = false; resetLocal(); App.botKeys = {}; App.introShown = false; App.seenFirstDoc = false;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { Lobby.forget(code); if (App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; onDoc();
  }, function () { var sig = Net.connected + ':' + Net.hostAlive() + ':' + Net.isHost + ':' + Net.presenceSig(); if (sig !== App.netSig) { App.netSig = sig; render(); } });
  if (ok !== true) {
    App.screen = 'lobby'; App.code = null; lsSet(KEY_TABLE, null); if (ok === 'closed') Lobby.forget(code); render();
    throw ok === 'private' ? 'Il tavolo ' + code + ' è privato: entri solo con l’invito personale di chi l’ha aperto.' : ok === 'closed' ? 'Il tavolo ' + code + ' è stato chiuso. L’ho tolto dai tuoi tavoli recenti.' : 'Non riesco a raggiungere il tavolo ' + code + '. Se la connessione è lenta, riprova tra poco da «I tuoi tavoli recenti».';
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
    if (App.sheet) { App.sheet = null; render(); Nav.guard(App.code); return; }
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
function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(esc(t)); }); } catch (e) { toast(esc(t)); } }
function invite() {
  var url = inviteLink(), text = 'Siediti al mio tavolo di ' + document.title + ': codice ' + App.code;
  if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}

/* ---------- l'host muove i giocatori automatici ---------- */
function botStep(p, wait) {
  var g = G(), key = App.code + ':' + g.seq + ':' + p;
  if (App.botKeys[p] === key) return; App.botKeys[p] = key;
  setTimeout(function () {
    Net.hostApply(function (cur) {
      if (!cur || !cur.game || cur.phase !== 'play') return false;
      var gg = cur.game; if (!gg.players[p] || !gg.players[p].bot) return false;
      if (BOT.sign) { var s = BOT.sign(gg, p); if (s) E.act(gg, p, s); }
      var a = BOT.decide(gg, p); if (!a) return false;
      var err = E.act(gg, p, a);
      if (err) { console.warn('automatico', err, a); return false; }
      if (gg.phase === 'over') cur.phase = 'over';
      return true;
    });
  }, wait);
}
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game, d = E.decider(g);
  if (d != null && g.players[d].bot) botStep(d, (g.trick && !g.trick.length ? 1500 : 1100) + Math.random() * 700);
  else if (g.phase === 'scores' && g.players.every(function (P) { return P.ready || P.bot; })) {
    var key = App.code + ':next:' + g.hand; if (App.botKeys.next === key) return; App.botKeys.next = key;
    setTimeout(function () { Net.hostApply(function (cur) { return !!(cur && cur.game && cur.game.phase === 'scores' && E.forceNext(cur.game)); }); }, 5000);
  }
}

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  if (App.gidSeen && App.doc.gid !== App.gid) resetLocal();
  App.gid = App.doc.gid; App.gidSeen = true;
  if (!g && App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    if (me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet(CFG.key + '-intro-done')) App.sheet = { kind: 'intro', page: 0 }; }
    if (App.sel != null && (me < 0 || g.players[me].hand.indexOf(App.sel) < 0)) App.sel = null;
    if (App.sheet && App.sheet.kind === 'round' && g.phase !== 'scores' && g.phase !== 'over') App.sheet = null;
  }
  render(); if (g) Game.fx(g, me); driveBots(); Turns.watch(App.doc);
  if (g) App.seenFirstDoc = true;
}

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
  var cs = CFG.heroCards || [0, 12, 27, 39, 10];
  return '<div class="hero-art" aria-hidden="true">' + cs.map(function (c, i) { return '<span class="hc hc' + (i + 1) + '">' + ART.flat(c) + '</span>'; }).join('') + '</div>';
}
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">' + CFG.kicker + '</div><h1>' + CFG.title + '</h1><p class="tag">' + CFG.tagline + '</p></div>' + heroArt() + '</section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Come si gioca, in 30 secondi</h2>' + CFG.quick.map(RU.section).join('') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function sel(id, cur, list) { return '<select id="' + id + '" class="field" style="max-width:220px">' + list.map(function (k) { return '<option value="' + k[0] + '"' + (String(k[0]) === String(cur) ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>'; }
function optRow(id, title, sub, cur, list) { return '<div class="tt-opt row"><label for="' + id + '" style="flex:1;min-width:160px"><b>' + title + '</b><br><span class="muted" style="font-size:14px">' + sub + '</span></label>' + sel(id, cur, list) + '</div>'; }
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, four = n >= 3, seats = '';
  function seatHTML(s, i) {
    var mine = s.uid === Net.uid;
    return '<div class="seat full"><div class="ava" style="--pc:' + PCOL[i % PCOL.length] + '">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div style="flex:1;min-width:0"><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (mine ? ' · tu' : '') + '</div></div>' +
      (four && (isHost || mine) ? '<button class="chip tchip" style="--tc:' + TCOL[s.team ? 1 : 0] + '" data-act="team" data-uid="' + esc(s.uid) + '">' + IC('hand') + ' Cambia coppia</button>' : '') +
      ((isHost && !mine) || (mine && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
  }
  if (four) {
    for (var t = 0; t < 2; t++) {
      var list = d.seats.map(function (s, i) { return [s, i]; }).filter(function (x) { return (x[0].team || 0) === t; });
      seats += '<div class="tbox" style="--tc:' + TCOL[t] + '"><h3>' + PAIRS[t] + ' <span class="muted">(' + list.length + '/2)</span></h3>' + list.map(function (x) { return seatHTML(x[0], x[1]); }).join('') + '</div>';
    }
    seats = '<div class="tboxes">' + seats + '</div>';
  } else seats = '<div class="seats">' + d.seats.map(seatHTML).join('') + '</div>';
  var okN = n === 2 || n === 4;
  return '<div class="topbar"><div class="wrap"><span class="brand">' + CFG.title + '</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi, anche da lontano. Si gioca in 2 (uno contro uno) o in 4 (due coppie); i posti vuoti si riempiono con giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/' + MAXP + ')</h2>' + seats + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) + CFG.optionsHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= MAXP ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (okN ? '' : ' disabled') + '>Inizia la partita</button></div>' + (okN ? '' : '<p class="lead">Si gioca in 2 o in 4: aggiungi giocatori automatici.</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.' + (four ? ' Puoi cambiare coppia.' : '') + '</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + CFG.quick.map(RU.section).join('') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
