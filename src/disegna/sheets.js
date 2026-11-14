/* ===== Disegna e indovina: finestre (regole, menu, squadra, classifica, presentazione) ed eventi ===== */
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
      (g ? '<button class="btn ghost block" data-act="log">Tutte le mosse</button>' : '') +
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
  if (s.kind === 'team') {
    var T = g.teams[s.t]; if (!T) return '';
    var isHost = App.doc.host === Net.uid;
    return '<div class="phead"><span class="pv big" style="--pc:' + tcol(g, s.t) + '">' + esc(T.name.charAt(0)) + '</span><div><div class="kicker">Squadra</div><h2>' + esc(T.name) + '</h2></div></div>' +
      '<div class="tags"><span class="gc">Punti: <b>' + T.total + '</b></span></div>' +
      '<div style="display:grid;gap:6px">' + E.members(g, s.t).map(function (i) {
        var P = g.players[i];
        return '<div class="seat full"><div class="ava" style="--pc:' + pcol(g, i) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</div><div style="flex:1"><div class="nm">' + Net.dot(P.uid) + esc(P.nick) + (i === me ? ' (tu)' : '') + '</div><div class="sub">' + (P.away ? 'assente: l’automatico passa il turno' : P.bot ? 'giocatore automatico (indovina)' : 'giocatore') + '</div></div>' +
          (isHost && i !== me && g.phase !== 'over' ? '<button class="btn ghost small" data-act="auto" data-p="' + i + '">' + (P.bot ? 'Ridai il controllo' : 'Automatico') + '</button>' : '') + '</div>';
      }).join('') + '</div>' + closeBtn();
  }
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}
function overBody(g, me) {
  var W = g.winners, order = g.final.order, place = g.final.place, mt = me >= 0 ? g.players[me].team : -1, iw = W.indexOf(mt) >= 0;
  var podium = order.slice(0, 3).map(function (t, k) { var T = g.teams[t]; return '<div class="pod p' + (k + 1) + '" style="--pc:' + tcol(g, t) + '"><span class="pv big">' + esc(T.name.charAt(0)) + '</span><b>' + esc(T.name) + '</b><span class="pod-s">' + T.total + '</span><span class="pod-b">' + place[t] + '</span></div>'; }).join('');
  var title = iw ? 'Avete vinto!' : W.length > 1 ? 'Pari tra ' + W.map(function (t) { return esc(g.teams[t].name); }).join(' e ') : 'Vincono i ' + esc(g.teams[W[0]].name);
  var hits = g.log.filter(function (l) { return l.k === 'hit' || l.k === 'steal'; }).length;
  return '<div class="over"><span class="over-pen">' + ART.pencil() + '</span><h2>' + title + '</h2><p class="lead">' + g.order.length + ' disegni, ' + hits + ' indovinati.</p>' +
    '<div class="podium">' + podium + '</div>' +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var pages = [['Benvenuto a Disegna e indovina', RU.S.goal[1]], ['Disegnare', RU.S.draw[1]], ['Indovinare', RU.S.guess[1]], ['Il furto', RU.S.steal[1]]];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si gioca!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- la casella delle risposte ---------- */
document.addEventListener('submit', function (ev) {
  if (ev.target.id !== 'gform') return; ev.preventDefault();
  var i = document.getElementById('gin'), g = G(); if (!i || !g) return;
  var w = i.value.trim(); if (!w) return;
  i.value = ''; Sound.play('guess'); quiet({ a: 'guess', w: w });
});

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
    case 'introdone': lsSet('dg-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'showround': App.sheet = { kind: 'round' }; renderSheet(); break;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else App.sheet = null; renderSheet(); break;
    case 'leave': App.sheet = null; if (Exit.ask()) renderSheet(); else leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'team':
      if (el.hasAttribute('data-t')) { App.sheet = { kind: 'team', t: +el.getAttribute('data-t') }; renderSheet(); }
      else send({ t: 'team', uid: el.getAttribute('data-uid') });
      break;
    case 'shuffle': send({ t: 'shuffle' }); break;
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
    case 'choose': act({ a: 'choose', i: +el.getAttribute('data-i') }); break;
    case 'skip': act({ a: 'skip' }); break;
    case 'pen': App.pen.c = el.getAttribute('data-c'); Game.render(); break;
    case 'size': App.pen.w = +el.getAttribute('data-w'); if (App.pen.c === '#fffdf6') App.pen.c = '#1d2333'; Game.render(); break;
    case 'undo': Game.undo(); break;
    case 'clear': Game.clear(); break;
  }
});
document.addEventListener('change', function (ev) {
  var id = ev.target.id;
  if (id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (id === 'opt-rounds') send({ t: 'opt', rounds: +ev.target.value });
  if (id === 'opt-time') send({ t: 'opt', time: +ev.target.value });
  if (id === 'opt-teams') send({ t: 'opt', teams: +ev.target.value });
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
