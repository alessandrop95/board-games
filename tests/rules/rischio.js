// gioco: rischio
// Prove delle regole di Dadi e rischio (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/rischio/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n, bots) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i, bot: !!bots }); return a; }
// dadi truccati: ogni tiro esce dalla lista
function rig(list) { var q = list.slice(); E.setRandom(function () { var v = q.length ? q.shift() : 1 + Math.floor(Math.random() * 6); return (v - 1) / 6 + .01; }); }
var T0 = 1000;

var g = E.newGame(seats(3), { target: 100 }, T0), p = g.turn;
t('si comincia tirando, traguardo scelto', g.phase === 'roll' && g.opts.target === 100 && E.pending(g).join() === String(p));
t('traguardo fuori dall’elenco: 200', E.newGame(seats(2), { target: 7 }, T0).opts.target === 200);
t('non tocca agli altri', E.act(g, (p + 1) % 3, { a: 'roll' }, T0) !== null);
rig([6, 6, 3, 2, 1]);
t('si tirano 5 dadi', E.act(g, p, { a: 'roll' }, T0) === null && g.dice.join() === '6,6,3,2,1' && g.phase === 'pick');
t('valori nuovi in ordine dal più alto', E.fresh(g).join() === '6,3,2,1');
t('almeno un dado', E.act(g, p, { a: 'pick', d: [], go: true }, T0) !== null);
t('due dadi uguali insieme no', E.act(g, p, { a: 'pick', d: [0, 1], go: true }, T0) !== null);
t('dado inesistente no', E.act(g, p, { a: 'pick', d: [7], go: true }, T0) !== null);
rig([6, 5, 5, 2]);
t('metto da parte il 6 e ritiro 4 dadi', E.act(g, p, { a: 'pick', d: [0], go: true }, T0) === null && g.pot === 6 && g.kept.join() === '6' && g.dice.length === 4);
t('un valore già nella fila non si prende', E.act(g, p, { a: 'pick', d: [0], go: true }, T0) !== null);
t('rischio esatto: 2 valori presi e 3 dadi', Math.abs(E.bustChance([6, 5]) - 1 / 27) < 1e-9 && E.bustChance([]) === 0 && E.bustChance([1, 2, 3, 4, 5]) === 0);
var before = g.players[p].score;
t('mi fermo prendendo 5 e 2: incasso il piatto', E.act(g, p, { a: 'pick', d: [1, 3], go: false }, T0) === null && g.players[p].score === before + 13 && g.turn === (p + 1) % 3 && g.phase === 'roll');
t('il turno passa e il piatto riparte', g.pot === 0 && !g.kept.length && g.last && g.last.pot === 13 && !g.last.bust);
// sballo
var q = g.turn, sc = g.players[q].score; rig([4, 4, 4, 4, 3, 4, 3, 3]);
E.act(g, q, { a: 'roll' }, T0);
t('si tira ancora subito dopo aver scelto', E.act(g, q, { a: 'pick', d: [0, 4], go: true }, T0) === null);
t('se il tiro non ha valori nuovi è sballato', g.phase === 'roll' && g.turn === (q + 1) % 3 && g.players[q].score === sc && g.last.bust && g.last.pot === 7 && g.players[q].busts === 1);
var r = g.turn; rig([1, 2, 3, 4, 5, 6, 6, 6, 6, 6]);
E.act(g, r, { a: 'roll' }, T0);
t('fila completa: +15 e di nuovo 5 dadi', E.act(g, r, { a: 'pick', d: [0, 1, 2, 3, 4], go: true }, T0) === null && g.pot === 15 + 15 && g.rows === 1 && g.kept.length === 0 && g.dice.join() === '6,6,6,6,6' && g.phase === 'pick');
t('dopo la fila completa tutti i valori sono nuovi', E.fresh(g).join() === '6');
E.act(g, r, { a: 'pick', d: [0], go: false }, T0);
t('incassa piatto e bonus', g.players[r].score === 36, g.players[r].score);
// fine partita: si finisce il giro
E.setRandom(null);
var f = E.newGame(seats(3), { target: 100 }, T0); f.first = 0; f.turn = 1;
f.players[1].score = 95; rig([6, 1, 2, 3, 4]); E.act(f, 1, { a: 'roll' }, T0); E.act(f, 1, { a: 'pick', d: [0], go: false }, T0);
t('chi raggiunge il traguardo apre l’ultimo giro', f.lastRound && f.phase === 'roll' && f.turn === 2);
f.players[2].score = 99; rig([6, 1, 2, 3, 4]); E.act(f, 2, { a: 'roll' }, T0); E.act(f, 2, { a: 'pick', d: [0, 1], go: false }, T0);
t('a fine giro vince chi ha più punti', f.phase === 'over' && f.winners.join() === '2' && f.final.place[2] === 1 && f.final.place[1] === 2);
var tie = E.newGame(seats(2), { target: 100 }, T0); tie.first = 0; tie.turn = 0; tie.players[0].score = 94; tie.players[1].score = 100;
rig([6, 1, 2, 3, 4]); E.act(tie, 0, { a: 'roll' }, T0); E.act(tie, 0, { a: 'pick', d: [0], go: false }, T0);
t('pari in testa: si gioca un altro giro', tie.phase === 'roll' && tie.turn === 1);
E.setRandom(null);
// partite intere tra automatici
var bad = 0, N = +process.argv[2] || 10, rounds = 0, games = 0;
for (var n = 2; n <= 8; n++) for (var k = 0; k < N; k++) {
  var b = E.newGame(seats(n, true), { target: [100, 200, 300][k % 3] }, T0), guard = 0;
  while (b.phase !== 'over' && guard++ < 50000) {
    var a = B.decide(b, b.turn); if (!a) { bad++; console.log('nessuna mossa', b.phase); break; }
    var err = E.act(b, b.turn, a, T0); if (err) { bad++; console.log('errore', err, JSON.stringify(a), b.dice, b.kept); break; }
  }
  if (b.phase !== 'over') { bad++; console.log('non finita'); }
  rounds += b.round; games++;
}
t('partite tra automatici da 2 a 8 giocatori finite senza errori', bad === 0, bad);
console.log('giri medi per partita: ' + (rounds / games).toFixed(1));
console.log('Dadi e rischio: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
