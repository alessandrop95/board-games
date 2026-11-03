// Skyjo: partite intere tra giocatori automatici (2-8 giocatori). Fallisce se una partita si blocca o dà errori.
var path = require('path'), SRC = path.join(__dirname, '../../src/skyjo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 10, bad = 0;
for (var n = 2; n <= 8; n++) {
  var fin = 0, stuck = 0, errs = 0, rounds = 0, turns = 0, cols = 0, dbl = 0, t0 = Date.now(), moves = 0, enderWins = 0;
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'b' + i, nick: 'Bot' + i, bot: true });
    var g = E.newGame(seats, { target: 100 }), guard = 0;
    while (g.phase !== 'over' && guard++ < 20000) {
      var ps = E.pending(g); if (!ps.length && g.phase === 'scores') { E.forceNext(g); continue; } if (!ps.length) { stuck++; break; }
      var p = ps[0], a = B.decide(g, p);
      if (!a) { stuck++; break; }
      var r0 = g.round, err = E.act(g, p, a); moves++;
      if (err) { errs++; console.log('errore', n, a, err); break; }
      g.fx.forEach(function (e) { if (e.k === 'col' && e.n > (g._c || 0)) { cols++; g._c = e.n; } });
      if (g.roundRes && g._r !== g.round) { g._r = g.round; if (g.roundRes.doubled) dbl++; if (g.roundRes.lowest) enderWins++; }
    }
    if (g.phase === 'over') fin++; else stuck++;
    rounds += g.round; turns += g.turnN;
  }
  console.log(n + ' giocatori: finite ' + fin + '/' + N + ' bloccate ' + stuck + ' errori ' + errs + ' | manche per partita ' + (rounds / N).toFixed(1) + ' | turni per manche ' + (turns / rounds).toFixed(1) + ' | colonne ' + (cols / rounds).toFixed(2) + '/manche | chi chiude è il più basso ' + Math.round(enderWins / rounds * 100) + '%, raddoppi ' + Math.round(dbl / rounds * 100) + '% | ms/mossa ' + ((Date.now() - t0) / moves).toFixed(2));
  if (fin < N || errs) bad = 1;
}
console.log(bad ? 'NO  qualche partita non è finita' : 'OK  tutte le partite finite senza errori');
process.exit(bad);
