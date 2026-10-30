/* ===== Machiavelli: schermata di gioco e trascinamento delle carte =====
   Nel proprio turno si lavora su una copia del tavolo e della mano («Work»): si spostano le carte trascinandole
   o selezionandole, e solo con «Fine turno» la giocata va all'host, che la controlla. Intanto gli altri
   vedono la bozza in diretta. Mentre si trascina, le combinazioni dove la carta sta bene si accendono di verde. */
var Work = (function () {
  var w = null, draftT = null, lastDraft = '', nid = 0;
  function sync(g, me) {
    if (!g || me < 0 || g.phase !== 'play' || g.turn !== me) { w = null; App.work = null; return; }
    var key = App.code + ':' + g.turnN;
    if (w && w.key === key) return;
    var P = g.players[me];
    w = { key: key, groups: g.table.map(function (gr) { return { id: 'g' + gr.id, c: gr.c.slice() }; }), hand: P.hand.slice(), mine: {}, sel: [] };
    P.hand.forEach(function (c) { w.mine[c] = 1; });
    lastDraft = JSON.stringify(g.table.map(function (gr) { return gr.c; }));
    App.work = w;
  }
  function active() { return !!w; }
  function where(c) { if (w.hand.indexOf(c) >= 0) return 'hand'; for (var i = 0; i < w.groups.length; i++) if (w.groups[i].c.indexOf(c) >= 0) return w.groups[i].id; return null; }
  function group(id) { return w.groups.filter(function (x) { return x.id === id; })[0]; }
  function played() { return Object.keys(w.mine).map(Number).filter(function (c) { return w.hand.indexOf(c) < 0; }); }
  function changed() { var g = G(); return played().length > 0 || JSON.stringify(w.groups.map(function (x) { return x.c.slice().sort(); })) !== JSON.stringify(g.table.map(function (x) { return x.c.slice().sort(); })); }
  function allValid() { return w.groups.every(function (x) { return E.valid(x.c); }); }
  // Dove possono andare le carte «cs»: nella combinazione «id» (se il risultato è valido, se è una combinazione
  // ancora incompleta, o se una scala si può dividere in due), in una nuova, o in mano (solo carte tue di questo turno).
  function accept(cs, target) {
    if (target === 'new') return { ok: true };
    if (target === 'hand') return cs.every(function (c) { return w.mine[c]; }) ? { ok: true } : { ok: false, why: 'Le carte del tavolo non si possono riprendere in mano.' };
    var gr = group(target); if (!gr) return { ok: false };
    var rest = gr.c.filter(function (c) { return cs.indexOf(c) < 0; }), res = rest.concat(cs);
    if (rest.length === gr.c.length && E.valid(res)) return { ok: true, valid: true };
    if (!E.valid(gr.c)) return { ok: true, work: true };
    if (E.valid(res)) return { ok: true, valid: true };
    var sp = split(rest, cs); if (sp) return { ok: true, valid: true, split: sp };
    return { ok: false, why: 'Lì non va: ' + res.map(E.label).join(' ') + ' non è un tris, un poker o una scala.' };
  }
  // una carta che c'è già nella scala la divide in due scale valide (3♥…7♥ + 5♥ = 3♥4♥5♥ e 5♥6♥7♥)
  function split(run, cs) {
    if (cs.length !== 1 || E.kind(run) !== 'run') return null;
    var c = cs[0]; if (E.suit(c) !== E.suit(run[0]) || !run.some(function (x) { return E.rank(x) === E.rank(c); })) return null;
    var hi = E.aceHigh(run), v = function (x) { return E.rank(x) === 1 && hi ? 14 : E.rank(x); }, s = E.sortGroup(run);
    var left = s.filter(function (x) { return v(x) <= v(c); }), right = [c].concat(s.filter(function (x) { return v(x) > v(c); }));
    return E.valid(left) && E.valid(right) ? [left, right] : null;
  }
  function move(cs, target) {
    if (!w || !cs.length) return false;
    var a = accept(cs, target);
    if (!a.ok) { if (a.why) toast(esc(a.why), 'bad'); Sound.play('no'); return false; }
    // si tolgono le carte da dove sono
    w.hand = w.hand.filter(function (c) { return cs.indexOf(c) < 0; });
    w.groups.forEach(function (x) { if (x.id !== target) x.c = x.c.filter(function (c) { return cs.indexOf(c) < 0; }); });
    if (target === 'hand') w.hand = w.hand.concat(cs);
    else if (target === 'new') w.groups.push({ id: 'n' + (++nid), c: cs.slice() });
    else {
      var gr = group(target), rest = gr.c.filter(function (c) { return cs.indexOf(c) < 0; });
      if (a.split) { var i = w.groups.indexOf(gr); w.groups.splice(i, 1, { id: gr.id, c: a.split[0] }, { id: 'n' + (++nid), c: a.split[1] }); }
      else gr.c = rest.concat(cs);
    }
    w.groups = w.groups.filter(function (x) { return x.c.length; });
    w.groups.forEach(function (x) { x.c = E.sortGroup(x.c); });
    w.sel = [];
    Sound.play('drop');
    queueDraft();
    return true;
  }
  function reset() { var g = G(); if (!w) return; w.groups = g.table.map(function (gr) { return { id: 'g' + gr.id, c: gr.c.slice() }; }); w.hand = Object.keys(w.mine).map(Number).filter(function (c) { return g.players[myIdx()].hand.indexOf(c) >= 0; }); w.sel = []; queueDraft(); }
  function toggle(c) { var i = w.sel.indexOf(c); if (i >= 0) w.sel.splice(i, 1); else w.sel.push(c); Sound.play('pick'); }
  // la bozza agli altri: al massimo una volta al secondo e solo se è cambiata
  function queueDraft() {
    clearTimeout(draftT);
    draftT = setTimeout(function () {
      if (!w) return; var t = w.groups.map(function (x) { return x.c; }), s = JSON.stringify(t);
      if (s === lastDraft) return; lastDraft = s;
      Net.send({ t: 'act', a: { a: 'draft', t: t } }).catch(function () {});
    }, 900);
  }
  function table() { return w.groups.map(function (x) { return x.c.slice(); }); }
  return { sync: sync, active: active, accept: accept, move: move, reset: reset, toggle: toggle, where: where, played: played, changed: changed, allValid: allValid, table: table, get: function () { return w; } };
})();

var Game = (function () {
  var mountedFor = null, drag = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-players" id="gv-players"></div>' + Chat.dockHTML() +
      '<div class="gv-table" id="gv-table"></div>' +
      '<div class="gv-side"><div class="gv-prompt" id="gv-prompt" aria-live="polite"></div><div class="gv-acts" id="gv-acts"></div><div class="gv-hand" id="gv-hand" data-drop="hand" data-act="tohand"></div></div></div>';
    mountedFor = App.code;
    bindDrag();
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (drag && drag.on) { drag.pending = true; return; }   // niente ridisegni mentre si trascina
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Machiavelli</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Giro ' + g.round) + ' · mazzo ' + g.deck.length + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-players', players(g, me));
    setHTML('gv-table', table(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-acts', actions(g, me));
    setHTML('gv-hand', hand(g, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }

  /* ---------- giocatori ---------- */
  function players(g, me) {
    return g.players.map(function (P, p) {
      var on = g.phase === 'play' && g.turn === p, n = P.hand.length;
      return '<button class="pchip' + (on ? ' on' : '') + (p === me ? ' me' : '') + '" style="--pc:' + PCOL[P.col % PCOL.length] + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + ', ' + n + ' carte">' +
        '<span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><span class="pn"><b>' + Net.dot(P.uid) + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="ps"><i class="' + (n <= 2 ? 'low' : '') + '">' + IC('cards') + n + (n === 1 ? ' carta' : ' carte') + '</i>' + (g.opts.open36 && !P.opened ? '<i class="op">da aprire</i>' : '') + '</span></span>' +
        (P.away ? '<span class="away">assente</span>' : P.bot && g.phase === 'play' ? '<span class="away bot">auto</span>' : '') + '</button>';
    }).join('');
  }

  /* ---------- il tavolo ---------- */
  function cardHTML(c, extra) { return '<span class="cw' + (extra || '') + '" data-c="' + c + '">' + ART.card(c) + '</span>'; }
  function table(g, me) {
    var mine = Work.active(), W = Work.get(), groups, fresh = {}, draft = !mine && g.draft && g.draft.turnN === g.turnN && g.draft.p === g.turn;
    var onTable = {}; g.table.forEach(function (x) { x.c.forEach(function (c) { onTable[c] = 1; }); });
    if (mine) { groups = W.groups; W.groups.forEach(function (x) { x.c.forEach(function (c) { if (!onTable[c]) fresh[c] = 1; }); }); }
    else if (draft) { groups = g.draft.t.map(function (c, i) { return { id: 'd' + i, c: E.sortGroup(c) }; }); groups.forEach(function (x) { x.c.forEach(function (c) { if (!onTable[c]) fresh[c] = 1; }); }); }
    else groups = g.table.map(function (x) { return { id: 'g' + x.id, c: x.c }; });
    var fl = App.flash && Date.now() - App.flash.at < 2500 ? App.flash : null;
    var html = groups.map(function (x) {
      var k = E.kind(x.c), bad = !k, flash = fl && !mine && fl.groups && fl.groups.indexOf(+String(x.id).slice(1)) >= 0;
      return '<div class="grp' + (bad ? ' bad' : '') + (flash ? ' flash' : '') + '" data-drop="' + x.id + '"' + (mine ? ' data-act="grp" data-g="' + x.id + '"' : '') + '>' +
        x.c.map(function (c) { return cardHTML(c, (fresh[c] ? ' fresh' : '') + (mine && W.sel.indexOf(c) >= 0 ? ' sel' : '') + (fl && !mine && fl.cards.indexOf(c) >= 0 ? ' fresh' : '')); }).join('') +
        (bad ? '<span class="gtag">' + (x.c.length < 3 ? 'incompleta' : 'non valida') + '</span>' : '') + '</div>';
    }).join('');
    if (mine) html += '<button class="grp newg" data-drop="new" data-act="newg">' + IC('plus') + '<span>Nuova combinazione</span></button>';
    if (!groups.length && !mine) html = '<p class="empty">Il tavolo è vuoto. ' + (g.phase === 'play' ? 'La prima combinazione la cala chi ci riesce.' : '') + '</p>';
    var head = draft ? '<div class="tline">' + pname(g, g.turn) + ' sta riorganizzando il tavolo…</div>' : '';
    return head + '<div class="groups">' + html + '</div>';
  }

  /* ---------- cosa fare adesso ---------- */
  function prompt(g, me) {
    var P = me >= 0 ? g.players[me] : null, h = '', help = 'turn', btn = '';
    if (g.phase === 'over') { h = '<b>Partita finita.</b> Vince ' + pname(g, g.winner) + (g.final.out ? ': ha calato tutte le carte.' : ' con meno carte in mano.'); btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (Work.active()) {
      var W = Work.get(), n = Work.played().length, ok = Work.allValid();
      if (W.sel.length) h = '<b>' + W.sel.length + (W.sel.length === 1 ? ' carta selezionata' : ' carte selezionate') + '</b>: tocca dove metterle (una combinazione, «Nuova combinazione» o la tua mano).';
      else if (!n) h = '<b>Tocca a te!</b> Trascina una carta sul tavolo (i posti giusti si accendono di verde), oppure <b>pesca</b>.' + (g.opts.open36 && !P.opened ? ' Devi ancora aprire: almeno 36 punti con carte tue.' : '');
      else if (!ok) h = 'Hai messo ' + n + (n === 1 ? ' carta' : ' carte') + ', ma ci sono combinazioni <b class="bad">rosse</b>: sistemale oppure tocca <b>Annulla</b>.';
      else h = 'Tutto valido: hai messo <b>' + n + (n === 1 ? ' carta' : ' carte') + '</b>. Puoi continuare o toccare <b>Fine turno</b>.';
      help = W.sel.length ? 'phone' : n ? 'manip' : 'turn';
    } else {
      var T = g.players[g.turn];
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + (g.draft && g.draft.turnN === g.turnN ? ': sta spostando le carte…' : ': sta pensando…');
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function actions(g, me) {
    if (!Work.active()) return '';
    var ch = Work.changed(), ok = Work.allValid() && Work.played().length > 0, empty = !g.deck.length;
    return '<button class="ab" data-act="undo"' + (ch ? '' : ' aria-disabled="true"') + '>' + IC('undo') + '<span>Annulla</span></button>' +
      '<button class="ab" data-act="draw">' + IC('draw') + '<span>' + (empty ? 'Passo' : 'Pesca') + '</span></button>' +
      '<button class="ab pri' + (ok ? '' : ' off') + '" data-act="done"' + (ok ? '' : ' aria-disabled="true"') + '>' + IC('check') + '<span>Fine turno</span></button>';
  }

  /* ---------- la mano ---------- */
  function sortHand(cs) {
    return cs.slice().sort(App.sortBy === 'rank' ? function (a, b) { return E.rank(a) - E.rank(b) || E.suit(a) - E.suit(b) || a - b; } : function (a, b) { return E.suit(a) - E.suit(b) || E.rank(a) - E.rank(b) || a - b; });
  }
  function hand(g, me) {
    if (me < 0) return '<p class="muted">Stai guardando la partita.</p>';
    var W = Work.get(), cs = sortHand(W ? W.hand : g.players[me].hand);
    return '<div class="hd-head"><span><b>La tua mano</b> · ' + cs.length + (cs.length === 1 ? ' carta' : ' carte') + '</span><button class="chip" data-act="sort">' + IC('sort') + (App.sortBy === 'rank' ? ' per valore' : ' per seme') + '</button></div>' +
      '<div class="hd-cards">' + (cs.length ? cs.map(function (c) { return cardHTML(c, W && W.sel.indexOf(c) >= 0 ? ' sel' : ''); }).join('') : '<span class="muted">Nessuna carta in mano.</span>') + '</div>';
  }

  /* ---------- trascinamento ---------- */
  function bindDrag() {
    var root = el('gv');
    root.addEventListener('pointerdown', function (e) {
      var cw = e.target.closest('.cw'); if (!cw || !Work.active() || App.busy) return;
      var c = +cw.getAttribute('data-c'), W = Work.get(); if (Work.where(c) == null) return;
      drag = { c: c, x: e.clientX, y: e.clientY, id: e.pointerId, on: false, cs: W.sel.indexOf(c) >= 0 ? W.sel.slice() : [c] };
      try { cw.setPointerCapture(e.pointerId); } catch (x) {}
    });
    root.addEventListener('pointermove', function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      if (!drag.on) { if (Math.hypot(e.clientX - drag.x, e.clientY - drag.y) < 7) return; start(); }
      e.preventDefault();
      drag.ghost.style.transform = 'translate(' + (e.clientX - 22) + 'px,' + (e.clientY - 40) + 'px)';
      hover(e.clientX, e.clientY);
      autoScroll(e.clientY);
    });
    var end = function (e) {
      if (!drag || e.pointerId !== drag.id) return;
      var d = drag; drag = null;
      if (!d.on) { Work.toggle(d.c); render(); return; }   // tocco: seleziona
      finish(d, e.clientX, e.clientY);
    };
    root.addEventListener('pointerup', end);
    root.addEventListener('pointercancel', function (e) { if (drag && e.pointerId === drag.id) { var d = drag; drag = null; if (d.on) finish(d, -1, -1); } });
  }
  function start() {
    drag.on = true; Sound.play('pick');
    var gh = document.createElement('div'); gh.className = 'dragghost';
    gh.innerHTML = drag.cs.slice(0, 6).map(function (c) { return '<span class="cw">' + ART.card(c) + '</span>'; }).join('') + (drag.cs.length > 1 ? '<b>' + drag.cs.length + '</b>' : '');
    document.body.appendChild(gh); drag.ghost = gh;
    document.body.classList.add('dragging');
    // i posti dove le carte stanno bene si accendono
    document.querySelectorAll('[data-drop]').forEach(function (n) {
      var t = n.getAttribute('data-drop'), a = Work.accept(drag.cs, t), from = drag.cs.every(function (c) { return Work.where(c) === t; });
      n.classList.toggle('dz-can', a.ok && !from && !a.work); n.classList.toggle('dz-work', a.ok && !from && !!a.work); n.classList.toggle('dz-nope', !a.ok);
    });
    drag.cs.forEach(function (c) { var n = document.querySelector('.cw[data-c="' + c + '"]'); if (n) n.classList.add('dz-lift'); });
  }
  function targetAt(x, y) { var n = document.elementFromPoint(x, y); n = n && n.closest('[data-drop]'); return n; }
  function hover(x, y) {
    var n = targetAt(x, y);
    if (drag.over && drag.over !== n) drag.over.classList.remove('dz-over');
    if (n) n.classList.add('dz-over'); drag.over = n;
  }
  function autoScroll(y) {
    var t = el('gv-table'); if (!t) return; var r = t.getBoundingClientRect();
    if (y < r.top + 30 && y > r.top - 40) t.scrollTop -= 12; else if (y > r.bottom - 30 && y < r.bottom + 40) t.scrollTop += 12;
  }
  function finish(d, x, y) {
    if (d.ghost) d.ghost.remove();
    document.body.classList.remove('dragging');
    document.querySelectorAll('.dz-can,.dz-work,.dz-nope,.dz-over,.dz-lift').forEach(function (n) { n.classList.remove('dz-can', 'dz-work', 'dz-nope', 'dz-over', 'dz-lift'); });
    var n = x >= 0 ? targetAt(x, y) : null;
    if (n) { var t = n.getAttribute('data-drop'); if (!d.cs.every(function (c) { return Work.where(c) === t; })) Work.move(d.cs, t); }
    render();
  }
  return { render: render, unmount: unmount };
})();
