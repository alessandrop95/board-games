/* ===== Binari d'Italia: finestre (tratta, biglietti, città, giocatori, classifica, presentazione) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  if (root._s !== s) { root._s = s; App.sheetAt = Date.now(); } // il tocco che l'ha aperta non deve richiuderla
  root.innerHTML = '<div class="sheet-back' + (s.kind === 'route' || s.kind === 'city' ? ' light' : '') + '" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>';
  if (s.kind === 'rules' && s.focus) { var t = document.getElementById('r-' + s.focus); if (t) t.scrollIntoView({ block: 'start' }); }
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function routeStrip(r, owner, g) { // la tratta disegnata come fila di vagoni
  var k = D.COLORS[r.col], w = 30, out = '';
  for (var i = 0; i < r.len; i++) {
    var loco = r.ferry && i < r.ferry, pc = owner != null ? D.PCOL[g.players[owner].col] : null;
    out += '<svg class="rs-slot" viewBox="0 0 34 14" aria-hidden="true"><rect x="1" y="2" width="32" height="10" rx="2.4" fill="' + (pc ? pc.c : k.c) + '" stroke="' + (pc ? pc.d : k.d) + '" stroke-width="1.4"/>' +
      (loco ? '<g transform="translate(17 7) scale(.55)">' + ART.glyph('L', pc ? '#fff' : '#fff') + '</g>' : '') + '</svg>';
  }
  return '<div class="rs">' + out + '</div>';
}

function sheetBody(s) {
  var g = G(), me = myIdx(), P = g && me >= 0 ? g.players[me] : null;
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button><button class="btn ghost block" data-act="log">Tutte le mosse della partita</button>' +
      '<label class="row tgl"><input type="checkbox" id="opt-can"' + (App.showCan !== false ? ' checked' : '') + '> Nel mio turno evidenzia le tratte che posso prendere</label>' +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? D.PCOL[g.players[l.p].col].c : 'rgba(217,180,90,.5)'; return '<div class="fl" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'route') return routeBody(g, me, s);
  if (s.kind === 'city') return cityBody(g, me, s.c);
  if (s.kind === 'player') return playerBody(g, s.p, me);
  if (s.kind === 'keep') return keepBody(g, me, s);
  if (s.kind === 'tkconfirm') return '<h2>' + IC('ticket') + ' Pescare 3 biglietti?</h2><p class="lead">Usi il turno per pescare 3 biglietti destinazione: ne tieni <b>almeno 1</b> e gli altri tornano in fondo al mazzo. Ogni biglietto tenuto vale punti se lo completi, li toglie se non ci riesci.</p>' +
    '<button class="btn block" data-act="tkyes">Pesca i biglietti</button>' + closeBtn('Annulla');
  if (s.kind === 'mytickets' && P) return myTicketsBody(g, me);
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}

/* ---------- tratta ---------- */
function routeBody(g, me, s) {
  var r = D.byId[s.r], own = g.claims[r.id], pts = D.SCORE[r.len], k = D.COLORS[r.col];
  var head = '<div class="kicker">Tratta</div><h2>' + esc(cn(r.a)) + ' – ' + esc(cn(r.b)) + '</h2>' + routeStrip(r, own, g) +
    '<div class="tags"><span class="gc">' + IC('train') + r.len + ' vagon' + (r.len > 1 ? 'i' : 'e') + '</span><span class="gc">' + IC('star') + '+' + pts + ' punt' + (pts > 1 ? 'i' : 'o') + '</span>' +
    '<span class="gc">' + (r.col === 'X' ? ART.swatch('X') + ' grigia: un colore a scelta' : ART.swatch(r.col) + ' carte ' + k.n) + '</span>' +
    (r.ferry ? '<span class="gc">' + IC('ferry') + ' traghetto: ' + r.ferry + ' locomotiv' + (r.ferry > 1 ? 'e' : 'a') + '</span>' : '') +
    (r.twin != null ? '<span class="gc">binario doppio</span>' : '') + '</div>';
  if (own != null) return head + '<p class="lead">Questa tratta è di ' + pname(g, own) + (own === me ? ' (tua)' : '') + '.</p>' + twinNote(g, r, me) + closeBtn();
  if (me < 0) return head + '<p class="lead">Libera.</p>' + closeBtn();
  var cc = E.canClaim(g, me, r), myTurn = g.phase === 'play' && g.turn === me && g.stage === 'act';
  var help = '<button class="btn ghost small" data-act="help" data-r="' + (r.ferry ? 'ferry' : r.twin != null ? 'double' : 'claim') + '">Come si conquista una tratta?</button>';
  if (!cc.ok) return head + '<div class="why">' + esc(cc.why) + '</div>' + needHint(g, me, r) + twinNote(g, r, me) + help + closeBtn();
  if (!myTurn) return head + '<p class="lead good">Hai le carte per prenderla. Potrai farlo quando sarà il tuo turno' + (g.stage === 'draw2' && g.turn === me ? ' (ora devi prendere la seconda carta)' : '') + '.</p>' + twinNote(g, r, me) + help + closeBtn();
  // scelta del pagamento
  var P = g.players[me], h = P.hand;
  var colors = cc.opts.map(function (o) { return o.n ? o.c : 'L'; }).filter(function (c, i, a) { return a.indexOf(c) === i; });
  if (h.L >= r.len && colors.indexOf('L') < 0) colors.push('L');
  if (s.c == null || colors.indexOf(s.c) < 0) { s.c = colors[0]; s.L = null; }
  var lmin = s.c === 'L' ? r.len : Math.max(r.ferry || 0, r.len - h[s.c]), lmax = s.c === 'L' ? r.len : Math.min(h.L, r.len - 1);
  if (s.L == null || s.L < lmin || s.L > lmax) s.L = lmin;
  var n = r.len - s.L;
  var pick = colors.length > 1 ? '<h4>Con quale colore paghi?</h4><div class="pay-c">' + colors.map(function (c) { return '<button class="chip' + (s.c === c ? ' on' : '') + '" data-act="claimc" data-c="' + c + '">' + ART.swatch(c) + (c === 'L' ? ' solo locomotive' : ' ' + D.COLORS[c].n + ' (' + h[c] + ')') + '</button>'; }).join('') + '</div>' : '';
  var lpick = s.c !== 'L' && lmax > lmin ? '<div class="pay-l"><span>Locomotive da usare</span><button class="zb s" data-act="claimL" data-d="-1"' + (s.L > lmin ? '' : ' disabled') + '>−</button><b>' + s.L + '</b><button class="zb s" data-act="claimL" data-d="1"' + (s.L < lmax ? '' : ' disabled') + '>+</button></div>' : '';
  var use = []; for (var i = 0; i < n; i++) use.push(ART.card(s.c)); for (var j = 0; j < s.L; j++) use.push(ART.card('L'));
  return head + pick + lpick + '<h4>Giocherai</h4><div class="use">' + use.map(function (c) { return '<span class="uc">' + c + '</span>'; }).join('') + '</div>' +
    '<p class="muted">Dopo ti resteranno ' + (P.trains - r.len) + ' vagoni' + (P.trains - r.len <= 2 ? ' — <b class="bad">e scatterà l’ultimo giro!</b>' : '') + '.</p>' +
    '<button class="btn block" data-act="claimok">Conquista ' + esc(cn(r.a)) + ' – ' + esc(cn(r.b)) + ' (+' + pts + ')</button>' + closeBtn('Annulla');
}
function twinNote(g, r, me) {
  if (r.twin == null) return '';
  var o = g.claims[r.twin];
  return '<p class="muted">Binario doppio: ' + (o != null ? 'l’altro binario è di ' + pname(g, o) + '. ' : '') + (g.nplayers <= 3 ? 'con 2 o 3 giocatori se ne usa uno solo.' : 'uno stesso giocatore non può prenderli entrambi.') + '</p>';
}
function needHint(g, me, r) {
  var P = g.players[me], h = P.hand;
  if (g.claims[r.id] != null || E.blocked(g, me, r)) return '';
  var best = r.col === 'X' ? D.CARD_COLORS.reduce(function (b, c) { return h[c] > h[b] ? c : b; }, 'R') : r.col;
  var have = h[best] + h.L, miss = Math.max(0, r.len - have), mf = Math.max(0, (r.ferry || 0) - h.L);
  return '<p class="muted">Hai ' + ART.swatch(best, h[best]) + ' e ' + ART.swatch('L', h.L) + '. ' + (mf ? 'Ti mancano ' + mf + ' locomotiv' + (mf > 1 ? 'e' : 'a') + ' per il traghetto. ' : '') + (miss ? 'Ti mancano ' + miss + ' carte.' : '') + '</p>';
}

/* ---------- città ---------- */
function cityBody(g, me, c) {
  var routes = E.ADJ[c].slice().sort(function (a, b) { return a.len - b.len; });
  var rows = routes.map(function (r) {
    var o = g.claims[r.id], other = r.a === c ? r.b : r.a;
    return '<button class="trow rt" data-act="route" data-r="' + r.id + '"><span class="grow"><b>' + esc(cn(other)) + '</b><small>' + r.len + ' vagoni · ' + (r.col === 'X' ? 'grigia' : D.COLORS[r.col].n) + (r.ferry ? ' · traghetto' : '') + (r.twin != null ? ' · doppia' : '') + '</small></span>' +
      (o != null ? '<span class="own" style="--pc:' + D.PCOL[g.players[o].col].c + '">' + esc(g.players[o].nick) + '</span>' : '<span class="free">libera</span>') + '</button>';
  }).join('');
  var mine = me >= 0 ? g.players[me].tickets.filter(function (id) { return D.tickets[id].a === c || D.tickets[id].b === c; }) : [];
  return '<div class="kicker">Stazione</div><h2>' + esc(cn(c)) + '</h2>' + (mine.length ? '<p class="lead">È su ' + mine.length + ' dei tuoi biglietti.</p>' : '') + '<h4>Tratte da qui</h4><div class="rlist">' + rows + '</div>' + closeBtn();
}

/* ---------- giocatore ---------- */
function playerBody(g, p, me) {
  var P = g.players[p], routes = E.myRoutes(g, p), lg = E.longest(g, p);
  var done = p === me || g.phase === 'over' ? P.tickets.filter(function (id) { var t = D.tickets[id]; return E.connected(g, p, t.a, t.b); }).length : null;
  return '<div class="phead">' + ART.pieceIcon(P.col, 64) + '<div><div class="kicker">' + (p === me ? 'Tu' : 'Giocatore') + ' · vagoni ' + D.PCOL[P.col].n.toLowerCase() + '</div><h2>' + Net.dot(P.uid) + esc(P.nick) + '</h2></div></div>' +
    '<div class="tags"><span class="gc">' + IC('star') + P.score + ' punti</span><span class="gc">' + IC('train') + P.trains + ' vagoni rimasti</span><span class="gc">' + IC('card') + E.handCount(P) + ' carte</span><span class="gc">' + IC('ticket') + P.tickets.length + ' biglietti' + (done != null ? ' (' + done + ' arrivati)' : '') + '</span>' +
    '<span class="gc">' + IC('route') + routes.length + ' tratte</span><span class="gc">' + IC('longest') + 'linea più lunga: ' + lg.len + '</span></div>' +
    (routes.length ? '<button class="btn ghost block" data-act="focusplayer" data-p="' + p + '">Mostra le sue tratte sulla mappa</button>' : '') +
    (App.doc.host === Net.uid && p !== me && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
}

/* ---------- biglietti ---------- */
function keepBody(g, me, s) {
  var P = g.players[me]; if (!P || !P.offer.length) return '';
  var min = g.stage === 'setup' ? 2 : 1; s.sel = (s.sel || []).filter(function (id) { return P.offer.indexOf(id) >= 0; });
  var list = P.offer.map(function (id) {
    var t = D.tickets[id], on = s.sel.indexOf(id) >= 0, conn = E.connected(g, me, t.a, t.b), sp = BOT.shortest(g, me, t.a, t.b);
    var hint = conn ? '<span class="good">' + IC('check') + ' già collegate dalle tue tratte</span>' : sp ? 'Servono almeno <b>' + Math.round(sp.cost) + '</b> vagoni' : '<span class="bad">non più collegabili!</span>';
    return '<div class="kt' + (on ? ' on' : '') + '"><button class="kt-t" data-act="keeptoggle" data-id="' + id + '" aria-pressed="' + on + '">' + ART.ticket(t) + '<span class="kt-chk">' + IC('check') + '</span></button>' +
      '<div class="kt-i"><small>' + hint + '</small><button class="btn ghost small" data-act="keepmap" data-id="' + id + '">Vedi sulla mappa</button></div></div>';
  }).join('');
  return '<h2>' + IC('ticket') + (g.stage === 'setup' ? ' I tuoi biglietti di partenza' : ' Biglietti pescati') + '</h2><p class="lead">Tienine <b>almeno ' + min + '</b> (tocca per scegliere). A fine partita: <b>+punti</b> se colleghi le due città, <b>−punti</b> se non ci riesci. Quelli che lasci tornano in fondo al mazzo.</p>' +
    '<div class="ktl">' + list + '</div><button class="btn block" data-act="keepok"' + (s.sel.length >= min ? '' : ' disabled') + '>Tieni ' + s.sel.length + ' bigliett' + (s.sel.length === 1 ? 'o' : 'i') + '</button>' +
    '<button class="btn ghost small" data-act="help" data-r="tickets">Come funzionano i biglietti?</button>';
}
function myTicketsBody(g, me) {
  var P = g.players[me];
  var list = P.tickets.map(function (id) {
    var t = D.tickets[id], ok = E.connected(g, me, t.a, t.b), sp = ok ? null : BOT.shortest(g, me, t.a, t.b);
    return '<button class="mt" data-act="tkfocus" data-id="' + id + '">' + ART.ticket(t, { state: ok ? 'ok' : g.phase === 'over' ? 'ko' : null }) + '<small>' + (ok ? '<span class="good">' + IC('check') + ' Arrivato: +' + t.v + '</span>' : sp ? 'Mancano almeno ' + Math.round(sp.cost - 0) + ' vagoni · tocca per vedere il percorso' : '<span class="bad">Non più collegabile: −' + t.v + '</span>') + '</small></button>';
  }).join('');
  return '<h2>' + IC('ticket') + ' I tuoi biglietti</h2><p class="lead">Sono segreti: li vedi solo tu. Tocca un biglietto per vedere sulla mappa le due città e il percorso.</p><div class="mtl">' + (list || '<p class="muted">Nessun biglietto.</p>') + '</div>' + closeBtn();
}

/* ---------- presentazione ---------- */
function introBody(s) {
  var pages = [
    ['Benvenuto a Binari d’Italia', '<div class="intro-art">' + ART.card('R') + ART.card('L') + ART.card('G') + '</div>' + RU.S.goal[1]],
    ['Ogni turno: una sola azione', '<div class="intro3"><div>' + ART.cardBack() + '<b>Pesca 2 carte</b><small>dalle 5 scoperte o dal mazzo</small></div><div><svg viewBox="0 0 90 40" class="intro-r"><rect x="4" y="14" width="24" height="10" rx="2" fill="#c9352b" stroke="#7e1d17"/><rect x="33" y="14" width="24" height="10" rx="2" fill="#c9352b" stroke="#7e1d17"/><rect x="62" y="14" width="24" height="10" rx="2" fill="#c9352b" stroke="#7e1d17"/></svg><b>Conquista una tratta</b><small>con carte dello stesso colore</small></div><div>' + ART.ticketBack() + '<b>Pesca biglietti</b><small>3, tienine almeno 1</small></div></div>' +
      '<p>Quando un giocatore resta con <b>2 vagoni o meno</b> parte l’ultimo giro.</p>'],
    ['Come si usa lo schermo', '<ul class="intro-list"><li><b>In alto</b> i giocatori: punti ' + IC('star') + ', vagoni ' + IC('train') + ', carte ' + IC('card') + ', biglietti ' + IC('ticket') + '.</li><li><b>La mappa</b> si trascina e si ingrandisce con due dita. <b>Tocca una tratta</b> per vedere cosa serve e conquistarla; tocca una città per le sue tratte.</li>' +
      '<li><b>Le carte scoperte</b> e i mazzi stanno sotto la mappa: toccale per pescare.</li><li><b>La riga dorata</b> ti dice sempre cosa puoi fare; il ' + IC('help') + ' spiega la regola di quel momento.</li><li><b>In fondo</b> la tua mano: tocca un colore per vedere dove puoi usarlo. Le città dei tuoi biglietti sono cerchiate in rosso, e diventano verdi quando le colleghi.</li></ul>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Iniziamo!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- fine partita ---------- */
function overBody(g, me) {
  var F = g.final, W = F.order[0];
  var rows = F.order.map(function (p, i) {
    var x = F.rows[p], P = g.players[p];
    var tk = x.tickets.map(function (t) { var T = D.tickets[t.id]; return '<span class="ftk ' + (t.ok ? 'ok' : 'ko') + '">' + esc(cn(T.a)) + '–' + esc(cn(T.b)) + ' <b>' + (t.ok ? '+' : '−') + T.v + '</b></span>'; }).join('');
    return '<div class="fr' + (i === 0 ? ' win' : '') + '" style="--pc:' + D.PCOL[P.col].c + ';animation-delay:' + (i * 0.25) + 's"><div class="fr-h"><span class="rk">' + (i + 1) + '</span>' + ART.pieceIcon(P.col, 30) + '<b>' + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="tot">' + x.total + '</span></div>' +
      '<div class="fr-d"><span>' + IC('route') + 'Tratte <b>' + x.routePts + '</b></span><span>' + IC('ticket') + 'Biglietti <b>' + (x.tpts >= 0 ? '+' : '') + x.tpts + '</b> (' + x.done + '/' + x.tickets.length + ')</span><span>' + IC('longest') + 'Linea ' + x.longest + (x.bonus ? ' <b class="gold">+10</b>' : '') + '</span></div>' +
      '<div class="fr-t">' + tk + '</div><button class="btn ghost small" data-act="focusplayer" data-p="' + p + '">Vedi sulla mappa</button></div>';
  }).join('');
  return '<div class="over"><div class="crown">' + ART.pieceIcon(g.players[W].col, 90) + '</div><h2>' + (W === me ? 'Hai vinto!' : 'Vince ' + esc(g.players[W].nick)) + '</h2>' +
    '<p class="lead">' + F.rows[W].total + ' punti. La linea continua più lunga misura ' + F.maxL + ' vagoni: +10 a ' + F.order.filter(function (p) { return F.rows[p].bonus; }).map(function (p) { return esc(g.players[p].nick); }).join(' e ') + '.</p>' +
    '<div class="frs">' + rows + '</div>' +
    (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda la mappa') + '</div>';
}

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet;
  switch (a) {
    case 'sheetback': if (ev.target === el && s && s.kind !== 'intro' && Date.now() - (App.sheetAt || 0) > 450) { if (s.kind === 'keep') { App.keepSel = s.sel; } App.sheet = null; App.sel = null; if (s.kind === 'city') App.focus = null; renderSheet(); if (g) Game.render(); } return;
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r'), back: s }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); break;
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); break;
    case 'intronext': s.page++; renderSheet(); break;
    case 'introprev': s.page--; renderSheet(); break;
    case 'introdone': lsSet('bi-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; App.focus = null; renderSheet(); Game.render(); break;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else { if (s && s.kind === 'keep') App.keepSel = s.sel; App.sheet = null; App.sel = null; if (s && s.kind === 'city') App.focus = null; } renderSheet(); if (g) Game.render(); break;
    case 'leave': App.sheet = null; leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; App.focus = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; renderSheet(); Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i giocatori automatici.'); break;
    case 'auto': App.sheet = null; renderSheet(); send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'resume': send({ t: 'back' }); break;
    case 'player': App.sheet = { kind: 'player', p: +el.getAttribute('data-p') }; renderSheet(); break;
    case 'focusplayer': { var fp = +el.getAttribute('data-p'); App.focus = { k: 'player', p: fp }; App.sheet = null; renderSheet(); Game.render(); var ids = E.myRoutes(g, fp).map(function (r) { return r.id; }); if (ids.length) Board.centerOnRoutes(ids); break; }
    case 'unfocus': App.focus = null; App.sel = null; Game.render(); break;
    case 'zin': Board.zoomAt(1.35); break;
    case 'zout': Board.zoomAt(1 / 1.35); break;
    case 'zfit': Board.fit(); break;
    // pescare
    case 'drawface': case 'drawdeck': {
      if (!g || me < 0) return;
      if (g.phase !== 'play' || g.turn !== me || (g.stage !== 'act' && g.stage !== 'draw2')) { toast(g.stage === 'setup' ? 'Prima scegli i biglietti di partenza.' : g.turn === me && g.stage === 'tickets' ? 'Prima scegli quali biglietti tenere.' : 'Potrai pescare quando sarà il tuo turno.'); return; }
      if (a === 'drawface') { var i = +el.getAttribute('data-i'); if (g.stage === 'draw2' && g.face[i] === 'L') { toast('Come seconda carta non puoi prendere una locomotiva scoperta: scegline un’altra o pesca dal mazzo.'); return; } act({ a: 'draw', i: i }); }
      else { if (!g.deck.length && !g.disc.length) { toast('Il mazzo è vuoto: prendi una carta scoperta.'); return; } act({ a: 'draw', i: 'deck' }); }
      break;
    }
    case 'drawtickets': {
      if (!g || me < 0) return;
      if (g.phase !== 'play' || g.turn !== me || g.stage !== 'act') { toast(g.turn === me && g.stage === 'draw2' ? 'Prima prendi la seconda carta.' : 'Potrai pescare biglietti quando sarà il tuo turno.'); return; }
      if (!g.tdeck.length) { toast('Il mazzo dei biglietti è finito.'); return; }
      App.sheet = { kind: 'tkconfirm' }; renderSheet(); break;
    }
    case 'tkyes': App.sheet = null; renderSheet(); act({ a: 'tickets' }); break;
    case 'openkeep': { var P = g.players[me]; App.sheet = { kind: 'keep', sel: App.keepSel || P.offer.slice() }; App.focus = null; renderSheet(); Game.render(); break; }
    case 'keeptoggle': { var id = +el.getAttribute('data-id'), k = s.sel.indexOf(id); if (k >= 0) s.sel.splice(k, 1); else s.sel.push(id); renderSheet(); break; }
    case 'keepmap': { var id2 = +el.getAttribute('data-id'); App.keepSel = s.sel; App.sheet = null; renderSheet(); App.focus = { k: 'ticket', id: id2 }; Game.render(); Board.centerOnRoutes([D.tickets[id2].a, D.tickets[id2].b]); break; }
    case 'keepok': { var sel = s.sel.slice(); App.keepSel = null; App.sheet = null; renderSheet(); act({ a: 'keep', ids: sel }); break; }
    case 'mytickets': App.sheet = { kind: 'mytickets' }; renderSheet(); break;
    case 'tkfocus': { var id3 = +el.getAttribute('data-id'); App.sheet = null; renderSheet(); App.focus = { k: 'ticket', id: id3 }; Game.render(); Board.centerOnRoutes([D.tickets[id3].a, D.tickets[id3].b]); break; }
    case 'focuscolor': { var c = el.getAttribute('data-c'); App.focus = App.focus && App.focus.k === 'color' && App.focus.c === c ? null : { k: 'color', c: c }; Game.render(); break; }
    // tratte
    case 'route': { var rid = +el.getAttribute('data-r'); App.sel = rid; App.sheet = { kind: 'route', r: rid, seq: g.seq }; renderSheet(); Game.render(); Board.centerOnRoutes([rid], true, { maxK: 1.4, up: .45 }); break; }
    case 'claimc': s.c = el.getAttribute('data-c'); s.L = null; renderSheet(); break;
    case 'claimL': s.L += +el.getAttribute('data-d'); renderSheet(); break;
    case 'claimok': { var r = s.r, cc = s.c, L = s.L; App.sheet = null; App.sel = null; renderSheet(); act({ a: 'claim', r: r, c: cc, L: cc === 'L' ? D.byId[r].len : L }); break; }
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (ev.target.id === 'opt-can') { App.showCan = ev.target.checked; lsSet('bi-can', App.showCan ? '1' : '0'); if (G()) Game.render(); }
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; App.sel = null; renderSheet(); if (G()) Game.render(); }
});

/* ---------- avvio ---------- */
(function boot() {
  App.showCan = lsGet('bi-can') !== '0';
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || myNick()) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
