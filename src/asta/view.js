/* ===== Asta lampo: schermata di gioco =====
   In alto i giocatori con monete, gemme per colore e maledizioni (tutto pubblico: serve per fare i conti). Al centro
   il lotto all'asta con il tempo che scorre; poi le offerte di tutti, scoperte insieme. In basso la mia collezione e
   la mia offerta, con −/+ e il valore stimato del lotto per me. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, val = 0, valKey = null, lastTick = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; return true; } return false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-pl" id="gv-pl"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-me" id="gv-me"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code; valKey = null;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    if (valKey !== g.lot) { valKey = g.lot; val = me >= 0 && g.players[me].bid != null ? g.players[me].bid : 0; }
    setHTML('gv-info', '<b>Asta lampo</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Asta chiusa' : 'Lotto ' + g.lot + ' di ' + g.total) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-pl', players(g, me));
    setHTML('gv-mid', mid(g, me));
    setHTML('gv-me', mePanel(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    clock();
  }
  function coll(g, P) {
    var tot = E.colorTot(P);
    return '<span class="coll">' + tot.map(function (t, c) { return '<span class="cg' + (t ? '' : ' none') + '">' + ART.dot(c) + '<b>' + t + '</b></span>'; }).join('') + (P.curses.length ? '<span class="cc">' + IC('skull') + '<b>' + P.curses.length + '</b></span>' : '') + '</span>';
  }
  function players(g, me) {
    var R = g.phase === 'show' ? g.res : null;
    return g.players.map(function (P, i) {
      var st = '';
      if (g.phase === 'bid') st = P.bid != null ? '<small class="ok">' + IC('check') + ' offerto</small>' : '<small class="th">pensa…</small>';
      else if (R) st = '<small class="bv' + (R.who === i ? ' w' : '') + '">offre ' + R.bids[i] + '</small>';
      return '<button class="pl' + (i === me ? ' mine' : '') + (R && R.who === i ? ' won ' + R.kind : '') + '" style="--pc:' + pcol(g, i) + '" data-act="players" data-p="' + i + '">' +
        '<span class="pl-h"><span class="pl-av">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b class="pl-n">' + esc(P.nick) + '</b><span class="coins">' + IC('coin') + '<b>' + P.coins + '</b></span></span>' + coll(g, P) + st + '</button>';
    }).join('');
  }
  function lotCards(g, cards, big) { return '<div class="lot' + (big ? ' big' : '') + (cards.length > 2 ? ' many' : '') + '">' + cards.map(function (id, k) { return '<span class="lc" style="--k:' + k + '">' + ART.card(id) + '</span>'; }).join('') + '</div>'; }
  function mid(g, me) {
    if (g.phase === 'over') return '<div class="lot-h"><b>Asta chiusa!</b></div>' + scoreTable(g) + '<button class="btn small" data-act="showover">Classifica</button>';
    var cur = g.cur, R = g.phase === 'show' ? g.res : null;
    var head = '<div class="lot-h"><span class="kicker">Lotto ' + g.lot + ' di ' + g.total + '</span><b>' + (cur.kind === 'curse' ? IC('skull') + ' Maledizione: la prende chi offre meno' : cur.cards.length > 1 ? IC('bolt') + ' Si è accumulato: ' + cur.cards.length + ' gemme!' : 'Una gemma all’asta') + '</b></div>';
    var body = lotCards(g, cur.cards, true);
    if (g.phase === 'bid') return head + body + '<div class="tm"><span class="tbar2"><i id="tbar"></i></span><span class="tmv" id="tmv"></span></div><div class="waiting">' + waitTxt(g, me) + '</div>';
    // risultato
    var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return cur.kind === 'curse' ? R.bids[a] - R.bids[b] : R.bids[b] - R.bids[a]; });
    var txt = R.kind === 'curse' ? pname(g, R.who) + ' offre meno di tutti e si prende la maledizione' + (R.got ? ', ma incassa <b>' + E.coinsTxt(R.got) + '</b>.' : '.') :
      R.carried ? '<b>Pari in testa!</b> Nessuno vince: ' + (R.cards.length > 1 ? 'le gemme restano' : 'la gemma resta') + ' sul banco e il prossimo lotto ne avrà una in più.' :
      pname(g, R.who) + ' vince il lotto e paga <b>' + E.coinsTxt(R.paid) + '</b>.';
    var top = cur.kind === 'curse' ? null : Math.max.apply(null, R.bids);
    return head + body + '<div class="res ' + (R.kind === 'curse' ? 'curse' : R.carried ? 'tie' : 'win') + '"><p>' + txt + '</p><div class="bids">' + order.map(function (i, k) {
      var cls = i === R.who ? ' who' : (R.carried && R.bids[i] === top ? ' tied' : '');
      return '<span class="bd' + cls + '" style="--pc:' + pcol(g, i) + ';animation-delay:' + (k * .12) + 's"><b>' + R.bids[i] + '</b><small>' + esc(g.players[i].nick) + '</small></span>';
    }).join('') + '</div></div>';
  }
  function waitTxt(g, me) {
    var w = E.pending(g).filter(function (i) { return i !== me; });
    return w.length ? 'Devono ancora offrire: ' + w.map(function (i) { return pname(g, i); }).join(', ') : me >= 0 && g.players[me].bid == null ? 'Mancano solo le tue monete!' : 'Si scoprono le offerte…';
  }
  // valore stimato del lotto per me: gemme, maggioranze e collezioni che cambiano
  function worthFor(g, me) {
    var P = g.players[me], b = E.score(g, me), save = P.gems; P.gems = P.gems.concat(g.cur.cards); var a = E.score(g, me); P.gems = save;
    return (a.gems + a.maj + a.sets) - (b.gems + b.maj + b.sets);
  }
  function mine(g, P) {
    if (!P.gems.length && !P.curses.length) return '<p class="muted tc">Ancora nessuna carta: la tua collezione comincia qui.</p>';
    var ids = P.gems.slice().sort(function (a, b) { var A = E.CARDS[a], B = E.CARDS[b]; return A.c - B.c || A.v - B.v; }).concat(P.curses);
    return '<div class="mycards">' + ids.map(function (id) { return ART.card(id, 'mini'); }).join('') + '</div>';
  }
  function mePanel(g, me) {
    if (me < 0) return '<div class="card"><p class="muted tc">Stai guardando l’asta.</p></div>';
    var P = g.players[me], s = E.score(g, me);
    var head = '<div class="me-h"><span class="coins big">' + IC('coin') + '<b>' + P.coins + '</b></span><span class="muted">' + s.total + ' punti adesso</span></div>';
    if (g.phase !== 'bid') return '<div class="card me">' + head + mine(g, P) + '</div>';
    val = Math.max(0, Math.min(val, P.coins));
    var hint = g.cur.kind === 'curse' ? 'Se la prendi: <b>' + E.CARDS[g.cur.cards[0]].v + '</b> punti, ma incassi le offerte degli altri.' : 'Per te vale circa <b>+' + worthFor(g, me) + '</b> punti (ogni moneta avanzata vale ½).';
    var done = P.bid != null;
    return '<div class="card me' + (done ? '' : ' myturn') + '">' + head +
      '<p class="hint">' + hint + '</p>' +
      '<div class="qrow"><button class="qb" data-act="dec5"' + (val < 1 ? ' disabled' : '') + ' aria-label="Meno 5">−5</button><button class="qb" data-act="dec"' + (val < 1 ? ' disabled' : '') + ' aria-label="Meno uno">' + IC('minus') + '</button>' +
      '<span class="qv"><b>' + val + '</b><small>' + (val === 1 ? 'moneta' : 'monete') + '</small></span>' +
      '<button class="qb" data-act="inc"' + (val >= P.coins ? ' disabled' : '') + ' aria-label="Più uno">' + IC('plus') + '</button><button class="qb" data-act="inc5"' + (val >= P.coins ? ' disabled' : '') + ' aria-label="Più 5">+5</button></div>' +
      '<div class="quick"><button class="chip" data-act="setv" data-v="0">0</button><button class="chip" data-act="setv" data-v="' + Math.floor(P.coins / 4) + '">¼</button><button class="chip" data-act="setv" data-v="' + Math.floor(P.coins / 2) + '">½</button><button class="chip" data-act="setv" data-v="' + P.coins + '">Tutte</button></div>' +
      '<button class="btn block bidbtn" data-act="offer"' + (done && P.bid === val ? ' disabled' : '') + '>' + IC('gavel') + (done ? (P.bid === val ? ' Hai offerto ' + val : ' Cambia: offro ' + val) : ' Offro ' + val) + '</button>' +
      mine(g, P) + '</div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Asta chiusa.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'show') { h = 'Offerte scoperte. Tra poco il prossimo lotto…'; help = g.res.kind === 'curse' ? 'curse' : 'gem'; if (isHost) btn = '<button class="btn small ghost" data-act="nextround">Avanti</button>'; }
    else if (P && P.bid == null) { h = '<b>Fai la tua offerta!</b> ' + (g.cur.kind === 'curse' ? 'Chi offre meno prende la maledizione.' : 'Vince la più alta, a parità nessuno.'); help = g.cur.kind === 'curse' ? 'curse' : 'bid'; if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
    else if (P) { h = 'Hai offerto ' + E.coinsTxt(P.bid) + '. Aspetto gli altri…'; help = 'bid'; }
    else h = 'Si fanno le offerte…';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase === 'bid', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000), total = g.opts.time * 1000;
    var tv = el('tmv'), tb = el('tbar'), txt = live ? s + '″' : '';
    if (tv.textContent !== txt) tv.textContent = txt;
    if (tb) tb.style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    var mid = el('gv-mid'); if (mid) mid.classList.toggle('low', live && s <= 5);
    var me = myIdx();
    if (live && me >= 0 && g.players[me].bid == null && s <= 5 && s > 0) { var k = g.lot + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
  }
  function setVal(v) { var g = G(), me = myIdx(); if (!g || me < 0) return; val = Math.max(0, Math.min(g.players[me].coins, v)); Sound.play('click'); render(); }
  function nudge(a) { setVal(val + ({ dec: -1, inc: 1, dec5: -5, inc5: 5 })[a]); }
  function value() { return val; }
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
      case 'lot': enqueue(function () { Sound.play('lot'); if (e.n > 1) banner('Il lotto cresce!', e.n + ' gemme all’asta'); return sleep(200); }); break;
      case 'bid': if (e.p !== me) enqueue(function () { Sound.play('bid'); return sleep(30); }); break;
      case 'win': enqueue(function () { Sound.play('gavel'); setTimeout(function () { Sound.play(e.p === me ? 'got' : 'bid'); }, 250); banner(e.p === me ? 'Tuo!' : 'Aggiudicato!', esc(G().players[e.p].nick) + ' · ' + E.coinsTxt(e.paid)); return sleep(500); }); break;
      case 'tie': enqueue(function () { Sound.play('gavel'); setTimeout(function () { Sound.play('tie'); }, 200); banner('Pari!', 'Il lotto resta sul banco'); return sleep(500); }); break;
      case 'curse': enqueue(function () { Sound.play('curse'); banner('Maledizione!', esc(G().players[e.p].nick) + (e.got ? ' incassa ' + E.coinsTxt(e.got) : '')); return sleep(500); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#ff6b7a', '#7fb2ff', '#6ff0a4', '#ffe27a', '#ffd84a'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, setVal: setVal, nudge: nudge, value: value };
})();
