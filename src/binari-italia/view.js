/* ===== Ticket to Ride Italy: schermata di gioco =====
   In alto i giocatori, al centro la mappa, poi le carte scoperte con i mazzi, la riga che dice cosa fare
   e la tua mano. Su schermi larghi la mappa sta a sinistra e il resto in una colonna a destra. */
var Game = (function () {
  var mountedFor = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }

  function mount() {
    $('#app').innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ART.DEFS + '</svg><div class="gv" id="gv">' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-players" id="gv-players"></div>' + Chat.dockHTML() +
      '<div class="gv-map"><div id="gv-board" class="gv-board"></div><div class="gv-feed" id="gv-feed" data-act="log"></div>' +
      '<div class="gv-zoom"><button class="zb" data-act="zin" aria-label="Avvicina">+</button><button class="zb" data-act="zout" aria-label="Allontana">−</button><button class="zb" data-act="zfit" aria-label="Mostra tutta la mappa">⤢</button><button class="zb zreg" id="zreg" data-act="togglereg" aria-label="Mostra le regioni" aria-pressed="false">' + IC('region') + '</button></div><div class="gv-legend" id="gv-legend"></div></div>' +
      '<div class="gv-side"><div class="gv-market" id="gv-market"></div><div class="gv-prompt" id="gv-prompt" aria-live="polite"></div><div class="gv-hand" id="gv-hand"></div></div></div>';
    Board.mount(el('gv-board'), { onRoute: onRoute, onCity: onCity, onEmpty: function () { if (App.sel != null || App.focus) { App.sel = null; App.focus = null; render(); } } });
    mountedFor = App.code;
    setTimeout(function () {
      var g = G(), me = myIdx();
      if (me >= 0 && window.innerWidth < 700 && g.players[me].tickets.length) { var cs = []; g.players[me].tickets.forEach(function (id) { cs = cs.concat(spots(D.tickets[id].a), spots(D.tickets[id].b)); }); Board.centerOnRoutes(cs, false); }
      else Board.fit();
    }, 120);
  }
  function unmount() { if (mountedFor) { Board.unmount(); mountedFor = null; } }
  function render() {
    if (mountedFor !== App.code || !el('gv') || !Board.mounted()) mount();
    var g = G(), me = myIdx();
    // finita la scelta dei biglietti: inquadra le tue città (una volta)
    if (me >= 0 && g.stage !== 'setup' && App.framed !== App.code) { App.framed = App.code; var cs = []; g.players[me].tickets.forEach(function (id) { cs = cs.concat(spots(D.tickets[id].a), spots(D.tickets[id].b)); }); if (cs.length && window.innerWidth < 1000) setTimeout(function () { Board.centerOnRoutes(cs, true, { maxK: 1.3 }); }, 300); }
    Board.update(g, view(g, me));
    setHTML('gv-info', info(g));
    setHTML('gv-players', players(g, me));
    setHTML('gv-market', market(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-hand', me >= 0 ? hand(g, me) : spectHand(g));
    setHTML('gv-feed', feed(g));
    setHTML('gv-legend', legend(g, me));
    var zr = el('zreg'); if (zr) { zr.classList.toggle('on', !!App.showReg); zr.setAttribute('aria-pressed', App.showReg ? 'true' : 'false'); }
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function info(g) {
    var t = g.phase === 'over' ? 'Partita finita' : g.stage === 'setup' ? 'Si scelgono i biglietti' : 'Giro ' + g.round + (g.last ? ' · ULTIMO GIRO' : '');
    return '<b>Ticket to Ride Italy</b> <span class="muted">· ' + connInfo(t + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>';
  }

  /* ---------- cosa mostrare sulla mappa ---------- */
  function view(g, me) {
    var o = { hl: {}, cities: {}, focus: null, follow: false, regions: !!App.showReg }, P = me >= 0 ? g.players[me] : null;
    if (P) P.tickets.forEach(function (id) { var t = D.tickets[id], ok = E.connected(g, me, t.a, t.b); spots(t.a).concat(spots(t.b)).forEach(function (c) { if (o.cities[c] !== 'tk') o.cities[c] = ok ? 'ok' : 'tk'; }); });
    var mine = me >= 0 && g.phase === 'play' && g.stage === 'act' && g.turn === me;
    if (mine && App.showCan !== false) D.routes.forEach(function (r) { if (E.canClaim(g, me, r).ok) o.hl[r.id] = 'can'; });
    if (App.focus) {
      var f = App.focus;
      if (f.k === 'color') { o.hl = {}; D.routes.forEach(function (r) { if (g.claims[r.id] == null && (r.col === f.c || (f.c !== 'L' && r.col === 'X'))) o.hl[r.id] = E.canClaim(g, me, r).ok ? 'can' : 'plan'; }); }
      if (f.k === 'ticket') {
        var t = D.tickets[f.id], path = me >= 0 ? E.ticketPath(g, me, t) : null;
        if (path) path.forEach(function (id) { o.hl[id] = 'path'; });
        else if (me >= 0) { var sp = BOT.shortest(g, me, t.a, t.b); if (sp) sp.routes.forEach(function (r) { o.hl[r.id] = g.claims[r.id] === me ? 'path' : 'plan'; }); }
        spots(t.a).concat(spots(t.b)).forEach(function (c) { o.cities[c] = 'sel'; });
      }
      if (f.k === 'player') { o.focus = {}; E.myRoutes(g, f.p).forEach(function (r) { o.focus[r.id] = 1; }); var nets = E.networks(g, f.p); if (nets[0] && nets[0].count) nets[0].routes.forEach(function (id) { o.hl[id] = 'long'; }); }
      if (f.k === 'city') { o.cities[f.c] = 'sel'; }
    }
    if (App.sel != null) o.hl[App.sel] = 'sel';
    if (g.phase === 'over' && !App.focus && g.final) { var w = g.final.order[0], nw = E.networks(g, w); if (nw[0]) nw[0].routes.forEach(function (id) { o.hl[id] = 'long'; }); }
    o.follow = !(me >= 0 && g.turn === me);
    return o;
  }
  function legend(g, me) {
    var f = App.focus;
    if (f && f.k === 'ticket') { var t = D.tickets[f.id], ok = me >= 0 && E.connected(g, me, t.a, t.b); return '<div class="lg"><b>' + esc(cn(t.a)) + ' – ' + esc(cn(t.b)) + '</b> · ' + (ok ? '<span class="good">' + IC('check') + ' collegate</span>' : '<span class="lg-plan"></span> percorso più breve libero') + '<button class="x" data-act="unfocus" aria-label="Chiudi">×</button></div>'; }
    if (f && f.k === 'color') return '<div class="lg">' + ART.swatch(f.c) + ' tratte ' + (f.c === 'L' ? 'di tutti i colori' : D.COLORS[f.c].n + ' e grigie') + ' ancora libere<button class="x" data-act="unfocus" aria-label="Chiudi">×</button></div>';
    if (f && f.k === 'player') return '<div class="lg">Tratte di ' + pname(g, f.p) + ' · in oro la rete con più regioni<button class="x" data-act="unfocus" aria-label="Chiudi">×</button></div>';
    if (App.showReg) return '<div class="lg">' + IC('region') + ' Il colore delle stazioni indica la regione<button class="btn ghost small" data-act="regions">Il mio bonus</button><button class="x" data-act="togglereg" aria-label="Chiudi">×</button></div>';
    return '';
  }

  /* ---------- tocchi sulla mappa ---------- */
  function onRoute(rid) { App.sel = rid; App.sheet = { kind: 'route', r: rid, seq: G().seq }; render(); renderSheet(); if (window.innerHeight < 900) Board.centerOnRoutes([rid], true, { maxK: 1.3, up: .5 }); }
  function onCity(cid) { App.sel = null; App.sheet = { kind: 'city', c: cid }; App.focus = { k: 'city', c: cid }; render(); renderSheet(); }

  /* ---------- giocatori ---------- */
  function players(g, me) {
    var dec = E.decider(g);
    return g.players.map(function (P, p) {
      var on = g.phase === 'play' && (g.stage === 'setup' ? !P.ready : g.turn === p), low = P.trains <= 6;
      return '<button class="pchip' + (on ? ' on' : '') + (p === me ? ' me' : '') + '" style="--pc:' + D.PCOL[P.col].c + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + ', ' + P.score + ' punti, ' + P.trains + ' vagoni">' +
        '<span class="pw">' + ART.pieceIcon(P.col, 24) + '</span><span class="pn"><b>' + Net.dot(P.uid) + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="ps">' +
        '<i class="sc" title="Punti">' + IC('star') + P.score + '</i><i class="' + (low ? 'low' : '') + '" title="Vagoni rimasti">' + IC('train') + P.trains + '</i><i title="Carte in mano">' + IC('card') + E.handCount(P) + '</i><i title="Biglietti">' + IC('ticket') + P.tickets.length + '</i>' + (E.ferries(P) ? '<i class="fe" title="Carte Traghetto">' + IC('ferry') + E.ferries(P) + '</i>' : '') + '</span></span>' +
        (P.away ? '<span class="away">assente</span>' : P.bot && g.phase === 'play' ? '<span class="away bot">auto</span>' : '') + (g.last && g.last.by === p ? '<span class="away last">ultimo giro</span>' : '') + '</button>';
    }).join('');
  }

  /* ---------- carte scoperte e mazzi ---------- */
  function market(g, me) {
    var my = me >= 0 && g.phase === 'play' && g.turn === me && (g.stage === 'act' || g.stage === 'draw2'), second = g.stage === 'draw2';
    var face = g.face.map(function (c, i) {
      if (!c) return '<div class="mk-card empty"></div>';
      var no = !my || (second && c === 'L');
      return '<button class="mk-card' + (c === 'L' ? ' loco' : '') + (my && !no ? ' can' : '') + '" data-act="drawface" data-i="' + i + '"' + (no ? ' aria-disabled="true"' : '') + ' aria-label="Prendi carta ' + (c === 'L' ? 'locomotiva' : D.COLORS[c].n) + '">' + ART.card(c) + '</button>';
    }).join('');
    var deckN = g.deck.length, can = my && (deckN || g.disc.length);
    var fcan = me >= 0 && g.phase === 'play' && g.turn === me && g.stage === 'act' && !E.canFerry(g, me);
    return '<div class="mk-face">' + face + '</div><div class="mk-decks">' +
      '<button class="mk-deck' + (can ? ' can' : '') + '" data-act="drawdeck"' + (can ? '' : ' aria-disabled="true"') + ' aria-label="Pesca dal mazzo coperto">' + ART.cardBack() + '<span class="cnt">' + deckN + '</span></button>' +
      '<button class="mk-deck mk-fe' + (fcan ? ' can' : '') + '" data-act="drawferry"' + (fcan ? '' : ' aria-disabled="true"') + ' aria-label="Prendi una carta Traghetto (' + E.ferryPile(g) + ' rimaste)">' + ART.ferryCard() + '<span class="cnt">' + E.ferryPile(g) + '</span></button>' +
      '<button class="mk-tk' + (me >= 0 && g.phase === 'play' && g.turn === me && g.stage === 'act' && g.tdeck.length ? ' can' : '') + '" data-act="drawtickets" aria-label="Pesca 3 biglietti">' + ART.ticketBack() + '<span class="cnt">' + g.tdeck.length + '</span></button></div>';
  }

  /* ---------- cosa fare adesso ---------- */
  function prompt(g, me) {
    var P = me >= 0 ? g.players[me] : null, h = '', help = 'turn', btn = '';
    var last = g.last && g.phase === 'play' ? '<span class="tag-last">Ultimo giro</span> ' : '';
    if (g.phase === 'over') { h = '<b>Partita finita.</b> Vince ' + pname(g, g.final.order[0]) + ' con ' + g.final.rows[g.final.order[0]].total + ' punti.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'score'; }
    else if (g.stage === 'setup') {
      if (P && !P.ready) { h = '<b>Scegli i biglietti di partenza</b>: tienine almeno ' + D.START_KEEP + '. Le città da collegare sono cerchiate sulla mappa.'; btn = '<button class="btn small" data-act="openkeep">Scegli</button>'; help = 'tickets'; }
      else { var w = E.waitingSetup(g).map(function (p) { return pname(g, p); }); h = 'Aspetto che ' + w.join(', ') + ' scelga i biglietti…'; help = 'setup'; }
    } else if (P && g.turn === me) {
      if (g.stage === 'act') { h = last + '<b>Tocca a te!</b> Scegli <b>una</b> azione: pesca 2 carte qui sopra, <b>tocca una tratta</b> sulla mappa per conquistarla, pesca biglietti oppure prendi una carta Traghetto.'; }
      else if (g.stage === 'draw2') { h = last + '<b>Prendi la seconda carta</b> (dalle scoperte o dal mazzo). Come seconda non puoi prendere una locomotiva scoperta.'; help = 'draw'; }
      else if (g.stage === 'tickets') { h = '<b>Scegli quali biglietti tenere</b>: almeno 1.'; btn = '<button class="btn small" data-act="openkeep">Scegli</button>'; help = 'tickets'; }
    } else {
      var T = g.players[g.turn], what = g.stage === 'draw2' ? 'sta pescando la seconda carta' : g.stage === 'tickets' ? 'sta scegliendo i biglietti' : 'sta decidendo';
      h = last + 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + ': ' + what + '…';
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div>' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button>';
  }

  /* ---------- la tua mano ---------- */
  function hand(g, me) {
    var P = g.players[me], cols = D.CARD_COLORS.concat(['L']).filter(function (c) { return P.hand[c] > 0; }), nf = E.ferries(P);
    var cards = cols.length ? cols.map(function (c) { var on = App.focus && App.focus.k === 'color' && App.focus.c === c; return '<button class="hd-c' + (on ? ' on' : '') + '" data-act="focuscolor" data-c="' + c + '" aria-label="' + P.hand[c] + ' carte ' + (c === 'L' ? 'locomotiva' : D.COLORS[c].n) + ': mostra le tratte">' + ART.card(c) + '<span class="n">' + P.hand[c] + '</span></button>'; }).join('')
      : '<span class="muted">Nessuna carta in mano: pescane qualcuna.</span>';
    if (nf) cards += '<button class="hd-c hd-fe" data-act="help" data-r="ferry" aria-label="' + nf + ' carte Traghetto">' + ART.ferryCard() + '<span class="n">' + nf + '</span></button>';
    var done = P.tickets.filter(function (id) { var t = D.tickets[id]; return E.connected(g, me, t.a, t.b); }).length;
    return '<div class="hd-row"><div class="hd-cards">' + cards + '</div>' +
      '<button class="hd-tk" data-act="mytickets" aria-label="I tuoi biglietti">' + IC('ticket') + '<span><b>' + P.tickets.length + '</b><span class="tkw"> bigliett' + (P.tickets.length === 1 ? 'o' : 'i') + '</span><small>' + done + ' arrivat' + (done === 1 ? 'o' : 'i') + '</small></span></button></div>';
  }
  function spectHand(g) { return '<div class="hd-row"><span class="muted">Stai guardando la partita.</span></div>'; }
  function feed(g) { return g.log.slice(-2).map(function (l) { var c = l.p != null && g.players[l.p] ? D.PCOL[g.players[l.p].col].c : 'rgba(217,180,90,.5)'; return '<div class="fl" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join(''); }
  return { render: render, unmount: unmount };
})();
