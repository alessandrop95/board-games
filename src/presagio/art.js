/* ===== Presagio: carte disegnate in SVG (100×140) ===== */
var PRArt = (function () {
  var INK = '#1b1a2e', IVORY = '#f5eedb', GOLD = '#d8b25a';
  var SUITCOL = ['#b8402c', '#2a64a0', '#2f7d45', '#b7861f'];
  var SUITDARK = ['#7a2618', '#183f68', '#1b4e2a', '#7a5710'];

  // Emblemi delle quattro casate, centrati in (0,0), raggio ~ 1 unità × scala
  function emblem(s, x, y, r, col) {
    var t = 'translate(' + x + ',' + y + ') scale(' + r / 10 + ')', c = col || SUITCOL[s], d = SUITDARK[s];
    if (s === 0) return '<g transform="' + t + '"><path d="M0 -10 C4 -5 9 -2 8 4 C7.4 8.6 4 10 0 10 C-4 10 -7.4 8.6 -8 4 C-8.6 -1 -5 -3 -4 -7 C-2 -4 -1.5 -2.5 -1 -1 C0 -4 0 -7 0 -10 Z" fill="' + c + '" stroke="' + d + '" stroke-width=".9"/><path d="M0 2 C2 4 3 5.5 2.6 7.4 C2.2 8.8 1.2 9.3 0 9.3 C-1.6 9.3 -2.8 8.4 -2.8 6.8 C-2.8 5 -1 4 0 2Z" fill="#f6d27a"/></g>';
    if (s === 1) return '<g transform="' + t + '"><path d="M-10 2 C-7 -3 -3 -3 0 0 C3 3 7 3 10 -2 L10 4 C7 9 3 9 0 6 C-3 3 -7 3 -10 8 Z" fill="' + c + '" stroke="' + d + '" stroke-width=".9"/><path d="M-10 -6 C-7 -10 -3 -10 0 -7 C3 -4 7 -4 10 -9" fill="none" stroke="' + c + '" stroke-width="2.2" stroke-linecap="round"/></g>';
    if (s === 2) return '<g transform="' + t + '"><path d="M0 -10 C7 -6 9 1 5 6 C3 8.4 1.4 9 0 9.4 C-1.4 9 -3 8.4 -5 6 C-9 1 -7 -6 0 -10 Z" fill="' + c + '" stroke="' + d + '" stroke-width=".9"/><path d="M0 -7 V10.5 M0 -2 L4 -5 M0 2 L-4.4 -1.4 M0 5 L4 2.4" fill="none" stroke="' + d + '" stroke-width="1" stroke-linecap="round"/></g>';
    return '<g transform="' + t + '"><path d="M-7 -10 H7 M-7 10 H7" stroke="' + d + '" stroke-width="1.6" stroke-linecap="round"/><path d="M-6 -9 C-6 -3 -1.4 -2 -1 0 C-1.4 2 -6 3 -6 9 H6 C6 3 1.4 2 1 0 C1.4 -2 6 -3 6 -9 Z" fill="#f3e3b8" stroke="' + d + '" stroke-width=".9"/><path d="M-3.6 -6 H3.6 L0.6 -1 H-0.6 Z M-5 8.4 C-4 5 -1 4 0 2 C1 4 4 5 5 8.4 Z" fill="' + c + '"/></g>';
  }
  function stars(seed, n, w, h, col) {
    var o = '', x = seed;
    for (var i = 0; i < n; i++) { x = (x * 9301 + 49297) % 233280; var a = x / 233280; x = (x * 9301 + 49297) % 233280; var b = x / 233280; x = (x * 9301 + 49297) % 233280; var r = 0.3 + (x / 233280) * 0.9;
      o += '<circle cx="' + (a * w).toFixed(1) + '" cy="' + (b * h).toFixed(1) + '" r="' + r.toFixed(2) + '" fill="' + (col || '#fff6d8') + '"/>'; }
    return o;
  }
  function frame(col) {
    return '<rect x="1" y="1" width="98" height="138" rx="8" fill="' + IVORY + '"/>' +
      '<rect x="4.5" y="4.5" width="91" height="131" rx="5.5" fill="none" stroke="' + col + '" stroke-width="1.4"/>' +
      '<rect x="7" y="7" width="86" height="126" rx="4" fill="none" stroke="' + col + '" stroke-width=".5" stroke-dasharray="1.2 1.6"/>';
  }
  function corner(label, s, col) {
    var em = s == null ? '' : emblem(s, 13, 30, 4.6);
    var tx = '<text x="13" y="21" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="' + (label.length > 1 ? 12 : 14) + '" fill="' + col + '">' + label + '</text>';
    return '<g>' + tx + em + '</g><g transform="rotate(180 50 70)">' + tx + em + '</g>';
  }

  function numbered(s, v) {
    var col = SUITCOL[s], dark = SUITDARK[s], o = frame(col);
    o += '<circle cx="50" cy="70" r="31" fill="' + col + '" fill-opacity=".09" stroke="' + col + '" stroke-opacity=".35" stroke-width=".8"/>';
    // anello di piccoli emblemi, uno per valore
    for (var i = 0; i < v; i++) {
      var a = -Math.PI / 2 + i * 2 * Math.PI / v;
      o += emblem(s, 50 + Math.cos(a) * 25, 70 + Math.sin(a) * 25, v > 9 ? 2.7 : 3.2);
    }
    o += '<text x="50" y="80" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="28" fill="' + dark + '">' + v + '</text>';
    o += corner(String(v), s, dark);
    return o;
  }
  function arcimago() {
    var o = '<rect x="1" y="1" width="98" height="138" rx="8" fill="#191935"/>' +
      '<rect x="1" y="1" width="98" height="138" rx="8" fill="url(#pr-night)"/>' + stars(17, 38, 100, 140) +
      '<rect x="4.5" y="4.5" width="91" height="131" rx="5.5" fill="none" stroke="' + GOLD + '" stroke-width="1.4"/>';
    o += '<circle cx="50" cy="60" r="34" fill="url(#pr-halo)"/>';
    // figura incappucciata
    o += '<path d="M50 30 C42 38 36 56 34 74 C31 96 28 112 24 124 H76 C72 112 69 96 66 74 C64 56 58 38 50 30 Z" fill="#33306b" stroke="' + GOLD + '" stroke-width="1"/>';
    o += '<path d="M50 30 C46 40 44 50 44 58 C46 62 54 62 56 58 C56 50 54 40 50 30 Z" fill="#0d0c1e"/>';
    o += '<circle cx="47.6" cy="55" r="1" fill="#f6d27a"/><circle cx="52.4" cy="55" r="1" fill="#f6d27a"/>';
    o += '<path d="M38 96 Q50 100 62 96" fill="none" stroke="' + GOLD + '" stroke-width=".8"/><path d="M36 106 Q50 110 64 106" fill="none" stroke="' + GOLD + '" stroke-width=".8"/>';
    o += '<g fill="' + GOLD + '"><circle cx="44" cy="84" r=".9"/><circle cx="56" cy="88" r=".9"/><circle cx="48" cy="114" r=".9"/><circle cx="58" cy="102" r=".9"/></g>';
    // bastone con stella
    o += '<path d="M72 128 L80 34" stroke="#b58d45" stroke-width="2.2" stroke-linecap="round"/>';
    o += '<path d="M80 22 L82.2 29 L89 29 L83.6 33 L85.6 40 L80 35.8 L74.4 40 L76.4 33 L71 29 L77.8 29 Z" fill="#fff1b8" stroke="' + GOLD + '" stroke-width=".7"/>';
    o += '<path d="M66 74 C70 70 74 66 78 60" fill="none" stroke="#33306b" stroke-width="5" stroke-linecap="round"/><circle cx="78" cy="61" r="2.6" fill="#e7d3b0"/>';
    o += '<text x="50" y="20" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="9.5" letter-spacing="1.2" fill="' + GOLD + '">ARCIMAGO</text>';
    o += '<text x="50" y="133" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="6" letter-spacing="1" fill="#cfc4ff">VINCE LA PRESA</text>';
    return o;
  }
  function giullare() {
    var o = frame('#6b6a7a');
    o += '<rect x="9" y="9" width="82" height="122" rx="3" fill="url(#pr-harle)" opacity=".18"/>';
    // cappello a tre punte
    o += '<path d="M30 64 C28 46 18 36 10 38 C20 30 34 34 42 50 C42 34 46 22 50 16 C54 22 58 34 58 50 C66 34 80 30 90 38 C82 36 72 46 70 64 Z" fill="#8e3a55" stroke="' + INK + '" stroke-width="1"/>';
    o += '<path d="M42 50 C44 56 46 62 46 64 M58 50 C56 56 54 62 54 64" fill="none" stroke="' + INK + '" stroke-width=".7"/>';
    o += '<path d="M50 16 C54 22 58 34 58 50 C55 56 52 60 50 64 C48 60 45 56 42 50 C42 34 46 22 50 16Z" fill="#2c6e6a"/>';
    o += '<g fill="' + GOLD + '" stroke="' + INK + '" stroke-width=".6"><circle cx="10" cy="38" r="3.4"/><circle cx="50" cy="15" r="3.4"/><circle cx="90" cy="38" r="3.4"/></g>';
    // maschera
    o += '<path d="M30 64 H70 C70 86 62 100 50 102 C38 100 30 86 30 64 Z" fill="#efe4cd" stroke="' + INK + '" stroke-width="1"/>';
    o += '<path d="M37 76 Q41 72 45 76 Q41 79 37 76 Z M55 76 Q59 72 63 76 Q59 79 55 76 Z" fill="' + INK + '"/>';
    o += '<path d="M40 88 Q50 96 60 88" fill="none" stroke="#8e3a55" stroke-width="1.6" stroke-linecap="round"/>';
    o += '<path d="M44 82 L42 90 M56 82 L58 90" stroke="#2c6e6a" stroke-width=".8"/>';
    o += '<path d="M28 66 H72 L74 70 L66 74 L58 70 L50 74 L42 70 L34 74 L26 70 Z" fill="#2c6e6a" stroke="' + INK + '" stroke-width=".8"/>';
    o += '<text x="50" y="117" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="9.5" letter-spacing="1.2" fill="#6b3044">GIULLARE</text>';
    o += '<text x="50" y="127" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-size="6" letter-spacing="1" fill="#6b6a7a">PERDE LA PRESA</text>';
    return o;
  }
  function back() {
    var o = '<rect x="1" y="1" width="98" height="138" rx="8" fill="#1d1c3d"/><rect x="1" y="1" width="98" height="138" rx="8" fill="url(#pr-night)"/>' + stars(5, 30, 100, 140, '#d8c7ff');
    o += '<rect x="5" y="5" width="90" height="130" rx="5" fill="none" stroke="' + GOLD + '" stroke-width="1.2"/>';
    var rays = ''; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; rays += 'M' + (50 + Math.cos(a) * 18).toFixed(1) + ' ' + (70 + Math.sin(a) * 18).toFixed(1) + 'L' + (50 + Math.cos(a) * (i % 2 ? 27 : 32)).toFixed(1) + ' ' + (70 + Math.sin(a) * (i % 2 ? 27 : 32)).toFixed(1); }
    o += '<path d="' + rays + '" stroke="' + GOLD + '" stroke-width="1.2"/>';
    o += '<circle cx="50" cy="70" r="16" fill="#25234d" stroke="' + GOLD + '" stroke-width="1.2"/>';
    o += '<path d="M38 70 Q50 59 62 70 Q50 81 38 70 Z" fill="' + IVORY + '"/><circle cx="50" cy="70" r="4.6" fill="#2a64a0"/><circle cx="50" cy="70" r="2" fill="' + INK + '"/>';
    o += '<text x="50" y="24" text-anchor="middle" font-family="Cinzel, Georgia, serif" font-weight="700" font-size="9" letter-spacing="2" fill="' + GOLD + '">PRESAGIO</text>';
    o += '<path d="M50 112 a7 7 0 1 0 0 14 a5.4 5.4 0 1 1 0 -14 Z" fill="' + GOLD + '"/>';
    return o;
  }

  var DEFS = '<svg width="0" height="0" style="position:absolute" aria-hidden="true" focusable="false"><defs>' +
    '<radialGradient id="pr-night" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#3c3a7a"/><stop offset="1" stop-color="#121228"/></radialGradient>' +
    '<radialGradient id="pr-halo"><stop offset="0" stop-color="#fff1b8" stop-opacity=".55"/><stop offset="1" stop-color="#fff1b8" stop-opacity="0"/></radialGradient>' +
    '<clipPath id="pr-clip"><rect x="1" y="1" width="98" height="138" rx="8"/></clipPath>' +
    '<pattern id="pr-harle" width="12" height="12" patternUnits="userSpaceOnUse" patternTransform="rotate(45)"><rect width="6" height="6" fill="#8e3a55"/><rect x="6" y="6" width="6" height="6" fill="#2c6e6a"/></pattern>' +
    '</defs></svg>';

  function svg(body) { return '<svg viewBox="0 0 100 140" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">' + body + '</svg>'; }
  return {
    DEFS: DEFS, SUITCOL: SUITCOL, SUITDARK: SUITDARK,
    card: function (id) { var c = PRData.CARDS[id]; return svg(c.k === 'w' ? '<g clip-path="url(#pr-clip)">' + arcimago() + '</g>' : c.k === 'j' ? giullare() : numbered(c.s, c.v)); },
    back: function () { return svg('<g clip-path="url(#pr-clip)">' + back() + '</g>'); },
    emblem: function (s, size) { return '<svg viewBox="-11 -11 22 22" width="' + (size || 18) + '" height="' + (size || 18) + '" aria-hidden="true">' + emblem(s, 0, 0, 10) + '</svg>'; }
  };
})();
