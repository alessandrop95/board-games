/* ===== Asta lampo: mosse della partita (le finestre comuni sono in ui.js) ===== */
CFG.click = function (a, el) {
  var g = G(), me = myIdx();
  if (!g || me < 0) return;
  if (a === 'dec' || a === 'inc' || a === 'dec5' || a === 'inc5') { Game.nudge(a); return; }
  if (a === 'setv') { Game.setVal(+el.getAttribute('data-v')); return; }
  if (a === 'offer') {
    if (g.phase !== 'bid') return;
    Sound.play('mybid');
    quiet({ a: 'bid', b: Game.value() });
  }
};
