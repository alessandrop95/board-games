/* ===== Vocabolario bugiardo: motore delle regole (gira sull'host; lo stato è JSON) =====
   Da 3 a 12 giocatori, ognuno per sé. A ogni manche esce una parola italiana rara e vera.
   1. Scrittura: ognuno inventa in segreto una definizione credibile.
   2. Voto: si vedono tutte le definizioni mescolate, insieme a quella vera, senza autori. Ognuno vota quella che crede
      vera (non la propria).
   3. Risultati: +2 a chi ha votato la definizione vera, +1 all'autore di una definizione falsa per ogni voto ricevuto.
      Chi scrive proprio la definizione vera (parola per parola, o quasi) prende +3 e la sua non va al voto.
   Dopo le manche stabilite vince chi ha più punti.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var VBEngine = (function () {
  var D = (typeof VBData !== 'undefined') ? VBData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var OPT = { rounds: [4, 6, 8, 10], time: [60, 90, 120] }, VOTE_MS = 45000, SHOW_MS = 30000, MAXLEN = 160, REAL = 2, FOOL = 1, KNEW = 3;
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  // per riconoscere due definizioni uguali: minuscole, senza accenti né punteggiatura
  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    return t.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function word(g) { return D.W[g.word]; }

  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 6), time: pick(OPT.time, opts.time, 90) };
    var g = {
      v: 1, phase: 'write', seq: 0, turnN: 0, round: 0, clock: now, opts: o,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, score: 0, def: null, vote: null, ready: false, gain: 0, fooled: 0, right: 0 }; }),
      word: -1, used: [], defs: [], until: 0, res: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    log(g, 'Si gioca a ' + o.rounds + ' manche: inventa definizioni credibili e smaschera quella vera!', 'sys');
    startRound(g, now);
    return g;
  }
  function startRound(g, now) {
    var left = D.W.map(function (x, i) { return i; }).filter(function (i) { return g.used.indexOf(i) < 0; });
    if (!left.length) { g.used = []; left = D.W.map(function (x, i) { return i; }); }
    g.word = left[Math.floor(rand() * left.length)]; g.used.push(g.word);
    g.round++; g.phase = 'write'; g.defs = []; g.res = null; g.clock = now; g.turnN++;
    g.until = now + g.opts.time * 1000;
    g.players.forEach(function (P) { P.def = null; P.vote = null; P.ready = false; P.gain = 0; });
    log(g, 'Manche ' + g.round + ': la parola è «' + word(g)[0] + '» (' + D.KIND[word(g)[1]] + ').', 'sys');
    fx(g, { k: 'word', round: g.round });
  }
  // dalla scrittura al voto: le definizioni (vera + inventate, quelle uguali unite) mescolate
  function startVote(g, now) {
    var real = word(g)[2], list = [{ t: real, by: [], real: true, votes: [] }], knew = [];
    g.players.forEach(function (P, i) {
      if (!P.def) return;
      var n = norm(P.def);
      if (n === norm(real)) { knew.push(i); return; }
      var same = list.filter(function (d) { return !d.real && norm(d.t) === n; })[0];
      if (same) same.by.push(i); else list.push({ t: P.def, by: [i], real: false, votes: [] });
    });
    g.knew = knew;
    knew.forEach(function (i) { log(g, nick(g, i) + ' conosceva la parola: ha scritto la definizione vera!', 'knew', i); });
    g.defs = shuffle(list);
    g.turnN++; g.clock = now;
    // nessuna definizione inventata: niente da votare
    if (g.defs.length < 2) { log(g, 'Nessuna definizione inventata: si passa ai risultati.', 'sys'); reveal(g, now); return; }
    g.phase = 'vote'; g.until = now + VOTE_MS;
    log(g, 'Si vota: quale sarà la definizione vera? Sono ' + g.defs.length + '.', 'sys');
    fx(g, { k: 'vote', round: g.round });
  }
  // chi può votare: tutti, purché ci sia almeno una definizione che non è la sua
  function canVote(g, p) { return g.defs.some(function (d) { return d.by.indexOf(p) < 0; }); }
  function reveal(g, now) {
    var gain = g.players.map(function () { return 0; });
    (g.knew || []).forEach(function (i) { gain[i] += KNEW; g.players[i].right++; });
    g.defs.forEach(function (d) { d.votes = []; });
    g.players.forEach(function (P, i) {
      if (P.vote == null || !g.defs[P.vote]) return;
      var d = g.defs[P.vote]; d.votes.push(i);
      if (d.real) { gain[i] += REAL; P.right++; }
      else d.by.forEach(function (a) { if (a !== i) { gain[a] += FOOL; g.players[a].fooled++; } });
    });
    g.players.forEach(function (P, i) { P.gain = gain[i]; P.score += gain[i]; P.ready = !!P.bot; });
    var realIdx = g.defs.map(function (d) { return d.real; }).indexOf(true), rv = realIdx >= 0 ? g.defs[realIdx].votes : [];
    g.res = { word: g.word, real: realIdx, gain: gain.slice() };
    g.phase = 'reveal'; g.until = now + SHOW_MS; g.clock = now; g.turnN++;
    var best = g.defs.filter(function (d) { return !d.real && d.votes.length; }).sort(function (a, b) { return b.votes.length - a.votes.length; })[0];
    log(g, '«' + word(g)[0] + '»: ' + word(g)[2] + ' ' + (rv.length ? 'L’hanno indovinata ' + rv.map(function (i) { return nick(g, i); }).join(', ') + '.' : 'Nessuno l’ha indovinata!') +
      (best ? ' La bugia migliore è di ' + best.by.map(function (i) { return nick(g, i); }).join(' e ') + ' (' + best.votes.length + (best.votes.length > 1 ? ' voti' : ' voto') + ').' : ''), 'round');
    fx(g, { k: 'reveal', round: g.round });
  }
  function finish(g, now) {
    g.phase = 'over'; g.until = 0; g.clock = now;
    var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[b].score - g.players[a].score || g.players[b].fooled - g.players[a].fooled || a - b; });
    var place = g.players.map(function (P) { return 1 + g.players.filter(function (Q) { return Q.score > P.score; }).length; });
    g.winners = order.filter(function (i) { return place[i] === 1; });
    g.final = { order: order, place: place };
    log(g, (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + g.players[g.winners[0]].score + ' punti!', 'win', g.winners[0]);
    fx(g, { k: 'over' });
  }
  function nextRound(g, now) { if (g.round >= g.opts.rounds) finish(g, now); else startRound(g, now); }
  function tick(g, now) {
    if (now < g.until) return false;
    if (g.phase === 'write') { startVote(g, now); g.seq++; return true; }
    if (g.phase === 'vote') { reveal(g, now); g.seq++; return true; }
    if (g.phase === 'reveal') { nextRound(g, now); g.seq++; return true; }
    return false;
  }
  function pending(g) {
    var all = g.players.map(function (P, i) { return i; });
    if (g.phase === 'write') return all.filter(function (i) { return !g.players[i].def; });
    if (g.phase === 'vote') return all.filter(function (i) { return g.players[i].vote == null && canVote(g, i); });
    if (g.phase === 'reveal') return all.filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function decider() { return null; }   // si gioca tutti insieme, con il tempo della manche
  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    var P = g.players[p]; if (!P) return 'Non sei al tavolo.';
    var r = doAct(g, p, P, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function doAct(g, p, P, a, now) {
    if (g.phase === 'write') {
      if (a.a !== 'def') return 'Scrivi la tua definizione.';
      var t = String(a.t == null ? '' : a.t).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAXLEN);
      if (norm(t).length < 3) return 'La definizione è troppo corta.';
      var first = !P.def; P.def = t;
      if (first) fx(g, { k: 'wrote', p: p });
      if (!pending(g).length) startVote(g, now);
      return null;
    }
    if (g.phase === 'vote') {
      if (a.a !== 'vote') return 'Vota la definizione che credi vera.';
      var i = Math.floor(+a.i), d = g.defs[i];
      if (!d) return 'Definizione sconosciuta.';
      if (d.by.indexOf(p) >= 0) return 'Non puoi votare la tua definizione.';
      var firstV = P.vote == null; P.vote = i;
      if (firstV) fx(g, { k: 'voted', p: p });
      if (!pending(g).length) reveal(g, now);
      return null;
    }
    if (g.phase === 'reveal') {
      if (a.a !== 'next') return 'Tocca «Avanti».';
      P.ready = true;
      if (!pending(g).length) nextRound(g, now);
      return null;
    }
    return 'Mossa non valida.';
  }
  function forceNext(g, now) {
    now = now || Date.now();
    if (g.phase === 'reveal') { nextRound(g, now); g.seq++; return true; }
    return false;
  }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, canVote: canVote, norm: norm, word: word,
    setRandom: setRandom, shuffle: shuffle, OPT: OPT, VOTE_MS: VOTE_MS, SHOW_MS: SHOW_MS, MAXLEN: MAXLEN, REAL: REAL, FOOL: FOOL, KNEW: KNEW, D: D };
})();
if (typeof module !== 'undefined') module.exports = VBEngine;
