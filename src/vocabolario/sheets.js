/* ===== Vocabolario bugiardo: mosse della partita (le finestre comuni sono in ui.js) ===== */
CFG.click = function (a, el) {
  var g = G(), me = myIdx();
  if (!g || me < 0) return;
  if (a === 'send') {
    if (g.phase !== 'write') return;
    var t = Game.text().trim();
    if (E.norm(t).length < 3) { toast('Scrivi prima la tua definizione.'); Sound.play('no'); return; }
    Sound.play('sent');
    quiet({ a: 'def', t: t });
    return;
  }
  if (a === 'vote') { Sound.play('vote'); quiet({ a: 'vote', i: +el.getAttribute('data-i') }); return; }
  if (a === 'next') act({ a: 'next' });
};
