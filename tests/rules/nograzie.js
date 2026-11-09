// gioco: nograzie
// Prove delle regole di No Grazie! (una prova per regola)
var path = require('path'), SRC = path.join(__dirname, '../../src/nograzie/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }

var g = E.newGame(seats(4), {});
t('24 carte in gioco e 9 tolte', g.deck.length + 1 === 24 && g.removed.length === 9);
var all = g.deck.concat(g.removed, [g.cur]).sort(function (a, b) { return a - b; });
t('carte da 3 a 35, una per numero', all.length === 33 && all[0] === 3 && all[32] === 35 && all.every(function (v, i) { return v === i + 3; }));
t('11 gettoni da 3 a 5 giocatori', g.players.every(function (P) { return P.chips === 11; }) && E.newGame(seats(3), {}).players[0].chips === 11 && E.newGame(seats(5), {}).players[0].chips === 11);
t('9 gettoni con 6, 7 con 7', E.newGame(seats(6), {}).players[0].chips === 9 && E.newGame(seats(7), {}).players[0].chips === 7);
t('una carta girata, nessun gettone sopra', g.cur != null && g.pot === 0 && g.turn === g.starter);
var s = g.turn, nx = (s + 1) % 4;
t('fuori turno no', E.act(g, nx, { a: 'pass' }) !== null);
t('«No grazie!»: un gettone sulla carta, tocca al prossimo', E.act(g, s, { a: 'pass' }) === null && g.players[s].chips === 10 && g.pot === 1 && g.turn === nx);
E.act(g, nx, { a: 'pass' });
var c0 = g.cur, t3 = g.turn;
t('chi prende la carta prende anche i gettoni', E.act(g, t3, { a: 'take' }) === null && g.players[t3].cards.indexOf(c0) >= 0 && g.players[t3].chips === 13 && g.pot === 0);
t('poi gira la carta dopo e decide di nuovo lui', g.turn === t3 && g.cur != null && g.cur !== c0);
var z = E.newGame(seats(3), {}); z.players[z.turn].chips = 0;
t('senza gettoni si deve prendere', E.act(z, z.turn, { a: 'pass' }) !== null && E.act(z, z.turn, { a: 'take' }) === null);
// punteggio
t('scala: conta solo la più bassa', E.cardPts([3, 10, 11, 12, 13, 20]) === 33);
t('esempio delle regole: 3, 10-13, 20 con 5 gettoni = 28', E.score({ cards: [3, 10, 11, 12, 13, 20], chips: 5 }) === 28);
t('scale separate da un buco contano due volte', E.cardPts([19, 20, 22, 23]) === 41);
t('una carta che unisce due scale fa scendere i punti', E.marginal([19, 20, 22, 23], 21) === -22);
t('una carta che allunga una scala sotto cambia la più bassa', E.marginal([20, 21], 19) === -1 && E.marginal([20, 21], 22) === 0);
// fine partita
var f = E.newGame(seats(3), {}); f.deck = []; f.cur = 30; f.pot = 2; f.players[0].cards = [5, 6]; f.players[0].chips = 4; f.players[1].cards = [20]; f.players[1].chips = 11; f.players[2].cards = [35]; f.players[2].chips = 0; f.turn = 2;
E.act(f, 2, { a: 'take' });
t('ultima carta presa: partita finita', f.phase === 'over' && f.roundRes.pts.join() === '1,9,63' && f.winners.join() === '0');
t('le carte tolte si scoprono alla fine', f.roundRes.removed.length === 9);
// più partite
var m = E.newGame(seats(3), { rounds: 3 }); m.deck = []; E.act(m, m.turn, { a: 'take' });
t('3 partite: dopo la prima si aspetta il via', m.phase === 'scores' && m.round === 1);
E.act(m, 0, { a: 'next' }); E.act(m, 1, { a: 'next' }); E.act(m, 2, { a: 'next' });
t('nuova partita: carte e gettoni da capo, punti sommati', m.phase === 'play' && m.round === 2 && m.players.every(function (P) { return P.cards.length === 0 && P.chips === 11 && P.hist.length === 1; }));
t('opzioni', E.newGame(seats(3), { rounds: 5, chips: 'open' }).opts.rounds === 5 && E.newGame(seats(3), { rounds: 7 }).opts.rounds === 1 && E.newGame(seats(3), {}).opts.chips === 'hidden');
// automatici
var bg = E.newGame(seats(5).map(function (x) { x.bot = true; return x; }), { rounds: 3 }), guard = 0;
while (bg.phase !== 'over' && guard++ < 6000) { var ps = E.pending(bg); if (!ps.length) { E.forceNext(bg); continue; } if (E.act(bg, ps[0], B.decide(bg, ps[0]))) break; }
t('tre partite intere tra automatici', bg.phase === 'over' && bg.players.every(function (P) { return P.hist.length === 3; }));
console.log('No Grazie!: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
