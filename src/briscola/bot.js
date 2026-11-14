/* ===== Briscola: giocatori automatici =====
   Di mano: un liscio basso (mai un carico se si può evitare), poi la briscola più piccola.
   Dopo: se la mano è del compagno «caricano» quando sono gli ultimi a giocare, altrimenti lisciano;
   se è degli avversari provano a prenderla nel seme se conviene, con la briscola più piccola se ci sono
   punti in palio (10 o più), altrimenti lasciano la carta che vale meno. In 4 fanno anche qualche segno. */
var BRBot = (function () {
  var E = (typeof BREngine !== 'undefined') ? BREngine : require('./engine.js');
  function low(cards, bs) {
    // la carta «più povera»: pochi punti, non briscola, bassa
    return cards.slice().sort(function (a, b) { return (E.pts(a) + (E.suit(a) === bs ? 12 : 0) + E.power(a) / 20) - (E.pts(b) + (E.suit(b) === bs ? 12 : 0) + E.power(b) / 20); })[0];
  }
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play' || g.turn !== p) return null;
    var bs = E.suit(g.bris), hand = P.hand, n = g.players.length;
    if (!g.trick.length) return { a: 'play', c: low(hand, bs) };
    var w = E.winner(g.trick, bs), mate = E.team(g, w) === E.team(g, p), lastToPlay = g.trick.length === n - 1;
    var onTable = E.sum(g.trick.map(function (x) { return x.c; }));
    var beats = hand.filter(function (c) { return E.winner(g.trick.concat([{ p: p, c: c }]), bs) === p; });
    if (mate) {
      if (lastToPlay || n === 2) { var rich = hand.filter(function (c) { return E.suit(c) !== bs; }).sort(function (a, b) { return E.pts(b) - E.pts(a); })[0]; if (rich != null && E.pts(rich) > 0) return { a: 'play', c: rich }; }
      return { a: 'play', c: low(hand, bs) };
    }
    // si prende nel seme senza briscola, se porta punti o non costa niente
    var inSuit = beats.filter(function (c) { return E.suit(c) !== bs; }).sort(function (a, b) { return E.pts(b) - E.pts(a); });
    if (inSuit.length && (onTable + E.pts(inSuit[0]) > 0)) return { a: 'play', c: inSuit[0] };
    var trumps = beats.filter(function (c) { return E.suit(c) === bs; }).sort(function (a, b) { return E.power(a) - E.power(b); });
    if (trumps.length && (onTable >= 10 || (lastToPlay && onTable >= 4 && E.pts(trumps[0]) === 0))) return { a: 'play', c: trumps[0] };
    return { a: 'play', c: low(hand, bs) };
  }
  // un segno al compagno all'inizio della mano (solo se ha qualcosa da dire)
  function sign(g, p) {
    if (g.players.length !== 4 || !g.opts.signs || g.signs[p]) return null;
    var bs = E.suit(g.bris), h = g.players[p].hand;
    if (h.indexOf(bs * 10) >= 0) return { a: 'sign', k: 'asso' };
    if (h.indexOf(bs * 10 + 2) >= 0) return { a: 'sign', k: 'tre' };
    if (!h.some(function (c) { return E.suit(c) === bs; })) return { a: 'sign', k: 'nulla' };
    return null;
  }
  return { decide: decide, sign: sign };
})();
if (typeof module !== 'undefined') module.exports = BRBot;
