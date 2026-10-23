/* ===== Illustrazioni: tutto disegnato in SVG, stile incisione a inchiostro su carta seppia ===== */
var PPArt = (function () {
  var INK = '#2b1d12';
  var K = 'stroke="' + INK + '" stroke-linejoin="round" stroke-linecap="round"';
  function sv(vb, body, cls) { return '<svg viewBox="' + vb + '" xmlns="http://www.w3.org/2000/svg" class="' + (cls || 'art') + '" aria-hidden="true">' + body + '</svg>'; }

  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<pattern id="pp-hatch" width="3.2" height="3.2" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="3.2" stroke="' + INK + '" stroke-width="1" opacity=".55"/></pattern>' +
    '<pattern id="pp-hatchL" width="3.6" height="3.6" patternUnits="userSpaceOnUse" patternTransform="rotate(40)"><line x1="0" y1="0" x2="0" y2="3.6" stroke="' + INK + '" stroke-width=".7" opacity=".32"/></pattern>' +
    '<pattern id="pp-cross" width="4" height="4" patternUnits="userSpaceOnUse" patternTransform="rotate(30)"><path d="M0 0V4M0 0H4" stroke="' + INK + '" stroke-width=".8" opacity=".5"/></pattern>' +
    '<pattern id="pp-dots" width="4" height="4" patternUnits="userSpaceOnUse"><circle cx="1" cy="1" r=".7" fill="' + INK + '" opacity=".35"/><circle cx="3" cy="3" r=".6" fill="' + INK + '" opacity=".25"/></pattern>' +
    '<pattern id="pp-brick" width="24" height="12" patternUnits="userSpaceOnUse"><rect width="24" height="12" fill="#a4553a"/><path d="M0 0H24M0 6H24M6 0V6M18 6V12" stroke="#5b2a1a" stroke-width="1.2"/></pattern>' +
    '<pattern id="pp-check" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#7a6a4a"/><rect width="3" height="3" fill="#4e4130"/><rect x="3" y="3" width="3" height="3" fill="#4e4130"/></pattern>' +
    '<pattern id="pp-snake" width="8" height="6" patternUnits="userSpaceOnUse"><rect width="8" height="6" fill="#8a7a3c"/><path d="M0 3L4 0L8 3L4 6Z" fill="#4f4520"/></pattern>' +
    '<linearGradient id="pp-dusk" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4dfae"/><stop offset=".55" stop-color="#e9a86a"/><stop offset="1" stop-color="#b65f3e"/></linearGradient>' +
    '<linearGradient id="pp-day" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f1e6c8"/><stop offset="1" stop-color="#d6bd8b"/></linearGradient>' +
    '<linearGradient id="pp-dawn" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6e5a78"/><stop offset=".5" stop-color="#d98a6a"/><stop offset="1" stop-color="#f3cf8e"/></linearGradient>' +
    '<linearGradient id="pp-night" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f2c44"/><stop offset="1" stop-color="#6f5266"/></linearGradient>' +
    '<linearGradient id="pp-inside" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#6b4a2e"/><stop offset="1" stop-color="#3a2717"/></linearGradient>' +
    '<linearGradient id="pp-steel" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#a7b1b6"/><stop offset=".45" stop-color="#5e6a72"/><stop offset="1" stop-color="#2d353b"/></linearGradient>' +
    '<linearGradient id="pp-brass" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f6dc8a"/><stop offset=".5" stop-color="#c4952f"/><stop offset="1" stop-color="#6f4f16"/></linearGradient>' +
    '<linearGradient id="pp-wood" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#a87444"/><stop offset="1" stop-color="#5e3a1d"/></linearGradient>' +
    '<linearGradient id="pp-amber" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#9a5512"/><stop offset=".45" stop-color="#e3a245"/><stop offset="1" stop-color="#8a4a10"/></linearGradient>' +
    '<linearGradient id="pp-red" x1="0" y1="0" x2="1" y2="0"><stop offset="0" stop-color="#7a1f17"/><stop offset=".5" stop-color="#c0432f"/><stop offset="1" stop-color="#6b1a12"/></linearGradient>' +
    '<radialGradient id="pp-flash"><stop offset="0" stop-color="#fffbe0"/><stop offset=".3" stop-color="#ffd25a"/><stop offset=".65" stop-color="#e2672b" stop-opacity=".8"/><stop offset="1" stop-color="#e2672b" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="pp-sun"><stop offset="0" stop-color="#fff3c8"/><stop offset=".6" stop-color="#f7cf7a"/><stop offset="1" stop-color="#f7cf7a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="pp-vig" cx=".5" cy=".45" r=".75"><stop offset=".55" stop-color="' + INK + '" stop-opacity="0"/><stop offset="1" stop-color="' + INK + '" stop-opacity=".55"/></radialGradient>' +
    '</defs></svg>';

  // ---------- elementi riusabili ----------
  function mesa(y, col) { return '<path d="M0 ' + y + ' L18 ' + (y - 14) + ' L34 ' + (y - 14) + ' L40 ' + (y - 6) + ' L70 ' + (y - 6) + ' L78 ' + (y - 22) + ' L104 ' + (y - 22) + ' L110 ' + (y - 4) + ' L150 ' + (y - 4) + ' L158 ' + (y - 16) + ' L176 ' + (y - 16) + ' L184 ' + (y - 2) + ' L200 ' + (y - 2) + ' V140 H0Z" fill="' + (col || '#a0603f') + '" opacity=".55"/>'; }
  function ground(y) { return '<path d="M0 ' + y + ' Q100 ' + (y - 6) + ' 200 ' + y + ' V140 H0Z" fill="#c7a26c"/><path d="M0 ' + y + ' Q100 ' + (y - 6) + ' 200 ' + y + ' V140 H0Z" fill="url(#pp-dots)"/>'; }
  function smoke(x, y, s) { s = s || 1; return '<g opacity=".7" fill="#efe6d4" ' + K + ' stroke-width="1"><circle cx="' + x + '" cy="' + y + '" r="' + 7 * s + '"/><circle cx="' + (x + 9 * s) + '" cy="' + (y - 5 * s) + '" r="' + 6 * s + '"/><circle cx="' + (x + 16 * s) + '" cy="' + (y + 2 * s) + '" r="' + 5 * s + '"/></g>'; }
  function burst(cx, cy, r1, r2, n) {
    var pts = [];
    for (var i = 0; i < n * 2; i++) { var a = Math.PI * i / n, r = i % 2 ? r2 : r1 * (0.8 + 0.4 * ((i * 7) % 5) / 5); pts.push((cx + Math.cos(a) * r).toFixed(1) + ',' + (cy + Math.sin(a) * r).toFixed(1)); }
    return '<polygon points="' + pts.join(' ') + '" fill="#ffd25a" ' + K + ' stroke-width="1.4"/><circle cx="' + cx + '" cy="' + cy + '" r="' + r2 * 0.9 + '" fill="#fff6d2"/>';
  }
  // Rivoltella orientata a destra; (x,y) = centro del tamburo
  function revolverGun(x, y, len, scale) {
    len = len || 58; scale = scale || 1;
    return '<g transform="translate(' + x + ',' + y + ') scale(' + scale + ')" ' + K + ' stroke-width="1.6">' +
      '<rect x="10" y="-11" width="' + len + '" height="11" rx="1.5" fill="url(#pp-steel)"/>' +
      '<line x1="12" y1="-8" x2="' + (len + 8) + '" y2="-8" stroke="#dfe6ea" stroke-width=".8" opacity=".7"/>' +
      '<rect x="' + (len + 4) + '" y="-15" width="4" height="5" fill="#3a4349"/>' +
      '<rect x="12" y="0" width="' + (len * 0.62) + '" height="5" rx="2" fill="url(#pp-steel)"/>' +
      '<rect x="-14" y="-14" width="26" height="25" rx="5" fill="url(#pp-steel)"/>' +
      '<path d="M-8 -12V9M-1 -13V10M6 -12V9" stroke-width="1.1" opacity=".7"/>' +
      '<path d="M-14 -12 L-22 -13 L-30 -6 L-26 6 L-14 10Z" fill="url(#pp-steel)"/>' +
      '<path d="M-24 -11 L-34 -24 L-28 -27 L-19 -14Z" fill="#46525a"/>' +
      '<path d="M-26 5 C-32 22 -36 36 -40 46 C-32 53 -19 53 -13 46 C-12 32 -10 20 -8 10Z" fill="url(#pp-wood)"/>' +
      '<path d="M-28 16 C-31 26 -33 34 -35 42M-22 14 C-24 26 -26 36 -27 46" stroke-width=".8" opacity=".6"/>' +
      '<circle cx="-25" cy="30" r="2.6" fill="url(#pp-brass)"/>' +
      '<path d="M-6 10 C-6 24 10 25 12 10" fill="none"/><path d="M1 10 Q-1 16 3 20" fill="none"/>' +
      '</g>';
  }
  // Arma lunga orientata a destra
  function longGun(opt) {
    var L = opt.len || 150, x = opt.x || 22, y = opt.y || 70;
    var b = '<g transform="translate(' + x + ',' + y + ')" ' + K + ' stroke-width="1.6">';
    // calcio
    b += '<path d="M0 -4 L46 -10 L58 -9 L58 6 L44 8 C30 12 14 20 2 24 Z" fill="url(#pp-wood)"/>';
    b += '<path d="M8 4 C20 2 32 -1 44 -4M10 12 C22 9 34 5 46 2" stroke-width=".8" opacity=".55" fill="none"/>';
    b += '<path d="M0 -4 L2 24" stroke-width="2.4"/>';
    // castello
    b += '<rect x="56" y="-11" width="26" height="15" rx="2" fill="url(#pp-steel)"/>';
    if (opt.lever) b += '<path d="M64 4 C62 16 72 20 84 16 L80 6" fill="none" stroke-width="2"/>';
    else b += '<path d="M64 4 C64 12 76 13 78 4" fill="none"/>';
    b += '<path d="M70 4 Q68 9 71 11" fill="none"/>';
    b += '<path d="M60 -11 L54 -19 L58 -21 L64 -12Z" fill="#46525a"/>';
    // canne
    if (opt.double) {
      b += '<rect x="80" y="-11" width="' + (L - 80) + '" height="6" rx="2" fill="url(#pp-steel)"/><rect x="80" y="-5" width="' + (L - 80) + '" height="6" rx="2" fill="url(#pp-steel)"/>';
    } else {
      b += '<rect x="80" y="-9" width="' + (L - 80) + '" height="6" rx="1.5" fill="url(#pp-steel)"/>';
      if (opt.mag) b += '<rect x="82" y="-3" width="' + (L - 104) + '" height="5" rx="2" fill="url(#pp-steel)"/>';
    }
    // astina
    b += '<path d="M82 -3 L' + (opt.fore || 128) + ' -3 L' + ((opt.fore || 128) - 4) + ' 5 L84 6Z" fill="url(#pp-wood)"/>';
    b += '<rect x="' + (L - 4) + '" y="-14" width="3" height="5" fill="#3a4349"/>';
    if (opt.scope) b += '<rect x="66" y="-22" width="62" height="7" rx="3" fill="url(#pp-brass)"/><rect x="62" y="-24" width="8" height="11" rx="2" fill="url(#pp-brass)"/><rect x="124" y="-24" width="8" height="11" rx="2" fill="url(#pp-brass)"/><path d="M76 -15V-11M118 -15V-11"/>';
    b += '</g>';
    return b;
  }
  function badgeRange(n) { return ''; }

  // ---------- illustrazioni delle 22 carte (viewBox 200x140) ----------
  var CARD = {};
  CARD.sparo = function () {
    return '<rect width="200" height="140" fill="url(#pp-dusk)"/>' + mesa(118, '#8e4c33') +
      '<circle cx="170" cy="66" r="44" fill="url(#pp-flash)"/>' + burst(166, 64, 22, 10, 11) +
      '<path d="M182 50 L198 40M184 64 H200M182 78 L198 88" ' + K + ' stroke-width="2"/>' +
      revolverGun(70, 68, 82, 1) + smoke(150, 44, .9) +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.schivata = function () {
    return '<rect width="200" height="140" fill="url(#pp-day)"/>' + mesa(120, '#a7774e') + ground(122) +
      '<g transform="translate(96,70) rotate(-18)" ' + K + ' stroke-width="1.8">' +
      '<ellipse cx="0" cy="14" rx="56" ry="13" fill="#8a6038"/><ellipse cx="0" cy="14" rx="56" ry="13" fill="url(#pp-hatchL)"/>' +
      '<path d="M-30 13 C-32 -12 -22 -26 -10 -24 Q0 -16 10 -24 C22 -26 32 -12 30 13 Z" fill="#9c6c3e"/>' +
      '<path d="M-30 13 C-32 -12 -22 -26 -10 -24 Q0 -16 10 -24 C22 -26 32 -12 30 13 Z" fill="url(#pp-hatchL)"/>' +
      '<path d="M-30 6 Q0 12 30 6 L30 13 Q0 19 -30 13Z" fill="#4b2e18"/>' +
      '<circle cx="12" cy="-8" r="4.5" fill="#1d130b"/><path d="M8 -12 L5 -16M16 -12 L19 -15M15 -4 L19 -2" stroke-width="1.2"/></g>' +
      '<path d="M4 34 H70" stroke="' + INK + '" stroke-width="1" stroke-dasharray="6 5" opacity=".7"/>' +
      '<path d="M150 22 L196 10" ' + K + ' stroke-width="1.2" stroke-dasharray="4 4"/>' +
      '<g transform="translate(176,15) rotate(-14)" ' + K + ' stroke-width="1.2"><path d="M-10 -3 H4 Q10 0 4 3 H-10Z" fill="url(#pp-brass)"/></g>' +
      '<path d="M60 30 Q100 40 140 24" fill="none" ' + K + ' stroke-width="1" opacity=".5"/>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.whisky = function () {
    return '<rect width="200" height="140" fill="url(#pp-inside)"/>' +
      '<rect x="0" y="104" width="200" height="36" fill="#5a3a20"/><rect x="0" y="104" width="200" height="5" fill="#8a5c33"/>' +
      '<g opacity=".25" fill="#f6dc8a"><rect x="12" y="20" width="10" height="34"/><rect x="28" y="26" width="10" height="28"/><rect x="164" y="18" width="10" height="36"/><rect x="180" y="24" width="10" height="30"/></g>' +
      '<path d="M8 56 H192" stroke="#2a1a0e" stroke-width="3"/>' +
      '<g ' + K + ' stroke-width="1.8">' +
      '<path d="M78 106 V58 C78 50 86 46 90 42 V22 H104 V42 C108 46 116 50 116 58 V106 Z" fill="url(#pp-amber)"/>' +
      '<path d="M82 58 C82 52 88 48 92 45" fill="none" stroke="#fff3c8" stroke-width="1.6" opacity=".7"/>' +
      '<rect x="88" y="14" width="18" height="10" rx="2" fill="#6b3a1a"/>' +
      '<rect x="80" y="66" width="34" height="26" fill="#efe1c0"/>' +
      '<path d="M80 72 H114M80 86 H114" stroke-width="1"/>' +
      '<text x="97" y="83" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="11" fill="#8e2b1f" stroke="none">XXX</text>' +
      '<path d="M128 106 L132 80 H156 L160 106 Z" fill="#e8d9b8" opacity=".85"/>' +
      '<path d="M131 92 H157 L159 106 H129 Z" fill="url(#pp-amber)" opacity=".9"/>' +
      '<path d="M134 84 L132 100" stroke="#fff" stroke-width="1.4" opacity=".6"/>' +
      '</g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.giro = function () {
    function mug(x, y, r) {
      return '<g transform="translate(' + x + ',' + y + ') rotate(' + r + ')" ' + K + ' stroke-width="1.7">' +
        '<path d="M-14 -18 H14 L12 22 H-12Z" fill="#e4a84a"/><path d="M-14 -18 H14 L12 22 H-12Z" fill="url(#pp-hatchL)"/>' +
        '<path d="M14 -10 C26 -10 26 12 13 12" fill="none" stroke-width="3.2"/>' +
        '<path d="M-16 -18 C-18 -28 -6 -32 0 -27 C6 -33 18 -28 16 -18 Z" fill="#fbf4e2"/>' +
        '<path d="M-8 -6 V14M0 -6 V16M8 -6 V14" stroke-width=".8" opacity=".5"/></g>';
    }
    return '<rect width="200" height="140" fill="url(#pp-inside)"/>' +
      '<g opacity=".5"><circle cx="100" cy="20" r="26" fill="url(#pp-sun)"/></g>' +
      '<path d="M100 2 V12" stroke="' + INK + '" stroke-width="1.5"/><path d="M90 12 H110 L106 22 H94Z" fill="url(#pp-brass)" ' + K + '/>' +
      '<path d="M84 52 L98 60M116 52 L102 60M100 44 V56" stroke="#f6dc8a" stroke-width="2" stroke-linecap="round"/>' +
      mug(62, 82, -16) + mug(100, 78, 0) + mug(138, 82, 16) +
      '<g fill="#fbf4e2" opacity=".9"><circle cx="82" cy="58" r="2.5"/><circle cx="118" cy="56" r="2"/><circle cx="92" cy="50" r="1.6"/><circle cx="110" cy="48" r="1.8"/></g>' +
      '<rect x="0" y="118" width="200" height="22" fill="#4a2f19"/><rect x="0" y="118" width="200" height="4" fill="#8a5c33"/>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.posta = function () {
    function wheel(cx, cy, r) {
      var sp = ''; for (var i = 0; i < 12; i++) { var a = Math.PI * i / 6; sp += 'M' + cx + ' ' + cy + 'L' + (cx + Math.cos(a) * r).toFixed(1) + ' ' + (cy + Math.sin(a) * r).toFixed(1); }
      return '<circle cx="' + cx + '" cy="' + cy + '" r="' + r + '" fill="none" ' + K + ' stroke-width="3.5"/><path d="' + sp + '" ' + K + ' stroke-width="1.4"/><circle cx="' + cx + '" cy="' + cy + '" r="4" fill="#6b4423" ' + K + '/>';
    }
    return '<rect width="200" height="140" fill="url(#pp-day)"/>' + mesa(112, '#a7774e') + ground(116) +
      '<g opacity=".55" fill="#d9c49a">' + smoke(16, 106, 1.3).replace(/#efe6d4/g, '#d9c49a') + '</g>' +
      '<g ' + K + ' stroke-width="1.8">' +
      '<path d="M54 98 L50 50 Q50 40 60 40 H140 Q150 40 150 50 L146 98 Z" fill="#7a2a1c"/>' +
      '<path d="M54 98 L50 50 Q50 40 60 40 H140 Q150 40 150 50 L146 98 Z" fill="url(#pp-hatchL)"/>' +
      '<rect x="64" y="50" width="28" height="22" rx="2" fill="#2d1f14"/><rect x="108" y="50" width="28" height="22" rx="2" fill="#2d1f14"/>' +
      '<path d="M100 44 V96" stroke-width="1.2"/>' +
      '<rect x="66" y="78" width="68" height="12" fill="#e9d7a8"/>' +
      '<text x="100" y="88" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="9.5" fill="#7a2a1c" stroke="none" letter-spacing="1">POSTA</text>' +
      '<path d="M58 40 L64 26 H136 L142 40Z" fill="#5a3a20"/>' +
      '<rect x="70" y="18" width="22" height="10" fill="#b3864f"/><rect x="96" y="20" width="26" height="8" fill="#8a6038"/>' +
      '<path d="M40 92 Q30 98 22 94" fill="none" stroke-width="2.4"/><rect x="150" y="56" width="8" height="12" rx="2" fill="url(#pp-brass)"/>' +
      '</g>' + wheel(68, 104, 18) + wheel(136, 106, 16) +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.cassaforte = function () {
    var dial = ''; for (var i = 0; i < 16; i++) { var a = Math.PI * i / 8; dial += 'M' + (78 + Math.cos(a) * 11).toFixed(1) + ' ' + (68 + Math.sin(a) * 11).toFixed(1) + 'L' + (78 + Math.cos(a) * 14).toFixed(1) + ' ' + (68 + Math.sin(a) * 14).toFixed(1); }
    return '<rect width="200" height="140" fill="url(#pp-inside)"/>' +
      '<g ' + K + ' stroke-width="1.8">' +
      '<rect x="40" y="22" width="92" height="96" rx="4" fill="#3e4a3e"/><rect x="40" y="22" width="92" height="96" rx="4" fill="url(#pp-hatchL)"/>' +
      '<rect x="50" y="32" width="72" height="76" rx="2" fill="#1f1a14"/>' +
      '<path d="M122 32 L168 18 L168 124 L122 108 Z" fill="#56664f"/><path d="M122 32 L168 18 L168 124 L122 108 Z" fill="url(#pp-hatchL)"/>' +
      '<path d="M130 40 L160 31 V112 L130 102Z" fill="none" stroke="#c4952f" stroke-width="1.4"/>' +
      '<circle cx="148" cy="70" r="13" fill="url(#pp-brass)"/><circle cx="148" cy="70" r="5" fill="#6f4f16"/>' +
      '<path d="M50 80 H122" stroke-width="1.4"/>' +
      '<g transform="translate(0,0)"><path d="M56 78 L64 66 H96 L104 78Z" fill="url(#pp-brass)"/><path d="M60 66 L68 54 H100 L108 66" fill="url(#pp-brass)"/></g>' +
      '<circle cx="64" cy="98" r="7" fill="url(#pp-brass)"/><circle cx="80" cy="100" r="7" fill="url(#pp-brass)"/><circle cx="96" cy="97" r="7" fill="url(#pp-brass)"/><circle cx="108" cy="101" r="6" fill="url(#pp-brass)"/>' +
      '<path d="M62 96 h4M78 98 h4M94 95 h4" stroke-width="1"/>' +
      '<rect x="44" y="116" width="12" height="8" fill="#2a2a24"/><rect x="116" y="116" width="12" height="8" fill="#2a2a24"/>' +
      '</g><g fill="#fff6c8"><path d="M70 50 l2 -5 l2 5 l5 2 l-5 2 l-2 5 l-2 -5 l-5 -2Z"/><path d="M112 88 l1.5 -4 l1.5 4 l4 1.5 l-4 1.5 l-1.5 4 l-1.5 -4 l-4 -1.5Z"/></g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.bottega = function () {
    var aw = ''; for (var i = 0; i < 9; i++) aw += '<path d="M' + (20 + i * 18) + ' 34 h18 v14 q-9 6 -18 0Z" fill="' + (i % 2 ? '#efe1c0' : '#8e2b1f') + '" ' + K + ' stroke-width="1.2"/>';
    var jars = ''; [34, 52, 70, 132, 150, 168].forEach(function (x, i) { jars += '<rect x="' + (x - 6) + '" y="' + (i < 3 ? 64 : 64) + '" width="12" height="16" rx="2" fill="' + ['#c2853e', '#7a8a5a', '#a4553a', '#d9b25f', '#5e6a72', '#b97a52'][i] + '" ' + K + ' stroke-width="1.1"/>'; });
    return '<rect width="200" height="140" fill="url(#pp-day)"/>' +
      '<g ' + K + ' stroke-width="1.8"><rect x="14" y="14" width="172" height="112" fill="#8a6038"/><rect x="14" y="14" width="172" height="112" fill="url(#pp-hatchL)"/>' +
      '<rect x="40" y="16" width="120" height="18" fill="#efe1c0"/></g>' +
      '<text x="100" y="30" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="12" fill="#2b1d12" letter-spacing="2">BOTTEGA</text>' + aw +
      '<g ' + K + ' stroke-width="1.6"><rect x="22" y="56" width="62" height="54" fill="#2a1d12"/><rect x="116" y="56" width="62" height="54" fill="#2a1d12"/>' +
      '<path d="M22 80 H84M116 80 H178" stroke="#8a6038" stroke-width="2"/>' + jars +
      '<rect x="88" y="62" width="24" height="64" fill="#5a3a20"/><circle cx="106" cy="96" r="2" fill="url(#pp-brass)"/>' +
      '<ellipse cx="40" cy="124" rx="13" ry="5" fill="#7a5230"/><path d="M27 124 V104 Q40 98 53 104 V124" fill="#9a6a3c"/><path d="M27 110 Q40 106 53 110M27 118 Q40 114 53 118" fill="none" stroke-width="1.2"/>' +
      '<rect x="146" y="106" width="30" height="20" fill="#c9a66b"/><path d="M146 106 L176 126M176 106 L146 126" stroke-width="1"/></g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.borseggio = function () {
    return '<rect width="200" height="140" fill="#3b2c22"/>' +
      '<g ' + K + ' stroke-width="1.8">' +
      '<path d="M0 0 H120 L132 140 H0Z" fill="#4c4a52"/><path d="M0 0 H120 L132 140 H0Z" fill="url(#pp-hatchL)"/>' +
      '<path d="M62 40 L118 34 L122 82 L66 88 Z" fill="#3a3840"/><path d="M60 40 Q90 30 120 34" fill="none" stroke-width="2.4"/>' +
      '<path d="M20 0 V140" stroke-width="1" stroke-dasharray="3 3" opacity=".6"/>' +
      '<circle cx="96" cy="60" r="16" fill="url(#pp-brass)"/><circle cx="96" cy="60" r="12" fill="#f3ead2"/>' +
      '<path d="M96 51 V60 L102 63" stroke-width="1.4"/><rect x="93" y="40" width="6" height="5" fill="url(#pp-brass)"/>' +
      '<path d="M96 44 C90 30 70 26 60 38" fill="none" stroke="#c4952f" stroke-width="1.6" stroke-dasharray="2 1.5"/>' +
      '<path d="M200 74 C176 70 150 66 132 62 C122 60 112 56 108 60 C104 64 110 68 116 70 L112 74 C106 76 104 80 110 82 L126 80 C140 86 170 92 200 96 Z" fill="#c99b74"/>' +
      '<path d="M200 70 L160 66 L158 100 L200 104Z" fill="#2f2a26"/><path d="M160 64 L156 102" stroke-width="2.2"/>' +
      '<path d="M120 66 Q128 64 134 66M118 76 Q124 75 130 77" fill="none" stroke-width="1"/>' +
      '</g><rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.sabotaggio = function () {
    return '<rect width="200" height="140" fill="url(#pp-dusk)"/>' + mesa(120, '#8e4c33') + ground(124) +
      '<g ' + K + ' stroke-width="1.8">' +
      '<rect x="44" y="20" width="10" height="106" fill="url(#pp-wood)"/><rect x="24" y="30" width="50" height="7" fill="url(#pp-wood)"/>' +
      '<rect x="146" y="26" width="10" height="100" fill="url(#pp-wood)"/><rect x="126" y="36" width="50" height="7" fill="url(#pp-wood)"/>' +
      '<circle cx="30" cy="28" r="3" fill="#7fb0b8"/><circle cx="68" cy="28" r="3" fill="#7fb0b8"/><circle cx="132" cy="34" r="3" fill="#7fb0b8"/><circle cx="170" cy="34" r="3" fill="#7fb0b8"/>' +
      '<path d="M68 28 Q86 40 94 46" fill="none" stroke-width="1.4"/><path d="M132 34 Q114 44 106 52" fill="none" stroke-width="1.4"/>' +
      '<path d="M0 30 Q16 34 30 28M170 34 Q186 40 200 38" fill="none" stroke-width="1.4"/>' +
      '</g>' + burst(100, 50, 12, 5, 8) +
      '<g transform="translate(100,82) rotate(-30)" ' + K + ' stroke-width="1.8"><path d="M-6 -30 L-2 0 L2 0 L6 -30 L2 -32 L0 -14 L-2 -32Z" fill="url(#pp-steel)"/><circle cx="0" cy="2" r="3" fill="#ccc"/>' +
      '<path d="M-3 4 C-10 20 -12 34 -10 42 L-4 42 C-4 30 -2 18 0 6Z" fill="#8e2b1f"/><path d="M3 4 C10 20 12 34 10 42 L4 42 C4 30 2 18 0 6Z" fill="#8e2b1f"/></g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.sfida = function () {
    function man(x, flip) {
      return '<g transform="translate(' + x + ',0) scale(' + flip + ',1)" fill="#2b1d12">' +
        '<ellipse cx="0" cy="58" rx="13" ry="3"/><path d="M-7 58 C-7 48 -4 45 0 45 C4 45 7 48 7 58Z"/>' +
        '<circle cx="0" cy="64" r="5.5"/><path d="M-9 70 H9 L12 98 L7 98 L6 120 L1 120 L0 100 L-1 120 L-6 120 L-7 98 L-12 98Z"/>' +
        '<path d="M9 72 L18 88 L22 86 L13 72Z"/><path d="M-9 72 L-14 92 L-10 93 L-6 76Z"/><path d="M-12 94 H12 V97 H-12Z" fill="#6b4423"/></g>';
    }
    return '<rect width="200" height="140" fill="url(#pp-dawn)"/>' +
      '<circle cx="100" cy="104" r="40" fill="url(#pp-sun)"/><circle cx="100" cy="106" r="22" fill="#fbe2a0"/>' +
      '<path d="M0 108 L30 98 L58 104 L82 96 L118 100 L150 92 L176 100 L200 96 V140 H0Z" fill="#5a3a3a" opacity=".6"/>' +
      '<rect x="0" y="118" width="200" height="22" fill="#4a2c22"/>' +
      '<path d="M44 121 L156 121" stroke="#f3cf8e" stroke-width="1" opacity=".5"/>' +
      '<g transform="translate(0,2)">' + man(46, 1) + man(154, -1) + '</g>' +
      '<path d="M8 126 L44 124M192 126 L156 124" stroke="#2b1d12" stroke-width="3" opacity=".5"/>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.stampede = function () {
    return '<rect width="200" height="140" fill="url(#pp-day)"/>' + mesa(100, '#a7774e') +
      '<g fill="#d8c29a" ' + K + ' stroke-width="1" opacity=".9"><circle cx="20" cy="104" r="16"/><circle cx="44" cy="96" r="14"/><circle cx="160" cy="98" r="15"/><circle cx="184" cy="106" r="17"/><circle cx="72" cy="112" r="12"/><circle cx="130" cy="114" r="12"/></g>' +
      '<g ' + K + ' stroke-width="1.8">' +
      '<path d="M100 42 C78 42 52 36 26 22 C18 18 10 22 16 26 C34 38 54 50 72 56 Z" fill="#efe3c8"/>' +
      '<path d="M100 42 C122 42 148 36 174 22 C182 18 190 22 184 26 C166 38 146 50 128 56 Z" fill="#efe3c8"/>' +
      '<path d="M26 22 C34 26 46 30 58 34M174 22 C166 26 154 30 142 34" fill="none" stroke-width="1"/>' +
      '<path d="M72 50 C70 40 84 34 100 34 C116 34 130 40 128 50 C134 64 126 90 118 106 C112 118 88 118 82 106 C74 90 66 64 72 50Z" fill="#7a4a2a"/>' +
      '<path d="M72 50 C70 40 84 34 100 34 C116 34 130 40 128 50 C134 64 126 90 118 106 C112 118 88 118 82 106 C74 90 66 64 72 50Z" fill="url(#pp-hatchL)"/>' +
      '<path d="M88 40 C92 50 108 50 112 40 C106 46 94 46 88 40Z" fill="#efe3c8"/>' +
      '<path d="M76 64 Q84 58 90 66 Q84 70 76 64Z" fill="#fbf4e2"/><path d="M124 64 Q116 58 110 66 Q116 70 124 64Z" fill="#fbf4e2"/>' +
      '<circle cx="84" cy="65" r="2.3" fill="#8e2b1f"/><circle cx="116" cy="65" r="2.3" fill="#8e2b1f"/>' +
      '<ellipse cx="100" cy="104" rx="15" ry="11" fill="#b98b6a"/><ellipse cx="94" cy="104" rx="2.6" ry="3.6" fill="#2b1d12"/><ellipse cx="106" cy="104" rx="2.6" ry="3.6" fill="#2b1d12"/>' +
      '<path d="M96 116 Q100 122 104 116" fill="none" stroke="#c4952f" stroke-width="2.4"/>' +
      '</g><g fill="#fbf4e2" opacity=".8"><path d="M86 112 q-8 4 -14 2 q6 4 14 0Z"/><path d="M114 112 q8 4 14 2 q-6 4 -14 0Z"/></g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.mitraglia = function () {
    var barrels = ''; for (var i = 0; i < 5; i++) barrels += '<rect x="92" y="' + (46 + i * 4.2) + '" width="84" height="3.6" rx="1.4" fill="url(#pp-steel)" ' + K + ' stroke-width=".8"/>';
    var sp = ''; for (var j = 0; j < 12; j++) { var a = Math.PI * j / 6; sp += 'M66 108L' + (66 + Math.cos(a) * 24).toFixed(1) + ' ' + (108 + Math.sin(a) * 24).toFixed(1); }
    return '<rect width="200" height="140" fill="url(#pp-dusk)"/>' + mesa(116, '#8e4c33') + ground(120) +
      '<circle cx="186" cy="56" r="26" fill="url(#pp-flash)"/>' + burst(184, 56, 12, 6, 9) +
      barrels +
      '<g ' + K + ' stroke-width="1.8">' +
      '<rect x="168" y="44" width="10" height="26" rx="2" fill="url(#pp-brass)"/><rect x="86" y="44" width="10" height="26" rx="2" fill="url(#pp-brass)"/>' +
      '<rect x="52" y="44" width="38" height="28" rx="3" fill="url(#pp-brass)"/>' +
      '<path d="M64 44 L60 22 H84 L80 44Z" fill="url(#pp-brass)"/><path d="M62 30 H82" stroke-width="1"/>' +
      '<path d="M52 58 H38 V44" fill="none" stroke-width="2.6"/><circle cx="38" cy="42" r="3" fill="#6b4423"/>' +
      '<path d="M66 72 L66 108 M58 70 L20 118" stroke-width="4"/>' +
      '<circle cx="66" cy="108" r="24" fill="none" stroke-width="3.5"/><path d="' + sp + '" stroke-width="1.3"/><circle cx="66" cy="108" r="4" fill="url(#pp-brass)"/>' +
      '</g>' + smoke(150, 34, .8) + '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.riparo = function () {
    var holes = '<g fill="#1d130b">' + [[64, 74], [96, 68], [128, 80], [150, 70]].map(function (h) { return '<circle cx="' + h[0] + '" cy="' + h[1] + '" r="3"/>'; }).join('') + '</g>';
    var jets = [[64, 74, -1], [96, 68, 1], [128, 80, 1], [150, 70, 1]].map(function (h) { return '<path d="M' + h[0] + ' ' + h[1] + ' q' + (h[2] * 10) + ' 6 ' + (h[2] * 14) + ' 30" fill="none" stroke="#9fc4cc" stroke-width="2.6" stroke-linecap="round"/>'; }).join('');
    return '<rect width="200" height="140" fill="url(#pp-day)"/>' + mesa(96, '#a7774e') + ground(110) +
      '<g ' + K + ' stroke-width="1.8">' +
      '<path d="M30 60 H170 L162 112 H38Z" fill="#8a6038"/><path d="M30 60 H170 L162 112 H38Z" fill="url(#pp-hatchL)"/>' +
      '<path d="M32 74 H168M34 88 H166M36 100 H164" stroke-width="1.1"/>' +
      '<path d="M26 56 H174 V64 H26Z" fill="#6b4423"/>' +
      '<path d="M40 112 V124M160 112 V124" stroke-width="4"/>' +
      '<path d="M30 60 Q100 52 170 60" fill="#7fa6ae"/>' +
      '</g>' + holes + jets +
      '<path d="M4 40 L60 52M8 30 L70 46" stroke="' + INK + '" stroke-width="1" stroke-dasharray="5 4" opacity=".6"/>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.cavallo = function () {
    return '<rect width="200" height="140" fill="url(#pp-dusk)"/>' + mesa(120, '#8e4c33') +
      '<g ' + K + ' stroke-width="1.9">' +
      '<path d="M78 140 C74 110 72 86 78 66 C82 50 92 38 104 30 L106 18 L114 28 C122 26 130 30 136 38 C146 50 160 66 166 80 C170 88 166 96 158 96 C150 96 144 90 136 84 C128 80 124 86 122 96 C120 110 124 126 128 140 Z" fill="#6e3f22"/>' +
      '<path d="M78 140 C74 110 72 86 78 66 C82 50 92 38 104 30 L106 18 L114 28 C122 26 130 30 136 38 C146 50 160 66 166 80 C170 88 166 96 158 96 C150 96 144 90 136 84 C128 80 124 86 122 96 C120 110 124 126 128 140 Z" fill="url(#pp-hatchL)"/>' +
      '<path d="M104 30 C92 34 80 46 72 62 C64 78 62 98 64 120 C56 104 54 86 58 68 C62 52 74 38 92 30 C96 28 100 28 104 30Z" fill="#2b1d12"/>' +
      '<path d="M66 50 C58 60 54 74 54 88M70 42 C60 48 52 58 48 70" fill="none" stroke-width="1.6"/>' +
      '<path d="M98 32 C96 22 98 14 104 10 L106 22" fill="#2b1d12"/>' +
      '<path d="M124 50 Q130 46 134 52 Q128 56 124 50Z" fill="#fbf4e2"/><circle cx="129" cy="51" r="2" fill="#1d130b"/>' +
      '<ellipse cx="156" cy="88" rx="3" ry="2" fill="#1d130b"/><path d="M146 94 Q152 98 160 95" fill="none" stroke-width="1.2"/>' +
      '<path d="M114 30 L140 62 L160 82M140 62 L130 88 L122 96M118 40 L108 70" fill="none" stroke="#8e2b1f" stroke-width="2.4"/>' +
      '<circle cx="140" cy="62" r="3" fill="url(#pp-brass)"/><circle cx="158" cy="80" r="3.5" fill="none" stroke="#c4952f" stroke-width="2"/>' +
      '</g><rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.cannocchiale = function () {
    return '<rect width="200" height="140" fill="url(#pp-day)"/>' +
      '<circle cx="152" cy="54" r="40" fill="#efe3c3" ' + K + ' stroke-width="1.6"/>' +
      '<g opacity=".9"><path d="M114 66 L130 54 L146 54 L152 46 L170 46 L178 58 L192 62 V90 H112Z" fill="#a0603f"/><path d="M146 54 L170 46" stroke="' + INK + '" stroke-width="1"/></g>' +
      '<path d="M128 70 l4 -10 l4 10 M160 66 l3 -8 l3 8" stroke="' + INK + '" stroke-width="1.4" fill="none"/>' +
      '<circle cx="152" cy="54" r="40" fill="none" stroke="#2b1d12" stroke-width="10" opacity=".85"/>' +
      '<path d="M152 18 V36M152 72 V90M116 54 H134M170 54 H188" stroke="' + INK + '" stroke-width="1.2"/>' +
      mesa(122, '#a7774e') + ground(126) +
      '<g transform="translate(20,108) rotate(-24)" ' + K + ' stroke-width="1.8">' +
      '<rect x="0" y="-10" width="36" height="20" rx="3" fill="url(#pp-brass)"/><rect x="34" y="-8" width="32" height="16" rx="2" fill="url(#pp-brass)"/><rect x="64" y="-6" width="28" height="12" rx="2" fill="url(#pp-brass)"/>' +
      '<rect x="-4" y="-12" width="6" height="24" rx="2" fill="#6f4f16"/><path d="M8 -10 V10M20 -10 V10" stroke-width="1"/>' +
      '<ellipse cx="93" cy="0" rx="3" ry="6" fill="#bfe0ea"/></g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.gattabuia = function () {
    var bars = ''; for (var i = 0; i < 5; i++) bars += '<rect x="' + (66 + i * 16) + '" y="28" width="6" height="74" rx="3" fill="url(#pp-steel)" ' + K + ' stroke-width="1.2"/>';
    return '<rect width="200" height="140" fill="url(#pp-brick)"/><rect width="200" height="140" fill="url(#pp-hatchL)"/>' +
      '<rect x="56" y="24" width="94" height="82" fill="url(#pp-night)" ' + K + ' stroke-width="2"/>' +
      '<circle cx="124" cy="46" r="9" fill="#f3ead2" opacity=".9"/><circle cx="128" cy="44" r="8" fill="#3a3550"/>' +
      '<g fill="#fff8d8"><circle cx="76" cy="40" r=".9"/><circle cx="96" cy="56" r=".8"/><circle cx="140" cy="70" r=".9"/></g>' +
      bars + '<rect x="58" y="44" width="90" height="5" fill="url(#pp-steel)" ' + K + ' stroke-width="1"/><rect x="58" y="80" width="90" height="5" fill="url(#pp-steel)" ' + K + ' stroke-width="1"/>' +
      '<rect x="50" y="104" width="106" height="9" fill="#8a7a66" ' + K + ' stroke-width="1.6"/>' +
      '<g ' + K + ' stroke-width="1.8" transform="translate(30,104)"><circle cx="0" cy="0" r="10" fill="none" stroke="#c4952f" stroke-width="3"/>' +
      '<path d="M6 6 L22 18 L20 22 L18 20 L16 23 L13 20" fill="none" stroke-width="2.6" stroke="#6f4f16"/><path d="M-6 6 L-12 22 L-9 24 L-8 20 L-5 22" fill="none" stroke-width="2.6" stroke="#6f4f16"/></g>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  CARD.candelotto = function () {
    function stick(x, r) { return '<g transform="translate(' + x + ',76) rotate(' + r + ')" ' + K + ' stroke-width="1.6"><rect x="-8" y="-34" width="16" height="66" rx="3" fill="url(#pp-red)"/><path d="M-8 -26 H8M-8 24 H8" stroke-width="1"/></g>'; }
    return '<rect width="200" height="140" fill="url(#pp-night)"/>' +
      '<circle cx="128" cy="26" r="34" fill="url(#pp-flash)" opacity=".8"/>' +
      stick(84, -6) + stick(116, 6) + stick(100, 0) +
      '<path d="M76 66 H124 V76 H76Z" fill="#c9a66b" ' + K + ' stroke-width="1.4"/><path d="M76 94 H124 V102 H76Z" fill="#c9a66b" ' + K + ' stroke-width="1.4"/>' +
      '<text x="100" y="73.5" text-anchor="middle" font-family="Courier Prime, Courier, monospace" font-size="7" font-weight="700" fill="#2b1d12">PERICOLO</text>' +
      '<path d="M100 42 C100 30 110 26 116 30 C122 34 120 24 128 22" fill="none" ' + K + ' stroke-width="2.2"/>' +
      burst(128, 22, 10, 4, 7) +
      '<g fill="#ffd25a"><circle cx="140" cy="12" r="1.6"/><circle cx="118" cy="10" r="1.2"/><circle cx="142" cy="30" r="1.3"/><circle cx="136" cy="6" r="1"/></g>' +
      '<rect x="0" y="118" width="200" height="22" fill="#3b2a24"/>' +
      '<rect width="200" height="140" fill="url(#pp-vig)"/>';
  };
  function gunBg(g) { return '<rect width="200" height="140" fill="#d9c3a0"/><rect width="200" height="140" fill="url(#pp-hatchL)" opacity=".5"/><rect x="8" y="8" width="184" height="124" fill="none" stroke="' + INK + '" stroke-width="1" stroke-dasharray="2 3" opacity=".6"/>' + g + '<rect width="200" height="140" fill="url(#pp-vig)"/>'; }
  CARD.ripetitore = function () {
    return gunBg('<g opacity=".25">' + revolverGun(86, 62, 34, 1.1) + '</g><g opacity=".45">' + revolverGun(96, 66, 34, 1.1) + '</g>' + revolverGun(106, 70, 34, 1.1) +
      '<path d="M40 30 H70M34 40 H64M44 50 H70" stroke="' + INK + '" stroke-width="1.6" stroke-linecap="round"/>' +
      '<g transform="translate(160,108)"><path d="M-4 -6 H8 Q14 0 8 6 H-4Z" fill="url(#pp-brass)" ' + K + '/></g><g transform="translate(140,116)"><path d="M-4 -6 H8 Q14 0 8 6 H-4Z" fill="url(#pp-brass)" ' + K + '/></g>');
  };
  CARD.revolver = function () { return gunBg(revolverGun(74, 66, 92, 1.05) + '<path d="M150 106 C170 100 180 112 168 120 C150 130 120 126 110 118" fill="none" stroke="#6b4423" stroke-width="4"/><path d="M150 106 C170 100 180 112 168 120" fill="none" stroke="#c4952f" stroke-width="1" stroke-dasharray="3 3"/>'); };
  CARD.schioppo = function () { return gunBg(longGun({ x: 14, y: 76, len: 164, double: true, fore: 120 })); };
  CARD.carabina = function () { return gunBg(longGun({ x: 14, y: 74, len: 170, lever: true, mag: true, fore: 132 })); };
  CARD.bisonte = function () {
    return gunBg(longGun({ x: 6, y: 86, len: 186, scope: true, fore: 140 }) +
      '<g transform="translate(150,40)" ' + K + ' stroke-width="1.5"><path d="M-14 -6 C-26 -10 -30 -2 -24 2 C-20 -2 -16 -2 -12 0Z" fill="#efe3c8"/><path d="M14 -6 C26 -10 30 -2 24 2 C20 -2 16 -2 12 0Z" fill="#efe3c8"/>' +
      '<path d="M-12 -6 C-12 -12 12 -12 12 -6 C14 4 8 20 0 24 C-8 20 -14 4 -12 -6Z" fill="#efe3c8"/><circle cx="-5" cy="2" r="2.6" fill="' + INK + '"/><circle cx="5" cy="2" r="2.6" fill="' + INK + '"/><path d="M-2 14 L0 18 L2 14"/></g>');
  };

  // ---------- Dorso della carta ----------
  function back() {
    var rays = ''; for (var i = 0; i < 24; i++) { var a = Math.PI * i / 12; rays += 'M100 140 L' + (100 + Math.cos(a) * 160).toFixed(1) + ' ' + (140 + Math.sin(a) * 160).toFixed(1); }
    return sv('0 0 200 280',
      '<rect width="200" height="280" fill="#6e2418"/><path d="' + rays + '" stroke="#5a1c12" stroke-width="7"/>' +
      '<rect x="10" y="10" width="180" height="260" rx="10" fill="none" stroke="#e4c27a" stroke-width="2.2"/>' +
      '<rect x="16" y="16" width="168" height="248" rx="7" fill="none" stroke="#e4c27a" stroke-width=".9" stroke-dasharray="3 3"/>' +
      '<g transform="translate(100,140) rotate(-35)"><rect x="-74" y="-4" width="148" height="8" rx="3" fill="#3a4349" stroke="#e4c27a" stroke-width="1"/></g><g transform="translate(100,140) rotate(35)"><rect x="-74" y="-4" width="148" height="8" rx="3" fill="#3a4349" stroke="#e4c27a" stroke-width="1"/></g>' +
      '<circle cx="100" cy="140" r="50" fill="#efe1c0" stroke="#e4c27a" stroke-width="3"/><circle cx="100" cy="140" r="43" fill="none" stroke="' + INK + '" stroke-width="1"/>' +
      '<text x="100" y="152" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="34" fill="#6e2418">P&amp;P</text>' +
      '<text x="100" y="56" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="17" fill="#e4c27a" letter-spacing="1.5">POLVERE</text>' +
      '<text x="100" y="236" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="17" fill="#e4c27a" letter-spacing="1.5">PIOMBO</text>' +
      '<path d="M40 70 H160M40 214 H160" stroke="#e4c27a" stroke-width="1"/>', 'art back-art');
  }

  // ---------- Ruoli ----------
  function star(cx, cy, R, r, n) { var p = []; for (var i = 0; i < n * 2; i++) { var a = -Math.PI / 2 + Math.PI * i / n, rr = i % 2 ? r : R; p.push((cx + Math.cos(a) * rr).toFixed(1) + ',' + (cy + Math.sin(a) * rr).toFixed(1)); } return p.join(' '); }
  var ROLEART = {
    sceriffo: function () {
      var tips = ''; for (var i = 0; i < 6; i++) { var a = -Math.PI / 2 + Math.PI * i / 3; tips += '<circle cx="' + (100 + Math.cos(a) * 52).toFixed(1) + '" cy="' + (78 + Math.sin(a) * 52).toFixed(1) + '" r="6" fill="url(#pp-brass)" ' + K + ' stroke-width="1.5"/>'; }
      return '<rect width="200" height="160" fill="#4a2f1c"/><rect width="200" height="160" fill="url(#pp-hatchL)"/>' +
        '<polygon points="' + star(100, 78, 54, 26, 6) + '" fill="url(#pp-brass)" ' + K + ' stroke-width="2"/>' + tips +
        '<circle cx="100" cy="78" r="24" fill="none" ' + K + ' stroke-width="1.4"/>' +
        '<text x="100" y="82" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="10" fill="#4a2f10">SCERIFFO</text>' +
        '<rect width="200" height="160" fill="url(#pp-vig)"/>';
    },
    vice: function () {
      return '<rect width="200" height="160" fill="#3d4a52"/><rect width="200" height="160" fill="url(#pp-hatchL)"/>' +
        '<path d="M100 22 L146 36 C148 80 132 116 100 136 C68 116 52 80 54 36 Z" fill="#cfd6d9" ' + K + ' stroke-width="2"/>' +
        '<path d="M100 30 L138 42 C139 80 126 108 100 126 C74 108 61 80 62 42 Z" fill="none" ' + K + ' stroke-width="1"/>' +
        '<polygon points="' + star(100, 76, 24, 11, 5) + '" fill="url(#pp-brass)" ' + K + ' stroke-width="1.5"/>' +
        '<text x="100" y="114" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="9" fill="' + INK + '">VICE</text>' +
        '<rect width="200" height="160" fill="url(#pp-vig)"/>';
    },
    bandito: function () {
      return '<rect width="200" height="160" fill="#efe1c0"/><rect width="200" height="160" fill="url(#pp-dots)"/>' +
        '<text x="100" y="30" text-anchor="middle" font-family="Sancreek, Georgia, serif" font-size="22" fill="' + INK + '" letter-spacing="2">TAGLIA</text>' +
        '<g ' + K + ' stroke-width="1.8"><ellipse cx="100" cy="58" rx="54" ry="9" fill="#2b1d12"/><path d="M72 58 C72 36 86 32 100 34 C114 32 128 36 128 58Z" fill="#2b1d12"/>' +
        '<path d="M70 66 C70 100 82 118 100 120 C118 118 130 100 130 66 Z" fill="#c99b74"/>' +
        '<path d="M66 84 Q100 76 134 84 L130 104 Q100 132 70 104 Z" fill="#8e2b1f"/><path d="M66 84 Q100 76 134 84 L130 104 Q100 132 70 104 Z" fill="url(#pp-dots)"/>' +
        '<path d="M80 72 Q86 68 92 72M108 72 Q114 68 120 72" fill="none" stroke-width="2.4"/></g>' +
        '<text x="100" y="148" text-anchor="middle" font-family="Courier Prime, Courier, monospace" font-size="12" font-weight="700" fill="#8e2b1f">$ 5.000</text>' +
        '<rect width="200" height="160" fill="url(#pp-vig)" opacity=".7"/>';
    },
    traditore: function () {
      return '<rect width="200" height="160" fill="#2e2a24"/><rect width="200" height="160" fill="url(#pp-hatchL)"/>' +
        '<g ' + K + ' stroke-width="1.8">' +
        '<circle cx="100" cy="76" r="44" fill="url(#pp-brass)"/><circle cx="100" cy="76" r="36" fill="none" stroke-width="1"/>' +
        '<path d="M100 32 V120" stroke-width="2"/>' +
        '<path d="M100 50 C82 50 74 64 76 78 C78 92 88 100 100 100Z" fill="#6f4f16"/>' +
        '<path d="M100 50 C118 50 126 64 124 78 C122 92 112 100 100 100Z" fill="#f6dc8a"/>' +
        '<path d="M80 68 L90 72M120 68 L110 72" stroke-width="2"/>' +
        '<path d="M86 88 Q92 84 98 88M102 86 Q108 92 114 86" fill="none"/>' +
        '<path d="M30 140 C50 128 70 150 90 138 C110 126 130 150 150 138 C160 132 168 134 172 138" fill="none" stroke="#8a7a3c" stroke-width="6"/>' +
        '<path d="M172 138 l10 -4 l-4 8Z" fill="#8a7a3c"/></g>' +
        '<rect width="200" height="160" fill="url(#pp-vig)"/>';
    }
  };

  // ---------- Ritratti dei personaggi (viewBox 200x220) ----------
  var SKIN = { a: ['#f0cfae', '#c99b74'], b: ['#e2b48c', '#b07d55'], c: ['#c68d62', '#94603a'], d: ['#a06a45', '#71452a'], e: ['#7a4c30', '#55331f'], f: ['#d9c7b4', '#a8968a'] };
  var LOOK = {
    thorne:   { skin: 'b', bg: 'dusk', hat: 'cowboy', hatC: '#7a5230', hair: 'short', hairC: '#6b5a48', mus: 'walrus', beard: 'stubble', fC: '#8e2b1f', coat: '#6e5a3c', collar: 'bandana', brow: 'heavy', age: 2, scar: false },
    faro:     { skin: 'a', bg: 'inside', hat: 'fascinator', hatC: '#2b1d12', hair: 'updo', hairC: '#3a2117', coat: '#5c1a2a', collar: 'choker', lips: '#a3333a', mole: true, fem: true, earring: true },
    dolly:    { skin: 'd', bg: 'day', hat: 'flat', hatC: '#9a7448', hair: 'braids', hairC: '#24170e', coat: '#8a6038', collar: 'vest', freckles: true, fem: true, lips: '#8a4a3a' },
    cascabel: { skin: 'c', bg: 'dusk', hat: 'gambler', hatC: '#3a3326', band: 'snake', hair: 'short', hairC: '#bdb3a4', beard: 'goatee', mus: 'thin', coat: '#4a4030', collar: 'bolo', brow: 'heavy', age: 3, scar: true },
    nate:     { skin: 'a', bg: 'inside', hat: 'bowler', hatC: '#3a3330', hair: 'short', hairC: '#7a4a24', mus: 'pencil', coat: '#5a5f3e', collar: 'checkvest', eyes: 'sly', toothpick: true },
    padre:    { skin: 'e', bg: 'day', hat: 'preacher', hatC: '#1f1a17', hair: 'short', hairC: '#d8d2c8', beard: 'mutton', coat: '#1f1a17', collar: 'clerical', age: 3, cross: true },
    hattie:   { skin: 'b', bg: 'day', hat: 'strap', hatC: '#a8875a', hair: 'bob', hairC: '#a85a2a', coat: '#4f5e52', collar: 'scarf', fC: '#c9a66b', freckles: true, fem: true, lips: '#a65a4a', bino: true },
    fortuna:  { skin: 'a', bg: 'inside', hat: 'tophat', hatC: '#24201d', hair: 'slick', hairC: '#2b1d12', mus: 'curled', coat: '#2f2a35', collar: 'cravat', fC: '#7a2a4a', monocle: true, cigar: true },
    wren:     { skin: 'f', bg: 'night', hat: 'low', hatC: '#4a4440', hair: 'long', hairC: '#c9c0b0', coat: '#5a5650', collar: 'mask', fC: '#7a7468', eyes: 'shadow' },
    gazza:    { skin: 'c', bg: 'day', hat: 'kerchief', hatC: '#6a5a8a', hair: 'gray', hairC: '#cfc8bc', coat: '#7a5a3a', collar: 'shawl', fem: true, specs: true, age: 3, feather: true, lips: '#8a5a4a' },
    maggie:   { skin: 'c', bg: 'dusk', hat: 'cowboy', hatC: '#4a3a2a', hair: 'longbraid', hairC: '#2a1a10', coat: '#9a7448', collar: 'fringe', fem: true, eyes: 'squint', lips: '#8a4a3a' },
    doc:      { skin: 'a', bg: 'inside', hat: 'none', hair: 'balding', hairC: '#d8d2c8', beard: 'full', beardC: '#d8d2c8', mus: 'walrus', coat: '#3e3a34', collar: 'bowtie', fC: '#2b1d12', specs: true, age: 3 },
    abner:    { skin: 'b', bg: 'night', hat: 'cowboyblack', hatC: '#1d1916', hair: 'short', hairC: '#1d1916', beard: 'stubble', coat: '#1d1916', collar: 'high', eyes: 'cold', scar: true, cigar: true },
    clem:     { skin: 'e', bg: 'inside', hat: 'headband', hatC: '#c0432f', hair: 'curls', hairC: '#1d130b', coat: '#a3333a', collar: 'lace', fem: true, earring: true, lips: '#7a2a2a', smile: true },
    crowe:    { skin: 'f', bg: 'night', hat: 'tallhat', hatC: '#141210', hair: 'sides', hairC: '#4a4440', coat: '#141210', collar: 'cravat', fC: '#141210', gaunt: true, age: 2 },
    lark:     { skin: 'b', bg: 'dusk', hat: 'pushed', hatC: '#b3864f', hair: 'messy', hairC: '#c48a3a', coat: '#7a3a2a', collar: 'bandana', fC: '#3d5a7a', freckles: true, smile: true, young: true }
  };
  function portrait(id) {
    var L = LOOK[id], sk = SKIN[L.skin], s = sk[0], sh = sk[1];
    var o = '';
    var bgf = { dusk: 'url(#pp-dusk)', day: 'url(#pp-day)', night: 'url(#pp-night)', inside: 'url(#pp-inside)' }[L.bg];
    o += '<rect width="200" height="220" fill="' + bgf + '"/>';
    if (L.bg === 'dusk' || L.bg === 'day') o += '<circle cx="152" cy="150" r="34" fill="url(#pp-sun)"/><path d="M0 170 L24 156 L44 156 L52 166 L92 166 L100 146 L132 146 L140 166 L176 166 L186 154 L200 154 V220 H0Z" fill="#8e4c33" opacity=".5"/>';
    if (L.bg === 'night') o += '<g fill="#fff8d8" opacity=".85"><circle cx="24" cy="30" r="1"/><circle cx="60" cy="18" r=".8"/><circle cx="170" cy="26" r="1.1"/><circle cx="150" cy="56" r=".7"/><circle cx="34" cy="70" r=".8"/></g><circle cx="164" cy="44" r="12" fill="#f3ead2" opacity=".85"/>';
    if (L.bg === 'inside') o += '<rect x="0" y="0" width="200" height="220" fill="url(#pp-hatchL)" opacity=".5"/><circle cx="30" cy="40" r="22" fill="url(#pp-sun)" opacity=".55"/>';
    var w = L.gaunt ? 0.9 : L.fem ? 0.94 : L.young ? 0.95 : 1;
    // capelli dietro
    if (L.hair === 'long' || L.hair === 'longbraid') o += '<path d="M62 100 C58 140 60 170 72 186 L128 186 C140 170 142 140 138 100 Z" fill="' + L.hairC + '" ' + K + ' stroke-width="1.6"/>';
    if (L.hair === 'curls') { var cs = ''; [[64, 96], [60, 116], [62, 138], [70, 156], [136, 96], [140, 116], [138, 138], [130, 156], [74, 76], [126, 76], [100, 62], [84, 64], [116, 64]].forEach(function (c) { cs += '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="13"/>'; }); o += '<g fill="' + L.hairC + '" ' + K + ' stroke-width="1.4">' + cs + '</g>'; }
    if (L.hair === 'updo') o += '<circle cx="100" cy="50" r="20" fill="' + L.hairC + '" ' + K + ' stroke-width="1.6"/>';
    // busto
    o += '<path d="M14 220 C18 196 34 184 62 178 L84 170 L116 170 L138 178 C166 184 182 196 186 220 Z" fill="' + L.coat + '" ' + K + ' stroke-width="1.8"/>';
    o += '<path d="M14 220 C18 196 34 184 62 178 L84 170 L100 220 Z" fill="url(#pp-hatchL)" opacity=".6"/>';
    if (!L.fem) o += '<path d="M84 172 L100 210 L116 172" fill="none" ' + K + ' stroke-width="1.6"/><path d="M62 180 L84 172 L96 204 Z" fill="' + L.coat + '" ' + K + ' stroke-width="1.4"/><path d="M138 180 L116 172 L104 204 Z" fill="' + L.coat + '" ' + K + ' stroke-width="1.4"/>';
    // collo
    o += '<path d="M86 138 L86 176 Q100 184 114 176 L114 138 Z" fill="' + s + '" ' + K + ' stroke-width="1.6"/><path d="M86 150 Q100 162 114 150 L114 164 Q100 170 86 164Z" fill="' + sh + '" opacity=".7"/>';
    // dettagli del colletto
    var c = L.collar;
    if (c === 'bandana') o += '<path d="M78 166 Q100 182 122 166 L116 186 Q100 200 84 186 Z" fill="' + L.fC + '" ' + K + ' stroke-width="1.6"/><path d="M92 186 L100 204 L108 186" fill="' + L.fC + '" ' + K + ' stroke-width="1.4"/><g fill="#efe1c0" opacity=".8"><circle cx="92" cy="178" r="1.4"/><circle cx="104" cy="182" r="1.4"/><circle cx="110" cy="174" r="1.4"/></g>';
    if (c === 'choker') o += '<path d="M86 160 Q100 166 114 160" fill="none" stroke="' + INK + '" stroke-width="4"/><circle cx="100" cy="166" r="3" fill="url(#pp-brass)"/><path d="M62 186 Q100 176 138 186 L134 220 H66Z" fill="' + L.coat + '" ' + K + ' stroke-width="1.4"/><path d="M66 186 Q100 196 134 186" fill="none" stroke="#efe1c0" stroke-width="3" stroke-dasharray="2 2"/><path d="M80 180 Q100 192 120 180 Q110 196 100 196 Q90 196 80 180Z" fill="' + s + '" ' + K + ' stroke-width="1"/>';
    if (c === 'vest') o += '<path d="M70 180 L90 178 L96 220 H66Z" fill="#5a3a20" ' + K + ' stroke-width="1.4"/><path d="M130 180 L110 178 L104 220 H134Z" fill="#5a3a20" ' + K + ' stroke-width="1.4"/><path d="M90 178 Q100 186 110 178 L104 220 H96Z" fill="#e8dcc4" ' + K + ' stroke-width="1.2"/>';
    if (c === 'bolo') o += '<path d="M90 176 L100 206 L110 176" fill="#e8dcc4" ' + K + ' stroke-width="1.2"/><path d="M96 180 L100 214M104 180 L100 214" stroke="' + INK + '" stroke-width="1.2"/><ellipse cx="100" cy="190" rx="6" ry="8" fill="url(#pp-snake)" ' + K + ' stroke-width="1.2"/>';
    if (c === 'checkvest') o += '<path d="M88 176 L100 206 L112 176" fill="#e8dcc4" ' + K + ' stroke-width="1.2"/><path d="M68 182 L88 176 L98 220 H66Z" fill="url(#pp-check)" ' + K + ' stroke-width="1.2"/><path d="M132 182 L112 176 L102 220 H134Z" fill="url(#pp-check)" ' + K + ' stroke-width="1.2"/><path d="M100 196 Q112 200 118 196" fill="none" stroke="#c4952f" stroke-width="1.4"/>';
    if (c === 'clerical') o += '<path d="M86 170 Q100 178 114 170 L114 178 Q100 186 86 178Z" fill="#f4efe4" ' + K + ' stroke-width="1.2"/><rect x="96" y="172" width="8" height="7" fill="#f4efe4" ' + K + ' stroke-width="1"/>';
    if (c === 'scarf') o += '<path d="M80 168 Q100 180 120 168 L122 182 Q100 194 78 182 Z" fill="' + L.fC + '" ' + K + ' stroke-width="1.4"/><path d="M110 182 L116 210 L106 210 L104 186" fill="' + L.fC + '" ' + K + ' stroke-width="1.2"/>';
    if (c === 'cravat') o += '<path d="M90 176 L100 200 L110 176" fill="#e8dcc4" ' + K + ' stroke-width="1.2"/><path d="M92 176 Q100 184 108 176 L104 196 Q100 200 96 196 Z" fill="' + L.fC + '" ' + K + ' stroke-width="1.2"/><circle cx="100" cy="186" r="2" fill="url(#pp-brass)"/>';
    if (c === 'shawl') o += '<path d="M40 196 C60 176 80 172 100 186 C120 172 140 176 160 196 L170 220 H30Z" fill="#7a6a8a" ' + K + ' stroke-width="1.4"/><path d="M50 200 L60 220M70 192 L76 220M130 192 L124 220M150 200 L140 220" stroke="' + INK + '" stroke-width="1" opacity=".6"/>';
    if (c === 'fringe') o += '<path d="M40 196 Q60 186 82 184 M160 196 Q140 186 118 184" fill="none" ' + K + ' stroke-width="1.4"/><path d="M42 198 l-2 10 M50 194 l-2 10 M58 191 l-2 10 M66 189 l-1 10 M74 187 l-1 10 M158 198 l2 10 M150 194 l2 10 M142 191 l2 10 M134 189 l1 10 M126 187 l1 10" stroke="' + INK + '" stroke-width="1.4"/><path d="M84 174 Q100 182 116 174 L112 188 Q100 194 88 188Z" fill="#e8dcc4" ' + K + ' stroke-width="1.2"/>';
    if (c === 'bowtie') o += '<path d="M88 176 L100 206 L112 176" fill="#f4efe4" ' + K + ' stroke-width="1.2"/><path d="M88 176 L100 182 L88 188Z M112 176 L100 182 L112 188Z" fill="' + L.fC + '" ' + K + ' stroke-width="1.2"/><circle cx="100" cy="182" r="2.2" fill="' + L.fC + '"/>';
    if (c === 'high') o += '<path d="M80 160 L86 182 L100 170 L114 182 L120 160" fill="' + L.coat + '" ' + K + ' stroke-width="1.6"/>';
    if (c === 'lace') o += '<path d="M60 190 Q100 176 140 190 L136 220 H64Z" fill="' + L.coat + '" ' + K + ' stroke-width="1.4"/><path d="M62 190 Q100 200 138 190" fill="none" stroke="#f4efe4" stroke-width="3.4" stroke-dasharray="3 2"/><path d="M76 178 Q100 196 124 178 Q110 196 100 196 Q90 196 76 178Z" fill="' + s + '" ' + K + ' stroke-width="1"/><path d="M86 160 Q100 166 114 160" fill="none" stroke="url(#pp-brass)" stroke-width="2.4"/>';
    if (c === 'mask') o += '';
    if (L.cross) o += '<path d="M100 186 V206 M93 192 H107" stroke="url(#pp-brass)" stroke-width="3.2" stroke-linecap="round"/>';
    if (L.bino) o += '<path d="M70 178 Q86 196 92 200" fill="none" stroke="' + INK + '" stroke-width="1.4"/><g ' + K + ' stroke-width="1.4"><rect x="88" y="196" width="10" height="16" rx="3" fill="url(#pp-brass)"/><rect x="100" y="196" width="10" height="16" rx="3" fill="url(#pp-brass)"/></g>';
    // orecchie
    o += '<ellipse cx="' + (100 - 37 * w) + '" cy="110" rx="6" ry="11" fill="' + s + '" ' + K + ' stroke-width="1.5"/><ellipse cx="' + (100 + 37 * w) + '" cy="110" rx="6" ry="11" fill="' + s + '" ' + K + ' stroke-width="1.5"/>';
    if (L.earring) o += '<circle cx="' + (100 - 37 * w) + '" cy="124" r="3.2" fill="url(#pp-brass)" ' + K + ' stroke-width=".8"/><circle cx="' + (100 + 37 * w) + '" cy="124" r="3.2" fill="url(#pp-brass)" ' + K + ' stroke-width=".8"/>';
    // viso
    var fx = function (x) { return (100 + (x - 100) * w).toFixed(1); };
    var jaw = L.fem ? 'C' + fx(122) + ',156 ' + fx(110) + ',160 100,161 C' + fx(90) + ',160 ' + fx(78) + ',156 ' + fx(70) + ',134' : 'C' + fx(126) + ',152 ' + fx(116) + ',160 100,161 C' + fx(84) + ',160 ' + fx(74) + ',152 ' + fx(68) + ',134';
    if (L.gaunt) jaw = 'C' + fx(122) + ',156 ' + fx(112) + ',164 100,165 C' + fx(88) + ',164 ' + fx(78) + ',156 ' + fx(70) + ',134';
    var face = 'M100,64 C' + fx(126) + ',64 ' + fx(137) + ',84 ' + fx(137) + ',106 C' + fx(137) + ',118 ' + fx(134) + ',128 ' + fx(130) + ',134 ' + jaw + ' C' + fx(66) + ',128 ' + fx(63) + ',118 ' + fx(63) + ',106 C' + fx(63) + ',84 ' + fx(74) + ',64 100,64 Z';
    o += '<path d="' + face + '" fill="' + s + '" ' + K + ' stroke-width="1.8"/>';
    // ombra laterale (luce da sinistra)
    o += '<path d="M' + fx(124) + ',70 C' + fx(136) + ',84 ' + fx(137) + ',106 ' + fx(133) + ',126 C' + fx(128) + ',146 ' + fx(116) + ',158 ' + fx(104) + ',161 C' + fx(118) + ',146 ' + fx(126) + ',120 ' + fx(124) + ',70 Z" fill="' + sh + '" opacity=".75"/>';
    o += '<path d="M' + fx(124) + ',70 C' + fx(136) + ',84 ' + fx(137) + ',106 ' + fx(133) + ',126 C' + fx(128) + ',146 ' + fx(116) + ',158 ' + fx(104) + ',161 C' + fx(118) + ',146 ' + fx(126) + ',120 ' + fx(124) + ',70 Z" fill="url(#pp-hatchL)"/>';
    if (L.gaunt) o += '<path d="M76 122 Q80 136 86 142M124 122 Q120 136 114 142" fill="none" stroke="' + sh + '" stroke-width="5" opacity=".7"/>';
    if (L.age >= 2) o += '<path d="M82 88 Q100 84 118 88M84 93 Q100 90 116 93" fill="none" stroke="' + INK + '" stroke-width=".8" opacity=".5"/><path d="M80 120 Q82 128 86 132M120 120 Q118 128 114 132" fill="none" stroke="' + INK + '" stroke-width="1" opacity=".55"/>';
    if (L.age >= 3) o += '<path d="M76 102 l-5 -2 M76 106 l-6 0 M124 102 l5 -2 M124 106 l6 0" stroke="' + INK + '" stroke-width=".8" opacity=".6"/>';
    // occhi
    function eye(x, flip) {
      x = +x; var e = '';
      if (L.eyes === 'shadow') return '<ellipse cx="' + x + '" cy="104" rx="7" ry="3.2" fill="#1d130b" opacity=".9"/><circle cx="' + (x + 1) + '" cy="104" r="1.2" fill="#e8f0f0"/>';
      var squint = L.eyes === 'squint' && flip > 0, sly = L.eyes === 'sly', cold = L.eyes === 'cold';
      var ry = squint ? 1.2 : sly ? 2.6 : 3.6;
      e += '<path d="M' + (x - 7) + ' 104 Q' + x + ' ' + (104 - ry * 1.4) + ' ' + (x + 7) + ' 104 Q' + x + ' ' + (104 + ry) + ' ' + (x - 7) + ' 104Z" fill="#f6f0e2" ' + K + ' stroke-width="1.2"/>';
      if (!squint) e += '<circle cx="' + (x + (sly ? 2 : 0.5)) + '" cy="104" r="' + (sly ? 2.4 : 3) + '" fill="' + (cold ? '#6f8a96' : '#4a3020') + '"/><circle cx="' + (x + (sly ? 2 : 0.5)) + '" cy="104" r="1.3" fill="#120c07"/><circle cx="' + (x - 0.6) + '" cy="102.8" r=".8" fill="#fff"/>';
      e += '<path d="M' + (x - 7.5) + ' ' + (sly ? 102.5 : 103) + ' Q' + x + ' ' + (104 - ry * 1.6 - (sly ? 0 : 0.5)) + ' ' + (x + 7.5) + ' 103" fill="none" stroke="' + INK + '" stroke-width="' + (L.fem ? 2.2 : 1.6) + '"/>';
      if (L.fem) e += '<path d="M' + (x + 6 * flip) + ' 101.5 l' + (3 * flip) + ' -2" stroke="' + INK + '" stroke-width="1.2"/>';
      return e;
    }
    o += eye(fx(86), -1) + eye(fx(114), 1);
    // sopracciglia
    var bw = L.brow === 'heavy' ? 3.2 : L.fem ? 1.6 : 2.2, bc = L.hairC === '#d8d2c8' || L.hairC === '#cfc8bc' || L.hairC === '#bdb3a4' || L.hairC === '#c9c0b0' ? '#8a8276' : L.hairC;
    var bt = L.eyes === 'cold' ? 'M78 96 L94 99M106 99 L122 96' : L.eyes === 'sly' ? 'M78 96 Q86 92 94 96M106 94 Q114 90 122 95' : 'M78 96 Q86 91 94 95M106 95 Q114 91 122 96';
    o += '<path d="' + bt + '" fill="none" stroke="' + bc + '" stroke-width="' + bw + '" stroke-linecap="round"/>';
    // naso
    o += '<path d="M100 104 C99 112 95 118 95 122 Q99 126 104 123" fill="none" ' + K + ' stroke-width="1.5"/><path d="M101 108 C102 114 106 118 104 123" fill="' + sh + '" opacity=".5"/>';
    // bocca
    var mouth = L.smile ? 'M88 136 Q100 146 112 136 Q100 141 88 136Z' : 'M89 138 Q100 141 111 138';
    o += L.lips ? '<path d="M89 137 Q94 134 100 136 Q106 134 111 137 Q100 145 89 137Z" fill="' + L.lips + '" ' + K + ' stroke-width="1"/>' : '';
    if (!L.lips) o += '<path d="' + mouth + '" fill="' + (L.smile ? '#f4efe4' : 'none') + '" ' + K + ' stroke-width="1.6"/>';
    if (L.smile && L.lips) o += '<path d="M90 138 Q100 143 110 138" fill="none" stroke="#f4efe4" stroke-width="1.2"/>';
    if (L.freckles) o += '<g fill="' + sh + '">' + [[82, 114], [86, 117], [90, 114], [110, 114], [114, 117], [118, 114], [96, 112], [104, 112]].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1"/>'; }).join('') + '</g>';
    if (L.mole) o += '<circle cx="116" cy="128" r="1.4" fill="' + INK + '"/>';
    if (L.scar) o += '<path d="M116 92 L124 124" stroke="#8e3b2f" stroke-width="2.2" stroke-linecap="round"/><path d="M118 100 l4 -1 M120 108 l4 -1 M122 116 l4 -1" stroke="#8e3b2f" stroke-width="1"/>';
    // barba e baffi
    var bC = L.beardC || L.hairC;
    if (L.beard === 'stubble') o += '<path d="M72 128 C78 152 92 160 100 161 C108 160 122 152 128 128 C120 140 110 146 100 146 C90 146 80 140 72 128Z" fill="url(#pp-dots)"/><path d="M72 128 C78 152 92 160 100 161 C108 160 122 152 128 128 C120 140 110 146 100 146 C90 146 80 140 72 128Z" fill="url(#pp-dots)"/>';
    if (L.beard === 'goatee') o += '<path d="M90 144 Q100 150 110 144 L106 162 Q100 168 94 162 Z" fill="' + bC + '" ' + K + ' stroke-width="1.2"/>';
    if (L.beard === 'mutton') o += '<path d="M64 100 C64 124 70 140 84 144 Q92 132 88 122 C80 120 74 112 72 100Z M136 100 C136 124 130 140 116 144 Q108 132 112 122 C120 120 126 112 128 100Z" fill="' + bC + '" ' + K + ' stroke-width="1.2"/>';
    if (L.beard === 'full') o += '<path d="M66 112 C66 150 84 176 100 178 C116 176 134 150 134 112 C128 132 118 140 112 140 Q100 134 88 140 C82 140 72 132 66 112Z" fill="' + bC + '" ' + K + ' stroke-width="1.4"/><path d="M84 150 Q86 162 90 168M100 150 V172M116 150 Q114 162 110 168" stroke="' + INK + '" stroke-width=".8" opacity=".5" fill="none"/>';
    if (L.mus === 'walrus') o += '<path d="M84 136 C84 126 94 124 100 128 C106 124 116 126 116 136 C112 132 106 132 100 134 C94 132 88 132 84 136Z" fill="' + bC + '" ' + K + ' stroke-width="1.2"/>';
    if (L.mus === 'thin') o += '<path d="M88 132 Q100 126 112 132" fill="none" stroke="' + bC + '" stroke-width="3"/>';
    if (L.mus === 'pencil') o += '<path d="M90 131 Q100 128 110 131" fill="none" stroke="' + bC + '" stroke-width="1.8"/>';
    if (L.mus === 'curled') o += '<path d="M100 130 C94 126 86 128 82 132 C80 128 84 124 86 126 M100 130 C106 126 114 128 118 132 C120 128 116 124 114 126" fill="none" stroke="' + bC + '" stroke-width="2.6"/>';
    if (L.collar === 'mask') o += '<path d="M66 116 Q100 108 134 116 L132 150 Q100 182 68 150 Z" fill="' + L.fC + '" ' + K + ' stroke-width="1.6"/><path d="M70 128 Q100 122 130 128M76 142 Q100 138 124 142" fill="none" stroke="' + INK + '" stroke-width=".8" opacity=".5"/><path d="M68 150 Q100 182 132 150 L136 176 Q100 196 64 176Z" fill="' + L.fC + '" ' + K + ' stroke-width="1.4"/>';
    // capelli davanti
    var H = L.hair, hc = L.hairC;
    if (H === 'short') o += '<path d="M64 98 C62 74 78 60 100 60 C122 60 138 74 136 98 C130 84 124 78 116 76 C104 74 92 76 84 78 C74 82 68 88 64 98Z" fill="' + hc + '" ' + K + ' stroke-width="1.4"/>';
    if (H === 'slick') o += '<path d="M64 96 C62 70 80 58 100 58 C122 58 138 72 136 96 C132 80 120 72 102 74 L98 66 L94 74 C80 74 68 82 64 96Z" fill="' + hc + '" ' + K + ' stroke-width="1.4"/>';
    if (H === 'messy') o += '<path d="M62 100 L66 80 L60 76 L72 70 L70 60 L84 64 L88 52 L98 62 L108 50 L114 62 L128 56 L126 68 L140 70 L132 80 L138 98 C130 86 120 80 100 80 C82 80 70 86 62 100Z" fill="' + hc + '" ' + K + ' stroke-width="1.4"/>';
    if (H === 'balding') o += '<path d="M63 108 C62 96 66 88 72 84 C70 96 72 104 74 112Z M137 108 C138 96 134 88 128 84 C130 96 128 104 126 112Z" fill="' + hc + '" ' + K + ' stroke-width="1.2"/><path d="M84 70 Q100 64 116 70" fill="none" stroke="' + sh + '" stroke-width="1.6" opacity=".6"/>';
    if (H === 'sides') o += '<path d="M63 112 C62 98 66 90 70 86 L74 128 C68 126 64 120 63 112Z M137 112 C138 98 134 90 130 86 L126 128 C132 126 136 120 137 112Z" fill="' + hc + '" ' + K + ' stroke-width="1.2"/>';
    if (H === 'updo' || H === 'bob' || H === 'braids' || H === 'gray' || H === 'curls' || H === 'longbraid' || H === 'long') {
      o += '<path d="M62 112 C58 80 76 60 100 60 C124 60 142 80 138 112 C134 96 128 86 118 80 C108 88 92 90 78 84 C70 92 64 100 62 112Z" fill="' + hc + '" ' + K + ' stroke-width="1.4"/>';
      o += '<path d="M78 84 C88 76 100 74 112 76M86 88 C94 82 104 80 116 80" fill="none" stroke="' + INK + '" stroke-width=".8" opacity=".5"/>';
    }
    if (H === 'bob') o += '<path d="M62 106 C60 124 64 138 74 142 L76 112Z M138 106 C140 124 136 138 126 142 L124 112Z" fill="' + hc + '" ' + K + ' stroke-width="1.4"/>';
    if (H === 'braids') o += '<g fill="' + hc + '" ' + K + ' stroke-width="1.2">' + [0, 1, 2, 3, 4].map(function (i) { return '<ellipse cx="66" cy="' + (124 + i * 12) + '" rx="6" ry="7"/><ellipse cx="134" cy="' + (124 + i * 12) + '" rx="6" ry="7"/>'; }).join('') + '</g><path d="M60 182 h12 M128 182 h12" stroke="#c0432f" stroke-width="4"/>';
    if (H === 'longbraid') o += '<g fill="' + hc + '" ' + K + ' stroke-width="1.2">' + [0, 1, 2, 3, 4, 5].map(function (i) { return '<ellipse cx="' + (136 + i * 2) + '" cy="' + (126 + i * 13) + '" rx="7" ry="8"/>'; }).join('') + '</g>';
    if (H === 'gray') o += '<path d="M64 108 C62 124 66 132 72 134 L74 110Z M136 108 C138 124 134 132 128 134 L126 110Z" fill="' + hc + '" ' + K + ' stroke-width="1.2"/>';
    // cappelli
    var hcol = L.hatC, h = L.hat, hat = '';
    function brim(cy, rx, ry, tilt) { return '<g transform="rotate(' + (tilt || 0) + ' 100 ' + cy + ')"><ellipse cx="100" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><ellipse cx="100" cy="' + cy + '" rx="' + rx + '" ry="' + ry + '" fill="url(#pp-hatchL)"/></g>'; }
    if (h === 'cowboy' || h === 'cowboyblack' || h === 'low' || h === 'pushed' || h === 'strap') {
      var cy = h === 'low' ? 84 : h === 'pushed' ? 64 : 74, tilt = h === 'pushed' ? -8 : h === 'low' ? 4 : -3;
      hat += brim(cy, h === 'strap' ? 64 : 66, 13, tilt);
      hat += '<g transform="rotate(' + tilt + ' 100 ' + cy + ')"><path d="M66 ' + cy + ' C64 ' + (cy - 30) + ' 76 ' + (cy - 44) + ' 92 ' + (cy - 40) + ' Q100 ' + (cy - 32) + ' 108 ' + (cy - 40) + ' C124 ' + (cy - 44) + ' 136 ' + (cy - 30) + ' 134 ' + cy + ' Z" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/>' +
        '<path d="M66 ' + cy + ' C64 ' + (cy - 30) + ' 76 ' + (cy - 44) + ' 92 ' + (cy - 40) + ' Q100 ' + (cy - 32) + ' 108 ' + (cy - 40) + ' C124 ' + (cy - 44) + ' 136 ' + (cy - 30) + ' 134 ' + cy + ' Z" fill="url(#pp-hatchL)"/>' +
        '<path d="M92 ' + (cy - 38) + ' Q100 ' + (cy - 24) + ' 108 ' + (cy - 38) + '" fill="none" ' + K + ' stroke-width="1.2"/>' +
        '<path d="M66 ' + (cy - 8) + ' Q100 ' + (cy - 2) + ' 134 ' + (cy - 8) + ' L134 ' + (cy - 1) + ' Q100 ' + (cy + 5) + ' 66 ' + (cy - 1) + 'Z" fill="' + (h === 'cowboyblack' ? '#5e6a72' : '#3a2516') + '" ' + K + ' stroke-width="1"/>' +
        (h === 'cowboyblack' ? '<circle cx="76" cy="' + (cy - 4) + '" r="2.4" fill="#cfd6d9"/><circle cx="86" cy="' + (cy - 3) + '" r="2.4" fill="#cfd6d9"/>' : '') + '</g>';
      if (h === 'strap') hat += '<path d="M66 82 C68 120 80 150 92 162M134 82 C132 120 120 150 108 162" fill="none" stroke="#5a3a20" stroke-width="1.4"/>';
      if (h === 'low') hat += '<path d="M64 92 C80 100 120 100 136 92 L136 104 C120 110 80 110 64 104Z" fill="#1d130b" opacity=".55"/>';
    }
    if (h === 'flat') hat += brim(70, 54, 9, 6) + '<g transform="rotate(6 100 70)"><path d="M72 70 L74 46 H126 L128 70Z" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M73 62 H127 V68 H73Z" fill="#5a3a20"/></g>';
    if (h === 'gambler') hat += brim(72, 62, 10, 0) + '<path d="M74 72 L76 44 Q100 38 124 44 L126 72Z" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M75 62 Q100 58 125 62 L126 70 Q100 66 74 70Z" fill="url(#pp-snake)" ' + K + ' stroke-width="1"/>';
    if (h === 'bowler') hat += '<ellipse cx="100" cy="74" rx="44" ry="7" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M70 74 C68 44 84 36 100 36 C116 36 132 44 130 74Z" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M70 74 C68 44 84 36 100 36 C116 36 132 44 130 74Z" fill="url(#pp-hatchL)"/><path d="M70 66 Q100 70 130 66 L130 73 Q100 77 70 73Z" fill="#1d1916"/>';
    if (h === 'preacher') hat += '<ellipse cx="100" cy="72" rx="70" ry="11" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M72 72 C72 52 82 46 100 46 C118 46 128 52 128 72Z" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M72 64 Q100 68 128 64 L128 70 Q100 74 72 70Z" fill="#3a3330"/>';
    if (h === 'tophat' || h === 'tallhat') {
      var top = h === 'tallhat' ? 6 : 20;
      hat += '<ellipse cx="100" cy="72" rx="46" ry="8" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M74 72 L76 ' + top + ' H124 L126 72Z" fill="' + hcol + '" ' + K + ' stroke-width="1.8"/><path d="M74 72 L76 ' + top + ' H124 L126 72Z" fill="url(#pp-hatchL)"/><ellipse cx="100" cy="' + top + '" rx="24" ry="4" fill="' + hcol + '" ' + K + ' stroke-width="1.4"/>' +
        '<path d="M75 58 H125 V68 H75Z" fill="' + (h === 'tallhat' ? '#3a3330' : '#7a2a4a') + '"/>' + (h === 'tallhat' ? '<path d="M122 60 C134 70 136 96 130 120" fill="none" stroke="#3a3330" stroke-width="4"/>' : '');
    }
    if (h === 'fascinator') hat += '<g transform="translate(118,62) rotate(20)"><ellipse cx="0" cy="0" rx="14" ry="6" fill="' + hcol + '" ' + K + ' stroke-width="1.4"/><path d="M4 -4 C20 -30 34 -40 44 -42 C36 -30 22 -14 8 -2Z" fill="#efe1c0" ' + K + ' stroke-width="1.2"/><path d="M8 -4 L40 -38" stroke="' + INK + '" stroke-width=".8"/><circle cx="-6" cy="0" r="3" fill="#a3333a"/></g>';
    if (h === 'kerchief') hat += '<path d="M60 104 C56 70 76 54 100 54 C124 54 144 70 140 104 C134 86 122 78 100 78 C78 78 66 86 60 104Z" fill="' + hcol + '" ' + K + ' stroke-width="1.6"/><path d="M60 104 C56 70 76 54 100 54 C124 54 144 70 140 104 C134 86 122 78 100 78 C78 78 66 86 60 104Z" fill="url(#pp-dots)"/>';
    if (h === 'headband') hat += '<path d="M66 84 Q100 72 134 84 L134 92 Q100 80 66 92Z" fill="' + hcol + '" ' + K + ' stroke-width="1.2"/><g transform="translate(126,78) rotate(24)"><path d="M0 0 C-4 -20 2 -36 10 -46 C14 -30 10 -14 4 0Z" fill="#efe1c0" ' + K + ' stroke-width="1.1"/><path d="M4 0 L9 -42" stroke="' + INK + '" stroke-width=".7"/></g><circle cx="124" cy="82" r="4" fill="url(#pp-brass)" ' + K + ' stroke-width=".8"/>';
    o += hat;
    if (L.feather) o += '<g transform="translate(70,62) rotate(-30)"><path d="M0 0 C-4 -16 0 -30 8 -38 C12 -24 8 -10 3 0Z" fill="#1d1916" ' + K + ' stroke-width="1"/><path d="M2 -16 C4 -24 6 -28 8 -32" stroke="#4a6a8a" stroke-width="2"/></g>';
    // accessori
    if (L.specs) o += '<g fill="none" ' + K + ' stroke-width="1.5"><circle cx="' + fx(86) + '" cy="104" r="9"/><circle cx="' + fx(114) + '" cy="104" r="9"/><path d="M' + (+fx(86) + 9) + ' 103 Q100 100 ' + (+fx(114) - 9) + ' 103"/></g><g fill="#fff" opacity=".35"><circle cx="' + (+fx(86) - 3) + '" cy="101" r="3"/><circle cx="' + (+fx(114) - 3) + '" cy="101" r="3"/></g>';
    if (L.monocle) o += '<circle cx="' + fx(114) + '" cy="104" r="9.5" fill="#fff" fill-opacity=".18" stroke="url(#pp-brass)" stroke-width="2"/><path d="M' + (+fx(114) + 6) + ' 112 C126 130 126 150 120 170" fill="none" stroke="url(#pp-brass)" stroke-width="1"/>';
    if (L.cigar) o += '<g transform="translate(108,140) rotate(14)"><rect x="0" y="-2.5" width="24" height="5" rx="2" fill="#6b4423" ' + K + ' stroke-width="1"/><rect x="22" y="-2.5" width="4" height="5" fill="#c9b49a"/></g><path d="M134 140 C140 130 132 124 140 114 C146 106 140 100 146 92" fill="none" stroke="#efe6d4" stroke-width="2" opacity=".55"/>';
    if (L.toothpick) o += '<path d="M106 138 L124 132" stroke="#d9c49a" stroke-width="1.6" stroke-linecap="round"/>';
    o += '<rect width="200" height="220" fill="url(#pp-vig)"/>';
    return o;
  }

  return {
    DEFS: DEFS,
    card: function (t) { return sv('0 0 200 140', CARD[t] ? CARD[t]() : '').replace('<svg ', '<svg preserveAspectRatio="xMidYMid slice" '); },
    portrait: function (id) { return sv('0 0 200 220', portrait(id), 'art portrait'); },
    role: function (r) { return sv('0 0 200 160', ROLEART[r](), 'art role-art'); },
    back: back
  };
})();
