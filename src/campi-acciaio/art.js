/* ===== Campi d'Acciaio: pedine, ritratti e icone in SVG (tutto disegnato da zero) =====
   Le pedine hanno il punto (0,0) a terra, al centro della basetta. */
var CAArt = (function () {
  var F = CAData.FACTIONS;
  function base(rx, f) {
    return '<ellipse cx="5" cy="1" rx="' + (rx + 6) + '" ry="' + (rx * 0.3 + 2) + '" fill="rgba(15,10,5,.4)"/>' +
      '<ellipse cx="0" cy="-1" rx="' + rx + '" ry="' + (rx * 0.3) + '" fill="' + f.dark + '"/>' +
      '<ellipse cx="0" cy="-4" rx="' + rx + '" ry="' + (rx * 0.3) + '" fill="#2b2620"/>' +
      '<ellipse cx="0" cy="-4" rx="' + (rx - 3) + '" ry="' + (rx * 0.3 - 1.5) + '" fill="none" stroke="' + f.col + '" stroke-width="1.6" opacity=".9"/>';
  }
  function rivets(pts, c) { return pts.map(function (p) { return '<circle cx="' + p[0] + '" cy="' + p[1] + '" r="1.4" fill="' + c + '"/>'; }).join(''); }

  /* ---------- mech ---------- */
  var MECH = {
    ferro: function (f) {
      return base(40, f) +
        '<rect x="-38" y="-32" width="22" height="30" rx="9" fill="#2f2a26"/><rect x="16" y="-32" width="22" height="30" rx="9" fill="#24201d"/>' +
        [-27, 27].map(function (x) { return [-23, -11].map(function (y) { return '<circle cx="' + x + '" cy="' + y + '" r="5.5" fill="#5f5850"/><circle cx="' + x + '" cy="' + y + '" r="2" fill="#2a2420"/>'; }).join(''); }).join('') +
        '<path d="M-38,-20 h22 M-38,-14 h22 M16,-20 h22 M16,-14 h22" stroke="#1a1714" stroke-width="1.2"/>' +
        '<path d="M-31,-28 L31,-28 L35,-57 L-35,-57 Z" fill="' + f.col + '"/><path d="M31,-28 L42,-35 L46,-63 L35,-57 Z" fill="' + f.dark + '"/>' +
        '<path d="M-35,-57 L35,-57 L46,-63 L-24,-63 Z" fill="' + f.light + '"/><path d="M-31,-28 L31,-28 L32,-34 L-32,-34 Z" fill="rgba(0,0,0,.18)"/>' +
        rivets([[-28, -55], [-18, -55], [-8, -55], [2, -55], [12, -55], [22, -55]], '#f2c3b5') +
        gear(0, -43, 8.5, f.trim, f.dark) +
        '<path d="M-34,-50 L-52,-38 L-50,-33 L-31,-43 Z" fill="#6b645b"/><path d="M-52,-38 l-8,-6 m8,6 l-9,2 m9,-2 l-6,8" stroke="#3c3732" stroke-width="3" stroke-linecap="round" fill="none"/>' +
        '<path d="M-17,-57 L15,-57 L15,-81 L-17,-81 Z" fill="' + f.col + '"/><path d="M15,-57 L24,-62 L24,-86 L15,-81 Z" fill="' + f.dark + '"/><path d="M-17,-81 L15,-81 L24,-86 L-8,-86 Z" fill="' + f.light + '"/>' +
        '<rect x="-12" y="-77" width="22" height="9" rx="2" fill="#ffd27a"/><rect x="-12" y="-77" width="22" height="3" rx="1.5" fill="#fff1c8" opacity=".8"/>' +
        '<path d="M20,-67 L64,-73 L64,-80 L20,-75 Z" fill="#5a544d"/><path d="M20,-75 L64,-80 L64,-78 L20,-73 Z" fill="#8a837a"/><rect x="61" y="-82" width="6" height="11" rx="1.5" fill="#3a3530"/>' +
        '<rect x="-6" y="-102" width="8" height="21" fill="#3b3530"/><rect x="-8" y="-105" width="12" height="4" rx="1" fill="#26221e"/>';
    },
    campi: function (f) {
      return base(32, f) +
        '<path d="M-14,-4 L-10,-34 L-20,-52" stroke="#4a4540" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<path d="M14,-4 L18,-34 L8,-52" stroke="#3a3530" stroke-width="6" fill="none" stroke-linejoin="round" stroke-linecap="round"/>' +
        '<circle cx="-10" cy="-34" r="4.5" fill="' + f.trim + '"/><circle cx="18" cy="-34" r="4.5" fill="' + f.trim + '"/><path d="M-20,-4 h12 M8,-4 h12" stroke="#2b2620" stroke-width="5" stroke-linecap="round"/>' +
        '<ellipse cx="0" cy="-70" rx="30" ry="22" fill="' + f.col + '"/><path d="M0,-92 A30,22 0 0 1 30,-70 A30,22 0 0 1 0,-48 Z" fill="' + f.dark + '" opacity=".55"/>' +
        '<ellipse cx="-10" cy="-78" rx="12" ry="7" fill="' + f.light + '" opacity=".85"/>' +
        '<path d="M-29,-74 Q0,-66 29,-74 M-27,-62 Q0,-55 27,-62" stroke="' + f.trim + '" stroke-width="3" fill="none"/>' +
        rivets([[-20, -71], [-10, -69], [0, -68.5], [10, -69], [20, -71]], '#5f7a92') +
        '<circle cx="-4" cy="-70" r="7" fill="#ffd27a" stroke="#6b5a3a" stroke-width="2"/><circle cx="-6" cy="-72" r="2" fill="#fff6d8"/>' +
        '<rect x="10" y="-104" width="8" height="18" fill="#3b3530"/><rect x="8" y="-107" width="12" height="4" rx="1" fill="#26221e"/>' +
        '<path d="M-28,-66 L-46,-58 L-44,-52" stroke="#5a534b" stroke-width="5" fill="none" stroke-linecap="round"/><path d="M28,-66 L44,-62 L50,-66" stroke="#4a443d" stroke-width="5" fill="none" stroke-linecap="round"/>';
    },
    brina: function (f) {
      var leg = function (x1, x2, x3, c) { return '<path d="M' + x1 + ',-40 L' + x2 + ',-22 L' + x3 + ',-5" stroke="' + c + '" stroke-width="5.5" fill="none" stroke-linejoin="round" stroke-linecap="round"/><ellipse cx="' + x3 + '" cy="-4" rx="5" ry="2.5" fill="#2b2620"/><circle cx="' + x2 + '" cy="-22" r="3.4" fill="' + f.trim + '"/>'; };
      return base(42, f) + leg(-10, -18, -14, '#3a3a40') + leg(26, 34, 30, '#3a3a40') + leg(-26, -34, -30, '#55555c') + leg(10, 18, 16, '#55555c') +
        '<ellipse cx="0" cy="-52" rx="36" ry="15" fill="' + f.col + '"/><path d="M-36,-52 A36,15 0 0 0 36,-52 L36,-50 A36,13 0 0 1 -36,-50 Z" fill="' + f.dark + '"/>' +
        '<ellipse cx="-6" cy="-58" rx="26" ry="6" fill="' + f.light + '" opacity=".7"/>' +
        '<path d="M-24,-60 Q-6,-66 14,-61" stroke="' + f.trim + '" stroke-width="2.5" fill="none"/>' + rivets([[-28, -48], [-16, -45], [-4, -44], [8, -44], [20, -46]], '#c9dcef') +
        '<path d="M26,-58 L48,-62 L52,-48 L30,-44 Z" fill="' + f.col + '"/><path d="M48,-62 L54,-58 L56,-46 L52,-48 Z" fill="' + f.dark + '"/>' +
        '<rect x="36" y="-58" width="12" height="6" rx="1.5" fill="#ffd27a"/>' +
        '<path d="M42,-62 l-4,-14 l-6,-2 m6,2 l2,-8 m-2,8 l-8,-8 M48,-62 l5,-13 l6,-3 m-6,3 l-1,-8 m1,8 l8,-6" stroke="' + f.trim + '" stroke-width="2.6" stroke-linecap="round" fill="none"/>' +
        '<rect x="-26" y="-82" width="7" height="20" fill="#3b3530"/><rect x="-28" y="-85" width="11" height="4" rx="1" fill="#26221e"/>';
    },
    steppa: function (f) {
      var leg = function (x1, x2, x3, c) { return '<path d="M' + x1 + ',-46 L' + x2 + ',-26 L' + x3 + ',-5" stroke="' + c + '" stroke-width="4" fill="none" stroke-linejoin="round" stroke-linecap="round"/><path d="M' + (x3 - 4) + ',-4 h8" stroke="#2b2620" stroke-width="3" stroke-linecap="round"/>'; };
      return base(38, f) + leg(-12, -20, -14, '#4a3f30') + leg(24, 30, 26, '#4a3f30') + leg(-26, -32, -28, '#665643') + leg(10, 16, 14, '#665643') +
        '<path d="M-32,-48 Q-30,-62 -8,-62 L22,-60 Q36,-58 36,-48 Q20,-40 -6,-41 Q-26,-41 -32,-48 Z" fill="' + f.col + '"/>' +
        '<path d="M-32,-48 Q-26,-41 -6,-41 Q20,-40 36,-48 L34,-44 Q18,-36 -6,-37 Q-26,-37 -30,-44 Z" fill="' + f.dark + '"/>' +
        '<path d="M-20,-58 Q0,-63 20,-58" stroke="' + f.light + '" stroke-width="3" fill="none" opacity=".9"/>' +
        '<path d="M-8,-62 Q-2,-80 14,-76 L18,-62 Z" fill="' + f.trim + '"/><path d="M-4,-66 Q0,-76 12,-73 L14,-66 Z" fill="#ffd27a" opacity=".9"/>' +
        '<path d="M34,-52 Q50,-58 54,-70 L60,-68 Q56,-52 38,-46 Z" fill="' + f.col + '"/><circle cx="56" cy="-68" r="4" fill="' + f.dark + '"/><circle cx="57" cy="-69" r="1.5" fill="#ffd27a"/>' +
        '<path d="M-28,-54 L-30,-96" stroke="#3a2a1c" stroke-width="2.2"/><path class="pennant" d="M-30,-96 L-12,-91 L-29,-86 Z" fill="' + f.trim + '"/>' +
        rivets([[-20, -45], [-8, -44], [4, -44], [16, -45]], '#7a5a1c') +
        '<rect x="20" y="-74" width="6" height="16" fill="#3b3530"/><rect x="18" y="-77" width="10" height="4" rx="1" fill="#26221e"/>';
    },
    carbone: function (f) {
      return base(38, f) +
        '<path d="M-20,-4 L-18,-30 L-6,-30 L-6,-4 Z" fill="#2c2c32"/><path d="M6,-4 L6,-30 L18,-30 L20,-4 Z" fill="#1d1d22"/>' +
        '<rect x="-24" y="-8" width="20" height="6" rx="2" fill="#141418"/><rect x="4" y="-8" width="20" height="6" rx="2" fill="#141418"/>' +
        '<circle cx="-12" cy="-26" r="5" fill="' + f.trim + '"/><circle cx="12" cy="-26" r="5" fill="' + f.trim + '"/>' +
        '<path d="M-30,-30 L30,-30 L36,-72 L-36,-72 Z" fill="' + f.col + '"/><path d="M30,-30 L38,-36 L44,-76 L36,-72 Z" fill="' + f.dark + '"/><path d="M-36,-72 L36,-72 L44,-76 L-28,-76 Z" fill="' + f.light + '"/>' +
        '<path d="M-30,-30 L30,-30 L31,-36 L-31,-36 Z" fill="rgba(0,0,0,.25)"/>' +
        '<rect x="-20" y="-64" width="34" height="6" rx="2" fill="#ff9a3c"/><rect x="-20" y="-64" width="34" height="2" rx="1" fill="#ffe0a0"/>' +
        '<path d="M-36,-72 Q-54,-74 -52,-56 L-36,-52 Z" fill="' + f.dark + '"/><path d="M36,-72 Q54,-74 52,-56 L38,-52 Z" fill="#1c1c20"/>' +
        '<path d="M-36,-70 Q-50,-71 -50,-60" stroke="' + f.trim + '" stroke-width="2" fill="none"/><path d="M36,-70 Q50,-71 50,-60" stroke="' + f.trim + '" stroke-width="2" fill="none"/>' +
        '<path d="M-50,-56 L-54,-36 L-46,-34 L-42,-54 Z" fill="#3a3a42"/><path d="M50,-56 L56,-38 L64,-40 L58,-58 Z" fill="#2a2a30"/><rect x="58" y="-46" width="16" height="7" rx="2" fill="#3a3a42" transform="rotate(-12 58 -46)"/>' +
        rivets([[-26, -40], [-14, -40], [-2, -40], [10, -40], [22, -40]], f.trim) +
        '<path d="M-6,-50 l6,-6 l6,6 l-6,6 Z" fill="' + f.trim + '"/>' +
        [-16, -4, 8].map(function (x) { return '<rect x="' + x + '" y="-96" width="7" height="22" fill="#26262c"/><rect x="' + (x - 1.5) + '" y="-99" width="10" height="4" rx="1" fill="#141418"/>'; }).join('');
    }
  };
  var PUFF = { ferro: [-2, -106], campi: [14, -108], brina: [-22, -88], steppa: [23, -78], carbone: [-1, -100] };
  function gear(x, y, r, c, hole) {
    var t = ''; for (var i = 0; i < 8; i++) t += '<rect x="' + (x - 1.6) + '" y="' + (y - r - 2) + '" width="3.2" height="4" fill="' + c + '" transform="rotate(' + i * 45 + ' ' + x + ' ' + y + ')"/>';
    return '<circle cx="' + x + '" cy="' + y + '" r="' + r + '" fill="' + c + '"/>' + t + '<circle cx="' + x + '" cy="' + y + '" r="' + (r * 0.38) + '" fill="' + hole + '"/>';
  }
  function mech(fac) { return MECH[fac](F[fac]); }

  /* ---------- personaggi con animale ---------- */
  var ANIMAL = {
    brina: function () { // alce
      return '<ellipse cx="-26" cy="-2" rx="16" ry="4" fill="rgba(15,10,5,.3)"/>' +
        '<path d="M-36,-2 L-35,-20 M-31,-2 L-30,-20 M-20,-2 L-20,-20 M-15,-2 L-16,-20" stroke="#4a3626" stroke-width="3" stroke-linecap="round"/>' +
        '<path d="M-40,-20 Q-40,-34 -26,-34 L-14,-33 Q-8,-30 -10,-20 Z" fill="#6b4a32"/><path d="M-40,-24 Q-30,-22 -10,-24" stroke="#4a3626" stroke-width="2" fill="none"/>' +
        '<path d="M-14,-32 Q-8,-40 -8,-44 L-2,-42 Q0,-34 -6,-30 Z" fill="#6b4a32"/><path d="M-8,-44 Q2,-48 4,-40 Q3,-37 -2,-38 Z" fill="#5a3e2a"/>' +
        '<path d="M-6,-46 Q-14,-56 -20,-52 Q-16,-50 -18,-46 M-6,-46 Q-12,-58 -10,-60 M-4,-46 Q2,-58 10,-56 Q6,-54 8,-50 M-4,-46 Q0,-58 -2,-62" stroke="#d8c9a8" stroke-width="2.4" stroke-linecap="round" fill="none"/>' +
        '<circle cx="-3" cy="-42" r="1" fill="#1a120c"/><path d="M-4,-36 q-2,4 0,6" stroke="#4a3626" stroke-width="2" fill="none"/>';
    },
    ferro: function () { // lince
      return '<ellipse cx="-17" cy="-4" rx="12" ry="4" fill="rgba(15,10,5,.3)"/><ellipse cx="-17" cy="-6" rx="12" ry="5" fill="#8c7458"/>' +
        '<path d="M-28,-6 Q-30,-20 -22,-25 L-12,-25 Q-6,-18 -7,-6 Z" fill="#b3946d"/><path d="M-22,-25 Q-24,-36 -16,-37 Q-9,-36 -10,-26 Z" fill="#c4a57c"/>' +
        '<path d="M-22,-34 l-2,-8 l4,5 Z M-12,-34 l2,-8 l-4,5 Z" fill="#3c3128"/><circle cx="-19" cy="-31" r="1.2" fill="#2a2018"/><circle cx="-13.5" cy="-31" r="1.2" fill="#2a2018"/>' +
        '<path d="M-26,-14 q-2,4 1,7 M-20,-18 l-1,3 M-14,-20 l1,3" stroke="#6e5a44" stroke-width="1.4" fill="none"/><path d="M-7,-8 q8,-2 7,-9" stroke="#8c7458" stroke-width="3" fill="none" stroke-linecap="round"/>';
    },
    steppa: function () { // cavallo
      return '<ellipse cx="-26" cy="-2" rx="20" ry="4" fill="rgba(15,10,5,.3)"/>' +
        '<path d="M-42,-2 L-40,-22 M-37,-2 L-36,-22 M-18,-2 L-19,-22 M-13,-2 L-15,-22" stroke="#5a3a24" stroke-width="3.2" stroke-linecap="round"/>' +
        '<path d="M-44,-22 Q-46,-36 -30,-36 L-18,-36 Q-10,-34 -12,-22 Z" fill="#8a5a36"/><path d="M-44,-28 Q-52,-24 -50,-12" stroke="#2e1e14" stroke-width="3" fill="none" stroke-linecap="round"/>' +
        '<path d="M-16,-34 Q-10,-46 -6,-52 L0,-50 Q-2,-40 -8,-30 Z" fill="#8a5a36"/><path d="M-6,-52 Q4,-52 6,-44 L2,-42 Q-2,-46 -4,-44 Z" fill="#7a4e2e"/>' +
        '<path d="M-14,-36 Q-12,-48 -6,-54" stroke="#2e1e14" stroke-width="3" fill="none"/><path d="M-6,-54 l-1,-4 l3,3" fill="#7a4e2e"/><circle cx="-1" cy="-49" r="1" fill="#1a120c"/>' +
        '<path d="M-34,-36 L-24,-36 L-26,-30 L-34,-30 Z" fill="' + F.steppa.trim + '"/>';
    },
    carbone: function () { // due mastini
      var dog = function (x, s) {
        return '<g transform="translate(' + x + ' 0) scale(' + s + ')"><ellipse cx="0" cy="-2" rx="11" ry="3" fill="rgba(15,10,5,.3)"/><path d="M-8,-2 L-8,-12 M-4,-2 L-4,-12 M5,-2 L5,-12 M8,-2 L8,-12" stroke="#2a2a2e" stroke-width="2.6" stroke-linecap="round"/>' +
          '<path d="M-11,-12 Q-12,-21 -2,-21 L6,-21 Q12,-20 10,-12 Z" fill="#3e3e46"/><path d="M6,-20 Q14,-28 18,-22 Q19,-17 12,-16 Z" fill="#46464e"/><path d="M14,-24 l-2,-5 l4,3 Z" fill="#2a2a2e"/><circle cx="15" cy="-21" r=".9" fill="#ffcc66"/>' +
          '<path d="M-11,-17 q-5,-2 -5,-7" stroke="#3e3e46" stroke-width="2" fill="none"/><path d="M4,-19 L10,-17" stroke="' + F.carbone.trim + '" stroke-width="1.6"/></g>';
      };
      return dog(-30, 1) + dog(-18, 0.85);
    },
    campi: function () { // bisonte
      return '<ellipse cx="-24" cy="-2" rx="20" ry="4" fill="rgba(15,10,5,.3)"/>' +
        '<path d="M-38,-2 L-38,-14 M-33,-2 L-33,-14 M-16,-2 L-17,-14 M-12,-2 L-13,-14" stroke="#2e2016" stroke-width="3.4" stroke-linecap="round"/>' +
        '<path d="M-42,-14 Q-44,-26 -34,-30 Q-24,-40 -12,-32 Q-6,-28 -8,-14 Z" fill="#5a3c26"/><path d="M-30,-32 Q-20,-42 -12,-32 Q-16,-30 -26,-30 Z" fill="#7a5638"/>' +
        '<path d="M-10,-30 Q0,-30 2,-20 Q0,-14 -8,-14 Z" fill="#3e2a1a"/><path d="M-4,-28 q-2,-6 2,-8 M2,-26 q4,-4 6,0" stroke="#e8dcc0" stroke-width="2" fill="none" stroke-linecap="round"/>' +
        '<circle cx="-2" cy="-24" r="1" fill="#120c08"/><path d="M-6,-16 q2,4 6,3" stroke="#2e2016" stroke-width="2" fill="none"/>';
    }
  };
  var HERO = {
    brina: { coat: '#3f7fbf', coatD: '#24507e', skin: '#e9c2a0', hat: 'fur', hatC: '#e8e2d6', hair: '#d9b56a', beard: true, item: 'axe' },
    ferro: { coat: '#b5402f', coatD: '#7a2419', skin: '#e6b896', hat: 'fur', hatC: '#5e5248', hair: '#4a4038', item: 'rifle' },
    steppa: { coat: '#c99026', coatD: '#8a5e14', skin: '#c99a72', hat: 'scarf', hatC: '#7a3a1c', hair: '#2a1c14', item: 'saber' },
    carbone: { coat: '#2e2e34', coatD: '#18181c', skin: '#e3bc9c', hat: 'cap', hatC: '#1c1c20', hair: '#6a5a4a', mustache: true, item: 'saber' },
    campi: { coat: '#e2dac6', coatD: '#a89f8a', skin: '#ecc4a4', hat: 'beret', hatC: '#4f6e8c', hair: '#c9a46a', item: 'rifle' }
  };
  function heroFull(fac) {
    var h = HERO[fac], f = F[fac];
    var hat = h.hat === 'fur' ? '<path d="M3,-68 q8,-12 16,0 Z" fill="' + h.hatC + '"/><rect x="2" y="-71" width="18" height="6" rx="3" fill="' + h.hatC + '"/><path d="M3,-66 l-1,7 M19,-66 l1,7" stroke="' + h.hatC + '" stroke-width="3" stroke-linecap="round"/>'
      : h.hat === 'cap' ? '<path d="M3,-69 q8,-9 16,0 Z" fill="' + h.hatC + '"/><path d="M2,-68 h20 l-4,3 h-14 Z" fill="' + h.hatC + '"/><rect x="4" y="-70" width="14" height="2" fill="' + f.trim + '"/>'
      : h.hat === 'beret' ? '<ellipse cx="11" cy="-71" rx="10" ry="4.5" fill="' + h.hatC + '"/><circle cx="11" cy="-75" r="1.6" fill="' + h.hatC + '"/>'
      : '<path d="M2,-66 Q2,-78 11,-78 Q20,-78 20,-66 L22,-58 L17,-62 L5,-62 L0,-58 Z" fill="' + h.hatC + '"/>';
    var back = h.item === 'rifle' ? '<path d="M-6,-70 L26,-40" stroke="#4b3a2a" stroke-width="3" stroke-linecap="round"/><path d="M-8,-72 l3,3" stroke="#222" stroke-width="3"/>' : '';
    var front = h.item === 'axe' ? '<path d="M24,-58 L28,-30" stroke="#5a4030" stroke-width="2.6" stroke-linecap="round"/><path d="M22,-60 q8,-4 9,4 l-7,1 Z" fill="#9aa3ad"/>'
      : h.item === 'saber' ? '<path d="M3,-40 L-4,-14" stroke="#c9cdd2" stroke-width="2" stroke-linecap="round"/><path d="M4,-42 l-3,2" stroke="' + f.trim + '" stroke-width="3"/>' : '';
    return '<g class="pc-body">' + base(32, f) + ANIMAL[fac]() + back +
      '<path d="M2,-4 L4,-24 L10,-24 L10,-4 Z M12,-4 L13,-24 L19,-24 L18,-4 Z" fill="#2c2622"/>' +
      '<path d="M-1,-20 L23,-20 L19,-58 L3,-58 Z" fill="' + h.coat + '"/><path d="M11,-20 L23,-20 L19,-58 L11,-58 Z" fill="' + h.coatD + '"/>' +
      '<rect x="2" y="-40" width="19" height="3.5" fill="#3a2a1e"/><rect x="9.5" y="-40.5" width="4" height="4.5" fill="' + f.trim + '"/>' +
      '<path d="M3,-56 L-4,-34 L0,-33 L7,-50 Z" fill="' + h.coat + '"/><path d="M19,-56 L25,-35 L21,-34 L16,-50 Z" fill="' + h.coatD + '"/>' +
      '<circle cx="-2" cy="-32" r="2.6" fill="' + h.skin + '"/><circle cx="23" cy="-33" r="2.6" fill="' + h.skin + '"/>' +
      '<rect x="8" y="-62" width="6" height="5" fill="' + h.skin + '"/><circle cx="11" cy="-67" r="7" fill="' + h.skin + '"/>' +
      '<path d="M4,-66 q1,6 3,8 M18,-66 q-1,6 -3,8" stroke="' + h.hair + '" stroke-width="2" fill="none"/>' +
      (h.beard ? '<path d="M5,-65 Q11,-54 17,-65 Q15,-60 11,-60 Q7,-60 5,-65 Z" fill="' + h.hair + '"/>' : '') +
      (h.mustache ? '<path d="M7,-63.5 q4,-2 4,0 q0,-2 4,0" stroke="' + h.hair + '" stroke-width="1.6" fill="none"/>' : '') +
      '<circle cx="9" cy="-67" r=".9" fill="#2a1e16"/><circle cx="13.5" cy="-67" r=".9" fill="#2a1e16"/>' + hat + front + '</g>';
  }
  function worker(fac) {
    var f = F[fac];
    return '<g class="pc-body">' + base(11, f) + '<path d="M-7,-4 L-5,-22 Q0,-26 5,-22 L7,-4 Z" fill="' + f.col + '"/><path d="M0,-4 L0,-24 Q3,-24 5,-22 L7,-4 Z" fill="' + f.dark + '"/>' +
      '<rect x="-6" y="-12" width="12" height="2" fill="rgba(0,0,0,.25)"/>' +
      '<circle cx="0" cy="-28" r="5.5" fill="#e3b08e"/><path d="M-6,-29 q6,-8 12,0 Z" fill="#4a3d32"/><rect x="-6.5" y="-30" width="13" height="2.2" rx="1" fill="#3a3028"/></g>';
  }

  /* ---------- strutture ---------- */
  function structure(s, fac) {
    var f = F[fac], sh = '<ellipse cx="6" cy="1" rx="20" ry="5" fill="rgba(15,10,5,.35)"/>';
    if (s === 'mil') return '<g class="mill">' + sh + '<path d="M-11,0 L-8,-36 L8,-36 L11,0 Z" fill="#e6dcc6"/><path d="M0,0 L0,-36 L8,-36 L11,0 Z" fill="#bfb39a"/>' +
      '<path d="M-11,-36 L0,-50 L11,-36 Z" fill="' + f.col + '"/><path d="M0,-50 L11,-36 L5,-36 Z" fill="' + f.dark + '"/><rect x="-3" y="-12" width="6" height="12" rx="3" fill="#4a3a2a"/><circle cx="0" cy="-26" r="2.5" fill="#ffd27a"/>' +
      '<g transform="translate(0 -38) scale(.62)"><g class="sails">' + [0, 90, 180, 270].map(function (a) { return '<g transform="rotate(' + a + ')"><rect x="-1" y="-30" width="2" height="30" fill="#5a4632"/><rect x="1" y="-28" width="7" height="22" fill="#f1ead8" stroke="#8a7a5c" stroke-width=".8"/></g>'; }).join('') + '<circle r="4" fill="#3a2a1c"/></g></g></g>';
    if (s === 'mon') return sh + '<rect x="-14" y="-8" width="28" height="8" fill="#8c8578"/><rect x="-14" y="-8" width="28" height="2" fill="#b3ab9c"/><rect x="-9" y="-16" width="18" height="8" fill="#a39b8c"/>' +
      '<path d="M-4,-16 L-3,-40 L3,-40 L4,-16 Z" fill="#c9c1b0"/><path d="M0,-16 L0,-40 L3,-40 L4,-16 Z" fill="#9d9584"/>' +
      '<path d="M-5,-40 L0,-50 L5,-40 Z" fill="' + f.col + '"/><circle cx="0" cy="-30" r="3" fill="' + f.trim + '"/><path d="M-12,-4 h24" stroke="' + f.col + '" stroke-width="2"/>';
    if (s === 'min') return sh + '<path d="M-16,0 L-16,-12 Q-16,-24 0,-24 Q16,-24 16,-12 L16,0 Z" fill="#6f6a60"/><path d="M-9,0 L-9,-11 Q-9,-17 0,-17 Q9,-17 9,-11 L9,0 Z" fill="#14110e"/>' +
      '<path d="M-12,-2 L-12,-12 M12,-2 L12,-12 M-12,-12 Q0,-22 12,-12" stroke="#5a4030" stroke-width="2.4" fill="none"/><rect x="-5" y="-6" width="10" height="5" fill="#5a4a3a"/>' +
      '<circle cx="-3" cy="-1" r="1.6" fill="#2a2420"/><circle cx="3" cy="-1" r="1.6" fill="#2a2420"/><path d="M-16,-24 L-16,-32 L-6,-30 L-16,-28" fill="' + f.col + '" stroke="#3a2a1c" stroke-width="1"/>';
    return sh + '<path d="M-14,0 L-14,-22 L14,-22 L14,0 Z" fill="#7a6e5e"/><path d="M4,0 L4,-22 L14,-22 L14,0 Z" fill="#5c5244"/>' +
      '<path d="M-16,-22 L-16,-28 L-10,-28 L-10,-25 L-4,-25 L-4,-28 L2,-28 L2,-25 L8,-25 L8,-28 L16,-28 L16,-22 Z" fill="#8c8070"/>' +
      '<path d="M-5,0 L-5,-10 Q0,-15 5,-10 L5,0 Z" fill="#2a2018"/><path d="M-2,-28 L-2,-40" stroke="#3a2a1c" stroke-width="1.6"/><path d="M-2,-40 L10,-37 L-2,-34 Z" fill="' + f.col + '"/>' +
      '<path d="M-10,-16 l6,-6 M-4,-16 l-6,-6" stroke="' + f.trim + '" stroke-width="1.6"/>';
  }

  /* ---------- risorse e segnalini ---------- */
  var RESC = { f: ['#e3b64a', '#a07a22'], m: ['#9aa1a9', '#5f666e'], w: ['#9a6a3e', '#5e3e22'], o: ['#2a2a30', '#111114'] };
  function resToken(r) {
    if (r === 'f') return '<path d="M-7,0 Q-9,-10 -3,-14 L3,-14 Q9,-10 7,0 Z" fill="#d8b26a"/><path d="M-3,-14 q3,-4 6,0" fill="#c49a4e"/><path d="M-4,-14 l4,3 l4,-3" stroke="#8a6a32" stroke-width="1.2" fill="none"/><path d="M-5,-6 q5,2 10,0" stroke="#b08a42" stroke-width="1" fill="none"/>';
    if (r === 'm') return '<path d="M-9,0 L9,0 L6,-6 L-6,-6 Z" fill="#8e9399"/><path d="M-6,-6 L6,-6 L4.5,-8 L-4.5,-8 Z" fill="#d2d6db"/><path d="M6,-6 L9,0 L7,0 L4.5,-6 Z" fill="#62676d"/>';
    if (r === 'w') return '<rect x="-9" y="-6" width="18" height="6" rx="3" fill="#8a5c34"/><ellipse cx="-9" cy="-3" rx="2.4" ry="3" fill="#d9b88c"/><rect x="-6" y="-11" width="14" height="5.5" rx="2.75" fill="#9a6a3e"/><ellipse cx="-6" cy="-8.3" rx="2.2" ry="2.75" fill="#e2c49a"/>';
    return '<rect x="-6" y="-14" width="12" height="14" rx="2" fill="#2e2e36"/><ellipse cx="0" cy="-14" rx="6" ry="2" fill="#4a4a56"/><path d="M-6,-10 h12 M-6,-4 h12" stroke="#c9963c" stroke-width="1.4"/><path d="M-2,-9 q2,-3 4,0 q0,3 -2,3 q-2,0 -2,-3 Z" fill="#c9963c" opacity=".7"/>';
  }
  function resStack(r, n) {
    return '<g class="rstack"><ellipse cx="2" cy="1.5" rx="11" ry="3" fill="rgba(15,10,5,.35)"/>' + resToken(r) +
      (n > 1 ? '<g transform="translate(9 -15)"><circle r="7.5" fill="#1d1a17" stroke="' + RESC[r][0] + '" stroke-width="1.4"/><text y="3.5" text-anchor="middle" font-size="10" font-weight="700" fill="#f3efe6" font-family="system-ui,sans-serif">' + n + '</text></g>' : '') + '</g>';
  }
  function encounter() {
    return '<g class="enc"><ellipse cx="2" cy="3" rx="15" ry="5" fill="rgba(15,10,5,.4)"/><ellipse cx="0" cy="0" rx="15" ry="6" fill="#7a5a26"/><ellipse cx="0" cy="-3" rx="15" ry="6" fill="url(#caBrass)"/>' +
      '<ellipse cx="0" cy="-3" rx="11" ry="4.2" fill="none" stroke="#6b4c1c" stroke-width="1.2"/><g transform="translate(0 -3) scale(1 .42)"><rect x="-2.2" y="-9" width="4.4" height="11" rx="1.8" fill="#3d2a0e"/><circle cy="6" r="2.4" fill="#3d2a0e"/></g>' +
      '<ellipse class="glint" cx="-8" cy="-4" rx="2.5" ry="1.2" fill="#fff8dc"/></g>';
  }
  function tunnel() {
    return '<g class="tunnel"><path d="M-14,0 L-14,-10 A14,13 0 0 1 14,-10 L14,0 Z" fill="#6f6a60"/><path d="M-9,0 L-9,-9 A9,8.5 0 0 1 9,-9 L9,0 Z" fill="#14110e"/>' +
      '<path d="M-14,-10 A14,13 0 0 1 14,-10" stroke="#9c968a" stroke-width="2" fill="none"/><path d="M-13,-4 h3 M10,-4 h3 M-12,-14 l3,2 M12,-14 l-3,2 M0,-23 v4" stroke="#4a463f" stroke-width="1.4"/><path d="M-9,0 L9,0" stroke="#3a352e" stroke-width="2"/></g>';
  }
  function flag(color) { return '<g class="flag"><rect x="-1.2" y="-58" width="2.4" height="58" fill="#4a3a2a"/><circle cx="0" cy="-59" r="2.4" fill="#e3b04b"/><path class="cloth" d="" fill="' + color + '" stroke="rgba(0,0,0,.25)" stroke-width=".8"/></g>'; }
  var DEFS = '<defs><linearGradient id="caBrass" x1="0" y1="0" x2="1" y2="1"><stop offset="0" stop-color="#f3d27a"/><stop offset=".55" stop-color="#c9963c"/><stop offset="1" stop-color="#8a6222"/></linearGradient>' +
    '<radialGradient id="caSmoke"><stop offset="0" stop-color="#a9a298" stop-opacity=".62"/><stop offset=".6" stop-color="#8a837a" stop-opacity=".3"/><stop offset="1" stop-color="#8a837a" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="caPuff"><stop offset="0" stop-color="#d8d2c6" stop-opacity=".8"/><stop offset="1" stop-color="#d8d2c6" stop-opacity="0"/></radialGradient>' +
    '<radialGradient id="caGlow"><stop offset="0" stop-color="#ffe9a8" stop-opacity=".9"/><stop offset="1" stop-color="#ffe9a8" stop-opacity="0"/></radialGradient></defs>';

  /* ---------- ritratti (busto con animale) ---------- */
  var PORTRAIT = {
    brina: { sky: ['#9fc3e0', '#e4eef5'], skin: '#efc9a6', hair: '#d9b56a', coat: '#3f7fbf', collar: '#f1ece2', hat: 'fur', hatC: '#efe8da', beard: true, eyes: '#4a6a8a' },
    ferro: { sky: ['#d9a07a', '#f3dcc4'], skin: '#ebbf9c', hair: '#3a2e26', coat: '#b5402f', collar: '#5e5248', hat: 'fur', hatC: '#5e5248', eyes: '#3a2a20', badge: true },
    steppa: { sky: ['#e8c27a', '#f8ead0'], skin: '#c99a72', hair: '#2a1c14', coat: '#8a5e2e', collar: '#c99026', hat: 'scarf', hatC: '#a8442a', eyes: '#2a1c14', braid: true },
    carbone: { sky: ['#8a8a96', '#cfcfd6'], skin: '#e6c0a0', hair: '#6a5a4a', coat: '#2e2e34', collar: '#c8a24a', hat: 'cap', hatC: '#1c1c20', eyes: '#3a3a44', mustache: true, monocle: true },
    campi: { sky: ['#b8cfa0', '#eef3e2'], skin: '#efc8a8', hair: '#c9a46a', coat: '#e2dac6', collar: '#4f6e8c', hat: 'beret', hatC: '#4f6e8c', eyes: '#4a5a3a', sash: true }
  };
  var PORTRAIT_ANIMAL = {
    brina: '<path d="M-6,62 Q-10,40 -2,30 Q6,20 4,8 L18,6 Q22,26 14,44 Q10,58 12,70 Z" fill="#6b4a32"/><path d="M4,8 Q-2,-2 6,-8 L16,-6 Q20,2 18,6 Z" fill="#5a3e2a"/><circle cx="8" cy="0" r="1.6" fill="#1a120c"/>' +
      '<path d="M10,-6 Q0,-24 -14,-20 Q-6,-18 -8,-12 M10,-6 Q2,-30 -2,-34 M12,-6 Q20,-26 34,-24 Q26,-20 28,-14 M14,-6 Q22,-30 20,-36" stroke="#e4d6b6" stroke-width="4" stroke-linecap="round" fill="none"/>',
    ferro: '<path d="M2,70 Q-6,48 4,36 Q10,30 22,32 Q34,36 32,52 L30,70 Z" fill="#b3946d"/><path d="M6,36 Q4,16 18,14 Q32,16 30,34 Z" fill="#c4a57c"/>' +
      '<path d="M8,20 l-4,-14 l8,9 Z M28,20 l4,-14 l-8,9 Z" fill="#3c3128"/><circle cx="14" cy="24" r="1.8" fill="#2a2018"/><circle cx="23" cy="24" r="1.8" fill="#2a2018"/><path d="M18,28 l0,3 M14,31 q4,3 8,0" stroke="#5a4634" stroke-width="1.4" fill="none"/>' +
      '<path d="M6,30 l-8,2 M6,32 l-8,5 M30,30 l8,2 M30,32 l8,5" stroke="#f0e6d0" stroke-width=".9"/>',
    steppa: '<path d="M0,70 Q-6,44 8,26 Q14,10 10,-4 L24,-8 Q34,10 30,32 Q26,54 30,70 Z" fill="#8a5a36"/><path d="M10,-4 Q4,-14 14,-22 L26,-20 Q30,-12 24,-8 Z" fill="#7a4e2e"/>' +
      '<path d="M22,-8 Q28,6 30,20 Q34,8 30,-4 Z" fill="#2e1e14"/><circle cx="15" cy="-12" r="1.6" fill="#1a120c"/><path d="M12,-24 l-1,-6 l4,4" fill="#7a4e2e"/>',
    carbone: '<path d="M0,70 Q-4,48 6,40 Q14,34 28,38 Q36,46 34,70 Z" fill="#3e3e46"/><path d="M8,40 Q4,24 16,20 Q30,20 32,34 Q28,42 18,42 Z" fill="#46464e"/>' +
      '<path d="M10,22 l-4,-10 l8,6 Z M28,22 l4,-10 l-8,6 Z" fill="#2a2a2e"/><circle cx="15" cy="28" r="1.6" fill="#ffcc66"/><circle cx="24" cy="28" r="1.6" fill="#ffcc66"/><path d="M14,36 q5,4 10,0" stroke="#1c1c20" stroke-width="1.6" fill="none"/>' +
      '<path d="M8,46 Q20,50 32,44" stroke="#c8a24a" stroke-width="2.4" fill="none"/>',
    campi: '<path d="M-4,70 Q-10,46 0,32 Q8,18 24,20 Q40,24 40,44 L38,70 Z" fill="#5a3c26"/><path d="M0,30 Q6,10 24,12 Q34,14 34,24 Q24,22 12,30 Z" fill="#7a5638"/>' +
      '<path d="M22,26 Q30,34 26,46 Q18,50 12,44 Q10,34 22,26 Z" fill="#3e2a1a"/><path d="M14,26 q-4,-8 0,-12 M30,26 q6,-6 2,-12" stroke="#e8dcc0" stroke-width="2.6" fill="none" stroke-linecap="round"/><circle cx="18" cy="34" r="1.6" fill="#120c08"/>'
  };
  function portrait(fac, size) {
    var P = PORTRAIT[fac], f = F[fac], id = 'pt' + fac, s = size || 96;
    var hat = P.hat === 'fur' ? '<path d="M24,40 Q24,16 50,14 Q76,16 76,40 Z" fill="' + P.hatC + '"/><path d="M22,40 Q50,30 78,40 L78,46 Q50,38 22,46 Z" fill="' + P.hatC + '" opacity=".85"/>' +
        '<path d="M30,26 q6,-4 12,-2 M48,20 q8,-2 14,2 M60,30 q6,-2 10,2" stroke="rgba(0,0,0,.18)" stroke-width="2" fill="none"/>' + (P.badge ? '<circle cx="50" cy="30" r="5" fill="' + f.trim + '"/><circle cx="50" cy="30" r="2" fill="' + f.dark + '"/>' : '')
      : P.hat === 'cap' ? '<path d="M26,38 Q28,16 50,16 Q72,16 74,38 Z" fill="' + P.hatC + '"/><path d="M22,40 Q50,48 78,40 L74,36 Q50,42 26,36 Z" fill="#0c0c0e"/><rect x="28" y="33" width="44" height="4" fill="' + f.trim + '"/><circle cx="50" cy="26" r="4" fill="' + f.trim + '"/>'
      : P.hat === 'beret' ? '<ellipse cx="46" cy="28" rx="30" ry="12" fill="' + P.hatC + '" transform="rotate(-8 46 28)"/><circle cx="40" cy="17" r="3" fill="' + P.hatC + '"/>'
      : '<path d="M20,58 Q18,18 50,16 Q82,18 80,58 L74,72 Q74,40 50,36 Q26,40 26,72 Z" fill="' + P.hatC + '"/><path d="M28,30 Q50,22 72,30" stroke="' + f.trim + '" stroke-width="3" fill="none"/>';
    return '<svg class="portrait" viewBox="0 0 100 110" width="' + s + '" height="' + (s * 1.1) + '" aria-hidden="true">' +
      '<defs><linearGradient id="' + id + 's" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="' + P.sky[0] + '"/><stop offset="1" stop-color="' + P.sky[1] + '"/></linearGradient>' +
      '<clipPath id="' + id + 'c"><rect x="4" y="4" width="92" height="102" rx="12"/></clipPath><radialGradient id="' + id + 'v" cx=".5" cy=".4" r=".75"><stop offset=".6" stop-color="#000" stop-opacity="0"/><stop offset="1" stop-color="#000" stop-opacity=".45"/></radialGradient></defs>' +
      '<rect x="2" y="2" width="96" height="106" rx="14" fill="' + f.dark + '"/><g clip-path="url(#' + id + 'c)"><rect width="100" height="110" fill="url(#' + id + 's)"/>' +
      '<path d="M0,74 Q20,62 40,70 Q62,58 100,68 L100,110 L0,110 Z" fill="' + f.dark + '" opacity=".35"/><path d="M0,84 Q30,74 60,82 Q80,78 100,84 L100,110 L0,110 Z" fill="' + f.dark + '" opacity=".5"/>' +
      '<g transform="translate(58 34) scale(.9)">' + PORTRAIT_ANIMAL[fac] + '</g>' +
      // busto
      '<path d="M10,110 Q12,82 30,76 L42,72 L58,72 L70,76 Q88,82 90,110 Z" fill="' + P.coat + '"/><path d="M50,74 L70,76 Q88,82 90,110 L50,110 Z" fill="rgba(0,0,0,.18)"/>' +
      '<path d="M36,74 L50,90 L64,74 L58,70 L50,80 L42,70 Z" fill="' + P.collar + '"/>' +
      (P.sash ? '<path d="M26,80 L74,108 L66,110 L22,86 Z" fill="' + f.trim + '"/>' : '') + (P.collar === '#c8a24a' ? '<path d="M18,84 h16 M66,84 h16" stroke="#c8a24a" stroke-width="4" stroke-linecap="round"/>' : '') +
      '<rect x="43" y="58" width="14" height="16" rx="5" fill="' + P.skin + '"/><path d="M43,66 Q50,72 57,66 L57,70 Q50,76 43,70 Z" fill="rgba(0,0,0,.12)"/>' +
      (P.braid ? '<path d="M30,40 Q24,66 30,84" stroke="' + P.hair + '" stroke-width="7" stroke-linecap="round" fill="none"/>' : '') +
      '<ellipse cx="50" cy="46" rx="17" ry="20" fill="' + P.skin + '"/><path d="M50,26 Q67,28 67,46 Q67,58 60,64 Q66,48 58,40 Z" fill="rgba(0,0,0,.08)"/>' +
      '<path d="M33,44 Q32,28 50,26 Q68,28 67,44 Q60,34 50,34 Q40,34 33,44 Z" fill="' + P.hair + '"/>' +
      '<path d="M40,42 q4,-2 7,0 M53,42 q4,-2 7,0" stroke="' + P.hair + '" stroke-width="1.8" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="43.5" cy="47" rx="2.6" ry="2" fill="#fff"/><ellipse cx="56.5" cy="47" rx="2.6" ry="2" fill="#fff"/><circle cx="43.8" cy="47" r="1.5" fill="' + P.eyes + '"/><circle cx="56.8" cy="47" r="1.5" fill="' + P.eyes + '"/>' +
      '<path d="M50,48 Q48,54 50,56 Q51.5,56 52,55" stroke="rgba(0,0,0,.25)" stroke-width="1.2" fill="none"/><path d="M45,60 Q50,62.5 55,60" stroke="#9a5a4a" stroke-width="1.6" fill="none" stroke-linecap="round"/>' +
      '<ellipse cx="40" cy="54" rx="3.5" ry="2" fill="#e08a7a" opacity=".25"/><ellipse cx="60" cy="54" rx="3.5" ry="2" fill="#e08a7a" opacity=".25"/>' +
      (P.beard ? '<path d="M34,50 Q34,70 50,72 Q66,70 66,50 Q62,62 56,62 Q50,58 44,62 Q38,62 34,50 Z" fill="' + P.hair + '"/><path d="M44,59 Q50,57 56,59" stroke="#b38a4a" stroke-width="1.6" fill="none"/>' : '') +
      (P.mustache ? '<path d="M42,58 Q46,55 50,57.5 Q54,55 58,58 Q54,57 50,59 Q46,57 42,58 Z" fill="' + P.hair + '"/>' : '') +
      (P.monocle ? '<circle cx="56.8" cy="47" r="4.4" fill="none" stroke="#c8a24a" stroke-width="1.2"/><path d="M61,49 Q64,58 60,66" stroke="#c8a24a" stroke-width=".8" fill="none"/>' : '') +
      hat + '<rect width="100" height="110" fill="url(#' + id + 'v)"/></g>' +
      '<rect x="4" y="4" width="92" height="102" rx="12" fill="none" stroke="' + f.trim + '" stroke-width="2.2" opacity=".85"/></svg>';
  }

  /* ---------- icone (24x24) ---------- */
  var ICON = {
    coin: '<circle cx="12" cy="12" r="9.5" fill="#d9a441"/><circle cx="12" cy="12" r="7" fill="none" stroke="#8a5e14" stroke-width="1.4"/><path d="M14.5,9 Q12,7 10,8.6 Q8.5,10 9.5,12.5 Q10.5,15.5 14.5,14.5" stroke="#6b4508" stroke-width="1.8" fill="none" stroke-linecap="round"/><circle cx="9" cy="8" r="1.5" fill="#fbe6a8" opacity=".8"/>',
    power: '<path d="M12,2 L20,6 L20,12 Q20,18 12,22 Q4,18 4,12 L4,6 Z" fill="#c2412f"/><path d="M13,6 L8,13 L11.5,13 L10.5,18 L16,10.5 L12.5,10.5 Z" fill="#ffd27a"/>',
    pop: '<path d="M12,20 Q3,14 3,8.5 Q3,4 7.5,4 Q10.5,4 12,7 Q13.5,4 16.5,4 Q21,4 21,8.5 Q21,14 12,20 Z" fill="#d95f7a"/><path d="M7,7 q1.5,-1.5 3,0" stroke="#ffd0da" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    card: '<rect x="5" y="3" width="14" height="18" rx="2" fill="#efe6d2" stroke="#6b5a3a" stroke-width="1.2"/><path d="M8.5,8 L15.5,16 M15.5,8 L8.5,16" stroke="#7a2a1c" stroke-width="1.8" stroke-linecap="round"/><circle cx="12" cy="12" r="2" fill="#7a2a1c"/>',
    star: '<path d="M12,2.5 L14.8,8.6 L21.4,9.3 L16.4,13.8 L17.9,20.4 L12,17 L6.1,20.4 L7.6,13.8 L2.6,9.3 L9.2,8.6 Z" fill="#f2c14e" stroke="#9a6a12" stroke-width="1"/>',
    f: '<path d="M12,21 L12,9" stroke="#8a6a22" stroke-width="1.6"/><path d="M12,9 q-4,-2 -4,-6 q4,2 4,6 M12,9 q4,-2 4,-6 q-4,2 -4,6 M12,13 q-5,-1 -6,-5 q5,1 6,5 M12,13 q5,-1 6,-5 q-5,1 -6,5 M12,17 q-5,-1 -6,-5 q5,1 6,5 M12,17 q5,-1 6,-5 q-5,1 -6,5" fill="#e3b64a" stroke="#a07a22" stroke-width=".8"/>',
    m: '<path d="M3,17 L21,17 L17.5,10 L6.5,10 Z" fill="#8e9399"/><path d="M6.5,10 L17.5,10 L15.5,7 L8.5,7 Z" fill="#d2d6db"/><path d="M17.5,10 L21,17 L18.5,17 L15.5,10 Z" fill="#62676d"/>',
    w: '<rect x="3" y="12" width="18" height="7" rx="3.5" fill="#8a5c34"/><ellipse cx="3.6" cy="15.5" rx="2.4" ry="3.5" fill="#e2c49a"/><rect x="6" y="5.5" width="15" height="6.5" rx="3.25" fill="#9a6a3e"/><ellipse cx="6.6" cy="8.75" rx="2.2" ry="3.25" fill="#e8cfa6"/>',
    o: '<path d="M12,3 Q18,11 18,15 Q18,21 12,21 Q6,21 6,15 Q6,11 12,3 Z" fill="#2e2e36"/><path d="M9.5,14 Q9.5,11 12,8" stroke="#8a8aa6" stroke-width="1.4" fill="none" stroke-linecap="round"/>',
    worker: '<path d="M7,21 L8,11 Q12,8.5 16,11 L17,21 Z" fill="currentColor"/><circle cx="12" cy="6" r="3.6" fill="#e3b08e"/><path d="M8,6 q4,-5 8,0 Z" fill="#4a3d32"/>',
    mech: '<rect x="5" y="9" width="14" height="8" rx="2" fill="currentColor"/><rect x="8" y="4" width="8" height="5" rx="1" fill="currentColor"/><rect x="9.5" y="5.5" width="5" height="2" fill="#ffd27a"/><path d="M7,17 L6,21 M17,17 L18,21 M10,17 L10,21 M14,17 L14,21" stroke="currentColor" stroke-width="2" stroke-linecap="round"/><path d="M19,12 L23,11" stroke="currentColor" stroke-width="2"/>',
    hero: '<circle cx="12" cy="5.5" r="3.4" fill="#e6b896"/><path d="M8,5 q4,-6 8,0 Z" fill="currentColor"/><path d="M7,21 L8.5,10 L15.5,10 L17,21 Z" fill="currentColor"/>',
    move: '<path d="M4,14 L13,14 L13,18 L21,12 L13,6 L13,10 L4,10 Z" fill="currentColor"/>',
    bolster: '<path d="M12,2.5 L20,6 L20,12 Q20,18 12,21.5 Q4,18 4,12 L4,6 Z" fill="none" stroke="currentColor" stroke-width="2"/><path d="M12,7 L12,17 M7,12 L17,12" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    trade: '<path d="M12,3 L12,20 M6,20 L18,20 M4,7 L20,7" stroke="currentColor" stroke-width="1.8" stroke-linecap="round"/><path d="M4,7 L1.5,13 Q4,15.5 6.5,13 Z M20,7 L17.5,13 Q20,15.5 22.5,13 Z" fill="currentColor"/>',
    produce: '<circle cx="12" cy="12" r="5" fill="none" stroke="currentColor" stroke-width="2.4"/>' + [0, 45, 90, 135, 180, 225, 270, 315].map(function (a) { return '<rect x="11" y="3" width="2" height="4" fill="currentColor" transform="rotate(' + a + ' 12 12)"/>'; }).join('') + '<circle cx="12" cy="12" r="1.8" fill="currentColor"/>',
    upgrade: '<path d="M12,3 L19,10 L15,10 L15,20 L9,20 L9,10 L5,10 Z" fill="currentColor"/>',
    deploy: '<rect x="6" y="9" width="12" height="7" rx="2" fill="currentColor"/><rect x="9" y="5" width="6" height="4" rx="1" fill="currentColor"/><path d="M8,16 L7,20 M16,16 L17,20" stroke="currentColor" stroke-width="2.2" stroke-linecap="round"/><path d="M2,20 L22,20" stroke="currentColor" stroke-width="1.4" opacity=".6"/>',
    build: '<path d="M4,20 L13,11" stroke="currentColor" stroke-width="2.6" stroke-linecap="round"/><path d="M11,6 L17,3 L21,7 L18,13 Z" fill="currentColor"/>',
    enlist: '<circle cx="12" cy="8" r="3.6" fill="currentColor"/><path d="M5,21 Q5,13 12,13 Q19,13 19,21 Z" fill="currentColor"/><path d="M7,6 L17,6 L16,4 L8,4 Z" fill="currentColor"/>',
    factory: '<path d="M2,21 L2,11 L8,14 L8,11 L14,14 L14,6 L16,6 L16,3 L19,3 L19,14 L22,14 L22,21 Z" fill="currentColor"/><rect x="5" y="16" width="2.5" height="2.5" fill="#ffd27a"/><rect x="10" y="16" width="2.5" height="2.5" fill="#ffd27a"/><rect x="15" y="16" width="2.5" height="2.5" fill="#ffd27a"/>',
    objective: '<path d="M6,3 L18,3 L18,21 L12,17 L6,21 Z" fill="currentColor"/><path d="M9,8 L15,8 M9,11 L15,11" stroke="#1d1a17" stroke-width="1.4"/>',
    battle: '<path d="M4,4 L14,14 M20,4 L10,14" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/><path d="M12,16 L8,20 M12,16 L16,20 M7,13 L4,16 M17,13 L20,16" stroke="currentColor" stroke-width="2.4" stroke-linecap="round"/>',
    river: '<path d="M2,8 Q7,4 12,8 T22,8 M2,15 Q7,11 12,15 T22,15" stroke="#4aa3d9" stroke-width="2.4" fill="none" stroke-linecap="round"/>',
    tunnel: '<path d="M3,20 L3,12 Q3,4 12,4 Q21,4 21,12 L21,20 Z" fill="#6f6a60"/><path d="M7,20 L7,13 Q7,8.5 12,8.5 Q17,8.5 17,13 L17,20 Z" fill="#14110e"/>',
    lake: '<ellipse cx="12" cy="13" rx="9" ry="6" fill="#4a90b8"/><path d="M7,12 q2,-1.5 4,0 M13,15 q2,-1.5 4,0" stroke="#cfe8f5" stroke-width="1.2" fill="none"/>',
    help: '<circle cx="12" cy="12" r="9.5" fill="none" stroke="currentColor" stroke-width="2"/><path d="M9.2,9.5 Q9.5,6.5 12.2,6.6 Q15,6.8 14.8,9.4 Q14.6,11 12.6,12 Q12,12.4 12,14" stroke="currentColor" stroke-width="2" fill="none" stroke-linecap="round"/><circle cx="12" cy="17.2" r="1.3" fill="currentColor"/>',
    mon: '<rect x="6" y="18" width="12" height="3" fill="currentColor"/><path d="M10,18 L10.5,6 L13.5,6 L14,18 Z" fill="currentColor"/><path d="M9.5,6 L12,2 L14.5,6 Z" fill="currentColor"/>',
    mil: '<path d="M9,21 L10,10 L14,10 L15,21 Z" fill="currentColor"/><path d="M12,9 L12,2 M12,9 L18,12 M12,9 L6,12 M12,9 L17,5" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>',
    min: '<path d="M3,21 L3,13 Q3,5 12,5 Q21,5 21,13 L21,21 Z" fill="currentColor"/><path d="M7.5,21 L7.5,14 Q7.5,10 12,10 Q16.5,10 16.5,14 L16.5,21 Z" fill="#1d1a17"/>',
    arm: '<path d="M4,21 L4,8 L6,8 L6,6 L9,6 L9,8 L15,8 L15,6 L18,6 L18,8 L20,8 L20,21 Z" fill="currentColor"/><path d="M10,21 L10,15 Q12,13 14,15 L14,21 Z" fill="#1d1a17"/>'
  };
  function icon(k, cls) { return '<svg class="ic ' + (cls || '') + '" viewBox="0 0 24 24" aria-hidden="true">' + (ICON[k] || '') + '</svg>'; }

  /* ---------- carte ---------- */
  function cardFace(v) {
    return '<svg class="ccard" viewBox="0 0 60 84" aria-hidden="true"><defs><linearGradient id="cc' + v + '" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="#f4ead2"/><stop offset="1" stop-color="#d8c79e"/></linearGradient></defs>' +
      '<rect x="1" y="1" width="58" height="82" rx="6" fill="url(#cc' + v + ')" stroke="#6b4a24" stroke-width="2"/><rect x="5" y="5" width="50" height="74" rx="4" fill="none" stroke="#9a7a4a" stroke-width="1"/>' +
      '<path d="M16,26 L44,58 M44,26 L16,58" stroke="#7a2a1c" stroke-width="4" stroke-linecap="round"/><path d="M12,22 l8,0 M40,22 l8,0" stroke="#5a4030" stroke-width="3"/>' +
      '<circle cx="30" cy="42" r="12" fill="#7a2a1c"/><text x="30" y="48.5" text-anchor="middle" font-size="18" font-weight="800" fill="#f8ead0" font-family="Georgia,serif">' + v + '</text>' +
      '<text x="9" y="16" font-size="11" font-weight="800" fill="#7a2a1c" font-family="Georgia,serif">' + v + '</text></svg>';
  }
  return { mech: mech, hero: heroFull, worker: worker, structure: structure, resToken: resToken, resStack: resStack, encounter: encounter, tunnel: tunnel, flag: flag,
    portrait: portrait, icon: icon, ICON: ICON, cardFace: cardFace, DEFS: DEFS, PUFF: PUFF, RESC: RESC };
})();
