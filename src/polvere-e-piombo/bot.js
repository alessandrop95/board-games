/* ===== Pistoleri automatici: riempiono i posti vuoti o decidono per chi è assente ===== */
var PPBot = (function () {
  var D = (typeof PPData !== 'undefined') ? PPData : require('./data.js');
  var E = (typeof PPEngine !== 'undefined') ? PPEngine : require('./engine.js');
  var ty = E.ty;
  var VAL = { whisky: 10, schivata: 9, sparo: 7, mitraglia: 8, cassaforte: 8, posta: 7, riparo: 7, cavallo: 6, cannocchiale: 6, borseggio: 6,
    sabotaggio: 5, sfida: 5, stampede: 6, giro: 5, bottega: 4, gattabuia: 5, candelotto: 2, ripetitore: 5, revolver: 4, schioppo: 4, carabina: 5, bisonte: 5,
    tuffo: 9, liquore: 7, tequila: 6, pugno: 6, springfield: 6, rissa: 5, ragtime: 5, binocolo: 6, rifugio: 7, bibbia: 8, cappello: 7, placca: 7, sombrero: 7,
    pugnale: 6, derringer: 6, borraccia: 6, cancan: 5, conestoga: 6, fucile: 6, ponyexpress: 7, pepperbox: 6, howitzer: 7 };
  function val(id) { return VAL[ty(id)] || 3; }
  function byVal(a, b) { return val(a) - val(b); }
  function low(list, n) { return list.slice().sort(byVal).slice(0, n); }

  // Quanto il bot p vuole colpire q (più alto = bersaglio migliore; <=0 = da evitare)
  function hate(s, p, q) {
    var me = s.players[p], Q = s.players[q], ag = s.aggro[q] || 0;
    var alive = E.aliveIdx(s);
    if (Q.ghost) return -1;
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
  function friend(s, p, q) { return hate(s, p, q) <= 0.3; }
  function best(s, p, list) {
    var b = null, bv = 0;
    list.forEach(function (q) { var v = hate(s, p, q); if (v > bv) { bv = v; b = q; } });
    return b;
  }
  function pickFrom(s, t) { var Q = s.players[t]; if (Q.eq.length && (!Q.hand.length || Math.random() < 0.6)) return Q.eq.slice().sort(byVal).pop(); return null; }
  function extraFor(P, id) { var o = P.hand.filter(function (c) { return c !== id; }); return o.length ? low(o, 1)[0] : null; }

  function respondFrame(s, p, f) {
    var P = s.players[p], o = E.frameOptions(s, f);
    if (f.type === 'react') {
      if (f.kind === 'stampede') return o.cards.length ? { a: 'respond', r: 'card', card: low(o.cards, 1)[0] } : { a: 'respond', r: 'take' };
      if (o.barrel) return { a: 'respond', r: 'barrel' };
      if (f.kind === 'rimbalzo' && val(f.target) < 6) return { a: 'respond', r: 'take' };
      if (o.green.length) return { a: 'respond', r: 'green', card: o.green[0] };
      if (o.cards.length >= f.need - f.got) {
        var miss = o.cards.filter(function (c) { return ty(c) === 'schivata' || ty(c) === 'tuffo'; });
        return { a: 'respond', r: 'card', card: (miss.length ? miss : low(o.cards, 1))[0] };
      }
      return { a: 'respond', r: 'take' };
    }
    if (f.type === 'roulette') {
      if (o.green.length) return { a: 'respond', r: 'green', card: o.green[0] };
      return o.cards.length ? { a: 'respond', r: 'card', card: low(o.cards, 1)[0] } : { a: 'respond', r: 'take' };
    }
    if (f.type === 'duel') return o.cards.length ? { a: 'respond', r: 'card', card: o.cards[0] } : { a: 'respond', r: 'take' };
    if (f.type === 'dying') {
      if (o.cards.length) return { a: 'respond', r: 'card', card: o.cards[0] };
      if (o.doc) return { a: 'doc', cards: low(P.hand, 2) };
      return { a: 'respond', r: 'die' };
    }
    if (f.type === 'store') return { a: 'respond', r: 'pick', card: f.cards.slice().sort(byVal).pop() };
    if (f.type === 'kit') return { a: 'respond', r: 'keep', cards: f.cards.slice().sort(byVal).slice(f.cards.length - f.keep) };
    if (f.type === 'discard') return { a: 'respond', r: 'discard', cards: low(P.hand, f.n) };
    if (f.type === 'vera') {
      var pref = ['lark', 'pixie', 'abner', 'thorne', 'padre', 'fortuna', 'sean', 'maggie', 'wren'];
      for (var i = 0; i < pref.length; i++) if (f.opts.indexOf(pref[i]) >= 0) return { a: 'respond', r: 'vera', char: pref[i] };
      return { a: 'respond', r: 'vera', char: f.opts[0] };
    }
    if (f.type === 'blood') {
      var al = E.aliveIdx(s).filter(function (q) { var Q = s.players[q]; return q !== p && !Q.ghost && Q.hp < Q.max && (Q.hp <= 1) && friend(s, p, q); });
      return al.length && P.hp >= 3 ? { a: 'respond', r: 'blood', target: al[0] } : { a: 'respond', r: 'skip' };
    }
    if (f.type === 'peyote') return { a: 'respond', r: 'guess', c: Math.random() < 0.5 ? 'R' : 'B' };
    if (f.type === 'ranch') return { a: 'respond', r: 'ranch', cards: P.hand.filter(function (c) { return val(c) <= 3; }) };
    if (f.type === 'dalton') return { a: 'respond', r: 'dalton', card: low(o.cards, 1)[0] };
    return null;
  }

  function decide(s, p) {
    var P = s.players[p], f = s.stack[s.stack.length - 1];
    if (f && f.who === p) return respondFrame(s, p, f);
    if (f || s.turn !== p) return null;
    if (s.step === 'draw') {
      var modes = E.drawModes(s, p);
      if (modes.indexOf('liquor') >= 0 && P.hp <= 2) return { a: 'draw', mode: 'liquor' };
      if (modes.indexOf('pat') >= 0) {
        var pt = null, pv = 6;
        E.aliveIdx(s).forEach(function (q) { if (q === p || friend(s, p, q)) return; s.players[q].eq.forEach(function (c) { if (val(c) >= pv) { pv = val(c); pt = { a: 'draw', mode: 'pat', target: q, pick: c }; } }); });
        if (pt) return pt;
      }
      if (modes.indexOf('player') >= 0) {
        var vs = E.aliveIdx(s).filter(function (q) { return q !== p && s.players[q].hand.length; });
        var tq = best(s, p, vs);
        if (tq != null) return { a: 'draw', mode: 'player', target: tq };
      }
      if (modes.indexOf('discard') >= 0 && val(s.disc[s.disc.length - 1]) >= 7) return { a: 'draw', mode: 'discard' };
      return { a: 'draw', mode: 'deck' };
    }
    // fase di gioco
    var must = E.mustPlay(s, p);
    if (must != null) {
      var mi = E.playInfo(s, p, must), ma = { a: 'play', card: must };
      if (mi.targets) { ma.target = best(s, p, mi.targets); if (ma.target == null) ma.target = mi.targets[0]; if (mi.pick) ma.pick = pickFrom(s, ma.target); }
      if (mi.extra) ma.extra = extraFor(P, must);
      return ma;
    }
    if (E.has(s, p, 'doc') && P.hp < P.max && P.hand.length > P.hp + 1) return { a: 'doc', cards: low(P.hand, 2) };
    if (E.has(s, p, 'jose') && E.abilityInfo(s, p, 'jose').ok) {
      var blue = P.hand.filter(function (c) { return E.kind(c) === 'e' && val(c) <= 5; });
      if (blue.length) return { a: 'ability', k: 'jose', card: blue[0] };
    }
    if (E.has(s, p, 'chuck') && P.hp >= 3 && P.hand.length < 3 && E.abilityInfo(s, p, 'chuck').ok) return { a: 'ability', k: 'chuck' };
    // carte verdi pronte
    for (var g = 0; g < P.eq.length; g++) {
      var gi = E.greenInfo(s, p, P.eq[g]);
      if (!gi.ok) continue;
      var gt = ty(P.eq[g]);
      if (gi.targets) {
        var tg = best(s, p, gi.targets); if (tg == null) continue;
        var ga = { a: 'green', card: P.eq[g], target: tg }; if (gi.pick) ga.pick = pickFrom(s, tg); return ga;
      }
      if (gt === 'howitzer' && P.role === 'vice') continue;
      return { a: 'green', card: P.eq[g] };
    }
    var hand = P.hand.slice(), sh = s.players.filter(function (Q) { return Q.role === 'sceriffo'; })[0];
    // Cecchino: due Bang! insieme
    var sn = E.sniperInfo(s, p);
    if (sn.ok && sn.bangs.length >= 3) { var st = best(s, p, sn.targets); if (st != null) return { a: 'sniper', cards: sn.bangs.slice(0, 2), target: st }; }
    var order = ['whisky', 'liquore', 'tequila', 'posta', 'cassaforte', 'riparo', 'rifugio', 'cavallo', 'cannocchiale', 'binocolo', 'bisonte', 'carabina', 'schioppo', 'revolver', 'ripetitore',
      'bibbia', 'cappello', 'placca', 'sombrero', 'ponyexpress', 'borraccia', 'pugnale', 'derringer', 'pepperbox', 'fucile', 'cancan', 'conestoga', 'howitzer',
      'giro', 'gattabuia', 'borseggio', 'sabotaggio', 'ragtime', 'pugno', 'springfield', 'sparo', 'schivata', 'sfida', 'rissa', 'mitraglia', 'stampede', 'bottega', 'candelotto'];
    var bangs = hand.filter(function (c) { return ty(c) === 'sparo'; }).length;
    for (var k = 0; k < order.length; k++) {
      var want = order[k];
      for (var i = 0; i < hand.length; i++) {
        var id = hand[i]; if (ty(id) !== want) continue;
        var info = E.playInfo(s, p, id);
        if (!info.ok) continue;
        if (E.WEAPONS.indexOf(want) >= 0) {
          var cur = E.weapon(P), cr = E.range(P), nr = D.TYPES[want].w;
          if (want === 'ripetitore') { if (cur != null || bangs < 2) continue; }
          else if (nr <= cr) continue;
        }
        if (want === 'giro' && P.hp >= P.max) continue;
        if (want === 'tequila' && P.hp >= P.max && !(info.targets || []).some(function (q) { return q !== p && friend(s, p, q); })) continue;
        if ((want === 'mitraglia' || want === 'stampede' || want === 'rissa') && P.role === 'vice' && sh.hp <= 1) continue;
        if (want === 'sfida' && bangs < 2) continue;
        if (info.extra && hand.length < 3 && want !== 'liquore') continue;
        var a = { a: 'play', card: id };
        if (info.extra) a.extra = extraFor(P, id);
        if (info.rissa) { if (P.role === 'vice' && info.rissa.indexOf(s.players.indexOf(sh)) >= 0 && info.rissa.length < 3) continue; return a; }
        if (info.targets) {
          var t;
          if (want === 'tequila') { t = info.targets.indexOf(p) >= 0 ? p : info.targets.filter(function (q) { return friend(s, p, q); })[0]; }
          else t = best(s, p, info.targets);
          if (t == null) continue;
          a.target = t;
          if (info.pick) a.pick = pickFrom(s, t);
        }
        return a;
      }
    }
    // Rimbalzo: colpisci una carta preziosa di un nemico
    var rc = E.ricochetInfo(s, p);
    if (rc.ok && rc.bangs.length >= 2) {
      var rt = best(s, p, rc.targets);
      if (rt != null) { var eq = s.players[rt].eq.slice().sort(byVal).pop(); if (val(eq) >= 6) return { a: 'ricochet', card: rc.bangs[0], target: rt, pick: eq }; }
    }
    if (E.has(s, p, 'docholy')) {
      var dh = E.abilityInfo(s, p, 'docholy');
      if (dh.ok && P.hand.length >= 4) { var dt = best(s, p, dh.targets); if (dt != null) return { a: 'ability', k: 'docholy', cards: low(P.hand, 2), target: dt }; }
    }
    return { a: 'end' };
  }
  return { decide: decide };
})();
if (typeof module !== 'undefined') module.exports = PPBot;
