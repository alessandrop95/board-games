/* ===== Cabo: motore delle regole (gira sull'host; lo stato è JSON) =====
   52 carte: due 0, quattro per ogni valore da 1 a 12, due 13. Ognuno ha 4 carte coperte in fila e all'inizio
   della manche ne guarda 2 (solo lui). Le carte non cambiano posto nella fila.
   Nel turno si fa una di tre cose:
   - si pesca dal mazzo: la carta si scarta (se è 7-8 si può sbirciare una propria carta, 9-10 spiare una carta
     di un altro, 11-12 scambiare una propria carta con una di un altro senza guardarle) oppure si scambia con una
     o più carte della propria fila;
   - si prende la carta in cima agli scarti e la si scambia per forza con una o più carte della propria fila;
   - si chiama «Cabo»: gli altri giocano un ultimo turno e poi si conta.
   Scambiando più carte insieme devono essere tutte dello stesso valore: allora se ne vanno tutte e al loro posto
   resta solo la carta nuova. Se non sono uguali restano lì scoperte e la carta nuova si aggiunge in fondo
   (tentando con 3 o più carte si pesca anche una carta di penalità).
   Punti: somma delle carte. Chi ha chiamato Cabo prende 0 se ha il punteggio più basso (anche a pari merito),
   altrimenti la somma +10. Kamikaze: chi chiude con due 12 e due 13 e basta prende 0 e tutti gli altri 50.
   Si arriva alla soglia (100): chi la supera perde, vince il totale più basso. Chi arriva esattamente alla soglia
   scende alla metà (una volta sola per partita). La manche finisce anche se il mazzo si esaurisce. */
var CBEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var MEAN = 338 / 52;   // valore medio di una carta che non si conosce
  function fullDeck() { var d = [], id = 0, v, k; for (k = 0; k < 2; k++) d.push({ id: id++, v: 0 }); for (v = 1; v <= 12; v++) for (k = 0; k < 4; k++) d.push({ id: id++, v: v }); for (k = 0; k < 2; k++) d.push({ id: id++, v: 13 }); return d; }
  function power(v) { return v === 7 || v === 8 ? 'peek' : v === 9 || v === 10 ? 'spy' : v === 11 || v === 12 ? 'trade' : null; }
  var PNAME = { peek: 'Sbircia', spy: 'Spia', trade: 'Scambia' };
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 16) g.fx.splice(0, g.fx.length - 16); }
  function sum(P) { return P.line.reduce(function (s, c) { return s + c.v; }, 0); }
  function know(P, c) { P.know[c.id] = 1; }
  function knows(P, c) { return !!(c.up || P.know[c.id]); }
  function kamikaze(P) { var v = P.line.map(function (c) { return c.v; }).sort(); return v.length === 4 && v.join() === '12,12,13,13'; }
  function card(c) { return c.v === 0 ? 'uno 0' : 'un ' + c.v; }

  /* ---------- nuova partita e nuova manche ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var target = [50, 100, 150].indexOf(+opts.target) >= 0 ? +opts.target : 100;
    var g = {
      v: 1, phase: 'peek', seq: 0, turnN: 0, round: 0,
      opts: { target: target, memo: opts.memo === 'easy' ? 'easy' : 'classic' },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, line: [], know: {}, looks: 0, total: 0, hist: [], reset: false, ready: false }; }),
      deck: [], disc: [], turn: 0, drawn: null, caller: null, starter: null, power: null,
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null
    };
    startRound(g, Math.floor(rand() * seats.length));
    return g;
  }
  function startRound(g, starter) {
    g.round++; g.phase = 'peek'; g.drawn = null; g.caller = null; g.power = null; g.roundRes = null; g.starter = starter;
    g.deck = shuffle(fullDeck()); g.disc = [];
    g.players.forEach(function (P) { P.line = []; P.know = {}; P.looks = 0; P.ready = false; });
    for (var k = 0; k < 4; k++) g.players.forEach(function (P) { var c = g.deck.pop(); c.up = false; P.line.push(c); });
    var d = g.deck.pop(); g.disc.push({ id: d.id, v: d.v });
    log(g, 'Manche ' + g.round + ': ognuno riceve 4 carte coperte e ne guarda 2, di nascosto. Ricordatele!', 'sys');
    fx(g, { k: 'deal', round: g.round });
  }
  function beginPlay(g) {
    g.phase = 'play'; g.turn = g.starter; g.turnN++;
    log(g, 'Tutti hanno guardato le loro carte. Comincia ' + nick(g, g.starter) + '.', 'sys', g.starter);
    fx(g, { k: 'turn', p: g.starter });
  }

  /* ---------- turni ---------- */
  function decider(g) {
    if (g.phase === 'play') return g.turn;
    if (g.phase === 'peek') { for (var i = 0; i < g.players.length; i++) if (g.players[i].looks < 2) return i; }
    return null;
  }
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'peek') return g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].looks < 2; });
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function endTurn(g, p) {
    g.drawn = null; g.power = null;
    var next = (p + 1) % g.players.length;
    if (g.caller != null && next === g.caller) { endRound(g, 'cabo'); return; }
    if (!g.deck.length) { log(g, 'Il mazzo è finito: la manche si chiude qui.', 'end'); endRound(g, 'deck'); return; }
    g.turn = next; g.turnN++;
    fx(g, { k: 'turn', p: next, last: g.caller != null });
  }
  function endRound(g, why) {
    g.drawn = null; g.power = null;
    var flipped = [];
    g.players.forEach(function (P, p) { P.line.forEach(function (c, i) { if (!c.up) { c.up = true; flipped.push({ p: p, i: i }); } }); });
    var n = g.players.length, raw = g.players.map(sum), kami = -1, cl = g.caller;
    g.players.forEach(function (P, i) { if (kami < 0 && kamikaze(P)) kami = i; });
    var low = Math.min.apply(null, raw), pts, callerOk = null, halved = [];
    if (kami >= 0) pts = raw.map(function (s, i) { return i === kami ? 0 : 50; });
    else pts = raw.map(function (s, i) {
      if (i !== cl) return s;
      callerOk = s === low;
      return callerOk ? 0 : s + 10;
    });
    g.players.forEach(function (P, i) {
      P.hist.push(pts[i]); P.total += pts[i]; P.ready = !!P.bot;
      if (P.total === g.opts.target && !P.reset) { P.total = g.opts.target / 2; P.reset = true; halved.push(i); }
    });
    g.roundRes = { raw: raw, pts: pts, caller: cl, callerOk: callerOk, kami: kami, why: why, halved: halved };
    fx(g, { k: 'reveal', cells: flipped });
    log(g, 'Fine della manche ' + g.round + '. ' + g.players.map(function (P, i) { return P.nick + ' ' + pts[i]; }).join(', ') + '.', 'round');
    if (kami >= 0) log(g, 'KAMIKAZE! ' + nick(g, kami) + ' chiude con due 12 e due 13: prende 0 punti e tutti gli altri 50!', 'double', kami);
    else if (cl != null) log(g, nick(g, cl) + (callerOk ? ' aveva chiamato Cabo con il punteggio più basso: 0 punti!' : ' aveva chiamato Cabo ma non aveva il punteggio più basso: ' + raw[cl] + ' + 10 di penalità.'), callerOk ? 'win' : 'double', cl);
    halved.forEach(function (i) { log(g, nick(g, i) + ' è arrivato esattamente a ' + g.opts.target + ' punti: scende a ' + g.opts.target / 2 + '!', 'win', i); });
    // chi comincia la prossima manche: il punteggio più basso di questa (a pari merito il più vicino a chi aveva cominciato)
    var st = null; for (var k = 0; k < n; k++) { var q = (g.starter + k) % n; if (st == null || pts[q] < pts[st]) st = q; }
    g.nextStarter = st;
    if (g.players.some(function (P) { return P.total > g.opts.target; })) {
      var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return g.players[a].total - g.players[b].total || pts[a] - pts[b] || a - b; });
      var place = g.players.map(function (P, i) { return 1 + g.players.filter(function (Q, j) { return Q.total < P.total || (Q.total === P.total && pts[j] < pts[i]); }).length; });
      g.winners = order.filter(function (i) { return place[i] === 1; });
      g.final = { order: order, place: place };
      g.phase = 'over';
      log(g, (g.winners.length > 1 ? 'Pari! Vincono ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + g.players[g.winners[0]].total + ' punti.', 'win', g.winners[0]);
      fx(g, { k: 'roundEnd', round: g.round, over: true });
      fx(g, { k: 'over', p: g.winners[0] });
    } else {
      g.phase = 'scores';
      fx(g, { k: 'roundEnd', round: g.round, over: false });
    }
  }

  /* ---------- scambio con una o più carte della propria fila ---------- */
  function exchange(g, p, cells, c, from) {
    var P = g.players[p], idx = cells.slice().sort(function (a, b) { return a - b; });
    var sel = idx.map(function (i) { return P.line[i]; });
    var same = sel.every(function (x) { return x.v === sel[0].v; });
    var face = from === 'disc';
    if (same) {
      var at = idx[0];
      sel.forEach(function (x) { g.disc.push({ id: x.id, v: x.v }); });
      for (var k = idx.length - 1; k >= 1; k--) P.line.splice(idx[k], 1);
      P.line[at] = { id: c.id, v: c.v, up: face };
      know(P, c);
      log(g, nick(g, p) + (face ? ' prende ' + card(c) + ' dagli scarti' : ' tiene la carta pescata') + ' e scarta ' + (sel.length > 1 ? sel.length + ' carte da ' + sel[0].v + ' insieme' : card(sel[0])) + '.', 'swap', p);
      fx(g, { k: 'swap', p: p, cells: idx, at: at, v: c.v, id: c.id, from: from, up: face, old: sel.map(function (x) { return { v: x.v, up: !!x.up }; }) });
      return true;
    }
    // non sono uguali: restano scoperte e la carta nuova va in fondo
    sel.forEach(function (x) { x.up = true; });
    P.line.push({ id: c.id, v: c.v, up: face }); know(P, c);
    var extra = null;
    if (idx.length >= 3 && g.deck.length) { var e = g.deck.pop(); extra = { id: e.id, v: e.v, up: false }; P.line.push(extra); }
    log(g, nick(g, p) + ' prova a scartare ' + idx.length + ' carte uguali ma non lo sono (' + sel.map(function (x) { return x.v; }).join(', ') + '): restano scoperte e la carta nuova si aggiunge in fondo' + (extra ? ', più una carta di penalità' : '') + '.', 'double', p);
    fx(g, { k: 'miss', p: p, cells: idx, v: c.v, from: from, up: face, extra: !!extra });
    return false;
  }
  function validCells(P, cells) {
    if (!Array.isArray(cells) || !cells.length || cells.length > P.line.length) return null;
    var seen = {}, out = [];
    for (var k = 0; k < cells.length; k++) { var i = +cells[k]; if (!(i >= 0 && i < P.line.length) || i !== Math.floor(i) || seen[i]) return null; seen[i] = 1; out.push(i); }
    return out;
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
  function doAct(g, p, a) {
    var P = g.players[p], c, cells;
    if (g.phase === 'peek') {
      if (a.a !== 'look') return 'Prima guarda due delle tue carte.';
      if (P.looks >= 2) return 'Hai già guardato due carte: aspetta gli altri.';
      c = P.line[+a.i]; if (!c) return 'Scegli una delle tue carte.';
      if (P.know[c.id]) return 'Questa l’hai già guardata: scegline un’altra.';
      know(P, c); P.looks++;
      fx(g, { k: 'see', p: p, t: p, i: +a.i, v: c.v, why: 'start' });
      if (g.players.every(function (Q) { return Q.looks >= 2; })) beginPlay(g);
      return null;
    }
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'La manche è finita: tocca «Prossima manche».';
      if (P.ready) return null;
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g, g.nextStarter); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    // potere di una carta appena scartata
    if (g.power) {
      var k = g.power.k;
      if (a.a === 'skip') { log(g, nick(g, p) + ' non usa il potere «' + PNAME[k] + '».', 'act', p); endTurn(g, p); return null; }
      if (a.a !== k) return 'Usa il potere «' + PNAME[k] + '» della carta che hai scartato (o rinuncia).';
      if (k === 'peek') {
        c = P.line[+a.i]; if (!c) return 'Scegli una delle tue carte.';
        know(P, c);
        log(g, nick(g, p) + ' sbircia una delle sue carte.', 'act', p);
        fx(g, { k: 'see', p: p, t: p, i: +a.i, v: c.v, why: 'peek' });
        endTurn(g, p); return null;
      }
      var t = +a.t; if (!(t >= 0 && t < g.players.length) || t === p) return 'Scegli un altro giocatore.';
      var T = g.players[t];
      if (k === 'spy') {
        c = T.line[+a.j]; if (!c) return 'Scegli una carta di ' + T.nick + '.';
        know(P, c);
        log(g, nick(g, p) + ' spia una carta di ' + T.nick + '.', 'act', p);
        fx(g, { k: 'see', p: p, t: t, i: +a.j, v: c.v, why: 'spy' });
        endTurn(g, p); return null;
      }
      // trade: una mia carta con una dell'altro, senza guardarle; restano nella stessa posizione
      var mine = P.line[+a.i], his = T.line[+a.j];
      if (!mine || !his) return 'Scegli una tua carta e una di ' + T.nick + '.';
      P.line[+a.i] = his; T.line[+a.j] = mine;
      log(g, nick(g, p) + ' scambia una sua carta con una di ' + T.nick + ' (la ' + (+a.i + 1) + 'ª con la ' + (+a.j + 1) + 'ª).', 'act', p);
      fx(g, { k: 'trade', p: p, i: +a.i, t: t, j: +a.j });
      endTurn(g, p); return null;
    }
    if (a.a === 'cabo') {
      if (g.drawn) return 'Hai già pescato: finisci il turno.';
      if (g.caller != null) return 'Cabo è già stato chiamato.';
      g.caller = p;
      log(g, nick(g, p) + ' chiama CABO! Gli altri giocano un ultimo turno.', 'end', p);
      fx(g, { k: 'cabo', p: p });
      endTurn(g, p); return null;
    }
    if (a.a === 'draw') {
      if (g.drawn) return 'Hai già pescato.';
      if (!g.deck.length) return 'Il mazzo è finito.';
      c = g.deck.pop(); g.drawn = { id: c.id, v: c.v, from: 'deck' }; know(P, c);
      fx(g, { k: 'draw', p: p });
      log(g, nick(g, p) + ' pesca dal mazzo.', 'draw', p);
      return null;
    }
    if (a.a === 'take') {   // prende la carta degli scarti e la scambia per forza
      if (g.drawn) return 'Hai già pescato dal mazzo.';
      if (!g.disc.length) return 'Gli scarti sono vuoti.';
      cells = validCells(P, a.cells); if (!cells) return 'Scegli una o più carte della tua fila da scambiare.';
      c = g.disc.pop();
      exchange(g, p, cells, c, 'disc');
      endTurn(g, p); return null;
    }
    if (a.a === 'swap') {   // tiene la carta pescata
      if (!g.drawn) return 'Prima pesca o prendi dagli scarti.';
      cells = validCells(P, a.cells); if (!cells) return 'Scegli una o più carte della tua fila da scambiare.';
      c = g.drawn; g.drawn = null;
      exchange(g, p, cells, c, 'deck');
      endTurn(g, p); return null;
    }
    if (a.a === 'discard') {   // scarta la carta pescata (e magari ne usa il potere)
      if (!g.drawn) return 'Prima pesca dal mazzo.';
      c = g.drawn; g.drawn = null; g.disc.push({ id: c.id, v: c.v });
      var pw = power(c.v);
      fx(g, { k: 'drop', p: p, v: c.v, pw: pw });
      log(g, nick(g, p) + ' scarta ' + card(c) + (pw ? ' e può usare il potere «' + PNAME[pw] + '».' : '.'), 'drop', p);
      if (pw) { g.power = { k: pw }; return null; }
      endTurn(g, p); return null;
    }
    return 'Mossa sconosciuta.';
  }

  // l'host fa partire la manche successiva senza aspettare chi non ha ancora toccato «Prossima manche»
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g, g.nextStarter); fx(g, { k: 'next' }); g.seq++; return true; }

  return { newGame: newGame, act: act, decider: decider, forceNext: forceNext, pending: pending, sum: sum, knows: knows, kamikaze: kamikaze,
    fullDeck: fullDeck, power: power, PNAME: PNAME, setRandom: setRandom, shuffle: shuffle, MEAN: MEAN };
})();
if (typeof module !== 'undefined') module.exports = CBEngine;
