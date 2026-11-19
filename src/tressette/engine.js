/* ===== Tressette: motore delle regole (gira sull'host; lo stato è JSON) =====
   Mazzo da 40 carte italiane, dieci carte a testa, obbligo di rispondere al seme, niente briscola: prende
   la carta più alta del seme di chi ha cominciato. Ordine: 3, 2, asso, re, cavallo, fante, 7, 6, 5, 4.
   Valori in terzi di punto: asso 3 (un punto intero), 3, 2, re, cavallo e fante 1 (un terzo), le altre 0;
   l'ultima presa vale un punto in più (3 terzi). Alla fine della mano i terzi avanzati non contano: 11 punti in tutto.
   Due varianti:
   - «a vincere»: in 2 (uno contro uno, con il tallone da cui si pesca a carte scoperte) o in 4 (due coppie,
     i compagni di fronte). Si possono accusare napoletana e buon gioco e, in 4, fare i segnali ammessi
     (busso, striscio, volo) quando si apre una mano. Vince la coppia che arriva prima ai punti stabiliti.
   - «a perdere» (detto anche ciapanò): da 3 a 6, ognuno per sé. Bisogna prendere meno punti possibile;
     chi prende tutti gli 11 punti di una mano fa «cappotto» e li regala agli altri. Quando qualcuno arriva
     ai punti stabiliti la partita finisce e vince chi ne ha meno. In 3 si toglie il 4 di bastoni, in 6 tutti i 4.
   Una carta è un numero da 0 a 39 (vedi src/carte/art.js): seme = c / 10, valore = c % 10 + 1. */
var TSEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var POW = [0, 8, 9, 10, 1, 2, 3, 4, 5, 6, 7];   // per valore (indice = valore): 3 > 2 > asso > re > cavallo > fante > 7 > … > 4
  var TH = [0, 3, 1, 1, 0, 0, 0, 0, 1, 1, 1];     // terzi di punto per valore
  var TARGETS = [11, 21, 31, 41], TOTAL_TH = 35;
  var SIGNALS = { busso: 'Busso', striscio: 'Striscio', volo: 'Volo' };
  var SIGNAL_TXT = { busso: 'se prendi, torna a questo seme', striscio: 'ne ho ancora altre di questo seme', volo: 'era l’ultima che avevo di questo seme' };
  var SN = ['coppe', 'denari', 'spade', 'bastoni'], RN = { 1: 'l’asso', 2: 'il due', 3: 'il tre', 8: 'il fante', 9: 'il cavallo', 10: 'il re' };
  function suit(c) { return Math.floor(c / 10); }
  function rank(c) { return c % 10 + 1; }
  function thirds(c) { return TH[rank(c)]; }
  function power(c) { return POW[rank(c)]; }
  function sumTh(cs) { return cs.reduce(function (s, c) { return s + thirds(c); }, 0); }
  // 7 terzi → «2 e 1/3»
  function fmtTh(th) { var w = Math.floor(th / 3), r = th % 3; return r ? (w ? w + ' e ' : '') + r + '/3' : String(w); }
  function cname(c) { var r = rank(c); return (RN[r] || 'il ' + r) + ' di ' + SN[suit(c)]; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function pairs(g) { return g.opts.mode === 'vincere' && g.players.length === 4; }
  function sides(g) { return g.opts.mode === 'vincere' ? 2 : g.players.length; }
  function team(g, p) { return pairs(g) ? p % 2 : p; }
  function partner(g, p) { return pairs(g) ? (p + 2) % 4 : -1; }
  function tname(g, t) { return pairs(g) ? g.players[t].nick + ' e ' + g.players[t + 2].nick : g.players[t].nick; }
  function zeros(n) { var a = []; for (var i = 0; i < n; i++) a.push(0); return a; }
  // a perdere: in 3 si toglie il 4 di bastoni (13 carte a testa), in 6 tutti i 4 (6 carte a testa)
  function removedFor(mode, n) { return mode !== 'perdere' ? [] : n === 3 ? [33] : n === 6 ? [3, 13, 23, 33] : []; }
  function okPlayers(mode, n) { return mode === 'perdere' ? n >= 3 && n <= 6 : n === 2 || n === 4; }

  // chi prende: la carta più alta del seme d'uscita
  function winner(trick) {
    var best = trick[0];
    trick.forEach(function (x) { if (suit(x.c) === suit(best.c) && power(x.c) > power(best.c)) best = x; });
    return best.p;
  }
  // le carte che si possono giocare: se si ha il seme d'uscita bisogna rispondere
  function legal(g, p) {
    var h = g.players[p].hand; if (!g.trick.length) return h.slice();
    var s = suit(g.trick[0].c), f = h.filter(function (c) { return suit(c) === s; });
    return f.length ? f : h.slice();
  }
  // accusi: napoletana (asso, 2 e 3 dello stesso seme) 3 punti; tre o quattro 3, 2 o assi 3 o 4 punti
  function accuseOf(hand) {
    var out = [];
    for (var s = 0; s < 4; s++) if (hand.indexOf(s * 10) >= 0 && hand.indexOf(s * 10 + 1) >= 0 && hand.indexOf(s * 10 + 2) >= 0) out.push({ k: 'nap', s: s, pts: 3 });
    [3, 2, 1].forEach(function (r) {
      var n = [0, 1, 2, 3].filter(function (s) { return hand.indexOf(s * 10 + r - 1) >= 0; }).length;
      if (n >= 3) out.push({ k: 'buon', r: r, n: n, pts: n });
    });
    return out;
  }
  function accText(a) { return a.k === 'nap' ? 'napoletana di ' + SN[a.s] : (a.n === 4 ? 'quattro ' : 'tre ') + (a.r === 1 ? 'assi' : a.r === 2 ? 'due' : 'tre'); }

  function newGame(seats, opts) {
    opts = opts || {};
    var mode = opts.mode === 'perdere' ? 'perdere' : 'vincere';
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, hand: 0,
      opts: { mode: mode, target: TARGETS.indexOf(+opts.target) >= 0 ? +opts.target : 31, accuse: mode === 'vincere' && opts.accuse !== false, signals: mode === 'vincere' && seats.length === 4 && opts.signals !== false, cappotto: mode === 'perdere' && opts.cappotto !== false },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], ready: false }; }),
      deck: [], removed: [], trick: [], lead: 0, turn: 0, taken: [], last: null, totals: [], hist: [], res: null,
      acc: {}, accDone: {}, accPts: [], drawn: [], log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, first: Math.floor(rand() * seats.length)
    };
    g.totals = zeros(sides(g));
    deal(g);
    return g;
  }
  function deal(g) {
    var n = g.players.length, S = sides(g);
    g.hand++; g.phase = 'play'; g.res = null; g.trick = []; g.last = null; g.drawn = [];
    g.removed = removedFor(g.opts.mode, n);
    var cards = shuffle(Array.from({ length: 40 }, function (x, i) { return i; }).filter(function (c) { return g.removed.indexOf(c) < 0; }));
    var per = n === 2 ? 10 : cards.length / n;
    g.players.forEach(function (P) { P.hand = cards.splice(0, per); P.ready = false; });
    g.deck = cards;                                   // in 2: il tallone (20 carte); altrimenti vuoto
    g.taken = []; for (var t = 0; t < S; t++) g.taken.push([]);
    g.accPts = zeros(S); g.acc = {}; g.accDone = {};
    if (g.opts.accuse) g.players.forEach(function (P, i) { var a = accuseOf(P.hand); if (a.length) g.acc[i] = a; });
    g.lead = g.turn = (g.first + g.hand - 1) % n;
    g.turnN++;
    log(g, 'Mano ' + g.hand + ': ' + per + ' carte a testa' + (g.removed.length ? ' (senza ' + (g.removed.length > 1 ? 'i 4' : 'il 4 di bastoni') + ')' : '') + (g.deck.length ? ', ' + g.deck.length + ' nel tallone' : '') + '. Comincia ' + nick(g, g.turn) + '.', 'sys');
    fx(g, { k: 'deal', hand: g.hand });
  }
  function decider(g) { return g.phase === 'play' ? g.turn : null; }
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  // gli accusi si dichiarano giocando la prima carta della mano
  function declare(g, p) {
    if (g.accDone[p]) return; g.accDone[p] = true;
    var a = g.acc[p]; if (!a || !a.length) return;
    var pts = a.reduce(function (s, x) { return s + x.pts; }, 0);
    g.accPts[team(g, p)] += pts;
    log(g, nick(g, p) + ' accusa ' + a.map(accText).join(' e ') + ': ' + pts + (pts === 1 ? ' punto.' : ' punti.'), 'acc', p);
    fx(g, { k: 'accuse', p: p, a: a, pts: pts });
  }
  function play(g, p, c, sig) {
    var P = g.players[p], n = g.players.length;
    var s = !g.trick.length && g.opts.signals && SIGNALS[sig] ? sig : null;
    declare(g, p);
    P.hand.splice(P.hand.indexOf(c), 1);
    g.trick.push(s ? { p: p, c: c, s: s } : { p: p, c: c });
    fx(g, { k: 'play', p: p, c: c, s: s });
    if (s) log(g, nick(g, p) + ' apre con ' + cname(c) + ' e dice «' + SIGNALS[s] + '» (' + SIGNAL_TXT[s] + ').', 'sig', p);
    if (g.trick.length < n) { g.turn = (p + 1) % n; g.turnN++; return; }
    var w = winner(g.trick), t = team(g, w), cards = g.trick.map(function (x) { return x.c; }), th = sumTh(cards);
    g.taken[t] = g.taken[t].concat(cards);
    g.last = { trick: g.trick, w: w, th: th };
    log(g, nick(g, w) + ' prende (' + g.trick.map(function (x) { return cname(x.c); }).join(', ') + ')' + (th ? ': ' + fmtTh(th) + (th < 3 ? '' : th < 6 ? ' punto' : ' punti') + '.' : '.'), 'take', w);
    fx(g, { k: 'take', p: w, th: th, cards: cards });
    g.trick = [];
    // in 2 si pesca dal tallone a carte scoperte: prima chi ha preso
    if (g.deck.length) {
      g.drawn = [];
      for (var k = 0; k < n; k++) { var q = (w + k) % n; if (g.deck.length) { var d = g.deck.shift(); g.players[q].hand.push(d); g.drawn.push({ p: q, c: d }); } }
      log(g, g.drawn.map(function (x) { return nick(g, x.p) + ' pesca ' + cname(x.c); }).join(', ') + '.', 'draw');
      fx(g, { k: 'draw', d: g.drawn });
    }
    g.lead = g.turn = w; g.turnN++;
    if (g.players.every(function (Q) { return !Q.hand.length; })) endHand(g, w);
  }
  function endHand(g, lastW) {
    var S = sides(g), th = zeros(S), pts = zeros(S), cap = -1;
    for (var t = 0; t < S; t++) th[t] = sumTh(g.taken[t]);
    th[team(g, lastW)] += 3;                           // l'ultima presa
    for (t = 0; t < S; t++) pts[t] = Math.floor(th[t] / 3) + (g.accPts[t] || 0);
    if (g.opts.mode === 'perdere' && g.opts.cappotto) for (t = 0; t < S; t++) if (th[t] === TOTAL_TH) cap = t;
    if (cap >= 0) for (t = 0; t < S; t++) pts[t] = t === cap ? 0 : 11;
    for (t = 0; t < S; t++) g.totals[t] += pts[t];
    g.hist.push(pts.slice());
    g.res = { th: th, pts: pts, acc: g.accPts.slice(), lastW: lastW, cap: cap, cards: g.taken.map(function (x) { return x.length; }) };
    log(g, 'Fine della mano ' + g.hand + ': ' + (cap >= 0 ? tname(g, cap) + ' fa cappotto e regala 11 punti a tutti gli altri. ' : '') + pts.map(function (x, i) { return tname(g, i) + ' ' + x; }).join(', ') + '. Totale: ' + g.totals.map(function (x, i) { return tname(g, i) + ' ' + x; }).join(', ') + '.', 'round');
    var over = false, W = [];
    if (g.opts.mode === 'vincere') {
      var mx = Math.max.apply(null, g.totals);
      W = g.totals.map(function (x, i) { return x === mx ? i : -1; }).filter(function (i) { return i >= 0; });
      over = mx >= g.opts.target && W.length === 1;      // a pari sopra la soglia si gioca un'altra mano
    } else if (g.totals.some(function (x) { return x >= g.opts.target; })) {
      var mn = Math.min.apply(null, g.totals);
      W = g.totals.map(function (x, i) { return x === mn ? i : -1; }).filter(function (i) { return i >= 0; });
      over = true;
    }
    if (over) {
      g.winners = W;
      var lower = g.opts.mode === 'perdere';
      g.final = { place: g.totals.map(function (x) { return 1 + g.totals.filter(function (y) { return lower ? y < x : y > x; }).length; }) };
      g.phase = 'over';
      log(g, (W.length > 1 ? 'Vincono a pari merito ' + W.map(function (i) { return tname(g, i); }).join(', ') : (pairs(g) ? 'Vincono ' : 'Vince ') + tname(g, W[0])) + '!', 'win');
      fx(g, { k: 'roundEnd', over: true }); fx(g, { k: 'over', t: W[0] });
    } else {
      g.phase = 'scores'; g.players.forEach(function (P) { P.ready = !!P.bot; });
      fx(g, { k: 'roundEnd', over: false });
    }
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
      if (a.a !== 'next') return 'Tocca «Prossima mano».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) deal(g);
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (a.a !== 'play') return 'Mossa sconosciuta.';
    if (g.turn !== p) return 'Non è il tuo turno: tocca a ' + nick(g, g.turn) + '.';
    var c = +a.c; if (P.hand.indexOf(c) < 0) return 'Questa carta non è nella tua mano.';
    if (legal(g, p).indexOf(c) < 0) return 'Devi rispondere a ' + SN[suit(g.trick[0].c)] + ': ne hai in mano.';
    if (a.s != null && (g.trick.length || !g.opts.signals || !SIGNALS[a.s])) return g.trick.length ? 'I segnali si fanno solo aprendo la mano.' : 'In questa partita non si fanno segnali.';
    play(g, p, c, a.s);
    return null;
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; deal(g); g.seq++; return true; }
  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, winner: winner, legal: legal, team: team, partner: partner, tname: tname, sides: sides, pairs: pairs,
    thirds: thirds, sumTh: sumTh, fmtTh: fmtTh, power: power, suit: suit, rank: rank, cname: cname, accuseOf: accuseOf, accText: accText, okPlayers: okPlayers, removedFor: removedFor,
    setRandom: setRandom, shuffle: shuffle, SIGNALS: SIGNALS, SIGNAL_TXT: SIGNAL_TXT, SN: SN, TARGETS: TARGETS, TOTAL_TH: TOTAL_TH };
})();
if (typeof module !== 'undefined') module.exports = TSEngine;
