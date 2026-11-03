/* ===== Skyjo: motore delle regole (gira sull'host; lo stato è JSON) =====
   150 carte: 5 da −2, 10 da −1, 15 da 0, 10 per ogni valore da 1 a 12. Ognuno ha una griglia di 12 carte coperte
   (3 righe × 4 colonne; casella i = riga * 4 + colonna) e all'inizio di ogni manche ne scopre 2.
   Nel proprio turno: o si prende la carta in cima agli scarti e la si mette al posto di una carta della griglia,
   o si pesca dal mazzo e poi si sceglie se tenerla (al posto di una carta) o scartarla scoprendo una carta coperta.
   Tre carte scoperte uguali nella stessa colonna se ne vanno. Quando qualcuno ha scoperto tutta la griglia, gli altri
   giocano un ultimo turno; poi si conta. Chi ha chiuso, se non ha il punteggio più basso (e ha punti positivi), li raddoppia.
   La partita finisce quando qualcuno arriva alla soglia (100 punti): vince chi ha il totale più basso. */
var SKEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var MEAN = 760 / 150;   // valore medio di una carta coperta
  function fullDeck() { var d = [], v, k; for (k = 0; k < 5; k++) d.push(-2); for (k = 0; k < 10; k++) d.push(-1); for (k = 0; k < 15; k++) d.push(0); for (v = 1; v <= 12; v++) for (k = 0; k < 10; k++) d.push(v); return d; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 16) g.fx.splice(0, g.fx.length - 16); }
  function sv(v) { return v > 0 ? '+' + v : String(v); }   // valore con il segno, per i messaggi

  /* ---------- griglia ---------- */
  function col(i) { return i % 4; }
  function colCells(c) { return [c, c + 4, c + 8]; }
  function live(P) { var o = []; P.grid.forEach(function (x, i) { if (x) o.push(i); }); return o; }
  function hidden(P) { return live(P).filter(function (i) { return !P.grid[i].up; }); }
  function allUp(P) { return hidden(P).length === 0; }
  function upSum(P) { return P.grid.reduce(function (s, x) { return s + (x && x.up ? x.v : 0); }, 0); }
  function rawScore(P) { return P.grid.reduce(function (s, x) { return s + (x ? x.v : 0); }, 0); }
  function flips(P) { return P.grid.filter(function (x) { return x && x.up; }).length; }

  /* ---------- mazzo ---------- */
  function drawCard(g) {
    if (!g.deck.length) {
      var top = g.disc.pop();
      g.deck = shuffle(g.disc); g.disc = top == null ? [] : [top];
      log(g, 'Il mazzo è finito: gli scarti (tranne l’ultimo) vengono mescolati e fanno un nuovo mazzo.', 'sys');
      fx(g, { k: 'reshuffle' });
    }
    return g.deck.pop();
  }

  /* ---------- nuova partita e nuova manche ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var target = [50, 100, 150].indexOf(+opts.target) >= 0 ? +opts.target : 100;
    var g = {
      v: 1, phase: 'reveal', seq: 0, turnN: 0, round: 0,
      opts: { target: target },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, grid: [], total: 0, hist: [], ready: false }; }),
      deck: [], disc: [], turn: 0, drawn: null, ender: null, starter: null, lastEnder: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null
    };
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.round++; g.phase = 'reveal'; g.drawn = null; g.ender = null; g.roundRes = null;
    g.deck = shuffle(fullDeck()); g.disc = [];
    g.players.forEach(function (P) { P.grid = []; P.ready = false; });
    for (var k = 0; k < 12; k++) g.players.forEach(function (P) { P.grid.push({ v: g.deck.pop(), up: false }); });
    g.disc.push(g.deck.pop());
    log(g, 'Manche ' + g.round + ': ognuno riceve 12 carte coperte e ne scopre 2.' + (g.round === 1 ? ' Comincia chi ha la somma più alta.' : ' Comincia ' + nick(g, g.lastEnder) + ', che ha chiuso la manche di prima.'), 'sys');
    fx(g, { k: 'deal', round: g.round });
  }
  function beginPlay(g) {
    var st;
    if (g.round > 1 && g.lastEnder != null) st = g.lastEnder;
    else { st = 0; g.players.forEach(function (P, i) { if (upSum(P) > upSum(g.players[st])) st = i; }); }
    g.phase = 'play'; g.turn = st; g.starter = st; g.turnN++;
    log(g, 'Tutti hanno scoperto due carte. Comincia ' + nick(g, st) + (g.round === 1 ? ' (somma più alta: ' + upSum(g.players[st]) + ').' : '.'), 'sys', st);
    fx(g, { k: 'turn', p: st });
  }

  /* ---------- turni ---------- */
  function decider(g) {
    if (g.phase === 'play') return g.turn;
    if (g.phase === 'reveal') { for (var i = 0; i < g.players.length; i++) if (flips(g.players[i]) < 2) return i; }
    return null;
  }
  // chi deve ancora fare qualcosa adesso (nella fase delle prime due carte sono tutti insieme)
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'reveal') return g.players.map(function (P, i) { return flips(P) < 2 ? i : -1; }).filter(function (i) { return i >= 0; });
    if (g.phase === 'scores') return g.players.map(function (P, i) { return P.ready ? -1 : i; }).filter(function (i) { return i >= 0; });
    return [];
  }
  // tre carte scoperte uguali in una colonna se ne vanno (anche più colonne insieme)
  function columns(g, p) {
    var P = g.players[p], gone = [];
    for (var c = 0; c < 4; c++) {
      var cs = colCells(c), a = P.grid[cs[0]], b = P.grid[cs[1]], d = P.grid[cs[2]];
      if (a && b && d && a.up && b.up && d.up && a.v === b.v && b.v === d.v) {
        cs.forEach(function (i) { g.disc.push(P.grid[i].v); P.grid[i] = null; });
        gone.push({ c: c, v: a.v });
      }
    }
    gone.forEach(function (x) {
      log(g, nick(g, p) + ' completa una colonna di ' + sv(x.v) + ': le tre carte se ne vanno!', 'col', p);
      fx(g, { k: 'col', p: p, c: x.c, v: x.v });
    });
    return gone.length;
  }
  function endTurn(g, p) {
    columns(g, p);
    var P = g.players[p];
    if (g.ender == null && allUp(P)) {
      g.ender = p;
      log(g, nick(g, p) + ' ha scoperto tutte le carte! Gli altri giocano un ultimo turno.', 'end', p);
      fx(g, { k: 'ender', p: p });
    }
    g.drawn = null;
    var next = (p + 1) % g.players.length;
    if (g.ender != null && next === g.ender) { endRound(g); return; }
    g.turn = next; g.turnN++;
    fx(g, { k: 'turn', p: next, last: g.ender != null });
  }
  function endRound(g) {
    g.drawn = null;
    var flipped = [];
    g.players.forEach(function (P, p) { P.grid.forEach(function (x, i) { if (x && !x.up) { x.up = true; flipped.push({ p: p, i: i }); } }); });
    var raw = g.players.map(rawScore), e = g.ender;
    var lowest = raw.every(function (s, i) { return i === e || raw[e] < s; });
    var doubled = !lowest && raw[e] > 0;
    var pts = raw.map(function (s, i) { return i === e && doubled ? s * 2 : s; });
    g.players.forEach(function (P, i) { P.total += pts[i]; P.hist.push(pts[i]); P.ready = !!P.bot; });
    g.roundRes = { raw: raw, pts: pts, ender: e, doubled: doubled, lowest: lowest };
    g.lastEnder = e;
    fx(g, { k: 'reveal', cells: flipped });
    log(g, 'Fine della manche ' + g.round + '. ' + g.players.map(function (P, i) { return P.nick + ' ' + sv(pts[i]); }).join(', ') + '.', 'round');
    if (doubled) log(g, nick(g, e) + ' ha chiuso ma non ha il punteggio più basso: i suoi ' + raw[e] + ' punti raddoppiano (' + pts[e] + ').', 'double', e);
    else log(g, nick(g, e) + ' ha chiuso con ' + (lowest ? 'il punteggio più basso' : 'punti non positivi') + ': niente raddoppio.', 'sys', e);
    var reached = g.players.some(function (P) { return P.total >= g.opts.target; });
    if (reached) {
      var min = Math.min.apply(null, g.players.map(function (P) { return P.total; }));
      var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[a].total - g.players[b].total || a - b; });
      g.winners = order.filter(function (i) { return g.players[i].total === min; });
      g.final = { order: order };
      g.phase = 'over';
      log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + min + ' punti.', 'win', g.winners[0]);
      fx(g, { k: 'roundEnd', round: g.round, over: true });
      fx(g, { k: 'over', p: g.winners[0] });
    } else {
      g.phase = 'scores';
      fx(g, { k: 'roundEnd', round: g.round, over: false });
    }
  }

  /* ---------- azioni ---------- */
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a);
    if (!r) g.seq++;
    return r;
  }
  function cell(P, i) { i = +i; return i >= 0 && i < 12 && i === Math.floor(i) ? P.grid[i] : null; }
  function doAct(g, p, a) {
    var P = g.players[p], c;
    if (g.phase === 'reveal') {
      if (a.a !== 'flip') return 'Prima scopri due carte della tua griglia.';
      if (flips(P) >= 2) return 'Hai già scoperto due carte: aspetta gli altri.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta della tua griglia.';
      if (c.up) return 'Questa carta è già scoperta.';
      c.up = true;
      fx(g, { k: 'flip', p: p, i: +a.i, v: c.v, open: true });
      if (g.players.every(function (Q) { return flips(Q) >= 2; })) beginPlay(g);
      return null;
    }
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'La manche è finita: tocca «Prossima manche».';
      if (P.ready) return null;
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    if (a.a === 'draw') {
      if (g.drawn) return 'Hai già una carta in mano: tienila o scartala.';
      var v = drawCard(g);
      g.drawn = { v: v, from: 'deck' };
      fx(g, { k: 'draw', p: p, v: v });
      log(g, nick(g, p) + ' pesca un ' + sv(v) + ' dal mazzo.', 'draw', p);
      return null;
    }
    if (a.a === 'take') {   // prende la carta in cima agli scarti e la mette nella casella i
      if (g.drawn) return 'Hai già pescato dal mazzo.';
      if (!g.disc.length) return 'Gli scarti sono vuoti.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta della tua griglia.';
      var tv = g.disc.pop(), old = c.v, wasUp = c.up;
      P.grid[+a.i] = { v: tv, up: true }; g.disc.push(old);
      fx(g, { k: 'swap', p: p, i: +a.i, v: tv, old: old, wasUp: wasUp, from: 'disc' });
      log(g, nick(g, p) + ' prende il ' + sv(tv) + ' dagli scarti e lo mette al posto di ' + (wasUp ? 'un ' + sv(old) : 'una carta coperta (era un ' + sv(old) + ')') + '.', 'swap', p);
      endTurn(g, p); return null;
    }
    if (a.a === 'swap') {   // tiene la carta pescata al posto della casella i
      if (!g.drawn) return 'Prima pesca una carta o prendi quella degli scarti.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta della tua griglia.';
      var nv = g.drawn.v, ov = c.v, up0 = c.up;
      P.grid[+a.i] = { v: nv, up: true }; g.disc.push(ov);
      fx(g, { k: 'swap', p: p, i: +a.i, v: nv, old: ov, wasUp: up0, from: 'deck' });
      log(g, nick(g, p) + ' tiene il ' + sv(nv) + ' al posto di ' + (up0 ? 'un ' + sv(ov) : 'una carta coperta (era un ' + sv(ov) + ')') + '.', 'swap', p);
      endTurn(g, p); return null;
    }
    if (a.a === 'drop') {   // scarta la carta pescata e scopre la casella i
      if (!g.drawn) return 'Prima pesca una carta dal mazzo.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta coperta della tua griglia.';
      if (c.up) return 'Scegli una carta ancora coperta da scoprire.';
      var dv = g.drawn.v; g.disc.push(dv); c.up = true;
      fx(g, { k: 'drop', p: p, v: dv }); fx(g, { k: 'flip', p: p, i: +a.i, v: c.v });
      log(g, nick(g, p) + ' scarta il ' + sv(dv) + ' e scopre un ' + sv(c.v) + '.', 'drop', p);
      endTurn(g, p); return null;
    }
    return 'Mossa sconosciuta.';
  }

  // l'host fa partire la manche successiva senza aspettare chi non ha ancora toccato «Prossima manche»
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g); fx(g, { k: 'next' }); g.seq++; return true; }

  return { newGame: newGame, act: act, decider: decider, forceNext: forceNext, pending: pending, flips: flips, upSum: upSum, rawScore: rawScore, allUp: allUp, hidden: hidden, live: live,
    colCells: colCells, col: col, fullDeck: fullDeck, setRandom: setRandom, shuffle: shuffle, sv: sv, MEAN: MEAN };
})();
if (typeof module !== 'undefined') module.exports = SKEngine;
