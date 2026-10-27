/* ===== Campi d'Acciaio: la mappa animata =====
   Un canvas dipinto una volta sola (i territori) e sopra un livello SVG con pedine, strutture, risorse,
   segnalini ed evidenziazioni. Le pedine restano gli stessi elementi tra un aggiornamento e l'altro:
   quando cambiano territorio camminano fino al nuovo posto. */
var Board = (function () {
  var E = CAEngine, A = CAArt, D = CAData, NS = 'http://www.w3.org/2000/svg';
  var R = 120, painted = null, paintedKey = null;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = null;

  function el(tag, attrs, html) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function hexPts(cx, cy, r) { var a = []; for (var i = 0; i < 6; i++) { var t = (60 * i - 90) * Math.PI / 180; a.push((cx + r * Math.cos(t)).toFixed(1) + ',' + (cy + r * Math.sin(t)).toFixed(1)); } return a.join(' '); }

  function paint(inactive) {
    var key = inactive.slice().sort().join('|');
    if (painted && paintedKey === key) return painted;
    var cv = document.createElement('canvas'), scale = Math.min(1.5, Math.max(1, window.devicePixelRatio || 1));
    var res = Terrain.paintMap(cv, D.MAP, { scale: scale, inactive: inactive });
    painted = { canvas: cv, res: res, L: res.layout }; paintedKey = key;
    return painted;
  }
  function pos(k) { var h = E.HEX[k]; return st.L.pos(h.c, h.r); }

  function mount(root, opts) {
    var pm = paint(opts.inactive || []);
    root.innerHTML = '<div class="bd-stage" id="bd-stage"><div class="bd-world" id="bd-world"></div></div>';
    var world = root.querySelector('#bd-world'), L = pm.L;
    pm.canvas.style.width = L.width + 'px'; pm.canvas.style.height = L.height + 'px';
    world.appendChild(pm.canvas);
    var svg = el('svg', { viewBox: '0 0 ' + L.width + ' ' + L.height, width: L.width, height: L.height, class: 'bd-svg' });
    svg.innerHTML = A.DEFS;
    world.style.width = L.width + 'px'; world.style.height = L.height + 'px';
    world.appendChild(svg);
    st = { root: root, stage: root.querySelector('#bd-stage'), world: world, svg: svg, L: L, pm: pm, opts: opts, view: { x: 0, y: 0, k: 1 }, units: {}, parts: [], prev: null, fxN: -1, raf: 0, fitted: false };
    var layers = ['riv', 'hit', 'hl', 'marks', 'structs', 'res', 'arrows', 'smoke', 'units', 'fx'];
    st.layer = {}; layers.forEach(function (n) { var g = el('g', { class: 'bd-' + n }); svg.appendChild(g); st.layer[n] = g; });
    // acqua che scorre
    if (!reduce) pm.res.rivers.forEach(function (p) {
      var d = 'M' + p[0][0] + ',' + p[0][1];
      for (var i = 1; i < p.length - 1; i++) d += ' Q' + p[i][0] + ',' + p[i][1] + ' ' + (p[i][0] + p[i + 1][0]) / 2 + ',' + (p[i][1] + p[i + 1][1]) / 2;
      d += ' L' + p[p.length - 1][0] + ',' + p[p.length - 1][1];
      st.layer.riv.appendChild(el('path', { d: d, class: 'bd-flow', 'stroke-width': R * 0.03 }));
      st.layer.riv.appendChild(el('path', { d: d, class: 'bd-flow b', 'stroke-width': R * 0.025 }));
    });
    E.KEYS.forEach(function (k) {
      var p = pos(k), h = E.HEX[k];
      st.layer.hit.appendChild(el('polygon', { points: hexPts(p[0], p[1], R - 1), class: 'bd-hit', 'data-hex': k }));
      if (h.tun) st.layer.marks.appendChild(el('g', { transform: 'translate(' + (p[0] - R * 0.5) + ' ' + (p[1] + R * 0.64) + ') scale(1.25)' }, A.tunnel()));
    });
    st.flags = [];
    (opts.flags || []).forEach(function (fl) {
      var ex = pm.res.extras[fl.k]; if (!ex) return;
      var g = el('g', { transform: 'translate(' + ex.flag[0] + ' ' + ex.flag[1] + ')' }, A.flag(fl.color)); st.layer.marks.appendChild(g); st.flags.push(g.querySelector('.cloth'));
    });
    st.chimneys = (pm.res.extras[E.FACTORY_HEX] || {}).chimneys || [];
    bindInput();
    st.raf = requestAnimationFrame(frame);
    for (var i = 0; i < 12 && !reduce; i++) { st.chimneys.forEach(function (c) { smoke(c[0], c[1], true, -i * 420); }); }
    fit();
    return st;
  }
  function unmount() { if (st) { cancelAnimationFrame(st.raf); window.removeEventListener('resize', st.onResize); st = null; } }
  function mounted() { return !!st && document.body.contains(st.root) && !!st.root.querySelector('#bd-stage'); }

  /* ---------- posti dentro l'esagono ---------- */
  var SLOT = { C: [[-0.2, 0.34]], M: [[0.2, 0.38], [0.44, 0.12], [-0.02, 0.1], [0.44, 0.56]], W: [[-0.46, 0.52], [-0.12, 0.66], [-0.62, 0.24], [0.1, 0.5], [-0.34, 0.74], [0.24, 0.74], [-0.56, 0.68], [-0.02, 0.8]] };
  var SIZE = { C: 0.78, M: 0.64, W: 1.0 };
  function layoutUnits(g) {
    var out = {}, byHex = {};
    g.units.forEach(function (u) { (byHex[u.h] = byHex[u.h] || []).push(u); });
    Object.keys(byHex).forEach(function (k) {
      var p = pos(k), list = byHex[k], players = [];
      list.forEach(function (u) { if (players.indexOf(u.p) < 0) players.push(u.p); });
      var base = E.HEX[k].t === 'H';
      players.forEach(function (pl, pi) {
        var dx = players.length > 1 ? (pi === 0 ? -0.26 : 0.26) * R : 0, sc = players.length > 1 ? 0.85 : 1;
        var idx = { C: 0, M: 0, W: 0 };
        list.filter(function (u) { return u.p === pl; }).sort(function (a, b) { return a.id < b.id ? -1 : 1; }).forEach(function (u) {
          var slots = SLOT[u.k], s = slots[idx[u.k]++ % slots.length];
          var ox = s[0] * R * (players.length > 1 ? 0.55 : 1), oy = s[1] * R * (base ? 0.7 : 1);
          if (base) oy += R * 0.05;
          out[u.id] = { x: p[0] + dx + ox, y: p[1] + oy, s: SIZE[u.k] * sc };
        });
      });
    });
    return out;
  }

  /* ---------- aggiornamento ---------- */
  function update(g, opts) {
    if (!st) return;
    opts = opts || {};
    var lay = layoutUnits(g), seen = {};
    g.units.forEach(function (u) {
      var L = lay[u.id], rec = st.units[u.id];
      seen[u.id] = 1;
      if (!rec) {
        var fac = g.players[u.p].fac, art = u.k === 'M' ? A.mech(fac) : u.k === 'C' ? A.hero(fac) : A.worker(fac);
        var gEl = el('g', { class: 'bd-unit', 'data-unit': u.id }), inner = el('g', { class: 'bd-inner' }, '<ellipse class="bd-ring" cx="0" cy="-3" rx="' + (u.k === 'W' ? 16 : 44) + '" ry="' + (u.k === 'W' ? 6 : 14) + '"/>' + art);
        gEl.appendChild(inner); st.layer.units.appendChild(gEl);
        rec = st.units[u.id] = { g: gEl, inner: inner, x: L.x, y: L.y, s: L.s, k: u.k, fac: fac, h: u.h };
        place(rec);
        if (st.prev && !reduce) pop(rec);
      } else if (rec.h !== u.h || Math.abs(rec.x - L.x) > 0.5 || Math.abs(rec.y - L.y) > 0.5) {
        var far = rec.h !== u.h;
        walk(rec, L, far && (opts.animate !== false), rec.h, u.h);
        rec.h = u.h;
      }
      rec.s = L.s; rec.inner.setAttribute('transform', 'scale(' + L.s + ')');
      rec.g.classList.toggle('sel', opts.sel === u.id);
      rec.g.classList.toggle('pick', !!(opts.pickUnits && opts.pickUnits[u.id]));
      rec.g.classList.toggle('dim', !!(opts.dimUnits && opts.dimUnits[u.id]));
    });
    Object.keys(st.units).forEach(function (id) { if (!seen[id]) { st.units[id].g.remove(); delete st.units[id]; } });
    sortUnits();
    // strutture
    var sh = '';
    g.players.forEach(function (P) { for (var s in P.st) if (P.st[s]) { var p = pos(P.st[s]); sh += '<g transform="translate(' + (p[0] - R * 0.5) + ' ' + (p[1] + R * 0.02) + ') scale(1.25)">' + A.structure(s, P.fac) + '</g>'; } });
    st.layer.structs.innerHTML = sh;
    st.sails = [].slice.call(st.layer.structs.querySelectorAll('.sails'));
    // risorse
    var rh = '';
    Object.keys(g.res).forEach(function (k) {
      var r = g.res[k], p = pos(k), i = 0;
      D.RES_ORDER.forEach(function (x) { if (r[x] > 0) { rh += '<g transform="translate(' + (p[0] + R * (0.06 + i * 0.2)) + ' ' + (p[1] + R * 0.8) + ') scale(1.05)">' + A.resStack(x, r[x]) + '</g>'; i++; } });
    });
    st.layer.res.innerHTML = rh;
    // segnalini incontro
    var eh = '';
    g.enc.forEach(function (k) { var p = pos(k); eh += '<g transform="translate(' + (p[0] + R * 0.46) + ' ' + (p[1] - R * 0.36) + ') scale(1.35)"><g class="bd-bob">' + A.encounter() + '</g></g>'; });
    st.encLayer = st.encLayer || el('g', { class: 'bd-enc' }); if (!st.encLayer.parentNode) st.layer.marks.appendChild(st.encLayer);
    st.encLayer.innerHTML = eh;
    // evidenziazioni
    var hh = '';
    var hl = opts.hl || {};
    Object.keys(hl).forEach(function (k) { var p = pos(k); hh += '<polygon class="bd-hl ' + hl[k] + '" points="' + hexPts(p[0], p[1], R - 7) + '"/>'; });
    st.layer.hl.innerHTML = hh;
    // frecce dei movimenti pianificati
    var ah = '';
    (opts.arrows || []).forEach(function (a) {
      var p0 = pos(a[0]), p1 = pos(a[1]), mx = (p0[0] + p1[0]) / 2, my = (p0[1] + p1[1]) / 2 - R * 0.35;
      ah += '<path class="bd-arrow" d="M' + p0[0] + ',' + (p0[1] + R * 0.3) + ' Q' + mx + ',' + my + ' ' + p1[0] + ',' + (p1[1] + R * 0.3) + '" marker-end="url(#bdArrowHead)"/>';
    });
    st.layer.arrows.innerHTML = '<defs><marker id="bdArrowHead" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="5" markerHeight="5" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" fill="#ffd98a"/></marker></defs>' + ah;
    // animazioni degli eventi dell'ultima mossa
    if (g.fxN !== st.fxN) { var first = st.fxN < 0; st.fxN = g.fxN; if (!first && !opts.noFx) playFx(g, g.fx || []); }
    st.prev = true;
  }
  function place(rec, bob, tilt) { rec.g.setAttribute('transform', 'translate(' + rec.x.toFixed(1) + ' ' + (rec.y - (bob || 0)).toFixed(1) + ') rotate(' + (tilt || 0).toFixed(2) + ')'); }
  function sortUnits() { var list = Object.keys(st.units).map(function (k) { return st.units[k]; }).sort(function (a, b) { return a.y - b.y; }); list.forEach(function (r) { st.layer.units.appendChild(r.g); }); }
  function pop(rec) { if (!rec.inner.animate) return; rec.g.animate([{ opacity: 0, transform: rec.g.getAttribute('transform') + ' scale(.2)' }, { opacity: 1, transform: rec.g.getAttribute('transform') + ' scale(1.15)', offset: .7 }, { opacity: 1, transform: rec.g.getAttribute('transform') + ' scale(1)' }], { duration: 650, easing: 'ease-out' }); }
  function walk(rec, L, animate, fromK, toK) {
    var from = [rec.x, rec.y], to = [L.x, L.y];
    if (rec.anim) cancelAnimationFrame(rec.anim);
    if (!animate || reduce) { rec.x = to[0]; rec.y = to[1]; place(rec); return; }
    var d = Math.hypot(to[0] - from[0], to[1] - from[1]), dur = Math.min(1600, 500 + d * 2.2), t0 = performance.now(), jump = d > R * 2.6, lastPuff = 0;
    var step = function (now) {
      var t = Math.min(1, (now - t0) / dur), e = t < 0.5 ? 2 * t * t : 1 - Math.pow(-2 * t + 2, 2) / 2;
      if (jump) { // grande distanza (galleria, ritirata, ferrovia): svanisce e ricompare
        var a = t < 0.5 ? 1 - t * 2 : (t - 0.5) * 2; rec.x = t < 0.5 ? from[0] : to[0]; rec.y = t < 0.5 ? from[1] : to[1]; rec.inner.style.opacity = a; place(rec);
      } else {
        rec.x = from[0] + (to[0] - from[0]) * e; rec.y = from[1] + (to[1] - from[1]) * e;
        var n = rec.k === 'W' ? 5 : 6, bob = Math.abs(Math.sin(t * Math.PI * n)) * (rec.k === 'M' ? 5 : 3.5), tilt = Math.sin(t * Math.PI * n) * 3;
        place(rec, bob, tilt);
        if (rec.k === 'M' && now - lastPuff > 170) { lastPuff = now; puffAt(rec); dust(rec); }
      }
      if (t < 1) rec.anim = requestAnimationFrame(step); else { rec.inner.style.opacity = 1; rec.anim = 0; place(rec); sortUnits(); }
    };
    rec.anim = requestAnimationFrame(step);
  }

  /* ---------- effetti ---------- */
  function puffAt(rec) { var p = A.PUFF[rec.fac]; smoke(rec.x + p[0] * rec.s, rec.y + p[1] * rec.s, false); }
  function dust(rec) { var c = el('ellipse', { cx: rec.x + (Math.random() - 0.5) * 30, cy: rec.y + 2, rx: 6, ry: 2.5, fill: 'rgba(200,180,140,.5)' }); st.layer.fx.appendChild(c); if (c.animate) c.animate([{ opacity: .7, transform: 'scale(1)' }, { opacity: 0, transform: 'scale(2.2)' }], { duration: 700, fill: 'forwards' }); setTimeout(function () { c.remove(); }, 720); }
  function smoke(x, y, big, age) {
    if (!st || reduce) return;
    var c = el('circle', { cx: x, cy: y, r: 6, fill: big ? 'url(#caSmoke)' : 'url(#caPuff)' });
    (big ? st.layer.smoke : st.layer.fx).appendChild(c);
    st.parts.push({ c: c, x: x, y: y, vx: (big ? 9 : 4) + Math.random() * 6, vy: -(big ? 24 : 14) - Math.random() * 8, r0: big ? 9 : 5, r1: big ? 44 : 16, life: big ? 5200 : 1200, t0: performance.now() + (age || 0) });
  }
  function floatText(k, txt, cls, delay) {
    var p = pos(k), t = el('text', { x: p[0], y: p[1] - R * 0.1, class: 'bd-float ' + (cls || ''), 'text-anchor': 'middle' }); t.textContent = txt;
    setTimeout(function () { if (!st) return; st.layer.fx.appendChild(t); if (t.animate) t.animate([{ opacity: 0, transform: 'translateY(10px)' }, { opacity: 1, transform: 'translateY(-10px)', offset: .25 }, { opacity: 1, transform: 'translateY(-34px)', offset: .8 }, { opacity: 0, transform: 'translateY(-46px)' }], { duration: 2200, fill: 'forwards' }); setTimeout(function () { t.remove(); }, 2300); }, delay || 0);
  }
  function burst(k, color) {
    var p = pos(k), g = el('g', { transform: 'translate(' + p[0] + ' ' + (p[1] + R * 0.2) + ')' });
    var h = '<circle r="20" fill="url(#caGlow)"/>';
    for (var i = 0; i < 12; i++) { var a = i * 30; h += '<rect x="-2" y="-46" width="4" height="18" rx="2" fill="' + color + '" transform="rotate(' + a + ')"/>'; }
    g.innerHTML = h; st.layer.fx.appendChild(g);
    if (g.animate) g.animate([{ opacity: 0, transform: g.getAttribute('transform') + ' scale(.3)' }, { opacity: 1, transform: g.getAttribute('transform') + ' scale(1.1)', offset: .3 }, { opacity: 0, transform: g.getAttribute('transform') + ' scale(1.5)' }], { duration: 1100, fill: 'forwards' });
    setTimeout(function () { g.remove(); }, 1150);
  }
  function clash(k) {
    var p = pos(k), g = el('g', { transform: 'translate(' + p[0] + ' ' + p[1] + ')' });
    g.innerHTML = '<circle r="70" fill="url(#caGlow)" opacity=".8"/><g stroke="#f7e3b0" stroke-width="9" stroke-linecap="round"><path d="M-40,-40 L40,40"/><path d="M40,-40 L-40,40"/></g><g stroke="#7a2a1c" stroke-width="4" stroke-linecap="round"><path d="M-40,-40 L40,40"/><path d="M40,-40 L-40,40"/></g>';
    st.layer.fx.appendChild(g);
    if (g.animate) g.animate([{ opacity: 0, transform: g.getAttribute('transform') + ' scale(.4) rotate(-20deg)' }, { opacity: 1, transform: g.getAttribute('transform') + ' scale(1.1) rotate(0deg)', offset: .25 }, { opacity: 1, transform: g.getAttribute('transform') + ' scale(1)', offset: .7 }, { opacity: 0, transform: g.getAttribute('transform') + ' scale(1.3)' }], { duration: 1800, fill: 'forwards' });
    setTimeout(function () { g.remove(); }, 1850);
  }
  function playFx(g, list) {
    var gains = {};
    list.forEach(function (e, i) {
      if (e.k === 'gain' && e.r) { var t = []; D.RES_ORDER.forEach(function (r) { if (e.r[r]) t.push('+' + e.r[r] + ' ' + D.RES[r].n); }); if (t.length) { gains[e.h] = (gains[e.h] || 0) + 1; floatText(e.h, t.join(' '), 'gain', (gains[e.h] - 1) * 500); burst(e.h, '#ffe08a'); } }
      if (e.k === 'newWorker') floatText(e.h, '+1 lavoratore', 'gain', 300);
      if (e.k === 'battle' || e.k === 'combatEnd') clash(e.h);
      if (e.k === 'deploy') burst(e.h, '#ffd27a');
      if (e.k === 'build') burst(e.h, '#e8c27a');
      if (e.k === 'enc' || e.k === 'encDone') burst(e.h, '#f3d27a');
      if (e.k === 'spend' && e.n) floatText(e.h, '−' + e.n + ' ' + D.RES[e.r].n, 'spend', i * 120);
    });
  }
  function frame(now) {
    if (!st) return;
    if (!reduce && (!st.lastSmoke || now - st.lastSmoke > 380)) { st.lastSmoke = now; st.chimneys.forEach(function (c) { smoke(c[0], c[1], true); }); }
    for (var i = st.parts.length - 1; i >= 0; i--) {
      var p = st.parts[i], t = (now - p.t0) / p.life;
      if (t >= 1) { p.c.remove(); st.parts.splice(i, 1); continue; }
      if (t < 0) { p.c.setAttribute('opacity', 0); continue; }
      p.c.setAttribute('cx', (p.x + p.vx * t * p.life / 1000).toFixed(1)); p.c.setAttribute('cy', (p.y + p.vy * t * p.life / 1000).toFixed(1));
      p.c.setAttribute('r', (p.r0 + (p.r1 - p.r0) * t).toFixed(1)); p.c.setAttribute('opacity', (t < 0.15 ? t / 0.15 : 1 - (t - 0.15) / 0.85).toFixed(2));
    }
    if (!reduce) {
      st.sailA = ((st.sailA || 0) + 0.6) % 360;
      (st.sails || []).forEach(function (s) { s.setAttribute('transform', 'rotate(' + st.sailA.toFixed(1) + ')'); });
      var w = now / 1000;
      st.flags.forEach(function (f) { var d = 'M0,-57'; for (var i = 0; i <= 8; i++) d += ' L' + i * 4 + ',' + (-57 + Math.sin(w * 4 - i * 0.7) * (i * 0.35)).toFixed(2); for (var j = 8; j >= 0; j--) d += ' L' + j * 4 + ',' + (-40 + Math.sin(w * 4 - j * 0.7 + 0.3) * (j * 0.35)).toFixed(2); f.setAttribute('d', d + 'Z'); });
    }
    st.raf = requestAnimationFrame(frame);
  }

  /* ---------- zoom e spostamento ---------- */
  function apply() { st.world.style.transform = 'translate(' + st.view.x + 'px,' + st.view.y + 'px) scale(' + st.view.k + ')'; }
  function box() { var r = st.stage.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  function fit() {
    if (!st) return; var b = box(); if (!b.w) return;
    st.fitK = Math.min(b.w / (st.L.width + 20), b.h / (st.L.height + 20));
    st.view.k = st.fitK; st.view.x = (b.w - st.L.width * st.view.k) / 2; st.view.y = (b.h - st.L.height * st.view.k) / 2; apply(); st.fitted = true;
  }
  function centerOn(k, zoom) {
    if (!st) return; var b = box(), p = pos(k);
    if (zoom) st.view.k = Math.max(st.fitK || 0.3, Math.min(1.6, zoom));
    st.view.x = b.w / 2 - p[0] * st.view.k; st.view.y = b.h / 2 - p[1] * st.view.k; clampView(); apply();
  }
  function clampView() {
    var b = box(), w = st.L.width * st.view.k, h = st.L.height * st.view.k, m = 60;
    st.view.x = w < b.w ? (b.w - w) / 2 : Math.min(m, Math.max(b.w - w - m, st.view.x));
    st.view.y = h < b.h ? (b.h - h) / 2 : Math.min(m, Math.max(b.h - h - m, st.view.y));
  }
  function zoomAt(f, px, py) {
    var b = box(); px = px == null ? b.w / 2 : px - b.l; py = py == null ? b.h / 2 : py - b.t;
    var k = Math.max((st.fitK || 0.3) * 0.9, Math.min(2.2, st.view.k * f)), r = k / st.view.k;
    st.view.x = px - (px - st.view.x) * r; st.view.y = py - (py - st.view.y) * r; st.view.k = k; clampView(); apply();
  }
  function bindInput() {
    var stage = st.stage, ptr = new Map(), down = null, pinch = null;
    stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * 0.0015), e.clientX, e.clientY); }, { passive: false });
    stage.addEventListener('pointerdown', function (e) {
      try { stage.setPointerCapture(e.pointerId); } catch (x) {}
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (ptr.size === 1) down = { x: e.clientX, y: e.clientY, vx: st.view.x, vy: st.view.y, moved: false };
      else { down = null; var v = Array.from(ptr.values()); pinch = { d: Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), k: st.view.k, mx: (v[0][0] + v[1][0]) / 2 - box().l, my: (v[0][1] + v[1][1]) / 2 - box().t, vx: st.view.x, vy: st.view.y }; }
    });
    stage.addEventListener('pointermove', function (e) {
      if (!ptr.has(e.pointerId)) return;
      ptr.set(e.pointerId, [e.clientX, e.clientY]);
      if (pinch && ptr.size >= 2) {
        var v = Array.from(ptr.values()), d = Math.hypot(v[0][0] - v[1][0], v[0][1] - v[1][1]), b = box(), mx = (v[0][0] + v[1][0]) / 2 - b.l, my = (v[0][1] + v[1][1]) / 2 - b.t;
        var k = Math.max((st.fitK || .3) * 0.9, Math.min(2.2, pinch.k * d / pinch.d)), r = k / pinch.k;
        st.view.k = k; st.view.x = mx - (pinch.mx - pinch.vx) * r; st.view.y = my - (pinch.my - pinch.vy) * r; clampView(); apply(); return;
      }
      if (down) { var dx = e.clientX - down.x, dy = e.clientY - down.y; if (Math.hypot(dx, dy) > 8) { down.moved = true; stage.classList.add('drag'); } if (down.moved) { st.view.x = down.vx + dx; st.view.y = down.vy + dy; clampView(); apply(); } }
    });
    var up = function (e) {
      var tap = down && !down.moved && ptr.size === 1;
      ptr.delete(e.pointerId); stage.classList.remove('drag'); if (ptr.size < 2) pinch = null;
      if (tap) onTap(e.clientX, e.clientY);
      if (!ptr.size) down = null;
    };
    stage.addEventListener('pointerup', up);
    stage.addEventListener('pointercancel', function (e) { ptr.delete(e.pointerId); down = null; pinch = null; stage.classList.remove('drag'); });
    st.onResize = function () { if (st) { var k0 = st.view.k; if (!st.fitted || k0 <= (st.fitK || 0) * 1.01) fit(); else clampView(), apply(); } };
    window.addEventListener('resize', st.onResize);
  }
  function onTap(x, y) {
    var stack = document.elementsFromPoint(x, y), uEl = null, hEl = null;
    for (var i = 0; i < stack.length; i++) { var n = stack[i]; if (!uEl && n.closest && n.closest('[data-unit]')) uEl = n.closest('[data-unit]'); if (!hEl && n.getAttribute && n.getAttribute('data-hex')) hEl = n; }
    var uid = uEl ? uEl.getAttribute('data-unit') : null, k = hEl ? hEl.getAttribute('data-hex') : null;
    if (st.opts.onTap) st.opts.onTap(k, uid);
  }
  return { mount: mount, unmount: unmount, mounted: mounted, update: update, fit: fit, zoomAt: function (f) { if (st) zoomAt(f); }, centerOn: centerOn, pos: function (k) { return st ? pos(k) : null; }, R: R };
})();
