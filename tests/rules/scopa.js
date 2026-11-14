// gioco: scopa
// Prove delle regole della Scopa (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/scopa/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function C(r, s) { return s * 10 + r - 1; }

var g = E.newGame(seats(2), {});
t('in 2: 3 carte a testa e 4 in tavola, mai 3 re in tavola', g.players.every(function (P) { return P.hand.length === 3; }) && g.table.length === 4 && g.deck.length === 30 && g.table.filter(function (c) { return E.val(c) === 10; }).length < 3);
var sc = E.newGame(seats(4), { variant: 'scopone' });
t('scopone scientifico: 10 carte a testa e tavola vuota', sc.opts.scopone && sc.players.every(function (P) { return P.hand.length === 10; }) && !sc.table.length && !sc.deck.length);
t('lo scopone solo in 4', !E.newGame(seats(2), { variant: 'scopone' }).opts.scopone);
t('prese: con la carta uguale si prende solo quella', JSON.stringify(E.captures([C(3, 0), C(2, 1), C(1, 2)], C(3, 3))) === JSON.stringify([[C(3, 0)]]));
t('prese: altrimenti le combinazioni che fanno il valore', E.captures([C(5, 0), C(2, 1), C(3, 2), C(4, 3)], C(7, 1)).length === 2);
t('il re vale 10', E.captures([C(4, 0), C(6, 1)], C(10, 2)).length === 1);
function setup(n, table, hands, deck) { var x = E.newGame(seats(n), {}); x.table = table; x.players.forEach(function (P, i) { P.hand = hands[i]; }); x.deck = deck || []; x.turn = 0; return x; }
var a = setup(2, [C(3, 0), C(4, 1), C(2, 2), C(5, 3)], [[C(7, 1), C(1, 0)], [C(9, 3), C(6, 0)]], [C(6, 1)]);
t('due modi di prendere: bisogna scegliere', E.act(a, 0, { a: 'play', c: C(7, 1) }) !== null);
t('una combinazione sbagliata no', E.act(a, 0, { a: 'play', c: C(7, 1), take: [C(3, 0), C(2, 2)] }) !== null);
t('si prendono 3 e 4', E.act(a, 0, { a: 'play', c: C(7, 1), take: [C(3, 0), C(4, 1)] }) === null && a.taken[0].length === 3 && a.table.length === 2);
t('senza prese la carta resta in tavola', E.act(a, 1, { a: 'play', c: C(9, 3) }) === null && a.table.length === 3);
var u = setup(2, [C(3, 0), C(4, 1), C(7, 2)], [[C(7, 1)], [C(1, 0)]], []);
t('con la carta uguale in tavola la combinazione non vale', E.act(u, 0, { a: 'play', c: C(7, 1), take: [C(3, 0), C(4, 1)] }) !== null && E.act(u, 0, { a: 'play', c: C(7, 1) }) === null && u.taken[0].indexOf(C(7, 2)) >= 0);
var s = setup(2, [C(3, 0), C(4, 1)], [[C(7, 1), C(1, 0)], [C(2, 2), C(5, 3)]], [C(6, 0), C(6, 1), C(6, 2), C(6, 3), C(8, 0), C(9, 0)]);
t('scopa vale un punto', E.act(s, 0, { a: 'play', c: C(7, 1) }) === null && s.scope[0] === 1 && s.last.scopa);
var r = setup(2, [C(2, 0)], [[C(5, 0)], [C(4, 3)]], [C(1, 1), C(1, 2), C(3, 0), C(3, 1), C(3, 2), C(3, 3)]);
E.act(r, 0, { a: 'play', c: C(5, 0) }); E.act(r, 1, { a: 'play', c: C(4, 3) });
t('finite le carte se ne danno altre 3', r.players.every(function (P) { return P.hand.length === 3; }) && r.deck.length === 0);
var l = setup(2, [C(2, 0), C(9, 3)], [[C(2, 1)], [C(5, 2)]], []);
l.taken = [[16, C(7, 0), C(7, 2), C(7, 3), C(1, 1), C(2, 1), C(3, 1), C(4, 1), C(5, 1), C(6, 1)], []]; l.totals = [0, 0];
E.act(l, 0, { a: 'play', c: C(2, 1) });
t('all’ultima giocata niente scopa', !l.last.scopa || l.table.length);
E.act(l, 1, { a: 'play', c: C(5, 2) });
t('a fine mano le carte in tavola vanno a chi ha preso per ultimo', l.phase !== 'play' && l.taken[0].indexOf(C(9, 3)) >= 0 && l.taken[0].indexOf(C(5, 2)) >= 0);
t('punti: carte, denari, settebello, primiera', l.res.items[0].join() === 'carte,denari,settebello,primiera' && l.res.pts[0] === 4);
t('primiera: serve un seme per ogni tipo', !E.primiera([C(7, 0), C(7, 1), C(7, 2)]).full && E.primiera([C(7, 0), C(7, 1), C(7, 2), C(1, 3)]).sum === 21 * 3 + 16);
var o = setup(2, [C(2, 0)], [[C(2, 1)], [C(5, 2)]], []); o.totals = [9, 3]; o.taken = [[16, C(7, 0), C(7, 2), C(7, 3), C(1, 1), C(2, 2), C(3, 1), C(4, 1), C(5, 1), C(6, 1), C(1, 0), C(1, 2), C(1, 3), C(2, 3), C(3, 3), C(4, 3), C(5, 3), C(6, 3), C(8, 3), C(9, 2), C(10, 2)], []];
E.act(o, 0, { a: 'play', c: C(2, 1) }); E.act(o, 1, { a: 'play', c: C(5, 2) });
t('a 11 punti si vince la partita', o.phase === 'over' && o.winners.join() === '0');
// partite tra automatici
var bad = 0, N = +process.argv[2] || 20, sum = 0, hands = 0;
[[2, 'classica'], [4, 'classica'], [4, 'scopone']].forEach(function (cfg) {
  for (var k = 0; k < N; k++) {
    var b = E.newGame(seats(cfg[0]).map(function (x) { x.bot = true; return x; }), { variant: cfg[1] }), guard = 0;
    while (b.phase !== 'over' && guard++ < 6000) {
      var q = E.pending(b)[0]; if (q == null) { E.forceNext(b); continue; }
      var err = E.act(b, q, B.decide(b, q)); if (err) { bad++; console.log('errore', err); break; }
      if (b.phase !== 'play' && b.res && guard) { var n = b.res.cards[0] + b.res.cards[1]; if (n !== 40) { bad++; console.log('carte', n); } }
    }
    if (b.phase !== 'over') { bad++; console.log('non finita'); }
    sum += b.totals[0] + b.totals[1]; hands += b.hand;
  }
});
t('partite tra automatici (in 2, in 4 e scopone) finite senza errori, sempre 40 carte prese', bad === 0, bad);
console.log('mani per partita: ' + (hands / N / 3).toFixed(1));
console.log('Scopa: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
