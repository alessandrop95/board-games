/* ===== Disegna e indovina: grafica disegnata da zero (lavagna, matita, scarabocchi) e icone ===== */
var DGArt = (function () {
  function defs() { return ''; }
  // uno scarabocchio di una casa con il sole (per la home)
  function doodle() {
    return '<svg viewBox="0 0 200 150" aria-hidden="true"><g fill="none" stroke-linecap="round" stroke-linejoin="round">' +
      '<path d="M40 120 V75 L80 45 L120 75 V120 Z" stroke="#1d2333" stroke-width="4"/><path d="M70 120 V95 H90 V120" stroke="#e0402c" stroke-width="4"/>' +
      '<path d="M48 82 h14 v12 h-14z M98 82 h14 v12 h-14z" stroke="#3d8bfd" stroke-width="3.5"/><path d="M100 60 V40 H110 V68" stroke="#1d2333" stroke-width="4"/>' +
      '<circle cx="160" cy="35" r="14" stroke="#f2b705" stroke-width="4"/><path d="M160 12v-6 M160 64v-6 M183 35h6 M131 35h6 M176 19l4-4 M140 55l4-4 M176 51l4 4 M140 15l4 4" stroke="#f2b705" stroke-width="3.5"/>' +
      '<path d="M10 128 C40 122 80 132 120 126 S180 124 195 128" stroke="#2fb36d" stroke-width="4"/></g></svg>';
  }
  function pencil() {
    return '<svg viewBox="0 0 120 30" aria-hidden="true"><path d="M8 15 L26 6 H104 a6 6 0 0 1 6 6 v6 a6 6 0 0 1 -6 6 H26 Z" fill="#f2b705" stroke="#8a5a00" stroke-width="2"/>' +
      '<path d="M8 15 L26 6 V24 Z" fill="#f4d2a6" stroke="#8a5a00" stroke-width="2"/><path d="M8 15 L14 12 V18 Z" fill="#1d2333"/><rect x="96" y="6" width="14" height="18" rx="4" fill="#ef8a9a" stroke="#a04050" stroke-width="2"/><path d="M30 12 H94 M30 18 H94" stroke="#d6a000" stroke-width="2"/></svg>';
  }
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4 16l-1.2-3a1.4 1.4 0 0 1 2.5-1.3L8 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>',
    undo: '<path d="M9 7L4 12l5 5" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" stroke-linejoin="round"/><path d="M4 12h10a6 6 0 0 1 0 12h-2" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linecap="round" transform="translate(0 -4)"/>',
    trash: '<path d="M5 7h14M10 7V5h4v2M7 7l1 13h8l1-13" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    eraser: '<path d="M4 16l9-9 6 6-7 7H8z M9 20h11" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round" stroke-linecap="round"/>',
    send: '<path d="M4 12l16-8-6 16-3-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    flag: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>',
    pen: '<path d="M4 20l1-4L16 5l3 3L8 19z M14 7l3 3" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function logo() {
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><defs><linearGradient id="dg-bg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#ff8a5a"/><stop offset="1" stop-color="#c2364a"/></linearGradient></defs>' +
      '<rect width="512" height="512" fill="url(#dg-bg)"/><rect x="64" y="84" width="384" height="300" rx="26" fill="#fffdf6" transform="rotate(-4 256 234)"/>' +
      '<g transform="rotate(-4 256 234)" fill="none" stroke-linecap="round" stroke-linejoin="round"><path d="M140 330 V230 L230 160 L320 230 V330 Z" stroke="#1d2333" stroke-width="16"/><path d="M205 330 V275 H255 V330" stroke="#3d8bfd" stroke-width="14"/>' +
      '<circle cx="380" cy="160" r="34" stroke="#f2b705" stroke-width="14"/></g>' +
      '<g transform="translate(250 330) rotate(-38)"><path d="M0 30 L44 8 H230 a14 14 0 0 1 14 14 v16 a14 14 0 0 1 -14 14 H44 Z" fill="#f2b705" stroke="#6a4400" stroke-width="6"/><path d="M0 30 L44 8 V52 Z" fill="#f4d2a6" stroke="#6a4400" stroke-width="6"/><path d="M0 30 L16 22 V38 Z" fill="#1d2333"/><rect x="214" y="8" width="30" height="44" rx="10" fill="#ef8a9a" stroke="#6a4400" stroke-width="6"/></g></svg>';
  }
  return { defs: defs, doodle: doodle, pencil: pencil, icon: icon, logo: logo };
})();
