/* ===== Unlock!: illustrazioni delle carte (SVG disegnati a mano nel codice, con animazioni) =====
   Ogni disegno è 300×220. I numeri visibili sono targhette tonde; quelli nascosti sono piccoli e mimetizzati.
   UArt.art(scen, id) → { svg, spots: [{ id, x, y, h }] }; UArt.card(...) → HTML della carta; UArt.defs() → sfumature comuni. */
var UArt = (function () {
  var K = 0, SP = [];
  function uid(n) { return 'u' + n + (++K); }
  function f(n) { return Math.round(n * 10) / 10; }
  function rnd(seed) { var s = seed % 2147483647; if (s <= 0) s += 2147483646; return function () { s = s * 16807 % 2147483647; return (s - 1) / 2147483646; }; }
  function G(tr, inner, o) { return '<g' + (tr ? ' transform="' + tr + '"' : '') + (o ? ' ' + o : '') + '>' + inner + '</g>'; }
  function R(x, y, w, h, fill, o) { return '<rect x="' + f(x) + '" y="' + f(y) + '" width="' + f(w) + '" height="' + f(h) + '" fill="' + fill + '"' + (o ? ' ' + o : '') + '/>'; }
  function C(x, y, r, fill, o) { return '<circle cx="' + f(x) + '" cy="' + f(y) + '" r="' + f(r) + '" fill="' + fill + '"' + (o ? ' ' + o : '') + '/>'; }
  function E(x, y, rx, ry, fill, o) { return '<ellipse cx="' + f(x) + '" cy="' + f(y) + '" rx="' + f(rx) + '" ry="' + f(ry) + '" fill="' + fill + '"' + (o ? ' ' + o : '') + '/>'; }
  function P(d, fill, o) { return '<path d="' + d + '" fill="' + (fill || 'none') + '"' + (o ? ' ' + o : '') + '/>'; }
  function L(x1, y1, x2, y2, st, w, o) { return '<line x1="' + f(x1) + '" y1="' + f(y1) + '" x2="' + f(x2) + '" y2="' + f(y2) + '" stroke="' + st + '" stroke-width="' + (w || 1) + '"' + (o ? ' ' + o : '') + '/>'; }
  function T(x, y, s, o) { return '<text x="' + f(x) + '" y="' + f(y) + '" ' + (o || '') + '>' + s + '</text>'; }
  var MONO = 'font-family="Share Tech Mono,monospace"', HAND = 'font-family="Caveat,cursive"', SANS = 'font-family="Nunito,system-ui,sans-serif"';
  function anim(cls, d, dur) { return 'class="' + cls + '" style="animation-delay:' + f(d || 0) + 's' + (dur ? ';animation-duration:' + f(dur) + 's' : '') + '"'; }

  /* ---------- numeri: targhette visibili e cifre nascoste ---------- */
  function tag(id, x, y) {
    SP.push({ id: id, x: x, y: y, h: false });
    var letter = /^[A-Z]$/.test(id);
    var shape = letter ? P('M' + (x - 12) + ' ' + y + 'l6 -10.5h12l6 10.5l-6 10.5h-12z', '#e9edf2', 'stroke="#14181c" stroke-width="2.2"') : C(x, y, 11, '#fff8ea', 'stroke="#14181c" stroke-width="2.2"');
    return G('', C(x, y, 14.5, 'rgba(255,255,255,.18)', anim('ua-ring', (x + y) % 7 / 3)) + C(x + 1, y + 2, 11.5, 'rgba(0,0,0,.45)') + shape +
      T(x, y + 4.6, id, 'text-anchor="middle" font-family="Bungee,Nunito,sans-serif" font-size="' + (id.length > 1 ? 12 : 13.5) + '" fill="#14181c"'), 'class="utag"');
  }
  function hid(id, x, y, col, size, rot, op) {
    SP.push({ id: id, x: x, y: y, h: true });
    return T(x, y + (size || 9) * .35, id, 'text-anchor="middle" font-family="Bungee,Nunito,sans-serif" font-size="' + (size || 9) + '" fill="' + (col || '#c9d3d9') + '" opacity="' + (op || .55) + '"' + (rot ? ' transform="rotate(' + rot + ' ' + x + ' ' + y + ')"' : ''));
  }
  function star(x, y, s, digit, o) {
    var d = '', i, a, r;
    for (i = 0; i < 10; i++) { a = -Math.PI / 2 + i * Math.PI / 5; r = i % 2 ? 4.2 : 10; d += (i ? 'L' : 'M') + f(Math.cos(a) * r) + ' ' + f(Math.sin(a) * r); }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P(d + 'Z', '#f08a3c', 'stroke="#8a3d12" stroke-width="1" stroke-linejoin="round"') + P(d + 'Z', 'none', 'stroke="rgba(255,220,170,.6)" stroke-width=".6" transform="scale(.8)"') +
      (digit != null ? T(0, 3.4, digit, 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="9" fill="#fff6e8" stroke="#6b2b08" stroke-width=".5"') : ''), o);
  }

  /* ---------- sfumature comuni (una volta sola nella pagina) ---------- */
  function lg(id, stops, x2, y2, o) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="' + (x2 == null ? 0 : x2) + '" y2="' + (y2 == null ? 1 : y2) + '"' + (o || '') + '>' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</linearGradient>'; }
  function rg(id, stops, cx, cy, r) { return '<radialGradient id="' + id + '" cx="' + (cx == null ? .5 : cx) + '" cy="' + (cy == null ? .5 : cy) + '" r="' + (r || .5) + '">' + stops.map(function (s) { return '<stop offset="' + s[0] + '" stop-color="' + s[1] + '"' + (s[2] != null ? ' stop-opacity="' + s[2] + '"' : '') + '/>'; }).join('') + '</radialGradient>'; }
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      lg('u-steel', [[0, '#3c4c57'], [.55, '#26323b'], [1, '#141b20']]) + lg('u-panel', [[0, '#5a6a75'], [.5, '#3f4d57'], [1, '#2a353d']]) + lg('u-panelL', [[0, '#7d8d97'], [1, '#4d5c66']]) +
      lg('u-pipeH', [[0, '#606d75'], [.28, '#dfe7eb'], [.55, '#7c8a92'], [1, '#262e33']]) + lg('u-pipeV', [[0, '#606d75'], [.28, '#dfe7eb'], [.55, '#7c8a92'], [1, '#262e33']], 1, 0) +
      lg('u-copH', [[0, '#7a3a1b'], [.3, '#f3b88f'], [.6, '#b0582c'], [1, '#43200c']]) + lg('u-copV', [[0, '#7a3a1b'], [.3, '#f3b88f'], [.6, '#b0582c'], [1, '#43200c']], 1, 0) +
      lg('u-brass', [[0, '#fbe6a0'], [.35, '#d7a53a'], [.7, '#8d6216'], [1, '#e9c36a']], 1, 1) + lg('u-gold', [[0, '#fff1b8'], [.5, '#e5b847'], [1, '#a5741c']], 1, 1) +
      rg('u-sea', [[0, '#2a90ad'], [.55, '#0d4a66'], [1, '#03172a']], .5, .3, .8) + rg('u-seaD', [[0, '#0f3f57'], [1, '#020b16']], .5, .2, .9) +
      lg('u-deep', [[0, '#0b5677'], [.45, '#05304a'], [1, '#010812']]) +
      rg('u-glowO', [[0, '#ffb347', .95], [.4, '#ff7a1a', .35], [1, '#ff6a00', 0]]) + rg('u-glowB', [[0, '#9fe8ff', .95], [.4, '#3fb4ff', .35], [1, '#1a8cff', 0]]) +
      rg('u-glowG', [[0, '#b6ffcf', .95], [.4, '#38e07a', .35], [1, '#10b050', 0]]) + rg('u-glowR', [[0, '#ff8a80', .95], [.4, '#ff2a1a', .35], [1, '#ff0000', 0]]) +
      rg('u-glowW', [[0, '#fffbe6', .95], [.4, '#ffe9a8', .35], [1, '#ffd36a', 0]]) + rg('u-vig', [[.55, '#000', 0], [1, '#000', .7]], .5, .5, .75) +
      lg('u-screen', [[0, '#0e4a35'], [1, '#04180f']]) + lg('u-wood', [[0, '#8c5b33'], [.5, '#6a4122'], [1, '#432812']]) + lg('u-woodH', [[0, '#9b6a3e'], [.5, '#744825'], [1, '#4a2c15']], 1, 0) +
      lg('u-woodL', [[0, '#c48a52'], [1, '#8a5a30']]) + lg('u-paper', [[0, '#fbf3df'], [1, '#e8d7b1']]) + lg('u-glass', [[0, '#fff', .45], [.35, '#fff', 0], [1, '#fff', .08]], 1, 1) +
      lg('u-water', [[0, '#2f8fb0', .55], [1, '#0a2c40', .9]]) + rg('u-moon', [[0, '#fffbe8'], [.7, '#f1e3b0'], [1, '#d9c27e']]) +
      lg('u-red', [[0, '#ef5a4b'], [1, '#9c1f17']]) + lg('u-navy', [[0, '#2f4a74'], [1, '#15233c']]) + rg('u-skin', [[0, '#f6d2b0'], [1, '#cf9670']], .4, .35, .7) +
      lg('u-floor', [[0, '#2c373e'], [1, '#0f1418']]) + lg('u-night', [[0, '#16213f'], [1, '#2b3560']]) + lg('u-atticWall', [[0, '#3b2a1e'], [1, '#1d140d']]) +
      lg('u-black', [[0, '#3a3f45'], [.5, '#1b1e22'], [1, '#0b0c0e']], 1, 1) + lg('u-sky', [[0, '#f7d58a'], [.4, '#86c7df'], [1, '#2b7fa6']]) +
      '<filter id="u-blur" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter><filter id="u-blur1"><feGaussianBlur stdDeviation="1.1"/></filter>' +
      '<filter id="u-shadow" x="-20%" y="-20%" width="140%" height="150%"><feDropShadow dx="0" dy="3" stdDeviation="2.5" flood-color="#000" flood-opacity=".55"/></filter>' +
      '</defs></svg>';
  }

  /* ---------- kit del sottomarino ---------- */
  function rivets(x1, y1, x2, y2, step) {
    var o = '', n = Math.max(1, Math.round(Math.hypot(x2 - x1, y2 - y1) / step)), i;
    for (i = 0; i <= n; i++) { var x = x1 + (x2 - x1) * i / n, y = y1 + (y2 - y1) * i / n; o += C(x + .5, y + .6, 1.7, '#0b1014') + C(x, y, 1.5, '#7f909a') + C(x - .4, y - .5, .55, '#cbd6dc'); }
    return o;
  }
  function wall(seed) {
    var o = R(0, 0, 300, 220, 'url(#u-steel)');
    [0, 72, 150, 228].forEach(function (x) { o += R(x + 70, 0, 2, 220, '#0c1115', 'opacity=".7"') + R(x + 72, 0, 1, 220, '#6a7b86', 'opacity=".35"') + rivets(x + 66, 8, x + 66, 212, 16) + rivets(x + 77, 8, x + 77, 212, 16); });
    o += R(0, 96, 300, 2, '#0c1115', 'opacity=".6"') + R(0, 98, 300, 1, '#6a7b86', 'opacity=".3"');
    var r = rnd(seed || 7);
    for (var i = 0; i < 14; i++) o += R(r() * 300, r() * 220, 6 + r() * 30, 1, '#000', 'opacity="' + f(.15 + r() * .2) + '"'); // graffi
    return o;
  }
  function floor(y) {
    var o = R(0, y, 300, 220 - y, 'url(#u-floor)');
    for (var x = -20; x < 320; x += 12) o += L(x, y, x + 18, 220, '#000', 1, 'opacity=".35"');
    return o + R(0, y, 300, 2, '#56656f', 'opacity=".6"');
  }
  function vig() { return R(0, 0, 300, 220, 'url(#u-vig)'); }
  function pipeH(x, y, w, r, cop) { return R(x, y - r, w, 2 * r, 'url(#u-' + (cop ? 'cop' : 'pipe') + 'H)') + R(x - 1, y - r - 1.5, 4, 2 * r + 3, '#2b3338') + R(x + w - 3, y - r - 1.5, 4, 2 * r + 3, '#2b3338'); }
  function pipeV(x, y, h, r, cop) { return R(x - r, y, 2 * r, h, 'url(#u-' + (cop ? 'cop' : 'pipe') + 'V)') + R(x - r - 1.5, y - 1, 2 * r + 3, 4, '#2b3338') + R(x - r - 1.5, y + h - 3, 2 * r + 3, 4, '#2b3338'); }
  function lamp(x, y, col) {
    col = col || 'O';
    return C(x, y + 6, 60, 'url(#u-glow' + col + ')', anim('ua-flick', (x % 5) / 3)) + R(x - 9, y - 3, 18, 5, '#22292e') +
      P('M' + (x - 8) + ' ' + (y + 2) + 'a8 8 0 0 0 16 0z', col === 'O' ? '#ffb24a' : col === 'R' ? '#ff4b3a' : '#ffe9a8', anim('ua-flick', (x % 5) / 3)) +
      P('M' + (x - 8) + ' ' + (y + 2) + 'a8 8 0 0 0 16 0', 'none', 'stroke="#22292e" stroke-width="1.4"') + L(x, y + 2, x, y + 10, '#22292e', 1.2) + L(x - 6, y + 6, x + 6, y + 6, '#22292e', 1);
  }
  function gauge(cx, cy, r, v, red) {
    var o = C(cx, cy, r + 2.6, 'url(#u-brass)') + C(cx, cy, r, '#f3eee0'), i, a;
    for (i = 0; i <= 8; i++) { a = (-225 + i * 33.75) * Math.PI / 180; o += L(cx + Math.cos(a) * r * .72, cy + Math.sin(a) * r * .72, cx + Math.cos(a) * r * .9, cy + Math.sin(a) * r * .9, '#2a2a2a', .7); }
    var a1 = 30 * Math.PI / 180, a0 = -10 * Math.PI / 180;
    o += P('M' + f(cx + Math.cos(a0) * r * .82) + ' ' + f(cy + Math.sin(a0) * r * .82) + ' A' + f(r * .82) + ' ' + f(r * .82) + ' 0 0 1 ' + f(cx + Math.cos(a1) * r * .82) + ' ' + f(cy + Math.sin(a1) * r * .82), 'none', 'stroke="#c0392b" stroke-width="' + f(r * .14) + '"');
    a = (-225 + (v == null ? .5 : v) * 270) * Math.PI / 180;
    o += G('', L(cx, cy, cx + Math.cos(a) * r * .8, cy + Math.sin(a) * r * .8, red || '#b3261e', Math.max(1, r * .1)), 'class="ua-needle" style="transform-origin:' + f(cx) + 'px ' + f(cy) + 'px"') + C(cx, cy, r * .14, '#222');
    return o + P('M' + f(cx - r * .7) + ' ' + f(cy - r * .2) + 'a' + f(r * .75) + ' ' + f(r * .75) + ' 0 0 1 ' + f(r * .9) + ' ' + f(-r * .5), 'none', 'stroke="#fff" stroke-opacity=".5" stroke-width="' + f(r * .12) + '" stroke-linecap="round"');
  }
  function wheel(cx, cy, r, col) {
    col = col || '#c23b2c';
    var o = C(cx + 1.5, cy + 2, r, 'none', 'stroke="#000" stroke-opacity=".45" stroke-width="' + f(r * .22) + '"') + C(cx, cy, r, 'none', 'stroke="' + col + '" stroke-width="' + f(r * .2) + '"') + C(cx, cy, r, 'none', 'stroke="#fff" stroke-opacity=".25" stroke-width="' + f(r * .06) + '" stroke-dasharray="' + f(r * 1.4) + ' ' + f(r * 5) + '"'), i, a;
    for (i = 0; i < 5; i++) { a = i * Math.PI * 2 / 5 - Math.PI / 2; o += L(cx, cy, cx + Math.cos(a) * r, cy + Math.sin(a) * r, col, r * .13) + C(cx + Math.cos(a) * r * 1.08, cy + Math.sin(a) * r * 1.08, r * .14, col); }
    return o + C(cx, cy, r * .26, '#2a2f33') + C(cx, cy, r * .14, 'url(#u-pipeH)');
  }
  function bubbles(x, y, w, n, seed, big) {
    var r = rnd(seed || 3), o = '';
    for (var i = 0; i < n; i++) { var bx = x + r() * w, by = y + r() * 30, br = (big ? 1.6 : 1) * (1 + r() * 2.4); o += G('', C(bx, by, br, 'rgba(255,255,255,.08)', 'stroke="rgba(210,245,255,.65)" stroke-width=".7"') + C(bx - br * .35, by - br * .35, br * .3, 'rgba(255,255,255,.7)'), anim('ua-bub', r() * 6, 4 + r() * 4)); }
    return o;
  }
  function fish(x, y, s, col, dir, d) {
    return G('translate(' + f(x) + ' ' + f(y) + ') scale(' + f(s * (dir || 1)) + ' ' + f(s) + ')',
      P('M-11 0L-18 -6.5L-15.5 0L-18 6.5Z', col, 'opacity=".85"') + P('M-12 0C-6 -7.5 5 -8 11 -1C11 0 11 0 11 1C5 8 -6 7.5 -12 0Z', col) + P('M-12 0C-6 -7.5 5 -8 11 -1', 'none', 'stroke="#fff" stroke-opacity=".35" stroke-width="1"') +
      P('M-3 -6L1 -10.5L4.5 -5.5Z', col, 'opacity=".75"') + P('M-6 3C-2 6 4 6 8 2', 'none', 'stroke="#000" stroke-opacity=".25" stroke-width="1.2"') + L(1, -5, 0, 5, '#000', .8, 'opacity=".25"') +
      C(6.3, -1.6, 2, '#fff') + C(6.8, -1.6, 1, '#111'), anim('ua-swim', d || 0, 3 + (d || 0) % 2));
  }
  function seaRays(x, y, w, h) { var o = ''; for (var i = 0; i < 4; i++) o += P('M' + (x + w * (.15 + i * .22)) + ' ' + y + 'l' + (12 + i * 4) + ' 0l' + (16 + i * 6) + ' ' + h + 'l-' + (34 + i * 6) + ' 0z', '#bfefff', 'opacity=".07" ' + anim('ua-ray', i * .8)); return o; }
  function porthole(cx, cy, r, inner) {
    var cp = uid('cp'), o = C(cx + 2, cy + 3, r + 10, 'rgba(0,0,0,.45)') + C(cx, cy, r + 9, 'url(#u-brass)') + C(cx, cy, r + 9, 'none', 'stroke="#5a3d0e" stroke-width="1"'), i, a;
    for (i = 0; i < 8; i++) { a = i * Math.PI / 4 + Math.PI / 8; o += C(cx + Math.cos(a) * (r + 4.6), cy + Math.sin(a) * (r + 4.6), 2.1, '#7a5418') + C(cx + Math.cos(a) * (r + 4.6) - .5, cy + Math.sin(a) * (r + 4.6) - .6, .8, '#ffe9a6'); }
    o += '<clipPath id="' + cp + '"><circle cx="' + cx + '" cy="' + cy + '" r="' + r + '"/></clipPath>' + G('', R(cx - r, cy - r, 2 * r, 2 * r, 'url(#u-sea)') + (inner || ''), 'clip-path="url(#' + cp + ')"');
    return o + C(cx, cy, r, 'none', 'stroke="rgba(0,0,0,.55)" stroke-width="3"') + P('M' + f(cx - r * .72) + ' ' + f(cy - r * .1) + 'a' + f(r * .75) + ' ' + f(r * .75) + ' 0 0 1 ' + f(r * .6) + ' ' + f(-r * .62), 'none', 'stroke="#fff" stroke-opacity=".45" stroke-width="' + f(r * .09) + '" stroke-linecap="round"');
  }
  function led(x, y, col, blink, d) { var c = { r: '#ff4236', g: '#3dff7a', y: '#ffd23d', b: '#4ab8ff' }[col] || col; return C(x, y, 4.5, c, 'opacity=".25" filter="url(#u-blur1)"' + (blink ? ' ' + anim('ua-blink', d) : '')) + C(x, y, 1.9, c, blink ? anim('ua-blink', d) : '') + C(x - .6, y - .6, .6, '#fff', 'opacity=".8"'); }
  function screw(x, y) { return C(x, y, 1.6, '#9aa7ae') + L(x - 1.1, y - 1.1, x + 1.1, y + 1.1, '#3a4248', .6); }
  function hatch(x, y, w, h, o) {
    o = o || {};
    var s = R(x - 5, y - 5, w + 10, h + 10, '#11171b', 'rx="16"') + R(x - 5, y - 5, w + 10, h + 10, 'none', 'rx="16" stroke="#56646d" stroke-width="1.2"');
    if (o.open) {
      s += R(x, y, w, h, '#05080a', 'rx="12"') + R(x + 4, y + 4, w - 8, h - 8, o.inside || 'url(#u-seaD)', 'rx="10"') + (o.glow ? C(x + w / 2, y + h * .55, w, 'url(#u-glow' + o.glow + ')', 'opacity=".7"') : '');
      if (o.slid) s += R(x - w * .82, y, w * .4, h, 'url(#u-panel)', 'rx="8" opacity=".95"');
      return s;
    }
    s += R(x, y, w, h, 'url(#u-panel)', 'rx="12" stroke="#0f1418" stroke-width="1.5"') + R(x + 4, y + 4, w - 8, h - 8, 'none', 'rx="9" stroke="#8a9aa4" stroke-opacity=".35"');
    s += rivets(x + 7, y + 8, x + w - 7, y + 8, 9) + rivets(x + 7, y + h - 8, x + w - 7, y + h - 8, 9);
    if (o.win !== false) s += C(x + w / 2, y + h * .24, Math.min(w, h) * .14 + 3, 'url(#u-brass)') + C(x + w / 2, y + h * .24, Math.min(w, h) * .14, 'url(#u-seaD)') + C(x + w / 2 - 2, y + h * .24 - 2, 2, '#fff', 'opacity=".4"');
    s += wheel(x + w / 2, y + h * .58, Math.min(w, h) * .2, o.wcol);
    if (o.reader) s += R(x + w - 2, y + h * .45, 10, 22, '#1c2226', 'rx="2" stroke="#4b5860"') + R(x + w, y + h * .45 + 4, 6, 9, '#2e3a42') + led(x + w + 3, y + h * .45 + 17, o.reader, true);
    return s;
  }
  function locker(x, y, w, h, fishes) {
    var o = R(x + 3, y + 4, w, h, 'rgba(0,0,0,.45)', 'rx="3"') + R(x, y, w, h, '#7b2d26', 'rx="3"') + R(x, y, w, h, 'url(#u-panel)', 'rx="3" opacity=".45"') + R(x + 3, y + 3, w - 6, h - 6, 'none', 'rx="2" stroke="#000" stroke-opacity=".35"');
    var sc = w / 60;
    for (var i = 0; i < 5; i++) o += R(x + w * .2, y + 8 + i * 4 * sc, w * .6, 1.6 * sc, '#2a0f0c', 'rx="1"');
    o += T(x + w / 2, y + 8 + 26 * sc, '✚', 'text-anchor="middle" font-size="' + f(9 * sc) + '" fill="#f4efe6" ' + SANS);
    var fs = (h - 14 - 30 * sc) / 4;
    if (fishes) fishes.forEach(function (c, k) { o += fish(x + w / 2 - 1, y + 14 + 30 * sc + fs * (k + .5), Math.min(.55 * sc, fs / 15), c, 1, k * .4); });
    o += R(x + w - 9, y + h * .5, 4, 16, '#c9d3d9', 'rx="2"') + G('', P('M' + (x + w - 15) + ' ' + (y + h * .5 + 22) + 'a5 5 0 0 1 10 0', 'none', 'stroke="#d7dde0" stroke-width="2"') + R(x + w - 17, y + h * .5 + 22, 14, 11, 'url(#u-brass)', 'rx="2"') + C(x + w - 10, y + h * .5 + 27, 1.4, '#3a2808'), '');
    return o;
  }
  function screenSonar(x, y, w, h) {
    var cx = x + w / 2, cy = y + h / 2, r = Math.min(w, h) / 2 - 3;
    return R(x, y, w, h, 'url(#u-screen)', 'rx="3"') + C(cx, cy, r, 'none', 'stroke="#38e07a" stroke-opacity=".5"') + C(cx, cy, r * .6, 'none', 'stroke="#38e07a" stroke-opacity=".35"') + L(cx - r, cy, cx + r, cy, '#38e07a', .5, 'opacity=".35"') + L(cx, cy - r, cx, cy + r, '#38e07a', .5, 'opacity=".35"') +
      G('', P('M' + cx + ' ' + cy + 'L' + f(cx + r) + ' ' + cy + 'A' + f(r) + ' ' + f(r) + ' 0 0 0 ' + f(cx + r * .7) + ' ' + f(cy - r * .7) + 'Z', '#38e07a', 'opacity=".35"'), 'class="ua-spin" style="transform-origin:' + f(cx) + 'px ' + f(cy) + 'px"') +
      C(cx + r * .4, cy - r * .3, 1.4, '#b6ffcf', anim('ua-blink', .4)) + C(cx - r * .5, cy + r * .2, 1.2, '#b6ffcf', anim('ua-blink', 1.3));
  }
  function console_(x, y, w, h) {
    var o = P('M' + x + ' ' + (y + h) + 'L' + (x + 8) + ' ' + y + 'L' + (x + w - 8) + ' ' + y + 'L' + (x + w) + ' ' + (y + h) + 'Z', '#2a343b', 'stroke="#0e1316"') + P('M' + (x + 8) + ' ' + y + 'L' + (x + w - 8) + ' ' + y + 'L' + (x + w - 4) + ' ' + (y + 12) + 'L' + (x + 4) + ' ' + (y + 12) + 'Z', '#3f4d57');
    for (var i = 0; i < 6; i++) o += led(x + 14 + i * ((w - 28) / 5), y + 6, ['g', 'y', 'r', 'g', 'b', 'g'][i], i % 2 === 0, i * .3);
    return o;
  }
  function radio(x, y) {
    var o = R(x + 2, y + 3, 62, 40, 'rgba(0,0,0,.4)', 'rx="4"') + R(x, y, 62, 40, '#4a4f3b', 'rx="4" stroke="#1b1d14"') + R(x + 3, y + 3, 56, 34, 'none', 'rx="3" stroke="#8b8f6a" stroke-opacity=".5"');
    o += R(x + 6, y + 7, 30, 12, '#1d2a1b', 'rx="2"') + G('', P('M' + (x + 8) + ' ' + (y + 13) + 'l3 -3l3 6l3 -8l3 9l3 -5l3 2l3 -2l3 1', 'none', 'stroke="#9dff9a" stroke-width=".9"'), anim('ua-blink', .2, 1.6));
    o += C(x + 46, y + 13, 7, '#22251a') + C(x + 46, y + 13, 5.5, 'url(#u-pipeH)') + L(x + 46, y + 13, x + 49, y + 9, '#222', 1.2);
    for (var i = 0; i < 4; i++) o += R(x + 7 + i * 7, y + 25, 5, 8, i === 1 ? '#c0392b' : '#d8d4c0', 'rx="1"');
    o += R(x + 38, y + 24, 18, 10, '#1d1f16', 'rx="2"') + L(x + 41, y + 27, x + 53, y + 27, '#666', .6) + L(x + 41, y + 30, x + 53, y + 30, '#666', .6);
    o += P('M' + (x + 62) + ' ' + (y + 30) + 'c10 0 12 10 6 16', 'none', 'stroke="#111" stroke-width="1.5"') + E(x + 69, y + 48, 4, 6, '#2b2b2b');
    return o;
  }
  function plaque(x, y, w, txt, txt2) { return R(x + 1, y + 1.5, w, 16, 'rgba(0,0,0,.5)', 'rx="2"') + R(x, y, w, 16, 'url(#u-brass)', 'rx="2"') + screw(x + 3.5, y + 8) + screw(x + w - 3.5, y + 8) + T(x + w / 2, y + 7.2, txt, 'text-anchor="middle" font-size="5.2" fill="#4a3208" ' + MONO) + T(x + w / 2, y + 13.5, txt2, 'text-anchor="middle" font-size="5.2" font-weight="700" fill="#4a3208" ' + MONO); }
  function subMap(x, y, w, h, big) {
    var o = R(x - 3, y - 3, w + 6, h + 6, '#3a2a18', 'rx="2"') + R(x, y, w, h, 'url(#u-paper)') + R(x, y, w, h, 'none', 'stroke="#8a6a3a" stroke-width=".6"');
    var mx = x + w * .08, mw = w * .84, my = y + h * .42, mh = h * .3;
    o += P('M' + f(mx) + ' ' + f(my + mh / 2) + 'Q' + f(mx) + ' ' + f(my) + ' ' + f(mx + mw * .18) + ' ' + f(my) + 'L' + f(mx + mw * .86) + ' ' + f(my) + 'Q' + f(mx + mw) + ' ' + f(my + mh * .3) + ' ' + f(mx + mw) + ' ' + f(my + mh / 2) + 'Q' + f(mx + mw) + ' ' + f(my + mh * .7) + ' ' + f(mx + mw * .86) + ' ' + f(my + mh) + 'L' + f(mx + mw * .18) + ' ' + f(my + mh) + 'Q' + f(mx) + ' ' + f(my + mh) + ' ' + f(mx) + ' ' + f(my + mh / 2) + 'Z', 'none', 'stroke="#2b4a6b" stroke-width="' + (big ? 1.4 : .8) + '"');
    o += R(mx + mw * .42, my - mh * .45, mw * .14, mh * .45, 'none', 'stroke="#2b4a6b" stroke-width="' + (big ? 1.2 : .7) + '"');
    for (var i = 1; i < 4; i++) o += L(mx + mw * i / 4, my + 1, mx + mw * i / 4, my + mh - 1, '#2b4a6b', big ? 1 : .5, 'stroke-dasharray="2 1.5"');
    if (big) {
      ['Laboratorio', 'Comandi', 'Macchine', 'Capsula'].forEach(function (n, k) { o += T(mx + mw * (k + .5) / 4, my + mh / 2 + 3, n, 'text-anchor="middle" font-size="8.5" fill="#1d3550" ' + HAND); });
      o += T(mx - 2, my - 6, '◄ PRUA', 'font-size="7" fill="#7a2a1a" ' + MONO) + T(mx + mw + 2, my - 6, 'POPPA ►', 'text-anchor="end" font-size="7" fill="#7a2a1a" ' + MONO) + T(x + w / 2, y + 14, 'THALASSA — SPACCATO LONGITUDINALE', 'text-anchor="middle" font-size="7.5" fill="#3a2a18" ' + MONO);
      o += T(x + w / 2, y + h - 10, 'scala 1:200 · cantiere di Muggiano', 'text-anchor="middle" font-size="8" fill="#6a5a3a" ' + HAND);
    } else o += T(x + w / 2, y + 7, 'THALASSA', 'text-anchor="middle" font-size="4.5" fill="#3a2a18" ' + MONO);
    return o;
  }
  // personaggio seduto: la capitana (svenuta o sveglia)
  function captain(x, y, s, awake) {
    var o = '';
    o += E(0, 98, 40, 6, 'rgba(0,0,0,.45)');
    o += R(-4, 70, 8, 22, '#1d2328') + P('M-26 96l26 -6l26 6', 'none', 'stroke="#1d2328" stroke-width="4" stroke-linecap="round"') + C(-26, 96, 3, '#111') + C(26, 96, 3, '#111') + C(0, 97, 3, '#111');
    o += R(-30, -8, 60, 62, '#4a2a20', 'rx="12" stroke="#22120c" stroke-width="1.5"') + R(-25, -3, 50, 52, '#5c362a', 'rx="9"') + P('M-20 4h40M-20 18h40M-20 32h40', 'none', 'stroke="#3a1f16" stroke-width="1"');
    o += R(-32, 50, 64, 18, '#4a2a20', 'rx="7" stroke="#22120c" stroke-width="1.5"');
    if (!awake) {
      o += P('M-16 66l-6 26M14 66l10 24', 'none', 'stroke="#15233c" stroke-width="11" stroke-linecap="round"') + E(-23, 94, 7, 3.5, '#111') + E(25, 92, 7, 3.5, '#111');
      o += P('M-20 12Q-24 40 -18 62L20 62Q26 38 18 10Q0 2 -20 12Z', 'url(#u-navy)', 'stroke="#0d1626" stroke-width="1"');
      o += P('M-20 14L-10 12M20 12L10 11', 'none', 'stroke="url(#u-gold)" stroke-width="4" stroke-linecap="round"') + L(-1, 14, -1, 60, '#d9b24a', 1, 'stroke-dasharray="2 3"');
      o += P('M18 16Q34 36 30 62', 'none', 'stroke="#22355a" stroke-width="9" stroke-linecap="round"') + C(30, 66, 5, 'url(#u-skin)');
      o += P('M-18 18Q-30 40 -12 50', 'none', 'stroke="#22355a" stroke-width="9" stroke-linecap="round"') + C(-10, 51, 4.5, 'url(#u-skin)');
      o += G('rotate(-24 0 8)', R(-4, 2, 8, 9, '#e9b894') + E(0, -6, 11, 12.5, 'url(#u-skin)') + P('M-11 -8Q-12 -21 0 -21Q12 -21 11 -9Q6 -15 -3 -14Q-8 -12 -11 -8Z', '#3b2418') + C(9, -16, 5, '#3b2418') +
        P('M-6 -6q2.5 1.8 5 0M3 -6q2.5 1.8 5 0', 'none', 'stroke="#5a3424" stroke-width="1.1" stroke-linecap="round"') + P('M-2 3q2 1 4 0', 'none', 'stroke="#a0574a" stroke-width="1.1" stroke-linecap="round"') + E(-6, 0, 2.2, 1.2, '#e79c8a', 'opacity=".5"'));
      o += P('M-6 14Q-4 30 2 36', 'none', 'stroke="#2c6bd1" stroke-width="1.2"') + G('rotate(12 4 40)', R(-3, 34, 14, 10, '#f2f5f8', 'rx="1.5" stroke="#46566a" stroke-width=".6"') + R(-3, 34, 14, 3, '#2c6bd1') + R(5, 39, 4, 3, 'url(#u-gold)'));
      o += G('translate(-36 92) rotate(-18)', E(0, 0, 11, 3.2, '#101a2c') + P('M-8 0q0 -8 8 -8q8 0 8 8z', '#f4f4f4') + R(-8, -2, 16, 2.5, '#101a2c') + C(0, -4.5, 1.6, 'url(#u-gold)'));
    } else {
      o += P('M-14 66l-4 28M14 66l6 28', 'none', 'stroke="#15233c" stroke-width="11" stroke-linecap="round"') + E(-19, 96, 7, 3.5, '#111') + E(21, 96, 7, 3.5, '#111');
      o += P('M-19 10Q-22 40 -17 62L19 62Q23 38 19 9Q0 2 -19 10Z', 'url(#u-navy)', 'stroke="#0d1626" stroke-width="1"');
      o += P('M-19 12L-9 10M19 10L9 9', 'none', 'stroke="url(#u-gold)" stroke-width="4" stroke-linecap="round"');
      o += P('M-17 16Q-28 34 -14 44', 'none', 'stroke="#22355a" stroke-width="9" stroke-linecap="round"') + C(-12, 45, 4.5, 'url(#u-skin)');
      o += P('M17 14Q32 6 38 -12', 'none', 'stroke="#22355a" stroke-width="9" stroke-linecap="round"') + C(39, -16, 5.2, 'url(#u-skin)') +
        G('translate(43 -26) rotate(35)', C(0, 0, 5, 'none', 'stroke="url(#u-gold)" stroke-width="2.4"') + R(-1.4, 4, 2.8, 15, 'url(#u-gold)') + R(1, 13, 4, 2.4, 'url(#u-gold)') + R(1, 17, 3, 2.2, 'url(#u-gold)'), anim('ua-glint', 0));
      o += R(-4, 0, 8, 10, '#e9b894') + E(0, -8, 11, 12.5, 'url(#u-skin)') + P('M-11 -10Q-12 -23 0 -23Q12 -23 11 -11Q6 -17 -3 -16Q-8 -14 -11 -10Z', '#3b2418') + C(9, -18, 5, '#3b2418') +
        C(-4.5, -8, 1.5, '#2a1a12') + C(4.5, -8, 1.5, '#2a1a12') + P('M-7 -12l4 -1M3 -13l4 1', 'none', 'stroke="#3b2418" stroke-width="1"') + P('M-3 1q3 2 6 0', 'none', 'stroke="#a0574a" stroke-width="1.2" stroke-linecap="round"');
      o += G('translate(-36 92) rotate(-18)', E(0, 0, 11, 3.2, '#101a2c') + P('M-8 0q0 -8 8 -8q8 0 8 8z', '#f4f4f4') + R(-8, -2, 16, 2.5, '#101a2c'));
    }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function badge(x, y, s, rot) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-42, -27, 88, 58, 'rgba(0,0,0,.4)', 'rx="6"') + R(-44, -29, 88, 58, '#f4f6f9', 'rx="6" stroke="#9aa6b2"') + R(-44, -29, 88, 14, '#1f4f9e', 'rx="6"') + R(-44, -21, 88, 6, '#1f4f9e') +
      T(-36, -19, 'THALASSA · COMANDO', 'font-size="6.5" fill="#fff" ' + MONO) + R(-37, -10, 22, 27, '#c9d4de', 'rx="2"') + C(-26, -1, 6, '#8a6b55') + P('M-35 17q9 -12 18 0z', '#22355a') + P('M-32 -3q6 -11 12 0q-2 -6 -6 -6q-4 0 -6 6z', '#3b2418') +
      T(-9, -3, 'CAP. I. FERRI', 'font-size="7" font-weight="700" fill="#16263f" ' + MONO) + T(-9, 6, 'LIVELLO 5', 'font-size="6" fill="#4b5a6b" ' + MONO) + R(-9, 11, 22, 15, 'url(#u-gold)', 'rx="2"') + P('M-5 15h14M-5 19h14M-5 23h14M-2 11v15M5 11v15', 'none', 'stroke="#8a6416" stroke-width=".6"') +
      R(20, 12, 20, 12, '#1f4f9e', 'rx="2" opacity=".2"') + R(-44, 22, 88, 4, '#222', 'opacity=".75"') + C(36, -20, 3, '#fff', 'opacity=".9"') + P('M-44 -29h88v12', 'none', 'stroke="#fff" stroke-opacity=".35"'));
  }
  function crowbar(x, y, s, rot, bent) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', P('M-70 6L56 6' + (bent ? 'Q66 6 70 -2Q74 -10 66 -14' : 'Q70 6 72 -4Q73 -12 64 -14'), 'none', 'stroke="#000" stroke-opacity=".4" stroke-width="9" stroke-linecap="round" transform="translate(2 3)"') +
      P('M-70 6L56 6' + (bent ? 'Q66 6 70 -2Q74 -10 66 -14' : 'Q70 6 72 -4Q73 -12 64 -14'), 'none', 'stroke="#b8222b" stroke-width="8" stroke-linecap="round"') + P('M-70 4L56 4', 'none', 'stroke="#ff8a7a" stroke-opacity=".6" stroke-width="1.6"') +
      P('M-70 6l-10 -3l-4 5l12 2z', '#5d6a72') + L(-30, 6, -10, 6, '#7a1218', 8, 'opacity=".35"'));
  }
  function torch(x, y, s, rot, beam) {
    var o = '';
    if (beam) o += P('M48 -12L170 -60L170 60L48 12Z', beam === 'b' ? '#4fb6ff' : '#fff6c8', 'opacity=".22" ' + anim('ua-ray', .2)) + P('M48 -8L150 -34L150 34L48 8Z', beam === 'b' ? '#9fe0ff' : '#fffbe8', 'opacity=".25"');
    o += R(-50, -11, 74, 22, '#f2b315', 'rx="6" stroke="#6b4a00"') + R(-50, -11, 74, 7, '#ffd65a', 'rx="5" opacity=".7"');
    for (var i = 0; i < 6; i++) o += R(-44 + i * 8, -11, 3, 22, '#c98d00', 'opacity=".6"');
    o += P('M24 -11L40 -17L48 -17L48 17L40 17L24 11Z', '#3a3f45', 'stroke="#15181b"') + R(44, -17, 6, 34, beam === 'b' ? '#3d8ff0' : '#e8f4ff', 'rx="2" stroke="#15181b"') + R(-10, -15, 10, 5, '#2a2f33', 'rx="1.5"') + R(-56, -9, 7, 18, '#2a2f33', 'rx="2"');
    o += C(-58, 0, 4, 'none', 'stroke="#2a2f33" stroke-width="2"');
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', o);
  }
  function filterDisc(x, y, s) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', C(2, 4, 30, 'rgba(0,0,0,.4)') + C(0, 0, 30, '#3a3f45', 'stroke="#15181b" stroke-width="1.5"') + C(0, 0, 24, '#2f7fe6') + C(0, 0, 24, 'url(#u-glowB)', 'opacity=".9" ' + anim('ua-glow', 0)) +
      P('M-16 -8a18 18 0 0 1 14 -12', 'none', 'stroke="#fff" stroke-opacity=".7" stroke-width="3" stroke-linecap="round"') + (function () { var o = ''; for (var i = 0; i < 24; i++) { var a = i * Math.PI / 12; o += L(Math.cos(a) * 26, Math.sin(a) * 26, Math.cos(a) * 29.5, Math.sin(a) * 29.5, '#7d868d', 1); } return o; })());
  }
  function syringe(x, y, s, rot) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-48, -9, 70, 18, 'rgba(0,0,0,.35)', 'rx="4" transform="translate(2 3)"') + R(-46, -9, 66, 18, '#eaf6ff', 'rx="4" stroke="#7a8e9c"') + R(-20, -7, 38, 14, '#ffcf3d', 'opacity=".85"') +
      P('M-40 -9v6M-32 -9v6M-24 -9v6M-16 -9v6M-8 -9v6M0 -9v6M8 -9v6', 'none', 'stroke="#7a8e9c" stroke-width=".8"') + R(-62, -3, 18, 6, '#c9d3d9', 'stroke="#7a8e9c"') + R(-70, -12, 8, 24, '#c9d3d9', 'rx="2" stroke="#7a8e9c"') +
      R(20, -4, 8, 8, '#c9d3d9') + L(28, 0, 62, 0, '#9aa7ae', 1.6) + C(66, 0, 1.2, '#cfe', 'opacity=".9"') + T(-2, 4, 'ADRENALINA', 'text-anchor="middle" font-size="7" font-weight="700" fill="#5a3a00" ' + SANS));
  }
  function key(x, y, s, rot, label) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', P('M-30 0a16 16 0 1 0 0.1 0Z', 'none', 'stroke="#000" stroke-opacity=".35" stroke-width="9" transform="translate(2 3)"') + C(-30, 0, 16, 'none', 'stroke="url(#u-gold)" stroke-width="8"') + C(-30, 0, 16, 'none', 'stroke="#fff6d0" stroke-opacity=".5" stroke-width="1.5" stroke-dasharray="20 80"') +
      R(-14, -5, 70, 10, 'url(#u-gold)', 'rx="2"') + P('M40 5v10h6v-6h5v8h6v-12', 'url(#u-gold)') + R(-14, -5, 70, 3, '#fff6d0', 'opacity=".5"') + (label ? T(16, 3.2, label, 'text-anchor="middle" font-size="7" font-weight="700" fill="#6b4a10" ' + SANS) : ''));
  }
  function fuse(x, y, s, rot) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-30, -10, 60, 20, '#cfe8f2', 'rx="4" opacity=".55" stroke="#9fb7c2"') + L(-24, 0, 24, 0, '#d0a24a', 1.4) + P('M-6 0q3 -4 6 0t6 0', 'none', 'stroke="#d0a24a" stroke-width="1.4"') +
      R(-42, -12, 14, 24, 'url(#u-pipeH)', 'rx="2"') + R(28, -12, 14, 24, 'url(#u-pipeH)', 'rx="2"') + R(-24, -8, 48, 3, '#fff', 'opacity=".5"') + T(0, 8, '30A', 'text-anchor="middle" font-size="6" fill="#335" ' + MONO));
  }
  function lanternfish(x, y, s, lit) {
    // guarda a destra: la testa è a destra. Gruppi di fotofori dalla coda alla testa: 9, 1, 7, 2
    var o = '';
    if (lit) o += E(0, 0, 120, 55, 'url(#u-glowB)', 'opacity=".55" ' + anim('ua-glow', 0));
    o += P('M-96 0L-122 -24L-114 0L-122 24Z', '#1a2a33', 'stroke="#0a1418"') + P('M-100 0C-80 -34 20 -46 70 -26C92 -16 100 -6 104 2C96 12 80 24 60 30C10 44 -78 30 -100 0Z', '#1f323c', 'stroke="#0a1418" stroke-width="1.5"');
    o += P('M-60 -30C-40 -48 -10 -46 0 -40L-20 -32Z', '#16252d') + P('M10 32C20 46 34 44 40 36Z', '#16252d');
    o += P('M70 -26C78 -40 92 -50 112 -48', 'none', 'stroke="#2a3d47" stroke-width="2.2"') + C(114, -48, 5, lit ? '#e6fbff' : '#2d4652') + (lit ? C(114, -48, 14, 'url(#u-glowB)', anim('ua-glow', .3)) : '');
    o += P('M74 4C86 2 96 4 104 2C98 10 88 14 76 12Z', '#0a1418') + P('M78 5l3 5l2 -5l3 6l2 -6l3 6l2 -6', 'none', 'stroke="#e8eef0" stroke-width="1"');
    o += C(66, -10, 9, '#0a1418') + C(66, -10, 7, lit ? '#9ff0ff' : '#c9d6dc') + C(67.5, -10, 3.5, '#0a1418') + C(64, -12.5, 1.5, '#fff');
    o += P('M-60 -6C-30 -14 20 -16 56 -8', 'none', 'stroke="#2c4552" stroke-width="1" stroke-dasharray="3 3"');
    var groups = [[-78, 9], [-40, 1], [-6, 7], [34, 2]], k = 0;
    groups.forEach(function (gr, gi) {
      var n = gr[1], cols = n >= 7 ? 3 : n === 1 ? 1 : 2;
      for (var i = 0; i < n; i++) {
        var cx = gr[0] + (i % cols) * 7.5 - (cols - 1) * 3.75, cy = 6 + Math.floor(i / cols) * 7.5 - (Math.ceil(n / cols) - 1) * 3.75;
        o += lit ? C(cx, cy, 5.5, 'url(#u-glowB)', anim('ua-glow', gi * .5)) + C(cx, cy, 2.5, '#d9fbff', anim('ua-glow', gi * .5)) : C(cx, cy, 2.4, '#2c4a56');
        k++;
      }
      if (gi < 3) o += L(gr[0] + 18, -6, gr[0] + 18, 26, '#0e1b21', 1.2, 'opacity=".9"');
    });
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function tank(x, y, w, h, inner) {
    var cp = uid('tk');
    return R(x - 4, y - 8, w + 8, 8, '#2a3238', 'rx="2"') + R(x - 6, y + h, w + 12, 10, '#2a3238', 'rx="2"') + '<clipPath id="' + cp + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/></clipPath>' +
      G('', R(x, y, w, h, 'url(#u-seaD)') + R(x, y + h - 10, w, 10, '#2a2a22') + (inner || '') + bubbles(x + 4, y + h - 30, w - 8, 9, w + h, false), 'clip-path="url(#' + cp + ')"') +
      R(x, y, w, h, 'url(#u-glass)') + R(x, y, w, h, 'none', 'stroke="#8fb3c2" stroke-opacity=".7" stroke-width="1.5"') + pipeV(x + w - 10, y - 26, 22, 2.5) + R(x + 4, y + 3, 3, h - 6, '#fff', 'opacity=".25"');
  }
  function safe(x, y, w, h, open) {
    var o = R(x - 4, y - 4, w + 8, h + 8, '#14191c', 'rx="4"') + R(x, y, w, h, '#0b0e10', 'rx="2"');
    if (open) {
      o += R(x + 3, y + 3, w - 6, h - 6, '#1d2428') + C(x + w / 2, y + h / 2, w * .5, 'url(#u-glowB)', 'opacity=".25"') + R(x - w * .7, y, w * .7, h, 'url(#u-panelL)', 'stroke="#1b2125" rx="2"') + R(x - w * .62, y + h * .3, w * .2, h * .4, '#2a3238', 'rx="2"');
    } else {
      o += R(x, y, w, h, 'url(#u-panelL)', 'rx="2" stroke="#1b2125" stroke-width="1.2"') + R(x + 5, y + 5, w - 10, h - 10, 'none', 'stroke="#2a3238" stroke-opacity=".6" rx="2"') + screw(x + 4, y + 4) + screw(x + w - 4, y + 4) + screw(x + 4, y + h - 4) + screw(x + w - 4, y + h - 4);
      o += R(x + w * .52, y + h * .18, w * .36, h * .58, '#1b2125', 'rx="2"') + R(x + w * .55, y + h * .21, w * .3, h * .12, '#0d3b2b') + T(x + w * .7, y + h * .3, '- - - -', 'text-anchor="middle" font-size="' + f(h * .08) + '" fill="#5dff9a" ' + MONO);
      for (var r = 0; r < 4; r++) for (var c = 0; c < 3; c++) o += R(x + w * (.56 + c * .1), y + h * (.38 + r * .09), w * .08, h * .07, '#c9d3d9', 'rx="1"');
      o += C(x + w * .26, y + h * .5, w * .13, '#c9d3d9', 'stroke="#2a3238"') + L(x + w * .26, y + h * .5 - w * .13, x + w * .26, y + h * .5 + w * .13, '#2a3238', 2.5);
      o += G('translate(' + f(x + w * .26) + ' ' + f(y + h * .82) + ') scale(' + f(w / 260) + ')', P('M-26 0C-16 -10 10 -12 22 -4L28 -10L26 0L28 10L22 4C10 12 -16 10 -26 0Z', 'none', 'stroke="#2a3238" stroke-width="2"') + C(14, -2, 2, '#2a3238'));
    }
    return o;
  }
  function shelf(x, y, w) { return R(x, y, w, 5, 'url(#u-woodL)') + R(x, y + 5, w, 2, '#000', 'opacity=".4"') + P('M' + (x + 6) + ' ' + (y + 5) + 'l0 8l8 -8M' + (x + w - 6) + ' ' + (y + 5) + 'l0 8l-8 -8', 'none', 'stroke="#5d6a72" stroke-width="1.5"'); }
  function flask(x, y, s, col, d) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-3 -16h6v8l8 14q2 4 -2 4h-18q-4 0 -2 -4l8 -14z', 'rgba(220,240,255,.25)', 'stroke="#cfe3ea" stroke-width="1"') + P('M-6.5 -1h13l5 8q1 3 -2 3h-19q-3 0 -2 -3z', col, 'opacity=".85"') + C(1, 4, 1, '#fff', anim('ua-bub', d || 0, 2.5)) + R(-4, -18, 8, 3, '#7d6a52', 'rx="1"'));
  }
  function tubes(x, y, cols) { var o = R(x, y + 14, cols.length * 7 + 4, 4, '#5d6a72'); cols.forEach(function (c, i) { o += R(x + 3 + i * 7, y, 4.5, 18, 'rgba(220,240,255,.25)', 'rx="2" stroke="#cfe3ea" stroke-width=".7"') + R(x + 3 + i * 7, y + 8, 4.5, 10, c, 'rx="2" opacity=".85"'); }); return o; }
  function clipboard(x, y, s, rot, lines) {
    var o = R(-28, -36, 56, 74, '#7a5230', 'rx="4"') + R(-24, -30, 48, 64, '#fbf6e8') + R(-10, -40, 20, 9, '#9aa7ae', 'rx="2"');
    for (var i = 0; i < (lines || 7); i++) o += P('M-19 ' + (-20 + i * 7) + 'q8 -2 16 0t18 0', 'none', 'stroke="#2b4a6b" stroke-width=".8" opacity=".75"');
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-26, -34, 56, 74, 'rgba(0,0,0,.35)', 'rx="4"') + o);
  }
  function cabinet(x, y, w, h, broken) {
    var o = R(x + 3, y + 4, w, h, 'rgba(0,0,0,.4)') + R(x, y, w, h, '#d9dfe2', 'stroke="#5d6a72"') + R(x + 3, y + 3, w / 2 - 4, h - 6, '#14262c') + R(x + w / 2 + 1, y + 3, w / 2 - 4, h - 6, '#14262c');
    for (var r = 0; r < 2; r++) { o += R(x + 3, y + 3 + (r + 1) * (h - 6) / 3, w - 6, 2, '#9aa7ae'); for (var c = 0; c < 4; c++) o += flask(x + 9 + c * ((w - 14) / 4), y + (r + 1) * (h - 6) / 3 - 2, .42, ['#9b59b6', '#e67e22', '#2ecc71', '#e74c3c'][(c + r) % 4], c * .7 + r); }
    o += R(x + 3, y + 3, w / 2 - 4, h - 6, 'url(#u-glass)') + R(x + w / 2 + 1, y + 3, w / 2 - 4, h - 6, 'url(#u-glass)') + R(x + w / 2 - 3, y + h / 2 - 6, 2, 12, '#9aa7ae') + R(x + w / 2 + 1, y + h / 2 - 6, 2, 12, '#9aa7ae');
    o += G('translate(' + (x + w / 2) + ' ' + (y + h - 16) + ')', P('M0 -11L11 8H-11Z', '#ffd23d', 'stroke="#111" stroke-width="1.2"') + T(0, 6, '!', 'text-anchor="middle" font-size="11" font-weight="900" fill="#111" ' + SANS));
    if (broken) o += P('M' + (x + 8) + ' ' + (y + 10) + 'l10 12l-4 8l12 10M' + (x + 14) + ' ' + (y + 22) + 'l-6 10', 'none', 'stroke="#fff" stroke-opacity=".8" stroke-width=".8"');
    return o;
  }
  function fusebox(x, y, w, h, st) { // st: 'empty' | 'ok'
    var o = R(x + 3, y + 4, w, h, 'rgba(0,0,0,.45)', 'rx="3"') + R(x, y, w, h, '#4a5560', 'rx="3" stroke="#1b2125" stroke-width="1.3"') + R(x + 4, y + 4, w - 8, h - 8, '#1b2125', 'rx="2"');
    o += P('M' + (x + w) + ' ' + y + 'l' + f(w * .45) + ' ' + f(h * .08) + 'v' + f(h * .84) + 'l-' + f(w * .45) + ' ' + f(h * .08) + 'z', 'url(#u-panelL)', 'stroke="#1b2125"') + G('translate(' + f(x + w * 1.22) + ' ' + f(y + h * .2) + ') scale(.32)', P('M-8 -14L4 -2L-2 0L8 14L-4 2L2 0Z', '#ffd23d', 'stroke="#111" stroke-width="2"'));
    var rows = 3;
    for (var r = 0; r < rows; r++) {
      var yy = y + 10 + r * (h - 20) / rows;
      o += R(x + 9, yy, w - 18, (h - 20) / rows - 6, '#2a3238', 'rx="2"');
      var empty = st === 'empty' && r === 1;
      o += empty ? R(x + w * .32, yy + 3, w * .36, (h - 20) / rows - 12, '#0b0e10', 'rx="2"') + P('M' + (x + w * .38) + ' ' + (yy + 4) + 'l3 4l-3 3l4 3', 'none', 'stroke="#555" stroke-width="1"') : fuse(x + w / 2, yy + ((h - 20) / rows - 6) / 2, w / 140, 0);
      o += led(x + 15, yy + 5, empty ? 'r' : st === 'ok' ? 'g' : 'y', empty || st === 'ok', r * .3);
    }
    o += P('M' + (x + 10) + ' ' + (y + h) + 'q-6 14 4 30M' + (x + w / 2) + ' ' + (y + h) + 'q4 16 -6 30M' + (x + w - 10) + ' ' + (y + h) + 'q8 12 0 30', 'none', 'stroke="#111" stroke-width="2.5"');
    return o;
  }
  function valvePanel(x, y, w, h, on) {
    var k = w / 76, o = R(x + 3, y + 4, w, h, 'rgba(0,0,0,.45)', 'rx="4"') + R(x, y, w, h, '#3a4650', 'rx="4" stroke="#14191c" stroke-width="1.3"') + R(x + 4, y + 4, w - 8, 12 * k, '#14191c', 'rx="2"') + T(x + w / 2, y + 4 + 9 * k, 'CIRCUITO GENERATORE', 'text-anchor="middle" font-size="' + f(6.5 * k) + '" fill="' + (on ? '#9dff9a' : '#55626b') + '" ' + MONO);
    [['#e2463a', .2], ['#3d7fe6', .5], ['#e6b93a', .8]].forEach(function (v, i) {
      var cx = x + w * v[1];
      o += pipeV(cx, y + 40 * k, 24 * k, 3 * k) + gauge(cx, y + 34 * k, 11 * k, on ? [.33, .55, .22][i] : 0, v[0]) + wheel(cx, y + 72 * k, 11 * k, v[0]) + led(cx, y + 92 * k, on ? 'g' : 'r', !on, i * .3);
    });
    return o;
  }
  function generator(x, y, w, h, on) {
    var o = R(x + 4, y + 5, w, h, 'rgba(0,0,0,.45)', 'rx="8"') + R(x, y, w, h, '#4b5a3e', 'rx="8" stroke="#1d2418" stroke-width="1.5"') + R(x, y, w, h * .35, '#647553', 'rx="8" opacity=".5"');
    for (var i = 0; i < 4; i++) o += R(x + 8 + i * (w - 16) / 4, y - 14, (w - 16) / 4 - 6, 16, 'url(#u-pipeH)', 'rx="3"');
    for (i = 0; i < 9; i++) o += R(x + 10, y + 18 + i * 5, w * .45, 2, '#1d2418', 'opacity=".7"');
    o += C(x + w * .76, y + h * .45, h * .28, '#2a3022', 'stroke="#1d2418"') + C(x + w * .76, y + h * .45, h * .2, on ? 'url(#u-glowO)' : '#1d2418', on ? anim('ua-glow', 0) : '') + G('', L(x + w * .76 - h * .18, y + h * .45, x + w * .76 + h * .18, y + h * .45, '#55624a', 3) + L(x + w * .76, y + h * .45 - h * .18, x + w * .76, y + h * .45 + h * .18, '#55624a', 3), on ? 'class="ua-spin" style="transform-origin:' + f(x + w * .76) + 'px ' + f(y + h * .45) + 'px;animation-duration:.6s"' : '');
    o += plaque(x + 8, y + h - 22, 52, 'GEN-2', on ? 'IN MARCIA' : 'FERMO');
    return o;
  }
  function pump(x, y, s, on) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 32, 34, 6, 'rgba(0,0,0,.4)') + R(-30, -6, 44, 34, '#2c5d8a', 'rx="6" stroke="#0f2236" stroke-width="1.4"') + R(-30, -6, 44, 10, '#4c84b8', 'rx="6" opacity=".6"') +
      C(26, 10, 16, '#33424c', 'stroke="#0f2236" stroke-width="1.4"') + C(26, 10, 8, '#1b2328') + pipeV(26, -36, 30, 5) + pipeH(-60, 22, 30, 5) + T(-8, 16, 'POMPA', 'text-anchor="middle" font-size="7" fill="#d9e8f5" ' + MONO) + led(-22, 2, on ? 'g' : 'r', true));
  }
  function water(y, seed, op) {
    var o = R(0, y, 300, 220 - y, 'url(#u-water)', 'opacity="' + (op || 1) + '"'), r = rnd(seed || 9);
    for (var i = 0; i < 9; i++) { var wx = r() * 300, wy = y + 6 + r() * (214 - y); o += P('M' + f(wx) + ' ' + f(wy) + 'q8 -3 16 0t16 0', 'none', 'stroke="#bfefff" stroke-opacity=".35" stroke-width=".9" ' + anim('ua-wave', r() * 3)); }
    return o + R(0, y, 300, 2, '#bfefff', 'opacity=".4"');
  }
  function keypad(x, y, w, h, on, txt) {
    var o = R(x + 3, y + 4, w, h, 'rgba(0,0,0,.45)', 'rx="5"') + R(x, y, w, h, '#20272c', 'rx="5" stroke="#0a0d0f" stroke-width="1.4"') + R(x + 5, y + 5, w - 10, h * .2, on ? '#0d3b2b' : '#0b0e10', 'rx="2"') + (on ? T(x + w / 2, y + 5 + h * .15, txt || '_ _ _ _', 'text-anchor="middle" font-size="' + f(h * .12) + '" fill="#5dff9a" ' + MONO + ' ' + anim('ua-blink', 0)) : '');
    var k = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '✕', '0', '✓'];
    for (var i = 0; i < 12; i++) { var c = i % 3, r = Math.floor(i / 3), bw = (w - 16) / 3, bh = (h * .7 - 10) / 4, bx = x + 5 + c * (bw + 3), by = y + h * .28 + r * (bh + 2.5); o += R(bx, by + 1, bw, bh, '#000', 'rx="2" opacity=".5"') + R(bx, by, bw, bh, i === 9 ? '#8a2a22' : i === 11 ? '#2a7a3a' : '#c9d3d9', 'rx="2"') + T(bx + bw / 2, by + bh * .72, k[i], 'text-anchor="middle" font-size="' + f(bh * .62) + '" font-weight="700" fill="' + (i === 9 || i === 11 ? '#fff' : '#20272c') + '" ' + SANS); }
    return o;
  }
  function seat(x, y, s) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-14, -40, 28, 44, '#c25a1f', 'rx="8" stroke="#5a2408" stroke-width="1.2"') + R(-16, 2, 32, 12, '#a84a17', 'rx="5"') + P('M-8 -36v34M8 -36v34', 'none', 'stroke="#222" stroke-width="3"') + R(-10, -20, 20, 5, '#222', 'rx="2"') + C(0, -17.5, 2.5, 'url(#u-pipeH)')); }
  function hazard(w) { var o = '', i; for (i = -20; i < w + 20; i += 16) o += P('M' + i + ' 0l8 0l-10 12l-8 0z', '#111'); return R(0, 0, w, 12, '#ffd23d') + o; }
  function crack(x, y, s) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M0 0l-22 -18l-8 -26M0 0l26 -12l20 -22M0 0l8 28l-6 24M0 0l-30 14l-18 20M0 0l34 18M-22 -18l-14 4M26 -12l6 -14M8 28l14 6', 'none', 'stroke="#fff" stroke-width="1.6" stroke-linecap="round" opacity=".9"') + C(0, 0, 4, '#fff', 'opacity=".9"')); }

  /* ---------- kit della soffitta ---------- */
  function attic(seed) {
    var o = R(0, 0, 300, 220, 'url(#u-atticWall)');
    for (var i = 0; i < 16; i++) o += R(i * 20, 0, 19, 220, i % 2 ? '#3b2a1e' : '#35251a', 'opacity=".55"') + L(i * 20, 0, i * 20, 220, '#140d08', .8, 'opacity=".6"');
    o += P('M0 0L150 -10L300 0L300 60L150 18L0 60Z', '#1d140d') + P('M-10 70L150 8L310 70', 'none', 'stroke="url(#u-woodH)" stroke-width="16"') + P('M-10 70L150 8L310 70', 'none', 'stroke="#000" stroke-opacity=".35" stroke-width="2" transform="translate(0 9)"');
    o += R(0, 160, 300, 60, 'url(#u-wood)') + (function () { var s = ''; for (var k = 0; k < 6; k++) s += L(0, 168 + k * 9, 300, 168 + k * 9, '#2a180a', 1, 'opacity=".6"'); return s; })();
    var r = rnd(seed || 5); for (i = 0; i < 18; i++) o += C(r() * 300, 30 + r() * 150, .6 + r() * 1.1, '#ffe9b0', 'opacity=".5" ' + anim('ua-dust', r() * 8, 6 + r() * 6));
    return o;
  }
  function cobweb(x, y, s, flip) { return G('translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')', P('M0 0L40 0M0 0L0 40M0 0L34 22M0 0L22 34M8 0Q8 8 0 8M18 0Q17 14 0 18M28 0Q26 22 0 28M38 0Q36 32 0 38', 'none', 'stroke="#e8e2d4" stroke-opacity=".45" stroke-width=".6"')); }
  function skylight(x, y, w, h, moon) {
    var cp = uid('sk');
    return R(x - 5, y - 5, w + 10, h + 10, 'url(#u-woodH)', 'rx="2"') + '<clipPath id="' + cp + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/></clipPath>' +
      G('', R(x, y, w, h, 'url(#u-night)') + C(x + w * .7, y + h * .35, h * .22, 'url(#u-moon)') + C(x + w * .2, y + h * .3, .9, '#fff', anim('ua-blink', .3)) + C(x + w * .45, y + h * .7, .7, '#fff', anim('ua-blink', 1.2)) + C(x + w * .85, y + h * .8, .8, '#fff', anim('ua-blink', 2)), 'clip-path="url(#' + cp + ')"') +
      L(x + w / 2, y, x + w / 2, y + h, '#5a3a1e', 3) + L(x, y + h / 2, x + w, y + h / 2, '#5a3a1e', 3) + R(x, y, w, h, 'url(#u-glass)') + (moon ? P('M' + x + ' ' + (y + h) + 'L' + (x - 40) + ' 220L' + (x + w + 70) + ' 220L' + (x + w) + ' ' + (y + h) + 'Z', '#cfd8ff', 'opacity=".06" ' + anim('ua-ray', 0)) : '');
  }
  function trunk(x, y, w, h, open) {
    var o = E(x + w / 2, y + h + 2, w * .55, 5, 'rgba(0,0,0,.45)') + R(x, y, w, h, 'url(#u-wood)', 'rx="3" stroke="#2a180a" stroke-width="1.5"');
    for (var i = 1; i < 4; i++) o += L(x + 2, y + i * h / 4, x + w - 2, y + i * h / 4, '#2a180a', 1, 'opacity=".5"');
    o += R(x + w * .12, y, 6, h, 'url(#u-gold)', 'opacity=".9"') + R(x + w * .88 - 6, y, 6, h, 'url(#u-gold)', 'opacity=".9"');
    if (open) o += P('M' + x + ' ' + y + 'L' + (x + 6) + ' ' + (y - h * .9) + 'L' + (x + w - 6) + ' ' + (y - h * .9) + 'L' + (x + w) + ' ' + y + 'Z', '#5a3a1e', 'stroke="#2a180a" stroke-width="1.5"') + R(x + 3, y - 3, w - 6, 6, '#1a0f07') + C(x + w / 2, y - h * .4, w * .5, 'url(#u-glowW)', 'opacity=".35"');
    else o += P('M' + x + ' ' + y + 'Q' + (x + w / 2) + ' ' + (y - h * .5) + ' ' + (x + w) + ' ' + y + 'Z', 'url(#u-wood)', 'stroke="#2a180a" stroke-width="1.5"') + R(x + w / 2 - 7, y - 4, 14, 16, 'url(#u-gold)', 'rx="2" stroke="#6b4a10"') + C(x + w / 2, y + 3, 2, '#2a180a') + R(x + w / 2 - .8, y + 4, 1.6, 4, '#2a180a');
    return o;
  }
  function drawers(x, y, w, h) {
    var o = E(x + w / 2, y + h + 2, w * .55, 5, 'rgba(0,0,0,.45)') + R(x, y, w, h, 'url(#u-woodL)', 'stroke="#3a240f" stroke-width="1.5"') + R(x - 3, y - 5, w + 6, 6, 'url(#u-wood)');
    for (var i = 0; i < 4; i++) { var yy = y + 4 + i * (h - 8) / 4; o += R(x + 4, yy, w - 8, (h - 8) / 4 - 3, '#9a6a3a', 'stroke="#3a240f" stroke-width=".8"') + C(x + w * .3, yy + (h - 8) / 8 - 1.5, 2, 'url(#u-gold)') + C(x + w * .7, yy + (h - 8) / 8 - 1.5, 2, 'url(#u-gold)'); }
    o += P('M' + (x + 8) + ' ' + (y + h * .36) + 'q4 6 8 2q4 -4 6 4', '#e8e2d4', 'opacity=".8"');
    return o;
  }
  function trapdoor(x, y, w, h, open) {
    var o = R(x - 3, y - 3, w + 6, h + 6, '#1a0f07') + (open ? R(x, y, w, h, '#0b0603') + C(x + w / 2, y + h / 2, w * .8, 'url(#u-glowW)', 'opacity=".9" ' + anim('ua-glow', 0)) + P('M' + (x + w * .3) + ' ' + (y + h) + 'L' + (x + w * .36) + ' ' + y + 'M' + (x + w * .7) + ' ' + (y + h) + 'L' + (x + w * .64) + ' ' + y + 'M' + (x + w * .33) + ' ' + (y + h * .3) + 'H' + (x + w * .67) + 'M' + (x + w * .32) + ' ' + (y + h * .65) + 'H' + (x + w * .68), 'none', 'stroke="#6b4423" stroke-width="3"') : R(x, y, w, h, 'url(#u-woodL)', 'stroke="#3a240f" stroke-width="1.2"'));
    if (!open) { for (var i = 1; i < 4; i++) o += L(x, y + i * h / 4, x + w, y + i * h / 4, '#3a240f', 1); o += R(x + w * .7, y + h * .35, 12, h * .3, '#5d6a72', 'rx="1"') + G('', P('M' + (x + w * .7 + 1) + ' ' + (y + h * .52) + 'a5 5 0 0 1 10 0', 'none', 'stroke="#c9d3d9" stroke-width="2"') + R(x + w * .7 - 2, y + h * .52, 14, 12, 'url(#u-brass)', 'rx="2"') + R(x + w * .7, y + h * .52 + 3, 10, 3, '#3a2808'), ''); }
    return o;
  }
  function gramophone(x, y, s, playing) {
    var o = E(0, 36, 40, 6, 'rgba(0,0,0,.45)') + R(-34, 10, 68, 26, 'url(#u-wood)', 'rx="3" stroke="#2a180a" stroke-width="1.2"') + R(-30, 14, 60, 18, 'none', 'stroke="#c49a5a" stroke-opacity=".5" rx="2"');
    o += E(-4, 10, 28, 6, '#141414') + G('', E(-4, 10, 26, 5.2, '#1c1c1c') + E(-4, 10, 18, 3.6, 'none', 'stroke="#333" stroke-width=".6"') + E(-4, 10, 7, 1.6, '#c0392b') + (playing ? E(-4, 10, 22, 4.4, 'none', 'stroke="#fff" stroke-opacity=".25" stroke-dasharray="10 60" ' + anim('ua-blink', 0, .5)) : ''), '');
    o += P('M14 8L18 -14', 'none', 'stroke="url(#u-gold)" stroke-width="3"') + P('M18 -14Q20 -30 6 -40', 'none', 'stroke="url(#u-gold)" stroke-width="4"') + P('M6 -40L-30 -74Q-10 -86 16 -76Z', 'url(#u-gold)', 'stroke="#8a5f17" stroke-width="1"') + P('M6 -40L-30 -74Q-10 -86 16 -76', 'none', 'stroke="#fff6d0" stroke-opacity=".5" stroke-width="1"');
    o += P('M34 22q10 0 10 -8', 'none', 'stroke="#8a5f17" stroke-width="3"') + C(44, 12, 3, '#c0392b');
    if (playing) for (var i = 0; i < 4; i++) o += T(-30 + i * 14, -84 - (i % 2) * 10, i % 2 ? '♪' : '♫', 'font-size="16" fill="#ffe9a8" ' + anim('ua-note', i * .6));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function record(x, y, s, label) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-60, -60, 120, 120, '#c9b48a', 'rx="3" stroke="#6a5530"') + R(-56, -56, 112, 112, '#e8d7b1', 'rx="2"') + C(26, 0, 52, '#141414') + C(26, 0, 46, 'none', 'stroke="#2a2a2a" stroke-width="5" stroke-dasharray="1 2"') + C(26, 0, 18, '#c0392b') + C(26, 0, 2.5, '#e8d7b1') +
      T(26, -7, 'La canzone', 'text-anchor="middle" font-size="5.6" fill="#fff" ' + HAND) + T(26, -1, 'della botola', 'text-anchor="middle" font-size="5.6" fill="#fff" ' + HAND) + T(26, 10, label || '45 giri', 'text-anchor="middle" font-size="6" font-weight="700" fill="#ffe9a8" ' + SANS) +
      T(-30, 40, 'Nonno G.', 'font-size="11" fill="#5a3a1e" ' + HAND));
  }

  /* ---------- le scene ---------- */
  var SC = {};
  // --- Soffitta ---
  SC['soffitta:start'] = function () { return attic(3) + skylight(118, 40, 64, 46, true) + trapdoor(118, 168, 64, 26, false) + G('translate(150 160)', P('M-14 0q0 -40 14 -46q14 6 14 46z', '#0b0805') + C(0, -52, 9, '#0b0805')) + cobweb(0, 0, 1) + cobweb(300, 0, 1, true) + vig() + tag('A', 150, 112); };
  SC['soffitta:A'] = function () {
    return attic(8) + skylight(122, 34, 56, 40, true) + cobweb(0, 0, 1.1) + cobweb(300, 0, .9, true) +
      L(46, 46, 46, 58, '#222', 1.5) + key(46, 62, .18, 90) + hid('4', 54, 70, '#e8c87a', 8, -8, .6) +
      trunk(18, 128, 82, 44, false) + tag('11', 59, 112) + drawers(206, 96, 70, 76) + tag('23', 241, 86) + trapdoor(118, 176, 64, 26, false) + tag('9', 150, 168) +
      G('translate(108 150)', R(0, 0, 26, 22, '#b08a5a', 'stroke="#6a4a2a"') + L(0, 6, 26, 6, '#6a4a2a', 1)) + G('translate(160 140)', R(0, 0, 20, 30, '#8a6a4a', 'stroke="#4a2a12"') + R(4, 4, 12, 10, '#c9b48a')) + vig();
  };
  SC['soffitta:11'] = function () { return attic(11) + C(150, 110, 120, 'url(#u-glowW)', 'opacity=".15"') + trunk(70, 100, 160, 84, false) + G('translate(150 112) scale(2.2)', R(-7, -4, 14, 16, 'url(#u-gold)', 'rx="2" stroke="#6b4a10"') + C(0, 3, 2, '#2a180a') + R(-.8, 4, 1.6, 4, '#2a180a')) + T(150, 200, 'G. B. · 1952', 'text-anchor="middle" font-size="14" fill="#e8c87a" opacity=".7" ' + HAND) + vig(); };
  SC['soffitta:4'] = function () { return attic(4) + C(150, 110, 90, 'url(#u-glowW)', 'opacity=".3"') + L(150, 20, 150, 62, '#222', 2) + C(150, 18, 4, '#5d6a72') + key(150, 110, .9, 90) + vig(); };
  SC['soffitta:23'] = function () { return attic(23) + drawers(84, 54, 132, 140) + G('translate(150 54)', R(-30, -2, 60, 2, '#000', 'opacity=".2"')) + P('M106 112q10 16 26 6q10 -8 18 6', 'none', 'stroke="#e8e2d4" stroke-width="3"') + C(196, 86, 2, '#fff', 'opacity=".7"') + vig(); };
  SC['soffitta:27'] = function () { return R(0, 0, 300, 220, '#2a0d0a') + attic(27).replace('url(#u-atticWall)', '#3a120d') + G('', hazard(300)) + G('translate(0 208)', hazard(300)) + drawers(110, 70, 80, 110) + key(150, 104, .7, 20) + P('M178 92l10 -6M182 100l12 0M178 108l10 6', 'none', 'stroke="#ffd23d" stroke-width="3" stroke-linecap="round"') + T(150, 200, '−1:00', 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a"') + vig(); };
  SC['soffitta:15'] = function () { return attic(15) + trunk(60, 120, 180, 70, true) + gramophone(112, 104, .7, false) + G('translate(194 102) rotate(-10)', record(0, 0, .42)) + tag('20', 104, 30) + tag('8', 214, 62) + vig(); };
  SC['soffitta:20'] = function () { return attic(20) + C(150, 120, 110, 'url(#u-glowW)', 'opacity=".2"') + gramophone(160, 150, 1.25, false) + T(70, 196, '33 · 45 · 78', 'text-anchor="middle" font-size="11" fill="#e8c87a" ' + MONO) + vig(); };
  SC['soffitta:8'] = function () { return attic(80) + C(150, 110, 110, 'url(#u-glowW)', 'opacity=".2"') + G('rotate(-6 150 110)', record(150, 110, 1.4)) + vig(); };
  SC['soffitta:13'] = function () { return attic(13) + C(150, 110, 130, 'url(#u-glowW)', 'opacity=".35" ' + anim('ua-glow', 0)) + gramophone(160, 156, 1.2, true) + vig(); };
  SC['soffitta:9'] = function () { return attic(9) + R(40, 130, 220, 90, 'url(#u-wood)') + trapdoor(70, 140, 160, 70, false) + G('translate(192 166) scale(2.6)', P('M1 0a5 5 0 0 1 10 0', 'none', 'stroke="#c9d3d9" stroke-width="2"') + R(-2, 0, 14, 12, 'url(#u-brass)', 'rx="2"') + R(0, 4, 10, 4, '#3a2808') + T(5, 7.3, '0000', 'text-anchor="middle" font-size="3" fill="#ffe9a6" ' + MONO)) + vig(); };
  SC['soffitta:24'] = function () { return attic(24) + trapdoor(90, 120, 120, 80, true) + C(150, 150, 150, 'url(#u-glowW)', 'opacity=".5"') + G('translate(220 120)', R(-14, -10, 28, 22, '#5a2a1a', 'rx="2"') + T(0, 4, '📷', 'text-anchor="middle" font-size="12"')) + (function () { var o = ''; for (var i = 0; i < 14; i++) o += T(20 + i * 20, 30 + (i % 3) * 12, '✦', 'font-size="9" fill="#ffe9a8" ' + anim('ua-blink', i * .3)); return o; })() + vig(); };

  // --- Abisso ---
  function abyss(seed) { // fondale con fasci di luce
    return R(0, 0, 300, 220, 'url(#u-deep)') + seaRays(0, 0, 300, 220) + bubbles(0, 160, 300, 16, seed || 4, true);
  }
  function subSide(x, y, s, lights) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 0, 110, 26, '#2b3a45', 'stroke="#0b1418" stroke-width="2"') + E(0, -8, 104, 14, '#3e5260', 'opacity=".5"') + R(-24, -46, 48, 28, '#2b3a45', 'rx="8" stroke="#0b1418" stroke-width="2"') + R(-4, -60, 4, 16, '#22313a') +
      P('M104 -2L132 -20L128 0L132 20Z', '#22313a', 'stroke="#0b1418"') + (function () { var o = ''; for (var i = 0; i < 7; i++) o += C(-70 + i * 22, 2, 4, lights ? '#ffcf6a' : '#0e1820', lights ? anim('ua-blink', i * .4) : ''); return o; })() + T(-50, 18, 'THALASSA', 'font-size="9" fill="#9fb3c2" letter-spacing="2" ' + MONO));
  }
  SC['abisso:start'] = function () {
    return abyss(1) + P('M0 220L0 150Q40 120 80 140Q120 110 160 150Q210 120 240 150Q270 130 300 120L300 220Z', '#081218') + P('M200 220L230 80L250 60L270 90L300 60L300 220Z', '#0b1820') + C(255, 66, 24, 'url(#u-glowO)', 'opacity=".6" ' + anim('ua-flick', 0)) +
      subSide(130, 118, .9, true) + C(30, 118, 50, 'url(#u-glowO)', 'opacity=".25"') + (function () { var o = ''; for (var i = 0; i < 6; i++) o += G('', P('M' + (220 + i * 9) + ' ' + (40 + i * 5) + 'l6 4l-2 6l-6 -2z', '#2a3a44'), anim('ua-fall', i * .7)); return o; })() +
      fish(40, 50, .7, '#4fb6ff', 1, .2) + fish(70, 62, .5, '#4fb6ff', 1, .6) + vig() + tag('A', 150, 186);
  };
  SC['abisso:A'] = function () {
    return wall(11) + pipeH(0, 12, 300, 5, true) + pipeH(0, 26, 300, 3.5) + lamp(150, 32) +
      hatch(10, 52, 52, 130, { reader: 'r' }) + tag('33', 36, 44) +
      locker(70, 92, 34, 98, ['#e6c33a', '#e2463a', '#3d7fe6', '#38c070']) + tag('7', 87, 82) +
      porthole(136, 74, 22, fish(130, 70, .5, '#e6c33a', 1, .3) + fish(142, 82, .45, '#3d7fe6', -1, .9)) + tag('21', 106, 50) +
      subMap(196, 38, 40, 28, false) + tag('2', 238, 38) + plaque(190, 72, 56, 'THALASSA', 'NOMINATIVO: TLS') +
      hatch(250, 52, 44, 130, { wcol: '#d9a02a' }) + pipeV(252, 40, 70, 3) + P('M246 96Q270 110 296 102', 'none', 'stroke="url(#u-pipeH)" stroke-width="7"') + tag('12', 272, 44) +
      floor(186) + console_(160, 146, 88, 44) + screenSonar(172, 158, 24, 24) + radio(200, 116) + tag('47', 230, 104) + star(236, 177, .95, '8') +
      captain(140, 108, .72, false) + tag('15', 116, 120) +
      G('translate(198 206) rotate(-8)', R(-9, -5, 18, 10, '#5a2a1a', 'rx="1"') + R(-8, -4, 16, 2, '#e8d7b1')) + hid('3', 210, 210, '#c9b48a', 7.5, -8, .55) + vig();
  };
  SC['abisso:15'] = function () { return wall(15) + lamp(150, 10) + floor(186) + C(150, 120, 110, 'url(#u-glowO)', 'opacity=".2"') + captain(150, 74, 1.12, false) + tag('26', 172, 140) + vig(); };
  SC['abisso:26'] = function () { return wall(26) + C(150, 110, 120, 'url(#u-glowB)', 'opacity=".25"') + badge(150, 112, 1.6, -6) + vig(); };
  SC['abisso:33'] = function () { return wall(33) + lamp(60, 14, 'R') + hatch(90, 30, 110, 176, { reader: 'r' }) + G('translate(222 104) scale(1.9)', R(-6, -14, 12, 26, '#1c2226', 'rx="2" stroke="#4b5860"') + R(-4, -10, 8, 10, '#2e3a42') + led(0, 6, 'r', true)) + T(150, 22, 'LABORATORIO', 'text-anchor="middle" font-size="9" fill="#d9e8f5" letter-spacing="2" ' + MONO) + vig(); };
  SC['abisso:59'] = function () { return wall(59) + hatch(100, 30, 100, 176, { open: true, slid: true, glow: 'G', inside: '#0f2c33' }) + tubes(124, 120, ['#2ecc71', '#9b59b6', '#3498db', '#e67e22']) + flask(178, 130, .9, '#2ecc71', .4) + G('translate(222 104) scale(1.9)', R(-6, -14, 12, 26, '#1c2226', 'rx="2" stroke="#4b5860"') + R(-4, -10, 8, 10, '#2e3a42') + led(0, 6, 'g', false)) + tag('B', 150, 96) + vig(); };
  SC['abisso:12'] = function () { return wall(12) + lamp(150, 10) + hatch(84, 30, 132, 176, { wcol: '#d9a02a' }) + pipeV(110, 0, 50, 6) + P('M70 60Q130 90 150 128Q170 160 230 150', 'none', 'stroke="#000" stroke-opacity=".5" stroke-width="15" transform="translate(3 4)"') + P('M70 60Q130 90 150 128Q170 160 230 150', 'none', 'stroke="url(#u-pipeH)" stroke-width="13"') + P('M70 60Q130 90 150 128Q170 160 230 150', 'none', 'stroke="#fff" stroke-opacity=".3" stroke-width="2" transform="translate(0 -4)"') + T(150, 22, 'SALA MACCHINE', 'text-anchor="middle" font-size="9" fill="#d9e8f5" letter-spacing="2" ' + MONO) + vig(); };
  SC['abisso:48'] = function () { return wall(48) + hatch(90, 30, 120, 176, { open: true, inside: '#0b0e10', glow: 'O' }) + G('translate(150 120)', R(-40, 26, 80, 6, '#222')) + crowbar(220, 196, .55, -8, true) + P('M40 200Q90 170 120 180', 'none', 'stroke="url(#u-pipeH)" stroke-width="12"') + tag('C', 150, 118) + vig(); };
  SC['abisso:7'] = function () { return wall(7) + C(150, 110, 100, 'url(#u-glowO)', 'opacity=".18"') + locker(100, 20, 100, 190, ['#e6c33a', '#e2463a', '#3d7fe6', '#38c070']) + vig(); };
  SC['abisso:21'] = function () {
    var inner = seaRays(40, 0, 220, 220), cols = [['#e6c33a', 3], ['#e2463a', 1], ['#3d7fe6', 4], ['#38c070', 2]], r = rnd(21), pts = [[92, 74], [118, 132], [180, 58], [206, 120], [150, 92], [104, 104], [196, 156], [166, 132], [128, 58], [220, 92]], k = 0;
    cols.forEach(function (c) { for (var i = 0; i < c[1]; i++) { var p = pts[k++]; inner += fish(p[0], p[1], .95 + r() * .2, c[0], r() < .5 ? 1 : -1, k * .35); } });
    inner += G('translate(240 160)', E(0, 0, 10, 7, '#e8f0ff', 'opacity=".35"') + P('M-8 4q0 12 -2 18M-3 5q1 12 -1 16M3 5q1 12 2 17M8 4q2 10 1 16', 'none', 'stroke="#e8f0ff" stroke-opacity=".35"'), anim('ua-float', 1)) + bubbles(60, 170, 180, 10, 5);
    return wall(21) + porthole(150, 108, 88, inner) + vig();
  };
  SC['abisso:40'] = function () { return wall(40) + R(84, 16, 132, 196, '#3a1612', 'rx="4"') + R(90, 22, 120, 184, '#140806', 'rx="3"') + C(150, 110, 90, 'url(#u-glowO)', 'opacity=".25"') + P('M84 16L30 30L30 200L84 212Z', '#7b2d26', 'stroke="#2a0f0c"') + shelf(92, 100, 116) + crowbar(150, 70, .62, -4) + torch(140, 150, .72, 0) + tag('36', 196, 52) + tag('25', 196, 160) + vig(); };
  SC['abisso:36'] = function () { return wall(36) + C(150, 110, 120, 'url(#u-glowO)', 'opacity=".2"') + crowbar(150, 116, 1.45, -24) + vig(); };
  SC['abisso:25'] = function () { return wall(25) + torch(130, 116, 1.4, -8, 'w') + vig(); };
  SC['abisso:69'] = function () { return R(0, 0, 300, 220, '#2a0d0a') + G('', hazard(300)) + G('translate(0 208)', hazard(300)) + hatch(100, 30, 100, 170, { reader: 'r' }) + crowbar(160, 120, .7, -50) + P('M196 66l12 -8M200 80l16 0M196 94l12 8', 'none', 'stroke="#ffd23d" stroke-width="3" stroke-linecap="round"') + T(60, 120, '−1:00', 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a"') + vig(); };
  SC['abisso:3'] = function () {
    return wall(3) + G('rotate(-3 150 110)', R(34, 18, 236, 186, '#5a2a1a', 'rx="4"') + R(40, 22, 110, 178, 'url(#u-paper)') + R(150, 22, 110, 178, 'url(#u-paper)') + L(150, 22, 150, 200, '#b09a70', 1.5) +
      T(52, 42, 'Registro di bordo', 'font-size="13" fill="#3a2a18" ' + HAND) + T(52, 60, '03:00 rotta 270°', 'font-size="11" fill="#2b4a6b" ' + HAND) + T(52, 76, 'quota 400 m', 'font-size="11" fill="#2b4a6b" ' + HAND) + T(52, 96, '03:12 SCOSSA!!', 'font-size="12" fill="#a0281e" ' + HAND) +
      T(162, 44, '03:20 adrenalina', 'font-size="11" fill="#2b4a6b" ' + HAND) + T(162, 60, 'in cassaforte (lab).', 'font-size="11" fill="#2b4a6b" ' + HAND) + T(162, 82, 'Il codice? Chiedilo', 'font-size="11" fill="#2b4a6b" ' + HAND) + T(162, 98, 'alla lanterna:', 'font-size="11" fill="#2b4a6b" ' + HAND) +
      T(162, 116, 'dalla TESTA', 'font-size="12" fill="#a0281e" ' + HAND) + T(162, 132, 'alla coda!', 'font-size="12" fill="#a0281e" ' + HAND) + G('translate(212 168) scale(.32)', lanternfish(0, 0, 1, false)) + P('M170 150l60 0', 'none', 'stroke="#a0281e" stroke-width="1.2"') + P('M226 146l6 4l-6 4', 'none', 'stroke="#a0281e" stroke-width="1.2"') + C(100, 150, 16, 'none', 'stroke="#8a6a3a" stroke-opacity=".35" stroke-width="5"')) + vig();
  };
  SC['abisso:2'] = function () { return wall(2) + subMap(24, 30, 252, 160, true) + vig(); };
  SC['abisso:47'] = function () {
    var cfg = UScen.S.abisso.cards['47'].mac.table, o = wall(47) + lamp(110, 8) + G('translate(16 74) scale(1.75)', radio(0, 0));
    o += G('rotate(2 236 114)', R(172, 18, 122, 190, 'url(#u-paper)', 'rx="2"') + T(233, 36, 'CODICE MORSE', 'text-anchor="middle" font-size="10" font-weight="700" fill="#3a2a18" ' + MONO) + L(180, 42, 286, 42, '#8a6a3a', .8) +
      cfg.map(function (m, i) { var cx = 180 + (i >= 6 ? 56 : 0), cy = 62 + (i % 6) * 25; return T(cx, cy, m[0], 'font-size="13" font-weight="700" fill="#1d3550" ' + MONO) + T(cx + 12, cy, m[1].replace(/\./g, '•').replace(/-/g, '–'), 'font-size="13" font-weight="700" fill="#a0281e" letter-spacing="1" ' + MONO); }).join(''));
    return o + vig();
  };
  SC['abisso:70'] = function () { return wall(70) + G('translate(40 120) scale(1.4)', radio(0, 0)) + R(150, 30, 140, 70, '#fbf6e8', 'rx="12"') + P('M170 100l-10 18l26 -18z', '#fbf6e8') + T(220, 56, '«…Thalassa,', 'text-anchor="middle" font-size="13" fill="#2b4a6b" ' + HAND) + T(220, 74, 'vi riceviamo!»', 'text-anchor="middle" font-size="13" fill="#2b4a6b" ' + HAND) + (function () { var o = ''; for (var i = 0; i < 3; i++) o += P('M' + (130 + i * 10) + ' ' + (110 - i * 6) + 'a' + (20 + i * 10) + ' ' + (20 + i * 10) + ' 0 0 1 0 ' + (24 + i * 14), 'none', 'stroke="#9dff9a" stroke-width="2" ' + anim('ua-blink', i * .3)); return o; })() + star(250, 170, 1.6, null) + vig(); };
  SC['abisso:B'] = function () {
    return wall(19) + pipeH(0, 12, 300, 4, true) + lamp(150, 22, 'W') +
      tank(14, 88, 86, 92, lanternfish(57, 140, .26, false) + R(14, 170, 86, 10, '#3a3628')) + tag('50', 57, 76) +
      safe(124, 102, 52, 56, false) + tag('14', 150, 92) +
      cabinet(200, 92, 70, 92, false) + tag('38', 235, 82) +
      shelf(196, 46, 96) + tubes(202, 28, ['#2ecc71', '#9b59b6', '#3498db', '#e67e22']) + flask(250, 40, .6, '#2ecc71', .3) + C(278, 40, 6, '#2f7fe6', 'stroke="#15181b" stroke-width="1.2"') + C(276, 38, 1.6, '#fff', 'opacity=".7"') + hid('19', 283, 33, '#9fd3ff', 7, 0, .6) +
      floor(186) + G('translate(150 190)', R(-34, -6, 68, 26, '#3f4d57', 'stroke="#14191c"') + R(-30, -10, 60, 6, '#5a6a75')) + clipboard(128, 176, .36, -10) + tag('6', 108, 168) +
      star(186, 168, .55, '4') + vig();
  };
  SC['abisso:50'] = function () { return wall(50) + tank(40, 30, 220, 170, lanternfish(150, 120, .78, false) + R(40, 186, 220, 14, '#3a3628')) + vig(); };
  SC['abisso:6'] = function () { return wall(6) + clipboard(150, 112, 2.3, -4, 0) + G('rotate(-4 150 112)', T(102, 54, 'Lanterna abissale', 'font-size="14" fill="#2b4a6b" ' + HAND) + T(98, 76, 'luce bianca → si nasconde', 'font-size="11.5" fill="#2b4a6b" ' + HAND) + T(98, 96, 'luce BLU → si accende!', 'font-size="12.5" fill="#1f4f9e" ' + HAND) + T(98, 116, 'sempre la stessa sequenza', 'font-size="11.5" fill="#2b4a6b" ' + HAND) + T(98, 136, 'dalla testa alla coda', 'font-size="11.5" fill="#2b4a6b" ' + HAND) + G('translate(150 168) scale(.3)', lanternfish(0, 0, 1, false)) + T(108, 190, 'dott.ssa S. Marini', 'font-size="10" fill="#7a5a3a" ' + HAND)) + vig(); };
  SC['abisso:14'] = function () { return wall(14) + safe(70, 30, 160, 170, false) + vig(); };
  SC['abisso:38'] = function () { return wall(38) + cabinet(76, 22, 148, 186, false) + vig(); };
  SC['abisso:74'] = function () { return R(0, 0, 300, 220, '#1d2a12') + G('', hazard(300)) + G('translate(0 208)', hazard(300)) + cabinet(90, 40, 120, 150, true) + (function () { var o = ''; for (var i = 0; i < 7; i++) o += C(70 + i * 28, 90 + (i % 3) * 20, 26, '#a6e04a', 'opacity=".22" filter="url(#u-blur)" ' + anim('ua-float', i * .4)); return o; })() + T(150, 196, '−3:00', 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a" stroke="#000" stroke-width=".8"') + vig(); };
  SC['abisso:19'] = function () { return wall(190) + C(150, 110, 110, 'url(#u-glowB)', 'opacity=".35"') + filterDisc(150, 110, 2.4) + vig(); };
  SC['abisso:44'] = function () { return wall(44) + C(230, 100, 120, 'url(#u-glowB)', 'opacity=".25"') + torch(96, 116, 1.15, -8, 'b') + vig(); };
  SC['abisso:94'] = function () { return R(0, 0, 300, 220, '#020a14') + C(150, 110, 160, 'url(#u-glowB)', 'opacity=".25"') + lanternfish(145, 116, 1.12, true) + bubbles(0, 180, 300, 10, 94) + T(268, 210, 'testa →', 'text-anchor="end" font-size="11" fill="#9fe8ff" opacity=".0" ' + HAND) + vig(); };
  SC['abisso:86'] = function () { return R(0, 0, 300, 220, '#081620') + G('', hazard(300)) + G('translate(0 208)', hazard(300)) + tank(50, 26, 200, 170, lanternfish(150, 110, .6, false)) + crack(170, 90, 1.6) + (function () { var o = ''; for (var i = 0; i < 8; i++) o += G('', P('M' + (170 + i * 3) + ' 90q' + (20 + i * 8) + ' ' + (10 + i * 10) + ' ' + (30 + i * 14) + ' ' + (60 + i * 6), 'none', 'stroke="#8fd6ff" stroke-width="2" opacity=".6"'), anim('ua-blink', i * .15)); return o; })() + T(80, 194, '−3:00', 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a"') + vig(); };
  SC['abisso:60'] = function () { return wall(60) + safe(150, 40, 110, 140, true) + G('translate(205 110)', R(-40, -16, 80, 34, '#d9e8f5', 'rx="6" opacity=".9"') + syringe(0, 0, .52, 0)) + tag('30', 205, 76) + vig(); };
  SC['abisso:30'] = function () { return wall(30) + C(150, 110, 110, 'url(#u-glowB)', 'opacity=".25"') + syringe(150, 110, 1.6, -18) + vig(); };
  SC['abisso:45'] = function () { return wall(45) + lamp(150, 10, 'W') + floor(186) + C(150, 110, 120, 'url(#u-glowW)', 'opacity=".25"') + captain(140, 80, 1.05, true) + tag('41', 228, 52) + vig(); };
  SC['abisso:41'] = function () { return wall(41) + C(150, 110, 120, 'url(#u-glowO)', 'opacity=".3"') + key(150, 110, 1.6, -18, 'CAPSULA') + vig(); };
  SC['abisso:C'] = function () {
    return wall(31) + pipeH(0, 12, 300, 6) + pipeH(0, 30, 300, 4, true) + lamp(80, 38) + lamp(220, 38, 'R') +
      generator(108, 70, 96, 76, false) + fusebox(18, 54, 46, 70, 'empty') + tag('28', 40, 46) +
      valvePanel(214, 54, 76, 100, false) + tag('16', 252, 46) +
      hatch(118, 154, 76, 40, { win: false, wcol: '#d9a02a' }) + tag('31', 156, 150) +
      pump(80, 156, .6, false) + tag('22', 46, 140) +
      G('translate(232 176) rotate(8)', R(-14, -10, 28, 20, '#5a2a1a', 'rx="1"') + R(-12, -8, 24, 16, 'url(#u-paper)') + P('M-8 -2h16M-8 2h12', 'none', 'stroke="#2b4a6b" stroke-width=".8"')) + tag('8', 262, 176) +
      floor(180) + star(206, 204, .5, null, 'opacity=".55"') + water(186, 31) + G('translate(36 205) rotate(-20)', fuse(0, 0, .22, 0), 'opacity=".75"') + C(40, 200, 5, '#fff', 'opacity=".5" ' + anim('ua-blink', 0)) + hid('11', 54, 209, '#bfefff', 7.5, -10, .55) + vig();
  };
  SC['abisso:28'] = function () { return wall(28) + fusebox(84, 30, 120, 160, 'empty') + vig(); };
  SC['abisso:11'] = function () { return wall(110) + C(150, 110, 110, 'url(#u-glowB)', 'opacity=".2"') + water(150, 11, .7) + fuse(150, 108, 2.2, -12) + vig(); };
  SC['abisso:39'] = function () { return wall(39) + C(140, 110, 120, 'url(#u-glowG)', 'opacity=".22"') + fusebox(84, 30, 120, 160, 'ok') + vig(); };
  SC['abisso:64'] = function () { return R(0, 0, 300, 220, '#1d1a08') + G('', hazard(300)) + G('translate(0 208)', hazard(300)) + fusebox(70, 40, 100, 140, 'empty') + crowbar(170, 120, .55, -40) + (function () { var o = ''; for (var i = 0; i < 5; i++) o += P('M' + (130 + i * 6) + ' ' + (90 + i * 8) + 'l14 -8l-6 10l16 -6', 'none', 'stroke="#fff6a0" stroke-width="2" ' + anim('ua-blink', i * .12, .5)); return o; })() + C(140, 100, 60, 'url(#u-glowW)', anim('ua-flick', 0, .4)) + T(240, 120, '−3:00', 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a"') + vig(); };
  SC['abisso:16'] = function () { return wall(16) + valvePanel(75, 6, 150, 206, false) + vig(); };
  SC['abisso:8'] = function () {
    return wall(8) + G('rotate(2 150 110)', R(30, 20, 240, 184, '#3a2a18', 'rx="3"') + R(36, 24, 112, 176, 'url(#u-paper)') + R(152, 24, 112, 176, 'url(#u-paper)') +
      T(92, 44, 'MANUALE TECNICO', 'text-anchor="middle" font-size="8" font-weight="700" fill="#3a2a18" ' + MONO) + T(92, 56, 'Riavvio del GEN-2', 'text-anchor="middle" font-size="11" fill="#2b4a6b" ' + HAND) +
      gauge(60, 92, 13, .33, '#e2463a') + gauge(92, 92, 13, .55, '#3d7fe6') + gauge(124, 92, 13, .22, '#e6b93a') + T(60, 122, '3 bar', 'text-anchor="middle" font-size="11" fill="#a0281e" ' + HAND) + T(92, 122, '? bar', 'text-anchor="middle" font-size="11" fill="#1f4f9e" ' + HAND) + T(124, 122, '2 bar', 'text-anchor="middle" font-size="11" fill="#8a6416" ' + HAND) +
      E(94, 100, 22, 30, '#3a2a10', 'opacity=".72" filter="url(#u-blur1)"') + E(100, 118, 10, 8, '#3a2a10', 'opacity=".6"') +
      T(208, 52, 'TOTALE', 'text-anchor="middle" font-size="9" fill="#3a2a18" ' + MONO) + T(208, 84, '10 bar', 'text-anchor="middle" font-size="24" fill="#a0281e" ' + HAND) + L(170, 96, 248, 96, '#a0281e', 1.2) +
      T(208, 120, 'rossa + blu + gialla', 'text-anchor="middle" font-size="11" fill="#2b4a6b" ' + HAND) + T(208, 160, 'Non superare 9 bar', 'text-anchor="middle" font-size="10" fill="#7a5a3a" ' + HAND) + T(208, 174, 'per volantino.', 'text-anchor="middle" font-size="10" fill="#7a5a3a" ' + HAND)) + vig();
  };
  SC['abisso:77'] = function () { return wall(77) + lamp(80, 10, 'W') + lamp(220, 10, 'W') + C(150, 120, 140, 'url(#u-glowO)', 'opacity=".3" ' + anim('ua-glow', 0)) + generator(60, 70, 180, 120, true) + (function () { var o = ''; for (var i = 0; i < 4; i++) o += P('M' + (40 + i * 70) + ' 40q8 -10 0 -20q-8 -10 0 -20', 'none', 'stroke="#fff" stroke-opacity=".25" stroke-width="3" ' + anim('ua-float', i * .5)); return o; })() + vig(); };
  SC['abisso:31'] = function () { return wall(310) + lamp(150, 10, 'R') + hatch(70, 30, 160, 176, { win: false, wcol: '#d9a02a' }) + R(234, 90, 18, 34, '#1c2226', 'rx="2"') + led(243, 100, 'r', true) + T(243, 118, 'OFF', 'text-anchor="middle" font-size="6" fill="#ff8a7a" ' + MONO) + T(150, 22, 'CAPSULA DI RISALITA', 'text-anchor="middle" font-size="9" fill="#d9e8f5" letter-spacing="2" ' + MONO) + vig(); };
  SC['abisso:51'] = function () { return wall(51) + lamp(150, 10, 'W') + hatch(80, 30, 140, 176, { open: true, slid: true, glow: 'W', inside: '#2a1a10' }) + seat(130, 150, 1.1) + seat(170, 150, 1.1) + tag('D', 150, 90) + vig(); };
  SC['abisso:22'] = function () { return wall(22) + floor(150) + water(160, 22) + pump(150, 116, 1.6, false) + vig(); };
  SC['abisso:42'] = function () { return wall(42) + floor(120) + pump(70, 86, .9, true) + P('M120 220L140 120L160 120L180 220', 'none', 'stroke="#000" stroke-opacity=".2"') + star(196, 168, 2.6, '1') + (function () { var o = ''; for (var i = 0; i < 5; i++) o += E(40 + i * 56, 200 - (i % 2) * 14, 14, 3, '#9fd3ff', 'opacity=".25"'); return o; })() + vig(); };
  SC['abisso:D'] = function () {
    var o = R(0, 0, 300, 220, '#2a1a10') + P('M0 0Q150 -30 300 0V220Q150 250 0 220Z', '#3a2618');
    for (var i = 0; i < 9; i++) o += P('M' + (i * 38 - 4) + ' 0Q' + (i * 38 + 6) + ' 110 ' + (i * 38 - 4) + ' 220', 'none', 'stroke="#000" stroke-opacity=".3" stroke-width="2"');
    o += lamp(150, 6, 'W') + porthole(150, 52, 22, seaRays(120, 20, 60, 70) + fish(146, 52, .5, '#4fb6ff', 1, .4)) + seat(40, 160, 1) + seat(80, 160, 1) + seat(220, 160, 1) + seat(260, 160, 1);
    o += R(112, 100, 76, 70, '#1d2428', 'rx="5" stroke="#0a0d0f" stroke-width="1.4"') + R(118, 106, 30, 20, '#2a3238', 'rx="2"') + T(133, 119, 'ARMARE', 'text-anchor="middle" font-size="5.5" fill="#ff8a7a" ' + MONO) + C(133, 140, 9, '#c9d3d9', 'stroke="#2a3238"') + R(131, 133, 4, 14, '#2a3238', 'rx="1"') + tag('35', 133, 92) + keypad(154, 106, 30, 58, false) + tag('80', 170, 178);
    o += star(264, 72, 1.25, '6') + vig();
    return o;
  };
  SC['abisso:35'] = function () { return R(0, 0, 300, 220, '#2a1a10') + R(60, 24, 180, 176, '#1d2428', 'rx="10" stroke="#0a0d0f" stroke-width="2"') + R(90, 44, 120, 40, '#2a3238', 'rx="4"') + T(150, 72, 'ARMARE', 'text-anchor="middle" font-size="18" fill="#ff8a7a" ' + MONO + ' ' + anim('ua-blink', 0)) + C(150, 140, 34, '#c9d3d9', 'stroke="#2a3238" stroke-width="3"') + R(144, 114, 12, 52, '#2a3238', 'rx="3"') + C(150, 140, 6, '#0b0e10') + led(96, 182, 'r', true) + led(204, 182, 'r', true, .5) + vig(); };
  SC['abisso:76'] = function () { return R(0, 0, 300, 220, '#2a1a10') + C(150, 110, 150, 'url(#u-glowG)', 'opacity=".2"') + R(60, 24, 180, 176, '#1d2428', 'rx="10" stroke="#0a0d0f" stroke-width="2"') + R(90, 44, 120, 40, '#0d3b2b', 'rx="4"') + T(150, 72, 'ARMATA', 'text-anchor="middle" font-size="18" fill="#5dff9a" ' + MONO + ' ' + anim('ua-blink', 0)) + C(150, 140, 34, '#c9d3d9', 'stroke="#2a3238" stroke-width="3"') + G('rotate(90 150 140)', R(144, 114, 12, 52, '#2a3238', 'rx="3"')) + key(170, 140, .5, 0) + led(96, 182, 'g', true) + led(204, 182, 'g', true, .5) + vig(); };
  SC['abisso:80'] = function () { return R(0, 0, 300, 220, '#2a1a10') + keypad(80, 16, 140, 190, false) + vig(); };
  SC['abisso:99'] = function () {
    var o = R(0, 0, 300, 220, 'url(#u-sky)') + R(0, 70, 300, 150, 'url(#u-deep)', 'opacity=".9"') + C(150, -10, 70, 'url(#u-glowW)') + seaRays(0, 70, 300, 150) + P('M0 70q20 -6 40 0t40 0t40 0t40 0t40 0t40 0t40 0t40 0', 'none', 'stroke="#fff" stroke-opacity=".6" stroke-width="2" ' + anim('ua-wave', 0));
    o += G('', G('translate(150 140)', E(0, 0, 22, 34, '#e86a1f', 'stroke="#5a2408" stroke-width="2"') + E(-6, -10, 6, 14, '#fff', 'opacity=".25"') + C(0, -10, 7, 'url(#u-seaD)', 'stroke="#c9d3d9" stroke-width="2"') + R(-22, 6, 44, 4, '#c9d3d9') + T(0, 24, 'T-1', 'text-anchor="middle" font-size="7" fill="#fff" ' + MONO)) + bubbles(120, 170, 60, 12, 99, true), 'class="ua-rise"');
    return o + fish(60, 120, .8, '#4fb6ff', 1, .3) + fish(240, 150, .7, '#e6c33a', -1, .8) + vig();
  };

  function art(sid, id) {
    SP = [];
    var fn = SC[sid + ':' + id], inner = fn ? fn() : R(0, 0, 300, 220, '#333');
    return { svg: '<svg class="uc-svg" viewBox="0 0 300 220" preserveAspectRatio="xMidYMid slice" aria-hidden="true">' + inner + '</svg>', spots: SP.slice() };
  }

  /* ---------- la carta intera (HTML) ---------- */
  var KIND = { story: 'Storia', room: 'Stanza', red: 'Oggetto', blue: 'Oggetto', green: 'Macchina', yellow: 'Codice', grey: '', pen: 'Penalità', end: 'Fine' };
  function card(sid, id, o) {
    o = o || {};
    var c = UScen.get(sid).cards[id], a = art(sid, id), letter = /^[A-Z]$/.test(id);
    var num = id === 'start' ? '<span class="uc-num uc-go">▶</span>' : '<span class="uc-num' + (letter ? ' uc-let' : '') + '">' + id + '</span>';
    var chips = '';
    if (o.spots) a.spots.forEach(function (s) { chips += '<button class="uc-spot' + (s.h ? ' uc-hid' : '') + '" data-act="spot" data-id="' + s.id + '" style="left:' + f(s.x / 3) + '%;top:' + f(s.y / 2.2) + '%" aria-label="' + (s.h ? 'Qualcosa di nascosto' : 'Scopri ' + s.id) + '"></button>'; });
    var foot = '';
    if (c.disc && c.disc.length) foot += '<div class="uc-disc">' + c.disc.map(function (d) { return '<span>' + d + '</span>'; }).join('') + '</div>';
    if (c.mod) foot += '<div class="uc-mod">+' + c.mod + '</div>';
    var kind = KIND[c.k] || '';
    return '<div class="uc k-' + c.k + ' t-' + UScen.get(sid).theme + (o.cls ? ' ' + o.cls : '') + '" data-id="' + id + '"><div class="uc-in">' +
      '<div class="uc-band">' + num + '<span class="uc-tt">' + c.t + '</span>' + (kind ? '<span class="uc-kind">' + kind + '</span>' : '') + '</div>' +
      '<div class="uc-art">' + a.svg + chips + (c.mod ? '<div class="uc-modart">+' + c.mod + '</div>' : '') + '</div>' +
      (o.text === false ? '' : '<div class="uc-txt">' + c.x + foot + '</div>') + '</div></div>';
  }
  function back(sid, o) {
    o = o || {};
    var S = UScen.get(sid), th = S.theme;
    return '<div class="uc uc-back t-' + th + (o.cls ? ' ' + o.cls : '') + '"><div class="uc-in"><div class="ub-in"><svg viewBox="0 0 100 140" aria-hidden="true">' +
      '<defs><pattern id="' + uid('bp') + '" width="10" height="10" patternUnits="userSpaceOnUse"><path d="M0 5h10M5 0v10" stroke="rgba(255,255,255,.06)"/></pattern></defs>' +
      '<rect width="100" height="140" fill="none"/><circle cx="50" cy="62" r="30" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2"/><circle cx="50" cy="62" r="22" fill="none" stroke="rgba(255,255,255,.1)" stroke-width="6" stroke-dasharray="3 4"/>' +
      '<circle cx="50" cy="56" r="8" fill="#0c0f12"/><path d="M45 60h10l4 20h-18z" fill="#0c0f12"/><circle cx="50" cy="56" r="8" fill="none" stroke="url(#u-gold)" stroke-width="1.5"/>' +
      '<text x="50" y="114" text-anchor="middle" font-family="Bungee,sans-serif" font-size="12" fill="#ffe9a6">UNLOCK!</text><text x="50" y="126" text-anchor="middle" font-family="Nunito,sans-serif" font-size="6.5" font-weight="800" fill="rgba(255,255,255,.7)" letter-spacing="1">' + S.name.toUpperCase() + '</text></svg></div></div></div>';
  }
  function icon(n) {
    var I = {
      clock: '<circle cx="12" cy="13" r="8"/><path d="M12 9v4l3 2M9 2h6M12 2v3"/>', hint: '<path d="M9 18h6M10 21h4M12 3a6 6 0 0 0-3.5 10.9c.6.5 1 1.2 1 2.1h5c0-.9.4-1.6 1-2.1A6 6 0 0 0 12 3z"/>',
      combine: '<rect x="3" y="6" width="9" height="13" rx="2"/><rect x="12" y="4" width="9" height="13" rx="2"/><path d="M10 12h4"/>', pause: '<path d="M8 5v14M16 5v14"/>', play: '<path d="M7 5l12 7-12 7z"/>',
      eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z"/><circle cx="12" cy="12" r="3"/>', trash: '<path d="M4 7h16M9 7V4h6v3M6 7l1 13h10l1-13"/>', ping: '<circle cx="12" cy="12" r="3"/><path d="M5 12a7 7 0 0 1 14 0M2 12a10 10 0 0 1 20 0"/>',
      key: '<circle cx="7" cy="12" r="4"/><path d="M11 12h10M17 12v4M20 12v3"/>', gear: '<circle cx="12" cy="12" r="3"/><path d="M12 2v3M12 19v3M2 12h3M19 12h3M5 5l2 2M17 17l2 2M5 19l2-2M17 7l2-2"/>', star: '<path d="M12 3l2.8 5.8 6.2.9-4.5 4.4 1 6.3L12 17.5 6.5 20.4l1-6.3L3 9.7l6.2-.9z"/>',
      x: '<path d="M6 6l12 12M18 6L6 18"/>', log: '<path d="M5 4h14v16H5zM8 8h8M8 12h8M8 16h5"/>', back: '<path d="M15 5l-7 7 7 7"/>'
    };
    return '<svg class="ic" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (I[n] || '') + '</svg>';
  }
  return { defs: defs, art: art, card: card, back: back, icon: icon, KIND: KIND, scenes: SC, lanternfish: lanternfish, star: star, gauge: gauge, wheel: wheel, keypad: keypad };
})();
if (typeof module !== 'undefined') module.exports = UArt;
