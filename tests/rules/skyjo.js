// Prove delle regole di Skyjo (una prova per regola)
var path = require('path'), SRC = path.join(__dirname, '../../src/skyjo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function grid(vals, up) { return vals.map(function (v, i) { return { v: v, up: !!(up === true || (up && up.indexOf(i) >= 0)) }; }); }
function count(g) { return g.deck.length + g.disc.length + (g.drawn ? 1 : 0) + g.players.reduce(function (s, P) { return s + P.grid.filter(Boolean).length; }, 0); }

// --- il mazzo ---
var D = E.fullDeck();
t('150 carte', D.length === 150);
t('5 carte da −2, 10 da −1, 15 da 0', D.filter(function (v) { return v === -2; }).length === 5 && D.filter(function (v) { return v === -1; }).length === 10 && D.filter(function (v) { return v === 0; }).length === 15);
t('10 carte per ogni valore da 1 a 12', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every(function (v) { return D.filter(function (x) { return x === v; }).length === 10; }));

// --- preparazione ---
var g = E.newGame(seats(3), {});
t('12 carte coperte a testa', g.players.every(function (P) { return P.grid.length === 12 && P.grid.every(function (x) { return !x.up; }); }));
t('una carta scoperta sugli scarti', g.disc.length === 1);
t('tutte le 150 carte ci sono', count(g) === 150);
t('soglia di 100 punti', g.opts.target === 100 && E.newGame(seats(2), { target: 50 }).opts.target === 50 && E.newGame(seats(2), { target: 7 }).opts.target === 100);
t('prima si scoprono due carte: niente pesca', E.act(g, 0, { a: 'draw' }) !== null);
t('scoprire una carta', E.act(g, 0, { a: 'flip', i: 0 }) === null && g.players[0].grid[0].up);
t('la stessa carta due volte no', E.act(g, 0, { a: 'flip', i: 0 }) !== null);
t('casella che non esiste', E.act(g, 0, { a: 'flip', i: 12 }) !== null && E.act(g, 0, { a: 'flip', i: -1 }) !== null);
E.act(g, 0, { a: 'flip', i: 5 });
t('non più di due', E.act(g, 0, { a: 'flip', i: 7 }) !== null);
t('si aspettano gli altri', g.phase === 'reveal' && E.pending(g).join() === '1,2');
// somma più alta comincia
g.players[1].grid[0].v = 12; g.players[1].grid[1].v = 12;
g.players[0].grid[0].v = 1; g.players[0].grid[5].v = 1;
g.players[2].grid[0].v = 0; g.players[2].grid[1].v = 0;
E.act(g, 1, { a: 'flip', i: 0 }); E.act(g, 1, { a: 'flip', i: 1 }); E.act(g, 2, { a: 'flip', i: 0 }); E.act(g, 2, { a: 'flip', i: 1 });
t('comincia chi ha la somma più alta', g.phase === 'play' && g.turn === 1);

// --- il turno ---
t('non è il tuo turno', E.act(g, 0, { a: 'draw' }) !== null);
g.disc[g.disc.length - 1] = -2;
var before = g.players[1].grid[3].v;
t('prendere dagli scarti e mettere al posto di una coperta', E.act(g, 1, { a: 'take', i: 3 }) === null && g.players[1].grid[3].v === -2 && g.players[1].grid[3].up && g.disc[g.disc.length - 1] === before);
t('poi tocca al giocatore dopo', g.turn === 2);
t('pescare dal mazzo', E.act(g, 2, { a: 'draw' }) === null && g.drawn && g.drawn.from === 'deck');
t('non si pesca due volte', E.act(g, 2, { a: 'draw' }) !== null);
t('con la carta pescata non si prende dagli scarti', E.act(g, 2, { a: 'take', i: 4 }) !== null);
t('scartare e scoprire: solo una carta coperta', E.act(g, 2, { a: 'drop', i: 0 }) !== null);
var dv = g.drawn.v;
t('scartare la carta pescata e scoprirne una', E.act(g, 2, { a: 'drop', i: 6 }) === null && g.players[2].grid[6].up && g.disc[g.disc.length - 1] === dv && g.turn === 0);
E.act(g, 0, { a: 'draw' }); var dv2 = g.drawn.v, old = g.players[0].grid[0].v;
t('tenere la carta pescata al posto di una scoperta', E.act(g, 0, { a: 'swap', i: 0 }) === null && g.players[0].grid[0].v === dv2 && g.disc[g.disc.length - 1] === old);
t('scambiare senza aver pescato no', E.act(g, 1, { a: 'swap', i: 0 }) !== null);
t('le carte restano 150', count(g) === 150);

// --- colonne ---
var h = E.newGame(seats(2), {});
h.phase = 'play'; h.turn = 0;
h.players[0].grid = grid([7, 1, 2, 3, 7, 4, 5, 6, 9, 8, 0, 1], [0, 4]);
h.disc = [7];
t('tre uguali in colonna se ne vanno', E.act(h, 0, { a: 'take', i: 8 }) === null && h.players[0].grid[0] === null && h.players[0].grid[4] === null && h.players[0].grid[8] === null);
t('le tre carte finiscono sugli scarti', h.disc.slice(-3).join() === '7,7,7');
t('effetto della colonna per i telefoni', h.fx.some(function (e) { return e.k === 'col' && e.c === 0 && e.v === 7; }));
var h2 = E.newGame(seats(2), {}); h2.phase = 'play'; h2.turn = 0;
h2.players[0].grid = grid([7, 1, 2, 3, 7, 4, 5, 6, 9, 8, 0, 1], [0]);
h2.disc = [7];
t('serve che siano scoperte tutte e tre', E.act(h2, 0, { a: 'take', i: 8 }) === null && h2.players[0].grid[0] !== null);
var h3 = E.newGame(seats(2), {}); h3.phase = 'play'; h3.turn = 0;
h3.players[0].grid = grid([5, 1, 2, 3, 5, 4, 5, 6, 9, 8, 0, 1], [0, 4]);
h3.disc = [5];
t('in riga non conta', E.act(h3, 0, { a: 'take', i: 1 }) === null && h3.players[0].grid[0] !== null);

// --- fine della manche ---
function endSetup(raw0, raw1, ender) {
  var x = E.newGame(seats(2), {}); x.phase = 'play'; x.turn = ender;
  // l'ultimo a giocare chiude: tutte scoperte tranne una
  x.players[0].grid = grid([raw0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 1], ender === 0 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : true);
  x.players[1].grid = grid([raw1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 2], ender === 1 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : [0]);
  return x;
}
var f = endSetup(10, 3, 0);
f.deck.push(5); E.act(f, 0, { a: 'draw' });
t('chi scopre l’ultima carta chiude', E.act(f, 0, { a: 'drop', i: 11 }) === null && f.ender === 0 && f.phase === 'play' && f.turn === 1);
t('gli altri hanno ancora un turno', E.pending(f).join() === '1');
f.deck.push(4); E.act(f, 1, { a: 'draw' }); E.act(f, 1, { a: 'drop', i: 5 });
t('poi la manche finisce e si scopre tutto', f.phase === 'scores' && f.players[1].grid.every(function (x) { return !x || x.up; }));
t('chi chiude senza il punteggio più basso raddoppia', f.roundRes.raw[0] === 11 && f.roundRes.pts[0] === 22 && f.roundRes.doubled && f.players[0].total === 22);
t('gli altri contano normale', f.roundRes.pts[1] === f.roundRes.raw[1]);
var f2 = endSetup(-2, 30, 0); f2.deck.push(5); E.act(f2, 0, { a: 'draw' }); E.act(f2, 0, { a: 'drop', i: 11 }); f2.deck.push(4); E.act(f2, 1, { a: 'draw' }); E.act(f2, 1, { a: 'drop', i: 5 });
t('con il punteggio più basso niente raddoppio', !f2.roundRes.doubled && f2.roundRes.pts[0] === -1);
var f3 = endSetup(1, 1, 0); f3.players[1].grid[11].v = 1; f3.deck.push(5); E.act(f3, 0, { a: 'draw' }); E.act(f3, 0, { a: 'drop', i: 11 }); f3.deck.push(4); f3.players[1].grid[5].v = 0; E.act(f3, 1, { a: 'draw' }); E.act(f3, 1, { a: 'drop', i: 5 });
t('a pari punteggio si raddoppia (serve il più basso da solo)', f3.roundRes.raw[0] === 2 && f3.roundRes.raw[1] === 2 && f3.roundRes.doubled && f3.roundRes.pts[0] === 4);
var f4 = endSetup(-12, -2, 0); f4.players[1].grid[11].v = -12; f4.deck.push(5); E.act(f4, 0, { a: 'draw' }); E.act(f4, 0, { a: 'drop', i: 11 }); f4.deck.push(4); f4.players[1].grid[5].v = 0; E.act(f4, 1, { a: 'draw' }); E.act(f4, 1, { a: 'drop', i: 5 });
t('punti negativi non raddoppiano', f4.roundRes.doubled === false && f4.roundRes.pts[0] === -11);
t('fino a quando non si tocca «Prossima manche»', f.phase === 'scores' && E.act(f, 0, { a: 'draw' }) !== null);
E.act(f, 0, { a: 'next' });
t('si aspettano tutti', f.phase === 'scores' && E.pending(f).join() === '1');
E.act(f, 1, { a: 'next' });
t('nuova manche: carte nuove e due da scoprire', f.phase === 'reveal' && f.round === 2 && f.players.every(function (P) { return P.grid.length === 12 && E.flips(P) === 0; }) && count(f) === 150);
f.players.forEach(function (P, p) { E.act(f, p, { a: 'flip', i: 0 }); E.act(f, p, { a: 'flip', i: 1 }); });
t('nella manche dopo comincia chi ha chiuso', f.phase === 'play' && f.turn === 0);
t('l’host può far partire la manche senza aspettare', (function () { var x = endSetup(10, 3, 0); x.deck.push(5); E.act(x, 0, { a: 'draw' }); E.act(x, 0, { a: 'drop', i: 11 }); x.deck.push(4); E.act(x, 1, { a: 'draw' }); E.act(x, 1, { a: 'drop', i: 5 }); return E.forceNext(x) && x.phase === 'reveal'; })());

// --- fine della partita ---
var o = endSetup(10, 3, 0); o.players[1].total = 95;
o.deck.push(5); E.act(o, 0, { a: 'draw' }); E.act(o, 0, { a: 'drop', i: 11 }); o.deck.push(4); E.act(o, 1, { a: 'draw' }); E.act(o, 1, { a: 'drop', i: 5 });
t('a 100 punti la partita finisce', o.phase === 'over' && o.players[1].total >= 100);
t('vince il totale più basso', o.winners.join() === '0' && o.final.order[0] === 0);
t('dopo la fine niente mosse', E.act(o, 0, { a: 'draw' }) !== null);

// --- mazzo finito ---
var m = E.newGame(seats(2), {}); m.phase = 'play'; m.turn = 0;
m.disc = m.disc.concat(m.deck.splice(0)); var top = m.disc[m.disc.length - 1], n0 = m.disc.length;
t('mazzo finito: si rimescolano gli scarti tranne l’ultimo', E.act(m, 0, { a: 'draw' }) === null && m.disc.length === 1 && m.disc[0] === top && m.deck.length === n0 - 2 && count(m) === 150);

// --- giocatori automatici ---
var b = E.newGame(seats(2), {}); b.phase = 'play'; b.turn = 0;
b.players[0].grid = grid([9, 1, 2, 3, 9, 4, 5, 6, 0, 8, 0, 1], [0, 4, 8]);
b.disc = [9];
var a = B.decide(b, 0);
t('il bot chiude una colonna quando può', a.a === 'take' && a.i === 8, a);
var b2 = E.newGame(seats(2), {}); b2.phase = 'play'; b2.turn = 0;
b2.players[0].grid = grid([12, 1, 2, 3, 0, 4, 5, 6, 0, 8, 0, 1], [0, 4]); b2.disc = [-2];
var a2 = B.decide(b2, 0);
t('il bot prende un −2 dagli scarti al posto del 12', a2.a === 'take' && a2.i === 0, a2);
b2.disc = [11]; var a3 = B.decide(b2, 0);
t('il bot non prende un 11 dagli scarti', a3.a === 'draw', a3);
t('il bot nella fase iniziale scopre una carta', B.decide(E.newGame(seats(2), {}), 0).a === 'flip');

console.log('Skyjo: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
