/* ===== Dadi del bugiardo: motore delle regole (gira sull'host; lo stato è JSON) =====
   Gioco tradizionale di bluff con i dadi, da 2 a 8 giocatori. Ognuno ha 5 dadi (da 3 a 7, a scelta) sotto il bicchiere e
   vede solo i suoi. A turno si dichiara quanti dadi di un valore ci sono IN TUTTO il tavolo («quattro 5»): chi viene
   dopo deve alzare (più dadi, oppure stessi dadi con un valore più alto) oppure dire «Dubito!». Con «Esatto!» si
   scommette che il numero sia proprio quello.
   - Gli 1 sono jolly (se attivi): valgono come qualunque valore. Dichiarare sugli 1 dimezza la quantità (per eccesso);
     tornare dagli 1 a un altro valore la raddoppia, più uno.
   - Dubito: si alzano i bicchieri. Se ci sono almeno i dadi dichiarati perde un dado chi ha dubitato, altrimenti chi ha
     dichiarato. Esatto: se il numero è giusto chi l'ha detto riprende un dado (fino al massimo), se no ne perde uno.
   - Chi resta senza dadi è fuori; vince l'ultimo con almeno un dado. Il nuovo giro lo apre chi ha perso il dado.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var LBEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var OPT = { dice: [3, 4, 5, 6, 7] }, SHOW_MS = 14000;
  var NUM = ['zero', 'un', 'due', 'tre', 'quattro', 'cinque', 'sei', 'sette', 'otto', 'nove', 'dieci', 'undici', 'dodici', 'tredici', 'quattordici', 'quindici', 'sedici', 'diciassette', 'diciotto', 'diciannove', 'venti'];
  var TENS = ['', '', 'venti', 'trenta', 'quaranta', 'cinquanta', 'sessanta', 'settanta', 'ottanta', 'novanta'];
  function qTxt(q) {
    if (q < NUM.length) return NUM[q];
    if (q > 99) return String(q);
    var t = TENS[Math.floor(q / 10)], u = q % 10;
    if (!u) return t;
    if (u === 1 || u === 8) t = t.slice(0, -1);   // ventuno, trentotto
    return t + (u === 1 ? 'uno' : u === 3 ? 'tré' : NUM[u]);
  }
  function bidTxt(b) { return b ? (b.q === 1 ? 'un ' + b.f : qTxt(b.q) + ' ' + b.f) : ''; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function alive(g) { return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].out; }); }
  function totalDice(g) { return g.players.reduce(function (a, P) { return a + (P.out ? 0 : P.n); }, 0); }
  function roll(n) { var d = []; for (var i = 0; i < n; i++) d.push(1 + Math.floor(rand() * 6)); return d.sort(); }
  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { dice: pick(OPT.dice, opts.dice, 5), ones: opts.ones == null ? true : opts.ones !== false && opts.ones !== '0' && opts.ones !== 0, exact: opts.exact == null ? true : opts.exact !== false && opts.exact !== '0' && opts.exact !== 0, timer: opts.timer == null ? 60 : +opts.timer };
    var g = {
      v: 1, phase: 'bid', seq: 0, turnN: 0, round: 0, clock: now, opts: o, turn: 0, bid: null, bids: [],
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, n: o.dice, dice: [], out: false, ready: false }; }),
      until: 0, res: null, elim: [], log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    startRound(g, Math.floor(rand() * g.players.length), now);
    return g;
  }
  function nextAlive(g, p) { var n = g.players.length; for (var k = 1; k <= n; k++) { var q = (p + k) % n; if (!g.players[q].out) return q; } return p; }
  function startRound(g, first, now) {
    g.round++; g.phase = 'bid'; g.bid = null; g.bids = []; g.res = null; g.until = 0; g.clock = now; g.turnN++;
    if (g.players[first].out) first = nextAlive(g, first);
    g.turn = first;
    g.players.forEach(function (P) { P.dice = P.out ? [] : roll(P.n); P.ready = false; });
    log(g, 'Giro ' + g.round + ': tutti scuotono i bicchieri. Apre ' + nick(g, first) + '. In gioco ' + totalDice(g) + ' dadi.', 'sys');
    fx(g, { k: 'roll', round: g.round, first: first });
  }
  // la dichiarazione b è più alta della precedente?
  function higher(g, b, prev) {
    if (!prev) return g.opts.ones ? b.f !== 1 : true;
    if (!g.opts.ones) return b.q > prev.q || (b.q === prev.q && b.f > prev.f);
    if (prev.f !== 1 && b.f !== 1) return b.q > prev.q || (b.q === prev.q && b.f > prev.f);
    if (prev.f !== 1 && b.f === 1) return b.q >= Math.ceil(prev.q / 2);
    if (prev.f === 1 && b.f === 1) return b.q > prev.q;
    return b.q >= prev.q * 2 + 1;
  }
  // la più bassa dichiarazione valida su un valore
  function minQ(g, f, prev) {
    if (!prev) return 1;
    for (var q = 1; q <= totalDice(g) * 2 + 2; q++) if (higher(g, { q: q, f: f }, prev)) return q;
    return 99;
  }
  function count(g, f) {
    var c = 0;
    g.players.forEach(function (P) { if (!P.out) P.dice.forEach(function (d) { if (d === f || (g.opts.ones && f !== 1 && d === 1)) c++; }); });
    return c;
  }
  function decider(g) { return g.phase === 'bid' ? g.turn : null; }
  function pending(g) { return g.phase === 'bid' ? [g.turn] : g.phase === 'show' ? alive(g).filter(function (i) { return !g.players[i].ready; }) : []; }
  function loseDie(g, p) {
    var P = g.players[p]; P.n--;
    if (P.n <= 0) { P.n = 0; P.out = true; g.elim.push(p); log(g, nick(g, p) + ' ha perso l’ultimo dado: è fuori!', 'out', p); }
  }
  function settle(g, p, kind, now) {
    var b = g.bid, c = count(g, b.f), bidder = b.p, loser = null, gainer = null;
    if (kind === 'doubt') {
      loser = c >= b.q ? p : bidder;
      log(g, nick(g, p) + ' dice «Dubito!» su ' + bidTxt(b) + ' di ' + nick(g, bidder) + ': ce ne sono ' + c + '. Perde un dado ' + nick(g, loser) + '.', 'doubt', p);
    } else {
      if (c === b.q) { if (g.players[p].n < g.opts.dice) gainer = p; log(g, nick(g, p) + ' dice «Esatto!» su ' + bidTxt(b) + ': sono proprio ' + c + '! ' + (gainer != null ? 'Riprende un dado.' : 'Ha già tutti i dadi.'), 'exact', p); }
      else { loser = p; log(g, nick(g, p) + ' dice «Esatto!» su ' + bidTxt(b) + ', ma sono ' + c + ': perde un dado.', 'doubt', p); }
    }
    g.res = { kind: kind, by: p, bidder: bidder, bid: { q: b.q, f: b.f }, count: c, loser: loser, gainer: gainer, ok: kind === 'doubt' ? c < b.q : c === b.q, dice: g.players.map(function (P) { return P.dice.slice(); }), next: loser != null ? loser : p };
    if (gainer != null) g.players[gainer].n++;
    if (loser != null) loseDie(g, loser);
    fx(g, { k: 'reveal', kind: kind, by: p, ok: g.res.ok });
    var left = alive(g);
    if (left.length <= 1) { finish(g, left[0]); return; }
    g.phase = 'show'; g.until = now + SHOW_MS; g.clock = now; g.turnN++;
    g.players.forEach(function (P) { P.ready = !!P.bot || P.out; });
  }
  function finish(g, w) {
    g.phase = 'over'; g.winners = [w];
    var order = [w].concat(g.elim.slice().reverse()), place = g.players.map(function () { return 0; });
    order.forEach(function (p, k) { place[p] = k + 1; });
    g.final = { order: order, place: place };
    log(g, 'Vince ' + nick(g, w) + ', l’ultimo con i dadi in mano!', 'win', w);
    fx(g, { k: 'over', w: w });
  }
  function tick(g, now) {
    if (g.phase !== 'show' || now < g.until) return false;
    startRound(g, g.res.next, now); g.seq++; return true;
  }
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
    if (g.phase === 'show') {
      if (a.a !== 'next') return 'Tocca «Prossimo giro».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot || Q.out; })) { startRound(g, g.res.next, now); }
      return null;
    }
    if (g.phase !== 'bid') return 'Mossa non valida.';
    if (P.out) return 'Sei fuori: guarda come finisce!';
    if (g.turn !== p) return 'Non è il tuo turno: aspetta ' + nick(g, g.turn) + '.';
    if (a.a === 'bid') {
      var b = { q: Math.floor(+a.q), f: Math.floor(+a.f) };
      if (!(b.q >= 1) || !(b.f >= 1 && b.f <= 6)) return 'Dichiarazione non valida.';
      if (b.q > totalDice(g)) return 'In gioco ci sono solo ' + totalDice(g) + ' dadi.';
      if (!higher(g, b, g.bid)) return !g.bid ? 'Non si apre sugli 1: sono jolly.' : 'Devi alzare: più di ' + bidTxt(g.bid) + '.';
      b.p = p; g.bid = b; g.bids.push(b);
      log(g, nick(g, p) + ': «' + bidTxt(b) + '».', 'bid', p);
      fx(g, { k: 'bid', p: p, q: b.q, f: b.f });
      g.turn = nextAlive(g, p); g.turnN++;
      return null;
    }
    if (a.a === 'doubt' || a.a === 'exact') {
      if (!g.bid) return 'Non c’è ancora nessuna dichiarazione.';
      if (a.a === 'exact' && !g.opts.exact) return '«Esatto!» non si usa a questo tavolo.';
      settle(g, p, a.a, now);
      return null;
    }
    return 'Mossa non valida.';
  }
  function forceNext(g, now) { now = now || Date.now(); if (g.phase === 'show') { startRound(g, g.res.next, now); g.seq++; return true; } return false; }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, higher: higher, minQ: minQ, count: count, alive: alive, totalDice: totalDice, bidTxt: bidTxt, qTxt: qTxt, nextAlive: nextAlive,
    setRandom: setRandom, shuffle: shuffle, OPT: OPT, SHOW_MS: SHOW_MS };
})();
if (typeof module !== 'undefined') module.exports = LBEngine;
