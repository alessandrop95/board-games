/* ===== Prendi 6!: giocatori automatici =====
   Per ogni carta della mano stimano il rischio: in quale fila andrebbe, quanti posti restano prima della sesta
   e quante carte degli altri potrebbero finire in mezzo (più è grande il salto dall'ultima carta, più è
   rischioso). Una carta più bassa di tutte vale la fila più leggera da prendere. Quando devono scegliere
   la fila prendono quella con meno teste. */
var P6Bot = (function () {
  var E = (typeof P6Engine !== 'undefined') ? P6Engine : require('./engine.js');
  function cost(g, p, v) {
    var rows = g.rows, r = E.target(rows, v), others = g.players.length - 1;
    if (r == null) return Math.min.apply(null, rows.map(E.sum)) + .5;
    var row = rows[r], gap = v - E.last(row), free = 5 - row.length;
    if (free <= 0) {
      // la fila è piena: la prendo, a meno che qualcuno con una carta più bassa ci finisca prima
      var p0 = Math.min(1, others * gap / 104 * 1.2);
      return E.sum(row) * (1 - p0 * .6) + .3;
    }
    var pIn = Math.min(1, others * gap / 104 * 1.4);   // probabilità che qualcuno metta una carta prima di me in quella fila
    var c = free === 1 ? pIn * (E.sum(row) + 1.5) : free === 2 ? pIn * pIn * E.sum(row) * .6 : 0;
    return c + gap * .015 - (free >= 3 ? .2 : 0);
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase === 'choose') {
      if (g.chooser !== p) return null;
      var best = 0; g.rows.forEach(function (r, i) { if (E.sum(r) < E.sum(g.rows[best]) || (E.sum(r) === E.sum(g.rows[best]) && r.length > g.rows[best].length)) best = i; });
      return { a: 'row', r: best };
    }
    if (g.phase !== 'pick' || P.pick != null) return null;
    var choice = null;
    P.hand.forEach(function (v) { var c = cost(g, p, v) + Math.random() * .4 + E.bulls(v) * .05; if (!choice || c < choice.c) choice = { v: v, c: c }; });
    return { a: 'pick', v: choice.v };
  }
  return { decide: decide, cost: cost };
})();
if (typeof module !== 'undefined') module.exports = P6Bot;
