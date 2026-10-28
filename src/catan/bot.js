/* ===== Catan: giocatori automatici =====
   Ragionano in «puntini» (quante volte su 36 esce un numero): scelgono incroci ricchi e vari, puntano a città
   e colonie, usano porti e carte sviluppo, mettono il ladro su chi è in testa e commerciano quel che avanza.
   decide(g, p) dà una mossa alla volta; respond(g, p) dice se accettare la proposta di scambio in corso. */
var CTBot = (function () {
  var D = (typeof CTData !== 'undefined') ? CTData : require('./data.js');
  var E = (typeof CTEngine !== 'undefined') ? CTEngine : require('./engine.js');
  var RES = D.RES, V = D.verts, EDG = D.edges, HX = D.hexes;

  /* ---------- valutazioni ---------- */
  function income(g, p) {   // puntini per risorsa delle mie costruzioni
    var inc = { brick: 0, wood: 0, wool: 0, grain: 0, ore: 0 };
    for (var v in g.vown) { var o = g.vown[v]; if (o.p !== p) continue; V[v].hexes.forEach(function (h) { var T = g.hex[h], r = D.TERR[T.t].r; if (r && h !== g.robber) inc[r] += D.PIPS[T.n] * (o.city ? 2 : 1); }); }
    return inc;
  }
  function weights(g, p) {   // quanto mi serve ogni risorsa: di più quelle che produco poco
    var inc = income(g, p), early = E.vp(g, p) < 5, w = {};
    var base = early ? { brick: 1.25, wood: 1.25, wool: 0.85, grain: 1.05, ore: 0.85 } : { brick: 0.9, wood: 0.9, wool: 0.9, grain: 1.2, ore: 1.25 };
    RES.forEach(function (r) { w[r] = base[r] * (inc[r] ? 1 : 1.35) / (1 + inc[r] / 14); });
    return w;
  }
  function harborAt(g, v) { for (var i = 0; i < g.harbors.length; i++) { var e = EDG[g.harbors[i].e]; if (e.a === v || e.b === v) return g.harbors[i].k; } return null; }
  function vertexScore(g, p, v) {
    var w = weights(g, p), inc = income(g, p), s = 0, kinds = {};
    V[v].hexes.forEach(function (h) {
      var T = g.hex[h], r = D.TERR[T.t].r; if (!r) return;
      var pip = D.PIPS[T.n] * (h === g.robber ? 0.4 : 1);
      s += pip * w[r]; if (!inc[r] && !kinds[r]) s += 1.6; kinds[r] = 1;
    });
    var hb = harborAt(g, v);
    if (hb === '3') s += 1.2; else if (hb) s += inc[hb] >= 5 || kinds[hb] ? 2.2 : 0.6;
    return s;
  }
  function vpOf(g, q) { return E.visibleVP(g, q); }
  function leader(g, p) { var best = null, bv = -1; g.players.forEach(function (P, q) { if (q === p) return; var v = vpOf(g, q) + E.total(P.res) * 0.05; if (v > bv) { bv = v; best = q; } }); return best; }

  /* ---------- obiettivi ---------- */
  function freeEdgesNear(g, p) { return E.legalRoads(g, p); }
  // incrocio buono raggiungibile con poche strade: { v, roads:[edge…] } (ricerca in ampiezza sui lati liberi)
  function roadPlan(g, p) {
    var start = {}, prev = {}, q = [], best = null, bs = -1;
    for (var v in g.vown) if (g.vown[v].p === p) start[v] = 1;
    for (var e in g.eown) if (g.eown[e] === p) { start[EDG[e].a] = 1; start[EDG[e].b] = 1; }
    Object.keys(start).forEach(function (v) { v = +v; var o = E.owner(g, v); if (o == null || o === p) { prev[v] = null; q.push([v, 0]); } });
    while (q.length) {
      var cur = q.shift(), cv = cur[0], d = cur[1];
      if (d > 0 && E.distanceOk(g, cv)) { var sc = vertexScore(g, p, cv) - d * 1.4; if (sc > bs) { bs = sc; best = cv; } }
      if (d >= 3) continue;
      V[cv].edges.forEach(function (ed) {
        if (g.eown[ed] != null && g.eown[ed] !== p) return;
        var nx = EDG[ed].a === cv ? EDG[ed].b : EDG[ed].a; if (prev[nx] !== undefined) return;
        var o = E.owner(g, nx); if (o != null && o !== p) return;
        prev[nx] = { v: cv, e: ed }; q.push([nx, d + 1]);
      });
    }
    if (best == null) return null;
    var path = [], x = best; while (prev[x]) { if (g.eown[prev[x].e] == null) path.unshift(prev[x].e); x = prev[x].v; }
    return { v: best, roads: path, score: bs };
  }
  function missing(r, cost) { var m = {}, n = 0; for (var k in cost) { var x = Math.max(0, cost[k] - (r[k] || 0)); if (x) { m[k] = x; n += x; } } return { m: m, n: n }; }
  function goal(g, p) {   // il prossimo acquisto a cui punto
    var P = g.players[p];
    var settles = E.legalSettles(g, p, false), cities = E.legalCities(g, p);
    var opts = [];
    if (cities.length && P.pieces.city > 0) opts.push({ k: 'city', cost: D.COST.city, val: 9 });
    if (settles.length && P.pieces.settle > 0) opts.push({ k: 'settle', cost: D.COST.settle, val: 10, v: bestOf(settles, function (v) { return vertexScore(g, p, v); }) });
    if (!settles.length && P.pieces.settle > 0 && P.pieces.road > 0) { var rp = roadPlan(g, p); if (rp && rp.roads.length) opts.push({ k: 'road', cost: D.COST.road, val: 6 - rp.roads.length, e: rp.roads[0] }); }
    if (g.deck.length) opts.push({ k: 'dev', cost: D.COST.dev, val: 4.5 });
    opts.forEach(function (o) { o.miss = missing(P.res, o.cost).n; o.rank = o.val - o.miss * 2.2; });
    opts.sort(function (a, b) { return b.rank - a.rank; });
    return opts[0] || null;
  }
  function bestOf(list, f) { var b = null, bs = -1e9; list.forEach(function (x) { var s = f(x); if (s > bs) { bs = s; b = x; } }); return b; }

  /* ---------- fondazione ---------- */
  function setupMove(g, p) {
    var S = g.setup;
    if (S.step === 'settle') {
      var second = S.i >= g.players.length, cands = E.legalSettles(g, p, true);
      return { a: 'settle', v: bestOf(cands, function (v) { return vertexScore(g, p, v) + (second ? 0 : 0) + Math.random() * 0.3; }) };
    }
    var roads = E.legalRoads(g, p, S.last);
    return { a: 'road', e: bestOf(roads, function (e) {
      var o = EDG[e].a === S.last ? EDG[e].b : EDG[e].a, best = 0;
      V[o].adj.forEach(function (u) { if (u !== S.last && E.distanceOk(g, u)) best = Math.max(best, vertexScore(g, p, u)); });
      return best + Math.random() * 0.2;
    }) };
  }

  /* ---------- scarto ---------- */
  function discardMove(g, p) {
    var n = E.mustDiscard(g, p), P = g.players[p], r = JSON.parse(JSON.stringify(P.res)), out = {}, G0 = goal(g, p), keep = G0 ? G0.cost : {};
    for (var i = 0; i < n; i++) {
      var pick = bestOf(RES.filter(function (k) { return r[k] > 0; }), function (k) { return r[k] - (keep[k] || 0) * 1.5 + (k === 'wool' ? 0.3 : 0); });
      r[pick]--; out[pick] = (out[pick] || 0) + 1;
    }
    return { a: 'discard', res: out };
  }

  /* ---------- ladro ---------- */
  function robberMove(g, p) {
    var lead = leader(g, p);
    var h = bestOf(E.robberTargets(g, p), function (hi) {
      var T = g.hex[hi], pip = T.n ? D.PIPS[T.n] : 0, s = 0;
      HX[hi].v.forEach(function (v) { var o = g.vown[v]; if (!o) return; if (o.p === p) s -= 12 * (o.city ? 2 : 1); else s += pip * (o.city ? 2 : 1) * (1 + vpOf(g, o.p) / 4) * (o.p === lead ? 1.4 : 1) + (E.total(g.players[o.p].res) ? 2 : 0); });
      return s + Math.random() * 0.1;
    });
    return { a: 'robber', h: h };
  }
  function stealMove(g, p) { return { a: 'steal', from: bestOf(g.victims, function (q) { return vpOf(g, q) * 2 + E.total(g.players[q].res) * 0.3; }) }; }

  /* ---------- carte sviluppo ---------- */
  function devMove(g, p) {
    var P = g.players[p];
    function can(k) { return !E.canPlayDev(g, p, k); }
    // cavaliere: se il ladro mi blocca, o per prendere/tenere l'esercito
    if (can('knight')) {
      var blocked = HX[g.robber].v.some(function (v) { return g.vown[v] && g.vown[v].p === p; }) && g.hex[g.robber].n;
      var others = Math.max.apply(null, g.players.map(function (Q, q) { return q === p ? 0 : Q.knights; }));
      if (blocked || (P.knights + 1 >= 3 && P.knights + 1 > others && g.la !== p) || (g.stage === 'main' && Math.random() < 0.25)) return { a: 'play', k: 'knight' };
    }
    if (g.stage !== 'main') return null;
    var G0 = goal(g, p);
    if (can('mono')) {
      var best = bestOf(RES, function (r) { var n = 0; g.players.forEach(function (Q, q) { if (q !== p) n += Q.res[r]; }); return n * (G0 && G0.cost[r] ? 1.5 : 1); }), cnt = 0;
      g.players.forEach(function (Q, q) { if (q !== p) cnt += Q.res[best]; });
      if (cnt >= 4) return { a: 'play', k: 'mono', r: best };
    }
    if (can('plenty') && G0 && G0.miss > 0 && G0.miss <= 2) {
      var m = missing(P.res, G0.cost).m, rs = []; Object.keys(m).forEach(function (k) { for (var i = 0; i < m[k]; i++) rs.push(k); });
      while (rs.length < 2) rs.push(bestOf(RES, function (r) { return weights(g, p)[r]; }));
      if (rs.some(function (x) { return g.bank[x] > 0; })) return { a: 'play', k: 'plenty', rs: rs.slice(0, 2) };
    }
    if (can('road2') && P.pieces.road >= 2 && E.legalRoads(g, p).length && !E.legalSettles(g, p, false).length) return { a: 'play', k: 'road2' };
    return null;
  }

  /* ---------- turno ---------- */
  function bestRoad(g, p) {
    var rp = roadPlan(g, p), legal = E.legalRoads(g, p);
    if (rp && rp.roads.length && legal.indexOf(rp.roads[0]) >= 0) return rp.roads[0];
    // strada più lunga: allunga la mia rete
    return bestOf(legal, function (e) { var t = JSON.parse(JSON.stringify(g.eown)); t[e] = p; return E.roadLen({ eown: t, vown: g.vown, players: g.players }, p) + Math.random() * 0.3; });
  }
  function bankTrade(g, p, G0) {
    if (!G0) return null;
    var P = g.players[p], m = missing(P.res, G0.cost).m, need = Object.keys(m); if (!need.length) return null;
    var rt = E.rates(g, p), get = bestOf(need.filter(function (r) { return g.bank[r] > 0; }), function (r) { return m[r]; }); if (!get) return null;
    var give = bestOf(RES.filter(function (r) { return r !== get && P.res[r] - (G0.cost[r] || 0) >= rt[r]; }), function (r) { return P.res[r] - (G0.cost[r] || 0) - rt[r] * 0.5; });
    return give ? { a: 'bank', give: give, get: get } : null;
  }
  function offerTrade(g, p, G0) {
    if (!G0 || g.offers >= 1 || g.trade) return null;
    var P = g.players[p], m = missing(P.res, G0.cost); if (m.n !== 1) return null;
    var get = Object.keys(m.m)[0], give = bestOf(RES.filter(function (r) { return r !== get && P.res[r] - (G0.cost[r] || 0) >= 1; }), function (r) { return P.res[r] - (G0.cost[r] || 0); });
    if (!give) return null;
    var gv = {}, gt = {}; gv[give] = 1; gt[get] = 1; return { a: 'offer', give: gv, get: gt };
  }
  function mainMove(g, p, o) {
    var P = g.players[p];
    // proposta in corso: si chiude con il primo che accetta, altrimenti si aspetta un po' e poi si ritira
    if (g.trade) {
      var yes = Object.keys(g.trade.resp).filter(function (q) { return g.trade.resp[q] === 'yes'; }).map(Number);
      if (yes.length) return { a: 'deal', id: g.trade.id, with: bestOf(yes, function (q) { return -vpOf(g, q); }) };
      var all = g.players.every(function (Q, q) { return q === p || g.trade.resp[q]; });
      if (!all && o && o.patience) return null;
      return { a: 'cancel' };
    }
    var dv = devMove(g, p); if (dv) return dv;
    var cities = E.legalCities(g, p);
    if (cities.length && E.has(P.res, D.COST.city)) return { a: 'build', k: 'city', v: bestOf(cities, function (v) { return vertexScore(g, p, v); }) };
    var settles = E.legalSettles(g, p, false);
    if (settles.length && E.has(P.res, D.COST.settle)) return { a: 'build', k: 'settle', v: bestOf(settles, function (v) { return vertexScore(g, p, v); }) };
    var G0 = goal(g, p);
    var bt = bankTrade(g, p, G0); if (bt) return bt;
    var of = offerTrade(g, p, G0); if (of) return of;
    if (G0 && G0.k === 'road' && E.has(P.res, D.COST.road) && E.legalRoads(g, p).length) return { a: 'build', k: 'road', e: bestRoad(g, p) };
    if (E.has(P.res, D.COST.dev) && g.deck.length && (!G0 || G0.k === 'dev' || E.total(P.res) >= 7)) return { a: 'build', k: 'dev' };
    // troppe carte in mano (rischio col 7): si spende
    if (E.total(P.res) >= 8) {
      if (E.has(P.res, D.COST.road) && E.legalRoads(g, p).length && P.pieces.road > 0) return { a: 'build', k: 'road', e: bestRoad(g, p) };
      var dump = bankTrade(g, p, { cost: D.COST.city }) || bankTrade(g, p, { cost: D.COST.settle }); if (dump) return dump;
    }
    return { a: 'end' };
  }
  function decide(g, p, o) {
    if (g.phase !== 'play') return null;
    if (g.stage === 'setup') return E.decider(g) === p ? setupMove(g, p) : null;
    if (g.stage === 'discard') return E.mustDiscard(g, p) ? discardMove(g, p) : null;
    if (g.turn !== p) return null;
    if (g.stage === 'roll') return devMove(g, p) || { a: 'roll' };
    if (g.stage === 'robber') return robberMove(g, p);
    if (g.stage === 'steal') return stealMove(g, p);
    if (g.stage === 'road2') { var e = E.legalRoads(g, p).length ? bestRoad(g, p) : null; return e != null ? { a: 'build', k: 'road', e: e } : { a: 'endroads' }; }
    if (g.stage === 'main') return mainMove(g, p, o);
    return null;
  }
  // risposta a una proposta: sì se mi dà quello che mi manca e prende quello che mi avanza (e chi propone non sta vincendo)
  function respond(g, p) {
    var T = g.trade; if (!T || p === g.turn || T.resp[p]) return null;
    var P = g.players[p]; if (!E.has(P.res, T.get)) return { a: 'respond', id: T.id, ok: false };
    if (vpOf(g, g.turn) >= g.opts.vp - 2) return { a: 'respond', id: T.id, ok: false };
    var G0 = goal(g, p), cost = G0 ? G0.cost : {}, w = weights(g, p), gain = 0, loss = 0;
    for (var k in T.give) gain += T.give[k] * w[k] * (missing(P.res, cost).m[k] ? 1.8 : 1);
    for (var k2 in T.get) loss += T.get[k2] * w[k2] * ((cost[k2] || 0) >= P.res[k2] ? 1.8 : 1);
    return { a: 'respond', id: T.id, ok: gain > loss * 1.05 };
  }
  return { decide: decide, respond: respond, vertexScore: vertexScore, income: income, goal: goal, roadPlan: roadPlan };
})();
if (typeof module !== 'undefined') module.exports = CTBot;
