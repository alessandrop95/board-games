/* ===== Citadels: giocatori automatici =====
   Scelgono il personaggio che rende di più adesso (oro dei quartieri, carte, sicurezza), mirano l'Assassino e il Ladro
   sui personaggi più probabili per chi è in testa o ha tanto oro, costruiscono il quartiere più caro che possono
   (preferendo i tipi che mancano), e il Condottiero colpisce chi sta per completare la città. */
var CTBot = (function () {
  var E = (typeof CTEngine !== 'undefined') ? CTEngine : require('./engine.js');
  var D = E.D;
  function dupe(P, id) { return !E.has(P, 'quarry') && P.city.some(function (x) { return D(x).n === D(id).n; }); }
  function cityPts(P) { return P.city.reduce(function (s, id) { return s + D(id).c; }, 0); }
  function countT(P, t) { return P.city.filter(function (id) { var d = D(id); return d.t === t || d.u === 'school'; }).length; }
  function missing(P) { var s = {}; P.city.forEach(function (id) { s[D(id).t] = 1; }); return ['n', 'r', 'c', 'm', 'u'].filter(function (t) { return !s[t]; }); }
  function others(g, p) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return i !== p; }); }
  function leader(g, p) { var b = -1, bv = -1; others(g, p).forEach(function (i) { var Q = g.players[i], v = Q.city.length * 3 + cityPts(Q) * .5 + Q.gold * .3; if (v > bv) { bv = v; b = i; } }); return b; }
  // valore di una carta da costruire per il giocatore P
  function cardVal(P, id) { var d = D(id); if (dupe(P, id)) return -5; return d.c + (missing(P).indexOf(d.t) >= 0 ? 1.5 : 0) + (d.t === 'u' ? 1 : 0); }
  function affordable(P, ids, gold) { return ids.filter(function (id) { return !dupe(P, id) && E.costOf(P, id) <= gold; }); }

  function pickVal(g, p, r) {
    var P = g.players[p], v = Math.random() * 1.2, L = leader(g, p), maxGold = Math.max.apply(null, others(g, p).map(function (i) { return g.players[i].gold; }));
    var hand = P.hand.length, cheap = affordable(P, P.hand, P.gold + 2).length;
    switch (r) {
      case 1: v += 3.2 + (L >= 0 && g.players[L].city.length >= 5 ? 1.5 : 0); break;
      case 2: v += 1.5 + maxGold * .55; break;
      case 3: v += hand <= 1 ? 3.5 + Math.max.apply(null, others(g, p).map(function (i) { return g.players[i].hand.length; })) * .4 : hand >= 4 ? 0.5 : 1.8; break;
      case 4: v += countT(P, 'n') * 1.2 + 2.2; break;
      case 5: v += countT(P, 'r') * 1.2 + (P.city.length >= 5 ? 2.5 : 1); break;
      case 6: v += countT(P, 'c') * 1.2 + 2.6; break;
      case 7: v += (P.gold >= 5 && hand >= 2 ? 5 : 1.5) + (hand === 0 ? 1.5 : 0); break;
      case 8: v += countT(P, 'm') * 1.2 + (L >= 0 && g.players[L].city.length >= 5 ? 2.5 : 1.2); break;
    }
    if (!cheap && hand && r !== 3 && r !== 7) v -= .5;
    return v;
  }
  // personaggio probabile di un giocatore (per Assassino e Ladro): si escludono quelli scartati scoperti e il proprio
  function targetRank(g, p, pool, prefer) {
    var best = null;
    pool.forEach(function (r) { var v = (prefer[r] || 1) + Math.random() * 1.5; if (!best || v > best.v) best = { r: r, v: v }; });
    return best ? best.r : pool[0];
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'pick') {
      if (E.decider(g) !== p) return null;
      var ch = E.choices(g), b = null;
      ch.forEach(function (r) { var v = pickVal(g, p, r); if (!b || v > b.v) b = { r: r, v: v }; });
      return { a: 'pick', r: b.r };
    }
    if (g.phase !== 'turns' || !g.turn || g.turn.p !== p) return null;
    var T = g.turn, up = g.pick ? g.pick.up : [];
    // poteri che si usano subito
    if (T.r === 1 && !T.used.kill) {
      var L = leader(g, p), pool = [2, 3, 4, 5, 6, 7, 8].filter(function (r) { return up.indexOf(r) < 0; });
      var pref = { 4: 2, 6: 2.4, 7: 2.6, 8: 1.8, 5: 1.4, 2: 1.6, 3: 1.2 };
      if (L >= 0 && g.players[L].city.length >= 5) { pref[7] = 3.2; pref[5] = 2.2; }
      return { a: 'kill', r: targetRank(g, p, pool, pref) };
    }
    if (T.r === 2 && !T.used.rob) {
      var pool2 = [3, 4, 5, 6, 7, 8].filter(function (r) { return up.indexOf(r) < 0 && r !== g.killed; });
      if (pool2.length) return { a: 'rob', r: targetRank(g, p, pool2, { 6: 3, 7: 2.6, 4: 2.2, 5: 1.6, 8: 1.6, 3: 1 }) };
    }
    if (T.r === 3 && !T.used.magic) {
      var big = others(g, p).sort(function (a, b) { return g.players[b].hand.length - g.players[a].hand.length; })[0];
      if (big != null && g.players[big].hand.length >= P.hand.length + 2) return { a: 'swap', t: big };
      var bad = P.hand.filter(function (id) { return dupe(P, id) || D(id).c >= 5 && P.gold < 3; });
      if (bad.length) return { a: 'redraw', ids: bad };
    }
    // risorse
    if (!T.gathered) {
      var can = affordable(P, P.hand, P.gold + 2 + (E.CH[T.r].t ? E.incomeOf(g, p, T.r) : 0));
      var wantCards = P.hand.filter(function (id) { return !dupe(P, id); }).length === 0 || (P.hand.length <= 1 && P.gold >= 4) || (!can.length && P.gold >= 6);
      return wantCards ? { a: 'draw' } : { a: 'gold' };
    }
    if (T.drawn) {
      var k = T.drawn.slice().sort(function (a, b) { return cardVal(P, b) - cardVal(P, a); })[0];
      return { a: 'keep', id: k };
    }
    // incasso prima di costruire se serve per permettersi qualcosa
    var inc = E.canIncome(g) ? E.incomeOf(g, p, T.r) : 0;
    if (T.built < T.max) {
      var opts = P.hand.filter(function (id) { return !dupe(P, id) && E.costOf(P, id) <= P.gold; }).sort(function (a, b) { return cardVal(P, b) - cardVal(P, a); });
      // il Covo dei Ladri si paga anche con le carte
      if (opts.length) { var bid = opts[0]; if (D(bid).u === 'den') { var extra = P.hand.filter(function (x) { return x !== bid && cardVal(P, x) < 3; }); return { a: 'build', id: bid, cards: extra.slice(0, Math.max(0, E.costOf(P, bid) - P.gold + 2)) }; } return { a: 'build', id: bid }; }
      if (inc && P.hand.some(function (id) { return !dupe(P, id) && E.costOf(P, id) <= P.gold + inc; })) return { a: 'income' };
    }
    if (inc) return { a: 'income' };
    // Condottiero: colpisce chi sta per completare la città
    if (T.r === 8 && !T.used.destroy) {
      var best = null;
      others(g, p).forEach(function (t) {
        var Q = g.players[t]; if (Q.city.length < 4) return;
        Q.city.forEach(function (id) { if (E.destroyable(g, p, t, id)) return; var c = D(id).c - 1, v = Q.city.length * 2 + (Q.city.length >= 6 ? 6 : 0) - c * .8; if (c <= Math.max(1, P.gold - 2) && (!best || v > best.v)) best = { t: t, id: id, v: v }; });
      });
      if (best && best.v > 8) return { a: 'destroy', t: best.t, id: best.id };
    }
    if (E.has(P, 'lab') && !T.used.lab && P.gold < 3) { var junk = P.hand.filter(function (id) { return dupe(P, id); })[0]; if (junk != null) return { a: 'lab', id: junk }; }
    if (E.has(P, 'smithy') && !T.used.smithy && P.gold >= 5 && P.hand.length <= 1) return { a: 'smithy' };
    return { a: 'end' };
  }
  return { decide: decide, cardVal: cardVal };
})();
if (typeof module !== 'undefined') module.exports = CTBot;
