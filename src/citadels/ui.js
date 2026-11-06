/* ===== Citadels: interfaccia (sala d'attesa, regole del tavolo, giocatori automatici) ===== */
var E = CTEngine, BOT = CTBot, ART = CTArt, RU = CTRules;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, botKeys: {}, sheetKey: null, introShown: false, lastFxN: null, mode: null, hide: {} };
var BOTNAMES = ['Merlino', 'Ginevra', 'Lancillotto', 'Morgana', 'Galvano', 'Isotta', 'Tristano', 'Viviana', 'Percival', 'Ottone'];
var PCOL = ['#e8553f', '#3f8ee8', '#e8b833', '#3fb36a', '#a368e8', '#ff8a3d', '#2fbcbc'];
var MAXP = 7, MINP = 4, KEY_TABLE = 'cd-table', KEY_RECENT = 'cd-recent';
var IC = ART.icon;

function toast(msg, cls, ms) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 3200); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pcol(g, p) { return PCOL[g.players[p].col % PCOL.length]; }
function pname(g, p) { return '<b class="pn-c" style="--pc:' + pcol(g, p) + '">' + esc(g.players[p].nick) + '</b>'; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Giocatore';
      doc.opts = doc.opts || {}; if (doc.opts.timer == null) doc.opts.timer = 90;
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
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Cavaliere';
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
      if (!doc.seats.length) return { err: 'Non c’è nessuno al tavolo.' };
      var used2 = doc.seats.map(function (s) { return s.nick; });
      while (doc.seats.length < MINP) { var nb = BOTNAMES.filter(function (b) { return used2.indexOf(b) < 0; })[0] || 'Cavaliere ' + doc.seats.length; used2.push(nb); doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nb, bot: true }); }
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
function needsMe(g, me) {
  if (me < 0 || !g) return false;
  return g.phase !== 'over' && E.decider(g) === me;
}
function chName(r) { return r ? E.CH[r].n : ''; }
Coach.setup({ bots: 3,
  myTurn: function (g, me) { return needsMe(g, me); },
  tip: function (g, me, mine) {
    var P = g.players[me]; if (!P || !mine) return null;
    if (g.phase === 'pick') return 'Scegli il personaggio: guarda nella finestra quanto oro ti renderebbe ciascuno con la tua città. Se sei indietro, l’<b>Architetto</b> o il <b>Mago</b> ti danno carte; se hai tanti quartieri dello stesso colore, prendi il personaggio di quel colore.';
    var T = g.turn; if (!T) return null;
    if (T.r === 1 && !T.used.kill) return 'Sei l’<b>Assassino</b>: prima di tutto scegli chi uccidere. Pensa a chi conviene a chi è in testa (Mercante, Architetto, Re…).';
    if (T.r === 2 && !T.used.rob) return 'Sei il <b>Ladro</b>: scegli chi derubare. Il Mercante e chi ha tanto oro sono bersagli golosi.';
    if (!T.gathered) return 'Passo ① – prendi le risorse: <b>2 oro</b> se hai già carte buone da costruire, <b>2 carte</b> se la tua mano è vuota o troppo cara.';
    if (T.drawn) return 'Tieni la carta che ti serve di più: un tipo di quartiere che ti manca o uno che puoi costruire presto.';
    if (T.built < T.max && P.hand.some(function (id) { return !E.canBuild(g, me, id) && E.costOf(P, id) <= P.gold; })) return 'Passo ② – puoi costruire: tocca una carta della tua mano (si illuminano quelle che puoi pagare).';
    if (E.canIncome(g) && E.incomeOf(g, me, T.r)) return 'Ricordati di incassare l’oro dei tuoi quartieri: tocca <b>Incassa</b>.';
    return 'Hai fatto tutto il possibile: tocca <b>Fine turno</b>.';
  } });
Score.setup({ game: 'citadels', result: function (g) {
  if (!g.final) return null;
  var tot = g.final.sc.map(function (s) { return s.total; }), ord = g.final.order;
  return g.players.map(function (P, i) { return { won: (g.winners || []).indexOf(i) >= 0, place: ord.indexOf(i) + 1, score: tot[i] }; });
} });
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var g = cur.game; g.players[d].bot = true; g.players[d].away = true; Turns.awayLog(g, d); return true; }
});
Net.setLobbyInfo(function (d) { var o = d.opts || {}, notes = []; if (o.timer === 0) notes.push('senza timer'); return { max: MAXP, note: notes.join(', ') }; });
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
async function enterTable(code, nick) {
  if (App.code && App.code !== code && App.doc) {
    var d0 = App.doc;
    if (d0.phase === 'lobby' && d0.seats.some(function (s) { return s.uid === Net.uid; })) {
      if (Net.isHost && !d0.seats.some(function (s) { return !s.bot && s.uid !== Net.uid; })) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
    }
  }
  App.code = code; App.doc = null; App.gidSeen = false; App.sheet = null; App.mode = null; App.hide = {}; App.botKeys = {}; App.sheetKey = null; App.introShown = false; App.lastFxN = null; App.seenFirstDoc = false;
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
  App.code = null; App.doc = null; App.mode = null; lsSet(KEY_TABLE, null); history.replaceState(null, '', location.pathname);
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
      var a = BOT.decide(gg, p); if (!a) return false;
      var err = E.act(gg, p, a);
      if (err) {
        console.warn('automatico', err, a);
        var T = gg.turn, fb = gg.phase === 'pick' ? { a: 'pick', r: E.choices(gg)[0] } : !T ? null : !T.gathered ? { a: 'gold' } : T.drawn ? { a: 'keep', id: T.drawn[0] } : { a: 'end' };
        if (!fb || E.act(gg, p, fb)) return false;
      }
      if (gg.phase === 'over') cur.phase = 'over';
      return true;
    });
  }, wait);
}
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game, d = E.decider(g);
  if (d == null || !g.players[d] || !g.players[d].bot) return;
  var T = g.turn, wait = g.phase === 'pick' ? 1300 + Math.random() * 900 : !T || (!T.gathered && T.built === 0) ? 1700 + Math.random() * 500 : 1000 + Math.random() * 500;
  botStep(d, wait);
}
/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  // partita nuova sullo stesso tavolo (rivincita con le stesse persone): fogli, animazioni e suoni ripartono da zero
  if (App.gidSeen && App.doc.gid !== App.gid) { App.sheetKey = null; App.sheet = null; App.lastFxN = 0; App.hide = {}; App.mode = null; }
  App.gid = App.doc.gid; App.gidSeen = true;
  // il tavolo è tornato in sala d'attesa (nuova partita con le stesse persone): i contatori degli effetti ripartono da zero
  if (!g && App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    if (me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet('cd-intro-done')) App.sheet = { kind: 'intro', page: 0 }; }
    var s = App.sheet, T = g.turn, myT = g.phase === 'turns' && T && T.p === me;
    if (s && s.kind === 'pick' && !(g.phase === 'pick' && E.decider(g) === me)) App.sheet = null;
    if (s && s.kind === 'keep' && !(myT && T.drawn)) App.sheet = null;
    if (s && /^(kill|rob|magic|destroy|lab|den)$/.test(s.kind) && !myT) App.sheet = null;
    if (s && s.kind === 'card' && s.build && !myT) s.build = false;
  } else App.mode = null;
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
  var cs = [[{ r: 1 }, 'hc1'], [{ r: 4 }, 'hc2'], [{ d: RU.firstOf('Cattedrale').d }, 'hc3'], [{ r: 8 }, 'hc4'], [{ d: RU.firstOf('Porta del Drago').d }, 'hc5']];
  return '<div class="hero-art" aria-hidden="true"><div class="skyline">' + [3, 5, 2, 6, 4, 7, 3, 5].map(function (h, i) { return '<i style="--h:' + h + ';--i:' + i + '"></i>'; }).join('') + '</div><span class="hcrown">' + '<svg viewBox="-20 -16 40 30">' + ART.crownPath(0, 0, 1) + '</svg></span>' +
    cs.map(function (c) { return '<span class="hc ' + c[1] + '">' + ART.card(c[0]) + '</span>'; }).join('') + '</div>';
}
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">Intrighi a corte, torri e mercati</div><h1>Citadels</h1><p class="tagline">Ogni round scegli <b>in segreto</b> un personaggio: Assassino, Ladro, Mago, Re, Vescovo, Mercante, Architetto o Condottiero. Raccogli oro, costruisci i quartieri della tua città e manda a monte i piani degli altri. Il primo a <b>7 quartieri</b> chiude la partita. Da 4 a 7 giocatori, ognuno dal proprio telefono.</p></div>' + heroArt() + '</section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Come si gioca, in un minuto</h2>' + RU.section('goal') + RU.section('round') + RU.section('turn') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, seats = '';
  for (var i = 0; i < MAXP; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava" style="--pc:' + PCOL[i] + '">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else if (i < Math.max(4, n + 1)) seats += '<div class="seat"><div class="ava empty">·</div><div class="sub">Posto libero</div></div>';
  }
  return '<div class="topbar"><div class="wrap"><span class="brand">Citadels</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi. Da 4 a 7 giocatori (il gioco dà il meglio in 5 o 6): se siete in meno di 4, all’inizio i posti mancanti vengono presi da giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/' + MAXP + ')</h2><div class="seats">' + seats + '</div>' + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= MAXP ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start">Inizia la partita</button></div>' + '<p class="lead">' + (n < MINP ? 'Siete in ' + n + ': all’inizio arriveranno ' + (MINP - n) + (MINP - n === 1 ? ' giocatore automatico' : ' giocatori automatici') + ' per arrivare a 4. ' : '') + 'Una partita dura circa ' + (Math.max(n, MINP) * 8 + 10) + '–' + (Math.max(n, MINP) * 11 + 20) + ' minuti.</p>'
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + RU.section('goal') + RU.section('round') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
