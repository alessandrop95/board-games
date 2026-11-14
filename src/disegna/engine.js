/* ===== Disegna e indovina: motore delle regole (gira sull'host; lo stato è JSON) =====
   Squadre da 2 a 4. A turno, una squadra alla volta, uno dei suoi giocatori sceglie una parola tra due
   (facile: 1 punto, difficile: 2 punti) e la disegna sul telefono: tutti vedono il disegno in diretta, ma solo
   i compagni possono scrivere le risposte. Se indovinano la squadra prende i punti della parola (+1 se ci
   mettono meno di metà del tempo). Se il tempo finisce, le altre squadre hanno 10 secondi per «rubarla».
   Ogni giocatore (persona, non automatico) disegna una volta per giro; dopo i giri stabiliti vince la squadra
   con più punti. Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var DGEngine = (function () {
  var D = (typeof DGData !== 'undefined') ? DGData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var CHOOSE_MS = 15000, STEAL_MS = 12000, REVEAL_MS = 5000, MAXPTS = 2600, MAXSTROKES = 400;
  var OPT = { rounds: [1, 2, 3], time: [60, 80, 100, 120], teams: [2, 3, 4] };

  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    t = t.replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    t = t.replace(/^(l'|un'|il |lo |la |i |gli |le |un |uno |una )/, '');
    return t.replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }
  // distanza tra parole: lettere in più, in meno, cambiate o scambiate di posto («elefnate») contano 1
  function lev(a, b) {
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  // giusta: uguale (senza spazi), con un errore di battitura nelle parole lunghe, o al plurale/singolare
  function right(guess, word) {
    var a = norm(guess).replace(/ /g, ''), b = norm(word).replace(/ /g, '');
    if (!a) return false; if (a === b) return true;
    if (b.length >= 5 && lev(a, b) <= 1) return true;
    return a.length >= 4 && a.slice(0, -1) === b.slice(0, -1);
  }
  function near(guess, word) { var a = norm(guess).replace(/ /g, ''), b = norm(word).replace(/ /g, ''); return !!a && !right(guess, word) && (lev(a, b) <= 2 || (a.length >= 4 && b.indexOf(a) >= 0)); }

  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  function humans(g, t) { return members(g, t).filter(function (i) { return !g.players[i].bot || g.players[i].away; }); }

  // controllo prima di iniziare: almeno due squadre, ognuna con almeno 2 giocatori e chi disegna
  function checkSeats(seats, n) {
    var by = {}; seats.forEach(function (s) { var t = +s.team || 0; (by[t] = by[t] || []).push(s); });
    var ts = Object.keys(by);
    if (ts.length < 2) return 'Servono almeno due squadre.';
    for (var i = 0; i < ts.length; i++) {
      if (by[ts[i]].length < 2) return 'Ogni squadra ha bisogno di almeno 2 giocatori (anche automatici): uno disegna e l’altro indovina.';
    }
    if (!seats.some(function (s) { return !s.bot; })) return 'Serve almeno una persona che disegni.';
    return null;
  }
  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 2), time: pick(OPT.time, opts.time, 80), teams: pick(OPT.teams, opts.teams, 2) };
    var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < o.teams && t === Math.floor(t) ? t : i % o.teams; });
    var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
    var g = {
      v: 1, phase: 'choose', seq: 0, turnN: 0, round: 0, turn: -1, clock: now, opts: o,
      teams: used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], total: 0 }; }),
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: used.indexOf(want[i]) }; }),
      order: [], drawer: null, choices: null, word: null, pts: 0, until: 0, start: 0, pic: { t: 0, v: 0, s: [] }, guesses: [], hit: null, words: [], decks: { e: [], h: [] },
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    g.order = makeOrder(g);
    nextTurn(g, now);
    return g;
  }
  // l'ordine dei turni: un giro = ogni persona disegna una volta; le squadre si alternano
  function makeOrder(g) {
    var out = [], hs = g.teams.map(function (T, t) { return members(g, t).filter(function (i) { return !g.players[i].bot; }); });
    var max = Math.max.apply(null, hs.map(function (h) { return h.length; }));
    for (var r = 0; r < g.opts.rounds; r++) for (var k = 0; k < max; k++) hs.forEach(function (h) { if (k < h.length) out.push({ p: h[k], r: r + 1 }); });
    return out;
  }
  function draw(g, kind) {
    var key = kind === 'h' ? 'h' : 'e';
    if (!g.decks[key].length) g.decks[key] = shuffle((key === 'h' ? D.HARD : D.EASY).filter(function (w) { return g.words.indexOf(w) < 0; }));
    if (!g.decks[key].length) g.decks[key] = shuffle((key === 'h' ? D.HARD : D.EASY).slice());
    return g.decks[key].pop();
  }
  function nextTurn(g, now) {
    g.turn++;
    if (g.turn >= g.order.length) { finish(g); return; }
    var o = g.order[g.turn];
    g.round = o.r; g.drawer = o.p; g.phase = 'choose'; g.choices = [draw(g, 'e'), draw(g, 'h')]; g.word = null; g.pts = 0; g.hit = null;
    // numero del disegno unico anche tra una partita e l'altra (così un disegno vecchio non torna)
    g.pic = { t: (Math.floor(now) % 1000000000) * 10 + (g.turn % 10) + 1, v: 0, s: [] }; g.guesses = [];
    g.until = now + CHOOSE_MS; g.clock = now; g.turnN++;
    fx(g, { k: 'turn', p: o.p, t: g.players[o.p].team, turn: g.turn });
  }
  function choose(g, i, now) {
    g.word = g.choices[i]; g.pts = i ? 2 : 1; g.words.push(g.word);
    g.phase = 'draw'; g.start = now; g.until = now + g.opts.time * 1000; g.clock = now;
    log(g, nick(g, g.drawer) + ' disegna una parola ' + (i ? 'difficile' : 'facile') + '.', 'sys', g.drawer);
    fx(g, { k: 'draw', p: g.drawer });
  }
  function score(g, p, steal, now) {
    var t = g.players[p].team, bonus = !steal && now - g.start < g.opts.time * 500 ? 1 : 0, pts = g.pts + bonus;
    g.teams[t].total += pts; g.hit = { p: p, t: t, pts: pts, steal: !!steal };
    g.phase = 'reveal'; g.until = now + REVEAL_MS; g.clock = now;
    log(g, nick(g, p) + (steal ? ' ruba' : ' indovina') + ' «' + g.word + '»: +' + pts + ' ai ' + g.teams[t].name + '.', steal ? 'steal' : 'hit', p);
    fx(g, { k: 'hit', p: p, t: t, pts: pts, steal: !!steal, word: g.word });
  }
  function finish(g) {
    var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return g.teams[b].total - g.teams[a].total || a - b; });
    var place = g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
    g.winners = order.filter(function (t) { return place[t] === 1; }); g.final = { order: order, place: place };
    g.phase = 'over'; g.drawer = null;
    log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (t) { return g.teams[t].name; }).join(' e ') : 'Vincono i ' + g.teams[g.winners[0]].name) + ' con ' + g.teams[g.winners[0]].total + ' punti.', 'win');
    fx(g, { k: 'over', t: g.winners[0] });
  }
  function tick(g, now) {
    if (g.phase === 'over' || now < g.until) return false;
    if (g.phase === 'choose') choose(g, 0, now);
    else if (g.phase === 'draw') {
      g.phase = 'steal'; g.until = now + STEAL_MS; g.clock = now;
      fx(g, { k: 'steal', t: g.players[g.drawer].team });
    } else if (g.phase === 'steal') {
      g.hit = null; g.phase = 'reveal'; g.until = now + REVEAL_MS; g.clock = now;
      log(g, 'Nessuno ha indovinato «' + g.word + '».', 'miss');
      fx(g, { k: 'miss', word: g.word });
    } else if (g.phase === 'reveal') nextTurn(g, now);
    g.seq++;
    return true;
  }
  // chi può scrivere le risposte adesso
  function canGuess(g, p) {
    if (p === g.drawer || !g.players[p]) return false;
    var dt = g.players[g.drawer].team, t = g.players[p].team;
    return g.phase === 'draw' ? t === dt : g.phase === 'steal' ? t !== dt : false;
  }
  function decider() { return null; }
  function pending() { return []; }

  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function cleanStroke(s) {
    if (!Array.isArray(s) || s.length < 4) return null;
    var col = String(s[0]).slice(0, 9), w = Math.max(1, Math.min(60, +s[1] || 6)), out = [/^#[0-9a-f]{3,8}$/i.test(col) ? col : '#222', w];
    for (var i = 2; i + 1 < s.length && out.length < MAXPTS; i += 2) { out.push(Math.max(0, Math.min(1000, Math.round(+s[i] || 0)))); out.push(Math.max(0, Math.min(750, Math.round(+s[i + 1] || 0)))); }
    return out.length >= 4 ? out : null;
  }
  function doAct(g, p, a, now) {
    if (now >= g.until && (g.phase === 'draw' || g.phase === 'steal' || g.phase === 'choose')) { tick(g, now); if (a.a !== 'pic') return 'Tempo scaduto.'; }
    if (a.a === 'choose') {
      if (g.phase !== 'choose' || p !== g.drawer) return 'Non tocca a te scegliere.';
      choose(g, +a.i ? 1 : 0, now); return null;
    }
    if (a.a === 'pic') {
      // il disegno intero (chi disegna lo manda ogni tanto): così lo vede anche chi arriva dopo
      if (p !== g.drawer || (g.phase !== 'draw' && g.phase !== 'steal')) return 'Non stai disegnando.';
      if (+a.t !== g.pic.t || !Array.isArray(a.s)) return null;
      if ((+a.v || 0) < g.pic.v) return null;
      g.pic.v = +a.v || 0; g.pic.s = a.s.slice(0, MAXSTROKES).map(cleanStroke).filter(Boolean);
      return null;
    }
    if (a.a === 'guess') {
      if (!canGuess(g, p)) return g.phase === 'draw' ? 'Adesso indovina solo la squadra di chi disegna.' : 'Adesso non si indovina.';
      var w = String(a.w == null ? '' : a.w).replace(/[\u0000-\u001f<>]/g, '').trim().slice(0, 40); if (!w) return 'Scrivi una risposta.';
      if (right(w, g.word)) { score(g, p, g.phase === 'steal', now); return null; }
      g.guesses.push({ p: p, w: w, near: near(w, g.word) }); if (g.guesses.length > 40) g.guesses.splice(0, g.guesses.length - 40);
      return null;
    }
    if (a.a === 'skip') {
      if (p !== g.drawer || g.phase !== 'draw') return 'Non stai disegnando.';
      g.phase = 'steal'; g.until = now + STEAL_MS; fx(g, { k: 'steal', t: g.players[g.drawer].team }); return null;
    }
    return 'Mossa sconosciuta.';
  }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, canGuess: canGuess, checkSeats: checkSeats, members: members, humans: humans,
    norm: norm, right: right, near: near, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, STEAL_MS: STEAL_MS, REVEAL_MS: REVEAL_MS, CHOOSE_MS: CHOOSE_MS, D: D };
})();
if (typeof module !== 'undefined') module.exports = DGEngine;
