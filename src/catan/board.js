/* ===== Catan: il tabellone interattivo =====
   Sotto l'isola dipinta (CTPainter), sopra un livello SVG con porti, numeri, strade, colonie, città e ladro.
   Quando devi scegliere un posto (colonia, strada, città, ladro) i posti validi lampeggiano: tocchi, poi confermi.
   Si trascina con un dito e si ingrandisce con due, come la mappa di Binari d'Italia. */
var Board = (function () {
  var D = CTData, A = CTArt, NS = 'http://www.w3.org/2000/svg', V = D.verts, EDG = D.edges, HX = D.hexes;
  var reduce = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;
  var st = null, painted = null, paintedSig = null;
  function el(tag, attrs, html) { var e = document.createElementNS(NS, tag); for (var k in attrs) e.setAttribute(k, attrs[k]); if (html != null) e.innerHTML = html; return e; }
  function f1(n) { return (+n).toFixed(1); }

  /* ---------- montaggio ---------- */
  function mount(root, g, opts) {
    var sig = JSON.stringify(g.hex);
    if (!painted || paintedSig !== sig) { painted = document.createElement('canvas'); paintedSig = sig; CTPainter.paint(painted, g.hex, Math.min(2.2, Math.max(1.4, (window.devicePixelRatio || 1) * 1.1))); }
    root.innerHTML = '<div class="bd-stage" id="bd-stage"><div class="bd-world" id="bd-world"></div></div>';
    var world = root.querySelector('#bd-world');
    painted.style.width = D.W + 'px'; painted.style.height = D.H + 'px';
    world.appendChild(painted); world.style.width = D.W + 'px'; world.style.height = D.H + 'px';
    var svg = el('svg', { viewBox: '0 0 ' + D.W + ' ' + D.H, width: D.W, height: D.H, class: 'bd-svg' });
    svg.innerHTML = A.DEFS; world.appendChild(svg);
    st = { root: root, stage: root.querySelector('#bd-stage'), world: world, svg: svg, view: { x: 0, y: 0, k: 1 }, opts: opts, sig: sig, fxN: -1, roadSig: null, bldSig: null };
    ['hot', 'harbors', 'tokens', 'roads', 'blds', 'robber', 'spots', 'fx'].forEach(function (n) { var gg = el('g', { class: 'bd-' + n }); svg.appendChild(gg); st[n] = gg; });
    // porti (il tipo cambia a ogni partita, il posto no)
    g.harbors.forEach(function (h, i) { var p = D.harborPos[i]; st.harbors.appendChild(el('g', { class: 'bd-harbor', transform: 'translate(' + f1(p.x) + ' ' + f1(p.y) + ')' }, A.harbor(h.k))); });
    // numeri
    HX.forEach(function (h, hi) { var T = g.hex[hi]; if (!T.n) return; st.tokens.appendChild(el('g', { class: 'bd-token', 'data-hex': hi, transform: 'translate(' + f1(h.x) + ' ' + f1(h.y + 4) + ')' }, A.token(T.n))); });
    st.robberG = el('g', { class: 'bd-rob' }, '<g class="bd-rob-in">' + A.robberShape() + '</g>'); st.robber.appendChild(st.robberG);
    bindInput(); fit();
    return st;
  }
  function unmount() { if (st) { window.removeEventListener('resize', st.onResize); st = null; } }
  function mounted(g) { return !!st && document.body.contains(st.root) && !!st.root.querySelector('#bd-stage') && (!g || st.sig === JSON.stringify(g.hex)); }

  /* ---------- aggiornamento ---------- */
  function robberPos(g) { var h = HX[g.robber], hasTok = !!g.hex[g.robber].n; return [h.x + (hasTok ? 22 : 0), h.y + (hasTok ? -14 : 2)]; }
  function update(g, opts) {
    if (!st) return; opts = opts || {}; st.opts.pickCb = opts.onPick; st.pick = opts.pick || null;
    var fresh = {}, newFx = st.fxN !== -1 && st.fxN !== g.fxN;
    if (newFx) (g.fx || []).forEach(function (e) { if (e.k === 'build') fresh[(e.what === 'road' ? 'e' : 'v') + (e.what === 'road' ? e.e : e.v)] = 1; });
    // strade
    var rs = JSON.stringify(g.eown);
    if (rs !== st.roadSig) {
      st.roadSig = rs; st.roads.innerHTML = '';
      Object.keys(g.eown).forEach(function (e) {
        var ed = EDG[e], a = V[ed.a], b = V[ed.b], p = g.eown[e], k = D.PCOL[g.players[p].col], ang = Math.atan2(b.y - a.y, b.x - a.x) * 180 / Math.PI;
        var anim = fresh['e' + e] && !reduce;
        st.roads.appendChild(el('g', { transform: 'translate(' + f1(ed.x) + ' ' + f1(ed.y) + ') rotate(' + f1(ang) + ')' },
          '<g class="' + (anim ? 'bd-drop' : '') + '"><rect x="-22" y="-5" width="44" height="10" rx="2.6" fill="' + k.c + '" stroke="' + k.d + '" stroke-width="2" filter="url(#ct-shadow)"/><rect x="-19" y="-3.4" width="38" height="2.2" rx="1" fill="' + k.l + '" opacity=".6"/></g>'));
      });
    }
    // colonie e città
    var bs = JSON.stringify(g.vown);
    if (bs !== st.bldSig) {
      st.bldSig = bs; st.blds.innerHTML = '';
      Object.keys(g.vown).forEach(function (v) {
        var o = g.vown[v], P = g.players[o.p], anim = fresh['v' + v] && !reduce;
        st.blds.appendChild(el('g', { class: 'bd-bld', 'data-v': v, transform: 'translate(' + f1(V[v].x) + ' ' + f1(V[v].y + 2) + ')' },
          '<g class="' + (anim ? 'bd-drop' : '') + '"><g filter="url(#ct-shadow)" transform="scale(' + (o.city ? 1.25 : 1.3) + ')">' + (o.city ? A.cityShape(P.col) : A.settleShape(P.col)) + '</g></g>'));
      });
    }
    // ladro
    var rp = robberPos(g); st.robberG.style.transform = 'translate(' + f1(rp[0]) + 'px,' + f1(rp[1]) + 'px)';
    var hotL = opts.hot || []; Array.prototype.forEach.call(st.tokens.children, function (n) { var hi = +n.getAttribute('data-hex'); n.classList.toggle('robbed', hi === g.robber); n.classList.toggle('hot', hotL.indexOf(hi) >= 0); });
    // tessere evidenziate (numero appena uscito) e posti da scegliere
    var hs = (opts.hot || []).join(',') + ':' + g.turnN; if (hs !== st.hotSig) { st.hotSig = hs; st.hot.innerHTML = ''; } else opts = Object.assign({}, opts, { hot: [] });
    (opts.hot || []).forEach(function (hi) { var h = HX[hi]; st.hot.appendChild(el('path', { d: hexD(h.x, h.y, D.S - 5), class: 'bd-hothex' })); });
    st.spots.innerHTML = '';
    var pk = opts.pick;
    if (pk) {
      pk.list.forEach(function (id) {
        var on = pk.sel === id;
        if (pk.k === 'road') { var ed = EDG[id], a = V[ed.a], b = V[ed.b]; st.spots.appendChild(el('line', { x1: f1(a.x + (b.x - a.x) * .24), y1: f1(a.y + (b.y - a.y) * .24), x2: f1(a.x + (b.x - a.x) * .76), y2: f1(a.y + (b.y - a.y) * .76), class: 'bd-spot-e' + (on ? ' on' : ''), 'data-id': id })); }
        else if (pk.k === 'robber') { var h = HX[id]; st.spots.appendChild(el('path', { d: hexD(h.x, h.y, D.S - 5), class: 'bd-spot-h' + (on ? ' on' : ''), 'data-id': id })); }
        else { var v = V[id]; st.spots.appendChild(el('circle', { cx: f1(v.x), cy: f1(v.y), r: on ? 11 : 9, class: 'bd-spot-v' + (pk.k === 'city' ? ' city' : '') + (on ? ' on' : ''), 'data-id': id })); }
      });
      if (pk.sel != null && pk.k !== 'robber') {   // anteprima del pezzo
        var me = pk.col;
        if (pk.k === 'road') { var e2 = EDG[pk.sel], a2 = V[e2.a], b2 = V[e2.b], ang2 = Math.atan2(b2.y - a2.y, b2.x - a2.x) * 180 / Math.PI; st.spots.appendChild(el('g', { class: 'bd-ghost', transform: 'translate(' + f1(e2.x) + ' ' + f1(e2.y) + ') rotate(' + f1(ang2) + ')' }, '<rect x="-22" y="-5" width="44" height="10" rx="2.6" fill="' + D.PCOL[me].c + '" stroke="' + D.PCOL[me].d + '" stroke-width="2"/>')); }
        else st.spots.appendChild(el('g', { class: 'bd-ghost', transform: 'translate(' + f1(V[pk.sel].x) + ' ' + f1(V[pk.sel].y + 2) + ') scale(1.3)' }, pk.k === 'city' ? A.cityShape(me) : A.settleShape(me)));
      }
      if (pk.sel != null && pk.k === 'robber') { var hh = HX[pk.sel]; st.spots.appendChild(el('g', { class: 'bd-ghost', transform: 'translate(' + f1(hh.x + (g.hex[pk.sel].n ? 22 : 0)) + ' ' + f1(hh.y - (g.hex[pk.sel].n ? 14 : -2)) + ')' }, A.robberShape())); }
    }
    // animazioni delle mosse appena fatte
    if (st.fxN !== g.fxN) {
      var first = st.fxN === -1; st.fxN = g.fxN;
      if (!first && !reduce) (g.fx || []).forEach(function (e) {
        if (e.k === 'prod') {
          Object.keys(e.gains).forEach(function (p) {
            HX.forEach(function (h, hi) {
              if (g.hex[hi].n !== e.n || hi === g.robber) return;
              h.v.forEach(function (v, j) {
                var o = g.vown[v]; if (!o || o.p !== +p) return;
                var r = D.TERR[g.hex[hi].t].r, x0 = h.x, y0 = h.y, x1 = V[v].x, y1 = V[v].y - 16;
                var ic = el('g', { class: 'bd-fly', style: '--x0:' + f1(x0) + 'px;--y0:' + f1(y0) + 'px;--x1:' + f1(x1) + 'px;--y1:' + f1(y1) + 'px;animation-delay:' + (j * 60) + 'ms' }, '<circle r="11" fill="' + A.RC[r].c + '" stroke="#fff" stroke-width="2"/><g transform="scale(.2)">' + svgInner(r) + '</g>' + (o.city ? '<text x="9" y="-7" class="bd-x2">×2</text>' : ''));
                st.fx.appendChild(ic); setTimeout(function () { ic.remove(); }, 2200);
              });
            });
          });
        }
        if (e.k === 'build') {
          var x = e.what === 'road' ? EDG[e.e].x : V[e.v].x, y = e.what === 'road' ? EDG[e.e].y : V[e.v].y;
          var ring = el('circle', { cx: f1(x), cy: f1(y), r: 8, class: 'bd-ring', stroke: D.PCOL[g.players[e.p].col].l }); st.fx.appendChild(ring); setTimeout(function () { ring.remove(); }, 1300);
          if (e.what !== 'road') { var t = el('text', { x: f1(x), y: f1(y - 20), class: 'bd-float', 'text-anchor': 'middle' }); t.textContent = '+1'; st.fx.appendChild(t); setTimeout(function () { t.remove(); }, 2000); }
          if (opts.follow) centerOnPoint(x, y, null, true);
        }
        if (e.k === 'robber') { var h2 = HX[e.h], puff = el('circle', { cx: f1(h2.x), cy: f1(h2.y), r: 20, class: 'bd-puff' }); st.fx.appendChild(puff); setTimeout(function () { puff.remove(); }, 1200); if (opts.follow) centerOnPoint(h2.x, h2.y, null, true); }
      });
    }
  }
  function svgInner(r) { var s = A.resIcon(r, 10); return s.replace(/^<svg[^>]*>/, '').replace(/<\/svg>$/, ''); }
  function hexD(x, y, r) { var d = ''; for (var k = 0; k < 6; k++) { var a = (60 * k - 90) * Math.PI / 180; d += (k ? 'L' : 'M') + f1(x + r * Math.cos(a)) + ' ' + f1(y + r * Math.sin(a)); } return d + 'Z'; }

  /* ---------- vista ---------- */
  function apply(smooth) { st.world.style.transition = smooth ? 'transform .45s cubic-bezier(.2,.8,.2,1)' : ''; st.world.style.transform = 'translate(' + st.view.x + 'px,' + st.view.y + 'px) scale(' + st.view.k + ')'; }
  function box() { var r = st.stage.getBoundingClientRect(); return { w: r.width, h: r.height, l: r.left, t: r.top }; }
  // l'isola occupa la parte centrale del tabellone: si inquadra quella (il mare ai bordi può uscire)
  var IX0 = D.CX - D.S * 4.95, IX1 = D.CX + D.S * 4.95, IY0 = D.CY - D.S * 5.05, IY1 = D.CY + D.S * 5.05;
  function fit() {
    if (!st) return; var b = box(); if (!b.w) return;
    st.fitK = Math.min(b.w / (IX1 - IX0), b.h / (IY1 - IY0));
    st.view.k = st.fitK; st.view.x = b.w / 2 - D.CX * st.view.k; st.view.y = b.h / 2 - D.CY * st.view.k; apply(); st.fitted = true;
  }
  function clampView() {
    var b = box(), k = st.view.k, m = 30;
    var x0 = IX0 * k, x1 = IX1 * k, y0 = IY0 * k, y1 = IY1 * k;
    st.view.x = x1 - x0 < b.w ? b.w / 2 - D.CX * k : Math.min(m - x0, Math.max(b.w - x1 - m, st.view.x));
    st.view.y = y1 - y0 < b.h ? b.h / 2 - D.CY * k : Math.min(m - y0, Math.max(b.h - y1 - m, st.view.y));
  }
  var KMAX = 3;
  function zoomAt(f, px, py) {
    var b = box(); px = px == null ? b.w / 2 : px - b.l; py = py == null ? b.h / 2 : py - b.t;
    var k = Math.max((st.fitK || .3) * .9, Math.min(KMAX, st.view.k * f)), r = k / st.view.k;
    st.view.x = px - (px - st.view.x) * r; st.view.y = py - (py - st.view.y) * r; st.view.k = k; clampView(); apply();
  }
  function centerOnPoint(x, y, zoom, smooth) {
    if (!st) return; var b = box();
    if (zoom) st.view.k = Math.max(st.fitK || .3, Math.min(KMAX, zoom));
    if (!zoom) { var sx = st.view.x + x * st.view.k, sy = st.view.y + y * st.view.k; if (sx > b.w * .15 && sx < b.w * .85 && sy > b.h * .15 && sy < b.h * .85) return; }
    st.view.x = b.w / 2 - x * st.view.k; st.view.y = b.h / 2 - y * st.view.k; clampView(); apply(smooth);
  }
  function bindInput() {
    var stage = st.stage, ptr = new Map(), down = null, pinch = null;
    stage.addEventListener('wheel', function (e) { e.preventDefault(); zoomAt(Math.exp(-e.deltaY * .0015), e.clientX, e.clientY); }, { passive: false });
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
        var k = Math.max((st.fitK || .3) * .9, Math.min(KMAX, pinch.k * d / pinch.d)), r = k / pinch.k;
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
  // tocco: se stai scegliendo un posto vale il posto valido più vicino; altrimenti la tessera sotto il dito
  function onTap(cx, cy) {
    var b = box(), x = (cx - b.l - st.view.x) / st.view.k, y = (cy - b.t - st.view.y) / st.view.k, tol = Math.max(16, 26 / st.view.k);
    var pk = st.pick;
    if (pk && pk.list.length) {
      var best = null, bd = 1e9;
      pk.list.forEach(function (id) {
        var px, py; if (pk.k === 'road') { px = EDG[id].x; py = EDG[id].y; } else if (pk.k === 'robber') { px = HX[id].x; py = HX[id].y; } else { px = V[id].x; py = V[id].y; }
        var d = Math.hypot(px - x, py - y); if (d < bd) { bd = d; best = id; }
      });
      if (best != null && bd < (pk.k === 'robber' ? D.S * .9 : tol)) { if (st.opts.pickCb) st.opts.pickCb(best); return; }
    }
    var hb = null, hd = 1e9; HX.forEach(function (h, hi) { var d = Math.hypot(h.x - x, h.y - y); if (d < hd) { hd = d; hb = hi; } });
    if (hb != null && hd < D.S * .92) { if (st.opts.onHex) st.opts.onHex(hb); return; }
    if (st.opts.onEmpty) st.opts.onEmpty();
  }
  return { mount: mount, unmount: unmount, mounted: mounted, update: update, fit: fit, zoomAt: function (f) { if (st) zoomAt(f); },
    centerOn: function (x, y, zoom) { centerOnPoint(x, y, zoom, true); }, vertexXY: function (v) { return [V[v].x, V[v].y]; } };
})();
