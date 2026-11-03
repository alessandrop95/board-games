// Prove delle regole di Unlock! e coerenza delle avventure
var path = require('path'), SRC = path.join(__dirname, '../../src/unlock/');
var SC = require(SRC + 'scen.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
var T0 = 1e9;

// --- coerenza dei dati di ogni avventura ---
SC.ORDER.forEach(function (sid) {
  var S = SC.S[sid], C = S.cards, ids = Object.keys(C);
  t(sid + ': c’è la carta iniziale', C.start && C.start.k === 'story');
  t(sid + ': una sola carta finale', ids.filter(function (i) { return C[i].k === 'end'; }).length === 1);
  ids.forEach(function (id) {
    var c = C[id];
    t(sid + ' ' + id + ': tipo valido', ['story', 'room', 'red', 'blue', 'green', 'yellow', 'grey', 'pen', 'end'].indexOf(c.k) >= 0, c.k);
    t(sid + ' ' + id + ': titolo e testo', c.t && c.x);
    (c.refs || []).concat(c.hid || [], c.disc || [], c.calc || []).forEach(function (r) { t(sid + ' ' + id + ': rimanda a una carta esistente (' + r + ')', !!C[r]); });
    if (c.code) t(sid + ' ' + id + ': lucchetto giallo da 4 cifre verso una carta che esiste', c.k === 'yellow' && /^\d{4}$/.test(c.code.ans) && C[c.code.to] && (!c.code.need || C[c.code.need]));
    if (c.mac) t(sid + ' ' + id + ': macchina verde verso una carta che esiste', c.k === 'green' && C[c.mac.to] && (!c.mac.need || C[c.mac.need]));
    if (c.k === 'pen') t(sid + ' ' + id + ': penalità in minuti', c.pen > 0);
    if (['story', 'room', 'red', 'blue', 'green', 'yellow', 'grey'].indexOf(c.k) >= 0 && id !== 'start') t(sid + ' ' + id + ': ha due indizi', c.h && c.h.length === 2);
    if (/^\d+$/.test(id)) t(sid + ' ' + id + ': numero da 1 a 99', +id >= 1 && +id <= 99);
  });
  S.combos.forEach(function (m) {
    var r = C[m.r], b = m.b.charAt(0) === '+' ? null : C[m.b];
    t(sid + ' unione ' + m.r + '+' + m.b + ': rossa con blu', r && r.k === 'red' && (b ? b.k === 'blue' : ids.some(function (i) { return '+' + C[i].mod === m.b; })));
    t(sid + ' unione ' + m.r + '+' + m.b + ' = ' + m.to + ' (somma giusta)', +m.r + +m.b.replace('+', '') === +m.to, +m.r + +m.b.replace('+', ''));
  });
  // ogni carta può uscire in qualche modo
  var reach = {}; reach.start = 1;
  ids.forEach(function (id) { var c = C[id]; (c.refs || []).concat(c.hid || [], c.calc || []).forEach(function (r) { reach[r] = 1; }); if (c.code) reach[c.code.to] = 1; if (c.mac) reach[c.mac.to] = 1; });
  S.combos.forEach(function (m) { reach[m.to] = 1; });
  t(sid + ': tutte le carte si possono scoprire', ids.every(function (i) { return reach[i]; }), ids.filter(function (i) { return !reach[i]; }));
  // numeri unici: nessuna carta ha due ruoli
  var tos = S.combos.map(function (m) { return m.to; }).concat(ids.filter(function (i) { return C[i].code; }).map(function (i) { return C[i].code.to; }), ids.filter(function (i) { return C[i].mac; }).map(function (i) { return C[i].mac.to; }));
  t(sid + ': ogni carta-risultato esce da un solo posto', tos.length === new Set(tos).size);

  // --- la soluzione porta alla fine, senza penalità ---
  var g = E.newGame(seats(3), { scen: sid }, T0), now = T0, n = 0, a;
  t(sid + ': all’inizio solo la carta iniziale in tavola', E.table(g).join() === 'start');
  while ((a = B.decide(g)) && n < 200) { now += 20000; var err = E.act(g, n % 3, a, now); if (err) { t(sid + ': passo della soluzione accettato', false, [a, err]); break; } n++; }
  t(sid + ': la soluzione arriva in fondo', g.phase === 'over' && g.won, [g.phase, B.next(g)]);
  t(sid + ': senza penalità né indizi: 5 stelle', g.pen === 0 && g.stars === (n * 20 > (S.min * 60 - S.min * 10) ? 4 : 5), [g.pen, g.stars, n]);
  t(sid + ': ogni passo usato davvero', n === S.solution.length, [n, S.solution.length]);
  t(sid + ': livello da 1 a 4', S.level >= 1 && S.level <= 4);
  // i numeri da calcolare non devono essere anche visibili (altrimenti non c'è niente da dedurre)
  ids.forEach(function (id) { (C[id].calc || []).forEach(function (n) { t(sid + ' ' + n + ': numero da calcolare non scritto su nessuna carta', !ids.some(function (j) { return (C[j].refs || []).concat(C[j].hid || []).indexOf(n) >= 0; })); }); });
  if (S.search) t(sid + ': c’è almeno un numero da cercare', ids.some(function (i) { return (C[i].calc || []).length; }));
});

// --- regole del motore sull'avventura Abisso ---
var g = E.newGame(seats(2), { scen: 'abisso' }, T0), now = T0;
function A(a, p) { now += 1000; return E.act(g, p || 0, a, now); }
t('non si scopre un numero che non si vede', A({ a: 'reveal', id: '26' }) !== null && !E.seen(g, '26'));
t('si scopre la A dalla carta iniziale', A({ a: 'reveal', id: 'A' }) === null && E.onTable(g, 'A'));
t('numero nascosto nella stanza', E.visible(g, '3') && A({ a: 'reveal', id: '3' }) === null);
t('scoprire due volte non fa niente', A({ a: 'reveal', id: 'A' }) === null && g.order.filter(function (i) { return i === 'A'; }).length === 1);
A({ a: 'reveal', id: '15' }); A({ a: 'reveal', id: '26' }); A({ a: 'reveal', id: '33' }); A({ a: 'reveal', id: '7' });
t('si uniscono solo rossa e blu', A({ a: 'combine', r: '26', b: '33' }) !== null && g.pen === 0);
var fx0 = g.fxN;
t('unione giusta: esce la 59 e la porta è scartata', A({ a: 'combine', r: '33', b: '26' }) === null && E.onTable(g, '59') && g.st['33'] === 'gone' && E.onTable(g, '26'));
t('effetti per i telefoni: unione e carta', g.fx.slice(-2).map(function (e) { return e.k; }).join() === 'combo,reveal' && g.fxN === fx0 + 2);
t('unione a vuoto: −1 minuto', A({ a: 'combine', r: '15', b: '26' }) === null && g.pen === 60 && g.fx[g.fx.length - 1].k === 'miss');
t('codice di 4 cifre', A({ a: 'code', id: '7', v: '12' }) !== null);
t('codice sbagliato: −2 minuti', A({ a: 'code', id: '7', v: '1234' }) === null && g.pen === 180 && !E.seen(g, '40'));
t('codice giusto: si apre l’armadietto', A({ a: 'code', id: '7', v: '3142' }) === null && E.onTable(g, '40') && g.st['7'] === 'gone');
A({ a: 'reveal', id: '36' });
t('trappola: piede di porco sulla porta del laboratorio? la porta è già scartata', A({ a: 'combine', r: '33', b: '36' }) !== null);
A({ a: 'reveal', id: 'B' }); A({ a: 'reveal', id: '50' });
var pen0 = g.pen;
t('trappola: piede di porco sulla vasca = carta penalità −3', A({ a: 'combine', r: '50', b: '36' }) === null && g.pen === pen0 + 180 && g.st['86'] === 'gone' && g.fx[g.fx.length - 1].k === 'pen');
t('macchina senza corrente: errore senza penalità', (function () { g.st['16'] = 'table'; g.order.push('16'); var e = A({ a: 'machine', id: '16', v: '352' }); return e && /corrente/.test(e) && g.pen === pen0 + 180; })());
g.st['39'] = 'table'; g.order.push('39');
t('macchina sbagliata: −1 minuto', A({ a: 'machine', id: '16', v: '111' }) === null && g.pen === pen0 + 240);
t('macchina giusta: generatore e modificatore +20', A({ a: 'machine', id: '16', v: '352' }) === null && E.onTable(g, '77') && E.mods(g)[0].v === 20);
g.st['31'] = 'table'; g.order.push('31');
t('modificatore +20 sulla porta della capsula = 51', A({ a: 'combine', r: '31', b: '+20' }) === null && E.onTable(g, '51'));
t('modificatore che non c’è', A({ a: 'combine', r: '15', b: '+7' }) !== null);
t('Morse: punti e linee normalizzati', E.norm('– ·–·· ···') === E.norm('- .-.. ...'));
t('indizio 2 solo dopo l’1', A({ a: 'hint', id: '15', lvl: 2 }) !== null && A({ a: 'hint', id: '15', lvl: 1 }) === null && A({ a: 'hint', id: '15', lvl: 2 }) === null && g.hintN === 2);
t('stesso indizio non conta due volte', A({ a: 'hint', id: '15', lvl: 1 }) === null && g.hintN === 2);
// tempo
var el = E.elapsed(g, now);
A({ a: 'pause', on: true }); var el2 = E.elapsed(g, now + 60000);
t('in pausa il tempo si ferma', el2 === E.elapsed(g, now) && el2 >= el);
A({ a: 'pause', on: false });
t('il tempo riparte', E.elapsed(g, now + 5000) === E.elapsed(g, now) + 5000);
t('tempo rimasto meno le penalità', E.remaining(g, now) === 3600000 - E.elapsed(g, now) - g.pen * 1000);
t('guardare una carta: niente effetti', (function () { var n = g.fxN; return A({ a: 'look', id: '15' }, 1) === null && g.look[1] === '15' && g.fxN === n && A({ a: 'look', id: '15' }, 1) === 'same'; })());
// stelle
function st(el, pen, h) { return E.stars({ limit: 3600, el: el * 60e3, pen: pen * 60, hintN: h }); }
t('stelle: veloce e senza indizi 5', st(30, 0, 0) === 5);
t('stelle: meno di 10 minuti rimasti 4', st(52, 0, 0) === 4 && st(45, 6, 0) === 4);
t('stelle: indizi tolgono stelle', st(30, 0, 3) === 4 && st(30, 0, 6) === 3 && st(55, 0, 9) === 2);
// a tempo scaduto si perde e si ricomincia da capo
var g2 = E.newGame(seats(1), { scen: 'soffitta' }, T0);
t('tutorial da 10 minuti', g2.limit === 600);
t('prima dello zero si gioca', E.act(g2, 0, { a: 'reveal', id: 'A' }, T0 + 500000) === null && g2.phase === 'play');
t('allo zero l’host chiude l’avventura: persa', E.expire(g2, T0 + 600001) && g2.phase === 'over' && g2.lost && !g2.won && g2.fx[g2.fx.length - 1].k === 'timeout');
t('dopo la fine niente azioni', E.act(g2, 0, { a: 'reveal', id: '11' }, T0 + 800000) !== null);
var g3 = E.newGame(seats(1), { scen: 'soffitta' }, T0);
t('un’azione dopo lo zero non passa e chiude l’avventura', E.act(g3, 0, { a: 'reveal', id: 'A' }, T0 + 610000) !== null && g3.lost);
var g4 = E.newGame(seats(1), { scen: 'soffitta' }, T0); E.act(g4, 0, { a: 'reveal', id: 'A' }, T0 + 1000); E.act(g4, 0, { a: 'reveal', id: '11' }, T0 + 2000); E.act(g4, 0, { a: 'reveal', id: '4' }, T0 + 3000); E.act(g4, 0, { a: 'reveal', id: '23' }, T0 + 4000);
t('una penalità che porta a zero fa perdere subito', E.act(g4, 0, { a: 'combine', r: '23', b: '4' }, T0 + 9 * 60e3 + 30000) === null && g4.lost);
t('in pausa il tempo non scade', (function () { var x = E.newGame(seats(1), { scen: 'soffitta' }, T0); E.act(x, 0, { a: 'pause', on: true }, T0 + 1000); return !E.expire(x, T0 + 3600e3) && x.phase === 'play'; })());
t('ogni partita ha il suo numero (per ripartire da capo)', E.newGame(seats(1), { scen: 'soffitta' }, T0).id !== E.newGame(seats(1), { scen: 'soffitta' }, T0).id);

// avventure difficili: costi più alti, numeri da cercare, indizi contati
var tr = E.newGame(seats(2), { scen: 'treno' }, T0), nt = T0;
function TA(a) { nt += 1000; return E.act(tr, 0, a, nt); }
t('treno: livello 3, indizi contati (2)', SC.S.treno.level === 3 && SC.S.treno.hintMax === 2 && E.hintsLeft(tr) === 2);
t('tomba: livello 4, un solo indizio', SC.S.tomba.level === 4 && SC.S.tomba.hintMax === 1 && E.hintsLeft(E.newGame(seats(1), { scen: 'tomba' }, T0)) === 1);
t('le avventure facili non hanno limite di indizi', E.hintsLeft(g) === null);
TA({ a: 'reveal', id: 'A' }); TA({ a: 'reveal', id: '21' });
t('cerca: un numero visibile esce', TA({ a: 'search', id: '7' }) === null && E.onTable(tr, '7'));
var p0 = tr.pen;
t('cerca: la cabina senza il biglietto non si trova (−2 min)', TA({ a: 'search', id: '68' }) === null && !E.seen(tr, '68') && tr.pen === p0 + 120 && tr.tries.search === 1);
TA({ a: 'reveal', id: '5' }); p0 = tr.pen;
t('cerca: una cabina sbagliata costa tempo', TA({ a: 'search', id: '66' }) === null && tr.pen === p0 + 120);
t('cerca: con il biglietto la cabina 68 esce', TA({ a: 'search', id: '68' }) === null && E.onTable(tr, '68'));
t('cerca: numero non valido', TA({ a: 'search', id: 'abc' }) !== null && TA({ a: 'search', id: '120' }) !== null);
p0 = tr.pen;
TA({ a: 'reveal', id: '12' }); TA({ a: 'reveal', id: '4' }); p0 = tr.pen;
t('treno: carta penalità −2 min', TA({ a: 'combine', r: '12', b: '4' }) === null && tr.st['16'] === 'gone' && tr.pen === p0 + 120);
TA({ a: 'reveal', id: '23' }); p0 = tr.pen; t('treno: unione a vuoto −1 min', TA({ a: 'combine', r: '23', b: '7' }) === null && tr.pen === p0 + 60);
p0 = tr.pen; TA({ a: 'reveal', id: '43' });
t('treno: codice sbagliato −3 min', TA({ a: 'code', id: '43', v: '8162' }) === null && tr.pen === p0 + 180);
p0 = tr.pen;
t('treno: un indizio costa 1 minuto', TA({ a: 'hint', id: '43', lvl: 1 }) === null && tr.pen === p0 + 60 && E.hintsLeft(tr) === 1);
t('treno: la soluzione costa 2 minuti e consuma il secondo indizio', TA({ a: 'hint', id: '43', lvl: 2 }) === null && tr.pen === p0 + 180 && E.hintsLeft(tr) === 0);
t('treno: indizi finiti, niente più indizi', TA({ a: 'hint', id: '21', lvl: 1 }) !== null && !tr.hints['21'] && E.hintsLeft(tr) === 0);
var tb = E.newGame(seats(1), { scen: 'tomba' }, T0); E.act(tb, 0, { a: 'reveal', id: 'A' }, T0 + 1000);
t('tomba: il primo indizio costa 2 minuti', E.act(tb, 0, { a: 'hint', id: 'A', lvl: 1 }, T0 + 2000) === null && tb.pen === 120);
t('tomba: dopo un indizio, basta', E.act(tb, 0, { a: 'hint', id: 'A', lvl: 2 }, T0 + 3000) !== null && tb.pen === 120 && tb.hints.A === 1);

console.log('Unlock: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
