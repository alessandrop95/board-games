// Machiavelli: partite intere tra giocatori automatici (2-5 giocatori). Fallisce se una partita si blocca o dà errori.
var path = require('path'), SRC = path.join(__dirname, '../../src/machiavelli/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 20, bad = 0;
for (var np = 2; np <= 5; np++) {
  var st = { games: 0, stuck: 0, errs: 0, turns: 0, out: 0, plays: 0, draws: 0, cards: 0, ms: 0, acts: 0, left: 0 };
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < np; i++) seats.push({ uid: 'b' + i, nick: 'B' + i, bot: true });
    var g = E.newGame(seats, {}), steps = 0;
    while (g.phase === 'play' && steps++ < 3000) {
      var t0 = Date.now(), a = B.decide(g, g.turn); st.ms += Date.now() - t0; st.acts++;
      if (a.a === 'play') { st.plays++; st.cards += a.t.reduce(function (s, x) { return s + x.length; }, 0) - g.table.reduce(function (s, x) { return s + x.c.length; }, 0); } else st.draws++;
      var e = E.act(g, g.turn, a); if (e) { st.errs++; if (st.errs < 3) console.log('ERR', e); E.act(g, g.turn, { a: 'draw' }); }
    }
    if (g.phase !== 'over') { st.stuck++; continue; }
    st.games++; st.turns += g.turnN; if (g.final.out) st.out++;
    g.players.forEach(function (P, i) { if (i !== g.winner) st.left += P.hand.length; });
  }
  var G = st.games || 1;
  console.log(np + ' giocatori: finite ' + st.games + '/' + N + ' bloccate ' + st.stuck + ' errori ' + st.errs + ' | turni ' + (st.turns / G).toFixed(0) + ' (' + (st.turns / G / np).toFixed(1) + ' giri)' +
    ' | finite per mano vuota ' + Math.round(100 * st.out / G) + '% | giocate ' + st.plays + ' pescate ' + st.draws + ' | carte per giocata ' + (st.cards / Math.max(1, st.plays)).toFixed(1) +
    ' | carte agli sconfitti ' + (st.left / G / (np - 1)).toFixed(1) + ' | ms/mossa ' + (st.ms / st.acts).toFixed(2));
  bad += st.stuck + st.errs;
}
console.log(bad ? 'NO  partite bloccate o con errori: ' + bad : 'OK  tutte le partite finite senza errori');
process.exit(bad ? 1 : 0);
