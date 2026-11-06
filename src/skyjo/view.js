/* ===== Skyjo: schermata di gioco (griglie, mazzo, scarti) e animazioni =====
   Le carte volano dal mazzo e dagli scarti alle griglie, si girano in 3D, le colonne uguali esplodono verso gli scarti.
   Lo stato si disegna subito com'è; le animazioni partono dopo, nascondendo per un attimo le carte che stanno «volando». */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }
  function skyOf(g) { return ((g.round - 1) % 4) + 1; }   // alba, giorno, tramonto, notte

  function clouds() {
    var o = '';
    for (var i = 0; i < 7; i++) o += '<i class="cl" style="top:' + (6 + (i * 13) % 80) + '%;--s:' + (.6 + (i % 3) * .3).toFixed(2) + ';animation-duration:' + (70 + i * 17) + 's;animation-delay:-' + (i * 23) + 's"></i>';
    for (var k = 0; k < 18; k++) o += '<b class="st" style="left:' + ((k * 37) % 100) + '%;top:' + ((k * 23) % 60) + '%;animation-delay:-' + (k * .7).toFixed(1) + 's"></b>';
    return '<div class="sky" aria-hidden="true"><div class="sun"></div>' + o + '</div>';
  }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + clouds() +
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
    el('gv').setAttribute('data-sky', skyOf(g));
    el('gv').classList.toggle('last', g.ender != null && g.phase === 'play');
    setHTML('gv-info', '<b>Skyjo' + (g.opts.action ? ' Action' : '') + '</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Manche ' + g.round) + (g.opts.elim ? ' · eliminazione a ' : ' · fino a ') + g.opts.target + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-opp', opponents(g, mi));
    setHTML('gv-mid', middle(g, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', mainBoard(g, mi, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    applyHide();
  }

  /* ---------- griglie ---------- */
  function canCell(g, p, i, me) {
    var P = g.players[p], x = P.grid[i];
    if (p !== me || !x) return false;
    if (g.phase === 'reveal') return !x.up && E.flips(P) < 2;
    if (g.phase !== 'play' || g.turn !== me || P.bonus || g.chain) return false;
    if (g.pick) return App.pickC != null && (App.pickC >= 0 || !x.up);
    if (App.mode === 'drop') return !x.up;
    return App.mode === 'take' || !!g.drawn;
  }
  function boardHTML(g, p, o) {
    o = o || {};
    var P = g.players[p], me = o.me, h = '', viewer = myIdx(), seen = {};
    if (viewer >= 0 && g.players[viewer].seen) g.players[viewer].seen.forEach(function (s) { if (s.t === p) seen[s.i] = s.v; });
    for (var i = 0; i < 12; i++) {
      var x = P.grid[i], can = o.big && canCell(g, p, i, me);
      if (!x) { h += '<span class="slot gone" data-i="' + i + '"></span>'; continue; }
      var pk = !x.up && seen[i] != null && seen[i] === x.v ? '<i class="peek" title="L’hai sbirciata">' + ART.lab(x.v) + '</i>' : '';
      h += '<' + (o.big ? 'button' : 'span') + ' class="slot' + (can ? ' can' + (App.mode === 'drop' || g.phase === 'reveal' || (g.pick && App.pickC === -1) ? ' flip' : '') : '') + '" data-i="' + i + '"' + (o.big ? ' data-act="cell" aria-label="' + (x.up ? 'Carta ' + ART.lab(x.v) : 'Carta coperta' + (pk ? ' (l’hai sbirciata: ' + ART.lab(x.v) + ')' : '')) + '"' : '') + '>' +
        ART.card(x.up ? x.v : null, x.up, { mini: !o.big }) + pk + '</' + (o.big ? 'button' : 'span') + '>';
    }
    return '<div class="board' + (o.big ? ' big' : '') + '" data-p="' + p + '">' + h + '</div>';
  }
  function stats(g, p) {
    var P = g.players[p], vis = E.upSum(P), hid = E.hidden(P).length;
    if (P.out) return '<span class="sc-tot" title="Totale della partita">Σ ' + P.total + '</span>';
    return '<span class="sc-vis" title="Punti delle carte scoperte">' + (g.phase === 'reveal' && !E.flips(P) ? '–' : E.sv(vis).replace('+', '')) + '</span>' + (hid ? '<span class="sc-hid" title="Carte coperte">+' + hid + '?</span>' : '') + '<span class="sc-tot" title="Totale della partita">Σ ' + P.total + '</span>';
  }
  function tags(g, p) {
    var P = g.players[p], o = '';
    if (P.out) return '<span class="tag out">eliminato</span>';
    if (g.ender === p && g.phase === 'play') o += '<span class="tag end">' + IC('flag') + ' ha chiuso</span>';
    if (P.away) o += '<span class="tag away">assente</span>'; else if (P.bot && g.phase !== 'over') o += '<span class="tag bot">auto</span>';
    if (g.phase === 'reveal' && (E.flips(P) < 2 || P.bonus)) o += '<span class="tag wait">sceglie…</span>';
    if (g.phase === 'scores' && P.ready && !P.bot) o += '<span class="tag ok">pronto</span>';
    return o;
  }
  function opponents(g, mi) {
    return g.players.map(function (P, p) {
      if (p === mi) return '';
      var on = g.phase === 'play' && g.turn === p;
      return '<button class="opp' + (on ? ' on' : '') + (P.out ? ' out' : '') + '" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s">' + stats(g, p) + '</span>' + (P.out ? '<span class="opp-outb">' + IC('x') + '</span>' : boardHTML(g, p, {})) + (g.opts.action && P.acts.length ? '<span class="opp-a">' + P.acts.map(function (c) { return '<span class="achip-s" title="' + ART.ANAME[c.k] + '">' + ART.aicon(c.k) + '</span>'; }).join('') + '</span>' : '') + '<span class="opp-t">' + tags(g, p) + '</span></button>';
    }).join('');
  }
  function mainBoard(g, mi, me) {
    var P = g.players[mi], on = g.phase === 'play' && g.turn === mi;
    if (P.out) return '<div class="mine out" style="--pc:' + pcol(g, mi) + '"><div class="mine-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + (mi === me ? ' (tu)' : '') + '</b>' + tags(g, mi) + '<span class="mine-s">' + stats(g, mi) + '</span></div>' +
      '<p class="out-note">' + (mi === me ? 'Sei arrivato a ' + P.total + ' punti e sei stato eliminato.' : esc(P.nick) + ' è stato eliminato.') + ' La partita continua finché ne resta uno solo.</p></div>';
    return '<div class="mine' + (on ? ' on' : '') + (g.opts.action ? ' withacts' : '') + '" style="--pc:' + pcol(g, mi) + '"><div class="mine-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + (mi === me ? ' (tu)' : '') + '</b>' + tags(g, mi) + '<span class="mine-s">' + stats(g, mi) + '</span></div>' +
      boardHTML(g, mi, { big: true, me: me }) + (g.opts.action ? actHand(g, mi, me) : '') + '</div>';
  }
  // le carte Azione in mano (le mie si toccano per giocarle)
  function actHand(g, p, me) {
    var P = g.players[p];
    if (!P.acts.length) return '<div class="ahand empty"><span class="muted">' + (p === me ? 'Nessuna carta Azione: le prendi quando trovi una stella' : 'Nessuna carta Azione') + (P.rb ? ' · bonus stelle ' + P.rb : '') + '</span></div>';
    return '<div class="ahand">' + P.acts.map(function (c, j) {
      var ok = p === me && E.usable(g, P, j) && g.phase === 'play' && g.turn === me && g.ender == null;
      return '<button class="achip' + (ok ? ' ok' : '') + (App.tgt && App.tgt.via === 'use' && App.tgt.j === j ? ' sel' : '') + '" data-act="myact" data-p="' + p + '" data-j="' + j + '" style="--ac:' + ART.ACOL[c.k][1] + '">' + ART.aicon(c.k) + '<span>' + ART.ANAME[c.k] + '</span>' + (p === me && !E.usable(g, P, j) ? '<small>nuova</small>' : '') + '</button>';
    }).join('') + '<span class="apen" title="Ogni carta Azione in mano a fine manche vale +10">+' + P.acts.length * 10 + '</span>' + (P.rb ? '<span class="apen good">' + P.rb + '</span>' : '') + '</div>';
  }

  /* ---------- centro: mazzo, carta pescata, scarti ---------- */
  function middle(g, me) {
    var mine = g.phase === 'play' && g.turn === me, top = g.disc[g.disc.length - 1], under = g.disc[g.disc.length - 2];
    var deckCan = mine && !g.drawn, discCan = mine && (!g.drawn ? true : g.drawn.from === 'deck' && E.hidden(g.players[me]).length > 0);
    var stack = ''; for (var k = 0; k < Math.min(4, Math.ceil(g.deck.length / 20)); k++) stack += '<span class="stk" style="--k:' + k + '">' + ART.card(null, false) + '</span>';
    var deck = '<button class="pile deck' + (deckCan ? ' can' : '') + '" data-act="deck" aria-label="Mazzo, ' + g.deck.length + ' carte"' + (deckCan ? '' : ' aria-disabled="true"') + '>' + stack + '<span class="pl">Mazzo <i>' + g.deck.length + '</i></span></button>';
    var hand = g.pick ? '<div class="hand pick" id="hand"><span class="hslot"></span><span class="pick3">' + g.pick.cards.map(function (v, c) { return '<button class="pk' + (App.pickC === c ? ' sel' : '') + '"' + (mine ? ' data-act="pickc" data-c="' + c + '"' : ' aria-disabled="true"') + ' aria-label="Tieni ' + ART.lab(v) + '">' + ART.card(v, true) + '</button>'; }).join('') + '</span><span class="pl">' + (mine ? 'Scegline una' : 'Pesca tre') + '</span></div>'
      : '<div class="hand' + (g.drawn ? ' full' : '') + '" id="hand"><span class="hslot">' + (g.drawn ? '<span class="hc-card">' + ART.card(g.drawn.v, true) + '</span>' : '<span class="hand-empty">' + (g.phase === 'play' ? (mine ? 'Pesca o prendi' : 'Tocca a ' + esc(g.players[g.turn].nick)) : '') + '</span>') + '</span><span class="pl">' + (g.drawn ? (mine ? 'Pescata da te' : 'Pescata da ' + esc(g.players[g.turn].nick)) : 'In mano') + '</span></div>';
    var disc = '<button class="pile disc' + (discCan ? ' can' : '') + (App.mode === 'take' ? ' picked' : '') + (App.mode === 'drop' ? ' dropping' : '') + '" data-act="disc" aria-label="Scarti' + (top != null ? ', in cima ' + ART.lab(top) : '') + '"' + (discCan ? '' : ' aria-disabled="true"') + '>' +
      (under != null ? '<span class="under">' + ART.card(under, true) + '</span>' : '') + (top != null ? '<span class="dtop">' + ART.card(top, true) + '</span>' : '<span class="dempty"></span>') + '<span class="pl">' + (mine && g.drawn && g.drawn.from === 'deck' ? 'Scarta' : 'Scarti') + '</span></button>';
    var last = g.ender != null && g.phase === 'play' ? '<div class="lastbar">' + IC('flag') + ' Ultimo giro: ' + pname(g, g.ender) + ' ha scoperto tutto</div>' : '';
    return last + '<div class="piles">' + deck + hand + disc + '</div>' + (g.opts.action ? actStrip(g, me) : '');
  }
  function actStrip(g, me) {
    var P = me >= 0 ? g.players[me] : null, bonus = P && P.bonus && (g.phase === 'reveal' || g.turn === me);
    var free = P && g.phase === 'play' && g.turn === me && !g.drawn && !g.pick && !g.chain && !P.bonus && g.ender == null;
    var can = bonus || free;
    return '<div class="astrip' + (bonus ? ' bonus' : '') + '"><button class="apile' + (can && (g.adeck.length || g.adisc.length) ? ' can' : '') + '" data-act="arow" data-r="deck" aria-label="Mazzo delle Azioni, ' + g.adeck.length + ' carte">' + ART.acard(null) + '<span class="pl">Azioni <i>' + g.adeck.length + '</i></span></button>' +
      g.arow.map(function (k, r) { return k ? '<button class="arc' + (can ? ' can' : '') + '" data-act="arow" data-r="' + r + '" aria-label="Carta Azione ' + ART.ANAME[k] + '">' + ART.acard(k) + '</button>' : '<span class="arc empty"></span>'; }).join('') +
      (g.adisc.length ? '<span class="adisc" title="Carte Azione scartate">' + ART.aicon(g.adisc[g.adisc.length - 1]) + '<i>' + g.adisc.length + '</i></span>' : '') + '</div>';
  }

  /* ---------- cosa fare adesso ---------- */
  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Vincono ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'game'; }
    else if (g.phase === 'scores') { h = '<b>Manche ' + g.round + ' finita.</b> Guarda i punti e preparati alla prossima.'; btn = '<button class="btn small" data-act="showround">Punti</button>'; help = 'end'; }
    else if (P && P.out) { h = '<b>Sei stato eliminato</b> con ' + P.total + ' punti: guardi la partita fino alla fine.'; help = 'elim'; }
    else if (P && P.bonus && (g.phase === 'reveal' || g.turn === me)) { h = '<b>Una stella!</b> Prendi una carta <b>Azione</b>: tocca una carta della fila o il mazzo delle Azioni.'; btn = '<button class="btn small ghost" data-act="bonusskip">Rinuncia</button>'; help = 'action'; }
    else if (g.phase === 'reveal') {
      help = 'setup';
      if (P && E.flips(P) < 2) h = '<b>Scopri ' + (2 - E.flips(P)) + (E.flips(P) ? ' altra carta' : ' carte') + '</b> della tua griglia: toccale.';
      else { var w = E.pending(g); h = 'Aspetto che ' + w.map(function (i) { return pname(g, i); }).join(', ') + ' ' + (w.length > 1 ? 'scoprano' : 'scopra') + ' le prime carte…'; }
    } else if (g.turn === me && g.chain) {
      h = 'Gioca <b>' + ART.ANAME[g.chain.k] + '</b>' + (g.chain.via === 'steal' ? ', la carta che hai rubato' : ', ripescata dagli scarti') + ': scegli i bersagli.'; btn = '<button class="btn small" data-act="tgtopen">Scegli</button>'; help = 'action';
    } else if (g.turn === me && g.pick) {
      h = App.pickC == null ? 'Tocca la carta che vuoi <b>tenere</b> tra le tre pescate.' : App.pickC === -1 ? 'Le scarti tutte: tocca una tua carta <b>coperta</b> da scoprire.' : 'Tieni il <b>' + E.sv(g.pick.cards[App.pickC]) + '</b>: tocca la carta della tua griglia da sostituire.';
      if (E.hidden(P).length) btn = '<button class="btn small ghost" data-act="pickc" data-c="-1">Nessuna</button>'; help = 'action';
    } else if (g.turn === me && App.tgt && App.tgt.via === 'use') {
      h = 'Stai giocando <b>' + ART.ANAME[App.tgt.k] + '</b>.'; btn = '<button class="btn small" data-act="tgtopen">Scegli i bersagli</button><button class="btn small ghost" data-act="tcancel">Annulla</button>'; help = 'action';
    } else if (g.turn === me) {
      if (App.mode === 'take') { h = 'Prendi il <b>' + E.sv(g.disc[g.disc.length - 1]) + '</b>: tocca la carta della tua griglia da sostituire.'; btn = '<button class="btn small ghost" data-act="cancel">Annulla</button>'; }
      else if (App.mode === 'drop') { h = 'Scarti il <b>' + E.sv(g.drawn.v) + '</b>: tocca una tua carta <b>coperta</b> da scoprire.'; btn = '<button class="btn small ghost" data-act="cancel">Annulla</button>'; }
      else if (g.drawn) { h = 'Hai pescato ' + (g.drawn.v === E.STAR ? 'una <b>stella</b> (vale 0, jolly)' : 'un <b>' + E.sv(g.drawn.v) + '</b>') + ': tocca la carta della tua griglia da sostituire, oppure scartalo.'; if (E.hidden(P).length) btn = '<button class="btn small" data-act="disc">Scarta e scopri</button>'; }
      else h = '<b>Tocca a te' + (g.ender != null ? ' — ultimo turno!' : '!') + '</b> Pesca dal <b>mazzo</b> o prendi il <b>' + E.sv(g.disc[g.disc.length - 1]) + '</b> dagli scarti.';
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else {
      var T = g.players[g.turn];
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + (T.bonus ? ': sceglie una carta Azione…' : g.pick ? ': sceglie tra tre carte…' : g.chain ? ': gioca <b>' + ART.ANAME[g.chain.k] + '</b>…' : g.drawn ? ': ha pescato ' + (g.drawn.v === E.STAR ? 'una <b>stella</b>' : 'un <b>' + E.sv(g.drawn.v) + '</b>') + '…' : ': sta scegliendo…');
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- carte nascoste durante le animazioni ---------- */
  function cellEl(p, i) { return document.querySelector('.board[data-p="' + p + '"] .slot[data-i="' + i + '"]'); }
  function boardEl(p) { return document.querySelector('.board[data-p="' + p + '"]'); }
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
    var dur = o.dur || 520;
    return anim(f, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ') rotate(' + (o.r0 || 0) + 'deg)', offset: 0 },
      { transform: 'translate(' + (dx / 2) + 'px,' + (dy / 2 + lift) + 'px) scale(' + ((sx + 1) / 2 * 1.08) + ') rotate(' + ((o.r0 || 0) / 2 + 4) + 'deg)', offset: .5 },
      { transform: 'translate(0,0) scale(1) rotate(0deg)', offset: 1 }
    ], { duration: dur, easing: 'cubic-bezier(.3,.7,.3,1)', delay: o.delay || 0, fill: 'both' }).then(function () { if (!o.keep) f.remove(); return f; });
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

  /* ---------- coda degli effetti ---------- */
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }

  function fx(g, me) {
    // partita nuova sullo stesso tavolo (anche se la sala d'attesa non si è vista): i contatori ripartono da zero
    if (App.lastFxN && g.fxN < App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    // troppe cose arretrate (telefono in pausa): niente animazioni, solo lo stato
    if (Q.length > 6 || news.length > 12) { Q = []; App.hide = {}; applyHide(); news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over'; }); }
    news.forEach(function (e) { plan(g, me, e); });
    applyHide();
  }
  function plan(g, me, e) {
    var k;
    switch (e.k) {
      case 'deal': {
        for (var p = 0; p < g.players.length; p++) for (var i = 0; i < 12; i++) hide('c:' + p + ':' + i, 'ghost');
        enqueue(function () {
          Sound.play('deal');
          var deck = cardRect(document.querySelector('.pile.deck .stk')), jobs = [];
          g.players.forEach(function (P, p) { for (var i = 0; i < 12; i++) (function (p, i) {
            var c = cellEl(p, i), big = c && c.closest('.board.big'), delay = big ? i * 45 : 200 + i * 15;
            jobs.push(fly(ART.card(null, false), deck, cardRect(c), { delay: delay, dur: big ? 420 : 360, arc: -20 }).then(function () { unhide('c:' + p + ':' + i); }));
          })(p, i); });
          return Promise.all(jobs);
        });
        break;
      }
      case 'flip': {
        k = 'c:' + e.p + ':' + e.i; hide(k, 'down');
        enqueue(function () { unhide(k); flipIn(cellEl(e.p, e.i)); Sound.play('flip', { v: E.val(e.v) }); if (e.v === E.STAR || e.v <= 0) floatTxt(cardRect(cellEl(e.p, e.i)), ART.lab(e.v), 'good'); return sleep(e.open ? 220 : 380); });
        break;
      }
      case 'draw': {
        hide('hand', 'ghost');
        enqueue(function () {
          Sound.play('draw');
          var from = cardRect(document.querySelector('.pile.deck .stk:last-child') || document.querySelector('.pile.deck')), to = rectOf(document.querySelector('#hand .hslot'));
          return fly(ART.card(e.v, true, { cls: 'flipin' }), from, to, { dur: 560, arc: -40 }).then(function () { unhide('hand'); });
        });
        break;
      }
      case 'swap': {
        k = 'c:' + e.p + ':' + e.i; hide(k, 'ghost'); hide('disc', 'ghost'); if (e.from === 'deck') hide('hand', 'ghost');
        enqueue(function () {
          var cell = cellEl(e.p, e.i), to = cardRect(cell), dtop = cardRect(document.querySelector('.pile.disc .dtop') || document.querySelector('.pile.disc'));
          var src = e.from === 'disc' ? dtop : rectOf(document.querySelector('#hand .hslot'));
          Sound.play('place');
          var a = fly(ART.card(e.v, true), src, to, { dur: 520 }).then(function () { unhide(k); if (e.from === 'deck') unhide('hand'); });
          var b = fly(ART.card(e.old, true, { cls: e.wasUp ? '' : 'flipin' }), to, dtop, { dur: 620, delay: 120, arc: -30 }).then(function () { unhide('disc'); });
          return Promise.all([a, b]);
        });
        break;
      }
      case 'drop': {
        hide('disc', 'ghost');
        enqueue(function () {
          Sound.play('drop');
          var src = rectOf(document.querySelector('#hand .hslot')), dtop = cardRect(document.querySelector('.pile.disc .dtop'));
          return fly(ART.card(e.v, true), src, dtop, { dur: 420, arc: -20 }).then(function () { unhide('disc'); });
        });
        break;
      }
      case 'col': {
        // le tre carte restano visibili (copie ferme) finché non tocca a loro volare via
        var ph = [];
        hide('disc', 'ghost');
        (e.cells || E.colCells(e.c)).forEach(function (i) {
          var r = rectOf(cellEl(e.p, i)); if (!r) return;
          var big = cellEl(e.p, i).closest('.board.big');
          var f = document.createElement('div'); f.className = 'flyer still' + (big ? ' bigc' : ''); f.innerHTML = ART.card(e.v, true, { mini: !big });
          f.style.left = r.left + 'px'; f.style.top = r.top + 'px'; f.style.width = r.width + 'px'; f.style.height = r.height + 'px';
          document.body.appendChild(f); ph.push({ f: f, r: r });
        });
        enqueue(function () {
          Sound.play('col');
          ph.forEach(function (x) { x.f.classList.add('glow'); });
          var mid = ph[1] && ph[1].r; if (mid) floatTxt(mid, (e.r != null ? 'Riga' : 'Colonna') + (e.v === E.STAR ? ' di stelle! ' + e.bonus : ' di ' + ART.lab(e.v) + '!'), 'col');
          return sleep(650).then(function () {
            var dtop = cardRect(document.querySelector('.pile.disc .dtop') || document.querySelector('.pile.disc'));
            return Promise.all(ph.map(function (x, j) {
              burst(x.r);
              return anim(x.f, [{ transform: 'translate(0,0) scale(1)' }, { transform: 'translate(' + (dtop.left - x.r.left) + 'px,' + (dtop.top - x.r.top) + 'px) scale(' + (dtop.width / x.r.width) + ') rotate(' + (j * 8 - 8) + 'deg)' }], { duration: 560, delay: j * 110, easing: 'cubic-bezier(.5,0,.4,1)', fill: 'forwards' }).then(function () { x.f.remove(); });
            }));
          }).then(function () { ph.forEach(function (x) { x.f.remove(); }); unhide('disc'); burst(cardRect(document.querySelector('.pile.disc .dtop')), ['#fff', '#ffe36b', '#a6e57a']); });
        });
        break;
      }
      case 'ender':
        enqueue(function () { Sound.play('ender'); banner(e.p === me ? 'Hai scoperto tutto!' : esc(g.players[e.p].nick) + ' ha scoperto tutto!', 'Ultimo giro per gli altri'); return sleep(1300); });
        break;
      case 'turn':
        if (e.p === me) enqueue(function () { Sound.play('turn'); if (e.last) banner('Ultimo turno!', 'poi si contano i punti'); else if (e.extra) banner('Turno extra!'); else pulse(); return sleep(e.last || e.extra ? 900 : 100); });
        break;
      case 'star':
        enqueue(function () { Sound.play('star'); var b = e.p === me ? document.querySelector('.mine .mine-h') : document.querySelector('.opp[data-p="' + e.p + '"]'); floatTxt(rectOf(b), '★ carta Azione', 'col'); return sleep(250); });
        break;
      case 'agrab': {
        enqueue(function () {
          Sound.play('grab');
          var src = e.r === 'deck' ? cardRect(document.querySelector('.apile')) : cardRect(document.querySelector('.arc[data-r="' + e.r + '"]'));
          var dst = e.p === me ? rectOf(document.querySelector('.mine .ahand .achip:last-of-type') || document.querySelector('.mine .ahand')) : rectOf(document.querySelector('.opp[data-p="' + e.p + '"]'));
          if (dst && src) dst = { left: dst.left + dst.width / 2 - src.width * .3, top: dst.top + dst.height / 2 - src.height * .3, width: src.width * .6, height: src.height * .6 };
          return fly(ART.acard(e.ak), src, dst, { dur: 600, arc: -40 });
        });
        break;
      }
      case 'ause': enqueue(function () { Sound.play('action'); return played(e.ak, (e.p === me ? 'Giochi' : esc(g.players[e.p].nick) + ' gioca') + ' «' + ART.ANAME[e.ak] + '»'); }); break;
      case 'chain': case 'steal':
        enqueue(function () { Sound.play('action'); if (e.k === 'steal') floatTxt(rectOf(e.t === me ? document.querySelector('.mine .mine-h') : document.querySelector('.opp[data-p="' + e.t + '"]')), 'Furto!', 'col'); return played(e.ak, (e.k === 'steal' ? (e.p === me ? 'Rubi' : esc(g.players[e.p].nick) + ' ruba') : (e.p === me ? 'Ripeschi' : esc(g.players[e.p].nick) + ' ripesca')) + ' «' + ART.ANAME[e.ak] + '»'); });
        break;
      case 'toss': enqueue(function () { Sound.play('drop'); return sleep(100); }); break;
      case 'exch': case 'swap2': {
        var A = e.k === 'exch' ? { p: e.p1, i: e.i1 } : { p: e.p, i: e.i1 }, Bq = e.k === 'exch' ? { p: e.p2, i: e.i2 } : { p: e.p, i: e.i2 };
        var ka = 'c:' + A.p + ':' + A.i, kb = 'c:' + Bq.p + ':' + Bq.i; hide(ka, 'ghost'); hide(kb, 'ghost');
        enqueue(function () {
          Sound.play('place');
          var ra = cardRect(cellEl(A.p, A.i)), rb = cardRect(cellEl(Bq.p, Bq.i)), G2 = G();
          function html(q) { var x = G2 && G2.players[q.p].grid[q.i]; return x ? ART.card(x.up ? x.v : null, x.up) : ART.card(null, false); }
          return Promise.all([fly(html(A), rb, ra, { dur: 650 }).then(function () { unhide(ka); }), fly(html(Bq), ra, rb, { dur: 650, delay: 80 }).then(function () { unhide(kb); })]);
        });
        break;
      }
      case 'draw3':
        enqueue(function () {
          Sound.play('draw');
          var from = cardRect(document.querySelector('.pile.deck .stk:last-child') || document.querySelector('.pile.deck'));
          return Promise.all([0, 1, 2].map(function (c) { return fly(ART.card(e.cards[c], true, { cls: 'flipin' }), from, cardRect(document.querySelector('.pick3 .pk:nth-child(' + (c + 1) + ')')), { dur: 520, delay: c * 120, arc: -30 }); }));
        });
        break;
      case 'pick': {
        k = 'c:' + e.p + ':' + e.i; hide(k, e.c === -1 ? 'down' : 'ghost');
        enqueue(function () {
          var cellR = cardRect(cellEl(e.p, e.i)), src = rectOf(document.querySelector('#hand .hslot'));
          if (e.c === -1) { unhide(k); flipIn(cellEl(e.p, e.i)); Sound.play('flip', { v: E.val(e.v) }); return sleep(300); }
          Sound.play('place');
          return fly(ART.card(e.v, true), src, cellR, { dur: 520 }).then(function () { unhide(k); });
        });
        break;
      }
      case 'look':
        enqueue(function () {
          Sound.play('pick');
          if (e.p === me) { App.sheet = { kind: 'peek', t: e.t, row: e.row, col: e.col, cells: e.cells }; renderSheet(); }
          else floatTxt(rectOf(e.t === me ? document.querySelector('.mine .board') : document.querySelector('.opp[data-p="' + e.t + '"]')), 'Sbirciata!', '');
          return sleep(300);
        });
        break;
      case 'rm':
        (e.done || []).forEach(function (d) { if (d.i != null) hide('c:' + d.p + ':' + d.i, 'down'); });
        enqueue(function () {
          Sound.play('col');
          (e.done || []).forEach(function (d) {
            if (d.i != null) { var c = cellEl(d.p, d.i); burst(cardRect(c), ['#ff8a7a', '#fff', '#ffd75e']); unhide('c:' + d.p + ':' + d.i); flipIn(c); }
            else floatTxt(rectOf(d.p === me ? document.querySelector('.mine .ahand') : document.querySelector('.opp[data-p="' + d.p + '"]')), 'Azione tolta', '');
          });
          return sleep(500);
        });
        break;
      case 'shield':
        enqueue(function () { Sound.play('shield'); floatTxt(rectOf(e.p === me ? document.querySelector('.mine .mine-h') : document.querySelector('.opp[data-p="' + e.p + '"]')), 'Scudo!', 'col'); return sleep(600); });
        break;
      case 'extra': enqueue(function () { if (e.p !== me) floatTxt(rectOf(document.querySelector('.opp[data-p="' + e.p + '"]')), '+' + e.x + ' turni', 'col'); return sleep(100); }); break;
      case 'reshuffle': enqueue(function () { Sound.play('shuffle'); toast('Il mazzo era finito: ho rimescolato gli scarti.'); return sleep(300); }); break;
      case 'reveal': {
        e.cells.forEach(function (c) { hide('c:' + c.p + ':' + c.i, 'down'); });
        enqueue(function () {
          return Promise.all(e.cells.map(function (c, j) { return sleep(120 + j * 70).then(function () { unhide('c:' + c.p + ':' + c.i); flipIn(cellEl(c.p, c.i)); if (j % 3 === 0) Sound.play('flip', {}); }); })).then(function () { return sleep(500); });
        });
        break;
      }
      case 'roundEnd':
        enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); var r = G() && G().roundRes; if (r && r.doubled) setTimeout(function () { Sound.play('double'); }, 900); if (r && r.out && r.out.indexOf(me) >= 0) setTimeout(function () { Sound.play('out'); }, 1500); return sleep(200); });
        break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
      case 'next': enqueue(function () { if (App.sheet && App.sheet.kind === 'round') { App.sheet = null; renderSheet(); } return sleep(50); }); break;
    }
  }
  // la carta Azione giocata compare grande al centro per un attimo
  function played(k, txt) {
    if (reduce) { toast(txt); return Promise.resolve(); }
    var d = document.createElement('div'); d.className = 'played'; d.innerHTML = '<span class="pl-card">' + ART.acard(k) + '</span><b>' + txt + '</b><small>' + esc(E.ACTS[k][1]) + '</small>';
    document.body.appendChild(d); setTimeout(function () { d.remove(); }, 1900);
    return sleep(1100);
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
  return { render: render, unmount: unmount, fx: fx, idle: idle, boardHTML: boardHTML, banner: banner };
})();
