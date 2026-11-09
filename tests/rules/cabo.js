// gioco: cabo
// Prove delle regole di Cabo (una prova per regola)
var path = require('path'), SRC = path.join(__dirname, '../../src/cabo/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
var NID = 1000;
function line(vals, up) { return vals.map(function (v, i) { return { id: NID++, v: v, up: !!(up === true || (up && up.indexOf(i) >= 0)) }; }); }
function count(g) { return g.deck.length + g.disc.length + (g.drawn ? 1 : 0) + g.players.reduce(function (s, P) { return s + P.line.length; }, 0); }
function play(n) { var g = E.newGame(seats(n || 2), {}); g.players.forEach(function (P, p) { E.act(g, p, { a: 'look', i: 0 }); E.act(g, p, { a: 'look', i: 1 }); }); g.turn = 0; return g; }
function top(g) { return g.disc[g.disc.length - 1]; }
function push(g, v) { g.deck.push({ id: NID++, v: v }); }

// --- il mazzo ---
var D = E.fullDeck();
t('52 carte', D.length === 52);
t('due 0 e due 13', D.filter(function (c) { return c.v === 0; }).length === 2 && D.filter(function (c) { return c.v === 13; }).length === 2);
t('quattro carte per ogni valore da 1 a 12', [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every(function (v) { return D.filter(function (c) { return c.v === v; }).length === 4; }));
t('poteri: 7-8 sbircia, 9-10 spia, 11-12 scambia', E.power(7) === 'peek' && E.power(8) === 'peek' && E.power(9) === 'spy' && E.power(10) === 'spy' && E.power(11) === 'trade' && E.power(12) === 'trade' && !E.power(6) && !E.power(13) && !E.power(0));

// --- preparazione ---
var g = E.newGame(seats(3), {});
t('4 carte coperte a testa', g.players.every(function (P) { return P.line.length === 4 && P.line.every(function (c) { return !c.up; }); }));
t('una carta sugli scarti, tutte le 52 ci sono', g.disc.length === 1 && count(g) === 52);
t('prima si guardano due carte: niente pesca', E.act(g, g.starter, { a: 'draw' }) !== null);
t('guardare una carta: la conosce solo lui', E.act(g, 0, { a: 'look', i: 2 }) === null && E.knows(g.players[0], g.players[0].line[2]) && !E.knows(g.players[1], g.players[0].line[2]) && !g.players[0].line[2].up);
t('la stessa carta due volte no', E.act(g, 0, { a: 'look', i: 2 }) !== null);
E.act(g, 0, { a: 'look', i: 3 });
t('non più di due', E.act(g, 0, { a: 'look', i: 0 }) !== null);
t('si aspettano gli altri', g.phase === 'peek' && E.pending(g).join() === '1,2');
E.act(g, 1, { a: 'look', i: 0 }); E.act(g, 1, { a: 'look', i: 1 }); E.act(g, 2, { a: 'look', i: 0 }); E.act(g, 2, { a: 'look', i: 1 });
t('poi si gioca da chi comincia', g.phase === 'play' && g.turn === g.starter);
t('soglia di 100 punti', g.opts.target === 100 && E.newGame(seats(2), { target: 50 }).opts.target === 50 && E.newGame(seats(2), { target: 7 }).opts.target === 100);

// --- pescare e scambiare ---
var a = play(); a.players[0].line = line([9, 3, 5, 12]); push(a, 2);
t('fuori turno no', E.act(a, 1, { a: 'draw' }) !== null);
t('pescare dal mazzo', E.act(a, 0, { a: 'draw' }) === null && a.drawn.v === 2 && E.knows(a.players[0], a.drawn) && a.turn === 0);
t('non si pesca due volte', E.act(a, 0, { a: 'draw' }) !== null);
t('niente Cabo dopo aver pescato', E.act(a, 0, { a: 'cabo' }) !== null);
t('tengo il 2 al posto del 12', E.act(a, 0, { a: 'swap', cells: [3] }) === null && a.players[0].line[3].v === 2 && !a.players[0].line[3].up && top(a).v === 12 && a.turn === 1);
t('la carta tenuta la conosco io, non gli altri', E.knows(a.players[0], a.players[0].line[3]) && !E.knows(a.players[1], a.players[0].line[3]));
var b = play(); b.players[0].line = line([9, 3, 5, 12]); b.disc.push({ id: NID++, v: 1 });
t('dagli scarti si deve scambiare', E.act(b, 0, { a: 'take' }) !== null && E.act(b, 0, { a: 'take', cells: [] }) !== null);
t('prendo l’1 dagli scarti: resta scoperto', E.act(b, 0, { a: 'take', cells: [0] }) === null && b.players[0].line[0].v === 1 && b.players[0].line[0].up && top(b).v === 9);
// --- scambio di più carte uguali ---
var c = play(); c.players[0].line = line([7, 4, 7, 10]); push(c, 1); E.act(c, 0, { a: 'draw' });
t('due 7 insieme: se ne vanno entrambi', E.act(c, 0, { a: 'swap', cells: [2, 0] }) === null && c.players[0].line.length === 3 && c.players[0].line.map(function (x) { return x.v; }).join() === '1,4,10' && c.disc.slice(-2).map(function (x) { return x.v; }).join() === '7,7');
var d = play(); d.players[0].line = line([7, 4, 8, 10]); push(d, 1); E.act(d, 0, { a: 'draw' });
t('non uguali: restano scoperte e la carta nuova va in fondo', E.act(d, 0, { a: 'swap', cells: [0, 2] }) === null && d.players[0].line.length === 5 && d.players[0].line[0].up && d.players[0].line[2].up && d.players[0].line[4].v === 1 && !d.players[0].line[1].up);
var e = play(); e.players[0].line = line([7, 4, 8, 10]); push(e, 6); push(e, 1); E.act(e, 0, { a: 'draw' });
t('con 3 carte sbagliate anche una carta di penalità', E.act(e, 0, { a: 'swap', cells: [0, 1, 2] }) === null && e.players[0].line.length === 6 && e.players[0].line[5].v === 6 && !e.players[0].line[5].up);
t('carte che non esistono', E.act(play(), 0, { a: 'take', cells: [4] }) !== null && E.act(play(), 0, { a: 'take', cells: [1, 1] }) !== null);
// --- poteri ---
var f = play(); push(f, 8); E.act(f, 0, { a: 'draw' });
t('scarto un 8: posso sbirciare', E.act(f, 0, { a: 'discard' }) === null && f.power && f.power.k === 'peek' && f.turn === 0);
t('prima il potere', E.act(f, 0, { a: 'draw' }) !== null);
var h3 = f.players[0].line[3];
t('sbircio una mia carta', E.act(f, 0, { a: 'peek', i: 3 }) === null && E.knows(f.players[0], h3) && !h3.up && f.turn === 1);
var s = play(); push(s, 10); E.act(s, 0, { a: 'draw' }); E.act(s, 0, { a: 'discard' });
t('10: spio una carta di un altro', s.power.k === 'spy' && E.act(s, 0, { a: 'spy', t: 0, j: 0 }) !== null && E.act(s, 0, { a: 'spy', t: 1, j: 2 }) === null && E.knows(s.players[0], s.players[1].line[2]) && !s.players[1].line[2].up);
var w = play(); w.players[0].line = line([12, 3, 5, 6]); w.players[1].line = line([0, 9, 9, 9]); push(w, 11); E.act(w, 0, { a: 'draw' }); E.act(w, 0, { a: 'discard' });
t('11: scambio una mia carta con una sua, senza guardare', w.power.k === 'trade' && E.act(w, 0, { a: 'trade', i: 0, t: 1, j: 0 }) === null && w.players[0].line[0].v === 0 && w.players[1].line[0].v === 12 && w.players[0].line.length === 4);
var sk = play(); push(sk, 9); E.act(sk, 0, { a: 'draw' }); E.act(sk, 0, { a: 'discard' });
t('si può rinunciare al potere', E.act(sk, 0, { a: 'skip' }) === null && sk.turn === 1 && !sk.power);
var np = play(); push(np, 5); E.act(np, 0, { a: 'draw' });
t('un 5 scartato non ha poteri', E.act(np, 0, { a: 'discard' }) === null && !np.power && np.turn === 1);
var dp = play(); dp.disc.push({ id: NID++, v: 8 });
t('dagli scarti niente poteri', E.act(dp, 0, { a: 'take', cells: [0] }) === null && !dp.power);

// --- Cabo e punti ---
var k = play(3); k.players[0].line = line([0, 1, 2, 0]); k.players[1].line = line([5, 5, 5, 5]); k.players[2].line = line([9, 9, 9, 9]);
t('chiamo Cabo', E.act(k, 0, { a: 'cabo' }) === null && k.caller === 0 && k.turn === 1);
t('un secondo Cabo no', (function () { var r = E.act(k, 1, { a: 'cabo' }); return r !== null; })());
push(k, 13); E.act(k, 1, { a: 'draw' }); E.act(k, 1, { a: 'discard' });
push(k, 13); E.act(k, 2, { a: 'draw' }); E.act(k, 2, { a: 'discard' });
t('dopo un giro la manche finisce', k.phase === 'scores' && k.players.every(function (P) { return P.line.every(function (x) { return x.up; }); }));
t('Cabo riuscito: 0 punti, gli altri la somma', k.roundRes.pts.join() === '0,20,36' && k.roundRes.callerOk);
var m = play(3); m.players[0].line = line([5, 5, 5, 5]); m.players[1].line = line([1, 1, 1, 1]); m.players[2].line = line([9, 9, 9, 9]);
E.act(m, 0, { a: 'cabo' }); push(m, 13); E.act(m, 1, { a: 'draw' }); E.act(m, 1, { a: 'discard' }); push(m, 13); E.act(m, 2, { a: 'draw' }); E.act(m, 2, { a: 'discard' });
t('Cabo sbagliato: somma + 10', m.roundRes.pts.join() === '30,4,36' && m.roundRes.callerOk === false);
var pa = play(2); pa.players[0].line = line([2, 2]); pa.players[1].line = line([4]);
E.act(pa, 0, { a: 'cabo' }); push(pa, 13); E.act(pa, 1, { a: 'draw' }); E.act(pa, 1, { a: 'discard' });
t('a pari merito Cabo riesce lo stesso', pa.roundRes.pts.join() === '0,4');
var kz = play(3); kz.players[1].line = line([12, 13, 12, 13]); kz.players[0].line = line([0, 0, 1, 1]); kz.players[2].line = line([3, 3, 3, 3]);
E.act(kz, 0, { a: 'cabo' }); push(kz, 5); E.act(kz, 1, { a: 'draw' }); E.act(kz, 1, { a: 'discard' }); push(kz, 5); E.act(kz, 2, { a: 'draw' }); E.act(kz, 2, { a: 'discard' });
t('Kamikaze: due 12 e due 13 → 0 per lui, 50 agli altri', kz.roundRes.kami === 1 && kz.roundRes.pts.join() === '50,0,50');
var dk = play(2); dk.deck = [{ id: NID++, v: 4 }]; E.act(dk, 0, { a: 'draw' }); E.act(dk, 0, { a: 'discard' });
t('mazzo finito: la manche si chiude', dk.phase === 'scores' && dk.roundRes.why === 'deck' && dk.roundRes.caller == null);
// --- soglia, metà e fine partita ---
var r = play(2); r.players[0].total = 90; r.players[1].total = 20; r.players[0].line = line([5, 5]); r.players[1].line = line([1, 2]);
r.deck = [{ id: NID++, v: 4 }]; E.act(r, 0, { a: 'draw' }); E.act(r, 0, { a: 'discard' });
t('esattamente 100: si scende a 50', r.players[0].total === 50 && r.players[0].reset && r.roundRes.halved.join() === '0' && r.phase === 'scores');
t('chi comincia la manche dopo: il punteggio più basso', r.nextStarter === 1);
E.act(r, 0, { a: 'next' }); E.act(r, 1, { a: 'next' });
t('nuova manche', r.round === 2 && r.phase === 'peek' && r.starter === 1 && count(r) === 52);
var o = play(2); o.players[0].total = 95; o.players[1].total = 40; o.players[0].line = line([5, 5]); o.players[1].line = line([1, 1]);
E.act(o, 0, { a: 'cabo' }); push(o, 13); E.act(o, 1, { a: 'draw' }); E.act(o, 1, { a: 'discard' });
t('oltre 100: partita finita, vince il più basso', o.phase === 'over' && o.winners.join() === '1' && o.final.place.join() === '2,1');

// --- giocatori automatici ---
var bg = E.newGame(seats(4).map(function (s) { s.bot = true; return s; }), {}), guard = 0;
while (bg.phase !== 'over' && guard++ < 6000) { var ps = E.pending(bg); if (!ps.length) { E.forceNext(bg); continue; } var mv = B.decide(bg, ps[0]); if (!mv || E.act(bg, ps[0], mv)) break; }
t('una partita intera tra automatici', bg.phase === 'over');

console.log('Cabo: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
