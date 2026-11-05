// Prove delle regole di Flip 7 (una prova per regola)
var path = require('path'), SRC = path.join(__dirname, '../../src/flip7/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function count(g) { if (g.stage === 'end') return g.deck.length + g.disc.length; return g.deck.length + g.disc.length + g.players.reduce(function (s, P) { return s + P.nums.length + P.mods.length + (P.sc ? 1 : 0) + (P.st === 'bust' && P.bustCard != null ? 1 : 0); }, 0) + (g.choice ? 1 : 0) + (g.f3 ? g.f3.held.length : 0) + g.todo.length; }
// partita con il mazzo truccato: le carte escono nell'ordine dato (poi il resto del mazzo vero)
function rig(n, cards, dealer, o) {
  var g = E.newGame(seats(n), o || {});
  var all = E.fullDeck(), rest = all.slice();
  cards.forEach(function (c) { var i = rest.indexOf(c); if (i >= 0) rest.splice(i, 1); else throw new Error('carta mancante ' + c); });
  g.deck = rest.concat(cards.slice().reverse()); g.disc = []; g.round = 0; g.dealer = dealer || 0; g.log = []; g.fx = [];
  g.players.forEach(function (P) { P.total = 0; P.hist = []; });
  E.startRound(g, true);
  return g;
}
function P(g, i) { return g.players[i]; }

// --- il mazzo ---
var D = E.fullDeck();
t('94 carte', D.length === 94);
t('un solo 0, e tante copie quanto il valore da 1 a 12', D.filter(function (c) { return c === 0; }).length === 1 && [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12].every(function (v) { return D.filter(function (c) { return c === v; }).length === v; }));
t('79 carte numero', D.filter(E.isNum).length === 79);
t('modificatori +2 +4 +6 +8 +10 ×2, uno per tipo', ['+2', '+4', '+6', '+8', '+10', 'x2'].every(function (m) { return D.filter(function (c) { return c === m; }).length === 1; }));
t('tre carte per ogni azione', ['FRZ', 'F3', 'SC'].every(function (a) { return D.filter(function (c) { return c === a; }).length === 3; }));

// --- soglia ---
t('si gioca fino a 200 (o 100, 300)', E.newGame(seats(3), {}).opts.target === 200 && E.newGame(seats(3), { target: 100 }).opts.target === 100 && E.newGame(seats(3), { target: 7 }).opts.target === 200);

// --- distribuzione ---
var g = rig(3, [5, 9, 2], 0);
t('una carta scoperta a testa, a partire dalla sinistra del mazziere', P(g, 1).nums.join() === '5' && P(g, 2).nums.join() === '9' && P(g, 0).nums.join() === '2');
t('poi tocca a chi è alla sinistra del mazziere', g.stage === 'turn' && g.turn === 1 && E.decider(g) === 1);
t('tutte le 94 carte ci sono', count(g) === 94, count(g));
t('non è il tuo turno', E.act(g, 0, { a: 'hit' }) !== null);

// --- pescare e fermarsi ---
g = rig(3, [5, 9, 2, 7, 4, 11], 0);
t('pescare un numero nuovo', E.act(g, 1, { a: 'hit' }) === null && P(g, 1).nums.join() === '5,7');
t('il turno passa al prossimo', g.turn === 2);
t('fermarsi', E.act(g, 2, { a: 'stay' }) === null && P(g, 2).st === 'stay' && g.turn === 0);
t('chi si è fermato viene saltato', E.act(g, 0, { a: 'hit' }) === null && g.turn === 1 && E.act(g, 1, { a: 'hit' }) === null && g.turn === 0);
t('punti: somma dei numeri', E.score(P(g, 1)) === 5 + 7 + 11);

// --- sballare ---
g = rig(3, [5, 9, 2, 5], 0);
E.act(g, 1, { a: 'hit' });
t('un numero doppio fa sballare', P(g, 1).st === 'bust' && E.score(P(g, 1)) === 0);
t('chi sballa è fuori', g.turn === 2 && E.actives(g).indexOf(1) < 0);
t('carte sempre tutte', count(g) === 94, count(g));
t('con un solo modificatore ci si può fermare', (function () { var h = rig(3, ['+4', 9, 2], 0); return E.act(h, 1, { a: 'stay' }) === null; })());
t('senza carte (congelato prima di riceverne) non si sceglie niente', (function () { var h = rig(3, ['FRZ', 9, 2], 0); E.act(h, 1, { a: 'target', t: 2 }); return h.players[2].st === 'frozen' && !h.players[2].nums.length && h.turn === 1 && E.act(h, 1, { a: 'stay' }) !== null; })());

// --- punteggio ---
var Q = { nums: [3, 5, 8], mods: ['x2', '+4'], st: 'stay' };
t('×2 raddoppia solo i numeri, poi si aggiungono i +', E.score(Q) === (3 + 5 + 8) * 2 + 4);
t('Flip 7: +15', E.score({ nums: [0, 1, 2, 3, 4, 5, 6], mods: [], st: 'flip7' }) === 21 + 15);
t('chi sballa fa 0 anche con i modificatori', E.score({ nums: [9, 10], mods: ['+10'], st: 'bust' }) === 0);
t('solo modificatori: contano lo stesso (×2 su zero non fa niente)', E.score({ nums: [], mods: ['x2', '+6'], st: 'stay' }) === 6);

// --- i modificatori non fanno sballare né contano per il Flip 7 ---
g = rig(2, [4, 6, '+2', '+2'.replace('2', '4')], 0);
E.act(g, 1, { a: 'hit' }); E.act(g, 0, { a: 'hit' });
t('modificatori a parte', P(g, 1).mods.join() === '+2' && P(g, 0).mods.join() === '+4' && P(g, 0).nums.join() === '6' && E.active(P(g, 0)));

// --- Flip 7 ---
g = rig(2, [1, 12, 2, 11, 3, 10, 4, 9, 5, 8, 6, 7, 0], 0);
for (var k = 0; k < 20 && g.phase === 'play'; k++) { E.act(g, g.turn, { a: 'hit' }); }
t('sette numeri diversi: la manche finisce subito', g.phase === 'scores' && g.roundRes.f7 === 1 && g.roundRes.st[1] === 'flip7', g.roundRes);
t('Flip 7 vale 15 punti in più (lo 0 conta come numero)', g.roundRes && g.roundRes.pts[1] === 21 + 15, g.roundRes && g.roundRes.pts);
t('anche gli altri incassano quello che hanno', g.roundRes && g.roundRes.pts[0] === 12 + 11 + 10 + 9 + 8 + 7);
t('carte sempre tutte (dopo il Flip 7)', count(g) === 94, count(g));

// --- Seconda possibilità ---
g = rig(3, ['SC', 9, 2, 7, 4, 7], 0);
t('chi la pesca la tiene', P(g, 1).sc === true && P(g, 1).nums.length === 0);
E.act(g, 1, { a: 'hit' }); E.act(g, 2, { a: 'hit' }); E.act(g, 0, { a: 'stay' }); E.act(g, 1, { a: 'hit' });
t('salva da un doppione: via il doppione e la carta', P(g, 1).st === 'in' && P(g, 1).nums.join() === '7' && P(g, 1).sc === false && g.disc.indexOf('SC') >= 0);
t('carte sempre tutte (dopo il salvataggio)', count(g) === 94, count(g));
g = rig(3, ['SC', 9, 2, 'SC'], 0);
E.act(g, 1, { a: 'hit' });
t('una seconda Seconda possibilità va regalata: si sceglie a chi', g.choice && g.choice.p === 1 && g.choice.c === 'SC' && g.choice.opts.join() === '0,2');
t('non a sé stessi', E.act(g, 1, { a: 'target', t: 1 }) !== null);
t('solo chi la deve dare sceglie', E.act(g, 0, { a: 'target', t: 0 }) !== null);
t('regalata', E.act(g, 1, { a: 'target', t: 2 }) === null && P(g, 2).sc && g.turn === 2);
g = rig(2, ['SC', 'SC', 4, 'SC'], 0);
E.act(g, 1, { a: 'hit' }); E.act(g, 0, { a: 'hit' });
t('se nessuno può riceverla finisce negli scarti', !g.choice && g.disc.indexOf('SC') >= 0 && count(g) === 94, count(g));

// --- Congela ---
g = rig(3, [5, 'FRZ', 2], 0);
t('un’azione nella distribuzione ferma tutto finché non si sceglie', g.stage === 'deal' && g.choice && g.choice.p === 2 && g.choice.c === 'FRZ' && P(g, 0).nums.length === 0);
t('si può scegliere chiunque sia ancora in gioco, anche sé stessi', g.choice.opts.join() === '0,1,2');
E.act(g, 2, { a: 'target', t: 1 });
t('congelato: incassa ed è fuori', P(g, 1).st === 'frozen' && E.score(P(g, 1)) === 5);
t('poi la distribuzione riprende', P(g, 0).nums.join() === '2' && g.stage === 'turn' && g.turn === 2);
g = rig(2, [5, 6, 'FRZ'], 0);
E.act(g, 1, { a: 'stay' });
E.act(g, 0, { a: 'hit' });
t('se resta un solo giocatore in gioco, l’azione va a lui', P(g, 0).st === 'frozen' && g.phase === 'scores');

// --- Flip Three ---
g = rig(3, [5, 9, 2, 'F3', 3, 'FRZ', 8], 0);
E.act(g, 1, { a: 'hit' });
t('Flip Three: si sceglie a chi', g.choice && g.choice.c === 'F3');
E.act(g, 1, { a: 'target', t: 2 });
t('tre carte in fila, e il Congela pescato aspetta la fine', P(g, 2).nums.join() === '9,3,8' && g.choice && g.choice.c === 'FRZ' && g.choice.p === 2);
E.act(g, 2, { a: 'target', t: 0 });
t('poi si usa', P(g, 0).st === 'frozen');
t('e il turno va avanti da chi aveva pescato', g.turn === 2);
t('carte sempre tutte (dopo Flip Three)', count(g) === 94, count(g));
g = rig(3, [5, 9, 2, 'F3', 'FRZ', 9, 4], 0);
E.act(g, 1, { a: 'hit' }); E.act(g, 1, { a: 'target', t: 2 });
t('chi sballa durante Flip Three si ferma e le azioni da parte vanno negli scarti', P(g, 2).st === 'bust' && !g.choice && P(g, 2).nums.join() === '9' && g.deck[g.deck.length - 1] === 4 && count(g) === 94, count(g));
g = rig(3, [5, 9, 2, 'F3', 'SC', 9, 6], 0);
E.act(g, 1, { a: 'hit' }); E.act(g, 1, { a: 'target', t: 2 });
t('una Seconda possibilità pescata durante Flip Three si usa subito', P(g, 2).st === 'in' && P(g, 2).nums.join() === '9,6' && !P(g, 2).sc);

// --- fine manche e manche successiva ---
g = rig(3, [5, 9, 2], 0);
E.act(g, 1, { a: 'stay' }); E.act(g, 2, { a: 'stay' }); E.act(g, 0, { a: 'stay' });
t('quando nessuno è più in gioco la manche finisce', g.phase === 'scores' && g.roundRes.pts.join() === '2,5,9' && P(g, 2).total === 9);
var left = g.deck.length;
t('le carte giocate vanno negli scarti, il mazzo non si rimescola', g.disc.length === 3 && left === 91);
t('prossima manche quando tutti sono pronti', E.act(g, 0, { a: 'next' }) === null && g.phase === 'scores' && E.pending(g).join() === '1,2');
E.act(g, 1, { a: 'next' }); E.act(g, 2, { a: 'next' });
t('nuova manche: il mazziere passa a sinistra', g.phase === 'play' && g.round === 2 && g.dealer === 1 && g.deck.length < left);
g.players.forEach(function (Q) { Q.ready = false; });
t('l’host può forzare la manche successiva', (function () { var h = rig(2, [5, 9], 0); E.act(h, 1, { a: 'stay' }); E.act(h, 0, { a: 'stay' }); return E.forceNext(h) && h.round === 2; })());

// --- mazzo finito ---
g = rig(2, [5, 9], 0);
g.disc = g.deck.splice(0, g.deck.length - 1);   // resta una carta sola nel mazzo
var tab = P(g, 1).nums.slice();
E.act(g, 1, { a: 'hit' }); if (g.phase === 'play' && g.stage === 'turn') E.act(g, g.turn, { a: 'hit' });
t('quando il mazzo finisce si rimescolano gli scarti, le carte in tavola restano', g.fx.some(function (e) { return e.k === 'reshuffle'; }) && P(g, 1).nums.slice(0, 1).join() === tab.join() && count(g) === 94, count(g));

// --- fine partita ---
g = rig(2, [5, 9], 0, { target: 100 });
P(g, 1).total = 96; P(g, 0).total = 40;
E.act(g, 1, { a: 'stay' }); E.act(g, 0, { a: 'stay' });
t('chi supera la soglia con più punti vince', g.phase === 'over' && g.winners.join() === '1' && g.final.order.join() === '1,0');
t('dopo la fine non si gioca', E.act(g, 0, { a: 'next' }) !== null);
g = rig(2, [5, 9], 0, { target: 100 });
P(g, 1).total = 104; P(g, 0).total = 100;
E.act(g, 1, { a: 'stay' }); E.act(g, 0, { a: 'stay' });
t('pari in testa sopra la soglia: si gioca un’altra manche', g.phase === 'scores' && g.tie);

// --- rischio ---
g = rig(2, [12, 1], 0);
t('rischio di sballare: carte uguali rimaste / carte nel mazzo', Math.abs(E.bustRisk(g, 1) - 11 / g.deck.length) < 1e-9);

// --- bot ---
g = rig(3, [5, 'FRZ', 2], 0);
var a = B.decide(g, 2);
t('il bot sceglie un bersaglio valido', a && a.a === 'target' && g.choice.opts.indexOf(a.t) >= 0);
g = rig(3, [5, 9, 2], 0);
t('il bot con una sola carta pesca', B.decide(g, 1).a === 'hit');
P(g, 1).nums = [12, 11, 10, 9, 8, 7]; t('il bot con tanti punti e tanto rischio si ferma', B.decide(g, 1).a === 'stay');

console.log('Flip 7: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
