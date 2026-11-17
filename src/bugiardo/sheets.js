/* ===== Dadi del bugiardo: mosse della partita (le finestre comuni sono in ui.js) ===== */
CFG.click = function (a, el) {
  var g = G(), me = myIdx();
  if (!g || me < 0) return;
  if (a === 'face' || a === 'qminus' || a === 'qplus') { Game.choose(a, el); return; }
  if (a === 'bid') { var p = Game.picked(); if (p) act({ a: 'bid', q: p.q, f: p.f }); return; }
  if (a === 'doubt' || a === 'exact') { act({ a: a }); return; }
  if (a === 'next') act({ a: 'next' });
};
