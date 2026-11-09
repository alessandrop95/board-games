/* ===== No Grazie!: giocatori automatici =====
   Valutano quanto costa davvero prendere la carta (i punti che aggiunge alle loro scale, meno i gettoni
   che ci sono sopra) e quanto valgono i gettoni che restano loro: con pochi gettoni prendono prima.
   Se la carta allunga una loro scala e non serve a nessun altro, la lasciano girare per raccogliere
   qualche gettone in più («la fanno pagare»). Con i gettoni nascosti contano solo su quello che vedono. */
var NGBot = (function () {
  var E = (typeof NGEngine !== 'undefined') ? NGEngine : require('./engine.js');
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    if (P.chips <= 0) return { a: 'take' };
    var v = g.cur, pot = g.pot, m = E.marginal(P.cards, v), n = g.players.length;
    var cost = m - pot;
    // la carta serve anche a qualcun altro? (allunga una sua scala)
    var others = g.players.some(function (Q, q) { return q !== p && E.marginal(Q.cards, v) < v * .5; });
    // carta che mi allunga una scala: la prendo, oppure la lascio girare se non interessa a nessuno
    if (m <= 1) {
      if (others || pot >= n - 1 || P.chips <= 2) return { a: 'take' };
      return Math.random() < .75 ? { a: 'pass' } : { a: 'take' };
    }
    // carta alta: quanto sono disposto a pagare per evitarla dipende dai gettoni che ho
    var reserve = P.chips, threshold = reserve >= 9 ? 4 : reserve >= 6 ? 7 : reserve >= 3 ? 11 : 16;
    if (m <= 6 && pot >= 1) threshold += 2;
    // a fine mazzo i gettoni contano meno
    if (g.deck.length <= 4) threshold += 3;
    if (cost <= threshold) return { a: 'take' };
    return { a: 'pass' };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = NGBot;
