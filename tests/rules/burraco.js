// gioco: burraco
// Prove delle regole del Burraco (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/burraco/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function C(r, s, d) { return (d ? 52 : 0) + s * 13 + r - 1; }   // valore 1-13, seme 0 picche 1 cuori 2 quadri 3 fiori, secondo mazzo
var J = 104;

t('valori: jolly 30, pinella 20, asso 15, figure e 8-10 10, 3-7 5', E.value(J) === 30 && E.value(C(2, 0)) === 20 && E.value(C(1, 1)) === 15 && E.value(C(12, 2)) === 10 && E.value(C(8, 3)) === 10 && E.value(C(7, 0)) === 5);
t('tris', E.analyze([C(9, 0), C(9, 1), C(9, 1, 1)]).type === 'set');
t('tris con una matta', E.analyze([C(9, 0), C(9, 1), J]).type === 'set' && !E.analyze([C(9, 0), C(9, 1), J]).clean);
t('non due matte', E.analyze([C(9, 0), C(2, 1), J]) === null && E.analyze([C(5, 1), C(2, 2), J, C(7, 1)]) === null);
t('scala dello stesso seme', E.analyze([C(5, 1), C(6, 1), C(7, 1)]).type === 'run' && E.analyze([C(5, 1), C(6, 2), C(7, 1)]) === null);
t('scala con la matta nel buco', E.analyze([C(5, 1), J, C(7, 1)]).cards.join() === [C(5, 1), J, C(7, 1)].join());
t('scala con l’asso sotto e sopra', !!E.analyze([C(1, 3), C(2, 3), C(3, 3)]) && !!E.analyze([C(12, 3), C(13, 3), C(1, 3)]) && E.analyze([C(13, 3), C(1, 3), C(3, 3)]) === null && !!E.analyze([C(13, 3), C(1, 3), C(2, 3)]));
t('la pinella al suo posto è una carta normale (scala pulita)', E.analyze([C(1, 0), C(2, 0), C(3, 0), C(4, 0)]).clean);
t('la pinella di un altro seme è una matta', !E.analyze([C(3, 0), C(2, 1), C(5, 0)]).clean);
t('scala con pinella normale e jolly', !!E.analyze([C(1, 0), C(2, 0), C(3, 0), J, C(5, 0)]));
var g = E.newGame(seats(4), {});
t('in 4: 11 carte a testa, due pozzetti da 11, una carta sugli scarti', g.players.every(function (P) { return P.hand.length === 11; }) && g.pozzo[0].length === 11 && g.pozzo[1].length === 11 && g.pile.length === 1 && g.deck.length === 108 - 44 - 22 - 1);
var p = g.turn;
t('prima si pesca', E.act(g, p, { a: 'discard', c: g.players[p].hand[0] }) !== null);
t('pesca dal mazzo', E.act(g, p, { a: 'draw' }) === null && g.players[p].hand.length === 12 && g.step === 'play');
t('una volta sola', E.act(g, p, { a: 'pile' }) !== null);
// partita controllata
function setup(hands, opts) { var x = E.newGame(seats(hands.length), opts || {}); x.players.forEach(function (P, i) { P.hand = hands[i]; }); x.turn = 0; x.step = 'play'; return x; }
var m = setup([[C(5, 1), C(6, 1), C(7, 1), C(9, 0), J, C(3, 2)], [C(4, 0)]]);
t('calare una scala', E.act(m, 0, { a: 'meld', cards: [C(5, 1), C(6, 1), C(7, 1)] }) === null && m.melds[0].length === 1 && m.players[0].hand.length === 3);
t('combinazione sbagliata no', E.act(m, 0, { a: 'meld', cards: [C(9, 0), C(3, 2), J] }) !== null);
t('attaccare alla propria combinazione', E.act(m, 0, { a: 'add', m: m.melds[0][0].id, cards: [J] }) === null && m.melds[0][0].cards.length === 4 && !m.melds[0][0].clean);
t('scartare passa il turno', E.act(m, 0, { a: 'discard', c: C(3, 2) }) === null && m.turn === 1 && m.pile[m.pile.length - 1] === C(3, 2));
t('il prossimo prende tutti gli scarti', E.act(m, 1, { a: 'pile' }) === null && m.players[1].hand.indexOf(C(3, 2)) >= 0 && m.pile.length === 0);
// pozzetto e chiusura
var z = setup([[C(5, 1), C(6, 1), C(7, 1)], [C(4, 0)]]);
t('chi cala tutto prende il pozzetto al volo', E.act(z, 0, { a: 'meld', cards: [C(5, 1), C(6, 1), C(7, 1)] }) === null && z.took[0] && z.players[0].hand.length === 11);
var y = setup([[C(5, 1), C(9, 2)], [C(4, 0)]]); y.took[0] = true;
t('dopo il pozzetto non si resta senza carte calando', E.act(y, 0, { a: 'meld', cards: [C(5, 1)] }) !== null);
var y1 = setup([[C(5, 1), C(6, 1), C(7, 1), C(9, 2)], [C(4, 0)]]); y1.took[0] = true;
t('né con una carta sola se non si può chiudere', E.act(y1, 0, { a: 'meld', cards: [C(5, 1), C(6, 1), C(7, 1)] }) !== null);
t('senza burraco non si chiude', (function () { E.act(y, 0, { a: 'discard', c: C(5, 1) }); E.act(y, 1, { a: 'draw' }); E.act(y, 1, { a: 'discard', c: y.players[1].hand[0] }); E.act(y, 0, { a: 'draw' }); E.act(y, 0, { a: 'discard', c: y.players[0].hand[0] }); return E.act(y, 0, { a: 'discard', c: y.players[0].hand[0] }) !== null; })());
var cl = setup([[C(3, 3)], [C(4, 0), C(9, 0)]]); cl.took[0] = true;
cl.melds[0] = [{ id: 1, type: 'run', cards: [C(5, 1), C(6, 1), C(7, 1), C(8, 1), C(9, 1), C(10, 1), C(11, 1)], clean: true }];
t('con il pozzetto e un burraco si chiude scartando l’ultima carta', E.act(cl, 0, { a: 'discard', c: C(3, 3) }) === null && cl.phase !== 'play' && cl.res.closer === 0);
var s0 = cl.res.s[0], s1 = cl.res.s[1];
t('punti: carte calate + burraco pulito 200 + chiusura 100', s0.cards === 5 * 3 + 10 * 4 && s0.bur === 200 && s0.close === 100 && s0.tot === 55 + 300);
t('punti: carte in mano in meno e -100 senza pozzetto', s1.minus === 5 + 10 && s1.pozzo === -100 && s1.tot === -115);
// partite tra automatici
var bad = 0, N = +process.argv[2] || 8, closes = 0, hands = 0;
[2, 4].forEach(function (n) {
  for (var k = 0; k < N; k++) {
    var b = E.newGame(seats(n).map(function (x) { x.bot = true; return x; }), { target: 1005 }), guard = 0;
    while (b.phase !== 'over' && guard++ < 20000) {
      var q = E.pending(b)[0]; if (q == null) { E.forceNext(b); continue; }
      var a = B.decide(b, q);
      if (!a) { bad++; console.log('automatico bloccato', b.players[q].hand.length); break; }
      var err = E.act(b, q, a); if (err) { bad++; console.log('errore', err, JSON.stringify(a)); break; }
      if (b.res && b.phase !== 'play' && b.res.closer != null && guard) { }
    }
    if (b.phase !== 'over') { bad++; console.log('non finita', b.phase, b.totals); }
    hands += b.hand; closes += b.hist.length;
    var cnt = b.deck.length + b.pile.length + b.pozzo[0].length + b.pozzo[1].length + b.players.reduce(function (s, P) { return s + P.hand.length; }, 0) + b.melds[0].concat(b.melds[1]).reduce(function (s, m) { return s + m.cards.length; }, 0);
    if (cnt !== 108) { bad++; console.log('carte', cnt); }
  }
});
t('partite tra automatici in 2 e in 4 finite senza errori, con tutte le 108 carte', bad === 0, bad);
console.log('mani per partita: ' + (hands / N / 2).toFixed(1));
console.log('Burraco: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
