/* ===== Binari d'Italia: regole (stato in puro JSON, gira sull'host) =====
   Regole base del gioco di tratte ferroviarie + traghetti (servono locomotive sugli spazi col simbolo). */
var BIEngine = (function () {
  var D = BIData, R = D.routes, CC = D.CARD_COLORS;
  var ADJ = {}; Object.keys(D.cities).forEach(function (c) { ADJ[c] = []; });
  R.forEach(function (r) { ADJ[r.a].push(r); ADJ[r.b].push(r); });

  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function cname(c) { return D.cities[c].n; }
  function rname(r) { return cname(r.a) + '–' + cname(r.b); }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 80) g.log.splice(0, g.log.length - 80); }
  function fx(g, e) { g.fx.push(e); }
  function handCount(P) { var n = 0; for (var k in P.hand) n += P.hand[k]; return n; }
  function emptyHand() { var h = {}; CC.forEach(function (c) { h[c] = 0; }); h.L = 0; return h; }

  /* ---------- mazzo ---------- */
  function drawCard(g) {
    if (!g.deck.length) {
      if (!g.disc.length) return null;
      g.deck = shuffle(g.disc); g.disc = [];
      log(g, 'Mazzo finito: gli scarti vengono rimescolati in un nuovo mazzo.', 'sys'); fx(g, { k: 'reshuffle' });
    }
    return g.deck.pop();
  }
  function locosUp(g) { return g.face.filter(function (c) { return c === 'L'; }).length; }
  // Tre locomotive scoperte: si scartano le cinque e se ne scoprono altre (finché ha senso: niente giri infiniti).
  function checkLocos(g) {
    var guard = 0;
    while (locosUp(g) >= 3 && guard++ < 6) {
      var avail = g.deck.length + g.disc.length;
      var nonLoco = g.deck.concat(g.disc).filter(function (c) { return c !== 'L'; }).length;
      if (avail < 5 || nonLoco < 3) break;
      g.face.forEach(function (c) { if (c) g.disc.push(c); });
      g.face = [];
      for (var i = 0; i < 5; i++) { var c = drawCard(g); g.face.push(c || null); }
      log(g, 'Tre locomotive scoperte: le cinque carte vengono scartate e se ne scoprono altre cinque.', 'sys'); fx(g, { k: 'wipe' });
    }
  }
  function refill(g, i) { g.face[i] = drawCard(g) || null; }

  /* ---------- nuova partita ---------- */
  function newGame(seats, opts) {
    var deck = []; CC.forEach(function (c) { for (var i = 0; i < 12; i++) deck.push(c); }); for (var j = 0; j < 14; j++) deck.push('L');
    var g = {
      v: 1, phase: 'play', stage: 'setup', seq: 0, round: 1,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, trains: D.TRAINS, score: 0, hand: emptyHand(), tickets: [], offer: [], ready: false, drew: 0 }; }),
      deck: shuffle(deck), disc: [], face: [], tdeck: shuffle(D.tickets.map(function (t) { return t.id; })),
      claims: {}, turn: Math.floor(Math.random() * seats.length), first: 0, last: null, drawn: [],
      log: [], logN: 0, fx: [], fxN: 0, final: null, nplayers: seats.length
    };
    g.first = g.turn;
    g.players.forEach(function (P) { for (var k = 0; k < 4; k++) P.hand[drawCard(g)]++; P.offer = [g.tdeck.pop(), g.tdeck.pop(), g.tdeck.pop()]; });
    for (var f = 0; f < 5; f++) g.face.push(drawCard(g));
    checkLocos(g);
    log(g, 'Si parte! Ognuno riceve 4 carte vagone e 3 biglietti: tienine almeno 2. Comincia ' + nick(g, g.turn) + '.', 'sys');
    return g;
  }

  /* ---------- tratte ---------- */
  function owner(g, rid) { var o = g.claims[rid]; return o == null ? null : o; }
  // Perché una tratta non si può prendere (null = si può, carte a parte).
  function blocked(g, p, r) {
    if (owner(g, r.id) != null) return owner(g, r.id) === p ? 'È già tua.' : 'È già di ' + nick(g, owner(g, r.id)) + '.';
    if (r.twin != null) {
      var o = owner(g, r.twin);
      if (o === p) return 'Hai già il binario accanto: non puoi prendere entrambe le tratte doppie.';
      if (o != null && g.nplayers <= 3) return 'Con 2 o 3 giocatori si usa un solo binario delle tratte doppie, e l’altro è già preso.';
    }
    if (g.players[p].trains < r.len) return 'Ti restano solo ' + g.players[p].trains + ' vagoni: ne servono ' + r.len + '.';
    return null;
  }
  // Modi possibili di pagare la tratta con la mano attuale: [{c, n, L}] (c = colore delle carte normali).
  function payOptions(g, p, r) {
    var P = g.players[p], h = P.hand, out = [], need = r.len, minL = r.ferry || 0;
    var cols = r.col === 'X' ? CC : [r.col];
    cols.forEach(function (c) {
      var have = h[c];
      for (var L = minL; L <= Math.min(h.L, need); L++) {
        var n = need - L; if (n > have) continue;
        out.push({ c: n ? c : 'L', n: n, L: L }); break; // la combinazione con meno locomotive per quel colore
      }
    });
    if (!out.length && h.L >= need) out.push({ c: 'L', n: 0, L: need });
    // tutte locomotive è sempre ammesso se le hai (anche se c'è un'opzione col colore)
    var uniq = {}; return out.filter(function (o) { var k = o.c + o.n + o.L; if (uniq[k]) return false; uniq[k] = 1; return true; })
      .sort(function (a, b) { return a.L - b.L || b.n - a.n; });
  }
  function canClaim(g, p, r) {
    var why = blocked(g, p, r); if (why) return { ok: false, why: why };
    var opts = payOptions(g, p, r);
    if (!opts.length) {
      var need = r.ferry ? ' (traghetto: almeno ' + r.ferry + ' locomotiv' + (r.ferry > 1 ? 'e' : 'a') + ')' : '';
      return { ok: false, why: 'Non hai abbastanza carte: servono ' + r.len + ' carte ' + (r.col === 'X' ? 'dello stesso colore' : D.COLORS[r.col].n) + need + '.' };
    }
    return { ok: true, opts: opts };
  }

  /* ---------- collegamenti e percorso più lungo ---------- */
  function myRoutes(g, p) { return R.filter(function (r) { return g.claims[r.id] === p; }); }
  function connected(g, p, a, b) {
    if (a === b) return true;
    var seen = {}, st = [a]; seen[a] = 1;
    var mine = myRoutes(g, p);
    while (st.length) {
      var u = st.pop();
      for (var i = 0; i < mine.length; i++) {
        var r = mine[i], v = r.a === u ? r.b : r.b === u ? r.a : null;
        if (v && !seen[v]) { if (v === b) return true; seen[v] = 1; st.push(v); }
      }
    }
    return false;
  }
  function ticketPath(g, p, t) { // tratte che collegano le due città del biglietto (per evidenziarle)
    var mine = myRoutes(g, p), prev = {}, q = [t.a]; prev[t.a] = null;
    while (q.length) {
      var u = q.shift(); if (u === t.b) break;
      mine.forEach(function (r) { var v = r.a === u ? r.b : r.b === u ? r.a : null; if (v && !(v in prev)) { prev[v] = r.id; q.push(v); } });
    }
    if (!(t.b in prev)) return null;
    var out = [], c = t.b; while (prev[c] != null) { var rr = D.byId[prev[c]]; out.push(rr.id); c = rr.a === c ? rr.b : rr.a; } return out;
  }
  // Percorso continuo più lungo: le tratte non si ripetono, le città sì (ricerca esaustiva: le tratte di un giocatore sono poche).
  function longest(g, p) {
    var mine = myRoutes(g, p), best = { len: 0, ids: [] };
    if (!mine.length) return best;
    var by = {}; mine.forEach(function (r) { (by[r.a] = by[r.a] || []).push(r); (by[r.b] = by[r.b] || []).push(r); });
    var used = {}, path = [];
    function dfs(u, len) {
      if (len > best.len) best = { len: len, ids: path.slice() };
      (by[u] || []).forEach(function (r) {
        if (used[r.id]) return; used[r.id] = 1; path.push(r.id);
        dfs(r.a === u ? r.b : r.a, len + r.len);
        path.pop(); used[r.id] = 0;
      });
    }
    Object.keys(by).forEach(function (c) { dfs(c, 0); });
    return best;
  }

  /* ---------- fine turno e fine partita ---------- */
  function endTurn(g, p) {
    var P = g.players[p]; P.drew = 0; g.drawn = [];
    if (g.last) {
      g.last.rem--;
      if (g.last.rem <= 0) { finish(g); return; }
    } else if (P.trains <= 2) {
      g.last = { by: p, rem: g.nplayers };
      log(g, nick(g, p) + ' ha ' + P.trains + ' vagon' + (P.trains === 1 ? 'e' : 'i') + ': ULTIMO GIRO! Ognuno, ' + nick(g, p) + ' compreso, gioca ancora un turno.', 'last', p);
      fx(g, { k: 'last', p: p });
    }
    g.turn = (g.turn + 1) % g.nplayers; if (g.turn === g.first) g.round++;
    g.stage = 'act';
  }
  function finish(g) {
    var rows = g.players.map(function (P, p) {
      var routes = myRoutes(g, p), rp = routes.reduce(function (s, r) { return s + D.SCORE[r.len]; }, 0);
      var tk = P.tickets.map(function (id) { var t = D.tickets[id], ok = connected(g, p, t.a, t.b); return { id: id, ok: ok, v: ok ? t.v : -t.v, path: ok ? ticketPath(g, p, t) : null }; });
      var lg = longest(g, p);
      return { p: p, routePts: rp, tickets: tk, tpts: tk.reduce(function (s, t) { return s + t.v; }, 0), done: tk.filter(function (t) { return t.ok; }).length, longest: lg.len, lpath: lg.ids, bonus: 0, total: 0 };
    });
    var maxL = Math.max.apply(null, rows.map(function (r) { return r.longest; }));
    rows.forEach(function (r) { if (maxL > 0 && r.longest === maxL) r.bonus = D.LONGEST; r.total = r.routePts + r.tpts + r.bonus; g.players[r.p].score = r.total; });
    var order = rows.slice().sort(function (a, b) { return b.total - a.total || b.done - a.done || b.bonus - a.bonus; }).map(function (r) { return r.p; });
    g.final = { rows: rows, order: order, maxL: maxL };
    g.winner = order[0]; g.phase = 'over'; g.stage = 'over';
    log(g, 'Fine della partita: vince ' + nick(g, order[0]) + ' con ' + rows[order[0]].total + ' punti!', 'win', order[0]);
    fx(g, { k: 'over' });
  }

  /* ---------- chi deve decidere ---------- */
  function decider(g) {
    if (g.phase !== 'play') return null;
    if (g.stage === 'setup') { for (var i = 0; i < g.nplayers; i++) { var k = (g.turn + i) % g.nplayers; if (!g.players[k].ready) return k; } return null; }
    return g.turn;
  }
  function waitingSetup(g) { return g.players.map(function (P, i) { return P.ready ? -1 : i; }).filter(function (i) { return i >= 0; }); }
  function canDrawAny(g, second) {
    if (g.deck.length || g.disc.length) return true;
    return g.face.some(function (c) { return c && !(second && c === 'L'); });
  }

  /* ---------- azioni ---------- */
  function act(g, p, a) {
    if (!a || g.phase !== 'play') return 'La partita è finita.';
    g.fx = []; var P = g.players[p];
    var r = doAct(g, p, P, a);
    if (!r) { g.seq++; g.fxN++; }
    return r;
  }
  function doAct(g, p, P, a) {
    if (a.a === 'keep') {
      var ids = (a.ids || []).filter(function (x, i, arr) { return P.offer.indexOf(x) >= 0 && arr.indexOf(x) === i; });
      if (g.stage === 'setup') {
        if (P.ready) return 'Hai già scelto i biglietti.';
        if (ids.length < 2) return 'All’inizio devi tenere almeno 2 biglietti.';
      } else {
        if (g.stage !== 'tickets' || g.turn !== p) return 'Non è il momento di scegliere biglietti.';
        if (ids.length < 1) return 'Devi tenere almeno 1 biglietto.';
      }
      var back = P.offer.filter(function (x) { return ids.indexOf(x) < 0; });
      P.tickets = P.tickets.concat(ids); P.offer = [];
      back.forEach(function (x) { g.tdeck.unshift(x); }); // in fondo al mazzo
      fx(g, { k: 'keep', p: p, n: ids.length, back: back.length });
      if (g.stage === 'setup') {
        P.ready = true;
        log(g, nick(g, p) + ' tiene ' + ids.length + ' biglietti.', 'tk', p);
        if (g.players.every(function (Q) { return Q.ready; })) { g.stage = 'act'; log(g, 'Tutti pronti: tocca a ' + nick(g, g.turn) + '.', 'sys'); fx(g, { k: 'start' }); }
        return null;
      }
      log(g, nick(g, p) + ' pesca biglietti e ne tiene ' + ids.length + (back.length ? ' (ne rimette ' + back.length + ' in fondo al mazzo)' : '') + '.', 'tk', p);
      endTurn(g, p); return null;
    }
    if (g.stage === 'setup') return 'Prima scegli i biglietti di partenza.';
    if (g.turn !== p) return 'Non è il tuo turno.';
    if (a.a === 'draw') {
      if (g.stage !== 'act' && g.stage !== 'draw2') return 'Ora non puoi pescare carte.';
      var second = g.stage === 'draw2', card, from;
      if (a.i === 'deck') {
        if (!g.deck.length && !g.disc.length) return 'Il mazzo è vuoto: prendi una carta scoperta.';
        card = drawCard(g); from = 'deck';
      } else {
        var i = +a.i; if (!(i >= 0 && i < 5) || !g.face[i]) return 'Quella carta non c’è.';
        card = g.face[i];
        if (card === 'L' && second) return 'Come seconda carta non puoi prendere una locomotiva scoperta.';
        refill(g, i); from = 'face';
      }
      P.hand[card]++; g.drawn.push({ c: from === 'face' ? card : null, from: from });
      fx(g, { k: 'draw', p: p, c: from === 'face' ? card : null, from: from, i: a.i });
      var endNow = (from === 'face' && card === 'L' && !second) || second;
      checkLocos(g);
      if (!endNow && !canDrawAny(g, true)) endNow = true;
      if (endNow) {
        var desc = g.drawn.map(function (d) { return d.from === 'face' ? (d.c === 'L' ? 'una locomotiva scoperta' : 'un ' + D.COLORS[d.c].n + ' scoperto') : 'una carta coperta'; });
        log(g, nick(g, p) + ' prende ' + desc.join(' e ') + '.', 'draw', p);
        endTurn(g, p);
      } else g.stage = 'draw2';
      return null;
    }
    if (g.stage !== 'act') return g.stage === 'draw2' ? 'Prendi la seconda carta per finire il turno.' : 'Prima scegli quali biglietti tenere.';
    if (a.a === 'claim') {
      var r = D.byId[a.r]; if (!r) return 'Tratta sconosciuta.';
      var why = blocked(g, p, r); if (why) return why;
      var c = a.c, L = +a.L || 0, n = r.len - L;
      if (L < 0 || L > r.len) return 'Numero di locomotive non valido.';
      if (L < (r.ferry || 0)) return 'Su questo traghetto servono almeno ' + r.ferry + ' locomotiv' + (r.ferry > 1 ? 'e' : 'a') + '.';
      if (n > 0) {
        if (CC.indexOf(c) < 0) return 'Scegli il colore delle carte.';
        if (r.col !== 'X' && c !== r.col) return 'Questa tratta si prende con carte ' + D.COLORS[r.col].n + '.';
        if (P.hand[c] < n) return 'Non hai abbastanza carte ' + D.COLORS[c].n + '.';
      }
      if (P.hand.L < L) return 'Non hai abbastanza locomotive.';
      if (n > 0) { P.hand[c] -= n; for (var k = 0; k < n; k++) g.disc.push(c); }
      P.hand.L -= L; for (var m = 0; m < L; m++) g.disc.push('L');
      g.claims[r.id] = p; P.trains -= r.len; var pts = D.SCORE[r.len]; P.score += pts;
      fx(g, { k: 'claim', p: p, r: r.id, pts: pts });
      log(g, nick(g, p) + ' prende ' + rname(r) + (r.ferry ? ' (traghetto)' : '') + ': ' + r.len + ' vagon' + (r.len > 1 ? 'i' : 'e') + ', +' + pts + ' punt' + (pts > 1 ? 'i' : 'o') + '.', 'claim', p);
      if (!g.face.every(Boolean)) { for (var q = 0; q < 5; q++) if (!g.face[q]) refill(g, q); checkLocos(g); }
      endTurn(g, p); return null;
    }
    if (a.a === 'pass') {
      if (canDrawAny(g, false) || g.tdeck.length || R.some(function (r) { return canClaim(g, p, r).ok; })) return 'Puoi ancora fare qualcosa: non si può passare.';
      log(g, nick(g, p) + ' non può fare nessuna mossa e passa.', 'sys', p); endTurn(g, p); return null;
    }
    if (a.a === 'tickets') {
      if (!g.tdeck.length) return 'Il mazzo dei biglietti è finito.';
      P.offer = []; for (var t = 0; t < 3 && g.tdeck.length; t++) P.offer.push(g.tdeck.pop());
      g.stage = 'tickets'; fx(g, { k: 'tdraw', p: p, n: P.offer.length });
      log(g, nick(g, p) + ' pesca ' + P.offer.length + ' biglietti destinazione.', 'tk', p);
      return null;
    }
    return 'Azione sconosciuta.';
  }

  return {
    newGame: newGame, act: act, decider: decider, waitingSetup: waitingSetup, blocked: blocked, canClaim: canClaim, payOptions: payOptions,
    connected: connected, longest: longest, ticketPath: ticketPath, myRoutes: myRoutes, handCount: handCount, owner: owner,
    canDrawAny: canDrawAny, rname: rname, cname: cname, ADJ: ADJ, shuffle: shuffle
  };
})();
if (typeof module !== 'undefined') module.exports = BIEngine;
