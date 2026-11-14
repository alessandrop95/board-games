/* ===== Sintonia: icone e logo (due fumetti con la stessa parola) ===== */
var STArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4 16l-1.2-3a1.4 1.4 0 0 1 2.5-1.3L8 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>',
    send: '<path d="M4 12l16-8-6 16-3-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    heart: '<path d="M12 20s-7-4.4-7-10a4 4 0 0 1 7-2.6A4 4 0 0 1 19 10c0 5.6-7 10-7 10z" fill="currentColor"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function defs() { return ''; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="st-bg" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#8a4fe0"/><stop offset="1" stop-color="#e0457a"/></linearGradient></defs><rect width="512" height="512" fill="url(#st-bg)"/>' +
      '<g transform="translate(70 120) rotate(-8)"><rect width="230" height="140" rx="40" fill="#fff"/><path d="M60 140 L40 190 L110 140Z" fill="#fff"/><path d="M60 70 h110" stroke="#8a4fe0" stroke-width="22" stroke-linecap="round"/></g>' +
      '<g transform="translate(220 240) rotate(8)"><rect width="230" height="140" rx="40" fill="#ffe08a"/><path d="M170 140 L190 190 L120 140Z" fill="#ffe08a"/><path d="M60 70 h110" stroke="#e0457a" stroke-width="22" stroke-linecap="round"/></g>' +
      '<path d="M256 120 c20-30 70-20 60 20 c-8 30-60 50-60 50 s-52-20-60-50 c-10-40 40-50 60-20z" fill="#ff5a7a" stroke="#fff" stroke-width="10" transform="translate(0 -40) scale(1)"/></svg>';
  }
  return { icon: icon, defs: defs, logo: logo };
})();
