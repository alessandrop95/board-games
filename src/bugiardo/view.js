/* ===== Dadi del bugiardo: schermata di gioco =====
   In alto i giocatori con il bicchiere e quanti dadi hanno; al centro l'ultima dichiarazione e quelle del giro;
   in basso i tuoi dadi e, al tuo turno, la scelta: alzare (valore e quantità) o «Dubito!». A bicchieri alzati si
   vedono i dadi di tutti, con quelli che contano evidenziati. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, pick = null, pickKey = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; return true; } return false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-pl" id="gv-pl"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-me" id="gv-me"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code; pick = null; pickKey = null;
  }
  function unmount() { mountedFor = null; }
  function counts(g, f, v) { return v === f || (g.opts.ones && f !== 1 && v === 1); }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Dadi del bugiardo</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Giro ' + g.round) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-pl', players(g, me));
    setHTML('gv-mid', g.phase === 'bid' ? mid(g, me) : reveal(g, me));
    setHTML('gv-me', mePanel(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function lastBidOf(g, p) { for (var i = g.bids.length - 1; i >= 0; i--) if (g.bids[i].p === p) return g.bids[i]; return null; }
  function players(g, me) {
    return g.players.map(function (P, i) {
      var turn = g.phase === 'bid' && g.turn === i, lb = g.phase === 'bid' ? lastBidOf(g, i) : null, dots = '';
      for (var k = 0; k < g.opts.dice; k++) dots += '<i class="' + (k < P.n ? 'on' : '') + '"></i>';
      return '<button class="pl' + (i === me ? ' mine' : '') + (turn ? ' turn' : '') + (P.out ? ' out' : '') + '" style="--pc:' + pcol(g, i) + '" data-act="players">' +
        '<span class="pl-cup">' + ART.cup() + '<b>' + P.n + '</b></span><span class="pl-t"><b>' + esc(P.nick) + '</b><span class="dots">' + dots + '</span>' + (P.out ? '<small>fuori</small>' : lb ? '<small class="lb">«' + E.bidTxt(lb) + '»</small>' : turn ? '<small class="th">pensa…</small>' : '<small>&nbsp;</small>') + '</span></button>';
    }).join('');
  }
  function bidBox(g, b, big) { return '<span class="bidv' + (big ? ' big' : '') + '"><b>' + b.q + '</b><span class="x">×</span>' + ART.die(b.f) + '</span>'; }
  function mid(g, me) {
    var tot = E.totalDice(g), b = g.bid;
    var head = '<div class="mid-top"><span class="tot">' + IC('cup') + ' In gioco <b>' + tot + '</b> dadi</span>' + (g.opts.ones ? '<span class="jolly">' + ART.die(1) + ' jolly</span>' : '') + '</div>';
    if (!b) return head + '<div class="bid-now empty"><span class="who">' + (g.turn === me ? 'Apri tu il giro' : 'Apre ' + pname(g, g.turn)) + '</span><span class="muted">Nessuna dichiarazione, per ora.</span></div>';
    var hist = g.bids.slice(0, -1).slice(-5).map(function (x) { return '<span class="hb" style="--pc:' + pcol(g, x.p) + '">' + esc(g.players[x.p].nick) + ' ' + x.q + '×' + ART.die(x.f) + '</span>'; }).join('');
    return head + '<div class="bid-now"><span class="who">' + pname(g, b.p) + ' dichiara</span>' + bidBox(g, b, true) + '<span class="say">«' + E.bidTxt(b) + '»' + (g.opts.ones && b.f !== 1 ? ' <small>(con gli 1)</small>' : '') + '</span></div>' + (hist ? '<div class="hist">' + hist + '</div>' : '');
  }
  function reveal(g, me) {
    var R = g.res; if (!R) return '';
    var f = R.bid.f, txt;
    if (R.kind === 'doubt') txt = pname(g, R.by) + ' ha detto <b>Dubito!</b> su «' + E.bidTxt(R.bid) + '» di ' + pname(g, R.bidder) + '.';
    else txt = pname(g, R.by) + ' ha detto <b>Esatto!</b> su «' + E.bidTxt(R.bid) + '».';
    var out = R.loser != null ? 'Perde un dado ' + pname(g, R.loser) + (g.players[R.loser].out ? ', che è <b>fuori</b>!' : '.') : R.gainer != null ? pname(g, R.gainer) + ' riprende un dado!' : 'Nessuno perde dadi.';
    var rows = g.players.map(function (P, i) {
      var d = R.dice[i]; if (!d || !d.length) return '';
      var n = d.filter(function (v) { return counts(g, f, v); }).length;
      return '<div class="rv' + (i === me ? ' mine' : '') + '" style="--pc:' + pcol(g, i) + '"><b class="rv-n">' + esc(P.nick) + '</b><span class="rv-d">' + d.map(function (v) { return ART.die(v, counts(g, f, v) ? 'hit' : 'miss'); }).join('') + '</span><span class="rv-c">' + (n ? '+' + n : '') + '</span></div>';
    }).join('');
    return '<div class="res' + (R.ok ? ' ok' : ' ko') + '"><p>' + txt + '</p><div class="res-n">Ce ne sono ' + bidBox(g, { q: R.count, f: f }) + '<span class="res-v">' + (R.kind === 'doubt' ? (R.ok ? 'Bluff scoperto!' : 'Era vero!') : (R.ok ? 'Proprio così!' : 'Sbagliato!')) + '</span></div><p class="res-o">' + out + '</p></div><div class="rvs">' + rows + '</div>';
  }
  function minPick(g, f) { return Math.max(1, E.minQ(g, f, g.bid)); }
  function mePanel(g, me) {
    if (g.phase === 'over' || g.phase === 'show') return '';
    if (me < 0) return '<div class="card"><p class="muted">Stai guardando la partita.</p></div>';
    var P = g.players[me];
    if (P.out) return '<div class="card"><p class="lead">Hai perso tutti i dadi: sei fuori. Guarda come finisce!</p></div>';
    var f = g.phase === 'bid' && g.bid ? g.bid.f : g.res ? g.res.bid.f : 0;
    var dice = g.phase === 'show' ? (g.res.dice[me] || []) : P.dice;
    var mineN = f ? dice.filter(function (v) { return counts(g, f, v); }).length : 0;
    var hand = '<div class="myd"><span class="myd-l">I tuoi dadi' + (f && g.phase === 'bid' ? ' · ' + mineN + ' per «' + E.bidTxt(g.bid) + '»' : '') + '</span><div class="myd-d">' + dice.map(function (v) { return ART.die(v, f ? (counts(g, f, v) ? 'hit' : 'miss') : ''); }).join('') + '</div></div>';
    if (g.phase !== 'bid' || g.turn !== me) return '<div class="card me">' + hand + '</div>';
    // la mia scelta
    var key = g.round + ':' + g.bids.length;
    if (pickKey !== key || !pick) {
      pickKey = key;
      var best = 2, bc = -1; for (var v = 1; v <= 6; v++) { if (!g.bid && g.opts.ones && v === 1) continue; var c = P.dice.filter(function (x) { return counts(g, v, x); }).length; if (c > bc || (c === bc && v > best)) { bc = c; best = v; } }
      var f0 = g.bid ? g.bid.f : best; if (g.bid && minPick(g, f0) > E.totalDice(g)) f0 = best;
      pick = { f: f0, q: g.bid ? minPick(g, f0) : Math.max(1, bc) };
    }
    var tot = E.totalDice(g), valid = pick.q <= tot && E.higher(g, pick, g.bid);
    var faces = ''; for (var k = 1; k <= 6; k++) { var dis = (!g.bid && g.opts.ones && k === 1) || minPick(g, k) > tot; faces += '<button class="face' + (pick.f === k ? ' on' : '') + '" data-act="face" data-f="' + k + '"' + (dis ? ' disabled' : '') + ' aria-label="Valore ' + k + '">' + ART.die(k) + '</button>'; }
    return '<div class="card me myturn">' + hand +
      '<div class="pick"><div class="faces">' + faces + '</div>' +
      '<div class="qrow"><button class="qb" data-act="qminus"' + (pick.q <= minPick(g, pick.f) ? ' disabled' : '') + ' aria-label="Meno">' + IC('minus') + '</button><span class="qv">' + bidBox(g, pick, true) + '</span><button class="qb" data-act="qplus"' + (pick.q >= tot ? ' disabled' : '') + ' aria-label="Più">' + IC('plus') + '</button></div>' +
      '<button class="btn block bidbtn" data-act="bid"' + (valid ? '' : ' disabled') + '>' + IC('up') + ' Dichiaro «' + E.bidTxt(pick) + '»</button>' +
      (g.bid ? '<div class="calls"><button class="btn red" data-act="doubt">' + IC('eye') + ' Dubito!</button>' + (g.opts.exact ? '<button class="btn ghost exact" data-act="exact">' + IC('target') + ' Esatto!</button>' : '') + '</div>' : '') + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> Vince ' + pname(g, g.winners[0]) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; }
    else if (g.phase === 'show') {
      help = 'doubt';
      if (P && !P.out && !P.ready) { h = 'Bicchieri alzati!'; btn = '<button class="btn small" data-act="next">Prossimo giro</button>'; }
      else h = 'Aspetto gli altri…';
      if (isHost && P && (P.ready || P.out)) btn += '<button class="btn small ghost" data-act="nextround">Avanti per tutti</button>';
    } else if (P && !P.out && g.turn === me) { h = '<b>Tocca a te!</b>' + (g.bid ? ' Alza o dubita.' : ' Apri il giro.') + '<span class="tt" id="tt"></span>'; help = g.bid ? 'bid' : 'goal'; if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
    else { h = 'Tocca a ' + pname(g, g.turn) + '…'; help = 'bid'; if (P && P.bot && !P.out) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function clock() {}
  // la scelta al mio turno (valore e quantità), tenuta sul telefono
  function choose(a, el) {
    var g = G(); if (!g || !pick) return;
    var tot = E.totalDice(g);
    if (a === 'face') { var f = +el.getAttribute('data-f'), m = minPick(g, f); pick = { f: f, q: Math.max(m, Math.min(pick.q, tot)) }; if (!E.higher(g, pick, g.bid)) pick.q = m; }
    if (a === 'qminus') pick.q = Math.max(minPick(g, pick.f), pick.q - 1);
    if (a === 'qplus') pick.q = Math.min(tot, pick.q + 1);
    Sound.play('click'); render();
  }
  function picked() { return pick; }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'over' && !App.sheet) { App.sheet = { kind: 'over' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'roll': enqueue(function () { Sound.play('roll'); var d = el('gv'); if (d && !reduce) { d.classList.remove('rolling'); void d.offsetWidth; d.classList.add('rolling'); } return sleep(600); }); break;
      case 'bid': enqueue(function () { Sound.play(e.p === me ? 'bidme' : 'bid'); if (e.p !== me) { var x = el('gv-mid'); if (x && !reduce) { x.classList.remove('pop'); void x.offsetWidth; x.classList.add('pop'); } } return sleep(150); }); break;
      case 'reveal': enqueue(function () { var R = G().res; Sound.play('lift'); banner(e.kind === 'doubt' ? 'Dubito!' : 'Esatto!', esc(G().players[e.by].nick)); setTimeout(function () { Sound.play(e.ok ? 'good' : 'bad'); }, 700); return sleep(900); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#fbf6ea', '#c8202f', '#e0b85a', '#ff7a59', '#8ff0a4'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, choose: choose, picked: picked };
})();
