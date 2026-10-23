/* ===== Gattomina: giocatori automatici ===== */
var GMBot = (function () {
  var D = (typeof GMData !== 'undefined') ? GMData : require('./engine.js').GMData;
  var E = (typeof GMEngine !== 'undefined') ? GMEngine : require('./engine.js').GMEngine;
  var T = D.TYPES;
  function ty(c) { return E.ty(c); }
  function has(H, t) { return H.filter(function (c) { return ty(c) === t; }); }
  function pickTarget(s, p) {
    var tg = E.targets(s, p); if (!tg.length) return null;
    tg.sort(function (a, b) { return s.players[b].hand.length - s.players[a].hand.length; }); // chi ha più carte
    return tg[0];
  }
  // valore di una carta per chi la tiene (più basso = più facile da cedere)
  function worth(c) { var t = ty(c); return { scatoletta: 100, soffio: 40, agguato: 35, pisolino: 30, sfera: 25, gomitolo: 22, fusa: 20 }[t] || 5; }

  // risposta a una carta giocata (finestra dei Soffio!)
  function wantNope(s, p) {
    var f = s.pend; if (!f || !E.canNope(s, p)) return false;
    var cancelled = f.chain.length % 2 === 1;
    var mine = f.by === p;
    if (mine && cancelled) return Math.random() < .75;             // difende la propria carta
    if (cancelled) return false;
    var againstMe = f.target === p || (f.kind === 'agguato' && E.nextAlive(s, f.by) === p);
    if (againstMe) return Math.random() < (f.kind === 'agguato' ? .7 : .55);
    return Math.random() < .06;
  }
  function decide(s, p) {
    if (s.phase !== 'play') return null;
    if (s.pend) return wantNope(s, p) ? { a: 'nope' } : null;
    var w = s.wait;
    if (w && w.who === p) {
      if (w.type === 'favor') { var H = s.players[p].hand.slice().sort(function (a, b) { return worth(a) - worth(b); }); return { a: 'give', card: H[0] }; }
      if (w.type === 'insert') {
        var n = s.deck.length, nx = E.nextAlive(s, p);
        // di solito in cima o quasi, così il prossimo rischia; ogni tanto a caso
        return { a: 'insert', pos: Math.random() < .55 ? Math.min(n, Math.floor(Math.random() * 2)) : 'rand' };
      }
      if (w.type === 'five') {
        var pool = s.disc.slice().sort(function (a, b) { return worth(b) - worth(a); });
        return { a: 'take', card: pool[0] };
      }
      return null;
    }
    if (s.turn !== p) return null;
    var P = s.players[p], Hh = P.hand;
    var bombs = E.bombsLeft(s), risk = bombs / Math.max(1, s.deck.length), defused = has(Hh, 'scatoletta').length > 0;
    var topIsBomb = s.peek && s.peek.p === p && s.peek.cards.length && ty(s.peek.cards[0]) === 'bomba';
    // so che in cima c'è una Gattomina: scappo
    if (topIsBomb) {
      var esc = has(Hh, 'agguato')[0] || has(Hh, 'pisolino')[0] || has(Hh, 'gomitolo')[0];
      if (esc != null) return { a: 'play', cards: [esc] };
      if (!defused) { var tg0 = pickTarget(s, p); if (tg0 != null && has(Hh, 'fusa').length) return { a: 'play', cards: [has(Hh, 'fusa')[0]], target: tg0 }; }
    }
    var safeTop = s.peek && s.peek.p === p && s.peek.cards.length && ty(s.peek.cards[0]) !== 'bomba';
    // coppie e tris di mici per rubare
    var groups = {};
    Hh.forEach(function (c) { var t = ty(c); if (T[t].k === 'cat') (groups[t] = groups[t] || []).push(c); });
    var tgt = pickTarget(s, p);
    for (var t in groups) {
      if (tgt == null) break;
      if (groups[t].length >= 3 && Math.random() < .6) return { a: 'play', cards: groups[t].slice(0, 3), target: tgt, name: 'scatoletta' };
      if (groups[t].length >= 2 && Math.random() < .55) return { a: 'play', cards: groups[t].slice(0, 2), target: tgt };
    }
    if (!safeTop && risk > .14 && has(Hh, 'sfera').length && !(s.peek && s.peek.p === p) && Math.random() < .5) return { a: 'play', cards: [has(Hh, 'sfera')[0]] };
    if (!safeTop && !defused && risk > .18) {
      var out = has(Hh, 'agguato')[0] || has(Hh, 'pisolino')[0];
      if (out != null && Math.random() < .7) return { a: 'play', cards: [out] };
    }
    if (tgt != null && has(Hh, 'fusa').length && Math.random() < .35) return { a: 'play', cards: [has(Hh, 'fusa')[0]], target: tgt };
    return { a: 'draw' };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = GMBot;
