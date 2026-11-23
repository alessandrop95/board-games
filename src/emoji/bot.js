/* ===== Emoji in scena: giocatori automatici =====
   Da registi scelgono il titolo facile o quello difficile e raccontano con l'indizio già pronto, un'emoji alla volta.
   Da compagni (o, nei secondi per rubare, da avversari) provano a indovinare: più emoji ci sono e più tempo è passato,
   più è facile che scrivano la risposta giusta; altrimenti scrivono un altro titolo della stessa categoria. */
var ESBot = (function () {
  var E = (typeof ESEngine !== 'undefined') ? ESEngine : require('./engine.js'), D = E.D;
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function tokens(it) { return it[3].split(' '); }
  // probabilità che il prossimo tentativo sia giusto
  function chance(g, p, now) {
    var it = E.item(g), full = tokens(it).length, shown = Math.min(1, g.clue.length / full);
    if (!g.clue.length) return 0;
    var spent = g.phase === 'steal' ? 1 : Math.min(1, (now - g.start) / (g.opts.time * 1000));
    var base = g.phase === 'steal' ? .07 : .02 + .11 * spent;
    return Math.min(.85, base * (.4 + shown) * (it[2] > 1 ? .75 : 1) * (.8 + hash(p + ':' + g.turn) * .4));
  }
  function decoy(g, p) {
    var it = E.item(g), tries = g.guesses.map(function (x) { return E.norm(x.t); });
    var same = D.ITEMS.filter(function (x) { return x[1] === it[1] && x[0] !== it[0] && tries.indexOf(E.norm(x[0])) < 0; });
    if (!same.length) return null;
    return same[Math.floor(hash(p + ':' + g.turn + ':' + g.guesses.length) * same.length)][0];
  }
  function decide(g, p, now) {
    now = now || Date.now();
    var P = g.players[p]; if (!P || g.phase === 'over') return null;
    if (p === g.regista) {
      if (g.phase === 'pick') return { a: 'pick', i: hash(p + ':' + g.turn) < .55 ? 0 : 1 };
      if (g.phase !== 'play') return null;
      var tk = tokens(E.item(g));
      if (g.clue.length < tk.length) return { a: 'emo', e: tk[g.clue.length] };
      // segna con il fuoco una risposta vicina, se c'è
      for (var k = g.guesses.length - 1; k >= 0; k--) if (g.guesses[k].near && !g.guesses[k].m) return { a: 'mark', i: k, m: 'hot' };
      return null;
    }
    if (!E.canGuess(g, p)) return null;
    if (Math.random() < chance(g, p, now)) return { a: 'guess', t: E.item(g)[0] };
    var d = decoy(g, p);
    return d ? { a: 'guess', t: d } : null;
  }
  return { decide: decide, chance: chance };
})();
if (typeof module !== 'undefined') module.exports = ESBot;
