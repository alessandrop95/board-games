// Flip 7: partite intere tra giocatori automatici (2-8 giocatori). Fallisce se una partita si blocca, dà errori o perde carte.
var path = require('path'), SRC = path.join(__dirname, '../../src/flip7/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 10, bad = 0;
function count(g) { if (g.stage === 'end') return g.deck.length + g.disc.length; return g.deck.length + g.disc.length + g.players.reduce(function (s, P) { return s + P.nums.length + P.mods.length + (P.sc ? 1 : 0) + (P.st === 'bust' && P.bustCard != null ? 1 : 0); }, 0) + (g.choice ? 1 : 0) + (g.f3 ? g.f3.held.length : 0) + g.todo.length; }
for (var n = 2; n <= 8; n++) {
  var fin = 0, stuck = 0, errs = 0, rounds = 0, moves = 0, f7 = 0, busts = 0, lost = 0, t0 = Date.now(), outs = 0;
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'b' + i + 'x' + k, nick: 'Bot' + i, bot: true });
    var g = E.newGame(seats, { target: 200 }), guard = 0;
    while (g.phase !== 'over' && guard++ < 20000) {
      if (count(g) !== 94) { lost++; console.log('carte perse', count(g)); break; }
      var ps = E.pending(g); if (!ps.length && g.phase === 'scores') { E.forceNext(g); continue; } if (!ps.length) { stuck++; console.log('bloccata', g.stage, g.phase); break; }
      var p = ps[0], a = B.decide(g, p);
      if (!a) { stuck++; break; }
      var err = E.act(g, p, a); moves++;
      if (err) { errs++; console.log('errore', n, a, err); break; }
      if (g.roundRes && g._r !== g.round) { g._r = g.round; if (g.roundRes.f7 != null) f7++; busts += g.roundRes.st.filter(function (s) { return s === 'bust'; }).length; outs += n; }
    }
    if (g.phase === 'over') fin++; else stuck++;
    rounds += g.round;
  }
  console.log(n + ' giocatori: finite ' + fin + '/' + N + ' bloccate ' + stuck + ' errori ' + errs + ' carte perse ' + lost + ' | manche per partita ' + (rounds / N).toFixed(1) + ' | Flip 7 nel ' + Math.round(f7 / rounds * 100) + '% delle manche | sballa il ' + Math.round(busts / outs * 100) + '% | ms/mossa ' + ((Date.now() - t0) / moves).toFixed(2));
  if (fin < N || errs || lost) bad = 1;
}
console.log(bad ? 'NO  qualche partita non è finita' : 'OK  tutte le partite finite senza errori');
process.exit(bad);
