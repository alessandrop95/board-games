/* ===== Scopa: motore delle regole (gira sull'host; lo stato è JSON) =====
   40 carte italiane, in 2 o in 4 (due coppie, i compagni di fronte).
   Scopa classica: 3 carte a testa e 4 scoperte in tavola (se in tavola escono 3 o 4 re si rimescola); finite
   le carte se ne danno altre 3 a testa. Scopone scientifico (solo in 4): 10 carte a testa, tavola vuota.
   Si gioca una carta: se in tavola c'è una carta dello stesso valore la si deve prendere (una sola); altrimenti
   si possono prendere più carte che sommate fanno il suo valore (fante 8, cavallo 9, re 10). Se non prende,
   la carta resta in tavola. Chi porta via tutte le carte dalla tavola fa «scopa» (non all'ultima giocata).
   A fine mano le carte rimaste in tavola vanno a chi ha preso per ultimo. Punti: carte (più di 20),
   denari (più di 5), settebello, primiera, e un punto per ogni scopa. Vince chi arriva prima a 11 (o 21).
   Una carta è un numero da 0 a 39 (vedi src/carte/art.js): seme = c / 10, valore = c % 10 + 1. */
var SCEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var PRIME = [0, 16, 12, 13, 14, 15, 18, 21, 10, 10, 10];   // valori di primiera (indice = valore della carta)
  var SN = ['coppe', 'denari', 'spade', 'bastoni'], RN = { 1: 'l’asso', 8: 'il fante', 9: 'il cavallo', 10: 'il re' };
  function suit(c) { return Math.floor(c / 10); }
  function val(c) { return c % 10 + 1; }
  function cname(c) { var r = val(c); return (RN[r] || 'il ' + r) + ' di ' + SN[suit(c)]; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 140) g.log.splice(0, g.log.length - 140); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function team(g, p) { return g.players.length === 4 ? p % 2 : p; }
  function partner(g, p) { return g.players.length === 4 ? (p + 2) % 4 : -1; }
  function tname(g, t) { return g.players.length === 4 ? g.players[t].nick + ' e ' + g.players[t + 2].nick : g.players[t].nick; }
  // tutti i modi di prendere con la carta c: [] se nessuno. Se c'è una carta dello stesso valore, solo quelle.
  function captures(table, c) {
    var v = val(c), same = table.filter(function (x) { return val(x) === v; });
    if (same.length) return same.map(function (x) { return [x]; });
    var out = [], n = table.length;
    for (var m = 1; m < (1 << n); m++) {
      var s = 0, set = [];
      for (var i = 0; i < n; i++) if (m & (1 << i)) { s += val(table[i]); set.push(table[i]); }
      if (s === v && set.length > 1) out.push(set);
    }
    return out;
  }
  function sameSet(a, b) { return a.length === b.length && a.slice().sort().join() === b.slice().sort().join(); }
  function primiera(cards) {
    var best = [0, 0, 0, 0];
    cards.forEach(function (c) { best[suit(c)] = Math.max(best[suit(c)], PRIME[val(c)]); });
    return { full: best.every(function (x) { return x > 0; }), sum: best.reduce(function (a, b) { return a + b; }, 0) };
  }

  function newGame(seats, opts) {
    opts = opts || {};
    var four = seats.length === 4;
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, hand: 0,
      opts: { target: [11, 21].indexOf(+opts.target) >= 0 ? +opts.target : 11, scopone: four && opts.variant === 'scopone' },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], ready: false }; }),
      deck: [], table: [], taken: [[], []], scope: [0, 0], lastTaker: null, turn: 0, dealer: Math.floor(rand() * seats.length),
      totals: [0, 0], hist: [], res: null, last: null, log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    deal(g);
    return g;
  }
  function deal(g) {
    var n = g.players.length;
    g.hand++; g.phase = 'play'; g.res = null; g.last = null; g.taken = [[], []]; g.scope = [0, 0]; g.lastTaker = null;
    g.dealer = (g.dealer + 1) % n;
    do { g.deck = shuffle(Array.from({ length: 40 }, function (x, i) { return i; })); g.table = g.opts.scopone ? [] : g.deck.splice(-4, 4); }
    while (g.table.filter(function (c) { return val(c) === 10; }).length >= 3);
    g.players.forEach(function (P) { P.hand = g.deck.splice(-(g.opts.scopone ? 10 : 3)); P.ready = false; });
    g.turn = (g.dealer + 1) % n; g.turnN++;
    log(g, 'Mano ' + g.hand + ': ' + (g.table.length ? 'in tavola ' + g.table.map(cname).join(', ') + '.' : 'tavola vuota, 10 carte a testa.'), 'sys');
    fx(g, { k: 'deal', hand: g.hand });
  }
  function refill(g) {
    if (g.players.some(function (P) { return P.hand.length; })) return false;
    if (!g.deck.length) return false;
    g.players.forEach(function (P) { P.hand = g.deck.splice(-3); });
    fx(g, { k: 'refill', left: g.deck.length });
    return true;
  }
  function decider(g) { return g.phase === 'play' ? g.turn : null; }
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function lastPlay(g) { return !g.deck.length && g.players.reduce(function (s, P) { return s + P.hand.length; }, 0) === 0; }
  function play(g, p, c, take) {
    var P = g.players[p], t = team(g, p);
    P.hand.splice(P.hand.indexOf(c), 1);
    if (take && take.length) {
      g.table = g.table.filter(function (x) { return take.indexOf(x) < 0; });
      g.taken[t] = g.taken[t].concat(take, [c]); g.lastTaker = p;
      var scopa = !g.table.length && !lastPlay(g);
      if (scopa) g.scope[t]++;
      g.last = { p: p, c: c, take: take, scopa: scopa };
      log(g, nick(g, p) + ' gioca ' + cname(c) + ' e prende ' + take.map(cname).join(', ') + (scopa ? ': SCOPA!' : '.'), scopa ? 'scopa' : 'take', p);
      fx(g, { k: 'take', p: p, c: c, take: take, scopa: scopa });
    } else {
      g.table.push(c); g.last = { p: p, c: c, take: [] };
      log(g, nick(g, p) + ' cala ' + cname(c) + '.', 'drop', p);
      fx(g, { k: 'drop', p: p, c: c });
    }
    g.turn = (p + 1) % g.players.length; g.turnN++;
    refill(g);
    if (lastPlay(g)) endHand(g);
  }
  function score(g) {
    var tk = g.taken, r = [[], []];
    function point(name, a, b) { if (a > b) r[0].push(name); else if (b > a) r[1].push(name); }
    point('carte', tk[0].length, tk[1].length);
    point('denari', tk[0].filter(function (c) { return suit(c) === 1; }).length, tk[1].filter(function (c) { return suit(c) === 1; }).length);
    if (tk[0].indexOf(16) >= 0) r[0].push('settebello'); else if (tk[1].indexOf(16) >= 0) r[1].push('settebello');
    var p0 = primiera(tk[0]), p1 = primiera(tk[1]);
    if (p0.full && (!p1.full || p0.sum > p1.sum)) r[0].push('primiera'); else if (p1.full && (!p0.full || p1.sum > p0.sum)) r[1].push('primiera');
    return { items: r, pts: [r[0].length + g.scope[0], r[1].length + g.scope[1]], prim: [p0, p1] };
  }
  function endHand(g) {
    if (g.table.length && g.lastTaker != null) {
      var t = team(g, g.lastTaker); g.taken[t] = g.taken[t].concat(g.table);
      log(g, 'Le carte rimaste in tavola vanno a ' + nick(g, g.lastTaker) + '.', 'sys', g.lastTaker);
      fx(g, { k: 'sweep', p: g.lastTaker, cards: g.table.slice() });
      g.table = [];
    }
    var S = score(g);
    g.totals[0] += S.pts[0]; g.totals[1] += S.pts[1]; g.hist.push(S.pts.slice());
    g.res = { pts: S.pts, items: S.items, scope: g.scope.slice(), cards: [g.taken[0].length, g.taken[1].length], denari: [0, 1].map(function (t) { return g.taken[t].filter(function (c) { return suit(c) === 1; }).length; }), prim: S.prim.map(function (x) { return x.full ? x.sum : 0; }), w: S.pts[0] > S.pts[1] ? 0 : S.pts[1] > S.pts[0] ? 1 : -1 };
    log(g, 'Fine della mano ' + g.hand + ': ' + S.pts[0] + ' a ' + S.pts[1] + ' (totale ' + g.totals[0] + ' a ' + g.totals[1] + ').', 'round');
    var T = g.opts.target;
    if ((g.totals[0] >= T || g.totals[1] >= T) && g.totals[0] !== g.totals[1]) {
      var w = g.totals[0] > g.totals[1] ? 0 : 1;
      g.winners = [w]; g.final = { place: w === 0 ? [1, 2] : [2, 1] };
      g.phase = 'over';
      log(g, 'Vincono ' + tname(g, w) + ', ' + g.totals[w] + ' a ' + g.totals[1 - w] + '!', 'win');
      fx(g, { k: 'roundEnd', over: true }); fx(g, { k: 'over', t: w });
    } else {
      g.phase = 'scores'; g.players.forEach(function (P) { P.ready = !!P.bot; });
      fx(g, { k: 'roundEnd', over: false });
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
      if (a.a !== 'next') return 'Tocca «Prossima mano».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) deal(g);
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (a.a !== 'play') return 'Mossa sconosciuta.';
    if (g.turn !== p) return 'Non è il tuo turno: tocca a ' + nick(g, g.turn) + '.';
    var c = +a.c; if (P.hand.indexOf(c) < 0) return 'Questa carta non è nella tua mano.';
    var opts = captures(g.table, c), take = Array.isArray(a.take) ? a.take.map(Number) : null;
    if (!opts.length) { if (take && take.length) return 'Con questa carta non si prende niente.'; play(g, p, c, null); return null; }
    if (!take || !take.length) { if (opts.length === 1) take = opts[0]; else return 'Scegli quali carte prendere dalla tavola.'; }
    if (!opts.some(function (o) { return sameSet(o, take); })) return val(c) <= 10 && g.table.some(function (x) { return val(x) === val(c); }) ? 'C’è una carta dello stesso valore: devi prendere quella.' : 'Queste carte non fanno ' + val(c) + '.';
    play(g, p, c, take);
    return null;
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; deal(g); g.seq++; return true; }
  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, captures: captures, primiera: primiera, score: score, team: team, partner: partner, tname: tname, suit: suit, val: val, cname: cname, setRandom: setRandom, shuffle: shuffle, SN: SN, PRIME: PRIME };
})();
if (typeof module !== 'undefined') module.exports = SCEngine;
