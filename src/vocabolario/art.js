/* ===== Vocabolario bugiardo: disegni (libro, penna, maschera, logo) ===== */
var VBArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    book: '<path d="M3 5.5C5.5 4 9 4 12 6c3-2 6.5-2 9-.5V19c-2.5-1.5-6-1.5-9 .5-3-2-6.5-2-9-.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M12 6v13.5" stroke="currentColor" stroke-width="2"/>',
    pen: '<path d="M4 20l1.2-4.6L16 4.6a2.1 2.1 0 0 1 3 3L8.2 18.4z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/><path d="M14 6.6l3 3" stroke="currentColor" stroke-width="2"/>',
    mask: '<path d="M3 6c3 1.2 6 1.2 9 0 3 1.2 6 1.2 9 0v5c0 4.5-4 8-9 8s-9-3.5-9-8z" fill="currentColor"/><path d="M6.5 10.5c.8-.9 2.2-.9 3 0M14.5 10.5c.8-.9 2.2-.9 3 0" stroke="#2a0f14" stroke-width="1.6" fill="none" stroke-linecap="round"/><path d="M8.5 14.5c2 1.6 5 1.6 7 0" stroke="#2a0f14" stroke-width="1.6" fill="none" stroke-linecap="round"/>',
    star: '<path d="M12 3l2.7 5.6 6.1.9-4.4 4.3 1 6.1L12 17l-5.4 2.9 1-6.1-4.4-4.3 6.1-.9z" fill="currentColor"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function hero() {
    return '<div class="hero-book"><div class="hb-page"><b>nefelibata</b><i>s. m. e f.</i><p>1. Chi vive con la testa fra le nuvole…</p><p class="lie">2. Antico suonatore di zampogna…</p><p class="lie">3. Pesce di fiume dalle pinne rosse…</p></div><span class="hb-mask">' + icon('mask') + '</span></div>';
  }
  function defs() { return ''; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="vb-bg" cx=".5" cy=".35" r=".8"><stop offset="0" stop-color="#9a3a3a"/><stop offset=".6" stop-color="#5a1c22"/><stop offset="1" stop-color="#2a0c10"/></radialGradient></defs><rect width="512" height="512" fill="url(#vb-bg)"/>' +
      '<path d="M60 150c60-30 130-30 196 10 66-40 136-40 196-10v260c-60-30-130-30-196 10-66-40-136-40-196-10z" fill="#fbf1dc" stroke="#3a1408" stroke-width="10" stroke-linejoin="round"/><path d="M256 160v270" stroke="#3a1408" stroke-width="8"/>' +
      '<path d="M100 200h120M100 240h110M100 280h120M100 320h90M296 200h120M296 240h100M296 280h120M296 320h80" stroke="#c9a27a" stroke-width="10" stroke-linecap="round"/>' +
      '<g transform="translate(300 64) rotate(18)"><path d="M0 0c40 10 80 10 120 0v58c0 46-27 78-60 78S0 104 0 58z" fill="#f2c14e" stroke="#3a1408" stroke-width="8"/><path d="M22 44c8-9 22-9 30 0M70 44c8-9 22-9 30 0" stroke="#3a1408" stroke-width="7" fill="none" stroke-linecap="round"/><path d="M36 82c14 14 34 14 48 0" stroke="#3a1408" stroke-width="7" fill="none" stroke-linecap="round"/></g>' +
      '<text x="128" y="132" font-family="Georgia, serif" font-size="110" font-weight="700" fill="#f2c14e" stroke="#3a1408" stroke-width="5">?</text></svg>';
  }
  return { icon: icon, hero: hero, defs: defs, logo: logo };
})();
