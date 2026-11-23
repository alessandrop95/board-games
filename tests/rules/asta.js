// gioco: asta
// Prove delle regole di Asta lampo (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/asta/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n, bots) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i, bot: !!bots }); return a; }
function gem(c, v) { return E.CARDS.filter(function (C) { return C.k === 'gem' && C.c === c && C.v === v; })[0].id; }
function curse(v) { return E.CARDS.filter(function (C) { return C.k === 'curse' && C.v === v; })[0].id; }
var T0 = 1000;

var g = E.newGame(seats(3), {}, T0);
t('20 lotti, 20 monete a testa, il primo è una gemma', g.total === 20 && g.deck.length === 19 && g.players.every(function (P) { return P.coins === 20; }) && g.cur.kind === 'gem');
t('partita corta: 12 lotti con 2 maledizioni', (function () { var s = E.newGame(seats(2), { lots: 12 }, T0), all = [s.cur.cards[0]].concat(s.deck); return s.total === 12 && all.filter(function (id) { return E.CARDS[id].k === 'curse'; }).length === 2; })());
t('tempo per offrire scelto', E.newGame(seats(2), { time: 40 }, T0).until === T0 + 40000 && g.until === T0 + 25000);
// lotto pilotato
g.pot = [gem(0, 3)]; g.cur = { kind: 'gem', cards: g.pot.slice() }; g.deck = [gem(0, 4), curse(-4), gem(1, 2)];
t('offerta oltre le monete no', E.act(g, 0, { a: 'bid', b: 21 }, T0) !== null);
t('offerta negativa no', E.act(g, 0, { a: 'bid', b: -1 }, T0) !== null);
t('si offre in segreto', E.act(g, 0, { a: 'bid', b: 5 }, T0) === null && g.phase === 'bid' && E.pending(g).join() === '1,2');
t('si può cambiare offerta finché gli altri non hanno offerto', E.act(g, 0, { a: 'bid', b: 6 }, T0) === null && g.players[0].bid === 6);
E.act(g, 1, { a: 'bid', b: 4 }, T0); E.act(g, 2, { a: 'bid', b: 2 }, T0);
t('quando hanno offerto tutti vince la più alta e paga', g.phase === 'show' && g.res.who === 0 && g.players[0].coins === 14 && g.players[0].gems.join() === String(gem(0, 3)) && g.players[1].coins === 20);
t('durante i risultati non si offre', E.act(g, 1, { a: 'bid', b: 1 }, T0) !== null);
t('i risultati restano qualche secondo', !E.tick(g, T0 + 1000) && E.tick(g, T0 + E.SHOW_MS + 10) && g.phase === 'bid' && g.lot === 2);
// pareggio: il lotto resta e cresce
E.act(g, 0, { a: 'bid', b: 3 }, T0); E.act(g, 1, { a: 'bid', b: 3 }, T0); E.act(g, 2, { a: 'bid', b: 1 }, T0);
t('pari in testa: nessuno vince e nessuno paga', g.res.carried && g.res.who == null && g.players[0].coins === 14 && g.players[1].coins === 20 && g.pot.length === 1);
E.forceNext(g, T0 + 9000);
t('la maledizione non si somma alle gemme sul banco', g.cur.kind === 'curse' && g.pot.length === 1);
// maledizione: la prende chi offre meno e incassa le offerte degli altri
E.act(g, 0, { a: 'bid', b: 2 }, T0); E.act(g, 1, { a: 'bid', b: 3 }, T0); E.act(g, 2, { a: 'bid', b: 0 }, T0);
t('maledizione a chi offre meno, che incassa', g.res.who === 2 && g.players[2].curses.length === 1 && g.players[2].coins === 25 && g.players[0].coins === 12 && g.players[1].coins === 17 && g.res.got === 5);
E.forceNext(g, T0 + 9000);
t('dopo la maledizione le gemme sul banco più una nuova', g.cur.kind === 'gem' && g.cur.cards.length === 2);
E.act(g, 0, { a: 'bid', b: 1 }, T0); E.act(g, 1, { a: 'bid', b: 0 }, T0);
t('chi non offre in tempo offre 0', E.tick(g, g.until) && g.players[2].bid === 0 && g.res.who === 0 && g.players[0].gems.length === 3 && g.pot.length === 0);
// parità sulla maledizione: chi ha più monete
var c = E.newGame(seats(3), {}, T0); c.cur = { kind: 'curse', cards: [curse(-5)] }; c.players[0].coins = 10; c.players[1].coins = 15; c.players[2].coins = 12;
E.act(c, 0, { a: 'bid', b: 1 }, T0); E.act(c, 1, { a: 'bid', b: 1 }, T0); E.act(c, 2, { a: 'bid', b: 4 }, T0);
t('parità tra i più bassi: la prende chi ha più monete', c.res.who === 1 && c.players[1].coins === 15 + 1 + 4 && c.players[0].coins === 9);
// punteggio
var s = E.newGame(seats(2), {}, T0);
s.players[0].gems = [gem(0, 4), gem(1, 1), gem(2, 1), gem(3, 1), gem(0, 2)]; s.players[0].curses = [curse(-3)]; s.players[0].coins = 7;
s.players[1].gems = [gem(1, 3), gem(2, 1)]; s.players[1].coins = 10;
var a = E.score(s, 0), b = E.score(s, 1);
t('gemme, maggioranze (+5, +2 a pari), collezioni, maledizioni, monete a metà', a.gems === 9 && a.maj === 5 + 0 + 2 + 5 && a.sets === 4 && a.curses === -3 && a.coins === 3 && a.total === 9 + 12 + 4 - 3 + 3, JSON.stringify(a));
t('l’altro giocatore', b.gems === 4 && b.maj === 5 + 2 && b.sets === 0 && b.coins === 5 && b.total === 16, JSON.stringify(b));
// fine partita
var f = E.newGame(seats(2), {}, T0); f.deck = []; f.players[0].coins = 30;
E.act(f, 0, { a: 'bid', b: 0 }, T0); E.act(f, 1, { a: 'bid', b: 0 }, T0); E.forceNext(f, T0 + 9000);
t('finiti i lotti l’asta chiude e la gemma rimasta non va a nessuno', f.phase === 'over' && !f.pot.length && f.winners.join() === '0' && f.final.place.join() === '1,2');
// partite intere tra automatici
var bad = 0, N = +process.argv[2] || 10, ties = 0, lots = 0;
for (var n = 2; n <= 6; n++) for (var k = 0; k < N; k++) {
  var z = E.newGame(seats(n, true), { lots: k % 2 ? 12 : 20 }, T0), now = T0, guard = 0;
  while (z.phase !== 'over' && guard++ < 5000) {
    now += 400;
    if (z.phase === 'bid') { for (var p = 0; p < n; p++) { var mv = B.decide(z, p); if (mv) { var err = E.act(z, p, mv, now); if (err) { bad++; console.log('errore', err, mv); } } } }
    else E.tick(z, now + E.SHOW_MS);
  }
  if (z.phase !== 'over') { bad++; console.log('non finita'); }
  z.hist.forEach(function (h) { lots++; if (h.carried) ties++; });
  if (z.players.some(function (P) { return P.coins < 0; })) { bad++; console.log('monete negative'); }
}
t('partite tra automatici da 2 a 6 giocatori finite senza errori', bad === 0, bad);
console.log('lotti saltati per pareggio: ' + Math.round(ties / lots * 100) + '%');
console.log('Asta lampo: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
