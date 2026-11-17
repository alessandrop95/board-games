/* ===== La Miniera: giocatori automatici =====
   Guardano il rischio (quanti pericoli già visti possono ancora uscire) e quanto hanno in tasca: più è alto
   il bottino e il rischio, più è probabile che tornino. Ognuno ha un po' di coraggio diverso. */
var MNBot = (function () {
  var E = (typeof MNEngine !== 'undefined') ? MNEngine : require('./engine.js');
  function nerve(p) { return .55 + ((p * 37) % 10) / 20; }   // da 0,55 a 1: coraggio del giocatore
  function decide(g, p) {
    var P = g.players[p]; if (!P) return null;
    if (g.phase === 'camp') return P.ready ? null : { a: 'next' };
    if (g.phase !== 'choose' || !P.in || P.ch) return null;
    var risk = E.risk(g), ins = E.inside(g).length, floor = E.floor(g), idol = E.idolsOnPath(g);
    var stake = P.carry + Math.floor(floor / Math.max(1, ins)) * .5 + (idol && ins <= 2 ? 4 : 0);
    var danger = risk * (stake + 2) / nerve(p);
    if (g.exp === g.opts.exps && P.carry === 0) danger *= .5;                 // ultima spedizione a mani vuote: si rischia
    if (idol && ins === 1) danger += 3;                                       // da solo con un idolo per terra: si torna
    var back = danger > 2.2 + Math.random() * 1.8 || (P.carry >= 18 + Math.random() * 10 && risk > .1);
    return { a: back ? 'back' : 'go' };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = MNBot;
