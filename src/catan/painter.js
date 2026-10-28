/* ===== Catan: l'isola dipinta (su canvas, una volta per partita) =====
   Mare con le onde, spiaggia attorno all'isola, moli dei porti e i sei terreni disegnati a mano:
   foreste di abeti, pascoli con le pecore, campi di grano a filari, colline d'argilla con la fornace,
   montagne innevate con la miniera e il deserto con le dune. Tutto originale, generato al volo. */
var CTPainter = (function () {
  var D = CTData, S = D.S;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }
  function hexPath(c, x, y, r) { c.beginPath(); for (var k = 0; k < 6; k++) { var a = (60 * k - 90) * Math.PI / 180; if (k) c.lineTo(x + r * Math.cos(a), y + r * Math.sin(a)); else c.moveTo(x + r * Math.cos(a), y + r * Math.sin(a)); } c.closePath(); }
  function inHex(x, y, r) { var ax = Math.abs(x), ay = Math.abs(y); return ay <= r && ax <= r * 0.866 && ax * 0.5774 + ay <= r; }
  function spots(R, n, r, minD) {   // punti sparsi dentro l'esagono, non troppo vicini
    var out = [], tries = 0;
    while (out.length < n && tries++ < n * 40) {
      var x = (R() * 2 - 1) * r, y = (R() * 2 - 1) * r; if (!inHex(x, y, r)) continue;
      if (out.some(function (p) { return Math.hypot(p[0] - x, p[1] - y) < minD; })) continue;
      out.push([x, y]);
    }
    return out.sort(function (a, b) { return a[1] - b[1]; });
  }
  function base(c, a, b) { var gr = c.createRadialGradient(-12, -18, 6, 0, 0, S * 1.05); gr.addColorStop(0, a); gr.addColorStop(1, b); c.fillStyle = gr; c.fillRect(-S, -S, S * 2, S * 2); }
  function speckle(c, R, n, cols, sz) { for (var i = 0; i < n; i++) { c.fillStyle = cols[Math.floor(R() * cols.length)]; var x = (R() * 2 - 1) * S, y = (R() * 2 - 1) * S; c.fillRect(x, y, sz || 1.4, sz || 1.4); } }
  function shadow(c, x, y, rx, ry, a) { c.fillStyle = 'rgba(20,25,10,' + (a || .25) + ')'; c.beginPath(); c.ellipse(x, y, rx, ry, 0, 0, 7); c.fill(); }

  /* ---------- foresta: abeti a strati e qualche latifoglia ---------- */
  function forest(c, R) {
    base(c, '#55803a', '#2b4f22');
    speckle(c, R, 260, ['rgba(20,45,15,.35)', 'rgba(120,160,70,.25)'], 1.6);
    spots(R, 26, 50, 10).forEach(function (p) {
      var x = p[0], y = p[1], h = 15 + R() * 7, w = h * 0.55;
      if (R() < 0.18) {   // latifoglia
        shadow(c, x + 2, y + 2, 7, 2.6);
        c.fillStyle = '#5b3a1e'; c.fillRect(x - 1, y - 5, 2.2, 6);
        [['#3e6e2a', 0, -10, 6.5], ['#4f8434', -3, -12, 4.5], ['#2f5a22', 3, -8, 4.2], ['#6a9a42', -1.5, -13.5, 2.6]].forEach(function (b) { c.fillStyle = b[0]; c.beginPath(); c.arc(x + b[1], y + b[2], b[3], 0, 7); c.fill(); });
        return;
      }
      shadow(c, x + 3, y + 1.5, w * 0.8, 2.4);
      c.fillStyle = '#4a2f18'; c.fillRect(x - 1.1, y - 3, 2.2, 4);
      for (var k = 0; k < 3; k++) {
        var ty = y - 3 - k * h * 0.27, tw = w * (1 - k * 0.24), th = h * 0.46;
        c.fillStyle = k === 2 ? '#2f6a2c' : '#24562a';
        c.beginPath(); c.moveTo(x, ty - th); c.lineTo(x + tw, ty); c.lineTo(x - tw, ty); c.closePath(); c.fill();
        c.fillStyle = 'rgba(150,200,110,.38)';   // luce da sinistra
        c.beginPath(); c.moveTo(x, ty - th); c.lineTo(x, ty); c.lineTo(x - tw, ty); c.closePath(); c.fill();
      }
    });
  }
  /* ---------- pascolo: prato, staccionata, pecore ---------- */
  function pasture(c, R) {
    base(c, '#b6db6c', '#76a840');
    c.strokeStyle = 'rgba(70,120,30,.45)'; c.lineWidth = 1; c.lineCap = 'round';
    for (var i = 0; i < 140; i++) { var x = (R() * 2 - 1) * S, y = (R() * 2 - 1) * S; c.beginPath(); c.moveTo(x, y); c.lineTo(x - 1.4, y - 3.4); c.moveTo(x, y); c.lineTo(x + 1.3, y - 3.2); c.stroke(); }
    for (var f = 0; f < 18; f++) { c.fillStyle = R() < .5 ? '#fff6b0' : '#f3f3f3'; c.beginPath(); c.arc((R() * 2 - 1) * 46, (R() * 2 - 1) * 46, 1.1, 0, 7); c.fill(); }
    // staccionata
    var fy = 16 + R() * 10; c.strokeStyle = '#8a6036'; c.lineWidth = 1.6;
    c.beginPath(); c.moveTo(-50, fy + 10); c.quadraticCurveTo(-10, fy - 6, 46, fy + 4); c.stroke();
    c.beginPath(); c.moveTo(-50, fy + 15); c.quadraticCurveTo(-10, fy - 1, 46, fy + 9); c.stroke();
    for (var t = 0; t <= 8; t++) { var u = t / 8, px = (1 - u) * (1 - u) * -50 + 2 * (1 - u) * u * -10 + u * u * 46, py = (1 - u) * (1 - u) * (fy + 10) + 2 * (1 - u) * u * (fy - 6) + u * u * (fy + 4); c.fillStyle = '#6b4626'; c.fillRect(px - 1, py - 3, 2.2, 10); }
    // pecore
    spots(R, 6, 38, 15).forEach(function (p) {
      var x = p[0], y = p[1], d = R() < .5 ? 1 : -1;
      shadow(c, x + 1, y + 5, 8, 2.2, .22);
      c.fillStyle = '#2b2622'; [-4, -1.5, 2, 4.5].forEach(function (lx) { c.fillRect(x + lx * d - .7, y + 1, 1.5, 4.5); });
      c.fillStyle = '#fbf8ef'; [[-3.6, -1, 3.6], [0, -2.6, 4.2], [3.6, -1, 3.6], [0, .8, 3.8], [-1.6, -4, 2.6], [2, -4.2, 2.6]].forEach(function (b) { c.beginPath(); c.arc(x + b[0] * d, y + b[1], b[2], 0, 7); c.fill(); });
      c.strokeStyle = 'rgba(120,110,90,.35)'; c.lineWidth = .6; c.beginPath(); c.arc(x, y - 1.6, 5.6, 0.2, 2.9); c.stroke();
      c.fillStyle = '#2b2622'; c.beginPath(); c.ellipse(x + 7 * d, y - 3, 2.6, 2.1, d * 0.4, 0, 7); c.fill();
      c.fillStyle = '#fff'; c.fillRect(x + 7.6 * d, y - 3.8, .9, .9);
    });
  }
  /* ---------- campi: filari di grano dorato, covoni ---------- */
  function fields(c, R) {
    base(c, '#f0cf62', '#c4932b');
    c.save(); c.rotate(-0.42 + R() * 0.2);
    for (var r = -S * 1.3; r < S * 1.3; r += 7) {
      c.strokeStyle = (Math.round(r / 7) % 2) ? 'rgba(160,110,20,.35)' : 'rgba(255,240,170,.35)'; c.lineWidth = 3.4;
      c.beginPath(); c.moveTo(-S * 1.3, r); for (var x = -S * 1.3; x <= S * 1.3; x += 10) c.lineTo(x, r + Math.sin(x / 13 + r) * 1.2); c.stroke();
    }
    c.restore();
    // spighe
    c.strokeStyle = 'rgba(140,95,20,.55)'; c.lineWidth = .8;
    for (var i = 0; i < 70; i++) { var sx = (R() * 2 - 1) * S, sy = (R() * 2 - 1) * S; c.beginPath(); c.moveTo(sx, sy); c.lineTo(sx + 1, sy - 4); c.stroke(); c.fillStyle = 'rgba(255,230,140,.8)'; c.beginPath(); c.ellipse(sx + 1, sy - 5, 1, 2, 0.2, 0, 7); c.fill(); }
    // covoni
    spots(R, 4, 38, 18).forEach(function (p) {
      var x = p[0], y = p[1];
      shadow(c, x + 2, y + 4, 7, 2.2);
      c.fillStyle = '#d6a539'; c.beginPath(); c.moveTo(x - 6, y + 4); c.lineTo(x - 2.5, y - 8); c.lineTo(x + 2.5, y - 8); c.lineTo(x + 6, y + 4); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(120,80,15,.6)'; c.lineWidth = .7; for (var k = -4; k <= 4; k += 2) { c.beginPath(); c.moveTo(x + k, y + 4); c.lineTo(x + k * 0.4, y - 8); c.stroke(); }
      c.fillStyle = '#8b5a1a'; c.fillRect(x - 4, y - 3, 8, 1.6);
      c.fillStyle = '#f1cd6a'; c.beginPath(); c.ellipse(x, y - 9, 4.2, 2.6, 0, 0, 7); c.fill();
    });
  }
  /* ---------- colline: argilla rossa, cava, mattoni e fornace ---------- */
  function hills(c, R) {
    base(c, '#d98457', '#9c4a2a');
    // gobbe delle colline
    [[-26, -14, 30], [18, -24, 26], [-6, 22, 34], [30, 14, 22]].forEach(function (h) {
      var gr = c.createRadialGradient(h[0] - h[2] * .3, h[1] - h[2] * .4, 2, h[0], h[1], h[2]); gr.addColorStop(0, 'rgba(240,160,110,.75)'); gr.addColorStop(.7, 'rgba(180,85,45,.35)'); gr.addColorStop(1, 'rgba(120,50,25,0)');
      c.fillStyle = gr; c.beginPath(); c.ellipse(h[0], h[1], h[2], h[2] * .62, 0, 0, 7); c.fill();
    });
    c.strokeStyle = 'rgba(110,45,20,.35)'; c.lineWidth = 1;
    for (var i = 0; i < 9; i++) { var x = (R() * 2 - 1) * 40, y = (R() * 2 - 1) * 40; c.beginPath(); c.arc(x, y, 8 + R() * 10, Math.PI * 1.1, Math.PI * 1.9); c.stroke(); }
    speckle(c, R, 160, ['rgba(90,35,15,.4)', 'rgba(255,200,160,.35)'], 1.5);
    // cava d'argilla
    var px = -18 + R() * 10, py = 8 + R() * 8;
    c.fillStyle = '#7a3418'; c.beginPath(); c.ellipse(px, py, 13, 6.5, -0.1, 0, 7); c.fill();
    c.fillStyle = '#a24c26'; c.beginPath(); c.ellipse(px + 1, py + 1.2, 9.5, 4, -0.1, 0, 7); c.fill();
    // mattoni impilati
    var bx = 14, by = 22;
    shadow(c, bx + 2, by + 2, 12, 2.6);
    for (var row = 0; row < 3; row++) for (var col = 0; col < 3 - row; col++) {
      var x0 = bx - 9 + col * 7 + row * 3.5, y0 = by - row * 4;
      c.fillStyle = '#b5482a'; c.fillRect(x0, y0 - 3.6, 6.4, 3.6); c.fillStyle = '#d9714a'; c.fillRect(x0, y0 - 3.6, 6.4, 1.1); c.strokeStyle = '#6a2412'; c.lineWidth = .5; c.strokeRect(x0, y0 - 3.6, 6.4, 3.6);
    }
    // fornace
    var kx = 6 + R() * 6, ky = -16;
    shadow(c, kx + 2, ky + 9, 11, 3);
    c.fillStyle = '#8c3a1e'; c.beginPath(); c.moveTo(kx - 10, ky + 8); c.quadraticCurveTo(kx - 10, ky - 8, kx, ky - 9); c.quadraticCurveTo(kx + 10, ky - 8, kx + 10, ky + 8); c.closePath(); c.fill();
    c.fillStyle = 'rgba(255,190,140,.35)'; c.beginPath(); c.moveTo(kx - 10, ky + 8); c.quadraticCurveTo(kx - 10, ky - 8, kx, ky - 9); c.lineTo(kx - 3, ky + 8); c.closePath(); c.fill();
    c.fillStyle = '#2b130a'; c.beginPath(); c.arc(kx, ky + 8, 3.6, Math.PI, 0); c.fill();
    c.fillStyle = '#ffb04a'; c.beginPath(); c.arc(kx, ky + 8, 1.8, Math.PI, 0); c.fill();
    c.fillStyle = '#5b2412'; c.fillRect(kx + 4, ky - 14, 3.2, 7);
    c.fillStyle = 'rgba(230,230,230,.5)'; [[kx + 6, ky - 17, 2.6], [kx + 8, ky - 21, 3.2], [kx + 11, ky - 25, 3.6]].forEach(function (s) { c.beginPath(); c.arc(s[0], s[1], s[2], 0, 7); c.fill(); });
  }
  /* ---------- montagne: vette innevate, venature di minerale, miniera ---------- */
  function mountains(c, R) {
    base(c, '#a2a7ad', '#5a6068');
    speckle(c, R, 200, ['rgba(40,45,50,.4)', 'rgba(230,235,240,.3)'], 1.5);
    var peaks = [[-24, -2, 30, 42], [16, -10, 34, 50], [-4, 26, 26, 30], [32, 24, 20, 26], [-40, 22, 18, 22]];
    peaks.sort(function (a, b) { return a[1] - b[1]; }).forEach(function (pk) {
      var x = pk[0], y = pk[1] + 14, w = pk[2], h = pk[3];
      shadow(c, x + 4, y + 1, w * .8, 3, .2);
      c.fillStyle = '#5d636b'; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h); c.lineTo(x + w, y); c.closePath(); c.fill();
      c.fillStyle = '#8e949b'; c.beginPath(); c.moveTo(x - w, y); c.lineTo(x, y - h); c.lineTo(x - w * .1, y); c.closePath(); c.fill();
      c.fillStyle = '#f4f7fa'; c.beginPath(); c.moveTo(x - w * .3, y - h * .7); c.lineTo(x, y - h); c.lineTo(x + w * .3, y - h * .7); c.lineTo(x + w * .12, y - h * .62); c.lineTo(x, y - h * .72); c.lineTo(x - w * .14, y - h * .6); c.closePath(); c.fill();
      c.strokeStyle = 'rgba(40,44,50,.5)'; c.lineWidth = .8; c.beginPath(); c.moveTo(x, y - h); c.lineTo(x + w * .08, y - h * .4); c.lineTo(x - w * .05, y); c.stroke();
    });
    // venature
    for (var i = 0; i < 10; i++) { var vx = (R() * 2 - 1) * 40, vy = (R() * 2 - 1) * 30 + 10; c.fillStyle = R() < .5 ? '#9fb7c9' : '#c9b46a'; c.beginPath(); c.moveTo(vx, vy - 2); c.lineTo(vx + 1.6, vy); c.lineTo(vx, vy + 2); c.lineTo(vx - 1.6, vy); c.closePath(); c.fill(); }
    // ingresso della miniera con carrello
    var mx = -12 + R() * 8, my = 36;
    c.fillStyle = '#6b4a2a'; c.fillRect(mx - 7, my - 9, 2, 9); c.fillRect(mx + 5, my - 9, 2, 9); c.fillRect(mx - 8, my - 10, 16, 2);
    c.fillStyle = '#1d1a18'; c.fillRect(mx - 5, my - 8, 10, 8);
    c.strokeStyle = '#3c3530'; c.lineWidth = 1; c.beginPath(); c.moveTo(mx - 2, my); c.lineTo(mx + 16, my + 4); c.moveTo(mx + 2, my); c.lineTo(mx + 19, my + 2); c.stroke();
    c.fillStyle = '#4a4d52'; c.fillRect(mx + 10, my - 3, 7, 4); c.fillStyle = '#8fa6b8'; c.beginPath(); c.arc(mx + 13.5, my - 3.5, 2.6, Math.PI, 0); c.fill();
  }
  /* ---------- deserto: dune, sassi, un'oasi secca ---------- */
  function desert(c, R) {
    base(c, '#f0dca6', '#cfae6a');
    for (var i = -4; i < 6; i++) {
      var y = i * 13 + R() * 4;
      c.strokeStyle = 'rgba(255,248,220,.6)'; c.lineWidth = 2.2; c.beginPath(); c.moveTo(-S, y); c.bezierCurveTo(-25, y - 9, 10, y + 8, S, y - 4); c.stroke();
      c.strokeStyle = 'rgba(160,120,60,.32)'; c.lineWidth = 1.6; c.beginPath(); c.moveTo(-S, y + 3); c.bezierCurveTo(-25, y - 6, 10, y + 11, S, y - 1); c.stroke();
    }
    speckle(c, R, 220, ['rgba(150,110,50,.4)', 'rgba(255,250,230,.5)'], 1.2);
    spots(R, 5, 40, 14).forEach(function (p) { shadow(c, p[0] + 1.5, p[1] + 2, 4.6, 1.6); c.fillStyle = '#9b8a72'; c.beginPath(); c.ellipse(p[0], p[1], 4 + R() * 2, 2.6, R(), 0, 7); c.fill(); c.fillStyle = 'rgba(255,255,255,.3)'; c.beginPath(); c.ellipse(p[0] - 1, p[1] - 1, 2, 1, 0, 0, 7); c.fill(); });
    // cactus
    var cx = 20, cy = -16; shadow(c, cx + 3, cy + 12, 6, 2);
    c.fillStyle = '#6c8f3e'; c.beginPath(); c.roundRect ? c.roundRect(cx - 2.6, cy - 10, 5.2, 22, 2.6) : c.rect(cx - 2.6, cy - 10, 5.2, 22); c.fill();
    c.beginPath(); c.roundRect ? c.roundRect(cx - 8, cy - 4, 3.6, 9, 1.8) : c.rect(cx - 8, cy - 4, 3.6, 9); c.fill(); c.fillRect(cx - 6, cy + 3, 4, 2.6);
    c.beginPath(); c.roundRect ? c.roundRect(cx + 4.4, cy - 7, 3.6, 8, 1.8) : c.rect(cx + 4.4, cy - 7, 3.6, 8); c.fill(); c.fillRect(cx + 2, cy - 1, 4, 2.6);
    c.fillStyle = 'rgba(255,255,255,.25)'; c.fillRect(cx - 1.6, cy - 9, 1.2, 20);
  }
  var PAINT = { forest: forest, pasture: pasture, fields: fields, hills: hills, mountains: mountains, desert: desert };

  /* ---------- tutto il tabellone ---------- */
  function paint(cv, hex, scale) {
    var W = D.W, H = D.H, s = scale || 2;
    cv.width = Math.round(W * s); cv.height = Math.round(H * s);
    var c = cv.getContext('2d'); c.scale(s, s);
    var R = rng(hex.map(function (h) { return h.t.length + (h.n || 0); }).join('').length * 7919 + 20261028);
    // mare
    var sea = c.createRadialGradient(D.CX, D.CY, 60, D.CX, D.CY, Math.max(W, H) * .72);
    sea.addColorStop(0, '#3d93b4'); sea.addColorStop(.6, '#246f95'); sea.addColorStop(1, '#123f5c');
    c.fillStyle = sea; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 40; i++) { var x = R() * W, y = R() * H, r = 30 + R() * 90, gr = c.createRadialGradient(x, y, 0, x, y, r); gr.addColorStop(0, R() < .5 ? 'rgba(255,255,255,.05)' : 'rgba(5,30,50,.08)'); gr.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2); }
    c.strokeStyle = 'rgba(210,240,250,.22)'; c.lineWidth = 1.1; c.lineCap = 'round';
    for (var w = 0; w < 260; w++) { var wx = R() * W, wy = R() * H; c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 4, wy - 3, wx + 8, wy); c.quadraticCurveTo(wx + 12, wy + 3, wx + 16, wy); c.stroke(); }
    // schiuma e spiaggia attorno all'isola
    [[1.42, 'rgba(220,245,250,.10)'], [1.32, 'rgba(220,245,250,.16)'], [1.24, 'rgba(235,250,250,.32)']].forEach(function (b) { c.fillStyle = b[1]; D.hexes.forEach(function (h) { hexPath(c, h.x, h.y, S * b[0]); c.fill(); }); });
    c.save(); c.shadowColor = 'rgba(10,30,40,.45)'; c.shadowBlur = 12; c.shadowOffsetY = 3; c.fillStyle = '#e4cc8e'; D.hexes.forEach(function (h) { hexPath(c, h.x, h.y, S * 1.15); c.fill(); }); c.restore();
    c.fillStyle = '#ecd8a2'; D.hexes.forEach(function (h) { hexPath(c, h.x, h.y, S * 1.1); c.fill(); });
    for (var k = 0; k < 500; k++) { var hx = D.hexes[Math.floor(R() * 19)], ax = hx.x + (R() * 2 - 1) * S * 1.15, ay = hx.y + (R() * 2 - 1) * S * 1.15; c.fillStyle = R() < .5 ? 'rgba(170,130,70,.35)' : 'rgba(255,250,230,.5)'; c.fillRect(ax, ay, 1.2, 1.2); }
    // moli dei porti
    D.harborPos.forEach(function (hp) {
      var e = D.edges[hp.e];
      [e.a, e.b].forEach(function (v) {
        var vx = D.verts[v].x, vy = D.verts[v].y, dx = hp.x - vx, dy = hp.y - vy, L = Math.hypot(dx, dy), ux = dx / L, uy = dy / L;
        var x1 = vx + ux * L * 0.72, y1 = vy + uy * L * 0.72;
        c.strokeStyle = 'rgba(20,30,30,.35)'; c.lineWidth = 6.5; c.beginPath(); c.moveTo(vx + 1, vy + 2); c.lineTo(x1 + 1, y1 + 2); c.stroke();
        c.strokeStyle = '#8a5d33'; c.lineWidth = 5; c.beginPath(); c.moveTo(vx, vy); c.lineTo(x1, y1); c.stroke();
        c.strokeStyle = '#5c3a1c'; c.lineWidth = 1; for (var t = 0.1; t < 0.95; t += 0.14) { var px = vx + (x1 - vx) * t, py = vy + (y1 - vy) * t; c.beginPath(); c.moveTo(px - uy * 2.5, py + ux * 2.5); c.lineTo(px + uy * 2.5, py - ux * 2.5); c.stroke(); }
      });
    });
    // tessere
    D.hexes.forEach(function (h, hi) {
      var t = hex[hi].t, Rt = rng(hi * 1013 + t.length * 77 + 5);
      c.save(); c.translate(h.x, h.y); hexPath(c, 0, 0, S - 1.6); c.clip();
      PAINT[t](c, Rt);
      // luce dall'alto a sinistra e bordo in rilievo
      var lg = c.createLinearGradient(-S, -S, S, S); lg.addColorStop(0, 'rgba(255,255,240,.16)'); lg.addColorStop(.5, 'rgba(0,0,0,0)'); lg.addColorStop(1, 'rgba(0,0,20,.18)'); c.fillStyle = lg; c.fillRect(-S, -S, S * 2, S * 2);
      c.lineWidth = 5; c.strokeStyle = 'rgba(255,250,225,.22)'; hexPath(c, 0, 0, S - 3.5); c.stroke();
      c.restore();
      c.lineWidth = 2.6; c.strokeStyle = 'rgba(60,45,25,.75)'; hexPath(c, h.x, h.y, S - 1.2); c.stroke();
    });
    c.lineWidth = 1; c.strokeStyle = 'rgba(255,240,200,.35)'; D.hexes.forEach(function (h) { hexPath(c, h.x, h.y, S + .4); c.stroke(); });
    // vignettatura
    var vg = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * .42, W / 2, H / 2, Math.max(W, H) * .75); vg.addColorStop(0, 'rgba(0,0,0,0)'); vg.addColorStop(1, 'rgba(0,10,20,.45)'); c.fillStyle = vg; c.fillRect(0, 0, W, H);
  }
  // un solo terreno, per le icone e le schede
  function tile(cv, t, size) {
    var s = (size || 120) / (S * 2); cv.width = cv.height = Math.round(size || 120);
    var c = cv.getContext('2d'); c.scale(s, s); c.translate(S, S);
    hexPath(c, 0, 0, S - 1); c.save(); c.clip(); PAINT[t](c, rng(t.length * 31 + 3)); c.restore();
    c.lineWidth = 2.6; c.strokeStyle = 'rgba(60,45,25,.8)'; hexPath(c, 0, 0, S - 1.3); c.stroke();
  }
  return { paint: paint, tile: tile };
})();
