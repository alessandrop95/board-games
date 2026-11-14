/* ===== Burraco: finestre (regole, menu, giocatore, punti della mano, classifica, segni, presentazione) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; root._s = null; root._h = null; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  var same = root._s === s;
  if (!same) { root._s = s; App.sheetAt = Date.now(); }
  if (same && root._h === h) return;
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
      (g ? '<button class="btn ghost block" data-act="scorecard">Segnapunti</button><button class="btn ghost block" data-act="log">Tutte le mosse</button>' : '') +
      Awake.menuHTML('btn ghost block') +
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
    var isHost = App.doc.host === Net.uid;
    return '<div class="phead"><span class="pv big" style="--pc:' + pcol(g, s.p) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><div><div class="kicker">' + (s.p === me ? 'Tu' : g.players.length === 4 && me >= 0 && E.team(g, s.p) === E.team(g, me) ? 'Il tuo compagno' : 'Avversario') + '</div><h2>' + Net.dot(P.uid) + esc(P.nick) + '</h2></div></div>' +
      '<div class="tags"><span class="gc">' + P.hand.length + ' carte in mano</span>' + (P.away ? '<span class="gc">assente: gioca l’automatico</span>' : P.bot ? '<span class="gc">giocatore automatico</span>' : '') + '</div>' +
      (isHost && s.p !== me && g.phase !== 'over' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
  }
  if (s.kind === 'signs') {
    if (me < 0 || g.players.length !== 4) return '';
    return '<h2>Segni al compagno</h2><p class="lead">Li vede solo ' + esc(g.players[E.partner(g, me)].nick) + '.</p><div class="signs">' + Object.keys(E.SIGNS).map(function (k) { return '<button class="btn ghost block" data-act="sign" data-k="' + k + '">' + esc(E.SIGNS[k]) + '</button>'; }).join('') + '</div>' + closeBtn('Annulla');
  }
  if (s.kind === 'round' && (g.phase === 'scores' || g.phase === 'over') && g.res) return roundBody(g, me, s);
  if (s.kind === 'scorecard') return '<h2>Segnapunti</h2>' + scorecard(g) + closeBtn();
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}
function roundBody(g, me, s) {
  var P = me >= 0 ? g.players[me] : null, waiting = E.pending(g), isHost = App.doc.host === Net.uid, R = g.res;
  return '<div class="kicker">Mano ' + g.hand + '</div><h2>' + (R.w < 0 ? (CFG.tieText || 'Pari, 60 a 60') : (g.players.length === 4 ? 'Vincono ' : 'Vince ') + sideName(g, R.w)) + '</h2>' + roundRows(g, s.fresh) +
    (g.phase === 'scores' ? (P && !P.ready ? '<button class="btn block" data-act="next">Prossima mano</button>' : P ? '<p class="lead">' + (waiting.length ? 'Aspetto ' + waiting.map(function (i) { return pname(g, i); }).join(', ') + '…' : 'Si riparte tra poco…') + '</p>' : '') +
      (isHost && waiting.length && !(waiting.length === 1 && waiting[0] === me) ? '<button class="btn ghost small" data-act="nextround">Inizia senza aspettare</button>' : '') : '') +
    '<button class="btn ghost block" data-act="close">Guarda il tavolo</button>';
}
function roundRows(g, anim) {
  var R = g.res, mt = myIdx() >= 0 ? E.team(g, myIdx()) : -1;
  return '<div class="rr">' + [0, 1].map(function (t, k) {
    return '<div class="rr-row' + (t === mt ? ' me' : '') + '" style="--pc:' + (g.players.length === 4 ? TCOL[t] : pcol(g, t)) + ';animation-delay:' + (anim ? k * .12 : 0) + 's"><span class="rr-n"><b>' + sideName(g, t) + '</b></span>' + (CFG.roundDetail ? CFG.roundDetail(g, t) : '<span class="rr-w">' + R.cards[t] + ' carte prese</span>') +
      '<span class="rr-p"><b>' + R.pts[t] + '</b><small>' + (CFG.roundUnit || 'punti') + '</small></span></div>';
  }).join('') + '</div>' + (CFG.roundExtra ? CFG.roundExtra(g) : '<p class="lead" style="text-align:center">Mani vinte: <b>' + g.wins[0] + '</b> a <b>' + g.wins[1] + '</b></p>');
}
function scorecard(g) {
  if (!g.hist.length) return '<p class="lead">Ancora nessuna mano finita.</p>';
  return '<div class="card-note"><table class="scard"><tr><th></th><th>' + sideName(g, 0) + '</th><th>' + sideName(g, 1) + '</th></tr>' + g.hist.map(function (h, i) { return '<tr><td>' + (i + 1) + '</td><td>' + h[0] + '</td><td>' + h[1] + '</td></tr>'; }).join('') + '</table></div>';
}
function overBody(g, me) {
  var W = g.winners, mt = me >= 0 ? E.team(g, me) : -1, iw = W.length === 1 && W[0] === mt;
  var title = W.length > 1 ? 'Partita pari!' : iw ? (g.players.length === 4 ? 'Avete vinto!' : 'Hai vinto!') : (g.players.length === 4 ? 'Vincono ' : 'Vince ') + sideName(g, W[0]);
  return '<div class="over"><span class="over-cards">' + (CFG.overCards || [0, 10, 20, 30]).map(function (c) { return ART.flat(c); }).join('') + '</span><h2>' + title + '</h2><p class="lead">' + (CFG.overLine ? CFG.overLine(g) : 'Mani vinte: ' + g.wins[0] + ' a ' + g.wins[1] + '.') + '</p>' +
    (g.res ? '<details class="lastround"><summary>Ultima mano</summary>' + roundRows(g, false) + '</details>' : '') + scorecard(g) +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var pages = RU.ORDER.filter(function (k) { return k !== 'tips'; }).map(function (k, i) { return [i ? RU.S[k][0] : 'Benvenuto a ' + CFG.title, RU.S[k][1]]; });
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si gioca!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- eventi ---------- */
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
    case 'introdone': lsSet(CFG.key + '-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'showround': App.sheet = { kind: 'round' }; renderSheet(); break;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else App.sheet = null; renderSheet(); break;
    case 'leave': App.sheet = null; if (Exit.ask()) renderSheet(); else leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'team': send({ t: 'team', uid: el.getAttribute('data-uid') }); break;
    case 'player': App.sheet = { kind: 'player', p: +el.getAttribute('data-p') }; renderSheet(); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; renderSheet(); Net.takeHost(); toast('Ora sei tu a reggere il tavolo, il tempo e i giocatori automatici.'); break;
    case 'auto': App.sheet = null; renderSheet(); send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'resume': send({ t: 'back' }); break;
    // la partita
    case 'hcard': { if (!g || me < 0) return; var c = +el.getAttribute('data-c'), k = App.sel.indexOf(c); if (k >= 0) App.sel.splice(k, 1); else App.sel.push(c); Sound.play('pick'); Game.render(); break; }
    case 'draw': act({ a: 'draw' }); break;
    case 'pile': act({ a: 'pile' }); break;
    case 'meld': if (App.sel.length) { var cs = App.sel.slice(); App.sel = []; act({ a: 'meld', cards: cs }); } break;
    case 'addto': if (App.sel.length) { var cs2 = App.sel.slice(); App.sel = []; act({ a: 'add', m: +el.getAttribute('data-m'), cards: cs2 }); } else toast('Prima scegli le carte da attaccare.'); break;
    case 'discard': if (App.sel.length === 1) { var d = App.sel[0]; App.sel = []; act({ a: 'discard', c: d }); } else toast('Scegli una carta sola da scartare.'); break;
    case 'unsel': App.sel = []; Game.render(); break;
    case 'sort': App.sort = App.sort === 'suit' ? 'rank' : 'suit'; Game.render(); break;
    case 'signs': App.sheet = { kind: 'signs' }; renderSheet(); break;
    case 'sign': App.sheet = null; renderSheet(); act({ a: 'sign', k: el.getAttribute('data-k') }); toast('Segno mandato al compagno.'); break;
    case 'next': act({ a: 'next' }); break;
    case 'nextround': send({ t: 'nextround' }); break;
  }
});
document.addEventListener('change', function (ev) {
  var id = ev.target.id;
  if (id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  else if (id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  else if (id.indexOf('opt-') === 0) { var op = { t: 'opt' }, v = ev.target.value; op[id.slice(4)] = /^-?\d+$/.test(v) ? +v : v; send(op); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape') { if (App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); } }
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
