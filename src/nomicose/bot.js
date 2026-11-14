/* ===== Nomi, cose, città: giocatori automatici =====
   Scrivono una parola alla volta nelle caselle vuote della loro squadra, prese dalle liste che conoscono
   (non sempre: per ogni casella c'è una probabilità di «non farsi venire in mente niente»). Se la squadra ha
   riempito tutto dicono stop. Nel controllo votano «sì» alle parole che conoscono e quasi sempre anche alle
   altre, se cominciano con la lettera giusta; poi sono pronti. */
var NCBot = (function () {
  var E = (typeof NCEngine !== 'undefined') ? NCEngine : require('./engine.js'), D = E.D;
  var SKILL = .78;
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  // le parole che il bot «sa» per questa casella (sempre le stesse nella manche: niente ripensamenti)
  function ideas(g, p, c) {
    var l = g.letter.toLowerCase(), list = D.CATS[c][1].filter(function (w) { return E.norm(w).charAt(0) === l; });
    if (!list.length || hash(g.round + ':' + g.letter + ':' + c + ':' + p) > SKILL) return [];
    var seed = hash(p + ':' + c + ':' + g.round);
    return list.map(function (w, i) { return { w: w, k: hash(seed + ':' + i) }; }).sort(function (a, b) { return a.k - b.k; }).map(function (x) { return x.w; });
  }
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase === 'review') {
      var keys = Object.keys(g.flags || {});
      for (var i = 0; i < keys.length; i++) {
        var f = g.flags[keys[i]], ft = +keys[i].split(':')[0], fc = keys[i].split(':')[1];
        if (ft === P.team || f.v[p] != null) continue;
        var w = g.rev.cells[ft][fc].w;
        return { a: 'vote', t: ft, c: fc, ok: E.known(w, fc) || (!E.known(w) && hash(w + p) < .75) };
      }
      return P.ready ? null : { a: 'ready' };
    }
    if (g.phase !== 'write') return null;
    var t = P.team, ans = g.ans[t] || {};
    // ogni bot comincia da una casella diversa: due bot della stessa squadra non si pestano i piedi
    var start = Math.floor(hash(p + ':' + g.round) * g.cats.length), mates = E.members(g, t);
    for (var k = 0; k < g.cats.length; k++) {
      var c = g.cats[(start + k) % g.cats.length];
      if (ans[c] && E.norm(ans[c].w)) continue;
      var opts = ideas(g, p, c).filter(function (w) { return !g.cats.some(function (c2) { return ans[c2] && E.same(ans[c2].w, w); }); });
      if (opts.length) return { a: 'w', c: c, w: opts[0] };
    }
    if (!g.stop && E.filled(g, t) === g.cats.length && mates.length) return { a: 'stop' };
    return null;
  }
  return { decide: decide, ideas: ideas };
})();
if (typeof module !== 'undefined') module.exports = NCBot;
