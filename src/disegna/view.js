/* ===== Disegna e indovina: schermata di gioco =====
   La lavagna: chi disegna traccia con il dito e ogni pezzetto di tratto parte subito agli altri sul canale
   «in diretta» (Net.sendLive); ogni tanto manda anche il disegno intero all'host, che lo tiene nel documento
   per chi arriva dopo o ha perso un pezzo. La «versione» del disegno cresce quando si annulla o si cancella:
   così un pezzo vecchio arrivato in ritardo non fa ricomparire un tratto tolto.
   Sotto la lavagna: le risposte scritte e la casella per indovinare.
   Nella staffetta la penna passa da un telefono all'altro: chi la riceve riparte dal disegno che stava
   guardando. Nel telefono senza fili ognuno disegna sul suo telefono senza diretta e consegna il disegno. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches, lastTick = null;
  var COLORS = ['#1d2333', '#e0402c', '#3d8bfd', '#2fb36d', '#f2b705', '#8a5a22', '#ef7aa8', '#9a5cf0'], SIZES = [4, 9, 18];
  // il disegno visto da qui: per chi disegna è il suo (mine), per gli altri quello ricomposto (view)
  var mine = { t: 0, v: 0, s: [], who: null }, view = { t: 0, v: 0, s: [] }, unpacked = { k: null, s: [] }, cur = null, sentLen = 0, dirty = false, picT = null, lastPic = 0, cv = null, ctx = null, rafOn = false;
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
  function drawing(g, me) {
    if (me < 0 || !g) return false;
    if (g.phase === 'chain') { var tk = E.chainTask(g, me); return !!tk && tk.kind === 'draw' && !tk.done; }
    return g.drawer === me && (g.phase === 'draw' || g.phase === 'steal');
  }
  var INK = '#1d2333';
  function chainPic(key, packed) { if (unpacked.k !== key) unpacked = { k: key, s: E.unpack(packed) }; return unpacked.s; }

  /* ---------- la lavagna ---------- */
  function fit() {
    var bw = el('bwrap'); if (!cv || !bw || !bw.contains(cv)) return;
    var w = bw.clientWidth, h = bw.clientHeight, r = window.devicePixelRatio || 1;
    if (!w || !h) return;
    cv.width = Math.round(w * r); cv.height = Math.round(h * r); paint();
  }
  function strokes() {
    var g = G(), me = myIdx(); if (!g) return [];
    if (g.phase === 'chain') {
      var tk = E.chainTask(g, me); if (!tk) return [];
      if (tk.kind === 'write') return chainPic('w' + g.chain.k + ':' + me, tk.pic);
      return mine.s;
    }
    if (g.phase === 'show' || (g.phase === 'over' && g.chain)) {
      var S = g.show || { c: 0, i: -1 }, c = g.chain.list[S.c], it = c && c.it[S.i];
      return it && it.s ? chainPic('s' + S.c + ':' + S.i, it.s) : [];
    }
    return drawing(g, me) ? mine.s : view.s;
  }
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
    var g = G(), me = myIdx(); if (!g || !drawing(g, me) || (g.phase !== 'draw' && g.phase !== 'chain')) return;
    e.preventDefault();
    if (g.opts.line && mine.s.length >= 1) { toast('Una linea sola: il tuo tratto l’hai già fatto' + (g.opts.mono ? '.' : '. Puoi ricominciare con il cestino.')); return; }
    try { cv.setPointerCapture(e.pointerId); } catch (x) {}
    var p = pos(e), c = g.opts.mono ? INK : App.pen.c, w = c === '#fffdf6' ? 34 : App.pen.w;
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
  function chainMode() { var g = G(); return !!g && g.phase === 'chain'; }
  function liveSend() {
    if (!cur || chainMode()) return;
    var g = G(), i = mine.s.indexOf(cur); if (i < 0 || !g) return;
    var from = sentLen; if (cur.length <= from) return;
    Net.sendLive({ k: 'pt', t: mine.t, v: mine.v, i: i, o: from, s: from ? cur.slice(Math.max(2, from)) : cur.slice() });
    sentLen = cur.length;
  }
  var picTimer = null;
  function picSoon() { if (chainMode()) return; dirty = true; clearTimeout(picTimer); picTimer = setTimeout(picNow, Date.now() - lastPic > 1500 ? 200 : 900); }
  function picNow() {
    var g = G(); if (!g || !dirty || !drawing(g, myIdx())) return;
    dirty = false; lastPic = Date.now();
    Net.send({ t: 'act', a: { a: 'pic', t: mine.t, v: mine.v, s: mine.s } }).catch(function () { dirty = true; });
  }
  // ogni tanto, mentre si disegna, il disegno intero va anche all'host
  setInterval(function () { if (dirty && !cur && Date.now() - lastPic > 1500) picNow(); else if (dirty && cur && Date.now() - lastPic > 2500) picNow(); }, 500);
  function undo() { if (!mine.s.length) return; mine.s.pop(); mine.v++; cur = null; if (!chainMode()) Net.sendLive({ k: 'cut', t: mine.t, v: mine.v, n: mine.s.length }); picSoon(); paint(); }
  function clear() { if (!mine.s.length) return; mine.s = []; mine.v++; cur = null; if (!chainMode()) Net.sendLive({ k: 'cut', t: mine.t, v: mine.v, n: 0 }); Sound.play('clear'); picSoon(); paint(); }
  // telefono senza fili: consegna il disegno o la scritta (anche da sola poco prima che finisca il tempo)
  function submitChain(auto) {
    var g = G(), me = myIdx(); if (!g || g.phase !== 'chain') return;
    var tk = E.chainTask(g, me); if (!tk || tk.done || App.sent === g.chain.k) return;
    if (tk.kind === 'draw') { App.sent = g.chain.k; Sound.play('guess'); quiet({ a: 'cdraw', s: mine.s }); return; }
    var i = el('gin'), w = i && i.value.trim(); if (!w) { if (!auto) toast('Scrivi che cosa vedi nel disegno.'); return; }
    App.sent = g.chain.k; i.value = ''; Sound.play('guess'); quiet({ a: 'cwrite', w: w });
  }
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
    if (g.phase === 'chain' || g.phase === 'show') return;
    var p = g.pic;
    if (drawing(g, me)) {
      // nella staffetta chi riceve la penna riparte dal disegno che stava guardando
      if (mine.t !== p.t || mine.who !== me) {
        var base = view.t === p.t && view.s.length >= (p.s || []).length ? view.s : (p.s || []);
        mine = { t: p.t, v: Math.max(p.v || 0, view.v || 0) + (mine.t === p.t ? 1 : 0), s: base.map(function (x) { return x.slice(); }), who: me }; cur = null;
        if (g.relay) { dirty = true; picSoon(); }
      }
      return;
    }
    if (mine.who === me && mine.t === p.t) { view = { t: p.t, v: mine.v, s: mine.s.map(function (x) { return x.slice(); }) }; mine.who = null; cur = null; }
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
    var pk = g.phase === 'chain' ? 'c' + g.chain.k : g.phase === 'show' ? 'show' : g.pic.t;
    if (picT !== pk) { picT = pk; mine = { t: g.pic.t, v: 0, s: [], who: null }; view = { t: g.pic.t, v: 0, s: [] }; cur = null; dirty = false; }
    sync(g, me);
    var where = g.phase === 'over' ? 'Partita finita' : g.phase === 'chain' ? E.MODE_NAME.chain + ' · passo ' + (g.chain.k + 1) + ' di ' + g.chain.steps : g.phase === 'show' ? 'Le catene' : (g.opts.mode !== 'teams' ? E.MODE_NAME[g.opts.mode] + ' · ' : '') + 'giro ' + g.round + ' di ' + g.opts.rounds + ' · disegno ' + (g.turn + 1) + ' di ' + g.order.length;
    setHTML('gv-info', '<b>Disegna e indovina</b> <span class="muted">· ' + connInfo(where + ' · tavolo ' + esc(App.code)) + '</span>');
    setHTML('gv-teams', teams(g, me));
    var keep = Array.prototype.map.call(document.querySelectorAll('.clue'), function (x) { return x.value; }), focus = document.activeElement && document.activeElement.classList && document.activeElement.classList.contains('clue') ? Array.prototype.indexOf.call(document.querySelectorAll('.clue'), document.activeElement) : -1;
    setHTML('gv-mid', mid(g, me));
    Array.prototype.forEach.call(document.querySelectorAll('.clue'), function (x, i) { if (keep[i] != null && !x.value) x.value = keep[i]; if (i === focus) x.focus(); });
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
        '<span class="tm-m">' + (T.pc ? '' : E.members(g, t).map(function (i) { var P = g.players[i]; return '<span class="pv sm' + (i === g.drawer ? ' dr' : '') + '" style="--pc:' + pcol(g, i) + '" title="' + esc(P.nick) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>'; }).join('')) + '</span></button>';
    }).join('');
  }
  function mask(w) { return '<span class="mask">' + String(w).split(' ').map(function (x) { return '<span class="mw">' + x.split('').map(function () { return '<i></i>'; }).join('') + '</span>'; }).join('') + '</span><small class="ml">' + String(w).replace(/ /g, '').length + ' lettere' + (w.indexOf(' ') >= 0 ? ', ' + w.split(' ').length + ' parole' : '') + '</small>'; }
  function betChips(g, me) {
    if (!g.opts.bet || g.drawer !== me) return '';
    var b = App.bet || g.bet || 1;
    return '<div class="bets"><span>Punti in palio:</span>' + [1, 2, 3].map(function (k) { return '<button class="chip' + (b === k ? ' on' : '') + '" data-act="bet" data-b="' + k + '">' + k + '</button>'; }).join('') + '<small>se nessuno indovina li perdete</small></div>';
  }
  function rulesNote(g, me) {
    var r = [];
    if (g.opts.line) r.push('una linea sola'); if (g.opts.mono) r.push('solo nero, niente gomma'); if (g.opts.dark) r.push('a occhi chiusi'); if (g.opts.hand) r.push('✋ con la mano sbagliata!');
    return r.length && drawing(g, me) ? '<div class="rnote">' + r.join(' · ') + '</div>' : '';
  }
  function clueChips(g) { return '<div class="clues">' + (g.clues || []).map(function (c) { return '<span class="clue-c">' + esc(c) + '</span>'; }).join('') + '</div>'; }
  function mid(g, me) {
    var h = '', P = g.drawer != null ? g.players[g.drawer] : null, who = P ? '<b class="pn-c" style="--pc:' + pcol(g, g.drawer) + '">' + esc(P.nick) + '</b>' : '', m = g.opts.mode;
    var forT = P ? (g.teams[P.team].pc ? '' : ' per i ' + tlabel(g, P.team)) : '';
    if (g.phase === 'over') h = '<div class="st">Partita finita</div>';
    else if (g.phase === 'chain') {
      var tk = E.chainTask(g, me), n = g.players.length, done = Object.keys(g.chain.done).length;
      if (!tk) h = '<div class="st">Tutti disegnano e scrivono… (' + done + '/' + n + ')</div>';
      else if (tk.done) h = '<div class="st">Consegnato! Aspetto gli altri (' + done + '/' + n + ')…</div>';
      else if (tk.kind === 'draw') h = '<div class="st">' + (g.chain.k ? 'Disegna quello che ha scritto il vicino:' : 'Disegna la tua parola segreta:') + ' <b class="word">' + esc(tk.text) + '</b></div>';
      else h = '<div class="st">Che cosa rappresenta questo disegno? Scrivilo qui sotto.</div>';
    } else if (g.phase === 'show') {
      var S = g.show, c = g.chain.list[S.c], first = g.players[c.it[0] ? c.it[0].p : 0];
      h = '<div class="st">Catena ' + (S.c + 1) + ' di ' + g.chain.list.length + ' · partita da <b class="pn-c" style="--pc:' + pcol(g, c.it[0] ? c.it[0].p : 0) + '">' + esc(first.nick) + '</b>: <b class="word">' + esc(c.w) + '</b></div>';
    } else if (g.phase === 'hint') {
      if (g.hinter === me) {
        var hi = App.hintI || 0;
        h = '<div class="st">Scegli la parola per ' + who + ' e scrivi fino a 3 parole di aiuto (non la parola!):</div><div class="choices">' +
          [0, 1].map(function (i) { return '<button class="btn ch' + (i ? ' hard' : '') + (hi === i ? ' on' : ' ghost') + '" data-act="hintpick" data-i="' + i + '">' + esc(g.choices[i]) + '<small>' + (i ? 'difficile · 2 punti' : 'facile · 1 punto') + '</small></button>'; }).join('') + '</div>' +
          '<div class="clue-row"><input class="field clue" maxlength="24" placeholder="aiuto 1" autocomplete="off"><input class="field clue" maxlength="24" placeholder="aiuto 2" autocomplete="off"><input class="field clue" maxlength="24" placeholder="aiuto 3" autocomplete="off"><button class="btn" data-act="hintgo">Manda gli aiuti</button></div>';
      } else h = '<div class="st">' + (g.hinter != null ? pname(g, g.hinter) + ' sceglie la parola e gli aiuti per ' : 'Gli aiuti per ') + (g.drawer === me ? 'te' : who) + '…</div>' + betChips(g, me);
    } else if (g.phase === 'choose') h = g.drawer === me ? '<div class="st">Tocca a te! Scegli cosa disegnare:</div>' + betChips(g, me) + '<div class="choices"><button class="btn ch" data-act="choose" data-i="0">' + esc(g.choices[0]) + '<small>facile · ' + (g.opts.bet ? 'puntata +0' : '1 punto') + '</small></button><button class="btn ch hard" data-act="choose" data-i="1">' + esc(g.choices[1]) + '<small>difficile · ' + (g.opts.bet ? 'puntata +1' : '2 punti') + '</small></button></div>'
      : '<div class="st">' + who + (forT ? ' (' + tlabel(g, P.team) + ')' : '') + ' sceglie cosa disegnare…</div>';
    else if (g.phase === 'draw' || g.phase === 'steal') {
      var relay = m === 'relay' && g.relay && g.relay.max > 1 ? ' <span class="pp">la penna passa tra <i id="rlv"></i></span>' : '';
      var pts = g.opts.bet ? g.bet + (g.pts > 1 ? 1 : 0) : g.pts;
      if (g.drawer === me) h = m === 'blind' ? '<div class="st">Disegna seguendo gli aiuti (la parola non la sai!):</div>' + clueChips(g) : '<div class="st">Disegna: <b class="word">' + esc(g.word) + '</b> <span class="pp">' + pts + (pts > 1 ? ' punti' : ' punto') + '</span>' + relay + '</div>';
      else if (E.knows(g, me)) h = '<div class="st">' + who + ' disegna' + forT + ': <b class="word">' + esc(g.word) + '</b>' + relay + '</div>' + (m === 'blind' ? clueChips(g) : '');
      else h = '<div class="st">' + (g.phase === 'steal' ? '<b class="steal">Furto!</b> ' : '') + (m === 'relay' ? 'Penna a ' : '') + who + (m === 'relay' ? forT + relay : ' disegna' + forT + ':') + '</div>' + mask(g.word);
      h += rulesNote(g, me);
    } else if (g.phase === 'reveal') h = '<div class="st">Era <b class="word">' + esc(g.word) + '</b>' + (g.hit ? ' · ' + pname(g, g.hit.p) + (g.hit.steal ? ' l’ha rubata' : ' ha indovinato') + ': <b>+' + g.hit.pts + '</b> ' + tto(g, g.hit.t) + (g.hit.dp ? ' e <b>+' + g.hit.dp + '</b> a ' + pname(g, g.drawer) : '') : ' · nessuno l’ha indovinata') + '</div>';
    return h + '<div class="tm"><span class="tmv" id="tmv"></span><span class="tbar2"><i id="tbar"></i></span></div>';
  }
  function phaseTotal(g) {
    if (g.phase === 'draw') return E.drawTime(g) * 1000;
    if (g.phase === 'steal') return E.STEAL_MS; if (g.phase === 'choose') return E.CHOOSE_MS; if (g.phase === 'hint') return E.HINT_MS;
    if (g.phase === 'chain') return E.chainTime(g, g.chain.k); if (g.phase === 'show') return E.SHOW_MS;
    return E.REVEAL_MS;
  }
  function clock() {
    var g = G(); if (!g || !el('tmv')) return;
    var live = g.phase !== 'over', ms = live ? left(g) : 0, s = Math.ceil(ms / 1000);
    var total = phaseTotal(g);
    var txt = live && g.phase !== 'reveal' && g.phase !== 'show' ? s + '″' : '', tv = el('tmv'), tb = el('tbar');
    if (tv.textContent !== txt) tv.textContent = txt;
    if (tb) tb.style.width = live ? Math.max(0, Math.min(100, ms / total * 100)).toFixed(1) + '%' : '0%';
    el('gv-mid').classList.toggle('low', live && (g.phase === 'draw' || g.phase === 'steal' || g.phase === 'chain') && s <= 10);
    var rv = el('rlv'); if (rv && g.relay) { var rs = Math.max(0, Math.ceil((g.relay.next - hostNow()) / 1000)) + '″'; if (rv.textContent !== rs) rv.textContent = rs; }
    if ((g.phase === 'draw' || g.phase === 'steal' || g.phase === 'chain') && s <= 5 && s > 0) { var k = g.turn + g.phase + s + (g.chain ? g.chain.k : ''); if (lastTick !== k) { lastTick = k; Sound.play('tick'); } }
    // telefono senza fili: poco prima della fine si consegna da soli quello che c'è
    if (g.phase === 'chain' && ms < 1800 && ms > 0) submitChain(true);
  }
  function tools(g, me) {
    if (!drawing(g, me) || (g.phase !== 'draw' && g.phase !== 'chain')) return '';
    var give = g.phase === 'chain' ? '<button class="btn small" data-act="consegna">Consegna</button>' : '';
    var sizes = SIZES.map(function (w) { return '<button class="sz' + (App.pen.w === w ? ' on' : '') + '" data-act="size" data-w="' + w + '" aria-label="Spessore ' + w + '"><i style="width:' + (w / 1.4 + 3) + 'px;height:' + (w / 1.4 + 3) + 'px"></i></button>'; }).join('');
    if (g.opts.mono) return '<div class="pal"><span class="muted mono">Solo nero, niente gomma</span></div><div class="pal">' + sizes + give + '</div>';
    var cols = COLORS.map(function (c) { return '<button class="sw' + (App.pen.c === c ? ' on' : '') + '" style="--c:' + c + '" data-act="pen" data-c="' + c + '" aria-label="Colore"></button>'; }).join('');
    var rub = g.opts.line ? '' : '<button class="sw er' + (App.pen.c === '#fffdf6' ? ' on' : '') + '" data-act="pen" data-c="#fffdf6" aria-label="Gomma">' + IC('eraser') + '</button>';
    var un = g.opts.line ? '' : '<button class="tb" data-act="undo" aria-label="Annulla">' + IC('undo') + '</button>';
    return '<div class="pal">' + cols + rub + '</div><div class="pal">' + sizes + un + '<button class="tb" data-act="clear" aria-label="' + (g.opts.line ? 'Ricomincia' : 'Cancella tutto') + '">' + IC('trash') + '</button>' + give + '</div>';
  }
  function over(g, me) {
    var dark = g.opts.dark && drawing(g, me) ? '<div class="bo dark">A occhi chiusi: il tuo disegno lo vedono solo gli altri</div>' : '';
    if (g.phase === 'choose') return '<div class="bo">' + (g.drawer === me ? 'Scegli la parola qui sopra' : 'Tra poco si disegna…') + '</div>';
    if (g.phase === 'hint') return '<div class="bo">' + (g.hinter === me ? 'Prepara gli aiuti qui sopra' : 'Si preparano gli aiuti…') + '</div>';
    if (g.phase === 'reveal') return '<div class="bo big">' + esc(g.word) + '</div>';
    if (g.phase === 'chain') { var tk = E.chainTask(g, me); if (tk && tk.done && tk.kind === 'draw') return '<div class="bo">Consegnato!</div>'; if (tk && tk.kind === 'write' && !tk.pic.length) return '<div class="bo">Il vicino non ha disegnato niente… prova a indovinare lo stesso!</div>'; return dark; }
    if (g.phase === 'show' || (g.phase === 'over' && g.chain)) {
      var S = g.show || { c: 0, i: -1 }, c = g.chain.list[S.c], it = c && c.it[S.i];
      if (!c) return '';
      if (S.i < 0) return '<div class="bo big">' + esc(c.w) + '<small>la parola di partenza</small></div>';
      var by = '<small>' + (it.s ? 'disegnato' : 'scritto') + ' da ' + esc(g.players[it.p].nick) + (it.ok ? ' · giusto! +1' : '') + '</small>';
      return it.s ? '<div class="bo cap">' + by + '</div>' : '<div class="bo big' + (it.ok ? ' ok' : '') + '">«' + esc(it.w || '…') + '»' + by + '</div>';
    }
    return dark;
  }
  function feed(g, me) {
    if (g.phase === 'chain') return '<span class="muted gs0">Hanno consegnato ' + Object.keys(g.chain.done).length + ' su ' + g.players.length + '.</span>';
    if (g.phase === 'show' || (g.phase === 'over' && g.chain)) {
      var S = g.show || { c: 0, i: -1 }, c = g.chain.list[S.c]; if (!c) return '';
      return '<span class="gs chainsum"><b>' + esc(c.w) + '</b>' + c.it.slice(0, S.i + 1).map(function (x) { return ' → ' + (x.s ? '✏️ ' + esc(g.players[x.p].nick) : '«' + esc(x.w || '…') + '»'); }).join('') + '</span>';
    }
    var list = g.guesses.slice(-6).map(function (x) { var P = g.players[x.p]; return '<span class="gs' + (x.near && x.p === me ? ' near' : '') + '" style="--pc:' + pcol(g, x.p) + '"><b>' + esc(P.nick) + '</b> ' + esc(x.w) + (x.near && x.p === me ? ' <em>quasi!</em>' : '') + '</span>'; }).join('');
    return list || '<span class="muted gs0">Le risposte compaiono qui.</span>';
  }
  function form(g, me) {
    var f = el('gform'), tk = g.phase === 'chain' ? E.chainTask(g, me) : null, write = !!tk && tk.kind === 'write' && !tk.done;
    var can = me >= 0 && (E.canGuess(g, me) || write), key = can ? 'on:' + g.turn + ':' + g.phase + ':' + (g.chain ? g.chain.k : '') : 'off';
    if (f._k === key) return; f._k = key;
    var ph = write ? 'Che cos’è? Scrivilo qui…' : g.phase === 'steal' ? 'Rubala! Scrivi la parola…' : 'Che cos’è? Scrivi qui…';
    f.innerHTML = can ? '<input id="gin" class="field gin" maxlength="40" autocomplete="off" autocorrect="off" spellcheck="false" enterkeyhint="send" placeholder="' + ph + '"><button class="btn gsend" type="submit" aria-label="Invia">' + IC('send') + '</button>' : '';
    f.classList.toggle('on', can);
  }
  function prompt(g, me) {
    var h = '', btn = '', help = 'goal', m = g.opts.mode;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Pari tra ' + g.winners.map(function (t) { return tlabel(g, t); }).join(' e ') : (g.teams[g.winners[0]].pc ? 'Vince ' : 'Vincono i ') + tlabel(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; }
    else if (g.phase === 'chain') { var tk = E.chainTask(g, me); help = 'chain'; h = !tk ? 'Stai guardando.' : tk.done ? 'Aspetta che consegnino tutti.' : tk.kind === 'draw' ? 'Disegna e tocca <b>Consegna</b>. Niente lettere!' : 'Scrivi che cosa vedi e invia.'; }
    else if (g.phase === 'show') { h = 'Ecco come si è trasformata la parola, passo dopo passo!'; help = 'chain'; }
    else if (g.phase === 'hint') { h = g.hinter === me ? 'Scegli la parola e scrivi gli aiuti: niente parola né pezzi di parola!' : 'Si preparano gli aiuti.'; help = 'blind'; }
    else if (g.phase === 'choose') { h = g.drawer === me ? 'Scegli la parola: la difficile vale di più.' : 'Si prepara il prossimo disegno.'; help = 'draw'; }
    else if (g.phase === 'draw') {
      if (g.drawer === me) { h = m === 'blind' ? 'Disegna gli aiuti e indovina anche tu!' : m === 'relay' ? 'Disegna finché hai la penna, poi passa al compagno.' : 'Disegna con il dito. <b>Niente lettere!</b>'; btn = '<button class="btn small ghost" data-act="skip">Passo</button>'; help = m === 'relay' ? 'relay' : m === 'blind' ? 'blind' : 'draw'; }
      else if (E.canGuess(g, me)) { h = m === 'ffa' ? 'Indovina prima di tutti!' : 'Indovina che cosa disegna ' + (m === 'blind' && g.players[g.drawer].team === g.players[me].team ? 'il tuo compagno (non sa la parola!)' : 'il tuo compagno') + '!'; help = m === 'ffa' ? 'ffa' : 'guess'; }
      else if (m === 'relay' && E.knows(g, me)) { h = 'Hai già avuto la penna: ora tifa per i tuoi compagni.'; help = 'relay'; }
      else if (m === 'blind' || m === 'ffa') { h = 'Guarda e divertiti: questa volta non indovini tu.'; help = m; }
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
      case 'turn': enqueue(function () { Sound.play('turn'); if (e.hinter === me) banner('Tocca a te!', 'Prepara gli aiuti per ' + esc(g.players[e.p].nick)); else if (e.p === me) banner('Tocca a te!', g.opts.mode === 'blind' ? 'Tra poco arrivano gli aiuti' : 'Scegli cosa disegnare'); else banner(esc(g.players[e.p].nick) + ' disegna', g.teams[e.t].pc ? '' : 'per i ' + esc(g.teams[e.t].name)); return sleep(200); }); break;
      case 'relay': enqueue(function () { Sound.play('turn'); if (e.p === me) banner('La penna è tua!', 'Disegna: ' + esc(G().word || '')); else banner('Penna a ' + esc(g.players[e.p].nick), ''); return sleep(200); }); break;
      case 'chain': enqueue(function () { Sound.play('turn'); var tk = E.chainTask(G(), me); if (tk) banner(tk.kind === 'draw' ? 'Disegna!' : 'Che cos’è?', tk.kind === 'draw' ? esc(tk.text) : 'scrivi cosa vedi nel disegno'); return sleep(200); }); break;
      case 'show': enqueue(function () { Sound.play('hit'); banner('Le catene!', 'guardate com’è cambiata ogni parola'); return sleep(200); }); break;
      case 'draw': enqueue(function () { Sound.play('draw'); return sleep(50); }); break;
      case 'hit': enqueue(function () { Sound.play('hit'); banner(e.steal ? 'Rubata!' : 'Indovinata!', esc(e.word) + ' · +' + e.pts + (g.teams[e.t].pc ? ' a ' : ' ai ') + esc(g.teams[e.t].name)); if (myTeam(g, me) === e.t) confetti(30); return sleep(300); }); break;
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
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, clock: clock, undo: undo, clear: clear, picNow: picNow, strokes: strokes, submitChain: submitChain };
})();
