/* ===== Burraco: carte francesi disegnate da zero (semi, figure, jolly, dorso) =====
   Numeri con i semi disposti come nelle carte vere; Fante, Donna e Re a mezzo busto con il nome sul cartiglio. Carte 0-103 (due mazzi), 104-107 jolly. */
var BUArt = (function () {
  var E = BUEngine;
  var RED = '#c0262d', BLACK = '#1d1a22';
  var SUIT = [
    'M0-9.5C4-5 9.5-1.6 9.5 2.6 9.5 6 6.6 8 3.9 8 2.4 8 1.2 7.2.6 6.3L2 9.6H-2l1.4-3.3C-1.2 7.2-2.4 8-3.9 8-6.6 8-9.5 6-9.5 2.6-9.5-1.6-4-5 0-9.5Z',
    'M0 9C-4-1.5-9.5-2.5-9.5-6.2-9.5-9-7.3-10.2-5.3-10.2-3-10.2-1-8.9 0-6.6 1-8.9 3-10.2 5.3-10.2 7.3-10.2 9.5-9 9.5-6.2 9.5-2.5 4-1.5 0 9Z',
    'M0-10L7.6 0 0 10-7.6 0Z',
    'M0-9.6A4.2 4.2 0 0 1 3.4-2.8 4.2 4.2 0 1 1 1.6 4.2L2.6 9.6H-2.6L-1.6 4.2A4.2 4.2 0 1 1-3.4-2.8 4.2 4.2 0 0 1 0-9.6Z'
  ];
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  function suitColor(s) { return s === 1 || s === 2 ? RED : BLACK; }
  function suitPath(s, x, y, k, fill) { return '<path d="' + SUIT[s] + '" transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="' + (fill || suitColor(s)) + '"/>'; }
  function suitIcon(s, size) { return '<svg class="sic" viewBox="-11 -11 22 22" width="' + (size || 14) + '" height="' + (size || 14) + '" aria-hidden="true">' + suitPath(s, 0, 0, 1) + '</svg>'; }
  var RL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };
  var SKIN = '#f3d2b0', LINE = '#2a2230', GOLD = '#f2c14e';
  function st(w) { return ' stroke="' + LINE + '" stroke-width="' + (w || 1.2) + '" stroke-linejoin="round"'; }
  function headFace(x, y, o) {
    o = o || {};
    return '<circle cx="' + x + '" cy="' + y + '" r="12" fill="' + SKIN + '"' + st(1.3) + '/>' +
      '<circle cx="' + (x - 4.2) + '" cy="' + (y - 1) + '" r="1.4" fill="' + LINE + '"/><circle cx="' + (x + 4.2) + '" cy="' + (y - 1) + '" r="1.4" fill="' + LINE + '"/>' +
      '<circle cx="' + (x - 7) + '" cy="' + (y + 4) + '" r="2.2" fill="#f0a08a" opacity=".55"/><circle cx="' + (x + 7) + '" cy="' + (y + 4) + '" r="2.2" fill="#f0a08a" opacity=".55"/>' +
      (o.beard ? '' : '<path d="M' + (x - 3.5) + ' ' + (y + 5) + ' Q' + x + ' ' + (y + (o.lips ? 7 : 8)) + ' ' + (x + 3.5) + ' ' + (y + 5) + '" stroke="' + (o.lips ? '#c0262d' : LINE) + '" stroke-width="' + (o.lips ? 2 : 1.3) + '" fill="none" stroke-linecap="round"/>');
  }
  // figure a mezzo busto in una cornice: Fante (J), Donna (Q), Re (K)
  function portrait(r, s, col) {
    var red = s === 1 || s === 2, dress = red ? '#c0262d' : '#2b3a67', dress2 = red ? '#7f141a' : '#151d3a', bg = red ? '#fbe7e4' : '#e6ebf5';
    var o = '<rect x="15" y="33" width="70" height="80" rx="6" fill="' + bg + '" stroke="' + col + '" stroke-width="1.5"/><rect x="18.5" y="36.5" width="63" height="73" rx="4" fill="none" stroke="#c99a2e" stroke-width="1"/>';
    o += '<g>';
    o += '<path d="M19 113 Q21 88 50 85 Q79 88 81 113Z" fill="' + dress + '"' + st(1.3) + '/>' +
      '<path d="M50 85 V113" stroke="' + GOLD + '" stroke-width="3"/><path d="M33 88 L38 113 M67 88 L62 113" stroke="' + dress2 + '" stroke-width="2.4" opacity=".6"/>';
    if (r === 11) {   // Fante: giovane con il berretto piumato e l'alabarda
      o += '<path d="M28 113 V44" stroke="#8a6a3a" stroke-width="3"/><path d="M28 40 L33 48 L28 52 L23 48Z" fill="#cfd6df"' + st(1) + '/>' +
        '<path d="M38 86 L50 96 L62 86 Q56 82 50 84 Q44 82 38 86Z" fill="#fffaf0"' + st(1) + '/>' +
        '<rect x="46" y="74" width="8" height="10" fill="' + SKIN + '"/>' +
        '<path d="M37 66 Q36 80 42 82 L42 66Z M63 66 Q64 80 58 82 L58 66Z" fill="#8a5a2e"/>' + headFace(50, 66) +
        '<path d="M38 63 Q39 53 50 53 Q61 53 62 63 Q57 58 50 58 Q43 58 38 63Z" fill="#8a5a2e"/>' +
        '<ellipse cx="49" cy="54" rx="16" ry="5" fill="' + dress + '"' + st(1.2) + '/><path d="M35 53 Q47 40 63 52" fill="' + dress + '"' + st(1.2) + '/>' +
        '<path d="M58 50 Q66 36 76 37 Q68 42 61 52Z" fill="#fffaf0"' + st(1) + '/>';
    } else if (r === 12) {   // Donna: capelli lunghi, coroncina, una rosa in mano
      o += '<path d="M35 64 Q32 88 38 100 L44 92 L44 66Z M65 64 Q68 88 62 100 L56 92 L56 66Z" fill="#c98a2e"' + st(1) + '/>' +
        '<path d="M37 88 Q50 98 63 88 Q57 84 50 86 Q43 84 37 88Z" fill="' + GOLD + '"' + st(1) + '/><circle cx="50" cy="94" r="2.4" fill="#c0262d"/>' +
        '<rect x="46" y="74" width="8" height="10" fill="' + SKIN + '"/>' + headFace(50, 66, { lips: true }) +
        '<path d="M37.5 66 Q37 52 50 52 Q63 52 62.5 66 Q60 58 50 57 Q40 58 37.5 66Z" fill="#c98a2e"' + st(1) + '/>' +
        '<path d="M41 53 L41 45 L45.5 50 L50 43 L54.5 50 L59 45 L59 53Z" fill="' + GOLD + '"' + st(1) + '/><circle cx="50" cy="47.5" r="1.6" fill="#c0262d"/>' +
        '<circle cx="38" cy="72" r="1.6" fill="' + GOLD + '"/><circle cx="62" cy="72" r="1.6" fill="' + GOLD + '"/>' +
        '<path d="M68 112 V96" stroke="#2f7a3a" stroke-width="2"/><path d="M70 102 Q75 99 74 104" fill="#2f7a3a"/><circle cx="68" cy="93" r="5" fill="#d6393f"' + st(1) + '/><path d="M66 92 Q68 90 70 93" stroke="#7a1418" fill="none"/>';
    } else {   // Re: corona, barba grigia e spada
      o += '<path d="M72 113 V54" stroke="#cfd6df" stroke-width="4"/><path d="M72 50 L74 56 H70Z" fill="#cfd6df"/><path d="M66 100 H78" stroke="' + GOLD + '" stroke-width="4" stroke-linecap="round"/>' +
        '<path d="M34 89 Q50 98 66 89 Q58 84 50 86 Q42 84 34 89Z" fill="#fffaf0"' + st(1) + '/>' +
        '<rect x="46" y="74" width="8" height="10" fill="' + SKIN + '"/>' + headFace(50, 64, { beard: true }) +
        '<path d="M38.5 66 Q39 84 50 86 Q61 84 61.5 66 Q57 73 50 73 Q43 73 38.5 66Z" fill="#a4a4ac"' + st(1) + '/>' +
        '<path d="M44 70 Q50 66.5 56 70" stroke="#6e6e78" stroke-width="2.4" fill="none" stroke-linecap="round"/>' +
        '<path d="M37 56 L37 40 L43.5 48 L50 37 L56.5 48 L63 40 L63 56Z" fill="' + GOLD + '"' + st(1.2) + '/><rect x="37" y="52" width="26" height="5" fill="#e0a823"' + st(.8) + '/>' +
        '<circle cx="50" cy="46" r="2.2" fill="#c0262d"/><circle cx="43" cy="54.5" r="1.3" fill="#2a5ca8"/><circle cx="57" cy="54.5" r="1.3" fill="#2a5ca8"/>';
    }
    o += '</g>' + suitPath(s, 74, 46, .7);
    return o;
  }
  var FNAME = { 11: 'FANTE', 12: 'DONNA', 13: 'RE' };
  // disposizione dei semi da 2 a 10 (carta 100×140); quelli nella metà bassa sono capovolti
  var L = 35, C = 50, R = 65;
  var PIPS = {
    2: [[C, 32], [C, 108]], 3: [[C, 32], [C, 70], [C, 108]], 4: [[L, 32], [R, 32], [L, 108], [R, 108]],
    5: [[L, 32], [R, 32], [C, 70], [L, 108], [R, 108]], 6: [[L, 32], [R, 32], [L, 70], [R, 70], [L, 108], [R, 108]],
    7: [[L, 32], [R, 32], [C, 51], [L, 70], [R, 70], [L, 108], [R, 108]], 8: [[L, 32], [R, 32], [C, 51], [L, 70], [R, 70], [C, 89], [L, 108], [R, 108]],
    9: [[L, 30], [R, 30], [L, 55], [R, 55], [C, 70], [L, 85], [R, 85], [L, 110], [R, 110]],
    10: [[L, 30], [R, 30], [C, 43], [L, 55], [R, 55], [L, 85], [R, 85], [C, 97], [L, 110], [R, 110]]
  };
  function pips(r, s) {
    return PIPS[r].map(function (p) { var k = r >= 9 ? .82 : .9; return p[1] > 72 ? '<g transform="rotate(180 ' + p[0] + ' ' + p[1] + ')">' + suitPath(s, p[0], p[1], k) + '</g>' : suitPath(s, p[0], p[1], k); }).join('');
  }
  var cache = {};
  function face(c) {
    if (cache[c]) return cache[c];
    var o = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="9" fill="#fffdf6" stroke="#b9ad93" stroke-width="2"/>';
    if (E.joker(c)) {
      var jc = c % 2 ? RED : '#2a5ca8';
      o += '<text x="9" y="30" ' + FONT + ' font-size="15" fill="' + jc + '">J</text><text x="9" y="46" ' + FONT + ' font-size="15" fill="' + jc + '">K</text><text x="9" y="62" ' + FONT + ' font-size="15" fill="' + jc + '">R</text>' +
        '<g transform="translate(56 76)"><path d="M-22 -4 L-14 -30 L-4 -10 L0 -34 L4 -10 L14 -30 L22 -4Z" fill="' + jc + '"/><circle cx="-14" cy="-30" r="3.4" fill="#f2b705"/><circle cx="0" cy="-34" r="3.4" fill="#f2b705"/><circle cx="14" cy="-30" r="3.4" fill="#f2b705"/>' +
        '<circle cy="8" r="14" fill="#f4d9b8" stroke="' + jc + '" stroke-width="2"/><path d="M-6 6h3M3 6h3M-6 13Q0 19 6 13" stroke="#3a2a1a" stroke-width="1.8" fill="none" stroke-linecap="round"/><path d="M-22 -4H22" stroke="' + jc + '" stroke-width="3"/></g>' +
        '<text x="50" y="128" text-anchor="middle" ' + FONT + ' font-size="13" fill="' + jc + '">JOLLY</text>';
    } else {
      var r = E.rank(c), s = E.suit(c), col = suitColor(s), Lb = RL[r] || String(r), big = r > 10;
      var ix = function () { return '<text x="' + (Lb.length > 1 ? 5 : 8) + '" y="24" ' + FONT + ' font-size="20" fill="' + col + '"' + (Lb.length > 1 ? ' textLength="22" lengthAdjust="spacingAndGlyphs"' : '') + '>' + Lb + '</text>' + suitPath(s, 14.5, 34, .62); };
      o += ix();
      if (big) o += portrait(r, s, col) + '<rect x="20" y="119" width="60" height="13" rx="6.5" fill="' + col + '"/><text x="50" y="128.8" text-anchor="middle" ' + FONT + ' font-size="9.5" letter-spacing=".8" fill="#fff">' + FNAME[r] + ' · ' + Lb + '</text>';
      else {
        o += '<g transform="rotate(180 50 70)">' + ix() + '</g>';
        o += r === 1 ? suitPath(s, 50, 70, 2.8) : pips(r, s);
      }
      if (r === 2) o += '<circle cx="86" cy="15" r="7.5" fill="#f2b705" opacity=".95"/><text x="86" y="19" text-anchor="middle" ' + FONT + ' font-size="10" fill="#5a3a00">★</text>';
    }
    return (cache[c] = o + '</svg>');
  }
  var backC = null;
  function back() {
    return backC || (backC = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="9" fill="#1f4f7a" stroke="#0e2a44" stroke-width="2"/>' +
      '<rect x="8" y="8" width="84" height="124" rx="5" fill="none" stroke="#d8b25a" stroke-width="1.6"/>' +
      '<g fill="none" stroke="rgba(216,178,90,.35)" stroke-width="1">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<path d="M8 ' + (14 + i * 18) + 'l42 -12 42 12"/>'; }).join('') + '</g>' +
      '<g transform="translate(50 70)"><circle r="20" fill="#1f4f7a" stroke="#d8b25a" stroke-width="2"/>' + suitPath(1, 0, 0, 1.3, '#d8b25a') + '</g></svg>');
  }
  function card(c, up, o) {
    o = o || {};
    return '<span class="skc fr' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back() + '</span><span class="skc-f skc-front">' + (c != null ? face(c) : '') + '</span></span></span>';
  }
  function flat(c) { return '<span class="skc fr up flat"><span class="skc-in"><span class="skc-f skc-front">' + face(c) + '</span></span></span>'; }
  function name(c) { return E.cname(c); }
  function defs() { return ''; }
  return { card: card, flat: flat, face: face, back: back, suitIcon: suitIcon, name: name, defs: defs };
})();
