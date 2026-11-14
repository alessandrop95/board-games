/* ===== Tiro alla fune di parole: schermata di gioco =====
   In alto la corda, che si sposta verso la squadra che tira di più; al centro la griglia di lettere: si tocca
   una lettera dopo l'altra (vicine) e si manda la parola. Sotto, le parole già trovate dalla mia squadra.
   A fine round: l'elenco delle parole delle due squadre, con le contestazioni e i voti. */
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
    setHTML('gv-info', '<b>Tiro alla fune</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Round ' + g.round) + ' · al meglio di ' + g.opts.rounds + ' · tavolo ' + esc(App.code)) + '</span>');
    var s = E.pull(g);
    setHTML('gv-teams', g.teams.map(function (T, t) {
      return '<button class="team' + (t === myTeam(g, me) ? ' mine' : '') + '" style="--tc:' + tcol(g, t) + '" data-act="team" data-t="' + t + '"><span class="tm-h"><b>' + esc(T.name) + '</b><span class="tm-s">' + s[t] + '</span></span><span class="tm-w">' + Array.from({ length: Math.ceil(g.opts.rounds / 2) }, function (x, i) { return '<i class="' + (i < T.wins ? 'on' : '') + '"></i>'; }).join('') + ' round vinti</span>' +
        '<span class="tm-m">' + E.members(g, t).map(function (i) { var P = g.players[i]; return '<span class="pv sm" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>'; }).join('') + '</span></button>';
    }).join(''));
    var pos = (s[1] - s[0]) / Math.max(16, s[0] + s[1]);
    setHTML('gv-mid', '<div class="ropebar">' + ART.rope(pos) + '</div><div class="tm"><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div>');
    if (g.phase === 'play') play(g, me); else setHTML('gv-main', review(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    clock();
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase === 'play' || g.phase === 'review', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'play' ? g.opts.time * 1000 : 45000, txt = live ? s + '″' : '';
    if (el('tmv').textContent !== txt) el('tmv').textContent = txt;
    el('tbar').style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    el('gv-mid').classList.toggle('low', g.phase === 'play' && s <= 10);
    if (g.phase === 'play' && s <= 5 && s > 0) { var k = g.round + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
  }
  function word() { var g = G(); return App.path.map(function (i) { return g.grid[i]; }).join(''); }
  function play(g, me) {
    var w = word(), mt = myTeam(g, me), n = E.N;
    var cells = g.grid.split('').map(function (l, i) {
      var k = App.path.indexOf(i), last = App.path[App.path.length - 1], nb = me >= 0 && last != null && k < 0 && E.adjacent(last, i);
      return '<button class="cell' + (k >= 0 ? ' on' : '') + (i === last ? ' last' : '') + (nb ? ' nb' : '') + '" data-act="cell" data-i="' + i + '"' + (me < 0 ? ' disabled' : '') + '>' + l.toUpperCase() + (k >= 0 ? '<i>' + (k + 1) + '</i>' : '') + '</button>';
    }).join('');
    var mine = g.words.filter(function (x) { return x.t === mt; }).slice().reverse();
    var other = g.words.filter(function (x) { return x.t !== mt; }).length;
    setHTML('gv-main', '<div class="board" style="--n:' + n + '">' + cells + '</div>' +
      (me >= 0 ? '<div class="wordbar"><button class="iconbtn" data-act="back" aria-label="Togli l’ultima lettera"' + (w ? '' : ' disabled') + '>' + IC('back') + '</button><span class="cw' + (w.length >= 3 ? ' ok' : '') + '">' + (w ? esc(w.toUpperCase()) : '<span class="muted">tocca le lettere</span>') + (w.length >= 3 ? '<small>+' + E.points(w) + '</small>' : '') + '</span><button class="btn small" data-act="send"' + (w.length >= 3 ? '' : ' disabled') + '>' + IC('send') + ' Invia</button></div>' : '') +
      '<div class="found"><span class="fl-h">' + (me >= 0 ? 'Parole della tua squadra (' + mine.length + ')' : 'Parole trovate: ' + g.words.length) + ' · avversari: ' + (me >= 0 ? other : '') + '</span><div class="fw">' + mine.map(function (x) { return '<span class="wchip' + (x.p === me ? ' me' : '') + '">' + esc(x.w) + '<small>+' + x.pts + '</small></span>'; }).join('') + '</div></div>');
  }
  function review(g, me) {
    var mt = myTeam(g, me), open = g.phase === 'review', s = E.pull(g);
    var head = g.phase === 'scores' || g.phase === 'over' ? '<div class="rres">' + (g.res.w < 0 ? 'Round pari!' : 'Round ai <b>' + esc(g.teams[g.res.w].name) + '</b>') + ' · ' + g.res.pts[0] + ' a ' + g.res.pts[1] + '</div>' : '';
    return head + g.teams.map(function (T, t) {
      var list = g.words.map(function (x, i) { return [x, i]; }).filter(function (y) { return y[0].t === t; });
      return '<div class="card wl" style="--tc:' + tcol(g, t) + '"><div class="wl-h"><b>' + esc(T.name) + '</b><span>' + s[t] + '</span></div><div class="fw">' + (list.length ? list.map(function (y) {
        var x = y[0], i = y[1], f = g.flags[i], ok = E.valid(g, i), acts = '';
        if (f) {
          var fo = E.flagOut(f), my = me >= 0 ? f.v[me] : null;
          acts = open && me >= 0 && mt !== t ? '<button class="vb yes' + (my === true ? ' on' : '') + '" data-act="vote" data-i="' + i + '" data-ok="1">' + IC('check') + fo.yes + '</button><button class="vb no' + (my === false ? ' on' : '') + '" data-act="vote" data-i="' + i + '" data-ok="0">' + IC('x') + fo.no + '</button>' : '<small class="vc">' + IC('check') + fo.yes + ' ' + IC('x') + fo.no + '</small>';
        } else if (open && me >= 0 && mt !== t && !x.known) acts = '<button class="flagb" data-act="flag" data-i="' + i + '">' + IC('flag') + '</button>';
        return '<span class="wchip' + (ok ? '' : ' out') + (x.known ? ' kn' : '') + '">' + esc(x.w) + '<small>+' + x.pts + '</small>' + acts + '</span>';
      }).join('') : '<span class="muted">nessuna parola</span>') + '</div></div>';
    }).join('');
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'word', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari!' : 'Vincono i ' + tlabel(g, g.winners[0]) + '.'); btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'goal'; }
    else if (g.phase === 'scores') { h = g.res.w < 0 ? '<b>Round pari.</b>' : '<b>Round ai ' + tlabel(g, g.res.w) + '.</b>'; if (P && !P.ready) btn = '<button class="btn small" data-act="next">Prossimo round</button>'; else h += ' Si riparte tra poco…'; help = 'goal'; }
    else if (g.phase === 'review') {
      help = 'check';
      if (!P) h = 'Si controllano le parole…';
      else if (P.ready) { h = 'Pronto. Aspetto gli altri…'; btn = '<button class="btn small ghost" data-act="unready">Ancora un attimo</button>'; }
      else { h = 'Tempo! Contesta le parole degli avversari che non esistono.'; btn = '<button class="btn small" data-act="ready">' + IC('check') + ' Pronto</button>'; }
      if (isHost) btn += '<button class="btn small ghost" data-act="nextround">Avanti</button>';
    } else if (!P) h = 'Le squadre cercano parole…';
    else { h = 'Tocca lettere vicine e manda la parola: tira la corda!'; if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
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
    if (news.length > 24) news = news.filter(function (e) { return e.k !== 'word'; });
    news.forEach(function (e) { plan(g, me, e); });
  }
  function floatTxt(txt, t) { var r = document.querySelector('.ropebar'); if (!r || reduce) return; r = r.getBoundingClientRect(); var f = document.createElement('div'); f.className = 'floatxt t' + t; f.innerHTML = txt; f.style.left = (r.left + r.width * (t ? .78 : .22)) + 'px'; f.style.top = (r.top + r.height / 2) + 'px'; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1500); }
  function plan(g, me, e) {
    switch (e.k) {
      case 'round': enqueue(function () { Sound.play('deal'); banner('Round ' + e.round, 'Tirate!'); return sleep(300); }); break;
      case 'word': enqueue(function () { Sound.play(e.t === myTeam(g, me) ? 'write' : 'mate'); floatTxt('+' + e.pts + ' ' + esc(e.w), e.t); return sleep(30); }); break;
      case 'review': enqueue(function () { Sound.play('stop'); banner('Tempo!', 'Si controllano le parole'); return sleep(300); }); break;
      case 'flag': enqueue(function () { Sound.play('flag'); return sleep(30); }); break;
      case 'roundEnd': enqueue(function () { var r = G().res; Sound.play('reveal'); if (r && r.w >= 0) banner(r.w === myTeam(g, me) ? 'Round vinto!' : 'Round perso', esc(g.teams[r.w].name) + ' ' + r.pts[r.w] + ' a ' + r.pts[1 - r.w]); if (e.over) { App.sheet = { kind: 'over', fresh: true }; renderSheet(); } return sleep(300); }); break;
      case 'over': enqueue(function () { var w = G().winners || [], mt = myTeam(G(), me); Sound.play(w.length === 1 && w[0] === mt ? 'win' : 'lose'); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, word: word };
})();
