/* ===== Polvere & Piombo: animazioni "come al tavolo vero" =====
   A ogni nuovo stato confronta la situazione precedente con quella nuova e anima le differenze:
   carte che volano (giocate, pescate, rubate, messe in gioco), colpi, ferite, cure, eliminazioni, estrazioni. */
var FX = (function () {
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var prev = null, rects = null, lastFlash = 0, lastLogN = 0, hidden = {}, tumbleTimer = null;

  /* ---------- utilità ---------- */
  function R(el) { if (!el) return null; var r = el.getBoundingClientRect(); return r.width ? { x: r.left, y: r.top, w: r.width, h: r.height } : null; }
  function mid(r) { return r ? { x: r.x + r.w / 2, y: r.y + r.h / 2 } : null; }
  function anim(el, frames, opts) {
    if (reduce || !el.animate) return Promise.resolve();
    try { return el.animate(frames, opts).finished.catch(function () {}); } catch (e) { return Promise.resolve(); }
  }
  function add(html, cls) { var d = document.createElement('div'); if (cls) d.className = cls; if (html != null) d.innerHTML = html; document.body.appendChild(d); return d; }
  function later(ms, f) { setTimeout(f, reduce ? 0 : ms); }
  function plateEl(i) { return document.querySelector('[data-plate="' + i + '"]'); }
  function seatRect(i) { // dove "siede" il giocatore i sullo schermo
    if (i === myIdx()) { var me = document.querySelector('.me > .card') || document.querySelector('.me'); return R(me) || R(document.querySelector('.hand')); }
    var p = plateEl(i); return p ? R(p.querySelector('.ph') || p) : null;
  }
  function board() { return document.querySelector('.board'); }
  function shakeScreen() { var b = board(); if (!b || reduce) return; b.classList.remove('screen-shake'); void b.offsetWidth; b.classList.add('screen-shake'); setTimeout(function () { b.classList.remove('screen-shake'); }, 600); }
  function shakePlate(i, cls) { var p = plateEl(i); if (!p || reduce) return; p.classList.remove(cls); void p.offsetWidth; p.classList.add(cls); setTimeout(function () { p.classList.remove(cls); }, 650); }
  function floatText(pt, text, cls, rise) {
    if (!pt) return; var f = add(null, 'float ' + (cls || '')); f.textContent = text; f.style.left = pt.x + 'px'; f.style.top = pt.y + 'px';
    anim(f, [{ transform: 'translate(-50%,-30%) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-80%) scale(1.15)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-' + (rise || 190) + '%) scale(1)', opacity: 0 }], { duration: 1500, easing: 'ease-out' }).then(function () { f.remove(); });
    if (reduce) setTimeout(function () { f.remove(); }, 1200);
  }
  function stamp(text, cls) {
    var s = add(null, 'stamp ' + (cls || '')); s.textContent = text;
    anim(s, [{ transform: 'translate(-50%,-50%) rotate(-8deg) scale(2.4)', opacity: 0 }, { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1)', opacity: 1, offset: .16 },
      { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1.02)', opacity: 1, offset: .75 }, { transform: 'translate(-50%,-56%) rotate(-8deg) scale(1)', opacity: 0 }], { duration: 1250, easing: 'ease-out' }).then(function () { s.remove(); });
    if (reduce) setTimeout(function () { s.remove(); }, 900);
  }
  var BURST = '<svg viewBox="0 0 100 100"><path d="M50 2l9 22 20-14-5 24 24-3-17 17 19 13-24 5 11 21-22-9-6 23-11-21-17 17 1-24-23 6 15-19-21-11 24-4-9-22 22 10z" fill="#ffd54a" stroke="#3a0d05" stroke-width="3"/><path d="M50 18l6 14 13-8-3 15 15-2-11 11 12 8-15 3 7 13-14-6-4 14-7-13-11 11 1-15-14 4 9-12-13-7 15-3-6-13 14 6z" fill="#ff7a2a"/></svg>';
  function burst(pt, word, delay) {
    if (!pt) return;
    later(delay || 0, function () {
      var b = add(BURST + '<b>' + word + '</b>', 'burst'); b.style.left = pt.x + 'px'; b.style.top = pt.y + 'px';
      anim(b, [{ transform: 'scale(.2) rotate(-30deg)', opacity: 0 }, { transform: 'scale(1.1) rotate(4deg)', opacity: 1, offset: .25 }, { transform: 'scale(1) rotate(0)', opacity: 1, offset: .7 }, { transform: 'scale(.9)', opacity: 0 }], { duration: 950, easing: 'ease-out' }).then(function () { b.remove(); });
      if (reduce) setTimeout(function () { b.remove(); }, 700);
    });
  }
  function muzzle(pt) {
    if (!pt) return; var f = add(null, 'flashdot'); f.style.left = pt.x + 'px'; f.style.top = pt.y + 'px';
    anim(f, [{ transform: 'scale(.3)', opacity: 1 }, { transform: 'scale(1.5)', opacity: 0 }], { duration: 320, easing: 'ease-out' }).then(function () { f.remove(); });
    if (reduce) f.remove();
  }
  function tracer(a, b, delay) {
    if (!a || !b) return Promise.resolve();
    return new Promise(function (done) {
      later(delay || 0, function () {
        var dx = b.x - a.x, dy = b.y - a.y, len = Math.sqrt(dx * dx + dy * dy), ang = Math.atan2(dy, dx) * 180 / Math.PI;
        var t = add(null, 'tracer'); t.style.left = a.x + 'px'; t.style.top = a.y + 'px'; t.style.width = len + 'px'; t.style.transform = 'rotate(' + ang + 'deg)';
        muzzle(a);
        anim(t, [{ transform: 'rotate(' + ang + 'deg) scaleX(0)', opacity: 1 }, { transform: 'rotate(' + ang + 'deg) scaleX(1)', opacity: 1, offset: .55 }, { transform: 'rotate(' + ang + 'deg) scaleX(1) translateX(' + len * .3 + 'px)', opacity: 0 }], { duration: 300, easing: 'ease-in' })
          .then(function () { t.remove(); done(); });
        if (reduce) { t.remove(); done(); }
      });
    });
  }
  function dustAt(pt, n, spread) {
    if (!pt || reduce) return;
    for (var i = 0; i < n; i++) (function (i) {
      var d = add(null, 'dust'), s = 26 + Math.random() * 40, a = Math.random() * Math.PI * 2, r = (spread || 50) * (0.5 + Math.random());
      d.style.width = d.style.height = s + 'px'; d.style.left = (pt.x - s / 2) + 'px'; d.style.top = (pt.y - s / 2) + 'px';
      anim(d, [{ transform: 'translate(0,0) scale(.4)', opacity: .9 }, { transform: 'translate(' + Math.cos(a) * r + 'px,' + (Math.sin(a) * r - 20) + 'px) scale(1.4)', opacity: 0 }], { duration: 900 + Math.random() * 500, easing: 'ease-out' }).then(function () { d.remove(); });
    })(i);
  }
  function shells(pt, n) {
    if (!pt || reduce) return;
    for (var i = 0; i < n; i++) (function (i) {
      var s = add(null, 'shell'); s.style.left = pt.x + 'px'; s.style.top = pt.y + 'px';
      var dx = (Math.random() - .5) * 90, rot = (Math.random() - .5) * 720;
      anim(s, [{ transform: 'translate(0,0) rotate(0)', opacity: 1 }, { transform: 'translate(' + dx * .6 + 'px,-46px) rotate(' + rot * .4 + 'deg)', opacity: 1, offset: .3 }, { transform: 'translate(' + dx + 'px,90px) rotate(' + rot + 'deg)', opacity: 0 }],
        { duration: 900, delay: i * 120, easing: 'cubic-bezier(.3,.1,.7,1)', fill: 'backwards' }).then(function () { s.remove(); });
    })(i);
  }

  /* ---------- carte che volano ---------- */
  function cardGhost(id, faceUp, w) {
    var html = faceUp && id != null ? PPCards.card(id) : PPCards.back();
    var g = add(html); var el = g.firstChild; g.remove(); el.classList.add('fx-card'); el.style.setProperty('--cw', w + 'px'); document.body.appendChild(el); return el;
  }
  function hideDest(id) { hidden[id] = true; reapply(); }
  function showDest(id) { delete hidden[id]; document.querySelectorAll('[data-card="' + id + '"]').forEach(function (e) { e.style.visibility = ''; }); }
  function reapply() { Object.keys(hidden).forEach(function (id) { document.querySelectorAll('.hand [data-card="' + id + '"], .eqs [data-card="' + id + '"], .pile [data-card="' + id + '"], .store [data-card="' + id + '"]').forEach(function (e) { e.style.visibility = 'hidden'; }); }); }
  function fly(id, from, to, opt) {
    opt = opt || {};
    if (!from || !to) { if (opt.hide) showDest(id); return; }
    var w = Math.max(40, Math.min(110, opt.w || to.w || 66)), h = w * 1.4;
    var flip = opt.flip, el = cardGhost(id, flip ? false : opt.face, w);
    var ex = to.x + to.w / 2 - w / 2, ey = to.y + to.h / 2 - h / 2;
    el.style.left = ex + 'px'; el.style.top = ey + 'px';
    var sx = from.x + from.w / 2 - (ex + w / 2), sy = from.y + from.h / 2 - (ey + h / 2), s0 = from.card ? from.w / w : .45, rot = (Math.random() - .5) * 30;
    var mx = sx * .45, my = sy * .45 - Math.min(80, Math.abs(sx) * .25 + 30);
    later(opt.delay || 0, function () {
      if (!opt.silent) Sound.play('card');
      if (flip) setTimeout(function () { var n = cardGhost(id, true, w); n.style.left = el.style.left; n.style.top = el.style.top; el.replaceWith(n); el = n; anim(el, [{ transform: 'scaleX(0)' }, { transform: 'scaleX(1)' }], { duration: 180, easing: 'ease-out' }).then(end); }, reduce ? 0 : 300);
      var a = anim(el, [
        { transform: 'translate(' + sx + 'px,' + sy + 'px) rotate(' + rot + 'deg) scale(' + s0 + ')', opacity: from.card ? 1 : 0 },
        { transform: 'translate(' + mx + 'px,' + my + 'px) rotate(' + rot * .4 + 'deg) scale(' + ((s0 + 1) / 2 + .12) + ')', opacity: 1, offset: .55 },
        { transform: 'translate(0,0) rotate(0) scale(1)', opacity: 1 }
      ], { duration: flip ? 300 : 560, easing: flip ? 'ease-in' : 'cubic-bezier(.25,.8,.25,1)', fill: 'both' });
      function end() {
        if (opt.toPlate) anim(el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.3)', opacity: 0 }], { duration: 220 }).then(function () { el.remove(); });
        else { el.remove(); if (opt.hide) showDest(id); if (opt.land) opt.land(); }
      }
      if (!flip) a.then(end);
      el.style.visibility = 'visible';
    });
    if (opt.delay && !reduce) el.style.visibility = 'hidden';
  }
  function locate(players, disc) {
    var m = {};
    players.forEach(function (P, i) { P.hand.forEach(function (c) { m[c] = { k: 'hand', p: i }; }); P.eq.forEach(function (c) { m[c] = { k: 'eq', p: i }; }); });
    return m;
  }
  function fromRect(id, loc, me, inDisc) {
    if (loc) {
      var r = rects.cards[id];
      if (r && (loc.k === 'eq' || (loc.k === 'hand' && loc.p === me))) return { x: r.x, y: r.y, w: r.w, h: r.h, card: true };
      var p = loc.p === me ? rects.me : rects.plates[loc.p]; if (p) return { x: p.x + p.w * .2, y: p.y + p.h * .2, w: p.w * .3, h: p.h * .3 };
    }
    if (inDisc && rects.disc) return Object.assign({ card: true }, rects.disc);
    return rects.deck ? Object.assign({ card: true }, rects.deck) : null;
  }

  /* ---------- istantanee ---------- */
  function snapshot(g) {
    return { key: g.players.map(function (P) { return P.uid; }).join('|'), seq: g.seq,
      players: g.players.map(function (P) { return { hand: P.hand.slice(), eq: P.eq.slice(), hp: P.hp, alive: P.alive }; }),
      disc: g.disc.slice(), deckN: g.deck.length, turn: g.turn, phase: g.phase, store: (function () { var t = g.stack[g.stack.length - 1]; return t && t.type === 'store' ? t.cards.slice() : null; })() };
  }
  function domRects() {
    var o = { plates: {}, cards: {}, deck: null, disc: null, me: null };
    document.querySelectorAll('[data-plate]').forEach(function (el) { o.plates[el.getAttribute('data-plate')] = R(el); });
    document.querySelectorAll('.hand [data-card], .eqs [data-card], .pile [data-card], .store [data-card]').forEach(function (el) { o.cards[el.getAttribute('data-card')] = R(el); });
    o.deck = R(document.querySelector('.pile.deck .card')); o.disc = R(document.querySelector('.pile.disc .card, .pile.disc .empty'));
    o.me = R(document.querySelector('.me > .card') || document.querySelector('.me'));
    return o;
  }
  function before() { rects = domRects(); }

  /* ---------- effetti di gioco ---------- */
  function shot(p, t, kind) {
    Sound.play('shot');
    var a = mid(seatRect(p)), b = mid(seatRect(t));
    if (!a || !b) { stamp('Bang!'); return; }
    tracer(a, b).then(function () { burst(b, 'BANG!'); shakePlate(t, 'shake'); });
  }
  function gatling(p) {
    Sound.play('gatling');
    var a = mid(seatRect(p)), g = App.doc.game; if (!a) return;
    burst(a, 'RA-TA-TA!');
    var k = 0;
    g.players.forEach(function (P, i) { if (i === p || !P.alive) return; var b = mid(seatRect(i)); for (var j = 0; j < 3; j++) tracer(a, b, 120 + (k++) * 70); });
    later(300, shakeScreen); shells(a, 6);
  }
  function stampede() {
    Sound.play('stampede');
    stamp('Stampede!', 'small'); shakeScreen();
    if (reduce) return;
    var H = window.innerHeight;
    for (var i = 0; i < 26; i++) (function (i) {
      var d = add(null, 'dust'), s = 60 + Math.random() * 90, y = H * (.25 + Math.random() * .6);
      d.style.width = d.style.height = s + 'px'; d.style.left = (-s) + 'px'; d.style.top = y + 'px';
      anim(d, [{ transform: 'translateX(0) scale(.6)', opacity: 0 }, { transform: 'translateX(' + window.innerWidth * .5 + 'px) scale(1.2)', opacity: .9, offset: .4 }, { transform: 'translateX(' + (window.innerWidth + s * 2) + 'px) scale(1.6)', opacity: 0 }],
        { duration: 1600 + Math.random() * 700, delay: i * 45, easing: 'ease-in-out' }).then(function () { d.remove(); });
    })(i);
    later(500, shakeScreen);
  }
  var DUEL = '<svg viewBox="0 0 100 100"><g fill="#2b2b2b" stroke="#f3d58a" stroke-width="2.5"><path d="M18 30l46 0 4-4 12 0 0 10-10 0 0 4-30 0-8 20-12 0 6-20-8 0z" transform="rotate(35 50 50)"/><path d="M18 30l46 0 4-4 12 0 0 10-10 0 0 4-30 0-8 20-12 0 6-20-8 0z" transform="scale(-1 1) translate(-100 0) rotate(35 50 50)"/></g></svg>';
  function duel(a, b) {
    Sound.play('duel');
    var A = mid(seatRect(a)), B = mid(seatRect(b)); stamp('Sfida!', 'small');
    if (!A || !B) return;
    var d = add(DUEL, 'duel-ico'); d.style.left = (A.x + B.x) / 2 + 'px'; d.style.top = (A.y + B.y) / 2 + 'px';
    anim(d, [{ transform: 'scale(.2) rotate(-90deg)', opacity: 0 }, { transform: 'scale(1.15) rotate(8deg)', opacity: 1, offset: .3 }, { transform: 'scale(1) rotate(0)', opacity: 1, offset: .8 }, { transform: 'scale(.8)', opacity: 0 }], { duration: 1500, easing: 'ease-out' }).then(function () { d.remove(); });
  }
  function hit(i, n) {
    Sound.play(n >= 3 ? 'boom' : 'hit');
    var r = seatRect(i), c = mid(r); if (!c) return;
    if (n >= 3) { burst(c, 'BOOM!'); dustAt(c, 14, 90); shakeScreen(); }
    var s = add(null, 'splat'); s.style.left = (r.x - 10) + 'px'; s.style.top = (r.y - 10) + 'px'; s.style.width = (r.w + 20) + 'px'; s.style.height = (r.h + 20) + 'px';
    anim(s, [{ opacity: 0 }, { opacity: 1, offset: .15 }, { opacity: 0 }], { duration: 900 }).then(function () { s.remove(); });
    if (reduce) s.remove();
    shakePlate(i, 'shake'); floatText(c, '−' + n, 'neg'); shells({ x: c.x, y: c.y + 10 }, Math.min(n, 3));
  }
  function heal(i, n) { Sound.play('heal'); var c = mid(seatRect(i)); floatText(c, '+' + n, 'ok'); if (c && !reduce) for (var k = 0; k < 6; k++) later(k * 80, function () { floatText({ x: c.x + (Math.random() - .5) * 60, y: c.y + (Math.random() - .5) * 30 }, '✦', 'ok word', 260); }); }
  function death(i) {
    Sound.play('death');
    var r = seatRect(i), c = mid(r); stamp('Eliminato', 'red');
    if (!c) return;
    var t = add(null); t.style.cssText = 'position:fixed;z-index:51;pointer-events:none;width:84px;height:88px;border-radius:5px;background:url(img/tomb.jpg) center/cover;box-shadow:0 8px 18px rgba(0,0,0,.6);left:' + (c.x - 42) + 'px;top:' + (c.y - 44) + 'px';
    anim(t, [{ transform: 'translateY(-260px) rotate(-12deg)', opacity: 0 }, { transform: 'translateY(0) rotate(3deg)', opacity: 1, offset: .45 }, { transform: 'translateY(-10px) rotate(-1deg)', offset: .58 }, { transform: 'translateY(0) rotate(0)', opacity: 1, offset: .8 }, { opacity: 0 }], { duration: 1900, easing: 'ease-in' }).then(function () { t.remove(); });
    later(850, function () { dustAt({ x: c.x, y: c.y + 40 }, 10, 70); shakeScreen(); });
    if (reduce) t.remove();
  }
  function dodge(i) { Sound.play('ricochet'); var c = mid(seatRect(i)); shakePlate(i, 'dodge'); floatText(c, 'Mancato!', 'ok word'); }
  function reveal(id, cap, good) {
    Sound.play('check');
    var html = '<div class="cap">' + cap + '</div>';
    var r = add(html, 'reveal'); var g = cardGhost(id, true, 132); g.classList.remove('fx-card'); g.style.position = 'relative'; r.insertBefore(g, r.firstChild);
    if (good != null) r.insertAdjacentHTML('beforeend', '<div class="verdict ' + (good ? 'good' : 'bad') + '">' + (good ? 'Fortuna!' : 'Niente da fare') + '</div>');
    r.style.transform = 'translate(-50%,-50%)';
    anim(g, [{ transform: 'rotateY(180deg) scale(.7)', filter: 'brightness(.2)' }, { transform: 'rotateY(0) scale(1.05)', filter: 'brightness(1)', offset: .35 }, { transform: 'rotateY(0) scale(1)' }], { duration: 700, easing: 'ease-out' });
    anim(r, [{ opacity: 0 }, { opacity: 1, offset: .08 }, { opacity: 1, offset: .82 }, { opacity: 0 }], { duration: 2100 }).then(function () { r.remove(); });
    if (reduce) setTimeout(function () { r.remove(); }, 1800);
  }
  function banner(text, sub) {
    var b = add('<div>' + text + '</div>' + (sub ? '<small>' + sub + '</small>' : ''), 'banner');
    anim(b.firstChild, [{ transform: 'translateX(-120vw) skewX(-12deg)' }, { transform: 'translateX(4vw) skewX(4deg)', offset: .22 }, { transform: 'translateX(0) skewX(0)', offset: .3 }, { transform: 'translateX(0)', offset: .78 }, { transform: 'translateX(120vw) skewX(-12deg)' }], { duration: 1700, easing: 'ease-in-out' });
    anim(b, [{ opacity: 1 }, { opacity: 1 }], { duration: 1700 }).then(function () { b.remove(); });
    if (reduce) setTimeout(function () { b.remove(); }, 1200);
  }
  var STAR = '<svg viewBox="0 0 24 24"><path fill="COL" d="M12 1.8l2.4 4.6 5.1-.9-1.3 5 3.6 3.6-5 1.4-.3 5.2L12 18l-4.5 2.7-.3-5.2-5-1.4 3.6-3.6-1.3-5 5.1.9z"/></svg>';
  function confetti() {
    if (reduce) return;
    var cols = ['#f3d58a', '#d9a845', '#e2604c', '#f4e7c9', '#7fa0aa'];
    for (var i = 0; i < 46; i++) (function (i) {
      var c = add(STAR.replace('COL', cols[i % cols.length]), 'confetti'), x = Math.random() * window.innerWidth, s = 10 + Math.random() * 14;
      c.style.left = x + 'px'; c.style.top = '-20px'; c.style.width = c.style.height = s + 'px';
      anim(c, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + (Math.random() - .5) * 160 + 'px,' + (window.innerHeight + 40) + 'px) rotate(' + (Math.random() * 900 - 450) + 'deg)' }], { duration: 2200 + Math.random() * 1600, delay: Math.random() * 700, easing: 'cubic-bezier(.3,.2,.6,1)', fill: 'backwards' }).then(function () { c.remove(); });
    })(i);
  }
  function deal(g, me) {
    Sound.play('shuffle'); setTimeout(function () { Sound.play('deal'); }, 600);
    if (reduce) return;
    banner('Si apre il saloon', 'Lo Sceriffo comincia');
    var deck = rects && rects.deck ? rects.deck : R(document.querySelector('.pile.deck .card')); if (!deck) return;
    var k = 0;
    g.players.forEach(function (P, i) {
      if (i === me) { P.hand.forEach(function (c) { var el = document.querySelector('.hand [data-card="' + c + '"]'); if (el) { hideDest(c); fly(c, Object.assign({ card: true }, deck), R(el), { flip: true, hide: true, delay: 500 + (k++) * 110 }); } }); return; }
      var to = R(plateEl(i)); if (!to) return;
      for (var j = 0; j < Math.min(P.hand.length, 4); j++) fly(null, Object.assign({ card: true }, deck), { x: to.x + to.w * .3, y: to.y + to.h * .2, w: 48, h: 67 }, { w: 48, toPlate: true, delay: 500 + (k++) * 90 });
    });
  }
  function tumbleweed() {
    clearTimeout(tumbleTimer);
    if (reduce) return;
    tumbleTimer = setTimeout(function () {
      var felt = document.querySelector('.felt');
      if (felt && !document.hidden) {
        var svg = '<svg viewBox="0 0 60 60"><g fill="none" stroke="#b08a52" stroke-width="1.6" stroke-linecap="round">';
        for (var i = 0; i < 16; i++) { var a = Math.random() * 6.28, b = a + 1 + Math.random() * 2.5, r1 = 10 + Math.random() * 18, r2 = 10 + Math.random() * 18;
          svg += '<path d="M' + (30 + Math.cos(a) * r1).toFixed(1) + ' ' + (30 + Math.sin(a) * r1).toFixed(1) + ' Q30 30 ' + (30 + Math.cos(b) * r2).toFixed(1) + ' ' + (30 + Math.sin(b) * r2).toFixed(1) + '"/>'; }
        svg += '<circle cx="30" cy="30" r="24"/></g></svg>';
        var t = document.createElement('div'); t.className = 'tumble'; t.innerHTML = svg; felt.appendChild(t);
        var W = felt.clientWidth + 120;
        anim(t, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + W * .25 + 'px,-14px) rotate(260deg)', offset: .25 }, { transform: 'translate(' + W * .5 + 'px,0) rotate(520deg)', offset: .5 }, { transform: 'translate(' + W * .75 + 'px,-10px) rotate(780deg)', offset: .75 }, { transform: 'translate(' + W + 'px,0) rotate(1040deg)' }], { duration: 7000, easing: 'linear' }).then(function () { t.remove(); });
      }
      tumbleweed();
    }, 35000 + Math.random() * 50000);
  }
  function motes() {
    if (reduce || document.querySelector('.motes')) return;
    var m = document.createElement('div'); m.className = 'motes';
    for (var i = 0; i < 18; i++) { var e = document.createElement('i'); e.style.left = (Math.random() * 100) + '%'; e.style.animationDuration = (14 + Math.random() * 18) + 's'; e.style.animationDelay = (-Math.random() * 30) + 's'; e.style.setProperty('--dx', ((Math.random() - .5) * 120) + 'px'); m.appendChild(e); }
    document.body.insertBefore(m, document.body.firstChild);
  }

  /* ---------- confronto tra lo stato vecchio e quello nuovo ---------- */
  function after(doc) {
    var g = doc && doc.game;
    if (!g) { prev = null; rects = null; return; }
    motes(); if (!tumbleTimer) tumbleweed();
    var me = myIdx(), key = g.players.map(function (P) { return P.uid; }).join('|');
    if (!prev || prev.key !== key || g.seq < prev.seq) {
      var fresh = !prev && g.logN <= 4 && g.phase === 'play';
      if (fresh || (prev && prev.key !== key)) deal(g, me);
      prev = snapshot(g); lastFlash = g.flash ? g.flash.n : 0; lastLogN = g.logN; rects = null; return;
    }
    if (!rects) { prev = snapshot(g); return; }
    var oldLoc = locate(prev.players), newLoc = locate(g.players);
    var oldDisc = {}; prev.disc.forEach(function (c) { oldDisc[c] = 1; });
    var k = 0, LIM = 10;
    // carte finite negli scarti
    var nd = g.disc.length >= prev.disc.length ? g.disc.slice(prev.disc.length) : g.disc.slice(-1).filter(function (c) { return !oldDisc[c]; });
    var discEl = document.querySelector('.pile.disc .card');
    nd.slice(-4).forEach(function (c) {
      var from = fromRect(c, oldLoc[c], me, false), to = R(discEl);
      if (c === g.disc[g.disc.length - 1]) hideDest(c);
      fly(c, from, to, { face: true, hide: c === g.disc[g.disc.length - 1], delay: (k++) * 110 });
    });
    // carte arrivate in mano o in gioco
    Object.keys(newLoc).forEach(function (cs) {
      if (k >= LIM) return;
      var c = +cs, n = newLoc[c], o = oldLoc[c];
      if (o && o.k === n.k && o.p === n.p) return;
      var inStore = prev.store && prev.store.indexOf(c) >= 0;
      var from = inStore ? (rects.cards[c] ? Object.assign({ card: true }, rects.cards[c]) : null) : fromRect(c, o, me, !!oldDisc[c]);
      var fromVisible = (o && (o.k === 'eq' || o.p === me)) || oldDisc[c] || inStore;
      if (n.k === 'hand' && n.p === me) {
        var el = document.querySelector('.hand [data-card="' + c + '"]'); if (!el) return;
        hideDest(c); fly(c, from, R(el), { face: fromVisible, flip: !fromVisible, hide: true, delay: (k++) * 120 });
      } else if (n.k === 'eq') {
        var chip = document.querySelector('.eqs [data-card="' + c + '"]'), tr = R(chip) || seatRect(n.p);
        if (chip) hideDest(c);
        fly(c, from, tr ? { x: tr.x, y: tr.y - 30, w: 66, h: tr.h + 60 } : null, { face: true, w: 66, hide: !!chip, delay: (k++) * 120, land: function () { var p = plateEl(n.p); if (p && !reduce) anim(p, [{ transform: 'rotate(var(--tilt)) scale(1.04)' }, { transform: 'rotate(var(--tilt)) scale(1)' }], { duration: 260 }); } });
      } else {
        var to = seatRect(n.p); if (!to) return;
        fly(c, from, { x: to.x, y: to.y, w: 48, h: 67 }, { face: fromVisible, w: 48, toPlate: true, delay: (k++) * 110 });
      }
    });
    // banco della Bottega
    var top = g.stack[g.stack.length - 1];
    if (top && top.type === 'store' && !prev.store) top.cards.forEach(function (c, j) { var el = document.querySelector('.store [data-card="' + c + '"]'); if (el) { hideDest(c); fly(c, rects.deck ? Object.assign({ card: true }, rects.deck) : null, R(el), { flip: true, hide: true, delay: j * 140 }); } });
    // eventi
    var f = g.flash;
    if (f && f.n > lastFlash) {
      lastFlash = f.n;
      if (f.kind === 'bang') later(150, function () { shot(f.p, f.t); });
      else if (f.kind === 'check') {
        var why = (g.log.filter(function (l) { return l.k === 'draw'; }).slice(-1)[0] || {}).t || '';
        reveal(f.card, esc(g.players[f.p].nick) + ' estrae' + (why.indexOf(' per ') > 0 ? ' per ' + esc(why.split(' per ')[1].split(':')[0]) : ''), null);
      } else if (f.kind === 'card') {
        var t = PPData.CARDS[f.card].t;
        if (t === 'mitraglia') later(250, function () { gatling(f.p); });
        else if (t === 'stampede') later(250, stampede);
        else if (t === 'sfida' && top && top.type === 'duel') later(250, function () { duel(top.a, top.b); });
        else if (t === 'giro') floatText(mid(R(document.querySelector('.felt'))), 'Salute!', 'ok word', 260);
        if (t === 'giro') Sound.play('cheers'); else if (t === 'cassaforte') Sound.play('safe'); else if (t === 'posta') Sound.play('post'); else if (t === 'bottega') Sound.play('shopbell'); else if (t === 'gattabuia') Sound.play('jail');
        else if (t === 'cassaforte' || t === 'posta') floatText(mid(seatRect(f.p)), t === 'posta' ? 'Posta!' : 'Colpo in banca!', 'word', 220);
      }
    }
    // nuove righe del registro: schivate
    g.log.forEach(function (l) {
      if (l.n <= lastLogN) return;
      if (l.k === 'miss') { var who = whoIn(g, l.t); if (who >= 0) later(200, function () { dodge(who); }); }
    });
    lastLogN = g.logN;
    // ferite, cure, eliminazioni
    g.players.forEach(function (P, i) {
      var o = prev.players[i]; if (!o) return;
      if (o.alive && !P.alive) later(400, function () { death(i); });
      else if (P.hp < o.hp) later(350, function () { hit(i, o.hp - P.hp); });
      else if (P.hp > o.hp) later(250, function () { heal(i, P.hp - o.hp); });
    });
    // cambio di turno e fine partita
    if (g.phase === 'over' && prev.phase !== 'over') later(900, function () { stamp(g.winner === 'legge' ? 'Vince la legge!' : g.winner === 'banditi' ? 'Vincono i banditi!' : 'Vince il traditore!', 'small'); confetti(); Sound.play('win'); });
    else if (g.turn !== prev.turn && g.phase === 'play' && g.turn === me && g.players[me].alive) later(700, function () { banner('Tocca a te!'); Sound.play('turn'); });
    prev = snapshot(g); rects = null;
  }
  function whoIn(g, text) { var best = -1, len = 0; g.players.forEach(function (P, i) { if (text.indexOf(P.nick) === 0 && P.nick.length > len) { best = i; len = P.nick.length; } }); return best; }
  function esc(s) { return String(s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function reset() { prev = null; rects = null; hidden = {}; }
  return { before: before, after: after, reapply: reapply, reset: reset, stamp: stamp, banner: banner };
})();
