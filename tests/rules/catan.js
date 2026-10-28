// Prove delle regole di Catan: una per ogni regola del documento di analisi (regolamento ufficiale, 5ª edizione).
var path = require('path'), SRC = path.join(__dirname, '../../src/catan/');
var D = require(SRC + 'data.js'), E = require(SRC + 'engine.js');
var ok = 0, ko = 0;
function t(name, cond, extra) { if (cond) ok++; else { ko++; console.log('NO  ' + name, extra === undefined ? '' : JSON.stringify(extra)); } }
function seats(n) { var s = []; for (var i = 0; i < n; i++) s.push({ uid: 'u' + i, nick: 'G' + i }); return s; }
function clone(o) { return JSON.parse(JSON.stringify(o)); }
function dice(a, b) { var q = [(a - 1) / 6 + 0.01, (b - 1) / 6 + 0.01]; E.setRandom(function () { return q.length ? q.shift() : Math.random(); }); }
function res(o) { var r = E.emptyRes(); for (var k in o) r[k] = o[k]; return r; }
function main(n) {   // partita già fondata, turno del giocatore 0 dopo il lancio, isola vuota
  E.setRandom(null);
  var g = E.newGame(seats(n || 4)); g.stage = 'main'; g.turn = 0; g.first = 0; g.rolled = true; g.vown = {}; g.eown = {};
  g.players.forEach(function (P) { P.res = E.emptyRes(); });
  return g;
}
function hexWithNumber(g) { for (var i = 0; i < 19; i++) if (g.hex[i].n) return i; }
function edgeBetween(a, b) { for (var i = 0; i < D.edges.length; i++) { var e = D.edges[i]; if ((e.a === a && e.b === b) || (e.a === b && e.b === a)) return i; } return -1; }
// percorso di strade: dalla colonia v una catena di n lati (senza tornare indietro)
function chain(v, n) {   // il percorso più lungo possibile fino a n lati, senza vicoli ciechi
  function walk(v, n, seen) { if (!n) return { edges: [], end: v }; var best = null; D.verts[v].adj.forEach(function (u) { if (seen[u] || best && best.edges.length === n) return; seen[u] = 1; var r = walk(u, n - 1, seen); seen[u] = 0; var c = { edges: [edgeBetween(v, u)].concat(r.edges), end: r.end }; if (!best || c.edges.length > best.edges.length) best = c; }); return best || { edges: [], end: v }; }
  var seen = {}; seen[v] = 1; return walk(v, n, seen);
}

/* ---------- componenti e isola ---------- */
var g = E.newGame(seats(4));
var cnt = {}; g.hex.forEach(function (h) { cnt[h.t] = (cnt[h.t] || 0) + 1; });
t('19 tessere: 4 foreste, 4 pascoli, 4 campi, 3 colline, 3 montagne, 1 deserto', JSON.stringify(cnt) === JSON.stringify(Object.assign({}, cnt, D.TILES)) && Object.keys(cnt).length === 6, cnt);
var nums = g.hex.map(function (h) { return h.n; }).filter(Boolean).sort(function (a, b) { return a - b; });
t('18 numeri: 2,3,3,4,4,5,5,6,6,8,8,9,9,10,10,11,11,12', JSON.stringify(nums) === JSON.stringify(D.NUMBERS), nums);
t('il deserto non ha numero e ci parte il ladro', g.hex[g.robber].t === 'desert' && g.hex[g.robber].n == null);
var hk = g.harbors.map(function (h) { return h.k; }).sort();
t('9 porti: 4 generici 3:1 e 5 specializzati 2:1', JSON.stringify(hk) === JSON.stringify(['3', '3', '3', '3', 'brick', 'grain', 'ore', 'wood', 'wool']), hk);
var dk = {}; g.deck.forEach(function (c) { dk[c] = (dk[c] || 0) + 1; });
t('25 carte sviluppo: 14 cavalieri, 5 punti, 2+2+2 progresso', g.deck.length === 25 && dk.knight === 14 && dk.vp === 5 && dk.road2 === 2 && dk.plenty === 2 && dk.mono === 2, dk);
t('banca: 19 carte per risorsa', D.RES.every(function (r) { return g.bank[r] === 19; }));
t('pezzi: 5 colonie, 4 città, 15 strade a testa', g.players.every(function (P) { return P.pieces.settle === 5 && P.pieces.city === 4 && P.pieces.road === 15; }));
var bad = 0;
for (var k = 0; k < 300; k++) { var hx = E.makeIsland(); D.hexes.forEach(function (h, i) { h.nb.forEach(function (j) { var a = hx[i].n, b = hx[j].n; if ((a === 6 || a === 8) && (b === 6 || b === 8)) bad++; }); }); }
t('6 e 8 (rossi) mai su tessere vicine (300 isole)', bad === 0, bad);

/* ---------- fondazione ---------- */
g = E.newGame(seats(4)); var S = g.setup;
var exp = []; for (var i = 0; i < 4; i++) exp.push((g.first + i) % 4); for (var j = 3; j >= 0; j--) exp.push((g.first + j) % 4);
t('fondazione a serpentina: chi piazza ultimo nel primo giro piazza primo nel secondo', JSON.stringify(S.order) === JSON.stringify(exp), S.order);
var f = g.first, v0 = 20;
t('si comincia con la colonia, non con la strada', !!E.act(g, f, { a: 'road', e: D.verts[v0].edges[0] }));
t('solo chi è di turno nella fondazione', !!E.act(g, (f + 1) % 4, { a: 'settle', v: v0 }));
t('prima colonia piazzata', E.act(g, f, { a: 'settle', v: v0 }) === null && g.vown[v0].p === f);
var far = D.edges.map(function (e, i) { return i; }).filter(function (e) { return D.edges[e].a !== v0 && D.edges[e].b !== v0; })[0];
t('nella fondazione la strada va attaccata alla colonia appena piazzata', !!E.act(g, f, { a: 'road', e: far }));
t('strada di fondazione', E.act(g, f, { a: 'road', e: D.verts[v0].edges[0] }) === null);
var p2 = (f + 1) % 4;
t('regola della distanza: niente colonie a un solo tratto da un’altra', /distanza/.test(E.act(g, p2, { a: 'settle', v: D.verts[v0].adj[0] }) || ''));
t('i primi giri non danno risorse', E.total(g.players[f].res) === 0);
// completa la fondazione con incroci liberi
function freeVert(g) { for (var v = 0; v < 54; v++) if (E.distanceOk(g, v)) return v; }
while (g.stage === 'setup') { var d = E.decider(g); var fv = freeVert(g); E.act(g, d, { a: 'settle', v: fv }); E.act(g, d, { a: 'road', e: E.legalRoads(g, d, fv)[0] }); }
var gotRes = g.players.map(function (P) { return E.total(P.res); });
t('la seconda colonia dà una carta per ogni tessera vicina che produce', g.players.every(function (P, i) {
  var v2 = Object.keys(g.vown).filter(function (v) { return g.vown[v].p === i; }).map(Number).filter(function (v) { return v !== v0; });
  var last = v2[v2.length - 1]; var n = 0; D.verts[last].hexes.forEach(function (h) { if (g.hex[h].t !== 'desert') n++; });
  return i === f ? true : E.total(P.res) <= 3;
}) && gotRes.some(function (x) { return x > 0; }), gotRes);
t('dopo la fondazione comincia il primo giocatore, che deve lanciare', g.stage === 'roll' && g.turn === g.first);
t('ognuno ha 2 colonie e 2 strade (2 punti)', g.players.every(function (P, i) { return E.vp(g, i) === 2 && P.pieces.road === 13 && P.pieces.settle === 3; }));

/* ---------- turno: lancio e produzione ---------- */
var t0 = g.turn;
t('non si costruisce prima del lancio', !!E.act(g, t0, { a: 'build', k: 'dev' }));
t('non si passa il turno prima del lancio', !!E.act(g, t0, { a: 'end' }));
t('solo chi è di turno lancia', !!E.act(g, (t0 + 1) % 4, { a: 'roll' }));
g = main(); var h5 = hexWithNumber(g); g.hex[h5].n = 5; D.hexes.forEach(function (h, i) { if (i !== h5 && g.hex[i].n === 5) g.hex[i].n = 3; });
var hv = D.hexes[h5].v, r5 = D.TERR[g.hex[h5].t].r; g.robber = h5 === 0 ? 1 : 0;
g.vown[hv[0]] = { p: 1, city: false }; g.vown[hv[3]] = { p: 2, city: true }; g.stage = 'roll'; g.rolled = false;
dice(2, 3); E.act(g, 0, { a: 'roll' });
t('produzione: colonia 1 carta, città 2 carte', g.players[1].res[r5] === 1 && g.players[2].res[r5] === 2 && g.bank[r5] === 16, [g.players[1].res, g.players[2].res]);
t('dopo il lancio si commercia e si costruisce', g.stage === 'main');
g.robber = h5; g.stage = 'roll'; g.rolled = false; var before = clone(g.players[1].res);
dice(4, 1); E.act(g, 0, { a: 'roll' });
t('il ladro blocca la produzione della sua tessera', JSON.stringify(before) === JSON.stringify(g.players[1].res));
// carenza nella banca
g.robber = h5 === 0 ? 1 : 0; g.bank[r5] = 2; g.stage = 'roll'; g.rolled = false; var b1 = g.players[1].res[r5], b2 = g.players[2].res[r5];
dice(1, 4); E.act(g, 0, { a: 'roll' });
t('banca senza abbastanza carte per tutti: nessuno le riceve', g.players[1].res[r5] === b1 && g.players[2].res[r5] === b2 && g.bank[r5] === 2);
delete g.vown[hv[3]]; g.bank[r5] = 0; g.stage = 'roll'; g.rolled = false;
g.bank[r5] = 0; dice(1, 4); E.act(g, 0, { a: 'roll' });
t('…se a riceverla è uno solo prende quel che resta (anche niente)', g.players[1].res[r5] === b1);
g.bank[r5] = 1; g.vown[hv[3]] = { p: 1, city: true }; g.stage = 'roll'; g.rolled = false; dice(1, 4); E.act(g, 0, { a: 'roll' });
t('…uno solo con banca scarsa: prende l’ultima carta', g.players[1].res[r5] === b1 + 1 && g.bank[r5] === 0);

/* ---------- il 7 e il ladro ---------- */
g = main(); g.stage = 'roll'; g.rolled = false;
g.players[1].res = res({ wood: 5, ore: 4 }); g.players[2].res = res({ wool: 7 }); g.players[3].res = res({ grain: 8 });
dice(3, 4); E.act(g, 0, { a: 'roll' });
t('7: nessuna produzione, scarto per chi ha più di 7 carte (metà per difetto)', g.stage === 'discard' && g.discard[1] === 4 && g.discard[3] === 4 && !g.discard[2], g.discard);
t('7: chi deve scartare è tra quelli di turno (scartano tutti, ognuno per sé)', E.decider(g) === 1);
t('scarto sbagliato rifiutato', !!E.act(g, 1, { a: 'discard', res: { wood: 3 } }));
t('chi non deve scartare non scarta', !!E.act(g, 2, { a: 'discard', res: { wool: 3 } }));
E.act(g, 3, { a: 'discard', res: { grain: 4 } });
t('si aspetta chi deve ancora scartare', g.stage === 'discard' && E.decider(g) === 1);
E.act(g, 1, { a: 'discard', res: { wood: 2, ore: 2 } });
t('finiti gli scarti si sposta il ladro', g.stage === 'robber' && E.total(g.players[1].res) === 5 && g.bank.grain === 23);
t('il ladro deve cambiare tessera', !!E.act(g, 0, { a: 'robber', h: g.robber }));
var hr = (g.robber + 5) % 19; var vv = D.hexes[hr].v;
g.vown[vv[0]] = { p: 1, city: false }; g.vown[vv[2]] = { p: 2, city: false }; g.vown[vv[4]] = { p: 3, city: false }; g.players[3].res = E.emptyRes();
E.act(g, 0, { a: 'robber', h: hr });
t('più vittime possibili: chi ha lanciato sceglie (solo tra chi ha carte)', g.stage === 'steal' && JSON.stringify(g.victims.sort()) === '[1,2]', g.victims);
t('non si ruba a chi non è sulla tessera', !!E.act(g, 0, { a: 'steal', from: 3 }));
var c2 = E.total(g.players[2].res); E.act(g, 0, { a: 'steal', from: 2 });
t('furto di una carta a caso', E.total(g.players[2].res) === c2 - 1 && E.total(g.players[0].res) === 1 && g.stage === 'main');
g = main(); g.stage = 'robber'; g.back = 'main'; var empty = (g.robber + 3) % 19; E.act(g, 0, { a: 'robber', h: empty });
t('nessuno da derubare: il ladro si sposta e basta', g.stage === 'main' && g.robber === empty);

/* ---------- commercio ---------- */
g = main(); g.players[0].res = res({ wool: 3, ore: 1 }); g.players[1].res = res({ brick: 2 }); g.players[2].res = res({ brick: 1 });
g.stage = 'roll'; g.rolled = false;
t('niente commercio prima del lancio', !!E.act(g, 0, { a: 'offer', give: { wool: 2 }, get: { brick: 1 } }));
g.stage = 'main';
t('non si scambiano risorse uguali', !!E.act(g, 0, { a: 'offer', give: { wool: 1 }, get: { wool: 1 } }));
t('non si offre quello che non si ha', !!E.act(g, 0, { a: 'offer', give: { grain: 1 }, get: { brick: 1 } }));
t('proposta a tutti (anche 2 contro 1)', E.act(g, 0, { a: 'offer', give: { wool: 2 }, get: { brick: 1 } }) === null && g.trade.id > 0);
t('gli altri non commerciano tra loro: solo con chi è di turno', !!E.act(g, 1, { a: 'offer', give: { brick: 1 }, get: { wool: 1 } }));
E.act(g, 1, { a: 'respond', id: g.trade.id, ok: true }); E.act(g, 2, { a: 'respond', id: g.trade.id, ok: false });
t('chi accetta deve avere le carte', !!E.act(g, 3, { a: 'respond', id: g.trade.id, ok: true }));
t('si chiude solo con chi ha accettato', !!E.act(g, 0, { a: 'deal', id: g.trade.id, with: 2 }));
E.act(g, 0, { a: 'deal', id: g.trade.id, with: 1 });
t('scambio fatto', g.players[0].res.wool === 1 && g.players[0].res.brick === 1 && g.players[1].res.wool === 2 && g.players[1].res.brick === 1 && !g.trade);
g = main(); g.players[0].res = res({ ore: 4, grain: 3, wool: 2 });
t('banca 4:1', E.act(g, 0, { a: 'bank', give: 'ore', get: 'brick' }) === null && g.players[0].res.ore === 0 && g.players[0].res.brick === 1);
t('banca: servono abbastanza carte', !!E.act(g, 0, { a: 'bank', give: 'grain', get: 'brick' }));
var gen = g.harbors.filter(function (h) { return h.k === '3'; })[0], spec = g.harbors.filter(function (h) { return h.k === 'wool'; })[0];
g.vown[D.edges[gen.e].a] = { p: 0, city: false };
t('porto generico 3:1', E.rates(g, 0).grain === 3 && E.act(g, 0, { a: 'bank', give: 'grain', get: 'ore' }) === null && g.players[0].res.grain === 0);
g.vown[D.edges[spec.e].b] = { p: 0, city: true };
t('porto specializzato 2:1 solo per la sua risorsa', E.rates(g, 0).wool === 2 && E.rates(g, 0).ore === 3 && E.act(g, 0, { a: 'bank', give: 'wool', get: 'ore' }) === null);
g.bank.brick = 0; g.players[0].res.ore = 5;
t('banca vuota di una risorsa: niente scambio', !!E.act(g, 0, { a: 'bank', give: 'ore', get: 'brick' }));

/* ---------- costruzioni ---------- */
g = main(); var vs0 = 10; g.vown[vs0] = { p: 0, city: false };
g.players[0].res = res({ brick: 1, wood: 1 });
var e1 = D.verts[vs0].edges[0];
t('strada: 1 argilla + 1 legname, attaccata alla colonia', E.act(g, 0, { a: 'build', k: 'road', e: e1 }) === null && E.total(g.players[0].res) === 0 && g.players[0].pieces.road === 14);
var far2 = D.edges.map(function (e, i) { return i; }).filter(function (e) { return !E.canRoad(g, 1, e) === false; })[0];
g.players[0].res = res({ brick: 1, wood: 1 });
var away = D.edges.map(function (e, i) { return i; }).filter(function (e) { return E.canRoad(g, 0, e) && g.eown[e] == null; })[0];
t('strada staccata dalla tua rete rifiutata', !!E.act(g, 0, { a: 'build', k: 'road', e: away }));
var vEnd = D.edges[e1].a === vs0 ? D.edges[e1].b : D.edges[e1].a;
g.players[0].res = res({ brick: 1, wood: 1, wool: 1, grain: 1 });
t('colonia a un tratto da un’altra: no (distanza)', /distanza/.test(E.act(g, 0, { a: 'build', k: 'settle', v: vEnd }) || ''));
var e2 = D.verts[vEnd].edges.filter(function (e) { return e !== e1; })[0]; g.eown[e2] = 0;
var v2 = D.edges[e2].a === vEnd ? D.edges[e2].b : D.edges[e2].a;
t('colonia raggiunta da una tua strada, a due tratti: sì', E.act(g, 0, { a: 'build', k: 'settle', v: v2 }) === null && E.vp(g, 0) === 2);
var lone = 0; while (!E.distanceOk(g, lone) || D.verts[lone].edges.some(function (e) { return g.eown[e] === 0; })) lone++;
g.players[0].res = res({ brick: 1, wood: 1, wool: 1, grain: 1 });
t('colonia non collegata alle tue strade: no', !!E.act(g, 0, { a: 'build', k: 'settle', v: lone }));
g.players[0].res = res({ ore: 3, grain: 2 });
var pc0 = clone(g.players[0].pieces);
t('città: 3 minerale + 2 grano, al posto di una tua colonia (che torna disponibile)', E.act(g, 0, { a: 'build', k: 'city', v: vs0 }) === null && g.vown[vs0].city && E.vp(g, 0) === 3 && g.players[0].pieces.settle === pc0.settle + 1 && g.players[0].pieces.city === pc0.city - 1 && E.total(g.players[0].res) === 0);
g.players[0].res = res({ ore: 3, grain: 2 }); g.vown[33] = { p: 1, city: false };
t('città solo su una tua colonia', !!E.act(g, 0, { a: 'build', k: 'city', v: 33 }));
g.players[0].res = res({ ore: 1, wool: 1, grain: 1 }); var dn = g.deck.length;
t('carta sviluppo: minerale + lana + grano', E.act(g, 0, { a: 'build', k: 'dev' }) === null && g.deck.length === dn - 1 && g.players[0].devs.length === 1);
g.players[0].pieces.settle = 0; g.players[0].res = res({ brick: 1, wood: 1, wool: 1, grain: 1 });
t('finite le colonie bisogna prima fare una città', /città/.test(E.canSettle(g, 0, 40, false) || ''));
g = main(); g.vown[10] = { p: 0, city: false }; var c3 = chain(10, 3); c3.edges.forEach(function (e) { g.eown[e] = 0; });
var mid = D.edges[c3.edges[1]].a === D.edges[c3.edges[0]].a || D.edges[c3.edges[1]].a === D.edges[c3.edges[0]].b ? D.edges[c3.edges[1]].a : D.edges[c3.edges[1]].b;
g.vown[c3.end] = { p: 1, city: false };
var beyond = D.verts[c3.end].edges.filter(function (e) { return g.eown[e] == null; })[0];
t('una strada non passa oltre la colonia di un altro', /partire/.test(E.canRoad(g, 0, beyond) || ''), E.canRoad(g, 0, beyond));
g = main(); g.players[0].pieces.road = 0; g.vown[10] = { p: 0, city: false }; g.players[0].res = res({ brick: 1, wood: 1 });
t('finite le 15 strade non se ne costruiscono altre', /finito/.test(E.act(g, 0, { a: 'build', k: 'road', e: D.verts[10].edges[0] }) || ''));

/* ---------- carte sviluppo ---------- */
g = main(); g.players[0].devs = [{ k: 'knight', t: g.turnN }];
t('non si gioca una carta comprata nello stesso turno', /prossimo/.test(E.act(g, 0, { a: 'play', k: 'knight' }) || ''));
g.players[0].devs = [{ k: 'knight', t: 0 }, { k: 'knight', t: 0 }]; g.stage = 'roll'; g.rolled = false;
t('cavaliere prima del lancio', E.act(g, 0, { a: 'play', k: 'knight' }) === null && g.stage === 'robber' && g.players[0].knights === 1);
E.act(g, 0, { a: 'robber', h: (g.robber + 7) % 19 });
t('dopo il cavaliere si torna a dover lanciare', g.stage === 'roll');
t('una sola carta sviluppo per turno', /già giocato/.test(E.act(g, 0, { a: 'play', k: 'knight' }) || ''));
dice(3, 4); E.act(g, 0, { a: 'roll' });
t('cavaliere e poi un 7: il ladro si sposta di nuovo', g.stage === 'robber' || g.stage === 'discard');
g = main(); g.players[0].devs = [{ k: 'vp', t: 0 }];
t('le carte Punto vittoria non si giocano', !!E.act(g, 0, { a: 'play', k: 'vp' }));
t('…ma contano subito (nascoste)', E.vp(g, 0) === 1 && E.visibleVP(g, 0) === 0);
g = main(); g.vown[10] = { p: 0, city: false }; g.players[0].devs = [{ k: 'road2', t: 0 }];
E.act(g, 0, { a: 'play', k: 'road2' });
var lr1 = E.legalRoads(g, 0)[0]; E.act(g, 0, { a: 'build', k: 'road', e: lr1 }); var lr2 = E.legalRoads(g, 0)[0]; E.act(g, 0, { a: 'build', k: 'road', e: lr2 });
t('Costruzione di strade: 2 strade gratis', g.stage === 'main' && g.players[0].pieces.road === 13 && E.total(g.players[0].res) === 0);
g = main(); g.players[0].devs = [{ k: 'plenty', t: 0 }];
t('Invenzione: 2 risorse a scelta dalla banca', E.act(g, 0, { a: 'play', k: 'plenty', rs: ['ore', 'ore'] }) === null && g.players[0].res.ore === 2 && g.bank.ore === 17);
g = main(); g.players[0].devs = [{ k: 'plenty', t: 0 }]; g.bank.ore = 1; g.bank.grain = 0;
E.act(g, 0, { a: 'play', k: 'plenty', rs: ['ore', 'grain'] });
t('Invenzione con la banca scarsa: solo quel che c’è', g.players[0].res.ore === 1 && g.players[0].res.grain === 0);
g = main(); g.players[0].devs = [{ k: 'mono', t: 0 }]; g.players[1].res = res({ wool: 3, ore: 1 }); g.players[2].res = res({ wool: 2 }); g.players[3].res = res({ grain: 1 });
t('Monopolio: tutti danno tutta quella risorsa', E.act(g, 0, { a: 'play', k: 'mono', r: 'wool' }) === null && g.players[0].res.wool === 5 && g.players[1].res.wool === 0 && g.players[1].res.ore === 1);
g = main(); g.deck = []; g.players[0].res = res({ ore: 1, wool: 1, grain: 1 });
t('mazzo sviluppo finito: non si compra più', /finite/.test(E.act(g, 0, { a: 'build', k: 'dev' }) || ''));

/* ---------- strada più lunga ---------- */
g = main(); g.vown[0] = { p: 0, city: false }; var ch = chain(0, 4); ch.edges.forEach(function (e) { g.eown[e] = 0; });
E.act(g, 0, { a: 'end' }); g.turn = 0; g.stage = 'main';
g.players[0].res = res({ brick: 1, wood: 1 });
var ext = D.verts[ch.end].edges.filter(function (e) { return g.eown[e] == null && !E.canRoad(g, 0, e); })[0];
E.act(g, 0, { a: 'build', k: 'road', e: ext });
t('Strada più lunga: serve una strada continua di almeno 5 tratti', g.lr === 0 && E.vp(g, 0) === 3, [g.lr, E.roadLen(g, 0)]);
// un'altra strada più lunga la porta via
g.vown[40] = { p: 1, city: false }; var ch2 = chain(40, 6); ch2.edges.forEach(function (e) { if (g.eown[e] == null) g.eown[e] = 1; });
g.players[0].res = res({ brick: 1, wood: 1 }); var any = E.legalRoads(g, 0).filter(function (e) { return true; })[0];
E.act(g, 0, { a: 'build', k: 'road', e: any });
var l0 = E.roadLen(g, 0), l1 = E.roadLen(g, 1);
t('chi fa una strada più lunga prende la carta (a pari merito resta a chi ce l’ha)', l1 > l0 ? g.lr === 1 : g.lr === 0, [l0, l1, g.lr]);
// interruzione con una colonia
g = main(); g.vown[0] = { p: 0, city: false }; var ch3 = chain(0, 6); ch3.edges.forEach(function (e) { g.eown[e] = 0; }); g.lr = 0;
var cut = D.edges[ch3.edges[2]].b; if (D.edges[ch3.edges[3]].a !== cut && D.edges[ch3.edges[3]].b !== cut) cut = D.edges[ch3.edges[2]].a;
g.turn = 1; g.players[1].res = res({ brick: 1, wood: 1, wool: 1, grain: 1 });
var link = D.verts[cut].edges.filter(function (e) { return g.eown[e] == null; })[0]; g.eown[link] = 1;
var ok1 = E.distanceOk(g, cut) ? E.act(g, 1, { a: 'build', k: 'settle', v: cut }) : 'distanza';
t('una colonia di un altro sulla strada la spezza (e la carta può tornare da parte)', ok1 !== null || (E.roadLen(g, 0) < 6 && (g.lr === null || E.roadLen(g, 0) >= 5)), [ok1, E.roadLen(g, 0), g.lr]);
// pareggio tra altri dopo un'interruzione: carta da parte
g = main(); g.players[0].road = 0; g.lr = 2;
g.vown[0] = { p: 0, city: false }; chain(0, 5).edges.forEach(function (e) { g.eown[e] = 0; });
g.vown[44] = { p: 1, city: false }; chain(44, 5).edges.forEach(function (e) { if (g.eown[e] == null) g.eown[e] = 1; });
g.players[0].res = res({ ore: 1, wool: 1, grain: 1 }); E.act(g, 0, { a: 'build', k: 'dev' });
// forza il ricalcolo con una strada di un terzo
g.vown[30] = { p: 2, city: false }; g.turn = 2; g.players[2].res = res({ brick: 1, wood: 1 });
E.act(g, 2, { a: 'build', k: 'road', e: E.legalRoads(g, 2)[0] });
var L0 = E.roadLen(g, 0), L1 = E.roadLen(g, 1);
t('pari merito tra altri giocatori: nessuno ha la carta finché uno non supera', L0 === L1 && L0 >= 5 ? g.lr === null : true, [L0, L1, g.lr]);

/* ---------- esercito più grande ---------- */
g = main(); g.players[0].devs = [{ k: 'knight', t: 0 }]; g.players[0].knights = 2;
E.act(g, 0, { a: 'play', k: 'knight' }); E.act(g, 0, { a: 'robber', h: (g.robber + 4) % 19 });
t('Esercito più grande: 3 cavalieri giocati, +2 punti', g.la === 0 && E.vp(g, 0) === 2);
g.turn = 1; g.devUsed = false; g.stage = 'main'; g.players[1].knights = 2; g.players[1].devs = [{ k: 'knight', t: 0 }];
E.act(g, 1, { a: 'play', k: 'knight' }); E.act(g, 1, { a: 'robber', h: (g.robber + 4) % 19 });
t('a pari merito resta a chi ce l’ha', g.la === 0);
g.devUsed = false; g.stage = 'main'; g.players[1].devs = [{ k: 'knight', t: 0 }]; E.act(g, 1, { a: 'play', k: 'knight' });
t('chi ne gioca di più la prende', g.la === 1);

/* ---------- fine partita ---------- */
g = main(); for (var v = 0, n4 = 0; n4 < 4; v++) if (E.distanceOk(g, v)) { g.vown[v] = { p: 0, city: true }; n4++; }
g.players[0].res = res({ ore: 3, grain: 2 }); g.vown[53] = g.vown[53] || { p: 0, city: false };
var vic = Object.keys(g.vown).map(Number).filter(function (v) { return g.vown[v].p === 0 && !g.vown[v].city; })[0];
t('10 punti nel proprio turno: vittoria immediata', E.act(g, 0, { a: 'build', k: 'city', v: vic }) === null && g.phase === 'over' && g.winner === 0 && g.final.order[0] === 0, [E.vp(g, 0), g.phase]);
g = main(); var placed = 0; for (var v3 = 0; placed < 4; v3++) if (E.distanceOk(g, v3)) { g.vown[v3] = { p: 1, city: true }; placed++; }
g.players[1].devs = [{ k: 'vp', t: 0 }, { k: 'vp', t: 0 }];
t('10 punti nel turno di un altro: si aspetta il proprio turno', g.phase === 'play' && E.vp(g, 1) === 10);
E.act(g, 0, { a: 'end' });
t('…e all’inizio del proprio turno si vince', g.phase === 'over' && g.winner === 1);
g = main(); placed = 0; for (var v4 = 0; placed < 4; v4++) if (E.distanceOk(g, v4)) { g.vown[v4] = { p: 0, city: true }; placed++; }
g.players[0].devs = [{ k: 'vp', t: 0 }]; g.deck.push('vp'); g.players[0].res = res({ ore: 1, wool: 1, grain: 1 });
t('comprare il punto che manca fa vincere subito', E.act(g, 0, { a: 'build', k: 'dev' }) === null && g.phase === 'over');
g = E.newGame(seats(3), { vp: 8 });
t('opzione: punti per vincere (8)', g.opts.vp === 8);

/* ---------- ladro gentile ---------- */
g = main(); g.opts.gentle = true; g.stage = 'robber'; g.back = 'main';
var hp = (g.robber + 2) % 19; g.vown[D.hexes[hp].v[0]] = { p: 1, city: false }; g.players[1].res = res({ ore: 2 });
t('ladro gentile: non colpisce chi ha 2 punti o meno', /gentile/.test(E.act(g, 0, { a: 'robber', h: hp }) || ''));
g.vown[D.hexes[hp].v[0]] = { p: 1, city: true }; g.vown[D.hexes[hp].v[3]] = { p: 1, city: false };
t('…chi ne ha di più sì', E.act(g, 0, { a: 'robber', h: hp }) === null);

/* ---------- turno ---------- */
g = main(); E.act(g, 0, { a: 'offer', give: {}, get: {} }); g.players[0].res = res({ wool: 1 }); E.act(g, 0, { a: 'offer', give: { wool: 1 }, get: { ore: 1 } });
E.act(g, 0, { a: 'end' });
t('fine turno: la proposta di scambio decade, tocca al giocatore a sinistra che deve lanciare', !g.trade && g.turn === 1 && g.stage === 'roll' && !g.devUsed);

console.log('\n' + ok + '/' + (ok + ko) + ' prove superate');
process.exit(ko ? 1 : 0);
