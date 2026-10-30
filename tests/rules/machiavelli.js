// Prove delle regole del Machiavelli
var path = require('path'), SRC = path.join(__dirname, '../../src/machiavelli/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
// carta: valore 1..13, seme 0..3 (picche, cuori, quadri, fiori), mazzo 0/1
function C(r, s, d) { return (d || 0) * 52 + s * 13 + (r - 1); }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function count(g) { var n = g.deck.length; g.table.forEach(function (gr) { n += gr.c.length; }); g.players.forEach(function (P) { n += P.hand.length; }); return n; }

// --- carte e preparazione ---
var g = E.newGame(seats(4), {});
t('104 carte, due mazzi senza jolly', count(g) === 104);
t('13 carte a testa', g.players.every(function (P) { return P.hand.length === 13; }));
t('mazzo coperto con il resto', g.deck.length === 104 - 52);
t('tavolo vuoto', g.table.length === 0);
t('opzione 15 carte', E.newGame(seats(3), { cards: 15 }).players[0].hand.length === 15);
t('nomi delle carte', E.label(C(1, 0)) === 'A♠' && E.label(C(12, 1)) === 'Q♥' && E.cname(C(13, 2)) === 're di quadri');

// --- combinazioni ---
t('tris', E.kind([C(7, 0), C(7, 1), C(7, 2)]) === 'set');
t('poker', E.kind([C(7, 0), C(7, 1), C(7, 2), C(7, 3)]) === 'set');
t('tris con due semi uguali no', !E.valid([C(7, 0), C(7, 0, 1), C(7, 2)]));
t('cinque carte uguali no', !E.valid([C(7, 0), C(7, 1), C(7, 2), C(7, 3), C(7, 0, 1)]));
t('due carte non bastano', !E.valid([C(7, 0), C(7, 1)]));
t('scala', E.kind([C(4, 1), C(5, 1), C(6, 1)]) === 'run');
t('scala in disordine', E.valid([C(9, 1), C(7, 1), C(8, 1), C(10, 1)]));
t('scala con buco no', !E.valid([C(4, 1), C(5, 1), C(7, 1)]));
t('scala di semi diversi no', !E.valid([C(4, 1), C(5, 2), C(6, 1)]));
t('asso basso A-2-3', E.valid([C(1, 3), C(2, 3), C(3, 3)]));
t('asso alto Q-K-A', E.valid([C(12, 3), C(13, 3), C(1, 3)]));
t('K-A-2 no (niente giro)', !E.valid([C(13, 3), C(1, 3), C(2, 3)]));
t('scala completa A…K', E.valid([1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13].map(function (r) { return C(r, 0); })));
t('stessa carta due volte in scala no', !E.valid([C(4, 1), C(5, 1), C(5, 1, 1), C(6, 1)]));
t('ordine: asso alto in fondo', E.sortGroup([C(1, 0), C(13, 0), C(12, 0)])[2] === C(1, 0));
t('punti: Q-K-A vale 31', E.groupPoints([C(12, 0), C(13, 0), C(1, 0)]) === 31);

// --- il turno: giocare o pescare ---
g = E.newGame(seats(3), {}); var p = g.turn, P = g.players[p];
P.hand = [C(5, 0), C(5, 1), C(5, 2), C(9, 3), C(10, 3), C(11, 3), C(2, 0)];
t('fuori turno no', E.act(g, (p + 1) % 3, { a: 'draw' }) !== null);
t('tavolo vuoto senza carte no', E.act(g, p, { a: 'play', t: [] }) !== null);
t('combinazione non valida no', E.act(g, p, { a: 'play', t: [[C(5, 0), C(5, 1)]] }) !== null);
t('carta che non hai no', E.act(g, p, { a: 'play', t: [[C(5, 0), C(5, 1), C(5, 3)]] }) !== null);
t('calare un tris e una scala', E.act(g, p, { a: 'play', t: [[C(5, 0), C(5, 1), C(5, 2)], [C(9, 3), C(10, 3), C(11, 3)]] }) === null);
t('carte tolte dalla mano e turno passato', P.hand.length === 1 && g.turn !== p && g.table.length === 2);
var q = g.turn, Q = g.players[q], nd = g.deck.length, nh = Q.hand.length;
t('pescare una carta', E.act(g, q, { a: 'draw' }) === null && Q.hand.length === nh + 1 && g.deck.length === nd - 1 && g.turn !== q);
// riorganizzare il tavolo
var r2 = g.turn, R2 = g.players[r2];
R2.hand = [C(5, 3), C(8, 3), C(12, 3), C(4, 2)];
var tav = g.table.map(function (gr) { return gr.c.slice(); });
t('riprendere una carta del tavolo in mano no', E.act(g, r2, { a: 'play', t: [tav[0].slice(0, 2).concat([C(5, 3)]), tav[1]] }) !== null);
t('attaccare 8♣ e Q♣ alla scala e il 5♣ al tris', E.act(g, r2, { a: 'play', t: [tav[0].concat([C(5, 3)]), tav[1].concat([C(8, 3), C(12, 3)])] }) === null);
t('scala ordinata 8-Q', g.table.some(function (gr) { return gr.c.length === 5 && E.label(gr.c[0]) === '8♣' && E.label(gr.c[4]) === 'Q♣'; }));
// spezzare e ricomporre: dal poker di 5 si toglie il 5♦ e con 3♦ 4♦ si fa una scala
var s3 = g.turn, S3 = g.players[s3]; S3.hand = [C(3, 2), C(4, 2, 1), C(13, 0)];
tav = g.table.map(function (gr) { return gr.c.slice(); });
var poker = tav.filter(function (x) { return x.length === 4; })[0], run = tav.filter(function (x) { return x.length === 5; })[0];
t('manipolazione: dal poker alla scala', E.act(g, s3, { a: 'play', t: [poker.filter(function (c) { return c !== C(5, 2); }), run, [C(3, 2), C(4, 2, 1), C(5, 2)]] }) === null);
t('tutte le combinazioni valide', g.table.every(function (gr) { return E.valid(gr.c); }));
t('combinazioni invariate tengono il loro numero', g.table.some(function (gr) { return gr.c.length === 5; }) && g.table.filter(function (gr) { return gr.c.length === 3; }).length === 2);

// --- bozza per gli altri ---
var d = g.turn; g.players[d].hand = [C(6, 0), C(7, 0), C(8, 0), C(1, 1)];
t('bozza valida salvata', E.act(g, d, { a: 'draft', t: g.table.map(function (gr) { return gr.c; }).concat([[C(6, 0), C(7, 0)]]) }) === null && g.draft && g.draft.p === d);
t('bozza con carte altrui no', E.act(g, d, { a: 'draft', t: [[C(13, 0)]] }) !== null);
t('il tavolo non cambia con la bozza', g.table.length === 3 && g.players[d].hand.length === 4);
E.act(g, d, { a: 'play', t: g.table.map(function (gr) { return gr.c; }).concat([[C(6, 0), C(7, 0), C(8, 0)]]) });
t('la bozza sparisce al cambio di turno', g.draft === null);

// --- vittoria ---
var w = g.turn; g.players[w].hand = [C(9, 2), C(10, 2), C(11, 2)];
E.act(g, w, { a: 'play', t: g.table.map(function (gr) { return gr.c; }).concat([[C(9, 2), C(10, 2), C(11, 2)]]) });
t('chi finisce le carte vince', g.phase === 'over' && g.winner === w && g.final.out);
t('classifica per carte rimaste', g.final.order[0] === w && g.final.order.length === 3);

// --- mazzo finito ---
g = E.newGame(seats(2), {}); g.deck = [C(2, 1)];
var a0 = g.turn; E.act(g, a0, { a: 'draw' });
t('ultima carta pescata', g.deck.length === 0);
E.act(g, g.turn, { a: 'draw' }); t('mazzo finito: si passa', g.phase === 'play' && g.passes === 1);
E.act(g, g.turn, { a: 'draw' }); t('passano tutti di fila: vince chi ha meno carte', g.phase === 'over' && !g.final.out && g.players[g.winner].hand.length === Math.min(g.players[0].hand.length, g.players[1].hand.length));

// --- apertura a 36 (variante) ---
g = E.newGame(seats(2), { open36: true }); p = g.turn; P = g.players[p];
g.table = [{ id: 1, c: [C(2, 0), C(2, 1), C(2, 2)] }];
P.hand = [C(3, 0), C(4, 0), C(5, 0), C(2, 3), C(10, 1), C(10, 2), C(10, 3), C(12, 0), C(13, 0), C(1, 0)];
t('apertura sotto i 36 punti no', E.act(g, p, { a: 'play', t: [[C(2, 0), C(2, 1), C(2, 2)], [C(3, 0), C(4, 0), C(5, 0)]] }) !== null);
t('prima di aprire non si attacca al tavolo', E.act(g, p, { a: 'play', t: [[C(2, 0), C(2, 1), C(2, 2), C(2, 3)], [C(10, 1), C(10, 2), C(10, 3)], [C(12, 0), C(13, 0), C(1, 0)]] }) !== null);
t('apertura con 30 + 31 punti', E.act(g, p, { a: 'play', t: [[C(2, 0), C(2, 1), C(2, 2)], [C(10, 1), C(10, 2), C(10, 3)], [C(12, 0), C(13, 0), C(1, 0)]] }) === null && g.players[p].opened);

// --- giocatore automatico ---
g = E.newGame(seats(2), {}); p = g.turn; P = g.players[p];
g.table = [{ id: 1, c: [C(3, 1), C(4, 1), C(5, 1), C(6, 1), C(7, 1)] }, { id: 2, c: [C(9, 0), C(9, 1), C(9, 2), C(9, 3)] }];
P.hand = [C(5, 1, 1), C(10, 0), C(11, 0), C(13, 2)];
var mv = B.decide(g, p);
t('bot: gioca e lascia il tavolo valido', mv.a === 'play' && mv.t.every(E.valid), JSON.stringify(mv));
t('bot: spezza la scala con il 5♥', mv.t.some(function (x) { return x.indexOf(C(5, 1, 1)) >= 0; }));
t('bot: prende in prestito il 9♠ dal poker per fare 9-10-J♠', mv.t.some(function (x) { return x.indexOf(C(9, 0)) >= 0 && x.indexOf(C(10, 0)) >= 0 && x.indexOf(C(11, 0)) >= 0; }), JSON.stringify(mv.t.map(function (x) { return x.map(E.label); })));
t('bot: la giocata passa i controlli', E.act(g, p, mv) === null);
g = E.newGame(seats(2), {}); p = g.turn; g.players[p].hand = [C(2, 0), C(7, 1), C(12, 2)];
t('bot: niente da fare, pesca', B.decide(g, p).a === 'draw');

// --- partite casuali tra bot ---
var errs = 0, done = 0, stuck = 0;
for (var k = 0; k < 150; k++) {
  g = E.newGame(seats(2 + k % 4), { cards: k % 3 ? 13 : 15, open36: k % 5 === 0 });
  for (var st = 0; st < 2000 && g.phase === 'play'; st++) { var mm = B.decide(g, g.turn), e = E.act(g, g.turn, mm); if (e) { errs++; if (errs < 3) console.log(e); E.act(g, g.turn, { a: 'draw' }); } if (count(g) !== 104) { errs++; break; } }
  if (g.phase === 'over') done++; else stuck++;
}
t('150 partite tra bot finite senza errori', errs === 0 && stuck === 0, 'finite ' + done + ' errori ' + errs + ' bloccate ' + stuck);
console.log('\n' + ok + '/' + (ok + ko) + ' prove superate');
process.exit(ko ? 1 : 0);
