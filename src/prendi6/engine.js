/* ===== Prendi 6!: motore delle regole (gira sull'host; lo stato è JSON) =====
   104 carte numerate da 1 a 104; ognuna ha delle teste di toro (punti di penalità): il 55 ne ha 7, i doppi
   (11, 22, …) 5, i multipli di 10 ne hanno 3, quelli che finiscono per 5 ne hanno 2, le altre 1.
   A ogni manche: 10 carte a testa e 4 file sul tavolo, ognuna con una carta. A ogni turno tutti scelgono
   insieme e di nascosto una carta; poi le carte si mettono, dalla più bassa alla più alta, in fondo alla fila
   che finisce con il numero più vicino sotto (la differenza più piccola). Chi mette la sesta carta in una fila
   si prende le cinque carte della fila e la sua diventa la prima. Chi ha una carta più bassa di tutte le file
   sceglie una fila da prendere e la sua carta la sostituisce.
   La partita finisce quando qualcuno arriva a 66 teste (a fine manche): vince chi ne ha meno.
   Variante «tattica»: si usano solo le carte da 1 a 10 × giocatori + 4, così si sa quali carte ci sono. */
var P6Engine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function bulls(v) { return v === 55 ? 7 : v % 11 === 0 ? 5 : v % 10 === 0 ? 3 : v % 5 === 0 ? 2 : 1; }
  function sum(cards) { return cards.reduce(function (s, v) { return s + bulls(v); }, 0); }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function last(r) { return r[r.length - 1]; }
  // la fila dove va la carta v (null se è più bassa di tutte)
  function target(rows, v) { var best = null; rows.forEach(function (r, i) { if (last(r) < v && (best == null || last(r) > last(rows[best]))) best = i; }); return best; }
  function deckFor(g) { var n = g.opts.tactic ? g.players.length * 10 + 4 : 104, d = []; for (var v = 1; v <= n; v++) d.push(v); return shuffle(d); }

  function newGame(seats, opts) {
    opts = opts || {};
    var g = {
      v: 1, phase: 'pick', seq: 0, turnN: 0, round: 0,
      opts: { target: [33, 66, 99].indexOf(+opts.target) >= 0 ? +opts.target : 66, tactic: !!opts.tactic },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], pick: null, pile: [], total: 0, hist: [], ready: false }; }),
      rows: [], queue: [], chooser: null, plays: null, log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null
    };
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.round++; g.phase = 'pick'; g.roundRes = null; g.queue = []; g.chooser = null; g.plays = null;
    var d = deckFor(g);
    g.players.forEach(function (P) { P.hand = d.splice(0, 10).sort(function (a, b) { return a - b; }); P.pick = null; P.pile = []; P.ready = false; });
    g.rows = [0, 1, 2, 3].map(function () { return [d.pop()]; }).sort(function (a, b) { return a[0] - b[0]; });
    g.turnN++;
    log(g, 'Manche ' + g.round + ': 10 carte a testa, 4 file sul tavolo (' + g.rows.map(function (r) { return r[0]; }).join(', ') + ').', 'sys');
    fx(g, { k: 'deal', round: g.round });
  }
  function decider(g) {
    if (g.phase === 'choose') return g.chooser;
    if (g.phase !== 'pick') return null;
    for (var i = 0; i < g.players.length; i++) if (g.players[i].pick == null) return i;
    return null;
  }
  function pending(g) {
    if (g.phase === 'choose') return [g.chooser];
    if (g.phase === 'pick') return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].pick == null; });
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function startResolve(g) {
    g.queue = g.players.map(function (P, p) { return { p: p, v: P.pick }; }).sort(function (a, b) { return a.v - b.v; });
    g.plays = g.queue.map(function (x) { return { p: x.p, v: x.v }; });
    g.players.forEach(function (P) { P.hand.splice(P.hand.indexOf(P.pick), 1); P.pick = null; });
    fx(g, { k: 'reveal', plays: g.plays });
    log(g, 'Si scoprono: ' + g.plays.map(function (x) { return nick(g, x.p) + ' ' + x.v; }).join(', ') + '.', 'reveal');
    process(g);
  }
  function takeRow(g, p, r, v, why) {
    var P = g.players[p], cards = g.rows[r], b = sum(cards);
    P.pile = P.pile.concat(cards); g.rows[r] = [v];
    fx(g, { k: 'take', p: p, r: r, v: v, cards: cards, bulls: b, why: why });
    log(g, nick(g, p) + (why === 'low' ? ' ha la carta più bassa (' + v + ') e prende' : ' mette la sesta carta (' + v + ') e prende') + ' la fila ' + (r + 1) + ': ' + b + (b > 1 ? ' teste.' : ' testa.'), 'take', p);
  }
  function process(g) {
    while (g.queue.length) {
      var x = g.queue[0], r = target(g.rows, x.v);
      if (r == null) { g.phase = 'choose'; g.chooser = x.p; fx(g, { k: 'needrow', p: x.p, v: x.v }); return; }
      g.queue.shift();
      if (g.rows[r].length >= 5) takeRow(g, x.p, r, x.v, 'six');
      else { g.rows[r].push(x.v); fx(g, { k: 'place', p: x.p, v: x.v, r: r, i: g.rows[r].length - 1 }); }
    }
    g.chooser = null;
    if (!g.players[0].hand.length) { endRound(g); return; }
    g.phase = 'pick'; g.turnN++;
    fx(g, { k: 'turn' });
  }
  function endRound(g) {
    var pts = g.players.map(function (P) { return sum(P.pile); });
    g.players.forEach(function (P, i) { P.total += pts[i]; P.hist.push(pts[i]); P.ready = !!P.bot; });
    g.roundRes = { pts: pts, piles: g.players.map(function (P) { return P.pile.slice().sort(function (a, b) { return a - b; }); }) };
    log(g, 'Fine della manche ' + g.round + ': ' + g.players.map(function (P, i) { return P.nick + ' ' + pts[i]; }).join(', ') + '.', 'round');
    if (g.players.some(function (P) { return P.total >= g.opts.target; })) {
      var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[a].total - g.players[b].total || a - b; });
      var place = g.players.map(function (P) { return 1 + g.players.filter(function (Q) { return Q.total < P.total; }).length; });
      g.winners = order.filter(function (i) { return place[i] === 1; });
      g.final = { order: order, place: place };
      g.phase = 'over';
      log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + g.players[g.winners[0]].total + ' teste.', 'win', g.winners[0]);
      fx(g, { k: 'roundEnd', round: g.round, over: true });
      fx(g, { k: 'over', p: g.winners[0] });
    } else {
      g.phase = 'scores';
      fx(g, { k: 'roundEnd', round: g.round, over: false });
    }
  }
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a);
    if (!r) g.seq++;
    return r;
  }
  function doAct(g, p, a) {
    var P = g.players[p];
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'Tocca «Prossima manche».';
      if (P.ready) return null;
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase === 'choose') {
      if (g.chooser !== p) return 'Aspetta: ' + nick(g, g.chooser) + ' sta scegliendo quale fila prendere.';
      if (a.a !== 'row') return 'Scegli quale fila prendere.';
      var r = +a.r; if (!(r >= 0 && r < 4) || r !== Math.floor(r)) return 'Scegli una delle quattro file.';
      var x = g.queue.shift();
      takeRow(g, p, r, x.v, 'low');
      process(g);
      return null;
    }
    if (g.phase !== 'pick') return 'Mossa non valida.';
    if (a.a === 'unpick') { if (P.pick == null) return null; P.pick = null; fx(g, { k: 'picked', p: p, on: false }); return null; }
    if (a.a !== 'pick') return 'Mossa sconosciuta.';
    var v = +a.v; if (P.hand.indexOf(v) < 0) return 'Questa carta non è nella tua mano.';
    P.pick = v;
    fx(g, { k: 'picked', p: p, on: true });
    if (g.players.every(function (Q) { return Q.pick != null; })) startResolve(g);
    return null;
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g); fx(g, { k: 'next' }); g.seq++; return true; }

  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, bulls: bulls, sum: sum, target: target, last: last, setRandom: setRandom, shuffle: shuffle };
})();
if (typeof module !== 'undefined') module.exports = P6Engine;
