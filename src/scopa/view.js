/* ===== Scopa: il tavolo =====
   Io in basso, il compagno di fronte (in 4), gli avversari ai lati; al centro la tavola. Quando tocco una mia
   carta si illuminano le carte che posso prendere; quelle scelte si alzano. Le prese volano da chi le fa;
   la scopa ha il suo annuncio. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      Chat.dockHTML() + '<div class="table" id="table"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div><div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function rel(g, p, me) { var n = g.players.length; return (p - (me < 0 ? 0 : me) + n) % n; }
  var POS2 = ['s', 'n'], POS4 = ['s', 'w', 'n', 'e'];
  function pos(g, p, me) { return (g.players.length === 4 ? POS4 : POS2)[rel(g, p, me)]; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>' + CFG.title + '</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Mano ' + g.hand) + ' · ' + g.totals[0] + ' a ' + g.totals[1] + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('table', table(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', hand(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function seat(g, p, me) {
    var P = g.players[p], t = E.team(g, p), on = g.phase === 'play' && g.turn === p, four = g.players.length === 4, mate = four && me >= 0 && p === E.partner(g, me);
    var n = P.hand.length, show = Math.min(n, 5);
    var cards = ''; for (var k = 0; k < show; k++) cards += ART.card(null, false);
    return '<div class="seat-t ' + pos(g, p, me) + (on ? ' on' : '') + '" data-p="' + p + '" style="--pc:' + pcol(g, p) + ';--tc:' + (four ? TCOL[t] : pcol(g, p)) + '">' +
      '<button class="who" data-act="player" data-p="' + p + '"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b>' + (mate ? '<span class="tag ok">compagno</span>' : '') + (P.away ? '<span class="tag away">assente</span>' : P.bot ? '<span class="tag bot">auto</span>' : '') + '</button>' +
      '<span class="oh">' + cards + (n > 5 ? '<i class="more">' + n + '</i>' : '') + '</span></div>';
  }
  function table(g, me) {
    var n = g.players.length, h = '', my = me >= 0 && g.phase === 'play' && g.turn === me;
    for (var p = 0; p < n; p++) if (p !== me) h += seat(g, p, me);
    var can = [];
    if (my && App.sel != null) E.captures(g.table, App.sel).forEach(function (o) { o.forEach(function (c) { if (can.indexOf(c) < 0) can.push(c); }); });
    var cards = g.table.map(function (c) {
      var cls = (App.take.indexOf(c) >= 0 ? ' pick' : '') + (can.indexOf(c) >= 0 ? ' can' : '');
      return '<button class="tcard' + cls + '" data-act="tcard" data-c="' + c + '" aria-label="' + esc(ART.name(c)) + '">' + ART.flat(c) + '</button>';
    }).join('');
    var mt = me >= 0 ? E.team(g, me) : 0;
    var side = function (t) { return '<span style="--tc:' + (n === 4 ? TCOL[t] : PCOL[t]) + '">' + (t === mt ? (n === 4 ? 'Voi' : 'Tu') : (n === 4 ? 'Loro' : esc(g.players[t].nick))) + ': <b>' + g.taken[t].length + '</b> carte' + (g.scope[t] ? ' · <b class="sc">' + g.scope[t] + ' scop' + (g.scope[t] > 1 ? 'e' : 'a') + '</b>' : '') + '</span>'; };
    return h + '<div class="center"><div class="tavola" id="tavola">' + (cards || '<span class="empty-t">Tavola vuota</span>') + '</div>' + (g.deck.length ? '<div class="deck"><span class="dk">' + ART.card(null, false) + '</span><i>' + g.deck.length + '</i></div>' : '') + '</div>' +
      '<div class="score">' + side(mt) + side(1 - mt) + '</div>';
  }
  function hand(g, me) {
    if (me < 0) return '<div class="mine"><p class="muted">Stai guardando la partita.</p></div>';
    var P = g.players[me], my = g.phase === 'play' && g.turn === me;
    return '<div class="mine' + (my ? ' on' : '') + '" style="--pc:' + pcol(g, me) + '"><div class="mine-h"><b>' + esc(P.nick) + ' (tu)</b><span class="mine-s">totale ' + g.totals[E.team(g, me)] + ' a ' + g.totals[1 - E.team(g, me)] + '</span></div>' +
      '<div class="handrow' + (P.hand.length > 5 ? ' many' : '') + '">' + P.hand.slice().sort(function (a, b) { return E.val(a) - E.val(b) || a - b; }).map(function (c) { return '<button class="hcard' + (App.sel === c ? ' sel' : '') + (my ? '' : ' locked') + '" data-act="hcard" data-c="' + c + '" aria-label="' + esc(ART.name(c)) + '">' + ART.flat(c) + '</button>'; }).join('') + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'take', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.players.length === 4 ? 'Vincono ' : 'Vince ') + sideName(g, g.winners[0]) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'scores') { h = '<b>Mano ' + g.hand + ' finita:</b> ' + g.res.pts[0] + ' a ' + g.res.pts[1] + '.'; btn = '<button class="btn small" data-act="showround">Punti</button>' + (P && !P.ready ? '<button class="btn small" data-act="next">Prossima mano</button>' : ''); help = 'points'; }
    else if (g.turn === me) {
      if (App.sel == null) h = '<b>Tocca a te:</b> scegli una carta.';
      else {
        var o = E.captures(g.table, App.sel);
        h = !o.length ? 'Con ' + esc(ART.name(App.sel)) + ' non prendi niente: resta in tavola.' : o.length > 1 && !App.take.length ? 'Più modi di prendere: tocca in tavola le carte che vuoi.' : 'Prendi ' + App.take.map(function (c) { return esc(ART.name(c)); }).join(' e ') + (App.take.length === g.table.length ? ': <b>scopa!</b>' : '.');
        btn = '<button class="btn small" data-act="doplay">Gioca</button>';
      }
    } else h = 'Tocca a ' + pname(g, g.turn) + '…';
    if (P && P.bot && g.phase !== 'over') btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- animazioni ---------- */
  function fly(html, from, to, o) {
    o = o || {};
    if (!from || !to || reduce) return Promise.resolve();
    var f = document.createElement('div'); f.className = 'flyer'; f.innerHTML = html;
    f.style.width = to.width + 'px'; f.style.height = to.height + 'px'; f.style.left = to.left + 'px'; f.style.top = to.top + 'px';
    document.body.appendChild(f);
    var sx = from.width / to.width, dx = from.left - to.left, dy = from.top - to.top;
    return anim(f, [{ transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ')' }, { transform: 'none' }], { duration: o.dur || 380, delay: o.delay || 0, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'both' }).then(function () { f.remove(); });
  }
  function rect(n) { return n ? (n.querySelector('.skc') || n).getBoundingClientRect() : null; }
  function seatEl(p) { return p === myIdx() ? el('gv-me') : document.querySelector('.seat-t[data-p="' + p + '"] .who'); }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (news.length > 16) news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over' || e.k === 'deal'; });
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); banner('Mano ' + e.hand, g.opts.scopone ? 'Scopone: 10 carte a testa' : '3 carte a testa, 4 in tavola'); return sleep(500); }); break;
      case 'refill': enqueue(function () { Sound.play('deal'); return sleep(200); }); break;
      case 'drop': enqueue(function () {
        Sound.play('card');
        var tc = document.querySelector('.tcard[data-c="' + e.c + '"]');
        if (tc && e.p !== me) { tc.style.visibility = 'hidden'; return fly(ART.flat(e.c), rect(seatEl(e.p)), rect(tc)).then(function () { tc.style.visibility = ''; }); }
        return sleep(50);
      }); break;
      case 'take': enqueue(function () {
        Sound.play(e.scopa ? 'scopa' : 'take');
        if (e.scopa) banner('Scopa!', esc(g.players[e.p].nick));
        var dst = rect(seatEl(e.p)), from = rect(el('tavola'));
        var jobs = [e.c].concat(e.take).map(function (c, j) { return fly(ART.flat(c), from, dst ? { left: dst.left, top: dst.top, width: 44, height: 66 } : null, { dur: 450, delay: j * 50 }); });
        return Promise.all(jobs);
      }); break;
      case 'sweep': enqueue(function () { toast('Le carte rimaste in tavola vanno a ' + esc(g.players[e.p].nick) + '.'); return sleep(100); }); break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || [], mt = me >= 0 ? E.team(G(), me) : -1; Sound.play(w.indexOf(mt) >= 0 ? 'win' : 'lose'); if (w[0] === mt) confetti(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#ff5a4e', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0'];
    for (var i = 0; i < 60; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner };
})();
