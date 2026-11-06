/* ===== Skyjo: motore delle regole (gira sull'host; lo stato è JSON) =====
   Classico: 150 carte (5 da −2, 10 da −1, 15 da 0, 10 per ogni valore da 1 a 12). Ognuno ha una griglia di 12 carte
   coperte (3 righe × 4 colonne; casella i = riga * 4 + colonna) e all'inizio di ogni manche ne scopre 2.
   Nel proprio turno: o si prende la carta in cima agli scarti e la si mette al posto di una carta della griglia,
   o si pesca dal mazzo e poi si sceglie se tenerla (al posto di una carta) o scartarla scoprendo una carta coperta.
   Tre carte scoperte uguali nella stessa colonna se ne vanno. Quando qualcuno ha scoperto tutta la griglia, gli altri
   giocano un ultimo turno; poi si conta. Chi ha chiuso, se non ha il punteggio più basso (e ha punti positivi), li raddoppia.
   La partita finisce quando qualcuno arriva alla soglia (100 punti): vince chi ha il totale più basso.

   Variante «Skyjo Action» (opts.action): 120 carte (4 da −2, 6 da −1, 6 da 0, 8 per ogni valore da 1 a 12 e 8 stelle)
   e 27 carte Azione (9 tipi × 3), con una fila di 4 Azioni scoperte. La stella vale 0 e fa da jolly per colonne e righe.
   Quando si pesca, si prende dagli scarti o si scopre una stella si può prendere una carta Azione. Nel turno, invece
   di giocare una carta, si può prendere una carta Azione oppure giocarne una (non quella presa nello stesso turno).
   Si tolgono anche le righe di 4 carte uguali; colonna di sole stelle −10, riga di sole stelle −15.
   Ogni Azione rimasta in mano a fine manche vale +10. Dopo che qualcuno ha chiuso non si usano più Azioni.

   Variante «eliminazione» (opts.elim): chi arriva alla soglia è eliminato e la partita continua senza di lui
   finché non resta un solo giocatore, che vince. */
var SKEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var STAR = '*';
  var MEAN = 760 / 150;   // valore medio di una carta coperta
  function val(v) { return v === STAR ? 0 : v; }
  function fullDeck() { var d = [], v, k; for (k = 0; k < 5; k++) d.push(-2); for (k = 0; k < 10; k++) d.push(-1); for (k = 0; k < 15; k++) d.push(0); for (v = 1; v <= 12; v++) for (k = 0; k < 10; k++) d.push(v); return d; }
  function actionDeck() { var d = [], v, k; for (k = 0; k < 4; k++) d.push(-2); for (k = 0; k < 6; k++) d.push(-1); for (k = 0; k < 6; k++) d.push(0); for (v = 1; v <= 12; v++) for (k = 0; k < 8; k++) d.push(v); for (k = 0; k < 8; k++) d.push(STAR); return d; }
  /* le carte Azione: nome, spiegazione breve */
  var ACTS = {
    exch: ['Scambio', 'Scambia una tua carta con quella di un avversario, oppure due carte di due avversari.'],
    swap2: ['Rimescola', 'Scambia di posto due carte della tua griglia.'],
    draw3: ['Pesca tre', 'Pesca 3 carte: tienine una al posto di una tua, oppure scartale tutte e scopri una tua carta coperta.'],
    look: ['Sbircia', 'Guarda in segreto le carte coperte di una riga o di una colonna (tua o di un altro).'],
    rmall: ['Spazzata', 'Togli una carta a ogni avversario: una della griglia (la rimpiazza una coperta dal mazzo) o una carta Azione.'],
    two: ['Doppio turno', 'Dopo questa carta giochi altri due turni di fila.'],
    prot: ['Scudo', 'Ti protegge in automatico da Scambio, Spazzata e Furto. Oppure giocalo per un turno in più.'],
    redo: ['Ripesca', 'Gioca subito una carta Azione dagli scarti delle Azioni.'],
    steal: ['Furto', 'Ruba una carta Azione a un avversario e giocala subito.']
  };
  var ATYPES = ['exch', 'swap2', 'draw3', 'look', 'rmall', 'two', 'prot', 'redo', 'steal'];
  function aDeck() { var d = []; ATYPES.forEach(function (k) { for (var i = 0; i < 3; i++) d.push(k); }); return d; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 16) g.fx.splice(0, g.fx.length - 16); }
  function sv(v) { return v === STAR ? '★' : v > 0 ? '+' + v : String(v); }   // valore con il segno, per i messaggi
  function an(k) { return '«' + ACTS[k][0] + '»'; }

  /* ---------- griglia ---------- */
  function col(i) { return i % 4; }
  function colCells(c) { return [c, c + 4, c + 8]; }
  function rowCells(r) { return [r * 4, r * 4 + 1, r * 4 + 2, r * 4 + 3]; }
  function live(P) { var o = []; P.grid.forEach(function (x, i) { if (x) o.push(i); }); return o; }
  function hidden(P) { return live(P).filter(function (i) { return !P.grid[i].up; }); }
  function allUp(P) { return hidden(P).length === 0; }
  function upSum(P) { return P.grid.reduce(function (s, x) { return s + (x && x.up ? val(x.v) : 0); }, 0); }
  function rawScore(P) { return P.grid.reduce(function (s, x) { return s + (x ? val(x.v) : 0); }, 0); }
  function flips(P) { return P.grid.filter(function (x) { return x && x.up; }).length; }
  function alive(g, p) { return !!g.players[p] && !g.players[p].out; }
  function aliveList(g) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return alive(g, i); }); }
  function nextAlive(g, p) { var n = g.players.length; for (var k = 1; k <= n; k++) { var q = (p + k) % n; if (alive(g, q)) return q; } return p; }
  // carte uguali (le stelle fanno da jolly): null se non vanno, altrimenti il valore comune (STAR se sono tutte stelle)
  function same(cells) {
    if (cells.some(function (x) { return !x || !x.up; })) return null;
    var nums = cells.filter(function (x) { return x.v !== STAR; });
    if (!nums.length) return STAR;
    return nums.every(function (x) { return x.v === nums[0].v; }) ? nums[0].v : null;
  }

  /* ---------- mazzi ---------- */
  function drawCard(g) {
    if (!g.deck.length) {
      var top = g.disc.pop();
      g.deck = shuffle(g.disc); g.disc = top == null ? [] : [top];
      log(g, 'Il mazzo è finito: gli scarti (tranne l’ultimo) vengono mescolati e fanno un nuovo mazzo.', 'sys');
      fx(g, { k: 'reshuffle' });
    }
    return g.deck.pop();
  }
  function drawAction(g) {
    if (!g.adeck.length && g.adisc.length) { g.adeck = shuffle(g.adisc); g.adisc = []; log(g, 'Le carte Azione scartate vengono mescolate e fanno un nuovo mazzo delle Azioni.', 'sys'); }
    return g.adeck.length ? g.adeck.pop() : null;
  }
  function refillRow(g) { for (var r = 0; r < 4; r++) if (g.arow[r] == null) g.arow[r] = drawAction(g); }
  function canGetAction(g) { return g.arow.some(function (k) { return k != null; }) || g.adeck.length > 0 || g.adisc.length > 0; }

  /* ---------- nuova partita e nuova manche ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var target = [50, 100, 150].indexOf(+opts.target) >= 0 ? +opts.target : 100;
    var g = {
      v: 2, phase: 'reveal', seq: 0, turnN: 0, round: 0,
      opts: { target: target, action: !!opts.action, elim: !!opts.elim },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, grid: [], total: 0, hist: [], ready: false, out: false, outRound: null, acts: [], bonus: 0, rb: 0, seen: [] }; }),
      deck: [], disc: [], turn: 0, drawn: null, ender: null, starter: null, lastEnder: null,
      adeck: [], arow: [], adisc: [], extra: 0, chain: null, pick: null, hold: false,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null
    };
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.round++; g.phase = 'reveal'; g.drawn = null; g.ender = null; g.roundRes = null; g.extra = 0; g.chain = null; g.pick = null; g.hold = false;
    g.deck = shuffle(g.opts.action ? actionDeck() : fullDeck()); g.disc = [];
    if (g.opts.action) { g.adeck = shuffle(aDeck()); g.adisc = []; g.arow = [null, null, null, null]; refillRow(g); }
    g.players.forEach(function (P) { P.grid = []; P.ready = !!P.out; P.acts = []; P.bonus = 0; P.rb = 0; P.seen = []; });
    for (var k = 0; k < 12; k++) g.players.forEach(function (P) { if (!P.out) P.grid.push({ v: g.deck.pop(), up: false }); });
    g.disc.push(g.deck.pop());
    log(g, 'Manche ' + g.round + ': ognuno riceve 12 carte coperte e ne scopre 2.' + (g.round === 1 ? ' Comincia chi ha la somma più alta.' : ''), 'sys');
    fx(g, { k: 'deal', round: g.round });
  }
  function revealDone(g) { return aliveList(g).every(function (i) { var Q = g.players[i]; return flips(Q) >= 2 && !Q.bonus; }); }
  function beginPlay(g) {
    var st, al = aliveList(g);
    if (g.round > 1 && g.lastEnder != null) st = alive(g, g.lastEnder) ? g.lastEnder : nextAlive(g, g.lastEnder);
    else { st = al[0]; al.forEach(function (i) { if (upSum(g.players[i]) > upSum(g.players[st])) st = i; }); }
    g.phase = 'play'; g.turn = st; g.starter = st; g.turnN++;
    log(g, 'Tutti hanno scoperto due carte. Comincia ' + nick(g, st) + (g.round === 1 ? ' (somma più alta: ' + upSum(g.players[st]) + ').' : st === g.lastEnder ? ', che ha chiuso la manche di prima.' : '.'), 'sys', st);
    fx(g, { k: 'turn', p: st });
  }

  /* ---------- turni ---------- */
  function decider(g) {
    if (g.phase === 'play') return g.turn;
    if (g.phase === 'reveal') { for (var i = 0; i < g.players.length; i++) if (alive(g, i) && (flips(g.players[i]) < 2 || g.players[i].bonus)) return i; }
    return null;
  }
  // chi deve ancora fare qualcosa adesso (nella fase delle prime due carte sono tutti insieme)
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'reveal') return aliveList(g).filter(function (i) { return flips(g.players[i]) < 2 || g.players[i].bonus; });
    if (g.phase === 'scores') return aliveList(g).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  // tre carte scoperte uguali in una colonna se ne vanno (in Action anche quattro uguali in riga; le stelle sono jolly)
  function removals(g, p) {
    var P = g.players[p], gone = [], c, cs, v;
    for (c = 0; c < 4; c++) {
      cs = colCells(c); v = same(cs.map(function (i) { return P.grid[i]; }));
      if (v == null) continue;
      if (!g.opts.action && v === STAR) continue;
      cs.forEach(function (i) { g.disc.push(P.grid[i].v); P.grid[i] = null; });
      gone.push({ c: c, cells: cs, v: v });
    }
    if (g.opts.action) for (var r = 0; r < 3; r++) {
      cs = rowCells(r); v = same(cs.map(function (i) { return P.grid[i]; }));
      if (v == null) continue;
      cs.forEach(function (i) { g.disc.push(P.grid[i].v); P.grid[i] = null; });
      gone.push({ r: r, cells: cs, v: v });
    }
    gone.forEach(function (x) {
      var row = x.r != null, bonus = x.v === STAR ? (row ? -15 : -10) : 0;
      if (bonus) P.rb += bonus;
      log(g, nick(g, p) + ' completa ' + (row ? 'una riga' : 'una colonna') + (x.v === STAR ? ' di sole stelle: le carte se ne vanno e guadagna ' + bonus + ' punti!' : ' di ' + sv(x.v) + ': le carte se ne vanno!'), 'col', p);
      fx(g, { k: 'col', p: p, c: x.c, r: x.r, cells: x.cells, v: x.v, bonus: bonus });
    });
    return gone.length;
  }
  function afterMove(g, p) {
    if (g.players[p].bonus) { removals(g, p); g.hold = true; return; }
    endTurn(g, p);
  }
  function endTurn(g, p) {
    removals(g, p);
    var P = g.players[p];
    g.drawn = null; g.hold = false; g.chain = null; g.pick = null;
    if (g.ender == null && allUp(P)) {
      g.ender = p; g.extra = 0;
      log(g, nick(g, p) + ' ha scoperto tutte le carte! Gli altri giocano un ultimo turno.', 'end', p);
      fx(g, { k: 'ender', p: p });
    }
    if (g.extra > 0 && g.ender == null) {
      g.extra--; g.turnN++;
      log(g, nick(g, p) + ' gioca un turno in più' + (g.extra ? ' (poi ancora ' + g.extra + ')' : '') + '.', 'sys', p);
      fx(g, { k: 'turn', p: p, extra: true });
      return;
    }
    g.extra = 0;
    var next = nextAlive(g, p);
    if (g.ender != null && next === g.ender) { endRound(g); return; }
    g.turn = next; g.turnN++;
    fx(g, { k: 'turn', p: next, last: g.ender != null });
  }
  function endRound(g) {
    g.drawn = null; g.extra = 0; g.chain = null; g.pick = null; g.hold = false;
    var flipped = [], al = aliveList(g);
    g.players.forEach(function (P, p) { P.grid.forEach(function (x, i) { if (x && !x.up) { x.up = true; flipped.push({ p: p, i: i }); } }); });
    var e = g.ender;
    var pen = g.players.map(function (P) { return P.out ? 0 : (P.acts || []).length * 10; });
    var sb = g.players.map(function (P) { return P.out ? 0 : P.rb || 0; });
    var raw = g.players.map(function (P, i) { return P.out ? null : rawScore(P) + pen[i] + sb[i]; });
    var lowest = al.every(function (i) { return i === e || raw[e] < raw[i]; });
    var doubled = !lowest && raw[e] > 0;
    var pts = raw.map(function (s, i) { return s == null ? null : i === e && doubled ? s * 2 : s; });
    g.players.forEach(function (P, i) {
      P.hist.push(pts[i]);
      if (P.out) return;
      P.total += pts[i]; P.ready = !!P.bot;
      if (P.acts && P.acts.length) { P.acts.forEach(function (c) { g.adisc.push(c.k); }); log(g, nick(g, i) + ' aveva ancora ' + P.acts.length + (P.acts.length > 1 ? ' carte Azione' : ' carta Azione') + ' in mano: +' + pen[i] + ' punti.', 'pen', i); P.acts = []; }
    });
    g.roundRes = { raw: raw, pts: pts, ender: e, doubled: doubled, lowest: lowest, pen: pen, sb: sb, out: [] };
    g.lastEnder = e;
    fx(g, { k: 'reveal', cells: flipped });
    log(g, 'Fine della manche ' + g.round + '. ' + al.map(function (i) { return nick(g, i) + ' ' + sv(pts[i]); }).join(', ') + '.', 'round');
    if (doubled) log(g, nick(g, e) + ' ha chiuso ma non ha il punteggio più basso: i suoi ' + raw[e] + ' punti raddoppiano (' + pts[e] + ').', 'double', e);
    else log(g, nick(g, e) + ' ha chiuso con ' + (lowest ? 'il punteggio più basso' : 'punti non positivi') + ': niente raddoppio.', 'sys', e);
    var T = g.opts.target, over = false;
    if (g.opts.elim) {
      var gone = al.filter(function (i) { return g.players[i].total >= T; });
      gone.forEach(function (i) { var P = g.players[i]; P.out = true; P.outRound = g.round; P.ready = true; log(g, P.nick + ' arriva a ' + P.total + ' punti ed è eliminato.', 'out', i); });
      g.roundRes.out = gone;
      over = aliveList(g).length <= 1;
    } else over = g.players.some(function (P) { return P.total >= T; });
    if (over) {
      // classifica: chi resta in gioco, poi gli eliminati più tardi; a parità vince il totale più basso
      var key = function (i) { var P = g.players[i]; return [P.out ? P.outRound : 1e9, -P.total]; };
      var better = function (a, b) { var ka = key(a), kb = key(b); return ka[0] - kb[0] || ka[1] - kb[1]; };
      var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return better(b, a) || a - b; });
      var place = g.players.map(function (P, i) { return 1 + order.filter(function (j) { return better(j, i) > 0; }).length; });
      g.winners = order.filter(function (i) { return place[i] === 1; });
      g.final = { order: order, place: place };
      g.phase = 'over';
      var wt = g.players[g.winners[0]].total;
      log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + (g.opts.elim && aliveList(g).length === 1 ? ', l’ultimo rimasto in gioco, con ' : ' con ') + wt + ' punti.', 'win', g.winners[0]);
      fx(g, { k: 'roundEnd', round: g.round, over: true });
      fx(g, { k: 'over', p: g.winners[0] });
    } else {
      g.phase = 'scores';
      fx(g, { k: 'roundEnd', round: g.round, over: false });
    }
  }

  /* ---------- carte Azione ---------- */
  function usable(g, P, j) { var c = P.acts[j]; return !!c && c.t < g.turnN; }
  function gainStar(g, p, v) { if (v === STAR && g.opts.action && g.ender == null && canGetAction(g)) { g.players[p].bonus++; fx(g, { k: 'star', p: p }); } }
  function takeAction(g, p, r) {
    var k;
    if (r === 'deck') k = drawAction(g);
    else { r = +r; if (!(r >= 0 && r < 4) || g.arow[r] == null) return null; k = g.arow[r]; g.arow[r] = null; refillRow(g); }
    if (!k) return null;
    g.players[p].acts.push({ k: k, t: g.turnN });
    fx(g, { k: 'agrab', p: p, r: r, ak: k });
    log(g, nick(g, p) + ' prende la carta Azione ' + an(k) + (r === 'deck' ? ' dal mazzo delle Azioni.' : ' dalla fila.'), 'act', p);
    return k;
  }
  function prot(g, q) { var P = g.players[q]; for (var j = 0; j < P.acts.length; j++) if (P.acts[j].k === 'prot') return j; return -1; }
  function shield(g, q, by) {
    var j = prot(g, q); if (j < 0) return false;
    g.players[q].acts.splice(j, 1); g.adisc.push('prot');
    log(g, nick(g, q) + ' si difende con lo ' + an('prot') + ' dall’azione di ' + nick(g, by) + '.', 'shield', q);
    fx(g, { k: 'shield', p: q, by: by });
    return true;
  }
  function isCell(g, q, i) { i = +i; return alive(g, q) && i >= 0 && i < 12 && i === Math.floor(i) && !!g.players[q].grid[i]; }
  function pl(g, q) { q = +q; return q >= 0 && q < g.players.length && q === Math.floor(q) && alive(g, q) ? q : -1; }
  // controlla i dati di un'azione (senza toccare nulla); j = carta che si sta giocando (per non contarla)
  function check(g, p, k, a, j) {
    var P = g.players[p], q, t;
    switch (k) {
      case 'exch': {
        var p1 = pl(g, a.p1), p2 = pl(g, a.p2);
        if (p1 < 0 || p2 < 0 || p1 === p2) return 'Scegli due carte di due giocatori diversi.';
        if (!isCell(g, p1, a.i1) || !isCell(g, p2, a.i2)) return 'Scegli due carte delle griglie.';
        return null;
      }
      case 'swap2':
        if (!isCell(g, p, a.i1) || !isCell(g, p, a.i2) || +a.i1 === +a.i2) return 'Scegli due carte diverse della tua griglia.';
        return null;
      case 'draw3': return null;
      case 'look': {
        t = pl(g, a.t); if (t < 0) return 'Scegli di chi guardare le carte.';
        var cs = a.row != null ? (+a.row >= 0 && +a.row < 3 ? rowCells(+a.row) : null) : a.col != null ? (+a.col >= 0 && +a.col < 4 ? colCells(+a.col) : null) : null;
        if (!cs) return 'Scegli una riga o una colonna.';
        if (!cs.some(function (i) { return g.players[t].grid[i]; })) return 'In quella fila non ci sono carte.';
        return null;
      }
      case 'rmall': {
        var picks = Array.isArray(a.picks) ? a.picks : [], err = null;
        aliveList(g).forEach(function (o) {
          if (err || o === p || prot(g, o) >= 0) return;
          var Q = g.players[o], x = picks.filter(function (y) { return y && +y.p === o; })[0];
          if (!x) { if (live(Q).length || Q.acts.length) err = 'Scegli una carta per ogni avversario (' + Q.nick + ').'; return; }
          if (x.j != null) { if (!Q.acts[+x.j]) err = 'Quella carta Azione non c’è più.'; }
          else if (!isCell(g, o, x.i)) err = 'Scegli una carta della griglia di ' + Q.nick + '.';
        });
        return err;
      }
      case 'two': case 'prot': return null;
      case 'redo': {
        if (a.j2 == null || !g.adisc[+a.j2]) return 'Scegli una carta Azione tra gli scarti delle Azioni.';
        if (g.adisc[+a.j2] === 'redo') return 'Non puoi ripescare un’altra carta ' + an('redo') + '.';
        return null;
      }
      case 'steal': {
        t = pl(g, a.t); if (t < 0 || t === p) return 'Scegli a quale avversario rubare.';
        if (a.tj == null || !g.players[t].acts[+a.tj]) return 'Scegli una delle sue carte Azione.';
        return null;
      }
    }
    return 'Carta Azione sconosciuta.';
  }
  // esegue l'azione già controllata
  function apply(g, p, k, a) {
    var P = g.players[p];
    switch (k) {
      case 'exch': {
        var p1 = +a.p1, p2 = +a.p2, i1 = +a.i1, i2 = +a.i2;
        if ((p1 !== p && shield(g, p1, p)) || (p2 !== p && shield(g, p2, p))) return;
        var A = g.players[p1].grid[i1], B = g.players[p2].grid[i2];
        g.players[p1].grid[i1] = B; g.players[p2].grid[i2] = A;
        log(g, nick(g, p) + ' scambia ' + (A.up ? 'un ' + sv(A.v) : 'una carta coperta') + ' di ' + nick(g, p1) + ' con ' + (B.up ? 'un ' + sv(B.v) : 'una carta coperta') + ' di ' + nick(g, p2) + '.', 'act', p);
        fx(g, { k: 'exch', p: p, p1: p1, i1: i1, p2: p2, i2: i2 });
        if (p1 !== p) removals(g, p1); if (p2 !== p) removals(g, p2);
        return;
      }
      case 'swap2': {
        var x1 = +a.i1, x2 = +a.i2, t = P.grid[x1]; P.grid[x1] = P.grid[x2]; P.grid[x2] = t;
        log(g, nick(g, p) + ' scambia di posto due carte della sua griglia.', 'act', p);
        fx(g, { k: 'swap2', p: p, i1: x1, i2: x2 });
        return;
      }
      case 'draw3': {
        var cs = [drawCard(g), drawCard(g), drawCard(g)];
        g.pick = { cards: cs };
        log(g, nick(g, p) + ' pesca tre carte: ' + cs.map(sv).join(', ') + '.', 'act', p);
        fx(g, { k: 'draw3', p: p, cards: cs });
        return;
      }
      case 'look': {
        var tt = +a.t, line = a.row != null ? rowCells(+a.row) : colCells(+a.col), T = g.players[tt], seen = [];
        line.forEach(function (i) {
          var x = T.grid[i]; if (!x || x.up) return;
          seen.push({ i: i, v: x.v });
          if (!P.seen.some(function (s) { return s.t === tt && s.i === i; })) P.seen.push({ t: tt, i: i, v: x.v });
        });
        log(g, nick(g, p) + ' sbircia ' + (a.row != null ? 'una riga' : 'una colonna') + (tt === p ? ' della sua griglia.' : ' della griglia di ' + nick(g, tt) + '.'), 'act', p);
        fx(g, { k: 'look', p: p, t: tt, row: a.row != null ? +a.row : null, col: a.col != null ? +a.col : null, cells: seen });
        return;
      }
      case 'rmall': {
        var picks = Array.isArray(a.picks) ? a.picks : [], done = [];
        aliveList(g).forEach(function (o) {
          if (o === p) return;
          var Q = g.players[o];
          if (prot(g, o) >= 0) { shield(g, o, p); return; }
          var x = picks.filter(function (y) { return y && +y.p === o; })[0]; if (!x) return;
          if (x.j != null) { var c = Q.acts.splice(+x.j, 1)[0]; g.adisc.push(c.k); done.push({ p: o, ak: c.k }); log(g, nick(g, p) + ' toglie a ' + Q.nick + ' la carta Azione ' + an(c.k) + '.', 'act', p); }
          else {
            var i = +x.i, old = Q.grid[i]; g.disc.push(old.v);
            Q.grid[i] = { v: drawCard(g), up: false };
            done.push({ p: o, i: i, v: old.v, wasUp: old.up });
            log(g, nick(g, p) + ' toglie a ' + Q.nick + ' ' + (old.up ? 'il ' + sv(old.v) : 'una carta coperta (era un ' + sv(old.v) + ')') + ': al suo posto una carta coperta dal mazzo.', 'act', p);
          }
        });
        fx(g, { k: 'rm', p: p, done: done });
        return;
      }
      case 'two': g.extra += 2; log(g, nick(g, p) + ' giocherà altri due turni di fila.', 'act', p); fx(g, { k: 'extra', p: p, x: 2 }); return;
      case 'prot': g.extra += 1; log(g, nick(g, p) + ' usa lo ' + an('prot') + ' per un turno in più.', 'act', p); fx(g, { k: 'extra', p: p, x: 1 }); return;
      case 'redo': {
        var k2 = g.adisc[+a.j2];
        g.chain = { k: k2, via: 'redo' };
        log(g, nick(g, p) + ' ripesca ' + an(k2) + ' dagli scarti delle Azioni e lo gioca.', 'act', p);
        fx(g, { k: 'chain', p: p, ak: k2, via: 'redo' });
        if (k2 === 'two' || k2 === 'prot' || k2 === 'draw3') { g.chain = null; apply(g, p, k2, {}); }
        return;
      }
      case 'steal': {
        var tq = +a.t, Tq = g.players[tq];
        if (shield(g, tq, p)) return;
        var sc = Tq.acts.splice(+a.tj, 1)[0];
        g.adisc.push(sc.k);
        log(g, nick(g, p) + ' ruba a ' + Tq.nick + ' la carta ' + an(sc.k) + ' e la gioca subito.', 'act', p);
        fx(g, { k: 'steal', p: p, t: tq, ak: sc.k });
        if (sc.k === 'two' || sc.k === 'prot' || sc.k === 'draw3') apply(g, p, sc.k, {});
        else g.chain = { k: sc.k, via: 'steal' };
        return;
      }
    }
  }
  // dopo una carta Azione: se resta qualcosa da decidere (carta rubata o ripescata, tre carte pescate) si aspetta
  function settle(g, p) { if (!g.chain && !g.pick) afterMove(g, p); }

  /* ---------- azioni ---------- */
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    if (g.players[p].out) return 'Sei stato eliminato: ora guardi la partita.';
    var r = doAct(g, p, a);
    if (!r) g.seq++;
    return r;
  }
  function cell(P, i) { i = +i; return i >= 0 && i < 12 && i === Math.floor(i) ? P.grid[i] : null; }
  function doBonus(g, p, a) {
    var P = g.players[p];
    if (!P.bonus) return 'Non hai carte Azione da prendere.';
    if (a.r === 'skip') log(g, nick(g, p) + ' rinuncia alla carta Azione.', 'act', p);
    else if (!takeAction(g, p, a.r)) return 'Scegli una carta Azione della fila o il mazzo delle Azioni.';
    P.bonus--;
    if (!canGetAction(g)) P.bonus = 0;
    if (g.phase === 'reveal') { if (revealDone(g)) beginPlay(g); return null; }
    if (!P.bonus && g.hold) endTurn(g, p);
    return null;
  }
  function doAct(g, p, a) {
    var P = g.players[p], c;
    if (g.phase === 'reveal') {
      if (a.a === 'bonus') return doBonus(g, p, a);
      if (a.a !== 'flip') return 'Prima scopri due carte della tua griglia.';
      if (flips(P) >= 2) return 'Hai già scoperto due carte: aspetta gli altri.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta della tua griglia.';
      if (c.up) return 'Questa carta è già scoperta.';
      c.up = true;
      fx(g, { k: 'flip', p: p, i: +a.i, v: c.v, open: true });
      gainStar(g, p, c.v);
      if (revealDone(g)) beginPlay(g);
      return null;
    }
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'La manche è finita: tocca «Prossima manche».';
      if (P.ready) return null;
      P.ready = true;
      if (aliveList(g).every(function (i) { return g.players[i].ready || g.players[i].bot; })) { startRound(g); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    if (P.bonus) { if (a.a !== 'bonus') return 'Prima scegli la carta Azione (o rinuncia).'; return doBonus(g, p, a); }
    if (g.chain) {
      if (a.a !== 'chain') return 'Prima gioca la carta ' + an(g.chain.k) + '.';
      var k2 = g.chain.k;
      if (a.skip) { g.chain = null; log(g, nick(g, p) + ' rinuncia all’effetto di ' + an(k2) + '.', 'act', p); settle(g, p); return null; }
      var e2 = check(g, p, k2, a); if (e2) return e2;
      g.chain = null; apply(g, p, k2, a); settle(g, p); return null;
    }
    if (g.pick) {
      if (a.a !== 'pick') return 'Prima scegli una delle tre carte pescate.';
      var cs = g.pick.cards, ci = +a.c;
      c = cell(P, a.i); if (!c) return 'Scegli una carta della tua griglia.';
      if (ci === -1) {
        if (c.up) return 'Scegli una carta coperta da scoprire.';
        cs.forEach(function (v) { g.disc.push(v); }); c.up = true; g.pick = null;
        fx(g, { k: 'pick', p: p, c: -1, i: +a.i, cards: cs, v: c.v });
        log(g, nick(g, p) + ' scarta le tre carte e scopre un ' + sv(c.v) + '.', 'drop', p);
        gainStar(g, p, c.v);
      } else {
        if (!(ci >= 0 && ci < 3)) return 'Scegli una delle tre carte.';
        var kv = cs[ci], ov = c.v, wu = c.up;
        cs.forEach(function (v, j) { if (j !== ci) g.disc.push(v); });
        P.grid[+a.i] = { v: kv, up: true }; g.disc.push(ov); g.pick = null;
        fx(g, { k: 'pick', p: p, c: ci, i: +a.i, cards: cs, v: kv, old: ov, wasUp: wu });
        log(g, nick(g, p) + ' tiene il ' + sv(kv) + ' al posto di ' + (wu ? 'un ' + sv(ov) : 'una carta coperta (era un ' + sv(ov) + ')') + ' e scarta le altre due.', 'swap', p);
        gainStar(g, p, kv);
      }
      afterMove(g, p); return null;
    }
    if (a.a === 'draw') {
      if (g.drawn) return 'Hai già una carta in mano: tienila o scartala.';
      var v = drawCard(g);
      g.drawn = { v: v, from: 'deck' };
      fx(g, { k: 'draw', p: p, v: v });
      log(g, nick(g, p) + ' pesca ' + (v === STAR ? 'una stella' : 'un ' + sv(v)) + ' dal mazzo.', 'draw', p);
      gainStar(g, p, v);
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
      gainStar(g, p, tv);
      afterMove(g, p); return null;
    }
    if (a.a === 'swap') {   // tiene la carta pescata al posto della casella i
      if (!g.drawn) return 'Prima pesca una carta o prendi quella degli scarti.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta della tua griglia.';
      var nv = g.drawn.v, ov2 = c.v, up0 = c.up;
      P.grid[+a.i] = { v: nv, up: true }; g.disc.push(ov2);
      fx(g, { k: 'swap', p: p, i: +a.i, v: nv, old: ov2, wasUp: up0, from: 'deck' });
      log(g, nick(g, p) + ' tiene il ' + sv(nv) + ' al posto di ' + (up0 ? 'un ' + sv(ov2) : 'una carta coperta (era un ' + sv(ov2) + ')') + '.', 'swap', p);
      endTurn(g, p); return null;
    }
    if (a.a === 'drop') {   // scarta la carta pescata e scopre la casella i
      if (!g.drawn) return 'Prima pesca una carta dal mazzo.';
      c = cell(P, a.i); if (!c) return 'Scegli una carta coperta della tua griglia.';
      if (c.up) return 'Scegli una carta ancora coperta da scoprire.';
      var dv = g.drawn.v; g.disc.push(dv); c.up = true; g.drawn = null;
      fx(g, { k: 'drop', p: p, v: dv }); fx(g, { k: 'flip', p: p, i: +a.i, v: c.v });
      log(g, nick(g, p) + ' scarta il ' + sv(dv) + ' e scopre ' + (c.v === STAR ? 'una stella' : 'un ' + sv(c.v)) + '.', 'drop', p);
      gainStar(g, p, c.v);
      afterMove(g, p); return null;
    }
    // --- carte Azione (solo in Skyjo Action) ---
    if (a.a === 'grab' || a.a === 'use' || a.a === 'toss') {
      if (!g.opts.action) return 'In questa partita non ci sono carte Azione.';
      if (g.drawn) return 'Hai già pescato: tieni la carta o scartala.';
      if (g.ender != null) return 'Qualcuno ha già chiuso la manche: niente più carte Azione.';
    }
    if (a.a === 'grab') {   // prendere una carta Azione è il turno
      if (!takeAction(g, p, a.r)) return 'Scegli una carta Azione della fila o il mazzo delle Azioni.';
      afterMove(g, p); return null;
    }
    if (a.a === 'toss') {   // scartare una carta Azione senza effetto (per non pagarla a fine manche)
      var tj = +a.j; if (!P.acts[tj]) return 'Scegli una delle tue carte Azione.';
      var tk = P.acts.splice(tj, 1)[0].k; g.adisc.push(tk);
      log(g, nick(g, p) + ' scarta la carta Azione ' + an(tk) + ' senza usarla.', 'act', p);
      fx(g, { k: 'toss', p: p, ak: tk });
      afterMove(g, p); return null;
    }
    if (a.a === 'use') {
      var j = +a.j, card = P.acts[j];
      if (!card) return 'Scegli una delle tue carte Azione.';
      if (!usable(g, P, j)) return 'Questa carta l’hai presa in questo turno: potrai giocarla dal prossimo.';
      var err = check(g, p, card.k, a, j); if (err) return err;
      // la carta lascia la mano prima dell'effetto (così Ripesca e Furto non la vedono)
      P.acts.splice(j, 1);
      log(g, nick(g, p) + ' gioca la carta Azione ' + an(card.k) + '.', 'act', p);
      fx(g, { k: 'ause', p: p, ak: card.k });
      apply(g, p, card.k, a);
      g.adisc.push(card.k);
      settle(g, p); return null;
    }
    return 'Mossa sconosciuta.';
  }

  // l'host fa partire la manche successiva senza aspettare chi non ha ancora toccato «Prossima manche»
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g); fx(g, { k: 'next' }); g.seq++; return true; }

  return { newGame: newGame, act: act, decider: decider, forceNext: forceNext, pending: pending, flips: flips, upSum: upSum, rawScore: rawScore, allUp: allUp, hidden: hidden, live: live,
    colCells: colCells, rowCells: rowCells, col: col, fullDeck: fullDeck, actionDeck: actionDeck, aDeck: aDeck, setRandom: setRandom, shuffle: shuffle, sv: sv, val: val, MEAN: MEAN, STAR: STAR,
    ACTS: ACTS, ATYPES: ATYPES, alive: alive, aliveList: aliveList, nextAlive: nextAlive, usable: usable, check: check, same: same };
})();
if (typeof module !== 'undefined') module.exports = SKEngine;
