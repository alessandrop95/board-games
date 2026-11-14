/* ===== Sintonia: schermata di gioco =====
   Il tema in grande, la casella per la risposta e chi ha già risposto (senza vedere cosa); poi le risposte
   scoperte squadra per squadra, con i gruppi di compagni in sintonia evidenziati. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="sky" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-teams" id="gv-teams"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-main" id="gv-main"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function myTeam(g, me) { return me >= 0 ? g.players[me].team : -1; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Sintonia</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Tema ' + g.round + ' di ' + g.opts.rounds) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-teams', teams(g, me));
    setHTML('gv-mid', '<div class="theme">' + esc(D.LIST[g.theme].q) + '</div><div class="tm"><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div>');
    if (g.phase === 'write') write(g, me); else setHTML('gv-main', show(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    clock();
  }
  function teams(g, me) {
    var mt = myTeam(g, me);
    return g.teams.map(function (T, t) {
      var mem = E.members(g, t);
      return '<button class="team' + (t === mt ? ' mine' : '') + '" style="--tc:' + tcol(g, t) + '" data-act="team" data-t="' + t + '"><span class="tm-h"><b>' + esc(T.name) + '</b><span class="tm-s">' + T.total + '</span></span>' +
        (g.opts.teams ? '<span class="tm-m">' + mem.map(function (i) { var P = g.players[i], on = g.phase === 'write' ? !!P.ans : P.ready; return '<span class="pv sm' + (on ? ' rd' : '') + '" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>'; }).join('') + '</span>' : (g.phase === 'write' && g.players[t].ans ? '<span class="tag ok">' + IC('check') + ' risposto</span>' : '')) + '</button>';
    }).join('');
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase === 'write' || g.phase === 'show', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'write' ? g.opts.time * 1000 : 15000, txt = g.phase === 'write' ? s + '″' : '';
    if (el('tmv').textContent !== txt) el('tmv').textContent = txt;
    el('tbar').style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    el('gv-mid').classList.toggle('low', g.phase === 'write' && s <= 5);
    if (g.phase === 'write' && s <= 3 && s > 0) { var k = g.round + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
  }
  function write(g, me) {
    var main = el('gv-main');
    if (me < 0) { setHTML('gv-main', '<div class="card answered"><p class="muted">I giocatori stanno scrivendo…</p></div>'); return; }
    var key = 'w:' + g.round;
    if (main._k !== key) {
      main._k = key; main._h = null;
      main.innerHTML = '<form class="card aform" id="aform" autocomplete="off"><label for="ain">La tua risposta</label><div class="row" style="flex-wrap:nowrap"><input id="ain" class="field" maxlength="30" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="La prima cosa che ti viene in mente…"><button class="btn" type="submit">' + IC('send') + ' Invia</button></div><p class="mya" id="mya"></p></form>' +
        '<div class="who-ans" id="whoans"></div>';
      if (!('ontouchstart' in window)) setTimeout(function () { var i = el('ain'); if (i) i.focus(); }, 300);
    }
    var P = g.players[me], mya = el('mya');
    var t = P.ans ? 'Hai scritto: <b>' + esc(P.ans) + '</b> · puoi cambiarla finché c’è tempo.' : '';
    if (mya && mya._h !== t) { mya.innerHTML = t; mya._h = t; }
    var w = el('whoans'), h = g.players.map(function (Q, i) { return '<span class="wa' + (Q.ans ? ' on' : '') + '" style="--pc:' + pcol(g, i) + '">' + (Q.ans ? IC('check') : '…') + ' ' + esc(Q.nick) + '</span>'; }).join('');
    if (w && w._h !== h) { w.innerHTML = h; w._h = h; }
  }
  function show(g, me) {
    var R = g.res; if (!R) return '';
    var mt = myTeam(g, me);
    function chip(x, hi) { return '<span class="grp' + (x.ps.length > 1 ? ' match' : '') + (hi ? ' me' : '') + '"><b>' + esc(x.w) + '</b>' + (x.ps.length > 1 ? '<i>×' + x.ps.length + '</i>' : '') + '<small>' + x.ps.map(function (p) { return esc(g.players[p].nick); }).join(', ') + '</small></span>'; }
    if (g.opts.teams) return g.teams.map(function (T, t) {
      var r = R.teams[t];
      return '<div class="card tres' + (t === mt ? ' mine' : '') + '" style="--tc:' + tcol(g, t) + '"><div class="tres-h"><b>' + esc(T.name) + '</b>' + (r.full ? '<span class="tag end">tutti in sintonia! +2</span>' : '') + '<span class="pts">+' + r.pts + '</span></div><div class="grps">' +
        (r.groups.length ? r.groups.map(function (x) { return chip(x, me >= 0 && x.ps.indexOf(me) >= 0); }).join('') : '<span class="muted">nessuna risposta</span>') + '</div></div>';
    }).join('');
    return '<div class="card tres"><div class="grps">' + R.all.map(function (x) { return chip(x, me >= 0 && x.ps.indexOf(me) >= 0); }).join('') + '</div></div>' +
      '<div class="card"><div class="grps">' + g.players.map(function (P, i) { return '<span class="gc" style="--tc:' + pcol(g, i) + '">' + esc(P.nick) + ' <b>+' + R.players[i] + '</b></span>'; }).join('') + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (t) { return tlabel(g, t); }).join(' e ') : 'Vince ' + tlabel(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'show') {
      help = 'points';
      if (P && !P.ready) { h = 'Ecco le risposte!'; btn = '<button class="btn small" data-act="next">Avanti</button>'; }
      else h = 'Aspetto gli altri…' + (E.pending(g).length ? '' : '');
      if (isHost && P && P.ready) btn += '<button class="btn small ghost" data-act="nextround">Avanti per tutti</button>';
    } else if (!P) h = 'Si scrivono le risposte…';
    else { h = P.ans ? 'Risposta inviata. Aspetto gli altri…' : 'Scrivi la prima cosa che ti viene in mente.'; help = 'phone'; if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
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
      case 'theme': enqueue(function () { Sound.play('deal'); banner(esc(e.q), 'Tema ' + e.round + ' di ' + g.opts.rounds); return sleep(300); }); break;
      case 'answered': if (e.p !== me) enqueue(function () { Sound.play('mate'); return sleep(20); }); break;
      case 'reveal': enqueue(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); var mt = myTeam(G(), me), r = G().res; Sound.play('reveal'); if (r && g.opts.teams && mt >= 0 && r.teams[mt] && r.teams[mt].full) { banner('In sintonia!', 'tutta la squadra +2'); confetti(); } return sleep(200); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || [], mt = myTeam(G(), me); Sound.play(w.indexOf(mt) >= 0 ? 'win' : 'lose'); if (w.indexOf(mt) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#ff5a7a', '#8a4fe0', '#3d8bfd', '#f2b705', '#2fb36d'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock };
})();
