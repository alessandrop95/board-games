// Catan: partite intere tra giocatori automatici (3 e 4 giocatori). Fallisce se una partita si blocca o dà errori.
var path = require('path'), SRC = path.join(__dirname, '../../src/catan/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 20, bad = 0, verbose = process.argv[3] === 'v';
[3, 4].forEach(function (np) {
  var st = { games: 0, stuck: 0, errs: 0, turns: 0, lr: 0, la: 0, devs: 0, trades: 0, bank: 0, cities: 0, ms: 0, acts: 0, sevens: 0, wins: [] };
  for (var k = 0; k < N; k++) {
    var seats = []; for (var i = 0; i < np; i++) seats.push({ uid: 'b' + i, nick: 'B' + i, bot: true });
    var g = E.newGame(seats, {}), steps = 0;
    while (g.phase === 'play' && steps++ < 6000) {
      if (g.trade) {   // risposte alle proposte
        g.players.forEach(function (P, q) { var r = B.respond(g, q); if (r) E.act(g, q, r); });
      }
      var list = g.stage === 'discard' ? g.players.map(function (P, q) { return E.mustDiscard(g, q) ? q : -1; }).filter(function (q) { return q >= 0; }) : [E.decider(g)];
      list.forEach(function (d) {
        var t0 = Date.now(), a = B.decide(g, d, {}); st.ms += Date.now() - t0; st.acts++;
        if (!a) { st.errs++; if (verbose) console.log('nessuna mossa', g.stage, d); return; }
        if (a.a === 'play') st.devs++; if (a.a === 'deal') st.trades++; if (a.a === 'bank') st.bank++;
        var e = E.act(g, d, a);
        if (a.a === 'roll' && g.dice && g.dice[0] + g.dice[1] === 7) st.sevens++;
        if (e) { st.errs++; if (st.errs < 4 || verbose) console.log('ERR', e, JSON.stringify(a), g.stage); var alt = g.stage === 'main' ? { a: 'end' } : g.stage === 'roll' ? { a: 'roll' } : g.stage === 'road2' ? { a: 'endroads' } : null; if (alt) E.act(g, d, alt); }
      });
    }
    if (g.phase !== 'over') { st.stuck++; if (verbose) console.log('BLOCCATA', g.stage, g.turnN); continue; }
    st.games++; st.turns += g.turnN; if (g.lr != null) st.lr++; if (g.la != null) st.la++;
    for (var v in g.vown) if (g.vown[v].city) st.cities++;
    st.wins.push(E.vp(g, g.winner));
  }
  var G = st.games || 1;
  console.log(np + ' giocatori: finite ' + st.games + '/' + N + ' bloccate ' + st.stuck + ' errori ' + st.errs + ' | turni ' + (st.turns / G).toFixed(0) + ' (' + (st.turns / G / np).toFixed(1) + ' giri)' +
    ' | strada più lunga ' + Math.round(100 * st.lr / G) + '% · esercito ' + Math.round(100 * st.la / G) + '% | città/partita ' + (st.cities / G).toFixed(1) + ' | carte giocate ' + (st.devs / G).toFixed(1) +
    ' | scambi tra giocatori ' + (st.trades / G).toFixed(1) + ' · con la banca ' + (st.bank / G).toFixed(1) + ' | 7 usciti ' + (st.sevens / G).toFixed(1) + ' | ms/mossa ' + (st.ms / st.acts).toFixed(2));
  bad += st.stuck + st.errs;
});
console.log(bad ? 'NO  partite bloccate o con errori: ' + bad : 'OK  tutte le partite finite senza errori');
process.exit(bad ? 1 : 0);
