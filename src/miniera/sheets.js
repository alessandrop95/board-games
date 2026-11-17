/* ===== La Miniera: mosse della partita (le finestre comuni sono in ui.js) ===== */
CFG.click = function (a) {
  var g = G(), me = myIdx();
  if (!g || me < 0) return;
  if (a === 'go' || a === 'back') {
    if (g.phase !== 'choose' || !g.players[me].in) return;
    Sound.play(a === 'go' ? 'pickc' : 'tentc');
    quiet({ a: a });
  }
  if (a === 'next') act({ a: 'next' });
};
