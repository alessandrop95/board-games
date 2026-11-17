/* ===== Sintonia: motore delle regole (gira sull'host; lo stato è JSON) =====
   A ogni manche esce un tema («Un frutto rosso») e ognuno scrive di nascosto una risposta, senza potersi
   mettere d'accordo. A squadre: per ogni gruppo di compagni che hanno scritto la stessa cosa la squadra prende
   tanti punti quanti sono i compagni del gruppo (almeno 2); se l'hanno scritta tutti, +2. Ognuno per sé: ogni
   giocatore prende un punto per ogni altro giocatore che ha scritto la sua stessa risposta.
   Le risposte uguali si riconoscono anche senza accenti, articoli e con un errore di battitura.
   Regole in più (opts.extra = sì): a ogni manche il gioco estrae una regola tra quelle scelte, diversa dalla
   precedente: punti doppi; pensa diverso (punti a chi scrive una risposta che nessun altro ha scritto); lettera
   obbligata; vietata la più ovvia; tempo lampo (10 secondi); il capitano (contano i compagni che scrivono la stessa
   risposta del capitano estratto; ognuno per sé: chi scrive come il «bersaglio»); tutto o niente.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var STEngine = (function () {
  var D = (typeof STData !== 'undefined') ? STData : require('./data.js');
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TEAMS = [['Rossi', 0], ['Blu', 1], ['Verdi', 2], ['Gialli', 3]];
  var OPT = { rounds: [6, 8, 10, 12], time: [20, 30, 45], teams: [0, 2, 3, 4] }, SHOW_MS = 15000, FLASH_S = 10;
  var RULES = ['double', 'unique', 'letter', 'ban', 'flash', 'captain', 'all'];
  var RULE_NAME = { double: 'Punti doppi', unique: 'Pensa diverso', letter: 'Lettera obbligata', ban: 'Vietata la più ovvia', flash: 'Tempo lampo', captain: 'Il capitano', all: 'Tutto o niente' };
  function norm(s) {
    var t = String(s == null ? '' : s).toLowerCase();
    if (t.normalize) t = t.normalize('NFD').replace(/[̀-ͯ]/g, '');
    t = t.replace(/[’`´]/g, "'").replace(/\s+/g, ' ').trim();
    t = t.replace(/^(l'|un'|il |lo |la |i |gli |le |un |uno |una |dei |delle |degli )/, '');
    return t.replace(/[^a-z ]/g, '').replace(/\s+/g, ' ').trim();
  }
  function lev(a, b) {
    if (Math.abs(a.length - b.length) > 1) return 2;
    var prev = [], cur, i, j; for (j = 0; j <= b.length; j++) prev[j] = j;
    for (i = 1; i <= a.length; i++) { cur = [i]; for (j = 1; j <= b.length; j++) cur[j] = Math.min(prev[j] + 1, cur[j - 1] + 1, prev[j - 1] + (a[i - 1] === b[j - 1] ? 0 : 1)); prev = cur; }
    return prev[b.length];
  }
  // la stessa risposta: uguale senza spazi, singolare/plurale o un errore di battitura nelle parole lunghe
  function same(a, b) {
    a = norm(a).replace(/ /g, ''); b = norm(b).replace(/ /g, '');
    if (!a || !b) return false; if (a === b) return true;
    if (a.length >= 4 && b.length >= 4 && a.slice(0, -1) === b.slice(0, -1)) return true;
    return Math.min(a.length, b.length) >= 5 && lev(a, b) <= 1;
  }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function makeTeams(seats, n) {
    if (!n) return { teams: seats.map(function (s, i) { return { name: s.nick, col: i % 8, total: 0, hist: [] }; }), of: seats.map(function (s, i) { return i; }) };
    var want = seats.map(function (s, i) { var t = +s.team; return t >= 0 && t < n && t === Math.floor(t) ? t : i % n; });
    var used = []; want.forEach(function (t) { if (used.indexOf(t) < 0) used.push(t); }); used.sort();
    return { teams: used.map(function (t) { return { name: TEAMS[t][0], col: TEAMS[t][1], total: 0, hist: [] }; }), of: want.map(function (t) { return used.indexOf(t); }) };
  }
  function members(g, t) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].team === t; }); }
  // seen: temi usciti nelle partite precedenti a questo tavolo (o su questo telefono), da non riproporre
  function newGame(seats, opts, now, seen) {
    opts = opts || {}; now = now || Date.now();
    var o = { rounds: pick(OPT.rounds, opts.rounds, 8), time: pick(OPT.time, opts.time, 30), teams: pick(OPT.teams, opts.teams == null ? 2 : opts.teams, 2), extra: !!opts.extra };
    RULES.forEach(function (r) { o[r] = !!opts[r]; });
    var tm = makeTeams(seats, o.teams);
    var g = {
      v: 1, phase: 'write', seq: 0, turnN: 0, round: 0, clock: now, opts: o, teams: tm.teams,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, team: tm.of[i], ans: null, ready: false, total: 0 }; }),
      deck: freshDeck(seen), theme: null, until: 0, res: null, rule: null, rd: null, log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    startRound(g, now);
    return g;
  }
  function freshDeck(seen) {
    var all = D.LIST.map(function (x, i) { return i; }), s = seen || [];
    var d = all.filter(function (i) { return s.indexOf(D.LIST[i].q) < 0; });
    return shuffle(d.length >= 20 ? d : all);
  }
  function startRound(g, now) {
    g.round++; g.phase = 'write'; g.res = null;
    if (!g.deck.length) g.deck = freshDeck();
    g.theme = g.deck.pop(); (g.usedQ || (g.usedQ = [])).push(D.LIST[g.theme].q);
    g.players.forEach(function (P) { P.ans = null; P.ready = false; });
    newRule(g);
    g.until = now + answerTime(g) * 1000; g.clock = now; g.turnN++;
    log(g, 'Manche ' + g.round + ': «' + D.LIST[g.theme].q + '»' + (g.rule ? ' · regola: ' + RULE_NAME[g.rule] : '') + '.', 'sys');
    fx(g, { k: 'theme', round: g.round, q: D.LIST[g.theme].q, rule: g.rule });
  }
  /* ---------- regole in più ---------- */
  function on(g, r) { return !!(g && g.opts && g.opts.extra && g.rule === r); }
  function rulePool(o) { var p = RULES.filter(function (r) { return o[r]; }); return p.length ? p : RULES.slice(); }
  function answerTime(g) { return on(g, 'flash') ? FLASH_S : g.opts.time; }
  function letterOf(w) { return norm(w).replace(/ /g, '').charAt(0).toUpperCase(); }
  function newRule(g) {
    g.rd = null;
    if (!g.opts.extra) { g.rule = null; return; }
    var p = rulePool(g.opts), c = p.filter(function (r) { return r !== g.rule; }); if (!c.length) c = p;
    g.rule = c[Math.floor(rand() * c.length)];
    var A = D.LIST[g.theme].a;
    if (g.rule === 'letter') g.rd = { l: letterOf(A[Math.floor(rand() * Math.min(4, A.length))]) };
    else if (g.rule === 'ban') g.rd = { w: A[0] };
    else if (g.rule === 'captain') {
      if (g.opts.teams) g.rd = { caps: g.teams.map(function (T, t) { var ms = members(g, t); return ms[Math.floor(rand() * ms.length)]; }) };
      else g.rd = { target: Math.floor(rand() * g.players.length) };
    }
  }
  // la risposta va bene con la regola di questa manche?
  function ruleError(g, w) {
    if (on(g, 'letter') && letterOf(w) !== g.rd.l) return 'Con la «Lettera obbligata» la risposta deve iniziare con la ' + g.rd.l + '.';
    if (on(g, 'ban') && same(w, g.rd.w)) return '«' + g.rd.w + '» è vietata in questa manche: è la risposta più ovvia!';
    return null;
  }
  // gruppi di risposte uguali dentro un insieme di giocatori
  function groups(g, ps) {
    var out = [];
    ps.forEach(function (p) {
      var a = g.players[p].ans; if (!a) return;
      var gr = out.filter(function (x) { return same(x.w, a); })[0];
      if (gr) gr.ps.push(p); else out.push({ w: a, ps: [p] });
    });
    return out.sort(function (a, b) { return b.ps.length - a.ps.length; });
  }
  function reveal(g, now) {
    var res = { teams: [], players: g.players.map(function () { return 0; }), all: groups(g, g.players.map(function (P, i) { return i; })), rule: g.rule, rd: g.rd };
    var alone = function (p) { var x = res.all.filter(function (y) { return y.ps.indexOf(p) >= 0; })[0]; return !!x && x.ps.length === 1; };
    var mult = on(g, 'double') ? 2 : 1;
    if (g.opts.teams) {
      g.teams.forEach(function (T, t) {
        var ms = members(g, t), gs = groups(g, ms), pts = 0, full = ms.length >= 2 && gs.length === 1 && gs[0].ps.length === ms.length, extra = {};
        if (on(g, 'unique')) ms.forEach(function (p) { if (g.players[p].ans && alone(p)) pts += 2; });
        else if (on(g, 'all')) pts = full ? ms.length * 2 + 2 : 0;
        else if (on(g, 'captain')) {
          var cap = g.rd.caps[t], ca = g.players[cap].ans, n = ms.filter(function (p) { return p !== cap && ca && same(g.players[p].ans, ca); }).length;
          pts = n ? n + 1 + (n === ms.length - 1 ? 2 : 0) : 0; extra.cap = cap; extra.n = n;
        } else {
          gs.forEach(function (x) { if (x.ps.length >= 2) pts += x.ps.length; });
          if (full) pts += 2;
        }
        pts *= mult;
        res.teams.push({ pts: pts, groups: gs, full: full && !on(g, 'unique'), cap: extra.cap, n: extra.n });
        T.total += pts; T.hist.push(pts);
      });
    } else {
      var big = res.all.length ? res.all[0].ps.length : 0;
      res.all.forEach(function (x) {
        x.ps.forEach(function (p) {
          if (on(g, 'unique')) res.players[p] = x.ps.length === 1 ? 3 : 0;
          else if (on(g, 'all')) res.players[p] = x.ps.length >= 2 && x.ps.length === big ? x.ps.length : 0;
          else if (!on(g, 'captain')) res.players[p] = x.ps.length - 1;
        });
      });
      if (on(g, 'captain')) {
        var tg = g.rd.target, ta = g.players[tg].ans;
        g.players.forEach(function (P, p) { if (p !== tg && ta && same(P.ans, ta)) { res.players[p] = 2; res.players[tg] += 1; } });
      }
      res.players = res.players.map(function (x) { return x * mult; });
      g.teams.forEach(function (T, t) { var pts = res.players[t]; res.teams.push({ pts: pts }); T.total += pts; T.hist.push(pts); });
    }
    g.res = res; g.phase = 'show'; g.until = now + SHOW_MS; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = !!P.bot; });
    log(g, 'Risposte: ' + res.all.map(function (x) { return x.w + (x.ps.length > 1 ? ' ×' + x.ps.length : ''); }).join(', ') + '.', 'round');
    fx(g, { k: 'reveal', round: g.round });
  }
  function finish(g) {
    var order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return g.teams[b].total - g.teams[a].total || a - b; });
    var place = g.teams.map(function (T) { return 1 + g.teams.filter(function (U) { return U.total > T.total; }).length; });
    g.winners = order.filter(function (t) { return place[t] === 1; }); g.final = { order: order, place: place };
    g.phase = 'over';
    log(g, (g.winners.length > 1 ? 'Pari! ' : 'Vince ') + g.winners.map(function (t) { return g.teams[t].name; }).join(' e ') + ' con ' + g.teams[g.winners[0]].total + ' punti.', 'win');
    fx(g, { k: 'over', t: g.winners[0] });
  }
  function next(g, now) { if (g.round >= g.opts.rounds) finish(g); else { startRound(g, now); fx(g, { k: 'next' }); } }
  function tick(g, now) {
    if (now < g.until) return false;
    if (g.phase === 'write') reveal(g, now);
    else if (g.phase === 'show') next(g, now);
    else return false;
    g.seq++; return true;
  }
  function decider() { return null; }
  function pending(g) {
    if (g.phase === 'write') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ans; });
    if (g.phase === 'show') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    var P = g.players[p]; if (!P) return 'Non sei al tavolo.';
    if (g.phase === 'write') {
      if (a.a !== 'answer') return 'Adesso si scrive.';
      var w = String(a.w == null ? '' : a.w).replace(/[\u0000-\u001f<>]/g, '').replace(/\s+/g, ' ').trim().slice(0, 30);
      if (!norm(w)) return 'Scrivi una risposta.';
      var re = ruleError(g, w); if (re) return re;
      P.ans = w;
      fx(g, { k: 'answered', p: p });
      if (g.players.every(function (Q) { return Q.ans; })) reveal(g, now);
    } else if (g.phase === 'show') {
      if (a.a !== 'next') return 'Tocca «Avanti».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) next(g, now);
    } else return 'Mossa non valida.';
    g.seq++; g.clock = now;
    return null;
  }
  function forceNext(g, now) { now = now || Date.now(); if (g.phase === 'show') { next(g, now); g.seq++; return true; } if (g.phase === 'write') { reveal(g, now); g.seq++; return true; } return false; }
  return { on: on, rulePool: rulePool, ruleError: ruleError, answerTime: answerTime, letterOf: letterOf, RULES: RULES, RULE_NAME: RULE_NAME, FLASH_S: FLASH_S, newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, groups: groups, members: members, norm: norm, same: same, setRandom: setRandom, shuffle: shuffle, TEAMS: TEAMS, OPT: OPT, D: D };
})();
if (typeof module !== 'undefined') module.exports = STEngine;
