/* ===== Campi d'Acciaio: schermata di gioco =====
   In alto i giocatori, al centro la mappa, sotto la barra con le istruzioni e la tua plancia.
   Le azioni si preparano sulla mappa (anteprima locale) e partono solo quando confermi. */
var Game = (function () {
  var mountedFor = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }

  function mount() {
    var g = G();
    $('#app').innerHTML = '<div class="gv" id="gv">' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-players" id="gv-players"></div>' + Chat.dockHTML() +
      '<div class="gv-map"><div id="gv-board" class="gv-board"></div><div class="gv-feed" id="gv-feed" data-act="log"></div>' +
      '<div class="gv-zoom"><button class="zb" data-act="zin" aria-label="Avvicina">+</button><button class="zb" data-act="zout" aria-label="Allontana">−</button><button class="zb" data-act="zfit" aria-label="Mostra tutta la mappa">⤢</button></div></div>' +
      '<div class="gv-prompt" id="gv-prompt" aria-live="polite"></div><div class="gv-mat" id="gv-mat"></div></div>';
    var active = g.players.map(function (P) { return F[P.fac].base; });
    var inactive = E.KEYS.filter(function (k) { return E.HEX[k].t === 'H' && active.indexOf(k) < 0; });
    Board.mount(el('gv-board'), { inactive: inactive, flags: g.players.map(function (P) { return { k: F[P.fac].base, color: F[P.fac].col }; }), onTap: onTap });
    mountedFor = App.code;
    var me = myIdx();
    setTimeout(function () { var h = me >= 0 ? E.hero(g, me) : null; if (h && window.innerWidth < 700) Board.centerOn(h.h, 0.62); else Board.fit(); }, 120);
  }
  function unmount() { if (mountedFor) { Board.unmount(); mountedFor = null; } }
  function render() {
    if (mountedFor !== App.code || !el('gv') || !Board.mounted()) mount();
    var g = G(), me = myIdx(), v = view(g, me);
    Board.update(v.g, v.opts);
    setHTML('gv-info', info(g));
    setHTML('gv-players', players(g, me));
    setHTML('gv-prompt', prompt(g, me, v));
    setHTML('gv-mat', me >= 0 ? mat(g, me) : '');
    setHTML('gv-feed', feed(g));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
  }
  function info(g) {
    var t = g.phase === 'over' ? 'Partita finita' : 'Turno ' + g.round;
    return '<b>Campi d’Acciaio</b> <span class="muted">· ' + connInfo(t + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>';
  }

  /* ---------- piano locale (anteprima delle mosse) ---------- */
  function startPlan(k, extra) { var g = G(); App.plan = { k: k, seq: g.seq, moves: [], sel: null, carry: 0, hexes: [] }; for (var x in extra || {}) App.plan[x] = extra[x]; }
  function simMoves(g, me) {
    var sim = clone(g), moved = [];
    App.plan.moves.forEach(function (m) { if (!E.validateMove(sim, me, m, moved, App.plan.k === 'fmove' ? 2 : undefined)) E.doMove(sim, me, m, moved); });
    return { sim: sim, moved: moved };
  }
  function view(g, me) {
    var opts = { hl: {}, arrows: [] }, show = g, plan = App.plan;
    if (!plan || me < 0) {
      if (g.pend && g.pend.k === 'combat') opts.hl[g.pend.h] = 'fight';
      return { g: g, opts: opts };
    }
    var P = g.players[me];
    if (plan.k === 'move' || plan.k === 'fmove') {
      var s = simMoves(g, me), max = plan.k === 'fmove' ? 1 : E.moveCount(P);
      show = s.sim;
      opts.arrows = plan.moves.map(function (m) { return [m.from, m.to]; });
      if (plan.sel) {
        opts.sel = plan.sel;
        var tg = E.moveTargets(show, me, plan.sel, plan.k === 'fmove' ? 2 : undefined);
        Object.keys(tg).forEach(function (k) { opts.hl[k] = E.fightersAt(show, me, k).length ? 'fight' : E.enemiesAt(show, me, k).length ? 'push' : 'reach'; });
      } else if (plan.moves.length < max) {
        opts.pickUnits = {}; E.myUnits(show, me).forEach(function (u) { if (s.moved.indexOf(u.id) < 0 && Object.keys(E.moveTargets(show, me, u.id, plan.k === 'fmove' ? 2 : undefined)).length) opts.pickUnits[u.id] = true; });
      }
      plan._moved = s.moved; plan._sim = show;
    } else if (plan.k === 'produce') {
      Object.keys(E.produceHexes(g, me)).forEach(function (k) { opts.hl[k] = plan.hexes.indexOf(k) >= 0 ? 'chosen' : 'pick'; });
    } else if (plan.k === 'deploy' || plan.k === 'build' || plan.k === 'trade' || plan.k === 'fwk') {
      var cand = plan.k === 'deploy' ? E.deployHexes(g, me) : plan.k === 'build' ? E.buildHexes(g, me) : workerHexes(g, me);
      Object.keys(cand).forEach(function (k) { opts.hl[k] = plan.hex === k ? 'chosen' : 'pick'; });
    }
    return { g: show, opts: opts };
  }
  function workerHexes(g, me) { var o = {}; E.myUnits(g, me, 'W').forEach(function (u) { if (E.isTerr(u.h) && E.HEX[u.h].t !== 'L') o[u.h] = true; }); return o; }

  /* ---------- tocchi sulla mappa ---------- */
  function onTap(k, uid) {
    var g = G(), me = myIdx(), plan = App.plan;
    if (!g) return;
    if (plan && me >= 0 && (plan.k === 'move' || plan.k === 'fmove')) {
      var sim = plan._sim || g, moved = plan._moved || [], max = plan.k === 'fmove' ? 1 : E.moveCount(g.players[me]);
      var u = uid ? E.unit(sim, uid) : null;
      if (u && u.p === me && moved.indexOf(u.id) < 0 && plan.moves.length < max && (!plan.sel || uid !== plan.sel || !k || !E.moveTargets(sim, me, plan.sel)[k])) {
        if (plan.sel === uid) { plan.sel = null; } else { plan.sel = uid; plan.carry = 0; Sound.play('tap'); }
        render(); return;
      }
      if (plan.sel && k) {
        var tg = E.moveTargets(sim, me, plan.sel, plan.k === 'fmove' ? 2 : undefined);
        if (tg[k]) {
          var mu = E.unit(sim, plan.sel), carry = [];
          if (mu.k === 'M' && E.HEX[k].t !== 'L' && E.HEX[k].t !== 'H') carry = E.myUnits(sim, me, 'W').filter(function (w) { return w.h === mu.h && moved.indexOf(w.id) < 0; }).slice(0, plan.carry).map(function (w) { return w.id; });
          var left = E.unitsAt(sim, mu.h).filter(function (x) { return x.p === me && x.id !== mu.id && carry.indexOf(x.id) < 0; }).length;
          plan.moves.push({ u: plan.sel, to: k, from: mu.h, carry: carry, res: left === 0 });
          plan.sel = null; Sound.play(mu.k === 'M' ? 'mech' : 'march'); render(); return;
        }
        toast(whyNot(sim, me, plan.sel, k)); return;
      }
      if (k && !u) { hexSheet(k); return; }
      return;
    }
    if (plan && plan.k === 'produce' && k) {
      var ok = E.produceHexes(g, me);
      if (!ok[k]) { toast('Qui non puoi produrre: servono tuoi lavoratori (o il tuo mulino) in un territorio che produce.'); return; }
      var i = plan.hexes.indexOf(k);
      if (i >= 0) plan.hexes.splice(i, 1); else if (plan.hexes.length < E.produceCount(g.players[me])) plan.hexes.push(k); else { toast('Puoi scegliere al massimo ' + E.produceCount(g.players[me]) + ' territori: togline uno prima.'); return; }
      render(); return;
    }
    if (plan && (plan.k === 'deploy' || plan.k === 'build' || plan.k === 'trade' || plan.k === 'fwk') && k) {
      var cand = plan.k === 'deploy' ? E.deployHexes(g, me) : plan.k === 'build' ? E.buildHexes(g, me) : workerHexes(g, me);
      if (!cand[k]) { toast(plan.k === 'build' ? 'Si costruisce dove hai un lavoratore, in un territorio senza strutture (non sui laghi).' : 'Scegli un territorio illuminato: ci deve essere un tuo lavoratore.'); return; }
      plan.hex = k; render(); return;
    }
    if (uid) { unitToast(g, uid); return; }
    if (k) hexSheet(k);
  }
  function hexSheet(k) { App.sheet = { kind: 'hex', k: k }; renderSheet(); }
  function unitToast(g, uid) {
    var u = E.unit(g, uid); if (!u) return;
    var P = g.players[u.p], f = F[P.fac];
    var what = u.k === 'C' ? f.heroFull : u.k === 'M' ? 'Mech «' + f.mechs[+uid.slice(uid.indexOf('M') + 1)].n + '»' : 'Lavoratore';
    toast('<b class="fc-' + P.fac + '">' + esc(what) + '</b> · ' + esc(P.nick) + ' (' + f.short + ') · ' + esc(tname(u.h)));
  }
  function whyNot(g, me, uid, k) {
    var u = E.unit(g, uid), H = E.HEX[k];
    if (H.t === 'H') return 'Nelle basi non si entra.';
    if (H.t === 'L') return 'Nei laghi entra solo chi ha l’abilità giusta (Navigatori o Sommergibili).';
    if (u.k === 'W' && E.enemiesAt(g, me, k).length) return 'I lavoratori non entrano dove ci sono nemici.';
    var nb = E.NB[u.h].filter(function (n) { return n.k === k; })[0];
    if (nb && nb.river) return 'C’è un fiume in mezzo: per attraversarlo serve il Guado (o i Nuotatori per i lavoratori).';
    return 'Troppo lontano: ci si muove di un territorio alla volta (le gallerie sono collegate tra loro).';
  }

  /* ---------- barra dei giocatori ---------- */
  function players(g, me) {
    var cur = E.decider(g);
    return g.players.map(function (P, p) {
      var f = F[P.fac], on = g.ts && g.ts.p === p, dec = cur === p;
      return '<button class="pchip fc-b-' + P.fac + (on ? ' on' : '') + (dec && !on ? ' dec' : '') + (p === me ? ' me' : '') + '" data-act="player" data-p="' + p + '">' +
        '<span class="pp">' + ART.portrait(P.fac, 30) + '</span><span class="pn"><b>' + Net.dot(P.uid) + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="ps">' +
        '<i class="st">' + IC('star') + P.stars.length + '</i><i>' + IC('coin') + P.coins + '</i><i>' + IC('pop') + P.pop + '</i><i>' + IC('power') + P.power + '</i></span></span>' +
        (P.bot && !/^bot-/.test(P.uid) ? '<span class="away">auto</span>' : '') + '</button>';
    }).join('');
  }
  function feed(g) {
    return g.log.slice(-3).map(function (l, i, a) { var c = typeof l.k === 'number' && g.players[l.k] ? ' fc-l-' + g.players[l.k].fac : ''; return '<div class="fl' + c + (i === a.length - 1 ? ' last' : '') + '" data-n="' + l.n + '">' + esc(l.t) + '</div>'; }).join('');
  }

  /* ---------- plancia ---------- */
  function topLine(P, top, g, p) {
    var u = P.ups;
    if (top === 'move') return (2 + u.mvU) + ' unità o ' + (1 + u.mvC) + (u.mvC ? ' monete' : ' moneta');
    if (top === 'bolster') return '+' + (2 + u.bpP) + ' potere o ' + (1 + u.bpC) + (u.bpC ? ' carte' : ' carta');
    if (top === 'trade') return '2 risorse o +' + (1 + u.trP) + ' popol.';
    if (top === 'produce') return (2 + u.prH) + ' territori';
    if (top === 'factory') return D.FACTORY[P.fcard].d.replace(/:.*$/, '');
    return '';
  }
  function upPips(P, top) { var ups = top === 'factory' ? [] : D.TOP[top].ups; return ups.map(function (k) { return '<i class="pip' + (P.ups[k] ? ' on' : '') + '" title="' + D.UPS[k].n + '"></i>'; }).join(''); }
  function mat(g, me) {
    var P = g.players[me], m = D.MATS[P.mat], t = E.resTotals(g, me), f = F[P.fac], cur = g.ts && g.ts.p === me ? g.ts : null;
    var stats = '<div class="mstats"><span class="mtitle">' + ART.portrait(P.fac, 26) + '<b>' + f.n + '</b><small>plancia ' + m.n.toLowerCase() + '</small></span>' +
      '<span class="chips"><i title="Monete">' + IC('coin') + P.coins + '</i><i title="Potere">' + IC('power') + P.power + '</i><i title="Popolarità">' + IC('pop') + P.pop + '</i><i title="Carte combattimento">' + IC('card') + P.hand.length + '</i>' +
      D.RES_ORDER.map(function (r) { return '<i title="' + D.RES[r].N + '">' + IC(r) + t[r] + '</i>'; }).join('') +
      '<i class="st" title="Stelle">' + IC('star') + P.stars.length + '/6</i></span>' +
      '<span class="mbtns"><button class="chip" data-act="objectives">' + IC('objective') + ' Obiettivi' + (E.canObjective(g, me).length ? ' <b class="dot">!</b>' : '') + '</button><button class="chip" data-act="player" data-p="' + me + '">La mia fazione</button><button class="chip" data-act="togglemat">' + (App.matOpen ? '▾' : '▴') + '</button></span></div>';
    if (!App.matOpen) return stats;
    var picking = cur && cur.stage === 'pick' && !g.pend;
    var cols = [0, 1, 2, 3].concat(P.fcard != null ? [4] : []).map(function (c) {
      var top = E.colTop(g, me, c), allowed = E.colAllowed(g, me, c), isCur = cur && cur.col === c && cur.stage !== 'pick';
      var cls = 'mcol' + (isCur ? ' cur' : '') + (picking && allowed ? ' can' : '') + (picking && !allowed ? ' no' : '') + (P.last === c ? ' last' : '') + (c === 4 ? ' fac' : '');
      var st = D.STRUCT_BY_TOP[top], stBuilt = st && P.st[st];
      var h = '<div class="mtop"><span class="mi">' + IC(top === 'factory' ? 'factory' : top) + '</span><b>' + (top === 'factory' ? 'Fabbrica' : D.TOP[top].n) + '</b><small>' + topLine(P, top, g, me) + '</small><span class="pips">' + upPips(P, top) + '</span>' +
        (st ? '<span class="mst' + (stBuilt ? ' on' : '') + '" title="' + D.STRUCTS[st].n + (stBuilt ? ' costruito' : ' da costruire') + '">' + IC(st) + '</span>' : '') + '</div>';
      if (c === 4) h += '<div class="mbot"><span class="mi">' + IC('move') + '</span><b>Sposta</b><small>1 unità fino a 2 territori</small></div>';
      else {
        var b = D.BOTTOM[c], cost = E.bottomCost(g, me, c), have = t[b.res], rec = P.recruits.indexOf(c) >= 0;
        h += '<div class="mbot"><span class="mi">' + IC(b.k) + '</span><b>' + b.n + '</b><small class="' + (have >= cost ? 'ok' : 'lack') + '">' + cost + IC(b.res) + ' <span class="have">(hai ' + have + ')</span></small>' +
          '<small>' + (m.gain[c] ? '+' + m.gain[c] + IC('coin') : '&nbsp;') + '</small><span class="mrec' + (rec ? ' on' : '') + '" title="Recluta: ' + D.ONGOING[c].n + '">' + IC('enlist') + '</span></div>';
      }
      if (P.last === c) h += '<span class="lastb">turno scorso</span>';
      return '<div class="' + cls + '" data-act="col" data-col="' + c + '" role="button" tabindex="0" aria-label="Colonna ' + (top === 'factory' ? 'Fabbrica' : D.TOP[top].n) + (c < 4 ? ' e ' + D.BOTTOM[c].n : '') + '">' + h + '</div>';
    }).join('');
    return stats + '<div class="mcols">' + cols + '</div>';
  }

  /* ---------- barra delle istruzioni ---------- */
  function help(id) { return '<button class="hbtn" data-act="help" data-r="' + id + '" aria-label="Spiegazione">' + IC('help') + '</button>'; }
  function prompt(g, me, v) {
    if (g.phase === 'over') { var W = g.players[g.winner]; return '<div class="pr"><p><b>Partita finita!</b> Vince ' + fname(g, g.winner) + ' con ' + g.final[0].total + ' monete.</p><div class="pb"><button class="btn" data-act="showover">Vedi il punteggio</button></div></div>'; }
    var P = me >= 0 ? g.players[me] : null;
    var away = P && P.bot ? '<div class="pr away"><p>Stai giocando in automatico.</p><div class="pb"><button class="btn" data-act="resume">Riprendo io</button></div></div>' : '';
    if (away) return away;
    var pend = g.pend;
    if (pend && pend.k === 'combat') {
      var side = pend.a === me ? 'a' : pend.d === me ? 'd' : null;
      var t = '⚔ <b>Battaglia</b> in ' + tname(pend.h).toLowerCase() + ': ' + fname(g, pend.a) + ' attacca ' + fname(g, pend.d) + '. Ognuno sceglie in segreto potere e carte.';
      return '<div class="pr"><p>' + t + (side && pend.pick[side] ? ' <b>Hai scelto:</b> aspetta l’avversario.' : '') + '</p><div class="pb">' + (side && !pend.pick[side] ? '<button class="btn" data-act="opencombat">Scegli potere e carte</button>' : '') + help('combat') + '</div></div>';
    }
    if (pend && pend.k === 'enc') return '<div class="pr"><p>' + (pend.p === me ? '<b>Incontro!</b> Scegli cosa fare.' : fname(g, pend.p) + ' sta risolvendo un incontro.') + '</p><div class="pb">' + (pend.p === me ? '<button class="btn" data-act="openenc">Apri l’incontro</button>' : '') + help('enc') + '</div></div>';
    if (pend && pend.k === 'factory') return '<div class="pr"><p>' + (pend.p === me ? '<b>Sei alla Fabbrica!</b> Scegli una carta.' : fname(g, pend.p) + ' è arrivato alla Fabbrica e sceglie una carta.') + '</p><div class="pb">' + (pend.p === me ? '<button class="btn" data-act="openfactory">Scegli la carta</button>' : '') + help('factory') + '</div></div>';
    var ts = g.ts; if (!ts) return '';
    if (ts.p !== me) {
      var who = fname(g, ts.p), top = ts.col != null ? E.colTop(g, ts.p, ts.col) : null;
      var what = ts.stage === 'pick' ? 'sta scegliendo una colonna della plancia.' : ts.stage === 'top' ? 'sta facendo ' + (top === 'factory' ? 'l’azione della carta Fabbrica' : '<b>' + D.TOP[top].n + '</b>') + '.' : ts.stage === 'bottom' ? 'sta decidendo l’azione in basso' + (ts.col < 4 ? ' (<b>' + D.BOTTOM[ts.col].n + '</b>)' : '') + '.' : 'sta muovendo.';
      return '<div class="pr"><p>Tocca a ' + who + ' (' + F[g.players[ts.p].fac].short + '): ' + what + '</p><div class="pb">' + help('turn') + '</div></div>';
    }
    var objBtn = E.canObjective(g, me).length ? '<button class="btn gold" data-act="objectives">' + IC('star') + ' Completa un obiettivo</button>' : '';
    if (ts.stage === 'pick') return '<div class="pr me"><p><b>Tocca a te!</b> Scegli una colonna della plancia qui sotto: farai l’azione in alto e poi quella in basso.</p><div class="pb">' + objBtn + (App.matOpen ? '' : '<button class="btn" data-act="togglemat">Mostra la plancia</button>') + help('turn') + '</div></div>';
    if (ts.stage === 'top') return topPrompt(g, me, P, ts);
    if (ts.stage === 'bottom') return bottomPrompt(g, me, P, ts, objBtn);
    return '';
  }
  function skipBtn(label) { return '<button class="btn ghost small" data-act="skiptop">' + (label || 'Salta l’azione in alto') + '</button>'; }
  function topPrompt(g, me, P, ts) {
    var top = E.colTop(g, me, ts.col), plan = App.plan;
    if (top === 'move') {
      if (!plan || plan.k !== 'move') { startPlan('move'); setTimeout(render, 0); }
      plan = App.plan || { moves: [] };
      var max = E.moveCount(P), n = plan.moves.length, coins = 1 + P.ups.mvC;
      var txt = plan.sel ? 'Ora tocca un territorio illuminato.' + legend() : n < max ? 'Tocca una tua pedina illuminata, poi dove portarla. Mosse: <b>' + n + '/' + max + '</b>.' : 'Hai preparato tutte le mosse: conferma.';
      var carry = '';
      if (plan.sel && plan._sim) { var mu = E.unit(plan._sim, plan.sel); if (mu && mu.k === 'M') { var wn = E.myUnits(plan._sim, me, 'W').filter(function (w) { return w.h === mu.h && plan._moved.indexOf(w.id) < 0; }).length; if (wn) carry = '<span class="carry">Porta con sé <button class="zb s" data-act="carry" data-d="-1">−</button><b>' + plan.carry + '</b>/' + wn + ' <button class="zb s" data-act="carry" data-d="1">+</button> lavoratori</span>'; } }
      var list = plan.moves.map(function (m) { var u = E.unit(g, m.u); return '<span class="mv">' + (u.k === 'C' ? F[P.fac].hero : u.k === 'M' ? 'Mech' : 'Lavoratore') + (m.carry.length ? ' +' + m.carry.length + IC('worker') : '') + ' → ' + tname(m.to) + '</span>'; }).join('');
      return '<div class="pr me"><p><b>' + IC('move') + ' Muovi.</b> ' + txt + '</p>' + (list ? '<div class="mvs">' + list + '</div>' : '') + carry +
        '<div class="pb">' + (n ? '<button class="btn" data-act="confirmmove">Conferma ' + (n === 1 ? 'la mossa' : 'le ' + n + ' mosse') + '</button><button class="btn ghost small" data-act="undomove">Annulla l’ultima</button>' : '') +
        (plan.sel ? '<button class="btn ghost small" data-act="desel">Scegli un’altra pedina</button>' : '') +
        (!n ? '<button class="btn ghost" data-act="movecoins">Prendi ' + coins + (coins === 1 ? ' moneta' : ' monete') + ' invece</button>' : '') + skipBtn('Salta') + help('move') + '</div></div>';
    }
    if (top === 'produce') {
      var ok = Object.keys(E.produceHexes(g, me)), cost = E.produceCost(g, me), canC = E.canPay(g, me, cost);
      if (!plan || plan.k !== 'produce') { startPlan('produce'); App.plan.hexes = ok.sort(function (a, b) { return workersAt(g, me, b) - workersAt(g, me, a); }).slice(0, E.produceCount(P)); setTimeout(render, 0); plan = App.plan; }
      var outp = produceOut(g, me, plan.hexes), cs = E.describeCost(cost);
      return '<div class="pr me"><p><b>' + IC('produce') + ' Produci.</b> Tocca i territori dove produrre (al massimo <b>' + E.produceCount(P) + '</b>): ogni lavoratore produce 1 risorsa del suo terreno.' + (cs ? ' Costo: <b>' + cs + '</b>' + (canC ? '' : ' <span class="bad">(non puoi pagarlo)</span>') + '.' : '') + '</p>' +
        '<div class="mvs">' + (outp || '<span class="muted">Nessun territorio scelto</span>') + '</div><div class="pb"><button class="btn" data-act="confirmproduce"' + (plan.hexes.length && canC ? '' : ' disabled') + '>Produci</button>' + skipBtn() + help('produce') + '</div></div>';
    }
    if (top === 'bolster') {
      var can = P.coins >= 1;
      return '<div class="pr me"><p><b>' + IC('bolster') + ' Rinforza.</b> Paghi 1 moneta (ne hai ' + P.coins + ') e scegli:' + (P.st.mon ? ' il tuo monumento aggiunge +1 popolarità.' : '') + '</p><div class="pb">' +
        '<button class="btn" data-act="bolster" data-o="pw"' + (can ? '' : ' disabled') + '>' + IC('power') + ' +' + (2 + P.ups.bpP) + ' potere</button><button class="btn" data-act="bolster" data-o="cd"' + (can ? '' : ' disabled') + '>' + IC('card') + ' ' + (1 + P.ups.bpC) + (P.ups.bpC ? ' carte' : ' carta') + ' combattimento</button>' + skipBtn() + help('bolster') + '</div></div>';
    }
    if (top === 'trade') {
      var c2 = P.coins >= 1;
      return '<div class="pr me"><p><b>' + IC('trade') + ' Commercia.</b> Paghi 1 moneta (ne hai ' + P.coins + ') e scegli:' + (P.st.arm ? ' la tua armeria aggiunge +1 potere.' : '') + '</p><div class="pb">' +
        '<button class="btn" data-act="tradeRes"' + (c2 && Object.keys(workerHexes(g, me)).length ? '' : ' disabled') + '>2 risorse a scelta</button><button class="btn" data-act="tradePop"' + (c2 ? '' : ' disabled') + '>' + IC('pop') + ' +' + (1 + P.ups.trP) + ' popolarità</button>' + skipBtn() + help('trade') + '</div></div>';
    }
    if (top === 'factory') {
      var fc = D.FACTORY[P.fcard], cp = E.canPay(g, me, fc.cost);
      return '<div class="pr me"><p><b>' + IC('factory') + ' ' + esc(fc.n) + '.</b> ' + esc(fc.d) + '</p><div class="pb"><button class="btn" data-act="usefactory"' + (cp ? '' : ' disabled') + '>Usa la carta</button>' + skipBtn() + help('factory') + '</div></div>';
    }
    return '';
  }
  function workersAt(g, me, k) { return E.myUnits(g, me, 'W').filter(function (u) { return u.h === k; }).length; }
  function produceOut(g, me, hexes) {
    var P = g.players[me];
    return hexes.map(function (k) { var n = workersAt(g, me, k) + (P.st.mil === k ? 1 : 0), t = E.HEX[k].t; return '<span class="mv">' + tname(k) + ': ' + (t === 'V' ? '+' + n + ' ' + IC('worker') : '+' + n + ' ' + IC(D.TERR[t].res)) + '</span>'; }).join('');
  }
  function legend() { return ' <span class="lg"><i class="lg-r"></i>libero <i class="lg-p"></i>caccia lavoratori <i class="lg-f"></i>battaglia</span>'; }
  function bottomPrompt(g, me, P, ts, objBtn) {
    var plan = App.plan;
    if (ts.col === 4) {
      if (!plan || plan.k !== 'fmove') { startPlan('fmove'); setTimeout(render, 0); plan = App.plan || { moves: [] }; }
      var n = plan.moves.length;
      return '<div class="pr me"><p><b>' + IC('move') + ' Sposta 1 unità</b> fino a 2 territori (azione in basso della carta Fabbrica). ' + (n ? 'Pronto: conferma.' : plan.sel ? 'Tocca dove portarla.' + legend() : 'Tocca una tua pedina.') + '</p><div class="pb">' +
        (n ? '<button class="btn" data-act="confirmfmove">Conferma</button><button class="btn ghost small" data-act="undomove">Annulla</button>' : '') + '<button class="btn ghost" data-act="endturn">Finisci il turno</button>' + objBtn + help('factory') + '</div></div>';
    }
    var b = D.BOTTOM[ts.col], cost = E.bottomCost(g, me, ts.col), have = E.resTotals(g, me)[b.res], coerce = E.has(g, me, 'coerce') && !P.coerced && P.hand.length;
    var done = { upgrade: E.upCount(P) >= 6, deploy: P.mechs.length >= 4, build: E.structCount(P) >= 4, enlist: P.recruits.length >= 4 }[b.k];
    var can = !done && (have >= cost || (App.coerce && coerce && have + 1 >= cost));
    if (plan && (plan.k === 'deploy' || plan.k === 'build')) {
      var what = plan.k === 'deploy' ? 'il mech «' + F[P.fac].mechs[plan.m].n + '»' : 'il ' + D.STRUCTS[plan.s].n.toLowerCase();
      return '<div class="pr me"><p><b>' + IC(b.k) + ' ' + b.n + ':</b> tocca sulla mappa dove mettere ' + what + '.' + (plan.hex ? ' Scelto: <b>' + tname(plan.hex) + '</b>.' : '') + '</p><div class="pb"><button class="btn" data-act="confirmplace"' + (plan.hex ? '' : ' disabled') + '>Conferma</button><button class="btn ghost small" data-act="cancelplan">Indietro</button>' + help(b.k) + '</div></div>';
    }
    var note = done ? 'Hai già completato tutte le ' + { upgrade: 'migliorie', deploy: 'schierate dei mech', build: 'strutture', enlist: 'reclute' }[b.k] + '.' : have >= cost ? 'Costa <b>' + cost + ' ' + D.RES[b.res].n + '</b> (ne hai ' + have + ') e ti dà <b>' + D.MATS[P.mat].gain[ts.col] + ' monete</b>.' : 'Costa <b>' + cost + ' ' + D.RES[b.res].n + '</b>: ne hai solo ' + have + ' nei territori che controlli.';
    var co = coerce && !done && have < cost && have + 1 >= cost ? '<label class="coerce"><input type="checkbox" id="coerce"' + (App.coerce ? ' checked' : '') + '> Usa 1 carta combattimento al posto di 1 ' + D.RES[b.res].n + ' (Requisizione)</label>' : '';
    return '<div class="pr me"><p><b>' + IC(b.k) + ' Ora l’azione in basso: ' + b.n + '.</b> ' + note + '</p>' + co + '<div class="pb"><button class="btn" data-act="bottom"' + (can ? '' : ' disabled') + '>' + b.n + '</button><button class="btn ghost" data-act="endturn">' + (can ? 'Non farla e finisci il turno' : 'Finisci il turno') + '</button>' + objBtn + help(b.k) + '</div></div>';
  }
  return { render: render, unmount: unmount, startPlan: startPlan, workerHexes: workerHexes, mounted: function () { return !!mountedFor; } };
})();
