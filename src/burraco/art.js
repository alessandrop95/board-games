/* ===== Burraco: carte francesi disegnate da zero (semi, figure, jolly, dorso) =====
   Stesso stile delle carte di Machiavelli, con in più il jolly. Carte 0-103 (due mazzi), 104-107 jolly. */
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
  function emblem(r, s, col) {
    var gold = '#c99a2e', light = s === 1 || s === 2 ? '#f6d9d6' : '#dfe4ef';
    var frame = '<rect x="22" y="36" width="56" height="70" rx="6" fill="' + light + '" stroke="' + col + '" stroke-width="1.6"/><rect x="26" y="40" width="48" height="62" rx="4" fill="none" stroke="' + gold + '" stroke-width="1"/>';
    var art;
    if (r === 13) art = '<path d="M33 66l5-16 7 10 5-14 5 14 7-10 5 16z" fill="' + gold + '" stroke="' + col + '" stroke-width="1.4" stroke-linejoin="round"/><rect x="33" y="66" width="34" height="7" rx="1.5" fill="' + col + '"/>';
    else if (r === 12) art = '<g transform="translate(50 62)"><path d="M0-12C5-12 8-8 6-4 10-5 13-1 10 3 13 6 10 11 5 9 4 13-4 13-5 9-10 11-13 6-10 3-13-1-10-5-6-4-8-8-5-12 0-12Z" fill="' + col + '"/><circle r="4.4" fill="' + gold + '"/></g>';
    else art = '<g transform="translate(50 64)"><path d="M-16 2c2-10 10-14 16-14s14 4 16 14z" fill="' + col + '"/><rect x="-18" y="1" width="36" height="5" rx="2" fill="' + gold + '"/><path d="M8-10C14-22 26-22 28-14 22-16 16-14 10-6z" fill="' + gold + '" stroke="' + col + '" stroke-width="1"/></g>';
    return frame + art + suitPath(s, 50, 92, .62);
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
      var r = E.rank(c), s = E.suit(c), col = suitColor(s), L = RL[r] || String(r), big = r > 10;
      var center = big ? emblem(r, s, col) : r === 1 ? suitPath(s, 50, 74, 2.6) : suitPath(s, 50, 78, 2.1);
      o += '<text x="' + (L.length > 1 ? 6 : 9) + '" y="31" ' + FONT + ' font-size="24" fill="' + col + '"' + (L.length > 1 ? ' textLength="30" lengthAdjust="spacingAndGlyphs"' : '') + '>' + L + '</text>' + suitPath(s, 19, 44, .9) +
        '<g transform="rotate(180 50 70)"><text x="' + (L.length > 1 ? 6 : 9) + '" y="31" ' + FONT + ' font-size="24" fill="' + col + '"' + (L.length > 1 ? ' textLength="30" lengthAdjust="spacingAndGlyphs"' : '') + '>' + L + '</text>' + suitPath(s, 19, 44, .9) + '</g>' + center;
      if (r === 2) o += '<circle cx="82" cy="18" r="8" fill="#f2b705" opacity=".9"/><text x="82" y="22" text-anchor="middle" ' + FONT + ' font-size="11" fill="#5a3a00">★</text>';
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
