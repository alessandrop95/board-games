/* ===== Burraco: motore delle regole (gira sull'host; lo stato è JSON) =====
   Due mazzi francesi con 4 jolly (108 carte), in 2 o in 4 (due coppie, i compagni di fronte).
   11 carte a testa, due «pozzetti» da 11 carte (uno per squadra), una carta scoperta sugli scarti.
   Nel turno: si pesca una carta dal mazzo OPPURE si prendono tutti gli scarti; poi si possono calare
   combinazioni (almeno 3 carte) e attaccare carte a quelle della propria squadra; infine si scarta una carta.
   Combinazioni: «scala» (stesso seme, valori consecutivi; l'asso sta sotto il 2 o sopra il re) o «tris»
   (stesso valore, semi qualsiasi). Jolly e 2 («pinelle») fanno da matta, al massimo una per combinazione; una
   pinella al suo posto in una scala del suo seme è una carta normale. Una combinazione di 7 o più carte è un
   «burraco»: pulito (senza matta) vale 200, sporco 100.
   Chi resta senza carte per la prima volta nella squadra prende il pozzetto. Si chiude scartando l'ultima
   carta, se la squadra ha preso il pozzetto e ha almeno un burraco (+100).
   Valori: jolly 30, pinella 20, asso 15, dall'8 al re 10, dal 3 al 7 5. A fine mano si sommano le carte calate
   e i burraco, si tolgono le carte rimaste in mano e 100 punti a chi non ha preso il pozzetto.
   Carte: 0-103 due mazzi (valore = c % 13 + 1, seme = Math.floor(c / 13) % 4), 104-107 jolly. */
var BUEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var SN = ['picche', 'cuori', 'quadri', 'fiori'], RN = { 1: 'asso', 11: 'jack', 12: 'donna', 13: 're' };
  function joker(c) { return c >= 104; }
  function rank(c) { return joker(c) ? 0 : c % 13 + 1; }
  function suit(c) { return joker(c) ? -1 : Math.floor(c / 13) % 4; }
  function wildish(c) { return joker(c) || rank(c) === 2; }
  function value(c) { var r = rank(c); return joker(c) ? 30 : r === 2 ? 20 : r === 1 ? 15 : r >= 8 ? 10 : 5; }
  function cname(c) { return joker(c) ? 'jolly' : (RN[rank(c)] || rank(c)) + ' di ' + SN[suit(c)]; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 30) g.fx.splice(0, g.fx.length - 30); }
  function team(g, p) { return g.players.length === 4 ? p % 2 : p; }
  function partner(g, p) { return g.players.length === 4 ? (p + 2) % 4 : -1; }
  function tname(g, t) { return g.players.length === 4 ? g.players[t].nick + ' e ' + g.players[t + 2].nick : g.players[t].nick; }

  /* ---------- le combinazioni ----------
     analyze(carte) → null se non valida, altrimenti { type: 'set'|'run', cards: [in ordine], clean, suit } */
  function analyze(cards) {
    if (!cards || cards.length < 3) return null;
    if (cards.filter(function (c, i) { return cards.indexOf(c) !== i; }).length) return null;
    return asSet(cards) || asRun(cards);
  }
  function asSet(cards) {
    var nat = cards.filter(function (c) { return !wildish(c); }), w = cards.length - nat.length;
    if (nat.length < 2 || w > 1) return null;
    var r = rank(nat[0]); if (!nat.every(function (c) { return rank(c) === r; })) return null;
    var order = nat.slice().sort(function (a, b) { return suit(a) - suit(b) || a - b; }).concat(cards.filter(wildish));
    return { type: 'set', cards: order, clean: w === 0, rank: r };
  }
  function asRun(cards) {
    var base = cards.filter(function (c) { return !wildish(c); });
    if (!base.length) return null;
    var s = suit(base[0]); if (!base.every(function (c) { return suit(c) === s; })) return null;
    // i 2 dello stesso seme possono essere carte normali (al loro posto) o matte
    var twos = cards.filter(function (c) { return !joker(c) && rank(c) === 2 && suit(c) === s; });
    var others = cards.filter(function (c) { return joker(c) || (rank(c) === 2 && suit(c) !== s); });
    var best = null;
    for (var m = 0; m < (1 << twos.length); m++) {
      var nat = base.slice(), wild = others.slice();
      twos.forEach(function (c, i) { if (m & (1 << i)) nat.push(c); else wild.push(c); });
      if (wild.length > 1) continue;
      [false, true].forEach(function (hi) {
        var r = place(nat, wild, hi, cards.length);
        if (r && (!best || (r.clean && !best.clean))) best = r;
      });
    }
    if (best) best.suit = s;
    return best;
  }
  // mette in fila le carte normali (asso alto o basso) e usa la matta per il buco o in coda
  function place(nat, wild, aceHigh, n) {
    var rk = function (c) { var r = rank(c); return r === 1 && aceHigh ? 14 : r; };
    var rs = nat.map(rk); if (rs.filter(function (r, i) { return rs.indexOf(r) !== i; }).length) return null;
    var srt = nat.slice().sort(function (a, b) { return rk(a) - rk(b); }), lo = rk(srt[0]), hi = rk(srt[srt.length - 1]);
    var gaps = hi - lo + 1 - nat.length;
    if (gaps > wild.length) return null;
    var top = aceHigh ? 14 : 13;
    if (n > top) return null;
    var order = [], wi = 0;
    for (var r = lo; r <= hi; r++) { var c = srt.filter(function (x) { return rk(x) === r; })[0]; if (c != null) order.push(c); else order.push(wild[wi++]); }
    if (wi < wild.length) { if (hi < top) order.push(wild[wi++]); else if (lo > 1) { order.unshift(wild[wi++]); lo--; } else return null; }
    return { type: 'run', cards: order, clean: wild.length === 0, low: lo, aceHigh: aceHigh };
  }

  function newGame(seats, opts) {
    opts = opts || {};
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, hand: 0,
      opts: { target: [1005, 1505, 2005].indexOf(+opts.target) >= 0 ? +opts.target : 1505 },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], ready: false }; }),
      deck: [], pile: [], pozzo: [[], []], took: [false, false], melds: [[], []], mid: 0, turn: 0, step: 'draw', fromPile: null, dealer: Math.floor(rand() * seats.length),
      totals: [0, 0], hist: [], res: null, log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null
    };
    deal(g);
    return g;
  }
  function deal(g) {
    var n = g.players.length, d = shuffle(Array.from({ length: 108 }, function (x, i) { return i; }));
    g.hand++; g.phase = 'play'; g.res = null; g.melds = [[], []]; g.took = [false, false]; g.fromPile = null;
    g.players.forEach(function (P) { P.hand = d.splice(-11); P.ready = false; });
    g.pozzo = [d.splice(-11), d.splice(-11)];
    g.pile = [d.pop()]; g.deck = d;
    g.dealer = (g.dealer + 1) % n; g.turn = (g.dealer + 1) % n; g.step = 'draw'; g.turnN++;
    log(g, 'Mano ' + g.hand + ': 11 carte a testa, due pozzetti, ' + cname(g.pile[0]) + ' sugli scarti.', 'sys');
    fx(g, { k: 'deal', hand: g.hand });
  }
  function decider(g) { return g.phase === 'play' ? g.turn : null; }
  function pending(g) {
    if (g.phase === 'play') return [g.turn];
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function hasBurraco(g, t) { return g.melds[t].some(function (m) { return m.cards.length >= 7; }); }
  function takePozzo(g, p, flying) {
    var t = team(g, p); g.took[t] = true;
    g.players[p].hand = g.pozzo[t]; g.pozzo[t] = [];
    log(g, nick(g, p) + ' prende il pozzetto' + (flying ? ' e continua a giocare.' : '.'), 'pozzo', p);
    fx(g, { k: 'pozzo', p: p, flying: !!flying });
  }
  function removeFrom(hand, cards) { cards.forEach(function (c) { hand.splice(hand.indexOf(c), 1); }); }
  function score(g, closer) {
    return [0, 1].map(function (t) {
      var melds = g.melds[t], cards = 0, bur = 0, burN = [0, 0];
      melds.forEach(function (m) { m.cards.forEach(function (c) { cards += value(c); }); if (m.cards.length >= 7) { if (m.clean) { bur += 200; burN[0]++; } else { bur += 100; burN[1]++; } } });
      var minus = 0; g.players.forEach(function (P, i) { if (team(g, i) === t) P.hand.forEach(function (c) { minus += value(c); }); });
      var close = closer === t ? 100 : 0, pozzo = g.took[t] ? 0 : -100;
      return { cards: cards, bur: bur, burN: burN, close: close, minus: minus, pozzo: pozzo, tot: cards + bur + close - minus + pozzo };
    });
  }
  function endHand(g, closer) {
    var S = score(g, closer);
    g.totals[0] += S[0].tot; g.totals[1] += S[1].tot; g.hist.push([S[0].tot, S[1].tot]);
    g.res = { s: S, pts: [S[0].tot, S[1].tot], closer: closer, w: S[0].tot > S[1].tot ? 0 : S[1].tot > S[0].tot ? 1 : -1 };
    log(g, (closer != null ? tname(g, closer) + ' chiudono. ' : 'Il mazzo è finito. ') + 'Mano ' + g.hand + ': ' + S[0].tot + ' a ' + S[1].tot + ' (totale ' + g.totals[0] + ' a ' + g.totals[1] + ').', 'round');
    var T = g.opts.target;
    if ((g.totals[0] >= T || g.totals[1] >= T) && g.totals[0] !== g.totals[1]) {
      var w = g.totals[0] > g.totals[1] ? 0 : 1;
      g.winners = [w]; g.final = { place: w === 0 ? [1, 2] : [2, 1] }; g.phase = 'over';
      log(g, 'Vincono ' + tname(g, w) + ', ' + g.totals[w] + ' a ' + g.totals[1 - w] + '!', 'win');
      fx(g, { k: 'roundEnd', over: true }); fx(g, { k: 'over', t: w });
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
  function own(P, cards) { return Array.isArray(cards) && cards.length && cards.every(function (c, i) { return P.hand.indexOf(c) >= 0 && cards.indexOf(c) === i; }); }
  function doAct(g, p, a) {
    var P = g.players[p], t = team(g, p);
    if (g.phase === 'scores') {
      if (a.a !== 'next') return 'Tocca «Prossima mano».';
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) deal(g);
      return null;
    }
    if (g.phase !== 'play') return 'Mossa non valida.';
    if (g.turn !== p) return 'Non è il tuo turno: tocca a ' + nick(g, g.turn) + '.';
    if (a.a === 'draw' || a.a === 'pile') {
      if (g.step !== 'draw') return 'Hai già pescato.';
      if (a.a === 'draw') {
        if (!g.deck.length) { endHand(g, null); return null; }
        var c = g.deck.pop(); P.hand.push(c); g.fromPile = null;
        fx(g, { k: 'draw', p: p });
      } else {
        if (!g.pile.length) return 'Gli scarti sono vuoti.';
        g.fromPile = g.pile.length === 1 ? g.pile[0] : null;
        log(g, nick(g, p) + ' prende gli scarti (' + g.pile.length + (g.pile.length > 1 ? ' carte).' : ' carta).'), 'pile', p);
        fx(g, { k: 'pile', p: p, n: g.pile.length });
        P.hand = P.hand.concat(g.pile); g.pile = [];
      }
      g.step = 'play'; return null;
    }
    if (g.step !== 'play') return 'Prima pesca dal mazzo o prendi gli scarti.';
    if (a.a === 'meld' || a.a === 'add') {
      if (!own(P, a.cards)) return 'Quelle carte non sono nella tua mano.';
      var m = null, an;
      if (a.a === 'meld') an = analyze(a.cards);
      else { m = g.melds[t].filter(function (x) { return x.id === +a.m; })[0]; if (!m) return 'Combinazione sconosciuta.'; an = analyze(m.cards.concat(a.cards)); if (an && an.type !== m.type) an = null; }
      if (!an) return a.a === 'meld' ? 'Queste carte non fanno una scala o un tris (al massimo una matta).' : 'Queste carte non si attaccano lì.';
      var left = P.hand.length - a.cards.length;
      if (left === 0 && g.took[t]) return 'Devi tenere una carta da scartare.';
      // con una carta sola bisogna poterla scartare per chiudere: serve un burraco (anche questo)
      if (left === 1 && g.took[t] && !hasBurraco(g, t) && an.cards.length < 7) return 'Ti resterebbe una carta sola, ma per chiudere serve un burraco.';
      removeFrom(P.hand, a.cards);
      if (m) { m.cards = an.cards; m.clean = an.clean; } else { m = { id: ++g.mid, type: an.type, cards: an.cards, clean: an.clean }; g.melds[t].push(m); }
      var bur = m.cards.length >= 7 && m.cards.length - a.cards.length < 7;
      log(g, nick(g, p) + (a.a === 'meld' ? ' cala ' : ' attacca ') + a.cards.map(cname).join(', ') + (bur ? ': BURRACO ' + (m.clean ? 'pulito!' : 'sporco!') : '.'), bur ? 'bur' : 'meld', p);
      fx(g, { k: a.a, p: p, m: m.id, t: t, cards: a.cards, bur: bur, clean: m.clean });
      if (!P.hand.length) takePozzo(g, p, true);
      return null;
    }
    if (a.a === 'discard') {
      var d = +a.c; if (P.hand.indexOf(d) < 0) return 'Questa carta non è nella tua mano.';
      if (g.fromPile != null && d === g.fromPile && P.hand.length > 1) return 'Hai appena preso questa carta dagli scarti: scartane un’altra.';
      if (P.hand.length === 1 && g.took[t] && !hasBurraco(g, t)) return 'Per chiudere la squadra deve avere almeno un burraco.';
      P.hand.splice(P.hand.indexOf(d), 1); g.pile.push(d);
      fx(g, { k: 'discard', p: p, c: d });
      if (!P.hand.length) {
        if (!g.took[t]) takePozzo(g, p, false);
        else { log(g, nick(g, p) + ' chiude la mano!', 'close', p); fx(g, { k: 'close', p: p, t: t }); endHand(g, t); return null; }
      }
      g.turn = (p + 1) % g.players.length; g.step = 'draw'; g.fromPile = null; g.turnN++;
      if (!g.deck.length) endHand(g, null);
      return null;
    }
    return 'Mossa sconosciuta.';
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; deal(g); g.seq++; return true; }
  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, analyze: analyze, score: score, hasBurraco: hasBurraco, team: team, partner: partner, tname: tname,
    joker: joker, rank: rank, suit: suit, wildish: wildish, value: value, cname: cname, setRandom: setRandom, shuffle: shuffle, SN: SN };
})();
if (typeof module !== 'undefined') module.exports = BUEngine;
