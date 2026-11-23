/* ===== Dadi e rischio: schermata di gioco =====
   In alto i giocatori con i punti e la barra verso il traguardo; al centro il turno in corso: il piatto e la fila
   dei valori messi da parte (5 caselle). Sotto i dadi dell'ultimo tiro, che tutti vedono in diretta: chi gioca
   li tocca per metterli da parte e poi sceglie «Tira ancora» (con il rischio di sballare) o «Mi fermo». */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, sel = [], selKey = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; return true; } return false; }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv"><div class="felt" aria-hidden="true"></div>' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-pl" id="gv-pl"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div><div class="gv-me" id="gv-me"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div></div>';
    mountedFor = App.code; sel = []; selKey = null;
  }
  function unmount() { mountedFor = null; }
  function myTurn(g, me) { return me >= 0 && g.turn === me && (g.phase === 'roll' || g.phase === 'pick'); }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    var key = g.turnN + ':' + g.rolls + ':' + g.phase;
    if (selKey !== key) { selKey = key; sel = []; }
    setHTML('gv-info', '<b>Dadi e rischio</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : (g.lastRound ? 'Ultimo giro' : 'Giro ' + g.round)) + ' · fino a ' + g.opts.target + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-pl', players(g, me));
    setHTML('gv-mid', mid(g, me));
    setHTML('gv-me', mePanel(g, me));
    setHTML('gv-prompt', prompt(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function players(g, me) {
    var lead = Math.max.apply(null, g.players.map(function (P) { return P.score; }));
    return g.players.map(function (P, i) {
      var turn = g.phase !== 'over' && g.turn === i, h = P.hist[P.hist.length - 1];
      var w = Math.min(100, P.score / g.opts.target * 100).toFixed(1);
      var sub = turn ? (g.pot ? '<small class="th">piatto ' + g.pot + '</small>' : '<small class="th">tira…</small>') : h ? (h.bust ? '<small class="bz">sballato</small>' : '<small>+' + h.pts + '</small>') : '<small>&nbsp;</small>';
      return '<button class="pl' + (i === me ? ' mine' : '') + (turn ? ' turn' : '') + (P.score === lead && lead > 0 ? ' lead' : '') + '" style="--pc:' + pcol(g, i) + '" data-act="players" data-p="' + i + '">' +
        '<span class="pl-av">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><span class="pl-t"><b>' + esc(P.nick) + '</b><span class="pl-s">' + P.score + '</span><span class="pbar"><i style="width:' + w + '%"></i></span>' + sub + '</span></button>';
    }).join('');
  }
  function row(g) {
    var s = '';
    for (var k = 0; k < E.DICE; k++) s += '<span class="slot">' + ART.die(g.kept[k] || 0, g.kept[k] ? 'kept' : 'empty') + '</span>';
    return '<div class="row5" aria-label="Fila: ' + (g.kept.length ? g.kept.join(', ') : 'vuota') + '">' + s + '</div>';
  }
  function lastTxt(g, me) {
    var L = g.last; if (!L) return '';
    if (L.bust) return '<div class="last bust">' + pname(g, L.p) + ' ha tirato <span class="ld">' + L.dice.map(function (v) { return ART.die(v, 'sm'); }).join('') + '</span> e ha <b>sballato</b>' + (L.pot ? ': perde ' + L.pot + ' punti.' : '.') + '</div>';
    return '<div class="last ok">' + pname(g, L.p) + ' si è fermato e ha incassato <b>+' + L.pot + '</b>' + (L.rows ? ' (con ' + L.rows + (L.rows > 1 ? ' file complete' : ' fila completa') + ')' : '') + '.</div>';
  }
  function mid(g, me) {
    if (g.phase === 'over') return '<div class="turnh"><b>Partita finita</b></div>' + lastTxt(g, me);
    var who = g.turn === me ? 'Il tuo turno' : 'Turno di ' + pname(g, g.turn);
    var potTxt = '<div class="pot"><span class="pot-l">Piatto</span><b class="pot-v">' + g.pot + '</b>' + (g.rows ? '<span class="rows">' + IC('star') + ' ' + g.rows + (g.rows > 1 ? ' file' : ' fila') + '</span>' : '') + '</div>';
    var extra = g.phase === 'roll' && !g.rolls ? lastTxt(g, me) : '';
    return '<div class="turnh">' + who + (g.lastRound ? ' <span class="tag end">ultimo giro</span>' : '') + '</div>' + potTxt + row(g) + extra;
  }
  // il rischio di sballare al prossimo tiro, se metto da parte i dadi scelti
  function preview(g) {
    var vals = sel.map(function (i) { return g.dice[i]; }), kept = g.kept.concat(vals), full = kept.length === E.DICE;
    return { vals: vals, full: full, gain: E.sum(vals) + (full ? E.BONUS : 0), risk: full ? 0 : E.bustChance(kept), free: full ? E.DICE : E.DICE - kept.length };
  }
  function diceRow(g, me, can) {
    if (!g.dice.length) return '';
    return '<div class="roll' + (can ? ' can' : '') + '" id="roll">' + g.dice.map(function (v, i) {
      var old = g.kept.indexOf(v) >= 0, on = sel.indexOf(i) >= 0;
      var cls = old ? 'old' : on ? 'on' : '';
      if (!can) return '<span class="rd ' + cls + '">' + ART.die(v) + '</span>';
      return '<button class="rd ' + cls + '" data-act="die" data-i="' + i + '"' + (old ? ' disabled aria-label="' + v + ': già nella fila"' : ' aria-pressed="' + on + '" aria-label="Dado ' + v + '"') + '>' + ART.die(v) + '</button>';
    }).join('') + '</div>';
  }
  function pct(x) { return x <= 0 ? '0%' : x >= 1 ? '100%' : (x < .1 ? (x * 100).toFixed(1).replace('.', ',') : Math.round(x * 100)) + '%'; }
  function mePanel(g, me) {
    if (g.phase === 'over') return '';
    var mine = myTurn(g, me), P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'roll') {
      var n = E.DICE - g.kept.length;
      if (mine) return '<div class="card me myturn"><button class="btn block big" data-act="roll">' + IC('dice') + ' Tira ' + n + ' dadi</button>' + (g.rolls ? '<p class="muted tc">Fila completa: questo tiro non può sballare.</p>' : '<p class="muted tc">Prima di te: ' + g.players.filter(function (Q, i) { return i !== me; }).map(function (Q) { return esc(Q.nick) + ' ' + Q.score; }).join(' · ') + '</p>') + '</div>';
      return '<div class="card me"><p class="muted tc">' + pname(g, g.turn) + ' sta per tirare…</p></div>';
    }
    if (!mine) return '<div class="card me">' + diceRow(g, me, false) + '<p class="muted tc">' + pname(g, g.turn) + ' sceglie quali dadi mettere da parte…</p></div>';
    var pv = preview(g), nw = E.fresh(g), ok = sel.length > 0;
    var info = ok ? '<div class="pick-i">Metti da parte <b>' + pv.vals.join(' + ') + '</b>' + (pv.full ? ' <span class="tag end">fila completa +' + E.BONUS + '</span>' : '') + ' · piatto <b>' + (g.pot + pv.gain) + '</b></div>' : '<div class="pick-i">Tocca i dadi da mettere da parte (valori nuovi: <b>' + nw.join(', ') + '</b>)</div>';
    var risk = pv.risk, rc = risk >= .5 ? 'hi' : risk >= .2 ? 'mid' : 'lo';
    return '<div class="card me myturn">' + diceRow(g, me, true) + info +
      (nw.length > 1 ? '<button class="chip allnew" data-act="allnew">Prendi tutti i valori nuovi</button>' : '') +
      '<div class="calls"><button class="btn go" data-act="go"' + (ok ? '' : ' disabled') + '>' + IC('dice') + ' Tira ancora<small>' + (ok ? pv.free + (pv.free > 1 ? ' dadi' : ' dado') + ' · rischio <span class="rk-' + rc + '">' + pct(risk) + '</span>' : 'scegli prima i dadi') + '</small></button>' +
      '<button class="btn ghost stop" data-act="stop"' + (ok ? '' : ' disabled') + '>' + IC('hand') + ' Mi fermo<small>' + (ok ? '+' + (g.pot + pv.gain) + ' → ' + (P.score + g.pot + pv.gain) : '') + '</small></button></div></div>';
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (myTurn(g, me)) { h = g.phase === 'roll' ? '<b>Tocca a te!</b> Tira i dadi.' : '<b>Scegli</b> i dadi, poi tira ancora o fermati.'; h += '<span class="tt" id="tt"></span>'; help = g.phase === 'roll' ? 'turn' : 'bust'; if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
    else { h = 'Tocca a ' + pname(g, g.turn) + '…' + (g.lastRound ? ' È l’ultimo giro.' : ''); if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>'; }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function clock() {}
  // scelta dei dadi sul telefono di chi gioca
  function toggle(i) {
    var g = G(); if (!g || g.phase !== 'pick') return;
    var v = g.dice[i]; if (v == null || g.kept.indexOf(v) >= 0) return;
    var k = sel.indexOf(i);
    if (k >= 0) { sel.splice(k, 1); Sound.play('unpick'); }
    else { sel = sel.filter(function (j) { return g.dice[j] !== v; }); sel.push(i); Sound.play('pick'); }
    render();
  }
  function allNew() {
    var g = G(); if (!g || g.phase !== 'pick') return;
    sel = []; E.fresh(g).forEach(function (v) { var i = g.dice.indexOf(v); if (i >= 0) sel.push(i); });
    Sound.play('pick'); render();
  }
  function picked() { return sel.slice(); }
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
  function shake() { var r = el('roll'); if (r && !reduce) { r.classList.remove('rolling'); void r.offsetWidth; r.classList.add('rolling'); } }
  function plan(g, me, e) {
    switch (e.k) {
      case 'turn': if (e.p === me) enqueue(function () { Sound.play('turn'); return sleep(50); }); break;
      case 'roll': enqueue(function () { Sound.play('roll'); shake(); return sleep(250); }); break;
      case 'bust': enqueue(function () { Sound.play('roll'); return sleep(450).then(function () { Sound.play('bust'); banner('Sballato!', esc(G().players[e.p].nick) + (e.lost ? ' perde ' + e.lost + ' punti' : '')); return sleep(700); }); }); break;
      case 'bank': enqueue(function () { Sound.play('bank'); floatTxt('+' + e.pot, e.p); return sleep(300); }); break;
      case 'row': enqueue(function () { Sound.play('row'); banner('Fila completa!', '+' + E.BONUS + ' e di nuovo 5 dadi'); return sleep(500); }); break;
      case 'last': enqueue(function () { Sound.play('last'); banner('Ultimo giro!', esc(G().players[e.p].nick) + ' ha raggiunto ' + G().opts.target); return sleep(600); }); break;
      case 'over': enqueue(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
    }
  }
  function floatTxt(t, p) {
    var b = document.querySelector('.pl[data-p="' + p + '"]'), r = b ? b.getBoundingClientRect() : { left: innerWidth / 2, top: innerHeight / 3, width: 0, height: 0 };
    var f = document.createElement('div'); f.className = 'floatxt col'; f.textContent = t; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1600);
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2000); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '', cols = ['#ff6b5a', '#f2b705', '#2fb36d', '#16b5c4', '#3d8bfd', '#a35cf0'];
    for (var i = 0; i < 50; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, toggle: toggle, allNew: allNew, picked: picked };
})();
