/* ===== Asta lampo: disegni (gemme, maledizioni, monete, martelletto, logo) ===== */
var ALArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    coin: '<circle cx="12" cy="12" r="9" fill="#f5c542" stroke="#9a6a00" stroke-width="1.6"/><circle cx="12" cy="12" r="6.2" fill="none" stroke="#c99200" stroke-width="1.3"/><path d="M12 8.5v7M10 10h3.2a1.3 1.3 0 0 1 0 2.6H10.8a1.3 1.3 0 0 0 0 2.6H14" fill="none" stroke="#7a5200" stroke-width="1.3" stroke-linecap="round"/>',
    gavel: '<path d="M13.5 3.5l7 7M11 6l7 7M12.3 4.7l-5.6 5.6 7 7 5.6-5.6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M9.5 13.5L3 20" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    bolt: '<path d="M13.5 2L4.5 13.5h6.5L9.5 22l10-12.5h-6.8z" fill="currentColor"/>',
    minus: '<path d="M6 12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    plus: '<path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    skull: '<path d="M12 3a7.5 7.5 0 0 0-7.5 7.5c0 2.6 1.3 4.4 3 5.5V19h9v-3c1.7-1.1 3-2.9 3-5.5A7.5 7.5 0 0 0 12 3z" fill="currentColor"/><circle cx="9.2" cy="11" r="1.8" fill="#1a0f2a"/><circle cx="14.8" cy="11" r="1.8" fill="#1a0f2a"/><path d="M10 19v2M12 19v2M14 19v2" stroke="currentColor" stroke-width="1.6"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  var GEM = [['#ff6b7a', '#d42a44', '#7a0a1e'], ['#7fb2ff', '#2f6fd8', '#0f2f74'], ['#6ff0a4', '#1fa860', '#0a5a30'], ['#ffe27a', '#f0b323', '#8a5a00']];
  // una gemma sfaccettata nel colore c
  function gemShape(c, x, y, s) {
    var G = GEM[c];
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-30 -14L-16 -30H16L30 -14L0 32z" fill="' + G[1] + '" stroke="' + G[2] + '" stroke-width="3" stroke-linejoin="round"/>' +
      '<path d="M-30 -14H30M-16 -30L-8 -14L0 32M16 -30L8 -14L0 32M-8 -14L0 -30L8 -14" fill="none" stroke="' + G[2] + '" stroke-opacity=".55" stroke-width="2"/>' +
      '<path d="M-16 -30L-8 -14H-30z" fill="' + G[0] + '" opacity=".8"/><path d="M-8 -14H8L0 32z" fill="' + G[0] + '" opacity=".35"/><circle cx="-12" cy="-22" r="3" fill="#fff" opacity=".8"/></g>';
  }
  // una carta: gemma (colore e valore) o maledizione
  function card(id, cls) {
    var C = ALEngine.CARDS[id], body;
    if (C.k === 'gem') {
      var G = GEM[C.c], gems = '';
      body = '<rect x="3" y="3" width="94" height="134" rx="12" fill="#fffaf0" stroke="' + G[1] + '" stroke-width="5"/><rect x="10" y="10" width="80" height="120" rx="8" fill="' + G[0] + '" opacity=".18"/>' +
        gemShape(C.c, 50, 72, 1.05) + '<text x="15" y="31" font-family="Baloo 2, sans-serif" font-weight="800" font-size="28" fill="' + G[2] + '">' + C.v + '</text><text x="85" y="128" text-anchor="end" font-family="Baloo 2, sans-serif" font-weight="800" font-size="28" fill="' + G[2] + '">' + C.v + '</text>';
    } else {
      body = '<rect x="3" y="3" width="94" height="134" rx="12" fill="#2a1840" stroke="#a35cf0" stroke-width="5"/><path d="M20 20l12 18-8 16 14 20-6 22M80 30l-14 16 10 18-12 22" fill="none" stroke="#a35cf0" stroke-opacity=".5" stroke-width="2"/>' +
        '<g transform="translate(26 42) scale(2)" color="#e6d6ff">' + IC.skull + '</g><text x="50" y="126" text-anchor="middle" font-family="Baloo 2, sans-serif" font-weight="800" font-size="30" fill="#ff8fa0">' + C.v + '</text>';
    }
    return '<svg class="acard' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 140" role="img" aria-label="' + ALEngine.cardName(id) + '">' + body + '</svg>';
  }
  // pallino piccolo di una gemma (per le collezioni dei giocatori)
  function dot(c) { return '<svg class="gdot" viewBox="-34 -34 68 68" aria-hidden="true">' + gemShape(c, 0, 0, .95) + '</svg>'; }
  function hero() {
    return '<div class="hero-lots"><span class="hb1">' + card(3) + '</span><span class="hb2">' + card(6) + '</span><span class="hb3">' + card(16) + '</span><span class="hbolt">' + icon('bolt') + '</span><span class="hgavel">' + icon('gavel') + '</span></div>';
  }
  function defs() { return ''; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="al-bg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#2d5ba8"/><stop offset=".55" stop-color="#14264f"/><stop offset="1" stop-color="#0a1128"/></radialGradient></defs><rect width="512" height="512" fill="url(#al-bg)"/>' +
      '<path d="M300 40L150 280h104L222 472 382 228H276z" fill="#ffd84a" stroke="#a87a00" stroke-width="8" stroke-linejoin="round"/>' +
      gemShape(0, 150, 360, 2.6) + gemShape(2, 370, 380, 2.2) + gemShape(1, 372, 150, 1.8) + '</svg>';
  }
  return { icon: icon, card: card, dot: dot, hero: hero, defs: defs, logo: logo, GEM: GEM };
})();
