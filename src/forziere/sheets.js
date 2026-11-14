/* ===== Il Forziere Maledetto: finestre (carte, risposte, navi, ruoli, fine partita, regole, menu) ed eventi ===== */
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
function cardInfo(id) { var t = E.ty(id), D = E.T[t]; return '<div class="cinfo"><span class="cbig">' + ART.card(id) + '</span><div><div class="kicker">' + ART.KN[D.k] + ' · simbolo ' + ART.sym(E.CARDS[id].s) + ' ' + E.SYM[E.CARDS[id].s] + '</div><h2>' + esc(D.n) + '</h2><p class="lead">' + esc(D.d) + '</p></div></div>'; }
function tgtBtn(g, me, q, id, as) {
  var Q = g.players[q], r = roleOf(g, q), self = q === me;
  return '<button class="tgtb" data-act="target" data-p="' + q + '"' + (as ? ' data-as="' + as + '"' : '') + ' style="--pc:' + pcol(g, q) + '"><span class="pv">' + esc(Q.nick.charAt(0).toUpperCase()) + '</span><span class="tb-t"><b>' + (self ? 'Tu' : esc(Q.nick)) + '</b>' +
    '<small>' + (Q.ship != null ? esc(E.SHIPS[Q.ship].n) + ' · ' : '') + (self ? '' : 'distanza ' + E.distance(g, me, q) + ' · ') + Q.hand.length + ' carte</small></span>' + (Q.ship != null ? ART.barrels(Q.bar, E.maxBar(g, q)) : '') + ART.roleBadge(r) + '</button>';
}
function sheetBody(s) {
  var g = G(), me = myIdx();
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button>' +
      (g ? '<button class="btn ghost block" data-act="port">Le navi in porto</button><button class="btn ghost block" data-act="log">Diario di bordo (tutte le mosse)</button>' : '') +
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
  var P = me >= 0 ? g.players[me] : null;
  if (s.kind === 'log') return '<h2>Diario di bordo</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? pcol(g, l.p) : 'rgba(242,193,78,.5)'; return '<div class="fl k-' + l.k + '" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'port') return '<h2>Navi in porto</h2><p class="lead">Chi resta senza nave, al suo turno, ne prende una di queste tre oppure la prima del mazzo delle navi (' + g.ships.length + ' rimaste, coperte).</p><div class="ships">' + g.row.map(function (sh) { return ART.shipCard(sh); }).join('') + '</div>' + closeBtn();
  if (s.kind === 'seecard') return cardInfo(s.id) + closeBtn();
  if (s.kind === 'player') {
    var Q = g.players[s.p]; if (!Q) return '';
    var r = roleOf(g, s.p), C = E.CAPS[Q.cap];
    return '<div class="phead" style="--pc:' + pcol(g, s.p) + '"><span class="pv big">' + esc(Q.nick.charAt(0).toUpperCase()) + '</span><div><div class="kicker">' + (s.p === me ? 'Tu' : 'Capitano') + '</div><h2>' + Net.dot(Q.uid) + esc(Q.nick) + '</h2>' + ART.roleBadge(r, { long: true }) + '</div></div>' +
      '<div class="pcap">' + ART.capFace(Q.cap, pcol(g, s.p)) + '<span><b>' + esc(C.n) + '</b><br><span class="muted">' + esc(C.d) + '</span></span></div>' +
      (Q.ship != null ? ART.shipCard(Q.ship) + '<p class="lead">Barili: ' + ART.barrels(Q.bar, E.maxBar(g, s.p)) + (me >= 0 && s.p !== me && P.ship != null ? ' · distanza da te: <b>' + E.distance(g, me, s.p) + '</b>' : '') + '</p>' : '<p class="lead">Al momento è senza nave: non può essere bersaglio.</p>') +
      (Q.eq.length ? '<h3>Equipaggiamenti</h3><div class="eqlist">' + Q.eq.map(function (id) { return '<div class="eqrow"><b>' + esc(E.T[E.ty(id)].n) + '</b> <span class="muted">' + esc(E.T[E.ty(id)].d) + '</span></div>'; }).join('') + '</div>' : '') +
      '<div class="tags"><span class="gc">' + IC('cards') + ' ' + Q.hand.length + ' carte in mano</span><span class="gc">' + IC('coin') + ' ' + Q.dbl + ' dobloni' + (Q.up ? '' : ' + 1 del ruolo coperto') + '</span></div>' +
      (App.doc.host === Net.uid && s.p !== me && g.phase !== 'over' ? '<button class="btn ghost block" data-act="auto" data-p="' + s.p + '">' + (Q.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
  }
  if (s.kind === 'myrole' && P) {
    var R = E.ROLES[P.role];
    var goal = R.solo ? (P.role === 'PI' ? 'Giochi da solo. Vinci subito con <b>4 dobloni</b> (il ruolo coperto ne vale 1); se la partita finisce con il Gorgo, vinci con il Forziere al centro, o a un passo da una bandiera se hai più dobloni del più povero di quella flotta.' : 'Giochi da solo, ma quando affondi il Forziere si muove come se fossi di ' + E.NAT[R.nat] + '. Vinci subito con <b>4 dobloni</b>, oppure con il Forziere al centro (se hai più dobloni dell’altro Corsaro) o a un passo dalla bandiera di ' + E.NAT[R.nat] + ' (se hai più dobloni del più povero di quella flotta).')
      : 'Giochi con la flotta di <b>' + E.NAT[R.nat] + '</b>: portate il Forziere fino alla vostra bandiera (' + (R.nat === 'L' ? 'a sinistra' : 'a destra') + ' sul tracciato) affondando le navi dell’altra flotta.' + (R.lead ? ' Sei l’Ammiraglio: se affondi, il Forziere fa un passo in più verso i nemici.' : '');
    return '<div class="cinfo"><span class="cbig">' + ART.roleCard(P.role) + '</span><div><div class="kicker">' + (P.up ? 'Il tuo ruolo è scoperto' : 'Il tuo ruolo segreto') + '</div><h2>' + esc(R.n) + '</h2><p class="lead">' + goal + '</p></div></div>' +
      (Object.keys(P.seen).length ? '<p class="lead">Hai letto le lettere di: ' + Object.keys(P.seen).map(function (q) { return esc(g.players[q].nick) + ' (' + esc(E.ROLES[g.players[q].role].n) + ')'; }).join(', ') + '.</p>' : '') + closeBtn();
  }
  if (s.kind === 'mycap' && P) { var C2 = E.CAPS[P.cap]; return '<div class="pcap big">' + ART.capFace(P.cap, pcol(g, me)) + '<span><div class="kicker">Il tuo capitano</div><h2>' + esc(C2.n) + '</h2><p class="lead">' + esc(C2.d) + '</p></span></div>' + closeBtn(); }
  if (s.kind === 'myship' && P && P.ship != null) return ART.shipCard(P.ship) + '<p class="lead">Barili: ' + ART.barrels(P.bar, E.maxBar(g, me)) + ' · gittata ' + E.range(g, me, null) + ' · munizioni ' + E.ammo(g, me) + ' per turno' + (E.cannons(g, me, null) ? ' · ' + E.cannons(g, me, null) + ' cannoni in più' : '') + '</p>' + closeBtn();
  if (s.kind === 'peek' && P) { var q = s.p, Q2 = g.players[q]; return '<div class="cinfo"><span class="cbig">' + ART.roleCard(Q2.role) + '</span><div><div class="kicker">Lettera intercettata</div><h2>' + esc(Q2.nick) + ' è ' + esc(E.ROLES[Q2.role].n) + '</h2><p class="lead">Lo sai solo tu: usa bene l’informazione!</p></div></div>' + closeBtn('Ho capito'); }
  if (s.kind === 'card' && P && App.card != null) return cardBody(g, me, App.card);
  if (s.kind === 'pick' && P) {
    var T2 = g.players[s.t];
    return '<h2>' + esc(E.T[E.ty(s.id)].n) + ' contro ' + esc(T2.nick) + '</h2><p class="lead">Cosa vuoi ' + (E.ty(s.id) === 'saccheggio' ? 'prendere' : 'fargli scartare') + '?</p><div class="pickl">' +
      (E.ty(s.id) !== 'incatenate' && T2.hand.length ? '<button class="btn block" data-act="pick" data-v="hand">Una carta a caso dalla mano (' + T2.hand.length + ')</button>' : '') +
      T2.eq.map(function (id) { return '<button class="btn ghost block" data-act="pick" data-v="' + id + '">' + esc(E.T[E.ty(id)].n) + ' <small class="muted">· ' + esc(E.T[E.ty(id)].d) + '</small></button>'; }).join('') + '</div>' + closeBtn('Annulla');
  }
  if (s.kind === 'resp' && P && g.pend && g.pend.who === me) {
    var ans = E.answers(g, me), pd = g.pend;
    return '<div class="kicker">Fuori dal tuo turno</div><h2>' + (pd.k === 'shot' ? 'Ti arriva un colpo!' : pd.k === 'duel' ? 'Sfida a sciabole' : pd.k === 'need' ? 'Il Mostro degli abissi' : esc(pd.label)) + '</h2><p class="lead">' + Game.pendText(g, me) + '</p>' +
      (P.ship != null ? '<p class="lead">La tua nave: ' + ART.barrels(P.bar, E.maxBar(g, me)) + '</p>' : '') +
      '<div class="resp">' + ans.map(function (id) { return '<button class="hc can" data-act="resp" data-id="' + id + '">' + ART.card(id) + '<small>' + esc(E.T[E.ty(id)].n) + '</small></button>'; }).join('') + '</div>' +
      '<button class="btn block red" data-act="take">' + (pd.k === 'card' ? 'Lascia fare' : 'Subisci (−' + (pd.k === 'shot' ? pd.dmg : 1) + ((pd.k === 'shot' ? pd.dmg : 1) > 1 ? ' barili)' : ' barile)')) + '</button>';
  }
  if (s.kind === 'ships' && P && g.turn === me && g.step === 'ship') {
    return '<div class="kicker">Nuova nave</div><h2>Scegli la tua nave</h2><p class="lead">Prendi una delle navi in porto, oppure la prima del mazzo delle navi senza guardarla.</p><div class="ships pick">' +
      g.row.map(function (sh, i) { return '<button class="shipb" data-act="ship" data-i="' + i + '">' + ART.shipCard(sh) + '</button>'; }).join('') + '</div>' +
      (g.ships.length ? '<button class="btn ghost block" data-act="ship" data-i="deck">Prendi la prima del mazzo (' + g.ships.length + ')</button>' : '');
  }
  if (s.kind === 'spectre' && P && g.turn === me && g.step === 'spectre') {
    var sy = E.CARDS[g.spectreRev].s, m = E.matching(g, me, sy);
    return '<div class="kicker">' + IC('ghost') + ' Vascello spettrale</div><h2>Esce: ' + esc(E.T[E.ty(g.spectreRev)].n) + '</h2><div class="cinfo"><span class="cbig">' + ART.card(g.spectreRev) + '</span><p class="lead">Il simbolo è ' + ART.sym(sy) + ' <b>' + E.SYM[sy] + '</b>. Mostra una carta della mano con lo stesso simbolo (resta in mano): il vascello passa alla nave successiva. Se non rispondi perdi <b>2 barili</b> e il vascello sparisce.</p></div>' +
      '<div class="resp">' + m.map(function (id) { return '<button class="hc can" data-act="answer" data-id="' + id + '">' + ART.card(id) + '<small>' + esc(E.T[E.ty(id)].n) + '</small></button>'; }).join('') + '</div>' +
      '<button class="btn block red" data-act="noanswer">Non rispondo (−2 barili)</button>';
  }
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}
function cardBody(g, me, id) {
  var t = E.ty(id), P = g.players[me], myTurn = g.phase === 'play' && g.turn === me && !g.pend && g.step === 'play', h = cardInfo(id), opts = [];
  if (!myTurn) return h + '<p class="notice">' + (E.kind(id) === 'def' ? 'Le carte Difesa si giocano fuori dal tuo turno, quando ti arriva qualcosa: te le proporrò io al momento giusto.' : 'Potrai giocarla nel tuo turno.') + '</p>' + closeBtn();
  function block(as, title) {
    var tg = E.targets(g, me, id, as);
    if (tg == null) {
      var why = E.isAtk(g, me, id, as) && g.shots >= E.ammo(g, me) ? 'Hai finito le munizioni per questo turno.' : t === 'rum' ? 'Hai già tutti i barili.' : E.kind(id) === 'eq' ? 'Hai già questo Equipaggiamento in gioco.' : E.kind(id) === 'def' ? 'Si gioca solo fuori dal tuo turno, quando ti attaccano.' : 'Adesso non si può giocare.';
      return '<p class="notice">' + (title ? '<b>' + title + '</b>: ' : '') + why + '</p>';
    }
    var need = E.isAtk(g, me, id, as) || (E.needsTarget(t) && E.kind(id) !== 'eq' && !(t === 'spettro' && g.gorgo));
    if (!need) return '<button class="btn block" data-act="cplay"' + (as ? ' data-as="' + as + '"' : '') + '>' + (title || (E.kind(id) === 'eq' ? 'Monta sulla nave' : 'Gioca')) + '</button>';
    if (!tg.length) return '<p class="notice">' + (title ? '<b>' + title + '</b>: ' : '') + (E.isAtk(g, me, id, as) ? 'Nessuna nave è a portata di tiro (gittata ' + E.range(g, me, null) + (t === 'arrembaggio' || t === 'moschetto' ? ', ma questa carta arriva solo a distanza 1' : '') + ').' : 'Non c’è nessun bersaglio valido.') + '</p>';
    return '<h3>' + (title || (E.isAtk(g, me, id, as) ? 'Chi vuoi colpire?' : 'Su chi la giochi?')) + '</h3><div class="tgts">' + tg.map(function (q) { return tgtBtn(g, me, q, id, as); }).join('') + '</div>';
  }
  if (E.kind(id) === 'multi') opts.push(block(null, 'Come Attacco'));
  else if (t === 'virata' && E.isCap(g, me, 'lia')) opts.push(block('atk', 'Come Bordata (abilità di Lia)'));
  else opts.push(block(null));
  return h + opts.join('') + closeBtn('Annulla');
}
function overBody(g, me) {
  var f = g.final, W = g.winners || [], iw = W.indexOf(me) >= 0;
  var why = f.how === 'rich' ? 'ha raccolto 4 dobloni.' : f.how === 'flagL' || f.how === 'flagP' ? 'Il Forziere ha raggiunto la bandiera dopo un affondamento.' : 'Il Gorgo ha fatto finire la partita: il Forziere è a ' + Math.abs(f.chest) + (Math.abs(f.chest) === 1 ? ' passo' : ' passi') + (f.chest ? ' verso ' + (f.chest < 0 ? 'Levante' : 'Ponente') : ' dal centro, cioè al centro') + '.';
  var title = iw ? 'Hai vinto!' : f.solo != null ? 'Vince ' + esc(g.players[f.solo].nick) : 'Vince ' + E.NAT[f.team];
  var rows = g.players.map(function (P, i) { var R = E.ROLES[P.role]; return '<div class="orow' + (W.indexOf(i) >= 0 ? ' win' : '') + '" style="--pc:' + pcol(g, i) + '"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + esc(P.nick) + (i === me ? ' (tu)' : '') + '</b>' + ART.roleBadge(P.role) + '<span class="coins">' + IC('coin') + P.dbl + '</span>' + (W.indexOf(i) >= 0 ? '<span class="tag ok">vince</span>' : '') + '</div>'; }).join('');
  return '<div class="over"><div class="ochest">' + IC('chest') + '</div><h2>' + title + '</h2><p class="lead">' + (f.solo != null ? esc(g.players[f.solo].nick) + ' era ' + esc(E.ROLES[g.players[f.solo].role].n) + (f.how === 'rich' ? ' e ' + why : '. ' + why) : 'La flotta di ' + E.NAT[f.team] + ' porta a casa il Forziere. ' + why) + '</p>' +
    ART.track(g) + '<div class="olist">' + rows + '</div>' + Score.endHTML(App.doc) +
    (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var g = G(), me = myIdx(), P = g && me >= 0 ? g.players[me] : null;
  var pages = [
    ['Benvenuto a bordo', (P ? '<div class="cinfo"><span class="cbig">' + ART.roleCard(P.role) + '</span><p class="lead">In questa partita sei <b>' + esc(E.ROLES[P.role].n) + '</b>. È un segreto: lo vedi solo tu (tocca la tua plancia per rileggerlo).</p></div>' : '') + RU.S.goal[1]],
    ['Il turno', RU.S.turn[1]],
    ['Navi, colpi e affondamenti', '<p>Con una <b>Bordata</b> colpisci una nave entro la tua <b>gittata</b>: perde un barile. Chi viene colpito può evitarlo con una <b>Virata</b>. Quando una nave finisce i barili <b>affonda</b>: si scopre il ruolo del capitano, il Forziere si sposta e chi l’ha affondata prende un <b>doblone</b>.</p><p>Chi affonda non è eliminato: al turno dopo prende una nave nuova e torna in mare.</p>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si salpa!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- eventi ---------- */
function handClick(id) {
  var g = G(), me = myIdx(); if (!g || me < 0) return;
  if (App.mode === 'drop') { var k = App.drop.indexOf(id); if (k >= 0) App.drop.splice(k, 1); else if (App.drop.length < g.players[me].hand.length - 5) App.drop.push(id); Sound.play('pick'); Game.render(); return; }
  App.card = id; App.sheet = { kind: 'card' }; Sound.play('pick'); Game.render(); renderSheet();
}
function playOn(q, as) {
  var g = G(), me = myIdx(), id = App.card; if (!g || id == null) return;
  var t = E.ty(id), Q = g.players[q];
  if ((t === 'saccheggio' || t === 'sabotaggio') && Q.eq.length) { App.sheet = { kind: 'pick', id: id, t: q, as: as }; renderSheet(); return; }
  if (t === 'incatenate' && Q.eq.length > 1) { App.sheet = { kind: 'pick', id: id, t: q, as: as }; renderSheet(); return; }
  var a = { a: 'play', id: id, t: q }; if (as) a.as = as;
  if (t === 'incatenate' && Q.eq.length === 1) a.pick = Q.eq[0];
  if (t === 'saccheggio' || t === 'sabotaggio') a.pick = 'hand';
  App.sheet = null; App.card = null; renderSheet(); act(a);
}
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet;
  switch (a) {
    case 'sheetback': if (ev.target === el && s && ['intro', 'resp', 'ships', 'spectre'].indexOf(s.kind) < 0 && Date.now() - (App.sheetAt || 0) > 450) { App.sheet = null; if (s.kind === 'card') App.card = null; renderSheet(); if (G()) Game.render(); } return;
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r'), back: s && s.kind !== 'help' ? s : null }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); break;
    case 'port': App.sheet = { kind: 'port' }; renderSheet(); break;
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); break;
    case 'intronext': s.page++; renderSheet(); break;
    case 'introprev': s.page--; renderSheet(); break;
    case 'introdone': lsSet('fz-intro-done', '1'); App.sheet = null; renderSheet(); if (App.doc) onDoc(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else { App.sheet = null; if (s && (s.kind === 'card' || s.kind === 'pick')) App.card = null; } renderSheet(); if (G()) Game.render(); break;
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
    case 'opp': App.sheet = { kind: 'player', p: +el.getAttribute('data-p') }; renderSheet(); break;
    case 'myrole': App.sheet = { kind: 'myrole' }; renderSheet(); break;
    case 'mycap': App.sheet = { kind: 'mycap' }; renderSheet(); break;
    case 'myship': App.sheet = { kind: 'myship' }; renderSheet(); break;
    case 'seecard': App.sheet = { kind: 'seecard', id: +el.getAttribute('data-id') }; renderSheet(); break;
    // il turno
    case 'hand': handClick(+el.getAttribute('data-id')); break;
    case 'cplay': { var id = App.card, as = el.getAttribute('data-as'); if (id == null) return; var op = { a: 'play', id: id }; if (as) op.as = as; App.sheet = null; App.card = null; renderSheet(); act(op); break; }
    case 'target': playOn(+el.getAttribute('data-p'), el.getAttribute('data-as')); break;
    case 'pick': { var pk = el.getAttribute('data-v'), op2 = { a: 'play', id: s.id, t: s.t, pick: pk === 'hand' ? 'hand' : +pk }; if (s.as) op2.as = s.as; App.sheet = null; App.card = null; renderSheet(); act(op2); break; }
    case 'end': {
      if (!g || g.turn !== me) return;
      if (g.players[me].hand.length > 5) { App.mode = 'drop'; App.drop = []; Game.render(); toast('Tocca le carte da scartare: alla fine del turno se ne tengono 5.'); return; }
      act({ a: 'end' }); break;
    }
    case 'dodrop': { var dr = App.drop.slice(); App.mode = null; App.drop = []; act({ a: 'end', drop: dr }); break; }
    case 'cancel': App.mode = null; App.drop = []; App.card = null; Game.render(); break;
    case 'openresp': App.sheet = { kind: 'resp' }; renderSheet(); break;
    case 'openships': App.sheet = { kind: 'ships' }; renderSheet(); break;
    case 'openspectre': App.sheet = { kind: 'spectre' }; renderSheet(); break;
    case 'resp': App.sheet = null; renderSheet(); act({ a: 'resp', id: +el.getAttribute('data-id') }); break;
    case 'take': App.sheet = null; renderSheet(); act({ a: 'take' }); break;
    case 'ship': { var i = el.getAttribute('data-i'); App.sheet = null; renderSheet(); act({ a: 'ship', i: i === 'deck' ? 'deck' : +i }); break; }
    case 'answer': App.sheet = null; renderSheet(); act({ a: 'answer', id: +el.getAttribute('data-id') }); break;
    case 'noanswer': App.sheet = null; renderSheet(); act({ a: 'answer' }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape') { if (App.sheet && ['intro', 'resp', 'ships', 'spectre'].indexOf(App.sheet.kind) < 0) { App.sheet = null; App.card = null; renderSheet(); if (G()) Game.render(); } else if (App.mode) { App.mode = null; App.drop = []; Game.render(); } }
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
