// gioco: briscola
// Prove delle regole della Briscola (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/briscola/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function C(r, s) { return s * 10 + r - 1; }   // carta: valore (1-10) e seme (0 coppe, 1 denari, 2 spade, 3 bastoni)

var all = []; for (var i = 0; i < 40; i++) all.push(E.pts(i));
t('punti: asso 11, tre 10, re 4, cavallo 3, fante 2; 120 in tutto', E.pts(C(1, 0)) === 11 && E.pts(C(3, 1)) === 10 && E.pts(C(10, 2)) === 4 && E.pts(C(9, 3)) === 3 && E.pts(C(8, 0)) === 2 && E.pts(C(7, 0)) === 0 && all.reduce(function (a, b) { return a + b; }, 0) === 120);
t('forza: asso > tre > re > cavallo > fante > 7 > … > 2', [1, 3, 10, 9, 8, 7, 6, 5, 4, 2].every(function (r, i, a) { return i === 0 || E.power(C(a[i - 1], 0)) > E.power(C(r, 0)); }));
t('prende la briscola più alta', E.winner([{ p: 0, c: C(1, 0) }, { p: 1, c: C(2, 1) }, { p: 2, c: C(4, 1) }], 1) === 2);
t('senza briscole prende la più alta del seme d’uscita', E.winner([{ p: 0, c: C(5, 0) }, { p: 1, c: C(1, 2) }, { p: 2, c: C(7, 0) }], 1) === 2);
var g = E.newGame(seats(4), {});
var cnt = g.deck.length + g.players.reduce(function (s, P) { return s + P.hand.length; }, 0);
t('in 4: 3 carte a testa, il resto nel mazzo con la briscola scoperta in fondo', g.players.every(function (P) { return P.hand.length === 3; }) && cnt === 40 && g.deck[0] === g.bris);
var p0 = g.turn;
t('gioca solo chi è di turno', E.act(g, (p0 + 1) % 4, { a: 'play', c: g.players[(p0 + 1) % 4].hand[0] }) !== null);
t('una carta che non hai no', E.act(g, p0, { a: 'play', c: 99 }) !== null);
// mano controllata
var h = E.newGame(seats(4), {});
h.bris = C(5, 1); h.deck = [C(5, 1), C(2, 3), C(3, 3), C(6, 3)]; h.turn = h.lead = 0;
h.players[0].hand = [C(1, 0), C(2, 0), C(4, 0)]; h.players[1].hand = [C(3, 0), C(5, 0), C(6, 0)]; h.players[2].hand = [C(10, 0), C(7, 2), C(8, 2)]; h.players[3].hand = [C(2, 1), C(9, 2), C(10, 2)];
E.act(h, 0, { a: 'play', c: C(1, 0) }); E.act(h, 1, { a: 'play', c: C(3, 0) }); E.act(h, 2, { a: 'play', c: C(10, 0) });
t('si gioca in ordine', h.turn === 3 && h.trick.length === 3);
E.act(h, 3, { a: 'play', c: C(2, 1) });
t('il 2 di briscola prende asso, tre e re: 25 punti agli avversari', h.last.w === 3 && h.taken[1].length === 4 && E.sum(h.taken[1]) === 25);
t('chi prende pesca per primo e comincia', h.turn === 3 && h.players[3].hand.indexOf(C(6, 3)) >= 0 && h.players[0].hand.indexOf(C(3, 3)) >= 0);
t('l’ultima pescata è la briscola scoperta', h.players[2].hand.indexOf(C(5, 1)) >= 0 && h.deck.length === 0);
t('a mazzo finito i compagni si vedono le carte', h.open === true);
t('segni al compagno', E.act(h, 0, { a: 'sign', k: 'asso' }) === null && h.signs[0].k === 'asso' && E.act(h, 0, { a: 'sign', k: 'boh' }) !== null);
var two = E.newGame(seats(2), {});
t('in 2: si gioca uno contro uno', two.players.length === 2 && E.team(two, 1) === 1 && two.deck.length === 34 && E.act(two, two.turn, { a: 'sign', k: 'asso' }) !== null);
// fine della mano e della partita
var f = E.newGame(seats(2), { match: 2 }); f.deck = []; f.turn = f.lead = 0; f.taken = [[C(1, 0), C(1, 1), C(1, 2), C(3, 0), C(3, 1), C(3, 2)], []];
f.players[0].hand = [C(4, 0)]; f.players[1].hand = [C(5, 0)];
E.act(f, 0, { a: 'play', c: C(4, 0) }); E.act(f, 1, { a: 'play', c: C(5, 0) });
t('fine mano: più di 60 punti vince la mano', f.phase === 'scores' && f.res.pts.join() === '63,0' && f.wins.join() === '1,0');
E.act(f, 0, { a: 'next' }); E.act(f, 1, { a: 'next' });
t('si rimescola e si riparte', f.hand === 2 && f.phase === 'play' && f.players.every(function (P) { return P.hand.length === 3; }));
f.wins = [1, 0]; f.deck = []; f.players[0].hand = [C(4, 0)]; f.players[1].hand = [C(5, 0)]; f.taken = [[C(1, 0), C(1, 1), C(1, 2), C(3, 0), C(3, 1), C(3, 2)], []]; f.turn = 0; f.trick = [];
E.act(f, 0, { a: 'play', c: C(4, 0) }); E.act(f, 1, { a: 'play', c: C(5, 0) });
t('chi vince due mani vince la partita', f.phase === 'over' && f.winners.join() === '0');
// partite tra automatici
var bad = 0, N = +process.argv[2] || 30, wins = [0, 0];
[2, 4].forEach(function (n) {
  for (var k = 0; k < N; k++) {
    var b = E.newGame(seats(n).map(function (x) { x.bot = true; return x; }), { match: 3 }), guard = 0;
    while (b.phase !== 'over' && guard++ < 5000) {
      var q = E.pending(b)[0]; if (q == null) { E.forceNext(b); continue; }
      var s = B.sign(b, q); if (s) E.act(b, q, s);
      var err = E.act(b, q, B.decide(b, q)); if (err) { bad++; console.log('errore', err); break; }
      if (b.phase === 'scores') { var tot = b.res.pts[0] + b.res.pts[1]; if (tot !== 120) { bad++; console.log('punti', tot); } }
    }
    if (b.phase !== 'over') bad++;
  }
});
t('partite tra automatici in 2 e in 4 finite senza errori, sempre 120 punti per mano', bad === 0, bad);
console.log('Briscola: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
