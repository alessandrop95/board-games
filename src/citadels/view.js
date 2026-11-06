/* ===== Citadels: schermata di gioco (corte, avversari, piazza, «Adesso», la tua città) e animazioni =====
   La riga «Adesso» spiega sempre cosa sta succedendo e cosa deve fare chi guarda; la corte in alto mostra gli 8 personaggi
   con chi è stato chiamato, chi è stato ucciso o derubato. Ogni evento ha la sua animazione: rivelazione del personaggio,
   monete e carte che volano, quartieri che si costruiscono, pugnale, esplosione del Condottiero, corona che passa. */
var Game = (function () {
  var mountedFor = null, reduce = window.matchMedia && matchMedia('(prefers-reduced-motion: reduce)').matches;
  function el(id) { return document.getElementById(id); }
  function setHTML(id, h) { var e = el(id); if (e && e._h !== h) { e.innerHTML = h; e._h = h; } }
  function sleep(ms) { return new Promise(function (r) { setTimeout(r, reduce ? 0 : ms); }); }
  function anim(n, frames, o) { if (reduce || !n || !n.animate) return Promise.resolve(); try { return n.animate(frames, o).finished.catch(function () {}); } catch (e) { return Promise.resolve(); } }
  var CH = E.CH, D = E.D;
  function il(r) { return (r === 1 || r === 7 ? 'l’' : 'il ') + CH[r].n; }   // «il Re», «l’Assassino»
  function Il(r) { var s = il(r); return s.charAt(0).toUpperCase() + s.slice(1); }

  function scenery() {
    var o = '', k;
    for (k = 0; k < 22; k++) o += '<b class="st" style="left:' + ((k * 41) % 100) + '%;top:' + ((k * 17) % 34) + '%;animation-delay:-' + (k * .7).toFixed(1) + 's"></b>';
    var towers = [[2, 34, 9], [9, 52, 7], [15, 40, 10], [24, 62, 8], [31, 46, 11], [40, 70, 9], [48, 50, 12], [57, 64, 8], [64, 44, 10], [72, 58, 9], [80, 38, 11], [88, 54, 8], [95, 42, 10]];
    var sky = towers.map(function (t, i) { return '<i style="left:' + t[0] + '%;height:' + t[1] + '%;width:' + t[2] + '%;--d:' + (i % 3) + '"></i>'; }).join('');
    return '<div class="scenery" aria-hidden="true">' + o + '<div class="moon"></div><div class="banners"><i></i><i></i><i></i></div><div class="sky-city">' + sky + '</div><div class="ground"></div></div>';
  }
  function mount() {
    $('#app').innerHTML = '<div class="gv" id="gv">' + scenery() +
      '<header class="gv-top"><button class="iconbtn brandbtn" data-act="menu" aria-label="Menu">☰</button><span class="gv-info" id="gv-info"></span>' + Sound.buttonHTML() + '<span id="gv-chat">' + Chat.badgeHTML() + '</span><button class="iconbtn" data-act="rules" aria-label="Regole">' + IC('help') + '<span class="hide-s"> Regole</span></button></header>' +
      '<nav class="gv-court" id="gv-court" aria-label="La corte: i personaggi dall’1 all’8"></nav>' +
      '<div class="gv-opp" id="gv-opp"></div>' + Chat.dockHTML() +
      '<div class="gv-mid" id="gv-mid"></div>' +
      '<div class="gv-now" id="gv-now" aria-live="polite"></div>' +
      '<div class="gv-me" id="gv-me"></div></div>';
    mountedFor = App.code;
  }
  function unmount() { mountedFor = null; }
  function mainIdx(g) { var me = myIdx(); if (me >= 0) return me; var d = E.decider(g); return d != null ? d : 0; }
  function render() {
    if (mountedFor !== App.code || !el('gv')) mount();
    var g = G(), me = myIdx(), mi = mainIdx(g);
    setHTML('gv-info', '<b>Citadels</b> <span class="muted">· ' + connInfo((g.phase === 'over' ? 'Partita finita' : 'Round ' + g.round) + ' · tavolo ' + esc(App.code)) + '</span><span id="tt" class="tt"></span>');
    setHTML('gv-court', court(g, me));
    setHTML('gv-opp', opponents(g, mi, me));
    setHTML('gv-mid', middle(g, me));
    setHTML('gv-now', nowBox(g, me));
    setHTML('gv-me', mainBoard(g, mi, me));
    var chat = el('gv-chat'); if (chat) { var ch = Chat.badgeHTML(); if (chat._h !== ch) { chat.innerHTML = ch; chat._h = ch; } }
    applyHide();
  }

  /* ---------- chi vede cosa ---------- */
  // il personaggio di p che può vedere chi guarda (il proprio sempre, gli altri solo quando sono stati chiamati)
  function visChar(g, p, me) {
    var P = g.players[p]; if (!P.char && g.phase !== 'over') return null;
    if (g.phase === 'over') return P.char || P.lastChar;
    if (p === me) return P.char;
    return g.revealed[P.char] === p ? P.char : null;
  }
  function charState(g, r, me) {
    var pk = g.pick || {}, up = pk.up || [];
    if (up.indexOf(r) >= 0) return { s: 'up' };
    var mine = me >= 0 && g.players[me].char === r;
    if (g.phase === 'pick') return { s: mine ? 'mine' : 'wait' };
    var own = g.revealed[r];
    if (g.phase === 'turns' && g.turn && g.turn.r === r) return { s: 'now', p: own };
    if (r < g.call || (r === g.call && !g.turn) || g.phase === 'over') return own != null ? { s: 'done', p: own } : r === g.killed ? { s: 'dead' } : { s: 'none' };
    return { s: mine ? 'mine' : 'wait' };
  }
  var STATE_L = { up: 'scartato', wait: 'in attesa', mine: 'sei tu', now: 'di turno', done: 'ha giocato', dead: 'ucciso', none: 'nessuno' };
  function court(g, me) {
    var o = '';
    for (var r = 1; r <= 8; r++) {
      var st = charState(g, r, me), marks = '';
      if (g.killed === r) marks += '<i class="mk kill">' + IC('dagger') + '</i>';
      if (g.robbed === r) marks += '<i class="mk rob">' + IC('bag') + '</i>';
      var who = st.p != null ? '<span class="ctk-o" style="--pc:' + pcol(g, st.p) + '">' + esc(g.players[st.p].nick.charAt(0).toUpperCase()) + '</span>' : st.s === 'mine' ? '<span class="ctk-o me">tu</span>' : st.s === 'none' ? '<span class="ctk-o no">–</span>' : '';
      o += '<button class="ctk s-' + st.s + '" data-act="char" data-r="' + r + '" aria-label="' + r + ' ' + CH[r].n + ': ' + STATE_L[st.s] + '"><span class="ctk-t">' + ART.token(r) + '</span><span class="ctk-n">' + r + '</span>' + marks + who + '<span class="ctk-l">' + CH[r].n + '</span></button>';
    }
    return o;
  }

  /* ---------- avversari ---------- */
  function pips(g, p) {
    var P = g.players[p], o = '';
    for (var k = 0; k < E.TARGET; k++) { var id = P.city[k]; o += id != null ? '<i class="pip t-' + D(id).t + '" data-id="' + id + '"></i>' : '<i class="pip"></i>'; }
    for (k = E.TARGET; k < P.city.length; k++) o += '<i class="pip t-' + D(P.city[k]).t + '" data-id="' + P.city[k] + '"></i>';
    return '<span class="pips">' + o + '</span>';
  }
  function tags(g, p) {
    var P = g.players[p], o = '', d = E.decider(g);
    if (d === p && g.phase === 'pick') o += '<span class="tag wait">sceglie…</span>';
    else if (d === p) o += '<span class="tag on">di turno</span>';
    if (E.complete(P)) o += '<span class="tag done">città completa</span>';
    if (P.away) o += '<span class="tag away">assente</span>'; else if (P.bot && g.phase !== 'over') o += '<span class="tag bot">auto</span>';
    return o;
  }
  function charBadge(g, p, me) {
    var P = g.players[p], r = visChar(g, p, me);
    if (r) return '<span class="cb" title="' + CH[r].n + '">' + ART.token(r) + (g.robbed === r && g.phase !== 'over' ? '<i class="mk rob">' + IC('bag') + '</i>' : '') + '</span>';
    if (P.char && g.phase === 'pick') return '<span class="cb hid" title="Ha scelto (segreto)">?</span>';
    if (P.char) return '<span class="cb hid" title="Non ancora chiamato">?</span>';
    return '';
  }
  function opponents(g, mi, me) {
    return g.players.map(function (P, p) {
      if (p === mi) return '';
      var on = E.decider(g) === p;
      return '<button class="opp' + (on ? ' on' : '') + (E.complete(P) ? ' full' : '') + '" style="--pc:' + pcol(g, p) + '" data-act="player" data-p="' + p + '" aria-label="' + esc(P.nick) + '">' +
        '<span class="opp-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b>' + Net.dot(P.uid) + esc(P.nick) + '</b>' + (g.crown === p ? '<span class="crn" title="Ha la corona">' + IC('crown') + '</span>' : '') + charBadge(g, p, me) + '</span>' +
        '<span class="opp-s"><span class="og" data-p="' + p + '" title="Oro">' + IC('coin') + '<b>' + P.gold + '</b></span><span class="oh" data-p="' + p + '" title="Carte in mano">' + IC('cards') + '<b>' + P.hand.length + '</b></span><span class="oc" title="Quartieri">' + IC('build') + '<b>' + P.city.length + '</b>/' + E.TARGET + '</span></span>' +
        pips(g, p) + '<span class="opp-t">' + tags(g, p) + '</span></button>';
    }).join('');
  }

  /* ---------- la piazza: mazzo, personaggio chiamato, tesoro ---------- */
  function middle(g, me) {
    var stack = ''; for (var k = 0; k < Math.min(4, Math.ceil(g.deck.length / 12)); k++) stack += '<span class="stk" style="--k:' + k + '">' + ART.card(null) + '</span>';
    var deck = '<div class="pile deck" id="deck" aria-label="Mazzo dei quartieri, ' + g.deck.length + ' carte">' + stack + '<span class="pl">Mazzo <i>' + g.deck.length + '</i></span></div>';
    var bank = '<div class="pile bank" id="bank" aria-label="Tesoro"><span class="coins">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<i style="--i:' + i + '">' + IC('coin') + '</i>'; }).join('') + '</span><span class="pl">Tesoro</span></div>';
    var spot = '';
    if (g.phase === 'pick') {
      var pk = g.pick, d = E.decider(g);
      spot = '<div class="spot pickspot" id="spot"><span class="sp-k">Scelta dei personaggi</span><span class="sp-cards">' + pk.order.map(function (p, i) { return '<i class="sp-dot' + (i < pk.i ? ' ok' : i === pk.i ? ' cur' : '') + '" style="--pc:' + pcol(g, p) + '" title="' + esc(g.players[p].nick) + '">' + esc(g.players[p].nick.charAt(0).toUpperCase()) + '</i>'; }).join('') + '</span>' +
        '<span class="sp-who">' + (d === me ? 'Tocca a te!' : esc(g.players[d].nick) + ' sceglie') + '</span>' +
        (pk.up.length ? '<span class="sp-up">' + pk.up.map(function (r) { return '<span class="upc" title="' + CH[r].n + ' (scartato scoperto)">' + ART.token(r) + '</span>'; }).join('') + '<small>scartati</small></span>' : '') + '</div>';
    } else if (g.phase === 'turns' && g.turn) {
      var T = g.turn;
      spot = '<div class="spot callspot" id="spot" style="--pc:' + pcol(g, T.p) + '"><span class="sp-card">' + ART.card({ r: T.r }) + '</span><span class="sp-name">' + (T.p === me ? 'Sei tu!' : esc(g.players[T.p].nick)) + '</span></div>';
    } else if (g.phase === 'over') {
      spot = '<div class="spot overspot" id="spot"><span class="sp-tro">' + IC('trophy') + '</span><span class="sp-name">' + esc(g.players[g.winners[0]].nick) + '</span></div>';
    } else spot = '<div class="spot" id="spot"></div>';
    return '<div class="piazza">' + deck + spot + bank + '</div>';
  }

  /* ---------- «Adesso»: cosa succede e cosa fare ---------- */
  function steps(g) {
    var T = g.turn, r = T.r, u = T.used, o = [];
    function st(label, state) { o.push('<span class="stp ' + state + '">' + (state === 'done' ? IC('check') : '') + label + '</span>'); }
    if (r === 1) st('Uccidi', u.kill ? 'done' : 'cur');
    if (r === 2) st('Deruba', u.rob ? 'done' : 'cur');
    st('① Risorse', T.gathered && !T.drawn ? 'done' : 'cur');
    st('② Costruisci ' + T.built + '/' + T.max, T.built >= T.max ? 'done' : T.gathered && !T.drawn ? 'cur' : 'todo');
    if (r === 3) st('③ Magia', u.magic ? 'done' : 'opt');
    if (CH[r].t) st('③ Incassa ' + E.incomeOf(g, T.p, r), u.income ? 'done' : T.gathered ? 'cur' : 'todo');
    if (r === 8) st('Distruggi', u.destroy ? 'done' : 'opt');
    return '<div class="steps">' + o.join('') + '</div>';
  }
  function myStatus(g, me) {
    if (me < 0) return '';
    var P = g.players[me], r = P.char; if (!r) return '';
    if (g.killed === r && g.revealed[r] == null) return '<span class="mys bad">' + IC('dagger') + ' Il tuo personaggio, ' + il(r) + ', è stato <b>assassinato</b>: salti il turno in questo round.</span>';
    if (g.revealed[r] === me && !(g.turn && g.turn.p === me)) return '<span class="mys">' + IC('check') + ' Hai già giocato in questo round (eri ' + il(r) + ').</span>';
    if (g.turn && g.turn.p === me) return '';
    return '<span class="mys">Tu sei <b>' + il(r) + '</b> (' + r + '), lo sai solo tu: verrai chiamato dopo.' + (g.robbed === r ? ' <b class="bad">Attento: il Ladro ti ha preso di mira!</b>' : '') + '</span>';
  }
  function buildable(g, me) {
    var P = g.players[me];
    return P.hand.filter(function (id) { return !E.canBuild(g, me, id) && (E.costOf(P, id) <= P.gold || (D(id).u === 'den' && E.costOf(P, id) <= P.gold + P.hand.length - 1)); });
  }
  function nowInfo(g, me) {
    var P = me >= 0 ? g.players[me] : null, o = { k: '', t: '', b: '', s: '', btn: '', help: 'round' };
    if (g.phase === 'over') {
      var w = g.winners[0];
      o.k = 'Partita finita'; o.t = w === me ? '<b>Hai vinto!</b> La tua città è la più ricca.' : 'Vince ' + pname(g, w) + ' con <b>' + g.final.sc[w].total + ' punti</b>.';
      o.b = 'Guarda come sono stati contati i punti nella classifica.'; o.btn = '<button class="btn small" data-act="showover">Classifica</button>'; o.help = 'end'; return o;
    }
    if (g.phase === 'pick') {
      var pk = g.pick, d = E.decider(g), pos = pk.i + 1, n = pk.order.length;
      o.k = 'Round ' + g.round + ' · scelta dei personaggi'; o.help = 'pick';
      var up = pk.up.length ? ' Scartati scoperti (nessuno li avrà): <b>' + pk.up.map(function (r) { return CH[r].n; }).join(', ') + '</b>.' : '';
      if (d === me) {
        o.t = '<b>Tocca a te scegliere il personaggio!</b>';
        o.b = (pos === 1 ? 'Hai la corona: scegli per primo tra tutti.' : pos === n ? 'Sei l’ultimo: prendi uno di quelli rimasti.' : 'Ne restano ' + E.choices(g).length + ': scegline uno, gli altri passano al prossimo.') + ' Nessuno vedrà la tua scelta finché il personaggio non viene chiamato.';
        o.btn = '<button class="btn small glow" data-act="pickopen">Scegli</button>';
      } else {
        o.t = pname(g, d) + ' sta scegliendo il personaggio <span class="muted">(' + pos + '° di ' + n + ')</span>';
        if (P && P.char) o.b = 'Tu hai scelto <b>' + il(P.char) + '</b>: lo sai solo tu. Quando tutti avranno scelto, si chiamano i personaggi dall’1 all’8.';
        else if (P) { var left = pk.order.indexOf(me) - pk.i; o.b = 'I personaggi passano di mano in mano. Tu sceglierai ' + (left === 1 ? '<b>subito dopo</b>' : 'tra <b>' + left + '</b> giocatori') + '.'; }
        else o.b = 'Ognuno sceglie in segreto un personaggio; poi si chiamano dall’1 all’8.';
        o.b += up;
        if (P && P.bot) o.btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
      }
      return o;
    }
    var T = g.turn; if (!T) { o.t = 'Si chiamano i personaggi…'; return o; }
    var r = T.r, cur = T.p;
    o.k = 'Round ' + g.round + ' · si chiama il ' + r + ': ' + CH[r].n; o.s = steps(g); o.help = 'turn';
    if (cur === me) {
      o.t = '<b>Tocca a te!</b> Sei ' + il(r) + '.';
      var can = buildable(g, me), inc = E.canIncome(g) ? E.incomeOf(g, me, r) : 0;
      if (r === 1 && !T.used.kill) { o.b = 'Usa il tuo potere: tocca <b>Uccidi</b> e scegli il personaggio da eliminare. Poi prendi le risorse.'; o.help = 'kill'; }
      else if (r === 2 && !T.used.rob) { o.b = 'Usa il tuo potere: tocca <b>Deruba</b> e scegli il personaggio a cui rubare l’oro. Poi prendi le risorse.'; o.help = 'kill'; }
      else if (!T.gathered) o.b = 'Passo ①: prendi <b>2 oro</b> oppure <b>pesca 2 carte</b> (ne terrai una).' + (r === 3 && !T.used.magic ? ' Puoi usare la <b>Magia</b> quando vuoi.' : '');
      else if (T.drawn) { o.b = 'Scegli quale delle due carte pescate tenere: l’altra torna sotto il mazzo.'; o.btn = '<button class="btn small glow" data-act="keepopen">Scegli la carta</button>'; }
      else if (T.built < T.max && can.length) o.b = 'Passo ②: tocca una carta <b>illuminata</b> della tua mano per costruirla' + (T.max > 1 ? ' (ne puoi costruire fino a ' + (T.max - T.built) + ')' : '') + '.' + (inc ? ' Puoi anche incassare <b>' + inc + ' oro</b> dai tuoi quartieri ' + E.PL[CH[r].t] + '.' : '');
      else if (inc) o.b = 'Incassa <b>' + inc + ' oro</b> dai tuoi quartieri ' + E.PL[CH[r].t] + ', poi tocca <b>Fine turno</b>.';
      else o.b = (T.built < T.max ? (P.hand.length ? 'Non hai abbastanza oro per costruire le carte che hai in mano. ' : 'Non hai carte da costruire. ') : 'Hai costruito tutto quello che potevi. ') + (r === 8 && !T.used.destroy ? 'Puoi ancora <b>distruggere</b> un quartiere, oppure tocca <b>Fine turno</b>.' : 'Tocca <b>Fine turno</b>.');
      if (P.bot) o.btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    } else {
      var Q = g.players[cur];
      o.t = 'Turno ' + (r === 1 || r === 7 ? 'dell’' : 'del ') + '<b>' + CH[r].n + '</b>: ' + pname(g, cur) + (Q.bot ? ' <span class="muted">(automatico)</span>' : '');
      o.b = (!T.gathered ? 'Sta prendendo le risorse (2 oro o 2 carte)…' : T.drawn ? 'Sta scegliendo quale carta tenere…' : 'Può costruire ' + (T.max > 1 ? 'fino a 3 quartieri' : 'un quartiere') + ' e usare il suo potere.') + ' ' + myStatus(g, me);
      if (P && P.bot) o.btn = '<button class="btn small" data-act="resume">Riprendo io</button>';
    }
    return o;
  }
  function ticker(g) {
    var L = g.log.slice(-2);
    return '<div class="ticker">' + L.map(function (l) { var c = l.p != null && g.players[l.p] ? pcol(g, l.p) : 'rgba(255,220,150,.5)'; return '<span class="tk k-' + l.k + '" style="--pc:' + c + '">' + esc(l.t) + '</span>'; }).join('') + '</div>';
  }
  function nowBox(g, me) {
    var o = nowInfo(g, me);
    return '<div class="now"><div class="now-h"><span class="now-k">' + IC('scroll') + ' Adesso · ' + o.k + '</span><span class="now-b">' + o.btn + '<button class="iconbtn help" data-act="help" data-r="' + o.help + '" aria-label="Spiegazione">' + IC('help') + '</button></span></div>' +
      '<div class="now-t">' + o.t + '</div>' + (o.s || '') + (o.b ? '<div class="now-d">' + o.b + '</div>' : '') + '</div>' + ticker(g);
  }

  /* ---------- la mia città e la mia mano ---------- */
  function cityRow(g, p, o) {
    o = o || {};
    var P = g.players[p], slots = '';
    P.city.forEach(function (id) { slots += '<button class="cs" data-act="card" data-id="' + id + '" data-p="' + p + '">' + ART.card({ d: id }, { mini: !o.big }) + '</button>'; });
    for (var k = P.city.length; k < E.TARGET; k++) slots += '<span class="cs empty"><i>' + (k + 1) + '</i></span>';
    return '<div class="cty" data-p="' + p + '">' + slots + '</div>';
  }
  function handRow(g, p, me) {
    var P = g.players[p];
    if (p !== me) return '<div class="hand hidden">' + P.hand.map(function () { return '<span class="hc">' + ART.card(null) + '</span>'; }).join('') + (P.hand.length ? '' : '<span class="muted">nessuna carta</span>') + '</div>';
    var T = g.phase === 'turns' && g.turn, myT = T && T.p === me && T.gathered && !T.drawn && T.built < T.max, can = myT ? buildable(g, me) : [];
    if (!P.hand.length) return '<div class="hand"><span class="hand-empty">Non hai carte in mano: pescale con «Pesca 2 carte» nel tuo turno.</span></div>';
    return '<div class="hand' + (can.length ? ' building' : '') + '">' + P.hand.map(function (id) {
      var c = can.indexOf(id) >= 0, dup = E.canBuild(g, me, id) && /già un/.test(E.canBuild(g, me, id) || '');
      return '<button class="hc' + (c ? ' can' : '') + (dup ? ' dup' : '') + '" data-act="card" data-id="' + id + '" data-p="' + me + '" aria-label="' + esc(D(id).n) + ', costo ' + E.costOf(P, id) + '">' + ART.card({ d: id }) + (c ? '<span class="hc-b">' + IC('build') + '</span>' : '') + '</button>';
    }).join('') + '</div>';
  }
  function actions(g, me) {
    var T = g.turn, P = g.players[me];
    if (g.phase !== 'turns' || !T || T.p !== me) return '';
    var b = [], r = T.r, u = T.used;
    if (r === 1 && !u.kill) b.push('<button class="btn pw kill" data-act="pw" data-k="kill">' + IC('dagger') + ' Uccidi…</button>');
    if (r === 2 && !u.rob) b.push('<button class="btn pw rob" data-act="pw" data-k="rob">' + IC('bag') + ' Deruba…</button>');
    if (!T.gathered) { b.push('<button class="btn res" data-act="gold">' + IC('coin') + ' Prendi 2 oro</button>'); b.push('<button class="btn res" data-act="draw"' + (g.deck.length ? '' : ' disabled') + '>' + IC('cards') + ' Pesca 2 carte' + (E.has(P, 'library') ? ' (le tieni)' : '') + '</button>'); }
    else if (T.drawn) b.push('<button class="btn res glow" data-act="keepopen">' + IC('cards') + ' Scegli la carta da tenere</button>');
    if (r === 3 && !u.magic) b.push('<button class="btn pw magic" data-act="pw" data-k="magic">' + IC('magic') + ' Magia…</button>');
    if (T.gathered && !T.drawn) {
      if (E.canIncome(g)) b.push('<button class="btn pw inc" data-act="income">' + IC('coin') + ' Incassa ' + E.incomeOf(g, me, r) + ' oro</button>');
      if (r === 8 && !u.destroy) b.push('<button class="btn pw fire" data-act="pw" data-k="destroy">' + IC('fire') + ' Distruggi…</button>');
      if (E.has(P, 'lab') && !u.lab && P.hand.length) b.push('<button class="btn pw ghost small" data-act="pw" data-k="lab">Laboratorio</button>');
      if (E.has(P, 'smithy') && !u.smithy && P.gold >= 2) b.push('<button class="btn pw ghost small" data-act="smithy">Fucina (2 oro → 3 carte)</button>');
      b.push('<button class="btn end" data-act="endturn">Fine turno ' + IC('end') + '</button>');
    }
    return '<div class="acts">' + b.join('') + '</div>';
  }
  function mainBoard(g, mi, me) {
    var P = g.players[mi], on = E.decider(g) === mi, r = visChar(g, mi, me), sc = E.score(g, mi).total;
    var chr = r ? '<span class="mych' + (g.killed === r ? ' dead' : '') + '" data-act="char" data-r="' + r + '">' + ART.token(r) + '<span><small>' + (mi === me && g.revealed[r] !== mi && g.phase !== 'over' ? 'segreto · ' : '') + r + '</small><b>' + CH[r].n + '</b></span></span>' : (mi === me && g.phase === 'pick' ? '<span class="mych none"><span><small>personaggio</small><b>da scegliere</b></span></span>' : '');
    return '<div class="mine' + (on ? ' on' : '') + '" style="--pc:' + pcol(g, mi) + '"><div class="mine-h"><span class="pv">' + esc(P.nick.charAt(0).toUpperCase()) + '</span><b class="mnm">' + Net.dot(P.uid) + esc(P.nick) + (mi === me ? ' (tu)' : '') + '</b>' + (g.crown === mi ? '<span class="crn" title="Hai la corona: sceglierai per primo">' + IC('crown') + '</span>' : '') +
      '<span class="mg" id="me-gold" title="Il tuo oro">' + IC('coin') + '<b>' + P.gold + '</b></span><span class="mpt" title="Punti se la partita finisse adesso">' + sc + ' pt</span>' + chr + '</div>' +
      '<div class="lbl">La ' + (mi === me ? 'tua ' : '') + 'città <b>' + P.city.length + '/' + E.TARGET + '</b>' + (E.complete(P) ? ' <span class="tag done">completa</span>' : '') + '</div>' + cityRow(g, mi) +
      '<div class="lbl">' + (mi === me ? 'La tua mano' : 'Carte in mano') + ' <b>' + P.hand.length + '</b>' + (mi === me && g.phase === 'turns' && g.turn && g.turn.p === me && g.turn.gathered && !g.turn.drawn && g.turn.built < g.turn.max && buildable(g, me).length ? ' <span class="hint">tocca una carta illuminata per costruirla</span>' : '') + '</div>' + handRow(g, mi, me) +
      (mi === me ? actions(g, me) : '') + '</div>';
  }

  /* ---------- elementi nascosti durante le animazioni ---------- */
  function cityCard(p, id) { return document.querySelector('.cty[data-p="' + p + '"] .cs[data-id="' + id + '"]') || document.querySelector('.opp[data-p="' + p + '"] .pip[data-id="' + id + '"]'); }
  function applyHide() {
    document.querySelectorAll('.flyhide').forEach(function (n) { n.classList.remove('flyhide'); });
    Object.keys(App.hide).forEach(function (k) {
      var h = App.hide[k], parts = k.split('|'), n = null;
      if (parts[0] === 'city') n = cityCard(parts[1], parts[2]);
      if (n && h.n > 0) n.classList.add('flyhide');
    });
  }
  function hide(k) { var h = App.hide[k] || (App.hide[k] = { n: 0 }); h.n++; }
  function unhide(k) { var h = App.hide[k]; if (!h) return; if (--h.n <= 0) delete App.hide[k]; applyHide(); }

  /* ---------- dove si trovano le cose ---------- */
  function rectOf(n) { return n ? n.getBoundingClientRect() : null; }
  function isMain(p) { return p === mainIdx(G()); }
  function tileEl(p) { return isMain(p) ? document.querySelector('.mine') : document.querySelector('.opp[data-p="' + p + '"]'); }
  function goldEl(p) { return isMain(p) ? el('me-gold') : document.querySelector('.og[data-p="' + p + '"]'); }
  function handEl(p) { return isMain(p) ? document.querySelector('.mine .hand') : document.querySelector('.oh[data-p="' + p + '"]'); }
  function tokEl(r) { return document.querySelector('.ctk[data-r="' + r + '"]'); }
  function cardBox(r, w) { if (!r) return null; w = w || Math.min(64, r.width); var h = w * 1.4; return { left: r.left + (r.width - w) / 2, top: r.top + (r.height - h) / 2, width: w, height: h }; }
  function fly(html, from, to, o) {
    o = o || {};
    if (!from || !to || reduce) return Promise.resolve();
    var f = document.createElement('div'); f.className = 'flyer' + (o.cls ? ' ' + o.cls : ''); f.innerHTML = html;
    f.style.width = to.width + 'px'; f.style.height = to.height + 'px'; f.style.left = to.left + 'px'; f.style.top = to.top + 'px';
    document.body.appendChild(f);
    var sx = from.width / to.width, dx = from.left - to.left, dy = from.top - to.top, lift = o.arc == null ? -Math.min(80, Math.abs(dx) * .25 + 30) : o.arc;
    return anim(f, [
      { transform: 'translate(' + dx + 'px,' + dy + 'px) scale(' + sx + ') rotate(' + (o.r0 || -8) + 'deg)', opacity: o.fadeIn ? 0 : 1, offset: 0 },
      { transform: 'translate(' + (dx / 2) + 'px,' + (dy / 2 + lift) + 'px) scale(' + ((sx + 1) / 2 * 1.12) + ') rotate(' + ((o.r0 || -8) / 2 + 6) + 'deg)', opacity: 1, offset: .5 },
      { transform: 'translate(0,0) scale(1) rotate(0deg)', opacity: o.fadeOut ? 0 : 1, offset: 1 }
    ], { duration: o.dur || 520, easing: 'cubic-bezier(.3,.7,.3,1)', delay: o.delay || 0, fill: 'both' }).then(function () { if (!o.keep) f.remove(); return f; });
  }
  function coins(from, to, n) {
    if (!from || !to || reduce) return Promise.resolve();
    var ps = [], k = Math.min(6, Math.max(1, n));
    for (var i = 0; i < k; i++) ps.push(fly('<span class="fcoin">' + IC('coin') + '</span>', { left: from.left + from.width / 2 - 11 + (i % 3 - 1) * 6, top: from.top + from.height / 2 - 11, width: 22, height: 22 }, { left: to.left + to.width / 2 - 11, top: to.top + to.height / 2 - 11, width: 22, height: 22 }, { dur: 520, delay: i * 80, r0: 0, arc: -40 - i * 4 }));
    return Promise.all(ps);
  }
  function backs(from, to, n, delay) {
    if (!from || !to || reduce) return Promise.resolve();
    var ps = []; for (var i = 0; i < Math.min(4, n); i++) ps.push(fly(ART.card(null), cardBox(from, 44), cardBox(to, 34), { dur: 520, delay: (delay || 0) + i * 110 }));
    return Promise.all(ps);
  }
  function burst(r, cols, n) {
    if (!r || reduce) return;
    var b = document.createElement('div'); b.className = 'burst'; b.style.left = (r.left + r.width / 2) + 'px'; b.style.top = (r.top + r.height / 2) + 'px';
    var o = ''; n = n || 16; for (var i = 0; i < n; i++) { var a = i / n * Math.PI * 2, d = 40 + (i % 3) * 20; o += '<i style="--x:' + Math.round(Math.cos(a) * d) + 'px;--y:' + Math.round(Math.sin(a) * d) + 'px;background:' + (cols || ['#fff3c0', '#f2c23c', '#e8553f'])[i % 3] + '"></i>'; }
    b.innerHTML = o; document.body.appendChild(b); setTimeout(function () { b.remove(); }, 900);
  }
  function floatTxt(r, txt, cls) {
    if (!r) return;
    var f = document.createElement('div'); f.className = 'floatxt ' + (cls || ''); f.innerHTML = txt; f.style.left = (r.left + r.width / 2) + 'px'; f.style.top = (r.top + r.height / 2) + 'px';
    document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1700);
  }
  function stamp(n, txt, cls) {
    if (!n || reduce) return;
    var r = rectOf(n), s = document.createElement('div'); s.className = 'stampfx ' + (cls || ''); s.innerHTML = '<span>' + txt + '</span>';
    s.style.left = r.left + 'px'; s.style.top = r.top + 'px'; s.style.width = r.width + 'px'; s.style.height = r.height + 'px';
    document.body.appendChild(s); setTimeout(function () { s.remove(); }, 1600);
  }
  function shake(n, cls) { if (!n) return; cls = cls || 'shake'; n.classList.remove(cls); void n.offsetWidth; n.classList.add(cls); setTimeout(function () { n.classList.remove(cls); }, 900); }

  /* ---------- la grande rivelazione ---------- */
  function reveal(r, p, me, kind) {
    var g = G(), d = document.createElement('div'), you = p === me, nick = p != null && p >= 0 ? esc(g.players[p].nick) : '';
    var line = kind === 'dead' ? (p != null && p >= 0 ? (you ? 'Eri tu: salti il turno.' : '…è stato assassinato! Salta il turno.') : 'Nessuno lo aveva: l’Assassino ha colpito a vuoto.') : you ? '…sei tu! Tocca a te.' : '…è <b style="color:' + pcol(g, p) + '">' + nick + '</b>!';
    d.className = 'reveal' + (kind === 'dead' ? ' dead' : '') + (you ? ' you' : '');
    d.innerHTML = '<div class="rv-in"><span class="rv-k">Si chiama il ' + r + '</span><span class="rv-card"><span class="rv-flip"><span class="rv-back">' + ART.card(null, { back: 'char' }) + '</span><span class="rv-front">' + ART.card({ r: r }) + '</span></span>' + (kind === 'dead' ? '<span class="rv-dag">' + IC('dagger') + '</span>' : '') + '</span><span class="rv-n">' + CH[r].n + '</span><span class="rv-l">' + line + '</span></div>';
    document.body.appendChild(d);
    setTimeout(function () { d.classList.add('out'); }, reduce ? 900 : 1750);
    setTimeout(function () { d.remove(); }, reduce ? 1100 : 2150);
  }
  function banner(t, sub, cls, ms) { var b = document.createElement('div'); b.className = 'banner ' + (cls || ''); b.innerHTML = '<span>' + t + (sub ? '<small>' + sub + '</small>' : '') + '</span>'; document.body.appendChild(b); setTimeout(function () { b.remove(); }, ms || 2300); }

  /* ---------- coda degli effetti ---------- */
  var Q = [], qBusy = false;
  function enqueue(fn) { Q.push(fn); if (!qBusy) nextQ(); }
  function nextQ() { var f = Q.shift(); if (!f) { qBusy = false; return; } qBusy = true; var done = false, go = function () { if (done) return; done = true; nextQ(); }; Promise.resolve().then(f).then(go, go); setTimeout(go, 4500); }
  function idle() { return !qBusy && !Q.length; }
  function openPick() { var g = G(), me = myIdx(); if (g && g.phase === 'pick' && E.decider(g) === me && (!App.sheet || App.sheet.kind !== 'intro')) { App.sheet = { kind: 'pick' }; renderSheet(); } }
  function openKeep() { var g = G(), me = myIdx(); if (g && g.turn && g.turn.p === me && g.turn.drawn && (!App.sheet || App.sheet.kind !== 'intro')) { App.sheet = { kind: 'keep' }; renderSheet(); } }

  function fx(g, me) {
    // partita nuova sullo stesso tavolo (anche se la sala d'attesa non si è vista): i contatori ripartono da zero
    if (App.lastFxN && g.fxN < App.lastFxN) { App.lastFxN = 0; App.hide = {}; }
    if (App.lastFxN == null || !App.seenFirstDoc) {
      App.lastFxN = g.fxN;
      if (g.phase === 'over' && !App.sheet) { App.sheet = { kind: 'over' }; renderSheet(); }
      else { openPick(); openKeep(); }
      return;
    }
    if (g.fxN <= App.lastFxN) return;
    var news = (g.fx || []).filter(function (e) { return e.n > App.lastFxN; }); App.lastFxN = g.fxN;
    // troppe cose arretrate (telefono in pausa): niente animazioni, solo lo stato
    if (Q.length > 10 || news.length > 30) { Q = []; App.hide = {}; applyHide(); news = news.filter(function (e) { return e.k === 'over' || e.k === 'picker' || e.k === 'drawn'; }); }
    news.forEach(function (e) { plan(g, me, e); });
    applyHide();
  }
  function plan(g, me, e) {
    var k;
    switch (e.k) {
      case 'round':
        enqueue(function () {
          Sound.play('shuffle');
          banner('Round ' + e.round, 'Scelta dei personaggi · comincia ' + esc(G().players[e.crown].nick) + (e.up.length ? '<br>scartati scoperti: ' + e.up.map(function (r) { return CH[r].n; }).join(', ') : ''), 'round', 2000);
          return sleep(1500).then(function () { e.up.forEach(function (r) { var t = tokEl(r); shake(t, 'drop'); }); return sleep(300); });
        });
        break;
      case 'picker':
        enqueue(function () {
          if (e.p === me) { Sound.play('turn'); pulse(); openPick(); }
          return sleep(80);
        });
        break;
      case 'picked':
        enqueue(function () {
          var g2 = G(), p = g2.pick ? g2.pick.order[e.i - 1] : null; if (p == null) return;
          Sound.play('pick');
          var to = isMain(p) ? rectOf(document.querySelector('.mych') || document.querySelector('.mine-h')) : rectOf(document.querySelector('.opp[data-p="' + p + '"] .cb') || tileEl(p));
          return fly(ART.card(null, { back: 'char' }), cardBox(rectOf(el('spot')), 48), cardBox(to, 26), { dur: 520 });
        });
        break;
      case 'calls':
        enqueue(function () { Sound.play('call'); banner('Si chiamano i personaggi', 'in ordine, dall’1 all’8', 'calls', 1700); return sleep(1300); });
        break;
      case 'reveal':
        enqueue(function () {
          Sound.play('call'); setTimeout(function () { Sound.play(e.p === me ? 'turn' : 'reveal'); }, 450);
          reveal(e.r, e.p, me); shake(tokEl(e.r), 'ring');
          if (e.p === me) setTimeout(pulse, 1500);
          return sleep(2050);
        });
        break;
      case 'skip':
        enqueue(function () { Sound.play('call'); setTimeout(function () { Sound.play('dead'); }, 500); reveal(e.r, e.p, me, 'dead'); shake(tokEl(e.r), 'ring'); return sleep(2050); });
        break;
      case 'nobody':
        enqueue(function () { var t = tokEl(e.r); Sound.play('tick'); shake(t, 'nope'); floatTxt(rectOf(t), CH[e.r].n + ': nessuno', 'small'); return sleep(650); });
        break;
      case 'rob':
        enqueue(function () {
          Sound.play('rob'); var a = tileEl(e.from), b = goldEl(e.to) || tileEl(e.to);
          stamp(a, 'DERUBATO!', 'rob');
          return coins(rectOf(goldEl(e.from) || a), rectOf(b), e.g).then(function () { if (e.g) floatTxt(rectOf(b), '+' + e.g, 'gold'); return sleep(500); });
        });
        break;
      case 'crown':
        enqueue(function () {
          Sound.play('crown'); var to = tileEl(e.p);
          var fr = rectOf(el('spot'));
          return fly('<span class="fcrown"><svg viewBox="-20 -16 40 30">' + ART.crownPath(0, 0, 1) + '</svg></span>', cardBox(fr, 60), cardBox(rectOf(to.querySelector('.crn') || to), 36), { dur: 800, r0: 0, arc: -60 }).then(function () { floatTxt(rectOf(to), e.heir ? 'la corona all’erede' : 'prende la corona', 'gold'); return sleep(300); });
        });
        break;
      case 'gold':
        if (!e.g) { enqueue(function () { if (e.why === 'income') floatTxt(rectOf(goldEl(e.p)), '+0 oro', 'small'); return sleep(200); }); break; }
        enqueue(function () {
          Sound.play('coin', { n: e.g }); var to = goldEl(e.p) || tileEl(e.p);
          return coins(rectOf(el('bank')), rectOf(to), e.g).then(function () { floatTxt(rectOf(to), '+' + e.g + ' oro', 'gold'); shake(to, 'bump'); return sleep(200); });
        });
        break;
      case 'cards':
        enqueue(function () {
          if (e.why === 'keep') { Sound.play('card'); var hr = handEl(e.p); floatTxt(rectOf(hr), '+1 carta', 'small'); return sleep(250); }
          Sound.play('cards'); var to = handEl(e.p) || tileEl(e.p);
          return backs(rectOf(el('deck')), rectOf(to), e.c).then(function () { floatTxt(rectOf(to), '+' + e.c + (e.c === 1 ? ' carta' : ' carte'), 'small'); return sleep(150); });
        });
        break;
      case 'drawn':
        enqueue(function () {
          Sound.play('cards');
          var sp = cardBox(rectOf(el('spot')), 50);
          return backs(rectOf(el('deck')), sp ? { left: sp.left, top: sp.top, width: sp.width, height: sp.height } : null, 2).then(function () { if (e.p === me) openKeep(); return sleep(100); });
        });
        break;
      case 'build':
        k = 'city|' + e.p + '|' + e.id; hide(k);
        enqueue(function () {
          var to = cityCard(e.p, e.id), fr = isMain(e.p) ? rectOf(document.querySelector('.mine .hand')) : rectOf(tileEl(e.p));
          var tr = rectOf(to), big = tr && tr.width > 20 ? tr : cardBox(tr, 30);
          Sound.play('build');
          return fly(ART.card({ d: e.id }), cardBox(fr, 60), big, { dur: 650, arc: -70 }).then(function () {
            unhide(k); var n = cityCard(e.p, e.id); shake(n, 'built');
            burst(rectOf(n), [ART.TC[D(e.id).t][0], '#fff3c0', ART.TC[D(e.id).t][1]], 16);
            floatTxt(rectOf(n), esc(D(e.id).n), 'build');
            return sleep(350);
          });
        });
        break;
      case 'complete':
        enqueue(function () { Sound.play('done'); fireworks(); banner('Città completa!', esc(G().players[e.p].nick) + ' ha ' + E.TARGET + ' quartieri: questo è l’ultimo round', 'done', 2600); return sleep(2300); });
        break;
      case 'kill':
        enqueue(function () {
          var t = tokEl(e.r); Sound.play('kill');
          return fly('<span class="fdag">' + IC('dagger') + '</span>', cardBox(rectOf(el('spot')), 40), cardBox(rectOf(t), 30), { dur: 520, r0: -40, arc: -30 }).then(function () { shake(t, 'hit'); burst(rectOf(t), ['#e8553f', '#fff', '#8a1a12'], 12); floatTxt(rectOf(t), CH[e.r].n + ' ucciso!', 'bad'); return sleep(800); });
        });
        break;
      case 'robMark':
        enqueue(function () {
          var t = tokEl(e.r); Sound.play('rob');
          return fly('<span class="fdag bag">' + IC('bag') + '</span>', cardBox(rectOf(el('spot')), 40), cardBox(rectOf(t), 30), { dur: 520, r0: 0, arc: -30 }).then(function () { shake(t, 'hit'); floatTxt(rectOf(t), 'da derubare', 'gold'); return sleep(700); });
        });
        break;
      case 'swap':
        enqueue(function () {
          Sound.play('magic'); var a = rectOf(handEl(e.p) || tileEl(e.p)), b = rectOf(handEl(e.t) || tileEl(e.t));
          return Promise.all([backs(a, b, Math.min(3, e.b || 1)), backs(b, a, Math.min(3, e.a || 1), 120)]).then(function () { floatTxt(a, 'mani scambiate!', 'magic'); return sleep(300); });
        });
        break;
      case 'redraw':
        enqueue(function () { Sound.play('magic'); var a = rectOf(handEl(e.p) || tileEl(e.p)); return backs(a, rectOf(el('deck')), e.c).then(function () { return backs(rectOf(el('deck')), a, e.c); }).then(function () { floatTxt(a, 'carte nuove', 'magic'); }); });
        break;
      case 'destroy':
        enqueue(function () {
          Sound.play('boom'); var t = tileEl(e.t), cty = isMain(e.t) ? rectOf(document.querySelector('.mine .cty')) : rectOf(t);
          var box = cardBox(cty, 60);
          var f = document.createElement('div'); f.className = 'boomcard'; f.innerHTML = ART.card({ d: e.id }); if (box) { f.style.left = box.left + 'px'; f.style.top = box.top + 'px'; f.style.width = box.width + 'px'; f.style.height = box.height + 'px'; document.body.appendChild(f); setTimeout(function () { f.remove(); }, 1300); }
          burst(box, ['#ff8a3d', '#ffd23d', '#5a2a10'], 22); shake(t, 'shake'); stamp(t, 'DISTRUTTO', 'boom');
          floatTxt(rectOf(goldEl(e.p)), '−' + e.cost + ' oro', 'bad');
          return sleep(1200);
        });
        break;
      case 'roundEnd':
        enqueue(function () { banner('Fine del round ' + e.round, null, 'round small', 1400); return sleep(1100); });
        break;
      case 'over':
        enqueue(function () {
          var w = G().winners || []; Sound.play(w.indexOf(me) >= 0 ? 'win' : 'lose'); if (w.indexOf(me) >= 0) { confetti(); fireworks(); }
          return sleep(900).then(function () { App.sheet = { kind: 'over', fresh: true }; renderSheet(); });
        });
        break;
    }
  }
  function pulse() { var b = document.querySelector('.mine'); if (b) { b.classList.remove('pulse'); void b.offsetWidth; b.classList.add('pulse'); } }
  function fireworks() {
    if (reduce) return;
    var w = document.createElement('div'); w.className = 'fireworks';
    var cols = ['#f2c23c', '#e8553f', '#3f8ee8', '#3fb36a', '#a368e8', '#fff3c0'], o = '';
    for (var k = 0; k < 7; k++) {
      var x = 10 + Math.random() * 80, y = 12 + Math.random() * 40, c = cols[k % cols.length], d = (k * .28).toFixed(2), sp = '';
      for (var i = 0; i < 18; i++) { var a = i / 18 * Math.PI * 2; sp += '<i style="--x:' + Math.round(Math.cos(a) * 90) + 'px;--y:' + Math.round(Math.sin(a) * 90) + 'px;background:' + c + ';animation-delay:' + d + 's"></i>'; }
      o += '<span class="fwk" style="left:' + x.toFixed(1) + '%;top:' + y.toFixed(1) + '%">' + sp + '</span>';
    }
    w.innerHTML = o; document.body.appendChild(w); setTimeout(function () { w.remove(); }, 3600);
  }
  function confetti() {
    if (reduce) return;
    var c = document.createElement('div'); c.className = 'confetti'; var o = '';
    var cols = ['#f2c23c', '#e8553f', '#3f8ee8', '#3fb36a', '#a368e8', '#ffffff'];
    for (var i = 0; i < 70; i++) o += '<i style="left:' + (Math.random() * 100).toFixed(1) + '%;background:' + cols[i % cols.length] + ';animation-delay:' + (Math.random() * 1.2).toFixed(2) + 's;animation-duration:' + (2.2 + Math.random() * 1.6).toFixed(2) + 's;--r:' + Math.round(Math.random() * 720 - 360) + 'deg"></i>';
    c.innerHTML = o; document.body.appendChild(c); setTimeout(function () { c.remove(); }, 4500);
  }
  return { render: render, unmount: unmount, fx: fx, idle: idle, cityRow: cityRow, visChar: visChar, charState: charState, buildable: buildable, il: il, Il: Il, banner: banner, STATE_L: STATE_L, nowInfo: nowInfo };
})();
