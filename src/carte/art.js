/* ===== Carte italiane da 40 (condivise da Briscola e Scopa): disegnate da zero =====
   Una carta è un numero da 0 a 39: seme = Math.floor(c / 10) (0 coppe, 1 denari, 2 spade, 3 bastoni),
   valore = c % 10 + 1 (1 asso … 7, poi 8 fante, 9 cavallo, 10 re). */
var ITArt = (function () {
  var SUITS = ['coppe', 'denari', 'spade', 'bastoni'], SUIT1 = ['Coppe', 'Denari', 'Spade', 'Bastoni'];
  var NAMES = { 1: 'Asso', 8: 'Fante', 9: 'Cavallo', 10: 'Re' };
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  var INK = ['#b5232e', '#b8860b', '#2a5ca8', '#2f7a3a'];
  function suit(c) { return Math.floor(c / 10); }
  function rank(c) { return c % 10 + 1; }
  function name(c) { var r = rank(c); return (NAMES[r] || String(r)) + ' di ' + SUITS[suit(c)]; }
  function short(c) { var r = rank(c); return (r === 1 ? 'A' : r === 8 ? 'F' : r === 9 ? 'C' : r === 10 ? 'R' : String(r)); }
  // i quattro semi, centrati in 0,0 e alti circa 24
  function pip(s, x, y, k) {
    var g = '<g transform="translate(' + x + ' ' + y + ') scale(' + (k || 1) + ')">';
    if (s === 0) g += '<path d="M-9 -10 H9 Q9 2 2 4 V8 Q6 9 7 12 H-7 Q-6 9 -2 8 V4 Q-9 2 -9 -10Z" fill="#d6393f" stroke="#7a1418" stroke-width="1.2"/><path d="M-7 -8 H7" stroke="#ffd75e" stroke-width="2"/><ellipse cx="0" cy="-10" rx="9" ry="2.2" fill="#f2b705" stroke="#7a1418" stroke-width="1"/>';
    else if (s === 1) g += '<circle r="11" fill="#f2b705" stroke="#8a5a00" stroke-width="1.4"/><circle r="7" fill="none" stroke="#8a5a00" stroke-width="1.2"/><path d="M0 -4 L3.5 0 L0 4 L-3.5 0Z" fill="#c2364a"/>';
    else if (s === 2) g += '<path d="M-1.6 -12 L1.6 -12 L1.6 5 L-1.6 5Z" fill="#cfe0f2" stroke="#2a4a7a" stroke-width="1"/><path d="M0 -15 L1.6 -12 H-1.6Z" fill="#cfe0f2" stroke="#2a4a7a" stroke-width="1"/><path d="M-7 5 H7 V7.5 H-7Z" fill="#f2b705" stroke="#6a4400" stroke-width="1"/><path d="M-1.4 7.5 H1.4 V12 H-1.4Z" fill="#7a3a1a"/><circle cy="13" r="2" fill="#f2b705" stroke="#6a4400" stroke-width=".8"/>';
    else g += '<path d="M-2.5 12 L-3.5 -8 Q0 -14 3.5 -8 L2.5 12Z" fill="#7a4a1a" stroke="#3a2008" stroke-width="1.2"/><circle cx="-3" cy="-2" r="1.6" fill="#2f7a3a"/><circle cx="3" cy="4" r="1.6" fill="#2f7a3a"/><path d="M-3.5 -8 Q0 -14 3.5 -8" stroke="#2f7a3a" stroke-width="2" fill="none"/>';
    return g + '</g>';
  }
  // posizione dei semi per i valori da 1 a 7 (carta 100×150)
  var LAY = { 1: [[50, 75]], 2: [[50, 45], [50, 105]], 3: [[50, 38], [50, 75], [50, 112]], 4: [[33, 45], [67, 45], [33, 105], [67, 105]], 5: [[33, 42], [67, 42], [50, 75], [33, 108], [67, 108]], 6: [[33, 40], [67, 40], [33, 75], [67, 75], [33, 110], [67, 110]], 7: [[33, 38], [67, 38], [50, 57], [33, 80], [67, 80], [33, 112], [67, 112]] };
  // le figure: una sagoma semplice (berretto del fante, testa del cavallo, corona del re)
  function figure(r, s) {
    var col = INK[s], o = '<g transform="translate(50 70)">';
    o += '<circle cy="-8" r="13" fill="#f4d9b8" stroke="#6a4a2a" stroke-width="1.4"/><path d="M-20 34 Q-20 10 0 8 Q20 10 20 34Z" fill="' + col + '" stroke="#3a2a1a" stroke-width="1.4"/>';
    if (r === 8) o += '<path d="M-14 -16 Q0 -30 14 -16 Q6 -20 -14 -16Z" fill="' + col + '" stroke="#3a2a1a" stroke-width="1.2"/><path d="M10 -22 Q22 -34 26 -22" stroke="#f2b705" stroke-width="3" fill="none" stroke-linecap="round"/>';
    else if (r === 9) o += '<path d="M-26 -2 Q-34 -24 -18 -30 L-12 -24 Q-8 -14 -14 -4Z" fill="#a0703a" stroke="#3a2008" stroke-width="1.2"/><circle cx="-24" cy="-22" r="1.6" fill="#1a0e08"/><path d="M-12 -18 Q0 -26 12 -18" stroke="' + col + '" stroke-width="5" fill="none"/>';
    else o += '<path d="M-13 -18 L-13 -30 L-7 -23 L0 -32 L7 -23 L13 -30 L13 -18Z" fill="#f2b705" stroke="#8a5a00" stroke-width="1.2"/><path d="M-10 4 Q0 14 10 4" stroke="#8a6a4a" stroke-width="2" fill="none"/>';
    o += '<path d="M-5 -10 h2 M3 -10 h2 M-2 -3 Q0 -1 2 -3" stroke="#3a2a1a" stroke-width="1.4" fill="none" stroke-linecap="round"/></g>';
    return o + pip(s, 22, 122, .75) + pip(s, 78, 122, .75);
  }
  var cache = {};
  function face(c) {
    if (cache[c] != null) return cache[c];
    var s = suit(c), r = rank(c), col = INK[s];
    var o = '<svg class="skc-svg" viewBox="0 0 100 150" aria-hidden="true"><rect x="1" y="1" width="98" height="148" rx="9" fill="#fffaf0" stroke="#cdbb98" stroke-width="1.5"/>' +
      '<rect x="6" y="6" width="88" height="138" rx="6" fill="none" stroke="' + col + '" stroke-opacity=".35" stroke-width="1.2"/>';
    if (r <= 7) o += LAY[r].map(function (p) { return pip(s, p[0], p[1], r === 1 ? 2 : r <= 3 ? 1.15 : 1); }).join('');
    else o += figure(r, s);
    o += '<text x="11" y="22" ' + FONT + ' font-size="17" fill="' + col + '">' + short(c) + '</text><text x="89" y="140" text-anchor="end" ' + FONT + ' font-size="17" fill="' + col + '">' + short(c) + '</text></svg>';
    return (cache[c] = o);
  }
  var backC = null;
  function back() {
    return backC || (backC = '<svg class="skc-svg" viewBox="0 0 100 150" aria-hidden="true"><rect x="1" y="1" width="98" height="148" rx="9" fill="#7a2a3a" stroke="#3a1420" stroke-width="2"/>' +
      '<rect x="7" y="7" width="86" height="136" rx="6" fill="none" stroke="#f2c96a" stroke-width="1.6"/>' +
      '<g fill="none" stroke="#f2c96a" stroke-opacity=".45" stroke-width="1">' + [0, 1, 2, 3, 4, 5, 6, 7, 8].map(function (i) { return '<path d="M12 ' + (16 + i * 15) + ' l38 -10 38 10"/>'; }).join('') + '</g>' +
      '<circle cx="50" cy="75" r="17" fill="#7a2a3a" stroke="#f2c96a" stroke-width="2"/>' + pip(1, 50, 75, 1) + '</svg>');
  }
  function card(c, up, o) {
    o = o || {};
    return '<span class="skc it' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back() + '</span><span class="skc-f skc-front">' + (c != null ? face(c) : '') + '</span></span></span>';
  }
  function flat(c) { return '<span class="skc it up flat"><span class="skc-in"><span class="skc-f skc-front">' + face(c) + '</span></span></span>'; }
  function suitIcon(s) { return '<svg class="sic" viewBox="-14 -16 28 32" aria-hidden="true">' + pip(s, 0, 0, 1) + '</svg>'; }
  function defs() { return ''; }
  return { defs: defs, card: card, flat: flat, face: face, back: back, suitIcon: suitIcon, pip: pip, suit: suit, rank: rank, name: name, short: short, SUITS: SUITS, SUIT1: SUIT1 };
})();
