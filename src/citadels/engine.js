/* ===== Citadels: motore delle regole (gira sull'host; lo stato è JSON) =====
   Regole ufficiali (edizione 2016, «prima partita»), da 4 a 7 giocatori: 8 personaggi, 54 quartieri base e 14 unici.
   Ogni round: scelta dei personaggi a giro (chi ha la corona sceglie per primo), poi si chiamano i personaggi dall'1 all'8
   e chi lo ha scelto lo rivela e gioca: prende 2 oro o pesca 2 carte (ne tiene 1), costruisce un quartiere e usa il potere.
   Quando una città arriva a 7 quartieri la partita finisce alla fine del round. Vince chi ha più punti. */
var CTEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  var TARGET = 7;

  /* ---------- personaggi ---------- */
  var CH = {
    1: { n: 'Assassino', p: 'Scegli un personaggio da uccidere: quando verrà chiamato salterà il turno.' },
    2: { n: 'Ladro', p: 'Scegli un personaggio da derubare: quando si rivela, gli prendi tutto l’oro. Non puoi derubare l’Assassino né il personaggio ucciso.' },
    3: { n: 'Mago', p: 'Scambia tutta la tua mano con quella di un altro giocatore, oppure scarta quante carte vuoi e pescane altrettante.' },
    4: { n: 'Re', p: 'Prendi la corona: nel prossimo round sceglierai per primo. Guadagni 1 oro per ogni quartiere nobile.', t: 'n' },
    5: { n: 'Vescovo', p: 'Il Condottiero non può distruggere i tuoi quartieri in questo round. Guadagni 1 oro per ogni quartiere religioso.', t: 'r' },
    6: { n: 'Mercante', p: 'Guadagni 1 oro in più. Guadagni 1 oro per ogni quartiere commerciale.', t: 'c' },
    7: { n: 'Architetto', p: 'Peschi 2 carte in più. Puoi costruire fino a 3 quartieri in questo turno.' },
    8: { n: 'Condottiero', p: 'Puoi distruggere un quartiere pagando 1 oro in meno del suo costo (non nelle città complete). Guadagni 1 oro per ogni quartiere militare.', t: 'm' }
  };
  var TYPES = { n: 'nobile', r: 'religioso', c: 'commerciale', m: 'militare', u: 'unico' };
  var PL = { n: 'nobili', r: 'religiosi', c: 'commerciali', m: 'militari', u: 'unici' };

  /* ---------- quartieri ---------- */
  var DIST = [];
  function add(n, t, c, k, x, u) { for (var i = 0; i < k; i++) DIST.push({ id: DIST.length, n: n, t: t, c: c, u: u || null, x: x || '' }); }
  add('Maniero', 'n', 3, 5); add('Castello', 'n', 4, 4); add('Palazzo', 'n', 5, 3);
  add('Tempio', 'r', 1, 3); add('Chiesa', 'r', 2, 3); add('Monastero', 'r', 3, 3); add('Cattedrale', 'r', 5, 2);
  add('Taverna', 'c', 1, 5); add('Mercato', 'c', 2, 4); add('Emporio', 'c', 2, 3); add('Molo', 'c', 3, 3); add('Porto', 'c', 4, 3); add('Municipio', 'c', 5, 2);
  add('Torre di guardia', 'm', 1, 3); add('Prigione', 'm', 2, 3); add('Caserma', 'm', 3, 3); add('Fortezza', 'm', 5, 2);
  add('Porta del Drago', 'u', 6, 1, 'A fine partita vale 2 punti in più.', 'dragon');
  add('Fabbrica', 'u', 5, 1, 'Paghi 1 oro in meno per costruire gli altri quartieri unici.', 'factory');
  add('Quartiere Infestato', 'u', 2, 1, 'A fine partita conta come un tipo di quartiere a tua scelta.', 'haunted');
  add('Tesoro Imperiale', 'u', 5, 1, 'A fine partita, 1 punto in più per ogni oro che hai.', 'treasury');
  add('Mastio', 'u', 3, 1, 'Il Condottiero non può distruggere il Mastio.', 'keep');
  add('Laboratorio', 'u', 5, 1, 'Una volta per turno puoi scartare 1 carta e prendere 2 oro.', 'lab');
  add('Biblioteca', 'u', 6, 1, 'Quando peschi le carte per le risorse, le tieni tutte e due.', 'library');
  add('Sala delle Mappe', 'u', 5, 1, 'A fine partita, 1 punto in più per ogni carta che hai in mano.', 'maproom');
  add('Cava', 'u', 5, 1, 'Puoi costruire quartieri uguali a quelli che hai già.', 'quarry');
  add('Scuola di Magia', 'u', 6, 1, 'Quando incassi l’oro dei quartieri, conta come il tipo che vuoi.', 'school');
  add('Fucina', 'u', 5, 1, 'Una volta per turno puoi pagare 2 oro e pescare 3 carte.', 'smithy');
  add('Statua', 'u', 3, 1, 'Se a fine partita hai la corona, vale 5 punti in più.', 'statue');
  add('Covo dei Ladri', 'u', 6, 1, 'Puoi pagarlo anche con carte della mano: ogni carta vale 1 oro.', 'den');
  add('Pozzo dei Desideri', 'u', 5, 1, 'A fine partita, 1 punto in più per ogni quartiere unico della tua città.', 'well');

  function D(id) { return DIST[id]; }
  function nick(g, p) { return g.players[p].nick; }
  function cn(r) { return CH[r].n; }
  function il(r) { return (r === 1 || r === 7 ? 'l’' : 'il ') + CH[r].n; }
  function Il(r) { var x = il(r); return x.charAt(0).toUpperCase() + x.slice(1); }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 160) g.log.splice(0, g.log.length - 160); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 40) g.fx.splice(0, g.fx.length - 40); }
  function has(P, u) { return P.city.some(function (id) { return D(id).u === u; }); }
  function owner(g, r) { for (var i = 0; i < g.players.length; i++) if (g.players[i].char === r) return i; return -1; }
  function drawN(g, k) { var o = []; while (k-- > 0 && g.deck.length) o.push(g.deck.pop()); return o; }
  function bottom(g, id) { g.deck.unshift(id); }
  function complete(P) { return P.city.length >= TARGET; }

  /* ---------- nuova partita ---------- */
  function newGame(seats, opts) {
    var g = {
      v: 1, phase: 'pick', seq: 0, turnN: 0, round: 0,
      players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, bot: !!s.bot, away: false, col: i, gold: 2, hand: [], city: [], char: null, lastChar: null }; }),
      deck: shuffle(DIST.map(function (d) { return d.id; })), crown: Math.floor(rand() * seats.length),
      pick: null, call: 0, turn: null, killed: null, robbed: null, revealed: {}, first: null, ending: false,
      log: [], logN: 0, fx: [], fxN: 0, final: null, winners: null
    };
    g.players.forEach(function (P) { P.hand = drawN(g, 4); });
    log(g, 'Ognuno riceve 2 oro e 4 carte quartiere. La corona va a ' + nick(g, g.crown) + '.', 'sys', g.crown);
    startRound(g);
    return g;
  }
  function startRound(g) {
    g.round++; g.phase = 'pick'; g.call = 0; g.turn = null; g.killed = null; g.robbed = null; g.revealed = {};
    g.players.forEach(function (P) { P.char = null; });
    var n = g.players.length, deck = shuffle([1, 2, 3, 4, 5, 6, 7, 8]), up = [], nUp = n === 4 ? 2 : n === 5 ? 1 : 0;
    while (up.length < nUp) {
      var c = deck.pop();
      if (c === 4) { deck.unshift(4); shuffle(deck); continue; }   // il Re non si scarta mai scoperto
      up.push(c);
    }
    var down = deck.pop(), order = [];
    for (var k = 0; k < n; k++) order.push((g.crown + k) % n);
    g.pick = { order: order, i: 0, avail: deck.sort(function (a, b) { return a - b; }), up: up.sort(function (a, b) { return a - b; }), down: down, out: [] };
    log(g, 'Round ' + g.round + ': scelta dei personaggi. ' + (up.length ? 'Scartati scoperti (nessuno li avrà): ' + up.map(cn).join(', ') + '. ' : '') + 'Uno è scartato coperto. Sceglie per primo ' + nick(g, order[0]) + ', che ha la corona.', 'round', g.crown);
    fx(g, { k: 'round', round: g.round, up: up.slice(), crown: g.crown });
    fx(g, { k: 'picker', p: order[0], i: 0 });
  }
  // personaggi tra cui può scegliere il giocatore di turno (il settimo vede anche quello scartato coperto)
  function choices(g) {
    var pk = g.pick; if (!pk) return [];
    var last7 = g.players.length === 7 && pk.i === 6;
    return last7 ? pk.avail.concat([pk.down]).sort(function (a, b) { return a - b; }) : pk.avail.slice();
  }
  function doPick(g, p, r) {
    var pk = g.pick, P = g.players[p], ch = choices(g);
    if (ch.indexOf(r) < 0) return 'Questo personaggio non è disponibile.';
    var last7 = g.players.length === 7 && pk.i === 6;
    P.char = r;
    if (last7) { var other = ch.filter(function (x) { return x !== r; })[0]; pk.avail = []; pk.down2 = other; }
    else pk.avail = pk.avail.filter(function (x) { return x !== r; });
    pk.i++;
    fx(g, { k: 'picked', p: p, i: pk.i });
    log(g, nick(g, p) + ' ha scelto il suo personaggio (in segreto).', 'pick', p);
    if (pk.i >= pk.order.length) {
      pk.out = pk.avail.slice(); pk.avail = [];
      g.phase = 'turns'; g.call = 0;
      log(g, 'Tutti hanno scelto. ' + nick(g, g.crown) + ' chiama i personaggi in ordine, dall’1 all’8.', 'sys', g.crown);
      fx(g, { k: 'calls' });
      nextCall(g);
    } else fx(g, { k: 'picker', p: pk.order[pk.i], i: pk.i });
    return null;
  }

  /* ---------- chiamata dei personaggi ---------- */
  function nextCall(g) {
    g.turn = null;
    while (g.call < 8) {
      g.call++;
      var r = g.call, p = owner(g, r);
      if (r === g.killed) {
        fx(g, { k: 'skip', r: r, p: p });
        log(g, 'Si chiama ' + il(r) + '… ' + (p >= 0 ? 'è stato assassinato: salta il turno.' : 'nessuno risponde: l’Assassino ha colpito a vuoto.'), 'kill', p >= 0 ? null : null);
        continue;
      }
      if (p < 0) { fx(g, { k: 'nobody', r: r }); log(g, 'Si chiama ' + il(r) + '… nessuno lo ha scelto.', 'call'); continue; }
      startTurn(g, p, r);
      return;
    }
    endRound(g);
  }
  function startTurn(g, p, r) {
    var P = g.players[p];
    g.revealed[r] = p; P.lastChar = r; g.turnN++;
    g.turn = { p: p, r: r, gathered: false, drawn: null, built: 0, max: r === 7 ? 3 : 1, used: {} };
    fx(g, { k: 'reveal', r: r, p: p });
    log(g, 'Si chiama ' + il(r) + ': è ' + nick(g, p) + '!', 'reveal', p);
    if (r === g.robbed) {
      var th = owner(g, 2), amt = P.gold;
      if (th >= 0 && th !== p) {
        P.gold = 0; g.players[th].gold += amt;
        fx(g, { k: 'rob', from: p, to: th, g: amt });
        log(g, 'Il Ladro (' + nick(g, th) + ') deruba ' + nick(g, p) + ': ' + (amt ? 'gli prende ' + amt + ' oro!' : 'ma non aveva oro.'), 'rob', th);
      }
    }
    if (r === 4) { if (g.crown !== p) { g.crown = p; fx(g, { k: 'crown', p: p }); } log(g, nick(g, p) + ' prende la corona: nel prossimo round sceglierà per primo.', 'crown', p); }
    if (r === 6) { P.gold += 1; fx(g, { k: 'gold', p: p, g: 1, why: 'merchant' }); log(g, 'Il Mercante guadagna 1 oro in più.', 'gold', p); }
    if (r === 7) { var cs = drawN(g, 2); P.hand = P.hand.concat(cs); fx(g, { k: 'cards', p: p, c: cs.length, why: 'arch' }); log(g, 'L’Architetto pesca 2 carte in più.', 'cards', p); }
  }
  // oro dei quartieri del tipo del personaggio (la Scuola di Magia conta come quel tipo)
  function incomeOf(g, p, r) {
    var t = CH[r] && CH[r].t; if (!t) return 0;
    var P = g.players[p];
    return P.city.filter(function (id) { var d = D(id); return d.t === t || d.u === 'school'; }).length;
  }
  function canIncome(g) { var T = g.turn; return !!(T && CH[T.r].t && !T.used.income); }
  function costOf(P, id) { var d = D(id); return d.t === 'u' && d.u !== 'factory' && has(P, 'factory') ? Math.max(0, d.c - 1) : d.c; }
  function canBuild(g, p, id) {
    var T = g.turn, P = g.players[p];
    if (!T || T.p !== p) return 'Non è il tuo turno.';
    if (!T.gathered) return 'Prima prendi le risorse: 2 oro oppure pesca 2 carte.';
    if (T.drawn) return 'Prima scegli quale delle due carte pescate tenere.';
    if (T.built >= T.max) return T.max > 1 ? 'Hai già costruito 3 quartieri in questo turno.' : 'Hai già costruito un quartiere in questo turno.';
    if (P.hand.indexOf(id) < 0) return 'Questa carta non è nella tua mano.';
    var d = D(id);
    if (!has(P, 'quarry') && P.city.some(function (x) { return D(x).n === d.n; })) return 'Hai già un ' + d.n + ' nella tua città: non puoi costruirne due uguali.';
    return null;
  }
  function destroyable(g, p, t, id) {
    var T = g.turn, P = g.players[p], Q = g.players[t];
    if (!T || T.p !== p || T.r !== 8) return 'Solo il Condottiero può distruggere.';
    if (T.used.destroy) return 'Hai già distrutto un quartiere in questo turno.';
    if (Q.city.indexOf(id) < 0) return 'Questo quartiere non è in quella città.';
    if (complete(Q) && t !== p) return 'Non si possono distruggere quartieri in una città completa (7 quartieri).';
    if (Q.char === 5 && g.killed !== 5 && t !== p) return 'Il Vescovo protegge i suoi quartieri in questo round.';
    if (D(id).u === 'keep') return 'Il Mastio non può essere distrutto.';
    if (P.gold < D(id).c - 1) return 'Servono ' + (D(id).c - 1) + ' oro per distruggerlo.';
    return null;
  }

  /* ---------- fine round e punteggio ---------- */
  function endRound(g) {
    g.turn = null;
    if (g.killed === 4) {
      var k = owner(g, 4);
      if (k >= 0) { if (g.crown !== k) { g.crown = k; fx(g, { k: 'crown', p: k, heir: true }); } log(g, 'Il Re era ' + nick(g, k) + ': anche se assassinato, prende la corona come erede.', 'crown', k); }
    }
    if (g.killed) { var v = owner(g, g.killed); if (v >= 0) log(g, 'Fine del round: ' + il(g.killed) + ' assassinato era ' + nick(g, v) + '.', 'kill', v); }
    if (g.ending) return endGame(g);
    fx(g, { k: 'roundEnd', round: g.round });
    startRound(g);
  }
  function typesBonus(P) {
    var base = {}, hq = false;
    P.city.forEach(function (id) { var d = D(id); if (d.u === 'haunted') hq = true; else base[d.t] = 1; });
    var all = ['n', 'r', 'c', 'm', 'u'];
    if (!hq) return all.every(function (t) { return base[t]; }) ? 3 : 0;
    return all.some(function (x) { var s = Object.assign({}, base); s[x] = 1; return all.every(function (t) { return s[t]; }); }) ? 3 : 0;
  }
  function score(g, p) {
    var P = g.players[p], o = { city: 0, types: 0, done: 0, extra: 0 };
    P.city.forEach(function (id) { o.city += D(id).c; });
    o.types = typesBonus(P);
    if (complete(P)) o.done = g.first === p ? 4 : 2;
    if (has(P, 'dragon')) o.extra += 2;
    if (has(P, 'treasury')) o.extra += P.gold;
    if (has(P, 'maproom')) o.extra += P.hand.length;
    if (has(P, 'well')) o.extra += P.city.filter(function (id) { return D(id).t === 'u'; }).length;
    if (has(P, 'statue') && g.crown === p) o.extra += 5;
    o.total = o.city + o.types + o.done + o.extra;
    return o;
  }
  function endGame(g) {
    g.phase = 'over';
    var sc = g.players.map(function (P, i) { return score(g, i); });
    var order = g.players.map(function (P, i) { return i; }).sort(function (a, b) { return sc[b].total - sc[a].total || (g.players[b].lastChar || 0) - (g.players[a].lastChar || 0) || a - b; });
    g.final = { sc: sc, order: order };
    g.winners = [order[0]];
    log(g, 'Fine della partita! Vince ' + nick(g, order[0]) + ' con ' + sc[order[0]].total + ' punti.', 'win', order[0]);
    fx(g, { k: 'over', p: order[0] });
  }

  /* ---------- azioni ---------- */
  function decider(g) {
    if (g.phase === 'pick' && g.pick) return g.pick.order[g.pick.i];
    if (g.phase === 'turns' && g.turn) return g.turn.p;
    return null;
  }
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase === 'over') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a);
    if (!r) g.seq++;
    return r;
  }
  function doAct(g, p, a) {
    var P = g.players[p], T = g.turn, cs, id, i;
    if (g.phase === 'pick') {
      if (a.a !== 'pick') return 'Adesso si scelgono i personaggi.';
      if (decider(g) !== p) return 'Non tocca a te scegliere.';
      return doPick(g, p, +a.r);
    }
    if (g.phase !== 'turns' || !T) return 'Aspetta un attimo.';
    if (T.p !== p) return 'Non è il tuo turno.';
    switch (a.a) {
      case 'gold':
        if (T.gathered) return 'Hai già preso le risorse in questo turno.';
        P.gold += 2; T.gathered = true;
        fx(g, { k: 'gold', p: p, g: 2, why: 'take' }); log(g, nick(g, p) + ' prende 2 oro.', 'gold', p); return null;
      case 'draw':
        if (T.gathered) return 'Hai già preso le risorse in questo turno.';
        cs = drawN(g, 2); T.gathered = true;
        if (!cs.length) { log(g, 'Il mazzo dei quartieri è finito.', 'sys'); return null; }
        if (has(P, 'library') || cs.length < 2) { P.hand = P.hand.concat(cs); fx(g, { k: 'cards', p: p, c: cs.length, why: 'draw' }); log(g, nick(g, p) + ' pesca ' + cs.length + ' carte' + (cs.length > 1 ? ' e grazie alla Biblioteca le tiene tutte e due.' : '.'), 'cards', p); return null; }
        T.drawn = cs; fx(g, { k: 'drawn', p: p }); log(g, nick(g, p) + ' pesca 2 carte e ne sceglie una.', 'cards', p); return null;
      case 'keep':
        if (!T.drawn) return 'Non hai carte da scegliere.';
        id = +a.id; if (T.drawn.indexOf(id) < 0) return 'Scegli una delle due carte pescate.';
        T.drawn.forEach(function (x) { if (x !== id) bottom(g, x); }); P.hand.push(id); T.drawn = null;
        fx(g, { k: 'cards', p: p, c: 1, why: 'keep' }); return null;
      case 'build': {
        id = +a.id; var err = canBuild(g, p, id); if (err) return err;
        var cost = costOf(P, id), pay = [];
        if (D(id).u === 'den' && a.cards) { pay = a.cards.map(Number).filter(function (x, k, s) { return x !== id && P.hand.indexOf(x) >= 0 && s.indexOf(x) === k; }).slice(0, cost); }
        if (P.gold < cost - pay.length) return 'Non hai abbastanza oro: ' + D(id).n + ' costa ' + cost + ' oro.';
        P.gold -= cost - pay.length; pay.forEach(function (x) { P.hand.splice(P.hand.indexOf(x), 1); bottom(g, x); });
        P.hand.splice(P.hand.indexOf(id), 1); P.city.push(id); T.built++;
        fx(g, { k: 'build', p: p, id: id, cost: cost - pay.length });
        log(g, nick(g, p) + ' costruisce ' + D(id).n + ' (' + TYPES[D(id).t] + ', ' + D(id).c + ')' + (pay.length ? ' pagando anche con ' + pay.length + ' carte' : '') + '.', 'build', p);
        if (complete(P) && g.first == null) { g.first = p; g.ending = true; fx(g, { k: 'complete', p: p }); log(g, nick(g, p) + ' completa la città con ' + TARGET + ' quartieri! La partita finirà alla fine di questo round.', 'complete', p); }
        return null;
      }
      case 'income': {
        if (!canIncome(g)) return 'Non puoi incassare adesso.';
        var amt = incomeOf(g, p, T.r); T.used.income = true; P.gold += amt;
        fx(g, { k: 'gold', p: p, g: amt, why: 'income' }); log(g, nick(g, p) + ' incassa ' + amt + ' oro dai suoi quartieri ' + PL[CH[T.r].t] + '.', 'gold', p); return null;
      }
      case 'kill': {
        if (T.r !== 1 || T.used.kill) return 'Non puoi farlo.';
        var kr = +a.r; if (!(kr >= 2 && kr <= 8)) return 'Scegli un personaggio dal 2 all’8.';
        g.killed = kr; T.used.kill = true; fx(g, { k: 'kill', r: kr, by: p }); log(g, 'L’Assassino uccide ' + il(kr) + ': chi lo ha scelto salterà il turno.', 'kill', p); return null;
      }
      case 'rob': {
        if (T.r !== 2 || T.used.rob) return 'Non puoi farlo.';
        var rr = +a.r; if (!(rr >= 3 && rr <= 8)) return 'Puoi derubare solo un personaggio dal 3 all’8.';
        if (rr === g.killed) return 'Non puoi derubare il personaggio ucciso.';
        g.robbed = rr; T.used.rob = true; fx(g, { k: 'robMark', r: rr, by: p }); log(g, 'Il Ladro sceglie di derubare ' + il(rr) + ': gli prenderà tutto l’oro quando si rivela.', 'rob', p); return null;
      }
      case 'swap': {
        if (T.r !== 3 || T.used.magic) return 'Non puoi farlo.';
        var t = +a.t; if (!g.players[t] || t === p) return 'Scegli un altro giocatore.';
        var h = P.hand; P.hand = g.players[t].hand; g.players[t].hand = h; T.used.magic = true;
        fx(g, { k: 'swap', p: p, t: t, a: P.hand.length, b: h.length }); log(g, 'Il Mago (' + nick(g, p) + ') scambia la sua mano (' + h.length + ' carte) con quella di ' + nick(g, t) + ' (' + P.hand.length + ' carte).', 'magic', p); return null;
      }
      case 'redraw': {
        if (T.r !== 3 || T.used.magic) return 'Non puoi farlo.';
        var ids = (a.ids || []).map(Number).filter(function (x, k, s) { return P.hand.indexOf(x) >= 0 && s.indexOf(x) === k; });
        if (!ids.length) return 'Scegli almeno una carta da scartare.';
        ids.forEach(function (x) { P.hand.splice(P.hand.indexOf(x), 1); bottom(g, x); });
        cs = drawN(g, ids.length); P.hand = P.hand.concat(cs); T.used.magic = true;
        fx(g, { k: 'redraw', p: p, c: cs.length }); log(g, 'Il Mago (' + nick(g, p) + ') scarta ' + ids.length + (ids.length === 1 ? ' carta e ne pesca una nuova.' : ' carte e ne pesca altrettante.'), 'magic', p); return null;
      }
      case 'destroy': {
        var tt = +a.t, did = +a.id, e2 = g.players[tt] ? destroyable(g, p, tt, did) : 'Scegli una città.'; if (e2) return e2;
        var dc = Math.max(0, D(did).c - 1), Q = g.players[tt];
        P.gold -= dc; Q.city.splice(Q.city.indexOf(did), 1); bottom(g, did); T.used.destroy = true;
        fx(g, { k: 'destroy', p: p, t: tt, id: did, cost: dc });
        log(g, 'Il Condottiero (' + nick(g, p) + ') distrugge ' + D(did).n + (tt === p ? ' nella propria città' : ' di ' + nick(g, tt)) + ' pagando ' + dc + ' oro.', 'destroy', p); return null;
      }
      case 'lab': {
        if (!has(P, 'lab') || T.used.lab) return 'Non puoi farlo.';
        id = +a.id; if (P.hand.indexOf(id) < 0) return 'Scegli una carta della tua mano.';
        P.hand.splice(P.hand.indexOf(id), 1); bottom(g, id); P.gold += 2; T.used.lab = true;
        fx(g, { k: 'gold', p: p, g: 2, why: 'lab' }); log(g, nick(g, p) + ' usa il Laboratorio: scarta una carta e prende 2 oro.', 'gold', p); return null;
      }
      case 'smithy': {
        if (!has(P, 'smithy') || T.used.smithy) return 'Non puoi farlo.';
        if (P.gold < 2) return 'Servono 2 oro.';
        P.gold -= 2; cs = drawN(g, 3); P.hand = P.hand.concat(cs); T.used.smithy = true;
        fx(g, { k: 'cards', p: p, c: cs.length, why: 'smithy' }); log(g, nick(g, p) + ' usa la Fucina: paga 2 oro e pesca 3 carte.', 'cards', p); return null;
      }
      case 'end': {
        if (!T.gathered) return 'Prima prendi le risorse: 2 oro oppure pesca 2 carte.';
        if (T.drawn) return 'Prima scegli quale delle due carte pescate tenere.';
        if (canIncome(g)) { var am = incomeOf(g, p, T.r); if (am) { T.used.income = true; P.gold += am; fx(g, { k: 'gold', p: p, g: am, why: 'income' }); log(g, nick(g, p) + ' incassa ' + am + ' oro dai suoi quartieri ' + PL[CH[T.r].t] + '.', 'gold', p); } }
        fx(g, { k: 'endTurn', p: p, r: T.r });
        nextCall(g); return null;
      }
    }
    return 'Mossa sconosciuta.';
  }

  return { newGame: newGame, act: act, decider: decider, choices: choices, owner: owner, score: score, incomeOf: incomeOf, canIncome: canIncome, costOf: costOf, canBuild: canBuild, destroyable: destroyable,
    complete: complete, has: has, D: D, DIST: DIST, CH: CH, TYPES: TYPES, PL: PL, TARGET: TARGET, setRandom: setRandom, shuffle: shuffle, startRound: startRound, _next: nextCall, _endGame: endGame };
})();
if (typeof module !== 'undefined') module.exports = CTEngine;
