/* ===== Tiro alla fune di parole: motore delle regole (gira sull'host; lo stato è JSON) =====
   Due squadre, una griglia di 5×5 lettere uguale per tutti. Durante il round ognuno cerca parole (almeno 3
   lettere) fatte di lettere vicine (anche in diagonale), senza usare due volte la stessa casella. Ogni parola
   tira la corda verso la propria squadra: 3 lettere 1 punto, 4 lettere 2, 5 lettere 3, 6 lettere 5, 7 o più 8.
   Una parola già trovata da un compagno non conta di nuovo (gli avversari possono trovarla anche loro).
   Le parole che il gioco conosce valgono subito; le altre, a fine round, si possono contestare: vota chi non è
   della squadra, e con più «no» che «sì» la parola non vale. Vince il round la squadra che ha tirato di più;
   vince la partita chi vince più round (al meglio di 1, 3 o 5).
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var FNEngine = (function () {
  var D = (typeof FNData !== 'undefined') ? FNData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1]], N = 5, REVIEW_MS = 45000, VOTE_MS = 20000;
  var OPT = { rounds: [1, 3, 5], time: [60, 90, 120] };
  var KNOWN = {}; D.WORDS.forEach(function (w) { KNOWN[w] = 1; });
  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/[^a-z]/g, '');
  }
  function points(w) { var n = w.length; return n < 3 ? 0 : n === 3 ? 1 : n === 4 ? 2 : n === 5 ? 3 : n === 6 ? 5 : 8; }
  function known(w) { return !!KNOWN[norm(w)]; }
  function makeGrid() {
    var bag = []; Object.keys(D.FREQ).forEach(function (l) { for (var k = 0; k < D.FREQ[l]; k++) bag.push(l); });
    var g;
    do { g = ''; for (var i = 0; i < N * N; i++) g += bag[Math.floor(rand() * bag.length)]; }
    while (g.replace(/[^aeiou]/g, '').length < 9 || g.replace(/[^aeiou]/g, '').length > 13);
    return g;
  }
  // la parola si può comporre con caselle vicine, senza riusarle? Restituisce il percorso (o null).
  function path(grid, w) {
    w = norm(w); if (w.length < 3) return null;
    function go(i, k, used) {
      if (grid[i] !== w[k]) return null;
      if (k === w.length - 1) return [i];
      used[i] = 1;
      var r = Math.floor(i / N), c = i % N;
      for (var dr = -1; dr <= 1; dr++) for (var dc = -1; dc <= 1; dc++) {
        if (!dr && !dc) continue; var rr = r + dr, cc = c + dc; if (rr < 0 || cc < 0 || rr >= N || cc >= N) continue;
        var j = rr * N + cc; if (used[j]) continue;
        var p = go(j, k + 1, used); if (p) { used[i] = 0; return [i].concat(p); }
      }
      used[i] = 0; return null;
    }
    for (var i = 0; i < grid.length; i++) { var p = go(i, 0, {}); if (p) return p; }
    return null;
  }
  function adjacent(a, b) { return a !== b && Math.abs(Math.floor(a / N) - Math.floor(b / N)) <= 1 && Math.abs(a % N - b % N) <= 1; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 3), time: pick(OPT.time, opts.time, 90) };
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, round: 0, clock: now, opts: o,
      teams: TEAMS.map(function (x) { return { name: x[0], col: x[1], wins: 0, total: 0 }; }),
      players: seats.map(function (s, i) { var t = +s.team; return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: t === 1 ? 1 : 0, ready: false, found: 0 }; }),
      grid: '', words: [], flags: {}, until: 0, res: null, hist: [], log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    startRound(g, now);
    return g;
  }
  function startRound(g, now) {
    g.round++; g.phase = 'play'; g.grid = makeGrid(); g.words = []; g.flags = {}; g.res = null;
    g.until = now + g.opts.time * 1000; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = false; P.found = 0; });
    log(g, 'Round ' + g.round + ': nuova griglia.', 'sys');
    fx(g, { k: 'round', round: g.round });
  }
  function valid(g, i) { var x = g.words[i], f = g.flags[i]; if (x.known) return true; if (!f) return true; var y = 0, n = 0; Object.keys(f.v).forEach(function (k) { if (f.v[k]) y++; else n++; }); return n <= y; }
  function pull(g) { var s = [0, 0]; g.words.forEach(function (x, i) { if (valid(g, i)) s[x.t] += x.pts; }); return s; }
  function flagOut(f) { var y = 0, n = 0; Object.keys(f.v).forEach(function (k) { if (f.v[k]) y++; else n++; }); return { yes: y, no: n, out: n > y }; }
  function endPlay(g, now) {
    g.phase = 'review'; g.until = now + REVIEW_MS; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = !!P.bot; });
    // senza parole da controllare si va dritti al risultato
    if (g.words.every(function (x) { return x.known; })) { endReview(g, now); return; }
    fx(g, { k: 'review' });
  }
  function endReview(g, now) {
    var s = pull(g), w = s[0] > s[1] ? 0 : s[1] > s[0] ? 1 : -1;
    if (w >= 0) g.teams[w].wins++;
    g.teams[0].total += s[0]; g.teams[1].total += s[1];
    g.hist.push(s); g.res = { pts: s, w: w };
    log(g, 'Round ' + g.round + ': ' + g.teams[0].name + ' ' + s[0] + ', ' + g.teams[1].name + ' ' + s[1] + (w < 0 ? ': pari.' : ': vincono i ' + g.teams[w].name + '.'), 'round');
    var need = Math.ceil(g.opts.rounds / 2);
    if (g.teams[0].wins >= need || g.teams[1].wins >= need || g.round >= g.opts.rounds + 2) {
      var a = g.teams[0], b = g.teams[1];
      var win = a.wins !== b.wins ? (a.wins > b.wins ? 0 : 1) : a.total !== b.total ? (a.total > b.total ? 0 : 1) : -1;
      g.winners = win < 0 ? [0, 1] : [win]; g.final = { place: win < 0 ? [1, 1] : win === 0 ? [1, 2] : [2, 1] };
      g.phase = 'over';
      log(g, win < 0 ? 'Partita pari!' : 'Vincono i ' + g.teams[win].name + '!', 'win');
      fx(g, { k: 'roundEnd', over: true }); fx(g, { k: 'over', t: win });
    } else {
      g.phase = 'scores'; g.players.forEach(function (P) { P.ready = !!P.bot; });
      fx(g, { k: 'roundEnd', over: false });
    }
  }
  function tick(g, now) {
    if (now < g.until) return false;
    if (g.phase === 'play') endPlay(g, now);
    else if (g.phase === 'review') endReview(g, now);
    else return false;
    g.seq++; return true;
  }
  function decider() { return null; }
  function pending(g) { return g.phase === 'review' || g.phase === 'scores' ? g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; }) : []; }
  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    var P = g.players[p]; if (!P) return 'Non sei al tavolo.';
    var r = doAct(g, p, P, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function doAct(g, p, P, a, now) {
    if (g.phase === 'play') {
      if (now >= g.until) { endPlay(g, now); return null; }
      if (a.a !== 'word') return 'Adesso si cercano parole.';
      var w = norm(a.w); if (w.length < 3) return 'Servono almeno 3 lettere.';
      if (!path(g.grid, w)) return '«' + w + '» non si può fare con lettere vicine.';
      if (g.words.some(function (x) { return x.t === P.team && x.w === w; })) return 'La tua squadra ha già trovato «' + w + '».';
      var x = { w: w, t: P.team, p: p, pts: points(w), known: known(w) };
      g.words.push(x); P.found++;
      fx(g, { k: 'word', p: p, t: P.team, w: w, pts: x.pts });
      return null;
    }
    if (g.phase === 'review') {
      if (a.a === 'flag') {
        var i = +a.i, y = g.words[i]; if (!y) return 'Parola sconosciuta.';
        if (y.t === P.team) return 'Non contesti la tua squadra.';
        if (y.known) return 'Questa parola esiste: vale.';
        if (g.flags[i]) return 'È già contestata: vota.';
        g.flags[i] = { by: p, v: {} }; g.flags[i].v[p] = false;
        g.until = Math.max(g.until, now + VOTE_MS);
        g.players.forEach(function (Q, q) { if (!Q.bot && Q.team !== y.t && q !== p) Q.ready = false; });
        fx(g, { k: 'flag', p: p, i: i });
        return null;
      }
      if (a.a === 'vote') { var f = g.flags[+a.i]; if (!f) return 'Non è contestata.'; if (g.words[+a.i].t === P.team) return 'Sulla tua squadra non voti.'; f.v[p] = !!a.ok; return null; }
      if (a.a === 'ready') { P.ready = true; if (g.players.every(function (Q) { return Q.ready || Q.bot; })) endReview(g, now); return null; }
      if (a.a === 'unready') { P.ready = false; return null; }
      return 'Adesso si controllano le parole.';
    }
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'Tocca «Prossimo round».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) startRound(g, now);
      return null;
    }
    return 'Mossa non valida.';
  }
  function forceNext(g, now) { now = now || Date.now(); if (g.phase === 'review') { endReview(g, now); g.seq++; return true; } if (g.phase === 'scores') { startRound(g, now); g.seq++; return true; } return false; }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, path: path, adjacent: adjacent, points: points, known: known, norm: norm, pull: pull, valid: valid, flagOut: flagOut, members: members, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, N: N, D: D };
})();
if (typeof module !== 'undefined') module.exports = FNEngine;
