/* ===== Conquista l'Italia: la mappa a tessere, le icone e il logo ===== */
var CQArt = (function () {
  var D = CQData, S = 62, GAP = 6;
  var COLS = ['#ff5a4e', '#3d8bfd', '#2fb36d', '#f2b705', '#a35cf0', '#ef4f8b', '#16b5c4', '#c27a3a'];
  var IC = {
    help: '<circle cx="12" cy="12" r="10" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2 9.3a2.9 2.9 0 1 1 4.3 2.5c-.9.5-1.5 1.1-1.5 2.2" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><circle cx="12" cy="17.4" r="1.3" fill="currentColor"/>',
    check: '<path d="M5 12.5l4.5 4.5L19 7.5" fill="none" stroke="currentColor" stroke-width="2.6" stroke-linecap="round" stroke-linejoin="round"/>',
    hand: '<path d="M8 13V5.5a1.5 1.5 0 0 1 3 0V11V4a1.5 1.5 0 0 1 3 0v7V5.5a1.5 1.5 0 0 1 3 0V14c0 4-2.5 7-6.5 7S5 18.5 4 16l-1.2-3a1.4 1.4 0 0 1 2.5-1.3L8 15" fill="none" stroke="currentColor" stroke-width="1.9" stroke-linejoin="round" stroke-linecap="round"/>',
    send: '<path d="M4 12l16-8-6 16-3-6z" fill="none" stroke="currentColor" stroke-width="2" stroke-linejoin="round"/>',
    flag: '<path d="M6 21V4M6 4h11l-2.5 4L17 12H6" fill="none" stroke="currentColor" stroke-width="2.2" stroke-linejoin="round" stroke-linecap="round"/>'
  };
  function icon(k) { return '<svg class="ic" viewBox="0 0 24 24" aria-hidden="true">' + (IC[k] || '') + '</svg>'; }
  function defs() { return ''; }
  function col(g, t) { return t < 0 ? null : COLS[(g.teams[t].col || 0) % COLS.length]; }
  function pos(r) { return { x: r.x * (S + GAP) + (r.y % 2 ? (S + GAP) / 2 : 0) * .35, y: r.y * (S + GAP) }; }
  // g: { own, teams }, o: { can: [indici], last: indice, mini }
  function map(g, o) {
    o = o || {};
    var W = 5 * (S + GAP) + 30, H = 8 * (S + GAP);
    var links = '';
    D.ADJ.forEach(function (a, i) { a.forEach(function (j) { if (j < i) return; var p = pos(D.R[i]), q = pos(D.R[j]); links += '<path d="M' + (p.x + S / 2) + ' ' + (p.y + S / 2) + 'L' + (q.x + S / 2) + ' ' + (q.y + S / 2) + '" class="ln"/>'; }); });
    var tiles = D.R.map(function (r, i) {
      var p = pos(r), t = g.own[i], c = col(g, t), can = o.can && o.can.indexOf(i) >= 0;
      return '<g class="rg' + (can ? ' can' : '') + (o.last === i ? ' last' : '') + '"' + (can ? ' data-act="region" data-r="' + i + '"' : '') + ' transform="translate(' + p.x.toFixed(1) + ' ' + p.y + ')"><title>' + r.name + '</title>' +
        '<rect width="' + S + '" height="' + S + '" rx="14" fill="' + (c || '#f4ecd8') + '" stroke="' + (c ? '#fff' : '#c9b48a') + '" stroke-width="' + (c ? 3 : 2) + '"/>' +
        (o.mini ? '' : '<text x="' + S / 2 + '" y="' + (S / 2 + 6) + '" text-anchor="middle" class="rl' + (c ? ' on' : '') + '">' + r.short + '</text>') + '</g>';
    }).join('');
    return '<svg class="cqmap' + (o.mini ? ' mini' : '') + '" viewBox="-8 -8 ' + (W + 16) + ' ' + (H + 8) + '" role="img" aria-label="Mappa delle regioni"><g class="sea">' + links + '</g>' + tiles + '</svg>';
  }
  function logo() {
    var own = D.R.map(function (r, i) { return i % 3 === 0 ? 0 : i % 3 === 1 ? 1 : -1; });
    return '<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 512 512"><rect width="512" height="512" fill="#1f6fa8"/><g transform="translate(90 20) scale(.92)">' +
      D.R.map(function (r, i) { var p = pos(r), c = own[i] === 0 ? '#ff5a4e' : own[i] === 1 ? '#f2b705' : '#f4ecd8'; return '<rect x="' + p.x.toFixed(1) + '" y="' + p.y + '" width="' + S + '" height="' + S + '" rx="14" fill="' + c + '" stroke="#fff" stroke-width="4"/>'; }).join('') + '</g></svg>';
  }
  return { icon: icon, defs: defs, map: map, logo: logo, COLS: COLS };
})();
