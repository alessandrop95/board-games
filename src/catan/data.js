/* ===== Catan: dati del gioco e geometria dell'isola =====
   Isola di 19 esagoni con le punte in alto (righe 3-4-5-4-3). Da qui si calcolano una volta per tutte
   i 54 incroci (dove stanno colonie e città), i 72 lati (dove stanno le strade) e i 30 lati della costa
   (dove stanno i 9 porti). Le tessere e i numeri cambiano a ogni partita: li sceglie il motore. */
var CTData = (function () {
  var S = 60, SQ3 = Math.sqrt(3);
  var RES = ['brick', 'wood', 'wool', 'grain', 'ore'];
  var RN = { brick: 'argilla', wood: 'legname', wool: 'lana', grain: 'grano', ore: 'minerale' };
  var RN1 = { brick: 'Argilla', wood: 'Legname', wool: 'Lana', grain: 'Grano', ore: 'Minerale' };
  var TERR = {   // terreno -> risorsa prodotta
    hills: { n: 'Colline', r: 'brick' }, forest: { n: 'Foresta', r: 'wood' }, pasture: { n: 'Pascolo', r: 'wool' },
    fields: { n: 'Campi', r: 'grain' }, mountains: { n: 'Montagne', r: 'ore' }, desert: { n: 'Deserto', r: null }
  };
  var TILES = { forest: 4, pasture: 4, fields: 4, hills: 3, mountains: 3, desert: 1 };
  var NUMBERS = [2, 3, 3, 4, 4, 5, 5, 6, 6, 8, 8, 9, 9, 10, 10, 11, 11, 12];
  var PIPS = { 2: 1, 3: 2, 4: 3, 5: 4, 6: 5, 8: 5, 9: 4, 10: 3, 11: 2, 12: 1 };   // puntini = probabilità su 36
  var HARBORS = ['3', '3', '3', '3', 'brick', 'wood', 'wool', 'grain', 'ore'];
  var COST = {
    road: { brick: 1, wood: 1 },
    settle: { brick: 1, wood: 1, wool: 1, grain: 1 },
    city: { ore: 3, grain: 2 },
    dev: { ore: 1, wool: 1, grain: 1 }
  };
  var PIECES = { road: 15, settle: 5, city: 4 };
  var DEV = { knight: 14, vp: 5, road2: 2, plenty: 2, mono: 2 };
  var DEVN = { knight: 'Cavaliere', vp: 'Punto vittoria', road2: 'Costruzione di strade', plenty: 'Invenzione', mono: 'Monopolio' };
  var VPNAMES = ['Biblioteca', 'Mercato', 'Cappella', 'Municipio', 'Università'];
  var BANK = 19;
  var PCOL = [   // colori dei giocatori: c = pezzo, d = bordo scuro, l = chiaro
    { n: 'Rosso', c: '#c8392d', d: '#6e1712', l: '#f08a7c' },
    { n: 'Blu', c: '#2e62c4', d: '#142f66', l: '#8fb2f0' },
    { n: 'Bianco', c: '#efe8d6', d: '#6b604c', l: '#ffffff' },
    { n: 'Arancione', c: '#e5862a', d: '#7a3f0c', l: '#ffc283' }
  ];

  /* ---------- geometria ---------- */
  var hexes = [];
  for (var r = -2; r <= 2; r++) for (var q = -2; q <= 2; q++) { if (Math.abs(q + r) > 2) continue; hexes.push({ q: q, r: r, x: S * SQ3 * (q + r / 2), y: S * 1.5 * r }); }
  var verts = [], vkey = {}, edges = [], ekey = {};
  function vid(x, y) {
    var k = Math.round(x * 10) + ':' + Math.round(y * 10);
    if (vkey[k] == null) { vkey[k] = verts.length; verts.push({ x: x, y: y, hexes: [], adj: [], edges: [] }); }
    return vkey[k];
  }
  hexes.forEach(function (h, hi) {
    h.v = []; h.e = [];
    for (var k = 0; k < 6; k++) { var a = (60 * k - 90) * Math.PI / 180, v = vid(h.x + S * Math.cos(a), h.y + S * Math.sin(a)); h.v.push(v); verts[v].hexes.push(hi); }
    for (var j = 0; j < 6; j++) {
      var a1 = h.v[j], b1 = h.v[(j + 1) % 6], key = Math.min(a1, b1) + '-' + Math.max(a1, b1);
      if (ekey[key] == null) { ekey[key] = edges.length; edges.push({ a: Math.min(a1, b1), b: Math.max(a1, b1), hexes: [] }); verts[a1].adj.push(b1); verts[b1].adj.push(a1); verts[a1].edges.push(ekey[key]); verts[b1].edges.push(ekey[key]); }
      edges[ekey[key]].hexes.push(hi); h.e.push(ekey[key]);
    }
  });
  edges.forEach(function (e) { e.x = (verts[e.a].x + verts[e.b].x) / 2; e.y = (verts[e.a].y + verts[e.b].y) / 2; });
  // esagoni vicini (con un lato in comune)
  hexes.forEach(function (h, hi) { h.nb = []; h.e.forEach(function (ei) { edges[ei].hexes.forEach(function (o) { if (o !== hi) h.nb.push(o); }); }); });
  // costa: i lati di un solo esagono, in giro attorno all'isola; i porti stanno su 9 di questi, a distanza 3-3-4
  var coast = edges.map(function (e, i) { return i; }).filter(function (i) { return edges[i].hexes.length === 1; })
    .sort(function (a, b) { return Math.atan2(edges[a].y, edges[a].x) - Math.atan2(edges[b].y, edges[b].x); });
  var harborEdges = [], at = 1, gaps = [3, 3, 4];
  for (var i = 0; i < 9; i++) { harborEdges.push(coast[at % coast.length]); at += gaps[i % 3]; }
  // posizione del porto in mare: dal centro dell'esagono verso fuori, oltre il lato
  var harborPos = harborEdges.map(function (ei) {
    var e = edges[ei], h = hexes[e.hexes[0]], dx = e.x - h.x, dy = e.y - h.y, L = Math.hypot(dx, dy);
    return { e: ei, x: e.x + dx / L * S * 0.62, y: e.y + dy / L * S * 0.62, ang: Math.atan2(dy, dx) };
  });
  var minX = 1e9, maxX = -1e9, minY = 1e9, maxY = -1e9;
  verts.forEach(function (v) { minX = Math.min(minX, v.x); maxX = Math.max(maxX, v.x); minY = Math.min(minY, v.y); maxY = Math.max(maxY, v.y); });
  var PAD = S * 1.35, W = Math.round(maxX - minX + PAD * 2), H = Math.round(maxY - minY + PAD * 2), OX = PAD - minX, OY = PAD - minY;
  // tutto in coordinate del tabellone (origine in alto a sinistra)
  hexes.forEach(function (h) { h.x += OX; h.y += OY; });
  verts.forEach(function (v) { v.x += OX; v.y += OY; });
  edges.forEach(function (e) { e.x += OX; e.y += OY; });
  harborPos.forEach(function (p) { p.x += OX; p.y += OY; });

  return { S: S, W: W, H: H, CX: OX, CY: OY, RES: RES, RN: RN, RN1: RN1, TERR: TERR, TILES: TILES, NUMBERS: NUMBERS, PIPS: PIPS, HARBORS: HARBORS,
    COST: COST, PIECES: PIECES, DEV: DEV, DEVN: DEVN, VPNAMES: VPNAMES, BANK: BANK, PCOL: PCOL,
    hexes: hexes, verts: verts, edges: edges, coast: coast, harborEdges: harborEdges, harborPos: harborPos };
})();
if (typeof module !== 'undefined') module.exports = CTData;
