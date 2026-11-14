/* ===== Nomi, cose, città: finestre (regole, menu, squadra, punti della manche, classifica, presentazione) ed eventi ===== */
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
      (g ? '<button class="btn ghost block" data-act="scorecard">Segnapunti della partita</button><button class="btn ghost block" data-act="log">Tutte le mosse</button>' : '') +
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
    return '<div class="phead"><span class="pv big" style="--pc:' + tcol(g, s.t) + '">' + esc(T.name.charAt(0)) + '</span><div><div class="kicker">' + (g.opts.teams ? 'Squadra' : 'Giocatore') + '</div><h2>' + esc(T.name) + '</h2></div></div>' +
      '<div class="tags"><span class="gc">Punti: <b>' + T.total + '</b></span>' + (T.hist.length ? '<span class="gc">Manche: ' + T.hist.join(' · ') + '</span>' : '') + '</div>' +
      '<div style="display:grid;gap:6px">' + E.members(g, s.t).map(function (i) {
        var P = g.players[i];
        return '<div class="seat full"><div class="ava" style="--pc:' + pcol(g, i) + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</div><div style="flex:1"><div class="nm">' + Net.dot(P.uid) + esc(P.nick) + (i === me ? ' (tu)' : '') + '</div><div class="sub">' + (P.away ? 'assente: gioca l’automatico' : P.bot ? 'giocatore automatico' : 'giocatore') + '</div></div>' +
          (isHost && i !== me && g.phase !== 'over' ? '<button class="btn ghost small" data-act="auto" data-p="' + i + '">' + (P.bot ? 'Ridai il controllo' : 'Automatico') + '</button>' : '') + '</div>';
      }).join('') + '</div>' + closeBtn();
  }
  if (s.kind === 'round' && (g.phase === 'scores' || g.phase === 'over') && g.res) return roundBody(g, me, s);
  if (s.kind === 'scorecard') return '<h2>Segnapunti</h2>' + scorecard(g) + closeBtn();
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}
function roundRows(g, anim) {
  var R = g.res, order = g.teams.map(function (T, t) { return t; }).sort(function (a, b) { return R.tot[b] - R.tot[a] || a - b; }), mt = myIdx() >= 0 ? g.players[myIdx()].team : -1;
  return '<div class="rr">' + order.map(function (t, k) {
    var T = g.teams[t];
    return '<div class="rr-row' + (t === mt ? ' me' : '') + '" style="--pc:' + tcol(g, t) + ';animation-delay:' + (anim ? k * .1 : 0) + 's"><span class="rr-n"><b>' + esc(T.name) + '</b></span>' +
      '<span class="rr-w">' + g.cats.map(function (c) { var w = g.rev.cells[t][c].w, p = R.pts[t][c]; return '<span class="mw p' + p + '">' + (w ? esc(w) : '—') + '</span>'; }).join('') + '</span>' +
      '<span class="rr-p"><b>+' + R.tot[t] + '</b><small>tot. ' + T.total + '</small></span></div>';
  }).join('') + '</div>';
}
function roundBody(g, me, s) {
  var P = me >= 0 ? g.players[me] : null, waiting = E.pending(g), isHost = App.doc.host === Net.uid;
  return '<div class="kicker">Manche ' + g.round + ' di ' + g.opts.rounds + ' · lettera ' + g.letter + '</div><h2>Punti della manche</h2>' + roundRows(g, s.fresh) +
    (g.phase === 'scores' ? (P && !P.ready ? '<button class="btn block" data-act="next">Prossima manche</button>' : P ? '<p class="lead">Aspetto ' + waiting.map(function (i) { return pname(g, i); }).join(', ') + '…</p>' : '') +
      (isHost && waiting.length && !(waiting.length === 1 && waiting[0] === me) ? '<button class="btn ghost small" data-act="nextround">Inizia senza aspettare</button>' : '') : '') +
    '<button class="btn ghost block" data-act="close">Guarda le risposte</button>';
}
function scorecard(g) {
  var n = g.teams[0].hist.length; if (!n) return '<p class="lead">Ancora nessuna manche finita.</p>';
  var head = '<tr><th></th>' + g.teams.map(function (T, t) { return '<th style="color:' + tcol(g, t) + '">' + esc(T.name) + '</th>'; }).join('') + '</tr>';
  var rows = ''; for (var r = 0; r < n; r++) rows += '<tr><td>' + (r + 1) + '</td>' + g.teams.map(function (T) { return '<td>' + T.hist[r] + '</td>'; }).join('') + '</tr>';
  var max = Math.max.apply(null, g.teams.map(function (T) { return T.total; }));
  return '<div class="card-note"><table class="scard">' + head + rows + '<tr class="tot"><td>Σ</td>' + g.teams.map(function (T) { return '<td class="' + (T.total === max ? 'best' : '') + '">' + T.total + '</td>'; }).join('') + '</tr></table></div>';
}
function overBody(g, me) {
  var W = g.winners, order = g.final.order, place = g.final.place, mt = me >= 0 ? g.players[me].team : -1, iw = W.indexOf(mt) >= 0;
  var podium = order.slice(0, 3).map(function (t, k) { var T = g.teams[t]; return '<div class="pod p' + (k + 1) + '" style="--pc:' + tcol(g, t) + '"><span class="pv big">' + esc(T.name.charAt(0)) + '</span><b>' + esc(T.name) + '</b><span class="pod-s">' + T.total + '</span><span class="pod-b">' + place[t] + '</span></div>'; }).join('');
  var title = iw ? (g.opts.teams ? 'Avete vinto!' : 'Hai vinto!') : W.length > 1 ? 'Pari tra ' + W.map(function (t) { return esc(g.teams[t].name); }).join(' e ') : (g.opts.teams ? 'Vincono i ' : 'Vince ') + esc(g.teams[W[0]].name);
  return '<div class="over">' + ART.tile('★', { cls: 'over-tile' }) + '<h2>' + title + '</h2><p class="lead">Dopo ' + g.round + ' manche e ' + g.round + ' lettere (' + g.used.join(', ') + ').</p>' +
    '<div class="podium">' + podium + '</div>' + (g.res ? '<details class="lastround"><summary>Ultima manche</summary>' + roundRows(g, false) + '</details>' : '') + scorecard(g) +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda le risposte') + '</div>';
}
function introBody(s) {
  var pages = [['Benvenuto a Nomi, cose, città', RU.S.goal[1]], ['Scrivere', RU.S.turn[1]], ['Il controllo', RU.S.check[1]], ['I punti', RU.S.points[1]]];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si gioca!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- le caselle del foglio: si manda la parola mentre si scrive (con un attimo di pausa) e quando si esce ---------- */
App.hold = {}; var typeT = {};
function sendWord(inp) {
  var g = G(), c = inp.getAttribute('data-c'); if (!g || g.phase !== 'write' || myIdx() < 0) return;
  var v = inp.value.slice(0, 32);
  App.hold[c] = Date.now() + 2500;
  if (App.sent[c] === v) return;
  App.sent[c] = v; quiet({ a: 'w', c: c, w: v });
}
document.addEventListener('input', function (ev) {
  var inp = ev.target; if (!inp.classList || !inp.classList.contains('cin')) return;
  var c = inp.getAttribute('data-c'), g = G();
  App.hold[c] = Date.now() + 2500;
  var cell = inp.closest('.cell'); if (cell && g) { var st = E.check(inp.value, g.letter); cell.classList.toggle('ok', st === 'ok'); cell.classList.toggle('bad', st === 'letter' || st === 'short'); }
  clearTimeout(typeT[c]); typeT[c] = setTimeout(function () { sendWord(inp); }, 500);
});
document.addEventListener('focusout', function (ev) { var inp = ev.target; if (inp.classList && inp.classList.contains('cin')) { clearTimeout(typeT[inp.getAttribute('data-c')]); sendWord(inp); } });

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
    case 'introdone': lsSet('nc-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
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
    case 'stop': if (g && g.phase === 'write') { var f = document.activeElement; if (f && f.classList && f.classList.contains('cin')) f.blur(); setTimeout(function () { act({ a: 'stop' }); }, 120); } break;
    case 'flag': act({ a: 'flag', t: +el.getAttribute('data-t'), c: el.getAttribute('data-c') }); break;
    case 'vote': Sound.play('vote'); act({ a: 'vote', t: +el.getAttribute('data-t'), c: el.getAttribute('data-c'), ok: el.getAttribute('data-ok') === '1' }); break;
    case 'ready': act({ a: 'ready' }); break;
    case 'unready': act({ a: 'unready' }); break;
    case 'next': act({ a: 'next' }); break;
    case 'nextround': send({ t: 'nextround' }); break;
  }
});
document.addEventListener('change', function (ev) {
  var id = ev.target.id;
  if (id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (id === 'opt-rounds') send({ t: 'opt', rounds: +ev.target.value });
  if (id === 'opt-time') send({ t: 'opt', time: +ev.target.value });
  if (id === 'opt-teams') send({ t: 'opt', teams: +ev.target.value });
  if (id === 'opt-cats') send({ t: 'opt', cats: ev.target.value });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('cin')) {
    e.preventDefault(); var nx = document.querySelector('.cin[data-i="' + (+e.target.getAttribute('data-i') + 1) + '"]');
    if (nx) nx.focus(); else e.target.blur();
  }
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
