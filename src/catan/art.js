/* ===== Catan: disegni originali (risorse, carte, dadi, pezzi, gettoni, ladro, icone) ===== */
var CTArt = (function () {
  var D = CTData;
  var RC = {   // colori delle risorse: fondo carta, scuro, chiaro
    brick: { c: '#c0572f', d: '#6e2812', l: '#f0a27a' }, wood: { c: '#2f6b33', d: '#173a1a', l: '#88c070' },
    wool: { c: '#8cc451', d: '#466e1f', l: '#d9f0ae' }, grain: { c: '#e5b53b', d: '#8a6411', l: '#fbe7a0' }, ore: { c: '#6d7987', d: '#323a44', l: '#c6d0db' }
  };

  /* ---------- simboli delle risorse (viewBox -50..50) ---------- */
  var RICON = {
    brick: function () {
      var h = '', rows = [[-30, 14, 3], [-30, -2, 2], [-30, -18, 1]];
      // mattoni a piramide
      [[0, 3], [1, 2], [2, 1]].forEach(function (rw, ri) {
        for (var i = 0; i < rw[1]; i++) {
          var x = -33 + ri * 11 + i * 22, y = 12 - ri * 15;
          h += '<rect x="' + x + '" y="' + y + '" width="21" height="13" rx="2" fill="#c9532c" stroke="#5e200d" stroke-width="2"/><rect x="' + (x + 2) + '" y="' + (y + 2) + '" width="17" height="3" rx="1" fill="#f19a70"/>' +
            '<circle cx="' + (x + 7) + '" cy="' + (y + 8) + '" r="1.2" fill="#7a2c12"/><circle cx="' + (x + 14) + '" cy="' + (y + 9) + '" r="1" fill="#7a2c12"/>';
        }
      });
      return h + '<path d="M-36 27h72" stroke="#5e200d" stroke-width="3" stroke-linecap="round"/>';
    },
    wood: function () {
      function log(x, y) { return '<rect x="' + (x - 26) + '" y="' + (y - 9) + '" width="44" height="18" rx="4" fill="#8a5a2c" stroke="#4a2b10" stroke-width="2"/><path d="M' + (x - 22) + ' ' + (y - 3) + 'h30M' + (x - 18) + ' ' + (y + 3) + 'h26" stroke="#5f3b18" stroke-width="1.6" stroke-linecap="round"/>' +
        '<ellipse cx="' + (x + 18) + '" cy="' + y + '" rx="8" ry="9" fill="#e2b77a" stroke="#4a2b10" stroke-width="2"/><ellipse cx="' + (x + 18) + '" cy="' + y + '" rx="4.6" ry="5.4" fill="none" stroke="#a7783f" stroke-width="1.3"/><circle cx="' + (x + 18) + '" cy="' + y + '" r="1.6" fill="#a7783f"/>'; }
      return log(2, 21) + log(-3, 3) + log(5, -15) +
        '<path d="M-26-24c2-8 8-12 14-12" fill="none" stroke="#3f8a3a" stroke-width="2.4" stroke-linecap="round"/><path d="M-14-36c4-3 10-1 11 4-5 1-10-1-11-4z" fill="#4f9a44"/>';
    },
    wool: function () {
      var h = '', puffs = [[-16, 0, 13], [0, -8, 15], [16, 0, 13], [-6, 10, 12], [10, 11, 12], [-22, 10, 9], [22, 10, 9]];
      h += '<path d="M-14 20v12M-4 22v12M8 22v12M18 20v12" stroke="#2b2622" stroke-width="4.5" stroke-linecap="round"/>';
      puffs.forEach(function (p) { h += '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + p[2] + '" fill="#fbf8ef" stroke="#a69c84" stroke-width="1.6"/>'; });
      puffs.forEach(function (p) { h += '<circle cx="' + (p[0] - p[2] * .3) + '" cy="' + (p[1] - p[2] * .3) + '" r="' + p[2] * .45 + '" fill="#fff"/>'; });
      return h + '<ellipse cx="31" cy="-6" rx="11" ry="9" fill="#2b2622" transform="rotate(20 31 -6)"/><ellipse cx="25" cy="-13" rx="5" ry="2.6" fill="#2b2622" transform="rotate(-30 25 -13)"/><circle cx="34" cy="-8" r="1.8" fill="#fff"/>';
    },
    grain: function () {
      var h = '';
      [-16, -6, 4, 14].forEach(function (x, i) {
        var tilt = (i - 1.5) * 9;
        h += '<g transform="rotate(' + tilt + ' 0 34)"><path d="M' + (x * .4) + ' 34V-10" stroke="#9a6a14" stroke-width="2.4"/>';
        for (var k = 0; k < 6; k++) { var y = -30 + k * 6.5; h += '<ellipse cx="' + (x * .4 - 4) + '" cy="' + y + '" rx="3.6" ry="6" fill="#f0c043" stroke="#9a6a14" stroke-width="1.2" transform="rotate(-25 ' + (x * .4 - 4) + ' ' + y + ')"/><ellipse cx="' + (x * .4 + 4) + '" cy="' + y + '" rx="3.6" ry="6" fill="#f6cf58" stroke="#9a6a14" stroke-width="1.2" transform="rotate(25 ' + (x * .4 + 4) + ' ' + y + ')"/>'; }
        h += '<ellipse cx="' + (x * .4) + '" cy="-35" rx="3" ry="5.5" fill="#f6cf58" stroke="#9a6a14" stroke-width="1.2"/></g>';
      });
      return h + '<path d="M-14 12h28" stroke="#7a3d12" stroke-width="5" stroke-linecap="round"/>';
    },
    ore: function () {
      return '<path d="M-36 26L-26-6L-6-20L14-14L32 4L36 26Z" fill="#6f7884" stroke="#2c323a" stroke-width="2.4" stroke-linejoin="round"/>' +
        '<path d="M-26-6L-6-20L-2 4L-20 14Z" fill="#9aa4b0"/><path d="M-2 4L14-14L32 4L16 14Z" fill="#59626d"/><path d="M-20 14L-2 4L16 14L8 26H-30Z" fill="#7d8794"/>' +
        '<path d="M-8-6l6-12 6 10-4 10z" fill="#bcd7ee" stroke="#3a5a76" stroke-width="1.4"/><path d="M14 8l5-9 4 8-3 7z" fill="#bcd7ee" stroke="#3a5a76" stroke-width="1.2"/><path d="M-26 18l4-7 4 6-2 5z" fill="#e6c86a" stroke="#7a5a12" stroke-width="1.2"/>' +
        '<path d="M-6-18l3 3" stroke="#fff" stroke-width="1.6" stroke-linecap="round"/>';
    }
  };
  function resIcon(r, size) { return '<svg class="rico" viewBox="-42 -42 84 84" width="' + (size || 24) + '" height="' + (size || 24) + '" aria-hidden="true">' + RICON[r]() + '</svg>'; }
  // icona su un dischetto colorato (per le liste)
  function resDot(r, n) { return '<span class="rdot" style="--rc:' + RC[r].c + ';--rd:' + RC[r].d + '" title="' + D.RN1[r] + '">' + resIcon(r, 18) + (n != null ? '<b>' + n + '</b>' : '') + '</span>'; }
  function resRow(obj) { var h = ''; D.RES.forEach(function (r) { if (obj && obj[r]) h += resDot(r, obj[r]); }); return h || '<span class="muted">niente</span>'; }

  /* ---------- carte risorsa (100×140) ---------- */
  function resCard(r) {
    var k = RC[r];
    return '<svg class="ccard" viewBox="0 0 100 140" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="137" rx="9" fill="#f7efd8" stroke="#3b2a18" stroke-width="2"/>' +
      '<rect x="7" y="7" width="86" height="126" rx="6" fill="' + k.c + '"/><rect x="7" y="7" width="86" height="126" rx="6" fill="url(#ct-sheen)"/>' +
      '<circle cx="50" cy="60" r="35" fill="' + k.l + '" opacity=".45"/><g transform="translate(50 60) scale(.78)">' + RICON[r]() + '</g>' +
      '<rect x="12" y="106" width="76" height="20" rx="4" fill="rgba(255,250,235,.92)"/><text x="50" y="120.5" text-anchor="middle" class="ccard-t" fill="' + k.d + '">' + D.RN1[r].toUpperCase() + '</text></svg>';
  }

  /* ---------- carte sviluppo ---------- */
  var DICON = {
    knight: '<path d="M-22 26h44l-4-10h-36z" fill="#7a5a2a" stroke="#3a2a12" stroke-width="2"/><path d="M-16 16c-2-14 2-30 14-36 4-2 10-2 14 1l8 8-6 4 4 6-10 2c2 6 4 10 8 15z" fill="#c9ccd2" stroke="#2c323a" stroke-width="2.2" stroke-linejoin="round"/>' +
      '<path d="M-2-12h10" stroke="#2c323a" stroke-width="2.6"/><path d="M-4-26c-6-6-4-14 4-16 2 6 0 10-4 16z" fill="#b8352a" stroke="#5e1712" stroke-width="1.6"/><path d="M26-30L8 10" stroke="#8a8f96" stroke-width="3.4" stroke-linecap="round"/><path d="M20-14l10 4" stroke="#6b4a1e" stroke-width="3.6" stroke-linecap="round"/>',
    vp: '<path d="M-28 26h56M-24 20h48" stroke="#5a4520" stroke-width="4" stroke-linecap="round"/><path d="M-26-10L0-28L26-10Z" fill="#e8d6a6" stroke="#5a4520" stroke-width="2.4" stroke-linejoin="round"/><rect x="-24" y="-12" width="48" height="5" fill="#e8d6a6" stroke="#5a4520" stroke-width="2"/>' +
      '<path d="M-18-6v24M-6-6v24M6-6v24M18-6v24" stroke="#e8d6a6" stroke-width="6"/><path d="M-18-6v24M-6-6v24M6-6v24M18-6v24" stroke="#5a4520" stroke-width="1" opacity=".6"/><circle cx="0" cy="-17" r="4" fill="#d9a623" stroke="#5a4520" stroke-width="1.4"/>',
    road2: '<path d="M-30 18L-4-8" stroke="#6b4a26" stroke-width="12" stroke-linecap="round"/><path d="M-30 18L-4-8" stroke="#c8935a" stroke-width="7" stroke-linecap="round"/><path d="M4-8L30 18" stroke="#6b4a26" stroke-width="12" stroke-linecap="round"/><path d="M4-8L30 18" stroke="#c8935a" stroke-width="7" stroke-linecap="round"/>' +
      '<path d="M-8-30l16 16" stroke="#6b4a1e" stroke-width="4" stroke-linecap="round"/><path d="M-14-24l10-12 6 6-12 10z" fill="#8a8f96" stroke="#2c323a" stroke-width="1.8"/>',
    plenty: '<circle cx="0" cy="-6" r="20" fill="#f7e08a" stroke="#7a5a12" stroke-width="2.4"/><path d="M-8 14h16v8h-16z" fill="#8a8f96" stroke="#2c323a" stroke-width="2"/><path d="M-6 26h12" stroke="#2c323a" stroke-width="3" stroke-linecap="round"/>' +
      '<path d="M-6 12c0-8-6-10-6-18a12 12 0 0 1 24 0c0 8-6 10-6 18" fill="#fff6c4" stroke="#7a5a12" stroke-width="1.6"/><path d="M-4 0l4 6 4-6" fill="none" stroke="#b07a12" stroke-width="1.6"/>' +
      '<path d="M-30-14l-7-4M30-14l7-4M-26 6h-8M26 6h8M0-34v-6" stroke="#e0a81c" stroke-width="3" stroke-linecap="round"/>',
    mono: '<path d="M0-30v52" stroke="#5a4520" stroke-width="3.4"/><path d="M-26-20h52" stroke="#5a4520" stroke-width="3.4" stroke-linecap="round"/><path d="M-12 26h24" stroke="#5a4520" stroke-width="5" stroke-linecap="round"/><circle cx="0" cy="-30" r="4" fill="#d9a623" stroke="#5a4520" stroke-width="1.4"/>' +
      '<path d="M-26-20l-10 22h20z" fill="none" stroke="#5a4520" stroke-width="1.6"/><path d="M26-20l-10 22h20z" fill="none" stroke="#5a4520" stroke-width="1.6"/><path d="M-37 2a11 5 0 0 0 22 0z" fill="#e8c55a" stroke="#5a4520" stroke-width="1.8"/><path d="M15 2a11 5 0 0 0 22 0z" fill="#e8c55a" stroke="#5a4520" stroke-width="1.8"/>' +
      '<circle cx="-30" cy="-4" r="3.6" fill="#f0c043" stroke="#7a5a12"/><circle cx="-23" cy="-3" r="3.6" fill="#f0c043" stroke="#7a5a12"/><circle cx="-26" cy="-8" r="3.6" fill="#f0c043" stroke="#7a5a12"/>'
  };
  var DCOL = { knight: '#7b3b8f', vp: '#2f7a46', road2: '#2a6a9a', plenty: '#2a6a9a', mono: '#2a6a9a' };
  function devIcon(k, size) { return '<svg class="dico" viewBox="-42 -42 84 84" width="' + (size || 24) + '" height="' + (size || 24) + '" aria-hidden="true">' + DICON[k] + '</svg>'; }
  function devCard(k, sub) {
    var c = DCOL[k], name = D.DEVN[k], two = name.length > 12;
    return '<svg class="ccard" viewBox="0 0 100 140" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="137" rx="9" fill="#f7efd8" stroke="#3b2a18" stroke-width="2"/>' +
      '<rect x="7" y="7" width="86" height="22" rx="5" fill="' + c + '"/><text x="50" y="22.5" text-anchor="middle" class="ccard-k">' + (k === 'knight' ? 'CAVALIERE' : k === 'vp' ? 'PUNTO VITTORIA' : 'PROGRESSO') + '</text>' +
      '<rect x="7" y="32" width="86" height="64" rx="5" fill="#efe1bb"/><g transform="translate(50 64) scale(.82)">' + DICON[k] + '</g>' +
      (two ? '<text x="50" y="112" text-anchor="middle" class="ccard-n">' + esc(name.split(' ').slice(0, 2).join(' ')) + '</text><text x="50" y="125" text-anchor="middle" class="ccard-n">' + esc(name.split(' ').slice(2).join(' ')) + '</text>'
        : '<text x="50" y="117" text-anchor="middle" class="ccard-n">' + esc(name) + '</text>') + (sub ? '<text x="50" y="133" text-anchor="middle" class="ccard-s">' + esc(sub) + '</text>' : '') + '</svg>';
  }
  function devBack() {
    return '<svg class="ccard" viewBox="0 0 100 140" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="137" rx="9" fill="#3a2a5c" stroke="#1b1230" stroke-width="2"/><rect x="8" y="8" width="84" height="124" rx="6" fill="none" stroke="#d9b45a" stroke-width="1.6"/>' +
      '<path d="M50 30L76 70L50 110L24 70Z" fill="#4c3a78" stroke="#d9b45a" stroke-width="2"/><circle cx="50" cy="70" r="13" fill="#d9b45a"/><path d="M50 61v18M41 70h18" stroke="#3a2a5c" stroke-width="3.4" stroke-linecap="round"/>' +
      '<text x="50" y="126" text-anchor="middle" class="ccard-k" fill="#d9b45a">SVILUPPO</text></svg>';
  }
  function resBack() {
    return '<svg class="ccard" viewBox="0 0 100 140" aria-hidden="true"><rect x="1.5" y="1.5" width="97" height="137" rx="9" fill="#245a7a" stroke="#0d2a3a" stroke-width="2"/><rect x="8" y="8" width="84" height="124" rx="6" fill="none" stroke="#e8d6a6" stroke-width="1.4"/>' +
      '<path d="M50 34l28 16v32l-28 16-28-16v-32z" fill="#e4cc8e" stroke="#e8d6a6" stroke-width="2"/><path d="M50 44l19 11v22l-19 11-19-11v-22z" fill="#2f6b33"/></svg>';
  }

  /* ---------- dadi ---------- */
  var PIPS = { 1: [[0, 0]], 2: [[-1, -1], [1, 1]], 3: [[-1, -1], [0, 0], [1, 1]], 4: [[-1, -1], [1, -1], [-1, 1], [1, 1]], 5: [[-1, -1], [1, -1], [0, 0], [-1, 1], [1, 1]], 6: [[-1, -1], [1, -1], [-1, 0], [1, 0], [-1, 1], [1, 1]] };
  function die(n, red, size) {
    var bg = red ? '#c23a2e' : '#f6efdc', pip = red ? '#fff3df' : '#2a2018', h = '';
    (PIPS[n] || []).forEach(function (p) { h += '<circle cx="' + (p[0] * 11) + '" cy="' + (p[1] * 11) + '" r="4.6" fill="' + pip + '"/>'; });
    return '<svg class="die" viewBox="-22 -22 44 44" width="' + (size || 40) + '" height="' + (size || 40) + '" aria-label="' + n + '"><rect x="-20" y="-20" width="40" height="40" rx="8" fill="' + bg + '" stroke="rgba(0,0,0,.45)" stroke-width="1.6"/><rect x="-17" y="-18" width="34" height="8" rx="4" fill="rgba(255,255,255,.22)"/>' + h + '</svg>';
  }

  /* ---------- pezzi dei giocatori ---------- */
  function settleShape(p) { var k = D.PCOL[p]; return '<path d="M-9 8V-2L0-10.5L9-2V8Z" fill="' + k.c + '" stroke="' + k.d + '" stroke-width="1.8" stroke-linejoin="round"/><path d="M-9-2L0-10.5L9-2" fill="none" stroke="' + k.l + '" stroke-width="1.2" opacity=".75"/><rect x="-2.4" y="1.5" width="4.8" height="6.5" fill="' + k.d + '" opacity=".55"/>'; }
  function cityShape(p) { var k = D.PCOL[p]; return '<path d="M-14 9V-3H-3V-10L3.5-16L10-10V9Z" fill="' + k.c + '" stroke="' + k.d + '" stroke-width="1.8" stroke-linejoin="round"/><path d="M-14-3H-3M-3-10L3.5-16L10-10" fill="none" stroke="' + k.l + '" stroke-width="1.2" opacity=".75"/>' +
    '<rect x="1" y="-6" width="5" height="5" rx="1" fill="' + k.d + '" opacity=".55"/><rect x="-10" y="1" width="4.4" height="8" fill="' + k.d + '" opacity=".55"/><rect x="1" y="2" width="5" height="7" fill="' + k.d + '" opacity=".55"/>'; }
  function piece(kind, p, size) {
    var body = kind === 'city' ? cityShape(p) : kind === 'road' ? '<rect x="-14" y="-4" width="28" height="8" rx="2" fill="' + D.PCOL[p].c + '" stroke="' + D.PCOL[p].d + '" stroke-width="1.8" transform="rotate(-30)"/>' : settleShape(p);
    return '<svg class="pico" viewBox="-17 -19 34 32" width="' + (size || 24) + '" height="' + Math.round((size || 24) * 32 / 34) + '" aria-hidden="true">' + body + '</svg>';
  }
  function pieceIcon(p, size) { return piece('settle', p, size); }

  /* ---------- gettoni numero, porti, ladro ---------- */
  function token(n) {
    var hot = n === 6 || n === 8, col = hot ? '#b3261e' : '#2a2018', pips = D.PIPS[n], dots = '';
    for (var i = 0; i < pips; i++) dots += '<circle cx="' + ((i - (pips - 1) / 2) * 3.6).toFixed(1) + '" cy="9.6" r="1.35" fill="' + col + '"/>';
    return '<circle r="17" fill="rgba(0,0,0,.3)" cy="1.6"/><circle r="16.5" fill="#f3e4bf" stroke="#6e5530" stroke-width="1.6"/><circle r="13.5" fill="none" stroke="rgba(110,85,48,.35)" stroke-width="1"/>' +
      '<text y="5" text-anchor="middle" class="tk-n' + (hot ? ' hot' : '') + '" fill="' + col + '">' + n + '</text>' + dots;
  }
  function harbor(k) {
    var two = k !== '3';
    return '<circle r="15" fill="rgba(0,0,0,.3)" cy="1.6"/><circle r="14.5" fill="#f3ecd8" stroke="#2a5a78" stroke-width="2.2"/>' +
      (two ? '<g transform="translate(0 -4) scale(.24)">' + RICON[k]() + '</g><text y="11.5" text-anchor="middle" class="hb-t">2:1</text>'
        : '<text y="1" text-anchor="middle" class="hb-t big">3:1</text><text y="10" text-anchor="middle" class="hb-q">?</text>');
  }
  function robberShape() {
    return '<ellipse cx="0" cy="17" rx="12" ry="4" fill="rgba(0,0,0,.4)"/><path d="M-11 16c0-10 3-16 6-20h10c3 4 6 10 6 20z" fill="#3a3a40" stroke="#16161a" stroke-width="1.6"/>' +
      '<circle cy="-10" r="8" fill="#45454c" stroke="#16161a" stroke-width="1.6"/><ellipse cx="0" cy="-3" rx="9" ry="3" fill="#2c2c32"/><path d="M-6-12c2-3 7-3 9-1" fill="none" stroke="rgba(255,255,255,.35)" stroke-width="1.6" stroke-linecap="round"/>' +
      '<path d="M-7 4c2 6 2 9 1 11" fill="none" stroke="rgba(255,255,255,.18)" stroke-width="2" stroke-linecap="round"/>';
  }
  function robberIcon(size) { return '<svg viewBox="-16 -22 32 44" width="' + (size || 22) + '" height="' + Math.round((size || 22) * 1.35) + '" aria-hidden="true">' + robberShape() + '</svg>'; }

  /* ---------- icone dell'interfaccia (24×24, colore del testo) ---------- */
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    star: '<path d="M12 2.8l2.8 5.8 6.3.9-4.6 4.4 1.1 6.3L12 17.2l-5.6 3 1.1-6.3L2.9 9.5l6.3-.9z" fill="currentColor"/>',
    check: '<path d="M4.5 12.5l5 5L19.5 6.5" fill="none" stroke="currentColor" stroke-width="2.8" stroke-linecap="round" stroke-linejoin="round"/>',
    cards: '<rect x="3" y="6" width="11" height="15" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9 3.5h10a2 2 0 0 1 2 2V18" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    dev: '<rect x="5" y="3" width="14" height="18" rx="2" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12 7.5l3.5 4.5-3.5 4.5-3.5-4.5z" fill="currentColor"/>',
    dice: '<rect x="3.5" y="3.5" width="17" height="17" rx="4" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="8.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="15.5" cy="15.5" r="1.6" fill="currentColor"/><circle cx="12" cy="12" r="1.6" fill="currentColor"/><circle cx="15.5" cy="8.5" r="1.6" fill="currentColor"/><circle cx="8.5" cy="15.5" r="1.6" fill="currentColor"/>',
    build: '<path d="M3 20h18M5 20V10l7-6 7 6v10" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M10 20v-5h4v5" fill="none" stroke="currentColor" stroke-width="2"/>',
    trade: '<path d="M4 8h14l-3.5-3.5M20 16H6l3.5 3.5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    end: '<path d="M5 12h12M13 6l6 6-6 6" fill="none" stroke="currentColor" stroke-width="2.4" stroke-linecap="round" stroke-linejoin="round"/>',
    knight: '<path d="M7 20h11l-1-3H8zM8.5 17c-.6-4 .4-8 4-10l1-3 2 2.5 2.5 1.5-2 1.5 1 2.5h-3c.6 2 1.4 3.6 2.6 5.5" fill="currentColor"/>',
    road: '<path d="M4 19L14 5M10 19L20 5" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    bank: '<path d="M3 9.5L12 4l9 5.5zM5 11v7M9.7 11v7M14.3 11v7M19 11v7M3 20h18" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    trophy: '<path d="M7 4h10v5a5 5 0 0 1-10 0zM7 6H4v1.5A3.5 3.5 0 0 0 7.5 11M17 6h3v1.5A3.5 3.5 0 0 1 16.5 11M12 14v4M8 20h8" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    robber: '<path d="M7 20c0-6 2-9 3.5-11h3C15 11 17 14 17 20z" fill="currentColor"/><circle cx="12" cy="6.5" r="3.5" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    harbor: '<path d="M12 4v15M7 9h10M5 14a7 6 0 0 0 14 0" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="4" r="1.8" fill="currentColor"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  var DEFS = '<defs><linearGradient id="ct-sheen" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".28"/><stop offset=".45" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".18"/></linearGradient>' +
    '<filter id="ct-shadow" x="-40%" y="-40%" width="180%" height="180%"><feDropShadow dx="0" dy="1.6" stdDeviation="1.4" flood-color="#000" flood-opacity=".55"/></filter>' +
    '<radialGradient id="ct-glow"><stop offset="0" stop-color="#fff6c8" stop-opacity=".85"/><stop offset="1" stop-color="#ffd24a" stop-opacity="0"/></radialGradient></defs>';
  return { RC: RC, resIcon: resIcon, resDot: resDot, resRow: resRow, resCard: resCard, resBack: resBack, devCard: devCard, devBack: devBack, devIcon: devIcon, die: die,
    piece: piece, pieceIcon: pieceIcon, settleShape: settleShape, cityShape: cityShape, token: token, harbor: harbor, robberShape: robberShape, robberIcon: robberIcon, icon: icon, DEFS: DEFS };
})();
