/* ===== Unlock!: schermata di gioco (tavolo, carta in grande, unioni, timer, animazioni) ===== */
var Game = (function () {
  var mountedFor = null, thumbs = {}, viewSig = '', viewCard = null, pings = {}, opened = {}, warned = {}, lastSec = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sid() { return G().scen; }
  function fmt(ms) { var neg = ms < 0, s = neg ? Math.floor(-ms / 1000) : Math.ceil(ms / 1000), m = Math.floor(s / 60); return (neg ? '+' : '') + (m < 10 ? '0' : '') + m + ':' + ('0' + s % 60).slice(-2); }
  function mmss(sec) { var m = Math.floor(sec / 60); return m + ':' + ('0' + Math.round(sec % 60)).slice(-2); }
  function card(id) { return E.card(G(), id); }
  function order(g) {
    var t = E.table(g), rank = function (id) { return id === 'start' ? -2 : /^[A-Z]$/.test(id) ? -1 : 0; };
    return t.sort(function (a, b) { return rank(a) - rank(b) || (rank(a) === -1 ? a.localeCompare(b) : +a - +b); });
  }
  function thumb(id) { var k = sid() + ':' + id; return thumbs[k] || (thumbs[k] = ART.card(sid(), id, { text: false, cls: 'thumb' })); }
  function ambient(th) {
    var o = '', i;
    for (i = 0; i < 16; i++) o += '<i style="left:' + Math.round(Math.random() * 100) + '%;animation-delay:-' + (Math.random() * 14).toFixed(1) + 's;animation-duration:' + (9 + Math.random() * 10).toFixed(1) + 's;--s:' + (.5 + Math.random()).toFixed(2) + '"></i>';
    return '<div class="amb amb-' + th + '" aria-hidden="true">' + o + '</div>';
  }
  function mount() {
    var th = SCN.get(sid()).theme;
    $('#app').innerHTML = '<div class="gv th-' + th + '" id="gv">' + ambient(th) +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">?<span class="hide-s"> Regole</span></button></header>' +
      '<div class="hud" id="hud"></div>' + Chat.dockHTML() +
      '<main class="gv-table" id="gv-table"></main><footer class="gv-bar" id="gv-bar"></footer><div id="viewer"></div></div>';
    mountedFor = App.code + ':' + sid(); viewCard = null; viewSig = '';
  }
  function unmount() { mountedFor = null; viewCard = null; }
  function render() {
    var g = G(); if (!g) return;
    if (mountedFor !== App.code + ':' + sid() || !el('gv')) mount();
    var me = myIdx(), S = SCN.get(g.scen);
    setHTML('gv-info', '<b>Unlock!</b> <span class="muted">· ' + connInfo(esc(S.name) + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('hud', hud(g, me));
    setHTML('gv-table', table(g, me));
    setHTML('gv-bar', bar(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    renderView();
    tick();
  }

  /* ---------- in alto: tempo, squadra, indizi, pausa ---------- */
  function hud(g, me) {
    var looks = {}; Object.keys(g.look || {}).forEach(function (p) { if (g.look[p]) looks[p] = g.look[p]; });
    var team = g.players.map(function (P, p) {
      var l = looks[p];
      return '<span class="tm' + (p === me ? ' me' : '') + '" style="--pc:' + PCOL[P.col % PCOL.length] + '" title="' + esc(P.nick) + '"><b class="av">' + esc(P.nick.charAt(0).toUpperCase()) + '</b>' + Net.dot(P.uid) + (l ? '<em>' + esc(l === 'start' ? '▶' : l) + '</em>' : '') + '</span>';
    }).join('');
    return '<div class="timer" id="timer"><span class="t-ic">' + IC('clock') + '</span><b id="tdig">--:--</b>' + (g.paused ? '<span class="t-p">IN PAUSA</span>' : '') + '</div>' +
      '<div class="hud-pen' + (g.pen ? '' : ' zero') + '" title="Penalità">−' + mmss(g.pen) + '</div>' +
      '<div class="team">' + team + '</div>' +
      '<button class="hbtn" data-act="hints" aria-label="Indizi usati">' + IC('hint') + '<b>' + g.hintN + '</b></button>' +
      (g.phase === 'play' && me >= 0 ? '<button class="hbtn" data-act="pause" aria-label="' + (g.paused ? 'Riprendi' : 'Pausa') + '">' + IC(g.paused ? 'play' : 'pause') + '</button>' : '');
  }
  function tick() {
    var g = G(), d = el('tdig'), t = el('timer'); if (!g || !d) return;
    var now = g.phase === 'over' ? null : Clock.now(), rem = g.phase === 'over' ? g.limit * 1000 - g.endEl - g.pen * 1000 : E.remaining(g, now), txt = fmt(rem);
    if (d.textContent !== txt) d.textContent = txt;
    t.className = 'timer' + (g.paused ? ' paused' : '') + (rem < 0 ? ' over' : rem < 60e3 ? ' crit' : rem < 5 * 60e3 ? ' low' : rem < 10 * 60e3 ? ' warn' : '');
    if (g.phase !== 'play' || g.paused) return;
    var sec = Math.ceil(rem / 1000);
    if (sec !== lastSec) {
      lastSec = sec;
      if (sec > 0 && sec <= 60) Sound.play(sec <= 10 ? 'beat' : 'tick');
      var key = App.code + (App.doc.gid || '');
      [[600, 'Mancano 10 minuti!'], [300, 'Mancano 5 minuti!'], [60, 'Ultimo minuto!'], [0, 'Tempo scaduto! Continuate: si può ancora uscire.']].forEach(function (w) {
        if (g.limit > w[0] && sec <= w[0] && sec > w[0] - 3 && !warned[key + w[0]]) { warned[key + w[0]] = 1; banner(w[1], w[0] ? 'warn' : 'bad'); Sound.play('beat'); }
        if (sec <= w[0] - 3) warned[key + w[0]] = 1;
      });
    }
  }
  setInterval(function () { if (App.screen === 'table' && G()) tick(); }, 250);

  /* ---------- il tavolo ---------- */
  function looksOn(g, id, me) { var o = []; Object.keys(g.look || {}).forEach(function (p) { if (g.look[p] === id && +p !== me && g.players[p]) o.push(+p); }); return o; }
  function table(g, me) {
    var ids = order(g), sel = App.sel, now = Date.now();
    var tiles = ids.map(function (id, k) {
      var c = card(id), cls = '', lk = looksOn(g, id, me);
      if (sel) { if (sel.r === id || sel.b === id) cls += ' picked'; else if (c.k !== 'red' && c.k !== 'blue' && !c.mod) cls += ' dim'; }
      if (pings[id] && pings[id].until > now) cls += ' pinged';
      var isNew = id !== 'start' && !opened[App.code + ':' + id] && g.phase === 'play';
      return '<button class="tc' + cls + '" data-act="open" data-id="' + id + '" aria-label="Carta ' + id + ': ' + esc(c.t) + '"' + (pings[id] ? ' style="--pc:' + PCOL[pings[id].p % PCOL.length] + '"' : '') + '>' + thumb(id) +
        (isNew ? '<span class="tc-new">NUOVA</span>' : '') + (sel && sel.r === id ? '<span class="tc-sel r">1</span>' : sel && sel.b === id ? '<span class="tc-sel b">2</span>' : '') +
        (lk.length ? '<span class="tc-look">' + lk.map(function (p) { return '<i style="--pc:' + PCOL[g.players[p].col % PCOL.length] + '">' + esc(g.players[p].nick.charAt(0).toUpperCase()) + '</i>'; }).join('') + '</span>' : '') + '</button>';
    }).join('');
    var gone = E.gone(g).length;
    return '<div class="tgrid">' + tiles + '</div>' + (gone ? '<button class="gone-link" data-act="gone">' + IC('trash') + ' Carte scartate: ' + gone + '</button>' : '');
  }

  /* ---------- in basso: azioni ---------- */
  function slot(g, which) {
    var v = App.sel[which];
    if (!v) return '<span class="slot ' + which + '"><i>' + (which === 'r' ? 'rossa' : 'blu') + '</i></span>';
    if (v.charAt(0) === '+') return '<button class="slot full mod" data-act="slotx" data-w="b"><b>' + v + '</b></button>';
    return '<button class="slot full ' + which + '" data-act="slotx" data-w="' + which + '"><b>' + v + '</b><span>' + esc(card(v).t) + '</span></button>';
  }
  function bar(g, me) {
    if (g.phase === 'over') return '<button class="ab pri" data-act="showover">' + IC('star') + '<span>Risultato</span></button><button class="ab" data-act="log">' + IC('log') + '<span>Racconto</span></button>';
    if (me < 0) return '<p class="muted spect">Stai guardando la partita.</p>';
    if (App.sel) {
      var mods = E.mods(g), ok = App.sel.r && App.sel.b;
      return '<div class="comb"><div class="comb-row">' + slot(g, 'r') + '<span class="op">+</span>' + slot(g, 'b') + '<span class="op">=</span><span class="slot res">' + (ok ? '<b>' + (+App.sel.r + +String(App.sel.b).replace('+', '')) + '</b>' : '<i>?</i>') + '</span></div>' +
        (mods.length ? '<div class="comb-mods">Modificatori: ' + mods.map(function (m) { return '<button class="modchip' + (App.sel.b === '+' + m.v ? ' on' : '') + '" data-act="modsel" data-v="+' + m.v + '">+' + m.v + '</button>'; }).join('') + '</div>' : '') +
        '<div class="comb-acts"><button class="ab" data-act="combx">' + IC('x') + '<span>Annulla</span></button><button class="ab pri' + (ok ? '' : ' off') + '" data-act="combgo"' + (ok ? '' : ' aria-disabled="true"') + '>' + IC('combine') + '<span>Unisci!</span></button></div>' +
        '<p class="comb-tip">' + (ok ? 'Una unione che non porta a nulla costa 1 minuto.' : 'Tocca una carta <b class="cr">rossa</b> e una <b class="cb">blu</b> sul tavolo.') + '</p></div>';
    }
    return '<button class="ab pri" data-act="comb">' + IC('combine') + '<span>Unisci</span></button><button class="ab" data-act="gone">' + IC('trash') + '<span>Scartate</span></button><button class="ab" data-act="log">' + IC('log') + '<span>Racconto</span></button>';
  }

  /* ---------- la carta in grande ---------- */
  function openView(id) {
    var g = G(); if (!g || (!E.onTable(g, id) && g.st[id] !== 'gone')) return;
    App.view = id; opened[App.code + ':' + id] = 1; Sound.play('peek');
    if (myIdx() >= 0 && g.phase === 'play' && E.onTable(g, id)) quiet({ a: 'look', id: id });
    render();
  }
  function closeView() {
    if (!App.view) return; App.view = null; viewCard = null; viewSig = '';
    var g = G(); if (g && myIdx() >= 0 && g.phase === 'play') quiet({ a: 'look', id: null });
    var v = el('viewer'); if (v) { v.innerHTML = ''; v._h = null; }
    render();
  }
  function viewList(g, id) { return g.st[id] === 'gone' ? E.gone(g) : order(g); }
  function renderView() {
    var v = el('viewer'), g = G(), id = App.view; if (!v) return;
    if (!id || !g || (!E.onTable(g, id) && g.st[id] !== 'gone')) { if (v.innerHTML) { v.innerHTML = ''; viewCard = null; } if (id) App.view = null; return; }
    if (viewCard !== id) {
      var list = viewList(g, id), k = list.indexOf(id);
      v.innerHTML = '<div class="vw-back" data-act="vwback"><div class="vw" role="dialog" aria-modal="true" aria-label="Carta ' + id + '">' +
        '<div class="vw-top"><button class="iconbtn" data-act="vwprev" aria-label="Carta precedente"' + (list.length > 1 ? '' : ' disabled') + '>‹</button><span class="vw-n">' + (g.st[id] === 'gone' ? 'scartata · ' : '') + (k + 1) + ' / ' + list.length + '</span><button class="iconbtn" data-act="vwnext" aria-label="Carta successiva"' + (list.length > 1 ? '' : ' disabled') + '>›</button><button class="iconbtn vw-x" data-act="vwclose" aria-label="Chiudi">' + IC('x') + '</button></div>' +
        '<div class="vw-card" id="vw-card">' + ART.card(sid(), id, { spots: g.st[id] !== 'gone', cls: 'big' }) + '</div><div class="vw-panel" id="vw-panel"></div></div></div>';
      viewCard = id; viewSig = '';
    }
    var c = card(id);
    document.querySelectorAll('#vw-card .uc-spot').forEach(function (s) { s.classList.toggle('done', E.seen(g, s.getAttribute('data-id'))); });
    var sig = JSON.stringify([id, g.st, g.hints[id], g.look, g.phase, App.hintAsk, me()]);
    if (sig === viewSig) return; viewSig = sig;
    var p = el('vw-panel'); if (p) p.innerHTML = panel(g, id, c);
  }
  function me() { return myIdx(); }
  function panel(g, id, c) {
    var mine = me() >= 0 && g.phase === 'play', gone = g.st[id] === 'gone', h = '';
    if (gone) h += '<p class="vw-note">Questa carta è stata scartata: non serve più.</p>';
    var refs = (c.refs || []).concat((c.hid || []).filter(function (r) { return E.seen(g, r); }));
    if (refs.length && !gone) h += '<div class="vw-refs"><span class="lbl">Numeri su questa carta</span>' + refs.map(function (r) {
      var st = g.st[r], hidden = (c.hid || []).indexOf(r) >= 0;
      return '<button class="ref' + (st ? ' ' + st : '') + '" data-act="ref" data-id="' + r + '"><b>' + r + '</b><span>' + (st === 'table' ? esc(card(r).t) : st === 'gone' ? 'scartata' : hidden ? 'trovata!' : 'scopri') + '</span></button>';
    }).join('') + '</div>';
    if (mine && !gone) {
      var a = '';
      if (c.k === 'red') a += '<button class="btn" data-act="comb" data-id="' + id + '">' + IC('combine') + ' Unisci con una blu</button>';
      if (c.k === 'blue') a += '<button class="btn" data-act="comb" data-id="' + id + '">' + IC('combine') + ' Unisci con una rossa</button>';
      if (c.mod) a += '<button class="btn blue" data-act="comb" data-mod="+' + c.mod + '">' + IC('combine') + ' Usa il +' + c.mod + '</button>';
      if (c.mac && !E.seen(g, c.mac.to)) a += '<button class="btn green" data-act="mac" data-id="' + id + '">' + IC('gear') + ' Usa la macchina</button>';
      if (c.code && !E.seen(g, c.code.to)) a += '<button class="btn yellow" data-act="code" data-id="' + id + '">' + IC('key') + ' Inserisci il codice</button>';
      a += '<button class="btn ghost small" data-act="ping" data-id="' + id + '">' + IC('ping') + ' Segnala agli altri</button>';
      h += '<div class="vw-acts">' + a + '</div>';
    }
    if (c.h && !gone) {
      var lv = g.hints[id] || 0;
      h += '<div class="vw-hints">' + (lv >= 1 ? '<div class="hint h1"><b>' + IC('hint') + ' Indizio</b>' + c.h[0] + '</div>' : '') + (lv >= 2 ? '<div class="hint h2"><b>' + IC('key') + ' Soluzione</b>' + c.h[1] + '</div>' : '') +
        (mine && lv < 2 ? (App.hintAsk === id + ':' + (lv + 1) ? '<button class="btn small yellow" data-act="hint" data-id="' + id + '" data-l="' + (lv + 1) + '">Sicuro? ' + (lv ? 'Mostra la soluzione' : 'Mostra l’indizio') + ' (toglie stelle)</button>' : '<button class="btn ghost small" data-act="hintask" data-id="' + id + '" data-l="' + (lv + 1) + '">' + IC('hint') + (lv ? ' Mostra la soluzione' : ' Chiedi un indizio') + '</button>') : '') + '</div>';
    }
    var lk = looksOn(g, id, me());
    if (lk.length) h += '<p class="vw-look">' + lk.map(function (q) { return pname(g, q); }).join(', ') + (lk.length > 1 ? ' stanno' : ' sta') + ' guardando questa carta.</p>';
    return h;
  }
  function step(d) { var g = G(), list = viewList(g, App.view), k = list.indexOf(App.view); if (k < 0) return; var n = list[(k + d + list.length) % list.length]; if (n !== App.view) { App.view = n; opened[App.code + ':' + n] = 1; if (me() >= 0 && E.onTable(g, n)) quiet({ a: 'look', id: n }); Sound.play('peek'); renderView(); } }

  /* ---------- unioni ---------- */
  function startComb(id, mod) {
    var g = G(); App.sel = { r: null, b: null };
    if (id) { var c = card(id); if (c.k === 'red') App.sel.r = id; else if (c.k === 'blue') App.sel.b = id; }
    if (mod) App.sel.b = mod;
    if (App.view) { App.view = null; viewCard = null; var v = el('viewer'); if (v) v.innerHTML = ''; if (me() >= 0) quiet({ a: 'look', id: null }); }
    render();
  }
  function pick(id) {
    var c = card(id);
    if (c.k === 'red') App.sel.r = App.sel.r === id ? null : id;
    else if (c.k === 'blue') App.sel.b = App.sel.b === id ? null : id;
    else { toast('Si uniscono solo una carta <b>rossa</b> e una <b>blu</b>.'); Sound.play('error'); return; }
    Sound.play('peek'); render();
  }
  function combGo() {
    if (!App.sel || !App.sel.r || !App.sel.b) { toast('Scegli una carta rossa e una blu.'); return; }
    App.lastComb = { r: App.sel.r, b: App.sel.b }; act({ a: 'combine', r: App.sel.r, b: App.sel.b }); App.sel = null; render();
  }

  /* ---------- effetti in arrivo: animazioni e suoni per tutti ---------- */
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false; f(function () { if (done) return; done = true; nextQ(); }); }
  function overlay(cls, html, ms, done, after) {
    var o = document.createElement('div'); o.className = 'ov ' + cls; o.innerHTML = html; document.body.appendChild(o);
    var t, end = function () { clearTimeout(t); if (!o.parentNode) return; o.classList.add('out'); setTimeout(function () { o.remove(); }, 260); if (after) after(); done(); };
    t = setTimeout(end, ms); o.addEventListener('click', end);
  }
  function floatPen(s) {
    var t = el('timer'); if (!t) return; var r = t.getBoundingClientRect(), f = document.createElement('div');
    f.className = 'penfloat'; f.textContent = '−' + mmss(s); f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.bottom) + 'px'; document.body.appendChild(f);
    setTimeout(function () { f.remove(); }, 1800);
    var gv = el('gv'); if (gv) { gv.classList.remove('hit'); void gv.offsetWidth; gv.classList.add('hit'); }
  }
  function mini(g, id, txt) {
    var m = document.createElement('button'); m.className = 'mini'; m.setAttribute('data-act', 'open'); m.setAttribute('data-id', id);
    m.innerHTML = '<span class="mini-c">' + thumb(id) + '</span><span class="mini-t">' + txt + '</span>';
    var box = el('minis') || (function () { var b = document.createElement('div'); b.id = 'minis'; document.body.appendChild(b); return b; })();
    box.appendChild(m); setTimeout(function () { m.classList.add('out'); setTimeout(function () { m.remove(); }, 400); }, 3200);
  }
  function revealAnim(g, e, mine) {
    var id = e.id, c = E.card(g, id);
    enqueue(function (done) {
      overlay('ov-rev k-' + c.k, '<div class="rv-burst"></div><div class="rv-flip"><div class="rv-face rv-b">' + ART.back(g.scen) + '</div><div class="rv-face rv-f">' + ART.card(g.scen, id, {}) + '</div></div>' +
        '<div class="rv-cap">' + (c.k === 'room' ? 'Nuova stanza!' : c.k === 'end' ? 'Ce l’avete fatta!' : 'Nuova carta!') + '<small>tocca per continuare</small></div>', c.k === 'end' ? 2600 : Q.length ? 1000 : 1900, done,
        function () { if (mine && c.k !== 'end' && c.k !== 'pen' && G() && E.onTable(G(), id)) openView(id); });
    });
  }
  function fx(g, mine) {
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    var meI = mine;
    news.forEach(function (e) {
      var by = e.p === meI, who = e.p >= 0 ? pname(g, e.p) : '';
      switch (e.k) {
        case 'reveal': {
          var c = E.card(g, e.id);
          Sound.play('reveal');
          if (c.k === 'end') { revealAnim(g, e, by); enqueue(function (done) { App.sheet = { kind: 'over' }; renderSheet(); done(); }); break; }
          if (by) revealAnim(g, e, true); else if (e.id !== 'start') mini(g, e.id, who + ' ha scoperto <b>' + esc(e.id) + '</b> · ' + esc(c.t));
          if (e.out && e.out.length && by) setTimeout(function () { toast('Scartate: ' + e.out.join(', '), '', 2600); }, 400);
          break;
        }
        case 'combo': {
          Sound.play('combo');
          if (by) enqueue(function (done) {
            var b = e.b.charAt(0) === '+' ? '<span class="cb-mod">' + e.b + '</span>' : '<span class="cb-c">' + thumb(e.b) + '</span>';
            overlay('ov-comb', '<div class="cb-row"><span class="cb-c l">' + thumb(e.r) + '</span><span class="cb-plus">+</span>' + b.replace('cb-c', 'cb-c r') + '</div><div class="cb-eq">' + e.r + ' + ' + e.b.replace('+', '') + ' = <b>' + e.to + '</b></div>', 1100, done);
          });
          break;
        }
        case 'miss': Sound.play('miss'); floatPen(e.s); toast((by ? 'Non succede niente' : who + ' ha provato a unire <b>' + e.r + '</b> e <b>' + e.b + '</b>: niente') + ' (−1 min).', 'bad'); if (by) { var bb = el('gv-bar'); if (bb) { bb.classList.remove('shake'); void bb.offsetWidth; bb.classList.add('shake'); } } break;
        case 'unlock':
          Sound.play('unlock');
          if (by) { App.sheet = null; renderSheet(); enqueue(function (done) { overlay('ov-lock', lockSVG() + '<div class="rv-cap">Aperto!</div>', 900, done); }); }
          else mini(g, e.id, who + ' ha aperto il lucchetto <b>' + esc(e.id) + '</b>!');
          break;
        case 'wrong': Sound.play('wrong'); floatPen(e.s); if (by && App.sheet && App.sheet.kind === 'code') { App.sheet.err = Date.now(); App.codeIn = ''; renderSheet(); } else toast(who + ' ha provato un codice sbagliato su <b>' + e.id + '</b> (−2 min).', 'bad'); break;
        case 'mac':
          Sound.play('mac');
          if (by && App.sheet && App.sheet.kind === 'mac') { App.sheet.ok = true; renderSheet(); enqueue(function (done) { setTimeout(function () { if (App.sheet && App.sheet.kind === 'mac') { App.sheet = null; renderSheet(); } done(); }, 900); }); }
          else if (!by) mini(g, e.id, who + ' ha fatto funzionare <b>' + esc(E.card(g, e.id).t) + '</b>!');
          break;
        case 'macno': Sound.play('macno'); floatPen(e.s); if (by && App.sheet && App.sheet.kind === 'mac') { App.sheet.err = Date.now(); renderSheet(); } else toast(who + ' ha provato la macchina <b>' + e.id + '</b>: niente (−1 min).', 'bad'); break;
        case 'pen': {
          Sound.play('pen'); floatPen(e.m * 60);
          enqueue(function (done) { overlay('ov-pen', '<div class="pen-flash"></div><div class="pen-card">' + ART.card(g.scen, e.id, {}) + '</div><div class="pen-big">−' + e.m + ':00</div>', 2800, done); });
          break;
        }
        case 'hint': Sound.play('hint'); if (!by) toast(who + (e.lvl === 2 ? ' ha guardato la soluzione per ' : ' ha chiesto un indizio per ') + '<b>' + esc(e.id) + '</b>.'); break;
        case 'pause': Sound.play('pause'); toast(who + (e.on ? ' ha messo in pausa il tempo.' : ' ha fatto ripartire il tempo.')); break;
        case 'ping':
          if (!by) { Sound.play('ping'); pings[e.id] = { p: g.players[e.p].col, until: Date.now() + 6000 }; mini(g, e.id, who + ': «Guardate la carta <b>' + esc(e.id) + '</b>!»'); setTimeout(function () { if (App.screen === 'table') render(); }, 6100); }
          else toast('Hai segnalato la carta ' + esc(e.id) + ' agli altri.');
          break;
        case 'win': Sound.play('win'); lsSet('ul-done-' + g.scen, '1'); break;
      }
    });
  }
  function lockSVG() {
    return '<svg class="lock" viewBox="0 0 120 150" aria-hidden="true"><path class="shackle" d="M30 70V45a30 30 0 0 1 60 0v25" fill="none" stroke="#d7dde0" stroke-width="12" stroke-linecap="round"/><rect x="14" y="66" width="92" height="74" rx="12" fill="url(#u-brass)" stroke="#6b4a10" stroke-width="3"/><circle cx="60" cy="98" r="9" fill="#3a2808"/><rect x="56" y="100" width="8" height="20" rx="3" fill="#3a2808"/></svg>';
  }
  function banner(t, cls) { var b = document.createElement('div'); b.className = 'banner ' + (cls || ''); b.innerHTML = '<span>' + t + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2300); }

  return { idle: function () { return !qBusy && !Q.length; }, render: render, unmount: unmount, openView: openView, closeView: closeView, renderView: renderView, step: step, startComb: startComb, pick: pick, combGo: combGo, fx: fx, tick: tick, fmt: fmt, mmss: mmss, banner: banner, thumb: thumb, order: order, opened: opened };
})();
