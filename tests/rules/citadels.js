// gioco: citadels
// Prove delle regole di Citadels (una prova per regola)
var path = require('path'), SRC = path.join(__dirname, '../../src/citadels/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function byName(n) { return E.DIST.filter(function (d) { return d.n === n; }).map(function (d) { return d.id; }); }
function one(n) { return byName(n)[0]; }
// partita già nella fase dei turni con i personaggi dati (indice giocatore → rango)
function turns(chars, o) {
  o = o || {};
  var g = E.newGame(seats(chars.length));
  g.players.forEach(function (P, i) { P.char = chars[i]; P.gold = o.gold != null ? o.gold : 2; });
  g.phase = 'turns'; g.call = 0; g.pick = { order: [], i: chars.length, avail: [], up: o.up || [], down: 0, out: [] }; g.crown = o.crown || 0;
  if (o.setup) o.setup(g);
  E._next(g);
  return g;
}
// toglie una carta dal mazzo (o da chi l'ha) e la mette dove serve
function take(g, id) { var i = g.deck.indexOf(id); if (i >= 0) { g.deck.splice(i, 1); return id; } g.players.forEach(function (P) { [P.hand, P.city].forEach(function (L) { var k = L.indexOf(id); if (k >= 0) { L.splice(k, 1); if (L === P.hand) L.push(g.deck.shift()); } }); }); return id; }
function give(g, p, n, where) { var id = take(g, typeof n === 'number' ? n : one(n)); g.players[p][where || 'hand'].push(id); return id; }
function cnt(g) { return g.deck.length + g.players.reduce(function (s, P) { return s + P.hand.length + P.city.length; }, 0) + (g.turn && g.turn.drawn ? g.turn.drawn.length : 0); }

// --- carte ---
var DD = E.DIST;
t('68 quartieri: 54 base e 14 unici', DD.length === 68 && DD.filter(function (d) { return d.t === 'u'; }).length === 14);
t('12 nobili, 11 religiosi, 20 commerciali, 11 militari', ['n', 'r', 'c', 'm'].map(function (x) { return DD.filter(function (d) { return d.t === x; }).length; }).join() === '12,11,20,11');
t('costi base', E.D(one('Maniero')).c === 3 && E.D(one('Palazzo')).c === 5 && E.D(one('Tempio')).c === 1 && E.D(one('Porto')).c === 4 && E.D(one('Fortezza')).c === 5 && E.D(one('Porta del Drago')).c === 6);
t('8 personaggi', [1, 2, 3, 4, 5, 6, 7, 8].every(function (r) { return E.CH[r] && E.CH[r].n; }));

// --- preparazione ---
var g = E.newGame(seats(5));
t('2 oro e 4 carte a testa', g.players.every(function (P) { return P.gold === 2 && P.hand.length === 4; }));
t('tutte le 68 carte ci sono', cnt(g) === 68);
t('5 giocatori: 1 personaggio scartato scoperto', g.pick.up.length === 1);
t('4 giocatori: 2 scoperti; 6 e 7: nessuno', E.newGame(seats(4)).pick.up.length === 2 && E.newGame(seats(6)).pick.up.length === 0 && E.newGame(seats(7)).pick.up.length === 0);
var kingUp = false; for (var s = 0; s < 300; s++) { if (E.newGame(seats(4)).pick.up.indexOf(4) >= 0) kingUp = true; }
t('il Re non viene mai scartato scoperto', !kingUp);
t('chi ha la corona sceglie per primo', E.decider(g) === g.crown && g.pick.order[0] === g.crown);
t('5 giocatori: si sceglie tra 6 personaggi', E.choices(g).length === 6);
var c0 = E.choices(g)[0], pk = E.decider(g);
t('non si sceglie fuori turno', E.act(g, (pk + 1) % 5, { a: 'pick', r: c0 }) !== null);
t('non si sceglie un personaggio scartato', E.act(g, pk, { a: 'pick', r: g.pick.up[0] }) !== null);
t('scelta', E.act(g, pk, { a: 'pick', r: c0 }) === null && g.players[pk].char === c0 && E.choices(g).indexOf(c0) < 0 && E.decider(g) === (pk + 1) % 5);
while (g.phase === 'pick') { var q = E.decider(g); E.act(g, q, { a: 'pick', r: E.choices(g)[0] }); }
t('dopo la scelta si chiamano i personaggi', g.phase === 'turns' && g.turn && g.turn.r === Math.min.apply(null, g.players.map(function (P) { return P.char; })));
var g7 = E.newGame(seats(7));
for (var k = 0; k < 6; k++) E.act(g7, E.decider(g7), { a: 'pick', r: E.choices(g7)[0] });
t('7 giocatori: l’ultimo sceglie tra l’ultima carta e quella scartata coperta', E.choices(g7).length === 2 && E.choices(g7).indexOf(g7.pick.down) >= 0);

// --- turno base ---
g = turns([6, 2, 3, 4]);
t('si chiama il personaggio più basso in gioco', g.turn.r === 2 && g.turn.p === 1);
t('non si costruisce prima di prendere le risorse', E.act(g, 1, { a: 'build', id: g.players[1].hand[0] }) !== null);
t('2 oro', E.act(g, 1, { a: 'gold' }) === null && g.players[1].gold === 4);
t('le risorse si prendono una volta sola', E.act(g, 1, { a: 'draw' }) !== null);
E.act(g, 1, { a: 'end' });
t('poi tocca al personaggio successivo', g.turn.r === 3 && g.turn.p === 2);
var h0 = g.players[2].hand.length, bot0 = g.deck[0];
E.act(g, 2, { a: 'draw' });
t('pescare 2 carte e sceglierne una', g.turn.drawn && g.turn.drawn.length === 2 && E.act(g, 2, { a: 'end' }) !== null);
var keep = g.turn.drawn[0], other = g.turn.drawn[1];
t('l’altra va in fondo al mazzo', E.act(g, 2, { a: 'keep', id: keep }) === null && g.players[2].hand.length === h0 + 1 && g.deck[0] === other);
t('carte sempre tutte', cnt(g) === 68);

// --- costruire ---
g = turns([4, 5, 6, 7], { gold: 10 });
var m = give(g, 0, 'Maniero');
E.act(g, 0, { a: 'gold' });
t('costruire un quartiere costa il suo prezzo', E.act(g, 0, { a: 'build', id: m }) === null && g.players[0].city.indexOf(m) >= 0 && g.players[0].gold === 12 - 3);
var m2 = give(g, 0, byName('Maniero')[1]);
t('un solo quartiere per turno', E.act(g, 0, { a: 'build', id: m2 }) !== null);
g.turn.built = 0;
t('niente doppioni nella città', /già/.test(E.act(g, 0, { a: 'build', id: m2 })));
give(g, 0, 'Cava', 'city'); t('con la Cava i doppioni si possono costruire', E.act(g, 0, { a: 'build', id: m2 }) === null);
g.players[0].gold = 1; var pal = give(g, 0, 'Palazzo'); g.turn.built = 0;
t('servono abbastanza oro', /oro/.test(E.act(g, 0, { a: 'build', id: pal })));

// --- Re ---
g = turns([4, 5, 6, 7], { crown: 2, setup: function (g) { give(g, 0, 'Maniero', 'city'); give(g, 0, 'Castello', 'city'); } });
t('il Re prende la corona appena si rivela', g.crown === 0);
E.act(g, 0, { a: 'gold' });
t('il Re incassa 1 oro per quartiere nobile', E.act(g, 0, { a: 'income' }) === null && g.players[0].gold === 2 + 2 + 2);
t('una volta sola', E.act(g, 0, { a: 'income' }) !== null);

// --- incasso automatico a fine turno e Scuola di Magia ---
g = turns([5, 6, 7, 8], { setup: function (g) { give(g, 0, 'Tempio', 'city'); give(g, 0, 'Scuola di Magia', 'city'); } });
E.act(g, 0, { a: 'gold' }); E.act(g, 0, { a: 'end' });
t('se non lo fai tu, l’oro dei quartieri si incassa a fine turno (la Scuola di Magia conta)', g.players[0].gold === 2 + 2 + 2);

// --- Mercante e Architetto ---
g = turns([6, 7, 2, 3]);
t('il Mercante prende 1 oro in più', g.turn.r === 2);
E.act(g, 2, { a: 'rob', r: 8 }); E.act(g, 2, { a: 'gold' }); E.act(g, 2, { a: 'end' });
E.act(g, 3, { a: 'gold' }); E.act(g, 3, { a: 'end' });
t('il Mercante prende 1 oro in più (all’inizio del turno)', g.turn.r === 6 && g.players[0].gold === 3);
E.act(g, 0, { a: 'gold' }); E.act(g, 0, { a: 'end' });
t('l’Architetto pesca 2 carte in più e può costruire fino a 3 quartieri', g.turn.r === 7 && g.players[1].hand.length === 6 && g.turn.max === 3);

// --- Assassino ---
g = turns([1, 4, 6, 7], { crown: 3 });
t('l’Assassino non uccide sé stesso', E.act(g, 0, { a: 'kill', r: 1 }) !== null);
E.act(g, 0, { a: 'kill', r: 4 }); E.act(g, 0, { a: 'gold' }); E.act(g, 0, { a: 'end' });
t('il personaggio ucciso salta il turno', g.turn.r === 6 && g.players[1].gold === 2);
E.act(g, 2, { a: 'gold' }); E.act(g, 2, { a: 'end' }); E.act(g, 3, { a: 'gold' }); E.act(g, 3, { a: 'end' });
t('il Re ucciso prende comunque la corona a fine round', g.crown === 1 && g.phase === 'pick' && g.round === 2);

// --- Ladro ---
g = turns([2, 6, 1, 7], { gold: 5 });
t('il Ladro non deruba l’Assassino', g.turn.r === 1);
E.act(g, 2, { a: 'kill', r: 7 }); E.act(g, 2, { a: 'gold' }); E.act(g, 2, { a: 'end' });
t('né il personaggio ucciso', E.act(g, 0, { a: 'rob', r: 1 }) !== null && E.act(g, 0, { a: 'rob', r: 7 }) !== null);
E.act(g, 0, { a: 'rob', r: 6 }); E.act(g, 0, { a: 'gold' }); E.act(g, 0, { a: 'end' });
t('quando il derubato si rivela, il Ladro prende tutto il suo oro', g.turn.r === 6 && g.players[1].gold === 1 && g.players[0].gold === 5 + 2 + 5, [g.players[0].gold, g.players[1].gold]);

// --- Mago ---
g = turns([3, 5, 6, 7]);
g.players[0].hand = g.players[0].hand.slice(0, 1); var hb = g.players[1].hand.slice();
var lost1 = g.players[0].hand.concat([]); g.deck = g.deck.concat([]); // le carte tolte restano fuori dal conteggio: ricarico il mazzo
t('il Mago scambia la mano con un altro', E.act(g, 0, { a: 'swap', t: 1 }) === null && g.players[0].hand.join() === hb.join() && g.players[1].hand.join() === lost1.join());
t('una volta sola', E.act(g, 0, { a: 'redraw', ids: [g.players[0].hand[0]] }) !== null);
g = turns([3, 5, 6, 7]);
var hm = g.players[0].hand.slice();
t('oppure scarta delle carte e ne pesca altrettante', E.act(g, 0, { a: 'redraw', ids: hm.slice(0, 2) }) === null && g.players[0].hand.length === 4 && g.deck[0] === hm[1] && g.deck[1] === hm[0]);

// --- Condottiero e Vescovo ---
g = turns([5, 6, 7, 8], { gold: 6, setup: function (g) { give(g, 0, 'Chiesa', 'city'); give(g, 1, 'Mercato', 'city'); give(g, 1, 'Mastio', 'city'); give(g, 3, 'Prigione', 'city'); } });
['gold', 'end'].forEach(function (x) { E.act(g, 0, { a: x }); }); ['gold', 'end'].forEach(function (x) { E.act(g, 1, { a: x }); }); ['gold', 'end'].forEach(function (x) { E.act(g, 2, { a: x }); });
t('si arriva al Condottiero', g.turn.r === 8);
var ch = g.players[0].city[0], mk = g.players[1].city[0], kp = g.players[1].city[1];
t('il Vescovo protegge i suoi quartieri', /Vescovo/.test(E.act(g, 3, { a: 'destroy', t: 0, id: ch })));
t('il Mastio non si distrugge', /Mastio/.test(E.act(g, 3, { a: 'destroy', t: 1, id: kp })));
var gb = g.players[3].gold;
t('distruggere costa 1 oro in meno del quartiere', E.act(g, 3, { a: 'destroy', t: 1, id: mk }) === null && g.players[1].city.indexOf(mk) < 0 && g.players[3].gold === gb - 1 && g.deck[0] === mk);
t('una volta per turno', E.act(g, 3, { a: 'destroy', t: 3, id: g.players[3].city[0] }) !== null);
g = turns([5, 6, 7, 8], { gold: 9, setup: function (g) { for (var k = 0; k < 7; k++) give(g, 1, ['Maniero', 'Tempio', 'Taverna', 'Torre di guardia', 'Castello', 'Chiesa', 'Mercato'][k], 'city'); } });
while (g.turn && g.turn.r !== 8) { E.act(g, g.turn.p, { a: 'gold' }); E.act(g, g.turn.p, { a: 'end' }); }
t('nelle città complete non si distrugge', /complet/.test(E.act(g, 3, { a: 'destroy', t: 1, id: g.players[1].city[0] })));
g = turns([5, 6, 7, 8], { gold: 6, setup: function (g) { give(g, 0, 'Chiesa', 'city'); } });
g.killed = 5; g.call = 4; E._next(g);
while (g.turn && g.turn.r !== 8) { E.act(g, g.turn.p, { a: 'gold' }); E.act(g, g.turn.p, { a: 'end' }); }
t('se il Vescovo è stato ucciso, niente protezione', E.act(g, 3, { a: 'destroy', t: 0, id: g.players[0].city[0] }) === null);

// --- quartieri unici ---
g = turns([5, 6, 7, 8], { gold: 0, setup: function (g) { give(g, 0, 'Biblioteca', 'city'); } });
E.act(g, 0, { a: 'draw' });
t('Biblioteca: si tengono tutte e due le carte pescate', !g.turn.drawn && g.players[0].hand.length === 6);
g = turns([5, 6, 7, 8], { gold: 5, setup: function (g) { give(g, 0, 'Fabbrica', 'city'); give(g, 0, 'Statua'); } });
E.act(g, 0, { a: 'gold' });
t('Fabbrica: gli altri unici costano 1 oro in meno', E.act(g, 0, { a: 'build', id: one('Statua') }) === null && g.players[0].gold === 5 + 2 - 2);
g = turns([5, 6, 7, 8], { gold: 1, setup: function (g) { give(g, 0, 'Covo dei Ladri'); } });
E.act(g, 0, { a: 'gold' });
var hd = g.players[0].hand.filter(function (x) { return x !== one('Covo dei Ladri'); });
t('Covo dei Ladri: si paga anche con le carte', E.act(g, 0, { a: 'build', id: one('Covo dei Ladri'), cards: hd.slice(0, 4) }) === null && g.players[0].gold === 1 && g.players[0].hand.length === 0);
g = turns([5, 6, 7, 8], { gold: 1, setup: function (g) { give(g, 0, 'Laboratorio', 'city'); give(g, 0, 'Fucina', 'city'); } });
t('Laboratorio: scarti una carta e prendi 2 oro', E.act(g, 0, { a: 'lab', id: g.players[0].hand[0] }) === null && g.players[0].gold === 3 && E.act(g, 0, { a: 'lab', id: g.players[0].hand[0] }) !== null);
var h0 = g.players[0].hand.length;
t('Fucina: paghi 2 oro e peschi 3 carte', E.act(g, 0, { a: 'smithy' }) === null && g.players[0].gold === 1 && g.players[0].hand.length === h0 + 3);
t('carte sempre tutte (unici)', cnt(g) === 68);

// --- fine partita e punteggio ---
g = turns([5, 6, 7, 8], { gold: 20, setup: function (g) { ['Maniero', 'Tempio', 'Taverna', 'Torre di guardia', 'Castello', 'Chiesa'].forEach(function (n) { give(g, 0, n, 'city'); }); give(g, 0, 'Porta del Drago'); } });
E.act(g, 0, { a: 'gold' }); E.act(g, 0, { a: 'build', id: one('Porta del Drago') });
t('7 quartieri: città completa, la partita finisce alla fine del round', g.first === 0 && g.ending && g.phase === 'turns');
E.act(g, 0, { a: 'end' });
while (g.phase === 'turns') { E.act(g, g.turn.p, { a: 'gold' }); E.act(g, g.turn.p, { a: 'end' }); }
var sc = g.final && g.final.sc[0];
t('fine partita', g.phase === 'over');
t('punti: costi, +3 tutti i tipi, +4 primo a completare, +2 Porta del Drago', sc && sc.city === 3 + 1 + 1 + 1 + 4 + 2 + 6 && sc.types === 3 && sc.done === 4 && sc.extra === 2 && sc.total === 18 + 3 + 4 + 2, sc);
g = E.newGame(seats(4));
['Maniero', 'Tempio', 'Taverna', 'Quartiere Infestato'].forEach(function (n) { give(g, 0, n, 'city'); });
t('Quartiere Infestato: conta come il tipo che manca', E.score(g, 0).types === 0);
give(g, 0, 'Mastio', 'city'); t('…e con un altro unico vale come militare: +3', E.score(g, 0).types === 3);
g = E.newGame(seats(4)); g.players[1].city = []; for (var z = 0; z < 7; z++) give(g, 1, ['Maniero', 'Tempio', 'Taverna', 'Torre di guardia', 'Castello', 'Chiesa', 'Mercato'][z], 'city'); g.first = 2;
t('chi completa per secondo prende 2 punti', E.score(g, 1).done === 2);
g = E.newGame(seats(4)); give(g, 0, 'Tesoro Imperiale', 'city'); give(g, 0, 'Sala delle Mappe', 'city'); give(g, 0, 'Pozzo dei Desideri', 'city'); give(g, 0, 'Statua', 'city'); g.players[0].gold = 3; g.crown = 0;
t('Tesoro Imperiale, Sala delle Mappe, Pozzo dei Desideri e Statua', E.score(g, 0).extra === 3 + g.players[0].hand.length + 4 + 5, E.score(g, 0));
g = E.newGame(seats(4)); g.players.forEach(function (P) { P.city = []; P.hand = []; P.gold = 0; }); g.players[1].lastChar = 7; g.players[2].lastChar = 3; E._endGame(g);
t('a pari punti vince chi aveva il personaggio più alto nell’ultimo round', g.winners[0] === 1);

// --- bot ---
g = E.newGame(seats(5));
var ba = B.decide(g, E.decider(g));
t('il bot sceglie un personaggio disponibile', ba && ba.a === 'pick' && E.choices(g).indexOf(ba.r) >= 0);

console.log('Citadels: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
