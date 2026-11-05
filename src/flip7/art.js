/* ===== Flip 7: carte disegnate da zero (tema: luna park di notte) e icone =====
   Ogni numero ha il suo colore, dal grigio argento dello 0 al rosso fuoco del 12; sotto il numero, tanti puntini
   quante sono le copie nel mazzo (per contare le probabilità a colpo d'occhio). Modificatori dorati, azioni con un simbolo grande. */
var F7Art = (function () {
  var COL = ['#9aa7b8', '#7b61ff', '#4f7cff', '#1e9bf0', '#13b5b1', '#2fb36d', '#8cc63f', '#f2c014', '#ff9f1a', '#ff7043', '#f2457e', '#d6338f', '#e53935'];
  var INK = ['#3e4756', '#2b1a8a', '#1b3a9a', '#0b4f86', '#075c5a', '#105a33', '#3b5a12', '#6a4d00', '#7a3e00', '#7a2a14', '#7a0f36', '#6a0f45', '#7a0e0c'];
  function lab(c) { return typeof c === 'number' ? String(c) : c === 'x2' ? '×2' : c === 'FRZ' ? 'Congela' : c === 'F3' ? 'Flip Three' : c === 'SC' ? 'Seconda possibilità' : c; }
  function key(c) { return typeof c === 'number' ? 'n' + c : c === 'x2' ? 'x2' : c.charAt(0) === '+' ? 'p' + c.slice(1) : c; }

  function defs() {
    function lg(id, a, b, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".55" stop-color="' + c + '"/>' : '') + '<stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      lg('f7-back', '#3a1b7a', '#120530', '#24104f') + lg('f7-gold', '#fff3b0', '#c98a0a', '#f5c33b') + lg('f7-goldd', '#ffe37a', '#a86a00') + lg('f7-x2', '#d38bff', '#5a1a9a', '#9a4ae0') +
      lg('f7-frz', '#e8fbff', '#3aa6e0', '#9adcf8') + lg('f7-f3', '#ffd27a', '#e24a1a', '#ff8a2a') + lg('f7-sc', '#b6ffcf', '#1f9a58', '#4fd08a') + lg('f7-paper', '#fffdf6', '#efe6d2') +
      '<radialGradient id="f7-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".7"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<linearGradient id="f7-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset=".33" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
      '<clipPath id="f7-clip"><rect x="6" y="6" width="88" height="128" rx="8"/></clipPath>' +
      '</defs></svg>';
  }
  function burstRays(cx, cy, col, n, op) { var o = ''; for (var i = 0; i < n; i++) { var a = i * 2 * Math.PI / n, b = a + Math.PI / n; o += '<path d="M' + cx + ' ' + cy + 'L' + (cx + Math.cos(a) * 120).toFixed(1) + ' ' + (cy + Math.sin(a) * 120).toFixed(1) + 'L' + (cx + Math.cos(b) * 120).toFixed(1) + ' ' + (cy + Math.sin(b) * 120).toFixed(1) + 'Z" fill="' + col + '" opacity="' + (op || .16) + '"/>'; } return o; }
  function bulbs(col) { var o = '', i; for (i = 0; i < 9; i++) o += '<circle cx="' + (10 + i * 10) + '" cy="10" r="2.2" fill="' + col + '"/><circle cx="' + (10 + i * 10) + '" cy="130" r="2.2" fill="' + col + '"/>'; for (i = 1; i < 12; i++) o += '<circle cx="10" cy="' + (10 + i * 10) + '" r="2.2" fill="' + col + '"/><circle cx="90" cy="' + (10 + i * 10) + '" r="2.2" fill="' + col + '"/>'; return o; }
  function big(t, x, y, size, ink, fill) {
    var f = 'font-family="\'Baloo 2\',Nunito,system-ui,sans-serif" font-weight="800" text-anchor="middle"';
    return '<text x="' + x + '" y="' + (y + size * .07) + '" ' + f + ' font-size="' + size + '" fill="' + ink + '" opacity=".55">' + t + '</text>' +
      '<text x="' + x + '" y="' + y + '" ' + f + ' font-size="' + size + '" fill="' + (fill || '#fff') + '" stroke="' + ink + '" stroke-width="' + (size * .13).toFixed(1) + '" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';
  }
  function small(t, x, y, ink, sz) { return '<text x="' + x + '" y="' + y + '" text-anchor="middle" font-family="\'Baloo 2\',Nunito,sans-serif" font-weight="800" font-size="' + (sz || 15) + '" fill="' + ink + '">' + t + '</text>'; }
  function frame(fill, edge) { return '<rect x="1" y="1" width="98" height="138" rx="11" fill="' + fill + '"/>'; }
  function finish(edge) { return '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#f7-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="' + edge + '" stroke-width="2.2"/>'; }

  var cache = {};
  function face(c, mini) {
    var k = key(c) + (mini ? 'm' : ''); if (cache[k]) return cache[k];
    var o = '<svg class="f7c-svg" viewBox="0 0 100 140" aria-hidden="true">';
    if (typeof c === 'number') {
      var col = COL[c], ink = INK[c];
      o += frame('url(#f7-paper)') + '<rect x="6" y="6" width="88" height="128" rx="8" fill="' + col + '"/>' +
        '<g clip-path="url(#f7-clip)">' + burstRays(50, 66, '#fff', 14, .18) + '<circle cx="50" cy="66" r="34" fill="url(#f7-glow)" opacity=".5"/></g>' +
        '<rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>';
      if (mini) o += big(c, 50, c >= 10 ? 90 : 94, c >= 10 ? 58 : 72, ink);
      else {
        o += big(c, 50, c >= 10 ? 84 : 88, c >= 10 ? 50 : 62, ink) + small(c, 17, 25, ink, 16) + '<g transform="rotate(180 50 70)">' + small(c, 17, 25, ink, 16) + '</g>';
        // puntini: quante copie ci sono nel mazzo
        var n = Math.max(1, c), dots = '', per = 6, rows = Math.ceil(n / per);
        for (var i = 0; i < n; i++) { var r = Math.floor(i / per), cnt = Math.min(per, n - r * per), x = 50 + ((i % per) - (cnt - 1) / 2) * 7.4, y = 108 + r * 7 - (rows - 1) * 3.5; dots += '<circle cx="' + x.toFixed(1) + '" cy="' + y.toFixed(1) + '" r="2.4" fill="#fff" stroke="' + ink + '" stroke-width=".9"/>'; }
        o += dots;
      }
      o += finish(ink);
    } else if (c === 'x2') {
      o += frame('url(#f7-x2)') + '<g clip-path="url(#f7-clip)">' + burstRays(50, 70, '#fff', 16, .14) + '</g><rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#ffe37a" stroke-width="1.8"/>' +
        '<path d="M50 30c10 12 16 20 12 32c8-4 9-12 8-18c10 10 12 24 4 34c-6 8-16 10-24 10s-18-2-24-10c-8-10-6-24 4-34c-1 6 0 14 8 18c-4-12 2-20 12-32z" fill="#ff9a2a" opacity=".55"/>' +
        big('×2', 50, 92, 50, '#3a0a6a', '#ffe37a') + (mini ? '' : small('RADDOPPIA', 50, 122, '#fff3c8', 10) + small('i numeri', 50, 132, '#fff3c8', 8)) + finish('#3a0a6a');
    } else if (c.charAt(0) === '+') {
      o += frame('url(#f7-gold)') + '<g clip-path="url(#f7-clip)">' + burstRays(50, 68, '#fff', 16, .2) + '</g><rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-opacity=".8" stroke-width="1.6"/>' +
        '<circle cx="50" cy="68" r="30" fill="url(#f7-goldd)" stroke="#8a5a00" stroke-width="2.4"/><circle cx="50" cy="68" r="24" fill="none" stroke="#fff3c8" stroke-width="1.2" stroke-dasharray="2 3"/>' +
        big(c, 50, 82, c === '+10' ? 32 : 38, '#6a4000', '#fffbe6') + (mini ? '' : small('PUNTI BONUS', 50, 122, '#6a4000', 10)) + finish('#8a5a00');
    } else if (c === 'FRZ') {
      var fl = ''; for (var a = 0; a < 6; a++) fl += '<g transform="rotate(' + (a * 60) + ' 50 62)"><path d="M50 62V30M50 38l-7-7M50 38l7-7M50 48l-6-5M50 48l6-5" stroke="#fff" stroke-width="3.6" stroke-linecap="round" fill="none"/></g>';
      o += frame('url(#f7-frz)') + '<g clip-path="url(#f7-clip)">' + burstRays(50, 62, '#fff', 12, .25) + '</g><rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-width="1.6"/>' +
        '<circle cx="50" cy="62" r="34" fill="#1a7bc0" opacity=".25"/><g stroke="#0d5a8f" stroke-width="7" opacity=".4">' + fl.replace(/stroke="#fff" stroke-width="3.6"/g, '') + '</g>' + fl +
        (mini ? '' : small('CONGELA', 50, 116, '#0b4f86', 15) + small('ferma un giocatore', 50, 128, '#0b4f86', 8)) + finish('#0b4f86');
    } else if (c === 'F3') {
      o += frame('url(#f7-f3)') + '<g clip-path="url(#f7-clip)">' + burstRays(50, 60, '#fff', 14, .2) + '</g><rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-width="1.6"/>' +
        [[-16, -14], [0, 0], [16, 14]].map(function (q, i) { return '<g transform="translate(' + (50 + q[0] * .9) + ' 62) rotate(' + q[1] + ')"><rect x="-13" y="-19" width="26" height="38" rx="4" fill="#fff" stroke="#7a2a00" stroke-width="2"/>' + small(i + 1, 0, 8, '#e24a1a', 20) + '</g>'; }).join('') +
        '<path d="M22 30q28-18 56 0" fill="none" stroke="#fff" stroke-width="3" stroke-linecap="round"/><path d="M72 22l7 8l-10 2" fill="#fff"/>' +
        (mini ? '' : small('FLIP THREE', 50, 116, '#7a2a00', 14) + small('tre carte di fila', 50, 128, '#7a2a00', 8)) + finish('#7a2a00');
    } else if (c === 'SC') {
      o += frame('url(#f7-sc)') + '<g clip-path="url(#f7-clip)">' + burstRays(50, 60, '#fff', 14, .22) + '</g><rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-width="1.6"/>' +
        '<path d="M50 30l26 9v20c0 18-12 28-26 34c-14-6-26-16-26-34V39z" fill="#0f6a3a" stroke="#fff" stroke-width="2.4"/>' +
        '<path d="M50 76c-10-8-16-13-16-20c0-5 4-8 8-8c3 0 6 2 8 5c2-3 5-5 8-5c4 0 8 3 8 8c0 7-6 12-16 20z" fill="#ff5a7a" stroke="#fff" stroke-width="1.6"/>' +
        (mini ? '' : small('2ª POSSIBILITÀ', 50, 116, '#0f5a32', 11.5) + small('salva da un doppione', 50, 128, '#0f5a32', 8)) + finish('#0f5a32');
    }
    return (cache[k] = o + '</svg>');
  }
  var backC = {};
  function back(mini) {
    var k = mini ? 'm' : 'b'; if (backC[k]) return backC[k];
    var star = '<path d="M50 34l7.6 15.4 17 2.5-12.3 12 2.9 16.9L50 72.8l-15.2 8 2.9-16.9-12.3-12 17-2.5z" fill="#ffd34d" stroke="#fff3c8" stroke-width="1.6"/>';
    return (backC[k] = '<svg class="f7c-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#f7-back)"/>' +
      '<g clip-path="url(#f7-clip)">' + burstRays(50, 64, '#ff5ad1', 16, .12) + '</g>' + (mini ? '' : bulbs('#ffe7a0')) +
      '<rect x="16" y="16" width="68" height="108" rx="8" fill="none" stroke="#ff5ad1" stroke-width="2" opacity=".8"/>' + star +
      '<text x="50" y="' + (mini ? 112 : 108) + '" text-anchor="middle" font-family="\'Baloo 2\',Nunito,sans-serif" font-weight="800" font-size="' + (mini ? 34 : 30) + '" fill="#fff" stroke="#ff2fb4" stroke-width="3" paint-order="stroke">7</text>' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#f7-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#0e0426" stroke-width="2"/></svg>');
  }
  // carta completa con le due facce (per girarla in 3D): up = scoperta
  function card(c, up, o) {
    o = o || {};
    return '<span class="f7c' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + ' k-' + (c == null ? 'back' : key(c)) + '"' + (o.attrs || '') + '><span class="f7c-in"><span class="f7c-f f7c-back">' + back(o.mini) + '</span><span class="f7c-f f7c-front">' + (c != null ? face(c, o.mini) : '') + '</span></span></span>';
  }
  function flat(c, mini) { return '<span class="f7c up flat k-' + key(c) + '"><span class="f7c-in"><span class="f7c-f f7c-front">' + face(c, mini) + '</span></span></span>'; }

  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    hit: '<rect x="5" y="4" width="11" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M18 9v8M14 13h8" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    stop: '<path d="M8 3h8l5 5v8l-5 5H8l-5-5V8z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M8.5 12h7" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    snow: '<path d="M12 2v20M3.3 7l17.4 10M3.3 17L20.7 7" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    heart: '<path d="M12 20c-5-4-8-6.7-8-10.2C4 7 6 5 8.3 5c1.6 0 2.9.9 3.7 2.2C12.8 5.9 14.1 5 15.7 5 18 5 20 7 20 9.8 20 13.3 17 16 12 20z" fill="currentColor"/>',
    star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>',
    bolt: '<path d="M13 2L4 14h7l-1 8 9-12h-7z" fill="currentColor"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    deal: '<path d="M4 7h11l-3-3M20 17H9l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  return { defs: defs, face: face, back: back, card: card, flat: flat, lab: lab, key: key, icon: icon, COL: COL, INK: INK };
})();
