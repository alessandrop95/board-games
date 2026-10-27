/* Campi d'Acciaio — pittore procedurale dei territori (canvas 2D, nessuna immagine esterna).
   Ogni territorio è dipinto con un seme fisso: la stessa mappa esce sempre uguale. */
const Terrain = (() => {
  const TAU = Math.PI * 2;
  const rng = seed => { let a = seed >>> 0; return () => { a = (a + 0x6D2B79F5) | 0; let t = Math.imul(a ^ (a >>> 15), 1 | a); t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t; return ((t ^ (t >>> 14)) >>> 0) / 4294967296; }; };
  const hsl = (h, s, l, a = 1) => `hsla(${h},${s}%,${l}%,${a})`;
  const lerp = (a, b, t) => a + (b - a) * t;
  const R0 = 120; // raggio di riferimento: tutte le misure sotto sono in queste unità

  function hexPath(ctx, cx, cy, r) {
    ctx.beginPath();
    for (let i = 0; i < 6; i++) { const a = (60 * i - 90) * Math.PI / 180; ctx.lineTo(cx + r * Math.cos(a), cy + r * Math.sin(a)); }
    ctx.closePath();
  }
  // punto a caso dentro l'esagono (rigetto su cerchio inscritto allargato)
  function inHex(rnd, cx, cy, r, m = 0.86) {
    for (;;) {
      const x = (rnd() * 2 - 1) * r, y = (rnd() * 2 - 1) * r;
      const ax = Math.abs(x), ay = Math.abs(y);
      const lim = r * m;
      if (ax <= lim * 0.866 && ax * 0.5 + ay * 0.866 <= lim * 0.866) return [cx + x, cy + y];
    }
  }
  function soft(ctx, x, y, r, col) { const g = ctx.createRadialGradient(x, y, 0, x, y, r); g.addColorStop(0, col); g.addColorStop(1, col.replace(/[\d.]+\)$/, '0)')); ctx.fillStyle = g; ctx.fillRect(x - r, y - r, r * 2, r * 2); }
  function ground(ctx, rnd, cx, cy, r, base, blots, strokes) {
    ctx.fillStyle = base; ctx.fillRect(cx - r * 1.1, cy - r * 1.1, r * 2.2, r * 2.2);
    for (let i = 0; i < 26; i++) { const [x, y] = inHex(rnd, cx, cy, r, 1.05); const c = blots[Math.floor(rnd() * blots.length)]; soft(ctx, x, y, r * lerp(0.18, 0.5, rnd()), c); }
    if (strokes) {
      ctx.lineCap = 'round';
      const dir = rnd() * Math.PI;
      for (let i = 0; i < 140; i++) {
        const [x, y] = inHex(rnd, cx, cy, r, 1.02); const a = dir + (rnd() - 0.5) * 0.7, l = r * lerp(0.04, 0.12, rnd());
        ctx.strokeStyle = strokes[Math.floor(rnd() * strokes.length)]; ctx.lineWidth = r * lerp(0.008, 0.02, rnd());
        ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + Math.cos(a) * l, y + Math.sin(a) * l); ctx.stroke();
      }
    }
  }
  function shadow(ctx, x, y, rx, ry, a = 0.28) { ctx.fillStyle = `rgba(20,14,6,${a})`; ctx.beginPath(); ctx.ellipse(x, y, rx, ry, 0, 0, TAU); ctx.fill(); }
  function blob(ctx, rnd, x, y, r, col, pts = 9, wob = 0.25) {
    ctx.fillStyle = col; ctx.beginPath();
    for (let i = 0; i <= pts; i++) { const a = i / pts * TAU, rr = r * (1 - wob / 2 + rnd() * wob); const px = x + Math.cos(a) * rr, py = y + Math.sin(a) * rr * 0.9; i ? ctx.lineTo(px, py) : ctx.moveTo(px, py); }
    ctx.closePath(); ctx.fill();
  }

  /* ---------- elementi ---------- */
  function conifer(ctx, rnd, x, y, s, hue) {
    shadow(ctx, x + s * 0.32, y + s * 0.02, s * 0.5, s * 0.16, 0.3);
    ctx.fillStyle = hsl(25, 35, 22); ctx.fillRect(x - s * 0.05, y - s * 0.22, s * 0.1, s * 0.24);
    const tiers = 3, l0 = lerp(20, 30, rnd());
    for (let t = 0; t < tiers; t++) {
      const by = y - s * 0.18 - t * s * 0.42, w = s * (0.55 - t * 0.13), h = s * 0.62;
      ctx.fillStyle = hsl(hue, 38, l0 + 7); ctx.beginPath(); ctx.moveTo(x - w, by); ctx.lineTo(x, by - h); ctx.lineTo(x + w, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hsl(hue, 42, l0 - 4); ctx.beginPath(); ctx.moveTo(x + w * 0.05, by + 0.5); ctx.lineTo(x, by - h); ctx.lineTo(x + w, by); ctx.closePath(); ctx.fill();
      ctx.fillStyle = hsl(hue - 10, 45, l0 + 18, 0.5); ctx.beginPath(); ctx.moveTo(x - w * 0.8, by - 1); ctx.lineTo(x - w * 0.15, by - h * 0.7); ctx.lineTo(x - w * 0.35, by - 1); ctx.closePath(); ctx.fill();
    }
  }
  function broadleaf(ctx, rnd, x, y, s, hue) {
    shadow(ctx, x + s * 0.35, y + s * 0.05, s * 0.6, s * 0.2, 0.3);
    ctx.fillStyle = hsl(25, 30, 24); ctx.fillRect(x - s * 0.06, y - s * 0.4, s * 0.12, s * 0.42);
    const cy = y - s * 0.75, l = lerp(26, 36, rnd());
    for (let i = 0; i < 6; i++) blob(ctx, rnd, x + (rnd() - 0.5) * s * 0.7, cy + (rnd() - 0.5) * s * 0.5, s * lerp(0.28, 0.42, rnd()), hsl(hue, 40, l - 6));
    for (let i = 0; i < 5; i++) blob(ctx, rnd, x - s * 0.15 + (rnd() - 0.6) * s * 0.4, cy - s * 0.12 + (rnd() - 0.6) * s * 0.3, s * lerp(0.16, 0.26, rnd()), hsl(hue - 8, 42, l + 6));
    for (let i = 0; i < 4; i++) blob(ctx, rnd, x - s * 0.25 + (rnd() - 0.6) * s * 0.2, cy - s * 0.25 + (rnd() - 0.6) * s * 0.2, s * lerp(0.07, 0.12, rnd()), hsl(hue - 15, 48, l + 18, 0.8));
  }
  function peak(ctx, rnd, x, y, w, h, snow) {
    // ombra portata verso destra
    ctx.fillStyle = 'rgba(25,20,30,0.22)'; ctx.beginPath(); ctx.moveTo(x - w * 0.1, y); ctx.lineTo(x + w * 0.9, y + h * 0.06); ctx.lineTo(x + w * 0.2, y - h * 0.25); ctx.closePath(); ctx.fill();
    const ax = x + (rnd() - 0.5) * w * 0.25, ay = y - h, mx = x + w * (0.05 + rnd() * 0.15);
    const edge = (x0, y0, x1, y1, n, j) => { const p = []; for (let i = 0; i <= n; i++) { const t = i / n; p.push([lerp(x0, x1, t) + (i && i < n ? (rnd() - 0.5) * j : 0), lerp(y0, y1, t) + (i && i < n ? (rnd() - 0.5) * j : 0)]); } return p; };
    const left = edge(x - w / 2, y, ax, ay, 6, w * 0.08), right = edge(ax, ay, x + w / 2, y, 6, w * 0.08), ridge = edge(ax, ay, mx, y, 5, w * 0.05);
    const poly = (pts, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.fill(); };
    poly([...left, ...ridge.slice(1)], hsl(28, 10, 58));
    poly([...ridge, ...right.slice().reverse()], hsl(240, 10, 34));
    // strati di roccia
    ctx.strokeStyle = 'rgba(40,35,45,0.35)'; ctx.lineWidth = w * 0.012;
    for (let i = 0; i < 7; i++) { const t = 0.25 + rnd() * 0.65, yy = lerp(ay, y, t), xl = lerp(ax, x - w / 2, t), xr = lerp(ax, x + w / 2, t); const x0 = lerp(xl, xr, 0.1 + rnd() * 0.4); ctx.beginPath(); ctx.moveTo(x0, yy); ctx.lineTo(x0 + w * lerp(0.06, 0.16, rnd()), yy + h * 0.05 * (rnd() - 0.3)); ctx.stroke(); }
    if (snow) {
      const sh = h * lerp(0.3, 0.42, rnd()), cut = t => { const pts = []; for (let i = 0; i <= 6; i++) { const u = i / 6; pts.push([lerp(lerp(ax, x - w / 2, sh / h), lerp(ax, x + w / 2, sh / h), u), ay + sh * (0.75 + 0.35 * (i % 2 ? rnd() : rnd() * 0.4))]); } return pts; };
      const c = cut();
      ctx.save(); ctx.beginPath(); left.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); right.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.clip();
      ctx.beginPath(); ctx.moveTo(ax, ay - 2); c.forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath();
      ctx.fillStyle = hsl(210, 30, 95); ctx.fill();
      ctx.fillStyle = hsl(220, 25, 78); ctx.beginPath(); ridge.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); right.slice().reverse().forEach(p => ctx.lineTo(p[0], p[1])); ctx.closePath(); ctx.globalCompositeOperation = 'source-atop'; ctx.globalAlpha = 0.55; ctx.fill(); ctx.globalAlpha = 1; ctx.globalCompositeOperation = 'source-over';
      ctx.restore();
    }
  }
  function house(ctx, rnd, x, y, s, roofHue) {
    const w = s, d = s * 0.55, hw = s * 0.55, rh = s * 0.45;
    shadow(ctx, x + w * 0.45, y + 2, w * 0.75, s * 0.18, 0.28);
    const wall = hsl(38, 35, lerp(78, 86, rnd())), wallS = hsl(30, 25, 58);
    // fronte
    ctx.fillStyle = wall; ctx.fillRect(x - w / 2, y - hw, w, hw);
    // fianco
    ctx.fillStyle = wallS; ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2 + d * 0.6, y - d * 0.45); ctx.lineTo(x + w / 2 + d * 0.6, y - hw - d * 0.45); ctx.lineTo(x + w / 2, y - hw); ctx.closePath(); ctx.fill();
    // tetto: falda anteriore e timpano
    const rl = lerp(34, 44, rnd());
    ctx.fillStyle = hsl(roofHue, 55, rl); ctx.beginPath(); ctx.moveTo(x - w / 2 - 2, y - hw); ctx.lineTo(x + w / 2 + 2, y - hw); ctx.lineTo(x + w / 2 + d * 0.3, y - hw - rh); ctx.lineTo(x - w / 2 + d * 0.3, y - hw - rh); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hsl(roofHue, 50, rl - 12); ctx.beginPath(); ctx.moveTo(x + w / 2 + 2, y - hw); ctx.lineTo(x + w / 2 + d * 0.6, y - hw - d * 0.45); ctx.lineTo(x + w / 2 + d * 0.3, y - hw - rh); ctx.closePath(); ctx.fill();
    ctx.strokeStyle = hsl(roofHue, 45, rl - 18, 0.5); ctx.lineWidth = s * 0.03;
    for (let i = 1; i < 4; i++) { const t = i / 4; ctx.beginPath(); ctx.moveTo(x - w / 2 + d * 0.3 * t, y - hw - rh * t); ctx.lineTo(x + w / 2 + d * 0.3 * t, y - hw - rh * t); ctx.stroke(); }
    // finestre e porta
    ctx.fillStyle = hsl(40, 70, 70); ctx.fillRect(x - w * 0.32, y - hw * 0.65, w * 0.16, hw * 0.28); ctx.fillRect(x + w * 0.14, y - hw * 0.65, w * 0.16, hw * 0.28);
    ctx.fillStyle = hsl(20, 35, 28); ctx.fillRect(x - w * 0.07, y - hw * 0.55, w * 0.14, hw * 0.55);
    // camino
    if (rnd() < 0.7) { ctx.fillStyle = hsl(10, 30, 40); ctx.fillRect(x + w * 0.2, y - hw - rh * 0.95, s * 0.1, rh * 0.5); }
  }
  function church(ctx, rnd, x, y, s) {
    shadow(ctx, x + s * 0.4, y + 2, s * 0.7, s * 0.18, 0.3);
    const w = s * 0.5, h = s * 1.1;
    ctx.fillStyle = hsl(40, 30, 88); ctx.fillRect(x - w / 2, y - h, w, h);
    ctx.fillStyle = hsl(35, 20, 66); ctx.beginPath(); ctx.moveTo(x + w / 2, y); ctx.lineTo(x + w / 2 + s * 0.18, y - s * 0.13); ctx.lineTo(x + w / 2 + s * 0.18, y - h - s * 0.13); ctx.lineTo(x + w / 2, y - h); ctx.closePath(); ctx.fill();
    // cupola a cipolla
    const dy = y - h - s * 0.05;
    ctx.fillStyle = hsl(150, 35, 38); ctx.beginPath(); ctx.moveTo(x - w * 0.45, dy); ctx.bezierCurveTo(x - w * 0.75, dy - s * 0.3, x - w * 0.05, dy - s * 0.35, x, dy - s * 0.55); ctx.bezierCurveTo(x + w * 0.05, dy - s * 0.35, x + w * 0.75, dy - s * 0.3, x + w * 0.45, dy); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hsl(150, 40, 55, 0.7); ctx.beginPath(); ctx.ellipse(x - w * 0.15, dy - s * 0.18, w * 0.12, s * 0.1, -0.3, 0, TAU); ctx.fill();
    ctx.strokeStyle = hsl(45, 70, 55); ctx.lineWidth = s * 0.035; ctx.beginPath(); ctx.moveTo(x, dy - s * 0.55); ctx.lineTo(x, dy - s * 0.78); ctx.moveTo(x - s * 0.07, dy - s * 0.7); ctx.lineTo(x + s * 0.07, dy - s * 0.7); ctx.stroke();
    ctx.fillStyle = hsl(20, 30, 30); ctx.beginPath(); ctx.moveTo(x - w * 0.15, y); ctx.lineTo(x - w * 0.15, y - h * 0.3); ctx.arc(x, y - h * 0.3, w * 0.15, Math.PI, 0); ctx.lineTo(x + w * 0.15, y); ctx.fill();
    ctx.fillStyle = hsl(40, 70, 70); ctx.beginPath(); ctx.arc(x, y - h * 0.68, w * 0.12, 0, TAU); ctx.fill();
  }
  function derrick(ctx, rnd, x, y, s) {
    // pozza di petrolio
    ctx.fillStyle = 'rgba(15,12,18,0.85)'; ctx.beginPath(); ctx.ellipse(x + s * 0.45, y + s * 0.06, s * 0.35, s * 0.1, 0, 0, TAU); ctx.fill();
    ctx.strokeStyle = 'rgba(160,140,220,0.4)'; ctx.lineWidth = s * 0.02; ctx.beginPath(); ctx.ellipse(x + s * 0.4, y + s * 0.04, s * 0.15, s * 0.03, 0, Math.PI, TAU); ctx.stroke();
    shadow(ctx, x + s * 0.5, y + s * 0.02, s * 0.6, s * 0.12, 0.25);
    const h = s * 1.6, bw = s * 0.32, tw = s * 0.06;
    ctx.strokeStyle = hsl(25, 35, 26); ctx.lineWidth = s * 0.05; ctx.lineCap = 'round';
    ctx.beginPath(); ctx.moveTo(x - bw, y); ctx.lineTo(x - tw, y - h); ctx.moveTo(x + bw, y); ctx.lineTo(x + tw, y - h); ctx.stroke();
    ctx.lineWidth = s * 0.025; ctx.beginPath();
    for (let i = 0; i < 5; i++) { const t0 = i / 5, t1 = (i + 1) / 5; const yl = y - h * t0, yh = y - h * t1; const xl0 = lerp(x - bw, x - tw, t0), xr0 = lerp(x + bw, x + tw, t0), xl1 = lerp(x - bw, x - tw, t1), xr1 = lerp(x + bw, x + tw, t1); ctx.moveTo(xl0, yl); ctx.lineTo(xr1, yh); ctx.moveTo(xr0, yl); ctx.lineTo(xl1, yh); ctx.moveTo(xl1, yh); ctx.lineTo(xr1, yh); }
    ctx.stroke();
    ctx.fillStyle = hsl(25, 30, 22); ctx.fillRect(x - tw * 2, y - h - s * 0.06, tw * 4, s * 0.08);
    // capanno e barili
    ctx.fillStyle = hsl(30, 20, 45); ctx.fillRect(x - s * 0.75, y - s * 0.35, s * 0.36, s * 0.35);
    ctx.fillStyle = hsl(0, 0, 25); ctx.beginPath(); ctx.moveTo(x - s * 0.8, y - s * 0.35); ctx.lineTo(x - s * 0.57, y - s * 0.52); ctx.lineTo(x - s * 0.34, y - s * 0.35); ctx.fill();
    for (let i = 0; i < 3; i++) { const bx = x + s * (0.15 + i * 0.15), by = y + s * 0.18 + (i % 2) * s * 0.04; ctx.fillStyle = hsl(0, 50, 28); ctx.fillRect(bx - s * 0.06, by - s * 0.16, s * 0.12, s * 0.16); ctx.fillStyle = hsl(0, 40, 40); ctx.beginPath(); ctx.ellipse(bx, by - s * 0.16, s * 0.06, s * 0.025, 0, 0, TAU); ctx.fill(); }
  }
  function haystack(ctx, x, y, s) {
    shadow(ctx, x + s * 0.3, y, s * 0.5, s * 0.14, 0.3);
    ctx.fillStyle = hsl(42, 65, 55); ctx.beginPath(); ctx.moveTo(x - s * 0.4, y); ctx.quadraticCurveTo(x - s * 0.35, y - s * 0.7, x, y - s * 0.75); ctx.quadraticCurveTo(x + s * 0.35, y - s * 0.7, x + s * 0.4, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = hsl(38, 60, 40); ctx.beginPath(); ctx.moveTo(x + s * 0.05, y); ctx.quadraticCurveTo(x + s * 0.12, y - s * 0.6, x, y - s * 0.75); ctx.quadraticCurveTo(x + s * 0.35, y - s * 0.7, x + s * 0.4, y); ctx.closePath(); ctx.fill();
  }
  function tent(ctx, x, y, s, col, colD) {
    shadow(ctx, x + s * 0.35, y + 2, s * 0.6, s * 0.15, 0.3);
    ctx.fillStyle = col; ctx.beginPath(); ctx.moveTo(x - s * 0.5, y); ctx.lineTo(x, y - s * 0.6); ctx.lineTo(x + s * 0.15, y); ctx.closePath(); ctx.fill();
    ctx.fillStyle = colD; ctx.beginPath(); ctx.moveTo(x + s * 0.15, y); ctx.lineTo(x, y - s * 0.6); ctx.lineTo(x + s * 0.55, y - s * 0.35); ctx.lineTo(x + s * 0.65, y - s * 0.05); ctx.closePath(); ctx.fill();
    ctx.fillStyle = 'rgba(30,20,10,0.7)'; ctx.beginPath(); ctx.moveTo(x - s * 0.12, y); ctx.lineTo(x - s * 0.05, y - s * 0.3); ctx.lineTo(x + s * 0.05, y); ctx.fill();
  }

  /* ---------- terreni ---------- */
  const P = {};
  P.F = (ctx, rnd, cx, cy, r) => { // fattoria: campi a strisce
    ground(ctx, rnd, cx, cy, r, hsl(48, 45, 52), [hsl(55, 40, 45, 0.5), hsl(40, 55, 60, 0.5)], null);
    const ang = (rnd() - 0.5) * 0.9 + (rnd() < 0.5 ? 0 : Math.PI / 2), ca = Math.cos(ang), sa = Math.sin(ang);
    const cols = [[44, 70, 62], [70, 40, 46], [30, 40, 38], [50, 60, 54], [85, 35, 40], [38, 55, 66]];
    const band = r * lerp(0.28, 0.38, rnd());
    ctx.save(); ctx.translate(cx, cy); ctx.rotate(ang);
    let k = 0;
    for (let off = -r * 1.3; off < r * 1.3; off += band, k++) {
      const c = cols[Math.floor(rnd() * cols.length)];
      ctx.fillStyle = hsl(c[0], c[1], c[2]); ctx.fillRect(-r * 1.4, off, r * 2.8, band);
      // solchi
      ctx.strokeStyle = hsl(c[0], c[1], c[2] - 12, 0.45); ctx.lineWidth = r * 0.009;
      const vert = rnd() < 0.5;
      for (let t = 0; t < (vert ? r * 2.8 : band); t += r * 0.035) { ctx.beginPath(); if (vert) { ctx.moveTo(-r * 1.4 + t, off); ctx.lineTo(-r * 1.4 + t + r * 0.01, off + band); } else { ctx.moveTo(-r * 1.4, off + t); ctx.lineTo(r * 1.4, off + t); } ctx.stroke(); }
      // luce
      const g = ctx.createLinearGradient(0, off, 0, off + band); g.addColorStop(0, 'rgba(255,240,200,0.12)'); g.addColorStop(1, 'rgba(60,40,10,0.12)'); ctx.fillStyle = g; ctx.fillRect(-r * 1.4, off, r * 2.8, band);
      // siepe
      for (let x = -r * 1.3; x < r * 1.3; x += r * 0.05) { ctx.fillStyle = hsl(95, 35, lerp(22, 32, rnd())); ctx.beginPath(); ctx.arc(x, off + (rnd() - 0.5) * 2, r * lerp(0.018, 0.032, rnd()), 0, TAU); ctx.fill(); }
    }
    ctx.restore();
    const n = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < n; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.6); haystack(ctx, x, y, r * 0.16); }
    void ca; void sa;
  };
  P.W = (ctx, rnd, cx, cy, r) => { // foresta
    ground(ctx, rnd, cx, cy, r, hsl(110, 30, 24), [hsl(90, 35, 30, 0.6), hsl(130, 30, 18, 0.6), hsl(70, 30, 32, 0.4)], [hsl(100, 30, 18, 0.5), hsl(80, 30, 36, 0.4)]);
    const trees = [];
    for (let i = 0; i < 70; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.9); trees.push([x, y + r * 0.08, rnd() < 0.62]); }
    trees.sort((a, b) => a[1] - b[1]);
    for (const [x, y, con] of trees) con ? conifer(ctx, rnd, x, y, r * lerp(0.12, 0.17, rnd()), lerp(120, 140, rnd())) : broadleaf(ctx, rnd, x, y, r * lerp(0.12, 0.16, rnd()), lerp(75, 105, rnd()));
  };
  P.M = (ctx, rnd, cx, cy, r) => { // montagna
    ground(ctx, rnd, cx, cy, r, hsl(30, 14, 46), [hsl(25, 18, 38, 0.6), hsl(40, 15, 58, 0.5), hsl(90, 15, 40, 0.35)], [hsl(30, 10, 30, 0.35), hsl(40, 15, 62, 0.3)]);
    for (let i = 0; i < 30; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.95); blob(ctx, rnd, x, y, r * lerp(0.015, 0.04, rnd()), hsl(30, 8, lerp(30, 60, rnd()), 0.8), 6, 0.5); }
    const n = 3 + Math.floor(rnd() * 3), pk = [];
    const main = [(rnd() - 0.5) * 0.4, (rnd() - 0.5) * 0.2]; pk.push([main[0], main[1], lerp(0.85, 1.05, rnd()), lerp(0.95, 1.15, rnd())]);
    for (let i = 1; i < n; i++) { const a = rnd() * TAU, d = lerp(0.3, 0.5, rnd()); pk.push([main[0] + Math.cos(a) * d, main[1] + Math.sin(a) * d * 0.6, lerp(0.4, 0.7, rnd()), lerp(0.4, 0.75, rnd())]); }
    const items = pk.map(([px, py, pw, ph]) => ['p', cx + Math.max(-0.45, Math.min(0.45, px)) * r, cy + Math.max(-0.35, Math.min(0.3, py)) * r + r * 0.35, pw * r, ph * r * 0.85]);
    for (let i = 0; i < 7; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.85); if (y > cy + r * 0.25) items.push(['t', x, y]); }
    items.sort((a, b) => a[2] - b[2]);
    for (const it of items) it[0] === 'p' ? peak(ctx, rnd, it[1], it[2], it[3], it[4], it[4] > r * 0.45) : conifer(ctx, rnd, it[1], it[2], r * 0.1, 135);
    if (rnd() < 0.6) { // carrello della miniera
      const mx = cx + r * lerp(-0.3, 0.45, rnd()), my = cy + r * 0.6;
      ctx.strokeStyle = hsl(25, 20, 25); ctx.lineWidth = r * 0.012; ctx.beginPath(); ctx.moveTo(mx - r * 0.35, my + r * 0.04); ctx.lineTo(mx + r * 0.1, my - r * 0.05); ctx.moveTo(mx - r * 0.35, my + r * 0.08); ctx.lineTo(mx + r * 0.1, my - r * 0.01); ctx.stroke();
      ctx.fillStyle = hsl(20, 25, 30); ctx.fillRect(mx - r * 0.18, my - r * 0.09, r * 0.13, r * 0.07); ctx.fillStyle = hsl(210, 8, 55); for (let i = 0; i < 4; i++) { ctx.beginPath(); ctx.arc(mx - r * 0.16 + i * r * 0.03, my - r * 0.095, r * 0.018, 0, TAU); ctx.fill(); }
    }
  };
  P.T = (ctx, rnd, cx, cy, r) => { // tundra con pozzo di petrolio
    ground(ctx, rnd, cx, cy, r, hsl(70, 13, 55), [hsl(200, 18, 82, 0.45), hsl(60, 20, 46, 0.5), hsl(20, 35, 45, 0.25), hsl(90, 15, 42, 0.4)], null);
    for (let i = 0; i < 7; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.9); soft(ctx, x, y, r * lerp(0.12, 0.25, rnd()), 'hsla(205,25%,90%,0.45)'); }
    const ponds = 2 + Math.floor(rnd() * 3);
    for (let i = 0; i < ponds; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.8); const rr = r * lerp(0.04, 0.1, rnd()); blob(ctx, rnd, x, y + 1, rr * 1.15, hsl(60, 15, 70, 0.7), 10, 0.3); blob(ctx, rnd, x, y, rr, hsl(200, 35, 36, 0.9), 10, 0.3); blob(ctx, rnd, x - rr * 0.25, y - rr * 0.2, rr * 0.4, hsl(195, 40, 70, 0.35), 8, 0.3); }
    for (let i = 0; i < 110; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.95); ctx.fillStyle = rnd() < 0.5 ? hsl(15, 45, 40, 0.55) : hsl(80, 25, 33, 0.6); ctx.beginPath(); ctx.arc(x, y, r * lerp(0.008, 0.02, rnd()), 0, TAU); ctx.fill(); }
    for (let i = 0; i < 14; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.9); ctx.strokeStyle = hsl(55, 25, 32, 0.75); ctx.lineWidth = r * 0.008; for (let j = 0; j < 5; j++) { ctx.beginPath(); ctx.moveTo(x + j * 2 - 4, y); ctx.lineTo(x + j * 2 - 4 + (rnd() - 0.5) * 3, y - r * 0.05); ctx.stroke(); } }
    const items = [];
    const dx = cx + (rnd() - 0.5) * r * 0.6, dy = cy + r * lerp(0.05, 0.35, rnd());
    items.push(['d', dx, dy]);
    if (rnd() < 0.5) items.push(['d2', cx + (dx < cx ? 0.45 : -0.45) * r, cy - r * 0.25]);
    for (let i = 0; i < 6; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.85); if (Math.hypot(x - dx, y - dy) > r * 0.3) items.push(['b', x, y]); }
    // tubo verso il bordo
    ctx.strokeStyle = hsl(20, 15, 25); ctx.lineWidth = r * 0.02; ctx.beginPath(); ctx.moveTo(dx + r * 0.1, dy); ctx.bezierCurveTo(dx + r * 0.4, dy + r * 0.2, dx + r * 0.5, cy + r * 0.5, cx + r * 0.3, cy + r * 0.9); ctx.stroke();
    items.sort((a, b) => a[2] - b[2]);
    for (const [k, x, y] of items) {
      if (k === 'd') derrick(ctx, rnd, x, y, r * 0.48);
      else if (k === 'd2') derrick(ctx, rnd, x, y, r * 0.3);
      else { // betulla nana
        shadow(ctx, x + r * 0.03, y, r * 0.05, r * 0.015, 0.25);
        ctx.strokeStyle = hsl(40, 15, 85); ctx.lineWidth = r * 0.012; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + 1, y - r * 0.09); ctx.stroke();
        for (let j = 0; j < 4; j++) blob(ctx, rnd, x + (rnd() - 0.5) * r * 0.06, y - r * 0.09 - rnd() * r * 0.04, r * 0.025, hsl(lerp(40, 70, rnd()), 45, lerp(38, 50, rnd())), 7, 0.3);
      }
    }
  };
  P.V = (ctx, rnd, cx, cy, r) => { // villaggio
    ground(ctx, rnd, cx, cy, r, hsl(78, 30, 46), [hsl(60, 35, 52, 0.5), hsl(100, 30, 36, 0.5)], [hsl(90, 30, 32, 0.4), hsl(60, 35, 62, 0.4)]);
    // strade
    ctx.strokeStyle = hsl(35, 30, 62); ctx.lineCap = 'round'; ctx.lineWidth = r * 0.09;
    const a0 = rnd() * TAU;
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.quadraticCurveTo(cx + (rnd() - 0.5) * r * 0.3, cy + (rnd() - 0.5) * r * 0.3, cx + Math.cos(a0 + 2.6) * r, cy + Math.sin(a0 + 2.6) * r); ctx.stroke();
    ctx.lineWidth = r * 0.06; ctx.beginPath(); ctx.moveTo(cx, cy); ctx.quadraticCurveTo(cx + Math.cos(a0 + 4.4) * r * 0.5, cy + Math.sin(a0 + 4.4) * r * 0.3, cx + Math.cos(a0 + 4.4) * r, cy + Math.sin(a0 + 4.4) * r); ctx.stroke();
    ctx.strokeStyle = hsl(30, 25, 50, 0.5); ctx.lineWidth = r * 0.012; ctx.setLineDash([r * 0.03, r * 0.05]);
    ctx.beginPath(); ctx.moveTo(cx + Math.cos(a0) * r, cy + Math.sin(a0) * r); ctx.quadraticCurveTo(cx, cy, cx + Math.cos(a0 + 2.6) * r, cy + Math.sin(a0 + 2.6) * r); ctx.stroke(); ctx.setLineDash([]);
    // orti
    for (let i = 0; i < 3; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.75); ctx.save(); ctx.translate(x, y); ctx.rotate((rnd() - 0.5) * 0.6); ctx.fillStyle = hsl(30, 35, 35); ctx.fillRect(-r * 0.12, -r * 0.07, r * 0.24, r * 0.14); ctx.strokeStyle = hsl(100, 40, 35); ctx.lineWidth = r * 0.015; for (let k = 0; k < 5; k++) { ctx.beginPath(); ctx.moveTo(-r * 0.1, -r * 0.05 + k * r * 0.025); ctx.lineTo(r * 0.1, -r * 0.05 + k * r * 0.025); ctx.stroke(); } ctx.restore(); }
    const items = [];
    for (let i = 0; i < 9; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.72); items.push(['h', x, y]); }
    items.push(['c', cx + (rnd() - 0.5) * r * 0.2, cy - r * 0.05]);
    for (let i = 0; i < 6; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.85); items.push(['t', x, y]); }
    items.sort((a, b) => a[2] - b[2]);
    for (const [k, x, y] of items) {
      if (k === 'h') house(ctx, rnd, x, y, r * lerp(0.15, 0.2, rnd()), rnd() < 0.7 ? lerp(5, 18, rnd()) : 200);
      else if (k === 'c') church(ctx, rnd, x, y, r * 0.24);
      else broadleaf(ctx, rnd, x, y, r * 0.11, 95);
    }
  };
  P.L = (ctx, rnd, cx, cy, r) => { // lago
    ground(ctx, rnd, cx, cy, r, hsl(70, 25, 45), [hsl(90, 25, 40, 0.5)], [hsl(80, 25, 32, 0.4)]);
    const pts = []; const n = 32; const ph1 = rnd() * TAU, ph2 = rnd() * TAU, f1 = 2 + Math.floor(rnd() * 3), am = lerp(0.06, 0.13, rnd());
    for (let i = 0; i < n; i++) { const a = i / n * TAU - Math.PI / 2; const k = 0.76 + am * Math.sin(a * f1 + ph1) + 0.05 * Math.sin(a * 5 + ph2) + rnd() * 0.03; const hexK = 0.866 / Math.max(Math.abs(Math.cos(((a + Math.PI / 2) % (Math.PI / 3) + Math.PI / 3) % (Math.PI / 3) - Math.PI / 6)), 0.866); pts.push([cx + Math.cos(a) * r * k * hexK, cy + Math.sin(a) * r * k * hexK]); }
    const shape = (sc, col) => { ctx.fillStyle = col; ctx.beginPath(); pts.forEach((p, i) => { const x = cx + (p[0] - cx) * sc, y = cy + (p[1] - cy) * sc; i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); }); ctx.closePath(); ctx.fill(); };
    shape(1.08, hsl(40, 35, 66)); // riva sabbiosa
    shape(1.0, hsl(195, 45, 42));
    const g = ctx.createRadialGradient(cx - r * 0.1, cy - r * 0.1, r * 0.05, cx, cy, r * 0.8); g.addColorStop(0, hsl(205, 55, 26, 0.9)); g.addColorStop(0.7, hsl(200, 50, 36, 0.4)); g.addColorStop(1, hsl(190, 45, 50, 0)); ctx.fillStyle = g;
    ctx.save(); ctx.beginPath(); pts.forEach((p, i) => i ? ctx.lineTo(p[0], p[1]) : ctx.moveTo(p[0], p[1])); ctx.closePath(); ctx.clip(); ctx.fillRect(cx - r, cy - r, r * 2, r * 2);
    ctx.strokeStyle = 'rgba(220,240,255,0.35)'; ctx.lineWidth = r * 0.01;
    for (let i = 0; i < 26; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.7); const w = r * lerp(0.05, 0.14, rnd()); ctx.beginPath(); ctx.moveTo(x - w, y); ctx.quadraticCurveTo(x, y - r * 0.015, x + w, y); ctx.stroke(); }
    for (let i = 0; i < 6; i++) { const [x, y] = inHex(rnd, cx, cy, r, 0.65); ctx.fillStyle = hsl(110, 40, 38); ctx.beginPath(); ctx.arc(x, y, r * 0.025, 0.4, TAU); ctx.lineTo(x, y); ctx.fill(); }
    if (rnd() < 0.45) { const ix = cx + (rnd() - 0.5) * r * 0.5, iy = cy + (rnd() - 0.5) * r * 0.4; blob(ctx, rnd, ix, iy + 2, r * 0.13, hsl(40, 35, 62), 10, 0.3); blob(ctx, rnd, ix, iy, r * 0.11, hsl(90, 30, 40), 10, 0.3); conifer(ctx, rnd, ix - r * 0.03, iy + r * 0.03, r * 0.1, 130); conifer(ctx, rnd, ix + r * 0.04, iy + r * 0.05, r * 0.08, 125); }
    ctx.restore();
    // canne
    for (let i = 0; i < n; i += 1) { if (rnd() < 0.45) continue; const p = pts[i]; for (let j = 0; j < 6; j++) { const x = p[0] + (rnd() - 0.5) * r * 0.08, y = p[1] + (rnd() - 0.5) * r * 0.05; ctx.strokeStyle = hsl(lerp(60, 100, rnd()), 35, lerp(28, 42, rnd())); ctx.lineWidth = r * 0.008; ctx.beginPath(); ctx.moveTo(x, y); ctx.lineTo(x + (rnd() - 0.5) * 3, y - r * lerp(0.04, 0.08, rnd())); ctx.stroke(); } }
  };
  P.X = (ctx, rnd, cx, cy, r) => { // Fabbrica
    ground(ctx, rnd, cx, cy, r, hsl(25, 12, 30), [hsl(20, 15, 22, 0.6), hsl(35, 15, 40, 0.4)], [hsl(25, 10, 20, 0.5), hsl(30, 10, 45, 0.3)]);
    // binari
    ctx.strokeStyle = hsl(25, 15, 18); ctx.lineWidth = r * 0.012;
    for (const o of [-1, 1]) { ctx.beginPath(); ctx.moveTo(cx - r, cy + r * 0.45 + o * r * 0.025); ctx.quadraticCurveTo(cx, cy + r * 0.62 + o * r * 0.025, cx + r, cy + r * 0.38 + o * r * 0.025); ctx.stroke(); }
    ctx.strokeStyle = hsl(25, 25, 35); ctx.lineWidth = r * 0.012; for (let t = 0; t <= 1; t += 0.04) { const x = lerp(cx - r, cx + r, t), y = (1 - t) * (1 - t) * (cy + r * 0.45) + 2 * t * (1 - t) * (cy + r * 0.62) + t * t * (cy + r * 0.38); ctx.beginPath(); ctx.moveTo(x, y - r * 0.04); ctx.lineTo(x, y + r * 0.04); ctx.stroke(); }
    // capannone principale
    const bx = cx - r * 0.62, by = cy + r * 0.32, bw = r * 1.12, bh = r * 0.44, d = r * 0.3;
    shadow(ctx, cx + r * 0.25, by + 3, r * 0.75, r * 0.12, 0.4);
    // ciminiere dietro
    const chim = [[cx - r * 0.42, cy - r * 0.2, 0.85], [cx - r * 0.16, cy - r * 0.16, 1.05], [cx + r * 0.14, cy - r * 0.2, 1.2]];
    for (const [x, y, k] of chim) { const h = r * 0.62 * k, w = r * 0.11; ctx.fillStyle = hsl(12, 35, 32); ctx.fillRect(x - w / 2, y - h, w, h); ctx.fillStyle = hsl(12, 30, 22); ctx.fillRect(x, y - h, w / 2, h); ctx.fillStyle = hsl(30, 10, 70); for (let i = 1; i < 4; i++) ctx.fillRect(x - w / 2 - 1, y - h * i / 4, w + 2, r * 0.02); ctx.fillStyle = hsl(0, 0, 12); ctx.beginPath(); ctx.ellipse(x, y - h, w * 0.6, w * 0.2, 0, 0, TAU); ctx.fill(); }
    // fianco
    ctx.fillStyle = hsl(15, 30, 26); ctx.beginPath(); ctx.moveTo(bx + bw, by); ctx.lineTo(bx + bw + d, by - d * 0.6); ctx.lineTo(bx + bw + d, by - bh - d * 0.6); ctx.lineTo(bx + bw, by - bh); ctx.closePath(); ctx.fill();
    // fronte in mattoni
    ctx.fillStyle = hsl(14, 42, 38); ctx.fillRect(bx, by - bh, bw, bh);
    ctx.strokeStyle = hsl(14, 30, 28, 0.6); ctx.lineWidth = r * 0.006; for (let y = by - bh; y < by; y += r * 0.03) { ctx.beginPath(); ctx.moveTo(bx, y); ctx.lineTo(bx + bw, y); ctx.stroke(); }
    // finestre ad arco illuminate
    for (let i = 0; i < 6; i++) { const wx = bx + bw * (0.08 + i * 0.155), wy = by - bh * 0.25, ww = bw * 0.09, wh = bh * 0.5; const g = ctx.createLinearGradient(0, wy - wh, 0, wy); g.addColorStop(0, hsl(45, 90, 70)); g.addColorStop(1, hsl(30, 90, 45)); ctx.fillStyle = g; ctx.beginPath(); ctx.moveTo(wx, wy); ctx.lineTo(wx, wy - wh + ww / 2); ctx.arc(wx + ww / 2, wy - wh + ww / 2, ww / 2, Math.PI, 0); ctx.lineTo(wx + ww, wy); ctx.closePath(); ctx.fill(); ctx.strokeStyle = hsl(14, 30, 20); ctx.lineWidth = r * 0.008; ctx.beginPath(); ctx.moveTo(wx + ww / 2, wy); ctx.lineTo(wx + ww / 2, wy - wh); ctx.moveTo(wx, wy - wh * 0.45); ctx.lineTo(wx + ww, wy - wh * 0.45); ctx.stroke(); }
    // tetto a shed
    const teeth = 5, tw = (bw + d) / teeth;
    for (let i = 0; i < teeth; i++) { const x0 = bx + i * (bw / teeth), y0 = by - bh; ctx.fillStyle = hsl(210, 10, 48); ctx.beginPath(); ctx.moveTo(x0, y0); ctx.lineTo(x0 + d, y0 - d * 0.6); ctx.lineTo(x0 + d + bw / teeth, y0 - d * 0.6); ctx.lineTo(x0 + bw / teeth, y0); ctx.closePath(); ctx.fill(); ctx.fillStyle = hsl(210, 15, 30); ctx.beginPath(); ctx.moveTo(x0 + bw / teeth, y0); ctx.lineTo(x0 + bw / teeth, y0 - r * 0.1); ctx.lineTo(x0 + bw / teeth + d, y0 - d * 0.6 - r * 0.1); ctx.lineTo(x0 + bw / teeth + d, y0 - d * 0.6); ctx.closePath(); ctx.fill(); ctx.fillStyle = hsl(200, 40, 70, 0.6); ctx.fillRect(x0 + bw / teeth - 1, y0 - r * 0.08, 2, r * 0.06); }
    void tw;
    // portone
    ctx.fillStyle = hsl(20, 20, 16); ctx.fillRect(bx + bw * 0.42, by - bh * 0.55, bw * 0.16, bh * 0.55);
    // ingranaggio
    const gx = bx + bw * 0.5, gy = by - bh * 0.78, gr = r * 0.06;
    ctx.fillStyle = hsl(40, 55, 50); ctx.beginPath(); for (let i = 0; i < 24; i++) { const a = i / 24 * TAU, rr = i % 2 ? gr : gr * 1.3; ctx.lineTo(gx + Math.cos(a) * rr, gy + Math.sin(a) * rr); } ctx.closePath(); ctx.fill(); ctx.fillStyle = hsl(14, 42, 30); ctx.beginPath(); ctx.arc(gx, gy, gr * 0.4, 0, TAU); ctx.fill();
    // cisterna
    const tx = cx + r * 0.62, ty = cy + r * 0.05;
    ctx.strokeStyle = hsl(25, 20, 22); ctx.lineWidth = r * 0.015; ctx.beginPath(); ctx.moveTo(tx - r * 0.08, ty); ctx.lineTo(tx - r * 0.06, ty - r * 0.25); ctx.moveTo(tx + r * 0.08, ty); ctx.lineTo(tx + r * 0.06, ty - r * 0.25); ctx.stroke();
    ctx.fillStyle = hsl(200, 10, 45); ctx.fillRect(tx - r * 0.1, ty - r * 0.42, r * 0.2, r * 0.18); ctx.fillStyle = hsl(200, 10, 32); ctx.fillRect(tx, ty - r * 0.42, r * 0.1, r * 0.18); ctx.fillStyle = hsl(200, 10, 55); ctx.beginPath(); ctx.ellipse(tx, ty - r * 0.42, r * 0.1, r * 0.035, 0, 0, TAU); ctx.fill();
    return { chimneys: chim.map(([x, y, k]) => [x, y - r * 0.62 * k]) };
  };
  P.H = (ctx, rnd, cx, cy, r, fac, inactive) => { // base di fazione: accampamento (abbandonato se la fazione non gioca)
    if (inactive) {
      ground(ctx, rnd, cx, cy, r, hsl(60, 10, 38), [hsl(50, 12, 44, 0.5), hsl(80, 12, 30, 0.5)], [hsl(60, 10, 28, 0.4)]);
      soft(ctx, cx, cy + r * 0.1, r * 0.7, 'hsla(35,12%,50%,0.6)');
      const pr0 = r * 0.66;
      for (let i = 0; i < 46; i++) { if (rnd() < 0.45) continue; const a = i / 46 * TAU; const x = cx + Math.cos(a) * pr0, y = cy + Math.sin(a) * pr0 * 0.78 + r * 0.08, h = r * lerp(0.03, 0.1, rnd()); ctx.fillStyle = hsl(28, 15, lerp(22, 30, rnd())); ctx.fillRect(x - r * 0.018, y - h, r * 0.036, h); }
      for (let i = 0; i < 3; i++) { const x = cx + (i - 1) * r * 0.3, y = cy + (i % 2 ? r * 0.3 : -r * 0.02); shadow(ctx, x + r * 0.1, y, r * 0.18, r * 0.05, 0.25); ctx.fillStyle = hsl(40, 6, 52); ctx.beginPath(); ctx.moveTo(x - r * 0.16, y); ctx.lineTo(x - r * 0.02, y - r * 0.1); ctx.lineTo(x + r * 0.14, y - r * 0.03); ctx.lineTo(x + r * 0.17, y); ctx.closePath(); ctx.fill(); }
      return null;
    }
    const tint = { ferro: [6, 55], campi: [40, 10], brina: [210, 45], carbone: [230, 8], steppa: [45, 70], verde: [130, 30], viola: [280, 30] }[fac] || [30, 10];
    ground(ctx, rnd, cx, cy, r, hsl(70, 22, 42), [hsl(60, 25, 50, 0.5), hsl(90, 25, 32, 0.5)], [hsl(80, 25, 30, 0.4)]);
    // spiazzo battuto
    soft(ctx, cx, cy + r * 0.1, r * 0.75, 'hsla(35,30%,60%,0.75)');
    // palizzata
    const pr = r * 0.66;
    for (let i = 0; i < 46; i++) { const a = i / 46 * TAU; if (Math.abs(Math.sin(a) - 1) < 0.05) continue; const x = cx + Math.cos(a) * pr, y = cy + Math.sin(a) * pr * 0.78 + r * 0.08; ctx.fillStyle = hsl(28, 35, lerp(26, 36, rnd())); ctx.fillRect(x - r * 0.018, y - r * 0.12, r * 0.036, r * 0.12); ctx.fillStyle = hsl(28, 30, 20); ctx.beginPath(); ctx.moveTo(x - r * 0.018, y - r * 0.12); ctx.lineTo(x, y - r * 0.15); ctx.lineTo(x + r * 0.018, y - r * 0.12); ctx.fill(); }
    const col = hsl(tint[0], tint[1], 55), colD = hsl(tint[0], tint[1], 38);
    tent(ctx, cx - r * 0.3, cy - r * 0.05, r * 0.32, col, colD);
    tent(ctx, cx + r * 0.25, cy - r * 0.12, r * 0.28, col, colD);
    // fuoco
    ctx.fillStyle = hsl(28, 30, 25); ctx.beginPath(); ctx.ellipse(cx, cy + r * 0.28, r * 0.06, r * 0.025, 0, 0, TAU); ctx.fill();
    soft(ctx, cx, cy + r * 0.25, r * 0.12, 'hsla(35,100%,60%,0.6)');
    tent(ctx, cx - r * 0.02, cy + r * 0.48, r * 0.3, col, colD);
    return { flag: [cx + r * 0.05, cy - r * 0.15], color: hsl(tint[0], Math.max(tint[1], 20), 48) };
  };

  /* ---------- mappa ---------- */
  function noiseCanvas(seed) {
    const c = document.createElement('canvas'); c.width = c.height = 256; const g = c.getContext('2d'); const id = g.createImageData(256, 256); const rnd = rng(seed);
    for (let i = 0; i < id.data.length; i += 4) { const v = 128 + (rnd() - 0.5) * 90; id.data[i] = id.data[i + 1] = id.data[i + 2] = v; id.data[i + 3] = 255; }
    g.putImageData(id, 0, 0); return c;
  }
  function linen() {
    const c = document.createElement('canvas'); c.width = c.height = 128; const g = c.getContext('2d'), rnd = rng(3);
    g.fillStyle = '#fff'; g.fillRect(0, 0, 128, 128);
    for (let i = 0; i < 128; i += 2) { g.fillStyle = `rgba(90,70,40,${0.08 + rnd() * 0.12})`; g.fillRect(0, i, 128, 1); g.fillStyle = `rgba(90,70,40,${0.05 + rnd() * 0.1})`; g.fillRect(i, 0, 1, 128); }
    return c;
  }
  // geometria: esagoni con la punta in alto, righe pari spostate di mezzo esagono a destra
  function layout(cells, R) {
    const W = Math.sqrt(3) * R, minC = Math.min(...cells.map(c => c[0])), minR = Math.min(...cells.map(c => c[1]));
    const pos = (c, r) => [(c - minC) * W + (r % 2 === 0 ? W / 2 : 0) + W / 2, (r - minR) * 1.5 * R + R];
    let w = 0, h = 0; for (const [c, r] of cells) { const [x, y] = pos(c, r); w = Math.max(w, x + W / 2); h = Math.max(h, y + R); }
    const shift = Math.min(...cells.map(([c, r]) => pos(c, r)[0] - W / 2));
    return { W, R, pos: (c, r) => { const [x, y] = pos(c, r); return [x - shift, y]; }, width: w - shift, height: h };
  }
  const vertex = (cx, cy, R, i) => { const a = (60 * i - 90) * Math.PI / 180; return [cx + R * Math.cos(a), cy + R * Math.sin(a)]; };
  function neighbor(c, r, s) { const e = r % 2 === 0 ? 1 : 0; return [[c + e, r - 1], [c + 1, r], [c + e, r + 1], [c + e - 1, r + 1], [c - 1, r], [c + e - 1, r - 1]][s]; }

  // fiumi: unisce i lati in tratti continui
  function riverChains(cells, L) {
    const seen = new Set(), segs = [];
    const key = p => p.map(v => Math.round(v)).join(',');
    for (const cell of cells) for (const s of cell[6]) {
      const n = neighbor(cell[0], cell[1], s), k = [cell[0], cell[1], n[0], n[1]].join('|'), k2 = [n[0], n[1], cell[0], cell[1]].join('|');
      if (seen.has(k) || seen.has(k2)) continue; seen.add(k);
      const [cx, cy] = L.pos(cell[0], cell[1]); segs.push([vertex(cx, cy, L.R, s), vertex(cx, cy, L.R, (s + 1) % 6)]);
    }
    const chains = [], used = new Array(segs.length).fill(false);
    for (let i = 0; i < segs.length; i++) {
      if (used[i]) continue; used[i] = true; let chain = [segs[i][0], segs[i][1]];
      let grown = true;
      while (grown) {
        grown = false;
        for (let j = 0; j < segs.length; j++) {
          if (used[j]) continue; const [a, b] = segs[j];
          if (key(a) === key(chain[chain.length - 1])) { chain.push(b); used[j] = grown = true; }
          else if (key(b) === key(chain[chain.length - 1])) { chain.push(a); used[j] = grown = true; }
          else if (key(b) === key(chain[0])) { chain.unshift(a); used[j] = grown = true; }
          else if (key(a) === key(chain[0])) { chain.unshift(b); used[j] = grown = true; }
        }
      }
      chains.push(chain);
    }
    return chains;
  }
  // percorso morbido e leggermente sinuoso lungo una catena di vertici
  function riverPath(chain, rnd, R) {
    const pts = [];
    for (let i = 0; i < chain.length - 1; i++) {
      const [x0, y0] = chain[i], [x1, y1] = chain[i + 1], nx = -(y1 - y0), ny = x1 - x0, l = Math.hypot(nx, ny);
      for (let k = 0; k < 4; k++) { const t = k / 4, w = k ? Math.sin(t * Math.PI) * (rnd() - 0.5) * R * 0.12 : 0; pts.push([lerp(x0, x1, t) + nx / l * w, lerp(y0, y1, t) + ny / l * w]); }
    }
    pts.push(chain[chain.length - 1]);
    return pts;
  }
  function strokeSmooth(ctx, pts) {
    ctx.beginPath(); ctx.moveTo(pts[0][0], pts[0][1]);
    for (let i = 1; i < pts.length - 1; i++) { const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2; ctx.quadraticCurveTo(pts[i][0], pts[i][1], mx, my); }
    const l = pts[pts.length - 1]; ctx.lineTo(l[0], l[1]); ctx.stroke();
  }

  function paintMap(canvas, cells, opts = {}) {
    const R = opts.R || R0, scale = opts.scale || 1, L = layout(cells, R);
    canvas.width = Math.ceil(L.width * scale); canvas.height = Math.ceil(L.height * scale);
    const ctx = canvas.getContext('2d'); ctx.scale(scale, scale);
    const noise = noiseCanvas(7), pat = ctx.createPattern(noise, 'repeat');
    const extras = {};
    for (const cell of cells) {
      const [c, r, t] = cell, [cx, cy] = L.pos(c, r), rnd = rng(c * 7919 + r * 104729 + 13);
      ctx.save(); hexPath(ctx, cx, cy, R + 0.6); ctx.clip();
      const ex = P[t](ctx, rnd, cx, cy, R, cell[5], opts.inactive && opts.inactive.indexOf(c + ',' + r) >= 0);
      // grana pittorica
      ctx.globalCompositeOperation = 'overlay'; ctx.globalAlpha = 0.18; ctx.fillStyle = pat; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.globalCompositeOperation = 'source-over'; ctx.globalAlpha = 1;
      // luce dall'alto a sinistra
      const g = ctx.createLinearGradient(cx - R, cy - R, cx + R, cy + R); g.addColorStop(0, 'rgba(255,240,210,0.10)'); g.addColorStop(1, 'rgba(20,10,30,0.16)'); ctx.fillStyle = g; ctx.fillRect(cx - R, cy - R, R * 2, R * 2);
      ctx.restore();
      if (ex) extras[c + ',' + r] = ex;
    }
    // bordi degli esagoni
    for (const [c, r] of cells) {
      const [cx, cy] = L.pos(c, r);
      hexPath(ctx, cx, cy, R); ctx.strokeStyle = 'rgba(30,20,10,0.45)'; ctx.lineWidth = 2; ctx.stroke();
      hexPath(ctx, cx, cy, R - 2.5); ctx.strokeStyle = 'rgba(255,240,210,0.16)'; ctx.lineWidth = 1.5; ctx.stroke();
    }
    // fiumi
    const rnd = rng(99), chains = riverChains(cells, L).map(ch => riverPath(ch, rnd, R));
    ctx.lineCap = 'round'; ctx.lineJoin = 'round';
    for (const p of chains) { ctx.strokeStyle = 'rgba(70,60,30,0.55)'; ctx.lineWidth = R * 0.2; strokeSmooth(ctx, p); }
    for (const p of chains) { ctx.strokeStyle = hsl(198, 50, 34); ctx.lineWidth = R * 0.14; strokeSmooth(ctx, p); }
    for (const p of chains) { ctx.strokeStyle = hsl(195, 55, 48); ctx.lineWidth = R * 0.08; strokeSmooth(ctx, p); }
    for (const p of chains) { ctx.strokeStyle = 'rgba(210,240,255,0.35)'; ctx.lineWidth = R * 0.02; strokeSmooth(ctx, p); }
    // tono pittorico unico: meno saturazione, luce calda, grana di tela
    ctx.save(); ctx.beginPath(); for (const [c, r] of cells) { const [cx, cy] = L.pos(c, r); for (let i = 0; i < 6; i++) { const [x, y] = vertex(cx, cy, R + 1, i); i ? ctx.lineTo(x, y) : ctx.moveTo(x, y); } ctx.closePath(); } ctx.clip(); ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'saturation'; ctx.fillStyle = 'rgba(128,128,128,0.22)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'soft-light'; ctx.fillStyle = 'rgba(214,170,110,0.35)'; ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.globalCompositeOperation = 'multiply'; ctx.globalAlpha = 0.10; ctx.fillStyle = ctx.createPattern(linen(), 'repeat'); ctx.fillRect(0, 0, canvas.width, canvas.height);
    ctx.restore();
    return { layout: L, rivers: chains, extras };
  }
  return { paintMap, layout, neighbor, hexPath, rng, strokeSmooth };
})();
