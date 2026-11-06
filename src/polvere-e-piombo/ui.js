/* ===== Interfaccia ===== */
var D = PPData, E = PPEngine, BOT = PPBot;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function clone(o) { return o == null ? o : JSON.parse(JSON.stringify(o)); }
function sleep(ms) { return new Promise(function (r) { setTimeout(r, ms); }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }

/* ---------- stato dell'interfaccia ---------- */
var App = {
  screen: 'lobby', code: null, doc: null, unsub: null, unsubList: null, tables: [],
  mode: 'idle', sel: null, picks: [], sheet: null, lastFlash: 0, flashInit: false,
  decKey: null, botKey: null, botTimer: null, busy: false
};
var BOTNAMES = ['Jed', 'Ruby', 'Hank', 'Pearl', 'Otis', 'Lula', 'Cody', 'Mabel', 'Virgil', 'Ida'];
var $ = function (s) { return document.querySelector(s); };

function toast(msg) {
  var t = document.createElement('div'); t.className = 'toast'; t.setAttribute('role', 'status'); t.textContent = msg;
  document.body.appendChild(t); setTimeout(function () { t.remove(); }, 2800);
}
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }

/* ---------- carte in HTML (vedi cards.js) ---------- */
function cardHTML(id, extra) { return PPCards.card(id, extra); }
function typeCardHTML(t) { return PPCards.type(t); }
function charCardHTML(cid, hp, extra) { return PPCards.char(cid, hp, extra); }
function roleCardHTML(r) { return PPCards.role(r); }
function backHTML(extra) { return PPCards.back(extra); }
function hpHTML(P) { var s = '<span class="hp" aria-label="' + Math.max(P.hp, 0) + ' punti vita su ' + P.max + '">'; for (var i = 0; i < P.max; i++) s += '<i' + (i < P.hp ? '' : ' class="lost"') + '></i>'; return s + '</span>'; }
var TARGET_SVG = '<svg viewBox="0 0 24 24"><path d="M12 2a10 10 0 1 0 0 20 10 10 0 0 0 0-20zm0 3a7 7 0 1 1 0 14 7 7 0 0 1 0-14zm0 3a4 4 0 1 0 0 8 4 4 0 0 0 0-8zm0 2.5a1.5 1.5 0 1 1 0 3 1.5 1.5 0 0 1 0-3z"/></svg>';
// abilità permanenti dei personaggi che valgono come carte in gioco
function charChips(P) {
  var ch = '';
  if (P.char === 'wren') ch += PPCards.abilityChip('Mustang (innato)', 'Gli altri lo vedono a +1');
  if (P.char === 'maggie') ch += PPCards.abilityChip('Mirino (innato)', 'Vede gli altri a −1');
  if (P.char === 'padre') ch += PPCards.abilityChip('Barile (innato)', 'Se gli sparano estrae: ♥ = schivato');
  if (P.char === 'lark') ch += PPCards.abilityChip('Bang! illimitati', 'Nel suo turno');
  if (P.char === 'sean') ch += PPCards.abilityChip('Mano da 10', 'Può tenere fino a 10 carte');
  if (P.char === 'vera' && P.copy) ch += PPCards.abilityChip('Copia ' + D.CHAR[P.copy].n, D.CHAR[P.copy].s);
  return ch;
}
function eqListHTML(P, withPistol) {
  var g = App.doc && App.doc.game;
  var h = P.eq.map(function (c) {
    var t = E.ty(c), green = D.TYPES[t].kind === 'g';
    return PPCards.eqChip(c, '', green ? (g && E.greenReady(g, c) ? 'ready' : 'wait') : '');
  }).join('') + charChips(P);
  if (withPistol && !E.weapon(P) && P.alive) h = PPCards.abilityChip('Pistola', 'Arma di base · portata 1', 'pistol') + h;
  return h;
}
function expOf(d) { var o = (d && d.opts) || {}; return { dc: !!o.dc, hn: !!o.hn, fc: !!o.fc }; }
function maxSeats(d) { return expOf(d).dc ? 8 : 7; }

/* ---------- regole del tavolo: girano solo sul dispositivo host ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  function hostOnly() { return isHost ? null : { err: 'Solo chi ha aperto il tavolo può farlo.' }; }
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Pistolero';
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= maxSeats(doc)) return { err: 'Il tavolo è pieno (' + maxSeats(doc) + ' giocatori).' };
      doc.seats.push({ uid: from, nick: uniqueNick(doc.seats, nick) });
      return {};
    }
    case 'leave': case 'kick': {
      var who = op.t === 'leave' ? from : op.uid;
      if (op.t === 'kick' && who !== from && !isHost) return hostOnly();
      if (doc.phase !== 'lobby') return { changed: false };
      doc.seats = doc.seats.filter(function (s) { return s.uid !== who; });
      if (doc.host === who) { var h = doc.seats.filter(function (s) { return !s.bot; })[0]; doc.host = h ? h.uid : null; }
      return {};
    }
    case 'addbot': {
      if (!isHost) return hostOnly();
      if (doc.phase !== 'lobby') return { changed: false };
      if (doc.seats.length >= maxSeats(doc)) return { err: 'Il tavolo è pieno.' + (maxSeats(doc) === 7 ? ' Con Dodge City si gioca fino a 8.' : '') };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Bot';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true });
      return {};
    }
    case 'start': {
      if (!isHost) return hostOnly();
      if (doc.phase !== 'lobby') return { changed: false };
      if (doc.seats.length < 4) return { err: 'Servono almeno 4 giocatori: aggiungi dei pistoleri automatici.' };
      if (doc.seats.length > maxSeats(doc)) return { err: 'In 8 si gioca solo con Dodge City: attivala o togli un giocatore.' };
      var seats = doc.seats.slice();
      for (var i = seats.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = seats[i]; seats[i] = seats[j]; seats[j] = t; }
      doc.game = E.newGame(seats, expOf(doc)); doc.phase = 'play';
      return {};
    }
    case 'rematch': if (!isHost) return hostOnly(); doc.phase = 'lobby'; doc.game = null; return {};
    case 'auto': {
      if (!isHost) return hostOnly();
      if (!doc.game || !doc.game.players[op.p]) return { changed: false };
      doc.game.players[op.p].bot = !!op.on; return {};
    }
    case 'vis': {
      if (!isHost) return hostOnly();
      doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    }
    case 'opt': {
      if (!isHost) return hostOnly();
      if (doc.phase !== 'lobby') return { changed: false };
      doc.opts = doc.opts || {}; if (op.timer != null) doc.opts.timer = Math.max(0, Math.min(600, +op.timer || 0));
      ['dc', 'hn', 'fc'].forEach(function (k) { if (op[k] != null) doc.opts[k] = !!op[k]; });
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
    case 'act': {
      var g = doc.game; if (!g) return { err: 'La partita non è più disponibile.' };
      var p = -1; g.players.forEach(function (P, k) { if (P.uid === from) p = k; });
      if (p < 0) return { err: 'Stai solo guardando questa partita.' };
      if (g.players[p].bot && !op.fromBot) { g.players[p].bot = false; g.players[p].away = false; } // il giocatore è tornato
      var err = E.act(g, p, op.a);
      if (err) return { err: err };
      if (g.phase === 'over') doc.phase = 'over';
      return {};
    }
  }
  return { err: 'Azione sconosciuta.' };
}
Net.setReducer(tableReducer);
Coach.setup({ bots: 3, tip: function (g, me, mine) {
  var P = g.players[me]; if (!P) return null;
  var goal = { sceriffo: 'Sei lo <b>Sceriffo</b> (tutti lo sanno): elimina Fuorilegge e Rinnegato.', vice: 'Sei un <b>Vicesceriffo</b>: proteggi lo Sceriffo, ma non dirlo a nessuno.', bandito: 'Sei un <b>Fuorilegge</b>: il tuo bersaglio è lo Sceriffo.', traditore: 'Sei il <b>Rinnegato</b>: devi restare l’ultimo in piedi, Sceriffo per ultimo.' }[P.role] || '';
  if (!P.alive) return 'Sei stato eliminato: guarda come finisce la sfida.';
  var f = g.stack[g.stack.length - 1];
  if (f && f.who === me) {
    if (f.type === 'react' && f.kind === 'stampede') return '<b>Indiani!</b> Scarta un <b>Bang!</b> o perdi 1 punto vita.';
    if (f.type === 'react' && f.kind === 'rimbalzo') return 'Ti sparano a una carta che hai in gioco: gioca una <b>Schivata!</b> per salvarla, oppure lasciala andare.';
    if (f.type === 'react') return 'Ti stanno colpendo! Gioca una <b>Schivata!</b> (o usa il Barile) per salvarti, altrimenti perdi un punto vita.';
    if (f.type === 'roulette') return '<b>Roulette russa</b>: scarta una Schivata! e passa il tamburo, o perdi 2 punti vita.';
    if (f.type === 'duel') return '<b>Duello</b>: a turno si scarta un <b>Bang!</b>; chi non ne ha più perde un punto vita. Ne hai ancora? Allora rispondi.';
    if (f.type === 'dying') return 'Hai finito i punti vita! Se hai una <b>Birra</b> giocala subito per restare in partita.';
    if (f.type === 'discard') return 'Fine turno: puoi tenere tante carte quanti punti vita hai. Scegli quali scartare.';
    if (f.type === 'store') return '<b>Emporio</b>: scegli una delle carte scoperte e tienila.';
    if (f.type === 'vera') return 'Sei <b>Vera Custer</b>: scegli di quale personaggio copiare l’abilità fino al tuo prossimo turno.';
    if (f.type === 'blood') return '<b>Fratelli di sangue</b>: puoi regalare 1 tuo punto vita a un altro giocatore, oppure saltare.';
    if (f.type === 'peyote') return '<b>Peyote</b>: indovina il colore della prossima carta. Finché indovini, peschi.';
    if (f.type === 'ranch') return '<b>Ranch</b>: puoi cambiare quante carte vuoi della tua mano con altrettante del mazzo.';
    if (f.type === 'dalton') return '<b>I Dalton</b>: scegli quale delle tue carte blu in gioco scartare.';
    return 'Scegli una delle carte proposte.';
  }
  if (!mine) return null;
  if (g.step === 'draw') return 'Inizia il tuo turno: <b>pesca ' + E.drawCount(g, me) + (E.drawCount(g, me) === 1 ? ' carta' : ' carte') + '</b>. ' + goal;
  return goal + ' Gioca le carte che vuoi: un solo <b>Bang!</b> per turno, armi e cavalli restano davanti a te, la distanza conta (il numero sul mirino accanto a ogni giocatore). Quando hai finito tocca <b>Fine turno</b>.';
} });
Score.setup({ game: 'polvere-e-piombo', result: function (g) {
  var team = { legge: ['sceriffo', 'vice'], banditi: ['bandito'], traditore: ['traditore'] }[g.winner] || [];
  return g.players.map(function (P) { var w = team.indexOf(P.role) >= 0; return { won: w, place: w ? 1 : 2, score: null }; });
} });
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var P = cur.game.players[d]; P.bot = true; P.away = true; Turns.awayLog(cur.game, d); return true; }
});
Net.setLobbyInfo(function (d) {
  var x = expOf(d), ex = [x.dc ? 'Dodge City' : '', x.hn ? 'Mezzogiorno di Fuoco' : '', x.fc ? 'Pugno di Carte' : ''].filter(function (e) { return e; });
  return { max: maxSeats(d), note: [ex.join(' + '), d.opts && d.opts.timer === 0 ? 'senza timer' : ''].filter(function (e) { return e; }).join(' · ') };
});
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo e muovi i pistoleri automatici.'); render(); });

/* ---------- azioni ---------- */
async function run(p) { if (App.busy) return; App.busy = true; render(); try { await p(); } catch (e) { toast(typeof e === 'string' ? e : (e && e.message) || 'Qualcosa è andato storto. Riprova.'); } finally { App.busy = false; render(); } }
function requireNick() {
  if (window.Account && !Account.allow()) return null; // con il server attivo serve l'account
  var n = ($('#nick') && $('#nick').value.trim()) || myNick();
  if (!n) { toast('Scrivi il tuo nome da pistolero.'); if ($('#nick')) { $('#nick').focus(); $('#nick').scrollIntoView({ block: 'center' }); } return null; }
  lsSet('pp-nick', n.slice(0, 18)); return n.slice(0, 18);
}
function remember(code) {
  var list = []; try { list = JSON.parse(lsGet('pp-recent') || '[]'); } catch (e) {}
  list = list.filter(function (x) { return x.code !== code; }); list.unshift({ code: code, t: Date.now() });
  lsSet('pp-recent', JSON.stringify(list.slice(0, 5)));
}
function createTable() {
  var nick = requireNick(); if (!nick) return;
  App.status = 'Apro un tavolo…';
  var vis = Lobby.pickedVis();
  run(async function () { var code = await Net.create(nick, { vis: vis }); await enterTable(code, nick); });
}
function joinTable(code) {
  code = (code || '').trim().toUpperCase();
  if (App.code === code && App.doc) { toTable(); return; }
  if (!/^[A-Z]{4}$/.test(code)) { toast('Il codice del tavolo ha 4 lettere.'); return; }
  var nick = requireNick(); if (!nick) return;
  App.status = 'Cerco il tavolo ' + code + '…';
  run(function () { return enterTable(code, nick); });
}
async function enterTable(code, nick) {
  if (App.code && App.code !== code && App.doc) {
    var d0 = App.doc;
    if (d0.phase === 'lobby' && d0.seats.some(function (s) { return s.uid === Net.uid; })) {
      if (Net.isHost && !d0.seats.some(function (s) { return !s.bot && s.uid !== Net.uid; })) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
    }
  }
  App.code = code; App.doc = null; App.flashInit = false; App.mode = 'idle'; App.sheet = null; App.botKey = null;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { Lobby.forget(code); if (App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; onDoc();
  }, function () {
    var sig = Net.connected + ':' + Net.hostAlive() + ':' + Net.isHost + ':' + Net.presenceSig();
    if (sig !== App.netSig) { App.netSig = sig; render(); }
  });
  if (ok !== true) {
    App.screen = 'lobby'; App.code = null; lsSet('pp-table', null); if (ok === 'closed') Lobby.forget(code); render();
    throw ok === 'private' ? 'Il tavolo ' + code + ' è privato: entri solo con l’invito personale di chi l’ha aperto.' : ok === 'closed' ? 'Il tavolo ' + code + ' è stato chiuso. L’ho tolto dai tuoi tavoli recenti.' : 'Non riesco a raggiungere il tavolo ' + code + '. Se la connessione è lenta, riprova tra poco da «I tuoi tavoli recenti».';
  }
  lsSet('pp-table', code); remember(code);
  if (nick) {
    var out = await Net.send({ t: 'join', nick: nick });
    if (out === 'spect' && myIdx() < 0) toast('La partita è già in corso: la guardi da spettatore.');
  }
  Nav.guard(code);
  Chat.reset();
}
function addBot() { run(function () { return Net.send({ t: 'addbot' }); }); }
function removeSeat(uid) { run(function () { return Net.send({ t: 'kick', uid: uid }); }); }
function startGame() { run(function () { return Net.send({ t: 'start' }); }); }
function rematch() { run(function () { return Net.send({ t: 'rematch' }); }); }
function takeHost() { Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i pistoleri automatici.'); }
function setAuto(p, on) { run(function () { return Net.send({ t: 'auto', p: p, on: on }); }); }
function act(a) {
  App.mode = 'idle'; App.sel = null; App.picks = []; App.pend = null; closeSheet();
  run(function () { return Net.send({ t: 'act', a: a }); });
}

/* ---------- bot: li muove il dispositivo host ---------- */
function driveBots() {
  var doc = App.doc;
  if (!doc || !Net.isHost || doc.phase !== 'play' || !doc.game) return;
  var g = doc.game, d = E.decider(g);
  if (d == null || !g.players[d].bot) return;
  var key = App.code + ':' + g.seq + ':' + d + ':' + g.stack.length;
  if (App.botKey === key) return;
  App.botKey = key;
  clearTimeout(App.botTimer);
  App.botTimer = setTimeout(function () {
    Net.hostApply(function (cur) {
      if (!cur || !cur.game || cur.phase !== 'play') return false;
      var gg = cur.game, dd = E.decider(gg);
      if (gg.seq !== g.seq || dd !== d || !gg.players[dd].bot) return false;
      var a = BOT.decide(gg, dd);
      var err = a ? E.act(gg, dd, a) : 'nessuna mossa';
      if (err) { var top = gg.stack[gg.stack.length - 1]; E.act(gg, dd, !top ? { a: 'end' } : top.type === 'dying' ? { a: 'respond', r: 'die' } : { a: 'respond', r: 'take' }); }
      if (gg.phase === 'over') cur.phase = 'over';
      return true;
    });
  }, 850 + Math.random() * 500);
}

/* ---------- navigazione ---------- */

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
    if (App.sheet || App.mode !== 'idle') { App.mode = 'idle'; App.sel = null; App.picks = []; closeSheet(); render(); Nav.guard(App.code); return; }
    App.screen = 'lobby'; render(); window.scrollTo(0, 0); return;
  }
  if (App.screen === 'gallery') { App.screen = 'lobby'; render(); return; }
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
  App.code = null; App.doc = null; lsSet('pp-table', null);
  history.replaceState(null, '', location.pathname);
  App.screen = 'lobby'; closeSheet(); render();
}
function inviteLink() { return location.origin + location.pathname + '?t=' + App.code; }
function invite() {
  var url = inviteLink(), text = 'Siediti al mio tavolo di Bang!: codice ' + App.code;
  if (navigator.share) { navigator.share({ title: 'Bang!', text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}
function myIdx() { var g = App.doc && App.doc.game; if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }

function onDoc() {
  var g = App.doc.game;
  if (g && !App.flashInit) { App.lastFlash = g.flash ? g.flash.n : 0; App.flashInit = true; }
  if (!g) App.flashInit = false;
  // apri automaticamente il foglio di decisione quando tocca a me rispondere
  if (App.screen !== 'table') { if (g && g.flash) App.lastFlash = Math.max(App.lastFlash, g.flash.n); driveBots(); Turns.watch(App.doc); paintCur(); return; }
  var me = myIdx();
  if (g && g.phase === 'play' && me >= 0) {
    var top = g.stack[g.stack.length - 1];
    var key = top && top.who === me ? g.seq + ':' + top.type + ':' + (top.got || 0) + ':' + (top.i || 0) : null;
    if (key && key !== App.decKey) { App.decKey = key; App.mode = 'idle'; App.picks = []; App.sheet = { kind: 'decide' }; }
    if (!key && App.sheet && App.sheet.kind === 'decide') App.sheet = null;
    if (!key) App.decKey = null;
    if (E.decider(g) !== me && App.mode !== 'idle' && App.pend) { App.mode = 'idle'; App.sel = null; App.pend = null; App.picks = []; }
  }
  if (App.sheet && App.sheet.kind === 'over' && (!g || g.phase !== 'over')) App.sheet = null;
  if (g && g.phase === 'over' && !App.sheet && !App.overShown) { App.overShown = g.seq; App.sheet = { kind: 'over' }; }
  if (!g || g.phase !== 'over') App.overShown = null;
  if (App.screen === 'table' && g && App.doc.phase !== 'lobby') { FX.before(); render(); FX.after(App.doc); } else { FX.reset(); render(); }
  driveBots();
  Turns.watch(App.doc);
}

/* ---------- render ---------- */
function render() {
  var root = $('#app');
  var keepHand = $('.hand') ? $('.hand').scrollLeft : 0;
  if (App.screen === 'lobby') root.innerHTML = lobbyHTML();
  else if (App.screen === 'gallery') root.innerHTML = galleryHTML();
  else if (App.screen === 'table') {
    if (!App.doc) root.innerHTML = '<div class="wrap lobby"><p class="muted">' + esc(App.status || ('Mi siedo al tavolo ' + App.code + '…')) + '</p></div>';
    else if (App.doc.phase === 'lobby' || !App.doc.game) root.innerHTML = roomHTML();
    else root.innerHTML = tableHTML();
  }
  if ($('.hand')) $('.hand').scrollLeft = keepHand;
  // il tavolo occupa lo spazio tra la barra in alto e la mano: misuro entrambe
  var dk = $('.dock'), tb = $('.topbar');
  if (dk) { var dh = dk.offsetHeight; if (dh && dh !== App.dockH) { App.dockH = dh; document.documentElement.style.setProperty('--dock-h', dh + 'px'); } }
  if (tb) { var th = tb.offsetHeight; if (th && th !== App.topH) { App.topH = th; document.documentElement.style.setProperty('--top-h', th + 'px'); } }
  FX.reapply();
  if (App.screen === 'lobby') { renderLobbyList(); Lobby.start(); } else Lobby.end();
  renderSheet();
}

function lobbyHTML() {
  var fan = '';
  var fanItems = [ { h: backHTML() }, { h: charCardHTML('maggie') }, { h: typeCardHTML('sparo') } ];
  fanItems.forEach(function (f, i) { fan += f.h.replace('class="card', 'style="transform:translateX(-50%) rotate(' + ((i - 1) * 13) + 'deg) translateX(' + ((i - 1) * 22) + 'px)" class="card'); });
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b class="mono">' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><div class="row" style="justify-content:space-between"><a href="../" style="color:var(--muted);text-decoration:none;font-size:15px">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div style="display:grid;gap:10px"><h1>Bang!</h1><p class="tag">Ruoli segreti, pistole e whisky, con le espansioni Dodge City, Mezzogiorno di Fuoco e Per un Pugno di Carte. Apri un tavolo, condividi il codice e sfida i tuoi amici, ognuno dal proprio telefono.</p><p class="credit">Illustrazioni: disegni e dipinti di Frederic Remington e stampe western dell’Ottocento, di pubblico dominio</p></div>' +
    '<div class="fan" aria-hidden="true">' + fan + '</div></section>' + inv +
    '<div class="grid2">' +
    '<section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Rattlesnake Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:15px;margin-top:6px">I tuoi tavoli recenti</h3><div id="tlist" class="tables"></div>' +
    '<div class="row"><button class="btn ghost small" data-act="gallery">Mazzo e personaggi</button><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section>' +
    '</div></div>';
}
function renderLobbyList() { var el = $('#tlist'); if (el) el.innerHTML = Lobby.recentRows(); }
Lobby.setRecentKey('pp-recent');

function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; });
  var seats = '', max = maxSeats(d), x = expOf(d);
  for (var i = 0; i < Math.max(max, d.seats.length); i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat-l full"><div class="ava">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.bot ? 'pistolero automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else seats += '<div class="seat-l"><div class="ava">·</div><div class="sub">Posto libero</div></div>';
  }
  var n = d.seats.length, over = n > max;
  var xp = function (k, name, desc) {
    return '<label class="xp' + (x[k] ? ' on' : '') + '"><input type="checkbox" id="opt-' + k + '"' + (x[k] ? ' checked' : '') + (isHost ? '' : ' disabled') + '><span class="xi">' + (k === 'dc' ? PPCards.GLYPH.e : PPCards.evIcon(k === 'hn' ? 'mezzogiorno' : 'pugnocarte')) + '</span><span><b>' + name + '</b><small>' + desc + '</small></span></label>';
  };
  return '<div class="topbar"><div class="wrap"><span class="brand">Bang!</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' +
    '<section class="panel"><span class="lead">Codice del tavolo</span><div class="row"><span class="codebig">' + esc(d.code) + '</span></div>' +
    '<div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede al tavolo dal suo telefono, senza registrarsi. In alternativa basta aprire il gioco e scrivere il codice. Servono da 4 a ' + max + ' giocatori; i posti mancanti si riempiono con pistoleri automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/' + max + ')</h2><div class="seats">' + seats + '</div>' +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= max ? ' disabled' : '') + '>Aggiungi pistolero automatico</button><button class="btn" data-act="start"' + (n < 4 || over ? ' disabled' : '') + '>Inizia la partita</button></div>' +
      (n < 4 ? '<p class="lead">Mancano ' + (4 - n) + ' giocatori per iniziare.</p>' : over ? '<p class="lead">In 8 si gioca solo con Dodge City.</p>' : '')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    '</section>' +
    '<section class="panel"><h2>Espansioni</h2><p class="lead">' + (isHost ? 'Scegli con quali giocare: si possono usare da sole o tutte insieme.' : 'Le sceglie l’host.') + '</p><div class="xps">' +
    xp('dc', 'Dodge City', '40 carte nuove (anche le carte verdi da usare nei turni dopo), 15 personaggi, fino a 8 giocatori.') +
    xp('hn', 'Mezzogiorno di Fuoco', 'A ogni giro dello Sceriffo un evento cambia le regole per tutti (13 eventi).') +
    xp('fc', 'Per un Pugno di Carte', 'Altri 15 eventi, più cattivi e imprevedibili.') + '</div>' +
    (x.hn && x.fc ? '<p class="lead">Con entrambi i mazzi di eventi se ne pescano 12 a caso dai due, più una carta finale.</p>' : '') +
    '<button class="btn ghost small" data-act="xpinfo" style="justify-self:start">Come vanno insieme?</button></section>' +
    '<section class="panel">' + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' + hostBanner() + '</div>';
}

function connInfo(txt) { return Net.connected ? txt : '<span style="color:#f08070">Riconnessione…</span> ' + txt; }
function hostBanner() {
  var d = App.doc; if (!d || Net.isHost || Net.hostAlive()) return '';
  var h = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  return '<div class="notice red">' + esc(h ? h.nick : 'L’host') + ' non risponde: forse ha chiuso il gioco o ha il telefono in standby. Tra pochi secondi il comando passa da solo a un altro giocatore, oppure prendilo tu adesso.' +
    '<div class="row" style="margin-top:8px"><button class="btn small" data-act="takehost">Prendi il comando</button></div></div>';
}

var WIN_TXT = { legge: 'Vince la legge', banditi: 'Vincono i Fuorilegge', traditore: 'Vince il Rinnegato' };
var REACT_TXT = { sparo: 'Bang!', mitraglia: 'Catling', colpo: 'colpo', rimbalzo: 'Rimbalzo', pugnocarte: 'Bang!' };
function statusText(g, me) {
  if (g.phase === 'over') return { big: WIN_TXT[g.winner], small: 'Partita finita.' };
  var top = g.stack[g.stack.length - 1], T = g.players[g.turn], n = function (i) { return i === me ? 'tu' : esc(g.players[i].nick); };
  var big = (g.turn === me ? 'Il tuo turno' : 'Turno di ' + esc(T.nick)), small = '';
  if (!top) small = g.step === 'draw' ? (g.turn === me ? 'Pesca le tue carte.' : 'Sta pescando.') : (g.turn === me ? 'Gioca le tue carte, poi passa il turno.' : 'Sta giocando le sue carte.');
  else if (top.type === 'react') small = top.kind === 'stampede' ? 'Indiani: ' + n(top.who) + ' deve scartare un Bang!.' : top.kind === 'rimbalzo' ? 'Rimbalzo: ' + n(top.who) + ' può salvare la sua carta.' : (top.kind === 'mitraglia' ? 'Catling: ' : 'Colpo: ') + n(top.who) + ' deve schivare' + (top.need - top.got > 1 ? ' (servono ' + (top.need - top.got) + ' Schivata!)' : '') + '.';
  else if (top.type === 'duel') small = 'Duello: tocca a ' + n(top.who) + ' rispondere con un Bang!.';
  else if (top.type === 'dying') small = n(top.who) + ' è a terra: può salvarsi?';
  else if (top.type === 'store') small = 'Emporio: sceglie ' + n(top.who) + '.';
  else if (top.type === 'kit') small = n(top.who) + ' sceglie quali carte tenere.';
  else if (top.type === 'discard') small = n(top.who) + ' scarta le carte in eccesso.';
  else if (top.type === 'roulette') small = 'Roulette russa: tocca a ' + n(top.who) + '.';
  else if (top.type === 'dalton') small = 'I Dalton: ' + n(top.who) + ' scarta una carta blu.';
  else if (top.type === 'vera') small = n(top.who) + ' sceglie chi copiare.';
  else if (top.type === 'blood') small = n(top.who) + ' può donare un punto vita.';
  else if (top.type === 'peyote') small = n(top.who) + ' indovina i colori (' + top.got + ' prese).';
  else if (top.type === 'ranch') small = n(top.who) + ' può cambiare carte al Ranch.';
  return { big: big, small: small };
}

// bersagli da evidenziare al tavolo mentre si sceglie
function targetCtx(g, me) {
  if (App.mode !== 'target' || !App.sel) return { targets: null };
  return { targets: App.sel.info.targets, verb: App.sel.verb || 'bersaglio', dist: !!App.sel.dist };
}
function tableHTML() {
  var d = App.doc, g = d.game, me = myIdx();
  var top = g.stack[g.stack.length - 1];
  var ctx = targetCtx(g, me); ctx.st = statusText(g, me);
  var lastN = App.feedN || 0;
  var feed = g.log.slice(-14).map(function (l) { return '<div class="k-' + l.k + (l.n > lastN ? ' fresh' : '') + '">' + esc(l.t) + '</div>'; }).join('');
  App.feedN = g.logN;
  var store = top && top.type === 'store' ? '<div class="store"><span class="lead">Sul banco dell’Emporio' + (top.who === me ? ': scegli tu' : ': sceglie ' + esc(g.players[top.who].nick)) + '</span><div class="row">' + top.cards.map(function (c) { return cardHTML(c); }).join('') + '</div></div>' : '';
  var meHTML = '';
  if (me >= 0) {
    var P = g.players[me], C = D.CHAR[P.char], w = E.weapon(P);
    var lim = E.bangLimit(g, me), bangs = lim > 50 ? 'senza limite' : g.turn === me && g.step === 'play' ? (E.canPlayBang(g, me) ? (lim - g.bangs) + ' disponibil' + (lim - g.bangs > 1 ? 'i' : 'e') : 'già usat' + (lim > 1 ? 'i' : 'o')) : lim + ' per turno';
    if (E.evIs(g, 'sermone') && g.turn === me) bangs = 'vietati dal Sermone';
    meHTML = '<section class="me' + (g.turn === me && g.phase === 'play' ? ' turnme' : '') + '">' + charCardHTML(P.char, P.max).replace('class="card', 'data-zoomchar="' + P.char + '" class="card') +
      '<div style="min-width:0"><h3>' + esc(P.nick) + '</h3><div class="chrline">' + C.n + ' · ' + C.title + '</div>' +
      '<div class="stat">' + hpHTML(P) + '<span class="mono" style="font-size:14px;color:var(--paper-2)">' + Math.max(P.hp, 0) + '/' + P.max + ' punti vita</span></div>' +
      '<div class="info">' + (w == null ? 'Pistola' : D.TYPES[E.ty(w)].n) + ', portata ' + E.rangeOf(g, me) + ' · Bang!: ' + bangs + ' · mano massima ' + E.handLimit(g, me) + '</div>' +
      '<button class="btn ghost small rolebtn" data-act="myrole">' + (P.role === 'sceriffo' ? '★ Sei lo Sceriffo' : 'Il tuo ruolo segreto') + '</button>' +
      '<div class="eqs">' + eqListHTML(P, false) + '</div></div></section>';
  }
  var alive = g.players.filter(function (P) { return P.alive && !P.ghost; }).length;
  return '<div class="topbar"><div class="wrap"><span class="brand">Bang!</span><span class="info"><b>' + connInfo(alive + ' in vita' + (g.ev ? ' · giro ' + g.round : '')) + '</b><span>' + esc(d.code) + '</span></span>' +
    Sound.buttonHTML() + '<button class="iconbtn" data-act="log">Registro</button>' + Chat.badgeHTML() + '<button class="iconbtn" data-act="menu">Menu</button></div></div>' +
    '<main class="wrap board">' + hostBanner() + Chat.dockHTML('position:sticky;top:calc(60px + env(safe-area-inset-top,0px));z-index:15;margin:0') +
    '<div class="tablewrap">' + PPTable.ringHTML(g, me, ctx) + '<aside class="side"><div class="sec-title">Ultime mosse</div><div class="feed">' + feed + '</div></aside></div>' +
    store + meHTML + '</main>' + dockHTML(g, me);
}

// suggerimento chiaro su cosa si può fare adesso
function nowHint(g, me) {
  var P = g.players[me], names = function (l) { l = l.map(function (i) { return '<b>' + esc(g.players[i].nick) + '</b>'; }); return l.length > 1 ? l.slice(0, -1).join(', ') + ' o ' + l[l.length - 1] : l[0]; };
  var must = E.mustPlay(g, me);
  if (must != null) return 'Legge del West: prima di passare devi giocare <b>' + D.TYPES[E.ty(must)].n + '</b>.';
  var bang = P.hand.filter(function (c) { return E.isBangLike(g, me, c); })[0], h = 'Hai pescato. ';
  if (bang != null) {
    var info = E.playInfo(g, me, bang);
    if (info.ok) { var w = E.weapon(P); h += 'Puoi sparare a ' + names(info.targets) + (info.targets.length > 1 ? ': sono a tiro' : ': è a tiro') + ' della tua ' + (w == null ? 'Pistola' : D.TYPES[E.ty(w)].n) + '.'; }
    else h += info.why;
  } else h += 'Tocca una carta per leggerla e giocarla, poi passa il turno.';
  return h;
}
function abilityButtons(g, me) {
  var b = '', P = g.players[me];
  if (E.abilityInfo(g, me, 'chuck').ok) b += '<button class="btn ghost" data-act="chuck">−1 vita, +2 carte</button>';
  if (E.abilityInfo(g, me, 'jose').ok) b += '<button class="btn ghost" data-act="jose">Scarta una blu: +2 carte</button>';
  if (E.abilityInfo(g, me, 'docholy').ok) b += '<button class="btn ghost" data-act="docholy">Scarta 2: spara</button>';
  if (E.sniperInfo(g, me).ok) b += '<button class="btn ghost" data-act="sniper">Cecchino (2 Bang!)</button>';
  if (E.ricochetInfo(g, me).ok) b += '<button class="btn ghost" data-act="ricochet">Rimbalzo</button>';
  return b;
}
function dockHTML(g, me) {
  var hint = '', actions = '', hand = '', lbl = 'adesso';
  var P = me >= 0 ? g.players[me] : null;
  var top = g.stack[g.stack.length - 1];
  if (!P) hint = 'Stai guardando la partita.';
  else {
    var pickable = App.mode === 'pick', canPlayNow = g.phase === 'play' && g.turn === me && !top && g.step === 'play' && App.mode === 'idle';
    hand = P.hand.length ? P.hand.map(function (c) {
      var x = '';
      if (pickable) x = App.picks.indexOf(c) >= 0 ? 'pick' : App.pickFilter && !App.pickFilter(c) ? 'nopick' : '';
      else if (App.sel && App.sel.card === c) x = 'sel';
      else if (canPlayNow && E.playInfo(g, me, c).ok) x = 'can';
      return cardHTML(c, x);
    }).join('') : '<span class="emptyhand">' + (P.alive ? 'Nessuna carta in mano.' : 'Sei fuori dalla partita. Puoi continuare a guardare.') + '</span>';
    var myTurnFree = g.phase === 'play' && g.turn === me && !top;
    if (g.turn === me && g.phase === 'play') lbl = 'adesso · tocca a te';
    if (g.phase === 'over') { hint = 'Partita finita.'; actions = '<button class="btn" data-act="showover">Risultati</button>'; }
    else if (App.mode === 'target') { hint = App.sel.why || ('Scegli il bersaglio tra i giocatori evidenziati.'); actions = '<button class="btn ghost" data-act="cancel">Annulla</button>'; lbl = 'scegli'; }
    else if (App.mode === 'pick') {
      var need = App.pickNeed;
      hint = App.pickWhy + ' <b>' + App.picks.length + '/' + need + '</b>'; lbl = 'scegli';
      actions = '<button class="btn ghost" data-act="cancel">Annulla</button><button class="btn" data-act="pickok"' + (App.picks.length === need ? '' : ' disabled') + '>Conferma</button>';
    }
    else if (top && top.who === me) { hint = '<b>Devi decidere.</b> ' + statusText(g, me).small; actions = '<button class="btn" data-act="decide">Rispondi</button>'; lbl = 'adesso · tocca a te'; }
    else if (myTurnFree && g.step === 'draw') {
      var n = E.drawCount(g, me), modes = E.drawModes(g, me);
      hint = '<b>Il tuo turno.</b> Pesca ' + n + (n === 1 ? ' carta' : ' carte') + (E.evIs(g, 'miniera') ? ' dagli scarti (Miniera Abbandonata)' : '') + '.';
      actions = '<button class="btn" data-act="draw">Pesca' + (E.evIs(g, 'miniera') ? '' : ' dal mazzo') + '</button>';
      if (modes.indexOf('player') >= 0) actions += '<button class="btn ghost" data-act="natedraw">Sfila a un giocatore</button>';
      if (modes.indexOf('discard') >= 0) actions += '<button class="btn ghost" data-act="gazzadraw">Prendi ' + D.TYPES[E.ty(g.disc[g.disc.length - 1])].n + ' dagli scarti</button>';
      if (modes.indexOf('pat') >= 0) actions += '<button class="btn ghost" data-act="patdraw">Prendi una carta in gioco</button>';
      if (modes.indexOf('liquor') >= 0) actions += '<button class="btn ghost" data-act="liquor">Non pescare: +1 vita</button>';
    }
    else if (myTurnFree && g.step === 'play') { hint = nowHint(g, me); actions = abilityButtons(g, me) + '<button class="btn red" data-act="end">Fine turno</button>'; }
    else { var st = statusText(g, me); hint = st.big + (st.small ? ' — ' + st.small : ''); lbl = 'al tavolo'; }
    if (P.alive && E.has(g, me, 'doc') && P.hp < P.max && P.hand.length >= 2 && g.phase === 'play' && App.mode === 'idle' && !(top && top.who === me))
      actions = '<button class="btn ghost" data-act="doc">Ricuciti (2 carte)</button>' + actions;
    if (g.phase === 'play' && E.decider(g) === me) hint += '<span id="tt"></span>';
    if (P.bot && P.alive && g.phase === 'play') { hint = '<b>Stai giocando in automatico</b> perché sei stato fermo troppo a lungo.'; actions = '<button class="btn" data-act="resume">Riprendo io</button>'; }
  }
  return '<div class="dock"><div class="wrap"><div class="now"><div class="hint"><span class="lbl">' + lbl + '</span>' + hint + '</div>' + (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div>' +
    (P ? '<div class="handlbl">la tua mano · ' + P.hand.length + (P.hand.length === 1 ? ' carta' : ' carte') + '</div><div class="hand" aria-label="La tua mano">' + hand + '</div>' : '') + '</div></div>';
}

function galleryHTML() {
  var tile = function (t) { return '<div class="gitem">' + typeCardHTML(t) + '<span class="cnt">× ' + D.TYPES[t].count + '</span></div>'; };
  var base = D.CHARS.filter(function (c) { return !c.x; }), dc = D.CHARS.filter(function (c) { return c.x; });
  var evs = function (set) { return Object.keys(D.EVENTS).filter(function (k) { return D.EVENTS[k].set === set; }).map(function (k) { return '<div class="gitem ev">' + PPCards.event(k) + '<p>' + D.EVENTS[k].txt + '</p></div>'; }).join(''); };
  return '<div class="topbar"><div class="wrap"><span class="brand">Bang!</span><span class="info">Mazzo e personaggi</span><button class="iconbtn" data-act="back">Indietro</button></div></div>' +
    '<div class="wrap gallery"><h2>Le 80 carte del gioco base</h2><div class="ggrid">' + D.ORDER.map(tile).join('') +
    '<div class="gitem">' + backHTML() + '<span class="cnt">dorso</span></div></div>' +
    '<h2>I 16 pistoleri del gioco base</h2><div class="ggrid">' + base.map(function (c) { return '<div class="gitem">' + charCardHTML(c.id) + '</div>'; }).join('') + '</div>' +
    '<h2>Dodge City: 40 carte</h2><p class="muted">Le carte <b>verdi</b> si mettono in gioco e si usano dal turno successivo. Quelle con «+1 carta scartata» chiedono di scartare anche un’altra carta dalla mano.</p><div class="ggrid">' + D.ORDER_DC.map(tile).join('') + '</div>' +
    '<h2>Dodge City: 15 pistoleri</h2><div class="ggrid">' + dc.map(function (c) { return '<div class="gitem">' + charCardHTML(c.id) + '</div>'; }).join('') + '</div>' +
    '<h2>Mezzogiorno di Fuoco: 13 eventi</h2><div class="ggrid evs">' + evs('hn') + '</div>' +
    '<h2>Per un Pugno di Carte: 15 eventi</h2><div class="ggrid evs">' + evs('fc') + '</div>' +
    '<h2>I ruoli segreti</h2><div class="ggrid">' + ['sceriffo', 'vice', 'bandito', 'traditore'].map(function (r) { return '<div class="gitem">' + roleCardHTML(r) + '</div>'; }).join('') + '</div>' +
    '<h2>Illustrazioni</h2><div class="credits">' + CREDITS.map(function (c) { return '<div>' + c + '</div>'; }).join('') + '</div></div>';
}

/* ---------- fogli modali ---------- */
function closeSheet() { App.sheet = null; var s = $('#sheet'); if (s) s.innerHTML = ''; }
function renderSheet() {
  var root = $('#sheet'); if (!root) return;
  var s = App.sheet; if (!s) { root.innerHTML = ''; return; }
  var h = sheetBody(s);
  if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  root.innerHTML = '<div class="sheet-back" data-act="sheetback"><div class="sheet" role="dialog" aria-modal="true">' + h + '</div></div>';
}
function mini(html) { return html.replace('class="card', 'style="--cw:54px" class="card'); }
function sheetBody(s) {
  var g = App.doc && App.doc.game, me = myIdx();
  if (s.kind === 'rules') return '<h2>Regole in breve</h2><div class="rules">' + RULES + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'xpinfo') return '<h2>Le espansioni insieme</h2><div class="rules">' + XPINFO + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'log' && g) return '<h2>Registro della partita</h2><div class="loglist">' + g.log.map(function (l) { return '<div class="k-' + l.k + '">' + esc(l.t) + '</div>'; }).join('') + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div class="list">' +
      '<button class="opt" data-act="rules">Regole in breve</button>' +
      '<button class="opt" data-act="invite">Invita amici al tavolo</button>' +
      (d.host !== Net.uid ? '<button class="opt" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="opt" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="opt" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="opt" data-act="tohome">Vai alla home del gioco (resti seduto)</button>' +
      '<button class="opt" data-act="leave">Esci dal tavolo</button></div><button class="btn block ghost" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead" style="margin:0">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn red block" data-act="closeyes">Chiudi per tutti</button><button class="btn block ghost" data-act="close">Annulla</button>';
  if (s.kind === 'zoomchar') return '<div class="zoom">' + charCardHTML(s.id) + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'role' && me >= 0) { var r = g.players[me].role; return '<div class="zoom">' + roleCardHTML(r) + '</div><p class="muted" style="text-align:center;margin:0">Tienilo per te: gli altri non lo vedono.</p><button class="btn block" data-act="close">Chiudi</button>'; }
  if (s.kind === 'event' && g && g.ev) {
    var cur = g.ev.cur, X = cur ? D.EVENTS[cur] : null, left = g.ev.deck.length;
    return '<h2>' + (X ? 'Evento: ' + X.n : 'Eventi') + '</h2>' + (X ? '<div class="zoom">' + PPCards.event(cur, 'big') + '</div><p class="lead" style="margin:0;font-size:17px">' + X.txt + '</p>' : '<p class="lead" style="margin:0">Il primo evento si scopre all’inizio del secondo giro, quando torna il turno dello Sceriffo.</p>') +
      '<p class="muted" style="margin:0">Ogni volta che tocca allo Sceriffo si scopre un nuovo evento, che vale per tutto il giro. ' + (left ? 'Ne restano ' + left + '; l’ultimo, ' + D.EVENTS[g.ev.fin].n + ', resta fino alla fine.' : 'Questo è l’ultimo e resta fino alla fine della partita.') + '</p>' +
      (g.ev.pile.length > 1 ? '<p class="muted" style="margin:0">Già usciti: ' + g.ev.pile.slice(0, -1).map(function (k) { return D.EVENTS[k].n; }).join(', ') + '.</p>' : '') +
      '<button class="btn block" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'card' && g) {
    var inHand = me >= 0 && g.players[me].hand.indexOf(s.id) >= 0, mine = me >= 0 && g.players[me].eq.indexOf(s.id) >= 0;
    var info = inHand ? E.playInfo(g, me, s.id) : mine && E.kind(s.id) === 'g' ? E.greenInfo(g, me, s.id) : { ok: false, why: '' };
    var tname = D.TYPES[E.ty(s.id)].n, btn = '';
    if (inHand) btn = info.ok ? '<button class="btn block" data-act="playsel" data-card="' + s.id + '">' + (info.targets ? 'Gioca e scegli ' + (E.ty(s.id) === 'tequila' ? 'a chi darla' : 'il bersaglio') : 'Gioca ' + tname) + (info.extra ? ' (scarti anche un’altra carta)' : '') + '</button>' : '<p class="why">' + esc(info.why) + '</p>';
    else if (mine && E.kind(s.id) === 'g') btn = info.ok ? '<button class="btn block" data-act="usegreen" data-card="' + s.id + '">Usa ' + tname + (info.targets ? ' e scegli il bersaglio' : '') + '</button>' : '<p class="why">' + esc(info.why) + '</p>';
    return '<div class="zoom">' + cardHTML(s.id) + '</div>' + btn +
      '<button class="btn block ghost" data-act="close">' + (info.ok ? 'Annulla' : 'Chiudi') + '</button>';
  }
  if (s.kind === 'player' && g) {
    var P = g.players[s.p], known = P.role === 'sceriffo' || !P.alive || g.phase === 'over' || s.p === me;
    var eqh = eqListHTML(P, true), dw = me >= 0 && me !== s.p && P.alive && g.players[me].alive ? PPTable.distWhy(g, me, s.p) : '';
    return '<h2>' + esc(P.nick) + '</h2><div class="cards">' + charCardHTML(P.char, P.max) + (known ? roleCardHTML(P.role) : '') + '</div>' +
      '<p class="lead" style="margin:0;font-size:16px"><b style="font-family:var(--f-sc);font-weight:400;color:var(--brass)">Potere</b> · ' + D.CHAR[P.char].txt + '</p>' +
      (eqh ? '<p class="lead" style="margin:0">In gioco davanti a ' + esc(P.nick) + ' (tocca per leggere la carta)</p><div class="pl-eq">' + eqh + '</div>' : '') +
      '<p class="muted" style="margin:0;text-align:center">' + P.hand.length + ' carte in mano' + (dw ? ' · distanza da te: ' + E.distance(g, me, s.p) + ' (' + esc(dw) + ')' : '') + '</p>' +
      (App.doc.host === Net.uid && s.p !== me && P.alive && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') +
      '<button class="btn block" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'steal' && g) {
    var Q = g.players[s.target], what = s.title || 'Quale carta?';
    return '<h2>' + esc(what) + '</h2><div class="list">' +
      (Q.hand.length && !s.eqOnly ? '<button class="opt" data-act="stealpick" data-pick="">' + mini(backHTML()) + '<span>Una carta a caso dalla mano (' + Q.hand.length + ')</span></button>' : '') +
      Q.eq.map(function (c) { return '<button class="opt" data-act="stealpick" data-pick="' + c + '">' + cardHTML(c) + '<span>' + D.TYPES[E.ty(c)].n + ' in gioco</span></button>'; }).join('') +
      '</div><button class="btn block ghost" data-act="cancel">Annulla</button>';
  }
  if (s.kind === 'over' && g) {
    var W = g.winner, won = function (P) { return (W === 'legge' && (P.role === 'sceriffo' || P.role === 'vice')) || (W === 'banditi' && P.role === 'bandito') || (W === 'traditore' && P.role === 'traditore'); };
    return '<div class="over"><div class="poster"><div class="kick">Avviso alla cittadinanza</div><div class="who-won">' + WIN_TXT[W] + '</div></div>' +
      (me >= 0 ? '<p style="margin:0">' + (won(g.players[me]) ? 'Hai vinto, pistolero.' : 'Stavolta è andata male.') + '</p>' : '') +
      '<table>' + g.players.map(function (P) { return '<tr><td>' + esc(P.nick) + '</td><td class="muted">' + D.CHAR[P.char].n + '</td><td>' + D.ROLES[P.role].n + '</td><td class="w">' + (won(P) ? 'vince' : '') + '</td></tr>'; }).join('') + '</table>' +
      Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="muted" style="margin:0">L’host può avviare una nuova partita.</p>') +
      '<button class="btn block ghost" data-act="close">Guarda il tavolo</button></div>';
  }
  if (s.kind === 'decide' && g && me >= 0) return decideBody(g, me);
  return '';
}
function decideBody(g, me) {
  var f = g.stack[g.stack.length - 1]; if (!f || f.who !== me) return '';
  var P = g.players[me], o = E.frameOptions(g, f), from = f.from != null ? esc(g.players[f.from].nick) : '';
  var cardsOpt = function (list, label) { return list.map(function (c) { return '<button class="opt" data-act="resp" data-card="' + c + '">' + cardHTML(c) + '<span>' + label + ' <b>' + D.TYPES[E.ty(c)].n + '</b>' + (E.ty(c) === 'tuffo' ? ' (e peschi una carta)' : '') + '</span></button>'; }).join(''); };
  var greenOpt = function (list) { return list.map(function (c) { return '<button class="opt" data-act="respgreen" data-card="' + c + '">' + cardHTML(c) + '<span>Usa <b>' + D.TYPES[E.ty(c)].n + '</b> che hai in gioco' + (E.ty(c) === 'bibbia' ? ' (e peschi una carta)' : '') + '</span></button>'; }).join(''); };
  var minimize = '<button class="btn block ghost" data-act="close">Guarda prima il tavolo</button>';
  var elena = E.has(g, me, 'elena') ? '<p class="lead" style="margin:0">Sei Elena Fuente: qualsiasi carta vale come Schivata!.</p>' : '';
  if (f.type === 'react' && f.kind === 'stampede') return '<h2>Indiani di ' + from + '!</h2><p class="lead" style="margin:0">Scarta un Bang! o perdi 1 punto vita.</p><div class="list">' + cardsOpt(o.cards, 'Scarta') + '</div><button class="btn red block" data-act="take">Incassa (−1)</button>' + minimize;
  if (f.type === 'react' && f.kind === 'rimbalzo') return '<h2>' + from + ' spara alla tua ' + D.TYPES[E.ty(f.target)].n + '</h2><div class="list">' + mini(cardHTML(f.target)) + '</div><p class="lead" style="margin:0">Gioca una Schivata! per salvarla, altrimenti la scarti. Non perdi punti vita.</p>' + elena + '<div class="list">' + cardsOpt(o.cards, 'Gioca') + greenOpt(o.green) + '</div><button class="btn red block" data-act="take">Lasciala andare</button>' + minimize;
  if (f.type === 'react') {
    var left = f.need - f.got, what = f.from == null ? (f.kind === 'pugnocarte' ? 'Per un pugno di carte!' : 'Ti colpiscono!') : f.kind === 'mitraglia' ? 'La Catling di ' + from + '!' : f.label ? f.label : from + ' ti spara!';
    return '<h2>' + what + '</h2>' +
      '<p class="lead" style="margin:0">' + (left > 1 ? 'Servono ' + left + ' Schivata! per evitare il colpo.' : f.got ? 'Ne serve ancora una.' : 'Schiva o perdi 1 punto vita (ne hai ' + P.hp + ').') + '</p>' + elena + '<div class="list">' +
      (o.barrel ? '<button class="opt" data-act="barrel">' + mini(typeCardHTML('riparo')) + '<span>Usa il <b>Barile</b>: estrai, con Cuori il colpo è schivato' + (f.barrels > 1 ? ' (puoi provare ' + f.barrels + ' volte)' : '') + '.</span></button>' : '') +
      cardsOpt(o.cards, 'Gioca') + greenOpt(o.green) + '</div><button class="btn red block" data-act="take">Incassa il colpo (−1)</button>' + minimize;
  }
  if (f.type === 'roulette') return '<h2>Roulette russa</h2><p class="lead" style="margin:0">Scarta una Schivata! e passa il tamburo al prossimo, oppure perdi 2 punti vita e la roulette si ferma.</p>' + elena + '<div class="list">' + cardsOpt(o.cards, 'Scarta') + greenOpt(o.green) + '</div><button class="btn red block" data-act="take">Incassa (−2)</button>' + minimize;
  if (f.type === 'duel') { var other = esc(g.players[f.who === f.a ? f.b : f.a].nick); return '<h2>Duello con ' + other + '</h2><p class="lead" style="margin:0">Rispondi con un Bang! o perdi il Duello (−1 punto vita).</p><div class="list">' + cardsOpt(o.cards, 'Rispondi con') + '</div><button class="btn red block" data-act="take">Mi arrendo (−1)</button>' + minimize; }
  if (f.type === 'dying') return '<h2>Sei a terra!</h2><p class="lead" style="margin:0">Hai ' + P.hp + ' punti vita. Salvati o lascia il tavolo per sempre.</p><div class="list">' + cardsOpt(o.cards, 'Bevi') +
    (o.doc ? '<button class="opt" data-act="doc">' + mini(charCardHTML('doc')) + '<span>Ricuciti: scarta 2 carte e recupera 1 punto vita.</span></button>' : '') + '</div><button class="btn red block" data-act="die">Accetta il destino</button>';
  if (f.type === 'store') return '<h2>Emporio: scegli una carta</h2><div class="cards">' + f.cards.map(function (c) { return cardHTML(c).replace('class="card', 'data-act="storepick" class="card'); }).join('') + '</div>';
  if (f.type === 'kit') return '<h2>Tieni ' + f.keep + ' carte</h2><p class="lead" style="margin:0">L’altra torna in cima al mazzo.</p><div class="cards">' + f.cards.map(function (c) { return cardHTML(c, App.picks.indexOf(c) >= 0 ? 'pick' : '').replace('class="card', 'data-act="kitpick" class="card'); }).join('') + '</div><button class="btn block" data-act="kitok"' + (App.picks.length === f.keep ? '' : ' disabled') + '>Tieni queste</button>';
  if (f.type === 'discard') return '<h2>Troppe carte in mano</h2><p class="lead" style="margin:0">Puoi tenerne al massimo ' + E.handLimit(g, me) + '. Scegli ' + f.n + (f.n > 1 ? ' carte' : ' carta') + ' da scartare.</p><div class="cards">' + P.hand.map(function (c) { return cardHTML(c, App.picks.indexOf(c) >= 0 ? 'pick' : '').replace('class="card', 'data-act="discpick" class="card'); }).join('') + '</div><button class="btn block" data-act="discok"' + (App.picks.length === f.n ? '' : ' disabled') + '>Scarta ' + App.picks.length + '/' + f.n + '</button>';
  if (f.type === 'vera') return '<h2>Chi copi questo giro?</h2><p class="lead" style="margin:0">Avrai la sua abilità fino al tuo prossimo turno.</p><div class="list">' + f.opts.map(function (c) { return '<button class="opt" data-act="vera" data-char="' + c + '">' + mini(charCardHTML(c)) + '<span><b>' + D.CHAR[c].n + '</b> · ' + D.CHAR[c].s + '</span></button>'; }).join('') + '</div>';
  if (f.type === 'blood') {
    var al = E.aliveIdx(g).filter(function (i) { var Q = g.players[i]; return i !== me && !Q.ghost && Q.hp < Q.max; });
    return '<h2>Fratelli di sangue</h2><p class="lead" style="margin:0">Puoi perdere 1 punto vita per darlo a un altro giocatore ferito.</p><div class="list">' + al.map(function (i) { var Q = g.players[i]; return '<button class="opt" data-act="blood" data-p="' + i + '"><span class="pt-s" style="background-image:url(img/f-' + Q.char + '.jpg)"></span><span>Dona a <b>' + esc(Q.nick) + '</b> (' + Q.hp + '/' + Q.max + ')</span></button>'; }).join('') + '</div><button class="btn block" data-act="bloodskip">No, tengo i miei punti vita</button>';
  }
  if (f.type === 'peyote') return '<h2>Peyote</h2><p class="lead" style="margin:0">Di che colore è la prossima carta? Se indovini la tieni e riprovi; al primo errore smetti. Finora: ' + f.got + (f.got === 1 ? ' carta' : ' carte') + '.</p><div class="row" style="justify-content:center"><button class="btn red" data-act="peyote" data-c="R">Rossa ♥ ♦</button><button class="btn" data-act="peyote" data-c="B" style="background:linear-gradient(180deg,#555,#222);color:#f3e8d0;text-shadow:none">Nera ♠ ♣</button></div>';
  if (f.type === 'ranch') return '<h2>Ranch</h2><p class="lead" style="margin:0">Scegli le carte da cambiare con altrettante del mazzo (anche nessuna).</p><div class="cards">' + P.hand.map(function (c) { return cardHTML(c, App.picks.indexOf(c) >= 0 ? 'pick' : '').replace('class="card', 'data-act="ranchpick" class="card'); }).join('') + '</div><button class="btn block" data-act="ranchok">' + (App.picks.length ? 'Cambia ' + App.picks.length + (App.picks.length === 1 ? ' carta' : ' carte') : 'Non cambio niente') + '</button>';
  if (f.type === 'dalton') return '<h2>I Dalton</h2><p class="lead" style="margin:0">Scegli quale carta blu in gioco scartare.</p><div class="list">' + o.cards.map(function (c) { return '<button class="opt" data-act="dalton" data-card="' + c + '">' + cardHTML(c) + '<span>Scarta <b>' + D.TYPES[E.ty(c)].n + '</b></span></button>'; }).join('') + '</div>';
  return '';
}

/* ---------- azioni composte: carta → bersaglio → carta da rubare → carta da scartare in più ---------- */
function startPend(a, info, opt) {
  opt = opt || {};
  App.pend = { a: a, info: info || {}, cardsNeed: opt.cardsNeed || 0, cardsWhy: opt.cardsWhy, cardsFilter: opt.cardsFilter, cardsKey: opt.cardsKey || 'cards', verb: opt.verb, dist: opt.dist, why: opt.why, eqOnly: opt.eqOnly, stealTitle: opt.stealTitle, stealTitleFor: opt.stealFor, getInfo: opt.getInfo };
  proceed();
}
function proceed() {
  var P = App.pend; if (!P) return;
  var a = P.a, g = App.doc.game, me = myIdx();
  if (P.cardsNeed && a[P.cardsKey] == null) {
    App.mode = 'pick'; App.picks = []; App.pickNeed = P.cardsNeed; App.pickWhy = P.cardsWhy; App.pickFilter = P.cardsFilter;
    App.pickDo = function (cs) { a[P.cardsKey] = P.cardsKey === 'card' ? cs[0] : cs; App.pickFilter = null; if (P.getInfo) P.info = P.getInfo(); proceed(); };
    closeSheet(); render(); return;
  }
  var info = P.info;
  if (info.targets && a.target == null) {
    App.mode = 'target'; App.sel = { card: a.card, info: info, verb: P.verb, dist: P.dist, why: P.why || 'Tocca un giocatore evidenziato al tavolo.' };
    closeSheet(); render(); var r = document.querySelector('.ring'); if (r) r.scrollIntoView({ behavior: 'smooth', block: 'center' }); return;
  }
  if ((info.pick || P.eqOnly) && a.pick === undefined) {
    var Q = g.players[a.target];
    if (P.eqOnly || Q.eq.length) { App.mode = 'idle'; App.sel = null; App.sheet = { kind: 'steal', target: a.target, eqOnly: P.eqOnly, title: P.stealTitle }; render(); return; }
    a.pick = null;
  }
  if (info.extra && a.extra == null) {
    var skip = a.card;
    App.mode = 'pick'; App.picks = []; App.pickNeed = 1; App.pickWhy = 'Scegli l’altra carta da scartare insieme a ' + D.TYPES[E.ty(skip)].n + '.';
    App.pickFilter = function (c) { return c !== skip; };
    App.pickDo = function (cs) { a.extra = cs[0]; App.pickFilter = null; proceed(); };
    closeSheet(); render(); return;
  }
  App.pend = null; App.pickFilter = null;
  act(a);
}
var VERB = { sparo: 'spara', schivata: 'spara', borseggio: 'ruba', sabotaggio: 'fai scartare', ragtime: 'ruba', gattabuia: 'in Prigione', sfida: 'sfida', pugno: 'colpisci', springfield: 'spara', tequila: 'dai la Tequila',
  pugnale: 'colpisci', derringer: 'colpisci', pepperbox: 'spara', fucile: 'spara', cancan: 'fai scartare', conestoga: 'ruba' };
function stealTitle(t, nick) { return (['borseggio', 'ragtime', 'conestoga'].indexOf(t) >= 0 ? 'Cosa rubi a ' : 'Cosa fai scartare a ') + nick + '?'; }
function playCard(g, me, cid, green) {
  var info = green ? E.greenInfo(g, me, cid) : E.playInfo(g, me, cid);
  if (!info.ok) { toast(info.why); return; }
  var t = E.ty(cid), ranged = ['sparo', 'schivata', 'pepperbox'].indexOf(t) >= 0;
  var why = info.targets ? 'Scegli ' + (t === 'tequila' ? 'chi beve la Tequila' : 'il bersaglio per ' + D.TYPES[t].n) + (ranged ? ': gli altri sono fuori tiro, il motivo è scritto sotto il nome.' : '.') : '';
  // per rubare o far scartare: prima a chi, poi quale carta
  startPend({ a: green ? 'green' : 'play', card: cid }, info, { verb: VERB[t] || 'scegli', dist: ranged, why: why, stealFor: info.pick ? t : null });
}

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act],.eqs [data-card],.pl-eq [data-card],[data-plate],.hand .card,[data-zoomchar]');
  if (el && el.matches('.eqs [data-card]') && el.closest('[data-plate]') && App.mode === 'target') el = el.closest('[data-plate]');
  if (!el) return;
  var a = el.getAttribute('data-act');
  var g = App.doc && App.doc.game, me = myIdx();
  if (a === 'sheetback') { if (ev.target === el && App.sheet && App.sheet.kind !== 'decide') { if (App.sheet.kind === 'steal') { App.mode = 'idle'; App.sel = null; App.pend = null; } closeSheet(); render(); } return; }
  if (!a && el.hasAttribute('data-plate')) {
    var p = +el.getAttribute('data-plate');
    if (App.mode === 'target' && App.sel && App.pend) {
      if (App.sel.info.targets.indexOf(p) < 0) { toast(g.players[p] && me >= 0 && p !== me && g.players[p].alive && App.sel.dist ? esc(g.players[p].nick) + ': ' + PPTable.distWhy(g, me, p) + '.' : 'Questo giocatore non è un bersaglio valido.'); return; }
      App.pend.a.target = p; App.mode = 'idle'; App.sel = null;
      if (App.pend.stealTitleFor) App.pend.stealTitle = stealTitle(App.pend.stealTitleFor, g.players[p].nick);
      proceed(); return;
    }
    App.sheet = { kind: 'player', p: p }; renderSheet(); return;
  }
  if (!a && el.hasAttribute('data-zoomchar')) { App.sheet = { kind: 'zoomchar', id: el.getAttribute('data-zoomchar') }; renderSheet(); return; }
  if (!a && el.hasAttribute('data-card')) {
    var id = +el.getAttribute('data-card');
    if (el.closest('.hand') && App.mode === 'pick') { if (App.pickFilter && !App.pickFilter(id)) { toast('Questa carta non va bene qui.'); return; } togglePick(id, App.pickNeed); render(); return; }
    if (el.closest('.hand') && App.mode === 'target') { App.mode = 'idle'; App.sel = null; App.pend = null; }
    App.sheet = { kind: 'card', id: id }; render(); return;
  }
  switch (a) {
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': joinTable(el.getAttribute('data-code')); break;
    case 'gallery': App.screen = 'gallery'; render(); window.scrollTo(0, 0); break;
    case 'back': App.screen = 'lobby'; render(); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'invite': closeSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'xpinfo': App.sheet = { kind: 'xpinfo' }; renderSheet(); break;
    case 'evinfo': App.sheet = { kind: 'event' }; renderSheet(); break;
    case 'leave': closeSheet(); if (!Exit.ask()) leaveTable(); break;
    case 'addbot': addBot(); break;
    case 'kick': removeSeat(el.getAttribute('data-uid')); if (el.getAttribute('data-uid') === Net.uid) leaveTable(); break;
    case 'start': startGame(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); var ll = document.querySelector('.sheet'); if (ll) ll.scrollTop = ll.scrollHeight; break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'takehost': closeSheet(); takeHost(); break;
    case 'totable': toTable(); break;
    case 'tohome': closeSheet(); toHome(); break;
    case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + (el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': closeSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'resume': run(function () { return Net.send({ t: 'back' }); }); break;
    case 'rematch': closeSheet(); rematch(); break;
    case 'close': if (App.sheet && App.sheet.kind === 'decide') App.sheet = null; closeSheet(); render(); break;
    case 'decide': App.sheet = { kind: 'decide' }; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'myrole': App.sheet = { kind: 'role' }; renderSheet(); break;
    case 'auto': closeSheet(); setAuto(+el.getAttribute('data-p'), !g.players[+el.getAttribute('data-p')].bot); break;
    case 'draw': act({ a: 'draw', mode: 'deck' }); break;
    case 'gazzadraw': act({ a: 'draw', mode: 'discard' }); break;
    case 'liquor': act({ a: 'draw', mode: 'liquor' }); break;
    case 'natedraw':
      startPend({ a: 'draw', mode: 'player' }, { targets: g.players.map(function (P, i) { return P.alive && i !== me && P.hand.length ? i : -1; }).filter(function (i) { return i >= 0; }) }, { verb: 'sfila', why: 'Scegli da chi sfilare una carta.' }); break;
    case 'patdraw':
      startPend({ a: 'draw', mode: 'pat' }, { targets: g.players.map(function (P, i) { return P.alive && i !== me && P.eq.length ? i : -1; }).filter(function (i) { return i >= 0; }) }, { verb: 'prendi', why: 'Scegli da chi prendere una carta in gioco.', eqOnly: true, stealTitle: 'Quale carta prendi?' }); break;
    case 'end': act({ a: 'end' }); break;
    case 'cancel': App.mode = 'idle'; App.sel = null; App.picks = []; App.pend = null; App.pickFilter = null; closeSheet(); render(); break;
    case 'playsel': playCard(g, me, +el.getAttribute('data-card'), false); break;
    case 'usegreen': playCard(g, me, +el.getAttribute('data-card'), true); break;
    case 'stealpick': { var pk = el.getAttribute('data-pick'); if (!App.pend) { closeSheet(); render(); break; } App.pend.a.pick = pk === '' ? null : +pk; closeSheet(); proceed(); break; }
    case 'chuck': act({ a: 'ability', k: 'chuck' }); break;
    case 'jose': startPend({ a: 'ability', k: 'jose' }, {}, { cardsNeed: 1, cardsKey: 'card', cardsWhy: 'Scegli la carta blu da scartare.', cardsFilter: function (c) { return E.kind(c) === 'e'; } }); break;
    case 'docholy': startPend({ a: 'ability', k: 'docholy' }, E.abilityInfo(g, me, 'docholy'), { cardsNeed: 2, cardsWhy: 'Scegli 2 carte da scartare per sparare.', verb: 'spara', dist: true, why: 'Scegli a chi sparare.' }); break;
    case 'sniper': startPend({ a: 'sniper' }, E.sniperInfo(g, me), { cardsNeed: 2, cardsWhy: 'Scegli i 2 Bang! da giocare insieme.', cardsFilter: function (c) { return E.isBangLike(g, me, c); }, verb: 'spara', dist: true, why: 'Scegli il bersaglio del Cecchino: servono 2 Schivata! per evitarlo.' }); break;
    case 'ricochet': startPend({ a: 'ricochet' }, E.ricochetInfo(g, me), { cardsNeed: 1, cardsKey: 'card', cardsWhy: 'Scegli il Bang! da usare.', cardsFilter: function (c) { return E.isBangLike(g, me, c); }, verb: 'mira', why: 'Scegli di chi colpire una carta in gioco.', eqOnly: true, stealTitle: 'Quale carta colpisci?' }); break;
    case 'barrel': act({ a: 'respond', r: 'barrel' }); break;
    case 'take': act({ a: 'respond', r: 'take' }); break;
    case 'die': act({ a: 'respond', r: 'die' }); break;
    case 'resp': act({ a: 'respond', r: 'card', card: +el.getAttribute('data-card') }); break;
    case 'respgreen': act({ a: 'respond', r: 'green', card: +el.getAttribute('data-card') }); break;
    case 'storepick': act({ a: 'respond', r: 'pick', card: +el.getAttribute('data-card') }); break;
    case 'kitpick': { var fk = g.stack[g.stack.length - 1]; togglePick(+el.getAttribute('data-card'), fk ? fk.keep : 2); renderSheet(); break; }
    case 'kitok': act({ a: 'respond', r: 'keep', cards: App.picks.slice() }); break;
    case 'discpick': { var f = g.stack[g.stack.length - 1]; togglePick(+el.getAttribute('data-card'), f ? f.n : 1); renderSheet(); break; }
    case 'discok': act({ a: 'respond', r: 'discard', cards: App.picks.slice() }); break;
    case 'ranchpick': togglePick(+el.getAttribute('data-card'), 99); renderSheet(); break;
    case 'ranchok': act({ a: 'respond', r: 'ranch', cards: App.picks.slice() }); break;
    case 'vera': act({ a: 'respond', r: 'vera', char: el.getAttribute('data-char') }); break;
    case 'blood': act({ a: 'respond', r: 'blood', target: +el.getAttribute('data-p') }); break;
    case 'bloodskip': act({ a: 'respond', r: 'skip' }); break;
    case 'peyote': act({ a: 'respond', r: 'guess', c: el.getAttribute('data-c') }); break;
    case 'dalton': act({ a: 'respond', r: 'dalton', card: +el.getAttribute('data-card') }); break;
    case 'doc': closeSheet(); App.mode = 'pick'; App.picks = []; App.pickNeed = 2; App.pickFilter = null; App.pickWhy = 'Scegli 2 carte da scartare per ricucirti.'; App.pickDo = function (cs) { act({ a: 'doc', cards: cs }); }; render(); break;
    case 'pickok': if (App.pickDo) App.pickDo(App.picks.slice()); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') run(function () { return Net.send({ t: 'opt', timer: +ev.target.value }); });
  if (ev.target.id === 'opt-vis') run(function () { return Net.send({ t: 'vis', vis: ev.target.value }); });
  var m = /^opt-(dc|hn|fc)$/.exec(ev.target.id || '');
  if (m) { var o = { t: 'opt' }; o[m[1]] = ev.target.checked; run(function () { return Net.send(o); }); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Enter' && e.target && e.target.hasAttribute && e.target.hasAttribute('data-plate')) e.target.click();
  if (e.key === 'Escape' && App.sheet && App.sheet.kind !== 'decide') { closeSheet(); render(); }
});
function togglePick(id, max) { var i = App.picks.indexOf(id); if (i >= 0) App.picks.splice(i, 1); else if (App.picks.length < max) App.picks.push(id); else { App.picks.shift(); App.picks.push(id); } }
function copyText(t, ok) {
  try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(t); }); } catch (e) { toast(t); }
}

var RULES = '<p>Ognuno riceve in segreto un <b>ruolo</b> e un <b>pistolero</b>. Solo lo Sceriffo si rivela e comincia. I punti vita sono i proiettili sulla carta del personaggio, e sono anche il numero massimo di carte che puoi tenere in mano a fine turno.</p>' +
  '<h3>Chi vince</h3><ul><li><b>Sceriffo e Vicesceriffi</b>: eliminano tutti i Fuorilegge e il Rinnegato.</li><li><b>Fuorilegge</b>: eliminano lo Sceriffo.</li><li><b>Rinnegato</b>: resta l’ultimo in vita, con lo Sceriffo eliminato per ultimo.</li></ul>' +
  '<h3>Il turno</h3><ul><li><b>Pesca</b> 2 carte.</li><li><b>Gioca</b> quante carte vuoi, ma un solo Bang! a turno.</li><li><b>Scarta</b> le carte che superano i tuoi punti vita, poi passa.</li></ul>' +
  '<h3>Leggere il tavolo</h3><p>Sei sempre seduto in basso; gli altri sono intorno al tavolo nell’ordine vero dei turni (le frecce indicano il verso, quella dorata va dal tuo posto al prossimo). Il numero nel mirino accanto a ogni giocatore è la sua <b>distanza da te</b>, già contando Mustang, Mirino e gli eliminati: verde se è a tiro della tua arma, grigio se no. Quando scegli un bersaglio, sotto chi è fuori tiro trovi il motivo.</p>' +
  '<h3>Distanza e armi</h3><p>La distanza è il numero di posti tra due giocatori vivi, nel verso più breve. Puoi sparare solo a chi è entro la portata della tua arma: senza armi hai la Pistola, portata 1. Il Mustang ti allontana di 1 per gli altri, il Mirino avvicina tutti di 1 per te. Si tiene una sola arma alla volta.</p>' +
  '<h3>Estrarre</h3><p>Barile, Prigione e Dinamite chiedono di girare la prima carta del mazzo e guardarne il seme e il valore, nell’angolo in alto a sinistra.</p>' +
  '<h3>Taglie e penalità</h3><ul><li>Chi elimina un Fuorilegge pesca 3 carte.</li><li>Se lo Sceriffo elimina un suo Vice, scarta tutte le carte.</li><li>Quando arrivi a zero puoi bere una Birra per salvarti, ma non quando restate in due.</li></ul>' +
  '<h3>Dodge City</h3><ul><li><b>Carte verdi</b>: si mettono in gioco come le blu, ma si usano solo dal turno dopo, scartandole. Alcune funzionano anche fuori turno come Schivata! (Bibbia, Cappello, Placca, Sombrero).</li><li><b>«+1 carta scartata»</b>: Rag Time, Rissa, Springfield, Tequila e Whisky chiedono di scartare anche un’altra carta dalla mano.</li><li><b>Pugno!</b>, Springfield e le armi verdi non contano nel limite di un Bang! per turno.</li><li>15 nuovi personaggi e il tavolo fino a <b>8 giocatori</b> (con 2 Rinnegati, che vincono ognuno per conto suo).</li></ul>' +
  '<h3>Eventi (Mezzogiorno di Fuoco, Per un Pugno di Carte)</h3><p>Dal secondo giro, ogni volta che tocca allo Sceriffo si scopre un evento che cambia le regole per tutto il giro: lo vedi al centro del tavolo (toccalo per leggerlo). L’ultima carta del mazzo eventi resta fino alla fine.</p>' +
  '<h3>Giocare online</h3><ul><li>Chi apre il tavolo è l’host: il suo telefono tiene la partita e muove i pistoleri automatici. Se chiude il gioco o mette il telefono in standby, dopo qualche secondo gli altri possono prendere il comando e continuare.</li><li>Se un amico si assenta, l’host può farlo giocare in automatico toccando il suo posto. Appena torna e gioca una carta, riprende il controllo.</li><li>Le partite passano da un server pubblico gratuito: usa un soprannome e non scrivere dati personali.</li></ul>';

var XPINFO = '<p>Le tre espansioni sono fatte per stare insieme: puoi attivarne una, due o tutte e tre.</p>' +
  '<ul><li><b>Dodge City</b> aggiunge carte e personaggi: si mescolano al mazzo base. Serve per giocare in 8.</li>' +
  '<li><b>Mezzogiorno di Fuoco</b> e <b>Per un Pugno di Carte</b> sono due mazzi di eventi. Da soli si usano tutti; insieme se ne pescano 12 a caso dai due mazzi e in fondo va una delle due carte finali (Mezzogiorno di Fuoco o Per un Pugno di Carte).</li>' +
  '<li>Con Dodge City e gli eventi insieme valgono queste precisazioni: le carte verdi sono «carte in gioco», quindi subiscono il <b>Lazo</b>, il <b>Giudice</b> e l’abilità di Belle Star; <b>I Dalton</b> fanno scartare solo carte blu; <b>Benedizione</b> e <b>Maledizione</b> cambiano anche i semi per Apache Kid; la <b>Sbornia</b> spegne anche le abilità dei personaggi di Dodge City (Vera Custer compresa).</li>' +
  '<li>Più avanti si potranno aggiungere senza problemi anche Valle delle Ombre e Wild West Show.</li></ul>';

var CREDITS = ['Frederic Remington (1861–1909): illustrazioni per Wolfville di A. H. Lewis (1897), Pony Tracks (1895), Stories of the West (1914), Harper’s Weekly e i dipinti Fired On, A Texas Pony, Coming and Going of the Pony Express, Downing the Nigh Leader, Holding Up the Pay Escort, Hands Up!, A Cracker Cowboy, The Cavalry Picket, An East-Side Politician, The Cow Boy.',
  'Rufus F. Zogbaum, Painting the Town Red (Harper’s Weekly, 1886) · Cattle Raid on the Texas Border e Slaughtered for the Hide (Harper’s Weekly, 1874) · Mary L. Stone, Interior of a Country Store (1872).',
  'Charles M. Russell, cowgirl su un cavallo imbizzarrito · Charles Dana Gibson (1902) · cartoline americane d’inizio Novecento (Take Care!, I’ll Catch You!, A Bunco Game) · fotografia di cowgirl, circa 1900.',
  'Alhambra Saloon, Tombstone (1880) · pubblicità d’epoca: Elliot’s New Repeaters (1864), casseforti Julius Ochs (1870), Winchester (1898) · revolver Colt (1878) · fucile Sharps · Explosion au Mont-Valérien (1873).',
  'Dodge City: Charles M. Russell (A Bad Hoss, In Without Knocking), Frank Tenney Johnson, N. C. Wyeth (Arizona Nights, copertina del Saturday Evening Post del 1907), Charles Schreyvogel, Charles Dana Gibson, Harrison Fisher, Jules Chéret (Bal au Moulin Rouge, 1889), Scott Joplin (Maple Leaf Rag, 1899), William Henry Jackson (Robber’s Roost, 1870), la caccia ai bisonti di George Catlin, Stanley L. Wood, Edwin John Prittie, H. Langden Brown, un’incisione tedesca dei mestieri, oggetti del Metropolitan Museum, della Livrustkammaren e del parco di Gettysburg.',
  'Tutte di pubblico dominio (o CC0), da Wikimedia Commons. Ritagliate e virate leggermente in seppia, senza alterarne il disegno. Le carte evento sono avvisi tipografici disegnati per il gioco.',
  'Musica: «Western Streets» di Kevin MacLeod (incompetech.com, licenza CC BY 3.0) e «Maple Leaf Rag» suonata da Scott Joplin (rullo per pianola del 1916, pubblico dominio). Suoni: spari ed esplosione di pubblico dominio da Wikimedia Commons, nitrito di Hü (pubblico dominio); gli altri effetti sono sintetizzati.'];

/* ---------- avvio ---------- */
(function boot() {
  PPCards.preload();
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet('pp-table');
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || (myNick() && q.get('auto') !== '0')) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
