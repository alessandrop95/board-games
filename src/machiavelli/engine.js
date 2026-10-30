/* ===== Machiavelli: motore delle regole (gira sull'host; lo stato è JSON) =====
   Due mazzi francesi senza jolly (104 carte). Nel proprio turno o si gioca almeno una carta della mano
   riorganizzando a piacere le combinazioni sul tavolo (alla fine tutte devono essere valide), oppure si pesca una carta.
   Vince chi resta senza carte. Carta = numero 0..103: mazzo (0/1) * 52 + seme * 13 + (valore - 1). */
var MCEngine = (function () {
  var SUITS = ['picche', 'cuori', 'quadri', 'fiori'], SYM = ['♠', '♥', '♦', '♣'];
  var RN = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  var RNAME = { 1: 'asso', 11: 'fante', 12: 'donna', 13: 're' };
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function rank(c) { return c % 13 + 1; }
  function suit(c) { return Math.floor(c / 13) % 4; }
  function label(c) { return (RN[rank(c)] || rank(c)) + SYM[suit(c)]; }
  function cname(c) { var r = rank(c); return (RNAME[r] || r) + ' di ' + SUITS[suit(c)]; }
  function points(c) { var r = rank(c); return r === 1 ? 1 : r > 10 ? 10 : r; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 80) g.log.splice(0, g.log.length - 80); }
  function fx(g, e) { g.fx.push(e); }

  /* ---------- combinazioni ---------- */
  // Tipo di una combinazione: 'set' (tris/poker: stesso valore, semi diversi), 'run' (scala: stesso seme, valori consecutivi;
  // l'asso sta prima del 2 o dopo il re, mai in mezzo: K-A-2 non vale) oppure null se non è valida.
  function kind(cards) {
    if (!cards || cards.length < 3) return null;
    var r0 = rank(cards[0]), s0 = suit(cards[0]);
    if (cards.every(function (c) { return rank(c) === r0; })) {
      if (cards.length > 4) return null;
      var ss = {}; for (var i = 0; i < cards.length; i++) { if (ss[suit(cards[i])]) return null; ss[suit(cards[i])] = 1; }
      return 'set';
    }
    if (!cards.every(function (c) { return suit(c) === s0; })) return null;
    var rs = cards.map(rank).sort(function (a, b) { return a - b; });
    for (var j = 1; j < rs.length; j++) if (rs[j] === rs[j - 1]) return null;
    if (rs[rs.length - 1] - rs[0] === rs.length - 1) return 'run';
    if (rs[0] === 1) { var hi = rs.slice(1).concat([14]); if (hi[hi.length - 1] - hi[0] === hi.length - 1) return 'run'; }
    return null;
  }
  function valid(cards) { return !!kind(cards); }
  function aceHigh(cards) { var rs = cards.map(rank); return rs.indexOf(1) >= 0 && rs.indexOf(13) >= 0 && rs.indexOf(2) < 0; }
  // ordine di visualizzazione: scale dal più basso (asso alto se c'è il re), tris per seme
  function sortGroup(cards) {
    var hi = aceHigh(cards), same = cards.length > 1 && cards.every(function (c) { return rank(c) === rank(cards[0]); });
    return cards.slice().sort(function (a, b) {
      if (same) return suit(a) - suit(b) || a - b;
      var ra = rank(a) === 1 && hi ? 14 : rank(a), rb = rank(b) === 1 && hi ? 14 : rank(b);
      return suit(a) - suit(b) || ra - rb || a - b;
    });
  }
  function groupPoints(cards) { var hi = aceHigh(cards); return cards.reduce(function (s, c) { return s + (rank(c) === 1 && hi ? 11 : points(c)); }, 0); }

  /* ---------- nuova partita ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var n = seats.length, deck = []; for (var i = 0; i < 104; i++) deck.push(i); shuffle(deck);
    var cards = [13, 15].indexOf(+opts.cards) >= 0 ? +opts.cards : 13;
    var g = {
      v: 1, phase: 'play', stage: 'play', seq: 0, turnN: 1, round: 1,
      opts: { cards: cards, open36: !!opts.open36 },
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, hand: [], opened: false, played: 0 }; }),
      deck: deck, table: [], gidN: 0, turn: Math.floor(rand() * n), first: 0, passes: 0, draft: null,
      log: [], logN: 0, fx: [], fxN: 0, winner: null, final: null
    };
    g.first = g.turn;
    for (var k = 0; k < cards; k++) g.players.forEach(function (P) { P.hand.push(g.deck.pop()); });
    log(g, 'Si parte! ' + cards + ' carte a testa' + (g.opts.open36 ? '; per «aprire» la prima giocata deve valere almeno 36 punti con carte tue' : '') + '. Comincia ' + nick(g, g.turn) + '.', 'sys');
    return g;
  }

  /* ---------- turni ---------- */
  function decider(g) { return g.phase === 'play' ? g.turn : null; }
  function nextTurn(g) {
    g.draft = null; g.turn = (g.turn + 1) % g.players.length; g.turnN++; if (g.turn === g.first) g.round++;
    fx(g, { k: 'turn', p: g.turn });
  }
  function finish(g, winner) {
    var rows = g.players.map(function (P, i) { return { p: i, left: P.hand.length, pts: P.hand.reduce(function (s, c) { return s + points(c); }, 0) }; });
    var order = rows.slice().sort(function (a, b) { return (b.p === winner) - (a.p === winner) || a.left - b.left || a.pts - b.pts; }).map(function (r) { return r.p; });
    g.winner = order[0]; g.final = { order: order, rows: rows, out: winner != null }; g.phase = 'over'; g.stage = 'over'; g.draft = null;
    log(g, winner != null ? nick(g, winner) + ' ha finito le carte e vince!' : 'Nessuno riesce più a giocare: vince ' + nick(g, order[0]) + ' con meno carte in mano.', 'win', order[0]);
    fx(g, { k: 'over', p: order[0] });
  }

  /* ---------- controllo di una giocata ---------- */
  // t = nuovo tavolo (lista di combinazioni). Risponde { err } oppure { used: carte della mano giocate }.
  function checkPlay(g, p, t) {
    var P = g.players[p];
    if (!Array.isArray(t) || t.some(function (x) { return !Array.isArray(x); })) return { err: 'Tavolo non valido.' };
    var before = {}, after = {}, inHand = {};
    g.table.forEach(function (gr) { gr.c.forEach(function (c) { before[c] = 1; }); });
    P.hand.forEach(function (c) { inHand[c] = 1; });
    var used = [];
    for (var i = 0; i < t.length; i++) for (var j = 0; j < t[i].length; j++) {
      var c = t[i][j];
      if (typeof c !== 'number' || c < 0 || c > 103 || c !== Math.floor(c)) return { err: 'Carta non valida.' };
      if (after[c]) return { err: 'Una carta compare due volte.' };
      after[c] = 1;
      if (!before[c]) { if (!inHand[c]) return { err: 'Puoi giocare solo carte della tua mano.' }; used.push(c); }
    }
    for (var b in before) if (!after[b]) return { err: 'Le carte del tavolo devono restare sul tavolo: non puoi riprenderle in mano.' };
    var bad = t.filter(function (x) { return !valid(x); });
    if (bad.length) return { err: 'Sul tavolo ci sono combinazioni non valide: ' + bad.map(function (x) { return x.map(label).join(' '); }).join(' · ') + '.' };
    if (!used.length) return { err: 'Devi mettere sul tavolo almeno una carta della tua mano (oppure pesca).' };
    if (g.opts.open36 && !P.opened) {
      // per aprire: le combinazioni del tavolo restano com'erano e le nuove sono fatte solo con carte tue, per almeno 36 punti
      var old = g.table.map(function (gr) { return gr.c.slice().sort(function (a, b) { return a - b; }).join(','); });
      var keep = {}; old.forEach(function (k) { keep[k] = (keep[k] || 0) + 1; });
      var fresh = [];
      t.forEach(function (x) { var k = x.slice().sort(function (a, b) { return a - b; }).join(','); if (keep[k]) keep[k]--; else fresh.push(x); });
      if (Object.keys(keep).some(function (k) { return keep[k] > 0; }) || fresh.some(function (x) { return x.some(function (c) { return before[c]; }); }))
        return { err: 'Prima di aprire non puoi toccare le combinazioni del tavolo: cala solo combinazioni fatte con carte tue.' };
      var pts = fresh.reduce(function (s, x) { return s + groupPoints(x); }, 0);
      if (pts < 36) return { err: 'Per aprire servono almeno 36 punti: le tue combinazioni ne valgono ' + pts + '.' };
    }
    return { used: used };
  }

  /* ---------- azioni ---------- */
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase !== 'play') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    g.fx = [];
    var r = doAct(g, p, a);
    if (!r) { g.seq++; g.fxN++; }
    return r;
  }
  function doAct(g, p, a) {
    var P = g.players[p];
    if (a.a === 'draft') {   // bozza del turno in corso: la vedono gli altri, ma non cambia niente finché non si conferma
      var t = a.t; if (!Array.isArray(t)) return 'Bozza non valida.';
      var ok = {}, seen = {}; g.table.forEach(function (gr) { gr.c.forEach(function (c) { ok[c] = 1; }); }); P.hand.forEach(function (c) { ok[c] = 1; });
      for (var i = 0; i < t.length; i++) { if (!Array.isArray(t[i])) return 'Bozza non valida.'; for (var j = 0; j < t[i].length; j++) { var c = t[i][j]; if (!ok[c] || seen[c]) return 'Bozza non valida.'; seen[c] = 1; } }
      g.draft = { p: p, t: t.map(function (x) { return x.slice(); }), turnN: g.turnN };
      return null;
    }
    if (a.a === 'draw') {
      if (!g.deck.length) {
        g.passes++; log(g, nick(g, p) + ' non gioca e passa (il mazzo è finito).', 'pass', p); fx(g, { k: 'pass', p: p });
        if (g.passes >= g.players.length) { finish(g, null); return null; }
        nextTurn(g); return null;
      }
      var c2 = g.deck.pop(); P.hand.push(c2); g.passes = 0;
      log(g, nick(g, p) + ' pesca una carta.', 'draw', p); fx(g, { k: 'draw', p: p, c: c2 });
      if (!g.deck.length) log(g, 'Il mazzo è finito: da ora chi non può giocare passa. Se passano tutti di fila, vince chi ha meno carte.', 'sys');
      nextTurn(g); return null;
    }
    if (a.a === 'play') {
      var chk = checkPlay(g, p, a.t); if (chk.err) return chk.err;
      // le combinazioni rimaste uguali tengono il loro numero (per le animazioni), le altre ne prendono uno nuovo
      var olds = {}; g.table.forEach(function (gr) { olds[gr.c.slice().sort(function (x, y) { return x - y; }).join(',')] = gr.id; });
      var touched = 0;
      g.table = a.t.map(function (x) { var k = x.slice().sort(function (m, n) { return m - n; }).join(','), id = olds[k]; if (id != null) delete olds[k]; else { id = ++g.gidN; touched++; } return { id: id, c: sortGroup(x) }; });
      var used = chk.used, set = {}; used.forEach(function (c) { set[c] = 1; });
      P.hand = P.hand.filter(function (c) { return !set[c]; });
      P.opened = true; P.played += used.length; g.passes = 0;
      log(g, nick(g, p) + ' gioca ' + used.length + (used.length > 1 ? ' carte' : ' carta') + ': ' + used.map(label).join(' ') + (Object.keys(olds).length ? ' riorganizzando il tavolo' : '') + '. Gliene restano ' + P.hand.length + '.', 'play', p);
      fx(g, { k: 'play', p: p, cards: used, n: used.length, groups: g.table.filter(function (gr) { return gr.c.some(function (c) { return set[c]; }); }).map(function (gr) { return gr.id; }) });
      if (!P.hand.length) { finish(g, p); return null; }
      nextTurn(g); return null;
    }
    return 'Mossa sconosciuta.';
  }

  return { newGame: newGame, act: act, decider: decider, kind: kind, valid: valid, sortGroup: sortGroup, groupPoints: groupPoints, checkPlay: checkPlay,
    rank: rank, suit: suit, label: label, cname: cname, points: points, aceHigh: aceHigh, setRandom: setRandom, shuffle: shuffle, SUITS: SUITS, SYM: SYM };
})();
if (typeof module !== 'undefined') module.exports = MCEngine;
