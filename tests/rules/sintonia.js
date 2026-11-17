// gioco: sintonia
// Prove delle regole di Sintonia (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/sintonia/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(teams) { return teams.map(function (tm, i) { return { uid: 'u' + i, nick: 'G' + i, team: tm }; }); }
var T0 = 1000000;
t('risposte uguali: accenti, articoli, plurale, errore di battitura', E.same('Il Caffè', 'caffe') && E.same('fragole', 'fragola') && E.same('ciliegia', 'cilegia') && !E.same('mela', 'pera'));
t('almeno 80 temi, ognuno con almeno 4 risposte', D.LIST.length >= 80 && D.LIST.every(function (x) { return x.a.length >= 4; }));
var g = E.newGame(seats([0, 0, 0, 1, 1, 1]), { time: 30, rounds: 6 }, T0);
t('si comincia scrivendo, con il tempo scelto', g.phase === 'write' && g.until === T0 + 30000 && g.teams.length === 2);
t('risposta vuota no', E.act(g, 0, { a: 'answer', w: '  ' }, T0) !== null);
['fragola', 'Fragole', 'mela', 'ciliegia', 'ciliegia', 'ciliegia'].forEach(function (w, i) { if (i < 5) E.act(g, i, { a: 'answer', w: w }, T0 + 1000); });
t('si aspetta che rispondano tutti', g.phase === 'write' && E.pending(g).join() === '5');
t('si può cambiare risposta prima della fine', E.act(g, 2, { a: 'answer', w: 'Fragola' }, T0 + 2000) === null);
E.act(g, 5, { a: 'answer', w: 'ciliegia' }, T0 + 3000);
t('tutti hanno risposto: si scoprono', g.phase === 'show');
t('squadra tutta d’accordo: 3 punti + 2', g.res.teams[0].pts === 5 && g.res.teams[0].full);
t('anche l’altra squadra tutta d’accordo', g.res.teams[1].pts === 5);
var h = E.newGame(seats([0, 0, 0, 0, 1, 1]), {}, T0);
['sole', 'sole', 'luna', 'luna', 'mare', 'monti'].forEach(function (w, i) { E.act(h, i, { a: 'answer', w: w }, T0); });
t('due coppie: 2 + 2 punti; nessuna coppia: 0', h.res.teams[0].pts === 4 && h.res.teams[1].pts === 0);
var ind = E.newGame(seats([0, 0, 0, 0]), { teams: 0 }, T0);
['pizza', 'pizza', 'pizza', 'pasta'].forEach(function (w, i) { E.act(ind, i, { a: 'answer', w: w }, T0); });
t('ognuno per sé: un punto per ogni altro con la stessa risposta', ind.res.players.join() === '2,2,2,0' && ind.teams[0].total === 2);
var tm = E.newGame(seats([0, 1, 0, 1]), {}, T0); E.act(tm, 0, { a: 'answer', w: 'x' }, T0);
t('tempo scaduto: si scopre anche senza tutte le risposte', E.tick(tm, T0 + 30000) && tm.phase === 'show' && tm.res.teams[0].pts === 0);
t('poi si passa al tema dopo', E.tick(tm, tm.until) && tm.phase === 'write' && tm.round === 2);
var f = E.newGame(seats([0, 1, 0, 1]), { rounds: 6 }, T0); f.round = 6; E.forceNext(f, T0); E.forceNext(f, T0);
t('dopo l’ultima manche la classifica', f.phase === 'over' && f.winners.length >= 1);
var bad = 0, N = +process.argv[2] || 20, pts = 0;
for (var k = 0; k < N; k++) {
  var tt = [0, 2, 3, 4][k % 4], n = 4 + (k % 9), st = []; for (var i = 0; i < n; i++) st.push({ uid: 'b' + i, nick: 'B' + i, bot: true, team: tt ? i % tt : 0 });
  var b = E.newGame(st, { teams: tt }, T0), now = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 3000) {
    now += 1000; if (E.tick(b, now)) continue;
    var q = E.pending(b)[0]; if (q == null) { E.forceNext(b, now); continue; }
    var a = B.decide(b, q); if (!a) { E.forceNext(b, now); continue; }
    var err = E.act(b, q, a, now); if (err) { bad++; console.log('errore', err); break; }
  }
  if (b.phase !== 'over') bad++;
  b.teams.forEach(function (T) { pts += T.total; });
}
t('partite tra automatici finite senza errori', bad === 0, bad);
// temi già usati nelle partite precedenti: non tornano finché ce ne sono di nuovi
t('almeno 400 temi diversi', D.LIST.length >= 400 && D.LIST.every(function (x, i, l) { return l.findIndex(function (y) { return y.q === x.q; }) === i; }));
var seenQ = D.LIST.slice(0, D.LIST.length - 30).map(function (x) { return x.q; });
var gs = E.newGame(seats([0, 0, 1, 1]), { rounds: 8 }, T0, seenQ);
t('i temi già usati a questo tavolo non tornano', gs.deck.length + 1 === 30 && gs.deck.concat([gs.theme]).every(function (i) { return seenQ.indexOf(D.LIST[i].q) < 0; }) && gs.usedQ.length === 1);
// ===== regole in più a sorpresa =====
function only(rule, teams, extra) { var o = { extra: true, rounds: 6, time: 30, teams: teams == null ? 2 : teams }; o[rule] = true; for (var k in extra || {}) o[k] = extra[k]; return o; }
function answers(g, list, now) { list.forEach(function (w, i) { if (w != null) E.act(g, i, { a: 'answer', w: w }, now || T0 + 1000); }); }
t('senza «Regole in più» nessuna regola', E.newGame(seats([0, 0, 1, 1]), { double: true }, T0).rule === null);
t('se non se ne sceglie nessuna possono uscire tutte', E.rulePool({}).length === 7);
var rr = E.newGame(seats([0, 0, 1, 1]), { extra: true, rounds: 12, double: true, flash: true }, T0), prevR = rr.rule, alt = true;
for (var z = 0; z < 11; z++) { E.forceNext(rr, T0); E.forceNext(rr, T0); if (rr.rule === prevR) alt = false; prevR = rr.rule; }
t('una regola nuova a ogni manche, mai uguale alla precedente', alt && rr.round === 12);
var db = E.newGame(seats([0, 0, 1, 1]), only('double'), T0); answers(db, ['mela', 'mela', 'pera', 'kiwi']);
t('punti doppi: 2 compagni in sintonia (+2, +2 perché tutti) valgono 8', db.teams[0].total === 8 && db.teams[1].total === 0);
var fl = E.newGame(seats([0, 0, 1, 1]), only('flash'), T0);
t('tempo lampo: 10 secondi', fl.until === T0 + 10000);
var lt = E.newGame(seats([0, 0, 1, 1]), only('letter'), T0), L = lt.rd.l;
t('lettera obbligata: estratta tra le risposte più comuni del tema', /^[A-Z]$/.test(L) && D.LIST[lt.theme].a.slice(0, 4).some(function (w) { return E.letterOf(w) === L; }));
t('lettera obbligata: una risposta con un’altra lettera non vale', E.act(lt, 0, { a: 'answer', w: (L === 'Z' ? 'abete' : 'zebra') }, T0 + 1000) !== null && E.act(lt, 0, { a: 'answer', w: L + 'ucertola' }, T0 + 1000) === null);
var bn = E.newGame(seats([0, 0, 1, 1]), only('ban'), T0), banned = D.LIST[bn.theme].a[0];
t('vietata la più ovvia: la prima risposta del tema non si può scrivere', bn.rd.w === banned && E.act(bn, 0, { a: 'answer', w: banned.toUpperCase() }, T0 + 1000) !== null && E.act(bn, 0, { a: 'answer', w: D.LIST[bn.theme].a[1] }, T0 + 1000) === null);
var un = E.newGame(seats([0, 0, 1, 1]), only('unique'), T0); answers(un, ['mela', 'pera', 'mela', 'kiwi']);
t('pensa diverso: 2 punti per ogni risposta che nessun altro ha scritto', un.teams[0].total === 2 && un.teams[1].total === 2 && !un.res.teams[0].full);
var al = E.newGame(seats([0, 0, 0, 1, 1, 1]), only('all'), T0); answers(al, ['mela', 'mela', 'mela', 'pera', 'pera', 'kiwi']);
t('tutto o niente: tutta la squadra uguale vale di più, altrimenti zero', al.teams[0].total === 8 && al.teams[1].total === 0);
var cp = E.newGame(seats([0, 0, 0, 1, 1, 1]), only('captain'), T0), c0 = cp.rd.caps[0], c1 = cp.rd.caps[1];
var cw = ['x', 'x', 'x', 'x', 'x', 'x']; E.members(cp, 0).forEach(function (p) { cw[p] = 'mela'; }); E.members(cp, 1).forEach(function (p) { cw[p] = p === c1 ? 'pera' : 'kiwi'; });
answers(cp, cw);
t('il capitano: contano i compagni con la sua stessa risposta (tutti: +2)', cp.players[c0].team === 0 && cp.teams[0].total === 5 && cp.teams[1].total === 0 && cp.res.teams[0].cap === c0);
var fc = E.newGame(seats([0, 0, 0, 0]), only('captain', 0), T0), tgt = fc.rd.target, fw = ['a1', 'a2', 'a3', 'a4']; fw[tgt] = 'mela'; fw[(tgt + 1) % 4] = 'mela';
answers(fc, fw);
t('ognuno per sé, il bersaglio: 2 punti a chi scrive come lui, 1 a lui per ognuno', fc.teams[(tgt + 1) % 4].total === 2 && fc.teams[tgt].total === 1 && fc.teams[(tgt + 2) % 4].total === 0);
var fu = E.newGame(seats([0, 0, 0, 0]), only('unique', 0), T0); answers(fu, ['mela', 'mela', 'pera', 'kiwi']);
t('ognuno per sé, pensa diverso: 3 punti alle risposte uniche', fu.teams[2].total === 3 && fu.teams[3].total === 3 && fu.teams[0].total === 0);
// partite intere con le regole a sorpresa
var badr = 0;
for (var k2 = 0; k2 < 30; k2++) {
  var gr = E.newGame(seats(k2 % 2 ? [0, 0, 0, 0, 0] : [0, 0, 1, 1, 0, 1]), { extra: true, teams: k2 % 2 ? 0 : 2, rounds: 12 }, T0), now2 = T0;
  for (var st2 = 0; st2 < 400 && gr.phase !== 'over'; st2++) {
    now2 += 1000;
    gr.players.forEach(function (P, p) { var a = B.decide(gr, p); if (a) { var e = E.act(gr, p, a, now2); if (e) { badr++; if (badr < 4) console.log('regola', gr.rule, e, JSON.stringify(a)); } } });
    E.tick(gr, now2);
  }
  if (gr.phase !== 'over') badr++;
}
t('partite intere con le regole a sorpresa senza errori (anche gli automatici rispettano le regole)', badr === 0, badr);
console.log('Sintonia: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
