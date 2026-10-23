/* ===== Interfaccia ===== */
var D = PPData, E = PPEngine, ART = PPArt, BOT = PPBot;
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

/* ---------- carte in HTML ---------- */
function cardHTML(id, extra) {
  var C = D.CARDS[id], T = D.TYPES[C.t], red = C.s === 'H' || C.s === 'D';
  return '<div class="card k-' + T.kind + ' ' + (extra || '') + '" data-card="' + id + '"><div class="cin">' +
    '<div class="c-idx' + (red ? ' red' : '') + '"><span>' + C.r + '</span><span class="s">' + D.SUITSYM[C.s] + '</span></div>' +
    (T.w ? '<div class="c-range" title="Portata">' + T.w + '</div>' : '') +
    '<div class="c-title">' + T.n + '</div><div class="c-art">' + ART.card(C.t) + '</div>' +
    '<div class="c-txt">' + T.txt + '</div><div class="c-foot">' + (T.kind === 'e' ? (T.w ? 'Arma' : 'Equipaggiamento') : 'Immediata') + '</div></div></div>';
}
function typeCardHTML(t) {
  var T = D.TYPES[t];
  return '<div class="card k-' + T.kind + '"><div class="cin">' + (T.w ? '<div class="c-range">' + T.w + '</div>' : '') +
    '<div class="c-title">' + T.n + '</div><div class="c-art">' + ART.card(t) + '</div><div class="c-txt">' + T.txt + '</div><div class="c-foot">' + (T.kind === 'e' ? (T.w ? 'Arma' : 'Equipaggiamento') : 'Immediata') + '</div></div></div>';
}
function charCardHTML(cid, hp, extra) {
  var C = D.CHAR[cid], n = hp == null ? C.hp : hp, b = '';
  for (var i = 0; i < n; i++) b += '<i></i>';
  return '<div class="card char ' + (extra || '') + '" data-char="' + cid + '"><div class="cin"><div class="c-title">' + C.n + '</div><div class="c-sub">' + C.title + '</div>' +
    '<div class="c-art">' + ART.portrait(cid) + '</div><div class="c-hp">' + b + '</div><div class="c-txt">' + C.txt + '</div></div></div>';
}
function roleCardHTML(r) {
  var R = D.ROLES[r];
  return '<div class="card rolec"><div class="cin"><div class="c-title">' + R.n + '</div><div class="c-art">' + ART.role(r) + '</div><div class="c-txt">' + R.goal + '</div></div></div>';
}
function backHTML(extra) { return '<div class="card back ' + (extra || '') + '">' + ART.back() + '</div>'; }
function hpHTML(P) { var s = '<span class="hp" aria-label="' + P.hp + ' punti vita su ' + P.max + '">'; for (var i = 0; i < P.max; i++) s += '<i' + (i < P.hp ? '' : ' class="lost"') + '></i>'; return s + '</span>'; }

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
      if (doc.seats.length >= 7) return { err: 'Il tavolo è pieno (7 giocatori).' };
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
      if (doc.seats.length >= 7) return { err: 'Il tavolo è pieno.' };
      var used = doc.seats.map(function (s) { return s.nick; }), nm = BOTNAMES.filter(function (b) { return used.indexOf(b) < 0; })[0] || 'Bot';
      doc.seats.push({ uid: 'bot-' + Math.random().toString(36).slice(2, 8), nick: nm, bot: true });
      return {};
    }
    case 'start': {
      if (!isHost) return hostOnly();
      if (doc.phase !== 'lobby') return { changed: false };
      if (doc.seats.length < 4) return { err: 'Servono almeno 4 giocatori: aggiungi dei pistoleri automatici.' };
      var seats = doc.seats.slice();
      for (var i = seats.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = seats[i]; seats[i] = seats[j]; seats[j] = t; }
      doc.game = E.newGame(seats); doc.phase = 'play';
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
Turns.setup({
  decider: function (g) { return E.decider(g); },
  onTimeout: function (cur, d) { var P = cur.game.players[d]; P.bot = true; P.away = true; Turns.awayLog(cur.game, d); return true; }
});
Net.setLobbyInfo(function (d) { return { max: 7, note: d.opts && d.opts.timer === 0 ? 'senza timer' : '' }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora reggi tu il tavolo e muovi i pistoleri automatici.'); render(); });

/* ---------- azioni ---------- */
async function run(p) { if (App.busy) return; App.busy = true; render(); try { await p(); } catch (e) { toast(typeof e === 'string' ? e : (e && e.message) || 'Qualcosa è andato storto. Riprova.'); } finally { App.busy = false; render(); } }
function requireNick() {
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
  if (!/^[A-Z]{4}$/.test(code)) { toast('Il codice del tavolo ha 4 lettere.'); return; }
  var nick = requireNick(); if (!nick) return;
  App.status = 'Cerco il tavolo ' + code + '…';
  run(function () { return enterTable(code, nick); });
}
async function enterTable(code, nick) {
  App.code = code; App.doc = null; App.flashInit = false; App.mode = 'idle'; App.sheet = null; App.botKey = null;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { if (App.screen === 'table' && App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; onDoc();
  }, function () {
    var sig = Net.connected + ':' + Net.hostAlive() + ':' + Net.isHost;
    if (sig !== App.netSig) { App.netSig = sig; render(); }
  });
  if (!ok) { App.screen = 'lobby'; App.code = null; lsSet('pp-table', null); Lobby.forget(code); render(); throw 'Il tavolo ' + code + ' non esiste più (è stato chiuso o è scaduto). L’ho tolto dai tuoi tavoli recenti.'; }
  lsSet('pp-table', code); remember(code);
  if (nick) {
    var out = await Net.send({ t: 'join', nick: nick });
    if (out === 'spect' && myIdx() < 0) toast('La partita è già in corso: la guardi da spettatore.');
  }
  history.replaceState(null, '', location.pathname + '?t=' + code);
}
function addBot() { run(function () { return Net.send({ t: 'addbot' }); }); }
function removeSeat(uid) { run(function () { return Net.send({ t: 'kick', uid: uid }); }); }
function startGame() { run(function () { return Net.send({ t: 'start' }); }); }
function rematch() { run(function () { return Net.send({ t: 'rematch' }); }); }
function takeHost() { Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i pistoleri automatici.'); }
function setAuto(p, on) { run(function () { return Net.send({ t: 'auto', p: p, on: on }); }); }
function act(a) {
  App.mode = 'idle'; App.sel = null; App.picks = []; closeSheet();
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
function leaveTable(silent) {
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
  var url = inviteLink(), text = 'Siediti al mio tavolo di Polvere & Piombo: codice ' + App.code;
  if (navigator.share) { navigator.share({ title: 'Polvere & Piombo', text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}
function myIdx() { var g = App.doc && App.doc.game; if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }

function onDoc() {
  var g = App.doc.game;
  if (g && !App.flashInit) { App.lastFlash = g.flash ? g.flash.n : 0; App.flashInit = true; }
  if (!g) App.flashInit = false;
  // apri automaticamente il foglio di decisione quando tocca a me rispondere
  var me = myIdx();
  if (g && g.phase === 'play' && me >= 0) {
    var top = g.stack[g.stack.length - 1];
    var key = top && top.who === me ? g.seq + ':' + top.type + ':' + (top.got || 0) + ':' + (top.i || 0) : null;
    if (key && key !== App.decKey) { App.decKey = key; App.mode = 'idle'; App.picks = []; App.sheet = { kind: 'decide' }; }
    if (!key && App.sheet && App.sheet.kind === 'decide') App.sheet = null;
    if (!key) App.decKey = null;
    if (E.decider(g) !== me && (App.mode === 'target' || App.mode === 'nate')) { App.mode = 'idle'; App.sel = null; }
  }
  if (App.sheet && App.sheet.kind === 'over' && (!g || g.phase !== 'over')) App.sheet = null;
  if (g && g.phase === 'over' && !App.sheet && !App.overShown) { App.overShown = g.seq; App.sheet = { kind: 'over' }; }
  if (!g || g.phase !== 'over') App.overShown = null;
  render();
  playFlash();
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
  if (App.screen === 'lobby') { renderLobbyList(); Lobby.start(); } else Lobby.end();
  renderSheet();
}

function lobbyHTML() {
  var fan = '';
  var fanItems = [ { h: backHTML() }, { h: charCardHTML('abner') }, { h: typeCardHTML('sparo') } ];
  fanItems.forEach(function (f, i) { fan += f.h.replace('class="card', 'style="transform:translateX(-50%) rotate(' + ((i - 1) * 13) + 'deg) translateX(' + ((i - 1) * 22) + 'px)" class="card'); });
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b class="mono">' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><a href="../" style="color:var(--muted);text-decoration:none;font-size:15px">← Tutti i giochi</a>' +
    '<section class="hero"><div><h1>Polvere <span class="amp">&amp;</span> Piombo</h1><p class="tag">Ruoli segreti, pistole e whisky. Apri un tavolo, condividi il codice e sfida i tuoi amici, ognuno dal proprio telefono.</p></div>' +
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
  var seats = '';
  for (var i = 0; i < 7; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div><div class="nm">' + esc(s.nick) + '</div><div class="sub">' + (s.bot ? 'pistolero automatico' : s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else seats += '<div class="seat"><div class="ava">·</div><div class="sub">Posto libero</div></div>';
  }
  var n = d.seats.length;
  return '<div class="topbar"><div class="wrap"><span class="brand">P&amp;P</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span><button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' +
    '<section class="panel"><span class="lead">Codice del tavolo</span><div class="row"><span class="codebig">' + esc(d.code) + '</span></div>' +
    '<div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede al tavolo dal suo telefono, senza registrarsi. In alternativa basta aprire il gioco e scrivere il codice. Servono da 4 a 7 giocatori; i posti mancanti si riempiono con pistoleri automatici.</p></section>' +
    '<section class="panel"><h2>Al tavolo (' + n + '/7)</h2><div class="seats">' + seats + '</div>' +
    (isHost ? '<div class="row"><button class="btn ghost" data-act="addbot"' + (n >= 7 ? ' disabled' : '') + '>Aggiungi pistolero automatico</button><button class="btn" data-act="start"' + (n < 4 ? ' disabled' : '') + '>Inizia la partita</button></div>' + (n < 4 ? '<p class="lead">Mancano ' + (4 - n) + ' giocatori per iniziare.</p>' : '')
      : seated ? '<p class="lead">In attesa che l’host inizi la partita.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    '</section><section class="panel">' + Lobby.roomHTML(d, isHost) + Turns.optionHTML(d, isHost) +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' + hostBanner() + '</div>';
}

function connInfo(txt) { return Net.connected ? txt : '<span style="color:#f08070">Riconnessione…</span> ' + txt; }
function hostBanner() {
  var d = App.doc; if (!d || Net.isHost || Net.hostAlive()) return '';
  var h = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  return '<div class="notice red">' + esc(h ? h.nick : 'L’host') + ' non risponde: forse ha chiuso il gioco o ha il telefono in standby. Tra pochi secondi il comando passa da solo a un altro giocatore, oppure prendilo tu adesso.' +
    '<div class="row" style="margin-top:8px"><button class="btn small" data-act="takehost">Prendi il comando</button></div></div>';
}
function plateHTML(g, i, me, targets) {
  var P = g.players[i], C = D.CHAR[P.char], top = g.stack[g.stack.length - 1];
  var cls = ['plate'];
  if (g.turn === i && g.phase === 'play') cls.push('turn');
  if (top && top.who === i && top.who !== g.turn) cls.push('dec');
  if (!P.alive) cls.push('dead');
  if (targets) cls.push(targets.indexOf(i) >= 0 ? 'target' : 'notarget');
  var role = P.role === 'sceriffo' ? '<span class="badge star">★ Sceriffo</span>' : (!P.alive || g.phase === 'over' || i === me) ? '<span class="badge">' + D.ROLES[P.role].n + '</span>' : '';
  var chips = P.eq.map(function (c) { var t = E.ty(c), T = D.TYPES[t]; return '<span class="chip' + (T.w ? ' w' : '') + (t === 'gattabuia' || t === 'candelotto' ? ' bad' : '') + '">' + T.n + (T.w ? ' ' + T.w : '') + '</span>'; }).join('');
  if (!E.weapon(P) && P.alive) chips = '<span class="chip ab">Pistola 1</span>' + chips;
  var dist = me >= 0 && me !== i && P.alive && g.players[me].alive ? '<span class="dist">dist ' + E.distance(g, me, i) + '</span>' : '';
  return '<button class="' + cls.join(' ') + '" data-plate="' + i + '">' +
    '<div class="pic">' + ART.portrait(P.char) + '</div>' +
    '<div class="who"><div class="nick">' + esc(P.nick) + (P.bot ? ' <span class="muted" style="font-size:11px">(auto)</span>' : '') + '</div><div class="chr">' + C.n + '</div></div>' +
    '<div class="stats" style="grid-column:2">' + hpHTML(P) + '<span class="handct"><b></b>' + P.hand.length + '</span>' + dist + '</div>' +
    (role ? '<div class="chips">' + role + '</div>' : '') +
    '<div class="chips">' + chips + '</div></button>';
}

function statusText(g, me) {
  if (g.phase === 'over') return { big: g.winner === 'legge' ? 'Vince la legge' : g.winner === 'banditi' ? 'Vincono i Banditi' : 'Vince il Traditore', small: 'Partita finita.' };
  var top = g.stack[g.stack.length - 1], T = g.players[g.turn], n = function (i) { return i === me ? 'tu' : esc(g.players[i].nick); };
  var big = (g.turn === me ? 'Il tuo turno' : 'Turno di ' + esc(T.nick)), small = '';
  if (!top) small = g.step === 'draw' ? (g.turn === me ? 'Pesca le tue carte.' : 'Sta pescando.') : (g.turn === me ? 'Gioca le tue carte, poi passa il turno.' : 'Sta giocando le sue carte.');
  else if (top.type === 'react') small = top.kind === 'stampede' ? 'Stampede: ' + n(top.who) + ' deve scartare uno Sparo!.' : (top.kind === 'mitraglia' ? 'Mitraglia: ' : 'Sparo: ') + n(top.who) + ' deve schivare' + (top.need > 1 ? ' (servono ' + (top.need - top.got) + ' Schivata!)' : '') + '.';
  else if (top.type === 'duel') small = 'Sfida: tocca a ' + n(top.who) + ' rispondere con uno Sparo!.';
  else if (top.type === 'dying') small = n(top.who) + ' è a terra: può salvarsi?';
  else if (top.type === 'store') small = 'Bottega: sceglie ' + n(top.who) + '.';
  else if (top.type === 'kit') small = n(top.who) + ' sceglie quali carte tenere.';
  else if (top.type === 'discard') small = n(top.who) + ' scarta le carte in eccesso.';
  return { big: big, small: small };
}

function tableHTML() {
  var d = App.doc, g = d.game, me = myIdx(), n = g.players.length;
  var order = []; var start = me >= 0 ? me : 0; for (var k = 1; k <= n; k++) { var i = (start + k) % n; if (i !== me) order.push(i); }
  if (me < 0) order = g.players.map(function (_, i) { return i; });
  var targets = App.mode === 'target' && App.sel ? App.sel.info.targets : App.mode === 'nate' ? g.players.map(function (P, i) { return P.alive && i !== me && P.hand.length ? i : -1; }).filter(function (i) { return i >= 0; }) : null;
  var st = statusText(g, me), top = g.stack[g.stack.length - 1];
  var disc = g.disc.length ? cardHTML(g.disc[g.disc.length - 1]) : '<div class="empty"></div>';
  var feed = g.log.slice(-4).map(function (l) { return '<div class="k-' + l.k + '">' + esc(l.t) + '</div>'; }).join('');
  var store = top && top.type === 'store' ? '<div class="panel" style="padding:10px"><span class="lead">Sul banco della Bottega</span><div class="row">' + top.cards.map(function (c) { return cardHTML(c).replace('class="card', 'style="--cw:70px" class="card'); }).join('') + '</div></div>' : '';
  var meHTML = '';
  if (me >= 0) {
    var P = g.players[me];
    var w = E.weapon(P), wr = E.range(P);
    var bangs = (P.char === 'lark' || (w != null && E.ty(w) === 'ripetitore')) ? 'illimitati' : (g.turn === me ? (E.canPlayBang(g, me) ? '1 disponibile' : 'già usato') : '1 per turno');
    meHTML = '<section class="me' + (g.turn === me ? ' turnme' : '') + '">' + charCardHTML(P.char, P.max).replace('class="card', 'data-zoomchar="' + P.char + '" class="card') +
      '<div style="min-width:0"><h3>' + esc(P.nick) + '</h3><div class="muted" style="font-size:13px">' + D.CHAR[P.char].n + ' · ' + D.CHAR[P.char].title + '</div>' +
      '<div class="row" style="margin-top:6px">' + hpHTML(P) + '<span class="muted mono" style="font-size:12px">' + Math.max(P.hp, 0) + '/' + P.max + '</span></div>' +
      '<div class="muted" style="font-size:13px;margin-top:4px">Portata ' + wr + (w == null ? ' (Pistola)' : '') + ' · Sparo!: ' + bangs + '</div>' +
      '<button class="btn ghost small rolebtn" data-act="myrole">' + (P.role === 'sceriffo' ? '★ Sceriffo' : 'Il tuo ruolo') + '</button>' +
      (P.eq.length ? '<div class="eq">' + P.eq.map(function (c) { return cardHTML(c); }).join('') + '</div>' : '') + '</div></section>';
  }
  return '<div class="topbar"><div class="wrap"><span class="brand">P&amp;P</span><span class="info">' + connInfo('Tavolo ' + esc(d.code) + ' · ' + g.players.filter(function (P) { return P.alive; }).length + ' in vita') + '</span>' +
    '<button class="iconbtn" data-act="log">Registro</button><button class="iconbtn" data-act="menu">Menu</button></div></div>' +
    '<main class="wrap board">' + hostBanner() + '<div class="opps">' + order.map(function (i) { return plateHTML(g, i, me, targets); }).join('') + '</div>' +
    '<section class="center"><div class="pile">' + backHTML() + '<span>' + g.deck.length + ' nel mazzo</span></div><div class="pile">' + disc + '<span>scarti</span></div>' +
    '<div class="status"><div class="big">' + st.big + '</div><div class="small">' + st.small + '</div><div class="feed" style="margin-top:6px">' + feed + '</div></div></section>' +
    store + meHTML + '</main>' + dockHTML(g, me);
}

function dockHTML(g, me) {
  var hint = '', actions = '', hand = '';
  var P = me >= 0 ? g.players[me] : null;
  var top = g.stack[g.stack.length - 1];
  if (!P) hint = 'Stai guardando la partita.';
  else {
    var pickable = App.mode === 'pick';
    hand = P.hand.length ? P.hand.map(function (c) {
      var x = '';
      if (pickable) x = App.picks.indexOf(c) >= 0 ? 'pick' : '';
      else if (App.sel && App.sel.card === c) x = 'sel';
      return cardHTML(c, x);
    }).join('') : '<span class="emptyhand">' + (P.alive ? 'Nessuna carta in mano.' : 'Sei fuori dalla partita. Puoi continuare a guardare.') + '</span>';
    var myTurnFree = g.phase === 'play' && g.turn === me && !top;
    if (g.phase === 'over') { hint = 'Partita finita.'; actions = '<button class="btn" data-act="showover">Risultati</button>'; }
    else if (App.mode === 'target') { hint = 'Scegli il bersaglio per <b>' + D.TYPES[E.ty(App.sel.card)].n + '</b> tra i giocatori evidenziati.'; actions = '<button class="btn ghost" data-act="cancel">Annulla</button>'; }
    else if (App.mode === 'nate') { hint = 'Scegli da chi sfilare una carta.'; actions = '<button class="btn ghost" data-act="cancel">Annulla</button>'; }
    else if (App.mode === 'pick') {
      var need = App.pickNeed;
      hint = App.pickWhy + ' <b>' + App.picks.length + '/' + need + '</b>';
      actions = '<button class="btn ghost" data-act="cancel">Annulla</button><button class="btn" data-act="pickok"' + (App.picks.length === need ? '' : ' disabled') + '>Conferma</button>';
    }
    else if (top && top.who === me) { hint = '<b>Devi decidere.</b>'; actions = '<button class="btn" data-act="decide">Rispondi</button>'; }
    else if (myTurnFree && g.step === 'draw') {
      hint = '<b>Il tuo turno.</b> Pesca le carte.';
      actions = '<button class="btn" data-act="draw">Pesca dal mazzo</button>';
      if (P.char === 'nate') actions += '<button class="btn ghost" data-act="natedraw">Sfila a un giocatore</button>';
      if (P.char === 'gazza' && g.disc.length) actions += '<button class="btn ghost" data-act="gazzadraw">Prendi ' + D.TYPES[E.ty(g.disc[g.disc.length - 1])].n + '</button>';
    }
    else if (myTurnFree && g.step === 'play') { hint = '<b>Il tuo turno.</b> Tocca una carta per giocarla.'; actions = '<button class="btn red" data-act="end">Fine turno</button>'; }
    else { var st = statusText(g, me); hint = st.big + (st.small ? ' — ' + st.small : ''); }
    if (P.alive && P.char === 'doc' && P.hp < P.max && P.hand.length >= 2 && g.phase === 'play' && App.mode === 'idle' && !(top && top.who === me))
      actions = '<button class="btn ghost" data-act="doc">Ricuciti (2 carte)</button>' + actions;
    if (g.phase === 'play' && E.decider(g) === me) hint += '<span id="tt"></span>';
    if (P.bot && P.alive && g.phase === 'play') { hint = '<b>Stai giocando in automatico</b> perché sei stato fermo troppo a lungo.'; actions = '<button class="btn" data-act="resume">Riprendo io</button>'; }
  }
  return '<div class="dock"><div class="wrap"><div class="hint">' + hint + '</div>' + (P ? '<div class="hand" aria-label="La tua mano">' + hand + '</div>' : '') + (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div></div>';
}

function galleryHTML() {
  return '<div class="topbar"><div class="wrap"><span class="brand">P&amp;P</span><span class="info">Mazzo e personaggi</span><button class="iconbtn" data-act="back">Indietro</button></div></div>' +
    '<div class="wrap gallery"><h2>Le 80 carte del mazzo</h2><div class="ggrid">' +
    D.ORDER.map(function (t) { return '<div class="gitem">' + typeCardHTML(t) + '<span class="cnt">× ' + D.TYPES[t].count + '</span></div>'; }).join('') +
    '<div class="gitem">' + backHTML() + '<span class="cnt">dorso</span></div></div>' +
    '<h2>I 16 pistoleri</h2><div class="ggrid">' + D.CHARS.map(function (c) { return '<div class="gitem">' + charCardHTML(c.id) + '</div>'; }).join('') + '</div>' +
    '<h2>I ruoli segreti</h2><div class="ggrid">' + ['sceriffo', 'vice', 'bandito', 'traditore'].map(function (r) { return '<div class="gitem">' + roleCardHTML(r) + '</div>'; }).join('') + '</div></div>';
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
function sheetBody(s) {
  var g = App.doc && App.doc.game, me = myIdx();
  if (s.kind === 'rules') return '<h2>Regole in breve</h2><div class="rules">' + RULES + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'log' && g) return '<h2>Registro della partita</h2><div class="loglist">' + g.log.map(function (l) { return '<div class="k-' + l.k + '">' + esc(l.t) + '</div>'; }).join('') + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div class="list">' +
      '<button class="opt" data-act="rules">Regole in breve</button>' +
      '<button class="opt" data-act="invite">Invita amici al tavolo</button>' +
      (d.host !== Net.uid ? '<button class="opt" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="opt" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="opt" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="opt" data-act="leave">Esci dal tavolo</button></div><button class="btn block ghost" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead" style="margin:0">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn red block" data-act="closeyes">Chiudi per tutti</button><button class="btn block ghost" data-act="close">Annulla</button>';
  if (s.kind === 'zoomchar') return '<div class="zoom">' + charCardHTML(s.id) + '</div><button class="btn block" data-act="close">Chiudi</button>';
  if (s.kind === 'role' && me >= 0) { var r = g.players[me].role; return '<div class="zoom">' + roleCardHTML(r) + '</div><p class="muted" style="text-align:center;margin:0">Tienilo per te: gli altri non lo vedono.</p><button class="btn block" data-act="close">Chiudi</button>'; }
  if (s.kind === 'card' && g) {
    var info = me >= 0 ? E.playInfo(g, me, s.id) : { ok: false, why: '' };
    var inHand = me >= 0 && g.players[me].hand.indexOf(s.id) >= 0;
    return '<div class="zoom">' + cardHTML(s.id) + '</div>' +
      (inHand ? (info.ok ? '<button class="btn block" data-act="playsel" data-card="' + s.id + '">' + (info.targets ? 'Gioca e scegli il bersaglio' : 'Gioca ' + D.TYPES[E.ty(s.id)].n) + '</button>' : '<p class="why">' + esc(info.why) + '</p>') : '') +
      '<button class="btn block ghost" data-act="close">' + (inHand && info.ok ? 'Annulla' : 'Chiudi') + '</button>';
  }
  if (s.kind === 'player' && g) {
    var P = g.players[s.p], known = P.role === 'sceriffo' || !P.alive || g.phase === 'over' || s.p === me;
    return '<h2>' + esc(P.nick) + '</h2><div class="cards">' + charCardHTML(P.char, P.max) + (known ? roleCardHTML(P.role) : '') + '</div>' +
      (P.eq.length ? '<p class="lead" style="margin:0">In gioco davanti a lui</p><div class="cards">' + P.eq.map(function (c) { return cardHTML(c); }).join('') + '</div>' : '') +
      '<p class="muted" style="margin:0;text-align:center">' + P.hand.length + ' carte in mano' + (me >= 0 && me !== s.p && P.alive ? ' · distanza da te: ' + E.distance(g, me, s.p) : '') + '</p>' +
      (App.doc.host === Net.uid && s.p !== me && P.alive && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') +
      '<button class="btn block" data-act="close">Chiudi</button>';
  }
  if (s.kind === 'steal' && g) {
    var Q = g.players[s.target];
    return '<h2>' + (E.ty(s.card) === 'borseggio' ? 'Cosa rubi a ' : 'Cosa fai scartare a ') + esc(Q.nick) + '?</h2><div class="list">' +
      (Q.hand.length ? '<button class="opt" data-act="stealpick" data-pick="">' + backHTML().replace('class="card', 'style="--cw:54px" class="card') + '<span>Una carta a caso dalla mano (' + Q.hand.length + ')</span></button>' : '') +
      Q.eq.map(function (c) { return '<button class="opt" data-act="stealpick" data-pick="' + c + '">' + cardHTML(c) + '<span>' + D.TYPES[E.ty(c)].n + ' in gioco</span></button>'; }).join('') +
      '</div><button class="btn block ghost" data-act="cancel">Annulla</button>';
  }
  if (s.kind === 'over' && g) {
    var W = g.winner, won = function (P) { return (W === 'legge' && (P.role === 'sceriffo' || P.role === 'vice')) || (W === 'banditi' && P.role === 'bandito') || (W === 'traditore' && P.role === 'traditore'); };
    return '<div class="over"><div class="who-won">' + (W === 'legge' ? 'Vince la legge' : W === 'banditi' ? 'Vincono i Banditi' : 'Vince il Traditore') + '</div>' +
      (me >= 0 ? '<p style="margin:0">' + (won(g.players[me]) ? 'Hai vinto, pistolero.' : 'Stavolta è andata male.') + '</p>' : '') +
      '<table>' + g.players.map(function (P) { return '<tr><td>' + esc(P.nick) + '</td><td class="muted">' + D.CHAR[P.char].n + '</td><td>' + D.ROLES[P.role].n + '</td><td class="w">' + (won(P) ? 'vince' : '') + '</td></tr>'; }).join('') + '</table>' +
      (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="muted" style="margin:0">L’host può avviare una nuova partita.</p>') +
      '<button class="btn block ghost" data-act="close">Guarda il tavolo</button></div>';
  }
  if (s.kind === 'decide' && g && me >= 0) return decideBody(g, me);
  return '';
}
function decideBody(g, me) {
  var f = g.stack[g.stack.length - 1]; if (!f || f.who !== me) return '';
  var P = g.players[me], o = E.frameOptions(g, f), from = f.from != null ? esc(g.players[f.from].nick) : '';
  var cardsOpt = function (list, label) { return list.map(function (c) { return '<button class="opt" data-act="resp" data-card="' + c + '">' + cardHTML(c) + '<span>' + label + ' <b>' + D.TYPES[E.ty(c)].n + '</b></span></button>'; }).join(''); };
  var minimize = '<button class="btn block ghost" data-act="close">Guarda prima il tavolo</button>';
  if (f.type === 'react' && f.kind !== 'stampede') {
    var left = f.need - f.got;
    return '<h2>' + (f.kind === 'mitraglia' ? 'La Mitraglia di ' + from + '!' : from + ' ti spara!') + '</h2>' +
      '<p class="lead" style="margin:0">' + (left > 1 ? 'Servono ' + left + ' Schivata! per evitare il colpo.' : f.got ? 'Ne serve ancora una.' : 'Schiva o perdi 1 punto vita (ne hai ' + P.hp + ').') + '</p><div class="list">' +
      (o.barrel ? '<button class="opt" data-act="barrel">' + typeCardHTML('riparo').replace('class="card', 'style="--cw:54px" class="card') + '<span>Mettiti al <b>Riparo</b>: estrai, con Cuori il colpo è schivato' + (f.barrels > 1 ? ' (puoi provare ' + f.barrels + ' volte)' : '') + '.</span></button>' : '') +
      cardsOpt(o.cards, 'Gioca') + '</div><button class="btn red block" data-act="take">Incassa il colpo (−1)</button>' + minimize;
  }
  if (f.type === 'react') return '<h2>Stampede di ' + from + '!</h2><p class="lead" style="margin:0">Scarta uno Sparo! o perdi 1 punto vita.</p><div class="list">' + cardsOpt(o.cards, 'Scarta') + '</div><button class="btn red block" data-act="take">Incassa (−1)</button>' + minimize;
  if (f.type === 'duel') { var other = esc(g.players[f.who === f.a ? f.b : f.a].nick); return '<h2>Sfida con ' + other + '</h2><p class="lead" style="margin:0">Rispondi con uno Sparo! o perdi la Sfida (−1 punto vita).</p><div class="list">' + cardsOpt(o.cards, 'Rispondi con') + '</div><button class="btn red block" data-act="take">Mi arrendo (−1)</button>' + minimize; }
  if (f.type === 'dying') return '<h2>Sei a terra!</h2><p class="lead" style="margin:0">Hai ' + P.hp + ' punti vita. Salvati o lascia il tavolo per sempre.</p><div class="list">' + cardsOpt(o.cards, 'Bevi') +
    (o.doc ? '<button class="opt" data-act="doc">' + charCardHTML('doc').replace('class="card', 'style="--cw:54px" class="card') + '<span>Ricuciti: scarta 2 carte e recupera 1 punto vita.</span></button>' : '') + '</div><button class="btn red block" data-act="die">Accetta il destino</button>';
  if (f.type === 'store') return '<h2>Bottega: scegli una carta</h2><div class="cards">' + f.cards.map(function (c) { return cardHTML(c).replace('class="card', 'data-act="storepick" class="card'); }).join('') + '</div>';
  if (f.type === 'kit') return '<h2>Tieni 2 carte</h2><p class="lead" style="margin:0">La terza torna in cima al mazzo.</p><div class="cards">' + f.cards.map(function (c) { return cardHTML(c, App.picks.indexOf(c) >= 0 ? 'pick' : '').replace('class="card', 'data-act="kitpick" class="card'); }).join('') + '</div><button class="btn block" data-act="kitok"' + (App.picks.length === 2 ? '' : ' disabled') + '>Tieni queste due</button>';
  if (f.type === 'discard') return '<h2>Troppe carte in mano</h2><p class="lead" style="margin:0">Puoi tenerne al massimo quanti sono i tuoi punti vita (' + P.hp + '). Scegli ' + f.n + (f.n > 1 ? ' carte' : ' carta') + ' da scartare.</p><div class="cards">' + P.hand.map(function (c) { return cardHTML(c, App.picks.indexOf(c) >= 0 ? 'pick' : '').replace('class="card', 'data-act="discpick" class="card'); }).join('') + '</div><button class="btn block" data-act="discok"' + (App.picks.length === f.n ? '' : ' disabled') + '>Scarta ' + App.picks.length + '/' + f.n + '</button>';
  return '';
}

/* ---------- effetti ---------- */
function playFlash() {
  var g = App.doc && App.doc.game; if (!g || !g.flash) return;
  var f = g.flash; if (f.n <= App.lastFlash) return;
  App.lastFlash = f.n;
  var plate = function (i) { return document.querySelector('[data-plate="' + i + '"]'); };
  function stamp(txt, red) { var s = document.createElement('div'); s.className = 'stamp' + (red ? ' red' : ''); s.textContent = txt; document.body.appendChild(s); setTimeout(function () { s.remove(); }, 1200); }
  function reveal(id, cap) { var r = document.createElement('div'); r.className = 'reveal'; r.innerHTML = cardHTML(id) + '<span class="cap">' + esc(cap) + '</span>'; document.body.appendChild(r); setTimeout(function () { r.remove(); }, 1700); }
  if (f.kind === 'bang') { stamp('Bang!'); var t = plate(f.t); if (t) t.classList.add('shake'); }
  if (f.kind === 'hit') { var h = plate(f.p); if (h) h.classList.add('hitflash', 'shake'); else if (f.p === myIdx()) stamp('Colpito!', true); }
  if (f.kind === 'death') stamp('Eliminato', true);
  if (f.kind === 'check') reveal(f.card, 'Estrazione di ' + g.players[f.p].nick);
  if (f.kind === 'card' && f.p !== myIdx()) reveal(f.card, g.players[f.p].nick + ' gioca');
}

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act],[data-plate],.hand .card,[data-zoomchar],.me .eq .card');
  if (!el) return;
  var a = el.getAttribute('data-act');
  var g = App.doc && App.doc.game, me = myIdx();
  if (a === 'sheetback') { if (ev.target === el && App.sheet && App.sheet.kind !== 'decide') { if (App.sheet.kind === 'steal') { App.mode = 'idle'; App.sel = null; } closeSheet(); render(); } return; }
  if (!a && el.hasAttribute('data-plate')) {
    var p = +el.getAttribute('data-plate');
    if (App.mode === 'target' && App.sel) {
      if (App.sel.info.targets.indexOf(p) < 0) { toast('Questo giocatore non è un bersaglio valido.'); return; }
      if (App.sel.info.pick) { App.sheet = { kind: 'steal', card: App.sel.card, target: p }; renderSheet(); return; }
      act({ a: 'play', card: App.sel.card, target: p }); return;
    }
    if (App.mode === 'nate') { act({ a: 'draw', mode: 'player', target: p }); return; }
    App.sheet = { kind: 'player', p: p }; renderSheet(); return;
  }
  if (!a && el.hasAttribute('data-zoomchar')) { App.sheet = { kind: 'zoomchar', id: el.getAttribute('data-zoomchar') }; renderSheet(); return; }
  if (!a && el.classList.contains('card') && el.hasAttribute('data-card')) {
    var id = +el.getAttribute('data-card');
    if (el.closest('.hand') && App.mode === 'pick') { togglePick(id, App.pickNeed); render(); return; }
    if (el.closest('.hand') && (App.mode === 'target' || App.mode === 'nate')) { App.mode = 'idle'; App.sel = null; }
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
    case 'leave': closeSheet(); leaveTable(); break;
    case 'addbot': addBot(); break;
    case 'kick': removeSeat(el.getAttribute('data-uid')); if (el.getAttribute('data-uid') === Net.uid) leaveTable(); break;
    case 'start': startGame(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); var ll = document.querySelector('.sheet'); if (ll) ll.scrollTop = ll.scrollHeight; break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'takehost': closeSheet(); takeHost(); break;
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
    case 'natedraw': App.mode = 'nate'; render(); break;
    case 'gazzadraw': act({ a: 'draw', mode: 'discard' }); break;
    case 'end': act({ a: 'end' }); break;
    case 'cancel': App.mode = 'idle'; App.sel = null; App.picks = []; closeSheet(); render(); break;
    case 'playsel': {
      var cid = +el.getAttribute('data-card'), info = E.playInfo(g, me, cid);
      if (!info.ok) { toast(info.why); return; }
      if (info.targets) { App.mode = 'target'; App.sel = { card: cid, info: info }; closeSheet(); render(); window.scrollTo({ top: 0, behavior: 'smooth' }); return; }
      act({ a: 'play', card: cid }); break;
    }
    case 'stealpick': { var pk = el.getAttribute('data-pick'); act({ a: 'play', card: App.sheet.card, target: App.sheet.target, pick: pk === '' ? null : +pk }); break; }
    case 'barrel': act({ a: 'respond', r: 'barrel' }); break;
    case 'take': act({ a: 'respond', r: 'take' }); break;
    case 'die': act({ a: 'respond', r: 'die' }); break;
    case 'resp': act({ a: 'respond', r: 'card', card: +el.getAttribute('data-card') }); break;
    case 'storepick': act({ a: 'respond', r: 'pick', card: +el.getAttribute('data-card') }); break;
    case 'kitpick': togglePick(+el.getAttribute('data-card'), 2); renderSheet(); break;
    case 'kitok': act({ a: 'respond', r: 'keep', cards: App.picks.slice() }); break;
    case 'discpick': { var f = g.stack[g.stack.length - 1]; togglePick(+el.getAttribute('data-card'), f ? f.n : 1); renderSheet(); break; }
    case 'discok': act({ a: 'respond', r: 'discard', cards: App.picks.slice() }); break;
    case 'doc': closeSheet(); App.mode = 'pick'; App.picks = []; App.pickNeed = 2; App.pickWhy = 'Scegli 2 carte da scartare per ricucirti.'; App.pickDo = function (cs) { act({ a: 'doc', cards: cs }); }; render(); break;
    case 'pickok': if (App.pickDo) App.pickDo(App.picks.slice()); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') run(function () { return Net.send({ t: 'opt', timer: +ev.target.value }); });
  if (ev.target.id === 'opt-vis') run(function () { return Net.send({ t: 'vis', vis: ev.target.value }); });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet && App.sheet.kind !== 'decide') { closeSheet(); render(); }
});
function togglePick(id, max) { var i = App.picks.indexOf(id); if (i >= 0) App.picks.splice(i, 1); else if (App.picks.length < max) App.picks.push(id); else { App.picks.shift(); App.picks.push(id); } }
function copyText(t, ok) {
  try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(t); }); } catch (e) { toast(t); }
}

var RULES = '<p>Ognuno riceve in segreto un <b>ruolo</b> e un <b>pistolero</b>. Solo lo Sceriffo si rivela e comincia. I punti vita sono i proiettili sulla carta del personaggio, e sono anche il numero massimo di carte che puoi tenere in mano a fine turno.</p>' +
  '<h3>Chi vince</h3><ul><li><b>Sceriffo e Vicesceriffi</b>: eliminano tutti i Banditi e il Traditore.</li><li><b>Banditi</b>: eliminano lo Sceriffo.</li><li><b>Traditore</b>: resta l’ultimo in vita, con lo Sceriffo eliminato per ultimo.</li></ul>' +
  '<h3>Il turno</h3><ul><li><b>Pesca</b> 2 carte.</li><li><b>Gioca</b> quante carte vuoi, ma un solo Sparo! a turno.</li><li><b>Scarta</b> le carte che superano i tuoi punti vita, poi passa.</li></ul>' +
  '<h3>Distanza e armi</h3><p>La distanza è il numero di posti tra due giocatori vivi, nel verso più breve. Puoi sparare solo a chi è entro la portata della tua arma: senza armi hai la Pistola, portata 1. Il Cavallo ti allontana di 1 per gli altri, il Cannocchiale avvicina tutti di 1 per te. Si tiene una sola arma alla volta.</p>' +
  '<h3>Estrarre</h3><p>Riparo, Gattabuia e Candelotto chiedono di girare la prima carta del mazzo e guardarne il seme e il valore, nell’angolo in alto a sinistra.</p>' +
  '<h3>Taglie e penalità</h3><ul><li>Chi elimina un Bandito pesca 3 carte.</li><li>Se lo Sceriffo elimina un suo Vice, scarta tutte le carte.</li><li>Quando arrivi a zero puoi bere un Whisky per salvarti, ma non quando restate in due.</li></ul>' +
  '<h3>Giocare online</h3><ul><li>Chi apre il tavolo è l’host: il suo telefono tiene la partita e muove i pistoleri automatici. Se chiude il gioco o mette il telefono in standby, dopo qualche secondo gli altri possono prendere il comando e continuare.</li><li>Se un amico si assenta, l’host può farlo giocare in automatico toccando la sua scheda. Appena torna e gioca una carta, riprende il controllo.</li><li>Le partite passano da un server pubblico gratuito: usa un soprannome e non scrivere dati personali.</li></ul>';

/* ---------- avvio ---------- */
(function boot() {
  document.body.insertAdjacentHTML('afterbegin', ART.DEFS);
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet('pp-table');
  if (/^[A-Z]{4}$/.test(t)) {
    if (t === last || (myNick() && q.get('auto') !== '0')) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
