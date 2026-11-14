// gioco: conquista
// Prove delle regole di Conquista l'Italia (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/conquista/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(teams) { return teams.map(function (tm, i) { return { uid: 'u' + i, nick: 'G' + i, team: tm }; }); }
function idx(id) { return D.R.findIndex(function (r) { return r.id === id; }); }
var T0 = 1000000;
t('20 regioni, tutte collegate', D.R.length === 20 && (function () { var seen = [0], q = [0]; while (q.length) { var x = q.pop(); D.ADJ[x].forEach(function (y) { if (seen.indexOf(y) < 0) { seen.push(y); q.push(y); } }); } return seen.length === 20; })());
t('confini simmetrici', D.ADJ.every(function (a, i) { return a.every(function (j) { return D.ADJ[j].indexOf(i) >= 0; }); }));
t('domande a scelta con 4 risposte diverse e stime con un numero', D.Q.length >= 100 && D.Q.every(function (q) { return q.k === 'n' ? isFinite(q.v) : q.a.length === 4 && q.a.filter(function (x, i) { return q.a.indexOf(x) === i; }).length === 4; }));
var g = E.newGame(seats([0, 1, 0, 1]), { time: 20 }, T0);
function setQ(x, kind) { x.q = D.Q.findIndex(function (q) { return q.k === kind; }); }
setQ(g, 'c');
t('si comincia con una domanda e tutte le regioni libere', g.phase === 'q' && g.own.every(function (o) { return o < 0; }) && g.until === T0 + 20000);
t('risposta sbagliata: si aspetta', E.act(g, 1, { a: 'answer', i: 2 }, T0 + 1000) === null && g.phase === 'q');
t('una risposta sola', E.act(g, 1, { a: 'answer', i: 0 }, T0 + 1500) !== null);
t('chi risponde giusto per primo vince la domanda', E.act(g, 2, { a: 'answer', i: 0 }, T0 + 3000) === null && g.phase === 'claim' && g.chooser === 2 && g.teams[0].wins === 1);
t('all’inizio si può prendere qualsiasi regione', E.options(g, 0).length === 20);
t('sceglie solo chi ha vinto', E.act(g, 0, { a: 'claim', r: idx('laz') }, T0 + 4000) !== null);
t('Lazio ai Rossi', E.act(g, 2, { a: 'claim', r: idx('laz') }, T0 + 4000) === null && g.own[idx('laz')] === 0 && g.phase === 'show');
t('poi solo regioni libere confinanti', E.options(g, 0).sort().join() === D.ADJ[idx('laz')].slice().sort().join());
E.tick(g, g.until); setQ(g, 'n'); var Q = D.Q[g.q];
E.act(g, 0, { a: 'answer', v: Q.v + 10 }, T0 + 6000); E.act(g, 1, { a: 'answer', v: Q.v - 3 }, T0 + 7000); E.act(g, 2, { a: 'answer', v: Q.v + 3 }, T0 + 6500);
t('stima: si aspettano tutti', g.phase === 'q');
E.act(g, 3, { a: 'answer', v: 'abc' }, T0 + 8000);
E.act(g, 3, { a: 'answer', v: Q.v * 5 }, T0 + 8000);
t('vince il più vicino, a pari distanza il più veloce', g.chooser === 2);
E.tick(g, g.until);
t('se chi vince non sceglie, una regione a caso', g.phase === 'show' && E.count(g, 0) === 2);
// nessuno giusto
E.tick(g, g.until); setQ(g, 'c'); E.act(g, 0, { a: 'answer', i: 1 }, g.start + 100); E.tick(g, g.until);
t('nessuno risponde giusto: si va avanti', g.phase === 'show' && !g.res);
// conquista
var c = E.newGame(seats([0, 1]), {}, T0); c.own = c.own.map(function (o, i) { return i < 10 ? 0 : 1; });
t('regioni finite: si conquistano quelle avversarie confinanti', E.options(c, 0).every(function (r) { return c.own[r] === 1 && D.ADJ[r].some(function (j) { return c.own[j] === 0; }); }));
var f = E.newGame(seats([0, 1]), { questions: 12 }, T0); f.round = 12; f.own[0] = 1; f.phase = 'show'; f.until = T0; E.tick(f, T0);
t('dopo l’ultima domanda vince chi ha più regioni', f.phase === 'over' && f.winners.join() === '1');
var bad = 0, N = +process.argv[2] || 20;
for (var k = 0; k < N; k++) {
  var tt = [0, 2, 3, 4][k % 4], n = 3 + (k % 8), st = []; for (var i = 0; i < n; i++) st.push({ uid: 'b' + i, nick: 'B' + i, bot: true, team: tt ? i % tt : 0 });
  var b = E.newGame(st, { teams: tt, questions: [12, 18, 24][k % 3] }, T0), now = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 5000) {
    now += 700; if (E.tick(b, now)) continue;
    var q = guard % b.players.length, a = B.decide(b, q);
    if (a) { var err = E.act(b, q, a, now); if (err) { bad++; console.log('errore', err, a); break; } }
  }
  if (b.phase !== 'over') { bad++; console.log('non finita'); }
}
t('partite tra automatici finite senza errori', bad === 0, bad);
console.log('Conquista l’Italia: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
