/* ===== Catan: motore delle regole (gira sull'host; lo stato è JSON) =====
   act(g, p, azione) applica una mossa del giocatore p e risponde null, oppure il motivo per cui non si può.
   Fasi del turno (g.stage): setup (fondazione) · roll (prima del lancio) · discard (scarto col 7) · robber (sposta il ladro)
   · steal (scegli chi derubare) · main (commercio e costruzione, variante combinata) · road2 (strade gratis della carta). */
var CTEngine = (function () {
  var D = (typeof CTData !== 'undefined') ? CTData : require('./data.js');
  var RES = D.RES, V = D.verts, EDG = D.edges, HX = D.hexes;
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function emptyRes() { return { brick: 0, wood: 0, wool: 0, grain: 0, ore: 0 }; }
  function total(r) { var n = 0; for (var k in r) n += r[k] || 0; return n; }
  function has(r, cost) { for (var k in cost) if ((r[k] || 0) < cost[k]) return false; return true; }
  function pay(g, P, cost) { for (var k in cost) { P.res[k] -= cost[k]; g.bank[k] += cost[k]; } }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { g.fx.push(e); }
  function resList(r) { var out = []; RES.forEach(function (k) { if (r[k]) out.push(r[k] + ' ' + D.RN[k]); }); return out.join(', ') || 'niente'; }

  /* ---------- isola ---------- */
  function makeIsland() {
    var terr = []; Object.keys(D.TILES).forEach(function (t) { for (var i = 0; i < D.TILES[t]; i++) terr.push(t); });
    // prima si cerca un'isola equilibrata; se non esce, basta la regola ufficiale (6 e 8 mai vicini), che vale sempre
    for (var tries = 0; ; tries++) {
      shuffle(terr);
      var nums = shuffle(D.NUMBERS.slice()), hex = [], k = 0;
      terr.forEach(function (t) { hex.push({ t: t, n: t === 'desert' ? null : nums[k++] }); });
      if (fair(hex, tries < 600)) return hex;
    }
  }
  // 6 e 8 mai vicini (regola ufficiale); in più niente numeri uguali vicini e niente tre tessere ricche attorno allo stesso incrocio
  function fair(hex, strict) {
    for (var i = 0; i < HX.length; i++) {
      var n = hex[i].n; if (!n) continue;
      for (var j = 0; j < HX[i].nb.length; j++) {
        var m = hex[HX[i].nb[j]].n; if (!m) continue;
        if ((n === 6 || n === 8) && (m === 6 || m === 8)) return false;
        if (strict && n === m) return false;
      }
    }
    if (strict) for (var v = 0; v < V.length; v++) { var s = 0; V[v].hexes.forEach(function (h) { s += hex[h].n ? D.PIPS[hex[h].n] : 0; }); if (s > 12) return false; }
    return true;
  }

  /* ---------- nuova partita ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var n = seats.length, first = Math.floor(rand() * n), deck = [];
    Object.keys(D.DEV).forEach(function (k) { for (var i = 0; i < D.DEV[k]; i++) deck.push(k); });
    var hex = makeIsland(), desert = 0; hex.forEach(function (h, i) { if (h.t === 'desert') desert = i; });
    var hk = shuffle(D.HARBORS.slice());
    var order = []; for (var i = 0; i < n; i++) order.push((first + i) % n); for (var j = n - 1; j >= 0; j--) order.push((first + j) % n);
    var g = {
      v: 1, phase: 'play', stage: 'setup', seq: 0, turn: first, first: first, turnN: 1, round: 0,
      opts: { vp: [8, 10, 12].indexOf(+opts.vp) >= 0 ? +opts.vp : 10, gentle: !!opts.gentle },
      hex: hex, robber: desert, harbors: D.harborEdges.map(function (e, i) { return { e: e, k: hk[i] }; }),
      vown: {}, eown: {}, bank: { brick: D.BANK, wood: D.BANK, wool: D.BANK, grain: D.BANK, ore: D.BANK }, deck: shuffle(deck),
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, res: emptyRes(), devs: [], knights: 0, pieces: { road: D.PIECES.road, settle: D.PIECES.settle, city: D.PIECES.city }, road: 0 }; }),
      setup: { order: order, i: 0, step: 'settle', last: null },
      dice: null, rolled: false, devUsed: false, discard: null, back: null, victims: null, free: 0, trade: null, tradeN: 0, offers: 0,
      lr: null, la: null, winner: null, final: null,
      log: [], logN: 0, fx: [], fxN: 0
    };
    log(g, 'Si parte! Fondazione: ognuno piazza una colonia e una strada, poi un secondo giro al contrario. Comincia ' + nick(g, first) + '.', 'sys');
    return g;
  }

  /* ---------- regole di costruzione ---------- */
  function owner(g, v) { return g.vown[v] ? g.vown[v].p : null; }
  function distanceOk(g, v) { if (g.vown[v]) return false; for (var i = 0; i < V[v].adj.length; i++) if (g.vown[V[v].adj[i]]) return false; return true; }
  function canSettle(g, p, v, setup) {
    if (v == null || !V[v]) return 'Incrocio non valido.';
    if (g.vown[v]) return 'Qui c’è già una costruzione.';
    if (!distanceOk(g, v)) return 'Troppo vicino a un’altra colonia: serve almeno un tratto di strada libero in mezzo (regola della distanza).';
    if (g.players[p].pieces.settle <= 0) return 'Hai finito le colonie: trasformane una in città.';
    if (!setup && !V[v].edges.some(function (e) { return g.eown[e] === p; })) return 'Una colonia va costruita su un incrocio raggiunto da una tua strada.';
    return null;
  }
  function roadReach(g, p, e) {   // la strada tocca una tua colonia/città, o una tua strada senza passare sopra la colonia di un altro
    var ed = EDG[e];
    return [ed.a, ed.b].some(function (v) {
      var o = owner(g, v); if (o === p) return true; if (o != null) return false;
      return V[v].edges.some(function (x) { return x !== e && g.eown[x] === p; });
    });
  }
  function canRoad(g, p, e, setupFrom) {
    if (e == null || !EDG[e]) return 'Lato non valido.';
    if (g.eown[e] != null) return 'Qui c’è già una strada.';
    if (g.players[p].pieces.road <= 0) return 'Hai finito le strade (15).';
    if (setupFrom != null) return EDG[e].a === setupFrom || EDG[e].b === setupFrom ? null : 'Nella fondazione la strada va attaccata alla colonia appena piazzata.';
    if (!roadReach(g, p, e)) return 'La strada deve partire da una tua strada, colonia o città.';
    return null;
  }
  function canCity(g, p, v) {
    var o = g.vown[v];
    if (!o || o.p !== p || o.city) return 'La città si costruisce al posto di una tua colonia.';
    if (g.players[p].pieces.city <= 0) return 'Hai finito le città (4).';
    return null;
  }
  function legalSettles(g, p, setup) { var out = []; for (var v = 0; v < V.length; v++) if (!canSettle(g, p, v, setup)) out.push(v); return out; }
  function legalRoads(g, p, setupFrom) { var out = []; for (var e = 0; e < EDG.length; e++) if (!canRoad(g, p, e, setupFrom)) out.push(e); return out; }
  function legalCities(g, p) { var out = []; for (var v in g.vown) if (!canCity(g, p, +v)) out.push(+v); return out; }

  /* ---------- porti ---------- */
  function rates(g, p) {
    var r = {}; RES.forEach(function (k) { r[k] = 4; });
    g.harbors.forEach(function (h) {
      var ed = EDG[h.e]; if (owner(g, ed.a) !== p && owner(g, ed.b) !== p) return;
      if (h.k === '3') RES.forEach(function (k) { r[k] = Math.min(r[k], 3); }); else r[h.k] = 2;
    });
    return r;
  }

  /* ---------- strada più lunga ed esercito più grande ---------- */
  function roadLen(g, p) {
    var best = 0, used = {};
    function dfs(v, len) {
      if (len > best) best = len;
      var o = owner(g, v); if (len > 0 && o != null && o !== p) return;   // la colonia di un altro interrompe la strada
      V[v].edges.forEach(function (e) {
        if (g.eown[e] !== p || used[e]) return;
        used[e] = 1; dfs(EDG[e].a === v ? EDG[e].b : EDG[e].a, len + 1); used[e] = 0;
      });
    }
    var starts = {}; for (var e in g.eown) if (g.eown[e] === p) { starts[EDG[e].a] = 1; starts[EDG[e].b] = 1; }
    Object.keys(starts).forEach(function (v) { dfs(+v, 0); });
    return best;
  }
  function updateLongest(g) {
    var lens = g.players.map(function (P, i) { return roadLen(g, i); }); g.players.forEach(function (P, i) { P.road = lens[i]; });
    var max = Math.max.apply(null, lens), cur = g.lr, next;
    if (max < 5) next = null;
    else if (cur != null && lens[cur] === max) next = cur;
    else { var lead = lens.map(function (l, i) { return l === max ? i : -1; }).filter(function (i) { return i >= 0; }); next = lead.length === 1 ? lead[0] : null; }
    if (next !== cur) {
      g.lr = next;
      if (next != null) { log(g, nick(g, next) + ' ha la Strada più lunga (' + max + ' tratti): +2 punti.', 'lr', next); fx(g, { k: 'lr', p: next }); }
      else log(g, 'Nessuno ha più la Strada più lunga: la carta torna da parte.', 'lr');
    }
  }
  function updateArmy(g, p) {
    var k = g.players[p].knights;
    if (k >= 3 && g.la !== p && (g.la == null || k > g.players[g.la].knights)) { g.la = p; log(g, nick(g, p) + ' ha l’Esercito più grande (' + k + ' cavalieri): +2 punti.', 'la', p); fx(g, { k: 'la', p: p }); }
  }

  /* ---------- punti ---------- */
  function vpCards(P) { return P.devs.filter(function (d) { return d.k === 'vp'; }).length; }
  function visibleVP(g, p) {
    var n = 0; for (var v in g.vown) if (g.vown[v].p === p) n += g.vown[v].city ? 2 : 1;
    if (g.lr === p) n += 2; if (g.la === p) n += 2; return n;
  }
  function vp(g, p) { return visibleVP(g, p) + vpCards(g.players[p]); }
  function checkWin(g) {
    if (g.phase !== 'play' || g.stage === 'setup') return false;
    var p = g.turn; if (vp(g, p) < g.opts.vp) return false;
    g.phase = 'over'; g.stage = 'over'; g.winner = p; g.trade = null;
    var rows = g.players.map(function (P, i) {
      var s = 0, c = 0; for (var v in g.vown) if (g.vown[v].p === i) { if (g.vown[v].city) c++; else s++; }
      return { p: i, vp: vp(g, i), settle: s, city: c, lr: g.lr === i, la: g.la === i, vpc: vpCards(P), knights: P.knights, road: P.road };
    });
    var order = rows.slice().sort(function (a, b) { return (b.p === p) - (a.p === p) || b.vp - a.vp; }).map(function (r) { return r.p; });
    g.final = { order: order, rows: rows };
    log(g, nick(g, p) + ' arriva a ' + vp(g, p) + ' punti e vince la partita!', 'win', p); fx(g, { k: 'over', p: p });
    return true;
  }

  /* ---------- produzione ---------- */
  function produce(g, n) {
    var want = {}; RES.forEach(function (r) { want[r] = {}; });
    HX.forEach(function (h, hi) {
      var T = g.hex[hi]; if (T.n !== n || hi === g.robber) return;
      var r = D.TERR[T.t].r;
      h.v.forEach(function (v) { var o = g.vown[v]; if (!o) return; want[r][o.p] = (want[r][o.p] || 0) + (o.city ? 2 : 1); });
    });
    var gains = {}, short = [];
    RES.forEach(function (r) {
      var ps = Object.keys(want[r]), need = 0; ps.forEach(function (p) { need += want[r][p]; });
      if (!ps.length) return;
      if (need > g.bank[r]) {
        if (ps.length > 1) { short.push(D.RN[r]); return; }   // banca senza abbastanza carte: nessuno la riceve…
        want[r][ps[0]] = g.bank[r];                            // …tranne se a riceverla è uno solo: prende quel che resta
        short.push(D.RN[r]);
      }
      ps.forEach(function (p) { var k = want[r][p]; if (!k) return; g.players[p].res[r] += k; g.bank[r] -= k; (gains[p] = gains[p] || {})[r] = k; });
    });
    Object.keys(gains).forEach(function (p) { log(g, nick(g, +p) + ' riceve ' + resList(gains[p]) + '.', 'prod', +p); });
    if (!Object.keys(gains).length) log(g, 'Nessuno produce con il ' + n + '.', 'prod');
    if (short.length) log(g, 'Nella banca non c’è abbastanza ' + short.join(' e ') + ' per tutti.', 'sys');
    fx(g, { k: 'prod', n: n, gains: gains });
  }

  /* ---------- turni ---------- */
  function decider(g) {
    if (g.phase !== 'play') return null;
    if (g.stage === 'setup') return g.setup.order[g.setup.i];
    if (g.stage === 'discard') { for (var i = 0; i < g.players.length; i++) { var p = (g.turn + i) % g.players.length; if (g.discard[p]) return p; } return null; }
    return g.turn;
  }
  function mustDiscard(g, p) { return g.stage === 'discard' && g.discard && g.discard[p] ? g.discard[p] : 0; }
  function nextTurn(g) {
    g.trade = null; g.offers = 0; g.turn = (g.turn + 1) % g.players.length; g.turnN++; if (g.turn === g.first) g.round++;
    g.stage = 'roll'; g.rolled = false; g.devUsed = false; g.dice = null; g.free = 0;
    fx(g, { k: 'turn', p: g.turn });
    checkWin(g);   // chi è arrivato ai punti nel turno di un altro vince adesso
  }
  function canPlayDev(g, p, k) {
    var P = g.players[p];
    if (g.turn !== p || (g.stage !== 'roll' && g.stage !== 'main')) return 'Le carte sviluppo si giocano nel tuo turno.';
    if (k === 'vp') return 'Le carte Punto vittoria non si giocano: contano da sole.';
    if (g.devUsed) return 'Hai già giocato una carta sviluppo in questo turno.';
    var c = P.devs.filter(function (d) { return d.k === k; });
    if (!c.length) return 'Non hai questa carta.';
    if (!c.some(function (d) { return d.t < g.turnN; })) return 'Una carta comprata in questo turno si potrà giocare dal prossimo.';
    return null;
  }
  function useDev(g, p, k) { var P = g.players[p]; for (var i = 0; i < P.devs.length; i++) if (P.devs[i].k === k && P.devs[i].t < g.turnN) { P.devs.splice(i, 1); break; } g.devUsed = true; }
  function robberTargets(g, p) {   // tessere dove il ladro può andare (col «ladro gentile» non quelle di chi ha 2 punti o meno)
    var out = [];
    HX.forEach(function (h, hi) {
      if (hi === g.robber) return;
      if (g.opts.gentle && g.hex[hi].t !== 'desert' && h.v.some(function (v) { var o = owner(g, v); return o != null && o !== p && visibleVP(g, o) <= 2; })) return;
      out.push(hi);
    });
    if (!out.length) HX.forEach(function (h, hi) { if (hi !== g.robber) out.push(hi); });   // nessuna tessera ammessa: vale ogni tessera
    return out;
  }
  function victimsAt(g, p, hi) {
    var out = [];
    HX[hi].v.forEach(function (v) { var o = owner(g, v); if (o != null && o !== p && out.indexOf(o) < 0 && total(g.players[o].res) > 0) out.push(o); });
    return out;
  }
  function steal(g, p, from) {
    var V2 = g.players[from], pool = []; RES.forEach(function (r) { for (var i = 0; i < V2.res[r]; i++) pool.push(r); });
    if (!pool.length) return;
    var r = pool[Math.floor(rand() * pool.length)]; V2.res[r]--; g.players[p].res[r]++;
    log(g, nick(g, p) + ' ruba una carta a ' + nick(g, from) + '.', 'rob', p); fx(g, { k: 'steal', p: p, from: from, r: r });
  }
  function afterRobber(g) { g.stage = g.back || 'main'; g.back = null; g.victims = null; }

  /* ---------- azioni ---------- */
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase !== 'play') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    g.fx = [];
    var r = doAct(g, p, a);
    if (!r) { g.seq++; g.fxN++; if (g.turn === p || a.a === 'end') checkWin(g); }
    return r;
  }
  function doAct(g, p, a) {
    var P = g.players[p], err;
    // fondazione
    if (g.stage === 'setup') {
      if (decider(g) !== p) return 'Aspetta il tuo turno di fondazione.';
      var S = g.setup, second = S.i >= g.players.length;
      if (S.step === 'settle') {
        if (a.a !== 'settle') return 'Piazza prima una colonia.';
        if ((err = canSettle(g, p, a.v, true))) return err;
        g.vown[a.v] = { p: p, city: false }; P.pieces.settle--; S.last = a.v; S.step = 'road';
        fx(g, { k: 'build', what: 'settle', p: p, v: a.v });
        if (second) {
          var got = {}; V[a.v].hexes.forEach(function (hi) { var r = D.TERR[g.hex[hi].t].r; if (r && g.bank[r] > 0) { P.res[r]++; g.bank[r]--; got[r] = (got[r] || 0) + 1; } });
          log(g, nick(g, p) + ' piazza la seconda colonia e riceve ' + resList(got) + '.', 'build', p);
        } else log(g, nick(g, p) + ' piazza la prima colonia.', 'build', p);
        return null;
      }
      if (a.a !== 'road') return 'Ora piazza la strada attaccata alla colonia.';
      if ((err = canRoad(g, p, a.e, S.last))) return err;
      g.eown[a.e] = p; P.pieces.road--; fx(g, { k: 'build', what: 'road', p: p, e: a.e });
      S.i++; S.step = 'settle'; S.last = null;
      if (S.i >= S.order.length) {
        g.stage = 'roll'; g.turn = g.first; g.round = 1; updateLongest(g);
        log(g, 'Fondazione finita. Comincia ' + nick(g, g.turn) + ': tocca a lui lanciare i dadi.', 'sys'); fx(g, { k: 'turn', p: g.turn });
      }
      return null;
    }
    // scarto col 7: tocca a ognuno dei giocatori con più di 7 carte
    if (a.a === 'discard') {
      var need = mustDiscard(g, p); if (!need) return 'Non devi scartare.';
      var cnt = 0; for (var k in a.res) { if (RES.indexOf(k) < 0 || a.res[k] < 0 || a.res[k] !== Math.floor(a.res[k])) return 'Scarto non valido.'; cnt += a.res[k]; if (P.res[k] < a.res[k]) return 'Non hai quelle carte.'; }
      if (cnt !== need) return 'Devi scartare esattamente ' + need + ' carte.';
      for (var k2 in a.res) { P.res[k2] -= a.res[k2]; g.bank[k2] += a.res[k2]; }
      delete g.discard[p]; log(g, nick(g, p) + ' scarta ' + need + ' carte.', 'rob', p); fx(g, { k: 'discard', p: p, n: need });
      if (!Object.keys(g.discard).length) { g.discard = null; g.stage = 'robber'; }
      return null;
    }
    // da qui in poi: solo chi è di turno, tranne le risposte agli scambi
    if (a.a === 'respond') {
      var T = g.trade; if (!T || T.id !== a.id) return 'Questa proposta non c’è più.';
      if (p === g.turn) return 'È la tua proposta.';
      if (a.ok && !has(P.res, T.get)) return 'Non hai le carte richieste.';
      T.resp[p] = a.ok ? 'yes' : 'no'; fx(g, { k: 'resp', p: p, ok: !!a.ok });
      return null;
    }
    if (g.turn !== p) return 'Non è il tuo turno.';
    switch (a.a) {
      case 'roll': {
        if (g.stage !== 'roll') return g.rolled ? 'Hai già lanciato i dadi.' : 'Prima finisci quello che stai facendo.';
        var d1 = 1 + Math.floor(rand() * 6), d2 = 1 + Math.floor(rand() * 6), n = d1 + d2;
        g.dice = [d1, d2]; g.rolled = true; fx(g, { k: 'roll', d: [d1, d2], p: p });
        log(g, nick(g, p) + ' lancia i dadi: ' + n + '.', 'roll', p);
        if (n === 7) {
          g.discard = {}; g.players.forEach(function (Q, i) { var t = total(Q.res); if (t > 7) g.discard[i] = Math.floor(t / 2); });
          g.back = 'main';
          if (Object.keys(g.discard).length) { g.stage = 'discard'; log(g, 'Un 7! Chi ha più di 7 carte ne scarta metà, poi ' + nick(g, p) + ' sposta il ladro.', 'rob'); }
          else { g.discard = null; g.stage = 'robber'; log(g, 'Un 7! ' + nick(g, p) + ' sposta il ladro.', 'rob'); }
        } else { produce(g, n); g.stage = 'main'; }
        return null;
      }
      case 'robber': {
        if (g.stage !== 'robber') return 'Ora non puoi spostare il ladro.';
        var h = a.h; if (h == null || !HX[h]) return 'Tessera non valida.';
        if (h === g.robber) return 'Il ladro deve cambiare tessera.';
        if (robberTargets(g, p).indexOf(h) < 0) return 'Con il «ladro gentile» non si colpisce chi ha 2 punti o meno.';
        g.robber = h; var hn = D.TERR[g.hex[h].t].n + (g.hex[h].n ? ' (' + g.hex[h].n + ')' : '');
        log(g, nick(g, p) + ' sposta il ladro su ' + hn + '.', 'rob', p); fx(g, { k: 'robber', p: p, h: h });
        var vs = victimsAt(g, p, h).filter(function (o) { return !(g.opts.gentle && visibleVP(g, o) <= 2); });
        if (!vs.length) afterRobber(g);
        else if (vs.length === 1) { steal(g, p, vs[0]); afterRobber(g); }
        else { g.stage = 'steal'; g.victims = vs; }
        return null;
      }
      case 'steal': {
        if (g.stage !== 'steal') return 'Ora non puoi rubare.';
        if (g.victims.indexOf(a.from) < 0) return 'Puoi rubare solo a chi ha una costruzione su quella tessera.';
        steal(g, p, a.from); afterRobber(g); return null;
      }
      case 'build': {
        var free = g.stage === 'road2';
        if (!free && g.stage !== 'main') return g.stage === 'roll' ? 'Prima lancia i dadi.' : 'Prima finisci quello che stai facendo.';
        if (free && a.k !== 'road') return 'Con la carta costruisci solo strade.';
        if (a.k === 'road') {
          if (!free && !has(P.res, D.COST.road)) return 'Per una strada servono 1 argilla e 1 legname.';
          if ((err = canRoad(g, p, a.e))) return err;
          if (!free) pay(g, P, D.COST.road);
          g.eown[a.e] = p; P.pieces.road--; fx(g, { k: 'build', what: 'road', p: p, e: a.e });
          log(g, nick(g, p) + ' costruisce una strada' + (free ? ' (gratis)' : '') + '.', 'build', p);
          updateLongest(g);
          if (free) { g.free--; if (g.free <= 0 || !legalRoads(g, p).length) { g.free = 0; g.stage = g.back || 'main'; g.back = null; } }
          return null;
        }
        if (a.k === 'settle') {
          if (!has(P.res, D.COST.settle)) return 'Per una colonia servono argilla, legname, lana e grano.';
          if ((err = canSettle(g, p, a.v, false))) return err;
          pay(g, P, D.COST.settle); g.vown[a.v] = { p: p, city: false }; P.pieces.settle--;
          log(g, nick(g, p) + ' costruisce una colonia: +1 punto.', 'build', p); fx(g, { k: 'build', what: 'settle', p: p, v: a.v });
          updateLongest(g); return null;   // può spezzare la strada di un altro
        }
        if (a.k === 'city') {
          if (!has(P.res, D.COST.city)) return 'Per una città servono 3 minerale e 2 grano.';
          if ((err = canCity(g, p, a.v))) return err;
          pay(g, P, D.COST.city); g.vown[a.v].city = true; P.pieces.city--; P.pieces.settle++;
          log(g, nick(g, p) + ' trasforma una colonia in città: +1 punto.', 'build', p); fx(g, { k: 'build', what: 'city', p: p, v: a.v });
          return null;
        }
        if (a.k === 'dev') {
          if (!has(P.res, D.COST.dev)) return 'Per una carta sviluppo servono minerale, lana e grano.';
          if (!g.deck.length) return 'Le carte sviluppo sono finite.';
          pay(g, P, D.COST.dev); var c = g.deck.pop(); P.devs.push({ k: c, t: g.turnN });
          log(g, nick(g, p) + ' compra una carta sviluppo.', 'dev', p); fx(g, { k: 'buy', p: p, c: c });
          return null;
        }
        return 'Costruzione sconosciuta.';
      }
      case 'play': {
        if ((err = canPlayDev(g, p, a.k))) return err;
        if (g.stage === 'roll' && g.trade) g.trade = null;
        if (a.k === 'knight') {
          useDev(g, p, 'knight'); P.knights++; g.trade = null;
          log(g, nick(g, p) + ' gioca un Cavaliere e sposta il ladro.', 'dev', p); fx(g, { k: 'play', p: p, c: 'knight' });
          updateArmy(g, p); g.back = g.rolled ? 'main' : 'roll'; g.stage = 'robber'; return null;
        }
        if (a.k === 'road2') {
          if (!legalRoads(g, p).length) return 'Non hai posti dove costruire strade.';
          useDev(g, p, 'road2'); g.back = g.stage; g.stage = 'road2'; g.free = Math.min(2, P.pieces.road); g.trade = null;
          log(g, nick(g, p) + ' gioca Costruzione di strade: 2 strade gratis.', 'dev', p); fx(g, { k: 'play', p: p, c: 'road2' }); return null;
        }
        if (a.k === 'plenty') {
          var rs = a.rs; if (!Array.isArray(rs) || rs.length !== 2 || rs.some(function (x) { return RES.indexOf(x) < 0; })) return 'Scegli 2 risorse.';
          if (!rs.some(function (x) { return g.bank[x] > 0; })) return 'La banca non ha quelle risorse.';
          useDev(g, p, 'plenty'); var got2 = {};
          rs.forEach(function (x) { if (g.bank[x] > 0) { g.bank[x]--; P.res[x]++; got2[x] = (got2[x] || 0) + 1; } });
          log(g, nick(g, p) + ' gioca Invenzione e prende ' + resList(got2) + '.', 'dev', p); fx(g, { k: 'play', p: p, c: 'plenty' }); return null;
        }
        if (a.k === 'mono') {
          if (RES.indexOf(a.r) < 0) return 'Scegli una risorsa.';
          useDev(g, p, 'mono'); var tot = 0;
          g.players.forEach(function (Q, i) { if (i === p) return; tot += Q.res[a.r]; P.res[a.r] += Q.res[a.r]; Q.res[a.r] = 0; });
          log(g, nick(g, p) + ' gioca Monopolio: tutti gli danno il loro ' + D.RN[a.r] + ' (' + tot + ' carte).', 'dev', p); fx(g, { k: 'play', p: p, c: 'mono', r: a.r, n: tot }); return null;
        }
        return 'Carta sconosciuta.';
      }
      case 'bank': {
        if (g.stage !== 'main') return g.stage === 'roll' ? 'Si commercia dopo aver lanciato i dadi.' : 'Prima finisci quello che stai facendo.';
        var give = a.give, get = a.get;
        if (RES.indexOf(give) < 0 || RES.indexOf(get) < 0 || give === get) return 'Scambio non valido.';
        var rt = rates(g, p)[give];
        if (P.res[give] < rt) return 'Per questo scambio servono ' + rt + ' ' + D.RN[give] + '.';
        if (g.bank[get] <= 0) return 'Nella banca non c’è più ' + D.RN[get] + '.';
        P.res[give] -= rt; g.bank[give] += rt; P.res[get]++; g.bank[get]--;
        log(g, nick(g, p) + ' scambia con la banca ' + rt + ' ' + D.RN[give] + ' per 1 ' + D.RN[get] + '.', 'trade', p); fx(g, { k: 'bank', p: p });
        return null;
      }
      case 'offer': {
        if (g.stage !== 'main') return 'Si commercia dopo aver lanciato i dadi.';
        var gv = cleanRes(a.give), gt = cleanRes(a.get);
        if (!gv || !gt || !total(gv) || !total(gt)) return 'Indica cosa dai e cosa chiedi.';
        for (var x in gv) if (gt[x]) return 'Non si scambiano risorse uguali.';
        if (!has(P.res, gv)) return 'Non hai le carte che offri.';
        if (g.offers >= 12) return 'Basta proposte per questo turno.';
        g.trade = { id: ++g.tradeN, give: gv, get: gt, resp: {} }; g.offers++;
        log(g, nick(g, p) + ' propone: dà ' + resList(gv) + ', chiede ' + resList(gt) + '.', 'trade', p); fx(g, { k: 'offer', p: p });
        return null;
      }
      case 'deal': {
        var T2 = g.trade; if (!T2 || T2.id !== a.id) return 'Questa proposta non c’è più.';
        var o = a.with; if (T2.resp[o] !== 'yes') return 'Quel giocatore non ha accettato.';
        if (!has(P.res, T2.give)) return 'Non hai più le carte che offrivi.';
        if (!has(g.players[o].res, T2.get)) { T2.resp[o] = 'no'; return nick(g, o) + ' non ha più le carte richieste.'; }
        for (var k3 in T2.give) { P.res[k3] -= T2.give[k3]; g.players[o].res[k3] += T2.give[k3]; }
        for (var k4 in T2.get) { P.res[k4] += T2.get[k4]; g.players[o].res[k4] -= T2.get[k4]; }
        log(g, nick(g, p) + ' e ' + nick(g, o) + ' si scambiano ' + resList(T2.give) + ' contro ' + resList(T2.get) + '.', 'trade', p); fx(g, { k: 'trade', p: p, with: o });
        g.trade = null; return null;
      }
      case 'cancel': if (!g.trade) return 'Non c’è nessuna proposta.'; g.trade = null; fx(g, { k: 'cancel', p: p }); return null;
      case 'endroads': if (g.stage !== 'road2') return 'Non stai costruendo strade gratis.'; g.free = 0; g.stage = g.back || 'main'; g.back = null; return null;
      case 'end': {
        if (g.stage !== 'main') return g.stage === 'roll' ? 'Prima lancia i dadi.' : 'Prima finisci quello che stai facendo.';
        log(g, nick(g, p) + ' passa il turno.', 'turn', p);
        nextTurn(g); return null;
      }
    }
    return 'Mossa sconosciuta.';
  }
  function cleanRes(r) {
    if (!r || typeof r !== 'object') return null;
    var o = {}; for (var k in r) { if (RES.indexOf(k) < 0) return null; var n = +r[k]; if (n !== Math.floor(n) || n < 0 || n > 19) return null; if (n) o[k] = n; }
    return o;
  }

  return { newGame: newGame, act: act, decider: decider, setRandom: setRandom, makeIsland: makeIsland, fair: fair,
    canSettle: canSettle, canRoad: canRoad, canCity: canCity, legalSettles: legalSettles, legalRoads: legalRoads, legalCities: legalCities,
    rates: rates, roadLen: roadLen, vp: vp, visibleVP: visibleVP, vpCards: vpCards, total: total, has: has, emptyRes: emptyRes, owner: owner,
    canPlayDev: canPlayDev, robberTargets: robberTargets, victimsAt: victimsAt, mustDiscard: mustDiscard, distanceOk: distanceOk, resList: resList };
})();
if (typeof module !== 'undefined') module.exports = CTEngine;
