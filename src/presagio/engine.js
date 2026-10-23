/* ===== Presagio: regole (equivalenti al gioco di prese a previsione con Maghi e Giullari) ===== */
var PRData = (function () {
  // 4 casate × 13 valori + 4 Arcimaghi + 4 Giullari = 60 carte
  var SUITS = [
    { id: 0, n: 'Fiamme', one: 'Fiamma', col: '#c4452f' },
    { id: 1, n: 'Maree', one: 'Marea', col: '#2f6fa8' },
    { id: 2, n: 'Foreste', one: 'Foresta', col: '#3d8a4f' },
    { id: 3, n: 'Sabbie', one: 'Sabbia', col: '#c99a2e' }
  ];
  var CARDS = [];
  for (var s = 0; s < 4; s++) for (var v = 1; v <= 13; v++) CARDS.push({ id: CARDS.length, k: 'n', s: s, v: v });
  for (var w = 0; w < 4; w++) CARDS.push({ id: CARDS.length, k: 'w' });
  for (var j = 0; j < 4; j++) CARDS.push({ id: CARDS.length, k: 'j' });
  return { SUITS: SUITS, CARDS: CARDS };
})();

var PREngine = (function () {
  var C = PRData.CARDS;
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nm(s, p) { return s.players[p].nick; }
  function log(s, t, k) { s.log.push({ n: ++s.logN, t: t, k: k || '' }); if (s.log.length > 60) s.log.splice(0, s.log.length - 60); }
  function cardName(id) { var c = C[id]; return c.k === 'w' ? 'Arcimago' : c.k === 'j' ? 'Giullare' : c.v + ' di ' + PRData.SUITS[c.s].n; }
  function n(s) { return s.players.length; }
  function next(s, p) { return (p + 1) % n(s); }

  function newGame(seats, opts) {
    var k = seats.length;
    if (k < 3 || k > 6) throw new Error('Servono da 3 a 6 giocatori.');
    var s = {
      v: 1, phase: 'bid', winner: null, seq: 0, logN: 0, log: [], flash: null,
      opts: { noEven: !!(opts && opts.noEven) },
      players: seats.map(function (st) { return { uid: st.uid, nick: st.nick, bot: !!st.bot, score: 0, hand: [], bid: null, tricks: 0, hist: [] }; }),
      rounds: 60 / k, round: 0, dealer: Math.floor(Math.random() * k),
      trump: null, trumpCard: null, turn: 0, leader: 0, trick: [], lastTrick: null, deckLeft: 0
    };
    log(s, 'Si apre la partita a ' + k + ' giocatori: ' + s.rounds + ' mani.' + (s.opts.noEven ? ' Regola attiva: la somma delle previsioni non può essere uguale alle prese.' : ''), 'turn');
    startRound(s);
    return s;
  }

  function startRound(s) {
    s.round++;
    if (s.round > 1) s.dealer = next(s, s.dealer);
    var deck = shuffle(C.map(function (c) { return c.id; }));
    s.players.forEach(function (P) { P.hand = []; P.bid = null; P.tricks = 0; });
    var p = next(s, s.dealer);
    for (var i = 0; i < s.round; i++) for (var q = 0; q < n(s); q++) { s.players[p].hand.push(deck.pop()); p = next(s, p); }
    s.players.forEach(function (P) { P.hand.sort(handOrder); });
    s.deckLeft = deck.length;
    s.trick = []; s.lastTrick = null; s.trump = null; s.trumpCard = null;
    log(s, 'Mano ' + s.round + ' di ' + s.rounds + ': ' + s.round + (s.round > 1 ? ' carte' : ' carta') + ' a testa. Distribuisce ' + nm(s, s.dealer) + '.', 'turn');
    if (deck.length) {
      var t = deck.pop(); s.trumpCard = t; s.deckLeft = deck.length;
      var c = C[t];
      if (c.k === 'n') { s.trump = c.s; log(s, 'Si scopre ' + cardName(t) + ': briscola ' + PRData.SUITS[c.s].n + '.', 'sys'); }
      else if (c.k === 'j') { log(s, 'Si scopre un Giullare: niente briscola in questa mano.', 'sys'); }
      else { s.phase = 'trump'; s.turn = s.dealer; log(s, 'Si scopre un Arcimago: ' + nm(s, s.dealer) + ' sceglie la briscola.', 'sys'); return; }
    } else log(s, 'Ultima mano: tutte le carte sono distribuite, niente briscola.', 'sys');
    s.phase = 'bid'; s.turn = next(s, s.dealer);
  }
  function handOrder(a, b) {
    var A = C[a], B = C[b];
    function key(c) { return c.k === 'w' ? 100 : c.k === 'j' ? -1 : c.s * 14 + c.v; }
    return key(A) - key(B);
  }

  function bidSum(s) { return s.players.reduce(function (t, P) { return t + (P.bid || 0); }, 0); }
  // Valore proibito per chi dichiara per ultimo (il mazziere) con la regola "somma diversa"
  function forbiddenBid(s, p) {
    if (!s.opts.noEven || s.phase !== 'bid' || p !== s.dealer) return null;
    var f = s.round - bidSum(s);
    return f >= 0 && f <= s.round ? f : null;
  }

  // Colore da seguire nella presa corrente: null = libero
  function leadSuit(s) {
    for (var i = 0; i < s.trick.length; i++) {
      var c = C[s.trick[i].c];
      if (c.k === 'w') return null;
      if (c.k === 'n') return c.s;
    }
    return null;
  }
  function playable(s, p) {
    var H = s.players[p].hand, ls = leadSuit(s);
    if (ls == null) return H.slice();
    var has = H.some(function (id) { var c = C[id]; return c.k === 'n' && c.s === ls; });
    if (!has) return H.slice();
    return H.filter(function (id) { var c = C[id]; return c.k !== 'n' || c.s === ls; });
  }
  // Chi vince una presa (indice nella lista)
  function trickWinner(trick, trump) {
    var i, best = -1;
    for (i = 0; i < trick.length; i++) if (C[trick[i].c].k === 'w') return i;
    var ls = null;
    for (i = 0; i < trick.length; i++) if (C[trick[i].c].k === 'n') { ls = C[trick[i].c].s; break; }
    if (ls == null) return 0; // solo Giullari: vince il primo
    var bestKey = -1;
    for (i = 0; i < trick.length; i++) {
      var c = C[trick[i].c]; if (c.k !== 'n') continue;
      var rank = trump != null && c.s === trump ? 2 : c.s === ls ? 1 : 0;
      var key = rank === 0 ? -1 : rank * 100 + c.v;
      if (key > bestKey) { bestKey = key; best = i; }
    }
    return best;
  }

  function scoreRound(s) {
    s.players.forEach(function (P) {
      var d = P.bid === P.tricks ? 20 + 10 * P.tricks : -10 * Math.abs(P.bid - P.tricks);
      P.score += d; P.hist.push({ bid: P.bid, tricks: P.tricks, delta: d, score: P.score });
    });
    var ok = s.players.filter(function (P) { return P.bid === P.tricks; }).map(function (P) { return P.nick; });
    log(s, 'Fine della mano ' + s.round + '. ' + (ok.length ? 'Hanno indovinato: ' + ok.join(', ') + '.' : 'Nessuno ha indovinato.'), 'win');
    if (s.round >= s.rounds) {
      s.phase = 'over';
      var top = Math.max.apply(null, s.players.map(function (P) { return P.score; }));
      s.winner = s.players.map(function (P, i) { return P.score === top ? i : -1; }).filter(function (i) { return i >= 0; });
      log(s, 'Partita finita. ' + (s.winner.length > 1 ? 'Pari merito tra ' : 'Vince ') + s.winner.map(function (i) { return nm(s, i); }).join(' e ') + ' con ' + top + ' punti.', 'win');
    } else { s.phase = 'roundEnd'; s.turn = next(s, s.dealer); }
  }

  function decider(s) { return s.phase === 'over' ? null : s.turn; }

  function act(s, p, a) {
    if (s.phase === 'over') return 'La partita è finita.';
    if (p !== s.turn) return 'Non tocca a te.';
    var P = s.players[p];
    if (s.phase === 'trump') {
      if (a.a !== 'trump' || !(a.s >= 0 && a.s <= 3)) return 'Scegli il colore di briscola.';
      s.trump = a.s; log(s, nm(s, p) + ' sceglie come briscola ' + PRData.SUITS[a.s].n + '.', 'sys');
      s.phase = 'bid'; s.turn = next(s, s.dealer);
    } else if (s.phase === 'bid') {
      var b = a.b;
      if (a.a !== 'bid' || typeof b !== 'number' || b !== Math.floor(b) || b < 0 || b > s.round) return 'Previsione non valida.';
      if (forbiddenBid(s, p) === b) return 'Con la regola della somma diversa non puoi dichiarare ' + b + '.';
      P.bid = b; log(s, nm(s, p) + ' prevede ' + b + (b === 1 ? ' presa.' : ' prese.'), 'bid');
      s.flash = { kind: 'bid', p: p, n: s.logN };
      if (p === s.dealer) {
        var sum = bidSum(s);
        log(s, 'Previsioni: ' + sum + ' su ' + s.round + (sum > s.round ? ' (più delle prese: qualcuno resterà deluso)' : sum < s.round ? ' (meno delle prese: qualcuno ne farà di troppo)' : '') + '.', 'sys');
        s.phase = 'play'; s.leader = next(s, s.dealer); s.turn = s.leader;
      } else s.turn = next(s, p);
    } else if (s.phase === 'play') {
      if (a.a !== 'play') return 'Gioca una carta.';
      if (P.hand.indexOf(a.c) < 0) return 'Non hai questa carta.';
      if (playable(s, p).indexOf(a.c) < 0) return 'Devi rispondere a ' + PRData.SUITS[leadSuit(s)].n + ' (o giocare un Arcimago o un Giullare).';
      P.hand.splice(P.hand.indexOf(a.c), 1);
      s.trick.push({ p: p, c: a.c });
      if (s.trick.length < n(s)) { s.turn = next(s, p); }
      else {
        var wi = trickWinner(s.trick, s.trump), w = s.trick[wi].p;
        s.players[w].tricks++;
        s.lastTrick = { cards: s.trick, winner: w, wi: wi, n: s.logN + 1 };
        log(s, nm(s, w) + ' vince la presa con ' + cardName(s.trick[wi].c) + '.', 'trick');
        s.flash = { kind: 'trick', p: w, n: s.logN };
        s.trick = [];
        s.leader = w; s.turn = w;
        if (!P.hand.length) scoreRound(s);
      }
    } else if (s.phase === 'roundEnd') {
      if (a.a !== 'next') return 'Avvia la mano successiva.';
      startRound(s);
    }
    s.seq++;
    return null;
  }

  return { newGame: newGame, act: act, decider: decider, playable: playable, leadSuit: leadSuit, trickWinner: trickWinner, forbiddenBid: forbiddenBid, bidSum: bidSum, cardName: cardName, handOrder: handOrder };
})();
if (typeof module !== 'undefined') module.exports = { PRData: PRData, PREngine: PREngine };
