/* ===== Gattomina: tavolo animato =====
   La vista resta montata; a ogni nuovo stato si animano le differenze: carte giocate, pescate, rubate,
   Soffio!, esplosioni, disinnesco, mescolate, sbirciate nella sfera. */
var TV = (function () {
  var st = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $id(i) { return document.getElementById(i); }
  function R(el) { if (!el) return null; var r = el.getBoundingClientRect(); return r.width ? r : null; }
  function mid(r) { return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : null; }
  function anim(el, frames, opts) { if (reduce || !el.animate) return Promise.resolve(); try { return el.animate(frames, opts).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }
  function later(ms, f) { return setTimeout(f, reduce ? 0 : ms); }
  function add(html, cls) { var d = document.createElement('div'); if (cls) d.className = cls; if (html != null) d.innerHTML = html; document.body.appendChild(d); return d; }

  function mount() {
    var root = $id('app');
    root.innerHTML = '<div class="tv" id="tv"><div class="tv-bg"></div>' +
      '<div class="tv-top"><span class="brand">Exploding Kittens</span><span class="info" id="tv-info"></span>' + Sound.buttonHTML() + '<button class="iconbtn" data-act="rules">Regole</button><span id="tv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="menu">Menu</button></div>' +
      '<div id="tv-banner"></div>' + Chat.dockHTML() +
      '<div class="tv-table" id="tv-table"><div class="tv-rug"></div><div id="tv-seats"></div>' +
      '<div class="tv-center"><div class="deck" id="tv-deck" data-act="drawtap"></div><div class="disc" id="tv-disc"></div></div>' +
      '<div class="playzone" id="tv-play"></div><div class="danger" id="tv-danger"></div></div>' +
      '<div class="tv-feed" id="tv-feed"></div><div class="tv-status" id="tv-status" aria-live="polite"></div><div class="tv-hand" id="tv-hand" aria-label="La tua mano"></div><div class="tv-actions" id="tv-actions"></div></div>';
    st = { code: App.code, prev: null, first: true, seatPos: {}, handRects: {}, pendKey: null, pendStart: 0, lastFx: 0 };
    st.timer = setInterval(tick, 200);
  }
  function unmount() { if (st) { clearInterval(st.timer); st = null; } }
  function mounted() { return !!(st && $id('tv') && st.code === App.code); }

  /* ---------- posti intorno al tavolo ---------- */
  function seatAngle(n, i, me) {
    if (me < 0) return 70 + 220 * (i + 0.5) / n;
    var m = n - 1, rel = (i - me + n) % n;
    return 70 + 220 * (rel - 0.5) / m;
  }
  function seatXY(th) { var t = th * Math.PI / 180; return { x: 50 - 42 * Math.sin(t), y: 50 + 40 * Math.cos(t) }; }
  function seatsHTML(g, me) {
    var out = '', dec = E.decider(g);
    g.players.forEach(function (P, i) {
      if (i === me) return;
      var th = seatAngle(g.players.length, i, me), p = seatXY(th); st.seatPos[i] = th;
      var turn = g.turn === i && g.phase === 'play' && P.alive, deciding = dec === i;
      var badge = !P.alive ? '<span class="sb out">esploso</span>' : g.wait && g.wait.who === i ? '<span class="sb dec">' + (g.wait.type === 'favor' ? 'regala…' : g.wait.type === 'insert' ? 'nasconde…' : 'fruga…') + '</span>' : turn && g.turns > 1 ? '<span class="sb x2">×' + g.turns + ' turni</span>' : '';
      out += '<button class="tseat' + (turn ? ' turn' : '') + (deciding ? ' deciding' : '') + (!P.alive ? ' dead' : '') + (g.phase === 'over' && g.winner === i ? ' winner' : '') + '" data-pl="' + i + '" style="left:' + p.x + '%;top:' + p.y + '%">' +
        '<span class="av">' + GMCards.avatar(i, !P.alive) + '</span>' +
        '<span class="nm">' + Net.dot(P.uid) + esc(P.nick) + (P.bot && P.alive ? ' <i>auto</i>' : '') + '</span>' +
        (P.alive ? '<span class="cnt"><b class="mini"></b>' + P.hand.length + '</span>' : '') + badge + '</button>';
    });
    return out;
  }
  function seatPoint(i) {
    var me = myIdx();
    if (i === me) { var h = R($id('tv-hand')); return h ? { x: h.left + h.width / 2, y: h.top + h.height * .55 } : null; }
    var el = document.querySelector('.tseat[data-pl="' + i + '"] .av'); return mid(R(el));
  }

  /* ---------- mano a ventaglio (una o due file) ---------- */
  function fanRow(n, w, cw, maxSpread) {
    var ch = cw * 1.4, spread = Math.min(maxSpread, n * 3.4), half = spread / 2 * Math.PI / 180;
    var over = Math.max(0, ch * 1.2 * Math.sin(half) - cw / 2 * (1 - Math.cos(half)));
    var avail = Math.max(0, w - 12 - cw - 2 * over), step = n > 1 ? Math.min(cw * 0.66, avail / (n - 1)) : 0, out = [];
    for (var i = 0; i < n; i++) { var f = n > 1 ? i / (n - 1) - 0.5 : 0; out.push({ x: (i - (n - 1) / 2) * step, y: f * f * spread, a: spread * f }); }
    return { cards: out, step: step };
  }
  function layoutHand(n, w, cw) {
    var one = fanRow(n, w, cw, 30);
    if (n < 8 || one.step >= cw * 0.42) return { two: false, cards: one.cards };
    var top = Math.ceil(n / 2), a = fanRow(top, w, cw, 12), b = fanRow(n - top, w, cw, 12), lift = cw * 1.4 * 0.56;
    return { two: true, cards: a.cards.map(function (c) { c.y -= lift; return c; }).concat(b.cards) };
  }
  function handState(g, me, c) {
    var P = g.players[me], t = E.ty(c), k = GMData.TYPES[t].k, free = g.phase === 'play' && g.turn === me && !g.pend && !g.wait && P.alive;
    if (g.pend && E.canNope(g, me)) return t === 'soffio' ? 'ok' : '';
    if (!free) return '';
    if (k === 'action') return 'ok';
    if (k === 'cat') return P.hand.filter(function (x) { return E.ty(x) === t; }).length >= 2 ? 'ok' : '';
    return '';
  }
  function renderHand(g, me) {
    var box = $id('tv-hand'); if (!box) return;
    if (me < 0) { box.innerHTML = '<div class="empty">Stai guardando la partita.</div>'; return; }
    var P = g.players[me];
    st.handRects = {};
    box.querySelectorAll('.card').forEach(function (el) { st.handRects[+el.dataset.c] = el.getBoundingClientRect(); });
    var have = {}; box.querySelectorAll('.card').forEach(function (el) { have[el.dataset.c] = el; });
    var emp = box.querySelector('.empty'); if (emp) emp.remove();
    var keep = {};
    var hand = P.hand.slice().sort(function (a, b) { return GMData.ORDER.indexOf(E.ty(a)) - GMData.ORDER.indexOf(E.ty(b)) || a - b; });
    hand.forEach(function (c) { var el = have[c]; if (!el) { var w = document.createElement('div'); w.innerHTML = GMCards.html(c); el = w.firstChild; if (!st.first) { el.classList.add('fresh'); setTimeout(function () { el.classList.remove('fresh'); }, 1200); } box.appendChild(el); } keep[c] = el; });
    Object.keys(have).forEach(function (c) { if (!keep[c]) have[c].remove(); });
    if (!hand.length) { box.classList.remove('two'); box.insertAdjacentHTML('beforeend', '<div class="empty">' + (P.alive ? 'Nessuna carta in mano.' : '👻 Sei esploso: guardi la fine della partita.') + '</div>'); return; }
    var w = box.clientWidth, sample = keep[hand[0]], cw = sample.offsetWidth || 86;
    var L0 = layoutHand(hand.length, w, cw), lay = L0.cards;
    if (box.classList.contains('two') !== L0.two) { box.classList.toggle('two', L0.two); cw = sample.offsetWidth || cw; lay = layoutHand(hand.length, w, cw).cards; }
    var sel = App.sel || [];
    hand.forEach(function (c, i) {
      var el = keep[c], L = lay[i], s = sel.indexOf(c) >= 0, hs = handState(g, me, c);
      el.classList.toggle('sel', s); el.classList.toggle('ok', hs === 'ok');
      el.style.zIndex = s ? 60 + i : i + 1;
      el.style.transform = 'translate(' + L.x.toFixed(1) + 'px,' + (L.y + (s ? -26 : hs === 'ok' ? -8 : 0)).toFixed(1) + 'px) rotate(' + L.a.toFixed(1) + 'deg)';
    });
  }

  /* ---------- centro del tavolo ---------- */
  function renderCenter(g) {
    var dk = $id('tv-deck'), n = g.deck.length, layers = Math.min(6, Math.ceil(n / 6));
    var stack = ''; for (var i = 0; i < layers; i++) stack += GMCards.back('layer', 'style="--i:' + i + '"');
    dk.innerHTML = stack + '<span class="dcount">' + n + '</span>';
    var bombs = E.bombsLeft(g) + (g.held != null ? 1 : 0), risk = n ? E.bombsLeft(g) / n : 0;
    dk.classList.toggle('hot', risk >= .2); dk.classList.toggle('warm', risk >= .1 && risk < .2);
    $id('tv-danger').innerHTML = '<img src="' + GMCards.src('1f4a3') + '" alt=""><b>' + bombs + '</b><span>' + (bombs === 1 ? 'Gattomina' : 'Gattomine') + ' nel mazzo · rischio <em>' + Math.round(risk * 100) + '%</em></span>';
    $id('tv-danger').style.setProperty('--risk', Math.min(1, risk * 2.5).toFixed(2));
    var pendCards = g.pend ? g.pend.cards.concat(discNopes(g)) : [];
    var top = g.disc.filter(function (c) { return pendCards.indexOf(c) < 0; }).slice(-1)[0];
    var dc = $id('tv-disc'), want = top == null ? 'none' : String(top);
    if (dc.dataset.top !== want) { dc.dataset.top = want; dc.innerHTML = top == null ? '<div class="slot">scarti</div>' : GMCards.html(top); }
    var pz = $id('tv-play'), key = g.pend ? g.pend.id + ':' + g.pend.chain.length : '';
    if (pz.dataset.key !== key) {
      pz.dataset.key = key;
      if (!g.pend) { pz.innerHTML = ''; pz.classList.remove('on'); }
      else {
        var f = g.pend, off = f.chain.length % 2 === 1;
        pz.classList.add('on'); pz.classList.toggle('off', off);
        var t0 = E.ty(f.cards[0]), T0 = GMData.TYPES[t0];
        pz.style.setProperty('--c1', GMCards.LOOK[t0].c1); pz.style.setProperty('--c2', GMCards.LOOK[t0].c2);
        pz.innerHTML = '<div class="ann">' +
          '<div class="pcards n' + f.cards.length + '">' + f.cards.map(function (c, j) { return GMCards.html(c, '', 'style="--j:' + j + ';--n:' + f.cards.length + '"'); }).join('') +
          '<div class="nopes">' + discNopes(g).map(function (c, j) { return GMCards.html(c, 'nopec', 'style="--j:' + j + '"'); }).join('') + '</div></div>' +
          '<div class="atext"><div class="who">' + annWho(g, f) + '</div><div class="cname">' + annName(f) + '</div><div class="eff">' + annEffect(g, f) + '</div>' +
          '<div class="astate">' + annState(g, f) + '</div></div>' +
          '<div class="bar"><i></i><span></span></div></div>';
        if (st.pendKey !== key) { st.pendKey = key; st.pendStart = Date.now(); st.pendDur = f.dur || E.NOPE_MS; }
      }
    }
  }
  /* ---------- annuncio della carta giocata: chi, cosa, su chi, che effetto avrà ---------- */
  function nameOf(g, i) { if (!g.players[i]) return ''; return i === myIdx() ? '<b class="me">tu</b>' : '<b>' + esc(g.players[i].nick) + '</b>'; }
  function annWho(g, f) { return (f.by === myIdx() ? '<b class="me">Hai giocato</b>' : nameOf(g, f.by) + ' gioca') + (f.target != null ? ' contro ' + (f.target === myIdx() ? '<b class="me">di te</b>' : nameOf(g, f.target)) : ''); }
  function annName(f) {
    var t = E.ty(f.cards[0]), T = GMData.TYPES;
    return f.kind === 'pair' ? 'Coppia di ' + T[t].n : f.kind === 'trio' ? 'Tris di ' + T[t].n : f.kind === 'five' ? 'Cinque carte diverse' : T[f.kind].n;
  }
  function annEffect(g, f) {
    var me = myIdx(), byMe = f.by === me, tgMe = f.target === me, by = nameOf(g, f.by), tg = f.target != null ? nameOf(g, f.target) : '';
    var T = GMData.TYPES;
    switch (f.kind) {
      case 'agguato': {
        var nx = E.nextAlive(g, f.by), n = (g.turns > 1 ? g.turns : 0) + 2;
        return '⚔️ ' + (byMe ? 'Non peschi e passi la mano' : by + ' non pesca e passa la mano') + ': ' + (nx === me ? '<b class="me">dovrai</b>' : nameOf(g, nx) + ' dovrà') + ' fare <b class="big">' + n + ' turni</b> di fila!';
      }
      case 'pisolino': return '💤 ' + (byMe ? 'Finisci ' : by + ' finisce ') + (g.turns > 1 ? 'uno dei turni' : 'il turno') + ' <b>senza pescare</b>.';
      case 'fusa': return '🎁 ' + (tgMe ? '<b class="me">Dovrai regalare</b> a ' + by + ' una carta a tua scelta.' : byMe ? tg + ' <b>dovrà regalarti</b> una carta a sua scelta.' : tg + ' dovrà <b>regalare una carta</b> a scelta a ' + by + '.');
      case 'gomitolo': return '🧶 Il mazzo verrà <b>mescolato</b>: chi sapeva dov’è la Gattomina non lo saprà più.';
      case 'sfera': return '🔮 ' + (byMe ? 'Guarderai' : by + ' guarderà') + ' di nascosto <b>le prime 3 carte</b> del mazzo.';
      case 'pair': return '🐾 ' + (byMe ? '<b>Rubi una carta a caso</b> dalla mano di ' + tg : tgMe ? by + ' <b class="me">ti ruba una carta a caso</b> dalla mano' : by + ' <b>ruba una carta a caso</b> dalla mano di ' + tg) + '.';
      case 'trio': return '🐾 ' + (byMe ? 'Chiedi a ' + tg + ' una <b>' + T[f.name].n + '</b>: se ce l’ha, deve dartela.' : tgMe ? by + ' <b class="me">ti chiede</b> una <b>' + T[f.name].n + '</b>: se ce l’hai, devi dargliela.' : by + ' chiede a ' + tg + ' una <b>' + T[f.name].n + '</b>: se ce l’ha, deve dargliela.');
      case 'five': return '♻️ ' + (byMe ? '<b>Prendi la carta che vuoi</b>' : by + ' <b>prende la carta che vuole</b>') + ' dalla pila degli scarti.';
    }
    return '';
  }
  function annState(g, f) {
    var k = f.chain.length;
    if (!k) return '<span class="wait">Qualcuno risponde con un <b>Soffio!</b>?</span>';
    var last = f.chain[k - 1], off = k % 2 === 1, who = last === myIdx() ? '<b class="me">Hai soffiato</b>' : nameOf(g, last) + ' ha soffiato';
    return off ? '<span class="no">💨 ' + who + ': <b>la carta è annullata!</b></span>' : '<span class="yes">💨 ' + who + ' sul Soffio!: <b>la carta torna valida!</b></span>';
  }
  function discNopes(g) { if (!g.pend || !g.pend.chain.length) return []; return g.disc.filter(function (c) { return E.ty(c) === 'soffio'; }).slice(-g.pend.chain.length); }

  /* ---------- timer: anello del turno e conto alla rovescia dei Soffio! ---------- */
  function tick() {
    if (!st || !App.doc || !App.doc.game) return;
    var d = App.doc, g = d.game;
    var s = Turns.secs(d), el = document.querySelector('.tseat.deciding .av');
    if (el) { var p = s && d.turnSince ? Math.min(1, (Date.now() - d.turnSince) / (s * 1000)) : 0; el.style.setProperty('--p', (1 - p).toFixed(3)); }
    var bar = document.querySelector('#tv-play .bar');
    if (bar && g.pend) {
      var left = Math.max(0, st.pendDur - (Date.now() - st.pendStart));
      bar.style.setProperty('--q', (left / st.pendDur).toFixed(3));
      var sp = bar.querySelector('span'); if (sp) sp.textContent = left > 0 ? Math.ceil(left / 1000) + ' s' : '…';
      var nb = document.querySelector('[data-act="nope"] em'); if (nb) nb.textContent = Math.ceil(left / 1000) + 's';
    }
  }

  /* ---------- effetti ---------- */
  function ghost(html, r, w) {
    var d = document.createElement('div'); d.innerHTML = html; var el = d.firstChild; el.classList.add('flyc');
    el.style.setProperty('--cw', w + 'px'); el.style.left = (r.x - w / 2) + 'px'; el.style.top = (r.y - w * .7) + 'px';
    document.body.appendChild(el); return el;
  }
  function fly(html, from, to, opt) {
    opt = opt || {}; if (!from || !to) return Promise.resolve();
    var w = opt.w || 74, el = ghost(html, to, w), dx = from.x - to.x, dy = from.y - to.y, rot = (Math.random() - .5) * 40;
    el.style.visibility = 'hidden';
    return new Promise(function (done) {
      later(opt.delay || 0, function () {
        el.style.visibility = '';
        anim(el, [{ transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + rot + 'deg) scale(' + (opt.s0 || .6) + ')', opacity: opt.o0 == null ? 1 : opt.o0 },
          { transform: 'translate(' + dx * .4 + 'px,' + (dy * .4 - 50) + 'px) rotate(' + rot / 2 + 'deg) scale(1.08)', opacity: 1, offset: .55 },
          { transform: 'translate(0,0) rotate(0) scale(' + (opt.s1 || 1) + ')', opacity: opt.o1 == null ? 1 : opt.o1 }], { duration: opt.dur || 560, easing: 'cubic-bezier(.25,.8,.25,1)', fill: 'forwards' })
          .then(function () { if (opt.keep) { done(el); return; } el.remove(); done(); });
        if (reduce) { el.remove(); done(); }
      });
    });
  }
  function floatAt(pt, html, cls, dur) {
    if (!pt) return; var f = add(html, 'float ' + (cls || '')); f.style.left = pt.x + 'px'; f.style.top = pt.y + 'px';
    anim(f, [{ transform: 'translate(-50%,-30%) scale(.5)', opacity: 0 }, { transform: 'translate(-50%,-80%) scale(1.15)', opacity: 1, offset: .2 }, { transform: 'translate(-50%,-200%) scale(1)', opacity: 0 }], { duration: dur || 1500, easing: 'ease-out' }).then(function () { f.remove(); });
    if (reduce) setTimeout(function () { f.remove(); }, 1200);
  }
  function stamp(text, cls) {
    var s = add(null, 'stamp ' + (cls || '')); s.textContent = text;
    anim(s, [{ transform: 'translate(-50%,-50%) rotate(-10deg) scale(2.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1)', opacity: 1, offset: .15 }, { transform: 'translate(-50%,-50%) rotate(-8deg) scale(1.03)', opacity: 1, offset: .75 }, { transform: 'translate(-50%,-60%) rotate(-8deg)', opacity: 0 }], { duration: 1300, easing: 'ease-out' }).then(function () { s.remove(); });
    if (reduce) setTimeout(function () { s.remove(); }, 900);
  }
  function shake(el) { el = el || $id('tv'); if (!el || reduce) return; el.classList.remove('shake'); void el.offsetWidth; el.classList.add('shake'); setTimeout(function () { el.classList.remove('shake'); }, 650); }
  function particles(pt, codes, n, spread) {
    if (!pt || reduce) return;
    for (var i = 0; i < n; i++) (function (i) {
      var im = document.createElement('img'); im.className = 'particle'; im.src = GMCards.src(codes[i % codes.length]); im.style.left = pt.x + 'px'; im.style.top = pt.y + 'px';
      var s = 26 + Math.random() * 30; im.style.width = s + 'px'; document.body.appendChild(im);
      var a = Math.random() * Math.PI * 2, r = (spread || 140) * (.4 + Math.random() * .8);
      anim(im, [{ transform: 'translate(-50%,-50%) scale(.3) rotate(0)', opacity: 1 }, { transform: 'translate(calc(-50% + ' + Math.cos(a) * r + 'px), calc(-50% + ' + (Math.sin(a) * r + 60) + 'px)) scale(1) rotate(' + (Math.random() * 600 - 300) + 'deg)', opacity: 0 }], { duration: 900 + Math.random() * 600, easing: 'cubic-bezier(.2,.7,.4,1)' }).then(function () { im.remove(); });
    })(i);
  }
  function bigCard(id, label) {
    var c = mid(R($id('tv-table'))) || { x: innerWidth / 2, y: innerHeight / 2 };
    var el = ghost(GMCards.html(id, 'big'), c, Math.min(200, innerWidth * .5)); el.classList.add('center');
    return el;
  }
  function boom(p, card) {
    Sound.play('fuse'); later(1450, function () { Sound.play('boom'); });
    var deck = mid(R($id('tv-deck'))), el = bigCard(card);
    anim(el, [{ transform: 'scale(.3) rotateY(180deg)', filter: 'brightness(.3)' }, { transform: 'scale(1.05) rotateY(0)', filter: 'brightness(1)', offset: .3 }, { transform: 'scale(1) rotate(-3deg)', offset: .45 }, { transform: 'scale(1.06) rotate(3deg)', offset: .6 }, { transform: 'scale(1) rotate(-3deg)', offset: .75 }, { transform: 'scale(1.1) rotate(0)' }], { duration: 1500, easing: 'ease-in-out' }).then(function () {
      var c = mid(R(el)); el.remove();
      var flashEl = add(null, 'whiteflash'); anim(flashEl, [{ opacity: .95 }, { opacity: 0 }], { duration: 700 }).then(function () { flashEl.remove(); });
      var b = add('<img src="' + GMCards.src('1f4a5') + '" alt="">', 'boomfx'); b.style.left = c.x + 'px'; b.style.top = c.y + 'px';
      anim(b, [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 1 }, { transform: 'translate(-50%,-50%) scale(2.6)', opacity: 1, offset: .5 }, { transform: 'translate(-50%,-50%) scale(3.2)', opacity: 0 }], { duration: 900, easing: 'ease-out' }).then(function () { b.remove(); });
      particles(c, ['1f525', '1f4a5', '2728', '1f4ab'], 18, 220); shake();
      stamp('BOOM!', 'red');
      var sp = seatPoint(p); if (sp && p !== myIdx()) later(400, function () { floatAt(sp, '<img src="' + GMCards.src('1f47b') + '" alt="" style="width:54px">', 'ghostup', 2200); });
    });
  }
  function defuse(p, card, def) {
    Sound.play('fuse'); later(1500, function () { Sound.play('defuse'); });
    var el = bigCard(card), c = mid(R($id('tv-table')));
    var sparks = add('<img src="' + GMCards.src('2728') + '" alt="">', 'fuse'); sparks.style.left = (c.x + 40) + 'px'; sparks.style.top = (c.y - 90) + 'px';
    anim(el, [{ transform: 'scale(.3) rotateY(180deg)' }, { transform: 'scale(1.05) rotateY(0)', offset: .3 }, { transform: 'scale(1) rotate(-4deg)', offset: .5 }, { transform: 'scale(1.04) rotate(4deg)', offset: .7 }, { transform: 'scale(1)' }], { duration: 1300 }).then(function () {
      var from = seatPoint(p);
      fly(GMCards.html(def), from, c, { w: 120, dur: 520 }).then(function () {
        sparks.remove(); stamp('Disinnescata!', 'green'); particles(c, ['1f41f', '2728', '1f96b'], 10, 140);
        anim(el, [{ transform: 'scale(1)', opacity: 1 }, { transform: 'scale(.7)', opacity: 0 }], { duration: 500, delay: 700, fill: 'forwards' }).then(function () { el.remove(); });
      });
    });
    if (reduce) { el.remove(); sparks.remove(); }
  }
  function shuffleFx() {
    var dk = $id('tv-deck'); if (!dk || reduce) return;
    var r = mid(R(dk));
    for (var i = 0; i < 8; i++) (function (i) {
      var g = ghost(GMCards.back(), r, 60), side = i % 2 ? 1 : -1;
      anim(g, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + side * 46 + 'px,' + (-10 - i * 2) + 'px) rotate(' + side * 14 + 'deg)', offset: .4 }, { transform: 'translate(0,' + (-i) + 'px) rotate(0)' }], { duration: 700, delay: i * 60, easing: 'ease-in-out' }).then(function () { g.remove(); });
    })(i);
    floatAt({ x: r.x, y: r.y - 40 }, '<img src="' + GMCards.src('1f9f6') + '" alt="" style="width:46px">', '', 1300);
  }
  function paws(from, to) {
    if (!from || !to || reduce) return;
    for (var i = 0; i < 5; i++) (function (i) {
      var t = (i + 1) / 6, im = document.createElement('img'); im.className = 'particle'; im.src = GMCards.src('1f43e');
      im.style.width = '30px'; im.style.left = (from.x + (to.x - from.x) * t) + 'px'; im.style.top = (from.y + (to.y - from.y) * t + (i % 2 ? 8 : -8)) + 'px'; document.body.appendChild(im);
      anim(im, [{ transform: 'translate(-50%,-50%) scale(.2)', opacity: 0 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .3 }, { transform: 'translate(-50%,-50%) scale(1)', opacity: 0 }], { duration: 900, delay: i * 120, fill: 'backwards' }).then(function () { im.remove(); });
    })(i);
  }
  function confetti() {
    if (reduce) return;
    var codes = ['1f389', '2728', '1f451', '1f63b', '1f3c6'];
    for (var i = 0; i < 36; i++) (function (i) {
      var im = document.createElement('img'); im.className = 'particle'; im.src = GMCards.src(codes[i % codes.length]); im.style.width = (20 + Math.random() * 22) + 'px';
      im.style.left = (Math.random() * innerWidth) + 'px'; im.style.top = '-40px'; document.body.appendChild(im);
      anim(im, [{ transform: 'translate(0,0) rotate(0)' }, { transform: 'translate(' + (Math.random() - .5) * 160 + 'px,' + (innerHeight + 80) + 'px) rotate(' + (Math.random() * 720 - 360) + 'deg)' }], { duration: 2400 + Math.random() * 1600, delay: Math.random() * 800, easing: 'cubic-bezier(.3,.2,.6,1)', fill: 'backwards' }).then(function () { im.remove(); });
    })(i);
  }
  function deckPoint() { return mid(R($id('tv-deck'))); }
  function playPoint() { return mid(R($id('tv-play'))) || deckPoint(); }
  function discPoint() { return mid(R($id('tv-disc'))); }
  function handPoint(c) { var r = st.handRects[c]; return r ? { x: r.left + r.width / 2, y: r.top + r.height / 2 } : seatPoint(myIdx()); }

  function effects(g, me, prev) {
    var f = g.flash; if (!f || f.n <= st.lastFx) return;
    st.lastFx = f.n;
    var mine = f.p === me;
    switch (f.kind) {
      case 'play': {
        Sound.play(f.cards.length > 1 ? 'cats' : 'play');
        var to = playPoint(), pzEl = $id('tv-play'); pzEl.classList.add('incoming'); later(560 + f.cards.length * 80, function () { pzEl.classList.remove('incoming'); });
        f.cards.forEach(function (c, j) { fly(GMCards.html(c), mine ? handPoint(c) : seatPoint(f.p), to, { w: 70, delay: j * 80, o1: 0, s0: mine ? 1 : .4 }); });
        if (f.target != null) later(450, function () { var t = seatPoint(f.target); if (t) floatAt(t, '🎯', 'emoji', 1200); });
        break;
      }
      case 'nope':
        later(380, function () { Sound.play('nope'); });
        fly(GMCards.html(f.card), mine ? handPoint(f.card) : seatPoint(f.p), playPoint(), { w: 70, o1: 0, s0: mine ? 1 : .4, dur: 420 }).then(function () { stamp('Soffio!', 'red'); shake($id('tv-play')); particles(playPoint(), ['1f4a8', '1f4a2'], 6, 90); });
        break;
      case 'cancel': { Sound.play('cancel'); var pz = playPoint(); floatAt(pz, 'Niente da fare!', 'word', 1400); break; }
      case 'attack': Sound.play('attack'); paws(seatPoint(f.p), seatPoint(f.t)); later(700, function () { floatAt(seatPoint(f.t), '×' + f.turns, 'word big', 1700); if (f.t === me) stamp('Agguato!', 'orange'); }); break;
      case 'skip': Sound.play('skip'); floatAt(seatPoint(f.p), '<img src="' + GMCards.src('1f4a4') + '" alt="" style="width:46px">', '', 1800); break;
      case 'shuffle': Sound.play('shuffle'); shuffleFx(); break;
      case 'future': Sound.play('future'); if (!mine) floatAt(seatPoint(f.p), '<img src="' + GMCards.src('1f440') + '" alt="" style="width:46px">', '', 1800); break;
      case 'draw': Sound.play('draw'); later(60, function () { fly(mine ? GMCards.html(f.card) : GMCards.back(), deckPoint(), seatPoint(f.p), { w: mine ? 86 : 54, s0: 1, s1: mine ? 1 : .5, o1: mine ? 1 : 0 }); }); break;
      case 'steal': case 'give': { Sound.play('steal');
        var from = f.kind === 'steal' ? f.t : f.p, to2 = f.kind === 'steal' ? f.p : f.t, show = from === me || to2 === me;
        fly(show ? GMCards.html(f.card) : GMCards.back(), seatPoint(from), seatPoint(to2), { w: 64, s1: .8, o1: .2 });
        break;
      }
      case 'take': Sound.play('steal'); fly(GMCards.html(f.card), discPoint(), seatPoint(f.p), { w: 64, s1: .8, o1: .2 }); break;
      case 'miss': Sound.play('miss'); floatAt(seatPoint(f.t), 'Non ce l’ha!', 'word', 1400); break;
      case 'defuse': defuse(f.p, f.card, f.def); break;
      case 'boom': boom(f.p, f.card); break;
      case 'insert': Sound.play('insert'); if (!reduce) fly(GMCards.back(), seatPoint(f.p), deckPoint(), { w: 60, s1: .9, o1: 0 }).then(function () { floatAt(deckPoint(), 'Shhh…', 'word', 1300); }); break;
    }
  }

  /* ---------- aggiornamento ---------- */
  // aggiorna solo se cambia: così un tocco a metà di un aggiornamento non va perso
  function setHTML(id, h) { var el = $id(id); if (el && el.__h !== h) { el.__h = h; el.innerHTML = h; } }
  function update(doc) {
    if (!mounted()) mount();
    var g = doc.game, me = myIdx();
    var alive = g.players.filter(function (P) { return P.alive; }).length;
    setHTML('tv-info', '<b>' + connInfo(alive + ' in gioco') + '</b><small>Tavolo ' + esc(doc.code) + '</small>');
    setHTML('tv-banner', hostBanner());
    setHTML('tv-seats', seatsHTML(g, me));
    renderCenter(g);
    setHTML('tv-status', statusLine(g, me));
    var lastN = st.feedN || 0;
    setHTML('tv-feed', g.log.filter(function (l) { return l.k !== 'turn' && l.k !== 'draw'; }).slice(-2).map(function (l) { return '<div class="k-' + l.k + (l.n > lastN && !st.first ? ' fresh' : '') + '">' + esc(l.t) + '</div>'; }).join(''));
    st.feedN = g.logN;
    renderHand(g, me);
    setHTML('tv-actions', actionsHTML(g, me));
    if (st.first) { st.lastFx = g.flash ? g.flash.n : 0; if (g.logN <= 2) later(300, dealFx); }
    else effects(g, me, st.prev);
    if (g.phase === 'over' && st.prev && st.prev.phase !== 'over') later(1900, function () { confetti(); Sound.play(g.winner === me ? 'win' : 'lose'); var w = seatPoint(g.winner); if (w) floatAt(w, '<img src="' + GMCards.src('1f451') + '" alt="" style="width:60px">', '', 2600); });
    else if (st.prev && g.turn !== st.prev.turn && g.turn === me && g.phase === 'play' && g.players[me].alive) later(500, function () { banner(g.turns > 1 ? 'Tocca a te! ×' + g.turns : 'Tocca a te!'); Sound.play('turn'); });
    st.prev = { turn: g.turn, phase: g.phase };
    st.first = false;
  }
  function dealFx() {
    Sound.play('shuffle'); setTimeout(function () { Sound.play('deal'); }, 500);
    if (reduce || !App.doc || !App.doc.game) return;
    var g = App.doc.game, me = myIdx(), d = deckPoint(); if (!d) return;
    var k = 0;
    g.players.forEach(function (P, i) { for (var j = 0; j < 3; j++) fly(GMCards.back(), d, seatPoint(i), { w: 54, delay: (k++) * 70, s1: .5, o1: 0 }); });
    banner('Si gioca!', 'Pesca senza esplodere…');
  }
  function banner(text, sub) {
    var b = add('<div>' + text + '</div>' + (sub ? '<small>' + sub + '</small>' : ''), 'banner');
    anim(b.firstChild, [{ transform: 'scale(.3) rotate(-8deg)', opacity: 0 }, { transform: 'scale(1.12) rotate(3deg)', opacity: 1, offset: .2 }, { transform: 'scale(1) rotate(-2deg)', offset: .3 }, { transform: 'scale(1) rotate(-2deg)', opacity: 1, offset: .8 }, { transform: 'scale(.8) rotate(-2deg)', opacity: 0 }], { duration: 1600, easing: 'ease-out' });
    anim(b, [{ opacity: 1 }, { opacity: 1 }], { duration: 1600 }).then(function () { b.remove(); });
    if (reduce) setTimeout(function () { b.remove(); }, 1200);
  }

  function actionsHTML(g, me) {
    if (me < 0 || g.phase !== 'play') return g.phase === 'over' ? '<button class="btn block" data-act="showover">Classifica</button>' : '';
    var P = g.players[me];
    if (!P.alive) return '';
    if (P.bot) return '<button class="btn block" data-act="resume">Riprendo io</button>';
    var out = '';
    if (g.pend) {
      var off = g.pend.chain.length % 2 === 1, mineAct = g.pend.by === me, pk = g.pend.id + ':' + g.pend.chain.length;
      var passed = g.pend.passed.indexOf(me) >= 0 || App.passedKey === pk;
      if (E.canNope(g, me) && !passed) out += '<div class="row2"><button class="btn nope" data-act="nope">💨 ' + (off ? 'Soffio! sul Soffio!' : 'Soffio!') + ' <em></em></button><button class="btn ghost" data-act="pass">Lascia passare</button></div>' +
        '<div class="hint">' + (off && mineAct ? 'Ti hanno soffiato contro: rispondi per salvare la tua carta.' : off ? 'Se soffi, la carta torna valida.' : 'Se soffi, la carta non avrà effetto.') + '</div>';
      else out += '<div class="hint">' + (passed ? 'Hai lasciato passare. ' : E.canNope(g, me) ? '' : (g.pend.chain.length ? g.pend.chain[g.pend.chain.length - 1] === me : g.pend.by === me) ? 'Ora tocca agli altri decidere. ' : 'Non hai un Soffio! in mano. ') + 'Si aspettano le risposte…</div>';
    }
    var w = g.wait;
    if (w && w.who === me) out += '<button class="btn block" data-act="decide">' + (w.type === 'favor' ? 'Scegli la carta da regalare' : w.type === 'insert' ? 'Rimetti la Gattomina nel mazzo' : 'Scegli una carta dagli scarti') + '</button>';
    if (g.turn === me && !g.pend && !g.wait) {
      var sel = App.sel || [], kind = sel.length ? E.comboKind(sel) : null;
      var lbl = kind === 'pair' ? 'Gioca la coppia (ruba)' : kind === 'trio' ? 'Gioca il tris (chiedi una carta)' : kind === 'five' ? 'Gioca 5 diverse (scarti)' : kind ? 'Gioca ' + GMData.TYPES[kind].n : '';
      var risk = g.deck.length ? E.bombsLeft(g) / g.deck.length : 0;
      out += '<div class="row2">' + (sel.length ? '<button class="btn' + (kind ? '' : ' ghost') + '" data-act="playsel"' + (kind ? '' : ' disabled') + '>' + (kind ? lbl : 'Combinazione non valida') + '</button>' : '') +
        '<button class="btn draw' + (risk >= .2 ? ' hot' : '') + '" data-act="draw"><img src="' + GMCards.src('1f4a3') + '" alt="">Pesca e finisci il turno</button></div>';
    }
    if (g.peek && g.peek.p === me && g.peek.cards.length) out += '<button class="btn ghost small" data-act="peek">👀 Rivedi la Sfera</button>';
    return out;
  }
  return { update: update, unmount: unmount, mounted: mounted, stamp: stamp };
})();
