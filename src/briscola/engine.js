/* ===== Briscola: motore delle regole (gira sull'host; lo stato è JSON) =====
   Mazzo da 40 carte italiane. In 2 (uno contro uno) o in 4 (due coppie, i compagni seduti di fronte).
   Tre carte a testa; la carta sotto il mazzo, scoperta, indica il seme di briscola. A turno ognuno gioca una
   carta: prende la briscola più alta, altrimenti la carta più alta del seme di chi ha cominciato. Chi prende
   pesca per primo e comincia la mano dopo. Ordine: asso, tre, re, cavallo, fante, 7, 6, 5, 4, 2.
   Punti: asso 11, tre 10, re 4, cavallo 3, fante 2 (120 in tutto): vince chi ne fa più di 60.
   In 4, quando il mazzo è finito i compagni vedono le carte l'uno dell'altro; se l'host lo permette ci si
   possono fare dei «segni» (il compagno li vede, gli avversari no).
   Una carta è un numero da 0 a 39 (vedi src/carte/art.js). */
var BREngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var ORDER = [0, 10, 1, 9, 2, 3, 4, 5, 6, 7, 8];   // per valore (indice = valore): forza nel seme
  var PTS = [0, 11, 0, 10, 0, 0, 0, 0, 2, 3, 4];
  var SIGNS = { asso: 'Ho l’asso di briscola', tre: 'Ho il tre di briscola', re: 'Ho il re di briscola', carico: 'Ho un carico (asso o tre)', briscola: 'Ho delle briscole', liscio: 'Ho solo lisci', nulla: 'Niente briscole' };
  function suit(c) { return Math.floor(c / 10); }
  function rank(c) { return c % 10 + 1; }
  function pts(c) { return PTS[rank(c)]; }
  function power(c) { return ORDER[rank(c)]; }
  function sum(cs) { return cs.reduce(function (s, c) { return s + pts(c); }, 0); }
  var SN = ['coppe', 'denari', 'spade', 'bastoni'], RN = { 1: 'l’asso', 3: 'il tre', 8: 'il fante', 9: 'il cavallo', 10: 'il re' };
  function cname(c) { var r = rank(c); return (RN[r] || 'il ' + r) + ' di ' + SN[suit(c)]; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function team(g, p) { return g.players.length === 4 ? p % 2 : p; }
  function partner(g, p) { return g.players.length === 4 ? (p + 2) % 4 : -1; }
  function tname(g, t) { return g.players.length === 4 ? g.players[t].nick + ' e ' + g.players[t + 2].nick : g.players[t].nick; }
  // chi vince la mano: la briscola più alta, altrimenti la più alta del seme d'uscita
  function winner(trick, bs) {
    var best = trick[0];
    trick.forEach(function (x) {
      var bb = suit(best.c) === bs, xb = suit(x.c) === bs;
      if (xb && !bb) best = x;
      else if (suit(x.c) === suit(best.c) && power(x.c) > power(best.c)) best = x;
    });
    return best.p;
  }

  // i posti arrivano già in ordine di gioco: in 4, 0 e 2 contro 1 e 3
  function newGame(seats, opts) {
    opts = opts || {};
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, hand: 0,
      opts: { match: [1, 2, 3].indexOf(+opts.match) >= 0 ? +opts.match : 2, signs: opts.signs !== false },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], ready: false }; }),
      deck: [], bris: null, trick: [], lead: 0, turn: 0, taken: [], last: null, wins: [0, 0], hist: [], res: null, signs: {}, open: false,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, first: Math.floor(rand() * seats.length)
    };
    deal(g);
    return g;
  }
  function deal(g) {
    var n = g.players.length;
    g.hand++; g.phase = 'play'; g.res = null; g.trick = []; g.last = null; g.signs = {}; g.open = false;
    g.deck = shuffle(Array.from({ length: 40 }, function (x, i) { return i; }));
    g.players.forEach(function (P) { P.hand = g.deck.splice(-3, 3); P.ready = false; });
    g.bris = g.deck[0];                      // in fondo al mazzo, scoperta: è l'ultima a essere pescata
    g.taken = n === 4 ? [[], []] : [[], []];
    g.lead = g.turn = (g.first + g.hand - 1) % n;
    g.turnN++;
    log(g, 'Mano ' + g.hand + ': briscola ' + SN[suit(g.bris)] + ' (' + cname(g.bris) + ' sotto il mazzo).', 'sys');
    fx(g, { k: 'deal', hand: g.hand, bris: g.bris });
  }
  function decider(g) { return g.phase === 'play' ? g.turn : null; }
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function play(g, p, c) {
    var P = g.players[p], n = g.players.length;
    P.hand.splice(P.hand.indexOf(c), 1);
    g.trick.push({ p: p, c: c });
    fx(g, { k: 'play', p: p, c: c });
    if (g.trick.length < n) { g.turn = (p + 1) % n; g.turnN++; return; }
    var w = winner(g.trick, suit(g.bris)), t = team(g, w), cards = g.trick.map(function (x) { return x.c; }), got = sum(cards);
    g.taken[t] = g.taken[t].concat(cards);
    g.last = { trick: g.trick, w: w, pts: got };
    log(g, nick(g, w) + ' prende (' + g.trick.map(function (x) { return cname(x.c); }).join(', ') + '): ' + got + ' punti.', 'take', w);
    fx(g, { k: 'take', p: w, pts: got, cards: cards });
    g.trick = [];
    // si pesca: prima chi ha preso, poi gli altri in ordine
    if (g.deck.length) for (var k = 0; k < n; k++) { var q = (w + k) % n; if (g.deck.length) g.players[q].hand.push(g.deck.pop()); }
    if (!g.deck.length && n === 4 && !g.open) { g.open = true; fx(g, { k: 'open' }); }
    g.lead = g.turn = w; g.turnN++;
    if (g.players.every(function (Q) { return !Q.hand.length; })) endHand(g);
  }
  function endHand(g) {
    var a = sum(g.taken[0]), b = sum(g.taken[1]), w = a > 60 ? 0 : b > 60 ? 1 : -1;
    if (w >= 0) g.wins[w]++;
    g.hist.push([a, b]);
    g.res = { pts: [a, b], w: w, cards: [g.taken[0].length, g.taken[1].length] };
    log(g, 'Fine della mano ' + g.hand + ': ' + a + ' a ' + b + (w < 0 ? ', pari.' : ', vincono ' + tname(g, w) + '.'), 'round');
    var need = g.opts.match === 1 ? 1 : g.opts.match;
    if (g.wins[0] >= need || g.wins[1] >= need || (g.opts.match === 1 && g.hand >= 1)) {
      g.winners = g.wins[0] > g.wins[1] ? [0] : g.wins[1] > g.wins[0] ? [1] : [0, 1];
      g.final = { place: [g.wins[0] >= g.wins[1] ? 1 : 2, g.wins[1] >= g.wins[0] ? 1 : 2] };
      g.phase = 'over';
      log(g, g.winners.length > 1 ? 'Partita pari!' : 'Vincono ' + tname(g, g.winners[0]) + '!', 'win');
      fx(g, { k: 'roundEnd', over: true }); fx(g, { k: 'over', t: g.winners[0] });
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
    if (a.a === 'sign') {
      if (g.players.length !== 4 || !g.opts.signs) return 'In questa partita non si fanno segni.';
      if (!SIGNS[a.k]) return 'Segno sconosciuto.';
      g.signs[p] = { k: a.k, n: g.fxN + 1 }; fx(g, { k: 'sign', p: p, to: partner(g, p), s: a.k });
      return null;
    }
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
    play(g, p, c);
    return null;
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; deal(g); g.seq++; return true; }
  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, winner: winner, team: team, partner: partner, tname: tname, sum: sum, pts: pts, power: power, suit: suit, rank: rank, cname: cname, setRandom: setRandom, shuffle: shuffle, SIGNS: SIGNS, SN: SN };
})();
if (typeof module !== 'undefined') module.exports = BREngine;
