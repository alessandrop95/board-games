/* ===== Carte italiane da 40 (condivise da Briscola e Scopa): disegnate da zero =====
   Una carta è un numero da 0 a 39: seme = Math.floor(c / 10) (0 coppe, 1 denari, 2 spade, 3 bastoni),
   valore = c % 10 + 1 (1 asso … 7, poi 8 fante, 9 cavallo, 10 re).
   Le figure sono personaggi interi e riconoscibili: il Fante è un paggio in piedi con il berretto piumato,
   il Cavallo un cavaliere in sella, il Re un sovrano con corona, barba e mantello d'ermellino.
   Ognuna ha il nome scritto sul cartiglio in basso (con il suo valore) e la lettera nell'angolo. */
var ITArt = (function () {
  var SUITS = ['coppe', 'denari', 'spade', 'bastoni'], SUIT1 = ['Coppe', 'Denari', 'Spade', 'Bastoni'];
  var NAMES = { 1: 'Asso', 8: 'Fante', 9: 'Cavallo', 10: 'Re' };
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  var INK = ['#b5232e', '#a8770a', '#2a5ca8', '#2f7a3a'];
  var DRESS = ['#c3343d', '#d39a16', '#2f63b3', '#3a8a46'], DRESS2 = ['#7f1820', '#8a5a00', '#173a72', '#1d4f27'];
  var SKIN = '#f3d2b0', LINE = '#3a2a1a', GOLD = '#f2c14e';
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

  /* ---------- le figure ---------- */
  function st(w) { return ' stroke="' + LINE + '" stroke-width="' + (w || 1.2) + '" stroke-linejoin="round"'; }
  function hand(x, y) { return '<circle cx="' + x + '" cy="' + y + '" r="3.4" fill="' + SKIN + '"' + st(1) + '/>'; }
  function face(x, y, o) {
    o = o || {};
    return '<circle cx="' + x + '" cy="' + y + '" r="' + (o.r || 9.5) + '" fill="' + SKIN + '"' + st(1.3) + '/>' +
      '<circle cx="' + (x - 3.4) + '" cy="' + (y - 1) + '" r="1.25" fill="' + LINE + '"/><circle cx="' + (x + 3.4) + '" cy="' + (y - 1) + '" r="1.25" fill="' + LINE + '"/>' +
      '<circle cx="' + (x - 5.5) + '" cy="' + (y + 3) + '" r="1.8" fill="#f0a08a" opacity=".6"/><circle cx="' + (x + 5.5) + '" cy="' + (y + 3) + '" r="1.8" fill="#f0a08a" opacity=".6"/>' +
      (o.beard ? '' : '<path d="M' + (x - 3) + ' ' + (y + 4) + ' Q' + x + ' ' + (y + 6.5) + ' ' + (x + 3) + ' ' + (y + 4) + '" stroke="' + LINE + '" stroke-width="1.2" fill="none" stroke-linecap="round"/>');
  }
  function fante(s) {
    var c = DRESS[s], d = DRESS2[s];
    return '<g>' +
      // gambe e scarpe
      '<rect x="41" y="104" width="7.5" height="20" rx="2" fill="' + d + '"' + st() + '/><rect x="51.5" y="104" width="7.5" height="20" rx="2" fill="' + d + '"' + st() + '/>' +
      '<ellipse cx="43.5" cy="125" rx="6.5" ry="3" fill="' + LINE + '"/><ellipse cx="57" cy="125" rx="6.5" ry="3" fill="' + LINE + '"/>' +
      // braccio sinistro lungo il fianco
      '<path d="M38 72 Q32 86 33 99" stroke="' + d + '" stroke-width="7" fill="none" stroke-linecap="round"/>' + hand(33, 100) +
      // tunica a righe con cintura
      '<path d="M37 68 Q50 63 63 68 L67 108 Q50 113 33 108Z" fill="' + c + '"' + st(1.3) + '/>' +
      '<path d="M44 66 L42 109 M56 66 L58 109" stroke="' + d + '" stroke-width="2.4" opacity=".55"/><path d="M50 65 V110" stroke="' + GOLD + '" stroke-width="2.2"/>' +
      '<rect x="34" y="90" width="32" height="4.5" rx="1" fill="' + GOLD + '"' + st(.8) + '/>' +
      '<path d="M42 66 L50 75 L58 66 Z" fill="#fffaf0"' + st(1) + '/>' +
      // braccio destro alzato che regge il seme
      '<path d="M62 71 Q71 67 71 57" stroke="' + d + '" stroke-width="7" fill="none" stroke-linecap="round"/>' + hand(71, 55) +
      pip(s, 74, 40, .95) +
      // collo, testa, capelli, berretto piumato
      '<rect x="47" y="59" width="6" height="8" fill="' + SKIN + '"/>' +
      '<path d="M40 52 Q39 62 44 64 L44 52Z M60 52 Q61 62 56 64 L56 52Z" fill="#8a5a2e"/>' + face(50, 52) +
      '<path d="M40.5 50 Q41 41 50 41 Q59 41 59.5 50 Q55 45 50 45 Q45 45 40.5 50Z" fill="#8a5a2e"/>' +
      '<ellipse cx="49" cy="42" rx="13.5" ry="4.5" fill="' + c + '"' + st() + '/><path d="M38.5 41.5 Q48 30 60 40.5" fill="' + c + '"' + st() + '/>' +
      '<path d="M56 38 Q63 24 72 25 Q65 30 59 40Z" fill="#fffaf0"' + st(1) + '/></g>';
  }
  function cavallo(s) {
    var c = DRESS[s], d = DRESS2[s], H = '#a86b38', HD = '#5a3517';
    return '<g>' +
      // zampe del cavallo
      [31, 39, 61, 69].map(function (x, i) { return '<rect x="' + x + '" y="103" width="5.5" height="' + (i % 2 ? 22 : 24) + '" rx="2" fill="' + (i % 2 ? '#93592c' : H) + '"' + st(1) + '/><rect x="' + (x - .5) + '" y="' + (i % 2 ? 123 : 125) + '" width="6.5" height="3.5" rx="1" fill="' + LINE + '"/>'; }).join('') +
      // coda
      '<path d="M75 94 Q90 98 85 120 Q82 108 74 101Z" fill="' + HD + '"/>' +
      // corpo, collo e testa (guarda a sinistra)
      '<ellipse cx="52" cy="99" rx="25" ry="12.5" fill="' + H + '"' + st(1.3) + '/>' +
      '<path d="M33 97 Q27 84 25 72 L36 68 Q39 84 45 92Z" fill="' + H + '"' + st(1.3) + '/>' +
      '<path d="M25 72 Q16 72 12 81 Q11 87 16 88 Q22 86 27 81 L36 68Z" fill="' + H + '"' + st(1.3) + '/>' +
      '<path d="M27 66 L29 59 L33 66Z" fill="' + H + '"' + st(1) + '/><circle cx="24" cy="74" r="1.4" fill="' + LINE + '"/><circle cx="14.5" cy="84" r="1" fill="' + LINE + '"/>' +
      '<path d="M35 67 Q41 80 46 90" stroke="' + HD + '" stroke-width="4" fill="none" stroke-linecap="round"/>' +
      // gualdrappa con frange
      '<path d="M40 88 H68 L66 110 H42Z" fill="' + c + '"' + st(1.2) + '/><path d="M42 110 H66" stroke="' + GOLD + '" stroke-width="3" stroke-dasharray="2 1.5"/>' +
      // redini
      '<path d="M20 82 Q32 84 46 78" stroke="' + LINE + '" stroke-width="1" fill="none"/>' +
      // cavaliere: gamba, busto, braccio con il seme, testa con l'elmo piumato
      '<path d="M53 90 L50 106" stroke="' + d + '" stroke-width="6.5" stroke-linecap="round"/><ellipse cx="49" cy="107" rx="4.5" ry="2.5" fill="' + LINE + '"/>' +
      '<path d="M45 72 Q53 67 61 72 L61 92 H45Z" fill="' + c + '"' + st(1.2) + '/><path d="M45 84 H61" stroke="' + GOLD + '" stroke-width="2.4"/>' +
      '<path d="M46 75 Q40 80 45 78" stroke="' + d + '" stroke-width="5" fill="none" stroke-linecap="round"/>' + hand(46, 79) +
      '<path d="M60 74 Q70 70 71 60" stroke="' + d + '" stroke-width="6" fill="none" stroke-linecap="round"/>' + hand(71, 58) +
      pip(s, 75, 42, .95) +
      face(53, 60, { r: 8.5 }) +
      '<path d="M44 58 Q44 46 53 46 Q62 46 62 58 Q58 52 53 52 Q48 52 44 58Z" fill="#9aa7b4"' + st(1) + '/>' +
      '<path d="M53 46 Q50 34 58 30 Q57 38 56 46Z" fill="' + c + '"' + st(.9) + '/></g>';
  }
  function re(s) {
    var c = DRESS[s], d = DRESS2[s];
    var dots = ''; for (var i = 0; i < 6; i++) dots += '<circle cx="' + (31 + i * 7.6) + '" cy="125" r=".9" fill="' + LINE + '"/>';
    for (var j = 0; j < 5; j++) dots += '<circle cx="' + (j % 2 ? 51.2 : 48.8) + '" cy="' + (80 + j * 9) + '" r=".9" fill="' + LINE + '"/>';
    return '<g>' +
      // scettro
      '<path d="M29 54 V122" stroke="#b8860b" stroke-width="2.8"/><circle cx="29" cy="51" r="4" fill="' + GOLD + '"' + st(1) + '/><path d="M26 51 h6 M29 48 v6" stroke="#b8860b" stroke-width="1"/>' +
      // veste lunga con ermellino
      '<path d="M34 70 Q50 64 66 70 L73 128 H27Z" fill="' + c + '"' + st(1.3) + '/>' +
      '<path d="M34 70 L27 128 H37 L42 72Z M66 70 L73 128 H63 L58 72Z" fill="' + d + '" opacity=".55"/>' +
      '<rect x="46" y="72" width="8" height="51" fill="#fffaf0"' + st(.8) + '/><rect x="27" y="121" width="46" height="7" fill="#fffaf0"' + st(.8) + '/>' + dots +
      '<rect x="36" y="93" width="28" height="4" rx="1" fill="' + GOLD + '"' + st(.8) + '/>' +
      '<path d="M36 68 Q50 76 64 68 Q60 64 50 66 Q40 64 36 68Z" fill="#fffaf0"' + st(1) + '/>' +
      // braccia: una tiene lo scettro, l'altra il seme
      '<path d="M37 74 Q31 80 30 86" stroke="' + d + '" stroke-width="7" fill="none" stroke-linecap="round"/>' + hand(30, 87) +
      '<path d="M63 74 Q70 80 69 88" stroke="' + d + '" stroke-width="7" fill="none" stroke-linecap="round"/>' + hand(69, 89) +
      pip(s, 74, 104, .95) +
      // testa con barba e corona
      '<rect x="47" y="59" width="6" height="8" fill="' + SKIN + '"/>' + face(50, 51, { beard: true }) +
      '<path d="M40.5 52 Q41 67 50 70 Q59 67 59.5 52 Q56 58 50 58 Q44 58 40.5 52Z" fill="#8c7a66"' + st(1) + '/>' +
      '<path d="M45 56 Q50 53.5 55 56" stroke="#5a4636" stroke-width="2" fill="none" stroke-linecap="round"/>' +
      '<path d="M38.5 44 L38.5 29 L44.5 36 L50 25 L55.5 36 L61.5 29 L61.5 44Z" fill="' + GOLD + '"' + st(1.2) + '/>' +
      '<rect x="38.5" y="40" width="23" height="4.5" fill="#e0a823"' + st(.8) + '/><circle cx="50" cy="34" r="2" fill="#c2364a"/><circle cx="44" cy="42.2" r="1.3" fill="#2f63b3"/><circle cx="56" cy="42.2" r="1.3" fill="#2f63b3"/></g>';
  }
  function banner(t, col) { return '<rect x="17" y="131" width="66" height="13" rx="6.5" fill="' + col + '"/><text x="50" y="140.6" text-anchor="middle" ' + FONT + ' font-size="9.5" letter-spacing=".6" fill="#fff">' + t + '</text>'; }

  var cache = {};
  function faceSvg(c) {
    if (cache[c] != null) return cache[c];
    var s = suit(c), r = rank(c), col = INK[s];
    var o = '<svg class="skc-svg" viewBox="0 0 100 150" aria-hidden="true"><rect x="1" y="1" width="98" height="148" rx="9" fill="#fffaf0" stroke="#cdbb98" stroke-width="1.5"/>' +
      '<rect x="6" y="6" width="88" height="138" rx="6" fill="none" stroke="' + col + '" stroke-opacity=".35" stroke-width="1.2"/>';
    var idx = '<text x="11" y="23" ' + FONT + ' font-size="18" fill="' + col + '">' + short(c) + '</text>';
    if (r <= 7) {
      if (r === 1) o += '<circle cx="50" cy="75" r="31" fill="none" stroke="' + col + '" stroke-opacity=".25" stroke-width="1.5" stroke-dasharray="3 3"/>';
      o += LAY[r].map(function (p) { return pip(s, p[0], p[1], r === 1 ? 2 : r <= 3 ? 1.15 : 1); }).join('');
      o += idx + '<text x="89" y="141" text-anchor="end" ' + FONT + ' font-size="18" fill="' + col + '">' + short(c) + '</text>';
    } else {
      o += '<rect x="10" y="10" width="80" height="119" rx="5" fill="' + col + '" fill-opacity=".07"/>';
      o += (r === 8 ? fante(s) : r === 9 ? cavallo(s) : re(s)) + idx + banner(NAMES[r].toUpperCase() + ' · ' + r, col);
    }
    o += '</svg>';
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
    return '<span class="skc it' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back() + '</span><span class="skc-f skc-front">' + (c != null ? faceSvg(c) : '') + '</span></span></span>';
  }
  function flat(c) { return '<span class="skc it up flat"><span class="skc-in"><span class="skc-f skc-front">' + faceSvg(c) + '</span></span></span>'; }
  function suitIcon(s) { return '<svg class="sic" viewBox="-14 -16 28 32" aria-hidden="true">' + pip(s, 0, 0, 1) + '</svg>'; }
  function defs() { return ''; }
  return { defs: defs, card: card, flat: flat, face: faceSvg, back: back, suitIcon: suitIcon, pip: pip, suit: suit, rank: rank, name: name, short: short, SUITS: SUITS, SUIT1: SUIT1 };
})();
