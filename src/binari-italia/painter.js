/* ===== Binari d'Italia: la carta geografica dipinta (una volta sola, su canvas) =====
   Stile carta ferroviaria d'epoca: mare con le fasce lungo la costa, terra color carta, rilievi a mano,
   laghi, fiumi, vulcani, nomi dei mari, rosa dei venti e cartiglio. Coste da Natural Earth (pubblico dominio). */
var Painter = (function () {
  var D = BIData, G = D.geo;
  function rng(seed) { var s = seed >>> 0; return function () { s = (s + 0x6D2B79F5) >>> 0; var t = s; t = Math.imul(t ^ (t >>> 15), t | 1); t ^= t + Math.imul(t ^ (t >>> 7), t | 61); return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; }

  function paint(cv, scale) {
    var W = D.W, H = D.H, s = scale || 2;
    cv.width = Math.round(W * s); cv.height = Math.round(H * s);
    var c = cv.getContext('2d'); c.scale(s, s);
    var R = rng(20261027);
    var italy = new Path2D(G.italy), others = new Path2D(G.others), lakes = new Path2D(G.lakes), rivers = new Path2D(G.rivers);
    var land = new Path2D(); land.addPath(italy); land.addPath(others);

    /* --- mare --- */
    var sea = c.createLinearGradient(0, 0, W * 0.3, H);
    sea.addColorStop(0, '#8dbfcc'); sea.addColorStop(0.55, '#77aebf'); sea.addColorStop(1, '#5f98ad');
    c.fillStyle = sea; c.fillRect(0, 0, W, H);
    for (var i = 0; i < 70; i++) { // velature
      var x = R() * W, y = R() * H, r = 40 + R() * 140, gr = c.createRadialGradient(x, y, 0, x, y, r);
      gr.addColorStop(0, R() < 0.5 ? 'rgba(255,255,255,.06)' : 'rgba(20,70,90,.06)'); gr.addColorStop(1, 'rgba(0,0,0,0)');
      c.fillStyle = gr; c.fillRect(x - r, y - r, r * 2, r * 2);
    }
    // fasce costiere (si vedono solo in mare: la terra le copre)
    c.lineJoin = 'round';
    [[34, 'rgba(255,255,255,.05)'], [24, 'rgba(255,255,255,.07)'], [15, 'rgba(225,245,245,.16)'], [8, 'rgba(235,250,248,.32)']].forEach(function (b) { c.lineWidth = b[0]; c.strokeStyle = b[1]; c.stroke(land); });
    c.setLineDash([2, 5]); c.lineWidth = 0.8; c.strokeStyle = 'rgba(30,80,100,.28)';
    [44, 30].forEach(function (w) { c.save(); c.lineWidth = w; c.strokeStyle = 'rgba(0,0,0,0)'; c.restore(); });
    c.setLineDash([]);
    // onde stilizzate
    c.strokeStyle = 'rgba(30,85,105,.22)'; c.lineWidth = 0.9; c.lineCap = 'round';
    for (var w = 0; w < 520; w++) {
      var wx = R() * W, wy = R() * H; if (c.isPointInPath(land, wx * s, wy * s) || c.isPointInPath(land, (wx + 12) * s, wy * s)) continue;
      c.beginPath(); c.moveTo(wx, wy); c.quadraticCurveTo(wx + 3, wy - 2.6, wx + 6, wy); c.quadraticCurveTo(wx + 9, wy + 2.6, wx + 12, wy); c.stroke();
    }

    /* --- terre vicine --- */
    c.save(); c.shadowColor = 'rgba(20,40,50,.35)'; c.shadowBlur = 6; c.fillStyle = '#ddd5c0'; c.fill(others); c.restore();
    c.save(); c.clip(others);
    c.strokeStyle = 'rgba(120,105,80,.16)'; c.lineWidth = 1;
    for (var h = -H; h < W + H; h += 7) { c.beginPath(); c.moveTo(h, 0); c.lineTo(h - H, H); c.stroke(); }
    c.restore();
    c.lineWidth = 0.8; c.strokeStyle = 'rgba(95,80,60,.55)'; c.stroke(others);

    /* --- Italia --- */
    c.save(); c.shadowColor = 'rgba(15,35,45,.45)'; c.shadowBlur = 10; c.shadowOffsetY = 2;
    var lg = c.createLinearGradient(0, 0, W, H); lg.addColorStop(0, '#f4e7c6'); lg.addColorStop(0.5, '#f0dfb6'); lg.addColorStop(1, '#ecd8a8');
    c.fillStyle = lg; c.fill(italy); c.restore();
    c.save(); c.clip(italy);
    // macchie della carta e pianure più verdi
    for (var k = 0; k < 160; k++) {
      var px = R() * W, py = R() * H, pr = 14 + R() * 60, pg = c.createRadialGradient(px, py, 0, px, py, pr);
      pg.addColorStop(0, R() < 0.5 ? 'rgba(160,120,60,.07)' : 'rgba(255,250,235,.12)'); pg.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = pg; c.fillRect(px - pr, py - pr, pr * 2, pr * 2);
    }
    [[290, 330, 150, 'rgba(150,175,95,.20)'], [470, 380, 120, 'rgba(150,175,95,.18)'], [640, 360, 90, 'rgba(150,175,95,.14)'], [700, 640, 120, 'rgba(160,170,95,.12)'], [770, 760, 110, 'rgba(165,170,95,.14)'], [470, 860, 90, 'rgba(150,175,95,.12)']].forEach(function (z) {
      var gz = c.createRadialGradient(z[0], z[1], 0, z[0], z[1], z[2]); gz.addColorStop(0, z[3]); gz.addColorStop(1, 'rgba(0,0,0,0)'); c.fillStyle = gz; c.fillRect(z[0] - z[2], z[1] - z[2], z[2] * 2, z[2] * 2);
    });
    // ombra interna lungo la costa
    c.lineWidth = 7; c.strokeStyle = 'rgba(150,110,55,.16)'; c.stroke(italy);
    c.lineWidth = 2.5; c.strokeStyle = 'rgba(120,85,40,.22)'; c.stroke(italy);
    c.restore();
    c.lineWidth = 1.1; c.strokeStyle = '#6f5a3a'; c.stroke(italy);

    /* --- campi e boschi (piccoli segni sparsi) --- */
    function onLand(x, y) { return c.isPointInPath(italy, x * s, y * s); }
    c.save(); c.clip(italy);
    for (var f = 0; f < 900; f++) {
      var fx = R() * W, fy = R() * H; if (!onLand(fx, fy)) continue;
      var t = R();
      if (t < 0.45) { // alberelli
        c.fillStyle = 'rgba(95,120,60,' + (0.25 + R() * 0.25) + ')'; c.beginPath(); c.arc(fx, fy, 1.6 + R() * 1.4, 0, 7); c.fill();
      } else if (t < 0.7) { // filari
        c.strokeStyle = 'rgba(140,120,70,.22)'; c.lineWidth = 0.7; for (var q = 0; q < 3; q++) { c.beginPath(); c.moveTo(fx, fy + q * 2.2); c.lineTo(fx + 7, fy + q * 2.2 - 1.5); c.stroke(); }
      }
    }
    c.restore();

    /* --- rilievi --- */
    var peaks = [];
    function along(pts, step, cb) {
      for (var i = 0; i < pts.length - 1; i++) {
        var a = pts[i], b = pts[i + 1], L = Math.hypot(b[0] - a[0], b[1] - a[1]), n = Math.max(1, Math.round(L / step));
        for (var j = 0; j < n; j++) { var tt = j / n; cb(a[0] + (b[0] - a[0]) * tt, a[1] + (b[1] - a[1]) * tt, (b[0] - a[0]) / L, (b[1] - a[1]) / L); }
      }
    }
    function addRange(pts, step, spread, size, snow, rows) {
      along(pts, step, function (x, y, ux, uy) {
        for (var r2 = 0; r2 < rows; r2++) {
          var o = (R() - 0.5) * 2 * spread, px = x - uy * o + (R() - 0.5) * 6, py = y + ux * o + (R() - 0.5) * 6;
          if (!c.isPointInPath(land, px * s, py * s)) continue;
          var sz = size * (0.65 + R() * 0.6) * (1 - Math.abs(o) / (spread * 2.4));
          peaks.push({ x: px, y: py, h: sz, snow: snow && sz > size * 0.75, it: c.isPointInPath(italy, px * s, py * s) });
        }
      });
    }
    addRange(G.ridges.alpi, 8, 18, 14, true, 2);
    addRange(G.ridges.prealpi, 9, 10, 10, false, 2);
    addRange(G.ridges.appennino, 8, 15, 11, false, 2);
    addRange(G.ridges.sicilia, 9, 8, 8, false, 2);
    addRange(G.ridges.sardegna, 9, 10, 8, false, 2);
    peaks.sort(function (a, b) { return a.y - b.y; });
    peaks.forEach(function (p) {
      var x = p.x, y = p.y, hh = p.h, w2 = hh * 0.75, lean = (R() - 0.5) * hh * 0.25;
      var top = [x + lean, y - hh];
      c.globalAlpha = p.it ? 1 : 0.55;
      c.fillStyle = 'rgba(70,50,25,.18)'; c.beginPath(); c.ellipse(x + 2, y + 1, w2 * 1.05, 2.4, 0, 0, 7); c.fill();
      c.fillStyle = '#d9c391'; c.beginPath(); c.moveTo(x - w2, y); c.lineTo(top[0], top[1]); c.lineTo(top[0] + w2 * 0.12, y); c.closePath(); c.fill();
      c.fillStyle = '#a98a56'; c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(x + w2, y); c.lineTo(top[0] + w2 * 0.12, y); c.closePath(); c.fill();
      if (p.snow) {
        c.fillStyle = '#fbf8f0'; c.beginPath(); c.moveTo(top[0], top[1]); c.lineTo(top[0] - w2 * 0.38, top[1] + hh * 0.38); c.lineTo(top[0] - w2 * 0.1, top[1] + hh * 0.3); c.lineTo(top[0] + w2 * 0.05, top[1] + hh * 0.42); c.lineTo(top[0] + w2 * 0.36, top[1] + hh * 0.36); c.closePath(); c.fill();
      }
      c.strokeStyle = '#6e5531'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - w2, y); c.lineTo(top[0], top[1]); c.lineTo(x + w2, y); c.stroke();
      c.globalAlpha = 1;
    });
    // vulcani
    function volcano(p, big) {
      var x = p[0], y = p[1] + 8, hh = big ? 20 : 14, w2 = big ? 16 : 11;
      c.fillStyle = 'rgba(70,40,20,.2)'; c.beginPath(); c.ellipse(x + 2, y + 1, w2 * 1.1, 3, 0, 0, 7); c.fill();
      c.fillStyle = '#8b6a49'; c.beginPath(); c.moveTo(x - w2, y); c.lineTo(x - 3, y - hh); c.lineTo(x + 3, y - hh); c.lineTo(x + w2, y); c.closePath(); c.fill();
      c.fillStyle = '#5e4330'; c.beginPath(); c.moveTo(x + 1, y - hh); c.lineTo(x + 3, y - hh); c.lineTo(x + w2, y); c.lineTo(x + 2, y); c.closePath(); c.fill();
      c.fillStyle = '#c4462b'; c.beginPath(); c.ellipse(x, y - hh, 3.4, 1.4, 0, 0, 7); c.fill();
      c.fillStyle = 'rgba(245,240,230,.75)';
      for (var k2 = 0; k2 < 5; k2++) { c.beginPath(); c.arc(x + 2 + k2 * 3.2, y - hh - 4 - k2 * 4.4, 2.4 + k2 * 0.9, 0, 7); c.fill(); }
      c.strokeStyle = '#4b3424'; c.lineWidth = 0.7; c.beginPath(); c.moveTo(x - w2, y); c.lineTo(x - 3, y - hh); c.moveTo(x + 3, y - hh); c.lineTo(x + w2, y); c.stroke();
    }
    volcano(G.volc.etna, true); volcano(G.volc.vesuvio, false);

    /* --- acque interne --- */
    c.lineWidth = 1.2; c.strokeStyle = 'rgba(70,130,160,.85)'; c.lineCap = 'round'; c.stroke(rivers);
    c.lineWidth = 0.5; c.strokeStyle = 'rgba(200,235,245,.6)'; c.stroke(rivers);
    c.fillStyle = '#86bccb'; c.fill(lakes); c.lineWidth = 0.8; c.strokeStyle = '#4f8399'; c.stroke(lakes);

    /* --- scritte --- */
    function spaced(txt, x, y, size, color, italic, rot) {
      c.save(); c.translate(x, y); if (rot) c.rotate(rot);
      c.font = (italic ? 'italic ' : '') + '500 ' + size + 'px "Bodoni Moda", Georgia, serif'; c.fillStyle = color; c.textAlign = 'center';
      var sp = size * 0.32, total = 0, ch = txt.split(''); ch.forEach(function (k3) { total += c.measureText(k3).width + sp; }); total -= sp;
      var cx = -total / 2; ch.forEach(function (k3) { var ww = c.measureText(k3).width; c.fillText(k3, cx + ww / 2, 0); cx += ww + sp; });
      c.restore();
    }
    G.seas.forEach(function (sd) {
      var rot = sd[0] === 'Mar Adriatico' ? -0.62 : sd[0] === 'Mar Ionio' ? -1.05 : sd[0] === 'Mar Ligure' ? 0.12 : 0;
      spaced(sd[0].toUpperCase(), sd[1], sd[2], sd[0] === 'Mar Tirreno' ? 17 : 13, 'rgba(25,70,90,.5)', true, rot);
    });
    [['FRANCIA', 42, 400], ['SVIZZERA', 250, 48], ['AUSTRIA', 560, 40], ['SLOVENIA', 760, 210], ['CROAZIA', 850, 360], ['CORSICA', 210, 520], ['TUNISIA', 150, 1080], ['BOSNIA', 905, 470]].forEach(function (l) { spaced(l[0], l[1], l[2], 10.5, 'rgba(90,75,55,.62)', false, 0); });

    /* --- rosa dei venti --- */
    (function compass(x, y, r) {
      c.save(); c.translate(x, y);
      c.strokeStyle = 'rgba(40,60,70,.55)'; c.lineWidth = 0.8; c.beginPath(); c.arc(0, 0, r, 0, 7); c.stroke(); c.beginPath(); c.arc(0, 0, r * 0.82, 0, 7); c.stroke();
      for (var k4 = 0; k4 < 32; k4++) { var a = k4 * Math.PI / 16, l = k4 % 4 === 0 ? 0.74 : 0.86; c.beginPath(); c.moveTo(Math.cos(a) * r * l, Math.sin(a) * r * l); c.lineTo(Math.cos(a) * r * 0.82, Math.sin(a) * r * 0.82); c.stroke(); }
      function star(n, len, wid, c1, c2, off) {
        for (var k5 = 0; k5 < n; k5++) {
          var a2 = off + k5 * Math.PI * 2 / n, ca = Math.cos(a2), sa = Math.sin(a2), px2 = -sa, py2 = ca;
          c.fillStyle = c1; c.beginPath(); c.moveTo(0, 0); c.lineTo(ca * len, sa * len); c.lineTo(px2 * wid, py2 * wid); c.closePath(); c.fill();
          c.fillStyle = c2; c.beginPath(); c.moveTo(0, 0); c.lineTo(ca * len, sa * len); c.lineTo(-px2 * wid, -py2 * wid); c.closePath(); c.fill();
        }
      }
      star(4, r * 0.62, r * 0.12, '#e9dcbb', '#b9a275', Math.PI / 4);
      star(4, r * 0.95, r * 0.16, '#b23a2a', '#6e1e14', -Math.PI / 2);
      c.fillStyle = '#f3e8cd'; c.beginPath(); c.arc(0, 0, r * 0.08, 0, 7); c.fill();
      c.font = '700 13px "Bodoni Moda", Georgia, serif'; c.fillStyle = '#6e1e14'; c.textAlign = 'center'; c.fillText('N', 0, -r - 6);
      c.restore();
    })(110, 980, 46);
    // scala
    (function scale(x, y) {
      var km = 100 * 0.98; // ~1 punto per km
      c.fillStyle = '#2d3c44'; c.fillRect(x, y, km / 2, 4); c.fillStyle = '#f3e8cd'; c.fillRect(x + km / 2, y, km / 2, 4);
      c.strokeStyle = '#2d3c44'; c.lineWidth = 0.8; c.strokeRect(x, y, km, 4);
      c.font = '600 9.5px "Barlow", sans-serif'; c.fillStyle = 'rgba(30,50,60,.85)'; c.textAlign = 'center';
      c.fillText('0', x, y + 15); c.fillText('50', x + km / 2, y + 15); c.fillText('100 km', x + km, y + 15);
    })(60, 1050);

    /* --- cartiglio --- */
    (function cartouche(x, y, w, h) {
      c.save(); c.shadowColor = 'rgba(0,0,0,.35)'; c.shadowBlur = 10; c.shadowOffsetY = 3;
      c.fillStyle = '#f6ecd2'; c.fillRect(x, y, w, h); c.restore();
      c.strokeStyle = '#7a2418'; c.lineWidth = 2.5; c.strokeRect(x + 4, y + 4, w - 8, h - 8);
      c.lineWidth = 0.8; c.strokeRect(x + 9, y + 9, w - 18, h - 18);
      c.fillStyle = '#7a2418'; c.textAlign = 'center';
      c.font = '500 9.5px "Barlow", sans-serif'; spaced('CARTA DELLE STRADE FERRATE', x + w / 2, y + 28, 9, '#7a2418', false, 0);
      c.font = '800 30px "Bodoni Moda", Georgia, serif'; c.fillStyle = '#2a2420'; c.fillText('Binari d’Italia', x + w / 2, y + 62);
      c.strokeStyle = '#7a2418'; c.lineWidth = 1; c.beginPath(); c.moveTo(x + 40, y + 74); c.lineTo(x + w - 40, y + 74); c.stroke();
      c.fillStyle = '#7a2418'; c.beginPath(); c.arc(x + w / 2, y + 74, 2.4, 0, 7); c.fill();
      spaced('MDCCCLXXX', x + w / 2, y + 92, 8.5, 'rgba(60,40,30,.8)', false, 0);
    })(D.W - 272, 18, 250, 106);

    /* --- carta invecchiata --- */
    var v = c.createRadialGradient(W / 2, H / 2, Math.min(W, H) * 0.42, W / 2, H / 2, Math.max(W, H) * 0.78);
    v.addColorStop(0, 'rgba(0,0,0,0)'); v.addColorStop(1, 'rgba(40,30,15,.32)'); c.fillStyle = v; c.fillRect(0, 0, W, H);
    for (var g2 = 0; g2 < 9000; g2++) { c.fillStyle = R() < 0.5 ? 'rgba(255,255,255,.045)' : 'rgba(60,40,20,.045)'; c.fillRect(R() * W, R() * H, 1 + R(), 1 + R()); }
    c.strokeStyle = '#3b2a1c'; c.lineWidth = 3; c.strokeRect(1.5, 1.5, W - 3, H - 3);
    c.strokeStyle = 'rgba(243,232,205,.8)'; c.lineWidth = 1; c.strokeRect(6, 6, W - 12, H - 12);
    return cv;
  }
  return { paint: paint };
})();
