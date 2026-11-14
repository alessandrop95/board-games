/* ===== Il Forziere Maledetto: schermata di gioco (tavolo rotondo, tracciato, mano) e animazioni =====
   In alto il tracciato con il Forziere e le due bandiere. Poi il tavolo visto dall'alto, come al tavolo vero:
   tu in basso e gli altri capitani intorno nell'ordine dei turni, con nave, barili, distanza da te (verde se
   a tiro) ed equipaggiamenti. Al centro la carta giocata adesso (chi, contro chi, chi deve rispondere), sotto
   il diario delle ultime mosse. Ogni carta che si vede (al centro, nel diario, davanti ai giocatori, in mano)
   si tocca per leggerne le regole; il pulsante Carte apre il catalogo completo. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }

  function sea() { return '<div class="sea" aria-hidden="true"><div class="wv w1"></div><div class="wv w2"></div><div class="wv w3"></div></div>'; }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + sea() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="catalog" aria-label="Tutte le carte">' + IC('cards') + '<span class="hide-s"> Carte</span></button><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-board" id="gv-board"></div>' +
      '<div class="gv-table" id="gv-table"></div><div class="feed" id="gv-feed" aria-live="polite"></div>' + Chat.dockHTML() +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div>' +
      '<div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx();
    setHTML('gv-info', '<b>Il Forziere Maledetto</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Turno ' + g.turnN) + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-board', board(g));
    setHTML('gv-table', table(g, me));
    setHTML('gv-feed', feed(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', me >= 0 ? mine(g, me) : spectator(g));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    document.body.classList.toggle('aiming', App.mode === 'aim');
  }

  /* ---------- tracciato e mare ---------- */
  function board(g) {
    var sp = g.spectre && g.spectre.on != null ? '<span class="bchip ghost" title="Vascello spettrale">' + IC('ghost') + 'Spettro su ' + esc(g.players[g.spectre.on].nick) + '</span>' : '';
    var gg = g.gorgo ? '<span class="bchip gorgo" title="Il Gorgo">' + IC('gorgo') + 'Gorgo: ' + esc(g.players[g.gorgo.at].nick) + '</span>' : '';
    return ART.track(g) + '<div class="bchips"><span class="bchip" title="Bandiere">' + IC('flag') + 'a ' + g.flag + ' passi</span>' +
      '<button class="bchip port" data-act="port" title="Navi in porto">' + IC('ship') + 'Porto: ' + g.row.map(function (s) { return esc(E.SHIPS[s].n); }).join(', ') + '</button>' + sp + gg + '</div>';
  }

  /* ---------- il tavolo rotondo: tu in basso, gli altri intorno nell'ordine dei turni ---------- */
  function ini(n) { return esc(String(n).charAt(0).toUpperCase()); }
  function coins(n) { return n ? '<span class="coins" title="' + n + ' dobloni">' + IC('coin') + n + '</span>' : ''; }
  function pos(k, n) { var a = Math.PI / 2 + 2 * Math.PI * k / n; return { x: 50 + 42 * Math.cos(a), y: 50 + 41 * Math.sin(a) }; }
  var EQI = { cannoniera: 'cannon', coffa: 'range', nebbia: 'wave', polena: 'anchor', fasciame: 'barrel', cassa: 'ammo' };
  function seat(g, p, me, k, n) {
    var P = g.players[p], at = pos(k, n), r = roleOf(g, p), S = P.ship != null ? E.SHIPS[P.ship] : null;
    var turn = g.phase === 'play' && g.turn === p, ask = g.phase === 'play' && g.pend && g.pend.who === p, mine = p === me;
    var dist = '';
    if (me >= 0 && !mine && S && g.players[me].ship != null) {
      var d = E.distance(g, me, p), inR = d <= E.range(g, me, p);
      dist = '<i class="dd' + (inR ? ' in' : '') + '" title="Distanza ' + d + (inR ? ': a tiro della tua nave' : ': fuori tiro') + '">' + d + '</i>';
    }
    var eq = P.eq.map(function (id) { return '<span class="eqm" data-act="seecard" data-id="' + id + '" title="' + esc(E.T[E.ty(id)].n) + '">' + IC(EQI[E.ty(id)] || 'cards') + '</span>'; }).join('');
    var marks = (g.spectre && g.spectre.on === p ? '<span class="mk ghost" title="Vascello spettrale">' + IC('ghost') + '</span>' : '') + (g.gorgo && g.gorgo.at === p ? '<span class="mk gorgo" title="Il Gorgo">' + IC('gorgo') + '</span>' : '');
    return '<div class="seat' + (turn ? ' turn' : '') + (ask ? ' ask' : '') + (mine ? ' mine' : '') + (S ? '' : ' noship') + (at.y < 35 ? ' top' : '') + '" role="button" tabindex="0" data-act="opp" data-p="' + p + '" style="left:' + at.x.toFixed(1) + '%;top:' + at.y.toFixed(1) + '%;--pc:' + pcol(g, p) + '" aria-label="' + esc(P.nick) + '">' +
      '<span class="sav">' + ini(P.nick) + dist + marks + '</span>' +
      '<span class="snm">' + Net.dot(P.uid) + esc(mine ? 'Tu' : P.nick) + '</span>' + ART.roleBadge(r) +
      '<span class="ssh">' + (S ? esc(S.n) : 'senza nave') + '</span>' + (S ? ART.barrels(P.bar, E.maxBar(g, p)) : '') +
      '<span class="smt"><span title="Carte in mano">' + IC('cards') + P.hand.length + '</span>' + coins(P.dbl) + (P.bot && g.phase !== 'over' ? '<span class="sauto">' + (P.away ? 'assente' : 'auto') + '</span>' : '') + '</span>' +
      (eq ? '<span class="seq">' + eq + '</span>' : '') + (ask ? '<span class="sask">risponde…</span>' : turn ? '<span class="sturn">di turno</span>' : '') + '</div>';
  }
  // al centro: la carta di cui si parla adesso, chi l'ha giocata e contro chi
  function lastPlay(g) {
    for (var i = g.fx.length - 1; i >= 0; i--) { var e = g.fx[i]; if (e.k === 'turn') return null; if (e.k === 'play' && !e.resp) return e; }
    return null;
  }
  function center(g, me) {
    var c = null, txt = '', who = function (p) { return '<b class="pn-c" style="--pc:' + pcol(g, p) + '">' + esc(p === me ? 'Tu' : g.players[p].nick) + '</b>'; };
    if (g.phase === 'over') { txt = '<b>Partita finita</b><br>' + (g.final.solo != null ? 'vince ' + who(g.final.solo) : 'vince ' + E.NAT[g.final.team]); }
    else if (g.pend) {
      var pd = g.pend; c = pd.card;
      txt = who(pd.by) + (pd.by === me ? ' giochi' : ' gioca') + ' <b>' + esc(c != null ? E.T[E.ty(c)].n : pd.label) + '</b><br>' + (pd.who != null ? 'ora risponde ' + who(pd.who) : '');
    } else if (g.step === 'spectre' && g.spectreRev != null) { c = g.spectreRev; txt = 'Vascello spettrale su ' + who(g.turn) + ': serve il simbolo <b>' + E.SYM[E.CARDS[c].s] + '</b>'; }
    else {
      var e = lastPlay(g);
      if (e) { c = e.c; txt = who(e.p) + (e.p === me ? ' giochi' : ' gioca') + ' <b>' + esc(E.T[E.ty(c)].n) + '</b>' + (e.t != null && e.t !== e.p ? '<br>contro ' + who(e.t) : ''); }
      else txt = g.step === 'ship' ? who(g.turn) + (g.turn === me ? ' scegli' : ' sceglie') + ' una nave' : g.turn === me ? '<b>Tocca a te!</b>' : 'Tocca a ' + who(g.turn);
    }
    var card = c != null ? '<button class="midc" data-act="seecard" data-id="' + c + '" aria-label="Leggi la carta ' + esc(E.T[E.ty(c)].n) + '">' + ART.card(c) + '<i>' + IC('eye') + '</i></button>' : '<span class="midc empty">' + ART.back() + '</span>';
    return '<div class="tmid">' + card + '<div class="midt">' + txt + '</div><div class="midp"><span title="Carte nel mazzo">' + IC('cards') + g.deck.length + '</span><span title="Dobloni nella Clessidra">' + IC('hourglass') + g.glass + '</span></div></div>';
  }
  function table(g, me) {
    var n = g.players.length, base = me >= 0 ? me : 0, h = '';
    for (var k = 0; k < n; k++) h += seat(g, (base + k) % n, me, k, n);
    return '<div class="felt n' + n + '">' + center(g, me) + h + '</div>';
  }
  // il diario: le ultime mosse, sempre visibili; quelle con una carta si toccano per leggerla
  function feed(g, me) {
    var L = g.log.filter(function (l) { return l.k !== 'draw' || l.c != null; }).slice(-4).reverse();
    return '<button class="feed-all" data-act="log">' + IC('log') + ' Diario</button>' + L.map(function (l, i) {
      var col = l.p != null && g.players[l.p] ? pcol(g, l.p) : 'rgba(242,193,78,.6)';
      return '<div class="fl k-' + l.k + (i ? '' : ' new') + '" style="--pc:' + col + '">' + (l.c != null ? '<button class="flc" data-act="seecard" data-id="' + l.c + '" aria-label="Leggi la carta">' + ART.card(l.c) + '</button>' : '') + '<span>' + esc(l.t) + '</span></div>';
    }).join('');
  }

  /* ---------- la mia plancia ---------- */
  function mine(g, me) {
    var P = g.players[me], S = P.ship != null ? E.SHIPS[P.ship] : null, C = E.CAPS[P.cap], R = E.ROLES[P.role], myTurn = g.phase === 'play' && g.turn === me && !g.pend;
    var ammo = S ? E.ammo(g, me) : 0, left = Math.max(0, ammo - (myTurn ? g.shots : 0));
    var head = '<div class="me-h" style="--pc:' + pcol(g, me) + '"><button class="mrole" data-act="myrole" style="--rc:' + ART.roleColor(P.role) + '">' + IC(R.lead ? 'crown' : R.solo ? 'sword' : P.role === 'PI' ? 'skull' : 'anchor') + '<span><small>' + (P.up ? 'Il tuo ruolo (scoperto)' : 'Il tuo ruolo segreto') + '</small><b>' + esc(R.n) + '</b></span></button>' +
      '<button class="mcap" data-act="mycap">' + ART.capFace(P.cap, pcol(g, me)) + '<span><small>Capitano</small><b>' + esc(C.n) + '</b></span></button>' + coins(P.dbl) + '</div>';
    var ship = S ? '<button class="mship" data-act="myship">' + ART.shipArt(P.ship, { flag: pcol(g, me) }) + '<span class="ms-t"><b>' + esc(S.n) + '</b>' + ART.barrels(P.bar, E.maxBar(g, me)) +
      '<span class="ms-s"><span title="Gittata">' + IC('range') + E.range(g, me, null) + '</span><span title="Munizioni rimaste in questo turno">' + IC('ammo') + left + '/' + ammo + '</span><span title="Valore">' + IC('chest') + S.f + '</span></span></span></button>'
      : '<div class="mship none">' + IC('ship') + '<span>Senza nave: al tuo turno ne prenderai una nuova.</span></div>';
    var eq = P.eq.length ? '<div class="meq">' + P.eq.map(function (id) { return '<button class="eqc big" data-act="seecard" data-id="' + id + '">' + esc(E.T[E.ty(id)].n) + '</button>'; }).join('') + '</div>' : '';
    return head + '<div class="me-b">' + ship + eq + '</div>' + hand(g, me);
  }
  function hand(g, me) {
    var P = g.players[me], myTurn = g.phase === 'play' && g.turn === me && !g.pend && g.step === 'play', drop = App.mode === 'drop';
    var h = P.hand.map(function (id) {
      var can = myTurn && (E.playable(g, me, id) || (E.isCap(g, me, 'lia') && E.ty(id) === 'virata' && E.playable(g, me, id, 'atk')));
      var sel = drop ? App.drop.indexOf(id) >= 0 : App.card === id;
      return '<button class="hc' + (can && !drop ? ' can' : '') + (sel ? ' sel' : '') + '" data-act="hand" data-id="' + id + '" aria-label="' + esc(E.T[E.ty(id)].n) + '">' + ART.card(id) + '</button>';
    }).join('');
    return '<div class="hand' + (drop ? ' dropping' : '') + '" style="--n:' + Math.max(5, P.hand.length) + '">' + (h || '<span class="muted empty">Nessuna carta in mano</span>') + '</div>';
  }
  function spectator(g) { return '<p class="lead" style="padding:8px 4px">Stai guardando la partita.</p>'; }

  /* ---------- cosa fare adesso ---------- */
  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') {
      var f = g.final; h = '<b>Partita finita.</b> ' + (f.solo != null ? 'Vince ' + pname(g, f.solo) + ', ' + esc(E.ROLES[g.players[f.solo].role].n) + '.' : 'Vince la flotta di <b>' + E.NAT[f.team] + '</b>.');
      btn = '<button class="btn small" data-act="showover">Risultato</button>'; help = 'end';
    } else if (g.pend) {
      var pd = g.pend;
      if (pd.who === me) { h = '<b>Tocca a te rispondere</b>: ' + pendText(g, me); btn = '<button class="btn small" data-act="openresp">Rispondi</button>'; help = pd.k === 'duel' ? 'cards' : 'cards'; }
      else h = pname(g, pd.who) + ' deve rispondere a ' + esc(pd.label || 'una carta') + ' di ' + pname(g, pd.by) + '…';
    } else if (g.turn === me) {
      if (g.step === 'ship') { h = '<b>Tocca a te!</b> Sei senza nave: scegline una.'; btn = '<button class="btn small" data-act="openships">Scegli la nave</button>'; help = 'ships'; }
      else if (g.step === 'spectre') { h = '<b>Il Vascello spettrale</b> è sulla tua nave: rispondi con lo stesso simbolo.'; btn = '<button class="btn small" data-act="openspectre">Rispondi</button>'; help = 'spectre'; }
      else if (App.mode === 'aim') { h = 'Tocca la nave ' + (E.isAtk(g, me, App.card, App.as) ? 'da colpire' : 'bersaglio') + ' per <b>' + esc(E.T[E.ty(App.card)].n) + '</b>.'; btn = '<button class="btn small ghost" data-act="cancel">Annulla</button>'; help = 'distance'; }
      else if (App.mode === 'drop') { var ex = P.hand.length - 5; h = 'Scegli <b>' + ex + (ex > 1 ? ' carte' : ' carta') + '</b> da scartare (ne tieni 5). Selezionate: ' + App.drop.length + '.'; btn = '<button class="btn small" data-act="dodrop"' + (App.drop.length === ex ? '' : ' disabled') + '>Scarta e passa</button><button class="btn small ghost" data-act="cancel">Annulla</button>'; }
      else if (g.step === 'sunk') { h = '<b>La tua nave è affondata</b>: il turno finisce.'; btn = '<button class="btn small" data-act="end">Fine turno</button>'; help = 'sink'; }
      else { var S = P.ship != null ? E.ammo(g, me) : 0; h = '<b>Tocca a te!</b> Gioca le carte che vuoi (attacchi: ' + Math.max(0, S - g.shots) + ' su ' + S + '), poi passa.'; btn = '<button class="btn small" data-act="end">Fine turno</button>'; }
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else {
      var T = g.players[g.turn];
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + (g.step === 'ship' ? ': sceglie una nave…' : g.step === 'spectre' ? ': il Vascello spettrale è sulla sua nave…' : '…');
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function pendText(g, me) {
    var pd = g.pend, by = pname(g, pd.by);
    if (pd.k === 'shot') return by + ' ti colpisce con ' + esc(pd.label) + (pd.dmg > 1 ? ' (' + pd.dmg + ' barili)' : '') + (pd.need > 1 ? ': servono ' + (pd.need - pd.got) + ' Virate' : '') + '.';
    if (pd.k === 'need') return 'il Mostro degli abissi di ' + by + ': scarta una Bordata o perdi 1 barile.';
    if (pd.k === 'duel') return 'Sfida a sciabole con ' + pname(g, pd.cur === pd.to ? pd.by : pd.to) + ': scarta una Bordata o perdi 1 barile.';
    return by + ' gioca ' + esc(pd.label) + ' contro di te.';
  }

  /* ---------- effetti ---------- */
  function rectOf(n) { return n ? n.getBoundingClientRect() : null; }
  function tileOf(p) { return document.querySelector('.seat[data-p="' + p + '"]'); }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + Math.min(r.height / 2, 60)) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1700);
  }
  function shake(p) { var t = tileOf(p); if (!t || reduce) return; t.classList.remove('shake'); void t.offsetWidth; t.classList.add('shake'); setTimeout(function () { t.classList.remove('shake'); }, 600); }
  function shot(a, b, cls) {
    var ra = rectOf(tileOf(a)), rb = rectOf(tileOf(b)); if (!ra || !rb || reduce) return Promise.resolve();
    var d = document.createElement('div'); d.className = 'ball ' + (cls || ''); document.body.appendChild(d);
    var x0 = ra.left + ra.width / 2, y0 = ra.top + Math.min(ra.height / 2, 50), x1 = rb.left + rb.width / 2, y1 = rb.top + Math.min(rb.height / 2, 50);
    d.style.left = x0 + 'px'; d.style.top = y0 + 'px';
    var lift = -Math.min(120, Math.abs(x1 - x0) * .3 + 40);
    try { return d.animate([{ transform: 'translate(0,0) scale(.6)' }, { transform: 'translate(' + (x1 - x0) / 2 + 'px,' + ((y1 - y0) / 2 + lift) + 'px) scale(1.15)' }, { transform: 'translate(' + (x1 - x0) + 'px,' + (y1 - y0) + 'px) scale(.8)' }], { duration: 520, easing: 'cubic-bezier(.3,.6,.4,1)' }).finished.then(function () { d.remove(); }, function () { d.remove(); }); }
    catch (e) { d.remove(); return Promise.resolve(); }
  }
  function popCard(id, title) {
    var b = document.createElement('div'); b.className = 'popcard'; b.innerHTML = '<div>' + ART.card(id) + '<small>' + title + '</small></div>';
    document.body.appendChild(b); setTimeout(function () { b.classList.add('out'); setTimeout(function () { b.remove(); }, 350); }, 1500);
  }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 3500); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'over' && !App.sheet) { App.sheet = { kind: 'over' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (Q.length > 8 || news.length > 16) { Q = []; news = news.filter(function (e) { return e.k === 'over' || e.k === 'sink'; }); }
    news.forEach(function (e) { plan(g, me, e); });
  }
  var ATK_SND = { bordata: 'cannon', incatenate: 'cannon', arrembaggio: 'musket', moschetto: 'musket', virata: 'cannon', burrasca: 'gorgo', mostro: 'gorgo' };
  function plan(g, me, e) {
    var nm = function (p) { return esc(g.players[p] ? g.players[p].nick : ''); };
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); return sleep(300); }); break;
      case 'turn': if (e.p === me) enqueue(function () { Sound.play('turn'); banner('Tocca a te!', ''); return sleep(500); }); break;
      case 'play': {
        var t = E.ty(e.c), name = E.T[t].n;
        enqueue(function () {
          if (e.resp) { Sound.play('shield'); floatTxt(rectOf(tileOf(e.p)), esc(name), 'good'); return sleep(350); }
          floatTxt(rectOf(tileOf(e.p)), esc(name), E.kind(e.c) === 'eq' ? 'good' : '');
          if (e.t != null && e.t !== e.p) { Sound.play(ATK_SND[t] || 'play'); return shot(e.p, e.t, E.isAtk(g, e.p, e.c, t === 'virata' ? 'atk' : null) ? '' : 'card'); }
          Sound.play(ATK_SND[t] || 'play'); return sleep(350);
        });
        break;
      }
      case 'hit': enqueue(function () { Sound.play('hit'); shake(e.p); floatTxt(rectOf(tileOf(e.p)), '−' + e.n + ' ' + IC('barrel'), 'bad'); return sleep(450); }); break;
      case 'miss': enqueue(function () { Sound.play('miss'); floatTxt(rectOf(tileOf(e.p)), 'Mancato!', 'good'); return sleep(400); }); break;
      case 'heal': enqueue(function () { Sound.play('heal'); floatTxt(rectOf(tileOf(e.p)), '+' + e.n + ' ' + IC('barrel'), 'good'); return sleep(250); }); break;
      case 'sink': enqueue(function () {
        Sound.play('splash'); setTimeout(function () { Sound.play('sink'); }, 250);
        var R = E.ROLES[e.role];
        banner((e.p === me ? 'La tua nave affonda!' : 'Affonda la nave di ' + nm(e.p) + '!'), 'Era ' + (e.role === 'PI' ? 'il ' : R.lead ? 'l’' : 'un ') + esc(R.n) + (e.to !== e.from ? ' · il Forziere va verso ' + (e.to < e.from ? 'Levante' : 'Ponente') : ''));
        setTimeout(function () { Sound.play('chest'); }, 1100);
        return sleep(1600);
      }); break;
      case 'promo': enqueue(function () { Sound.play('promo'); banner(nm(e.p) + ' è promosso Ammiraglio', ''); return sleep(1200); }); break;
      case 'doubloon': enqueue(function () { Sound.play('coin'); floatTxt(rectOf(tileOf(e.p)), '+1 ' + IC('coin'), 'gold'); return sleep(500); }); break;
      case 'glass': enqueue(function () { Sound.play('coin'); return sleep(200); }); break;
      case 'reveal': enqueue(function () { Sound.play(e.why === 'polena' ? 'pick' : 'ghost'); popCard(e.c, e.why === 'polena' ? 'Polena di ' + nm(e.p) : e.why === 'gorgo' ? 'Il Gorgo' : 'Vascello spettrale'); return sleep(1300); }); break;
      case 'answer': enqueue(function () { floatTxt(rectOf(tileOf(e.p)), 'Risponde: ' + esc(E.T[E.ty(e.c)].n), 'good'); return sleep(500); }); break;
      case 'spectre': enqueue(function () { if (e.on != null) { Sound.play('ghost'); floatTxt(rectOf(tileOf(e.on)), IC('ghost') + ' Vascello spettrale', 'ghost'); } return sleep(400); }); break;
      case 'gorgo': enqueue(function () { Sound.play('gorgo'); banner('Si apre il Gorgo!', 'La Clessidra è vuota: chi non risponde fa finire la partita'); return sleep(1800); }); break;
      case 'deckend': enqueue(function () { banner('Il mazzo è finito', 'Un doblone lascia la Clessidra e le bandiere si avvicinano'); return sleep(1400); }); break;
      case 'steal': enqueue(function () { Sound.play('pick'); if (e.from != null) shot(e.from, e.p, 'card'); return sleep(400); }); break;
      case 'trash': enqueue(function () { Sound.play('pick'); floatTxt(rectOf(tileOf(e.from)), e.c != null ? 'Perde ' + esc(E.T[E.ty(e.c)].n) : 'Perde una carta', 'bad'); return sleep(400); }); break;
      case 'peek': if (e.p === me) enqueue(function () { App.sheet = { kind: 'peek', p: e.t }; renderSheet(); return sleep(200); }); break;
      case 'draw': if (e.p === me && e.why !== 'turn') enqueue(function () { Sound.play('draw'); floatTxt(rectOf(document.querySelector('.hand')), '+' + e.c + ' ' + IC('cards'), 'good'); return sleep(150); }); else if (e.p === me) enqueue(function () { Sound.play('draw'); return sleep(100); }); break;
      case 'ship': enqueue(function () { Sound.play('chest'); floatTxt(rectOf(tileOf(e.p)), esc(E.SHIPS[e.s].n), 'good'); return sleep(400); }); break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); App.sheet = { kind: 'over', fresh: true }; renderSheet(); return sleep(100); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#f2c14e', '#c0392b', '#2d6fb8', '#fff6c8', '#2f8f55'];
    for (var i = 0; i < 60; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, banner: banner, pendText: pendText };
})();
