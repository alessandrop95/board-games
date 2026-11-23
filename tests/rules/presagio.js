// gioco: presagio
// Prove delle previsioni di Wizard (a turno e coperte, tutti insieme) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/presagio/');
var M = require(SRC + 'engine.js'), E = M.PREngine;
global.PRData = M.PRData; global.PREngine = E;
var B = require(SRC + 'bot.js');
var ok = 0, ko = 0; function t(n, c) { if (c) ok++; else { ko++; console.log('NO', n); } }
function seats(k, bots) { var a = []; for (var i = 0; i < k; i++) a.push({ uid: 'u' + i, nick: 'G' + i, bot: !!bots }); return a; }
// coperte: tutti insieme
var s; do { s = E.newGame(seats(4), { hidden: true }); } while (s.phase !== 'bid');
var d = s.dealer, order = [1, 2, 3, 4].map(function (k) { return (d + k) % 4; });
t('tutti devono prevedere', E.pending(s).join() === order.join() && order.every(function (p) { return E.needs(s, p); }));
t('il mazziere può prevedere per primo', E.act(s, d, { a: 'bid', b: 0 }) === null && s.players[d].bid === 0 && s.phase === 'bid');
t('non si ripete la previsione', E.act(s, d, { a: 'bid', b: 1 }) !== null);
t('fuori ordine va bene', E.act(s, order[2], { a: 'bid', b: 1 }) === null);
t('pending aggiornato', E.pending(s).join() === [order[0], order[1]].join() && !E.needs(s, d));
E.act(s, order[1], { a: 'bid', b: 0 });
t('ancora in fase previsione', s.phase === 'bid' && E.decider(s) === order[0]);
E.act(s, order[0], { a: 'bid', b: 1 });
t('tutti scelto: si gioca, apre chi è dopo il mazziere', s.phase === 'play' && s.turn === order[0] && s.leader === order[0]);
t('nel gioco decide il turno', E.act(s, order[1], { a: 'play', c: s.players[order[1]].hand[0] }) !== null);
// a turno senza coperte: invariato
var u; do { u = E.newGame(seats(3), {}); } while (u.phase !== 'bid');
var nx = (u.dealer + 1) % 3;
t('senza coperte: solo chi è di turno', E.act(u, u.dealer, { a: 'bid', b: 0 }) !== null && E.pending(u).join() === String(nx) && E.needs(u, nx) && !E.needs(u, u.dealer));
// bot completi coperti
var bad = 0, N = +process.argv[2] || 10;
for (var k = 3; k <= 6; k++) for (var r = 0; r < N; r++) {
  var g = E.newGame(seats(k, true), { hidden: r % 2 === 0 }), guard = 0;
  while (g.phase !== 'over' && guard++ < 20000) {
    var movers = g.players.map(function (P, i) { return i; }).filter(function (i) { return E.needs(g, i); });
    if (!movers.length) { bad++; console.log('fermo', g.phase); break; }
    var p = movers[Math.floor(Math.random() * movers.length)], a = B.decide(g, p);
    if (!a) { bad++; console.log('nessuna mossa', g.phase); break; }
    var e = E.act(g, p, a); if (e) { bad++; console.log(e); break; }
  }
  if (g.phase !== 'over') bad++;
}
t('partite tra bot (coperte e no) finite', bad === 0);
console.log('Wizard: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
