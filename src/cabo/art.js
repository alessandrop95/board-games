/* ===== Cabo: carte disegnate da zero (tema: il mare di notte e il faro sul capo) e icone =====
   Le fasce di colore aiutano a leggere il tavolo a colpo d'occhio:
   perla (0), laguna (1–4), mare aperto (5–8), burrasca (9–12), kraken (13).
   Le carte con un potere (7–12) hanno un nastro in basso: occhio = Sbircia, cannocchiale = Spia, frecce = Scambia. */
var CBArt = (function () {
  function band(v) { return v === 0 ? 'pearl' : v <= 4 ? 'low' : v <= 8 ? 'mid' : v <= 12 ? 'high' : 'kraken'; }
  var INK = { pearl: '#0c5560', low: '#0f5e4a', mid: '#123f7a', high: '#3a1d6b', kraken: '#6b0f1a' };
  var NAME = { pearl: 'perla', low: 'laguna', mid: 'mare aperto', high: 'burrasca', kraken: 'kraken' };
  function lab(v) { return String(v); }
  function power(v) { return v === 7 || v === 8 ? 'peek' : v === 9 || v === 10 ? 'spy' : v === 11 || v === 12 ? 'trade' : null; }
  var PLAB = { peek: 'SBIRCIA', spy: 'SPIA', trade: 'SCAMBIA' };

  function defs() {
    function lg(id, a, b, c) { return '<linearGradient id="' + id + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + a + '"/>' + (c ? '<stop offset=".55" stop-color="' + c + '"/>' : '') + '<stop offset="1" stop-color="' + b + '"/></linearGradient>'; }
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      lg('cb-b-pearl', '#e9fbff', '#5fc9d6', '#a8ecf2') + lg('cb-b-low', '#9ff0d0', '#1f9c7a', '#4fd0a6') + lg('cb-b-mid', '#8cc6ff', '#1d4fae', '#3f86e6') +
      lg('cb-b-high', '#a98ae6', '#2a1257', '#5b33a8') + lg('cb-b-kraken', '#ff7a6b', '#4a0710', '#a3172a') +
      lg('cb-back', '#173a73', '#050f26', '#0c2350') + lg('cb-beam', '#fff6c8', '#fff6c8') + lg('cb-tower', '#ffffff', '#cfd8e6') +
      '<radialGradient id="cb-pearl" cx=".38" cy=".35" r=".7"><stop offset="0" stop-color="#ffffff"/><stop offset=".6" stop-color="#f3eef8"/><stop offset="1" stop-color="#c9bfd8"/></radialGradient>' +
      '<radialGradient id="cb-glow" cx=".5" cy=".5" r=".5"><stop offset="0" stop-color="#fff" stop-opacity=".6"/><stop offset="1" stop-color="#fff" stop-opacity="0"/></radialGradient>' +
      '<radialGradient id="cb-moon" cx=".4" cy=".35" r=".7"><stop offset="0" stop-color="#fffbe6"/><stop offset="1" stop-color="#e9d58a"/></radialGradient>' +
      '<linearGradient id="cb-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
      '<clipPath id="cb-clip"><rect x="6" y="6" width="88" height="128" rx="8"/></clipPath>' +
      '</defs></svg>';
  }

  /* ---------- motivi ---------- */
  function waves(y, col, op, amp) { amp = amp || 5; return '<path d="M6 ' + y + ' q11 -' + amp + ' 22 0 t22 0 t22 0 t22 0 V134 H6Z" fill="' + col + '" opacity="' + op + '"/>'; }
  function fish(x, y, s, col, flip) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + (flip ? -s : s) + ' ' + s + ')"><path d="M-8 0 Q-2 -6 6 0 Q-2 6 -8 0Z M6 0 L11 -4 L11 4Z" fill="' + col + '"/><circle cx="-4" cy="-1" r=".9" fill="#082a2a"/></g>'; }
  function star(x, y, r, op) { return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="#fff6c8" opacity="' + (op || .85) + '"/>'; }
  function boat(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')"><path d="M-14 0 H14 L9 6 H-9Z" fill="#5b3a1a"/><path d="M0 -1 V-26" stroke="#3b2510" stroke-width="1.4"/><path d="M1 -25 L14 -3 H1Z" fill="#fff"/><path d="M-1 -22 L-11 -3 H-1Z" fill="#ffe7b0"/></g>'; }
  function motif(b) {
    var o = '';
    if (b === 'pearl') {
      o += '<circle cx="50" cy="66" r="40" fill="url(#cb-glow)"/>';
      o += '<path d="M18 92 Q50 52 82 92 Q66 100 50 98 Q34 100 18 92Z" fill="#f6c8d8" stroke="#c46a8e" stroke-width="1.2"/>';
      for (var i = 0; i < 6; i++) o += '<path d="M50 96 L' + (24 + i * 10.4) + ' ' + (88 - Math.abs(i - 2.5) * 5) + '" stroke="#c46a8e" stroke-width=".8" opacity=".6"/>';
      o += '<circle cx="50" cy="80" r="12" fill="url(#cb-pearl)" stroke="#fff" stroke-width="1"/>';
      o += waves(116, '#2ea7b8', .5, 4) + waves(124, '#1b8a9c', .6, 3);
    } else if (b === 'low') {
      o += '<circle cx="76" cy="26" r="8" fill="#fff6c8" opacity=".85"/>' + waves(96, '#16a385', .55) + waves(108, '#0f8a70', .7) + waves(120, '#0a6e5a', .85);
      o += fish(30, 112, 1, '#ffb347') + fish(66, 124, .8, '#ff7a6b', true) + fish(46, 100, .7, '#ffe066');
      o += '<path d="M14 134 Q16 118 12 106 M20 134 Q24 120 22 110" stroke="#0a5a48" stroke-width="2" fill="none" stroke-linecap="round"/>';
    } else if (b === 'mid') {
      o += '<circle cx="74" cy="28" r="10" fill="url(#cb-moon)"/>' + star(20, 20, 1.4) + star(36, 34, 1) + star(56, 16, 1.2);
      o += waves(98, '#2a6fd0', .55, 6) + waves(110, '#1d55ad', .75, 6) + waves(122, '#123f7a', .9, 5) + boat(36, 98, .9);
    } else if (b === 'high') {
      o += '<path d="M6 6 H94 V44 Q70 54 50 46 T6 44Z" fill="#1a0a3a" opacity=".55"/>';
      o += '<path d="M80 22 L72 40 L79 40 L71 58 L88 34 L81 34 L88 22Z" fill="#ffe14d" stroke="#fff6c0" stroke-width="1" stroke-linejoin="round"/>';
      o += waves(94, '#4a2a92', .6, 10) + waves(108, '#3a1d78', .8, 9) + waves(120, '#2a1257', .95, 8);
      for (var k = 0; k < 7; k++) o += '<path d="M' + (14 + k * 11) + ' ' + (60 + (k % 3) * 6) + ' l-4 12" stroke="#d8ccff" stroke-width="1.4" stroke-linecap="round" opacity=".5"/>';
    } else {
      o += waves(112, '#4a0710', .8, 6);
      o += '<path d="M12 134 Q8 104 24 92 Q36 84 30 72 Q26 64 34 62" fill="none" stroke="#e8495a" stroke-width="7" stroke-linecap="round"/>';
      o += '<path d="M88 134 Q94 100 76 88 Q64 80 70 66 Q74 58 66 54" fill="none" stroke="#e8495a" stroke-width="6" stroke-linecap="round"/>';
      for (var s = 0; s < 5; s++) o += '<circle cx="' + (22 + s * 2) + '" cy="' + (120 - s * 10) + '" r="1.6" fill="#ffd0d4"/>';
      o += '<circle cx="50" cy="30" r="5" fill="#ffd75e"/><circle cx="50" cy="30" r="2.2" fill="#1a0306"/>';
    }
    return o;
  }

  /* ---------- poteri ---------- */
  var PIC = {
    peek: '<path d="M2 12s4-7 10-7 10 7 10 7-4 7-10 7S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2.2"/><circle cx="12" cy="12" r="3.4" fill="currentColor"/>',
    spy: '<path d="M3 15 L14 8 L17 12 L6 19Z" fill="currentColor"/><path d="M15 7.5 L19.5 4.7 L22 9 L17.6 11.6Z" fill="currentColor"/><path d="M9 17 L8 22 M10 16.5 L13 21" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/>',
    trade: '<path d="M4 8h14m0 0l-4-4m4 4l-4 4M20 16H6m0 0l4-4m-4 4l4 4" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function picon(k) { return '<svg class="ic pic" viewBox="0 0 24 24" aria-hidden="true">' + (PIC[k] || '') + '</svg>'; }

  /* ---------- carta ---------- */
  var cache = {};
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  function num(x, y, size, v, b) {
    var t = lab(v), sw = size * .15;
    return '<text x="' + x + '" y="' + y + '" text-anchor="middle" ' + FONT + ' font-size="' + size + '" fill="' + INK[b] + '" opacity=".45" transform="translate(' + (size * .04).toFixed(1) + ' ' + (size * .06).toFixed(1) + ')">' + t + '</text>' +
      '<text x="' + x + '" y="' + y + '" text-anchor="middle" ' + FONT + ' font-size="' + size + '" fill="#fff" stroke="' + INK[b] + '" stroke-width="' + sw.toFixed(1) + '" stroke-linejoin="round" paint-order="stroke">' + t + '</text>';
  }
  function face(v, mini) {
    var key = v + (mini ? 'm' : ''); if (cache[key]) return cache[key];
    var b = band(v), pw = power(v), o = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true">' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#cb-b-' + b + ')"/>' +
      '<g clip-path="url(#cb-clip)">' + motif(b) + '</g>' +
      '<rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>';
    if (mini) o += num(50, pw ? 80 : 90, v > 9 ? 56 : 64, v, b) + (pw ? '<g transform="translate(36 96) scale(1.15)" color="#fff" style="color:#fff">' + PIC[pw] + '</g>' : '');
    else {
      o += num(50, pw ? 80 : 90, v > 9 ? 48 : 56, v, b) + num(16, 27, 19, v, b) + '<g transform="rotate(180 50 70)">' + num(16, 27, 19, v, b) + '</g>';
      if (pw) o += '<rect x="14" y="98" width="64" height="20" rx="10" fill="#071a3a" fill-opacity=".75" stroke="#fff" stroke-opacity=".6"/><g transform="translate(18 102) scale(.5)" color="#ffd75e" style="color:#ffd75e">' + PIC[pw] + '</g>' +
        '<text x="32" y="112" ' + FONT + ' font-size="' + (pw === 'trade' ? 9.5 : 10.5) + '" letter-spacing=".3" fill="#ffd75e">' + PLAB[pw] + '</text>';
    }
    o += '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#cb-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="' + INK[b] + '" stroke-opacity=".7" stroke-width="2"/></svg>';
    return (cache[key] = o);
  }
  // il faro sul capo (dorso, intestazione, fine partita)
  function lighthouse(x, y, s, beam) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' +
      (beam ? '<path d="M0 -22 L-46 -38 L-46 -10Z" fill="url(#cb-beam)" opacity=".28"/><path d="M0 -22 L46 -36 L46 -12Z" fill="url(#cb-beam)" opacity=".18"/>' : '') +
      '<path d="M-14 26 Q0 16 14 26 L18 30 H-18Z" fill="#1d2b44"/>' +
      '<path d="M-7 24 L-5 -14 H5 L7 24Z" fill="url(#cb-tower)"/><path d="M-6.4 12 H6.4 L6.7 17 H-6.7Z M-5.6 -2 H5.6 L5.9 3 H-5.9Z" fill="#e8495a"/>' +
      '<rect x="-7" y="-16" width="14" height="3" rx="1" fill="#2a3a56"/><rect x="-4.5" y="-24" width="9" height="8" rx="1" fill="#fff3b0" stroke="#2a3a56" stroke-width="1"/>' +
      '<path d="M-6 -24 L0 -30 L6 -24Z" fill="#e8495a"/><circle cx="0" cy="-20" r="5" fill="url(#cb-glow)"/></g>';
  }
  var backCache = null, backMini = null;
  function back(mini) {
    if (mini) return backMini || (backMini = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#cb-back)"/>' +
      '<rect x="7" y="7" width="86" height="126" rx="8" fill="none" stroke="#ffd75e" stroke-opacity=".8" stroke-width="4"/>' + lighthouse(50, 74, 1.7, true) + '<rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#020814" stroke-width="3"/></svg>');
    if (backCache) return backCache;
    var st = ''; [[16, 18, 1.2], [30, 30, .8], [80, 20, 1], [70, 36, .7], [88, 48, .9], [14, 44, .8]].forEach(function (q) { st += star(q[0], q[1], q[2], .7); });
    return (backCache = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#cb-back)"/>' +
      '<g clip-path="url(#cb-clip)">' + st + '<circle cx="78" cy="26" r="7" fill="url(#cb-moon)" opacity=".9"/>' + waves(96, '#0f2f66', .9, 4) + waves(106, '#0a2350', 1, 4) + '</g>' +
      '<rect x="6" y="6" width="88" height="128" rx="8" fill="none" stroke="#ffd75e" stroke-opacity=".75" stroke-width="1.6"/>' + lighthouse(50, 68, 1.25, true) +
      '<text x="50" y="124" text-anchor="middle" ' + FONT + ' font-size="19" letter-spacing="3" fill="#ffd75e" stroke="#050f26" stroke-width="2.4" paint-order="stroke">CABO</text>' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#cb-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#020814" stroke-width="2"/></svg>');
  }
  // carta completa con le due facce (per girarla in 3D): up = scoperta
  function card(v, up, o) {
    o = o || {};
    return '<span class="skc' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + (v != null ? ' b-' + band(v) : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back(o.mini) + '</span><span class="skc-f skc-front">' + (v != null ? face(v, o.mini) : '') + '</span></span></span>';
  }
  function flat(v, mini) { return '<span class="skc up flat b-' + band(v) + '"><span class="skc-in"><span class="skc-f skc-front">' + face(v, mini) + '</span></span></span>'; }

  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    flag: '<path d="M5 21V4M5 4h11l-2 4 2 4H5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    eye: PIC.peek, spy: PIC.spy, trade: PIC.trade,
    bell: '<path d="M6 16V11a6 6 0 0 1 12 0v5l2 2H4z" fill="currentColor"/><path d="M10 20a2 2 0 0 0 4 0" fill="none" stroke="currentColor" stroke-width="2"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  return { defs: defs, face: face, back: back, card: card, flat: flat, band: band, lab: lab, icon: icon, picon: picon, lighthouse: lighthouse, power: power, PLAB: PLAB, NAME: NAME };
})();
