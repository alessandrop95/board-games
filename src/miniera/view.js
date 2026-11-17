/* ===== La Miniera: schermata di gioco =====
   In alto i cercatori (dentro con la lanterna o al campo con la tenda), al centro il sentiero delle gallerie
   scoperte, in basso le tue pepite e i due pulsanti: Avanti o Al campo. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null, lastLen = 0, lastExp = 0;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; return true; } return false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="rock" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-pl" id="gv-pl"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"><div class="mid-h" id="mid-h"></div><div class="tm"><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div></div>' +
      '<div class="gv-path" id="gv-path"></div><div class="gv-me" id="gv-me"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code; lastLen = 0; lastExp = 0;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>La Miniera</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Spedizione ' + g.exp + ' di ' + g.opts.exps) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-pl', players(g, me));
    setHTML('mid-h', midHead(g));
    path(g);
    setHTML('gv-me', mePanel(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    clock();
  }
  function players(g, me) {
    var ord = g.players.map(function (P, i) { return i; });
    return ord.map(function (i) {
      var P = g.players[i], st, live = g.phase === 'choose';
      if (live && P.in) st = '<span class="ps in">' + IC('lamp') + (P.ch ? IC('check') : '') + '</span>';
      else st = '<span class="ps out">' + IC('tent') + '</span>';
      return '<button class="pl' + (i === me ? ' mine' : '') + (live && !P.in ? ' camp' : '') + (live && P.in && P.ch ? ' chose' : '') + '" style="--pc:' + pcol(g, i) + '" data-act="players">' +
        '<span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><span class="pl-t"><b>' + esc(P.nick) + '</b><small>' + IC('chest') + E.score(P) + (live && P.in ? ' · ' + IC('nug') + P.carry : '') + '</small></span>' + st + '</button>';
    }).join('');
  }
  function midHead(g) {
    if (g.phase === 'over') return '<b>Partita finita</b>';
    var seen = E.hazSeen(g), ks = Object.keys(seen);
    var head = '<span class="step">' + (g.phase === 'camp' ? 'Spedizione ' + g.exp + ' finita' : 'Galleria ' + g.step) + '</span>';
    var dz = g.phase === 'choose' ? (ks.length ? '<span class="dz">Pericoli già visti: ' + ks.map(function (h) { return '<span class="dzi">' + ART.hazIcon(h) + E.HAZ_NAME[h] + '</span>'; }).join('') + '<small>se ne esce un altro uguale, chi è dentro perde tutto</small></span>' : '<span class="dz calm">Nessun pericolo, per ora.</span>') : '';
    return head + dz;
  }
  function path(g) {
    var box = el('gv-path'), cells = g.path, key = g.exp + ':' + cells.map(function (c) { return c.c + c.left + (c.taken ? 't' : ''); }).join(',');
    if (box._k === key) return;
    var fresh = g.exp === lastExp && cells.length > lastLen;
    box._k = key;
    var dis = g.res && g.res.h && g.phase !== 'choose' ? cells.length - 1 : -1;
    box.innerHTML = '<div class="trail">' + cells.map(function (c, i) {
      var h = ART.card(c.c, c);
      if (i === dis) h = h.replace('class="gal ', 'class="gal boom ');
      if (fresh && i >= lastLen) h = h.replace('class="gal ', 'class="gal new ');
      return h;
    }).join('<span class="link"></span>') + (g.phase === 'choose' ? '<span class="link"></span><div class="gal next">?</div>' : '') + '</div>';
    lastLen = cells.length; lastExp = g.exp;
    requestAnimationFrame(function () { try { box.scrollTo({ left: box.scrollWidth, behavior: fresh && !reduce ? 'smooth' : 'auto' }); } catch (e) { box.scrollLeft = box.scrollWidth; } });
  }
  function mePanel(g, me) {
    if (g.phase === 'camp' || g.phase === 'over') return campSummary(g, me);
    if (me < 0) return '<div class="card mine-c"><p class="muted">Stai guardando la partita.</p></div>';
    var P = g.players[me], floor = E.floor(g), idol = E.idolsOnPath(g);
    var stats = '<div class="pocket"><span>' + IC('nug') + '<b>' + P.carry + '</b><small>in tasca</small></span><span>' + IC('chest') + '<b>' + E.score(P) + '</b><small>nella cassa</small></span>' + (floor || idol ? '<span class="fl">per terra: ' + (floor ? '<b>' + floor + '</b> ' + (floor > 1 ? 'pepite' : 'pepita') : '') + (floor && idol ? ' e ' : '') + (idol ? '<b>' + idol + '</b> ' + (idol > 1 ? 'idoli' : 'idolo') : '') + '</span>' : '') + '</div>';
    if (!P.in) return '<div class="card mine-c out">' + stats + '<p class="lead">' + IC('tent') + ' Sei al campo: le tue pepite sono al sicuro. Aspetta la fine della spedizione.</p></div>';
    var ins = E.inside(g).length;
    return '<div class="card mine-c">' + stats +
      '<div class="choice"><button class="btn big go' + (P.ch === 'go' ? ' on' : '') + '" data-act="go">' + IC('pick') + ' Avanti</button><button class="btn big back' + (P.ch === 'back' ? ' on' : '') + '" data-act="back">' + IC('tent') + ' Al campo</button></div>' +
      '<p class="mine-n">' + (P.ch ? 'Hai scelto <b>' + (P.ch === 'go' ? 'Avanti' : 'Al campo') + '</b>: puoi cambiare idea finché non hanno scelto tutti.' : 'Nella miniera siete in ' + ins + '. Scegli di nascosto!') + '</p></div>';
  }
  function campSummary(g, me) {
    var R = g.res; if (!R) return '';
    var head = R.h ? '<div class="camp-h bad">' + ART.hazIcon(R.h) + '<span><b>' + E.HAZ_NAME[R.h] + ' per la seconda volta!</b> Chi era ancora dentro è scappato a mani vuote.</span></div>' : '<div class="camp-h">' + IC('tent') + '<span><b>Tutti al campo.</b> La spedizione ' + R.exp + ' è finita.</span></div>';
    var rows = g.players.map(function (P, i) {
      var L = R.gains[i], txt = !L ? 'nessuna pepita' : L.lost != null ? (L.lost ? 'ha perso ' + L.lost + ' pepite' : 'scappato a mani vuote') : '+' + L.home + ' pepite' + (L.idols && L.idols.length ? ' e ' + (L.idols.length > 1 ? L.idols.length + ' idoli' : 'un idolo') + ' (+' + L.idols.reduce(function (a, b) { return a + b; }, 0) + ')' : '');
      var cls = !L ? '' : L.lost != null ? ' lost' : ' won';
      return '<div class="cr' + cls + (i === me ? ' mine' : '') + '" style="--pc:' + pcol(g, i) + '"><span class="pv sm">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + '</b><span class="cr-t">' + txt + '</span><span class="cr-s">' + IC('chest') + E.score(P) + '</span></div>';
    }).join('');
    return '<div class="card camp">' + head + '<div class="crs">' + rows + '</div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', P = me >= 0 ? g.players[me] : null, isHost = App.doc.host === Net.uid;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (p) { return pname(g, p); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'idol'; }
    else if (g.phase === 'camp') {
      help = 'goal';
      if (P && !P.ready) { h = g.exp < g.opts.exps ? 'Pronti per la spedizione ' + (g.exp + 1) + '?' : ''; btn = '<button class="btn small" data-act="next">Prossima spedizione</button>'; }
      else h = 'Aspetto gli altri…';
      if (isHost && P && P.ready) btn += '<button class="btn small ghost" data-act="nextround">Avanti per tutti</button>';
    } else if (!P) h = 'I cercatori stanno scegliendo…';
    else if (!P.in) { h = 'Sei al campo.'; help = 'choice'; }
    else { h = P.ch ? 'Aspetto le scelte degli altri…' : 'Avanti o al campo?'; help = Object.keys(E.hazSeen(g)).length ? 'danger' : 'choice'; if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase === 'choose' || g.phase === 'camp', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = g.phase === 'choose' ? g.opts.time * 1000 : E.CAMP_MS, txt = g.phase === 'choose' ? s + '″' : '';
    if (el('tmv').textContent !== txt) el('tmv').textContent = txt;
    el('tbar').style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    var me = myIdx(), mine = me >= 0 && g.phase === 'choose' && g.players[me].in && !g.players[me].ch;
    el('gv-mid').classList.toggle('low', mine && s <= 5);
    if (mine && s <= 3 && s > 0) { var k = g.turnN + ':' + s; if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
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
    if (news.length > 20) news = news.filter(function (e) { return e.k !== 'chose'; });
    news.forEach(function (e) { plan(g, me, e); });
  }
  function names(g, ps) { return ps.map(function (p) { return esc(g.players[p].nick); }).join(', '); }
  function plan(g, me, e) {
    switch (e.k) {
      case 'exp': enqueue(function () { Sound.play('deal'); banner('Spedizione ' + e.exp, 'tutti dentro la miniera'); return sleep(500); }); break;
      case 'chose': if (e.p !== me) enqueue(function () { Sound.play('mate'); return sleep(20); }); break;
      case 'choice': enqueue(function () {
        var back = e.back || [];
        if (back.length) { Sound.play('home'); banner(back.indexOf(me) >= 0 ? 'Torni al campo' : names(g, back) + (back.length > 1 ? ' tornano' : ' torna') + ' al campo', (e.got ? '+' + e.got + ' pepite da terra' + (back.length > 1 ? ' a testa' : '') : '') + (e.idols && e.idols.length ? (e.got ? ' e ' : '') + (e.idols.length > 1 ? e.idols.length + ' idoli' : 'l’idolo') + '!' : '') || (e.go.length ? 'gli altri vanno avanti' : '')); }
        else { Sound.play('step'); banner('Tutti avanti!', 'nessuno torna al campo'); }
        return sleep(900);
      }); break;
      case 'card': enqueue(function () {
        var t = e.c.charAt(0);
        if (t === 'g') Sound.play('gem'); else if (t === 'i') { Sound.play('idol'); banner('Un idolo!', 'lo porta via solo chi torna da solo'); }
        else { Sound.play('haz'); var h = e.c.slice(1); banner(E.HAZ_NAME[h] + '!', E.HAZ_TXT[h] + ': se ne esce un’altra, si scappa'); }
        return sleep(t === 'g' ? 300 : 700);
      }); break;
      case 'disaster': enqueue(function () {
        Sound.play('boom'); shake();
        banner('Ancora ' + E.HAZ_NAME[e.h] + '!', e.ps.length ? (e.ps.indexOf(me) >= 0 ? 'scappi e perdi le pepite in tasca' : names(g, e.ps) + ' perde tutto') : '');
        return sleep(1200);
      }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function shake() { var v = el('gv'); if (!v || reduce) return; v.classList.remove('shake'); void v.offsetWidth; v.classList.add('shake'); setTimeout(function () { v.classList.remove('shake'); }, 700); }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#ffcf3f', '#f0a91c', '#3fc1a5', '#ff7a59', '#fff3b8'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock };
})();
