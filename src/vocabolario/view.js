/* ===== Vocabolario bugiardo: schermata di gioco =====
   In alto i giocatori con i punti e cosa stanno facendo; al centro la parola della manche e il tempo. Sotto, a seconda
   del momento: il foglio per scrivere la propria definizione (resta intatto mentre si scrive), le definizioni da
   votare, oppure la verità con autori, voti e punti. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; return true; } return false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-pl" id="gv-pl"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-me" id="gv-me"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Vocabolario bugiardo</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Parola ' + g.round + ' di ' + g.opts.rounds) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-pl', players(g, me));
    setHTML('gv-mid', mid(g, me));
    if (g.phase === 'write') write(g, me); else setHTML('gv-me', g.phase === 'vote' ? vote(g, me) : g.phase === 'reveal' ? reveal(g, me) : over(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    clock();
  }
  function players(g, me) {
    return g.players.map(function (P, i) {
      var st = '';
      if (g.phase === 'write') st = P.def ? '<small class="ok">' + IC('check') + ' scritto</small>' : '<small class="th">' + IC('pen') + ' scrive…</small>';
      else if (g.phase === 'vote') st = P.vote != null ? '<small class="ok">' + IC('check') + ' votato</small>' : E.canVote(g, i) ? '<small class="th">vota…</small>' : '<small>&nbsp;</small>';
      else if (g.phase === 'reveal') st = '<small class="gain">' + (P.gain ? '+' + P.gain : '+0') + '</small>';
      return '<button class="pl' + (i === me ? ' mine' : '') + '" style="--pc:' + pcol(g, i) + '" data-act="players"><span class="pl-av">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><span class="pl-t"><b>' + esc(P.nick) + '</b><span class="pl-s">' + P.score + '</span>' + st + '</span></button>';
    }).join('');
  }
  function mid(g, me) {
    var W = E.word(g);
    var lbl = g.phase === 'write' ? 'Inventa una definizione' : g.phase === 'vote' ? 'Qual è quella vera?' : g.phase === 'reveal' ? 'La verità' : 'Partita finita';
    return '<div class="wordcard"><span class="kicker">' + lbl + '</span><b class="word">' + esc(W[0]) + '</b><i class="kind">' + E.D.KIND[W[1]] + '</i></div>' +
      (g.phase === 'write' || g.phase === 'vote' || g.phase === 'reveal' ? '<div class="tm"><span class="tbar2"><i id="tbar"></i></span><span class="tmv" id="tmv"></span></div>' : '');
  }
  // il foglio per scrivere: si costruisce una volta per manche, così il testo non si perde mentre arrivano gli aggiornamenti
  function write(g, me) {
    var box = el('gv-me');
    if (me < 0) { setHTML('gv-me', '<div class="card"><p class="muted tc">I giocatori stanno inventando le definizioni…</p></div>'); return; }
    var P = g.players[me], key = 'w:' + g.round + ':' + App.code;
    if (box._k !== key) {
      box._k = key; box._h = null;
      box.innerHTML = '<div class="card me myturn"><label class="lead" for="defin">La tua definizione di «' + esc(E.word(g)[0]) + '»</label>' +
        '<textarea id="defin" class="field area" maxlength="' + E.MAXLEN + '" rows="3" autocomplete="off" spellcheck="true" placeholder="Es. ' + (E.word(g)[1] === 'v' ? 'Camminare in punta di piedi per non svegliare nessuno.' : E.word(g)[1] === 'a' ? 'Detto di chi parla sempre a voce troppo alta.' : 'Antico attrezzo dei contadini per…') + '"></textarea>' +
        '<div class="wrow"><span class="cnt" id="cnt"></span><button class="btn" data-act="send" id="sendb">' + IC('send') + ' Invia</button></div><div id="wstat" class="wstat"></div></div>';
      var ta = el('defin'); ta.value = P.def || App.draft || ''; App.draft = null;
      ta.addEventListener('input', function () { counter(); });
      ta.addEventListener('keydown', function (e) { if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); CFG.click('send'); } });
    }
    counter();
    var st = P.def ? IC('check') + ' Inviata: «' + esc(P.def) + '». Puoi ancora correggerla.' : '';
    setHTML('wstat', st);
    var b = el('sendb'); if (b) b.innerHTML = IC('send') + (P.def ? ' Correggi' : ' Invia');
    box._h = null;
  }
  function counter() { var ta = el('defin'), c = el('cnt'); if (ta && c) c.textContent = ta.value.length + ' / ' + E.MAXLEN; }
  function text() { var ta = el('defin'); return ta ? ta.value : ''; }
  var LETTERS = 'ABCDEFGHIJKLMNOP';
  function vote(g, me) {
    var P = me >= 0 ? g.players[me] : null;
    return '<div class="defs">' + g.defs.map(function (d, i) {
      var mine = P && d.by.indexOf(me) >= 0, on = P && P.vote === i;
      var inner = '<span class="dl">' + LETTERS[i] + '</span><span class="dt">' + esc(d.t) + '</span>' + (mine ? '<span class="tag mine">la tua</span>' : on ? '<span class="tag sel">' + IC('check') + ' il tuo voto</span>' : '');
      if (!P || mine) return '<div class="def' + (mine ? ' own' : '') + '">' + inner + '</div>';
      return '<button class="def pick' + (on ? ' on' : '') + '" data-act="vote" data-i="' + i + '">' + inner + '</button>';
    }).join('') + '</div>';
  }
  function reveal(g, me) {
    var P = me >= 0 ? g.players[me] : null, R = g.res;
    var order = g.defs.map(function (d, i) { return i; }).sort(function (a, b) { var A = g.defs[a], B = g.defs[b]; return (B.real ? 1 : 0) - (A.real ? 1 : 0) || B.votes.length - A.votes.length; });
    var knew = (g.knew || []).length ? '<p class="knew">' + IC('star') + ' ' + g.knew.map(function (i) { return pname(g, i); }).join(', ') + ' conosceva la parola: +' + E.KNEW + '!</p>' : '';
    return knew + '<div class="defs">' + order.map(function (i, k) {
      var d = g.defs[i];
      var who = d.real ? '<span class="tag real">' + IC('book') + ' VERA</span>' : '<span class="auth">bugia di ' + d.by.map(function (a) { return pname(g, a) + (a === me ? ' (tu)' : ''); }).join(' e ') + '</span>';
      var votes = d.votes.length ? '<span class="voters">' + d.votes.map(function (v) { return '<span class="pv sm" style="--pc:' + pcol(g, v) + '" title="' + esc(g.players[v].nick) + '">' + esc(g.players[v].nick.charAt(0).toUpperCase()) + '</span>'; }).join('') + '<small>' + (d.real ? (d.votes.length > 1 ? 'hanno indovinato' : 'ha indovinato') : 'ingannat' + (d.votes.length > 1 ? 'i' : 'o')) + '</small></span>' : '<small class="none">' + (d.real ? 'nessuno l’ha indovinata' : 'nessun voto') + '</small>';
      return '<div class="def rv' + (d.real ? ' real' : '') + (P && P.vote === i ? ' myvote' : '') + '" style="animation-delay:' + (k * .1) + 's"><span class="dl">' + LETTERS[i] + '</span><span class="dt">' + esc(d.t) + '</span><span class="dm">' + who + votes + '</span></div>';
    }).join('') + '</div>' +
      (P ? '<div class="card me"><p class="tc">' + (P.gain ? 'In questa manche: <b class="g">+' + P.gain + '</b>' : 'In questa manche nessun punto.') + '</p>' + (P.ready ? '<p class="muted tc">Aspetto gli altri…</p>' : '<button class="btn block" data-act="next">Avanti</button>') + '</div>' : '');
  }
  function over(g, me) { return '<div class="card"><p class="tc"><b>Partita finita!</b></p>' + CFG.overTable(g) + '<button class="btn block" data-act="showover">Classifica</button></div>'; }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid, wait = E.pending(g).filter(function (i) { return i !== me; });
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'write') { help = 'write'; h = !P ? 'Si scrivono le definizioni…' : P.def ? 'Definizione inviata. ' + (wait.length ? 'Aspetto ' + wait.map(function (i) { return pname(g, i); }).join(', ') + '…' : '') : '<b>Inventa</b> una definizione credibile e inviala.'; }
    else if (g.phase === 'vote') { help = 'vote'; h = !P ? 'Si vota…' : P.vote == null && E.canVote(g, me) ? '<b>Vota</b> la definizione che credi vera.' : 'Voto fatto. ' + (wait.length ? 'Aspetto ' + wait.map(function (i) { return pname(g, i); }).join(', ') + '…' : ''); }
    else { help = 'points'; h = P && !P.ready ? 'Ecco la verità!' : 'Aspetto ' + wait.map(function (i) { return pname(g, i); }).join(', ') + '…'; if (isHost && wait.length) btn = '<button class="btn small ghost" data-act="nextround">Avanti per tutti</button>'; }
    if (P && P.bot && g.phase !== 'over') btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase === 'write' || g.phase === 'vote' || g.phase === 'reveal', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'write' ? g.opts.time * 1000 : g.phase === 'vote' ? E.VOTE_MS : E.SHOW_MS;
    var tv = el('tmv'), tb = el('tbar'), txt = live ? (s >= 60 ? Math.floor(s / 60) + ':' + ('0' + s % 60).slice(-2) : s + '″') : '';
    if (tv.textContent !== txt) tv.textContent = txt;
    if (tb) tb.style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    var mid = el('gv-mid'); if (mid) mid.classList.toggle('low', live && g.phase !== 'reveal' && s <= 10);
    var me = myIdx();
    if (me >= 0 && ((g.phase === 'write' && !g.players[me].def) || (g.phase === 'vote' && g.players[me].vote == null)) && s <= 5 && s > 0) { var k = g.phase + g.round + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
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
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'word': enqueue(function () { Sound.play('word'); banner(esc(E.word(G())[0]), 'Parola ' + e.round + ' di ' + G().opts.rounds); setTimeout(function () { var t = el('defin'); if (t && !('ontouchstart' in window)) t.focus(); }, 900); return sleep(400); }); break;
      case 'wrote': case 'voted': if (e.p !== me) enqueue(function () { Sound.play('wrote'); return sleep(30); }); break;
      case 'vote': enqueue(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); Sound.play('reveal'); banner('Si vota!', 'Qual è la definizione vera?'); return sleep(300); }); break;
      case 'reveal': enqueue(function () { var G0 = G(), P = me >= 0 ? G0.players[me] : null; Sound.play('reveal'); if (P) setTimeout(function () { var d = G0.defs[P.vote]; Sound.play(d && d.real ? 'good' : P.gain ? 'good' : 'fooled'); }, 600); return sleep(300); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#f2c14e', '#fbf1dc', '#c8402c', '#8fe3ff', '#8ff0a4'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, text: text };
})();
