/* ===== Skyjo: giocatori automatici =====
   Valutano ogni mossa possibile stimando il punteggio della griglia (una carta coperta vale in media ~5),
   con un premio per le colonne che si chiudono o si avvicinano a chiudersi. Evitano di chiudere la manche
   quando rischierebbero il raddoppio, e nell'ultimo turno pensano solo al punteggio finale.
   In Skyjo Action usano le carte Azione quando conviene e se ne liberano prima della fine della manche. */
var SKBot = (function () {
  var E = (typeof SKEngine !== 'undefined') ? SKEngine : require('./engine.js');
  var M = E.MEAN, STAR = E.STAR;
  function copy(grid) { return grid.map(function (x) { return x ? { v: x.v, up: x.up } : null; }); }
  function sweep(g, cells) {   // toglie dalla copia le file complete (stelle jolly)
    var v = E.same(cells.map(function (i) { return g[i]; }));
    if (v != null) cells.forEach(function (i) { g[i] = null; });
    return v;
  }
  // punteggio atteso di una griglia, togliendo colonne (e in Action righe) di carte scoperte uguali
  // o = { action, known: {casella: valore} } (carte coperte già sbirciate)
  function est(grid, o) {
    o = o || {};
    var g = copy(grid), s = 0, c, i, r;
    if (o.known) for (i in o.known) if (g[i] && !g[i].up) g[i] = { v: o.known[i], up: true, k: 1 };
    for (c = 0; c < 4; c++) { var v = sweep(g, E.colCells(c)); if (v === STAR) s -= 10; }
    if (o.action) for (r = 0; r < 3; r++) { var w = sweep(g, E.rowCells(r)); if (w === STAR) s -= 15; }
    for (i = 0; i < 12; i++) if (g[i]) s += g[i].up ? E.val(g[i].v) : M;
    return s;
  }
  // piccolo premio per le coppie uguali scoperte in una colonna con la terza ancora da sistemare
  function shape(grid) {
    var b = 0;
    for (var c = 0; c < 4; c++) {
      var all = [grid[c], grid[c + 4], grid[c + 8]];
      if (!all.every(Boolean)) continue;
      var cs = all.filter(function (x) { return x.up && x.v !== STAR; }), st = all.filter(function (x) { return x.up && x.v === STAR; }).length;
      if (cs.length + st === 2 && (cs.length < 2 || cs[0].v === cs[1].v)) { var v = cs.length ? cs[0].v : 6; if (v > 0) b += Math.min(4, v * .35); }
    }
    return b;
  }
  function hiddenN(grid) { return grid.filter(function (x) { return x && !x.up; }).length; }
  function place(grid, i, v) { var g = copy(grid); g[i] = { v: v, up: true }; return g; }
  function flip(grid, i) { var g = copy(grid); g[i] = { v: M, up: true }; return g; }   // il valore non si conosce: si conta la media
  function known(g, p) {   // carte coperte proprie già sbirciate (se sono ancora lì)
    var P = g.players[p], k = {};
    (P.seen || []).forEach(function (s) { var x = P.grid[s.i]; if (s.t === p && x && !x.up && x.v === s.v) k[s.i] = s.v; });
    return k;
  }
  function opt(g, p) { return { action: g.opts && g.opts.action, known: known(g, p) }; }
  // stima di come chiuderanno gli altri (contando che giocheranno ancora un turno)
  function rivalsBest(g, p) {
    var b = Infinity;
    g.players.forEach(function (P, i) { if (i !== p && !P.out) b = Math.min(b, est(P.grid, { action: g.opts.action }) + (P.acts ? P.acts.length * 10 : 0) - 2.5); });
    return b;
  }
  // quanto «costa» una griglia: punteggio atteso, rischio di chiudere male, premio per le colonne quasi fatte
  function cost(g, p, grid) {
    var o = opt(g, p), s = est(grid, o) + (g.players[p].acts ? g.players[p].acts.length * 10 : 0) + (g.players[p].rb || 0), last = g.ender != null;
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
    var P = g.players[p], best = null, kn = known(g, p);
    P.grid.forEach(function (x, i) {
      if (!x || x.up) return;
      // meglio scoprire in una colonna dove le carte scoperte sono uguali (potrebbe chiudersi), e la stima
      var colv = E.colCells(i % 4).map(function (k) { return P.grid[k]; }).filter(function (y) { return y && y.up; });
      var pair = colv.length === 2 && colv[0].v === colv[1].v ? -1 : 0;
      var ng = kn[i] != null ? place(P.grid, i, kn[i]) : flip(P.grid, i);
      var c = cost(g, p, ng) + pair + Math.random() * .3;
      if (!best || c < best.c) best = { i: i, c: c };
    });
    return best;
  }

  /* ---------- carte Azione ---------- */
  var PREF = ['two', 'exch', 'draw3', 'swap2', 'rmall', 'steal', 'redo', 'prot', 'look'];
  function bonus(g, p) {
    var P = g.players[p], hid = hiddenN(P.grid);
    if ((g.phase === 'play' && hid <= 3) || P.acts.length >= 3) return { a: 'bonus', r: 'skip' };
    var best = -1, br = null;
    g.arow.forEach(function (k, r) { if (k == null) return; var s = PREF.length - PREF.indexOf(k); if (s > best) { best = s; br = r; } });
    if (br == null || best < PREF.length - 4) return { a: 'bonus', r: g.adeck.length || g.adisc.length ? 'deck' : br == null ? 'skip' : br };
    return { a: 'bonus', r: br };
  }
  function cellVal(g, p, q, i) { var x = g.players[q].grid[i]; if (!x) return null; if (x.up) return E.val(x.v); if (q === p) { var k = known(g, p)[i]; if (k != null) return E.val(k); } return null; }
  function bestExch(g, p) {
    var P = g.players[p], now = cost(g, p, P.grid), best = null;
    g.players.forEach(function (Q, q) {
      if (q === p || Q.out || Q.acts.some(function (c) { return c.k === 'prot'; })) return;
      Q.grid.forEach(function (y, j) {
        if (!y || !y.up) return;
        P.grid.forEach(function (x, i) {
          if (!x) return;
          var ng = copy(P.grid); ng[i] = { v: y.v, up: true };
          var gain = now - cost(g, p, ng);
          var mine = cellVal(g, p, p, i); if (mine == null) mine = M;
          gain += Math.max(0, E.val(y.v) - mine) * 0;   // il danno all'avversario non conta molto
          if (!best || gain > best.gain) best = { gain: gain, a: { p1: p, i1: i, p2: q, i2: j } };
        });
      });
    });
    return best;
  }
  function bestSwap2(g, p) {
    var P = g.players[p], now = cost(g, p, P.grid), best = null, L = E.live(P);
    for (var a = 0; a < L.length; a++) for (var b = a + 1; b < L.length; b++) {
      var ng = copy(P.grid), t = ng[L[a]]; ng[L[a]] = ng[L[b]]; ng[L[b]] = t;
      var gain = now - cost(g, p, ng);
      if (!best || gain > best.gain) best = { gain: gain, a: { i1: L[a], i2: L[b] } };
    }
    return best;
  }
  function rmPicks(g, p) {
    var picks = [], dmg = 0;
    g.players.forEach(function (Q, q) {
      if (q === p || Q.out || Q.acts.some(function (c) { return c.k === 'prot'; })) return;
      var low = null;
      Q.grid.forEach(function (y, i) { if (y && y.up && (!low || E.val(y.v) < low.v)) low = { i: i, v: E.val(y.v) }; });
      var aj = -1; Q.acts.forEach(function (c, j) { if (aj < 0 && ['two', 'exch', 'draw3'].indexOf(c.k) >= 0) aj = j; });
      if (low && low.v <= 1) { picks.push({ p: q, i: low.i }); dmg += M - low.v; }
      else if (aj >= 0) { picks.push({ p: q, j: aj }); dmg += 4; }
      else if (low) { picks.push({ p: q, i: low.i }); dmg += Math.max(0, M - low.v); }
      else if (Q.acts.length) picks.push({ p: q, j: 0 });
      else { var h = E.live(Q)[0]; if (h != null) picks.push({ p: q, i: h }); }
    });
    return { picks: picks, dmg: dmg };
  }
  function lookLine(g, p) {
    var P = g.players[p], kn = known(g, p), best = null;
    for (var c = 0; c < 4; c++) { var n = E.colCells(c).filter(function (i) { return P.grid[i] && !P.grid[i].up && kn[i] == null; }).length; if (!best || n > best.n) best = { n: n, a: { t: p, col: c } }; }
    for (var r = 0; r < 3; r++) { var m = E.rowCells(r).filter(function (i) { return P.grid[i] && !P.grid[i].up && kn[i] == null; }).length; if (m > best.n) best = { n: m, a: { t: p, row: r } }; }
    return best;
  }
  var AUTO = ['two', 'prot', 'draw3'];
  function useAction(g, p) {
    var P = g.players[p], hid = hiddenN(P.grid), have = {};
    P.acts.forEach(function (c, j) { if (E.usable(g, P, j) && have[c.k] == null) have[c.k] = j; });
    function use(k, extra) { var a = { a: 'use', j: have[k] }; for (var x in extra || {}) a[x] = extra[x]; return a; }
    if (have.exch != null) { var ex = bestExch(g, p); if (ex && ex.gain >= (hid <= 2 ? 0.5 : 4)) return use('exch', ex.a); }
    if (have.swap2 != null) { var sw = bestSwap2(g, p); if (sw && sw.gain >= (hid <= 2 ? 0.5 : 3)) return use('swap2', sw.a); }
    if (have.two != null && hid >= 3) return use('two');
    if (have.steal != null) {
      var st = null;
      g.players.forEach(function (Q, q) { if (st || q === p || Q.out || Q.acts.some(function (c) { return c.k === 'prot'; })) return; Q.acts.forEach(function (c, j) { if (!st && AUTO.indexOf(c.k) >= 0) st = { t: q, tj: j }; }); });
      if (st) return use('steal', st);
    }
    if (have.redo != null) { var rj = -1; g.adisc.forEach(function (k, j) { if (rj < 0 && AUTO.indexOf(k) >= 0) rj = j; }); if (rj >= 0) return use('redo', { j2: rj }); }
    if (have.rmall != null) { var rm = rmPicks(g, p); if (rm.dmg >= (hid <= 2 ? 0 : 5)) return use('rmall', { picks: rm.picks }); }
    var top = g.disc[g.disc.length - 1];
    if (have.draw3 != null && (top == null || E.val(top) > 2)) return use('draw3');
    if (have.look != null && hid >= 4) { var lk = lookLine(g, p); if (lk && lk.n >= 2) return use('look', lk.a); }
    if (hid <= 2 && P.acts.length) {   // la manche sta per finire: meglio non restare con carte in mano (+10 l'una)
      if (have.prot != null) return use('prot');
      if (have.two != null) return use('two');
      if (have.draw3 != null) return use('draw3');
      var any = P.acts.map(function (c, j) { return j; }).filter(function (j) { return E.usable(g, P, j); })[0];
      if (any != null) return { a: 'toss', j: any };
    }
    return null;
  }
  function pick(g, p) {
    var cs = g.pick.cards, best = null;
    cs.forEach(function (v, c) { var o = options(g, p, v)[0]; if (o && (!best || o.c < best.c)) best = { c: c, i: o.i, cost: o.c }; });
    var fl = hiddenN(g.players[p].grid) ? flipChoice(g, p) : null;
    if (fl && (!best || fl.c <= best.cost - .2)) return { a: 'pick', c: -1, i: fl.i };
    return { a: 'pick', c: best.c, i: best.i };
  }
  function chain(g, p) {
    var k = g.chain.k;
    if (k === 'exch') { var ex = bestExch(g, p); if (ex) return { a: 'chain', p1: ex.a.p1, i1: ex.a.i1, p2: ex.a.p2, i2: ex.a.i2 }; }
    if (k === 'swap2') { var sw = bestSwap2(g, p); if (sw && sw.gain > 0) return { a: 'chain', i1: sw.a.i1, i2: sw.a.i2 }; }
    if (k === 'look') { var lk = lookLine(g, p); if (lk) { var a = { a: 'chain', t: p }; if (lk.a.row != null) a.row = lk.a.row; else a.col = lk.a.col; return a; } }
    if (k === 'rmall') return { a: 'chain', picks: rmPicks(g, p).picks };
    if (k === 'redo') { var rj = -1; g.adisc.forEach(function (x, j) { if (rj < 0 && AUTO.indexOf(x) >= 0) rj = j; }); if (rj >= 0) return { a: 'chain', j2: rj }; }
    return { a: 'chain', skip: true };
  }

  function decide(g, p) {
    var P = g.players[p];
    if (P.out) return null;
    if (g.phase === 'reveal') {
      if (P.bonus) return bonus(g, p);
      if (E.flips(P) >= 2) return null;
      var hid = P.grid.map(function (x, i) { return x && !x.up ? i : -1; }).filter(function (i) { return i >= 0; });
      // la seconda in un'altra colonna
      var up = P.grid.map(function (x, i) { return x && x.up ? i % 4 : -1; }).filter(function (c) { return c >= 0; });
      var pool = hid.filter(function (i) { return up.indexOf(i % 4) < 0; }); if (!pool.length) pool = hid;
      return { a: 'flip', i: pool[Math.floor(Math.random() * pool.length)] };
    }
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    if (P.bonus) return bonus(g, p);
    if (g.chain) return chain(g, p);
    if (g.pick) return pick(g, p);
    var now = cost(g, p, P.grid);
    if (!g.drawn) {
      var top = g.disc[g.disc.length - 1];
      var takeIt = null;
      if (top != null) {
        var o = options(g, p, top)[0], tv = E.val(top);
        // prende dagli scarti se migliora di almeno un paio di punti (sicuro, la carta si conosce)
        if (o && now - o.c >= (tv <= 0 ? 0.5 : tv <= 3 ? 1.5 : 2.5)) takeIt = { a: 'take', i: o.i, gain: now - o.c };
      }
      if (g.opts.action && g.ender == null && P.acts.length) {
        var ua = useAction(g, p);
        if (ua && !(takeIt && takeIt.gain >= 4 && ua.a === 'use' && ['draw3', 'look'].indexOf(P.acts[ua.j].k) >= 0)) return ua;
      }
      if (takeIt) return { a: 'take', i: takeIt.i };
      return { a: 'draw' };
    }
    var v = g.drawn.v, best = options(g, p, v)[0], fl = hiddenN(P.grid) ? flipChoice(g, p) : null;
    if (g.drawn.from === 'deck' && fl && (!best || fl.c <= best.c - .2)) return { a: 'drop', i: fl.i };
    return { a: 'swap', i: best.i };
  }
  return { decide: decide, est: est };
})();
if (typeof module !== 'undefined') module.exports = SKBot;
