// Binari d'Italia: partite intere tra giocatori automatici (2-5 giocatori). Fallisce se una partita si blocca o dà errori.
var fs = require('fs'), path = require('path'), SRC = path.join(__dirname, '../../src/binari-italia/');
global.window = global;
['data', 'engine', 'bot'].forEach(function (f) { eval(fs.readFileSync(SRC + f + '.js', 'utf8').replace(/^var (BI\w+)/m, 'global.$1')); });
var D = BIData, E = BIEngine, B = BIBot;
var N = +process.argv[2] || 8, bad = 0, stats = {};
for (var np = 2; np <= 5; np++) {
  var st = { games: 0, stuck: 0, errs: 0, rounds: 0, top: 0, low: 0, tk: 0, tkOk: 0, endBy: 0, ms: 0, acts: 0, trainsLeft: 0, claimed: 0, tkNeg: 0 };
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < np; i++) seats.push({ uid: 'b' + i, nick: 'B' + i, bot: true });
    var g = E.newGame(seats, {}), steps = 0;
    while (g.phase === 'play' && steps++ < 2500) {
      var d = g.stage === 'setup' ? E.decider(g) : g.turn;
      var t0 = Date.now(), a = B.decide(g, d); st.ms += Date.now() - t0; st.acts++;
      var e = E.act(g, d, a);
      if (e) { st.errs++; if (st.errs < 4) console.log('ERR', e, JSON.stringify(a), g.stage); var a2 = E.canDrawAny(g, g.stage === 'draw2') ? { a: 'draw', i: 'deck' } : { a: 'pass' }; if (E.act(g, d, a2)) E.act(g, d, { a: 'tickets' }); }
    }
    if (g.phase !== 'over') { st.stuck++; continue; }
    st.games++; st.rounds += g.round;
    var rows = g.final.rows, sc = rows.map(function (r) { return r.total; });
    st.top += Math.max.apply(null, sc); st.low += Math.min.apply(null, sc);
    rows.forEach(function (r) { st.tk += r.tickets.length; st.tkOk += r.done; st.tkNeg += r.tickets.length - r.done; st.trainsLeft += g.players[r.p].trains; });
    st.claimed += Object.keys(g.claims).length;
  }
  var G = st.games || 1;
  console.log(np + ' giocatori: finite ' + st.games + '/' + N + ' bloccate ' + st.stuck + ' errori ' + st.errs + ' | giri ' + (st.rounds / G).toFixed(1) +
    ' | vincitore ' + (st.top / G).toFixed(0) + ' ultimo ' + (st.low / G).toFixed(0) + ' | biglietti/giocatore ' + (st.tk / G / np).toFixed(1) + ' completati ' + (100 * st.tkOk / Math.max(1, st.tk)).toFixed(0) + '%' +
    ' | tratte prese ' + (st.claimed / G).toFixed(0) + '/83 | vagoni avanzati ' + (st.trainsLeft / G / np).toFixed(1) + ' | ms/mossa ' + (st.ms / st.acts).toFixed(1));
  bad += st.stuck + st.errs;
}
console.log(bad ? 'NO  partite bloccate o con errori: ' + bad : 'OK  tutte le partite finite senza errori');
process.exit(bad ? 1 : 0);
