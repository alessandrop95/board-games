/* ===== Emoji in scena: motore delle regole (gira sull'host; lo stato è JSON) =====
   A squadre (2, 3 o 4), da 4 a 12 giocatori. A turno ogni giocatore è il «regista»: sceglie tra un titolo facile
   (1 punto) e uno difficile (2 punti) — un film, un modo di dire, un personaggio, un cibo, un luogo, una cosa — e lo
   racconta ai compagni usando SOLO emoji, una dopo l'altra. I compagni scrivono le risposte; il regista può segnare
   una risposta con 🔥 (ci sei quasi) o ❄️ (fuori strada) e può cambiare titolo una volta.
   - Indovinato: i punti del titolo alla squadra, +1 se nella prima metà del tempo.
   - Tempo finito: le altre squadre hanno 15 secondi per rubare il titolo (solo i punti del titolo).
   Un giro = ognuno fa il regista una volta; le squadre si alternano. Vince la squadra con più punti.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var ESEngine = (function () {
  var D = (typeof ESData !== 'undefined') ? ESData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var PICK_MS = 15000, STEAL_MS = 15000, REVEAL_MS = 6500, MAXCLUE = 16, MAXGUESS = 60;
  var OPT = { rounds: [1, 2, 3], time: [60, 80, 100], teams: [2, 3, 4] };

  /* ---------- risposte ---------- */
  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    t = t.replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    t = t.replace(/^(l'|un'|il |lo |la |i |gli |le |un |uno |una )/, '');
    return t.replace(/[^a-z0-9 ]/g, ' ').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) d[i] = [i];
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  // giusta: uguale (senza spazi) con qualche errore di battitura nelle risposte lunghe; per i modi di dire lunghi
  // basta avere quasi tutte le parole importanti, in qualsiasi ordine
  function rightOne(guess, ans) {
    var a = norm(guess).replace(/ /g, ''), b = norm(ans).replace(/ /g, '');
    if (!a) return false; if (a === b) return true;
    if (b.length >= 5 && lev(a, b) <= (b.length >= 22 ? 3 : b.length >= 12 ? 2 : 1)) return true;
    var words = norm(ans).split(' ').filter(function (w) { return w.length >= 3; });
    if (words.length >= 4) {
      var gw = norm(guess).split(' '), hit = words.filter(function (w) { return gw.some(function (x) { return x === w || (w.length >= 5 && lev(x, w) <= 1); }); }).length;
      return hit / words.length >= .8;
    }
    return false;
  }
  function right(guess, item) { return [item[0]].concat(item[4] || []).some(function (x) { return rightOne(guess, x); }); }
  function near(guess, item) {
    var a = norm(guess).replace(/ /g, ''), b = norm(item[0]).replace(/ /g, '');
    if (!a || right(guess, item)) return false;
    if (lev(a, b) <= 3) return true;
    var words = norm(item[0]).split(' ').filter(function (w) { return w.length >= 4; }), gw = norm(guess).split(' ');
    return words.some(function (w) { return gw.indexOf(w) >= 0; });
  }
  // solo emoji: niente lettere, numeri scritti o spazi (i tasti numerici 1️⃣ vanno bene)
  function isEmoji(e) {
    if (typeof e !== 'string' || !e || e.length > 16) return false;
    var t = e.replace(/[0-9#*]️?⃣/g, '⭐');
    try { if (/[\p{L}\p{N}\s<>&"'`]/u.test(t)) return false; } catch (x) { if (/[A-Za-z0-9\s<>&"'`À-ɏ]/.test(t)) return false; }
    return /[ -㌀\uD83C-\uDBFF️⃣]/.test(t);
  }

  /* ---------- registro ed effetti ---------- */
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 140) g.log.splice(0, g.log.length - 140); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  function item(g) { return g.item == null ? null : D.ITEMS[g.item]; }
  function teamOf(g) { return g.regista == null ? -1 : g.players[g.regista].team; }

  // seen: titoli usciti nelle partite precedenti a questo tavolo, da non riproporre
  function newGame(seats, opts, now, seen) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 1), time: pick(OPT.time, opts.time, 80), teams: pick(OPT.teams, opts.teams, 2) };
    var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < o.teams && t === Math.floor(t) ? t : i % o.teams; });
    var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
    var g = {
      v: 1, phase: 'pick', seq: 0, turnN: 0, round: 0, turn: -1, clock: now, opts: o,
      teams: used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], total: 0, hist: [] }; }),
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: used.indexOf(want[i]), guessed: 0, told: 0 }; }),
      order: [], regista: null, choices: null, item: null, clue: [], guesses: [], hit: null, skips: 1, until: 0, start: 0,
      usedQ: [], offered: [], avoid: (seen || []).slice(-300), hist: [],
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    g.order = makeOrder(g);
    log(g, 'Si gioca a ' + g.teams.length + ' squadre: ' + g.teams.map(function (T, t) { return T.name + ' (' + members(g, t).map(function (i) { return nick(g, i); }).join(', ') + ')'; }).join(' contro ') + '.', 'sys');
    nextTurn(g, now);
    return g;
  }
  // un giro: ognuno fa il regista una volta, le squadre si alternano
  function makeOrder(g) {
    var hs = g.teams.map(function (T, t) { return members(g, t); }), max = Math.max.apply(null, hs.map(function (h) { return h.length; })), out = [];
    for (var r = 0; r < g.opts.rounds; r++) for (var k = 0; k < max; k++) hs.forEach(function (h) { if (k < h.length) out.push({ p: h[k], r: r + 1 }); });
    return out;
  }
  function draw(g, lvl, not) {
    var off = g.offered, av = g.avoid;
    var all = D.ITEMS.map(function (x, i) { return i; }).filter(function (i) { return D.ITEMS[i][2] === lvl && i !== not; });
    var pool = all.filter(function (i) { return off.indexOf(i) < 0 && av.indexOf(D.ITEMS[i][0]) < 0; });
    if (!pool.length) pool = all.filter(function (i) { return off.indexOf(i) < 0; });
    if (!pool.length) { g.offered = []; pool = all; }
    var i = pool[Math.floor(rand() * pool.length)];
    g.offered.push(i);
    return i;
  }
  function nextTurn(g, now) {
    g.turn++;
    if (g.turn >= g.order.length) { finish(g, now); return; }
    var o = g.order[g.turn];
    g.round = o.r; g.regista = o.p; g.phase = 'pick'; g.choices = [draw(g, 1), draw(g, 2)]; g.item = null;
    g.clue = []; g.guesses = []; g.hit = null; g.skips = 1;
    g.until = now + PICK_MS; g.clock = now; g.turnN++;
    fx(g, { k: 'turn', p: o.p, t: g.players[o.p].team, turn: g.turn });
  }
  function choose(g, i, now) {
    g.item = g.choices[i]; g.usedQ.push(D.ITEMS[g.item][0]);
    g.phase = 'play'; g.start = now; g.until = now + g.opts.time * 1000; g.clock = now;
    log(g, nick(g, g.regista) + ' (' + g.teams[teamOf(g)].name + ') racconta con le emoji un titolo ' + (item(g)[2] > 1 ? 'difficile' : 'facile') + ': ' + item(g)[1].toLowerCase() + '.', 'sys', g.regista);
    fx(g, { k: 'play', p: g.regista });
  }
  function score(g, p, steal, now) {
    var t = g.players[p].team, it = item(g), pts = it[2], bonus = !steal && now - g.start <= g.opts.time * 500 ? 1 : 0;
    g.teams[t].total += pts + bonus; g.players[p].guessed++;
    if (!steal) g.players[g.regista].told++;
    g.hit = { p: p, t: t, pts: pts + bonus, bonus: bonus, steal: !!steal };
    log(g, nick(g, p) + (steal ? ' ruba' : ' indovina') + ' «' + it[0] + '»: +' + (pts + bonus) + ' ai ' + g.teams[t].name + (bonus ? ' (con il bonus di velocità)' : '') + '.', steal ? 'steal' : 'hit', p);
    fx(g, { k: 'hit', p: p, t: t, steal: !!steal, pts: pts + bonus });
    reveal(g, now);
  }
  function reveal(g, now) {
    var it = item(g);
    g.hist.push({ turn: g.turn, p: g.regista, t: teamOf(g), item: g.item, clue: g.clue.slice(), hit: g.hit });
    g.teams.forEach(function (T, t) { T.hist.push(g.hit && g.hit.t === t ? g.hit.pts : 0); });
    if (!g.hit) { log(g, 'Nessuno ha indovinato «' + it[0] + '».', 'miss'); fx(g, { k: 'miss' }); }
    g.phase = 'reveal'; g.until = now + REVEAL_MS; g.clock = now; g.turnN++;
  }
  function finish(g, now) {
    g.phase = 'over'; g.until = 0; g.clock = now; g.regista = null;
    var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return g.teams[b].total - g.teams[a].total || a - b; });
    var place = g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
    g.winners = order.filter(function (t) { return place[t] === 1; });
    g.final = { order: order, place: place };
    log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (t) { return g.teams[t].name; }).join(' e ') : 'Vincono i ' + g.teams[g.winners[0]].name) + ' con ' + g.teams[g.winners[0]].total + ' punti.', 'win');
    fx(g, { k: 'over', t: g.winners[0] });
  }
  // l'host la chiama ogni mezzo secondo
  function tick(g, now) {
    if (g.phase === 'over' || now < g.until) return false;
    if (g.phase === 'pick') { choose(g, 0, now); g.seq++; return true; }
    if (g.phase === 'play') {
      var others = g.players.some(function (P) { return P.team !== teamOf(g); });
      if (others) { g.phase = 'steal'; g.until = now + STEAL_MS; g.clock = now; g.turnN++; log(g, 'Tempo! Le altre squadre possono rubare il titolo.', 'sys'); fx(g, { k: 'steal' }); }
      else reveal(g, now);
      g.seq++; return true;
    }
    if (g.phase === 'steal') { reveal(g, now); g.seq++; return true; }
    if (g.phase === 'reveal') { nextTurn(g, now); g.seq++; return true; }
    return false;
  }
  // chi può scrivere risposte adesso
  function canGuess(g, p) {
    var P = g.players[p]; if (!P || p === g.regista) return false;
    if (g.phase === 'play') return P.team === teamOf(g);
    if (g.phase === 'steal') return P.team !== teamOf(g);
    return false;
  }
  function pending(g) { return g.phase === 'pick' ? [g.regista] : []; }
  function decider() { return null; }   // si gioca a tempo

  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function doAct(g, p, a, now) {
    var reg = p === g.regista;
    if (a.a === 'pick') {
      if (g.phase !== 'pick') return 'Il titolo è già stato scelto.';
      if (!reg) return 'Sceglie il regista.';
      var i = +a.i; if (i !== 0 && i !== 1) return 'Scegli uno dei due titoli.';
      choose(g, i, now); return null;
    }
    if (a.a === 'emo' || a.a === 'undo' || a.a === 'clear' || a.a === 'skip' || a.a === 'mark') {
      if (!reg) return 'Solo il regista racconta con le emoji.';
      if (g.phase !== 'play') return 'Adesso non si possono cambiare le emoji.';
      if (a.a === 'emo') {
        if (!isEmoji(a.e)) return 'Solo emoji, niente lettere né numeri!';
        if (g.clue.length >= MAXCLUE) return 'Al massimo ' + MAXCLUE + ' emoji.';
        g.clue.push(a.e); return null;
      }
      if (a.a === 'undo') { g.clue.pop(); return null; }
      if (a.a === 'clear') { g.clue = []; return null; }
      if (a.a === 'skip') {
        if (g.skips <= 0) return 'Hai già cambiato titolo in questo turno.';
        g.skips--; var lvl = item(g)[2];
        g.usedQ.pop(); g.item = draw(g, lvl, g.item); g.usedQ.push(item(g)[0]); g.clue = []; g.guesses = [];
        log(g, nick(g, p) + ' cambia titolo.', 'sys', p); fx(g, { k: 'skip' }); return null;
      }
      var gi = Math.floor(+a.i), gu = g.guesses[gi];
      if (!gu) return 'Risposta sconosciuta.';
      gu.m = a.m === 'hot' || a.m === 'cold' ? (gu.m === a.m ? null : a.m) : null; return null;
    }
    if (a.a === 'guess') {
      if (!canGuess(g, p)) return reg ? 'Il regista non indovina!' : g.phase === 'steal' ? 'Adesso possono rispondere solo le altre squadre.' : g.phase === 'play' ? 'Adesso risponde la squadra del regista: se non indovina, potrete rubare.' : 'Adesso non si risponde.';
      var t = String(a.t == null ? '' : a.t).replace(/[\u0000-\u001f<>]/g, ' ').replace(/\s+/g, ' ').trim().slice(0, MAXGUESS);
      if (!norm(t)) return 'Scrivi una risposta.';
      var it = item(g);
      if (right(t, it)) { g.guesses.push({ p: p, t: t, ok: true }); score(g, p, g.phase === 'steal', now); return null; }
      g.guesses.push({ p: p, t: t, ok: false, near: near(t, it) });
      if (g.guesses.length > 40) g.guesses.splice(0, g.guesses.length - 40);
      fx(g, { k: 'guess', p: p });
      return null;
    }
    return 'Mossa non valida.';
  }
  // l'host salta l'attesa dei risultati
  function forceNext(g, now) {
    now = now || Date.now();
    if (g.phase === 'reveal') { nextTurn(g, now); g.seq++; return true; }
    return false;
  }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, canGuess: canGuess, members: members, item: item, teamOf: teamOf,
    norm: norm, right: right, near: near, isEmoji: isEmoji, lev: lev, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, PICK_MS: PICK_MS, STEAL_MS: STEAL_MS, REVEAL_MS: REVEAL_MS, MAXCLUE: MAXCLUE, D: D };
})();
if (typeof module !== 'undefined') module.exports = ESEngine;
