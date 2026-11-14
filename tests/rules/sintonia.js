// gioco: sintonia
// Prove delle regole di Sintonia (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/sintonia/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(teams) { return teams.map(function (tm, i) { return { uid: 'u' + i, nick: 'G' + i, team: tm }; }); }
var T0 = 1000000;
t('risposte uguali: accenti, articoli, plurale, errore di battitura', E.same('Il Caffè', 'caffe') && E.same('fragole', 'fragola') && E.same('ciliegia', 'cilegia') && !E.same('mela', 'pera'));
t('almeno 80 temi, ognuno con almeno 4 risposte', D.LIST.length >= 80 && D.LIST.every(function (x) { return x.a.length >= 4; }));
var g = E.newGame(seats([0, 0, 0, 1, 1, 1]), { time: 30, rounds: 6 }, T0);
t('si comincia scrivendo, con il tempo scelto', g.phase === 'write' && g.until === T0 + 30000 && g.teams.length === 2);
t('risposta vuota no', E.act(g, 0, { a: 'answer', w: '  ' }, T0) !== null);
['fragola', 'Fragole', 'mela', 'ciliegia', 'ciliegia', 'ciliegia'].forEach(function (w, i) { if (i < 5) E.act(g, i, { a: 'answer', w: w }, T0 + 1000); });
t('si aspetta che rispondano tutti', g.phase === 'write' && E.pending(g).join() === '5');
t('si può cambiare risposta prima della fine', E.act(g, 2, { a: 'answer', w: 'Fragola' }, T0 + 2000) === null);
E.act(g, 5, { a: 'answer', w: 'ciliegia' }, T0 + 3000);
t('tutti hanno risposto: si scoprono', g.phase === 'show');
t('squadra tutta d’accordo: 3 punti + 2', g.res.teams[0].pts === 5 && g.res.teams[0].full);
t('anche l’altra squadra tutta d’accordo', g.res.teams[1].pts === 5);
var h = E.newGame(seats([0, 0, 0, 0, 1, 1]), {}, T0);
['sole', 'sole', 'luna', 'luna', 'mare', 'monti'].forEach(function (w, i) { E.act(h, i, { a: 'answer', w: w }, T0); });
t('due coppie: 2 + 2 punti; nessuna coppia: 0', h.res.teams[0].pts === 4 && h.res.teams[1].pts === 0);
var ind = E.newGame(seats([0, 0, 0, 0]), { teams: 0 }, T0);
['pizza', 'pizza', 'pizza', 'pasta'].forEach(function (w, i) { E.act(ind, i, { a: 'answer', w: w }, T0); });
t('ognuno per sé: un punto per ogni altro con la stessa risposta', ind.res.players.join() === '2,2,2,0' && ind.teams[0].total === 2);
var tm = E.newGame(seats([0, 1, 0, 1]), {}, T0); E.act(tm, 0, { a: 'answer', w: 'x' }, T0);
t('tempo scaduto: si scopre anche senza tutte le risposte', E.tick(tm, T0 + 30000) && tm.phase === 'show' && tm.res.teams[0].pts === 0);
t('poi si passa al tema dopo', E.tick(tm, tm.until) && tm.phase === 'write' && tm.round === 2);
var f = E.newGame(seats([0, 1, 0, 1]), { rounds: 6 }, T0); f.round = 6; E.forceNext(f, T0); E.forceNext(f, T0);
t('dopo l’ultima manche la classifica', f.phase === 'over' && f.winners.length >= 1);
var bad = 0, N = +process.argv[2] || 20, pts = 0;
for (var k = 0; k < N; k++) {
  var tt = [0, 2, 3, 4][k % 4], n = 4 + (k % 9), st = []; for (var i = 0; i < n; i++) st.push({ uid: 'b' + i, nick: 'B' + i, bot: true, team: tt ? i % tt : 0 });
  var b = E.newGame(st, { teams: tt }, T0), now = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 3000) {
    now += 1000; if (E.tick(b, now)) continue;
    var q = E.pending(b)[0]; if (q == null) { E.forceNext(b, now); continue; }
    var a = B.decide(b, q); if (!a) { E.forceNext(b, now); continue; }
    var err = E.act(b, q, a, now); if (err) { bad++; console.log('errore', err); break; }
  }
  if (b.phase !== 'over') bad++;
  b.teams.forEach(function (T) { pts += T.total; });
}
t('partite tra automatici finite senza errori', bad === 0, bad);
console.log('Sintonia: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
