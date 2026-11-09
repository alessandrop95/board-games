/* ===== Cabo: giocatori automatici =====
   Ricordano solo quello che hanno visto davvero (le due carte iniziali, quelle pescate, sbirciate o spiate e le
   carte scoperte): una carta che non conoscono vale in media 6,5. Tengono le carte basse, cercano di scartare
   insieme le carte uguali che conoscono, usano i poteri (sbirciano le proprie carte, spiano chi sembra messo
   meglio, scambiano le loro carte alte con quelle basse degli altri) e chiamano Cabo quando pensano di avere
   il punteggio più basso del tavolo. */
var CBBot = (function () {
  var E = (typeof CBEngine !== 'undefined') ? CBEngine : require('./engine.js');
  var M = E.MEAN;
  function val(g, p, q, i) { var c = g.players[q].line[i]; if (!c) return null; return E.knows(g.players[p], c) ? c.v : null; }
  // quanto pensa di avere in mano il giocatore q, secondo quello che sa p
  function est(g, p, q) { var s = 0; g.players[q].line.forEach(function (c, i) { var v = val(g, p, q, i); s += v == null ? M : v; }); return s; }
  function unknown(g, p, q) { var n = 0; g.players[q].line.forEach(function (c, i) { if (val(g, p, q, i) == null) n++; }); return n; }
  // la mossa migliore con la carta v: quali carte della mia fila scambiare (anche più carte uguali che conosco)
  function bestExchange(g, p, v) {
    var P = g.players[p], best = null, groups = {};
    P.line.forEach(function (c, i) {
      var k = val(g, p, p, i), cur = k == null ? M : k;
      // carte che non conosco: si cambiano solo con una carta bassa (rischio)
      var gain = cur - v - (k == null ? 1.2 : 0);
      if (!best || gain > best.gain) best = { gain: gain, cells: [i] };
      if (k != null) (groups[k] = groups[k] || []).push(i);
    });
    Object.keys(groups).forEach(function (k) {
      var cs = groups[k]; if (cs.length < 2) return;
      var gain = cs.length * +k - v + (cs.length - 1) * 1.5;   // meno carte in fila = meno rischio
      if (gain > best.gain) best = { gain: gain, cells: cs };
    });
    return best;
  }
  function rivalsBest(g, p) { var b = Infinity; g.players.forEach(function (Q, q) { if (q !== p) b = Math.min(b, est(g, p, q) - 2); }); return b; }
  function shouldCabo(g, p) {
    if (g.caller != null || g.drawn) return false;
    var mine = est(g, p, p), unk = unknown(g, p, p), riv = rivalsBest(g, p);
    if (unk > 1) return false;
    if (mine <= 4) return true;
    return mine <= 12 && mine + unk * 2 < riv - 1 - (g.players.length - 2) * .8;
  }
  function usePower(g, p) {
    var k = g.power.k, P = g.players[p];
    if (k === 'peek') {
      var h = -1; P.line.forEach(function (c, i) { if (h < 0 && val(g, p, p, i) == null) h = i; });
      return h >= 0 ? { a: 'peek', i: h } : { a: 'skip' };
    }
    if (k === 'spy') {
      // spia chi sembra messo meglio, su una carta che non conosce
      var opp = g.players.map(function (Q, q) { return q; }).filter(function (q) { return q !== p; }).sort(function (a, b) { return est(g, p, a) - est(g, p, b); });
      for (var x = 0; x < opp.length; x++) { var t = opp[x], j = -1; g.players[t].line.forEach(function (c, i) { if (j < 0 && val(g, p, t, i) == null) j = i; }); if (j >= 0) return { a: 'spy', t: t, j: j }; }
      return { a: 'skip' };
    }
    // swap: la mia carta più alta (o una che non conosco) con una carta bassa che conosco di un altro
    var hi = -1, hv = -1;
    P.line.forEach(function (c, i) { var v = val(g, p, p, i); var e = v == null ? M + .5 : v; if (e > hv) { hv = e; hi = i; } });
    var lo = null;
    g.players.forEach(function (Q, q) { if (q === p) return; Q.line.forEach(function (c, j) { var v = val(g, p, q, j); if (v != null && (!lo || v < lo.v)) lo = { t: q, j: j, v: v }; }); });
    if (lo && hv - lo.v >= 3) return { a: 'trade', i: hi, t: lo.t, j: lo.j };
    if (hv >= 10) {   // carta molto alta: meglio una carta a caso di chi sta andando meglio
      var tt = -1, te = Infinity; g.players.forEach(function (Q, q) { if (q !== p) { var e = est(g, p, q); if (e < te) { te = e; tt = q; } } });
      var jj = -1; g.players[tt].line.forEach(function (c, j) { if (jj < 0 && val(g, p, tt, j) == null) jj = j; });
      if (jj >= 0) return { a: 'trade', i: hi, t: tt, j: jj };
    }
    return { a: 'skip' };
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'peek') {
      if (P.looks >= 2) return null;
      var free = P.line.map(function (c, i) { return i; }).filter(function (i) { return !P.know[P.line[i].id]; });
      return { a: 'look', i: free[Math.floor(Math.random() * free.length)] };
    }
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    if (g.power) return usePower(g, p);
    if (!g.drawn) {
      if (shouldCabo(g, p)) return { a: 'cabo' };
      var top = g.disc[g.disc.length - 1];
      if (top) { var b = bestExchange(g, p, top.v); if (b && b.gain >= (top.v <= 2 ? 1 : 3)) return { a: 'take', cells: b.cells }; }
      return { a: 'draw' };
    }
    var v = g.drawn.v, ex = bestExchange(g, p, v), pw = E.power(v);
    // un potere utile vale circa un paio di punti
    var keep = ex && ex.gain >= (pw ? 2.5 : 0.5);
    if (keep) return { a: 'swap', cells: ex.cells };
    return { a: 'discard' };
  }
  return { decide: decide, est: est };
})();
if (typeof module !== 'undefined') module.exports = CBBot;
