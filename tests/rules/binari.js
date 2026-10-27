// Prove delle regole di Binari d'Italia (una per ogni regola del documento di analisi)
var fs = require('fs'), path = require('path'), SRC = path.join(__dirname, '../../src/binari-italia/');
global.window = global;
eval(fs.readFileSync(SRC + 'data.js', 'utf8') + ';global.BIData=BIData;');
eval(fs.readFileSync(SRC + 'engine.js', 'utf8') + ';global.BIEngine=BIEngine;');
var D = BIData, E = BIEngine, ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra || ''); } }
function seats(n) { var s = []; for (var i = 0; i < n; i++) s.push({ uid: 'u' + i, nick: 'G' + i }); return s; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function ready(g) { g.players.forEach(function (P, i) { E.act(g, i, { a: 'keep', ids: P.offer.slice(0, 2) }); }); }
function route(a, b, col) { return D.routes.filter(function (r) { return ((r.a === a && r.b === b) || (r.a === b && r.b === a)) && (!col || r.col === col); })[0]; }
function setHand(P, h) { Object.keys(P.hand).forEach(function (k) { P.hand[k] = 0; }); for (var k in h) P.hand[k] = h[k]; }
function cards(g) { var n = g.deck.length + g.disc.length + g.face.filter(Boolean).length; g.players.forEach(function (P) { n += E.handCount(P); }); return n; }

// --- preparazione ---
var g = E.newGame(seats(4), {});
t('4 carte a testa', g.players.every(function (P) { return E.handCount(P) === 4; }));
t('3 biglietti offerti', g.players.every(function (P) { return P.offer.length === 3; }));
t('5 carte scoperte', g.face.length === 5 && g.face.every(Boolean));
t('110 carte in tutto', cards(g) === 110, cards(g));
t('45 vagoni', g.players.every(function (P) { return P.trains === 45; }));
t('setup: almeno 2 biglietti', E.act(g, 0, { a: 'keep', ids: [g.players[0].offer[0]] }) !== null);
var off = g.players[0].offer.slice(), td = g.tdeck.length;
t('setup: tenerne 2 va bene', E.act(g, 0, { a: 'keep', ids: off.slice(0, 2) }) === null);
t('scartato in fondo al mazzo', g.tdeck[0] === off[2] && g.tdeck.length === td + 1);
t('in preparazione non si pesca', E.act(g, g.turn === 0 ? 1 : g.turn, { a: 'draw', i: 'deck' }) !== null);
g.players.forEach(function (P, i) { if (!P.ready) E.act(g, i, { a: 'keep', ids: P.offer.slice() }); });
t('dopo la scelta di tutti si gioca', g.stage === 'act');
t('tenerli tutti e 3 è ammesso', g.players[1].tickets.length === 3);

// --- pescare carte ---
g = E.newGame(seats(3), {}); ready(g); var p = g.turn;
t('fuori turno no', E.act(g, (p + 1) % 3, { a: 'draw', i: 'deck' }) !== null);
g.face = ['R', 'B', 'L', 'G', 'Y'];
var before = E.handCount(g.players[p]);
t('locomotiva scoperta come prima carta', E.act(g, p, { a: 'draw', i: 2 }) === null);
t('…chiude il turno con 1 carta', g.turn !== p && E.handCount(g.players[p]) === before + 1);
p = g.turn; g.face = ['R', 'B', 'L', 'G', 'Y'];
E.act(g, p, { a: 'draw', i: 0 });
t('dopo la prima carta resta il turno', g.turn === p && g.stage === 'draw2');
g.face[2] = 'L';
t('seconda carta: niente locomotiva scoperta', E.act(g, p, { a: 'draw', i: 2 }) !== null);
t('seconda carta dal mazzo ok', E.act(g, p, { a: 'draw', i: 'deck' }) === null && g.turn !== p);
p = g.turn; g.deck.push('L'); before = E.handCount(g.players[p]);
E.act(g, p, { a: 'draw', i: 'deck' });
t('locomotiva coperta = carta normale, si pesca ancora', g.turn === p && g.players[p].hand.L >= 1);
E.act(g, p, { a: 'draw', i: 'deck' }); t('due carte pescate', E.handCount(g.players[p]) === before + 2);
// tre locomotive scoperte
p = g.turn; g.face = ['L', 'L', 'R', 'B', 'G']; g.deck.push('L');
var nd = cards(g);
E.act(g, p, { a: 'draw', i: 2 });
t('tre locomotive scoperte: si rimescolano', g.face.filter(function (c) { return c === 'L'; }).length < 3);
t('nessuna carta persa', cards(g) === nd);
E.act(g, p, { a: 'draw', i: 'deck' });
// mazzo finito: scarti rimescolati
p = g.turn; g.disc = g.disc.concat(g.deck); g.deck = [];
var nd2 = g.disc.length;
E.act(g, p, { a: 'draw', i: 'deck' });
t('mazzo finito: scarti rimescolati', g.disc.length === 0 && g.deck.length === nd2 - 1);
E.act(g, p, { a: 'draw', i: 'deck' });

// --- conquistare tratte ---
g = E.newGame(seats(4), {}); ready(g); p = g.turn; var P = g.players[p];
var rc = route('roma', 'civitavecchia'); // arancione
setHand(P, { O: 1, R: 3, L: 2 });
t('colore sbagliato no', E.act(g, p, { a: 'claim', r: rc.id, c: 'R', L: 0 }) !== null);
var sc = P.score, tr = P.trains;
t('colore giusto sì', E.act(g, p, { a: 'claim', r: rc.id, c: 'O', L: rc.len - 1 }) === null);
t('punti subito', P.score === sc + D.SCORE[rc.len] && P.trains === tr - rc.len);
t('carte negli scarti', g.disc.length >= rc.len);
t('già presa', E.canClaim(g, (p + 1) % 4, rc).ok === false);
p = g.turn; P = g.players[p];
var grey = route('torino', 'cuneo'); setHand(P, { R: 1, B: 1, L: 0 });
t('grigia: colori misti no', E.act(g, p, { a: 'claim', r: grey.id, c: 'R', L: 0 }) !== null || grey.len === 1);
setHand(P, { B: grey.len });
t('grigia: un colore qualsiasi sì', E.act(g, p, { a: 'claim', r: grey.id, c: 'B', L: 0 }) === null);
p = g.turn; P = g.players[p];
var long6 = D.routes.filter(function (r) { return r.len === 6 && !r.ferry && r.col !== 'X'; })[0];
setHand(P, { L: 6 });
t('tutte locomotive sì', E.act(g, p, { a: 'claim', r: long6.id, c: 'L', L: 6 }) === null && D.SCORE[6] === 15);
// tratte doppie
var dbl = route('roma', 'napoli'), tw = D.byId[dbl.twin];
p = g.turn; P = g.players[p]; setHand(P, { L: 10 });
E.act(g, p, { a: 'claim', r: dbl.id, c: 'L', L: dbl.len });
var q = g.turn; g.turn = p; g.stage = 'act'; setHand(g.players[p], { L: 10 });
t('stesso giocatore: non entrambe le doppie', E.act(g, p, { a: 'claim', r: tw.id, c: 'L', L: tw.len }) !== null);
g.turn = q; setHand(g.players[q], { L: 10 });
t('con 4 giocatori un altro prende la seconda', E.act(g, q, { a: 'claim', r: tw.id, c: 'L', L: tw.len }) === null);
var g3 = E.newGame(seats(3), {}); ready(g3); p = g3.turn; setHand(g3.players[p], { L: 10 });
E.act(g3, p, { a: 'claim', r: dbl.id, c: 'L', L: dbl.len }); q = g3.turn; setHand(g3.players[q], { L: 10 });
t('con 3 giocatori la seconda è chiusa', E.act(g3, q, { a: 'claim', r: tw.id, c: 'L', L: tw.len }) !== null);
// traghetti
var fer = D.routes.filter(function (r) { return r.ferry === 2; })[0];
p = g3.turn; P = g3.players[p]; setHand(P, { R: 6, L: 1 });
t('traghetto senza locomotive no', E.act(g3, p, { a: 'claim', r: fer.id, c: 'R', L: 1 }) !== null);
setHand(P, { R: 6, L: 2 });
t('traghetto con le locomotive sì', E.act(g3, p, { a: 'claim', r: fer.id, c: 'R', L: 2 }) === null);
// vagoni insufficienti
p = g3.turn; P = g3.players[p]; P.trains = 2; setHand(P, { L: 9 });
t('vagoni insufficienti', E.act(g3, p, { a: 'claim', r: long6.id === fer.id ? D.routes[0].id : D.routes.filter(function (r) { return r.len >= 3 && g3.claims[r.id] == null; })[0].id, c: 'L', L: 6 }) !== null);

// --- biglietti durante la partita ---
g = E.newGame(seats(2), {}); ready(g); p = g.turn; P = g.players[p];
var nt = g.tdeck.length;
E.act(g, p, { a: 'tickets' });
t('si pescano 3 biglietti', P.offer.length === 3 && g.stage === 'tickets');
t('non si può fare altro', E.act(g, p, { a: 'draw', i: 'deck' }) !== null);
t('almeno 1', E.act(g, p, { a: 'keep', ids: [] }) !== null);
var o3 = P.offer.slice(), k0 = P.tickets.length;
t('tenerne 1 va bene', E.act(g, p, { a: 'keep', ids: [o3[1]] }) === null && P.tickets.length === k0 + 1);
t('gli altri in fondo', g.tdeck.length === nt - 1 && g.tdeck.indexOf(o3[0]) < 2 && g.tdeck.indexOf(o3[2]) < 2);

// --- fine partita ---
g = E.newGame(seats(3), {}); ready(g); p = g.turn; P = g.players[p];
P.trains = 4; var r3 = D.routes.filter(function (r) { return r.len === 2 && r.col !== 'X' && !r.twin; })[0]; setHand(P, { L: 2 });
E.act(g, p, { a: 'claim', r: r3.id, c: 'L', L: 2 });
t('2 vagoni: ultimo giro', g.last && g.last.by === p);
var turns = 0; while (g.phase === 'play' && turns < 10) { E.act(g, g.turn, { a: 'draw', i: 'deck' }); E.act(g, g.turn, { a: 'draw', i: 'deck' }); turns++; }
t('ognuno, lui compreso, gioca un turno', turns === 3 && g.phase === 'over', turns);
t('classifica finale', g.final && g.final.order.length === 3);

// --- punteggio: biglietti e percorso più lungo ---
g = E.newGame(seats(2), {}); ready(g);
var path = ['milano', 'brescia', 'verona', 'venezia', 'trieste'], ids = [];
for (var i = 0; i < path.length - 1; i++) { var rr = route(path[i], path[i + 1]); ids.push(rr.id); g.claims[rr.id] = 0; }
var tok = D.tickets.filter(function (x) { return x.a === 'milano' || x.b === 'milano'; });
g.players[0].tickets = [D.tickets.findIndex(function (x) { return x.a === 'domodossola' && x.b === 'venezia'; })];
t('biglietto non collegato', !E.connected(g, 0, 'domodossola', 'venezia'));
g.claims[route('milano', 'domodossola').id] = 0;
t('biglietto collegato', E.connected(g, 0, 'domodossola', 'venezia'));
var lg = E.longest(g, 0), exp = 0; [['domodossola', 'milano']].concat(path.slice(0, -1).map(function (c, i) { return [c, path[i + 1]]; })).forEach(function (x) { exp += route(x[0], x[1]).len; });
t('percorso più lungo', lg.len === exp, lg.len + ' vs ' + exp);
// anello: si può ripassare da una città ma non riusare una tratta
var g2 = E.newGame(seats(2), {}); ready(g2);
['bari taranto', 'taranto lecce', 'lecce bari', 'bari foggia'].forEach(function (s) { var x = s.split(' '); g2.claims[route(x[0], x[1]).id] = 1; });
var ring = ['bari taranto', 'taranto lecce', 'lecce bari', 'bari foggia'].reduce(function (s, x) { x = x.split(' '); return s + route(x[0], x[1]).len; }, 0);
t('anello + coda', E.longest(g2, 1).len === ring, E.longest(g2, 1).len + ' vs ' + ring);
// pareggio sul percorso: bonus a entrambi
g = E.newGame(seats(2), {}); ready(g);
g.claims[route('bari', 'taranto').id] = 0; g.claims[route('palermo', 'agrigento').id] = 1;
g.players.forEach(function (P) { P.tickets = []; });
g.last = { by: 0, rem: 1 }; E.act(g, g.turn, { a: 'draw', i: 'deck' }); E.act(g, g.turn, { a: 'draw', i: 'deck' });
var lens = [route('bari', 'taranto').len, route('palermo', 'agrigento').len];
t('fine partita', g.phase === 'over');
t('bonus 10 al più lungo (o a tutti i pari)', lens[0] === lens[1] ? g.final.rows.every(function (r) { return r.bonus === 10; }) : g.final.rows.filter(function (r) { return r.bonus === 10; }).length === 1);
// biglietti +/-
g = E.newGame(seats(2), {}); ready(g);
var tid = D.tickets.findIndex(function (x) { return x.a === 'genova' && x.b === 'firenze'; }), tid2 = D.tickets.findIndex(function (x) { return x.a === 'aosta' && x.b === 'genova'; });
g.players[0].tickets = [tid, tid2]; g.players[1].tickets = [];
['genova laspezia', 'laspezia pisa', 'pisa firenze'].forEach(function (s) { var x = s.split(' '); g.claims[route(x[0], x[1]).id] = 0; });
g.last = { by: 0, rem: 1 }; E.act(g, g.turn, { a: 'draw', i: 'deck' }); E.act(g, g.turn, { a: 'draw', i: 'deck' });
var row = g.final.rows[0];
t('biglietto fatto +, non fatto −', row.tpts === D.tickets[tid].v - D.tickets[tid2].v, row.tpts);
t('totale = tratte + biglietti + bonus', row.total === row.routePts + row.tpts + row.bonus);

// --- partite casuali: nessun errore e carte conservate ---
var errs = 0, games = 0;
for (var k = 0; k < 200; k++) {
  g = E.newGame(seats(2 + k % 4), {}); g.players.forEach(function (P, i) { E.act(g, i, { a: 'keep', ids: P.offer.slice(0, 2 + (k % 2)) }); });
  var steps = 0;
  while (g.phase === 'play' && steps++ < 3000) {
    var p2 = g.turn, PP = g.players[p2];
    if (g.stage === 'tickets') { E.act(g, p2, { a: 'keep', ids: PP.offer.slice(0, 1) }); continue; }
    var cl = D.routes.filter(function (r) { return E.canClaim(g, p2, r).ok; });
    if (g.stage === 'act' && cl.length && Math.random() < .6) { var r0 = cl[Math.floor(Math.random() * cl.length)], op = E.canClaim(g, p2, r0).opts[0]; var e = E.act(g, p2, { a: 'claim', r: r0.id, c: op.c, L: op.L }); if (e) { errs++; console.log(e); } continue; }
    if (g.stage === 'act' && Math.random() < .04 && g.tdeck.length) { E.act(g, p2, { a: 'tickets' }); continue; }
    if (!E.canDrawAny(g, g.stage === 'draw2')) { var e2 = E.act(g, p2, { a: 'pass' }); if (e2) { if (g.tdeck.length) E.act(g, p2, { a: 'tickets' }); else break; } continue; }
    var choices = ['deck'].concat([0, 1, 2, 3, 4].filter(function (i) { return g.face[i] && !(g.stage === 'draw2' && g.face[i] === 'L'); }));
    if (!g.deck.length && !g.disc.length) choices.shift();
    E.act(g, p2, { a: 'draw', i: choices[Math.floor(Math.random() * choices.length)] });
    if (cards(g) !== 110) { errs++; console.log('carte', cards(g)); break; }
  }
  if (g.phase === 'over') games++;
}
t('200 partite casuali finite senza errori', errs === 0 && games >= 195, 'finite ' + games + ' errori ' + errs);
console.log('\n' + ok + '/' + (ok + ko) + ' prove superate');
process.exit(ko ? 1 : 0);
