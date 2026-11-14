/* ===== Conquista l'Italia: motore delle regole (gira sull'host; lo stato è JSON) =====
   Squadre da 2 a 4 (o ognuno per sé). A ogni turno una domanda per tutti: a scelta fra quattro risposte (vince chi
   risponde giusto per primo) o un numero da stimare (vince chi ci va più vicino; a pari distanza il più veloce).
   Chi vince sceglie una regione per la sua squadra: una regione libera vicina al suo territorio (all'inizio una
   qualsiasi). Quando non ci sono più regioni libere, si conquista una regione avversaria confinante.
   Dopo il numero di domande stabilito vince la squadra con più regioni (a pari regioni, più risposte vinte).
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var CQEngine = (function () {
  var D = (typeof CQData !== 'undefined') ? CQData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var OPT = { questions: [12, 18, 24], time: [15, 20, 30], teams: [0, 2, 3, 4] }, CLAIM_MS = 15000, SHOW_MS = 4500;
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 140) g.log.splice(0, g.log.length - 140); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function makeTeams(seats, n) {
    if (!n) return { teams: seats.map(function (s, i) { return { name: s.nick, col: i % 8, wins: 0 }; }), of: seats.map(function (s, i) { return i; }) };
    var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < n && t === Math.floor(t) ? t : i % n; });
    var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
    return { teams: used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], wins: 0 }; }), of: want.map(function (t) { return used.indexOf(t); }) };
  }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { questions: pick(OPT.questions, opts.questions, 18), time: pick(OPT.time, opts.time, 20), teams: pick(OPT.teams, opts.teams == null ? 2 : opts.teams, 2) };
    var tm = makeTeams(seats, o.teams);
    var g = {
      v: 1, phase: 'q', seq: 0, turnN: 0, round: 0, clock: now, opts: o, teams: tm.teams,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: tm.of[i], ans: null }; }),
      own: D.R.map(function () { return -1; }), deck: shuffle(D.Q.map(function (x, i) { return i; })), q: null, order: null, start: 0, until: 0, res: null, chooser: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    nextQ(g, now);
    return g;
  }
  function nextQ(g, now) {
    if (g.round >= g.opts.questions) { finish(g); return; }
    g.round++; g.phase = 'q'; g.res = null; g.chooser = null;
    if (!g.deck.length) g.deck = shuffle(D.Q.map(function (x, i) { return i; }));
    g.q = g.deck.pop(); var Q = D.Q[g.q];
    g.order = Q.k === 'c' ? shuffle([0, 1, 2, 3]) : null;
    g.players.forEach(function (P) { P.ans = null; });
    g.start = now; g.until = now + g.opts.time * 1000; g.clock = now; g.turnN++;
    fx(g, { k: 'q', round: g.round });
  }
  // le regioni che la squadra t può prendere adesso
  function options(g, t) {
    var mine = [], free = [];
    g.own.forEach(function (o, i) { if (o === t) mine.push(i); if (o < 0) free.push(i); });
    var near = function (i) { return D.ADJ[i].some(function (j) { return g.own[j] === t; }); };
    if (free.length) { if (!mine.length) return free; var f = free.filter(near); return f.length ? f : free; }
    var enemy = g.own.map(function (o, i) { return i; }).filter(function (i) { return g.own[i] !== t; });
    var e = enemy.filter(near); return e.length ? e : enemy;
  }
  function resolve(g, now) {
    var Q = D.Q[g.q], best = null;
    g.players.forEach(function (P, p) {
      if (!P.ans) return;
      if (Q.k === 'c') { if (P.ans.v === 0 && (!best || P.ans.t < best.t)) best = { p: p, t: P.ans.t }; }
      else { var d = Math.abs(P.ans.v - Q.v); if (!best || d < best.d || (d === best.d && P.ans.t < best.t)) best = { p: p, t: P.ans.t, d: d }; }
    });
    g.res = best ? { p: best.p, t: g.players[best.p].team, ms: best.t, d: best.d } : null;
    g.clock = now; g.turnN++;
    if (best) {
      var t = g.players[best.p].team; g.teams[t].wins++;
      g.phase = 'claim'; g.chooser = best.p; g.until = now + CLAIM_MS;
      log(g, nick(g, best.p) + ' (' + g.teams[t].name + ') vince la domanda.', 'win', best.p);
      fx(g, { k: 'won', p: best.p, t: t });
    } else {
      g.phase = 'show'; g.until = now + SHOW_MS;
      log(g, 'Nessuno ha risposto giusto.', 'miss');
      fx(g, { k: 'miss' });
    }
  }
  function claim(g, r, now) {
    var t = g.players[g.chooser].team, from = g.own[r];
    g.own[r] = t;
    log(g, g.teams[t].name + (from >= 0 ? ' conquistano ' + D.R[r].name + ' dai ' + g.teams[from].name : ' prendono ' + D.R[r].name) + '.', 'claim', g.chooser);
    fx(g, { k: 'claim', t: t, r: r, from: from });
    g.phase = 'show'; g.until = now + SHOW_MS; g.clock = now;
  }
  function count(g, t) { return g.own.filter(function (o) { return o === t; }).length; }
  function finish(g) {
    var score = function (t) { return count(g, t) * 100 + g.teams[t].wins; };
    var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return score(b) - score(a) || a - b; });
    var place = g.teams.map(function (T, t) { return 1 + g.teams.filter(function (U, u) { return score(u) > score(t); }).length; });
    g.winners = order.filter(function (t) { return place[t] === 1; }); g.final = { order: order, place: place };
    g.phase = 'over';
    log(g, (g.winners.length > 1 ? 'Pari tra ' : 'Vincono ') + g.winners.map(function (t) { return g.teams[t].name; }).join(' e ') + ' con ' + count(g, g.winners[0]) + ' regioni.', 'win');
    fx(g, { k: 'over', t: g.winners[0] });
  }
  function tick(g, now) {
    if (now < g.until || g.phase === 'over') return false;
    if (g.phase === 'q') resolve(g, now);
    else if (g.phase === 'claim') { var o = options(g, g.players[g.chooser].team); claim(g, o[Math.floor(rand() * o.length)], now); }
    else if (g.phase === 'show') nextQ(g, now);
    g.seq++; return true;
  }
  function decider(g) { return g.phase === 'claim' ? g.chooser : null; }
  function pending(g) { return g.phase === 'q' ? g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ans; }) : g.phase === 'claim' ? [g.chooser] : []; }
  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    var P = g.players[p]; if (!P) return 'Non sei al tavolo.';
    if (g.phase === 'q') {
      if (now >= g.until) return 'Tempo scaduto.';
      if (a.a !== 'answer') return 'Adesso si risponde.';
      if (P.ans) return 'Hai già risposto.';
      var Q = D.Q[g.q], v;
      if (Q.k === 'c') { v = +a.i; if (!(v >= 0 && v < 4)) return 'Scegli una risposta.'; }
      else { v = Math.round(+String(a.v).replace(',', '.')); if (!isFinite(v)) return 'Scrivi un numero.'; }
      P.ans = { v: v, t: now - g.start };
      fx(g, { k: 'answered', p: p });
      // a scelta: chi risponde giusto per primo vince subito; si aspettano comunque tutti per le stime
      if (Q.k === 'c' && v === 0) resolve(g, now);
      else if (g.players.every(function (X) { return X.ans; })) resolve(g, now);
    } else if (g.phase === 'claim') {
      if (a.a !== 'claim') return 'Scegli una regione.';
      if (p !== g.chooser) return 'Sceglie ' + nick(g, g.chooser) + '.';
      var r = +a.r; if (options(g, P.team).indexOf(r) < 0) return 'Questa regione non si può prendere adesso.';
      claim(g, r, now);
    } else return 'Mossa non valida.';
    g.seq++; g.clock = now;
    return null;
  }
  function forceNext(g, now) { return tick(g, Math.max(now || Date.now(), g.until)); }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, options: options, count: count, members: members, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, D: D };
})();
if (typeof module !== 'undefined') module.exports = CQEngine;
