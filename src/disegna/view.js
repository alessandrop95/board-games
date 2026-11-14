/* ===== Disegna e indovina: schermata di gioco =====
   La lavagna: chi disegna traccia con il dito e ogni pezzetto di tratto parte subito agli altri sul canale
   «in diretta» (Net.sendLive); ogni tanto manda anche il disegno intero all'host, che lo tiene nel documento
   per chi arriva dopo o ha perso un pezzo. La «versione» del disegno cresce quando si annulla o si cancella:
   così un pezzo vecchio arrivato in ritardo non fa ricomparire un tratto tolto.
   Sotto la lavagna: le risposte scritte e la casella per indovinare. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null;
  var COLORS = ['#1d2333', '#e0402c', '#3d8bfd', '#2fb36d', '#f2b705', '#8a5a22', '#ef7aa8', '#9a5cf0'], SIZES = [4, 9, 18];
  // il disegno visto da qui: per chi disegna è il suo (mine), per gli altri quello ricomposto (view)
  var mine = { t: 0, v: 0, s: [] }, view = { t: 0, v: 0, s: [] }, cur = null, sentLen = 0, dirty = false, picT = null, lastPic = 0, cv = null, ctx = null, rafOn = false;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="sky" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-teams" id="gv-teams"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-board" id="gv-board"><div class="board-wrap" id="bwrap"><canvas id="cv" aria-label="Lavagna"></canvas><div class="board-over" id="bover"></div></div><div class="tools" id="tools"></div></div>' +
      '<div class="gv-feed" id="gv-feed"><div class="feed" id="feed"></div><form class="gform" id="gform" autocomplete="off"></form></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code;
    cv = el('cv'); ctx = cv.getContext('2d');
    cv.addEventListener('pointerdown', down); cv.addEventListener('pointermove', move); cv.addEventListener('pointerup', up); cv.addEventListener('pointercancel', up); cv.addEventListener('pointerleave', up);
    if (window.ResizeObserver) new ResizeObserver(fit).observe(el('bwrap')); else window.addEventListener('resize', fit);
    fit();
  }
  function unmount() { mountedFor = null; }
  function myTeam(g, me) { return me >= 0 ? g.players[me].team : -1; }
  function drawing(g, me) { return me >= 0 && g.drawer === me && (g.phase === 'draw' || g.phase === 'steal'); }

  /* ---------- la lavagna ---------- */
  function fit() {
    if (!cv) return;
    var w = el('bwrap').clientWidth, h = el('bwrap').clientHeight, r = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = Math.round(w * r); cv.height = Math.round(h * r); paint();
  }
  function strokes() { var g = G(); if (!g) return []; return drawing(g, myIdx()) ? mine.s : view.s; }
  function paint() { if (rafOn) return; rafOn = true; requestAnimationFrame(function () { rafOn = false; paintNow(); }); }
  function paintNow() {
    if (!ctx) return;
    var W = cv.width, H = cv.height, sx = W / 1000, sy = H / 750;
    ctx.fillStyle = '#fffdf6'; ctx.fillRect(0, 0, W, H);
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    strokes().forEach(function (s) {
      if (!s || s.length < 4) return;
      ctx.strokeStyle = s[0]; ctx.fillStyle = s[0]; ctx.lineWidth = s[1] * sx;
      if (s.length === 4) { ctx.beginPath(); ctx.arc(s[2] * sx, s[3] * sy, s[1] * sx / 2, 0, 7); ctx.fill(); return; }
      ctx.beginPath(); ctx.moveTo(s[2] * sx, s[3] * sy);
      for (var i = 4; i + 1 < s.length; i += 2) ctx.lineTo(s[i] * sx, s[i + 1] * sy);
      ctx.stroke();
    });
  }
  function pos(e) { var r = cv.getBoundingClientRect(); return [Math.max(0, Math.min(1000, Math.round((e.clientX - r.left) / r.width * 1000))), Math.max(0, Math.min(750, Math.round((e.clientY - r.top) / r.height * 750)))]; }
  function down(e) {
    var g = G(); if (!g || !drawing(g, myIdx()) || g.phase !== 'draw') return;
    e.preventDefault(); try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    var p = pos(e), c = App.pen.c, w = c === '#fffdf6' ? 34 : App.pen.w;
    cur = [c, w, p[0], p[1]]; mine.s.push(cur); sentLen = 0; dirty = true; liveSend(); paint();
  }
  function move(e) {
    if (!cur) return; e.preventDefault();
    var evs = e.getCoalescedEvents ? e.getCoalescedEvents() : [e]; if (!evs.length) evs = [e];
    evs.forEach(function (ev) { var p = pos(ev), lx = cur[cur.length - 2], ly = cur[cur.length - 1]; if (Math.abs(p[0] - lx) + Math.abs(p[1] - ly) >= 4 && cur.length < 2400) { cur.push(p[0], p[1]); } });
    dirty = true; paint(); if (!liveT) liveT = setTimeout(function () { liveT = null; liveSend(); }, 45);
  }
  function up() { if (!cur) return; liveSend(); cur = null; picSoon(); }
  var liveT = null;
  function liveSend() {
    if (!cur) return;
    var g = G(), i = mine.s.indexOf(cur); if (i < 0 || !g) return;
    var from = sentLen; if (cur.length <= from) return;
    Net.sendLive({ k: 'pt', t: mine.t, v: mine.v, i: i, o: from, s: from ? cur.slice(Math.max(2, from)) : cur.slice() });
    sentLen = cur.length;
  }
  var picTimer = null;
  function picSoon() { dirty = true; clearTimeout(picTimer); picTimer = setTimeout(picNow, Date.now() - lastPic > 1500 ? 200 : 900); }
  function picNow() {
    var g = G(); if (!g || !dirty || !drawing(g, myIdx())) return;
    dirty = false; lastPic = Date.now();
    Net.send({ t: 'act', a: { a: 'pic', t: mine.t, v: mine.v, s: mine.s } }).catch(function () { dirty = true; });
  }
  // ogni tanto, mentre si disegna, il disegno intero va anche all'host
  setInterval(function () { if (dirty && !cur && Date.now() - lastPic > 1500) picNow(); else if (dirty && cur && Date.now() - lastPic > 2500) picNow(); }, 500);
  function undo() { if (!mine.s.length) return; mine.s.pop(); mine.v++; cur = null; Net.sendLive({ k: 'cut', t: mine.t, v: mine.v, n: mine.s.length }); picSoon(); paint(); }
  function clear() { if (!mine.s.length) return; mine.s = []; mine.v++; cur = null; Net.sendLive({ k: 'cut', t: mine.t, v: mine.v, n: 0 }); Sound.play('clear'); picSoon(); paint(); }
  // un pezzo di tratto arrivato in diretta
  function live(d) {
    var g = G(); if (!g || !d || d.t !== g.pic.t || drawing(g, myIdx())) return;
    if (view.t !== d.t) view = { t: d.t, v: 0, s: [] };
    if (d.v < view.v) return;
    if (d.k === 'cut') { view.v = d.v; view.s = view.s.slice(0, d.n); paint(); return; }
    if (d.k !== 'pt' || !Array.isArray(d.s)) return;
    view.v = Math.max(view.v, d.v);
    var s = view.s[d.i];
    if (!d.o) view.s[d.i] = d.s.slice();
    // il pezzo continua il tratto: se dal documento ne ho già un po' di più, l'inizio è lo stesso e lo riallineo
    else if (s && s.length >= d.o) { s.length = d.o; Array.prototype.push.apply(s, d.s); }
    paint();
  }
  // il disegno salvato nel documento (arriva più di rado): si prende se è più nuovo o più lungo
  function sync(g, me) {
    var p = g.pic;
    if (drawing(g, me)) {
      if (mine.t !== p.t) { mine = { t: p.t, v: p.v || 0, s: (p.s || []).map(function (x) { return x.slice(); }) }; cur = null; }
      return;
    }
    if (view.t !== p.t || (p.v || 0) > view.v) { view = { t: p.t, v: p.v || 0, s: (p.s || []).map(function (x) { return x.slice(); }) }; paint(); return; }
    if ((p.v || 0) < view.v) return;
    var ch = false;
    (p.s || []).forEach(function (s, i) { if (!view.s[i] || view.s[i].length < s.length) { view.s[i] = s.slice(); ch = true; } });
    if (ch) paint();
  }

  /* ---------- il resto dello schermo ---------- */
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    if (picT !== g.pic.t) { picT = g.pic.t; mine = { t: g.pic.t, v: 0, s: [] }; view = { t: g.pic.t, v: 0, s: [] }; cur = null; dirty = false; }
    sync(g, me);
    var o = g.order[g.turn];
    setHTML('gv-info', '<b>Disegna e indovina</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Giro ' + g.round + ' di ' + g.opts.rounds + ' · disegno ' + (g.turn + 1) + ' di ' + g.order.length) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-teams', teams(g, me));
    setHTML('gv-mid', mid(g, me));
    setHTML('tools', tools(g, me));
    setHTML('bover', over(g, me));
    setHTML('feed', feed(g, me));
    form(g, me);
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    el('gv').classList.toggle('drawing', drawing(g, me));
    paint(); clock();
  }
  function teams(g, me) {
    var mt = myTeam(g, me), dt = g.drawer != null ? g.players[g.drawer].team : -1;
    return g.teams.map(function (T, t) {
      return '<button class="team' + (t === mt ? ' mine' : '') + (t === dt && g.phase !== 'over' ? ' turn' : '') + '" style="--tc:' + tcol(g, t) + '" data-act="team" data-t="' + t + '"><span class="tm-h"><b>' + esc(T.name) + '</b><span class="tm-s">' + T.total + '</span></span>' +
        '<span class="tm-m">' + E.members(g, t).map(function (i) { var P = g.players[i]; return '<span class="pv sm' + (i === g.drawer ? ' dr' : '') + '" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>'; }).join('') + '</span></button>';
    }).join('');
  }
  function mask(w) { return '<span class="mask">' + String(w).split(' ').map(function (x) { return '<span class="mw">' + x.split('').map(function () { return '<i></i>'; }).join('') + '</span>'; }).join('') + '</span><small class="ml">' + String(w).replace(/ /g, '').length + ' lettere' + (w.indexOf(' ') >= 0 ? ', ' + w.split(' ').length + ' parole' : '') + '</small>'; }
  function mid(g, me) {
    var h = '', P = g.drawer != null ? g.players[g.drawer] : null, who = P ? '<b class="pn-c" style="--pc:' + pcol(g, g.drawer) + '">' + esc(P.nick) + '</b>' : '';
    if (g.phase === 'over') h = '<div class="st">Partita finita</div>';
    else if (g.phase === 'choose') h = g.drawer === me ? '<div class="st">Tocca a te! Scegli cosa disegnare:</div><div class="choices"><button class="btn ch" data-act="choose" data-i="0">' + esc(g.choices[0]) + '<small>facile · 1 punto</small></button><button class="btn ch hard" data-act="choose" data-i="1">' + esc(g.choices[1]) + '<small>difficile · 2 punti</small></button></div>'
      : '<div class="st">' + who + ' (' + tlabel(g, P.team) + ') sceglie cosa disegnare…</div>';
    else if (g.phase === 'draw' || g.phase === 'steal') {
      if (g.drawer === me) h = '<div class="st">Disegna: <b class="word">' + esc(g.word) + '</b> <span class="pp">' + g.pts + (g.pts > 1 ? ' punti' : ' punto') + '</span></div>';
      else h = '<div class="st">' + (g.phase === 'steal' ? '<b class="steal">Furto!</b> ' : '') + who + ' disegna per i ' + tlabel(g, P.team) + ':</div>' + mask(g.word);
    } else if (g.phase === 'reveal') h = '<div class="st">Era <b class="word">' + esc(g.word) + '</b>' + (g.hit ? ' · ' + pname(g, g.hit.p) + (g.hit.steal ? ' l’ha rubata' : ' ha indovinato') + ': <b>+' + g.hit.pts + '</b> ai ' + tlabel(g, g.hit.t) : ' · nessuno l’ha indovinata') + '</div>';
    return h + '<div class="tm"><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div>';
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase !== 'over', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'draw' ? g.opts.time * 1000 : g.phase === 'steal' ? E.STEAL_MS : g.phase === 'choose' ? E.CHOOSE_MS : E.REVEAL_MS;
    var txt = live && g.phase !== 'reveal' ? s + '″' : '', tv = el('tmv'), tb = el('tbar');
    if (tv.textContent !== txt) tv.textContent = txt;
    if (tb) tb.style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    el('gv-mid').classList.toggle('low', live && (g.phase === 'draw' || g.phase === 'steal') && s <= 10);
    if ((g.phase === 'draw' || g.phase === 'steal') && s <= 5 && s > 0) { var k = g.turn + g.phase + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
  }
  function tools(g, me) {
    if (!drawing(g, me) || g.phase !== 'draw') return '';
    return '<div class="pal">' + COLORS.map(function (c) { return '<button class="sw' + (App.pen.c === c ? ' on' : '') + '" style="--c:' + c + '" data-act="pen" data-c="' + c + '" aria-label="Colore"></button>'; }).join('') +
      '<button class="sw er' + (App.pen.c === '#fffdf6' ? ' on' : '') + '" data-act="pen" data-c="#fffdf6" aria-label="Gomma">' + IC('eraser') + '</button></div>' +
      '<div class="pal">' + SIZES.map(function (w) { return '<button class="sz' + (App.pen.w === w ? ' on' : '') + '" data-act="size" data-w="' + w + '" aria-label="Spessore ' + w + '"><i style="width:' + (w / 1.4 + 3) + 'px;height:' + (w / 1.4 + 3) + 'px"></i></button>'; }).join('') +
      '<button class="tb" data-act="undo" aria-label="Annulla">' + IC('undo') + '</button><button class="tb" data-act="clear" aria-label="Cancella tutto">' + IC('trash') + '</button></div>';
  }
  function over(g, me) {
    if (g.phase === 'choose') return '<div class="bo">' + (g.drawer === me ? 'Scegli la parola qui sopra' : 'Tra poco si disegna…') + '</div>';
    if (g.phase === 'reveal') return '<div class="bo big">' + esc(g.word) + '</div>';
    return '';
  }
  function feed(g, me) {
    var list = g.guesses.slice(-6).map(function (x) { var P = g.players[x.p]; return '<span class="gs' + (x.near && x.p === me ? ' near' : '') + '" style="--pc:' + pcol(g, x.p) + '"><b>' + esc(P.nick) + '</b> ' + esc(x.w) + (x.near && x.p === me ? ' <em>quasi!</em>' : '') + '</span>'; }).join('');
    return list || '<span class="muted gs0">Le risposte compaiono qui.</span>';
  }
  function form(g, me) {
    var f = el('gform'), can = me >= 0 && E.canGuess(g, me), key = can ? 'on:' + g.turn + ':' + g.phase : 'off';
    if (f._k === key) return; f._k = key;
    f.innerHTML = can ? '<input id="gin" class="field gin" maxlength="40" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="' + (g.phase === 'steal' ? 'Rubala! Scrivi la parola…' : 'Che cos’è? Scrivi qui…') + '"><button class="btn gsend" type="submit" aria-label="Invia">' + IC('send') + '</button>' : '';
    f.classList.toggle('on', can);
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal';
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (t) { return tlabel(g, t); }).join(' e ') : 'Vincono i ' + tlabel(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; }
    else if (g.phase === 'choose') { h = g.drawer === me ? 'Scegli la parola: la difficile vale di più.' : 'Si prepara il prossimo disegno.'; help = 'draw'; }
    else if (g.phase === 'draw') {
      if (g.drawer === me) { h = 'Disegna con il dito. <b>Niente lettere!</b>'; btn = '<button class="btn small ghost" data-act="skip">Passo</button>'; help = 'draw'; }
      else if (E.canGuess(g, me)) { h = 'Indovina che cosa disegna il tuo compagno!'; help = 'guess'; }
      else { h = 'Guarda bene: se non indovinano, potete <b>rubarla</b>.'; help = 'steal'; }
    } else if (g.phase === 'steal') { h = E.canGuess(g, me) ? '<b>Furto!</b> Scrivi la parola prima delle altre squadre.' : 'Le altre squadre provano a rubare la parola…'; help = 'steal'; }
    else h = 'Si passa al prossimo disegno…';
    if (me >= 0 && g.players[me].bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- effetti ---------- */
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'over' && !App.sheet) { App.sheet = { kind: 'over' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (news.length > 12) news = news.slice(-3);
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'turn': enqueue(function () { Sound.play('turn'); if (e.p === me) banner('Tocca a te!', 'Scegli cosa disegnare'); else banner(esc(g.players[e.p].nick) + ' disegna', 'per i ' + esc(g.teams[e.t].name)); return sleep(200); }); break;
      case 'draw': enqueue(function () { Sound.play('draw'); return sleep(50); }); break;
      case 'hit': enqueue(function () { Sound.play('hit'); banner(e.steal ? 'Rubata!' : 'Indovinata!', esc(e.word) + ' · +' + e.pts + ' ai ' + esc(g.teams[e.t].name)); if (myTeam(g, me) === e.t) confetti(30); return sleep(300); }); break;
      case 'steal': enqueue(function () { Sound.play('steal'); banner('Furto!', myTeam(g, me) === e.t ? 'gli altri provano a rubarla' : 'scrivi la parola, presto!'); var i = el('gin'); if (i && !('ontouchstart' in window)) i.focus(); return sleep(200); }); break;
      case 'miss': enqueue(function () { Sound.play('miss'); return sleep(50); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || []; Sound.play(w.indexOf(myTeam(g, me)) >= 0 ? 'win' : 'lose'); if (w.indexOf(myTeam(g, me)) >= 0) confetti(60); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti(n) {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    for (var i = 0; i < n; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + COLORS[i % COLORS.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  Net.onLive(function (m) { if (m && m.d) live(m.d); });
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, undo: undo, clear: clear, picNow: picNow, strokes: strokes };
})();
