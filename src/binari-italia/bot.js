/* ===== Ticket to Ride Italy: giocatori automatici =====
   Pianificano i biglietti (anche verso i Paesi confinanti) con il percorso più economico, raccolgono i colori
   che servono e le carte Traghetto per il mare, conquistano prima le tratte a rischio, cercano di unire
   le proprie reti per il bonus delle regioni e chiudono la partita usando i vagoni rimasti. */
var BIBot = (function () {
  var D = BIData, E = BIEngine, R = D.routes, CC = D.CARD_COLORS;
  var CITIES = Object.keys(D.cities);

  // Costo di una tratta per il giocatore p: 0 se è sua, Infinity se non si può più prendere.
  function cost(g, p, r) {
    var o = g.claims[r.id];
    if (o === p) return 0;
    if (o != null) return Infinity;
    if (r.twin != null) { var t = g.claims[r.twin]; if (t === p || (t != null && g.nplayers <= 3)) return Infinity; }
    var w = r.ferry || 0, fc = Math.min(w, 2 * E.ferries(g.players[p]));
    return r.len + (w - fc) * 0.8 + fc * 0.2 + (r.col === 'X' ? 0 : 0.15);
  }
  // percorso più economico; un Paese confinante vale quanto il suo valico più comodo
  function shortest(g, p, a, b) {
    if (D.zones[a] || D.zones[b]) { var best = null; E.gatesOf(a).forEach(function (x) { E.gatesOf(b).forEach(function (y) { var s = shortest1(g, p, x, y); if (s && (!best || s.cost < best.cost)) best = s; }); }); return best; }
    return shortest1(g, p, a, b);
  }
  function shortest1(g, p, a, b) { // Dijkstra semplice: 53 nodi
    var dist = {}, prev = {}, done = {}; CITIES.forEach(function (c) { dist[c] = Infinity; }); dist[a] = 0;
    for (;;) {
      var u = null, best = Infinity;
      for (var i = 0; i < CITIES.length; i++) { var c = CITIES[i]; if (!done[c] && dist[c] < best) { best = dist[c]; u = c; } }
      if (u == null || u === b) break; done[u] = 1;
      E.ADJ[u].forEach(function (r) {
        var w = cost(g, p, r); if (w === Infinity) return;
        var v = r.a === u ? r.b : r.a;
        // tra due binari paralleli conta il più economico
        if (dist[u] + w < dist[v]) { dist[v] = dist[u] + w; prev[v] = r; }
      });
    }
    if (dist[b] === Infinity) return null;
    var path = [], c2 = b; while (c2 !== a) { var r2 = prev[c2]; path.push(r2); c2 = r2.a === c2 ? r2.b : r2.a; }
    return { cost: dist[b], routes: path };
  }
  function openTickets(g, p) { return g.players[p].tickets.filter(function (id) { var t = D.tickets[id]; return !E.connected(g, p, t.a, t.b); }); }
  // Tratte da prendere per completare i biglietti aperti (con il loro valore di priorità).
  function plan(g, p) {
    var need = {}, total = 0;
    openTickets(g, p).sort(function (a, b) { return D.tickets[b].v - D.tickets[a].v; }).forEach(function (id) {
      var t = D.tickets[id], sp = shortest(g, p, t.a, t.b); if (!sp) return;
      sp.routes.forEach(function (r) {
        if (g.claims[r.id] === p) return;
        if (!need[r.id]) { need[r.id] = { r: r, w: 0 }; total += r.len; }
        need[r.id].w += t.v / Math.max(1, sp.cost);
      });
    });
    return { list: Object.keys(need).map(function (k) { return need[k]; }), trains: total };
  }
  function alternatives(g, p, r) { // quante strade alternative ci sarebbero senza questa tratta (più è bassa, più è urgente)
    var o = g.claims[r.id]; g.claims[r.id] = -1;
    var sp = shortest(g, p, r.a, r.b); delete g.claims[r.id]; if (o != null) g.claims[r.id] = o;
    return sp ? sp.cost - r.len : 99;
  }
  function chooseOpt(g, p, r, opts, needCols) {
    // usa il colore che serve meno alle altre tratte del piano e il minimo di locomotive
    var best = null;
    opts.forEach(function (o) {
      var s = o.L * 3 + (o.F || 0) * 1.2 + (needCols[o.c] || 0) * 0.5 - (g.players[p].hand[o.c] || 0) * 0.1;
      if (!best || s < best.s) best = { s: s, o: o };
    });
    return best.o;
  }
  function needColors(g, p, pl) {
    var need = {};
    pl.list.forEach(function (x) { var c = x.r.col; if (c !== 'X') need[c] = (need[c] || 0) + x.r.len; });
    return need;
  }
  function deficit(g, p, pl) { // carte mancanti per colore (le grigie si coprono col colore più abbondante)
    var P = g.players[p], h = JSON.parse(JSON.stringify(P.hand)), miss = {}, greyNeed = 0;
    pl.list.slice().sort(function (a, b) { return b.r.len - a.r.len; }).forEach(function (x) {
      var r = x.r, n = r.len;
      if (r.col === 'X') { greyNeed += n; return; }
      var use = Math.min(h[r.col], n); h[r.col] -= use; n -= use;
      if (n > 0) miss[r.col] = (miss[r.col] || 0) + n;
    });
    var spare = 0; CC.forEach(function (c) { spare = Math.max(spare, h[c]); });
    return { miss: miss, grey: Math.max(0, greyNeed - spare) };
  }
  function scoreTickets(g, p, ids) { // costo extra in vagoni per completare i biglietti dati, insieme a quelli già tenuti
    var fake = JSON.parse(JSON.stringify(g)); fake.players[p].tickets = fake.players[p].tickets.concat(ids);
    return plan(fake, p).trains;
  }
  function keepChoice(g, p) {
    var P = g.players[p], offer = P.offer.slice(), min = Math.min(offer.length, g.stage === 'setup' ? D.START_KEEP : 1);
    var base = scoreTickets(g, p, []), trains = P.trains - 3;
    // prova tutte le combinazioni (al massimo 5 biglietti: 31 sottoinsiemi)
    var best = null;
    for (var m = 1; m < (1 << offer.length); m++) {
      var ids = offer.filter(function (_, i) { return m & (1 << i); }); if (ids.length < min) continue;
      var need = scoreTickets(g, p, ids), val = ids.reduce(function (s, id) { return s + D.tickets[id].v; }, 0);
      var risk = need > trains ? (need - trains) * 4 + val : 0;
      var s = val * 1.2 - (need - base) - risk - (g.last ? val * 2 : 0);
      if (!best || s > best.s) best = { s: s, ids: ids };
    }
    return best.ids;
  }
  function pickDraw(g, p, pl, second) {
    var P = g.players[p], d = deficit(g, p, pl), want = d.miss, total = 0;
    for (var k in want) total += want[k];
    var face = g.face, bestI = null, bestS = 0;
    face.forEach(function (c, i) {
      if (!c) return;
      var s = 0;
      if (c === 'L') { if (second) return; s = total + d.grey >= 4 ? 2.2 : 0.5; }
      else s = (want[c] ? 2 + want[c] * 0.3 : 0) + (d.grey > 0 && P.hand[c] >= 2 ? 1 : 0);
      if (s > bestS) { bestS = s; bestI = i; }
    });
    if (bestI != null && bestS >= 1) return { a: 'draw', i: bestI };
    if (g.deck.length || g.disc.length) return { a: 'draw', i: 'deck' };
    for (var j = 0; j < 5; j++) if (face[j] && !(second && face[j] === 'L')) return { a: 'draw', i: j };
    return null;
  }
  // carte Traghetto: servono se le onde delle tratte del piano superano locomotive e traghetti in mano
  function wantFerry(g, p, pl) {
    if (E.canFerry(g, p)) return false;
    var P = g.players[p], w = 0; pl.list.forEach(function (x) { w += x.r.ferry || 0; });
    return w > 0 && w > E.ferries(P) * 2 + P.hand.L;
  }
  // regioni nuove che una tratta porterebbe alla rete più grande (per il bonus a fine partita)
  function regionGain(g, p, r) {
    var before = E.networks(g, p).reduce(function (s, n) { return s + n.pts; }, 0);
    g.claims[r.id] = p; var after = E.networks(g, p).reduce(function (s, n) { return s + n.pts; }, 0); delete g.claims[r.id];
    return after - before;
  }
  function claimOf(g, p, r, o) { o = o || E.canClaim(g, p, r).opts[0]; return { a: 'claim', r: r.id, c: o.c, L: o.L, F: o.F || 0 }; }
  function bestAny(g, p) {
    var any = R.filter(function (r) { return E.canClaim(g, p, r).ok; });
    if (!any.length) return null;
    any.forEach(function (r) { r._s = D.SCORE[r.len] + regionGain(g, p, r) * 0.8; });
    return any.sort(function (a, b) { return b._s - a._s; })[0];
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.stage === 'setup' || g.stage === 'tickets') return { a: 'keep', ids: keepChoice(g, p) };
    if (g.turn !== p) return null;
    var pl = plan(g, p), nc = needColors(g, p, pl);
    if (g.stage === 'draw2') return pickDraw(g, p, pl, true) || { a: 'draw', i: 'deck' };
    // 1) tratte del piano che posso prendere: prima le più urgenti e le più lunghe
    var cand = pl.list.filter(function (x) { return E.canClaim(g, p, x.r).ok; });
    if (cand.length) {
      cand.forEach(function (x) { x.s = x.w * 2 + x.r.len * 0.6 + Math.max(0, 6 - alternatives(g, p, x.r)) * 0.8; });
      cand.sort(function (a, b) { return b.s - a.s; });
      var r = cand[0].r, o = chooseOpt(g, p, r, E.canClaim(g, p, r).opts, nc);
      // non sprecare locomotive su tratte brevi se il resto del piano ne ha bisogno, salvo pericolo
      if (!(o.L >= 2 && r.len <= 2 && pl.list.length > 3 && alternatives(g, p, r) > 2)) return claimOf(g, p, r, o);
    }
    if (pl.list.length && wantFerry(g, p, pl) && !g.last) return { a: 'ferry' };
    // 2) biglietti tutti fatti: altri biglietti se ci sono vagoni, altrimenti punti con le tratte lunghe
    if (!pl.list.length) {
      if (!g.last && P.trains >= 10 + 3 * g.nplayers && g.tdeck.length && P.tickets.length < 7) return { a: 'tickets' };
      var b1 = bestAny(g, p);
      if (b1 && (b1.len >= 3 || b1._s >= 4 || P.trains <= 6 || g.last)) return claimOf(g, p, b1);
    }
    // 3) ultimo giro o piano impossibile: meglio usare le carte che restano
    if (g.last || pl.trains > P.trains) {
      var b2 = bestAny(g, p); if (b2) return claimOf(g, p, b2);
    }
    // 4) pescare carte
    if (E.canDrawAny(g, false)) return pickDraw(g, p, pl, false) || { a: 'draw', i: 'deck' };
    if (g.tdeck.length) return { a: 'tickets' };
    var any3 = R.filter(function (r) { return E.canClaim(g, p, r).ok; });
    if (any3.length) return claimOf(g, p, any3[0]);
    if (!E.canFerry(g, p)) return { a: 'ferry' };
    return { a: 'pass' };
  }
  return { decide: decide, plan: plan, shortest: shortest, openTickets: openTickets };
})();
if (typeof module !== 'undefined') module.exports = BIBot;
