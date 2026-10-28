/* ===== Catan: schermata di gioco =====
   In alto i giocatori, al centro l'isola, sotto lo scambio in corso, i dadi con la riga che dice cosa fare,
   i pulsanti del turno (Lancia, Costruisci, Commercia, Carte, Fine turno) e le tue carte.
   Su schermi larghi l'isola sta a sinistra e il resto in una colonna a destra. */
var Game = (function () {
  var mountedFor = null;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }

  function mount(g) {
    $('#app').innerHTML = '<svg width="0" height="0" style="position:absolute" aria-hidden="true">' + ART.DEFS + '</svg><div class="gv" id="gv">' +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<div class="gv-players" id="gv-players"></div>' + Chat.dockHTML() +
      '<div class="gv-map"><div id="gv-board" class="gv-board"></div><div class="gv-feed" id="gv-feed" data-act="log"></div>' +
      '<div class="gv-zoom"><button class="zb" data-act="zin" aria-label="Avvicina">+</button><button class="zb" data-act="zout" aria-label="Allontana">−</button><button class="zb" data-act="zfit" aria-label="Mostra tutta l’isola">⤢</button></div><div class="gv-legend" id="gv-legend"></div></div>' +
      '<div class="gv-side"><div class="gv-trade" id="gv-trade"></div><div class="gv-prompt" id="gv-prompt" aria-live="polite"></div><div class="gv-acts" id="gv-acts"></div><div class="gv-hand" id="gv-hand"></div></div></div>';
    Board.mount(el('gv-board'), g, { onHex: onHex, onEmpty: function () { if (App.pickSel != null) { App.pickSel = null; render(); } } });
    mountedFor = App.code + ':' + JSON.stringify(g.hex).length + g.hex.map(function (h) { return h.n; }).join(',');
    setTimeout(function () { Board.fit(); }, 80);
  }
  function unmount() { if (mountedFor) { Board.unmount(); mountedFor = null; } }
  function render() {
    var g = G(), me = myIdx();
    var sig = App.code + ':' + JSON.stringify(g.hex).length + g.hex.map(function (h) { return h.n; }).join(',');
    if (mountedFor !== sig || !el('gv') || !Board.mounted(g)) mount(g);
    var pk = curPick(g, me);
    if (pk && App.pickSel != null && pk.list.indexOf(App.pickSel) < 0) App.pickSel = null;
    if (!pk) App.pickSel = null;
    if (pk) pk.sel = App.pickSel;
    Board.update(g, { pick: pk, onPick: onPick, hot: hotHexes(g), follow: !(me >= 0 && g.turn === me) });
    setHTML('gv-info', info(g));
    setHTML('gv-players', players(g, me));
    setHTML('gv-trade', tradeBar(g, me));
    setHTML('gv-prompt', prompt(g, me, pk));
    setHTML('gv-acts', actions(g, me));
    setHTML('gv-hand', me >= 0 ? hand(g, me) : '<div class="hd-row"><span class="muted">Stai guardando la partita.</span></div>');
    setHTML('gv-feed', feed(g));
    setHTML('gv-legend', legend(g, me, pk));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    var dz = document.querySelector('.dz'); if (dz && Date.now() - (App.diceAt || 0) < 700) { dz.classList.add('rolling'); setTimeout(function () { dz.classList.remove('rolling'); }, 720); }
  }
  function info(g) {
    var t = g.phase === 'over' ? 'Partita finita' : g.stage === 'setup' ? 'Fondazione' : 'Giro ' + g.round;
    return '<b>Catan</b> <span class="muted">· ' + connInfo(t + ' · ' + g.opts.vp + ' punti · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>';
  }

  /* ---------- posti da scegliere sull'isola ---------- */
  function curPick(g, me) {
    if (me < 0 || g.phase !== 'play') return null;
    var col = g.players[me].col;
    if (g.stage === 'setup') { if (E.decider(g) !== me) return null; return g.setup.step === 'settle' ? { k: 'settle', list: E.legalSettles(g, me, true), col: col } : { k: 'road', list: E.legalRoads(g, me, g.setup.last), col: col }; }
    if (g.turn !== me) return null;
    if (g.stage === 'robber') return { k: 'robber', list: E.robberTargets(g, me), col: col };
    if (g.stage === 'road2') return { k: 'road', list: E.legalRoads(g, me), col: col };
    if (g.stage === 'main' && App.pick && !g.trade) {
      var k = App.pick.k;
      return { k: k, list: k === 'road' ? E.legalRoads(g, me) : k === 'settle' ? E.legalSettles(g, me, false) : E.legalCities(g, me), col: col };
    }
    return null;
  }
  function onPick(id) {
    var g = G(), me = myIdx(), pk = curPick(g, me); if (!pk) return;
    if (App.pickSel === id) { confirmPick(); return; }
    App.pickSel = id; render();
  }
  function confirmPick() {
    var g = G(), me = myIdx(), pk = curPick(g, me), id = App.pickSel; if (!pk || id == null) return;
    App.pickSel = null;
    if (g.stage === 'setup') act(pk.k === 'settle' ? { a: 'settle', v: id } : { a: 'road', e: id });
    else if (pk.k === 'robber') act({ a: 'robber', h: id });
    else { act(pk.k === 'road' ? { a: 'build', k: 'road', e: id } : { a: 'build', k: pk.k, v: id }); if (g.stage === 'main') App.pick = null; }
  }
  function hotHexes(g) {
    if (!g.dice || g.stage === 'setup' || g.phase !== 'play') return [];
    var n = g.dice[0] + g.dice[1], out = [];
    if (n !== 7) g.hex.forEach(function (h, i) { if (h.n === n && i !== g.robber) out.push(i); });
    return out;
  }
  function onHex(hi) { App.pickSel = null; App.sheet = { kind: 'hex', h: hi }; render(); renderSheet(); }
  function legend(g, me, pk) {
    if (pk && g.stage === 'main' && App.pick) {
      var nm = { road: 'strada', settle: 'colonia', city: 'città' }[pk.k];
      return '<div class="lg">' + (pk.list.length ? 'Tocca un posto che lampeggia per la ' + nm : 'Nessun posto valido per la ' + nm) + '<button class="x" data-act="unpick" aria-label="Annulla">×</button></div>';
    }
    return '';
  }

  /* ---------- giocatori ---------- */
  function players(g, me) {
    var dec = E.decider(g);
    return g.players.map(function (P, p) {
      var on = g.phase === 'play' && (dec === p || (g.stage === 'discard' && E.mustDiscard(g, p))), vpv = E.visibleVP(g, p), hid = p === me ? E.vpCards(P) : 0;
      var cards = E.total(P.res), devs = P.devs.length;
      return '<button class="pchip' + (on ? ' on' : '') + (p === me ? ' me' : '') + '" style="--pc:' + D.PCOL[P.col].c + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + ', ' + vpv + ' punti visibili, ' + cards + ' carte">' +
        '<span class="pw">' + ART.pieceIcon(P.col, 24) + '</span><span class="pn"><b>' + Net.dot(P.uid) + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="ps">' +
        '<i class="sc" title="Punti">' + IC('star') + vpv + (hid ? '<small>+' + hid + '</small>' : '') + '</i><i class="' + (cards > 7 ? 'low' : '') + '" title="Carte risorsa">' + IC('cards') + cards + '</i><i title="Carte sviluppo">' + IC('dev') + devs + '</i>' +
        (P.knights ? '<i title="Cavalieri giocati">' + IC('knight') + P.knights + '</i>' : '') + '</span></span>' +
        (g.lr === p || g.la === p ? '<span class="aw">' + (g.lr === p ? '<i title="Strada più lunga">' + IC('road') + '</i>' : '') + (g.la === p ? '<i title="Esercito più grande">' + IC('knight') + '</i>' : '') + '</span>' : '') +
        (P.away ? '<span class="away">assente</span>' : P.bot && g.phase === 'play' ? '<span class="away bot">auto</span>' : '') + '</button>';
    }).join('');
  }

  /* ---------- scambio in corso ---------- */
  function tradeBar(g, me) {
    var T = g.trade; if (!T || g.phase !== 'play') return '';
    var off = g.turn, give = ART.resRow(T.give), get = ART.resRow(T.get);
    if (me === off) {
      var rows = g.players.map(function (P, q) {
        if (q === off) return '';
        var r = T.resp[q], st = r === 'yes' ? '<button class="btn small" data-act="deal" data-p="' + q + '">Scambia con ' + esc(P.nick) + '</button>' : r === 'no' ? '<span class="tr-no">' + IC('x') + ' no</span>' : '<span class="tr-wait">sta decidendo…</span>';
        return '<div class="tr-p" style="--pc:' + D.PCOL[P.col].c + '"><b>' + esc(P.nick) + '</b>' + st + '</div>';
      }).join('');
      var allNo = g.players.every(function (P, q) { return q === off || T.resp[q] === 'no'; });
      if (allNo) rows += '<p class="tr-s muted">Nessuno accetta: ritira la proposta e prova a offrire di più, oppure commercia con la banca.</p>';
      return '<div class="tr"><div class="tr-h">' + IC('trade') + ' <span>La tua proposta: dai ' + give + ' chiedi ' + get + '</span><button class="btn ghost small" data-act="cancel">Ritira</button></div><div class="tr-ps">' + rows + '</div></div>';
    }
    var head = '<div class="tr-h">' + IC('trade') + ' <span>' + pname(g, off) + ' ' + (me >= 0 ? 'ti dà' : 'dà') + ' ' + give + ' e chiede ' + get + '</span></div>';
    if (me < 0) return '<div class="tr">' + head + '</div>';
    var r2 = T.resp[me], can = E.has(g.players[me].res, T.get);
    var body = r2 === 'yes' ? '<p class="tr-s good">Hai accettato: ora ' + pname(g, off) + ' sceglie con chi scambiare.</p>' : r2 === 'no' ? '<p class="tr-s muted">Hai rifiutato.</p>'
      : '<div class="row"><button class="btn small" data-act="respond" data-ok="1"' + (can ? '' : ' disabled') + '>' + IC('check') + ' Accetto</button><button class="btn ghost small" data-act="respond" data-ok="0">Rifiuto</button>' + (can ? '' : '<span class="muted small">Non hai le carte richieste.</span>') + '</div>';
    return '<div class="tr in">' + head + body + '</div>';
  }

  /* ---------- cosa fare adesso ---------- */
  function diceHTML(g) { return g.dice ? '<span class="dz">' + ART.die(g.dice[0], false, 34) + ART.die(g.dice[1], true, 34) + '</span>' : ''; }
  function prompt(g, me, pk) {
    var P = me >= 0 ? g.players[me] : null, h = '', help = 'turn', btn = '', mine = me >= 0 && g.turn === me;
    if (g.phase === 'over') { h = '<b>Partita finita.</b> Vince ' + pname(g, g.winner) + ' con ' + E.vp(g, g.winner) + ' punti.'; btn = '<button class="btn small" data-act="showover">Classifica</button>'; help = 'end'; }
    else if (pk && App.pickSel != null) {
      var what = pk.k === 'robber' ? 'Spostare qui il ladro?' : g.stage === 'setup' ? (pk.k === 'settle' ? 'Mettere qui la colonia?' : 'Mettere qui la strada?') : pk.k === 'road' ? (g.stage === 'road2' ? 'Strada gratis qui?' : 'Costruire qui la strada?') : pk.k === 'settle' ? 'Costruire qui la colonia?' : 'Trasformare questa colonia in città?';
      h = '<b>' + what + '</b>' + (pk.k === 'settle' && g.stage === 'setup' ? ' <span class="muted">' + spotInfo(g, App.pickSel) + '</span>' : '') + (pk.k === 'robber' ? ' <span class="muted">' + robInfo(g, me, App.pickSel) + '</span>' : '');
      btn = '<button class="btn small" data-act="pickok">' + IC('check') + ' Conferma</button><button class="btn ghost small" data-act="pickno">' + (g.stage === 'main' ? 'Annulla' : 'Cambia') + '</button>';
      help = pk.k === 'robber' ? 'seven' : g.stage === 'setup' ? 'setup' : 'build';
    }
    else if (g.stage === 'setup') {
      var d = E.decider(g), second = g.setup.i >= g.players.length;
      if (d === me) { h = g.setup.step === 'settle' ? '<b>Fondazione:</b> tocca un incrocio che lampeggia per la tua ' + (second ? '<b>seconda</b> colonia (ti dà subito le risorse delle tessere vicine)' : '<b>prima</b> colonia') + '.' : '<b>Ora la strada:</b> tocca un lato che lampeggia, attaccato alla colonia appena messa.'; help = 'setup'; }
      else { h = 'Fondazione: ' + pname(g, d) + ' sta piazzando ' + (g.setup.step === 'settle' ? 'una colonia' : 'una strada') + '…'; help = 'setup'; }
    }
    else if (g.stage === 'discard') {
      var need = me >= 0 ? E.mustDiscard(g, me) : 0, who = g.players.map(function (Q, q) { return E.mustDiscard(g, q) ? pname(g, q) : null; }).filter(Boolean);
      h = need ? '<b>È uscito il 7:</b> hai più di 7 carte, scartane <b>' + need + '</b>.' : 'È uscito il 7: aspetto che ' + who.join(', ') + ' scartino metà delle carte…';
      if (need) btn = '<button class="btn small" data-act="opendiscard">Scegli</button>'; help = 'seven';
    }
    else if (mine) {
      if (g.stage === 'roll') { h = '<b>Tocca a te!</b> Lancia i dadi' + (P.devs.some(function (x) { return x.k !== 'vp' && x.t < g.turnN; }) && !g.devUsed ? ' (prima puoi giocare una carta sviluppo)' : '') + '.'; }
      else if (g.stage === 'robber') { h = '<b>Sposta il ladro:</b> tocca la tessera dove metterlo (lampeggiano quelle possibili).'; help = 'seven'; }
      else if (g.stage === 'steal') { h = '<b>Scegli a chi rubare</b> una carta.'; btn = '<button class="btn small" data-act="opensteal">Scegli</button>'; help = 'seven'; }
      else if (g.stage === 'road2') { h = '<b>Strade gratis:</b> tocca un lato che lampeggia (' + g.free + ' rimast' + (g.free === 1 ? 'a' : 'e') + ').'; btn = '<button class="btn ghost small" data-act="endroads">Basta così</button>'; help = 'dev'; }
      else if (g.trade) { h = 'Aspetta le risposte alla tua proposta, poi scegli con chi scambiare.'; help = 'trade'; }
      else { h = '<b>Il tuo turno:</b> costruisci, commercia o gioca una carta. Quando hai finito, <b>Fine turno</b>.'; help = 'build'; }
    } else {
      var T = g.players[g.turn], doing = { roll: 'sta per lanciare i dadi', robber: 'sta spostando il ladro', steal: 'sceglie a chi rubare', road2: 'costruisce strade gratis', main: g.trade ? 'propone uno scambio' : 'sta giocando il turno' }[g.stage] || 'sta decidendo';
      h = 'Tocca a ' + pname(g, g.turn) + (T.bot ? ' <span class="muted">(automatico)</span>' : '') + ': ' + doing + '…';
      if (P && P.bot) btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return diceHTML(g) + '<div class="pr-txt">' + h + '</div><span class="pr-b">' + btn + '<button class="iconbtn help" data-act="help" data-r="' + help + '" aria-label="Spiegazione">' + IC('help') + '</button></span>';
  }
  function spotInfo(g, v) { var nums = CTData.verts[v].hexes.map(function (hi) { return g.hex[hi].n ? g.hex[hi].n + ' ' + D.RN[D.TERR[g.hex[hi].t].r] : null; }).filter(Boolean); return nums.join(' · '); }
  function robInfo(g, me, h) { var vs = E.victimsAt(g, me, h).filter(function (o) { return !(g.opts.gentle && E.visibleVP(g, o) <= 2); }); return vs.length ? 'potrai rubare a ' + vs.map(function (q) { return esc(g.players[q].nick); }).join(' o ') : 'qui non c’è nessuno da derubare'; }

  /* ---------- pulsanti del turno ---------- */
  function actions(g, me) {
    if (me < 0 || g.phase !== 'play') return '';
    var mine = g.turn === me, P = g.players[me], playable = P.devs.filter(function (d) { return d.k !== 'vp' && d.t < g.turnN; }).length;
    var b = function (act, ic, label, on, primary, extra) { return '<button class="ab' + (primary ? ' pri' : '') + (on ? '' : ' off') + '" data-act="' + act + '"' + (on ? '' : ' aria-disabled="true"') + '>' + ic + '<span>' + label + '</span>' + (extra || '') + '</button>'; };
    if (mine && g.stage === 'roll') return b('roll', IC('dice'), 'Lancia i dadi', true, true) + b('devs', IC('dev'), 'Carte', true, false, playable && !g.devUsed ? '<i class="ab-n">' + playable + '</i>' : '');
    var main = mine && g.stage === 'main' && !g.trade;
    return b('build', IC('build'), 'Costruisci', main) + b('trade', IC('trade'), 'Commercia', main) + b('devs', IC('dev'), 'Carte', true, false, mine && playable && !g.devUsed && (g.stage === 'main' || g.stage === 'roll') ? '<i class="ab-n">' + playable + '</i>' : '') + b('end', IC('end'), 'Fine turno', main, main);
  }

  /* ---------- le tue carte ---------- */
  function hand(g, me) {
    var P = g.players[me], tot = E.total(P.res), rt = E.rates(g, me);
    var cards = D.RES.map(function (r) {
      var n = P.res[r];
      return '<button class="hd-c' + (n ? '' : ' zero') + '" data-act="res" data-r="' + r + '" aria-label="' + n + ' ' + D.RN[r] + '">' + ART.resCard(r) + '<span class="n">' + n + '</span>' + (rt[r] < 4 ? '<span class="rt">' + rt[r] + ':1</span>' : '') + '</button>';
    }).join('');
    var pcs = '<span class="hd-pc" title="Pezzi rimasti">' + ART.piece('road', P.col, 16) + P.pieces.road + ' ' + ART.piece('settle', P.col, 16) + P.pieces.settle + ' ' + ART.piece('city', P.col, 16) + P.pieces.city + '</span>';
    return '<div class="hd-row"><div class="hd-cards">' + cards + '</div><button class="hd-dev" data-act="devs" aria-label="Le tue carte sviluppo">' + ART.devBack() + '<span class="n">' + P.devs.length + '</span></button></div>' +
      '<div class="hd-sub"><span class="' + (tot > 7 ? 'bad' : 'muted') + '">' + tot + ' carte' + (tot > 7 ? ' — attento al 7!' : '') + '</span>' + pcs + '<span class="sc">' + IC('star') + ' ' + E.vp(g, me) + '/' + g.opts.vp + '</span></div>';
  }
  function feed(g) { return g.log.slice(-2).map(function (l) { var c = l.p != null && g.players[l.p] ? D.PCOL[g.players[l.p].col].c : 'rgba(217,180,90,.5)'; return '<div class="fl" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join(''); }
  return { render: render, unmount: unmount, confirmPick: confirmPick, curPick: curPick };
})();
