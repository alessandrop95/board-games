/* ===== Disegna e indovina: giocatori automatici =====
   Non disegnano (i turni di disegno sono solo delle persone), ma indovinano: ogni tanto scrivono una risposta,
   e più il disegno va avanti più è probabile che sia quella giusta. Nel «ruba» ci provano una volta o due.
   Se una persona è assente e tocca a lei disegnare, l'automatico sceglie la parola facile e passa. */
var DGBot = (function () {
  var E = (typeof DGEngine !== 'undefined') ? DGEngine : require('./engine.js'), D = E.D;
  function decide(g, p, now) {
    now = now || Date.now();
    var P = g.players[p]; if (!P || !P.bot) return null;
    if (p === g.drawer) { if (g.phase === 'choose') return { a: 'choose', i: 0 }; if (g.phase === 'draw' && now - g.start > 4000) return { a: 'skip' }; return null; }
    if (!E.canGuess(g, p)) return null;
    var f = g.phase === 'draw' ? Math.max(0, Math.min(1, (now - g.start) / (g.opts.time * 1000))) : .5;
    var chance = g.phase === 'draw' ? .08 + .5 * f : .3;
    // il disegno vuoto non si indovina
    if (!g.pic.s.length && g.phase === 'draw' && f < .5) chance = 0;
    if (Math.random() < chance) return { a: 'guess', w: g.word };
    var pool = Math.random() < .6 ? D.EASY : D.HARD, w = pool[Math.floor(Math.random() * pool.length)];
    if (E.right(w, g.word)) return null;
    return { a: 'guess', w: w };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = DGBot;
