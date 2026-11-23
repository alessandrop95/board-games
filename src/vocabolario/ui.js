/* ===== Vocabolario bugiardo: interfaccia (sala d'attesa, regole del tavolo, giocatori automatici, tempo) ===== */
var E = VBEngine, BOT = VBBot, ART = VBArt, RU = VBRules;
var IC = ART.icon;
var CFG = {
  key: 'vb', name: 'Vocabolario bugiardo', min: 3, max: 12, rule2: 'write',
  botNames: ['Dizionario', 'Accademico', 'Erudito', 'Lessico', 'Etimo', 'Glossario', 'Sillaba', 'Professore', 'Calamaio', 'Grammatica', 'Pergamena', 'Lemma'],
  kicker: 'Chi conosce la parola giusta?',
  tag: 'Esce una parola italiana vera e rarissima: ognuno inventa una definizione credibile e poi tutti cercano quella vera in mezzo alle bugie. Punti a chi indovina e a chi inganna gli altri. Da 3 a 12 giocatori, anche a distanza.',
  hero: function () { return ART.hero(); },
  defaults: function (o) { if (o.rounds == null) o.rounds = 6; if (o.time == null) o.time = 90; },
  setOpt: function (o, op) {
    if (op.rounds != null && E.OPT.rounds.indexOf(+op.rounds) >= 0) o.rounds = +op.rounds;
    if (op.time != null && E.OPT.time.indexOf(+op.time) >= 0) o.time = +op.time;
  },
  options: function (d, isHost) {
    var o = d.opts || {};
    if (!isHost) return '<p class="lead">Si gioca: <b>' + (o.rounds || 6) + ' parole · ' + (o.time || 90) + ' secondi per inventare</b>.</p>';
    return selOpt('opt-rounds', 'Manche', 'Quante parole si giocano.', o.rounds || 6, [[4, '4 parole (breve)'], [6, '6 parole'], [8, '8 parole'], [10, '10 parole (lunga)']]) +
      selOpt('opt-time', 'Tempo per inventare', 'Chi non scrive in tempo non ha una sua definizione, ma vota lo stesso.', o.time || 90, [[60, '60 secondi'], [90, '90 secondi'], [120, '2 minuti']]);
  },
  duration: function (d) { return 'Dura circa ' + Math.round((d.opts.rounds || 6) * ((d.opts.time || 90) + 70) / 60) + ' minuti.'; },
  drive: function (g) {
    if (g.phase === 'write') g.players.forEach(function (P, p) { if (P.bot && !P.def) botStep(p, 4000 + Math.random() * Math.min(14000, g.opts.time * 250), 'w' + g.round); });
    else if (g.phase === 'vote') g.players.forEach(function (P, p) { if (P.bot && P.vote == null && E.canVote(g, p)) botStep(p, 3000 + Math.random() * 9000, 'v' + g.round); });
  },
  playerSub: function (g, i) { var P = g.players[i]; return P.score + ' punti · ' + P.right + (P.right === 1 ? ' indovinata' : ' indovinate') + ' · ' + P.fooled + (P.fooled === 1 ? ' persona ingannata' : ' persone ingannate'); },
  overScore: function (g, p) { return g.players[p].score; },
  overLead: function (g) { return 'Dopo ' + g.round + ' parole rare.'; },
  overTable: function (g) {
    return '<div class="ranks">' + g.final.order.map(function (p) { var P = g.players[p]; return '<div class="rk" style="--pc:' + pcol(g, p) + '"><b>' + g.final.place[p] + '°</b><span>' + esc(P.nick) + '</span><small>' + P.score + ' punti · ' + P.right + ' indovinate · ' + P.fooled + ' ingannati</small></div>'; }).join('') + '</div>';
  },
  intro: [['Benvenuto a Vocabolario bugiardo', 'goal'], ['Inventare', 'write'], ['Votare', 'vote'], ['I punti', 'points']]
};
function needsMe(g, me) {
  if (me < 0 || !g) return false;
  var P = g.players[me];
  if (g.phase === 'write') return !P.def;
  if (g.phase === 'vote') return P.vote == null && E.canVote(g, me);
  if (g.phase === 'reveal') return !P.ready;
  return false;
}
Coach.setup({ bots: 3, startText: 'Non hai mai giocato qui? Prova una partita con i giocatori automatici: ti spiego cosa fare.',
  myTurn: function (g, me) { return needsMe(g, me); },
  tip: function (g, me) {
    var P = g.players[me]; if (!P) return null;
    if (g.phase === 'write') return P.def ? 'Definizione inviata: finché il tempo non scade puoi correggerla.' : 'Inventa una definizione credibile per «<b>' + esc(E.word(g)[0]) + '</b>» e tocca <b>Invia</b>.';
    if (g.phase === 'vote') return P.vote == null ? 'Tocca la definizione che secondo te è <b>vera</b>.' : 'Hai votato: aspetta gli altri (puoi cambiare voto).';
    if (g.phase === 'reveal') return 'Ecco la verità: guarda chi ha ingannato chi, poi tocca <b>Avanti</b>.';
    return null;
  } });
Score.setup({ game: 'vocabolario', result: function (g) {
  var place = g.final ? g.final.place : g.players.map(function (P) { return 1 + g.players.filter(function (Q) { return Q.score > P.score; }).length; });
  return g.players.map(function (P, i) { return { won: (g.winners || []).indexOf(i) >= 0, place: place[i], score: P.score }; });
} });
Turns.setup({ decider: function (g) { return E.decider(g); }, onTimeout: function () { return false; } });
Net.setLobbyInfo(function (d) { var o = d.opts || {}, notes = []; if (o.rounds && o.rounds !== 6) notes.push(o.rounds + ' parole'); if (o.time && o.time !== 90) notes.push(o.time + ' secondi per inventare'); return { max: CFG.max, note: notes.join(', ') }; });

/* ---------- parti comuni del tavolo (sala d'attesa senza squadre) ---------- */
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, botKeys: {}, sheetKey: null, introShown: false, lastFxN: null, hide: {}, off: 0, clock: null };
var KEY_TABLE = CFG.key + '-table', KEY_RECENT = CFG.key + '-recent', MAXP = CFG.max, MINP = CFG.min;
var PCOL = ['#ff6b5a', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#16b5c4', '#c27a3a', '#7bc043', '#e86f2a'];
function toast(msg, cls, ms) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 3200); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pcol(g, p) { return PCOL[g.players[p].col % PCOL.length]; }
function pname(g, p) { return '<b class="pn-c" style="--pc:' + pcol(g, p) + '">' + esc(g.players[p].nick) + '</b>'; }
function hostNow() { return Date.now() + (Net.isHost ? 0 : App.off); }
function left(g) { return Math.max(0, g.until - hostNow()); }
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }

function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  doc.opts = doc.opts || {}; CFG.defaults(doc.opts);
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Giocatore';
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= MAXP) return { err: 'Il tavolo è pieno (' + MAXP + ' giocatori).' };
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
      if (doc.seats.length >= MAXP) return { err: 'Il tavolo è pieno.' };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = CFG.botNames.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Automatico';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true }); return {};
    }
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      CFG.setOpt(doc.opts, op); return {};
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
      doc.game = E.newGame(doc.seats.slice(), doc.opts, Date.now()); doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': if (!isHost) return hostOnly; if (!doc.game || !doc.game.players[op.p]) return { changed: false }; doc.game.players[op.p].bot = !!op.on; if (!op.on) doc.game.players[op.p].away = false; return {};
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
// mosse che partono senza bloccare lo schermo
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

/* ---------- l'host muove i giocatori automatici ---------- */
function botStep(p, wait, tag) {
  var g = G(), key = App.code + ':' + g.turnN + ':' + g.phase + ':' + (tag || g.seq) + ':' + p;
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
  CFG.drive(doc.game);
}
// ogni mezzo secondo: l'host fa scadere il tempo; tutti aggiornano l'orologio
setInterval(function () {
  var d = App.doc, g = d && d.game;
  if (!g || d.phase !== 'play') return;
  if (Net.isHost && g.until && Date.now() >= g.until) {
    Net.hostApply(function (cur) { var gg = cur && cur.game; if (!gg || !E.tick(gg, Date.now())) return false; if (gg.phase === 'over') cur.phase = 'over'; return true; });
  }
  if (App.screen === 'table' && window.Game) Game.clock();
}, 500);

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  if (App.gidSeen && App.doc.gid !== App.gid) { App.botKeys = {}; resetLocal(); App.lastFxN = 0; }
  App.gid = App.doc.gid; App.gidSeen = true;
  if (!g && App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
  if (g && g.clock !== App.clock) { App.clock = g.clock; App.off = g.clock - Date.now(); }
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g && me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet(CFG.key + '-intro-done')) App.sheet = { kind: 'intro', page: 0 }; }
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
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">' + CFG.kicker + '</div><h1>' + CFG.name + '</h1><p class="tag">' + CFG.tag + '</p></div><div class="hero-art" aria-hidden="true">' + CFG.hero() + '</div></section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Come si gioca, in 30 secondi</h2>' + RU.section('goal') + RU.section(CFG.rule2) + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function selOpt(id, title, sub, cur, list) {
  return '<div class="tt-opt row"><label for="' + id + '" style="flex:1;min-width:160px"><b>' + title + '</b><br><span class="muted" style="font-size:14px">' + sub + '</span></label><select id="' + id + '" class="field" style="max-width:220px">' +
    list.map(function (k) { return '<option value="' + k[0] + '"' + (String(k[0]) === String(cur) ? ' selected' : '') + '>' + k[1] + '</option>'; }).join('') + '</select></div>';
}
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length;
  function seatHTML(s, i) {
    var mine = s.uid === Net.uid;
    return '<div class="seat full"><div class="ava" style="--pc:' + PCOL[i % PCOL.length] + '">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div style="flex:1;min-width:0"><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (mine ? ' · tu' : '') + '</div></div>' +
      ((isHost && !mine) || (mine && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
  }
  return '<div class="topbar"><div class="wrap"><span class="brand">' + CFG.name + '</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi, anche da un’altra città. Da ' + MINP + ' a ' + MAXP + ' giocatori, anche automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/' + MAXP + ')</h2><div class="seats">' + d.seats.map(seatHTML).join('') + '</div>' + Lobby.roomHTML(d, isHost) + CFG.options(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= MAXP ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (n < MINP ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < MINP ? '<p class="lead">Servono almeno ' + MINP + ' giocatori: aggiungi giocatori automatici.</p>' : '<p class="lead">' + CFG.duration(d) + '</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + RU.section('goal') + RU.section(CFG.rule2) + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}

/* ---------- finestre comuni ---------- */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; root._s = null; root._h = null; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  var same = root._s === s;
  if (!same) { root._s = s; App.sheetAt = Date.now(); }
  if (same && root._h === h) return;
  var sc = same && root.querySelector('.sheet') ? root.querySelector('.sheet').scrollTop : 0;
  root.innerHTML = '<div class="sheet-back' + (same ? ' still' : '') + '" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>'; root._h = h;
  if (sc) root.querySelector('.sheet').scrollTop = sc;
  if (s.kind === 'rules' && s.focus) { var t = document.getElementById('r-' + s.focus); if (t) t.scrollIntoView({ block: 'start' }); }
  s.fresh = false;
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function sheetBody(s) {
  var g = G(), me = myIdx();
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button>' +
      (g ? '<button class="btn ghost block" data-act="players">Giocatori e punteggi</button><button class="btn ghost block" data-act="log">Tutte le mosse</button>' : '') +
      Awake.menuHTML('btn ghost block') +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? pcol(g, l.p) : 'rgba(255,215,94,.5)'; return '<div class="fl k-' + l.k + '" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'players') {
    var isHost = App.doc.host === Net.uid;
    return '<h2>Giocatori</h2><div style="display:grid;gap:6px">' + g.players.map(function (P, i) {
      return '<div class="seat full"><div class="ava" style="--pc:' + pcol(g, i) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</div><div style="flex:1;min-width:0"><div class="nm">' + Net.dot(P.uid) + esc(P.nick) + (i === me ? ' (tu)' : '') + '</div><div class="sub">' + CFG.playerSub(g, i) + (P.away ? ' · assente: gioca l’automatico' : P.bot ? ' · automatico' : '') + '</div></div>' +
        (isHost && i !== me && g.phase !== 'over' ? '<button class="btn ghost small" data-act="auto" data-p="' + i + '">' + (P.bot ? 'Ridai il controllo' : 'Automatico') + '</button>' : '') + '</div>';
    }).join('') + '</div>' + closeBtn();
  }
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return CFG.sheet ? CFG.sheet(s, g, me) : '';
}
function overBody(g, me) {
  var W = g.winners, order = g.final.order, place = g.final.place, iw = W.indexOf(me) >= 0;
  var podium = order.slice(0, 3).map(function (p, k) { return '<div class="pod p' + (k + 1) + '" style="--pc:' + pcol(g, p) + '"><span class="pv big">' + esc(g.players[p].nick.charAt(0).toUpperCase()) + '</span><b>' + esc(g.players[p].nick) + '</b><span class="pod-s">' + CFG.overScore(g, p) + '</span><span class="pod-b">' + place[p] + '</span></div>'; }).join('');
  var title = iw ? 'Hai vinto!' : W.length > 1 ? 'Pari tra ' + W.map(function (p) { return esc(g.players[p].nick); }).join(' e ') : 'Vince ' + esc(g.players[W[0]].nick);
  return '<div class="over"><span class="over-logo">' + ART.logo() + '</span><h2>' + title + '</h2><p class="lead">' + CFG.overLead(g) + '</p>' +
    '<div class="podium">' + podium + '</div>' + CFG.overTable(g) +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var pages = CFG.intro.map(function (x) { return [x[0], RU.S[x[1]][1]]; });
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si gioca!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- eventi comuni ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), s = App.sheet;
  switch (a) {
    case 'sheetback': if (ev.target === el && s && s.kind !== 'intro' && Date.now() - (App.sheetAt || 0) > 450) { App.sheet = null; renderSheet(); } return;
    case 'create': createTable(); return;
    case 'join': joinTable($('#joincode').value); return;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); return;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); return;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); return;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); return; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r'), back: s && s.kind !== 'help' ? s : null }; renderSheet(); return;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); return;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); return;
    case 'players': App.sheet = { kind: 'players' }; renderSheet(); return;
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); return;
    case 'intronext': s.page++; renderSheet(); return;
    case 'introprev': s.page--; renderSheet(); return;
    case 'introdone': lsSet(CFG.key + '-intro-done', '1'); App.sheet = s.after || null; renderSheet(); return;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); return;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else App.sheet = null; renderSheet(); return;
    case 'leave': App.sheet = null; if (Exit.ask()) renderSheet(); else leaveTable(); return;
    case 'invite': App.sheet = null; renderSheet(); invite(); return;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); return;
    case 'addbot': send({ t: 'addbot' }); return;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); return;
    case 'start': send({ t: 'start' }); return;
    case 'rematch': App.sheet = null; App.sheetKey = null; send({ t: 'rematch' }); return;
    case 'totable': toTable(); return;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); return;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); return; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); return;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } return;
    case 'takehost': App.sheet = null; renderSheet(); if (!Net.takeHost()) { toast('Solo chi è seduto al tavolo può prendere il comando.'); return; } toast('Ora sei tu a reggere il tavolo, il tempo e i giocatori automatici.'); return;
    case 'auto': App.sheet = null; renderSheet(); send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); return;
    case 'resume': send({ t: 'back' }); return;
    case 'nextround': send({ t: 'nextround' }); return;
  }
  if (CFG.click) CFG.click(a, el, ev);
});
document.addEventListener('change', function (ev) {
  var id = ev.target.id;
  if (id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  else if (id && id.indexOf('opt-') === 0) { var op = { t: 'opt' }; op[id.slice(4)] = ev.target.value; send(op); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape') { if (App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); } }
});
// avvio: dopo che tutti i file sono stati caricati
window.addEventListener('DOMContentLoaded', function boot() {
  document.body.insertAdjacentHTML('afterbegin', ART.defs());
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || myNick()) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
});
