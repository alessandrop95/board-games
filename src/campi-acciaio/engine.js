/* ===== Campi d'Acciaio: motore delle regole (gira sull'host; stato in JSON) ===== */
var CAEngine = (function () {
  var D = CAData, F = D.FACTIONS;
  var CAP_POP = 18, CAP_PW = 16, MAX_DIAL = 7;

  /* ---------- geometria della mappa ---------- */
  var HEX = {}, KEYS = [];
  D.MAP.forEach(function (c) { var k = c[0] + ',' + c[1]; HEX[k] = { k: k, c: c[0], r: c[1], t: c[2], enc: !!c[3], tun: !!c[4], base: c[5] || null, riv: c[6] }; KEYS.push(k); });
  function nbKey(k, s) { var h = HEX[k], e = h.r % 2 === 0 ? 1 : 0; var d = [[e, -1], [1, 0], [e, 1], [e - 1, 1], [-1, 0], [e - 1, -1]][s]; var k2 = (h.c + d[0]) + ',' + (h.r + d[1]); return HEX[k2] ? k2 : null; }
  var NB = {}; KEYS.forEach(function (k) { NB[k] = []; for (var s = 0; s < 6; s++) { var k2 = nbKey(k, s); if (k2) NB[k].push({ k: k2, s: s, river: HEX[k].riv.indexOf(s) >= 0 }); } });
  var TERRITORIES = KEYS.filter(function (k) { return HEX[k].t !== 'H'; });
  var TUNNELS = KEYS.filter(function (k) { return HEX[k].tun; });
  var LAKES = KEYS.filter(function (k) { return HEX[k].t === 'L'; });
  var FACTORY_HEX = KEYS.filter(function (k) { return HEX[k].t === 'X'; })[0];
  function isTerr(k) { return HEX[k] && HEX[k].t !== 'H'; }
  function adjacent(a, b) { return NB[a].some(function (n) { return n.k === b; }); }

  /* ---------- utilità ---------- */
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function clamp(v, lo, hi) { return Math.max(lo, Math.min(hi, v)); }
  function fac(g, p) { return F[g.players[p].fac]; }
  function name(g, p) { return g.players[p].nick; }
  function log(g, t, k) { g.log.push({ n: ++g.logN, t: t, k: k == null ? 'sys' : k }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { g.fx.push(e); }
  function resWord(r, n) { return n + ' ' + D.RES[r].n; }
  function resList(o) { var a = []; D.RES_ORDER.forEach(function (r) { if (o[r]) a.push(resWord(r, o[r])); }); return a.join(', '); }

  /* ---------- abilità ---------- */
  function has(g, p, k) {
    var P = g.players[p], f = F[P.fac];
    if (f.ab.k === k) return true;
    for (var i = 0; i < P.mechs.length; i++) if (f.mechs[P.mechs[i]].k === k) return true;
    return false;
  }
  function riverTerr(g, p) { var P = g.players[p], f = F[P.fac]; return P.mechs.indexOf(0) >= 0 ? f.mechs[0].terr : []; }

  /* ---------- unità e controllo ---------- */
  function unitsAt(g, k) { return g.units.filter(function (u) { return u.h === k; }); }
  function unit(g, id) { for (var i = 0; i < g.units.length; i++) if (g.units[i].id === id) return g.units[i]; return null; }
  function myUnits(g, p, kind) { return g.units.filter(function (u) { return u.p === p && (!kind || kind.indexOf(u.k) >= 0); }); }
  function structAt(g, k) { for (var p = 0; p < g.players.length; p++) { var st = g.players[p].st; for (var s in st) if (st[s] === k) return { p: p, s: s }; } return null; }
  function controller(g, k) {
    if (!isTerr(k)) return -1;
    var us = unitsAt(g, k), ps = {};
    us.forEach(function (u) { ps[u.p] = 1; });
    var list = Object.keys(ps).map(Number);
    if (list.length === 1) return list[0];
    if (list.length > 1) return -2;      // battaglia in sospeso
    var s = structAt(g, k); return s ? s.p : -1;
  }
  function controlled(g, p) { return TERRITORIES.filter(function (k) { return controller(g, k) === p; }); }
  function resAt(g, k) { return g.res[k] || (g.res[k] = { f: 0, m: 0, w: 0, o: 0 }); }
  function resTotals(g, p) { var t = { f: 0, m: 0, w: 0, o: 0 }; controlled(g, p).forEach(function (k) { var r = g.res[k]; if (r) D.RES_ORDER.forEach(function (x) { t[x] += r[x]; }); }); return t; }
  function addRes(g, k, r) { var a = resAt(g, k); for (var x in r) a[x] += r[x]; }
  function workersOnBoard(g, p) { return myUnits(g, p, 'W').length; }
  function hero(g, p) { return myUnits(g, p, 'C')[0]; }
  function baseOf(g, p) { return fac(g, p).base; }
  function activeBases(g) { return g.players.map(function (P) { return F[P.fac].base; }); }
  function inactiveBases(g) { var act = activeBases(g); return KEYS.filter(function (k) { return HEX[k].t === 'H' && act.indexOf(k) < 0; }); }
  function mineOf(g, p) { return g.players[p].st.min; }
  function isTunnelFor(g, p, k) { return HEX[k].tun || mineOf(g, p) === k; }
  // Dove mettere le risorse guadagnate: territorio del personaggio se lo controlli, altrimenti uno con un tuo lavoratore
  function dropHex(g, p, prefer) {
    if (prefer && controller(g, prefer) === p && HEX[prefer].t !== 'L') return prefer;
    var h = hero(g, p); if (h && isTerr(h.h) && controller(g, h.h) === p && HEX[h.h].t !== 'L') return h.h;
    var ws = myUnits(g, p, 'W').filter(function (u) { return isTerr(u.h) && HEX[u.h].t !== 'L'; });
    if (ws.length) return ws[0].h;
    var c = controlled(g, p).filter(function (k) { return HEX[k].t !== 'L'; }); return c[0] || null;
  }

  /* ---------- risorse e pagamenti ---------- */
  function canPayRes(g, p, r, n, coerce) {
    var have = resTotals(g, p)[r] + (coerce && !g.players[p].coerced && has(g, p, 'coerce') && g.players[p].hand.length ? 1 : 0);
    return have >= n;
  }
  function payRes(g, p, r, n, coerce) {
    var P = g.players[p];
    if (coerce && n > 0 && !P.coerced && has(g, p, 'coerce') && P.hand.length && resTotals(g, p)[r] < n + 0) {
      // Requisizione: una carta combattimento (la più bassa) vale una risorsa
      var lo = P.hand.indexOf(Math.min.apply(null, P.hand)); g.discard.push(P.hand.splice(lo, 1)[0]); P.coerced = true; n--;
      log(g, name(g, p) + ' usa una carta combattimento al posto di 1 ' + D.RES[r].n + ' (Requisizione).', p);
    }
    var hexes = controlled(g, p).filter(function (k) { return g.res[k] && g.res[k][r] > 0; }).sort(function (a, b) { return g.res[b][r] - g.res[a][r]; });
    for (var i = 0; i < hexes.length && n > 0; i++) { var take = Math.min(n, g.res[hexes[i]][r]); g.res[hexes[i]][r] -= take; n -= take; fx(g, { k: 'spend', p: p, h: hexes[i], r: r, n: take }); }
    return n === 0;
  }
  function payAnyRes(g, p, n) { // paga n risorse qualsiasi, partendo dal tipo più abbondante
    for (var i = 0; i < n; i++) { var t = resTotals(g, p), best = null; D.RES_ORDER.forEach(function (r) { if (t[r] > 0 && (!best || t[r] > t[best])) best = r; }); if (!best) return false; payRes(g, p, best, 1); }
    return true;
  }
  function totalRes(g, p) { var t = resTotals(g, p); return t.f + t.m + t.w + t.o; }
  function canPay(g, p, cost) {
    var P = g.players[p]; cost = cost || {};
    if (cost.c && P.coins < cost.c) return false;
    if (cost.pop && P.pop < cost.pop) return false;
    if (cost.pw && P.power < cost.pw) return false;
    if (cost.cd && P.hand.length < cost.cd) return false;
    if (cost.ar && totalRes(g, p) < cost.ar) return false;
    return true;
  }
  function pay(g, p, cost) {
    var P = g.players[p]; cost = cost || {};
    if (cost.c) P.coins -= cost.c;
    if (cost.pop) P.pop -= cost.pop;
    if (cost.pw) P.power -= cost.pw;
    if (cost.cd) for (var i = 0; i < cost.cd; i++) { var lo = P.hand.indexOf(Math.min.apply(null, P.hand)); g.discard.push(P.hand.splice(lo, 1)[0]); }
    if (cost.ar) payAnyRes(g, p, cost.ar);
  }
  function drawCards(g, p, n) {
    var P = g.players[p];
    for (var i = 0; i < n; i++) {
      if (!g.cdeck.length) { g.cdeck = shuffle(g.discard); g.discard = []; }
      if (!g.cdeck.length) break;
      P.hand.push(g.cdeck.pop());
    }
  }
  function gainPop(g, p, n) { var P = g.players[p]; P.pop = clamp(P.pop + n, 0, CAP_POP); checkStars(g, p); }
  function gainPower(g, p, n) { var P = g.players[p]; P.power = clamp(P.power + n, 0, CAP_PW); checkStars(g, p); }
  function describeGain(gain) {
    var a = [];
    if (gain.c) a.push((gain.c > 0 ? '+' : '') + gain.c + (Math.abs(gain.c) === 1 ? ' moneta' : ' monete'));
    if (gain.pw) a.push('+' + gain.pw + ' potere'); if (gain.pop) a.push('+' + gain.pop + ' popolarità');
    if (gain.cd) a.push('+' + gain.cd + (gain.cd === 1 ? ' carta combattimento' : ' carte combattimento'));
    if (gain.r) a.push(resList(gain.r)); if (gain.ar) a.push(gain.ar + (gain.ar === 1 ? ' risorsa a scelta' : ' risorse a scelta'));
    if (gain.wk) a.push(gain.wk === 1 ? '1 lavoratore' : gain.wk + ' lavoratori');
    if (gain.mech) a.push('un mech gratis'); if (gain.st) a.push('una struttura gratis'); if (gain.up) a.push('un aggiornamento gratis'); if (gain.en) a.push('una recluta gratis');
    return a.join(', ');
  }
  function describeCost(cost) {
    var a = []; cost = cost || {};
    if (cost.c) a.push(cost.c + (cost.c === 1 ? ' moneta' : ' monete')); if (cost.pop) a.push(cost.pop + ' popolarità'); if (cost.pw) a.push(cost.pw + ' potere');
    if (cost.cd) a.push(cost.cd + (cost.cd === 1 ? ' carta combattimento' : ' carte combattimento')); if (cost.ar) a.push(cost.ar + ' risorse qualsiasi');
    return a.join(', ');
  }

  /* ---------- stelle ---------- */
  function starCount(g, p) { return g.players[p].stars.length; }
  function starLimit(g, p, k) { var dom = has(g, p, 'dominate'); if (k === 'co') return dom ? 99 : 2; if (k === 'ob') return dom ? 2 : 1; return 1; }
  function award(g, p, k) {
    var P = g.players[p];
    if (P.stars.length >= 6) return false;
    var n = P.stars.filter(function (s) { return s === k; }).length;
    if (n >= starLimit(g, p, k)) return false;
    P.stars.push(k); fx(g, { k: 'star', p: p, s: k });
    log(g, '★ ' + name(g, p) + ' conquista una stella: ' + D.STARS[k].n.toLowerCase() + ' (' + P.stars.length + '/6).', p);
    if (P.stars.length >= 6) g.ending = true;
    return true;
  }
  function checkStars(g, p) {
    var P = g.players[p];
    if (upCount(P) >= 6) award(g, p, 'up');
    if (P.mechs.length >= 4) award(g, p, 'me');
    if (structCount(P) >= 4) award(g, p, 'st');
    if (P.recruits.length >= 4) award(g, p, 're');
    if (workersOnBoard(g, p) >= 8) award(g, p, 'wo');
    if (P.pop >= CAP_POP) award(g, p, 'po');
    if (P.power >= CAP_PW) award(g, p, 'pw');
  }
  function upCount(P) { var n = 0; for (var k in P.ups) n += P.ups[k] ? 1 : 0; return n; }
  function structCount(P) { var n = 0; for (var k in P.st) if (P.st[k]) n++; return n; }

  /* ---------- nuova partita ---------- */
  function newGame(seats, opts) {
    opts = opts || {};
    var n = seats.length, facs, mats, tries = 0;
    do {
      facs = shuffle(D.FAC_ORDER.slice()).slice(0, n); mats = shuffle([1, 2, 3, 4, 5]).slice(0, n); tries++;
    } while (opts.ban !== false && tries < 200 && facs.some(function (f, i) { return D.BANNED.some(function (b) { return b[0] === f && b[1] === mats[i]; }); }));
    var players = seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, fac: facs[i], mat: mats[i] }; });
    players.sort(function (a, b) { return D.FAC_ORDER.indexOf(a.fac) - D.FAC_ORDER.indexOf(b.fac); });
    var g = { v: 1, seq: 0, phase: 'play', round: 1, turn: 0, players: [], units: [], res: {}, enc: KEYS.filter(function (k) { return HEX[k].enc; }),
      cdeck: shuffle(D.COMBAT.slice()), discard: [], edeck: shuffle(D.ENCOUNTERS.map(function (e, i) { return i; })), odeck: shuffle(D.OBJECTIVES.map(function (o) { return o.id; })),
      fdeck: shuffle(D.FACTORY.map(function (c) { return c.id; })).slice(0, n + 1), bonus: Math.floor(Math.random() * D.BONUS.length),
      ts: null, queue: [], pend: null, log: [], logN: 0, fx: [], fxN: 0, combatN: 0, lastCombat: null, opts: { ban: opts.ban !== false } };
    players.forEach(function (s, p) {
      var f = F[s.fac], m = D.MATS[s.mat];
      var P = { uid: s.uid, nick: s.nick, bot: s.bot, away: false, fac: s.fac, mat: s.mat, coins: m.coins, power: f.power, pop: m.pop, hand: [],
        obj: [g.odeck.pop(), g.odeck.pop()], objDone: [], ups: { mvU: 0, mvC: 0, bpP: 0, bpC: 0, trP: 0, prH: 0 }, red: [0, 0, 0, 0],
        mechs: [], recruits: [], once: [], st: { mon: null, mil: null, min: null, arm: null }, fcard: null, last: -1, stars: [], coerced: false, wk: 2 };
      g.players.push(P);
      drawCards(g, p, f.cards);
      g.units.push({ id: 'p' + p + 'C', p: p, k: 'C', h: f.base });
      var start = NB[f.base].filter(function (nb) { return !nb.river && HEX[nb.k].t !== 'L' && HEX[nb.k].t !== 'H'; });
      start.forEach(function (nb, i) { g.units.push({ id: 'p' + p + 'W' + i, p: p, k: 'W', h: nb.k }); });
    });
    var first = 0; g.players.forEach(function (P, i) { if (P.mat < g.players[first].mat) first = i; });
    g.turn = first; g.firstP = first;
    log(g, 'La partita comincia. Apre ' + g.players[first].nick + ' (' + F[g.players[first].fac].n + ').');
    startTurn(g);
    return g;
  }
  function startTurn(g) { g.ts = { p: g.turn, col: null, stage: 'pick', moved: [] }; g.players[g.turn].coerced = false; }

  /* ---------- colonne della plancia ---------- */
  function colTop(g, p, col) { return col === 4 ? 'factory' : D.MATS[g.players[p].mat].top[col]; }
  function bottomCost(g, p, col) { var m = D.MATS[g.players[p].mat]; return m.cost[col] - g.players[p].red[col]; }
  function colAllowed(g, p, col) {
    var P = g.players[p];
    if (col === 4 && P.fcard == null) return false;
    if (col === P.last && !has(g, p, 'relentless')) return false;
    return col >= 0 && col <= 4;
  }
  function produceCost(g, p) { var W = workersOnBoard(g, p), c = {}; if (W >= 4) c.pw = 1; if (W >= 6) c.pop = 1; if (W >= 8) c.c = 1; return c; }
  function topCost(g, p, top) {
    if (top === 'bolster' || top === 'trade') return { c: 1 };
    if (top === 'produce') return produceCost(g, p);
    if (top === 'factory') return D.FACTORY[g.players[p].fcard].cost;
    return {};
  }
  function moveCount(P) { return 2 + (P.ups.mvU ? 1 : 0); }
  function produceCount(P) { return 2 + (P.ups.prH ? 1 : 0); }

  /* ---------- movimento ---------- */
  function enemiesAt(g, p, k) { return unitsAt(g, k).filter(function (u) { return u.p !== p; }); }
  function fightersAt(g, p, k) { return enemiesAt(g, p, k).filter(function (u) { return u.k !== 'W'; }); }
  // passi possibili da k per un'unità (senza contare chi c'è nel territorio d'arrivo)
  function steps(g, p, u, k) {
    var out = {}, fighter = u.k !== 'W';
    var rt = fighter ? riverTerr(g, p) : [], sea = fighter && (has(g, p, 'sea') || has(g, p, 'sub')), swim = !fighter && has(g, p, 'swim');
    NB[k].forEach(function (nb) {
      var t = HEX[nb.k].t;
      if (t === 'H') return;
      if (t === 'L' && !sea) return;
      if (nb.river && !(swim && t !== 'L') && rt.indexOf(t) < 0) return;
      out[nb.k] = 1;
    });
    if (isTunnelFor(g, p, k)) { TUNNELS.forEach(function (t) { out[t] = 1; }); if (mineOf(g, p)) out[mineOf(g, p)] = 1; }
    if (fighter && has(g, p, 'under')) {
      var mount = function (x) { return HEX[x].t === 'M' && controller(g, x) === p; };
      if (isTunnelFor(g, p, k) || mount(k)) { TUNNELS.forEach(function (t) { out[t] = 1; }); TERRITORIES.forEach(function (x) { if (mount(x)) out[x] = 1; }); }
    }
    if (fighter && has(g, p, 'rail')) {
      var vil = function (x) { return HEX[x].t === 'V' && controller(g, x) === p; };
      if (k === FACTORY_HEX || vil(k)) { out[FACTORY_HEX] = 1; TERRITORIES.forEach(function (x) { if (vil(x)) out[x] = 1; }); }
    }
    if (fighter && has(g, p, 'sub') && HEX[k].t === 'L') LAKES.forEach(function (l) { out[l] = 1; });
    if (fighter && has(g, p, 'caravan')) { out[baseOf(g, p)] = 1; inactiveBases(g).forEach(function (b) { out[b] = 1; }); }
    delete out[k];
    return Object.keys(out);
  }
  // dove può arrivare un'unità in questa mossa: { hex: true }
  function moveTargets(g, p, uid, maxSteps) {
    var u = unit(g, uid); if (!u || u.p !== p) return {};
    var n = maxSteps || (u.k !== 'W' && has(g, p, 'speed') ? 2 : 1);
    var res = {}, frontier = [u.h], seen = {}; seen[u.h] = 1;
    for (var s = 0; s < n; s++) {
      var next = [];
      frontier.forEach(function (k) {
        steps(g, p, u, k).forEach(function (k2) {
          if (seen[k2]) return;
          var en = enemiesAt(g, p, k2);
          if (u.k === 'W' && en.length) return;                       // i lavoratori non entrano dove ci sono nemici
          if (HEX[k2].t === 'H' && !(u.k !== 'W' && has(g, p, 'caravan'))) return;
          seen[k2] = 1; res[k2] = true;
          var stop = en.length > 0 || (u.k === 'C' && g.enc.indexOf(k2) >= 0) || HEX[k2].t === 'H';
          if (!stop) next.push(k2);
        });
      });
      frontier = next;
    }
    return res;
  }
  // esegue una singola mossa (già validata); restituisce gli eventi da risolvere dopo
  function doMove(g, p, m, moved) {
    var u = unit(g, m.u), from = u.h;
    var carry = (m.carry || []).map(function (id) { return unit(g, id); }).filter(function (w) { return w && w.p === p && w.k === 'W' && w.h === from && moved.indexOf(w.id) < 0; });
    if (u.k !== 'M' || HEX[m.to].t === 'L' || HEX[m.to].t === 'H') carry = [];
    u.h = m.to; moved.push(u.id);
    carry.forEach(function (w) { w.h = m.to; moved.push(w.id); });
    fx(g, { k: 'move', id: u.id, from: from, to: m.to, carry: carry.map(function (w) { return w.id; }) });
    if (m.res && g.res[from] && isTerr(m.to) && HEX[m.to].t !== 'L') {
      var r = g.res[from], moving = { f: r.f, m: r.m, w: r.w, o: r.o };
      if (moving.f + moving.m + moving.w + moving.o > 0) { addRes(g, m.to, moving); g.res[from] = { f: 0, m: 0, w: 0, o: 0 }; fx(g, { k: 'carry', from: from, to: m.to }); }
    }
    // entrare dove ci sono solo lavoratori nemici: tornano alla loro base
    if (u.k !== 'W') {
      var en = enemiesAt(g, p, m.to);
      if (en.length && en.every(function (e) { return e.k === 'W'; })) {
        var byP = {};
        en.forEach(function (w) { byP[w.p] = (byP[w.p] || 0) + 1; var b = baseOf(g, w.p); fx(g, { k: 'retreat', id: w.id, from: w.h, to: b }); w.h = b; });
        var lost = en.length; g.players[p].pop = clamp(g.players[p].pop - lost, 0, CAP_POP);
        Object.keys(byP).forEach(function (q) { log(g, name(g, p) + ' caccia ' + (byP[q] === 1 ? 'un lavoratore' : byP[q] + ' lavoratori') + ' di ' + name(g, +q) + ': tornano alla base. −' + lost + ' popolarità.', p); });
      }
    }
    var tname = isTerr(m.to) ? D.TERR[HEX[m.to].t].n.toLowerCase() : 'base';
    log(g, name(g, p) + ' muove ' + unitName(g, u) + (carry.length ? ' (con ' + (carry.length === 1 ? 'un lavoratore' : carry.length + ' lavoratori') + ')' : '') + ' in ' + tname + '.', p);
  }
  function unitName(g, u) { return u.k === 'C' ? F[g.players[u.p].fac].hero : u.k === 'M' ? 'un mech' : 'un lavoratore'; }
  function validateMove(g, p, m, moved, maxSteps) {
    var u = unit(g, m.u);
    if (!u || u.p !== p) return 'Unità non valida.';
    if (moved.indexOf(u.id) >= 0) return 'Ogni unità si muove una sola volta per azione.';
    if (!moveTargets(g, p, u.id, maxSteps)[m.to]) return 'Quell’unità non può arrivare lì.';
    if (u.k === 'W' && m.carry && m.carry.length) return 'Solo i mech trasportano lavoratori.';
    return null;
  }
  function battleHexes(g, p) {
    var out = [];
    myUnits(g, p, 'CM').forEach(function (u) { if (isTerr(u.h) && fightersAt(g, p, u.h).length && out.indexOf(u.h) < 0) out.push(u.h); });
    return out;
  }
  function afterMoves(g, p) {
    var q = [];
    battleHexes(g, p).forEach(function (k) { q.push({ k: 'combat', h: k }); });
    q.push({ k: 'hero' });
    g.queue = q; next(g);
  }
  // risolve gli eventi in coda (battaglie, incontro, Fabbrica); quando la coda è vuota l'azione continua
  function next(g) {
    g.pend = null;
    while (g.queue.length && !g.pend) {
      var it = g.queue.shift(), p = g.ts.p;
      if (it.k === 'combat') startCombat(g, p, it.h);
      else if (it.k === 'hero') {
        var h = hero(g, p);
        if (h && g.enc.indexOf(h.h) >= 0 && fightersAt(g, p, h.h).length === 0) g.queue.unshift({ k: 'enc', h: h.h });
        if (h && h.h === FACTORY_HEX && g.players[p].fcard == null && g.fdeck.length) g.queue.push({ k: 'factory' });
      }
      else if (it.k === 'enc') startEncounter(g, p, it.h);
      else if (it.k === 'factory') g.pend = { k: 'factory', p: p, ids: g.fdeck.slice() };
    }
    if (!g.pend) afterTop(g);
  }
  function afterTop(g) {
    var ts = g.ts; if (!ts) return;
    if (ts.stage === 'topwait') ts.stage = 'bottom';
    else if (ts.stage === 'botwait') endTurn(g);
  }

  /* ---------- battaglia ---------- */
  function startCombat(g, a, k) {
    var defs = fightersAt(g, a, k); if (!defs.length) return;
    var d = defs[0].p, pre = [];
    var c = { k: 'combat', h: k, a: a, d: d, pick: { a: null, d: null }, pre: pre, id: ++g.combatN };
    [[a, d], [d, a]].forEach(function (pr) {
      var me = pr[0], op = pr[1];
      if (has(g, me, 'art') && g.players[me].power >= 1 && g.players[op].power > 0) { g.players[me].power -= 1; g.players[op].power = Math.max(0, g.players[op].power - 2); pre.push(name(g, me) + ' usa l’Artiglieria: paga 1 potere, ' + name(g, op) + ' ne perde 2.'); }
      if (has(g, me, 'scout') && g.players[op].hand.length) { var i = Math.floor(Math.random() * g.players[op].hand.length); g.players[me].hand.push(g.players[op].hand.splice(i, 1)[0]); pre.push(name(g, me) + ' manda gli Esploratori: ruba una carta combattimento a ' + name(g, op) + '.'); }
      if (has(g, me, 'sabot') && isTunnelFor(g, me, k) && g.players[op].power > 0) { g.players[op].power = Math.max(0, g.players[op].power - 2); pre.push(name(g, me) + ' sabota la galleria: ' + name(g, op) + ' perde 2 potere.'); }
    });
    pre.forEach(function (t) { log(g, t); });
    log(g, '⚔ Battaglia in ' + D.TERR[HEX[k].t].n.toLowerCase() + ': ' + name(g, a) + ' attacca ' + name(g, d) + '.');
    g.pend = c; fx(g, { k: 'battle', h: k, a: a, d: d });
  }
  function maxCards(g, p, k) {
    var n = unitsAt(g, k).filter(function (u) { return u.p === p && u.k !== 'W'; }).length;
    if (has(g, p, 'militia') && unitsAt(g, k).some(function (u) { return u.p === p && u.k === 'W'; })) n++;
    return Math.min(n, g.players[p].hand.length);
  }
  function maxDial(g, p) { return Math.min(MAX_DIAL, g.players[p].power); }
  function combatPick(g, p, a) {
    var c = g.pend, side = c.a === p ? 'a' : c.d === p ? 'd' : null;
    if (!side) return 'Non partecipi a questa battaglia.';
    if (c.pick[side]) return 'Hai già scelto.';
    var pw = Math.floor(+a.power || 0), cards = (a.cards || []).map(Number);
    if (pw < 0 || pw > maxDial(g, p)) return 'Puoi usare al massimo ' + maxDial(g, p) + ' potere.';
    if (cards.length > maxCards(g, p, c.h)) return 'Troppe carte per le tue unità in battaglia.';
    var hand = g.players[p].hand.slice(), vals = [];
    for (var i = 0; i < cards.length; i++) { var j = hand.indexOf(cards[i]); if (j < 0) return 'Non hai quella carta.'; vals.push(hand.splice(j, 1)[0]); }
    c.pick[side] = { power: pw, cards: vals };
    if (c.pick.a && c.pick.d) resolveCombat(g);
    return null;
  }
  function resolveCombat(g) {
    var c = g.pend, A = g.players[c.a], Dd = g.players[c.d];
    var ta = c.pick.a.power + c.pick.a.cards.reduce(function (s, v) { return s + v; }, 0);
    var td = c.pick.d.power + c.pick.d.cards.reduce(function (s, v) { return s + v; }, 0);
    var win = ta >= td ? c.a : c.d, lose = win === c.a ? c.d : c.a;
    [['a', A, c.a], ['d', Dd, c.d]].forEach(function (x) {
      var pk = c.pick[x[0]], P = x[1];
      P.power = Math.max(0, P.power - pk.power);
      pk.cards.forEach(function (v) { P.hand.splice(P.hand.indexOf(v), 1); g.discard.push(v); });
    });
    var losers = unitsAt(g, c.h).filter(function (u) { return u.p === lose; }), lostWorkers = losers.filter(function (u) { return u.k === 'W'; }).length;
    var b = baseOf(g, lose);
    losers.forEach(function (u) { fx(g, { k: 'retreat', id: u.id, from: u.h, to: b }); u.h = b; });
    var lp = c.pick[win === c.a ? 'd' : 'a'];
    if (lp.power > 0 || lp.cards.length) drawCards(g, lose, 1);
    var popLoss = 0;
    if (win === c.a && lostWorkers && !has(g, c.a, 'comrade')) { popLoss = lostWorkers; A.pop = Math.max(0, A.pop - lostWorkers); }
    g.lastCombat = { id: c.id, h: c.h, a: c.a, d: c.d, pa: c.pick.a, pd: c.pick.d, ta: ta, td: td, win: win, pre: c.pre, popLoss: popLoss, lostWorkers: lostWorkers };
    log(g, '⚔ ' + name(g, c.a) + ' ' + ta + ' contro ' + name(g, c.d) + ' ' + td + ': vince ' + name(g, win) + '. ' + name(g, lose) + ' si ritira alla base' + (popLoss ? '; ' + name(g, c.a) + ' perde ' + popLoss + ' popolarità per i lavoratori cacciati' : '') + '.', win);
    fx(g, { k: 'combatEnd', id: c.id, h: c.h, win: win });
    award(g, win, 'co');
    checkStars(g, c.a); checkStars(g, c.d);
    next(g);
  }

  /* ---------- incontri ---------- */
  function startEncounter(g, p, k) {
    g.enc.splice(g.enc.indexOf(k), 1);
    var card = g.edeck.shift(); g.edeck.push(card);
    g.pend = { k: 'enc', p: p, h: k, card: card, max: has(g, p, 'meander') ? 2 : 1 };
    fx(g, { k: 'enc', h: k, p: p });
    log(g, name(g, p) + ' trova un incontro: «' + D.ENCOUNTERS[card].n + '».', p);
  }
  function freeOk(g, p, k, gain, sub) {
    var P = g.players[p];
    if (gain.mech) { if (P.mechs.length >= 4) return 'Hai già schierato tutti i mech.'; if (sub.mech == null || P.mechs.indexOf(+sub.mech) >= 0 || +sub.mech < 0 || +sub.mech > 3) return 'Scegli quale mech schierare.'; }
    if (gain.st) { if (structCount(P) >= 4) return 'Hai già costruito tutte le strutture.'; if (structAt(g, k)) return 'In questo territorio c’è già una struttura.'; if (!sub.st || P.st[sub.st] !== null || !D.STRUCTS[sub.st]) return 'Scegli quale struttura costruire.'; }
    if (gain.up) { var e = upgradeErr(g, p, sub.up || {}); if (e) return e; }
    if (gain.en) { var e2 = enlistErr(g, p, sub.en || {}); if (e2) return e2; }
    if (gain.ar) { var tot = 0, ar = sub.ar || {}; for (var r in ar) { if (!D.RES[r] || ar[r] < 0) return 'Risorse non valide.'; tot += +ar[r]; } if (tot !== gain.ar) return 'Scegli ' + gain.ar + ' risorse.'; }
    if (gain.wk && P.wk >= 8) return null;
    return null;
  }
  function applyGain(g, p, gain, sub, k, why) {
    var P = g.players[p]; sub = sub || {}; k = k || dropHex(g, p);
    if (gain.c) P.coins += gain.c;
    if (gain.pw) gainPower(g, p, gain.pw);
    if (gain.pop) gainPop(g, p, gain.pop);
    if (gain.cd) drawCards(g, p, gain.cd);
    var drop = k && isTerr(k) && HEX[k].t !== 'L' ? k : dropHex(g, p);
    if (gain.r && drop) { addRes(g, drop, gain.r); fx(g, { k: 'gain', h: drop, r: gain.r }); }
    if (gain.ar && drop) { var ar = {}; for (var r in sub.ar) if (+sub.ar[r]) ar[r] = +sub.ar[r]; addRes(g, drop, ar); fx(g, { k: 'gain', h: drop, r: ar }); }
    if (gain.wk && drop) addWorkers(g, p, drop, gain.wk);
    if (gain.mech) doDeploy(g, p, +sub.mech, k, true);
    if (gain.st) doBuild(g, p, sub.st, k, true);
    if (gain.up) doUpgrade(g, p, sub.up.up, +sub.up.col, true);
    if (gain.en) doEnlist(g, p, +sub.en.col, sub.en.once, true);
    checkStars(g, p);
  }
  function addWorkers(g, p, k, n) {
    var P = g.players[p], added = 0;
    for (var i = 0; i < n && P.wk < 8; i++) { g.units.push({ id: 'p' + p + 'W' + P.wk, p: p, k: 'W', h: k }); P.wk++; added++; fx(g, { k: 'newWorker', id: 'p' + p + 'W' + (P.wk - 1), h: k }); }
    if (added) checkStars(g, p);
    return added;
  }
  function encounterAct(g, p, a) {
    var e = g.pend, card = D.ENCOUNTERS[e.card], opts = (a.opts || []).map(Number), sub = a.sub || {};
    if (!opts.length || opts.length > e.max) return e.max === 2 ? 'Scegli una o due opzioni.' : 'Scegli un’opzione.';
    if (opts.length === 2 && opts[0] === opts[1]) return 'Le due opzioni devono essere diverse.';
    // costi: si pagano in ordine, e il premio della prima può servire a pagare la seconda
    var sim = JSON.parse(JSON.stringify(g));
    for (var i = 0; i < opts.length; i++) {
      var o = card.o[opts[i]]; if (!o) return 'Opzione non valida.';
      if (!canPay(sim, p, o.cost)) return 'Non puoi pagare: ' + describeCost(o.cost) + '.';
      var er = freeOk(sim, p, e.h, o.gain, sub[i] || {}); if (er) return er;
      pay(sim, p, o.cost); applyGainQuiet(sim, p, o.gain, sub[i] || {}, e.h);
    }
    opts.forEach(function (oi, i) {
      var o = card.o[oi]; pay(g, p, o.cost); applyGain(g, p, o.gain, sub[i] || {}, e.h);
      log(g, name(g, p) + ' sceglie «' + o.t + '»' + (describeCost(o.cost) ? ' (paga ' + describeCost(o.cost) + ')' : '') + ': ' + describeGain(o.gain) + '.', p);
    });
    fx(g, { k: 'encDone', h: e.h, p: p });
    next(g);
    return null;
  }
  function applyGainQuiet(g, p, gain, sub, k) { var keepLog = g.log, keepFx = g.fx; g.log = []; g.fx = []; try { applyGain(g, p, gain, sub, k); } finally { g.log = keepLog; g.fx = keepFx; } }

  /* ---------- azioni in basso ---------- */
  function upgradeErr(g, p, s) {
    var P = g.players[p];
    if (!s.up || !D.UPS[s.up]) return 'Scegli quale azione in alto migliorare.';
    if (P.ups[s.up]) return 'Quel miglioramento è già fatto.';
    var col = +s.col, m = D.MATS[P.mat];
    if (!(col >= 0 && col <= 3)) return 'Scegli quale azione in basso rendere più economica.';
    if (P.red[col] >= m.cost[col] - m.min[col]) return 'Quell’azione in basso è già al costo minimo.';
    return null;
  }
  function enlistErr(g, p, s) {
    var P = g.players[p], col = +s.col;
    if (!(col >= 0 && col <= 3) || P.recruits.indexOf(col) >= 0) return 'Scegli una recluta ancora libera.';
    if (!D.ONCE[s.once] || P.once.indexOf(s.once) >= 0) return 'Scegli un bonus immediato ancora libero.';
    return null;
  }
  function doUpgrade(g, p, up, col, free) {
    var P = g.players[p]; P.ups[up] = 1; P.red[col]++;
    fx(g, { k: 'upgrade', p: p, up: up, col: col });
    log(g, name(g, p) + (free ? ' ottiene un aggiornamento: ' : ' aggiorna: ') + D.TOP[D.UPS[up].top].n + ' ' + D.UPS[up].n + ', ' + D.BOTTOM[col].n + ' costa 1 ' + D.RES[D.BOTTOM[col].res].n + ' in meno.', p);
    checkStars(g, p);
  }
  function doDeploy(g, p, mi, k, free) {
    var P = g.players[p]; P.mechs.push(mi);
    g.units.push({ id: 'p' + p + 'M' + mi, p: p, k: 'M', h: k });
    fx(g, { k: 'deploy', id: 'p' + p + 'M' + mi, h: k });
    log(g, name(g, p) + (free ? ' riceve un mech' : ' schiera un mech') + ' in ' + D.TERR[HEX[k].t].n.toLowerCase() + ': sblocca «' + fac(g, p).mechs[mi].n + '».', p);
    checkStars(g, p);
  }
  function doBuild(g, p, s, k, free) {
    var P = g.players[p]; P.st[s] = k;
    fx(g, { k: 'build', p: p, s: s, h: k });
    log(g, name(g, p) + (free ? ' ottiene ' : ' costruisce ') + 'un ' + D.STRUCTS[s].n.toLowerCase() + ' in ' + D.TERR[HEX[k].t].n.toLowerCase() + '.', p);
    checkStars(g, p);
  }
  function doEnlist(g, p, col, once, free) {
    var P = g.players[p]; P.recruits.push(col); P.once.push(once);
    log(g, name(g, p) + (free ? ' accoglie una recluta' : ' arruola una recluta') + ': ' + D.ONCE[once].n + ' subito, e ' + D.ONGOING[col].n + ' ogni volta che lui o i vicini fanno ' + D.BOTTOM[col].n + '.', p);
    if (once === 'pw2') gainPower(g, p, 2); else if (once === 'c2') P.coins += 2; else if (once === 'pop2') gainPop(g, p, 2); else drawCards(g, p, 2);
    fx(g, { k: 'enlist', p: p, col: col });
    checkStars(g, p);
  }
  function neighbors(g, p) { var n = g.players.length; if (n === 1) return []; var l = (p + n - 1) % n, r = (p + 1) % n; return l === r ? [l] : [l, r]; }
  function recruitBonus(g, p, col) {
    [p].concat(neighbors(g, p)).forEach(function (q) {
      if (g.players[q].recruits.indexOf(col) < 0) return;
      var k = D.ONGOING[col].k, P = g.players[q];
      if (k === 'pw') gainPower(g, q, 1); else if (k === 'c') P.coins += 1; else if (k === 'pop') gainPop(g, q, 1); else drawCards(g, q, 1);
      fx(g, { k: 'recruit', p: q, col: col });
      log(g, name(g, q) + ' riceve ' + D.ONGOING[col].n + ' dalla sua recluta' + (q === p ? '' : ' (' + name(g, p) + ' ha fatto ' + D.BOTTOM[col].n + ')') + '.', q);
    });
  }
  function bottomAct(g, p, a) {
    var ts = g.ts, col = ts.col, P = g.players[p], m = D.MATS[P.mat];
    var b = D.BOTTOM[col], cost = bottomCost(g, p, col);
    if (a.a !== b.k) return 'In questa colonna l’azione in basso è ' + b.n + '.';
    if (!canPayRes(g, p, b.res, cost, a.coerce)) return 'Ti servono ' + resWord(b.res, cost) + ' nei territori che controlli.';
    var err = null;
    if (b.k === 'upgrade') { if (upCount(P) >= 6) return 'Hai già fatto tutti gli aggiornamenti.'; err = upgradeErr(g, p, a); }
    if (b.k === 'deploy') {
      if (P.mechs.length >= 4) return 'Hai già schierato tutti i mech.';
      if (!(a.m >= 0 && a.m <= 3) || P.mechs.indexOf(+a.m) >= 0) return 'Scegli un mech ancora sulla plancia.';
      if (!deployHexes(g, p)[a.hex]) return 'Il mech va messo in un territorio dove hai un lavoratore (non un lago).';
    }
    if (b.k === 'build') {
      if (structCount(P) >= 4) return 'Hai già costruito tutte le strutture.';
      if (!D.STRUCTS[a.s] || P.st[a.s]) return 'Scegli una struttura ancora da costruire.';
      if (!buildHexes(g, p)[a.hex]) return 'La struttura va in un territorio con un tuo lavoratore, senza altre strutture (non un lago).';
    }
    if (b.k === 'enlist') { if (P.recruits.length >= 4) return 'Hai già arruolato tutte le reclute.'; err = enlistErr(g, p, a); }
    if (err) return err;
    payRes(g, p, b.res, cost, a.coerce);
    if (b.k === 'upgrade') doUpgrade(g, p, a.up, +a.col);
    if (b.k === 'deploy') doDeploy(g, p, +a.m, a.hex);
    if (b.k === 'build') doBuild(g, p, a.s, a.hex);
    if (b.k === 'enlist') doEnlist(g, p, +a.col, a.once);
    if (m.gain[col]) { P.coins += m.gain[col]; fx(g, { k: 'coins', p: p, n: m.gain[col] }); }
    recruitBonus(g, p, col);
    endTurn(g);
    return null;
  }
  function deployHexes(g, p) { var o = {}; myUnits(g, p, 'W').forEach(function (u) { if (isTerr(u.h) && HEX[u.h].t !== 'L') o[u.h] = true; }); return o; }
  function buildHexes(g, p) { var o = {}; myUnits(g, p, 'W').forEach(function (u) { if (isTerr(u.h) && HEX[u.h].t !== 'L' && !structAt(g, u.h) && controller(g, u.h) === p) o[u.h] = true; }); return o; }

  /* ---------- azioni in alto ---------- */
  function topAct(g, p, a) {
    var ts = g.ts, P = g.players[p], top = colTop(g, p, ts.col);
    if (a.a === 'skip') { ts.stage = 'bottom'; log(g, name(g, p) + ' salta l’azione in alto.', p); return null; }
    if (a.a !== top) return 'In questa colonna l’azione in alto è ' + (top === 'factory' ? 'la carta Fabbrica' : D.TOP[top].n) + '.';
    var cost = topCost(g, p, top);
    if (top === 'move') {
      if (a.coins) { var n = 1 + (P.ups.mvC ? 1 : 0); P.coins += n; fx(g, { k: 'coins', p: p, n: n }); log(g, name(g, p) + ' prende ' + n + (n === 1 ? ' moneta' : ' monete') + ' invece di muoversi.', p); ts.stage = 'bottom'; return null; }
      var moves = a.moves || [];
      if (!moves.length) return 'Scegli almeno un’unità da muovere.';
      if (moves.length > moveCount(P)) return 'Puoi muovere al massimo ' + moveCount(P) + ' unità.';
      var sim = JSON.parse(JSON.stringify(g)), moved = [];
      for (var i = 0; i < moves.length; i++) { var er = validateMove(sim, p, moves[i], moved); if (er) return er; doMove(sim, p, moves[i], moved); }
      moved = []; moves.forEach(function (m) { doMove(g, p, m, moved); });
      ts.stage = 'topwait'; afterMoves(g, p); return null;
    }
    if (!canPay(g, p, cost)) return 'Non puoi pagare: ' + describeCost(cost) + '.';
    if (top === 'bolster') {
      if (a.opt !== 'pw' && a.opt !== 'cd') return 'Scegli potere o carte.';
      pay(g, p, cost);
      if (a.opt === 'pw') gainPower(g, p, 2 + P.ups.bpP); else drawCards(g, p, 1 + P.ups.bpC);
      log(g, name(g, p) + ' rinforza: ' + (a.opt === 'pw' ? '+' + (2 + P.ups.bpP) + ' potere' : '+' + (1 + P.ups.bpC) + (P.ups.bpC ? ' carte combattimento' : ' carta combattimento')) + '.', p);
      if (P.st.mon) { gainPop(g, p, 1); log(g, 'Il monumento di ' + name(g, p) + ' porta +1 popolarità.', p); }
      fx(g, { k: 'bolster', p: p, opt: a.opt });
    } else if (top === 'trade') {
      if (a.opt === 'pop') { pay(g, p, cost); gainPop(g, p, 1 + P.ups.trP); log(g, name(g, p) + ' commercia per +' + (1 + P.ups.trP) + ' popolarità.', p); }
      else if (a.opt === 'res') {
        var r = a.r || {}, tot = 0; for (var x in r) { if (!D.RES[x] || r[x] < 0) return 'Risorse non valide.'; tot += +r[x]; }
        if (tot !== 2) return 'Scegli 2 risorse.';
        if (!myUnits(g, p, 'W').some(function (u) { return u.h === a.hex; }) || !isTerr(a.hex) || HEX[a.hex].t === 'L') return 'Le risorse vanno in un territorio con un tuo lavoratore.';
        pay(g, p, cost); var add = {}; for (var y in r) if (+r[y]) add[y] = +r[y]; addRes(g, a.hex, add); fx(g, { k: 'gain', h: a.hex, r: add });
        log(g, name(g, p) + ' commercia: ' + resList(add) + '.', p);
      } else return 'Scegli risorse o popolarità.';
      if (P.st.arm) { gainPower(g, p, 1); log(g, 'L’armeria di ' + name(g, p) + ' porta +1 potere.', p); }
    } else if (top === 'produce') {
      var hs = a.hexes || [], ok = produceHexes(g, p);
      if (!hs.length) return 'Scegli almeno un territorio.';
      if (hs.length > produceCount(P)) return 'Puoi scegliere al massimo ' + produceCount(P) + ' territori.';
      for (var j = 0; j < hs.length; j++) { if (!ok[hs[j]]) return 'Puoi produrre solo dove hai lavoratori (o il mulino).'; if (hs.indexOf(hs[j]) !== j) return 'Ogni territorio una volta sola.'; }
      pay(g, p, cost);
      var made = [];
      hs.forEach(function (k) {
        var n = myUnits(g, p, 'W').filter(function (u) { return u.h === k; }).length + (P.st.mil === k ? 1 : 0), t = HEX[k].t;
        if (t === 'V') { var nw = addWorkers(g, p, k, n); if (nw) made.push(nw + (nw === 1 ? ' lavoratore' : ' lavoratori')); }
        else { var rr = D.TERR[t].res, o = {}; o[rr] = n; addRes(g, k, o); fx(g, { k: 'gain', h: k, r: o }); made.push(resWord(rr, n)); }
      });
      log(g, name(g, p) + ' produce: ' + (made.join(', ') || 'niente') + (describeCost(cost) ? ' (paga ' + describeCost(cost) + ')' : '') + '.', p);
    } else if (top === 'factory') {
      var fc = D.FACTORY[P.fcard];
      if (fc.gain.up) { var ue = upgradeErr(g, p, a.sub && a.sub.up || {}); if (ue) return ue; if (upCount(P) >= 6) return 'Hai già fatto tutti gli aggiornamenti.'; }
      if (fc.gain.ar) { var ar = (a.sub && a.sub.ar) || {}, t2 = 0; for (var z in ar) t2 += +ar[z] || 0; if (t2 !== fc.gain.ar) return 'Scegli ' + fc.gain.ar + ' risorsa.'; }
      if (fc.gain.wk && !myUnits(g, p, 'W').length) return 'Ti serve almeno un lavoratore sulla mappa.';
      pay(g, p, cost);
      var dh = fc.gain.wk ? (myUnits(g, p, 'W').filter(function (u) { return isTerr(u.h) && HEX[u.h].t !== 'L'; })[0] || {}).h : null;
      applyGain(g, p, fc.gain, a.sub || {}, dh);
      log(g, name(g, p) + ' usa la carta Fabbrica «' + fc.n + '»: ' + describeGain(fc.gain) + '.', p);
    }
    ts.stage = 'bottom';
    return null;
  }
  function produceHexes(g, p) {
    var o = {}, P = g.players[p];
    myUnits(g, p, 'W').forEach(function (u) { if (isTerr(u.h) && D.TERR[HEX[u.h].t].res) o[u.h] = true; });
    if (P.st.mil && D.TERR[HEX[P.st.mil].t].res && controller(g, P.st.mil) === p) o[P.st.mil] = true;
    return o;
  }

  /* ---------- turno ---------- */
  function endTurn(g) {
    var p = g.ts.p, P = g.players[p];
    P.last = g.ts.col;
    if (g.ending) { finish(g); return; }
    g.turn = (g.turn + 1) % g.players.length;
    if (g.turn === g.firstP) g.round++;
    startTurn(g);
  }
  function objectiveMet(g, p, id) {
    var o = D.OBJECTIVES[id], P = g.players[p], ctrl = controlled(g, p), t = resTotals(g, p);
    switch (o.k) {
      case 'res': return t[o.r] >= o.v;
      case 'each': return D.RES_ORDER.every(function (r) { return t[r] >= o.v; });
      case 'riverT': return ctrl.filter(function (k) { return HEX[k].riv.length > 0; }).length >= o.v;
      case 'tunnels': return ctrl.filter(function (k) { return HEX[k].tun; }).length >= o.v;
      case 'terr': return ctrl.filter(function (k) { return o.t.indexOf(HEX[k].t) >= 0; }).length >= o.v;
      case 'popSt': return P.pop >= o.v && structCount(P) >= o.s;
      case 'powMe': return P.power >= o.v && P.mechs.length >= o.s;
      case 'cards': return P.hand.length >= o.v;
      case 'coins': return P.coins >= o.v;
      case 'ups': return upCount(P) >= o.v;
      case 'workers': return workersOnBoard(g, p) >= o.v;
      case 'spread': return ctrl.length >= o.v;
      case 'garrison': var h = hero(g, p); return !!h && isTerr(h.h) && myUnits(g, p, 'M').filter(function (u) { return u.h === h.h; }).length >= o.v;
      case 'factory': var h2 = hero(g, p); return !!h2 && h2.h === FACTORY_HEX && myUnits(g, p, 'M').some(function (u) { return adjacent(u.h, FACTORY_HEX); });
      case 'balance': return P.power === P.pop && P.power >= o.v;
      case 'emptyRes': return ctrl.length >= o.v && t.f + t.m + t.w + t.o === 0;
      case 'guarded': var n = 0; for (var s in P.st) if (P.st[s] && myUnits(g, p, 'W').some(function (u) { return u.h === P.st[s]; })) n++; return n >= o.v;
      case 'mechWork': var hx = {}; myUnits(g, p, 'M').forEach(function (u) { if (isTerr(u.h) && myUnits(g, p, 'W').some(function (w) { return w.h === u.h; })) hx[u.h] = 1; }); return Object.keys(hx).length >= o.v;
    }
    return false;
  }
  function canObjective(g, p) {
    var P = g.players[p];
    if (g.phase !== 'play' || g.pend || !g.ts || g.ts.p !== p || (g.ts.stage !== 'pick' && g.ts.stage !== 'bottom')) return [];
    if (P.stars.filter(function (s) { return s === 'ob'; }).length >= starLimit(g, p, 'ob')) return [];
    return P.obj.filter(function (id) { return P.objDone.indexOf(id) < 0 && objectiveMet(g, p, id); });
  }

  /* ---------- fine partita ---------- */
  function tierOf(pop) { for (var i = 0; i < D.TIERS.length; i++) if (pop <= D.TIERS[i].upto) return D.TIERS[i]; return D.TIERS[2]; }
  function bonusCount(g, p) {
    var B = D.BONUS[g.bonus], st = [], P = g.players[p]; for (var s in P.st) if (P.st[s]) st.push(P.st[s]);
    var adjSet = function (pred) { var o = {}; st.forEach(function (k) { NB[k].forEach(function (nb) { if (pred(nb.k)) o[nb.k] = 1; }); }); return Object.keys(o).length; };
    switch (B.k) {
      case 'adjLake': return adjSet(function (k) { return HEX[k].t === 'L'; });
      case 'adjTunnel': return adjSet(function (k) { return HEX[k].tun; });
      case 'adjEnc': return adjSet(function (k) { return HEX[k].enc; });
      case 'onTunnel': return st.filter(function (k) { return HEX[k].tun; }).length;
      case 'onFT': return st.filter(function (k) { return HEX[k].t === 'F' || HEX[k].t === 'T'; }).length;
      case 'row':
        var best = st.length ? 1 : 0;
        st.forEach(function (k) { [1, 2, 3].forEach(function (dir) { var n = 1, cur = k; for (;;) { var nx = nbKey(cur, dir); if (!nx || st.indexOf(nx) < 0) break; n++; cur = nx; } best = Math.max(best, n); }); });
        return best;
    }
    return 0;
  }
  function bonusCoins(g, p) { var B = D.BONUS[g.bonus], n = bonusCount(g, p), c = 0; B.tiers.forEach(function (t) { if (n >= t[0]) c = t[1]; }); return c; }
  function score(g) {
    return g.players.map(function (P, p) {
      var T = tierOf(P.pop), ctrl = controlled(g, p), terrN = ctrl.reduce(function (s, k) { return s + (k === FACTORY_HEX ? 3 : 1); }, 0), t = resTotals(g, p), resN = t.f + t.m + t.w + t.o;
      var o = { p: p, coins: P.coins, stars: P.stars.length, starC: P.stars.length * T.star, terr: terrN, terrC: terrN * T.terr, res: resN, resC: Math.floor(resN / 2) * T.res, bonusN: bonusCount(g, p), bonusC: bonusCoins(g, p), tier: T };
      o.total = o.coins + o.starC + o.terrC + o.resC + o.bonusC;
      o.tie = [workersOnBoard(g, p) + P.mechs.length + structCount(P), P.power, P.pop, resN, terrN, P.stars.length];
      return o;
    });
  }
  function finish(g) {
    var sc = score(g);
    sc.sort(function (a, b) { if (b.total !== a.total) return b.total - a.total; for (var i = 0; i < a.tie.length; i++) if (b.tie[i] !== a.tie[i]) return b.tie[i] - a.tie[i]; return 0; });
    g.final = sc; g.winner = sc[0].p; g.phase = 'over'; g.pend = null; g.ts = null;
    log(g, '🏁 La partita è finita. Vince ' + name(g, g.winner) + ' con ' + sc[0].total + ' monete.');
  }

  /* ---------- ingresso unico delle azioni ---------- */
  function act(g, p, a) {
    if (!a || g.phase !== 'play') return 'La partita non è in corso.';
    var keepFx = g.fx; g.fx = [];
    var err = act1(g, p, a);
    if (err) g.fx = keepFx;
    if (!err) { g.seq++; g.fxN++; if (g.ending && g.phase === 'play' && !g.pend && g.ts && (g.ts.stage === 'pick' || g.ts.stage === 'bottom')) finish(g); }
    return err;
  }
  function act1(g, p, a) {
    var pend = g.pend;
    if (pend) {
      if (pend.k === 'combat') { if (a.a !== 'combat') return 'C’è una battaglia da risolvere.'; return combatPick(g, p, a); }
      if (p !== pend.p) return 'Non tocca a te.';
      if (pend.k === 'enc') { if (a.a !== 'enc') return 'Scegli un’opzione dell’incontro.'; return encounterAct(g, p, a); }
      if (pend.k === 'factory') {
        if (a.a !== 'factory' || pend.ids.indexOf(+a.id) < 0) return 'Scegli una carta Fabbrica.';
        g.players[p].fcard = +a.id; g.fdeck.splice(g.fdeck.indexOf(+a.id), 1);
        log(g, name(g, p) + ' prende la carta Fabbrica «' + D.FACTORY[+a.id].n + '»: da ora ha una quinta colonna sulla plancia.', p);
        fx(g, { k: 'factory', p: p }); next(g); return null;
      }
    }
    var ts = g.ts;
    if (!ts || ts.p !== p) return 'Non è il tuo turno.';
    if (a.a === 'objective') {
      var ids = canObjective(g, p); if (ids.indexOf(+a.id) < 0) return 'Questo obiettivo non è ancora completato.';
      var P = g.players[p]; P.objDone.push(+a.id);
      log(g, name(g, p) + ' completa l’obiettivo «' + D.OBJECTIVES[+a.id].n + '».', p);
      award(g, p, 'ob');
      if (!has(g, p, 'dominate')) P.obj = P.obj.filter(function (id) { return id === +a.id; });
      fx(g, { k: 'objective', p: p, id: +a.id });
      return null;
    }
    if (ts.stage === 'pick') {
      if (a.a !== 'col') return 'Prima scegli una colonna della plancia.';
      if (!colAllowed(g, p, +a.col)) return +a.col === g.players[p].last ? 'Non puoi scegliere la stessa colonna del turno scorso.' : 'Colonna non disponibile.';
      ts.col = +a.col; ts.stage = 'top'; fx(g, { k: 'col', p: p, col: ts.col }); return null;
    }
    if (ts.stage === 'top') return topAct(g, p, a);
    if (ts.stage === 'bottom') {
      if (a.a === 'end') { log(g, name(g, p) + ' non fa l’azione in basso.', p); endTurn(g); return null; }
      if (ts.col === 4) {
        if (a.a !== 'fmove') return 'Con la carta Fabbrica l’azione in basso è «muovi 1 unità fino a 2 territori».';
        var m = a.move; if (!m) return 'Scegli un’unità.';
        var er = validateMove(g, p, m, [], 2); if (er) return er;
        doMove(g, p, m, [], 2); ts.stage = 'botwait'; afterMoves(g, p); return null;
      }
      return bottomAct(g, p, a);
    }
    return 'Azione non valida in questo momento.';
  }
  function decider(g) {
    if (!g || g.phase !== 'play') return null;
    if (g.pend) { if (g.pend.k === 'combat') return !g.pend.pick.a ? g.pend.a : !g.pend.pick.d ? g.pend.d : null; return g.pend.p; }
    return g.ts ? g.ts.p : null;
  }

  return { HEX: HEX, KEYS: KEYS, NB: NB, TERRITORIES: TERRITORIES, TUNNELS: TUNNELS, FACTORY_HEX: FACTORY_HEX, nbKey: nbKey, adjacent: adjacent, isTerr: isTerr,
    newGame: newGame, act: act, decider: decider, has: has, unit: unit, unitsAt: unitsAt, myUnits: myUnits, controller: controller, controlled: controlled, structAt: structAt,
    resTotals: resTotals, resAt: resAt, workersOnBoard: workersOnBoard, hero: hero, moveTargets: moveTargets, validateMove: validateMove, doMove: doMove, enemiesAt: enemiesAt, fightersAt: fightersAt,
    colTop: colTop, colAllowed: colAllowed, bottomCost: bottomCost, topCost: topCost, produceCost: produceCost, produceHexes: produceHexes, deployHexes: deployHexes, buildHexes: buildHexes,
    canPay: canPay, canPayRes: canPayRes, moveCount: moveCount, produceCount: produceCount, upCount: upCount, structCount: structCount, maxCards: maxCards, maxDial: maxDial,
    objectiveMet: objectiveMet, canObjective: canObjective, score: score, tierOf: tierOf, bonusCount: bonusCount, bonusCoins: bonusCoins, describeGain: describeGain, describeCost: describeCost,
    upgradeErr: upgradeErr, enlistErr: enlistErr, freeOk: freeOk, totalRes: totalRes, starLimit: starLimit, neighbors: neighbors, baseOf: baseOf, inactiveBases: inactiveBases, dropHex: dropHex, CAP_POP: CAP_POP, CAP_PW: CAP_PW };
})();
