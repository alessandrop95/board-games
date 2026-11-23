// gioco: vocabolario
// Prove delle regole di Vocabolario bugiardo (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/vocabolario/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n, bots) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i, bot: !!bots }); return a; }
var T0 = 1000;

t('ogni parola ha tipo e definizione', D.W.every(function (w) { return w[0] && 'nva'.indexOf(w[1]) >= 0 && w[2].length > 15; }) && D.W.length >= 100, D.W.length);
t('nessuna parola doppia', D.W.every(function (w, i) { return D.W.findIndex(function (x) { return x[0] === w[0]; }) === i; }));
t('definizioni inventate per ogni tipo', ['n', 'v', 'a'].every(function (k) { return D.FAKE[k].length >= 15; }));
var g = E.newGame(seats(4), { rounds: 4, time: 60 }, T0);
t('si comincia scrivendo, con il tempo scelto', g.phase === 'write' && g.round === 1 && g.until === T0 + 60000 && g.opts.rounds === 4);
t('definizione troppo corta no', E.act(g, 0, { a: 'def', t: ' a ' }, T0) !== null);
t('si scrive una definizione', E.act(g, 0, { a: 'def', t: 'Un tipo di <b>formaggio</b> stagionato.' }, T0) === null && g.players[0].def.indexOf('<') < 0);
t('si può correggere', E.act(g, 0, { a: 'def', t: 'Un tipo di formaggio stagionato in grotta.' }, T0) === null && g.players[0].def === 'Un tipo di formaggio stagionato in grotta.');
t('niente voti durante la scrittura', E.act(g, 1, { a: 'vote', i: 0 }, T0) !== null);
E.act(g, 1, { a: 'def', t: 'un tipo di FORMAGGIO stagionato in grotta' }, T0);   // uguale a quella di G0
E.act(g, 2, { a: 'def', t: E.word(g)[2] }, T0);                                    // la definizione vera!
E.act(g, 3, { a: 'def', t: 'Antico ballo di corte.' }, T0);
t('quando hanno scritto tutti si vota', g.phase === 'vote' && g.until === T0 + E.VOTE_MS);
t('definizioni uguali unite, quella vera scritta da un giocatore non va al voto', g.defs.length === 3 && g.defs.filter(function (d) { return d.real; }).length === 1 && g.defs.some(function (d) { return d.by.join() === '0,1'; }) && g.knew.join() === '2');
var real = g.defs.findIndex(function (d) { return d.real; }), cheese = g.defs.findIndex(function (d) { return d.by.indexOf(0) >= 0; }), ball = g.defs.findIndex(function (d) { return d.by.indexOf(3) >= 0; });
t('non si vota la propria definizione', E.act(g, 0, { a: 'vote', i: cheese }, T0) !== null);
t('definizione inesistente no', E.act(g, 0, { a: 'vote', i: 9 }, T0) !== null);
E.act(g, 0, { a: 'vote', i: ball }, T0); E.act(g, 0, { a: 'vote', i: real }, T0);   // cambia voto
E.act(g, 1, { a: 'vote', i: ball }, T0); E.act(g, 2, { a: 'vote', i: cheese }, T0);
t('si aspetta chi deve ancora votare', g.phase === 'vote' && E.pending(g).join() === '3');
E.act(g, 3, { a: 'vote', i: cheese }, T0);
var gn = g.players.map(function (P) { return P.gain; });
t('punti: +2 alla vera, +1 a ogni autore per ogni voto, +3 a chi conosceva la parola', g.phase === 'reveal' && gn.join() === [2 + 2, 0 + 2, 3, 1].join(), gn.join());
t('voti registrati sulle definizioni', g.defs[cheese].votes.join() === '2,3' && g.defs[real].votes.join() === '0' && g.defs[ball].votes.join() === '1');
E.act(g, 0, { a: 'next' }, T0); E.act(g, 1, { a: 'next' }, T0); E.act(g, 2, { a: 'next' }, T0);
t('si aspetta che tutti siano pronti', g.phase === 'reveal');
E.act(g, 3, { a: 'next' }, T0);
t('nuova manche con un’altra parola', g.phase === 'write' && g.round === 2 && g.used.length === 2 && g.used[0] !== g.used[1] && g.players.every(function (P) { return P.def == null && P.vote == null; }));
// tempo scaduto
var w0 = g.word; E.act(g, 0, { a: 'def', t: 'Strumento per misurare il vento.' }, T0);
t('tempo scaduto: si vota con le definizioni arrivate', E.tick(g, g.until) && g.phase === 'vote' && g.defs.length === 2);
t('chi non ha scritto vota lo stesso', E.canVote(g, 1) && E.act(g, 1, { a: 'vote', i: g.defs.findIndex(function (d) { return !d.real; }) }, T0 + 70000) === null);
t('a tempo scaduto i risultati', E.tick(g, g.until) && g.phase === 'reveal' && g.players[0].gain === 1);
t('i risultati finiscono anche da soli', E.tick(g, g.until) && g.round === 3);
var z = E.newGame(seats(3), {}, T0);
t('nessuno scrive: niente voto, si va ai risultati', E.tick(z, z.until) && z.phase === 'reveal' && z.players.every(function (P) { return P.gain === 0; }));
var f = E.newGame(seats(3), { rounds: 4 }, T0); f.round = 4; f.players[1].score = 5;
E.tick(f, f.until); E.forceNext(f, T0 + 1);
t('dopo l’ultima manche vince chi ha più punti', f.phase === 'over' && f.winners.join() === '1' && f.final.place[1] === 1);
// partite intere tra automatici
var bad = 0, N = +process.argv[2] || 10;
for (var n = 3; n <= 12; n += 3) for (var k = 0; k < N; k++) {
  var b = E.newGame(seats(n, true), { rounds: 4 }, T0), now = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 3000) {
    now += 500; var moved = false;
    for (var p = 0; p < n; p++) { var a = B.decide(b, p); if (a) { moved = true; var err = E.act(b, p, a, now); if (err) { bad++; console.log('errore', err, a); } } }
    if (!moved) E.tick(b, b.until);
  }
  if (b.phase !== 'over') { bad++; console.log('non finita', b.phase); }
}
t('partite tra automatici da 3 a 12 giocatori finite senza errori', bad === 0, bad);
console.log('Vocabolario bugiardo: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
