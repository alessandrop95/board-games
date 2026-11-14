/* ===== Tiro alla fune di parole: giocatori automatici =====
   Conoscono solo le parole della loro lista: a ogni round cercano quelle che si possono fare con la griglia
   (ognuno ne «vede» una parte diversa) e le mandano una alla volta. Nelle contestazioni votano quasi sempre sì. */
var FNBot = (function () {
  var E = (typeof FNEngine !== 'undefined') ? FNEngine : require('./engine.js'), D = E.D;
  var cache = { grid: null, words: [] };
  function hash(s) { var h = 2166136261; for (var i = 0; i < s.length; i++) { h ^= s.charCodeAt(i); h = Math.imul(h, 16777619); } return (h >>> 0) / 4294967296; }
  function inGrid(grid) { if (cache.grid !== grid) { cache.grid = grid; cache.words = D.WORDS.filter(function (w) { return E.path(grid, w); }); } return cache.words; }
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase === 'review') {
      var keys = Object.keys(g.flags || {});
      for (var i = 0; i < keys.length; i++) { var f = g.flags[keys[i]], x = g.words[+keys[i]]; if (x.t !== P.team && f.v[p] == null) return { a: 'vote', i: +keys[i], ok: hash(x.w + p) < .7 }; }
      return P.ready ? null : { a: 'ready' };
    }
    if (g.phase !== 'play') return null;
    var mine = inGrid(g.grid).filter(function (w) { return hash(w + ':' + p + ':' + g.round) < .55 && !g.words.some(function (x) { return x.t === P.team && x.w === w; }); });
    if (!mine.length) return null;
    return { a: 'word', w: mine[Math.floor(Math.random() * mine.length)] };
  }
  return { decide: decide, inGrid: inGrid };
})();
if (typeof module !== 'undefined') module.exports = FNBot;
