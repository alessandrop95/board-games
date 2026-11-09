// gioco: skyjo
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


// ===== Skyjo Action =====
var S = E.STAR;
function ag(n) { var x = E.newGame(seats(n || 2), { action: true }); x.phase = 'play'; x.turn = 0; x.turnN = 5; return x; }
var AD = E.actionDeck();
t('Action: 120 carte con 8 stelle', AD.length === 120 && AD.filter(function (v) { return v === S; }).length === 8);
t('Action: 27 carte Azione, 3 per tipo', E.aDeck().length === 27 && E.ATYPES.every(function (k) { return E.aDeck().filter(function (x) { return x === k; }).length === 3; }));
var ga = E.newGame(seats(3), { action: true });
t('Action: fila di 4 Azioni scoperte', ga.arow.length === 4 && ga.arow.every(Boolean) && ga.adeck.length === 23);
t('Action: senza la variante niente carte Azione', E.act(endSetup(1, 1, 0), 0, { a: 'grab', r: 0 }) !== null);
// stella jolly in colonna
var a1 = ag(); a1.players[0].grid = grid([7, 1, 2, 3, S, 4, 5, 6, 9, 8, 0, 1], [0, 4]); a1.disc = [7];
t('Action: la stella fa da jolly nella colonna', E.act(a1, 0, { a: 'take', i: 8 }) === null && a1.players[0].grid[0] === null && a1.players[0].grid[8] === null);
// riga di quattro uguali
var a2 = ag(); a2.players[0].grid = grid([4, 4, S, 9, 1, 2, 3, 5, 6, 7, 8, 10], [0, 1, 2]); a2.disc = [4];
t('Action: quattro uguali in riga se ne vanno', E.act(a2, 0, { a: 'take', i: 3 }) === null && [0, 1, 2, 3].every(function (i) { return a2.players[0].grid[i] === null; }));
var a3 = ag(); a3.players[0].grid = grid([S, S, S, 9, 1, 2, 3, 5, 6, 7, 8, 10], [0, 1, 2]); a3.disc = [S];
E.act(a3, 0, { a: 'take', i: 3 });
t('Action: riga di sole stelle vale −15', a3.players[0].rb === -15 && a3.players[0].grid[0] === null);
t('Action: prendere una stella dagli scarti dà una carta Azione', a3.players[0].bonus === 1 && a3.turn === 0 && a3.hold);
t('Action: prima si sceglie la carta Azione', E.act(a3, 0, { a: 'draw' }) !== null);
var k0 = a3.arow[1];
t('Action: si prende dalla fila e la fila si riempie', E.act(a3, 0, { a: 'bonus', r: 1 }) === null && a3.players[0].acts[0].k === k0 && a3.arow.every(Boolean) && a3.turn === 1);
t('Action: la carta presa si gioca dal turno dopo', a3.players[0].acts[0].t === 5);
// stella pescata
var a4 = ag(); a4.deck.push(S); E.act(a4, 0, { a: 'draw' });
t('Action: pescare una stella dà una carta Azione', a4.players[0].bonus === 1 && E.act(a4, 0, { a: 'swap', i: 0 }) !== null);
t('Action: si può rinunciare', E.act(a4, 0, { a: 'bonus', r: 'skip' }) === null && a4.players[0].acts.length === 0 && E.act(a4, 0, { a: 'swap', i: 0 }) === null && a4.turn === 1);
// prendere una carta Azione come turno; non si gioca subito
var a5 = ag(); var k5 = a5.arow[0];
t('Action: prendere una carta Azione è il turno', E.act(a5, 0, { a: 'grab', r: 0 }) === null && a5.players[0].acts[0].k === k5 && a5.turn === 1);
var a6 = ag(); a6.players[0].acts = [{ k: 'two', t: 5 }];
t('Action: non si gioca la carta presa in questo turno', E.act(a6, 0, { a: 'use', j: 0 }) !== null);
a6.players[0].acts[0].t = 4;
t('Action: «Doppio turno» dà due turni in più', E.act(a6, 0, { a: 'use', j: 0 }) === null && a6.extra === 1 && a6.turn === 0 && a6.adisc.indexOf('two') >= 0);
a6.deck.push(3); E.act(a6, 0, { a: 'draw' }); E.act(a6, 0, { a: 'swap', i: 0 });
t('Action: … il primo', a6.turn === 0 && a6.extra === 0);
a6.deck.push(3); E.act(a6, 0, { a: 'draw' }); E.act(a6, 0, { a: 'swap', i: 1 });
t('Action: … e il secondo, poi tocca al prossimo', a6.turn === 1);
// scambio e scudo
var a7 = ag(3); a7.players[0].acts = [{ k: 'exch', t: 0 }, { k: 'exch', t: 0 }];
a7.players[0].grid = grid([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [0, 1]); a7.players[1].grid = grid([-2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], true);
t('Action: «Scambio» tra me e un avversario', E.act(a7, 0, { a: 'use', j: 0, p1: 0, i1: 0, p2: 1, i2: 0 }) === null && a7.players[0].grid[0].v === -2 && a7.players[1].grid[0].v === 12 && a7.turn === 1);
a7.turn = 0; a7.players[2].acts = [{ k: 'prot', t: 0 }]; a7.players[2].grid = grid([-1, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], true);
t('Action: lo «Scudo» blocca lo scambio e si scarta', E.act(a7, 0, { a: 'use', j: 0, p1: 0, i1: 1, p2: 2, i2: 0 }) === null && a7.players[2].grid[0].v === -1 && a7.players[2].acts.length === 0 && a7.players[0].acts.length === 0);
// rimescola
var a8 = ag(); a8.players[0].acts = [{ k: 'swap2', t: 0 }]; a8.players[0].grid = grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], [0]);
t('Action: «Rimescola» scambia due carte (anche coperte)', E.act(a8, 0, { a: 'use', j: 0, i1: 0, i2: 11 }) === null && a8.players[0].grid[0].v === 12 && !a8.players[0].grid[0].up && a8.players[0].grid[11].v === 1 && a8.players[0].grid[11].up);
// pesca tre
var a9 = ag(); a9.players[0].acts = [{ k: 'draw3', t: 0 }]; a9.deck.push(5, -2, 9); a9.players[0].grid = grid([12, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [0]);
t('Action: «Pesca tre»', E.act(a9, 0, { a: 'use', j: 0 }) === null && a9.pick && a9.pick.cards.join() === '9,-2,5' && a9.turn === 0);
t('Action: … poi si sceglie per forza', E.act(a9, 0, { a: 'draw' }) !== null);
t('Action: … si tiene il −2 al posto del 12', E.act(a9, 0, { a: 'pick', c: 1, i: 0 }) === null && a9.players[0].grid[0].v === -2 && a9.disc.slice(-3).join() === '9,5,12' && a9.turn === 1);
var a10 = ag(); a10.players[0].acts = [{ k: 'draw3', t: 0 }]; a10.deck.push(10, 11, 12); a10.players[0].grid[3] = { v: 4, up: false }; E.act(a10, 0, { a: 'use', j: 0 });
t('Action: … o si scartano tutte e si scopre una carta', E.act(a10, 0, { a: 'pick', c: -1, i: 3 }) === null && a10.players[0].grid[3].up && a10.turn === 1);
// sbircia
var a11 = ag(); a11.players[0].acts = [{ k: 'look', t: 0 }];
t('Action: «Sbircia» una colonna dell’avversario', E.act(a11, 0, { a: 'use', j: 0, t: 1, col: 2 }) === null && a11.players[0].seen.length === 3 && a11.players[0].seen.every(function (s) { return s.t === 1 && s.v === a11.players[1].grid[s.i].v; }) && a11.players[1].grid[2].up === false);
// spazzata
var a12 = ag(3); a12.players[0].acts = [{ k: 'rmall', t: 0 }]; a12.players[1].grid = grid([-2, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11], [0]); a12.players[2].acts = [{ k: 'two', t: 0 }];
t('Action: «Spazzata» chiede una carta per ogni avversario', E.act(a12, 0, { a: 'use', j: 0, picks: [{ p: 1, i: 0 }] }) !== null);
t('Action: … toglie il −2 (rimpiazzato da una coperta) e una carta Azione', E.act(a12, 0, { a: 'use', j: 0, picks: [{ p: 1, i: 0 }, { p: 2, j: 0 }] }) === null && !a12.players[1].grid[0].up && a12.disc[a12.disc.length - 1] === -2 && a12.players[2].acts.length === 0);
// ripesca e furto
var a13 = ag(); a13.players[0].acts = [{ k: 'redo', t: 0 }]; a13.adisc = ['swap2']; a13.players[0].grid = grid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12], true);
t('Action: «Ripesca» gioca una carta dagli scarti delle Azioni', E.act(a13, 0, { a: 'use', j: 0, j2: 0 }) === null && a13.chain && a13.chain.k === 'swap2' && a13.turn === 0);
t('Action: … con i suoi bersagli', E.act(a13, 0, { a: 'chain', i1: 0, i2: 1 }) === null && a13.players[0].grid[0].v === 2 && a13.turn === 1);
var a14 = ag(); a14.players[0].acts = [{ k: 'steal', t: 0 }]; a14.players[1].acts = [{ k: 'two', t: 0 }];
t('Action: «Furto» ruba e gioca subito', E.act(a14, 0, { a: 'use', j: 0, t: 1, tj: 0 }) === null && a14.players[1].acts.length === 0 && a14.extra === 1 && a14.turn === 0);
// scartare senza effetto, fine manche
var a15 = ag(); a15.players[0].acts = [{ k: 'look', t: 0 }];
t('Action: si può scartare una carta Azione senza effetto', E.act(a15, 0, { a: 'toss', j: 0 }) === null && a15.players[0].acts.length === 0 && a15.turn === 1);
var a16 = ag(); a16.players[0].grid = grid([1, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0], [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11]); a16.players[1].grid = grid([5, 5, 5, 6, 0, 0, 0, 0, 0, 0, 0, 0], [0]);
a16.players[1].acts = [{ k: 'two', t: 0 }, { k: 'look', t: 0 }]; a16.deck.push(3);
E.act(a16, 0, { a: 'draw' }); E.act(a16, 0, { a: 'drop', i: 0 });
t('Action: dopo la chiusura niente più carte Azione', a16.ender === 0 && E.act(a16, 1, { a: 'use', j: 0 }) !== null && E.act(a16, 1, { a: 'grab', r: 0 }) !== null);
a16.deck.push(0); E.act(a16, 1, { a: 'draw' }); E.act(a16, 1, { a: 'swap', i: 3 });
t('Action: ogni carta Azione in mano vale +10 a fine manche', a16.phase === 'scores' && a16.roundRes.pen[1] === 20 && a16.roundRes.raw[1] === 15 + 20 && a16.players[1].acts.length === 0);

// ===== eliminazione =====
function eg(totals) {
  var x = E.newGame(seats(totals.length), { elim: true }); x.phase = 'play'; x.turn = 0;
  x.players.forEach(function (P, i) { P.total = totals[i]; P.grid = grid([0, 0, 0, 0, 0, 0, 0, 0, 0, 0, 0, i === 0 ? 1 : 30], i === 0 ? [0, 1, 2, 3, 4, 5, 6, 7, 8, 9, 10] : true); P.grid[11].up = i !== 0; });
  x.players.forEach(function (P, i) { if (i) P.grid[11] = { v: i === 1 ? 30 : 0, up: true }; });
  return x;
}
function playRound(x) { var guard = 0; while (x.phase === 'play' && guard++ < 50) { var p = x.turn; x.deck.push(0); E.act(x, p, { a: 'draw' }); var h = E.hidden(x.players[p]); E.act(x, p, h.length ? { a: 'drop', i: h[0] } : { a: 'swap', i: E.live(x.players[p])[0] }); } }
var e1 = eg([0, 80, 10]); playRound(e1);
t('eliminazione: chi arriva a 100 è eliminato ma si continua', e1.phase === 'scores' && e1.players[1].out && !e1.players[0].out && !e1.players[2].out);
E.act(e1, 0, { a: 'next' });
t('eliminazione: l’eliminato non deve dare il via', e1.phase === 'scores' && E.pending(e1).join() === '2');
t('eliminazione: l’eliminato non gioca più', E.act(e1, 1, { a: 'next' }) !== null);
E.act(e1, 2, { a: 'next' });
t('eliminazione: nuova manche senza di lui', e1.phase === 'reveal' && e1.players[1].grid.length === 0 && E.pending(e1).join() === '0,2');
e1.players.forEach(function (P, p) { if (!P.out) { E.act(e1, p, { a: 'flip', i: 0 }); E.act(e1, p, { a: 'flip', i: 1 }); } });
t('eliminazione: i turni saltano l’eliminato', e1.phase === 'play' && (function () { var seen = []; for (var k = 0; k < 4; k++) { var p = e1.turn; seen.push(p); e1.deck.push(5); E.act(e1, p, { a: 'draw' }); E.act(e1, p, { a: 'swap', i: 0 }); } return seen.indexOf(1) < 0; })());
var e2 = eg([0, 80, 95]); e2.players[2].grid[11].v = 10; playRound(e2);
t('eliminazione: resta uno solo e vince lui', e2.phase === 'over' && e2.winners.join() === '0' && e2.final.order[0] === 0 && e2.players[1].out && e2.players[2].out);
t('eliminazione: in classifica conta il punteggio tra chi esce insieme', e2.final.place[0] === 1 && e2.final.place[2] === 2 && e2.final.place[1] === 3);
var e3 = eg([95, 99]); e3.players[0].grid[11].v = 12; playRound(e3);
t('eliminazione: se escono tutti insieme vince il totale più basso', e3.phase === 'over' && e3.winners.join() === '0' && e3.players.every(function (P) { return P.out; }));
var e4 = eg([0, 80, 10]); e4.opts.elim = false; playRound(e4);
t('senza eliminazione a 100 la partita finisce', e4.phase === 'over');

console.log('Skyjo: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
