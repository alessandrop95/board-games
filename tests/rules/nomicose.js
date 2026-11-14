// gioco: nomicose
// Prove delle regole di Nomi, cose, città (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/nomicose/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n, teams) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i, team: teams ? teams[i] : undefined }); return a; }
var T0 = 1000000;

t('parole: senza accenti, articoli e segni', E.norm(' L’Aquila ') === 'aquila' && E.norm('Lo Zaino!') === 'zaino' && E.norm('Città') === 'citta' && E.norm("un'Arancia") === 'arancia');
t('stessa parola anche con un errore di battitura (se lunga)', E.same('Milano', 'milano') && E.same('Mandarino', 'Mandarnio') === false && E.same('Mandarino', 'Mandarinp') && !E.same('Rosa', 'Rosi'));
t('controllo: vuota, corta, lettera sbagliata', E.check('', 'A') === 'empty' && E.check('A', 'A') === 'short' && E.check('Bari', 'A') === 'letter' && E.check('l’Aquila', 'A') === 'ok');
t('ogni lettera ha qualche parola per ogni categoria classica', D.LETTERS.every(function (l) { return D.CLASSIC.every(function (c) { return D.CATS[c][1].some(function (w) { return E.norm(w).charAt(0) === l.toLowerCase(); }); }); }),
  D.LETTERS.map(function (l) { return D.CLASSIC.filter(function (c) { return !D.CATS[c][1].some(function (w) { return E.norm(w).charAt(0) === l.toLowerCase(); }); }).map(function (c) { return l + ':' + c; }).join(' '); }).filter(Boolean).join(' '));

var g = E.newGame(seats(4, [0, 1, 0, 1]), { teams: 2, time: 60 }, T0);
t('due squadre da due, una lettera e 6 categorie classiche', g.teams.length === 2 && g.players.map(function (P) { return P.team; }).join() === '0,1,0,1' && D.LETTERS.indexOf(g.letter) >= 0 && g.cats.join() === D.CLASSIC.join());
t('il tempo è quello scelto', g.until === T0 + 60000 && g.phase === 'write');
var ind = E.newGame(seats(3), { teams: 0 }, T0);
t('ognuno per sé: una squadra a testa', ind.teams.length === 3 && ind.teams[1].name === 'G1');
var gaps = E.newGame(seats(3, [0, 3, 3]), { teams: 4 }, T0);
t('le squadre vuote spariscono', gaps.teams.length === 2 && gaps.teams[1].name === 'Gialli' && gaps.players[2].team === 1);
t('categorie a sorpresa: 6 diverse', (function () { var m = E.newGame(seats(2), { cats: 'mix' }, T0); return m.cats.length === 6 && m.cats.filter(function (c, i) { return m.cats.indexOf(c) === i; }).length === 6; })());

// scrittura nel foglio comune
g.letter = 'M';
t('un compagno scrive', E.act(g, 0, { a: 'w', c: 'nome', w: 'Marco' }, T0 + 1000) === null && g.ans[0].nome.w === 'Marco' && g.ans[0].nome.by === 0);
t('l’altro compagno corregge la stessa casella', E.act(g, 2, { a: 'w', c: 'nome', w: '  Matteo ' }, T0 + 2000) === null && g.ans[0].nome.w === 'Matteo' && g.ans[0].nome.by === 2);
t('la squadra avversaria ha il suo foglio', E.act(g, 1, { a: 'w', c: 'nome', w: 'Marco' }, T0 + 2000) === null && g.ans[1].nome.w === 'Marco' && g.ans[0].nome.w === 'Matteo');
t('categoria sconosciuta no', E.act(g, 0, { a: 'w', c: 'boh', w: 'x' }, T0) !== null);
t('cancellare una casella', E.act(g, 1, { a: 'w', c: 'cosa', w: 'Mela' }, T0) === null && E.act(g, 1, { a: 'w', c: 'cosa', w: '' }, T0) === null && !g.ans[1].cosa);
t('stop solo con tutte le caselle piene', E.act(g, 0, { a: 'stop' }, T0 + 3000) !== null);
['cosa', 'citta', 'animale', 'frutta', 'mestiere'].forEach(function (c, i) { E.act(g, 0, { a: 'w', c: c, w: ['Martello', 'Milano', 'Mucca', 'Bari', 'M'][i] }, T0 + 4000); });
t('stop: agli altri restano 10 secondi', E.act(g, 2, { a: 'stop' }, T0 + 5000) === null && g.stop.t === 0 && g.until === T0 + 15000);
t('un solo stop', E.act(g, 1, { a: 'stop' }, T0 + 5000) !== null);
E.act(g, 1, { a: 'w', c: 'citta', w: 'Milano' }, T0 + 6000); E.act(g, 1, { a: 'w', c: 'animale', w: 'Merlo' }, T0 + 6000); E.act(g, 3, { a: 'w', c: 'mestiere', w: 'Medico' }, T0 + 6000);
t('prima della scadenza non succede niente', !E.tick(g, T0 + 14000) && g.phase === 'write');
t('a tempo scaduto si passa al controllo', E.tick(g, T0 + 15000) && g.phase === 'review');
t('dopo il tempo non si scrive più', E.act(g, 0, { a: 'w', c: 'nome', w: 'Mario' }, T0 + 15100) !== null && g.rev.cells[0].nome.w === 'Matteo');
var c0 = g.rev.cells[0], c1 = g.rev.cells[1];
t('controllo automatico: lettera sbagliata e troppo corta', c0.frutta.st === 'letter' && c0.mestiere.st === 'short' && c1.cosa.st === 'empty');
var P = E.points(g);
t('punti: uguale all’altra squadra 5, diversa 10, unica 20, sbagliata 0', P.pts[0].citta === 5 && P.pts[1].citta === 5 && P.pts[0].nome === 10 && P.pts[1].nome === 10 && P.pts[0].cosa === 20 && P.pts[0].frutta === 0 && P.pts[1].mestiere === 20);
// contestazioni
t('non si contesta la propria squadra', E.act(g, 0, { a: 'flag', t: 0, c: 'cosa' }, T0 + 16000) !== null);
t('non si contesta una risposta che non vale già', E.act(g, 1, { a: 'flag', t: 0, c: 'frutta' }, T0 + 16000) !== null);
t('si contesta quella di un’altra squadra', E.act(g, 1, { a: 'flag', t: 0, c: 'animale' }, T0 + 16000) === null && g.flags['0:animale'].v[1] === false);
t('la squadra contestata non vota', E.act(g, 0, { a: 'vote', t: 0, c: 'animale', ok: true }, T0 + 16000) !== null);
E.act(g, 3, { a: 'vote', t: 0, c: 'animale', ok: false }, T0 + 16100);
P = E.points(g);
t('con più no che sì vale 0 (e l’altra diventa unica)', P.pts[0].animale === 0 && P.why[0].animale === 'voted' && P.pts[1].animale === 20);
E.act(g, 3, { a: 'vote', t: 0, c: 'animale', ok: true }, T0 + 16200);
t('si può cambiare voto: pari → vale', E.points(g).pts[0].animale === 10);
E.act(g, 3, { a: 'vote', t: 0, c: 'animale', ok: false }, T0 + 16300);
['ready'].forEach(function () { [0, 1, 2].forEach(function (p) { E.act(g, p, { a: 'ready' }, T0 + 17000); }); });
t('si aspetta che tutti siano pronti', g.phase === 'review' && E.pending(g).join() === '3');
E.act(g, 3, { a: 'ready' }, T0 + 17000);
t('tutti pronti: punti della manche', g.phase === 'scores' && g.teams[0].total === 10 + 20 + 5 + 0 + 0 + 0 && g.teams[1].total === 10 + 5 + 20 + 20 && g.teams[0].hist.length === 1);
[0, 1, 2, 3].forEach(function (p) { E.act(g, p, { a: 'next' }, T0 + 20000); });
t('nuova manche con un’altra lettera e il foglio vuoto', g.round === 2 && g.phase === 'write' && g.letter !== 'M' && !Object.keys(g.ans[0]).length && g.until === T0 + 20000 + 60000);
// controllo che scade da solo, fine partita
var f = E.newGame(seats(2), { teams: 0, rounds: 4 }, T0); f.round = 4;
E.tick(f, T0 + 90000);
t('il controllo finisce anche da solo, a tempo', f.phase === 'review' && E.tick(f, f.until) && f.phase === 'over');
var h = E.newGame(seats(2), { teams: 0, rounds: 4 }, T0); h.round = 4; h.letter = 'R'; E.act(h, 0, { a: 'w', c: 'nome', w: 'Rita' }, T0); E.tick(h, T0 + 90000); E.act(h, 0, { a: 'ready' }, T0 + 91000); E.act(h, 1, { a: 'ready' }, T0 + 91000);
t('dopo l’ultima manche vince chi ha più punti', h.phase === 'over' && h.winners.join() === '0' && h.final.place.join() === '1,2');
t('opzioni fuori dall’elenco tornano a quelle normali', E.newGame(seats(2), { rounds: 7, time: 5, teams: 9 }, T0).opts.rounds === 6);
// partite tra automatici
var bad = 0, N = +process.argv[2] || 10, words = 0, cells = 0;
for (var n = 2; n <= 12; n += 2) for (var k = 0; k < N; k++) {
  var tm = [0, 2, 3, 4][k % 4], b = E.newGame(seats(n).map(function (x) { x.bot = true; return x; }), { teams: tm, rounds: 4, cats: k % 2 ? 'mix' : 'classic' }, T0), now = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 5000) {
    now += 700;
    if (E.tick(b, now)) continue;
    if (b.phase === 'write') { var pp = guard % b.players.length, a = B.decide(b, pp); if (a) { var err = E.act(b, pp, a, now); if (err) { bad++; console.log('errore', err, a); break; } } continue; }
    if (b.phase === 'review') { var any = false; for (var q = 0; q < b.players.length; q++) { var a2 = B.decide(b, q); if (a2) { any = true; var e2 = E.act(b, q, a2, now); if (e2) { bad++; console.log('errore', e2, a2); } break; } } if (!any) E.forceNext(b, now); continue; }
    if (b.phase === 'scores') E.forceNext(b, now);
  }
  if (b.phase !== 'over') { bad++; console.log('non finita', b.phase, b.round); }
  b.teams.forEach(function (T) { words += T.total; });
}
t('partite tra automatici da 2 a 12 giocatori, a squadre e ognuno per sé, finite senza errori', bad === 0, bad);
console.log('punti medi per squadra e manche: ' + (words / (N * 6) / 4 / 2.5).toFixed(1));
console.log('Nomi, cose, città: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
