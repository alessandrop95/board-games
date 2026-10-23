/* ===== Pistoleri automatici: riempiono i posti vuoti o decidono per chi è assente ===== */
var PPBot = (function () {
  var D = (typeof PPData !== 'undefined') ? PPData : require('./data.js');
  var E = (typeof PPEngine !== 'undefined') ? PPEngine : require('./engine.js');
  var ty = E.ty;
  var VAL = { whisky: 10, schivata: 9, sparo: 7, mitraglia: 8, cassaforte: 8, posta: 7, riparo: 7, cavallo: 6, cannocchiale: 6, borseggio: 6,
    sabotaggio: 5, sfida: 5, stampede: 6, giro: 5, bottega: 4, gattabuia: 5, candelotto: 2, ripetitore: 5, revolver: 4, schioppo: 4, carabina: 5, bisonte: 5 };
  function val(id) { return VAL[ty(id)] || 3; }
  function byVal(a, b) { return val(a) - val(b); }
  function rnd(a) { return a[Math.floor(Math.random() * a.length)]; }

  // Quanto il bot p vuole colpire q (più alto = bersaglio migliore; <=0 = da evitare)
  function hate(s, p, q) {
    var me = s.players[p], Q = s.players[q], ag = s.aggro[q] || 0;
    var alive = E.aliveIdx(s);
    switch (me.role) {
      case 'sceriffo': return 1 + ag * 2 + Math.random();
      case 'vice': return Q.role === 'sceriffo' ? -10 : 0.5 + ag * 2 + Math.random();
      case 'bandito': return Q.role === 'sceriffo' ? 10 : (ag < 0 ? 2 - ag : 0.4) + Math.random() * 0.5;
      case 'traditore':
        if (Q.role === 'sceriffo') return alive.length <= 2 ? 10 : (Q.hp <= 2 ? -10 : 0.2);
        return 1 + ag * 2 + Math.random();
    }
    return 1;
  }
  function best(s, p, list) {
    var b = null, bv = 0;
    list.forEach(function (q) { var v = hate(s, p, q); if (v > bv) { bv = v; b = q; } });
    return b;
  }

  function decide(s, p) {
    var P = s.players[p], f = s.stack[s.stack.length - 1];
    if (f && f.who === p) {
      var o = E.frameOptions(s, f);
      if (f.type === 'react') {
        if (o.barrel) return { a: 'respond', r: 'barrel' };
        if (o.cards.length) return { a: 'respond', r: 'card', card: o.cards.sort(function (a, b) { return ty(a) === 'schivata' ? -1 : 1; })[0] };
        return { a: 'respond', r: 'take' };
      }
      if (f.type === 'duel') return o.cards.length ? { a: 'respond', r: 'card', card: o.cards[0] } : { a: 'respond', r: 'take' };
      if (f.type === 'dying') {
        if (o.cards.length) return { a: 'respond', r: 'card', card: o.cards[0] };
        if (o.doc) return { a: 'doc', cards: P.hand.slice().sort(byVal).slice(0, 2) };
        return { a: 'respond', r: 'die' };
      }
      if (f.type === 'store') return { a: 'respond', r: 'pick', card: f.cards.slice().sort(byVal).pop() };
      if (f.type === 'kit') return { a: 'respond', r: 'keep', cards: f.cards.slice().sort(byVal).slice(1) };
      if (f.type === 'discard') return { a: 'respond', r: 'discard', cards: P.hand.slice().sort(byVal).slice(0, f.n) };
    }
    if (s.turn !== p) return null;
    if (s.step === 'draw') {
      if (P.char === 'nate') {
        var vs = E.aliveIdx(s).filter(function (q) { return q !== p && s.players[q].hand.length; });
        var tq = best(s, p, vs);
        if (tq != null) return { a: 'draw', mode: 'player', target: tq };
      }
      if (P.char === 'gazza' && s.disc.length && val(s.disc[s.disc.length - 1]) >= 7) return { a: 'draw', mode: 'discard' };
      return { a: 'draw', mode: 'deck' };
    }
    // fase di gioco
    if (P.char === 'doc' && P.hp < P.max && P.hand.length > P.hp + 1) return { a: 'doc', cards: P.hand.slice().sort(byVal).slice(0, 2) };
    var hand = P.hand.slice(), sh = s.players.filter(function (Q) { return Q.role === 'sceriffo'; })[0];
    var order = ['whisky', 'posta', 'cassaforte', 'riparo', 'cavallo', 'cannocchiale', 'bisonte', 'carabina', 'schioppo', 'revolver', 'ripetitore', 'giro',
      'gattabuia', 'borseggio', 'sabotaggio', 'sparo', 'schivata', 'sfida', 'mitraglia', 'stampede', 'bottega', 'candelotto'];
    for (var k = 0; k < order.length; k++) {
      var want = order[k];
      for (var i = 0; i < hand.length; i++) {
        var id = hand[i]; if (ty(id) !== want) continue;
        var info = E.playInfo(s, p, id);
        if (!info.ok) continue;
        if (E.WEAPONS.indexOf(want) >= 0) {
          var cur = E.weapon(P), cr = E.range(P), nr = D.TYPES[want].w;
          if (want === 'ripetitore') { if (cur != null || hand.filter(function (c) { return ty(c) === 'sparo'; }).length < 2) continue; }
          else if (nr <= cr) continue;
        }
        if (want === 'giro' && P.hp >= P.max) continue;
        if ((want === 'mitraglia' || want === 'stampede') && P.role === 'vice' && sh.hp <= 1) continue;
        if (want === 'sfida' && hand.filter(function (c) { return ty(c) === 'sparo'; }).length < 2) continue;
        if (info.targets) {
          var t = best(s, p, info.targets);
          if (t == null) continue;
          var a = { a: 'play', card: id, target: t };
          if (info.pick) { var Q = s.players[t]; if (Q.eq.length && (!Q.hand.length || Math.random() < 0.6)) a.pick = Q.eq.slice().sort(byVal).pop(); }
          return a;
        }
        return { a: 'play', card: id };
      }
    }
    return { a: 'end' };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = PPBot;
