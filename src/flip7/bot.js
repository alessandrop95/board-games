/* ===== Flip 7: giocatori automatici =====
   Contano le carte rimaste nel mazzo (come farebbe un giocatore attento) e confrontano il rischio di sballare
   con quello che guadagnerebbero pescando. Ognuno ha un pizzico di carattere: c'è chi rischia di più e chi meno.
   Le azioni vanno a chi fa più paura: si congela chi ha tanti punti sul tavolo, si dà Flip Three a chi rischia di più. */
var F7Bot = (function () {
  var E = (typeof F7Engine !== 'undefined') ? F7Engine : require('./engine.js');
  function pool(g) { return g.deck.length ? g.deck : g.disc; }
  function risk(g, P) { var d = pool(g); if (!d.length) return 0; var b = 0; d.forEach(function (c) { if (E.isNum(c) && P.nums.indexOf(c) >= 0) b++; }); return b / d.length; }
  // quanto vale in media la prossima carta, se non fa sballare
  function gain(g, P) {
    var d = pool(g), s = 0, n = 0, dbl = P.mods.indexOf('x2') >= 0 ? 2 : 1;
    d.forEach(function (c) {
      if (E.isNum(c)) { if (P.nums.indexOf(c) < 0) { s += c * dbl + (P.nums.length === 6 ? 15 + E.score(P) * 0 : 0); n++; } }
      else if (E.isMod(c)) { s += c === 'x2' ? P.nums.reduce(function (a, b) { return a + b; }, 0) : +c.slice(1); n++; }
      else { s += 2; n++; }
    });
    return n ? s / n : 0;
  }
  function trait(P) { var h = 0; for (var i = 0; i < P.uid.length; i++) h = (h * 31 + P.uid.charCodeAt(i)) % 997; return (h % 7 - 3) * 0.025; }   // da −0.075 a +0.075
  function leader(g, p) { var b = -1, bi = -1; g.players.forEach(function (P, i) { if (i !== p && P.total > b) { b = P.total; bi = i; } }); return bi; }
  function shouldHit(g, p) {
    var P = g.players[p], cur = E.score(P);
    if (!P.nums.length && !P.mods.length) return true;
    var r = P.sc ? risk(g, P) * 0.15 : risk(g, P), gn = gain(g, P);
    // una volta a 6 numeri diversi il Flip 7 vale 15 punti in più (e chiude la manche)
    if (P.nums.length === 6) gn += 15 * (1 - r);
    // fine partita: se fermarsi basta per vincere, ci si ferma
    var need = g.opts.target - P.total;
    if (cur >= need && g.players.every(function (Q, i) { return i === p || Q.total + E.score(Q) < P.total + cur || !E.active(Q); })) return false;
    // se qualcuno sta per vincere bisogna osare
    var L = leader(g, p), bold = L >= 0 && g.players[L].total + E.score(g.players[L]) >= g.opts.target && g.players[L].total > P.total + cur ? 0.12 : 0;
    var edge = (1 - r) * (cur + gn) - cur;   // guadagno atteso pescando
    var lim = gn / Math.max(1, cur + gn) + trait(P) + bold;
    return r < lim && edge > -1;
  }
  // a chi dare una carta azione
  function pick(g, p, c, opts) {
    var me = g.players[p], best = null;
    opts.forEach(function (i) {
      var P = g.players[i], cur = E.score(P), r = risk(g, P), v;
      if (c === 'FRZ') {
        if (i === p) v = r > 0.3 && cur >= 20 ? cur * r : -50;    // congelarsi conviene solo se si rischia molto
        else v = cur * 0.6 + P.total * 0.08 + P.nums.length * 2 + (P.sc ? 4 : 0);
      } else if (c === 'F3') {
        if (i === p) v = r < 0.12 && P.nums.length < 4 ? 5 - cur * 0.1 : -40;
        else v = r * (cur + 10) * 1.4 + P.total * 0.05 + (P.sc ? -8 : 0);
      } else {   // Seconda possibilità: a chi fa meno paura
        v = -(P.total + cur) + Math.random();
      }
      v += Math.random() * 0.5;
      if (!best || v > best.v) best = { i: i, v: v };
    });
    if (me && best == null) return opts[0];
    return best.i;
  }
  function decide(g, p) {
    var P = g.players[p];
    if (g.phase === 'scores') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'play') return null;
    if (g.choice) return g.choice.p === p ? { a: 'target', t: pick(g, p, g.choice.c, g.choice.opts) } : null;
    if (g.stage !== 'turn' || g.turn !== p) return null;
    return shouldHit(g, p) ? { a: 'hit' } : { a: 'stay' };
  }
  return { decide: decide, risk: risk, gain: gain };
})();
if (typeof module !== 'undefined') module.exports = F7Bot;
