// gioco: cabo
// Cabo: partite intere tra giocatori automatici (2-6 giocatori). Fallisce se una partita si blocca, dà errori
// o perde carte per strada.
var path = require('path'), SRC = path.join(__dirname, '../../src/cabo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 10, bad = 0;
function count(g) { return g.deck.length + g.disc.length + (g.drawn ? 1 : 0) + g.players.reduce(function (s, P) { return s + P.line.length; }, 0); }
for (var n = 2; n <= 6; n++) {
  var fin = 0, stuck = 0, errs = 0, rounds = 0, turns = 0, t0 = Date.now(), moves = 0, cabo = 0, caboOk = 0, deckEnd = 0, multi = 0, miss = 0, pw = {}, len = 0, lenN = 0;
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'b' + i, nick: 'Bot' + i, bot: true });
    var g = E.newGame(seats, { target: 100 }), guard = 0;
    while (g.phase !== 'over' && guard++ < 20000) {
      var ps = E.pending(g); if (!ps.length && g.phase === 'scores') { E.forceNext(g); continue; } if (!ps.length) { stuck++; break; }
      var p = ps[0], a = B.decide(g, p);
      if (!a) { stuck++; console.log('bloccata', n, g.phase); break; }
      if (a.a === 'peek' || a.a === 'spy' || a.a === 'trade') pw[a.a] = (pw[a.a] || 0) + 1;
      if ((a.a === 'swap' || a.a === 'take') && a.cells.length > 1) multi++;
      var before = g.fxN, err = E.act(g, p, a); moves++;
      if (err) { errs++; console.log('errore', n, JSON.stringify(a), err); break; }
      g.fx.forEach(function (e) { if (e.n > before && e.k === 'miss') miss++; });
      if (g.phase === 'play' && count(g) !== 52) { bad = 1; console.log('carte perse', count(g)); break; }
      if (g.roundRes && g._r !== g.round) { g._r = g.round; if (g.roundRes.caller != null) { cabo++; if (g.roundRes.callerOk) caboOk++; } if (g.roundRes.why === 'deck') deckEnd++; g.players.forEach(function (P) { len += P.line.length; lenN++; }); }
    }
    if (g.phase === 'over') fin++; else stuck++;
    rounds += g.round; turns += g.turnN;
  }
  console.log(n + ' giocatori: finite ' + fin + '/' + N + ' bloccate ' + stuck + ' errori ' + errs + ' | manche ' + (rounds / N).toFixed(1) + ' | turni/manche ' + (turns / rounds).toFixed(1) +
    ' | Cabo chiamato ' + Math.round(cabo / rounds * 100) + '% (riuscito ' + Math.round(caboOk / Math.max(1, cabo) * 100) + '%), mazzo finito ' + Math.round(deckEnd / rounds * 100) + '% | scambi multipli ' + multi + ' (sbagliati ' + miss + ') | poteri ' + JSON.stringify(pw) + ' | carte in fila a fine manche ' + (len / Math.max(1, lenN)).toFixed(1) + ' | ms/mossa ' + ((Date.now() - t0) / moves).toFixed(2));
  if (fin < N || errs) bad = 1;
}
console.log(bad ? 'NO  qualche partita non è finita' : 'OK  tutte le partite finite senza errori');
process.exit(bad);
