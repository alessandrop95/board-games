// gioco: bugiardo
// Prove delle regole di Dadi del bugiardo (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/bugiardo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var s = []; for (var i = 0; i < n; i++) s.push({ uid: 'u' + i, nick: 'G' + i }); return s; }
var T0 = 1000000;
function game(n, opts, dice) {
  var g = E.newGame(seats(n), opts || {}, T0);
  if (dice) g.players.forEach(function (P, i) { P.dice = dice[i].slice(); P.n = dice[i].length; });
  g.turn = 0; g.bid = null; return g;
}
var g0 = E.newGame(seats(4), {}, T0);
t('si parte con 5 dadi a testa, tirati, e qualcuno apre', g0.players.every(function (P) { return P.n === 5 && P.dice.length === 5 && P.dice.every(function (d) { return d >= 1 && d <= 6; }); }) && g0.phase === 'bid' && g0.turn >= 0);
t('con 3 dadi a testa', E.newGame(seats(3), { dice: 3 }, T0).players[0].dice.length === 3);
t('con 6 e con 7 dadi a testa', E.newGame(seats(3), { dice: 6 }, T0).players[0].dice.length === 6 && E.newGame(seats(8), { dice: 7 }, T0).players.every(function (P) { return P.n === 7 && P.dice.length === 7; }));
t('8 dadi a testa no: si torna a 5', E.newGame(seats(3), { dice: 8 }, T0).players[0].n === 5);
t('le quantità in lettere anche oltre 20', E.qTxt(21) === 'ventuno' && E.qTxt(23) === 'ventitré' && E.qTxt(28) === 'ventotto' && E.qTxt(30) === 'trenta' && E.qTxt(56) === 'cinquantasei' && E.bidTxt({ q: 1, f: 4 }) === 'un 4');
// le dichiarazioni
var g = game(3, {}, [[2, 2, 3, 5, 6], [1, 4, 4, 5, 6], [1, 2, 3, 3, 6]]);
t('non si apre sugli 1 quando sono jolly', E.act(g, 0, { a: 'bid', q: 2, f: 1 }, T0) !== null);
t('non si dichiara più dei dadi in gioco', E.act(g, 0, { a: 'bid', q: 16, f: 4 }, T0) !== null);
t('fuori turno no', E.act(g, 1, { a: 'bid', q: 2, f: 4 }, T0) !== null);
t('«Dubito» senza dichiarazioni no', E.act(g, 0, { a: 'doubt' }, T0) !== null);
t('si apre con «tre 4» e tocca al successivo', E.act(g, 0, { a: 'bid', q: 3, f: 4 }, T0) === null && g.turn === 1 && g.bid.q === 3);
t('bisogna alzare: «tre 3» no, «tre 5» sì', E.act(g, 1, { a: 'bid', q: 3, f: 3 }, T0) !== null && E.act(g, 1, { a: 'bid', q: 3, f: 5 }, T0) === null);
t('sugli 1 la quantità si dimezza (per eccesso): «due 1» dopo «tre 5»', E.higher(g, { q: 2, f: 1 }, { q: 3, f: 5 }) && !E.higher(g, { q: 1, f: 1 }, { q: 3, f: 5 }));
t('dagli 1 a un altro valore: il doppio più uno', !E.higher(g, { q: 4, f: 6 }, { q: 2, f: 1 }) && E.higher(g, { q: 5, f: 2 }, { q: 2, f: 1 }));
t('quantità minima per alzare', E.minQ(g, 6, { q: 3, f: 5 }) === 3 && E.minQ(g, 4, { q: 3, f: 5 }) === 4 && E.minQ(g, 1, { q: 3, f: 5 }) === 2);
var gn = game(2, { ones: false }, [[1, 1, 2], [1, 3, 3]]);
t('senza jolly gli 1 sono un valore come gli altri', E.higher(gn, { q: 2, f: 1 }, null) && !E.higher(gn, { q: 2, f: 1 }, { q: 2, f: 2 }) && E.count(gn, 3) === 2 && E.count(gn, 1) === 3);
// conteggio con i jolly
t('gli 1 contano come jolly', E.count(g, 6) === 5 && E.count(g, 1) === 2 && E.count(g, 4) === 4);
// dubito: la dichiarazione era vera → perde chi dubita
g = game(3, {}, [[2, 2, 3, 5, 6], [1, 4, 4, 5, 6], [1, 2, 3, 3, 6]]);
E.act(g, 0, { a: 'bid', q: 4, f: 6 }, T0);
t('«Dubito» su una dichiarazione vera: perde un dado chi dubita', E.act(g, 1, { a: 'doubt' }, T0) === null && g.phase === 'show' && g.players[1].n === 4 && g.res.loser === 1 && g.res.count === 5 && !g.res.ok);
t('tutti vedono i dadi scoperti', g.res.dice.length === 3 && g.res.dice[2].join() === '1,2,3,3,6');
t('il nuovo giro lo apre chi ha perso il dado, con i dadi ritirati', E.act(g, 0, { a: 'next' }, T0) === null && E.act(g, 1, { a: 'next' }, T0) === null && E.act(g, 2, { a: 'next' }, T0) === null && g.phase === 'bid' && g.turn === 1 && g.players[1].dice.length === 4 && g.round === 2);
// dubito: la dichiarazione era falsa → perde chi ha dichiarato
g = game(3, {}, [[2, 2, 3, 5, 6], [1, 4, 4, 5, 6], [1, 2, 3, 3, 6]]);
E.act(g, 0, { a: 'bid', q: 6, f: 6 }, T0);
t('«Dubito» su una dichiarazione falsa: perde chi ha dichiarato', E.act(g, 1, { a: 'doubt' }, T0) === null && g.players[0].n === 4 && g.players[1].n === 5 && g.res.ok);
t('il riepilogo finisce anche da solo', E.tick(g, T0 + E.SHOW_MS) && g.phase === 'bid' && g.turn === 0);
// esatto (i 3 sul tavolo, con gli 1 jolly, sono 5)
g = game(3, {}, [[2, 2, 3, 5], [1, 4, 4, 5, 6], [1, 2, 3, 3, 6]]);
t('i 3 con i jolly sono 5', E.count(g, 3) === 5);
E.act(g, 0, { a: 'bid', q: 5, f: 3 }, T0);
t('«Esatto!» giusto con tutti i dadi: resta a 5, nessuno perde', E.act(g, 1, { a: 'exact' }, T0) === null && g.res.ok && g.res.gainer === null && g.res.loser === null && g.players[1].n === 5 && g.res.next === 1);
g = game(3, {}, [[2, 2, 3, 5], [1, 4, 4, 5], [1, 2, 3, 3, 6]]);
E.act(g, 0, { a: 'bid', q: 5, f: 3 }, T0);
t('«Esatto!» giusto per chi aveva perso un dado: lo riprende', E.act(g, 1, { a: 'exact' }, T0) === null && g.res.gainer === 1 && g.players[1].n === 5);
g = game(3, {}, [[2, 2, 3, 5], [1, 4, 4, 5], [1, 2, 3, 3, 6]]);
E.act(g, 0, { a: 'bid', q: 4, f: 3 }, T0);
t('«Esatto!» sbagliato: perde un dado chi l’ha detto', E.act(g, 1, { a: 'exact' }, T0) === null && !g.res.ok && g.res.loser === 1 && g.players[1].n === 3);
var gx = game(3, { exact: false }, [[2], [3], [4]]); E.act(gx, 0, { a: 'bid', q: 1, f: 2 }, T0);
t('senza «Esatto!» al tavolo non si può dire', E.act(gx, 1, { a: 'exact' }, T0) !== null);
// eliminazione e fine
g = game(3, {}, [[2], [3, 3], [4, 4]]);
E.act(g, 0, { a: 'bid', q: 3, f: 2 }, T0); E.act(g, 1, { a: 'doubt' }, T0);
t('chi perde l’ultimo dado è fuori', g.players[0].out && g.elim.join() === '0' && g.phase === 'show' && g.res.next === 0);
g.players.forEach(function (P, i) { E.act(g, i, { a: 'next' }, T0); });
t('il giro lo apre il successivo ancora in gioco', g.phase === 'bid' && g.turn === 1 && g.players[0].dice.length === 0);
t('chi è fuori non gioca', E.act(g, 0, { a: 'bid', q: 1, f: 3 }, T0) !== null);
g.players[1].dice = [3]; g.players[1].n = 1; g.players[2].dice = [4, 4]; g.players[2].n = 2;
E.act(g, 1, { a: 'bid', q: 3, f: 6 }, T0); E.act(g, 2, { a: 'doubt' }, T0);
t('resta uno solo: ha vinto, classifica dall’ultimo eliminato', g.phase === 'over' && g.winners.join() === '2' && g.final.place.join() === '3,2,1');
// partite intere tra automatici
var bad = 0, N = 300, rounds = 0, opts = [{}, { dice: 3 }, { ones: false }, { exact: false, dice: 4 }, { dice: 6 }, { dice: 7, exact: false }];
for (var k = 0; k < N; k++) {
  var n = 2 + (k % 7), b = E.newGame(seats(n), opts[k % 6], T0), now = T0;
  b.players.forEach(function (P) { P.bot = true; });
  for (var st = 0; st < 5000 && b.phase !== 'over'; st++) {
    now += 500;
    b.players.forEach(function (P, p) { var a = B.decide(b, p); if (a) { var e = E.act(b, p, a, now); if (e) { bad++; if (bad < 5) console.log(e, JSON.stringify(a), JSON.stringify(b.bid)); } } });
    E.tick(b, now);
  }
  if (b.phase !== 'over') { bad++; console.log('non finita'); } else rounds += b.round;
}
t('partite tra automatici finite senza errori', bad === 0, bad);
console.log('giri per partita: ' + (rounds / N).toFixed(1));
console.log('Dadi del bugiardo: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
