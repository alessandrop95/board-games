/* ===== Prendi 6!: schermata di gioco (le 4 file, la mano, le carte scoperte) e animazioni =====
   Quando tutti hanno scelto, le carte scoperte compaiono in ordine dalla più bassa e vanno nelle file una alla
   volta; chi mette la sesta carta vede volare verso di sé le cinque carte della fila con le loro teste. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }
  function backdrop() { return '<div class="sky" aria-hidden="true"><div class="sun"></div><div class="hill h1"></div><div class="hill h2"></div><div class="fence"></div></div>'; }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + backdrop() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-opp" id="gv-opp"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div>' +
      '<div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Prendi 6!</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Manche ' + g.round) + ' · fino a ' + g.opts.target + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-opp', players(g, me));
    setHTML('gv-mid', board(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', hand(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    applyHide();
  }
  function art(v) { v = +v; return v === 1 || v === 8 || v === 11 || (v >= 80 && v <= 89) ? 'l’' : 'il '; }   // l’1, l’8, l’11, l’80…
  function heads(n) { return '<span class="hds">' + ART.head() + '<b>' + n + '</b></span>'; }
  function status(g, p) {
    var P = g.players[p];
    if (g.phase === 'pick') return P.pick != null ? '<span class="tag ok">' + IC('check') + ' scelto</span>' : '<span class="tag wait">sceglie…</span>';
    if (g.phase === 'choose' && g.chooser === p) return '<span class="tag end">sceglie la fila</span>';
    if (g.phase === 'scores' && P.ready && !P.bot) return '<span class="tag ok">pronto</span>';
    return '';
  }
  function players(g, me) {
    return g.players.map(function (P, p) {
      if (p === me) return '';
      return '<button class="opp" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s">' + heads(E.sum(P.pile)) + '<span class="sc-tot" title="Totale">Σ ' + P.total + '</span>' + (P.bot && !P.away ? '<span class="tag bot">auto</span>' : P.away ? '<span class="tag away">assente</span>' : '') + '</span>' +
        '<span class="opp-t">' + status(g, p) + '</span></button>';
    }).join('');
  }

  /* ---------- le file ---------- */
  function board(g, me) {
    var choose = g.phase === 'choose' && g.chooser === me, strip = '';
    if (g.plays && (g.phase === 'pick' || g.phase === 'choose') ) {
      strip = '<div class="strip" id="strip" style="--n:' + g.plays.length + '">' + g.plays.map(function (x, k) { return '<span class="sp" data-k="' + k + '" style="--pc:' + pcol(g, x.p) + '">' + ART.flat(x.v, true) + '<i>' + esc(g.players[x.p].nick) + '</i></span>'; }).join('') + '</div>';
    }
    var rows = g.rows.map(function (r, i) {
      var full = r.length >= 5, tag = choose ? 'button' : 'div', b = E.sum(r);
      var slots = ''; for (var k = 0; k < 6; k++) slots += r[k] != null ? '<span class="slot" data-r="' + i + '" data-i="' + k + '">' + ART.flat(r[k], true) + '</span>' : '<span class="slot empty' + (k === 5 ? ' six' : '') + '">' + (k === 5 ? '6' : '') + '</span>';
      return '<' + tag + ' class="frow' + (full ? ' full' : '') + (choose ? ' pick' : '') + '" data-r="' + i + '"' + (choose ? ' data-act="row" aria-label="Prendi la fila ' + (i + 1) + ', ' + b + ' teste"' : '') + '><span class="rhd">' + heads(b) + '</span>' + slots + (choose ? '<span class="take">Prendi</span>' : '') + '</' + tag + '>';
    }).join('');
    return strip + '<div class="rows" id="rows">' + rows + '</div>';
  }
  // dove andrebbe la carta: un aiuto per scegliere
  function hint(g, v) {
    var r = E.target(g.rows, v);
    if (r == null) return '<i class="hn low">prendi</i>';
    if (g.rows[r].length >= 5) return '<i class="hn six">6ª!</i>';
    return '<i class="hn">' + (r + 1) + '</i>';
  }
  function hand(g, me) {
    if (me < 0) return '<div class="mine hand-area"><p class="muted">Stai guardando la partita.</p></div>';
    var P = g.players[me];
    if (g.phase === 'scores' || g.phase === 'over') return '<div class="mine hand-area" style="--pc:' + pcol(g, me) + '"><div class="mine-h"><b>' + esc(P.nick) + ' (tu)</b><span class="mine-s">' + heads(E.sum(P.pile)) + '<span class="sc-tot">Σ ' + P.total + '</span></span></div><p class="muted" style="text-align:center">' + (g.phase === 'over' ? 'Partita finita.' : 'Manche finita: si contano le teste.') + '</p></div>';
    var sel = P.pick != null ? P.pick : App.sel[0], can = g.phase === 'pick' && P.pick == null;
    var cards = P.hand.map(function (v) { var on = sel === v; return '<button class="hcard' + (on ? ' sel' : '') + (can ? '' : ' locked') + '" data-act="hcard" data-v="' + v + '" aria-label="Carta ' + v + ', ' + E.bulls(v) + ' teste">' + ART.flat(v) + (can ? hint(g, v) : '') + '</button>'; }).join('');
    return '<div class="mine hand-area' + (can ? ' on' : '') + '" style="--pc:' + pcol(g, me) + '"><div class="mine-h"><b>La tua mano</b><span class="mine-s">' + heads(E.sum(P.pile)) + '<span class="sc-tot" title="Totale della partita">Σ ' + P.total + '</span></span></div>' +
      '<div class="handrow" id="handrow" style="--n:' + P.hand.length + '">' + cards + '</div></div>';
  }

  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Vincono ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (g.phase === 'scores') { h = '<b>Manche ' + g.round + ' finita.</b> Guarda le teste prese.'; btn = '<button class="btn small" data-act="showround">Punti</button>'; help = 'end'; }
    else if (g.phase === 'choose') {
      var v = g.queue[0].v; help = 'six';
      h = g.chooser === me ? 'Il tuo <b>' + v + '</b> è più basso di tutte le file: <b>tocca la fila da prendere</b>.' : pname(g, g.chooser) + ' ha giocato ' + art(v) + '<b>' + v + '</b>, più basso di tutte le file: sceglie quale fila prendere…';
    } else if (!P) h = 'Tutti stanno scegliendo una carta…';
    else if (P.pick != null) {
      var w = E.pending(g);
      h = 'Hai scelto ' + art(P.pick) + '<b>' + P.pick + '</b>. Aspetto ' + w.map(function (i) { return pname(g, i); }).join(', ') + '…';
      btn = '<button class="btn small ghost" data-act="unpick">Cambio</button>';
    } else {
      h = App.sel.length ? 'Giochi ' + art(App.sel[0]) + '<b>' + App.sel[0] + '</b>?' : '<b>Scegli una carta</b> dalla tua mano.';
      if (App.sel.length) btn = '<button class="btn small" data-act="dopick">Gioco</button>';
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- animazioni ---------- */
  function slotEl(r, i) { return document.querySelector('.frow[data-r="' + r + '"] .slot[data-i="' + i + '"]'); }
  function applyHide() {
    document.querySelectorAll('.flyhide').forEach(function (n) { n.classList.remove('flyhide'); });
    Object.keys(App.hide).forEach(function (k) { var h = App.hide[k], parts = k.split(':'), n = parts[0] === 'r' ? slotEl(parts[1], parts[2]) : parts[0] === 's' ? document.querySelector('.sp[data-k="' + parts[1] + '"]') : null; if (n && h.n > 0) n.classList.add('flyhide'); });
  }
  function hide(k) { var h = App.hide[k] || (App.hide[k] = { n: 0 }); h.n++; }
  function unhide(k) { var h = App.hide[k]; if (!h) return; if (--h.n <= 0) delete App.hide[k]; applyHide(); }
  function rectOf(n) { return n ? n.getBoundingClientRect() : null; }
  function cardRect(n) { if (!n) return null; var c = n.querySelector('.skc') || n; return c.getBoundingClientRect(); }
  function fly(html, from, to, o) {
    o = o || {};
    if (!from || !to || reduce) return Promise.resolve();
    var f = document.createElement('div'); f.className = 'flyer'; f.innerHTML = html;
    f.style.width = to.width + 'px'; f.style.height = to.height + 'px'; f.style.left = to.left + 'px'; f.style.top = to.top + 'px';
    document.body.appendChild(f);
    var sx = from.width / to.width, dx = from.left - to.left, dy = from.top - to.top;
    return anim(f, [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ')' }, { transform: 'translate(' + dx / 2 + 'px,' + (dy / 2 - 40) + 'px) scale(' + (sx + 1) / 2 + ') rotate(6deg)', offset: .5 }, { transform: 'none' }], { duration: o.dur || 520, delay: o.delay || 0, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' }).then(function () { f.remove(); });
  }
  function pop(n) { if (n) anim(n, [{ transform: 'scale(.3)', opacity: 0 }, { transform: 'scale(1.15)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 380, easing: 'cubic-bezier(.3,.7,.3,1)' }); }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1600);
  }
  function playerEl(p) { return p === myIdx() ? document.querySelector('.hand-area') : document.querySelector('.opp[data-p="' + p + '"]'); }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (Q.length > 8 || news.length > 26) { Q = []; App.hide = {}; applyHide(); news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over'; }); }
    var k = 0;
    news.forEach(function (e) { plan(g, me, e, e.k === 'place' || e.k === 'take' ? k++ : null); });
    applyHide();
  }
  function plan(g, me, e, k) {
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); Game.banner('Manche ' + e.round, '10 carte a testa'); var r = el('handrow'); if (r) Array.prototype.forEach.call(r.children, function (c, i) { setTimeout(function () { pop(c); }, i * 50); }); return sleep(700); }); break;
      case 'picked': if (e.p !== me && e.on) enqueue(function () { Sound.play('pick'); return sleep(30); }); break;
      case 'reveal': enqueue(function () { Sound.play('flip', {}); var s = el('strip'); if (s) Array.prototype.forEach.call(s.children, function (c, i) { setTimeout(function () { pop(c); }, i * 70); }); return sleep(500 + e.plays.length * 70); }); break;
      case 'place': {
        var kk = 'r:' + e.r + ':' + e.i; hide(kk);
        enqueue(function () {
          var src = cardRect(document.querySelector('.sp[data-k="' + idxOf(e) + '"]')), dst = cardRect(slotEl(e.r, e.i));
          Sound.play('place');
          return fly(ART.flat(e.v, true), src, dst, { dur: 420 }).then(function () { unhide(kk); pop(slotEl(e.r, e.i)); return sleep(80); });
        });
        break;
      }
      case 'take': {
        var k0 = 'r:' + e.r + ':0'; hide(k0);
        enqueue(function () {
          var row = document.querySelector('.frow[data-r="' + e.r + '"]'), rr = rectOf(row), dst = rectOf(playerEl(e.p));
          Sound.play(e.bulls >= 5 ? 'double' : 'drop');
          var jobs = e.cards.map(function (v, j) {
            var s = row && row.querySelectorAll('.slot')[j], r0 = s ? cardRect(s) : rr;
            var to = dst ? { left: dst.left + dst.width / 2 - r0.width / 2, top: dst.top + dst.height / 2 - r0.height / 2, width: r0.width, height: r0.height } : null;
            return fly(ART.flat(v, true), r0, to, { dur: 650, delay: j * 70 });
          });
          floatTxt(dst, '+' + e.bulls + ' ' + ART.head(), e.bulls >= 5 ? 'bad' : '');
          return Promise.all(jobs).then(function () { unhide(k0); pop(slotEl(e.r, 0)); return sleep(150); });
        });
        break;
      }
      case 'needrow': enqueue(function () { if (e.p === me) { Sound.play('turn'); Game.banner('Scegli una fila da prendere', 'il tuo ' + e.v + ' è più basso di tutte'); } return sleep(300); }); break;
      case 'turn': enqueue(function () { if (me >= 0) Sound.play('turn'); return sleep(60); }); break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); Sound.play('col'); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
      case 'next': enqueue(function () { if (App.sheet && App.sheet.kind === 'round') { App.sheet = null; renderSheet(); } return sleep(50); }); break;
    }
  }
  function idxOf(e) { var g = G(); if (!g || !g.plays) return -1; for (var k = 0; k < g.plays.length; k++) if (g.plays[k].v === e.v) return k; return -1; }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#ff7a45', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#8fe3ff'];
    for (var i = 0; i < 60; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, heads: heads };
})();
