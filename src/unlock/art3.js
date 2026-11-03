/* ===== Unlock!: illustrazioni di «Il teatro dell’illusionista» (3/4) e «Stazione Polare» (4/4) =====
   Stesse regole di art.js: disegni 300×220, numeri visibili con tag(), nascosti con hid(). */
(function () {
  var A = UArt, K = A.K, G = K.G, R = K.R, C = K.C, E = K.E, P = K.P, L = K.L, T = K.T, f = K.f, anim = K.anim, tag = K.tag, hid = K.hid, vig = K.vig, rnd = K.rnd, uid = K.uid;
  var MONO = K.MONO, HAND = K.HAND, SANS = K.SANS, SERIF = 'font-family="Georgia,\'Times New Roman\',serif"', DISP = 'font-family="Bungee,Nunito,sans-serif"';
  var SC = A.scenes, lg = A.lg, rg = A.rg;
  A.addDefs(
    lg('h-velv', [[0, '#4a050c'], [.35, '#b8202e'], [.55, '#d63240'], [1, '#4a050c']], 1, 0) + lg('h-board', [[0, '#9a6634'], [1, '#5a3618']]) + lg('h-boardL', [[0, '#d9a868'], [1, '#a8743e']]) +
    lg('h-wall', [[0, '#5a2236'], [1, '#22091a']]) + lg('h-gold', [[0, '#fff0b0'], [.45, '#e2b23e'], [.8, '#9a6a12'], [1, '#f0cf6a']], 1, 1) + rg('h-spot', [[0, '#fff6d8', .9], [.45, '#ffe7a0', .35], [1, '#ffd36a', 0]]) +
    lg('h-beam', [[0, '#fff3c8', .5], [1, '#fff3c8', 0]]) + lg('h-water', [[0, '#7fd8f0', .45], [.3, '#2a9ac4', .6], [1, '#06304e', .9]]) + lg('h-dark', [[0, '#1c1612'], [1, '#050404']]) +
    lg('h-leather', [[0, '#8a4a22'], [.5, '#6a3414'], [1, '#3a1a08']]) + lg('h-paper', [[0, '#fbf3df'], [1, '#e6d4ad']]) + lg('h-glass', [[0, '#cfefff', .35], [1, '#7fb8d8', .12]], 1, 1) +
    lg('i-sky', [[0, '#020814'], [.6, '#0b2140'], [1, '#1d4a6a']]) + lg('i-aur', [[0, '#5dffb0', 0], [.5, '#5dffb0', .6], [1, '#3aa0ff', 0]], 1, 0) + lg('i-aur2', [[0, '#c27bff', 0], [.5, '#ff7bd5', .35], [1, '#7bc8ff', 0]], 1, 0) +
    lg('i-snow', [[0, '#f4f9ff'], [1, '#b8cde0']]) + lg('i-plank', [[0, '#8a6a48'], [1, '#4e3620']]) + lg('i-frost', [[0, '#eef9ff', .9], [.5, '#cde9fb', .4], [1, '#9ccbe8', .1]]) +
    lg('i-metal', [[0, '#a8b6c0'], [.5, '#5a6872'], [1, '#2e3840']]) + lg('i-olive', [[0, '#76804c'], [1, '#3a4224']]) + rg('i-warm', [[0, '#ffd7a0', .85], [1, '#ff9a40', 0]]) +
    lg('i-ice', [[0, '#e6f6ff', .95], [.6, '#a6d8f2', .75], [1, '#6ab0d8', .6]], 1, 1) + lg('i-hangar', [[0, '#3a4650'], [1, '#141a20']]) + lg('i-bake', [[0, '#3c3a36'], [1, '#121110']])
  );
  function pen(bg, inner, txt) { return R(0, 0, 300, 220, bg) + inner + G('', K.hazard(300)) + G('translate(0 208)', K.hazard(300)) + T(150, 196, txt, 'text-anchor="middle" ' + DISP + ' font-size="20" fill="#ff5a4a" stroke="#000" stroke-width=".8"') + vig(); }
  function paper(x, y, w, h, rot, inner, fill) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')', R(-w / 2 + 3, -h / 2 + 4, w, h, 'rgba(0,0,0,.45)') + R(-w / 2, -h / 2, w, h, fill || 'url(#h-paper)', 'stroke="#a8946a" stroke-width=".8"') + (inner || '')); }
  function lines(x, y, rows, o) { o = o || {}; return rows.map(function (r, i) { return T(x, y + i * (o.lh || 12), r, (o.a || '') + ' font-size="' + (o.fs || 9) + '" fill="' + (o.c || '#1e1a14') + '" ' + (o.font || SERIF)); }).join(''); }

  /* =================================================================== */
  /* ===================== kit del teatro (1908) ======================= */
  /* =================================================================== */
  function wallpaper(seed) {
    var o = R(0, 0, 300, 220, 'url(#h-wall)'), x, y;
    for (y = 8; y < 220; y += 22) for (x = (y / 22 % 2) * 11 + 6; x < 300; x += 22) o += P('M' + x + ' ' + (y - 4) + 'l3 4l-3 4l-3 -4z', '#e2b23e', 'opacity=".22"');
    for (x = 0; x < 300; x += 44) o += L(x, 0, x, 220, '#000', .6, 'opacity=".25"');
    return o + R(0, 0, 300, 220, 'url(#u-vig)', 'opacity=".4"');
  }
  function floorWood(y) {
    var o = R(0, y, 300, 220 - y, 'url(#h-board)'), i;
    for (i = -12; i <= 12; i++) o += L(150 + i * 10, y, 150 + i * 30, 220, '#3a2008', .7, 'opacity=".6"');
    return o + R(0, y, 300, 3, '#2a1406', 'opacity=".7"');
  }
  function curtain(x, y, w, h, n, open) {
    var o = '', k = w / n, i, r = rnd(Math.round(x + w));
    for (i = 0; i < n; i++) o += R(x + i * k, y, k + .6, h, 'url(#h-velv)') + P('M' + f(x + i * k) + ' ' + f(y + h) + 'q' + f(k / 2) + ' ' + f(6 + r() * 4) + ' ' + f(k) + ' 0', 'url(#h-velv)');
    o += R(x, y, w, 18, 'url(#h-velv)') + R(x, y + 16, w, 3, 'url(#h-gold)');
    for (i = 0; i < w; i += 9) o += P('M' + f(x + i) + ' ' + (y + 19) + 'l4.5 7l4.5 -7', '#e2b23e', 'opacity=".9"');
    return o;
  }
  function proscenium(inner) {
    return inner + P('M0 0H300V220H284V30Q150 6 16 30V220H0Z', 'url(#h-gold)', 'opacity=".95"') + P('M16 30Q150 6 284 30', 'none', 'stroke="#6a4a0e" stroke-width="2"') +
      C(150, 16, 9, '#7a0f18', 'stroke="url(#h-gold)" stroke-width="2"') + T(150, 20, 'Z', 'text-anchor="middle" font-size="11" fill="#f0cf6a" font-style="italic" ' + SERIF);
  }
  function footlights(y) { var o = '', x; for (x = 18; x < 290; x += 22) o += E(x, y, 7, 3, '#ffe7a0', anim('ua-flick', x % 5 / 2)) + C(x, y - 2, 16, 'url(#h-spot)', 'opacity=".35"'); return o; }
  function bulbs(x, y, w, h) {
    var o = '', i, n;
    for (i = 0, n = Math.round(w / 16); i <= n; i++) o += C(x + i * w / n, y, 4, '#fff6c8', anim('ua-flick', i * .7)) + C(x + i * w / n, y + h, 4, '#fff6c8', anim('ua-flick', i * .4 + 1));
    for (i = 1, n = Math.round(h / 16); i < n; i++) o += C(x, y + i * h / n, 4, '#fff6c8', anim('ua-flick', i * .9)) + C(x + w, y + i * h / n, 4, '#fff6c8', anim('ua-flick', i * .5 + .3));
    return o;
  }
  function mirror(x, y, w, h) {
    return R(x - 10, y - 10, w + 20, h + 20, 'url(#h-gold)', 'rx="6"') + C(x + w / 2, y + h / 2, Math.max(w, h) * .8, 'url(#h-spot)', 'opacity=".25"') + R(x, y, w, h, '#2a3a46', 'rx="3"') + R(x, y, w, h, 'url(#h-glass)', 'rx="3"') +
      P('M' + (x + 6) + ' ' + (y + h - 8) + 'L' + (x + w * .5) + ' ' + (y + 6), 'none', 'stroke="#fff" stroke-opacity=".25" stroke-width="5"') + bulbs(x - 5, y - 5, w + 10, h + 10);
  }
  var SUIT = { '♠': '#1b1b1b', '♣': '#1b1b1b', '♥': '#c8261c', '♦': '#c8261c' };
  function pcard(x, y, s, rank, su, rot, fold) {
    var col = SUIT[su], body = fold ? P('M-12 -20H6L14 -12V18q0 2 -2 2H-12q-2 0 -2 -2V-18q0 -2 2 -2Z', '#fbf7ec', 'stroke="#3a3428" stroke-width="1"') + P('M6 -20L14 -12H8q-2 0 -2 -2Z', '#b8aa88', 'stroke="#3a3428" stroke-width=".8"') + P('M6 -20L14 -12', 'none', 'stroke="#000" stroke-opacity=".35" stroke-width="1.6"') : R(-14, -20, 28, 40, '#fbf7ec', 'rx="2" stroke="#3a3428" stroke-width="1"');
    var mid = /[JQK]/.test(rank) ? R(-7, -10, 14, 20, 'none', 'stroke="' + col + '" stroke-width=".8"') + T(0, 5, rank, 'text-anchor="middle" font-size="13" font-weight="700" fill="' + col + '" ' + SERIF) : T(0, 7, su, 'text-anchor="middle" font-size="18" fill="' + col + '"');
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-12, -17, 28, 40, 'rgba(0,0,0,.35)', 'rx="2"') + body + T(-11, -11, rank, 'font-size="8" font-weight="700" fill="' + col + '" ' + SERIF) + T(-11, -4, su, 'font-size="7" fill="' + col + '"') + mid);
  }
  function topHat(x, y, s, o) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 0, 22, 5, '#111', 'stroke="#333"') + P('M-14 0V-28q0 -3 3 -3H11q3 0 3 3V0Z', '#151515') + R(-14, -8, 28, 5, '#7a0f18') + P('M-11 -28H-4V-2H-11Z', '#fff', 'opacity=".07"') + (o || '')); }
  function suitLock() {
    var lk = R(-34, -18, 68, 30, 'url(#h-gold)', 'rx="3"');
    ['♠', '♣', '♥', '♦'].forEach(function (q, i) { var dx = -24 + i * 16; lk += R(dx - 6, -6, 12, 14, '#2a1a08', 'rx="1.5" stroke="#6a4a0e" stroke-width="1"') + T(dx, 5, '0', 'text-anchor="middle" font-size="8" fill="#f0cf6a" ' + MONO) + T(dx, -9, q, 'text-anchor="middle" font-size="10" fill="' + (q === '♥' || q === '♦' ? '#c8261c' : '#151515') + '"'); });
    return lk;
  }
  function trunk(x, y, s, open) {
    var lk = suitLock();
    var body = R(-70, -10, 140, 64, 'url(#h-leather)', 'rx="4" stroke="#2a1006" stroke-width="2"') + R(-70, 4, 140, 4, '#2a1006', 'opacity=".5"') + R(-70, 36, 140, 4, '#2a1006', 'opacity=".5"');
    [-70, 62].forEach(function (cx) { body += R(cx, -10, 8, 64, 'url(#h-gold)', 'opacity=".9"'); });
    body += T(0, 46, 'ZAMBRINI', 'text-anchor="middle" font-size="9" letter-spacing="3" fill="#f0cf6a" opacity=".85" ' + SERIF);
    var lid = open ? P('M-70 -10L-64 -64H64L70 -10Z', '#3a1a08', 'stroke="#2a1006" stroke-width="2"') + R(-60, -60, 120, 46, '#7a0f18', 'opacity=".9"') + C(0, -36, 30, 'url(#h-spot)', 'opacity=".4"') :
      P('M-70 -10Q0 -40 70 -10Z', 'url(#h-leather)', 'stroke="#2a1006" stroke-width="2"') + G('translate(0 10)', lk);
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 56, 80, 8, 'rgba(0,0,0,.45)') + body + lid);
  }
  function door(x, y, w, h, o) {
    o = o || {};
    var s = R(x - 4, y - 4, w + 8, h + 4, '#1e0c08', 'rx="2"') + R(x, y, w, h, '#5a2a18', 'rx="2"') + R(x + 6, y + 8, w - 12, h * .4, 'none', 'stroke="#3a1608" stroke-width="2"') + R(x + 6, y + h * .52, w - 12, h * .4, 'none', 'stroke="#3a1608" stroke-width="2"');
    if (o.star !== false) s += G('translate(' + (x + w / 2) + ' ' + (y + h * .3) + ')', P('M0 -9l2.6 6.4l6.9 .5l-5.3 4.4l1.7 6.7l-5.9 -3.7l-5.9 3.7l1.7 -6.7l-5.3 -4.4l6.9 -.5z', 'url(#h-gold)'));
    s += R(x + w - 16, y + h * .5 - 10, 8, 20, 'url(#h-gold)', 'rx="2"') + C(x + w - 12, y + h * .5 - 3, 2, '#120604') + R(x + w - 12.6, y + h * .5 - 2, 1.2, 6, '#120604');
    return s + (o.gap ? R(x, y + h - 2, w, 3, '#fff3c8', 'opacity=".5"') : '');
  }
  function wand(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-40, -2.4, 80, 4.8, '#0e0e0e', 'rx="2"') + R(-40, -2.4, 12, 4.8, '#f4ecd8', 'rx="2"') + R(28, -2.4, 12, 4.8, '#f4ecd8', 'rx="2"') + R(-28, -2, 56, 1.2, '#fff', 'opacity=".2"')); }
  function hairpin(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', P('M-32 3H26q7 0 7 -4.5t-7 -4.5H-24l4 -2l-4 -2l4 -2l-4 -2', 'none', 'stroke="#1e1e1e" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"') + P('M-28 2.4H24', 'none', 'stroke="#8a8a8a" stroke-width=".5"') + C(-32, 3, 1.8, '#1e1e1e') + C(-24, -13, 1.6, '#1e1e1e')); }
  function newspaper(x, y, s, rot) {
    var t = R(-60, -40, 120, 80, '#ece6d6', 'stroke="#8a826e"') + T(0, -28, 'CORRIERE DELLA SERA', 'text-anchor="middle" font-size="9.5" font-weight="700" fill="#151515" ' + SERIF) + L(-54, -24, 54, -24, '#151515', 1) + T(0, -14, 'Zambrini sfida l’acqua', 'text-anchor="middle" font-size="8" font-style="italic" fill="#151515" ' + SERIF), i, j;
    for (j = 0; j < 3; j++) for (i = 0; i < 8; i++) t += R(-54 + j * 37, -6 + i * 5, 32 - (i * 7 + j * 3) % 9, 1.6, '#6a645a', 'opacity=".7"');
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-57, -36, 120, 80, 'rgba(0,0,0,.35)') + t);
  }
  function fuse(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-6, -16, 12, 32, '#f2efe6', 'rx="5" stroke="#9a968a"') + R(-6.6, -16, 13.2, 6, 'url(#h-gold)', 'rx="2"') + R(-6.6, 10, 13.2, 6, 'url(#h-gold)', 'rx="2"') + R(-3, -6, 6, 12, '#d6d0c0', 'rx="1"') + T(0, 2, '25A', 'text-anchor="middle" font-size="3.6" fill="#6a645a" ' + MONO)); }
  function fuseBox(x, y, s, full) {
    var o = R(-34, -44, 68, 88, '#3a4046', 'rx="4" stroke="#1a1e22" stroke-width="2"') + R(-28, -38, 56, 76, '#22272c', 'rx="2"') + T(0, -28, '⚡ PALCO', 'text-anchor="middle" font-size="7" fill="#ffd23d" ' + MONO);
    [-16, 0, 16].forEach(function (dx, i) { o += R(dx - 6, -18, 12, 40, '#141618', 'rx="2"') + (i !== 1 || full ? fuse(dx, 2, .9) : R(dx - 2, -10, 4, 24, '#000') + C(dx, 2, 8, 'url(#u-glowR)', 'opacity=".4" ' + anim('ua-blink', 0))); });
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  var GEL = { VERDE: '#3fae6a', AMBRA: '#e39a2a', BLU: '#3d6fe0', VIOLA: '#8a52c8', BIANCO: '#f4f0e2', ROSSO: '#d9453a' };
  function lightBoard(x, y, s, on, up) {
    var o = R(-80, -46, 160, 92, '#2a2420', 'rx="6" stroke="#0e0b09" stroke-width="2"') + R(-74, -40, 148, 14, 'url(#h-gold)', 'rx="2"') + T(0, -30, 'LUCI DI SCENA', 'text-anchor="middle" font-size="8" letter-spacing="2" fill="#3a2608" ' + MONO);
    ['VERDE', 'AMBRA', 'BLU', 'VIOLA', 'BIANCO', 'ROSSO'].forEach(function (k, i) {
      var dx = -60 + i * 24, u = up && up.indexOf(k) >= 0;
      o += R(dx - 3, -18, 6, 46, '#0e0b09', 'rx="3"') + G('', R(dx - 7, u ? -18 : 12, 14, 8, GEL[k], 'rx="2" stroke="#000" stroke-width=".6"') + L(dx, u ? -14 : 16, dx, u ? -24 : 26, '#9aa7ae', 2)) +
        C(dx, 36, 3.4, on ? GEL[k] : '#3a3430', on ? anim('ua-glow', i * .3) : '') + T(dx, 44, k, 'text-anchor="middle" font-size="4.6" fill="#d8ccb6" ' + MONO);
    });
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function workLight(x, y) { return C(x, y, 70, 'url(#h-spot)', 'opacity=".45" ' + anim('ua-flick', 1)) + L(x, y + 6, x, 200, '#1a1a1a', 3) + P('M' + (x - 16) + ' 200h32', 'none', 'stroke="#1a1a1a" stroke-width="3"') + R(x - 5, y - 4, 10, 6, '#555') + C(x, y + 6, 6, '#fffbe8') + P('M' + (x - 8) + ' ' + y + 'L' + x + ' ' + (y + 16) + 'L' + (x + 8) + ' ' + y, 'none', 'stroke="#333" stroke-width="1"'); }
  function tank(x, y, s, lvl, o) {
    o = o || {};
    var w = 70, h = 100, wy = 50 - h * lvl, i, b = '';
    var man = G('', E(0, -26, 9, 10, '#e8c09a') + P('M-9 -30q9 -10 18 0', '#2a1a10') + P('M-5 -22q5 3 10 0', 'none', 'stroke="#2a1a10" stroke-width="1.6"') + P('M-14 -14q14 -8 28 0V50H-14Z', '#efe9dc') + P('M-14 -14l-12 -18M14 -14l12 -18', 'none', 'stroke="#efe9dc" stroke-width="6" stroke-linecap="round"') + C(-27, -33, 4, '#e8c09a') + C(27, -33, 4, '#e8c09a'));
    for (i = 0; i < 6; i++) b += C(-24 + i * 10, 40, 1.4 + i % 3 * .6, '#dff6ff', 'opacity=".8" ' + anim('ua-bub', i * .8, 3 + i % 3));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 56, 50, 6, 'rgba(0,0,0,.5)') + R(-w / 2 - 6, 46, w + 12, 10, 'url(#h-gold)', 'rx="2"') + R(-w / 2 - 6, -56, w + 12, 8, 'url(#h-gold)', 'rx="2"') + R(-w / 2, -48, w, h - 2, '#0a1a24', 'opacity=".6"') +
      (o.man === false ? '' : man) + G('', R(-w / 2, wy, w, 48 - wy, 'url(#h-water)') + P('M' + (-w / 2) + ' ' + wy + 'q8 -3 17 0t17 0t17 0t19 0', 'none', 'stroke="#dff6ff" stroke-width="1.2" opacity=".8"'), anim('ua-wave', 0, 2.2)) + b +
      R(-w / 2, -48, w, h - 2, 'url(#h-glass)') + R(-w / 2, -48, w, h - 2, 'none', 'stroke="#bfe6f6" stroke-width="1.5" stroke-opacity=".7"') + R(-w / 2 + 4, -44, 4, h - 10, '#fff', 'opacity=".25"') + (o.lock ? G('translate(0 52)', R(-14, -8, 28, 16, 'url(#h-gold)', 'rx="2"') + [-9, -3, 3, 9].map(function (dx) { return R(dx - 2.4, -5, 4.8, 9, '#fbf7ec', 'rx=".8"'); }).join('')) : ''));
  }
  function pipeValve(x, y, s, wheel, cracked) {
    var o = R(-90, -6, 70, 12, 'url(#i-metal)') + R(-24, -10, 6, 20, '#5a6872') + C(0, 0, 14, '#6a7680', 'stroke="#2e3840" stroke-width="2"') + R(18, -10, 6, 20, '#5a6872') + R(20, -6, 60, 12, 'url(#i-metal)') + R(-2.5, -26, 5, 18, '#8a96a0');
    o += wheel ? G('translate(0 -28)', K.wheel(0, 0, 14, '#c9a24a')) : R(-4, -30, 8, 6, '#c9d2d8', 'rx="1"') + T(0, -36, '?', 'text-anchor="middle" font-size="12" fill="#ffd23d" ' + DISP);
    if (cracked) o += P('M-60 -6l6 5l-4 4l5 4', 'none', 'stroke="#000" stroke-width="1.4"') + P('M-56 0q-20 -30 -40 -10M-56 0q-10 30 -30 40M-56 0q-30 0 -40 20', 'none', 'stroke="#9fe0ff" stroke-width="3" stroke-linecap="round" opacity=".8" ' + anim('ua-flick', 0));
    else if (!wheel) o += P('M80 0q14 6 12 30', 'none', 'stroke="#7fd0f0" stroke-width="3" opacity=".7" ' + anim('ua-flick', .3));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function mallet(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-4, -10, 8, 70, '#a8743e', 'rx="3"') + R(-24, -30, 48, 26, '#7a4a22', 'rx="5" stroke="#3a2008" stroke-width="1.5"') + R(-24, -24, 48, 3, '#3a2008', 'opacity=".5"')); }
  function understage(seed) {
    var o = R(0, 0, 300, 220, 'url(#h-dark)'), r = rnd(seed || 3), i;
    for (i = 0; i < 6; i++) o += R(i * 56 - 6, 0, 10, 220, '#2a1a10') + R(i * 56 - 6, 0, 3, 220, '#4a3020', 'opacity=".6"');
    o += R(0, 0, 300, 14, '#3a2414') + R(0, 12, 300, 4, '#000', 'opacity=".5"');
    for (i = 0; i < 9; i++) o += L(r() * 300, 0, r() * 300, 220, '#8a7050', .8 + r(), 'opacity=".35"');
    o += C(150, 4, 4, '#fff3c8') + P('M150 6L80 220H220Z', 'url(#h-beam)', 'opacity=".25"');
    return o + R(0, 196, 300, 24, '#1a120c');
  }
  function mask(x, y, s, kind, label) {
    var o = '';
    if (kind === 'arlecchino') o = '<clipPath id="ma' + Math.round(x) + '"><circle cx="0" cy="0" r="16"/></clipPath>' + G('', [-2, -1, 0, 1].map(function (i) { return [-2, -1, 0, 1].map(function (j) { return P('M' + (i * 10) + ' ' + (j * 10 + 5) + 'l5 -5l5 5l-5 5z', ['#d9453a', '#3fae6a', '#e6c23a', '#3d6fe0'][(i + j + 4) % 4]); }).join(''); }).join(''), 'clip-path="url(#ma' + Math.round(x) + ')"') + P('M-13 -3q13 -10 26 0q-4 8 -13 6q-9 2 -13 -6z', '#111') + E(-6, -1, 2.6, 2, '#000') + E(6, -1, 2.6, 2, '#000');
    if (kind === 'pulcinella') o = C(0, 2, 15, '#f4ecd8') + P('M-10 -16q10 -16 20 0', '#f4f4f4', 'stroke="#ccc"') + P('M-13 -4q13 -9 26 0v6q-4 4 -8 2l-5 10l-5 -10q-4 2 -8 -2z', '#151515') + E(-6, -2, 2.4, 2, '#f4ecd8') + E(6, -2, 2.4, 2, '#f4ecd8') + P('M-4 10q4 3 8 0', 'none', 'stroke="#7a2a1a" stroke-width="1.4"');
    if (kind === 'colombina') o = C(0, 2, 15, '#f8dccc') + P('M-15 -10q15 -12 30 0', '#3a2a1a') + P('M-14 -4q7 -6 14 0q7 -6 14 0q-2 6 -7 6q-5 0 -7 -3q-2 3 -7 3q-5 0 -7 -6z', '#2a7ac8', 'stroke="#e2b23e" stroke-width="1"') + E(-6, -2, 2.4, 1.6, '#111') + E(6, -2, 2.4, 1.6, '#111') + P('M-3 9q3 2 6 0', 'none', 'stroke="#c8261c" stroke-width="1.6"') + C(-10, -12, 3, '#d9453a') + C(10, -12, 3, '#d9453a');
    if (kind === 'pantalone') o = C(0, 0, 14, '#e8c09a') + P('M-16 -12q16 -10 32 0v4h-32z', '#7a0f18') + P('M-13 -4q13 -6 26 0v4q-6 2 -9 0l-4 10l-4 -10q-3 2 -9 0z', '#2a1a10') + E(-6, -1, 2.4, 1.8, '#e8c09a') + E(6, -1, 2.4, 1.8, '#e8c09a') + P('M-5 10q5 14 5 16q0 -2 5 -16', '#f4f4f4', 'stroke="#bbb"');
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', C(1, 2, 17, 'rgba(0,0,0,.35)') + o + (label ? T(0, 30, label, 'text-anchor="middle" font-size="6.4" font-weight="700" fill="#f0cf6a" ' + SERIF) : ''));
  }
  function seats(x, y, n) { var o = '', i; for (i = 0; i < n; i++) o += G('translate(' + (x + i * 30) + ' ' + y + ')', R(-12, -24, 24, 26, '#9a1822', 'rx="6"') + R(-14, 0, 28, 10, '#7a0f18', 'rx="3"') + R(-12, -24, 24, 4, '#c4303a', 'rx="2"') + R(-10, 10, 3, 10, '#2a1406') + R(7, 10, 3, 10, '#2a1406')); return o; }
  function woodBox(x, y, s, open) {
    var ks = ['pulcinella', 'colombina', 'pantalone', 'arlecchino'], o = E(0, 44, 90, 8, 'rgba(0,0,0,.5)') + R(-84, -6, 168, 50, '#7a4a22', 'rx="4" stroke="#3a2008" stroke-width="2"') + R(-84, 10, 168, 3, '#3a2008', 'opacity=".4"');
    if (open) o += P('M-84 -6L-76 -60H76L84 -6Z', '#5a3418', 'stroke="#3a2008" stroke-width="2"') + R(-70, -56, 140, 44, '#e8e0f0', 'opacity=".9"') + C(0, -30, 40, 'url(#h-spot)', 'opacity=".4"');
    else {
      o += P('M-84 -6L-84 -32Q0 -46 84 -32V-6Z', '#8a5a2c', 'stroke="#3a2008" stroke-width="2"');
      ks.forEach(function (k, i) { var dx = -60 + i * 40; o += mask(dx, -16, .62, k) + R(dx - 8, 16, 16, 18, '#1a1006', 'rx="2" stroke="url(#h-gold)" stroke-width="1.2"') + T(dx, 29, '0', 'text-anchor="middle" font-size="11" fill="#f0cf6a" ' + MONO) + T(dx, 46, ['PULCINELLA', 'COLOMBINA', 'PANTALONE', 'ARLECCHINO'][i], 'text-anchor="middle" font-size="5.6" fill="#f8e8c0" font-weight="700" ' + SERIF); });
    }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function ghostRays(x, y, n) { var o = '', i; for (i = 0; i < n; i++) o += P('M' + x + ' ' + y + 'l' + f(-140 + i * 280 / (n - 1)) + ' 240h30z', 'url(#h-beam)', 'opacity=".2" ' + anim('ua-ray', i)); return o; }

  /* ------------------------- carte del teatro ------------------------- */
  var S = {};
  S.start = function () {
    var o = R(0, 0, 300, 220, '#14060a') + curtain(16, 18, 268, 170, 14) + R(16, 186, 268, 34, 'url(#h-boardL)') + footlights(192);
    o += C(150, 96, 70, 'url(#h-spot)', 'opacity=".55"') + G('translate(150 104)', R(-62, -46, 124, 92, 'url(#h-paper)', 'stroke="#6a4a0e" stroke-width="3"') + R(-56, -40, 112, 80, 'none', 'stroke="#b8202e" stroke-width="1.5"') +
      T(0, -26, 'TEATRO VESPUCCI · STASERA', 'text-anchor="middle" font-size="6.4" letter-spacing="1" fill="#3a2a10" ' + SERIF) + T(0, -10, 'IL GRANDE', 'text-anchor="middle" font-size="9" fill="#7a0f18" font-weight="700" ' + SERIF) + T(0, 8, 'ZAMBRINI', 'text-anchor="middle" font-size="19" fill="#7a0f18" font-weight="700" ' + SERIF) +
      T(0, 22, 'LA SPARIZIONE', 'text-anchor="middle" font-size="8" letter-spacing="2" fill="#1a1a1a" ' + SERIF) + topHat(0, 38, .4));
    o += tank(256, 150, .38, .82) + C(256, 150, 30, 'url(#u-glowR)', 'opacity=".25" ' + anim('ua-blink', 0));
    return proscenium(o) + vig() + tag('A', 40, 196);
  };
  S.A = function () {
    var o = wallpaper(1) + floorWood(170);
    o += door(14, 40, 62, 132, { gap: true }) + mirror(112, 34, 78, 62) + R(96, 108, 112, 10, '#5a2a18') + R(100, 118, 104, 52, '#3a1608') + R(104, 124, 46, 20, '#4a200e', 'stroke="#2a0e04"') + R(154, 124, 46, 20, '#4a200e', 'stroke="#2a0e04"');
    o += pcard(120, 100, .45, '7', '♠', -18, true) + pcard(132, 100, .45, 'Q', '♥', 4) + pcard(144, 102, .45, '3', '♥', 16, true) + E(184, 102, 9, 6, '#f8e0e8', 'stroke="#c9a0b0"') + E(184, 98, 9, 3, '#fff') + hid('7', 197, 104, '#e2d6c0', 8, 0, .5);
    o += G('translate(258 24)', R(-22, -2, 44, 64, 'url(#h-paper)', 'stroke="#6a4a0e"') + T(0, 8, 'IL GRANDE', 'text-anchor="middle" font-size="5.4" fill="#7a0f18" ' + SERIF) + T(0, 18, 'ZAMBRINI', 'text-anchor="middle" font-size="8.4" font-weight="700" fill="#7a0f18" ' + SERIF) + topHat(0, 50, .5));
    o += trunk(248, 168, .5, false) + R(214, 64, 2, 40, '#2a1a0a') + P('M214 64h70', 'none', 'stroke="#2a1a0a" stroke-width="2"') + P('M226 66l-8 40h22z', '#7a0f18') + P('M254 66l-8 44h24z', '#2a5a8a') + P('M276 66l-6 34h14z', '#e2b23e');
    return o + vig() + tag('8', 45, 92) + tag('37', 151, 52) + tag('33', 132, 128) + tag('24', 248, 140) + tag('10', 258, 76);
  };
  S['10'] = function () {
    var t = R(-70, -92, 140, 184, 'none', 'stroke="#b8202e" stroke-width="2"') + T(0, -78, 'TEATRO VESPUCCI · MILANO', 'text-anchor="middle" font-size="6.6" letter-spacing="1" fill="#3a2a10" ' + SERIF) + T(0, -62, 'IL GRANDE', 'text-anchor="middle" font-size="10" fill="#7a0f18" font-weight="700" ' + SERIF) + T(0, -42, 'ZAMBRINI', 'text-anchor="middle" font-size="24" font-weight="700" fill="#7a0f18" ' + SERIF) +
      T(0, -30, 'l’uomo che piega il destino', 'text-anchor="middle" font-size="7.4" font-style="italic" fill="#1a1a1a" ' + SERIF) + topHat(-30, 10, .9) + G('translate(30 4)', C(0, -12, 10, '#f8dccc') + P('M-10 -16q10 -12 20 0q-2 -8 -10 -8q-8 0 -10 8z', '#3a2010') + P('M-12 30q12 -40 24 0z', '#c4303a') + C(0, -26, 3, '#d9453a') + pcard(14, 14, .32, 'Q', '♥', 12)) +
      T(0, 42, 'con la graziosa MADAME ROSA', 'text-anchor="middle" font-size="7.6" fill="#1a1a1a" ' + SERIF) + T(0, 52, 'la regina del suo cuore', 'text-anchor="middle" font-size="7.2" font-style="italic" fill="#b8202e" ' + SERIF) + L(-50, 60, 50, 60, '#b8202e', .8) +
      T(0, 72, 'Per la prima volta senza il Conte Moretti,', 'text-anchor="middle" font-size="6.2" fill="#3a2a10" ' + SERIF) + T(0, 81, 'suo compagno di scena dal 1905 al 1908', 'text-anchor="middle" font-size="6.2" fill="#3a2a10" ' + SERIF);
    return wallpaper(10) + paper(150, 110, 150, 196, -1, t) + vig();
  };
  S['33'] = function () {
    var o = R(0, 0, 300, 220, '#3a1608') + R(0, 0, 300, 220, 'url(#u-vig)', 'opacity=".5"') + C(150, 100, 120, 'url(#h-spot)', 'opacity=".25"');
    var cs = [['4', '♠', 0], ['7', '♠', 1], ['Q', '♥', 0], ['A', '♣', 1], ['5', '♦', 0], ['3', '♥', 1], ['9', '♦', 1]];
    cs.forEach(function (c, i) { o += pcard(36 + i * 38, 104 + (i % 2) * 18, 1.5, c[0], c[1], -12 + i * 4, !!c[2]); });
    return o + vig();
  };
  S['24'] = function () { return wallpaper(24) + floorWood(150) + trunk(150, 128, 1.1, false) + G('translate(150 78) scale(2.4)', R(-36, -20, 72, 34, 'rgba(0,0,0,.45)', 'rx="4"') + suitLock()) + T(150, 32, '«Per ogni seme, la mia carta»', 'text-anchor="middle" font-size="11" font-style="italic" fill="#f0cf6a" ' + SERIF) + vig(); };
  S['45'] = function () { return wallpaper(45) + floorWood(160) + trunk(150, 136, 1.15, true) + newspaper(98, 110, .45, -12) + wand(156, 118, .7, 18) + G('translate(212 108) rotate(8)', R(-18, -22, 36, 44, '#3a5a3a', 'rx="2"') + R(-18, -22, 4, 44, '#203a20') + L(-12, 0, 16, 0, '#d9453a', 2)) + vig() + tag('11', 96, 96) + tag('4', 160, 96) + tag('29', 214, 82); };
  S['11'] = function () { return R(0, 0, 300, 220, '#3a1608') + newspaper(150, 110, 1.6, -4) + vig(); };
  S['4'] = function () { return R(0, 0, 300, 220, '#7a0f18') + R(0, 0, 300, 220, 'url(#u-vig)', 'opacity=".5"') + C(150, 110, 90, 'url(#h-spot)', 'opacity=".3"') + wand(150, 110, 2.6, -22) + C(206, 86, 3, '#fff', anim('ua-blink', 0)) + C(220, 72, 2, '#fff', anim('ua-blink', .6)) + C(196, 66, 2, '#fff', anim('ua-blink', 1.1)) + vig(); };
  S['29'] = function () {
    var l = lines(-80, -72, ['Promemoria', '1. Botola: croce di gesso ROSSO', '   (le bianche: macchinisti).', '   Numero: prima l’asse, poi la quinta.', '2. Con Moretti: ogni lettera avanti', '   di tanti posti quanti gli anni', '   passati insieme.', '3. Rosa è la mia regina:', '   regina del seme rosso,', '   ma non quadri.'], { fs: 10.6, lh: 15.5, font: HAND, c: '#1d2a50' });
    return R(0, 0, 300, 220, '#3a5a3a') + paper(150, 110, 176, 184, 1.5, l) + vig();
  };
  S['8'] = function () { return wallpaper(8) + floorWood(190) + door(90, 14, 120, 178, { gap: true }) + G('translate(198 104) scale(2.2)', C(0, 0, 3.5, '#120604') + R(-1.2, 1, 2.4, 7, '#120604')) + C(198, 104, 10, 'url(#u-glowW)', 'opacity=".3"') + vig(); };
  S['12'] = function () { return pen('#2a0a10', door(110, 30, 80, 140, {}) + wand(176, 102, .9, -30) + T(214, 70, '?!', 'font-size="22" fill="#ffd23d" ' + DISP), '−2:00'); };
  S['19'] = function () { return wallpaper(19) + floorWood(176) + door(90, 14, 120, 168, {}) + P('M70 180L230 180L250 212L50 212Z', '#ece6d6', 'stroke="#8a826e"') + T(150, 196, 'CORRIERE DELLA SERA', 'text-anchor="middle" font-size="8" fill="#151515" ' + SERIF) + G('translate(198 102) scale(2.2)', C(0, 0, 3.5, '#120604') + R(-1.2, 1, 2.4, 7, '#120604')) + vig(); };
  S['7'] = function () { return R(0, 0, 300, 220, '#4a200e') + R(0, 0, 300, 220, 'url(#u-vig)', 'opacity=".5"') + C(150, 110, 90, 'url(#h-spot)', 'opacity=".3"') + hairpin(150, 112, 3, -12) + vig(); };
  S['26'] = function () {
    var o = R(0, 0, 300, 220, '#120806') + P('M60 0H240L280 220H20Z', '#2a1408') + floorWood(170) + P('M60 0L60 170M240 0L240 170', 'none', 'stroke="#000" stroke-width="3"');
    o += G('', R(100, 18, 100, 152, '#1a0c06') + curtain(106, 20, 88, 150, 6), 'opacity=".9"') + C(150, 90, 60, 'url(#h-spot)', 'opacity=".3"') + newspaper(150, 192, .6, 0) + K.key(150, 188, .7, 0);
    return o + vig() + tag('B', 150, 120);
  };
  S['37'] = function () { return wallpaper(37) + mirror(80, 40, 140, 120) + vig(); };
  S.B = function () {
    var o = R(0, 0, 300, 220, '#0c0806') + R(0, 0, 300, 120, '#1a1410') + floorWood(120) + R(0, 0, 18, 220, 'url(#h-velv)') + R(282, 0, 18, 220, 'url(#h-velv)');
    o += workLight(150, 70) + fuseBox(40, 64, .6, false) + lightBoard(236, 58, .55, false) + G('translate(96 132)', R(-2, 0, 4, 46, '#2a2a2a') + R(-22, -34, 44, 34, 'url(#h-paper)', 'transform="rotate(-6)"') + lines(-18, -24, ['Luci', '— — —', '— — —'], { fs: 6, lh: 7, font: HAND, c: '#1d2a50' }));
    o += G('translate(206 166)', R(-28, -14, 56, 28, '#5a3a1e') + R(-20, -20, 34, 8, '#ece0c8', 'transform="rotate(4)"') + [0, 1, 2, 3, 4].map(function (i) { return R(-18 + i * 6, -19, 5, 5, ['#3d6fe0', '#f4f0e2', '#d9453a', '#e39a2a', '#3fae6a'][i]); }).join(''));
    o += G('translate(262 174)', R(-2, 0, 4, 34, '#3a2010') + R(-14, -2, 28, 5, '#5a3418', 'rx="2"') + topHat(0, -2, .5)) + hid('14', 262, 156, '#8a7a6a', 7, 0, .4);
    return o + vig() + tag('21', 40, 34) + tag('30', 236, 28) + tag('16', 96, 104) + tag('38', 206, 140);
  };
  S['14'] = function () { return R(0, 0, 300, 220, '#1a1410') + topHat(110, 150, 1.6) + fuse(200, 110, 2.6, 20) + C(200, 110, 60, 'url(#h-spot)', 'opacity=".25"') + vig(); };
  S['21'] = function () { return R(0, 0, 300, 220, '#2a2622') + fuseBox(150, 110, 1.9, false) + vig(); };
  S['28'] = function () { return pen('#0a0c1e', fuseBox(150, 96, 1.2, false) + hairpin(170, 92, 1, -50) + P('M150 60l-10 20h12l-8 22', 'none', 'stroke="#9fd3ff" stroke-width="3" ' + anim('ua-blink', 0)) + C(150, 92, 40, 'url(#u-glowW)', 'opacity=".4" ' + anim('ua-blink', .2)), '−2:00'); };
  S['35'] = function () { return R(0, 0, 300, 220, '#2a2622') + fuseBox(90, 110, 1.4, true) + lightBoard(214, 110, .7, true) + vig(); };
  S['16'] = function () {
    var l = lines(-74, -64, ['COPIONE DELLE LUCI'], { fs: 10, font: MONO, c: '#3a2a10' }) + lines(-74, -44, ['Atto I:  «Laguna di Venezia»', '         «Violetta di Parma»', 'Atto II: «Tramonto di Sorrento»', '         «Fuoco del Vesuvio»', '         «Luna di Capri»', '         «Notte di Venezia»'], { fs: 7.6, lh: 12, font: MONO }) +
      lines(-74, 34, ['FINALE – La Sparizione:', 'le luci dell’Atto II', 'in ORDINE INVERSO!'], { fs: 12, lh: 13, font: HAND, c: '#b8202e' });
    return R(0, 0, 300, 220, '#1a1410') + paper(150, 110, 178, 184, -1.5, l) + vig();
  };
  S['38'] = function () {
    var sw = [['Violetta di Parma', 'VIOLA'], ['Tramonto di Sorrento', 'AMBRA'], ['Laguna di Venezia', 'VERDE'], ['Luna di Capri', 'BIANCO'], ['Notte di Venezia', 'BLU'], ['Fuoco del Vesuvio', 'ROSSO']], o = '';
    sw.forEach(function (s, i) { var x = -96 + (i % 3) * 68, y = -50 + Math.floor(i / 3) * 62, w = s[0].split(' '); o += R(x + 6, y, 52, 30, GEL[s[1]], 'stroke="#2a2a2a" stroke-width=".8" opacity=".92"') + R(x + 6, y, 52, 30, 'url(#h-glass)') + T(x + 32, y + 40, w[0], 'text-anchor="middle" font-size="7.6" font-style="italic" font-weight="700" fill="#1a1a1a" ' + SERIF) + T(x + 32, y + 49, w.slice(1).join(' '), 'text-anchor="middle" font-size="7" font-style="italic" fill="#1a1a1a" ' + SERIF); });
    return R(0, 0, 300, 220, '#1a1410') + paper(150, 112, 214, 160, 1, T(0, -56, 'GELATINE PER RIFLETTORI', 'text-anchor="middle" font-size="7.4" letter-spacing="1" fill="#3a2a10" ' + MONO) + o) + vig();
  };
  S['30'] = function () { return R(0, 0, 300, 220, '#1a1410') + lightBoard(150, 110, 1.55, false) + vig(); };
  S['50'] = function () {
    // il palco visto dall’alto: assi numerate sul bordo, quinte numerate sul lato
    var o = R(0, 0, 300, 220, '#0c0806') + ghostRays(150, -20, 4), x0 = 52, y0 = 18, cw = 24, rh = 19, i;
    o += R(x0, y0, cw * 9, rh * 9, 'url(#h-boardL)');
    for (i = 0; i <= 9; i++) o += L(x0 + i * cw, y0, x0 + i * cw, y0 + rh * 9, '#6a4220', 1.2) + L(x0, y0 + i * rh, x0 + cw * 9, y0 + i * rh, '#8a5a2c', .6, 'stroke-dasharray="2 3" opacity=".8"');
    for (i = 0; i < 9; i++) { o += T(x0 + i * cw + cw / 2, y0 + rh * 9 + 13, String(i + 1), 'text-anchor="middle" font-size="10" font-weight="700" fill="#f0cf6a" ' + MONO); o += R(x0 - 22, y0 + rh * 9 - (i + 1) * rh + 2, 12, rh - 4, '#5a1018', 'rx="1"') + T(x0 - 28, y0 + rh * 9 - i * rh - 6, String(i + 1), 'text-anchor="end" font-size="9" font-weight="700" fill="#f0cf6a" ' + MONO); }
    o += T(x0 + cw * 4.5, y0 + rh * 9 + 25, 'ASSI · bordo del palco (platea)', 'text-anchor="middle" font-size="6" fill="#c9b48a" ' + MONO) + T(12, y0 + rh * 4.5, 'QUINTE', 'text-anchor="middle" font-size="6" fill="#c9b48a" transform="rotate(-90 12 ' + (y0 + rh * 4.5) + ')" ' + MONO);
    function cross(cx, cy, col) { return P('M' + (cx - 7) + ' ' + (cy - 7) + 'l14 14M' + (cx + 7) + ' ' + (cy - 7) + 'l-14 14', 'none', 'stroke="' + col + '" stroke-width="3.4" stroke-linecap="round"'); }
    o += cross(x0 + 7.5 * cw, y0 + rh * 9 - 5.5 * rh, '#e0302a') + cross(x0 + 5.5 * cw, y0 + rh * 9 - 7.5 * rh, '#f4f4ee');
    o += [0, 1, 2, 3].map(function (k) { return C(x0 + 30 + k * 50, y0 + rh * 9 + 2, 3, ['#3d6fe0', '#f4f0e2', '#d9453a', '#e39a2a'][k], anim('ua-glow', k * .4)); }).join('');
    return o + vig();
  };
  S['86'] = function () {
    var o = floorWood(0) + P('M90 70h120l18 110H72Z', '#050302') + P('M90 70h120l18 110H72Z', 'none', 'stroke="#2a1406" stroke-width="4"') + P('M90 70L70 30H190L210 70Z', '#8a5a2c', 'stroke="#3a2008" stroke-width="2"');
    o += P('M128 70L120 180M172 70L180 180', 'none', 'stroke="#7a5030" stroke-width="4"'); for (var i = 0; i < 5; i++) o += L(124 - i * .7, 86 + i * 20, 176 + i * .7, 86 + i * 20, '#7a5030', 3);
    o += C(150, 160, 50, 'url(#u-glowB)', 'opacity=".25"') + P('M136 52l14 -14l14 14M150 38v26', 'none', 'stroke="#e0302a" stroke-width="0"');
    return o + P('M118 44l12 12M130 44l-12 12', 'none', 'stroke="#e0302a" stroke-width="3" stroke-linecap="round"') + vig() + tag('C', 150, 130);
  };
  S.C = function () {
    var o = understage(5) + tank(150, 112, .95, .78, { lock: true }) + G('translate(150 163)', R(-10, -2, 20, 13, '#f8f8f4', 'transform="rotate(-8)"') + T(-4, 8, 'K♠', 'font-size="6" fill="#111" transform="rotate(-8)"'));
    o += pipeValve(56, 70, .7, false) + P('M0 70h20', 'none', 'stroke="#5a6872" stroke-width="8"') + P('M118 70H90', 'none', 'stroke="#5a6872" stroke-width="8"');
    o += G('translate(30 186)', R(-20, -6, 70, 14, '#5a3a1e') + R(-14, -14, 20, 8, '#7a7a7a') + R(14, -10, 30, 4, '#9a9aa0')) + mallet(64, 172, .32, -60) + hid('9', 72, 192, '#c9b48a', 7, 0, .45);
    o += P('M240 0v120M262 0v150M284 0v100', 'none', 'stroke="#a88a5a" stroke-width="1.6"') + G('translate(262 160)', C(0, 0, 12, '#5a3418', 'stroke="#2a1406" stroke-width="3"') + C(0, 0, 3, '#2a1406'));
    return o + vig() + tag('55', 150, 40) + tag('47', 56, 40) + tag('62', 120, 164) + tag('73', 180, 182);
  };
  S['55'] = function () { return understage(55) + tank(150, 108, 1.5, .82, { lock: true }) + T(78, 52, '!!', 'font-size="18" fill="#ffd23d" ' + DISP + ' ' + anim('ua-blink', 0)) + vig(); };
  S['47'] = function () { return understage(47) + pipeValve(150, 110, 1.6, false) + vig(); };
  S['9'] = function () { return R(0, 0, 300, 220, '#1a120c') + C(150, 110, 90, 'url(#h-spot)', 'opacity=".2"') + mallet(150, 116, 1.6, -30) + vig(); };
  S['56'] = function () { return pen('#04121e', pipeValve(150, 100, 1.2, false, true) + mallet(220, 70, .5, 30), '−3:00'); };
  S['73'] = function () {
    var t = R(-90, -50, 180, 100, '#fbfaf4', 'rx="3" stroke="#bdb6a2"') + R(-84, -44, 168, 88, 'none', 'stroke="#1a1a1a" stroke-width=".6"') + pcard(-60, -6, .9, 'K', '♠', -8) +
      T(20, -18, 'CONTE MORETTI', 'text-anchor="middle" font-size="12" font-weight="700" letter-spacing="1" fill="#151515" ' + SERIF) + T(20, -4, 'il Re di Picche', 'text-anchor="middle" font-size="9" font-style="italic" fill="#151515" ' + SERIF) + L(-20, 4, 60, 4, '#151515', .5) +
      T(20, 22, 'SDOFR YHQWLWUH', 'text-anchor="middle" font-size="11" font-weight="700" fill="#7a0f18" ' + MONO) + T(20, 36, '(dove lo spettacolo si vede benissimo)', 'text-anchor="middle" font-size="5.6" font-style="italic" fill="#3a3a3a" ' + SERIF);
    return understage(73) + G('translate(150 110) rotate(-3)', R(-87, -46, 180, 100, 'rgba(0,0,0,.45)', 'rx="3"') + t) + vig();
  };
  S['23'] = function () {
    var o = R(0, 0, 300, 220, '#2a0a10') + R(0, 0, 300, 220, 'url(#h-wall)', 'opacity=".6"') + P('M0 0H300V40Q150 70 0 40Z', '#3a0a12') + R(30, 30, 240, 90, '#0a0406') + curtain(40, 34, 220, 30, 12) + C(150, 92, 40, 'url(#h-spot)', 'opacity=".5"') + R(40, 96, 220, 20, 'url(#h-boardL)');
    o += P('M0 118H300V140H0Z', 'url(#h-gold)') + R(0, 140, 300, 80, '#3a0a12') + seats(90, 176, 4) + G('translate(222 196)', R(-30, -14, 60, 26, '#7a4a22', 'rx="3" stroke="#3a2008"') + mask(-12, 0, .4, 'pulcinella') + mask(12, 0, .4, 'arlecchino'));
    o += G('translate(74 160) rotate(-14)', R(-16, -20, 32, 40, '#f4ead2', 'stroke="#8a7a5a"') + T(0, -8, 'PROGRAMMA', 'text-anchor="middle" font-size="4.6" fill="#7a0f18" ' + SERIF) + mask(0, 8, .35, 'arlecchino'));
    return o + vig() + tag('54', 222, 168) + tag('18', 74, 134);
  };
  S['18'] = function () {
    var acts = [['Atto I', 'Arlecchino e le carte volanti', 'arlecchino'], ['Atto II', 'Pulcinella e il cappello senza fondo', 'pulcinella'], ['Atto III', 'Colombina e lo specchio parlante', 'colombina'], ['Atto IV', 'Pantalone e la cassa d’acqua', 'pantalone']], t = T(0, -76, 'PROGRAMMA DELLA SERATA', 'text-anchor="middle" font-size="9" font-weight="700" letter-spacing="1" fill="#7a0f18" ' + SERIF);
    acts.forEach(function (a, i) { var y = -50 + i * 36; t += mask(-56, y + 4, .6, a[2]) + T(-36, y, a[0], 'font-size="10" font-weight="700" fill="#1a1a1a" ' + SERIF) + T(-36, y + 12, a[1], 'font-size="7.6" font-style="italic" fill="#3a2a10" ' + SERIF); });
    t += T(0, 92, 'con il Grande Zambrini', 'text-anchor="middle" font-size="6.6" fill="#7a0f18" ' + SERIF);
    return R(0, 0, 300, 220, '#3a0a12') + paper(150, 110, 180, 200, 1, t) + vig();
  };
  S['54'] = function () { return R(0, 0, 300, 220, '#3a0a12') + R(0, 150, 300, 70, '#2a060c') + woodBox(150, 112, 1.35, false) + vig(); };
  S['67'] = function () { return R(0, 0, 300, 220, '#3a0a12') + woodBox(150, 140, 1.15, true) + G('translate(150 100)', K.wheel(0, 0, 22, '#d7a53a')) + vig() + tag('13', 186, 82); };
  S['13'] = function () { return R(0, 0, 300, 220, '#1a120c') + C(150, 110, 100, 'url(#h-spot)', 'opacity=".3"') + K.wheel(150, 110, 62, '#d7a53a') + vig(); };
  S['60'] = function () { return understage(60) + pipeValve(80, 70, .7, true) + tank(186, 112, 1.1, .9, { lock: true }) + vig(); };
  S['62'] = function () {
    var o = understage(62) + R(30, 50, 240, 120, 'url(#h-gold)', 'rx="8" stroke="#6a4a0e" stroke-width="3"') + R(40, 60, 220, 100, '#2a1a08', 'rx="4"');
    [['K', '♠'], ['Q', '♦'], ['J', '♥'], ['Q', '♥'], ['A', '♥'], ['Q', '♠']].forEach(function (c, i) { o += R(45 + i * 36, 70, 34, 60, '#120a04', 'rx="2"') + pcard(62 + i * 36, 99, 1.02, c[0], c[1], 0); });
    return o + T(150, 150, '· PREMI LA CARTA GIUSTA ·', 'text-anchor="middle" font-size="8" letter-spacing="1" fill="#f0cf6a" ' + MONO) + vig();
  };
  S['99'] = function () {
    var o = R(0, 0, 300, 220, '#14060a') + P('M16 18H90Q60 110 70 188H16Z', 'url(#h-velv)') + P('M284 18H210Q240 110 230 188H284Z', 'url(#h-velv)') + R(16, 186, 268, 34, 'url(#h-boardL)') + footlights(192) + ghostRays(150, -10, 3) + C(150, 110, 80, 'url(#h-spot)', 'opacity=".6"');
    o += G('translate(150 150)', P('M-16 36L-12 -12h24L16 36Z', '#111') + P('M-12 -12q12 8 24 0', '#fff') + C(0, -22, 10, '#e8c09a') + P('M-6 -16q6 3 12 0', 'none', 'stroke="#2a1a10" stroke-width="2"') + topHat(0, -30, .5) + P('M12 -8l22 -24', 'none', 'stroke="#111" stroke-width="5" stroke-linecap="round"') + wand(36, -34, .3, -48));
    var r = rnd(99); for (var i = 0; i < 18; i++) o += P('M' + f(30 + r() * 240) + ' ' + f(-10) + 'l3 6l-3 6l-3 -6z', ['#d9453a', '#e2b23e', '#f4f0e2', '#3d6fe0'][i % 4], anim('ua-fall', r() * 4, 3 + r() * 3));
    return proscenium(o) + vig();
  };
  Object.keys(S).forEach(function (k) { SC['teatro:' + k] = S[k]; });

  /* =================================================================== */
  /* ===================== kit della stazione polare (1958) ============ */
  /* =================================================================== */
  function snowfall(n, seed, w) { var o = '', r = rnd(seed || 7), i; for (i = 0; i < n; i++) o += C(r() * 330 - 20, r() * 60 - 40, .7 + r() * 1.5, '#fff', 'opacity=".85" ' + anim('ua-snow', r() * 4, 1.6 + r() * 2.2)); return o; }
  function aurora(x, y, w, h) { return G('', P('M' + x + ' ' + (y + h * .6) + 'q' + f(w * .25) + ' ' + f(-h * .7) + ' ' + f(w * .5) + ' ' + f(-h * .2) + 't' + f(w * .5) + ' ' + f(-h * .1) + 'v' + f(h * .3) + 'q' + f(-w * .25) + ' ' + f(-h * .3) + ' ' + f(-w * .5) + ' ' + f(h * .1) + 't' + f(-w * .5) + ' ' + f(h * .2) + 'z', 'url(#i-aur)') + P('M' + x + ' ' + (y + h * .35) + 'q' + f(w * .3) + ' ' + f(-h * .5) + ' ' + f(w * .6) + ' 0t' + f(w * .4) + ' ' + f(-h * .2) + 'v' + f(h * .2) + 'q' + f(-w * .3) + ' ' + f(-h * .2) + ' ' + f(-w * .6) + ' ' + f(h * .1) + 'z', 'url(#i-aur2)'), anim('ua-wave', 0, 5)); }
  function sky(seed) { var o = R(0, 0, 300, 220, 'url(#i-sky)'), r = rnd(seed || 4), i; for (i = 0; i < 30; i++) o += C(r() * 300, r() * 120, .5 + r() * .8, '#fff', anim('ua-blink', r() * 3)); return o + aurora(-20, 10, 340, 80); }
  function hut(seed) {
    var o = R(0, 0, 300, 220, 'url(#i-plank)'), r = rnd(seed || 2), x;
    for (x = 0; x < 300; x += 26) o += L(x, 0, x, 220, '#2a1a0c', 1.4) + L(x + 4 + r() * 16, 10 + r() * 60, x + 4 + r() * 16, 80 + r() * 100, '#3a2614', .6, 'opacity=".6"');
    o += R(0, 168, 300, 52, '#3a2818') + R(0, 166, 300, 4, '#1e140a');
    for (x = 0; x < 300; x += 40) o += L(x, 170, x - 20, 220, '#24180c', 1);
    return o + R(0, 0, 300, 220, '#9ccbe8', 'opacity=".08"');
  }
  function frost(x, y, w, h) { var o = '', r = rnd(Math.round(x * 7 + y)), i; for (i = 0; i < 12; i++) { var cx = x + (r() < .5 ? r() * 14 : w - r() * 14), cy = y + r() * h; o += P('M' + f(cx) + ' ' + f(cy) + 'l' + f(r() * 10 - 5) + ' ' + f(r() * 10 - 5) + 'm0 0l' + f(r() * 8 - 4) + ' ' + f(r() * 8), 'none', 'stroke="#eef9ff" stroke-width=".8" opacity=".8"'); } return o + R(x, y, w, h, 'url(#i-frost)', 'opacity=".55"'); }
  function window_(x, y, w, h) {
    var cp = uid('iw');
    return R(x - 6, y - 6, w + 12, h + 12, '#4e3620', 'stroke="#24180c" stroke-width="2"') + '<clipPath id="' + cp + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '"/></clipPath>' +
      G('', R(x, y, w, h, 'url(#i-sky)') + aurora(x - 10, y, w + 20, h * .6) + R(x, y + h * .75, w, h * .25, 'url(#i-snow)') + G('translate(' + x + ' ' + y + ') scale(' + f(w / 300) + ')', snowfall(30, x)), 'clip-path="url(#' + cp + ')"') +
      frost(x, y, w, h) + L(x + w / 2, y, x + w / 2, y + h, '#4e3620', 3) + L(x, y + h / 2, x + w, y + h / 2, '#4e3620', 3);
  }
  function stove(x, y, s, lit) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-6, -130, 12, 90, '#2a2a2a') + E(0, 0, 30, 8, 'rgba(0,0,0,.4)') + R(-24, -46, 48, 46, 'url(#i-bake)', 'rx="8" stroke="#000" stroke-width="2"') + E(0, -46, 24, 6, '#3a3836') + R(-12, -30, 24, 16, '#0a0a0a', 'rx="3"') +
      (lit ? R(-10, -28, 20, 12, '#ff8a2a', anim('ua-flick', 0)) + C(0, -24, 40, 'url(#i-warm)', 'opacity=".6"') : '') + R(-28, -4, 6, 6, '#1a1a1a') + R(22, -4, 6, 6, '#1a1a1a') + T(0, -36, 'CHEROSENE', 'text-anchor="middle" font-size="4" fill="#8a8a80" ' + MONO));
  }
  function bunk(x, y, s) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-70, -10, 140, 26, '#5a4028') + R(-70, -14, 140, 8, '#efe9dc') + R(-62, -26, 26, 14, '#e8e2d4', 'rx="6"') + C(-48, -26, 10, '#f2d0b0') + P('M-58 -28q10 -10 20 0', '#6a4a2a') + P('M-56 -20q8 8 16 0', '#b8a090') +
      P('M-40 -24q40 -12 108 -2v14H-40Z', '#6a7444') + P('M-30 -26q30 -10 90 -2', 'none', 'stroke="#3a4224" stroke-width="1.4"') + P('M-20 -20l10 -6M10 -22l10 -6M40 -20l10 -6', 'none', 'stroke="#d9453a" stroke-width="1.2" opacity=".6"') + R(-70, 16, 6, 20, '#3a2614') + R(64, 16, 6, 20, '#3a2614'));
  }
  function spiritLamp(x, y, s, lit) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 18, 22, 5, 'rgba(0,0,0,.4)') + P('M-18 18q-4 -22 18 -24q22 2 18 24z', 'url(#i-metal)', 'stroke="#2e3840"') + R(-4, -12, 8, 8, '#8a96a0') + R(-1.4, -18, 2.8, 7, '#f4ecd8') +
      (lit ? G('', P('M0 -42q-8 14 0 22q8 -8 0 -22z', '#7ab8ff') + P('M0 -34q-4 8 0 12q4 -4 0 -12z', '#e8f4ff'), anim('ua-flame', 0)) + C(0, -28, 26, 'url(#i-warm)', 'opacity=".5"') : '') + E(0, 4, 16, 4, '#fff', 'opacity=".15"'));
  }
  function bottle(x, y, s) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 30, 14, 4, 'rgba(0,0,0,.4)') + P('M-12 30V-4q0 -8 6 -12V-30h12V-16q6 4 6 12V30Z', '#9fd0e8', 'opacity=".75" stroke="#5a8aa0"') + R(-6, -36, 12, 7, '#7a1a1a') + R(-12, 0, 24, 18, '#f4ecd8') + T(0, 8, 'ALCOL', 'text-anchor="middle" font-size="5" font-weight="700" fill="#7a1a1a" ' + MONO) + T(0, 14, 'denaturato', 'text-anchor="middle" font-size="3.4" fill="#3a3a3a" ' + SERIF) + R(-9, -12, 3, 40, '#fff', 'opacity=".3"')); }
  function iceDoor(x, y, w, h, iced) {
    var o = R(x - 5, y - 5, w + 10, h + 5, '#24180c') + R(x, y, w, h, '#6a4a2c') + L(x + w * .33, y, x + w * .33, y + h, '#3a2614', 1.4) + L(x + w * .66, y, x + w * .66, y + h, '#3a2614', 1.4) + R(x + w - 14, y + h * .5 - 4, 8, 10, '#9aa7ae', 'rx="2"');
    if (iced) { var r = rnd(w + h), i; o += P('M' + x + ' ' + (y + h) + 'V' + y + 'H' + (x + w) + 'V' + (y + h) + 'Z', 'url(#i-ice)', 'opacity=".75"'); for (i = 0; i < 10; i++) o += P('M' + f(x + r() * w) + ' ' + y + 'l' + f(r() * 3 - 1.5) + ' ' + f(8 + r() * 18) + 'l3 ' + f(-8 - r() * 18) + 'z', '#e6f6ff', 'opacity=".9"'); o += frost(x, y, w, h); }
    return o;
  }
  function radioSet(x, y, s, on, freq) {
    var o = R(-90, -50, 180, 100, '#3a4436', 'rx="6" stroke="#141a12" stroke-width="2"') + R(-82, -42, 164, 30, '#141a12', 'rx="3"') + R(-76, -36, 152, 18, on ? '#c8f0a0' : '#4a5a3a', 'rx="2"' + (on ? ' ' + anim('ua-glow', 0) : ''));
    for (var i = 0; i <= 16; i++) o += L(-72 + i * 9, -36, -72 + i * 9, -30 + (i % 4 ? 0 : 3), '#1a2a10', .8);
    o += T(0, -21, freq || '4700 · 4800 · 4900', 'text-anchor="middle" font-size="7" fill="#1a2a10" ' + MONO) + (on ? R(-4, -38, 2, 20, '#d9453a') : '');
    [-60, -24, 12, 48].forEach(function (dx, k) { o += C(dx + 6, 14, 12, '#141a12', 'stroke="#9aa7ae" stroke-width="2"') + L(dx + 6, 14, dx + 6 + Math.cos(k + 1) * 9, 14 - Math.sin(k + 1) * 9, '#e6eef4', 2) + T(dx + 6, 36, ['×1000', '×100', '×10', '×1'][k], 'text-anchor="middle" font-size="5" fill="#c8d0c0" ' + MONO); });
    o += C(76, -2, 3, on ? '#3dff7a' : '#2a3a20', on ? anim('ua-blink', 0) : '') + T(76, 8, 'TX', 'text-anchor="middle" font-size="4" fill="#c8d0c0" ' + MONO);
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 52, 96, 6, 'rgba(0,0,0,.4)') + o);
  }
  function calendar(x, y, s) {
    var o = R(-60, -66, 120, 132, '#f6f2e8', 'stroke="#8a826e"') + R(-60, -66, 120, 22, '#2a5a8a') + T(0, -51, 'FEBBRAIO 1958', 'text-anchor="middle" font-size="9" font-weight="700" fill="#fff" ' + SANS), d, col, row, cx, cy;
    ['L', 'M', 'M', 'G', 'V', 'S', 'D'].forEach(function (g, i) { o += T(-51 + i * 17, -34, g, 'text-anchor="middle" font-size="6.4" font-weight="700" fill="' + (i === 6 ? '#c8261c' : '#3a3a3a') + '" ' + SANS); });
    for (d = 1; d <= 28; d++) {
      col = (d + 4) % 7; row = Math.floor((d + 4) / 7); cx = -51 + col * 17; cy = -20 + row * 17;
      o += T(cx, cy + 3, String(d), 'text-anchor="middle" font-size="8" fill="' + (col === 6 ? '#c8261c' : '#1a1a1a') + '" ' + SANS);
      if (d <= 20) o += P('M' + (cx - 6) + ' ' + (cy + 5) + 'L' + (cx + 6) + ' ' + (cy - 5), 'none', 'stroke="#3a3a3a" stroke-width="1.2" opacity=".75"');
      if (d === 14) o += C(cx, cy, 7.5, 'none', 'stroke="#2a6ad8" stroke-width="1.6"') + T(cx, cy + 13, 'partenza capo', 'text-anchor="middle" font-size="3.6" fill="#2a6ad8" ' + HAND);
      if (d === 21) o += C(cx, cy, 8, 'none', 'stroke="#d9261c" stroke-width="2.2"');
    }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-57, -62, 120, 132, 'rgba(0,0,0,.35)') + o + C(0, -70, 3, '#5a5a5a'));
  }
  function map(x, y, s) {
    var o = R(-110, -80, 220, 160, '#f2ead2', 'stroke="#8a7a5a"') + R(-104, -74, 208, 148, 'none', 'stroke="#c9b48a" stroke-width=".8"');
    o += R(-24, -18, 22, 14, '#a8743e', 'stroke="#3a2008"') + R(4, -18, 22, 14, '#a8743e', 'stroke="#3a2008"') + T(1, -24, 'baracche', 'text-anchor="middle" font-size="5.4" fill="#3a2a10" ' + HAND) + R(-30, 6, 40, 24, '#8a96a0', 'stroke="#2e3840"') + T(-10, 22, 'hangar', 'text-anchor="middle" font-size="5.4" fill="#1a1a1a" ' + HAND);
    o += R(18, 30, 70, 10, '#d6dce2', 'stroke="#6a7680"') + T(53, 50, 'pista', 'text-anchor="middle" font-size="5.4" fill="#3a2a10" ' + HAND) + P('M-80 50q40 -10 60 0t60 10', 'none', 'stroke="#7fb0d0" stroke-width="1.2" stroke-dasharray="3 2"');
    [[0, -60, '62'], [86, 0, '26'], [0, 64, '15'], [-86, 0, '48']].forEach(function (p) { o += R(p[0] - 1, p[1] - 8, 2, 12, '#3a2008') + C(p[0], p[1] - 9, 2.4, '#d9261c') + T(p[0] + (p[0] > 0 ? -8 : p[0] < 0 ? 8 : 10), p[1] + 2, p[2], 'text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" ' + MONO); });
    o += G('translate(78 -52) rotate(90)', C(0, 0, 14, '#fffaf0', 'stroke="#3a2a10"') + P('M0 -13L4 0L0 3L-4 0Z', '#d9261c') + P('M0 13L4 0L0 -3L-4 0Z', '#3a2a10') + P('M-13 0L0 -2L13 0L0 2Z', '#8a7a5a', 'opacity=".6"') + T(0, -16, 'N', 'text-anchor="middle" font-size="7" font-weight="700" fill="#d9261c" ' + SERIF));
    o += T(-96, -62, 'Stazione «Duca degli Abruzzi»', 'font-size="6.4" fill="#3a2a10" ' + HAND) + T(-96, 72, 'pali segnavia', 'font-size="5.6" fill="#3a2a10" ' + HAND);
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-107, -76, 220, 160, 'rgba(0,0,0,.4)') + o + C(-104, -74, 2.4, '#9aa7ae') + C(104, -74, 2.4, '#9aa7ae'));
  }
  function cable(x, y, s, broken) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-80 10q30 -30 60 -6', 'none', 'stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"') + (broken ? P('M-20 4l8 -4M-20 4l9 3M-20 4l7 7', 'none', 'stroke="#c87a3a" stroke-width="1.6"') + P('M20 -2l-8 -4M20 -2l-9 3M20 -2l-6 8', 'none', 'stroke="#c87a3a" stroke-width="1.6"') + C(0, 0, 14, 'url(#u-glowW)', 'opacity=".3" ' + anim('ua-blink', 0)) : R(-24, -2, 48, 10, '#111', 'rx="4"') + P('M-20 -2v10M-12 -2v10M-4 -2v10M4 -2v10M12 -2v10M20 -2v10', 'none', 'stroke="#333" stroke-width=".8"')) + P('M20 -2q30 20 60 -10', 'none', 'stroke="#1a1a1a" stroke-width="6" stroke-linecap="round"')); }
  function tape(x, y, s) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', C(0, 0, 26, '#151515') + C(0, 0, 12, '#c9b48a') + C(0, 0, 9, '#2a2a2a') + P('M24 8l30 6v10l-32 -6z', '#151515') + C(-8, -10, 6, '#fff', 'opacity=".08"')); }
  function hangarBg(seed) {
    var o = R(0, 0, 300, 220, 'url(#i-hangar)'), x;
    for (x = -10; x < 310; x += 14) o += L(x, 0, x, 160, '#5a6872', 2, 'opacity=".5"') + L(x + 7, 0, x + 7, 160, '#0e1216', 1.4, 'opacity=".6"');
    o += P('M0 0Q150 -30 300 0V18Q150 -8 0 18Z', '#2a333a') + R(0, 160, 300, 60, '#2a2c2e') + R(0, 158, 300, 4, '#141618');
    for (x = 0; x < 300; x += 60) o += L(x, 162, x - 30, 220, '#1a1c1e', 1);
    return o + C(150, 10, 4, '#fff3c8') + P('M150 12L60 220H240Z', 'url(#h-beam)', 'opacity=".12"');
  }
  function generator(x, y, s, run) {
    var o = E(0, 40, 90, 8, 'rgba(0,0,0,.5)') + R(-80, 10, 160, 26, '#2a2c2e') + R(-70, -40, 90, 52, '#4a6a3a', 'rx="6" stroke="#1a2a12" stroke-width="2"') + R(-60, -34, 70, 8, '#2a3a20', 'rx="2"') + C(48, -12, 28, '#3a5030', 'stroke="#1a2a12" stroke-width="2"') + C(48, -12, 10, '#9aa7ae');
    for (var i = 0; i < 6; i++) o += R(-64 + i * 12, -22, 6, 30, '#2a3a20', 'rx="2"');
    o += R(-50, -62, 10, 24, '#3a3a3a') + T(-26, 30, 'ANSALDO', 'text-anchor="middle" font-size="6" letter-spacing="1" fill="#c9b48a" ' + MONO);
    if (run) { o += C(-45, -70, 8, '#3a3a3a', 'opacity=".7" ' + anim('ua-steam', 0)) + C(-42, -82, 10, '#2a2a2a', 'opacity=".6" ' + anim('ua-steam', .7)) + C(78, -40, 4, '#ffd23d', anim('ua-blink', 0)); return G('translate(' + x + ' ' + y + ') scale(' + s + ')', G('', o, anim('ua-shake', 0))); }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function jerry(x, y, s, band) {
    var col = band === 'y' ? '#e6c23a' : band === 'r' ? '#d9453a' : '#3d6fe0';
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 34, 26, 5, 'rgba(0,0,0,.45)') + R(-22, -30, 44, 64, '#4a5a3a', 'rx="4" stroke="#1a2a12" stroke-width="1.5"') + P('M-22 -12L22 12M22 -12L-22 12', 'none', 'stroke="#2a3a20" stroke-width="3"') + R(-22, 4, 44, 9, col) + R(-16, -40, 22, 10, '#3a4a2c', 'rx="2"') + R(10, -38, 8, 8, '#2a2a2a', 'rx="1"') + T(0, -16, '20 L', 'text-anchor="middle" font-size="6" fill="#c8d0c0" ' + MONO));
  }
  function cage(x, y, w, h, open) {
    var o = R(x, y, w, h, 'none', 'stroke="#6a7680" stroke-width="2"'), i;
    for (i = 6; i < w; i += 8) o += L(x + i, y, x + i, y + h, '#6a7680', .8, 'opacity=".8"');
    for (i = 6; i < h; i += 8) o += L(x, y + i, x + w, y + i, '#6a7680', .8, 'opacity=".8"');
    if (!open) o += G('translate(' + (x + w - 6) + ' ' + (y + h / 2) + ')', P('M-6 -6v-6a6 6 0 0 1 12 0v6', 'none', 'stroke="#9aa7ae" stroke-width="2.4"') + R(-8, -6, 16, 14, '#c9a24a', 'rx="2"') + R(-5, -2, 10, 5, '#1a1208'));
    return o;
  }
  function panel6(x, y, s, run) {
    var ks = [['DECOMPRESSORE', '#8a99a3'], ['CANDELETTA', '#e0703a'], ['GASOLIO', '#d6b22e'], ['STROZZATORE', '#8a6fd0'], ['AVVIAMENTO', '#d9453a'], ['ARIA', '#4a94dc']], o = R(-92, -52, 184, 104, '#2e3a2a', 'rx="6" stroke="#121a10" stroke-width="2"') + T(0, -38, 'AVVIAMENTO A FREDDO', 'text-anchor="middle" font-size="7.4" letter-spacing="1" fill="#e6d9a8" ' + MONO);
    ks.forEach(function (k, i) { var cx = -60 + (i % 3) * 60, cy = -12 + Math.floor(i / 3) * 40; o += C(cx, cy, 12, k[1], 'stroke="#000" stroke-width="1.5"') + C(cx - 3, cy - 4, 4, '#fff', 'opacity=".3"') + T(cx, cy + 22, k[0], 'text-anchor="middle" font-size="6" fill="#e6eef4" ' + MONO); });
    o += C(80, -40, 3.5, run ? '#3dff7a' : '#3a1a1a', run ? anim('ua-blink', 0) : '');
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function bigDoor(x, y, w, h, open) {
    if (open) return R(x, y, w, h, 'url(#i-sky)') + R(x, y + h * .7, w, h * .3, 'url(#i-snow)') + G('', snowfall(26, 71), 'clip-path="none"') + R(x - 14, y, 14, h, '#4a5660') + R(x + w, y, 14, h, '#4a5660');
    var o = R(x, y, w, h, '#5a6872', 'stroke="#1a2228" stroke-width="2"'), i;
    for (i = 8; i < w; i += 12) o += L(x + i, y, x + i, y + h, '#2e3840', 1.4);
    return o + L(x + w / 2, y, x + w / 2, y + h, '#141a20', 3) + R(x + w / 2 - 22, y + 6, 44, 10, '#ffd23d') + T(x + w / 2, y + 13.5, 'PISTA', 'text-anchor="middle" font-size="7" font-weight="700" fill="#1a1a1a" ' + MONO);
  }
  function runwayLights(on) { var o = '', i; for (i = 0; i < 8; i++) { var t = i / 7, y = 120 + t * 90, x1 = 140 - t * 120, x2 = 160 + t * 120; o += C(x1, y, 1.6 + t * 3, on ? '#ffe9a0' : '#3a4048', on ? anim('ua-blink', i * .15) : '') + C(x2, y, 1.6 + t * 3, on ? '#ffe9a0' : '#3a4048', on ? anim('ua-blink', i * .15) : '') + (on ? C(x1, y, 6 + t * 8, 'url(#u-glowW)', 'opacity=".6"') + C(x2, y, 6 + t * 8, 'url(#u-glowW)', 'opacity=".6"') : ''); } return o; }
  function plane(x, y, s) { return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-40 0q20 -6 60 -4l14 -10h6l-6 12q8 2 6 6q-30 4 -78 0z', '#d0d6dc', 'stroke="#2a3038" stroke-width="1"') + R(-24, -10, 60, 4, '#e8a33a') + C(-40, 2, 5, '#2a3038') + C(-40, 2, 9, 'none', 'stroke="#9aa7ae" stroke-width=".6" opacity=".6" ' + anim('ua-spin', 0, .4)) + C(30, 1, 2, '#ff4236', anim('ua-blink', 0))); }
  function windsock(x, y, s) {
    var o = R(-2, -10, 4, 90, '#d6dce2') + E(0, 80, 14, 3, 'rgba(0,0,0,.3)') + G('translate(-2 -6)', P('M0 -8L-74 -5L-74 5L0 8Z', '#fff') + [0, 1, 2, 3, 4].map(function (i) { return P('M' + (-i * 15) + ' ' + (-8 + i * .6) + 'L' + (-i * 15 - 15) + ' ' + (-7.4 + i * .6) + 'V' + (7.4 - i * .6) + 'L' + (-i * 15) + ' ' + (8 - i * .6) + 'Z', i % 2 ? '#fff' : '#ff6a1a'); }).join(''), anim('ua-sway', 0, 1.6));
    o += G('translate(0 40)', C(0, 0, 16, '#0d1a24', 'stroke="#9aa7ae" stroke-width="1.4"') + T(0, -6, 'N', 'text-anchor="middle" font-size="7" font-weight="700" fill="#ff6a5a" ' + MONO) + T(0, 13, 'S', 'text-anchor="middle" font-size="6" fill="#c8d0d8" ' + MONO) + T(10, 2.4, 'E', 'text-anchor="middle" font-size="6" fill="#c8d0d8" ' + MONO) + T(-10, 2.4, 'O', 'text-anchor="middle" font-size="6" fill="#c8d0d8" ' + MONO) + P('M0 -3L1.4 0L0 3L-1.4 0Z', '#fff'));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function snowGround(y) { return R(0, y, 300, 220 - y, 'url(#i-snow)') + P('M0 ' + y + 'q40 -8 80 0t80 -4t80 4t60 -2V' + (y + 10) + 'H0Z', '#fff', 'opacity=".6"'); }
  function lightPanel(x, y, s, on) {
    var o = R(-50, -60, 100, 120, '#5a6872', 'rx="4" stroke="#1a2228" stroke-width="2"') + R(-42, -52, 84, 18, '#141a20', 'rx="2"') + T(0, -40, 'LUCI PISTA', 'text-anchor="middle" font-size="7.4" fill="' + (on ? '#ffd27a' : '#6a7680') + '" ' + MONO);
    o += C(0, 8, 26, '#2a333a', 'stroke="#141a20" stroke-width="2"') + [['09', 90], ['18', 180], ['27', 270], ['36', 0]].map(function (r) { var a = (r[1] - 90) * Math.PI / 180; return T(f(Math.cos(a) * 36), f(Math.sin(a) * 36 + 11), r[0], 'text-anchor="middle" font-size="7.4" font-weight="700" fill="#e6eef4" ' + MONO); }).join('') + P('M0 -14L5 8H-5Z', on ? '#ffd27a' : '#8a96a0') + C(0, 8, 6, '#141a20');
    o += C(-34, 48, 4, on ? '#3dff7a' : '#3a1a1a', on ? anim('ua-blink', 0) : '') + T(-24, 50, on ? 'CORRENTE' : 'SPENTO', 'font-size="5" fill="#c8d0d8" ' + MONO);
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function stationOutside(seed) { return sky(seed) + snowGround(150) + R(60, 120, 50, 32, '#7a4a2c') + P('M54 120L85 100L116 120Z', '#e6f0f8') + R(124, 110, 80, 42, '#5a6872') + P('M120 110Q164 84 208 110Z', '#e6f0f8') + R(76, 130, 10, 10, '#ffe0a0', anim('ua-flick', 0)) + R(230, 90, 2, 62, '#9aa7ae') + L(231, 90, 280, 152, '#9aa7ae', .6) + L(231, 90, 190, 152, '#9aa7ae', .6) + snowfall(40, seed); }

  /* ------------------------- carte della stazione ------------------------- */
  var D = {};
  D.start = function () { return stationOutside(1) + plane(220, 40, .9) + P('M220 44L150 150', 'none', 'stroke="#fff" stroke-dasharray="2 5" opacity=".3"') + T(150, 186, 'DUCA DEGLI ABRUZZI', 'text-anchor="middle" font-size="9" letter-spacing="3" fill="#1d3550" ' + MONO) + vig() + tag('A', 92, 168); };
  D.A = function () {
    var o = hut(1) + window_(118, 22, 64, 48) + stove(248, 168, .72, false) + bunk(70, 156, .82) + bottle(36, 200, .4) + hid('3', 58, 196, '#c9d6de', 7, 0, .45);
    o += iceDoor(206, 40, 46, 122, true) + G('translate(150 112)', R(-20, -26, 40, 52, '#f4ecd8', 'transform="rotate(-3)"') + lines(-16, -16, ['T min', '—', '—', '—'], { fs: 6, lh: 8, font: HAND, c: '#1d3550' })) + R(150, 140, 60, 4, '#3a2614') + spiritLamp(178, 134, .45, false);
    return o + vig() + tag('12', 150, 92) + tag('6', 60, 124) + tag('33', 229, 72) + tag('20', 268, 112) + tag('31', 178, 112);
  };
  D['6'] = function () { return hut(6) + bunk(150, 130, 1.8) + T(214, 60, 'brrr…', 'font-size="18" fill="#cde9fb" ' + HAND + ' ' + anim('ua-shake', 0)) + snowfall(10, 6) + vig(); };
  D['12'] = function () {
    var rows = [['12', '−19'], ['13', '−22'], ['14', '−21'], ['15', '−28'], ['16', '−24'], ['17', '−23'], ['18', '−25'], ['19', '−20'], ['20', '−17']], t = T(0, -82, 'REGISTRO METEO · minime di febbraio', 'text-anchor="middle" font-size="7.4" fill="#3a2a10" ' + MONO) + L(-70, -76, 70, -76, '#3a2a10', 1) + T(-46, -66, 'giorno', 'text-anchor="middle" font-size="6.4" fill="#3a2a10" ' + MONO) + T(-2, -66, 'T min (°C)', 'text-anchor="middle" font-size="6.4" fill="#3a2a10" ' + MONO);
    rows.forEach(function (r, i) { var y = -50 + i * 15; t += T(-46, y, r[0], 'text-anchor="middle" font-size="11" fill="#1d3550" ' + HAND) + T(-2, y, r[1] + '°', 'text-anchor="middle" font-size="12" fill="#1d3550" ' + HAND) + L(-70, y + 4, 70, y + 4, '#c9b48a', .5);
      if (r[0] === '15') t += L(-62, y - 4, 16, y - 4, '#c8261c', 1.6) + T(22, y - 2, 'termometro rotto,', 'font-size="8" fill="#c8261c" ' + HAND) + T(22, y + 6, 'valore sbagliato!', 'font-size="8" fill="#c8261c" ' + HAND); });
    return hut(12) + paper(140, 110, 170, 190, -1.5, t) + vig();
  };
  D['33'] = function () { return hut(33) + iceDoor(90, 14, 120, 156, true) + T(150, 200, 'SALA RADIO', 'text-anchor="middle" font-size="8" letter-spacing="2" fill="#e6f6ff" ' + MONO) + vig(); };
  D['31'] = function () { return hut(31) + C(150, 110, 90, 'url(#i-warm)', 'opacity=".12"') + spiritLamp(150, 120, 2.2, false) + vig(); };
  D['3'] = function () { return hut(3) + bottle(150, 104, 2.6) + vig(); };
  D['34'] = function () { return R(0, 0, 300, 220, '#1a120a') + spiritLamp(150, 130, 2.3, true) + vig(); };
  D['20'] = function () { return hut(20) + stove(150, 190, 1.6, false) + G('', P('M176 100q10 -16 0 -30q-10 -14 2 -26', 'none', 'stroke="#d8e6c0" stroke-width="3" opacity=".35"'), anim('ua-steam', 0)) + vig(); };
  D['54'] = function () { return pen('#2a0a04', stove(150, 170, 1.1, true) + spiritLamp(210, 130, .8, true) + C(150, 120, 70, 'url(#i-warm)', 'opacity=".8" ' + anim('ua-flick', 0)) + P('M120 120q30 -70 60 0', '#ff8a2a', 'opacity=".7" ' + anim('ua-flame', 0)), '−4:00'); };
  D['67'] = function () { return hut(67) + iceDoor(90, 14, 120, 156, false) + P('M100 170q50 10 100 0', 'none', 'stroke="#9fd0e8" stroke-width="3" opacity=".6"') + spiritLamp(212, 160, .7, true) + R(108, 20, 84, 150, '#0a1018', 'opacity=".6"') + C(150, 70, 40, 'url(#u-glowG)', 'opacity=".2" ' + anim('ua-blink', 0)) + vig() + tag('B', 150, 100); };
  D.B = function () {
    var o = hut(30) + window_(28, 20, 56, 44) + G('translate(56 70)', cable(0, 0, .45, true)) + map(242, 58, .38) + calendar(150, 52, .36);
    o += R(90, 150, 140, 8, '#4e3620') + R(96, 158, 8, 40, '#3a2614') + R(216, 158, 8, 40, '#3a2614') + radioSet(160, 116, .55, false) + G('translate(212 140)', E(0, 0, 10, 6, '#151515') + P('M-8 0q8 -14 16 0', 'none', 'stroke="#151515" stroke-width="2"'));
    o += G('translate(110 144) rotate(-8)', R(-14, -6, 28, 12, '#7a4a2a') + L(-10, -2, 10, -2, '#c9b48a', .6)) + R(100, 158, 40, 12, '#5a4028', 'stroke="#2a1a0c"') + hid('5', 120, 165, '#d8c8a8', 7, 0, .45) + iceDoor(258, 102, 36, 66, false) + R(268, 112, 16, 8, '#ffd23d') + T(276, 118, 'H', 'text-anchor="middle" font-size="6" font-weight="700" fill="#1a1a1a" ' + MONO);
    return o + vig() + tag('51', 160, 96) + tag('17', 150, 30) + tag('23', 110, 128) + tag('36', 242, 30) + tag('27', 56, 90) + tag('41', 276, 140);
  };
  D['27'] = function () { return R(0, 0, 300, 220, 'url(#i-sky)') + snowfall(40, 27) + R(0, 150, 300, 70, 'url(#i-plank)') + cable(150, 110, 1.6, true) + vig(); };
  D['5'] = function () { return hut(5) + tape(140, 110, 2) + vig(); };
  D['32'] = function () { return hut(32) + cable(150, 70, 1.2, false) + radioSet(150, 160, .7, true) + vig(); };
  D['17'] = function () { return hut(17) + calendar(150, 116, 1.42) + vig(); };
  D['23'] = function () {
    var l = lines(-130, -66, ['Frequenza della base:', 'cambia ogni giorno!', '4700 kHz + 5 kHz', 'per ogni giorno del mese.', '', 'Ferri cerchia in rosso', 'il giorno, ogni mattina.'], { fs: 11, lh: 14, font: HAND, c: '#1d3550' });
    var mo = [['A', '·–'], ['C', '–·–·'], ['D', '–··'], ['E', '·'], ['H', '····'], ['I', '··'], ['L', '·–··'], ['M', '––'], ['N', '–·'], ['O', '–––'], ['P', '·––·'], ['R', '·–·'], ['S', '···'], ['T', '–'], ['U', '··–'], ['V', '···–']], r = T(66, -70, 'MORSE', 'text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" ' + MONO);
    mo.forEach(function (m, i) { var cx = 14 + (i % 2) * 56, cy = -54 + Math.floor(i / 2) * 15; r += T(cx, cy, m[0], 'font-size="10" font-weight="700" fill="#7a1a1a" ' + MONO) + T(cx + 10, cy, m[1], 'font-size="10" font-weight="700" fill="#1a1a1a" ' + MONO); });
    return hut(23) + G('translate(150 112)', R(-137, -86, 274, 176, 'rgba(0,0,0,.4)') + R(-140, -90, 140, 176, 'url(#h-paper)', 'stroke="#a8946a"') + R(0, -90, 140, 176, 'url(#h-paper)', 'stroke="#a8946a"') + L(0, -90, 0, 86, '#8a7a5a', 1.4) + l + r) + vig();
  };
  D['51'] = function () { return hut(51) + radioSet(150, 104, 1.5, false) + vig(); };
  D['64'] = function () {
    var o = hut(64) + radioSet(150, 60, .8, true, '4805 kHz') + G('translate(150 160) rotate(-2)', R(-138, -26, 276, 52, '#f4ecd8', 'stroke="#a8946a"') + T(0, -8, '–·–· ···· ·· ·– ···– ·', 'text-anchor="middle" font-size="11" font-weight="700" fill="#1a1a1a" ' + MONO) + T(0, 12, '·––· ·– ·–·· ––– / –· ––– ·–· –··', 'text-anchor="middle" font-size="10.5" font-weight="700" fill="#1a1a1a" ' + MONO));
    return o + P('M200 30q14 -6 20 6M206 22q20 -10 30 10', 'none', 'stroke="#c8f0a0" stroke-width="1.6" ' + anim('ua-blink', 0)) + vig();
  };
  D['36'] = function () { return hut(36) + map(150, 110, 1.22) + vig(); };
  D['26'] = function () { return sky(26) + snowGround(140) + R(146, 60, 8, 100, '#3a2008') + C(150, 58, 5, '#d9261c') + T(170, 92, '26', 'font-size="18" font-weight="700" fill="#fff" ' + MONO) + R(124, 148, 40, 22, '#9aa7ae', 'rx="3" stroke="#3a4248"') + P('M0 100q150 -20 300 10', 'none', 'stroke="#c9b48a" stroke-width="2"') + snowfall(60, 26) + vig() + tag('14', 144, 136); };
  D['14'] = function () { return R(0, 0, 300, 220, 'url(#i-snow)') + snowfall(20, 14) + K.key(150, 110, 2.4, -16, 'HANGAR') + vig(); };
  D['41'] = function () { return hut(41) + R(80, 14, 140, 180, '#5a6872', 'stroke="#1a2228" stroke-width="3"') + [30, 60, 90, 120, 150].map(function (y) { return L(80, 14 + y, 220, 14 + y, '#2e3840', 1.4); }).join('') + R(120, 30, 60, 16, '#ffd23d') + T(150, 42, 'HANGAR', 'text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" ' + MONO) + G('translate(196 110) scale(1.6)', R(-6, -9, 12, 18, '#9aa7ae', 'rx="2" stroke="#3a4248"') + C(0, -2, 2.4, '#141618') + R(-.8, -1, 1.6, 6, '#141618')) + vig(); };
  D['75'] = function () { return pen('#2a0a04', R(90, 30, 120, 150, '#a85a3a', 'stroke="#ff8a2a" stroke-width="3" ' + anim('ua-glow', 0)) + spiritLamp(196, 120, .8, true) + C(196, 100, 50, 'url(#i-warm)', 'opacity=".8"'), '−3:00'); };
  D['55'] = function () { return hut(55) + R(70, 10, 160, 190, '#0e1216') + G('', hangarBg(55), 'transform="translate(70 10) scale(.533 .864)"') + R(70, 10, 160, 190, 'none', 'stroke="#5a6872" stroke-width="6"') + vig() + tag('C', 150, 110); };
  D.C = function () {
    var o = hangarBg(3) + bigDoor(214, 30, 80, 130, false) + cage(16, 50, 70, 110, false) + jerry(36, 140, .45, 'y') + jerry(64, 140, .45, 'r') + generator(140, 140, .6, false) + G('translate(178 136)', R(-12, -18, 24, 30, '#4a5a3a', 'rx="3" stroke="#1a2a12"') + R(-6, -24, 12, 6, '#2a2a2a') + T(0, 2, 'DIESEL', 'text-anchor="middle" font-size="4" fill="#c8d0c0" ' + MONO));
    o += G('translate(110 72)', R(-14, -18, 28, 36, '#f4ecd8', 'transform="rotate(-6)"') + lines(-10, -8, ['manuale', '— — —', '— — —'], { fs: 5, lh: 7, font: HAND }));
    return o + vig() + tag('35', 80, 76) + tag('38', 178, 118) + tag('58', 120, 112) + tag('46', 110, 46) + tag('21', 254, 70);
  };
  D['35'] = function () { return hangarBg(35) + cage(70, 20, 160, 150, false) + G('translate(222 95)', R(-34, -20, 58, 36, '#f4ecd8', 'transform="rotate(4)"') + lines(-30, -8, ['codice: la notte', 'più fredda! gradi,', 'poi il giorno.'], { fs: 7.2, lh: 9, font: HAND, c: '#7a1a1a' })) + G('translate(150 140) scale(2.4)', P('M-6 -6v-6a6 6 0 0 1 12 0v6', 'none', 'stroke="#9aa7ae" stroke-width="2.4"') + R(-9, -6, 18, 16, '#c9a24a', 'rx="2"') + [-6, -2, 2, 6].map(function (dx) { return R(dx - 1.6, -2, 3.2, 6, '#1a1208', 'rx=".5"'); }).join('')) + vig(); };
  D['70'] = function () { return hangarBg(70) + cage(40, 20, 220, 150, true) + jerry(100, 130, .9, 'y') + jerry(176, 130, .9, 'r') + G('translate(234 66)', R(-18, -24, 36, 48, '#f4ecd8') + lines(-14, -14, ['INVENT.', '— —', '— —'], { fs: 5.4, lh: 8, font: MONO })) + vig() + tag('19', 100, 84) + tag('25', 176, 84) + tag('44', 234, 30); };
  D['44'] = function () {
    var t = T(0, -64, 'INVENTARIO CARBURANTE', 'text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" ' + MONO) + L(-80, -56, 80, -56, '#1a1a1a', 1);
    [['#d9453a', 'Benzina avio 100/130', 'solo per il Norseman!'], ['#e6c23a', 'Gasolio artico', 'generatore e stufe'], ['#3d6fe0', 'Cherosene', 'stufe · FINITO']].forEach(function (r, i) { var y = -36 + i * 34; t += R(-78, y - 10, 22, 14, r[0], 'stroke="#1a1a1a" stroke-width=".6"') + T(-48, y, r[1], 'font-size="10" font-weight="700" fill="#1a1a1a" ' + MONO) + T(-48, y + 11, r[2], 'font-size="8" fill="#3a3a3a" ' + HAND); });
    return hangarBg(44) + paper(150, 110, 190, 160, 1, t) + vig();
  };
  D['19'] = function () { return hangarBg(19) + jerry(150, 110, 2, 'y') + vig(); };
  D['25'] = function () { return hangarBg(25) + jerry(150, 110, 2, 'r') + vig(); };
  D['38'] = function () { return hangarBg(38) + G('translate(150 120) scale(1.6)', R(-50, -30, 100, 60, '#4a6a3a', 'rx="8" stroke="#1a2a12" stroke-width="2"') + R(-14, -40, 28, 12, '#2a2a2a', 'rx="3"') + R(-40, -14, 80, 30, '#2a3a20', 'rx="3"') + R(-36, 8, 0, 4, '#d6b22e') + T(0, 4, 'VUOTO', 'text-anchor="middle" font-size="9" fill="#ff6a5a" ' + MONO) + C(30, -18, 6, '#e6eef4', 'stroke="#1a1a1a"') + L(30, -18, 26, -14, '#d9261c', 1.4)) + vig(); };
  D['57'] = function () { return hangarBg(57) + generator(150, 140, 1.15, false) + jerry(240, 150, .6, 'y') + C(150, 100, 70, 'url(#u-glowW)', 'opacity=".12"') + vig(); };
  D['63'] = function () { return pen('#1a1404', generator(150, 130, .9, false) + jerry(214, 90, .7, 'r') + P('M150 70q20 -30 40 0', 'none', 'stroke="#8a8a80" stroke-width="5" opacity=".6" ' + anim('ua-steam', 0)), '−4:00'); };
  D['46'] = function () {
    var l = lines(-80, -66, ['MOTORE DIESEL – AVVIAMENTO A FREDDO'], { fs: 7.6, font: MONO }) + lines(-80, -46, ['a) Motorino d’avviamento: sempre ultimo.', 'b) Candeletta: subito prima', '   dell’avviamento.', 'c) Mai aprire l’aria prima del gasolio.', 'd) Col gelo artico: decompressore', '   CHIUSO, strozzatore: NON toccare!', 'e) Carburante: solo gasolio.'], { fs: 7.4, lh: 15, font: MONO });
    return hangarBg(46) + paper(150, 110, 196, 178, -1, l) + vig();
  };
  D['58'] = function () { return hangarBg(58) + panel6(150, 110, 1.5, false) + vig(); };
  D['81'] = function () { return hangarBg(81) + generator(150, 150, 1.1, true) + panel6(150, 46, .5, true) + C(150, 10, 120, 'url(#u-glowW)', 'opacity=".3" ' + anim('ua-flick', 0)) + vig(); };
  D['21'] = function () { return hangarBg(21) + bigDoor(40, 20, 220, 150, false) + vig(); };
  D['71'] = function () { return hangarBg(71) + bigDoor(60, 20, 180, 150, true) + runwayLights(false) + vig() + tag('D', 150, 120); };
  D.D = function () {
    var o = sky(8) + snowGround(118) + P('M140 120L160 120L300 220L0 220Z', '#d6dce2', 'opacity=".55"') + runwayLights(false) + plane(80, 34, .55) + windsock(250, 70, .7) + G('translate(48 150)', R(-2, 0, 4, 40, '#5a4028') + R(-30, -26, 60, 28, '#7a5a3a', 'stroke="#3a2614"') + lines(-26, -16, ['PISTE', '09 · 18 · 27 · 36'], { fs: 6, lh: 9, font: MONO, c: '#f4ecd8' }));
    o += lightPanel(132, 168, .42, false) + snowfall(60, 8);
    return o + vig() + tag('8', 250, 46) + tag('47', 48, 108) + tag('29', 132, 132);
  };
  D['8'] = function () { return sky(9) + snowGround(170) + windsock(200, 60, 1.6) + snowfall(70, 9) + vig(); };
  D['47'] = function () {
    var l = lines(-104, -46, ['Si atterra sempre CONTRO VENTO.', 'Ogni testata prende il nome', 'dalla direzione verso cui si atterra:', '09 → est    18 → sud', '27 → ovest  36 → nord'], { fs: 8.6, lh: 15, font: MONO, c: '#f4ecd8' });
    return sky(47) + snowGround(180) + R(146, 120, 8, 80, '#5a4028') + G('translate(150 96)', R(-112, -66, 224, 112, '#7a5a3a', 'stroke="#3a2614" stroke-width="3"') + T(0, -54, 'PISTE DELLA STAZIONE', 'text-anchor="middle" font-size="10" font-weight="700" fill="#ffd27a" ' + MONO) + l) + snowfall(40, 47) + vig();
  };
  D['29'] = function () { return sky(29) + snowGround(170) + lightPanel(150, 108, 1.4, false) + snowfall(30, 29) + vig(); };
  D['79'] = function () { return sky(79) + snowGround(170) + lightPanel(150, 108, 1.4, true) + C(150, 108, 90, 'url(#u-glowW)', 'opacity=".15"') + snowfall(30, 79) + vig(); };
  D['99'] = function () { return sky(99) + snowGround(118) + P('M140 120L160 120L300 220L0 220Z', '#d6dce2', 'opacity=".55"') + runwayLights(true) + plane(150, 120, 1.1) + G('', R(0, 0, 300, 220, '#000', 'opacity="0"'), '') + T(150, 40, '★ ★ ★', 'text-anchor="middle" font-size="16" fill="#ffd27a" ' + anim('ua-glow', 0)) + snowfall(30, 99) + vig(); };
  Object.keys(D).forEach(function (k) { SC['polare:' + k] = D[k]; });
})();
