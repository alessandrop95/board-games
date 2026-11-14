/* ===== Sintonia: giocatori automatici =====
   Scrivono una delle risposte più comuni del tema: quasi sempre una delle prime tre, come farebbe chiunque.
   Nel riepilogo sono subito pronti. */
var STBot = (function () {
  var E = (typeof STEngine !== 'undefined') ? STEngine : require('./engine.js'), D = E.D;
  var W = [.42, .24, .14, .09, .06, .05];
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'show') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'write' || P.ans) return null;
    var list = D.LIST[g.theme].a, r = Math.random(), k = 0;
    while (k < list.length - 1 && r > W[k]) { r -= W[k]; k++; }
    return { a: 'answer', w: list[Math.min(k, list.length - 1)] };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = STBot;
