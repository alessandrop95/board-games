/* ===== Dadi e rischio: giocatori automatici =====
   Mettono da parte i valori più alti; se si fermano prendono tutto quello che possono. Tirano ancora quando il
   guadagno atteso supera il rischio di perdere il piatto (la probabilità di sballare è esatta: (valori presi / 6)
   elevato ai dadi rimasti). Chi è indietro rischia di più, chi è in testa di meno; all'ultimo giro chi insegue
   tira finché non ha superato il primo. Ognuno ha un carattere un po' diverso. */
var DRBot = (function () {
  var E = (typeof DREngine !== 'undefined') ? DREngine : require('./engine.js');
  function style(p) { return ((p * 37) % 9) / 10 - .4; }   // da -0,4 (prudente) a +0,4 (spericolato)
  // guadagno medio di un tiro riuscito con «free» dadi e la fila «kept»
  function gainIfOk(kept, free) {
    var miss = 6 - kept.length, avail = []; for (var v = 1; v <= 6; v++) if (kept.indexOf(v) < 0) avail.push(v);
    if (!free || !miss) return 0;
    var avg = avail.reduce(function (t, x) { return t + x; }, 0) / avail.length;
    return avg + (free >= 3 ? 2 : 0);
  }
  function plan(g, p) {
    var nw = E.fresh(g), P = g.players[p], kept = g.kept;
    var takeAll = nw.slice(), allKept = kept.concat(takeAll);
    // tutti i valori nuovi completano la fila: bonus e cinque dadi di nuovo, si tira sempre
    if (allKept.length === E.DICE) return { vals: takeAll, go: true };
    // da tenere se si continua: il più alto, più i 5 e i 6 finché restano almeno 2 dadi
    var keep = [nw[0]];
    for (var i = 1; i < nw.length; i++) if (nw[i] >= 5 && E.DICE - kept.length - keep.length - 1 >= 2) keep.push(nw[i]);
    var k2 = kept.concat(keep), free = E.DICE - k2.length, risk = E.bustChance(k2);
    var potGo = g.pot + E.sum(keep), potStop = g.pot + E.sum(takeAll);
    // situazione della partita
    var others = g.players.filter(function (Q, i) { return i !== p; }).map(function (Q) { return Q.score; });
    var lead = others.length ? Math.max.apply(null, others) : 0, target = g.opts.target;
    var bold = style(p) + (lead - P.score) / target * 1.2 - (P.score - lead) / target * .6;
    if (g.lastRound && P.score + potStop <= lead) return { vals: keep, go: true };    // ultimo giro: o sorpasso o niente
    if (P.score + potStop >= target && P.score + potStop > lead + 10 && !g.lastRound) bold -= .5;
    var gain = gainIfOk(k2, free) * (1 + bold), ev = (1 - risk) * gain - risk * potGo * (1 - bold * .5);
    if (g.pot === 0 && risk < .5) return { vals: keep, go: true };
    return ev > 0 ? { vals: keep, go: true } : { vals: takeAll, go: false };
  }
  function decide(g, p) {
    if (g.phase === 'over' || g.turn !== p) return null;
    if (g.phase === 'roll') return { a: 'roll' };
    if (g.phase !== 'pick') return null;
    var pl = plan(g, p), used = [], d = [];
    pl.vals.forEach(function (v) { for (var i = 0; i < g.dice.length; i++) if (g.dice[i] === v && used.indexOf(i) < 0) { used.push(i); d.push(i); return; } });
    return { a: 'pick', d: d, go: pl.go };
  }
  return { decide: decide, plan: plan };
})();
if (typeof module !== 'undefined') module.exports = DRBot;
