/* ===== Sushi Go!: motore delle regole (gira sull'host; lo stato è JSON) =====
   108 carte: 14 Tempura, 14 Sashimi, 14 Gyoza, 26 Maki (12 da 2, 8 da 3, 6 da 1), 20 Nigiri (10 salmone,
   5 calamaro, 5 uovo), 10 Budini, 6 Wasabi, 4 Bacchette. Si gioca in 3 manche; a ogni manche si danno
   10 carte a testa con 2 giocatori, 9 con 3, 8 con 4, 7 con 5.
   A ogni turno tutti scelgono di nascosto una carta della propria mano, la scoprono insieme e passano
   il resto della mano al vicino. Con le Bacchette già sul tavolo si possono prendere 2 carte in un turno
   (le Bacchette tornano nella mano che si passa). Un Nigiri giocato dopo un Wasabi vale il triplo.
   Punti a fine manche: Maki (più rotolini 6, secondi 3, a pari merito si divide), Tempura (ogni coppia 5),
   Sashimi (ogni tris 10), Gyoza (1, 3, 6, 10, 15 per 1-5+), Nigiri (uovo 1, salmone 2, calamaro 3).
   I Budini si tengono fino alla fine: chi ne ha di più prende 6, chi ne ha meno perde 6 (non con 2 giocatori).
   Vince chi ha più punti; a pari merito chi ha più budini. */
var SGEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var COUNTS = { tem: 14, sas: 14, dum: 14, mk2: 12, mk3: 8, mk1: 6, nsa: 10, nsq: 5, neg: 5, pud: 10, was: 6, cho: 4 };
  var NAME = { tem: 'Tempura', sas: 'Sashimi', dum: 'Gyoza', mk1: 'Maki ×1', mk2: 'Maki ×2', mk3: 'Maki ×3', nsa: 'Nigiri al salmone', nsq: 'Nigiri al calamaro', neg: 'Nigiri all’uovo', pud: 'Budino', was: 'Wasabi', cho: 'Bacchette' };
  var NIGIRI = { neg: 1, nsa: 2, nsq: 3 };
  var MAKI = { mk1: 1, mk2: 2, mk3: 3 };
  var DUMP = [0, 1, 3, 6, 10, 15];
  function fullDeck() { var d = []; Object.keys(COUNTS).forEach(function (k) { for (var i = 0; i < COUNTS[k]; i++) d.push(k); }); return d; }
  function handSize(n) { return n === 2 ? 10 : n === 3 ? 9 : n === 4 ? 8 : 7; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 16) g.fx.splice(0, g.fx.length - 16); }
  function count(T, k) { return T.filter(function (c) { return c.k === k; }).length; }
  function makiOf(T) { return T.reduce(function (s, c) { return s + (MAKI[c.k] || 0); }, 0); }
  function freeWasabi(T) { for (var i = 0; i < T.length; i++) if (T[i].k === 'was' && !T[i].nig) return i; return -1; }
  // punti della manche (senza i maki, che dipendono dagli altri)
  function partScore(T) {
    var s = { tem: Math.floor(count(T, 'tem') / 2) * 5, sas: Math.floor(count(T, 'sas') / 3) * 10, dum: DUMP[Math.min(5, count(T, 'dum'))], nig: 0 };
    T.forEach(function (c) { if (NIGIRI[c.k]) s.nig += NIGIRI[c.k]; if (c.k === 'was' && c.nig) s.nig += NIGIRI[c.nig] * 3; });
    return s;
  }
  // maki: chi ha più rotolini prende 6 (diviso a pari merito); i secondi 3 (solo se il primo posto non è condiviso)
  function makiScores(g) {
    var m = g.players.map(function (P) { return makiOf(P.table); }), out = m.map(function () { return 0; });
    var top = Math.max.apply(null, m); if (top <= 0) return out;
    var first = m.map(function (v, i) { return v === top ? i : -1; }).filter(function (i) { return i >= 0; });
    first.forEach(function (i) { out[i] = Math.floor(6 / first.length); });
    if (first.length === 1) {
      var rest = m.filter(function (v) { return v < top && v > 0; }); if (rest.length) {
        var sec = Math.max.apply(null, rest), second = m.map(function (v, i) { return v === sec ? i : -1; }).filter(function (i) { return i >= 0; });
        second.forEach(function (i) { out[i] = Math.floor(3 / second.length); });
      }
    }
    return out;
  }
  function puddingScores(g) {
    var n = g.players.length, u = g.players.map(function (P) { return P.pud; }), out = u.map(function () { return 0; });
    var hi = Math.max.apply(null, u), lo = Math.min.apply(null, u);
    if (hi === lo) return out;
    var most = u.map(function (v, i) { return v === hi ? i : -1; }).filter(function (i) { return i >= 0; });
    most.forEach(function (i) { out[i] = Math.floor(6 / most.length); });
    if (n > 2) { var least = u.map(function (v, i) { return v === lo ? i : -1; }).filter(function (i) { return i >= 0; }); least.forEach(function (i) { out[i] = -Math.floor(6 / least.length); }); }
    return out;
  }

  function newGame(seats, opts) {
    opts = opts || {};
    var g = {
      v: 1, phase: 'pick', seq: 0, turnN: 0, round: 0, opts: { pass: opts.pass === 'alt' ? 'alt' : 'left' },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], table: [], pick: null, pud: 0, total: 0, hist: [], ready: false }; }),
      deck: shuffle(fullDeck()), log: [], logN: 0, fx: [], fxN: 0, winners: null, final: null, roundRes: null, last: null
    };
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.round++; g.phase = 'pick'; g.roundRes = null; g.last = null;
    var hs = handSize(g.players.length);
    g.players.forEach(function (P) { P.hand = g.deck.splice(0, hs); P.table = []; P.pick = null; P.ready = false; });
    g.turnN++;
    log(g, 'Manche ' + g.round + ' di 3: ' + hs + ' carte a testa. Scegliete una carta e passate la mano ' + (dir(g) > 0 ? 'a sinistra' : 'a destra') + '.', 'sys');
    fx(g, { k: 'deal', round: g.round, hs: hs });
  }
  function dir(g) { return g.opts.pass === 'alt' && g.round === 2 ? -1 : 1; }
  function hasCho(P) { return P.table.some(function (c) { return c.k === 'cho'; }); }
  function decider(g) { if (g.phase !== 'pick') return null; for (var i = 0; i < g.players.length; i++) if (!g.players[i].pick) return i; return null; }
  function pending(g) {
    if (g.phase === 'pick') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].pick; });
    if (g.phase === 'scores') return g.players.map(function (P, i) { return i; }).filter(function (i) { return !g.players[i].ready; });
    return [];
  }
  function place(P, k) {
    if (NIGIRI[k]) { var w = freeWasabi(P.table); if (w >= 0) { P.table[w].nig = k; return 'wasabi'; } }
    P.table.push({ k: k }); return null;
  }
  function reveal(g) {
    var plays = [];
    g.players.forEach(function (P, p) {
      var idx = P.pick.cards, ks = idx.map(function (i) { return P.hand[i]; }), notes = [];
      idx.slice().sort(function (a, b) { return b - a; }).forEach(function (i) { P.hand.splice(i, 1); });
      ks.forEach(function (k) { notes.push(place(P, k)); });
      if (ks.length === 2) { var c = -1; P.table.forEach(function (x, j) { if (c < 0 && x.k === 'cho') c = j; }); P.table.splice(c, 1); P.hand.push('cho'); }
      P.pick = null;
      plays.push({ p: p, ks: ks, wasabi: notes.indexOf('wasabi') >= 0, cho: ks.length === 2 });
    });
    g.last = plays;
    log(g, 'Si scoprono: ' + plays.map(function (x) { return nick(g, x.p) + ' ' + x.ks.map(function (k) { return NAME[k]; }).join(' + ') + (x.wasabi ? ' (sul Wasabi!)' : ''); }).join(', ') + '.', 'reveal');
    fx(g, { k: 'reveal', plays: plays });
    // si passano le mani
    var n = g.players.length, d = dir(g), hands = g.players.map(function (P) { return P.hand; });
    g.players.forEach(function (P, p) { P.hand = hands[(p - d + n) % n]; });
    g.turnN++;
    if (!g.players[0].hand.length) endRound(g);
    else fx(g, { k: 'pass', d: d });
  }
  function endRound(g) {
    var mk = makiScores(g), parts = g.players.map(function (P) { return partScore(P.table); });
    var pts = g.players.map(function (P, i) { var s = parts[i]; return mk[i] + s.tem + s.sas + s.dum + s.nig; });
    var puds = g.players.map(function (P) { return count(P.table, 'pud'); });
    g.players.forEach(function (P, i) { P.pud += puds[i]; P.total += pts[i]; P.hist.push(pts[i]); P.ready = !!P.bot; });
    g.roundRes = { mk: mk, parts: parts, pts: pts, maki: g.players.map(function (P) { return makiOf(P.table); }), puds: puds, tables: g.players.map(function (P) { return P.table.slice(); }), pudPts: null };
    log(g, 'Fine della manche ' + g.round + ': ' + g.players.map(function (P, i) { return P.nick + ' +' + pts[i]; }).join(', ') + '.', 'round');
    if (g.round >= 3) {
      var pp = puddingScores(g);
      g.players.forEach(function (P, i) { P.total += pp[i]; });
      g.roundRes.pudPts = pp;
      if (pp.some(Boolean)) log(g, 'Budini: ' + g.players.map(function (P, i) { return P.nick + ' ' + P.pud + (pp[i] ? ' (' + (pp[i] > 0 ? '+' : '') + pp[i] + ')' : ''); }).join(', ') + '.', 'round');
      var better = function (a, b) { return g.players[b].total - g.players[a].total || g.players[b].pud - g.players[a].pud; };
      var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return better(a, b) || a - b; });
      var place = g.players.map(function (P, i) { return 1 + g.players.filter(function (Q, j) { return better(j, i) < 0; }).length; });
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
      if (a.a !== 'next') return 'Tocca «Prossima manche».';
      if (P.ready) return null;
      P.ready = true;
      if (g.players.every(function (Q) { return Q.ready || Q.bot; })) { startRound(g); fx(g, { k: 'next' }); }
      return null;
    }
    if (g.phase !== 'pick') return 'Mossa non valida.';
    if (a.a === 'unpick') { if (!P.pick) return null; P.pick = null; fx(g, { k: 'picked', p: p, on: false }); return null; }
    if (a.a !== 'pick') return 'Mossa sconosciuta.';
    var cs = Array.isArray(a.cards) ? a.cards.map(Number) : [];
    if (cs.length < 1 || cs.length > 2) return 'Scegli una carta (o due con le Bacchette).';
    if (cs.some(function (i) { return !(i >= 0 && i < P.hand.length) || i !== Math.floor(i); }) || (cs.length === 2 && cs[0] === cs[1])) return 'Scegli le carte della tua mano.';
    if (cs.length === 2 && !hasCho(P)) return 'Per prendere due carte servono le Bacchette sul tavolo.';
    P.pick = { cards: cs };
    fx(g, { k: 'picked', p: p, on: true });
    if (g.players.every(function (Q) { return Q.pick; })) reveal(g);
    return null;
  }
  function forceNext(g) { if (g.phase !== 'scores') return false; g.players.forEach(function (P) { P.ready = true; }); startRound(g); fx(g, { k: 'next' }); g.seq++; return true; }

  return { newGame: newGame, act: act, decider: decider, pending: pending, forceNext: forceNext, fullDeck: fullDeck, handSize: handSize, partScore: partScore, makiOf: makiOf, makiScores: makiScores, puddingScores: puddingScores,
    count: count, freeWasabi: freeWasabi, hasCho: hasCho, NAME: NAME, NIGIRI: NIGIRI, MAKI: MAKI, DUMP: DUMP, COUNTS: COUNTS, setRandom: setRandom, shuffle: shuffle, dir: dir };
})();
if (typeof module !== 'undefined') module.exports = SGEngine;
