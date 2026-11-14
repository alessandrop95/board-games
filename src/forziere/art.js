/* ===== Il Forziere Maledetto: carte, navi e icone disegnate da zero =====
   Colore della cornice = tipo di carta: rosso Attacco, blu Difesa, ebano Azione, verde Equipaggiamento,
   rosso e blu le carte che valgono in due modi. In basso a sinistra il simbolo (Ancora, Timone, Teschio, Perla)
   che serve contro il Vascello spettrale, il Gorgo e la Polena. */
var FZArt = (function () {
  var E = FZEngine;
  var KC = { atk: ['#b8322a', '#5e1410'], def: ['#2d6fb8', '#12335e'], act: ['#3a3027', '#16110c'], eq: ['#2f8f55', '#123d24'], multi: ['#b8322a', '#2d6fb8'] };
  var KN = { atk: 'Attacco', def: 'Difesa', act: 'Azione', eq: 'Equipaggiamento', multi: 'Attacco o Difesa' };

  function defs() {
    function lg(id, a, b, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".5" stop-color="' + c + '"/>' : '') + '<stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      lg('fz-paper', '#fbf1d9', '#e6cf9e', '#f3e3bd') + lg('fz-sea', '#2c6f8f', '#0b2a3d', '#164c66') + lg('fz-wood', '#9a6534', '#5a3517') + lg('fz-gold', '#ffe8a3', '#b8801f', '#f2c14e') +
      lg('fz-back', '#3a1f12', '#120805', '#26130a') + lg('fz-sail', '#fffaf0', '#e8dcc0') + lg('fz-ghost', '#d9fff4', '#5fb9a8') +
      '<linearGradient id="fz-multi" x1="0" y1="0" x2="1" y2="1"><stop offset=".5" stop-color="#b8322a"/><stop offset=".5" stop-color="#2d6fb8"/></linearGradient>' +
      '<radialGradient id="fz-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff6c8" stop-opacity=".8"/><stop offset="1" stop-color="#fff6c8" stop-opacity="0"/></radialGradient>' +
      '<pattern id="fz-grain" width="8" height="8" patternUnits="userSpaceOnUse"><path d="M0 4h8" stroke="#000" stroke-opacity=".05"/></pattern>' +
      '</defs></svg>';
  }

  /* ---------- icone piccole (24x24, colore del testo) ---------- */
  var IP = {
    barrel: '<ellipse cx="12" cy="5" rx="6.5" ry="2.2"/><path d="M5.5 5c-1.2 4.6-1.2 9.4 0 14M18.5 5c1.2 4.6 1.2 9.4 0 14"/><ellipse cx="12" cy="19" rx="6.5" ry="2.2"/><path d="M4.9 9.5h14.2M4.9 14.5h14.2"/>',
    cannon: '<circle cx="8" cy="16" r="4"/><path d="M10 13 21 6.5l1.2 2.4L12 16.5"/><path d="M3 21h10"/>',
    range: '<path d="M3 15 15 7l2.5 3.8-12 8z"/><path d="m17.5 10.8 3-2-2.5-3.8-3 2"/><path d="M8 18l-1 4M11 16l2 5"/>',
    ammo: '<circle cx="8" cy="15" r="3.5"/><circle cx="16" cy="15" r="3.5"/><circle cx="12" cy="8.5" r="3.5"/>',
    chest: '<path d="M3.5 10h17v9.5h-17z"/><path d="M3.5 10a3.5 3.5 0 0 1 3.5-3.5h10a3.5 3.5 0 0 1 3.5 3.5"/><path d="M10.5 10v3.5h3V10M3.5 13.5h17"/>',
    coin: '<circle cx="12" cy="12" r="8.5"/><circle cx="12" cy="12" r="5.5"/><path d="M12 8.5v7"/>',
    flag: '<path d="M5 21V3.5"/><path d="M5 4h12l-2.5 4L17 12H5"/>',
    skull: '<path d="M12 3a7 7 0 0 0-7 7c0 2.5 1.2 4 2.5 5v3h9v-3c1.3-1 2.5-2.5 2.5-5a7 7 0 0 0-7-7z"/><circle cx="9.2" cy="10.5" r="1.4"/><circle cx="14.8" cy="10.5" r="1.4"/><path d="M10.5 18v2.5M13.5 18v2.5"/>',
    anchor: '<circle cx="12" cy="5" r="2.2"/><path d="M12 7.2V21M8 10.5h8M4.5 13.5c.5 4 3.8 7 7.5 7s7-3 7.5-7"/><path d="m3.5 15 1-2 2 1M20.5 15l-1-2-2 1"/>',
    helm: '<circle cx="12" cy="12" r="5"/><circle cx="12" cy="12" r="1.6"/><path d="M12 2.5v4M12 17.5v4M2.5 12h4M17.5 12h4M5.3 5.3l2.8 2.8M15.9 15.9l2.8 2.8M5.3 18.7l2.8-2.8M15.9 8.1l2.8-2.8"/>',
    pearl: '<circle cx="12" cy="13" r="6.5"/><path d="M9.3 10.5a3 3 0 0 1 2.7-1.6"/><path d="M5 6.5 3.5 5M19 6.5 20.5 5M12 4V2"/>',
    ghost: '<path d="M4 15h16l-2.5 4.5h-11z"/><path d="M12 15V3"/><path d="M12.5 4c3 1 4.5 4 4.5 9h-4.5M11.5 5c-2.5 1-4 3.5-4 8h4"/><path d="M8 9.5l1 1M15 8.5l1 1"/>',
    gorgo: '<path d="M12 12m-1.5 0a1.5 1.5 0 1 0 3 0c0-2.5-4-3.5-6-1.2-2.3 2.6-.6 7.2 3.5 7.2 5 0 7.5-5.5 4.6-9.6C13 4.6 7 4.4 4.3 8.1"/>',
    help: '<circle cx="12" cy="12" r="9"/><path d="M9.5 9.3a2.6 2.6 0 0 1 5 1c0 1.8-2.5 2.2-2.5 3.9"/><circle cx="12" cy="17.3" r=".6" fill="currentColor"/>',
    eye: '<path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z"/><circle cx="12" cy="12" r="3"/>',
    cards: '<rect x="4" y="6" width="10" height="14" rx="2" transform="rotate(-8 9 13)"/><rect x="10" y="4" width="10" height="14" rx="2" transform="rotate(8 15 11)"/>',
    sword: '<path d="M14.5 4H20v5.5L9 20.5 3.5 15z"/><path d="m6 12.5 5.5 5.5M4 20l2.5-2.5"/>',
    crown: '<path d="M3.5 18h17l-1.5-10-4.5 4L12 5.5 9.5 12 5 8z"/>',
    ship: '<path d="M3 15.5h18l-3 4.5H6z"/><path d="M12 15.5V3"/><path d="M12.6 4c3.6 1.7 5.4 5.4 5.4 9.5h-5.4M11.4 5.5C8.6 7 7 9.6 7 13.5h4.4"/>',
    wave: '<path d="M2 14c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3M2 19c2.5 0 2.5-3 5-3s2.5 3 5 3 2.5-3 5-3 2.5 3 5 3"/>',
    hourglass: '<path d="M6 3h12M6 21h12M7 3c0 5 5 6 5 9s-5 4-5 9M17 3c0 5-5 6-5 9s5 4 5 9"/>',
    log: '<path d="M5 4h14v16H5z"/><path d="M8.5 8.5h7M8.5 12h7M8.5 15.5h4.5"/>'
  };
  function icon(k, cls) { return '<svg class="ic' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" width="1em" height="1em" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round" aria-hidden="true">' + (IP[k] || '') + '</svg>'; }
  var SYMI = { A: 'anchor', T: 'helm', X: 'skull', P: 'pearl' };
  function sym(s) { return icon(SYMI[s], 'sym s-' + s); }

  /* ---------- illustrazioni delle carte (riquadro 100x64) ---------- */
  var INK = '#2a1a0e';
  function puff(x, y, r) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#f4efe6" stroke="' + INK + '" stroke-width="1.2"/>'; }
  var G = {
    bordata: function () { return puff(78, 20, 8) + puff(86, 28, 6) + puff(70, 13, 5) + '<g transform="rotate(-18 50 40)"><rect x="26" y="30" width="44" height="13" rx="6" fill="#3b3b40" stroke="' + INK + '" stroke-width="1.5"/><rect x="64" y="28" width="7" height="17" rx="2" fill="#2a2a2e"/><rect x="34" y="29" width="3" height="15" fill="#c9a24b"/></g><circle cx="38" cy="50" r="10" fill="url(#fz-wood)" stroke="' + INK + '" stroke-width="1.5"/><circle cx="38" cy="50" r="3" fill="' + INK + '"/>'; },
    arrembaggio: function () { return '<path d="M20 8 C30 30 42 22 50 30" stroke="#8a6a3f" stroke-width="3" fill="none" stroke-dasharray="4 2"/><path d="M50 30v20" stroke="#55585e" stroke-width="4"/><path d="M50 50c-14 0-16-12-16-12M50 50c14 0 16-12 16-12M50 50v8" stroke="#55585e" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M31 36l3 3 3-4M69 36l-3 3-3-4" stroke="#55585e" stroke-width="3" fill="none"/>'; },
    incatenate: function () { return '<circle cx="28" cy="34" r="12" fill="#3b3b40" stroke="' + INK + '" stroke-width="1.5"/><circle cx="72" cy="34" r="12" fill="#3b3b40" stroke="' + INK + '" stroke-width="1.5"/>' + [0, 1, 2, 3].map(function (i) { return '<ellipse cx="' + (40 + i * 6.7) + '" cy="' + (30 + (i % 2) * 4) + '" rx="4" ry="2.6" fill="none" stroke="#8b8e95" stroke-width="2"/>'; }).join('') + '<circle cx="24" cy="30" r="3" fill="#fff" opacity=".3"/><circle cx="68" cy="30" r="3" fill="#fff" opacity=".3"/>'; },
    moschetto: function () { return '<g transform="rotate(-22 50 34)"><rect x="10" y="30" width="62" height="6" rx="2" fill="#3b3b40"/><path d="M60 30h26l4 6-6 8H66l-4-8z" fill="url(#fz-wood)" stroke="' + INK + '" stroke-width="1.3"/><path d="M58 38l-3 7h5l2-7" fill="#55585e"/></g>' + puff(14, 16, 5) + puff(8, 22, 4); },
    virata: function () { return '<path d="M8 50c10 0 10-6 20-6s10 6 20 6 10-6 20-6 10 6 20 6" stroke="#2d6fb8" stroke-width="3" fill="none"/><path d="M22 40C24 14 70 8 76 34" stroke="#2d6fb8" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M68 30l9 6 3-11" stroke="#2d6fb8" stroke-width="5" fill="none" stroke-linecap="round" stroke-linejoin="round"/>' + puff(46, 22, 3); },
    bianca: function () { return '<path d="M32 62V6" stroke="#6b4a2a" stroke-width="3"/><path d="M33 8c14-4 22 6 40 0v28c-18 6-26-4-40 0z" fill="#fffdf6" stroke="' + INK + '" stroke-width="1.5"/><path d="M40 16c8 2 14 2 24-1" stroke="#d9d0c0" stroke-width="1.4" fill="none"/>'; },
    rum: function () { return '<path d="M44 8h12v12c8 4 10 12 10 20v18H34V40c0-8 2-16 10-20z" fill="#7a3e14" stroke="' + INK + '" stroke-width="1.5"/><rect x="43" y="4" width="14" height="7" rx="2" fill="#c9a24b" stroke="' + INK + '" stroke-width="1.2"/><rect x="38" y="34" width="24" height="14" rx="2" fill="#fbf1d9" stroke="' + INK + '" stroke-width="1"/><text x="50" y="45" text-anchor="middle" font-size="9" font-weight="800" fill="#7a3e14" font-family="Georgia,serif">RUM</text><path d="M40 24c2-2 4-3 6-3" stroke="#fff" stroke-opacity=".45" stroke-width="2" fill="none"/>'; },
    vedetta: function () { return '<g transform="rotate(-14 50 34)"><rect x="18" y="26" width="26" height="14" rx="3" fill="#8a6a3f" stroke="' + INK + '" stroke-width="1.4"/><rect x="42" y="28" width="22" height="10" rx="2" fill="#c9a24b" stroke="' + INK + '" stroke-width="1.4"/><rect x="62" y="30" width="18" height="6" rx="2" fill="#8a6a3f" stroke="' + INK + '" stroke-width="1.4"/><circle cx="18" cy="33" r="7" fill="#9ed4ff" stroke="' + INK + '" stroke-width="1.4"/></g><path d="M78 12l3 6 6 1-5 4 1 6-5-3-5 3 1-6-4-4 6-1z" fill="#f2c14e"/>'; },
    saccheggio: function () { return '<path d="M30 58c-6-18 4-30 12-34l-4-8h24l-4 8c8 4 18 16 12 34z" fill="#b08a55" stroke="' + INK + '" stroke-width="1.5"/><path d="M40 22h20" stroke="' + INK + '" stroke-width="2"/>' + [[22, 54], [76, 52], [70, 60], [28, 61]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="5" fill="url(#fz-gold)" stroke="' + INK + '" stroke-width="1"/>'; }).join('') + '<text x="50" y="46" text-anchor="middle" font-size="13" font-weight="900" fill="' + INK + '" font-family="Georgia,serif">$</text>'; },
    sabotaggio: function () { return '<circle cx="46" cy="40" r="17" fill="#2a2a2e" stroke="' + INK + '" stroke-width="1.5"/><rect x="51" y="18" width="10" height="8" rx="2" transform="rotate(35 56 22)" fill="#55585e"/><path d="M60 18c4-6 8-6 12-10" stroke="#8a6a3f" stroke-width="2.2" fill="none"/><path d="M74 6l2 4 4-1-3 3 2 4-4-2-3 3 0-4-4-2 4-1z" fill="#ffb02e"/><circle cx="40" cy="34" r="4" fill="#fff" opacity=".25"/>'; },
    burrasca: function () { return '<path d="M22 32a12 12 0 0 1 12-14 15 15 0 0 1 28-2 11 11 0 0 1 16 10 9 9 0 0 1-4 17H28a10 10 0 0 1-6-11z" fill="#5c6575" stroke="' + INK + '" stroke-width="1.5"/><path d="M50 40l-8 12h8l-5 12 14-16h-8l5-8z" fill="#ffd34d" stroke="' + INK + '" stroke-width="1.2"/>' + [30, 66, 76].map(function (x) { return '<path d="M' + x + ' 48l-4 10" stroke="#9ed4ff" stroke-width="2.2" stroke-linecap="round"/>'; }).join(''); },
    mostro: function () { return '<path d="M8 56c10 0 10-5 20-5s10 5 20 5 10-5 20-5 10 5 24 5" stroke="#2d6fb8" stroke-width="3" fill="none"/><path d="M34 54C30 30 44 12 60 10c10-1 14 8 8 12-5 3-10-2-6-5" stroke="#7b3f8f" stroke-width="9" fill="none" stroke-linecap="round"/>' + [[38, 40], [41, 30], [48, 21], [57, 15]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="2" fill="#e8c1f0"/>'; }).join('') + '<path d="M62 54c2-12 10-16 16-14" stroke="#7b3f8f" stroke-width="6" fill="none" stroke-linecap="round"/>'; },
    sfida: function () { return '<g stroke="' + INK + '" stroke-width="1.3"><path d="M20 58 70 10l6 2-2 6-48 46z" fill="#cfd6df"/><path d="M80 58 30 10l-6 2 2 6 48 46z" fill="#cfd6df"/><path d="M24 50l8 8M76 50l-8 8" stroke="#c9a24b" stroke-width="5"/></g>'; },
    spettro: function () { return '<circle cx="50" cy="32" r="30" fill="url(#fz-glow)" opacity=".5"/><path d="M18 46h64l-8 12H26z" fill="#3c5c58" stroke="#a6f3e2" stroke-width="1.2"/><path d="M50 46V6" stroke="#a6f3e2" stroke-width="2"/><path d="M52 8c12 4 18 14 18 34H52zM48 12c-10 4-16 12-16 30h16" fill="url(#fz-ghost)" opacity=".85"/><path d="M58 20l3 6-4 2 5 6M38 24l4 4-3 3" stroke="#3c5c58" stroke-width="1.6" fill="none"/>'; },
    porto: function () { return '<path d="M40 60l4-40h12l4 40z" fill="#fbf1d9" stroke="' + INK + '" stroke-width="1.5"/><path d="M42 40h16M41 50h18" stroke="#b8322a" stroke-width="5"/><rect x="42" y="12" width="16" height="9" fill="#ffe08a" stroke="' + INK + '" stroke-width="1.4"/><path d="M40 12l10-8 10 8z" fill="#b8322a" stroke="' + INK + '" stroke-width="1.3"/><path d="M58 15l30-8v16zM42 15l-30-8v16z" fill="#fff6c8" opacity=".6"/>'; },
    rifornimento: function () { return '<g stroke="' + INK + '" stroke-width="1.5"><ellipse cx="42" cy="14" rx="18" ry="5" fill="#b07a42"/><path d="M24 14c-3 14-3 28 0 42h36c3-14 3-28 0-42" fill="url(#fz-wood)"/><ellipse cx="42" cy="56" rx="18" ry="5" fill="#7a4b22"/><path d="M23 26h38M23 44h38" stroke="#3b3b40" stroke-width="3"/></g><circle cx="74" cy="22" r="11" fill="#2f8f55" stroke="' + INK + '" stroke-width="1.4"/><path d="M74 16v12M68 22h12" stroke="#fff" stroke-width="3"/>'; },
    lettera: function () { return '<rect x="18" y="14" width="64" height="42" rx="3" fill="#fbf1d9" stroke="' + INK + '" stroke-width="1.5"/><path d="M18 16l32 22 32-22" stroke="' + INK + '" stroke-width="1.5" fill="none"/><circle cx="50" cy="38" r="8" fill="#b8322a" stroke="' + INK + '" stroke-width="1.2"/><path d="M46 38h8M50 34v8" stroke="#f4b7ae" stroke-width="1.5"/><path d="M70 6l14 8" stroke="#f2c14e" stroke-width="3" stroke-linecap="round"/>'; },
    cannoniera: function () { return '<rect x="14" y="44" width="72" height="14" fill="url(#fz-wood)" stroke="' + INK + '" stroke-width="1.4"/><circle cx="50" cy="30" r="17" fill="#3b3b40" stroke="' + INK + '" stroke-width="1.5"/><circle cx="50" cy="30" r="10" fill="#141416"/><circle cx="50" cy="30" r="17" fill="none" stroke="#c9a24b" stroke-width="3"/><path d="M14 51h72" stroke="' + INK + '" stroke-width="1"/>'; },
    coffa: function () { return '<path d="M50 62V4" stroke="#6b4a2a" stroke-width="4"/><path d="M34 22h32l-4 12H38z" fill="url(#fz-wood)" stroke="' + INK + '" stroke-width="1.4"/><circle cx="50" cy="16" r="5" fill="#f1c9a0" stroke="' + INK + '" stroke-width="1.2"/><path d="M54 16h14" stroke="#c9a24b" stroke-width="4" stroke-linecap="round"/><path d="M20 40l30 12 30-12" stroke="#8a6a3f" stroke-width="1.3" fill="none"/>'; },
    nebbia: function () { return '<path d="M30 46h40l-6 8H36z" fill="#3b3b40" opacity=".55"/><path d="M50 46V20" stroke="#3b3b40" stroke-width="2" opacity=".55"/>' + [[10, 22, 70], [20, 34, 66], [6, 44, 80], [24, 56, 60]].map(function (r) { return '<path d="M' + r[0] + ' ' + r[1] + 'h' + r[2] + '" stroke="#e9eef2" stroke-width="7" stroke-linecap="round" opacity=".85"/>'; }).join(''); },
    polena: function () { return '<path d="M36 62c-6-14-2-24 6-30-6-6-6-16 0-22 8-8 22-4 24 6 2 6-2 10-6 12 10 6 12 18 6 34z" fill="#d9a441" stroke="' + INK + '" stroke-width="1.5"/><path d="M52 14c6 2 8 8 4 12" stroke="' + INK + '" stroke-width="1.2" fill="none"/><circle cx="56" cy="20" r="1.4" fill="' + INK + '"/><path d="M40 12c-8 6-10 18-4 28" stroke="#8a5a1a" stroke-width="4" fill="none" stroke-linecap="round"/><path d="M70 8l2 4 4 1-3 3 1 4-4-2-4 2 1-4-3-3 4-1z" fill="#fff6c8"/>'; },
    fasciame: function () { return [0, 1, 2, 3].map(function (i) { return '<rect x="12" y="' + (8 + i * 13) + '" width="76" height="11" rx="2" fill="url(#fz-wood)" stroke="' + INK + '" stroke-width="1.2"/><circle cx="20" cy="' + (13.5 + i * 13) + '" r="1.6" fill="' + INK + '"/><circle cx="80" cy="' + (13.5 + i * 13) + '" r="1.6" fill="' + INK + '"/>'; }).join('') + '<path d="M30 14c10 2 20 0 30 2M40 40c8 2 18-1 26 1" stroke="#000" stroke-opacity=".2" fill="none"/>'; },
    cassa: function () { return '<rect x="20" y="24" width="60" height="34" fill="url(#fz-wood)" stroke="' + INK + '" stroke-width="1.5"/><path d="M20 24l60 34M80 24 20 58" stroke="#5a3517" stroke-width="2"/><rect x="20" y="24" width="60" height="34" fill="none" stroke="#5a3517" stroke-width="4"/>' + [[34, 18], [48, 16], [62, 18], [41, 10], [55, 10]].map(function (c) { return '<circle cx="' + c[0] + '" cy="' + c[1] + '" r="6.5" fill="#3b3b40" stroke="' + INK + '" stroke-width="1"/>'; }).join(''); }
  };
  function glyph(t) { return (G[t] || G.bordata)(); }
  function wrap(s, n) { var w = s.split(' '), l = [], c = ''; w.forEach(function (x) { if ((c + ' ' + x).trim().length > n && c) { l.push(c); c = x; } else c = (c + ' ' + x).trim(); }); if (c) l.push(c); return l; }

  /* ---------- carta ---------- */
  function card(id, o) {
    o = o || {};
    if (id == null) return back(o);
    var C = E.CARDS[id], t = C.t, D = E.T[t], k = D.k, col = KC[k], frame = k === 'multi' ? 'url(#fz-multi)' : col[0];
    var title = wrap(D.n, 13), ty = title.length > 1 ? 15 : 19;
    return '<svg class="fzc k-' + k + (o.cls ? ' ' + o.cls : '') + '" viewBox="0 0 100 140" role="img" aria-label="' + D.n + '">' +
      '<rect x="1" y="1" width="98" height="138" rx="9" fill="' + frame + '"/><rect x="5" y="5" width="90" height="130" rx="6" fill="url(#fz-paper)"/><rect x="5" y="5" width="90" height="130" rx="6" fill="url(#fz-grain)"/>' +
      title.map(function (l, i) { return '<text x="50" y="' + (ty + i * 12) + '" text-anchor="middle" font-family="Pirata One,Georgia,serif" font-size="' + (l.length > 11 ? 11.5 : 13) + '" fill="' + INK + '">' + l + '</text>'; }).join('') +
      '<g transform="translate(0 40)">' + glyph(t) + '</g>' +
      '<rect x="10" y="108" width="80" height="13" rx="6.5" fill="' + (k === 'multi' ? '#4a2a5e' : col[1]) + '"/><text x="50" y="117.5" text-anchor="middle" font-family="system-ui,sans-serif" font-size="7.4" font-weight="800" letter-spacing=".6" fill="#fff">' + KN[k].toUpperCase() + '</text>' +
      '<g transform="translate(8 122) scale(.62)" color="' + INK + '"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round">' + IP[SYMI[C.s]] + '</svg></g>' +
      '</svg>';
  }
  function back(o) {
    return '<svg class="fzc back' + (o && o.cls ? ' ' + o.cls : '') + '" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="9" fill="url(#fz-back)"/><rect x="7" y="7" width="86" height="126" rx="6" fill="none" stroke="#c9a24b" stroke-width="1.5"/>' +
      '<g transform="translate(26 44) scale(2)" color="#c9a24b"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="1.6" stroke-linecap="round" stroke-linejoin="round">' + IP.skull + '</svg></g>' +
      '<path d="M22 108l56-12M22 96l56 12" stroke="#c9a24b" stroke-width="3" stroke-linecap="round"/></svg>';
  }

  /* ---------- navi ---------- */
  var SAIL = ['#fffaf0', '#f4d9a8', '#e7e2d8', '#ffe5d0'];
  function shipArt(s, o) {
    o = o || {};
    var S = E.SHIPS[s], c = SAIL[s % SAIL.length], masts = S.f >= 3 ? 3 : S.f === 2 ? 2 : 1, h = '';
    var xs = masts === 3 ? [34, 52, 70] : masts === 2 ? [40, 62] : [52];
    xs.forEach(function (x, i) { var ht = i === Math.floor(xs.length / 2) ? 44 : 36; h += '<path d="M' + x + ' 50V' + (50 - ht) + '" stroke="#3b2510" stroke-width="2"/><path d="M' + (x - 11) + ' ' + (54 - ht) + 'q11 6 22 0v' + (ht - 14) + 'q-11 5-22 0z" fill="' + c + '" stroke="#3b2510" stroke-width="1"/>'; });
    var flag = o.flag ? '<path d="M' + (xs[Math.floor(xs.length / 2)]) + ' 6l12 3-12 3z" fill="' + o.flag + '"/>' : '';
    return '<svg class="shipart" viewBox="0 0 100 70" aria-hidden="true"><path d="M0 60c10 0 10-4 20-4s10 4 20 4 10-4 20-4 10 4 20 4 10-4 20-4v14H0z" fill="#1d5f7f" opacity=".6"/>' + h + flag +
      '<path d="M12 50h78l-10 13H22z" fill="url(#fz-wood)" stroke="#3b2510" stroke-width="1.4"/><path d="M16 55h70" stroke="#3b2510" stroke-width="1"/>' + (S.m > 1 ? [0, 1, 2].slice(0, S.m).map(function (i) { return '<circle cx="' + (36 + i * 14) + '" cy="58" r="2.2" fill="#1b1209"/>'; }).join('') : '<circle cx="50" cy="58" r="2.2" fill="#1b1209"/>') + '</svg>';
  }
  function shipStats(s) {
    var S = E.SHIPS[s];
    return '<span class="sst"><span title="Valore: passi del Forziere se affonda">' + icon('chest') + S.f + '</span><span title="Gittata">' + icon('range') + S.g + '</span><span title="Munizioni: carte Attacco per turno">' + icon('ammo') + S.m + '</span><span title="Barili">' + icon('barrel') + S.b + '</span></span>';
  }
  function shipCard(s, o) {
    o = o || {}; var S = E.SHIPS[s];
    return '<div class="shipcard' + (o.cls ? ' ' + o.cls : '') + '">' + shipArt(s) + '<b>' + S.n + '</b>' + shipStats(s) + (S.d && !o.short ? '<small>' + S.d + '</small>' : '') + '</div>';
  }
  function barrels(n, max) { var h = ''; for (var i = 0; i < Math.max(n, max); i++) h += '<i class="bar' + (i < n ? '' : ' off') + (i >= max ? ' xtra' : '') + '"></i>'; return '<span class="bars" title="' + n + ' barili su ' + max + '">' + h + '</span>'; }

  /* ---------- ruoli e capitani ---------- */
  var RCOL = { L: '#c0392b', P: '#2d6fb8', PI: '#1b1b1b' };
  function roleColor(r) { return r === 'PI' ? RCOL.PI : RCOL[E.ROLES[r].nat]; }
  function roleIcon(r) { return r === 'PI' ? 'skull' : E.ROLES[r].lead ? 'crown' : E.ROLES[r].solo ? 'sword' : 'anchor'; }
  function roleBadge(r, o) { if (!r) return '<span class="rb unk">' + icon('help') + (o && o.long ? 'Ruolo segreto' : '?') + '</span>'; var R = E.ROLES[r]; return '<span class="rb r-' + r + '" style="--rc:' + roleColor(r) + '">' + icon(roleIcon(r)) + (o && o.long ? R.n : R.s) + '</span>'; }
  function roleCard(r) {
    var R = E.ROLES[r], col = roleColor(r);
    return '<svg class="rolecard" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="9" fill="' + col + '"/><rect x="6" y="6" width="88" height="128" rx="6" fill="url(#fz-paper)"/>' +
      '<path d="M50 22l26 10v22c0 20-12 32-26 38-14-6-26-18-26-38V32z" fill="' + col + '" stroke="#2a1a0e" stroke-width="1.5"/>' +
      '<g transform="translate(34 38) scale(1.35)" color="#fff"><svg viewBox="0 0 24 24" width="24" height="24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + IP[roleIcon(r)] + '</svg></g>' +
      wrap(R.n, 14).map(function (l, i) { return '<text x="50" y="' + (110 + i * 12) + '" text-anchor="middle" font-family="Pirata One,Georgia,serif" font-size="13" fill="#2a1a0e">' + l + '</text>'; }).join('') + '</svg>';
  }
  function capFace(c, col) {
    var C = E.CAPS[c], ini = C.n.split(' ').map(function (w) { return w.charAt(0); }).join('');
    return '<span class="capf" style="--pc:' + (col || '#c9a24b') + '" title="' + C.n + '">' + ini + '</span>';
  }

  /* ---------- tracciato del Forziere ---------- */
  function track(g) {
    var F = g.flag, max = Math.max(F, Math.abs(g.chest), 6), h = '';
    for (var v = -max; v <= max; v++) {
      var cls = 'tk' + (v === 0 ? ' mid' : '') + (Math.abs(v) >= F ? (v < 0 ? ' zl' : ' zp') : '') + (Math.abs(v) === 1 ? ' near' : '');
      h += '<span class="' + cls + '" data-v="' + v + '">' + (v === -F ? '<i class="fl fl-L">' + icon('flag') + '</i>' : v === F ? '<i class="fl fl-P">' + icon('flag') + '</i>' : '') + (v === g.chest ? '<i class="chest">' + icon('chest') + '</i>' : '') + '</span>';
    }
    return '<div class="track" style="--n:' + (max * 2 + 1) + '"><span class="tl">Levante</span>' + h + '<span class="tr">Ponente</span></div>';
  }

  return { defs: defs, icon: icon, sym: sym, card: card, back: back, glyph: glyph, shipArt: shipArt, shipStats: shipStats, shipCard: shipCard, barrels: barrels,
    roleBadge: roleBadge, roleCard: roleCard, roleColor: roleColor, capFace: capFace, track: track, KN: KN, KC: KC, SYMI: SYMI };
})();
