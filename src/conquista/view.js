/* ===== Conquista l'Italia: schermata di gioco =====
   La domanda con le risposte (o la casella per la stima) e sotto la mappa a tessere: chi vince la domanda tocca
   la regione da prendere, illuminata. Poi si vede la risposta giusta e la regione conquistata. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null, lastClaim = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="sky" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-teams" id="gv-teams"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-main" id="gv-main"><div id="ans"></div><div id="mapbox"></div></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function myTeam(g, me) { return me >= 0 ? g.players[me].team : -1; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx(), Q = D.Q[g.q];
    setHTML('gv-info', '<b>Conquista l’Italia</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Domanda ' + g.round + ' di ' + g.opts.questions) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-teams', g.teams.map(function (T, t) {
      return '<button class="team' + (t === myTeam(g, me) ? ' mine' : '') + '" style="--tc:' + tcol(g, t) + '" data-act="team" data-t="' + t + '"><span class="tm-h"><b>' + esc(T.name) + '</b><span class="tm-s">' + E.count(g, t) + '</span></span><span class="tm-w">regioni · ' + T.wins + ' domande vinte</span>' +
        (g.opts.teams ? '<span class="tm-m">' + E.members(g, t).map(function (i) { var P = g.players[i]; return '<span class="pv sm' + (g.phase === 'q' && P.ans ? ' rd' : '') + '" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>'; }).join('') + '</span>' : '') + '</button>';
    }).join(''));
    setHTML('gv-mid', '<div class="qcard"><span class="qk">' + (Q.k === 'c' ? 'Domanda' : 'Stima') + '</span>' + esc(Q.q) + '</div><div class="tm"><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div>');
    answers(g, me, Q);
    var can = g.phase === 'claim' && g.chooser === me ? E.options(g, myTeam(g, me)) : null;
    setHTML('mapbox', ART.map({ own: g.own, teams: g.teams }, { can: can, last: g.phase === 'show' ? lastClaim : null }));
    setHTML('gv-prompt', prompt(g, me, Q));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    clock();
  }
  function answerText(Q, i) { return Q.k === 'c' ? Q.a[i] : String(i); }
  function answers(g, me, Q) {
    var box = el('ans'), P = me >= 0 ? g.players[me] : null, key = g.round + ':' + g.phase + ':' + (P && P.ans ? 'y' : 'n');
    if (g.phase === 'q' && P && !P.ans) {
      if (box._k === key) return; box._k = key; box._h = null;
      if (Q.k === 'c') box.innerHTML = '<div class="opts">' + g.order.map(function (i) { return '<button class="opt" data-act="pick" data-i="' + i + '">' + esc(Q.a[i]) + '</button>'; }).join('') + '</div>';
      else { box.innerHTML = '<form class="numf" id="numf" autocomplete="off"><input id="nin" class="field" inputmode="numeric" maxlength="9" placeholder="Il tuo numero' + (Q.u ? ' (' + esc(Q.u) + ')' : '') + '"><button class="btn" type="submit">' + IC('send') + ' Invia</button></form>'; if (!('ontouchstart' in window)) setTimeout(function () { var n = el('nin'); if (n) n.focus(); }, 200); }
      return;
    }
    box._k = key;
    var h = '';
    if (g.phase === 'q') h = P ? '<p class="wait">Hai risposto: <b>' + esc(Q.k === 'c' ? Q.a[P.ans.v] : P.ans.v + (Q.u ? ' ' + Q.u : '')) + '</b>. Aspetto gli altri…</p>' : '<p class="wait">Si risponde…</p>';
    else if (g.phase !== 'over') {
      var right = Q.k === 'c' ? Q.a[0] : Q.v + (Q.u ? ' ' + Q.u : ''), R = g.res;
      h = '<p class="sol">Risposta: <b>' + esc(String(right)) + '</b>' + (R ? ' · ' + pname(g, R.p) + (Q.k === 'n' ? ' (' + g.players[R.p].ans.v + ')' : '') + ' in ' + (R.ms / 1000).toFixed(1) + '″' : ' · nessuno l’ha indovinata') + '</p>';
      if (P && P.ans && Q.k === 'c' && P.ans.v !== 0) h += '<p class="wait">Tu avevi detto: ' + esc(Q.a[P.ans.v]) + '</p>';
    }
    if (box._h !== h) { box.innerHTML = h; box._h = h; }
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase !== 'over', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'q' ? g.opts.time * 1000 : g.phase === 'claim' ? 15000 : 4500, txt = g.phase === 'q' || g.phase === 'claim' ? s + '″' : '';
    if (el('tmv').textContent !== txt) el('tmv').textContent = txt;
    el('tbar').style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    el('gv-mid').classList.toggle('low', g.phase === 'q' && s <= 5);
    if (g.phase === 'q' && s <= 3 && s > 0) { var k = g.round + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
  }
  function prompt(g, me, Q) {
    var h = '', btn = '', help = 'answer', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (t) { return tlabel(g, t); }).join(' e ') : 'Vincono ' + tlabel(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'goal'; }
    else if (g.phase === 'claim') { help = 'claim'; h = g.chooser === me ? '<b>Hai vinto!</b> Tocca sulla mappa la regione da prendere.' : pname(g, g.chooser) + ' sceglie una regione per i ' + tlabel(g, g.players[g.chooser].team) + '…'; }
    else if (g.phase === 'show') h = 'Prossima domanda…';
    else if (!P) h = 'Si risponde…';
    else h = P.ans ? 'Risposta data.' : Q.k === 'c' ? 'Tocca la risposta giusta: vince chi risponde giusto per primo.' : 'Scrivi un numero: vince chi ci va più vicino.';
    if (P && P.bot && g.phase !== 'over') btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'over' && !App.sheet) { App.sheet = { kind: 'over' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (news.length > 20) news = news.filter(function (e) { return e.k !== 'answered'; });
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'q': enqueue(function () { Sound.play('deal'); return sleep(50); }); break;
      case 'answered': if (e.p !== me) enqueue(function () { Sound.play('mate'); return sleep(10); }); break;
      case 'won': enqueue(function () { Sound.play(e.t === myTeam(g, me) ? 'good' : 'flag'); banner(esc(g.players[e.p].nick), e.p === me ? 'scegli una regione!' : 'vince la domanda per i ' + esc(g.teams[e.t].name)); return sleep(200); }); break;
      case 'miss': enqueue(function () { Sound.play('no'); return sleep(50); }); break;
      case 'claim': lastClaim = e.r; enqueue(function () { Sound.play('reveal'); render(); toast(esc(g.teams[e.t].name) + (e.from >= 0 ? ' conquistano ' : ' prendono ') + esc(D.R[e.r].name) + (e.from >= 0 ? ' dai ' + esc(g.teams[e.from].name) : '')); return sleep(300); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || [], mt = myTeam(G(), me); Sound.play(w.indexOf(mt) >= 0 ? 'win' : 'lose'); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock };
})();
