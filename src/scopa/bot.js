/* ===== Scopa: giocatori automatici =====
   Per ogni carta e ogni presa possibile danno un voto: scopa, settebello, denari, sette e sei (primiera) e
   numero di carte valgono; lasciare in tavola una somma che l'avversario può portare via (10 o meno) costa.
   Se non possono prendere calano la carta che lascia meno occasioni e che vale meno. */
var SCBot = (function () {
  var E = (typeof SCEngine !== 'undefined') ? SCEngine : require('./engine.js');
  function worth(c) { var v = E.val(c); return (c === 16 ? 6 : 0) + (E.suit(c) === 1 ? 1.2 : 0) + (v === 7 ? 1.6 : v === 6 ? .8 : v === 1 ? .5 : 0) + .3; }
  function risk(table) {
    var s = table.reduce(function (a, c) { return a + E.val(c); }, 0);
    if (!table.length) return 0;
    return s <= 10 ? 3 : 0;    // l'avversario può fare scopa con una carta sola
  }
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    var best = null;
    P.hand.forEach(function (c) {
      var opts = E.captures(g.table, c);
      if (opts.length) opts.forEach(function (take) {
        var left = g.table.filter(function (x) { return take.indexOf(x) < 0; });
        var sc = take.reduce(function (s, x) { return s + worth(x); }, worth(c)) + (left.length ? 0 : 10) + take.length * .2 - risk(left);
        if (!best || sc > best.sc) best = { sc: sc, a: { a: 'play', c: c, take: take } };
      });
      else {
        var t2 = g.table.concat([c]), sc2 = -worth(c) * 1.5 - risk(t2) - (E.val(c) <= 7 ? .3 : 0) + Math.random() * .2;
        if (!best || sc2 > best.sc) best = { sc: sc2, a: { a: 'play', c: c } };
      }
    });
    return best && best.a;
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = SCBot;
