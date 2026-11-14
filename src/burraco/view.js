/* ===== Burraco: il tavolo =====
   In alto gli altri giocatori; al centro le combinazioni calate (prima quelle della mia squadra: toccandole ci
   attacco le carte scelte), poi mazzo, scarti e pozzetti; in basso la mia mano, che si può ordinare per seme o
   per valore e da cui si scelgono più carte. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      Chat.dockHTML() + '<div class="gv-opp" id="gv-opp"></div><div class="melds" id="melds"></div><div class="piles" id="piles"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div><div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Burraco</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Mano ' + g.hand) + ' · ' + g.totals[0] + ' a ' + g.totals[1] + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-opp', others(g, me));
    setHTML('melds', melds(g, me));
    setHTML('piles', piles(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', hand(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function mt(g, me) { return me >= 0 ? E.team(g, me) : 0; }
  function others(g, me) {
    var four = g.players.length === 4;
    return g.players.map(function (P, p) {
      if (p === me) return '';
      var t = E.team(g, p), mate = four && me >= 0 && t === mt(g, me);
      return '<button class="opp' + (g.phase === 'play' && g.turn === p ? ' on' : '') + '" style="--pc:' + pcol(g, p) + ';--tc:' + (four ? TCOL[t] : pcol(g, p)) + '" data-act="player" data-p="' + p + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s"><span class="cnt">' + ART.card(null, false) + '<b>' + P.hand.length + '</b></span>' + (mate ? '<span class="tag ok">compagno</span>' : '') + (P.away ? '<span class="tag away">assente</span>' : P.bot ? '<span class="tag bot">auto</span>' : '') + '</span></button>';
    }).join('');
  }
  function meldHTML(g, m, mine, can) {
    var bur = m.cards.length >= 7;
    return '<button class="meld' + (bur ? ' bur' + (m.clean ? ' clean' : '') : '') + (can ? ' can' : '') + '" ' + (mine ? 'data-act="addto" data-m="' + m.id + '"' : 'disabled') + ' aria-label="' + (m.type === 'run' ? 'Scala' : 'Tris') + ' di ' + m.cards.length + ' carte">' +
      '<span class="mc">' + m.cards.map(function (c) { return ART.flat(c); }).join('') + '</span>' + (bur ? '<span class="bb">' + (m.clean ? 'pulito' : 'sporco') + '</span>' : '<span class="bn">' + m.cards.length + '</span>') + '</button>';
  }
  function melds(g, me) {
    var t = mt(g, me), four = g.players.length === 4, my = me >= 0 && g.phase === 'play' && g.turn === me && g.step === 'play';
    var fit = function (m) { return my && App.sel.length && !!E.analyze(m.cards.concat(App.sel)) && E.analyze(m.cards.concat(App.sel)).type === m.type; };
    function side(tt, title) {
      var ms = g.melds[tt];
      return '<section class="mside' + (tt === t ? ' ours' : '') + '" style="--tc:' + (four ? TCOL[tt] : PCOL[tt]) + '"><h4>' + title + (g.took[tt] ? ' <span class="tag ok">pozzetto preso</span>' : '') + (E.hasBurraco(g, tt) ? ' <span class="tag end">burraco</span>' : '') + '</h4>' +
        (ms.length ? '<div class="mrow">' + ms.map(function (m) { return meldHTML(g, m, tt === t && me >= 0, tt === t && fit(m)); }).join('') + '</div>' : '<p class="muted none">Ancora nessuna combinazione.</p>') + '</section>';
    }
    return side(t, me < 0 ? sideName(g, t) : four ? 'Voi' : 'Tu') + side(1 - t, me < 0 ? sideName(g, 1 - t) : four ? 'Loro' : esc(g.players[1 - t].nick));
  }
  function piles(g, me) {
    var my = me >= 0 && g.phase === 'play' && g.turn === me && g.step === 'draw', top = g.pile[g.pile.length - 1];
    return '<button class="deck' + (my ? ' can' : '') + '" data-act="draw"' + (my ? '' : ' disabled') + ' aria-label="Mazzo, ' + g.deck.length + ' carte">' + ART.card(null, false) + '<i>Mazzo ' + g.deck.length + '</i></button>' +
      '<button class="pile' + (my && top != null ? ' can' : '') + '" data-act="pile"' + (my && top != null ? '' : ' disabled') + ' aria-label="Scarti, ' + g.pile.length + ' carte">' + (top != null ? '<span class="pstack">' + g.pile.slice(-3).map(function (c) { return ART.flat(c); }).join('') + '</span>' : '<span class="pempty"></span>') + '<i>Scarti ' + g.pile.length + '</i></button>' +
      '<div class="pozzi">' + [0, 1].map(function (tt) { return '<span class="pz' + (g.took[tt] ? ' taken' : '') + '" style="--tc:' + (g.players.length === 4 ? TCOL[tt] : PCOL[tt]) + '">' + (g.took[tt] ? '' : ART.card(null, false)) + '<i>' + (tt === mt(g, me) ? 'vostro' : 'loro') + '</i></span>'; }).join('') + '</div>';
  }
  function sorted(hand) {
    var key = App.sort === 'rank' ? function (c) { return E.joker(c) ? 99 : E.rank(c) === 2 ? 98 : (E.rank(c) === 1 ? 14 : E.rank(c)) * 10 + E.suit(c); } : function (c) { return E.joker(c) ? 99 : E.rank(c) === 2 ? 98 : E.suit(c) * 20 + (E.rank(c) === 1 ? 14 : E.rank(c)); };
    return hand.slice().sort(function (a, b) { return key(a) - key(b) || a - b; });
  }
  function hand(g, me) {
    if (me < 0) return '<div class="mine"><p class="muted">Stai guardando la partita.</p></div>';
    var P = g.players[me], my = g.phase === 'play' && g.turn === me;
    return '<div class="mine' + (my ? ' on' : '') + '" style="--pc:' + pcol(g, me) + '"><div class="mine-h"><b>La tua mano (' + P.hand.length + ')</b><button class="chip" data-act="sort">Ordina per ' + (App.sort === 'suit' ? 'valore' : 'seme') + '</button>' + (App.sel.length ? '<button class="chip" data-act="unsel">Deseleziona</button>' : '') + '</div>' +
      '<div class="handrow' + (P.hand.length > 11 ? ' many' : '') + '">' + sorted(P.hand).map(function (c) { return '<button class="hcard' + (App.sel.indexOf(c) >= 0 ? ' sel' : '') + '" data-act="hcard" data-c="' + c + '" aria-label="' + esc(ART.name(c)) + '">' + ART.flat(c) + '</button>'; }).join('') + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.players.length === 4 ? 'Vincono ' : 'Vince ') + sideName(g, g.winners[0]) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'scores') { h = '<b>Mano ' + g.hand + ' finita:</b> ' + g.res.pts[0] + ' a ' + g.res.pts[1] + '.'; btn = '<button class="btn small" data-act="showround">Punti</button>' + (P && !P.ready ? '<button class="btn small" data-act="next">Prossima mano</button>' : ''); help = 'points'; }
    else if (g.turn !== me) h = 'Tocca a ' + pname(g, g.turn) + (g.step === 'draw' ? ': pesca…' : ': gioca…');
    else if (g.step === 'draw') h = '<b>Tocca a te:</b> pesca dal <b>mazzo</b> o prendi gli <b>scarti</b>.';
    else {
      var n = App.sel.length, an = n >= 3 ? E.analyze(App.sel) : null;
      h = n === 0 ? 'Scegli le carte da calare o da attaccare, oppure una carta da <b>scartare</b>.' : n === 1 ? 'Scarti ' + esc(ART.name(App.sel[0])) + '? Oppure tocca una tua combinazione per attaccarla.' : an ? 'Puoi calare ' + (an.type === 'run' ? 'questa scala' : 'questo tris') + '.' : n + ' carte scelte' + (n >= 3 ? ': non fanno una combinazione' : '') + '. Tocca una tua combinazione per attaccarle.';
      if (an) btn += '<button class="btn small" data-act="meld">Cala</button>';
      if (n === 1) btn += '<button class="btn small ghost" data-act="discard">Scarta</button>';
      help = n >= 2 ? 'melds' : 'turn';
    }
    if (P && P.bot && g.phase !== 'over') btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- effetti ---------- */
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
  function flash(sel) { var n = document.querySelector(sel); if (n && n.animate && !reduce) n.animate([{ transform: 'scale(1.08)', filter: 'brightness(1.4)' }, { transform: 'none', filter: 'none' }], { duration: 500 }); }
  function plan(g, me, e) {
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); banner('Mano ' + e.hand, '11 carte a testa'); return sleep(400); }); break;
      case 'draw': enqueue(function () { Sound.play('pick'); return sleep(30); }); break;
      case 'pile': enqueue(function () { Sound.play('take'); if (e.p !== me) toast(esc(g.players[e.p].nick) + ' prende gli scarti (' + e.n + ')'); return sleep(50); }); break;
      case 'meld': case 'add': enqueue(function () { Sound.play(e.bur ? 'scopa' : 'card'); if (e.bur) banner('Burraco ' + (e.clean ? 'pulito!' : 'sporco!'), esc(g.players[e.p].nick)); flash('.meld[data-m="' + e.m + '"]'); return sleep(e.bur ? 300 : 80); }); break;
      case 'discard': enqueue(function () { Sound.play('card'); flash('.pile'); return sleep(60); }); break;
      case 'pozzo': enqueue(function () { Sound.play('big'); banner('Pozzetto!', esc(g.players[e.p].nick) + (e.flying ? ' continua a giocare' : ' lo usa dal prossimo turno')); return sleep(300); }); break;
      case 'close': enqueue(function () { Sound.play('win'); banner('Chiusura!', esc(g.players[e.p].nick)); return sleep(400); }); break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w[0] === mt(G(), me) ? 'win' : 'lose'); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner };
})();
