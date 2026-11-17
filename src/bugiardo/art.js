/* ===== Dadi del bugiardo: disegni (dadi, bicchiere, logo) ===== */
var LBArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    cup: '<path d="M5 5h14l-2 15H7z" fill="currentColor"/><path d="M4 5h16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M8 9h8" stroke="rgba(255,255,255,.35)" stroke-width="1.5"/>',
    up: '<path d="M12 5v14M6 11l6-6 6 6" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    eye: '<path d="M2 12s3.6-6.5 10-6.5S22 12 22 12s-3.6 6.5-10 6.5S2 12 2 12z" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="3.2" fill="currentColor"/>',
    target: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
    minus: '<path d="M6 12h12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>',
    plus: '<path d="M6 12h12M12 6v12" stroke="currentColor" stroke-width="3" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  var PIPS = { 1: [[50, 50]], 2: [[28, 28], [72, 72]], 3: [[26, 26], [50, 50], [74, 74]], 4: [[28, 28], [72, 28], [28, 72], [72, 72]], 5: [[27, 27], [73, 27], [50, 50], [27, 73], [73, 73]], 6: [[28, 24], [72, 24], [28, 50], [72, 50], [28, 76], [72, 76]] };
  // un dado: v da 1 a 6, 0 = coperto
  function die(v, cls) {
    var body;
    if (!v) body = '<rect x="4" y="4" width="92" height="92" rx="20" fill="#7a1f2b" stroke="#3c0a12" stroke-width="4"/><text x="50" y="66" text-anchor="middle" font-size="48" font-weight="800" fill="rgba(255,255,255,.35)" font-family="Baloo 2, sans-serif">?</text>';
    else body = '<rect x="4" y="4" width="92" height="92" rx="20" fill="#fbf6ea" stroke="#b9a98a" stroke-width="4"/><rect x="10" y="10" width="80" height="80" rx="15" fill="none" stroke="rgba(255,255,255,.8)" stroke-width="2"/>' +
      PIPS[v].map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="' + (v === 1 ? 13 : 9.5) + '" fill="' + (v === 1 ? '#c8202f' : '#2a1a1a') + '"/>'; }).join('');
    return '<svg class="die' + (cls ? ' ' + cls : '') + '" viewBox="0 0 100 100" aria-label="' + (v ? v : 'dado coperto') + '">' + body + '</svg>';
  }
  function cup() {
    return '<svg class="cupsvg" viewBox="0 0 100 100" aria-hidden="true"><path d="M18 14h64l-9 76H27z" fill="#8a2433" stroke="#3c0a12" stroke-width="4" stroke-linejoin="round"/><path d="M14 14h72" stroke="#c9a24a" stroke-width="7" stroke-linecap="round"/><path d="M28 30h44M30 74h40" stroke="#c9a24a" stroke-width="4"/><path d="M34 20l-4 64" stroke="rgba(255,255,255,.22)" stroke-width="6" stroke-linecap="round"/></svg>';
  }
  function hero() {
    return '<div class="hero-dice">' + cup() + '<span class="hd d1">' + die(5) + '</span><span class="hd d2">' + die(1) + '</span><span class="hd d3">' + die(5) + '</span><span class="hd d4">' + die(0) + '</span><span class="hero-say">«quattro 5»</span></div>';
  }
  function defs() { return ''; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="lb-bg" cx=".5" cy=".4" r=".75"><stop offset="0" stop-color="#9a2a3a"/><stop offset=".6" stop-color="#4a1219"/><stop offset="1" stop-color="#1c0608"/></radialGradient></defs><rect width="512" height="512" fill="url(#lb-bg)"/>' +
      '<g transform="translate(40 60) rotate(-12 110 160)"><path d="M30 20h160l-22 260H52z" fill="#7a1f2b" stroke="#2a060a" stroke-width="12" stroke-linejoin="round"/><path d="M18 20h184" stroke="#e0b85a" stroke-width="18" stroke-linecap="round"/><path d="M50 80h120M58 230h104" stroke="#e0b85a" stroke-width="10"/></g>' +
      '<g transform="translate(250 230) rotate(14)"><rect width="190" height="190" rx="40" fill="#fbf6ea" stroke="#2a060a" stroke-width="10"/><circle cx="52" cy="52" r="20" fill="#2a1a1a"/><circle cx="138" cy="52" r="20" fill="#2a1a1a"/><circle cx="95" cy="95" r="20" fill="#2a1a1a"/><circle cx="52" cy="138" r="20" fill="#2a1a1a"/><circle cx="138" cy="138" r="20" fill="#2a1a1a"/></g>' +
      '<g transform="translate(190 330) rotate(-20)"><rect width="130" height="130" rx="28" fill="#fbf6ea" stroke="#2a060a" stroke-width="9"/><circle cx="65" cy="65" r="22" fill="#c8202f"/></g></svg>';
  }
  return { icon: icon, die: die, cup: cup, hero: hero, defs: defs, logo: logo };
})();
