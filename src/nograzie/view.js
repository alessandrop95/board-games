/* ===== No Grazie!: schermata di gioco (il pacco di turno, i gettoni, le scale di ognuno) e animazioni =====
   I gettoni volano da chi dice «No grazie!» al pacco; chi lo prende se lo porta via con tutti i gettoni.
   Le carte di ognuno sono raggruppate in scale: in ogni scala conta solo la carta più bassa (evidenziata). */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }

  function backdrop() {
    var o = ''; for (var k = 0; k < 16; k++) o += '<i class="cf" style="left:' + ((k * 41) % 100) + '%;animation-delay:-' + (k * 1.7).toFixed(1) + 's;animation-duration:' + (14 + (k % 5) * 3) + 's;--c:' + ['#ffcf3f', '#ff5d6c', '#7ee0a0', '#7ab8ff', '#e08cff'][k % 5] + '"></i>';
    return '<div class="sky" aria-hidden="true">' + o + '</div>';
  }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + backdrop() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-opp" id="gv-opp"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div>' +
      '<div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function mainIdx(g) { var me = myIdx(); return me >= 0 ? me : g.phase === 'play' ? g.turn : 0; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx(), mi = mainIdx(g);
    setHTML('gv-info', '<b>No Grazie!</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : g.opts.rounds > 1 ? 'Partita ' + g.round + ' di ' + g.opts.rounds : 'Carte rimaste ' + (g.deck.length + (g.cur != null ? 1 : 0))) + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-opp', opponents(g, mi));
    setHTML('gv-mid', middle(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', mainArea(g, mi, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  // i gettoni degli altri si vedono solo se l'host lo ha scelto (o a fine partita)
  function chipsTxt(g, p, me) { var P = g.players[p]; return p === me || g.opts.chips === 'open' || g.phase !== 'play' ? String(P.chips) : '?'; }
  function runsHTML(g, p, o) {
    o = o || {};
    var P = g.players[p], R = E.runs(P.cards);
    if (!R.length) return '<span class="noc">' + (o.big ? 'Ancora nessuna carta: meglio così!' : 'nessuna carta') + '</span>';
    return R.map(function (r) { return '<span class="run' + (r.length > 1 ? ' long' : '') + '">' + r.map(function (v, i) { return '<span class="rc' + (i ? ' tail' : '') + '" data-v="' + v + '">' + ART.flat(v, !o.big) + '</span>'; }).join('') + '</span>'; }).join('');
  }
  function stats(g, p, me) {
    var P = g.players[p], cp = E.cardPts(P.cards), open = p === me || g.opts.chips === 'open' || g.phase !== 'play';
    return '<span class="chipc" title="Gettoni">' + ART.chip() + '<b>' + chipsTxt(g, p, me) + '</b></span><span class="ptsc" title="' + (open ? 'Punti adesso: carte meno gettoni' : 'Punti delle carte (i gettoni non si vedono)') + '">' + (open ? cp - P.chips : cp) + ' pt</span>' + (g.opts.rounds > 1 ? '<span class="sc-tot" title="Totale delle partite">Σ ' + P.total + '</span>' : '');
  }
  function tags(g, p) {
    var P = g.players[p], o = '';
    if (P.away) o += '<span class="tag away">assente</span>'; else if (P.bot && g.phase !== 'over') o += '<span class="tag bot">auto</span>';
    if (g.phase === 'scores' && P.ready && !P.bot) o += '<span class="tag ok">pronto</span>';
    return o;
  }
  function opponents(g, mi) {
    var me = myIdx();
    return g.players.map(function (P, p) {
      if (p === mi) return '';
      var on = g.phase === 'play' && g.turn === p;
      return '<button class="opp' + (on ? ' on' : '') + '" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s">' + stats(g, p, me) + '</span><span class="runs mini" data-p="' + p + '">' + runsHTML(g, p) + '</span><span class="opp-t">' + tags(g, p) + '</span></button>';
    }).join('');
  }
  function mainArea(g, mi, me) {
    var P = g.players[mi], on = g.phase === 'play' && g.turn === mi;
    return '<div class="mine' + (on ? ' on' : '') + '" style="--pc:' + pcol(g, mi) + '" data-p="' + mi + '"><div class="mine-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + (mi === me ? ' (tu)' : '') + '</b>' + tags(g, mi) + '<span class="mine-s">' + stats(g, mi, me) + '</span></div>' +
      '<div class="runs big" data-p="' + mi + '">' + runsHTML(g, mi, { big: true }) + '</div></div>';
  }

  /* ---------- centro: mazzo, pacco di turno e gettoni ---------- */
  function potHTML(n) { var o = ''; for (var i = 0; i < Math.min(n, 14); i++) o += '<span class="pc" style="--i:' + i + ';--r:' + ((i * 47) % 40 - 20) + 'deg">' + ART.chip() + '</span>'; return o; }
  function middle(g, me) {
    var mine = g.phase === 'play' && g.turn === me, P = me >= 0 ? g.players[me] : null;
    var stack = ''; for (var k = 0; k < Math.min(4, Math.ceil(g.deck.length / 6)); k++) stack += '<span class="stk" style="--k:' + k + '">' + ART.card(null, false) + '</span>';
    var deck = '<div class="pile deck">' + stack + '<span class="pl">Mazzo <i>' + g.deck.length + '</i></span></div>';
    var cur = '<div class="curwrap"><div class="cur" id="cur">' + (g.cur != null ? ART.card(g.cur, true) : '<span class="dempty"></span>') + '<span class="pot" id="pot">' + potHTML(g.pot) + '</span></div><span class="pl">' + (g.cur != null ? (g.pot ? '<b>' + g.pot + '</b> ' + (g.pot > 1 ? 'gettoni' : 'gettone') + ' sopra' : 'nessun gettone sopra') : '') + '</span></div>';
    var btns = '';
    if (mine && g.cur != null) {
      var m = E.marginal(P.cards, g.cur), after = m - g.pot;
      btns = '<div class="choice"><button class="bigbtn take" data-act="take"><b>Prendo</b><small>' + (m < g.cur ? 'scala! ' : '') + (after > 0 ? '+' : '') + after + ' punti' + (g.pot ? ' · +' + g.pot + ' gettoni' : '') + '</small></button>' +
        '<button class="bigbtn pass" data-act="pass"' + (P.chips ? '' : ' disabled') + '><b>No grazie!</b><small>' + (P.chips ? 'paghi 1 gettone (ne hai ' + P.chips + ')' : 'non hai più gettoni') + '</small></button></div>';
    }
    return '<div class="piles">' + deck + cur + '</div>' + btns;
  }

  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Vincono ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (g.phase === 'scores') { h = '<b>Partita ' + g.round + ' finita.</b> Guarda i punti e preparati alla prossima.'; btn = '<button class="btn small" data-act="showround">Punti</button>'; help = 'end'; }
    else if (g.turn === me) {
      var m = E.marginal(P.cards, g.cur);
      h = '<b>Tocca a te!</b> ' + (P.chips ? 'Prendi il <b>' + g.cur + '</b>' + (g.pot ? ' con ' + g.pot + (g.pot > 1 ? ' gettoni' : ' gettone') : '') + ' o paga un gettone?' : 'Non hai più gettoni: devi prendere il <b>' + g.cur + '</b>.') + (m < g.cur && m >= -g.cur ? ' <span class="good">Ti allunga una scala!</span>' : '');
      help = m < g.cur ? 'runs' : 'turn';
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else {
      var T = g.players[g.turn];
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + ': prende il <b>' + g.cur + '</b> o dice «No grazie»?';
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- animazioni ---------- */
  function rectOf(n) { return n ? n.getBoundingClientRect() : null; }
  function cardRect(n) { if (!n) return null; var c = n.querySelector('.skc') || n; return c.getBoundingClientRect(); }
  function fly(html, from, to, o) {
    o = o || {};
    if (!from || !to || reduce) return Promise.resolve();
    var f = document.createElement('div'); f.className = 'flyer' + (o.cls ? ' ' + o.cls : ''); f.innerHTML = html;
    f.style.width = to.width + 'px'; f.style.height = to.height + 'px'; f.style.left = to.left + 'px'; f.style.top = to.top + 'px';
    document.body.appendChild(f);
    var sx = from.width / to.width, dx = from.left - to.left, dy = from.top - to.top, lift = o.arc == null ? -Math.min(80, Math.abs(dx) * .25 + 30) : o.arc;
    return anim(f, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ')', offset: 0 },
      { transform: 'translate(' + (dx / 2) + 'px,' + (dy / 2 + lift) + 'px) scale(' + ((sx + 1) / 2 * 1.08) + ') rotate(4deg)', offset: .5 },
      { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 1 }
    ], { duration: o.dur || 520, easing: 'cubic-bezier(.3,.7,.3,1)', delay: o.delay || 0, fill: 'both' }).then(function () { f.remove(); });
  }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1600);
  }
  function burst(r, cols) {
    if (!r || reduce) return;
    var b = document.createElement('div'); b.className = 'burst'; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = (r.top + r.height / 2) + 'px';
    var o = ''; for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2, d = 40 + (i % 3) * 18; o += '<i style="--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d) + 'px;background:' + (cols || ['#fff6c8', '#ffcf3f', '#ff5d6c'])[i % 3] + '"></i>'; }
    b.innerHTML = o; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  }
  function flipIn(n) { if (!n) return; var c = n.querySelector('.skc'); if (!c) return; c.classList.remove('flipin'); void c.offsetWidth; c.classList.add('flipin'); setTimeout(function () { c.classList.remove('flipin'); }, 700); }
  function playerEl(p) { return p === myIdx() ? document.querySelector('.mine') : document.querySelector('.opp[data-p="' + p + '"]') || document.querySelector('.mine[data-p="' + p + '"]'); }
  function chipRect(p) { var e = playerEl(p), c = e && e.querySelector('.chipc .chip-svg'); return rectOf(c || e); }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (Q.length > 6 || news.length > 12) { Q = []; news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over'; }); }
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); banner(g.opts.rounds > 1 ? 'Partita ' + e.round + ' di ' + g.opts.rounds : 'Si comincia!', e.chips + ' gettoni a testa · 9 carte tolte'); return sleep(900); }); break;
      case 'flip':
        enqueue(function () {
          var cur = document.getElementById('cur'); if (cur) cur.classList.add('hiding');
          Sound.play('draw');
          var from = cardRect(document.querySelector('.pile.deck .stk:last-child') || document.querySelector('.pile.deck')), to = cardRect(cur);
          return fly(ART.card(e.v, true, { cls: 'flipin' }), from, to, { dur: 560, arc: -40 }).then(function () { var c = document.getElementById('cur'); if (c) c.classList.remove('hiding'); if (e.v >= 30) floatTxt(rectOf(c), 'Ahia, ' + e.v + '!', 'bad'); });
        });
        break;
      case 'pass':
        enqueue(function () {
          Sound.play('chip');
          var pot = rectOf(document.getElementById('pot')), from = chipRect(e.p);
          if (pot) pot = { left: pot.left + pot.width / 2 - 13, top: pot.top + pot.height / 2 - 13, width: 26, height: 26 };
          if (from) from = { left: from.left, top: from.top, width: Math.max(18, from.width), height: Math.max(18, from.width) };
          if (e.p !== me) floatTxt(rectOf(playerEl(e.p)), 'No grazie!', '');
          return fly(ART.chip(), from, pot, { dur: 480, arc: -50 });
        });
        break;
      case 'take':
        enqueue(function () {
          var cur = document.getElementById('cur'), from = cardRect(cur), dst = playerEl(e.p), card = dst && dst.querySelector('.rc[data-v="' + e.v + '"]');
          var to = card ? cardRect(card) : rectOf(dst);
          Sound.play('place');
          var jobs = [fly(ART.card(e.v, true), from || to, to, { dur: 620 })];
          var cr = chipRect(e.p);
          for (var i = 0; i < Math.min(e.pot, 8); i++) jobs.push(fly(ART.chip(), from ? { left: from.left + from.width / 2 - 12, top: from.top + from.height / 2 - 12, width: 24, height: 24 } : null, cr ? { left: cr.left, top: cr.top, width: 20, height: 20 } : null, { dur: 520, delay: 80 + i * 60, arc: -30 }));
          if (card) burst(to);
          if (e.pot) floatTxt(rectOf(dst), '+' + e.pot + ' ' + (e.pot > 1 ? 'gettoni' : 'gettone'), 'col');
          return Promise.all(jobs);
        });
        break;
      case 'turn': if (e.p === me) enqueue(function () { Sound.play('turn'); pulse(); return sleep(100); }); break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
      case 'next': enqueue(function () { if (App.sheet && App.sheet.kind === 'round') { App.sheet = null; renderSheet(); } return sleep(50); }); break;
    }
  }
  function pulse() { var b = document.querySelector('.mine'); if (b) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#ff7a45', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#8fe3ff'];
    for (var i = 0; i < 60; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, runsHTML: runsHTML, banner: banner };
})();
