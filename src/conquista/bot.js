/* ===== Conquista l'Italia: giocatori automatici =====
   Rispondono dopo qualche secondo: alle domande a scelta azzeccano più o meno due volte su tre, alle stime
   sbagliano di un po' (fino a un quarto in più o in meno). Quando vincono scelgono la regione che tocca più
   regioni della loro squadra (così il territorio resta unito). */
var CQBot = (function () {
  var E = (typeof CQEngine !== 'undefined') ? CQEngine : require('./engine.js'), D = E.D;
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'claim') {
      if (g.chooser !== p) return null;
      var o = E.options(g, P.team), best = o[0], bs = -1;
      o.forEach(function (r) { var s = D.ADJ[r].filter(function (j) { return g.own[j] === P.team; }).length * 2 + D.ADJ[r].filter(function (j) { return g.own[j] < 0; }).length + Math.random(); if (s > bs) { bs = s; best = r; } });
      return { a: 'claim', r: best };
    }
    if (g.phase !== 'q' || P.ans) return null;
    var Q = D.Q[g.q];
    if (Q.k === 'c') return { a: 'answer', i: Math.random() < .62 ? 0 : 1 + Math.floor(Math.random() * 3) };
    var noise = (Math.random() * 2 - 1) * .25;
    return { a: 'answer', v: Math.round(Q.v * (1 + noise)) };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = CQBot;
