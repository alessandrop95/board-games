/* ===== Citadels: finestre (scelta del personaggio, bersagli, carte, città, classifica, presentazione) ed eventi ===== */
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
  if (s.fresh && s.kind === 'over') setTimeout(countUp, 30);
  s.fresh = false;
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function pv(g, p, big) { return '<span class="pv' + (big ? ' big' : '') + '" style="--pc:' + pcol(g, p) + '">' + esc(g.players[p].nick.charAt(0).toUpperCase()) + '</span>'; }
function myTurnNow(g, me) { return g && g.phase === 'turns' && g.turn && g.turn.p === me; }
function sheetBody(s) {
  var g = G(), me = myIdx();
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + (s.r === 'turn' ? RU.section('chars') : '') + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button>' +
      (g ? '<button class="btn ghost block" data-act="log">Tutte le mosse</button>' : '') +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (!g) return '';
  switch (s.kind) {
    case 'log': return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? pcol(g, l.p) : 'rgba(255,220,150,.5)'; return '<div class="fl k-' + l.k + '" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
    case 'player': return playerBody(g, me, s);
    case 'pick': return pickBody(g, me);
    case 'keep': return keepBody(g, me);
    case 'kill': case 'rob': return targetBody(g, me, s);
    case 'magic': return magicBody(g, me, s);
    case 'destroy': return destroyBody(g, me, s);
    case 'lab': return labBody(g, me);
    case 'den': return denBody(g, me, s);
    case 'card': return cardBody(g, me, s);
    case 'char': return charBody(g, me, s);
    case 'endconfirm': return endConfirmBody(g, me);
    case 'over': return g.phase === 'over' ? overBody(g, me, s) : '';
  }
  return '';
}

/* ---------- scelta del personaggio ---------- */
function pickHint(g, me, r) {
  var P = g.players[me], t = E.CH[r].t, inc = t ? P.city.filter(function (id) { var d = E.D(id); return d.t === t || d.u === 'school'; }).length : 0;
  var others = g.players.filter(function (Q, i) { return i !== me; });
  switch (r) {
    case 1: return 'Giochi per primo e togli il turno a un personaggio.';
    case 2: return 'Rubi l’oro a un personaggio. Oggi il più ricco ha <b>' + Math.max.apply(null, others.map(function (Q) { return Q.gold; })) + ' oro</b>.';
    case 3: return 'Hai <b>' + P.hand.length + '</b> carte; la mano più grande degli altri ne ha <b>' + Math.max.apply(null, others.map(function (Q) { return Q.hand.length; })) + '</b>.';
    case 4: return '<b>+' + inc + ' oro</b> dai tuoi quartieri nobili · prendi la corona.';
    case 5: return '<b>+' + inc + ' oro</b> dai tuoi quartieri religiosi · il Condottiero non può toccarti.';
    case 6: return '<b>+' + (inc + 1) + ' oro</b> (1 in più + ' + inc + ' dai quartieri commerciali).';
    case 7: return '<b>+2 carte</b> e puoi costruire <b>fino a 3</b> quartieri.';
    case 8: return '<b>+' + inc + ' oro</b> dai tuoi quartieri militari · puoi distruggere un quartiere.';
  }
  return '';
}
function pickBody(g, me) {
  if (g.phase !== 'pick' || E.decider(g) !== me) return '';
  var pk = g.pick, ch = E.choices(g), last7 = g.players.length === 7 && pk.i === 6, gone = 8 - ch.length - pk.up.length - (last7 ? 0 : 1);
  return '<div class="kicker">Round ' + g.round + ' · scelta dei personaggi</div><h2>Chi sarai in questo round?</h2>' +
    '<p class="lead">Scegline uno: resterà <b>segreto</b> finché non viene chiamato. I personaggi si chiamano in ordine di numero: l’1 gioca per primo, l’8 per ultimo.</p>' +
    '<div class="pk-info">' + (pk.up.length ? '<span>Scartati scoperti: ' + pk.up.map(function (r) { return '<b>' + E.CH[r].n + '</b>'; }).join(', ') + '</span>' : '') + '<span>Uno scartato coperto' + (last7 ? ' (sei l’ultimo con 7 giocatori: puoi prendere anche quello)' : '') + '</span>' + (gone > 0 ? '<span>Già presi dagli altri: <b>' + gone + '</b></span>' : '') + '</div>' +
    '<div class="pk-list">' + ch.map(function (r) {
      return '<button class="pk" data-act="pick" data-r="' + r + '"><span class="pk-c">' + ART.card({ r: r }) + '</span><span class="pk-t"><b>' + r + ' · ' + E.CH[r].n + '</b><span class="pk-p">' + E.CH[r].p + '</span><span class="pk-h">' + pickHint(g, me, r) + '</span></span></button>';
    }).join('') + '</div>';
}
function keepBody(g, me) {
  var T = g.turn; if (!myTurnNow(g, me) || !T.drawn) return '';
  var P = g.players[me];
  return '<div class="kicker">Hai pescato 2 carte</div><h2>Quale tieni?</h2><p class="lead">Tieni quella che ti serve di più; l’altra torna in fondo al mazzo.</p><div class="kp">' +
    T.drawn.map(function (id) { var d = E.D(id), dup = P.city.some(function (x) { return E.D(x).n === d.n; }) && !E.has(P, 'quarry'); return '<button class="kp-c" data-act="keep" data-id="' + id + '">' + ART.card({ d: id }) + '<span class="kp-l">' + esc(d.n) + ' · ' + E.TYPES[d.t] + ' · costa ' + E.costOf(P, id) + (dup ? '<br><b class="bad">ce l’hai già in città</b>' : '') + '</span><span class="btn small">Tieni questa</span></button>'; }).join('') + '</div>';
}
/* ---------- Assassino e Ladro ---------- */
function targetBody(g, me, s) {
  if (!myTurnNow(g, me)) return '';
  var kill = s.kind === 'kill', up = g.pick ? g.pick.up : [], rs = kill ? [2, 3, 4, 5, 6, 7, 8] : [3, 4, 5, 6, 7, 8];
  return '<div class="kicker">' + (kill ? 'Potere dell’Assassino' : 'Potere del Ladro') + '</div><h2>' + (kill ? 'Chi vuoi uccidere?' : 'Chi vuoi derubare?') + '</h2>' +
    '<p class="lead">' + (kill ? 'Scegli un <b>personaggio</b>, non un giocatore: chi lo ha preso salterà il turno quando verrà chiamato. Se nessuno lo ha, il colpo va a vuoto.' : 'Scegli un <b>personaggio</b>: quando verrà chiamato e si rivelerà, gli prenderai tutto l’oro che ha in quel momento.') + '</p><div class="tg">' +
    rs.map(function (r) {
      var why = up.indexOf(r) >= 0 ? 'scartato scoperto: nessuno ce l’ha' : !kill && r === g.killed ? 'è stato ucciso' : '';
      return '<button class="tg-c' + (why ? ' off' : '') + '" data-act="' + (kill ? 'kill' : 'rob') + '" data-r="' + r + '"' + (why ? ' disabled' : '') + '>' + ART.card({ r: r }) + '<span>' + (why ? '<small>' + why + '</small>' : '<b>' + E.CH[r].n + '</b>') + '</span></button>';
    }).join('') + '</div>' + closeBtn('Più tardi');
}
/* ---------- Mago ---------- */
function magicBody(g, me, s) {
  if (!myTurnNow(g, me)) return '';
  var P = g.players[me], sel = s.sel || [];
  return '<div class="kicker">Potere del Mago</div><h2>Scegli la magia</h2>' +
    '<h3>Scambia tutta la tua mano (' + P.hand.length + ' carte) con…</h3><div class="sw">' +
    g.players.map(function (Q, i) { if (i === me) return ''; return '<button class="sw-p" data-act="swap" data-t="' + i + '" style="--pc:' + pcol(g, i) + '">' + pv(g, i) + '<b>' + esc(Q.nick) + '</b><span>' + Q.hand.length + ' carte</span></button>'; }).join('') + '</div>' +
    '<h3>…oppure scarta delle carte e pescane altrettante</h3><p class="lead">Tocca le carte da scartare.</p><div class="selhand">' +
    P.hand.map(function (id) { return '<button class="sh' + (sel.indexOf(id) >= 0 ? ' on' : '') + '" data-act="rdsel" data-id="' + id + '">' + ART.card({ d: id }) + '<i>' + IC('x') + '</i></button>'; }).join('') + '</div>' +
    '<button class="btn block" data-act="redraw"' + (sel.length ? '' : ' disabled') + '>Scarta ' + sel.length + ' e pesca ' + sel.length + '</button>' + closeBtn('Più tardi');
}
/* ---------- Condottiero ---------- */
function destroyBody(g, me, s) {
  if (!myTurnNow(g, me)) return '';
  var P = g.players[me], sel = s.sel;
  var rows = g.players.map(function (Q, t) {
    if (!Q.city.length) return '';
    var why = E.complete(Q) && t !== me ? 'città completa: intoccabile' : Q.char === 5 && g.killed !== 5 && t !== me && g.revealed[5] === t ? 'protetta dal Vescovo' : '';
    return '<div class="ds-p" style="--pc:' + pcol(g, t) + '"><div class="ds-h">' + pv(g, t) + '<b>' + esc(Q.nick) + (t === me ? ' (tu)' : '') + '</b>' + (why ? '<small>' + why + '</small>' : '') + '</div><div class="ds-c">' +
      Q.city.map(function (id) { var err = E.destroyable(g, me, t, id), c = Math.max(0, E.D(id).c - 1), on = sel && sel.t === t && sel.id === id; return '<button class="dc' + (err ? ' off' : '') + (on ? ' on' : '') + '" data-act="dsel" data-t="' + t + '" data-id="' + id + '"' + (err ? ' title="' + esc(err) + '"' : '') + '>' + ART.card({ d: id }, { mini: true }) + '<span>' + (err && /Vescovo|completa|Mastio/.test(err) ? '—' : c + ' oro') + '</span></button>'; }).join('') + '</div></div>';
  }).join('');
  var cf = sel ? E.destroyable(g, me, sel.t, sel.id) : null;
  return '<div class="kicker">Potere del Condottiero</div><h2>Distruggi un quartiere</h2><p class="lead">Paghi <b>1 oro in meno</b> del costo del quartiere (un quartiere da 1 è gratis). Hai <b>' + P.gold + ' oro</b>. Le città complete e quelle del Vescovo non si toccano; nemmeno il Mastio.</p>' + rows +
    (sel ? '<div class="ds-ok">' + (cf ? '<p class="bad">' + esc(cf) + '</p>' : '<button class="btn block red" data-act="destroy">' + IC('fire') + ' Distruggi ' + esc(E.D(sel.id).n) + ' di ' + esc(g.players[sel.t].nick) + ' (' + Math.max(0, E.D(sel.id).c - 1) + ' oro)</button>') + '</div>' : '') + closeBtn('Lascia stare');
}
function labBody(g, me) {
  if (!myTurnNow(g, me)) return '';
  var P = g.players[me];
  return '<div class="kicker">Laboratorio</div><h2>Scarta una carta e prendi 2 oro</h2><div class="selhand">' + P.hand.map(function (id) { return '<button class="sh" data-act="lab" data-id="' + id + '">' + ART.card({ d: id }) + '</button>'; }).join('') + '</div>' + closeBtn('Lascia stare');
}
function denBody(g, me, s) {
  if (!myTurnNow(g, me)) return '';
  var P = g.players[me], id = s.id, cost = E.costOf(P, id), sel = s.sel || [], need = Math.max(0, cost - sel.length);
  return '<div class="kicker">Covo dei Ladri</div><h2>Paga anche con le carte</h2><p class="lead">Costa <b>' + cost + '</b>: ogni carta della mano che scarti vale 1 oro. Hai <b>' + P.gold + ' oro</b>.</p><div class="selhand">' +
    P.hand.filter(function (x) { return x !== id; }).map(function (x) { return '<button class="sh' + (sel.indexOf(x) >= 0 ? ' on' : '') + '" data-act="densel" data-id="' + x + '">' + ART.card({ d: x }) + '<i>' + IC('x') + '</i></button>'; }).join('') + '</div>' +
    '<p class="lead">Paghi <b>' + sel.length + '</b> carte e <b>' + need + ' oro</b>.</p><button class="btn block" data-act="denbuild"' + (need <= P.gold ? '' : ' disabled') + '>Costruisci il Covo dei Ladri</button>' + closeBtn('Annulla');
}
/* ---------- una carta in grande ---------- */
function cardBody(g, me, s) {
  var id = s.id, d = E.D(id), p = s.p, P = g.players[p], inHand = P && P.hand.indexOf(id) >= 0 && p === me, inCity = P && P.city.indexOf(id) >= 0;
  var o = '<div class="cdet"><span class="cdet-c">' + ART.card({ d: id }) + '</span><div class="cdet-t"><div class="kicker">' + (inCity ? 'Nella città di ' + esc(P.nick) : 'Nella tua mano') + '</div><h2>' + esc(d.n) + '</h2>' +
    '<div class="tags"><span class="gc t-' + d.t + '">' + E.TYPES[d.t] + '</span><span class="gc">costa ' + (P ? E.costOf(P, id) : d.c) + ' oro</span><span class="gc">vale ' + d.c + (d.c === 1 ? ' punto' : ' punti') + '</span></div>' +
    (d.x ? '<p class="rbox">' + d.x + '</p>' : '') + typeNote(d.t) + '</div></div>';
  if (inHand) {
    var T = g.turn, err = myTurnNow(g, me) ? E.canBuild(g, me, id) : 'Potrai costruirlo durante il tuo turno, dopo aver preso le risorse.', cost = E.costOf(P, id);
    if (!err && cost > P.gold && !(d.u === 'den' && cost <= P.gold + P.hand.length - 1)) err = 'Ti servono ' + cost + ' oro: ne hai ' + P.gold + '.';
    o += err ? '<p class="notice">' + esc(err) + '</p>' : d.u === 'den' ? '<button class="btn block" data-act="denopen" data-id="' + id + '">' + IC('build') + ' Costruisci (anche con carte)</button>' : '<button class="btn block" data-act="build" data-id="' + id + '">' + IC('build') + ' Costruisci per ' + cost + ' oro</button>';
    if (T && T.p === me && T.gathered && !T.drawn && T.built < T.max) o += '<p class="lead" style="font-size:13.5px">Ti resteranno ' + Math.max(0, P.gold - cost) + ' oro.</p>';
  }
  return o + closeBtn();
}
function typeNote(t) { var who = { n: 'Re', r: 'Vescovo', c: 'Mercante', m: 'Condottiero' }[t]; return who ? '<p class="lead">I quartieri ' + E.PL[t] + ' fanno guadagnare 1 oro al <b>' + who + '</b>.</p>' : ''; }
/* ---------- un personaggio ---------- */
function charBody(g, me, s) {
  var r = s.r, st = Game.charState(g, r, me), P = me >= 0 ? g.players[me] : null;
  var txt = { up: 'Scartato scoperto in questo round: nessuno lo ha.', wait: g.phase === 'pick' ? 'Si sta scegliendo: non si sa chi lo prenderà.' : 'Non è ancora stato chiamato.', mine: 'È il tuo personaggio in questo round (lo sai solo tu).', now: 'È di turno adesso.', done: 'Ha già giocato in questo round.', dead: 'È stato assassinato: ha saltato il turno.', none: 'Quando è stato chiamato, nessuno ha risposto.' }[st.s];
  return '<div class="cdet"><span class="cdet-c">' + ART.card({ r: r }) + '</span><div class="cdet-t"><div class="kicker">Personaggio ' + r + ' di 8</div><h2>' + E.CH[r].n + '</h2><p>' + E.CH[r].p + '</p>' +
    '<p class="rbox">' + txt + (st.p != null ? ' È ' + pname(g, st.p) + '.' : '') + (g.killed === r ? ' ' + IC('dagger') + ' Ucciso dall’Assassino.' : '') + (g.robbed === r ? ' ' + IC('bag') + ' Il Ladro lo deruberà.' : '') + '</p>' +
    (P && P.char === r && g.phase === 'turns' && g.revealed[r] == null ? '<p class="lead">Verrai chiamato dopo i personaggi con il numero più basso.</p>' : '') + '</div></div>' + closeBtn();
}
function endConfirmBody(g, me) {
  if (!myTurnNow(g, me)) return '';
  var T = g.turn, miss = [];
  if (T.r === 1 && !T.used.kill) miss.push('non hai ucciso nessuno');
  if (T.r === 2 && !T.used.rob) miss.push('non hai derubato nessuno');
  if (T.built < T.max && Game.buildable(g, me).length) miss.push('puoi ancora costruire ' + (T.max - T.built > 1 ? 'dei quartieri' : 'un quartiere'));
  return '<h2>Finire il turno?</h2><p class="lead">Attenzione: ' + miss.join(' e ') + '.</p><button class="btn block" data-act="endyes">Sì, fine turno</button>' + closeBtn('Torno indietro');
}
/* ---------- un giocatore ---------- */
function playerBody(g, me, s) {
  var p = s.p, P = g.players[p]; if (!P) return '';
  var r = Game.visChar(g, p, me), sc = E.score(g, p), types = {};
  P.city.forEach(function (id) { types[E.D(id).t] = 1; });
  return '<div class="phead">' + pv(g, p, true) + '<div><div class="kicker">' + (p === me ? 'Tu' : 'Giocatore') + (g.crown === p ? ' · ha la corona' : '') + '</div><h2>' + Net.dot(P.uid) + esc(P.nick) + '</h2></div></div>' +
    '<div class="tags"><span class="gc">' + IC('coin') + ' <b>' + P.gold + '</b> oro</span><span class="gc">' + IC('cards') + ' <b>' + P.hand.length + '</b> carte in mano</span><span class="gc">' + IC('build') + ' <b>' + P.city.length + '/' + E.TARGET + '</b> quartieri</span>' +
    (r ? '<span class="gc">personaggio: <b>' + E.CH[r].n + '</b></span>' : P.char ? '<span class="gc">personaggio: <b>segreto</b></span>' : '') + '</div>' +
    '<div class="pboard">' + Game.cityRow(g, p, { big: true }) + '</div>' +
    '<p class="lead">Colori presenti: ' + ['n', 'r', 'c', 'm', 'u'].map(function (t) { return '<span class="tdot t-' + t + (types[t] ? ' on' : '') + '" title="' + E.TYPES[t] + '"></span>'; }).join('') + ' · <b>' + sc.total + ' punti</b> se la partita finisse adesso.</p>' +
    (App.doc.host === Net.uid && p !== me && g.phase !== 'over' ? '<button class="btn ghost block" data-act="auto" data-p="' + p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
}
/* ---------- fine partita ---------- */
function overBody(g, me, s) {
  var F = g.final, order = F.order, w = g.winners[0], iw = w === me;
  var podium = order.slice(0, 3).map(function (p, k) { return '<div class="pod p' + (k + 1) + '" style="--pc:' + pcol(g, p) + '">' + pv(g, p, true) + '<b>' + esc(g.players[p].nick) + '</b><span class="pod-s">' + F.sc[p].total + '</span><span class="pod-b">' + (k + 1) + '</span></div>'; }).join('');
  var rows = order.map(function (p, k) {
    var c = F.sc[p], P = g.players[p];
    return '<tr class="' + (p === me ? 'me' : '') + '" style="--pc:' + pcol(g, p) + '"><td class="nm">' + pv(g, p) + esc(P.nick) + '</td><td>' + c.city + '</td><td>' + (c.types ? '+' + c.types : '–') + '</td><td>' + (c.done ? '+' + c.done : '–') + '</td><td>' + (c.extra ? '+' + c.extra : '–') + '</td><td class="tot"><b class="cnt" data-to="' + c.total + '">' + (s.fresh ? 0 : c.total) + '</b></td></tr>';
  }).join('');
  return '<div class="over"><span class="over-crown"><svg viewBox="-20 -16 40 30">' + ART.crownPath(0, 0, 1) + '</svg></span><h2>' + (iw ? 'Hai vinto!' : 'Vince ' + esc(g.players[w].nick)) + '</h2>' +
    '<p class="lead">' + esc(g.players[g.first != null ? g.first : w].nick) + ' ha completato per primo la città dopo ' + g.round + ' round.</p><div class="podium">' + podium + '</div>' +
    '<div class="fs"><table><tr><th></th><th>Quartieri</th><th>Colori</th><th>Città<br>completa</th><th>Unici</th><th>Tot.</th></tr>' + rows + '</table></div>' +
    '<p class="lead" style="font-size:13.5px">Quartieri = somma dei costi; Colori = +3 con tutti e 5 i tipi; Città completa = +4 al primo, +2 agli altri; Unici = bonus dei quartieri viola.</p>' +
    '<details class="lastround"><summary>Le città finali</summary>' + order.map(function (p) { return '<div class="fcity"><b>' + esc(g.players[p].nick) + '</b>' + Game.cityRow(g, p) + '</div>'; }).join('') + '</details>' +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var pages = [
    ['Benvenuto a Citadels', '<div class="intro-art">' + RU.cards([RU.firstOf('Taverna'), RU.firstOf('Chiesa'), RU.firstOf('Castello'), RU.firstOf('Fortezza'), RU.firstOf('Biblioteca')]) + '</div><p>Costruisci la città più ricca. Ogni quartiere costa oro e vale <b>tanti punti quanto costa</b>. Chi arriva per primo a <b>7 quartieri</b> chiude la partita alla fine del round.</p>'],
    ['Ogni round, un personaggio segreto', '<div class="intro-court">' + [1, 2, 3, 4, 5, 6, 7, 8].map(function (r) { return '<span>' + ART.token(r) + '<i>' + r + '</i></span>'; }).join('') + '</div><p>Prima si sceglie <b>in segreto</b> un personaggio a testa (comincia chi ha la corona). Poi si chiamano <b>dall’1 all’8</b>: quando viene chiamato il tuo, tocca a te. In alto, la <b>corte</b> mostra a che punto siamo.</p>'],
    ['Il tuo turno, in tre passi', '<ol class="intro-steps"><li>' + IC('coin') + ' <b>Risorse</b>: prendi 2 oro oppure pesca 2 carte e tienine una.</li><li>' + IC('build') + ' <b>Costruisci</b> un quartiere della tua mano pagandone il costo.</li><li>' + IC('magic') + ' <b>Potere</b>: usa l’abilità del tuo personaggio.</li></ol><p>Non preoccuparti di ricordare tutto: la riga <b>«Adesso»</b> ti dice sempre cosa sta succedendo e cosa fare, e il <b>?</b> accanto spiega la regola.</p>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si gioca!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- eventi ---------- */
function countUp() {
  document.querySelectorAll('.sheet .cnt[data-to]').forEach(function (n, k) {
    var to = +n.getAttribute('data-to'); if (!to || n._go) return; n._go = 1;
    var t0 = performance.now() + 300 + k * 160, d = Math.min(1200, 350 + to * 18);
    requestAnimationFrame(function step(t) { var x = Math.max(0, Math.min(1, (t - t0) / d)); n.textContent = Math.round(to * (1 - Math.pow(1 - x, 3))); if (x < 1) requestAnimationFrame(step); else { n.classList.add('done'); Sound.play('tick'); } });
  });
}
function toggle(list, id) { var i = list.indexOf(id); if (i >= 0) list.splice(i, 1); else list.push(id); return list; }
function needTurn(g, me) { if (myTurnNow(g, me)) return true; toast('Aspetta il tuo turno.'); Sound.play('no'); return false; }
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet, id = +el.getAttribute('data-id');
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
    case 'introdone':
      lsSet('cd-intro-done', '1'); App.sheet = null;
      if (g && g.phase === 'pick' && E.decider(g) === me) App.sheet = { kind: 'pick' };
      else if (g && myTurnNow(g, me) && g.turn.drawn) App.sheet = { kind: 'keep' };
      renderSheet(); break;
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
    case 'char': App.sheet = { kind: 'char', r: +el.getAttribute('data-r') }; renderSheet(); break;
    case 'card': App.sheet = { kind: 'card', id: id, p: +el.getAttribute('data-p') }; renderSheet(); break;
    // scelta del personaggio
    case 'pickopen': if (g && g.phase === 'pick' && E.decider(g) === me) { App.sheet = { kind: 'pick' }; renderSheet(); } break;
    case 'pick': App.sheet = null; renderSheet(); act({ a: 'pick', r: +el.getAttribute('data-r') }); break;
    // il turno
    case 'gold': if (needTurn(g, me)) act({ a: 'gold' }); break;
    case 'draw': if (needTurn(g, me)) act({ a: 'draw' }); break;
    case 'keepopen': if (myTurnNow(g, me) && g.turn.drawn) { App.sheet = { kind: 'keep' }; renderSheet(); } break;
    case 'keep': App.sheet = null; renderSheet(); act({ a: 'keep', id: id }); break;
    case 'build': App.sheet = null; renderSheet(); act({ a: 'build', id: id }); break;
    case 'denopen': App.sheet = { kind: 'den', id: id, sel: [] }; renderSheet(); break;
    case 'densel': toggle(s.sel, id); renderSheet(); break;
    case 'denbuild': { var did = s.id, cs = s.sel.slice(); App.sheet = null; renderSheet(); act({ a: 'build', id: did, cards: cs }); break; }
    case 'income': if (needTurn(g, me)) act({ a: 'income' }); break;
    case 'smithy': if (needTurn(g, me)) act({ a: 'smithy' }); break;
    case 'pw': if (needTurn(g, me)) { App.sheet = { kind: el.getAttribute('data-k'), sel: el.getAttribute('data-k') === 'magic' ? [] : null }; renderSheet(); } break;
    case 'kill': App.sheet = null; renderSheet(); act({ a: 'kill', r: +el.getAttribute('data-r') }); break;
    case 'rob': App.sheet = null; renderSheet(); act({ a: 'rob', r: +el.getAttribute('data-r') }); break;
    case 'swap': App.sheet = null; renderSheet(); act({ a: 'swap', t: +el.getAttribute('data-t') }); break;
    case 'rdsel': toggle(s.sel, id); renderSheet(); break;
    case 'redraw': { var ids = s.sel.slice(); App.sheet = null; renderSheet(); act({ a: 'redraw', ids: ids }); break; }
    case 'dsel': s.sel = { t: +el.getAttribute('data-t'), id: id }; renderSheet(); break;
    case 'destroy': { var ds = s.sel; App.sheet = null; renderSheet(); act({ a: 'destroy', t: ds.t, id: ds.id }); break; }
    case 'lab': App.sheet = null; renderSheet(); act({ a: 'lab', id: id }); break;
    case 'endturn': {
      if (!needTurn(g, me)) break;
      var T = g.turn, warn = (T.r === 1 && !T.used.kill) || (T.r === 2 && !T.used.rob) || (T.built < T.max && Game.buildable(g, me).length);
      if (warn) { App.sheet = { kind: 'endconfirm' }; renderSheet(); } else act({ a: 'end' });
      break;
    }
    case 'endyes': App.sheet = null; renderSheet(); act({ a: 'end' }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); }
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
