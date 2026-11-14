/* ===== Tiro alla fune di parole: la corda, le icone e il logo ===== */
var FNArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    flag: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4 16l-1.2-3a1.4 1.4 0 0 1 2.5-1.3L8 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>',
    send: '<path d="M4 12l16-8-6 16-3-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    back: '<path d="M10 6l-6 6 6 6M4 12h16" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function defs() { return ''; }
  // la corda: pos da -1 (tutta dai Rossi, a sinistra) a 1 (tutta dai Blu, a destra)
  function rope(pos) {
    var x = 200 + Math.max(-1, Math.min(1, pos)) * 120;
    var twist = ''; for (var i = 10; i < 390; i += 14) twist += '<path d="M' + i + ' 36 l7 8" stroke="#8a5a22" stroke-width="2"/>';
    return '<svg class="rope" viewBox="0 0 400 80" aria-hidden="true"><path d="M200 8 V72" stroke="#fff" stroke-opacity=".5" stroke-width="3" stroke-dasharray="6 6"/>' +
      '<rect x="0" y="34" width="400" height="12" rx="6" fill="#e2b06a"/>' + twist +
      '<g class="knot" transform="translate(' + x.toFixed(1) + ' 40)"><circle r="13" fill="#ff5a4e" stroke="#fff" stroke-width="3"/><path d="M-6 -2 q6 -8 12 0 q-6 8 -12 0" fill="none" stroke="#fff" stroke-width="2.4"/></g>' +
      '<g transform="translate(18 40)"><circle r="16" fill="#ff5a4e"/><path d="M-6 -2 l4 4 l8 -8" stroke="#fff" stroke-width="0" fill="none"/></g><g transform="translate(382 40)"><circle r="16" fill="#3d8bfd"/></g></svg>';
  }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="fn-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#ff5a4e"/><stop offset=".5" stop-color="#f2b705"/><stop offset="1" stop-color="#3d8bfd"/></linearGradient></defs><rect width="512" height="512" fill="url(#fn-bg)"/>' +
      '<g transform="translate(96 96)">' + [0, 1, 2].map(function (r) { return [0, 1, 2].map(function (c) { var l = 'PAROLENTI'[r * 3 + c]; return '<rect x="' + c * 110 + '" y="' + r * 110 + '" width="96" height="96" rx="20" fill="#fff8e6" stroke="#8a5a22" stroke-width="6"/><text x="' + (c * 110 + 48) + '" y="' + (r * 110 + 70) + '" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="60" fill="#5a3410">' + l + '</text>'; }).join(''); }).join('') + '</g>' +
      '<rect x="20" y="236" width="472" height="40" rx="20" fill="#e2b06a" stroke="#8a5a22" stroke-width="6" opacity=".95"/><circle cx="256" cy="256" r="34" fill="#ff5a4e" stroke="#fff" stroke-width="8"/></svg>';
  }
  return { icon: icon, defs: defs, rope: rope, logo: logo };
})();
