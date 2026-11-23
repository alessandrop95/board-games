/* ===== Dadi e rischio: motore delle regole (gira sull'host; lo stato è JSON) =====
   Gioco di dadi «tira o fermati», da 2 a 8 giocatori. Al tuo turno tiri 5 dadi e devi mettere da parte almeno un
   dado con un valore che non hai ANCORA messo da parte in questa fila: i dadi messi da parte vanno nel piatto
   (valgono quanto la faccia). Poi scegli: tiri ancora i dadi rimasti oppure ti fermi e incassi il piatto.
   - Se un tiro non mostra nessun valore nuovo hai sballato: il piatto del turno è perso.
   - Una fila di 5 valori diversi vale un bonus di 15 punti e restituisce tutti e 5 i dadi (la fila riparte vuota).
   - Quando, alla fine di un giro, qualcuno ha raggiunto il traguardo (100, 200 o 300), vince chi ha più punti:
     tutti hanno giocato lo stesso numero di turni. A parità, si gioca un altro giro.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var DREngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  var OPT = { target: [100, 200, 300] }, DICE = 5, BONUS = 15;
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function sum(a) { return a.reduce(function (t, x) { return t + x; }, 0); }
  function roll(n) { var d = []; for (var i = 0; i < n; i++) d.push(1 + Math.floor(rand() * 6)); return d; }

  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { target: pick(OPT.target, opts.target, 200), timer: opts.timer == null ? 60 : +opts.timer };
    var first = Math.floor(rand() * seats.length);
    var g = {
      v: 1, phase: 'roll', seq: 0, turnN: 0, round: 1, clock: now, opts: o, turn: first, first: first,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, score: 0, best: 0, busts: 0, hist: [] }; }),
      dice: [], kept: [], pot: 0, rows: 0, rolls: 0, last: null, lastRound: false,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    log(g, 'Si gioca fino a ' + o.target + ' punti. Comincia ' + nick(g, first) + '.', 'sys');
    startTurn(g, first, now);
    return g;
  }
  function startTurn(g, p, now) {
    g.turn = p; g.phase = 'roll'; g.dice = []; g.kept = []; g.pot = 0; g.rows = 0; g.rolls = 0; g.clock = now; g.turnN++;
    fx(g, { k: 'turn', p: p });
  }
  // valori che il tiro offre e che non sono ancora nella fila
  function fresh(g, dice) {
    var out = [];
    (dice || g.dice).forEach(function (v) { if (g.kept.indexOf(v) < 0 && out.indexOf(v) < 0) out.push(v); });
    return out.sort(function (a, b) { return b - a; });
  }
  // probabilità di sballare al prossimo tiro, con «kept» valori già presi e i dadi rimasti
  function bustChance(kept) {
    var k = kept.length, free = DICE - k;
    if (!free || !k) return 0;
    return Math.pow(k / 6, free);
  }
  function doRoll(g, p, now) {
    var n = DICE - g.kept.length;
    g.dice = roll(n); g.rolls++;
    var nw = fresh(g);
    if (!nw.length) {
      var lost = g.pot, P = g.players[p];
      P.busts++; P.hist.push({ pts: 0, bust: true, lost: lost });
      g.last = { p: p, dice: g.dice.slice(), kept: g.kept.slice(), pot: lost, bust: true, rows: g.rows };
      log(g, nick(g, p) + ' tira ' + g.dice.join(' ') + ': nessun valore nuovo. Sballato! ' + (lost ? 'Perde ' + lost + ' punti del turno.' : ''), 'bust', p);
      fx(g, { k: 'bust', p: p, dice: g.dice.slice(), lost: lost });
      endTurn(g, now);
      return;
    }
    g.phase = 'pick';
    fx(g, { k: 'roll', p: p, dice: g.dice.slice() });
  }
  function endTurn(g, now) {
    var n = g.players.length, nx = (g.turn + 1) % n;
    if (nx === g.first) {
      // giro finito: qualcuno è arrivato al traguardo?
      var top = Math.max.apply(null, g.players.map(function (P) { return P.score; }));
      if (top >= g.opts.target) {
        var lead = g.players.map(function (P, i) { return P.score === top ? i : -1; }).filter(function (i) { return i >= 0; });
        if (lead.length === 1) { finish(g); return; }
        log(g, 'Pari in testa a ' + top + ' punti: si gioca un altro giro!', 'sys');
      }
      g.round++;
    } else if (!g.lastRound && g.players[g.turn].score >= g.opts.target) {
      g.lastRound = true;
      log(g, nick(g, g.turn) + ' ha raggiunto ' + g.opts.target + ' punti: è l’ultimo giro! Gli altri hanno ancora un turno.', 'end', g.turn);
      fx(g, { k: 'last', p: g.turn });
    }
    startTurn(g, nx, now);
  }
  function finish(g) {
    g.phase = 'over';
    var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[b].score - g.players[a].score || a - b; });
    var place = g.players.map(function (P) { return 1 + g.players.filter(function (Q) { return Q.score > P.score; }).length; });
    g.winners = order.filter(function (i) { return place[i] === 1; });
    g.final = { order: order, place: place };
    log(g, 'Vince ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') + ' con ' + g.players[g.winners[0]].score + ' punti!', 'win', g.winners[0]);
    fx(g, { k: 'over', w: g.winners[0] });
  }
  function decider(g) { return g.phase === 'roll' || g.phase === 'pick' ? g.turn : null; }
  function pending(g) { var d = decider(g); return d == null ? [] : [d]; }

  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    if (g.turn !== p) return 'Non è il tuo turno: tocca a ' + nick(g, g.turn) + '.';
    var r = doAct(g, p, a, now);
    if (!r) { g.seq++; g.clock = now; }
    return r;
  }
  function doAct(g, p, a, now) {
    if (g.phase === 'roll') {
      if (a.a !== 'roll') return 'Tira i dadi.';
      doRoll(g, p, now);
      return null;
    }
    if (g.phase !== 'pick') return 'Mossa non valida.';
    if (a.a !== 'pick') return 'Metti da parte almeno un dado.';
    var idx = Array.isArray(a.d) ? a.d.map(function (x) { return Math.floor(+x); }) : [];
    if (!idx.length) return 'Metti da parte almeno un dado.';
    var vals = [];
    for (var i = 0; i < idx.length; i++) {
      var k = idx[i];
      if (!(k >= 0 && k < g.dice.length) || idx.indexOf(k) !== i) return 'Dado non valido.';
      var v = g.dice[k];
      if (g.kept.indexOf(v) >= 0) return 'Il ' + v + ' l’hai già messo da parte in questa fila.';
      if (vals.indexOf(v) >= 0) return 'Due dadi uguali non si mettono da parte insieme: i valori della fila sono tutti diversi.';
      vals.push(v);
    }
    var P = g.players[p], gain = sum(vals);
    g.kept = g.kept.concat(vals); g.pot += gain;
    var row = g.kept.length === DICE;
    if (row) {
      g.pot += BONUS; g.rows++; g.kept = [];
      log(g, nick(g, p) + ' completa una fila di 5 valori diversi: +' + BONUS + ' di bonus e di nuovo 5 dadi!', 'row', p);
      fx(g, { k: 'row', p: p });
    }
    g.dice = [];
    if (a.go) { doRoll(g, p, now); return null; }
    // si ferma: incassa il piatto
    var pot = g.pot;
    P.score += pot; P.best = Math.max(P.best, pot); P.hist.push({ pts: pot, bust: false });
    g.last = { p: p, dice: [], kept: g.kept.slice(), pot: pot, bust: false, rows: g.rows };
    log(g, nick(g, p) + ' si ferma e incassa ' + pot + ' punti (totale ' + P.score + ').', 'bank', p);
    fx(g, { k: 'bank', p: p, pot: pot });
    endTurn(g, now);
    return null;
  }
  return { newGame: newGame, act: act, decider: decider, pending: pending, fresh: fresh, bustChance: bustChance, sum: sum,
    setRandom: setRandom, OPT: OPT, DICE: DICE, BONUS: BONUS };
})();
if (typeof module !== 'undefined') module.exports = DREngine;
