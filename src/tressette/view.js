/* ===== Tressette: il tavolo =====
   Io in basso, gli altri attorno (fino a 6, a vincere in 4 il compagno di fronte); al centro le carte della mano
   e, in due, il tallone. Le carte che non posso giocare (perché devo rispondere al seme) restano in grigio.
   Quando apro la mano in coppia posso accompagnare la carta con un segnale (busso, striscio, volo), che vedono tutti.
   Le carte giocate volano al centro; la mano presa resta un attimo in vista e poi vola da chi l'ha presa. */
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
  var POS = { 2: ['s', 'n'], 3: ['s', 'nw', 'ne'], 4: ['s', 'w', 'n', 'e'], 5: ['s', 'w', 'nw', 'ne', 'e'], 6: ['s', 'w', 'nw', 'n', 'ne', 'e'] };
  function pos(g, p, me) { return (POS[g.players.length] || POS[4])[rel(g, p, me)]; }
  function perd(g) { return g.opts.mode === 'perdere'; }
  function sideCol(g, t) { return E.pairs(g) ? TCOL[t] : pcol(g, t); }
  // la mia mano in ordine: per seme, e nel seme dalla più forte
  function sorted(h) { return h.slice().sort(function (a, b) { return (E.suit(a) - E.suit(b)) || (E.power(b) - E.power(a)); }); }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>' + CFG.title + '</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : (perd(g) ? (g.opts.elim ? 'ad eliminazione · ' : 'a perdere · ') : '') + 'Mano ' + g.hand) + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('table', table(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', hand(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function accTag(g, p) {
    if (!g.accDone[p] || !g.acc[p]) return '';
    return '<span class="acc" title="Accuso">' + esc(g.acc[p].map(E.accText).join(' e ')) + '</span>';
  }
  function seat(g, p, me) {
    var P = g.players[p], t = E.team(g, p), on = g.phase === 'play' && g.turn === p;
    var mate = me >= 0 && p === E.partner(g, me);
    var dr = g.drawn.filter(function (x) { return x.p === p; })[0];
    return '<div class="seat-t ' + pos(g, p, me) + (on ? ' on' : '') + (P.outAt ? ' outp' : '') + '" data-p="' + p + '" style="--pc:' + pcol(g, p) + ';--tc:' + sideCol(g, t) + '">' +
      '<button class="who" data-act="player" data-p="' + p + '"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b>' + (mate ? '<span class="tag ok">compagno</span>' : '') + (P.outAt ? '<span class="tag out">eliminato</span>' : P.away ? '<span class="tag away">assente</span>' : P.bot ? '<span class="tag bot">auto</span>' : '') + '</button>' +
      '<span class="oh">' + (P.hand.length ? ART.card(null, false) + '<i>' + P.hand.length + '</i>' : '') + '</span>' +
      (dr ? '<span class="drawn" title="Carta pescata">' + ART.flat(dr.c) + '<small>pescata</small></span>' : '') + accTag(g, p) + '</div>';
  }
  function scoreBar(g, me) {
    var mt = me >= 0 ? E.team(g, me) : -1, S = E.sides(g), out = '';
    if (E.pairs(g) || g.players.length === 2) {
      var a = mt >= 0 ? mt : 0, b = 1 - a;
      out = '<span style="--tc:' + sideCol(g, a) + '"><b>' + (mt >= 0 ? (E.pairs(g) ? 'Noi' : 'Tu') : esc(E.tname(g, a))) + ' ' + g.totals[a] + '</b> · ' + (mt >= 0 ? (E.pairs(g) ? 'loro' : esc(g.players[b].nick)) : esc(E.tname(g, b))) + ' ' + g.totals[b] + '</span>';
    } else {
      for (var t = 0; t < S; t++) out += '<span class="sc-p' + (t === mt ? ' me' : '') + (g.players[t].outAt ? ' outp' : '') + '" style="--tc:' + sideCol(g, t) + '">' + esc(t === mt ? 'Tu' : g.players[t].nick) + ' <b>' + g.totals[t] + '</b></span>';
    }
    var my = mt >= 0 && g.phase === 'play' && !g.players[me].outAt ? E.sumTh(g.taken[mt], g) : null;
    return '<div class="score">' + out + '<span>' + (perd(g) ? (g.opts.elim ? 'eliminato a ' : 'si chiude a ') : 'si vince a ') + g.opts.target + '</span>' + (my != null ? '<span>' + (E.pairs(g) ? 'Preso da voi' : 'Preso da te') + ': ' + E.fmtTh(my) + '</span>' : '') + '</div>';
  }
  function table(g, me) {
    var n = g.players.length, h = '';
    for (var p = 0; p < n; p++) if (p !== me) h += seat(g, p, me);
    // la mano in corso (o quella appena presa, che resta un attimo in vista)
    var tr = g.trick.length ? g.trick : (App.linger && App.linger.n === g.fxN ? App.linger.trick : []);
    var mid = '<div class="trick n' + n + '" id="trick">' + tr.map(function (x) { return '<span class="tc ' + pos(g, x.p, me) + '" data-p="' + x.p + '">' + ART.flat(x.c) + (x.s ? '<b class="sig">' + E.SIGNALS[x.s] + '</b>' : '') + '</span>'; }).join('') + '</div>';
    var deck = g.deck.length ? '<div class="deck" id="deck"><span class="dk">' + ART.card(null, false) + '</span><i>tallone: ' + g.deck.length + '</i></div>' : '';
    return h + '<div class="center">' + deck + mid + '</div>' + scoreBar(g, me);
  }
  function hand(g, me) {
    if (me < 0) return '<div class="mine"><p class="muted">Stai guardando la partita.</p></div>';
    if (g.players[me].outAt && g.phase !== 'over') return '<div class="mine"><p class="muted">Sei arrivato a ' + g.totals[me] + ' punti e sei <b>eliminato</b>: guardi gli altri finché ne resta uno.</p></div>';
    var P = g.players[me], my = g.phase === 'play' && g.turn === me, L = my ? E.legal(g, me) : null, cs = sorted(P.hand);
    var lead = my && g.trick.length ? E.SN[E.suit(g.trick[0].c)] : null;
    return '<div class="mine' + (my ? ' on' : '') + '" style="--pc:' + pcol(g, me) + '"><div class="mine-h"><b>' + esc(P.nick) + ' (tu)</b>' + accTag(g, me) +
      '<span class="mine-s">' + (lead ? 'rispondi a ' + ART.suitIcon(E.suit(g.trick[0].c)) + ' ' + lead : perd(g) ? 'a perdere: prendi meno punti che puoi' : (E.pairs(g) ? 'in coppia con ' + esc(g.players[E.partner(g, me)].nick) : 'uno contro uno')) + '</span></div>' +
      '<div class="handrow" style="--n:' + Math.max(1, cs.length) + '">' + cs.map(function (c) {
        var no = L && L.indexOf(c) < 0;
        return '<button class="hcard' + (App.sel === c ? ' sel' : '') + (my ? '' : ' locked') + (no ? ' no' : '') + '" data-act="hcard" data-c="' + c + '" aria-label="' + esc(ART.name(c)) + (no ? ' (non puoi giocarla)' : '') + '">' + ART.flat(c) + '</button>';
      }).join('') + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'trick', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') {
      var W = g.winners || [];
      h = '<b>Partita finita.</b> ' + (W.length > 1 ? 'Vincono a pari merito ' + W.map(function (t) { return esc(E.tname(g, t)); }).join(', ') + '.' : (E.pairs(g) ? 'Vincono ' : 'Vince ') + sideName(g, W[0]) + '.');
      btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end';
    } else if (g.phase === 'scores') {
      h = '<b>Mano ' + g.hand + ' finita.</b> ' + g.res.pts.map(function (x, t) { return esc(E.tname(g, t)) + ' ' + x; }).join(', ') + '.';
      btn = '<button class="btn small" data-act="showround">Punti</button>' + (P && !P.ready ? '<button class="btn small" data-act="next">Prossima mano</button>' : ''); help = 'end';
    } else if (g.turn === me) {
      var sig = !g.trick.length && g.opts.signals;
      h = App.sel != null ? 'Giochi ' + esc(ART.name(App.sel)) + '? ' + (sig ? 'Puoi anche dire un segnale.' : 'Toccala di nuovo.') : '<b>Tocca a te:</b> ' + (g.trick.length ? 'rispondi al seme se puoi.' : 'apri la mano con una carta.');
      if (App.sel != null) btn = '<button class="btn small" data-act="doplay">Gioca</button>' + (sig ? Object.keys(E.SIGNALS).map(function (k) { return '<button class="btn small ghost sigb" data-act="doplay" data-s="' + k + '" title="' + esc(E.SIGNAL_TXT[k]) + '">' + E.SIGNALS[k] + '</button>'; }).join('') : '');
      help = g.opts.signals && !g.trick.length ? 'pairs' : perd(g) ? 'lose' : 'trick';
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
      case 'deal': enqueue(function () { App.linger = null; Sound.play('deal'); banner('Mano ' + e.hand, perd(g) ? (g.opts.elim ? 'restano in ' + E.alive(g).length : 'a perdere') : 'a vincere'); render(); return sleep(500); }); break;
      case 'play': enqueue(function () {
        Sound.play('card'); if (App.linger) render();
        var tc = document.querySelector('.trick .tc[data-p="' + e.p + '"]'), src = rect(seatEl(e.p));
        if (e.s) { Sound.play('sign'); floatTxt(rect(tc), '«' + E.SIGNALS[e.s] + '»'); }
        if (tc) { tc.style.visibility = 'hidden'; return fly(ART.flat(e.c), src, rect(tc)).then(function () { tc.style.visibility = ''; }); }
        return sleep(50);
      }); break;
      case 'take': {
        // la mano presa resta in vista un attimo, poi vola da chi l'ha presa
        App.linger = { n: g.fxN, trick: g.last ? g.last.trick : [] };
        enqueue(function () {
          render(); return sleep(900).then(function () {
            var dst = rect(seatEl(e.p)), jobs = [];
            document.querySelectorAll('.trick .tc').forEach(function (n, j) { var r = rect(n); n.style.visibility = 'hidden'; jobs.push(fly(n.querySelector('.skc') ? n.querySelector('.skc').outerHTML : n.innerHTML, r, dst ? { left: dst.left, top: dst.top, width: r.width * .6, height: r.height * .6 } : null, { dur: 420, delay: j * 40 })); });
            Sound.play(e.th >= 3 ? 'big' : 'take'); if (e.th) floatTxt(dst, '+' + E.fmtTh(e.th));
            return Promise.all(jobs).then(function () { App.linger = null; render(); });
          });
        });
        break;
      }
      case 'draw': enqueue(function () {
        var mine = e.d.filter(function (x) { return x.p === me; })[0];
        if (mine) toast('Hai pescato ' + esc(ART.name(mine.c)) + '.');
        render(); return sleep(150);
      }); break;
      case 'accuse': enqueue(function () { Sound.play('sign'); toast('<b>' + esc(g.players[e.p].nick) + '</b> accusa ' + esc(e.a.map(E.accText).join(' e ')) + ': +' + e.pts + (e.pts === 1 ? ' punto' : ' punti')); return sleep(80); }); break;
      case 'out': enqueue(function () { toast(e.ps.map(function (p) { return p === me ? 'Sei arrivato a ' + g.opts.target + ' punti: <b>sei eliminato</b>.' : '<b>' + esc(g.players[p].nick) + '</b> arriva a ' + g.opts.target + ' punti ed è eliminato.'; }).join(' '), '', 4500); return sleep(60); }); break;
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
