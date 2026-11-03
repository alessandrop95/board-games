/* ===== Unlock!: motore di gioco (cooperativo, in tempo reale; gira sull'host) ===== */
var UEngine = (function () {
  var SC = typeof UScen !== 'undefined' ? UScen : require('./scen.js');
  var MISS = 60, WRONG_CODE = 120, WRONG_MAC = 60;   // penalità in secondi (le avventure più difficili ne hanno di più alte)
  function scen(g) { return SC.get(g.scen); }
  // costi dell'avventura: unione a vuoto, codice sbagliato, macchina sbagliata, ricerca a vuoto, indizio e soluzione
  function costs(g) { var p = scen(g).pen || {}, h = scen(g).hintPen || [0, 0]; return { miss: p.miss || MISS, code: p.code || WRONG_CODE, mac: p.mac || WRONG_MAC, search: p.search || p.miss || MISS, hint: h[0] || 0, sol: h[1] || 0 }; }
  // indizi disponibili in tutta l'avventura (null = senza limite); ogni richiesta, indizio o soluzione, ne usa uno
  function hintsLeft(g) { var m = scen(g).hintMax; return m == null ? null : Math.max(0, m - g.hintN); }
  function mins(s) { var m = Math.floor(s / 60), r = s % 60; return r ? m + ':' + ('0' + r).slice(-2) : m + ' min'; }
  function card(g, id) { return scen(g).cards[id]; }
  function onTable(g, id) { return g.st[id] === 'table'; }
  function seen(g, id) { return !!g.st[id]; }
  function table(g) { return g.order.filter(function (id) { return g.st[id] === 'table'; }); }
  function gone(g) { return g.order.filter(function (id) { return g.st[id] === 'gone'; }); }
  function mods(g) { var o = []; table(g).forEach(function (id) { var c = card(g, id); if (c && c.mod) o.push({ id: id, v: c.mod }); }); return o; }
  // numeri visibili sulle carte in tavola (refs) e nascosti nei disegni (hid)
  function visible(g, id) { return table(g).some(function (t) { var c = card(g, t); return (c.refs || []).indexOf(id) >= 0 || (c.hid || []).indexOf(id) >= 0; }); }
  // numeri che non si vedono su nessuna carta ma si possono calcolare (calc): si cercano con «Cerca»
  function findable(g, id) { return visible(g, id) || table(g).some(function (t) { return (card(g, t).calc || []).indexOf(id) >= 0; }); }
  function label(id) { return id === 'start' ? 'la carta iniziale' : /^[A-Z]$/.test(id) ? 'la stanza ' + id : 'la carta ' + id; }

  function newGame(seats, opts, now) {
    var sc = SC.get(opts && opts.scen);
    var g = { scen: sc.id, limit: sc.min * 60, players: seats.map(function (s, i) { return { uid: s.uid, nick: s.nick, col: i }; }),
      st: {}, order: [], el: 0, at: now || Date.now(), paused: false, pen: 0, hints: {}, hintN: 0, tries: { miss: 0, code: 0, mac: 0 },
      look: {}, fx: [], fxN: 0, log: [], logN: 0, seq: 0, phase: 'play', won: false, lost: false, stars: 0, newAt: {}, id: Math.random().toString(36).slice(2, 9) };
    g.tries.search = 0;
    reveal(g, 'start', -1);
    log(g, 'Il tempo scorre: ' + sc.min + ' minuti per ' + (sc.goal || 'uscire') + '. Se il tempo finisce, si ricomincia da capo.', null, 'sys');
    return g;
  }
  function log(g, t, p, k) { g.log.push({ n: ++g.logN, t: t, p: p == null ? null : p, k: k || '' }); if (g.log.length > 90) g.log.splice(0, g.log.length - 90); }
  function fx(g, e) { e.n = ++g.fxN; g.fx.push(e); if (g.fx.length > 14) g.fx.splice(0, g.fx.length - 14); }
  function who(g, p) { return p >= 0 && g.players[p] ? g.players[p].nick : ''; }

  /* ---------- tempo ---------- */
  function tick(g, now) { if (g.phase === 'play' && !g.paused && now > g.at) g.el += now - g.at; g.at = now; }
  function elapsed(g, now) { return g.el + (g.phase === 'play' && !g.paused && now > g.at ? now - g.at : 0); }
  function remaining(g, now) { return g.limit * 1000 - elapsed(g, now) - g.pen * 1000; }
  function stars(g) {
    var rem = g.limit * 1000 - g.el - g.pen * 1000, s = 5;
    if (rem < g.limit * 1000 / 6) s = 4;
    s -= g.hintN >= 6 ? 2 : g.hintN >= 3 ? 1 : 0;
    return Math.max(1, s);
  }

  /* ---------- carte che escono ---------- */
  function reveal(g, id, p) {
    var c = card(g, id); if (!c || seen(g, id)) return;
    g.st[id] = 'table'; g.order.push(id); g.newAt[id] = g.el;
    var out = [];
    (c.disc || []).forEach(function (d) { if (g.st[d] !== 'gone') { if (!g.st[d]) g.order.push(d); g.st[d] = 'gone'; out.push(d); } });
    if (c.k === 'pen') {
      g.pen += c.pen * 60; g.st[id] = 'gone';
      fx(g, { k: 'pen', id: id, m: c.pen, p: p });
      log(g, 'Penalità: «' + c.t + '» (−' + c.pen + ' min).', p, 'pen');
      expire(g);
      return;
    }
    fx(g, { k: 'reveal', id: id, p: p, out: out });
    if (id !== 'start') log(g, (p >= 0 ? who(g, p) + ' scopre ' : 'Esce ') + label(id) + ': «' + c.t + '».' + (out.length ? ' Scartate: ' + out.join(', ') + '.' : ''), p, 'rev');
    if (c.k === 'end') finish(g);
  }
  // tempo scaduto: l'avventura è persa e si deve ricominciare da capo
  function expire(g, now) {
    if (g.phase !== 'play') return false;
    if (now != null) tick(g, now);
    if (g.limit * 1000 - g.el - g.pen * 1000 > 0) return false;
    g.phase = 'over'; g.won = false; g.lost = true; g.stars = 0; g.endEl = g.el; g.paused = false;
    var tot = Object.keys(scen(g).cards).length, seenN = Object.keys(g.st).length;
    g.found = { seen: seenN, tot: tot };
    fx(g, { k: 'timeout' });
    log(g, 'Tempo scaduto! L’avventura è persa: si ricomincia da capo.', null, 'lost');
    return true;
  }
  function finish(g) {
    g.phase = 'over'; g.won = true; g.stars = stars(g); g.endEl = g.el;
    fx(g, { k: 'win', stars: g.stars });
    log(g, 'Ce l’avete fatta! ' + g.stars + (g.stars === 1 ? ' stella.' : ' stelle.'), null, 'sys');
  }
  function combo(g, r, b) { var cs = scen(g).combos; for (var i = 0; i < cs.length; i++) if (cs[i].r === r && cs[i].b === b) return cs[i]; return null; }
  function needOk(g, need) { return !need || seen(g, need); }
  function norm(v) { return String(v == null ? '' : v).trim().replace(/[·•]/g, '.').replace(/[–—_]/g, '-').replace(/\s+/g, ' ').toUpperCase(); }

  /* ---------- azioni ---------- */
  function act(g, p, a, now) {
    if (!a || !a.a) return 'Azione sconosciuta.';
    if (g.phase !== 'play') return a.a === 'look' ? null : 'La partita è finita.';
    tick(g, now == null ? Date.now() : now);
    if (expire(g)) return a.a === 'look' ? null : 'Il tempo è scaduto.';
    g.seq++;
    var c, id = a.id != null ? String(a.id) : null;
    switch (a.a) {
      case 'reveal': {
        if (!card(g, id)) return 'Questa carta non esiste.';
        if (seen(g, id)) return null;
        if (!visible(g, id)) return 'Non vedi questo numero sulle carte in tavola.';
        reveal(g, id, p); return null;
      }
      case 'combine': {
        var r = String(a.r), b = String(a.b), cr = card(g, r);
        if (!cr || !onTable(g, r) || cr.k !== 'red') return 'Scegli una carta rossa che sia in tavola.';
        if (b.charAt(0) === '+') { if (!mods(g).some(function (m) { return '+' + m.v === b; })) return 'Questo modificatore non è in tavola.'; }
        else { var cb = card(g, b); if (!cb || !onTable(g, b) || cb.k !== 'blue') return 'Scegli una carta blu che sia in tavola.'; }
        var m = combo(g, r, b);
        if (m && !seen(g, m.to)) { fx(g, { k: 'combo', r: r, b: b, to: m.to, p: p }); reveal(g, m.to, p); return null; }
        if (m) return 'Avete già unito queste due carte.';
        var cm = costs(g).miss; g.pen += cm; g.tries.miss++;
        fx(g, { k: 'miss', r: r, b: b, p: p, s: cm });
        log(g, who(g, p) + ' prova a unire ' + r + ' e ' + b + ': non succede niente (−' + mins(cm) + ').', p, 'miss');
        expire(g); return null;
      }
      case 'code': {
        c = card(g, id); if (!c || !onTable(g, id) || !c.code) return 'Questo lucchetto non è in tavola.';
        if (!needOk(g, c.code.need)) return c.code.needMsg || 'Non funziona ancora.';
        var v = String(a.v || '').replace(/\D/g, '');
        if (v.length !== 4) return 'Il codice ha 4 cifre.';
        if (seen(g, c.code.to)) return null;
        if (v === c.code.ans) { fx(g, { k: 'unlock', id: id, p: p }); log(g, who(g, p) + ' apre «' + c.t + '» con il codice ' + v + '.', p, 'ok'); reveal(g, c.code.to, p); return null; }
        var cc = costs(g).code; g.pen += cc; g.tries.code++;
        fx(g, { k: 'wrong', id: id, p: p, s: cc, v: v });
        log(g, who(g, p) + ' prova il codice ' + v + ' su «' + c.t + '»: sbagliato (−' + mins(cc) + ').', p, 'miss');
        expire(g); return null;
      }
      case 'machine': {
        c = card(g, id); if (!c || !onTable(g, id) || !c.mac) return 'Questa macchina non è in tavola.';
        if (!needOk(g, c.mac.need)) return c.mac.needMsg || 'La macchina non funziona ancora.';
        if (seen(g, c.mac.to)) return null;
        if (norm(a.v) && norm(a.v) === norm(c.mac.ans)) { fx(g, { k: 'mac', id: id, p: p }); log(g, who(g, p) + ' fa funzionare «' + c.t + '».', p, 'ok'); reveal(g, c.mac.to, p); return null; }
        var cx = costs(g).mac; g.pen += cx; g.tries.mac++;
        fx(g, { k: 'macno', id: id, p: p, s: cx });
        log(g, who(g, p) + ' prova «' + c.t + '»: non succede niente (−' + mins(cx) + ').', p, 'miss');
        expire(g); return null;
      }
      case 'hint': {
        c = card(g, id); if (!c || !onTable(g, id) || !c.h) return 'Per questa carta non ci sono indizi.';
        var lvl = a.lvl === 2 ? 2 : 1, cur = g.hints[id] || 0;
        if (lvl === 2 && cur < 1) return 'Prima chiedi il primo indizio.';
        if (cur >= lvl) return null;
        if (hintsLeft(g) === 0) return 'Avete finito gli indizi di questa avventura.';
        g.hints[id] = lvl; g.hintN++;
        var hc = lvl === 2 ? costs(g).sol : costs(g).hint; if (hc) g.pen += hc;
        fx(g, { k: 'hint', id: id, lvl: lvl, p: p, s: hc });
        log(g, who(g, p) + (lvl === 2 ? ' chiede la soluzione per ' : ' chiede un indizio per ') + label(id) + (hc ? ' (−' + mins(hc) + ')' : '') + '.', p, 'hint');
        expire(g); return null;
      }
      case 'search': {   // un numero calcolato: se esiste e si può trovare esce, altrimenti si perde tempo
        var sid = String(a.id || '').replace(/\D/g, '').replace(/^0+/, '');
        if (!sid || +sid < 1 || +sid > 99) return 'Scrivi un numero da 1 a 99.';
        if (seen(g, sid)) return E_SEEN(g, sid);
        if (card(g, sid) && findable(g, sid)) { fx(g, { k: 'found', id: sid, p: p }); log(g, who(g, p) + ' cerca la carta ' + sid + ' e la trova!', p, 'ok'); reveal(g, sid, p); return null; }
        var cs = costs(g).search; g.pen += cs; g.tries.search++;
        fx(g, { k: 'nosearch', id: sid, p: p, s: cs });
        log(g, who(g, p) + ' cerca la carta ' + sid + ': non c’è (−' + mins(cs) + ').', p, 'miss');
        expire(g); return null;
      }
      case 'pause': {
        g.paused = !!a.on; fx(g, { k: 'pause', on: g.paused, p: p });
        log(g, who(g, p) + (g.paused ? ' mette in pausa il tempo.' : ' fa ripartire il tempo.'), p, 'sys');
        return null;
      }
      case 'ping': { if (!onTable(g, id)) return null; fx(g, { k: 'ping', id: id, p: p }); return null; }
      case 'look': { g.seq--; var l = id && onTable(g, id) ? id : null; if ((g.look[p] || null) === l) return 'same'; g.look[p] = l; return null; }
    }
    return 'Azione sconosciuta.';
  }
  function E_SEEN(g, id) { return onTable(g, id) ? 'La carta ' + id + ' è già in tavola.' : 'La carta ' + id + ' è già stata scartata.'; }
  function decider() { return null; }
  return { newGame: newGame, act: act, tick: tick, expire: expire, costs: costs, hintsLeft: hintsLeft, mins: mins, findable: findable, elapsed: elapsed, remaining: remaining, stars: stars, card: card, scen: scen, table: table, gone: gone,
    mods: mods, visible: visible, seen: seen, onTable: onTable, combo: combo, norm: norm, decider: decider, label: label, MISS: MISS, WRONG_CODE: WRONG_CODE, WRONG_MAC: WRONG_MAC };
})();
if (typeof module !== 'undefined') module.exports = UEngine;
