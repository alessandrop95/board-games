/* ===== Risparmio energetico (condiviso da tutti i giochi e dalla home) =====
   Le animazioni decorative che girano all'infinito (onde, nuvole, bagliori, pulsazioni) costringono il telefono a
   ridisegnare lo schermo di continuo e consumano batteria anche quando nessuno lo tocca. Dopo 20 secondi senza
   tocchi (e sempre con la pagina nascosta) si fermano dove sono; ripartono al primo tocco o quando arriva il tuo
   turno (Calm.wake()). Le animazioni brevi (carte che volano, testi che salgono) non vengono toccate.
   In più si tolgono i pezzi di animazione rimasti appesi alla pagina per errore: con il tempo rallenterebbero
   tutto, soprattutto su iPhone. */
var Calm = (function () {
  var IDLE = 20000, STALE = 12000, last = Date.now(), calm = false, seen = typeof WeakMap !== 'undefined' ? new WeakMap() : null;
  var LEFTOVERS = 'body > .flyer, body > .burst, body > .floatxt, body > .banner, body > .confetti, body > .ball, body > .popcard';
  function infinite() {
    if (!document.getAnimations) return [];
    return document.getAnimations().filter(function (a) {
      try { var t = a.effect && a.effect.getComputedTiming && a.effect.getComputedTiming(); return !!t && t.iterations === Infinity; } catch (e) { return false; }
    });
  }
  function pauseAll() { infinite().forEach(function (a) { try { if (a.playState === 'running') a.pause(); } catch (e) {} }); }
  function resumeAll() { infinite().forEach(function (a) { try { if (a.playState === 'paused') a.play(); } catch (e) {} }); }
  function setCalm(on) { calm = on; document.documentElement.classList.toggle('calm', on); if (on) pauseAll(); else resumeAll(); }
  function wake() { last = Date.now(); if (calm && !document.hidden) setCalm(false); }
  ['pointerdown', 'keydown', 'wheel', 'touchstart'].forEach(function (ev) { document.addEventListener(ev, wake, { capture: true, passive: true }); });
  document.addEventListener('visibilitychange', function () { if (document.hidden) setCalm(true); else wake(); });
  function sweep() {
    var now = Date.now();
    if (!calm && (document.hidden || now - last > IDLE)) setCalm(true);
    else if (calm) pauseAll();   // le animazioni nate nel frattempo (un giocatore ha mosso) si fermano anche loro
    if (seen) Array.prototype.forEach.call(document.querySelectorAll(LEFTOVERS), function (n) {
      var t = seen.get(n); if (!t) seen.set(n, now); else if (now - t > STALE) n.remove();
    });
  }
  setInterval(sweep, 4000);
  return { wake: wake, get calm() { return calm; }, get lastInput() { return last; } };
})();
