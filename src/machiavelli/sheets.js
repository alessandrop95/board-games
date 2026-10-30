/* ===== Machiavelli: finestre (regole, menu, giocatori, classifica, presentazione) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  if (root._s !== s) { root._s = s; App.sheetAt = Date.now(); }
  root.innerHTML = '<div class="sheet-back" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>';
  if (s.kind === 'rules' && s.focus) { var t = document.getElementById('r-' + s.focus); if (t) t.scrollIntoView({ block: 'start' }); }
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function sheetBody(s) {
  var g = G(), me = myIdx();
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button><button class="btn ghost block" data-act="log">Tutte le mosse della partita</button>' +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? PCOL[g.players[l.p].col % PCOL.length] : 'rgba(216,178,90,.5)'; return '<div class="fl" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'player') {
    var P = g.players[s.p];
    return '<div class="phead"><span class="pv big" style="--pc:' + PCOL[P.col % PCOL.length] + '">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><div><div class="kicker">' + (s.p === me ? 'Tu' : 'Giocatore') + '</div><h2>' + Net.dot(P.uid) + esc(P.nick) + '</h2></div></div>' +
      '<div class="tags"><span class="gc">' + IC('cards') + P.hand.length + ' carte in mano</span><span class="gc">' + P.played + ' carte calate</span>' + (g.opts.open36 ? '<span class="gc">' + (P.opened ? 'ha aperto' : 'deve ancora aprire') + '</span>' : '') + '</div>' +
      (App.doc.host === Net.uid && s.p !== me && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
  }
  if (s.kind === 'drawconfirm') return '<h2>Pescare?</h2><p class="lead">Hai già spostato delle carte: se peschi, il tavolo torna com’era all’inizio del turno e le carte tornano in mano.</p><button class="btn block" data-act="drawyes">Annulla le mosse e ' + (g.deck.length ? 'pesca' : 'passa') + '</button>' + closeBtn('Continua a giocare');
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}
function introBody(s) {
  function C(r, su, d) { return (d || 0) * 52 + su * 13 + (r - 1); }
  var pages = [
    ['Benvenuto a Machiavelli', '<div class="intro-art">' + RU.row([C(9, 2), C(10, 2), C(11, 2)]) + RU.row([C(4, 0), C(4, 1), C(4, 3)]) + '</div>' + RU.S.goal[1]],
    ['Ogni turno: giochi o peschi', RU.S.turn[1] + '<p>Le combinazioni sul tavolo puoi <b>smontarle e rimontarle</b> come vuoi, purché alla fine siano tutte valide e tu abbia messo almeno una carta tua.</p>'],
    ['Come si spostano le carte', '<ul class="intro-list"><li><b>Trascina</b> una carta sul posto giusto: dove sta bene, la combinazione si accende di <b>verde</b>.</li><li>Oppure <b>tocca</b> le carte per selezionarle e poi tocca il posto dove metterle.</li>' +
      '<li>La casella tratteggiata crea una <b>nuova combinazione</b>: finché è incompleta è <b>rossa</b>.</li><li><b>Annulla</b> rimette tutto com’era; <b>Fine turno</b> si accende quando il tavolo è tutto valido.</li><li>Gli altri vedono in diretta quello che stai facendo.</li></ul>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Iniziamo!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}
function overBody(g, me) {
  var F = g.final, W = g.winner;
  var rows = F.order.map(function (p, i) {
    var P = g.players[p], r = F.rows[p];
    return '<div class="fr' + (i === 0 ? ' win' : '') + '" style="--pc:' + PCOL[P.col % PCOL.length] + ';animation-delay:' + (i * .2) + 's"><div class="fr-h"><span class="rk">' + (i + 1) + '</span><b>' + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="tot">' + r.left + '</span></div>' +
      '<div class="fr-d">' + (r.left ? 'carte rimaste (' + r.pts + ' punti)' : 'nessuna carta: ha chiuso!') + '</div>' + (r.left ? '<div class="fr-c">' + P.hand.map(function (c) { return '<span class="cw">' + ART.card(c) + '</span>'; }).join('') + '</div>' : '') + '</div>';
  }).join('');
  return '<div class="over"><h2>' + (W === me ? 'Hai vinto!' : 'Vince ' + esc(g.players[W].nick)) + '</h2><p class="lead">' + (F.out ? 'Ha calato tutte le sue carte.' : 'Il mazzo è finito e nessuno poteva più giocare: vince chi aveva meno carte.') + '</p>' +
    '<div class="frs">' + rows + '</div>' + Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}

/* ---------- eventi ---------- */
function playDone() {
  var g = G(); if (!Work.active()) return;
  if (!Work.played().length) { toast('Metti sul tavolo almeno una carta della tua mano, oppure pesca.'); Sound.play('no'); return; }
  if (!Work.allValid()) { toast('Ci sono combinazioni rosse: sistemale prima di finire il turno.', 'bad'); Sound.play('no'); return; }
  act({ a: 'play', t: Work.table() });
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
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); break;
    case 'intronext': s.page++; renderSheet(); break;
    case 'introprev': s.page--; renderSheet(); break;
    case 'introdone': lsSet('mc-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
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
    case 'sort': App.sortBy = App.sortBy === 'rank' ? 'suit' : 'rank'; lsSet('mc-sort', App.sortBy); Game.render(); break;
    // il turno
    case 'grp': case 'newg': {   // carte selezionate → in questa combinazione / in una nuova
      if (ev.target.closest('.cw') || !Work.active()) return;
      var W = Work.get(); if (!W.sel.length) { if (a === 'newg') toast('Trascina qui una carta, oppure selezionane alcune e tocca qui.'); return; }
      Work.move(W.sel.slice(), a === 'newg' ? 'new' : el.getAttribute('data-g')); Game.render(); break;
    }
    case 'tohand': { if (ev.target.closest('.cw') || !Work.active()) return; var W2 = Work.get(); if (W2.sel.length) { Work.move(W2.sel.slice(), 'hand'); Game.render(); } break; }
    case 'undo': if (Work.active()) { Work.reset(); Game.render(); } break;
    case 'done': playDone(); break;
    case 'draw': if (!Work.active()) return; if (Work.changed()) { App.sheet = { kind: 'drawconfirm' }; renderSheet(); } else act({ a: 'draw' }); break;
    case 'drawyes': App.sheet = null; renderSheet(); Work.reset(); act({ a: 'draw' }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (ev.target.id === 'opt-cards') send({ t: 'opt', cards: +ev.target.value });
  if (ev.target.id === 'opt-open36') send({ t: 'opt', open36: ev.target.checked });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); }
});

/* ---------- avvio ---------- */
(function boot() {
  App.sortBy = lsGet('mc-sort') === 'rank' ? 'rank' : 'suit';
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || myNick()) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
