/* ===== Machiavelli: carte francesi disegnate da zero (semi, figure, dorso) e icone ===== */
var MCArt = (function () {
  var E = MCEngine;
  var RED = '#c0262d', BLACK = '#1d1a22';
  // semi: forme originali in un riquadro -10..10
  var SUIT = [
    'M0-9.5C4-5 9.5-1.6 9.5 2.6 9.5 6 6.6 8 3.9 8 2.4 8 1.2 7.2.6 6.3L2 9.6H-2l1.4-3.3C-1.2 7.2-2.4 8-3.9 8-6.6 8-9.5 6-9.5 2.6-9.5-1.6-4-5 0-9.5Z',   // picche
    'M0 9C-4-1.5-9.5-2.5-9.5-6.2-9.5-9-7.3-10.2-5.3-10.2-3-10.2-1-8.9 0-6.6 1-8.9 3-10.2 5.3-10.2 7.3-10.2 9.5-9 9.5-6.2 9.5-2.5 4-1.5 0 9Z',      // cuori
    'M0-10L7.6 0 0 10-7.6 0Z',                                                                                                                   // quadri
    'M0-9.6A4.2 4.2 0 0 1 3.4-2.8 4.2 4.2 0 1 1 1.6 4.2L2.6 9.6H-2.6L-1.6 4.2A4.2 4.2 0 1 1-3.4-2.8 4.2 4.2 0 0 1 0-9.6Z'                       // fiori
  ];
  function suitColor(s) { return s === 1 || s === 2 ? RED : BLACK; }
  function suitPath(s, x, y, k, fill) { return '<path d="' + SUIT[s] + '" transform="translate(' + x + ' ' + y + ') scale(' + k + ')" fill="' + (fill || suitColor(s)) + '"/>'; }
  function suitIcon(s, size) { return '<svg class="sic" viewBox="-11 -11 22 22" width="' + (size || 14) + '" height="' + (size || 14) + '" aria-hidden="true">' + suitPath(s, 0, 0, 1) + '</svg>'; }
  var RL = { 1: 'A', 11: 'J', 12: 'Q', 13: 'K' };

  // figure: emblemi originali (corona, rosa, cappello piumato) dentro una cornice
  function emblem(r, s, col) {
    var gold = '#c99a2e', light = s === 1 || s === 2 ? '#f6d9d6' : '#dfe4ef';
    var frame = '<rect x="22" y="36" width="56" height="70" rx="6" fill="' + light + '" stroke="' + col + '" stroke-width="1.6"/><rect x="26" y="40" width="48" height="62" rx="4" fill="none" stroke="' + gold + '" stroke-width="1"/>';
    var art;
    if (r === 13) art = '<path d="M33 66l5-16 7 10 5-14 5 14 7-10 5 16z" fill="' + gold + '" stroke="' + col + '" stroke-width="1.4" stroke-linejoin="round"/><rect x="33" y="66" width="34" height="7" rx="1.5" fill="' + col + '"/><circle cx="38" cy="50" r="2" fill="' + col + '"/><circle cx="50" cy="46" r="2" fill="' + col + '"/><circle cx="62" cy="50" r="2" fill="' + col + '"/>';
    else if (r === 12) art = '<g transform="translate(50 62)"><circle r="12" fill="' + col + '" opacity=".14"/><path d="M0-12C5-12 8-8 6-4 10-5 13-1 10 3 13 6 10 11 5 9 4 13-4 13-5 9-10 11-13 6-10 3-13-1-10-5-6-4-8-8-5-12 0-12Z" fill="' + col + '"/><circle r="4.4" fill="' + gold + '"/><path d="M0 12v14M0 20l-6-4M0 22l6-4" stroke="#3f6b3a" stroke-width="2" fill="none" stroke-linecap="round"/></g>';
    else art = '<g transform="translate(50 64)"><path d="M-16 2c2-10 10-14 16-14s14 4 16 14z" fill="' + col + '"/><rect x="-18" y="1" width="36" height="5" rx="2" fill="' + gold + '"/><path d="M8-10C14-22 26-22 28-14 22-16 16-14 10-6z" fill="' + gold + '" stroke="' + col + '" stroke-width="1"/><circle cx="0" cy="-4" r="2.6" fill="' + gold + '"/></g>';
    return frame + art + suitPath(s, 50, 92, .62);
  }
  function card(c, cls) {
    var r = E.rank(c), s = E.suit(c), col = suitColor(s), L = RL[r] || String(r), big = r > 10;
    var center = big ? emblem(r, s, col) : r === 1 ? suitPath(s, 50, 74, 2.6) + '<circle cx="50" cy="74" r="31" fill="none" stroke="' + col + '" stroke-width="1" opacity=".35"/>' : suitPath(s, 50, 78, 2.1);
    return '<svg class="pc ' + (cls || '') + '" viewBox="0 0 100 140" data-c="' + c + '" aria-label="' + E.cname(c) + '">' +
      '<rect x="1" y="1" width="98" height="138" rx="9" fill="#fffdf6" stroke="#b9ad93" stroke-width="2"/>' +
      '<text x="' + (L.length > 1 ? 6 : 9) + '" y="33" class="pc-r" fill="' + col + '"' + (L.length > 1 ? ' textLength="34" lengthAdjust="spacingAndGlyphs"' : '') + '>' + L + '</text>' + suitPath(s, 21, 48, .95) +
      '<g transform="rotate(180 50 70)"><text x="' + (L.length > 1 ? 6 : 9) + '" y="33" class="pc-r" fill="' + col + '"' + (L.length > 1 ? ' textLength="34" lengthAdjust="spacingAndGlyphs"' : '') + '>' + L + '</text>' + suitPath(s, 21, 48, .95) + '</g>' +
      center + '</svg>';
  }
  function back(cls) {
    return '<svg class="pc back ' + (cls || '') + '" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="9" fill="#7a1f24" stroke="#3a0d10" stroke-width="2"/>' +
      '<rect x="8" y="8" width="84" height="124" rx="5" fill="none" stroke="#d8b25a" stroke-width="1.6"/>' +
      '<g fill="none" stroke="rgba(216,178,90,.35)" stroke-width="1">' + [0, 1, 2, 3, 4, 5, 6].map(function (i) { return '<path d="M8 ' + (14 + i * 18) + 'l42 -12 42 12"/>'; }).join('') + '</g>' +
      '<g transform="translate(50 70)"><circle r="22" fill="#7a1f24" stroke="#d8b25a" stroke-width="2"/><path d="M0-15c4 4 4 10 0 15 -4-5-4-11 0-15zM-3 2c-6-6-12-4-12 2 4-1 8 0 10 4zM3 2c6-6 12-4 12 2-4-1-8 0-10 4zM-9 5h18M0 0v14M-5 14h10" fill="#d8b25a" stroke="#d8b25a" stroke-width="1.6" stroke-linejoin="round"/></g></svg>';
  }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3.5h10a2 2 0 0 1 2 2V18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    draw: '<rect x="5" y="3" width="14" height="18" rx="2.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 8v8M8 12h8" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/>',
    undo: '<path d="M9 7H5V3M5.6 7A8 8 0 1 1 4 13" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    check: '<path d="M4.5 12.5l5 5L19.5 6.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
    sort: '<path d="M4 6h10M4 12h7M4 18h4M17 5v14M14 16l3 3 3-3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    plus: '<path d="M12 5v14M5 12h14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>',
    hand: '<path d="M7 11V5.5a1.5 1.5 0 0 1 3 0V11m0-1V4a1.5 1.5 0 0 1 3 0v6m0-.5V5a1.5 1.5 0 0 1 3 0v6.5m0-3a1.5 1.5 0 0 1 3 0V14a7 7 0 0 1-7 7h-1a6 6 0 0 1-5-2.7L4.3 14a1.6 1.6 0 0 1 2.6-1.8L7 12" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  return { card: card, back: back, suitIcon: suitIcon, suitColor: suitColor, icon: icon };
})();
