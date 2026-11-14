/* ===== Burraco: giocatori automatici =====
   Pescano dal mazzo, ma prendono gli scarti se la carta in cima si cala subito (o gli scarti sono tanti e
   utili). Poi attaccano alle combinazioni della squadra le carte che entrano, calano tris e scale che hanno in
   mano (tenendo le matte per completare) e scartano la carta meno utile: isolata, di valore alto, mai una matta
   finché ce n'è un'altra. Una mossa alla volta: l'host li richiama finché non hanno scartato. */
var BUBot = (function () {
  var E = (typeof BUEngine !== 'undefined') ? BUEngine : require('./engine.js');
  // tutte le combinazioni di 3+ carte naturali in mano (tris e pezzi di scala), più lunghe prima
  function naturalMelds(hand) {
    var out = [], nat = hand.filter(function (c) { return !E.wildish(c); });
    var byRank = {}; nat.forEach(function (c) { (byRank[E.rank(c)] = byRank[E.rank(c)] || []).push(c); });
    Object.keys(byRank).forEach(function (r) { if (byRank[r].length >= 3) out.push(byRank[r].slice()); });
    for (var s = 0; s < 4; s++) {
      var bySuit = {}; nat.forEach(function (c) { if (E.suit(c) === s && !bySuit[E.rank(c)]) bySuit[E.rank(c)] = c; });
      var ranks = Object.keys(bySuit).map(Number); if (bySuit[1]) ranks.push(14);
      ranks.sort(function (a, b) { return a - b; });
      var run = [];
      for (var i = 0; i <= ranks.length; i++) {
        if (i < ranks.length && run.length && ranks[i] === ranks[i - 1] + 1) run.push(ranks[i]);
        else { if (run.length >= 3) out.push(run.map(function (r) { return bySuit[r === 14 ? 1 : r]; })); run = i < ranks.length ? [ranks[i]] : []; }
      }
    }
    return out.filter(function (m) { return E.analyze(m); }).sort(function (a, b) { return b.length - a.length; });
  }
  // coppie che con una matta diventano combinazione
  function pairPlusWild(hand) {
    var w = hand.filter(E.wildish)[0]; if (w == null) return null;
    var nat = hand.filter(function (c) { return !E.wildish(c); });
    for (var i = 0; i < nat.length; i++) for (var j = i + 1; j < nat.length; j++) { var m = [nat[i], nat[j], w]; if (E.analyze(m)) return m; }
    return null;
  }
  function useful(hand, c, melds) {
    if (E.wildish(c)) return 50;
    var u = 0;
    hand.forEach(function (x) { if (x === c || E.wildish(x)) return; if (E.rank(x) === E.rank(c)) u += 3; if (E.suit(x) === E.suit(c) && Math.abs(E.rank(x) - E.rank(c)) <= 2) u += 2; });
    if (melds.some(function (m) { return E.analyze(m.cards.concat([c])); })) u += 6;
    return u;
  }
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    var t = E.team(g, p), melds = g.melds[t], hand = P.hand;
    if (g.step === 'draw') {
      var top = g.pile[g.pile.length - 1];
      if (top != null && !E.wildish(top) && !(g.took[t] && !E.hasBurraco(g, t) && hand.length <= 1)) {
        var withTop = hand.concat([top]);
        var fits = melds.some(function (m) { return E.analyze(m.cards.concat([top])); }) || naturalMelds(withTop).some(function (m) { return m.indexOf(top) >= 0; });
        if (fits) return { a: 'pile' };
      }
      return { a: 'draw' };
    }
    var keep = function (n) { var left = hand.length - n; return g.took[t] ? left >= (E.hasBurraco(g, t) ? 1 : 2) : true; };
    // attaccare
    for (var i = 0; i < melds.length; i++) for (var k = 0; k < hand.length; k++) {
      var c = hand[k]; if (E.wildish(c) && melds[i].clean && melds[i].cards.length < 7) continue;
      if (E.analyze(melds[i].cards.concat([c])) && E.analyze(melds[i].cards.concat([c])).type === melds[i].type && keep(1)) return { a: 'add', m: melds[i].id, cards: [c] };
    }
    // calare
    var nm = naturalMelds(hand).filter(function (m) { return keep(m.length); })[0];
    if (nm) return { a: 'meld', cards: nm };
    if (hand.length > 7) { var pw = pairPlusWild(hand); if (pw && keep(3)) return { a: 'meld', cards: pw }; }
    // scartare
    var cand = hand.filter(function (c) { return !(g.fromPile != null && c === g.fromPile && hand.length > 1); });
    if (hand.length === 1 && g.took[t] && !E.hasBurraco(g, t)) return null;
    var pick = cand.slice().sort(function (a, b) { return (useful(hand, a, melds) - E.value(a) / 10) - (useful(hand, b, melds) - E.value(b) / 10); })[0];
    return { a: 'discard', c: pick != null ? pick : hand[0] };
  }
  return { decide: decide, naturalMelds: naturalMelds };
})();
if (typeof module !== 'undefined') module.exports = BUBot;
