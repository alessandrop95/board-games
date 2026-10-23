/* ===== Presagio: carte "fantasy moderno" (illustrazioni antiche di pubblico dominio trattate a luce) ===== */
var PRCards = (function () {
  var KEYS = ['fiamme', 'maree', 'foreste', 'sabbie'];
  // simboli delle casate, a linee sottili (viewBox 24x24)
  var ICON = [
    '<path d="M12 2.5c2.4 3.4 6.4 6.2 6.4 11.2a6.4 6.4 0 0 1-12.8 0c0-3 1.7-4.9 3.1-6.6.3 1.9 1 3 2.2 3.8-.5-3.2.4-5.9 1.1-8.4z"/><path d="M12 21c-1.8 0-3-1.3-3-3 0-1.8 1.6-2.8 2.5-4.4.9 1.6 3.5 2.6 3.5 4.4 0 1.7-1.2 3-3 3z"/>',
    '<path d="M2 9.5c2.2-2.6 4.5-2.6 6.7 0s4.5 2.6 6.6 0 4.5-2.6 6.7 0"/><path d="M2 14.5c2.2-2.6 4.5-2.6 6.7 0s4.5 2.6 6.6 0 4.5-2.6 6.7 0"/><path d="M2 19.5c2.2-2.6 4.5-2.6 6.7 0s4.5 2.6 6.6 0 4.5-2.6 6.7 0"/>',
    '<path d="M12 2.5C18.5 6 20 13 15.6 18.2 14.4 19.6 13.2 20.6 12 21.5c-1.2-.9-2.4-1.9-3.6-3.3C4 13 5.5 6 12 2.5z"/><path d="M12 6v16M12 11l3-2.2M12 15l-3.4-2.4M12 18.2l2.6-1.8"/>',
    '<path d="M6 2.5h12M6 21.5h12"/><path d="M7 2.5c0 5 4 6.8 4 9.5s-4 4.5-4 9.5M17 2.5c0 5-4 6.8-4 9.5s4 4.5 4 9.5"/><path d="M9.3 18.6c1-1.4 1.9-2 2.7-2s1.7.6 2.7 2"/>'
  ];
  var STAR = '<path d="M12 2l2.3 7.2H22l-6.1 4.5 2.3 7.3L12 16.5 5.8 21l2.3-7.3L2 9.2h7.7z"/>';
  var MASK = '<path d="M3 7c3 1.2 6 1.2 9 0 3 1.2 6 1.2 9 0-.2 6.5-3.3 11-9 12.5C6.3 18 3.2 13.5 3 7z"/><path d="M7 11.5c1-.8 2-.8 3 0M14 11.5c1-.8 2-.8 3 0M9 15.5c2 1.2 4 1.2 6 0"/>';
  function icon(path, cls) { return '<svg class="' + (cls || 'ic') + '" viewBox="0 0 24 24" aria-hidden="true">' + path + '</svg>'; }
  function suitIcon(s, cls) { return icon(ICON[s], cls); }

  function name(id) {
    var c = PRData.CARDS[id];
    return c.k === 'w' ? 'Arcimago' : c.k === 'j' ? 'Giullare' : c.v + ' di ' + PRData.SUITS[c.s].n;
  }
  // stessa illustrazione per casata, inquadratura diversa per ogni valore
  function framing(v) { return 'background-position:' + ((v * 37) % 100) + '% ' + ((v * 53 + 20) % 100) + '%'; }
  function html(id, cls, attrs) {
    var c = PRData.CARDS[id], inner;
    if (c.k === 'n') {
      var pips = '';
      for (var i = 0; i < c.v; i++) { var a = -Math.PI / 2 + i * 2 * Math.PI / c.v; pips += '<i style="left:' + (50 + Math.cos(a) * 41).toFixed(1) + '%;top:' + (50 + Math.sin(a) * 41).toFixed(1) + '%"></i>'; }
      inner = '<div class="art" style="' + framing(c.v) + '"></div><div class="shade"></div>' +
        '<div class="corner tl"><b>' + c.v + '</b>' + suitIcon(c.s) + '</div><div class="corner br"><b>' + c.v + '</b>' + suitIcon(c.s) + '</div>' +
        '<div class="medal"><div class="pips">' + pips + '</div><span>' + c.v + '</span></div>' +
        '<div class="label">' + PRData.SUITS[c.s].n + '</div>';
      cls = 'k-n s-' + KEYS[c.s] + ' ' + (cls || '');
    } else {
      var w = c.k === 'w';
      inner = '<div class="art"></div><div class="shade"></div><div class="foil"></div>' +
        '<div class="corner tl">' + icon(w ? STAR : MASK) + '</div><div class="corner br">' + icon(w ? STAR : MASK) + '</div>' +
        '<div class="title">' + (w ? 'Arcimago' : 'Giullare') + '</div><div class="sub">' + (w ? 'vince la presa' : 'perde la presa') + '</div>';
      cls = (w ? 'k-w' : 'k-j') + ' ' + (cls || '');
    }
    return '<div class="card ' + cls + '" data-c="' + id + '" ' + (attrs || '') + '><div class="face">' + inner + '</div></div>';
  }
  function back(cls, attrs) { return '<div class="card back ' + (cls || '') + '" ' + (attrs || '') + '><div class="face"><div class="disc"></div><div class="rim"></div><div class="word">Presagio</div></div></div>'; }
  function preload() { ['card-fiamme', 'card-maree', 'card-foreste', 'card-sabbie', 'card-arcimago', 'card-giullare', 'cielo-disc'].forEach(function (n) { var i = new Image(); i.src = 'img/' + n + '.jpg'; }); }
  return { html: html, back: back, name: name, suitIcon: suitIcon, preload: preload, KEYS: KEYS };
})();
