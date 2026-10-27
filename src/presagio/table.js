/* ===== Presagio: tavolo animato "come dal vivo" =====
   La vista resta montata e ad ogni nuovo stato anima solo le differenze:
   carte che volano dal giocatore al centro, presa che va al vincitore, distribuzione a inizio mano. */
var TV = (function () {
  var st = null; // stato della vista montata
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  function $id(i) { return document.getElementById(i); }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(el, frames, opts) {
    if (reduce || !el.animate) return Promise.resolve();
    try { var a = el.animate(frames, opts); return a.finished.catch(function () {}); } catch (e) { return Promise.resolve(); }
  }
  function center(r) { return { x: r.left + r.width / 2, y: r.top + r.height / 2 }; }
  function hash(n) { n = (n * 2654435761) % 4294967296; return (n / 4294967296) - 0.5; }

  function mount() {
    var root = $id('app');
    root.innerHTML = '<div class="tv" id="tv"><div class="tv-sky"></div>' +
      '<div class="tv-top"><span class="brand">Presagio</span><span class="info" id="tv-info"></span>' + Sound.buttonHTML() + '<button class="iconbtn" data-act="scores">Punti</button><span id="tv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="menu">Menu</button></div>' +
      '<div id="tv-banner" class="tv-banner"></div>' + Chat.dockHTML() +
      '<div class="tv-table" id="tv-table"><div class="tv-oval"></div><div class="tv-trump" id="tv-trump"></div><div class="tv-pr" id="tv-pr"></div><div class="tv-msg" id="tv-msg"></div><div class="tv-zone" id="tv-zone"></div><div id="tv-seats"></div></div>' +
      '<div class="tv-status" id="tv-status" aria-live="polite"></div><div class="tv-me" id="tv-me"></div><div class="tv-hand" id="tv-hand" aria-label="La tua mano"></div><div class="tv-actions" id="tv-actions"></div></div>';
    st = { code: App.code, round: null, shown: [], sweptN: 0, running: false, latest: null, handRects: {}, flashN: 0, scoredRound: 0, first: true, seatPos: {} };
    if (!st.timer) st.timer = setInterval(tickTimer, 500);
  }
  function unmount() { if (st) { clearInterval(st.timer); st = null; } }
  function mounted() { return !!(st && $id('tv') && st.code === App.code); }

  /* ---------- posti intorno al tavolo ---------- */
  function seatAngle(g, i, me) {
    var k = g.players.length;
    if (me < 0) return 62 + 236 * (i + 0.5) / k;
    if (i === me) return 0;
    var m = k - 1, rel = (i - me + k) % k; // 1 = alla mia sinistra (gioca dopo di me)
    return 62 + 236 * (rel - 0.5) / m;
  }
  function seatXY(theta) { var t = theta * Math.PI / 180; return { x: 50 - 41 * Math.sin(t), y: 52 + 38 * Math.cos(t) }; }
  function seatsHTML(g, me) {
    var out = '';
    g.players.forEach(function (P, i) {
      if (i === me) return;
      var th = seatAngle(g, i, me), p = seatXY(th);
      st.seatPos[i] = th;
      var turn = g.turn === i && g.phase !== 'over';
      out += '<button class="tv-seat' + (turn ? ' turn' : '') + (P.bot ? ' bot' : '') + '" data-pl="' + i + '" style="left:' + p.x + '%;top:' + p.y + '%">' +
        '<span class="tv-ava">' + esc((P.nick || '?').charAt(0).toUpperCase()) + (g.dealer === i ? '<span class="dl" title="Mazziere">M</span>' : '') + '</span>' +
        '<span class="nm">' + Net.dot(P.uid) + esc(P.nick) + '</span>' + gemsHTML(P, bidHidden(g, i, me)) + '<span class="sc">' + P.score + ' pt' + (P.bot ? ' · auto' : '') + '</span></button>';
    });
    st.seatPos[me] = 0;
    return out;
  }
  function gemsHTML(P, hide) {
    if (P.bid == null) return '<span class="gems"><span class="nb">prevede…</span></span>';
    if (hide) { // previsione coperta: si vede solo che c'è, più le prese già fatte
      var t = ''; for (var k = 0; k < P.tricks; k++) t += '<i class="tk"></i>';
      return '<span class="gems sealed" title="Previsione coperta · ' + P.tricks + (P.tricks === 1 ? ' presa' : ' prese') + '"><span class="seal" aria-label="previsione coperta"></span>' + (t || '<span class="nb">coperta</span>') + '</span>';
    }
    var n = Math.max(P.bid, P.tricks), s = '';
    for (var i = 0; i < n; i++) s += '<i class="' + (i < P.tricks ? (i < P.bid ? 'on' : 'over') : '') + '"></i>';
    if (!n) s = '<span class="nb">0 prese</span>';
    return '<span class="gems' + (P.tricks === P.bid ? ' hit' : '') + '" title="' + P.tricks + ' su ' + P.bid + '">' + s + '</span>';
  }
  // punto (in px, relativo alla pagina) del posto di un giocatore
  function seatPoint(i) {
    var me = myIdx();
    if (i === me) { var h = $id('tv-hand').getBoundingClientRect(); return { x: h.left + h.width / 2, y: h.top + h.height * 0.6 }; }
    var el = document.querySelector('.tv-seat[data-pl="' + i + '"] .tv-ava');
    if (el) return center(el.getBoundingClientRect());
    var t = $id('tv-table').getBoundingClientRect(); return { x: t.left + t.width / 2, y: t.top };
  }
  // posizione della carta di un giocatore nella presa (relativa al centro della zona)
  function slot(i, c) {
    var t = $id('tv-table').getBoundingClientRect(), th = (st.seatPos[i] || 0) * Math.PI / 180;
    var rx = Math.min(t.width * 0.17, 120), ry = Math.min(t.height * 0.17, 80);
    return { x: -Math.sin(th) * rx, y: Math.cos(th) * ry, r: (st.seatPos[i] - 180) / 12 + hash(c + 7) * 14 };
  }

  /* ---------- presa al centro (animazioni in coda) ---------- */
  function cardEl(c, i) {
    var wrap = document.createElement('div'); wrap.innerHTML = PRCards.html(c); var el = wrap.firstChild;
    var s = slot(i, c); el.style.left = s.x + 'px'; el.style.top = s.y + 'px'; el.style.transform = 'rotate(' + s.r.toFixed(1) + 'deg)';
    el.dataset.p = i; return el;
  }
  function flyIn(c, i) {
    var zone = $id('tv-zone'), el = cardEl(c, i);
    zone.appendChild(el);
    var end = center(el.getBoundingClientRect()), from = st.handRects[c] ? center(st.handRects[c]) : seatPoint(i);
    var dx = from.x - end.x, dy = from.y - end.y, s = slot(i, c);
    st.shown.push({ c: c, p: i, el: el });
    var CC = PRData.CARDS[c]; Sound.play(CC.k === 'w' ? 'wizard' : CC.k === 'j' ? 'jester' : 'play', { v: CC.v });
    return anim(el, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) rotate(' + (s.r - 25) + 'deg) scale(' + (st.handRects[c] ? 1.1 : .45) + ')', opacity: st.handRects[c] ? 1 : 0 },
      { transform: 'translate(0,0) rotate(' + s.r + 'deg) scale(1.08)', opacity: 1, offset: .82 },
      { transform: 'rotate(' + s.r + 'deg) scale(1)', opacity: 1 }
    ], { duration: 420, easing: 'cubic-bezier(.2,.8,.2,1)' });
  }
  function clearZone(fade) {
    var els = st.shown.map(function (x) { return x.el; }); st.shown = [];
    if (!fade) { els.forEach(function (e) { e.remove(); }); return Promise.resolve(); }
    return Promise.all(els.map(function (e) { return anim(e, [{ opacity: 1 }, { opacity: 0 }], { duration: 200 }).then(function () { e.remove(); }); }));
  }
  async function sweep(L) {
    // completa la presa (se manca l'ultima carta), illumina la vincente, poi la manda al vincitore
    for (var k = 0; k < L.cards.length; k++) {
      var t = L.cards[k];
      if (!st.shown.some(function (x) { return x.c === t.c; })) await flyIn(t.c, t.p);
    }
    var winEl = st.shown.filter(function (x) { return x.c === L.cards[L.wi].c; })[0];
    if (winEl) winEl.el.classList.add('win');
    var msg = $id('tv-msg'); if (msg) msg.textContent = '';
    await sleep(950);
    var to = seatPoint(L.winner), els = st.shown.slice(); st.shown = [];
    await Promise.all(els.map(function (x, j) {
      var r = x.el.getBoundingClientRect(), c0 = center(r), s = slot(x.p, x.c);
      return anim(x.el, [
        { transform: 'rotate(' + s.r + 'deg)', opacity: 1 },
        { transform: 'translate(' + (to.x - c0.x) + 'px,' + (to.y - c0.y) + 'px) rotate(' + (s.r + 40) + 'deg) scale(.25)', opacity: 0 }
      ], { duration: 480, delay: j * 45, easing: 'cubic-bezier(.5,0,.75,0)', fill: 'forwards' }).then(function () { x.el.remove(); });
    }));
    floatAt(to, L.winner === myIdx() ? '+1 presa' : '+1', false);
    Sound.play(L.winner === myIdx() ? 'mytrick' : 'trick');
  }
  async function runTrick() {
    if (st.running) return; st.running = true;
    try {
      while (st && st.latest) {
        var g = st.latest.game; st.latest = null;
        if (!g) break;
        var L = g.lastTrick;
        if (L && L.n > st.sweptN) { st.sweptN = L.n; await sweep(L); continue; }
        // carte presenti ma non più nella presa (nuova mano, cambio di stato): via
        var want = g.trick.map(function (t) { return t.c; });
        if (st.shown.some(function (x) { return want.indexOf(x.c) < 0; })) await clearZone(true);
        for (var k = 0; k < g.trick.length; k++) {
          var t = g.trick[k];
          if (!st.shown.some(function (x) { return x.c === t.c; })) await flyIn(t.c, t.p);
        }
        updateMsg(g);
      }
    } finally { if (st) st.running = false; }
  }
  function updateMsg(g) {
    var m = $id('tv-msg'); if (!m) return;
    m.textContent = st.shown.length ? '' : g.phase === 'bid' ? 'Si fanno le previsioni' : g.phase === 'trump' ? 'Si sceglie la briscola' : g.phase === 'roundEnd' ? 'Mano conclusa' : g.phase === 'over' ? 'Partita finita' : '';
  }
  function staticTrick(g) {
    // al primo disegno (o rientrando al tavolo) niente animazioni: mostra la situazione com'è
    clearZone(false);
    var cards = g.trick.length ? g.trick : (g.lastTrick ? g.lastTrick.cards : []);
    cards.forEach(function (t) { var el = cardEl(t.c, t.p); $id('tv-zone').appendChild(el); st.shown.push({ c: t.c, p: t.p, el: el }); });
    if (!g.trick.length && g.lastTrick) { var w = st.shown[g.lastTrick.wi]; if (w) w.el.classList.add('win'); }
    st.sweptN = g.lastTrick ? g.lastTrick.n : 0;
    // se la presa mostrata è quella conclusa, alla prossima carta va tolta
    if (!g.trick.length && g.lastTrick) st.staleShown = true;
    updateMsg(g);
  }

  /* ---------- mano a ventaglio ---------- */
  // Una fila a ventaglio. Tiene conto di quanto le carte inclinate sporgono ai lati,
  // così anche la prima carta a sinistra resta tutta dentro lo schermo.
  function fanRow(n, w, cw, maxSpread) {
    var ch = cw * 1.4, spread = Math.min(maxSpread, n * 3.4), half = spread / 2 * Math.PI / 180;
    var over = Math.max(0, ch * 1.2 * Math.sin(half) - cw / 2 * (1 - Math.cos(half)));
    var avail = Math.max(0, w - 12 - cw - 2 * over), step = n > 1 ? Math.min(cw * 0.64, avail / (n - 1)) : 0, out = [];
    for (var i = 0; i < n; i++) {
      var f = n > 1 ? i / (n - 1) - 0.5 : 0;
      out.push({ x: (i - (n - 1) / 2) * step, y: f * f * spread, a: spread * f });
    }
    return { cards: out, step: step };
  }
  // Se in una fila le carte si coprirebbero troppo (non si legge il valore), si va su due file.
  function layoutHand(n, w, cw) {
    var one = fanRow(n, w, cw, 34);
    if (n < 8 || one.step >= cw * 0.42) return { two: false, cards: one.cards };
    var top = Math.ceil(n / 2), a = fanRow(top, w, cw, 14), b = fanRow(n - top, w, cw, 14), lift = cw * 1.4 * 0.56;
    return { two: true, cards: a.cards.map(function (c) { c.y -= lift; c.row = 0; return c; }).concat(b.cards.map(function (c) { c.row = 1; return c; })) };
  }
  function renderHand(g, me, dealing) {
    var box = $id('tv-hand'); if (!box) return;
    if (me < 0) { box.innerHTML = '<div class="empty">Stai guardando la partita.</div>'; return; }
    var P = g.players[me], playable = g.phase === 'play' && g.turn === me ? E.playable(g, me) : null;
    // posizioni attuali (per far partire la carta giocata dalla mano)
    st.handRects = {};
    box.querySelectorAll('.card').forEach(function (el) { st.handRects[+el.dataset.c] = el.getBoundingClientRect(); });
    var have = {}; box.querySelectorAll('.card').forEach(function (el) { have[el.dataset.c] = el; });
    var emp = box.querySelector('.empty'); if (emp) emp.remove();
    var keep = {};
    P.hand.forEach(function (c) {
      var el = have[c];
      if (!el) { var w = document.createElement('div'); w.innerHTML = PRCards.html(c); el = w.firstChild; el.classList.add('new'); box.appendChild(el); }
      keep[c] = el;
    });
    Object.keys(have).forEach(function (c) { if (!keep[c]) have[c].remove(); });
    if (!P.hand.length) { box.insertAdjacentHTML('beforeend', '<div class="empty">' + (g.phase === 'over' ? 'Partita finita.' : 'Nessuna carta in mano.') + '</div>'); return; }
    var w = box.clientWidth, sample = keep[P.hand[0]], cw = sample.offsetWidth || 90;
    var L0 = layoutHand(P.hand.length, w, cw), lay = L0.cards;
    if (box.classList.contains('two') !== L0.two) { box.classList.toggle('two', L0.two); cw = sample.offsetWidth || cw; lay = layoutHand(P.hand.length, w, cw).cards; }
    P.hand.forEach(function (c, i) {
      var el = keep[c], L = lay[i], ok = playable && playable.indexOf(c) >= 0;
      el.classList.toggle('ok', !!ok); el.classList.toggle('no', !!playable && !ok); el.classList.toggle('sel', App.sel === c);
      var lift = App.sel === c ? -30 : ok ? -12 : 0;
      el.style.zIndex = App.sel === c ? 99 : i + 1;
      el.style.transform = 'translate(' + L.x.toFixed(1) + 'px,' + (L.y + lift).toFixed(1) + 'px) rotate(' + L.a.toFixed(1) + 'deg)';
    });
    if (dealing) {
      var zr = $id('tv-zone').getBoundingClientRect(), z = { x: zr.left, y: zr.top };
      P.hand.forEach(function (c, i) {
        var el = keep[c], r = el.getBoundingClientRect(), cc = center(r);
        el.style.opacity = '0';
        setTimeout(function () {
          el.style.opacity = '';
          anim(el, [{ translate: (z.x - cc.x) + 'px ' + (z.y - cc.y) + 'px', scale: '.35', opacity: 0 }, { translate: '0 0', scale: '1', opacity: 1 }], { duration: 460, easing: 'cubic-bezier(.2,.8,.2,1)' });
        }, reduce ? 0 : 120 + i * 70);
      });
      dealBacks(g, me);
    }
    box.querySelectorAll('.card.new').forEach(function (el) { el.classList.remove('new'); });
  }
  function dealBacks(g, me) {
    if (reduce) return;
    var zr = $id('tv-zone').getBoundingClientRect();
    g.players.forEach(function (P, i) {
      if (i === me) return;
      var to = seatPoint(i), n = Math.min(3, g.round);
      for (var k = 0; k < n; k++) (function (k) {
        var w = document.createElement('div'); w.innerHTML = PRCards.back(); var el = w.firstChild;
        el.style.cssText = 'position:fixed;--cw:44px;left:' + (zr.left - 22) + 'px;top:' + (zr.top - 31) + 'px;z-index:15;pointer-events:none';
        document.body.appendChild(el);
        setTimeout(function () {
          anim(el, [{ transform: 'translate(0,0) rotate(0deg)', opacity: 1 }, { transform: 'translate(' + (to.x - zr.left) + 'px,' + (to.y - zr.top) + 'px) rotate(' + (200 + k * 20) + 'deg) scale(.6)', opacity: 0 }],
            { duration: 520, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'forwards' }).then(function () { el.remove(); });
        }, 60 + (i * 3 + k) * 55);
      })(k);
    });
  }

  /* ---------- effetti: previsioni, punti ---------- */
  function floatAt(pt, text, neg) {
    if (!pt) return;
    pt = { x: pt.x, y: pt.y - 30 }; // sopra l'avatar, non sopra il nome
    var f = document.createElement('div'); f.className = 'float' + (neg ? ' neg' : ''); f.textContent = text;
    f.style.left = pt.x + 'px'; f.style.top = pt.y + 'px'; f.style.position = 'fixed';
    document.body.appendChild(f);
    anim(f, [{ transform: 'translate(-50%,-20%) scale(.7)', opacity: 0 }, { transform: 'translate(-50%,-90%) scale(1.05)', opacity: 1, offset: .25 }, { transform: 'translate(-50%,-190%) scale(1)', opacity: 0 }], { duration: 1700, easing: 'ease-out' })
      .then(function () { f.remove(); });
    if (reduce) setTimeout(function () { f.remove(); }, 1200);
  }
  function effects(g, me) {
    if (g.flash && g.flash.n > st.flashN) {
      var fl = g.flash; st.flashN = fl.n;
      if (fl.kind === 'bid' && !st.first) { var P = g.players[fl.p]; Sound.play('bid', { b: bidHidden(g, fl.p, me) ? 3 : P.bid }); floatAt(seatPoint(fl.p), fl.p === me ? 'Prevedi ' + P.bid : bidHidden(g, fl.p, me) ? 'Ha previsto ✦' : 'Prevede ' + P.bid, false); }
    }
    if (g.phase === 'roundEnd' && st.scoredRound !== g.round) {
      st.scoredRound = g.round;
      var wait = 1500;
      if (!st.first && g.opts.hidden) { // si scoprono le previsioni, poi i punti
        wait = 3300;
        setTimeout(function () { revealBids(g, me); Sound.play('reveal'); }, 1300);
      }
      if (!st.first) setTimeout(function () {
        g.players.forEach(function (P, i) { var h = P.hist[P.hist.length - 1]; if (h) floatAt(seatPoint(i), (h.delta > 0 ? '+' : '') + h.delta, h.delta < 0); });
        var mh = me >= 0 && g.players[me].hist[g.players[me].hist.length - 1]; if (mh) Sound.play(mh.delta > 0 ? 'plus' : 'minus');
      }, wait);
    }
  }

  function revealBids(g, me) {
    g.players.forEach(function (P, i) {
      var h = P.hist[P.hist.length - 1]; if (!h) return;
      var pt = seatPoint(i), f = document.createElement('div');
      f.className = 'reveal' + (h.bid === h.tricks ? ' hit' : '');
      f.innerHTML = '<small>' + (i === me ? 'Prevedevi' : 'Prevedeva') + '</small>' + h.bid;
      f.style.left = pt.x + 'px'; f.style.top = (pt.y - 34) + 'px';
      document.body.appendChild(f);
      anim(f, [{ transform: 'translate(-50%,-50%) rotateY(90deg) scale(.6)', opacity: 0 }, { transform: 'translate(-50%,-50%) rotateY(0) scale(1.1)', opacity: 1, offset: .2 },
        { transform: 'translate(-50%,-50%) scale(1)', opacity: 1, offset: .85 }, { transform: 'translate(-50%,-70%) scale(.95)', opacity: 0 }], { duration: 2000, delay: i * 120, easing: 'ease-out', fill: 'both' })
        .then(function () { f.remove(); });
      if (reduce) setTimeout(function () { f.remove(); }, 1500);
    });
  }

  /* ---------- timer ad anello sul posto di chi deve giocare ---------- */
  function tickTimer() {
    if (!st || !App.doc || !App.doc.game) return;
    var d = App.doc, s = Turns.secs(d), el = document.querySelector('.tv-seat.turn .tv-ava');
    if (!el) return;
    var p = s && d.turnSince ? Math.min(1, (Date.now() - d.turnSince) / (s * 1000)) : 0;
    el.style.setProperty('--p', (1 - p).toFixed(3));
  }

  /* ---------- aggiornamento completo ---------- */
  function update(doc) {
    if (!mounted()) mount();
    var g = doc.game, me = myIdx(), sum = E.bidSum(g), allBid = g.players.every(function (P) { return P.bid != null; });
    var dealing = st.round !== null && st.round !== g.round;
    var first = st.first;
    $id('tv-info').innerHTML = '<b>' + connInfo('Mano ' + g.round + ' / ' + g.rounds) + '</b><small>Tavolo ' + esc(doc.code) + '</small>';
    var tone = allBid ? (sum > g.round ? 'over' : sum < g.round ? 'under' : 'even') : '';
    var covered = g.opts.hidden && (g.phase === 'bid' || g.phase === 'play' || g.phase === 'trump');
    $id('tv-pr').className = 'tv-pr ' + (covered ? 'sealed' : tone);
    $id('tv-pr').innerHTML = covered
      ? '<span class="orb">?<small>/' + g.round + '</small></span><span>Previsioni<b>coperte</b></span>'
      : '<span class="orb">' + sum + '<small>/' + g.round + '</small></span><span>Previste<b>' + (!allBid ? 'in corso…' : tone === 'over' ? 'troppe' : tone === 'under' ? 'poche' : 'somma pari') + '</b></span>';
    $id('tv-banner').innerHTML = hostBanner();
    $id('tv-seats').innerHTML = seatsHTML(g, me);
    var tc = g.trump != null ? ['var(--fiamme)', 'var(--maree)', 'var(--foreste)', 'var(--sabbie)'][g.trump] : null;
    $id('tv-trump').innerHTML = (g.trumpCard != null ? PRCards.html(g.trumpCard) : '<div class="none">ultima mano</div>') +
      '<span' + (tc ? ' style="--tc:' + tc + '"' : '') + '>Briscola<b>' + (g.trump != null ? suitName(g.trump) : g.phase === 'trump' ? 'da scegliere' : 'nessuna') + '</b></span>';
    $id('tv-status').innerHTML = statusLine(g, me, sum, allBid, true) + (g.turn === me && g.phase !== 'over' ? '<span id="tt"></span>' : '');
    if (me >= 0) {
      var P = g.players[me];
      $id('tv-me').className = 'tv-me' + (g.turn === me && g.phase !== 'over' ? ' turn' : '');
      $id('tv-me').innerHTML = '<span class="nm">' + esc(P.nick) + (g.dealer === me ? ' · mazziere' : '') + '</span>' + gemsHTML(P) + '<span>' + P.score + ' punti</span>';
    } else $id('tv-me').innerHTML = '';
    renderHand(g, me, dealing && !first);
    if (dealing && !first) { Sound.play('shuffle'); setTimeout(function () { Sound.play('deal'); if (g.trumpCard != null) Sound.play('trump'); }, 500); }
    if (!first && g.phase !== 'over' && g.turn === me && E.decider(g) === me && st.turnSeq !== g.round + ':' + g.phase + ':' + g.trick.length + ':' + (g.lastTrick ? g.lastTrick.n : 0)) { st.turnSeq = g.round + ':' + g.phase + ':' + g.trick.length + ':' + (g.lastTrick ? g.lastTrick.n : 0); setTimeout(function () { Sound.play('turn'); }, 600); }
    if (!first && g.phase === 'over' && !st.overSnd) { st.overSnd = true; setTimeout(function () { Sound.play(me >= 0 && g.winner && g.winner.indexOf(me) >= 0 ? 'win' : 'lose'); }, 1800); }
    $id('tv-actions').innerHTML = actionsHTML(g, me, sum);
    if (first) { staticTrick(g); st.flashN = g.flash ? g.flash.n : 0; st.scoredRound = g.phase === 'roundEnd' || g.phase === 'over' ? g.round : 0; }
    else {
      if (st.staleShown && (g.trick.length || (g.lastTrick && g.lastTrick.n > st.sweptN))) { st.staleShown = false; clearZone(true); }
      st.latest = doc; runTrick();
    }
    effects(g, me);
    st.round = g.round; st.first = false;
  }

  function actionsHTML(g, me, sum) {
    if (me < 0) return '';
    var P = g.players[me], myTurn = g.turn === me && g.phase !== 'over';
    if (P.bot && g.phase !== 'over') return '<button class="btn block" data-act="resume">Riprendo io</button>';
    if (g.phase === 'bid' && myTurn) {
      var f = E.forbiddenBid(g, me), b = '';
      for (var i = 0; i <= g.round; i++) b += '<button data-act="bid" data-b="' + i + '"' + (i === f ? ' class="fb" disabled aria-label="' + i + ' non consentito"' : ' aria-label="Prevedo ' + i + '"') + '>' + i + '</button>';
      return '<div class="bids">' + b + '</div>';
    }
    if (g.phase === 'trump' && myTurn) return '<div class="suits">' + D.SUITS.map(function (s) { return '<button data-act="trump" data-s="' + s.id + '" style="--sc:var(--' + PRCards.KEYS[s.id] + ');color:var(--sc)">' + PRCards.suitIcon(s.id) + '<span>' + s.n + '</span></button>'; }).join('') + '</div>';
    if (g.phase === 'play' && myTurn && App.sel != null) return '<button class="btn block" data-act="playsel">Gioca ' + esc(PRCards.name(App.sel)) + '</button>';
    if (g.phase === 'roundEnd' && (myTurn || App.doc.host === Net.uid)) return '<button class="btn block" data-act="next">Prossima mano</button>';
    if (g.phase === 'over') return '<button class="btn block" data-act="showover">Classifica</button>';
    return '';
  }

  return { update: update, unmount: unmount, mounted: mounted };
})();
