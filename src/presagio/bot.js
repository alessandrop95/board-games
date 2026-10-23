/* ===== Giocatori automatici di Presagio ===== */
var PRBot = (function () {
  var D = (typeof PRData !== 'undefined') ? PRData : require('./engine.js').PRData;
  var E = (typeof PREngine !== 'undefined') ? PREngine : require('./engine.js').PREngine;
  var C = D.CARDS;

  // Probabilità grossolana che una carta faccia presa
  function strength(s, id) {
    var c = C[id], k = s.players.length, r = s.round;
    if (c.k === 'w') return 0.97;
    if (c.k === 'j') return 0;
    var crowd = (k - 1) * r / 60; // quante carte avversarie per presa, in proporzione
    if (s.trump != null && c.s === s.trump) return Math.min(0.95, 0.25 + c.v / 14 * 0.8 - crowd * 0.15);
    var base = c.v >= 13 ? 0.6 : c.v >= 11 ? 0.35 : c.v >= 9 ? 0.15 : 0.04;
    if (s.trump == null) base *= 1.35;
    return Math.max(0, base - crowd * 0.25);
  }
  function chooseBid(s, p) {
    var exp = s.players[p].hand.reduce(function (t, id) { return t + strength(s, id); }, 0);
    var b = Math.max(0, Math.min(s.round, Math.round(exp)));
    var f = E.forbiddenBid(s, p);
    if (f === b) b = (exp >= b && b + 1 <= s.round) || b === 0 ? b + 1 : b - 1;
    if (b > s.round) b = s.round - 1;
    return b;
  }
  function chooseTrump(s, p) {
    var score = [0, 0, 0, 0];
    s.players[p].hand.forEach(function (id) { var c = C[id]; if (c.k === 'n') score[c.s] += 1 + c.v / 13; });
    var best = 0; for (var i = 1; i < 4; i++) if (score[i] > score[best]) best = i;
    return best;
  }
  function winsIfPlayed(s, p, id) {
    var t = s.trick.concat([{ p: p, c: id }]);
    return t[E.trickWinner(t, s.trump)].p === p;
  }
  function value(s, id) { var c = C[id]; return c.k === 'w' ? 100 : c.k === 'j' ? -10 : (s.trump != null && c.s === s.trump ? 40 : 0) + c.v; }
  function choosePlay(s, p) {
    var P = s.players[p], opts = E.playable(s, p), need = P.bid - P.tricks;
    var last = s.trick.length === s.players.length - 1;
    var byVal = opts.slice().sort(function (a, b) { return value(s, a) - value(s, b); });
    if (!s.trick.length) {
      // apro: se mi servono prese apro forte, altrimenti piano
      if (need > 0) { var strong = byVal.filter(function (id) { return strength(s, id) > 0.55; }); return strong.length ? strong[strong.length - 1] : byVal[0]; }
      var low = byVal.filter(function (id) { return C[id].k === 'n'; });
      return low.length ? low[0] : byVal[0];
    }
    var winners = byVal.filter(function (id) { return winsIfPlayed(s, p, id); });
    var losers = byVal.filter(function (id) { return !winsIfPlayed(s, p, id); });
    if (need > 0) {
      if (winners.length) {
        // se sono ultimo basta la più bassa che vince; altrimenti una abbastanza forte
        if (last) return winners[0];
        var safe = winners.filter(function (id) { return strength(s, id) > 0.5; });
        return safe.length ? safe[0] : winners[winners.length - 1];
      }
      return losers[0];
    }
    // non voglio prese: butto la più alta che perde, altrimenti la più bassa
    if (losers.length) {
      var nonJ = losers.filter(function (id) { return C[id].k !== 'j'; });
      return nonJ.length && last ? nonJ[nonJ.length - 1] : (nonJ.length ? nonJ[nonJ.length - 1] : losers[0]);
    }
    return byVal[0];
  }
  function decide(s, p) {
    if (s.turn !== p) return null;
    if (s.phase === 'trump') return { a: 'trump', s: chooseTrump(s, p) };
    if (s.phase === 'bid') return { a: 'bid', b: chooseBid(s, p) };
    if (s.phase === 'play') return { a: 'play', c: choosePlay(s, p) };
    if (s.phase === 'roundEnd') return { a: 'next' };
    return null;
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = PRBot;
