// Citadels: partite intere tra giocatori automatici (4-7 giocatori). Fallisce se una partita si blocca, dà errori o perde carte.
var path = require('path'), SRC = path.join(__dirname, '../../src/citadels/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 10, bad = 0;
function count(g) { return g.deck.length + g.players.reduce(function (s, P) { return s + P.hand.length + P.city.length; }, 0) + (g.turn && g.turn.drawn ? g.turn.drawn.length : 0); }
for (var n = 4; n <= 7; n++) {
  var fin = 0, stuck = 0, errs = 0, rounds = 0, moves = 0, lost = 0, t0 = Date.now(), win = {}, kills = 0, robs = 0, dest = 0, pts = 0;
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'b' + i + 'x' + k, nick: 'Bot' + i, bot: true });
    var g = E.newGame(seats, {}), guard = 0;
    while (g.phase !== 'over' && guard++ < 6000) {
      if (count(g) !== 68) { lost++; console.log('carte perse', count(g)); break; }
      var p = E.decider(g); if (p == null) { stuck++; console.log('bloccata', g.phase); break; }
      var a = B.decide(g, p); if (!a) { stuck++; console.log('nessuna mossa', g.phase, g.turn); break; }
      var err = E.act(g, p, a); moves++;
      if (err) { errs++; console.log('errore', n, JSON.stringify(a), err); break; }
      if (a.a === 'kill') kills++; if (a.a === 'rob') robs++; if (a.a === 'destroy') dest++;
    }
    if (g.phase === 'over') { fin++; pts += g.final.sc[g.final.order[0]].total; } else stuck++;
    rounds += g.round;
  }
  console.log(n + ' giocatori: finite ' + fin + '/' + N + ' bloccate ' + stuck + ' errori ' + errs + ' carte perse ' + lost + ' | round per partita ' + (rounds / N).toFixed(1) + ' | punti del vincitore ' + (pts / Math.max(1, fin)).toFixed(1) + ' | uccisioni ' + kills + ' furti ' + robs + ' distruzioni ' + dest + ' | ms/mossa ' + ((Date.now() - t0) / moves).toFixed(2));
  if (fin < N || errs || lost) bad = 1;
}
console.log(bad ? 'NO  qualche partita non è finita' : 'OK  tutte le partite finite senza errori');
process.exit(bad);
