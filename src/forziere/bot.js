/* ===== Il Forziere Maledetto: giocatori automatici =====
   Sanno solo il proprio ruolo, i ruoli scoperti e quelli letti con la Lettera intercettata; per gli altri
   guardano chi ha attaccato chi. Le flotte colpiscono i nemici (e il Pirata, che affondato porta il Forziere
   verso chi lo affonda), il Pirata e i Corsari colpiscono chi riporta il Forziere verso il centro e vanno a
   caccia di dobloni. Si difendono sempre quando possono e scelgono navi robuste. */
var FZBot = (function () {
  var E = (typeof FZEngine !== 'undefined') ? FZEngine : require('./engine.js');
  var T = E.T;
  function ty(id) { return E.ty(id); }
  function hand(g, p) { return g.players[p].hand; }
  function find(g, p, f) { return hand(g, p).filter(function (id) { return f(ty(id), id); }); }
  function dirOf(g, role) { if (role === 'PI') return 0; return E.nat(role) === 'L' ? 1 : -1; }   // dove va il Forziere se affonda
  // quanto conviene a p che la nave di q vada a fondo (−1 … +1)
  function hostility(g, p, q) {
    var me = g.players[p], my = me.role, R = E.ROLES[my], known = E.seenRole(g, p, q), Q = g.players[q];
    var f = Q.ship != null ? E.SHIPS[Q.ship].f : 1;
    if (R.solo) {
      var dir = known ? dirOf(g, known) : 0, after = g.chest + dir * f;
      var base = E.dbl(me) >= 3 ? .9 : .45;   // il doblone fa sempre gola
      if (known === 'PI' || (known && E.ROLES[known].solo)) return .7;
      if (!known) return base * .8;
      return Math.max(-.6, Math.min(1, base + (Math.abs(after) < Math.abs(g.chest) ? .4 : Math.abs(after) > Math.abs(g.chest) ? -.5 : 0) - (Math.abs(after) >= g.flag - 1 ? .6 : 0)));
    }
    var mine = R.nat;
    if (known) {
      if (known === 'PI') return .8;
      return E.nat(known) === mine ? -1 : 1;
    }
    // ruolo sconosciuto: si guarda chi ha attaccato chi
    var s = 0;
    g.players.forEach(function (X, x) {
      if (x === q) return;
      var kx = x === p ? my : E.seenRole(g, p, x); if (!kx) return;
      var friend = kx !== 'PI' && E.nat(kx) === mine, enemy = !friend;
      var by = g.hx[q + '>' + x] || 0, on = g.hx[x + '>' + q] || 0;
      if (friend) s += by * .45 - on * .35;
      if (enemy) s -= by * .35 - on * .25;
    });
    return Math.max(-.9, Math.min(.9, s + (mine === 'P' ? .12 : .05)));
  }
  function bestTarget(g, p, list, min) {
    var best = null, bv = min == null ? .2 : min;
    list.forEach(function (q) {
      var Q = g.players[q], h = hostility(g, p, q); if (h <= 0) return;
      var v = h + (Q.bar <= 1 ? .5 : Q.bar <= 2 ? .25 : 0) + (Q.ship != null ? E.SHIPS[Q.ship].f * .05 : 0);
      if (v > bv) { bv = v; best = q; }
    });
    return best;
  }
  function shipScore(g, p, s) { var S = E.SHIPS[s], lead = E.ROLES[g.players[p].role].lead; return S.b * 1.5 + S.m * 1.2 + S.g * .8 + (S.a ? .8 : 0) - (lead ? S.f * .7 : 0); }
  function keepValue(g, p, id) {
    var t = ty(id), P = g.players[p];
    if (t === 'virata' || t === 'bianca') return 7;
    if (t === 'moschetto') return 6.5;
    if (t === 'bordata') return 6;
    if (t === 'rum') return P.ship != null && P.bar < E.maxBar(g, p) ? 6 : 4;
    if (E.kind(id) === 'eq') return E.hasEq(g, p, t) != null ? 1 : 5;
    return 4;
  }

  function respond(g, p) {
    var pd = g.pend, ans = E.answers(g, p);
    if (!ans.length) return { a: 'take' };
    var by = function (t) { return ans.filter(function (id) { return ty(id) === t; })[0]; };
    var P = g.players[p];
    if (pd.k === 'shot') {
      var left = pd.need - pd.got, cheap = ans.filter(function (id) { return ty(id) !== 'bianca'; });
      cheap.sort(function (x, y) { var o = ['virata', 'moschetto', 'bordata']; return o.indexOf(ty(x)) - o.indexOf(ty(y)); });
      if (cheap.length >= left) return { a: 'resp', id: cheap[0] };
      if (by('bianca') != null) return { a: 'resp', id: by('bianca') };
      return { a: 'take' };
    }
    if (pd.k === 'need' || pd.k === 'duel') {
      var b = ans.filter(function (id) { return ty(id) !== 'bianca'; })[0];
      if (b != null) return { a: 'resp', id: b };
      return by('bianca') != null && P.bar <= 2 ? { a: 'resp', id: by('bianca') } : { a: 'take' };
    }
    if (pd.k === 'card') {
      var e = pd.eff.t;
      if (e === 'spettro' || e === 'sfida' || (P.eq.length && pd.eff.pick != null && pd.eff.pick !== 'hand') || hostility(g, p, pd.by) > .3) return { a: 'resp', id: by('bianca') };
      return { a: 'take' };
    }
    return { a: 'take' };
  }

  function decide(g, p) {
    if (g.phase !== 'play') return null;
    if (g.pend) return g.pend.who === p ? respond(g, p) : null;
    if (g.turn !== p) return null;
    var P = g.players[p];
    if (g.step === 'spectre') { var m = E.matching(g, p, E.CARDS[g.spectreRev].s).sort(function (a, b) { return keepValue(g, p, a) - keepValue(g, p, b); }); return { a: 'answer', id: m.length ? m[0] : null }; }
    if (g.step === 'ship') {
      var bi = 'deck', bs = 6.5;
      g.row.forEach(function (s, i) { var v = shipScore(g, p, s); if (v > bs) { bs = v; bi = i; } });
      if (bi === 'deck' && !g.ships.length) bi = 0;
      return { a: 'ship', i: bi };
    }
    if (g.step === 'sunk') return endTurn(g, p);
    if (g.step !== 'play') return null;
    var H = P.hand, i, id, t, tg;
    // 1) equipaggiamento
    for (i = 0; i < H.length; i++) { id = H[i]; if (E.kind(id) === 'eq' && E.playable(g, p, id)) return { a: 'play', id: id }; }
    // 2) cure e carte
    var low = P.bar < E.maxBar(g, p);
    for (i = 0; i < H.length; i++) {
      id = H[i]; t = ty(id);
      if (t === 'rum' && low) return { a: 'play', id: id };
      if (t === 'vedetta') return { a: 'play', id: id };
      if (t === 'porto' && P.bar <= E.maxBar(g, p) - 1) return { a: 'play', id: id };
      if (t === 'rifornimento' && P.bar <= 2) return { a: 'play', id: id, t: p };
      if (t === 'lettera') { tg = E.targets(g, p, id) || []; if (tg.length) return { a: 'play', id: id, t: tg[Math.floor(Math.random() * tg.length)] }; }
    }
    // 3) attacchi (si tiene una difesa in mano, se possibile)
    var defs = find(g, p, function (x) { return x === 'virata' || x === 'bianca'; }).length;
    var atks = H.filter(function (x) { var k = ty(x); return k === 'bordata' || k === 'arrembaggio' || k === 'incatenate' || (k === 'moschetto' && defs > 0) || (k === 'virata' && E.isCap(g, p, 'lia') && defs > 2); });
    atks.sort(function (a, b) { var o = ['arrembaggio', 'incatenate', 'bordata', 'moschetto', 'virata']; return o.indexOf(ty(a)) - o.indexOf(ty(b)); });
    for (i = 0; i < atks.length; i++) {
      id = atks[i]; var as = ty(id) === 'virata' ? 'atk' : null;
      tg = E.targets(g, p, id, as); if (!tg || !tg.length) continue;
      var q = bestTarget(g, p, tg); if (q == null) continue;
      var a = { a: 'play', id: id, t: q }; if (as) a.as = as;
      if (ty(id) === 'incatenate' && g.players[q].eq.length) a.pick = g.players[q].eq[0];
      return a;
    }
    // 4) carte contro un avversario
    for (i = 0; i < H.length; i++) {
      id = H[i]; t = ty(id);
      if (['saccheggio', 'sabotaggio', 'spettro', 'sfida'].indexOf(t) < 0) continue;
      if (t === 'spettro' && g.gorgo) return { a: 'play', id: id };
      if (t === 'sfida' && find(g, p, function (x) { return x === 'bordata'; }).length < 2) continue;
      tg = E.targets(g, p, id) || []; var q2 = bestTarget(g, p, tg, .3); if (q2 == null) continue;
      var Q2 = g.players[q2], pk = Q2.eq.length && (t === 'sabotaggio' || Q2.hand.length === 0 || Math.random() < .5) ? Q2.eq[0] : 'hand';
      return { a: 'play', id: id, t: q2, pick: pk };
    }
    // 5) carte contro tutti: solo se conviene
    for (i = 0; i < H.length; i++) {
      id = H[i]; t = ty(id); if (t !== 'burrasca' && t !== 'mostro') continue;
      var sum = 0; g.players.forEach(function (Q, q) { if (q !== p && Q.ship != null) sum += hostility(g, p, q); });
      if (sum > .4) return { a: 'play', id: id };
    }
    // 6) aiuti alla flotta
    for (i = 0; i < H.length; i++) {
      id = H[i]; if (ty(id) !== 'rifornimento') continue;
      var ally = null; g.players.forEach(function (Q, q) { if (Q.ship != null && hostility(g, p, q) < -.5 && Q.bar <= 2 && ally == null) ally = q; });
      if (ally != null) return { a: 'play', id: id, t: ally };
      if (low) return { a: 'play', id: id, t: p };
    }
    return endTurn(g, p);
  }
  function endTurn(g, p) {
    var H = g.players[p].hand.slice(), extra = H.length - 5;
    if (extra <= 0) return { a: 'end' };
    H.sort(function (a, b) { return keepValue(g, p, a) - keepValue(g, p, b); });
    return { a: 'end', drop: H.slice(0, extra) };
  }
  return { decide: decide, hostility: hostility };
})();
if (typeof module !== 'undefined') module.exports = FZBot;
