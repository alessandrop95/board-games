// gioco: skyjo
// Skyjo: partite intere tra giocatori automatici (2-8 giocatori), nelle quattro combinazioni di varianti
// (classica, Skyjo Action, eliminazione, Action + eliminazione). Fallisce se una partita si blocca o dà errori.
var path = require('path'), SRC = path.join(__dirname, '../../src/skyjo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var N = +process.argv[2] || 10, bad = 0;
var MODES = [['classica', {}], ['Action', { action: true }], ['eliminazione', { elim: true }], ['Action + eliminazione', { action: true, elim: true }]];
function count(g) { return g.deck.length + g.disc.length + (g.drawn ? 1 : 0) + (g.pick ? g.pick.cards.length : 0) + g.players.reduce(function (s, P) { return s + P.grid.filter(Boolean).length; }, 0); }
function acount(g) { return g.adeck.length + g.adisc.length + g.arow.filter(function (k) { return k != null; }).length + g.players.reduce(function (s, P) { return s + P.acts.length; }, 0); }
MODES.forEach(function (md) {
  console.log('--- ' + md[0]);
  for (var n = 2; n <= 8; n++) {
    var fin = 0, stuck = 0, errs = 0, rounds = 0, turns = 0, cols = 0, dbl = 0, t0 = Date.now(), moves = 0, enderWins = 0, uses = {}, leak = 0, outs = 0;
    for (var k = 0; k < N; k++) {
      var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'b' + i, nick: 'Bot' + i, bot: true });
      var opts = { target: 100 }; for (var x in md[1]) opts[x] = md[1][x];
      var g = E.newGame(seats, opts), guard = 0, total = count(g);
      while (g.phase !== 'over' && guard++ < 40000) {
        var ps = E.pending(g); if (!ps.length && g.phase === 'scores') { E.forceNext(g); total = count(g); continue; } if (!ps.length) { stuck++; break; }
        var p = ps[0], a = B.decide(g, p);
        if (!a) { stuck++; console.log('bloccata', n, g.phase, JSON.stringify({ chain: g.chain, pick: g.pick, bonus: g.players[p].bonus })); break; }
        if (a.a === 'use') uses[g.players[p].acts[a.j].k] = (uses[g.players[p].acts[a.j].k] || 0) + 1;
        var err = E.act(g, p, a); moves++;
        if (err) { errs++; console.log('errore', n, JSON.stringify(a), err, g.chain, g.pick); break; }
        if (g.phase === 'play' || g.phase === 'reveal') { if (count(g) !== total) { leak++; console.log('carte perse', count(g), total, JSON.stringify(a)); total = count(g); } if (g.opts.action && acount(g) !== 27) { leak++; console.log('azioni perse', acount(g), JSON.stringify(a)); } }
        g.fx.forEach(function (e) { if (e.k === 'col' && e.n > (g._c || 0)) { cols++; g._c = e.n; } });
        if (g.roundRes && g._r !== g.round) { g._r = g.round; if (g.roundRes.doubled) dbl++; if (g.roundRes.lowest) enderWins++; outs += g.roundRes.out.length; }
      }
      if (g.phase === 'over') { fin++; if (g.opts.elim && g.winners.length === 1 && g.players.filter(function (P) { return !P.out; }).length > 1) { leak++; console.log('eliminazione: più di uno in gioco a fine partita'); } } else stuck++;
      rounds += g.round; turns += g.turnN;
    }
    console.log(n + ' giocatori: finite ' + fin + '/' + N + ' bloccate ' + stuck + ' errori ' + errs + ' | manche ' + (rounds / N).toFixed(1) + ' | turni/manche ' + (turns / rounds).toFixed(1) + ' | colonne ' + (cols / rounds).toFixed(2) + '/manche | chiude il più basso ' + Math.round(enderWins / rounds * 100) + '%, raddoppi ' + Math.round(dbl / rounds * 100) + '%' + (md[1].action ? ' | azioni ' + JSON.stringify(uses) : '') + ' | ms/mossa ' + ((Date.now() - t0) / moves).toFixed(2));
    if (fin < N || errs || leak) bad = 1;
  }
});
console.log(bad ? 'NO  qualche partita non è finita' : 'OK  tutte le partite finite senza errori');
process.exit(bad);
