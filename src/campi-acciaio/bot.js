/* ===== Campi d'Acciaio: giocatori automatici =====
   Per ogni colonna della plancia provano le azioni possibili sul motore vero (su una copia dello stato)
   e scelgono quella che porta al punteggio stimato migliore. Così non possono mai fare mosse illegali. */
var CABot = (function () {
  var D = CAData, E = CAEngine;
  function clone(g) { return JSON.parse(JSON.stringify(g)); }
  function tryAct(g, p, a) { var s = clone(g); var err = E.act(s, p, a); return err ? null : s; }

  /* ---------- quanto vale una posizione per il giocatore p ---------- */
  function value(g, p) {
    var P = g.players[p];
    if (g.phase === 'over' && g.final) { var me = g.final.filter(function (x) { return x.p === p; })[0]; return me.total * 3 + (g.winner === p ? 40 : 0); }
    var ctrl = E.controlled(g, p), t = E.resTotals(g, p), res = t.f + t.m + t.w + t.o;
    var v = P.coins;
    v += P.stars.length * 9;
    v += P.pop * 0.55 + (P.pop >= 7 ? 3 : 0) + (P.pop >= 13 ? 4 : 0);
    v += ctrl.length * 1.4 + (ctrl.indexOf(E.FACTORY_HEX) >= 0 ? 2 : 0);
    v += Math.min(res, 16) * 0.5;
    var W = E.workersOnBoard(g, p); v += Math.min(W, 8) * 1.9;
    v += P.mechs.length * 4.4 + E.structCount(P) * 3 + E.upCount(P) * 3.3 + P.recruits.length * 3.3;
    v += Math.min(P.power, 12) * 0.35 + Math.min(P.hand.length, 6) * 0.8;
    if (P.fcard != null) v += 3.5;
    // non lasciare scoperte risorse in territori senza unità
    // varietà di risorse utili per le azioni in basso
    D.BOTTOM.forEach(function (b, col) { var need = E.bottomCost(g, p, col), left = [6 - E.upCount(P), 4 - P.mechs.length, 4 - E.structCount(P), 4 - P.recruits.length][col]; if (left > 0) v += Math.min(t[b.res], need) / need * 1.6; });
    // personaggio vicino a incontri o alla Fabbrica
    var h = E.hero(g, p);
    if (h && P.fcard == null && E.isTerr(h.h)) v -= dist(g, p, h.h, E.FACTORY_HEX) * 0.4;
    return v;
  }
  function dist(g, p, a, b) {
    if (a === b) return 0;
    var seen = {}, fr = [a], d = 0; seen[a] = 1;
    while (fr.length && d < 8) {
      d++; var nx = [];
      fr.forEach(function (k) { E.NB[k].forEach(function (n) { if (seen[n.k] || E.HEX[n.k].t === 'H') return; seen[n.k] = 1; if (n.k === b) nx.found = true; nx.push(n.k); }); });
      if (nx.found) return d; fr = nx;
    }
    return 8;
  }

  /* ---------- battaglia ---------- */
  function combatChoice(g, p) {
    var c = g.pend, side = c.a === p ? 'a' : 'd', op = side === 'a' ? c.d : c.a, P = g.players[p], O = g.players[op];
    var dial = E.maxDial(g, p), nCards = E.maxCards(g, p, c.h);
    var cards = P.hand.slice().sort(function (x, y) { return y - x; }).slice(0, nCards);
    var myMax = dial + cards.reduce(function (s, v) { return s + v; }, 0);
    var oCards = E.maxCards(g, op, c.h), oEst = Math.min(7, O.power) * 0.85 + oCards * 3.2;
    var need = Math.ceil(side === 'a' ? oEst : oEst + 1);
    if (myMax < need - 1) return { a: 'combat', power: 0, cards: [] };   // inutile sprecare: si perde comunque
    // usa prima le carte, poi il potere che serve
    var use = [], sum = 0;
    for (var i = 0; i < cards.length && sum < need; i++) { use.push(cards[i]); sum += cards[i]; }
    var pw = Math.max(0, Math.min(dial, need - sum + (Math.random() < 0.5 ? 1 : 0)));
    return { a: 'combat', power: pw, cards: use };
  }
  function winChance(g, p, k) {
    var P = g.players[p], en = E.fightersAt(g, p, k); if (!en.length) return 1;
    var op = en[0].p, O = g.players[op];
    var mine = g.units.filter(function (u) { return u.p === p && u.k !== 'W'; }).length;
    var myMax = Math.min(7, P.power) + P.hand.slice().sort(function (a, b) { return b - a; }).slice(0, Math.max(1, Math.min(2, mine))).reduce(function (s, v) { return s + v; }, 0);
    var oEst = Math.min(7, O.power) + Math.min(O.hand.length, E.unitsAt(g, k).filter(function (u) { return u.p === op && u.k !== 'W'; }).length) * 3.2;
    var d = myMax - oEst;
    return d >= 4 ? 0.9 : d >= 2 ? 0.7 : d >= 0 ? 0.5 : d >= -2 ? 0.25 : 0.05;
  }

  /* ---------- incontri e Fabbrica ---------- */
  function subFor(g, p, gain, k) {
    var P = g.players[p], s = {};
    if (gain.mech) s.mech = [3, 0, 1, 2].filter(function (i) { return P.mechs.indexOf(i) < 0; })[0];
    if (gain.st) s.st = ['mil', 'arm', 'mon', 'min'].filter(function (x) { return !P.st[x]; })[0];
    if (gain.up) s.up = bestUpgrade(g, p);
    if (gain.en) s.en = bestEnlist(g, p);
    if (gain.ar) { var need = needs(g, p), o = {}; for (var i = 0; i < gain.ar; i++) { var r = need[i % need.length]; o[r] = (o[r] || 0) + 1; } s.ar = o; }
    return s;
  }
  function bestUpgrade(g, p) {
    var P = g.players[p], m = D.MATS[P.mat];
    var ups = ['mvU', 'prH', 'bpP', 'trP', 'mvC', 'bpC'].filter(function (u) { return !P.ups[u]; });
    var cols = [1, 2, 3, 0].filter(function (c) { return P.red[c] < m.cost[c] - m.min[c]; });
    return ups.length && cols.length ? { up: ups[0], col: cols[0] } : {};
  }
  function bestEnlist(g, p) {
    var P = g.players[p];
    var cols = [3, 1, 0, 2].filter(function (c) { return P.recruits.indexOf(c) < 0; });
    var once = ['c2', 'pop2', 'pw2', 'cd2'].filter(function (o) { return P.once.indexOf(o) < 0; });
    return cols.length && once.length ? { col: cols[0], once: once[0] } : {};
  }
  function needs(g, p) {
    var P = g.players[p], t = E.resTotals(g, p), out = [];
    var order = [1, 2, 3, 0].map(function (c) { return D.BOTTOM[c].res; });
    order.forEach(function (r) { if (out.indexOf(r) < 0) out.push(r); });
    out.sort(function (a, b) { return t[a] - t[b]; });
    return out;
  }
  function encounterChoice(g, p) {
    var e = g.pend, card = D.ENCOUNTERS[e.card], best = null;
    var combos = [];
    for (var i = 0; i < 3; i++) { combos.push([i]); if (e.max === 2) for (var j = 0; j < 3; j++) if (j !== i) combos.push([i, j]); }
    combos.forEach(function (c) {
      var sub = c.map(function (i) { return subFor(g, p, card.o[i].gain, e.h); });
      var a = { a: 'enc', opts: c, sub: sub }, s = tryAct(g, p, a);
      if (!s) return;
      var v = value(s, p) + Math.random() * 0.3;
      if (!best || v > best.v) best = { v: v, a: a };
    });
    return best ? best.a : { a: 'enc', opts: [0], sub: [{}] };
  }
  function factoryChoice(g, p) {
    var pend = g.pend, pref = [10, 7, 0, 5, 8, 4, 3, 1, 2, 11, 9, 6];
    var ids = pend.ids.slice().sort(function (a, b) { return pref.indexOf(a) - pref.indexOf(b); });
    return { a: 'factory', id: ids[0] };
  }

  /* ---------- candidati per le azioni in alto ---------- */
  function topCandidates(g, p) {
    var P = g.players[p], top = E.colTop(g, p, g.ts.col), out = [{ a: 'skip' }];
    if (top === 'move') { out.push({ a: 'move', coins: true }); var mv = planMoves(g, p); if (mv.length) out.push({ a: 'move', moves: mv }); var mv2 = planMoves(g, p, true); if (mv2.length) out.push({ a: 'move', moves: mv2 }); }
    if (top === 'bolster') { out.push({ a: 'bolster', opt: 'pw' }); out.push({ a: 'bolster', opt: 'cd' }); }
    if (top === 'trade') {
      out.push({ a: 'trade', opt: 'pop' });
      var w = E.myUnits(g, p, 'W').filter(function (u) { return E.isTerr(u.h) && E.HEX[u.h].t !== 'L'; })[0];
      if (w) { var nd = needs(g, p); [[nd[0], nd[0]], [nd[0], nd[1]], [nd[1], nd[1]], [nd[0], nd[2]]].forEach(function (pr) { var r = {}; r[pr[0]] = (r[pr[0]] || 0) + 1; r[pr[1]] = (r[pr[1]] || 0) + 1; out.push({ a: 'trade', opt: 'res', r: r, hex: w.h }); }); }
    }
    if (top === 'produce') {
      var hs = Object.keys(E.produceHexes(g, p)), n = E.produceCount(P);
      var score = function (k) { var c = E.myUnits(g, p, 'W').filter(function (u) { return u.h === k; }).length + (P.st.mil === k ? 1 : 0); return c * (E.HEX[k].t === 'V' ? (E.workersOnBoard(g, p) < 8 ? 1.4 : 0) : 1) + Math.random() * 0.1; };
      hs.sort(function (a, b) { return score(b) - score(a); });
      if (hs.length) { out.push({ a: 'produce', hexes: hs.slice(0, n) }); if (hs.length > 1) out.push({ a: 'produce', hexes: hs.slice(1, n + 1) }); }
    }
    if (top === 'factory') { var fc = D.FACTORY[P.fcard]; out.push({ a: 'factory', sub: subFor(g, p, fc.gain) }); }
    return out;
  }
  // mosse: scelte una alla volta, ognuna con il miglior guadagno immediato
  function planMoves(g, p, aggressive) {
    var s = clone(g), moves = [], moved = [], n = E.moveCount(g.players[p]);
    for (var i = 0; i < n; i++) {
      var best = null;
      E.myUnits(s, p).forEach(function (u) {
        if (moved.indexOf(u.id) >= 0) return;
        var tg = E.moveTargets(s, p, u.id);
        Object.keys(tg).forEach(function (k) {
          var sc = moveScore(s, p, u, k, aggressive) + Math.random() * 0.2;
          if (!best || sc > best.sc) best = { sc: sc, u: u, k: k };
        });
      });
      if (!best || best.sc <= 0.3) break;
      var carry = best.u.k === 'M' ? E.myUnits(s, p, 'W').filter(function (w) { return w.h === best.u.h && moved.indexOf(w.id) < 0; }).slice(0, carryCount(s, p, best.u, best.k)).map(function (w) { return w.id; }) : [];
      if (E.HEX[best.k].t === 'L' || E.HEX[best.k].t === 'H') carry = [];
      var left = E.unitsAt(s, best.u.h).filter(function (x) { return x.p === p && x.id !== best.u.id && carry.indexOf(x.id) < 0; }).length;
      var m = { u: best.u.id, to: best.k, carry: carry, res: left === 0 };
      if (E.validateMove(s, p, m, moved)) break;
      E.doMove(s, p, m, moved); moves.push(m);
    }
    return moves;
  }
  function carryCount(g, p, u, k) {
    var here = E.myUnits(g, p, 'W').filter(function (w) { return w.h === u.h; }).length;
    var target = E.unitsAt(g, k).filter(function (x) { return x.p === p; }).length;
    return target ? 0 : Math.max(0, here - 1);
  }
  function moveScore(g, p, u, k, aggressive) {
    var P = g.players[p], H = E.HEX[k], from = u.h;
    if (H.t === 'H') return -1;
    var mineThere = E.unitsAt(g, k).filter(function (x) { return x.p === p; }).length;
    var mineFrom = E.unitsAt(g, from).filter(function (x) { return x.p === p; }).length;
    var fighters = E.fightersAt(g, p, k), enemyW = E.enemiesAt(g, p, k).filter(function (x) { return x.k === 'W'; });
    var sc = 0;
    if (u.k === 'W') {
      if (mineThere) return -0.5;
      sc += 2.2 + (H.t === 'V' ? 0.8 : 0) + (H.t === 'X' ? 1 : 0);
      if (mineFrom === 1 && E.isTerr(from)) sc -= 1.6 + (g.res[from] ? (g.res[from].f + g.res[from].m + g.res[from].w + g.res[from].o) * 0.3 : 0);
      if (!E.isTerr(from)) sc += 1.5;     // esce dalla base dopo una ritirata
      return sc;
    }
    if (fighters.length) {
      var wc = winChance(g, p, k);
      if (wc < (aggressive ? 0.5 : 0.7)) return -2;
      return 7 * wc - 3 * (1 - wc) - (enemyW.length ? enemyW.length * (E.has(g, p, 'comrade') ? 0 : 1) : 0);
    }
    if (enemyW.length) { if (!aggressive && P.pop < 6) return -1; sc += 1.5 + enemyW.length * 0.5 - enemyW.length * 1.1; }
    if (u.k === 'C') {
      if (g.enc.indexOf(k) >= 0) sc += 4.5;
      if (k === E.FACTORY_HEX && P.fcard == null) sc += 5.5;
      if (!mineThere) sc += 0.6;
      var d0 = nearestGoal(g, p, from), d1 = nearestGoal(g, p, k); sc += (d0 - d1) * 0.9;
      return sc;
    }
    // mech
    if (!mineThere) sc += 1.2;
    if (mineFrom === 1 && E.isTerr(from) && !E.myUnits(g, p, 'W').some(function (w) { return w.h === from; })) sc -= 0.4;
    if (!E.isTerr(from)) sc += 1.5;
    if (aggressive) { var dEn = nearestEnemy(g, p, from) - nearestEnemy(g, p, k); sc += dEn * 0.5; }
    return sc;
  }
  function nearestGoal(g, p, k) {
    var goals = g.enc.slice(); if (g.players[p].fcard == null) goals.push(E.FACTORY_HEX);
    var best = 9; goals.forEach(function (x) { best = Math.min(best, dist(g, p, k, x)); }); return best;
  }
  function nearestEnemy(g, p, k) { var best = 9; g.units.forEach(function (u) { if (u.p !== p && u.k !== 'W' && E.isTerr(u.h)) best = Math.min(best, dist(g, p, k, u.h)); }); return best; }

  /* ---------- candidati per le azioni in basso ---------- */
  function bottomCandidates(g, p) {
    var P = g.players[p], col = g.ts.col, out = [{ a: 'end' }];
    if (col === 4) {
      var s = null;
      E.myUnits(g, p).forEach(function (u) { var tg = E.moveTargets(g, p, u.id, 2); Object.keys(tg).forEach(function (k) { var sc = moveScore(g, p, u, k); if (!s || sc > s.sc) s = { sc: sc, m: { u: u.id, to: k, carry: [], res: false } }; }); });
      if (s && s.sc > 0.5) out.push({ a: 'fmove', move: s.m });
      return out;
    }
    var b = D.BOTTOM[col], coerce = E.has(g, p, 'coerce');
    if (!E.canPayRes(g, p, b.res, E.bottomCost(g, p, col), coerce)) return out;
    if (b.k === 'upgrade') { var u = bestUpgrade(g, p); if (u.up) out.push({ a: 'upgrade', up: u.up, col: u.col, coerce: coerce }); }
    if (b.k === 'deploy') { var hs = Object.keys(E.deployHexes(g, p)), mi = [3, 0, 1, 2].filter(function (i) { return P.mechs.indexOf(i) < 0; })[0]; if (hs.length && mi != null) { hs.slice(0, 3).forEach(function (h) { out.push({ a: 'deploy', m: mi, hex: h, coerce: coerce }); }); } }
    if (b.k === 'build') {
      var bh = Object.keys(E.buildHexes(g, p)), sts = ['mil', 'arm', 'mon', 'min'].filter(function (x) { return !P.st[x]; });
      if (bh.length && sts.length) bh.slice(0, 3).forEach(function (h) { out.push({ a: 'build', s: sts[0], hex: h, coerce: coerce }); });
    }
    if (b.k === 'enlist') { var en = bestEnlist(g, p); if (en.once) out.push({ a: 'enlist', col: en.col, once: en.once, coerce: coerce }); }
    return out;
  }

  /* ---------- decisione ---------- */
  function bestOf(g, p, cands) {
    var best = null;
    cands.forEach(function (a) { var s = tryAct(g, p, a); if (!s) return; var v = evalAfter(s, p) + Math.random() * 0.25; if (!best || v > best.v) best = { v: v, a: a, s: s }; });
    return best;
  }
  // dopo un'azione in alto si stima anche la migliore azione in basso
  function evalAfter(s, p) {
    if (s.phase === 'play' && s.pend && s.pend.k === 'combat') return value(s, p) + 3;   // battaglia scelta perché favorevole
    if (s.phase === 'play' && s.ts && s.ts.p === p && s.ts.stage === 'bottom' && !s.pend) {
      var best = value(s, p);
      bottomCandidates(s, p).forEach(function (a) { if (a.a === 'end') return; var s2 = tryAct(s, p, a); if (s2) best = Math.max(best, value(s2, p)); });
      return best;
    }
    return value(s, p);
  }
  function decide(g, p) {
    var pend = g.pend;
    if (pend) {
      if (pend.k === 'combat') return combatChoice(g, p);
      if (pend.k === 'enc') return encounterChoice(g, p);
      if (pend.k === 'factory') return factoryChoice(g, p);
    }
    var ts = g.ts; if (!ts || ts.p !== p) return null;
    var obj = E.canObjective(g, p); if (obj.length) return { a: 'objective', id: obj[0] };
    if (ts.stage === 'pick') {
      var best = null;
      for (var col = 0; col <= 4; col++) {
        if (!E.colAllowed(g, p, col)) continue;
        var s = tryAct(g, p, { a: 'col', col: col }); if (!s) continue;
        var b = bestOf(s, p, topCandidates(s, p));
        var v = (b ? b.v : value(s, p)) - (col === g.players[p].last ? 2.5 : 0);
        if (!best || v > best.v) best = { v: v, col: col };
      }
      return { a: 'col', col: best ? best.col : 0 };
    }
    if (ts.stage === 'top') { var bt = bestOf(g, p, topCandidates(g, p)); return bt ? bt.a : { a: 'skip' }; }
    if (ts.stage === 'bottom') { var bb = bestOf(g, p, bottomCandidates(g, p)); return bb ? bb.a : { a: 'end' }; }
    return null;
  }
  return { decide: decide, value: value };
})();
