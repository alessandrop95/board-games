/* ===== Dadi e rischio: disegni (dadi, fiamma del rischio, logo) ===== */
var DRArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    dice: '<rect x="3" y="3" width="18" height="18" rx="4.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.3" cy="8.3" r="1.6" fill="currentColor"/><circle cx="15.7" cy="15.7" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/>',
    flame: '<path d="M12 2.5c.6 3.2 4.8 5.3 4.8 10.2A4.8 4.8 0 0 1 12 17.5a4.8 4.8 0 0 1-4.8-4.8c0-2 1-3.4 2-4.6.3 1.6 1.2 2.6 2.2 2.9-.6-3.2.1-5.9.6-8.5z" fill="currentColor"/><path d="M7 21h10" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    hand: '<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.2 15.5a1.6 1.6 0 0 1 2.4-2.1L7 14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
    flag: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  var PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
  // ogni valore ha il suo colore: la fila dei 5 valori diversi si legge a colpo d'occhio
  var COL = { 1: '#ff6b5a', 2: '#f2b705', 3: '#2fb36d', 4: '#16b5c4', 5: '#3d8bfd', 6: '#a35cf0' };
  // un dado: v da 1 a 6, 0 = casella vuota della fila
  function die(v, cls) {
    var body;
    if (!v) body = '<rect x="6" y="6" width="88" height="88" rx="20" fill="rgba(255,255,255,.04)" stroke="rgba(255,255,255,.28)" stroke-width="4" stroke-dasharray="10 8"/>';
    else body = '<rect x="4" y="4" width="92" height="92" rx="20" fill="#fff8ec" stroke="' + COL[v] + '" stroke-width="6"/><rect x="11" y="11" width="78" height="78" rx="14" fill="none" stroke="rgba(255,255,255,.9)" stroke-width="2"/>' +
      PIPS[v].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (v === 1 ? 13 : 9.5) + '" fill="' + COL[v] + '"/>'; }).join('');
    return '<svg class="die' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" role="img" aria-label="' + (v ? v : 'vuoto') + '">' + body + '</svg>';
  }
  function hero() {
    return '<div class="hero-dice"><span class="hflame">' + icon('flame') + '</span>' + [6, 3, 5, 1, 4].map(function (v, i) { return '<span class="hd d' + (i + 1) + '">' + die(v) + '</span>'; }).join('') + '<span class="hero-say">+15!</span></div>';
  }
  function defs() { return ''; }
  function logo() {
    function d(x, y, r, v, s) {
      return '<g transform="translate(' + x + ' ' + y + ') rotate(' + r + ') scale(' + s + ')"><rect x="-50" y="-50" width="100" height="100" rx="20" fill="#fff8ec" stroke="' + COL[v] + '" stroke-width="7"/>' +
        PIPS[v].map(function (p) { return '<circle cx="' + (p[0] - 50) + '" cy="' + (p[1] - 50) + '" r="' + (v === 1 ? 13 : 10) + '" fill="' + COL[v] + '"/>'; }).join('') + '</g>';
    }
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="dr-bg" cx=".5" cy=".75" r=".8"><stop offset="0" stop-color="#ff8a3d"/><stop offset=".45" stop-color="#7a2a5a"/><stop offset="1" stop-color="#160f2e"/></radialGradient></defs><rect width="512" height="512" fill="url(#dr-bg)"/>' +
      '<path d="M256 70c14 74 112 122 112 236a112 112 0 0 1-224 0c0-46 22-80 46-108 7 38 28 60 52 68-14-74 2-136 14-196z" fill="#ffb347" opacity=".85"/><path d="M256 190c8 40 60 66 60 128a60 60 0 0 1-120 0c0-26 12-44 26-60 4 20 14 32 28 36-8-40 0-74 6-104z" fill="#ffe08a"/>' +
      d(150, 360, -16, 6, 1.25) + d(362, 352, 14, 5, 1.25) + d(256, 410, 4, 1, 1.05) + '</svg>';
  }
  return { icon: icon, die: die, hero: hero, defs: defs, logo: logo, COL: COL };
})();
