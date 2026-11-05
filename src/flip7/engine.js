/* ===== Flip 7: motore delle regole (gira sull'host; lo stato è JSON) =====
   94 carte: un solo 0, poi tante copie quanto il valore (un 1, due 2 … dodici 12), i modificatori +2 +4 +6 +8 +10 e ×2,
   e tre copie di ognuna delle azioni: Congela (FRZ), Flip Three (F3) e Seconda possibilità (SC).
   A ogni manche il mazziere dà una carta scoperta a testa, poi a turno ognuno sceglie se pescare ancora o fermarsi.
   Un numero doppio fa sballare (zero punti), a meno di avere una Seconda possibilità. Sette numeri diversi: Flip 7!
   La manche finisce subito e chi ci è riuscito prende 15 punti in più. Si gioca fino a 200 punti: vince chi ne ha di più.
   Le carte usate restano fuori dal mazzo fino a quando non finisce: solo allora si rimescolano. */
var F7Engine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var MODS = ['+2', '+4', '+6', '+8', '+10', 'x2'], ACTS = ['FRZ', 'F3', 'SC'];
  function fullDeck() {
    var d = [0], v, k;
    for (v = 1; v <= 12; v++) for (k = 0; k < v; k++) d.push(v);
    MODS.forEach(function (m) { d.push(m); });
    ACTS.forEach(function (a) { for (k = 0; k < 3; k++) d.push(a); });
    return d;
  }
  function isNum(c) { return typeof c === 'number'; }
  function isMod(c) { return MODS.indexOf(c) >= 0; }
  function isAct(c) { return ACTS.indexOf(c) >= 0; }
  var ANAME = { FRZ: 'Congela', F3: 'Flip Three', SC: 'Seconda possibilità' };
  function cname(c) { return isNum(c) ? String(c) : isMod(c) ? (c === 'x2' ? '×2' : c) : ANAME[c]; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }

  /* ---------- punteggio ---------- */
  function uniq(P) { return P.nums.length; }
  function score(P) {
    if (P.st === 'bust') return 0;
    var s = P.nums.reduce(function (a, b) { return a + b; }, 0);
    if (P.mods.indexOf('x2') >= 0) s *= 2;
    P.mods.forEach(function (m) { if (m !== 'x2') s += +m.slice(1); });
    if (P.st === 'flip7') s += 15;
    return s;
  }
  function active(P) { return P.st === 'in'; }
  function actives(g) { return g.players.map(function (P, i) { return active(P) ? i : -1; }).filter(function (i) { return i >= 0; }); }
  function nextActive(g, from) { var n = g.players.length; for (var k = 1; k <= n; k++) { var i = (from + k) % n; if (active(g.players[i])) return i; } return -1; }

  /* ---------- mazzo ---------- */
  function drawCard(g) {
    if (!g.deck.length) {
      if (!g.disc.length) return null;
      g.deck = shuffle(g.disc); g.disc = [];
      log(g, 'Il mazzo è finito: le carte delle manche passate vengono rimescolate (quelle sul tavolo restano dove sono).', 'sys');
      fx(g, { k: 'reshuffle' });
    }
    return g.deck.pop();
  }

  /* ---------- nuova partita e nuova manche ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var target = [100, 200, 300].indexOf(+opts.target) >= 0 ? +opts.target : 200;
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, round: 0,
      opts: { target: target },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, nums: [], mods: [], sc: false, st: 'in', total: 0, hist: [], ready: false, last: null }; }),
      deck: shuffle(fullDeck()), disc: [], dealer: Math.floor(rand() * seats.length), turn: 0,
      stage: 'deal', dealQ: [], todo: [], f3: null, choice: null, pass: false, ended: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null
    };
    startRound(g, true);
    return g;
  }
  function startRound(g, first) {
    g.round++; g.phase = 'play'; g.roundRes = null; g.stage = 'deal'; g.todo = []; g.f3 = null; g.choice = null; g.pass = false; g.ended = null;
    if (!first) g.dealer = (g.dealer + 1) % g.players.length;
    g.players.forEach(function (P) { P.nums = []; P.mods = []; P.sc = false; P.st = 'in'; P.ready = false; P.last = null; P.bustCard = null; });
    var n = g.players.length; g.dealQ = []; for (var k = 1; k <= n; k++) g.dealQ.push((g.dealer + k) % n);
    log(g, 'Manche ' + g.round + ': distribuisce ' + nick(g, g.dealer) + '. Una carta scoperta a testa.', 'sys', g.dealer);
    fx(g, { k: 'round', round: g.round, dealer: g.dealer });
    advance(g);
  }

  /* ---------- una carta arriva a un giocatore ---------- */
  // ctx: 'deal' (prima carta), 'hit' (ha chiesto carta), 'f3' (sta pescando le tre carte di Flip Three)
  function give(g, p, ctx) {
    var P = g.players[p], c = drawCard(g);
    if (c == null) { log(g, 'Non ci sono più carte da pescare: la manche finisce qui.', 'sys'); fx(g, { k: 'nocards' }); if (g.ended == null) g.ended = -1; return; }
    P.last = c;
    if (isNum(c)) {
      if (P.nums.indexOf(c) >= 0) {
        if (P.sc) {
          P.sc = false; g.disc.push(c, 'SC');
          fx(g, { k: 'save', p: p, c: c, ctx: ctx });
          log(g, nick(g, p) + ' pesca un altro ' + c + ', ma la Seconda possibilità lo salva: le due carte vanno via.', 'save', p);
          return;
        }
        P.st = 'bust'; P.bustCard = c;
        fx(g, { k: 'bust', p: p, c: c, ctx: ctx });
        log(g, nick(g, p) + ' pesca un secondo ' + c + ' e sballa! Niente punti in questa manche.', 'bust', p);
        if (g.f3 && g.f3.p === p) { g.f3.left = 0; g.f3.held.forEach(function (a) { g.disc.push(a); }); g.f3.held = []; }
        return;
      }
      P.nums.push(c);
      fx(g, { k: 'card', p: p, c: c, ctx: ctx });
      if (uniq(P) === 7) {
        P.st = 'flip7'; g.ended = p;
        fx(g, { k: 'flip7', p: p });
        log(g, nick(g, p) + ' fa FLIP 7! Sette numeri diversi: la manche finisce subito, +15 punti.', 'flip7', p);
      } else log(g, nick(g, p) + (ctx === 'deal' ? ' riceve un ' : ' pesca un ') + c + '.', 'card', p);
      return;
    }
    if (isMod(c)) {
      P.mods.push(c);
      fx(g, { k: 'card', p: p, c: c, ctx: ctx });
      log(g, nick(g, p) + (ctx === 'deal' ? ' riceve il modificatore ' : ' pesca il modificatore ') + cname(c) + '.', 'mod', p);
      return;
    }
    // azioni
    fx(g, { k: 'action', p: p, c: c, ctx: ctx });
    if (c === 'SC') {
      if (!P.sc) { P.sc = true; log(g, nick(g, p) + ' pesca una Seconda possibilità e la tiene da parte.', 'act', p); return; }
      g.todo.unshift({ p: p, c: 'SC' });   // ne ha già una: la regala subito a chi non ce l'ha
      log(g, nick(g, p) + ' pesca un’altra Seconda possibilità: deve regalarla.', 'act', p);
      return;
    }
    if (ctx === 'f3' && g.f3 && g.f3.p === p) { g.f3.held.push(c); log(g, nick(g, p) + ' pesca ' + cname(c) + ': la userà dopo le tre carte.', 'act', p); return; }
    g.todo.unshift({ p: p, c: c });
    log(g, nick(g, p) + ' pesca ' + cname(c) + '.', 'act', p);
  }

  // a chi può andare una carta azione
  function targets(g, t) {
    var a = actives(g);
    if (t.c === 'SC') return a.filter(function (i) { return i !== t.p && !g.players[i].sc; });
    return a;
  }
  function apply(g, by, c, to) {
    var T = g.players[to];
    if (c === 'FRZ') {
      T.st = 'frozen';
      fx(g, { k: 'freeze', p: to, by: by });
      log(g, (by === to ? nick(g, by) + ' congela se stesso' : nick(g, by) + ' congela ' + nick(g, to)) + ': ' + score(T) + ' punti al sicuro, fuori dalla manche.', 'frz', to);
    } else if (c === 'F3') {
      g.f3 = { p: to, left: 3, held: [], by: by };
      fx(g, { k: 'flip3', p: to, by: by });
      log(g, nick(g, by) + ' dà Flip Three a ' + (by === to ? 'se stesso' : nick(g, to)) + ': tre carte in fila!', 'f3', to);
    } else if (c === 'SC') {
      T.sc = true;
      fx(g, { k: 'gift', p: to, by: by });
      log(g, nick(g, by) + ' regala la Seconda possibilità a ' + nick(g, to) + '.', 'act', to);
    }
  }

  /* ---------- il motore va avanti da solo finché non serve una scelta ---------- */
  function advance(g) {
    for (var guard = 0; guard < 400; guard++) {
      if (g.ended != null) return endRound(g);
      if (g.choice) return;
      if (g.todo.length && (!g.f3 || g.todo[0].c === 'SC')) {
        var t = g.todo.shift(), ts = targets(g, t);
        if (!ts.length) { g.disc.push(t.c); fx(g, { k: 'waste', p: t.p, c: t.c }); log(g, cname(t.c) + ' non può andare a nessuno: finisce negli scarti.', 'sys', t.p); continue; }
        if (ts.length === 1) { apply(g, t.p, t.c, ts[0]); if (t.c !== 'SC') g.disc.push(t.c); continue; }
        g.choice = { p: t.p, c: t.c, opts: ts };
        fx(g, { k: 'choose', p: t.p, c: t.c });
        return;
      }
      if (g.f3) {
        if (g.f3.left > 0 && active(g.players[g.f3.p])) { g.f3.left--; give(g, g.f3.p, 'f3'); continue; }
        var f = g.f3; g.f3 = null;
        if (active(g.players[f.p])) for (var h = f.held.length - 1; h >= 0; h--) g.todo.unshift({ p: f.p, c: f.held[h] });
        else f.held.forEach(function (a) { g.disc.push(a); });
        continue;
      }
      if (g.stage === 'deal') {
        if (g.dealQ.length) { var q = g.dealQ.shift(); if (active(g.players[q])) give(g, q, 'deal'); continue; }
        g.stage = 'turn'; g.pass = false;
        var first = nextActive(g, g.dealer);
        if (first < 0) return endRound(g);
        g.turn = first; g.turnN++;
        fx(g, { k: 'turn', p: first });
        return;
      }
      // turni
      if (!actives(g).length) return endRound(g);
      if (g.pass || !active(g.players[g.turn])) {
        g.pass = false;
        var nx = nextActive(g, g.turn);
        g.turn = nx; g.turnN++;
        fx(g, { k: 'turn', p: nx });
      }
      return;
    }
  }

  function endRound(g) {
    // le azioni rimaste in sospeso finiscono negli scarti
    if (g.choice) g.disc.push(g.choice.c); if (g.f3) g.f3.held.forEach(function (a) { g.disc.push(a); }); g.todo.forEach(function (t) { g.disc.push(t.c); });
    g.choice = null; g.f3 = null; g.todo = []; g.stage = 'end';
    var pts = g.players.map(score), f7 = g.ended != null && g.ended >= 0 ? g.ended : null;
    g.players.forEach(function (P, i) { P.total += pts[i]; P.hist.push(pts[i]); P.ready = !!P.bot; if (P.st === 'in') P.st = 'stay'; });
    g.roundRes = { pts: pts, f7: f7, st: g.players.map(function (P) { return P.st; }), nums: g.players.map(function (P) { return P.nums.slice(); }), mods: g.players.map(function (P) { return P.mods.slice(); }) };
    // le carte del tavolo vanno negli scarti (non tornano nel mazzo fino a quando non finisce)
    g.players.forEach(function (P) { P.nums.forEach(function (c) { g.disc.push(c); }); P.mods.forEach(function (c) { g.disc.push(c); }); if (P.sc) g.disc.push('SC'); if (P.st === 'bust' && P.bustCard != null) g.disc.push(P.bustCard); });
    log(g, 'Fine della manche ' + g.round + (f7 != null ? ' (Flip 7 di ' + nick(g, f7) + ')' : '') + '. ' + g.players.map(function (P, i) { return P.nick + ' ' + pts[i]; }).join(', ') + '.', 'round');
    var max = Math.max.apply(null, g.players.map(function (P) { return P.total; }));
    var top = g.players.map(function (P, i) { return P.total === max ? i : -1; }).filter(function (i) { return i >= 0; });
    if (max >= g.opts.target && top.length === 1) {
      g.winners = top;
      g.final = { order: g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[b].total - g.players[a].total || a - b; }) };
      g.phase = 'over';
      log(g, 'Vince ' + nick(g, top[0]) + ' con ' + max + ' punti!', 'win', top[0]);
      fx(g, { k: 'roundEnd', round: g.round, over: true });
      fx(g, { k: 'over', p: top[0] });
    } else {
      if (max >= g.opts.target) log(g, 'Pari in testa a ' + max + ' punti: si gioca un’altra manche per decidere chi vince.', 'sys');
      g.tie = max >= g.opts.target;
      g.phase = 'scores';
      fx(g, { k: 'roundEnd', round: g.round, over: false });
    }
  }

  /* ---------- azioni ---------- */
  function decider(g) {
    if (g.phase !== 'play') return null;
    if (g.choice) return g.choice.p;
    if (g.stage === 'turn') return g.turn;
    return null;
  }
  function pending(g) {
    var d = decider(g);
    if (d != null) return [d];
    if (g.phase === 'scores') return g.players.map(function (P, i) { return P.ready ? -1 : i; }).filter(function (i) { return i >= 0; });
    return [];
  }
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a);
    if (!r) g.seq++;
    return r;
  }
  function doAct(g, p, a) {
    var P = g.players[p];
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'La manche è finita: tocca «Prossima manche».';
      if (P.ready) return null;
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (g.choice) {
      if (g.choice.p !== p) return 'Aspetta: ' + nick(g, g.choice.p) + ' sta scegliendo a chi dare ' + cname(g.choice.c) + '.';
      if (a.a !== 'target') return 'Prima scegli a chi dare ' + cname(g.choice.c) + '.';
      var to = +a.t;
      if (g.choice.opts.indexOf(to) < 0) return g.choice.c === 'SC' ? 'Scegli un giocatore ancora in gioco che non abbia già una Seconda possibilità.' : 'Scegli un giocatore ancora in gioco.';
      var c = g.choice.c; g.choice = null;
      apply(g, p, c, to); if (c !== 'SC') g.disc.push(c);
      advance(g);
      return null;
    }
    if (g.stage !== 'turn') return 'Aspetta un attimo.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    if (a.a === 'hit') {
      fx(g, { k: 'hit', p: p });
      give(g, p, 'hit'); g.pass = true;
      advance(g);
      return null;
    }
    if (a.a === 'stay') {
      if (!P.nums.length && !P.mods.length) return 'Non hai ancora carte: devi pescare.';
      P.st = 'stay';
      fx(g, { k: 'stay', p: p, s: score(P) });
      log(g, nick(g, p) + ' si ferma con ' + score(P) + ' punti.', 'stay', p);
      g.pass = true;
      advance(g);
      return null;
    }
    return 'Mossa sconosciuta.';
  }
  // l'host fa partire la manche successiva senza aspettare chi non ha ancora toccato «Prossima manche»
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g); fx(g, { k: 'next' }); g.seq++; return true; }

  // probabilità di sballare con la prossima carta (dalle carte rimaste nel mazzo)
  function bustRisk(g, p) {
    var P = g.players[p], d = g.deck.length ? g.deck : g.disc; if (!d.length) return 0;
    var bad = 0; d.forEach(function (c) { if (isNum(c) && P.nums.indexOf(c) >= 0) bad++; });
    return bad / d.length;
  }

  return { newGame: newGame, startRound: startRound, act: act, decider: decider, pending: pending, forceNext: forceNext, score: score, active: active, actives: actives, nextActive: nextActive,
    bustRisk: bustRisk, fullDeck: fullDeck, setRandom: setRandom, shuffle: shuffle, isNum: isNum, isMod: isMod, isAct: isAct, cname: cname, targets: targets, MODS: MODS, ACTS: ACTS };
})();
if (typeof module !== 'undefined') module.exports = F7Engine;
