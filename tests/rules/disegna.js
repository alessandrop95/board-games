// gioco: disegna
// Prove delle regole di Disegna e indovina (una prova per regola) e partite intere con giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/disegna/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(teams, bots) { return teams.map(function (tm, i) { return { uid: 'u' + i, nick: 'G' + i, team: tm, bot: !!(bots && bots[i]) }; }); }
var T0 = 1000000;

t('risposte: maiuscole, accenti, spazi, plurale ed errore di battitura', E.right('GATTI', 'gatto') && E.right('pupazzodineve', 'pupazzo di neve') && E.right('elefnate', 'elefante') && E.right('Felicita', 'felicità') && !E.right('gatto', 'gelato') && !E.right('', 'sole'));
t('«quasi»: vicina ma non giusta', E.near('elefan', 'elefante') && !E.near('sole', 'sole') && !E.near('pizza', 'balena'));
t('parole senza doppioni', D.EASY.length > 150 && D.HARD.length > 150 && D.EASY.concat(D.HARD).every(function (w, i, a) { return a.findIndex(function (x) { return E.norm(x) === E.norm(w); }) === i; }), D.EASY.concat(D.HARD).filter(function (w, i, a) { return a.findIndex(function (x) { return E.norm(x) === E.norm(w); }) !== i; }));
t('prima di iniziare: squadre da almeno 2', E.checkSeats(seats([0, 1, 1]), 2) !== null && E.checkSeats(seats([0, 0, 0]), 2) !== null && E.checkSeats(seats([0, 0, 1, 1]), 2) === null);
var g = E.newGame(seats([0, 1, 0, 1, 1], [0, 0, 0, 0, 1]), { rounds: 2, time: 60 }, T0);
t('turni: ogni persona disegna una volta per giro, le squadre si alternano', g.order.map(function (o) { return o.p; }).join() === '0,1,2,3,0,1,2,3' && g.order[4].r === 2);
t('si comincia scegliendo tra una parola facile e una difficile', g.phase === 'choose' && g.drawer === 0 && D.EASY.indexOf(g.choices[0]) >= 0 && D.HARD.indexOf(g.choices[1]) >= 0);
t('sceglie solo chi disegna', E.act(g, 1, { a: 'choose', i: 1 }, T0 + 1000) !== null);
t('scelta: parola difficile, 2 punti, parte il tempo', E.act(g, 0, { a: 'choose', i: 1 }, T0 + 1000) === null && g.phase === 'draw' && g.pts === 2 && g.until === T0 + 61000 && g.word === g.choices[1]);
t('il disegno viene salvato (e ripulito)', E.act(g, 0, { a: 'pic', t: g.pic.t, s: [['#ff0000', 8, 10, 10, 2000, -5], ['bad']] }, T0 + 2000) === null && g.pic.s.length === 1 && g.pic.s[0].join() === '#ff0000,8,10,10,1000,0');
t('solo chi disegna manda il disegno', E.act(g, 2, { a: 'pic', t: g.pic.t, s: [] }, T0 + 2000) !== null);
t('gli avversari non indovinano durante il disegno', E.act(g, 1, { a: 'guess', w: g.word }, T0 + 3000) !== null);
t('chi disegna non indovina', E.act(g, 0, { a: 'guess', w: g.word }, T0 + 3000) !== null);
t('risposta sbagliata: resta nell’elenco', E.act(g, 2, { a: 'guess', w: 'pomodoro' }, T0 + 4000) === null && g.guesses.length === 1 && g.guesses[0].w === 'pomodoro');
t('risposta giusta in fretta: punti della parola +1', E.act(g, 2, { a: 'guess', w: g.word.toUpperCase() }, T0 + 5000) === null && g.phase === 'reveal' && g.teams[0].total === 3 && g.hit.p === 2 && !g.hit.steal);
t('poi si vede la parola e tocca all’altra squadra', E.tick(g, T0 + 5000 + E.REVEAL_MS) && g.phase === 'choose' && g.drawer === 1 && g.pic.s.length === 0 && g.guesses.length === 0);
t('se chi disegna non sceglie, parte la facile', E.tick(g, g.until) && g.phase === 'draw' && g.pts === 1);
var st = g.start;
t('tempo finito: le altre squadre possono rubare', E.tick(g, st + 60000) && g.phase === 'steal' && E.canGuess(g, 0) && !E.canGuess(g, 3));
t('i compagni di chi disegna non indovinano più', E.act(g, 3, { a: 'guess', w: g.word }, st + 61000) !== null);
t('furto: punti della parola, senza bonus', E.act(g, 0, { a: 'guess', w: g.word }, st + 62000) === null && g.hit.steal && g.teams[0].total === 4);
E.tick(g, g.until);
E.tick(g, g.until); E.tick(g, g.until); E.tick(g, g.until);
t('nessuno indovina: si passa avanti senza punti', g.phase === 'reveal' && g.hit === null && g.teams[0].total === 4 && g.teams[1].total === 0);
t('chi disegna può arrendersi: si passa al furto', (function () { E.tick(g, g.until); E.act(g, g.drawer, { a: 'choose', i: 0 }, g.until - 1000); return E.act(g, g.drawer, { a: 'skip' }, g.until - 1000) === null && g.phase === 'steal'; })());
// fine della partita
var f = E.newGame(seats([0, 1, 0, 1]), { rounds: 1 }, T0), now = T0;
for (var k = 0; k < 100 && f.phase !== 'over'; k++) { now = f.until; E.tick(f, now); }
t('dopo l’ultimo turno vince chi ha più punti (pari se nessuno indovina)', f.phase === 'over' && f.winners.length === 2);
t('opzioni fuori dall’elenco tornano a quelle normali', E.newGame(seats([0, 1, 0, 1]), { rounds: 9, time: 5, teams: 7 }, T0).opts.time === 80);
// partite con automatici che indovinano
var bad = 0, N = +process.argv[2] || 10, hits = 0, turns = 0;
for (var k2 = 0; k2 < N; k2++) for (var nt = 2; nt <= 4; nt++) {
  var tm = []; for (var i = 0; i < nt * 3; i++) tm.push(i % nt);
  var b = E.newGame(seats(tm, tm.map(function (x, i) { return i >= nt; })), { teams: nt, rounds: 1 }, T0), now2 = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 20000) {
    now2 += 900;
    if (E.tick(b, now2)) continue;
    if (b.phase === 'choose') { E.act(b, b.drawer, { a: 'choose', i: guard % 2 }, now2); continue; }
    for (var q = 0; q < b.players.length; q++) { var a = B.decide(b, q, now2); if (a && Math.random() < .2) { var err = E.act(b, q, a, now2); if (err) { bad++; console.log('errore', err, a); } break; } }
  }
  if (b.phase !== 'over') { bad++; console.log('non finita', b.phase); }
  turns += b.order.length; b.teams.forEach(function (T) { hits += T.total; });
}
t('partite con 2, 3 e 4 squadre finite senza errori', bad === 0, bad);
console.log('punti per turno: ' + (hits / turns).toFixed(2));
console.log('Disegna e indovina: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
