/* Regole puntuali di Bang! con le espansioni Dodge City, Mezzogiorno di Fuoco e Per un Pugno di Carte. */
var D = require('../../src/polvere-e-piombo/data.js');
var E = require('../../src/polvere-e-piombo/engine.js');
var assert = require('assert');
var T = D.TYPES;

function idsOf(t) { return D.CARDS.filter(function (c) { return c.t === t; }).map(function (c) { return c.id; }); }
// partita pulita: mani vuote, nessun equipaggiamento, tocca a 0 e ha già pescato
function setup(n, opts, chars) {
  var seats = []; for (var i = 0; i < n; i++) seats.push({ uid: 'u' + i, nick: 'P' + i });
  var s = E.newGame(seats, opts || { dc: 1 });
  s.stack = []; s.disc = [];
  var all = D.CARDS.filter(function (c) { return opts && opts.dc === 0 ? !c.x : true; }).map(function (c) { return c.id; });
  s.players.forEach(function (P, i) {
    P.hand = []; P.eq = []; P.role = i === 0 ? 'sceriffo' : i === 1 ? 'vice' : i === 2 ? 'traditore' : 'bandito';
    P.char = (chars && chars[i]) || 'wren'; if (P.char === 'wren' && !(chars && chars[i])) P.char = 'clem2';
    P.max = 4; P.hp = 4; P.alive = true; P.ghost = false;
  });
  s.deck = all; s.green = {}; s.turn = 0; s.step = 'play'; s.bangs = 0; s.used = {}; s.must = null; s.turnN = 5; s.dir = 1;
  if (s.ev) s.ev.cur = null;
  return s;
}
function card(s, t, who, where) {
  var id = idsOf(t).filter(function (c) { return s.deck.indexOf(c) >= 0; })[0];
  assert(id != null, 'carta finita ' + t);
  s.deck.splice(s.deck.indexOf(id), 1);
  s.players[who][where || 'hand'].push(id);
  return id;
}
function ok(r, msg) { assert.strictEqual(r, null, msg + ': ' + r); }
function no(r, msg) { assert.notStrictEqual(r, null, msg); }
var tests = 0;
function t(name, fn) { fn(); tests++; }

// personaggio neutro per i test
D.CHAR.clem2 = { id: 'clem2', n: 'Neutro', hp: 4 };

t('8 giocatori solo con Dodge City', function () {
  var seats = []; for (var i = 0; i < 8; i++) seats.push({ uid: 'u' + i, nick: 'P' + i });
  assert.throws(function () { E.newGame(seats, {}); });
  var s = E.newGame(seats, { dc: 1 });
  var roles = s.players.map(function (P) { return P.role; }).sort();
  assert.deepStrictEqual(roles, ['bandito', 'bandito', 'bandito', 'sceriffo', 'traditore', 'traditore', 'vice', 'vice']);
  var s2 = E.newGame(seats.slice(0, 7), {});
  assert(s2.players.every(function (P) { return !D.CHAR[P.char].x; }), 'senza Dodge City niente personaggi nuovi');
  var tot = s2.deck.length + s2.disc.length + s2.players.reduce(function (a, P) { return a + P.hand.length + P.eq.length; }, 0) + s2.stack.reduce(function (a, f) { return a + (f.cards ? f.cards.length : 0); }, 0);
  assert.strictEqual(tot, 80, 'senza Dodge City il mazzo ha 80 carte');
});

t('mazzo eventi: combinato 12 + finale, singolo 12 + finale', function () {
  var seats = []; for (var i = 0; i < 4; i++) seats.push({ uid: 'u' + i, nick: 'P' + i });
  var s = E.newGame(seats, { hn: 1, fc: 1 });
  assert.strictEqual(s.ev.deck.length, 13);
  assert(['mezzogiorno', 'pugnocarte'].indexOf(s.ev.deck[12]) >= 0);
  var h = E.newGame(seats, { hn: 1 });
  assert.strictEqual(h.ev.deck[h.ev.deck.length - 1], 'mezzogiorno');
  assert(h.ev.deck.every(function (k) { return D.EVENTS[k].set === 'hn'; }));
  var f = E.newGame(seats, { fc: 1 });
  assert.strictEqual(f.ev.deck[f.ev.deck.length - 1], 'pugnocarte');
  assert.strictEqual(E.newGame(seats, {}).ev, null);
});

t('distanze: Binocolo e Riparo si sommano a Mirino e Mustang', function () {
  var s = setup(6);
  assert.strictEqual(E.distance(s, 0, 3), 3);
  card(s, 'binocolo', 0, 'eq'); card(s, 'cannocchiale', 0, 'eq');
  assert.strictEqual(E.distance(s, 0, 3), 1);
  card(s, 'rifugio', 3, 'eq'); card(s, 'cavallo', 3, 'eq');
  assert.strictEqual(E.distance(s, 0, 3), 3);
  s.ev = { cur: 'agguato', deck: [], pile: [] };
  assert.strictEqual(E.distance(s, 0, 3), 1, 'Agguato: tutti a distanza 1');
});

t('carte con scarto extra: serve la seconda carta', function () {
  var s = setup(4);
  var sp = card(s, 'springfield', 0); var x = card(s, 'giro', 0);
  no(E.act(s, 0, { a: 'play', card: sp, target: 2 }), 'senza carta extra');
  ok(E.act(s, 0, { a: 'play', card: sp, target: 2, extra: x }), 'Springfield');
  assert.strictEqual(s.players[0].hand.length, 0);
  assert(s.disc.indexOf(x) >= 0 && s.disc.indexOf(sp) >= 0);
  assert.strictEqual(s.players[2].hp, 3, 'colpito a qualsiasi distanza');
});

t('Pugno! non conta come Bang!', function () {
  var s = setup(4);
  var b = card(s, 'sparo', 0), pu = card(s, 'pugno', 0);
  ok(E.act(s, 0, { a: 'play', card: b, target: 1 }), 'Bang');
  ok(E.act(s, 0, { a: 'play', card: pu, target: 3 }), 'Pugno dopo Bang');
  assert.strictEqual(s.players[1].hp, 3); assert.strictEqual(s.players[3].hp, 3);
});

t('carte verdi: si usano dal turno successivo', function () {
  var s = setup(4);
  var d = card(s, 'derringer', 0);
  ok(E.act(s, 0, { a: 'play', card: d }), 'metti in gioco');
  assert(!E.greenInfo(s, 0, d).ok, 'subito non si usa');
  s.turnN++;
  var n = s.players[0].hand.length;
  ok(E.act(s, 0, { a: 'green', card: d, target: 1 }), 'Derringer');
  assert.strictEqual(s.players[1].hp, 3); assert.strictEqual(s.players[0].hand.length, n + 1, 'Derringer fa pescare');
  assert(s.players[0].eq.indexOf(d) < 0);
});

t('Bibbia annulla un colpo e fa pescare', function () {
  var s = setup(4);
  var bi = card(s, 'bibbia', 1, 'eq'); s.green[bi] = 1;
  var b = card(s, 'sparo', 0);
  ok(E.act(s, 0, { a: 'play', card: b, target: 1 }), 'Bang');
  assert.strictEqual(E.decider(s), 1);
  assert.deepStrictEqual(E.frameOptions(s, s.stack[s.stack.length - 1]).green, [bi]);
  ok(E.act(s, 1, { a: 'respond', r: 'green', card: bi }), 'Bibbia');
  assert.strictEqual(s.players[1].hp, 4); assert.strictEqual(s.players[1].hand.length, 1);
});

t('Giudice: niente carte in gioco; Lazo: le carte in gioco non contano', function () {
  var s = setup(4);
  s.ev = { cur: 'giudice', deck: [], pile: [] };
  var m = card(s, 'cavallo', 0);
  no(E.act(s, 0, { a: 'play', card: m }), 'Giudice');
  s.ev.cur = 'lazo';
  card(s, 'riparo', 1, 'eq'); card(s, 'cavallo', 1, 'eq');
  assert.strictEqual(E.distance(s, 0, 1), 1, 'Mustang ignorato');
  var b = card(s, 'sparo', 0);
  ok(E.act(s, 0, { a: 'play', card: b, target: 1 }), 'Bang');
  assert.strictEqual(s.players[1].hp, 3, 'nessun Barile con il Lazo');
});

t('Apache Kid: immune alle carte di Quadri degli altri', function () {
  var s = setup(4, { dc: 1 }, ['clem2', 'apache']);
  var b = D.CARDS.filter(function (c) { return c.t === 'sparo' && c.s === 'D'; })[0].id;
  s.deck.splice(s.deck.indexOf(b), 1); s.players[0].hand.push(b);
  ok(E.act(s, 0, { a: 'play', card: b, target: 1 }), 'Bang di Quadri');
  assert.strictEqual(s.players[1].hp, 4);
  s.ev = { cur: 'benedizione', deck: [], pile: [] };
  assert.strictEqual(E.suit(s, b), 'H', 'Benedizione: tutte Cuori');
});

t('Sbornia toglie le abilità', function () {
  var s = setup(4, { dc: 1 }, ['lark']);
  var a = card(s, 'sparo', 0), b2 = card(s, 'sparo', 0);
  s.ev = { cur: 'sbornia', deck: [], pile: [] };
  ok(E.act(s, 0, { a: 'play', card: a, target: 1 }), 'primo Bang');
  no(E.act(s, 0, { a: 'play', card: b2, target: 1 }), 'Willy senza abilità');
});

t('Sparatoria: due Bang!; Sermone: nessun Bang!; Reverendo: niente Birra', function () {
  var s = setup(4);
  s.ev = { cur: 'sparatoria', deck: [], pile: [] };
  var a = card(s, 'sparo', 0), b = card(s, 'sparo', 0), c = card(s, 'sparo', 0);
  ok(E.act(s, 0, { a: 'play', card: a, target: 1 }), '1');
  ok(E.act(s, 0, { a: 'play', card: b, target: 1 }), '2');
  no(E.act(s, 0, { a: 'play', card: c, target: 1 }), '3');
  s.ev.cur = 'sermone'; s.bangs = 0;
  no(E.act(s, 0, { a: 'play', card: c, target: 1 }), 'Sermone');
  s.ev.cur = 'reverendo'; s.players[0].hp = 2;
  var w = card(s, 'whisky', 0);
  no(E.act(s, 0, { a: 'play', card: w }), 'Reverendo');
});

t('Elena Fuente schiva con qualsiasi carta; Molly pesca fuori turno', function () {
  var s = setup(4, { dc: 1 }, ['clem2', 'elena', 'molly']);
  var g = card(s, 'giro', 1);
  var b = card(s, 'sparo', 0);
  ok(E.act(s, 0, { a: 'play', card: b, target: 1 }), 'Bang');
  ok(E.act(s, 1, { a: 'respond', r: 'card', card: g }), 'Elena schiva con un Saloon');
  assert.strictEqual(s.players[1].hp, 4);
  s.players[0].char = 'lark'; card(s, 'schioppo', 0, 'eq');
  var b2 = card(s, 'sparo', 0); var m = card(s, 'schivata', 2);
  ok(E.act(s, 0, { a: 'play', card: b2, target: 2 }), 'Bang a Molly');
  ok(E.act(s, 2, { a: 'respond', r: 'card', card: m }), 'Molly schiva');
  assert.strictEqual(s.players[2].hand.length, 1, 'Molly ripesca');
});

t('Cecchino: servono due Schivata!', function () {
  var s = setup(4);
  s.ev = { cur: 'cecchino', deck: [], pile: [] };
  var a = card(s, 'sparo', 0), b = card(s, 'sparo', 0); var m = card(s, 'schivata', 1);
  ok(E.act(s, 0, { a: 'sniper', cards: [a, b], target: 1 }), 'cecchino');
  assert.strictEqual(s.players[1].hp, 3, 'una sola Schivata non basta');
  assert(s.players[1].hand.indexOf(m) >= 0, 'la Schivata resta in mano');
  var c = card(s, 'sparo', 0), d = card(s, 'sparo', 0), m2 = card(s, 'schivata', 1); s.bangs = 0;
  ok(E.act(s, 0, { a: 'sniper', cards: [c, d], target: 1 }), 'cecchino 2');
  ok(E.act(s, 1, { a: 'respond', r: 'card', card: m }), 'prima');
  ok(E.act(s, 1, { a: 'respond', r: 'card', card: m2 }), 'seconda');
  assert.strictEqual(s.players[1].hp, 3);
});

t('Rimbalzo: colpisce una carta in gioco', function () {
  var s = setup(4);
  s.ev = { cur: 'rimbalzo', deck: [], pile: [] };
  var mu = card(s, 'cavallo', 3, 'eq'); var b = card(s, 'sparo', 0);
  ok(E.act(s, 0, { a: 'ricochet', card: b, target: 3, pick: mu }), 'rimbalzo');
  assert(s.players[3].eq.indexOf(mu) < 0 && s.players[3].hp === 4);
});

t('fase di pesca: Pixie 3, Bill in base alle ferite, Treno +1, Sete −1', function () {
  var s = setup(4, { dc: 1 }, ['pixie', 'bill']);
  assert.strictEqual(E.drawCount(s, 0), 3);
  s.players[1].hp = 2; assert.strictEqual(E.drawCount(s, 1), 3);
  s.ev = { cur: 'treno', deck: [], pile: [] }; assert.strictEqual(E.drawCount(s, 0), 4);
  s.ev.cur = 'sete'; assert.strictEqual(E.drawCount(s, 1), 2);
});

t('Legge del West: la seconda carta va giocata', function () {
  var s = setup(4);
  s.ev = { cur: 'leggewest', deck: [], pile: [] };
  var c1 = card(s, 'giro', 0); s.players[0].hand = []; s.deck.push(c1);
  var c2 = card(s, 'posta', 0); s.players[0].hand = []; s.deck.push(c2);
  // il mazzo si pesca dalla fine: prima c2, poi c1 → la seconda è il Saloon
  s.step = 'draw'; s.players[0].hp = 3;
  ok(E.act(s, 0, { a: 'draw', mode: 'deck' }), 'pesca');
  assert.strictEqual(s.must, c1);
  no(E.act(s, 0, { a: 'end' }), 'non può passare');
  ok(E.act(s, 0, { a: 'play', card: c1 }), 'Saloon');
  ok(E.act(s, 0, { a: 'end' }), 'ora passa');
});

t('Mezzogiorno di fuoco: 1 danno a inizio turno; Dottore cura il più ferito', function () {
  var s = setup(4);
  s.ev = { cur: 'mezzogiorno', deck: [], pile: [] };
  ok(E.act(s, 0, { a: 'end' }), 'passa');
  assert.strictEqual(s.players[1].hp, 3);
});

t('Città fantasma: i morti tornano per un turno e poi rientrano nella tomba', function () {
  var s = setup(4);
  s.players[1].alive = false; s.players[1].hp = 0; s.deaths = [1];
  s.ev = { cur: 'fantasma', deck: [], pile: [] };
  ok(E.act(s, 0, { a: 'end' }), 'passa');
  assert.strictEqual(s.turn, 1); assert(s.players[1].ghost);
  assert.strictEqual(s.players[1].hand.length, 3, 'il fantasma pesca 3 carte');
  var b = card(s, 'sparo', 2); s.turn = 1;
  ok(E.act(s, 1, { a: 'end' }), 'il fantasma passa');
  assert(!s.players[1].alive && !s.players[1].ghost);
});

t('I Dalton: chi ha carte blu ne scarta una', function () {
  var s = setup(4);
  s.ev = { cur: null, deck: ['dalton', 'mezzogiorno'], pile: [] }; s.round = 1;
  s.players[3].eq.push(card(s, 'cavallo', 3, 'hand')); s.players[3].hand = [];
  s.players[2].eq.push(card(s, 'riparo', 2, 'hand')); s.players[2].hand = [];
  s.turn = 3; s.round = 1;
  ok(E.act(s, 3, { a: 'end' }), 'tocca allo Sceriffo');
  assert.strictEqual(s.ev.cur, 'dalton');
  assert.strictEqual(s.players[3].eq.length, 0); assert.strictEqual(s.players[2].eq.length, 0);
});

t('Rissa: ogni avversario scarta una carta', function () {
  var s = setup(4);
  var r = card(s, 'rissa', 0), x = card(s, 'giro', 0);
  card(s, 'posta', 1); card(s, 'posta', 2); card(s, 'cavallo', 3, 'eq');
  ok(E.act(s, 0, { a: 'play', card: r, extra: x }), 'Rissa');
  assert.strictEqual(s.players[1].hand.length + s.players[2].hand.length + s.players[3].eq.length, 0);
});

console.log('OK pp_rules (' + tests + ' prove)');
