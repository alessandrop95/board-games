// gioco: fune
// Prove delle regole del Tiro alla fune di parole (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/fune/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(teams) { return teams.map(function (tm, i) { return { uid: 'u' + i, nick: 'G' + i, team: tm }; }); }
var T0 = 1000000;
// griglia di prova:  c a s a e
//                    o r t i n
//                    l e m o l
//                    p a n e r
//                    s o t u v
var GR = 'casaeortinlemolpanersotuv';
t('parole con lettere vicine, anche in diagonale', !!E.path(GR, 'casa') && !!E.path(GR, 'arte') && !!E.path(GR, 'pane'));
t('non due volte la stessa casella', E.path(GR, 'casac') === null && E.path(GR, 'aaa') === null);
t('lettere lontane no', E.path(GR, 'cv') === null && E.path(GR, 'cave') === null);
t('punti per lunghezza', E.points('ago') === 1 && E.points('casa') === 2 && E.points('pasta') === 3 && E.points('sapone') === 5 && E.points('tavolino') === 8);
t('parole conosciute', E.known('Casa') && !E.known('xyz') && D.WORDS.length > 300);
var g = E.newGame(seats([0, 1, 0, 1]), { time: 60, rounds: 3 }, T0); g.grid = GR;
t('due squadre, griglia 5×5 con vocali a sufficienza', g.teams.length === 2 && E.newGame(seats([0, 1]), {}, T0).grid.replace(/[^aeiou]/g, '').length >= 9);
t('una parola tira la corda', E.act(g, 0, { a: 'word', w: 'Casa' }, T0 + 1000) === null && E.pull(g).join() === '2,0');
t('il compagno non la ripete', E.act(g, 2, { a: 'word', w: 'casa' }, T0 + 1000) !== null);
t('gli avversari sì', E.act(g, 1, { a: 'word', w: 'casa' }, T0 + 1000) === null && E.pull(g).join() === '2,2');
t('parola impossibile nella griglia no', E.act(g, 1, { a: 'word', w: 'cave' }, T0) !== null);
E.act(g, 1, { a: 'word', w: 'temo' }, T0 + 2000); E.act(g, 1, { a: 'word', w: 'rtine' }, T0 + 2000);
t('a tempo scaduto si controllano le parole che il gioco non conosce', E.tick(g, T0 + 60000) && g.phase === 'review');
var iw = g.words.map(function (x) { return x.w; }).indexOf('rtine');
t('le parole conosciute non si contestano', E.act(g, 0, { a: 'flag', i: 0 }, T0 + 61000) !== null);
t('si contesta quella inventata', E.act(g, 0, { a: 'flag', i: iw }, T0 + 61000) === null);
E.act(g, 2, { a: 'vote', i: iw, ok: false }, T0 + 61500);
[0, 1, 2, 3].forEach(function (p) { E.act(g, p, { a: 'ready' }, T0 + 62000); });
t('bocciata: non tira più la corda; vince il round chi ha tirato di più', g.phase === 'scores' && g.res.pts.join() === '2,4' && g.teams[1].wins === 1);
[0, 1, 2, 3].forEach(function (p) { E.act(g, p, { a: 'next' }, T0 + 63000); });
t('nuovo round con una griglia nuova', g.round === 2 && g.phase === 'play' && !g.words.length);
g.teams[1].wins = 1; g.grid = GR; E.act(g, 1, { a: 'word', w: 'pane' }, T0 + 64000); E.tick(g, g.until);
t('al meglio di 3: chi vince 2 round vince la partita', g.phase === 'over' && g.winners.join() === '1');
var bad = 0, N = +process.argv[2] || 10, words = 0;
for (var k = 0; k < N; k++) {
  var n = 2 + (k % 6), st = []; for (var i = 0; i < n; i++) st.push({ uid: 'b' + i, nick: 'B' + i, bot: true, team: i % 2 });
  var b = E.newGame(st, { rounds: [1, 3, 5][k % 3] }, T0), now = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 6000) {
    now += 800; if (E.tick(b, now)) continue;
    var q = guard % b.players.length, a = B.decide(b, q);
    if (a) { var err = E.act(b, q, a, now); if (err && b.phase !== 'play') { bad++; console.log('errore', err, a); break; } if (!err && a.a === 'word') words++; }
    else if (b.phase !== 'play') E.forceNext(b, now);
  }
  if (b.phase !== 'over') { bad++; console.log('non finita'); }
}
t('partite tra automatici finite senza errori', bad === 0, bad);
console.log('parole trovate dagli automatici per partita: ' + (words / N).toFixed(1));
console.log('Tiro alla fune: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
