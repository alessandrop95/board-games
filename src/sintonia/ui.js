/* ===== Sintonia: interfaccia (sala d'attesa con le squadre, regole del tavolo, giocatori automatici, tempo) ===== */
var E = STEngine, BOT = STBot, ART = STArt, RU = STRules, D = STData;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, botKeys: {}, sheetKey: null, introShown: false, lastFxN: null, hide: {}, off: 0, clock: null };
var BOTNAMES = ['Telepatia', 'Gemello', 'Eco', 'Specchio', 'Intesa', 'Affinità', 'Armonia', 'Accordo', 'Unisono', 'Coro', 'Sesto senso', 'Medium'];
var PCOL = ['#ff6b5a', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#16b5c4', '#c27a3a'];
var TCOL = ['#ff5a4e', '#3d8bfd', '#2fb36d', '#f2b705'];
var MAXP = 12, MINP = 3, KEY_TABLE = 'st-table', KEY_RECENT = 'st-recent';
var IC = ART.icon;

function toast(msg, cls, ms) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 3200); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pcol(g, p) { return PCOL[g.players[p].col % PCOL.length]; }
function tcol(g, t) { return g.opts.teams ? TCOL[g.teams[t].col % TCOL.length] : PCOL[g.teams[t].col % PCOL.length]; }
function pname(g, p) { return '<b class="pn-c" style="--pc:' + pcol(g, p) + '">' + esc(g.players[p].nick) + '</b>'; }
function tlabel(g, t) { return '<b class="pn-c" style="--pc:' + tcol(g, t) + '">' + esc(g.teams[t].name) + '</b>'; }
// l'ora dell'host vista da questo telefono (i telefoni possono avere l'orologio un po' diverso)
function hostNow() { return Date.now() + (Net.isHost ? 0 : App.off); }
function left(g) { return Math.max(0, g.until - hostNow()); }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function nTeams(doc) { var t = doc.opts && doc.opts.teams; return t == null ? 2 : +t; }
// la squadra con meno giocatori (per chi arriva)
function lightTeam(doc) { var n = nTeams(doc); if (!n) return 0; var c = []; for (var i = 0; i < n; i++) c.push(0); doc.seats.forEach(function (s) { if (s.team >= 0 && s.team < n) c[s.team]++; }); return c.indexOf(Math.min.apply(null, c)); }
function balance(doc) { var n = nTeams(doc); doc.seats.forEach(function (s, i) { s.team = n ? i % n : 0; }); }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  doc.opts = doc.opts || {}; if (doc.opts.rounds == null) doc.opts.rounds = 8; if (doc.opts.time == null) doc.opts.time = 30; if (doc.opts.teams == null) doc.opts.teams = 2;
  // il posto di chi apre il tavolo nasce senza squadra
  doc.seats.forEach(function (s) { if (s.team == null) s.team = lightTeam({ opts: doc.opts, seats: doc.seats.filter(function (x) { return x.team != null; }) }); });
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Giocatore';
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= MAXP) return { err: 'Il tavolo è pieno (' + MAXP + ' giocatori).' };
      doc.seats.push({ uid: from, nick: uniqueNick(doc.seats, nick), team: lightTeam(doc) }); return {};
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
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Sintonia';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true, team: lightTeam(doc) }); return {};
    }
    case 'team': {
      if (doc.phase !== 'lobby') return { changed: false };
      var s = doc.seats.filter(function (x) { return x.uid === (op.uid || from); })[0]; if (!s) return { changed: false };
      if (s.uid !== from && !isHost) return hostOnly;
      var n = nTeams(doc); if (!n) return { changed: false };
      s.team = ((+s.team || 0) + 1) % n; return {};
    }
    case 'shuffle': {
      if (!isHost) return hostOnly; if (doc.phase !== 'lobby') return { changed: false };
      var n2 = nTeams(doc), order = doc.seats.map(function (s, i) { return i; }); E.shuffle(order); order.forEach(function (i, k) { doc.seats[i].team = n2 ? k % n2 : 0; }); return {};
    }
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      if (op.rounds != null && E.OPT.rounds.indexOf(+op.rounds) >= 0) doc.opts.rounds = +op.rounds;
      if (op.time != null && E.OPT.time.indexOf(+op.time) >= 0) doc.opts.time = +op.time;
      if (op.teams != null && E.OPT.teams.indexOf(+op.teams) >= 0 && +op.teams !== doc.opts.teams) { doc.opts.teams = +op.teams; balance(doc); }
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
      if (doc.seats.length < MINP) return { err: 'Servono almeno ' + MINP + ' giocatori: aggiungi giocatori automatici.' };
      if (nTeams(doc)) { var cnt = {}; doc.seats.forEach(function (s) { cnt[s.team] = (cnt[s.team] || 0) + 1; }); var ks = Object.keys(cnt); if (ks.length < 2) return { err: 'Servono almeno due squadre: cambia la squadra a qualcuno.' }; if (ks.some(function (k) { return cnt[k] < 2; })) return { err: 'Ogni squadra ha bisogno di almeno 2 giocatori (anche automatici): la sintonia si cerca in due!' }; }
      doc.game = E.newGame(doc.seats.slice(), doc.opts, Date.now()); doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': if (!isHost) return hostOnly; if (!doc.game || !doc.game.players[op.p]) return { changed: false }; doc.game.players[op.p].bot = !!op.on; if (!op.on) doc.game.players[op.p].away = false; else doc.game.players[op.p].ready = true; return {};
    case 'nextround': if (!isHost) return hostOnly; if (!doc.game || !E.forceNext(doc.game, Date.now())) return { changed: false }; if (doc.game.phase === 'over') doc.phase = 'over'; return {};
    case 'act': {
      var g = doc.game; if (!g) return { err: 'La partita non è più disponibile.' };
      var p = -1; g.players.forEach(function (P, k) { if (P.uid === from) p = k; });
      if (p < 0) return { err: 'Stai solo guardando questa partita.' };
      if (g.players[p].bot && g.players[p].uid === from) { g.players[p].bot = false; g.players[p].away = false; }
      var err = E.act(g, p, op.a, Date.now()); if (err) return { err: err };
      if (g.phase === 'over') doc.phase = 'over';
      return {};
    }
  }
  return { err: 'Azione sconosciuta.' };
}
Net.setReducer(tableReducer);
function needsMe(g, me) {
  if (me < 0 || !g) return false;
  if (g.phase === 'write') return !g.players[me].ans;
  if (g.phase === 'show') return !g.players[me].ready;
  return false;
}
Coach.setup({ bots: 3, startText: 'Non hai mai giocato qui? Prova una partita con i giocatori automatici in squadra con te: ti spiego cosa fare.',
  myTurn: function (g, me) { return needsMe(g, me); },
  tip: function (g, me) {
    if (g.phase === 'show') return 'Guarda chi ha scritto la stessa cosa: più compagni in sintonia, più punti. Tocca <b>Avanti</b>.';
    return 'Scrivi la <b>prima cosa</b> che ti viene in mente per «' + esc(D.LIST[g.theme].q) + '». Pensa a cosa scriverebbero i tuoi compagni!';
  } });
Score.setup({ game: 'sintonia', result: function (g) {
  var place = g.final ? g.final.place : g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
  return g.players.map(function (P) { return { won: (g.winners || []).indexOf(P.team) >= 0, place: place[P.team], score: g.teams[P.team].total }; });
} });
Turns.setup({ decider: function (g) { return E.decider(g); }, onTimeout: function () { return false; } });
Net.setLobbyInfo(function (d) { var o = d.opts || {}, notes = []; notes.push(o.teams === 0 ? 'ognuno per sé' : (o.teams || 2) + ' squadre'); if (o.rounds && o.rounds !== 8) notes.push(o.rounds + ' temi'); return { max: MAXP, note: notes.join(', ') }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo, il tempo e i giocatori automatici.'); render(); });

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
function resetLocal() { App.sheetKey = null; App.sheet = null; App.lastFxN = null; App.hide = {}; App.roundKey = null; }
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
// le parole scritte partono senza bloccare lo schermo (si continua a scrivere nelle altre caselle)
function quiet(a) { return Net.send({ t: 'act', a: a }).catch(function (e) { if (typeof e === 'string') toast(esc(e), 'bad'); }); }

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

/* ---------- l'host muove i giocatori automatici e tiene il tempo ---------- */
function botStep(p, wait, tag) {
  var g = G(), key = App.code + ':' + g.round + ':' + g.phase + ':' + (tag || g.seq) + ':' + p;
  if (App.botKeys[p] === key) return; App.botKeys[p] = key;
  setTimeout(function () {
    Net.hostApply(function (cur) {
      if (!cur || !cur.game || cur.phase !== 'play') return false;
      var gg = cur.game; if (!gg.players[p] || !gg.players[p].bot) return false;
      var a = BOT.decide(gg, p); if (!a) return false;
      var err = E.act(gg, p, a, Date.now());
      if (err) { console.warn('automatico', err, a); return false; }
      if (gg.phase === 'over') cur.phase = 'over';
      return true;
    });
  }, wait);
}
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game;
  if (g.phase === 'write') g.players.forEach(function (P, p) { if (P.bot && !P.ans) botStep(p, 3000 + Math.random() * Math.min(12000, g.opts.time * 400), 'a'); });
  else if (g.phase === 'show') g.players.forEach(function (P, p) { if (P.bot && !P.ready) botStep(p, 1200, 'n'); });
}
// ogni mezzo secondo: l'host fa scadere il tempo; tutti aggiornano l'orologio
setInterval(function () {
  var d = App.doc, g = d && d.game;
  if (!g || d.phase !== 'play') return;
  if (Net.isHost && (g.phase === 'write' || g.phase === 'show') && Date.now() >= g.until) {
    Net.hostApply(function (cur) { var gg = cur && cur.game; if (!gg || !E.tick(gg, Date.now())) return false; if (gg.phase === 'over') cur.phase = 'over'; return true; });
  }
  if (App.screen === 'table' && window.Game) Game.clock();
}, 500);

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  // partita nuova sullo stesso tavolo (rivincita): gli effetti ripartono da zero, compreso il primo
  if (App.gidSeen && App.doc.gid !== App.gid) { resetLocal(); App.lastFxN = 0; }
  App.gid = App.doc.gid; App.gidSeen = true;
  if (!g && App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
  if (g && g.clock !== App.clock) { App.clock = g.clock; App.off = g.clock - Date.now(); }
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    if (me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet('st-intro-done')) App.sheet = { kind: 'intro', page: 0 }; }
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
  return '<div class="hero-art" aria-hidden="true"><div class="hero-q">Un frutto rosso</div><span class="hero-b b1">fragola</span><span class="hero-b b2">fragola</span><span class="hero-b b3">ciliegia</span><span class="hero-b b4">fragola</span></div>';
}
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">Vietato mettersi d’accordo!</div><h1>Sintonia</h1><p class="tag">Esce un tema e ognuno scrive di nascosto la prima cosa che gli viene in mente: la squadra fa punti quando i compagni scrivono la stessa parola. Quanto vi conoscete? Da 3 a 12 giocatori, anche a distanza.</p></div>' + heroArt() + '</section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Come si gioca, in 30 secondi</h2>' + RU.section('goal') + RU.section('points') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function optionsHTML(d, isHost) {
  var o = d.opts || {}, teams = o.teams == null ? 2 : o.teams, r = o.rounds || 8, tm = o.time || 30;
  var desc = (teams ? teams + ' squadre' : 'ognuno per sé') + ' · ' + r + ' temi · ' + tm + ' secondi per rispondere';
  if (!isHost) return '<p class="lead">Si gioca: <b>' + desc + '</b>.</p>';
  function sel(id, cur, list) { return '<select id="' + id + '" class="field" style="max-width:220px">' + list.map(function (k) { return '<option value="' + k[0] + '"' + (String(k[0]) === String(cur) ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select>'; }
  function opt(id, title, sub, cur, list) { return '<div class="tt-opt row"><label for="' + id + '" style="flex:1;min-width:160px"><b>' + title + '</b><br><span class="muted" style="font-size:14px">' + sub + '</span></label>' + sel(id, cur, list) + '</div>'; }
  return opt('opt-teams', 'Squadre', teams ? 'Punti quando i compagni scrivono la stessa cosa.' : 'Un punto per ogni altro giocatore con la tua risposta.', teams, [[2, '2 squadre'], [3, '3 squadre'], [4, '4 squadre'], [0, 'Ognuno per sé']]) +
    opt('opt-rounds', 'Temi', 'Uno per manche.', r, [[6, '6 temi'], [8, '8 temi'], [10, '10 temi'], [12, '12 temi']]) +
    opt('opt-time', 'Tempo', 'Per rispondere.', tm, [[20, '20 secondi'], [30, '30 secondi'], [45, '45 secondi']]);
}
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, nt = nTeams(d), seats = '';
  function seatHTML(s, i) {
    var mine = s.uid === Net.uid, canTeam = nt && (isHost || mine);
    return '<div class="seat full"><div class="ava" style="--pc:' + PCOL[i % PCOL.length] + '">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div style="flex:1;min-width:0"><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (mine ? ' · tu' : '') + '</div></div>' +
      (canTeam ? '<button class="chip tchip" style="--tc:' + TCOL[s.team || 0] + '" data-act="team" data-uid="' + esc(s.uid) + '" aria-label="Cambia squadra">' + IC('hand') + ' Cambia</button>' : '') +
      ((isHost && !mine) || (mine && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
  }
  if (nt) {
    for (var t = 0; t < nt; t++) {
      var list = d.seats.map(function (s, i) { return [s, i]; }).filter(function (x) { return (x[0].team || 0) === t; });
      seats += '<div class="tbox" style="--tc:' + TCOL[t] + '"><h3>' + E.TEAMS[t][0] + ' <span class="muted">(' + list.length + ')</span></h3>' + (list.length ? list.map(function (x) { return seatHTML(x[0], x[1]); }).join('') : '<p class="muted">Ancora nessuno: tocca «Cambia» per venire qui.</p>') + '</div>';
    }
    seats = '<div class="tboxes">' + seats + '</div>';
  } else seats = '<div class="seats">' + d.seats.map(seatHTML).join('') + '</div>';
  return '<div class="topbar"><div class="wrap"><span class="brand">Sintonia</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi, anche da un’altra città. Da 3 a 12 giocatori; nelle squadre si possono mettere giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/' + MAXP + ')</h2>' + seats + (nt && isHost && n > 2 ? '<button class="btn ghost small" data-act="shuffle" style="justify-self:start">Squadre a caso</button>' : '') + Lobby.roomHTML(d, isHost) + optionsHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= MAXP ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (n < MINP ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < MINP ? '<p class="lead">Servono almeno ' + MINP + ' giocatori: aggiungi giocatori automatici.</p>' : '<p class="lead">Dura circa ' + Math.round((d.opts.rounds || 8) * ((d.opts.time || 30) + 15) / 60) + ' minuti.</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.' + (nt ? ' Puoi cambiare squadra con «Cambia».' : '') + '</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + RU.section('goal') + RU.section('points') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
