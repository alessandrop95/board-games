/* ===== Skyjo: finestre (regole, menu, giocatori, punti della manche, classifica, presentazione) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; root._s = null; root._h = null; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  var same = root._s === s;
  if (!same) { root._s = s; App.sheetAt = Date.now(); }
  if (same && root._h === h) return;   // niente da cambiare: non si ridisegna (e non riparte l'animazione)
  var sc = same && root.querySelector('.sheet') ? root.querySelector('.sheet').scrollTop : 0;
  root.innerHTML = '<div class="sheet-back' + (same ? ' still' : '') + '" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>'; root._h = h;
  if (sc) root.querySelector('.sheet').scrollTop = sc;
  if (s.kind === 'rules' && s.focus) { var t = document.getElementById('r-' + s.focus); if (t) t.scrollIntoView({ block: 'start' }); }
  s.fresh = false;
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function sheetBody(s) {
  var g = G(), me = myIdx();
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button>' +
      (g ? '<button class="btn ghost block" data-act="scorecard">Segnapunti della partita</button><button class="btn ghost block" data-act="log">Tutte le mosse</button>' : '') +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? pcol(g, l.p) : 'rgba(255,215,94,.5)'; return '<div class="fl k-' + l.k + '" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'player') {
    var P = g.players[s.p]; if (!P) return '';
    return '<div class="phead"><span class="pv big" style="--pc:' + pcol(g, s.p) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><div><div class="kicker">' + (s.p === me ? 'Tu' : 'Giocatore') + '</div><h2>' + Net.dot(P.uid) + esc(P.nick) + '</h2></div></div>' +
      (P.out ? '<p class="lead">Eliminato alla manche ' + P.outRound + ' con ' + P.total + ' punti.</p>' : '<div class="pboard">' + Game.boardHTML(g, s.p, {}) + '</div>') +
      (g.opts.action ? '<div class="alist">' + (P.acts.length ? P.acts.map(function (c) { return '<div class="ali">' + ART.acard(c.k) + '<span><b>' + ART.ANAME[c.k] + '</b><small>' + esc(E.ACTS[c.k][1]) + '</small></span></div>'; }).join('') : '<p class="lead">Nessuna carta Azione in mano.</p>') + '</div>' : '') +
      '<div class="tags"><span class="gc">Carte scoperte: <b>' + E.sv(E.upSum(P)).replace('+', '') + '</b> punti</span><span class="gc">' + E.hidden(P).length + ' coperte</span><span class="gc">Totale: <b>' + P.total + '</b></span>' + (P.hist.length ? '<span class="gc">Manche: ' + P.hist.map(function (x) { return x == null ? '–' : E.sv(x).replace('+', ''); }).join(' · ') + '</span>' : '') + '</div>' +
      (App.doc.host === Net.uid && s.p !== me && g.phase !== 'over' && !P.out ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
  }
  if (s.kind === 'round' && (g.phase === 'scores' || g.phase === 'over') && g.roundRes) return roundBody(g, me, s);
  if (s.kind === 'tgt' && App.tgt) return tgtBody(g, me);
  if (s.kind === 'acard') return acardBody(g, me, s);
  if (s.kind === 'peek') return peekBody(g, me, s);
  if (s.kind === 'scorecard') return '<h2>Segnapunti</h2>' + scorecard(g, me) + closeBtn();
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me, s);
  return '';
}
function roundRows(g, me, anim) {
  var R = g.roundRes, order = g.players.map(function (P, i) { return i; }).filter(function (i) { return R.pts[i] != null; }).sort(function (a, b) { return R.pts[a] - R.pts[b] || a - b; });
  return '<div class="rr">' + order.map(function (p, k) {
    var P = g.players[p], d = p === R.ender && R.doubled, extra = '';
    if (R.pen && R.pen[p]) extra += '<span class="tag pen">Azioni +' + R.pen[p] + '</span>';
    if (R.sb && R.sb[p]) extra += '<span class="tag ok">stelle ' + R.sb[p] + '</span>';
    if (R.out && R.out.indexOf(p) >= 0) extra += '<span class="tag out">eliminato</span>';
    return '<div class="rr-row' + (p === me ? ' me' : '') + '" style="--pc:' + pcol(g, p) + ';animation-delay:' + (anim ? k * .12 : 0) + 's"><span class="rr-n"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + '</b>' + (p === R.ender ? '<span class="tag end">' + IC('flag') + ' ha chiuso</span>' : '') + extra + '</span>' +
      '<span class="rr-b">' + Game.boardHTML(g, p, {}) + '</span>' +
      '<span class="rr-p">' + (d ? '<s>' + R.raw[p] + '</s><span class="stamp" style="animation-delay:' + (anim ? .9 : 0) + 's">×2</span>' : '') + '<b class="' + (R.pts[p] <= 0 ? 'neg' : '') + '">' + E.sv(R.pts[p]).replace('+', '') + '</b><small>tot. ' + P.total + '</small></span></div>';
  }).join('') + '</div>';
}
function roundBody(g, me, s) {
  var R = g.roundRes, P = me >= 0 ? g.players[me] : null, waiting = E.pending(g), isHost = App.doc.host === Net.uid;
  var note = R.doubled ? pname(g, R.ender) + ' ha chiuso senza avere il punteggio più basso: i suoi ' + R.raw[R.ender] + ' punti raddoppiano!' : pname(g, R.ender) + ' ha chiuso ' + (R.lowest ? 'con il punteggio più basso: ben fatto!' : 'con punti non positivi: niente raddoppio.');
  return '<div class="kicker">Manche ' + g.round + '</div><h2>Punti della manche</h2><p class="lead">' + note + '</p>' + roundRows(g, me, s.fresh) +
    (R.out && R.out.length ? '<p class="notice">' + R.out.map(function (i) { return pname(g, i); }).join(', ') + (R.out.length > 1 ? ' sono arrivati' : ' è arrivato') + ' a ' + g.opts.target + ' punti: ' + (R.out.length > 1 ? 'eliminati' : 'eliminato') + '. ' + (E.aliveList(g).length > 1 ? 'Si continua in ' + E.aliveList(g).length + '.' : '') + '</p>' : '') +
    '<div class="target">' + g.players.map(function (Q, i) { if (Q.out && (!R.out || R.out.indexOf(i) < 0)) return ''; return '<span class="tbar' + (Q.out ? ' out' : '') + '" style="--pc:' + pcol(g, i) + ';--w:' + Math.max(0, Math.min(100, Q.total / g.opts.target * 100)).toFixed(1) + '%" title="' + esc(Q.nick) + ': ' + Q.total + '"><i></i><b>' + esc(Q.nick) + ' ' + Q.total + '</b></span>'; }).join('') + '<small>' + (g.opts.elim ? 'A ' + g.opts.target + ' punti si è eliminati: vince l’ultimo rimasto' : 'La partita finisce a ' + g.opts.target + ' punti') + '</small></div>' +
    (P && !P.ready ? '<button class="btn block" data-act="next">Prossima manche</button>' : P ? '<p class="lead">Aspetto ' + waiting.map(function (i) { return pname(g, i); }).join(', ') + '…</p>' : '') +
    (isHost && waiting.length && !(waiting.length === 1 && waiting[0] === me) ? '<button class="btn ghost small" data-act="nextround">Inizia senza aspettare</button>' : '') +
    '<button class="btn ghost block" data-act="close">Guarda il tavolo</button>';
}
function scorecard(g, me) {
  var n = g.players[0].hist.length; if (!n) return '<p class="lead">Ancora nessuna manche finita.</p>';
  var head = '<tr><th></th>' + g.players.map(function (P, i) { return '<th style="--pc:' + pcol(g, i) + '"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>' + esc(P.nick) + '</th>'; }).join('') + '</tr>';
  var rows = ''; for (var r = 0; r < n; r++) rows += '<tr><td>' + (r + 1) + '</td>' + g.players.map(function (P) { var v = P.hist[r]; return v == null ? '<td class="gone">–</td>' : '<td class="' + (v <= 0 ? 'neg' : '') + '">' + v + '</td>'; }).join('') + '</tr>';
  var live = g.players.filter(function (P) { return !P.out; }), min = Math.min.apply(null, (live.length ? live : g.players).map(function (P) { return P.total; }));
  return '<div class="card-note"><table class="scard">' + head + rows + '<tr class="tot"><td>Σ</td>' + g.players.map(function (P) { return '<td class="' + (P.out ? 'outc' : P.total === min ? 'best' : '') + '">' + P.total + '</td>'; }).join('') + '</tr></table></div>';
}
function overBody(g, me, s) {
  var W = g.winners, order = g.final.order, iw = W.indexOf(me) >= 0;
  var place = g.final.place || g.players.map(function (P) { return 1 + g.players.filter(function (Q) { return Q.total < P.total; }).length; });
  var podium = order.slice(0, 3).map(function (p, k) { var P = g.players[p]; return '<div class="pod p' + (k + 1) + '" style="--pc:' + pcol(g, p) + '"><span class="pv big">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + '</b><span class="pod-s">' + P.total + '</span><span class="pod-b">' + place[p] + '</span></div>'; }).join('');
  var alive = E.aliveList(g);
  var why = g.opts.elim ? (alive.length === 1 ? esc(g.players[alive[0]].nick) + ' è l’ultimo rimasto in gioco dopo ' + g.round + ' manche: tutti gli altri sono arrivati a ' + g.opts.target + ' punti.' : 'Gli ultimi rimasti sono arrivati a ' + g.opts.target + ' punti nella stessa manche: vince chi ne ha meno.') : esc(g.players[order[order.length - 1]].nick) + ' ha superato i ' + g.opts.target + ' punti dopo ' + g.round + ' manche.';
  return '<div class="over"><svg class="over-balloon" viewBox="-30 -34 60 70" aria-hidden="true">' + ART.balloon(0, 0, 1) + '</svg><h2>' + (iw ? (W.length > 1 ? 'Hai vinto, a pari merito!' : 'Hai vinto!') : (W.length > 1 ? 'Vincono ' + W.map(function (i) { return esc(g.players[i].nick); }).join(' e ') : 'Vince ' + esc(g.players[W[0]].nick))) + '</h2>' +
    '<p class="lead">' + why + '</p>' +
    '<div class="podium">' + podium + '</div>' + (g.roundRes ? '<details class="lastround"><summary>Ultima manche</summary>' + roundRows(g, me, false) + '</details>' : '') + scorecard(g, me) +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var pages = [
    ['Benvenuto a Skyjo', '<div class="intro-art">' + RU.grid([-2, 'b', 5, 'b', 'b', 0, 'b', 12, 'b', 'b', 'b', 3]) + '</div>' + RU.S.goal[1]],
    ['Ogni turno', RU.S.turn[1]],
    ['Colonne e fine manche', RU.grid([7, 'b', 2, 'b', 7, 0, 'b', 'b', 7, 'b', 'b', 1], [0, 4, 8]) + '<p>Tre carte <b>uguali in colonna</b> spariscono!</p><p>Quando qualcuno scopre tutte le sue carte, gli altri giocano <b>un ultimo turno</b>. Chi chiude deve avere <b>meno punti di tutti</b>, altrimenti li <b>raddoppia</b>.</p>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si vola!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}


/* ---------- carte Azione: scheda della carta, bersagli, sbirciata ---------- */
function freeTurn(g, me) { var P = me >= 0 ? g.players[me] : null; return !!P && g.phase === 'play' && g.turn === me && !g.drawn && !g.pick && !g.chain && !P.bonus && g.ender == null; }
function myBonus(g, me) { var P = me >= 0 ? g.players[me] : null; return !!P && !!P.bonus && (g.phase === 'reveal' || (g.phase === 'play' && g.turn === me)); }
function acardBody(g, me, s) {
  var P = me >= 0 ? g.players[me] : null, k = s.k, info = k ? E.ACTS[k] : null, btn = '';
  if (s.src === 'mine' && P && P.acts[s.j]) {
    if (freeTurn(g, me)) {
      if (E.usable(g, P, s.j)) btn = '<button class="btn block" data-act="ause" data-j="' + s.j + '">Gioca questa carta</button>';
      else btn = '<p class="notice">L’hai presa in questo turno: la puoi giocare dal prossimo.</p>';
      btn += '<button class="btn ghost block" data-act="atoss" data-j="' + s.j + '">Scartala senza effetto (usa il turno)</button>';
    } else if (g.phase === 'play' && g.turn === me && g.ender != null) btn = '<p class="notice">Qualcuno ha chiuso la manche: le carte Azione non si giocano più. Ognuna vale +10.</p>';
    else btn = '<p class="lead">La potrai giocare nel tuo turno, al posto di pescare. A fine manche vale +10 se ce l’hai ancora.</p>';
  } else if (s.src === 'row' || s.src === 'deck') {
    var lab = s.src === 'deck' ? 'Pesca dal mazzo delle Azioni' : 'Prendi questa carta';
    if (myBonus(g, me)) btn = '<button class="btn block" data-act="abonus" data-r="' + s.r + '">' + lab + '</button>';
    else if (freeTurn(g, me)) btn = '<button class="btn block" data-act="agrab" data-r="' + s.r + '">' + lab + ' (usa il turno)</button><p class="lead">La potrai giocare dal turno dopo. Attenzione: ogni carta Azione in mano a fine manche vale +10.</p>';
    else btn = '<p class="lead">Si prende quando trovi una <b>stella</b> (pescandola, prendendola dagli scarti o scoprendola), oppure al posto del turno.</p>';
  }
  return '<div class="acard-sh">' + ART.acard(k) + '<div><div class="kicker">Carta Azione</div><h2>' + (k ? ART.ANAME[k] : 'Mazzo delle Azioni') + '</h2><p class="lead">' + (info ? esc(info[1]) : 'Carte coperte: non sai quale peschi. Ce ne sono ' + g.adeck.length + '.') + '</p></div></div>' + btn + closeBtn();
}
function startUse(j) {
  var g = G(), me = myIdx(), P = g.players[me], c = P.acts[j]; if (!c) return;
  if (['two', 'prot', 'draw3'].indexOf(c.k) >= 0) { App.sheet = null; renderSheet(); act({ a: 'use', j: j }); return; }
  if (c.k === 'redo' && !g.adisc.some(function (k) { return k !== 'redo'; })) { toast('Negli scarti delle Azioni non c’è niente da ripescare.'); Sound.play('no'); return; }
  if (c.k === 'steal' && !g.players.some(function (Q, q) { return q !== me && !Q.out && Q.acts.length; })) { toast('Nessun avversario ha carte Azione da rubare.'); Sound.play('no'); return; }
  App.tgt = { k: c.k, via: 'use', j: j, sel: [], picks: {}, dir: 'col' }; App.sheet = { kind: 'tgt' }; renderSheet(); Game.render();
}
function shielded(g, q) { return g.players[q].acts.some(function (c) { return c.k === 'prot'; }); }
function tBoard(g, q, me, T) {
  var Q = g.players[q], h = '', line = T.k === 'look' && T.line && T.line.t === q ? (T.line.row != null ? E.rowCells(T.line.row) : E.colCells(T.line.col)) : null;
  var seen = {}; (g.players[me].seen || []).forEach(function (x) { if (x.t === q) seen[x.i] = x.v; });
  for (var i = 0; i < 12; i++) {
    var x = Q.grid[i];
    if (!x) { h += '<span class="slot gone"></span>'; continue; }
    var on = T.sel.some(function (y) { return y.p === q && y.i === i; }) || (T.picks[q] && T.picks[q].i === i) || (line && line.indexOf(i) >= 0);
    var pk = !x.up && seen[i] === x.v ? '<i class="peek">' + ART.lab(x.v) + '</i>' : '';
    h += '<button class="slot can' + (on ? ' sel' : '') + '" data-act="tcell" data-p="' + q + '" data-i="' + i + '" aria-label="' + esc(Q.nick) + ': ' + (x.up ? 'carta ' + ART.lab(x.v) : 'carta coperta') + '">' + ART.card(x.up ? x.v : null, x.up, { mini: true }) + pk + '</button>';
  }
  var acts = '';
  if ((T.k === 'rmall' || T.k === 'steal') && q !== me) acts = '<div class="tacts">' + (Q.acts.length ? Q.acts.map(function (c, j) { var on = (T.picks[q] && T.picks[q].j === j) || (T.st && T.st.t === q && T.st.tj === j); return '<button class="achip ok' + (on ? ' sel' : '') + '" data-act="tact" data-p="' + q + '" data-j="' + j + '" style="--ac:' + ART.ACOL[c.k][1] + '">' + ART.aicon(c.k) + '<span>' + ART.ANAME[c.k] + '</span></button>'; }).join('') : '<span class="muted">nessuna carta Azione</span>') + '</div>';
  var sh = q !== me && shielded(g, q) && ['exch', 'rmall', 'steal'].indexOf(T.k) >= 0 ? '<span class="tag ok">' + ART.aicon('prot') + ' ha lo Scudo</span>' : '';
  return '<div class="tb" style="--pc:' + pcol(g, q) + '"><div class="tb-h"><span class="pv">' + esc(Q.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(Q.nick) + (q === me ? ' (tu)' : '') + '</b>' + sh + '</div>' + (T.k === 'steal' ? '' : '<div class="board tbb">' + h + '</div>') + acts + '</div>';
}
function tgtReady(g, me, T) {
  switch (T.k) {
    case 'exch': return T.sel.length === 2 ? { p1: T.sel[0].p, i1: T.sel[0].i, p2: T.sel[1].p, i2: T.sel[1].i } : null;
    case 'swap2': return T.sel.length === 2 ? { i1: T.sel[0].i, i2: T.sel[1].i } : null;
    case 'look': if (!T.line) return null; return T.line.row != null ? { t: T.line.t, row: T.line.row } : { t: T.line.t, col: T.line.col };
    case 'rmall': {
      var need = E.aliveList(g).filter(function (q) { var Q = g.players[q]; return q !== me && !shielded(g, q) && (E.live(Q).length || Q.acts.length); });
      if (!need.every(function (q) { return T.picks[q]; })) return null;
      return { picks: need.map(function (q) { var x = T.picks[q]; return x.j != null ? { p: q, j: x.j } : { p: q, i: x.i }; }) };
    }
    case 'redo': return T.j2 != null ? { j2: T.j2 } : null;
    case 'steal': return T.st ? { t: T.st.t, tj: T.st.tj } : null;
  }
  return {};
}
function tgtBody(g, me) {
  var T = App.tgt, k = T.k, info = E.ACTS[k], opp = E.aliveList(g).filter(function (q) { return q !== me; }), h = '', how = '';
  switch (k) {
    case 'exch':
      how = T.sel.length === 0 ? 'Tocca la prima carta: una tua o di un avversario.' : T.sel.length === 1 ? 'Ora tocca una carta di <b>un altro giocatore</b>.' : 'Pronto: tocca <b>Scambia</b>.';
      h = [me].concat(opp).map(function (q) { return tBoard(g, q, me, T); }).join(''); break;
    case 'swap2':
      how = T.sel.length < 2 ? 'Tocca ' + (T.sel.length ? 'la seconda carta' : 'due carte') + ' della tua griglia da scambiare di posto.' : 'Pronto: tocca <b>Scambia</b>.';
      h = tBoard(g, me, me, T); break;
    case 'look':
      how = 'Scegli se guardare una <b>colonna</b> o una <b>riga</b>, poi tocca una carta di quella fila.';
      h = '<div class="row tdir"><button class="chip' + (T.dir === 'col' ? ' on' : '') + '" data-act="tdir" data-d="col">Colonna</button><button class="chip' + (T.dir === 'row' ? ' on' : '') + '" data-act="tdir" data-d="row">Riga</button></div>' +
        [me].concat(opp).map(function (q) { return tBoard(g, q, me, T); }).join(''); break;
    case 'rmall':
      how = 'Per ogni avversario tocca una carta da togliere: una della griglia (al suo posto arriva una carta coperta) o una sua carta Azione. Chi ha lo Scudo è al sicuro.';
      h = opp.map(function (q) { return tBoard(g, q, me, T); }).join(''); break;
    case 'redo': {
      how = 'Scegli quale carta Azione ripescare dagli scarti: la giochi subito.';
      var seenK = {};
      h = '<div class="tdisc">' + g.adisc.map(function (x, j) { if (x === 'redo' || seenK[x]) return ''; seenK[x] = 1; return '<button class="tdc' + (T.j2 === j ? ' sel' : '') + '" data-act="tdisc" data-j="' + j + '">' + ART.acard(x) + '<small>' + esc(E.ACTS[x][1]) + '</small></button>'; }).join('') + '</div>'; break;
    }
    case 'steal':
      how = 'Scegli quale carta Azione rubare: la giochi subito. Chi ha lo Scudo si difende.';
      h = opp.filter(function (q) { return g.players[q].acts.length; }).map(function (q) { return tBoard(g, q, me, T); }).join(''); break;
  }
  var ready = tgtReady(g, me, T), go = { exch: 'Scambia', swap2: 'Scambia', look: 'Sbircia', rmall: 'Togli le carte', redo: 'Ripesca e gioca', steal: 'Ruba e gioca' }[k] || 'Gioca';
  return '<div class="acard-sh small">' + ART.acard(k) + '<div><div class="kicker">' + (T.via === 'chain' ? 'Gioca subito' : 'Carta Azione') + '</div><h2>' + ART.ANAME[k] + '</h2><p class="lead">' + esc(info[1]) + '</p></div></div>' +
    '<p class="notice">' + how + '</p>' + h +
    '<button class="btn block" data-act="tgo"' + (ready ? '' : ' disabled') + '>' + go + '</button>' +
    '<button class="btn ghost block" data-act="tcancel">' + (T.via === 'chain' ? 'Rinuncia all’effetto' : 'Annulla (tieni la carta)') + '</button>';
}
function tgtCell(q, i) {
  var g = G(), me = myIdx(), T = App.tgt; if (!T) return;
  switch (T.k) {
    case 'exch': {
      var at = -1; T.sel.forEach(function (y, n) { if (y.p === q) at = n; });
      if (at >= 0) { if (T.sel[at].i === i) T.sel.splice(at, 1); else T.sel[at] = { p: q, i: i }; }
      else if (T.sel.length < 2) T.sel.push({ p: q, i: i }); else T.sel[1] = { p: q, i: i };
      if (T.sel.length === 2 && T.sel[0].p !== me && T.sel[1].p !== me && q === me) T.sel = [{ p: q, i: i }];
      break;
    }
    case 'swap2': {
      if (q !== me) return;
      var ix = -1; T.sel.forEach(function (y, n) { if (y.i === i) ix = n; });
      if (ix >= 0) T.sel.splice(ix, 1); else if (T.sel.length < 2) T.sel.push({ p: q, i: i }); else T.sel[1] = { p: q, i: i };
      break;
    }
    case 'look': T.line = T.dir === 'row' ? { t: q, row: Math.floor(i / 4) } : { t: q, col: i % 4 }; break;
    case 'rmall': if (q === me || shielded(g, q)) { if (q !== me) toast(esc(g.players[q].nick) + ' ha lo Scudo: è al sicuro.'); return; } T.picks[q] = T.picks[q] && T.picks[q].i === i ? null : { i: i }; break;
    default: return;
  }
  Sound.play('pick'); renderSheet();
}
function peekBody(g, me, s) {
  var T = g.players[s.t]; if (!T) return '';
  return '<div class="kicker">Sbircia</div><h2>' + (s.t === me ? 'La tua ' : 'La ') + (s.row != null ? 'riga ' + (s.row + 1) : 'colonna ' + (s.col + 1)) + (s.t === me ? '' : ' di ' + esc(T.nick)) + '</h2>' +
    (s.cells.length ? '<div class="peekrow">' + s.cells.map(function (c) { return '<span>' + ART.card(c.v, true) + '<small>' + (s.row != null ? 'colonna ' + (c.i % 4 + 1) : 'riga ' + (Math.floor(c.i / 4) + 1)) + '</small></span>'; }).join('') + '</div><p class="lead">Solo tu le hai viste. Sul tavolo restano coperte, ma tu le vedi segnate con un numerino.</p>' : '<p class="lead">In quella fila non c’erano carte coperte.</p>') + closeBtn('Ho visto');
}

/* ---------- eventi ---------- */
function cellClick(i) {
  var g = G(), me = myIdx(); if (!g || me < 0) return;
  var P = g.players[me], x = P.grid[i]; if (!x) return;
  if (g.phase === 'reveal') {
    if (E.flips(P) >= 2) { toast('Hai già scoperto due carte: aspetta gli altri.'); return; }
    if (x.up) { toast('Questa è già scoperta: scegline una coperta.'); Sound.play('no'); return; }
    act({ a: 'flip', i: i }); return;
  }
  if (g.phase !== 'play') return;
  if (g.turn !== me) { toast('Aspetta il tuo turno.'); Sound.play('no'); return; }
  if (P.bonus) { toast('Prima scegli una carta <b>Azione</b> (o rinuncia).'); Sound.play('no'); return; }
  if (g.chain) { App.sheet = { kind: 'tgt' }; renderSheet(); return; }
  if (g.pick) {
    if (App.pickC == null) { toast('Prima tocca una delle tre carte pescate (o <b>Nessuna</b>).'); Sound.play('no'); return; }
    if (App.pickC === -1 && x.up) { toast('Scegli una carta <b>coperta</b> da scoprire.'); Sound.play('no'); return; }
    var pc = App.pickC; App.pickC = null; act({ a: 'pick', c: pc, i: i }); return;
  }
  if (App.mode === 'drop') { if (x.up) { toast('Scegli una carta <b>coperta</b> da scoprire.'); Sound.play('no'); return; } App.mode = null; act({ a: 'drop', i: i }); return; }
  if (App.mode === 'take') { App.mode = null; act({ a: 'take', i: i }); return; }
  if (g.drawn) { act({ a: 'swap', i: i }); return; }
  toast('Prima pesca dal <b>mazzo</b> o tocca gli <b>scarti</b>.'); Sound.play('no');
}
function discClick() {
  var g = G(), me = myIdx(); if (!g || g.phase !== 'play' || g.turn !== me) return;
  if (g.drawn) {
    if (g.drawn.from !== 'deck') return;
    if (!E.hidden(g.players[me]).length) { toast('Non hai carte coperte da scoprire: metti la carta pescata al posto di una tua.'); Sound.play('no'); return; }
    App.mode = App.mode === 'drop' ? null : 'drop';
  } else App.mode = App.mode === 'take' ? null : 'take';
  Sound.play('pick'); Game.render();
}
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet;
  switch (a) {
    case 'sheetback': if (ev.target === el && s && s.kind !== 'intro' && Date.now() - (App.sheetAt || 0) > 450) { App.sheet = null; renderSheet(); } return;
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r'), back: s && s.kind !== 'help' ? s : null }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); break;
    case 'scorecard': App.sheet = { kind: 'scorecard' }; renderSheet(); break;
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); break;
    case 'intronext': s.page++; renderSheet(); break;
    case 'introprev': s.page--; renderSheet(); break;
    case 'introdone': lsSet('sk-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'showround': App.sheet = { kind: 'round' }; renderSheet(); break;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else App.sheet = null; renderSheet(); break;
    case 'leave': App.sheet = null; if (Exit.ask()) renderSheet(); else leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; renderSheet(); Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i giocatori automatici.'); break;
    case 'auto': App.sheet = null; renderSheet(); send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'resume': send({ t: 'back' }); break;
    case 'player': App.sheet = { kind: 'player', p: +el.getAttribute('data-p') }; renderSheet(); break;
    // il turno
    case 'cell': cellClick(+el.getAttribute('data-i')); break;
    case 'deck':
      if (!g || g.phase !== 'play') return;
      if (g.turn !== me) { toast('Aspetta il tuo turno.'); Sound.play('no'); return; }
      if (g.drawn) { toast('Hai già pescato: metti la carta nella griglia o scartala.'); return; }
      App.mode = null; act({ a: 'draw' }); break;
    case 'disc': discClick(); break;
    // carte Azione
    case 'arow': {
      if (!g || !g.opts.action) return;
      var rr = el.getAttribute('data-r'), rk = rr === 'deck' ? null : g.arow[+rr];
      App.sheet = { kind: 'acard', src: rr === 'deck' ? 'deck' : 'row', r: rr, k: rk }; renderSheet(); break;
    }
    case 'abonus': { var rb = el.getAttribute('data-r'); App.sheet = null; renderSheet(); act({ a: 'bonus', r: rb === 'deck' ? 'deck' : +rb }); break; }
    case 'agrab': { var rg = el.getAttribute('data-r'); App.sheet = null; renderSheet(); act({ a: 'grab', r: rg === 'deck' ? 'deck' : +rg }); break; }
    case 'bonusskip': act({ a: 'bonus', r: 'skip' }); break;
    case 'myact': { var pj = +el.getAttribute('data-p'), jj = +el.getAttribute('data-j'); if (!g || !g.players[pj] || !g.players[pj].acts[jj]) return; App.sheet = { kind: 'acard', src: pj === me ? 'mine' : 'other', j: jj, k: g.players[pj].acts[jj].k, own: pj === me }; renderSheet(); break; }
    case 'ause': startUse(+el.getAttribute('data-j')); break;
    case 'atoss': App.sheet = null; renderSheet(); act({ a: 'toss', j: +el.getAttribute('data-j') }); break;
    case 'pickc': { var cc = +el.getAttribute('data-c'); App.pickC = App.pickC === cc ? null : cc; Sound.play('pick'); Game.render(); break; }
    case 'tgtopen': if (App.tgt) { App.sheet = { kind: 'tgt' }; renderSheet(); } break;
    case 'tcancel':
      if (App.tgt && App.tgt.via === 'chain') { App.tgt = null; App.sheet = null; renderSheet(); act({ a: 'chain', skip: true }); }
      else { App.tgt = null; App.sheet = null; renderSheet(); Game.render(); }
      break;
    case 'tcell': tgtCell(+el.getAttribute('data-p'), +el.getAttribute('data-i')); break;
    case 'tdir': if (App.tgt) { App.tgt.dir = el.getAttribute('data-d'); App.tgt.line = null; renderSheet(); } break;
    case 'tdisc': if (App.tgt) { App.tgt.j2 = +el.getAttribute('data-j'); Sound.play('pick'); renderSheet(); } break;
    case 'tact': {
      var T = App.tgt; if (!T) return; var tq = +el.getAttribute('data-p'), tj = +el.getAttribute('data-j');
      if (T.k === 'rmall') { if (shielded(g, tq)) { toast(esc(g.players[tq].nick) + ' ha lo Scudo: è al sicuro.'); return; } T.picks[tq] = T.picks[tq] && T.picks[tq].j === tj ? null : { j: tj }; }
      else if (T.k === 'steal') T.st = T.st && T.st.t === tq && T.st.tj === tj ? null : { t: tq, tj: tj };
      Sound.play('pick'); renderSheet(); break;
    }
    case 'tgo': {
      var T2 = App.tgt; if (!T2) return; var prm = tgtReady(g, me, T2); if (!prm) return;
      var op = { a: T2.via === 'chain' ? 'chain' : 'use' }; if (T2.via !== 'chain') op.j = T2.j; for (var kk in prm) op[kk] = prm[kk];
      App.tgt = null; App.sheet = null; renderSheet(); act(op); break;
    }
    case 'cancel': App.mode = null; Game.render(); break;
    case 'next': act({ a: 'next' }); break;
    case 'nextround': send({ t: 'nextround' }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (ev.target.id === 'opt-target') send({ t: 'opt', target: +ev.target.value });
  if (ev.target.id === 'opt-variant') send({ t: 'opt', action: ev.target.value === 'action' });
  if (ev.target.id === 'opt-elim') send({ t: 'opt', elim: ev.target.value === '1' });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape') { if (App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); } else if (App.mode) { App.mode = null; Game.render(); } }
});

/* ---------- avvio ---------- */
(function boot() {
  document.body.insertAdjacentHTML('afterbegin', ART.defs());
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || myNick()) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
