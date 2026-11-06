/* ===== Motore di gioco: stato puro + azioni. Una sola scrittura alla volta (lease sul documento). =====
   Gioco base + espansioni facoltative: Dodge City (carte, carte verdi, personaggi, 8 giocatori),
   Mezzogiorno di Fuoco e Per un Pugno di Carte (eventi che cambiano le regole a ogni giro dello Sceriffo). */
var PPEngine = (function () {
  var D = (typeof PPData !== 'undefined') ? PPData : require('./data.js');
  var T = D.TYPES, CARDS = D.CARDS, EV = D.EVENTS;
  var WEAPONS = ['ripetitore', 'revolver', 'schioppo', 'carabina', 'bisonte'];
  var GREEN_MISS = ['bibbia', 'cappello', 'placca', 'sombrero'];
  var BLUE_ONE = ['candelotto', 'riparo', 'cavallo', 'cannocchiale', 'binocolo', 'rifugio'];

  function ty(id) { return CARDS[id].t; }
  function kind(id) { return T[ty(id)].kind; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nm(s, p) { return s.players[p].nick; }
  function log(s, txt, kind, extra) {
    var l = { n: ++s.logN, t: txt, k: kind || '' }; if (extra) for (var k in extra) l[k] = extra[k];
    s.log.push(l);
    if (s.log.length > 80) s.log.splice(0, s.log.length - 80);
  }
  function cardName(id) { return T[ty(id)].n; }
  function ev(s) { return s.ev ? s.ev.cur : null; }
  function evIs(s, k) { return !!s.ev && s.ev.cur === k; }

  /* ---------- abilità, semi, carte in gioco ---------- */
  // ha l'abilità del personaggio? (Vera Custer la copia; con la Sbornia nessuno ha abilità)
  function has(s, p, id) {
    var P = s.players[p]; if (!P || evIs(s, 'sbornia')) return false;
    return P.char === id || (P.char === 'vera' && P.copy === id);
  }
  function suit(s, id) { return evIs(s, 'benedizione') ? 'H' : evIs(s, 'maledizione') ? 'S' : CARDS[id].s; }
  // le carte in gioco davanti a "owner" hanno effetto? (Lazo: no per nessuno; Belle Star: nel suo turno non valgono quelle degli altri)
  function eqOn(s, owner) {
    if (evIs(s, 'lazo')) return false;
    if (s.phase === 'play' && owner !== s.turn && has(s, s.turn, 'belle')) return false;
    return true;
  }
  function hasEq(P, t) { for (var i = 0; i < P.eq.length; i++) if (ty(P.eq[i]) === t) return P.eq[i]; return null; }
  function eqA(s, p, t) { return eqOn(s, p) ? hasEq(s.players[p], t) : null; }
  function weapon(P) { for (var i = 0; i < P.eq.length; i++) if (WEAPONS.indexOf(ty(P.eq[i])) >= 0) return P.eq[i]; return null; }
  function rangeOf(s, p) { var P = s.players[p], w = eqOn(s, p) ? weapon(P) : null; return w != null ? T[ty(w)].w : 1; }
  function range(P) { var w = weapon(P); return w != null ? T[ty(w)].w : 1; }
  function inPlay(P) { return P.alive || P.ghost; }
  function aliveIdx(s) { var r = []; s.players.forEach(function (P, i) { if (P.alive) r.push(i); }); return r; }
  function aliveCount(s) { return s.players.filter(function (P) { return P.alive && !P.ghost; }).length; }
  function greenReady(s, id) { return s.green && s.green[id] != null && s.green[id] < s.turnN; }

  function distance(s, a, b) {
    if (a === b) return 0;
    var al = aliveIdx(s), ia = al.indexOf(a), ib = al.indexOf(b), n = al.length;
    if (ia < 0 || ib < 0) return 99;
    var d = Math.abs(ia - ib); d = Math.min(d, n - d);
    if (evIs(s, 'agguato')) d = 1;
    if (eqA(s, b, 'cavallo') != null) d++;
    if (eqA(s, b, 'rifugio') != null) d++;
    if (has(s, b, 'wren')) d++;
    if (eqA(s, a, 'cannocchiale') != null) d--;
    if (eqA(s, a, 'binocolo') != null) d--;
    if (has(s, a, 'maggie')) d--;
    return Math.max(1, d);
  }
  function step(s, p, dir) { var n = s.players.length; return ((p + dir) % n + n) % n; }
  function nextAlive(s, p) { var n = s.players.length; for (var k = 1; k <= n; k++) { var q = (p + k) % n; if (s.players[q].alive) return q; } return p; }

  /* ---------- mazzo ---------- */
  function drawCard(s) {
    if (!s.deck.length) {
      if (!s.disc.length) return null;
      var top = s.disc.pop();
      s.deck = shuffle(s.disc); s.disc = [top];
      log(s, 'Il mazzo è finito: si rimescolano gli scarti.', 'sys');
    }
    return s.deck.pop();
  }
  // pesca della fase 1: con la Miniera Abbandonata si pesca dagli scarti
  function drawPhaseCard(s) { if (evIs(s, 'miniera') && s.disc.length) return s.disc.pop(); return drawCard(s); }
  function give(s, p, n) { var P = s.players[p]; for (var i = 0; i < n; i++) { var c = drawCard(s); if (c == null) return; P.hand.push(c); } }
  function removeFrom(arr, id) { var i = arr.indexOf(id); if (i >= 0) { arr.splice(i, 1); return true; } return false; }
  function discardFromHand(s, p, id) { removeFrom(s.players[p].hand, id); s.disc.push(id); }
  function discardEq(s, p, id) { removeFrom(s.players[p].eq, id); s.disc.push(id); if (s.green) delete s.green[id]; }
  function heal(s, p, n) { var P = s.players[p]; if (P.ghost) return 0; var h = Math.min(P.max, P.hp + n) - P.hp; if (h > 0) P.hp += h; return h; }

  // "Estrai!": good(seme) dice quale risultato è favorevole; Lucky Duke sceglie tra due.
  function check(s, p, good, why) {
    var a = drawCard(s); if (a == null) return null;
    var pick = a;
    if (has(s, p, 'fortuna')) {
      var b = drawCard(s);
      if (b != null) { pick = good(suit(s, b), CARDS[b]) && !good(suit(s, a), CARDS[a]) ? b : a; s.disc.push(a === pick ? b : a); }
    }
    s.disc.push(pick);
    var C = CARDS[pick], su = suit(s, pick);
    log(s, nm(s, p) + ' estrae per ' + why + ': ' + C.r + D.SUITSYM[su] + '.', 'draw');
    s.flash = { kind: 'check', card: pick, p: p, n: s.logN };
    return { s: su, r: C.r, id: pick };
  }

  function damage(s, t, n, src) {
    var P = s.players[t]; if (!P.alive) return;
    if (P.ghost) { log(s, nm(s, t) + ' è un fantasma: il colpo gli passa attraverso.', 'miss'); return; }
    P.hp -= n;
    log(s, nm(s, t) + ' perde ' + (n > 1 ? n + ' punti vita' : '1 punto vita') + '.', 'hit');
    s.flash = { kind: 'hit', p: t, n: s.logN };
    for (var i = 0; i < n; i++) {
      if (has(s, t, 'thorne')) give(s, t, 1);
      if (has(s, t, 'cascabel') && src != null && src !== t && s.players[src].hand.length) {
        var H = s.players[src].hand, c = H[Math.floor(Math.random() * H.length)];
        removeFrom(H, c); P.hand.push(c);
        log(s, nm(s, t) + ' morde: ruba una carta a ' + nm(s, src) + '.', 'ab');
      }
    }
    if (P.hp <= 0) s.stack.push({ type: 'dying', who: t, killer: src });
  }

  function roleName(r) { return r === 'vice' ? 'un Vicesceriffo' : r === 'sceriffo' ? 'lo Sceriffo' : r === 'bandito' ? 'un Fuorilegge' : 'il Rinnegato'; }
  function die(s, t, killer) {
    var P = s.players[t];
    P.alive = false; P.hp = 0;
    s.deaths.push(t);
    log(s, nm(s, t) + ' è eliminato. Era ' + roleName(P.role) + '.', 'death');
    s.flash = { kind: 'death', p: t, n: s.logN };
    var all = P.hand.concat(P.eq); P.hand = []; P.eq = [];
    all.forEach(function (c) { if (s.green) delete s.green[c]; });
    var crowe = -1;
    s.players.forEach(function (Q, i) { if (Q.alive && !Q.ghost && has(s, i, 'crowe')) crowe = i; });
    if (crowe >= 0) { s.players[crowe].hand = s.players[crowe].hand.concat(all); if (all.length) log(s, nm(s, crowe) + ' si prende tutte le sue carte.', 'ab'); }
    else s.disc = s.disc.concat(all);
    s.players.forEach(function (Q, i) {
      if (!Q.alive || Q.ghost || i === t) return;
      if (has(s, i, 'greg') && heal(s, i, 2)) log(s, nm(s, i) + ' scava la fossa e recupera punti vita.', 'heal');
      if (has(s, i, 'herb')) { give(s, i, 2); log(s, nm(s, i) + ' riscuote: pesca 2 carte.', 'ab'); }
    });
    if (killer != null && killer !== t && s.players[killer].alive) {
      var K = s.players[killer];
      if (P.role === 'bandito') { give(s, killer, 3); log(s, nm(s, killer) + ' incassa la taglia: pesca 3 carte.', 'ab'); }
      if (P.role === 'vice' && K.role === 'sceriffo') {
        s.disc = s.disc.concat(K.hand, K.eq); K.eq.forEach(function (c) { if (s.green) delete s.green[c]; }); K.hand = []; K.eq = [];
        log(s, 'Lo Sceriffo ha ucciso il suo Vice: scarta tutte le sue carte.', 'ab');
      }
    }
    checkWin(s);
  }

  function checkWin(s) {
    if (s.phase === 'over') return;
    var sh = s.players.filter(function (P) { return P.role === 'sceriffo'; })[0];
    var al = s.players.filter(function (P) { return P.alive && !P.ghost; });
    var w = null;
    if (!sh.alive) w = (al.length === 1 && al[0].role === 'traditore') ? 'traditore' : 'banditi';
    else if (al.every(function (P) { return P.role === 'sceriffo' || P.role === 'vice'; })) w = 'legge';
    if (w) {
      s.phase = 'over'; s.winner = w; s.stack = [];
      var txt = w === 'legge' ? 'La legge trionfa: vincono lo Sceriffo e i suoi Vice!' : w === 'banditi' ? 'Lo Sceriffo è caduto: vincono i Fuorilegge!' : 'Il Rinnegato resta solo in piedi e vince!';
      log(s, txt, 'win');
    }
  }

  /* ---------- eventi ---------- */
  function revealEvent(s) {
    var E2 = s.ev; if (!E2) return;
    if (!E2.deck.length) return; // l'ultima carta resta fino alla fine
    var k = E2.deck.shift(); E2.cur = k; E2.pile.push(k);
    var X = EV[k];
    log(s, 'Nuovo evento: ' + X.n + ' — ' + X.s + '.', 'event', { ev: k });
    s.flash = { kind: 'event', ev: k, n: s.logN };
    s.dir = k === 'corsaoro' ? -1 : 1;
    var sh = s.players.map(function (P) { return P.role; }).indexOf('sceriffo');
    var order = [], q = sh; for (var i = 0; i < s.players.length; i++) { if (s.players[q].alive) order.push(q); q = step(s, q, 1); }
    if (k === 'dottore') {
      var min = Math.min.apply(null, order.map(function (i) { return s.players[i].hp; }));
      order.forEach(function (i) { if (s.players[i].hp === min && heal(s, i, 1)) log(s, 'Il Dottore cura ' + nm(s, i) + ': +1 punto vita.', 'heal'); });
    }
    if (k === 'dalton') {
      var qd = order.filter(function (i) { return s.players[i].eq.some(function (c) { return kind(c) === 'e'; }); });
      if (qd.length) s.stack.push({ type: 'dalton', queue: qd, who: qd[0] });
    }
    if (k === 'roulette') s.stack.push({ type: 'roulette', order: order, i: 0, who: order[0] });
  }

  function endOfTurnGhost(s, p) {
    var P = s.players[p];
    if (!P.ghost) return;
    s.disc = s.disc.concat(P.hand, P.eq); P.eq.forEach(function (c) { if (s.green) delete s.green[c]; });
    P.hand = []; P.eq = []; P.ghost = false; P.alive = false; P.hp = 0;
    log(s, nm(s, p) + ' torna nella tomba.', 'sys');
  }

  function nextTurn(s) {
    var cur = s.turn;
    endOfTurnGhost(s, cur);
    if (s.phase !== 'play') return;
    var nx = null;
    if (s.extraTurn === cur && s.players[cur].alive) { nx = cur; s.extraTurn = null; s.noVendetta = true; }
    else {
      s.noVendetta = false;
      var n = s.players.length, q = cur;
      for (var k = 0; k < n; k++) {
        q = step(s, q, s.dir || 1);
        var Q = s.players[q];
        if (Q.alive) { nx = q; break; }
        if (evIs(s, 'deadman') && !s.deadman && s.deaths[0] === q) { nx = q; break; }
        if (evIs(s, 'fantasma')) { nx = q; break; }
      }
      if (nx == null) nx = nextAlive(s, cur);
    }
    var N = s.players[nx];
    if (N.role === 'sceriffo' && nx !== cur) {
      s.round++;
      if (s.round >= 2 && s.ev) revealEvent(s);
    }
    if (!N.alive) {
      if (evIs(s, 'deadman') && !s.deadman && s.deaths[0] === nx) {
        s.deadman = true; N.alive = true; N.hp = 2; give(s, nx, 2);
        log(s, nm(s, nx) + ' torna dalla tomba con 2 punti vita e 2 carte!', 'ab');
      } else if (evIs(s, 'fantasma')) {
        N.alive = true; N.ghost = true; N.hp = 0;
        log(s, nm(s, nx) + ' torna come fantasma per un turno.', 'ab');
      }
    }
    s.turn = nx; s.turnN++;
    s.step = 'start'; s.bangs = 0; s.used = {}; s.must = null;
    log(s, 'Turno di ' + nm(s, nx) + '.', 'turn');
    // il turno parte sotto gli eventi appena scoperti (Dalton, Roulette): prima si risolvono quelli
    var evFrames = s.stack.splice(0, s.stack.length);
    s.stack.push({ type: 'turnStart', who: nx, stage: 0 });
    evFrames.forEach(function (f) { s.stack.push(f); });
  }

  /* ---------- opzioni di risposta (servono anche all'interfaccia) ---------- */
  function isBangLike(s, p, id) { var t = ty(id); return t === 'sparo' || (has(s, p, 'dolly') && (t === 'schivata')); }
  function isMissLike(s, p, id) { var t = ty(id); return t === 'schivata' || t === 'tuffo' || (has(s, p, 'dolly') && t === 'sparo') || has(s, p, 'elena'); }
  function canBeer(s, p, id) { return ty(id) === 'whisky' && aliveCount(s) > 2 && !evIs(s, 'reverendo'); }
  function canSave(s, p) {
    var P = s.players[p];
    return P.hand.some(function (c) { return canBeer(s, p, c); }) || (has(s, p, 'doc') && P.hand.length >= 2);
  }
  function greenMiss(s, p) {
    if (!eqOn(s, p)) return [];
    return s.players[p].eq.filter(function (c) { return GREEN_MISS.indexOf(ty(c)) >= 0 && greenReady(s, c); });
  }
  function barrels(s, t) { return (eqA(s, t, 'riparo') != null ? 1 : 0) + (has(s, t, 'padre') ? 1 : 0); }
  function frameOptions(s, f) {
    var P = s.players[f.who], o = { cards: [], green: [] };
    if (f.type === 'react') {
      if (f.kind === 'stampede') o.cards = P.hand.filter(function (c) { return isBangLike(s, f.who, c); });
      else { o.cards = P.hand.filter(function (c) { return isMissLike(s, f.who, c); }); o.green = greenMiss(s, f.who); o.barrel = f.barrels > 0; }
    } else if (f.type === 'roulette') { o.cards = P.hand.filter(function (c) { return isMissLike(s, f.who, c); }); o.green = greenMiss(s, f.who); }
    else if (f.type === 'duel') o.cards = P.hand.filter(function (c) { return isBangLike(s, f.who, c); });
    else if (f.type === 'dying') { o.cards = P.hand.filter(function (c) { return canBeer(s, f.who, c); }); o.doc = has(s, f.who, 'doc') && P.hand.length >= 2; }
    else if (f.type === 'dalton') o.cards = P.eq.filter(function (c) { return kind(c) === 'e'; });
    return o;
  }
  // Molly Stark: pesca quando gioca una carta dalla mano fuori dal suo turno (nel Duello, alla fine)
  function molly(s, p) {
    if (!has(s, p, 'molly') || s.turn === p) return;
    var duel = s.stack.filter(function (f) { return f.type === 'duel'; })[0];
    if (duel) { duel.molly = duel.molly || {}; duel.molly[p] = (duel.molly[p] || 0) + 1; return; }
    give(s, p, 1); log(s, nm(s, p) + ' è svelta: pesca una carta.', 'ab');
  }

  /* ---------- avanzamento automatico ---------- */
  function normalize(s) {
    if (s.phase !== 'play') return;
    s.players.forEach(function (P, i) {
      if (P.alive && has(s, i, 'clem') && P.hand.length === 0) {
        var c = drawCard(s); if (c != null) { P.hand.push(c); log(s, nm(s, i) + ' resta a mani vuote e pesca una carta.', 'ab'); }
      }
    });
  }
  function drawModes(s, p) {
    var P = s.players[p], m = [];
    if (evIs(s, 'peyote')) return m;
    if (has(s, p, 'nate') && s.players.some(function (Q, i) { return i !== p && Q.alive && Q.hand.length; })) m.push('player');
    if (has(s, p, 'gazza') && s.disc.length) m.push('discard');
    if (has(s, p, 'pat') && s.players.some(function (Q, i) { return i !== p && Q.alive && Q.eq.length; })) m.push('pat');
    if (evIs(s, 'liquoreforte') && P.hp < P.max) m.push('liquor');
    return m;
  }

  function advance(s) {
    var guard = 0;
    while (s.phase === 'play' && guard++ < 800) {
      normalize(s);
      if (s.phase !== 'play') break;
      var f = s.stack[s.stack.length - 1];
      if (!f) {
        if (!s.players[s.turn].alive) { nextTurn(s); continue; }
        if (s.step === 'draw') {
          if (evIs(s, 'peyote')) { s.step = 'play'; s.stack.push({ type: 'peyote', who: s.turn, got: 0 }); continue; }
          if (!drawModes(s, s.turn).length) { doDraw(s, s.turn, { mode: 'deck' }); continue; }
        }
        break;
      }
      if (f.type === 'multi') {
        if (!f.queue.length) { s.stack.pop(); continue; }
        var t = f.queue.shift();
        if (!s.players[t].alive) continue;
        if (f.diamond && has(s, t, 'apache') && t !== f.from) { log(s, nm(s, t) + ' non viene toccato: la carta è di Quadri.', 'miss'); continue; }
        var nf = { type: 'react', kind: f.kind, from: f.from, who: t, need: 1, got: 0, barrels: 0 };
        if (f.kind === 'mitraglia' || f.kind === 'sparo') nf.barrels = barrels(s, t);
        s.stack.push(nf); continue;
      }
      if (f.type === 'turnStart') {
        var p = f.who, Pp = s.players[p];
        if (!Pp.alive) { s.stack.pop(); continue; }
        if (f.stage === 0) {
          f.stage = 1;
          if (evIs(s, 'mezzogiorno') && !Pp.ghost) { log(s, 'Mezzogiorno di fuoco: ' + nm(s, p) + ' perde 1 punto vita.', 'event'); damage(s, p, 1, null); continue; }
          if (evIs(s, 'pugnocarte') && Pp.hand.length && !Pp.ghost) {
            log(s, 'Per un pugno di carte: ' + nm(s, p) + ' subisce ' + Pp.hand.length + ' Bang!.', 'event');
            var qq = []; for (var k = 0; k < Pp.hand.length; k++) qq.push(p);
            s.stack.push({ type: 'multi', kind: 'sparo', from: null, queue: qq }); continue;
          }
          continue;
        }
        if (f.stage === 1) {
          f.stage = 2;
          var dy = eqA(s, p, 'candelotto');
          if (dy != null) {
            var C = check(s, p, function (su, c) { return !(su === 'S' && ['2','3','4','5','6','7','8','9'].indexOf(c.r) >= 0); }, 'la Dinamite');
            if (C && C.s === 'S' && ['2','3','4','5','6','7','8','9'].indexOf(C.r) >= 0) {
              discardEq(s, p, dy);
              log(s, 'BOOM! La Dinamite esplode in mano a ' + nm(s, p) + '.', 'hit');
              damage(s, p, 3, null);
            } else {
              var q = nextAlive(s, p);
              removeFrom(Pp.eq, dy);
              if (q !== p && hasEq(s.players[q], 'candelotto') == null) { s.players[q].eq.push(dy); log(s, 'La Dinamite passa a ' + nm(s, q) + '.', 'sys'); }
              else s.disc.push(dy);
            }
          }
          continue;
        }
        if (f.stage === 2) {
          f.stage = 3;
          var jl = eqA(s, p, 'gattabuia');
          if (jl != null) {
            var J = check(s, p, function (su) { return su === 'H'; }, 'la Prigione');
            discardEq(s, p, jl);
            if (!J || J.s !== 'H') { log(s, nm(s, p) + ' resta in Prigione e salta il turno.', 'sys'); s.stack.pop(); nextTurn(s); continue; }
            log(s, nm(s, p) + ' esce di Prigione.', 'sys');
          }
          continue;
        }
        if (f.stage === 3) {
          f.stage = 4;
          if (evIs(s, 'fratelli') && Pp.hp > 1 && !Pp.ghost && s.players.some(function (Q, i) { return i !== p && Q.alive && !Q.ghost && Q.hp < Q.max; })) { s.stack.push({ type: 'blood', who: p }); continue; }
          continue;
        }
        if (f.stage === 4) {
          f.stage = 5;
          if (Pp.char === 'vera' && !evIs(s, 'sbornia')) {
            var opts = s.players.map(function (Q, i) { return i !== p && Q.alive && !Q.ghost && Q.char !== 'vera' ? Q.char : null; }).filter(function (x) { return x; });
            if (opts.length) { s.stack.push({ type: 'vera', who: p, opts: opts }); continue; }
          }
          continue;
        }
        s.stack.pop(); s.step = 'draw'; continue;
      }
      if (f.type === 'react' || f.type === 'duel') {
        if (!s.players[f.who].alive) { s.stack.pop(); continue; }
        var op = frameOptions(s, f);
        var needCards = f.type === 'react' && f.kind !== 'stampede' ? (f.need - f.got) : 1;
        if (!op.barrel && op.cards.length + op.green.length < needCards) { resolveTake(s, f); continue; }
        break;
      }
      if (f.type === 'roulette') {
        var ro = frameOptions(s, f);
        if (!s.players[f.who].alive) { f.i = (f.i + 1) % f.order.length; f.who = f.order[f.i]; continue; }
        if (!ro.cards.length && !ro.green.length) { s.stack.pop(); log(s, nm(s, f.who) + ' non ha Schivata!: la roulette spara.', 'hit'); damage(s, f.who, 2, null); continue; }
        break;
      }
      if (f.type === 'dalton') {
        while (f.queue.length && !s.players[f.queue[0]].eq.some(function (c) { return kind(c) === 'e'; })) f.queue.shift();
        if (!f.queue.length) { s.stack.pop(); continue; }
        f.who = f.queue[0];
        var blues = frameOptions(s, f).cards;
        if (blues.length === 1) { discardEq(s, f.who, blues[0]); log(s, 'I Dalton: ' + nm(s, f.who) + ' scarta ' + cardName(blues[0]) + '.', 'event'); f.queue.shift(); continue; }
        break;
      }
      if (f.type === 'dying') {
        if (s.players[f.who].hp > 0) {
          s.stack.pop();
          continue;
        }
        if (!canSave(s, f.who)) { s.stack.pop(); die(s, f.who, f.killer); continue; }
        break;
      }
      if (f.type === 'store') {
        if (!f.cards.length) { s.stack.pop(); continue; }
        while (f.i < f.order.length && !s.players[f.order[f.i]].alive) f.i++;
        if (f.i >= f.order.length) { s.disc = s.disc.concat(f.cards); f.cards = []; s.stack.pop(); continue; }
        f.who = f.order[f.i];
        if (f.cards.length === 1) { s.players[f.who].hand.push(f.cards[0]); log(s, nm(s, f.who) + ' prende l’ultima carta dell’Emporio.', 'sys'); f.cards = []; s.stack.pop(); continue; }
        break;
      }
      if (f.type === 'discard') {
        var Pd = s.players[f.who];
        if (Pd.ghost || Pd.hand.length <= handLimit(s, f.who)) { s.stack.pop(); nextTurn(s); continue; }
        f.n = Pd.hand.length - handLimit(s, f.who);
        break;
      }
      if (f.type === 'peyote' && !s.players[f.who].alive) { s.stack.pop(); continue; }
      break; // altri: serve una scelta
    }
  }
  function handLimit(s, p) { return has(s, p, 'sean') ? 10 : Math.max(s.players[p].hp, 0); }

  function resolveTake(s, f) {
    s.stack.pop();
    if (f.type === 'duel') {
      var other = f.who === f.a ? f.b : f.a; log(s, nm(s, f.who) + ' perde il Duello.', 'hit');
      if (f.molly) Object.keys(f.molly).forEach(function (k) { give(s, +k, f.molly[k]); log(s, nm(s, +k) + ' è svelta: pesca ' + f.molly[k] + (f.molly[k] > 1 ? ' carte.' : ' carta.'), 'ab'); });
      damage(s, f.who, 1, other); return;
    }
    if (f.kind === 'rimbalzo') {
      var Q = s.players[f.who];
      if (Q.eq.indexOf(f.target) >= 0) { discardEq(s, f.who, f.target); log(s, 'Il colpo di rimbalzo fa cadere ' + cardName(f.target) + ' a ' + nm(s, f.who) + '.', 'hit'); }
      return;
    }
    damage(s, f.who, 1, f.from);
  }

  /* ---------- fase 1: pesca ---------- */
  function drawCount(s, p) {
    var P = s.players[p], n = 2;
    if (P.ghost) n = 3;
    else if (has(s, p, 'pixie')) n = 3;
    else if (has(s, p, 'bill')) n = 1 + (P.max - Math.max(P.hp, 0));
    if (evIs(s, 'sete')) n--;
    if (evIs(s, 'treno')) n++;
    return Math.max(0, n);
  }
  function afterDraw(s, p, drawn) {
    s.step = 'play';
    if (evIs(s, 'leggewest') && drawn.length >= 2) {
      s.must = drawn[1];
      log(s, nm(s, p) + ' mostra la seconda carta: ' + cardName(drawn[1]) + ' (deve giocarla, se può).', 'event');
    }
    if (evIs(s, 'ranch') && s.players[p].hand.length) s.stack.push({ type: 'ranch', who: p });
  }
  function doDraw(s, p, a) {
    var P = s.players[p], n = drawCount(s, p), drawn = [], i, c;
    function take(src) { var x = src === 'deck' ? drawPhaseCard(s) : src; if (x != null) { P.hand.push(x); drawn.push(x); } return x; }
    if (a.mode === 'liquor' && evIs(s, 'liquoreforte')) {
      heal(s, p, 1); log(s, nm(s, p) + ' rinuncia a pescare e beve: +1 punto vita.', 'heal'); afterDraw(s, p, []); return;
    }
    if (a.mode === 'pat' && has(s, p, 'pat')) {
      var Q = s.players[a.target];
      if (Q && Q.alive && a.target !== p && Q.eq.indexOf(a.pick) >= 0) {
        removeFrom(Q.eq, a.pick); P.hand.push(a.pick); if (s.green) delete s.green[a.pick];
        log(s, nm(s, p) + ' prende ' + cardName(a.pick) + ' da davanti a ' + nm(s, a.target) + ' invece di pescare.', 'ab');
        afterDraw(s, p, []); return;
      }
    }
    if (has(s, p, 'hattie') && n > 0) {
      var many = []; for (i = 0; i < n + 1; i++) { c = drawPhaseCard(s); if (c != null) many.push(c); }
      s.step = 'play';
      if (many.length <= n) { P.hand = P.hand.concat(many); afterDraw(s, p, many); return; }
      s.stack.push({ type: 'kit', who: p, cards: many, keep: n });
      return;
    }
    if (a.mode === 'player' && has(s, p, 'nate')) {
      var Qn = s.players[a.target];
      if (Qn && Qn.alive && a.target !== p && Qn.hand.length) {
        var k = Qn.hand[Math.floor(Math.random() * Qn.hand.length)];
        removeFrom(Qn.hand, k); take(k); for (i = 1; i < n; i++) take('deck');
        log(s, nm(s, p) + ' sfila una carta dalla mano di ' + nm(s, a.target) + (n > 1 ? ' e pesca il resto.' : '.'), 'ab');
        afterDraw(s, p, drawn); return;
      }
    }
    if (a.mode === 'discard' && has(s, p, 'gazza') && s.disc.length) {
      var top = s.disc.pop(); take(top); for (i = 1; i < n; i++) take('deck');
      log(s, nm(s, p) + ' raccoglie ' + cardName(top) + ' dagli scarti' + (n > 1 ? ' e pesca il resto.' : '.'), 'ab');
      afterDraw(s, p, drawn); return;
    }
    for (i = 0; i < n; i++) take('deck');
    if (has(s, p, 'faro') && drawn.length >= 2) {
      var C = drawn[1], su = suit(s, C);
      log(s, nm(s, p) + ' mostra la seconda carta: ' + CARDS[C].r + D.SUITSYM[su] + '.', 'draw');
      if (su === 'H' || su === 'D') { take('deck'); log(s, 'Carta rossa: ' + nm(s, p) + ' ne pesca un’altra.', 'ab'); }
    }
    if (evIs(s, 'miniera')) log(s, nm(s, p) + ' pesca ' + drawn.length + (drawn.length === 1 ? ' carta' : ' carte') + ' dalla miniera degli scarti.', 'sys');
    afterDraw(s, p, drawn);
  }

  /* ---------- fase 2: giocare carte ---------- */
  function bangLimit(s, p) {
    var P = s.players[p], w = eqOn(s, p) ? weapon(P) : null;
    if (has(s, p, 'lark') || (w != null && ty(w) === 'ripetitore')) return 99;
    return evIs(s, 'sparatoria') ? 2 : 1;
  }
  function canPlayBang(s, p) { return s.bangs < bangLimit(s, p) && !(evIs(s, 'sermone') && s.turn === p); }
  function othersAlive(s, p) { return aliveIdx(s).filter(function (i) { return i !== p; }); }
  function hasCards(s, i) { return s.players[i].hand.length || s.players[i].eq.length; }
  function canPlace(s, p) { return !evIs(s, 'giudice'); }
  function myTurnFree(s, p) { return s.phase === 'play' && !s.stack.length && s.turn === p && s.step === 'play'; }

  function playInfo(s, p, id) {
    var P = s.players[p];
    if (!myTurnFree(s, p)) return { ok: false, why: 'Non è il momento di giocare carte.' };
    if (P.hand.indexOf(id) < 0) return { ok: false, why: 'Non hai questa carta.' };
    var t = ty(id), K = T[t], others = othersAlive(s, p), extra = !!K.extra;
    if (extra && P.hand.length < 2) return { ok: false, why: 'Per giocarla devi scartare anche un’altra carta: non ne hai.' };
    var asBang = t === 'sparo' || (t === 'schivata' && has(s, p, 'dolly'));
    if (asBang) {
      if (evIs(s, 'sermone')) return { ok: false, why: 'Sermone: nel tuo turno non puoi giocare Bang!.' };
      if (!canPlayBang(s, p)) return { ok: false, why: 'Hai già sparato in questo turno.' };
      var tg = others.filter(function (i) { return distance(s, p, i) <= rangeOf(s, p); });
      if (!tg.length) return { ok: false, why: 'Nessuno è a portata della tua arma.' };
      return { ok: true, targets: tg, as: 'sparo' };
    }
    if (K.kind === 'e' || K.kind === 'g') {
      if (!canPlace(s, p)) return { ok: false, why: 'Il Giudice: non si possono mettere carte in gioco.' };
      if (t === 'gattabuia') {
        var g = others.filter(function (i) { return s.players[i].role !== 'sceriffo' && hasEq(s.players[i], 'gattabuia') == null && !s.players[i].ghost; });
        return g.length ? { ok: true, targets: g } : { ok: false, why: 'Non c’è nessuno da mettere in Prigione.' };
      }
      if (WEAPONS.indexOf(t) >= 0) return { ok: true };
      var same = P.eq.some(function (c) { return cardName(c) === K.n; });
      return same ? { ok: false, why: 'Ne hai già una uguale in gioco.' } : { ok: true, extra: false };
    }
    switch (t) {
      case 'schivata': case 'tuffo': return { ok: false, why: 'Si gioca solo quando ti sparano.' };
      case 'whisky': case 'liquore':
        if (P.ghost) return { ok: false, why: 'Sei un fantasma: non puoi curarti.' };
        if (t === 'liquore') return P.hp >= P.max ? { ok: false, why: 'Hai già tutti i punti vita.' } : { ok: true, extra: true };
        if (evIs(s, 'reverendo')) return { ok: false, why: 'Il Reverendo: niente Birra finché resta in gioco.' };
        if (aliveCount(s) <= 2) return { ok: false, why: 'In due la Birra non ha effetto.' };
        if (P.hp >= P.max) return { ok: false, why: 'Hai già tutti i punti vita.' };
        return { ok: true };
      case 'tequila': {
        var tq = aliveIdx(s).filter(function (i) { return s.players[i].hp < s.players[i].max && !s.players[i].ghost; });
        return tq.length ? { ok: true, targets: tq, self: true, extra: true } : { ok: false, why: 'Nessuno ha punti vita da recuperare.' };
      }
      case 'giro': case 'posta': case 'cassaforte': case 'bottega': case 'stampede': case 'mitraglia': return { ok: true };
      case 'borseggio': {
        var b = others.filter(function (i) { return distance(s, p, i) <= 1 && hasCards(s, i); });
        return b.length ? { ok: true, targets: b, pick: true } : { ok: false, why: 'Nessuno a distanza 1 ha carte da rubare.' };
      }
      case 'ragtime': case 'sabotaggio': {
        var c = others.filter(function (i) { return hasCards(s, i); });
        return c.length ? { ok: true, targets: c, pick: true, extra: extra } : { ok: false, why: 'Nessuno ha carte.' };
      }
      case 'rissa': {
        var r = others.filter(function (i) { return hasCards(s, i); });
        return r.length ? { ok: true, rissa: r, extra: true } : { ok: false, why: 'Nessuno ha carte da scartare.' };
      }
      case 'pugno': {
        var pu = others.filter(function (i) { return distance(s, p, i) <= 1; });
        return pu.length ? { ok: true, targets: pu } : { ok: false, why: 'Nessuno è a distanza 1.' };
      }
      case 'springfield': return { ok: true, targets: others, extra: true };
      case 'sfida': return { ok: true, targets: others };
    }
    return { ok: false, why: 'Carta non giocabile.' };
  }
  // carte verdi in gioco: si usano nei turni successivi a quello in cui sono state messe
  function greenInfo(s, p, id) {
    var P = s.players[p];
    if (!myTurnFree(s, p)) return { ok: false, why: 'Le carte verdi si usano nel tuo turno.' };
    if (P.eq.indexOf(id) < 0 || kind(id) !== 'g') return { ok: false, why: 'Non è una tua carta verde in gioco.' };
    var t = ty(id);
    if (GREEN_MISS.indexOf(t) >= 0) return { ok: false, why: 'La userai quando ti sparano.' };
    if (!greenReady(s, id)) return { ok: false, why: 'L’hai messa in gioco in questo turno: potrai usarla dal prossimo.' };
    if (!eqOn(s, p)) return { ok: false, why: 'Lazo: le carte in gioco non hanno effetto.' };
    var others = othersAlive(s, p);
    switch (t) {
      case 'pugnale': case 'derringer': { var d = others.filter(function (i) { return distance(s, p, i) <= 1; }); return d.length ? { ok: true, targets: d } : { ok: false, why: 'Nessuno è a distanza 1.' }; }
      case 'pepperbox': { var pr = others.filter(function (i) { return distance(s, p, i) <= rangeOf(s, p); }); return pr.length ? { ok: true, targets: pr } : { ok: false, why: 'Nessuno a portata della tua arma.' }; }
      case 'fucile': return { ok: true, targets: others };
      case 'borraccia': return P.ghost || P.hp >= P.max ? { ok: false, why: 'Hai già tutti i punti vita.' } : { ok: true };
      case 'cancan': case 'conestoga': { var cc = others.filter(function (i) { return hasCards(s, i); }); return cc.length ? { ok: true, targets: cc, pick: true } : { ok: false, why: 'Nessuno ha carte.' }; }
      case 'ponyexpress': case 'howitzer': return { ok: true };
    }
    return { ok: false, why: 'Carta non utilizzabile.' };
  }

  function aggro(s, p, tg) { if (tg == null || tg === p) return; if (s.players[tg].role === 'sceriffo') s.aggro[p] += 2; else if (s.aggro[tg] > 0) s.aggro[p] -= 1; }
  // Apache Kid: le carte di Quadri giocate dagli altri non hanno effetto su di lui (fuori dai duelli)
  function apacheStops(s, p, tg, id) { return tg != null && tg !== p && has(s, tg, 'apache') && suit(s, id) === 'D'; }
  function attack(s, p, tg, kindName, need, label) {
    var Tg = s.players[tg];
    s.flash = { kind: 'bang', p: p, t: tg, n: s.logN };
    s.stack.push({ type: 'react', kind: kindName, from: p, who: tg, need: need || 1, got: 0, barrels: barrels(s, tg), label: label });
  }
  function stealOrDiscard(s, p, tg, pick, steal, label) {
    var Q = s.players[tg], take = null, fromHand = false;
    if (pick != null && Q.eq.indexOf(pick) >= 0) { take = pick; removeFrom(Q.eq, take); }
    else if (Q.hand.length) { take = Q.hand[Math.floor(Math.random() * Q.hand.length)]; removeFrom(Q.hand, take); fromHand = true; }
    else if (Q.eq.length) { take = Q.eq[0]; removeFrom(Q.eq, take); }
    if (take == null) return;
    if (s.green && s.green[take] != null) { if (steal) s.green[take] = s.turnN; else delete s.green[take]; }
    if (steal) { s.players[p].hand.push(take); if (s.green) delete s.green[take]; log(s, nm(s, p) + ' (' + label + ') ruba a ' + nm(s, tg) + (fromHand ? ' una carta dalla mano.' : ' ' + cardName(take) + '.'), 'play'); }
    else { s.disc.push(take); log(s, nm(s, p) + ' (' + label + ') fa scartare a ' + nm(s, tg) + ' ' + (fromHand ? 'una carta dalla mano' : cardName(take)) + '.', 'play'); }
  }
  function multiFrom(s, p, kindName, id) {
    var qq = [], r = nextAlive(s, p); while (r !== p) { qq.push(r); r = nextAlive(s, r); }
    s.stack.push({ type: 'multi', kind: kindName, from: p, queue: qq, diamond: suit(s, id) === 'D' });
  }

  function play(s, p, a) {
    var id = a.card, info = playInfo(s, p, id);
    if (!info.ok) return info.why;
    if (info.targets && info.targets.indexOf(a.target) < 0) return 'Bersaglio non valido.';
    var P = s.players[p], t = ty(id), tg = a.target, K = T[t];
    if (info.extra) {
      if (a.extra == null || a.extra === id || P.hand.indexOf(a.extra) < 0) return 'Scegli anche la carta da scartare insieme.';
    }
    if (tg != null && ['sparo','schivata','sfida','gattabuia','borseggio','sabotaggio','pugno','springfield','ragtime'].indexOf(t) >= 0) aggro(s, p, tg);
    if (info.as === 'sparo') {
      discardFromHand(s, p, id); s.bangs++;
      log(s, nm(s, p) + ' spara a ' + nm(s, tg) + (t === 'schivata' ? ' (con una Schivata!)' : '') + '.', 'bang');
      if (apacheStops(s, p, tg, id)) { log(s, 'La carta è di Quadri: ' + nm(s, tg) + ' non viene toccato.', 'miss'); return null; }
      attack(s, p, tg, 'sparo', has(s, p, 'abner') ? 2 : 1);
      return null;
    }
    if (K.kind === 'e' || K.kind === 'g') {
      removeFrom(P.hand, id);
      if (t === 'gattabuia') { s.players[tg].eq.push(id); log(s, nm(s, p) + ' mette in Prigione ' + nm(s, tg) + '.', 'play'); return null; }
      if (WEAPONS.indexOf(t) >= 0) { var w = weapon(P); if (w != null) discardEq(s, p, w); }
      P.eq.push(id);
      if (K.kind === 'g') s.green[id] = s.turnN;
      log(s, nm(s, p) + ' mette in gioco ' + K.n + (K.kind === 'g' ? ' (potrà usarla dal prossimo turno)' : '') + '.', 'play');
      return null;
    }
    if (info.extra) { discardFromHand(s, p, a.extra); }
    discardFromHand(s, p, id);
    s.flash = { kind: 'card', card: id, p: p, n: s.logN + 1 };
    var stop = apacheStops(s, p, tg, id);
    switch (t) {
      case 'whisky': { var hb = heal(s, p, has(s, p, 'tequilajoe') ? 2 : 1); log(s, nm(s, p) + ' beve una Birra: +' + hb + ' punti vita.', 'heal'); break; }
      case 'liquore': { var hl = heal(s, p, 2); log(s, nm(s, p) + ' beve un Whisky: +' + hl + ' punti vita.', 'heal'); break; }
      case 'tequila': if (stop) { log(s, nm(s, tg) + ' rifiuta la Tequila di Quadri.', 'miss'); break; } heal(s, tg, 1); log(s, nm(s, p) + ' offre una Tequila a ' + (tg === p ? 'se stesso' : nm(s, tg)) + ': +1 punto vita.', 'heal'); break;
      case 'giro': s.players.forEach(function (Q, i) { if (Q.alive && !Q.ghost) heal(s, i, 1); }); log(s, nm(s, p) + ' offre un giro al Saloon: tutti recuperano 1 punto vita.', 'heal'); break;
      case 'posta': give(s, p, 2); log(s, nm(s, p) + ' riceve la Diligenza: pesca 2 carte.', 'play'); break;
      case 'cassaforte': give(s, p, 3); log(s, nm(s, p) + ' svaligia la Wells Fargo: pesca 3 carte.', 'play'); break;
      case 'bottega': {
        var al = aliveIdx(s), cards = [];
        for (var i = 0; i < al.length; i++) { var c = drawCard(s); if (c != null) cards.push(c); }
        var order = []; var q = p; for (var j = 0; j < al.length; j++) { order.push(q); q = nextAlive(s, q); }
        log(s, nm(s, p) + ' apre l’Emporio: ' + cards.length + ' carte sul banco.', 'play');
        s.stack.push({ type: 'store', who: p, cards: cards, order: order, i: 0 });
        break;
      }
      case 'borseggio': case 'sabotaggio': case 'ragtime':
        if (stop) { log(s, nm(s, tg) + ' non viene toccato: la carta è di Quadri.', 'miss'); break; }
        stealOrDiscard(s, p, tg, a.pick, t !== 'sabotaggio', K.n); break;
      case 'rissa': {
        log(s, nm(s, p) + ' scatena una Rissa!', 'bang');
        info.rissa.forEach(function (i2) {
          if (apacheStops(s, p, i2, id)) { log(s, nm(s, i2) + ' resta fuori dalla Rissa (carta di Quadri).', 'miss'); return; }
          var pk = a.picks && a.picks[i2] != null ? a.picks[i2] : null;
          stealOrDiscard(s, p, i2, pk, false, 'Rissa');
        });
        break;
      }
      case 'sfida': log(s, nm(s, p) + ' sfida a Duello ' + nm(s, tg) + '.', 'bang'); s.stack.push({ type: 'duel', a: p, b: tg, who: tg }); break;
      case 'stampede': case 'mitraglia':
        log(s, t === 'stampede' ? nm(s, p) + ' scatena gli Indiani!' : nm(s, p) + ' apre il fuoco con la Catling!', 'bang');
        multiFrom(s, p, t, id); break;
      case 'pugno': case 'springfield':
        log(s, nm(s, p) + (t === 'pugno' ? ' tira un Pugno a ' : ' imbraccia lo Springfield contro ') + nm(s, tg) + '.', 'bang');
        if (stop) { log(s, 'La carta è di Quadri: ' + nm(s, tg) + ' non viene toccato.', 'miss'); break; }
        attack(s, p, tg, 'colpo', 1); break;
    }
    return null;
  }

  function useGreen(s, p, a) {
    var id = a.card, info = greenInfo(s, p, id);
    if (!info.ok) return info.why;
    if (info.targets && info.targets.indexOf(a.target) < 0) return 'Bersaglio non valido.';
    var t = ty(id), tg = a.target, K = T[t];
    discardEq(s, p, id);
    aggro(s, p, tg);
    s.flash = { kind: 'card', card: id, p: p, n: s.logN + 1 };
    var stop = apacheStops(s, p, tg, id);
    switch (t) {
      case 'pugnale': case 'derringer': case 'pepperbox': case 'fucile':
        log(s, nm(s, p) + ' usa ' + K.n + ' contro ' + nm(s, tg) + '.', 'bang');
        if (t === 'derringer') give(s, p, 1);
        if (stop) { log(s, 'La carta è di Quadri: ' + nm(s, tg) + ' non viene toccato.', 'miss'); break; }
        attack(s, p, tg, 'colpo', 1); break;
      case 'borraccia': heal(s, p, 1); log(s, nm(s, p) + ' beve dalla Borraccia: +1 punto vita.', 'heal'); break;
      case 'ponyexpress': give(s, p, 3); log(s, nm(s, p) + ' riceve il Pony Express: pesca 3 carte.', 'play'); break;
      case 'howitzer': log(s, nm(s, p) + ' fa fuoco con l’Obice!', 'bang'); multiFrom(s, p, 'mitraglia', id); break;
      case 'cancan': case 'conestoga':
        if (stop) { log(s, nm(s, tg) + ' non viene toccato: la carta è di Quadri.', 'miss'); break; }
        stealOrDiscard(s, p, tg, a.pick, t === 'conestoga', K.n); break;
    }
    return null;
  }

  // abilità attive dei personaggi di Dodge City
  function abilityInfo(s, p, k) {
    var P = s.players[p];
    if (!myTurnFree(s, p)) return { ok: false, why: 'Si usa nel tuo turno.' };
    if (k === 'chuck') { if (!has(s, p, 'chuck')) return { ok: false, why: 'Abilità non disponibile.' }; return P.hp > 1 ? { ok: true } : { ok: false, why: 'Non puoi perdere l’ultimo punto vita.' }; }
    if (k === 'docholy') {
      if (!has(s, p, 'docholy')) return { ok: false, why: 'Abilità non disponibile.' };
      if (s.used.docholy) return { ok: false, why: 'Già usata in questo turno.' };
      if (P.hand.length < 2) return { ok: false, why: 'Servono 2 carte da scartare.' };
      var tg = othersAlive(s, p).filter(function (i) { return distance(s, p, i) <= rangeOf(s, p); });
      return tg.length ? { ok: true, targets: tg } : { ok: false, why: 'Nessuno a portata.' };
    }
    if (k === 'jose') {
      if (!has(s, p, 'jose')) return { ok: false, why: 'Abilità non disponibile.' };
      if ((s.used.jose || 0) >= 2) return { ok: false, why: 'Già usata due volte in questo turno.' };
      return P.hand.some(function (c) { return kind(c) === 'e'; }) ? { ok: true } : { ok: false, why: 'Non hai carte blu in mano.' };
    }
    return { ok: false, why: 'Abilità sconosciuta.' };
  }
  function ability(s, p, a) {
    var info = abilityInfo(s, p, a.k), P = s.players[p];
    if (!info.ok) return info.why;
    if (a.k === 'chuck') { log(s, nm(s, p) + ' si sacrifica: perde 1 punto vita e pesca 2 carte.', 'ab'); P.hp--; s.flash = { kind: 'hit', p: p, n: s.logN }; give(s, p, 2); return null; }
    if (a.k === 'jose') {
      if (P.hand.indexOf(a.card) < 0 || kind(a.card) !== 'e') return 'Scegli una carta blu dalla mano.';
      discardFromHand(s, p, a.card); give(s, p, 2); s.used.jose = (s.used.jose || 0) + 1;
      log(s, nm(s, p) + ' scarta ' + cardName(a.card) + ' e pesca 2 carte.', 'ab'); return null;
    }
    if (a.k === 'docholy') {
      var cs = a.cards || [];
      if (cs.length !== 2 || cs[0] === cs[1] || P.hand.indexOf(cs[0]) < 0 || P.hand.indexOf(cs[1]) < 0) return 'Scegli 2 carte da scartare.';
      if (info.targets.indexOf(a.target) < 0) return 'Bersaglio non valido.';
      discardFromHand(s, p, cs[0]); discardFromHand(s, p, cs[1]); s.used.docholy = true; aggro(s, p, a.target);
      log(s, nm(s, p) + ' scarta 2 carte e spara a ' + nm(s, a.target) + '.', 'bang');
      if (has(s, a.target, 'apache') && suit(s, cs[0]) === 'D' && suit(s, cs[1]) === 'D') { log(s, 'Tutte di Quadri: ' + nm(s, a.target) + ' non viene toccato.', 'miss'); return null; }
      attack(s, p, a.target, 'colpo', 1); return null;
    }
    return 'Abilità sconosciuta.';
  }
  // Cecchino: due Bang! insieme, servono due Schivata!
  function sniperInfo(s, p) {
    if (!evIs(s, 'cecchino')) return { ok: false, why: 'Serve l’evento Cecchino.' };
    if (!myTurnFree(s, p)) return { ok: false, why: 'Non è il momento.' };
    if (!canPlayBang(s, p)) return { ok: false, why: 'Hai già sparato in questo turno.' };
    var bangs = s.players[p].hand.filter(function (c) { return isBangLike(s, p, c); });
    if (bangs.length < 2) return { ok: false, why: 'Servono 2 Bang!.' };
    var tg = othersAlive(s, p).filter(function (i) { return distance(s, p, i) <= rangeOf(s, p); });
    return tg.length ? { ok: true, targets: tg, bangs: bangs } : { ok: false, why: 'Nessuno a portata.' };
  }
  function sniper(s, p, a) {
    var info = sniperInfo(s, p); if (!info.ok) return info.why;
    var cs = a.cards || [];
    if (cs.length !== 2 || cs[0] === cs[1] || info.bangs.indexOf(cs[0]) < 0 || info.bangs.indexOf(cs[1]) < 0) return 'Scegli 2 Bang!.';
    if (info.targets.indexOf(a.target) < 0) return 'Bersaglio non valido.';
    discardFromHand(s, p, cs[0]); discardFromHand(s, p, cs[1]); s.bangs++; aggro(s, p, a.target);
    log(s, nm(s, p) + ' prende la mira da cecchino contro ' + nm(s, a.target) + ': servono 2 Schivata!.', 'bang');
    attack(s, p, a.target, 'sparo', 2); return null;
  }
  // Rimbalzo: Bang! contro una carta in gioco
  function ricochetInfo(s, p) {
    if (!evIs(s, 'rimbalzo')) return { ok: false, why: 'Serve l’evento Rimbalzo.' };
    if (!myTurnFree(s, p)) return { ok: false, why: 'Non è il momento.' };
    var bangs = s.players[p].hand.filter(function (c) { return isBangLike(s, p, c); });
    if (!bangs.length) return { ok: false, why: 'Serve un Bang!.' };
    var tg = othersAlive(s, p).filter(function (i) { return s.players[i].eq.length; });
    return tg.length ? { ok: true, targets: tg, bangs: bangs } : { ok: false, why: 'Nessuno ha carte in gioco.' };
  }
  function ricochet(s, p, a) {
    var info = ricochetInfo(s, p); if (!info.ok) return info.why;
    if (info.bangs.indexOf(a.card) < 0) return 'Serve un Bang!.';
    if (info.targets.indexOf(a.target) < 0 || s.players[a.target].eq.indexOf(a.pick) < 0) return 'Scegli una carta in gioco.';
    discardFromHand(s, p, a.card);
    log(s, nm(s, p) + ' spara di rimbalzo a ' + cardName(a.pick) + ' di ' + nm(s, a.target) + '.', 'bang');
    s.flash = { kind: 'bang', p: p, t: a.target, n: s.logN };
    s.stack.push({ type: 'react', kind: 'rimbalzo', from: p, who: a.target, need: 1, got: 0, barrels: 0, target: a.pick });
    return null;
  }

  /* ---------- risposte ---------- */
  function respond(s, p, a) {
    var f = s.stack[s.stack.length - 1];
    if (!f || f.who !== p) return 'Non tocca a te rispondere.';
    var P = s.players[p];
    if (f.type === 'react') {
      if (a.r === 'take') { resolveTake(s, f); return null; }
      if (a.r === 'barrel') {
        if (f.kind === 'stampede' || f.kind === 'rimbalzo') return 'Il Barile qui non serve.';
        if (f.barrels <= 0) return 'Nessun Barile disponibile.';
        f.barrels--;
        var C = check(s, p, function (su) { return su === 'H'; }, 'il Barile');
        if (C && C.s === 'H') { f.got++; log(s, nm(s, p) + ' si ripara dietro al Barile: colpo deviato.', 'miss'); }
        if (f.got >= f.need) s.stack.pop();
        return null;
      }
      if (a.r === 'green') {
        if (f.kind === 'stampede' || greenMiss(s, p).indexOf(a.card) < 0) return 'Carta non valida.';
        discardEq(s, p, a.card); f.got++;
        log(s, nm(s, p) + ' usa ' + cardName(a.card) + ' per schivare.', 'miss');
        if (ty(a.card) === 'bibbia') give(s, p, 1);
        if (f.got >= f.need) s.stack.pop();
        return null;
      }
      if (a.r === 'card') {
        var ok = f.kind === 'stampede' ? isBangLike(s, p, a.card) : isMissLike(s, p, a.card);
        if (P.hand.indexOf(a.card) < 0 || !ok) return 'Carta non valida.';
        discardFromHand(s, p, a.card);
        molly(s, p);
        if (f.kind === 'stampede') { log(s, nm(s, p) + ' risponde agli Indiani con un Bang!.', 'miss'); s.stack.pop(); return null; }
        f.got++; log(s, nm(s, p) + ' gioca ' + cardName(a.card) + ' per schivare.', 'miss');
        if (ty(a.card) === 'tuffo') give(s, p, 1);
        if (f.got >= f.need) s.stack.pop();
        return null;
      }
    }
    if (f.type === 'roulette') {
      if (a.r === 'take') { s.stack.pop(); log(s, nm(s, p) + ' non schiva: la roulette spara.', 'hit'); damage(s, p, 2, null); return null; }
      var okc = a.r === 'card' ? P.hand.indexOf(a.card) >= 0 && isMissLike(s, p, a.card) : a.r === 'green' ? greenMiss(s, p).indexOf(a.card) >= 0 : false;
      if (!okc) return 'Carta non valida.';
      if (a.r === 'card') { discardFromHand(s, p, a.card); molly(s, p); if (ty(a.card) === 'tuffo') give(s, p, 1); } else { discardEq(s, p, a.card); if (ty(a.card) === 'bibbia') give(s, p, 1); }
      log(s, nm(s, p) + ' scarta ' + cardName(a.card) + ': il tamburo gira.', 'miss');
      f.i = (f.i + 1) % f.order.length; f.who = f.order[f.i];
      return null;
    }
    if (f.type === 'duel') {
      if (a.r === 'take') { resolveTake(s, f); return null; }
      if (a.r === 'card') {
        if (P.hand.indexOf(a.card) < 0 || !isBangLike(s, p, a.card)) return 'Carta non valida.';
        discardFromHand(s, p, a.card); molly(s, p);
        log(s, nm(s, p) + ' risponde al Duello con ' + cardName(a.card) + '.', 'bang');
        f.who = f.who === f.a ? f.b : f.a;
        return null;
      }
    }
    if (f.type === 'dying') {
      if (a.r === 'die') { s.stack.pop(); die(s, p, f.killer); return null; }
      if (a.r === 'card') {
        if (P.hand.indexOf(a.card) < 0 || !canBeer(s, p, a.card)) return 'Carta non valida.';
        discardFromHand(s, p, a.card); heal(s, p, has(s, p, 'tequilajoe') ? 2 : 1); log(s, nm(s, p) + ' si salva con una Birra!', 'heal');
        molly(s, p);
        return null;
      }
      if (a.r === 'doc') return docHeal(s, p, a.cards);
    }
    if (f.type === 'store' && a.r === 'pick') {
      if (f.cards.indexOf(a.card) < 0) return 'Carta non disponibile.';
      removeFrom(f.cards, a.card); P.hand.push(a.card); f.i++;
      log(s, nm(s, p) + ' sceglie ' + cardName(a.card) + ' dall’Emporio.', 'sys');
      return null;
    }
    if (f.type === 'kit' && a.r === 'keep') {
      var k = a.cards || [], need = f.keep || 2;
      if (k.length !== need || k.some(function (c, i) { return f.cards.indexOf(c) < 0 || k.indexOf(c) !== i; })) return 'Scegli ' + need + ' carte.';
      var back = f.cards.filter(function (c) { return k.indexOf(c) < 0; });
      k.forEach(function (c) { P.hand.push(c); }); back.forEach(function (c) { s.deck.push(c); }); s.stack.pop();
      log(s, nm(s, p) + ' tiene ' + need + ' carte e rimette l’altra sul mazzo.', 'ab');
      afterDraw(s, p, k);
      return null;
    }
    if (f.type === 'discard' && a.r === 'discard') {
      var cs = a.cards || [];
      if (cs.length !== f.n) return 'Devi scartare ' + f.n + (f.n > 1 ? ' carte.' : ' carta.');
      for (var i = 0; i < cs.length; i++) if (P.hand.indexOf(cs[i]) < 0 || cs.indexOf(cs[i]) !== i) return 'Carta non valida.';
      cs.forEach(function (c) { removeFrom(P.hand, c); if (evIs(s, 'miniera')) s.deck.push(c); else s.disc.push(c); });
      log(s, nm(s, p) + ' scarta ' + cs.length + (cs.length > 1 ? ' carte' : ' carta') + (evIs(s, 'miniera') ? ' in cima al mazzo.' : ' a fine turno.'), 'sys');
      return null;
    }
    if (f.type === 'vera' && a.r === 'vera') {
      if (f.opts.indexOf(a.char) < 0) return 'Personaggio non valido.';
      P.copy = a.char; s.stack.pop();
      log(s, nm(s, p) + ' copia l’abilità di ' + D.CHAR[a.char].n + ' fino al suo prossimo turno.', 'ab');
      return null;
    }
    if (f.type === 'blood') {
      if (a.r === 'skip') { s.stack.pop(); return null; }
      if (a.r === 'blood') {
        var Q = s.players[a.target];
        if (!Q || a.target === p || !Q.alive || Q.ghost || Q.hp >= Q.max || P.hp <= 1) return 'Non puoi darlo a questo giocatore.';
        P.hp--; Q.hp++; s.stack.pop();
        log(s, nm(s, p) + ' dona 1 punto vita a ' + nm(s, a.target) + '.', 'heal');
        return null;
      }
    }
    if (f.type === 'peyote' && a.r === 'guess') {
      var c = drawCard(s); if (c == null) { s.stack.pop(); return null; }
      var su = suit(s, c), red = su === 'H' || su === 'D', right = (a.c === 'R') === red;
      s.flash = { kind: 'check', card: c, p: p, n: s.logN + 1 };
      if (right) { P.hand.push(c); f.got++; log(s, nm(s, p) + ' dice ' + (a.c === 'R' ? 'rosso' : 'nero') + ': ' + CARDS[c].r + D.SUITSYM[su] + ', indovinato! La tiene e riprova.', 'draw'); }
      else { s.disc.push(c); s.stack.pop(); log(s, nm(s, p) + ' dice ' + (a.c === 'R' ? 'rosso' : 'nero') + ': ' + CARDS[c].r + D.SUITSYM[su] + ', sbagliato. Ha pescato ' + f.got + (f.got === 1 ? ' carta.' : ' carte.'), 'draw'); }
      return null;
    }
    if (f.type === 'ranch' && a.r === 'ranch') {
      var rc = a.cards || [];
      for (var j = 0; j < rc.length; j++) if (P.hand.indexOf(rc[j]) < 0 || rc.indexOf(rc[j]) !== j) return 'Carta non valida.';
      rc.forEach(function (c2) { discardFromHand(s, p, c2); }); give(s, p, rc.length); s.stack.pop();
      if (rc.length) log(s, nm(s, p) + ' cambia ' + rc.length + (rc.length === 1 ? ' carta' : ' carte') + ' al Ranch.', 'event');
      return null;
    }
    if (f.type === 'dalton' && a.r === 'dalton') {
      if (P.eq.indexOf(a.card) < 0 || kind(a.card) !== 'e') return 'Scegli una tua carta blu in gioco.';
      discardEq(s, p, a.card); f.queue.shift();
      log(s, 'I Dalton: ' + nm(s, p) + ' scarta ' + cardName(a.card) + '.', 'event');
      return null;
    }
    return 'Azione non valida in questo momento.';
  }

  function docHeal(s, p, cards) {
    var P = s.players[p];
    if (!has(s, p, 'doc')) return 'Abilità non disponibile.';
    if (!cards || cards.length !== 2 || cards[0] === cards[1] || P.hand.indexOf(cards[0]) < 0 || P.hand.indexOf(cards[1]) < 0) return 'Scegli due carte da scartare.';
    if (P.hp >= P.max) return 'Hai già tutti i punti vita.';
    discardFromHand(s, p, cards[0]); discardFromHand(s, p, cards[1]); P.hp++;
    log(s, nm(s, p) + ' si ricuce le ferite: scarta 2 carte e recupera 1 punto vita.', 'heal');
    return null;
  }

  function decider(s) {
    if (s.phase !== 'play') return null;
    var f = s.stack[s.stack.length - 1];
    if (f) return f.who;
    return s.turn;
  }
  function mustPlay(s, p) {
    if (!s.must || s.turn !== p) return null;
    var P = s.players[p];
    if (P.hand.indexOf(s.must) < 0) return null;
    var info = playInfo(s, p, s.must);
    return info.ok ? s.must : null;
  }

  /* ---------- punto d'ingresso: act(stato, giocatore, azione) -> null | messaggio d'errore ---------- */
  function act(s, p, a) {
    if (s.phase !== 'play') return 'La partita è finita.';
    if (!s.players[p] || !s.players[p].alive) return 'Sei fuori dalla partita.';
    var err = null;
    if (a.a === 'doc') {
      var top = s.stack[s.stack.length - 1];
      if (top && top.type === 'dying' && top.who === p) err = respond(s, p, { r: 'doc', cards: a.cards });
      else err = docHeal(s, p, a.cards);
    } else if (decider(s) !== p) err = 'Non tocca a te.';
    else if (a.a === 'respond') err = respond(s, p, a);
    else if (s.stack.length) err = 'Prima va risolta l’azione in corso.';
    else if (a.a === 'draw') {
      if (s.step !== 'draw') err = 'Hai già pescato.';
      else if (a.mode && a.mode !== 'deck' && drawModes(s, p).indexOf(a.mode) < 0) err = 'Non puoi pescare così.';
      else doDraw(s, p, a);
    }
    else if (a.a === 'play') err = play(s, p, a);
    else if (a.a === 'green') err = useGreen(s, p, a);
    else if (a.a === 'ability') err = ability(s, p, a);
    else if (a.a === 'sniper') err = sniper(s, p, a);
    else if (a.a === 'ricochet') err = ricochet(s, p, a);
    else if (a.a === 'end') {
      if (s.step !== 'play') err = 'Devi ancora pescare.';
      else if (mustPlay(s, p) != null) err = 'Legge del West: devi prima giocare ' + cardName(s.must) + '.';
      else {
        var P = s.players[p];
        log(s, nm(s, p) + ' passa il turno.', 'sys');
        if (evIs(s, 'vendetta') && !s.noVendetta && !P.ghost) {
          var V = check(s, p, function (su) { return su === 'H'; }, 'la Vendetta');
          if (V && V.s === 'H') { s.extraTurn = p; log(s, nm(s, p) + ' gioca un altro turno!', 'event'); }
        }
        if (!P.ghost && P.hand.length > handLimit(s, p)) s.stack.push({ type: 'discard', who: p, n: P.hand.length - handLimit(s, p) });
        else nextTurn(s);
      }
    } else err = 'Azione sconosciuta.';
    if (!err) { s.seq++; advance(s); }
    return err;
  }

  function newGame(seats, opts) {
    opts = opts || {};
    var n = seats.length, dc = !!opts.dc;
    if (n < 4 || n > (dc ? 8 : 7)) throw new Error(dc ? 'Servono da 4 a 8 giocatori.' : 'Servono da 4 a 7 giocatori.');
    var roles = shuffle(D.ROLESETS[n].slice());
    var pool = D.CHARS.filter(function (c) { return dc || !c.x; }).map(function (c) { return c.id; });
    var chars = shuffle(pool);
    var s = {
      v: 2, phase: 'play', winner: null, seq: 0, logN: 0, log: [], flash: null,
      exp: { dc: dc, hn: !!opts.hn, fc: !!opts.fc },
      players: seats.map(function (st, i) {
        var ch = D.CHAR[chars[i]], hp = ch.hp + (roles[i] === 'sceriffo' ? 1 : 0);
        return { uid: st.uid, nick: st.nick, bot: !!st.bot, char: ch.id, role: roles[i], hp: hp, max: hp, hand: [], eq: [], alive: true };
      }),
      deck: shuffle(CARDS.filter(function (c) { return dc || !c.x; }).map(function (c) { return c.id; })), disc: [], turn: 0, step: 'start', bangs: 0, stack: [],
      aggro: seats.map(function () { return 0; }), green: {}, turnN: 1, round: 1, deaths: [], dir: 1, used: {}, must: null, ev: null
    };
    if (opts.hn || opts.fc) {
      var hn = Object.keys(EV).filter(function (k) { return EV[k].set === 'hn' && !EV[k].final; });
      var fc = Object.keys(EV).filter(function (k) { return EV[k].set === 'fc' && !EV[k].final; });
      var deck, fin;
      if (opts.hn && opts.fc) { deck = shuffle(hn.concat(fc)).slice(0, 12); fin = Math.random() < .5 ? 'mezzogiorno' : 'pugnocarte'; }
      else if (opts.hn) { deck = shuffle(hn); fin = 'mezzogiorno'; }
      else { deck = shuffle(fc); fin = 'pugnocarte'; }
      deck.push(fin);
      s.ev = { deck: deck, cur: null, pile: [], fin: fin };
    }
    s.players.forEach(function (P, i) { give(s, i, P.hp); });
    var sh = roles.indexOf('sceriffo');
    var ex = [dc ? 'Dodge City' : null, opts.hn ? 'Mezzogiorno di Fuoco' : null, opts.fc ? 'Per un Pugno di Carte' : null].filter(function (x) { return x; });
    log(s, 'Si apre la partita a ' + n + ' giocatori' + (ex.length ? ' con ' + ex.join(', ') : '') + '. Lo Sceriffo è ' + s.players[sh].nick + '.', 'turn');
    s.turn = sh; s.step = 'start';
    s.stack.push({ type: 'turnStart', who: sh, stage: 0 });
    log(s, 'Turno di ' + s.players[sh].nick + '.', 'turn');
    advance(s);
    return s;
  }

  return {
    newGame: newGame, act: act, decider: decider, playInfo: playInfo, greenInfo: greenInfo, abilityInfo: abilityInfo, sniperInfo: sniperInfo, ricochetInfo: ricochetInfo,
    frameOptions: frameOptions, distance: distance, range: range, rangeOf: rangeOf, weapon: weapon, hasEq: hasEq, eqOn: eqOn, aliveIdx: aliveIdx, aliveCount: aliveCount,
    canPlayBang: canPlayBang, bangLimit: bangLimit, ty: ty, kind: kind, has: has, suit: suit, greenReady: greenReady, drawModes: drawModes, drawCount: drawCount,
    handLimit: handLimit, mustPlay: mustPlay, isMissLike: isMissLike, isBangLike: isBangLike, evIs: evIs, WEAPONS: WEAPONS, GREEN_MISS: GREEN_MISS, _advance: advance, _nextTurn: nextTurn
  };
})();
if (typeof module !== 'undefined') module.exports = PPEngine;
