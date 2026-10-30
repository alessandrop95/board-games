/* ===== Unlock!: interfaccia (tavolo condiviso, sala d'attesa, scelta dell'avventura) ===== */
var E = UEngine, BOT = UBot, ART = UArt, RU = URules, SCN = UScen;
function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
function lsGet(k) { try { return localStorage.getItem(k); } catch (e) { return null; } }
function lsSet(k, v) { try { if (v == null) localStorage.removeItem(k); else localStorage.setItem(k, v); } catch (e) {} }
var $ = function (s) { return document.querySelector(s); };
var App = { screen: 'lobby', code: null, doc: null, sheet: null, busy: false, sheetKey: null, introShown: false, lastFxN: null, view: null, sel: null, mac: null, codeIn: '' };
var PCOL = ['#e8553f', '#3f8be8', '#3dbb6b', '#e8b53f', '#a764e0', '#e05fa6'];
var KEY_TABLE = 'ul-table', KEY_RECENT = 'ul-recent';
var IC = ART.icon;

function toast(msg, cls, ms) { var t = document.createElement('div'); t.className = 'toast ' + (cls || ''); t.setAttribute('role', 'status'); t.innerHTML = msg; document.body.appendChild(t); setTimeout(function () { t.remove(); }, ms || 3400); }
function myNick() { return (lsGet('pp-nick') || '').trim().slice(0, 18); }
function G() { return App.doc && App.doc.game; }
function myIdx() { var g = G(); if (!g) return -1; for (var i = 0; i < g.players.length; i++) if (g.players[i].uid === Net.uid) return i; return -1; }
function pname(g, p) { return p >= 0 && g.players[p] ? '<b class="pn-c" style="--pc:' + PCOL[g.players[p].col % PCOL.length] + '">' + esc(g.players[p].nick) + '</b>' : ''; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function scenOf(d) { var o = (d && d.opts) || {}; return o.scen && SCN.S[o.scen] ? o.scen : d && d.practice ? 'soffitta' : 'abisso'; }

/* ---------- orologio: il tempo lo tiene l'host; ogni telefono stima lo scarto col suo orologio ---------- */
var Clock = (function () {
  var samples = [], host = null, skew = 0;
  function observe(doc) {
    if (!doc) return;
    if (doc.host !== host) { host = doc.host; samples = []; skew = 0; }
    if (Net.isHost) { skew = 0; return; }
    if (doc.updated) { samples.push(Date.now() - doc.updated); if (samples.length > 15) samples.shift(); skew = Math.min.apply(null, samples); }
  }
  function now() { return Date.now() - (Net.isHost ? 0 : skew); }
  // sull'host: se il comando è appena passato a questo telefono, l'orologio del gioco riparte da qui
  function adopt(g) { if (!g) return; if (g.hostId !== Net.uid) { g.at = Date.now(); g.hostId = Net.uid; } }
  return { observe: observe, now: now, adopt: adopt };
})();

/* ---------- regole del tavolo (girano sull'host) ---------- */
function uniqueNick(seats, n) { var base = n, k = 2; while (seats.some(function (s) { return s.nick.toLowerCase() === n.toLowerCase(); })) n = base + ' ' + k++; return n; }
var MAXP = 6;
function tableReducer(doc, from, op) {
  var isHost = doc.host === from, seat = doc.seats.filter(function (s) { return s.uid === from; })[0];
  var hostOnly = { err: 'Solo chi ha aperto il tavolo può farlo.' };
  switch (op.t) {
    case 'join': {
      var nick = String(op.nick || '').trim().slice(0, 18) || 'Giocatore';
      doc.opts = doc.opts || {}; if (doc.opts.timer == null) doc.opts.timer = 0;
      if (seat) { if (doc.phase === 'lobby' && seat.nick !== nick) { seat.nick = uniqueNick(doc.seats.filter(function (s) { return s !== seat; }), nick); return {}; } return { changed: false, out: 'seated' }; }
      if (doc.phase === 'play' && doc.game && doc.seats.length < MAXP && !doc.practice) {   // cooperativo: ci si può unire anche ad avventura iniziata
        var nn = uniqueNick(doc.seats, nick), used = doc.game.players.map(function (P) { return P.col; }), col = 0; while (used.indexOf(col) >= 0) col++;
        doc.seats.push({ uid: from, nick: nn }); doc.game.players.push({ uid: from, nick: nn, col: col % PCOL.length });
        doc.game.log.push({ n: ++doc.game.logN, t: nn + ' si unisce alla squadra.', p: null, k: 'sys' }); return {};
      }
      if (doc.phase !== 'lobby') return { changed: false, out: 'spect' };
      if (doc.seats.length >= MAXP) return { err: 'Il tavolo è pieno (' + MAXP + ' giocatori).' };
      doc.seats.push({ uid: from, nick: uniqueNick(doc.seats, nick) }); return {};
    }
    case 'leave': case 'kick': {
      var who = op.t === 'leave' ? from : op.uid;
      if (op.t === 'kick' && who !== from && !isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      doc.seats = doc.seats.filter(function (s) { return s.uid !== who; });
      if (doc.host === who) { var h = doc.seats[0]; doc.host = h ? h.uid : null; }
      return {};
    }
    case 'addbot': return { changed: false };   // gioco cooperativo: niente giocatori automatici
    case 'vis': if (!isHost) return hostOnly; doc.vis = op.vis === 'invite' ? 'invite' : 'public'; return {};
    case 'opt': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      doc.opts = doc.opts || {};
      if (op.timer != null) doc.opts.timer = 0;
      if (op.scen != null && SCN.S[op.scen]) doc.opts.scen = op.scen;
      return {};
    }
    case 'start': {
      if (!isHost) return hostOnly;
      if (doc.phase !== 'lobby') return { changed: false };
      if (!doc.seats.length) return { err: 'Al tavolo non c’è nessuno.' };
      var o = clone(doc.opts || {}); o.scen = scenOf(doc);
      doc.game = E.newGame(doc.seats.slice(), o, Date.now()); doc.game.hostId = Net.uid; doc.phase = 'play'; return {};
    }
    case 'rematch': if (!isHost) return hostOnly; doc.phase = 'lobby'; doc.game = null; return {};
    case 'act': {
      var g = doc.game; if (!g) return { err: 'La partita non è più disponibile.' };
      var p = -1; g.players.forEach(function (P, k) { if (P.uid === from) p = k; });
      if (p < 0) return { err: 'Stai solo guardando questa partita.' };
      Clock.adopt(g);
      var err = E.act(g, p, op.a, Date.now());
      if (err === 'same') return { changed: false };
      if (err) return { err: err };
      if (g.phase === 'over') doc.phase = 'over';
      return {};
    }
  }
  return { err: 'Azione sconosciuta.' };
}
Net.setReducer(tableReducer);
Coach.setup({ bots: 0, startText: 'Prima volta? Prova il tutorial guidato da solo: ti suggerisco ogni passo.',
  myTurn: function (g, me) { return me >= 0 && g.phase === 'play'; },
  tip: function (g, me) {
    if (me < 0) return null;
    var f = BOT.focus(g); if (!f) return 'Quasi fatto!';
    var c = E.card(g, f.card), s = f.step, h = c && c.h ? c.h[0] : '';
    var what = s.a === 'reveal' ? 'Cerca un numero da scoprire sulla carta <b>' + esc(f.card) + '</b> (' + esc(c.t) + ').' : s.a === 'combine' ? 'Prova a unire la carta rossa <b>' + esc(s.r) + '</b> con una blu.' : s.a === 'code' ? 'Il lucchetto <b>' + esc(s.id) + '</b> aspetta un codice.' : 'Prova la macchina <b>' + esc(s.id) + '</b>.';
    return what + (h ? ' <span style="opacity:.85">Indizio: ' + h + '</span>' : '');
  } });
Score.setup({ game: 'unlock', result: function (g) { return g.players.map(function () { return { won: !!g.won, place: g.won ? 1 : null, score: g.stars || 0 }; }); } });
Turns.setup({ decider: function () { return null; }, onTimeout: function () { return false; } });
Net.setBeforePublish(function (doc) {
  Score.beforePublish(doc); doc.turnKey = null;
  if (doc.game && doc.phase === 'play') { Clock.adopt(doc.game); E.tick(doc.game, Date.now()); }
});
// l'host ripubblica lo stato ogni tanto: chi è appena arrivato allinea il suo orologio a quello del tavolo
setInterval(function () { var d = App.doc; if (Net.isHost && Net.connected && d && d.game && d.phase === 'play' && !d.game.paused) Net.hostApply(function (cur) { return !!(cur && cur.game && cur.phase === 'play'); }); }, 20000);
Net.setLobbyInfo(function (d) { var S = SCN.get(scenOf(d)); return { max: MAXP, note: S.name + ' · ' + S.min + ' min' }; });
Net.setOnTakeover(function () { toast('L’host non rispondeva: ora il tavolo e il tempo li reggi tu.'); render(); });

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
      if (Net.isHost && !d0.seats.some(function (s) { return s.uid !== Net.uid; })) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
    }
  }
  App.code = code; App.doc = null; App.sheet = null; App.view = null; App.sel = null; App.mac = null; App.sheetKey = null; App.introShown = false; App.lastFxN = null; App.seenFirstDoc = false;
  App.screen = 'table'; render();
  var ok = await Net.open(code, function (doc) {
    if (!doc) { Lobby.forget(code); if (App.code === code) { toast(App.closing ? 'Hai chiuso il tavolo ' + code + '.' : 'Il tavolo ' + code + ' è stato chiuso dall’host.'); App.closing = false; leaveTable(true); } return; }
    App.doc = doc; Clock.observe(doc); onDoc();
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
function quiet(a) { Net.send({ t: 'act', a: a }).catch(function () {}); }   // senza bloccare l'interfaccia (sguardi, segnalazioni)

function curTableHTML() {
  if (!App.code || !App.doc) return '<div id="curtable"></div>';
  var d = App.doc, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), host = d.seats.filter(function (s) { return s.uid === d.host; })[0];
  var st = d.phase === 'play' ? 'avventura in corso' : d.phase === 'over' ? 'avventura finita' : 'in attesa · ' + d.seats.length + (d.seats.length === 1 ? ' giocatore' : ' giocatori');
  return '<div id="curtable" class="notice row"><span style="flex:1;min-width:180px">' + (seated ? 'Sei seduto al tavolo' : 'Stai guardando il tavolo') + ' <b>' + esc(d.code) + '</b>' + (host ? ' di ' + esc(host.nick) : '') + ' · ' + st + '</span><button class="btn small" data-act="totable">Torna al tavolo</button></div>';
}
function paintCur() { var el = document.getElementById('curtable'); if (el) el.outerHTML = curTableHTML(); }
function toTable() { if (!App.code) return; App.screen = 'table'; Nav.guard(App.code); if (App.doc) onDoc(); else render(); window.scrollTo(0, 0); }
function toHome() { if (history.state && history.state.ppTable) history.back(); else { App.screen = 'lobby'; render(); window.scrollTo(0, 0); } }
Nav.setup(function (state) {
  if (App.screen === 'table' && App.code) {
    if (App.sheet) { App.sheet = null; render(); Nav.guard(App.code); return; }
    if (App.view) { Game.closeView(); Nav.guard(App.code); return; }
    App.screen = 'lobby'; render(); window.scrollTo(0, 0); return;
  }
  if (state && state.ppTable && state.ppTable === App.code && App.doc) { App.screen = 'table'; onDoc(); }
});
function leaveTable(silent) {
  Chat.reset();
  var d = App.doc;
  if (!silent && d && d.phase === 'lobby' && d.seats.some(function (s) { return s.uid === Net.uid; })) {
    var others = d.seats.filter(function (s) { return s.uid !== Net.uid; });
    if (Net.isHost && !others.length) Net.clearTable(); else Net.send({ t: 'leave' }).catch(function () {});
  }
  setTimeout(function () { Net.close(); }, 400);
  App.code = null; App.doc = null; App.view = null; App.sel = null; lsSet(KEY_TABLE, null); history.replaceState(null, '', location.pathname);
  App.screen = 'lobby'; App.sheet = null; render();
}
function inviteLink() { return location.origin + location.pathname + '?t=' + App.code; }
function copyText(t, ok) { try { navigator.clipboard.writeText(t).then(function () { toast(ok || 'Copiato'); }, function () { toast(esc(t)); }); } catch (e) { toast(esc(t)); } }
function invite() {
  var url = inviteLink(), text = 'Vieni a giocare a ' + document.title + ' con me: codice ' + App.code;
  if (navigator.share) { navigator.share({ title: document.title, text: text, url: url }).catch(function () {}); return; }
  copyText(url, 'Link d’invito copiato');
}

/* ---------- stato in arrivo ---------- */
function onDoc() {
  var g = G(), me = myIdx();
  if (App.screen !== 'table') { Turns.watch(App.doc); paintCur(); return; }
  if (g) {
    if (g.phase === 'over' && App.sheetKey !== 'over' + App.code + (App.doc.gid || '')) { App.sheetKey = 'over' + App.code + (App.doc.gid || ''); App.overAt = Date.now() + (App.seenFirstDoc ? 2600 : 0); }
    if (me >= 0 && !App.introShown) { App.introShown = true; if (!lsGet('ul-intro-done')) App.sheet = { kind: 'intro', page: 0 }; }
    Game.fx(g, me);
    App.seenFirstDoc = true;
  } else { App.view = null; App.sel = null; }
  render(); Turns.watch(App.doc);
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
  document.body.setAttribute('data-th', App.screen === 'table' && App.doc ? SCN.get(G() ? G().scen : scenOf(App.doc)).theme : 'home');
  if (App.screen === 'table' && App.doc && App.doc.game && App.doc.phase !== 'lobby') { Lobby.end(); Game.render(); renderSheet(); return; }
  Game.unmount();
  if (App.screen === 'lobby') root.innerHTML = lobbyHTML();
  else if (!App.doc) root.innerHTML = '<div class="wrap lobby"><p class="muted">' + esc(App.status || 'Mi siedo al tavolo…') + '</p></div>';
  else root.innerHTML = roomHTML();
  if (App.screen === 'lobby') Lobby.start(); else Lobby.end();
  renderSheet();
}
function heroArt() {
  return '<div class="hero-cards" aria-hidden="true"><div class="hc hc1">' + ART.back('abisso') + '</div><div class="hc hc2">' + ART.card('abisso', 'A', { text: false, cls: 'thumb' }) + '</div>' +
    '<div class="hc hc3">' + ART.card('abisso', '94', { text: false, cls: 'thumb' }) + '</div><div class="hc hc4">' + ART.card('abisso', '7', { text: false, cls: 'thumb' }) + '</div><div class="hero-key"></div></div>';
}
function scenRow(sid, on, pick) {
  var S = SCN.S[sid];
  return '<' + (pick ? 'button data-act="scen" data-s="' + sid + '"' : 'div') + ' class="scn' + (on ? ' on' : '') + '">' +
    '<span class="scn-art">' + ART.card(sid, 'start', { text: false, cls: 'thumb' }) + '</span>' +
    '<span class="scn-txt"><span class="kicker">' + S.kicker + '</span><b>' + S.name + '</b><span class="scn-meta">' + IC('clock') + S.min + ' minuti · difficoltà ' + '<i class="lv">' + [1, 2, 3].map(function (k) { return '<em class="' + (k <= S.level ? 'on' : '') + '"></em>'; }).join('') + '</i></span><span class="scn-bl">' + S.blurb + '</span></span>' +
    (on ? '<span class="scn-ok">' + IC('star') + '</span>' : '') + '</' + (pick ? 'button' : 'div') + '>';
}
function lobbyHTML() {
  var inv = App.inviteCode ? '<div class="notice">Sei stato invitato al tavolo <b>' + esc(App.inviteCode) + '</b>. Scrivi il tuo nome e tocca Siediti.</div>' : '';
  return '<div class="wrap lobby"><div class="row" style="justify-content:space-between"><a class="back-link" href="../">← Tutti i giochi</a>' + Sound.buttonHTML() + '</div>' + curTableHTML() +
    '<section class="hero"><div class="hero-txt"><div class="kicker">Escape room cooperativa</div><h1>Unlock!</h1><p class="tag">Siete chiusi dentro. Il timer scorre. Scoprite le carte, unite gli oggetti, decifrate i codici e fate funzionare le macchine: insieme, ognuno dal suo telefono. Da 1 a 6 giocatori.</p></div>' + heroArt() + '</section>' + inv +
    '<div class="grid2"><section class="panel"><h2>Il tuo nome</h2><label class="lead" for="nick">Come ti vedranno gli altri al tavolo</label><input id="nick" class="field" maxlength="18" autocomplete="nickname" placeholder="Es. Ale" value="' + esc(myNick()) + '">' +
    (App.inviteCode ? '' : Lobby.pickHTML() + '<button class="btn block" data-act="create"' + (App.busy ? ' disabled' : '') + '>Apri un tavolo</button>') +
    '<div class="row" style="flex-wrap:nowrap"><input id="joincode" class="field code" maxlength="4" placeholder="CODICE" aria-label="Codice del tavolo" autocapitalize="characters" value="' + esc(App.inviteCode || '') + '"><button class="btn' + (App.inviteCode ? '' : ' ghost') + '" data-act="join" style="flex:none"' + (App.busy ? ' disabled' : '') + '>Siediti</button></div>' +
    (App.inviteCode ? '<button class="btn ghost small" data-act="noinvite">Apri invece un tavolo tuo</button>' : '') + '</section>' +
    '<section class="panel" style="order:-1"><h2>Tavoli aperti</h2>' + Lobby.panelHTML() + '<h3 class="muted" style="font-size:16px;margin:6px 0 0">I tuoi tavoli recenti</h3><div id="tlist" class="tables" style="display:grid;gap:8px">' + Lobby.recentRows() + '</div>' +
    '<div class="row"><button class="btn ghost small" data-act="rules">Regole</button>' + PWA.buttonHTML('btn ghost small') + '</div></section></div>' +
    '<section class="panel"><h2>Le avventure</h2><div class="scns">' + SCN.ORDER.map(function (s) { return scenRow(s, false, false); }).join('') + '</div><p class="lead">Altre avventure arriveranno con i prossimi aggiornamenti.</p></section>' +
    '<section class="panel"><h2>Come si gioca, in 30 secondi</h2>' + RU.section('goal') + RU.section('combine') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
Lobby.setRecentKey(KEY_RECENT);
function roomHTML() {
  var d = App.doc, isHost = d.host === Net.uid, seated = d.seats.some(function (s) { return s.uid === Net.uid; }), n = d.seats.length, seats = '', sid = scenOf(d);
  for (var i = 0; i < MAXP; i++) {
    var s = d.seats[i];
    if (s) seats += '<div class="seat full"><div class="ava" style="--pc:' + PCOL[i] + '">' + esc(s.nick.charAt(0).toUpperCase()) + '</div><div><div class="nm">' + Net.dot(s.uid) + esc(s.nick) + Net.offTag(s.uid) + '</div><div class="sub">' + (s.uid === d.host ? 'host' : 'giocatore') + (s.uid === Net.uid ? ' · tu' : '') + '</div></div>' +
      ((isHost && s.uid !== Net.uid) || (s.uid === Net.uid && !isHost) ? '<button class="x" data-act="kick" data-uid="' + esc(s.uid) + '" aria-label="Togli ' + esc(s.nick) + '">×</button>' : '') + '</div>';
    else if (i < Math.max(2, n + 1)) seats += '<div class="seat"><div class="ava empty">·</div><div class="sub">Posto libero</div></div>';
  }
  var S = SCN.S[sid];
  return '<div class="topbar"><div class="wrap"><span class="brand">Unlock!</span><span class="info">' + connInfo('Tavolo ' + esc(d.code)) + '</span>' + Sound.buttonHTML() + Chat.badgeHTML() + '<button class="iconbtn" data-act="rules">Regole</button><button class="iconbtn" data-act="leave">Esci</button></div></div>' +
    '<div class="wrap lobby">' + hostBanner() +
    '<section class="panel"><span class="lead">Codice del tavolo</span><span class="codebig">' + esc(d.code) + '</span><div class="row"><button class="btn" data-act="invite">Invita amici</button><button class="btn ghost small" data-act="copylink">Copia link</button></div>' +
    '<p class="lead">Chi apre il link si siede dal suo telefono, senza registrarsi. Da 1 a 6 giocatori: si gioca tutti insieme contro il tempo.</p></section>' +
    '<section class="panel"><h2>L’avventura</h2>' + (isHost ? '<p class="lead">Scegli dove vi chiuderete' + (lsGet('ul-done-soffitta') ? '' : ': la prima volta conviene il tutorial') + '.</p><div class="scns">' + SCN.ORDER.map(function (s) { return scenRow(s, s === sid, true); }).join('') + '</div>' : '<div class="scns">' + scenRow(sid, true, false) + '</div>') + '</section>' +
    '<section class="panel"><h2>La squadra (' + n + '/' + MAXP + ')</h2><div class="seats">' + seats + '</div>' + Lobby.roomHTML(d, isHost) +
    (isHost ? '<button class="btn block big" data-act="start">' + IC('key') + ' Entra in «' + S.name + '» · ' + S.min + ' min</button>'
      : seated ? '<p class="lead">In attesa che l’host faccia partire l’avventura.</p>' : '<button class="btn" data-act="jointable" data-code="' + esc(d.code) + '">Siediti</button>') +
    (isHost ? '<button class="btn ghost small" data-act="closetable" style="justify-self:start">Chiudi il tavolo</button>' : '') + '</section>' +
    '<section class="panel"><h2>Prima di cominciare</h2>' + RU.section('goal') + RU.section('cards') + '<button class="btn ghost small" data-act="rules" style="justify-self:start">Tutte le regole</button></section></div>';
}
