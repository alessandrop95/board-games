/* ===== Sushi Go!: schermata di gioco (la mano, il vassoio, i vassoi degli altri) e animazioni =====
   Tutti scelgono insieme: la mano è in basso, si tocca una carta e poi «Prendo». Quando tutti hanno scelto
   le carte volano sui vassoi e la mano scivola via verso il vicino. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  var ORDER = ['mk3', 'mk2', 'mk1', 'tem', 'sas', 'dum', 'was', 'nsq', 'nsa', 'neg', 'pud', 'cho'];
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }

  function backdrop() { return '<div class="sky" aria-hidden="true"><div class="belt"><i></i></div><div class="lanterns">' + [12, 38, 64, 88].map(function (x, i) { return '<span class="lan" style="left:' + x + '%;animation-delay:-' + i * .8 + 's"></span>'; }).join('') + '</div></div>'; }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + backdrop() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-opp" id="gv-opp"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div>' +
      '<div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx(), mi = me >= 0 ? me : 0;
    setHTML('gv-info', '<b>Sushi Go!</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Manche ' + g.round + ' di 3') + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-opp', opponents(g, mi));
    setHTML('gv-mid', tray(g, mi, me));
    setHTML('gv-prompt', prompt(g, me));
    setHTML('gv-me', hand(g, mi, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }

  /* ---------- vassoi ---------- */
  // carte sul tavolo raggruppate per tipo, con quanto manca per fare punti
  function groups(T) {
    var gs = {};
    T.forEach(function (c) { var k = c.k === 'was' && c.nig ? 'was+' : c.k; (gs[k] = gs[k] || []).push(c); });
    return gs;
  }
  function note(T, k) {
    var n = E.count(T, k);
    if (k === 'tem') return n % 2 ? n + ' · manca 1' : n + ' · ' + n / 2 * 5 + ' pt';
    if (k === 'sas') return n % 3 ? n + ' · mancano ' + (3 - n % 3) : n + ' · ' + n / 3 * 10 + ' pt';
    if (k === 'dum') return n + ' · ' + E.DUMP[Math.min(5, n)] + ' pt';
    if (k === 'was') return 'aspetta un nigiri';
    if (k === 'pud') return n + ' budin' + (n > 1 ? 'i' : 'o');
    if (k === 'cho') return 'pronte';
    return '';
  }
  function trayCards(g, T, o) {
    o = o || {};
    var gs = groups(T), keys = ORDER.concat(['was+']).filter(function (k) { return gs[k]; });
    keys.sort(function (a, b) { return ORDER.indexOf(a.replace('+', '')) - ORDER.indexOf(b.replace('+', '')) + (a === 'was+' ? .5 : 0) - (b === 'was+' ? .5 : 0); });
    if (!keys.length) return '<span class="empty">' + (o.big ? 'Il vassoio è vuoto: scegli la prima carta!' : 'vuoto') + '</span>';
    var mk = E.makiOf(T);
    return keys.map(function (k) {
      var cs = gs[k], base = k.replace('+', ''), lab = k === 'was+' ? cs.map(function (c) { return E.NIGIRI[c.nig] * 3; }).join('+') + ' pt' : base.charAt(0) === 'm' && base.length === 3 && base !== 'mk' ? '' : E.NIGIRI[base] ? cs.length * E.NIGIRI[base] + ' pt' : note(T, base);
      var cards = cs.map(function (c, i) { return '<span class="tc' + (i ? ' tail' : '') + '">' + (k === 'was+' ? '<span class="wasn">' + ART.flat('was', !o.big) + '<span class="on">' + ART.flat(c.nig, !o.big) + '</span></span>' : ART.flat(c.k, !o.big)) + '</span>'; }).join('');
      return '<span class="tg" data-k="' + k + '">' + cards + (o.big && lab ? '<small>' + lab + '</small>' : '') + '</span>';
    }).join('') + (mk && o.big ? '<span class="mkt" title="Rotolini di maki">' + ART.chipIcon('mk1') + '<b>' + mk + '</b></span>' : '');
  }
  function status(g, p) {
    var P = g.players[p];
    if (g.phase === 'pick') return P.pick ? '<span class="tag ok">' + IC('check') + ' scelto</span>' : '<span class="tag wait">sceglie…</span>';
    if (g.phase === 'scores' && P.ready && !P.bot) return '<span class="tag ok">pronto</span>';
    return '';
  }
  function opponents(g, mi) {
    return g.players.map(function (P, p) {
      if (p === mi) return '';
      return '<button class="opp" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b></span>' +
        '<span class="opp-s"><span class="sc-tot" title="Punti">' + P.total + ' pt</span><span class="pudc" title="Budini">' + ART.chipIcon('pud') + P.pud + '</span>' + (P.bot && !P.away ? '<span class="tag bot">auto</span>' : P.away ? '<span class="tag away">assente</span>' : '') + '</span>' +
        '<span class="trayo" data-p="' + p + '">' + trayCards(g, P.table) + '</span><span class="opp-t">' + status(g, p) + '</span></button>';
    }).join('');
  }
  function tray(g, mi, me) {
    var P = g.players[mi], s = E.partScore(P.table);
    var now = s.tem + s.sas + s.dum + s.nig;
    return '<div class="mytray" data-p="' + mi + '"><div class="mt-h"><b>' + (mi === me ? 'Il tuo vassoio' : 'Vassoio di ' + esc(P.nick)) + '</b><span class="muted">' + now + ' pt + maki · ' + ART.chipIcon('pud') + P.pud + ' · totale ' + P.total + '</span></div>' +
      '<div class="tray big">' + trayCards(g, P.table, { big: true }) + '</div></div>';
  }
  function hand(g, mi, me) {
    var P = g.players[mi];
    if (g.phase !== 'pick') return '<div class="mine hand-area"><p class="muted" style="text-align:center">' + (g.phase === 'over' ? 'Partita finita.' : 'Manche finita: si contano i punti.') + '</p></div>';
    if (me < 0) return '<div class="mine hand-area"><p class="muted">Stai guardando la partita.</p></div>';
    var picked = P.pick ? P.pick.cards : [], sel = picked.length ? picked : App.sel;
    var cards = P.hand.map(function (k, i) { var on = sel.indexOf(i) >= 0; return '<button class="hcard' + (on ? ' sel' : '') + (picked.length ? ' locked' : '') + '" data-act="hcard" data-i="' + i + '" aria-label="' + E.NAME[k] + '">' + ART.flat(k) + '</button>'; }).join('');
    return '<div class="mine hand-area' + (P.pick ? '' : ' on') + '" style="--pc:' + pcol(g, mi) + '"><div class="mine-h"><b>La tua mano</b><span class="muted">' + P.hand.length + ' carte · poi la passi ' + (E.dir(g) > 0 ? 'a sinistra' : 'a destra') + ' a ' + esc(g.players[(mi + E.dir(g) + g.players.length) % g.players.length].nick) + '</span></div>' +
      '<div class="handrow" id="handrow" style="--n:' + P.hand.length + '">' + cards + '</div></div>';
  }

  function prompt(g, me) {
    var h = '', btn = '', help = 'turn', P = me >= 0 ? g.players[me] : null;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> ' + (g.winners.length > 1 ? 'Vincono ' + g.winners.map(function (i) { return pname(g, i); }).join(' e ') : 'Vince ' + pname(g, g.winners[0])) + '.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (g.phase === 'scores') { h = '<b>Manche ' + g.round + ' finita.</b> Guarda i punti e preparati alla prossima.'; btn = '<button class="btn small" data-act="showround">Punti</button>'; help = 'cards'; }
    else if (!P) h = 'Tutti stanno scegliendo una carta…';
    else if (P.pick) {
      var w = E.pending(g);
      h = 'Hai scelto <b>' + P.pick.cards.map(function (i) { return E.NAME[P.hand[i]]; }).join(' e ') + '</b>. Aspetto ' + w.map(function (i) { return pname(g, i); }).join(', ') + '…';
      btn = '<button class="btn small ghost" data-act="unpick">Cambio</button>';
    } else {
      var need = App.cho ? 2 : 1, n = App.sel.length;
      h = App.cho ? (n < 2 ? '<b>Bacchette</b>: scegli <b>due</b> carte (' + n + ' di 2).' : 'Prendi <b>' + App.sel.map(function (i) { return E.NAME[P.hand[i]]; }).join(' e ') + '</b>?') : n ? 'Prendi <b>' + E.NAME[P.hand[App.sel[0]]] + '</b>?' : '<b>Scegli una carta</b> dalla tua mano.';
      if (n === need) btn = '<button class="btn small" data-act="dopick">Prendo</button>';
      if (E.hasCho(P) && P.hand.length >= 2) btn += '<button class="btn small ghost" data-act="cho">' + (App.cho ? 'Una sola' : 'Usa le bacchette') + '</button>';
      if (P.bot) btn += '<button class="btn small" data-act="resume">Riprendo io</button>';
      help = App.cho ? 'special' : 'turn';
    }
    return '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }

  /* ---------- animazioni ---------- */
  function rectOf(n) { return n ? n.getBoundingClientRect() : null; }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1600);
  }
  function pop(n, d) { if (n) anim(n, [{ transform: 'scale(.4) translateY(-30px)', opacity: 0 }, { transform: 'scale(1.12)', opacity: 1, offset: .6 }, { transform: 'scale(1)', opacity: 1 }], { duration: 480, delay: d || 0, easing: 'cubic-bezier(.3,.7,.3,1)', fill: 'backwards' }); }
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4000); }
  function idle() { return !qBusy && !Q.length; }
  function fx(g, me) {
    if (App.lastFxN && g.fxN < App.lastFxN) App.lastFxN = 0;
    if (App.lastFxN == null || !App.seenFirstDoc) { App.lastFxN = g.fxN; if (g.phase === 'scores' && !App.sheet) { App.sheet = { kind: 'round' }; renderSheet(); } return; }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    if (Q.length > 6 || news.length > 12) { Q = []; news = news.filter(function (e) { return e.k === 'roundEnd' || e.k === 'over'; }); }
    news.forEach(function (e) { plan(g, me, e); });
  }
  function plan(g, me, e) {
    switch (e.k) {
      case 'deal': enqueue(function () { Sound.play('deal'); banner('Manche ' + e.round + ' di 3', e.hs + ' carte a testa'); var r = el('handrow'); if (r) Array.prototype.forEach.call(r.children, function (c, i) { pop(c, i * 60); }); return sleep(900); }); break;
      case 'picked': if (e.p !== me && e.on) enqueue(function () { Sound.play('pick'); return sleep(40); }); break;
      case 'reveal':
        enqueue(function () {
          Sound.play('flip', {});
          e.plays.forEach(function (x) {
            var box = x.p === me ? document.querySelector('.tray.big') : document.querySelector('.trayo[data-p="' + x.p + '"]');
            x.ks.forEach(function (k) { var grp = box && box.querySelector('.tg[data-k="' + (k === 'was' ? 'was' : E.NIGIRI[k] && x.wasabi ? 'was+' : k) + '"]'); if (grp) pop(grp.lastElementChild && grp.lastElementChild.classList.contains('tc') ? grp.lastElementChild : grp.querySelector('.tc:last-of-type')); });
            if (x.p !== me) floatTxt(rectOf(box), x.ks.map(function (k) { return ART.chipIcon(k); }).join(''), 'icons');
            if (x.wasabi) { Sound.play('good'); floatTxt(rectOf(box), 'Wasabi ×3!', 'col'); }
            if (x.cho) floatTxt(rectOf(box), 'Bacchette!', 'col');
          });
          return sleep(650);
        });
        break;
      case 'pass':
        enqueue(function () { Sound.play('draw'); var r = el('handrow'); if (r) anim(r, [{ transform: 'translateX(' + (e.d > 0 ? '-' : '') + '60%)', opacity: 0 }, { transform: 'none', opacity: 1 }], { duration: 420, easing: 'cubic-bezier(.3,.7,.3,1)' }); return sleep(300); });
        break;
      case 'roundEnd': enqueue(function () { App.sheet = { kind: e.over ? 'over' : 'round', fresh: true }; renderSheet(); Sound.play('col'); return sleep(200); }); break;
      case 'over': enqueue(function () { var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) confetti(); return sleep(100); }); break;
      case 'next': enqueue(function () { if (App.sheet && App.sheet.kind === 'round') { App.sheet = null; renderSheet(); } return sleep(50); }); break;
    }
  }
  function banner(t, sub) { var b = document.createElement('div'); b.className = 'banner'; b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 2200); }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#ff7a45', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#8fe3ff'];
    for (var i = 0; i < 60; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, trayCards: trayCards, banner: banner };
})();
