/* ===== Polvere & Piombo: carte illustrate con incisioni e dipinti western di pubblico dominio ===== */
var PPCards = (function () {
  var D = PPData;
  var KIND = { b: 'Immediata', e: 'Equipaggiamento', g: 'Carta verde' };
  function esc(s) { return String(s == null ? '' : s).replace(/[&<>"']/g, function (c) { return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]; }); }
  function img(name) { return 'img/' + name + '.jpg'; }
  function art(name, pos) { return '<div class="art" style="background-image:url(' + img(name) + ')' + (pos ? ';background-position:' + pos : '') + '"></div>'; }
  // simbolo della categoria nell'angolo in basso: stella (immediata), ferro di cavallo (equipaggiamento), mirino (arma)
  var GLYPH = {
    b: '<svg viewBox="0 0 24 24"><path d="M12 2.5l2.6 6.1 6.6.6-5 4.4 1.5 6.5L12 16.7l-5.7 3.4 1.5-6.5-5-4.4 6.6-.6z"/></svg>',
    e: '<svg viewBox="0 0 24 24"><path d="M6 3.5C3.6 6 3 9.6 3.6 13c.7 4 3.6 7.2 8.4 7.5 4.8-.3 7.7-3.5 8.4-7.5.6-3.4 0-7-2.4-9.5l-2.6 1.4c1.6 1.9 2 4.4 1.6 6.9-.5 2.9-2.4 5-5 5.2-2.6-.2-4.5-2.3-5-5.2-.4-2.5 0-5 1.6-6.9z"/></svg>',
    g: '<svg viewBox="0 0 24 24"><path d="M6 2h12v2.2c0 3.1-2.6 5.2-4.6 7.8 2 2.6 4.6 4.7 4.6 7.8V22H6v-2.2c0-3.1 2.6-5.2 4.6-7.8C8.6 9.4 6 7.3 6 4.2z"/></svg>',
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
  function eqChip(id, extra, cls) {
    var C = D.CARDS[id], T = D.TYPES[C.t], k = T.w ? 'w' : T.kind, bad = C.t === 'gattabuia' || C.t === 'candelotto';
    return '<span class="eqc k-' + k + (bad ? ' bad' : '') + (cls ? ' ' + cls : '') + '" data-card="' + id + '" ' + (extra || '') + '><span class="th" style="background-image:url(' + img('c-' + C.t) + ')"></span><span class="tx"><b>' + T.n + (T.w ? ' <em>' + T.w + '</em>' : '') + '</b><small>' + T.s + '</small></span></span>';
  }
  function abilityChip(label, sub, cls) { return '<span class="eqc ab ' + (cls || '') + '"><span class="th gl">' + GLYPH.w + '</span><span class="tx"><b>' + label + '</b><small>' + sub + '</small></span></span>'; }
  function preload() {
    var names = D.ORDER.concat(D.ORDER_DC).map(function (t) { return 'c-' + t; }).concat(D.CHARS.map(function (c) { return 'f-' + c.id; }), ['r-sceriffo', 'r-vice', 'r-bandito', 'r-traditore', 'tomb']);
    names.forEach(function (n, i) { setTimeout(function () { var im = new Image(); im.src = img(n); }, i * 25); });
  }
  // carte evento (Mezzogiorno di Fuoco / Per un Pugno di Carte): avvisi tipografici, senza illustrazioni
  var EVI = {
    sun: '<circle cx="12" cy="12" r="5"/><path d="M12 1v4M12 19v4M1 12h4M19 12h4M4.2 4.2l2.8 2.8M17 17l2.8 2.8M4.2 19.8L7 17M17 7l2.8-2.8" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    heart: '<path d="M12 21s-8-5.2-8-11a4.6 4.6 0 0 1 8-3 4.6 4.6 0 0 1 8 3c0 5.8-8 11-8 11z"/>',
    spade: '<path d="M12 2s8 6.4 8 11a4 4 0 0 1-6.6 3l1.1 5h-5l1.1-5A4 4 0 0 1 4 13c0-4.6 8-11 8-11z"/>',
    bottle: '<path d="M10 2h4v4l2 3v12a1 1 0 0 1-1 1H9a1 1 0 0 1-1-1V9l2-3z"/>',
    train: '<path d="M3 15V7h9v3h3V6h4v9h2v3H2v-3zm3 5a2 2 0 1 1 0-.1zm11 0a2 2 0 1 1 0-.1zM5 9v3h5V9z"/>',
    cross: '<path d="M10 2h4v6h6v4h-6v10h-4V12H4V8h6z"/>',
    plus: '<path d="M9 3h6v6h6v6h-6v6H9v-6H3V9h6z"/>',
    ghost: '<path d="M12 2a7 7 0 0 1 7 7v13l-2.3-2-2.4 2-2.3-2-2.3 2-2.4-2L5 22V9a7 7 0 0 1 7-7zm-2.5 6a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3zm5 0a1.5 1.5 0 1 0 0 3 1.5 1.5 0 0 0 0-3z"/>',
    book: '<path d="M4 3h7a2 2 0 0 1 2 2v16a2 2 0 0 0-2-2H4zm16 0h-5a2 2 0 0 0-2 2v16a2 2 0 0 1 2-2h5z"/>',
    target: '<circle cx="12" cy="12" r="8" fill="none" stroke="currentColor" stroke-width="2"/><circle cx="12" cy="12" r="2.5"/><path d="M12 1v6M12 17v6M1 12h6M17 12h6" stroke="currentColor" stroke-width="2"/>',
    back: '<path d="M12 4a8 8 0 1 1-7.4 5H1l4.5-5L10 9H6.8A5.5 5.5 0 1 0 12 6.5z"/>',
    mask: '<path d="M2.5 9.5c3.2-2 6.3-2.6 9.5-2.6s6.3.6 9.5 2.6c-.4 3.4-2.5 5.6-5.4 5.6-1.8 0-3.1-1-4.1-2.4-1 1.4-2.3 2.4-4.1 2.4-2.9 0-5-2.2-5.4-5.6zm4.6 1.1a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0zm6.6 0a1.6 1.6 0 1 0 3.2 0 1.6 1.6 0 0 0-3.2 0z"/>',
    clock: '<circle cx="12" cy="12" r="9" fill="none" stroke="currentColor" stroke-width="2.4"/><path d="M12 6v6l4 3" stroke="currentColor" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    cactus: '<path d="M10 22V4a2 2 0 0 1 4 0v18zm-1-8H6a2 2 0 0 1-2-2V8h2v4h3zm6-2h3V7h2v5a2 2 0 0 1-2 2h-3z"/>',
    coffin: '<path d="M8 2h8l3 6-3 14H8L5 8z"/>',
    drop: '<path d="M12 2s7 7.6 7 12.5A7 7 0 0 1 5 14.5C5 9.6 12 2 12 2z"/>',
    gavel: '<path d="M13 2l7 7-3 3-7-7zM8 7l7 7-2 2-7-7zM11.5 13.5L4 21l-1.5-1.5L10 12z"/>',
    loop: '<circle cx="12" cy="10" r="6.5" fill="none" stroke="currentColor" stroke-width="2.6"/><path d="M12 16.5L9 22" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/>',
    star: '<path d="M12 1.8l2.4 4.6 5.1-.9-1.3 5 3.6 3.6-5 1.4-.3 5.2L12 18l-4.5 2.7-.3-5.2-5-1.4 3.6-3.6-1.3-5 5.1.9z"/>',
    glass: '<path d="M5 3h14l-2 17a2 2 0 0 1-2 1H9a2 2 0 0 1-2-1zm2.3 4l.5 5h8.4l.5-5z"/>',
    pick: '<path d="M3 7c5-5 13-5 18 0-3-1.5-6-2-9-2S6 5.5 3 7zm8-1h2v17h-2z"/>',
    eye: '<path d="M1 12s4-7 11-7 11 7 11 7-4 7-11 7S1 12 1 12zm11-4a4 4 0 1 0 0 8 4 4 0 0 0 0-8z"/>',
    swap: '<path d="M7 3L2 8l5 5V9.5h11v-3H7zm10 8v3.5H6v3h11V21l5-5z"/>',
    bolt: '<path d="M3 13l5-9 3 5 3-5 3 5 4-5-5 16-3-6-3 6z"/>',
    drum: '<circle cx="12" cy="12" r="10"/><g fill="#f3e3b5"><circle cx="12" cy="6" r="2"/><circle cx="17.2" cy="9" r="2"/><circle cx="17.2" cy="15" r="2"/><circle cx="12" cy="18" r="2"/><circle cx="6.8" cy="15" r="2"/><circle cx="6.8" cy="9" r="2"/></g>',
    cards: '<path d="M3 7l7-3 3 8-7 3zM10 5l6-1 2 10-7 1zM13 4l6 1-1 11-4-1z"/>'
  };
  var EVICON = { benedizione: 'heart', maledizione: 'spade', sbornia: 'bottle', sete: 'drop', treno: 'train', reverendo: 'cross', dottore: 'plus', fantasma: 'ghost', sermone: 'book',
    sparatoria: 'target', corsaoro: 'back', dalton: 'mask', mezzogiorno: 'clock', agguato: 'cactus', cecchino: 'target', deadman: 'coffin', fratelli: 'drop', giudice: 'gavel',
    lazo: 'loop', leggewest: 'star', liquoreforte: 'glass', miniera: 'pick', peyote: 'eye', ranch: 'swap', rimbalzo: 'bolt', roulette: 'drum', vendetta: 'back', pugnocarte: 'cards' };
  function evIcon(k) { return '<svg viewBox="0 0 24 24" aria-hidden="true">' + EVI[EVICON[k] || 'star'] + '</svg>'; }
  function event(k, cls, attrs) {
    var X = D.EVENTS[k];
    return '<div class="evc ev-' + X.set + (X.final ? ' fin' : '') + ' ' + (cls || '') + '" data-ev="' + k + '" ' + (attrs || '') + '><span class="set">' + (X.set === 'hn' ? 'Mezzogiorno di Fuoco' : 'Per un Pugno di Carte') + '</span>' +
      '<span class="ic">' + evIcon(k) + '</span><b>' + X.n + '</b><small>' + X.s + '</small>' + (X.final ? '<em>ultima carta</em>' : '') + '</div>';
  }
  function eventBack(set, cls) { return '<div class="evc back ev-' + set + ' ' + (cls || '') + '"><span class="ic">' + evIcon(set === 'fc' ? 'pugnocarte' : 'mezzogiorno') + '</span><small>eventi</small></div>'; }
  return { event: event, eventBack: eventBack, evIcon: evIcon, card: card, type: type, char: char, role: role, back: back, portrait: portrait, eqChip: eqChip, abilityChip: abilityChip, preload: preload, bullets: bullets, img: img, GLYPH: GLYPH };
})();
