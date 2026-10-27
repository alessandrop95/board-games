/* ===== Campi d'Acciaio: finestre (battaglia, incontri, scelte delle azioni, schede) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; root._k = null; return; }
  var h = sheetBody(s); if (!h) { App.sheet = null; root.innerHTML = ''; return; }
  var lock = ['combat', 'enc', 'factory'].indexOf(s.kind) >= 0;
  root.innerHTML = '<div class="sheet-back' + (lock ? ' lock' : '') + '" data-act="sheetback"><div class="sheet sh-' + s.kind + '" role="dialog" aria-modal="true">' + h + '</div></div>';
  if (s.kind === 'rules' && s.focus) { var t = document.getElementById('r-' + s.focus); if (t) t.scrollIntoView({ block: 'start' }); }
  if (s.kind === 'reveal') animateReveal();
}
function closeBtn(t) { return '<button class="btn block ghost" data-act="close">' + (t || 'Chiudi') + '</button>'; }
function gainChips(gain) {
  var a = [];
  if (gain.c) a.push(gain.c + IC('coin')); if (gain.pw) a.push('+' + gain.pw + IC('power')); if (gain.pop) a.push('+' + gain.pop + IC('pop')); if (gain.cd) a.push('+' + gain.cd + IC('card'));
  if (gain.r) D.RES_ORDER.forEach(function (r) { if (gain.r[r]) a.push('+' + gain.r[r] + IC(r)); });
  if (gain.ar) a.push('+' + gain.ar + ' a scelta'); if (gain.wk) a.push('+' + gain.wk + IC('worker'));
  if (gain.mech) a.push(IC('deploy') + ' mech'); if (gain.st) a.push(IC('build') + ' struttura'); if (gain.up) a.push(IC('upgrade') + ' aggiorna'); if (gain.en) a.push(IC('enlist') + ' recluta');
  return a.map(function (x) { return '<span class="gc">' + x + '</span>'; }).join('');
}
function costChips(cost) {
  var a = []; cost = cost || {};
  if (cost.c) a.push('−' + cost.c + IC('coin')); if (cost.pop) a.push('−' + cost.pop + IC('pop')); if (cost.pw) a.push('−' + cost.pw + IC('power')); if (cost.cd) a.push('−' + cost.cd + IC('card')); if (cost.ar) a.push('−' + cost.ar + ' risorse');
  return a.length ? a.map(function (x) { return '<span class="cc">' + x + '</span>'; }).join('') : '<span class="cc free">gratis</span>';
}
function resPicker(id, n, cur) {
  cur = cur || {}; var tot = 0; for (var k in cur) tot += cur[k];
  return '<div class="rpick" data-rp="' + id + '">' + D.RES_ORDER.map(function (r) { return '<div class="rp"><span>' + IC(r) + D.RES[r].N + '</span><button class="zb s" data-act="rp" data-rp="' + id + '" data-r="' + r + '" data-d="-1"' + (cur[r] ? '' : ' disabled') + '>−</button><b>' + (cur[r] || 0) + '</b><button class="zb s" data-act="rp" data-rp="' + id + '" data-r="' + r + '" data-d="1"' + (tot < n ? '' : ' disabled') + '>+</button></div>'; }).join('') + '<p class="muted">Scelte ' + tot + ' su ' + n + '</p></div>';
}
// scelte per i premi gratuiti (mech, struttura, aggiornamento, recluta, risorse)
function subPicker(g, me, gain, key, sub, hexK) {
  var P = g.players[me], f = F[P.fac], h = '';
  if (gain.mech) h += '<h4>Quale mech?</h4><div class="opts">' + f.mechs.map(function (m, i) { var used = P.mechs.indexOf(i) >= 0; return '<button class="opt' + (sub.mech === i ? ' on' : '') + '" data-act="sub" data-key="' + key + '" data-f="mech" data-v="' + i + '"' + (used ? ' disabled' : '') + '><b>' + m.n + '</b><small>' + m.d + '</small>' + (used ? '<em>già schierato</em>' : '') + '</button>'; }).join('') + '</div>';
  if (gain.st) h += '<h4>Quale struttura?</h4><div class="opts">' + Object.keys(D.STRUCTS).map(function (s) { var used = !!P.st[s]; return '<button class="opt' + (sub.st === s ? ' on' : '') + '" data-act="sub" data-key="' + key + '" data-f="st" data-v="' + s + '"' + (used ? ' disabled' : '') + '>' + IC(s) + '<b>' + D.STRUCTS[s].n + '</b><small>' + D.STRUCTS[s].d + '</small></button>'; }).join('') + '</div>';
  if (gain.up) h += upgradeOpts(g, me, sub.up || {}, key);
  if (gain.en) h += enlistOpts(g, me, sub.en || {}, key);
  if (gain.ar) h += '<h4>Quali risorse?</h4>' + resPicker(key, gain.ar, sub.ar);
  return h;
}
function upgradeOpts(g, me, cur, key) {
  var P = g.players[me], m = D.MATS[P.mat];
  return '<h4>1. Cosa migliora in alto</h4><div class="opts">' + Object.keys(D.UPS).map(function (u) { var U = D.UPS[u], done = P.ups[u]; return '<button class="opt' + (cur.up === u ? ' on' : '') + '" data-act="sub" data-key="' + key + '" data-f="up.up" data-v="' + u + '"' + (done ? ' disabled' : '') + '>' + IC(U.top) + '<b>' + D.TOP[U.top].n + ': ' + U.n + '</b><small>' + (done ? 'già fatto' : 'diventa ' + U.s) + '</small></button>'; }).join('') + '</div>' +
    '<h4>2. Quale azione in basso costa meno</h4><div class="opts">' + D.BOTTOM.map(function (b, c) { var cost = m.cost[c] - P.red[c], min = c >= 0 && P.red[c] >= m.cost[c] - m.min[c]; return '<button class="opt' + (+cur.col === c && cur.col != null ? ' on' : '') + '" data-act="sub" data-key="' + key + '" data-f="up.col" data-v="' + c + '"' + (min ? ' disabled' : '') + '>' + IC(b.k) + '<b>' + b.n + '</b><small>' + (min ? 'già al minimo (' + cost + ')' : cost + ' → ' + (cost - 1) + ' ' + D.RES[b.res].n) + '</small></button>'; }).join('') + '</div>';
}
function enlistOpts(g, me, cur, key) {
  var P = g.players[me];
  return '<h4>1. Quale recluta (bonus ogni volta che tu o i vicini fate l’azione)</h4><div class="opts">' + D.BOTTOM.map(function (b, c) { var used = P.recruits.indexOf(c) >= 0; return '<button class="opt' + (+cur.col === c && cur.col != null ? ' on' : '') + '" data-act="sub" data-key="' + key + '" data-f="en.col" data-v="' + c + '"' + (used ? ' disabled' : '') + '>' + IC(b.k) + '<b>' + b.n + ' → ' + D.ONGOING[c].n + '</b><small>' + (used ? 'già arruolata' : 'ogni volta che tu o i vicini fate ' + b.n) + '</small></button>'; }).join('') + '</div>' +
    '<h4>2. Bonus immediato</h4><div class="opts">' + D.ONCE_ORDER.map(function (o) { var used = P.once.indexOf(o) >= 0; return '<button class="opt' + (cur.once === o ? ' on' : '') + '" data-act="sub" data-key="' + key + '" data-f="en.once" data-v="' + o + '"' + (used ? ' disabled' : '') + '><b>' + D.ONCE[o].n + '</b>' + (used ? '<small>già preso</small>' : '') + '</button>'; }).join('') + '</div>';
}

function sheetBody(s) {
  var g = G(), me = myIdx(), P = g && me >= 0 ? g.players[me] : null;
  if (s.kind === 'rules') return '<h2>Come si gioca</h2>' + RU.toc() + RU.html(s.focus) + closeBtn('Ho capito');
  if (s.kind === 'help') return RU.section(s.r) + '<button class="btn ghost small" data-act="rules">Tutte le regole</button>' + closeBtn('Ho capito');
  if (s.kind === 'factions') return '<h2>Le fazioni</h2>' + RU.section('factions') + closeBtn();
  if (s.kind === 'menu' && App.doc) {
    var d = App.doc;
    return '<h2>Tavolo ' + esc(d.code) + '</h2><div style="display:grid;gap:8px">' +
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="log">Tutte le mosse della partita</button>' +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi la partita e torna alla sala d’attesa</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', la partita in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Le mosse della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = typeof l.k === 'number' && g.players[l.k] ? ' fc-l-' + g.players[l.k].fac : ''; return '<div class="fl' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'hex') return hexBody(g, s.k);
  if (s.kind === 'player' || s.kind === 'faction') return playerBody(g, s.p, me, s.intro);
  if (s.kind === 'objectives' && P) {
    var can = E.canObjective(g, me);
    return '<h2>I tuoi obiettivi</h2><p class="lead">Sono segreti. Quando la condizione è vera, puoi rivelarne uno all’inizio o alla fine del tuo turno e prendi una stella' + (E.has(g, me, 'dominate') ? ' (tu puoi completarli entrambi)' : '; l’altro viene scartato') + '.</p><div class="objs">' +
      P.obj.map(function (id) { var o = D.OBJECTIVES[id], done = P.objDone.indexOf(id) >= 0, met = E.objectiveMet(g, me, id); return '<div class="objc' + (done ? ' done' : met ? ' met' : '') + '">' + IC('objective') + '<div><b>' + esc(o.n) + '</b><p>' + esc(o.d) + '</p><small>' + (done ? '✓ Completato' : met ? 'Condizione vera adesso!' : 'Non ancora') + '</small></div>' + (can.indexOf(id) >= 0 ? '<button class="btn gold" data-act="claim" data-id="' + id + '">Completa</button>' : '') + '</div>'; }).join('') +
      '</div>' + (!can.length && P.obj.some(function (id) { return E.objectiveMet(g, me, id) && P.objDone.indexOf(id) < 0; }) ? '<p class="muted">Puoi completarlo durante il tuo turno, prima di scegliere la colonna o dopo l’azione in alto.</p>' : '') + closeBtn();
  }
  if (s.kind === 'combat') return combatBody(g, me, s);
  if (s.kind === 'reveal') return revealBody(g);
  if (s.kind === 'enc') return encBody(g, me, s);
  if (s.kind === 'factory' && g.pend && g.pend.k === 'factory' && g.pend.p === me) {
    return '<h2>' + IC('factory') + ' La Fabbrica</h2><p class="lead">Scegli una carta: diventa la tua <b>quinta colonna</b>. In alto ha un’azione speciale; in basso puoi sempre spostare 1 unità fino a 2 territori.</p><div class="opts">' +
      g.pend.ids.map(function (id) { var c = D.FACTORY[id]; return '<button class="opt fcard" data-act="pickfactory" data-id="' + id + '">' + IC('factory') + '<b>' + esc(c.n) + '</b><span class="cg">' + costChips(c.cost) + ' → ' + gainChips(c.gain) + '</span><small>' + esc(c.d) + '</small></button>'; }).join('') + '</div>';
  }
  if (!P) return '';
  if (s.kind === 'trade') {
    var hs = Object.keys(Game.workerHexes(g, me)); if (!s.hex || hs.indexOf(s.hex) < 0) s.hex = hs[0];
    var tot = 0; for (var r in s.r || {}) tot += s.r[r];
    return '<h2>' + IC('trade') + ' Commercia: 2 risorse</h2><p class="lead">Paghi 1 moneta e scegli 2 risorse qualsiasi (anche uguali).' + (P.st.arm ? ' L’armeria aggiunge +1 potere.' : '') + '</p>' + resPicker('trade', 2, s.r) +
      '<h4>Dove le metti</h4><div class="opts row">' + hs.map(function (k) { return '<button class="chip' + (s.hex === k ? ' on' : '') + '" data-act="tradehex" data-k="' + k + '">' + tname(k) + '</button>'; }).join('') + '</div>' +
      '<button class="btn block" data-act="confirmtrade"' + (tot === 2 ? '' : ' disabled') + '>Commercia</button>' + closeBtn('Indietro');
  }
  if (s.kind === 'upgrade') { s.sub = s.sub || {}; var u = s.sub.up || {}; return '<h2>' + IC('upgrade') + ' Aggiorna</h2><p class="lead">Sposti un cubo dalla parte alta alla parte bassa della plancia: un’azione in alto diventa più forte e un’azione in basso costa 1 risorsa in meno.</p>' + upgradeOpts(g, me, u, 'upgrade') + '<button class="btn block" data-act="confirmupgrade"' + (u.up && u.col != null ? '' : ' disabled') + '>Aggiorna</button>' + closeBtn('Indietro'); }
  if (s.kind === 'enlist') { s.sub = s.sub || {}; var en = s.sub.en || {}; return '<h2>' + IC('enlist') + ' Arruola</h2><p class="lead">Una recluta ti dà subito un bonus e poi un piccolo premio ogni volta che tu o i tuoi vicini di tavolo fate quell’azione in basso.</p>' + enlistOpts(g, me, en, 'enlist') + '<button class="btn block" data-act="confirmenlist"' + (en.col != null && en.once ? '' : ' disabled') + '>Arruola</button>' + closeBtn('Indietro'); }
  if (s.kind === 'deploy') return '<h2>' + IC('deploy') + ' Schiera un mech</h2><p class="lead">Ogni mech sblocca un’abilità che vale per tutti i tuoi mech e per il personaggio. Poi scegli sulla mappa dove metterlo (dove hai un lavoratore).</p><div class="opts">' +
    F[P.fac].mechs.map(function (m, i) { var used = P.mechs.indexOf(i) >= 0; return '<button class="opt" data-act="pickmech" data-v="' + i + '"' + (used ? ' disabled' : '') + '><b>' + m.n + '</b><small>' + m.d + '</small>' + (used ? '<em>già schierato</em>' : '') + '</button>'; }).join('') + '</div>' + closeBtn('Indietro');
  if (s.kind === 'build') return '<h2>' + IC('build') + ' Costruisci</h2><p class="lead">Ogni struttura potenzia l’azione in alto della sua colonna. Poi scegli sulla mappa dove costruirla (dove hai un lavoratore, una per territorio).</p><div class="opts">' +
    Object.keys(D.STRUCTS).map(function (k) { var used = !!P.st[k]; return '<button class="opt" data-act="pickstruct" data-v="' + k + '"' + (used ? ' disabled' : '') + '>' + IC(k) + '<b>' + D.STRUCTS[k].n + '</b><small>' + D.STRUCTS[k].d + '</small>' + (used ? '<em>già costruito</em>' : '') + '</button>'; }).join('') + '</div>' + closeBtn('Indietro');
  if (s.kind === 'facsub') { var fc = D.FACTORY[P.fcard]; s.sub = s.sub || {}; return '<h2>' + esc(fc.n) + '</h2><p class="lead">' + esc(fc.d) + '</p>' + subPicker(g, me, fc.gain, 'facsub', s.sub) + '<button class="btn block" data-act="confirmfacsub">Conferma</button>' + closeBtn('Indietro'); }
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}

/* ---------- territorio ---------- */
function hexBody(g, k) {
  var H = E.HEX[k], T = D.TERR[H.t], c = E.controller(g, k), us = E.unitsAt(g, k), st = E.structAt(g, k), r = g.res[k];
  var tags = [];
  if (H.tun) tags.push(IC('tunnel') + ' Galleria: collegata a tutte le altre');
  if (g.enc.indexOf(k) >= 0) tags.push('Segnalino incontro: il personaggio che si ferma qui lo risolve');
  if (H.riv.length) tags.push(IC('river') + ' Fiume su ' + H.riv.length + (H.riv.length === 1 ? ' lato' : ' lati'));
  if (H.base) tags.push(F[H.base] ? 'Base di ' + F[H.base].n + (g.players.some(function (P) { return P.fac === H.base; }) ? '' : ' (fazione assente)') : 'Base di una fazione delle espansioni (non usata)');
  var who = c >= 0 ? 'Controllato da ' + fname(g, c) : c === -2 ? 'Conteso: battaglia in corso' : H.t === 'H' ? '' : 'Nessuno lo controlla';
  var units = {}; us.forEach(function (u) { var key = u.p + u.k; units[key] = (units[key] || 0) + 1; });
  var ul = Object.keys(units).map(function (key) { var p = +key[0], k2 = key.slice(1); return '<span class="gc">' + units[key] + ' ' + (k2 === 'C' ? F[g.players[p].fac].hero : k2 === 'M' ? (units[key] === 1 ? 'mech' : 'mech') : (units[key] === 1 ? 'lavoratore' : 'lavoratori')) + ' di ' + esc(g.players[p].nick) + '</span>'; }).join('');
  return '<h2>' + (H.t === 'H' ? 'Base' : T.n) + '</h2><p class="lead">' + T.d + '.' + (H.t === 'X' ? ' Il primo personaggio di ogni giocatore che ci arriva sceglie una carta Fabbrica.' : '') + '</p>' +
    (who ? '<p>' + who + '</p>' : '') + (ul ? '<div class="tags">' + ul + '</div>' : '') + (st ? '<p>' + IC(st.s) + ' ' + D.STRUCTS[st.s].n + ' di ' + fname(g, st.p) + ': ' + D.STRUCTS[st.s].d + '</p>' : '') +
    (r && (r.f + r.m + r.w + r.o) ? '<p>Risorse qui: ' + resIcons(r) + '</p>' : '') + (tags.length ? '<ul class="hx">' + tags.map(function (t) { return '<li>' + t + '</li>'; }).join('') + '</ul>' : '') + closeBtn();
}

/* ---------- scheda giocatore / fazione ---------- */
function playerBody(g, p, me, intro) {
  var P = g.players[p], f = F[P.fac], m = D.MATS[P.mat], mine = p === me;
  var stars = P.stars.length ? P.stars.map(function (s) { return '<span class="gc">' + IC('star') + D.STARS[s].n + '</span>'; }).join('') : '<span class="muted">Nessuna stella, per ora.</span>';
  var abil = '<div class="abil"><div class="ab on"><b>' + f.ab.n + '</b><small>' + f.ab.d + '</small></div>' + f.mechs.map(function (mm, i) { var on = P.mechs.indexOf(i) >= 0; return '<div class="ab' + (on ? ' on' : '') + '"><b>' + (on ? '✓ ' : '') + mm.n + '</b><small>' + mm.d + '</small>' + (on ? '' : '<em>si sblocca schierando un mech</em>') + '</div>'; }).join('') + '</div>';
  var counts = '<div class="tags"><span class="gc">' + IC('coin') + P.coins + ' monete</span><span class="gc">' + IC('power') + P.power + ' potere</span><span class="gc">' + IC('pop') + P.pop + ' popolarità</span><span class="gc">' + IC('card') + P.hand.length + ' carte</span>' +
    '<span class="gc">' + IC('worker') + E.workersOnBoard(g, p) + '/8 lavoratori</span><span class="gc">' + IC('mech') + P.mechs.length + '/4 mech</span><span class="gc">' + IC('build') + E.structCount(P) + '/4 strutture</span><span class="gc">' + IC('upgrade') + E.upCount(P) + '/6 aggiornamenti</span><span class="gc">' + IC('enlist') + P.recruits.length + '/4 reclute</span>' +
    (P.fcard != null ? '<span class="gc">' + IC('factory') + esc(D.FACTORY[P.fcard].n) + '</span>' : '') + '</div>';
  var intro1 = intro ? '<p class="lead"><b>Questa è la tua fazione.</b> Le regole per tutti sono le stesse: cambiano l’abilità speciale, le abilità dei mech e la plancia. Tocca il ? in basso quando hai un dubbio: ogni azione ha la sua spiegazione.</p>' : '';
  var objs = mine ? '<p>' + IC('objective') + ' Obiettivi segreti: ' + P.obj.map(function (id) { return '<b>' + esc(D.OBJECTIVES[id].n) + '</b> (' + esc(D.OBJECTIVES[id].d) + ')'; }).join(' · ') + '</p>' : '<p class="muted">' + P.obj.length + ' obiettivi segreti' + (P.objDone.length ? ', ' + P.objDone.length + ' completati' : '') + '.</p>';
  return '<div class="phead">' + ART.portrait(P.fac, 92) + '<div><div class="kicker">' + esc(P.nick) + (mine ? ' · tu' : '') + '</div><h2 class="fc-' + P.fac + '">' + f.n + '</h2><p>' + f.heroFull + ' · plancia ' + m.n.toLowerCase() + ' (n. ' + P.mat + ')</p></div></div>' + intro1 +
    '<h4>Stelle (' + P.stars.length + '/6)</h4><div class="tags">' + stars + '</div>' + counts + '<h4>Abilità</h4>' + abil + objs +
    (App.doc.host === Net.uid && !mine && g.phase === 'play' ? '<button class="btn ghost block" data-act="auto" data-p="' + p + '">' + (P.bot ? 'Ridai il controllo al giocatore' : 'Fallo giocare in automatico (se è assente)') + '</button>' : '') + closeBtn(intro ? 'Iniziamo!' : 'Chiudi');
}

/* ---------- battaglia ---------- */
function combatBody(g, me, s) {
  var c = g.pend; if (!c || c.k !== 'combat') return '';
  var side = c.a === me ? 'a' : c.d === me ? 'd' : null; if (!side) return '';
  if (c.pick[side]) return '<h2>⚔ Battaglia</h2><p class="lead">Hai scelto. Aspetto la scelta di ' + fname(g, side === 'a' ? c.d : c.a) + '…</p>' + closeBtn('Guarda la mappa');
  var op = side === 'a' ? c.d : c.a, P = g.players[me], O = g.players[op];
  var maxD = E.maxDial(g, me), maxC = E.maxCards(g, me, c.h);
  if (s.pw == null) s.pw = Math.min(maxD, Math.max(0, Math.ceil(maxD / 2))); if (!s.sel) s.sel = [];
  var total = s.pw + s.sel.reduce(function (a, i) { return a + P.hand[i]; }, 0);
  var units = function (p) { return E.unitsAt(g, c.h).filter(function (u) { return u.p === p; }).map(function (u) { return u.k === 'C' ? IC('hero') : u.k === 'M' ? IC('mech') : IC('worker'); }).join(''); };
  return '<h2>⚔ Battaglia in ' + tname(c.h).toLowerCase() + '</h2>' +
    '<div class="vs"><div class="side">' + ART.portrait(P.fac, 64) + '<b>Tu</b><span class="fc-' + P.fac + '">' + units(me) + '</span><small>' + (side === 'a' ? 'attacchi: in pareggio vinci tu' : 'difendi') + '</small></div><div class="vsx">contro</div>' +
    '<div class="side">' + ART.portrait(O.fac, 64) + '<b>' + esc(O.nick) + '</b><span class="fc-' + O.fac + '">' + units(op) + '</span><small>ha ' + O.power + ' potere e ' + O.hand.length + ' carte; può usarne fino a ' + E.maxCards(g, op, c.h) + '</small></div></div>' +
    (c.pre.length ? '<div class="pre">' + c.pre.map(function (t) { return '<p>' + esc(t) + '</p>'; }).join('') + '</div>' : '') +
    '<h4>' + IC('power') + ' Quanto potere usi? (hai ' + P.power + ', massimo ' + maxD + ')</h4><div class="dial"><button class="zb" data-act="dial" data-d="-1"' + (s.pw > 0 ? '' : ' disabled') + '>−</button><b class="dv">' + s.pw + '</b><button class="zb" data-act="dial" data-d="1"' + (s.pw < maxD ? '' : ' disabled') + '>+</button><input type="range" id="dialr" min="0" max="' + maxD + '" value="' + s.pw + '" aria-label="Potere"></div>' +
    '<h4>' + IC('card') + ' Carte combattimento (al massimo ' + maxC + ': una per personaggio o mech' + (E.has(g, me, 'militia') ? ', +1 per la Milizia' : '') + ')</h4>' +
    (P.hand.length ? '<div class="hand">' + P.hand.map(function (v, i) { var on = s.sel.indexOf(i) >= 0; return '<button class="hc' + (on ? ' on' : '') + '" data-act="cbcard" data-i="' + i + '"' + (!on && s.sel.length >= maxC ? ' disabled' : '') + '>' + ART.cardFace(v) + '</button>'; }).join('') + '</div>' : '<p class="muted">Non hai carte combattimento.</p>') +
    '<div class="ctot">Totale: <b>' + total + '</b></div><p class="muted">Il potere usato si perde comunque, anche se vinci. Chi perde torna alla base con tutte le pedine di quel territorio.</p>' +
    '<button class="btn block" data-act="cbok">Conferma in segreto</button><button class="btn ghost small" data-act="help" data-r="combat">Come funzionano le battaglie?</button>';
}
function revealBody(g) {
  var c = g.lastCombat; if (!c) return '';
  var side = function (p, pk, t, w) { var P = g.players[p]; return '<div class="side' + (w ? ' win' : ' lose') + '">' + ART.portrait(P.fac, 64) + '<b>' + esc(P.nick) + '</b><div class="rv">' + IC('power') + '<span>' + pk.power + '</span>' + pk.cards.map(function (v) { return ART.cardFace(v); }).join('') + '</div><div class="rt" data-t="' + t + '">0</div>' + (w ? '<em>vince</em>' : '<em>torna alla base</em>') + '</div>'; };
  return '<h2>⚔ Battaglia in ' + tname(c.h).toLowerCase() + '</h2><div class="vs reveal">' + side(c.a, c.pa, c.ta, c.win === c.a) + '<div class="vsx">contro</div>' + side(c.d, c.pd, c.td, c.win === c.d) + '</div>' +
    '<p class="lead">' + fname(g, c.win) + ' vince ' + (c.win === c.a ? '(chi attacca vince anche in pareggio) ' : '') + 'e prende una stella se ne ha ancora a disposizione.' + (c.popLoss ? ' ' + fname(g, c.a) + ' perde ' + c.popLoss + ' popolarità per i lavoratori cacciati.' : '') + '</p>' + closeBtn('Continua');
}
function animateReveal() {
  document.querySelectorAll('.sh-reveal .rt').forEach(function (e) { var t = +e.getAttribute('data-t'), i = 0; var iv = setInterval(function () { e.textContent = ++i > t ? t : i; if (i >= t) clearInterval(iv); }, 70); });
}

/* ---------- incontro ---------- */
function encBody(g, me, s) {
  var e = g.pend; if (!e || e.k !== 'enc' || e.p !== me) return '';
  var card = D.ENCOUNTERS[e.card], P = g.players[me]; s.sel = s.sel || []; s.sub = s.sub || {};
  var art = '<div class="encart"><canvas id="enccv" width="10" height="10"></canvas><div class="encn"><b>' + esc(card.n) + '</b></div></div>';
  setTimeout(paintEncounter, 0);
  var opts = card.o.map(function (o, i) {
    var can = E.canPay(g, me, o.cost), on = s.sel.indexOf(i) >= 0, why = !can ? 'Non puoi pagare' : '';
    if (can && o.gain.mech && P.mechs.length >= 4) why = 'Hai già tutti i mech'; if (can && o.gain.st && (E.structCount(P) >= 4 || E.structAt(g, e.h))) why = E.structAt(g, e.h) ? 'Qui c’è già una struttura' : 'Hai già tutte le strutture';
    if (can && o.gain.up && E.upCount(P) >= 6) why = 'Hai già tutti gli aggiornamenti'; if (can && o.gain.en && P.recruits.length >= 4) why = 'Hai già tutte le reclute';
    return '<button class="opt enco' + (on ? ' on' : '') + '" data-act="encopt" data-i="' + i + '"' + (why ? ' disabled' : '') + '><span class="en-n">' + ['Gentile', 'Generoso', 'Prepotente'][i] + '</span><b>' + esc(o.t) + '</b><span class="cg">' + costChips(o.cost) + ' → ' + gainChips(o.gain) + '</span>' + (why ? '<em>' + why + '</em>' : '') + '</button>';
  }).join('');
  var subs = s.sel.map(function (i, k) { var gain = card.o[i].gain; var h = subPicker(g, me, gain, 'enc' + k, s.sub[k] || (s.sub[k] = {}), e.h); return h ? '<div class="subbox"><b>Per «' + esc(card.o[i].t) + '»</b>' + h + '</div>' : ''; }).join('');
  return '<h2>Incontro</h2>' + art + '<p class="lead"><i>' + esc(card.t) + '</i></p><p class="muted">' + (e.max === 2 ? 'Con la Diplomazia puoi scegliere <b>fino a 2 opzioni</b>.' : 'Scegli una opzione.') + ' Quello che guadagni arriva in ' + tname(e.h).toLowerCase() + '.</p><div class="opts">' + opts + '</div>' + subs +
    '<button class="btn block" data-act="encok"' + (s.sel.length ? '' : ' disabled') + '>Conferma</button>';
}
function paintEncounter() {
  var cv = document.getElementById('enccv'), g = G(); if (!cv || !g || !g.pend || g.pend.k !== 'enc') return;
  var H = E.HEX[g.pend.h], cell = [H.c, H.r, H.t, 0, 0, '', []], tmp = document.createElement('canvas');
  Terrain.paintMap(tmp, [cell], { scale: 2, R: 160 });
  var w = cv.parentNode.clientWidth || 300, h = Math.round(w * 0.42);
  cv.width = w * 2; cv.height = h * 2; cv.style.width = w + 'px'; cv.style.height = h + 'px';
  var ctx = cv.getContext('2d'), sw = tmp.width * 0.62, sh = sw * h / w;
  ctx.drawImage(tmp, (tmp.width - sw) / 2, (tmp.height - sh) / 2, sw, sh, 0, 0, cv.width, cv.height);
}

/* ---------- fine partita ---------- */
function overBody(g, me) {
  var rows = g.final.map(function (x, i) {
    var P = g.players[x.p];
    return '<tr class="' + (i === 0 ? 'win' : '') + '"><td>' + (i + 1) + '</td><td class="pl">' + ART.portrait(P.fac, 28) + '<b>' + esc(P.nick) + '</b></td><td>' + x.coins + '</td><td title="' + x.stars + ' stelle × ' + x.tier.star + '">' + x.starC + '<small>' + x.stars + '×' + x.tier.star + '</small></td>' +
      '<td title="' + x.terr + ' territori × ' + x.tier.terr + '">' + x.terrC + '<small>' + x.terr + '×' + x.tier.terr + '</small></td><td title="' + x.res + ' risorse">' + x.resC + '<small>' + Math.floor(x.res / 2) + '×' + x.tier.res + '</small></td><td>' + x.bonusC + '</td><td class="tot">' + x.total + '</td></tr>';
  }).join('');
  var W = g.players[g.winner], B = D.BONUS[g.bonus];
  return '<div class="over"><div class="crown">' + ART.portrait(W.fac, 100) + '</div><h2>' + (g.winner === me ? 'Hai vinto!' : 'Vince ' + esc(W.nick)) + '</h2><p class="lead">' + F[W.fac].n + ' chiude con ' + g.final[0].total + ' monete.</p>' +
    '<div class="tscroll"><table class="score"><tr><th></th><th>Giocatore</th><th>' + IC('coin') + '</th><th>' + IC('star') + '</th><th>Terr.</th><th>Risorse</th><th>Bonus</th><th>Totale</th></tr>' + rows + '</table></div>' +
    '<p class="muted">Stelle, territori e coppie di risorse valgono di più con più popolarità (0–6, 7–12, 13–18). Bonus delle strutture: «' + esc(B.n) + '» — ' + esc(B.d) + '.</p>' +
    (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Nuova partita con lo stesso tavolo</button>' : '<p class="lead">L’host può avviare una nuova partita.</p>') + closeBtn('Guarda la mappa') + '</div>';
}

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet;
  switch (a) {
    case 'sheetback': if (ev.target === el && s && ['combat', 'enc', 'factory'].indexOf(s.kind) < 0) { App.sheet = null; renderSheet(); } return;
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r'), back: s }; renderSheet(); break;
    case 'factions': App.sheet = { kind: 'factions' }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'close': if (s && s.kind === 'help' && s.back) { App.sheet = s.back; } else App.sheet = null; renderSheet(); if (g) Game.render(); break;
    case 'leave': App.sheet = null; leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'addbot': send({ t: 'addbot' }); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; App.introShown = false; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; renderSheet(); Net.takeHost(); toast('Ora sei tu a reggere il tavolo e a muovere i giocatori automatici.'); break;
    case 'auto': App.sheet = null; renderSheet(); send({ t: 'auto', p: +el.getAttribute('data-p'), on: !g.players[+el.getAttribute('data-p')].bot }); break;
    case 'resume': send({ t: 'back' }); break;
    case 'player': App.sheet = { kind: 'player', p: +el.getAttribute('data-p') }; renderSheet(); break;
    case 'objectives': App.sheet = { kind: 'objectives' }; renderSheet(); break;
    case 'claim': App.sheet = null; renderSheet(); act({ a: 'objective', id: +el.getAttribute('data-id') }); break;
    case 'togglemat': App.matOpen = !App.matOpen; lsSet('ca-mat', App.matOpen ? '1' : '0'); Game.render(); break;
    case 'zin': Board.zoomAt(1.3); break;
    case 'zout': Board.zoomAt(1 / 1.3); break;
    case 'zfit': Board.fit(); break;
    // scelta della colonna
    case 'col': {
      if (!g || !g.ts || g.ts.p !== me || g.ts.stage !== 'pick' || g.pend) { if (g && g.ts && g.ts.p === me) return; toast('Puoi scegliere la colonna quando è il tuo turno.'); return; }
      var col = +el.getAttribute('data-col');
      if (!E.colAllowed(g, me, col)) { toast(col === g.players[me].last ? 'Hai usato questa colonna nel turno scorso: scegline un’altra.' : 'Colonna non disponibile.'); return; }
      act({ a: 'col', col: col }); break;
    }
    // azioni in alto
    case 'skiptop': act({ a: 'skip' }); break;
    case 'movecoins': act({ a: 'move', coins: true }); break;
    case 'desel': if (App.plan) { App.plan.sel = null; Game.render(); } break;
    case 'carry': if (App.plan) { App.plan.carry = Math.max(0, App.plan.carry + +el.getAttribute('data-d')); var mu = App.plan._sim && E.unit(App.plan._sim, App.plan.sel); if (mu) { var wn = E.myUnits(App.plan._sim, me, 'W').filter(function (w) { return w.h === mu.h && App.plan._moved.indexOf(w.id) < 0; }).length; App.plan.carry = Math.min(App.plan.carry, wn); } Game.render(); } break;
    case 'undomove': if (App.plan) { App.plan.moves.pop(); App.plan.sel = null; Game.render(); } break;
    case 'confirmmove': if (App.plan) act({ a: 'move', moves: App.plan.moves.map(function (m) { return { u: m.u, to: m.to, carry: m.carry, res: m.res }; }) }); break;
    case 'confirmfmove': if (App.plan && App.plan.moves[0]) { var m0 = App.plan.moves[0]; act({ a: 'fmove', move: { u: m0.u, to: m0.to, carry: [], res: m0.res } }); } break;
    case 'confirmproduce': if (App.plan) act({ a: 'produce', hexes: App.plan.hexes.slice() }); break;
    case 'bolster': act({ a: 'bolster', opt: el.getAttribute('data-o') }); break;
    case 'tradePop': act({ a: 'trade', opt: 'pop' }); break;
    case 'tradeRes': App.sheet = { kind: 'trade', r: {} }; renderSheet(); break;
    case 'tradehex': if (s) { s.hex = el.getAttribute('data-k'); renderSheet(); } break;
    case 'rp': { var key = el.getAttribute('data-rp'), r = el.getAttribute('data-r'), d = +el.getAttribute('data-d'); var obj = key === 'trade' ? (s.r = s.r || {}) : key === 'facsub' ? (s.sub.ar = s.sub.ar || {}) : (function () { var k = +key.slice(3); s.sub[k] = s.sub[k] || {}; return (s.sub[k].ar = s.sub[k].ar || {}); })(); obj[r] = Math.max(0, (obj[r] || 0) + d); renderSheet(); break; }
    case 'confirmtrade': { var r2 = {}; for (var x in s.r) if (s.r[x]) r2[x] = s.r[x]; App.sheet = null; renderSheet(); act({ a: 'trade', opt: 'res', r: r2, hex: s.hex }); break; }
    case 'usefactory': { var fc = D.FACTORY[g.players[me].fcard]; if (fc.gain.ar || fc.gain.up) { App.sheet = { kind: 'facsub', sub: {} }; renderSheet(); } else act({ a: 'factory', sub: {} }); break; }
    case 'confirmfacsub': { var sb = s.sub; App.sheet = null; renderSheet(); act({ a: 'factory', sub: sb }); break; }
    // azioni in basso
    case 'endturn': act({ a: 'end' }); break;
    case 'cancelplan': App.plan = null; Game.render(); break;
    case 'bottom': {
      var b = D.BOTTOM[g.ts.col];
      if (b.k === 'upgrade') App.sheet = { kind: 'upgrade', sub: {} };
      else if (b.k === 'enlist') App.sheet = { kind: 'enlist', sub: {} };
      else App.sheet = { kind: b.k };
      renderSheet(); break;
    }
    case 'pickmech': case 'pickstruct': {
      App.sheet = null; renderSheet();
      var k3 = a === 'pickmech' ? 'deploy' : 'build', cand = Object.keys(k3 === 'deploy' ? E.deployHexes(g, me) : E.buildHexes(g, me));
      Game.startPlan(k3, a === 'pickmech' ? { m: +el.getAttribute('data-v') } : { s: el.getAttribute('data-v') });
      if (cand.length === 1) App.plan.hex = cand[0];
      if (!cand.length) { App.plan = null; toast(k3 === 'build' ? 'Non hai territori adatti: serve un tuo lavoratore in un territorio senza strutture (non un lago).' : 'Serve un tuo lavoratore in un territorio (non un lago).'); }
      Game.render(); break;
    }
    case 'confirmplace': { var pl = App.plan; if (!pl) break; act(pl.k === 'deploy' ? { a: 'deploy', m: pl.m, hex: pl.hex, coerce: App.coerce } : { a: 'build', s: pl.s, hex: pl.hex, coerce: App.coerce }); break; }
    case 'sub': {
      var keyS = el.getAttribute('data-key'), f = el.getAttribute('data-f'), v = el.getAttribute('data-v');
      var target = keyS === 'upgrade' || keyS === 'enlist' || keyS === 'facsub' ? s.sub : (s.sub[+keyS.slice(3)] = s.sub[+keyS.slice(3)] || {});
      var parts = f.split('.'); if (parts.length === 2) { target[parts[0]] = target[parts[0]] || {}; target[parts[0]][parts[1]] = parts[1] === 'col' ? +v : v; } else target[f] = f === 'mech' ? +v : v;
      renderSheet(); break;
    }
    case 'confirmupgrade': { var u = s.sub.up; App.sheet = null; renderSheet(); act({ a: 'upgrade', up: u.up, col: u.col, coerce: App.coerce }); break; }
    case 'confirmenlist': { var en = s.sub.en; App.sheet = null; renderSheet(); act({ a: 'enlist', col: en.col, once: en.once, coerce: App.coerce }); break; }
    // battaglia, incontri, Fabbrica
    case 'opencombat': App.sheet = { kind: 'combat' }; renderSheet(); break;
    case 'openenc': App.sheet = { kind: 'enc' }; renderSheet(); break;
    case 'openfactory': App.sheet = { kind: 'factory' }; renderSheet(); break;
    case 'dial': s.pw = Math.max(0, Math.min(E.maxDial(g, me), s.pw + +el.getAttribute('data-d'))); renderSheet(); break;
    case 'cbcard': { var i = +el.getAttribute('data-i'), j = s.sel.indexOf(i); if (j >= 0) s.sel.splice(j, 1); else s.sel.push(i); renderSheet(); break; }
    case 'cbok': { var hand = g.players[me].hand, cards = s.sel.map(function (i) { return hand[i]; }); var pw = s.pw; App.sheet = null; renderSheet(); act({ a: 'combat', power: pw, cards: cards }); break; }
    case 'encopt': { var oi = +el.getAttribute('data-i'), max = g.pend.max, k4 = s.sel.indexOf(oi); if (k4 >= 0) { s.sel.splice(k4, 1); s.sub = {}; } else { if (s.sel.length >= max) s.sel = max === 1 ? [] : s.sel.slice(1); s.sel.push(oi); s.sub = {}; } renderSheet(); break; }
    case 'encok': { var sel = s.sel.slice(), subs = sel.map(function (x, k) { return s.sub[k] || {}; }); App.sheet = null; App.sheetKey = 'en' + g.seq; renderSheet(); act({ a: 'enc', opts: sel, sub: subs }); break; }
    case 'pickfactory': App.sheet = null; renderSheet(); act({ a: 'factory', id: +el.getAttribute('data-id') }); break;
  }
});
document.addEventListener('input', function (ev) {
  if (ev.target.id === 'dialr' && App.sheet && App.sheet.kind === 'combat') { App.sheet.pw = +ev.target.value; var dv = document.querySelector('.dv'); if (dv) dv.textContent = App.sheet.pw; var g = G(), me = myIdx(); var tot = App.sheet.pw + App.sheet.sel.reduce(function (a, i) { return a + g.players[me].hand[i]; }, 0); var ct = document.querySelector('.ctot b'); if (ct) ct.textContent = tot; }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-timer') send({ t: 'opt', timer: +ev.target.value });
  if (ev.target.id === 'opt-ban') send({ t: 'opt', ban: ev.target.value === '1' });
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
  if (ev.target.id === 'coerce') { App.coerce = ev.target.checked; Game.render(); }
  if (ev.target.id === 'dialr') renderSheet();
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Enter' && e.target && e.target.classList && e.target.classList.contains('mcol')) e.target.click();
  if (e.key === 'Escape' && App.sheet && ['combat', 'enc', 'factory'].indexOf(App.sheet.kind) < 0) { App.sheet = null; renderSheet(); }
});

/* ---------- avvio ---------- */
(function boot() {
  App.matOpen = lsGet('ca-mat') !== '0';
  var q = new URLSearchParams(location.search), t = (q.get('t') || '').toUpperCase(), last = lsGet(KEY_TABLE);
  if (/^[A-Z]{4}$/.test(t)) {
    if ((t === last || myNick()) && (!window.Account || Account.allowQuiet())) { App.status = 'Mi siedo al tavolo ' + t + '…'; run(function () { return enterTable(t, myNick() || null); }); }
    else App.inviteCode = t;
  } else if (last && /^[A-Z]{4}$/.test(last)) { App.status = 'Rientro al tavolo ' + last + '…'; run(function () { return enterTable(last, null); }); }
  render();
})();
