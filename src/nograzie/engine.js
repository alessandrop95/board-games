/* ===== No Grazie!: motore delle regole (gira sull'host; lo stato è JSON) =====
   33 carte numerate da 3 a 35: se ne tolgono 9 a caso, senza guardarle, e restano 24 carte.
   Gettoni: 11 a testa da 3 a 5 giocatori, 9 con 6 giocatori, 7 con 7 giocatori.
   Si gira una carta. Chi è di turno o la prende (con tutti i gettoni che ci sono sopra) o paga un gettone
   e dice «No grazie!»: allora tocca al giocatore dopo. Chi non ha più gettoni deve prenderla.
   Chi prende una carta gira la successiva e decide di nuovo lui. Quando le carte finiscono si contano i punti:
   ogni carta vale il suo numero, ma in una scala di numeri consecutivi conta solo il più basso;
   ogni gettone vale −1. Vince chi ha meno punti.
   Opzioni: più partite di fila (si sommano i punti), gettoni degli altri nascosti (regola originale) o visibili. */
var NGEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function chipsFor(n) { return n <= 5 ? 11 : n === 6 ? 9 : 7; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 16) g.fx.splice(0, g.fx.length - 16); }
  // scale di numeri consecutivi: [[3,4,5],[9],[20,21]]
  function runs(cards) {
    var c = cards.slice().sort(function (a, b) { return a - b; }), out = [];
    c.forEach(function (v) { var last = out[out.length - 1]; if (last && v === last[last.length - 1] + 1) last.push(v); else out.push([v]); });
    return out;
  }
  function cardPts(cards) { return runs(cards).reduce(function (s, r) { return s + r[0]; }, 0); }
  function score(P) { return cardPts(P.cards) - P.chips; }
  // quanto cambierebbero i punti delle carte prendendo la carta v
  function marginal(cards, v) { return cardPts(cards.concat([v])) - cardPts(cards); }

  function newGame(seats, opts) {
    opts = opts || {};
    var rounds = [1, 3, 5].indexOf(+opts.rounds) >= 0 ? +opts.rounds : 1;
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, round: 0,
      opts: { rounds: rounds, chips: opts.chips === 'open' ? 'open' : 'hidden' },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, cards: [], chips: 0, total: 0, hist: [], ready: false }; }),
      deck: [], removed: [], cur: null, pot: 0, turn: 0, starter: Math.floor(rand() * seats.length),
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null
    };
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.round++; g.phase = 'play'; g.roundRes = null;
    var d = []; for (var v = 3; v <= 35; v++) d.push(v);
    shuffle(d); g.removed = d.splice(0, 9); g.deck = d;
    var c = chipsFor(g.players.length);
    g.players.forEach(function (P) { P.cards = []; P.chips = c; P.ready = false; });
    if (g.round > 1) g.starter = (g.starter + 1) % g.players.length;
    g.turn = g.starter; g.turnN++;
    log(g, (g.opts.rounds > 1 ? 'Partita ' + g.round + ' di ' + g.opts.rounds + ': ' : '') + 'ognuno ha ' + c + ' gettoni; 9 carte sono state tolte senza guardarle. Comincia ' + nick(g, g.turn) + '.', 'sys', g.turn);
    fx(g, { k: 'deal', round: g.round, chips: c });
    flip(g);
  }
  function flip(g) {
    g.cur = g.deck.pop(); g.pot = 0;
    fx(g, { k: 'flip', v: g.cur, p: g.turn, left: g.deck.length });
  }
  function decider(g) { return g.phase === 'play' ? g.turn : null; }
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function endRound(g) {
    g.cur = null; g.pot = 0;
    var pts = g.players.map(score);
    g.players.forEach(function (P, i) { P.hist.push(pts[i]); P.total += pts[i]; P.ready = !!P.bot; });
    g.roundRes = { pts: pts, cardPts: g.players.map(function (P) { return cardPts(P.cards); }), chips: g.players.map(function (P) { return P.chips; }), removed: g.removed.slice().sort(function (a, b) { return a - b; }) };
    log(g, 'Carte finite! ' + g.players.map(function (P, i) { return P.nick + ' ' + pts[i]; }).join(', ') + '. Le carte tolte erano: ' + g.roundRes.removed.join(', ') + '.', 'round');
    if (g.round >= g.opts.rounds) {
      var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[a].total - g.players[b].total || a - b; });
      var place = g.players.map(function (P) { return 1 + g.players.filter(function (Q) { return Q.total < P.total; }).length; });
      g.winners = order.filter(function (i) { return place[i] === 1; });
      g.final = { order: order, place: place };
      g.phase = 'over';
      log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + g.players[g.winners[0]].total + ' punti.', 'win', g.winners[0]);
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
      if (a.a !== 'next') return 'Tocca «Prossima partita».';
      if (P.ready) return null;
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    if (a.a === 'pass') {
      if (P.chips <= 0) return 'Non hai più gettoni: devi prendere la carta.';
      P.chips--; g.pot++;
      fx(g, { k: 'pass', p: p, pot: g.pot });
      log(g, nick(g, p) + ': «No grazie!» (un gettone sul ' + g.cur + ').', 'pass', p);
      g.turn = (p + 1) % g.players.length; g.turnN++;
      fx(g, { k: 'turn', p: g.turn });
      return null;
    }
    if (a.a === 'take') {
      var v = g.cur, pot = g.pot;
      P.cards.push(v); P.chips += pot;
      fx(g, { k: 'take', p: p, v: v, pot: pot });
      log(g, nick(g, p) + ' prende il ' + v + (pot ? ' con ' + pot + (pot > 1 ? ' gettoni' : ' gettone') : '') + '.', 'take', p);
      if (!g.deck.length) { endRound(g); return null; }
      g.turnN++; flip(g);
      fx(g, { k: 'turn', p: p, again: true });
      return null;
    }
    return 'Mossa sconosciuta.';
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g); fx(g, { k: 'next' }); g.seq++; return true; }

  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, runs: runs, cardPts: cardPts, score: score, marginal: marginal, chipsFor: chipsFor, setRandom: setRandom, shuffle: shuffle };
})();
if (typeof module !== 'undefined') module.exports = NGEngine;
