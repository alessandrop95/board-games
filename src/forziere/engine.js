/* ===== Il Forziere Maledetto: motore delle regole (gira sull'host; lo stato è JSON) =====
   Da 4 a 8 giocatori, ruoli segreti. Due flotte rivali, Levante e Ponente, vogliono portare il Forziere
   fino alla propria bandiera sul tracciato; il Pirata (in 5 e 7) o i due Corsari (in 4, 6 e 8) giocano da soli:
   vogliono dobloni e il Forziere vicino al centro.
   - Tracciato: il Forziere parte da 0; la bandiera di Levante sta a −F, quella di Ponente a +F (F = 5 in 4–5
     giocatori, 6 con più giocatori). Quando una nave affonda il Forziere si sposta del valore della nave verso la
     bandiera avversaria della flotta del capitano affondato (+1 se era un Ammiraglio); se affonda il Pirata, verso
     la bandiera di chi l'ha affondato.
   - Ogni nave ha valore (passi del Forziere), gittata, munizioni (carte Attacco per turno) e barili (scafo).
   - Turno: senza nave se ne prende una (dalla fila di 3 o dal mazzo delle navi), si pescano 2 carte, si giocano
     le carte, a fine turno si tengono al massimo 5 carte.
   - Chi affonda una nave prende un doblone dalla Clessidra. Un ruolo ancora coperto vale 1 doblone.
   - Il mazzo che finisce toglie un doblone dalla Clessidra e avvicina le bandiere al centro.
   - Fine: il Pirata o un Corsaro con 4 dobloni vince subito; dopo un affondamento il Forziere su una bandiera fa
     vincere quella flotta; con la Clessidra vuota arriva il Gorgo e, al primo giocatore che non sa rispondere,
     si guarda dove sta il Forziere. */
var FZEngine = (function () {
  var rand = Math.random;
  function setRandom(f) { rand = f || Math.random; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(rand() * (i + 1)), t = a[i]; a[i] = a[j]; a[j] = t; } return a; }

  /* ---------- dati ---------- */
  // k: atk = Attacco (rosso), def = Difesa (blu), act = Azione (nero), eq = Equipaggiamento (verde), multi = Attacco o Difesa
  var T = {
    bordata: { n: 'Bordata', k: 'atk', c: 18, d: 'Colpo contro una nave entro la tua gittata.' },
    arrembaggio: { n: 'Arrembaggio', k: 'atk', c: 2, d: 'Colpo contro una nave a distanza 1. Se va a segno prendi anche 1 carta a caso dalla sua mano.' },
    incatenate: { n: 'Palle incatenate', k: 'atk', c: 2, d: 'Colpo contro una nave entro la tua gittata. Se va a segno, il bersaglio perde anche un suo Equipaggiamento.' },
    moschetto: { n: 'Moschetto', k: 'multi', c: 4, d: 'Attacco: colpo contro una nave a distanza 1. Oppure Difesa: annulla un colpo, come una Virata.' },
    virata: { n: 'Virata', k: 'def', c: 10, d: 'Fuori dal tuo turno: annulla un colpo diretto a te.' },
    bianca: { n: 'Bandiera bianca', k: 'def', c: 2, d: 'Fuori dal tuo turno: annulla qualsiasi carta giocata contro di te, anche se non è un colpo.' },
    rum: { n: 'Rum', k: 'act', c: 5, d: 'Recuperi 1 barile, fino al massimo della tua nave.' },
    vedetta: { n: 'Vedetta', k: 'act', c: 3, d: 'Peschi 2 carte.' },
    saccheggio: { n: 'Saccheggio', k: 'act', c: 3, d: 'Prendi 1 carta a una nave a distanza 1: a caso dalla mano, oppure un suo Equipaggiamento.' },
    sabotaggio: { n: 'Sabotaggio', k: 'act', c: 3, d: 'Un giocatore con una nave, a qualsiasi distanza, scarta 1 carta: a caso dalla mano, oppure un Equipaggiamento.' },
    burrasca: { n: 'Burrasca', k: 'act', c: 1, d: 'Colpo contro tutte le altre navi: ognuna perde 1 barile, se non lo evita.' },
    mostro: { n: 'Mostro degli abissi', k: 'act', c: 1, d: 'Ogni altra nave deve scartare una Bordata, altrimenti perde 1 barile.' },
    sfida: { n: 'Sfida a sciabole', k: 'act', c: 2, d: 'Sfidi un giocatore con una nave, a qualsiasi distanza: a turno, cominciando da lui, scartate una Bordata. Il primo che non lo fa perde 1 barile.' },
    spettro: { n: 'Vascello spettrale', k: 'act', c: 2, d: 'Metti il Vascello spettrale sulla nave di un altro giocatore (o spostalo, se è già in mare). Se è già arrivato il Gorgo, peschi solo 1 carta.' },
    porto: { n: 'Porto franco', k: 'act', c: 1, d: 'Tutte le navi recuperano 1 barile, poi peschi 1 carta.' },
    rifornimento: { n: 'Rifornimento', k: 'act', c: 2, d: 'Una nave a tua scelta (anche la tua) recupera 1 barile, anche oltre il massimo.' },
    lettera: { n: 'Lettera intercettata', k: 'act', c: 1, d: 'Guardi di nascosto il ruolo di un altro giocatore.' },
    cannoniera: { n: 'Cannoniera', k: 'eq', c: 2, d: 'I colpi delle tue carte Attacco tolgono 1 barile in più.' },
    coffa: { n: 'Coffa di vedetta', k: 'eq', c: 2, d: 'La gittata della tua nave aumenta di 1.' },
    nebbia: { n: 'Banco di nebbia', k: 'eq', c: 2, d: 'Gli altri ti vedono a distanza +1.' },
    polena: { n: 'Polena portafortuna', k: 'eq', c: 2, d: 'Quando ti arriva un colpo si scopre la prima carta del mazzo: se ha l’Ancora, il colpo va a vuoto.' },
    fasciame: { n: 'Fasciame di quercia', k: 'eq', c: 1, d: 'La tua nave tiene 1 barile in più. Quando lo giochi recuperi 1 barile.' },
    cassa: { n: 'Cassa di munizioni', k: 'eq', c: 1, d: 'Puoi giocare 1 carta Attacco in più per turno.' }
  };
  var ORDER = ['bordata', 'arrembaggio', 'incatenate', 'moschetto', 'virata', 'bianca', 'rum', 'vedetta', 'saccheggio', 'sabotaggio', 'burrasca', 'mostro', 'sfida', 'spettro', 'porto', 'rifornimento', 'lettera', 'cannoniera', 'coffa', 'nebbia', 'polena', 'fasciame', 'cassa'];
  // simbolo nell'angolo: A Ancora (1 carta su 2), T Timone (1 su 4), X Teschio (1 su 8), P Perla (1 su 8)
  var SYM = { A: 'Ancora', T: 'Timone', X: 'Teschio', P: 'Perla' };
  var CARDS = (function () {
    var out = [], pat = ['A', 'T', 'A', 'X', 'A', 'T', 'A', 'P'];
    ORDER.forEach(function (t) { for (var i = 0; i < T[t].c; i++) out.push({ t: t, s: pat[out.length % 8] }); });
    return out;
  })();
  // navi: f = passi del Forziere quando affonda, g = gittata, m = munizioni, b = barili
  var SHIPS = [
    { n: 'Rondine', f: 1, g: 2, m: 1, b: 4 },
    { n: 'Tartaruga', f: 2, g: 1, m: 1, b: 6 },
    { n: 'Gabbiano', f: 1, g: 2, m: 1, b: 3, a: 'fog', d: 'Gli altri ti vedono a distanza +1.' },
    { n: 'Squalo', f: 2, g: 1, m: 2, b: 5, a: 'gun', d: '+1 cannone: i colpi delle tue carte Attacco tolgono 1 barile in più.' },
    { n: 'Albatros', f: 2, g: 3, m: 1, b: 4 },
    { n: 'Delfino', f: 1, g: 1, m: 2, b: 4, a: 'gift', d: 'Quando la prendi peschi 2 carte.' },
    { n: 'Medusa', f: 2, g: 2, m: 2, b: 4, a: 'sting', d: 'Quando perdi barili per un colpo peschi 1 carta.' },
    { n: 'Fortezza', f: 3, g: 1, m: 3, b: 6, a: 'gun', d: '+1 cannone: i colpi delle tue carte Attacco tolgono 1 barile in più.' },
    { n: 'Sirena', f: 2, g: 2, m: 2, b: 5 },
    { n: 'Lucciola', f: 1, g: 1, m: 1, b: 5, a: 'lamp', d: 'All’inizio del turno peschi 1 carta in più.' },
    { n: 'Uragano', f: 3, g: 3, m: 2, b: 5 },
    { n: 'Leone di mare', f: 3, g: 2, m: 2, b: 6 },
    { n: 'Tridente', f: 2, g: 2, m: 3, b: 4 },
    { n: 'Regina degli Abissi', f: 3, g: 3, m: 3, b: 5, a: 'gun', d: '+1 cannone: i colpi delle tue carte Attacco tolgono 1 barile in più.' }
  ];
  // capitani: s = nave di partenza
  var CAPS = [
    { n: 'Nina Scirocco', s: 0, a: 'nina', d: 'Ogni volta che perdi un barile peschi 1 carta.' },
    { n: 'Ugo Bonaccia', s: 1, a: 'ugo', d: 'Il Rum ti fa recuperare 2 barili invece di 1.' },
    { n: 'Lia Maretta', s: 2, a: 'lia', d: 'Puoi usare le Bordate come Virate e le Virate come Bordate.' },
    { n: 'Bruno Spada', s: 3, a: 'bruno', d: 'Puoi giocare 1 carta Attacco in più per turno.' },
    { n: 'Sveva Tramontana', s: 4, a: 'sveva', d: 'Vedi tutti gli altri a distanza −1.' },
    { n: 'Tito Corallo', s: 5, a: 'tito', d: 'All’inizio del turno peschi 3 carte invece di 2.' },
    { n: 'Greta Fortunale', s: 6, a: 'greta', d: 'Quando un altro giocatore ti fa perdere barili, prendi 1 carta a caso dalla sua mano.' },
    { n: 'Oscar Libeccio', s: 7, a: 'oscar', d: 'Per evitare i tuoi colpi servono 2 Virate.' },
    { n: 'Mira Salsedine', s: 8, a: 'mira', d: 'Gli Equipaggiamenti degli altri giocatori non hanno effetto contro di te.' },
    { n: 'Dario Risacca', s: 9, a: 'dario', d: 'Quando affonda la nave di un altro giocatore peschi 2 carte.' },
    { n: 'Elsa Bufera', s: 10, a: 'elsa', d: 'Quando un tuo colpo va a segno peschi 1 carta.' },
    { n: 'Remo Abisso', s: 11, a: 'remo', d: 'Il Vascello spettrale non si ferma mai sulla tua nave: passa subito oltre.' }
  ];
  var ROLES = {
    AL: { n: 'Ammiraglio di Levante', s: 'Ammiraglio', nat: 'L', lead: true },
    UL: { n: 'Ufficiale di Levante', s: 'Ufficiale', nat: 'L' },
    AP: { n: 'Ammiraglio di Ponente', s: 'Ammiraglio', nat: 'P', lead: true },
    UP: { n: 'Ufficiale di Ponente', s: 'Ufficiale', nat: 'P' },
    PI: { n: 'Pirata', s: 'Pirata', nat: null, solo: true },
    CL: { n: 'Corsaro di Levante', s: 'Corsaro', nat: 'L', solo: true },
    CP: { n: 'Corsaro di Ponente', s: 'Corsaro', nat: 'P', solo: true }
  };
  var NAT = { L: 'Levante', P: 'Ponente' };
  var SETUP = {
    4: { r: ['AL', 'AP', 'CL', 'CP'], glass: 7, flag: 5 },
    5: { r: ['AL', 'AP', 'UP', 'UL', 'PI'], glass: 7, flag: 5 },
    6: { r: ['AL', 'AP', 'UP', 'UL', 'CL', 'CP'], glass: 8, flag: 6 },
    7: { r: ['AL', 'AP', 'UP', 'UP', 'UL', 'UL', 'PI'], glass: 9, flag: 6 },
    8: { r: ['AL', 'AP', 'UP', 'UP', 'UL', 'UL', 'CL', 'CP'], glass: 10, flag: 6 }
  };
  var KEEP = ['cannoniera', 'coffa', 'cassa', 'nebbia', 'polena', 'fasciame'];

  /* ---------- utilità ---------- */
  function ty(id) { return CARDS[id].t; }
  function kind(id) { return T[ty(id)].k; }
  function nick(g, p) { return g.players[p].nick; }
  function log(g, t, k, p) { g.log.push({ n: ++g.logN, t: t, k: k || '', p: p == null ? null : p }); if (g.log.length > 120) g.log.splice(0, g.log.length - 120); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 24) g.fx.splice(0, g.fx.length - 24); }
  function cap(g, p) { return CAPS[g.players[p].cap]; }
  function isCap(g, p, a) { return g.players[p] && CAPS[g.players[p].cap].a === a; }
  function ship(g, p) { var s = g.players[p].ship; return s == null ? null : SHIPS[s]; }
  function shipIs(g, p, a) { var s = ship(g, p); return !!(s && s.a === a); }
  function hasEq(g, p, t) { var P = g.players[p]; for (var i = 0; i < P.eq.length; i++) if (ty(P.eq[i]) === t) return P.eq[i]; return null; }
  // equipaggiamento di p che ha effetto contro q (Mira ignora quelli degli altri)
  function eqVs(g, p, t, q) { if (q != null && q !== p && isCap(g, q, 'mira')) return null; return hasEq(g, p, t); }
  function maxBar(g, p) { var s = ship(g, p); return s ? s.b + (hasEq(g, p, 'fasciame') != null ? 1 : 0) : 0; }
  function nat(role) { return ROLES[role].nat; }
  function roleName(r) { return ROLES[r].n; }
  function nextIdx(g, p) { return (p + 1) % g.players.length; }
  function dbl(P) { return P.dbl + (P.up ? 0 : 1); }   // il ruolo coperto vale un doblone
  function solo(P) { return !!ROLES[P.role].solo; }
  function idxs(g) { return g.players.map(function (P, i) { return i; }); }

  /* ---------- mazzo ---------- */
  function deckEnd(g) {
    if (g.glass > 0) g.glass--;
    if (g.flag > 2) g.flag--;
    log(g, 'Il mazzo è finito: un doblone lascia la Clessidra (' + g.glass + ' rimasti) e le bandiere si avvicinano al centro (' + g.flag + ').', 'sys');
    fx(g, { k: 'deckend', glass: g.glass, flag: g.flag });
    g.deck = shuffle(g.disc.splice(0));
    if (g.glass === 0) startGorgo(g);
  }
  function drawCard(g) {
    if (!g.deck.length) { if (!g.disc.length) return null; deckEnd(g); if (!g.deck.length) return null; }
    return g.deck.pop();
  }
  function give(g, p, n, why) {
    var P = g.players[p], got = 0;
    for (var i = 0; i < n; i++) { var c = drawCard(g); if (c == null) break; P.hand.push(c); got++; }
    if (got) fx(g, { k: 'draw', p: p, c: got, why: why || '' });
    return got;
  }
  function discardHand(g, p, id) { var P = g.players[p], i = P.hand.indexOf(id); if (i >= 0) { P.hand.splice(i, 1); g.disc.push(id); return true; } return false; }
  function discardEq(g, p, id) { var P = g.players[p], i = P.eq.indexOf(id); if (i >= 0) { P.eq.splice(i, 1); g.disc.push(id); return true; } return false; }
  function topCheck(g) { var c = drawCard(g); if (c == null) return null; g.disc.push(c); return c; }

  /* ---------- distanze ---------- */
  function withShip(g) { return idxs(g).filter(function (i) { return g.players[i].ship != null; }); }
  function distance(g, a, b) {
    if (a === b) return 0;
    var ring = withShip(g); if (ring.indexOf(a) < 0) ring.push(a); if (ring.indexOf(b) < 0) ring.push(b);
    ring.sort(function (x, y) { return x - y; });
    var ia = ring.indexOf(a), ib = ring.indexOf(b), k = Math.abs(ia - ib), d = Math.min(k, ring.length - k);
    if (eqVs(g, b, 'nebbia', a) != null) d++;
    if (shipIs(g, b, 'fog')) d++;
    if (isCap(g, a, 'sveva')) d--;
    return Math.max(1, d);
  }
  function range(g, a, b) { var s = ship(g, a); if (!s) return 0; return s.g + (eqVs(g, a, 'coffa', b) != null ? 1 : 0); }
  function ammo(g, p) { var s = ship(g, p); if (!s) return 0; return s.m + (hasEq(g, p, 'cassa') != null ? 1 : 0) + (isCap(g, p, 'bruno') ? 1 : 0); }
  function cannons(g, p, t) { return (eqVs(g, p, 'cannoniera', t) != null ? 1 : 0) + (shipIs(g, p, 'gun') ? 1 : 0); }

  /* ---------- nuova partita ---------- */
  function newGame(seats, opts) {
    var n = seats.length, S = SETUP[Math.max(4, Math.min(8, n))];
    var roles = shuffle(S.r.slice(0, n));
    var caps = shuffle(CAPS.map(function (c, i) { return i; })).slice(0, n);
    var g = {
      v: 1, phase: 'play', seq: 0, turnN: 0, fx: [], fxN: 0, log: [], logN: 0,
      opts: {}, players: [], deck: shuffle(CARDS.map(function (c, i) { return i; })), disc: [],
      ships: [], row: [], chest: 0, flag: S.flag, glass: S.glass, spectre: null, gorgo: null,
      turn: 0, step: 'start', shots: 0, pend: null, winners: null, final: null, hx: {}
    };
    seats.forEach(function (s, i) {
      g.players.push({ uid: s.uid, nick: s.nick, bot: !!s.bot, col: i, role: roles[i], up: false, cap: caps[i], ship: CAPS[caps[i]].s, bar: 0, hand: [], eq: [], dbl: 0, seen: {}, away: false });
    });
    g.players.forEach(function (P, i) { P.bar = SHIPS[P.ship].b; });
    var used = g.players.map(function (P) { return P.ship; });
    g.ships = shuffle(SHIPS.map(function (s, i) { return i; }).filter(function (i) { return used.indexOf(i) < 0; }));
    g.row = g.ships.splice(0, 3);
    var al = 0; g.players.forEach(function (P, i) { if (P.role === 'AL') al = i; });
    g.players[al].up = true;
    for (var k = 0; k < n; k++) { var p = (al + k) % n; give(g, p, k >= 5 ? 5 : 4); }
    g.fx = []; fx(g, { k: 'deal' });
    log(g, 'Si salpa! ' + nick(g, al) + ' è l’' + roleName('AL') + ' e comincia. Bandiere a ' + g.flag + ' passi dal centro, ' + g.glass + ' dobloni nella Clessidra.', 'sys');
    startTurn(g, al);
    return g;
  }

  /* ---------- turno ---------- */
  function startTurn(g, p) {
    g.turn = p; g.turnN++; g.shots = 0; g.step = 'start'; g.pend = null; g.spectreRev = null;
    fx(g, { k: 'turn', p: p });
    proceed(g);
  }
  // fa avanzare il turno finché serve una scelta di qualcuno
  function proceed(g) {
    for (var guard = 0; guard < 12 && g.phase === 'play' && !g.pend; guard++) {
      var p = g.turn, P = g.players[p];
      if (g.step === 'start') {
        if (g.gorgo && g.gorgo.at === p) { if (!gorgoCheck(g, p)) return; continue; }
        if (g.spectre && g.spectre.on === p && P.ship != null) { spectreReveal(g, p); if (g.step === 'spectre') return; continue; }
        g.step = 'ship'; continue;
      }
      if (g.step === 'ship') { if (P.ship == null) return; g.step = 'draw'; continue; }
      if (g.step === 'draw') {
        var n = isCap(g, p, 'tito') ? 3 : 2; if (shipIs(g, p, 'lamp')) n++;
        give(g, p, n, 'turn');
        log(g, nick(g, p) + ' pesca ' + n + ' carte.', 'draw', p);
        g.step = 'play'; continue;
      }
      if (g.step === 'sunk') { if (P.hand.length <= 5) { finishTurn(g, p); continue; } return; }
      return;
    }
  }
  function finishTurn(g, p) {
    var P = g.players[p];
    if (!P.hand.length) { give(g, p, 1, 'adrift'); log(g, nick(g, p) + ' è alla deriva: pesca 1 carta.', 'draw', p); }
    if (g.phase !== 'play') return;
    startTurn(g, nextIdx(g, p));
  }
  // chi resta senza carte fuori dal suo turno pesca subito
  function adrift(g) {
    if (g.pend || g.phase !== 'play') return;
    g.players.forEach(function (P, i) { if (i !== g.turn && !P.hand.length) { if (give(g, i, 1, 'adrift')) log(g, P.nick + ' è alla deriva: pesca 1 carta.', 'draw', i); } });
  }

  /* ---------- vascello spettrale e Gorgo ---------- */
  function spectreReveal(g, p) {
    var c = topCheck(g); if (c == null) { g.step = 'ship'; return; }
    g.spectreRev = c; g.step = 'spectre';
    log(g, 'Il Vascello spettrale è sulla nave di ' + nick(g, p) + ': esce ' + T[ty(c)].n + ' (' + SYM[CARDS[c].s] + ').', 'ghost', p);
    fx(g, { k: 'reveal', p: p, c: c, why: 'spectre' });
    if (!matching(g, p, CARDS[c].s).length) spectreFail(g, p);
  }
  function matching(g, p, s) { return g.players[p].hand.filter(function (id) { return CARDS[id].s === s; }); }
  function nextShip(g, from, skipRemo) {
    var n = g.players.length;
    for (var k = 1; k <= n; k++) { var q = (from + k) % n; if (g.players[q].ship != null && !(skipRemo && isCap(g, q, 'remo'))) return q; }
    return null;
  }
  function moveSpectre(g, from) {
    var q = nextShip(g, from, true);
    if (q == null || q === from) { g.spectre = null; fx(g, { k: 'spectre', on: null }); return; }
    g.spectre = { on: q }; fx(g, { k: 'spectre', on: q, from: from });
    log(g, 'Il Vascello spettrale passa sulla nave di ' + nick(g, q) + '.', 'ghost', q);
  }
  function spectreAnswer(g, p, id) {
    var s = CARDS[g.spectreRev].s;
    if (id != null) {
      if (g.players[p].hand.indexOf(id) < 0 || CARDS[id].s !== s) return 'Serve una carta con il simbolo ' + SYM[s] + '.';
      log(g, nick(g, p) + ' risponde mostrando ' + T[ty(id)].n + ' (' + SYM[s] + ').', 'ghost', p);
      fx(g, { k: 'answer', p: p, c: id });
      g.spectreRev = null; moveSpectre(g, p); g.step = 'ship'; return null;
    }
    spectreFail(g, p); return null;
  }
  function spectreFail(g, p) {
    log(g, nick(g, p) + ' non risponde al Vascello spettrale: perde 2 barili e il vascello svanisce.', 'ghost', p);
    g.spectre = null; g.spectreRev = null; fx(g, { k: 'spectre', on: null, hit: p });
    g.step = 'ship';
    damage(g, p, 2, null, 'ghost');
  }
  function startGorgo(g) {
    if (g.gorgo || g.phase !== 'play') return;
    var at = nextIdx(g, g.turn);
    g.gorgo = { at: at }; g.spectre = null;
    log(g, 'La Clessidra è vuota: si apre il Gorgo! Da ' + nick(g, at) + ', all’inizio di ogni turno si scopre una carta: chi non sa rispondere fa finire la partita.', 'end');
    fx(g, { k: 'gorgo', at: at });
  }
  // true se si può continuare il turno
  function gorgoCheck(g, p) {
    var c = topCheck(g); if (c == null) { g.step = 'ship'; return true; }
    var s = CARDS[c].s, m = matching(g, p, s);
    fx(g, { k: 'reveal', p: p, c: c, why: 'gorgo' });
    if (m.length) {
      log(g, 'Il Gorgo scopre ' + T[ty(c)].n + ' (' + SYM[s] + '): ' + nick(g, p) + ' risponde con ' + T[ty(m[0])].n + '.', 'ghost', p);
      fx(g, { k: 'answer', p: p, c: m[0] });
      g.gorgo.at = nextIdx(g, p); g.step = 'ship'; return true;
    }
    log(g, 'Il Gorgo scopre ' + T[ty(c)].n + ' (' + SYM[s] + ') e ' + nick(g, p) + ' non sa rispondere: la partita finisce!', 'end', p);
    endGame(g, 'gorgo'); return false;
  }

  /* ---------- danni e affondamenti ---------- */
  function heal(g, p, n, over) { var P = g.players[p]; if (P.ship == null) return 0; var to = over ? P.bar + n : Math.min(maxBar(g, p), P.bar + n), h = Math.max(0, to - P.bar); P.bar += h; if (h) fx(g, { k: 'heal', p: p, n: h }); return h; }
  function damage(g, t, n, by, why) {
    var P = g.players[t]; if (P.ship == null || n <= 0 || g.phase !== 'play') return;
    var lost = Math.min(n, P.bar); P.bar -= lost;
    fx(g, { k: 'hit', p: t, n: lost, by: by, why: why || '' });
    if (isCap(g, t, 'nina') && lost) give(g, t, lost, 'nina');
    if (why === 'shot' && shipIs(g, t, 'sting')) give(g, t, 1, 'sting');
    if (by != null && by !== t && isCap(g, t, 'greta') && g.players[by].hand.length) {
      var h = g.players[by].hand, c = h.splice(Math.floor(rand() * h.length), 1)[0]; P.hand.push(c);
      fx(g, { k: 'steal', p: t, from: by }); log(g, P.nick + ' prende una carta a ' + nick(g, by) + '.', 'act', t);
    }
    if (P.bar <= 0) sink(g, t, by);
  }
  function sink(g, t, by) {
    var P = g.players[t], S = ship(g, t), role = P.role, wasHidden = !P.up;
    P.up = true;
    var steps = S.f + (ROLES[role].lead ? 1 : 0), dir = 0;
    if (role === 'PI') { if (by != null && by !== t) { var bn = nat(g.players[by].role); dir = bn === 'L' ? -1 : bn === 'P' ? 1 : 0; } }
    else dir = nat(role) === 'L' ? 1 : -1;
    var from = g.chest;
    g.chest = Math.max(-9, Math.min(9, g.chest + dir * steps));
    log(g, 'La ' + S.n + ' di ' + P.nick + ' affonda' + (by != null && by !== t ? ' sotto i colpi di ' + nick(g, by) : '') + '! ' + (wasHidden ? 'Era ' : 'È ') + (role === 'AL' || role === 'AP' ? 'l’' : role === 'PI' ? 'il ' : 'un ') + roleName(role) + '. ' +
      (dir ? 'Il Forziere si sposta di ' + steps + (steps > 1 ? ' passi' : ' passo') + ' verso ' + (dir < 0 ? 'Levante' : 'Ponente') + '.' : 'Il Forziere resta dov’è.'), 'sink', t);
    fx(g, { k: 'sink', p: t, by: by, role: role, from: from, to: g.chest, ship: P.ship });
    // promozione: l'Ammiraglio affondato scambia il ruolo con il primo Ufficiale scoperto della sua flotta
    if (role === 'AL' || role === 'AP') {
      var off = role === 'AL' ? 'UL' : 'UP', n = g.players.length;
      for (var k = 1; k < n; k++) { var q = (t + k) % n, Q = g.players[q]; if (Q.role === off && Q.up) { Q.role = role; P.role = off; log(g, Q.nick + ' è promosso ' + roleName(role) + ' al posto di ' + P.nick + '.', 'sys', q); fx(g, { k: 'promo', p: q, from: t }); break; } }
    }
    g.ships.push(P.ship); P.ship = null; P.bar = 0;
    if (P.eq.length > 1) {   // tiene un solo Equipaggiamento, il più utile
      var keep = P.eq.slice().sort(function (a, b) { return KEEP.indexOf(ty(a)) - KEEP.indexOf(ty(b)); })[0];
      P.eq.slice().forEach(function (id) { if (id !== keep) discardEq(g, t, id); });
    }
    if (g.spectre && g.spectre.on === t) { if (by == null) g.spectre = null; else moveSpectre(g, t); }
    g.players.forEach(function (Q, q) { if (q !== t && isCap(g, q, 'dario')) give(g, q, 2, 'dario'); });
    if (by != null && by !== t) { takeDoubloon(g, by); }
    else if (g.glass > 0) { g.glass--; fx(g, { k: 'glass', glass: g.glass }); log(g, 'Nessuno prende il doblone: uno lascia la Clessidra (' + g.glass + ' rimasti).', 'sys'); if (g.glass === 0) startGorgo(g); }
    if (g.phase !== 'play') return;
    if (wealth(g)) return;
    if (g.chest <= -g.flag) { log(g, 'Il Forziere raggiunge la bandiera di Levante!', 'end'); endGame(g, 'flagL'); return; }
    if (g.chest >= g.flag) { log(g, 'Il Forziere raggiunge la bandiera di Ponente!', 'end'); endGame(g, 'flagP'); return; }
    if (t === g.turn && g.step === 'play') g.step = 'sunk';
  }
  function takeDoubloon(g, p) {
    var from = g.glass > 0 ? 'glass' : 'bank';
    if (g.glass > 0) g.glass--;
    g.players[p].dbl++;
    fx(g, { k: 'doubloon', p: p, from: from, glass: g.glass });
    log(g, nick(g, p) + ' prende un doblone' + (from === 'glass' ? ' dalla Clessidra (' + g.glass + ' rimasti).' : '.'), 'gold', p);
    if (g.glass === 0 && from === 'glass') startGorgo(g);
  }
  function wealth(g) {
    for (var i = 0; i < g.players.length; i++) { var P = g.players[i]; if (solo(P) && dbl(P) >= 4) { log(g, P.nick + ' ha 4 dobloni: è il ' + roleName(P.role) + ' e vince da solo!', 'end', i); endGame(g, 'rich', i); return true; } }
    return false;
  }

  /* ---------- fine della partita ---------- */
  function members(g, n) { return idxs(g).filter(function (i) { var r = g.players[i].role; return nat(r) === n && !ROLES[r].solo; }); }
  function endGame(g, how, who) {
    if (g.phase === 'over') return;
    var res = { how: how, chest: g.chest, flag: g.flag, team: null, solo: null, note: '' };
    if (how === 'rich') { res.solo = who; res.note = 'ricchezza'; }
    else if (how === 'flagL' || how === 'flagP') res.team = how === 'flagL' ? 'L' : 'P';
    else {
      g.players.forEach(function (P) { if (!P.up) { P.up = true; P.dbl++; } });
      var c = g.chest, pir = idxs(g).filter(function (i) { return g.players[i].role === 'PI'; })[0];
      var corsL = idxs(g).filter(function (i) { return g.players[i].role === 'CL'; })[0], corsP = idxs(g).filter(function (i) { return g.players[i].role === 'CP'; })[0];
      if (c <= -2) res.team = 'L';
      else if (c >= 2) res.team = 'P';
      else if (c === 0) {
        if (pir != null) res.solo = pir;
        else res.solo = g.players[corsP].dbl > g.players[corsL].dbl ? corsP : corsL;
      } else {
        var side = c < 0 ? 'L' : 'P', s = pir != null ? pir : (side === 'L' ? corsL : corsP);
        var poor = Math.min.apply(null, members(g, side).map(function (i) { return g.players[i].dbl; }));
        if (g.players[s].dbl > poor) res.solo = s; else res.team = side;
      }
    }
    g.players.forEach(function (P) { P.up = true; });
    g.winners = res.solo != null ? [res.solo] : members(g, res.team);
    g.final = res; g.phase = 'over'; g.pend = null;
    log(g, res.solo != null ? 'Vince ' + nick(g, res.solo) + ', ' + roleName(g.players[res.solo].role) + '!' : 'Vince la flotta di ' + NAT[res.team] + '!', 'end');
    fx(g, { k: 'over' });
  }

  /* ---------- carte: chi si può colpire ---------- */
  function others(g, p) { return idxs(g).filter(function (i) { return i !== p && g.players[i].ship != null; }); }
  function isAtk(g, p, id, as) { var k = kind(id); return k === 'atk' || (k === 'multi' && as !== 'def') || (ty(id) === 'virata' && isCap(g, p, 'lia') && as === 'atk'); }
  // bersagli validi per la carta id giocata da p ([] se non serve un bersaglio, null se non si può giocare)
  function targets(g, p, id, as) {
    var t = ty(id), P = g.players[p];
    if (P.ship == null) return null;
    if (isAtk(g, p, id, as)) {
      if (g.shots >= ammo(g, p)) return null;
      var near = t === 'arrembaggio' || t === 'moschetto';
      return others(g, p).filter(function (q) { return distance(g, p, q) <= (near ? 1 : range(g, p, q)); });
    }
    switch (t) {
      case 'rum': return P.bar < maxBar(g, p) ? [] : null;
      case 'vedetta': case 'porto': case 'burrasca': case 'mostro': return [];
      case 'saccheggio': return others(g, p).filter(function (q) { return distance(g, p, q) <= 1 && (g.players[q].hand.length || g.players[q].eq.length); });
      case 'sabotaggio': return others(g, p).filter(function (q) { return g.players[q].hand.length || g.players[q].eq.length; });
      case 'sfida': return others(g, p);
      case 'spettro': return g.gorgo ? [] : others(g, p).filter(function (q) { return !isCap(g, q, 'remo') && !(g.spectre && g.spectre.on === q); });
      case 'rifornimento': return idxs(g).filter(function (q) { return g.players[q].ship != null; });
      case 'lettera': return others(g, p).filter(function (q) { return !g.players[q].up && !P.seen[q]; });
    }
    if (kind(id) === 'eq') return hasEq(g, p, t) == null ? [] : null;
    return null;   // Virata e Bandiera bianca si giocano solo in risposta
  }
  function needsTarget(t) { return ['rum', 'vedetta', 'porto', 'burrasca', 'mostro'].indexOf(t) < 0; }
  function playable(g, p, id, as) { var r = targets(g, p, id, as); if (r == null) return false; return !(r.length === 0 && (isAtk(g, p, id, as) || (needsTarget(ty(id)) && kind(id) !== 'eq' && !(ty(id) === 'spettro' && g.gorgo)))); }

  /* ---------- risposte fuori turno ---------- */
  // carte con cui t può rispondere alla richiesta in corso
  function answers(g, t) {
    var pd = g.pend; if (!pd || pd.who !== t) return [];
    var H = g.players[t].hand, lia = isCap(g, t, 'lia');
    return H.filter(function (id) {
      var x = ty(id);
      if (x === 'bianca') return pd.k !== 'duel' || pd.first;
      if (pd.k === 'shot') return x === 'virata' || x === 'moschetto' || (lia && x === 'bordata');
      if (pd.k === 'duel' || pd.k === 'need') return x === 'bordata' || (lia && x === 'virata');
      return false;
    });
  }
  function begin(g, pd) { g.pend = pd; pump(g); }
  // passa al prossimo bersaglio finché qualcuno deve scegliere
  function pump(g) {
    var pd = g.pend;
    while (pd && g.phase === 'play') {
      if (pd.who == null) {
        if (!pd.q.length) { g.pend = null; break; }
        var t = pd.q.shift();
        if (g.players[t].ship == null) continue;
        pd.who = t; pd.got = 0; pd.first = true;
        if (pd.k === 'duel') pd.cur = t;
        if (pd.k === 'shot' && eqVs(g, t, 'polena', pd.by) != null) {   // la polena: si scopre una carta
          var c = topCheck(g);
          if (c != null) { fx(g, { k: 'reveal', p: t, c: c, why: 'polena' }); if (CARDS[c].s === 'A') { log(g, 'La polena di ' + nick(g, t) + ' porta fortuna: ' + T[ty(c)].n + ' con l’Ancora, il colpo va a vuoto.', 'miss', t); fx(g, { k: 'miss', p: t }); pd.who = null; continue; } }
        }
      }
      if (answers(g, pd.who).length) return;   // tocca a lui scegliere
      resolveTake(g, pd.who);
      pd = g.pend;
    }
    if (!g.pend) afterPend(g);
  }
  function afterPend(g) {
    if (g.phase !== 'play') return;
    adrift(g);
    if (g.step === 'sunk') proceed(g);
  }
  // il bersaglio non risponde (o non può): subisce l'effetto
  function resolveTake(g, t) {
    var pd = g.pend, by = pd.by;
    if (pd.k === 'shot') {
      log(g, nick(g, t) + ' subisce ' + (pd.label || 'il colpo') + '.', 'hit', t);
      var alive = g.players[t].ship != null;
      damage(g, t, pd.dmg, by, 'shot');
      if (g.phase !== 'play') return;
      if (alive && by != null && isCap(g, by, 'elsa')) give(g, by, 1, 'elsa');
      if (pd.after) applyAfter(g, by, t, pd.after);
      pd.who = null; return;
    }
    if (pd.k === 'need') { log(g, nick(g, t) + ' non ha una Bordata da scartare: perde 1 barile.', 'hit', t); damage(g, t, 1, by, 'card'); pd.who = null; return; }
    if (pd.k === 'duel') {
      var loser = pd.cur; log(g, nick(g, loser) + ' non risponde alla sfida e perde 1 barile.', 'hit', loser);
      g.pend = null; damage(g, loser, 1, loser === by ? pd.to : by, 'duel'); return;
    }
    if (pd.k === 'card') { applyCard(g, by, t, pd.eff); pd.who = null; }
  }
  function respond(g, p, a) {
    var pd = g.pend; if (!pd || pd.who !== p) return 'Non tocca a te rispondere.';
    if (a.a === 'take') { resolveTake(g, p); if (g.pend) pump(g); else afterPend(g); return null; }
    var id = +a.id; if (answers(g, p).indexOf(id) < 0) return 'Questa carta non serve adesso.';
    discardHand(g, p, id);
    var x = ty(id);
    fx(g, { k: 'play', p: p, c: id, t: pd.by, resp: true });
    if (x === 'bianca') {
      log(g, nick(g, p) + ' alza la Bandiera bianca: ' + (pd.label || 'la carta') + ' non ha effetto su di lui.', 'miss', p);
      fx(g, { k: 'miss', p: p });
      if (pd.k === 'duel') g.pend = null; else pd.who = null;
      if (g.pend) pump(g); else afterPend(g); return null;
    }
    if (pd.k === 'shot') {
      pd.got++; pd.first = false;
      if (pd.got >= pd.need) { log(g, nick(g, p) + ' evita il colpo con ' + T[x].n + '.', 'miss', p); fx(g, { k: 'miss', p: p }); pd.who = null; }
      else log(g, nick(g, p) + ' gioca ' + T[x].n + ', ma contro ' + nick(g, pd.by) + ' ne serve un’altra.', 'miss', p);
    } else if (pd.k === 'need') { log(g, nick(g, p) + ' scarta ' + T[x].n + ' e respinge il mostro.', 'miss', p); pd.who = null; }
    else if (pd.k === 'duel') {
      pd.first = false; pd.cur = pd.cur === pd.to ? pd.by : pd.to; pd.who = pd.cur;
      log(g, nick(g, p) + ' para con ' + T[x].n + '.', 'act', p);
    }
    if (g.pend) pump(g); else afterPend(g);
    return null;
  }

  /* ---------- effetti delle carte ---------- */
  function takeFrom(g, by, t, pick, steal) {
    var Q = g.players[t], got = null;
    if (pick != null && pick !== 'hand' && Q.eq.indexOf(+pick) >= 0) { got = +pick; Q.eq.splice(Q.eq.indexOf(got), 1); }
    else if (Q.hand.length) got = Q.hand.splice(Math.floor(rand() * Q.hand.length), 1)[0];
    else if (Q.eq.length) got = Q.eq.splice(0, 1)[0];
    if (got == null) return;
    var fromEq = pick != null && pick !== 'hand' && +pick === got;
    if (steal) g.players[by].hand.push(got); else g.disc.push(got);
    fx(g, { k: steal ? 'steal' : 'trash', p: by, from: t, c: fromEq || !steal ? got : null });
    log(g, steal ? nick(g, by) + ' prende ' + (fromEq ? T[ty(got)].n : 'una carta dalla mano') + ' a ' + nick(g, t) + '.' : nick(g, t) + ' scarta ' + T[ty(got)].n + (fromEq ? '' : ' dalla mano') + '.', 'act', by);
  }
  function applyAfter(g, by, t, af) {
    if (g.players[t].ship == null && af.k === 'eq') return;
    if (af.k === 'steal') takeFrom(g, by, t, 'hand', true);
    if (af.k === 'eq' && g.players[t].eq.length) takeFrom(g, by, t, g.players[t].eq.indexOf(+af.pick) >= 0 ? af.pick : g.players[t].eq[0], false);
  }
  function applyCard(g, by, t, eff) {
    var Q = g.players[t];
    if (eff.t === 'saccheggio') takeFrom(g, by, t, eff.pick, true);
    else if (eff.t === 'sabotaggio') takeFrom(g, by, t, eff.pick, false);
    else if (eff.t === 'spettro') { if (Q.ship != null) { g.spectre = { on: t }; fx(g, { k: 'spectre', on: t, from: by }); log(g, 'Il Vascello spettrale si posa sulla nave di ' + Q.nick + '.', 'ghost', t); } }
    else if (eff.t === 'sfida') { g.pend = { k: 'duel', by: by, to: t, q: [], who: t, cur: t, first: false, label: 'la Sfida a sciabole' }; log(g, Q.nick + ' accetta la sfida: tocca a lui scartare una Bordata.', 'act', t); }
    else if (eff.t === 'lettera') { g.players[by].seen[t] = 1; fx(g, { k: 'peek', p: by, t: t }); log(g, nick(g, by) + ' legge una lettera intercettata e scopre il ruolo di ' + Q.nick + '.', 'act', by); }
  }
  function play(g, p, a) {
    if (g.turn !== p || g.step !== 'play') return 'Non puoi giocare carte adesso.';
    var P = g.players[p], id = +a.id;
    if (P.hand.indexOf(id) < 0) return 'Non hai questa carta.';
    var t = ty(id), as = a.as === 'def' ? 'def' : a.as === 'atk' ? 'atk' : null;
    if (kind(id) === 'multi' && as === 'def') return 'La Difesa si gioca solo fuori dal tuo turno.';
    var tg = targets(g, p, id, as);
    if (tg == null) {
      if (isAtk(g, p, id, as) && g.shots >= ammo(g, p)) return 'Hai finito le munizioni per questo turno (' + ammo(g, p) + ').';
      if (t === 'rum') return 'La tua nave ha già tutti i barili.';
      if (kind(id) === 'eq') return 'Hai già questo Equipaggiamento in gioco.';
      return 'Questa carta si gioca solo in risposta, fuori dal tuo turno.';
    }
    var to = a.t == null ? null : +a.t, atk = isAtk(g, p, id, as);
    var need = atk || (needsTarget(t) && kind(id) !== 'eq' && !(t === 'spettro' && g.gorgo));
    if (need) {
      if (!tg.length) return atk ? 'Nessuna nave è a portata di tiro.' : 'Non c’è nessun bersaglio valido.';
      if (to == null || tg.indexOf(to) < 0) return 'Scegli un bersaglio valido.';
    }
    discardHand(g, p, id);
    if (kind(id) === 'eq') { g.disc.pop(); P.eq.push(id); }
    fx(g, { k: 'play', p: p, c: id, t: to });
    var lbl = T[t].n;
    if (to != null && to !== p && t !== 'rifornimento' && t !== 'lettera') { var hk = p + '>' + to; g.hx[hk] = (g.hx[hk] || 0) + 1; }
    if (atk) {
      g.shots++;
      var dmg = 1 + cannons(g, p, to), after = t === 'arrembaggio' ? { k: 'steal' } : t === 'incatenate' ? { k: 'eq', pick: a.pick } : null;
      log(g, nick(g, p) + ' spara ' + (t === 'virata' ? 'una Bordata (con una Virata)' : t === 'moschetto' ? 'un colpo di Moschetto' : (t === 'arrembaggio' ? 'un Arrembaggio' : t === 'incatenate' ? 'Palle incatenate' : 'una Bordata')) + ' a ' + nick(g, to) + (dmg > 1 ? ' (' + dmg + ' barili)' : '') + '.', 'atk', p);
      begin(g, { k: 'shot', by: p, q: [to], who: null, dmg: dmg, need: isCap(g, p, 'oscar') ? 2 : 1, after: after, label: lbl });
      return null;
    }
    switch (t) {
      case 'rum': { var h = heal(g, p, isCap(g, p, 'ugo') ? 2 : 1); log(g, nick(g, p) + ' beve un Rum e recupera ' + h + (h > 1 ? ' barili.' : ' barile.'), 'heal', p); break; }
      case 'vedetta': give(g, p, 2, 'card'); log(g, nick(g, p) + ' manda la Vedetta e pesca 2 carte.', 'draw', p); break;
      case 'porto': idxs(g).forEach(function (q) { heal(g, q, 1); }); give(g, p, 1, 'card'); log(g, nick(g, p) + ' apre il Porto franco: tutte le navi recuperano 1 barile.', 'heal', p); break;
      case 'rifornimento': { var hh = heal(g, to, 1, true); log(g, nick(g, p) + ' manda un Rifornimento a ' + (to === p ? 'sé stesso' : nick(g, to)) + ': +' + hh + ' barile.', 'heal', p); break; }
      case 'burrasca': log(g, nick(g, p) + ' scatena la Burrasca su tutte le navi!', 'atk', p); begin(g, { k: 'shot', by: p, q: order(g, p), who: null, dmg: 1, need: isCap(g, p, 'oscar') ? 2 : 1, label: 'la Burrasca' }); return null;
      case 'mostro': log(g, nick(g, p) + ' risveglia il Mostro degli abissi!', 'atk', p); begin(g, { k: 'need', by: p, q: order(g, p), who: null, label: 'il Mostro degli abissi' }); return null;
      case 'spettro':
        if (g.gorgo) { give(g, p, 1, 'card'); log(g, nick(g, p) + ' gioca il Vascello spettrale, ma c’è già il Gorgo: pesca 1 carta.', 'draw', p); break; }
      /* fallthrough */
      default:
        if (kind(id) === 'eq') {
          log(g, nick(g, p) + ' monta ' + lbl + '.', 'eq', p);
          if (t === 'fasciame') heal(g, p, 1);
          break;
        }
        log(g, nick(g, p) + ' gioca ' + lbl + ' contro ' + nick(g, to) + '.', 'act', p);
        begin(g, { k: 'card', by: p, q: [to], who: null, eff: { t: t, pick: a.pick }, label: lbl });
        return null;
    }
    adrift(g);
    return null;
  }
  function order(g, p) { var n = g.players.length, r = []; for (var k = 1; k < n; k++) { var q = (p + k) % n; if (g.players[q].ship != null) r.push(q); } return r; }

  /* ---------- mosse ---------- */
  function decider(g) {
    if (g.phase !== 'play') return null;
    if (g.pend) return g.pend.who;
    return g.turn;
  }
  function act(g, p, a) {
    if (!a || typeof a.a !== 'string') return 'Mossa non valida.';
    if (g.phase !== 'play') return 'La partita è finita.';
    if (!g.players[p]) return 'Non sei al tavolo.';
    var r = doAct(g, p, a);
    if (!r) g.seq++;
    return r;
  }
  function doAct(g, p, a) {
    if (g.pend) { if (a.a === 'resp' || a.a === 'take') return respond(g, p, a); return g.pend.who === p ? 'Prima rispondi.' : 'Aspetta: ' + nick(g, g.pend.who) + ' deve rispondere.'; }
    if (g.turn !== p) return 'Non è il tuo turno.';
    var P = g.players[p];
    if (a.a === 'answer') {
      if (g.step !== 'spectre') return 'Non c’è niente a cui rispondere.';
      var e = spectreAnswer(g, p, a.id == null ? null : +a.id); if (e) return e;
      proceed(g); return null;
    }
    if (a.a === 'ship') {
      if (g.step !== 'ship' || P.ship != null) return 'Hai già una nave.';
      var s;
      if (a.i === 'deck') { if (!g.ships.length) return 'Il mazzo delle navi è vuoto.'; s = g.ships.shift(); }
      else { var i = +a.i; if (!(i >= 0 && i < g.row.length)) return 'Scegli una nave.'; s = g.row.splice(i, 1)[0]; if (g.ships.length) g.row.splice(i, 0, g.ships.shift()); }
      P.ship = s; P.bar = SHIPS[s].b;
      log(g, nick(g, p) + ' prende il comando della ' + SHIPS[s].n + '.', 'ship', p);
      fx(g, { k: 'ship', p: p, s: s, from: a.i === 'deck' ? 'deck' : 'row' });
      if (SHIPS[s].a === 'gift') give(g, p, 2, 'ship');
      g.step = 'draw'; proceed(g); return null;
    }
    if (a.a === 'play') { var r = play(g, p, a); return r; }
    if (a.a === 'end') {
      if (g.step !== 'play' && g.step !== 'sunk') return 'Non puoi finire il turno adesso.';
      var drop = (a.drop || []).map(Number), extra = P.hand.length - 5;
      if (extra > 0) {
        if (drop.length !== extra || drop.some(function (id, k) { return P.hand.indexOf(id) < 0 || drop.indexOf(id) !== k; })) return 'Devi scartare ' + extra + (extra > 1 ? ' carte' : ' carta') + ': alla fine del turno se ne tengono 5.';
        drop.forEach(function (id) { discardHand(g, p, id); });
        log(g, nick(g, p) + ' scarta ' + extra + (extra > 1 ? ' carte.' : ' carta.'), 'drop', p);
        fx(g, { k: 'drop', p: p, c: drop });
      }
      finishTurn(g, p); return null;
    }
    return 'Mossa sconosciuta.';
  }

  // ruolo di q come lo vede il giocatore v (null se non lo sa)
  function seenRole(g, v, q) { var Q = g.players[q]; if (!Q) return null; if (Q.up || v === q || g.phase === 'over' || (v >= 0 && g.players[v] && g.players[v].seen[q])) return Q.role; return null; }

  return { newGame: newGame, act: act, decider: decider, targets: targets, playable: playable, answers: answers, distance: distance, range: range, ammo: ammo, cannons: cannons,
    maxBar: maxBar, dbl: dbl, seenRole: seenRole, isAtk: isAtk, needsTarget: needsTarget, nat: nat, hasEq: hasEq, isCap: isCap, matching: matching,
    T: T, ORDER: ORDER, CARDS: CARDS, SHIPS: SHIPS, CAPS: CAPS, ROLES: ROLES, NAT: NAT, SETUP: SETUP, SYM: SYM, ty: ty, kind: kind, setRandom: setRandom, shuffle: shuffle };
})();
if (typeof module !== 'undefined') module.exports = FZEngine;
