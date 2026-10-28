/* ===== Ticket to Ride Italy: la mappa interattiva =====
   Sotto il canvas dipinto (Painter), sopra un livello SVG con i binari spazio per spazio, le stazioni,
   i vagoni dei giocatori, le evidenziazioni e le animazioni. Si trascina con un dito e si ingrandisce con due. */
var Board = (function () {
  var D = BIData, A = BIArt, NS = 'http://www.w3.org/2000/svg', C = D.COLORS;
  var RC = 10, GAP = 2.6, TH = 9, TWIN = 6.2;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = null, painted = null, GEO = null;

  function el(tag, attrs, html) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }

  /* ---------- geometria delle tratte ---------- */
  function geometry() {
    if (GEO) return GEO;
    GEO = {};
    D.routes.forEach(function (r) {
      var a = D.cities[r.a], b = D.cities[r.b];
      var ax = a.x, ay = a.y, bx = b.x, by = b.y, L0 = Math.hypot(bx - ax, by - ay), ux = (bx - ax) / L0, uy = (by - ay) / L0, nx = -uy, ny = ux;
      var off = r.twin != null ? (r.id < r.twin ? TWIN : -TWIN) : 0;
      ax += nx * off; ay += ny * off; bx += nx * off; by += ny * off;
      var bend = r.bend || 0, mx = (ax + bx) / 2 + nx * bend, my = (ay + by) / 2 + ny * bend;
      var qx = 2 * mx - (ax + bx) / 2, qy = 2 * my - (ay + by) / 2;
      function at(t) { return [(1 - t) * (1 - t) * ax + 2 * (1 - t) * t * qx + t * t * bx, (1 - t) * (1 - t) * ay + 2 * (1 - t) * t * qy + t * t * by]; }
      function tan(t) { return [2 * (1 - t) * (qx - ax) + 2 * t * (bx - qx), 2 * (1 - t) * (qy - ay) + 2 * t * (by - qy)]; }
      // lunghezza della curva (campionata) e tabella per muoversi a passo costante
      var N = 60, acc = [0], prev = at(0); for (var i = 1; i <= N; i++) { var p = at(i / N); acc.push(acc[i - 1] + Math.hypot(p[0] - prev[0], p[1] - prev[1])); prev = p; }
      var L = acc[N];
      function atLen(s) { for (var j = 1; j <= N; j++) if (acc[j] >= s) { var f = (s - acc[j - 1]) / ((acc[j] - acc[j - 1]) || 1); return (j - 1 + f) / N; } return 1; }
      var n = r.len, seg = r.ferry ? Math.min(24, (L - 2 * RC - (n + 1) * GAP) / n) : Math.min(32, (L - 2 * RC - (n + 1) * GAP) / n);
      var tot = n * seg + (n - 1) * GAP, s0 = (L - tot) / 2, slots = [];
      for (var k = 0; k < n; k++) {
        var t = atLen(s0 + k * (seg + GAP) + seg / 2), pt = at(t), tg = tan(t);
        slots.push({ x: pt[0], y: pt[1], ang: Math.atan2(tg[1], tg[0]) * 180 / Math.PI, w: seg });
      }
      var d = 'M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + (bend ? ' Q' + qx.toFixed(1) + ' ' + qy.toFixed(1) + ' ' : ' L') + bx.toFixed(1) + ' ' + by.toFixed(1);
      var mid = at(0.5);
      GEO[r.id] = { slots: slots, d: d, mid: mid, L: L };
    });
    return GEO;
  }

  /* ---------- montaggio ---------- */
  function mount(root, opts) {
    var G = geometry();
    if (!painted) { painted = document.createElement('canvas'); Painter.paint(painted, Math.min(2, Math.max(1.25, window.devicePixelRatio || 1))); }
    root.innerHTML = '<div class="bd-stage" id="bd-stage"><div class="bd-world" id="bd-world"></div></div>';
    var world = root.querySelector('#bd-world');
    painted.style.width = D.W + 'px'; painted.style.height = D.H + 'px';
    world.appendChild(painted);
    world.style.width = D.W + 'px'; world.style.height = D.H + 'px';
    var svg = el('svg', { viewBox: '0 0 ' + D.W + ' ' + D.H, width: D.W, height: D.H, class: 'bd-svg' });
    svg.innerHTML = A.DEFS;
    world.appendChild(svg);
    st = { root: root, stage: root.querySelector('#bd-stage'), world: world, svg: svg, view: { x: 0, y: 0, k: 1 }, opts: opts, claimSig: null, fxN: -1 };
    ['lanes', 'hl', 'slots', 'claims', 'cities', 'labels', 'regions', 'fx'].forEach(function (n) { var g = el('g', { class: 'bd-' + n }); svg.appendChild(g); st[n] = g; });
    // binari liberi
    D.routes.forEach(function (r) {
      var geo = G[r.id], k = C[r.col];
      if (r.ferry) st.lanes.appendChild(el('path', { d: geo.d, class: 'bd-lane' }));
      var g = el('g', { class: 'bd-route', 'data-route': r.id });
      geo.slots.forEach(function (s, i) {
        var loco = r.ferry && i < r.ferry;
        var h = '<rect x="' + (-s.w / 2).toFixed(1) + '" y="' + (-TH / 2) + '" width="' + s.w.toFixed(1) + '" height="' + TH + '" rx="2" fill="' + k.c + '" stroke="' + k.d + '" stroke-width="1.1"/>' +
          '<rect x="' + (-s.w / 2 + 1.5).toFixed(1) + '" y="' + (-TH / 2 + 1.2) + '" width="' + (s.w - 3).toFixed(1) + '" height="1.6" rx=".8" fill="rgba(255,255,255,' + (r.col === 'W' ? '.9' : '.32') + ')"/>' +
          (loco ? '<g transform="rotate(' + (-s.ang).toFixed(1) + ') scale(.78)">' + A.wave('#fff') + '</g>' : '');
        g.appendChild(el('g', { transform: 'translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ') rotate(' + s.ang.toFixed(1) + ')' }, h));
      });
      st.slots.appendChild(g);
    });
    // stazioni e nomi; i valichi verso i Paesi confinanti sono una bandierina col nome del Paese
    Object.keys(D.cities).forEach(function (id) {
      var c = D.cities[id], big = id === 'roma';
      if (c.zone) {
        var nm = c.n.toUpperCase(), w = nm.length * 6.2 + 26;
        st.cities.appendChild(el('g', { class: 'bd-city bd-gate', 'data-city': id, transform: 'translate(' + c.x + ' ' + c.y + ')' },
          '<circle class="bd-cring" r="15"/><rect x="' + (-w / 2) + '" y="-9" width="' + w + '" height="18" rx="9" fill="#f6ecd2" stroke="#5b4630" stroke-width="1.4" filter="url(#bi-shadow)"/>' +
          '<g transform="translate(' + (-w / 2 + 5) + ' -5.5) scale(.75)"><g>' + A.flag(c.zone).replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, '') + '</g></g>' +
          '<text x="' + (-w / 2 + 19) + '" y="3.6" class="bd-gate-t">' + nm + '</text>'));
        return;
      }
      st.cities.appendChild(el('g', { class: 'bd-city', 'data-city': id, transform: 'translate(' + c.x + ' ' + c.y + ')' },
        '<circle class="bd-cring" r="15"/>' +
        '<circle class="bd-st" r="' + (big ? 10.5 : 8.6) + '" fill="#f6ecd2" stroke="#7a2418" stroke-width="2.6" filter="url(#bi-shadow)"/>' +
        (big ? '<circle r="6.6" fill="none" stroke="#7a2418" stroke-width="1"/>' : '') +
        '<circle r="' + (big ? 3.6 : 3.2) + '" fill="#7a2418"/>'));
      var t = el('text', { x: c.x + c.lab[0], y: c.y + c.lab[1], 'text-anchor': c.lab[2], class: 'bd-label' + (big ? ' big' : ''), 'data-city': id });
      t.textContent = c.n; st.labels.appendChild(t);
    });
    // vista «Regioni»: nome di ogni regione accanto alle sue città
    Object.keys(D.regions).forEach(function (k) {
      var R2 = D.regions[k], x = 0, y = 0; R2.cities.forEach(function (c) { x += D.cities[c].x; y += D.cities[c].y; }); x /= R2.cities.length; y /= R2.cities.length;
      var t2 = el('text', { x: x.toFixed(1), y: (y + (R2.cities.length === 1 ? 38 : 4)).toFixed(1), 'text-anchor': 'middle', class: 'bd-reg', fill: R2.c }); t2.textContent = R2.n.toUpperCase(); st.regions.appendChild(t2);
    });
    bindInput();
    fit();
    return st;
  }
  function unmount() { if (st) { window.removeEventListener('resize', st.onResize); st = null; } }
  function mounted() { return !!st && document.body.contains(st.root) && !!st.root.querySelector('#bd-stage'); }

  /* ---------- aggiornamento: vagoni dei giocatori, evidenziazioni, animazioni ---------- */
  function update(g, opts) {
    if (!st) return;
    opts = opts || {};
    var G = geometry();
    var sig = JSON.stringify(g.claims);
    var fresh = {};
    (g.fx || []).forEach(function (e) { if (e.k === 'claim' && st.fxN !== g.fxN && st.fxN !== -1) fresh[e.r] = e; });
    if (sig !== st.claimSig) {
      st.claimSig = sig; st.claims.innerHTML = '';
      Object.keys(g.claims).forEach(function (rid) {
        var p = g.claims[rid], pc = g.players[p].col, geo = G[rid], anim = fresh[rid] && !reduce;
        var grp = el('g', { class: 'bd-claim', 'data-route': rid });
        geo.slots.forEach(function (s, i) {
          var w = Math.max(14, s.w + 1);
          var u = el('g', { transform: 'translate(' + s.x.toFixed(1) + ' ' + s.y.toFixed(1) + ') rotate(' + s.ang.toFixed(1) + ')' },
            '<g class="' + (anim ? 'bd-drop' : '') + '" style="' + (anim ? 'animation-delay:' + (i * 110) + 'ms' : '') + '"><use href="#bi-pw' + pc + '" x="' + (-w / 2) + '" y="-6" width="' + w + '" height="12" filter="url(#bi-shadow)"/></g>');
          grp.appendChild(u);
        });
        st.claims.appendChild(grp);
      });
    }
    // tratte evidenziate
    st.hl.innerHTML = '';
    var hl = opts.hl || {};
    Object.keys(hl).forEach(function (rid) {
      var geo = G[rid]; if (!geo) return;
      st.hl.appendChild(el('path', { d: geo.d, class: 'bd-hl ' + hl[rid] }));
    });
    st.slots.classList.toggle('dimmed', !!opts.focus);
    st.claims.classList.toggle('dimmed', !!opts.focus);
    Array.prototype.forEach.call(st.slots.children, function (n) { n.classList.toggle('focus', !!(opts.focus && opts.focus[n.getAttribute('data-route')])); });
    Array.prototype.forEach.call(st.claims.children, function (n) { n.classList.toggle('focus', !!(opts.focus && opts.focus[n.getAttribute('data-route')])); });
    // città evidenziate
    var cs = opts.cities || {};
    Array.prototype.forEach.call(st.cities.children, function (n) { var id = n.getAttribute('data-city'), c = D.cities[id]; n.setAttribute('class', 'bd-city' + (c.zone ? ' bd-gate' : '') + (cs[id] ? ' ' + cs[id] : '')); if (!c.zone) n.style.setProperty('--rc', D.regions[c.reg].c); });
    st.svg.classList.toggle('show-reg', !!opts.regions);
    Array.prototype.forEach.call(st.labels.children, function (n) { var id = n.getAttribute('data-city'); n.classList.toggle('hot', !!cs[id]); });
    // animazioni dei punti appena fatti
    if (st.fxN !== g.fxN) {
      var first = st.fxN === -1; st.fxN = g.fxN;
      if (!first) (g.fx || []).forEach(function (e) {
        if (e.k !== 'claim') return;
        var geo = G[e.r], pc = g.players[e.p].col;
        var glow = el('path', { d: geo.d, class: 'bd-flash', stroke: D.PCOL[pc].c }); st.fx.appendChild(glow);
        var t = el('text', { x: geo.mid[0], y: geo.mid[1] - 10, class: 'bd-float', 'text-anchor': 'middle' }); t.textContent = '+' + e.pts; st.fx.appendChild(t);
        setTimeout(function () { glow.remove(); t.remove(); }, 2200);
        if (opts.follow) centerOnPoint(geo.mid[0], geo.mid[1], null, true);
      });
    }
  }

  /* ---------- vista ---------- */
  function apply(smooth) {
    st.world.style.transition = smooth ? 'transform .45s cubic-bezier(.2,.8,.2,1)' : '';
    st.world.style.transform = 'translate(' + st.view.x + 'px,' + st.view.y + 'px) scale(' + st.view.k + ')';
  }
  function box() { var r = st.stage.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function fit() {
    if (!st) return; var b = box(); if (!b.w) return;
    st.fitK = Math.min(b.w / (D.W + 10), b.h / (D.H + 10));
    st.view.k = st.fitK; st.view.x = (b.w - D.W * st.view.k) / 2; st.view.y = (b.h - D.H * st.view.k) / 2; apply(); st.fitted = true;
  }
  function clampView() {
    var b = box(), w = D.W * st.view.k, h = D.H * st.view.k, m = 40;
    st.view.x = w < b.w ? (b.w - w) / 2 : Math.min(m, Math.max(b.w - w - m, st.view.x));
    st.view.y = h < b.h ? (b.h - h) / 2 : Math.min(m, Math.max(b.h - h - m, st.view.y));
  }
  var KMAX = 3.2;
  function zoomAt(f, px, py) {
    var b = box(); px = px == null ? b.w / 2 : px - b.l; py = py == null ? b.h / 2 : py - b.t;
    var k = Math.max((st.fitK || 0.3) * 0.9, Math.min(KMAX, st.view.k * f)), r = k / st.view.k;
    st.view.x = px - (px - st.view.x) * r; st.view.y = py - (py - st.view.y) * r; st.view.k = k; clampView(); apply();
  }
  function centerOnPoint(x, y, zoom, smooth) {
    if (!st) return; var b = box();
    if (zoom) st.view.k = Math.max(st.fitK || 0.3, Math.min(KMAX, zoom));
    // se è già ben visibile non si muove
    if (!zoom) { var sx = st.view.x + x * st.view.k, sy = st.view.y + y * st.view.k; if (sx > b.w * 0.15 && sx < b.w * 0.85 && sy > b.h * 0.15 && sy < b.h * 0.85) return; }
    st.view.x = b.w / 2 - x * st.view.k; st.view.y = b.h / 2 - y * st.view.k; clampView(); apply(smooth);
  }
  function centerOnRoutes(ids, smooth, o) { // inquadra un insieme di tratte o città (o.maxK: zoom massimo, o.up: quota dello schermo coperta in basso)
    o = o || {};
    if (!st || !ids.length) return; var G = geometry(), xs = [], ys = [];
    ids.forEach(function (id) { if (typeof id === 'string' && D.cities[id]) { xs.push(D.cities[id].x); ys.push(D.cities[id].y); } else if (G[id]) G[id].slots.forEach(function (s) { xs.push(s.x); ys.push(s.y); }); });
    var x0 = Math.min.apply(null, xs) - 40, x1 = Math.max.apply(null, xs) + 40, y0 = Math.min.apply(null, ys) - 40, y1 = Math.max.apply(null, ys) + 40, b = box();
    var hv = b.h * (1 - (o.up || 0)), k = Math.max(st.fitK, Math.min(o.maxK || 2.2, Math.min(b.w / (x1 - x0), hv / (y1 - y0))));
    st.view.k = k; st.view.x = b.w / 2 - (x0 + x1) / 2 * k; st.view.y = hv / 2 - (y0 + y1) / 2 * k; clampView(); apply(smooth !== false);
  }
  function bindInput() {
    var stage = st.stage, ptr = new Map(), down = null, pinch = null;
    stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('pointerdown', function (e) {
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      ptr.set(e.pointerId, [e.clientX, e.clientY]); st.world.style.transition = '';
      if (ptr.size === 1) down = { x: e.clientX, y: e.clientY, vx: st.view.x, vy: st.view.y, moved: false };
      else { down = null; var v = Array.from(ptr.values()), b = box(); pinch = { d: Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), k: st.view.k, mx: (v[0][0] + v[1][0]) / 2 - b.l, my: (v[0][1] + v[1][1]) / 2 - b.t, vx: st.view.x, vy: st.view.y }; }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!ptr.has(e.pointerId)) return;
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && ptr.size >= 2) {
        var v = Array.from(ptr.values()), d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), b = box(), mx = (v[0][0] + v[1][0]) / 2 - b.l, my = (v[0][1] + v[1][1]) / 2 - b.t;
        var k = Math.max((st.fitK || .3) * 0.9, Math.min(KMAX, pinch.k * d / pinch.d)), r = k / pinch.k;
        st.view.k = k; st.view.x = mx - (pinch.mx - pinch.vx) * r; st.view.y = my - (pinch.my - pinch.vy) * r; clampView(); apply(); return;
      }
      if (down) { var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 8) { down.moved = true; stage.classList.add('drag'); } if (down.moved) { st.view.x = down.vx + dx; st.view.y = down.vy + dy; clampView(); apply(); } }
    });
    var up = function (e) {
      var tap = down && !down.moved && ptr.size === 1;
      ptr.delete(e.pointerId); stage.classList.remove('drag'); if (ptr.size < 2) pinch = null;
      if (tap) { var tx = e.clientX, ty = e.clientY; setTimeout(function () { if (st) onTap(tx, ty); }, 0); }
      if (!ptr.size) down = null;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', function (e) { ptr.delete(e.pointerId); down = null; pinch = null; stage.classList.remove('drag'); });
    st.onResize = function () { if (st) { if (!st.fitted || st.view.k <= (st.fitK || 0) * 1.01) fit(); else { clampView(); apply(); } } };
    window.addEventListener('resize', st.onResize);
  }
  // tocco: città se vicina, altrimenti la tratta più vicina (anche tra due binari paralleli)
  function onTap(cx, cy) {
    var b = box(), x = (cx - b.l - st.view.x) / st.view.k, y = (cy - b.t - st.view.y) / st.view.k, tol = Math.max(10, 16 / st.view.k);
    var bestC = null, dc = 1e9;
    Object.keys(D.cities).forEach(function (id) { var c = D.cities[id], d = Math.hypot(c.x - x, c.y - y); if (d < dc) { dc = d; bestC = id; } });
    var G = geometry(), bestR = null, dr = 1e9;
    D.routes.forEach(function (r) { G[r.id].slots.forEach(function (s) { var d = Math.hypot(s.x - x, s.y - y) - s.w / 2 * 0.6; if (d < dr) { dr = d; bestR = r.id; } }); });
    if (bestC && dc < Math.max(12, 13 / st.view.k) && dc <= dr + 4) { if (st.opts.onCity) st.opts.onCity(bestC); return; }
    if (bestR != null && dr < tol) { if (st.opts.onRoute) st.opts.onRoute(bestR); return; }
    if (st.opts.onEmpty) st.opts.onEmpty();
  }
  return { mount: mount, unmount: unmount, mounted: mounted, update: update, fit: fit, zoomAt: function (f) { if (st) zoomAt(f); }, centerOnRoutes: centerOnRoutes,
    centerOnCity: function (id, zoom) { var c = D.cities[id]; if (c) centerOnPoint(c.x, c.y, zoom, true); }, geometry: geometry };
})();
