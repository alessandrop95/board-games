/* ===== Dadi del bugiardo: giocatori automatici =====
   Contano i propri dadi e stimano gli altri (ogni dado nascosto è un certo valore 1 volta su 6, o 1 su 3 con
   i jolly). Alzano sul valore che hanno di più; se la dichiarazione è troppo alta rispetto alla stima dubitano,
   e se è proprio quella stimata ogni tanto azzardano «Esatto!». Ognuno bluffa un po' diversamente. */
var LBBot = (function () {
  var E = (typeof LBEngine !== 'undefined') ? LBEngine : require('./engine.js');
  function mine(g, P, f) { return P.dice.filter(function (d) { return d === f || (g.opts.ones && f !== 1 && d === 1); }).length; }
  function expect(g, p, f) {
    var P = g.players[p], hidden = E.totalDice(g) - P.n, pr = g.opts.ones && f !== 1 ? 1 / 3 : 1 / 6;
    return mine(g, P, f) + hidden * pr;
  }
  function bold(p) { return ((p * 53) % 7) / 10 - .3; }   // da -0,3 a +0,3: chi bluffa e chi è prudente
  function decide(g, p) {
    var P = g.players[p]; if (!P || P.out) return null;
    if (g.phase === 'show') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'bid' || g.turn !== p) return null;
    var b = g.bid, tot = E.totalDice(g);
    if (b) {
      var ex = expect(g, p, b.f), over = b.q - ex;
      if (g.opts.exact && Math.abs(over) < .35 && Math.random() < .18) return { a: 'exact' };
      if (over > 1.3 - bold(p) + Math.random() * .8) return { a: 'doubt' };
    }
    // il rilancio migliore: il valore con la stima più alta rispetto alla quantità minima richiesta
    var best = null;
    for (var f = 1; f <= 6; f++) {
      var q = E.minQ(g, f, b); if (q > tot) continue;
      var e = expect(g, p, f), margin = e - q + bold(p) + (mine(g, P, f) ? .3 : 0);
      if (!b) q = Math.max(1, Math.min(tot, Math.floor(e - .5 + Math.random())));
      if (!b && g.opts.ones && f === 1) continue;
      if (!best || margin > best.m) best = { q: q, f: f, m: margin };
    }
    if (!best) return b ? { a: 'doubt' } : { a: 'bid', q: 1, f: 2 };
    if (b && best.m < -1.2 + Math.random() * .6) return { a: 'doubt' };
    return { a: 'bid', q: best.q, f: best.f };
  }
  return { decide: decide, expect: expect };
})();
if (typeof module !== 'undefined') module.exports = LBBot;
