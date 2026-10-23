/* ===== Gattomina: carte in stile cartoon (emoji 3D Noto di Google, licenza Apache 2.0, composte in illustrazioni) ===== */
var GMCards = (function () {
  var D = GMData;
  function src(code) { return 'img/e/' + code + '.webp'; }
  // per ogni carta: colore, sfondo e figure [codice, x%, y%, larghezza%, rotazione, classe]
  var LOOK = {
    bomba:      { c1: '#3a1530', c2: '#0f0a14', ink: '#ffdf6b', parts: [['1f4a5', 50, 52, 108, 0, 'fx'], ['1f4a3', 50, 60, 70, -8, ''], ['1f640', 70, 30, 48, 10, 'pop']] },
    scatoletta: { c1: '#4ee0ab', c2: '#139a76', ink: '#08382b', parts: [['2728', 22, 22, 30, 0, 'tw'], ['1f63b', 44, 44, 66, -6, ''], ['1f96b', 72, 70, 42, 10, 'pop']] },
    agguato:    { c1: '#ff9a3d', c2: '#e2491b', ink: '#3b1302', parts: [['1f4a2', 78, 22, 30, 0, 'tw'], ['1f408_200d_2b1b', 48, 52, 78, 0, ''], ['1f43e', 26, 78, 36, -15, 'pop']] },
    pisolino:   { c1: '#7d86ff', c2: '#3a3ec8', ink: '#0e0f3d', parts: [['1f63d', 46, 56, 70, 0, ''], ['1f4a4', 74, 24, 40, 0, 'float']] },
    fusa:       { c1: '#ff7cc0', c2: '#e23c8b', ink: '#43062a', parts: [['1f63a', 44, 46, 68, -4, ''], ['1f381', 72, 72, 40, 8, 'pop']] },
    gomitolo:   { c1: '#c97cff', c2: '#7b30cf', ink: '#2b0b4a', parts: [['1f408', 40, 50, 70, 0, ''], ['1f9f6', 74, 70, 42, 0, 'spin']] },
    sfera:      { c1: '#40d6e8', c2: '#1a7fae', ink: '#062c3d', parts: [['2728', 78, 24, 28, 0, 'tw'], ['1f52e', 50, 58, 66, 0, ''], ['1f440', 50, 26, 40, 0, 'pop']] },
    soffio:     { c1: '#ff5f72', c2: '#c3112f', ink: '#3d030d', parts: [['1f4a8', 24, 50, 40, 180, 'float'], ['1f63e', 58, 50, 70, 0, '']] },
    pirata:     { c1: '#4f7fd6', c2: '#1d3c7d', ink: '#081738', parts: [['1f3f4_200d_2620', 70, 26, 46, 6, 'flag'], ['1f63c', 44, 58, 66, 0, '']] },
    spaghetti:  { c1: '#ffd34d', c2: '#f29a17', ink: '#3d2402', parts: [['1f639', 50, 42, 64, 0, ''], ['1f35d', 52, 76, 52, 0, 'pop']] },
    re:         { c1: '#ffb84d', c2: '#c8571a', ink: '#3b1604', parts: [['1f431', 50, 56, 66, 0, ''], ['1f451', 50, 22, 46, -6, 'pop']] },
    rapito:     { c1: '#6b5bd6', c2: '#21185e', ink: '#ffffff', parts: [['1f6f8', 50, 24, 54, 0, 'float'], ['1f63f', 50, 64, 58, 0, 'beam']] },
    rockstar:   { c1: '#a6ef4f', c2: '#3fa41c', ink: '#123a03', parts: [['1f638', 42, 48, 66, 0, ''], ['1f3b8', 70, 66, 52, -30, 'pop']] }
  };
  function art(t) {
    var L = LOOK[t];
    return '<div class="art">' + L.parts.map(function (p) {
      return '<img class="pt ' + p[5] + '" src="' + src(p[0]) + '" alt="" draggable="false" style="left:' + p[1] + '%;top:' + p[2] + '%;width:' + p[3] + '%;--r:' + p[4] + 'deg">';
    }).join('') + '</div>';
  }
  function style(t) { var L = LOOK[t]; return '--c1:' + L.c1 + ';--c2:' + L.c2 + ';--ink:' + L.ink; }
  function html(id, cls, attrs) {
    var t = D.CARDS[id].t, T = D.TYPES[t];
    return '<div class="card k-' + T.k + ' t-' + t + ' ' + (cls || '') + '" data-c="' + id + '" style="' + style(t) + '" ' + (attrs || '') + '><div class="face"><div class="rays"></div>' +
      '<div class="ttl">' + T.n + '</div>' + art(t) + '<div class="txt"><b>' + T.s + '</b><span>' + T.txt + '</span></div>' +
      (T.k === 'cat' ? '<div class="combo" title="Si gioca in coppia">×2</div>' : '') + '</div></div>';
  }
  function typeHTML(t, cls) { var id = D.CARDS.filter(function (c) { return c.t === t; })[0].id; return html(id, cls).replace(/ data-c="\d+"/, ''); }
  function back(cls, attrs) {
    return '<div class="card back ' + (cls || '') + '" ' + (attrs || '') + '><div class="face"><div class="paws"></div><div class="logo"><img src="' + src('1f4a3') + '" alt=""><img class="cat" src="' + src('1f640') + '" alt=""></div><div class="word">Gattomina</div></div></div>';
  }
  var AV = ['1f63a', '1f638', '1f63c', '1f639', '1f63d', '1f431', '1f63b', '1f63e'];
  function avatar(i, out) { return '<img class="avimg" src="' + src(out ? '1f47b' : AV[i % AV.length]) + '" alt="" draggable="false">'; }
  function name(id) { return D.TYPES[D.CARDS[id].t].n; }
  function preload() { var seen = {}; Object.keys(LOOK).forEach(function (t) { LOOK[t].parts.forEach(function (p) { if (!seen[p[0]]) { seen[p[0]] = 1; var im = new Image(); im.src = src(p[0]); } }); }); ['1f47b', '1f525', '1f4a5', '1f389', '1f3c6', '1f451', '1f4ab'].concat(AV).forEach(function (c) { var im = new Image(); im.src = src(c); }); }
  return { html: html, typeHTML: typeHTML, back: back, avatar: avatar, name: name, src: src, preload: preload, LOOK: LOOK };
})();
