/* ===== Prendi 6!: carte disegnate da zero (le teste di toro della fattoria) e icone =====
   Il colore della carta dice quanto pesa: azzurro 1 testa, giallo 2, arancio 3, rosso 5, viola 7 (il 55). */
var P6Art = (function () {
  function bulls(v) { return v === 55 ? 7 : v % 11 === 0 ? 5 : v % 10 === 0 ? 3 : v % 5 === 0 ? 2 : 1; }
  var COL = { 1: ['#cfe9ff', '#5a8fc4', '#24507f'], 2: ['#ffe98a', '#d6a800', '#7a5a00'], 3: ['#ffc48a', '#e07a1a', '#7a3a00'], 5: ['#ff9a9a', '#d0303a', '#6a0a14'], 7: ['#d4a6ff', '#7a2fd0', '#3a0a6a'] };
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<linearGradient id="p6-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
      '<linearGradient id="p6-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#4f7a2a"/><stop offset="1" stop-color="#2a4a14"/></linearGradient>' +
      '<pattern id="p6-grass" width="12" height="12" patternUnits="userSpaceOnUse"><path d="M2 12 l2 -6 M7 12 l1 -5 M10 12 l-1 -4" stroke="#fff" stroke-opacity=".12" stroke-width="1.2"/></pattern>' +
      '</defs></svg>';
  }
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  // testa di toro simpatica (centrata in 0,0, larga circa 24)
  function bull(x, y, s, col) {
    col = col || '#6a3a1a';
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M-7 -4 Q-14 -6 -13 -12 Q-10 -8 -5 -7Z M7 -4 Q14 -6 13 -12 Q10 -8 5 -7Z" fill="#f4ead2" stroke="#8a7a5a" stroke-width=".8"/>' +
      '<path d="M-9 -5 Q-12 -1 -9 1 L-7 -2Z M9 -5 Q12 -1 9 1 L7 -2Z" fill="' + col + '"/>' +
      '<path d="M-7 -7 Q0 -10 7 -7 Q9 2 6 7 Q0 10 -6 7 Q-9 2 -7 -7Z" fill="' + col + '"/>' +
      '<ellipse cx="0" cy="5" rx="5.5" ry="3.6" fill="#f2b8a8"/><circle cx="-2" cy="5" r=".9" fill="#5a2a1a"/><circle cx="2" cy="5" r=".9" fill="#5a2a1a"/>' +
      '<circle cx="-3.4" cy="-2" r="1.2" fill="#1a0e08"/><circle cx="3.4" cy="-2" r="1.2" fill="#1a0e08"/><path d="M-2 -6 Q0 -8 2 -6" stroke="#f4ead2" stroke-width="1" fill="none"/></g>';
  }
  function heads(n, y, s, col) {
    var o = '', per = n > 4 ? Math.ceil(n / 2) : n, sc = (n <= 2 ? .95 : n <= 3 ? .82 : .66) * s, step = 23 * sc;
    for (var k = 0; k < n; k++) { var row = Math.floor(k / per), inRow = row ? n - per : per, i = k - row * per; o += bull(50 + (i - (inRow - 1) / 2) * step, y + row * 17 * sc, sc, col); }
    return o;
  }
  var cache = {};
  function face(v, mini) {
    var key = v + (mini ? 'm' : ''); if (cache[key]) return cache[key];
    var b = bulls(v), c = COL[b], o = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true">' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="#fffaf0"/><rect x="5" y="5" width="90" height="130" rx="8" fill="' + c[0] + '"/>';
    if (mini) o += heads(Math.min(b, 4), 22, .9, c[2]) + '<text x="50" y="102" text-anchor="middle" ' + FONT + ' font-size="' + (v > 99 ? 42 : 54) + '" fill="#fff" stroke="' + c[2] + '" stroke-width="7" paint-order="stroke">' + v + '</text>';
    else {
      o += heads(b, b > 4 ? 18 : 22, 1, c[2]) +
        '<circle cx="50" cy="84" r="30" fill="#fff" opacity=".55"/><text x="50" y="100" text-anchor="middle" ' + FONT + ' font-size="' + (v > 99 ? 36 : 44) + '" fill="#fff" stroke="' + c[2] + '" stroke-width="6" paint-order="stroke">' + v + '</text>' +
        '<text x="12" y="132" ' + FONT + ' font-size="13" fill="' + c[2] + '">' + v + '</text><text x="88" y="132" text-anchor="end" ' + FONT + ' font-size="13" fill="' + c[2] + '">' + v + '</text>';
    }
    o += '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#p6-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="' + c[1] + '" stroke-width="2.4"/></svg>';
    return (cache[key] = o);
  }
  var backC = null;
  function back() {
    return backC || (backC = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#p6-back)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#p6-grass)"/>' +
      '<rect x="7" y="7" width="86" height="126" rx="8" fill="none" stroke="#ffe98a" stroke-opacity=".7" stroke-width="1.6"/>' + bull(50, 60, 2.4) +
      '<text x="50" y="120" text-anchor="middle" ' + FONT + ' font-size="17" fill="#ffe98a" stroke="#1a2a0a" stroke-width="3" paint-order="stroke">PRENDI 6!</text>' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#p6-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#1a2a0a" stroke-width="2"/></svg>');
  }
  function card(v, up, o) {
    o = o || {};
    return '<span class="skc' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back() + '</span><span class="skc-f skc-front">' + (v != null ? face(v, o.mini) : '') + '</span></span></span>';
  }
  function flat(v, mini) { return '<span class="skc up flat"><span class="skc-in"><span class="skc-f skc-front">' + face(v, mini) + '</span></span></span>'; }
  function head() { return '<svg class="bull-ic" viewBox="-14 -13 28 24" aria-hidden="true">' + bull(0, 0, 1) + '</svg>'; }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function hero(x, y, s) { return bull(x, y, s * 1.6); }
  return { defs: defs, face: face, back: back, card: card, flat: flat, icon: icon, head: head, hero: hero, bull: bull, bulls: bulls, COL: COL };
})();
