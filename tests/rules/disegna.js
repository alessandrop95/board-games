// gioco: disegna
// Prove delle regole di Disegna e indovina (una prova per regola) e partite intere con giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/disegna/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(teams, bots) { return teams.map(function (tm, i) { return { uid: 'u' + i, nick: 'G' + i, team: tm, bot: !!(bots && bots[i]) }; }); }
var T0 = 1000000;

t('risposte: maiuscole, accenti, spazi, plurale ed errore di battitura', E.right('GATTI', 'gatto') && E.right('pupazzodineve', 'pupazzo di neve') && E.right('elefnate', 'elefante') && E.right('Felicita', 'felicità') && !E.right('gatto', 'gelato') && !E.right('', 'sole'));
t('«quasi»: vicina ma non giusta', E.near('elefan', 'elefante') && !E.near('sole', 'sole') && !E.near('pizza', 'balena'));
t('parole senza doppioni', D.EASY.length > 150 && D.HARD.length > 150 && D.EASY.concat(D.HARD).every(function (w, i, a) { return a.findIndex(function (x) { return E.norm(x) === E.norm(w); }) === i; }), D.EASY.concat(D.HARD).filter(function (w, i, a) { return a.findIndex(function (x) { return E.norm(x) === E.norm(w); }) !== i; }));
t('prima di iniziare: squadre da almeno 2', E.checkSeats(seats([0, 1, 1]), 2) !== null && E.checkSeats(seats([0, 0, 0]), 2) !== null && E.checkSeats(seats([0, 0, 1, 1]), 2) === null);
var g = E.newGame(seats([0, 1, 0, 1, 1], [0, 0, 0, 0, 1]), { rounds: 2, time: 60 }, T0);
t('turni: ogni persona disegna una volta per giro, le squadre si alternano', g.order.map(function (o) { return o.p; }).join() === '0,1,2,3,0,1,2,3' && g.order[4].r === 2);
t('si comincia scegliendo tra una parola facile e una difficile', g.phase === 'choose' && g.drawer === 0 && D.EASY.indexOf(g.choices[0]) >= 0 && D.HARD.indexOf(g.choices[1]) >= 0);
t('sceglie solo chi disegna', E.act(g, 1, { a: 'choose', i: 1 }, T0 + 1000) !== null);
t('scelta: parola difficile, 2 punti, parte il tempo', E.act(g, 0, { a: 'choose', i: 1 }, T0 + 1000) === null && g.phase === 'draw' && g.pts === 2 && g.until === T0 + 61000 && g.word === g.choices[1]);
t('il disegno viene salvato (e ripulito)', E.act(g, 0, { a: 'pic', t: g.pic.t, s: [['#ff0000', 8, 10, 10, 2000, -5], ['bad']] }, T0 + 2000) === null && g.pic.s.length === 1 && g.pic.s[0].join() === '#ff0000,8,10,10,1000,0');
t('solo chi disegna manda il disegno', E.act(g, 2, { a: 'pic', t: g.pic.t, s: [] }, T0 + 2000) !== null);
t('gli avversari non indovinano durante il disegno', E.act(g, 1, { a: 'guess', w: g.word }, T0 + 3000) !== null);
t('chi disegna non indovina', E.act(g, 0, { a: 'guess', w: g.word }, T0 + 3000) !== null);
t('risposta sbagliata: resta nell’elenco', E.act(g, 2, { a: 'guess', w: 'pomodoro' }, T0 + 4000) === null && g.guesses.length === 1 && g.guesses[0].w === 'pomodoro');
t('risposta giusta in fretta: punti della parola +1', E.act(g, 2, { a: 'guess', w: g.word.toUpperCase() }, T0 + 5000) === null && g.phase === 'reveal' && g.teams[0].total === 3 && g.hit.p === 2 && !g.hit.steal);
t('poi si vede la parola e tocca all’altra squadra', E.tick(g, T0 + 5000 + E.REVEAL_MS) && g.phase === 'choose' && g.drawer === 1 && g.pic.s.length === 0 && g.guesses.length === 0);
t('se chi disegna non sceglie, parte la facile', E.tick(g, g.until) && g.phase === 'draw' && g.pts === 1);
var st = g.start;
t('tempo finito: le altre squadre possono rubare', E.tick(g, st + 60000) && g.phase === 'steal' && E.canGuess(g, 0) && !E.canGuess(g, 3));
t('i compagni di chi disegna non indovinano più', E.act(g, 3, { a: 'guess', w: g.word }, st + 61000) !== null);
t('furto: punti della parola, senza bonus', E.act(g, 0, { a: 'guess', w: g.word }, st + 62000) === null && g.hit.steal && g.teams[0].total === 4);
E.tick(g, g.until);
E.tick(g, g.until); E.tick(g, g.until); E.tick(g, g.until);
t('nessuno indovina: si passa avanti senza punti', g.phase === 'reveal' && g.hit === null && g.teams[0].total === 4 && g.teams[1].total === 0);
t('chi disegna può arrendersi: si passa al furto', (function () { E.tick(g, g.until); E.act(g, g.drawer, { a: 'choose', i: 0 }, g.until - 1000); return E.act(g, g.drawer, { a: 'skip' }, g.until - 1000) === null && g.phase === 'steal'; })());
// fine della partita
var f = E.newGame(seats([0, 1, 0, 1]), { rounds: 1 }, T0), now = T0;
for (var k = 0; k < 100 && f.phase !== 'over'; k++) { now = f.until; E.tick(f, now); }
t('dopo l’ultimo turno vince chi ha più punti (pari se nessuno indovina)', f.phase === 'over' && f.winners.length === 2);
t('opzioni fuori dall’elenco tornano a quelle normali', E.newGame(seats([0, 1, 0, 1]), { rounds: 9, time: 5, teams: 7 }, T0).opts.time === 80);
// partite con automatici che indovinano
var bad = 0, N = +process.argv[2] || 10, hits = 0, turns = 0;
for (var k2 = 0; k2 < N; k2++) for (var nt = 2; nt <= 4; nt++) {
  var tm = []; for (var i = 0; i < nt * 3; i++) tm.push(i % nt);
  var b = E.newGame(seats(tm, tm.map(function (x, i) { return i >= nt; })), { teams: nt, rounds: 1 }, T0), now2 = T0, guard = 0;
  while (b.phase !== 'over' && guard++ < 20000) {
    now2 += 900;
    if (E.tick(b, now2)) continue;
    if (b.phase === 'choose') { E.act(b, b.drawer, { a: 'choose', i: guard % 2 }, now2); continue; }
    for (var q = 0; q < b.players.length; q++) { var a = B.decide(b, q, now2); if (a && Math.random() < .2) { var err = E.act(b, q, a, now2); if (err) { bad++; console.log('errore', err, a); } break; } }
  }
  if (b.phase !== 'over') { bad++; console.log('non finita', b.phase); }
  turns += b.order.length; b.teams.forEach(function (T) { hits += T.total; });
}
t('partite con 2, 3 e 4 squadre finite senza errori', bad === 0, bad);
// parole già uscite nelle partite precedenti: non tornano finché ce ne sono di nuove
t('almeno 1000 parole facili e 700 difficili', D.EASY.length >= 1000 && D.HARD.length >= 700);
var seenW = D.EASY.slice(0, 200).concat(D.HARD.slice(0, 100)), fresh = 0;
for (var z = 0; z < 20; z++) { var gz = E.newGame(seats([0, 1, 0, 1]), { rounds: 1 }, T0, seenW); if (seenW.indexOf(gz.choices[0]) < 0 && seenW.indexOf(gz.choices[1]) < 0) fresh++; }
t('le parole già uscite a questo tavolo non vengono riproposte', fresh === 20);
var gw = E.newGame(seats([0, 1, 0, 1]), { rounds: 1 }, T0), firsts = gw.choices.slice();
t('nella stessa partita le parole proposte non si ripetono', gw.offered.length === 2 && firsts[0] !== firsts[1]);
console.log('punti per turno: ' + (hits / turns).toFixed(2));
// ===== modalità e regole aggiuntive =====
function hum(teams) { return teams.map(function (tm, i) { return { uid: 'h' + i, nick: 'P' + i, team: tm }; }); }
// regole
var sh = E.newGame(seats([0, 1, 0, 1]), { rounds: 3, time: 80, shrink: true }, T0);
t('tempo che si accorcia: 80, 60, 40 secondi', E.drawTime(sh, 1) === 80 && E.drawTime(sh, 2) === 60 && E.drawTime(sh, 3) === 40 && E.drawTime(E.newGame(seats([0, 1, 0, 1]), { rounds: 3, time: 60, shrink: true }, T0), 3) === 30);
var bt = E.newGame(seats([0, 1, 0, 1]), { bet: true }, T0);
t('scommessa: chi disegna punta 3 punti scegliendo la parola', E.act(bt, 0, { a: 'choose', i: 1, b: 3 }, T0 + 1000) === null && bt.bet === 3);
t('scommessa vinta: puntata +1 per la difficile +1 se in fretta', E.act(bt, 2, { a: 'guess', w: bt.word }, T0 + 2000) === null && bt.teams[0].total === 5);
E.tick(bt, bt.until);   // turno della squadra 1: sceglie la parola
bt.teams[1].total = 4; E.act(bt, bt.drawer, { a: 'bet', b: 2 }, bt.until - 100);
t('la puntata si cambia prima di disegnare', bt.bet === 2);
E.tick(bt, bt.until); E.tick(bt, bt.until); E.tick(bt, bt.until);
t('scommessa persa: nessuno indovina e la squadra perde la puntata', bt.phase === 'reveal' && !bt.hit && bt.teams[1].total === 2);
var ln = E.newGame(seats([0, 1, 0, 1]), { line: true, mono: true }, T0); E.act(ln, 0, { a: 'choose', i: 0 }, T0 + 1000);
E.act(ln, 0, { a: 'pic', t: ln.pic.t, s: [['#e0402c', 30, 1, 1, 50, 50], ['#3d8bfd', 8, 5, 5, 9, 9]] }, T0 + 2000);
t('una linea sola: conta solo il primo tratto', ln.pic.s.length === 1);
t('un colore solo: il tratto diventa nero e sottile', ln.pic.s[0][0] === '#1d2333' && ln.pic.s[0][1] <= 18);
t('opzioni: le regole si salvano solo se valide', E.cleanOpts({ mode: 'boh', dark: 1, hand: 'si', bet: true }).mode === 'teams' && E.cleanOpts({ dark: 1 }).dark === true && E.cleanOpts({ mode: 'chain', bet: true }).bet === false);
// tutti contro tutti
t('tutti contro tutti: basta un giocatore in più', E.checkSeats(hum([0, 0]), 0, { mode: 'ffa' }) === null && E.checkSeats(hum([0]), 0, { mode: 'ffa' }) !== null);
var ff = E.newGame(hum([0, 0, 1]), { mode: 'ffa', rounds: 1 }, T0);
t('tutti contro tutti: ognuno ha il suo punteggio, disegnano tutti a turno', ff.teams.length === 3 && ff.players.every(function (P, i) { return P.team === i; }) && ff.order.length === 3);
E.act(ff, 0, { a: 'choose', i: 0 }, T0 + 1000);
t('indovinano tutti tranne chi disegna', E.canGuess(ff, 1) && E.canGuess(ff, 2) && !E.canGuess(ff, 0));
t('chi indovina prende i punti (+1 se in fretta) e li prende anche chi disegna', E.act(ff, 2, { a: 'guess', w: ff.word }, T0 + 2000) === null && ff.teams[2].total === 2 && ff.teams[0].total === 1 && ff.teams[1].total === 0);
E.tick(ff, ff.until); E.tick(ff, ff.until); E.tick(ff, ff.until);
t('tutti contro tutti: niente furto, a tempo scaduto si vede la parola', ff.phase === 'reveal' && !ff.hit);
// staffetta
var rl = E.newGame(hum([0, 0, 0, 1, 1, 1]), { mode: 'relay', rounds: 1 }, T0), r0 = rl.drawer;
E.act(rl, r0, { a: 'choose', i: 0 }, T0 + 1000);
var mates = E.members(rl, rl.players[r0].team).filter(function (i) { return i !== r0; });
t('staffetta: comincia uno, i compagni indovinano', rl.relay && rl.relay.max === 2 && mates.every(function (i) { return E.canGuess(rl, i) && !E.knows(rl, i); }) && E.knows(rl, r0));
t('dopo 10 secondi la penna passa: il nuovo vede la parola e non indovina più', E.tick(rl, T0 + 1000 + E.RELAY_MS) && rl.drawer === mates[0] && E.knows(rl, mates[0]) && !E.canGuess(rl, mates[0]) && E.canGuess(rl, mates[1]));
t('poi torna a chi aveva già disegnato: resta sempre qualcuno che indovina', E.tick(rl, T0 + 1000 + 2 * E.RELAY_MS) && rl.drawer === r0 && E.canGuess(rl, mates[1]) && rl.relay.seen.length === 2);
t('la squadra indovina con chi non ha mai disegnato', E.act(rl, mates[1], { a: 'guess', w: rl.word }, T0 + 25000) === null && rl.hit && rl.hit.t === rl.players[r0].team);
var rb = E.newGame(seats([0, 0, 1, 1], [0, 1, 0, 1]), { mode: 'relay' }, T0); E.act(rb, rb.drawer, { a: 'choose', i: 0 }, T0 + 1000);
t('staffetta con un solo disegnatore in squadra: la penna resta a lui', rb.relay.max === 1 && !E.tick(rb, T0 + 1000 + E.RELAY_MS));
// indovina tu per me
var bl = E.newGame(hum([0, 1, 0, 1]), { mode: 'blind' }, T0), bd = bl.drawer, bh = bl.hinter;
t('indovina tu per me: prima un avversario sceglie la parola e scrive gli aiuti', bl.phase === 'hint' && bh != null && bl.players[bh].team !== bl.players[bd].team);
var wd = bl.choices[0];
t('gli aiuti non possono contenere la parola', E.act(bl, bh, { a: 'hint', i: 0, c: [wd] }, T0 + 1000) !== null);
t('al massimo 3 parole di aiuto', E.act(bl, bh, { a: 'hint', i: 0, c: ['uno due', 'tre quattro'] }, T0 + 1000) !== null);
t('solo chi suggerisce dà gli aiuti', E.act(bl, bd, { a: 'hint', i: 0, c: ['zzz'] }, T0 + 1000) !== null);
t('con gli aiuti si comincia a disegnare', E.act(bl, bh, { a: 'hint', i: 0, c: ['qwerty'] }, T0 + 1000) === null && bl.phase === 'draw' && bl.clues.join() === 'qwerty');
var bmate = E.members(bl, bl.players[bd].team).filter(function (i) { return i !== bd; })[0];
t('chi disegna non vede la parola, gli avversari sì', !E.knows(bl, bd) && !E.knows(bl, bmate) && E.knows(bl, bh));
t('indovinano chi disegna e i compagni, non gli avversari', E.canGuess(bl, bd) && E.canGuess(bl, bmate) && !E.canGuess(bl, bh));
E.tick(bl, bl.until);
t('niente furto: a tempo scaduto si vede la parola', bl.phase === 'reveal');
var bn = E.newGame(seats([0, 0, 1, 1], [0, 0, 1, 1]), { mode: 'blind' }, T0);
t('senza avversari in carne e ossa gli aiuti li dà il gioco', bn.hinter === null && E.tick(bn, bn.until) && bn.phase === 'draw' && bn.clues.length === 2);
// telefono senza fili
t('telefono senza fili: almeno 3 persone', E.checkSeats(seats([0, 0, 0], [0, 0, 1]), 0, { mode: 'chain' }) !== null && E.checkSeats(hum([0, 0, 0]), 0, { mode: 'chain' }) === null);
var ch = E.newGame(seats([0, 0, 0, 0, 0], [0, 0, 0, 0, 1]), { mode: 'chain', time: 60 }, T0);
t('i giocatori automatici guardano soltanto', ch.players.length === 4 && ch.chain.steps === 4 && ch.phase === 'chain');
var tk = E.chainTask(ch, 0);
t('primo passo: ognuno disegna la sua parola', tk.kind === 'draw' && tk.text === ch.chain.list[0].w && E.chainTask(ch, 1).text === ch.chain.list[1].w);
t('non si scrive quando si disegna', E.act(ch, 0, { a: 'cwrite', w: 'ciao' }, T0 + 1000) !== null);
E.act(ch, 0, { a: 'cdraw', s: [['#e0402c', 8, 100, 100, 200, 200, 300, 150]] }, T0 + 2000);
t('il disegno si salva compatto e si rilegge', typeof ch.chain.list[0].it[0].s[0] === 'string' && E.unpack(ch.chain.list[0].it[0].s)[0][0] === '#e0402c' && E.unpack(ch.chain.list[0].it[0].s)[0].length === 8);
t('una volta sola', E.act(ch, 0, { a: 'cdraw', s: [] }, T0 + 2500) !== null);
[1, 2, 3].forEach(function (p) { E.act(ch, p, { a: 'cdraw', s: [] }, T0 + 3000); });
t('quando hanno consegnato tutti si passa al disegno del vicino', ch.chain.k === 1 && E.chainTask(ch, 1).kind === 'write' && E.chainOf(ch, 1) === 0);
var orig0 = ch.chain.list[0].w;
E.act(ch, 1, { a: 'cwrite', w: orig0 }, T0 + 4000);
E.tick(ch, ch.until);
t('a tempo scaduto chi non ha consegnato lascia la casella vuota', ch.chain.k === 2 && ch.chain.list[1].it[1].w === '' && E.chainTask(ch, 2).text === orig0);
for (var z2 = 0; z2 < 3 && ch.phase === 'chain'; z2++) E.tick(ch, ch.until);
t('poi si rivedono le catene: un punto a chi ha scritto la parola giusta e a chi l’ha disegnata', ch.phase === 'show' && ch.teams[1].total === 1 && ch.teams[0].total === 1);
for (var z3 = 0; z3 < 60 && ch.phase !== 'over'; z3++) E.tick(ch, ch.until);
t('dopo le catene la partita finisce', ch.phase === 'over' && ch.winners.length === 2);
// partite intere con giocatori automatici in tutte le modalità a turni
var badm = 0;
['ffa', 'relay', 'blind'].forEach(function (mode) {
  for (var r = 0; r < 15; r++) {
    var gm = E.newGame(seats([0, 1, 0, 1, 0, 1], [0, 0, 0, 0, 1, 1]), { mode: mode, rounds: 1, bet: r % 2 === 0, shrink: r % 3 === 0 }, T0), nw = T0;
    for (var s2 = 0; s2 < 3000 && gm.phase !== 'over'; s2++) {
      nw += 1000;
      gm.players.forEach(function (P, p) { P.bot = true; var a = B.decide(gm, p, nw); if (a && (a.a !== 'guess' || Math.random() < .2)) { var e = E.act(gm, p, a, nw); if (e && !/scaduto|Adesso|tocca/.test(e)) { badm++; if (badm < 4) console.log(mode, e, JSON.stringify(a)); } } });
      E.tick(gm, nw);
    }
    if (gm.phase !== 'over') { badm++; console.log('non finita', mode, gm.phase); }
  }
});
t('partite intere in tutte le modalità senza errori', badm === 0, badm);
console.log('Disegna e indovina: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
