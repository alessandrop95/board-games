/* ===== Binari d'Italia: disegni originali (carte vagone, locomotiva, biglietti, vagoni dei giocatori, icone) ===== */
var BIArt = (function () {
  var D = BIData, C = D.COLORS;
  var uid = 0;
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }

  /* simboli per distinguere i colori anche senza vederli */
  var GLYPH = {
    R: '<circle cx="0" cy="0" r="5.2"/>',
    O: '<path d="M0-6L6 4.6H-6Z"/>',
    Y: '<path d="M0-6.4L5.4 0L0 6.4L-5.4 0Z"/>',
    G: '<circle cx="0" cy="-2.8" r="3"/><circle cx="-3" cy="2" r="3"/><circle cx="3" cy="2" r="3"/><path d="M-.8 2h1.6v4.6h-1.6z"/>',
    B: '<rect x="-5" y="-5" width="10" height="10" rx="1"/>',
    P: '<path d="M-1.9-6h3.8v4.1H6v3.8H1.9V6h-3.8V1.9H-6v-3.8h4.1z"/>',
    K: '<path d="M0-6.4L1.9-2H6.6L2.8.9L4.2 5.8L0 2.9L-4.2 5.8L-2.8.9L-6.6-2H-1.9Z"/>',
    W: '<circle cx="0" cy="0" r="5.4" fill="none" stroke-width="2.4"/>',
    L: '<circle r="5.6" fill="none" stroke-width="2"/><circle r="1.8"/><path d="M0-5.6V5.6M-5.6 0H5.6M-4 -4L4 4M4 -4L-4 4" stroke-width="1.3"/>',
    X: '<path d="M-5 0h10" stroke-width="2.6"/>'
  };
  function glyph(c, fill, stroke) { return '<g fill="' + fill + '" stroke="' + (stroke || fill) + '">' + GLYPH[c] + '</g>'; }

  /* ---------- vagoni (vista laterale, larghezza ~84, base su y=0) ---------- */
  function wheels(x0, x1, dark) {
    var w = '';
    [x0, x0 + 11, x1 - 11, x1].forEach(function (x) { w += '<circle cx="' + x + '" cy="-4.5" r="4.6" fill="' + dark + '"/><circle cx="' + x + '" cy="-4.5" r="1.6" fill="#c9c2b0"/>'; });
    return '<rect x="' + (x0 - 6) + '" y="-11" width="' + (x1 - x0 + 12) + '" height="4" rx="1" fill="' + dark + '"/>' + w;
  }
  function couplers(dark) { return '<rect x="-46" y="-12" width="5" height="2.4" fill="' + dark + '"/><rect x="41" y="-12" width="5" height="2.4" fill="' + dark + '"/>'; }
  function wagon(c) {
    var k = C[c], body = k.c, dk = k.d, line = c === 'K' ? '#6c6a70' : 'rgba(0,0,0,.35)', hi = c === 'K' ? 'rgba(255,255,255,.18)' : 'rgba(255,255,255,.35)';
    var base = couplers('#2a2522') + wheels(-30, 30, '#2a2522'), b = '';
    if (c === 'R') { // carrozza passeggeri
      b = '<rect x="-41" y="-38" width="82" height="27" rx="3" fill="' + body + '" stroke="' + dk + '"/><path d="M-43-38Q0-50 43-38Z" fill="' + dk + '"/>';
      for (var i = 0; i < 6; i++) b += '<rect x="' + (-35 + i * 12) + '" y="-33" width="8" height="9" rx="1.5" fill="#f6e7b8" stroke="' + dk + '" stroke-width=".8"/>';
      b += '<rect x="-41" y="-21" width="82" height="2.2" fill="#e9c467"/>';
    } else if (c === 'O') { // carro merci chiuso
      b = '<rect x="-41" y="-40" width="82" height="29" rx="1.5" fill="' + body + '" stroke="' + dk + '"/>';
      for (var j = -33; j < 41; j += 8) b += '<path d="M' + j + ' -40v29" stroke="' + line + '" stroke-width=".9"/>';
      b += '<rect x="-11" y="-38" width="22" height="25" fill="' + dk + '" opacity=".55"/><path d="M-11-38L11-13M11-38L-11-13" stroke="' + hi + '" stroke-width="1.4"/><rect x="-43" y="-42" width="86" height="3.4" rx="1" fill="' + dk + '"/>';
    } else if (c === 'Y') { // cisterna
      b = '<rect x="-38" y="-38" width="76" height="25" rx="12.5" fill="' + body + '" stroke="' + dk + '"/><rect x="-6" y="-44" width="12" height="7" rx="2" fill="' + dk + '"/><path d="M-30-31h60" stroke="' + hi + '" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M-20-38v25M20-38v25" stroke="' + dk + '" stroke-width="1.3"/><rect x="-42" y="-14" width="84" height="3" fill="' + dk + '"/>';
    } else if (c === 'G') { // pianale con tronchi
      b = '<rect x="-42" y="-16" width="84" height="5" fill="' + dk + '"/><rect x="-42" y="-34" width="3" height="19" fill="' + dk + '"/><rect x="39" y="-34" width="3" height="19" fill="' + dk + '"/>';
      b += '<rect x="-38" y="-24.5" width="76" height="8.6" rx="4.3" fill="' + body + '" stroke="' + dk + '"/><rect x="-34" y="-33" width="68" height="8.6" rx="4.3" fill="' + body + '" stroke="' + dk + '"/><rect x="-28" y="-41.5" width="56" height="8.6" rx="4.3" fill="' + body + '" stroke="' + dk + '"/>';
      [-24.5, -33, -41.5].forEach(function (yy, ii) { var x1 = ii === 0 ? 38 : ii === 1 ? 34 : 28; b += '<circle cx="' + (x1 - 3) + '" cy="' + (yy + 4.3) + '" r="3.6" fill="#e9d6a8" stroke="' + dk + '" stroke-width=".8"/><circle cx="' + (x1 - 3) + '" cy="' + (yy + 4.3) + '" r="1.5" fill="none" stroke="#a0855a" stroke-width=".6"/>'; });
      b += '<path d="M-20-41v26M20-41v26" stroke="#2a2522" stroke-width="1.6"/>';
    } else if (c === 'B') { // frigorifero
      b = '<rect x="-41" y="-40" width="82" height="29" rx="2" fill="' + body + '" stroke="' + dk + '"/><rect x="-43" y="-43" width="86" height="4" rx="1.5" fill="' + dk + '"/>' +
        '<rect x="-28" y="-46" width="10" height="3.5" fill="' + dk + '"/><rect x="18" y="-46" width="10" height="3.5" fill="' + dk + '"/>' +
        '<rect x="-30" y="-35" width="60" height="9" rx="1" fill="rgba(255,255,255,.88)"/><path d="M-24-30.5h48" stroke="' + dk + '" stroke-width="2.2" stroke-dasharray="4 2.4"/><rect x="-7" y="-24" width="14" height="11" fill="' + dk + '" opacity=".5"/>';
    } else if (c === 'P') { // bagagliaio postale
      b = '<rect x="-41" y="-39" width="82" height="28" rx="3" fill="' + body + '" stroke="' + dk + '"/><path d="M-43-39Q0-49 43-39Z" fill="' + dk + '"/>' +
        '<rect x="-34" y="-33" width="9" height="8" rx="1" fill="#f6e7b8" stroke="' + dk + '" stroke-width=".8"/><rect x="25" y="-33" width="9" height="8" rx="1" fill="#f6e7b8" stroke="' + dk + '" stroke-width=".8"/>' +
        '<rect x="-15" y="-34" width="30" height="20" rx="1" fill="' + dk + '" opacity=".45"/><path d="M-10-29h20l-10 7z" fill="#f6e7b8"/><rect x="-10" y="-29" width="20" height="12" fill="none" stroke="#f6e7b8" stroke-width="1.2"/>';
    } else if (c === 'K') { // tramoggia per il carbone
      b = '<path d="M-41-38H41L33-12H-33Z" fill="' + body + '" stroke="#6c6a70"/><path d="M-40-38q8-9 16-3q7-8 15-1q8-9 17-2q8-8 15-1q8-6 17 7z" fill="#111" stroke="#55535a" stroke-width=".7"/>' +
        '<path d="M-24-38l3 26M24-38l-3 26M0-38v26" stroke="#55535a" stroke-width="1.4"/>' +
        '<circle cx="-30" cy="-43" r="1.4" fill="#77757c"/><circle cx="-8" cy="-45" r="1.2" fill="#77757c"/><circle cx="14" cy="-44" r="1.3" fill="#77757c"/>';
    } else if (c === 'W') { // carrozza ristorante
      b = '<rect x="-41" y="-38" width="82" height="27" rx="3" fill="' + body + '" stroke="' + dk + '"/><path d="M-43-38Q0-50 43-38Z" fill="#6f5b3a"/>';
      for (var m = 0; m < 4; m++) b += '<rect x="' + (-33 + m * 17) + '" y="-33" width="13" height="10" rx="2" fill="#f2d98e" stroke="#9c8a62" stroke-width=".8"/>';
      b += '<path d="M-41-19h82M-41-16.5h82" stroke="#c9a54d" stroke-width="1.2"/>';
    }
    return '<g>' + b + base + '</g>';
  }
  function loco() { // locomotiva a vapore, vista laterale
    var dk = '#2a2522';
    return '<g>' +
      '<rect x="-44" y="-15" width="88" height="4.6" rx="1" fill="' + dk + '"/>' +
      '<rect x="-26" y="-40" width="50" height="26" rx="12" fill="#2f3a3e" stroke="#111"/>' +
      '<path d="M-24-34h46" stroke="#d9b45a" stroke-width="1.6"/><path d="M-24-20h46" stroke="#d9b45a" stroke-width="1.6"/>' +
      '<rect x="-16" y="-55" width="9" height="17" fill="#2f3a3e" stroke="#111"/><rect x="-19" y="-58" width="15" height="5" rx="1.5" fill="#d9b45a" stroke="#6b5320"/>' +
      '<path d="M4-40q5-10 10 0z" fill="#d9b45a" stroke="#6b5320"/>' +
      '<rect x="22" y="-52" width="22" height="38" rx="2" fill="#b23a2a" stroke="#5e1a10"/><path d="M20-54h26l-2 4h-22z" fill="' + dk + '"/><rect x="27" y="-47" width="12" height="11" rx="1.5" fill="#f6e7b8" stroke="#5e1a10"/>' +
      '<path d="M-26-14l-14 0l-4 4l18 0z" fill="#b23a2a"/>' +
      '<circle cx="-14" cy="-9" r="7" fill="' + dk + '"/><circle cx="4" cy="-9" r="7" fill="' + dk + '"/><circle cx="22" cy="-9" r="7" fill="' + dk + '"/><circle cx="36" cy="-6" r="4.2" fill="' + dk + '"/><circle cx="-34" cy="-6" r="4.2" fill="' + dk + '"/>' +
      '<g fill="none" stroke="#c9c2b0" stroke-width="1.1"><circle cx="-14" cy="-9" r="4.5"/><circle cx="4" cy="-9" r="4.5"/><circle cx="22" cy="-9" r="4.5"/></g>' +
      '<path d="M-14-9H22" stroke="#d9b45a" stroke-width="2.2" stroke-linecap="round"/>' +
      '<g fill="rgba(250,248,240,.92)"><circle cx="-12" cy="-63" r="5"/><circle cx="-6" cy="-71" r="6.4"/><circle cx="3" cy="-78" r="7.6"/><circle cx="15" cy="-82" r="6.2"/></g></g>';
  }

  /* ---------- carta vagone ---------- */
  function card(c, opts) {
    opts = opts || {};
    var id = 'cd' + (++uid), k = C[c], isL = c === 'L';
    var bg = isL ? 'url(#' + id + 'r)' : 'url(#' + id + 'g)';
    var defs = '<defs><linearGradient id="' + id + 'g" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + k.c + '"/><stop offset="1" stop-color="' + k.d + '"/></linearGradient>' +
      (isL ? '<linearGradient id="' + id + 'r" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#c9352b"/><stop offset=".2" stop-color="#e5822a"/><stop offset=".38" stop-color="#efc62f"/><stop offset=".56" stop-color="#3d8f3f"/><stop offset=".74" stop-color="#2e6bb8"/><stop offset="1" stop-color="#8c4aa6"/></linearGradient>' : '') +
      '<pattern id="' + id + 'p" width="8" height="8" patternUnits="userSpaceOnUse" patternTransform="rotate(35)"><rect width="4" height="8" fill="rgba(255,255,255,.07)"/></pattern></defs>';
    var name = isL ? 'LOCOMOTIVA' : k.n.toUpperCase(), ink = isL ? '#2b1d05' : k.ink;
    var gl = isL ? '#2b1d05' : (c === 'W' ? '#2b2a2c' : c === 'Y' ? '#3a2a00' : '#fff');
    var svg = '<svg class="bcard" viewBox="0 0 100 140" role="img" aria-label="Carta ' + (isL ? 'locomotiva (jolly)' : k.n) + '">' + defs +
      '<rect x="1" y="1" width="98" height="138" rx="9" fill="#f4ead1" stroke="#7a6a4c" stroke-width="1.2"/>' +
      '<rect x="6" y="6" width="88" height="128" rx="6" fill="' + bg + '"/>' +
      '<rect x="6" y="6" width="88" height="128" rx="6" fill="url(#' + id + 'p)"/>' +
      (isL ? '<rect x="12" y="34" width="76" height="62" rx="6" fill="#f3e7c9" stroke="#6b5320" stroke-width="1"/>' : '<rect x="12" y="34" width="76" height="62" rx="6" fill="rgba(255,250,235,.9)" stroke="rgba(0,0,0,.25)" stroke-width="1"/>') +
      '<path d="M16 86h68" stroke="#6b5a40" stroke-width="1.6"/><path d="M16 88.5h68" stroke="#6b5a40" stroke-width=".7" stroke-dasharray="3 2"/>' +
      '<g transform="translate(50 85) scale(.82)">' + (isL ? loco() : wagon(c)) + '</g>' +
      '<g transform="translate(19 20)"><circle r="9.5" fill="rgba(255,255,255,.9)" stroke="rgba(0,0,0,.3)"/><g transform="scale(.95)">' + glyph(c, isL ? '#6b5320' : k.d) + '</g></g>' +
      '<g transform="translate(81 120) rotate(180)"><circle r="8" fill="rgba(255,255,255,.85)"/><g transform="scale(.8)">' + glyph(c, isL ? '#6b5320' : k.d) + '</g></g>' +
      '<text x="50" y="114" text-anchor="middle" font-family="Barlow, sans-serif" font-weight="800" font-size="' + (name.length > 8 ? 10 : 12.5) + '" letter-spacing="' + (name.length > 8 ? .6 : 1.2) + '" fill="' + gl + '" stroke="' + (gl === '#fff' ? 'rgba(0,0,0,.35)' : 'rgba(255,255,255,.4)') + '" stroke-width=".6" paint-order="stroke">' + name + '</text>' +
      (isL ? '<text x="50" y="126" text-anchor="middle" font-family="Barlow, sans-serif" font-weight="700" font-size="7.2" fill="#2b1d05">VALE OGNI COLORE</text>' : '') +
      '</svg>';
    return svg;
  }
  function cardBack() {
    return '<svg class="bcard back" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="9" fill="#f4ead1" stroke="#7a6a4c" stroke-width="1.2"/>' +
      '<rect x="6" y="6" width="88" height="128" rx="6" fill="#1f3a4a"/><rect x="11" y="11" width="78" height="118" rx="4" fill="none" stroke="#d9b45a" stroke-width="1.2"/>' +
      '<g transform="translate(50 70)"><circle r="26" fill="none" stroke="#d9b45a" stroke-width="1.5"/><circle r="20" fill="#b23a2a"/>' +
      '<path d="M-12 6h24M-12 1h24M-8-4h16" stroke="#f3e7c9" stroke-width="1.6"/><path d="M-14 9h28" stroke="#d9b45a" stroke-width="2"/></g>' +
      '<text x="50" y="118" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-weight="700" font-size="10.5" fill="#f3e7c9" letter-spacing="1">BINARI</text>' +
      '<text x="50" y="30" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-weight="700" font-size="10.5" fill="#f3e7c9" letter-spacing="1">D’ITALIA</text></svg>';
  }

  /* ---------- biglietto destinazione (cartoncino d'epoca con la cartina) ---------- */
  var MAPSYM = '<symbol id="bi-italy" viewBox="0 0 ' + D.W + ' ' + D.H + '"><path d="' + D.geo.italy + '" fill="#e2cf9f" stroke="#8a7350" stroke-width="5"/></symbol>';
  function ticket(t, opts) {
    opts = opts || {};
    var a = D.cities[t.a], b = D.cities[t.b], id = 'tk' + (++uid);
    var mw = 58, mh = mw * D.H / D.W, sx = mw / D.W, mx = 8, my = 10;
    var ax = mx + a.x * sx, ay = my + a.y * sx, bx = mx + b.x * sx, by = my + b.y * sx;
    var st = opts.state; // 'ok' | 'ko' | null
    return '<svg class="bticket' + (st ? ' ' + st : '') + '" viewBox="0 0 190 92" role="img" aria-label="Biglietto ' + esc(a.n) + ' – ' + esc(b.n) + ', ' + t.v + ' punti">' +
      '<defs><pattern id="' + id + 'g" width="6" height="6" patternUnits="userSpaceOnUse"><rect width="6" height="6" fill="#efe1bd"/><circle cx="1" cy="1" r=".6" fill="rgba(120,90,40,.12)"/></pattern></defs>' +
      '<path d="M4 2H186a3 3 0 0 1 3 3V87a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Z" fill="url(#' + id + 'g)" stroke="#8a7350"/>' +
      '<path d="M76 6V86" stroke="#b6a074" stroke-dasharray="2 3"/>' +
      '<use href="#bi-italy" x="' + mx + '" y="' + my + '" width="' + mw + '" height="' + mh + '"/>' +
      '<path d="M' + ax.toFixed(1) + ' ' + ay.toFixed(1) + 'L' + bx.toFixed(1) + ' ' + by.toFixed(1) + '" stroke="#b23a2a" stroke-width="1.6" stroke-dasharray="2.4 1.6"/>' +
      '<circle cx="' + ax.toFixed(1) + '" cy="' + ay.toFixed(1) + '" r="2.6" fill="#b23a2a" stroke="#fff" stroke-width=".8"/><circle cx="' + bx.toFixed(1) + '" cy="' + by.toFixed(1) + '" r="2.6" fill="#b23a2a" stroke="#fff" stroke-width=".8"/>' +
      '<text x="84" y="17" font-family="Barlow, sans-serif" font-weight="700" font-size="7.5" letter-spacing="2.2" fill="#7a2418">BIGLIETTO</text>' +
      '<text x="84" y="34" font-family="Barlow, sans-serif" font-size="7" fill="#6b5a40">DA</text>' +
      '<text x="96" y="35" font-family="Bodoni Moda, Georgia, serif" font-weight="700" font-size="' + (a.n.length > 11 ? 10.5 : a.n.length > 8 ? 12 : 13.5) + '" fill="#2a2420">' + esc(a.n) + '</text>' +
      '<text x="84" y="56" font-family="Barlow, sans-serif" font-size="7" fill="#6b5a40">A</text>' +
      '<text x="96" y="57" font-family="Bodoni Moda, Georgia, serif" font-weight="700" font-size="' + (b.n.length > 11 ? 10.5 : b.n.length > 8 ? 12 : 13.5) + '" fill="#2a2420">' + esc(b.n) + '</text>' +
      '<g transform="translate(170 72)"><circle r="14" fill="none" stroke="#b23a2a" stroke-width="1.6" opacity=".9"/><circle r="12" fill="none" stroke="#b23a2a" stroke-width=".7" opacity=".9"/>' +
      '<text y="5" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-weight="800" font-size="14" fill="#b23a2a">' + t.v + '</text><text y="-7" text-anchor="middle" font-family="Barlow, sans-serif" font-size="4.6" fill="#b23a2a" letter-spacing=".6">PUNTI</text></g>' +
      '<text x="84" y="80" font-family="Barlow, sans-serif" font-size="6.4" fill="#8a7350">N. ' + String(1000 + t.id * 37).slice(-4) + ' · 2ª CLASSE</text>' +
      (st === 'ok' ? '<g transform="translate(38 50) rotate(-18) scale(.82)"><rect x="-30" y="-11" width="60" height="22" rx="3" fill="rgba(239,225,189,.85)" stroke="#2f7a3a" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Barlow, sans-serif" font-weight="800" font-size="12" fill="#2f7a3a" letter-spacing="1">ARRIVATO</text></g>' : '') +
      (st === 'ko' ? '<g transform="translate(38 50) rotate(-18) scale(.74)"><rect x="-32" y="-11" width="64" height="22" rx="3" fill="rgba(239,225,189,.85)" stroke="#b23a2a" stroke-width="2"/><text y="5" text-anchor="middle" font-family="Barlow, sans-serif" font-weight="800" font-size="11" fill="#b23a2a" letter-spacing="1">NON ARRIVATO</text></g>' : '') +
      '</svg>';
  }
  function ticketBack() {
    return '<svg class="bticket back" viewBox="0 0 190 92" aria-hidden="true"><path d="M4 2H186a3 3 0 0 1 3 3V87a3 3 0 0 1-3 3H4a3 3 0 0 1-3-3V5a3 3 0 0 1 3-3Z" fill="#7a2418" stroke="#3b0f08"/>' +
      '<rect x="8" y="8" width="174" height="76" rx="3" fill="none" stroke="#d9b45a"/><text x="95" y="44" text-anchor="middle" font-family="Bodoni Moda, Georgia, serif" font-weight="700" font-size="17" fill="#f3e7c9" letter-spacing="2">BIGLIETTI</text>' +
      '<text x="95" y="62" text-anchor="middle" font-family="Barlow, sans-serif" font-size="8" fill="#e8cf9a" letter-spacing="2">DESTINAZIONE</text></svg>';
  }

  /* ---------- vagone del giocatore (sulla mappa e nelle icone) ---------- */
  function pieceSymbols() {
    return D.PCOL.map(function (p, i) {
      return '<symbol id="bi-pw' + i + '" viewBox="-15 -6 30 12" overflow="visible">' +
        '<rect x="-14" y="-5" width="28" height="10" rx="2.2" fill="' + p.d + '"/>' +
        '<rect x="-13.2" y="-4.6" width="26.4" height="8" rx="1.8" fill="' + p.c + '"/>' +
        '<rect x="-12" y="-4.2" width="24" height="2.4" rx="1.2" fill="rgba(255,255,255,.35)"/>' +
        '<path d="M-6-4.6v8M0-4.6v8M6-4.6v8" stroke="' + p.d + '" stroke-width=".7" opacity=".7"/>' +
        '</symbol>';
    }).join('');
  }
  function pieceIcon(i, w) { var p = D.PCOL[i]; return '<svg class="pwic" viewBox="0 0 36 20" width="' + (w || 26) + '" aria-hidden="true"><rect x="2" y="3" width="32" height="11" rx="2.5" fill="' + p.c + '" stroke="' + p.d + '" stroke-width="1.4"/><rect x="5" y="5" width="26" height="3" rx="1.5" fill="rgba(255,255,255,.4)"/><circle cx="9" cy="16" r="3" fill="#2a2522"/><circle cx="27" cy="16" r="3" fill="#2a2522"/></svg>'; }

  /* ---------- icone piccole ---------- */
  var ICONS = {
    train: '<rect x="3" y="7" width="18" height="9" rx="2"/><circle cx="8" cy="18.5" r="2"/><circle cx="16" cy="18.5" r="2"/>',
    card: '<rect x="5" y="3" width="13" height="18" rx="2.5"/><rect x="8" y="6" width="7" height="5" rx="1" fill="rgba(0,0,0,.25)"/>',
    ticket: '<path d="M3 7h18v3a2 2 0 0 0 0 4v3H3v-3a2 2 0 0 0 0-4z"/>',
    star: '<path d="M12 2.5l2.8 6 6.5.7-4.9 4.4 1.4 6.4L12 16.8 6.2 20l1.4-6.4L2.7 9.2l6.5-.7z"/>',
    help: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.3 9.4a2.8 2.8 0 1 1 3.7 2.6c-.7.3-1 .8-1 1.5v.8" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.3" r="1.2"/>',
    route: '<path d="M4 19L20 5" stroke="currentColor" stroke-width="5" stroke-dasharray="4 2"/>',
    check: '<path d="M4 12.5l5 5L20 6.5" fill="none" stroke="currentColor" stroke-width="3" stroke-linecap="round" stroke-linejoin="round"/>',
    longest: '<path d="M3 17c4-9 7 3 10-5s5-4 8-7" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><circle cx="3" cy="17" r="2"/><circle cx="21" cy="5" r="2"/>',
    ferry: '<path d="M3 15h18l-3 4H6z"/><rect x="7" y="9" width="10" height="5" rx="1"/><path d="M2 21c2 0 2-1 4-1s2 1 4 1 2-1 4-1 2 1 4 1 2-1 4-1" fill="none" stroke="currentColor" stroke-width="1.4"/>',
    deck: '<rect x="6" y="5" width="13" height="16" rx="2"/><rect x="4" y="3" width="13" height="16" rx="2" fill="none" stroke="currentColor" stroke-width="1.4"/>'
  };
  function icon(k, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" fill="currentColor" aria-hidden="true">' + ICONS[k] + '</svg>'; }
  function swatch(c, n) { // gettone colore con simbolo, per mano e pagamenti
    var k = C[c], gl = c === 'L' ? '#2b1d05' : (c === 'W' || c === 'Y' ? k.d : '#fff');
    var bgc = c === 'L' ? 'conic-gradient(#c9352b,#e5822a,#efc62f,#3d8f3f,#2e6bb8,#8c4aa6,#c9352b)' : k.c;
    return '<span class="sw sw-' + c + '" style="--swc:' + k.c + ';--swd:' + k.d + ';background:' + bgc + '"><svg viewBox="-8 -8 16 16" aria-hidden="true">' + glyph(c, gl) + '</svg>' + (n != null ? '<b>' + n + '</b>' : '') + '</span>';
  }
  var DEFS = '<defs>' + MAPSYM + pieceSymbols() +
    '<filter id="bi-shadow" x="-30%" y="-30%" width="160%" height="160%"><feDropShadow dx="0" dy="1.2" stdDeviation="1.1" flood-color="#000" flood-opacity=".45"/></filter>' +
    '<filter id="bi-glow" x="-50%" y="-50%" width="200%" height="200%"><feGaussianBlur stdDeviation="3"/></filter></defs>';
  return { card: card, cardBack: cardBack, ticket: ticket, ticketBack: ticketBack, wagon: wagon, loco: loco, glyph: glyph, pieceIcon: pieceIcon, icon: icon, swatch: swatch, DEFS: DEFS, MAPSYM: MAPSYM };
})();
