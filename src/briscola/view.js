/* ===== Briscola: il tavolo =====
   Io in basso, il compagno di fronte (in 4) e gli avversari ai lati; al centro le carte della mano, il mazzo
   e la briscola. Le carte giocate volano al centro; la mano presa resta un attimo in vista e poi vola da chi
   l'ha presa. A mazzo finito, in 4, vedo le carte del compagno. */
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
  // posto relativo a me: 0 io (in basso), poi in senso orario
  function rel(g, p, me) { var n = g.players.length; return (p - (me < 0 ? 0 : me) + n) % n; }
  var POS2 = ['s', 'n'], POS4 = ['s', 'w', 'n', 'e'];
  function pos(g, p, me) { return (g.players.length === 4 ? POS4 : POS2)[rel(g, p, me)]; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>' + CFG.title + '</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Mano ' + g.hand) + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('table', table(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', hand(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function seat(g, p, me) {
    var P = g.players[p], t = E.team(g, p), on = g.phase === 'play' && g.turn === p, four = g.players.length === 4;
    var mate = four && me >= 0 && p === E.partner(g, me), show = mate && g.open;
    var cards = show ? P.hand.map(function (c) { return ART.flat(c); }).join('') : P.hand.map(function () { return ART.card(null, false); }).join('');
    var sg = mate && g.signs[p] ? '<span class="sign">' + IC('hand') + ' ' + esc(E.SIGNS[g.signs[p].k]) + '</span>' : '';
    return '<div class="seat-t ' + pos(g, p, me) + (on ? ' on' : '') + '" data-p="' + p + '" style="--pc:' + pcol(g, p) + ';--tc:' + (four ? TCOL[t] : pcol(g, p)) + '">' +
      '<button class="who" data-act="player" data-p="' + p + '"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b>' + (mate ? '<span class="tag ok">compagno</span>' : '') + (P.away ? '<span class="tag away">assente</span>' : P.bot ? '<span class="tag bot">auto</span>' : '') + '</button>' +
      '<span class="oh' + (show ? ' open' : '') + '">' + cards + '</span>' + sg + '</div>';
  }
  function table(g, me) {
    var n = g.players.length, h = '';
    for (var p = 0; p < n; p++) if (p !== me) h += seat(g, p, me);
    // la mano in corso (o quella appena presa, che resta un attimo in vista)
    var tr = g.trick.length ? g.trick : (App.linger && App.linger.n === g.fxN ? App.linger.trick : []);
    var mid = '<div class="trick" id="trick">' + tr.map(function (x) { return '<span class="tc ' + pos(g, x.p, me) + '" data-p="' + x.p + '">' + ART.flat(x.c) + '</span>'; }).join('') + '</div>';
    var deck = g.deck.length ? '<div class="deck" id="deck"><span class="bris">' + ART.flat(g.bris) + '</span>' + (g.deck.length > 1 ? '<span class="dk">' + ART.card(null, false) + '</span>' : '') + '<i>' + g.deck.length + '</i></div>' : '<div class="deck empty"><span class="bs">' + ART.suitIcon(E.suit(g.bris)) + '</span><i>mazzo finito</i></div>';
    var mt = me >= 0 ? E.team(g, me) : 0;
    var score = '<div class="score"><span style="--tc:' + (n === 4 ? TCOL[mt] : PCOL[0]) + '">Mani vinte: <b>' + g.wins[mt] + '</b> a <b>' + g.wins[1 - mt] + '</b></span><span>Prese: ' + g.taken[mt].length + ' carte</span></div>';
    return h + '<div class="center">' + deck + mid + '</div>' + score;
  }
  function hand(g, me) {
    if (me < 0) return '<div class="mine"><p class="muted">Stai guardando la partita.</p></div>';
    var P = g.players[me], my = g.phase === 'play' && g.turn === me;
    var sg = g.players.length === 4 && g.opts.signs && g.phase === 'play' ? '<button class="chip signb" data-act="signs">' + IC('hand') + ' Segni</button>' : '';
    return '<div class="mine' + (my ? ' on' : '') + '" style="--pc:' + pcol(g, me) + '"><div class="mine-h"><b>' + esc(P.nick) + ' (tu)</b>' + sg + '<span class="mine-s">briscola ' + ART.suitIcon(E.suit(g.bris)) + '</span></div>' +
      '<div class="handrow">' + P.hand.map(function (c) { return '<button class="hcard' + (App.sel === c ? ' sel' : '') + (my ? '' : ' locked') + '" data-act="hcard" data-c="' + c + '" aria-label="' + esc(ART.name(c)) + '">' + ART.flat(c) + '</button>'; }).join('') + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'trick', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari!' : (g.players.length === 4 ? 'Vincono ' : 'Vince ') + sideName(g, g.winners[0]) + '.'); btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (g.phase === 'scores') { h = '<b>Mano ' + g.hand + ' finita:</b> ' + g.res.pts[0] + ' a ' + g.res.pts[1] + '.'; btn = '<button class="btn small" data-act="showround">Punti</button>' + (P && !P.ready ? '<button class="btn small" data-act="next">Prossima mano</button>' : ''); help = 'end'; }
    else if (g.turn === me) { h = App.sel != null ? 'Giochi ' + esc(ART.name(App.sel)) + '? Toccala di nuovo.' : '<b>Tocca a te:</b> scegli una carta.'; if (App.sel != null) btn = '<button class="btn small" data-act="doplay">Gioca</button>'; }
    else h = 'Tocca a ' + pname(g, g.turn) + '…';
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
  function floatTxt(r, txt) { if (!r) return; var f = document.createElement('div'); f.className = 'floatxt'; f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1600); }
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
      case 'deal': enqueue(function () { App.linger = null; Sound.play('deal'); banner('Mano ' + e.hand, 'briscola: ' + E.SN[E.suit(e.bris)]); render(); return sleep(500); }); break;
      case 'play': enqueue(function () {
        Sound.play('card'); if (App.linger) render();
        var tc = document.querySelector('.trick .tc[data-p="' + e.p + '"]'), src = rect(seatEl(e.p));
        if (tc) { tc.style.visibility = 'hidden'; return fly(ART.flat(e.c), src, rect(tc)).then(function () { tc.style.visibility = ''; }); }
        return sleep(50);
      }); break;
      case 'take': {
        // la mano presa resta in vista un attimo, poi vola da chi l'ha presa
        App.linger = { n: g.fxN, trick: g.last ? g.last.trick : [] };
        enqueue(function () {
          render(); return sleep(900).then(function () {
            var dst = rect(seatEl(e.p)), jobs = [];
            document.querySelectorAll('.trick .tc').forEach(function (n, j) { var r = rect(n); n.style.visibility = 'hidden'; jobs.push(fly(n.innerHTML, r, dst ? { left: dst.left, top: dst.top, width: r.width * .6, height: r.height * .6 } : null, { dur: 420, delay: j * 40 })); });
            Sound.play(e.pts >= 10 ? 'big' : 'take'); if (e.pts) floatTxt(dst, '+' + e.pts);
            return Promise.all(jobs).then(function () { App.linger = null; render(); });
          });
        });
        break;
      }
      case 'open': enqueue(function () { if (g.players.length === 4) toast('Mazzo finito: ora vedi le carte del tuo compagno.'); return sleep(50); }); break;
      case 'sign': if (me >= 0 && e.to === me) enqueue(function () { Sound.play('sign'); toast(IC('hand') + ' <b>' + esc(g.players[e.p].nick) + '</b>: ' + esc(E.SIGNS[e.s])); return sleep(50); }); break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || [], mt = me >= 0 ? E.team(G(), me) : -1; Sound.play(w.indexOf(mt) >= 0 ? 'win' : 'lose'); if (w.length === 1 && w[0] === mt) confetti(); return sleep(100); }); break;
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
