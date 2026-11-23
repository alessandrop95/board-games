/* ===== Dadi e rischio: mosse della partita (le finestre comuni sono in ui.js) ===== */
CFG.click = function (a, el) {
  var g = G(), me = myIdx();
  if (!g || me < 0) return;
  if (a === 'die') { Game.toggle(+el.getAttribute('data-i')); return; }
  if (a === 'allnew') { Game.allNew(); return; }
  if (a === 'roll') { act({ a: 'roll' }); return; }
  if (a === 'go' || a === 'stop') { var d = Game.picked(); if (d.length) act({ a: 'pick', d: d, go: a === 'go' }); }
};
