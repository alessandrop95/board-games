/* ===== Gattomina: regole (equivalenti al gioco base dei gattini esplosivi, con nomi e carte originali) ===== */
var GMData = (function () {
  // t: tipo · n: nome · k: 'bomb' | 'defuse' | 'action' | 'nope' | 'cat'
  var TYPES = {
    bomba:     { n: 'Gattomina',  k: 'bomb',   count: 4, s: 'Se la peschi esplodi!', txt: 'Se la peschi esplodi ed esci dalla partita, a meno che tu non abbia una Scatoletta.' },
    scatoletta:{ n: 'Scatoletta', k: 'defuse', count: 6, s: 'Disinnesca la Gattomina', txt: 'Quando peschi una Gattomina, la Scatoletta la calma: poi rimetti la Gattomina nel mazzo dove vuoi, di nascosto.' },
    agguato:   { n: 'Agguato',    k: 'action', count: 4, s: 'Il prossimo fa 2 turni', txt: 'Finisci il turno senza pescare. Il giocatore dopo di te deve fare 2 turni di fila (se era già sotto Agguato, i turni si sommano).' },
    pisolino:  { n: 'Pisolino',   k: 'action', count: 4, s: 'Finisci il turno senza pescare', txt: 'Finisci un turno senza pescare. Se devi fare più turni per un Agguato, ne salti uno.' },
    fusa:      { n: 'Fusa',       k: 'action', count: 4, s: 'Un giocatore ti regala una carta', txt: 'Scegli un giocatore: deve darti una carta della sua mano, a sua scelta.' },
    gomitolo:  { n: 'Gomitolo',   k: 'action', count: 4, s: 'Mescola il mazzo', txt: 'Mescola il mazzo da pescare. Utile quando sai (o temi) che c’è una Gattomina in cima.' },
    sfera:     { n: 'Sfera',      k: 'action', count: 5, s: 'Sbircia le prime 3 carte', txt: 'Guarda di nascosto le prime 3 carte del mazzo e rimettile come erano.' },
    soffio:    { n: 'Soffio!',    k: 'nope',   count: 5, s: 'Annulla una carta giocata', txt: 'Annulla qualsiasi carta o coppia appena giocata, anche fuori dal tuo turno. Si può soffiare anche su un Soffio! (tranne Gattomina e Scatoletta).' },
    pirata:    { n: 'Micio Pirata',  k: 'cat', count: 4, s: 'Gioca 2 uguali e ruba', txt: 'Da sola non fa nulla. Due uguali: rubi una carta a caso. Tre uguali: chiedi una carta precisa.' },
    spaghetti: { n: 'Micio Spaghetti', k: 'cat', count: 4, s: 'Gioca 2 uguali e ruba', txt: 'Da sola non fa nulla. Due uguali: rubi una carta a caso. Tre uguali: chiedi una carta precisa.' },
    re:        { n: 'Micio Re',      k: 'cat', count: 4, s: 'Gioca 2 uguali e ruba', txt: 'Da sola non fa nulla. Due uguali: rubi una carta a caso. Tre uguali: chiedi una carta precisa.' },
    rapito:    { n: 'Micio Rapito',  k: 'cat', count: 4, s: 'Gioca 2 uguali e ruba', txt: 'Da sola non fa nulla. Due uguali: rubi una carta a caso. Tre uguali: chiedi una carta precisa.' },
    rockstar:  { n: 'Micio Rockstar', k: 'cat', count: 4, s: 'Gioca 2 uguali e ruba', txt: 'Da sola non fa nulla. Due uguali: rubi una carta a caso. Tre uguali: chiedi una carta precisa.' }
  };
  var ORDER = ['bomba', 'scatoletta', 'agguato', 'pisolino', 'fusa', 'gomitolo', 'sfera', 'soffio', 'pirata', 'spaghetti', 're', 'rapito', 'rockstar'];
  var CARDS = [];
  ORDER.forEach(function (t) { for (var i = 0; i < TYPES[t].count; i++) CARDS.push({ id: CARDS.length, t: t }); });
  return { TYPES: TYPES, ORDER: ORDER, CARDS: CARDS };
})();

var GMEngine = (function () {
  var D = GMData, C = D.CARDS, T = D.TYPES;
  var NOPE_MS = 4200;   // tempo per rispondere con un Soffio!
  function ty(id) { return C[id].t; }
  function shuffle(a) { for (var i = a.length - 1; i > 0; i--) { var j = Math.floor(Math.random() * (i + 1)); var t = a[i]; a[i] = a[j]; a[j] = t; } return a; }
  function nm(s, p) { return s.players[p].nick; }
  function log(s, t, k) { s.log.push({ n: ++s.logN, t: t, k: k || '' }); if (s.log.length > 70) s.log.splice(0, s.log.length - 70); }
  function alive(s) { return s.players.map(function (P, i) { return P.alive ? i : -1; }).filter(function (i) { return i >= 0; }); }
  function nextAlive(s, p) { var n = s.players.length; for (var k = 1; k <= n; k++) { var q = (p + k) % n; if (s.players[q].alive) return q; } return p; }
  function removeFrom(a, id) { var i = a.indexOf(id); if (i >= 0) a.splice(i, 1); return i >= 0; }
  function bombsLeft(s) { return s.deck.filter(function (c) { return ty(c) === 'bomba'; }).length; }

  function newGame(seats) {
    var n = seats.length;
    if (n < 2 || n > 5) throw new Error('Servono da 2 a 5 giocatori.');
    var bombs = [], defuses = [], rest = [];
    C.forEach(function (c) { (c.t === 'bomba' ? bombs : c.t === 'scatoletta' ? defuses : rest).push(c.id); });
    shuffle(rest); shuffle(defuses);
    var s = {
      v: 1, phase: 'play', seq: 0, logN: 0, log: [], fx: 0, flash: null, winner: null,
      players: seats.map(function (st) { return { uid: st.uid, nick: st.nick, bot: !!st.bot, hand: [], alive: true }; }),
      deck: [], disc: [], out: [], turn: Math.floor(Math.random() * n), turns: 1, pend: null, wait: null, peek: null, held: null
    };
    s.players.forEach(function (P) { for (var i = 0; i < 7; i++) P.hand.push(rest.pop()); P.hand.push(defuses.pop()); });
    var extra = n <= 3 ? Math.min(2, defuses.length) : defuses.length;
    s.deck = rest.concat(defuses.slice(0, extra), bombs.slice(0, n - 1));
    s.out = bombs.slice(n - 1).concat(defuses.slice(extra));
    shuffle(s.deck);
    log(s, 'Si apre la partita: ' + n + ' giocatori, ' + (n - 1) + (n - 1 === 1 ? ' Gattomina' : ' Gattomine') + ' nascoste nel mazzo. Comincia ' + nm(s, s.turn) + '.', 'turn');
    return s;
  }

  // chi deve fare la prossima mossa (null durante la finestra dei Soffio!)
  function decider(s) {
    if (s.phase !== 'play') return null;
    if (s.wait) return s.wait.who;
    if (s.pend) return null;
    return s.turn;
  }
  function canNope(s, p) {
    var f = s.pend; if (!f || s.phase !== 'play' || !s.players[p].alive) return false;
    var last = f.chain.length ? f.chain[f.chain.length - 1] : f.by;
    if (last === p) return false;
    return s.players[p].hand.some(function (c) { return ty(c) === 'soffio'; });
  }

  function endTurn(s) {
    s.turns--;
    if (s.turns <= 0 || !s.players[s.turn].alive) {
      s.turn = nextAlive(s, s.turn); s.turns = 1;
      log(s, 'Tocca a ' + nm(s, s.turn) + '.', 'turn');
    } else log(s, nm(s, s.turn) + ' deve fare ancora ' + (s.turns === 1 ? 'un turno' : s.turns + ' turni') + '.', 'turn');
  }

  // carte che si possono giocare insieme
  function comboKind(cards) {
    if (!cards.length) return null;
    var types = cards.map(ty);
    if (types.some(function (t) { return t === 'bomba' || t === 'scatoletta'; })) return null;
    var same = types.every(function (t) { return t === types[0]; });
    if (cards.length === 1) return T[types[0]].k === 'action' ? types[0] : null;
    if (cards.length === 2 && same) return 'pair';
    if (cards.length === 3 && same) return 'trio';
    if (cards.length === 5) { var u = {}; types.forEach(function (t) { u[t] = 1; }); if (Object.keys(u).length === 5) return 'five'; }
    return null;
  }
  function needsTarget(kind) { return kind === 'fusa' || kind === 'pair' || kind === 'trio'; }
  function targets(s, p) { return alive(s).filter(function (i) { return i !== p && s.players[i].hand.length > 0; }); }

  function play(s, p, a) {
    var P = s.players[p], cards = (a.cards || []).slice();
    if (s.turn !== p || s.pend || s.wait) return 'Non è il momento di giocare carte.';
    if (!cards.length || cards.some(function (c) { return P.hand.indexOf(c) < 0; })) return 'Non hai queste carte.';
    if (cards.length !== new Set(cards).size) return 'Carte non valide.';
    var kind = comboKind(cards);
    if (!kind) {
      var t0 = ty(cards[0]);
      if (cards.length === 1 && T[t0].k === 'cat') return 'Un micio da solo non fa nulla: giocane due uguali per rubare una carta.';
      if (cards.length === 1 && t0 === 'soffio') return 'Il Soffio! si gioca solo per annullare una carta appena giocata.';
      if (cards.length === 1 && t0 === 'scatoletta') return 'La Scatoletta si usa da sola quando peschi una Gattomina.';
      return 'Si possono giocare una carta azione, due o tre carte uguali, o cinque carte diverse.';
    }
    var tg = null;
    if (needsTarget(kind)) {
      tg = a.target;
      if (targets(s, p).indexOf(tg) < 0) return 'Scegli un giocatore ancora in gioco che abbia carte in mano.';
    }
    if (kind === 'trio' && !T[a.name]) return 'Scegli quale carta chiedere.';
    if (kind === 'five' && !s.disc.length) return 'La pila degli scarti è vuota.';
    cards.forEach(function (c) { removeFrom(P.hand, c); s.disc.push(c); });
    s.pend = { id: s.logN + 1, by: p, cards: cards, kind: kind, target: tg, name: kind === 'trio' ? a.name : null, chain: [], until: Date.now() + NOPE_MS, dur: NOPE_MS };
    var what = kind === 'pair' ? 'una coppia di ' + T[ty(cards[0])].n : kind === 'trio' ? 'un tris di ' + T[ty(cards[0])].n : kind === 'five' ? 'cinque carte diverse' : T[kind].n;
    log(s, nm(s, p) + ' gioca ' + what + (tg != null ? ' contro ' + nm(s, tg) : '') + (kind === 'trio' ? ' e chiede ' + T[a.name].n : '') + '.', 'play');
    s.flash = { kind: 'play', p: p, cards: cards, target: tg, n: ++s.fx };
    return null;
  }
  function nope(s, p, a) {
    if (!s.pend) return 'Non c’è niente da annullare.';
    if (!canNope(s, p)) return 'Non puoi soffiare adesso.';
    var P = s.players[p], c = a.card != null ? a.card : P.hand.filter(function (x) { return ty(x) === 'soffio'; })[0];
    if (P.hand.indexOf(c) < 0 || ty(c) !== 'soffio') return 'Non hai un Soffio!.';
    removeFrom(P.hand, c); s.disc.push(c);
    s.pend.chain.push(p); s.pend.until = Date.now() + NOPE_MS; s.pend.dur = NOPE_MS;
    var off = s.pend.chain.length % 2 === 1;
    log(s, nm(s, p) + ' soffia: ' + (off ? 'la carta di ' + nm(s, s.pend.by) + ' è annullata!' : 'il Soffio! è annullato, la carta torna valida!'), 'nope');
    s.flash = { kind: 'nope', p: p, card: c, off: off, n: ++s.fx };
    return null;
  }
  function resolve(s) {
    var f = s.pend; if (!f) return 'Niente da risolvere.';
    s.pend = null;
    if (f.chain.length % 2 === 1) { log(s, 'La carta di ' + nm(s, f.by) + ' non ha effetto.', 'sys'); s.flash = { kind: 'cancel', p: f.by, n: ++s.fx }; return null; }
    var p = f.by, P = s.players[p];
    switch (f.kind) {
      case 'agguato': {
        var add = s.turns > 1 ? s.turns : 0; var nx = nextAlive(s, p);
        log(s, nm(s, p) + ' tende un agguato: ' + nm(s, nx) + ' deve fare ' + (add + 2) + ' turni!', 'attack');
        s.turn = nx; s.turns = add + 2; s.peek = s.peek && s.peek.p === nx ? s.peek : null;
        s.flash = { kind: 'attack', p: p, t: nx, turns: s.turns, n: ++s.fx };
        break;
      }
      case 'pisolino':
        log(s, nm(s, p) + ' si fa un pisolino e non pesca.', 'skip');
        s.flash = { kind: 'skip', p: p, n: ++s.fx };
        endTurn(s); break;
      case 'fusa':
        if (!s.players[f.target].hand.length) { log(s, nm(s, f.target) + ' non ha carte da regalare.', 'sys'); break; }
        s.wait = { type: 'favor', who: f.target, to: p };
        log(s, nm(s, f.target) + ' sceglie una carta da regalare a ' + nm(s, p) + '.', 'sys'); break;
      case 'gomitolo':
        shuffle(s.deck); s.peek = null;
        log(s, nm(s, p) + ' arruffa il gomitolo: il mazzo è mescolato.', 'shuffle');
        s.flash = { kind: 'shuffle', p: p, n: ++s.fx }; break;
      case 'sfera':
        s.peek = { p: p, cards: s.deck.slice(-3).reverse(), n: ++s.fx };
        log(s, nm(s, p) + ' guarda nella sfera le prime carte del mazzo.', 'future');
        s.flash = { kind: 'future', p: p, n: s.peek.n }; break;
      case 'pair': {
        var Q = s.players[f.target]; if (!Q.hand.length) { log(s, nm(s, f.target) + ' non ha più carte.', 'sys'); break; }
        var c = Q.hand[Math.floor(Math.random() * Q.hand.length)]; removeFrom(Q.hand, c); P.hand.push(c);
        log(s, nm(s, p) + ' ruba una carta a caso a ' + nm(s, f.target) + '.', 'steal');
        s.flash = { kind: 'steal', p: p, t: f.target, card: c, n: ++s.fx }; break;
      }
      case 'trio': {
        var R = s.players[f.target], has = R.hand.filter(function (x) { return ty(x) === f.name; })[0];
        if (has == null) { log(s, nm(s, f.target) + ' non ha nessuna carta ' + T[f.name].n + '.', 'sys'); s.flash = { kind: 'miss', p: p, t: f.target, n: ++s.fx }; break; }
        removeFrom(R.hand, has); P.hand.push(has);
        log(s, nm(s, p) + ' si fa dare ' + T[f.name].n + ' da ' + nm(s, f.target) + '.', 'steal');
        s.flash = { kind: 'steal', p: p, t: f.target, card: has, n: ++s.fx }; break;
      }
      case 'five':
        var pool = s.disc.filter(function (x) { return f.cards.indexOf(x) < 0; });
        if (!pool.length) { log(s, 'Negli scarti non c’è nulla da prendere.', 'sys'); break; }
        s.wait = { type: 'five', who: p };
        log(s, nm(s, p) + ' fruga tra gli scarti.', 'sys'); break;
    }
    return null;
  }

  function draw(s, p) {
    if (s.turn !== p || s.pend || s.wait) return 'Non è il momento di pescare.';
    if (!s.deck.length) return 'Il mazzo è vuoto.';
    var P = s.players[p], c = s.deck.pop();
    if (s.peek) { s.peek.cards = s.peek.cards.filter(function (x) { return x !== c; }); if (!s.peek.cards.length) s.peek = null; }
    if (ty(c) !== 'bomba') {
      P.hand.push(c);
      log(s, nm(s, p) + ' pesca una carta.', 'draw');
      s.flash = { kind: 'draw', p: p, card: c, n: ++s.fx };
      endTurn(s); return null;
    }
    var def = P.hand.filter(function (x) { return ty(x) === 'scatoletta'; })[0];
    if (def != null) {
      removeFrom(P.hand, def); s.disc.push(def); s.held = c;
      s.wait = { type: 'insert', who: p };
      log(s, nm(s, p) + ' pesca una GATTOMINA… e la calma con una Scatoletta!', 'defuse');
      s.flash = { kind: 'defuse', p: p, card: c, def: def, n: ++s.fx };
      return null;
    }
    // esplosione
    P.alive = false; s.out.push(c);
    P.hand.forEach(function (x) { s.disc.push(x); }); P.hand = [];
    log(s, nm(s, p) + ' pesca una GATTOMINA senza Scatoletta: BOOM! È fuori dalla partita.', 'boom');
    s.flash = { kind: 'boom', p: p, card: c, n: ++s.fx };
    var al = alive(s);
    if (al.length <= 1) { s.phase = 'over'; s.winner = al[0]; log(s, 'Vince ' + nm(s, al[0]) + ', l’ultimo rimasto intero!', 'win'); return null; }
    s.turn = nextAlive(s, p); s.turns = 1; s.peek = null;
    log(s, 'Tocca a ' + nm(s, s.turn) + '.', 'turn');
    return null;
  }
  function insert(s, p, a) {
    if (!s.wait || s.wait.type !== 'insert' || s.wait.who !== p) return 'Non devi rimettere nessuna Gattomina.';
    var n = s.deck.length, pos = a.pos === 'rand' ? Math.floor(Math.random() * (n + 1)) : Math.max(0, Math.min(n, a.pos | 0)); // 0 = in cima
    s.deck.splice(n - pos, 0, s.held); s.held = null; s.wait = null; s.peek = null;
    log(s, nm(s, p) + ' rimette la Gattomina nel mazzo, in un punto segreto.', 'sys');
    s.flash = { kind: 'insert', p: p, n: ++s.fx };
    endTurn(s); return null;
  }
  function give(s, p, a) {
    var w = s.wait; if (!w || w.type !== 'favor' || w.who !== p) return 'Non devi regalare carte.';
    var P = s.players[p]; if (P.hand.indexOf(a.card) < 0) return 'Non hai questa carta.';
    removeFrom(P.hand, a.card); s.players[w.to].hand.push(a.card); s.wait = null;
    log(s, nm(s, p) + ' regala una carta a ' + nm(s, w.to) + '.', 'steal');
    s.flash = { kind: 'give', p: p, t: w.to, card: a.card, n: ++s.fx };
    return null;
  }
  function take(s, p, a) {
    var w = s.wait; if (!w || w.type !== 'five' || w.who !== p) return 'Non devi prendere carte dagli scarti.';
    if (s.disc.indexOf(a.card) < 0) return 'Questa carta non è negli scarti.';
    removeFrom(s.disc, a.card); s.players[p].hand.push(a.card); s.wait = null;
    log(s, nm(s, p) + ' prende ' + T[ty(a.card)].n + ' dagli scarti.', 'steal');
    s.flash = { kind: 'take', p: p, card: a.card, n: ++s.fx };
    return null;
  }

  function act(s, p, a) {
    if (s.phase !== 'play') return 'La partita è finita.';
    if (!a || !s.players[p]) return 'Mossa non valida.';
    if (!s.players[p].alive && a.a !== 'resolve') return 'Sei fuori dalla partita.';
    var err;
    switch (a.a) {
      case 'play': err = play(s, p, a); break;
      case 'nope': err = nope(s, p, a); break;
      case 'resolve': err = resolve(s); break;
      case 'draw': err = draw(s, p); break;
      case 'insert': err = insert(s, p, a); break;
      case 'give': err = give(s, p, a); break;
      case 'take': err = take(s, p, a); break;
      default: err = 'Mossa sconosciuta.';
    }
    if (!err) s.seq++;
    return err;
  }
  return { newGame: newGame, act: act, decider: decider, canNope: canNope, comboKind: comboKind, needsTarget: needsTarget, targets: targets, bombsLeft: bombsLeft, ty: ty, nextAlive: nextAlive, NOPE_MS: NOPE_MS };
})();
if (typeof module !== 'undefined') module.exports = { GMData: GMData, GMEngine: GMEngine };
