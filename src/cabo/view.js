/* ===== Cabo: schermata di gioco (file di carte, mazzo, scarti) e animazioni =====
   Le carte volano dal mazzo e dagli scarti alle file e si girano in 3D. Le carte che guardi (all'inizio, con
   Sbircia o Spia) si girano solo sul tuo telefono per qualche secondo e poi tornano coperte.
   Lo stato si disegna subito com'è; le animazioni partono dopo, nascondendo per un attimo le carte che «volano». */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var SHOW_MS = 3200;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }

  function sea() {
    var o = '';
    for (var k = 0; k < 22; k++) o += '<b class="st" style="left:' + ((k * 37) % 100) + '%;top:' + ((k * 23) % 55) + '%;animation-delay:-' + (k * .7).toFixed(1) + 's"></b>';
    return '<div class="sky" aria-hidden="true"><div class="moon"></div>' + o + '<svg class="beacon" viewBox="-50 -34 100 70">' + ART.lighthouse(0, 0, 1, true) + '</svg><div class="wv w1"></div><div class="wv w2"></div></div>';
  }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + sea() +
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
    el('gv').classList.toggle('last', g.caller != null && g.phase === 'play');
    setHTML('gv-info', '<b>Cabo</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Manche ' + g.round) + ' · fino a ' + g.opts.target + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-opp', opponents(g, mi));
    setHTML('gv-mid', middle(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', mainBoard(g, mi, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    applyHide();
  }

  /* ---------- file di carte ---------- */
  function shown(c) { var t = App.shown[c.id]; return t && t > Date.now(); }
  function canCell(g, p, i, me) {
    var P = g.players[p], c = P.line[i];
    if (p !== me || !c) return false;
    if (g.phase === 'peek') return P.looks < 2 && !P.know[c.id];
    if (g.phase !== 'play' || g.turn !== me) return false;
    if (g.power) return g.power.k === 'peek' && !c.up;
    return !!g.drawn || App.mode === 'take';
  }
  // una carta della fila: scoperta per tutti, mostrata solo a me per qualche secondo, o coperta (con l'occhio o il valore se la conosco)
  function cardHTML(g, p, i, o) {
    var c = g.players[p].line[i], viewer = myIdx(), V = viewer >= 0 ? g.players[viewer] : null;
    var mine = V && V.know[c.id] && !c.up, show = c.up || (mine && shown(c));
    var mark = '';
    if (!show && mine) mark = g.opts.memo === 'easy' ? '<i class="peek" title="La conosci">' + c.v + '</i>' : '<i class="peek eye" title="L’hai già vista">' + IC('eye') + '</i>';
    return ART.card(show ? c.v : null, show, { mini: o.mini, cls: show && !c.up ? 'secret' : '' }) + mark;
  }
  function boardHTML(g, p, o) {
    o = o || {};
    var P = g.players[p], me = o.me, h = '';
    P.line.forEach(function (c, i) {
      var can = o.big && canCell(g, p, i, me), sel = o.big && App.sel.indexOf(i) >= 0;
      var tag = o.big ? 'button' : 'span';
      h += '<' + tag + ' class="slot' + (can ? ' can' : '') + (sel ? ' sel' : '') + '" data-i="' + i + '"' + (o.big ? ' data-act="cell" aria-label="Carta ' + (i + 1) + (c.up ? ': ' + c.v : '') + '"' : '') + '>' +
        cardHTML(g, p, i, { mini: !o.big }) + '</' + tag + '>';
    });
    return '<div class="board line' + (o.big ? ' big' : '') + '" data-p="' + p + '" style="--n:' + Math.max(4, P.line.length) + '">' + h + '</div>';
  }
  function stats(g, p) {
    var P = g.players[p];
    return '<span class="sc-vis" title="Carte in fila">' + P.line.length + ' carte</span><span class="sc-tot" title="Totale della partita">Σ ' + P.total + '</span>';
  }
  function tags(g, p) {
    var P = g.players[p], o = '';
    if (g.caller === p && g.phase === 'play') o += '<span class="tag end">' + IC('bell') + ' Cabo!</span>';
    if (P.away) o += '<span class="tag away">assente</span>'; else if (P.bot && g.phase !== 'over') o += '<span class="tag bot">auto</span>';
    if (g.phase === 'peek' && P.looks < 2) o += '<span class="tag wait">guarda…</span>';
    if (g.phase === 'scores' && P.ready && !P.bot) o += '<span class="tag ok">pronto</span>';
    return o;
  }
  function opponents(g, mi) {
    return g.players.map(function (P, p) {
      if (p === mi) return '';
      var on = g.phase === 'play' && g.turn === p;
      return '<button class="opp' + (on ? ' on' : '') + '" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s">' + stats(g, p) + '</span>' + boardHTML(g, p, {}) + '<span class="opp-t">' + tags(g, p) + '</span></button>';
    }).join('');
  }
  function mainBoard(g, mi, me) {
    var P = g.players[mi], on = g.phase === 'play' && g.turn === mi;
    return '<div class="mine' + (on ? ' on' : '') + '" style="--pc:' + pcol(g, mi) + '"><div class="mine-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + (mi === me ? ' (tu)' : '') + '</b>' + tags(g, mi) + '<span class="mine-s">' + stats(g, mi) + '</span></div>' +
      boardHTML(g, mi, { big: true, me: me }) + '</div>';
  }

  /* ---------- centro: mazzo, carta pescata, scarti, Cabo ---------- */
  function canCabo(g, me) { return g.phase === 'play' && g.turn === me && !g.drawn && !g.power && g.caller == null && App.mode !== 'take'; }
  function middle(g, me) {
    var mine = g.phase === 'play' && g.turn === me, top = g.disc[g.disc.length - 1], under = g.disc[g.disc.length - 2];
    var deckCan = mine && !g.drawn && !g.power && App.mode !== 'take', discCan = mine && !g.power && (!g.drawn || g.drawn.from === 'deck');
    var stack = ''; for (var k = 0; k < Math.min(4, Math.ceil(g.deck.length / 12)); k++) stack += '<span class="stk" style="--k:' + k + '">' + ART.card(null, false) + '</span>';
    var deck = '<button class="pile deck' + (deckCan ? ' can' : '') + '" data-act="deck" aria-label="Mazzo, ' + g.deck.length + ' carte"' + (deckCan ? '' : ' aria-disabled="true"') + '>' + stack + '<span class="pl">Mazzo <i>' + g.deck.length + '</i></span></button>';
    var dv = g.drawn ? (mine ? g.drawn.v : null) : null;
    var hand = '<div class="hand' + (g.drawn ? ' full' : '') + '" id="hand"><span class="hslot">' + (g.drawn ? '<span class="hc-card">' + ART.card(dv, dv != null) + '</span>' : '<span class="hand-empty">' + (g.phase === 'play' ? (mine ? 'Pesca o prendi' : 'Tocca a ' + esc(g.players[g.turn].nick)) : '') + '</span>') + '</span><span class="pl">' + (g.drawn ? (mine ? 'La tua carta' : 'Pescata da ' + esc(g.players[g.turn].nick)) : 'In mano') + '</span></div>';
    var disc = '<button class="pile disc' + (discCan ? ' can' : '') + (App.mode === 'take' ? ' picked' : '') + '" data-act="disc" aria-label="Scarti' + (top ? ', in cima ' + top.v : '') + '"' + (discCan ? '' : ' aria-disabled="true"') + '>' +
      (under ? '<span class="under">' + ART.card(under.v, true) + '</span>' : '') + (top ? '<span class="dtop">' + ART.card(top.v, true) + '</span>' : '<span class="dempty"></span>') + '<span class="pl">' + (mine && g.drawn && g.drawn.from === 'deck' ? 'Scarta qui' : 'Scarti') + '</span></button>';
    var last = g.caller != null && g.phase === 'play' ? '<div class="lastbar">' + IC('bell') + ' Ultimo giro: ' + pname(g, g.caller) + ' ha chiamato Cabo</div>' : '';
    var cabo = canCabo(g, me) ? '<button class="cabobtn" data-act="cabo">' + IC('bell') + ' Cabo!</button>' : '';
    return last + '<div class="piles">' + deck + hand + disc + '</div>' + cabo;
  }

  /* ---------- cosa fare adesso ---------- */
  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Vincono ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'game'; }
    else if (g.phase === 'scores') { h = '<b>Manche ' + g.round + ' finita.</b> Guarda i punti e preparati alla prossima.'; btn = '<button class="btn small" data-act="showround">Punti</button>'; help = 'end'; }
    else if (g.phase === 'peek') {
      help = 'setup';
      if (P && P.looks < 2) h = '<b>Guarda ' + (2 - P.looks) + (P.looks ? ' altra carta' : ' delle tue carte') + '</b>: toccala e ricordatela!';
      else { var w = E.pending(g); h = 'Aspetto che ' + w.map(function (i) { return pname(g, i); }).join(', ') + ' ' + (w.length > 1 ? 'guardino' : 'guardi') + ' le loro carte…'; }
    } else if (g.turn === me && g.power) {
      help = 'cards';
      if (g.power.k === 'peek') { h = '<b>Sbircia</b>: tocca una tua carta coperta per guardarla.'; btn = '<button class="btn small ghost" data-act="pskip">Rinuncia</button>'; }
      else { h = g.power.k === 'spy' ? '<b>Spia</b>: scegli una carta di un altro giocatore da guardare.' : '<b>Scambia</b>: scegli una tua carta e una di un altro giocatore.'; btn = '<button class="btn small" data-act="popen">Scegli</button><button class="btn small ghost" data-act="pskip">Rinuncia</button>'; }
    } else if (g.turn === me) {
      var n = App.sel.length, swap = n ? '<button class="btn small" data-act="doswap">Scambia' + (n > 1 ? ' (' + n + ')' : '') + '</button>' : '';
      if (App.mode === 'take') { var tv = g.disc[g.disc.length - 1].v; h = n ? 'Metti il <b>' + tv + '</b> al posto ' + (n > 1 ? 'di queste ' + n + ' carte (devono essere uguali!)' : 'di questa carta') + '.' : 'Prendi il <b>' + tv + '</b>: tocca una o più carte della tua fila da sostituire.'; btn = swap + '<button class="btn small ghost" data-act="cancel">Annulla</button>'; help = 'multi'; }
      else if (g.drawn) { h = n ? 'Tieni il <b>' + g.drawn.v + '</b> al posto ' + (n > 1 ? 'di queste ' + n + ' carte (devono essere uguali!)' : 'di questa carta') + '.' : 'Hai pescato un <b>' + g.drawn.v + '</b>' + (E.power(g.drawn.v) ? ' (' + E.PNAME[E.power(g.drawn.v)] + ')' : '') + ': tocca le carte da sostituire, oppure scartalo.'; btn = swap + '<button class="btn small' + (n ? ' ghost' : '') + '" data-act="disc">Scarta</button>'; help = n > 1 ? 'multi' : 'turn'; }
      else h = '<b>Tocca a te' + (g.caller != null ? ' — ultimo turno!' : '!') + '</b> Pesca dal <b>mazzo</b> o prendi il <b>' + (g.disc.length ? g.disc[g.disc.length - 1].v : '') + '</b> dagli scarti' + (g.caller == null ? ', oppure chiama <b>Cabo</b>.' : '.');
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else {
      var T = g.players[g.turn];
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + (g.power ? ': usa il potere <b>' + E.PNAME[g.power.k] + '</b>…' : g.drawn ? ': ha pescato e ci pensa…' : ': sta scegliendo…');
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- carte nascoste durante le animazioni ---------- */
  function cellEl(p, i) { return document.querySelector('.board[data-p="' + p + '"] .slot[data-i="' + i + '"]'); }
  function applyHide() {
    document.querySelectorAll('.flyhide,.predown').forEach(function (n) { n.classList.remove('flyhide', 'predown'); });
    Object.keys(App.hide).forEach(function (k) {
      var h = App.hide[k], parts = k.split(':'), n = null;
      if (parts[0] === 'c') n = cellEl(parts[1], parts[2]); else if (parts[0] === 'disc') n = document.querySelector('.pile.disc .dtop'); else if (parts[0] === 'hand') n = document.querySelector('#hand .hc-card');
      if (n && h.n > 0) n.classList.add(h.m === 'down' ? 'predown' : 'flyhide');
    });
  }
  function hide(k, m) { var h = App.hide[k] || (App.hide[k] = { n: 0, m: m }); h.n++; h.m = m; }
  function unhide(k) { var h = App.hide[k]; if (!h) return; if (--h.n <= 0) delete App.hide[k]; applyHide(); }

  /* ---------- volo di una carta ---------- */
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
    ], { duration: o.dur || 520, easing: 'cubic-bezier(.3,.7,.3,1)', delay: o.delay || 0, fill: 'both' }).then(function () { f.remove(); return f; });
  }
  function burst(r, cols) {
    if (!r || reduce) return;
    var b = document.createElement('div'); b.className = 'burst'; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = (r.top + r.height / 2) + 'px';
    var o = ''; for (var i = 0; i < 14; i++) { var a = i / 14 * Math.PI * 2, d = 40 + (i % 3) * 18; o += '<i style="--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d) + 'px;background:' + (cols || ['#fff6c8', '#ffd75e', '#8fe3ff'])[i % 3] + '"></i>'; }
    b.innerHTML = o; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1600);
  }
  function flipIn(n) { if (!n) return; var c = n.querySelector('.skc'); if (!c) return; c.classList.remove('flipin'); void c.offsetWidth; c.classList.add('flipin'); setTimeout(function () { c.classList.remove('flipin'); }, 700); }
  function oppEl(p) { return p === myIdx() ? document.querySelector('.mine') : document.querySelector('.opp[data-p="' + p + '"]'); }

  /* ---------- coda degli effetti ---------- */
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  // mostra a me una carta per qualche secondo, poi la rigira
  function showMe(id) {
    App.shown[id] = Date.now() + SHOW_MS;
    setTimeout(function () { if (App.shown[id] && App.shown[id] <= Date.now() + 50) { delete App.shown[id]; if (G() && App.screen === 'table') render(); } }, SHOW_MS + 60);
  }

  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (Q.length > 6 || news.length > 12) { Q = []; App.hide = {}; applyHide(); news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over'; }); }
    news.forEach(function (e) { plan(g, me, e); });
    applyHide();
  }
  function plan(g, me, e) {
    var k;
    switch (e.k) {
      case 'deal': {
        g.players.forEach(function (P, p) { P.line.forEach(function (c, i) { hide('c:' + p + ':' + i, 'ghost'); }); });
        enqueue(function () {
          Sound.play('deal');
          var deck = cardRect(document.querySelector('.pile.deck .stk')), jobs = [];
          G().players.forEach(function (P, p) { P.line.forEach(function (c, i) {
            var cel = cellEl(p, i), big = cel && cel.closest('.board.big'), delay = big ? i * 90 : 200 + i * 40 + p * 30;
            jobs.push(fly(ART.card(null, false), deck, cardRect(cel), { delay: delay, dur: big ? 460 : 380, arc: -20 }).then(function () { unhide('c:' + p + ':' + i); }));
          }); });
          return Promise.all(jobs);
        });
        break;
      }
      case 'see': {
        var cur = g.players[e.t] && g.players[e.t].line[e.i];
        if (e.p === me && cur) {
          enqueue(function () { showMe(cur.id); render(); flipIn(cellEl(e.t, e.i)); Sound.play('flip', { v: e.v }); if (e.why === 'spy') { var pp = e.t; floatTxt(rectOf(oppEl(pp)), IC('spy') + ' ' + e.v, 'good'); } return sleep(250); });
        } else enqueue(function () { Sound.play('pick'); floatTxt(cardRect(cellEl(e.t, e.i)), IC('eye'), ''); return sleep(200); });
        break;
      }
      case 'draw': {
        hide('hand', 'ghost');
        enqueue(function () {
          Sound.play('draw');
          var from = cardRect(document.querySelector('.pile.deck .stk:last-child') || document.querySelector('.pile.deck')), to = rectOf(document.querySelector('#hand .hslot'));
          var v = e.p === me && G().drawn ? G().drawn.v : null;
          return fly(ART.card(v, v != null, { cls: v != null ? 'flipin' : '' }), from, to, { dur: 560, arc: -40 }).then(function () { unhide('hand'); });
        });
        break;
      }
      case 'swap': {
        k = 'c:' + e.p + ':' + e.at; hide(k, 'ghost'); hide('disc', 'ghost');
        enqueue(function () {
          var to = cardRect(cellEl(e.p, e.at)), dtop = cardRect(document.querySelector('.pile.disc .dtop') || document.querySelector('.pile.disc'));
          var src = e.from === 'disc' ? dtop : rectOf(document.querySelector('#hand .hslot'));
          var showV = e.up || e.p === me;
          Sound.play('place');
          var a = fly(ART.card(showV ? e.v : null, showV), src, to, { dur: 520 }).then(function () { unhide(k); });
          var b = Promise.all(e.old.map(function (o, j) { return fly(ART.card(o.v, true, { cls: o.up ? '' : 'flipin' }), to, dtop, { dur: 620, delay: 140 + j * 140, arc: -30 }); })).then(function () { unhide('disc'); });
          if (e.old.length > 1) floatTxt(to, e.old.length + ' carte da ' + e.old[0].v + '!', 'col');
          return Promise.all([a, b]);
        });
        break;
      }
      case 'miss':
        e.cells.forEach(function (i) { hide('c:' + e.p + ':' + i, 'down'); });
        enqueue(function () {
          Sound.play('no');
          e.cells.forEach(function (i, j) { setTimeout(function () { unhide('c:' + e.p + ':' + i); flipIn(cellEl(e.p, i)); }, j * 120); });
          floatTxt(rectOf(document.querySelector('.board[data-p="' + e.p + '"]')), 'Non sono uguali!' + (e.extra ? ' +1 carta' : ''), 'bad');
          return sleep(900);
        });
        break;
      case 'drop': {
        hide('disc', 'ghost');
        enqueue(function () {
          Sound.play('drop');
          var src = rectOf(document.querySelector('#hand .hslot')), dtop = cardRect(document.querySelector('.pile.disc .dtop'));
          return fly(ART.card(e.v, true), src, dtop, { dur: 420, arc: -20 }).then(function () { unhide('disc'); if (e.pw) floatTxt(dtop, ART.picon(e.pw) + ' ' + E.PNAME[e.pw], 'col'); });
        });
        break;
      }
      case 'trade': {
        var ka = 'c:' + e.p + ':' + e.i, kb = 'c:' + e.t + ':' + e.j; hide(ka, 'ghost'); hide(kb, 'ghost');
        enqueue(function () {
          Sound.play('place');
          var ra = cardRect(cellEl(e.p, e.i)), rb = cardRect(cellEl(e.t, e.j));
          floatTxt(rb, IC('trade'), 'col');
          return Promise.all([fly(ART.card(null, false), rb, ra, { dur: 700 }).then(function () { unhide(ka); }), fly(ART.card(null, false), ra, rb, { dur: 700, delay: 80 }).then(function () { unhide(kb); })]);
        });
        break;
      }
      case 'cabo':
        enqueue(function () { Sound.play('ender'); banner(e.p === me ? 'Hai chiamato CABO!' : esc(g.players[e.p].nick) + ' chiama CABO!', 'Ultimo giro per gli altri'); burst(rectOf(oppEl(e.p)), ['#ffd75e', '#fff', '#8fe3ff']); return sleep(1400); });
        break;
      case 'turn':
        if (e.p === me) enqueue(function () { Sound.play('turn'); if (e.last) banner('Ultimo turno!', 'poi si contano i punti'); else pulse(); return sleep(e.last ? 900 : 100); });
        break;
      case 'reveal': {
        e.cells.forEach(function (c) { hide('c:' + c.p + ':' + c.i, 'down'); });
        enqueue(function () {
          return Promise.all(e.cells.map(function (c, j) { return sleep(120 + j * 80).then(function () { unhide('c:' + c.p + ':' + c.i); flipIn(cellEl(c.p, c.i)); if (j % 3 === 0) Sound.play('flip', {}); }); })).then(function () { return sleep(600); });
        });
        break;
      }
      case 'roundEnd':
        enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); var r = G() && G().roundRes; if (r && (r.kami >= 0 || r.callerOk === false)) setTimeout(function () { Sound.play('double'); }, 900); return sleep(200); });
        break;
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
  return { render: render, unmount: unmount, fx: fx, idle: idle, boardHTML: boardHTML, banner: banner, cardHTML: cardHTML };
})();
