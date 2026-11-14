// gioco: forziere
// Prove delle regole del Forziere Maledetto (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/forziere/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function idOf(type, k) { var n = 0; for (var i = 0; i < E.CARDS.length; i++) if (E.CARDS[i].t === type && n++ === (k || 0)) return i; return -1; }
function cnt(g) { return g.deck.length + g.disc.length + g.players.reduce(function (s, P) { return s + P.hand.length + P.eq.length; }, 0); }
// mette in mano a p le carte indicate, togliendole da dove sono
function give(g, p, ids) {
  ids.forEach(function (id) {
    [g.deck, g.disc].forEach(function (a) { var i = a.indexOf(id); if (i >= 0) a.splice(i, 1); });
    g.players.forEach(function (P) { [P.hand, P.eq].forEach(function (a) { var i = a.indexOf(id); if (i >= 0) a.splice(i, 1); }); });
    g.players[p].hand.push(id);
  });
}
function clearHand(g, p) { var P = g.players[p]; while (P.hand.length) g.disc.push(P.hand.pop()); }
function caps(g, list) { list.forEach(function (c, p) { var i = E.CAPS.map(function (x) { return x.a; }).indexOf(c); g.players[p].cap = i; }); }
// partita a n giocatori con ruoli fissi; tocca a chi ha il primo ruolo, già pronto a giocare
function game(n, roles, o) {
  var g = E.newGame(seats(n), {});
  g.players.forEach(function (P, i) { P.role = roles[i]; P.up = roles[i] === 'AL'; P.seen = {}; P.cap = 2 + i; P.ship = i; P.bar = E.SHIPS[i].b; P.eq.forEach(function (id) { g.disc.push(id); }); P.eq = []; });
  caps(g, (o && o.caps) || g.players.map(function () { return 'ugo'; }));
  g.players.forEach(function (P) { clearHand(g, g.players.indexOf(P)); });
  g.turn = 0; g.step = 'play'; g.shots = 0; g.pend = null; g.spectre = null; g.gorgo = null; g.chest = 0;
  return g;
}
function playOn(g, p, type, to, k, extra) { var id = idOf(type, k || 0); give(g, p, [id]); var a = { a: 'play', id: id, t: to }; for (var x in extra || {}) a[x] = extra[x]; return E.act(g, p, a); }

// --- carte, navi, capitani, ruoli ---
t('72 carte', E.CARDS.length === 72);
t('simboli: metà Ancora, un quarto Timone, un ottavo Teschio e Perla', ['A', 'T', 'X', 'P'].map(function (s) { return E.CARDS.filter(function (c) { return c.s === s; }).length; }).join() === '36,18,9,9');
t('14 navi e 12 capitani con la loro nave', E.SHIPS.length === 14 && E.CAPS.length === 12 && E.CAPS.every(function (c) { return E.SHIPS[c.s]; }));
t('ruoli per numero di giocatori', E.SETUP[4].r.join() === 'AL,AP,CL,CP' && E.SETUP[5].r.indexOf('PI') >= 0 && E.SETUP[7].r.filter(function (r) { return r === 'UL'; }).length === 2 && E.SETUP[8].r.length === 8);
t('dobloni nella Clessidra 7-7-8-9-10 e bandiere a 5 o 6', [4, 5, 6, 7, 8].map(function (n) { return E.SETUP[n].glass + '/' + E.SETUP[n].flag; }).join() === '7/5,7/5,8/6,9/6,10/6');

// --- preparazione ---
var g0 = E.newGame(seats(6), {}), al = g0.players.map(function (P) { return P.role; }).indexOf('AL');
t('l’Ammiraglio di Levante si scopre e comincia', g0.players[al].up && g0.turn === al && g0.players.filter(function (P) { return P.up; }).length === 1);
t('ognuno ha la nave del suo capitano e i suoi barili', g0.players.every(function (P) { return P.ship === E.CAPS[P.cap].s && P.bar === E.SHIPS[P.ship].b; }));
t('mano iniziale: 4 carte, 5 dal sesto giocatore (più le 2 pescate da chi comincia)', g0.players.map(function (P, i) { var k = (i - al + 6) % 6; return P.hand.length - (i === al ? 2 : 0) === (k >= 5 ? 5 : 4); }).every(Boolean), g0.players.map(function (P) { return P.hand.length; }));
t('3 navi in porto, le altre nel mazzo delle navi', g0.row.length === 3 && g0.row.length + g0.ships.length + 6 === 14);
t('tutte le carte ci sono', cnt(g0) === 72);
t('il ruolo coperto vale un doblone', E.dbl({ dbl: 0, up: false }) === 1 && E.dbl({ dbl: 2, up: true }) === 2);

// --- distanze e gittata ---
var d = game(6, ['AL', 'AP', 'UL', 'UP', 'CL', 'CP']);
t('distanza: il giro più corto', E.distance(d, 0, 1) === 1 && E.distance(d, 0, 3) === 3 && E.distance(d, 0, 5) === 1);
d.players[1].ship = null; d.players[2].ship = null;
t('chi non ha la nave non conta', E.distance(d, 0, 3) === 1 && E.distance(d, 0, 4) === 2);
var d2 = game(6, ['AL', 'AP', 'UL', 'UP', 'CL', 'CP']); give(d2, 1, [idOf('nebbia')]); d2.players[1].hand.pop(); d2.players[1].eq.push(idOf('nebbia'));
t('il Banco di nebbia allontana di 1', E.distance(d2, 0, 1) === 2 && E.distance(d2, 1, 0) === 1);
var d3 = game(6, ['AL', 'AP', 'UL', 'UP', 'CL', 'CP']); d3.players[0].ship = 4;   // Albatros, gittata 3
t('gittata della nave', E.range(d3, 0, 3) === 3);
caps(d3, ['sveva']); t('Sveva vede tutti a −1', E.distance(d3, 0, 3) === 2 && E.distance(d3, 0, 1) === 1);

// --- colpi e difese ---
var a = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); a.players[0].ship = 0;   // Rondine: gittata 2, munizioni 1
t('fuori dal turno non si gioca', playOn(a, 1, 'bordata', 0) !== null);
t('fuori gittata no', playOn(a, 0, 'bordata', 2, 1) === null ? false : true);
var bar1 = a.players[1].bar;
t('Bordata a distanza 1, senza difese: perde 1 barile', playOn(a, 0, 'bordata', 1, 2) === null && a.players[1].bar === bar1 - 1 && !a.pend);
t('munizioni finite', playOn(a, 0, 'bordata', 4, 3) !== null);
var b = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(b, 1, [idOf('virata')]);
t('con una Virata in mano si aspetta la risposta', playOn(b, 0, 'bordata', 1) === null && b.pend && b.pend.who === 1 && E.decider(b) === 1);
t('nessun’altra mossa finché non risponde', E.act(b, 0, { a: 'end' }) !== null);
var bb = b.players[1].bar;
t('la Virata evita il colpo', E.act(b, 1, { a: 'resp', id: idOf('virata') }) === null && b.players[1].bar === bb && !b.pend && E.decider(b) === 0);
var c = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(c, 1, [idOf('virata')]); playOn(c, 0, 'bordata', 1);
t('oppure subisce', E.act(c, 1, { a: 'take' }) === null && c.players[1].bar === E.SHIPS[1].b - 1);
var o = game(5, ['AL', 'AP', 'UP', 'UL', 'PI'], { caps: ['oscar'] }); give(o, 1, [idOf('virata'), idOf('virata', 1)]); playOn(o, 0, 'bordata', 1);
E.act(o, 1, { a: 'resp', id: idOf('virata') });
t('contro Oscar servono 2 Virate', o.pend && o.pend.who === 1 && E.act(o, 1, { a: 'resp', id: idOf('virata', 1) }) === null && !o.pend && o.players[1].bar === E.SHIPS[1].b);
var w = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(w, 1, [idOf('bianca')]); var bw = w.players[1].bar;
t('la Bandiera bianca annulla anche un colpo', playOn(w, 0, 'bordata', 1) === null && E.act(w, 1, { a: 'resp', id: idOf('bianca') }) === null && w.players[1].bar === bw);
var cn = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); cn.players[0].eq.push(idOf('cannoniera')); var bc = cn.players[1].bar;
t('la Cannoniera toglie un barile in più', playOn(cn, 0, 'bordata', 1) === null && cn.players[1].bar === bc - 2);
var mi = game(5, ['AL', 'AP', 'UP', 'UL', 'PI'], { caps: ['ugo', 'mira'] }); mi.players[0].eq.push(idOf('cannoniera')); var bm = mi.players[1].bar;
t('contro Mira gli equipaggiamenti degli altri non valgono', playOn(mi, 0, 'bordata', 1) === null && mi.players[1].bar === bm - 1);
var li = game(5, ['AL', 'AP', 'UP', 'UL', 'PI'], { caps: ['lia', 'lia'] }); give(li, 1, [idOf('bordata', 5)]);
t('Lia si difende con una Bordata', playOn(li, 0, 'bordata', 1) === null && E.answers(li, 1).indexOf(idOf('bordata', 5)) >= 0);
var li2 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI'], { caps: ['lia'] }); var bl = li2.players[1].bar;
t('Lia attacca con una Virata', playOn(li2, 0, 'virata', 1, 0, { as: 'atk' }) === null && li2.players[1].bar === bl - 1);
t('una Virata normale non si gioca nel proprio turno', playOn(game(5, ['AL', 'AP', 'UP', 'UL', 'PI']), 0, 'virata', 1) !== null);
var ms = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); ms.players[0].ship = 4;   // gittata 3
t('il Moschetto arriva solo a distanza 1', playOn(ms, 0, 'moschetto', 2) !== null && playOn(ms, 0, 'moschetto', 1, 1) === null);
var ar = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(ar, 1, [idOf('rum'), idOf('vedetta')]); var h0 = ar.players[0].hand.length;
t('Arrembaggio: se va a segno prende una carta', playOn(ar, 0, 'arrembaggio', 1) === null && ar.players[0].hand.length === h0 + 1 && ar.players[1].hand.length === 1);
var pc = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); pc.players[1].eq.push(idOf('coffa'));
t('Palle incatenate: il bersaglio perde un equipaggiamento', playOn(pc, 0, 'incatenate', 1, 0, { pick: idOf('coffa') }) === null && pc.players[1].eq.length === 0 && pc.disc.indexOf(idOf('coffa')) >= 0);
var pl = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); pl.players[1].eq.push(idOf('polena')); var anc = E.CARDS.map(function (x, i) { return i; }).filter(function (i) { return E.CARDS[i].s === 'A' && E.CARDS[i].t === 'rum'; })[0];
pl.deck.splice(pl.deck.indexOf(anc), 1); pl.deck.push(anc); var bp = pl.players[1].bar;
t('la Polena con l’Ancora fa andare il colpo a vuoto', playOn(pl, 0, 'bordata', 1) === null && pl.players[1].bar === bp);

// --- carte azione ---
var r = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); r.players[0].bar = 1;
t('Rum: +1 barile (Ugo +2)', playOn(r, 0, 'rum') === null && r.players[0].bar === 3);
var r2 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI'], { caps: ['nina'] });
t('Rum a scafo pieno no', playOn(r2, 0, 'rum') !== null);
var rf = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); var full = rf.players[2].bar;
t('Rifornimento anche oltre il massimo', playOn(rf, 0, 'rifornimento', 2) === null && rf.players[2].bar === full + 1);
var vd = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); var hv = vd.players[0].hand.length;
t('Vedetta: 2 carte', playOn(vd, 0, 'vedetta') === null && vd.players[0].hand.length === hv + 2);
var bu = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); var bs = bu.players.map(function (P) { return P.bar; });
t('Burrasca: tutte le altre navi perdono un barile', playOn(bu, 0, 'burrasca') === null && bu.players.every(function (P, i) { return P.bar === bs[i] - (i ? 1 : 0); }));
var mo = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(mo, 2, [idOf('bordata', 7)]); var bmo = mo.players.map(function (P) { return P.bar; });
playOn(mo, 0, 'mostro');
t('Mostro: chi ha una Bordata può scartarla', mo.pend && mo.pend.who === 2 && E.act(mo, 2, { a: 'resp', id: idOf('bordata', 7) }) === null && mo.players[2].bar === bmo[2] && mo.players[1].bar === bmo[1] - 1 && mo.players[3].bar === bmo[3] - 1);
var sf = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(sf, 0, [idOf('bordata', 8)]); give(sf, 3, [idOf('bordata', 9)]); var b0 = sf.players[0].bar, b3 = sf.players[3].bar;
playOn(sf, 0, 'sfida', 3);
t('Sfida: si risponde a turno', sf.pend && sf.pend.k === 'duel' && sf.pend.who === 3 && E.act(sf, 3, { a: 'resp', id: idOf('bordata', 9) }) === null && sf.pend.who === 0);
t('…chi non ha più Bordate perde un barile', E.act(sf, 0, { a: 'resp', id: idOf('bordata', 8) }) === null && !sf.pend && sf.players[3].bar === b3 - 1 && sf.players[0].bar === b0);
var sa = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); sa.players[2].eq.push(idOf('cassa'));
t('Sabotaggio su un equipaggiamento', playOn(sa, 0, 'sabotaggio', 2, 0, { pick: idOf('cassa') }) === null && sa.players[2].eq.length === 0);
var sc = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(sc, 1, [idOf('rum', 1)]);
t('Saccheggio solo a distanza 1', playOn(sc, 0, 'saccheggio', 2) !== null && playOn(sc, 0, 'saccheggio', 1, 1, { pick: 'hand' }) === null && sc.players[0].hand.indexOf(idOf('rum', 1)) >= 0);
var le = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']);
t('Lettera intercettata: il ruolo lo vede solo chi la gioca', playOn(le, 0, 'lettera', 4) === null && E.seenRole(le, 0, 4) === 'PI' && E.seenRole(le, 1, 4) === null);
var eq = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']);
t('Equipaggiamento: davanti a sé, mai due uguali', playOn(eq, 0, 'coffa') === null && eq.players[0].eq.length === 1 && playOn(eq, 0, 'coffa', null, 1) !== null);
var ca = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); ca.players[0].eq.push(idOf('cassa'));
t('Cassa di munizioni: un attacco in più', E.ammo(ca, 0) === E.SHIPS[0].m + 1);

// --- affondamenti, Forziere, dobloni ---
var s1 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); s1.players[0].ship = 4; s1.players[2].bar = 1; var glass = s1.glass;   // UP con la Albatros, gittata 3
playOn(s1, 0, 'bordata', 2);
t('affonda: ruolo scoperto, Forziere verso la bandiera avversaria', s1.players[2].ship == null && s1.players[2].up && s1.chest === -E.SHIPS[2].f);
t('chi affonda prende un doblone dalla Clessidra', s1.players[0].dbl === 1 && s1.glass === glass - 1);
t('la nave torna sotto il mazzo delle navi', s1.ships[s1.ships.length - 1] === 2);
t('senza nave non si è bersaglio', (E.targets(s1, 0, idOf('bordata', 3)) || []).indexOf(2) < 0);
var s2 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); s2.players[1].bar = 1;
playOn(s2, 0, 'bordata', 1);
t('affonda un Ammiraglio: un passo in più', s2.chest === -(E.SHIPS[1].f + 1));
var s3 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); s3.players[4].bar = 1; s3.turn = 3; s3.players[3].ship = 4;   // l'Ufficiale di Levante affonda il Pirata
playOn(s3, 3, 'bordata', 4);
t('affonda il Pirata: il Forziere va verso la bandiera di chi l’ha affondato', s3.chest === -E.SHIPS[4].f);
var s4 = game(7, ['AL', 'AP', 'UP', 'UL', 'UP', 'UL', 'PI']); s4.players[3].up = true; s4.players[0].bar = 1; s4.turn = 1; s4.players[1].ship = 4;
s4.players[1].ship = 10;
playOn(s4, 1, 'bordata', 0);
t('promozione: l’Ammiraglio affondato scambia il ruolo con il primo Ufficiale scoperto', s4.players[0].role === 'UL' && s4.players[3].role === 'AL');
var s5 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); s5.chest = -4; s5.players[2].bar = 1; s5.players[0].ship = 4;
playOn(s5, 0, 'bordata', 2);
t('il Forziere sulla bandiera dopo un affondamento: vince la flotta', s5.phase === 'over' && s5.final.team === 'L' && s5.winners.join() === '0,3');
var s6 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); s6.players[4].dbl = 2; s6.turn = 4; s6.players[4].ship = 4; s6.players[1].bar = 1;
playOn(s6, 4, 'bordata', 1);
t('il Pirata con 4 dobloni (ruolo coperto compreso) vince subito', s6.phase === 'over' && s6.final.how === 'rich' && s6.winners.join() === '4');
var s7 = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); s7.players[0].bar = 1; s7.players[0].hand = []; give(s7, 0, [idOf('sfida')]); give(s7, 1, [idOf('bordata', 10)]); s7.players[0].hand.splice(s7.players[0].hand.indexOf(idOf('sfida')), 1);
give(s7, 0, [idOf('sfida')]); E.act(s7, 0, { a: 'play', id: idOf('sfida'), t: 1 }); E.act(s7, 1, { a: 'resp', id: idOf('bordata', 10) });
t('chi affonda nel suo turno finisce il turno', s7.players[0].ship == null && s7.turn === 1);

// --- turno ---
var tn = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); for (var i = 0; i < 7; i++) give(tn, 0, [idOf('bordata', 11 + i)]);
t('più di 5 carte: bisogna scartare', E.act(tn, 0, { a: 'end' }) !== null && E.act(tn, 0, { a: 'end', drop: [idOf('bordata', 11), idOf('bordata', 12)] }) === null && tn.players[0].hand.length === 5 && tn.turn === 1);
t('il giocatore dopo pesca 2 carte', tn.players[1].hand.length === 2 && tn.step === 'play');
var sh = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); sh.players[1].ship = null; sh.players[1].bar = 0; E.act(sh, 0, { a: 'end' });
t('senza nave: prima si prende una nave', sh.turn === 1 && sh.step === 'ship' && E.act(sh, 1, { a: 'play', id: 0 }) !== null);
var row0 = sh.row[0];
t('…dal porto, con i suoi barili', E.act(sh, 1, { a: 'ship', i: 0 }) === null && sh.players[1].ship === row0 && sh.players[1].bar === E.SHIPS[row0].b && sh.row.length === 3 && sh.step === 'play');
var ad = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); give(ad, 1, [idOf('rum', 2)]); ad.players[1].eq = []; var stolen = idOf('rum', 2);
playOn(ad, 0, 'saccheggio', 1, 2, { pick: 'hand' });
t('alla deriva: chi resta senza carte fuori turno ne pesca una', ad.players[1].hand.length === 1 && ad.players[0].hand.indexOf(stolen) >= 0);
var de = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); var fl = de.flag, gl = de.glass; de.disc = de.disc.concat(de.deck); de.deck = [];
E.act(de, 0, { a: 'end' });
t('mazzo finito: un doblone in meno, bandiere più vicine, scarti rimescolati', de.glass === gl - 1 && de.flag === fl - 1 && de.deck.length > 0);

// --- vascello spettrale e Gorgo ---
var gh = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); playOn(gh, 0, 'spettro', 1);
t('il Vascello spettrale si posa su una nave', gh.spectre && gh.spectre.on === 1);
var sym = 'X', top = E.CARDS.map(function (x, i) { return i; }).filter(function (i) { return E.CARDS[i].s === sym && gh.deck.indexOf(i) >= 0; })[0];
gh.deck.splice(gh.deck.indexOf(top), 1); gh.deck.push(top);
var mt = E.CARDS.map(function (x, i) { return i; }).filter(function (i) { return E.CARDS[i].s === sym && i !== top && gh.players[0].hand.indexOf(i) < 0; })[0]; give(gh, 1, [mt]);
give(gh, 0, [E.CARDS.map(function (x, i) { return i; }).filter(function (i) { return E.CARDS[i].s === 'A' && gh.deck.indexOf(i) >= 0 && gh.deck.indexOf(i) < gh.deck.length - 3; })[0]]);
E.act(gh, 0, { a: 'end' });
t('all’inizio del turno si scopre una carta e si può rispondere', gh.turn === 1 && gh.step === 'spectre' && gh.spectreRev === top);
var hb = gh.players[1].bar;
t('chi risponde lo passa alla nave successiva', E.act(gh, 1, { a: 'answer', id: mt }) === null && gh.spectre.on === 2 && gh.players[1].bar === hb && gh.players[1].hand.indexOf(mt) >= 0 && gh.step === 'play');
var gf = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); gf.spectre = { on: 1 }; var hf = gf.players[1].bar; E.act(gf, 0, { a: 'end' });
if (gf.step === 'spectre') E.act(gf, 1, { a: 'answer' });
t('chi non risponde perde 2 barili e il vascello sparisce', gf.players[1].bar === hf - 2 && !gf.spectre && gf.step === 'play');
var go = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); go.glass = 1; go.players[2].bar = 1; go.players[0].ship = 4;
playOn(go, 0, 'bordata', 2);
t('Clessidra vuota: arriva il Gorgo dal giocatore dopo', go.glass === 0 && go.gorgo && go.gorgo.at === 1 && !go.spectre);
var gz = game(5, ['AL', 'AP', 'UP', 'UL', 'PI']); gz.gorgo = { at: 1 }; gz.chest = 0; clearHand(gz, 1); E.act(gz, 0, { a: 'end' });
t('chi non sa rispondere al Gorgo fa finire la partita: Forziere al centro, vince il Pirata', gz.phase === 'over' && gz.final.how === 'gorgo' && gz.winners.join() === '4');
function gorgoEnd(n, roles, chest, set) { var g = game(n, roles); g.gorgo = { at: 1 }; g.chest = chest; (set || function () {})(g); clearHand(g, 1); E.act(g, 0, { a: 'end' }); return g; }
t('Gorgo: 2 passi verso Ponente, vince Ponente', gorgoEnd(5, ['AL', 'AP', 'UP', 'UL', 'PI'], 2).final.team === 'P');
t('Gorgo: 1 passo verso Levante e il Pirata più ricco del più povero di Levante: vince il Pirata', gorgoEnd(5, ['AL', 'AP', 'UP', 'UL', 'PI'], -1, function (g) { g.players[4].dbl = 2; g.players[0].dbl = 1; }).winners.join() === '4');
t('…altrimenti vince Levante', gorgoEnd(5, ['AL', 'AP', 'UP', 'UL', 'PI'], -1, function (g) { g.players[4].dbl = 0; g.players[3].dbl = 3; g.players[0].dbl = 2; }).final.team === 'L');
t('Corsari al centro: vince il più ricco, a parità quello di Levante', gorgoEnd(4, ['AL', 'AP', 'CL', 'CP'], 0, function (g) { g.players[3].dbl = 2; }).winners.join() === '3' && gorgoEnd(4, ['AL', 'AP', 'CL', 'CP'], 0).winners.join() === '2');

// --- partite intere tra giocatori automatici ---
var ends = {}, bad = 0, turns = [];
for (var k = 0; k < 150; k++) {
  var n = 4 + (k % 5), sts = seats(n).map(function (s) { s.bot = true; return s; }), g = E.newGame(sts, {}), it = 0;
  while (g.phase === 'play' && it < 4000) {
    var dd = E.decider(g); if (dd == null) { bad++; break; }
    var mv = B.decide(g, dd); if (!mv) { bad++; break; }
    var err = E.act(g, dd, mv); if (err) { bad++; if (bad < 4) console.log('mossa del bot rifiutata', err, JSON.stringify(mv)); break; }
    if (cnt(g) !== 72) { bad++; console.log('carte perse'); break; }
    it++;
  }
  if (g.phase !== 'over') { bad++; continue; }
  turns.push(g.turnN); ends[g.final.how] = (ends[g.final.how] || 0) + 1;
}
t('150 partite tra bot finiscono tutte senza errori', bad === 0, bad);
t('si vince in tutti i modi (ricchezza, bandiera, Gorgo)', ends.rich > 0 && (ends.flagL + ends.flagP) > 0 && ends.gorgo > 0, JSON.stringify(ends));
turns.sort(function (x, y) { return x - y; });
t('una partita dura tra 10 e 80 turni', turns[turns.length >> 1] >= 10 && turns[turns.length >> 1] <= 80, turns[turns.length >> 1]);

console.log((ko ? 'FALLITE ' + ko + ' su ' : 'tutte ok: ') + (ok + ko) + ' prove');
process.exit(ko ? 1 : 0);
