/* ===== Sushi Go!: carte disegnate da zero (sushi con le facce, un colore per tipo) e icone =====
   In alto su ogni carta c'è il promemoria del punteggio (×2 = 5, ×3 = 10, 1-3-6-10-15…). */
var SGArt = (function () {
  var C = {
    tem: ['#a58af0', '#5b3fb0'], sas: ['#9fe07f', '#3f8f37'], dum: ['#8ec5ff', '#2f6fc0'], mk1: ['#ff8a8f', '#c0283a'], mk2: ['#ff8a8f', '#c0283a'], mk3: ['#ff8a8f', '#c0283a'],
    nsa: ['#ffd96a', '#c98a00'], nsq: ['#ffd96a', '#c98a00'], neg: ['#ffd96a', '#c98a00'], pud: ['#ffb3d4', '#c2407e'], was: ['#d6f08a', '#6f9a1a'], cho: ['#8ee6dc', '#1f8f84']
  };
  var NAME = { tem: 'Tempura', sas: 'Sashimi', dum: 'Gyoza', mk1: 'Maki ×1', mk2: 'Maki ×2', mk3: 'Maki ×3', nsa: 'Salmone', nsq: 'Calamaro', neg: 'Uovo', pud: 'Budino', was: 'Wasabi', cho: 'Bacchette' };
  var HINT = { tem: '×2 = 5', sas: '×3 = 10', dum: '1 3 6 10 15', mk1: 'più rotolini 6 / 3', mk2: 'più rotolini 6 / 3', mk3: 'più rotolini 6 / 3', nsa: 'Nigiri · 2 punti', nsq: 'Nigiri · 3 punti', neg: 'Nigiri · 1 punto', pud: 'fine: +6 / −6', was: 'Nigiri dopo ×3', cho: 'poi: 2 carte' };
  function defs() {
    return '<svg width="0" height="0" style="position:absolute" aria-hidden="true"><defs>' +
      '<linearGradient id="sg-shine" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#fff" stop-opacity=".45"/><stop offset=".35" stop-color="#fff" stop-opacity="0"/><stop offset="1" stop-color="#fff" stop-opacity=".1"/></linearGradient>' +
      '<linearGradient id="sg-back" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff6f61"/><stop offset="1" stop-color="#b8283a"/></linearGradient>' +
      '<pattern id="sg-wave" width="20" height="10" patternUnits="userSpaceOnUse"><path d="M0 10 Q5 0 10 10 T20 10" fill="none" stroke="#fff" stroke-opacity=".18" stroke-width="1.4"/></pattern>' +
      '</defs></svg>';
  }
  var FONT = "font-family=\"'Baloo 2',Nunito,system-ui,sans-serif\" font-weight=\"800\"";
  function kawaii(x, y, s, blush) {
    return '<g transform="translate(' + x + ' ' + y + ') scale(' + (s || 1) + ')"><circle cx="-5" cy="0" r="1.8" fill="#2a1a1a"/><circle cx="5" cy="0" r="1.8" fill="#2a1a1a"/>' +
      '<path d="M-2.4 3 Q0 5.4 2.4 3" fill="none" stroke="#2a1a1a" stroke-width="1.3" stroke-linecap="round"/>' +
      (blush !== false ? '<ellipse cx="-8.5" cy="3" rx="2.2" ry="1.3" fill="#ff7f9a" opacity=".7"/><ellipse cx="8.5" cy="3" rx="2.2" ry="1.3" fill="#ff7f9a" opacity=".7"/>' : '') + '</g>';
  }
  function roll(x, y, r, fill) {
    return '<g transform="translate(' + x + ' ' + y + ')"><circle r="' + r + '" fill="#22302a"/><circle r="' + (r * .78) + '" fill="#fffaf0"/><circle r="' + (r * .34) + '" fill="' + fill + '"/>' +
      '<circle cx="' + (r * .14) + '" cy="' + (r * -.12) + '" r="' + (r * .12) + '" fill="#7cc96b"/></g>';
  }
  function rice(x, y, w) { return '<rect x="' + (x - w / 2) + '" y="' + y + '" width="' + w + '" height="20" rx="9" fill="#fffaf0" stroke="#d8cdb8" stroke-width="1.2"/>'; }
  function art(k) {
    switch (k) {
      case 'tem': return '<g transform="rotate(-18 50 72)"><path d="M26 82 Q40 50 70 52 Q80 54 78 64 Q74 74 56 76 Q40 80 30 90Z" fill="#f6b343" stroke="#b56a10" stroke-width="1.5"/>' +
        '<path d="M34 78 Q38 70 46 68 M48 74 Q52 64 60 62 M60 70 Q64 62 70 60" stroke="#ffe09a" stroke-width="2.2" fill="none" stroke-linecap="round"/><path d="M26 82 L12 92 L18 80 L10 76Z" fill="#ef5b4a"/></g>' + kawaii(56, 66, 1);
      case 'sas': return '<ellipse cx="50" cy="86" rx="34" ry="10" fill="#4f9a3f" opacity=".5"/>' + [[30, 74, '#ff8e6e'], [50, 70, '#ff7b6b'], [70, 74, '#ff8e6e']].map(function (q) { return '<g transform="translate(' + q[0] + ' ' + q[1] + ') rotate(' + (q[0] - 50) / 2 + ')"><rect x="-10" y="-14" width="20" height="28" rx="6" fill="' + q[2] + '" stroke="#c0442e" stroke-width="1.2"/><path d="M-7 -6 L7 -9 M-7 2 L7 -1 M-7 10 L7 7" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/></g>'; }).join('') + kawaii(50, 72, .8);
      case 'dum': return '<path d="M20 84 Q50 34 80 84 Q50 94 20 84Z" fill="#fbe7c4" stroke="#c99a5c" stroke-width="1.6"/><path d="M30 70 l4 5 M40 60 l3 6 M50 56 l0 7 M60 60 l-3 6 M70 70 l-4 5" stroke="#c99a5c" stroke-width="1.6" stroke-linecap="round"/><path d="M22 84 Q50 92 78 84" stroke="#e0a24a" stroke-width="3" fill="none"/>' + kawaii(50, 76, 1);
      case 'mk1': return roll(50, 72, 22, '#ff7b6b') + kawaii(50, 70, .8, false);
      case 'mk2': return roll(36, 66, 17, '#ff7b6b') + roll(64, 82, 17, '#f6b343') + kawaii(36, 64, .7, false) + kawaii(64, 80, .7, false);
      case 'mk3': return roll(30, 62, 14, '#ff7b6b') + roll(70, 62, 14, '#f6b343') + roll(50, 88, 14, '#7cc96b') + kawaii(30, 61, .6, false) + kawaii(70, 61, .6, false) + kawaii(50, 87, .6, false);
      case 'nsa': return rice(50, 74, 54) + '<path d="M22 72 Q50 52 78 70 Q80 78 72 80 Q50 74 26 82 Q20 80 22 72Z" fill="#ff8e6e" stroke="#c0442e" stroke-width="1.4"/><path d="M34 70 l8 -6 M48 68 l8 -6 M62 70 l6 -5" stroke="#fff" stroke-opacity=".7" stroke-width="2" stroke-linecap="round"/>' + kawaii(50, 86, .8);
      case 'nsq': return rice(50, 74, 54) + '<path d="M20 74 Q50 56 80 72 L84 64 L80 80 Q50 74 22 84Z" fill="#fff4f6" stroke="#d99aa8" stroke-width="1.4"/><path d="M30 76 Q32 70 36 72 M44 72 Q46 66 50 68 M58 72 Q60 66 64 68" stroke="#e8b2be" stroke-width="1.4" fill="none"/>' + kawaii(50, 86, .8);
      case 'neg': return rice(50, 76, 54) + '<rect x="22" y="58" width="56" height="20" rx="6" fill="#ffd84a" stroke="#c98a00" stroke-width="1.4"/><rect x="44" y="56" width="12" height="40" rx="2" fill="#22302a"/>' + kawaii(50, 88, .8);
      case 'pud': return '<path d="M28 92 L34 60 Q50 54 66 60 L72 92Z" fill="#ffe7a0" stroke="#c98a00" stroke-width="1.5"/><path d="M34 60 Q50 54 66 60 Q66 68 60 66 Q56 72 50 66 Q44 72 40 66 Q34 68 34 60Z" fill="#8a4a1a"/><circle cx="50" cy="52" r="6" fill="#e8344a"/><path d="M50 46 q2 -6 6 -8" stroke="#3f8f37" stroke-width="1.6" fill="none"/><ellipse cx="50" cy="94" rx="30" ry="5" fill="#fff" opacity=".7"/>' + kawaii(50, 78, .9);
      case 'was': return '<path d="M26 92 Q22 70 40 62 Q42 46 56 50 Q72 48 72 66 Q84 76 74 92Z" fill="#8fd14a" stroke="#4f8a1a" stroke-width="1.6"/><path d="M40 62 Q46 58 52 62" stroke="#c8f08a" stroke-width="2" fill="none"/>' + kawaii(52, 76, 1);
      case 'cho': return '<path d="M24 98 L70 38" stroke="#b0703a" stroke-width="6" stroke-linecap="round"/><path d="M36 100 L80 42" stroke="#c9884a" stroke-width="6" stroke-linecap="round"/><path d="M62 48 L70 38 M72 52 L80 42" stroke="#7a3f1a" stroke-width="6" stroke-linecap="round"/><rect x="18" y="86" width="38" height="12" rx="4" fill="#e8344a" transform="rotate(-52 37 92)"/>';
    }
    return '';
  }
  var cache = {};
  function face(k, mini) {
    var key = k + (mini ? 'm' : ''); if (cache[key]) return cache[key];
    var c = C[k] || ['#ccc', '#666'], o = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true">' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="' + c[0] + '"/><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sg-wave)"/>' +
      '<circle cx="50" cy="72" r="38" fill="#fff" opacity=".35"/>' + art(k);
    if (!mini) o += '<rect x="8" y="8" width="84" height="18" rx="9" fill="#fff" opacity=".88"/><text x="50" y="21.5" text-anchor="middle" ' + FONT + ' font-size="' + (HINT[k].length > 12 ? 9.5 : 12) + '" fill="' + c[1] + '">' + HINT[k] + '</text>' +
      '<text x="50" y="128" text-anchor="middle" ' + FONT + ' font-size="' + (NAME[k].length > 8 ? 14 : 16) + '" fill="#fff" stroke="' + c[1] + '" stroke-width="3" paint-order="stroke">' + NAME[k] + '</text>';
    else if (k === 'mk1' || k === 'mk2' || k === 'mk3') o += '<text x="84" y="26" text-anchor="middle" ' + FONT + ' font-size="26" fill="#fff" stroke="' + c[1] + '" stroke-width="4" paint-order="stroke">' + k.charAt(2) + '</text>';
    o += '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sg-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="' + c[1] + '" stroke-width="2.4"/></svg>';
    return (cache[key] = o);
  }
  var backC = null;
  function back() {
    return backC || (backC = '<svg class="skc-svg" viewBox="0 0 100 140" aria-hidden="true"><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sg-back)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sg-wave)"/>' +
      '<rect x="7" y="7" width="86" height="126" rx="8" fill="none" stroke="#fff" stroke-opacity=".7" stroke-width="1.6"/>' + roll(50, 62, 24, '#ff7b6b') + kawaii(50, 60, .9, false) +
      '<text x="50" y="114" text-anchor="middle" ' + FONT + ' font-size="17" fill="#fff" stroke="#7a1020" stroke-width="3" paint-order="stroke">SUSHI GO!</text>' +
      '<rect x="1" y="1" width="98" height="138" rx="11" fill="url(#sg-shine)"/><rect x="1" y="1" width="98" height="138" rx="11" fill="none" stroke="#7a1020" stroke-width="2"/></svg>');
  }
  function card(k, up, o) {
    o = o || {};
    return '<span class="skc' + (up ? ' up' : '') + (o.cls ? ' ' + o.cls : '') + '"' + (o.attrs || '') + '><span class="skc-in"><span class="skc-f skc-back">' + back() + '</span><span class="skc-f skc-front">' + (k ? face(k, o.mini) : '') + '</span></span></span>';
  }
  function flat(k, mini) { return '<span class="skc up flat"><span class="skc-in"><span class="skc-f skc-front">' + face(k, mini) + '</span></span></span>'; }
  // icona piccola di un tipo di carta (per i riassunti sul tavolo)
  function chipIcon(k) { return '<svg class="sg-ic" viewBox="10 36 80 80" aria-hidden="true">' + art(k) + '</svg>'; }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    x: '<path d="M6 6l12 12M18 6L6 18" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function hero(x, y, s) { return '<g transform="translate(' + x + ' ' + y + ') scale(' + s + ')">' + roll(0, 0, 24, '#ff7b6b') + kawaii(0, -2, .9, false) + '</g>'; }
  return { defs: defs, face: face, back: back, card: card, flat: flat, icon: icon, chipIcon: chipIcon, hero: hero, NAME: NAME, HINT: HINT, C: C };
})();
