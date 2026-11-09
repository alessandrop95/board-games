// gioco: prendi6
// Prove delle regole di Prendi 6! (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/prendi6/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
var all = []; for (var v = 1; v <= 104; v++) all.push(E.bulls(v));
t('teste: 55 → 7, doppi → 5, decine → 3, finali in 5 → 2', E.bulls(55) === 7 && E.bulls(11) === 5 && E.bulls(99) === 5 && E.bulls(10) === 3 && E.bulls(100) === 3 && E.bulls(5) === 2 && E.bulls(95) === 2 && E.bulls(7) === 1);
t('conteggio: 1 da 7, 8 da 5, 10 da 3, 9 da 2, 76 da 1', [7, 5, 3, 2, 1].map(function (b) { return all.filter(function (x) { return x === b; }).length; }).join() === '1,8,10,9,76');
var g = E.newGame(seats(4), {});
t('10 carte a testa e 4 file da una carta', g.players.every(function (P) { return P.hand.length === 10; }) && g.rows.length === 4 && g.rows.every(function (r) { return r.length === 1; }));
var used = []; g.players.forEach(function (P) { used = used.concat(P.hand); }); g.rows.forEach(function (r) { used = used.concat(r); });
t('carte tutte diverse', used.length === 44 && used.filter(function (v, i) { return used.indexOf(v) === i; }).length === 44);
t('una carta che non hai no', E.act(g, 0, { a: 'pick', v: 0 }) !== null);
// partita controllata
function setup(n, rows, hands) { var x = E.newGame(seats(n), {}); x.rows = rows; x.players.forEach(function (P, i) { P.hand = hands[i]; }); return x; }
var a = setup(3, [[10], [20], [30], [40]], [[22, 1], [35, 2], [41, 3]]);
E.act(a, 0, { a: 'pick', v: 22 }); E.act(a, 1, { a: 'pick', v: 35 });
t('si aspetta che tutti scelgano', a.rows[1].length === 1 && E.pending(a).join() === '2');
t('si può cambiare idea', E.act(a, 1, { a: 'pick', v: 2 }) === null && a.players[1].pick === 2 && E.act(a, 1, { a: 'pick', v: 35 }) === null);
E.act(a, 2, { a: 'pick', v: 41 });
t('ogni carta nella fila con la differenza più piccola', a.rows[1].join() === '20,22' && a.rows[2].join() === '30,35' && a.rows[3].join() === '40,41' && a.phase === 'pick');
t('dalla più bassa alla più alta', a.plays.map(function (x) { return x.v; }).join() === '22,35,41');
var s = setup(2, [[10, 11, 12, 13, 14], [50], [60], [70]], [[15, 1], [55, 2]]);
E.act(s, 0, { a: 'pick', v: 15 }); E.act(s, 1, { a: 'pick', v: 55 });
t('la sesta carta prende le cinque della fila', s.players[0].pile.join() === '10,11,12,13,14' && s.rows[0].join() === '15' && E.sum(s.players[0].pile) === 3 + 5 + 1 + 1 + 1);
var l = setup(3, [[10, 20], [30], [40, 44], [50]], [[5, 60], [61, 62], [63, 64]]);
E.act(l, 0, { a: 'pick', v: 5 }); E.act(l, 1, { a: 'pick', v: 61 }); E.act(l, 2, { a: 'pick', v: 63 });
t('carta più bassa di tutte: si sceglie la fila', l.phase === 'choose' && l.chooser === 0 && l.rows[3].length === 1);
t('gli altri aspettano', E.act(l, 1, { a: 'row', r: 0 }) !== null);
t('prende la fila scelta e la sua carta la sostituisce', E.act(l, 0, { a: 'row', r: 1 }) === null && l.players[0].pile.join() === '30' && l.rows[1].join() === '5');
t('poi si continua con le altre carte', l.rows[3].join() === '50,61,63' && l.phase === 'pick');
// fine manche e partita
var f = setup(2, [[1], [2], [3], [4]], [[50], [60]]); f.players[0].pile = [55, 11]; f.players[1].pile = [5];
E.act(f, 0, { a: 'pick', v: 50 }); E.act(f, 1, { a: 'pick', v: 60 });
t('mani vuote: fine manche, si contano le teste', f.phase === 'scores' && f.roundRes.pts.join() === '12,2' && f.players[0].total === 12);
E.act(f, 0, { a: 'next' }); E.act(f, 1, { a: 'next' });
t('nuova manche: tutto da capo, totali tenuti', f.round === 2 && f.phase === 'pick' && f.players.every(function (P) { return P.hand.length === 10 && P.pile.length === 0; }) && f.players[0].total === 12);
var o = setup(2, [[1], [2], [3], [4]], [[50], [60]]); o.players[0].total = 60; o.players[0].pile = [55]; o.players[1].total = 10;
E.act(o, 0, { a: 'pick', v: 50 }); E.act(o, 1, { a: 'pick', v: 60 });
t('a 66 teste la partita finisce: vince chi ne ha meno', o.phase === 'over' && o.winners.join() === '1');
var tt = E.newGame(seats(3), { tactic: true }), mx = 0; tt.players.forEach(function (P) { mx = Math.max(mx, Math.max.apply(null, P.hand)); }); tt.rows.forEach(function (r) { mx = Math.max(mx, r[0]); });
t('variante tattica: solo le carte fino a 10 × giocatori + 4', mx <= 34 && tt.opts.tactic);
t('soglia', E.newGame(seats(2), { target: 33 }).opts.target === 33 && E.newGame(seats(2), { target: 5 }).opts.target === 66);
// partite tra automatici
var bad = 0, N = +process.argv[2] || 20, rounds = 0, games = 0;
for (var n = 2; n <= 10; n++) for (var k = 0; k < N; k++) {
  var b = E.newGame(seats(n).map(function (x) { x.bot = true; return x; }), { tactic: k % 3 === 0 }), gd = 0;
  while (b.phase !== 'over' && gd++ < 3000) { var q = E.pending(b); if (!q.length) { E.forceNext(b); continue; } var err = E.act(b, q[0], B.decide(b, q[0])); if (err) { bad++; console.log('errore', err); break; } }
  if (b.phase !== 'over') bad++; rounds += b.round; games++;
  var cnt = b.rows.reduce(function (x, r) { return x + r.length; }, 0) + b.players.reduce(function (x, P) { return x + P.pile.length + P.hand.length; }, 0);
}
t('partite tra automatici da 2 a 10 giocatori finite senza errori', bad === 0, bad);
console.log('manche per partita: ' + (rounds / games).toFixed(1));
console.log('Prendi 6!: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
