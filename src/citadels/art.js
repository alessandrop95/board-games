/* ===== Citadels: carte disegnate da zero (personaggi, quartieri, monete, corona) e icone =====
   Personaggi: ritratto stilizzato su fondo del loro colore, rango in un medaglione. Quartieri: colore del tipo
   (nobile oro, religioso blu, commerciale verde, militare rosso, unico viola), edificio disegnato, costo in monete. */
var CTArt = (function () {
  var E = CTEngine;
  var TC = { n: ['#f4c542', '#8a6200', '#fff4c8'], r: ['#4f8ff0', '#173f86', '#e3eeff'], c: ['#43b36a', '#155a2e', '#e2f7e8'], m: ['#e0533f', '#6e1610', '#ffe6e1'], u: ['#a368e8', '#40166e', '#f1e6ff'] };
  var CC = { 1: ['#3a3a48', '#14141c'], 2: ['#5a6b3a', '#1f2a10'], 3: ['#4a3fb0', '#1a1350'], 4: ['#e0a92a', '#6a4500'], 5: ['#3a78d8', '#0f2f6e'], 6: ['#2f9e5c', '#0d4426'], 7: ['#c9772e', '#5a2c08'], 8: ['#c23a2c', '#4e0e08'] };
  function lg(id, a, b, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".55" stop-color="' + c + '"/>' : '') + '<stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
  function defs() {
    var o = '';
    Object.keys(CC).forEach(function (r) { o += lg('ct-c' + r, CC[r][0], CC[r][1]); });
    Object.keys(TC).forEach(function (t) { o += lg('ct-t' + t, TC[t][0], TC[t][1]); });
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' + o +
      lg('ct-parch', '#fbf1d8', '#e7d1a2') + lg('ct-gold', '#fff1a8', '#b77d0a', '#f2c23c') + lg('ct-sky', '#f6c98a', '#5a3d7a', '#c27a7a') + lg('ct-stone', '#d8cbb4', '#8f7e66') + lg('ct-back', '#3a2a58', '#140c24', '#24183c') +
      '<radialGradient id="ct-glow" cx=".5" cy=".4" r=".6"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="ct-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".08"/></linearGradient>' +
      '<clipPath id="ct-clip"><rect x="6" y="6" width="88" height="128" rx="7"/></clipPath></defs></svg>';
  }
  var F = 'font-family="Cinzel,Georgia,serif" font-weight="800"';
  function T(x, y, s, sz, fill, extra) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" ' + F + ' font-size="' + sz + '" fill="' + fill + '"' + (extra || '') + '>' + s + '</text>'; }
  function coin(x, y, r, v) { return '<g><circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="url(#ct-gold)" stroke="#7a4f00" stroke-width="' + (r * .16).toFixed(1) + '"/><circle cx="' + x + '" cy="' + y + '" r="' + (r * .7).toFixed(1) + '" fill="none" stroke="#fff3c0" stroke-width=".8" opacity=".7"/>' + (v != null ? T(x, y + r * .42, v, r * 1.2, '#5a3600') : '') + '</g>'; }
  function crownPath(x, y, s, fill) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-14 6L-16 -8L-7 -1L0 -12L7 -1L16 -8L14 6Z" fill="' + (fill || 'url(#ct-gold)') + '" stroke="#6a4500" stroke-width="1.4" stroke-linejoin="round"/><rect x="-14" y="5" width="28" height="5" rx="1" fill="' + (fill || 'url(#ct-gold)') + '" stroke="#6a4500" stroke-width="1.2"/><circle cx="0" cy="-12" r="2" fill="#e0453a"/><circle cx="-16" cy="-8" r="1.6" fill="#3a78d8"/><circle cx="16" cy="-8" r="1.6" fill="#3a78d8"/></g>'; }

  /* ---------- ritratti dei personaggi ---------- */
  var skin = '#f1c9a0', skin2 = '#d9a77a';
  function body(col) { return '<path d="M18 134 Q22 96 50 92 Q78 96 82 134Z" fill="' + col + '"/>'; }
  function face(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><ellipse cx="0" cy="0" rx="13" ry="15" fill="' + skin + '"/><ellipse cx="-5" cy="-1" rx="1.8" ry="2.2" fill="#2a1a10"/><ellipse cx="5" cy="-1" rx="1.8" ry="2.2" fill="#2a1a10"/><path d="M-4 7q4 3 8 0" fill="none" stroke="#8a4a2a" stroke-width="1.4" stroke-linecap="round"/></g>'; }
  var PORT = {
    1: function () { return body('#1e1e28') + '<path d="M28 98 Q50 30 72 98 Q62 86 50 86 Q38 86 28 98Z" fill="#2a2a36"/>' + '<ellipse cx="50" cy="70" rx="12" ry="14" fill="#151519"/><path d="M42 68h6M52 68h6" stroke="#f0d060" stroke-width="2.4" stroke-linecap="round"/>' +
      '<g transform="translate(74 106) rotate(-35)"><path d="M0 -26L4 -4H-4Z" fill="#e8eef4" stroke="#7a8a9a" stroke-width=".8"/><rect x="-7" y="-4" width="14" height="3" rx="1" fill="#8a6a2a"/><rect x="-2" y="-1" width="4" height="10" rx="1" fill="#5a3a1a"/></g>'; },
    2: function () { return body('#3e4a26') + face(50, 68) + '<path d="M36 64h28v6H36z" fill="#1a1a1a"/><circle cx="45" cy="67" r="2" fill="#f4f0e0"/><circle cx="55" cy="67" r="2" fill="#f4f0e0"/>' + '<path d="M34 58 Q50 40 66 58Z" fill="#4a5a2e"/>' +
      '<g transform="translate(74 112)"><path d="M-10 -6Q0 -14 10 -6L12 10Q0 16 -12 10Z" fill="#a8823e" stroke="#5a3a10" stroke-width="1.2"/><path d="M-6 -8l6 -5l6 5" fill="none" stroke="#5a3a10" stroke-width="1.5"/>' + coin(-2, 2, 4, '') + '</g>'; },
    3: function () { return body('#2c2478') + face(50, 72) + '<path d="M50 70l-10 22h20Z" fill="#e8e8f4"/>' + '<path d="M50 20L66 60H34Z" fill="#3a2ea0" stroke="#d8c8ff" stroke-width="1"/><path d="M30 60h40" stroke="#d8c8ff" stroke-width="3" stroke-linecap="round"/>' +
      '<g fill="#ffe680"><path d="M48 36l1.6 3.4 3.6.4-2.7 2.4.8 3.6-3.3-1.9-3.3 1.9.8-3.6-2.7-2.4 3.6-.4z"/><circle cx="58" cy="50" r="1.5"/><circle cx="42" cy="52" r="1.2"/></g>' +
      '<g transform="translate(78 104)"><rect x="-2" y="-26" width="4" height="40" rx="2" fill="#7a4a1a"/><circle cx="0" cy="-28" r="5" fill="#9adcff" stroke="#fff" stroke-width="1"/><circle cx="0" cy="-28" r="9" fill="url(#ct-glow)"/></g>'; },
    4: function () { return body('#a01818') + '<path d="M30 96 Q50 106 70 96" fill="none" stroke="#fff" stroke-width="6"/>' + face(50, 70) + '<path d="M38 76 Q50 92 62 76 Q56 86 50 86 Q44 86 38 76Z" fill="#c9b8a0"/>' + crownPath(50, 50, 1.1) +
      '<g transform="translate(78 108)"><rect x="-2" y="-24" width="4" height="34" rx="2" fill="url(#ct-gold)"/><circle cx="0" cy="-26" r="4" fill="#e0453a" stroke="#ffd" stroke-width="1"/></g>'; },
    5: function () { return body('#e8e2d0') + '<path d="M44 94v40M56 94v40" stroke="#c9a23a" stroke-width="3"/>' + face(50, 72) + '<path d="M36 60 Q50 20 64 60Z" fill="#f4f0e4" stroke="#c9a23a" stroke-width="1.6"/><path d="M50 30v26M44 42h12" stroke="#c9a23a" stroke-width="2.2"/>' +
      '<g transform="translate(22 106)"><rect x="-2" y="-28" width="4" height="40" rx="2" fill="#c9a23a"/><path d="M0 -28q-9 0 -9 -9q0 -8 8 -8" fill="none" stroke="#c9a23a" stroke-width="3.4" stroke-linecap="round"/></g>'; },
    6: function () { return body('#1f7a46') + face(50, 70) + '<path d="M34 60 Q50 44 66 60 Q66 52 50 50 Q34 52 34 60Z" fill="#5a2e10"/><path d="M33 58h34" stroke="#c9a23a" stroke-width="3"/>' +
      '<g transform="translate(50 116)"><path d="M-22 -4h44" stroke="#5a3a10" stroke-width="2"/><path d="M0 -12v8" stroke="#5a3a10" stroke-width="2"/><path d="M-22 -4l-6 10h12zM22 -4l-6 10h12z" fill="#c9a23a" stroke="#5a3a10" stroke-width="1"/></g>' + coin(24, 104, 5, '') + coin(80, 100, 5, ''); },
    7: function () { return body('#8a4a18') + face(50, 72) + '<path d="M36 62 Q50 50 64 62Z" fill="#3a2a1a"/>' +
      '<g transform="translate(26 110) rotate(-8)"><rect x="-14" y="-10" width="30" height="22" fill="#d6e8ff" stroke="#3a6ac8" stroke-width="1"/><path d="M-10 6V-4H0V6M4 6V-6H12V6" fill="none" stroke="#3a6ac8" stroke-width="1.2"/></g>' +
      '<g transform="translate(76 108)" stroke="#d8d8e0" stroke-width="2.4" stroke-linecap="round"><path d="M0 -20L-8 10M0 -20L8 10"/><circle cx="0" cy="-20" r="3" fill="#8a8a96" stroke="none"/></g>'; },
    8: function () { return body('#7a1a12') + '<path d="M28 100h44v10H28z" fill="#9aa3ad"/>' + face(50, 74) + '<path d="M34 72 Q34 46 50 44 Q66 46 66 72H60V62H40V72Z" fill="#9aa3ad" stroke="#5a636d" stroke-width="1.4"/><path d="M50 44v-10" stroke="#e0453a" stroke-width="5" stroke-linecap="round"/>' +
      '<g transform="translate(78 110) rotate(18)"><path d="M0 -34L4 -6H-4Z" fill="#e8eef4" stroke="#7a8a9a" stroke-width=".8"/><rect x="-9" y="-6" width="18" height="3" rx="1" fill="#c9a23a"/><rect x="-2" y="-3" width="4" height="10" fill="#5a3a1a"/></g>'; }
  };
  var ccache = {};
  function charFace(r, mini) {
    var k = r + (mini ? 'm' : ''); if (ccache[k]) return ccache[k];
    var o = '<svg class="ctc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="10" fill="url(#ct-parch)"/>' +
      '<rect x="6" y="6" width="88" height="128" rx="7" fill="url(#ct-c' + r + ')"/><g clip-path="url(#ct-clip)"><circle cx="50" cy="66" r="44" fill="url(#ct-glow)" opacity=".5"/>' + PORT[r]() + '</g>' +
      '<rect x="6" y="6" width="88" height="128" rx="7" fill="none" stroke="#f4dc9a" stroke-width="1.6"/>' +
      '<circle cx="18" cy="19" r="11" fill="url(#ct-parch)" stroke="#6a4500" stroke-width="1.6"/>' + T(18, 25, r, 16, '#4a2a00');
    if (!mini) o += '<path d="M8 112h84v20H8z" fill="rgba(20,10,0,.55)"/>' + T(50, 127, E.CH[r].n.toUpperCase(), E.CH[r].n.length > 9 ? 10.5 : 12.5, '#fff3c8');
    o += '<rect x="1" y="1" width="98" height="138" rx="10" fill="url(#ct-shine)"/><rect x="1" y="1" width="98" height="138" rx="10" fill="none" stroke="#4a3010" stroke-width="2"/></svg>';
    return (ccache[k] = o);
  }

  /* ---------- quartieri ---------- */
  // edificio: la forma dipende dal tipo, l'altezza dal costo
  function building(t, c, n) {
    var h = 26 + c * 7, base = 108, x0 = 50, o = '', col = TC[t][0], dk = TC[t][1], wall = '#efe3c8', roof = dk;
    var w = t === 'n' ? 46 : t === 'r' ? 34 : t === 'c' ? 44 : t === 'm' ? 40 : 38;
    if (t === 'r') {
      o += '<rect x="' + (x0 - w / 2) + '" y="' + (base - h * .6) + '" width="' + w + '" height="' + h * .6 + '" fill="' + wall + '" stroke="#6a5a40"/><path d="M' + (x0 - w / 2 - 4) + ' ' + (base - h * .6) + 'L' + x0 + ' ' + (base - h * .6 - 16) + 'L' + (x0 + w / 2 + 4) + ' ' + (base - h * .6) + 'Z" fill="' + roof + '"/>' +
        (c >= 3 ? '<rect x="' + (x0 - 6) + '" y="' + (base - h) + '" width="12" height="' + h * .4 + '" fill="' + wall + '" stroke="#6a5a40"/><path d="M' + (x0 - 8) + ' ' + (base - h) + 'L' + x0 + ' ' + (base - h - 14) + 'L' + (x0 + 8) + ' ' + (base - h) + 'Z" fill="' + roof + '"/>' : '') +
        '<path d="M' + x0 + ' ' + (base - (c >= 3 ? h + 26 : h * .6 + 28)) + 'v10M' + (x0 - 4) + ' ' + (base - (c >= 3 ? h + 22 : h * .6 + 24)) + 'h8" stroke="#c9a23a" stroke-width="2"/>' +
        '<path d="M' + (x0 - 6) + ' ' + base + 'v-14a6 6 0 0 1 12 0v14Z" fill="#5a3a1a"/><circle cx="' + x0 + '" cy="' + (base - h * .45) + '" r="5" fill="' + col + '" stroke="#fff" stroke-width="1"/>';
    } else if (t === 'm') {
      o += '<rect x="' + (x0 - w / 2) + '" y="' + (base - h) + '" width="' + w + '" height="' + h + '" fill="url(#ct-stone)" stroke="#5a4a36"/>';
      for (var i = 0; i < 5; i++) o += '<rect x="' + (x0 - w / 2 + i * w / 4.5) + '" y="' + (base - h - 7) + '" width="' + w / 9 + '" height="8" fill="url(#ct-stone)" stroke="#5a4a36"/>';
      o += '<path d="M' + (x0 - 6) + ' ' + base + 'v-12a6 6 0 0 1 12 0v12Z" fill="#3a2a1a"/><rect x="' + (x0 - 3) + '" y="' + (base - h + 10) + '" width="6" height="10" fill="#2a1a10"/><path d="M' + x0 + ' ' + (base - h - 7) + 'v-14" stroke="#5a4a36" stroke-width="1.2"/><path d="M' + x0 + ' ' + (base - h - 21) + 'l12 4l-12 4Z" fill="' + col + '"/>';
    } else if (t === 'n') {
      o += '<rect x="' + (x0 - w / 2) + '" y="' + (base - h * .7) + '" width="' + w + '" height="' + h * .7 + '" fill="' + wall + '" stroke="#6a5a40"/>' +
        '<rect x="' + (x0 - w / 2 - 6) + '" y="' + (base - h) + '" width="12" height="' + h + '" fill="' + wall + '" stroke="#6a5a40"/><rect x="' + (x0 + w / 2 - 6) + '" y="' + (base - h) + '" width="12" height="' + h + '" fill="' + wall + '" stroke="#6a5a40"/>' +
        '<path d="M' + (x0 - w / 2 - 8) + ' ' + (base - h) + 'L' + (x0 - w / 2) + ' ' + (base - h - 14) + 'L' + (x0 - w / 2 + 8) + ' ' + (base - h) + 'ZM' + (x0 + w / 2 - 8) + ' ' + (base - h) + 'L' + (x0 + w / 2) + ' ' + (base - h - 14) + 'L' + (x0 + w / 2 + 8) + ' ' + (base - h) + 'Z" fill="' + roof + '"/>' +
        '<path d="M' + (x0 - w / 2) + ' ' + (base - h * .7) + 'L' + x0 + ' ' + (base - h * .7 - 12) + 'L' + (x0 + w / 2) + ' ' + (base - h * .7) + 'Z" fill="' + col + '" stroke="' + dk + '"/>' +
        '<path d="M' + (x0 - 7) + ' ' + base + 'v-13a7 7 0 0 1 14 0v13Z" fill="#5a3a1a"/>' + [-1, 1].map(function (s) { return '<rect x="' + (x0 + s * 14 - 3) + '" y="' + (base - h * .45) + '" width="6" height="8" fill="#5a7ab8"/>'; }).join('');
    } else if (t === 'c') {
      o += '<rect x="' + (x0 - w / 2) + '" y="' + (base - h * .62) + '" width="' + w + '" height="' + h * .62 + '" fill="' + wall + '" stroke="#6a5a40"/><path d="M' + (x0 - w / 2 - 5) + ' ' + (base - h * .62) + 'L' + x0 + ' ' + (base - h) + 'L' + (x0 + w / 2 + 5) + ' ' + (base - h * .62) + 'Z" fill="' + roof + '"/>' +
        '<path d="M' + (x0 - w / 2 - 2) + ' ' + (base - 20) + 'h' + (w + 4) + 'l-4 8h-' + (w - 4) + 'Z" fill="' + col + '"/>' + [0, 1, 2, 3].map(function (k) { return '<path d="M' + (x0 - w / 2 + k * w / 4) + ' ' + (base - 20) + 'l' + w / 8 + ' 8" stroke="#fff" stroke-width="2" opacity=".6"/>'; }).join('') +
        '<rect x="' + (x0 - 6) + '" y="' + (base - 12) + '" width="12" height="12" fill="#5a3a1a"/><rect x="' + (x0 - 14) + '" y="' + (base - h * .5) + '" width="8" height="8" fill="#5a7ab8"/><rect x="' + (x0 + 6) + '" y="' + (base - h * .5) + '" width="8" height="8" fill="#5a7ab8"/>';
    } else {
      o += '<rect x="' + (x0 - w / 2) + '" y="' + (base - h * .55) + '" width="' + w + '" height="' + h * .55 + '" fill="#e4d6f4" stroke="#4a2a7a"/><rect x="' + (x0 - 9) + '" y="' + (base - h) + '" width="18" height="' + h * .45 + '" fill="#e4d6f4" stroke="#4a2a7a"/>' +
        '<path d="M' + (x0 - 12) + ' ' + (base - h) + 'Q' + x0 + ' ' + (base - h - 26) + ' ' + (x0 + 12) + ' ' + (base - h) + 'Z" fill="' + col + '" stroke="#4a2a7a"/><circle cx="' + x0 + '" cy="' + (base - h - 18) + '" r="3" fill="#ffe680"/>' +
        '<path d="M' + (x0 - 6) + ' ' + base + 'v-12a6 6 0 0 1 12 0v12Z" fill="#4a2a7a"/><circle cx="' + x0 + '" cy="' + (base - h * .78) + '" r="4" fill="#ffe680" stroke="#4a2a7a"/>';
    }
    return o;
  }
  var ICON = {
    n: '<path d="M-7 3L-8 -4L-3.5 -.5L0 -6L3.5 -.5L8 -4L7 3Z" fill="#fff"/>',
    r: '<path d="M-1.4 -7h2.8v4h4v2.8h-4V7h-2.8V-.2h-4v-2.8h4z" fill="#fff"/>',
    c: '<path d="M-7 -1h14M0 -6v12M-7 -1l-3 5h6zM7 -1l-3 5h6z" fill="none" stroke="#fff" stroke-width="1.6" stroke-linejoin="round"/>',
    m: '<path d="M-6 -6h12v6q0 6 -6 8q-6 -2 -6 -8z" fill="#fff"/>',
    u: '<path d="M0 -7l2 4.6 5 .5-3.8 3.3 1.1 4.9L0 2.8l-4.3 2.5 1.1-4.9L-7 -1.9l5-.5z" fill="#fff"/>'
  };
  var dcache = {};
  function distFace(id, mini) {
    var k = id + (mini ? 'm' : ''); if (dcache[k]) return dcache[k];
    var d = E.D(id), t = d.t, col = TC[t];
    var o = '<svg class="ctc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="10" fill="url(#ct-parch)"/>' +
      '<rect x="6" y="6" width="88" height="128" rx="7" fill="url(#ct-sky)" opacity=".85"/><g clip-path="url(#ct-clip)"><circle cx="76" cy="30" r="10" fill="#fff3c0" opacity=".8"/><path d="M6 108h88v30H6z" fill="#6a8a3a"/><path d="M6 108q22 -6 44 0t44 0v4H6z" fill="#7aa04a"/>' + building(t, d.c, d.n) + '</g>' +
      '<rect x="6" y="6" width="88" height="128" rx="7" fill="none" stroke="' + col[0] + '" stroke-width="3"/>';
    // costo in monete
    for (var i = 0; i < d.c; i++) o += coin(16, 18 + i * (mini ? 13 : 11), mini ? 6 : 5.4, '');
    o += '<g transform="translate(84 18)"><circle r="9" fill="' + col[1] + '" stroke="#fff" stroke-width="1.2"/>' + ICON[t] + '</g>';
    if (!mini) {
      if (d.x) o += '<rect x="10" y="62" width="80" height="44" rx="5" fill="rgba(255,250,235,.92)" stroke="' + col[1] + '"/><foreignObject x="12" y="63" width="76" height="42"><div xmlns="http://www.w3.org/1999/xhtml" class="ctc-x">' + d.x + '</div></foreignObject>';
      o += '<path d="M6 112h88v22H6z" fill="' + col[1] + '" opacity=".88"/>' + T(50, 127, d.n.toUpperCase(), d.n.length > 14 ? 7.6 : d.n.length > 10 ? 9 : 11, '#fff');
    } else o += '<path d="M6 116h88v18H6z" fill="' + col[1] + '" opacity=".88"/>' + T(50, 130, d.n.length > 11 ? d.n.split(' ').map(function (w) { return w.slice(0, 4); }).join('.') : d.n, 11, '#fff');
    o += '<rect x="1" y="1" width="98" height="138" rx="10" fill="url(#ct-shine)"/><rect x="1" y="1" width="98" height="138" rx="10" fill="none" stroke="#4a3010" stroke-width="2"/></svg>';
    return (dcache[k] = o);
  }
  var backC = {};
  function back(kind) {
    if (backC[kind]) return backC[kind];
    var o = '<svg class="ctc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="10" fill="url(#ct-back)"/><rect x="8" y="8" width="84" height="124" rx="7" fill="none" stroke="#c9a23a" stroke-width="1.6"/>' +
      '<rect x="13" y="13" width="74" height="114" rx="5" fill="none" stroke="#c9a23a" stroke-width=".8" stroke-dasharray="3 3"/>' +
      (kind === 'char' ? '<circle cx="50" cy="66" r="24" fill="none" stroke="#c9a23a" stroke-width="1.6"/>' + T(50, 78, '?', 34, '#c9a23a') :
        '<path d="M26 92V60l8-8 8 8V92M42 92V48l8-14 8 14V92M58 92V62l8-8 8 8V92" fill="#c9a23a" opacity=".85"/><path d="M22 92h56" stroke="#c9a23a" stroke-width="2"/>') +
      '<rect x="1" y="1" width="98" height="138" rx="10" fill="url(#ct-shine)"/></svg>';
    return (backC[kind] = o);
  }
  // carta completa: c = {d: id} quartiere, {r: rango} personaggio, null = dorso
  function card(c, o) {
    o = o || {};
    var front = c == null ? back(o.back || 'dist') : c.r != null ? charFace(c.r, o.mini) : distFace(c.d, o.mini);
    var cls = c == null ? ' back' : c.r != null ? ' ch r' + c.r : ' di t-' + E.D(c.d).t;
    return '<span class="ctc' + cls + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '>' + front + '</span>';
  }
  // gettone tondo del personaggio (per la corte 1–8)
  function token(r) {
    return '<svg class="ctk-svg" viewBox="0 0 40 40" aria-hidden="true"><circle cx="20" cy="20" r="18" fill="url(#ct-c' + r + ')" stroke="#f4dc9a" stroke-width="2"/><g transform="translate(20 25) scale(.36) translate(-50 -78)">' + PORT[r]() + '</g><circle cx="20" cy="20" r="18" fill="none" stroke="#4a3010" stroke-width="1"/></svg>';
  }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="#f2c23c" stroke="#7a4f00" stroke-width="2"/><circle cx="12" cy="12" r="5.5" fill="none" stroke="#fff3c0" stroke-width="1.2"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3.5h10a2 2 0 0 1 2 2V18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    build: '<path d="M3 21h18M5 21V10l7-6 7 6v11M10 21v-6h4v6" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    crown: '<path d="M3 17L2 7l5.5 4L12 4l4.5 7L22 7l-1 10z" fill="#f2c23c" stroke="#7a4f00" stroke-width="1.4" stroke-linejoin="round"/><path d="M3 19h18" stroke="#7a4f00" stroke-width="2"/>',
    dagger: '<path d="M18 3l3 3-9 9-3-3zM9 12l-3 1-2 3 4 4 3-2 1-3M4 20l-1 1" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    bag: '<path d="M7 8h10l2 12H5zM9 8V6a3 3 0 0 1 6 0v2" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    magic: '<path d="M4 20L15 9M14 4v3M18 6h-3M20 10h-3M17 13v-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    fire: '<path d="M12 3c1 4 6 6 6 11a6 6 0 0 1-12 0c0-3 2-4 2-7 2 1 3 3 3 5 1-2 1-5 1-9z" fill="currentColor"/>',
    end: '<path d="M5 12h12M13 7l5 5-5 5" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<path d="M5 12l4 4 10-10" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    scroll: '<path d="M6 4h11a2 2 0 0 1 2 2v12a2 2 0 0 1-2 2H8M6 4a2 2 0 0 0-2 2v2h4V6a2 2 0 0 0-2-2zM9 9h7M9 13h7" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  return { defs: defs, card: card, token: token, icon: icon, coin: coin, crownPath: crownPath, TC: TC, CC: CC };
})();
