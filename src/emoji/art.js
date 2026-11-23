/* ===== Emoji in scena: disegni (icone, palcoscenico, logo) ===== */
var ESArt = (function () {
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    hand: '<path d="M7 12V6.5a1.5 1.5 0 0 1 3 0V11m0-5.5V4.5a1.5 1.5 0 0 1 3 0V11m0-5a1.5 1.5 0 0 1 3 0v6m0-3.5a1.5 1.5 0 0 1 3 0V15a6 6 0 0 1-6 6h-1.5a6 6 0 0 1-4.6-2.2L4.2 15.5a1.6 1.6 0 0 1 2.4-2.1L7 14" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linecap="round" stroke-linejoin="round"/>',
    undo: '<path d="M9 7L4 12l5 5M4 12h10a6 6 0 0 1 0 12" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round" transform="translate(0 -3)"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    swap: '<path d="M4 8h13l-3-3M20 16H7l3 3" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/>',
    send: '<path d="M4 12l16-8-6 16-2.5-6.5z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    clap: '<path d="M4 7l4 13h9l3-11-9-3zM6 4l2 2M11 2v3M15 3l-1 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function hero() {
    return '<div class="hero-art" aria-hidden="true"><div class="hero-stage"><span class="curtain l"></span><span class="curtain r"></span><div class="hero-clue"><span>🚢</span><span>🧊</span><span>💔</span></div><div class="hero-g g1">La nave?</div><div class="hero-g g2 ok">Titanic!</div></div></div>';
  }
  function defs() { return ''; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><radialGradient id="es-bg" cx=".5" cy=".3" r=".85"><stop offset="0" stop-color="#ff8a5c"/><stop offset=".5" stop-color="#c2366a"/><stop offset="1" stop-color="#3a0f4a"/></radialGradient><linearGradient id="es-c" x1="0" x2="1"><stop offset="0" stop-color="#9a1030"/><stop offset=".5" stop-color="#d8304a"/><stop offset="1" stop-color="#9a1030"/></linearGradient></defs>' +
      '<rect width="512" height="512" fill="url(#es-bg)"/><path d="M0 0h512v70H0z" fill="#7a0c26"/><path d="M0 60c40 30 90 30 128 0 38 30 90 30 128 0 38 30 90 30 128 0 38 30 90 30 128 0v20H0z" fill="#9a1030"/>' +
      '<path d="M0 70c60 20 70 200 40 420H0z" fill="url(#es-c)"/><path d="M512 70c-60 20-70 200-40 420h40z" fill="url(#es-c)"/>' +
      '<circle cx="256" cy="270" r="128" fill="#ffd23f" stroke="#7a3a00" stroke-width="10"/><ellipse cx="212" cy="244" rx="16" ry="24" fill="#3a1a00"/><ellipse cx="300" cy="244" rx="16" ry="24" fill="#3a1a00"/>' +
      '<path d="M180 300c40 56 112 56 152 0" fill="#3a1a00" stroke="#3a1a00" stroke-width="10" stroke-linejoin="round"/><path d="M200 312c34 26 78 26 112 0" fill="#ff6b7a"/>' +
      '<path d="M120 452h272" stroke="#ffd23f" stroke-width="14" stroke-linecap="round" opacity=".6"/></svg>';
  }
  return { icon: icon, hero: hero, defs: defs, logo: logo };
})();
