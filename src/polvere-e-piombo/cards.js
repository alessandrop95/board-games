/* ===== Polvere & Piombo: carte illustrate con incisioni e dipinti western di pubblico dominio ===== */
var PPCards = (function () {
  var D = PPData;
  var KIND = { b: 'Immediata', e: 'Equipaggiamento' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(name) { return 'img/' + name + '.jpg'; }
  function art(name, pos) { return '<div class="art" style="background-image:url(' + img(name) + ')' + (pos ? ';background-position:' + pos : '') + '"></div>'; }
  // simbolo della categoria nell'angolo in basso: stella (immediata), ferro di cavallo (equipaggiamento), mirino (arma)
  var GLYPH = {
    b: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.7 3.4 1.5-6.5-5-4.4 6.6-.6z"/></svg>',
    e: '<svg viewBox="0 0 24 24"><path d="M6 3.5C3.6 6 3 9.6 3.6 13c.7 4 3.6 7.2 8.4 7.5 4.8-.3 7.7-3.5 8.4-7.5.6-3.4 0-7-2.4-9.5l-2.6 1.4c1.6 1.9 2 4.4 1.6 6.9-.5 2.9-2.4 5-5 5.2-2.6-.2-4.5-2.3-5-5.2-.4-2.5 0-5 1.6-6.9z"/></svg>',
    w: '<svg viewBox="0 0 24 24"><circle cx="12" cy="12" r="7.5" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.2"/><path d="M12 1.5v5M12 17.5v5M1.5 12h5M17.5 12h5" stroke="currentColor" stroke-width="2"/></svg>'
  };
  function idx(C) {
    var red = C.s === 'H' || C.s === 'D';
    return '<div class="idx' + (red ? ' red' : '') + '"><b>' + C.r + '</b><i>' + D.SUITSYM[C.s] + '</i></div>';
  }
  function body(t, C) {
    var T = D.TYPES[t], k = T.w ? 'w' : T.kind;
    return '<div class="face"><div class="hd"><span class="ttl">' + T.n + '</span></div>' + art('c-' + t) + (C ? idx(C) : '') +
      (T.w ? '<div class="rng" title="Portata ' + T.w + '"><b>' + T.w + '</b><small>portata</small></div>' : '') +
      '<div class="txt"><p>' + T.txt + '</p></div>' +
      '<div class="ft"><span class="gl">' + GLYPH[k] + '</span>' + (T.w ? 'Arma' : KIND[T.kind]) + '</div></div>';
  }
  function kindCls(t) { var T = D.TYPES[t]; return 'k-' + (T.w ? 'w' : T.kind) + ' t-' + t; }
  // carta del mazzo (con seme e valore)
  function card(id, cls, attrs) {
    var C = D.CARDS[id];
    return '<div class="card ' + kindCls(C.t) + ' ' + (cls || '') + '" data-card="' + id + '" ' + (attrs || '') + '>' + body(C.t, C) + '</div>';
  }
  // carta "tipo" (galleria, regole): senza seme
  function type(t, cls, attrs) { return '<div class="card ' + kindCls(t) + ' ' + (cls || '') + '" ' + (attrs || '') + '>' + body(t, null) + '</div>'; }
  function bullets(n, max) { var s = ''; for (var i = 0; i < max; i++) s += '<i' + (i < n ? '' : ' class="lost"') + '></i>'; return s; }
  function char(cid, hp, cls, attrs) {
    var C = D.CHAR[cid], max = C.hp + (hp && hp > C.hp ? hp - C.hp : 0), n = hp == null ? C.hp : hp;
    return '<div class="card k-c ' + (cls || '') + '" data-char="' + cid + '" ' + (attrs || '') + '><div class="face">' + art('p-' + cid) +
      '<div class="hd"><span class="ttl">' + C.n + '</span><span class="sub">' + C.title + '</span></div>' +
      '<div class="hpb" aria-label="' + n + ' punti vita">' + bullets(n, n) + '</div>' +
      '<div class="txt"><p>' + C.txt + '</p></div></div></div>';
  }
  var ROLEGLYPH = {
    sceriffo: '<svg viewBox="0 0 24 24"><path d="M12 1.8l2.4 4.6 5.1-.9-1.3 5 3.6 3.6-5 1.4-.3 5.2L12 18l-4.5 2.7-.3-5.2-5-1.4 3.6-3.6-1.3-5 5.1.9z"/></svg>',
    vice: '<svg viewBox="0 0 24 24"><path d="M12 2l2.5 5.6 6 .6-4.6 4 1.4 6L12 15.1l-5.3 3.1 1.4-6-4.6-4 6-.6z"/></svg>',
    bandito: '<svg viewBox="0 0 24 24"><path d="M2.5 9.5c3.2-2 6.3-2.6 9.5-2.6s6.3.6 9.5 2.6c-.4 3.4-2.5 5.6-5.4 5.6-1.8 0-3.1-1-4.1-2.4-1 1.4-2.3 2.4-4.1 2.4-2.9 0-5-2.2-5.4-5.6zm4.6 1.1a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0zm6.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0z"/></svg>',
    traditore: '<svg viewBox="0 0 24 24"><path d="M13.5 2l-2 7h5l-9 13 2.5-9H5z"/></svg>'
  };
  function role(r, cls) {
    var R = D.ROLES[r];
    return '<div class="card k-r r-' + r + ' ' + (cls || '') + '"><div class="face">' + art('r-' + r) +
      '<div class="hd"><span class="ttl">' + R.n + '</span></div><div class="rbadge">' + ROLEGLYPH[r] + '</div>' +
      '<div class="txt"><p>' + R.goal + '</p></div></div></div>';
  }
  function back(cls, attrs) {
    return '<div class="card back ' + (cls || '') + '" ' + (attrs || '') + '><div class="face"><div class="bk-frame"></div><div class="bk-med"><span class="bk-star">' + ROLEGLYPH.sceriffo + '</span><b>P&amp;P</b></div><div class="bk-word">Polvere &amp; Piombo</div></div></div>';
  }
  function portrait(cid, cls) { return '<span class="portrait ' + (cls || '') + '" style="background-image:url(' + img('p-' + cid) + ')"></span>'; }
  // equipaggiamento in gioco, in piccolo ma leggibile: miniatura, nome ed effetto
  function eqChip(id, extra) {
    var C = D.CARDS[id], T = D.TYPES[C.t], k = T.w ? 'w' : 'e', bad = C.t === 'gattabuia' || C.t === 'candelotto';
    return '<span class="eqc k-' + k + (bad ? ' bad' : '') + '" data-card="' + id + '" ' + (extra || '') + '><span class="th" style="background-image:url(' + img('c-' + C.t) + ')"></span><span class="tx"><b>' + T.n + (T.w ? ' <em>' + T.w + '</em>' : '') + '</b><small>' + T.s + '</small></span></span>';
  }
  function abilityChip(label, sub, cls) { return '<span class="eqc ab ' + (cls || '') + '"><span class="th gl">' + GLYPH.w + '</span><span class="tx"><b>' + label + '</b><small>' + sub + '</small></span></span>'; }
  function preload() {
    var names = D.ORDER.map(function (t) { return 'c-' + t; }).concat(D.CHARS.map(function (c) { return 'p-' + c.id; }), ['r-sceriffo', 'r-vice', 'r-bandito', 'r-traditore', 'tomb']);
    names.forEach(function (n, i) { setTimeout(function () { var im = new Image(); im.src = img(n); }, i * 25); });
  }
  return { card: card, type: type, char: char, role: role, back: back, portrait: portrait, eqChip: eqChip, abilityChip: abilityChip, preload: preload, bullets: bullets, img: img, GLYPH: GLYPH };
})();
