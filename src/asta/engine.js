/* ===== Asta lampo: motore delle regole (gira sull'host; lo stato è JSON) =====
   Asta a offerte segrete e simultanee, da 2 a 6 giocatori. Ognuno parte con 20 monete. A ogni giro si scopre un
   lotto e tutti offrono in segreto, nello stesso momento (chi non offre in tempo offre 0).
   - Gemma (4 colori, valori da 1 a 4): vince l'offerta più alta, che si paga alla banca. Se c'è un pareggio in
     testa nessuno vince e nessuno paga: la gemma resta sul banco e il giro dopo se ne aggiunge un'altra (il lotto
     cresce finché qualcuno non lo vince da solo).
   - Maledizione (da -2 a -5 punti): la prende chi offre MENO, che incassa le offerte di tutti gli altri. A parità
     tra i più bassi la prende chi ha più monete.
   Alla fine: valore delle gemme + 5 punti per ogni colore in cui si ha il totale più alto (2 a testa se pari) +
   4 punti per ogni collezione di 4 colori diversi + maledizioni (negative) + 1 punto ogni 2 monete rimaste.
   Le funzioni che dipendono dall'ora ricevono «now» (millisecondi dell'host). */
var ALEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var COLORS = [['Rubino', 'Rubini'], ['Zaffiro', 'Zaffiri'], ['Smeraldo', 'Smeraldi'], ['Topazio', 'Topazi']];
  var CARDS = [];
  for (var c = 0; c < 4; c++) for (var v = 1; v <= 4; v++) CARDS.push({ id: CARDS.length, k: 'gem', c: c, v: v });
  [-2, -3, -4, -5].forEach(function (v) { CARDS.push({ id: CARDS.length, k: 'curse', v: v }); });
  var OPT = { lots: [12, 20], time: [15, 25, 40] }, COINS = 20, SHOW_MS = 6500, MAJ = 5, MAJ_TIE = 2, SET = 4;
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pick(list, v, def) { v = +v; return list.indexOf(v) >= 0 ? v : def; }
  function cardName(id) { var C = CARDS[id]; return C.k === 'gem' ? COLORS[C.c][0] + ' ' + C.v : 'Maledizione ' + C.v; }
  function coinsTxt(n) { return n === 1 ? '1 moneta' : n + ' monete'; }

  function newGame(seats, opts, now) {
    opts = opts || {}; now = now || Date.now();
    var o = { lots: pick(OPT.lots, opts.lots, 20), time: pick(OPT.time, opts.time, 25) };
    var gems = shuffle(CARDS.filter(function (C) { return C.k === 'gem'; }).map(function (C) { return C.id; }));
    var curses = shuffle(CARDS.filter(function (C) { return C.k === 'curse'; }).map(function (C) { return C.id; }));
    // partita corta: 12 lotti, 10 gemme a caso e 2 maledizioni
    var deck = o.lots === 12 ? gems.slice(0, 10).concat(curses.slice(0, 2)) : gems.concat(curses);
    // la prima carta è sempre una gemma: si comincia scaldando le monete
    deck = shuffle(deck); var fg = deck.findIndex(function (id) { return CARDS[id].k === 'gem'; }); var t0 = deck[0]; deck[0] = deck[fg]; deck[fg] = t0;
    var g = {
      v: 1, phase: 'bid', seq: 0, turnN: 0, lot: 0, total: deck.length, clock: now, opts: o,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, coins: COINS, gems: [], curses: [], bid: null, won: 0 } }),
      deck: deck, pot: [], cur: null, until: 0, res: null, hist: [],
      log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    log(g, 'Si mettono all’asta ' + deck.length + ' lotti. Ognuno ha ' + COINS + ' monete.', 'sys');
    startLot(g, now);
    return g;
  }
  function startLot(g, now) {
    var id = g.deck.shift(), C = CARDS[id];
    g.lot++; g.phase = 'bid'; g.res = null; g.clock = now; g.turnN++;
    g.until = now + g.opts.time * 1000;
    g.players.forEach(function (P) { P.bid = null; });
    if (C.k === 'gem') { g.pot.push(id); g.cur = { kind: 'gem', cards: g.pot.slice() }; }
    else g.cur = { kind: 'curse', cards: [id] };
    log(g, 'Lotto ' + g.lot + ' di ' + g.total + ': ' + g.cur.cards.map(cardName).join(', ') + (g.cur.kind === 'gem' && g.cur.cards.length > 1 ? ' (si è accumulato!)' : '') + '.', 'lot');
    fx(g, { k: 'lot', lot: g.lot, kind: g.cur.kind, n: g.cur.cards.length });
  }
  function bids(g) { return g.players.map(function (P) { return P.bid == null ? 0 : P.bid; }); }
  function resolve(g, now) {
    var B = bids(g), n = g.players.length, res = { lot: g.lot, kind: g.cur.kind, cards: g.cur.cards.slice(), bids: B.slice(), who: null, carried: false, paid: 0, got: 0 };
    if (g.cur.kind === 'gem') {
      var top = Math.max.apply(null, B), at = B.map(function (b, i) { return b === top ? i : -1; }).filter(function (i) { return i >= 0; });
      if (at.length === 1) {
        var w = at[0], P = g.players[w];
        P.coins -= top; P.gems = P.gems.concat(g.pot); P.won++; res.who = w; res.paid = top; g.pot = [];
        log(g, nick(g, w) + ' vince con ' + coinsTxt(top) + ' e prende ' + res.cards.map(cardName).join(', ') + '.', 'win', w);
        fx(g, { k: 'win', p: w, paid: top });
      } else {
        res.carried = true;
        log(g, 'Pari in testa (' + at.map(function (i) { return nick(g, i); }).join(', ') + ' a ' + top + '): nessuno vince, ' + (g.pot.length > 1 ? 'le gemme restano' : 'la gemma resta') + ' sul banco.', 'tie');
        fx(g, { k: 'tie', top: top });
      }
    } else {
      var low = Math.min.apply(null, B), lows = B.map(function (b, i) { return b === low ? i : -1; }).filter(function (i) { return i >= 0; });
      // a parità la prende chi ha più monete; se ancora pari, chi viene prima a partire da chi ha aperto il lotto
      var start = (g.lot - 1) % n;
      lows.sort(function (a, b) { return g.players[b].coins - g.players[a].coins || ((a - start + n) % n) - ((b - start + n) % n); });
      var tk = lows[0], T = g.players[tk], got = 0;
      g.players.forEach(function (Q, i) { if (i !== tk && B[i]) { Q.coins -= B[i]; got += B[i]; } });
      T.coins += got; T.curses.push(res.cards[0]); res.who = tk; res.got = got;
      log(g, nick(g, tk) + ' offre meno di tutti (' + low + '), si prende la ' + cardName(res.cards[0]) + (got ? ' e incassa ' + coinsTxt(got) + ' dagli altri.' : '.'), 'curse', tk);
      fx(g, { k: 'curse', p: tk, got: got });
    }
    g.res = res; g.hist.push(res);
    g.phase = 'show'; g.until = now + SHOW_MS; g.clock = now; g.turnN++;
  }
  // punteggio (anche provvisorio, durante la partita)
  function colorTot(P) { var t = [0, 0, 0, 0]; P.gems.forEach(function (id) { var C = CARDS[id]; t[C.c] += C.v; }); return t; }
  function colorCount(P) { var t = [0, 0, 0, 0]; P.gems.forEach(function (id) { t[CARDS[id].c]++; }); return t; }
  function majority(g, p, c) {
    var mine = colorTot(g.players[p])[c]; if (!mine) return 0;
    var best = 0, tie = false;
    g.players.forEach(function (Q, i) { if (i === p) return; var t = colorTot(Q)[c]; if (t > best) best = t; });
    if (mine > best) return MAJ;
    return mine === best ? MAJ_TIE : 0;
  }
  function score(g, p) {
    var P = g.players[p], tot = colorTot(P), cnt = colorCount(P);
    var gems = tot.reduce(function (a, b) { return a + b; }, 0);
    var maj = [0, 1, 2, 3].reduce(function (a, c) { return a + majority(g, p, c); }, 0);
    var sets = Math.min.apply(null, cnt) * SET;
    var curses = P.curses.reduce(function (a, id) { return a + CARDS[id].v; }, 0);
    var cp = Math.floor(P.coins / 2);
    return { gems: gems, maj: maj, sets: sets, curses: curses, coins: cp, total: gems + maj + sets + curses + cp };
  }
  function finish(g, now) {
    g.phase = 'over'; g.until = 0; g.clock = now;
    var S = g.players.map(function (P, i) { return score(g, i); });
    var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return S[b].total - S[a].total || S[b].coins - S[a].coins || a - b; });
    var place = g.players.map(function (P, i) { return 1 + g.players.filter(function (Q, j) { return S[j].total > S[i].total || (S[j].total === S[i].total && S[j].coins > S[i].coins); }).length; });
    g.winners = order.filter(function (i) { return place[i] === 1; });
    g.final = { order: order, place: place, score: S };
    log(g, 'Asta chiusa! ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (i) { return nick(g, i); }).join(' e ') : 'Vince ' + nick(g, g.winners[0])) + ' con ' + S[g.winners[0]].total + ' punti.', 'end', g.winners[0]);
    fx(g, { k: 'over', w: g.winners[0] });
  }
  function next(g, now) {
    if (!g.deck.length) {
      if (g.pot.length) log(g, (g.pot.length > 1 ? 'Le gemme rimaste' : 'La gemma rimasta') + ' sul banco non va a nessuno.', 'sys');
      g.pot = []; finish(g, now); return;
    }
    startLot(g, now);
  }
  // l'host la chiama ogni mezzo secondo: fa scadere il tempo delle offerte e quello dei risultati
  function tick(g, now) {
    if (g.phase === 'bid' && now >= g.until) {
      g.players.forEach(function (P, i) { if (P.bid == null) { P.bid = 0; log(g, nick(g, i) + ' non ha offerto in tempo: offre 0.', 'sys', i); } });
      resolve(g, now); g.seq++; return true;
    }
    if (g.phase === 'show' && now >= g.until) { next(g, now); g.seq++; return true; }
    return false;
  }
  function pending(g) { return g.phase === 'bid' ? g.players.map(function (P, i) { return i; }).filter(function (i) { return g.players[i].bid == null; }) : []; }
  function decider() { return null; }   // si offre tutti insieme, con il tempo del lotto
  function act(g, p, a, now) {
    now = now || Date.now();
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'L’asta è chiusa.';
    var P = g.players[p]; if (!P) return 'Non sei al tavolo.';
    if (g.phase !== 'bid') return 'Aspetta il prossimo lotto.';
    if (a.a !== 'bid') return 'Fai la tua offerta.';
    var b = Math.floor(+a.b);
    if (!(b >= 0)) return 'Offerta non valida.';
    if (b > P.coins) return 'Hai solo ' + coinsTxt(P.coins) + '.';
    var first = P.bid == null; P.bid = b;
    if (first) fx(g, { k: 'bid', p: p });
    if (!pending(g).length) resolve(g, now);
    g.seq++; g.clock = now;
    return null;
  }
  function forceNext(g, now) {
    now = now || Date.now();
    if (g.phase === 'show') { next(g, now); g.seq++; return true; }
    return false;
  }
  return { newGame: newGame, act: act, tick: tick, decider: decider, pending: pending, forceNext: forceNext, score: score, colorTot: colorTot, colorCount: colorCount, majority: majority,
    cardName: cardName, coinsTxt: coinsTxt, setRandom: setRandom, shuffle: shuffle, CARDS: CARDS, COLORS: COLORS, OPT: OPT, COINS: COINS, SHOW_MS: SHOW_MS, MAJ: MAJ, MAJ_TIE: MAJ_TIE, SET: SET };
})();
if (typeof module !== 'undefined') module.exports = ALEngine;
