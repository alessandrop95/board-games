/* ===== Vocabolario bugiardo: giocatori automatici =====
   Scrivono una definizione inventata dello stesso tipo della parola (sostantivo, verbo o aggettivo), scelta tra
   quelle che conoscono e diversa da quelle degli altri automatici. Al voto indovinano quella vera circa 4 volte su
   10; le altre volte votano a caso una definizione che non è la loro. A fine manche sono subito pronti. */
var VBBot = (function () {
  var E = (typeof VBEngine !== 'undefined') ? VBEngine : require('./engine.js'), D = E.D;
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'write') {
      if (P.def) return null;
      var list = D.FAKE[E.word(g)[1]], taken = g.players.map(function (Q) { return Q.def; });
      var free = list.filter(function (t) { return taken.indexOf(t) < 0; });
      if (!free.length) free = list;
      return { a: 'def', t: free[Math.floor(hash(g.round + ':' + p + ':' + g.word) * free.length)] };
    }
    if (g.phase === 'vote') {
      if (P.vote != null || !E.canVote(g, p)) return null;
      var opts = g.defs.map(function (d, i) { return i; }).filter(function (i) { return g.defs[i].by.indexOf(p) < 0; });
      var real = opts.filter(function (i) { return g.defs[i].real; })[0], r = hash(p + ':' + g.round + ':v');
      if (real != null && r < .42) return { a: 'vote', i: real };
      var fakes = opts.filter(function (i) { return !g.defs[i].real; });
      if (!fakes.length) return { a: 'vote', i: real };
      return { a: 'vote', i: fakes[Math.floor(hash(p + ':' + g.round + ':w') * fakes.length)] };
    }
    if (g.phase === 'reveal') return P.ready ? null : { a: 'next' };
    return null;
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = VBBot;
