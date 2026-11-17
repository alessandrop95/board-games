/* ===== Disegna e indovina: motore delle regole (gira sull'host; lo stato è JSON) =====
   Modalità (opts.mode):
   - teams  «A squadre»: a turno uno disegna e i compagni indovinano; se il tempo finisce le altre squadre
            hanno 12 secondi per rubare la parola.
   - ffa    «Tutti contro tutti»: niente squadre; chiunque indovini per primo prende i punti, e anche chi disegna.
   - relay  «Staffetta»: a squadre, ma ogni 10 secondi la penna passa al compagno successivo, che vede la parola
            solo quando la riceve; indovina chi non ha ancora disegnato.
   - blind  «Indovina tu per me»: un avversario sceglie la parola e scrive fino a 3 parole di aiuto; chi disegna
            vede solo gli aiuti (non la parola) e indovinano lui e i compagni. Niente furto.
   - chain  «Telefono senza fili»: tutti insieme; ognuno disegna la sua parola, il vicino scrive cosa vede, il
            successivo disegna quella scritta… Alla fine si rivedono le catene. Un punto a chi scrive la parola
            di partenza giusta e a chi l'ha disegnata.
   Regole che si aggiungono (opts): line (una linea sola), mono (un colore, niente gomma), dark (a occhi chiusi:
   chi disegna non vede il disegno), hand (con la mano sbagliata: promemoria d'onore), shrink (il tempo scende di
   20 secondi a ogni giro), bet (scommessa: chi disegna punta 1, 2 o 3 punti; se nessuno indovina li perde).
   Le parole difficili valgono 2 punti, le facili 1; indovinata entro metà del tempo: +1.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var DGEngine = (function () {
  var D = (typeof DGData !== 'undefined') ? DGData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var CHOOSE_MS = 15000, STEAL_MS = 12000, REVEAL_MS = 5000, HINT_MS = 45000, RELAY_MS = 10000, WRITE_MS = 35000, SHOW_MS = 3800, MAXPTS = 2600, MAXSTROKES = 400;
  var MODES = ['teams', 'ffa', 'relay', 'blind', 'chain'];
  var MODE_NAME = { teams: 'A squadre', ffa: 'Tutti contro tutti', relay: 'Staffetta', blind: 'Indovina tu per me', chain: 'Telefono senza fili' };
  var RULES = ['line', 'mono', 'dark', 'hand', 'shrink', 'bet'];
  var RULE_NAME = { line: 'Una linea sola', mono: 'Un colore, niente gomma', dark: 'A occhi chiusi', hand: 'Con la mano sbagliata', shrink: 'Tempo che si accorcia', bet: 'Scommessa' };
  var OPT = { rounds: [1, 2, 3], time: [60, 80, 100, 120], teams: [2, 3, 4] };
  var INK = '#1d2333';

  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    t = t.replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    t = t.replace(/^(l'|un'|il |lo |la |i |gli |le |un |uno |una )/, '');
    return t.replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }
  // distanza tra parole: lettere in più, in meno, cambiate o scambiate di posto («elefnate») contano 1
  function lev(a, b) {
    var d = [], i, j;
    for (i = 0; i <= a.length; i++) { d[i] = [i]; }
    for (j = 0; j <= b.length; j++) d[0][j] = j;
    for (i = 1; i <= a.length; i++) for (j = 1; j <= b.length; j++) {
      d[i][j] = Math.min(d[i - 1][j] + 1, d[i][j - 1] + 1, d[i - 1][j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1));
      if (i > 1 && j > 1 && a[i - 1] === b[j - 2] && a[i - 2] === b[j - 1]) d[i][j] = Math.min(d[i][j], d[i - 2][j - 2] + 1);
    }
    return d[a.length][b.length];
  }
  // giusta: uguale (senza spazi), con un errore di battitura nelle parole lunghe, o al plurale/singolare
  function right(guess, word) {
    var a = norm(guess).replace(/ /g, ''), b = norm(word).replace(/ /g, '');
    if (!a) return false; if (a === b) return true;
    if (b.length >= 5 && lev(a, b) <= (b.length >= 22 ? 3 : b.length >= 13 ? 2 : 1)) return true;
    return a.length >= 4 && a.slice(0, -1) === b.slice(0, -1);
  }
  function near(guess, word) { var a = norm(guess).replace(/ /g, ''), b = norm(word).replace(/ /g, ''); return !!a && !right(guess, word) && (lev(a, b) <= 2 || (a.length >= 4 && b.indexOf(a) >= 0)); }

  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  function humans(g, t) { return members(g, t).filter(function (i) { return !g.players[i].bot || g.players[i].away; }); }
  function teamed(mode) { return mode === 'teams' || mode === 'relay' || mode === 'blind'; }
  function cleanOpts(opts) {
    opts = opts || {};
    var o = { rounds: pick(OPT.rounds, opts.rounds, 2), time: pick(OPT.time, opts.time, 80), teams: pick(OPT.teams, opts.teams, 2), mode: MODES.indexOf(opts.mode) >= 0 ? opts.mode : 'teams' };
    RULES.forEach(function (r) { o[r] = !!opts[r]; });
    if (o.mode === 'chain') o.bet = false;
    return o;
  }

  // controllo prima di iniziare
  function checkSeats(seats, n, opts) {
    var mode = opts && MODES.indexOf(opts.mode) >= 0 ? opts.mode : 'teams';
    var people = seats.filter(function (s) { return !s.bot; }).length;
    if (mode === 'chain') return people < 3 ? 'Il telefono senza fili si gioca tra persone: servono almeno 3 persone (i giocatori automatici guardano).' : null;
    if (mode === 'ffa') {
      if (seats.length < 2) return 'Servono almeno 2 giocatori.';
      return people ? null : 'Serve almeno una persona che disegni.';
    }
    var by = {}; seats.forEach(function (s) { var t = +s.team || 0; (by[t] = by[t] || []).push(s); });
    var ts = Object.keys(by);
    if (ts.length < 2) return 'Servono almeno due squadre.';
    for (var i = 0; i < ts.length; i++) {
      if (by[ts[i]].length < 2) return 'Ogni squadra ha bisogno di almeno 2 giocatori (anche automatici): uno disegna e l’altro indovina.';
    }
    if (!people) return 'Serve almeno una persona che disegni.';
    return null;
  }
  // seen: parole uscite nelle partite precedenti a questo tavolo (o su questo telefono), da non riproporre
  function newGame(seats, opts, now, seen) {
    now = now || Date.now();
    var o = cleanOpts(opts), teamsMode = teamed(o.mode), teams, team;
    if (o.mode === 'chain') seats = seats.filter(function (s) { return !s.bot; });
    if (teamsMode) {
      var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < o.teams && t === Math.floor(t) ? t : i % o.teams; });
      var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
      teams = used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], total: 0 }; });
      team = function (i) { return used.indexOf(want[i]); };
    } else {   // tutti contro tutti e telefono: ognuno è una «squadra» da solo
      teams = seats.map(function (s, i) { return { name: s.nick, col: i, pc: true, total: 0 }; });
      team = function (i) { return i; };
    }
    var g = {
      v: 1, phase: 'choose', seq: 0, turnN: 0, round: 0, turn: -1, clock: now, opts: o, teams: teams,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: team(i) }; }),
      order: [], drawer: null, choices: null, word: null, pts: 0, bet: 1, until: 0, start: 0, pic: { t: 0, v: 0, s: [] }, guesses: [], hit: null,
      words: [], offered: [], avoid: (seen || []).slice(-300), relay: null, hinter: null, clues: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    if (o.mode === 'chain') { startChain(g, now); return g; }
    g.order = makeOrder(g);
    nextTurn(g, now);
    return g;
  }
  // l'ordine dei turni: un giro = ogni persona disegna una volta; le squadre si alternano
  function makeOrder(g) {
    var out = [], hs;
    if (!teamed(g.opts.mode)) hs = [g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].bot; })];
    else hs = g.teams.map(function (T, t) { return members(g, t).filter(function (i) { return !g.players[i].bot; }); });
    var max = Math.max.apply(null, hs.map(function (h) { return h.length; }));
    for (var r = 0; r < g.opts.rounds; r++) for (var k = 0; k < max; k++) hs.forEach(function (h) { if (k < h.length) out.push({ p: h[k], r: r + 1 }); });
    return out;
  }
  function draw(g, kind) {
    var key = kind === 'h' ? 'h' : 'e';
    var L = key === 'h' ? D.HARD : D.EASY, off = g.offered || [], av = g.avoid || [];
    var pool = L.filter(function (w) { return off.indexOf(w) < 0 && av.indexOf(w) < 0; });
    if (!pool.length) pool = L.filter(function (w) { return off.indexOf(w) < 0; });
    if (!pool.length) { g.offered = []; pool = L; }
    var w = pool[Math.floor(rand() * pool.length)];
    (g.offered || (g.offered = [])).push(w);
    return w;
  }
  // il tempo per disegnare: con «Tempo che si accorcia» scende di 20 secondi a ogni giro (minimo 30)
  function drawTime(g, round) { var r = round == null ? g.round : round; return g.opts.shrink ? Math.max(30, g.opts.time - (r - 1) * 20) : g.opts.time; }
  // chi suggerisce in «Indovina tu per me»: a rotazione, una persona di un'altra squadra
  function pickHinter(g, drawer) {
    var t = g.players[drawer].team, cand = g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team !== t && !g.players[i].bot; });
    if (!cand.length) return null;
    return cand[(g.turn + Math.floor(g.turn / Math.max(1, cand.length))) % cand.length];
  }
  function nextTurn(g, now) {
    g.turn++;
    if (g.turn >= g.order.length) { finish(g); return; }
    var o = g.order[g.turn];
    g.round = o.r; g.drawer = o.p; g.phase = 'choose'; g.choices = [draw(g, 'e'), draw(g, 'h')]; g.word = null; g.pts = 0; g.hit = null; g.bet = 1; g.relay = null; g.clues = null; g.hinter = null;
    // numero del disegno unico anche tra una partita e l'altra (così un disegno vecchio non torna)
    g.pic = { t: (Math.floor(now) % 1000000000) * 10 + (g.turn % 10) + 1, v: 0, s: [] }; g.guesses = [];
    g.until = now + CHOOSE_MS; g.clock = now; g.turnN++;
    if (g.opts.mode === 'blind') {
      g.hinter = pickHinter(g, o.p);
      g.phase = 'hint'; g.until = now + (g.hinter == null ? 1500 : HINT_MS);
    }
    fx(g, { k: 'turn', p: o.p, t: g.players[o.p].team, turn: g.turn, hinter: g.hinter });
  }
  function startDraw(g, now) {
    g.phase = 'draw'; g.start = now; g.until = now + drawTime(g) * 1000; g.clock = now;
    if (g.opts.mode === 'relay') {
      var t = g.players[g.drawer].team, hs = members(g, t).filter(function (i) { return !g.players[i].bot; });
      var k = hs.indexOf(g.drawer), list = hs.slice(k).concat(hs.slice(0, k)), hasBot = members(g, t).some(function (i) { return g.players[i].bot; });
      g.relay = { list: list, k: 0, seen: [g.drawer], next: now + RELAY_MS, max: Math.max(1, hasBot ? list.length : list.length - 1) };
    }
    fx(g, { k: 'draw', p: g.drawer });
  }
  function choose(g, i, now, bet) {
    g.word = g.choices[i]; g.pts = i ? 2 : 1; g.words.push(g.word);
    if (g.opts.bet && bet != null) g.bet = Math.max(1, Math.min(3, +bet || 1));
    log(g, nick(g, g.drawer) + ' disegna una parola ' + (i ? 'difficile' : 'facile') + (g.opts.bet ? ' e punta ' + g.bet + (g.bet > 1 ? ' punti' : ' punto') : '') + '.', 'sys', g.drawer);
    startDraw(g, now);
  }
  // «Indovina tu per me»: gli aiuti non devono contenere la parola (né un suo pezzo)
  function clueOk(c, word) {
    var a = norm(c).replace(/ /g, ''), parts = norm(word).split(' ').filter(function (x) { return x.length >= 3; });
    if (!a) return false;
    if (right(c, word) || near(c, word)) return false;
    return !parts.some(function (x) { return a.indexOf(x.slice(0, Math.max(3, x.length - 2))) >= 0 || (a.length >= 4 && x.indexOf(a) >= 0); });
  }
  function autoClues(word) { var w = norm(word); return ['inizia per ' + w.charAt(0).toUpperCase(), w.replace(/ /g, '').length + ' lettere' + (w.indexOf(' ') >= 0 ? ', ' + w.split(' ').length + ' parole' : '')]; }
  function giveHint(g, i, clues, now) {
    g.word = g.choices[i ? 1 : 0]; g.pts = i ? 2 : 1; g.words.push(g.word); g.clues = clues;
    log(g, (g.hinter != null ? nick(g, g.hinter) + ' sceglie una parola ' + (i ? 'difficile' : 'facile') + ' e lascia ' + clues.length + (clues.length > 1 ? ' aiuti' : ' aiuto') : 'Gli aiuti arrivano dal gioco') + ' per ' + nick(g, g.drawer) + '.', 'sys', g.hinter);
    startDraw(g, now);
  }
  function addTo(g, t, pts) { g.teams[t].total = Math.max(0, g.teams[t].total + pts); }
  function score(g, p, steal, now) {
    var m = g.opts.mode, t = g.players[p].team, dt = g.players[g.drawer].team;
    var bonus = !steal && now - g.start < drawTime(g) * 500 ? 1 : 0;
    var base = g.opts.bet ? g.bet + (g.pts > 1 ? 1 : 0) : g.pts, pts = base + bonus;
    if (m === 'ffa') {
      addTo(g, t, pts);
      var dp = g.opts.bet ? g.bet : g.pts; addTo(g, dt, dp);
      g.hit = { p: p, t: t, pts: pts, steal: false, dp: dp };
    } else {
      addTo(g, t, pts);
      if (steal && g.opts.bet) addTo(g, dt, -g.bet);
      g.hit = { p: p, t: t, pts: pts, steal: !!steal };
    }
    g.phase = 'reveal'; g.until = now + REVEAL_MS; g.clock = now;
    log(g, nick(g, p) + (steal ? ' ruba' : ' indovina') + ' «' + g.word + '»: +' + pts + (m === 'ffa' ? ' a ' + nick(g, p) + ' e +' + g.hit.dp + ' a ' + nick(g, g.drawer) : ' ai ' + g.teams[t].name) + '.', steal ? 'steal' : 'hit', p);
    fx(g, { k: 'hit', p: p, t: t, pts: pts, steal: !!steal, word: g.word });
  }
  function missed(g, now) {
    g.hit = null; g.phase = 'reveal'; g.until = now + REVEAL_MS; g.clock = now;
    var lost = g.opts.bet && g.drawer != null ? g.bet : 0;
    if (lost) addTo(g, g.players[g.drawer].team, -lost);
    log(g, 'Nessuno ha indovinato «' + g.word + '»' + (lost ? ': ' + (g.opts.mode === 'ffa' ? nick(g, g.drawer) : 'i ' + g.teams[g.players[g.drawer].team].name) + ' perdono la scommessa (−' + lost + ').' : '.'), 'miss');
    fx(g, { k: 'miss', word: g.word, lost: lost });
  }
  function finish(g) {
    var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return g.teams[b].total - g.teams[a].total || a - b; });
    var place = g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
    g.winners = order.filter(function (t) { return place[t] === 1; }); g.final = { order: order, place: place };
    g.phase = 'over'; g.drawer = null;
    var art = teamed(g.opts.mode) ? 'i ' : '';
    log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (t) { return art + g.teams[t].name; }).join(' e ') : 'Vince' + (art ? 'no ' : ' ') + art + g.teams[g.winners[0]].name) + ' con ' + g.teams[g.winners[0]].total + ' punti.', 'win');
    fx(g, { k: 'over', t: g.winners[0] });
  }
  // staffetta: la penna passa al compagno successivo
  function passPen(g, now) {
    var R = g.relay; R.k = (R.k + 1) % R.max;
    var p = R.list[R.k]; g.drawer = p; if (R.seen.indexOf(p) < 0) R.seen.push(p);
    R.next = now + RELAY_MS; g.pic.v = (g.pic.v || 0) + 1;
    fx(g, { k: 'relay', p: p });
  }
  function tick(g, now) {
    if (g.phase === 'over') return false;
    if (g.opts.mode === 'chain') return tickChain(g, now);
    if (g.phase === 'draw' && g.relay && g.relay.max > 1 && now >= g.relay.next && now < g.until) { passPen(g, now); g.seq++; return true; }
    if (now < g.until) return false;
    if (g.phase === 'choose') choose(g, 0, now);
    else if (g.phase === 'hint') giveHint(g, 0, autoClues(g.choices[0]), now);
    else if (g.phase === 'draw') {
      if (g.opts.mode === 'teams' || g.opts.mode === 'relay') { g.phase = 'steal'; g.until = now + STEAL_MS; g.clock = now; fx(g, { k: 'steal', t: g.players[g.drawer].team }); }
      else missed(g, now);
    } else if (g.phase === 'steal') missed(g, now);
    else if (g.phase === 'reveal') nextTurn(g, now);
    g.seq++;
    return true;
  }
  // chi può scrivere le risposte adesso
  function canGuess(g, p) {
    if (g.opts.mode === 'chain' || g.drawer == null || !g.players[p]) return false;
    var m = g.opts.mode, dt = g.players[g.drawer].team, t = g.players[p].team;
    if (g.phase === 'draw') {
      if (m === 'ffa') return p !== g.drawer;
      if (m === 'blind') return t === dt;   // anche chi disegna: la parola non la sa
      if (p === g.drawer) return false;
      if (m === 'relay' && g.relay && g.relay.seen.indexOf(p) >= 0) return false;
      return t === dt;
    }
    if (g.phase === 'steal') return t !== dt;
    return false;
  }
  // chi vede la parola adesso
  function knows(g, p) {
    if (p < 0 || !g.players[p] || g.word == null) return false;
    if (g.phase === 'reveal' || g.phase === 'over') return true;
    var m = g.opts.mode, dt = g.drawer != null ? g.players[g.drawer].team : -1;
    if (m === 'blind') return g.players[p].team !== dt;
    if (m === 'relay') return !!g.relay && g.relay.seen.indexOf(p) >= 0;
    return p === g.drawer;
  }
  function decider() { return null; }
  function pending(g) { if (g.opts && g.opts.mode === 'chain' && g.phase === 'chain') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.chain.done[i]; }); return []; }

  /* ---------- Telefono senza fili ---------- */
  // i disegni della catena restano nello stato fino alla fine: si salvano compatti (tratti semplificati,
  // coordinate in base 36 con due caratteri)
  var COLS = ['#1d2333', '#e0402c', '#3d8bfd', '#2fb36d', '#f2b705', '#8a5a22', '#ef7aa8', '#9a5cf0', '#fffdf6'];
  function b36(n) { var s = Math.max(0, Math.min(1295, Math.round(n))).toString(36); return s.length < 2 ? '0' + s : s; }
  function pack(strokes, limit) {
    var out = [], budget = limit || 600;
    (strokes || []).slice(0, 200).forEach(function (s) {
      if (!Array.isArray(s) || s.length < 4 || budget <= 0) return;
      var ci = COLS.indexOf(String(s[0]).toLowerCase()); if (ci < 0) ci = 0;
      var w = Math.max(1, Math.min(60, Math.round(+s[1] || 6))), pts = b36(s[2]) + b36(s[3]), lx = +s[2], ly = +s[3];
      for (var i = 4; i + 1 < s.length && budget > 0; i += 2) {
        var x = +s[i], y = +s[i + 1];
        if (Math.abs(x - lx) + Math.abs(y - ly) < 7 && i + 2 < s.length) continue;
        pts += b36(x) + b36(y); lx = x; ly = y; budget--;
      }
      out.push(ci + ':' + w + ':' + pts);
    });
    return out;
  }
  function unpack(packed) {
    return (packed || []).map(function (p) {
      var a = String(p).split(':'); if (a.length < 3) return null;
      var s = [COLS[+a[0]] || COLS[0], +a[1] || 6], d = a[2];
      for (var i = 0; i + 3 < d.length; i += 4) s.push(parseInt(d.substr(i, 2), 36), parseInt(d.substr(i + 2, 2), 36));
      return s.length >= 4 ? s : null;
    }).filter(Boolean);
  }
  function chainTime(g, k) { return k % 2 ? WRITE_MS : (g.opts.shrink ? Math.max(30, g.opts.time - Math.floor(k / 2) * 20) : g.opts.time) * 1000; }
  // al passo k il giocatore p lavora sulla catena (p - k) mod n
  function chainOf(g, p, k) { var n = g.players.length; return ((p - (k == null ? g.chain.k : k)) % n + n) % n; }
  function startChain(g, now) {
    var n = g.players.length, steps = Math.min(n, 6);
    g.order = [];
    g.chain = { k: 0, steps: steps, done: {}, list: g.players.map(function () { return { w: draw(g, rand() < .65 ? 'e' : 'h'), it: [] }; }) };
    g.chain.list.forEach(function (c) { g.words.push(c.w); });
    g.phase = 'chain'; g.round = 1; g.start = now; g.until = now + chainTime(g, 0); g.clock = now; g.turnN++;
    log(g, 'Telefono senza fili: ognuno disegna la sua parola segreta.', 'sys');
    fx(g, { k: 'chain', step: 0 });
  }
  // cosa deve fare adesso il giocatore p: disegnare un testo o scrivere cosa vede in un disegno
  function chainTask(g, p) {
    if (g.phase !== 'chain' || !g.players[p]) return null;
    var k = g.chain.k, c = g.chain.list[chainOf(g, p, k)], prev = c.it[k - 1];
    if (k % 2 === 0) return { kind: 'draw', text: k === 0 ? c.w : (prev && prev.w) || '…', done: !!g.chain.done[p] };
    return { kind: 'write', pic: prev ? prev.s : [], done: !!g.chain.done[p] };
  }
  function chainStep(g, now) {
    var C = g.chain, k = C.k;
    g.players.forEach(function (P, p) {
      var c = C.list[chainOf(g, p, k)];
      if (!c.it[k]) c.it[k] = k % 2 ? { p: p, w: '' } : { p: p, s: [] };
    });
    C.k++; C.done = {};
    if (C.k >= C.steps) { showChains(g, now); return; }
    g.round = C.k + 1; g.start = now; g.until = now + chainTime(g, C.k); g.clock = now; g.turnN++;
    fx(g, { k: 'chain', step: C.k });
  }
  function showChains(g, now) {
    // punti: chi scrive esattamente la parola di partenza (+1) e chi ha fatto il disegno che ha capito (+1)
    g.chain.list.forEach(function (c) {
      c.it.forEach(function (x, j) {
        if (j % 2 === 1 && x.w && right(x.w, c.w)) { x.ok = true; addTo(g, g.players[x.p].team, 1); var d = c.it[j - 1]; if (d) { d.ok = true; addTo(g, g.players[d.p].team, 1); } }
      });
    });
    g.phase = 'show'; g.show = { c: 0, i: -1 }; g.until = now + SHOW_MS; g.clock = now;
    log(g, 'Si rivedono le catene!', 'sys');
    fx(g, { k: 'show' });
  }
  function tickChain(g, now) {
    if (g.phase === 'chain') {
      var all = g.players.every(function (P, p) { return g.chain.done[p]; });
      if (!all && now < g.until) return false;
      chainStep(g, now);
    } else if (g.phase === 'show') {
      if (now < g.until) return false;
      var S = g.show, c = g.chain.list[S.c];
      if (S.i < c.it.length - 1) S.i++;
      else if (S.c < g.chain.list.length - 1) { S.c++; S.i = -1; }
      else { finish(g); g.seq++; return true; }
      g.until = now + (S.i === -1 ? 2500 : SHOW_MS); g.clock = now;
    } else return false;
    g.seq++;
    return true;
  }

  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function cleanStroke(s, mono) {
    if (!Array.isArray(s) || s.length < 4) return null;
    var col = String(s[0]).slice(0, 9), w = Math.max(1, Math.min(60, +s[1] || 6)), out = [mono ? INK : /^#[0-9a-f]{3,8}$/i.test(col) ? col : '#222', mono ? Math.min(w, 18) : w];
    for (var i = 2; i + 1 < s.length && out.length < MAXPTS; i += 2) { out.push(Math.max(0, Math.min(1000, Math.round(+s[i] || 0)))); out.push(Math.max(0, Math.min(750, Math.round(+s[i + 1] || 0)))); }
    return out.length >= 4 ? out : null;
  }
  function cleanText(w, n) { return String(w == null ? '' : w).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, n || 40); }
  function doAct(g, p, a, now) {
    if (g.opts.mode === 'chain') return chainAct(g, p, a, now);
    if (now >= g.until && (g.phase === 'draw' || g.phase === 'steal' || g.phase === 'choose' || g.phase === 'hint')) { tick(g, now); if (a.a !== 'pic') return 'Tempo scaduto.'; }
    if (a.a === 'bet') {
      if (!g.opts.bet || p !== g.drawer || (g.phase !== 'choose' && g.phase !== 'hint')) return 'Adesso non si scommette.';
      g.bet = Math.max(1, Math.min(3, +a.b || 1)); return null;
    }
    if (a.a === 'choose') {
      if (g.phase !== 'choose' || p !== g.drawer) return 'Non tocca a te scegliere.';
      choose(g, +a.i ? 1 : 0, now, a.b); return null;
    }
    if (a.a === 'hint') {
      if (g.phase !== 'hint' || p !== g.hinter) return 'Non tocca a te dare gli aiuti.';
      var i = +a.i ? 1 : 0, word = g.choices[i];
      if (a.auto) { giveHint(g, i, autoClues(word), now); return null; }   // chi suggerisce è assente: aiuti automatici
      var cl = (Array.isArray(a.c) ? a.c : []).map(function (x) { return cleanText(x, 24); }).filter(Boolean);
      var nw = cl.reduce(function (s, x) { return s + x.split(' ').length; }, 0);
      if (!cl.length) return 'Scrivi almeno un aiuto.';
      if (nw > 3) return 'Al massimo 3 parole di aiuto in tutto.';
      for (var k = 0; k < cl.length; k++) if (!clueOk(cl[k], word)) return '«' + cl[k] + '» è troppo simile alla parola: scegline un altro.';
      giveHint(g, i, cl, now); return null;
    }
    if (a.a === 'pic') {
      // il disegno intero (chi disegna lo manda ogni tanto): così lo vede anche chi arriva dopo
      if (p !== g.drawer || (g.phase !== 'draw' && g.phase !== 'steal')) return 'Non stai disegnando.';
      if (+a.t !== g.pic.t || !Array.isArray(a.s)) return null;
      if ((+a.v || 0) < g.pic.v) return null;
      g.pic.v = +a.v || 0;
      var s = a.s.slice(0, MAXSTROKES).map(function (x) { return cleanStroke(x, g.opts.mono); }).filter(Boolean);
      if (g.opts.line) s = s.slice(0, 1);   // una linea sola: conta solo il primo tratto
      g.pic.s = s;
      return null;
    }
    if (a.a === 'guess') {
      if (!canGuess(g, p)) return g.phase === 'draw' ? 'Adesso indovina solo la squadra di chi disegna.' : 'Adesso non si indovina.';
      var w = cleanText(a.w); if (!w) return 'Scrivi una risposta.';
      if (right(w, g.word)) { score(g, p, g.phase === 'steal', now); return null; }
      g.guesses.push({ p: p, w: w, near: near(w, g.word) }); if (g.guesses.length > 40) g.guesses.splice(0, g.guesses.length - 40);
      return null;
    }
    if (a.a === 'skip') {
      if (p !== g.drawer || g.phase !== 'draw') return 'Non stai disegnando.';
      if (g.opts.mode === 'teams' || g.opts.mode === 'relay') { g.phase = 'steal'; g.until = now + STEAL_MS; fx(g, { k: 'steal', t: g.players[g.drawer].team }); }
      else missed(g, now);
      return null;
    }
    return 'Mossa sconosciuta.';
  }
  function chainAct(g, p, a, now) {
    if (g.phase !== 'chain') return 'Adesso si guardano le catene.';
    var task = chainTask(g, p); if (!task) return 'Non stai giocando.';
    if (task.done) return 'Hai già consegnato: aspetta gli altri.';
    var C = g.chain, c = C.list[chainOf(g, p, C.k)];
    if (a.a === 'cdraw') {
      if (task.kind !== 'draw') return 'Adesso si scrive.';
      var s = (Array.isArray(a.s) ? a.s : []).slice(0, MAXSTROKES).map(function (x) { return cleanStroke(x, g.opts.mono); }).filter(Boolean);
      if (g.opts.line) s = s.slice(0, 1);
      c.it[C.k] = { p: p, s: pack(s) };
    } else if (a.a === 'cwrite') {
      if (task.kind !== 'write') return 'Adesso si disegna.';
      var w = cleanText(a.w); if (!w) return 'Scrivi che cosa vedi.';
      c.it[C.k] = { p: p, w: w };
    } else return 'Mossa sconosciuta.';
    C.done[p] = 1;
    if (g.players.every(function (P, i) { return C.done[i]; })) chainStep(g, now);
    return null;
  }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, canGuess: canGuess, knows: knows, checkSeats: checkSeats, members: members, humans: humans,
    norm: norm, right: right, near: near, clueOk: clueOk, drawTime: drawTime, chainTask: chainTask, chainOf: chainOf, chainTime: chainTime, pack: pack, unpack: unpack, cleanOpts: cleanOpts, teamed: teamed,
    setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, MODES: MODES, MODE_NAME: MODE_NAME, RULES: RULES, RULE_NAME: RULE_NAME,
    STEAL_MS: STEAL_MS, REVEAL_MS: REVEAL_MS, CHOOSE_MS: CHOOSE_MS, HINT_MS: HINT_MS, RELAY_MS: RELAY_MS, WRITE_MS: WRITE_MS, SHOW_MS: SHOW_MS, D: D };
})();
if (typeof module !== 'undefined') module.exports = DGEngine;
