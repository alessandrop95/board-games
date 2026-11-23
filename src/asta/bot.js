/* ===== Asta lampo: giocatori automatici =====
   Stimano quanto vale il lotto PER LORO: valore delle gemme + quanto cambia il bonus di maggioranza nei colori +
   le collezioni che completano. Ogni moneta avanzata vale mezzo punto, quindi offrono una parte del valore (quanto meno
   dipende dal carattere) e tengono qualche moneta per le maledizioni ancora in giro. Sulle maledizioni offrono una
   parte del danno: abbastanza per non restare i più bassi, non tanto da regalare monete a chi la prende. */
var ALBot = (function () {
  var E = (typeof ALEngine !== 'undefined') ? ALEngine : require('./engine.js');
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function greed(p) { return .3 + ((p * 41) % 7) / 7 * .28; }   // da 0,30 a 0,54 del valore stimato (le monete avanzate valgono mezzo punto)
  // valore del lotto per il giocatore p (con un giocatore fittizio che riceve le gemme)
  function worth(g, p, cards) {
    var P = g.players[p], before = E.score(g, p);
    var save = P.gems; P.gems = P.gems.concat(cards);
    var after = E.score(g, p); P.gems = save;
    var v = (after.gems + after.maj + after.sets) - (before.gems + before.maj + before.sets);
    // impedire a chi è in testa di prendersi una maggioranza vale qualcosa anche per me
    var deny = 0;
    g.players.forEach(function (Q, i) {
      if (i === p) return;
      var s0 = E.score(g, i), sv = Q.gems; Q.gems = Q.gems.concat(cards); var s1 = E.score(g, i); Q.gems = sv;
      deny = Math.max(deny, (s1.maj + s1.sets) - (s0.maj + s0.sets));
    });
    return v + deny * .35;
  }
  function cursesLeft(g) { return g.deck.filter(function (id) { return E.CARDS[id].k === 'curse'; }).length; }
  function decide(g, p) {
    var P = g.players[p]; if (!P || g.phase !== 'bid' || P.bid != null) return null;
    var r = hash(g.lot + ':' + p + ':' + g.players.length), lotsLeft = g.deck.length + 1;
    if (g.cur.kind === 'curse') {
      var dmg = -E.CARDS[g.cur.cards[0]].v;
      var b = Math.round(dmg * (.35 + r * .45) + (r > .85 ? 1 : 0));
      return { a: 'bid', b: Math.max(0, Math.min(P.coins, b)) };
    }
    var w = worth(g, p, g.cur.cards);
    var reserve = Math.min(P.coins, cursesLeft(g) * 2 * (lotsLeft > 4 ? 1 : .5));
    // verso la fine le monete valgono solo un punto ciascuna: si spende con più coraggio
    var f = greed(p) * (lotsLeft <= 3 ? 1.05 : 1) + (r - .5) * .3;
    var bid = Math.floor(w * f + (r > .7 ? 1 : 0));
    if (w < 1.5) bid = r < .5 ? 0 : 1;
    bid = Math.max(0, Math.min(bid, P.coins - Math.floor(reserve), P.coins));
    return { a: 'bid', b: bid };
  }
  return { decide: decide, worth: worth };
})();
if (typeof module !== 'undefined') module.exports = ALBot;
