/* ===== Catan: interfaccia (tavolo, sala d'attesa, giocatori automatici) ===== */
var D = CTData, E = CTEngine, BOT = CTBot, ART = CTArt, RU = CTRules;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, botKeys: {}, sheetKey: null, pick: null, introShown: false, lastFxN: null };
var BOTNAMES = ['Mercante', 'Pastorella', 'Boscaiolo', 'Mugnaia', 'Fornaciaio', 'Minatrice', 'Navigatore', 'Esploratrice'];
var KEY_TABLE = 'ct-table', KEY_RECENT = 'ct-recent';
var IC = ART.icon;

function toast(msg, cls) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, 3400); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pname(g, p) { var P = g.players[p]; return '<b class="pn-c" style="--pc:' + D.PCOL[P.col].c + '">' + esc(P.nick) + '</b>'; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Colono';
      doc.opts = doc.opts || {}; if (doc.opts.timer == null) doc.opts.timer = 90; if (doc.opts.vp == null) doc.opts.vp = 10;
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= 4) return { err: 'Il tavolo è pieno (4 giocatori).' };
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
      if (doc.seats.length >= 4) return { err: 'Il tavolo è pieno.' };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Colona';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true }); return {};
    }
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      doc.opts = doc.opts || {};
      if (op.timer != null) doc.opts.timer = Math.max(0, Math.min(600, +op.timer || 0));
      if (op.vp != null && [8, 10, 12].indexOf(+op.vp) >= 0) doc.opts.vp = +op.vp;
      if (op.gentle != null) doc.opts.gentle = !!op.gentle;
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
      if (doc.seats.length < 3) return { err: 'Servono 3 o 4 giocatori: aggiungi dei giocatori automatici.' };
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
function myTurnNow(g, me) { return me >= 0 && g.phase === 'play' && (E.decider(g) === me || E.mustDiscard(g, me) > 0); }
Coach.setup({ bots: 2,
  myTurn: myTurnNow,
  tip: function (g, me, mine) {
    var P = g.players[me]; if (!P) return null;
    if (E.mustDiscard(g, me)) return 'È uscito un <b>7</b> e hai più di 7 carte: scegli quali <b>' + E.mustDiscard(g, me) + '</b> scartare. Tieni quelle che ti servono per la prossima costruzione.';
    if (g.trade && g.turn !== me && !g.trade.resp[me]) return '<b>' + esc(g.players[g.turn].nick) + '</b> ti propone uno scambio: accetta se ti dà una risorsa che ti manca in cambio di una che ti avanza.';
    if (!mine) return null;
    if (g.stage === 'setup') return g.setup.step === 'settle' ? 'Fondazione: tocca un <b>incrocio che lampeggia</b> per la tua colonia. Conviene uno che tocchi numeri frequenti (6, 8, 5, 9: quelli con più puntini) e risorse diverse.' : 'Ora piazza la <b>strada</b> attaccata alla colonia appena messa: puntala verso un incrocio libero dove costruire dopo.';
    if (g.stage === 'roll') return 'Tocca <b>Lancia i dadi</b>: le tessere con quel numero producono per tutti. ' + (P.devs.some(function (d) { return d.k === 'knight' && d.t < g.turnN; }) && !g.devUsed ? 'Se il ladro blocca una tua tessera, prima puoi giocare un <b>Cavaliere</b>.' : '');
    if (g.stage === 'robber') return 'Sposta il <b>ladro</b>: tocca una tessera di un avversario (meglio chi è in testa, su un numero frequente). Quella tessera smetterà di produrre.';
    if (g.stage === 'steal') return 'Scegli <b>a chi rubare</b> una carta a caso.';
    if (g.stage === 'road2') return 'Costruisci gratis le tue <b>strade</b>: tocca un lato che lampeggia.';
    if (g.trade) return 'Aspetta le risposte alla tua proposta, poi scegli con chi scambiare (oppure ritirala).';
    return 'Ora puoi <b>costruire</b> (' + IC('build') + '), <b>commerciare</b> con gli altri o con la banca (' + IC('trade') + ') e giocare una carta sviluppo. Quando hai finito tocca <b>Fine turno</b>. Hai <b>' + E.vp(g, me) + '</b> punti su ' + g.opts.vp + '.';
  } });
Score.setup({ game: 'catan', result: function (g) {
  var o = g.final ? g.final.order : [];
  return g.players.map(function (P, i) { var k = o.indexOf(i), r = g.final ? g.final.rows[i] : null; return { won: k === 0, place: k >= 0 ? k + 1 : null, score: r ? r.vp : null }; });
} });
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var g = cur.game; g.players[d].bot = true; g.players[d].away = true; Turns.awayLog(g, d); return true; }
});
Net.setLobbyInfo(function (d) { var o = d.opts || {}, notes = []; if (o.vp && o.vp !== 10) notes.push(o.vp + ' punti'); if (o.gentle) notes.push('ladro gentile'); if (o.timer === 0) notes.push('senza timer'); return { max: 4, note: notes.join(', ') }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo e muovi i giocatori automatici.'); render(); });

/* ---------- connessione al tavolo ---------- */
async function run(p) { if (App.busy) return; App.busy = true; paintBusy(); try { await p(); } catch (e) { toast(esc(typeof e === 'string' ? e : (e && e.message) || 'Qualcosa è andato storto. Riprova.'), 'bad'); Sound.play('error'); } finally { App.busy = false; paintBusy(); if (App.screen !== 'table' || !G()) render(); } }
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
  App.code = code; App.doc = null; App.sheet = null; App.pick = null; App.botKeys = {}; App.sheetKey = null; App.introShown = false; App.lastFxN = null; App.seenFirstDoc = false;
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
    if (App.sheet || App.pick) { App.sheet = null; App.pick = null; render(); Nav.guard(App.code); return; }
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
  App.screen = 'lobby'; App.sheet = null; App.pick = null; render();
}
function inviteLink() { return location.origin + location.pathname + '?t=' + App.code; }
function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(esc(t)); }); } catch (e) { toast(esc(t)); } }
function invite() {
  var url = inviteLink(), text = 'Siediti al mio tavolo di ' + document.title + ': codice ' + App.code;
  if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}

/* ---------- l'host muove i giocatori automatici ---------- */
function hostDo(who, pick) {
  Net.hostApply(function (cur) {
    if (!cur || !cur.game || cur.phase !== 'play') return false;
    var gg = cur.game, aa = pick(gg); if (!aa) return false;
    var err = E.act(gg, who, aa);
    if (err) {
      console.warn('automatico', err, aa);
      var alt = gg.stage === 'main' && gg.turn === who ? (gg.trade ? { a: 'cancel' } : { a: 'end' }) : gg.stage === 'roll' && gg.turn === who ? { a: 'roll' } : gg.stage === 'road2' && gg.turn === who ? { a: 'endroads' } : null;
      if (!alt || E.act(gg, who, alt)) return false;
    }
    if (gg.phase === 'over') cur.phase = 'over';
    return true;
  });
}
function humansPending(g) { if (!g.trade) return false; return g.players.some(function (P, q) { return q !== g.turn && !P.bot && !g.trade.resp[q]; }); }
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game;
  // risposte dei giocatori automatici alle proposte di scambio
  if (g.trade) g.players.forEach(function (P, q) {
    if (!P.bot || q === g.turn || g.trade.resp[q]) return;
    var key = 'r' + g.trade.id + ':' + q; if (App.botKeys['r' + q] === key) return; App.botKeys['r' + q] = key;
    setTimeout(function () { hostDo(q, function (gg) { return gg.players[q].bot && gg.trade && gg.trade.id === g.trade.id ? BOT.respond(gg, q) : null; }); }, 900 + Math.random() * 900);
  });
  // scarti col 7: tutti i giocatori automatici che devono scartare
  var list = [];
  if (g.stage === 'discard') g.players.forEach(function (P, q) { if (P.bot && E.mustDiscard(g, q)) list.push(q); });
  else { var d = E.decider(g); if (d != null && g.players[d].bot) list.push(d); }
  list.forEach(function (p, k) {
    var key = App.code + ':' + g.seq + ':' + p;
    if (App.botKeys[p] === key) return;
    App.botKeys[p] = key;
    var wait = g.stage === 'setup' ? 1100 : g.stage === 'discard' ? 900 + k * 400 : g.stage === 'roll' ? 1000 : 1300;
    setTimeout(function () {
      hostDo(p, function (gg) {
        if (gg.phase !== 'play' || !gg.players[p].bot) return null;
        if (gg.stage === 'discard' ? !E.mustDiscard(gg, p) : E.decider(gg) !== p) return null;
        var a = BOT.decide(gg, p, { patience: humansPending(gg) });
        if (!a && gg.trade) {   // aspetta le risposte degli umani, ma non all'infinito
          var tid = gg.trade.id;
          setTimeout(function () { hostDo(p, function (g2) { return g2.trade && g2.trade.id === tid && g2.turn === p && g2.players[p].bot ? BOT.decide(g2, p, {}) : null; }); }, 9000);
        }
        return a;
      });
    }, wait + Math.random() * 500);
  });
}

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  if (App.screen !== 'table') { driveBots(); Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    var P = me >= 0 ? g.players[me] : null, key = null, kind = null;
    if (g.phase === 'over') { key = 'over' + App.code + g.winner; kind = 'over'; }
    else if (P && E.mustDiscard(g, me)) { key = 'discard' + g.seq + ':' + g.turnN; kind = 'discard'; }
    else if (P && g.stage === 'steal' && g.turn === me) { key = 'steal' + g.turnN + ':' + g.seq; kind = 'steal'; }
    if (key && key !== App.sheetKey && !(App.sheet && App.sheet.kind === 'intro')) {
      if (kind === 'discard' && App.sheet && App.sheet.kind === 'discard') App.sheetKey = key;
      else { App.sheetKey = key; App.sheet = { kind: kind, sel: {} }; App.pick = null; }
    }
    if (App.sheet && App.sheet.kind === 'discard' && !(P && E.mustDiscard(g, me))) App.sheet = null;
    if (App.sheet && App.sheet.kind === 'steal' && g.stage !== 'steal') App.sheet = null;
    if (App.sheet && App.sheet.kind === 'trade' && (g.turn !== me || g.stage !== 'main')) App.sheet = null;
    if (App.sheet && App.sheet.kind === 'build' && (g.turn !== me || g.stage !== 'main')) App.sheet = null;
    // scelta del posto: si chiude se non è più il momento
    if (App.pick && !pickStillValid(g, me)) App.pick = null;
    if (me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet('ct-intro-done')) App.sheet = { kind: 'intro', page: 0, after: App.sheet }; }
    if (g.phase === 'play' && App.seenFirstDoc && me >= 0) {
      var tk = g.turn + ':' + g.turnN;
      if (g.turn === me && g.stage === 'roll' && App.lastTurnKey !== tk) { Sound.play('turn'); banner('Tocca a te!'); }
      if (g.stage === 'setup' && E.decider(g) === me && App.lastTurnKey !== 'S' + g.setup.i) { Sound.play('turn'); }
      if (g.turn === me && g.stage === 'roll') App.lastTurnKey = tk;
      if (g.stage === 'setup' && E.decider(g) === me) App.lastTurnKey = 'S' + g.setup.i;
    }
    sounds(g, me);
    App.seenFirstDoc = true;
  }
  render(); driveBots(); Turns.watch(App.doc);
}
function pickStillValid(g, me) {
  var k = App.pick && App.pick.k; if (!k || g.phase !== 'play' || me < 0) return false;
  if (g.stage === 'setup') return E.decider(g) === me;
  if (g.turn !== me) return false;
  if (k === 'robber') return g.stage === 'robber';
  if (g.stage === 'road2') return k === 'road';
  return g.stage === 'main';
}
var DEVSND = { knight: 'knight', road2: 'card', plenty: 'card', mono: 'card' };
function sounds(g, me) {
  if (App.lastFxN === g.fxN) return; var first = App.lastFxN == null; App.lastFxN = g.fxN; if (first) return;
  (g.fx || []).forEach(function (e) {
    if (e.k === 'roll') { Sound.play('dice'); App.diceAt = Date.now(); if (e.d[0] + e.d[1] === 7) setTimeout(function () { Sound.play('robber'); banner('7! Arriva il ladro'); }, 650); }
    else if (e.k === 'prod') { if (me >= 0 && e.gains[me]) setTimeout(function () { Sound.play('prod'); }, 600); }
    else if (e.k === 'build') Sound.play(e.what === 'road' ? 'road' : e.what === 'city' ? 'city' : 'settle');
    else if (e.k === 'buy') Sound.play('buy');
    else if (e.k === 'robber') Sound.play('robber');
    else if (e.k === 'steal') { Sound.play('steal'); if (e.from === me) toast(esc(g.players[e.p].nick) + ' ti ha rubato ' + D.RN[e.r] + '.', 'bad'); else if (e.p === me) toast('Hai rubato ' + D.RN[e.r] + ' a ' + esc(g.players[e.from].nick) + '.'); }
    else if (e.k === 'play') { Sound.play(DEVSND[e.c] || 'card'); if (e.p !== me) toast(esc(g.players[e.p].nick) + ' gioca ' + esc(D.DEVN[e.c]) + (e.c === 'mono' ? ': prende tutto il ' + D.RN[e.r] + ' (' + e.n + ')' : '') + '.'); }
    else if (e.k === 'lr') { Sound.play('special'); toast(pname(g, e.p) + ' ha la <b>Strada più lunga</b>: +2 punti.'); }
    else if (e.k === 'la') { Sound.play('special'); toast(pname(g, e.p) + ' ha l’<b>Esercito più grande</b>: +2 punti.'); }
    else if (e.k === 'discard') Sound.play('discard');
    else if (e.k === 'offer') { if (e.p !== me) Sound.play('offer'); }
    else if (e.k === 'resp') { if (g.turn === me && !e.ok) Sound.play('no'); else if (g.turn === me) Sound.play('offer'); }
    else if (e.k === 'trade') Sound.play('deal');
    else if (e.k === 'bank') Sound.play('bank');
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
  return '<div class="hero-cards" aria-hidden="true"><div class="hc hc1">' + ART.resCard('wood') + '</div><div class="hc hc2">' + ART.resCard('brick') + '</div><div class="hc hc3">' + ART.resCard('grain') + '</div><div class="hc hc4">' + ART.devCard('knight') + '</div>' +
    '<div class="hero-dice">' + ART.die(4, false, 46) + ART.die(3, true, 46) + '</div></div>';
}
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ART.DEFS + '</svg><div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">Coloni di un’isola sconosciuta</div><h1>Catan</h1><p class="tag">Raccogli legname, argilla, lana, grano e minerale; costruisci strade, colonie e città; commercia con gli altri coloni e tieni lontano il ladro. Vince chi arriva per primo a 10 punti. Da 3 a 4 giocatori, ognuno dal proprio telefono.</p></div>' + heroArt() + '</section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Come si gioca, in 30 secondi</h2>' + RU.section('goal') + RU.section('turn') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function optionsHTML(d, isHost) {
  var o = d.opts || {}, vp = o.vp || 10;
  if (!isHost) return '<p class="lead">Si gioca a <b>' + vp + ' punti</b>' + (o.gentle ? ', con il <b>ladro gentile</b>' : '') + '.</p>';
  return '<div class="tt-opt row"><label for="opt-vp" style="flex:1;min-width:160px">Punti per vincere</label><select id="opt-vp" class="field" style="max-width:190px">' +
    [8, 10, 12].map(function (n) { return '<option value="' + n + '"' + (n === vp ? ' selected' : '') + '>' + n + (n === 8 ? ' (partita corta)' : n === 10 ? ' (normale)' : ' (lunga)') + '</option>'; }).join('') + '</select></div>' +
    '<label class="row tgl"><input type="checkbox" id="opt-gentle"' + (o.gentle ? ' checked' : '') + '> Ladro gentile: non colpisce chi ha 2 punti o meno</label>';
}
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, seats = '';
  for (var i = 0; i < 4; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava">' + ART.pieceIcon(i, 38) + '</div><div><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'giocatore automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + ' · ' + D.PCOL[i].n.toLowerCase() + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else seats += '<div class="seat"><div class="ava empty">·</div><div class="sub">Posto libero</div></div>';
  }
  return '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ART.DEFS + '</svg><div class="topbar"><div class="wrap"><span class="brand">Catan</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi. Si gioca in 3 o 4; i posti mancanti si riempiono con giocatori automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/4)</h2><div class="seats">' + seats + '</div>' + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) + optionsHTML(d, isHost) +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= 4 ? ' disabled' : '') + '>Aggiungi giocatore automatico</button><button class="btn" data-act="start"' + (n < 3 ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < 3 ? '<p class="lead">Servono almeno 3 giocatori: aggiungi ' + (3 - n === 1 ? 'un giocatore automatico' : 'due giocatori automatici') + ' o aspetta gli amici.</p>' : '<p class="lead">Una partita dura circa ' + (n * 12 + 20) + '–' + (n * 18 + 30) + ' minuti.</p>')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + RU.section('goal') + RU.section('turn') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
