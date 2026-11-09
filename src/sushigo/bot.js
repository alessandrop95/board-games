/* ===== Sushi Go!: giocatori automatici =====
   Danno a ogni carta un valore atteso secondo quello che hanno già sul tavolo e quanti turni restano
   (un Sashimi vale tanto se ne mancano pochi per il tris e c'è tempo, una Tempura se completa la coppia,
   un Wasabi solo se arriveranno ancora Nigiri…), guardano la gara dei Maki con gli altri e i budini.
   Usano le Bacchette quando due carte buone valgono più di una. */
var SGBot = (function () {
  var E = (typeof SGEngine !== 'undefined') ? SGEngine : require('./engine.js');
  function value(g, p, k, extra) {
    var P = g.players[p], T = P.table.concat((extra || []).map(function (x) { return { k: x }; }));
    var left = P.hand.length - 1 - (extra ? extra.length : 0), n = g.players.length;
    switch (k) {
      case 'tem': return E.count(T, 'tem') % 2 === 1 ? 5 : left >= 1 ? 2.4 : 0;
      case 'sas': { var s = E.count(T, 'sas') % 3; return s === 2 ? 10 : s === 1 ? (left >= 1 ? 4.2 : 0) : (left >= 2 ? 2.6 : 0); }
      case 'dum': { var d = Math.min(5, E.count(T, 'dum')); return E.DUMP[Math.min(5, d + 1)] - E.DUMP[d] + (d < 4 && left >= 1 ? .6 : 0); }
      case 'mk1': case 'mk2': case 'mk3': {
        var mine = E.makiOf(T), best = 0; g.players.forEach(function (Q, q) { if (q !== p) best = Math.max(best, E.makiOf(Q.table)); });
        var v = E.MAKI[k] * 1.3; if (mine + E.MAKI[k] > best && mine <= best) v += 2; return v;
      }
      case 'nsa': case 'nsq': case 'neg': return E.NIGIRI[k] * (E.freeWasabi(T) >= 0 ? 3 : 1);
      case 'was': return left >= 3 ? 4 : left >= 2 ? 2.5 : .5;
      case 'cho': return left >= 4 ? 2.2 : left >= 2 ? .8 : 0;
      case 'pud': return (g.round === 3 ? 3.5 : 2.6) + (P.pud <= Math.min.apply(null, g.players.map(function (Q) { return Q.pud; })) ? 1 : 0);
    }
    return 0;
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'pick' || P.pick) return null;
    var vals = P.hand.map(function (k, i) { return { i: i, k: k, v: value(g, p, k) + Math.random() * .3 }; }).sort(function (a, b) { return b.v - a.v; });
    var best = vals[0];
    if (E.hasCho(P) && P.hand.length >= 2) {
      var second = null;
      P.hand.forEach(function (k, i) { if (i === best.i) return; var v = value(g, p, k, [best.k]); if (!second || v > second.v) second = { i: i, v: v }; });
      if (second && second.v >= 3) return { a: 'pick', cards: [best.i, second.i] };
    }
    return { a: 'pick', cards: [best.i] };
  }
  return { decide: decide, value: value };
})();
if (typeof module !== 'undefined') module.exports = SGBot;
