/* ===== Nomi, cose, città: schermata di gioco =====
   In alto le squadre (punti e caselle riempite), al centro la lettera e il tempo, sotto il foglio della mia
   squadra: le caselle si aggiornano in diretta quando scrive un compagno, senza toccare quella dove sto scrivendo.
   Dopo il tempo: tutte le risposte per categoria, con i punti, le contestazioni e i voti. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function backdrop() { return '<div class="sky" aria-hidden="true"><div class="lines"></div><div class="margin"></div></div>'; }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + backdrop() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-teams" id="gv-teams"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-main" id="gv-main"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Nomi, cose, città</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Manche ' + g.round + ' di ' + g.opts.rounds) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-teams', teams(g, me));
    setHTML('gv-mid', mid(g, me));
    if (g.phase === 'write') write(g, me); else setHTML('gv-main', review(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    el('gv').classList.toggle('writing', g.phase === 'write');
    clock();
  }
  function myTeam(g, me) { return me >= 0 ? g.players[me].team : -1; }

  /* ---------- squadre ---------- */
  function teams(g, me) {
    var mt = myTeam(g, me);
    return g.teams.map(function (T, t) {
      var mem = E.members(g, t), n = E.filled(g, t);
      var dots = g.phase === 'write' ? '<span class="dots">' + g.cats.map(function (c, k) { return '<i class="' + (k < n ? 'on' : '') + '"></i>'; }).join('') + '</span>' : '';
      var tag = g.stop && g.stop.t === t && g.phase === 'write' ? '<span class="tag end">STOP!</span>' : (g.phase === 'review' || g.phase === 'scores') && mem.every(function (i) { return g.players[i].ready; }) ? '<span class="tag ok">pronti</span>' : '';
      return '<button class="team' + (t === mt ? ' mine' : '') + '" style="--tc:' + tcol(g, t) + '" data-act="team" data-t="' + t + '"><span class="tm-h"><b>' + esc(T.name) + '</b><span class="tm-s">' + T.total + '</span></span>' +
        (g.opts.teams ? '<span class="tm-m">' + mem.map(function (i) { var P = g.players[i]; return '<span class="pv sm' + (P.ready && g.phase !== 'write' ? ' rd' : '') + '" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>'; }).join('') + '</span>' : '') +
        dots + tag + '</button>';
    }).join('');
  }

  /* ---------- lettera e tempo ---------- */
  function mid(g, me) {
    var lbl = g.phase === 'write' ? (g.stop ? 'STOP! Ultimi secondi' : 'Tempo per scrivere') : g.phase === 'review' ? 'Tempo per controllare' : g.phase === 'scores' ? 'Manche finita' : 'Partita finita';
    return '<div class="lt">' + ART.tile(g.letter, { cls: 'big' }) + '</div><div class="tm"><span class="tml">' + lbl + '</span><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div>';
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase === 'write' || g.phase === 'review', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'write' ? g.opts.time * 1000 : 75000, tv = el('tmv'), tb = el('tbar');
    var txt = live ? (s >= 60 ? Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2) : s + '″') : '';
    if (tv.textContent !== txt) tv.textContent = txt;
    if (tb) tb.style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    var low = live && s <= 10; el('gv-mid').classList.toggle('low', low);
    if (g.phase === 'write' && s <= 5 && s > 0) { var k = g.round + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play(s === 1 ? 'last' : 'tick'); } }
  }

  /* ---------- il foglio della squadra ---------- */
  function write(g, me) {
    var main = el('gv-main');
    if (me < 0) { setHTML('gv-main', '<div class="paper"><p class="muted" style="text-align:center">Le squadre stanno scrivendo. Le risposte si vedono quando finisce il tempo.</p></div>'); return; }
    var t = myTeam(g, me), key = 'w:' + g.round + ':' + t + ':' + g.cats.join(',');
    if (main._k !== key) {
      main._k = key; main._h = null;
      main.innerHTML = '<div class="paper" id="paper">' + g.cats.map(function (c, i) {
        return '<label class="cell" id="cell-' + c + '"><span class="cl">' + esc(catName(c)) + '</span><input id="in-' + c + '" class="cin" data-c="' + c + '" data-i="' + i + '" maxlength="32" autocomplete="off" autocorrect="off" autocapitalize="words" spellcheck="false" enterkeyhint="' + (i < g.cats.length - 1 ? 'next' : 'done') + '" placeholder="' + g.letter + '…"><span class="by" id="by-' + c + '"></span></label>';
      }).join('') + '</div>';
    }
    var ans = g.ans[t] || {}, now = Date.now();
    g.cats.forEach(function (c) {
      var inp = el('in-' + c), cell = el('cell-' + c), a = ans[c], sv = a ? a.w : '';
      if (!inp) return;
      if (document.activeElement !== inp && !(App.hold && App.hold[c] > now) && inp.value !== sv) {
        inp.value = sv;
        if (a && a.by !== me && cell) { cell.classList.remove('flash'); void cell.offsetWidth; cell.classList.add('flash'); }
      }
      var by = el('by-' + c), who = a && a.by != null && g.players[a.by] ? a.by : null;
      var bh = who != null && who !== me ? '<span class="pv sm" style="--pc:' + pcol(g, who) + '" title="Scritto da ' + esc(g.players[who].nick) + '">' + esc(g.players[who].nick.charAt(0).toUpperCase()) + '</span>' : '';
      if (by && by._h !== bh) { by.innerHTML = bh; by._h = bh; }
      var st = E.check(inp.value, g.letter);
      if (cell) { cell.classList.toggle('ok', st === 'ok'); cell.classList.toggle('bad', st === 'letter' || st === 'short'); }
    });
  }

  /* ---------- il controllo ---------- */
  function badge(g, why, pts) {
    var txt = { only: 'unica', uniq: '', dup: 'doppione', empty: 'vuota', short: 'troppo corta', letter: 'non è ' + g.letter, voted: 'bocciata' }[why] || '';
    return '<span class="pt p' + pts + '">' + (pts ? '+' + pts : '0') + '</span>' + (txt ? '<small class="why">' + txt + '</small>' : '');
  }
  function review(g, me) {
    if (!g.rev) return '';
    var P = g.phase === 'review' ? E.points(g) : g.res || E.points(g), mt = myTeam(g, me), open = g.phase === 'review';
    return '<div class="paper rev">' + g.cats.map(function (c) {
      return '<div class="rcat"><h4>' + esc(catName(c)) + '</h4>' + g.teams.map(function (T, t) {
        var cell = g.rev.cells[t][c], f = g.flags[t + ':' + c], why = P.why[t][c], pts = P.pts[t][c], acts = '';
        if (f) {
          var fo = E.flagOut(f), my = me >= 0 ? f.v[me] : null, can = open && me >= 0 && mt !== t;
          acts = '<span class="vote">' + (can ? '<button class="vb yes' + (my === true ? ' on' : '') + '" data-act="vote" data-t="' + t + '" data-c="' + c + '" data-ok="1" aria-label="Vale">' + IC('check') + ' ' + fo.yes + '</button><button class="vb no' + (my === false ? ' on' : '') + '" data-act="vote" data-t="' + t + '" data-c="' + c + '" data-ok="0" aria-label="Non vale">' + IC('x') + ' ' + fo.no + '</button>'
            : '<span class="vc">' + IC('check') + fo.yes + ' ' + IC('x') + fo.no + '</span>') + '</span>';
        } else if (open && me >= 0 && mt !== t && cell.st === 'ok') acts = '<button class="chip flagb" data-act="flag" data-t="' + t + '" data-c="' + c + '">' + IC('flag') + ' Contesta</button>';
        var by = cell.by != null && g.players[cell.by] && g.opts.teams ? '<small class="wby">' + esc(g.players[cell.by].nick) + '</small>' : '';
        return '<div class="rr2' + (t === mt ? ' mine' : '') + (f ? ' flagged' : '') + '" style="--tc:' + tcol(g, t) + '"><span class="rt">' + esc(T.name) + '</span><span class="rw' + (cell.w ? '' : ' none') + '">' + (cell.w ? esc(cell.w) : '—') + by + '</span><span class="rb">' + badge(g, why, pts) + '</span>' + (acts ? '<span class="ra">' + acts + '</span>' : '') + '</div>';
      }).join('') + '</div>';
    }).join('') + '<div class="rsum">' + g.teams.map(function (T, t) { return '<span class="gc" style="--tc:' + tcol(g, t) + '"><b>' + esc(T.name) + '</b> +' + P.tot[t] + '</span>'; }).join('') + '</div></div>';
  }

  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (t) { return tlabel(g, t); }).join(' e ') : 'Vince ' + tlabel(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'scores') { h = '<b>Manche ' + g.round + ' finita.</b>'; btn = '<button class="btn small" data-act="showround">Punti</button>' + (P && !P.ready ? '<button class="btn small" data-act="next">Avanti</button>' : ''); help = 'points'; }
    else if (g.phase === 'review') {
      help = 'check';
      var wait = E.pending(g);
      if (!P) h = 'Si controllano le risposte…';
      else if (P.ready) { h = 'Pronto. Aspetto ' + wait.map(function (i) { return pname(g, i); }).join(', ') + '…'; btn = '<button class="btn small ghost" data-act="unready">Ancora un attimo</button>'; }
      else { h = 'Controlla le risposte: <b>Contesta</b> quelle che non valgono, vota quelle contestate.'; btn = '<button class="btn small" data-act="ready">' + IC('check') + ' Pronto</button>'; }
      if (isHost && wait.length && !(wait.length === 1 && wait[0] === me)) btn += '<button class="btn small ghost" data-act="nextround">Avanti</button>';
    } else if (!P) h = 'Le squadre scrivono parole con la <b>' + g.letter + '</b>…';
    else {
      var t = P.team, n = E.filled(g, t), tot = g.cats.length;
      if (g.stop) h = (g.stop.t === t ? 'La tua squadra ha detto <b>STOP!</b>' : tlabel(g, g.stop.t) + ' ha detto <b>STOP!</b>') + ' Ultimi secondi.';
      else if (n === tot) { h = 'Tutte le caselle sono piene!'; btn = '<button class="btn small stopb" data-act="stop">' + IC('hand') + ' Stop!</button>'; }
      else h = 'Parole con la <b>' + g.letter + '</b>: ' + (g.opts.teams ? 'la squadra ne ha ' : 'ne hai ') + n + ' su ' + tot + '.';
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- effetti ---------- */
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) { App.lastFxN = 0; }
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (news.length > 20) news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over' || e.k === 'deal'; });
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); banner('Lettera ' + e.letter, 'Manche ' + e.round + ' di ' + g.opts.rounds); setTimeout(function () { var i = el('in-' + g.cats[0]); if (i && me >= 0 && !('ontouchstart' in window)) i.focus(); }, 900); return sleep(400); }); break;
      case 'stop': enqueue(function () { Sound.play('stop'); banner('STOP!', esc(g.teams[e.t].name) + ' ha finito: 10 secondi'); return sleep(300); }); break;
      case 'reveal': enqueue(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); Sound.play('reveal'); banner('Tempo!', 'Si controllano le risposte'); return sleep(300); }); break;
      case 'flag': enqueue(function () { Sound.play('flag'); return sleep(50); }); break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); Sound.play('good'); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || [], mt = myTeam(G(), me); Sound.play(w.indexOf(mt) >= 0 ? 'win' : 'lose'); if (w.indexOf(mt) >= 0) confetti(); return sleep(100); }); break;
      case 'next': enqueue(function () { if (App.sheet && App.sheet.kind === 'round') { App.sheet = null; renderSheet(); } return sleep(50); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#ff5a4e', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#8fe3ff'];
    for (var i = 0; i < 60; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, review: review };
})();
