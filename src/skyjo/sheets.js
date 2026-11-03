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
      '<div class="pboard">' + Game.boardHTML(g, s.p, {}) + '</div>' +
      '<div class="tags"><span class="gc">Carte scoperte: <b>' + E.sv(E.upSum(P)).replace('+', '') + '</b> punti</span><span class="gc">' + E.hidden(P).length + ' coperte</span><span class="gc">Totale: <b>' + P.total + '</b></span>' + (P.hist.length ? '<span class="gc">Manche: ' + P.hist.map(function (x) { return E.sv(x).replace('+', ''); }).join(' · ') + '</span>' : '') + '</div>' +
      (App.doc.host === Net.uid && s.p !== me && g.phase !== 'over' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
  }
  if (s.kind === 'round' && (g.phase === 'scores' || g.phase === 'over') && g.roundRes) return roundBody(g, me, s);
  if (s.kind === 'scorecard') return '<h2>Segnapunti</h2>' + scorecard(g, me) + closeBtn();
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me, s);
  return '';
}
function roundRows(g, me, anim) {
  var R = g.roundRes, order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return R.pts[a] - R.pts[b] || a - b; });
  return '<div class="rr">' + order.map(function (p, k) {
    var P = g.players[p], d = p === R.ender && R.doubled;
    return '<div class="rr-row' + (p === me ? ' me' : '') + '" style="--pc:' + pcol(g, p) + ';animation-delay:' + (anim ? k * .12 : 0) + 's"><span class="rr-n"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + '</b>' + (p === R.ender ? '<span class="tag end">' + IC('flag') + ' ha chiuso</span>' : '') + '</span>' +
      '<span class="rr-b">' + Game.boardHTML(g, p, {}) + '</span>' +
      '<span class="rr-p">' + (d ? '<s>' + R.raw[p] + '</s><span class="stamp" style="animation-delay:' + (anim ? .9 : 0) + 's">×2</span>' : '') + '<b class="' + (R.pts[p] <= 0 ? 'neg' : '') + '">' + E.sv(R.pts[p]).replace('+', '') + '</b><small>tot. ' + P.total + '</small></span></div>';
  }).join('') + '</div>';
}
function roundBody(g, me, s) {
  var R = g.roundRes, P = me >= 0 ? g.players[me] : null, waiting = E.pending(g), isHost = App.doc.host === Net.uid;
  var note = R.doubled ? pname(g, R.ender) + ' ha chiuso senza avere il punteggio più basso: i suoi ' + R.raw[R.ender] + ' punti raddoppiano!' : pname(g, R.ender) + ' ha chiuso ' + (R.lowest ? 'con il punteggio più basso: ben fatto!' : 'con punti non positivi: niente raddoppio.');
  return '<div class="kicker">Manche ' + g.round + '</div><h2>Punti della manche</h2><p class="lead">' + note + '</p>' + roundRows(g, me, s.fresh) +
    '<div class="target">' + g.players.map(function (Q, i) { return '<span class="tbar" style="--pc:' + pcol(g, i) + ';--w:' + Math.max(0, Math.min(100, Q.total / g.opts.target * 100)).toFixed(1) + '%" title="' + esc(Q.nick) + ': ' + Q.total + '"><i></i><b>' + esc(Q.nick) + ' ' + Q.total + '</b></span>'; }).join('') + '<small>La partita finisce a ' + g.opts.target + ' punti</small></div>' +
    (P && !P.ready ? '<button class="btn block" data-act="next">Prossima manche</button>' : P ? '<p class="lead">Aspetto ' + waiting.map(function (i) { return pname(g, i); }).join(', ') + '…</p>' : '') +
    (isHost && waiting.length && !(waiting.length === 1 && waiting[0] === me) ? '<button class="btn ghost small" data-act="nextround">Inizia senza aspettare</button>' : '') +
    '<button class="btn ghost block" data-act="close">Guarda il tavolo</button>';
}
function scorecard(g, me) {
  var n = g.players[0].hist.length; if (!n) return '<p class="lead">Ancora nessuna manche finita.</p>';
  var head = '<tr><th></th>' + g.players.map(function (P, i) { return '<th style="--pc:' + pcol(g, i) + '"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span>' + esc(P.nick) + '</th>'; }).join('') + '</tr>';
  var rows = ''; for (var r = 0; r < n; r++) rows += '<tr><td>' + (r + 1) + '</td>' + g.players.map(function (P) { var v = P.hist[r]; return '<td class="' + (v <= 0 ? 'neg' : '') + '">' + v + '</td>'; }).join('') + '</tr>';
  var min = Math.min.apply(null, g.players.map(function (P) { return P.total; }));
  return '<div class="card-note"><table class="scard">' + head + rows + '<tr class="tot"><td>Σ</td>' + g.players.map(function (P) { return '<td class="' + (P.total === min ? 'best' : '') + '">' + P.total + '</td>'; }).join('') + '</tr></table></div>';
}
function overBody(g, me, s) {
  var W = g.winners, order = g.final.order, iw = W.indexOf(me) >= 0;
  var podium = order.slice(0, 3).map(function (p, k) { var P = g.players[p]; return '<div class="pod p' + (k + 1) + '" style="--pc:' + pcol(g, p) + '"><span class="pv big">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + '</b><span class="pod-s">' + P.total + '</span><span class="pod-b">' + (1 + order.slice(0, k).filter(function (q) { return g.players[q].total < P.total; }).length) + '</span></div>'; }).join('');
  return '<div class="over"><svg class="over-balloon" viewBox="-30 -34 60 70" aria-hidden="true">' + ART.balloon(0, 0, 1) + '</svg><h2>' + (iw ? (W.length > 1 ? 'Hai vinto, a pari merito!' : 'Hai vinto!') : (W.length > 1 ? 'Vincono ' + W.map(function (i) { return esc(g.players[i].nick); }).join(' e ') : 'Vince ' + esc(g.players[W[0]].nick))) + '</h2>' +
    '<p class="lead">' + esc(g.players[order[order.length - 1]].nick) + ' ha superato i ' + g.opts.target + ' punti dopo ' + g.round + (g.round === 1 ? ' manche' : ' manche') + '.</p>' +
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
    case 'cancel': App.mode = null; Game.render(); break;
    case 'next': act({ a: 'next' }); break;
    case 'nextround': send({ t: 'nextround' }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (ev.target.id === 'opt-target') send({ t: 'opt', target: +ev.target.value });
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
