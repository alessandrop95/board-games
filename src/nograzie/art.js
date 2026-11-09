/* ===== No Grazie!: carte disegnate da zero (tema: pacchi regalo che nessuno vuole) e gettoni =====
   Il colore va dal verde (carte basse, innocue) al viola (carte alte, da evitare): a colpo d'occhio si capisce
   quanto pesa un pacco. Il dorso è un pacco rosso con il fiocco d'oro. */
var NGArt = (function () {
  function hue(v) { var t = (v - 3) / 32; return Math.round(140 - t * 220 + 360) % 360; }   // 140 verde → giallo → arancio → rosso → 280 viola
  function col(v, l) { return 'hsl(' + hue(v) + ' 72% ' + l + '%)'; }
  function lab(v) { return String(v); }
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<linearGradient id="ng-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#e2384a"/><stop offset=".55" stop-color="#b5172b"/><stop offset="1" stop-color="#7a0a1a"/></linearGradient>' +
      '<linearGradient id="ng-gold" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff1a8"/><stop offset=".5" stop-color="#ffcf3f"/><stop offset="1" stop-color="#d08a00"/></linearGradient>' +
      '<radialGradient id="ng-chip" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#ff8a7a"/><stop offset=".6" stop-color="#e2384a"/><stop offset="1" stop-color="#8a0d1d"/></radialGradient>' +
      '<linearGradient id="ng-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
      '<pattern id="ng-dots" width="10" height="10" patternUnits="userSpaceOnUse"><circle cx="5" cy="5" r="1.4" fill="#fff" opacity=".22"/></pattern>' +
      '<clipPath id="ng-clip"><rect x="6" y="6" width="88" height="128" rx="8"/></clipPath>' +
      '</defs></svg>';
  }
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  function bow(x, y, s, fill) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M0 0 C-6 -10 -20 -12 -20 -4 C-20 3 -8 3 0 0Z M0 0 C6 -10 20 -12 20 -4 C20 3 8 3 0 0Z" fill="' + fill + '" stroke="#7a4b00" stroke-width="1"/>' +
      '<path d="M-2 1 L-8 12 M2 1 L8 12" stroke="' + fill + '" stroke-width="3.4" stroke-linecap="round"/><circle cx="0" cy="0" r="3.4" fill="' + fill + '" stroke="#7a4b00" stroke-width="1"/></g>';
  }
  var cache = {};
  function num(x, y, size, v, ink) {
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" ' + FONT + ' font-size="' + size + '" fill="#fff" stroke="' + ink + '" stroke-width="' + (size * .14).toFixed(1) + '" stroke-linejoin="round" paint-order="stroke">' + v + '</text>';
  }
  function face(v, mini) {
    var key = v + (mini ? 'm' : ''); if (cache[key]) return cache[key];
    var ink = col(v, 22), o = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true">' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="' + col(v, 52) + '"/><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#ng-dots)"/>';
    if (mini) o += '<rect x="44" y="1" width="12" height="138" fill="url(#ng-gold)" opacity=".85"/>' + num(50, 88, v > 9 ? 54 : 62, v, ink);
    else {
      // il pacco: scatola, coperchio, nastro e fiocco
      o += '<g clip-path="url(#ng-clip)"><rect x="18" y="58" width="64" height="62" rx="4" fill="' + col(v, 66) + '" stroke="' + ink + '" stroke-width="1.6"/>' +
        '<rect x="14" y="48" width="72" height="14" rx="3" fill="' + col(v, 74) + '" stroke="' + ink + '" stroke-width="1.6"/>' +
        '<rect x="45" y="48" width="10" height="72" fill="url(#ng-gold)" stroke="#9a6400" stroke-width=".8"/>' + bow(50, 47, 1.1, 'url(#ng-gold)') + '</g>' +
        num(50, 106, v > 9 ? 36 : 40, v, ink) + num(17, 28, 20, v, ink) + '<g transform="rotate(180 50 70)">' + num(17, 28, 20, v, ink) + '</g>';
    }
    o += '<rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#ng-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="' + ink + '" stroke-opacity=".7" stroke-width="2"/></svg>';
    return (cache[key] = o);
  }
  var backC = null, backM = null;
  function back(mini) {
    if (mini) return backM || (backM = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#ng-back)"/><rect x="43" y="1" width="14" height="138" fill="url(#ng-gold)"/><rect x="1" y="62" width="98" height="14" fill="url(#ng-gold)"/>' + bow(50, 69, 1.6, 'url(#ng-gold)') + '</svg>');
    return backC || (backC = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#ng-back)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#ng-dots)"/>' +
      '<rect x="44" y="1" width="12" height="138" fill="url(#ng-gold)"/><rect x="1" y="58" width="98" height="12" fill="url(#ng-gold)"/>' + bow(50, 63, 1.5, 'url(#ng-gold)') +
      '<text x="50" y="122" text-anchor="middle" ' + FONT + ' font-size="14" letter-spacing="1" fill="#fff6d0" stroke="#7a0a1a" stroke-width="2.6" paint-order="stroke">NO GRAZIE!</text>' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#ng-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#4a0510" stroke-width="2"/></svg>');
  }
  function card(v, up, o) {
    o = o || {};
    return '<span class="skc' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back(o.mini) + '</span><span class="skc-f skc-front">' + (v != null ? face(v, o.mini) : '') + '</span></span></span>';
  }
  function flat(v, mini) { return '<span class="skc up flat"><span class="skc-in"><span class="skc-f skc-front">' + face(v, mini) + '</span></span></span>'; }
  // gettone
  function chip(cls) { return '<svg class="chip-svg' + (cls ? ' ' + cls : '') + '" viewBox="0 0 24 24" aria-hidden="true"><circle cx="12" cy="12" r="11" fill="url(#ng-chip)" stroke="#5a0410" stroke-width="1"/><circle cx="12" cy="12" r="7.5" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.4" stroke-dasharray="2.6 2"/><path d="M8.5 12h7" stroke="#fff" stroke-width="2.2" stroke-linecap="round"/></svg>'; }
  function gift(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><rect x="-22" y="-8" width="44" height="34" rx="3" fill="#e2384a" stroke="#7a0a1a" stroke-width="1.4"/><rect x="-25" y="-16" width="50" height="10" rx="2" fill="#ff5d6c" stroke="#7a0a1a" stroke-width="1.4"/><rect x="-4" y="-16" width="8" height="42" fill="url(#ng-gold)"/>' + bow(0, -16, .9, 'url(#ng-gold)') + '</g>'; }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    hand: '<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11M10 11V4.5a1.5 1.5 0 0 1 3 0V11M13 11V5.5a1.5 1.5 0 0 1 3 0V12M16 12V8.5a1.5 1.5 0 0 1 3 0V14c0 4-3 7-7 7-3 0-5-2-6.5-4.5L3 12.5a1.5 1.5 0 0 1 2.4-1.8L7 12.5" fill="none" stroke="currentColor" stroke-width="1.8" stroke-linecap="round" stroke-linejoin="round"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="currentColor"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  return { defs: defs, face: face, back: back, card: card, flat: flat, lab: lab, icon: icon, chip: chip, gift: gift, col: col };
})();
