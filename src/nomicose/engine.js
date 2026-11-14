/* ===== Nomi, cose, città: motore delle regole (gira sull'host; lo stato è JSON) =====
   Si gioca a squadre (2, 3 o 4) oppure ognuno per sé. A ogni manche esce una lettera e ci sono 6 categorie:
   ogni squadra ha un foglio comune che tutti i compagni riempiono insieme, dal proprio telefono, entro il tempo.
   La squadra che ha riempito tutte le caselle può dire «Stop!»: agli altri restano 10 secondi.
   Poi si controllano le risposte: ognuno può contestare quelle delle altre squadre e chi non è della squadra
   contestata vota. Punti per categoria: 20 se la risposta valida è l'unica, 10 se è diversa da quelle degli
   altri, 5 se un'altra squadra ha scritto la stessa parola, 0 se è vuota, sbagliata o bocciata dal voto.
   Dopo le manche stabilite vince la squadra con più punti.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host), così le prove le controllano. */
var NCEngine = (function () {
  var D = (typeof NCData !== 'undefined') ? NCData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var STOP_MS = 10000, REVIEW_MS = 75000, VOTE_MS = 25000, MAXLEN = 32;
  var OPT = { rounds: [4, 6, 8, 10], time: [60, 90, 120, 180], teams: [0, 2, 3, 4] };

  /* ---------- parole ---------- */
  // minuscole, senza accenti, senza articolo davanti e senza segni: «L’Aquila» → «aquila»
  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    t = t.replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    t = t.replace(/^(l'|un'|il |lo |la |i |gli |le |un |uno |una )/, '');
    return t.replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    var prev = [], cur, i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { cur = [i]; for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[b.length];
  }
  // la stessa risposta (anche con un errore di battitura, se la parola è lunga)
  function same(a, b) { a = norm(a); b = norm(b); if (!a || !b) return false; if (a === b) return true; return Math.min(a.length, b.length) >= 5 && lev(a, b) <= 1; }
  // il controllo automatico: vuota, troppo corta o con l'iniziale sbagliata
  function check(w, letter) {
    var n = norm(w);
    if (!n) return 'empty';
    if (n.replace(/ /g, '').length < 2) return 'short';
    if (n.charAt(0) !== String(letter).toLowerCase()) return 'letter';
    return 'ok';
  }
  function known(w, cat) { var n = norm(w); if (!n) return false; var cats = cat ? [cat] : D.POOL; return cats.some(function (c) { return D.CATS[c] && D.CATS[c][1].some(function (x) { return norm(x) === n; }); }); }

  /* ---------- registro ed effetti ---------- */
  function nick(g, p) { return g.players[p].nick; }
  function tname(g, t) { return g.teams[t].name; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }

  /* ---------- squadre ---------- */
  // assegna le squadre: rispetta quelle scelte in sala d'attesa e toglie le squadre rimaste vuote
  function makeTeams(seats, n) {
    if (!n) return { teams: seats.map(function (s, i) { return { name: s.nick, col: i % 8, total: 0, hist: [] }; }), of: seats.map(function (s, i) { return i; }) };
    var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < n && t === Math.floor(t) ? t : i % n; });
    var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
    return { teams: used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], total: 0, hist: [] }; }), of: want.map(function (t) { return used.indexOf(t); }) };
  }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }

  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 6), time: pick(OPT.time, opts.time, 90), teams: pick(OPT.teams, opts.teams == null ? 2 : opts.teams, 2), cats: opts.cats === 'mix' ? 'mix' : 'classic' };
    var tm = makeTeams(seats, o.teams);
    var g = {
      v: 1, phase: 'write', seq: 0, turnN: 0, round: 0, clock: now,
      opts: o, teams: tm.teams,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: tm.of[i], ready: false }; }),
      letter: null, used: [], cats: [], until: 0, stop: null, ans: [], rev: null, flags: {}, res: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    startRound(g, now);
    return g;
  }
  function startRound(g, now) {
    g.round++; g.phase = 'write'; g.stop = null; g.rev = null; g.flags = {}; g.res = null;
    var left = D.LETTERS.filter(function (l) { return g.used.indexOf(l) < 0; });
    if (!left.length) { g.used = []; left = D.LETTERS.slice(); }
    g.letter = left[Math.floor(rand() * left.length)]; g.used.push(g.letter);
    g.cats = g.opts.cats === 'mix' ? shuffle(D.POOL.slice()).slice(0, 6) : D.CLASSIC.slice();
    g.ans = g.teams.map(function () { return {}; });
    g.until = now + g.opts.time * 1000; g.clock = now;
    g.players.forEach(function (P) { P.ready = false; });
    g.turnN++;
    log(g, 'Manche ' + g.round + ': lettera ' + g.letter + '. Categorie: ' + g.cats.map(function (c) { return D.CATS[c][0]; }).join(', ') + '.', 'sys');
    fx(g, { k: 'deal', round: g.round, letter: g.letter });
  }
  function filled(g, t) { return g.cats.filter(function (c) { return g.ans[t][c] && norm(g.ans[t][c].w); }).length; }

  /* ---------- fine della scrittura e controllo ---------- */
  function endWrite(g, now) {
    var cells = g.teams.map(function (T, t) {
      var o = {}; g.cats.forEach(function (c) { var a = g.ans[t][c]; o[c] = { w: a ? a.w : '', by: a ? a.by : null, st: check(a ? a.w : '', g.letter) }; }); return o;
    });
    g.rev = { cells: cells }; g.flags = {};
    g.phase = 'review'; g.until = now + REVIEW_MS; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = !!P.bot; });
    log(g, 'Tempo scaduto! Si controllano le risposte.', 'sys');
    fx(g, { k: 'reveal', round: g.round });
  }
  // una risposta contestata è bocciata se i «no» sono più dei «sì»
  function flagOut(f) { var y = 0, n = 0; Object.keys(f.v).forEach(function (k) { if (f.v[k]) y++; else n++; }); return { yes: y, no: n, out: n > y }; }
  // punti di ogni casella (provvisori durante il controllo, definitivi alla fine)
  function points(g) {
    if (!g.rev) return null;
    var T = g.teams.length, pts = g.teams.map(function () { return {}; }), why = g.teams.map(function () { return {}; }), tot = g.teams.map(function () { return 0; });
    g.cats.forEach(function (c) {
      var valid = [];
      for (var t = 0; t < T; t++) {
        var cell = g.rev.cells[t][c], f = g.flags[t + ':' + c];
        if (cell.st !== 'ok') { pts[t][c] = 0; why[t][c] = cell.st; continue; }
        if (f && flagOut(f).out) { pts[t][c] = 0; why[t][c] = 'voted'; continue; }
        valid.push(t);
      }
      valid.forEach(function (t) {
        var dup = valid.some(function (u) { return u !== t && same(g.rev.cells[t][c].w, g.rev.cells[u][c].w); });
        pts[t][c] = valid.length === 1 ? 20 : dup ? 5 : 10; why[t][c] = valid.length === 1 ? 'only' : dup ? 'dup' : 'uniq';
      });
      for (var u = 0; u < T; u++) tot[u] += pts[u][c];
    });
    return { pts: pts, why: why, tot: tot };
  }
  function endReview(g, now) {
    var P = points(g);
    g.teams.forEach(function (T, t) { T.total += P.tot[t]; T.hist.push(P.tot[t]); });
    g.res = P; g.clock = now; g.turnN++;
    log(g, 'Manche ' + g.round + ' (' + g.letter + '): ' + g.teams.map(function (T, t) { return T.name + ' ' + P.tot[t]; }).join(', ') + '.', 'round');
    if (g.round >= g.opts.rounds) {
      var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return g.teams[b].total - g.teams[a].total || a - b; });
      var place = g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
      g.winners = order.filter(function (t) { return place[t] === 1; });
      g.final = { order: order, place: place };
      g.phase = 'over';
      log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (t) { return tname(g, t); }).join(' e ') : 'Vincono i ' + tname(g, g.winners[0])) + ' con ' + g.teams[g.winners[0]].total + ' punti.', 'win');
      fx(g, { k: 'roundEnd', round: g.round, over: true });
      fx(g, { k: 'over', t: g.winners[0] });
    } else {
      g.phase = 'scores';
      g.players.forEach(function (P) { P.ready = !!P.bot; });
      fx(g, { k: 'roundEnd', round: g.round, over: false });
    }
  }
  // l'host la chiama ogni mezzo secondo: fa scadere il tempo di scrittura e di controllo
  function tick(g, now) {
    if (g.phase === 'write' && now >= g.until) { endWrite(g, now); g.seq++; return true; }
    if (g.phase === 'review' && now >= g.until) { endReview(g, now); g.seq++; return true; }
    return false;
  }

  function pending(g) {
    if (g.phase === 'review' || g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function decider() { return null; }   // si gioca tutti insieme: niente timer di turno

  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function doAct(g, p, a, now) {
    var P = g.players[p], t = P.team;
    if (g.phase === 'write') {
      if (now >= g.until) { endWrite(g, now); return null; }
      if (a.a === 'w') {
        var c = String(a.c || ''); if (g.cats.indexOf(c) < 0) return 'Categoria sconosciuta.';
        var w = String(a.w == null ? '' : a.w).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').slice(0, MAXLEN);
        if (!w.trim()) delete g.ans[t][c]; else g.ans[t][c] = { w: w.trim(), by: p };
        return null;
      }
      if (a.a === 'stop') {
        if (g.stop) return 'Qualcuno ha già detto stop.';
        if (filled(g, t) < g.cats.length) return 'Prima riempite tutte le caselle.';
        g.stop = { t: t, p: p }; g.until = Math.min(g.until, now + STOP_MS);
        log(g, nick(g, p) + ' (' + tname(g, t) + ') dice STOP!', 'stop', p);
        fx(g, { k: 'stop', t: t, p: p });
        return null;
      }
      return 'Adesso si scrive.';
    }
    if (g.phase === 'review') {
      if (a.a === 'flag') {
        var ft = +a.t, fc = String(a.c || ''), cell = g.rev.cells[ft] && g.rev.cells[ft][fc];
        if (!cell) return 'Risposta sconosciuta.';
        if (ft === t) return 'Non puoi contestare la tua squadra.';
        if (cell.st !== 'ok') return 'Questa risposta non vale già.';
        var key = ft + ':' + fc; if (g.flags[key]) return 'È già contestata: vota.';
        g.flags[key] = { by: p, v: {} }; g.flags[key].v[p] = false;
        g.until = Math.max(g.until, now + VOTE_MS);
        g.players.forEach(function (Q, q) { if (!Q.bot && Q.team !== ft && q !== p) Q.ready = false; });
        log(g, nick(g, p) + ' contesta «' + cell.w + '» dei ' + tname(g, ft) + ' (' + D.CATS[fc][0] + ').', 'flag', p);
        fx(g, { k: 'flag', p: p, t: ft, c: fc });
        return null;
      }
      if (a.a === 'vote') {
        var f = g.flags[(+a.t) + ':' + String(a.c || '')]; if (!f) return 'Questa risposta non è contestata.';
        if (+a.t === t) return 'Sulla tua squadra non voti.';
        f.v[p] = !!a.ok;
        return null;
      }
      if (a.a === 'ready') {
        P.ready = true;
        if (g.players.every(function (Q) { return Q.ready || Q.bot; })) endReview(g, now);
        return null;
      }
      if (a.a === 'unready') { P.ready = false; return null; }
      return 'Adesso si controllano le risposte.';
    }
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'Tocca «Prossima manche».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g, now); fx(g, { k: 'next' }); }
      return null;
    }
    return 'Mossa non valida.';
  }
  // l'host salta l'attesa (controllo o punti)
  function forceNext(g, now) {
    now = now || Date.now();
    if (g.phase === 'review') { endReview(g, now); g.seq++; return true; }
    if (g.phase === 'scores') { startRound(g, now); fx(g, { k: 'next' }); g.seq++; return true; }
    return false;
  }

  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, points: points, flagOut: flagOut, filled: filled, members: members,
    norm: norm, same: same, check: check, known: known, lev: lev, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, STOP_MS: STOP_MS, D: D };
})();
if (typeof module !== 'undefined') module.exports = NCEngine;
