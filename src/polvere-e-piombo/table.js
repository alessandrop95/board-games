/* ===== Il tavolo ovale visto dall'alto: tu sei in basso, gli altri seduti intorno nell'ordine vero dei turni ===== */
var PPTable = (function () {
  var D = PPData, E = PPEngine;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function tn(t) { return D.TYPES[t].n; }

  // posizione sul bordo del tavolo: k = posti dopo il tuo nel giro (0 = tu, in basso), in senso orario
  function pos(k, n) { var a = Math.PI / 2 + 2 * Math.PI * k / n; return { x: 50 + 50 * Math.cos(a), y: 50 + 50 * Math.sin(a), a: a }; }
  function order(g, me) {
    var n = g.players.length, base = me >= 0 ? me : 0, r = [];
    for (var k = 0; k < n; k++) r.push((base + k) % n);
    return r; // r[0] = chi siede in basso
  }
  function nextOf(g, p) {
    var n = g.players.length, dir = g.dir || 1;
    for (var k = 1; k < n; k++) { var q = ((p + dir * k) % n + n) % n; if (g.players[q].alive) return q; }
    return -1;
  }

  // perché un giocatore è (o non è) a tiro: "3 posti + Mustang = 4, la tua arma arriva a 2"
  function distWhy(g, me, i) {
    var al = E.aliveIdx(g), a = al.indexOf(me), b = al.indexOf(i), n = al.length;
    if (a < 0 || b < 0) return '';
    var seats = Math.min(Math.abs(a - b), n - Math.abs(a - b)), parts = [];
    if (E.evIs(g, 'agguato')) parts.push('Agguato: tutti a 1');
    var on = function (p, t) { return E.eqOn(g, p) && E.hasEq(g.players[p], t) != null; };
    if (on(i, 'cavallo')) parts.push('+ Mustang');
    if (on(i, 'rifugio')) parts.push('+ Riparo');
    if (E.has(g, i, 'wren')) parts.push('+ ' + D.CHAR.wren.n);
    if (on(me, 'cannocchiale')) parts.push('− Mirino');
    if (on(me, 'binocolo')) parts.push('− Binocolo');
    if (E.has(g, me, 'maggie')) parts.push('− ' + D.CHAR.maggie.n);
    var d = E.distance(g, me, i), r = E.rangeOf(g, me);
    var txt = seats + (seats === 1 ? ' posto' : ' posti') + (parts.length ? ' ' + parts.join(' ') + ' = ' + d : '');
    return txt + (d <= r ? ', a tiro' : ', arrivi a ' + r);
  }

  function bullets(P) { var s = '<span class="lv" aria-label="' + Math.max(P.hp, 0) + ' punti vita su ' + P.max + '">'; for (var i = 0; i < P.max; i++) s += '<i' + (i < P.hp ? '' : ' class="e"') + '></i>'; return s + '</span>'; }
  var HAND = '<svg class="hc" viewBox="0 0 11 14" aria-hidden="true"><rect x="1" y="1" width="9" height="12" rx="2"/></svg>';

  function seatHTML(g, i, me, k, n, ctx) {
    var P = g.players[i], C = D.CHAR[P.char], p = pos(k, n), top = g.stack[g.stack.length - 1];
    var cls = ['seat'], tag = '', badge = '';
    var isMe = i === me, isTurn = g.turn === i && g.phase === 'play', deciding = top && top.who === i && g.phase === 'play' && i !== g.turn;
    if (isMe) cls.push('mine');
    if (isTurn) cls.push('turn');
    if (deciding && !isTurn) cls.push('dec');
    if (p.y < 30) cls.push('top'); else if (p.y > 70) cls.push('bot');
    if (p.x < 30) cls.push('lft'); else if (p.x > 70) cls.push('rgt');
    var style = 'left:' + p.x.toFixed(2) + '%;top:' + p.y.toFixed(2) + '%';
    var sheriff = P.role === 'sceriffo';
    var known = sheriff || !P.alive || g.phase === 'over' || isMe;
    if (!P.alive) {
      cls.push('dead');
      return '<div class="' + cls.join(' ') + '" data-plate="' + i + '" style="' + style + '" role="button" tabindex="0" aria-label="' + esc(P.nick) + ', eliminato">' +
        '<span class="pt tomb"><b>R.I.P.</b></span><span class="nm">' + esc(P.nick) + '</span><span class="cn">' + D.ROLES[P.role].n + '</span><span class="tg out">non conta</span></div>';
    }
    if (P.ghost) cls.push('ghost');
    var d = null, inR = false;
    if (me >= 0 && !isMe && g.players[me].alive) { d = E.distance(g, me, i); inR = d <= E.rangeOf(g, me); }
    if (ctx.targets) {
      if (ctx.targets.indexOf(i) >= 0) { cls.push('target'); tag = '<span class="tg in">' + (ctx.verb || 'bersaglio') + '</span>'; }
      else if (!isMe) { cls.push('notarget'); tag = '<span class="tg out">' + (ctx.dist && d != null ? esc(distWhy(g, me, i)) : 'no') + '</span>'; }
    }
    if (!tag) {
      if (deciding && !isMe) tag = '<span class="tg dec">deve rispondere</span>';
      else if (isTurn && !isMe) tag = '<span class="tg turn">di turno</span>';
      else if (P.ghost) tag = '<span class="tg out">fantasma</span>';
      else if (ctx.next === i) tag = '<span class="tg nx">prossimo</span>';
      else if (d != null) tag = '<span class="tg ' + (inR ? 'in">a tiro' : 'out">fuori tiro') + '</span>';
    }
    if (d != null) { cls.push(inR ? 'in' : 'out'); badge = '<span class="dd ' + (inR ? 'in' : 'out') + '" title="' + esc(distWhy(g, me, i)) + '">' + d + '</span>'; }
    var jail = E.hasEq(P, 'gattabuia') != null;
    var eqs = P.eq.map(function (c) {
      var t = E.ty(c), K = D.TYPES[t], g2 = K.kind === 'g';
      return '<span class="eqm k-' + (K.w ? 'w' : K.kind) + (g2 && !E.greenReady(g, c) ? ' wait' : '') + '" data-card="' + c + '" title="' + esc(K.n + ' · ' + K.s) + '" style="background-image:url(img/c-' + t + '.jpg)"></span>';
    }).join('');
    var w = E.weapon(P), wtxt = (w != null ? tn(E.ty(w)) : 'Pistola') + ' · portata ' + E.rangeOf(g, i);
    var role = known && !sheriff ? '<span class="rl">' + D.ROLES[P.role].n + '</span>' : '';
    return '<div class="' + cls.join(' ') + '" data-plate="' + i + '" style="' + style + '" role="button" tabindex="0" aria-label="' + esc(P.nick) + ', ' + C.n + (d != null ? ', distanza ' + d : '') + '">' + badge +
      '<span class="pt" style="background-image:url(img/f-' + P.char + '.jpg)">' + (jail ? '<span class="bars" title="In Prigione"></span>' : '') + '</span>' +
      (sheriff ? '<span class="star" title="Sceriffo">★</span>' : '') +
      '<span class="nm">' + Net.dot(P.uid) + esc(P.nick) + (isMe ? ' <small>(tu)</small>' : '') + (P.bot ? ' <small class="auto">auto</small>' : '') + '</span>' +
      '<span class="cn">' + C.n + '</span>' + role +
      bullets(P) +
      '<span class="mt">' + (isMe ? '' : HAND + P.hand.length) + '<span class="eqs">' + eqs + '</span></span>' +
      (isMe ? '<span class="wp">' + wtxt + '</span>' : '<span class="wp sx">' + wtxt + '</span>') +
      '<span class="pw sx">' + C.s + '</span>' + tag + '</div>';
  }

  // frecce del giro: tra un posto e il successivo, nel verso di gioco; quelle tra te e il prossimo sono dorate
  function arrowsHTML(g, me, n, next) {
    var h = '', dir = g.dir || 1, ord = order(g, me);
    for (var k = 0; k < n; k++) {
      var a = Math.PI / 2 + 2 * Math.PI * (k + .5) / n, x = 50 + 37 * Math.cos(a), y = 50 + 37 * Math.sin(a);
      // tangente in senso orario: (-sin, cos); su un ovale alto (telefono) e largo (computer)
      var rp = Math.atan2(Math.cos(a) * 1.45, -Math.sin(a)) * 180 / Math.PI, rd = Math.atan2(Math.cos(a) * .62, -Math.sin(a)) * 180 / Math.PI;
      if (dir < 0) { rp += 180; rd += 180; }
      var from = dir > 0 ? ord[k] : ord[(k + 1) % n], to = dir > 0 ? ord[(k + 1) % n] : ord[k];
      var gold = me >= 0 && from === me && to === next;
      h += '<i class="arw' + (gold ? ' gold' : '') + '" style="left:' + x.toFixed(2) + '%;top:' + y.toFixed(2) + '%;--rp:' + rp.toFixed(1) + 'deg;--rd:' + rd.toFixed(1) + 'deg"></i>';
    }
    return h;
  }
  function aimHTML(g, me, n, targets) {
    if (!targets || me < 0) return '';
    var ord = order(g, me), h = '<svg class="aim" viewBox="0 0 100 100" preserveAspectRatio="none" aria-hidden="true">';
    targets.forEach(function (t) { var k = ord.indexOf(t); if (k < 0 || t === me) return; var p = pos(k, n); h += '<line x1="50" y1="100" x2="' + p.x.toFixed(2) + '" y2="' + p.y.toFixed(2) + '"/>'; });
    return h + '</svg>';
  }

  function centerHTML(g, ctx) {
    var dirTxt = (g.dir || 1) > 0 ? 'giro dei turni ↻' : 'giro al contrario ↺';
    var ev = '';
    if (g.ev) {
      var left = g.ev.deck.length;
      ev = '<div class="evslot"><span class="lbl">' + (g.ev.cur ? 'evento del giro' : 'eventi dal 2° giro') + '</span>' +
        (g.ev.cur ? PPCards.event(g.ev.cur, '', 'data-act="evinfo" role="button" tabindex="0"') : '<span data-act="evinfo" role="button" tabindex="0">' + PPCards.eventBack(D.EVENTS[g.ev.fin || 'mezzogiorno'].set) + '</span>') +
        '<span class="lbl sm">' + (left ? 'ne restano ' + left : 'ultimo evento') + '</span></div>';
    }
    var disc = g.disc.length ? PPCards.card(g.disc[g.disc.length - 1]) : '<div class="empty"></div>';
    return '<div class="mid' + (g.ev ? ' withev' : '') + '">' + ev +
      '<div class="piles"><div class="pile deck">' + PPCards.back() + '<span>mazzo ' + g.deck.length + '</span></div><div class="pile disc">' + disc + '<span>scarti</span></div></div><span class="dirlbl">' + dirTxt + '</span>' +
      '<div class="status"><div class="big">' + ctx.st.big + '</div>' + (ctx.st.small ? '<div class="small">' + ctx.st.small + '</div>' : '') + '</div></div>';
  }

  // ctx: { targets, verb, dist (spiega la distanza), st: {big, small} }
  function ringHTML(g, me, ctx) {
    var n = g.players.length, ord = order(g, me), next = me >= 0 ? nextOf(g, me) : -1;
    ctx.next = next;
    var seats = ord.map(function (i, k) { return seatHTML(g, i, me, k, n, ctx); }).join('');
    return '<section class="ring n' + n + '" aria-label="Il tavolo">' +
      '<div class="stage"><div class="oval"></div>' +
      '<div class="orbit"></div>' + arrowsHTML(g, me, n, next) + aimHTML(g, me, n, ctx.targets) +
      centerHTML(g, ctx) + seats + '</div></section>';
  }
  return { ringHTML: ringHTML, distWhy: distWhy, nextOf: nextOf };
})();
