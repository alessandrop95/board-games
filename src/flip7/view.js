/* ===== Flip 7: schermata di gioco (file di carte, mazzo, scarti) e animazioni =====
   Lo stato si disegna subito com'è; le animazioni partono dopo, nascondendo per un attimo le carte che stanno «volando».
   Carte che volano dal mazzo e si girano, doppioni che fanno tremare la fila, ghiaccio, fuochi d'artificio per il Flip 7. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }
  var STL = { 'in': 'in gioco', stay: 'fermo', bust: 'sballato', frozen: 'congelato', flip7: 'FLIP 7' };

  function fair() {
    var o = '', k;
    for (k = 0; k < 26; k++) o += '<b class="st" style="left:' + ((k * 37) % 100) + '%;top:' + ((k * 23) % 55) + '%;animation-delay:-' + (k * .6).toFixed(1) + 's"></b>';
    var bulbs = ''; for (k = 0; k < 24; k++) bulbs += '<i style="--k:' + k + '"></i>';
    var spokes = ''; for (k = 0; k < 8; k++) spokes += '<span class="sp" style="--a:' + (k * 45) + 'deg"><em></em></span>';
    return '<div class="fair" aria-hidden="true">' + o + '<div class="fw">' + spokes + '<b class="hub"></b></div><div class="fw-leg"></div><div class="beam b1"></div><div class="beam b2"></div><div class="lights">' + bulbs + '</div><div class="felt"></div></div>';
  }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + fair() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-opp" id="gv-opp"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div>' +
      '<div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function mainIdx(g) { var me = myIdx(); if (me >= 0) return me; var d = E.decider(g); return d != null ? d : 0; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx(), mi = mainIdx(g);
    setHTML('gv-info', '<b>Flip 7</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Manche ' + g.round) + ' · fino a ' + g.opts.target + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-opp', opponents(g, mi));
    setHTML('gv-mid', middle(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', mainBoard(g, mi, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    applyHide();
  }

  /* ---------- file di carte ---------- */
  function tableau(g, p, o) {
    o = o || {};
    var P = g.players[p], mini = !o.big;
    var mods = P.mods.map(function (c) { return '<span class="nc mc" data-c="' + c + '">' + ART.card(c, true, { mini: mini }) + '</span>'; }).join('');
    if (P.sc) mods += '<span class="nc scb" data-c="SC">' + ART.card('SC', true, { mini: mini }) + '</span>';
    var nums = P.nums.map(function (c) { return '<span class="nc" data-c="' + c + '">' + ART.card(c, true, { mini: mini }) + '</span>'; }).join('');
    if (P.st === 'bust' && P.bustCard != null) nums += '<span class="nc dup" data-c="dup">' + ART.card(P.bustCard, true, { mini: mini }) + '</span>';
    var slots = ''; if (o.big) for (var k = P.nums.length + (P.st === 'bust' && P.bustCard != null ? 1 : 0); k < 7; k++) slots += '<span class="nc ghost-slot"><i>' + (k + 1) + '</i></span>';
    return '<div class="tab' + (o.big ? ' big' : '') + ' st-' + P.st + '" data-p="' + p + '"><div class="mods">' + mods + '</div><div class="nums">' + nums + slots + '</div></div>';
  }
  function stBadge(g, p) {
    var P = g.players[p], o = '';
    if (g.phase === 'play' && p === g.dealer) o += '<span class="tag dealer" title="Mazziere">' + IC('deal') + '</span>';
    if (P.st !== 'in' || g.phase !== 'play') o += '<span class="tag s-' + P.st + '">' + (P.st === 'frozen' ? IC('snow') + ' ' : '') + STL[P.st] + '</span>';
    if (P.away) o += '<span class="tag away">assente</span>'; else if (P.bot && g.phase !== 'over') o += '<span class="tag bot">auto</span>';
    if (g.phase === 'play' && E.decider(g) === p && g.choice) o += '<span class="tag wait">sceglie…</span>';
    if (g.phase === 'scores' && P.ready && !P.bot) o += '<span class="tag ok">pronto</span>';
    return o;
  }
  function opponents(g, mi) {
    return g.players.map(function (P, p) {
      if (p === mi) return '';
      var on = g.phase === 'play' && E.decider(g) === p;
      return '<button class="opp st-' + P.st + (on ? ' on' : '') + '" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s"><span class="rs" title="Punti in tavola">' + E.score(P) + '</span><span class="sc-tot" title="Totale della partita">Σ ' + P.total + '</span></span>' + tableau(g, p, {}) + '<span class="opp-t">' + stBadge(g, p) + '</span>' + overlay(P) + '</button>';
    }).join('');
  }
  function overlay(P) {
    if (P.st === 'frozen') return '<span class="ovl ice" aria-hidden="true"></span>';
    if (P.st === 'bust') return '<span class="ovl x" aria-hidden="true">' + IC('x') + '</span>';
    if (P.st === 'flip7') return '<span class="ovl f7" aria-hidden="true">FLIP 7</span>';
    return '';
  }
  function riskMeter(g, p) {
    var P = g.players[p]; if (!E.active(P) || g.phase !== 'play' || !P.nums.length) return '';
    var r = E.bustRisk(g, p), lv = r < .2 ? 'lo' : r < .35 ? 'md' : 'hi';
    return '<span class="risk r-' + lv + '" title="Probabilità di sballare con la prossima carta"><span class="rk-l">rischio</span><span class="rk-bar"><i style="width:' + Math.round(r * 100) + '%"></i></span><b>' + Math.round(r * 100) + '%</b>' + (P.sc ? '<span class="rk-sc">' + IC('heart') + '</span>' : '') + '</span>';
  }
  function mainBoard(g, mi, me) {
    var P = g.players[mi], on = g.phase === 'play' && E.decider(g) === mi, mine = mi === me && on && g.stage === 'turn' && !g.choice;
    var prog = Math.max(0, Math.min(100, P.total / g.opts.target * 100)), proj = Math.max(0, Math.min(100, (P.total + (P.st === 'bust' ? 0 : E.score(P))) / g.opts.target * 100));
    var btns = mine ? '<div class="acts"><button class="btn hit" data-act="hit">' + IC('hit') + ' PESCA</button><button class="btn stop" data-act="stay"' + (!P.nums.length && !P.mods.length ? ' disabled' : '') + '>' + IC('stop') + ' STOP</button></div>' : '';
    return '<div class="mine st-' + P.st + (on ? ' on' : '') + '" style="--pc:' + pcol(g, mi) + '"><div class="mine-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + (mi === me ? ' (tu)' : '') + '</b>' + stBadge(g, mi) +
      '<span class="mine-s"><span class="rs-big" title="Punti in tavola in questa manche">' + (P.st === 'bust' ? '0' : E.score(P)) + '<small>in tavola</small></span></span></div>' +
      '<div class="prog" title="Totale ' + P.total + ' su ' + g.opts.target + '"><i class="p1" style="width:' + prog.toFixed(1) + '%"></i><i class="p2" style="left:' + prog.toFixed(1) + '%;width:' + (proj - prog).toFixed(1) + '%"></i><span>Σ ' + P.total + ' / ' + g.opts.target + '</span></div>' +
      '<div class="tabwrap">' + tableau(g, mi, { big: true }) + overlay(P) + '</div>' + '<div class="mine-f">' + riskMeter(g, mi) + btns + '</div></div>';
  }

  /* ---------- centro: mazzo, scarti, faretto ---------- */
  function middle(g, me) {
    var stack = ''; for (var k = 0; k < Math.min(5, Math.ceil(g.deck.length / 16)); k++) stack += '<span class="stk" style="--k:' + k + '">' + ART.card(null, false) + '</span>';
    var top = g.disc[g.disc.length - 1];
    var mine = g.phase === 'play' && g.stage === 'turn' && g.turn === me && !g.choice;
    var deck = '<button class="pile deck' + (mine ? ' can' : '') + '" data-act="hit" aria-label="Mazzo, ' + g.deck.length + ' carte"' + (mine ? '' : ' aria-disabled="true"') + '>' + stack + '<span class="pl">Mazzo <i>' + g.deck.length + '</i></span></button>';
    var disc = '<div class="pile disc" aria-label="Scarti, ' + g.disc.length + ' carte">' + (top != null ? '<span class="dtop">' + ART.card(top, true) + '</span>' : '<span class="dempty"></span>') + '<span class="pl">Scarti <i>' + g.disc.length + '</i></span></div>';
    var who = g.phase === 'play' ? E.decider(g) : null;
    var spot = '<div class="spot" id="spot"><span class="spot-l">' + (g.phase !== 'play' ? 'Manche ' + g.round : who != null ? (who === me ? 'Tocca a te' : 'Tocca a ' + esc(g.players[who].nick)) : 'Distribuzione…') + '</span><span class="spot-n">' + E.actives(g).length + ' in gioco</span></div>';
    return '<div class="piles">' + deck + spot + disc + '</div>';
  }

  /* ---------- cosa fare adesso ---------- */
  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> Vince ' + pname(g, g.winners[0]) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (g.phase === 'scores') { h = '<b>Manche ' + g.round + ' finita.</b> Guarda i punti e preparati alla prossima.'; btn = '<button class="btn small" data-act="showround">Punti</button>'; help = 'score'; }
    else if (g.choice) {
      help = 'actions';
      if (g.choice.p === me) { h = 'Hai pescato <b>' + ART.lab(g.choice.c) + '</b>: scegli a chi darla.'; btn = '<button class="btn small" data-act="choose">Scegli</button>'; }
      else h = pname(g, g.choice.p) + ' ha pescato <b>' + ART.lab(g.choice.c) + '</b> e sta scegliendo a chi darla…';
    } else if (g.stage === 'turn' && g.turn === me) {
      var r = E.bustRisk(g, me);
      h = P.nums.length ? '<b>Tocca a te!</b> Hai <b>' + E.score(P) + '</b> punti in tavola: <b>PESCA</b> o <b>STOP</b>? Rischio di sballare: <b>' + Math.round(r * 100) + '%</b>.' : '<b>Tocca a te!</b> Non hai ancora numeri: pesca una carta.';
      if (P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else if (g.stage === 'turn') {
      var T = g.players[g.turn];
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + ': ha ' + E.score(T) + ' punti in tavola…';
      if (P && P.st !== 'in') h = (P.st === 'bust' ? 'Hai sballato in questa manche. ' : P.st === 'frozen' ? 'Sei congelato: i tuoi ' + E.score(P) + ' punti sono al sicuro. ' : P.st === 'flip7' ? '' : 'Ti sei fermato con ' + E.score(P) + ' punti. ') + h;
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else h = 'Il mazziere distribuisce…';
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- carte nascoste durante le animazioni ---------- */
  function tabEl(p) { return document.querySelector('.tab[data-p="' + p + '"]'); }
  function cardEl(p, c) { var t = tabEl(p); return t && t.querySelector('.nc[data-c="' + c + '"]'); }
  function panelEl(p) { var t = tabEl(p); return t && (t.closest('.opp') || t.closest('.mine')); }
  function applyHide() {
    document.querySelectorAll('.flyhide').forEach(function (n) { n.classList.remove('flyhide'); });
    Object.keys(App.hide).forEach(function (k) {
      var h = App.hide[k], parts = k.split('|'), n = null;
      if (parts[0] === 'c') n = cardEl(parts[1], parts[2]); else if (parts[0] === 'disc') n = document.querySelector('.pile.disc .dtop');
      if (n && h.n > 0) n.classList.add('flyhide');
    });
  }
  function hide(k) { var h = App.hide[k] || (App.hide[k] = { n: 0 }); h.n++; }
  function unhide(k) { var h = App.hide[k]; if (!h) return; if (--h.n <= 0) delete App.hide[k]; applyHide(); }

  /* ---------- volo di una carta ---------- */
  function rectOf(n) { return n ? n.getBoundingClientRect() : null; }
  function cardRect(n) { if (!n) return null; var c = n.querySelector('.f7c') || n; return c.getBoundingClientRect(); }
  function deckRect() { return cardRect(document.querySelector('.pile.deck .stk:last-child') || document.querySelector('.pile.deck')); }
  function discRect() { return cardRect(document.querySelector('.pile.disc .dtop') || document.querySelector('.pile.disc .dempty') || document.querySelector('.pile.disc')); }
  function spotRect() { var s = rectOf(el('spot')); if (!s) return null; var w = Math.min(120, s.width * .9), h = w * 1.4; return { left: s.left + (s.width - w) / 2, top: s.top + (s.height - h) / 2, width: w, height: h }; }
  function fly(html, from, to, o) {
    o = o || {};
    if (!from || !to || reduce) return Promise.resolve();
    var f = document.createElement('div'); f.className = 'flyer' + (o.cls ? ' ' + o.cls : ''); f.innerHTML = html;
    f.style.width = to.width + 'px'; f.style.height = to.height + 'px'; f.style.left = to.left + 'px'; f.style.top = to.top + 'px';
    document.body.appendChild(f);
    var sx = from.width / to.width, dx = from.left - to.left, dy = from.top - to.top, lift = o.arc == null ? -Math.min(80, Math.abs(dx) * .25 + 30) : o.arc;
    return anim(f, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ') rotate(' + (o.r0 || -8) + 'deg)', offset: 0 },
      { transform: 'translate(' + (dx / 2) + 'px,' + (dy / 2 + lift) + 'px) scale(' + ((sx + 1) / 2 * 1.12) + ') rotate(' + ((o.r0 || -8) / 2 + 6) + 'deg)', offset: .5 },
      { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 1 }
    ], { duration: o.dur || 480, easing: 'cubic-bezier(.3,.7,.3,1)', delay: o.delay || 0, fill: 'both' }).then(function () { if (!o.keep) f.remove(); return f; });
  }
  function burst(r, cols, n) {
    if (!r || reduce) return;
    var b = document.createElement('div'); b.className = 'burst'; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = (r.top + r.height / 2) + 'px';
    var o = ''; n = n || 16; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, d = 44 + (i % 3) * 20; o += '<i style="--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d) + 'px;background:' + (cols || ['#fff6c8', '#ff5ad1', '#3dd6ff'])[i % 3] + '"></i>'; }
    b.innerHTML = o; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1700);
  }
  function stamp(p, txt, cls) {
    var pn = panelEl(p); if (!pn || reduce) return;
    var r = rectOf(pn), s = document.createElement('div'); s.className = 'stampfx ' + (cls || ''); s.innerHTML = '<span>' + txt + '</span>';
    s.style.left = r.left + 'px'; s.style.top = r.top + 'px'; s.style.width = r.width + 'px'; s.style.height = r.height + 'px';
    document.body.appendChild(s); setTimeout(function () { s.remove(); }, 1600);
  }
  function shake(n, cls) { if (!n) return; n.classList.remove(cls || 'shake'); void n.offsetWidth; n.classList.add(cls || 'shake'); setTimeout(function () { n.classList.remove(cls || 'shake'); }, 900); }
  function pop(n) { if (!n) return; var c = n.querySelector('.f7c'); if (!c) return; c.classList.remove('flipin'); void c.offsetWidth; c.classList.add('flipin'); setTimeout(function () { c.classList.remove('flipin'); }, 650); }

  /* ---------- coda degli effetti ---------- */
  var Q = [], qBusy = false, spotCard = null;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4500); }
  function idle() { return !qBusy && !Q.length; }
  function clearSpot() { if (spotCard) { spotCard.remove(); spotCard = null; } }
  // la carta azione vola dal faretto a un giocatore (o agli scarti)
  function fromSpot(c, to) {
    var f = spotCard; spotCard = null;
    if (!f || !to) { if (f) f.remove(); return Promise.resolve(); }
    var r = f.getBoundingClientRect(); f.remove();
    return fly(ART.card(c, true), r, to, { dur: 520, arc: -30, r0: 0 });
  }

  function fx(g, me) {
    // partita nuova sullo stesso tavolo (anche se la sala d'attesa non si è vista): i contatori ripartono da zero
    if (App.lastFxN && g.fxN < App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
    if (App.lastFxN == null || !App.seenFirstDoc) {
      App.lastFxN = g.fxN;
      if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); }
      if (g.phase === 'play' && g.choice && g.choice.p === me && !App.sheet) { App.sheet = { kind: 'choose' }; renderSheet(); }
      return;
    }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    // troppe cose arretrate (telefono in pausa): niente animazioni, solo lo stato
    if (Q.length > 10 || news.length > 30) { Q = []; App.hide = {}; clearSpot(); applyHide(); news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over' || e.k === 'choose'; }); }
    news.forEach(function (e, i) { plan(g, me, e, news[i + 1]); });
    applyHide();
  }
  function plan(g, me, e, nx) {
    var k;
    switch (e.k) {
      case 'round':
        enqueue(function () { clearSpot(); Sound.play('shuffle'); banner('Manche ' + e.round, 'distribuisce ' + esc(g.players[e.dealer].nick), 'round'); return sleep(900); });
        break;
      case 'card': {
        k = 'c|' + e.p + '|' + e.c; hide(k);
        enqueue(function () {
          var to = cardRect(cardEl(e.p, e.c)), mod = typeof e.c !== 'number';
          Sound.play(mod ? 'mod' : e.ctx === 'deal' ? 'deal' : 'flip', { v: e.c });
          return fly(ART.card(e.c, true, { cls: 'flipin' }), deckRect(), to, { dur: e.ctx === 'deal' ? 380 : 460 }).then(function () {
            unhide(k); var n = cardEl(e.p, e.c); pop(n);
            if (mod) { burst(cardRect(n), ['#fff3b0', '#ffd23d', '#ff9a2a'], 12); floatTxt(cardRect(n), e.c === 'x2' ? '×2!' : e.c, 'gold'); }
            if (e.ctx === 'f3' && App.f3 && App.f3.p === e.p) { App.f3.n++; floatTxt(cardRect(n), App.f3.n + '/3', 'f3'); }
            return sleep(e.ctx === 'deal' ? 60 : 160);
          });
        });
        break;
      }
      case 'action': {
        var keepIt = nx && (nx.k === 'freeze' || nx.k === 'flip3' || nx.k === 'gift' || nx.k === 'choose' || nx.k === 'waste');
        if (e.c === 'SC' && !keepIt) hide('c|' + e.p + '|SC');
        enqueue(function () {
          clearSpot(); Sound.play('action');
          var to = spotRect();
          return fly(ART.card(e.c, true, { cls: 'flipin' }), deckRect(), to, { dur: 520, keep: true, arc: -50 }).then(function (f) {
            if (!f || !f.parentNode) return;
            f.classList.add('spotlit'); spotCard = f;
            floatTxt(to, ART.lab(e.c) + '!', 'act');
            var keep = nx && (nx.k === 'freeze' || nx.k === 'flip3' || nx.k === 'gift' || nx.k === 'choose' || nx.k === 'waste');
            if (e.c === 'SC' && !keep) return sleep(600).then(function () { return fromSpot('SC', cardRect(cardEl(e.p, 'SC')) || rectOf(tabEl(e.p))); }).then(function () { unhide('c|' + e.p + '|SC'); });
            if (!keep && e.c !== 'SC') return sleep(500);   // resterà nel faretto finché non si sceglie
            return sleep(650);
          });
        });
        break;
      }
      case 'choose':
        enqueue(function () { if (e.p === me) { Sound.play('turn'); App.sheet = { kind: 'choose' }; renderSheet(); } return sleep(100); });
        break;
      case 'freeze':
        enqueue(function () {
          var pn = panelEl(e.p);
          return fromSpot('FRZ', rectOf(pn)).then(function () {
            Sound.play('freeze'); stamp(e.p, 'CONGELATO', 'ice'); burst(rectOf(pn), ['#ffffff', '#bfefff', '#7fd0ff'], 22); shake(pn, 'frosting');
            floatTxt(rectOf(pn), '+' + E.score(G().players[e.p]) + ' al sicuro', 'ice');
            return sleep(900);
          });
        });
        break;
      case 'flip3':
        enqueue(function () {
          var pn = panelEl(e.p);
          App.f3 = { p: e.p, n: 0 };
          return fromSpot('F3', rectOf(pn)).then(function () { Sound.play('flip3'); banner('FLIP THREE!', (e.p === me ? 'tocca a te: ' : esc(g.players[e.p].nick) + ': ') + 'tre carte di fila', 'f3'); shake(pn, 'drum'); return sleep(1100); });
        });
        break;
      case 'gift':
        hide('c|' + e.p + '|SC');
        enqueue(function () { Sound.play('gift'); var to = cardRect(cardEl(e.p, 'SC')) || rectOf(tabEl(e.p)); return fromSpot('SC', to).then(function () { unhide('c|' + e.p + '|SC'); floatTxt(to, '♥ regalo', 'good'); return sleep(400); }); });
        break;
      case 'waste':
        enqueue(function () { return fromSpot(e.c, discRect()).then(function () { return sleep(200); }); });
        break;
      case 'bust':
        enqueue(function () {
          var dup = cardEl(e.p, 'dup'), to = cardRect(dup); if (dup) dup.classList.add('flyhide');
          Sound.play('flip', { v: e.c });
          return fly(ART.card(e.c, true, { cls: 'flipin' }), deckRect(), to, { dur: 460 }).then(function () {
            if (dup) dup.classList.remove('flyhide');
            var same = cardEl(e.p, e.c), pn = panelEl(e.p);
            [same, dup].forEach(function (n) { if (n) n.classList.add('clash'); });
            Sound.play('bust'); shake(tabEl(e.p)); stamp(e.p, 'SBALLATO!', 'bust');
            if (App.f3 && App.f3.p === e.p) App.f3 = null;
            return sleep(1100).then(function () { [same, dup].forEach(function (n) { if (n) n.classList.remove('clash'); }); });
          });
        });
        break;
      case 'save':
        enqueue(function () {
          var same = cardEl(e.p, e.c), r = cardRect(same), sc = cardRect(cardEl(e.p, 'SC')) || r;
          var to = r ? { left: r.left + r.width * .5, top: r.top - r.height * .3, width: r.width, height: r.height } : null;
          Sound.play('flip', { v: e.c });
          return fly(ART.card(e.c, true, { cls: 'flipin' }), deckRect(), to, { dur: 440 }).then(function () {
            Sound.play('save'); burst(to, ['#b6ffcf', '#ffffff', '#ff5a7a'], 20); floatTxt(to, 'Salvo!', 'good');
            if (same) same.classList.add('saved');
            return Promise.all([fly(ART.card(e.c, true), to, discRect(), { dur: 520, delay: 450 }), fly(ART.card('SC', true), sc, discRect(), { dur: 560, delay: 520 })]);
          }).then(function () { if (same) same.classList.remove('saved'); });
        });
        break;
      case 'flip7':
        enqueue(function () {
          var t = tabEl(e.p); if (t) t.classList.add('wave');
          Sound.play('flip7'); fireworks(); banner('FLIP 7!', (e.p === me ? 'Ce l’hai fatta! ' : esc(g.players[e.p].nick) + ' ') + '+15 punti', 'f7');
          if (App.f3) App.f3 = null;
          return sleep(2200).then(function () { if (t) t.classList.remove('wave'); });
        });
        break;
      case 'stay':
        enqueue(function () { Sound.play('stay'); stamp(e.p, 'STOP', 'stay'); floatTxt(rectOf(panelEl(e.p)), '+' + e.s, 'gold'); return sleep(700); });
        break;
      case 'turn':
        if (e.p === me) enqueue(function () { if (App.f3) App.f3 = null; Sound.play('turn'); pulse(); return sleep(80); });
        else enqueue(function () { if (App.f3) App.f3 = null; return sleep(10); });
        break;
      case 'reshuffle': enqueue(function () { Sound.play('shuffle'); toast('Il mazzo era finito: ho rimescolato le carte delle manche passate.'); return sleep(400); }); break;
      case 'nocards': enqueue(function () { toast('Le carte sono finite: la manche si chiude qui.'); return sleep(300); }); break;
      case 'roundEnd':
        enqueue(function () { clearSpot(); return sleep(500).then(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); }); });
        break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) { confetti(); fireworks(); } return sleep(100); }); break;
      case 'next': enqueue(function () { if (App.sheet && App.sheet.kind === 'round') { App.sheet = null; renderSheet(); } return sleep(50); }); break;
    }
  }
  function pulse() { var b = document.querySelector('.mine'); if (b) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } }
  function banner(t, sub, cls) { var b = document.createElement('div'); b.className = 'banner ' + (cls || ''); b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2300); }
  function fireworks() {
    if (reduce) return;
    var w = document.createElement('div'); w.className = 'fireworks';
    var cols = ['#ff5ad1', '#3dd6ff', '#ffd23d', '#5dff9a', '#ff8a3d', '#b28bff'], o = '';
    for (var k = 0; k < 7; k++) {
      var x = 10 + Math.random() * 80, y = 12 + Math.random() * 40, c = cols[k % cols.length], d = (k * .28).toFixed(2), sp = '';
      for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2; sp += '<i style="--x:' + Math.round(Math.cos(a) * 90) + 'px;--y:' + Math.round(Math.sin(a) * 90) + 'px;background:' + c + ';animation-delay:' + d + 's"></i>'; }
      o += '<span class="fwk" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + sp + '</span>';
    }
    w.innerHTML = o; document.body.appendChild(w); setTimeout(function () { w.remove(); }, 3600);
  }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#ff5ad1', '#3dd6ff', '#ffd23d', '#5dff9a', '#ff8a3d', '#b28bff', '#ffffff'];
    for (var i = 0; i < 70; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, tableau: tableau, banner: banner };
})();
