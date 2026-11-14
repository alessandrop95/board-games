/* ===== Sintonia: motore delle regole (gira sull'host; lo stato è JSON) =====
   A ogni manche esce un tema («Un frutto rosso») e ognuno scrive di nascosto una risposta, senza potersi
   mettere d'accordo. A squadre: per ogni gruppo di compagni che hanno scritto la stessa cosa la squadra prende
   tanti punti quanti sono i compagni del gruppo (almeno 2); se l'hanno scritta tutti, +2. Ognuno per sé: ogni
   giocatore prende un punto per ogni altro giocatore che ha scritto la sua stessa risposta.
   Le risposte uguali si riconoscono anche senza accenti, articoli e con un errore di battitura.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var STEngine = (function () {
  var D = (typeof STData !== 'undefined') ? STData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var OPT = { rounds: [6, 8, 10, 12], time: [20, 30, 45], teams: [0, 2, 3, 4] }, SHOW_MS = 15000;
  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    t = t.replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    t = t.replace(/^(l'|un'|il |lo |la |i |gli |le |un |uno |una |dei |delle |degli )/, '');
    return t.replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    var prev = [], cur, i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { cur = [i]; for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[b.length];
  }
  // la stessa risposta: uguale senza spazi, singolare/plurale o un errore di battitura nelle parole lunghe
  function same(a, b) {
    a = norm(a).replace(/ /g, ''); b = norm(b).replace(/ /g, '');
    if (!a || !b) return false; if (a === b) return true;
    if (a.length >= 4 && b.length >= 4 && a.slice(0, -1) === b.slice(0, -1)) return true;
    return Math.min(a.length, b.length) >= 5 && lev(a, b) <= 1;
  }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function makeTeams(seats, n) {
    if (!n) return { teams: seats.map(function (s, i) { return { name: s.nick, col: i % 8, total: 0, hist: [] }; }), of: seats.map(function (s, i) { return i; }) };
    var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < n && t === Math.floor(t) ? t : i % n; });
    var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
    return { teams: used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], total: 0, hist: [] }; }), of: want.map(function (t) { return used.indexOf(t); }) };
  }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 8), time: pick(OPT.time, opts.time, 30), teams: pick(OPT.teams, opts.teams == null ? 2 : opts.teams, 2) };
    var tm = makeTeams(seats, o.teams);
    var g = {
      v: 1, phase: 'write', seq: 0, turnN: 0, round: 0, clock: now, opts: o, teams: tm.teams,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: tm.of[i], ans: null, ready: false, total: 0 }; }),
      deck: shuffle(D.LIST.map(function (x, i) { return i; })), theme: null, until: 0, res: null, log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    startRound(g, now);
    return g;
  }
  function startRound(g, now) {
    g.round++; g.phase = 'write'; g.res = null;
    if (!g.deck.length) g.deck = shuffle(D.LIST.map(function (x, i) { return i; }));
    g.theme = g.deck.pop();
    g.players.forEach(function (P) { P.ans = null; P.ready = false; });
    g.until = now + g.opts.time * 1000; g.clock = now; g.turnN++;
    log(g, 'Manche ' + g.round + ': «' + D.LIST[g.theme].q + '».', 'sys');
    fx(g, { k: 'theme', round: g.round, q: D.LIST[g.theme].q });
  }
  // gruppi di risposte uguali dentro un insieme di giocatori
  function groups(g, ps) {
    var out = [];
    ps.forEach(function (p) {
      var a = g.players[p].ans; if (!a) return;
      var gr = out.filter(function (x) { return same(x.w, a); })[0];
      if (gr) gr.ps.push(p); else out.push({ w: a, ps: [p] });
    });
    return out.sort(function (a, b) { return b.ps.length - a.ps.length; });
  }
  function reveal(g, now) {
    var res = { teams: [], players: g.players.map(function () { return 0; }), all: groups(g, g.players.map(function (P, i) { return i; })) };
    if (g.opts.teams) {
      g.teams.forEach(function (T, t) {
        var ms = members(g, t), gs = groups(g, ms), pts = 0, full = ms.length >= 2 && gs.length === 1 && gs[0].ps.length === ms.length;
        gs.forEach(function (x) { if (x.ps.length >= 2) pts += x.ps.length; });
        if (full) pts += 2;
        res.teams.push({ pts: pts, groups: gs, full: full });
        T.total += pts; T.hist.push(pts);
      });
    } else {
      res.all.forEach(function (x) { x.ps.forEach(function (p) { res.players[p] = x.ps.length - 1; }); });
      g.teams.forEach(function (T, t) { var pts = res.players[t]; res.teams.push({ pts: pts }); T.total += pts; T.hist.push(pts); });
    }
    g.res = res; g.phase = 'show'; g.until = now + SHOW_MS; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = !!P.bot; });
    log(g, 'Risposte: ' + res.all.map(function (x) { return x.w + (x.ps.length > 1 ? ' ×' + x.ps.length : ''); }).join(', ') + '.', 'round');
    fx(g, { k: 'reveal', round: g.round });
  }
  function finish(g) {
    var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return g.teams[b].total - g.teams[a].total || a - b; });
    var place = g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
    g.winners = order.filter(function (t) { return place[t] === 1; }); g.final = { order: order, place: place };
    g.phase = 'over';
    log(g, (g.winners.length > 1 ? 'Pari! ' : 'Vince ') + g.winners.map(function (t) { return g.teams[t].name; }).join(' e ') + ' con ' + g.teams[g.winners[0]].total + ' punti.', 'win');
    fx(g, { k: 'over', t: g.winners[0] });
  }
  function next(g, now) { if (g.round >= g.opts.rounds) finish(g); else { startRound(g, now); fx(g, { k: 'next' }); } }
  function tick(g, now) {
    if (now < g.until) return false;
    if (g.phase === 'write') reveal(g, now);
    else if (g.phase === 'show') next(g, now);
    else return false;
    g.seq++; return true;
  }
  function decider() { return null; }
  function pending(g) {
    if (g.phase === 'write') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ans; });
    if (g.phase === 'show') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    var P = g.players[p]; if (!P) return 'Non sei al tavolo.';
    if (g.phase === 'write') {
      if (a.a !== 'answer') return 'Adesso si scrive.';
      var w = String(a.w == null ? '' : a.w).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
      if (!norm(w)) return 'Scrivi una risposta.';
      P.ans = w;
      fx(g, { k: 'answered', p: p });
      if (g.players.every(function (Q) { return Q.ans; })) reveal(g, now);
    } else if (g.phase === 'show') {
      if (a.a !== 'next') return 'Tocca «Avanti».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) next(g, now);
    } else return 'Mossa non valida.';
    g.seq++; g.clock = now;
    return null;
  }
  function forceNext(g, now) { now = now || Date.now(); if (g.phase === 'show') { next(g, now); g.seq++; return true; } if (g.phase === 'write') { reveal(g, now); g.seq++; return true; } return false; }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, groups: groups, members: members, norm: norm, same: same, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, D: D };
})();
if (typeof module !== 'undefined') module.exports = STEngine;
