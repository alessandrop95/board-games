/* ===== Motore di gioco: stato puro + azioni. Una sola scrittura alla volta (lease sul documento). ===== */
var PPEngine = (function () {
  var D = (typeof PPData !== 'undefined') ? PPData : require('./data.js');
  var T = D.TYPES, CARDS = D.CARDS;
  var WEAPONS = ['ripetitore', 'revolver', 'schioppo', 'carabina', 'bisonte'];

  function ty(id) { return CARDS[id].t; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nm(s, p) { return s.players[p].nick; }
  function log(s, txt, kind) {
    s.log.push({ n: ++s.logN, t: txt, k: kind || '' });
    if (s.log.length > 70) s.log.splice(0, s.log.length - 70);
  }
  function cardName(id) { return T[ty(id)].n; }
  function hasEq(P, t) { for (var i = 0; i < P.eq.length; i++) if (ty(P.eq[i]) === t) return P.eq[i]; return null; }
  function weapon(P) { for (var i = 0; i < P.eq.length; i++) if (WEAPONS.indexOf(ty(P.eq[i])) >= 0) return P.eq[i]; return null; }
  function range(P) { var w = weapon(P); return w != null ? T[ty(w)].w : 1; }
  function aliveIdx(s) { var r = []; s.players.forEach(function (P, i) { if (P.alive) r.push(i); }); return r; }
  function aliveCount(s) { return aliveIdx(s).length; }

  function distance(s, a, b) {
    if (a === b) return 0;
    var al = aliveIdx(s), ia = al.indexOf(a), ib = al.indexOf(b), n = al.length;
    if (ia < 0 || ib < 0) return 99;
    var d = Math.abs(ia - ib); d = Math.min(d, n - d);
    var A = s.players[a], B = s.players[b];
    if (hasEq(B, 'cavallo') != null) d++;
    if (B.char === 'wren') d++;
    if (hasEq(A, 'cannocchiale') != null) d--;
    if (A.char === 'maggie') d--;
    return Math.max(1, d);
  }
  function nextAlive(s, p) { var n = s.players.length; for (var k = 1; k <= n; k++) { var q = (p + k) % n; if (s.players[q].alive) return q; } return p; }

  function drawCard(s) {
    if (!s.deck.length) {
      if (!s.disc.length) return null;
      var top = s.disc.pop();
      s.deck = shuffle(s.disc); s.disc = [top];
      log(s, 'Il mazzo è finito: si rimescolano gli scarti.', 'sys');
    }
    return s.deck.pop();
  }
  function give(s, p, n) { var P = s.players[p]; for (var i = 0; i < n; i++) { var c = drawCard(s); if (c == null) return; P.hand.push(c); } }
  function removeFrom(arr, id) { var i = arr.indexOf(id); if (i >= 0) { arr.splice(i, 1); return true; } return false; }
  function discardFromHand(s, p, id) { removeFrom(s.players[p].hand, id); s.disc.push(id); }

  // "Estrai!": good(card) dice quale risultato è favorevole; Silas Fortuna sceglie tra due.
  function check(s, p, good, why) {
    var P = s.players[p];
    var a = drawCard(s); if (a == null) return null;
    var pick = a;
    if (P.char === 'fortuna') {
      var b = drawCard(s);
      if (b != null) { pick = good(b) && !good(a) ? b : a; s.disc.push(a === pick ? b : a); }
    }
    s.disc.push(pick);
    var C = CARDS[pick];
    log(s, nm(s, p) + ' estrae per ' + why + ': ' + C.r + D.SUITSYM[C.s] + '.', 'draw');
    s.flash = { kind: 'check', card: pick, p: p, n: s.logN };
    return C;
  }

  function damage(s, t, n, src) {
    var P = s.players[t]; if (!P.alive) return;
    P.hp -= n;
    log(s, nm(s, t) + ' perde ' + (n > 1 ? n + ' punti vita' : '1 punto vita') + '.', 'hit');
    s.flash = { kind: 'hit', p: t, n: s.logN };
    for (var i = 0; i < n; i++) {
      if (P.char === 'thorne') give(s, t, 1);
      if (P.char === 'cascabel' && src != null && src !== t && s.players[src].hand.length) {
        var H = s.players[src].hand, c = H[Math.floor(Math.random() * H.length)];
        removeFrom(H, c); P.hand.push(c);
        log(s, nm(s, t) + ' morde: ruba una carta a ' + nm(s, src) + '.', 'ab');
      }
    }
    if (P.hp <= 0) s.stack.push({ type: 'dying', who: t, killer: src });
  }

  function die(s, t, killer) {
    var P = s.players[t];
    P.alive = false; P.hp = 0;
    log(s, nm(s, t) + ' è eliminato. Era ' + (P.role === 'vice' ? 'un Vicesceriffo' : P.role === 'sceriffo' ? 'lo Sceriffo' : P.role === 'bandito' ? 'un Bandito' : 'il Traditore') + '.', 'death');
    s.flash = { kind: 'death', p: t, n: s.logN };
    var all = P.hand.concat(P.eq); P.hand = []; P.eq = [];
    var crowe = -1;
    s.players.forEach(function (Q, i) { if (Q.alive && Q.char === 'crowe') crowe = i; });
    if (crowe >= 0) { s.players[crowe].hand = s.players[crowe].hand.concat(all); if (all.length) log(s, nm(s, crowe) + ' si prende tutte le sue carte.', 'ab'); }
    else s.disc = s.disc.concat(all);
    if (killer != null && killer !== t && s.players[killer].alive) {
      var K = s.players[killer];
      if (P.role === 'bandito') { give(s, killer, 3); log(s, nm(s, killer) + ' incassa la taglia: pesca 3 carte.', 'ab'); }
      if (P.role === 'vice' && K.role === 'sceriffo') {
        s.disc = s.disc.concat(K.hand, K.eq); K.hand = []; K.eq = [];
        log(s, 'Lo Sceriffo ha ucciso il suo Vice: scarta tutte le sue carte.', 'ab');
      }
    }
    checkWin(s);
  }

  function checkWin(s) {
    if (s.phase === 'over') return;
    var sh = s.players.filter(function (P) { return P.role === 'sceriffo'; })[0];
    var al = s.players.filter(function (P) { return P.alive; });
    var w = null;
    if (!sh.alive) w = (al.length === 1 && al[0].role === 'traditore') ? 'traditore' : 'banditi';
    else if (al.every(function (P) { return P.role === 'sceriffo' || P.role === 'vice'; })) w = 'legge';
    if (w) {
      s.phase = 'over'; s.winner = w; s.stack = [];
      var txt = w === 'legge' ? 'La legge trionfa: vincono lo Sceriffo e i suoi Vice!' : w === 'banditi' ? 'Lo Sceriffo è caduto: vincono i Banditi!' : 'Il Traditore resta solo in piedi e vince!';
      log(s, txt, 'win');
    }
  }

  function nextTurn(s) {
    s.turn = nextAlive(s, s.turn);
    s.step = 'start'; s.bangs = 0;
    log(s, 'Turno di ' + nm(s, s.turn) + '.', 'turn');
    s.stack.push({ type: 'turnStart', who: s.turn, stage: 0 });
  }

  // ---- Opzioni di risposta (servono anche all'interfaccia) ----
  function isBangLike(s, p, id) { var t = ty(id); return t === 'sparo' || (s.players[p].char === 'dolly' && t === 'schivata'); }
  function isMissLike(s, p, id) { var t = ty(id); return t === 'schivata' || (s.players[p].char === 'dolly' && t === 'sparo'); }
  function canSave(s, p) {
    var P = s.players[p];
    var beer = aliveCount(s) > 2 && P.hand.some(function (c) { return ty(c) === 'whisky'; });
    return beer || (P.char === 'doc' && P.hand.length >= 2);
  }
  function frameOptions(s, f) {
    var P = s.players[f.who], o = { cards: [] };
    if (f.type === 'react') {
      if (f.kind === 'stampede') o.cards = P.hand.filter(function (c) { return isBangLike(s, f.who, c); });
      else { o.cards = P.hand.filter(function (c) { return isMissLike(s, f.who, c); }); o.barrel = f.barrels > 0; }
    } else if (f.type === 'duel') o.cards = P.hand.filter(function (c) { return isBangLike(s, f.who, c); });
    else if (f.type === 'dying') { o.cards = aliveCount(s) > 2 ? P.hand.filter(function (c) { return ty(c) === 'whisky'; }) : []; o.doc = P.char === 'doc' && P.hand.length >= 2; }
    return o;
  }

  // ---- Avanzamento automatico di tutto ciò che non richiede una scelta ----
  function normalize(s) {
    if (s.phase !== 'play') return;
    s.players.forEach(function (P, i) {
      if (P.alive && P.char === 'clem' && P.hand.length === 0) {
        var c = drawCard(s); if (c != null) { P.hand.push(c); log(s, nm(s, i) + ' resta a mani vuote e pesca una carta.', 'ab'); }
      }
    });
  }

  function advance(s) {
    var guard = 0;
    while (s.phase === 'play' && guard++ < 500) {
      normalize(s);
      if (s.phase !== 'play') break;
      var f = s.stack[s.stack.length - 1];
      if (!f) {
        if (!s.players[s.turn].alive) { nextTurn(s); continue; }
        if (s.step === 'draw') {
          var P = s.players[s.turn];
          var choice = (P.char === 'nate' && s.players.some(function (Q, i) { return i !== s.turn && Q.alive && Q.hand.length; })) ||
                       (P.char === 'gazza' && s.disc.length);
          if (P.char === 'hattie') { doDraw(s, s.turn, { mode: 'deck' }); continue; }
          if (!choice) { doDraw(s, s.turn, { mode: 'deck' }); continue; }
        }
        break;
      }
      if (f.type === 'multi') {
        if (!f.queue.length) { s.stack.pop(); continue; }
        var t = f.queue.shift();
        if (!s.players[t].alive) continue;
        var nf = { type: 'react', kind: f.kind, from: f.from, who: t, need: 1, got: 0, barrels: 0 };
        if (f.kind === 'mitraglia') nf.barrels = (hasEq(s.players[t], 'riparo') != null ? 1 : 0) + (s.players[t].char === 'padre' ? 1 : 0);
        s.stack.push(nf); continue;
      }
      if (f.type === 'turnStart') {
        var p = f.who, Pp = s.players[p];
        if (!Pp.alive) { s.stack.pop(); continue; }
        if (f.stage === 0) {
          f.stage = 1;
          var dy = hasEq(Pp, 'candelotto');
          if (dy != null) {
            var C = check(s, p, function (c) { return !(c.s === 'S' && ['2','3','4','5','6','7','8','9'].indexOf(c.r) >= 0); }, 'il Candelotto');
            if (C && C.s === 'S' && ['2','3','4','5','6','7','8','9'].indexOf(C.r) >= 0) {
              removeFrom(Pp.eq, dy); s.disc.push(dy);
              log(s, 'BOOM! Il Candelotto esplode in mano a ' + nm(s, p) + '.', 'hit');
              damage(s, p, 3, null);
            } else {
              var q = nextAlive(s, p);
              removeFrom(Pp.eq, dy);
              if (q !== p && hasEq(s.players[q], 'candelotto') == null) { s.players[q].eq.push(dy); log(s, 'Il Candelotto passa a ' + nm(s, q) + '.', 'sys'); }
              else s.disc.push(dy);
            }
          }
          continue;
        }
        if (f.stage === 1) {
          f.stage = 2;
          var jl = hasEq(Pp, 'gattabuia');
          if (jl != null) {
            var J = check(s, p, function (c) { return c.s === 'H'; }, 'la Gattabuia');
            removeFrom(Pp.eq, jl); s.disc.push(jl);
            if (!J || J.s !== 'H') { log(s, nm(s, p) + ' resta in cella e salta il turno.', 'sys'); s.stack.pop(); nextTurn(s); continue; }
            log(s, nm(s, p) + ' evade dalla Gattabuia.', 'sys');
          }
          continue;
        }
        s.stack.pop(); s.step = 'draw'; continue;
      }
      if (f.type === 'react' || f.type === 'duel') {
        var op = frameOptions(s, f);
        var needCards = f.type === 'react' && f.kind !== 'stampede' ? (f.need - f.got) : 1;
        if (!op.barrel && op.cards.length < needCards) { resolveTake(s, f); continue; }
        break;
      }
      if (f.type === 'dying') {
        if (s.players[f.who].hp > 0) { s.stack.pop(); continue; }
        if (!canSave(s, f.who)) { s.stack.pop(); die(s, f.who, f.killer); continue; }
        break;
      }
      if (f.type === 'store') {
        if (!f.cards.length) { s.stack.pop(); continue; }
        while (f.i < f.order.length && !s.players[f.order[f.i]].alive) f.i++;
        if (f.i >= f.order.length) { s.disc = s.disc.concat(f.cards); f.cards = []; s.stack.pop(); continue; }
        f.who = f.order[f.i];
        if (f.cards.length === 1) { s.players[f.who].hand.push(f.cards[0]); log(s, nm(s, f.who) + ' prende l’ultima carta della Bottega.', 'sys'); f.cards = []; s.stack.pop(); continue; }
        break;
      }
      if (f.type === 'discard') {
        var Pd = s.players[f.who];
        if (Pd.hand.length <= Math.max(Pd.hp, 0)) { s.stack.pop(); nextTurn(s); continue; }
        f.n = Pd.hand.length - Pd.hp;
        break;
      }
      break; // kit e altro: serve una scelta
    }
  }

  function resolveTake(s, f) {
    s.stack.pop();
    if (f.type === 'duel') { var other = f.who === f.a ? f.b : f.a; log(s, nm(s, f.who) + ' perde la Sfida.', 'hit'); damage(s, f.who, 1, other); return; }
    damage(s, f.who, 1, f.from);
  }

  function doDraw(s, p, a) {
    var P = s.players[p];
    if (P.char === 'hattie') {
      var three = []; for (var i = 0; i < 3; i++) { var c = drawCard(s); if (c != null) three.push(c); }
      s.step = 'play';
      if (three.length <= 2) { P.hand = P.hand.concat(three); return; }
      s.stack.push({ type: 'kit', who: p, cards: three });
      return;
    }
    if (a.mode === 'player' && P.char === 'nate') {
      var Q = s.players[a.target];
      if (Q && Q.alive && a.target !== p && Q.hand.length) {
        var k = Q.hand[Math.floor(Math.random() * Q.hand.length)];
        removeFrom(Q.hand, k); P.hand.push(k); give(s, p, 1);
        log(s, nm(s, p) + ' sfila una carta dalla mano di ' + nm(s, a.target) + ' e ne pesca una.', 'ab');
        s.step = 'play'; return;
      }
    }
    if (a.mode === 'discard' && P.char === 'gazza' && s.disc.length) {
      var top = s.disc.pop(); P.hand.push(top); give(s, p, 1);
      log(s, nm(s, p) + ' raccoglie ' + cardName(top) + ' dagli scarti e pesca una carta.', 'ab');
      s.step = 'play'; return;
    }
    if (P.char === 'faro') {
      give(s, p, 1);
      var sec = drawCard(s);
      if (sec != null) {
        P.hand.push(sec);
        var C = CARDS[sec];
        log(s, nm(s, p) + ' mostra la seconda carta: ' + C.r + D.SUITSYM[C.s] + '.', 'draw');
        if (C.s === 'H' || C.s === 'D') { give(s, p, 1); log(s, 'Carta rossa: ' + nm(s, p) + ' ne pesca un’altra.', 'ab'); }
      }
      s.step = 'play'; return;
    }
    give(s, p, 2);
    s.step = 'play';
  }

  // ---- Validazione di una giocata (usata anche dalla UI per evidenziare i bersagli) ----
  function canPlayBang(s, p) { var P = s.players[p]; return s.bangs < 1 || P.char === 'lark' || (weapon(P) != null && ty(weapon(P)) === 'ripetitore'); }
  function playInfo(s, p, id) {
    var P = s.players[p];
    if (s.phase !== 'play' || s.stack.length || s.turn !== p || s.step !== 'play') return { ok: false, why: 'Non è il momento di giocare carte.' };
    if (P.hand.indexOf(id) < 0) return { ok: false, why: 'Non hai questa carta.' };
    var t = ty(id), others = aliveIdx(s).filter(function (i) { return i !== p; });
    var asBang = t === 'sparo' || (t === 'schivata' && P.char === 'dolly');
    if (asBang) {
      if (!canPlayBang(s, p)) return { ok: false, why: 'Hai già sparato in questo turno.' };
      var tg = others.filter(function (i) { return distance(s, p, i) <= range(P); });
      if (!tg.length) return { ok: false, why: 'Nessuno è a portata della tua arma.' };
      return { ok: true, targets: tg, as: 'sparo' };
    }
    switch (t) {
      case 'schivata': return { ok: false, why: 'La Schivata! si gioca solo quando ti sparano.' };
      case 'whisky':
        if (aliveCount(s) <= 2) return { ok: false, why: 'In due il Whisky non ha effetto.' };
        if (P.hp >= P.max) return { ok: false, why: 'Hai già tutti i punti vita.' };
        return { ok: true };
      case 'giro': case 'posta': case 'cassaforte': case 'bottega': case 'stampede': case 'mitraglia': return { ok: true };
      case 'borseggio': {
        var b = others.filter(function (i) { return distance(s, p, i) <= 1 && (s.players[i].hand.length || s.players[i].eq.length); });
        return b.length ? { ok: true, targets: b, pick: true } : { ok: false, why: 'Nessuno a distanza 1 ha carte da rubare.' };
      }
      case 'sabotaggio': {
        var c = others.filter(function (i) { return s.players[i].hand.length || s.players[i].eq.length; });
        return c.length ? { ok: true, targets: c, pick: true } : { ok: false, why: 'Nessuno ha carte da far scartare.' };
      }
      case 'sfida': return { ok: true, targets: others };
      case 'gattabuia': {
        var g = others.filter(function (i) { return s.players[i].role !== 'sceriffo' && hasEq(s.players[i], 'gattabuia') == null; });
        return g.length ? { ok: true, targets: g } : { ok: false, why: 'Non c’è nessuno da mettere in cella.' };
      }
      case 'candelotto': case 'riparo': case 'cavallo': case 'cannocchiale':
        return hasEq(P, t) != null ? { ok: false, why: 'Ne hai già uno in gioco.' } : { ok: true };
      default:
        if (WEAPONS.indexOf(t) >= 0) return { ok: true };
    }
    return { ok: false, why: 'Carta non giocabile.' };
  }

  function play(s, p, a) {
    var id = a.card, info = playInfo(s, p, id);
    if (!info.ok) return info.why;
    if (info.targets && info.targets.indexOf(a.target) < 0) return 'Bersaglio non valido.';
    var P = s.players[p], t = ty(id), tg = a.target;
    if (tg != null && ['sparo','schivata','sfida','gattabuia','borseggio','sabotaggio'].indexOf(t) >= 0) {
      if (s.players[tg].role === 'sceriffo') s.aggro[p] += 2; else if (s.aggro[tg] > 0) s.aggro[p] -= 1;
    }
    if (info.as === 'sparo') {
      discardFromHand(s, p, id); s.bangs++;
      log(s, nm(s, p) + ' spara a ' + nm(s, tg) + (t === 'schivata' ? ' (con una Schivata!)' : '') + '.', 'bang');
      s.flash = { kind: 'bang', p: p, t: tg, n: s.logN };
      var Tg = s.players[tg];
      s.stack.push({ type: 'react', kind: 'sparo', from: p, who: tg, need: P.char === 'abner' ? 2 : 1, got: 0,
        barrels: (hasEq(Tg, 'riparo') != null ? 1 : 0) + (Tg.char === 'padre' ? 1 : 0) });
      return null;
    }
    var K = T[t];
    if (K.kind === 'e') {
      removeFrom(P.hand, id);
      if (t === 'gattabuia') { s.players[tg].eq.push(id); log(s, nm(s, p) + ' sbatte in Gattabuia ' + nm(s, tg) + '.', 'play'); return null; }
      if (WEAPONS.indexOf(t) >= 0) { var w = weapon(P); if (w != null) { removeFrom(P.eq, w); s.disc.push(w); } }
      P.eq.push(id);
      log(s, nm(s, p) + ' mette in gioco ' + K.n + '.', 'play');
      return null;
    }
    discardFromHand(s, p, id);
    s.flash = { kind: 'card', card: id, p: p, n: s.logN + 1 };
    switch (t) {
      case 'whisky': P.hp = Math.min(P.max, P.hp + 1); log(s, nm(s, p) + ' beve un Whisky e recupera 1 punto vita.', 'heal'); break;
      case 'giro': s.players.forEach(function (Q) { if (Q.alive) Q.hp = Math.min(Q.max, Q.hp + 1); }); log(s, nm(s, p) + ' offre un giro: tutti recuperano 1 punto vita.', 'heal'); break;
      case 'posta': give(s, p, 2); log(s, nm(s, p) + ' riceve la Posta: pesca 2 carte.', 'play'); break;
      case 'cassaforte': give(s, p, 3); log(s, nm(s, p) + ' scassina la Cassaforte: pesca 3 carte.', 'play'); break;
      case 'bottega': {
        var al = aliveIdx(s), cards = [];
        for (var i = 0; i < al.length; i++) { var c = drawCard(s); if (c != null) cards.push(c); }
        var order = []; var q = p; for (var j = 0; j < al.length; j++) { order.push(q); q = nextAlive(s, q); }
        log(s, nm(s, p) + ' apre la Bottega: ' + cards.length + ' carte sul banco.', 'play');
        s.stack.push({ type: 'store', who: p, cards: cards, order: order, i: 0 });
        break;
      }
      case 'borseggio': case 'sabotaggio': {
        var Q = s.players[tg], take = null;
        if (a.pick != null && Q.eq.indexOf(a.pick) >= 0) { take = a.pick; removeFrom(Q.eq, take); }
        else if (Q.hand.length) { take = Q.hand[Math.floor(Math.random() * Q.hand.length)]; removeFrom(Q.hand, take); }
        else { take = Q.eq[0]; removeFrom(Q.eq, take); }
        var fromHand = a.pick == null;
        if (t === 'borseggio') { P.hand.push(take); log(s, nm(s, p) + ' borseggia ' + nm(s, tg) + (fromHand ? ' e gli sfila una carta dalla mano.' : ' e si prende ' + cardName(take) + '.'), 'play'); }
        else { s.disc.push(take); log(s, nm(s, p) + ' sabota ' + nm(s, tg) + ': scarta ' + cardName(take) + (fromHand ? ' dalla mano.' : '.'), 'play'); }
        break;
      }
      case 'sfida': log(s, nm(s, p) + ' sfida ' + nm(s, tg) + ' all’alba.', 'bang'); s.stack.push({ type: 'duel', a: p, b: tg, who: tg }); break;
      case 'stampede': case 'mitraglia': {
        var qq = [], r = nextAlive(s, p); while (r !== p) { qq.push(r); r = nextAlive(s, r); }
        log(s, t === 'stampede' ? nm(s, p) + ' scatena una Stampede!' : nm(s, p) + ' apre il fuoco con la Mitraglia!', 'bang');
        s.stack.push({ type: 'multi', kind: t, from: p, queue: qq });
        break;
      }
    }
    return null;
  }

  function respond(s, p, a) {
    var f = s.stack[s.stack.length - 1];
    if (!f || f.who !== p) return 'Non tocca a te rispondere.';
    var P = s.players[p];
    if (f.type === 'react') {
      if (a.r === 'take') { resolveTake(s, f); return null; }
      if (a.r === 'barrel') {
        if (f.barrels <= 0) return 'Nessun Riparo disponibile.';
        f.barrels--;
        var C = check(s, p, function (c) { return c.s === 'H'; }, 'il Riparo');
        if (C && C.s === 'H') { f.got++; log(s, nm(s, p) + ' si mette al riparo: colpo deviato.', 'miss'); }
        if (f.got >= f.need) s.stack.pop();
        return null;
      }
      if (a.r === 'card') {
        var ok = f.kind === 'stampede' ? isBangLike(s, p, a.card) : isMissLike(s, p, a.card);
        if (P.hand.indexOf(a.card) < 0 || !ok) return 'Carta non valida.';
        discardFromHand(s, p, a.card);
        if (f.kind === 'stampede') { log(s, nm(s, p) + ' risponde alla Stampede con uno Sparo!.', 'miss'); s.stack.pop(); return null; }
        f.got++; log(s, nm(s, p) + ' gioca ' + cardName(a.card) + ' per schivare.', 'miss');
        if (f.got >= f.need) s.stack.pop();
        return null;
      }
    }
    if (f.type === 'duel') {
      if (a.r === 'take') { resolveTake(s, f); return null; }
      if (a.r === 'card') {
        if (P.hand.indexOf(a.card) < 0 || !isBangLike(s, p, a.card)) return 'Carta non valida.';
        discardFromHand(s, p, a.card);
        log(s, nm(s, p) + ' risponde alla Sfida con ' + cardName(a.card) + '.', 'bang');
        f.who = f.who === f.a ? f.b : f.a;
        return null;
      }
    }
    if (f.type === 'dying') {
      if (a.r === 'die') { s.stack.pop(); die(s, p, f.killer); return null; }
      if (a.r === 'card') {
        if (P.hand.indexOf(a.card) < 0 || ty(a.card) !== 'whisky' || aliveCount(s) <= 2) return 'Carta non valida.';
        discardFromHand(s, p, a.card); P.hp++; log(s, nm(s, p) + ' si salva con un Whisky!', 'heal');
        return null;
      }
      if (a.r === 'doc') return docHeal(s, p, a.cards);
    }
    if (f.type === 'store' && a.r === 'pick') {
      if (f.cards.indexOf(a.card) < 0) return 'Carta non disponibile.';
      removeFrom(f.cards, a.card); P.hand.push(a.card); f.i++;
      log(s, nm(s, p) + ' sceglie ' + cardName(a.card) + ' dalla Bottega.', 'sys');
      return null;
    }
    if (f.type === 'kit' && a.r === 'keep') {
      var k = a.cards || [];
      if (k.length !== 2 || k[0] === k[1] || f.cards.indexOf(k[0]) < 0 || f.cards.indexOf(k[1]) < 0) return 'Scegli due carte.';
      var back = f.cards.filter(function (c) { return k.indexOf(c) < 0; })[0];
      P.hand.push(k[0], k[1]); s.deck.push(back); s.stack.pop();
      log(s, nm(s, p) + ' tiene 2 carte e ne rimette una sul mazzo.', 'ab');
      return null;
    }
    if (f.type === 'discard' && a.r === 'discard') {
      var cs = a.cards || [];
      if (cs.length !== f.n) return 'Devi scartare ' + f.n + (f.n > 1 ? ' carte.' : ' carta.');
      for (var i = 0; i < cs.length; i++) if (P.hand.indexOf(cs[i]) < 0 || cs.indexOf(cs[i]) !== i) return 'Carta non valida.';
      cs.forEach(function (c) { discardFromHand(s, p, c); });
      log(s, nm(s, p) + ' scarta ' + cs.length + (cs.length > 1 ? ' carte' : ' carta') + ' a fine turno.', 'sys');
      return null;
    }
    return 'Azione non valida in questo momento.';
  }

  function docHeal(s, p, cards) {
    var P = s.players[p];
    if (P.char !== 'doc') return 'Abilità non disponibile.';
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

  // ---- Punto d'ingresso unico: act(state, giocatore, azione) -> null | messaggio d'errore ----
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
    else if (a.a === 'draw') { if (s.step !== 'draw') err = 'Hai già pescato.'; else doDraw(s, p, a); }
    else if (a.a === 'play') err = play(s, p, a);
    else if (a.a === 'end') {
      if (s.step !== 'play') err = 'Devi ancora pescare.';
      else {
        var P = s.players[p];
        log(s, nm(s, p) + ' passa il turno.', 'sys');
        if (P.hand.length > P.hp) s.stack.push({ type: 'discard', who: p, n: P.hand.length - P.hp });
        else nextTurn(s);
      }
    } else err = 'Azione sconosciuta.';
    if (!err) { s.seq++; advance(s); }
    return err;
  }

  function newGame(seats) {
    var n = seats.length;
    if (n < 4 || n > 7) throw new Error('Servono da 4 a 7 giocatori.');
    var roles = shuffle(D.ROLESETS[n].slice());
    var chars = shuffle(D.CHARS.map(function (c) { return c.id; }));
    var s = {
      v: 1, phase: 'play', winner: null, seq: 0, logN: 0, log: [], flash: null,
      players: seats.map(function (st, i) {
        var ch = D.CHAR[chars[i]], hp = ch.hp + (roles[i] === 'sceriffo' ? 1 : 0);
        return { uid: st.uid, nick: st.nick, bot: !!st.bot, char: ch.id, role: roles[i], hp: hp, max: hp, hand: [], eq: [], alive: true };
      }),
      deck: shuffle(CARDS.map(function (c) { return c.id; })), disc: [], turn: 0, step: 'start', bangs: 0, stack: [], aggro: seats.map(function () { return 0; })
    };
    s.players.forEach(function (P, i) { give(s, i, P.hp); });
    var sh = roles.indexOf('sceriffo');
    log(s, 'Si apre la partita a ' + n + ' giocatori. Lo Sceriffo è ' + s.players[sh].nick + '.', 'turn');
    s.turn = sh; s.step = 'start';
    s.stack.push({ type: 'turnStart', who: sh, stage: 0 });
    log(s, 'Turno di ' + s.players[sh].nick + '.', 'turn');
    advance(s);
    return s;
  }

  return {
    newGame: newGame, act: act, decider: decider, playInfo: playInfo, frameOptions: frameOptions, distance: distance,
    range: range, weapon: weapon, hasEq: hasEq, aliveIdx: aliveIdx, aliveCount: aliveCount, canPlayBang: canPlayBang, ty: ty, WEAPONS: WEAPONS
  };
})();
if (typeof module !== 'undefined') module.exports = PPEngine;
