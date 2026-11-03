/* ===== Skyjo: carte disegnate da zero (fronte per fasce di valore, dorso con la mongolfiera) e icone =====
   Le fasce di colore aiutano a leggere il tavolo a colpo d'occhio:
   notte (−2, −1), nuvole (0), colline (1–4), sole (5–8), temporale (9–12). */
var SKArt = (function () {
  function band(v) { return v < 0 ? 'neg' : v === 0 ? 'zero' : v <= 4 ? 'low' : v <= 8 ? 'mid' : 'high'; }
  var INK = { neg: '#1c1650', zero: '#0f5f84', low: '#1d6a2e', mid: '#8a5a00', high: '#7e1d16' };
  var NAME = { neg: 'notte', zero: 'nuvole', low: 'colline', mid: 'sole', high: 'temporale' };
  function lab(v) { return v < 0 ? '−' + (-v) : String(v); }

  // sfumature e motivi comuni (una volta sola nella pagina)
  function defs() {
    function lg(id, a, b, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".55" stop-color="' + c + '"/>' : '') + '<stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      lg('sk-b-neg', '#3b2f9a', '#150f45', '#2a2179') + lg('sk-b-zero', '#8fe3ff', '#2aa3d8', '#55c4ee') + lg('sk-b-low', '#a6e57a', '#2f9a48', '#62c35a') +
      lg('sk-b-mid', '#fff1a0', '#f0a91c', '#ffd34d') + lg('sk-b-high', '#ff9a6e', '#c22a22', '#ef5a3e') +
      lg('sk-back', '#2d6fd6', '#0d2a6b', '#1c4ea8') + lg('sk-balloon', '#ff6b4a', '#c0261d') + lg('sk-balloon2', '#ffd75e', '#e89b12') + lg('sk-basket', '#b07a3e', '#6b4520') +
      '<radialGradient id="sk-sun" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff8d0"/><stop offset=".55" stop-color="#ffe066"/><stop offset="1" stop-color="#ffb000"/></radialGradient>' +
      '<radialGradient id="sk-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".55"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="sk-moon" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#e9d58a"/></radialGradient>' +
      '<linearGradient id="sk-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".5"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".12"/></linearGradient>' +
      '<clipPath id="sk-clip"><rect x="6" y="6" width="88" height="128" rx="8"/></clipPath>' +
      '</defs></svg>';
  }

  /* ---------- motivi delle fasce ---------- */
  function cloud(x, y, s, fill, op) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')" opacity="' + (op == null ? 1 : op) + '"><path d="M-22 6a10 10 0 0 1 4-18a13 13 0 0 1 24-4a10 10 0 0 1 16 8a8 8 0 0 1-2 14z" fill="' + (fill || '#fff') + '"/></g>';
  }
  function sparkle(x, y, r, op) { return '<path d="M' + x + ' ' + (y - r) + 'Q' + (x + r * .18) + ' ' + (y - r * .18) + ' ' + (x + r) + ' ' + y + 'Q' + (x + r * .18) + ' ' + (y + r * .18) + ' ' + x + ' ' + (y + r) + 'Q' + (x - r * .18) + ' ' + (y + r * .18) + ' ' + (x - r) + ' ' + y + 'Q' + (x - r * .18) + ' ' + (y - r * .18) + ' ' + x + ' ' + (y - r) + 'Z" fill="#fff6c8" opacity="' + (op || .9) + '"/>'; }
  function motif(b, v) {
    var o = '';
    if (b === 'neg') {
      o += '<circle cx="74" cy="30" r="13" fill="url(#sk-moon)"/><circle cx="80" cy="25" r="11" fill="#2a2179"/>';
      [[20, 22, 3.2], [36, 14, 2], [58, 40, 2.4], [16, 50, 1.6], [84, 58, 2.2], [30, 118, 2.2], [76, 120, 3], [12, 96, 1.8], [88, 98, 1.6], [54, 126, 1.6]].forEach(function (s) { o += sparkle(s[0], s[1], s[2] * 1.6, .85); });
      o += '<path d="M6 134 L6 118 Q28 110 50 118 T94 114 L94 134Z" fill="#100b36" opacity=".8"/>';
    } else if (b === 'zero') {
      o += '<circle cx="78" cy="26" r="26" fill="url(#sk-glow)"/>' + cloud(30, 30, .8, '#fff', .85) + cloud(78, 112, 1.2, '#fff', .95) + cloud(26, 124, 1, '#e8f8ff', .95) + cloud(60, 128, .9, '#fff', 1);
    } else if (b === 'low') {
      o += '<circle cx="76" cy="28" r="9" fill="#fff5b0" opacity=".9"/>' + cloud(28, 28, .55, '#fff', .8);
      o += '<path d="M6 112 Q30 92 56 108 T94 100 L94 134 L6 134Z" fill="#2c8a3e"/><path d="M6 124 Q40 104 70 120 T94 116 L94 134 L6 134Z" fill="#1f6d2f"/>';
      o += '<g transform="translate(76 100)"><rect x="-1.2" y="0" width="2.4" height="8" fill="#5b3a1a"/><circle cx="0" cy="-2" r="6" fill="#1b5e2a"/><circle cx="-3" cy="0" r="4" fill="#24733a"/></g>';
      [[22, 122], [34, 128], [46, 120]].forEach(function (f) { o += '<circle cx="' + f[0] + '" cy="' + f[1] + '" r="1.8" fill="#ffe36b"/><circle cx="' + f[0] + '" cy="' + f[1] + '" r=".8" fill="#e86a1f"/>'; });
    } else if (b === 'mid') {
      var rays = ''; for (var i = 0; i < 16; i++) { var a = i * Math.PI / 8; rays += '<path d="M50 74 L' + (50 + Math.cos(a - .09) * 90).toFixed(1) + ' ' + (74 + Math.sin(a - .09) * 90).toFixed(1) + ' L' + (50 + Math.cos(a + .09) * 90).toFixed(1) + ' ' + (74 + Math.sin(a + .09) * 90).toFixed(1) + 'Z" fill="#fff" opacity=".22"/>'; }
      o += rays + '<circle cx="50" cy="74" r="34" fill="url(#sk-sun)" opacity=".85"/><circle cx="50" cy="74" r="34" fill="none" stroke="#fff" stroke-opacity=".5" stroke-width="1.5"/>';
    } else {
      o += '<path d="M6 6 H94 V50 Q70 58 50 50 T6 48Z" fill="#6b1410" opacity=".35"/>' + cloud(34, 28, 1.3, '#5a2a3a', .9) + cloud(70, 22, 1.1, '#6e3346', .9);
      o += '<path d="M84 30 L77 46 L83 46 L76 62 L90 42 L84 42 L90 30Z" fill="#ffe14d" stroke="#fff6c0" stroke-width="1" stroke-linejoin="round"/>';
      for (var k = 0; k < 9; k++) o += '<path d="M' + (14 + k * 9) + ' ' + (104 + (k % 3) * 6) + ' l-4 10" stroke="#ffd2c4" stroke-width="1.6" stroke-linecap="round" opacity=".55"/>';
    }
    return o;
  }

  /* ---------- carta ---------- */
  var cache = {};
  function num(x, y, size, v, b, anchor) {
    var t = lab(v), sw = size * .16;
    return '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="\'Baloo 2\',Nunito,system-ui,sans-serif" font-weight="800" font-size="' + size + '" fill="' + INK[b] + '" opacity=".45" transform="translate(' + (size * .04).toFixed(1) + ' ' + (size * .06).toFixed(1) + ')">' + t + '</text>' +
      '<text x="' + x + '" y="' + y + '" text-anchor="' + (anchor || 'middle') + '" font-family="\'Baloo 2\',Nunito,system-ui,sans-serif" font-weight="800" font-size="' + size + '" fill="#fff" stroke="' + INK[b] + '" stroke-width="' + sw.toFixed(1) + '" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';
  }
  function face(v, mini) {
    var key = v + (mini ? 'm' : ''); if (cache[key]) return cache[key];
    var b = band(v), o = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true">' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sk-b-' + b + ')"/>' +
      '<g clip-path="url(#sk-clip)">' + motif(b, v) + '</g>' +
      '<rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>';
    if (mini) o += num(50, 92, 66, v, b);
    else o += num(50, 92, 56, v, b) + num(15, 27, 19, v, b) + '<g transform="rotate(180 50 70)">' + num(15, 27, 19, v, b) + '</g>';
    o += '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sk-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="' + INK[b] + '" stroke-opacity=".7" stroke-width="2"/></svg>';
    return (cache[key] = o);
  }
  function balloon(x, y, s) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      '<path d="M0 -30 C20 -30 26 -12 18 2 C13 10 7 14 5 20 L-5 20 C-7 14 -13 10 -18 2 C-26 -12 -20 -30 0 -30Z" fill="url(#sk-balloon)"/>' +
      '<path d="M0 -30 C9 -30 11 -12 8 2 C6 10 3 14 2.4 20 L-2.4 20 C-3 14 -6 10 -8 2 C-11 -12 -9 -30 0 -30Z" fill="url(#sk-balloon2)"/>' +
      '<path d="M-12 -22 C-16 -12 -14 -2 -9 6" fill="none" stroke="#fff" stroke-opacity=".45" stroke-width="2.4" stroke-linecap="round"/>' +
      '<path d="M-5 20 L-4 27 M5 20 L4 27" stroke="#5b3a1a" stroke-width="1"/><rect x="-5" y="27" width="10" height="7" rx="1.5" fill="url(#sk-basket)" stroke="#4a2c10" stroke-width=".8"/></g>';
  }
  var backCache = null, backMini = null;
  function back(mini) {
    if (mini) return backMini || (backMini = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sk-back)"/>' +
      '<rect x="7" y="7" width="86" height="126" rx="8" fill="none" stroke="#ffd75e" stroke-opacity=".8" stroke-width="4"/>' + balloon(50, 66, 1.45) + '<rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#0a1f50" stroke-width="3"/></svg>');
    if (backCache) return backCache;
    var c = '';
    [[14, 22, .4], [70, 16, .35], [84, 60, .3], [10, 84, .35], [62, 104, .3], [24, 128, .4], [86, 124, .32]].forEach(function (q) { c += cloud(q[0], q[1], q[2], '#fff', .16); });
    return (backCache = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sk-back)"/>' +
      '<g clip-path="url(#sk-clip)">' + c + '</g>' +
      '<rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#ffd75e" stroke-opacity=".75" stroke-width="1.6"/><rect x="10" y="10" width="80" height="120" rx="6" fill="none" stroke="#fff" stroke-opacity=".2" stroke-width="1" stroke-dasharray="3 3"/>' +
      '<ellipse cx="50" cy="62" rx="30" ry="34" fill="#0d2a6b" stroke="#ffd75e" stroke-width="1.6"/><ellipse cx="50" cy="62" rx="30" ry="34" fill="url(#sk-glow)" opacity=".35"/>' +
      balloon(50, 62, .95) +
      '<text x="50" y="118" text-anchor="middle" font-family="\'Baloo 2\',Nunito,sans-serif" font-weight="800" font-size="17" letter-spacing="2" fill="#ffd75e" stroke="#0d2a6b" stroke-width="2.4" paint-order="stroke">SKYJO</text>' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sk-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#0a1f50" stroke-width="2"/></svg>');
  }
  // carta completa con le due facce (per girarla in 3D): up = scoperta
  function card(v, up, o) {
    o = o || {};
    return '<span class="skc' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + (v != null ? ' b-' + band(v) : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back(o.mini) + '</span><span class="skc-f skc-front">' + (v != null ? face(v, o.mini) : '') + '</span></span></span>';
  }
  function flat(v, mini) { return '<span class="skc up flat b-' + band(v) + '"><span class="skc-in"><span class="skc-f skc-front">' + face(v, mini) + '</span></span></span>'; }

  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3.5h10a2 2 0 0 1 2 2V18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    grid: '<rect x="3" y="4" width="18" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M7.5 4v16M12 4v16M16.5 4v16M3 9.3h18M3 14.7h18" stroke="currentColor" stroke-width="1.4"/>',
    star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    trophy: '<path d="M8 4h8v5a4 4 0 0 1-8 0zM8 6H4.5a3 3 0 0 0 3.5 4M16 6h3.5a3 3 0 0 1-3.5 4M12 13v4M8 20h8M9.5 17h5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    eye: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3" fill="none" stroke="currentColor" stroke-width="2"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  return { defs: defs, face: face, back: back, card: card, flat: flat, band: band, lab: lab, icon: icon, balloon: balloon, cloud: cloud, NAME: NAME };
})();
