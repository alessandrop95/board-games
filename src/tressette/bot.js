/* ===== Tressette: giocatori automatici =====
   Ricordano le carte già uscite (le prese di tutti) e sanno quali carte sono «buone» (le più alte rimaste nel seme).
   A vincere: aprono con le carte buone che portano punti, altrimenti con un liscio del seme più lungo; se la mano è
   del compagno e non la può più perdere gli danno punti, se è degli avversari la prendono quando conviene, se no
   lasciano la carta che vale meno. In 4 dicono «volo» quando aprono con l'ultima carta di un seme.
   A perdere: stanno sotto con la carta più alta che non prende; se devono prendere per forza, da ultimi prendono
   con la carta più pesante; quando non hanno il seme scaricano assi e figure. Con l'asso di bastoni da 11 se ne
   liberano appena possono: sotto a un 2 o a un 3 di bastoni, o su un altro seme quando non hanno quello d'uscita. */
var TSBot = (function () {
  var E = (typeof TSEngine !== 'undefined') ? TSEngine : require('./engine.js');
  function out(g) { var o = []; g.taken.forEach(function (t) { o = o.concat(t); }); g.trick.forEach(function (x) { o.push(x.c); }); return o.concat(g.removed || []); }
  // nessuna carta dello stesso seme più alta è ancora in giro (fuori dalla mia mano e da quelle uscite)
  function master(g, p, c) {
    var gone = out(g), mine = g.players[p].hand, s = E.suit(c);
    for (var r = 1; r <= 10; r++) { var x = s * 10 + r - 1; if (E.power(x) > E.power(c) && gone.indexOf(x) < 0 && mine.indexOf(x) < 0) return false; }
    return true;
  }
  function bySuitCount(hand) { var n = [0, 0, 0, 0]; hand.forEach(function (c) { n[E.suit(c)]++; }); return n; }
  function cheapest(cs, g) { return cs.slice().sort(function (a, b) { return (E.thirds(a, g) * 20 + E.power(a)) - (E.thirds(b, g) * 20 + E.power(b)); })[0]; }
  function richest(cs, g) { return cs.slice().sort(function (a, b) { return (E.thirds(b, g) * 20 + E.power(b)) - (E.thirds(a, g) * 20 + E.power(a)); })[0]; }
  function lowestPow(cs) { return cs.slice().sort(function (a, b) { return E.power(a) - E.power(b); })[0]; }
  function highestPow(cs) { return cs.slice().sort(function (a, b) { return E.power(b) - E.power(a); })[0]; }

  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    var L = E.legal(g, p), c = g.opts.mode === 'perdere' ? toLose(g, p, L) : toWin(g, p, L), a = { a: 'play', c: c };
    if (!g.trick.length && g.opts.signals) {
      var left = P.hand.filter(function (x) { return E.suit(x) === E.suit(c) && x !== c; }).length;
      if (!left && P.hand.length > 1) a.s = 'volo';
      else if (left >= 4) a.s = 'striscio';
    }
    return a;
  }

  function toWin(g, p, L) {
    var n = g.players.length, hand = g.players[p].hand;
    if (!g.trick.length) {
      // carte buone con punti (il 3, poi il 2 e l'asso quando sono rimasti i più alti)
      var good = L.filter(function (c) { return master(g, p, c) && E.thirds(c) > 0; });
      if (good.length) return highestPow(good);
      // altrimenti un liscio del seme più lungo, mai un asso scoperto
      var cnt = bySuitCount(hand), lisci = L.filter(function (c) { return E.thirds(c) === 0; });
      var pool = lisci.length ? lisci : L.filter(function (c) { return E.rank(c) !== 1; });
      if (!pool.length) pool = L;
      return pool.slice().sort(function (a, b) { return (cnt[E.suit(b)] - cnt[E.suit(a)]) || (E.power(a) - E.power(b)); })[0];
    }
    var w = E.winner(g.trick), lastToPlay = g.trick.length === n - 1, follow = E.suit(L[0]) === E.suit(g.trick[0].c);
    var onTable = E.sumTh(g.trick.map(function (x) { return x.c; }));
    var wc = g.trick.filter(function (x) { return x.p === w; })[0].c;
    var beats = follow ? L.filter(function (c) { return E.power(c) > E.power(wc); }) : [];
    if (E.team(g, w) === E.team(g, p) && w !== p) {
      // la mano è del compagno: punti se non la può più perdere
      var safe = lastToPlay || master(g, p, wc);
      if (safe) return richest(L);
      return cheapest(L);
    }
    if (beats.length) {
      var sure = beats.filter(function (c) { return master(g, p, c); });
      if (lastToPlay) return lowestPow(beats);        // da ultimi prendere non costa: i punti della propria carta restano
      if (sure.length) return lowestPow(sure);
      if (onTable >= 1) return lowestPow(beats);
    }
    return cheapest(L);
  }

  function toLose(g, p, L) {
    var n = g.players.length;
    if (!g.trick.length) {
      // si apre con la carta più bassa, preferendo i semi di cui sono uscite poche carte (qualcuno starà sopra)
      var gone = out(g), zero = L.filter(function (c) { return E.thirds(c, g) === 0; }), pool = zero.length ? zero : L;
      return pool.slice().sort(function (a, b) { return (E.power(a) - E.power(b)) || (gone.filter(function (x) { return E.suit(x) === E.suit(a); }).length - gone.filter(function (x) { return E.suit(x) === E.suit(b); }).length); })[0];
    }
    var lead = E.suit(g.trick[0].c), follow = E.suit(L[0]) === lead, lastToPlay = g.trick.length === n - 1;
    if (!follow) return richest(L, g);                 // non ho il seme: scarico assi e figure (prima di tutto l'asso di bastoni da 11)
    var w = E.winner(g.trick), wc = g.trick.filter(function (x) { return x.p === w; })[0].c;
    var under = L.filter(function (c) { return E.power(c) < E.power(wc); });
    if (g.opts.bastoni && under.indexOf(E.BASTONI) >= 0) return E.BASTONI;   // l'asso di bastoni sotto a un 2 o a un 3: se ne va senza prendere
    if (under.length) return highestPow(under);       // sto sotto con la più alta che non prende
    if (lastToPlay) return richest(L, g);              // prendo comunque: almeno mi libero della carta più pesante
    var keep = g.opts.bastoni && L.length > 1 ? L.filter(function (c) { return c !== E.BASTONI; }) : L;   // l'asso di bastoni non si rischia: resta per scaricarlo dopo
    return lowestPow(keep);                            // spero che qualcuno dopo di me stia sopra
  }
  return { decide: decide, master: master };
})();
if (typeof module !== 'undefined') module.exports = TSBot;
