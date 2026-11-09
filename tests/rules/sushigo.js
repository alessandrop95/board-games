// gioco: sushigo
// Prove delle regole di Sushi Go! (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/sushigo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function T(ks) { return ks.map(function (k) { return typeof k === 'string' ? { k: k } : k; }); }

var D = E.fullDeck();
t('108 carte', D.length === 108);
t('composizione del mazzo', D.filter(function (k) { return k === 'tem'; }).length === 14 && D.filter(function (k) { return k === 'mk2'; }).length === 12 && D.filter(function (k) { return k === 'nsq'; }).length === 5 && D.filter(function (k) { return k === 'cho'; }).length === 4 && D.filter(function (k) { return k === 'pud'; }).length === 10 && D.filter(function (k) { return k === 'was'; }).length === 6);
t('carte in mano: 10/9/8/7', E.handSize(2) === 10 && E.handSize(3) === 9 && E.handSize(4) === 8 && E.handSize(5) === 7);
var g = E.newGame(seats(3), {});
t('9 carte a testa con 3 giocatori', g.players.every(function (P) { return P.hand.length === 9; }) && g.deck.length === 108 - 27);
t('scelta segreta: si aspetta tutti', E.act(g, 0, { a: 'pick', cards: [0] }) === null && g.players[0].pick && g.players[0].hand.length === 9 && E.pending(g).join() === '1,2');
t('si può cambiare idea', E.act(g, 0, { a: 'pick', cards: [1] }) === null && g.players[0].pick.cards[0] === 1);
t('due carte senza bacchette no', E.act(g, 1, { a: 'pick', cards: [0, 1] }) !== null);
var h0 = g.players[0].hand.slice(), h1 = g.players[1].hand.slice(), h2 = g.players[2].hand.slice();
E.act(g, 1, { a: 'pick', cards: [0] }); E.act(g, 2, { a: 'pick', cards: [0] });
t('tutti hanno scelto: si scopre', g.players[0].table.length + g.players[0].table.filter(function (c) { return c.nig; }).length >= 1 && g.players.every(function (P) { return !P.pick; }));
t('le mani passano a sinistra', g.players[1].hand.length === 8 && g.players[1].hand.join() === h0.filter(function (x, i) { return i !== 1; }).join() && g.players[0].hand.join() === h2.slice(1).join());
// punteggi
function ps(ks) { return E.partScore(T(ks)); }
t('Tempura: ogni coppia 5', ps(['tem']).tem === 0 && ps(['tem', 'tem']).tem === 5 && ps(['tem', 'tem', 'tem', 'tem', 'tem']).tem === 10);
t('Sashimi: ogni tris 10', ps(['sas', 'sas']).sas === 0 && ps(['sas', 'sas', 'sas']).sas === 10 && ps(['sas', 'sas', 'sas', 'sas', 'sas', 'sas']).sas === 20);
t('Gyoza: 1, 3, 6, 10, 15', [1, 2, 3, 4, 5, 6].map(function (n) { var a = []; for (var i = 0; i < n; i++) a.push('dum'); return ps(a).dum; }).join() === '1,3,6,10,15,15');
t('Nigiri: 1, 2, 3; sul Wasabi il triplo', ps(['neg', 'nsa', 'nsq']).nig === 6 && ps([{ k: 'was', nig: 'nsq' }]).nig === 9 && ps(['was']).nig === 0);
var w = E.newGame(seats(2), {}); w.players[0].hand = ['was', 'nsq', 'tem']; w.players[1].hand = ['tem', 'tem', 'tem'];
E.act(w, 0, { a: 'pick', cards: [0] }); E.act(w, 1, { a: 'pick', cards: [0] });
var mine = w.players[0]; mine.hand = ['nsq', 'tem']; w.players[1].hand = ['tem', 'tem'];
E.act(w, 0, { a: 'pick', cards: [0] }); E.act(w, 1, { a: 'pick', cards: [0] });
t('il Nigiri dopo il Wasabi ci va sopra', mine.table.length === 1 && mine.table[0].k === 'was' && mine.table[0].nig === 'nsq');
var c = E.newGame(seats(2), {}); c.players[0].table = T(['cho']); c.players[0].hand = ['sas', 'sas', 'tem']; c.players[1].hand = ['tem', 'tem', 'tem'];
t('con le Bacchette due carte', E.act(c, 0, { a: 'pick', cards: [0, 1] }) === null);
E.act(c, 1, { a: 'pick', cards: [0] });
t('… e le Bacchette tornano nella mano passata', c.players[0].table.filter(function (x) { return x.k === 'sas'; }).length === 2 && !c.players[0].table.some(function (x) { return x.k === 'cho'; }) && c.players[1].hand.indexOf('cho') >= 0);
// maki
function mk(ms) { var x = E.newGame(seats(ms.length), {}); x.players.forEach(function (P, i) { P.table = ms[i].map(function (k) { return { k: k }; }); }); return E.makiScores(x).join(); }
t('Maki: primo 6, secondo 3', mk([['mk3'], ['mk2'], ['mk1']]) === '6,3,0');
t('Maki: pari al primo posto si divide, niente secondo', mk([['mk3'], ['mk2', 'mk1'], ['mk1']]) === '3,3,0');
t('Maki: pari al secondo posto si divide', mk([['mk3'], ['mk1'], ['mk1'], []]) === '6,1,1,0');
t('Maki: nessuno, nessun punto', mk([[], []]) === '0,0');
// budini
function pd(us) { var x = E.newGame(seats(us.length), {}); x.players.forEach(function (P, i) { P.pud = us[i]; }); return E.puddingScores(x).join(); }
t('Budini: più +6, meno −6', pd([3, 1, 0]) === '6,0,-6');
t('Budini: pari si divide', pd([2, 2, 0, 0]) === '3,3,-3,-3');
t('Budini in due: niente −6', pd([2, 0]) === '6,0');
t('Budini tutti uguali: niente', pd([1, 1, 1]) === '0,0,0');
// manche e partita intera
var f = E.newGame(seats(4).map(function (s) { s.bot = true; return s; }), {}), guard = 0, rounds = [];
while (f.phase !== 'over' && guard++ < 500) { if (f.phase === 'scores' && rounds.indexOf(f.round) < 0) rounds.push(f.round); var ps2 = E.pending(f); if (!ps2.length) { E.forceNext(f); continue; } if (E.act(f, ps2[0], B.decide(f, ps2[0]))) break; }
t('tre manche, poi fine con i budini', f.phase === 'over' && f.round === 3 && f.players.every(function (P) { return P.hist.length === 3; }) && f.roundRes.pudPts && rounds.join() === '1,2');
t('le carte della manche finiscono sul tavolo, le mani vuote', f.players.every(function (P) { return P.hand.length === 0; }));
t('in tutto si usano 3 × 8 × 4 carte', f.deck.length === 108 - 96);
var alt = E.newGame(seats(3), { pass: 'alt' }); alt.round = 2;
t('variante: nella seconda manche si passa a destra', E.dir(alt) === -1 && E.dir(E.newGame(seats(3), {})) === 1);
// partite tra automatici
var bad = 0, sc = 0, N = +process.argv[2] || 30;
for (var n = 2; n <= 5; n++) for (var k = 0; k < N; k++) {
  var b = E.newGame(seats(n).map(function (s) { s.bot = true; return s; }), {}), gd = 0;
  while (b.phase !== 'over' && gd++ < 500) { var q = E.pending(b); if (!q.length) { E.forceNext(b); continue; } var e = E.act(b, q[0], B.decide(b, q[0])); if (e) { bad++; console.log('errore', e); break; } }
  if (b.phase !== 'over') bad++; else sc += b.players[b.winners[0]].total;
}
t('partite tra automatici da 2 a 5 giocatori finite senza errori', bad === 0, bad);
console.log('punteggio medio del vincitore: ' + (sc / (4 * N)).toFixed(1));
console.log('Sushi Go!: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
