/* ===== Unlock!: illustrazioni delle avventure di livello 3 e 4 (treno del 1928, tomba egizia) =====
   Stesse regole di art.js: disegni 300×220, numeri visibili con tag(), nascosti con hid(). */
(function () {
  var A = UArt, K = A.K, G = K.G, R = K.R, C = K.C, E = K.E, P = K.P, L = K.L, T = K.T, f = K.f, anim = K.anim, tag = K.tag, hid = K.hid, vig = K.vig, rnd = K.rnd, uid = K.uid;
  var MONO = K.MONO, HAND = K.HAND, SANS = K.SANS, SERIF = 'font-family="Georgia,\'Times New Roman\',serif"';
  var SC = A.scenes, lg = A.lg, rg = A.rg;
  A.addDefs(
    lg('t-mahog', [[0, '#7a3020'], [.5, '#5a1f12'], [1, '#34110a']]) + lg('t-mahogL', [[0, '#9a4a2c'], [1, '#6a2a16']]) + lg('t-mahogH', [[0, '#6a2616'], [.5, '#8a3a22'], [1, '#4a180c']], 1, 0) +
    lg('t-night', [[0, '#050a1c'], [.6, '#122352'], [1, '#2a3f78']]) + lg('t-mount', [[0, '#c9d6ea'], [.35, '#6a7ea6'], [1, '#1d2a4a']]) + lg('t-cloth', [[0, '#fffdf6'], [1, '#d9d0bd']]) +
    lg('t-carpet', [[0, '#7a1822'], [1, '#3a0a10']]) + lg('t-coal', [[0, '#3a3a3c'], [1, '#0b0b0c']]) + lg('t-leather', [[0, '#9a6430'], [.5, '#7a4a20'], [1, '#4e2c10']]) +
    lg('t-velvet', [[0, '#2f6a44'], [1, '#143322']]) + lg('t-iron', [[0, '#4a5058'], [.5, '#2a2e33'], [1, '#121416']]) + lg('t-paper', [[0, '#fbf3df'], [1, '#e6d4ad']]) +
    rg('t-fire', [[0, '#fff6c0'], [.3, '#ffb23a'], [.65, '#d2440f'], [1, '#5a0f00', 0]]) + lg('t-silver', [[0, '#f2f4f6'], [.4, '#aab2ba'], [.7, '#e2e6ea'], [1, '#7a838c']], 1, 1) +
    lg('d-sand', [[0, '#e2b56a'], [.5, '#c48a3e'], [1, '#8a5a22']]) + lg('d-stone', [[0, '#d9b47a'], [.6, '#b88a4a'], [1, '#7a5426']]) + lg('d-stoneD', [[0, '#8a6232'], [1, '#3a240c']]) +
    lg('d-gold', [[0, '#fff1a8'], [.4, '#e8b834'], [.75, '#a8740e'], [1, '#f5d36a']], 1, 1) + lg('d-lapis', [[0, '#3a6ad8'], [1, '#14307a']]) + lg('d-papyrus', [[0, '#f4e4b4'], [.5, '#e8d096'], [1, '#d2b06a']], 1, 0) +
    rg('d-torch', [[0, '#fff3b0', .95], [.35, '#ffae3a', .45], [1, '#ff6a00', 0]]) + lg('d-sky', [[0, '#ff9a4a'], [.45, '#ffcf7a'], [1, '#f4e2b0']]) + lg('d-night', [[0, '#05040e'], [1, '#1c1636']]) +
    lg('d-ray', [[0, '#fff8d0', .9], [1, '#ffd36a', .1]]) + lg('d-green', [[0, '#5fbf7a'], [1, '#1d6a3a']])
  );

  /* =================================================================== */
  /* ===================== kit del treno (1928) ========================= */
  /* =================================================================== */
  function wood(seed) {
    var o = R(0, 0, 300, 220, 'url(#t-mahog)'), r = rnd(seed || 5), x;
    for (x = 0; x < 300; x += 75) o += R(x + 6, 10, 63, 118, 'none', 'stroke="#c9884a" stroke-opacity=".35" stroke-width="1.2" rx="3"') + R(x + 10, 14, 55, 110, 'url(#t-mahogL)', 'opacity=".25" rx="2"');
    for (var i = 0; i < 24; i++) { var y = r() * 220; o += P('M0 ' + f(y) + 'q75 ' + f(r() * 6 - 3) + ' 150 0t150 0', 'none', 'stroke="#2a0a04" stroke-opacity=".25" stroke-width="' + f(.5 + r()) + '"'); }
    o += R(0, 132, 300, 6, 'url(#u-brass)') + R(0, 138, 300, 82, '#3a1208', 'opacity=".55"');
    return o;
  }
  function carpet(y) {
    var o = R(0, y, 300, 220 - y, 'url(#t-carpet)'), i;
    for (i = 0; i < 12; i++) o += P('M' + (i * 28 - 10) + ' ' + (y + 8) + 'l10 6l-10 6l-10 -6z', 'none', 'stroke="#d9a440" stroke-opacity=".45"');
    return o + R(0, y, 300, 3, '#d9a440', 'opacity=".6"');
  }
  function snow(x, y, w, h, n, seed) { var o = '', r = rnd(seed || 9); for (var i = 0; i < n; i++) o += C(x + r() * w, y + r() * h * .3, .6 + r() * 1.2, '#fff', anim('ua-snow', r() * 3.5, 2.5 + r() * 2.5)); return o; }
  function nightView(x, y, w, h, seed) {
    var o = R(x, y, w, h, 'url(#t-night)') + C(x + w * .78, y + h * .22, Math.min(w, h) * .08, 'url(#u-moon)');
    o += P('M' + x + ' ' + (y + h) + 'L' + (x + w * .18) + ' ' + (y + h * .45) + 'L' + (x + w * .32) + ' ' + (y + h * .62) + 'L' + (x + w * .5) + ' ' + (y + h * .3) + 'L' + (x + w * .7) + ' ' + (y + h * .58) + 'L' + (x + w * .86) + ' ' + (y + h * .4) + 'L' + (x + w) + ' ' + (y + h * .55) + 'L' + (x + w) + ' ' + (y + h) + 'Z', 'url(#t-mount)', 'opacity=".9"');
    o += P('M' + (x + w * .5) + ' ' + (y + h * .3) + 'l' + f(w * .06) + ' ' + f(h * .12) + 'l' + f(-w * .03) + ' ' + f(h * .02) + 'l' + f(-w * .03) + ' ' + f(h * .05) + 'l' + f(-w * .04) + ' ' + f(-h * .04) + 'Z', '#eef4ff');
    o += G('', R(x + w * .2, y + h * .5, 2, h * .5, '#0a0f1e') + C(x + w * .2 + 1, y + h * .5, 3, '#ffd37a', 'opacity=".9"'), anim('ua-pass', (seed || 0) % 3, 2.4));
    return o + snow(x, y, w, h, Math.round(w * h / 400), seed);
  }
  function win(x, y, w, h, seed) {
    var cp = uid('tw');
    return R(x - 5, y - 5, w + 10, h + 10, 'url(#u-brass)', 'rx="6"') + R(x - 2, y - 2, w + 4, h + 4, '#2a0e06', 'rx="5"') +
      '<clipPath id="' + cp + '"><rect x="' + x + '" y="' + y + '" width="' + w + '" height="' + h + '" rx="4"/></clipPath>' + G('', nightView(x, y, w, h, seed), 'clip-path="url(#' + cp + ')"') +
      R(x, y, w, h, 'url(#u-glass)', 'rx="4"') + R(x, y + h * .42, w, 3, 'url(#u-brass)') + P('M' + (x - 4) + ' ' + (y - 6) + 'q' + f(w * .25) + ' 14 ' + f(w * .5 + 4) + ' 0q' + f(w * .25) + ' 14 ' + f(w * .5 + 4) + ' 0', '#7a1822', 'opacity=".9"');
  }
  function sconce(x, y) {
    return C(x, y, 46, 'url(#u-glowW)', 'opacity=".55" ' + anim('ua-flick', (x % 7) / 3)) + P('M' + x + ' ' + (y + 14) + 'q-10 -4 -6 -14', 'none', 'stroke="url(#u-brass)" stroke-width="2.4"') +
      P('M' + (x - 7) + ' ' + y + 'q7 -14 14 0q-1 6 -7 7q-6 -1 -7 -7z', '#fff1c8', 'stroke="#c9a24a" stroke-width="1"') + C(x, y - 2, 3, '#fffbe8');
  }
  function table(x, y, w) {
    var o = P('M' + x + ' ' + y + 'h' + w + 'l8 26h' + (-w - 16) + 'z', 'url(#t-cloth)', 'stroke="#b8ad96" stroke-width=".8"') + P('M' + (x - 8) + ' ' + (y + 26) + 'h' + (w + 16) + 'v6h' + (-w - 16) + 'z', '#e9e2d2');
    o += E(x + w * .3, y + 8, 9, 3, '#fff', 'stroke="#c9b48a"') + E(x + w * .72, y + 9, 9, 3, '#fff', 'stroke="#c9b48a"') + R(x + w * .5 - 1.5, y - 14, 3, 14, '#e6eef4', 'opacity=".8"') + P('M' + (x + w * .5 - 5) + ' ' + (y - 22) + 'l10 0l-3 9h-4z', 'rgba(230,240,248,.7)', 'stroke="#9fb0bc" stroke-width=".6"');
    return o + R(x + w * .5 - 18, y + 32, 3, 30, '#2a0e06') + R(x + w * .5 + 15, y + 32, 3, 30, '#2a0e06');
  }
  function pipeIcon(x, y, s) { return G('translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')', P('M-6 -1h6v3a3 3 0 0 1 -3 3a3 3 0 0 1 -3 -3z', '#2a1a0a') + P('M0 0h7', 'none', 'stroke="#2a1a0a" stroke-width="1.4" stroke-linecap="round"') + P('M-4 -3q1 -2 0 -4M-2 -3q1 -2 0 -4', 'none', 'stroke="#2a1a0a" stroke-width=".7" stroke-opacity=".6"')); }
  function door(x, y, w, h, o) {
    o = o || {};
    var s = R(x - 3, y - 3, w + 6, h + 3, '#2a0e06', 'rx="3"') + R(x, y, w, h, 'url(#t-mahogH)', 'rx="2"') + R(x + w * .14, y + h * .1, w * .72, h * .38, o.frost === false ? 'url(#t-mahogL)' : '#e8dcc8', 'rx="2" opacity="' + (o.frost === false ? .6 : .85) + '"') +
      R(x + w * .14, y + h * .56, w * .72, h * .34, 'none', 'stroke="#c9884a" stroke-opacity=".5" rx="2"');
    if (o.frost !== false) s += R(x + w * .14, y + h * .1, w * .72, h * .38, 'url(#u-glass)', 'rx="2"');
    s += C(x + w * .84, y + h * .55, Math.max(1.6, w * .05), 'url(#u-brass)') + R(x + w * .76, y + h * .53, w * .1, 2, 'url(#u-brass)');
    if (o.plate) s += R(x + w * .2, y + h * .14, w * .6, 12, 'url(#u-brass)', 'rx="2" stroke="#6b4a10" stroke-width=".6"') + T(x + w / 2, y + h * .14 + 9, o.plate, 'text-anchor="middle" font-size="9.5" font-weight="700" fill="#3a2608" ' + MONO);
    if (o.cls) s += T(x + w / 2, y + h * .14 + 26, o.cls, 'text-anchor="middle" font-size="9" font-weight="700" fill="#5a3a18" ' + SERIF);
    if (o.pipe) s += pipeIcon(x + w / 2, y + h * .14 + 38, 1.1);
    if (o.txt) s += T(x + w / 2, y + h * .3, o.txt, 'text-anchor="middle" font-size="' + (o.ts || 7) + '" fill="#5a3a18" letter-spacing="1" ' + MONO);
    return s;
  }
  function knife(x, y, s, rot, broken) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-30, -3.5, 26, 7, '#4a2a12', 'rx="3"') + C(-24, 0, 1.2, '#d9c08a') + C(-14, 0, 1.2, '#d9c08a') +
      P(broken ? 'M-4 -4h20l-4 4l5 2l-3 2h-18z' : 'M-4 -4h46q6 2 6 4l-2 4h-50z', 'url(#t-silver)', 'stroke="#6a737c" stroke-width=".6"') + (broken ? P('M30 -6l8 4l-6 4z', 'url(#t-silver)', 'stroke="#6a737c" stroke-width=".6" transform="rotate(30 34 0)"') : ''));
  }
  function oilLamp(x, y, s, lit) {
    var o = '';
    if (lit) o += C(0, 6, 70, 'url(#u-glowW)', 'opacity=".85" ' + anim('ua-flick', 0));
    o += P('M0 -44v10', 'none', 'stroke="#1a1a1a" stroke-width="2"') + P('M-10 -34h20l-2 6h-16z', '#2a2e33') + P('M-12 -28h24v4h-24z', '#3a3f45');
    o += P('M-11 -24q-3 18 0 30h22q3 -12 0 -30z', lit ? 'rgba(255,240,190,.75)' : 'rgba(200,220,230,.35)', 'stroke="#2a2e33" stroke-width="2"');
    if (lit) o += G('', P('M0 2q-4 -6 0 -14q4 8 0 14z', '#fff1a0'), anim('ua-flame', 0)) + P('M0 2q-2 -4 0 -8q2 4 0 8z', '#ff9a2a');
    else o += R(-1.5, -2, 3, 6, '#5a3a18');
    o += P('M-14 6h28l-3 10h-22z', '#2a2e33') + E(0, 16, 12, 3, '#1a1d20') + P('M-11 -24l22 30M11 -24l-22 30', 'none', 'stroke="#2a2e33" stroke-width="1.2" opacity=".6"');
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function matchbox(x, y, s, rot) {
    var o = R(-22, -14, 44, 28, '#1f4f9e', 'rx="2" stroke="#0d2a5e"') + R(-22, -14, 44, 8, '#c9302a') + T(0, 4, 'WAGONS-LITS', 'text-anchor="middle" font-size="5.4" font-weight="700" fill="#ffe9a6" ' + SANS) + T(0, 11, 'Allumettes', 'text-anchor="middle" font-size="5" fill="#fff" ' + HAND);
    o += R(14, -12, 14, 24, '#e8d7b1', 'rx="1" stroke="#9a8a6a"'); for (var i = 0; i < 4; i++) o += R(16 + i * 3, -22 + i, 1.4, 18, '#d8c090') + C(16.7 + i * 3, -22 + i, 1.6, '#c0392b');
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', o);
  }
  function paper(x, y, w, h, rot, inner) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')', R(-w / 2 + 3, -h / 2 + 4, w, h, 'rgba(0,0,0,.4)') + R(-w / 2, -h / 2, w, h, 'url(#t-paper)', 'stroke="#a8946a" stroke-width=".8"') + (inner || '')); }
  function bookOpen(x, y, w, h, l, r, rot) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')', R(-w / 2 - 4, -h / 2 - 3, w + 8, h + 8, '#4a1a0c', 'rx="4"') + R(-w / 2, -h / 2, w / 2 - 1, h, 'url(#t-paper)') + R(1, -h / 2, w / 2 - 1, h, 'url(#t-paper)') +
      R(-2, -h / 2, 4, h, 'rgba(0,0,0,.18)') + G('translate(' + (-w / 2) + ' ' + (-h / 2) + ')', l || '') + G('translate(1 ' + (-h / 2) + ')', r || ''));
  }
  function conductor(x, y, s, keys) {
    var o = E(0, 22, 92, 9, 'rgba(0,0,0,.45)');
    o += P('M-70 8q10 -16 40 -14l60 2q24 0 30 12q-4 14 -30 12l-62 2q-30 0 -38 -14z', '#16264a', 'stroke="#0b1428" stroke-width="1.2"');
    o += P('M28 2l44 -2q8 2 6 8l-42 4z', '#16264a', 'stroke="#0b1428"') + E(80, 6, 6, 4, '#111') + P('M28 14l42 6q6 4 0 8l-44 -4z', '#16264a') + E(74, 26, 6, 4, '#111');
    o += R(-30, -6, 52, 4, 'url(#u-brass)', 'opacity=".9"') + P('M-40 4l6 -10M-20 4l6 -10', 'none', 'stroke="#d9a440" stroke-width="1"') + C(-6, 0, 1.6, '#d9a440') + C(4, 0, 1.6, '#d9a440');
    o += P('M-60 -2q-6 -14 -20 -10', 'none', 'stroke="#16264a" stroke-width="9" stroke-linecap="round"') + C(-82, -12, 4.5, 'url(#u-skin)');
    o += E(-84, 10, 12, 11, '#e8cdb6') + P('M-94 6q2 -10 12 -10q8 0 10 6', '#4a3020') + P('M-90 12q3 2 6 0M-82 12q3 2 6 0', 'none', 'stroke="#6a4a3a" stroke-width="1"') + P('M-88 18q4 1 8 0', 'none', 'stroke="#a0574a" stroke-width="1"');
    o += G('translate(-108 22) rotate(-24)', E(0, 0, 13, 4, '#16264a') + P('M-9 0q0 -10 9 -10q9 0 9 10z', '#16264a') + R(-9, -3, 18, 3, '#111') + R(-4, -9, 8, 3, 'url(#u-brass)'));
    o += G('translate(8 -14) rotate(-10)', R(-10, -6, 20, 14, '#5a1f12', 'stroke="#2a0a04"') + R(-8, -4, 16, 2, '#e8d7b1'));
    if (keys) o += G('translate(18 6)', C(0, 0, 5, 'none', 'stroke="#c9a24a" stroke-width="1.6"') + P('M2 4l3 9M-1 5l-2 9M4 2l8 6', 'none', 'stroke="#b8bec4" stroke-width="1.8" stroke-linecap="round"'));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function keyring(x, y, s) {
    var o = C(0, 0, 16, 'none', 'stroke="url(#u-gold)" stroke-width="4"');
    [[-30, '#c9cdd2'], [20, 'url(#u-gold)'], [65, '#b8bec4'], [110, 'url(#u-gold)']].forEach(function (k, i) {
      o += G('rotate(' + k[0] + ')', R(14, -2.5, 44, 5, k[1], 'rx="2"') + P('M48 2.5v8h5v-4h4v6h5v-10', k[1]) + C(14, 0, 6, 'none', 'stroke="' + (k[1].indexOf('url') ? k[1] : '#c9a24a') + '" stroke-width="3"'));
    });
    o += G('translate(-22 26) rotate(-12)', R(-16, -8, 32, 16, '#f4ead2', 'rx="2" stroke="#8a7a5a"') + C(-12, 0, 2, '#8a7a5a') + T(3, -1, 'Vagone', 'text-anchor="middle" font-size="5.5" fill="#3a2a10" ' + HAND) + T(3, 6, 'letto', 'text-anchor="middle" font-size="5.5" fill="#3a2a10" ' + HAND));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function extinguisher(x, y, s) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', R(-12, -36, 24, 70, '#c0261d', 'rx="10" stroke="#5a0c08" stroke-width="1.5"') + R(-12, -36, 8, 70, '#ff6a5a', 'rx="6" opacity=".35"') + R(-6, -46, 12, 10, 'url(#u-brass)', 'rx="2"') +
      P('M6 -42q16 0 14 24', 'none', 'stroke="#1a1a1a" stroke-width="3"') + R(-10, -8, 20, 18, '#f4ead2', 'rx="1"') + T(0, 0, 'SODA', 'text-anchor="middle" font-size="5.5" font-weight="700" fill="#5a0c08" ' + MONO) + T(0, 7, '1927', 'text-anchor="middle" font-size="4.5" fill="#5a0c08" ' + MONO));
  }
  function mailbag(x, y, s) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-34 40q-8 -40 6 -64q10 -8 28 -8q18 0 28 8q14 24 6 64z', '#b8a27a', 'stroke="#6a5432" stroke-width="1.5"') + P('M-14 -30q14 -10 28 0', 'none', 'stroke="#6a5432" stroke-width="4"') +
      C(0, -28, 4, '#8a8f96') + R(-18, -6, 36, 26, '#e8d9b4', 'rx="2" opacity=".75"') + R(-4, 0, 8, 14, '#c0261d') + R(-7, 3, 14, 8, '#c0261d') + R(-2.5, 1.5, 5, 11, '#fff') + R(-5.5, 4.5, 11, 5, '#fff') +
      T(0, 32, 'POSTE FEDERALI', 'text-anchor="middle" font-size="6" font-weight="700" fill="#4a3a1a" ' + MONO));
  }
  function trunk(x, y, w, h, col, st, dg) {
    var o = R(x + 3, y + 4, w, h, 'rgba(0,0,0,.45)', 'rx="3"') + R(x, y, w, h, col, 'rx="3" stroke="#1a0e04" stroke-width="1.2"') + R(x, y + h * .22, w, 4, '#2a1a0a') + R(x + w * .15, y, 4, h, '#2a1a0a') + R(x + w * .85 - 4, y, 4, h, '#2a1a0a');
    o += C(x + w * .17, y + h * .22 + 2, 1.6, 'url(#u-brass)') + C(x + w * .85 - 2, y + h * .22 + 2, 1.6, 'url(#u-brass)') + R(x + w / 2 - 5, y + h * .3, 10, 7, 'url(#u-brass)', 'rx="1"');
    if (st) o += G('translate(' + (x + w / 2) + ' ' + (y + h * .68) + ') rotate(-4)', L(-14, -12, -10, -6, '#6a5432', .8) + R(-20, -9, 40, 22, '#f4ead2', 'rx="2" stroke="#8a7a5a"') + C(-16, -6, 1.6, '#8a7a5a') +
      T(2, -1, st.toUpperCase(), 'text-anchor="middle" font-size="' + (st.length > 9 ? 5 : 6) + '" font-weight="700" fill="#3a2a10" ' + MONO) + T(2, 10, dg, 'text-anchor="middle" font-size="11" font-weight="700" fill="#a8261d" ' + SERIF));
    return o;
  }
  function padlockDoor(x, y, w, h, o) {
    o = o || {};
    var s = R(x, y, w, h, 'url(#t-iron)', 'rx="3" stroke="#0a0b0c" stroke-width="1.5"'), i;
    for (i = 0; i < 5; i++) s += C(x + 6, y + 10 + i * (h - 20) / 4, 1.6, '#7a838c') + C(x + w - 6, y + 10 + i * (h - 20) / 4, 1.6, '#7a838c');
    s += R(x + w * .55, y + h * .45, w * .5, 8, '#5a6068', 'rx="2"') + G('translate(' + (x + w * .82) + ' ' + (y + h * .52) + ')', P('M-6 0v-7a6 6 0 0 1 12 0v7', 'none', 'stroke="#c9cdd2" stroke-width="2.6"') + R(-10, 0, 20, 18, 'url(#u-brass)', 'rx="3" stroke="#6b4a10"') +
      [0, 1, 2, 3].map(function (k) { return R(-8 + k * 4.2, 6, 3.4, 7, '#1a1208', 'rx=".6"') + T(-6.3 + k * 4.2, 11.5, o.digits ? o.digits[k] : '0', 'text-anchor="middle" font-size="4.6" fill="#ffe9a6" ' + MONO); }).join(''));
    if (o.sign) s += R(x + 10, y + 10, w - 20, 44, '#f4ead2', 'rx="2" stroke="#8a7a5a"') + o.sign;
    return s;
  }
  function valise(x, y, s, open) {
    var o = '';
    if (!open) {
      o += R(-70, -36, 140, 80, 'url(#t-leather)', 'rx="10" stroke="#2a1608" stroke-width="2"') + R(-70, -36, 140, 14, '#5a3412', 'rx="10" opacity=".6"') + P('M-24 -36q0 -20 24 -20q24 0 24 20', 'none', 'stroke="#3a2010" stroke-width="7"');
      o += R(-62, -4, 124, 3, '#3a2010', 'opacity=".6"') + R(-48, -12, 10, 18, 'url(#u-brass)', 'rx="2"') + R(38, -12, 10, 18, 'url(#u-brass)', 'rx="2"');
      o += R(-22, -2, 44, 18, 'url(#u-brass)', 'rx="3" stroke="#6b4a10"') + [0, 1, 2, 3].map(function (k) { return R(-18 + k * 9.5, 1, 7.5, 12, '#1a1208', 'rx="1"') + T(-14.2 + k * 9.5, 10.5, '0', 'text-anchor="middle" font-size="8" fill="#ffe9a6" ' + MONO); }).join('');
      o += T(46, 34, 'E.B.', 'text-anchor="middle" font-size="9" font-weight="700" fill="#d9a440" ' + SERIF);
    } else {
      o += P('M-72 -10l12 -46h120l12 46z', '#5a3412', 'stroke="#2a1608" stroke-width="2"') + P('M-64 -12l9 -38h110l9 38z', '#a8261d', 'opacity=".75"');
      o += R(-74, -10, 148, 54, 'url(#t-leather)', 'rx="8" stroke="#2a1608" stroke-width="2"') + R(-66, -4, 132, 42, '#8a1a14', 'rx="5"');
    }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function watch(x, y, s, open) {
    var o = C(0, 0, 44, 'url(#t-silver)', 'stroke="#5a636c" stroke-width="2"') + C(0, 0, 38, '#fbf8ee', 'stroke="#8a929a"');
    for (var i = 0; i < 12; i++) { var a = i * Math.PI / 6; o += T(f(Math.sin(a) * 30), f(-Math.cos(a) * 30 + 3.5), ['XII', 'I', 'II', 'III', 'IIII', 'V', 'VI', 'VII', 'VIII', 'IX', 'X', 'XI'][i], 'text-anchor="middle" font-size="6.5" fill="#1a1a1a" ' + SERIF); }
    o += L(0, 0, 0, -22, '#1a1a1a', 2) + L(0, 0, 16, 6, '#1a1a1a', 1.5) + C(0, 0, 2, '#1a1a1a') + R(-5, -54, 10, 10, 'url(#t-silver)', 'rx="2"') + C(0, -60, 6, 'none', 'stroke="#8a929a" stroke-width="2.4"');
    if (open) {
      o = G('translate(-96 0)', C(0, 0, 44, 'url(#t-silver)', 'stroke="#5a636c" stroke-width="2"') + C(0, 0, 38, '#d8dde2') + C(0, 0, 38, 'url(#u-glass)') +
        G('scale(-1 1)', T(0, 12, '2618', 'text-anchor="middle" font-size="25" fill="#5a636c" letter-spacing="1" ' + SERIF)) + T(0, -14, '❦', 'text-anchor="middle" font-size="12" fill="#7a838c"') + P('M-24 22q24 10 48 0', 'none', 'stroke="#7a838c" stroke-width=".8"')) +
        R(-56, -4, 16, 8, 'url(#t-silver)') + G('', o) + T(0, 22, 'E.B.', 'text-anchor="middle" font-size="8" fill="#5a636c" ' + SERIF);
    }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function railKey(x, y, s, rot) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-60, -6, 88, 12, 'url(#t-iron)', 'rx="3"') + R(-60, -4, 88, 3, '#9aa2aa', 'opacity=".6"') + R(-74, -22, 14, 44, 'url(#t-iron)', 'rx="4"') +
      R(28, -11, 24, 22, 'url(#t-iron)', 'rx="2"') + P('M34 6l6 -11l6 11z', '#0a0b0c') + C(-67, 0, 3, '#0a0b0c'));
  }
  function phrasebook(x, y, s, rot, open) {
    if (!open) return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-26, -36, 52, 72, '#1f6a3a', 'rx="3" stroke="#0e3a1e" stroke-width="1.5"') + R(-26, -36, 8, 72, '#174f2c') +
      T(4, -14, 'ITALIANO', 'text-anchor="middle" font-size="6.5" font-weight="700" fill="#ffe9a6" ' + SERIF) + T(4, -4, '·', 'text-anchor="middle" font-size="8" fill="#ffe9a6"') + T(4, 6, 'TEDESCO', 'text-anchor="middle" font-size="6.5" font-weight="700" fill="#ffe9a6" ' + SERIF) + R(-14, 16, 36, 1, '#ffe9a6'));
    var words = [['Treno', 'Zug'], ['Stazione', 'Bahnhof'], ['Biglietto', 'Fahrkarte'], ['Pericolo', 'Gefahr'], ['Ponte', 'Brücke'], ['Uscita', 'Ausgang']], w2 = [['Fischio', 'Pfeife'], ['Freno', 'Bremse'], ['Luce', 'Licht'], ['Regolatore', 'Regler'], ['Sabbiera', 'Sander'], ['Vapore', 'Dampf']];
    function col(ws) { return T(66, 16, 'Sul treno — Im Zug', 'text-anchor="middle" font-size="8" font-style="italic" fill="#5a3a18" ' + SERIF) + ws.map(function (p, i) { return T(10, 36 + i * 19, p[0], 'font-size="9.5" fill="#3a2a10" ' + SERIF) + T(122, 36 + i * 19, p[1], 'text-anchor="end" font-size="9.5" font-weight="700" fill="#1d3550" ' + SERIF) + L(10, 40 + i * 19, 122, 40 + i * 19, '#c9b48a', .5, 'stroke-dasharray="1 2"'); }).join(''); }
    return bookOpen(x, y, 268, 150, col(words), col(w2), rot);
  }
  function brakeLever(x, y, s, st) {
    var o = R(-34, 30, 68, 26, 'url(#t-iron)', 'rx="4"') + C(0, 30, 16, 'url(#u-brass)', 'stroke="#6b4a10"') + C(0, 30, 5, '#2a1a08');
    var arm = st === 'bent' ? 'M0 30Q6 -10 34 -38' : 'M0 30L22 -46';
    o += P(arm, 'none', 'stroke="#000" stroke-opacity=".35" stroke-width="11" stroke-linecap="round" transform="translate(3 3)"') + P(arm, 'none', 'stroke="url(#t-iron)" stroke-width="10" stroke-linecap="round"') + P(arm, 'none', 'stroke="#8a929a" stroke-width="2" stroke-opacity=".7"');
    var tip = st === 'bent' ? 'translate(34 -38) rotate(40)' : 'translate(22 -46) rotate(16)';
    if (st === 'ok') o += G(tip, R(-7, -24, 14, 26, 'url(#u-brass)', 'rx="6" stroke="#6b4a10"') + R(-5, -22, 4, 22, '#fff2b8', 'opacity=".5" rx="2"'));
    else o += G(tip, R(-3, -10, 6, 10, '#9aa2aa') + P('M-3 -8h6M-3 -5h6M-3 -2h6', 'none', 'stroke="#4a5058" stroke-width=".8"'));
    o += T(-24, 47, 'BREMSE', 'font-size="8" font-weight="700" fill="#ffe9a6" ' + MONO) + R(10, 38, 18, 12, '#1a1a1a', 'rx="2"') + C(19, 44, 3.5, st === 'ok' ? '#3dff7a' : '#ff4236', anim('ua-blink', 0));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function handle(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-10, -36, 20, 60, 'url(#u-brass)', 'rx="9" stroke="#6b4a10" stroke-width="1.5"') + R(-6, -32, 6, 50, '#fff2b8', 'opacity=".5" rx="3"') + R(-4, 24, 8, 16, '#9aa2aa') + P('M-4 28h8M-4 32h8M-4 36h8', 'none', 'stroke="#4a5058" stroke-width="1"')); }
  function coal(x, y, w, h, seed) {
    var o = P('M' + x + ' ' + (y + h) + 'Q' + (x + w * .2) + ' ' + y + ' ' + (x + w * .5) + ' ' + (y + h * .1) + 'Q' + (x + w * .8) + ' ' + y + ' ' + (x + w) + ' ' + (y + h) + 'Z', 'url(#t-coal)'), r = rnd(seed || 3);
    for (var i = 0; i < w * h / 70; i++) { var cx = x + r() * w, cy = y + h * .2 + r() * h * .8, s = 2 + r() * 4; o += P('M' + f(cx) + ' ' + f(cy) + 'l' + f(s) + ' ' + f(-s * .6) + 'l' + f(s * .8) + ' ' + f(s * .7) + 'l' + f(-s) + ' ' + f(s * .6) + 'z', r() < .5 ? '#2a2a2c' : '#141416', 'stroke="#4a4a50" stroke-width=".3"'); }
    return o;
  }
  function backhead(x, y, w, h) {
    var o = R(x, y, w, h, 'url(#t-iron)', 'rx="' + (w * .3) + '"') + R(x + w * .1, y + h * .06, w * .8, h * .1, '#2a2e33', 'rx="3"');
    o += K.gauge(x + w * .3, y + h * .2, w * .12, .72) + K.gauge(x + w * .7, y + h * .2, w * .12, .45) + R(x + w * .44, y + h * .14, w * .12, h * .2, 'url(#u-brass)', 'rx="3"');
    o += R(x + w * .2, y + h * .55, w * .6, h * .3, '#1a0a04', 'rx="6" stroke="#5a6068" stroke-width="2"') + R(x + w * .26, y + h * .6, w * .48, h * .2, 'url(#t-fire)', anim('ua-flick', .3)) + C(x + w * .5, y + h * .7, w * .5, 'url(#u-glowO)', 'opacity=".5" ' + anim('ua-glow', 0));
    o += P('M' + (x + w * .1) + ' ' + (y + h * .45) + 'h' + (w * .8), 'none', 'stroke="url(#u-copH)" stroke-width="4"') + C(x + w * .14, y + h * .45, 4, '#c23b2c') + C(x + w * .86, y + h * .45, 4, '#c23b2c');
    return o;
  }
  function cabWall() { return R(0, 0, 300, 220, '#1a1210') + R(0, 0, 300, 40, '#120c0a') + R(0, 196, 300, 24, '#0c0806') + G('', K.rivets ? '' : '', ''); }
  function driver(x, y, s) {
    var o = E(0, 52, 30, 6, 'rgba(0,0,0,.4)') + R(-16, -8, 32, 50, '#3a4a5a', 'rx="10"') + P('M-16 8h32M-16 22h32', 'none', 'stroke="#c9b48a" stroke-width="3"') + P('M-14 40l-4 14M10 40l6 14', 'none', 'stroke="#2a3440" stroke-width="9" stroke-linecap="round"');
    o += C(0, -20, 12, 'url(#u-skin)') + P('M-12 -24q12 -16 24 0q-4 -6 -12 -6q-8 0 -12 6z', '#5a3a20') + R(-12, -18, 24, 6, '#e8e2d4', 'rx="2"') + C(-4, -24, 1.4, '#2a1a12') + C(4, -24, 1.4, '#2a1a12') + P('M-13 -32h26l-2 -6h-22z', '#1a1a1a');
    o += P('M-20 0q20 -6 40 0M-20 30q20 6 40 0', 'none', 'stroke="#b08a5a" stroke-width="2.6"') + P('M-20 16q20 6 40 0', 'none', 'stroke="#b08a5a" stroke-width="2.6"');
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function lever(x, y, h, col, label, up) { return R(x - 2, y, 4, h, '#2a2e33') + G('translate(' + x + ' ' + y + ') rotate(' + (up ? -12 : 10) + ')', R(-2.5, -h * .7, 5, h * .7, 'url(#t-silver)') + C(0, -h * .7, 6, col, 'stroke="#000" stroke-opacity=".5"') + C(-2, -h * .7 - 2, 1.8, '#fff', 'opacity=".5"')) + R(x - 18, y + h + 2, 36, 11, '#f4ead2', 'rx="2" stroke="#8a7a5a"') + T(x, y + h + 10, label, 'text-anchor="middle" font-size="6.8" font-weight="700" fill="#1a1a1a" ' + MONO); }
  function desk(x, y, w, labels, cols) {
    var o = P('M' + x + ' ' + (y + 70) + 'L' + (x + 10) + ' ' + y + 'H' + (x + w - 10) + 'L' + (x + w) + ' ' + (y + 70) + 'Z', 'url(#t-iron)', 'stroke="#0a0b0c" stroke-width="1.5"');
    labels.forEach(function (l, i) { o += lever(x + 22 + i * (w - 44) / (labels.length - 1), y + 18, 30, cols[i], l, i % 2); });
    return o;
  }
  function locoSide(x, y, s, lit) {
    var o = R(-110, -22, 150, 40, '#1a1d22', 'rx="6"') + R(-110, -22, 150, 8, '#2a2e33', 'rx="4"') + R(40, -46, 60, 64, '#1a1d22', 'rx="4"') + R(48, -40, 20, 18, lit ? '#ffcf6a' : '#0e1820') + R(74, -40, 20, 18, lit ? '#ffcf6a' : '#0e1820');
    o += R(-96, -48, 14, 28, '#141618') + R(-100, -52, 22, 6, '#141618') + R(-60, -36, 18, 14, '#2a2e33', 'rx="8"') + C(-112, -2, 10, '#fff6c8') + C(-112, -2, 34, 'url(#u-glowW)', 'opacity=".7"');
    [-86, -46, -6, 30, 66].forEach(function (cx, i) { o += C(cx, 22, i < 3 ? 16 : 11, '#0c0d0f', 'stroke="#5a6068" stroke-width="2"') + C(cx, 22, 3, '#9aa2aa'); });
    o += R(-90, 18, 120, 4, '#9aa2aa');
    o += G('', C(-89, -60, 10, 'rgba(230,230,240,.5)') + C(-80, -76, 14, 'rgba(230,230,240,.35)') + C(-64, -92, 18, 'rgba(230,230,240,.2)'), anim('ua-steam', 0));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function viaduct(x, y, w, broken) {
    var o = R(x, y, w, 10, '#3a3f4a'), n = Math.floor(w / 46);
    for (var i = 0; i < n; i++) { var ax = x + i * 46; if (broken && i >= n - 2) continue; o += P('M' + ax + ' ' + (y + 10) + 'v80h8v-50a15 15 0 0 1 30 0v50h8v-80z', '#2a2f3a'); }
    if (broken) o = o.replace(R(x, y, w, 10, '#3a3f4a'), R(x, y, w - 92, 10, '#3a3f4a') + P('M' + (x + w - 92) + ' ' + y + 'l10 4l-6 6l8 2l-12 -2z', '#3a3f4a'));
    return o + R(x, y - 3, broken ? w - 92 : w, 3, '#7a838c');
  }
  function pen(bg, inner, txt) { return R(0, 0, 300, 220, bg) + inner + G('', K.hazard(300)) + G('translate(0 208)', K.hazard(300)) + T(150, 196, txt, 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a" stroke="#000" stroke-width=".8"') + vig(); }

  /* ------------------------- carte del treno ------------------------- */
  var S = {};
  S.start = function () {
    var o = R(0, 0, 300, 220, 'url(#t-night)') + C(236, 40, 16, 'url(#u-moon)') + C(236, 40, 40, 'url(#u-glowW)', 'opacity=".25"');
    o += P('M0 150L40 80L70 112L110 60L150 104L190 70L230 118L270 84L300 110V220H0Z', 'url(#t-mount)') + P('M110 60l12 22l-6 2l-4 8l-8 -10l-6 4z', '#eef4ff') + P('M40 80l8 16l-6 0l-4 6l-6 -10z', '#eef4ff');
    o += viaduct(0, 150, 300, false) + G('', locoSide(170, 130, .62, true), anim('ua-shake', 0));
    for (var i = 0; i < 3; i++) o += G('translate(' + (196 + i * 64) + ' 128) scale(.62)', R(0, -30, 96, 44, '#4a1a10', 'rx="4"') + [0, 1, 2, 3].map(function (k) { return R(8 + k * 22, -22, 14, 14, '#ffcf6a', anim('ua-flick', k * .3 + i)); }).join('') + C(14, 18, 8, '#0c0d0f') + C(80, 18, 8, '#0c0d0f'));
    o += snow(0, 0, 300, 220, 60, 11);
    o += paper(78, 186, 120, 46, -6, T(0, -12, 'TELEGRAMMA · TÉLÉGRAMME', 'text-anchor="middle" font-size="6.5" fill="#7a2a1a" ' + MONO) + R(-52, -8, 104, 9, '#f4e6a8') + T(0, -1.4, 'VIADOTTO GOLA NERA CROLLATO', 'text-anchor="middle" font-size="6.6" font-weight="700" fill="#1a1a1a" ' + MONO) + R(-52, 4, 104, 9, '#f4e6a8') + T(0, 10.6, 'STOP FERMATE IL TRENO STOP', 'text-anchor="middle" font-size="6.6" font-weight="700" fill="#1a1a1a" ' + MONO));
    return o + vig() + tag('A', 150, 112);
  };
  S.A = function () {
    var o = wood(1) + win(12, 22, 70, 86, 1) + win(214, 22, 72, 86, 2) + sconce(196, 40);
    o += door(124, 18, 52, 116, { txt: 'WAGONS-LITS', ts: 5.6 }) + carpet(134);
    o += G('translate(103 30)', P('M-6 0h8v8', 'none', 'stroke="url(#u-brass)" stroke-width="2"') + G('', oilLamp(2, 34, .55, false), anim('ua-sway', 0)));
    o += paper(258, 120, 34, 26, 4, T(0, -6, 'ORARIO', 'text-anchor="middle" font-size="5" font-weight="700" fill="#3a2a10" ' + MONO) + L(-12, -1, 12, -1, '#8a7a5a', .6) + L(-12, 3, 12, 3, '#8a7a5a', .6) + L(-12, 7, 12, 7, '#8a7a5a', .6));
    o += table(14, 150, 78) + knife(56, 155, .32, -14);
    o += G('translate(222 140)', R(0, 0, 78, 46, '#4a1a0c', 'stroke="#2a0a04"') + R(-4, -4, 82, 6, 'url(#u-brass)') + R(6, -20, 6, 16, '#2a6a3a', 'rx="2"') + R(16, -24, 7, 20, '#7a1a12', 'rx="2"') + R(27, -18, 5, 14, '#c9a24a', 'rx="2"') + matchbox(56, -6, .26, 8));
    o += conductor(156, 178, .62, false);
    o += G('translate(30 206) rotate(-12)', R(-9, -4, 18, 8, '#e8dcb8', 'opacity=".9"') + L(-7, 0, 6, 0, '#8a7a5a', .5));
    o += hid('5', 30, 206, '#8a7a5a', 6.5, -12, .55) + hid('8', 271, 128, '#ffe9a6', 6, 8, .5);
    return o + vig() + tag('12', 150, 70) + tag('23', 104, 92) + tag('9', 276, 102) + tag('4', 60, 138) + tag('21', 180, 160);
  };
  S['21'] = function () { return wood(21) + carpet(110) + C(150, 150, 120, 'url(#u-glowW)', 'opacity=".2"') + conductor(160, 148, 1.15, true) + hid('7', 180, 162, '#e8ecef', 7.5, 20, .6) + vig() + tag('3', 168, 116); };
  S['7'] = function () { return wood(7) + C(150, 110, 110, 'url(#u-glowW)', 'opacity=".3"') + keyring(150, 106, 1.5) + vig(); };
  S['12'] = function () { return wood(12) + carpet(196) + door(96, 14, 108, 182, { txt: 'WAGONS-LITS', ts: 8 }) + G('translate(178 112) scale(2)', R(-6, -9, 12, 18, 'url(#u-brass)', 'rx="2" stroke="#6b4a10"') + C(0, -2, 2.4, '#1a1208') + R(-.8, -1, 1.6, 6, '#1a1208')) + sconce(56, 60) + sconce(244, 60) + vig(); };
  S['16'] = function () { return pen('#2a0d0a', door(110, 30, 80, 140, {}) + knife(160, 110, .9, -30, true) + C(140, 130, 3, '#c0261d') + C(146, 136, 2, '#c0261d'), '−2:00'); };
  S['19'] = function () {
    var o = wood(19) + R(96, 10, 108, 186, '#120604') + P('M108 20L192 20L170 70L130 70Z', '#3a1a0e') + P('M108 186L192 186L170 120L130 120Z', 'url(#t-carpet)') + P('M108 20L130 70L130 120L108 186Z', '#5a1f12') + P('M192 20L170 70L170 120L192 186Z', '#2a0e06');
    for (var i = 0; i < 3; i++) o += R(173 + i * 6, 76 - i * 4, 4, 30 + i * 8, '#3a1408') + R(118 - i * 6, 80 - i * 4, 6, 14, '#1a2a50', 'opacity=".8"');
    o += R(144, 74, 12, 44, '#3a1408') + C(150, 66, 14, 'url(#u-glowW)', 'opacity=".6"') + G('translate(28 14)', door(-20, 0, 60, 182, {}), 'opacity=".95" transform="translate(28 14) skewY(8)"');
    return o + carpet(196) + vig() + tag('B', 150, 100);
  };
  S['4'] = function () { return wood(4) + R(40, 70, 220, 110, 'url(#t-cloth)', 'rx="4"') + P('M60 80h180M60 170h180', 'none', 'stroke="#c9302a" stroke-width="2" stroke-dasharray="6 4" opacity=".5"') + knife(150, 124, 1.6, -10) + vig(); };
  S['23'] = function () { return wood(23) + L(150, 0, 150, 40, '#1a1a1a', 2) + G('', oilLamp(150, 112, 1.7, false), anim('ua-sway', 0)) + vig(); };
  S['8'] = function () { return wood(8) + R(30, 120, 240, 100, '#4a1a0c') + R(30, 116, 240, 6, 'url(#u-brass)') + C(150, 110, 110, 'url(#u-glowW)', 'opacity=".2"') + matchbox(150, 110, 2.3, -8) + vig(); };
  S['31'] = function () { return wood(31) + L(150, 0, 150, 40, '#1a1a1a', 2) + G('', oilLamp(150, 112, 1.7, true), anim('ua-sway', 0)) + vig(); };
  S['9'] = function () {
    var rows = [['Milano C.le', '21.05'], ['Gallarate', '21.32'], ['Arona', '21.58'], ['Stresa', '22.20'], ['Domodossola', '23.40'], ['Iselle', '23.58'], ['Briga', '0.31'], ['Visp', '0.45'], ['Sion', '1.22'], ['Losanna', '2.40'], ['Ginevra', '3.28']];
    var t = T(0, -84, 'ESPRESSO DEL SEMPIONE · N. 51', 'text-anchor="middle" font-size="9" font-weight="700" fill="#3a2a10" ' + MONO) + L(-96, -78, 96, -78, '#3a2a10', 1);
    rows.forEach(function (r, i) { var y = -64 + i * 14.4; t += T(-88, y, r[0], 'font-size="10" fill="#1a1a1a" ' + SERIF) + T(88, y, r[1], 'text-anchor="end" font-size="10" font-weight="700" fill="#1a1a1a" ' + MONO) + L(-88, y + 3.5, 88, y + 3.5, '#c9b48a', .5, 'stroke-dasharray="1 2"'); });
    return wood(9) + paper(150, 112, 210, 196, -2, t) + vig();
  };
  S['5'] = function () {
    var t = R(-96, -40, 192, 80, '#e9d9a8') + P('M96 -40l-8 10l6 8l-8 9l7 9l-6 10l8 8l-7 10l8 16', 'none', 'stroke="#2a0e06" stroke-width="4"') + R(-96, -40, 192, 16, '#7a2a1a') + T(-4, -28, 'COMPAGNIE INTERNATIONALE DES WAGONS-LITS', 'text-anchor="middle" font-size="6.2" font-weight="700" fill="#ffe9a6" ' + MONO);
    t += T(-90, -8, '…SSOLA', 'font-size="13" font-weight="700" fill="#1a1a1a" ' + MONO) + T(-14, -8, '→ GINEVRA', 'font-size="13" font-weight="700" fill="#1a1a1a" ' + MONO) + T(-90, 10, '1ª CLASSE · VAGONE LETTO', 'font-size="9.5" fill="#1a1a1a" ' + MONO) + T(-90, 26, 'FUMAT…', 'font-size="9.5" fill="#1a1a1a" ' + MONO);
    t += C(60, 18, 15, 'none', 'stroke="#a8261d" stroke-width="2" opacity=".7"') + T(60, 21, 'CIWL', 'text-anchor="middle" font-size="7" fill="#a8261d" opacity=".8" ' + MONO);
    return wood(5) + carpet(150) + G('translate(150 110) rotate(-5)', R(-93, -36, 192, 80, 'rgba(0,0,0,.4)') + t) + vig();
  };
  S['3'] = function () {
    var L1 = [['62', 'Contessa A. Bellini', 'Milano → Losanna'], ['64', 'Prof. U. Sarti', 'Milano → Ginevra'], ['66', 'Mme O. Ray', 'Domodossola → Ginevra'], ['68', 'Sig. E. Bassi', 'Domodossola → Ginevra']];
    var R2 = [['72', 'Dott. P. Galli', 'Arona → Sion'], ['74', 'Sigg. Weber', 'Stresa → Ginevra'], ['76', 'Avv. C. Neri', 'Domodossola → Ginevra'], ['78', '— libera —', '']];
    function page(rows) { return T(68, 16, 'Cabina · Passeggero', 'text-anchor="middle" font-size="7.5" font-style="italic" fill="#5a3a18" ' + SERIF) + rows.map(function (r, i) { var y = 36 + i * 30; return T(8, y + 4, r[0], 'font-size="13" font-weight="700" fill="#a8261d" ' + MONO) + T(32, y, r[1], 'font-size="9" fill="#1a1a1a" ' + SERIF) + T(32, y + 11, r[2], 'font-size="8.4" fill="#1d3550" ' + SERIF) + L(6, y + 16, 132, y + 16, '#c9b48a', .5); }).join(''); }
    return wood(3) + bookOpen(150, 112, 280, 160, page(L1), page(R2), 0) + T(150, 22, 'REGISTRO DEL VAGONE LETTO · 12 GENNAIO 1928', 'text-anchor="middle" font-size="7.5" fill="#ffe9a6" ' + MONO) + vig();
  };
  S.B = function () {
    var o = wood(30) + R(0, 0, 300, 10, '#2a0e06') + carpet(196), plates = ['62', '64', '66', '68', '72', '74', '76', '78'], pipes = { '64': 1, '68': 1, '72': 1, '76': 1 };
    plates.forEach(function (p, i) { var x = 6 + i * 34 + (i >= 4 ? 20 : 0); o += door(x, 30, 30, 166, { plate: p, cls: i < 4 ? '1ª' : '2ª', pipe: !!pipes[p], frost: true }); });
    o += T(76, 22, '1ª CLASSE', 'text-anchor="middle" font-size="7" fill="#ffe9a6" letter-spacing="2" ' + MONO) + T(232, 22, '2ª CLASSE', 'text-anchor="middle" font-size="7" fill="#ffe9a6" letter-spacing="2" ' + MONO);
    o += extinguisher(150, 120, .38) + sconce(150, 40);
    o += G('translate(254 4)', R(0, 0, 44, 12, 'url(#u-brass)', 'rx="2"') + T(22, 9, 'BAGAGLI →', 'text-anchor="middle" font-size="6.4" font-weight="700" fill="#3a2608" ' + MONO));
    return o + vig() + tag('41', 286, 34) + tag('36', 150, 160);
  };
  S['36'] = function () { return wood(36) + C(150, 110, 100, 'url(#u-glowR)', 'opacity=".2"') + extinguisher(150, 120, 1.9) + vig(); };
  S['41'] = function () {
    return wood(41) + carpet(196) + door(90, 12, 120, 184, { frost: false }) + R(108, 30, 84, 24, '#f4ead2', 'rx="2" stroke="#8a7a5a"') + T(150, 41, 'BAGAGLIAIO', 'text-anchor="middle" font-size="9" font-weight="700" fill="#1a1a1a" ' + MONO) + T(150, 50, 'SOLO PERSONALE DI SERVIZIO', 'text-anchor="middle" font-size="5.5" fill="#a8261d" ' + MONO) +
      G('translate(176 118) scale(1.8)', C(0, 0, 9, 'url(#u-brass)', 'stroke="#6b4a10"') + C(0, 0, 6, '#1a1208') + P('M-3 2l3 -5l3 5z', '#c9a24a')) + vig();
  };
  S['68'] = function () {
    var o = wood(68) + win(22, 24, 70, 70, 6) + R(10, 128, 150, 70, 'url(#t-velvet)', 'rx="6"') + R(10, 122, 150, 12, '#e8e2d4', 'rx="4"') + R(14, 100, 60, 26, '#f4f0e6', 'rx="8"');
    o += valise(96, 146, .55, false) + R(196, 120, 90, 80, '#3a1408') + R(204, 112, 74, 12, '#e8eef2', 'rx="4"') + E(241, 118, 24, 4, '#c9d6de');
    o += E(241, 62, 28, 36, 'url(#u-brass)') + E(241, 62, 24, 32, '#9fb6c6') + E(241, 62, 24, 32, 'url(#u-glass)') + P('M228 52q8 -10 20 -8', 'none', 'stroke="#fff" stroke-width="2" stroke-opacity=".6"');
    o += watch(232, 108, .18, false) + carpet(198);
    return o + vig() + tag('43', 96, 120) + tag('27', 232, 92);
  };
  S['27'] = function () { return wood(27) + R(20, 150, 260, 70, '#e8eef2') + C(170, 110, 120, 'url(#u-glowW)', 'opacity=".25"') + watch(196, 104, 1.25, true) + vig(); };
  S['43'] = function () { return wood(43) + carpet(170) + R(20, 150, 260, 30, 'url(#t-velvet)', 'rx="6"') + valise(150, 120, 1.2, false) + vig(); };
  S['44'] = function () { return wood(44) + R(20, 150, 260, 30, 'url(#t-velvet)', 'rx="6"') + valise(150, 128, 1.3, true) + railKey(98, 140, .55, -10) + paper(166, 140, 56, 40, 8, P('M-20 -8h40M-20 0h34M-20 8h38', 'none', 'stroke="#3a2a10" stroke-width=".8"')) + phrasebook(226, 138, .62, 14, false) + vig() + tag('15', 82, 118) + tag('48', 166, 112) + tag('39', 230, 104); };
  S['15'] = function () { return wood(15) + C(150, 110, 110, 'url(#u-glowW)', 'opacity=".25"') + railKey(160, 110, 1.4, -14) + vig(); };
  S['48'] = function () {
    var lines = ['Il macchinista è legato', 'e il fuochista è sceso', 'a Domodossola. Ho tolto la', 'maniglia della leva del freno', 'e l’ho nascosta nel carbone', 'del tender: nessuno fermerà', 'l’Espresso prima della Gola Nera.'];
    return wood(48) + paper(150, 112, 220, 190, 2, lines.map(function (l, i) { return T(-96, -60 + i * 20, l, 'font-size="15" fill="#1d2a4a" ' + HAND); }).join('') + T(84, 84, '— E.B.', 'text-anchor="end" font-size="17" fill="#1d2a4a" ' + HAND)) + vig();
  };
  S['39'] = function () { return wood(39) + phrasebook(150, 112, 1, -1, true) + vig(); };
  S['56'] = function () { return wood(56) + door(70, 12, 50, 184, { frost: false }) + R(124, 12, 120, 184, '#060404') + C(184, 110, 90, 'url(#u-glowW)', 'opacity=".08"') + R(150, 120, 40, 50, '#1a1210') + R(196, 140, 30, 40, '#140e0c') + carpet(196) + vig() + tag('C', 184, 100); };
  S.C = function () {
    var o = R(0, 0, 300, 220, '#2a1c14') + R(0, 0, 300, 220, 'url(#u-vig)');
    for (var i = 0; i < 10; i++) o += R(i * 30, 0, 2, 220, '#1a100a');
    o += K.lamp(110, 6, 'W') + padlockDoor(10, 40, 70, 156, {}) + R(0, 196, 300, 24, '#1a100a');
    o += R(96, 140, 60, 56, '#7a5a32', 'stroke="#3a2a14"') + P('M96 140l60 56M156 140l-60 56', 'none', 'stroke="#3a2a14"') + R(104, 108, 46, 32, '#8a6a3e', 'stroke="#3a2a14"') + mailbag(186, 158, .7);
    o += R(222, 0, 78, 220, '#030202') + R(222, 0, 78, 220, 'url(#u-vig)') + R(236, 120, 40, 50, '#0a0706', 'opacity=".9"') + R(250, 160, 36, 36, '#0c0807');
    return o + vig() + tag('59', 45, 32) + tag('26', 186, 118) + tag('17', 262, 90);
  };
  S['17'] = function () { return R(0, 0, 300, 220, '#020101') + R(80, 90, 70, 60, '#0a0605') + R(160, 110, 80, 70, '#0c0807') + R(110, 150, 60, 50, '#080504') + C(150, 110, 120, 'url(#u-vig)') + T(150, 200, '?', 'text-anchor="middle" font-size="18" fill="#2a2018" ' + SERIF); };
  S['47'] = function () {
    var o = R(0, 0, 300, 220, '#2a1c14') + C(150, 90, 170, 'url(#u-glowW)', 'opacity=".45"') + R(0, 196, 300, 24, '#1a100a');
    o += trunk(14, 22, 88, 62, '#6a2a16', 'Arona', '7') + trunk(106, 18, 88, 66, '#2a4a6a', 'Sion', '4') + trunk(198, 26, 88, 58, '#4a5a2a', 'Stresa', '1');
    o += trunk(14, 104, 88, 66, '#5a3a1a', 'Losanna', '6') + trunk(106, 108, 88, 62, '#7a2a3a', 'Ginevra', '8') + trunk(198, 102, 88, 68, '#3a3a4a', 'Briga', '3');
    return o + oilLamp(150, 196, .4, true) + vig();
  };
  S['26'] = function () { return R(0, 0, 300, 220, '#2a1c14') + C(150, 110, 100, 'url(#u-glowW)', 'opacity=".2"') + mailbag(150, 110, 2) + vig(); };
  S['30'] = function () {
    var o = mailbag(110, 120, 1.1); for (var i = 0; i < 9; i++) o += G('translate(' + (150 + (i % 3) * 30) + ' ' + (80 + Math.floor(i / 3) * 30) + ') rotate(' + (i * 23 % 40 - 20) + ')', R(-12, -8, 24, 16, '#f4ead2', 'stroke="#8a7a5a"') + P('M-12 -8l12 8l12 -8', 'none', 'stroke="#8a7a5a"'));
    o += G('translate(240 110)', E(0, 56, 26, 6, 'rgba(0,0,0,.4)') + R(-16, -10, 32, 60, '#2a3a5a', 'rx="8"') + C(0, -22, 12, 'url(#u-skin)') + P('M-14 -30h28l-4 -8h-20z', '#1a2a4a') + P('M-6 -24l4 2M6 -24l-4 2', 'none', 'stroke="#2a1a12" stroke-width="1.6"') + P('M-5 -14q5 -4 10 0', 'none', 'stroke="#2a1a12" stroke-width="1.4"') + P('M14 0l16 -16', 'none', 'stroke="#2a3a5a" stroke-width="7" stroke-linecap="round"'));
    return pen('#1a120a', o, '−2:00');
  };
  S['59'] = function () { return R(0, 0, 300, 220, '#2a1c14') + K.lamp(150, 4, 'W') + padlockDoor(60, 32, 180, 170, { sign: T(150, 56, 'Bagagli in consegna:', 'text-anchor="middle" font-size="11" fill="#1a1a1a" ' + HAND) + T(150, 68, 'le cifre delle stazioni che ci restano', 'text-anchor="middle" font-size="9.5" fill="#1a1a1a" ' + HAND) + T(150, 78, 'da servire, nell’ordine della corsa.', 'text-anchor="middle" font-size="9.5" fill="#1a1a1a" ' + HAND) }) + vig(); };
  S['65'] = function () {
    var o = R(0, 0, 300, 220, 'url(#t-night)') + snow(0, 0, 300, 220, 50, 65) + coal(0, 120, 300, 100, 65) + R(70, 20, 160, 100, '#141618', 'rx="6"') + R(96, 34, 108, 70, '#2a1208') + C(150, 80, 90, 'url(#u-glowO)', 'opacity=".75" ' + anim('ua-glow', 0));
    o += R(110, 46, 80, 50, 'url(#t-fire)', 'opacity=".6"') + G('', C(80, 10, 18, 'rgba(230,230,240,.3)') + C(60, -4, 24, 'rgba(230,230,240,.2)'), anim('ua-steam', .5));
    return o + vig() + tag('D', 150, 70);
  };
  S.D = function () {
    var o = cabWall() + R(0, 40, 300, 156, '#241814') + backhead(96, 26, 108, 156) + C(150, 140, 160, 'url(#u-glowO)', 'opacity=".25"');
    o += coal(0, 150, 96, 70, 7) + G('translate(30 184) rotate(-30)', R(-8, -2, 16, 5, '#7a6a3a', 'rx="2" opacity=".85"')) + hid('22', 36, 178, '#c9a24a', 6.5, -30, .45);
    o += driver(48, 106, .8) + desk(208, 120, 88, ['PFEIFE', 'REGLER', 'SANDER'], ['#5aa0e6', '#4fb07a', '#c9a46a']) + brakeLever(250, 66, .6, 'broken');
    o += G('translate(210 36) rotate(-6)', R(-14, -10, 28, 20, '#1f4f2a', 'stroke="#0a2a12"') + T(0, 2, 'DV', 'text-anchor="middle" font-size="7" fill="#ffe9a6" ' + SERIF)) + win(18, 14, 60, 38, 4) + R(0, 196, 300, 24, '#0c0806');
    return G('', o, anim('ua-shake', 0)) + vig() + tag('11', 48, 66) + tag('38', 270, 30) + tag('70', 252, 112) + tag('54', 190, 30);
  };
  S['11'] = function () { return cabWall() + C(150, 110, 130, 'url(#u-glowO)', 'opacity=".3"') + coal(180, 150, 120, 70, 11) + driver(120, 104, 1.8) + vig(); };
  S['38'] = function () { return cabWall() + C(150, 110, 120, 'url(#u-glowO)', 'opacity=".25"') + brakeLever(150, 116, 1.8, 'broken') + vig(); };
  S['22'] = function () { return cabWall() + coal(0, 130, 300, 90, 22) + C(150, 100, 100, 'url(#u-glowO)', 'opacity=".35"') + handle(150, 96, 1.6, 30) + vig(); };
  S['53'] = function () { return pen('#1a0c06', brakeLever(150, 116, 1.6, 'bent') + railKey(90, 70, .5, 40), '−3:00'); };
  S['60'] = function () { return cabWall() + C(150, 110, 130, 'url(#u-glowG)', 'opacity=".22"') + brakeLever(150, 116, 1.8, 'ok') + vig(); };
  S['54'] = function () {
    var l = T(68, 22, 'Dienstvorschrift', 'text-anchor="middle" font-size="11" font-weight="700" fill="#1a1a1a" ' + SERIF) + T(68, 36, 'Lokomotive Ae — Notbremsung', 'text-anchor="middle" font-size="7" fill="#3a2a10" ' + SERIF);
    for (var i = 0; i < 8; i++) l += L(12, 54 + i * 12, 124 - (i % 3) * 14, 54 + i * 12, '#8a7a5a', 1);
    var r = T(66, 22, 'traduzione a matita:', 'text-anchor="middle" font-size="9" fill="#5a3a18" ' + HAND) + ['1. fischio lungo', '2. chiudere il regolatore', '   (mai frenare col vapore!)', '3. sabbia sulle rotaie', '4. per ultimo: il freno'].map(function (s, i) { return T(8, 44 + i * 19, s, 'font-size="11.5" fill="#1d2a4a" ' + HAND); }).join('');
    return cabWall() + C(150, 110, 130, 'url(#u-glowO)', 'opacity=".25"') + bookOpen(150, 114, 276, 168, l, r, 1) + vig();
  };
  S['70'] = function () {
    var o = cabWall() + C(150, 120, 140, 'url(#u-glowO)', 'opacity=".25"') + P('M10 196L28 70H272L290 196Z', 'url(#t-iron)', 'stroke="#0a0b0c" stroke-width="2"') + R(36, 76, 228, 10, '#2a2e33');
    var ls = ['LICHT', 'BREMSE', 'DAMPF', 'SANDER', 'PFEIFE', 'REGLER'], cs = ['#e8c14a', '#d9453a', '#9aa7ae', '#c9a46a', '#5aa0e6', '#4fb07a'];
    ls.forEach(function (l, i) { o += lever(50 + i * 40, 110, 46, cs[i], l, i % 2); });
    return o + K.gauge(150, 42, 18, .8) + vig();
  };
  S['99'] = function () {
    var o = R(0, 0, 300, 220, 'url(#t-night)') + C(70, 40, 14, 'url(#u-moon)') + P('M0 140L50 70L90 110L130 50L170 100L210 64L250 112L300 80V220H0Z', 'url(#t-mount)');
    o += R(0, 160, 300, 60, '#05070e') + viaduct(-20, 150, 240, true) + P('M220 156l18 4l-8 14l20 6l-6 30', 'none', 'stroke="#3a3f4a" stroke-width="3"') + G('', locoSide(110, 130, .6, true), '');
    for (var i = 0; i < 6; i++) o += C(100 + i * 4, 156, 1.6, '#ffcf6a', anim('ua-blink', i * .2));
    return o + snow(0, 0, 300, 220, 40, 99) + T(150, 30, 'Fermi a due passi dal vuoto', 'text-anchor="middle" font-size="16" fill="#ffe9a6" ' + HAND) + vig();
  };
  Object.keys(S).forEach(function (k) { SC['treno:' + k] = S[k]; });

  /* =================================================================== */
  /* ===================== kit della tomba egizia ======================= */
  /* =================================================================== */
  var INK = '#2a1606', PAINT = { r: '#a8341d', b: '#2a5aa8', g: '#2f7a4a', k: '#1a1208', y: '#d9a42a' };
  // geroglifici in un riquadro 20×20 centrato (0,0)
  var GL = {
    A: function (c) { return P('M-6 9l2 -9q-2 -6 2 -9q2 -3 6 -2l3 2l-3 1q2 4 0 8q4 2 4 9z', c) + P('M-4 9h-3M2 9h3', 'none', 'stroke="' + c + '" stroke-width="1.4"') + C(3, -7, .9, '#f4e4b4'); },   // avvoltoio
    B: function (c) { return P('M-8 6q-1 -4 3 -5l8 -1q6 0 6 4q0 3 -4 3h-12z', c) + R(-7, -8, 3, 9, c, 'rx="1"'); },                                            // piede
    F: function (c) { return P('M-9 6q3 -4 6 0t6 0t5 -3', 'none', 'stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"') + C(8, 1, 2.2, c) + P('M7 -1l-1 -3M9 -1l1 -3', 'none', 'stroke="' + c + '" stroke-width="1.2"'); }, // vipera cornuta
    I: function (c) { return P('M0 9v-14', 'none', 'stroke="' + c + '" stroke-width="2"') + P('M0 -5q5 -2 3 -6q-4 1 -3 6M0 -1q-4 -1 -4 -5', c); },                   // giunco
    K: function (c) { return P('M-8 2h16q0 6 -8 6t-8 -6z', c) + P('M6 2q4 -2 2 -6', 'none', 'stroke="' + c + '" stroke-width="1.6"'); },                             // cesto con manico
    M: function (c) { return E(0, 3, 5, 7, c) + C(0, -5, 4.5, c) + C(-1.8, -5.5, 1.2, '#f4e4b4') + C(1.8, -5.5, 1.2, '#f4e4b4') + P('M-3 9l-2 2M3 9l2 2', 'none', 'stroke="' + c + '" stroke-width="1.2"'); }, // civetta
    N: function (c) { return P('M-10 0l2.5 -3l2.5 3l2.5 -3l2.5 3l2.5 -3l2.5 3l2.5 -3l2.5 3', 'none', 'stroke="' + c + '" stroke-width="2" stroke-linejoin="round"'); },     // acqua
    R: function (c) { return P('M-9 0q9 -7 18 0q-9 7 -18 0z', c); },                                                                                              // bocca
    S: function (c) { return P('M-3 9v-10q0 -6 4 -7q3 0 2 3l-2 1v13z', c); },                                                                                    // stoffa piegata
    T: function (c) { return P('M-7 5a7 7 0 0 1 14 0z', c); },                                                                                                     // pane
    Z: function (c) { return P('M-7 8l1 -9l5 -6l6 2l2 4l-4 -1l-2 3l1 7z', c) + C(2, -4, .8, '#f4e4b4'); }                                                         // falco
  };
  function glyph(k, x, y, s, c) { return G('translate(' + f(x) + ' ' + f(y) + ') scale(' + (s || 1) + ')', GL[k](c || INK)); }
  // numeri egizi: loto 1000, spirale 100, arco 10, trattino 1
  function hgS(x, y, h, c) { return R(x - h * .07, y - h, h * .14, h, c, 'rx="' + f(h * .06) + '"'); }
  function hgH(x, y, h, c) { return P('M' + f(x - h * .3) + ' ' + y + 'v' + f(-h * .55) + 'a' + f(h * .3) + ' ' + f(h * .3) + ' 0 0 1 ' + f(h * .6) + ' 0v' + f(h * .55), 'none', 'stroke="' + c + '" stroke-width="' + f(h * .13) + '" stroke-linecap="round"'); }
  function hgC(x, y, h, c) { var k = h / 24; return G('translate(' + f(x) + ' ' + f(y - h) + ') scale(' + f(k) + ')', P('M0 13a2 2 0 1 1 2 2a4 4 0 0 1 -6 -3a6 6 0 0 1 9 -5a7 7 0 0 1 2 9L8 24', 'none', 'stroke="' + c + '" stroke-width="2.6" stroke-linecap="round"')); }
  function hgL(x, y, h, c) { var k = h / 24; return G('translate(' + f(x) + ' ' + f(y - h) + ') scale(' + f(k) + ')', P('M0 23V9M0 9C-4 7 -6 3 -5 1c3 1 5 4 5 8c0 -4 2 -7 5 -8c1 2 -1 6 -5 8M-6 23h12', 'none', 'stroke="' + c + '" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"')); }
  function numeral(n, x, y, h, c) {   // da sinistra: migliaia, centinaia, decine, unità
    var o = '', s = ('0000' + n).slice(-4), cx = x, gap = h * .1, i, k;
    var wd = [h * .6, h * .6, h * .7, h * .22], fn = [hgL, hgC, hgH, hgS];
    for (i = 0; i < 4; i++) { var d = +s.charAt(i); for (k = 0; k < d; k++) { o += fn[i](cx + wd[i] / 2, y, i === 3 ? h * .9 : h, c); cx += wd[i] + gap; } if (d) cx += gap * 2; }
    return o;
  }
  // una cifra sola con i trattini, su due righe come facevano gli scribi (5 = 3 sopra e 2 sotto)
  function digit(d, x, y, h, c) {
    var top = d > 4 ? Math.ceil(d / 2) : d, bot = d - top, o = '', i, sp = h * .26, hh = d > 4 ? h * .45 : h * .8;
    for (i = 0; i < top; i++) o += hgS(x + (i - (top - 1) / 2) * sp, y - (d > 4 ? h * .52 : h * .1), hh, c);
    for (i = 0; i < bot; i++) o += hgS(x + (i - (bot - 1) / 2) * sp, y, hh, c);
    return o;
  }
  function cartouche(x, y, w, h, gs, c, bg) {
    var o = R(x, y, w, h, bg || '#e9cf96', 'rx="' + f(w / 2) + '" stroke="' + (c || INK) + '" stroke-width="2"') + R(x - 3, y + h + 2, w + 6, 4, c || INK, 'rx="1.5"');
    var step = (h - w * .6) / gs.length;
    gs.forEach(function (g, i) { o += glyph(g, x + w / 2, y + w * .3 + step * (i + .5), Math.min(w / 24, step / 23), c); });
    return o;
  }
  function stone(seed, dark) {
    var o = R(0, 0, 300, 220, dark ? 'url(#d-stoneD)' : 'url(#d-stone)'), r = rnd(seed || 3), y, x;
    for (y = 0; y < 220; y += 30) { var off = (y / 30 % 2) * 30; for (x = -off; x < 300; x += 60) o += R(x + 1, y + 1, 58, 28, 'none', 'stroke="#5a3a14" stroke-opacity=".35"'); }
    for (var i = 0; i < 40; i++) o += C(r() * 300, r() * 220, .5 + r() * 1.5, '#5a3a14', 'opacity=".25"');
    return o;
  }
  function frieze(y, h, seed) {
    var o = R(0, y, 300, h, '#e3c27e') + R(0, y, 300, 3, PAINT.b) + R(0, y + h - 3, 300, 3, PAINT.b), r = rnd(seed || 4), keys = Object.keys(GL), cols = [PAINT.k, PAINT.r, PAINT.b, PAINT.g];
    for (var x = 12; x < 300; x += 18) o += glyph(keys[Math.floor(r() * keys.length)], x, y + h / 2, h / 26, cols[Math.floor(r() * 4)]);
    return o;
  }
  function torch(x, y, s) {
    return C(x, y - 10, 90 * (s || 1), 'url(#d-torch)', anim('ua-flick', (x % 7) / 4)) + G('translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')', P('M-3 0l-4 24h14l-4 -24z', '#5a3412') + R(-8, 22, 16, 4, '#3a2208') +
      G('', P('M0 2q-9 -10 -3 -20q1 6 4 4q-1 -8 4 -12q0 8 5 12q4 8 -10 16z', '#ff8a1a') + P('M0 1q-4 -6 0 -12q2 6 4 6q0 4 -4 6z', '#fff1a0'), anim('ua-flame', (x % 5) / 5)));
  }
  function sand(y, seed) { var o = P('M0 ' + y + 'Q75 ' + (y - 8) + ' 150 ' + y + 'T300 ' + y + 'V220H0Z', 'url(#d-sand)'), r = rnd(seed || 6); for (var i = 0; i < 30; i++) o += C(r() * 300, y + 6 + r() * (214 - y), .6 + r(), '#8a5a22', 'opacity=".5"'); return o; }
  function torchVig() { return R(0, 0, 300, 220, 'url(#u-vig)') + R(0, 0, 300, 220, '#3a1a00', 'opacity=".12"'); }
  function papyrus(x, y, w, h, rot, inner) {
    return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ')', R(-w / 2 + 3, -h / 2 + 4, w, h, 'rgba(0,0,0,.4)') + R(-w / 2, -h / 2, w, h, 'url(#d-papyrus)') +
      (function () { var o = ''; for (var i = 1; i < 8; i++) o += L(-w / 2, -h / 2 + i * h / 8, w / 2, -h / 2 + i * h / 8, '#b8944a', .5, 'opacity=".5"'); return o; })() +
      E(-w / 2, 0, 6, h / 2, '#c8a45a') + E(w / 2, 0, 6, h / 2, '#c8a45a') + (inner || ''));
  }
  function head(kind, x, y, s, col) {
    var o = '', c = col || '#3a2a14';
    if (kind === 'uomo') o = P('M-9 10v-12q0 -12 10 -12q10 0 10 12v12z', '#2a5aa8') + E(1, -2, 7, 9, '#c88a52') + P('M-9 -6h20', 'none', 'stroke="#d9a42a" stroke-width="2"') + C(3, -3, 1.2, '#1a1208') + P('M8 -1l3 1', 'none', 'stroke="#1a1208"') + R(0, 6, 3, 5, '#2a1606');
    if (kind === 'babbuino') o = E(0, 0, 10, 10, '#8a6a3e') + E(5, 3, 6, 5, '#c89a6a') + C(2, -3, 1.4, '#1a1208') + C(6, -3, 1.4, '#1a1208') + P('M-10 -4q-4 6 0 12', 'none', 'stroke="#6a4a22" stroke-width="3"');
    if (kind === 'sciacallo') o = P('M-8 8v-10l-2 -12l6 8l4 -10l2 10l10 6l-2 3l-8 -1v6z', '#1a1612') + C(2, -2, 1.2, '#e8c14a') + P('M-8 -4l2 -2', 'none', 'stroke="#d9a42a"');
    if (kind === 'falco') o = P('M-8 9v-10q0 -10 9 -10q8 0 9 6l4 3l-5 1q0 4 -3 5v5z', '#5a4a3a') + C(3, -4, 1.6, '#1a1208') + P('M1 -1q2 4 -2 6', 'none', 'stroke="#f4e4b4" stroke-width="1.4"') + P('M-8 4h16', 'none', 'stroke="#2a5aa8" stroke-width="2"');
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function jar(x, y, s, kind) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', E(0, 30, 16, 4, 'rgba(0,0,0,.4)') + P('M-14 -8q-6 20 2 38h24q8 -18 2 -38z', '#e9dcc0', 'stroke="#8a7a5a" stroke-width="1.2"') +
      R(-10, 4, 20, 14, 'none', 'stroke="' + PAINT.b + '" stroke-width="1"') + glyph(['A', 'N', 'R', 'K'][['uomo', 'babbuino', 'sciacallo', 'falco'].indexOf(kind)], 0, 11, .45, PAINT.b) + head(kind, 0, -18, 1.05));
  }
  function ankh(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', E(0, -18, 10, 14, 'none', 'stroke="url(#d-gold)" stroke-width="7"') + R(-22, -4, 44, 8, 'url(#d-gold)', 'rx="2"') + R(-4, -4, 8, 46, 'url(#d-gold)', 'rx="2"') + P('M-2 -28q-5 6 -4 14', 'none', 'stroke="#fff6c8" stroke-width="1.6" opacity=".7"')); }
  function chisel(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', R(-40, -5, 36, 10, '#7a5426', 'rx="3"') + P('M-4 -4h34l10 4l-10 4h-34z', '#a8b0b8', 'stroke="#5a636c"') + P('M-40 -5h36', 'none', 'stroke="#c88a52" stroke-width="1" opacity=".6"')); }
  function basket(x, y, s) { var o = E(0, 26, 34, 6, 'rgba(0,0,0,.4)') + P('M-30 -10q0 36 30 36q30 0 30 -36z', '#b8873a', 'stroke="#6a4a1a" stroke-width="1.5"'), i; for (i = 0; i < 6; i++) o += P('M-30 ' + (-6 + i * 5) + 'q30 8 60 0', 'none', 'stroke="#6a4a1a" stroke-width=".8"'); o += E(0, -10, 32, 8, '#a8782e', 'stroke="#6a4a1a" stroke-width="1.5"') + E(0, -14, 8, 4, '#8a5a1e') + P('M-26 -6l52 -8M-24 -14l50 8', 'none', 'stroke="#5a3a12" stroke-width="2"'); return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o); }
  function scorpion(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', E(0, 0, 8, 5, '#120a04') + C(-8, 0, 4, '#120a04') + P('M8 0q10 -2 12 -10q0 -8 -6 -8l2 4', 'none', 'stroke="#120a04" stroke-width="3" stroke-linecap="round"') + P('M-10 -3l-6 -6l-3 2M-10 3l-6 6l-3 -2M-2 -4l-2 -8M2 -4l2 -8M-2 4l-2 8M2 4l2 8', 'none', 'stroke="#120a04" stroke-width="1.4"'), anim('ua-swim', s, 1.4)); }
  function scarab(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', E(0, 4, 14, 18, 'url(#d-green)', 'stroke="#0e3a1e" stroke-width="1.5"') + L(0, -12, 0, 22, '#0e3a1e', 1.4) + E(0, -16, 9, 6, '#1d6a3a', 'stroke="#0e3a1e"') + P('M-13 -2l-10 -6M13 -2l10 -6M-13 8l-10 4M13 8l10 4M-11 16l-6 8M11 16l6 8', 'none', 'stroke="#0e3a1e" stroke-width="2"') + E(-5, -2, 3, 7, '#fff', 'opacity=".25"')); }
  function feather(x, y, s, rot) { return G('translate(' + x + ' ' + y + ') rotate(' + (rot || 0) + ') scale(' + s + ')', P('M0 20v-40q8 4 6 22q-2 12 -6 18z', '#f4f0e6', 'stroke="#8a7a5a"') + P('M0 -18q-6 10 0 36', 'none', 'stroke="#8a7a5a" stroke-width=".8"')); }
  function scales(x, y, s, balanced, heart) {
    var tilt = balanced ? 0 : -10, o = R(-3, -40, 6, 80, 'url(#d-gold)') + R(-26, 36, 52, 8, 'url(#d-gold)', 'rx="3"') + C(0, -42, 5, 'url(#d-gold)');
    o += G('rotate(' + tilt + ' 0 -36)', R(-46, -38, 92, 4, 'url(#d-gold)', 'rx="2"') + G('translate(-42 -36)', L(0, 0, -10, 30, '#8a6a1a', .8) + L(0, 0, 10, 30, '#8a6a1a', .8) + E(0, 30, 14, 4, 'url(#d-gold)') + feather(0, 16, .6, 0)) +
      G('translate(42 -36)', L(0, 0, -10, 30, '#8a6a1a', .8) + L(0, 0, 10, 30, '#8a6a1a', .8) + E(0, 30, 14, 4, 'url(#d-gold)') + (heart ? scarab(0, 20, .45, 0) : '')));
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function eyeHorus(x, y, s, lit) {
    var c = lit ? '#1a1208' : '#3a2a14';
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-40 0q40 -30 80 0q-40 22 -80 0z', lit ? '#f4e4b4' : '#5a4022', 'stroke="' + c + '" stroke-width="4"') + C(0, -2, 12, lit ? '#f4e4b4' : '#4a3018', 'stroke="' + c + '" stroke-width="2"') +
      P('M-44 -18q44 -18 88 -4', 'none', 'stroke="' + c + '" stroke-width="6" stroke-linecap="round"') + P('M-4 12l-4 26q-2 8 -10 4M10 14l18 24', 'none', 'stroke="' + c + '" stroke-width="5" stroke-linecap="round"') + P('M40 0h22', 'none', 'stroke="' + c + '" stroke-width="5" stroke-linecap="round"'));
  }
  function sarcophagus(x, y, s, open) {
    var o = E(0, 40, 70, 10, 'rgba(0,0,0,.45)') + R(-62, -6, 124, 46, 'url(#d-stoneD)', 'rx="6" stroke="#2a1606" stroke-width="2"') + frieze(-6 + 30, 10, 7).replace(/<rect x="0"/g, '<rect x="-62"').replace(/width="300"/g, 'width="124"');
    if (!open) {
      o += P('M-58 -8q0 -26 18 -30h80q18 4 18 30z', 'url(#d-gold)', 'stroke="#6a4a0a" stroke-width="1.5"') + E(-40, -24, 12, 13, 'url(#d-gold)', 'stroke="#6a4a0a"') + P('M-50 -30l-6 14M-30 -30l6 14', 'none', 'stroke="' + PAINT.b + '" stroke-width="5"');
      o += E(-40, -24, 6, 7, '#c88a52') + P('M-20 -20l20 14l20 -14M-20 -8l20 -10l20 10', 'none', 'stroke="#8a5a0a" stroke-width="4" stroke-linecap="round"') + P('M8 -30h40M8 -20h40', 'none', 'stroke="' + PAINT.b + '" stroke-width="3"');
    } else {
      o += G('translate(30 -30) rotate(12) scale(.85)', P('M-58 -8q0 -26 18 -30h80q18 4 18 30z', 'url(#d-gold)', 'stroke="#6a4a0a" stroke-width="1.5" opacity=".95"')) + R(-56, -4, 112, 12, '#1a0e04');
      o += P('M-52 4q0 -14 12 -16h80q12 2 12 16z', '#d8c8a0', 'stroke="#8a7a5a"') + E(-40, -6, 10, 9, '#d8c8a0', 'stroke="#8a7a5a"') + P('M-30 -8h60M-30 -2h60', 'none', 'stroke="#a8946a" stroke-width="1"');
    }
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', o);
  }
  function falseDoor(x, y, w, h, open) {
    var o = R(x - 8, y - 8, w + 16, h + 8, 'url(#d-stoneD)', 'stroke="#2a1606"') + R(x, y, w, h, 'url(#d-stone)', 'stroke="#2a1606" stroke-width="2"');
    for (var i = 0; i < 3; i++) o += R(x + 8 + i * 8, y + 12 + i * 8, w - 16 - i * 16, h - 12 - i * 8, 'none', 'stroke="#5a3a14" stroke-width="1.5"');
    o += R(x + w * .3, y + h * .45, w * .4, h * .55, open ? '#0a0602' : '#8a6232', 'stroke="#2a1606"') + R(x + 6, y + 2, w - 12, 10, PAINT.b, 'opacity=".6"');
    if (open) o += C(x + w / 2, y + h * .7, w * .6, 'url(#u-glowW)', 'opacity=".6"');
    return o;
  }
  function pen2(inner, txt) { return R(0, 0, 300, 220, '#2a0e04') + inner + G('', K.hazard(300)) + G('translate(0 208)', K.hazard(300)) + T(150, 196, txt, 'text-anchor="middle" font-family="Bungee,sans-serif" font-size="20" fill="#ff5a4a" stroke="#000" stroke-width=".8"') + vig(); }
  function stars7(x, y, w) { var o = '', pts = [[.05, .3], [.2, .05], [.35, .45], [.5, .1], [.65, .5], [.8, .15], [.95, .4]]; pts.forEach(function (p, i) { o += K.star(x + p[0] * w, y + p[1] * 30, .55, null, anim('ua-glow', i * .3)).replace(/#f08a3c/g, '#ffd75e').replace(/#8a3d12/g, '#8a6a0a'); }); return o; }
  function boat(x, y, s) {
    return G('translate(' + x + ' ' + y + ') scale(' + s + ')', P('M-70 0q70 30 140 0l-8 -8q-62 18 -124 0z', '#b8742a', 'stroke="' + INK + '" stroke-width="2"') + P('M-70 0q-8 -18 -2 -26M70 0q8 -18 2 -26', 'none', 'stroke="' + INK + '" stroke-width="3"') +
      R(-18, -26, 36, 18, PAINT.b, 'stroke="' + INK + '"') + C(0, -40, 13, '#e8442a', 'stroke="' + INK + '" stroke-width="1.5"') + C(0, -40, 26, 'url(#d-torch)', 'opacity=".6"') + P('M-40 -8v-12M40 -8v-12', 'none', 'stroke="' + INK + '" stroke-width="2"') + P('M-60 6q-10 10 -20 8', 'none', 'stroke="' + INK + '" stroke-width="2"'));
  }

  /* ------------------------- carte della tomba ------------------------- */
  var D = {};
  D.start = function () {
    var o = R(0, 0, 300, 220, 'url(#d-sky)') + C(230, 70, 26, '#fff3c0') + C(230, 70, 70, 'url(#u-glowW)', 'opacity=".6"');
    o += P('M0 120L60 70L120 100L170 50L240 96L300 70V220H0Z', '#c88a3e') + P('M0 150L80 110L150 130L220 104L300 130V220H0Z', '#a8682a') + sand(176, 1);
    o += R(110, 112, 80, 70, '#3a1e08', 'stroke="#2a1606" stroke-width="2"') + R(118, 120, 64, 62, '#0a0602') + R(104, 104, 92, 10, 'url(#d-stoneD)');
    o += G('', C(150, 160, 30, '#8a5a2a', 'stroke="#4a2a0a" stroke-width="2"') + P('M130 150q10 -12 24 -6M138 172q14 4 24 -4', 'none', 'stroke="#4a2a0a" stroke-width="1.5"'), anim('ua-shake', 0));
    for (var i = 0; i < 6; i++) o += C(120 + i * 12, 186 + (i % 2) * 4, 3, '#c89a5a', anim('ua-fall', i * .4, 1.6));
    return o + vig() + tag('A', 150, 88);
  };
  D.A = function () {
    var o = stone(1) + frieze(0, 22, 1) + torch(30, 70) + torch(270, 70) + sand(186, 2);
    o += R(110, 40, 80, 146, 'url(#d-stoneD)', 'stroke="#2a1606" stroke-width="2"') + glyph('T', 150, 62, 1.4, INK) + [0, 1, 2, 3].map(function (k) { return E(126 + k * 16, 110, 6, 12, '#e9cf96', 'stroke="' + INK + '"'); }).join('');
    o += G('translate(54 132)', P('M-30 50v-70q0 -16 30 -16q30 0 30 16v70z', '#d9b47a', 'stroke="#5a3a14" stroke-width="1.5"') + numeral(2346, -26, -18, 5.4, INK) + numeral(1502, -26, 0, 5.4, INK) + numeral(361, -26, 18, 5.4, INK) + numeral(1129, -26, 36, 5.4, INK));
    o += G('translate(236 160)', R(-28, -8, 56, 30, '#7a5426', 'stroke="#3a2208"') + G('rotate(-8)', R(-20, -18, 40, 14, '#3a5a2a', 'rx="1"') + R(-18, -16, 36, 10, '#f4e4b4')));
    o += basket(48, 196, .55) + G('translate(258 204)', C(-14, 0, 8, '#a8742e') + C(0, 3, 9, '#8a5a22') + C(12, -1, 7, '#b8843e') + chisel(-4, -2, .26, -20));
    o += hid('3', 262, 200, '#e9cf96', 6.5, -20, .5);
    return o + torchVig() + tag('25', 150, 140) + tag('31', 54, 96) + tag('14', 236, 132) + tag('18', 48, 170);
  };
  D['14'] = function () {
    var l = T(68, 18, 'Numeri egizi', 'text-anchor="middle" font-size="12" fill="#3a2a10" ' + HAND) + numeral(23, 12, 46, 14, INK) + T(80, 44, '= 23', 'font-size="12" fill="#1d3550" ' + HAND) + numeral(120, 12, 74, 14, INK) + T(80, 72, '= 120', 'font-size="12" fill="#1d3550" ' + HAND) + numeral(1210, 12, 102, 14, INK) + T(96, 100, '= 1210 ?', 'font-size="11" fill="#1d3550" ' + HAND) +
      T(12, 126, 'si sommano, ogni segno', 'font-size="9.5" fill="#3a2a10" ' + HAND) + T(12, 138, 'ripetuto quante volte serve', 'font-size="9.5" fill="#3a2a10" ' + HAND);
    var r = T(66, 18, 'Figli di Horus', 'text-anchor="middle" font-size="12" fill="#3a2a10" ' + HAND) + C(66, 58, 26, 'none', 'stroke="#8a7a5a"') + T(66, 30, 'N', 'text-anchor="middle" font-size="9" fill="#a8261d" ' + SERIF) + T(66, 92, 'S', 'text-anchor="middle" font-size="9" fill="#a8261d" ' + SERIF) + T(96, 61, 'E', 'font-size="9" fill="#a8261d" ' + SERIF) + T(32, 61, 'O', 'font-size="9" fill="#a8261d" ' + SERIF) +
      T(66, 46, 'Hapi', 'text-anchor="middle" font-size="9" fill="#1d3550" ' + HAND) + T(66, 78, 'Imsety', 'text-anchor="middle" font-size="9" fill="#1d3550" ' + HAND) + T(104, 72, 'Duamutef', 'font-size="8" fill="#1d3550" ' + HAND) + T(4, 72, 'Qebehsenuef', 'font-size="8" fill="#1d3550" ' + HAND) +
      glyph('Z', 30, 124, 1, INK) + P('M44 124h40', 'none', 'stroke="#a8261d" stroke-width="1.5"') + P('M84 124l-5 -4v8z', '#a8261d') + T(66, 142, 'si va incontro ai volti', 'text-anchor="middle" font-size="9.5" fill="#3a2a10" ' + HAND);
    return stone(14) + torch(20, 40, .6) + bookOpen(150, 116, 276, 168, l, r, -1) + torchVig();
  };
  D['31'] = function () {
    var o = stone(31, true) + torch(22, 50, .6) + torch(278, 50, .6) + P('M44 214v-170q0 -36 106 -36q106 0 106 36v170z', '#d9b47a', 'stroke="#5a3a14" stroke-width="2"') + glyph('Z', 150, 26, .9, PAINT.b);
    var icons = [function (x, y) { return glyph('T', x, y, 1.2, PAINT.r); }, function (x, y) { return P('M' + (x - 6) + ' ' + (y + 8) + 'q-4 -10 2 -16h8q6 6 2 16z', PAINT.r) + R(x - 4, y - 12, 8, 4, PAINT.r); }, function (x, y) { return P('M' + (x - 9) + ' ' + (y - 6) + 'q9 -6 18 0l-3 12q-6 4 -12 0z', PAINT.k) + P('M' + (x - 9) + ' ' + (y - 6) + 'q-6 -6 -4 -10M' + (x + 9) + ' ' + (y - 6) + 'q6 -6 4 -10', 'none', 'stroke="' + PAINT.k + '" stroke-width="2"'); }, function (x, y) { return P('M' + (x - 8) + ' ' + (y + 6) + 'q2 -10 12 -8l2 -8q6 0 4 4l-4 6q4 6 -2 8z', PAINT.b); }];
    [2346, 1502, 361, 1129].forEach(function (n, i) { var y = 64 + i * 38; o += L(54, y - 22, 246, y - 22, '#5a3a14', 1) + icons[i](66, y - 6) + numeral(n, 84, y + 4, 17, INK); });
    return o + torchVig();
  };
  D['25'] = function () {
    var o = stone(25, true) + torch(36, 60) + torch(264, 60) + R(70, 20, 160, 190, 'url(#d-stone)', 'stroke="#2a1606" stroke-width="3"') + R(80, 30, 140, 170, 'none', 'stroke="#5a3a14" stroke-width="1.5"');
    o += C(150, 66, 26, '#c89a5a', 'stroke="#5a3a14" stroke-width="1.5"') + glyph('T', 150, 66, 1.8, INK);
    for (var k = 0; k < 4; k++) o += G('', E(102 + k * 32, 140, 13, 26, '#e9cf96', 'stroke="' + INK + '" stroke-width="2"') + T(102 + k * 32, 146, '?', 'text-anchor="middle" font-size="16" fill="' + INK + '" ' + SERIF) + R(98 + k * 32, 106, 8, 6, '#5a3a14'));
    return o + torchVig();
  };
  D['18'] = function () { return stone(18) + sand(170, 18) + torch(240, 60, .7) + basket(150, 130, 1.8) + torchVig(); };
  D['21'] = function () { return pen2(basket(110, 120, 1.1) + scorpion(170, 120, 1.6, -20) + scorpion(210, 90, 1.3, 30) + scorpion(200, 150, 1.4, 160), '−3:00'); };
  D['3'] = function () { return stone(3) + sand(150, 3) + C(150, 110, 110, 'url(#d-torch)', 'opacity=".5"') + chisel(150, 116, 1.8, -16) + torchVig(); };
  D['50'] = function () { return stone(50, true) + torch(40, 60) + torch(260, 60) + R(90, 30, 120, 180, '#0a0602', 'stroke="#2a1606" stroke-width="3"') + C(150, 140, 70, 'url(#d-torch)', 'opacity=".25"') + R(90, 196, 120, 14, 'url(#d-stone)') + sand(210, 50) + torchVig() + tag('B', 150, 110); };
  D.B = function () {
    var o = stone(2) + frieze(0, 20, 2) + torch(150, 50, .8) + sand(196, 4);
    o += G('translate(10 30)', R(0, 0, 96, 100, 'url(#d-stoneD)') + [0, 1, 2].map(function (k) { return R(8 + k * 30, 10, 20, 80, '#e9cf96', 'rx="10" stroke="' + INK + '"'); }).join(''));
    o += G('translate(122 74)', R(-4, -4, 64, 56, '#5a3a14') + R(0, 0, 56, 48, 'url(#d-papyrus)') + R(0, 0, 56, 48, 'url(#u-glass)') + glyph('A', 12, 14, .5, INK) + glyph('N', 30, 14, .5, INK) + glyph('R', 46, 14, .5, INK) + glyph('K', 12, 32, .5, INK) + glyph('F', 30, 32, .5, INK) + glyph('M', 46, 32, .5, INK));
    o += G('translate(210 40)', R(0, 0, 80, 110, '#c9a466') + K.crack(40, 50, .8).replace(/#fff/g, '#5a3a14'));
    o += R(30, 158, 240, 8, '#7a5426') + jar(70, 132, .7, 'uomo') + jar(124, 132, .7, 'babbuino') + jar(178, 132, .7, 'sciacallo') + jar(232, 132, .7, 'falco');
    return o + torchVig() + tag('66', 58, 34) + tag('33', 150, 64) + tag('44', 250, 52) + tag('70', 150, 184);
  };
  var CART = [['63', ['N', 'F', 'R', 'M', 'A']], ['67', ['N', 'R', 'F', 'K', 'A']], ['72', ['N', 'F', 'T', 'K', 'A']], ['76', ['M', 'F', 'R', 'K', 'A']], ['84', ['N', 'F', 'R', 'K', 'A']], ['88', ['N', 'F', 'R', 'K', 'I']]];
  D['66'] = function () {
    var o = stone(66) + torch(150, 14, .5);
    CART.forEach(function (c, i) { var x = 14 + i * 47; o += cartouche(x, 24, 34, 160, c[1], INK) + R(x + 3, 194, 28, 16, 'url(#d-stoneD)', 'rx="2"') + T(x + 17, 206, c[0], 'text-anchor="middle" font-size="12" font-weight="700" fill="#f4e4b4" ' + SERIF); });
    return o + torchVig();
  };
  D['33'] = function () {
    var signs = [['A', 'A'], ['B', 'B'], ['F', 'F'], ['I', 'I'], ['K', 'K'], ['M', 'M'], ['N', 'N'], ['R', 'R'], ['S', 'S'], ['T', 'T']], inner = '';
    signs.forEach(function (s, i) { var x = -100 + (i % 5) * 50, y = -40 + Math.floor(i / 5) * 56; inner += R(x - 20, y - 20, 40, 48, 'none', 'stroke="#8a6a2a" stroke-width=".8"') + glyph(s[0], x, y, 1.15, INK) + T(x, y + 24, s[1], 'text-anchor="middle" font-size="13" font-weight="700" fill="' + PAINT.r + '" ' + SERIF); });
    inner += T(0, 80, 'niente vocali · solo la A finale', 'text-anchor="middle" font-size="11" fill="#5a3a14" ' + HAND);
    return stone(33, true) + torch(20, 30, .5) + papyrus(150, 112, 270, 190, 0, inner) + torchVig();
  };
  D['44'] = function () { return stone(44) + torch(40, 50, .7) + R(70, 20, 160, 180, '#c9a466') + K.crack(150, 100, 1.6).replace(/#fff/g, '#5a3a14') + C(150, 100, 30, '#3a2208', 'opacity=".15"') + sand(196, 44) + torchVig(); };
  D['47'] = function () { return stone(47) + torch(40, 50, .7) + R(70, 20, 160, 180, '#c9a466') + R(100, 60, 100, 90, '#2a1606') + E(150, 140, 46, 8, '#1a0e04') + G('translate(150 124) rotate(-8)', R(-36, -9, 72, 18, 'url(#d-papyrus)', 'rx="9"') + R(-3, -10, 6, 20, PAINT.r)) + P('M70 20l30 40M230 30l-30 30M80 190l20 -40', 'none', 'stroke="#5a3a14" stroke-width="2"') + sand(196, 47) + torchVig() + tag('12', 150, 92); };
  D['12'] = function () {
    var inner = '', ks = [['uomo', 'Imsety'], ['babbuino', 'Hapi'], ['sciacallo', 'Duamutef'], ['falco', 'Qebehsenuef']];
    ks.forEach(function (k, i) { var x = -96 + i * 64; inner += G('translate(' + x + ' 6)', R(-8, -6, 16, 46, PAINT.b, 'rx="3"') + R(-10, 36, 20, 6, PAINT.k) + head(k[0], 0, -18, 1.6)) + T(x, 66, k[1], 'text-anchor="middle" font-size="12" fill="#3a2a10" ' + HAND); });
    return stone(12, true) + papyrus(150, 112, 280, 170, 0, T(0, -60, 'I quattro figli di Horus', 'text-anchor="middle" font-size="13" fill="#5a3a14" ' + HAND) + inner) + torchVig();
  };
  D['70'] = function () {
    var o = stone(70) + frieze(0, 18, 70) + torch(20, 60, .7) + torch(280, 60, .7);
    for (var k = 0; k < 4; k++) o += R(42 + k * 58, 30, 42, 50, '#2a1606', 'rx="21"');
    o += T(150, 98, 'N  ·  E  ·  S  ·  O ?', 'text-anchor="middle" font-size="11" fill="#5a3a14" opacity=".7" ' + SERIF) + R(20, 172, 260, 10, '#7a5426') + jar(63, 142, 1, 'uomo') + jar(121, 142, 1, 'falco') + jar(179, 142, 1, 'babbuino') + jar(237, 142, 1, 'sciacallo');
    return o + torchVig();
  };
  D['82'] = function () {
    var o = stone(82, true) + torch(40, 50) + torch(260, 50) + R(70, 120, 160, 100, '#0a0602');
    for (var i = 0; i < 6; i++) o += R(80 + i * 6, 126 + i * 15, 140 - i * 12, 8, '#8a6232', 'opacity="' + f(1 - i * .14) + '"');
    o += G('translate(260 140) rotate(10)', R(-40, -10, 80, 20, 'url(#d-stone)', 'stroke="#2a1606"'));
    return o + torchVig() + tag('C', 150, 150);
  };
  D['84'] = function () { return stone(84) + torch(150, 14, .5) + cartouche(120, 24, 60, 160, ['N', 'F', 'R', 'K', 'A'], INK) + C(150, 104, 60, 'url(#u-glowW)', 'opacity=".35" ' + anim('ua-glow', 0)) + R(110, 196, 80, 10, '#0a0602') + ankh(150, 186, .5, 90) + torchVig() + tag('7', 196, 186); };
  D['7'] = function () { return stone(7, true) + C(150, 110, 110, 'url(#d-torch)', 'opacity=".55"') + ankh(150, 116, 2.1, -10) + torchVig(); };
  D.C = function () {
    var o = R(0, 0, 300, 70, '#0c0804') + stone(5).replace('url(#d-stone)', 'url(#d-stone)') + R(0, 0, 300, 56, '#0a0602', 'opacity=".92"');
    for (var r = 0; r < 3; r++) o += C(150, -40, 70 + r * 18, 'none', 'stroke="#3a2a14" stroke-width="2" opacity=".6"');
    o += P('M236 0h24l-6 120h-12z', '#1a1006') + P('M244 0l14 0l40 196l-44 0z', 'url(#d-ray)', 'opacity=".35" ' + anim('ua-ray', 0));
    o += G('translate(16 70)', R(0, 0, 190, 90, '#d9b47a', 'stroke="#5a3a14"') + stars7(14, 8, 160) + boat(96, 66, .9));
    o += sand(176, 7) + E(276, 200, 22, 6, '#fff6c8', 'opacity=".4"') + papyrus(150, 196, 50, 16, -6, '') + G('translate(30 200) rotate(-14)', E(0, 0, 10, 4, '#c8963a', 'opacity=".9"')) + hid('9', 34, 198, '#f4e4b4', 6.5, -14, .5);
    return o + torchVig() + tag('16', 110, 102) + tag('26', 248, 28) + tag('29', 150, 176) + tag('90', 150, 30);
  };
  D['16'] = function () { return stone(16) + R(10, 20, 280, 180, '#d9b47a', 'stroke="#5a3a14" stroke-width="2"') + R(14, 24, 272, 70, '#14204a') + stars7(28, 34, 244) + boat(150, 150, 1.6) + R(10, 196, 280, 6, PAINT.b) + torchVig(); };
  D['26'] = function () { return stone(26, true) + P('M120 0h60l-10 160h-40z', '#1a1006') + P('M136 0h28l20 196h-68z', 'url(#d-ray)', 'opacity=".55" ' + anim('ua-ray', 0)) + sand(184, 26) + E(150, 196, 40, 8, '#fff6c8', 'opacity=".6"') + torchVig(); };
  D['9'] = function () { return stone(9) + sand(150, 9) + C(150, 104, 110, 'url(#u-glowW)', 'opacity=".3"') + G('translate(150 100) rotate(-12)', E(0, 0, 44, 52, '#b8742a', 'stroke="#5a3a0a" stroke-width="3"') + E(0, 0, 38, 46, '#e8c07a') + P('M-24 -20q14 -18 34 -16', 'none', 'stroke="#fff6c8" stroke-width="4" opacity=".7"') + R(-6, 50, 12, 40, '#5a3412', 'rx="3"') + head('uomo', 0, 92, .9)) + torchVig(); };
  D['35'] = function () { return stone(35, true) + P('M0 0h50l60 110h-30z', 'url(#d-ray)', 'opacity=".6"') + P('M100 110l200 -40v40z', 'url(#d-ray)', 'opacity=".75" ' + anim('ua-ray', 0)) + G('translate(100 112) rotate(20)', E(0, 0, 22, 26, '#b8742a', 'stroke="#5a3a0a" stroke-width="2"') + E(0, 0, 18, 22, '#fff6c8')) + C(100, 112, 50, 'url(#u-glowW)', 'opacity=".6"') + sand(186, 35) + torchVig(); };
  D['29'] = function () {
    var inner = T(0, -64, 'Il ritorno di Sopdet', 'text-anchor="middle" font-size="13" fill="#5a3a14" ' + HAND), cs = [['Sah', -80, '#e6b93a'], ['Sopdet', 0, '#7fc8ff'], ['Meskhetyu', 80, '#c9a0ff']];
    cs.forEach(function (c) { inner += K.star(c[1], -24, .9, null).replace(/#f08a3c/g, c[2]) + T(c[1], 2, c[0], 'text-anchor="middle" font-size="11" font-weight="700" fill="#3a2a10" ' + SERIF); });
    inner += P('M-62 -24h44M18 -24h44', 'none', 'stroke="#8a6a2a" stroke-dasharray="3 3"') + C(0, 46, 30, 'none', 'stroke="#8a6a2a" stroke-width="1.5"');
    for (var i = 0; i < 10; i++) { var a = -Math.PI / 2 + i * Math.PI / 5; inner += C(f(Math.cos(a) * 30), f(46 + Math.sin(a) * 30), 2.4, '#5a3a14') + T(f(Math.cos(a) * 40), f(49 + Math.sin(a) * 40), i, 'text-anchor="middle" font-size="7" fill="#5a3a14" ' + MONO); }
    return stone(29, true) + papyrus(150, 112, 270, 190, 0, inner) + torchVig();
  };
  D['90'] = function () {
    var o = R(0, 0, 300, 220, '#0a0e24'), r = rnd(90);
    for (var i = 0; i < 50; i++) o += K.star(r() * 300, r() * 220, .22 + r() * .2, null, anim('ua-blink', r() * 3)).replace(/#f08a3c/g, '#ffd75e').replace(/#8a3d12/g, '#8a6a0a');
    [[90, '#e6b93a'], [64, '#7fc8ff'], [38, '#c9a0ff']].forEach(function (rr) { o += C(150, 110, rr[0], 'none', 'stroke="' + rr[1] + '" stroke-width="12" opacity=".35"') + C(150, 110, rr[0], 'none', 'stroke="' + rr[1] + '" stroke-width="1.4"');
      for (var k = 0; k < 10; k++) { var a = -Math.PI / 2 + k * Math.PI / 5; o += T(f(150 + Math.cos(a) * rr[0]), f(113 + Math.sin(a) * rr[0]), k, 'text-anchor="middle" font-size="8" font-weight="700" fill="' + rr[1] + '" ' + MONO); } });
    return o + C(150, 110, 14, 'url(#d-gold)') + vig();
  };
  D['93'] = function () { return R(0, 0, 300, 220, '#0a0e24') + C(150, 40, 60, 'url(#u-glowW)', 'opacity=".6"') + P('M126 0h48l26 220h-100z', 'url(#d-ray)', 'opacity=".7" ' + anim('ua-glow', 0)) + R(20, 60, 60, 160, '#3a2208') + R(220, 60, 60, 160, '#3a2208') + R(80, 80, 140, 140, '#0a0602') + sand(206, 93) + vig() + tag('D', 150, 140); };
  D.D = function () {
    var o = stone(4, true) + frieze(0, 20, 9) + torch(24, 66, .8) + torch(276, 66, .8);
    o += falseDoor(116, 28, 68, 92, false) + G('translate(244 74)', R(-40, -36, 80, 72, '#2a1806') + eyeHorus(0, 0, .6, false));
    o += sand(176, 8) + sarcophagus(150, 150, .78, false) + scales(46, 140, .62, false, false);
    return o + torchVig() + tag('80', 150, 32) + tag('38', 244, 46) + tag('52', 150, 112) + tag('61', 46, 96);
  };
  D['52'] = function () { return stone(52, true) + torch(30, 50, .7) + torch(270, 50, .7) + sand(190, 52) + sarcophagus(150, 128, 1.75, false) + torchVig(); };
  D['55'] = function () { var o = sarcophagus(150, 120, 1.2, false) + chisel(206, 90, .6, 30); for (var i = 0; i < 14; i++) o += C(20 + i * 20, 30 + (i * 37) % 100, 3 + i % 3, '#c89a5a', anim('ua-fall', i * .25, 1.8)); return pen2(o + C(150, 110, 120, 'url(#u-glowR)', 'opacity=".3"'), '−4:00'); };
  D['59'] = function () { return stone(59, true) + torch(30, 50, .7) + sand(190, 59) + sarcophagus(150, 132, 1.7, true) + scarab(150, 120, .55, 0) + C(150, 120, 30, 'url(#u-glowG)', 'opacity=".6" ' + anim('ua-glow', 0)) + torchVig() + tag('13', 186, 108); };
  D['13'] = function () { return stone(13, true) + C(150, 110, 110, 'url(#u-glowG)', 'opacity=".3"') + scarab(150, 114, 2.4, -8) + torchVig(); };
  D['61'] = function () { return stone(61, true) + torch(40, 50, .7) + torch(260, 50, .7) + sand(196, 61) + scales(150, 124, 1.6, false, false) + torchVig(); };
  D['74'] = function () { return stone(74, true) + C(150, 100, 140, 'url(#u-glowW)', 'opacity=".45" ' + anim('ua-glow', 0)) + sand(196, 74) + scales(150, 124, 1.6, true, true) + torchVig(); };
  D['38'] = function () { return R(0, 0, 300, 220, '#140c04') + R(30, 20, 240, 180, '#1e1408') + eyeHorus(150, 104, 1.6, false) + C(150, 102, 120, 'url(#u-vig)') + torchVig(); };
  D['41'] = function () { var o = eyeHorus(150, 100, 1.1, false) + chisel(200, 120, .6, -30); for (var i = 0; i < 10; i++) o += R(30 + i * 24, 20 + (i * 29) % 80, 14, 10, '#c9a466', anim('ua-fall', i * .3, 1.6)); return pen2(o, '−3:00'); };
  D['78'] = function () {
    var o = R(0, 0, 300, 220, '#3a2408') + P('M0 0h70l80 60h-40z', 'url(#d-ray)', 'opacity=".55"') + C(150, 110, 150, 'url(#u-glowW)', 'opacity=".5"') + eyeHorus(150, 54, .95, true);
    [2, 8, 1, 5].forEach(function (d, i) { var x = 58 + i * 50; o += R(x - 20, 104, 40, 70, '#f4e4b4', 'rx="20" stroke="' + INK + '" stroke-width="2"') + R(x - 23, 176, 46, 4, INK) + digit(d, x, 156, 34, INK); });
    o += G('translate(268 140) scale(1.7)', GL.Z(PAINT.b));
    return o + vig();
  };
  D['80'] = function () { return stone(80, true) + torch(36, 60) + torch(264, 60) + falseDoor(80, 20, 140, 190, false) + [0, 1, 2, 3].map(function (k) { return E(114 + k * 24, 108, 9, 18, '#e9cf96', 'stroke="' + INK + '" stroke-width="1.5"'); }).join('') + torchVig(); };
  D['99'] = function () {
    var o = R(0, 0, 300, 220, 'url(#d-sky)') + C(70, 80, 30, '#fff3c0') + C(70, 80, 90, 'url(#u-glowW)', 'opacity=".6"') + P('M0 130L60 90L130 120L200 76L300 110V220H0Z', '#c88a3e') + sand(170, 99);
    o += R(196, 120, 60, 60, '#3a1e08') + R(204, 128, 44, 52, '#0a0602') + G('translate(150 176)', E(0, 18, 50, 5, 'rgba(0,0,0,.3)') + [-24, 0, 24].map(function (x, i) { return G('translate(' + x + ' 0)', R(-5, -24, 10, 24, i === 1 ? '#7a2a1a' : '#5a4a3a', 'rx="4"') + C(0, -30, 6, 'url(#u-skin)') + P('M-8 -34h16l-2 -4h-12z', '#e8dcc0')); }).join(''));
    return o + T(150, 30, 'Il sole del deserto!', 'text-anchor="middle" font-size="17" fill="#5a2a0a" ' + HAND) + vig();
  };
  Object.keys(D).forEach(function (k) { SC['tomba:' + k] = D[k]; });
})();
