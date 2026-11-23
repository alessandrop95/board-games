// gioco: emoji
// Prove delle regole di Emoji in scena (una prova per regola) e partite intere tra giocatori automatici
var path = require('path'), SRC = path.join(__dirname, '../../src/emoji/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js'), B = require(SRC + 'bot.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : extra); } }
function seats(n, teams, bots) { var a = []; for (var i = 0; i < n; i++) a.push({ uid: 'u' + i, nick: 'G' + i, team: teams ? teams[i] : i % 2, bot: !!bots }); return a; }
function find(ans) { return D.ITEMS.findIndex(function (x) { return x[0] === ans; }); }
var T0 = 1000;

t('ogni titolo ha categoria, livello e un indizio fatto solo di emoji', D.ITEMS.every(function (x) { return D.CATS.indexOf(x[1]) >= 0 && (x[2] === 1 || x[2] === 2) && x[3].split(' ').every(E.isEmoji); }));
t('la tastiera ha solo emoji', D.PAD.every(function (c) { return c.list.every(E.isEmoji); }));
t('lettere, numeri e testo non sono emoji', !['a', 'ciao', '7', 'x😀', '😀 😀', '<b>', ''].some(E.isEmoji) && E.isEmoji('1️⃣') && E.isEmoji('🇮🇹') && E.isEmoji('🧜‍♀️'));
t('risposte: articolo, maiuscole, errori di battitura, altre risposte', E.right('re leone', D.ITEMS[find('Il re leone')]) && E.right('TITANIK', D.ITEMS[find('Titanic')]) && E.right('star wars', D.ITEMS[find('Guerre stellari')]) && !E.right('Tritone', D.ITEMS[find('Titanic')]));
t('modi di dire lunghi: bastano quasi tutte le parole', E.right('una mela al giorno toglie il medico', D.ITEMS[find('Una mela al giorno toglie il medico di torno')]) && E.right('chi dorme non prende pesci', D.ITEMS[find('Chi dorme non piglia pesci')]) && !E.right('chi dorme', D.ITEMS[find('Chi dorme non piglia pesci')]));
var g = E.newGame(seats(4, [0, 1, 0, 1]), { teams: 2, time: 60 }, T0);
t('squadre e ordine dei registi alternato', g.teams.length === 2 && g.order.map(function (o) { return o.p; }).join() === '0,1,2,3' && g.phase === 'pick' && g.regista === 0);
t('due titoli: uno facile e uno difficile', D.ITEMS[g.choices[0]][2] === 1 && D.ITEMS[g.choices[1]][2] === 2);
t('sceglie solo il regista', E.act(g, 1, { a: 'pick', i: 0 }, T0) !== null);
g.choices = [find('Titanic'), find('Piove sul bagnato')];
t('il regista sceglie', E.act(g, 0, { a: 'pick', i: 0 }, T0) === null && g.phase === 'play' && E.item(g)[0] === 'Titanic' && g.until === T0 + 60000);
t('solo emoji', E.act(g, 0, { a: 'emo', e: 'nave' }, T0) !== null && E.act(g, 0, { a: 'emo', e: '🚢' }, T0) === null && g.clue.join() === '🚢');
t('le emoji le mette solo il regista', E.act(g, 2, { a: 'emo', e: '🧊' }, T0) !== null);
E.act(g, 0, { a: 'emo', e: '🧊' }, T0); E.act(g, 0, { a: 'emo', e: '💔' }, T0); E.act(g, 0, { a: 'undo' }, T0);
t('togli l’ultima', g.clue.join() === '🚢,🧊');
t('il regista non indovina', E.act(g, 0, { a: 'guess', t: 'Titanic' }, T0) !== null);
t('gli avversari non rispondono durante il turno', E.act(g, 1, { a: 'guess', t: 'Titanic' }, T0) !== null);
t('risposta sbagliata del compagno', E.act(g, 2, { a: 'guess', t: 'La nave dei sogni' }, T0 + 1000) === null && g.guesses.length === 1 && !g.guesses[0].ok);
t('il regista segna 🔥 e lo toglie', E.act(g, 0, { a: 'mark', i: 0, m: 'hot' }, T0) === null && g.guesses[0].m === 'hot' && E.act(g, 0, { a: 'mark', i: 0, m: 'hot' }, T0) === null && g.guesses[0].m === null);
t('cambiare titolo una volta', E.act(g, 0, { a: 'skip' }, T0) === null && E.item(g)[2] === 1 && E.item(g)[0] !== 'Titanic' && !g.clue.length && E.act(g, 0, { a: 'skip' }, T0) !== null);
g.item = find('Titanic');
t('indovinato presto: punti + bonus', E.act(g, 2, { a: 'guess', t: 'titanic' }, T0 + 5000) === null && g.phase === 'reveal' && g.teams[0].total === 2 && g.hit.bonus === 1 && g.players[2].guessed === 1 && g.players[0].told === 1);
t('i risultati restano qualche secondo, poi il prossimo regista', E.tick(g, g.until) && g.phase === 'pick' && g.regista === 1);
// tempo finito: si ruba
E.act(g, 1, { a: 'pick', i: 1 }, T0 + 20000); var lv = E.item(g)[2], ans = E.item(g)[0];
t('tempo finito: le altre squadre possono rubare', E.tick(g, g.until) && g.phase === 'steal' && E.canGuess(g, 0) && E.canGuess(g, 2) && !E.canGuess(g, 3));
t('durante il furto la squadra del regista non risponde', E.act(g, 3, { a: 'guess', t: ans }, g.until - 1000) !== null);
t('rubato: solo i punti del titolo', E.act(g, 0, { a: 'guess', t: ans }, g.until - 1000) === null && g.hit.steal && g.teams[0].total === 2 + lv && g.hit.bonus === 0);
E.tick(g, g.until); E.act(g, 2, { a: 'pick', i: 0 }, T0); E.tick(g, g.until);
t('nessuno ruba: niente punti', E.tick(g, g.until) && g.phase === 'reveal' && !g.hit && g.hist.length === 3);
E.tick(g, g.until); E.act(g, 3, { a: 'pick', i: 0 }, T0); E.tick(g, g.until); E.tick(g, g.until);
t('dopo l’ultimo regista vince la squadra con più punti', E.tick(g, g.until) && g.phase === 'over' && g.winners.join() === '0' && g.final.place.join() === '1,2');
var s3 = E.newGame(seats(6, [0, 1, 2, 0, 1, 2]), { teams: 3, rounds: 2 }, T0);
t('3 squadre e 2 giri: ognuno regista due volte', s3.order.length === 12 && s3.order.slice(0, 3).map(function (o) { return s3.players[o.p].team; }).join() === '0,1,2');
t('il titolo scelto non torna nella stessa partita', (function () { var z = E.newGame(seats(4), {}, T0), seen = {}; for (var k = 0; k < 4; k++) { E.tick(z, z.until); var a = E.item(z)[0]; if (seen[a]) return false; seen[a] = 1; E.tick(z, z.until); E.tick(z, z.until); E.tick(z, z.until); } return true; })());
// partite intere tra automatici
var bad = 0, N = +process.argv[2] || 10;
for (var n = 4; n <= 12; n += 2) for (var k = 0; k < N; k++) {
  var nt = 2 + (k % 3), tm = []; for (var i = 0; i < n; i++) tm.push(i % nt);
  var b = E.newGame(seats(n, tm, true), { teams: nt, rounds: 1 }, T0), now = T0, nxt = tm.map(function () { return 0; }), guard = 0;
  while (b.phase !== 'over' && guard++ < 40000) {
    now += 500; if (E.tick(b, now)) continue;
    for (var p = 0; p < n; p++) { if (now < nxt[p]) continue; nxt[p] = now + (p === b.regista ? 1500 : 7000); var a = B.decide(b, p, now); if (a) { var err = E.act(b, p, a, now); if (err) { bad++; console.log('errore', err, JSON.stringify(a)); } } }
  }
  if (b.phase !== 'over') { bad++; console.log('non finita'); }
}
t('partite tra automatici da 4 a 12 giocatori, 2-4 squadre, finite senza errori', bad === 0, bad);
console.log('Emoji in scena: ' + ok + ' prove superate, ' + ko + ' fallite');
process.exit(ko ? 1 : 0);
