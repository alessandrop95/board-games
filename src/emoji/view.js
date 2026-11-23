/* ===== Emoji in scena: schermata di gioco =====
   In alto le squadre con i punti; al centro il palcoscenico: le emoji del regista, grandi, e il tempo. Sotto, a seconda
   del ruolo: la tastiera delle emoji per il regista (con le risposte dei compagni da segnare 🔥/❄️), il campo per
   rispondere per chi indovina, oppure le risposte degli altri da guardare aspettando il momento di rubare. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null, padK = 0;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; return true; } return false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-teams" id="gv-teams"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-ctl" id="gv-ctl"></div><div class="gv-main" id="gv-main"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function myTeam(g, me) { return me >= 0 ? g.players[me].team : -1; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Emoji in scena</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Turno ' + (g.turn + 1) + ' di ' + g.order.length) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-teams', teams(g, me));
    setHTML('gv-mid', stage(g, me));
    controls(g, me);
    setHTML('gv-main', feed(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    el('gv').classList.toggle('director', g.regista === me && g.phase === 'play');
    clock();
  }
  function teams(g, me) {
    var mt = myTeam(g, me), rt = E.teamOf(g);
    return g.teams.map(function (T, t) {
      var mem = E.members(g, t);
      return '<button class="team' + (t === mt ? ' mine' : '') + (t === rt && g.phase !== 'over' ? ' on' : '') + '" style="--tc:' + tcol(g, t) + '" data-act="team" data-t="' + t + '"><span class="tm-h"><b>' + esc(T.name) + '</b><span class="tm-s">' + T.total + '</span></span>' +
        '<span class="tm-m">' + mem.map(function (i) { var P = g.players[i]; return '<span class="pv sm' + (i === g.regista ? ' dir' : '') + '" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + (i === g.regista && g.phase !== 'over' ? '🎬' : esc(P.nick.charAt(0).toUpperCase())) + '</span>'; }).join('') + '</span></button>';
    }).join('');
  }
  function clueHTML(g) { return g.clue.length ? '<div class="clue">' + g.clue.map(function (e, k) { return '<span class="ce" style="--k:' + k + '">' + esc(e) + '</span>'; }).join('') + '</div>' : '<div class="clue empty">' + (g.phase === 'play' ? 'Il regista sta pensando…' : '') + '</div>'; }
  function lvl(it) { return it[2] > 1 ? '<span class="lv hard">difficile · 2 punti</span>' : '<span class="lv">facile · 1 punto</span>'; }
  function stage(g, me) {
    if (g.phase === 'over') return '<div class="st-h"><b>Fine dello spettacolo!</b></div><button class="btn small" data-act="showover">Classifica</button>';
    var R = g.regista, it = E.item(g), mine = R === me;
    var who = '<div class="st-h"><span class="pv" style="--pc:' + pcol(g, R) + '">🎬</span><span>' + (mine ? '<b>Sei tu il regista</b>' : 'Regista: ' + pname(g, R)) + ' · ' + tlabel(g, g.players[R].team) + '</span></div>';
    var timer = '<div class="tm"><span class="tbar2"><i id="tbar"></i></span><span class="tmv" id="tmv"></span></div>';
    if (g.phase === 'pick') {
      if (mine) return who + '<p class="lead tc">Scegli cosa raccontare (lo vedi solo tu):</p><div class="choices">' + g.choices.map(function (id, i) { var c = E.D.ITEMS[id]; return '<button class="choice' + (i ? ' hard' : '') + '" data-act="pickc" data-i="' + i + '"><small>' + esc(c[1]) + '</small><b>' + esc(c[0]) + '</b>' + lvl(c) + '</button>'; }).join('') + '</div>' + timer;
      return who + '<p class="lead tc">' + pname(g, R) + ' sceglie il titolo da raccontare…</p>' + timer;
    }
    var cat = '<div class="cat">' + esc(it[1]) + ' · ' + lvl(it) + '</div>';
    if (g.phase === 'reveal') {
      var H = g.hit;
      return who + '<div class="answer"><small>Era</small><b>' + esc(it[0]) + '</b></div>' + clueHTML(g) +
        '<p class="res tc">' + (H ? (H.steal ? '<b>Rubato!</b> ' : '<b>Indovinato!</b> ') + pname(g, H.p) + ' · +' + H.pts + ' ai ' + tlabel(g, H.t) + (H.bonus ? ' (bonus velocità)' : '') : 'Nessuno ha indovinato.') + '</p>' + timer;
    }
    var secret = mine ? '<div class="secret">Fai indovinare: <b>' + esc(it[0]) + '</b></div>' : '';
    return who + cat + secret + clueHTML(g) + timer + (g.phase === 'steal' ? '<div class="stealb">' + (E.canGuess(g, me) ? 'Tocca a voi: <b>rubate</b> il titolo!' : 'Le altre squadre provano a rubare…') + '</div>' : '');
  }
  // sotto il palcoscenico: la tastiera del regista oppure il campo per rispondere (costruito una volta, per non perdere quello che si scrive)
  function controls(g, me) {
    var box = el('gv-ctl'), R = g.regista;
    if (g.phase === 'play' && R === me) {
      var tabs = '<div class="padtabs">' + E.D.PAD.map(function (c, k) { return '<button class="ptab' + (k === padK ? ' on' : '') + '" data-act="pad" data-k="' + k + '" aria-label="' + esc(c.n) + '">' + c.ic + '</button>'; }).join('') + '</div>';
      var keys = '<div class="pad">' + E.D.PAD[padK].list.map(function (e) { return '<button class="key" data-act="emo" data-e="' + esc(e) + '"' + (g.clue.length >= E.MAXCLUE ? ' disabled' : '') + '>' + e + '</button>'; }).join('') + '</div>';
      var tools = '<div class="tools"><button class="btn small ghost" data-act="undo"' + (g.clue.length ? '' : ' disabled') + '>' + IC('undo') + ' Togli</button><button class="btn small ghost" data-act="clear"' + (g.clue.length ? '' : ' disabled') + '>' + IC('trash') + ' Ricomincia</button><button class="btn small ghost" data-act="skip"' + (g.skips > 0 ? '' : ' disabled') + '>' + IC('swap') + ' Cambia titolo</button></div>';
      box._k = null; setHTML('gv-ctl', '<div class="card dir">' + tools + tabs + keys + '</div>');
      return;
    }
    if (me >= 0 && E.canGuess(g, me)) {
      var key = 'g:' + g.turn + ':' + g.phase;
      if (box._k !== key) {
        var keep = el('gin') ? el('gin').value : '';
        box._k = key; box._h = null;
        box.innerHTML = '<form class="card guess" id="gform" autocomplete="off"><input id="gin" class="field" maxlength="60" placeholder="' + (g.phase === 'steal' ? 'Rubate: cos’è?' : 'Cosa raccontano le emoji?') + '" enterkeyhint="send" autocapitalize="sentences"><button class="btn" type="submit">' + IC('send') + '<span class="hide-s"> Invia</span></button></form>';
        el('gin').value = keep;
        if (!('ontouchstart' in window)) setTimeout(function () { var i = el('gin'); if (i) i.focus(); }, 50);
      }
      return;
    }
    box._k = null;
    var t = g.phase === 'play' && me >= 0 && g.players[me].team !== E.teamOf(g) ? '<div class="card watch"><p>Guardate bene: se i ' + tlabel(g, E.teamOf(g)) + ' non indovinano, avrete 15 secondi per <b>rubare</b>!</p></div>' : '';
    setHTML('gv-ctl', t);
  }
  function feed(g, me) {
    if (g.phase === 'pick' || g.phase === 'over') return '';
    var dir = g.regista === me && g.phase === 'play';
    if (!g.guesses.length) return g.phase === 'reveal' ? '' : '<p class="muted tc">Le risposte compaiono qui.</p>';
    var list = g.guesses.map(function (x, i) { return [x, i]; }).reverse().slice(0, 14);
    return '<div class="feed">' + list.map(function (r) {
      var x = r[0], i = r[1], P = g.players[x.p];
      var mk = x.m === 'hot' ? '<span class="mk hot">🔥</span>' : x.m === 'cold' ? '<span class="mk cold">❄️</span>' : '';
      var btns = dir && !x.ok ? '<span class="mbtn"><button class="chip' + (x.m === 'hot' ? ' on' : '') + '" data-act="mark" data-i="' + i + '" data-m="hot" aria-label="Vicino">🔥</button><button class="chip' + (x.m === 'cold' ? ' on' : '') + '" data-act="mark" data-i="' + i + '" data-m="cold" aria-label="Lontano">❄️</button></span>' : '';
      return '<div class="gu' + (x.ok ? ' ok' : '') + (P.team !== E.teamOf(g) ? ' other' : '') + '" style="--pc:' + pcol(g, x.p) + '"><span class="pv sm" style="--pc:' + pcol(g, x.p) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><span class="gt">' + esc(x.t) + (dir && x.near ? ' <small class="near">quasi</small>' : '') + '</span>' + mk + btns + '</div>';
    }).join('') + '</div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (t) { return tlabel(g, t); }).join(' e ') : 'Vincono i ' + tlabel(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'points'; }
    else if (g.phase === 'pick') { help = 'director'; h = g.regista === me ? '<b>Scegli</b> il titolo da raccontare.' : pname(g, g.regista) + ' sceglie il titolo…'; }
    else if (g.phase === 'play') {
      if (g.regista === me) { help = 'director'; h = '<b>Racconta con le emoji!</b> Niente parole.'; }
      else if (E.canGuess(g, me)) { help = 'guess'; h = '<b>Indovina!</b> Scrivi cosa raccontano le emoji.'; }
      else { help = 'guess'; h = 'I ' + tlabel(g, E.teamOf(g)) + ' indovinano. Preparatevi a rubare!'; }
    } else if (g.phase === 'steal') { help = 'guess'; h = E.canGuess(g, me) ? '<b>Rubate!</b> 15 secondi per indovinare.' : 'Le altre squadre provano a rubare…'; }
    else { help = 'points'; h = 'Tra poco il prossimo regista…'; if (isHost) btn = '<button class="btn small ghost" data-act="nextround">Avanti</button>'; }
    if (P && P.bot && g.phase !== 'over') btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase !== 'over', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'pick' ? E.PICK_MS : g.phase === 'play' ? g.opts.time * 1000 : g.phase === 'steal' ? E.STEAL_MS : E.REVEAL_MS;
    var tv = el('tmv'), tb = el('tbar'), txt = live && g.phase !== 'reveal' ? s + '″' : '';
    if (tv.textContent !== txt) tv.textContent = txt;
    if (tb) tb.style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    var low = (g.phase === 'play' || g.phase === 'steal') && s <= 10, mid = el('gv-mid'); if (mid) mid.classList.toggle('low', low);
    var me = myIdx();
    if (low && s > 0 && s <= 5 && (g.regista === me || E.canGuess(g, me))) { var k = g.turn + g.phase + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
  }
  function tap(e) { Sound.play('emo'); }
  function pad(k) { padK = Math.max(0, Math.min(E.D.PAD.length - 1, k)); Sound.play('pick'); render(); }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'over' && !App.sheet) { App.sheet = { kind: 'over' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (news.length > 20) news = news.filter(function (e) { return e.k === 'over' || e.k === 'turn'; });
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'turn': enqueue(function () { var G0 = G(); Sound.play(e.p === me ? 'myturn' : 'turn'); banner(e.p === me ? 'Tocca a te!' : esc(G0.players[e.p].nick), e.p === me ? 'Sei il regista' : 'è il regista dei ' + esc(G0.teams[e.t].name)); return sleep(400); }); break;
      case 'guess': if (e.p !== me) enqueue(function () { Sound.play('guess'); return sleep(20); }); break;
      case 'steal': enqueue(function () { Sound.play('steal'); banner('Si ruba!', '15 secondi per le altre squadre'); return sleep(300); }); break;
      case 'hit': enqueue(function () { if (document.activeElement && document.activeElement.blur) document.activeElement.blur(); Sound.play('hit'); banner(e.steal ? 'Rubato!' : 'Indovinato!', esc(G().players[e.p].nick) + ' · +' + e.pts); return sleep(400); }); break;
      case 'miss': enqueue(function () { Sound.play('miss'); return sleep(100); }); break;
      case 'skip': enqueue(function () { if (G().regista !== me) toast('Il regista ha cambiato titolo.'); return sleep(50); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || [], mt = myTeam(G(), me); Sound.play(w.indexOf(mt) >= 0 ? 'win' : 'lose'); if (w.indexOf(mt) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#ffd23f', '#ff6b7a', '#7fd6ff', '#8ff0a4', '#c792ff'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, tap: tap, pad: pad };
})();
