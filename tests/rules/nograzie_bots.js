// gioco: nograzie
// No Grazie!: partite intere tra giocatori automatici (3-7 giocatori). Fallisce se una partita si blocca, dà
// errori, perde carte o gettoni.
var path = require('path'), SRC = path.join(__dirname, '../../src/nograzie/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 20, bad = 0;
for (var n = 3; n <= 7; n++) {
  var fin = 0, errs = 0, moves = 0, score = 0, best = 0, passes = 0, takes = 0, potSum = 0, t0 = Date.now();
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'b' + i, nick: 'Bot' + i, bot: true });
    var g = E.newGame(seats, { rounds: 1 }), guard = 0, chips = E.chipsFor(n) * n;
    while (g.phase !== 'over' && guard++ < 5000) {
      var ps = E.pending(g); if (!ps.length) { E.forceNext(g); continue; }
      var p = ps[0], a = B.decide(g, p);
      if (a.a === 'pass') passes++; else if (a.a === 'take') { takes++; potSum += g.pot; }
      var err = E.act(g, p, a); moves++;
      if (err) { errs++; console.log('errore', n, JSON.stringify(a), err); break; }
      var c = g.players.reduce(function (s, P) { return s + P.chips; }, 0) + g.pot;
      var cards = g.players.reduce(function (s, P) { return s + P.cards.length; }, 0) + g.deck.length + (g.cur != null ? 1 : 0) + g.removed.length;
      if (c !== chips || cards !== 33) { bad = 1; console.log('gettoni o carte persi', c, cards); break; }
    }
    if (g.phase === 'over') fin++;
    score += g.players.reduce(function (s, P) { return s + P.total; }, 0) / n; best += g.players[g.winners[0]].total;
  }
  console.log(n + ' giocatori: finite ' + fin + '/' + N + ' errori ' + errs + ' | punti medi ' + (score / N).toFixed(1) + ', del vincitore ' + (best / N).toFixed(1) + ' | «no grazie» per carta ' + (passes / takes).toFixed(1) + ', gettoni presi con la carta ' + (potSum / takes).toFixed(1) + ' | ms/mossa ' + ((Date.now() - t0) / moves).toFixed(3));
  if (fin < N || errs) bad = 1;
}
console.log(bad ? 'NO  qualche partita non è finita' : 'OK  tutte le partite finite senza errori');
process.exit(bad);
