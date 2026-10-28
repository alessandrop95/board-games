/* ===== Catan: finestre (costruire, commerciare, carte sviluppo, scarto, furto, tessere, giocatori, classifica) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  if (root._s !== s) { root._s = s; App.sheetAt = Date.now(); }
  var y = root.querySelector('.sheet') && root._s === s ? root.querySelector('.sheet').scrollTop : 0;
  root.innerHTML = '<div class="sheet-back' + (s.kind === 'hex' ? ' light' : '') + '" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>';
  if (y) root.querySelector('.sheet').scrollTop = y;
  if (s.kind === 'rules' && s.focus) { var t = document.getElementById('r-' + s.focus); if (t) t.scrollIntoView({ block: 'start' }); }
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function step(act, r, n, canDown, canUp, extra) {
  return '<div class="stp"><span class="stp-r">' + ART.resDot(r) + '<span>' + D.RN1[r] + (extra || '') + '</span></span><button class="zb s" data-act="' + act + '" data-r="' + r + '" data-d="-1"' + (canDown ? '' : ' disabled') + ' aria-label="Meno ' + D.RN[r] + '">−</button><b>' + n + '</b><button class="zb s" data-act="' + act + '" data-r="' + r + '" data-d="1"' + (canUp ? '' : ' disabled') + ' aria-label="Più ' + D.RN[r] + '">+</button></div>';
}
function sum(o) { var n = 0; for (var k in o) n += o[k] || 0; return n; }
var TILEIMG = {};
function tileImg(t) { if (!TILEIMG[t]) { var c = document.createElement('canvas'); CTPainter.tile(c, t, 160); TILEIMG[t] = c.toDataURL(); } return '<img class="tile-img" src="' + TILEIMG[t] + '" alt="">'; }

function sheetBody(s) {
  var g = G(), me = myIdx(), P = g && me >= 0 ? g.players[me] : null;
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html() + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="costs">Costi delle costruzioni</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button><button class="btn ghost block" data-act="log">Tutte le mosse della partita</button>' +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (s.kind === 'costs') return '<h2>' + IC('build') + ' Costi</h2>' + RU.S.build[1] + closeBtn();
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? D.PCOL[g.players[l.p].col].c : 'rgba(217,180,90,.5)'; return '<div class="fl" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'hex') return hexBody(g, me, s.h);
  if (s.kind === 'player') return playerBody(g, s.p, me);
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  if (!P) return '';
  if (s.kind === 'build') return buildBody(g, me);
  if (s.kind === 'trade') return tradeBody(g, me, s);
  if (s.kind === 'devs') return devsBody(g, me, s);
  if (s.kind === 'discard') return discardBody(g, me, s);
  if (s.kind === 'steal') return stealBody(g, me);
  return '';
}

/* ---------- costruire ---------- */
function buildBody(g, me) {
  var P = g.players[me], main = g.turn === me && g.stage === 'main' && !g.trade;
  function costHave(c) { return D.RES.filter(function (r) { return c[r]; }).map(function (r) { var ok = P.res[r] >= c[r]; return '<span class="ch' + (ok ? ' ok' : '') + '">' + ART.resDot(r, c[r]) + '</span>'; }).join(''); }
  function row(k, icon, name, gives, left, legal, btnAct, btnTxt) {
    var c = D.COST[k], has = E.has(P.res, c), why = !main ? 'Si costruisce nel tuo turno, dopo il lancio.' : !has ? 'Ti mancano delle risorse.' : left <= 0 ? 'Hai finito questi pezzi.' : legal === 0 ? 'Non c’è un posto valido.' : '';
    return '<div class="bl' + (why ? ' no' : '') + '"><div class="bl-i">' + icon + '</div><div class="bl-t"><b>' + name + '</b><small>' + gives + (left != null ? ' · ne hai ancora ' + left : '') + '</small><div class="bl-c">' + costHave(c) + '</div>' + (why && main ? '<small class="bad">' + why + '</small>' : '') + '</div>' +
      '<button class="btn small" data-act="' + btnAct + '" data-k="' + k + '"' + (why ? ' disabled' : '') + '>' + btnTxt + '</button></div>';
  }
  return '<h2>' + IC('build') + ' Costruisci</h2><p class="lead">Scegli cosa costruire: poi tocca sull’isola il posto che lampeggia e conferma. Le risorse che hai sono in verde.</p><div class="bls">' +
    row('road', ART.piece('road', P.col, 34), 'Strada', 'allunga la tua rete', P.pieces.road, E.legalRoads(g, me).length, 'buildpick', 'Scegli dove') +
    row('settle', ART.piece('settle', P.col, 34), 'Colonia', '+1 punto, produce 1', P.pieces.settle, E.legalSettles(g, me, false).length, 'buildpick', 'Scegli dove') +
    row('city', ART.piece('city', P.col, 34), 'Città', '+1 punto in più, produce 2', P.pieces.city, E.legalCities(g, me).length, 'buildpick', 'Scegli quale') +
    row('dev', '<span class="bl-dev">' + ART.devBack() + '</span>', 'Carta sviluppo', 'cavaliere, punto o progresso', null, g.deck.length, 'buydev', g.deck.length ? 'Compra' : 'Finite') +
    '</div><button class="btn ghost small" data-act="help" data-r="build">Regole delle costruzioni</button>' + closeBtn();
}

/* ---------- commerciare ---------- */
function tradeBody(g, me, s) {
  var P = g.players[me], rt = E.rates(g, me);
  s.give = s.give || {}; s.get = s.get || {}; s.tab = s.tab || 'players';
  var tabs = '<div class="tabs"><button class="chip' + (s.tab === 'players' ? ' on' : '') + '" data-act="ttab" data-t="players">Con i giocatori</button><button class="chip' + (s.tab === 'bank' ? ' on' : '') + '" data-act="ttab" data-t="bank">' + IC('bank') + ' Con la banca e i porti</button></div>';
  if (s.tab === 'players') {
    var give = D.RES.map(function (r) { var n = s.give[r] || 0; return step('tgive', r, n, n > 0, n < P.res[r] && !(s.get[r]), ' <small class="muted">(hai ' + P.res[r] + ')</small>'); }).join('');
    var get = D.RES.map(function (r) { var n = s.get[r] || 0; return step('tget', r, n, n > 0, n < 9 && !(s.give[r])); }).join('');
    var ok = sum(s.give) > 0 && sum(s.get) > 0, left = 12 - g.offers;
    return '<h2>' + IC('trade') + ' Commercia</h2>' + tabs + '<p class="lead">Proponi uno scambio a tutti: gli altri accettano o rifiutano dal loro telefono e tu scegli con chi chiudere.</p>' +
      '<div class="tcols"><div><h4>Dai</h4>' + give + '</div><div><h4>Chiedi</h4>' + get + '</div></div>' +
      '<button class="btn block" data-act="tpropose"' + (ok && left > 0 ? '' : ' disabled') + '>Proponi a tutti</button>' + (left <= 3 ? '<p class="muted">Puoi fare ancora ' + left + ' propost' + (left === 1 ? 'a' : 'e') + ' in questo turno.</p>' : '') +
      '<button class="btn ghost small" data-act="help" data-r="trade">Regole del commercio</button>' + closeBtn();
  }
  if (s.bg && P.res[s.bg] < rt[s.bg]) s.bg = null;
  if (s.bt && (s.bt === s.bg || g.bank[s.bt] <= 0)) s.bt = null;
  var gv = D.RES.map(function (r) { var can = P.res[r] >= rt[r]; return '<button class="bk' + (s.bg === r ? ' on' : '') + '" data-act="bgive" data-r="' + r + '"' + (can ? '' : ' disabled') + '>' + ART.resDot(r) + '<b>' + rt[r] + ':1</b><small>hai ' + P.res[r] + '</small></button>'; }).join('');
  var gt = D.RES.map(function (r) { var can = g.bank[r] > 0 && r !== s.bg; return '<button class="bk' + (s.bt === r ? ' on' : '') + '" data-act="bget" data-r="' + r + '"' + (can ? '' : ' disabled') + '>' + ART.resDot(r) + '<small>banca ' + g.bank[r] + '</small></button>'; }).join('');
  var ports = g.harbors.filter(function (h) { var e = D.edges[h.e]; return E.owner(g, e.a) === me || E.owner(g, e.b) === me; }).map(function (h) { return h.k === '3' ? 'porto 3:1' : 'porto 2:1 ' + D.RN[h.k]; });
  return '<h2>' + IC('trade') + ' Commercia</h2>' + tabs + '<p class="lead">Dai alla banca più carte uguali e ricevi 1 carta a scelta. ' + (ports.length ? 'Hai: <b>' + ports.join(', ') + '</b>.' : 'Senza porti il cambio è 4:1: costruisci su un molo per cambiare a 3:1 o 2:1.') + '</p>' +
    '<h4>Dai</h4><div class="bks">' + gv + '</div><h4>Ricevi</h4><div class="bks">' + gt + '</div>' +
    '<button class="btn block" data-act="bankok"' + (s.bg && s.bt ? '' : ' disabled') + '>' + (s.bg && s.bt ? 'Dai ' + rt[s.bg] + ' ' + D.RN[s.bg] + ' per 1 ' + D.RN[s.bt] : 'Scegli cosa dai e cosa ricevi') + '</button>' + closeBtn();
}

/* ---------- carte sviluppo ---------- */
var DEVTXT = {
  knight: 'Sposta il ladro e ruba una carta. Conta per l’Esercito più grande.', vp: 'Vale 1 punto. Non si gioca: si scopre a fine partita.',
  road2: 'Costruisci gratis 2 strade.', plenty: 'Prendi dalla banca 2 risorse a scelta.', mono: 'Scegli una risorsa: tutti ti danno quelle che hanno.'
};
function devsBody(g, me, s) {
  var P = g.players[me];
  if (s.mode === 'plenty') {
    s.rs = s.rs || [];
    var chips = D.RES.map(function (r) { var n = s.rs.filter(function (x) { return x === r; }).length; return '<button class="bk' + (n ? ' on' : '') + '" data-act="plentyr" data-r="' + r + '"' + (g.bank[r] > 0 ? '' : ' disabled') + '>' + ART.resDot(r) + (n ? '<b>×' + n + '</b>' : '') + '<small>banca ' + g.bank[r] + '</small></button>'; }).join('');
    return '<h2>Invenzione</h2><p class="lead">Scegli 2 risorse da prendere dalla banca (anche uguali). Tocca di nuovo per togliere.</p><div class="bks">' + chips + '</div>' +
      '<button class="btn block" data-act="plentyok"' + (s.rs.length === 2 ? '' : ' disabled') + '>Prendi ' + (s.rs.length ? s.rs.map(function (r) { return D.RN[r]; }).join(' e ') : '') + '</button><button class="btn ghost block" data-act="devback">Indietro</button>';
  }
  if (s.mode === 'mono') {
    var others = function (r) { var n = 0; g.players.forEach(function (Q, q) { if (q !== me) n += Q.res[r]; }); return n; };
    var ch = D.RES.map(function (r) { return '<button class="bk' + (s.r === r ? ' on' : '') + '" data-act="monor" data-r="' + r + '">' + ART.resDot(r) + '<small>' + D.RN[r] + '</small></button>'; }).join('');
    return '<h2>Monopolio</h2><p class="lead">Scegli una risorsa: tutti gli altri ti danno <b>tutte</b> le carte di quella risorsa che hanno in mano. Non sai quante ne hanno: indovina guardando cosa producono!</p><div class="bks">' + ch + '</div>' +
      '<button class="btn block" data-act="monook"' + (s.r ? '' : ' disabled') + '>Prendi tutto il ' + (s.r ? D.RN[s.r] : '…') + '</button><button class="btn ghost block" data-act="devback">Indietro</button>';
  }
  var kinds = ['knight', 'road2', 'plenty', 'mono', 'vp'], list = '';
  kinds.forEach(function (k) {
    var cs = P.devs.filter(function (d) { return d.k === k; }); if (!cs.length) return;
    var fresh = cs.filter(function (d) { return d.t >= g.turnN; }).length, why = E.canPlayDev(g, me, k);
    var btn = k === 'vp' ? '<span class="good">' + IC('star') + ' +' + cs.length + ' punt' + (cs.length > 1 ? 'i' : 'o') + '</span>' : '<button class="btn small" data-act="playdev" data-k="' + k + '"' + (why ? ' disabled' : '') + '>Gioca</button>';
    list += '<div class="dv"><div class="dv-c">' + ART.devCard(k) + (cs.length > 1 ? '<span class="n">×' + cs.length + '</span>' : '') + '</div><div class="dv-t"><b>' + esc(D.DEVN[k]) + '</b><small>' + DEVTXT[k] + '</small>' +
      (fresh && k !== 'vp' ? '<small class="muted">' + (fresh === cs.length ? 'Comprat' + (fresh > 1 ? 'e' : 'a') + ' in questo turno: si gioca dal prossimo.' : fresh + ' comprata in questo turno.') + '</small>' : '') +
      (why && k !== 'vp' && !fresh ? '<small class="muted">' + esc(why) + '</small>' : '') + '</div>' + btn + '</div>';
  });
  return '<h2>' + IC('dev') + ' Le tue carte sviluppo</h2><p class="lead">Una carta per turno, anche prima di lanciare i dadi. Le carte sono segrete: gli altri vedono solo quante ne hai.' + (P.knights ? ' Cavalieri giocati: <b>' + P.knights + '</b>.' : '') + '</p>' +
    (list ? '<div class="dvs">' + list + '</div>' : '<p class="muted">Non hai carte sviluppo. Si comprano con ' + RU.cost(D.COST.dev) + ' da «Costruisci».</p>') +
    '<p class="muted">Nel mazzo ne restano ' + g.deck.length + '.</p><button class="btn ghost small" data-act="help" data-r="dev">Regole delle carte</button>' + closeBtn();
}

/* ---------- scarto col 7, furto ---------- */
function discardBody(g, me, s) {
  var P = g.players[me], need = E.mustDiscard(g, me); if (!need) return '';
  s.sel = s.sel || {}; var n = sum(s.sel);
  var rows = D.RES.map(function (r) { var k = s.sel[r] || 0; return P.res[r] ? step('dstep', r, k, k > 0, k < P.res[r] && n < need, ' <small class="muted">(hai ' + P.res[r] + ')</small>') : ''; }).join('');
  return '<h2>' + ART.robberIcon(22) + ' È uscito il 7!</h2><p class="lead">Hai ' + E.total(P.res) + ' carte: devi scartarne <b>' + need + '</b> (metà, per difetto). Scegli quali.</p>' + rows +
    '<button class="btn block" data-act="discardok"' + (n === need ? '' : ' disabled') + '>' + (n === need ? 'Scarta queste ' + need + ' carte' : 'Ne hai scelte ' + n + ' di ' + need) + '</button><button class="btn ghost small" data-act="discardauto">Scegli tu per me</button>';
}
function stealBody(g, me) {
  if (g.stage !== 'steal' || g.turn !== me) return '';
  return '<h2>' + ART.robberIcon(22) + ' A chi rubi?</h2><p class="lead">Prendi una carta a caso a uno dei giocatori che hanno una costruzione sulla tessera del ladro.</p><div class="rlist">' +
    g.victims.map(function (q) { var Q = g.players[q]; return '<button class="trow rt" data-act="stealp" data-p="' + q + '" style="--pc:' + D.PCOL[Q.col].c + '">' + ART.pieceIcon(Q.col, 26) + '<span class="grow"><b>' + esc(Q.nick) + '</b><small>' + E.total(Q.res) + ' carte in mano · ' + E.visibleVP(g, q) + ' punti</small></span>' + IC('end') + '</button>'; }).join('') + '</div>';
}

/* ---------- tessera ---------- */
function hexBody(g, me, hi) {
  var T = g.hex[hi], ter = D.TERR[T.t], r = ter.r, H = D.hexes[hi];
  var who = H.v.map(function (v) { return g.vown[v]; }).filter(Boolean).map(function (o) { return '<span class="gc" style="border-left:4px solid ' + D.PCOL[g.players[o.p].col].c + '">' + esc(g.players[o.p].nick) + ' · ' + (o.city ? 'città (2)' : 'colonia (1)') + '</span>'; }).join('');
  var pips = T.n ? D.PIPS[T.n] : 0;
  return '<div class="hx-h">' + tileImg(T.t) + '<div><div class="kicker">Tessera</div><h2>' + ter.n + '</h2>' + (r ? '<p class="lead">Produce ' + ART.resDot(r) + ' <b>' + D.RN[r] + '</b></p>' : '<p class="lead">Non produce niente.</p>') + '</div></div>' +
    (T.n ? '<p>Numero <b class="' + (pips === 5 ? 'bad' : '') + '">' + T.n + '</b>: esce in media <b>' + pips + ' volte su 36</b> lanci' + (pips === 5 ? ', uno dei più frequenti' : pips <= 2 ? ', raramente' : '') + '.</p>' : '') +
    (g.robber === hi ? '<p class="why">' + ART.robberIcon(16) + ' Qui c’è il ladro: questa tessera non produce finché non viene spostato.</p>' : '') +
    (who ? '<h4>Chi raccoglie qui</h4><div class="tags">' + who + '</div>' : '<p class="muted">Nessuno ha ancora costruito attorno a questa tessera.</p>') + closeBtn();
}

/* ---------- giocatore ---------- */
function playerBody(g, p, me) {
  var P = g.players[p], rt = E.rates(g, p), ports = D.RES.filter(function (r) { return rt[r] < 4; }).map(function (r) { return rt[r] + ':1 ' + D.RN[r]; });
  var s = 0, c = 0; for (var v in g.vown) if (g.vown[v].p === p) { if (g.vown[v].city) c++; else s++; }
  return '<div class="phead">' + ART.pieceIcon(P.col, 60) + '<div><div class="kicker">' + (p === me ? 'Tu' : 'Giocatore') + ' · ' + D.PCOL[P.col].n.toLowerCase() + '</div><h2>' + Net.dot(P.uid) + esc(P.nick) + '</h2></div></div>' +
    '<div class="tags"><span class="gc">' + IC('star') + E.visibleVP(g, p) + ' punti visibili' + (p === me && E.vpCards(P) ? ' + ' + E.vpCards(P) + ' segreti' : '') + '</span><span class="gc">' + ART.piece('settle', P.col, 16) + s + ' colonie</span><span class="gc">' + ART.piece('city', P.col, 16) + c + ' città</span>' +
    '<span class="gc">' + IC('cards') + E.total(P.res) + ' carte risorsa</span><span class="gc">' + IC('dev') + P.devs.length + ' carte sviluppo</span><span class="gc">' + IC('knight') + P.knights + ' cavalieri giocati</span><span class="gc">' + IC('road') + 'strada più lunga: ' + P.road + '</span>' +
    (g.lr === p ? '<span class="gc gold">' + IC('road') + ' Strada più lunga +2</span>' : '') + (g.la === p ? '<span class="gc gold">' + IC('knight') + ' Esercito più grande +2</span>' : '') + (ports.length ? '<span class="gc">' + IC('harbor') + ports.join(', ') + '</span>' : '') + '</div>' +
    (App.doc.host === Net.uid && p !== me && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn();
}

/* ---------- presentazione ---------- */
function introBody(s) {
  var pages = [
    ['Benvenuto su Catan', '<div class="intro-art">' + ['wood', 'brick', 'wool', 'grain', 'ore'].map(function (r) { return ART.resCard(r); }).join('') + '</div>' +
      '<p>Cinque risorse, cinque terreni. Con le risorse costruisci <b>strade</b>, <b>colonie</b> (1 punto) e <b>città</b> (2 punti). Vince chi arriva per primo a <b>' + ((G() && G().opts.vp) || 10) + ' punti</b>.</p>'],
    ['Si comincia: la fondazione', '<p>Ognuno piazza gratis <b>2 colonie</b> con una <b>strada</b> ciascuna: un giro in ordine e uno al contrario. Gli incroci validi <b>lampeggiano</b>: tocca, poi conferma.</p><p>Scegli incroci che toccano numeri <b>frequenti</b>: più puntini sotto il numero, più spesso esce. <b class="bad">6</b> e <b class="bad">8</b> sono i migliori.</p>'],
    ['Ogni turno', '<div class="intro3"><div>' + ART.die(5, false, 40) + '<b>Lancia i dadi</b><small>le tessere col numero producono per tutti</small></div><div>' + ART.resCard('wool') + '<b>Commercia</b><small>con gli altri o con la banca</small></div><div>' + ART.piece('settle', 0, 40) + '<b>Costruisci</b><small>poi tocca Fine turno</small></div></div>' +
      '<p>Col <b>7</b> non produce nessuno: chi ha più di 7 carte ne scarta metà e chi ha lanciato sposta il <b>ladro</b> e ruba una carta.</p>'],
    ['Come si usa lo schermo', '<ul class="intro-list"><li><b>In alto</b> i giocatori: punti ' + IC('star') + ', carte ' + IC('cards') + ', carte sviluppo ' + IC('dev') + '. Toccali per i dettagli.</li><li><b>L’isola</b> si trascina e si ingrandisce con due dita. Tocca una tessera per sapere cosa produce e quanto spesso.</li>' +
      '<li><b>La riga dorata</b> ti dice sempre cosa fare; il ' + IC('help') + ' spiega la regola di quel momento.</li><li><b>I pulsanti</b> sotto: Costruisci, Commercia, Carte, Fine turno.</li><li><b>In fondo</b> le tue carte. Se hai un porto vedi il cambio (3:1 o 2:1) sulla carta.</li></ul>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Iniziamo!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- fine partita ---------- */
function overBody(g, me) {
  var F = g.final, W = g.winner;
  var rows = F.order.map(function (p, i) {
    var x = F.rows[p], P = g.players[p], parts = [];
    if (x.settle) parts.push(ART.piece('settle', P.col, 16) + ' ' + x.settle + ' colon' + (x.settle > 1 ? 'ie' : 'ia') + ' <b>+' + x.settle + '</b>');
    if (x.city) parts.push(ART.piece('city', P.col, 16) + ' ' + x.city + ' citt' + 'à <b>+' + x.city * 2 + '</b>');
    if (x.lr) parts.push(IC('road') + ' Strada più lunga <b>+2</b>');
    if (x.la) parts.push(IC('knight') + ' Esercito più grande <b>+2</b>');
    if (x.vpc) parts.push(IC('dev') + ' Carte punto <b>+' + x.vpc + '</b>');
    return '<div class="fr' + (i === 0 ? ' win' : '') + '" style="--pc:' + D.PCOL[P.col].c + ';animation-delay:' + (i * .25) + 's"><div class="fr-h"><span class="rk">' + (i + 1) + '</span>' + ART.pieceIcon(P.col, 28) + '<b>' + esc(P.nick) + (p === me ? ' (tu)' : '') + '</b><span class="tot">' + x.vp + '</span></div>' +
      '<div class="fr-d">' + parts.map(function (t) { return '<span>' + t + '</span>'; }).join('') + '<span>' + IC('knight') + ' ' + x.knights + ' cavalieri · ' + IC('road') + ' strada ' + x.road + '</span></div></div>';
  }).join('');
  return '<div class="over"><div class="crown">' + ART.piece('city', g.players[W].col, 92) + '</div><h2>' + (W === me ? 'Hai vinto!' : 'Vince ' + esc(g.players[W].nick)) + '</h2>' +
    '<p class="lead">' + F.rows[W].vp + ' punti al ' + g.round + 'º giro.</p><div class="frs">' + rows + '</div>' +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda l’isola') + '</div>';
}

/* ---------- eventi ---------- */
function needTurn(g, me, stages) {
  if (!g || me < 0) return false;
  if (g.phase !== 'play') return false;
  if (g.turn !== me) { toast('Non è il tuo turno.'); return false; }
  if (stages.indexOf(g.stage) < 0) { toast(g.stage === 'roll' ? 'Prima lancia i dadi.' : g.trade ? 'Prima chiudi o ritira la proposta di scambio.' : 'Prima finisci quello che stai facendo.'); return false; }
  if (g.trade && stages.indexOf('roll') < 0) { toast('Prima chiudi o ritira la proposta di scambio.'); return false; }
  return true;
}
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet;
  switch (a) {
    case 'sheetback': if (ev.target === el && s && s.kind !== 'intro' && Date.now() - (App.sheetAt || 0) > 450) { App.sheet = null; renderSheet(); if (g) Game.render(); } return;
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r'), back: s && s.kind !== 'help' ? s : null }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'costs': App.sheet = { kind: 'costs' }; renderSheet(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); break;
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); break;
    case 'intronext': s.page++; renderSheet(); break;
    case 'introprev': s.page--; renderSheet(); break;
    case 'introdone': lsSet('ct-intro-done', '1'); App.sheet = s.after || null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'close': if (s && s.kind === 'help' && s.back) App.sheet = s.back; else App.sheet = null; renderSheet(); if (g) Game.render(); break;
    case 'leave': App.sheet = null; if (Exit.ask()) renderSheet(); else leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; App.pick = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; renderSheet(); Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i giocatori automatici.'); break;
    case 'auto': App.sheet = null; renderSheet(); send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'resume': send({ t: 'back' }); break;
    case 'player': App.sheet = { kind: 'player', p: +el.getAttribute('data-p') }; renderSheet(); break;
    case 'zin': Board.zoomAt(1.35); break;
    case 'zout': Board.zoomAt(1 / 1.35); break;
    case 'zfit': Board.fit(); break;
    // turno
    case 'roll': if (needTurn(g, me, ['roll'])) act({ a: 'roll' }); break;
    case 'end': if (needTurn(g, me, ['main'])) { App.pick = null; act({ a: 'end' }); } break;
    case 'build': if (needTurn(g, me, ['main'])) { App.sheet = { kind: 'build' }; renderSheet(); } break;
    case 'trade': if (needTurn(g, me, ['main'])) { App.sheet = { kind: 'trade', tab: App.tradeTab || 'players', give: {}, get: {} }; renderSheet(); } break;
    case 'res': {
      if (!g || me < 0) return;
      var rr = el.getAttribute('data-r'), rt0 = E.rates(g, me)[rr];
      if (g.turn === me && g.stage === 'main' && !g.trade) { App.sheet = { kind: 'trade', tab: g.players[me].res[rr] >= rt0 ? 'bank' : 'players', give: {}, get: {}, bg: g.players[me].res[rr] >= rt0 ? rr : null }; renderSheet(); }
      else toast(D.RN1[rr] + ': ne hai ' + g.players[me].res[rr] + '. Con la banca la cambi ' + rt0 + ':1.');
      break;
    }
    case 'devs': if (g && me >= 0) { App.sheet = { kind: 'devs' }; renderSheet(); } break;
    case 'buildpick': { var k = el.getAttribute('data-k'); App.pick = { k: k }; App.pickSel = null; App.sheet = null; renderSheet(); Game.render(); Board.fit(); break; }
    case 'unpick': App.pick = null; App.pickSel = null; Game.render(); break;
    case 'buydev': App.sheet = null; renderSheet(); act({ a: 'build', k: 'dev' }); break;
    case 'pickok': Game.confirmPick(); break;
    case 'pickno': App.pickSel = null; if (g && g.stage === 'main') App.pick = null; Game.render(); break;
    case 'endroads': act({ a: 'endroads' }); break;
    // commercio
    case 'ttab': s.tab = el.getAttribute('data-t'); App.tradeTab = s.tab; renderSheet(); break;
    case 'tgive': case 'tget': { var side = a === 'tgive' ? s.give : s.get, r1 = el.getAttribute('data-r'); side[r1] = Math.max(0, (side[r1] || 0) + +el.getAttribute('data-d')); renderSheet(); break; }
    case 'tpropose': { var gv = s.give, gt = s.get; App.sheet = null; renderSheet(); act({ a: 'offer', give: gv, get: gt }); break; }
    case 'bgive': s.bg = el.getAttribute('data-r'); if (s.bt === s.bg) s.bt = null; renderSheet(); break;
    case 'bget': s.bt = el.getAttribute('data-r'); renderSheet(); break;
    case 'bankok': { var bg = s.bg, bt = s.bt; s.bt = null; act({ a: 'bank', give: bg, get: bt }); break; }
    case 'cancel': act({ a: 'cancel' }); break;
    case 'deal': act({ a: 'deal', id: g.trade.id, with: +el.getAttribute('data-p') }); break;
    case 'respond': if (g && g.trade) act({ a: 'respond', id: g.trade.id, ok: el.getAttribute('data-ok') === '1' }); break;
    // carte sviluppo
    case 'playdev': {
      var dk = el.getAttribute('data-k');
      if (dk === 'plenty') { s.mode = 'plenty'; s.rs = []; renderSheet(); break; }
      if (dk === 'mono') { s.mode = 'mono'; s.r = null; renderSheet(); break; }
      App.sheet = null; renderSheet(); act({ a: 'play', k: dk }); break;
    }
    case 'devback': s.mode = null; renderSheet(); break;
    case 'plentyr': {   // tocchi: aggiunge (anche due uguali); a scelta piena toglie quella risorsa o sostituisce l'ultima
      var pr = el.getAttribute('data-r'), cnt = s.rs.filter(function (x) { return x === pr; }).length;
      if (s.rs.length < 2 && cnt < g.bank[pr]) s.rs.push(pr);
      else if (cnt) s.rs = s.rs.filter(function (x) { return x !== pr; });
      else s.rs[1] = pr;
      renderSheet(); break;
    }
    case 'plentyok': { var rs = s.rs.slice(); App.sheet = null; renderSheet(); act({ a: 'play', k: 'plenty', rs: rs }); break; }
    case 'monor': s.r = el.getAttribute('data-r'); renderSheet(); break;
    case 'monook': { var mr = s.r; App.sheet = null; renderSheet(); act({ a: 'play', k: 'mono', r: mr }); break; }
    // scarto e furto
    case 'opendiscard': App.sheet = { kind: 'discard', sel: {} }; renderSheet(); break;
    case 'dstep': { var r2 = el.getAttribute('data-r'); s.sel[r2] = Math.max(0, (s.sel[r2] || 0) + +el.getAttribute('data-d')); renderSheet(); break; }
    case 'discardok': { var sel = {}; D.RES.forEach(function (r) { if (s.sel[r]) sel[r] = s.sel[r]; }); App.sheet = null; renderSheet(); act({ a: 'discard', res: sel }); break; }
    case 'discardauto': { var mv = BOT.decide(clone(g), me, {}); if (mv && mv.a === 'discard') { s.sel = mv.res; renderSheet(); } break; }
    case 'opensteal': App.sheet = { kind: 'steal' }; renderSheet(); break;
    case 'stealp': App.sheet = null; renderSheet(); act({ a: 'steal', from: +el.getAttribute('data-p') }); break;
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (ev.target.id === 'opt-vp') send({ t: 'opt', vp: +ev.target.value });
  if (ev.target.id === 'opt-gentle') send({ t: 'opt', gentle: ev.target.checked });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape' && App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); if (G()) Game.render(); }
});

/* ---------- avvio ---------- */
(function boot() {
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || myNick()) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
