/* ===== La Miniera: motore delle regole (gira sull'host; lo stato è JSON) =====
   Da 3 a 10 cercatori esplorano una vecchia miniera per 5 spedizioni (o 3). A ogni passo si scopre una galleria:
   - pepite: si dividono in parti uguali tra chi è ancora dentro; il resto rimane per terra nella galleria;
   - pericolo (frana, grisù, piena, pipistrelli, serpenti): il primo di un tipo spaventa e basta; se ne esce un
     secondo dello stesso tipo, chi è ancora dentro scappa e perde tutto quello che aveva in tasca. Una di quelle
     due carte esce dal mazzo per il resto della partita;
   - idolo: un tesoro raro che può portare via solo chi torna da solo.
   Dopo ogni galleria tutti quelli dentro scelgono IN SEGRETO e insieme: avanti o al campo. Chi torna raccoglie
   (diviso tra chi torna insieme) le pepite rimaste per terra e mette al sicuro nella cassa quelle che ha in tasca.
   Se non scegli in tempo torni al campo. Vince chi ha più pepite nella cassa (gli idoli valgono 5 o 10).
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var MNEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var GEMS = [1, 2, 3, 4, 5, 5, 6, 7, 8, 9, 10, 11, 12, 14, 16];
  var HAZ = ['frana', 'grisu', 'piena', 'pipistrelli', 'serpenti'];
  var HAZ_NAME = { frana: 'Frana', grisu: 'Grisù', piena: 'Piena', pipistrelli: 'Pipistrelli', serpenti: 'Serpenti' };
  var HAZ_TXT = { frana: 'il soffitto trema', grisu: 'odore di gas', piena: 'l’acqua sale', pipistrelli: 'uno stormo nel buio', serpenti: 'sibili tra le rocce' };
  var OPT = { exps: [3, 5], time: [10, 15, 25] }, CAMP_MS = 14000;
  function idolValue(k) { return k <= 3 ? 5 : 10; }   // il 4° e il 5° idolo valgono di più
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function score(P) { return P.chest + P.idols.reduce(function (a, b) { return a + b; }, 0); }
  function inside(g) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].in; }); }
  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { exps: pick(OPT.exps, opts.exps, 5), time: pick(OPT.time, opts.time, 15) };
    var g = {
      v: 1, phase: 'choose', seq: 0, turnN: 0, exp: 0, clock: now, opts: o,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, in: true, carry: 0, chest: 0, idols: [], ch: null, ready: false, last: null }; }),
      removed: [], idolsOut: 0, path: [], deck: [], until: 0, res: null, hist: [], log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, step: 0
    };
    startExp(g, now);
    return g;
  }
  // il mazzo di una spedizione: pepite, pericoli (meno quelli già usciti doppi) e un idolo nuovo
  function buildDeck(g) {
    var d = GEMS.map(function (v) { return 'g' + v; });
    HAZ.forEach(function (h) { var n = 3 - g.removed.filter(function (x) { return x === h; }).length; for (var k = 0; k < n; k++) d.push('h' + h); });
    for (var k = 0; k < g.exp - g.idolsOut; k++) d.push('i');   // gli idoli non portati via restano nel mazzo
    return shuffle(d);
  }
  function startExp(g, now) {
    g.exp++; g.path = []; g.res = null; g.step = 0;
    g.players.forEach(function (P) { P.in = true; P.carry = 0; P.ch = null; P.ready = false; P.last = null; });
    g.deck = buildDeck(g);
    log(g, 'Spedizione ' + g.exp + ' di ' + g.opts.exps + ': tutti entrano nella miniera.', 'sys');
    fx(g, { k: 'exp', exp: g.exp });
    reveal(g, now);
  }
  function hazSeen(g) { var s = {}; g.path.forEach(function (c) { if (c.c.charAt(0) === 'h') s[c.c.slice(1)] = (s[c.c.slice(1)] || 0) + 1; }); return s; }
  // scopre la prossima galleria
  function reveal(g, now) {
    var c = g.deck.pop(), ins = inside(g), cell = { c: c, left: 0 };
    g.step++;
    if (c.charAt(0) === 'g') {
      var v = +c.slice(1), share = Math.floor(v / ins.length);
      ins.forEach(function (p) { g.players[p].carry += share; });
      cell.left = v - share * ins.length; cell.share = share;
      g.path.push(cell);
      log(g, 'Galleria ' + g.step + ': ' + v + ' pepite, ' + share + ' a testa' + (cell.left ? ', ' + cell.left + ' restano per terra' : '') + '.', 'gem');
      fx(g, { k: 'card', c: c, share: share, left: cell.left });
    } else if (c === 'i') {
      g.path.push(cell);
      log(g, 'Galleria ' + g.step + ': un idolo! Lo porta via solo chi torna da solo.', 'idol');
      fx(g, { k: 'card', c: c });
    } else {
      var h = c.slice(1), seen = hazSeen(g)[h] || 0;
      g.path.push(cell);
      if (seen >= 1) { disaster(g, h, now); return; }
      log(g, 'Galleria ' + g.step + ': ' + HAZ_NAME[h] + '! ' + HAZ_TXT[h] + '. Se ne esce un’altra, si scappa.', 'haz');
      fx(g, { k: 'card', c: c });
    }
    openChoice(g, now);
  }
  function openChoice(g, now) {
    g.phase = 'choose'; g.until = now + g.opts.time * 1000; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ch = null; });
  }
  function disaster(g, h, now) {
    var ins = inside(g);
    ins.forEach(function (p) { var P = g.players[p]; P.last = { lost: P.carry }; P.carry = 0; P.in = false; });
    g.removed.push(h);
    log(g, 'Ancora ' + HAZ_NAME[h] + '! ' + (ins.length ? ins.map(function (p) { return nick(g, p); }).join(', ') + ' scappa' + (ins.length > 1 ? 'no' : '') + ' a mani vuote.' : ''), 'bad');
    fx(g, { k: 'disaster', h: h, ps: ins });
    endExp(g, now, h);
  }
  // chi torna: si divide le pepite per terra; l'idolo solo se torna da solo
  function goHome(g, ps) {
    var k = ps.length, got = 0, idols = [];
    g.path.forEach(function (cell) {
      if (cell.c.charAt(0) === 'g' && cell.left >= k) { var s = Math.floor(cell.left / k); got += s; cell.left -= s * k; }
      if (cell.c === 'i' && !cell.taken && k === 1) { cell.taken = true; g.idolsOut++; idols.push(idolValue(g.idolsOut)); }
    });
    ps.forEach(function (p) {
      var P = g.players[p], gain = P.carry + got;
      P.chest += gain; P.last = { home: gain, idols: idols.slice() }; P.carry = 0; P.in = false;
      if (idols.length) P.idols = P.idols.concat(idols);
    });
    return { got: got, idols: idols };
  }
  function resolve(g, now) {
    var ins = inside(g);
    ins.forEach(function (p) { var P = g.players[p]; if (!P.ch) P.ch = 'back'; });   // chi non sceglie torna al campo
    var back = ins.filter(function (p) { return g.players[p].ch === 'back'; }), go = ins.filter(function (p) { return g.players[p].ch === 'go'; });
    var r = back.length ? goHome(g, back) : { got: 0, idols: [] };
    log(g, (back.length ? back.map(function (p) { return nick(g, p); }).join(', ') + ' torna' + (back.length > 1 ? 'no' : '') + ' al campo' + (r.got ? ' raccogliendo ' + r.got + ' pepite a testa da terra' : '') + (r.idols.length ? ' con ' + (r.idols.length > 1 ? r.idols.length + ' idoli' : 'l’idolo') : '') + '. ' : '') +
      (go.length ? go.map(function (p) { return nick(g, p); }).join(', ') + ' va' + (go.length > 1 ? 'nno' : '') + ' avanti.' : 'Nessuno va avanti.'), 'choice');
    fx(g, { k: 'choice', back: back, go: go, got: r.got, idols: r.idols });
    if (!go.length) { endExp(g, now, null); return; }
    if (!g.deck.length) { goHome(g, go); endExp(g, now, null); return; }
    reveal(g, now);
  }
  function endExp(g, now, h) {
    g.res = { exp: g.exp, h: h, path: g.path.map(function (c) { return c.c; }), gains: g.players.map(function (P) { return P.last; }) };
    g.hist.push(g.players.map(function (P) { return P.last && P.last.home ? P.last.home + P.last.idols.reduce(function (a, b) { return a + b; }, 0) : 0; }));
    if (g.exp >= g.opts.exps) { finish(g); return; }
    g.phase = 'camp'; g.until = now + CAMP_MS; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = !!P.bot; P.ch = null; });
    fx(g, { k: 'camp', exp: g.exp, h: h });
  }
  function finish(g) {
    var tot = g.players.map(score), best = Math.max.apply(null, tot);
    var tied = g.players.map(function (P, i) { return i; }).filter(function (i) { return tot[i] === best; });
    var mostI = Math.max.apply(null, tied.map(function (i) { return g.players[i].idols.length; }));
    g.winners = tied.filter(function (i) { return g.players[i].idols.length === mostI; });
    var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return tot[b] - tot[a] || g.players[b].idols.length - g.players[a].idols.length; });
    var place = g.players.map(function (P, i) { return 1 + g.players.filter(function (Q, j) { return tot[j] > tot[i] || (tot[j] === tot[i] && Q.idols.length > P.idols.length); }).length; });
    g.final = { order: order, place: place, tot: tot };
    g.phase = 'over';
    log(g, (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + best + ' pepite!', 'win');
    fx(g, { k: 'over' });
  }
  function tick(g, now) {
    if (now < g.until) return false;
    if (g.phase === 'choose') resolve(g, now);
    else if (g.phase === 'camp') startExp(g, now);
    else return false;
    g.seq++; return true;
  }
  function decider() { return null; }
  function pending(g) {
    if (g.phase === 'choose') return inside(g).filter(function (i) { return !g.players[i].ch; });
    if (g.phase === 'camp') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  // rischio che la prossima galleria sia un disastro (per i consigli e per i giocatori automatici)
  function risk(g) {
    var s = hazSeen(g), bad = 0;
    Object.keys(s).forEach(function (h) { bad += g.deck.filter(function (c) { return c === 'h' + h; }).length; });
    return g.deck.length ? bad / g.deck.length : 0;
  }
  function floor(g) { return g.path.reduce(function (a, c) { return a + (c.c.charAt(0) === 'g' ? c.left : 0); }, 0); }
  function idolsOnPath(g) { return g.path.filter(function (c) { return c.c === 'i' && !c.taken; }).length; }
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
    if (g.phase === 'choose') {
      if (a.a !== 'go' && a.a !== 'back') return 'Adesso si sceglie: avanti o al campo.';
      if (!P.in) return 'Sei già al campo: aspetta la prossima spedizione.';
      P.ch = a.a;
      fx(g, { k: 'chose', p: p });
      if (inside(g).every(function (i) { return g.players[i].ch; })) resolve(g, now);
      return null;
    }
    if (g.phase === 'camp') {
      if (a.a !== 'next') return 'Tocca «Prossima spedizione».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) startExp(g, now);
      return null;
    }
    return 'Mossa non valida.';
  }
  function forceNext(g, now) { now = now || Date.now(); if (g.phase === 'camp') { startExp(g, now); g.seq++; return true; } return false; }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, inside: inside, score: score, risk: risk, floor: floor, idolsOnPath: idolsOnPath, hazSeen: hazSeen, idolValue: idolValue,
    setRandom: setRandom, shuffle: shuffle, GEMS: GEMS, HAZ: HAZ, HAZ_NAME: HAZ_NAME, HAZ_TXT: HAZ_TXT, OPT: OPT, CAMP_MS: CAMP_MS };
})();
if (typeof module !== 'undefined') module.exports = MNEngine;
