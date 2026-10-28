// Prove delle regole di Ticket to Ride Italy (cartella binari-italia): regole base + mappa Italia
var fs = require('fs'), path = require('path'), SRC = path.join(__dirname, '../../src/binari-italia/');
global.window = global;
eval(fs.readFileSync(SRC + 'data.js', 'utf8') + ';global.BIData=BIData;');
eval(fs.readFileSync(SRC + 'engine.js', 'utf8') + ';global.BIEngine=BIEngine;');
var D = BIData, E = BIEngine, ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra || ''); } }
function seats(n) { var s = []; for (var i = 0; i < n; i++) s.push({ uid: 'u' + i, nick: 'G' + i }); return s; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function ready(g) { g.players.forEach(function (P, i) { E.act(g, i, { a: 'keep', ids: P.offer.slice(0, 3) }); }); }
function route(a, b, col) { return D.routes.filter(function (r) { return ((r.a === a && r.b === b) || (r.a === b && r.b === a)) && (!col || r.col === col); })[0]; }
function setHand(P, h) { Object.keys(P.hand).forEach(function (k) { P.hand[k] = 0; }); for (var k in h) P.hand[k] = h[k]; }
function cards(g) { var n = g.deck.length + g.disc.length + g.face.filter(Boolean).length; g.players.forEach(function (P) { n += E.handCount(P); }); return n; }

// --- preparazione ---
var g = E.newGame(seats(4), {});
t('4 carte a testa', g.players.every(function (P) { return E.handCount(P) === 4; }));
t('5 biglietti offerti', g.players.every(function (P) { return P.offer.length === 5; }));
t('56 biglietti in tutto', D.tickets.length === 56);
t('10 carte Traghetto da parte, nessuna in mano', g.fdeck === 10 && g.players.every(function (P) { return P.ferry === 0; }));
t('5 carte scoperte', g.face.length === 5 && g.face.every(Boolean));
t('110 carte in tutto', cards(g) === 110, cards(g));
t('45 vagoni', g.players.every(function (P) { return P.trains === 45; }));
t('setup: almeno 3 biglietti', E.act(g, 0, { a: 'keep', ids: g.players[0].offer.slice(0, 2) }) !== null);
var off = g.players[0].offer.slice(), td = g.tdeck.length;
t('setup: tenerne 3 va bene', E.act(g, 0, { a: 'keep', ids: off.slice(0, 3) }) === null);
t('scartati in fondo al mazzo', g.tdeck.indexOf(off[3]) < 2 && g.tdeck.indexOf(off[4]) < 2 && g.tdeck.length === td + 2);
t('in preparazione non si pesca', E.act(g, g.turn === 0 ? 1 : g.turn, { a: 'draw', i: 'deck' }) !== null);
g.players.forEach(function (P, i) { if (!P.ready) E.act(g, i, { a: 'keep', ids: P.offer.slice() }); });
t('dopo la scelta di tutti si gioca', g.stage === 'act');
t('tenerli tutti e 5 è ammesso', g.players[1].tickets.length === 5);

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
// traghetti: spazi con l'onda pagati con locomotive o carte Traghetto (2 onde l'una)
var fer = route('cagliari', 'palermo');   // 5 spazi, 4 con l'onda
t('traghetto: 4 onde su 5 spazi', fer.len === 5 && fer.ferry === 4 && fer.col === 'X');
p = g3.turn; P = g3.players[p]; setHand(P, { R: 6, L: 3 }); P.ferry = 0;
t('traghetto senza abbastanza locomotive no', E.act(g3, p, { a: 'claim', r: fer.id, c: 'R', L: 3, F: 0 }) !== null);
t('carta Traghetto che non hai no', E.act(g3, p, { a: 'claim', r: fer.id, c: 'R', L: 2, F: 1 }) !== null);
P.ferry = 2; g3.fdeck = 8;
t('troppe carte pagate no', E.act(g3, p, { a: 'claim', r: fer.id, c: 'R', L: 2, F: 2 }) !== null);
var opts = E.payOptions(g3, p, fer);
t('modi di pagare con i traghetti', opts.some(function (o) { return o.F === 2 && o.L === 0 && o.n === 1; }) && opts.some(function (o) { return o.F === 1 && o.L === 2 && o.n === 1; }), JSON.stringify(opts));
t('2 carte Traghetto + 1 carta colore sì', E.act(g3, p, { a: 'claim', r: fer.id, c: 'R', L: 0, F: 2 }) === null && g3.claims[fer.id] === p);
t('le carte Traghetto tornano nel mucchio', P.ferry === 0 && g3.fdeck === 10);
var land = route('reggio', 'messina'); q = g3.turn; setHand(g3.players[q], { L: 1 }); g3.players[q].ferry = 1; g3.fdeck = 9;
t('Stretto di Messina con una carta Traghetto', E.act(g3, q, { a: 'claim', r: land.id, c: 'L', L: 0, F: 1 }) === null);
p = g3.turn; P = g3.players[p]; setHand(P, { L: 9 }); P.ferry = 1; g3.fdeck = 9;
t('carte Traghetto solo sui traghetti', E.act(g3, p, { a: 'claim', r: route('torino', 'cuneo').id, c: 'L', L: route('torino', 'cuneo').len - 1, F: 1 }) !== null);
// pescare una carta Traghetto (azione del turno, al massimo 2 in mano)
var gf = E.newGame(seats(3), {}); ready(gf); p = gf.turn;
t('pescare una carta Traghetto', E.act(gf, p, { a: 'ferry' }) === null && gf.players[p].ferry === 1 && gf.fdeck === 9 && gf.turn !== p);
gf.players[gf.turn].ferry = 2; t('con 2 in mano no', E.act(gf, gf.turn, { a: 'ferry' }) !== null);
p = gf.turn; gf.players[p].ferry = 0; gf.fdeck = 0; t('mucchio finito: no', E.act(gf, p, { a: 'ferry' }) !== null);
// partite iniziate prima delle carte Traghetto: il mucchio si ricava dalle carte in mano
var old = E.newGame(seats(2), {}); ready(old); delete old.fdeck; old.players.forEach(function (P) { delete P.ferry; });
t('partita vecchia: si pesca lo stesso', E.act(old, old.turn, { a: 'ferry' }) === null && old.fdeck === 9);
// vagoni insufficienti
p = g3.turn; P = g3.players[p]; P.trains = 2; setHand(P, { L: 9 });
t('vagoni insufficienti', E.act(g3, p, { a: 'claim', r: long6.id === fer.id ? D.routes[0].id : D.routes.filter(function (r) { return r.len >= 3 && g3.claims[r.id] == null; })[0].id, c: 'L', L: 6 }) !== null);

// --- biglietti durante la partita ---
g = E.newGame(seats(2), {}); ready(g); p = g.turn; P = g.players[p];
var nt = g.tdeck.length;
E.act(g, p, { a: 'tickets' });
t('si pescano 4 biglietti', P.offer.length === 4 && g.stage === 'tickets');
t('non si può fare altro', E.act(g, p, { a: 'draw', i: 'deck' }) !== null);
t('almeno 1', E.act(g, p, { a: 'keep', ids: [] }) !== null);
var o3 = P.offer.slice(), k0 = P.tickets.length;
t('tenerne 1 va bene', E.act(g, p, { a: 'keep', ids: [o3[1]] }) === null && P.tickets.length === k0 + 1);
t('gli altri in fondo', g.tdeck.length === nt - 1 && g.tdeck.indexOf(o3[0]) < 3 && g.tdeck.indexOf(o3[2]) < 3 && g.tdeck.indexOf(o3[3]) < 3);

// --- fine partita ---
g = E.newGame(seats(3), {}); ready(g); p = g.turn; P = g.players[p];
P.trains = 4; var r3 = D.routes.filter(function (r) { return r.len === 2 && r.col !== 'X' && !r.twin; })[0]; setHand(P, { L: 2 });
E.act(g, p, { a: 'claim', r: r3.id, c: 'L', L: 2 });
t('2 vagoni: ultimo giro', g.last && g.last.by === p);
var turns = 0; while (g.phase === 'play' && turns < 10) { E.act(g, g.turn, { a: 'draw', i: 'deck' }); E.act(g, g.turn, { a: 'draw', i: 'deck' }); turns++; }
t('ognuno, lui compreso, gioca un turno', turns === 3 && g.phase === 'over', turns);
t('classifica finale', g.final && g.final.order.length === 3);

// --- collegamenti ---
g = E.newGame(seats(2), {}); ready(g);
var path = ['milano', 'brescia', 'verona', 'venezia', 'trieste'], ids = [];
for (var i = 0; i < path.length - 1; i++) { var rr = route(path[i], path[i + 1]); ids.push(rr.id); g.claims[rr.id] = 0; }
t('biglietto non collegato', !E.connected(g, 0, 'domodossola', 'venezia'));
g.claims[route('milano', 'domodossola').id] = 0;
t('biglietto collegato', E.connected(g, 0, 'domodossola', 'venezia'));
// Paesi confinanti: vicoli ciechi
t('4 Paesi confinanti con i loro valichi', Object.keys(D.zones).length === 4 && E.gatesOf('francia').length === 3 && E.gatesOf('slovenia').length === 2);
t('ogni valico ha una sola tratta', Object.keys(D.cities).filter(function (c) { return D.cities[c].zone; }).every(function (c) { return E.ADJ[c].length === 1; }));
t('biglietti verso i Paesi', D.tickets.filter(function (x) { return D.zones[x.a] || D.zones[x.b]; }).length === 12);
t('Slovenia non ancora raggiunta', !E.connected(g, 0, 'milano', 'slovenia'));
g.claims[route('trieste', 'si-trieste').id] = 0;
t('Milano–Slovenia collegate dal valico di Trieste', E.connected(g, 0, 'milano', 'slovenia') && E.connected(g, 0, 'slovenia', 'milano'));
var gz = E.newGame(seats(2), {}); ready(gz);
gz.claims[route('aosta', 'fr-aosta').id] = 0; gz.claims[route('torino', 'fr-torino').id] = 0;
t('due tratte verso la Francia non sono collegate tra loro', !E.connected(gz, 0, 'aosta', 'torino') && E.connected(gz, 0, 'aosta', 'francia') && E.connected(gz, 0, 'torino', 'francia'));
t('percorso evidenziato verso il Paese', (E.ticketPath(g, 0, { a: 'milano', b: 'slovenia' }) || []).length === 5);
// --- regioni ---
t('19 regioni, ogni città ne ha una', Object.keys(D.regions).length === 19 && Object.keys(D.cities).every(function (c) { return D.cities[c].zone || D.regions[D.cities[c].reg]; }));
t('tabella regioni: 5 → 1, 9 → 11', D.regionPts(4) === 0 && D.regionPts(5) === 1 && D.regionPts(9) === 11 && D.regionPts(30) === D.REGION_PTS[D.REGION_PTS.length - 1]);
var gr = E.newGame(seats(2), {}); ready(gr);
// rete nord: Milano(Lom)–Brescia–Verona(Ven)–Trento(TAA)–Bolzano + Milano–Torino(Pie)–Aosta(VdA)
['milano brescia', 'brescia verona', 'verona trento', 'trento bolzano', 'milano torino', 'torino aosta'].forEach(function (x) { x = x.split(' '); gr.claims[route(x[0], x[1]).id] = 0; });
var nets = E.networks(gr, 0);
t('una rete con 5 regioni', nets.length === 1 && nets[0].count === 5 && nets[0].pts === 1, JSON.stringify(nets.map(function (n) { return n.regions; })));
// rete sud separata: tutta la Sicilia (vale 2) + Reggio (Calabria)
['messina palermo', 'palermo agrigento', 'catania agrigento', 'reggio messina'].forEach(function (x) { x = x.split(' '); gr.claims[route(x[0], x[1]).id] = 0; });
nets = E.networks(gr, 0);
t('due reti contate a parte', nets.length === 2 && nets[1].count === 3 && nets[1].double.indexOf('sicilia') >= 0, JSON.stringify(nets.map(function (n) { return [n.regions, n.double]; })));
['catania agrigento'].forEach(function (x) { x = x.split(' '); delete gr.claims[route(x[0], x[1]).id]; });
nets = E.networks(gr, 0);
t('Sicilia incompleta vale 1', nets[1].double.length === 0 && nets[1].count === 2);
gr.claims[route('aosta', 'fr-aosta').id] = 0;
t('i Paesi confinanti non sono regioni', E.networks(gr, 0)[0].count === 5);
gr.players.forEach(function (P) { P.tickets = []; });
gr.last = { by: 0, rem: 1 }; E.act(gr, gr.turn, { a: 'draw', i: 'deck' }); E.act(gr, gr.turn, { a: 'draw', i: 'deck' });
var rw = gr.final.rows[0];
t('bonus regioni nel punteggio finale', gr.phase === 'over' && rw.rpts === 1 && rw.total === rw.routePts + rw.tpts + rw.rpts, JSON.stringify(rw.nets));
t('niente bonus per il percorso più lungo', rw.bonus === undefined && gr.final.maxL === undefined);
// biglietti +/-
g = E.newGame(seats(2), {}); ready(g);
var tid = D.tickets.findIndex(function (x) { return x.a === 'genova' && x.b === 'firenze'; }), tid2 = D.tickets.findIndex(function (x) { return x.a === 'aosta' && x.b === 'genova'; });
g.players[0].tickets = [tid, tid2]; g.players[1].tickets = [];
['genova laspezia', 'laspezia pisa', 'pisa firenze'].forEach(function (s) { var x = s.split(' '); g.claims[route(x[0], x[1]).id] = 0; });
g.last = { by: 0, rem: 1 }; E.act(g, g.turn, { a: 'draw', i: 'deck' }); E.act(g, g.turn, { a: 'draw', i: 'deck' });
var row = g.final.rows[0];
t('biglietto fatto +, non fatto −', row.tpts === D.tickets[tid].v - D.tickets[tid2].v, row.tpts);
t('totale = tratte + biglietti + regioni', row.total === row.routePts + row.tpts + row.rpts);

// --- partite casuali: nessun errore e carte conservate ---
var errs = 0, games = 0;
for (var k = 0; k < 200; k++) {
  g = E.newGame(seats(2 + k % 4), {}); g.players.forEach(function (P, i) { E.act(g, i, { a: 'keep', ids: P.offer.slice(0, 3 + (k % 3)) }); });
  var steps = 0;
  while (g.phase === 'play' && steps++ < 3000) {
    var p2 = g.turn, PP = g.players[p2];
    if (g.stage === 'tickets') { E.act(g, p2, { a: 'keep', ids: PP.offer.slice(0, 1) }); continue; }
    var cl = D.routes.filter(function (r) { return E.canClaim(g, p2, r).ok; });
    if (g.stage === 'act' && cl.length && Math.random() < .6) { var r0 = cl[Math.floor(Math.random() * cl.length)], op = E.canClaim(g, p2, r0).opts[0]; var e = E.act(g, p2, { a: 'claim', r: r0.id, c: op.c, L: op.L, F: op.F }); if (e) { errs++; console.log(e); } continue; }
    if (g.stage === 'act' && Math.random() < .04 && g.tdeck.length) { E.act(g, p2, { a: 'tickets' }); continue; }
    if (g.stage === 'act' && Math.random() < .05 && !E.canFerry(g, p2)) { E.act(g, p2, { a: 'ferry' }); continue; }
    if (!E.canDrawAny(g, g.stage === 'draw2')) { var e2 = E.act(g, p2, { a: 'pass' }); if (e2) { if (g.tdeck.length) E.act(g, p2, { a: 'tickets' }); else break; } continue; }
    var choices = ['deck'].concat([0, 1, 2, 3, 4].filter(function (i) { return g.face[i] && !(g.stage === 'draw2' && g.face[i] === 'L'); }));
    if (!g.deck.length && !g.disc.length) choices.shift();
    E.act(g, p2, { a: 'draw', i: choices[Math.floor(Math.random() * choices.length)] });
    if (cards(g) !== 110) { errs++; console.log('carte', cards(g)); break; }
    if (E.ferryPile(g) + g.players.reduce(function (s, P) { return s + P.ferry; }, 0) !== 10) { errs++; console.log('traghetti'); break; }
  }
  if (g.phase === 'over') games++;
}
t('200 partite casuali finite senza errori', errs === 0 && games >= 195, 'finite ' + games + ' errori ' + errs);
console.log('\n' + ok + '/' + (ok + ko) + ' prove superate');
process.exit(ko ? 1 : 0);
