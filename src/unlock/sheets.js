/* ===== Unlock!: finestre (lucchetti, macchine, regole, menu, risultato, presentazione) ed eventi ===== */
function renderSheet() {
  var root = $('#sheet'), s = App.sheet;
  if (!s) { root.innerHTML = ''; root._s = null; return; }
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
      '<button class="btn ghost block" data-act="invite">Invita amici al tavolo</button><button class="btn ghost block" data-act="rules">Regole</button><button class="btn ghost block" data-act="intro">Rivedi la presentazione</button><button class="btn ghost block" data-act="log">Il racconto della partita</button>' +
      (g && g.phase === 'play' && me >= 0 ? '<button class="btn ghost block" data-act="pause">' + (g.paused ? 'Fai ripartire il tempo' : 'Metti in pausa il tempo') + '</button>' : '') +
      (d.host !== Net.uid ? '<button class="btn ghost block" data-act="takehost">Prendi il comando del tavolo (se l’host se n’è andato)</button>' : '') +
      (d.host === Net.uid && d.phase !== 'lobby' ? '<button class="btn ghost block" data-act="rematch">Chiudi l’avventura e torna alla scelta</button>' : '') +
      (d.host === Net.uid ? '<button class="btn ghost block" data-act="closetable">Chiudi il tavolo per tutti</button>' : '') +
      '<button class="btn ghost block" data-act="tohome">Vai alla home del gioco (resti seduto)</button><button class="btn ghost block" data-act="leave">Esci dal tavolo</button></div>' + closeBtn();
  }
  if (s.kind === 'closeconfirm' && App.doc) return '<h2>Chiudere il tavolo ' + esc(App.doc.code) + '?</h2><p class="lead">Il tavolo sparisce dalla lista' + (App.doc.game && App.doc.phase === 'play' ? ', l’avventura in corso finisce' : '') + ' e tutti tornano alla schermata iniziale. Non si può annullare.</p>' +
    '<button class="btn block red" data-act="closeyes">Chiudi per tutti</button>' + closeBtn('Annulla');
  if (s.kind === 'intro') return introBody(s);
  if (!g) return '';
  if (s.kind === 'log') return '<h2>Il racconto della partita</h2><div class="loglist">' + g.log.slice().reverse().map(function (l) { var c = l.p != null && g.players[l.p] ? PCOL[g.players[l.p].col % PCOL.length] : 'rgba(255,207,90,.45)'; return '<div class="fl k-' + l.k + '" style="border-left-color:' + c + '">' + esc(l.t) + '</div>'; }).join('') + '</div>' + closeBtn();
  if (s.kind === 'gone') { var gs = E.gone(g); return '<h2>Carte scartate</h2>' + (gs.length ? '<p class="lead">Non servono più, ma puoi rileggerle.</p><div class="tgrid small">' + gs.map(function (id) { return '<button class="tc" data-act="open" data-id="' + id + '">' + Game.thumb(id) + '</button>'; }).join('') + '</div>' : '<p class="lead">Ancora nessuna carta scartata.</p>') + closeBtn(); }
  if (s.kind === 'hints') {
    var ids = Object.keys(g.hints);
    return '<h2>' + IC('hint') + ' Indizi</h2><p class="lead">Per chiedere un indizio apri una carta e tocca <b>Chiedi un indizio</b>. Non costano tempo, ma tolgono stelle: ' + g.hintN + (g.hintN === 1 ? ' usato' : ' usati') + ' finora.</p>' +
      (ids.length ? '<div class="vw-hints">' + ids.map(function (id) { var c = E.card(g, id); return '<div class="hint h' + g.hints[id] + '"><b>' + esc(id) + ' · ' + esc(c.t) + '</b>' + c.h[0] + (g.hints[id] > 1 ? '<br><i>' + c.h[1] + '</i>' : '') + '</div>'; }).join('') + '</div>' : '') + closeBtn();
  }
  if (s.kind === 'code') return codeBody(g, s);
  if (s.kind === 'mac') return macBody(g, s);
  if (s.kind === 'over' && g.phase === 'over') return overBody(g, me);
  return '';
}

/* ---------- lucchetti (carte gialle) ---------- */
function lcd(v, s) { var d = ''; for (var i = 0; i < 4; i++) d += '<span class="' + (i < v.length ? 'on' : '') + '">' + (v.charAt(i) || '•') + '</span>'; return d; }
function codeBody(g, s) {
  var c = E.card(g, s.id); if (!c || !E.onTable(g, s.id) || E.seen(g, c.code.to)) return '';
  var off = c.code.need && !E.seen(g, c.code.need), err = s.err && Date.now() - s.err < 1500;
  var keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', 'del', '0', 'ok'].map(function (k) {
    return k === 'del' ? '<button class="kk fn" data-act="kpdel" aria-label="Cancella">⌫</button>' : k === 'ok' ? '<button class="kk go" data-act="kpok" aria-label="Conferma"' + (off ? ' disabled' : '') + '>✓</button>' : '<button class="kk" data-act="kp" data-k="' + k + '">' + k + '</button>';
  }).join('');
  return '<div class="kp' + (err ? ' err' : '') + (off ? ' off' : '') + '"><div class="kp-head"><span class="kp-n">' + esc(s.id) + '</span><b>' + esc(c.t) + '</b></div>' +
    '<div class="kp-lcd" id="kp-lcd">' + (off ? '<em>SPENTO</em>' : err ? '<em>ERRORE</em>' : lcd(App.codeIn)) + '</div>' +
    (off ? '<p class="kp-msg">' + esc(c.code.needMsg || 'Non funziona ancora.') + '</p>' : '<p class="kp-msg">4 cifre · un codice sbagliato costa <b>2 minuti</b></p>') +
    '<div class="kp-keys">' + keys + '</div></div>' + closeBtn('Chiudi');
}
function paintLcd() { var e = document.getElementById('kp-lcd'); if (e) e.innerHTML = lcd(App.codeIn); }

/* ---------- macchine (carte verdi) ---------- */
function dialSVG(i, v, col) {
  var ticks = '', k;
  for (k = 0; k <= 9; k++) { var a = (-225 + k * 30) * Math.PI / 180; ticks += '<text x="' + (50 + Math.cos(a) * 25).toFixed(1) + '" y="' + (44 + Math.sin(a) * 25 + 3).toFixed(1) + '" text-anchor="middle" font-size="8" font-weight="700" fill="#2a2a2a" font-family="Share Tech Mono,monospace">' + k + '</text>'; }
  return '<svg viewBox="0 0 100 160" class="dial"><circle cx="50" cy="44" r="36" fill="url(#u-brass)"/><circle cx="50" cy="44" r="32" fill="#f3eee0"/>' + ticks +
    '<g class="ndl" id="ndl' + i + '" style="transform:rotate(' + (-135 + v * 30) + 'deg);transform-origin:50px 44px"><path d="M50 44L48 40L50 16L52 40Z" fill="' + col + '" stroke="#222" stroke-width=".6"/></g><circle cx="50" cy="44" r="4" fill="#222"/>' +
    '<rect x="46" y="78" width="8" height="22" fill="url(#u-pipeV)"/><g class="whl" id="whl' + i + '" data-act="dial" data-i="' + i + '" data-d="1" style="transform:rotate(' + v * 40 + 'deg);transform-origin:50px 122px;cursor:pointer">' + ART.wheel(50, 122, 28, col) + '</g></svg>';
}
function macBody(g, s) {
  var c = E.card(g, s.id); if (!c || !E.onTable(g, s.id) || !c.mac) return '';
  var m = c.mac, off = m.need && !E.seen(g, m.need), err = s.err && Date.now() - s.err < 1600, body = '';
  if (!App.mac || App.mac.id !== s.id) App.mac = { id: s.id, v: m.type === 'dials' ? m.labels.map(function () { return 0; }) : m.type === 'choice' ? null : '' };
  var V = App.mac.v;
  if (m.type === 'dials') {
    body = '<div class="dials">' + m.labels.map(function (l, i) { return '<div class="dcol" style="--dc:' + m.cols[i] + '">' + dialSVG(i, V[i], m.cols[i]) + '<div class="drow"><button class="kk sm" data-act="dial" data-i="' + i + '" data-d="-1" aria-label="' + l + ' meno">−</button><b id="dv' + i + '">' + V[i] + '</b><button class="kk sm" data-act="dial" data-i="' + i + '" data-d="1" aria-label="' + l + ' più">+</button></div><span class="dlab">' + l + '</span></div>'; }).join('') + '</div>' +
      '<p class="kp-msg">Gira i volantini (tocca la ruota o i tasti) fino alla pressione giusta, poi avvia.</p><button class="btn block green" data-act="mgo"' + (off ? ' disabled' : '') + '>' + IC('gear') + ' Avvia</button>';
  } else if (m.type === 'morse') {
    body = '<div class="mz"><div class="mz-tape" id="mz-tape">' + tape(V, m) + '</div>' +
      '<div class="mz-keys"><button class="kk mz-k" data-act="mz" data-k="." aria-label="Punto">•</button><button class="kk mz-k" data-act="mz" data-k="-" aria-label="Linea">—</button><button class="kk fn" data-act="mz" data-k=" ">fine lettera</button><button class="kk fn" data-act="mzdel" aria-label="Cancella">⌫</button></div>' +
      '<button class="tkey" id="tkey" aria-label="Tasto del telegrafo: tocco breve punto, pressione lunga linea"><span></span></button><p class="kp-msg">Premi i tasti, oppure usa il tasto del telegrafo: <b>breve</b> = punto, <b>lungo</b> = linea. Tra una lettera e l’altra tocca «fine lettera».</p></div>' +
      '<button class="btn block green" data-act="mgo"' + (off ? ' disabled' : '') + '>' + IC('ping') + ' Trasmetti</button>';
  } else if (m.type === 'choice') {
    body = '<div class="turn' + (V ? ' spin s' + V : '') + '"><div class="disc"></div></div><div class="chs">' + m.opts.map(function (o) { return '<button class="chb' + (V === o ? ' on' : '') + '" data-act="mopt" data-v="' + o + '"><b>' + o + '</b><span>' + m.unit + '</span></button>'; }).join('') + '</div>' +
      '<p class="kp-msg">' + esc(m.label || '') + '</p><button class="btn block green" data-act="mgo"' + (off || !V ? ' disabled' : '') + '>' + IC('play') + ' Fai partire</button>';
  }
  return '<div class="mac' + (err ? ' err' : '') + (s.ok ? ' ok' : '') + (off ? ' off' : '') + '"><div class="kp-head"><span class="kp-n g">' + esc(s.id) + '</span><b>' + esc(c.t) + '</b></div>' +
    (off ? '<div class="mac-off">' + esc(m.needMsg || 'Non funziona ancora.') + '</div>' : '') + (err ? '<div class="mac-err">Non succede niente… (−1 min)</div>' : '') + (s.ok ? '<div class="mac-ok">Funziona!</div>' : '') + body + '</div>' + closeBtn('Chiudi');
}
function tape(v, m) {
  var tbl = {}; (m.table || []).forEach(function (r) { tbl[r[1]] = r[0]; });
  var gs = v.split(' ');
  if (!v) return '<span class="mz-empty">il messaggio da trasmettere</span>';
  return gs.map(function (gr, i) { return '<span class="mz-g' + (i === gs.length - 1 ? ' cur' : '') + '"><b>' + (gr ? gr.replace(/\./g, '•').replace(/-/g, '—') : '&nbsp;') + '</b><i>' + (gr ? tbl[gr] || '?' : '') + '</i></span>'; }).join('');
}
function paintTape() { var e = document.getElementById('mz-tape'), g = G(); if (e && App.sheet && App.sheet.kind === 'mac') e.innerHTML = tape(App.mac.v, E.card(g, App.sheet.id).mac); }
function mzAdd(k) {
  var v = App.mac.v;
  if (k === ' ') { if (!v || v.slice(-1) === ' ') return; App.mac.v = v + ' '; }
  else { if (v.replace(/ /g, '').length >= 30) return; App.mac.v = v + k; Sound.play(k === '.' ? 'dot' : 'dash'); }
  paintTape();
}
// tasto del telegrafo: pressione breve = punto, lunga = linea
(function () {
  var t0 = 0;
  document.addEventListener('pointerdown', function (e) { if (e.target.closest('#tkey')) { t0 = Date.now(); e.target.closest('#tkey').classList.add('down'); } });
  document.addEventListener('pointerup', function (e) { var k = document.getElementById('tkey'); if (!k || !t0) return; k.classList.remove('down'); var d = Date.now() - t0; t0 = 0; if (App.mac) mzAdd(d < 230 ? '.' : '-'); });
})();
function macValue(g, id) { var m = E.card(g, id).mac, V = App.mac.v; return m.type === 'dials' ? V.join('') : m.type === 'morse' ? V.trim() : V; }

/* ---------- fine dell'avventura ---------- */
function overBody(g, me) {
  var S = SCN.get(g.scen), used = g.endEl, rem = g.limit * 1000 - g.endEl - g.pen * 1000, st = '';
  for (var i = 0; i < 5; i++) st += '<span class="st' + (i < g.stars ? ' on' : '') + '" style="animation-delay:' + (.5 + i * .35) + 's">' + IC('star') + '</span>';
  var errs = g.tries.miss + g.tries.code + g.tries.mac;
  return '<div class="over"><div class="ov-card">' + ART.card(g.scen, Object.keys(S.cards).filter(function (k) { return S.cards[k].k === 'end'; })[0], { text: false }) + '</div>' +
    '<div class="kicker">' + esc(S.name) + '</div><h2>' + (rem >= 0 ? 'Ce l’avete fatta!' : 'Usciti… fuori tempo!') + '</h2><div class="stars">' + st + '</div>' +
    '<div class="ostats"><span><b>' + Game.mmss(Math.round(used / 1000)) + '</b>tempo di gioco</span><span><b>' + (rem >= 0 ? Game.fmt(rem) : Game.fmt(rem)) + '</b>' + (rem >= 0 ? 'tempo avanzato' : 'oltre il limite') + '</span><span><b>' + Game.mmss(g.pen) + '</b>penalità</span><span><b>' + g.hintN + '</b>indizi</span><span><b>' + errs + '</b>tentativi a vuoto</span></div>' +
    Score.endHTML(App.doc) + (App.doc.host === Net.uid ? '<button class="btn block" data-act="rematch">Scegli un’altra avventura</button>' : '<p class="lead">L’host può scegliere la prossima avventura.</p>') + closeBtn('Guarda il tavolo') + '</div>';
}
function introBody(s) {
  var pages = [
    ['Benvenuto in Unlock!', '<div class="intro-art">' + ART.card('soffitta', 'A', { text: false, cls: 'thumb' }) + '</div><p>È una <b>escape room in carte</b>: giocate tutti insieme, ognuno dal suo telefono, contro lo stesso timer. Non ci sono turni: chiunque può fare qualsiasi cosa.</p>'],
    ['Scopri le carte', '<ul class="intro-list"><li>Tocca una carta per vederla in grande.</li><li>Tocca i <b>numeri nei cerchi</b> per far uscire nuove carte.</li><li>Alcuni numeri sono <b>nascosti nei disegni</b>: piccoli e mimetizzati. Guarda bene!</li></ul>'],
    ['Unisci, apri, accendi', '<ul class="intro-list"><li><b>Rossa + blu</b>: tocca <b>Unisci</b>, scegli le due carte; la somma dei numeri è la carta che esce.</li><li>Le carte <b>gialle</b> vogliono un codice di 4 cifre; le <b>verdi</b> sono macchine da regolare.</li><li>Gli errori costano minuti. Bloccati? Apri una carta e chiedi un <b>indizio</b>.</li></ul>']
  ];
  var p = Math.max(0, Math.min(pages.length - 1, s.page || 0)), pg = pages[p];
  return '<div class="kicker">' + (p + 1) + ' di ' + pages.length + '</div><h2>' + pg[0] + '</h2>' + pg[1] +
    '<div class="row intro-nav">' + (p > 0 ? '<button class="btn ghost" data-act="introprev">Indietro</button>' : '') + (p < pages.length - 1 ? '<button class="btn" data-act="intronext">Avanti</button>' : '<button class="btn" data-act="introdone">Si comincia!</button>') + '<button class="btn ghost small" data-act="introdone">Salta</button></div>';
}

/* ---------- eventi ---------- */
document.addEventListener('click', function (ev) {
  var el = ev.target.closest('[data-act]');
  if (!el || el.disabled) return;
  var a = el.getAttribute('data-act'), g = G(), me = myIdx(), s = App.sheet, id = el.getAttribute('data-id');
  switch (a) {
    case 'sheetback': if (ev.target === el && s && s.kind !== 'intro' && Date.now() - (App.sheetAt || 0) > 450) { App.sheet = null; renderSheet(); } return;
    case 'create': createTable(); break;
    case 'join': joinTable($('#joincode').value); break;
    case 'jointable': case 'lobbyjoin': joinTable(el.getAttribute('data-code')); break;
    case 'noinvite': App.inviteCode = null; history.replaceState(null, '', location.pathname); render(); break;
    case 'rules': App.sheet = { kind: 'rules' }; renderSheet(); break;
    case 'rulego': { var t = document.getElementById('r-' + el.getAttribute('data-r')); if (t) t.scrollIntoView({ block: 'start', behavior: 'smooth' }); break; }
    case 'help': App.sheet = { kind: 'help', r: el.getAttribute('data-r') }; renderSheet(); break;
    case 'menu': App.sheet = { kind: 'menu' }; renderSheet(); break;
    case 'log': App.sheet = { kind: 'log' }; renderSheet(); break;
    case 'gone': App.sheet = { kind: 'gone' }; renderSheet(); break;
    case 'hints': App.sheet = { kind: 'hints' }; renderSheet(); break;
    case 'intro': App.sheet = { kind: 'intro', page: 0 }; renderSheet(); break;
    case 'intronext': s.page++; renderSheet(); break;
    case 'introprev': s.page--; renderSheet(); break;
    case 'introdone': lsSet('ul-intro-done', '1'); App.sheet = null; renderSheet(); break;
    case 'showover': App.sheet = { kind: 'over' }; renderSheet(); break;
    case 'close': App.sheet = null; renderSheet(); break;
    case 'leave': App.sheet = null; if (Exit.ask()) renderSheet(); else leaveTable(); break;
    case 'invite': App.sheet = null; renderSheet(); invite(); break;
    case 'copylink': copyText(inviteLink(), 'Link d’invito copiato'); break;
    case 'kick': send({ t: 'kick', uid: el.getAttribute('data-uid') }); if (el.getAttribute('data-uid') === Net.uid) leaveTable(true); break;
    case 'scen': send({ t: 'opt', scen: el.getAttribute('data-s') }); break;
    case 'start': send({ t: 'start' }); break;
    case 'rematch': App.sheet = null; App.sheetKey = null; App.view = null; send({ t: 'rematch' }); break;
    case 'totable': toTable(); break;
    case 'tohome': App.sheet = null; renderSheet(); toHome(); break;
    case 'lobbycode': { var jc = $('#joincode'); if (jc) { jc.focus(); jc.scrollIntoView({ block: 'center' }); } toast('Tavolo solo su invito: chiedi il codice a ' + esc(el.getAttribute('data-host') || 'chi l’ha aperto') + ' e scrivilo qui.'); break; }
    case 'closetable': App.sheet = { kind: 'closeconfirm' }; renderSheet(); break;
    case 'closeyes': App.sheet = null; renderSheet(); App.closing = true; if (!Net.closeTable()) { App.closing = false; toast('Sei offline: il tavolo non è stato chiuso. Riprova.'); } break;
    case 'takehost': App.sheet = null; renderSheet(); Net.takeHost(); toast('Ora sei tu a reggere il tavolo e il tempo.'); break;
    // tavolo
    case 'open':
      if (!g) return;
      if (s && s.kind === 'gone') { App.sheet = null; renderSheet(); }
      if (el.classList.contains('mini')) el.remove();
      if (App.sel && E.onTable(g, id)) { var cc = E.card(g, id); if (cc.mod && cc.k !== 'red' && cc.k !== 'blue') { App.sel.b = '+' + cc.mod; render(); } else Game.pick(id); }
      else Game.openView(id);
      break;
    case 'vwback': if (ev.target === el) Game.closeView(); break;
    case 'vwclose': Game.closeView(); break;
    case 'vwprev': Game.step(-1); break;
    case 'vwnext': Game.step(1); break;
    case 'spot': case 'ref': {
      if (!g) return;
      if (E.seen(g, id)) { if (E.onTable(g, id)) Game.openView(id); else toast('La carta ' + esc(id) + ' è già stata scartata.'); }
      else if (me < 0) toast('Stai solo guardando.');
      else { if (el.classList.contains('uc-hid')) toast('Numero nascosto trovato: <b>' + esc(id) + '</b>!'); act({ a: 'reveal', id: id }); }
      break;
    }
    case 'comb': if (me < 0 || !g || g.phase !== 'play') return; Game.startComb(id, el.getAttribute('data-mod')); break;
    case 'modsel': App.sel.b = App.sel.b === el.getAttribute('data-v') ? null : el.getAttribute('data-v'); Game.render(); break;
    case 'slotx': App.sel[el.getAttribute('data-w')] = null; Game.render(); break;
    case 'combx': App.sel = null; Game.render(); break;
    case 'combgo': Game.combGo(); break;
    case 'ping': act({ a: 'ping', id: id }); break;
    case 'pause': if (g && g.phase === 'play' && me >= 0) { App.sheet = null; renderSheet(); act({ a: 'pause', on: !g.paused }); } break;
    case 'hintask': App.hintAsk = id + ':' + el.getAttribute('data-l'); Game.renderView(); break;
    case 'hint': App.hintAsk = null; act({ a: 'hint', id: id, lvl: +el.getAttribute('data-l') }); break;
    // lucchetti
    case 'code': App.codeIn = ''; App.sheet = { kind: 'code', id: id }; renderSheet(); break;
    case 'kp': if (App.codeIn.length < 4) { App.codeIn += el.getAttribute('data-k'); Sound.play('key'); if (s.err) { s.err = 0; renderSheet(); } else paintLcd(); } break;
    case 'kpdel': App.codeIn = App.codeIn.slice(0, -1); Sound.play('key'); paintLcd(); break;
    case 'kpok': if (App.codeIn.length !== 4) { toast('Servono 4 cifre.'); Sound.play('error'); break; } act({ a: 'code', id: s.id, v: App.codeIn }); break;
    // macchine
    case 'mac': App.mac = null; App.sheet = { kind: 'mac', id: id }; renderSheet(); break;
    case 'dial': {
      var i = +el.getAttribute('data-i'), dd = +el.getAttribute('data-d'), mc = E.card(g, s.id).mac, V = App.mac.v;
      V[i] = (V[i] + dd + mc.max + 1) % (mc.max + 1); Sound.play('dial');
      var n = document.getElementById('ndl' + i), w = document.getElementById('whl' + i), b = document.getElementById('dv' + i);
      if (n) n.style.transform = 'rotate(' + (-135 + V[i] * 30) + 'deg)';
      if (w) { w._r = (w._r == null ? V[i] - dd : w._r) + dd; w.style.transform = 'rotate(' + (w._r * 40) + 'deg)'; }
      if (b) b.textContent = V[i];
      break;
    }
    case 'mz': mzAdd(el.getAttribute('data-k')); break;
    case 'mzdel': App.mac.v = App.mac.v.slice(0, -1); paintTape(); break;
    case 'mopt': App.mac.v = el.getAttribute('data-v'); Sound.play('dial'); renderSheet(); break;
    case 'mgo': { var v = macValue(g, s.id); if (!v) { toast('Prima regola la macchina.'); break; } s.err = 0; act({ a: 'machine', id: s.id, v: v }); break; }
  }
});
document.addEventListener('change', function (ev) {
  if (ev.target.id === 'opt-vis') send({ t: 'vis', vis: ev.target.value });
});
document.addEventListener('keydown', function (e) {
  if (e.key === 'Enter' && e.target && e.target.id === 'joincode') joinTable(e.target.value);
  if (e.key === 'Escape') { if (App.sheet && App.sheet.kind !== 'intro') { App.sheet = null; renderSheet(); } else if (App.view) Game.closeView(); else if (App.sel) { App.sel = null; Game.render(); } }
  var s = App.sheet;
  if (s && s.kind === 'code' && !/INPUT|TEXTAREA/.test((e.target && e.target.tagName) || '')) {
    if (/^\d$/.test(e.key) && App.codeIn.length < 4) { App.codeIn += e.key; Sound.play('key'); paintLcd(); }
    else if (e.key === 'Backspace') { App.codeIn = App.codeIn.slice(0, -1); paintLcd(); }
    else if (e.key === 'Enter' && App.codeIn.length === 4) act({ a: 'code', id: s.id, v: App.codeIn });
  }
  if (App.view && !App.sheet && G()) { if (e.key === 'ArrowLeft') Game.step(-1); if (e.key === 'ArrowRight') Game.step(1); }
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
