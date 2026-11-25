// gioco: tressette
// Prove delle regole del Tressette (a vincere e a perdere, una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/tressette/');
var E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i }); return a; }
function C(r, s) { return s * 10 + r - 1; }   // carta: valore (1-10) e seme (0 coppe, 1 denari, 2 spade, 3 bastoni)
function sum(a) { return a.reduce(function (x, y) { return x + y; }, 0); }

// valori e ordine
var all = []; for (var i = 0; i < 40; i++) all.push(E.thirds(i));
t('terzi: asso 3, tre, due e figure 1, il resto 0; 32 terzi nel mazzo', E.thirds(C(1, 0)) === 3 && E.thirds(C(3, 1)) === 1 && E.thirds(C(2, 2)) === 1 && E.thirds(C(10, 3)) === 1 && E.thirds(C(9, 0)) === 1 && E.thirds(C(8, 0)) === 1 && E.thirds(C(7, 0)) === 0 && E.thirds(C(4, 0)) === 0 && sum(all) === 32);
t('ordine: 3 > 2 > asso > re > cavallo > fante > 7 > 6 > 5 > 4', [3, 2, 1, 10, 9, 8, 7, 6, 5, 4].every(function (r, i, a) { return i === 0 || E.power(C(a[i - 1], 0)) > E.power(C(r, 0)); }));
t('i terzi si scrivono bene', E.fmtTh(7) === '2 e 1/3' && E.fmtTh(2) === '2/3' && E.fmtTh(9) === '3');
t('prende la più alta del seme d’uscita (niente briscola)', E.winner([{ p: 0, c: C(5, 0) }, { p: 1, c: C(3, 2) }, { p: 2, c: C(7, 0) }]) === 2);
t('il 3 batte l’asso', E.winner([{ p: 0, c: C(1, 1) }, { p: 1, c: C(3, 1) }]) === 1);

// a vincere in 4
var g = E.newGame(seats(4), {});
t('a vincere in 4: 10 carte a testa, niente tallone, in coppia', g.players.every(function (P) { return P.hand.length === 10; }) && g.deck.length === 0 && E.team(g, 2) === 0 && E.partner(g, 1) === 3 && g.opts.mode === 'vincere' && g.opts.target === 31);
var p0 = g.turn;
t('gioca solo chi è di turno', E.act(g, (p0 + 1) % 4, { a: 'play', c: g.players[(p0 + 1) % 4].hand[0] }) !== null);
t('una carta che non hai no', E.act(g, p0, { a: 'play', c: 99 }) !== null);
// mano controllata: obbligo di rispondere al seme
var h = E.newGame(seats(4), { accuse: false }); h.turn = h.lead = 0;
h.players[0].hand = [C(5, 0), C(1, 1)]; h.players[1].hand = [C(3, 0), C(2, 1)]; h.players[2].hand = [C(1, 0), C(4, 2)]; h.players[3].hand = [C(6, 1), C(7, 2)];
t('il segnale si fa solo aprendo', E.act(h, 0, { a: 'play', c: C(5, 0), s: 'boh' }) !== null);
E.act(h, 0, { a: 'play', c: C(5, 0), s: 'volo' });
t('aprendo si può dire «volo»: lo vedono tutti', h.trick[0].s === 'volo' && h.log.some(function (l) { return l.k === 'sig'; }));
t('chi ha il seme deve rispondere', E.act(h, 1, { a: 'play', c: C(2, 1) }) !== null && /rispondere a coppe/.test(E.act(h, 1, { a: 'play', c: C(2, 1) })));
E.act(h, 1, { a: 'play', c: C(3, 0) }); E.act(h, 2, { a: 'play', c: C(1, 0) });
t('dopo il primo non si fanno segnali', E.act(h, 3, { a: 'play', c: C(6, 1), s: 'busso' }) !== null);
t('chi non ha il seme gioca quello che vuole', E.act(h, 3, { a: 'play', c: C(6, 1) }) === null);
t('il 3 prende; asso e 3 valgono 4 terzi agli avversari', h.last.w === 1 && h.taken[1].length === 4 && E.sumTh(h.taken[1]) === 4 && h.turn === 1);
E.act(h, 1, { a: 'play', c: C(2, 1) }); E.act(h, 2, { a: 'play', c: C(4, 2) }); E.act(h, 3, { a: 'play', c: C(7, 2) }); E.act(h, 0, { a: 'play', c: C(1, 1) });
t('fine mano: si contano i terzi più l’ultima presa, gli avanzi non contano', h.phase === 'scores' && h.res.th.join() === '0,11' && h.res.pts.join() === '0,3' && h.totals.join() === '0,3');
E.act(h, 0, { a: 'next' }); E.act(h, 1, { a: 'next' }); E.act(h, 2, { a: 'next' }); E.act(h, 3, { a: 'next' });
t('si rimescola e si riparte, comincia il giocatore dopo', h.hand === 2 && h.phase === 'play' && h.players.every(function (P) { return P.hand.length === 10; }) && h.turn === (h.first + 1) % 4);
// accusi
var acc = E.accuseOf([C(1, 0), C(2, 0), C(3, 0), C(3, 1), C(3, 2), C(5, 3)]);
t('accusi: napoletana di coppe e tre 3', acc.length === 2 && acc[0].k === 'nap' && acc[0].pts === 3 && acc[1].k === 'buon' && acc[1].r === 3 && acc[1].pts === 3);
t('quattro assi valgono 4', E.accuseOf([C(1, 0), C(1, 1), C(1, 2), C(1, 3)])[0].pts === 4);
var a = E.newGame(seats(4), {}); a.turn = a.lead = 0; a.acc = { 0: [{ k: 'nap', s: 0, pts: 3 }] };
a.players[0].hand = [C(1, 0), C(2, 0), C(3, 0)].concat(a.players[0].hand.filter(function (c) { return [C(1, 0), C(2, 0), C(3, 0)].indexOf(c) < 0; }).slice(0, 7));
E.act(a, 0, { a: 'play', c: C(3, 0) });
t('l’accuso si dichiara con la prima carta e va alla coppia', a.accPts[0] === 3 && a.accDone[0] && a.log.some(function (l) { return l.k === 'acc' && /napoletana di coppe/.test(l.t); }));
var na = E.newGame(seats(4), { accuse: false });
t('senza accusi non si contano', na.opts.accuse === false && Object.keys(na.acc).length === 0);
// a vincere in 2: tallone e pesca scoperta
var two = E.newGame(seats(2), {});
t('a vincere in 2: 10 carte a testa e 20 nel tallone, niente segnali', two.players.every(function (P) { return P.hand.length === 10; }) && two.deck.length === 20 && !two.opts.signals);
var q = two.turn, top = two.deck.slice(0, 2);
E.act(two, q, { a: 'play', c: two.players[q].hand[0] }); E.act(two, 1 - q, { a: 'play', c: E.legal(two, 1 - q)[0] });
var w2 = two.last.w;
t('dopo la presa si pesca: prima chi ha preso, carte scoperte per tutti', two.deck.length === 18 && two.drawn.length === 2 && two.drawn[0].p === w2 && two.drawn[0].c === top[0] && two.players[w2].hand.indexOf(top[0]) >= 0 && two.players.every(function (P) { return P.hand.length === 10; }));
// fine della partita a vincere
var f = E.newGame(seats(2), { target: 11, accuse: false }); f.deck = []; f.turn = f.lead = 0; f.totals = [9, 4];
f.players[0].hand = [C(1, 0)]; f.players[1].hand = [C(5, 0)]; f.taken = [[C(1, 1), C(1, 2), C(2, 1)], []];
E.act(f, 0, { a: 'play', c: C(1, 0) }); E.act(f, 1, { a: 'play', c: C(5, 0) });
t('si vince arrivando ai punti stabiliti', f.phase === 'over' && f.winners.join() === '0' && f.totals[0] >= 11 && f.final.place.join() === '1,2');
var tie = E.newGame(seats(2), { target: 11, accuse: false }); tie.deck = []; tie.turn = tie.lead = 0; tie.totals = [10, 15];
tie.players[0].hand = [C(1, 0)]; tie.players[1].hand = [C(5, 0)]; tie.taken = [[C(1, 1), C(1, 2), C(1, 3)], []];
E.act(tie, 0, { a: 'play', c: C(1, 0) }); E.act(tie, 1, { a: 'play', c: C(5, 0) });
t('pari sopra la soglia: si gioca un’altra mano', tie.totals.join() === '15,15' && tie.phase === 'scores');

// a perdere
t('a perdere si gioca da 3 a 6, a vincere in 2 o in 4', E.okPlayers('perdere', 3) && E.okPlayers('perdere', 6) && !E.okPlayers('perdere', 2) && E.okPlayers('vincere', 2) && E.okPlayers('vincere', 4) && !E.okPlayers('vincere', 3));
[[3, 13, 1], [4, 10, 0], [5, 8, 0], [6, 6, 4]].forEach(function (x) {
  var pg = E.newGame(seats(x[0]), { mode: 'perdere' }), cnt = pg.players.reduce(function (s, P) { return s + P.hand.length; }, 0);
  t('a perdere in ' + x[0] + ': ' + x[1] + ' carte a testa, tolte ' + x[2] + ' carte da zero', pg.players.every(function (P) { return P.hand.length === x[1]; }) && cnt + pg.removed.length === 40 && pg.removed.length === x[2] && pg.removed.every(function (c) { return E.thirds(c) === 0; }) && pg.deck.length === 0);
});
var pp = E.newGame(seats(4), { mode: 'perdere', accuse: true, signals: true });
t('a perdere ognuno per sé, senza accusi né segnali', E.sides(pp) === 4 && E.team(pp, 2) === 2 && E.partner(pp, 0) === -1 && !pp.opts.accuse && !pp.opts.signals && pp.opts.cappotto && pp.totals.length === 4);
var pl = E.newGame(seats(3), { mode: 'perdere', target: 21 }); pl.turn = pl.lead = 0; pl.totals = [3, 20, 5];
pl.players[0].hand = [C(4, 0)]; pl.players[1].hand = [C(3, 0)]; pl.players[2].hand = [C(5, 0)]; pl.taken = [[], [C(1, 0), C(1, 1), C(2, 2)], []];
E.act(pl, 0, { a: 'play', c: C(4, 0) }); E.act(pl, 1, { a: 'play', c: C(3, 0) }); E.act(pl, 2, { a: 'play', c: C(5, 0) });
t('a perdere: chi arriva alla soglia chiude la partita, vince chi ha meno punti', pl.phase === 'over' && pl.totals[1] >= 21 && pl.winners.join() === '0' && pl.final.place.join() === '1,3,2');
var cp = E.newGame(seats(3), { mode: 'perdere', target: 41 }); cp.turn = cp.lead = 0;
var rest = []; for (i = 0; i < 40; i++) if ([C(4, 0), C(5, 0), C(6, 0), 33].indexOf(i) < 0) rest.push(i);
cp.players[0].hand = [C(4, 0)]; cp.players[1].hand = [C(5, 0)]; cp.players[2].hand = [C(6, 0)]; cp.taken = [[], [], rest];
E.act(cp, 0, { a: 'play', c: C(4, 0) }); E.act(cp, 1, { a: 'play', c: C(5, 0) }); E.act(cp, 2, { a: 'play', c: C(6, 0) });
t('cappotto: chi prende tutti i punti li regala agli altri', cp.res.cap === 2 && cp.res.pts.join() === '11,11,0' && cp.phase === 'scores');
var nc = E.newGame(seats(3), { mode: 'perdere', cappotto: false }); nc.turn = nc.lead = 0; nc.players[0].hand = [C(4, 0)]; nc.players[1].hand = [C(5, 0)]; nc.players[2].hand = [C(6, 0)]; nc.taken = [[], [], rest.slice()];
E.act(nc, 0, { a: 'play', c: C(4, 0) }); E.act(nc, 1, { a: 'play', c: C(5, 0) }); E.act(nc, 2, { a: 'play', c: C(6, 0) });
t('senza cappotto chi prende tutto si tiene gli 11 punti', nc.res.pts.join() === '0,0,11');
// asso di bastoni da 11 (opzione, solo a perdere)
var ab = E.newGame(seats(4), { mode: 'perdere', bastoni: true, target: 61 });
t('asso di bastoni da 11: solo a perdere, soglie fino a 61', ab.opts.bastoni && ab.opts.target === 61 && E.thirds(30, ab) === 33 && E.thirds(C(1, 0), ab) === 3 && E.thirds(30) === 3 && E.totalTh(ab) === 65 && E.handPts(ab) === 21 &&
  !E.newGame(seats(4), { bastoni: true }).opts.bastoni && E.newGame(seats(4), { target: 61 }).opts.target === 41 && !E.newGame(seats(4), { mode: 'perdere' }).opts.bastoni);
var abm = E.newGame(seats(3), { mode: 'perdere', bastoni: true }); abm.turn = abm.lead = 0; abm.totals = [0, 0, 0];
abm.players[0].hand = [C(3, 3)]; abm.players[1].hand = [C(1, 3)]; abm.players[2].hand = [C(5, 0)]; abm.taken = [[], [], []];
E.act(abm, 0, { a: 'play', c: C(3, 3) }); E.act(abm, 1, { a: 'play', c: C(1, 3) }); E.act(abm, 2, { a: 'play', c: C(5, 0) });
t('chi prende l’asso di bastoni segna 11 punti (+1 per l’ultima presa)', abm.res.th[0] === 37 && abm.res.pts.join() === '12,0,0');
var acp = E.newGame(seats(3), { mode: 'perdere', bastoni: true, target: 61 }); acp.turn = acp.lead = 0;
acp.players[0].hand = [C(4, 0)]; acp.players[1].hand = [C(5, 0)]; acp.players[2].hand = [C(6, 0)]; acp.taken = [[], [], rest.slice()];
E.act(acp, 0, { a: 'play', c: C(4, 0) }); E.act(acp, 1, { a: 'play', c: C(5, 0) }); E.act(acp, 2, { a: 'play', c: C(6, 0) });
t('con l’asso di bastoni da 11 il cappotto regala 21 punti', acp.res.cap === 2 && acp.res.pts.join() === '21,21,0' && /regala 21 punti/.test(acp.log[acp.log.length - 1].t));

// i giocatori automatici
var bm = E.newGame(seats(4), { mode: 'perdere' }); bm.turn = bm.lead = 0; bm.players[0].hand = [C(7, 0)]; bm.players[1].hand = [C(6, 0), C(3, 0), C(10, 0)]; bm.trick = [];
E.act(bm, 0, { a: 'play', c: C(7, 0) });
t('a perdere l’automatico sta sotto con la più alta che non prende', B.decide(bm, 1).c === C(6, 0));
bm.players[1].hand = [C(1, 2), C(4, 3)]; t('a perdere senza il seme scarica l’asso', B.decide(bm, 1).c === C(1, 2));
var bw = E.newGame(seats(4), { accuse: false }); bw.turn = bw.lead = 0; bw.players[0].hand = [C(3, 1), C(4, 2)]; bw.trick = [];
var bb = E.newGame(seats(4), { mode: 'perdere', bastoni: true }); bb.turn = bb.lead = 0; bb.players[0].hand = [C(2, 3)]; bb.players[1].hand = [C(1, 3), C(5, 3), C(4, 3)]; bb.trick = [];
E.act(bb, 0, { a: 'play', c: C(2, 3) });
t('asso di bastoni da 11: l’automatico lo scarica sotto al 2 di bastoni', B.decide(bb, 1).c === C(1, 3));
bb.players[1].hand = [C(1, 3), C(1, 2), C(4, 1)]; bb.trick = [{ p: 0, c: C(5, 0) }];
t('…e quando non ha il seme scarica quello prima degli altri assi', B.decide(bb, 1).c === C(1, 3));
t('a vincere l’automatico apre con il 3 (carta buona con punti)', B.decide(bw, 0).c === C(3, 1));

// ad eliminazione
function playOut(g) { var guard = 0; while (g.phase === 'play' && guard++ < 500) { var w = E.pending(g)[0], e = E.act(g, w, B.decide(g, w)); if (e) return e; } return null; }
t('l’eliminazione vale solo a perdere', E.newGame(seats(4), { mode: 'perdere', elim: true }).opts.elim === true && E.newGame(seats(4), { mode: 'vincere', elim: true }).opts.elim === false);
var e2 = E.newGame(seats(4), { mode: 'perdere', elim: true, target: 21 }); e2.totals = [30, 0, 0, 0]; playOut(e2);
t('in 4, chi arriva alla soglia esce e gli altri tre continuano', e2.phase === 'scores' && e2.players[0].outAt === 1 && E.alive(e2).join() === '1,2,3' && e2.players[0].ready && /è eliminato/.test(e2.log[e2.log.length - 1].t), e2.phase + ' ' + E.alive(e2));
E.forceNext(e2);
t('…la mano dopo si danno le carte solo ai tre rimasti (13 a testa, senza il 4 di bastoni)', e2.players[0].hand.length === 0 && [1, 2, 3].every(function (i) { return e2.players[i].hand.length === 13; }) && e2.removed.join() === '33' && e2.turn !== 0);
var t0 = e2.totals[0], turns = {}, g3 = 0; while (e2.phase === 'play' && g3++ < 500) { var w3 = E.pending(e2)[0]; turns[w3] = 1; E.act(e2, w3, B.decide(e2, w3)); }
t('…e l’eliminato non gioca più né prende punti', !turns[0] && e2.res.th[0] === 0 && e2.res.pts[0] === 0 && e2.totals[0] === t0);
var e3 = E.newGame(seats(3), { mode: 'perdere', elim: true, target: 21 }); e3.totals = [25, 0, 0]; playOut(e3); E.forceNext(e3);
t('in due rimasti: dieci carte a testa e venti nel tallone', E.alive(e3).length === 2 && e3.players[1].hand.length === 10 && e3.players[2].hand.length === 10 && e3.deck.length === 20 && e3.players[0].hand.length === 0);
playOut(e3);
t('…si pesca fino alla fine della mano, solo i due rimasti', (e3.phase === 'scores' || e3.phase === 'over') && e3.res.cards[0] === 0 && e3.res.cards[1] + e3.res.cards[2] === 40, e3.res && e3.res.cards);
var e4 = E.newGame(seats(3), { mode: 'perdere', elim: true, target: 21 }); e4.totals = [30, 25, 0]; playOut(e4);
t('quando ne resta uno solo la partita finisce e vince lui', e4.phase === 'over' && e4.winners.join() === '2' && e4.final.place[2] === 1 && e4.players[0].outAt && e4.players[1].outAt && !e4.players[2].outAt);
var e5 = E.newGame(seats(4), { mode: 'perdere', elim: true, target: 21 }); e5.totals = [40, 0, 0, 0]; playOut(e5); E.forceNext(e5); e5.totals[1] = 40; playOut(e5);
t('chi esce prima arriva dopo in classifica', e5.phase === 'scores' && e5.players[1].outAt === 2 && E.alive(e5).length === 2);
E.forceNext(e5); e5.totals[2] = 40; playOut(e5);
t('…fino all’ultimo rimasto, che vince', e5.phase === 'over' && e5.winners.join() === '3' && e5.final.place.join() === '4,3,2,1', e5.final && e5.final.place);
var e6 = E.newGame(seats(3), { mode: 'perdere', elim: true, target: 21 }); e6.totals = [40, 30, 30]; playOut(e6);
var low = Math.min(e6.totals[0], e6.totals[1], e6.totals[2]);
t('se escono tutti insieme vince chi ha meno punti', e6.phase === 'over' && e6.winners.every(function (i) { return e6.totals[i] === low; }) && e6.winners.every(function (i) { return e6.final.place[i] === 1; }), e6.totals + ' ' + e6.winners);

// partite tra automatici in tutte le varianti
var bad = 0, N = +process.argv[2] || 20, hands = 0;
[['vincere', 2], ['vincere', 4], ['perdere', 3], ['perdere', 4], ['perdere', 5], ['perdere', 6], ['perdere', 3, 1], ['perdere', 5, 1], ['perdere', 4, 0, 1], ['perdere', 6, 0, 1], ['perdere', 5, 1, 1]].forEach(function (v) {
  for (var k = 0; k < N; k++) {
    var b = E.newGame(seats(v[1]).map(function (x) { x.bot = true; return x; }), { mode: v[0], target: v[2] ? 41 : 21, accuse: k % 2 === 0, bastoni: !!v[2], elim: !!v[3] }), guard = 0;
    while (b.phase !== 'over' && guard++ < 20000) {
      var who = E.pending(b)[0]; if (who == null) { E.forceNext(b); continue; }
      var hb = b.hand, err = E.act(b, who, B.decide(b, who)); if (err) { bad++; console.log('errore', v.join(' '), err); break; }
      if (b.res && b.hand === hb && (b.phase === 'scores' || b.phase === 'over') && b.res.counted !== true) {
        b.res.counted = true; hands++;
        if (sum(b.res.th) !== E.totalTh(b)) { bad++; console.log('terzi', v.join(' '), sum(b.res.th)); }
        if (b.res.cap < 0 && sum(b.res.pts) - sum(b.res.acc) > E.handPts(b)) { bad++; console.log('punti', v.join(' '), b.res.pts); }
      }
    }
    if (b.phase !== 'over') { bad++; console.log('non finita', v.join(' ')); }
    if (v[3] && b.phase === 'over' && (E.alive(b).length !== b.winners.length || b.players.some(function (P, i) { return P.outAt && b.totals[i] < b.opts.target; }))) { bad++; console.log('eliminazione', v.join(' '), E.alive(b), b.winners); }
  }
});
t('partite tra automatici a vincere (2, 4) e a perdere (3-6, anche con l’asso di bastoni da 11 e ad eliminazione) finite senza errori, sempre tutti i terzi della mano', bad === 0 && hands > 0, bad);
console.log('Tressette: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
