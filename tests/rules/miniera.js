// gioco: miniera
// Prove delle regole della Miniera (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/miniera/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var s = []; for (var i = 0; i < n; i++) s.push({ uid: 'u' + i, nick: 'G' + i }); return s; }
var T0 = 1000000;
// prepara una spedizione con le prossime gallerie decise (l'ultima della lista esce per prima)
function rig(g, cards) { g.deck = cards.slice().reverse(); }
function fresh(n, first, next) {
  var g = E.newGame(seats(n), { exps: 5, time: 15 }, T0);
  // ricomincia la prima galleria a mano
  g.players.forEach(function (P) { P.carry = 0; P.in = true; P.ch = null; }); g.path = []; g.step = 0; g.phase = 'choose';
  g.deck = [];
  return g;
}
var g0 = E.newGame(seats(4), {}, T0);
t('si parte dalla spedizione 1 di 5 con una galleria già scoperta', g0.exp === 1 && g0.opts.exps === 5 && g0.path.length === 1 && g0.phase === 'choose');
var g1 = E.newGame(seats(4), {}, T0), cnt = {};
g1.deck.concat(g1.path.map(function (c) { return c.c; })).forEach(function (c) { cnt[c.charAt(0)] = (cnt[c.charAt(0)] || 0) + 1; });
t('il mazzo: 15 pepite, 15 pericoli (3 per tipo) e 1 idolo', cnt.g === 15 && cnt.h === 15 && cnt.i === 1, JSON.stringify(cnt));

// pepite divise in parti uguali, il resto per terra
var g = E.newGame(seats(3), {}, T0);
g.path = []; g.players.forEach(function (P) { P.carry = 0; }); g.deck = ['g7'];
g.players.forEach(function (P, p) { if (p) P.ch = null; });
E.act(g, 0, { a: 'go' }, T0 + 100); E.act(g, 1, { a: 'go' }, T0 + 100);
t('si sceglie in segreto: finché manca qualcuno non succede niente', g.path.length === 0 && g.players[0].ch === 'go');
E.act(g, 2, { a: 'go' }, T0 + 200);
t('7 pepite in 3: 2 a testa, 1 resta per terra', g.players.every(function (P) { return P.carry === 2; }) && g.path[0].left === 1);

// chi torna raccoglie le pepite per terra, diviso tra chi torna insieme
g = E.newGame(seats(3), {}, T0);
g.path = [{ c: 'g9', left: 1 }, { c: 'g11', left: 2 }]; g.players.forEach(function (P) { P.carry = 3; }); g.deck = ['g4'];
E.act(g, 0, { a: 'back' }, T0); E.act(g, 1, { a: 'go' }, T0); E.act(g, 2, { a: 'go' }, T0);
t('torna da solo: tasca + tutte le pepite per terra nella cassa', g.players[0].chest === 6 && !g.players[0].in && g.players[0].carry === 0);
t('gli altri vanno avanti e la nuova galleria si divide solo tra loro', g.players[1].carry === 5 && g.players[2].carry === 5 && g.path.length === 3);
g = E.newGame(seats(3), {}, T0);
g.path = [{ c: 'g9', left: 1 }, { c: 'g11', left: 2 }]; g.players.forEach(function (P) { P.carry = 3; }); g.deck = ['g4'];
E.act(g, 0, { a: 'back' }, T0); E.act(g, 1, { a: 'back' }, T0); E.act(g, 2, { a: 'go' }, T0);
t('in due: dalla galleria con 2 pepite 1 a testa, quella con 1 resta per terra', g.players[0].chest === 4 && g.players[1].chest === 4 && g.path[0].left === 1 && g.path[1].left === 0);

// l'idolo solo a chi torna da solo
g = E.newGame(seats(3), {}, T0);
g.path = [{ c: 'i', left: 0 }]; g.players.forEach(function (P) { P.carry = 0; }); g.deck = ['g4'];
E.act(g, 0, { a: 'back' }, T0); E.act(g, 1, { a: 'back' }, T0); E.act(g, 2, { a: 'go' }, T0);
t('in due non si porta via l’idolo', g.players[0].idols.length === 0 && !g.path[0].taken);
g = E.newGame(seats(3), {}, T0);
g.path = [{ c: 'i', left: 0 }]; g.players.forEach(function (P) { P.carry = 0; }); g.deck = ['g4'];
E.act(g, 0, { a: 'back' }, T0); E.act(g, 1, { a: 'go' }, T0); E.act(g, 2, { a: 'go' }, T0);
t('da solo sì: vale 5', g.players[0].idols.join() === '5' && E.score(g.players[0]) === 5 && g.path[0].taken);
t('il 4° e il 5° idolo valgono 10', E.idolValue(1) === 5 && E.idolValue(3) === 5 && E.idolValue(4) === 10 && E.idolValue(5) === 10);

// pericoli
g = E.newGame(seats(3), {}, T0);
g.path = [{ c: 'g5', left: 2 }]; g.players.forEach(function (P) { P.carry = 1; }); g.deck = ['hgrisu', 'hgrisu'];
g.players.forEach(function (P) { E.act(g, g.players.indexOf(P), { a: 'go' }, T0); });
t('il primo pericolo di un tipo spaventa e basta', g.phase === 'choose' && g.players.every(function (P) { return P.in && P.carry === 1; }));
E.act(g, 0, { a: 'back' }, T0); E.act(g, 1, { a: 'go' }, T0); E.act(g, 2, { a: 'go' }, T0);
t('il secondo dello stesso tipo: chi è dentro scappa e perde la tasca', g.players[1].carry === 0 && g.players[2].carry === 0 && !g.players[1].in && g.players[1].last.lost === 1);
t('chi era tornato prima ha messo al sicuro tasca e pepite per terra', g.players[0].chest === 3);
t('la spedizione finisce e si va al campo', g.phase === 'camp' && g.res.h === 'grisu' && g.removed.join() === 'grisu');
E.act(g, 0, { a: 'next' }, T0 + 1000); E.act(g, 1, { a: 'next' }, T0 + 1000); E.act(g, 2, { a: 'next' }, T0 + 1000);
var c2 = {}; g.deck.concat(g.path.map(function (c) { return c.c; })).forEach(function (c) { c2[c] = (c2[c] || 0) + 1; });
t('nuova spedizione quando sono tutti pronti: una carta grisù in meno e un idolo in più', g.exp === 2 && c2.hgrisu === 2 && c2.hfrana === 3 && c2.i === 2, JSON.stringify(c2));
t('si riparte tutti dentro con le tasche vuote, la cassa resta', g.players.every(function (P) { return P.in; }) && g.players[0].chest === 3);

// tempo scaduto: chi non ha scelto torna al campo
g = E.newGame(seats(3), { time: 10 }, T0);
g.path = [{ c: 'g3', left: 0 }]; g.players.forEach(function (P) { P.carry = 1; }); g.deck = ['g6'];
E.act(g, 0, { a: 'go' }, T0 + 100);
t('prima del tempo non succede niente', !E.tick(g, T0 + 9000));
t('a tempo scaduto chi non ha scelto torna al campo', E.tick(g, T0 + 10000) && !g.players[1].in && !g.players[2].in && g.players[1].chest === 1 && g.players[0].in && g.players[0].carry === 7);
t('chi è già al campo non sceglie', E.act(g, 1, { a: 'go' }, T0 + 10100) !== null);
t('tutti al campo: fine spedizione', E.act(g, 0, { a: 'back' }, T0 + 10200) === null && g.phase === 'camp' && g.players[0].chest === 7);
t('il campo finisce anche da solo dopo un po’', E.tick(g, T0 + 10200 + E.CAMP_MS) && g.exp === 2 && g.phase === 'choose');

// fine partita
g = E.newGame(seats(3), { exps: 3 }, T0);
g.exp = 3; g.players[0].chest = 20; g.players[1].chest = 15; g.players[1].idols = [5]; g.players[2].chest = 9;
g.path = [{ c: 'g3', left: 0 }]; g.players.forEach(function (P) { P.carry = 0; }); g.deck = ['g6'];
g.players.forEach(function (P, p) { E.act(g, p, { a: 'back' }, T0); });
t('dopo l’ultima spedizione vince chi ha più pepite (idoli compresi), a pari merito chi ha più idoli', g.phase === 'over' && g.winners.join() === '1' && g.final.place.join() === '2,1,3', JSON.stringify(g.final));
t('a partita finita non si gioca più', E.act(g, 0, { a: 'go' }, T0) !== null);

// partite intere tra automatici
var bad = 0, N = 200, sum = 0, disasters = 0;
for (var k = 0; k < N; k++) {
  var n = 3 + (k % 8), b = E.newGame(seats(n), { exps: k % 3 ? 5 : 3 }, T0), now = T0;
  b.players.forEach(function (P) { P.bot = true; });
  for (var st = 0; st < 3000 && b.phase !== 'over'; st++) {
    now += 500;
    b.players.forEach(function (P, p) { var a = B.decide(b, p); if (a) { var e = E.act(b, p, a, now); if (e) { bad++; if (bad < 4) console.log(e, JSON.stringify(a)); } } });
    E.tick(b, now);
  }
  if (b.phase !== 'over') { bad++; console.log('non finita'); }
  else { sum += Math.max.apply(null, b.final.tot); disasters += b.removed.length; }
  var tot = 0; b.players.forEach(function (P) { tot += E.score(P); });
  if (b.players.some(function (P) { return P.carry || P.chest < 0; })) bad++;
}
t('partite tra automatici finite senza errori', bad === 0, bad);
console.log('punteggio medio del vincitore: ' + (sum / N).toFixed(1) + ' · disastri per partita: ' + (disasters / N).toFixed(1));
console.log('La Miniera: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
