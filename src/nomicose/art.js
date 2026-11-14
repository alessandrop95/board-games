/* ===== Nomi, cose, città: grafica disegnata da zero (lettere su tessere di legno, quaderno a righe) e icone ===== */
var NCArt = (function () {
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<linearGradient id="nc-wood" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a8"/><stop offset=".55" stop-color="#f4c271"/><stop offset="1" stop-color="#d99a45"/></linearGradient>' +
      '<linearGradient id="nc-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".4" stop-color="#fff" stop-opacity="0"/></linearGradient>' +
      '</defs></svg>';
  }
  // tessera con la lettera (viewBox 100×100)
  function tile(l, o) {
    o = o || {};
    return '<svg class="nc-tile' + (o.cls ? ' ' + o.cls : '') + '" viewBox="0 0 100 100" aria-hidden="true">' +
      '<rect x="4" y="8" width="92" height="88" rx="16" fill="#8a5a22"/><rect x="4" y="4" width="92" height="88" rx="16" fill="url(#nc-wood)"/>' +
      '<rect x="10" y="10" width="80" height="76" rx="12" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2"/>' +
      '<text x="50" y="70" text-anchor="middle" ' + FONT + ' font-size="62" fill="#5a3410" stroke="#fff3d6" stroke-width="3" paint-order="stroke">' + (l || '?') + '</text>' +
      '<rect x="4" y="4" width="92" height="88" rx="16" fill="url(#nc-shine)"/></svg>';
  }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    flag: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7v5l3.5 2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    pen: '<path d="M4 20l1-4L16 5l3 3L8 19z M14 7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4 16l-1.2-3a1.4 1.4 0 0 1 2.5-1.3L8 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  // l'icona del gioco (anche per icon.svg)
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="nc-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#2f6f9e"/><stop offset="1" stop-color="#1b3f63"/></linearGradient>' +
      '<linearGradient id="nc-w" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ffe2a8"/><stop offset=".55" stop-color="#f4c271"/><stop offset="1" stop-color="#d99a45"/></linearGradient></defs>' +
      '<rect width="512" height="512" fill="url(#nc-bg)"/>' +
      '<g transform="translate(96 70) rotate(-6)"><rect x="0" y="0" width="300" height="370" rx="22" fill="#fffdf3"/>' +
      [80, 140, 200, 260, 320].map(function (y) { return '<path d="M24 ' + y + 'H276" stroke="#9fc4e8" stroke-width="5"/>'; }).join('') +
      '<path d="M70 20V350" stroke="#ef8a8a" stroke-width="5"/></g>' +
      '<g transform="translate(250 230) rotate(8)"><rect x="0" y="12" width="200" height="200" rx="34" fill="#8a5a22"/><rect x="0" y="0" width="200" height="200" rx="34" fill="url(#nc-w)"/>' +
      '<text x="100" y="152" text-anchor="middle" font-family="Arial Black,Arial,sans-serif" font-weight="900" font-size="150" fill="#5a3410">A</text></g></svg>';
  }
  return { defs: defs, tile: tile, icon: icon, logo: logo };
})();
