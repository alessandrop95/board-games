/* ===== Machiavelli: giocatori automatici =====
   Cercano mosse che lasciano il tavolo sempre valido, una dopo l'altra, finché trovano qualcosa:
   1) calare combinazioni fatte solo con carte proprie; 2) attaccare carte alle combinazioni del tavolo
   (anche spezzando una scala in due); 3) «prendere in prestito» carte libere dal tavolo (la quarta di un poker,
   la prima o l'ultima di una scala lunga) per formare nuove combinazioni con le proprie. Se non trovano niente, pescano. */
var MCBot = (function () {
  var E = (typeof MCEngine !== 'undefined') ? MCEngine : require('./engine.js');
  var R = E.rank, S = E.suit;

  /* ---------- combinazioni con le sole carte in mano ---------- */
  function handMelds(hand) {
    var out = [];
    // tris e poker: un valore, semi diversi
    for (var r = 1; r <= 13; r++) {
      var bySuit = {}; hand.forEach(function (c) { if (R(c) === r && bySuit[S(c)] == null) bySuit[S(c)] = c; });
      var cs = Object.keys(bySuit).map(function (k) { return bySuit[k]; });
      if (cs.length >= 3) out.push(cs);
    }
    // scale: un seme, valori consecutivi (asso basso o alto)
    for (var s = 0; s < 4; s++) {
      var byR = {}; hand.forEach(function (c) { if (S(c) === s && byR[R(c)] == null) byR[R(c)] = c; });
      if (byR[1] != null) byR[14] = byR[1];
      var seg = [];
      for (var k = 1; k <= 15; k++) {
        if (k <= 14 && byR[k] != null) { seg.push(byR[k]); continue; }
        if (seg.length >= 3) {
          // una scala non può usare lo stesso asso due volte (A…K): in quel caso si toglie il primo
          var uniq = seg.filter(function (c, i, a) { return a.indexOf(c) === i; });
          if (uniq.length >= 3 && E.valid(uniq)) out.push(uniq); else if (E.valid(seg.slice(1))) out.push(seg.slice(1));
        }
        seg = [];
      }
    }
    return out.filter(E.valid).sort(function (a, b) { return b.length - a.length || E.groupPoints(b) - E.groupPoints(a); });
  }
  function without(arr, rem) { var m = {}; rem.forEach(function (c) { m[c] = 1; }); return arr.filter(function (c) { return !m[c]; }); }

  /* ---------- carte da attaccare al tavolo ---------- */
  function layoff(table, hand) {
    for (var i = 0; i < hand.length; i++) {
      var c = hand[i];
      for (var j = 0; j < table.length; j++) {
        var gr = table[j];
        if (E.valid(gr.concat([c]))) { table[j] = gr.concat([c]); return [c]; }
        // scala spezzata: 3♥…7♥ + 5♥ = 3♥4♥5♥ e 5♥6♥7♥
        if (E.kind(gr) === 'run' && S(gr[0]) === S(c) && gr.some(function (x) { return R(x) === R(c); })) {
          var srt = E.sortGroup(gr), hi = E.aceHigh(gr), v = function (x) { return R(x) === 1 && hi ? 14 : R(x); }, rv = R(c) === 1 && hi ? 14 : R(c);
          var left = srt.filter(function (x) { return v(x) <= rv; }), right = [c].concat(srt.filter(function (x) { return v(x) > rv; }));
          if (E.valid(left) && E.valid(right)) { table.splice(j, 1, left, right); return [c]; }
        }
      }
    }
    return null;
  }

  /* ---------- carte libere del tavolo per nuove combinazioni ---------- */
  function freeCards(table) {
    var out = [];
    table.forEach(function (gr, gi) {
      var k = E.kind(gr);
      if (k === 'set' && gr.length === 4) gr.forEach(function (c) { out.push({ c: c, g: gi }); });
      if (k === 'run' && gr.length >= 4) { var s = E.sortGroup(gr); out.push({ c: s[0], g: gi }); out.push({ c: s[s.length - 1], g: gi }); }
    });
    return out;
  }
  function borrow(table, hand) {
    var free = freeCards(table); if (!free.length) return null;
    var best = null;
    function consider(cards, frees) {
      if (!E.valid(cards)) return;
      var gs = {}; for (var i = 0; i < frees.length; i++) { if (gs[frees[i].g]) return; gs[frees[i].g] = 1; }
      var own = cards.length - frees.length; if (own < 1) return;
      if (!best || own > best.own || (own === best.own && frees.length < best.frees.length)) best = { cards: cards, frees: frees, own: own };
    }
    // tris/poker
    for (var r = 1; r <= 13; r++) {
      var mine = {}, fr = {};
      hand.forEach(function (c) { if (R(c) === r && mine[S(c)] == null) mine[S(c)] = c; });
      if (!Object.keys(mine).length) continue;
      free.forEach(function (f) { if (R(f.c) === r && mine[S(f.c)] == null && fr[S(f.c)] == null) fr[S(f.c)] = f; });
      var own = Object.keys(mine).map(function (k) { return mine[k]; }), fl = Object.keys(fr).map(function (k) { return fr[k]; });
      for (var n = 0; n <= Math.min(2, fl.length); n++) {
        var pick = fl.slice(0, n), cards = own.concat(pick.map(function (f) { return f.c; })).slice(0, 4);
        if (cards.length >= 3) consider(cards, pick.filter(function (f) { return cards.indexOf(f.c) >= 0; }));
      }
    }
    // scale
    for (var s = 0; s < 4; s++) {
      var slot = {};   // valore -> { c, f } (meglio una carta propria)
      hand.forEach(function (c) { if (S(c) === s && !slot[R(c)]) slot[R(c)] = { c: c }; });
      free.forEach(function (f) { if (S(f.c) === s && !slot[R(f.c)]) slot[R(f.c)] = { c: f.c, f: f }; });
      if (slot[1]) slot[14] = slot[1];
      for (var a = 1; a <= 12; a++) for (var len = 3; len <= 6 && a + len - 1 <= 14; len++) {
        var ok = true, cs = [], fs = [];
        for (var k = a; k < a + len; k++) { var x = slot[k]; if (!x || cs.indexOf(x.c) >= 0) { ok = false; break; } cs.push(x.c); if (x.f) fs.push(x.f); }
        if (ok) consider(cs, fs);
      }
    }
    if (!best) return null;
    best.frees.forEach(function (f) { table[f.g] = table[f.g].filter(function (c) { return c !== f.c; }); });
    table.push(best.cards);
    return best.cards.filter(function (c) { return hand.indexOf(c) >= 0; });
  }

  /* ---------- la mossa ---------- */
  function plan(g, p) {
    var P = g.players[p], hand = P.hand.slice(), table = g.table.map(function (gr) { return gr.c.slice(); }), used = [];
    if (g.opts.open36 && !P.opened) {
      var pts = 0, add = [];
      for (;;) { var m = handMelds(hand)[0]; if (!m) break; add.push(m); pts += E.groupPoints(m); hand = without(hand, m); }
      if (pts < 36) return null;
      return table.concat(add);
    }
    for (var guard = 0; guard < 60 && hand.length; guard++) {
      var m2 = handMelds(hand)[0];
      if (m2) { table.push(m2); hand = without(hand, m2); used = used.concat(m2); continue; }
      var l = layoff(table, hand);
      if (l) { hand = without(hand, l); used = used.concat(l); continue; }
      var b = borrow(table, hand);
      if (b && b.length) { hand = without(hand, b); used = used.concat(b); continue; }
      break;
    }
    if (!used.length) return null;
    if (table.some(function (gr) { return !E.valid(gr); })) return null;   // non dovrebbe succedere
    return table;
  }
  function decide(g, p) {
    if (g.phase !== 'play' || g.turn !== p) return null;
    var t = plan(g, p);
    return t ? { a: 'play', t: t } : { a: 'draw' };
  }
  return { decide: decide, plan: plan, handMelds: handMelds };
})();
if (typeof module !== 'undefined') module.exports = MCBot;
