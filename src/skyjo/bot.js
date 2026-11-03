/* ===== Skyjo: giocatori automatici =====
   Valutano ogni mossa possibile stimando il punteggio della griglia (una carta coperta vale in media ~5),
   con un premio per le colonne che si chiudono o si avvicinano a chiudersi. Evitano di chiudere la manche
   quando rischierebbero il raddoppio, e nell'ultimo turno pensano solo al punteggio finale. */
var SKBot = (function () {
  var E = (typeof SKEngine !== 'undefined') ? SKEngine : require('./engine.js');
  var M = E.MEAN;
  function copy(grid) { return grid.map(function (x) { return x ? { v: x.v, up: x.up } : null; }); }
  // punteggio atteso di una griglia, togliendo le colonne di tre carte scoperte uguali
  function est(grid) {
    var g = copy(grid), s = 0, c, i;
    for (c = 0; c < 4; c++) { var a = g[c], b = g[c + 4], d = g[c + 8]; if (a && b && d && a.up && b.up && d.up && a.v === b.v && b.v === d.v) { g[c] = g[c + 4] = g[c + 8] = null; } }
    for (i = 0; i < 12; i++) if (g[i]) s += g[i].up ? g[i].v : M;
    return s;
  }
  // piccolo premio per le coppie uguali scoperte in una colonna con la terza ancora da sistemare
  function shape(grid) {
    var b = 0;
    for (var c = 0; c < 4; c++) {
      var cs = [grid[c], grid[c + 4], grid[c + 8]].filter(function (x) { return x && x.up; });
      if (cs.length === 2 && cs[0].v === cs[1].v && cs[0].v > 0 && [grid[c], grid[c + 4], grid[c + 8]].every(Boolean)) b += Math.min(4, cs[0].v * .35);
    }
    return b;
  }
  function hiddenN(grid) { return grid.filter(function (x) { return x && !x.up; }).length; }
  function place(grid, i, v) { var g = copy(grid); g[i] = { v: v, up: true }; return g; }
  function flip(grid, i) { var g = copy(grid); g[i] = { v: M, up: true }; return g; }   // il valore non si conosce: si conta la media
  // stima di come chiuderanno gli altri (contando che giocheranno ancora un turno)
  function rivalsBest(g, p) {
    var b = Infinity;
    g.players.forEach(function (P, i) { if (i !== p) b = Math.min(b, est(P.grid) - 2.5); });
    return b;
  }
  // quanto «costa» una griglia: punteggio atteso, rischio di chiudere male, premio per le colonne quasi fatte
  function cost(g, p, grid) {
    var s = est(grid), last = g.ender != null;
    if (last) return s;   // ultimo turno: conta solo il punteggio finale
    var c = s - shape(grid);
    if (hiddenN(grid) === 0) {   // questa mossa chiude la manche
      var r = rivalsBest(g, p);
      if (s > 0 && s > r - 3) c += s + 6;        // rischio di raddoppio
      else c -= Math.min(5, (r - s) / 2);        // chiudere in vantaggio conviene
    } else if (hiddenN(grid) === 1) {
      c += 0.4;   // lasciarsi una sola carta coperta è comodo, ma non troppo
    }
    return c;
  }
  function options(g, p, v) {   // dove mettere la carta v (o scartarla scoprendo una coperta)
    var P = g.players[p], out = [];
    P.grid.forEach(function (x, i) { if (x) out.push({ a: 'place', i: i, c: cost(g, p, place(P.grid, i, v)) }); });
    return out.sort(function (a, b) { return a.c - b.c; });
  }
  function flipChoice(g, p) {
    var P = g.players[p], best = null;
    P.grid.forEach(function (x, i) {
      if (!x || x.up) return;
      // meglio scoprire in una colonna dove le carte scoperte sono uguali (potrebbe chiudersi), e la stima
      var col = E.colCells(i % 4).map(function (k) { return P.grid[k]; }).filter(function (y) { return y && y.up; });
      var pair = col.length === 2 && col[0].v === col[1].v ? -1 : 0;
      var c = cost(g, p, flip(P.grid, i)) + pair + Math.random() * .3;
      if (!best || c < best.c) best = { i: i, c: c };
    });
    return best;
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'reveal') {
      if (E.flips(P) >= 2) return null;
      var hid = P.grid.map(function (x, i) { return x && !x.up ? i : -1; }).filter(function (i) { return i >= 0; });
      // la seconda in un'altra colonna
      var up = P.grid.map(function (x, i) { return x && x.up ? i % 4 : -1; }).filter(function (c) { return c >= 0; });
      var pool = hid.filter(function (i) { return up.indexOf(i % 4) < 0; }); if (!pool.length) pool = hid;
      return { a: 'flip', i: pool[Math.floor(Math.random() * pool.length)] };
    }
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    var now = cost(g, p, P.grid);
    if (!g.drawn) {
      var top = g.disc[g.disc.length - 1];
      if (top != null) {
        var o = options(g, p, top)[0];
        // prende dagli scarti se migliora di almeno un paio di punti (sicuro, la carta si conosce)
        if (o && now - o.c >= (top <= 0 ? 0.5 : top <= 3 ? 1.5 : 2.5)) return { a: 'take', i: o.i };
      }
      return { a: 'draw' };
    }
    var v = g.drawn.v, best = options(g, p, v)[0], fl = hiddenN(P.grid) ? flipChoice(g, p) : null;
    if (g.drawn.from === 'deck' && fl && (!best || fl.c <= best.c - .2)) return { a: 'drop', i: fl.i };
    return { a: 'swap', i: best.i };
  }
  return { decide: decide, est: est };
})();
if (typeof module !== 'undefined') module.exports = SKBot;
